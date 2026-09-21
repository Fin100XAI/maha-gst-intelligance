"""Phase 2 acceptance: R1 to R11 against hand-computed fixtures, head-wise."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.engine.identities import (
    IdentityStatus,
    evaluate_identities,
    identity_matrix,
    r1,
    r2,
    r3,
    r4,
    r5,
    r6,
    r7,
    r8,
    r9,
    r10,
    r11,
)
from tests.engine import factories as f
from tests.engine.factories import JUN

# ---------------------------------------------------------------------------
# R1 -- GSTR-1 vs GSTR-3B
# ---------------------------------------------------------------------------


class TestR1:
    @pytest.mark.golden
    def test_holds_when_the_two_returns_agree(self) -> None:
        taxpayer = f.data(
            outward=(f.outward(JUN, taxable="1000000", cgst="90000", sgst="90000"),),
            returns_3b=(f.return_3b(JUN, t31a_cgst="90000", t31a_sgst="90000"),),
        )
        result = r1(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.HOLDS
        assert result.delta.is_zero()

    @pytest.mark.golden
    def test_the_law_three_case_two_breaches_not_zero(self) -> None:
        """IGST short 1,00,000 against CGST excess 1,00,000.

        A system that reports 'reconciled' here has failed Law 3.  The signed
        total is nil; the honest size of the breach is two lakh.
        """
        taxpayer = f.data(
            outward=(f.outward(JUN, taxable="1000000", igst="100000"),),
            returns_3b=(f.return_3b(JUN, t31a_cgst="100000"),),
        )
        result = r1(f.context(taxpayer), JUN)

        assert result.delta.total == Decimal("0.00")
        assert result.delta.abs_total == Decimal("200000.00")
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.igst == Decimal("100000.00")
        assert result.delta.cgst == Decimal("-100000.00")

    @pytest.mark.golden
    def test_credit_notes_reduce_the_gstr1_side(self) -> None:
        taxpayer = f.data(
            outward=(
                f.outward(JUN, doc_no="INV-1", taxable="1000000", igst="180000"),
                f.outward(
                    JUN,
                    section="CDNR",
                    doc_no="CN-1",
                    taxable="100000",
                    igst="18000",
                    doc_type="CREDIT_NOTE",
                ),
            ),
            returns_3b=(f.return_3b(JUN, t31a_igst="162000"),),
        )
        result = r1(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.HOLDS, result.delta.dict()

    @pytest.mark.golden
    def test_amendments_fold_once_not_twice(self) -> None:
        """An amendment is a delta at the identity layer, applied a single time."""
        taxpayer = f.data(
            outward=(
                f.outward(JUN, doc_no="INV-1", taxable="1000000", igst="180000"),
                f.outward(
                    JUN,
                    section="AMENDMENT",
                    doc_no="INV-1-A",
                    taxable="50000",
                    igst="9000",
                    is_amendment=True,
                ),
            ),
            returns_3b=(f.return_3b(JUN, t31a_igst="189000"),),
        )
        result = r1(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.HOLDS
        # Not 1,98,000: folding the amendment twice is the classic error.
        assert result.trace.inputs["g1"].igst == Decimal("189000.00")

    @pytest.mark.golden
    def test_inward_rcm_is_excluded_from_the_3b_side(self) -> None:
        """3.1(d) is a liability but NOT an outward-supply liability.

        Including it is the commonest false positive on Rule 88C.
        """
        taxpayer = f.data(
            outward=(f.outward(JUN, taxable="1000000", igst="180000"),),
            returns_3b=(f.return_3b(JUN, t31a_igst="180000", t31d_igst="50000"),),
        )
        assert r1(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    def test_not_evaluated_names_the_missing_dataset(self) -> None:
        taxpayer = f.data(outward=(f.outward(JUN),))  # no GSTR-3B at all
        result = r1(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.NOT_EVALUATED
        assert result.missing_inputs == ("gstr3b",)
        assert "gstr3b" in (result.note or "")

    def test_the_trace_shows_the_formula_as_executed(self) -> None:
        taxpayer = f.data(
            outward=(f.outward(JUN, igst="180000"),),
            returns_3b=(f.return_3b(JUN, t31a_igst="150000"),),
        )
        result = r1(f.context(taxpayer), JUN)
        assert "IGST 180000.00" in (result.trace.formula_rendered or "")
        assert result.trace.legal_basis == "Rule 88C CGST Rules, 2017"
        assert len(result.trace.steps) >= 3
        assert result.trace.evidence_ids  # the source rows are listed


# ---------------------------------------------------------------------------
# R2 -- GSTR-2B vs GSTR-3B
# ---------------------------------------------------------------------------


class TestR2:
    @pytest.mark.golden
    def test_holds_when_the_claim_matches_the_available_credit(self) -> None:
        taxpayer = f.data(
            inward=(f.inward(JUN, igst="90000"), f.inward(JUN, doc_no="PINV-2", igst="60000")),
            returns_3b=(f.return_3b(JUN, t4a5_igst="150000"),),
        )
        assert r2(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    @pytest.mark.golden
    def test_only_4a5_is_compared_not_gross_4a(self) -> None:
        """IMPG, IMPS, ISD and RCM credit sit in 4(A)(1) to (4).

        Comparing gross 4(A) against GSTR-2B is wrong and collapses on reply.
        """
        taxpayer = f.data(
            inward=(f.inward(JUN, igst="150000"),),
            returns_3b=(
                f.return_3b(
                    JUN,
                    t4a5_igst="150000",
                    t4a1_igst="500000",
                    t4a2_igst="20000",
                    t4a3_igst="30000",
                    t4a4_igst="10000",
                ),
            ),
        )
        assert r2(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    def test_lines_the_recipient_rejected_do_not_count_as_available(self) -> None:
        taxpayer = f.data(
            inward=(
                f.inward(JUN, igst="90000"),
                f.inward(JUN, doc_no="PINV-2", igst="60000", ims_action="REJECTED"),
            ),
            returns_3b=(f.return_3b(JUN, t4a5_igst="150000"),),
        )
        result = r2(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.igst == Decimal("60000.00")

    def test_lines_marked_not_available_do_not_count(self) -> None:
        taxpayer = f.data(
            inward=(f.inward(JUN, igst="90000", itc_available=False),),
            returns_3b=(f.return_3b(JUN, t4a5_igst="90000"),),
        )
        assert r2(f.context(taxpayer), JUN).delta.igst == Decimal("90000.00")

    def test_credit_notes_reduce_available_credit(self) -> None:
        taxpayer = f.data(
            inward=(
                f.inward(JUN, igst="100000"),
                f.inward(JUN, section="CDNR", doc_no="CN-1", igst="10000", doc_type="CREDIT_NOTE"),
            ),
            returns_3b=(f.return_3b(JUN, t4a5_igst="90000"),),
        )
        assert r2(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS


# ---------------------------------------------------------------------------
# R3 -- the internal identity
# ---------------------------------------------------------------------------


class TestR3:
    def test_holds_on_a_well_formed_return(self) -> None:
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, t4a5_igst="150000", t4b1_igst="20000", t4c_igst="130000"),)
        )
        assert r3(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    @pytest.mark.golden
    def test_fails_loudly_on_a_malformed_return(self) -> None:
        """If 4(C) does not equal 4(A) minus 4(B), every downstream figure is suspect."""
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, t4a5_igst="150000", t4b1_igst="20000", t4c_igst="140000"),)
        )
        result = r3(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.igst == Decimal("10000.00")
        assert "malformed" in (result.consequence or "")


# ---------------------------------------------------------------------------
# R4, R5, R6
# ---------------------------------------------------------------------------


class TestR4:
    def test_within_the_band_holds(self) -> None:
        taxpayer = f.data(
            outward=(f.outward(JUN, taxable="1000000", igst="180000"),),
            ewb=(f.eway(JUN, value="1180000"),),
        )
        assert r4(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    def test_the_ewb_value_is_tax_inclusive(self) -> None:
        """Comparing EWB value against taxable alone would breach every time."""
        taxpayer = f.data(
            outward=(f.outward(JUN, taxable="1000000", igst="180000"),),
            ewb=(f.eway(JUN, value="1000000"),),
        )
        assert r4(f.context(taxpayer), JUN).status == IdentityStatus.BREACHED


class TestR5:
    def test_a_missing_irn_breaches(self) -> None:
        taxpayer = f.data(
            outward=(
                f.outward(JUN, doc_no="INV-1"),
                f.outward(JUN, doc_no="INV-2"),
            ),
            einvoices=(f.einvoice(JUN, doc_no="INV-1"),),
        )
        result = r5(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.igst == Decimal("1.00")


class TestR6:
    @pytest.mark.golden
    def test_credit_without_a_discharged_liability_breaches(self) -> None:
        taxpayer = f.data(returns_3b=(f.return_3b(JUN, t31d_igst="10000", t4a3_igst="50000"),))
        result = r6(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.igst == Decimal("40000.00")


# ---------------------------------------------------------------------------
# R7 -- honestly not evaluated
# ---------------------------------------------------------------------------


def test_r7_says_it_cannot_be_evaluated_rather_than_implying_the_year_balances() -> None:
    result = r7(f.context(), None)
    assert result.status == IdentityStatus.NOT_EVALUATED
    assert result.missing_inputs == ("gstr9",)


# ---------------------------------------------------------------------------
# R8 -- the ledger identity
# ---------------------------------------------------------------------------


class TestR8:
    def test_a_balanced_ledger_holds(self) -> None:
        taxpayer = f.data(
            ledgers=(f.ledger(JUN, opening="100000", credited="50000", debited="30000"),)
        )
        assert r8(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    @pytest.mark.golden
    def test_an_injected_rupee_is_caught(self) -> None:
        """The cheapest possible data-quality check, and it must be exact."""
        taxpayer = f.data(
            ledgers=(
                f.ledger(
                    JUN, opening="100000", credited="50000", debited="30000", closing="120001"
                ),
            )
        )
        result = r8(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.igst == Decimal("1.00")

    def test_the_breach_is_reported_under_the_head_it_occurred_in(self) -> None:
        taxpayer = f.data(
            ledgers=(
                f.ledger(
                    JUN, head="CGST", opening="100000", credited="0", debited="0", closing="105000"
                ),
            )
        )
        result = r8(f.context(taxpayer), JUN)
        assert result.delta.cgst == Decimal("5000.00")
        assert result.delta.igst == Decimal("0.00")


# ---------------------------------------------------------------------------
# R9 -- the utilisation order
# ---------------------------------------------------------------------------


class TestR9:
    @pytest.mark.golden
    def test_cgst_set_off_beyond_the_cgst_credit_available_is_flagged(self) -> None:
        """Cross-utilisation of CGST against SGST is impossible on the portal,
        so finding it means the figure did not come from the portal."""
        taxpayer = f.data(
            returns_3b=(
                f.return_3b(
                    JUN,
                    t4c_cgst="50000",
                    t4c_sgst="50000",
                    paid_itc_cgst="80000",
                    paid_itc_sgst="20000",
                ),
            )
        )
        result = r9(f.context(taxpayer), JUN)
        assert result.status == IdentityStatus.BREACHED
        assert result.delta.cgst == Decimal("30000.00")

    def test_a_lawful_set_off_holds(self) -> None:
        taxpayer = f.data(returns_3b=(f.return_3b(JUN, t4c_igst="100000", paid_itc_igst="80000"),))
        assert r9(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS


# ---------------------------------------------------------------------------
# R10, R11 -- interest and late fee
# ---------------------------------------------------------------------------


class TestR10:
    @pytest.mark.golden
    def test_interest_on_a_thirty_day_delay(self) -> None:
        """1,00,000 cash at 18% for 30 days = 100000 x 0.18 x 30/365 = 1,479.45."""
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, paid_cash_igst="100000"),),
            filings=(f.filing(JUN, due=date(2025, 7, 20), filed=date(2025, 8, 19)),),
        )
        result = r10(f.context(taxpayer), JUN)
        assert result.trace.inputs["days"] == 30
        assert result.trace.inputs["expected"].igst == Decimal("1479.45")
        assert result.delta.igst == Decimal("1479.45")  # nothing was declared

    def test_a_return_filed_on_time_carries_no_interest(self) -> None:
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, paid_cash_igst="100000"),),
            filings=(f.filing(JUN, due=date(2025, 7, 20), filed=date(2025, 7, 18)),),
        )
        assert r10(f.context(taxpayer), JUN).status == IdentityStatus.HOLDS

    def test_days_late_uses_the_injected_as_of_for_an_unfiled_return(self) -> None:
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, paid_cash_igst="100000"),),
            filings=(f.filing(JUN, due=date(2025, 7, 20), filed=None, status="NOT_FILED"),),
        )
        result = r10(f.context(taxpayer, as_of=date(2025, 8, 19)), JUN)
        assert result.trace.inputs["days"] == 30


class TestR11:
    @pytest.mark.golden
    def test_late_fee_splits_between_cgst_and_sgst(self) -> None:
        """50/day for 10 days = 500, levied 250 under each Act."""
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, payable_igst="100000"),),
            filings=(f.filing(JUN, due=date(2025, 7, 20), filed=date(2025, 7, 30)),),
        )
        result = r11(f.context(taxpayer), JUN)
        expected = result.trace.inputs["expected"]
        assert expected.cgst == Decimal("250.00")
        assert expected.sgst == Decimal("250.00")
        assert expected.igst == Decimal("0.00")

    def test_a_nil_return_uses_the_lower_daily_rate(self) -> None:
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN),),  # nothing payable
            filings=(f.filing(JUN, due=date(2025, 7, 20), filed=date(2025, 7, 30)),),
        )
        result = r11(f.context(taxpayer), JUN)
        assert result.trace.inputs["nil_return"] is True
        assert result.trace.inputs["expected"].cgst == Decimal("100.00")

    def test_it_says_the_cap_grid_is_not_configured(self) -> None:
        """Never invent a threshold: the turnover-graded caps are not in docs/01."""
        taxpayer = f.data(
            returns_3b=(f.return_3b(JUN, payable_igst="100000"),),
            filings=(f.filing(JUN, due=date(2025, 7, 20), filed=date(2025, 7, 30)),),
        )
        assert "TODO(statute)" in (r11(f.context(taxpayer), JUN).note or "")


# ---------------------------------------------------------------------------
# the matrix
# ---------------------------------------------------------------------------


def test_every_identity_runs_for_every_period() -> None:
    taxpayer = f.data(
        outward=(f.outward(JUN, igst="180000"),),
        returns_3b=(f.return_3b(JUN, t31a_igst="180000"),),
    )
    matrix = identity_matrix(f.context(taxpayer))
    assert len(matrix) == 12
    for results in matrix.values():
        assert [r.identity_id for r in results] == [f"R{n}" for n in range(1, 12)]


def test_a_taxpayer_with_no_data_reports_not_evaluated_everywhere_never_clear() -> None:
    """The silence of an engine must be readable.  'No data' is not 'no issue'."""
    results = evaluate_identities(f.context(), JUN)
    assert all(r.status == IdentityStatus.NOT_EVALUATED for r in results)
    assert all(r.missing_inputs for r in results)


def test_every_identity_result_carries_a_calc_id() -> None:
    taxpayer = f.data(
        outward=(f.outward(JUN, igst="180000"),),
        returns_3b=(f.return_3b(JUN, t31a_igst="150000"),),
    )
    for result in evaluate_identities(f.context(taxpayer), JUN):
        assert len(result.calc_id) == 64
