"""S2 Library, S3 Admin, W5 Cases.

The admin screen's job is to make "the platform does not know" a fact someone
owns. These tests pin the three gap registers it reports, because a screen that
quietly shrank one of them would be worse than no screen.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.canonical import UNCONFIGURED
from app.db.base import Base
from app.db.models import Case, Taxpayer
from app.engine.params_p01_p34 import EXTERNAL_PARAMS, PARAMETERS
from app.engine.registry import RULES
from app.main import create_app

PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"
STO_PUNE = {
    "X-Officer-Id": "sto.pune.4",
    "X-Officer-Role": "STO",
    "X-Officer-Divisions": "PUNE-II",
}
HEAD = {"X-Officer-Id": "c", "X-Officer-Role": "COMMISSIONER"}


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as setup:
        setup.add_all(
            [
                Taxpayer(
                    gstin=PUNE,
                    pan="AAPFU0939F",
                    legal_name="Umang Fabricators LLP",
                    state_code="27",
                    division="PUNE-II",
                ),
                Taxpayer(
                    gstin=NAGPUR,
                    pan="AACCM9910C",
                    legal_name="Mahalaxmi Traders Pvt Ltd",
                    state_code="27",
                    division="NAGPUR-I",
                ),
                Case(
                    id="case-pune",
                    gstin=PUNE,
                    fy="2025-26",
                    type="SCRUTINY",
                    status="IDENTIFIED",
                    officer_id="sto.pune.4",
                    finding_ids=["f-1"],
                    section_applied="74A",
                    order_deadline=date(2030, 6, 30),
                    days_to_limitation=45,
                ),
                Case(
                    id="case-nagpur",
                    gstin=NAGPUR,
                    fy="2025-26",
                    type="SCRUTINY",
                    status="IDENTIFIED",
                    officer_id="sto.nagpur.1",
                    finding_ids=[],
                    days_to_limitation=900,
                ),
            ]
        )
        setup.commit()

    def override() -> Iterator[Session]:
        session = factory()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_session] = override
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)
    engine.dispose()


class TestLibrary:
    def test_every_registered_rule_is_listed_with_its_legal_basis(self, client: TestClient) -> None:
        body = client.get("/api/v1/library/rules", headers=HEAD).json()
        assert body["count"] == len(RULES)
        # 57 v2 rules plus the X family. The count is derived from the
        # registry rather than restated, so adding a check cannot leave the
        # library screen silently listing fewer than the engine runs.
        assert body["count"] == len(RULES)
        for rule in body["items"]:
            assert rule["legal_basis"], rule["rule_id"]

    def test_all_34_parameters_quote_their_action_point(self, client: TestClient) -> None:
        body = client.get("/api/v1/library/parameters", headers=HEAD).json()
        assert body["count"] == len(PARAMETERS) == 34
        for param in body["items"]:
            assert param["action_point"].strip()
            spec = PARAMETERS[param["param_id"]]
            # Verbatim, not paraphrased: a paraphrase of an instruction is a
            # different instruction.
            assert param["action_point"] == spec.action_point

    @pytest.mark.golden
    def test_the_dark_parameters_are_marked_excluded(self, client: TestClient) -> None:
        body = client.get("/api/v1/library/parameters", headers=HEAD).json()
        excluded = {p["param_id"] for p in body["items"] if p["excluded_from_score"]}
        assert excluded == set(EXTERNAL_PARAMS)

    @pytest.mark.golden
    def test_every_provisional_threshold_is_flagged(self, client: TestClient) -> None:
        """An unsigned working value must never look like a settled one."""
        body = client.get("/api/v1/library/thresholds", headers=HEAD).json()
        assert body["count"] > 0
        for row in body["items"]:
            if row["notification_ref"] is None:
                assert row["provisional"] is True, f"{row['owner']}.{row['key']}"

    def test_a_threshold_is_carried_exactly_as_written(self, client: TestClient) -> None:
        """Coercing "20" to "20.00" would lose what the source actually said."""
        body = client.get("/api/v1/library/thresholds", headers=HEAD).json()
        row = next(
            item
            for item in body["items"]
            if item["owner"] == "OUT-01" and item["key"] == "pct_threshold"
        )
        assert row["value"] == "20"


class TestAdminGaps:
    @pytest.mark.golden
    def test_the_three_registers_match_their_sources(self, client: TestClient) -> None:
        body = client.get("/api/v1/admin/gaps", headers=HEAD).json()
        assert body["unconfigured_statutory"]["count"] == len(UNCONFIGURED)
        assert body["dark_parameters"]["count"] == len(EXTERNAL_PARAMS)
        assert body["provisional_thresholds"]["count"] > 0

    def test_each_register_says_what_it_means(self, client: TestClient) -> None:
        body = client.get("/api/v1/admin/gaps", headers=HEAD).json()
        for key in ("unconfigured_statutory", "provisional_thresholds", "dark_parameters"):
            assert body[key]["note"].strip()

    def test_every_dark_parameter_names_its_feed_or_says_it_cannot(
        self, client: TestClient
    ) -> None:
        body = client.get("/api/v1/admin/gaps", headers=HEAD).json()
        for row in body["dark_parameters"]["items"]:
            assert row["external_feed"] is not None or row["roadmap_ref"] is not None


class TestCases:
    @pytest.mark.golden
    def test_a_case_outside_the_caller_s_jurisdiction_is_not_listed(
        self, client: TestClient
    ) -> None:
        body = client.get("/api/v1/cases", headers=STO_PUNE).json()
        assert [row["case_id"] for row in body["items"]] == ["case-pune"]
        assert body["scope"] == "PUNE-II"

    def test_a_state_wide_role_sees_both(self, client: TestClient) -> None:
        body = client.get("/api/v1/cases", headers=HEAD).json()
        assert body["count"] == 2

    def test_the_limitation_clock_travels_with_the_case(self, client: TestClient) -> None:
        body = client.get("/api/v1/cases", headers=STO_PUNE).json()
        case = body["items"][0]
        assert case["days_to_limitation"] == 45
        assert case["order_deadline"] == "2030-06-30"
        assert case["section_applied"] == "74A"

    def test_reading_a_case_out_of_scope_returns_404(self, client: TestClient) -> None:
        assert client.get("/api/v1/cases/case-nagpur", headers=STO_PUNE).status_code == 404

    def test_reading_a_case_in_scope_works(self, client: TestClient) -> None:
        body = client.get("/api/v1/cases/case-pune", headers=STO_PUNE).json()
        assert body["legal_name"] == "Umang Fabricators LLP"
        assert body["finding_ids"] == ["f-1"]
