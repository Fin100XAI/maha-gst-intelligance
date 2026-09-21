"""W8 - one return, one period, worked on its own.

The unit an officer holds is a filing. The platform had a screen for the year
and a screen for the portfolio and nothing for the thing on the desk, so there
was nowhere to stand and ask "what about July?" - which is the question,
because a notice is issued for a period.

Three properties are load-bearing here and each is asserted rather than
assumed: the list is ordered so it can be worked from the top, a filing's
"could not be tested" count is kept apart from its "nothing found" count, and
a review can record that there was nothing to do.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.audit.chain import verify_chain
from app.db.base import Base
from app.db.models import AuditLog, EngineRun, FilingReview, Finding, Taxpayer
from app.main import create_app

RUN = "run-filings"
PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"

STO = {"X-Officer-Id": "a.patil", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}
AUDITOR = {"X-Officer-Id": "audit.1", "X-Officer-Role": "AUDITOR"}

#: (period, rule, status, severity, igst) -- the fixture, stated plainly.
FINDINGS = (
    ("072025", "OUT-01", "TRIGGERED", "HIGH", "200000.00"),
    ("072025", "PAY-02", "CLEAR", "LOW", "0.00"),
    ("072025", "ITC-07", "NOT_EVALUATED", "MEDIUM", "0.00"),
    ("082025", "OUT-01", "TRIGGERED", "CRITICAL", "900000.00"),
    ("092025", "OUT-01", "CLEAR", "LOW", "0.00"),
)


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

    with factory() as session:
        session.add(
            EngineRun(
                id=RUN,
                snapshot_id="snap-1",
                as_of=date(2026, 3, 31),
                fy="2025-26",
                engine_version="0.1.0",
                params_version="defaults",
                triggered_by="test",
                status="COMPLETE",
                gstin_count=2,
            )
        )
        for gstin, name, division in (
            (PUNE, "Pune Traders LLP", "PUNE-II"),
            (NAGPUR, "Nagpur Mills Limited", "NAGPUR-I"),
        ):
            session.add(
                Taxpayer(
                    gstin=gstin,
                    pan=gstin[2:12],
                    state_code=gstin[:2],
                    legal_name=name,
                    trade_name=name,
                    division=division,
                    status="ACTIVE",
                )
            )
        for index, (period, rule, status, severity, igst) in enumerate(FINDINGS):
            session.add(
                Finding(
                    id=f"f-{index}",
                    engine_run_id=RUN,
                    gstin=PUNE,
                    period=period,
                    fy="2025-26",
                    rule_id=rule,
                    status=status,
                    severity=severity,
                    confidence="CERTAIN",
                    dimension="OUTWARD",
                    delta_igst=Decimal(igst),
                    calc_id=f"calc{index:060d}",
                )
            )
        # One in another division, which must never appear for a Pune officer.
        session.add(
            Finding(
                id="f-other",
                engine_run_id=RUN,
                gstin=NAGPUR,
                period="072025",
                fy="2025-26",
                rule_id="OUT-01",
                status="TRIGGERED",
                severity="CRITICAL",
                confidence="CERTAIN",
                dimension="OUTWARD",
                delta_igst=Decimal("5000000.00"),
                calc_id="calcother" + "0" * 55,
            )
        )
        session.commit()

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
        test_client.factory = factory  # type: ignore[attr-defined]
        yield test_client
    Base.metadata.drop_all(engine)
    engine.dispose()


class TestTheList:
    def test_one_row_per_business_per_period(self, client: TestClient) -> None:
        body = client.get("/api/v1/filings", headers=STO).json()
        keys = {(row["gstin"], row["period"]) for row in body["items"]}
        assert keys == {(PUNE, "072025"), (PUNE, "082025"), (PUNE, "092025")}

    @pytest.mark.golden
    def test_the_worst_is_first_so_the_list_is_worked_from_the_top(
        self, client: TestClient
    ) -> None:
        """An officer should not have to sort a queue before starting on it."""
        body = client.get("/api/v1/filings", headers=STO).json()
        assert [row["period"] for row in body["items"]] == ["082025", "072025", "092025"]
        assert body["items"][0]["worst_severity"] == "CRITICAL"

    @pytest.mark.golden
    def test_could_not_be_tested_is_counted_apart_from_nothing_found(
        self, client: TestClient
    ) -> None:
        """The distinction the whole platform rests on, at filing level."""
        body = client.get("/api/v1/filings", headers=STO).json()
        july = next(row for row in body["items"] if row["period"] == "072025")
        assert july["triggered"] == 1
        assert july["not_evaluated"] == 1
        # Three findings in July, one of which could not be evaluated: the
        # filing is neither "clean" nor fully examined, and says both.
        assert july["findings"] == 3

    def test_another_division_is_invisible(self, client: TestClient) -> None:
        body = client.get("/api/v1/filings", headers=STO).json()
        assert all(row["gstin"] == PUNE for row in body["items"])
        assert all("50,00,000" not in row["at_stake"] for row in body["items"])

    def test_the_clean_filter_does_not_mean_examined(self, client: TestClient) -> None:
        """A filing with untested rules is not triggered, and is not clear."""
        body = client.get("/api/v1/filings?only=clean", headers=STO).json()
        periods = {row["period"] for row in body["items"]}
        assert periods == {"092025"}

    def test_the_triggered_filter_leaves_only_what_fired(self, client: TestClient) -> None:
        body = client.get("/api/v1/filings?only=triggered", headers=STO).json()
        assert {row["period"] for row in body["items"]} == {"072025", "082025"}

    def test_at_stake_is_a_string_on_the_wire(self, client: TestClient) -> None:
        body = client.get("/api/v1/filings", headers=STO).json()
        for row in body["items"]:
            assert isinstance(row["at_stake"], str)


class TestTheDetail:
    @pytest.mark.golden
    def test_the_three_outcomes_are_separate_lists(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/filings/{PUNE}/072025", headers=STO).json()
        assert [row["rule_id"] for row in body["triggered"]] == ["OUT-01"]
        assert [row["rule_id"] for row in body["cleared"]] == ["PAY-02"]
        assert [row["rule_id"] for row in body["not_evaluated"]] == ["ITC-07"]

    def test_the_summary_agrees_with_the_lists(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/filings/{PUNE}/072025", headers=STO).json()
        summary = body["summary"]
        assert summary["triggered"] == len(body["triggered"])
        assert summary["cleared"] == len(body["cleared"])
        assert summary["not_evaluated"] == len(body["not_evaluated"])
        # Rules "run" excludes the ones that could not be: a rule that did not
        # run was not a test that passed.
        assert summary["rules_run"] == summary["triggered"] + summary["cleared"]

    def test_every_finding_carries_its_calc_id(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/filings/{PUNE}/072025", headers=STO).json()
        for row in [*body["triggered"], *body["cleared"]]:
            assert row["calc_id"]

    def test_the_heads_are_never_pre_summed(self, client: TestClient) -> None:
        body = client.get(f"/api/v1/filings/{PUNE}/072025", headers=STO).json()
        finding = body["triggered"][0]
        assert set(finding["heads"]) == {"igst", "cgst", "sgst", "cess"}
        assert finding["heads"]["igst"] == "200000.00"

    def test_a_period_in_any_readable_form_resolves(self, client: TestClient) -> None:
        for spelling in ("072025", "07-2025", "2025-07"):
            response = client.get(f"/api/v1/filings/{PUNE}/{spelling}", headers=STO)
            assert response.status_code == 200, spelling
            assert response.json()["period"] == "072025"

    def test_nonsense_for_a_period_is_422_not_a_silent_empty_screen(
        self, client: TestClient
    ) -> None:
        response = client.get(f"/api/v1/filings/{PUNE}/banana", headers=STO)
        assert response.status_code == 422

    def test_a_filing_outside_the_jurisdiction_is_404_not_403(self, client: TestClient) -> None:
        """403 would confirm the registration exists. It must not."""
        response = client.get(f"/api/v1/filings/{NAGPUR}/072025", headers=STO)
        assert response.status_code == 404


class TestTheReview:
    @pytest.mark.golden
    def test_nothing_to_do_is_a_first_class_outcome(self, client: TestClient) -> None:
        """The question an officer is actually asked later is why they did NOT act."""
        response = client.post(
            f"/api/v1/filings/{PUNE}/092025/review",
            headers=STO,
            json={
                "comment": "Compared the 3B with the GSTR-1 for the period. They agree.",
                "disposition": "NO_ACTION",
            },
        )
        assert response.status_code == 201
        assert response.json()["disposition"] == "NO_ACTION"

        body = client.get(f"/api/v1/filings/{PUNE}/092025", headers=STO).json()
        assert len(body["reviews"]) == 1
        assert body["reviews"][0]["officer_id"] == "a.patil"

    def test_a_review_lands_in_the_audit_chain(self, client: TestClient) -> None:
        client.post(
            f"/api/v1/filings/{PUNE}/072025/review",
            headers=STO,
            json={"comment": "Raising ASMT-10 for the shortfall.", "disposition": "ESCALATE"},
        )
        with client.factory() as session:  # type: ignore[attr-defined]
            entry = (
                session.execute(select(AuditLog).where(AuditLog.action == "FILING_REVIEWED"))
                .scalars()
                .one()
            )
            assert entry.actor == "a.patil"
            assert entry.detail["period"] == "072025"
            assert verify_chain(session).ok is True

    def test_the_review_records_the_run_it_was_written_against(self, client: TestClient) -> None:
        """A note written about one set of results must not attach to a later one."""
        client.post(
            f"/api/v1/filings/{PUNE}/072025/review",
            headers=STO,
            json={"comment": "Checked and confirmed.", "disposition": "WATCH"},
        )
        with client.factory() as session:  # type: ignore[attr-defined]
            review = session.execute(select(FilingReview)).scalars().one()
            assert review.engine_run_id == RUN

    def test_an_invented_disposition_is_refused(self, client: TestClient) -> None:
        response = client.post(
            f"/api/v1/filings/{PUNE}/072025/review",
            headers=STO,
            json={"comment": "Something happened here.", "disposition": "PROBABLY_FINE"},
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "BAD_DISPOSITION"

    def test_a_read_only_role_may_not_record_one(self, client: TestClient) -> None:
        response = client.post(
            f"/api/v1/filings/{PUNE}/072025/review",
            headers=AUDITOR,
            json={"comment": "An auditor looking, not deciding.", "disposition": "WATCH"},
        )
        assert response.status_code == 403

    def test_a_review_shows_on_the_list(self, client: TestClient) -> None:
        client.post(
            f"/api/v1/filings/{PUNE}/082025/review",
            headers=STO,
            json={"comment": "Escalating; the shortfall is large.", "disposition": "ESCALATE"},
        )
        body = client.get("/api/v1/filings?only=reviewed", headers=STO).json()
        assert [row["period"] for row in body["items"]] == ["082025"]
        assert body["items"][0]["disposition"] == "ESCALATE"
