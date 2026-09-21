"""The workbench API: jurisdiction, slot locking, maker-checker.

Each of these is enforced at the API because the UI is not a security
boundary. The tests call the endpoints rather than the service layer for
exactly that reason.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.db.base import Base
from app.db.models import Case, EngineRun, Finding, ParamResult, RiskScore, Taxpayer
from app.main import create_app

PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"

STO_PUNE = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}
AC_PUNE = {
    "X-Officer-Id": "ac.pune",
    "X-Officer-Role": "ASST_COMMISSIONER",
    "X-Officer-Divisions": "PUNE-II",
}
AUDITOR = {"X-Officer-Id": "audit.hq", "X-Officer-Role": "AUDITOR"}


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
        _seed(setup)
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


def _seed(session: Session) -> None:
    session.add_all(
        [
            Taxpayer(
                gstin=PUNE,
                pan="AAPFU0939F",
                legal_name="Umang Fabricators LLP",
                trade_name="Umang Steels",
                state_code="27",
                division="PUNE-II",
                officer_id="sto.pune.4",
            ),
            Taxpayer(
                gstin=NAGPUR,
                pan="AACCM9910C",
                legal_name="Mahalaxmi Traders Pvt Ltd",
                state_code="27",
                division="NAGPUR-I",
                officer_id="sto.nagpur.1",
            ),
            EngineRun(
                id="run-1",
                snapshot_id="snap-1",
                as_of=date(2026, 9, 20),
                fy="2025-26",
                engine_version="0.1.0",
                params_version="unapproved-defaults",
                triggered_by="test",
                status="COMPLETE",
            ),
        ]
    )
    session.add(
        Finding(
            id="f-1",
            engine_run_id="run-1",
            gstin=PUNE,
            period="062025",
            fy="2025-26",
            rule_id="ITC-02",
            status="TRIGGERED",
            severity="HIGH",
            confidence="CERTAIN",
            dimension="CREDIT",
            delta_igst=Decimal("3842110.00"),
            interest=Decimal("120000.00"),
            calc_id="a" * 64,
            legal_basis="Rule 37A CGST Rules, 2017",
        )
    )
    session.add(
        ParamResult(
            id="p-1",
            engine_run_id="run-1",
            gstin=PUNE,
            fy="2025-26",
            param_id="P14",
            flag=3,
            status="EVALUATED",
            calc_id="d" * 64,
        )
    )
    session.add(
        ParamResult(
            id="p-2",
            engine_run_id="run-1",
            gstin=PUNE,
            fy="2025-26",
            param_id="P02",
            flag=None,
            status="NOT_EVALUATED",
            missing_inputs=["ICEGATE customs"],
            calc_id="e" * 64,
        )
    )
    session.add(
        RiskScore(
            id="s-1",
            engine_run_id="run-1",
            gstin=PUNE,
            fy="2025-26",
            p_score=Decimal("0.6470588235"),
            p_evaluated=24,
            p_band="HIGH",
            p_calc_id="c" * 64,
        )
    )
    session.add(
        Case(
            id="case-1",
            gstin=PUNE,
            fy="2025-26",
            type="SCRUTINY",
            status="IDENTIFIED",
            officer_id="sto.pune.4",
            finding_ids=["f-1"],
        )
    )


@pytest.fixture
def zero_scored(client: TestClient) -> None:
    """Rewrite the seeded score to an exact zero, as the control taxpayer has."""
    from app.api.deps import get_session

    override = client.app.dependency_overrides[get_session]  # type: ignore[attr-defined]
    session = next(override())
    row = session.get(RiskScore, "s-1")
    assert row is not None
    row.p_score = Decimal("0E-10")
    row.f_score = Decimal("0E-10")
    session.commit()


# ---------------------------------------------------------------------------
# jurisdiction
# ---------------------------------------------------------------------------


class TestJurisdiction:
    @pytest.mark.golden
    def test_an_out_of_scope_gstin_returns_404_not_403(self, client: TestClient) -> None:
        """403 would confirm the registration exists. 404 does not."""
        response = client.get(f"/api/v1/taxpayers/{NAGPUR}", headers=STO_PUNE)
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "NOT_FOUND"

    def test_a_nonexistent_gstin_is_indistinguishable(self, client: TestClient) -> None:
        real = client.get(f"/api/v1/taxpayers/{NAGPUR}", headers=STO_PUNE)
        invented = client.get("/api/v1/taxpayers/27AAAAA0000A1Z5", headers=STO_PUNE)
        assert real.status_code == invented.status_code == 404
        assert real.json() == invented.json()

    def test_a_state_wide_role_sees_everything(self, client: TestClient) -> None:
        assert client.get(f"/api/v1/taxpayers/{NAGPUR}", headers=AUDITOR).status_code == 200

    def test_there_is_no_anonymous_access(self, client: TestClient) -> None:
        response = client.get(f"/api/v1/taxpayers/{PUNE}")
        assert response.status_code == 401

    def test_an_unverified_bearer_token_is_refused_not_trusted(self, client: TestClient) -> None:
        response = client.get(
            f"/api/v1/taxpayers/{PUNE}", headers={"Authorization": "Bearer anything"}
        )
        assert response.status_code == 501
        assert response.json()["detail"]["code"] == "OIDC_NOT_CONFIGURED"


# ---------------------------------------------------------------------------
# W4 -- the taxpayer file
# ---------------------------------------------------------------------------


class TestTaxpayerFile:
    @pytest.mark.golden
    def test_all_34_parameters_are_returned_including_the_dark_ones(
        self, client: TestClient
    ) -> None:
        """A dark parameter is greyed and named, never defaulted to Flag 0."""
        body = client.get(f"/api/v1/taxpayers/{PUNE}", headers=STO_PUNE).json()
        ladder = body["flag_ladder"]
        assert len(ladder) == 34

        p02 = next(row for row in ladder if row["param_id"] == "P02")
        assert p02["flag"] is None
        assert p02["status"] == "NOT_EVALUATED"
        assert p02["excluded_from_score"] is True
        assert p02["external_feed"]

        p14 = next(row for row in ladder if row["param_id"] == "P14")
        assert p14["flag"] == 3
        assert p14["action_point"]

    def test_the_two_scores_are_reported_side_by_side(self, client: TestClient) -> None:
        scores = client.get(f"/api/v1/taxpayers/{PUNE}", headers=STO_PUNE).json()["scores"]
        assert scores["p_evaluated"] == 24
        assert scores["p_of"] == 34
        assert "never" in scores["note"]
        assert scores["f_score"] is None

    @pytest.mark.golden
    def test_a_score_of_zero_renders_as_zero_not_as_absent(
        self, client: TestClient, zero_scored: None
    ) -> None:
        """The control taxpayer scores zero, and zero is a result.

        Rendering it as "no score recorded" would hide the one taxpayer the
        platform most needs to be able to show.
        """
        scores = client.get(f"/api/v1/taxpayers/{PUNE}", headers=STO_PUNE).json()["scores"]
        assert scores["p_score"] == "0.0000000000"
        assert scores["f_score"] == "0.0000000000"

    def test_every_finding_carries_a_calc_id(self, client: TestClient) -> None:
        findings = client.get(f"/api/v1/taxpayers/{PUNE}", headers=STO_PUNE).json()["findings"]
        assert findings
        for finding in findings:
            assert len(finding["calc_id"]) == 64

    def test_money_crosses_as_a_string(self, client: TestClient) -> None:
        findings = client.get(f"/api/v1/taxpayers/{PUNE}", headers=STO_PUNE).json()["findings"]
        assert findings[0]["delta"]["igst"] == "3842110.00"


# ---------------------------------------------------------------------------
# notices
# ---------------------------------------------------------------------------


def _draft(client: TestClient, headers: dict[str, str] | None = None) -> dict[str, object]:
    response = client.post(
        "/api/v1/notices/draft",
        headers=headers or STO_PUNE,
        json={
            "case_id": "case-1",
            "form": "DRC-01A",
            "narrative": "Credit was availed from suppliers who did not discharge tax.",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


class TestNotices:
    @pytest.mark.golden
    def test_a_numeric_slot_cannot_be_edited(self, client: TestClient) -> None:
        """422 at the API, per the Phase 6 gate."""
        drafted = _draft(client)
        response = client.patch(f"/api/v1/notices/{drafted['notice_id']}/slots", headers=STO_PUNE)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "SLOT_LOCKED"

    @pytest.mark.golden
    def test_self_approval_is_rejected_at_the_api(self, client: TestClient) -> None:
        drafted = _draft(client, AC_PUNE)
        response = client.post(
            f"/api/v1/notices/{drafted['notice_id']}/approve",
            headers=AC_PUNE,
            json={"office_code": "PUNEII", "issued_on": "2026-09-20", "sequence": 1},
        )
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "MAKER_CHECKER"

    def test_an_sto_may_draft_but_not_approve(self, client: TestClient) -> None:
        drafted = _draft(client, STO_PUNE)
        response = client.post(
            f"/api/v1/notices/{drafted['notice_id']}/approve",
            headers=STO_PUNE,
            json={"office_code": "PUNEII", "issued_on": "2026-09-20", "sequence": 1},
        )
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "ROLE_MAY_NOT_APPROVE"

    @pytest.mark.golden
    def test_a_second_officer_approves_and_a_din_is_minted(self, client: TestClient) -> None:
        drafted = _draft(client, STO_PUNE)
        response = client.post(
            f"/api/v1/notices/{drafted['notice_id']}/approve",
            headers=AC_PUNE,
            json={"office_code": "PUNEII", "issued_on": "2026-09-20", "sequence": 1},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["status"] == "APPROVED"
        assert body["din"].startswith("CBIC202609PUNEII")
        assert len(body["pdf_hash"]) == 64

    def test_the_narrative_is_editable_while_the_figures_are_not(self, client: TestClient) -> None:
        drafted = _draft(client)
        before = drafted["pdf_hash"]
        response = client.patch(
            f"/api/v1/notices/{drafted['notice_id']}/narrative",
            headers=STO_PUNE,
            json={"narrative": "Revised wording after discussion with the taxpayer."},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["pdf_hash"] != before
        assert body["slots"]["demand.tax.igst"]["value"] == "3842110.00"

    def test_a_narrative_carrying_slot_syntax_is_refused(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/notices/draft",
            headers=STO_PUNE,
            json={
                "case_id": "case-1",
                "form": "DRC-01A",
                "narrative": "The shortfall is {{slot:demand.total}}.",
            },
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "SLOT_ERROR"

    def test_a_notice_in_another_jurisdiction_is_not_visible(self, client: TestClient) -> None:
        drafted = _draft(client)
        nagpur = {
            "X-Officer-Id": "sto.nagpur.1",
            "X-Officer-Role": "STO",
            "X-Officer-Divisions": "NAGPUR-I",
        }
        assert (
            client.get(f"/api/v1/notices/{drafted['notice_id']}", headers=nagpur).status_code == 404
        )

    def test_the_pdf_endpoint_is_honest_about_not_existing_yet(self, client: TestClient) -> None:
        drafted = _draft(client)
        response = client.get(f"/api/v1/notices/{drafted['notice_id']}/pdf", headers=STO_PUNE)
        assert response.status_code == 501
        assert response.json()["roadmap_ref"] == "RM-08"

    def test_the_template_catalogue_states_its_slots(self, client: TestClient) -> None:
        body = client.get("/api/v1/notices/templates").json()
        drc01a = next(
            item for item in body["items"] if item["form"] == "DRC-01A" and item["language"] == "en"
        )
        assert "demand.total" in drc01a["slots"]
        assert drc01a["reply_days"] == 30


class TestDemand:
    def test_the_demand_decomposes_to_its_findings(self, client: TestClient) -> None:
        body = client.get("/api/v1/cases/case-1/demand", headers=STO_PUNE).json()
        assert body["tax"]["igst"] == "3842110.00"
        assert body["interest"] == "120000.00"
        assert body["total"] == "3962110.00"
        assert len(body["calc_id"]) == 64
        assert body["lines"]

    def test_an_auditor_may_read_but_not_open_a_case(self, client: TestClient) -> None:
        assert client.get("/api/v1/cases/case-1/demand", headers=AUDITOR).status_code == 200
        response = client.post(
            "/api/v1/cases",
            headers=AUDITOR,
            json={"gstin": PUNE, "fy": "2025-26", "finding_ids": []},
        )
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "READ_ONLY"
