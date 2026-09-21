"""Phase 5 acceptance: the limitation clock and the demand build-up."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import (
    ActionForm,
    Confidence,
    FinancialYear,
    FindingStatus,
    Period,
    RiskDimension,
    Severity,
)
from app.cases.demand import compute_demand
from app.cases.limitation import (
    LimitationStatus,
    amnesty_applies,
    compute_limitation,
    section_for,
)
from app.engine.params import ParameterSet
from app.engine.registry import Finding
from app.engine.trace import CalcKind, Tracer
from app.money import TaxVector

PARAMS = ParameterSet()
AS_OF = date(2026, 9, 20)


def _trace(rule_id: str) -> object:
    tracer = Tracer(
        kind=CalcKind.RULE,
        subject_id=rule_id,
        snapshot_id="snap-1",
        gstin="27AAPFU0939F1ZV",
        fy="2025-26",
        legal_basis="Rule 37A CGST Rules, 2017",
    )
    tracer.note("rule", rule_id)
    return tracer.finish(result=None, formula_rendered=f"{rule_id} worked example")


def _finding(
    rule_id: str = "ITC-02",
    *,
    tax: str = "3842110",
    confidence: Confidence = Confidence.CERTAIN,
    status: FindingStatus = FindingStatus.TRIGGERED,
    interest: str = "0",
    penalty: str = "0",
    suppressed_by: str | None = None,
) -> Finding:
    return Finding(
        rule_id=rule_id,
        status=status,
        severity=Severity.HIGH,
        confidence=confidence,
        dimension=RiskDimension.CREDIT,
        title=rule_id,
        legal_basis="Rule 37A CGST Rules, 2017",
        gstin="27AAPFU0939F1ZV",
        period=Period(2025, 6),
        fy="2025-26",
        delta=TaxVector(igst=tax),
        interest=Decimal(interest),
        penalty=Decimal(penalty),
        suggested_form=ActionForm.DRC_01A,
        suppressed_by=suppressed_by,
        trace=_trace(rule_id),  # type: ignore[arg-type]
        missing_inputs=("x",) if status is FindingStatus.NOT_EVALUATED else (),
    )


# ---------------------------------------------------------------------------
# which section applies
# ---------------------------------------------------------------------------


class TestSection:
    @pytest.mark.golden
    @pytest.mark.parametrize(
        ("fy", "fraud", "section"),
        [
            (2023, False, "73"),
            (2023, True, "74"),
            (2024, False, "74A"),
            (2024, True, "74A"),
            (2025, False, "74A"),
        ],
    )
    def test_s74a_unified_the_regimes_from_fy_2024_25(
        self, fy: int, fraud: bool, section: str
    ) -> None:
        """From FY 2024-25 the section no longer depends on an allegation made
        before the reply is in."""
        assert section_for(FinancialYear(fy), fraud_alleged=fraud, params=PARAMS) == section


# ---------------------------------------------------------------------------
# the clock
# ---------------------------------------------------------------------------


class TestLimitation:
    @pytest.mark.golden
    def test_section_73_three_years_from_the_annual_return_date(self) -> None:
        """FY 2023-24: annual return due 31-Dec-2024, order by 31-Dec-2027,
        notice three months before that."""
        clock = compute_limitation(FinancialYear(2023), as_of=AS_OF, params=PARAMS)
        assert clock.section == "73"
        assert clock.reference_date == date(2024, 12, 31)
        assert clock.order_deadline == date(2027, 12, 31)
        assert clock.scn_deadline == date(2027, 9, 30)

    @pytest.mark.golden
    def test_section_74_five_years_with_six_months_for_the_notice(self) -> None:
        clock = compute_limitation(
            FinancialYear(2023), as_of=AS_OF, params=PARAMS, fraud_alleged=True
        )
        assert clock.section == "74"
        assert clock.order_deadline == date(2029, 12, 31)
        assert clock.scn_deadline == date(2029, 6, 30)

    @pytest.mark.golden
    def test_section_74a_is_forty_two_months_non_fraud(self) -> None:
        """FY 2024-25: annual return due 31-Dec-2025 plus 42 months = 30-Jun-2029,
        with the notice at least twelve months before."""
        clock = compute_limitation(FinancialYear(2024), as_of=AS_OF, params=PARAMS)
        assert clock.section == "74A"
        assert clock.reference_date == date(2025, 12, 31)
        assert clock.order_deadline == date(2029, 6, 30)
        assert clock.scn_deadline == date(2028, 6, 30)

    @pytest.mark.golden
    def test_section_74a_is_fifty_four_months_where_fraud_is_alleged(self) -> None:
        clock = compute_limitation(
            FinancialYear(2024), as_of=AS_OF, params=PARAMS, fraud_alleged=True
        )
        assert clock.section == "74A"
        assert clock.order_deadline == date(2030, 6, 30)
        assert clock.scn_deadline == date(2029, 6, 30)

    @pytest.mark.parametrize(
        ("as_of", "status"),
        [
            (date(2026, 1, 1), LimitationStatus.OK),
            (date(2027, 7, 20), LimitationStatus.WARNING),
            (date(2027, 11, 1), LimitationStatus.CRITICAL),
            (date(2028, 1, 1), LimitationStatus.EXPIRED),
        ],
    )
    def test_the_countdown_buckets(self, as_of: date, status: str) -> None:
        clock = compute_limitation(FinancialYear(2023), as_of=as_of, params=PARAMS)
        assert clock.status == status

    def test_the_clock_shows_its_working(self) -> None:
        """An officer must be able to check the date without trusting the engine."""
        clock = compute_limitation(FinancialYear(2024), as_of=AS_OF, params=PARAMS)
        working = " ".join(clock.working)
        assert "annual return due 2025-12-31" in working
        assert "Section 74A applies" in working
        assert "42 months" in working
        assert "12 months before the order" in working

    def test_the_voluntary_payment_window_is_carried(self) -> None:
        assert (
            compute_limitation(
                FinancialYear(2024), as_of=AS_OF, params=PARAMS
            ).voluntary_payment_days
            == 60
        )


class TestAmnesty:
    @pytest.mark.golden
    @pytest.mark.parametrize(
        ("fy", "eligible"),
        [(2017, True), (2018, True), (2019, True), (2020, False), (2021, False)],
    )
    def test_s128a_covers_fy_2017_18_to_2019_20(self, fy: int, eligible: bool) -> None:
        # FY 2016-17 is not tested: it predates GST, so there is no demand for
        # the amnesty to reach, and no parameter is effective that far back.
        assert amnesty_applies(FinancialYear(fy), PARAMS) is eligible


# ---------------------------------------------------------------------------
# the demand
# ---------------------------------------------------------------------------


class TestDemand:
    @pytest.mark.golden
    def test_the_demand_reconciles_to_the_findings_that_built_it(self) -> None:
        findings = [
            _finding("ITC-02", tax="3842110", interest="120000"),
            _finding("OUT-01", tax="2500001"),
        ]
        demand = compute_demand(
            findings,
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.tax.igst == Decimal("6342111.00")
        assert demand.interest == Decimal("120000")
        assert demand.total == Decimal("6462111.00")
        # The build-up decomposes exactly.
        assert sum(line.tax.igst for line in demand.lines) == demand.tax.igst
        assert sum(line.interest for line in demand.lines) == demand.interest

    @pytest.mark.golden
    def test_heads_are_never_summed_inside_the_build_up(self) -> None:
        findings = [
            Finding(
                rule_id="OUT-11",
                status=FindingStatus.TRIGGERED,
                severity=Severity.HIGH,
                confidence=Confidence.CERTAIN,
                dimension=RiskDimension.LIABILITY,
                title="OUT-11",
                legal_basis="ss.7 to 14 IGST Act, 2017",
                gstin="27AAPFU0939F1ZV",
                period=Period(2025, 6),
                delta=TaxVector(igst="100000", cgst="50000", sgst="50000"),
            )
        ]
        demand = compute_demand(
            findings,
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.tax.dict() == {
            "igst": "100000.00",
            "cgst": "50000.00",
            "sgst": "50000.00",
            "cess": "0.00",
        }

    @pytest.mark.golden
    def test_an_advisory_finding_is_excluded_and_says_why(self) -> None:
        """ADVISORY populates a worklist, never a notice.  It is listed as
        considered-and-excluded rather than silently dropped."""
        findings = [
            _finding("ITC-02", tax="3842110"),
            _finding("NET-02", tax="9999999", confidence=Confidence.ADVISORY),
        ]
        demand = compute_demand(
            findings,
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.tax.igst == Decimal("3842110.00")
        excluded = {row["rule_id"]: row for row in demand.excluded}
        assert "NET-02" in excluded
        assert "ADVISORY" in excluded["NET-02"]["reason"]
        assert "promote it expressly" in excluded["NET-02"]["reason"]

    def test_a_suppressed_finding_is_excluded_with_its_reason(self) -> None:
        findings = [
            _finding(
                "ITC-02",
                status=FindingStatus.SUPPRESSED,
                suppressed_by="s.128A amnesty: FY 2018-19",
            ),
        ]
        demand = compute_demand(
            findings,
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.tax.is_zero()
        assert demand.excluded[0]["reason"].startswith("s.128A amnesty")

    @pytest.mark.golden
    def test_an_amnesty_year_waives_interest_and_penalty_but_not_tax(self) -> None:
        findings = [_finding("ITC-02", tax="3842110", interest="120000", penalty="384211")]
        demand = compute_demand(
            findings,
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2018),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.amnesty is True
        assert demand.tax.igst == Decimal("3842110.00")
        assert demand.interest == Decimal("0.00")
        assert demand.penalty == Decimal("0.00")
        assert "waived" in " ".join(step.label + str(step.result) for step in demand.trace.steps)

    def test_the_demand_carries_its_limitation_clock(self) -> None:
        demand = compute_demand(
            [_finding()],
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.section == "74A"
        assert demand.limitation.order_deadline == date(2030, 6, 30)

    def test_the_demand_is_addressed_by_one_calc_id(self) -> None:
        demand = compute_demand(
            [_finding()],
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert len(demand.calc_id) == 64
        assert demand.trace.formula_rendered
        assert all(line.calc_id for line in demand.lines)

    def test_a_not_evaluated_finding_contributes_nothing(self) -> None:
        demand = compute_demand(
            [_finding(status=FindingStatus.NOT_EVALUATED)],
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        assert demand.tax.is_zero()
        assert demand.lines == ()

    def test_the_total_is_rounded_to_the_rupee_under_s170(self) -> None:
        findings = [_finding(tax="1000.49", interest="0.51")]
        demand = compute_demand(
            findings,
            gstin="27AAPFU0939F1ZV",
            fy=FinancialYear(2025),
            as_of=AS_OF,
            params=PARAMS,
            snapshot_id="snap-1",
        )
        # 1000.49 + 0.51 = 1001.00 exactly; rounding happens once, at the end.
        assert demand.total == Decimal("1001.00")
        assert demand.tax.igst == Decimal("1000.49"), "the head-wise figure keeps its paise"
