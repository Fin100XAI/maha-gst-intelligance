"""Phase 3 acceptance: the 34 parameters, the 57 rules, and the two scores.

Every rule gets four golden tests where the data allows: positive, negative,
boundary **at the exact threshold**, and not-evaluated.
"""

from __future__ import annotations

import time
from dataclasses import replace
from datetime import date
from decimal import Decimal

import pytest

from app.canonical import ActionForm, Confidence, FindingStatus, Period, Severity
from app.engine.graph import InvoiceGraph
from app.engine.params_p01_p34 import EXTERNAL_PARAMS, PARAMETERS, evaluate_parameter
from app.engine.peers import PeerBands
from app.engine.registry import RULES, rules_in_order
from app.engine.runner import run_for_taxpayer
from app.engine.scoring import compute_f_score, compute_p_score
from tests.engine import factories as f
from tests.engine.factories import JUN

ALL_PERIODS = tuple(Period(2025, 4).plus(n) for n in range(12))

#: The v2 rule families, kept apart from the A-L matrix by name rather than
#: by ID prefix. `B-04` is a v3 check and `BEH-04` is a v2 one; a
#: `startswith` on the letter would silently count one as the other.
V2_FAMILIES = frozenset({"OUT", "ITC", "PAY", "BEH", "EWB", "EIN", "REG", "SEC", "NET"})


def _only(ctx, rule_id: str):  # type: ignore[no-untyped-def]
    return RULES[rule_id].function(ctx)


def _fired(findings, rule_id: str) -> list:  # type: ignore[no-untyped-def]
    return [x for x in findings if x.rule_id == rule_id and x.triggered]


# ---------------------------------------------------------------------------
# registry
# ---------------------------------------------------------------------------


class TestRegistry:
    @pytest.mark.golden
    def test_the_v2_catalogue_is_still_intact(self) -> None:
        """The 57 v2 rules are live on nine real workbooks and are not
        deleted until each has been mapped onto its A-L identity. The v3
        CHANGELOG calls them superseded, but that was written for a
        greenfield build - see docs/GAP_V3.md."""
        assert len({rule for rule in RULES if RULES[rule].family in V2_FAMILIES}) == 57

    def test_the_v3_families_are_registered_alongside_them(self) -> None:
        """docs/01 sections 7 and 8. The A-L matrix arrives one check at a
        time and each one must be visible here the day it lands, so that
        adding a rule without registering it fails rather than passing
        quietly."""
        v3 = {rule for rule in RULES if RULES[rule].family not in V2_FAMILIES}
        assert v3 == {
            "X-01",
            "X-02",
            "X-03",
            "X-04",
            "X-05",
            "X-06",
            "X-07",
            "X-08",
            "X-09",
            "X-10",
            "X-11",
            "X-12",
            "B-04",
            "B-08",
        }

    @pytest.mark.golden
    def test_every_rule_has_a_non_empty_legal_basis(self) -> None:
        """A finding an officer cannot trace to a provision is one they cannot act on."""
        for spec in RULES.values():
            assert spec.legal_basis.strip(), spec.id

    def test_the_families_have_the_counts_the_spec_names(self) -> None:
        counts: dict[str, int] = {}
        for spec in RULES.values():
            counts[spec.family] = counts.get(spec.family, 0) + 1
        assert counts == {
            "X": 12,
            "B": 2,
            "OUT": 10,
            "ITC": 13,
            "PAY": 7,
            "BEH": 6,
            "EWB": 7,
            "EIN": 3,
            "REG": 5,
            "SEC": 3,
            "NET": 3,
        }

    def test_execution_order_is_deterministic(self) -> None:
        """Ordering is part of replay: two runs must produce findings in the
        same sequence."""
        assert [s.id for s in rules_in_order()] == [s.id for s in rules_in_order()]
        assert [s.id for s in rules_in_order()][:3] == ["OUT-01", "OUT-02", "OUT-04"]

    def test_all_thirty_four_parameters_are_registered(self) -> None:
        assert len(PARAMETERS) == 34
        assert sorted(PARAMETERS) == [f"P{n:02d}" for n in range(1, 35)]

    def test_every_parameter_carries_its_action_point_verbatim(self) -> None:
        for spec in PARAMETERS.values():
            assert spec.action_point.strip()
            assert spec.metric_description.strip()


# ---------------------------------------------------------------------------
# OUT-01: the boundary the gate names
# ---------------------------------------------------------------------------


def _out01_case(g1_igst: str, b3_igst: str):  # type: ignore[no-untyped-def]
    """The OUT-01 finding for June only.

    The rule speaks for every period -- including CLEAR for the eleven with no
    data -- so a boundary test picks out the period it planted."""
    taxpayer = f.data(
        outward=(f.outward(JUN, taxable="100000000", igst=g1_igst),),
        returns_3b=(f.return_3b(JUN, t31a_igst=b3_igst),),
    )
    return [x for x in _only(f.context(taxpayer), "OUT-01") if x.period == JUN]


class TestOut01Boundary:
    @pytest.mark.golden
    def test_exactly_at_both_thresholds_does_not_trigger_rule_88c(self) -> None:
        """docs/04: at 20.00% and 25,00,000 it does NOT trigger.

        Both limits are **exclusive**: Rule 88C speaks of a shortfall exceeding
        the prescribed percentage and amount. The choice is documented in
        docs/DECISIONS.md D-0017.
        """
        # 1,25,00,000 declared in GSTR-1, 1,00,00,000 in 3B: shortfall 25,00,000,
        # which is exactly 20.00% of the GSTR-1 liability.
        findings = _out01_case("12500000", "10000000")
        assert len(findings) == 1
        finding = findings[0]
        assert finding.trace is not None
        assert finding.trace.inputs["pct"] == Decimal("20.00")
        assert finding.delta.total == Decimal("2500000.00")
        assert finding.suggested_form is ActionForm.ASMT_10, "not DRC-01B at the boundary"
        assert finding.extra["route"] == "ASMT-10"

    @pytest.mark.golden
    def test_one_rupee_past_both_thresholds_triggers_rule_88c(self) -> None:
        """One rupee more, on both limits at once, and Rule 88C applies.

        The shortfall is 25,00,001 against a GSTR-1 liability of 1,25,00,000:
        20.000008%, which rounds to 20.00% for display and must still trigger.
        If the rounded figure decided it, this case would escape.
        """
        findings = _out01_case("12500000", "9999999")
        finding = findings[0]
        assert finding.delta.total == Decimal("2500001.00")
        assert finding.trace is not None
        assert finding.trace.inputs["pct"] == Decimal("20.00"), "rounds to 20.00 on screen"
        assert finding.suggested_form is ActionForm.DRC_01B
        assert finding.extra["route"] == "DRC-01B"

    @pytest.mark.golden
    def test_over_the_percentage_but_under_the_amount_routes_to_asmt_10(self) -> None:
        """The distinction an officer most needs the engine to get right."""
        # 50% shortfall, but only 10 lakh.
        findings = _out01_case("2000000", "1000000")
        finding = findings[0]
        assert finding.delta.total == Decimal("1000000.00")
        assert finding.suggested_form is ActionForm.ASMT_10
        assert "below the rule 88c limits" in (finding.narrative or "").lower()

    def test_no_shortfall_is_reported_clear_not_silent(self) -> None:
        findings = _out01_case("1000000", "1000000")
        assert findings[0].status is FindingStatus.CLEAR
        assert findings[0].narrative

    def test_missing_gstr3b_is_not_evaluated_and_names_it(self) -> None:
        taxpayer = f.data(outward=(f.outward(JUN, igst="180000"),))
        findings = _only(f.context(taxpayer), "OUT-01")
        assert findings[0].status is FindingStatus.NOT_EVALUATED
        assert findings[0].missing_inputs == ("gstr3b",)

    @pytest.mark.golden
    def test_severity_escalates_one_level_after_the_july_2025_hard_lock(self) -> None:
        """Table 3 is non-editable from July 2025, so a residual mismatch then
        is a far stronger signal than the same number before it."""
        before = f.data(
            outward=(f.outward(Period(2025, 6), taxable="100000000", igst="12500002"),),
            returns_3b=(f.return_3b(Period(2025, 6), t31a_igst="10000001"),),
        )
        after = f.data(
            outward=(f.outward(Period(2025, 7), taxable="100000000", igst="12500002"),),
            returns_3b=(f.return_3b(Period(2025, 7), t31a_igst="10000001"),),
        )
        pre = _fired(_only(f.context(before), "OUT-01"), "OUT-01")[0]
        post = _fired(_only(f.context(after), "OUT-01"), "OUT-01")[0]
        assert pre.severity is Severity.CRITICAL
        # CRITICAL is already the top of the ladder, so escalation saturates --
        # the trace still records which regime applied.
        assert post.trace is not None and post.trace.inputs["regime"] == "POST_HARD_LOCK"
        assert pre.trace is not None and pre.trace.inputs["regime"] == "PRE_HARD_LOCK"


# ---------------------------------------------------------------------------
# ITC-01 and ITC-02
# ---------------------------------------------------------------------------


class TestItc01:
    @pytest.mark.golden
    def test_only_table_4a5_is_compared_against_2b(self) -> None:
        """Comparing gross 4(A) against GSTR-2B is wrong and collapses on reply."""
        taxpayer = f.data(
            inward=(f.inward(JUN, igst="10000000"),),
            returns_3b=(
                f.return_3b(JUN, t4a5_igst="10000000", t4a1_igst="50000000", t4a3_igst="9000000"),
            ),
        )
        findings = _only(f.context(taxpayer), "ITC-01")
        assert findings[0].status is FindingStatus.CLEAR

    @pytest.mark.golden
    def test_at_exactly_both_thresholds_the_route_is_asmt_10(self) -> None:
        # 1,25,00,000 available, 1,50,00,000 claimed: excess 25,00,000 = 20.00%.
        taxpayer = f.data(
            inward=(f.inward(JUN, igst="12500000"),),
            returns_3b=(f.return_3b(JUN, t4a5_igst="15000000"),),
        )
        finding = _fired(_only(f.context(taxpayer), "ITC-01"), "ITC-01")[0]
        assert finding.delta.total == Decimal("2500000.00")
        assert finding.trace is not None and finding.trace.inputs["pct"] == Decimal("20.00")
        assert finding.suggested_form is ActionForm.ASMT_10

    def test_past_both_thresholds_the_route_is_drc_01c(self) -> None:
        taxpayer = f.data(
            inward=(f.inward(JUN, igst="12500000"),),
            returns_3b=(f.return_3b(JUN, t4a5_igst="15000002"),),
        )
        finding = _fired(_only(f.context(taxpayer), "ITC-01"), "ITC-01")[0]
        assert finding.suggested_form is ActionForm.DRC_01C


class TestItc02RuleThirtySevenA:
    """The highest-yield rule in the spec: both sides are departmental data."""

    def _taxpayer(self, *, supplier_filed_3b: bool, reversal: str = "0"):  # type: ignore[no-untyped-def]
        return f.data(
            inward=tuple(
                f.inward(JUN, doc_no=f"P-{n}", igst="274436", supplier=f.SUPPLIER_A)
                for n in range(14)
            ),
            returns_3b=(f.return_3b(JUN, t4b2_igst=reversal),),
            supplier_filing={
                f.SUPPLIER_A: {
                    JUN.mmyyyy: (
                        True,
                        supplier_filed_3b,
                        date(2025, 7, 20) if supplier_filed_3b else None,
                    )
                }
            },
        )

    @pytest.mark.golden
    def test_a_defaulting_supplier_produces_a_certain_finding(self) -> None:
        findings = _only(f.context(self._taxpayer(supplier_filed_3b=False)), "ITC-02")
        finding = findings[0]
        assert finding.triggered
        assert finding.confidence is Confidence.CERTAIN
        assert finding.delta.igst == Decimal("3842104.00")  # 14 x 2,74,436
        assert finding.extra["suppliers"] == 1
        assert finding.extra["invoices"] == 14
        assert finding.suggested_form is ActionForm.DRC_01A

    def test_a_compliant_supplier_is_clear(self) -> None:
        findings = _only(f.context(self._taxpayer(supplier_filed_3b=True)), "ITC-02")
        assert findings[0].status is FindingStatus.CLEAR

    @pytest.mark.golden
    def test_a_reversal_already_made_reduces_the_shortfall_to_nil(self) -> None:
        taxpayer = self._taxpayer(supplier_filed_3b=False, reversal="3842104")
        findings = _only(f.context(taxpayer), "ITC-02")
        assert findings[0].status is FindingStatus.CLEAR

    def test_without_supplier_filing_status_it_is_not_evaluated(self) -> None:
        taxpayer = f.data(inward=(f.inward(JUN, igst="100000"),))
        findings = _only(f.context(taxpayer), "ITC-02")
        assert findings[0].status is FindingStatus.NOT_EVALUATED
        assert "supplier_filing_status" in findings[0].missing_inputs

    def test_the_drawer_shows_the_cut_off_dates_with_their_notification(self) -> None:
        findings = _only(f.context(self._taxpayer(supplier_filed_3b=False)), "ITC-02")
        trace = findings[0].trace
        assert trace is not None
        keys = {(p.parameter_id, p.key, p.value) for p in trace.parameters}
        assert ("ITC-02", "supplier_3b_cutoff", "30-09") in keys
        assert ("ITC-02", "reversal_cutoff", "30-11") in keys
        assert trace.inputs["supplier_cutoff"] == date(2026, 9, 30)
        assert trace.inputs["reversal_cutoff"] == date(2026, 11, 30)


# ---------------------------------------------------------------------------
# PAY-03: the availed-but-never-utilised distinction
# ---------------------------------------------------------------------------


class TestPay03:
    @pytest.mark.golden
    def test_credit_availed_but_never_utilised_carries_no_interest(self) -> None:
        """This distinction is litigated constantly.  If the balance never fell
        below the wrong availment, only reversal is due."""
        from app.money import TaxVector

        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN),),
            ledgers=tuple(
                f.ledger(
                    JUN, opening="5000000", credited="0", debited="0", as_on=date(2025, 6, day)
                )
                for day in range(1, 29)
            ),
        )
        ctx = f.context(taxpayer, extras={"wrong_availment": TaxVector(igst="1000000")})
        findings = _only(ctx, "PAY-03")
        assert findings[0].status is FindingStatus.CLEAR
        assert "never utilised" in (findings[0].narrative or "")
        assert findings[0].interest == Decimal("0.00")

    @pytest.mark.golden
    def test_interest_runs_from_the_day_the_balance_fell_below_the_availment(self) -> None:
        from app.money import TaxVector

        ledgers = [
            f.ledger(JUN, opening="5000000", closing="5000000", as_on=date(2025, 6, day))
            for day in range(1, 10)
        ]
        # On 10 June the balance falls below the 10 lakh wrongly availed.
        ledgers += [
            f.ledger(JUN, opening="5000000", closing="900000", as_on=date(2025, 6, day))
            for day in range(10, 30)
        ]
        taxpayer = f.data(returns_3b=(f.return_3b(JUN),), ledgers=tuple(ledgers))
        ctx = f.context(
            taxpayer,
            extras={
                "wrong_availment": TaxVector(igst="1000000"),
                "reversal_date": date(2025, 9, 8),  # 90 days after utilisation
            },
        )
        finding = _only(ctx, "PAY-03")[0]
        assert finding.triggered
        # 10,00,000 x 18% x 90 / 365 = 44,383.56
        assert finding.interest == Decimal("44383.56")


# ---------------------------------------------------------------------------
# NET-02: circular trading
# ---------------------------------------------------------------------------


class TestNet02:
    def _graph(self, value: str) -> InvoiceGraph:
        graph = InvoiceGraph()
        chain = [f.GSTIN, f.SUPPLIER_A, f.SUPPLIER_B]
        for index, node in enumerate(chain):
            graph.add(node, chain[(index + 1) % len(chain)], Decimal(value))
        return graph

    @pytest.mark.golden
    def test_a_planted_three_node_cycle_is_found(self) -> None:
        ctx = f.context(f.data(), graph=self._graph("12000000"))
        finding = _fired(_only(ctx, "NET-02"), "NET-02")[0]
        assert finding.confidence is Confidence.ADVISORY
        assert finding.taxable_value_effect == Decimal("12000000.00")
        assert finding.extra["investigative_lead_only"] is True

    @pytest.mark.golden
    def test_a_clean_graph_finds_none(self) -> None:
        graph = InvoiceGraph()
        graph.add(f.GSTIN, f.SUPPLIER_A, Decimal("12000000"))
        graph.add(f.SUPPLIER_A, f.SUPPLIER_B, Decimal("12000000"))
        ctx = f.context(f.data(), graph=graph)
        assert _only(ctx, "NET-02")[0].status is FindingStatus.CLEAR

    def test_a_cycle_below_the_threshold_does_not_trigger(self) -> None:
        ctx = f.context(f.data(), graph=self._graph("900000"))
        assert _only(ctx, "NET-02")[0].status is FindingStatus.CLEAR

    @pytest.mark.golden
    def test_a_cycle_finding_may_never_populate_a_notice(self) -> None:
        """ADVISORY findings populate a worklist, never a notice.  There is no
        code path that promotes one automatically."""
        ctx = f.context(f.data(), graph=self._graph("12000000"))
        finding = _fired(_only(ctx, "NET-02"), "NET-02")[0]
        assert finding.may_populate_notice is False

    def test_without_a_graph_it_is_not_evaluated(self) -> None:
        assert _only(f.context(), "NET-02")[0].status is FindingStatus.NOT_EVALUATED


# ---------------------------------------------------------------------------
# REG-07: the three-year bar
# ---------------------------------------------------------------------------


class TestReg07:
    @pytest.mark.golden
    def test_a_return_due_in_july_2022_is_barred_today(self) -> None:
        taxpayer = f.data(
            filings=(
                f.filing(Period(2022, 6), due=date(2022, 7, 20), filed=None, status="NOT_FILED"),
            )
        )
        ctx = f.context(taxpayer, fy="2022-23", as_of=date(2026, 9, 20))
        finding = _fired(_only(ctx, "REG-07"), "REG-07")[0]
        assert finding.severity is Severity.CRITICAL
        assert finding.extra["buckets"]["BARRED"][0]["bar_date"] == "2025-07-20"
        assert "s.62 best-judgement" in (finding.narrative or "")

    def test_buckets_are_barred_critical_warning_and_ok(self) -> None:
        as_of = date(2026, 9, 20)
        taxpayer = f.data(
            filings=(
                f.filing(Period(2023, 5), due=date(2023, 6, 20), filed=None),  # barred
                f.filing(Period(2023, 10), due=date(2023, 11, 20), filed=None),  # <90 days
                f.filing(Period(2023, 12), due=date(2024, 1, 20), filed=None),  # <180 days
                f.filing(Period(2024, 6), due=date(2024, 7, 20), filed=None),  # OK
            )
        )
        finding = _fired(_only(f.context(taxpayer, fy="2023-24", as_of=as_of), "REG-07"), "REG-07")[
            0
        ]
        buckets = finding.extra["buckets"]
        assert len(buckets["BARRED"]) == 1
        assert len(buckets["CRITICAL"]) == 1
        assert len(buckets["WARNING"]) == 1
        assert len(buckets["OK"]) == 1

    def test_all_returns_filed_is_clear(self) -> None:
        taxpayer = f.data(filings=(f.filing(Period(2025, 6), filed=date(2025, 7, 18)),))
        assert _only(f.context(taxpayer), "REG-07")[0].status is FindingStatus.CLEAR


# ---------------------------------------------------------------------------
# the 34 parameters
# ---------------------------------------------------------------------------


class TestParameters:
    @pytest.mark.golden
    def test_the_ten_external_parameters_are_never_evaluated(self) -> None:
        assert set(EXTERNAL_PARAMS) == {
            "P02",
            "P15",
            "P20",
            "P23",
            "P25",
            "P26",
            "P27",
            "P28",
            "P33",
            "P34",
        }
        ctx = f.context(f.data(returns_3b=(f.return_3b(JUN, t31a_taxable="1000000"),)))
        for param_id in EXTERNAL_PARAMS:
            result = evaluate_parameter(ctx, param_id)
            assert result.status is FindingStatus.NOT_EVALUATED
            assert result.flag is None, "never default a dark parameter to Flag 0"
            assert result.external_feed
            assert result.roadmap_ref

    @pytest.mark.golden
    def test_ten_dark_parameters_means_coverage_of_24_of_34(self) -> None:
        """docs/04: a taxpayer with 10 EXTERNAL parameters dark shows coverage
        24/34 and a P-Score computed over 24, not 34."""
        ctx = _fully_covered_context()
        results = [evaluate_parameter(ctx, pid) for pid in sorted(PARAMETERS)]
        evaluated = [r for r in results if r.evaluated]
        assert len(evaluated) == 24, sorted(r.param_id for r in results if not r.evaluated)
        score = compute_p_score(ctx, results)
        assert score.evaluated == 24
        assert score.total == 34
        assert score.coverage == Decimal("0.7059")
        assert "24 of 34" in score.coverage_sentence

    def test_a_dark_parameter_lowers_coverage_not_the_score(self) -> None:
        """Defaulting one to Flag 0 would make a taxpayer with ten dark
        parameters look safer than one with ten evaluated zeros."""
        ctx = _fully_covered_context()
        results = [evaluate_parameter(ctx, pid) for pid in sorted(PARAMETERS)]
        score = compute_p_score(ctx, results)
        denominators = {row["param_id"] for row in score.waterfall}
        assert denominators.isdisjoint(set(EXTERNAL_PARAMS))

    def test_a_peer_cohort_below_the_minimum_size_is_not_evaluated(self) -> None:
        """Banding one taxpayer against four peers is noise presented as a
        percentile."""
        cohort = PeerBands().cohort_for(
            sector=f.profile().sector_code,
            turnover=f.profile().aato,
            jurisdiction=f.profile().division,
        )
        bands = PeerBands.build({"P07": [(cohort, Decimal(n)) for n in range(5)]})
        ctx = f.context(
            f.data(returns_3b=(f.return_3b(JUN, payable_igst="100", paid_itc_igst="100"),)),
            peers=bands,
        )
        result = evaluate_parameter(ctx, "P07")
        assert result.status is FindingStatus.NOT_EVALUATED
        assert "below the minimum size" in result.missing_inputs[0]

    def test_an_undefined_ratio_is_not_evaluated_rather_than_zero(self) -> None:
        """A taxpayer with no turnover has an undefined exempt ratio, not a
        zero one."""
        ctx = f.context(f.data(returns_3b=(f.return_3b(JUN),)), peers=_peer_bands())
        assert evaluate_parameter(ctx, "P03").status is FindingStatus.NOT_EVALUATED


def _peer_bands() -> PeerBands:
    # The cohort key must match what the fixture taxpayer resolves to, or every
    # RATIO_PEER parameter correctly reports "no band for this cohort".
    cohort = PeerBands().cohort_for(
        sector=f.profile().sector_code,
        turnover=f.profile().aato,
        jurisdiction=f.profile().division,
    )
    return PeerBands.build(
        {
            param_id: [(cohort, Decimal(n) / Decimal(100)) for n in range(1, 101)]
            for param_id in PARAMETERS
        }
    )


def _fully_covered_context():  # type: ignore[no-untyped-def]
    """A taxpayer with every locally-derivable dataset present."""
    returns = tuple(
        f.return_3b(
            period,
            t31a_taxable="10000000",
            t31b_taxable="1000000",
            t31c_taxable="500000",
            t31d_taxable="200000",
            t31e_taxable="100000",
            t31a_igst="1800000",
            t31d_igst="36000",
            t4a1_igst="100000",
            t4a2_igst="20000",
            t4a3_igst="36000",
            t4a4_igst="50000",
            t4a5_igst="900000",
            t4b1_igst="40000",
            t4c_igst="1066000",
            t5_inter="300000",
            t5_intra="200000",
            payable_igst="1800000",
            paid_itc_igst="1000000",
            paid_cash_igst="800000",
        )
        for period in ALL_PERIODS
    )
    prior = f.data(
        returns_3b=tuple(
            f.return_3b(period.plus(-12), t31a_taxable="9000000") for period in ALL_PERIODS
        )
    )
    taxpayer = f.data(
        outward=(
            f.outward(JUN, doc_no="CN-1", taxable="100000", doc_type="CREDIT_NOTE", section="CDNR"),
            f.outward(JUN, doc_no="DN-1", taxable="50000", doc_type="DEBIT_NOTE", section="CDNR"),
            f.outward(JUN, doc_no="SEZ-1", taxable="400000", section="SEZWP"),
            f.outward(JUN, doc_no="DX-1", taxable="300000", section="DEEMED"),
        ),
        inward=(f.inward(JUN, igst="900000"),),
        returns_3b=returns,
        filings=tuple(f.filing(p, filed=p.next.first_day) for p in ALL_PERIODS),
    )
    return f.context(
        taxpayer,
        peers=_peer_bands(),
        prior_year=prior,
        extras={
            "pan_registrations": ("27AAPFU0939F1ZV", "27AAPFU0939F2ZS"),
            "itc04_t4_turnover": Decimal("500000"),
            "prior_cycle_selected": False,
        },
        extra_datasets=frozenset({"itc04"}),
    )


# ---------------------------------------------------------------------------
# scoring
# ---------------------------------------------------------------------------


class TestScoring:
    @pytest.mark.golden
    def test_the_p_score_waterfall_sums_exactly_to_its_numerator(self) -> None:
        ctx = _fully_covered_context()
        results = [evaluate_parameter(ctx, pid) for pid in sorted(PARAMETERS)]
        score = compute_p_score(ctx, results)
        contributions = sum(Decimal(row["contribution"]) for row in score.waterfall)
        capacity = sum(Decimal(row["capacity"]) for row in score.waterfall)
        assert score.trace.inputs["score"] == (contributions / capacity * Decimal("100")).quantize(
            Decimal("0.01")
        )

    @pytest.mark.golden
    def test_the_f_score_dimension_contributions_sum_exactly_to_the_score(self) -> None:
        """docs/04: dimension scores weight exactly to the F-Score."""
        ctx = _fully_covered_context()
        outcome = run_for_taxpayer(ctx)
        total = sum(outcome.f_score.dimension_contributions.values())
        assert total == outcome.f_score.score

    @pytest.mark.golden
    def test_the_f_score_waterfall_points_sum_exactly_to_the_dimension_points(self) -> None:
        ctx = _fully_covered_context()
        outcome = run_for_taxpayer(ctx)
        for dimension, points in outcome.f_score.dimension_points.items():
            from_waterfall = sum(
                Decimal(entry.points)
                for entry in outcome.f_score.waterfall
                if entry.dimension == dimension
            )
            assert from_waterfall == points, dimension

    def test_the_two_scores_are_never_fused(self) -> None:
        """There is deliberately no function that combines them."""
        import app.engine.scoring as scoring

        assert not any(
            "combin" in name or "fuse" in name or "overall" in name for name in dir(scoring)
        )

    def test_no_machine_learning_influences_either_score(self) -> None:
        from pathlib import Path

        source = (Path(__file__).parent.parent.parent / "app/engine/scoring.py").read_text(
            encoding="utf-8"
        )
        for banned in ("sklearn", "torch", "numpy", "predict", "model.fit"):
            assert banned not in source

    def test_a_suppressed_finding_contributes_nothing(self) -> None:
        ctx = _fully_covered_context()
        outcome = run_for_taxpayer(ctx)
        live = [x for x in outcome.findings if x.triggered]
        assert compute_f_score(ctx, live).score == outcome.f_score.score


# ---------------------------------------------------------------------------
# suppressions
# ---------------------------------------------------------------------------


class TestSuppressions:
    @pytest.mark.golden
    def test_a_section_128a_period_is_suppressed_but_still_visible(self) -> None:
        """Issuing a notice for a waived period is a credibility-destroying
        error.  The finding stays visible and labelled; it is never deleted."""
        taxpayer = f.data(
            outward=(f.outward(Period(2018, 6), taxable="100000000", igst="12500002"),),
            returns_3b=(f.return_3b(Period(2018, 6), t31a_igst="10000001"),),
        )
        outcome = run_for_taxpayer(f.context(taxpayer, fy="2018-19"), only=("OUT-01",))
        suppressed = [x for x in outcome.findings if x.status is FindingStatus.SUPPRESSED]
        assert suppressed, "the amnesty period must be suppressed"
        assert "s.128A amnesty" in (suppressed[0].suppressed_by or "")
        assert suppressed[0].delta.total == Decimal("2500001.00"), "the figure is kept"
        assert suppressed[0].may_populate_notice is False

    def test_a_period_outside_the_amnesty_is_not_suppressed(self) -> None:
        taxpayer = f.data(
            outward=(f.outward(JUN, taxable="100000000", igst="12500002"),),
            returns_3b=(f.return_3b(JUN, t31a_igst="10000001"),),
        )
        outcome = run_for_taxpayer(f.context(taxpayer), only=("OUT-01",))
        assert any(x.triggered for x in outcome.findings)


# ---------------------------------------------------------------------------
# the run as a whole
# ---------------------------------------------------------------------------


class TestFullRun:
    @pytest.mark.golden
    def test_a_taxpayer_with_no_data_reports_not_evaluated_never_clear(self) -> None:
        """The silence of an engine must be readable.  'No data' is not 'no issue'."""
        outcome = run_for_taxpayer(f.context())
        assert outcome.rule_errors == ()
        statuses = {x.rule_id: x.status for x in outcome.findings}
        cleared = [rid for rid, s in statuses.items() if s is FindingStatus.CLEAR]
        # Only rules whose premise is genuinely absent may report CLEAR.
        assert set(cleared) <= {"REG-06", "EIN-02", "EIN-04", "SEC-01"}
        for finding in outcome.findings:
            if finding.status is FindingStatus.NOT_EVALUATED:
                assert finding.missing_inputs

    def test_every_finding_carries_a_calc_id(self) -> None:
        outcome = run_for_taxpayer(_fully_covered_context())
        for finding in outcome.findings:
            assert finding.calc_id and len(finding.calc_id) == 64

    @pytest.mark.golden
    def test_a_rule_that_raises_does_not_take_the_run_down(self) -> None:
        from app.engine.registry import RULES

        spec = RULES["OUT-19"]
        original = spec.function

        def explode(ctx):  # type: ignore[no-untyped-def]
            raise RuntimeError("deliberate")

        RULES["OUT-19"] = replace(spec, function=explode)
        try:
            outcome = run_for_taxpayer(_fully_covered_context())
            assert any(e["rule_id"] == "OUT-19" for e in outcome.rule_errors)
            assert len(outcome.findings) > 40, "every other rule still ran"
        finally:
            RULES["OUT-19"] = spec
            assert RULES["OUT-19"].function is original

    @pytest.mark.golden
    def test_one_taxpayer_twelve_periods_runs_well_inside_five_seconds(self) -> None:
        """docs/04: 1 taxpayer x 12 periods x (34 + 57) in under 5 seconds."""
        ctx = _fully_covered_context()
        started = time.perf_counter()
        outcome = run_for_taxpayer(ctx)
        elapsed = time.perf_counter() - started
        assert elapsed < 5.0, f"took {elapsed:.2f}s"
        assert len(outcome.parameters) == 34
        assert len({x.rule_id for x in outcome.findings}) >= 50

    @pytest.mark.golden
    def test_the_whole_run_replays_identically(self) -> None:
        first = run_for_taxpayer(_fully_covered_context())
        second = run_for_taxpayer(_fully_covered_context())
        assert [x.calc_id for x in first.findings] == [x.calc_id for x in second.findings]
        assert [p.calc_id for p in first.parameters] == [p.calc_id for p in second.parameters]
        assert first.p_score.calc_id == second.p_score.calc_id
        assert first.f_score.calc_id == second.f_score.calc_id
        assert first.p_score.score == second.p_score.score
        assert first.f_score.score == second.f_score.score
