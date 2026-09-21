"""W1 Worklist, W2 Audit Planner, W3 Registry.

The two tests that matter most here are about refusals rather than features:
an ADVISORY finding must not become enforceable by accident, and a
NOT_EVALUATED parameter must not satisfy a "flag at least N" filter by being
read as zero.
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
from app.db.models import AuditLog, EngineRun, Finding, ParamResult, RiskScore, Taxpayer
from app.main import create_app

RUN = "run-1"
PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"

STO = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}
AUDITOR = {"X-Officer-Id": "audit.hq", "X-Officer-Role": "AUDITOR"}
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
        test_client.session_factory = factory  # type: ignore[attr-defined]
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
                state_code="27",
                division="PUNE-II",
                officer_id="sto.pune.4",
                aato=Decimal("220000000.00"),
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
                id=RUN,
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

    findings = [
        ("f-critical", "ITC-02", "CRITICAL", "CERTAIN", Decimal("3842110.00")),
        ("f-high", "OUT-01", "HIGH", "STRONG", Decimal("198000.00")),
        ("f-advisory", "ITC-16", "CRITICAL", "ADVISORY", Decimal("0.00")),
    ]
    for index, (fid, rule, severity, confidence, delta) in enumerate(findings):
        session.add(
            Finding(
                id=fid,
                engine_run_id=RUN,
                gstin=PUNE,
                period="062025",
                fy="2025-26",
                rule_id=rule,
                status="TRIGGERED",
                severity=severity,
                confidence=confidence,
                dimension="CREDIT",
                delta_igst=delta,
                calc_id=str(index) * 64,
            )
        )
    # Suppressed: visible on the file, absent from the queue.
    session.add(
        Finding(
            id="f-suppressed",
            engine_run_id=RUN,
            gstin=PUNE,
            fy="2025-26",
            rule_id="PAY-02",
            status="TRIGGERED",
            severity="HIGH",
            confidence="CERTAIN",
            dimension="PAYMENT",
            calc_id="9" * 64,
            suppressed_by="s.128A amnesty",
        )
    )
    # Another division's finding, for the scope test.
    session.add(
        Finding(
            id="f-nagpur",
            engine_run_id=RUN,
            gstin=NAGPUR,
            fy="2025-26",
            rule_id="ITC-02",
            status="TRIGGERED",
            severity="CRITICAL",
            confidence="CERTAIN",
            dimension="CREDIT",
            calc_id="8" * 64,
        )
    )

    session.add_all(
        [
            RiskScore(
                id="s-pune",
                engine_run_id=RUN,
                gstin=PUNE,
                fy="2025-26",
                p_score=Decimal("25.0000000000"),
                p_coverage=Decimal("0.0882000000"),
                p_evaluated=3,
                p_band="LOW",
                f_score=Decimal("19.1000000000"),
                f_band="GREEN",
                p_calc_id="c" * 64,
            ),
            RiskScore(
                id="s-nagpur",
                engine_run_id=RUN,
                gstin=NAGPUR,
                fy="2025-26",
                p_score=Decimal("60.0000000000"),
                p_coverage=Decimal("0.8800000000"),
                p_evaluated=30,
                p_band="HIGH",
                p_calc_id="d" * 64,
            ),
        ]
    )

    # P14 evaluated at flag 3 for Pune; NOT_EVALUATED for Nagpur.
    session.add(
        ParamResult(
            id="p-pune",
            engine_run_id=RUN,
            gstin=PUNE,
            fy="2025-26",
            param_id="P14",
            flag=3,
            status="EVALUATED",
            calc_id="e" * 64,
        )
    )
    session.add(
        ParamResult(
            id="p-nagpur",
            engine_run_id=RUN,
            gstin=NAGPUR,
            fy="2025-26",
            param_id="P14",
            flag=None,
            status="NOT_EVALUATED",
            missing_inputs=["GSTR-2B"],
            calc_id="f" * 64,
        )
    )


# ---------------------------------------------------------------------------
# W3 -- the registry
# ---------------------------------------------------------------------------


class TestRegistry:
    def test_it_is_scoped_to_the_caller(self, client: TestClient) -> None:
        body = client.get("/api/v1/registry", headers=STO).json()
        assert [row["gstin"] for row in body["items"]] == [PUNE]
        assert body["total"] == 1

    def test_paging_and_total_are_server_side(self, client: TestClient) -> None:
        body = client.get("/api/v1/registry?page=1&size=1", headers=HEAD).json()
        assert body["total"] == 2
        assert len(body["items"]) == 1

    @pytest.mark.golden
    def test_an_unscored_taxpayer_sorts_last_in_either_direction(self, client: TestClient) -> None:
        """Unscored is not zero and must not head the list by accident."""
        with client.session_factory() as session:  # type: ignore[attr-defined]
            session.add(
                Taxpayer(
                    gstin="27AAKCS0123U1ZT",
                    pan="AAKCS0123U",
                    legal_name="Unscored Trading Co",
                    state_code="27",
                    division="PUNE-II",
                )
            )
            session.commit()

        ascending = client.get("/api/v1/registry?sort=p_score&descending=false", headers=HEAD)
        descending = client.get("/api/v1/registry?sort=p_score&descending=true", headers=HEAD)
        for response in (ascending, descending):
            names = [row["legal_name"] for row in response.json()["items"]]
            assert names[-1] == "Unscored Trading Co", names

    def test_filters_narrow_the_result(self, client: TestClient) -> None:
        assert client.get("/api/v1/registry?p_band=HIGH", headers=HEAD).json()["total"] == 1
        assert client.get("/api/v1/registry?division=NAGPUR-I", headers=HEAD).json()["total"] == 1
        assert client.get("/api/v1/registry?search=Umang", headers=HEAD).json()["total"] == 1

    def test_an_unknown_sort_is_refused_not_ignored(self, client: TestClient) -> None:
        response = client.get("/api/v1/registry?sort=whatever", headers=HEAD)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "UNKNOWN_SORT"

    def test_facets_list_only_values_that_occur(self, client: TestClient) -> None:
        body = client.get("/api/v1/registry/facets", headers=HEAD).json()
        assert set(body["divisions"]) == {"PUNE-II", "NAGPUR-I"}
        assert "HIGH" in body["p_bands"]


# ---------------------------------------------------------------------------
# W1 -- the worklist
# ---------------------------------------------------------------------------


class TestWorklist:
    @pytest.mark.golden
    def test_the_worst_thing_is_first(self, client: TestClient) -> None:
        body = client.get("/api/v1/worklist", headers=STO).json()
        order = [row["finding_id"] for row in body["items"]]
        assert order[0] == "f-critical"
        # f-advisory is CRITICAL but ADVISORY; f-high is only HIGH but can be
        # acted on today. Actionability outranks severity, so the advisory
        # item sits below it however severe it is.
        assert order.index("f-high") < order.index("f-advisory")

    @pytest.mark.golden
    def test_a_suppressed_finding_is_not_queued(self, client: TestClient) -> None:
        body = client.get("/api/v1/worklist", headers=STO).json()
        assert "f-suppressed" not in [row["finding_id"] for row in body["items"]]

    @pytest.mark.golden
    def test_an_advisory_finding_says_it_may_not_populate_a_notice(
        self, client: TestClient
    ) -> None:
        body = client.get("/api/v1/worklist", headers=STO).json()
        advisory = next(row for row in body["items"] if row["finding_id"] == "f-advisory")
        assert advisory["may_populate_notice"] is False
        certain = next(row for row in body["items"] if row["finding_id"] == "f-critical")
        assert certain["may_populate_notice"] is True

    def test_advisory_can_be_excluded(self, client: TestClient) -> None:
        body = client.get("/api/v1/worklist?include_advisory=false", headers=STO).json()
        assert "f-advisory" not in [row["finding_id"] for row in body["items"]]

    def test_another_division_is_not_in_the_queue(self, client: TestClient) -> None:
        body = client.get("/api/v1/worklist", headers=STO).json()
        assert all(row["gstin"] == PUNE for row in body["items"])

    def test_a_disposition_requires_a_reason(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-critical/disposition",
            headers=STO,
            json={"disposition": "REJECTED", "note": ""},
        )
        assert response.status_code == 422

    @pytest.mark.golden
    def test_a_disposition_is_recorded_with_its_author_and_reason(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-critical/disposition",
            headers=STO,
            json={"disposition": "rejected", "note": "Supplier filed in the next period."},
        )
        assert response.status_code == 200
        assert response.json()["disposition"] == "REJECTED"

        with client.session_factory() as session:  # type: ignore[attr-defined]
            entry = (
                session.execute(select(AuditLog).where(AuditLog.action == "FINDING_DISPOSITION"))
                .scalars()
                .one()
            )
            assert entry.actor == "sto.pune.4"
            assert entry.detail["disposition"] == "REJECTED"
            assert verify_chain(session).ok is True

    def test_an_unknown_disposition_is_refused(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-critical/disposition",
            headers=STO,
            json={"disposition": "MAYBE", "note": "not a real disposition"},
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "UNKNOWN_DISPOSITION"

    def test_a_read_only_role_may_not_dispose(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-critical/disposition",
            headers=AUDITOR,
            json={"disposition": "ACCEPTED", "note": "reads only"},
        )
        assert response.status_code == 403


class TestPromotion:
    @pytest.mark.golden
    def test_promoting_an_advisory_finding_is_audited(self, client: TestClient) -> None:
        """The one act that changes what a finding is allowed to become."""
        response = client.post(
            "/api/v1/worklist/f-advisory/promote",
            headers=STO,
            json={
                "disposition": "PROMOTED",
                "note": "Cycle confirmed against the supplier's own 3B.",
            },
        )
        assert response.status_code == 200
        assert response.json()["confidence"] == "PROBABLE"

        with client.session_factory() as session:  # type: ignore[attr-defined]
            entry = (
                session.execute(select(AuditLog).where(AuditLog.action == "FINDING_PROMOTED"))
                .scalars()
                .one()
            )
            assert entry.detail["effect"] == "may now populate a notice"
            assert entry.detail["reason"].startswith("Cycle confirmed")
            assert verify_chain(session).ok is True

    @pytest.mark.golden
    def test_a_non_advisory_finding_needs_no_promotion(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-critical/promote",
            headers=STO,
            json={"disposition": "PROMOTED", "note": "already certain"},
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "NOT_ADVISORY"

    def test_promotion_requires_a_reason(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-advisory/promote",
            headers=STO,
            json={"disposition": "PROMOTED", "note": "ok"},
        )
        assert response.status_code == 422

    def test_a_read_only_role_may_not_promote(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/worklist/f-advisory/promote",
            headers=AUDITOR,
            json={"disposition": "PROMOTED", "note": "reads only, should fail"},
        )
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# W2 -- the audit planner
# ---------------------------------------------------------------------------


class TestPlanner:
    @pytest.mark.golden
    def test_a_not_evaluated_parameter_never_satisfies_a_flag_filter(
        self, client: TestClient
    ) -> None:
        """Nagpur's P14 is NOT_EVALUATED. Reading it as flag 0 -- or worse, as
        matching "flag at least 1" -- is the quiet failure that makes a risk
        score a lie."""
        body = client.get("/api/v1/planner/candidates?param_id=P14&min_flag=1", headers=HEAD)
        gstins = [row["gstin"] for row in body.json()["items"]]
        assert gstins == [PUNE]

    def test_coverage_travels_with_every_candidate(self, client: TestClient) -> None:
        body = client.get("/api/v1/planner/candidates", headers=HEAD).json()
        for row in body["items"]:
            assert row["p_coverage"] is not None
            assert row["p_evaluated"] is not None
            assert row["p_of"] == 34
        assert "less complete one" in body["note"]

    def test_a_coverage_floor_filters(self, client: TestClient) -> None:
        body = client.get("/api/v1/planner/candidates?min_coverage=0.5", headers=HEAD).json()
        assert [row["gstin"] for row in body["items"]] == [NAGPUR]

    def test_an_unknown_parameter_is_refused(self, client: TestClient) -> None:
        response = client.get("/api/v1/planner/candidates?param_id=P99", headers=HEAD)
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "UNKNOWN_PARAMETER"

    @pytest.mark.golden
    def test_a_selection_without_a_rationale_is_refused(self, client: TestClient) -> None:
        """P30 is computed next cycle from exactly these records. A selection
        with no stated reason makes that parameter permanently unevaluable."""
        response = client.post(
            "/api/v1/planner/selections",
            headers=STO,
            json={"gstins": [PUNE], "fy": "2025-26", "rationale": "because"},
        )
        assert response.status_code == 422

    @pytest.mark.golden
    def test_a_selection_is_recorded_with_its_rationale(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/planner/selections",
            headers=STO,
            json={
                "gstins": [PUNE],
                "fy": "2025-26",
                "basis": "P14_FLAG_3",
                "rationale": "P14 at flag 3 with ITC-02 triggered in the same period.",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["count"] == 1

        listed = client.get("/api/v1/planner/selections", headers=STO).json()
        assert listed["count"] == 1
        assert listed["items"][0]["basis"] == "P14_FLAG_3"
        assert listed["items"][0]["rationale"].startswith("P14 at flag 3")

        with client.session_factory() as session:  # type: ignore[attr-defined]
            assert verify_chain(session).ok is True

    def test_selecting_out_of_scope_is_404(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/planner/selections",
            headers=STO,
            json={
                "gstins": [NAGPUR],
                "fy": "2025-26",
                "rationale": "Should not be selectable from Pune-II.",
            },
        )
        assert response.status_code == 404
