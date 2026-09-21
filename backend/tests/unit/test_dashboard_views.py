"""D2 to D9: the screens must refuse to report what they cannot compute.

The fact tables these screens read are partial by construction --
``fact_filing_period`` is built from periods the engine found UNFILED, and its
money columns come from GSTR-3B.  Every test here exists because the obvious
implementation produces a number that looks right and is wrong:

* a compliance rate of 0% computed over a denominator that counts only failures
* a turnover of Rs 0.00 for a period whose return was never supplied
* a drill that returns nobody, with no way to tell "no match" from "no data"
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
from app.db.facts import (
    FactEnforcement,
    FactFilingPeriod,
    FactOfficer,
    FactRiskSnapshot,
)
from app.db.models import EngineRun, FilingStatus, Finding, RiskScore, Taxpayer
from app.main import create_app

RUN = "run-1"
PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"
HEAD = {"X-Officer-Id": "c", "X-Officer-Role": "COMMISSIONER"}


def _client(*, with_filing_register: bool = False) -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as setup:
        _seed(setup, with_filing_register=with_filing_register)
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
    with TestClient(app) as client:
        yield client
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client() -> Iterator[TestClient]:
    """The realistic case: no filing register, no GSTR-3B."""
    yield from _client()


@pytest.fixture
def full_client() -> Iterator[TestClient]:
    """A run where the filing register was supplied."""
    yield from _client(with_filing_register=True)


def _seed(session: Session, *, with_filing_register: bool) -> None:
    session.add_all(
        [
            Taxpayer(
                gstin=PUNE,
                pan="AAPFU0939F",
                legal_name="Umang Fabricators LLP",
                state_code="27",
                division="PUNE-II",
                sector_code="24",
                officer_id="sto.pune.4",
            ),
            Taxpayer(
                gstin=NAGPUR,
                pan="AACCM9910C",
                legal_name="Mahalaxmi Traders Pvt Ltd",
                state_code="27",
                division="NAGPUR-I",
                sector_code="24",
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
    session.add(
        Finding(
            id="f-1",
            engine_run_id=RUN,
            gstin=PUNE,
            period="062025",
            fy="2025-26",
            rule_id="ITC-02",
            status="TRIGGERED",
            severity="HIGH",
            confidence="CERTAIN",
            dimension="CREDIT",
            delta_igst=Decimal("3842110.00"),
            calc_id="a" * 64,
        )
    )
    session.add(
        RiskScore(
            id="s-1",
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
        )
    )

    # Two periods, both UNFILED -- which is all this fact table ever holds.
    for period in ("062022", "072022"):
        session.add(
            FactFilingPeriod(
                id=f"ff-{period}",
                engine_run_id=RUN,
                jurisdiction="PUNE-II",
                period=period,
                return_type="GSTR3B",
                expected=1,
                filed=0,
                on_time=0,
                late=0,
                not_filed=1,
                nil=0,
                barred=1,
                near_bar=0,
                liability=Decimal("0.00"),
                cash_paid=Decimal("0.00"),
                itc_utilised=Decimal("0.00"),
                turnover=Decimal("0.00"),
            )
        )

    for kind, band, count in (("P", "LOW", 2), ("F", "GREEN", 2)):
        session.add(
            FactRiskSnapshot(
                id=f"fr-{kind}",
                engine_run_id=RUN,
                jurisdiction="PUNE-II",
                fy="2025-26",
                band_kind=kind,
                band=band,
                taxpayer_count=count,
                p_score_mean=Decimal("25.0000000000"),
                p_coverage_mean=Decimal("0.0882000000"),
                f_score_mean=Decimal("19.1000000000"),
                revenue_at_risk=Decimal("3842110.00"),
                revenue_at_risk_certain=Decimal("3842110.00"),
                revenue_at_risk_strong=Decimal("0.00"),
                revenue_at_risk_advisory=Decimal("0.00"),
            )
        )

    # The same month in two divisions: the series must not draw it twice.
    for index, division in enumerate(("PUNE-II", "NAGPUR-I")):
        session.add(
            FactEnforcement(
                id=f"fe-{index}",
                engine_run_id=RUN,
                jurisdiction=division,
                month="2026-03",
                flagged=1,
                selected=0,
                notices_issued=0,
                replies_received=0,
                appeals=0,
                sustained=0,
                demand_raised=Decimal("1000000.00"),
                demand_confirmed=Decimal("0.00"),
                demand_collected=Decimal("0.00"),
            )
        )

    session.add(
        FactOfficer(
            id="fo-1",
            engine_run_id=RUN,
            officer_id="sto.pune.4",
            jurisdiction="PUNE-II",
            month="2026-03",
            cases_open=3,
            cases_closed=1,
            notices_pending_approval=2,
            mean_age_days=Decimal("41.0000000000"),
            demand_raised=Decimal("3842110.00"),
            demand_collected=Decimal("0.00"),
            case_mix={"ITC": 2, "OUT": 1},
        )
    )

    if with_filing_register:
        session.add(
            FilingStatus(
                id="fs-1",
                gstin=PUNE,
                return_type="GSTR3B",
                period="062022",
                due_date=date(2022, 7, 20),
                status="NOT_FILED",
                barred_on=date(2025, 7, 20),
            )
        )


# ---------------------------------------------------------------------------
# D2 -- the failures-only denominator
# ---------------------------------------------------------------------------


class TestFiling:
    @pytest.mark.golden
    def test_no_compliance_rate_is_reported_without_the_filing_register(
        self, client: TestClient
    ) -> None:
        """filed/expected over a fact built from UNFILED periods is 0% and a lie."""
        body = client.get("/api/v1/dashboard/filing", headers=HEAD).json()
        assert body["compliance"]["status"] == "NOT_EVALUATED"
        assert body["compliance"]["missing_inputs"]
        assert body["totals"]["compliance_rate"] is None
        for period in body["periods"]:
            assert period["compliance_rate"] is None
            assert period["rates_evaluated"] is False

    def test_the_rate_is_reported_once_the_register_is_present(
        self, full_client: TestClient
    ) -> None:
        body = full_client.get("/api/v1/dashboard/filing", headers=HEAD).json()
        assert body["compliance"] is None
        assert body["totals"]["compliance_rate"] == "0.0000000000"
        assert all(period["rates_evaluated"] for period in body["periods"])

    def test_the_bar_leads_and_carries_its_drill(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/filing", headers=HEAD).json()
        assert body["bar"]["barred"] == 2
        assert "bar:barred" in body["bar"]["drill"]["barred"]
        assert "39(11)" in body["bar"]["note"]


# ---------------------------------------------------------------------------
# D3 -- a zero that was never measured
# ---------------------------------------------------------------------------


class TestRevenue:
    @pytest.mark.golden
    def test_no_money_is_reported_when_no_3b_was_ingested(self, client: TestClient) -> None:
        """Rs 0.00 for a return that was never supplied is the failure Law 5 names."""
        body = client.get("/api/v1/dashboard/revenue", headers=HEAD).json()
        assert body["series"]["status"] == "NOT_EVALUATED"
        assert "GSTR-3B" in body["series"]["missing_inputs"][0]
        for period in body["periods"]:
            assert period["turnover"] is None
            assert period["liability"] is None
            assert period["evaluated"] is False

    def test_the_rate_boundary_is_stated(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/revenue", headers=HEAD).json()
        assert body["boundary"]["on"] == "2025-09-22"


# ---------------------------------------------------------------------------
# D4 -- two distributions, never one
# ---------------------------------------------------------------------------


class TestRisk:
    @pytest.mark.golden
    def test_the_two_scores_are_returned_separately(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/risk", headers=HEAD).json()
        assert body["p_bands"] and body["f_bands"]
        assert "never added, averaged or ranked together" in body["note"]
        # No key anywhere fuses them.
        assert not any("combined" in key or "overall" in key for key in body)

    def test_revenue_at_risk_is_split_by_confidence(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/risk", headers=HEAD).json()
        tiers = {row["confidence"]: row for row in body["revenue_at_risk_by_confidence"]}
        assert set(tiers) == {"CERTAIN", "STRONG", "ADVISORY"}
        assert tiers["CERTAIN"]["value"] == "3842110.00"
        assert "promoting it expressly" in tiers["ADVISORY"]["note"]


# ---------------------------------------------------------------------------
# D6 -- a month is a month
# ---------------------------------------------------------------------------


class TestFunnel:
    @pytest.mark.golden
    def test_a_month_appears_once_however_many_divisions_reported_it(
        self, client: TestClient
    ) -> None:
        """Five bars labelled 2026-03 is not a time series."""
        body = client.get("/api/v1/dashboard/funnel", headers=HEAD).json()
        months = [row["month"] for row in body["months"]]
        assert months == sorted(set(months))
        assert len(months) == 1
        assert body["months"][0]["demand_raised"] == "2000000.00"

    def test_a_rate_over_an_empty_stage_is_null_not_zero(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/funnel", headers=HEAD).json()
        steps = {row["stage"]: row for row in body["steps"]}
        assert steps["flagged"]["share_of_previous"] is None
        assert steps["notices_issued"]["share_of_previous"] is None
        assert body["money"]["collection_rate"] is None

    def test_every_stage_carries_a_drill(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/funnel", headers=HEAD).json()
        assert all(step["drill"].startswith("/dashboard/drill?") for step in body["steps"])


# ---------------------------------------------------------------------------
# D7, D8, D9
# ---------------------------------------------------------------------------


class TestJurisdictionsOfficersSectors:
    def test_divisions_rank_on_revenue_not_on_a_mean_score(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/jurisdictions", headers=HEAD).json()
        values = [Decimal(row["revenue_at_risk"]) for row in body["items"]]
        assert values == sorted(values, reverse=True)
        assert "not on mean score" in body["note"]

    @pytest.mark.golden
    def test_no_division_shows_a_computed_rate_while_others_show_none(
        self, client: TestClient
    ) -> None:
        """One division at a computed 0% beside six unevaluated reads as blame."""
        body = client.get("/api/v1/dashboard/jurisdictions", headers=HEAD).json()
        rates = {row["compliance_rate"] for row in body["items"]}
        assert rates == {None}

    def test_a_taxpayer_is_counted_once_not_once_per_distribution(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/jurisdictions", headers=HEAD).json()
        pune = next(row for row in body["items"] if row["jurisdiction"] == "PUNE-II")
        assert pune["taxpayers"] == 2

    @pytest.mark.golden
    def test_officers_carry_their_case_mix(self, client: TestClient) -> None:
        """Throughput without the mix beside it is not interpretable."""
        body = client.get("/api/v1/dashboard/officers", headers=HEAD).json()
        officer = body["items"][0]
        assert officer["case_mix"] == {"ITC": 2, "OUT": 1}
        assert "not a ranking" in body["note"]

    def test_a_sector_below_the_cohort_floor_is_marked_unusable(self, client: TestClient) -> None:
        body = client.get("/api/v1/dashboard/sectors", headers=HEAD).json()
        sector = next(row for row in body["items"] if row["sector"] == "24")
        assert sector["taxpayers"] < body["min_cohort"]
        assert sector["cohort_usable"] is False


# ---------------------------------------------------------------------------
# the drill contract
# ---------------------------------------------------------------------------


class TestDrill:
    @pytest.mark.golden
    def test_an_empty_drill_says_which_kind_of_empty_it_is(self, client: TestClient) -> None:
        """ "Nobody matched" and "the data was never supplied" are different facts."""
        no_data = client.get(
            "/api/v1/dashboard/drill?metric=M-F07&bucket=bar:barred", headers=HEAD
        ).json()
        assert no_data["total"] == 0
        assert no_data["empty_because"]["reason"] == "DATASET_NOT_SUPPLIED"
        assert no_data["empty_because"]["missing_inputs"]

        no_match = client.get(
            "/api/v1/dashboard/drill?metric=M-K05&bucket=ADVISORY", headers=HEAD
        ).json()
        assert no_match["total"] == 0
        assert no_match["empty_because"]["reason"] == "NO_MATCH"

    def test_a_populated_drill_reports_no_emptiness(self, client: TestClient) -> None:
        body = client.get(
            "/api/v1/dashboard/drill?metric=M-K05&bucket=CERTAIN", headers=HEAD
        ).json()
        assert body["total"] == 1
        assert body["empty_because"] is None
        assert body["items"][0]["href"] == f"/workbench/taxpayer/{PUNE}"

    def test_the_new_buckets_all_resolve(self, full_client: TestClient) -> None:
        """Every bucket the D2-D9 screens emit must reach a resolver."""
        for metric, bucket in (
            ("M-F02", "filing:062022:not_filed"),
            ("M-F07", "bar:barred"),
            ("M-R02", "revenue:062025"),
            ("M-E01", "funnel:selected"),
            ("M-K06", "funnel:flagged"),
            ("M-E04", "funnel:month:2026-03"),
            ("M-K05", "jurisdiction:PUNE-II"),
            ("M-E10", "officer:sto.pune.4"),
            ("M-R08", "sector:24"),
        ):
            response = full_client.get(
                f"/api/v1/dashboard/drill?metric={metric}&bucket={bucket}", headers=HEAD
            )
            assert response.status_code == 200, f"{metric} {bucket}"
