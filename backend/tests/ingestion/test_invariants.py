"""I-01 to I-10, and the line they must not cross.

These run before any rule sees a row. A row that fails one is quarantined and
is invisible to every check, parameter and join - so the cost of a wrong
invariant is not a wrong finding, it is a *missing* one, which nobody will
notice. That asymmetry is why every test here has a negative twin: for each
violation there is a case asserting the invariant stays quiet on data that is
merely unusual.

The originating failure is `docs/07` Part C1: one naively-read date column
produced 250 fabricated Rule 48(4) notices and 314 acknowledgements dated
before their own invoices. I-01 stops all of them.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from app.canonical import Period
from app.ingestion.invariants import INVARIANTS, check_invariants

APRIL = Period.parse("042025")


class TestI01AcknowledgementNeverPrecedesItsDocument:
    def test_an_irn_before_its_invoice_is_refused(self) -> None:
        found = check_invariants({"doc_date": date(2026, 1, 12), "irn_date": date(2025, 12, 1)})
        assert found is not None
        assert found.invariant == "I-01"

    def test_same_day_is_fine(self) -> None:
        """Two thirds of the real file reports on the invoice date itself."""
        assert (
            check_invariants({"doc_date": date(2025, 4, 23), "irn_date": date(2025, 4, 23)}) is None
        )

    def test_a_late_irn_is_not_this_invariant_s_business(self) -> None:
        """Reporting 90 days late is a G-04 finding, not a malformed row.
        Quarantining it would make the breach invisible instead of visible."""
        assert (
            check_invariants({"doc_date": date(2025, 4, 1), "irn_date": date(2025, 6, 30)}) is None
        )

    def test_a_row_with_no_irn_passes(self) -> None:
        assert check_invariants({"doc_date": date(2025, 4, 23)}) is None


class TestI02AReturnCannotBeFiledBeforeItsPeriodCloses:
    def test_filed_mid_period_is_refused(self) -> None:
        found = check_invariants({"period": APRIL, "filing_date": date(2025, 4, 15)})
        assert found is not None
        assert found.invariant == "I-02"

    def test_filed_on_the_last_day_is_fine(self) -> None:
        assert check_invariants({"period": APRIL, "filing_date": date(2025, 4, 30)}) is None

    def test_filed_very_late_is_a_finding_not_a_violation(self) -> None:
        """Lateness is J-03 and P11. The row is well-formed."""
        assert check_invariants({"period": APRIL, "filing_date": date(2026, 3, 1)}) is None


class TestI04LineArithmetic:
    def test_tax_that_does_not_follow_from_the_rate_is_refused(self) -> None:
        found = check_invariants(
            {
                "taxable_value": Decimal("100000.00"),
                "rate": Decimal("18"),
                "igst": Decimal("5000.00"),
            }
        )
        assert found is not None
        assert found.invariant == "I-04"

    def test_a_rupee_of_portal_rounding_is_tolerated(self) -> None:
        assert (
            check_invariants(
                {
                    "taxable_value": Decimal("100000.00"),
                    "rate": Decimal("18"),
                    "igst": Decimal("18000.60"),
                }
            )
            is None
        )

    def test_a_split_head_line_adds_up(self) -> None:
        assert (
            check_invariants(
                {
                    "taxable_value": Decimal("100000.00"),
                    "rate": Decimal("18"),
                    "cgst": Decimal("9000.00"),
                    "sgst": Decimal("9000.00"),
                }
            )
            is None
        )

    def test_a_nil_rated_line_is_not_checked(self) -> None:
        """0 x 0 == 0 would be true and useless; a rate of nil means there is
        no arithmetic here, and asserting it quarantines every exempt supply."""
        assert (
            check_invariants({"taxable_value": Decimal("50000.00"), "rate": Decimal("0")}) is None
        )

    def test_a_line_with_no_tax_columns_at_all_is_not_checked(self) -> None:
        assert (
            check_invariants({"taxable_value": Decimal("50000.00"), "rate": Decimal("18")}) is None
        )


class TestI06TheHeadFollowsThePlaceOfSupply:
    def test_igst_on_an_intra_state_supply_is_refused(self) -> None:
        found = check_invariants({"supplier_state": "27", "pos": "27", "igst": Decimal("1000.00")})
        assert found is not None
        assert found.invariant == "I-06"

    def test_cgst_on_an_inter_state_supply_is_refused(self) -> None:
        found = check_invariants(
            {
                "supplier_state": "27",
                "pos": "09",
                "cgst": Decimal("500.00"),
                "sgst": Decimal("500.00"),
            }
        )
        assert found is not None
        assert found.invariant == "I-06"

    def test_a_correct_inter_state_line_passes(self) -> None:
        assert (
            check_invariants({"supplier_state": "27", "pos": "09", "igst": Decimal("1000.00")})
            is None
        )

    def test_a_correct_intra_state_line_passes(self) -> None:
        assert (
            check_invariants(
                {
                    "supplier_state": "27",
                    "pos": "27",
                    "cgst": Decimal("500.00"),
                    "sgst": Decimal("500.00"),
                }
            )
            is None
        )


class TestI07LedgerContinuity:
    def test_a_balance_that_does_not_carry_forward_is_refused(self) -> None:
        found = check_invariants(
            {
                "opening": Decimal("100000.00"),
                "credited": Decimal("50000.00"),
                "debited": Decimal("20000.00"),
                "closing": Decimal("500.00"),
            }
        )
        assert found is not None
        assert found.invariant == "I-07"

    def test_a_ledger_that_balances_passes(self) -> None:
        assert (
            check_invariants(
                {
                    "opening": Decimal("100000.00"),
                    "credited": Decimal("50000.00"),
                    "debited": Decimal("20000.00"),
                    "closing": Decimal("130000.00"),
                }
            )
            is None
        )


class TestI08TheReturnIsInternallyWellFormed:
    def test_net_itc_that_is_not_available_minus_reversed_is_refused(self) -> None:
        found = check_invariants(
            {
                "t4a5_igst": Decimal("100000.00"),
                "t4b2_igst": Decimal("0.00"),
                "t4c_igst": Decimal("7.00"),
            }
        )
        assert found is not None
        assert found.invariant == "I-08"

    def test_a_well_formed_table_4_passes(self) -> None:
        """The real file holds this exactly, all twelve months."""
        assert (
            check_invariants(
                {
                    "t4a5_igst": Decimal("100000.00"),
                    "t4a3_igst": Decimal("5000.00"),
                    "t4b1_igst": Decimal("2000.00"),
                    "t4c_igst": Decimal("103000.00"),
                }
            )
            is None
        )


class TestI10CounterpartyIdentity:
    def test_a_malformed_gstin_is_refused(self) -> None:
        found = check_invariants({"supplier_gstin": "27AAPCS8928R1Z9"})
        assert found is not None
        assert found.invariant == "I-10"

    def test_a_deductor_registration_passes(self) -> None:
        """The whole reason position 14 accepts [ZDC]: these are the rows
        that corroborate declared turnover, and rejecting them loses the
        evidence rather than finding anything."""
        assert check_invariants({"supplier_gstin": "24AAAGD0803M1D2"}) is None

    def test_an_absent_counterparty_is_not_a_violation(self) -> None:
        """An import line has no supplier GSTIN and cannot have one."""
        assert check_invariants({"supplier_gstin": None}) is None


class TestTheSetItself:
    def test_all_ten_are_registered_in_order(self) -> None:
        assert list(INVARIANTS) == [f"I-{n:02d}" for n in range(1, 11)]

    def test_an_empty_row_violates_nothing(self) -> None:
        """Every invariant must be conditional on the fields it reads being
        present. One that fires on an absent field quarantines the file."""
        assert check_invariants({}) is None

    def test_a_clean_outward_line_passes_every_one(self) -> None:
        clean = {
            "period": APRIL,
            "doc_date": date(2025, 4, 23),
            "irn_date": date(2025, 4, 23),
            "supplier_state": "27",
            "pos": "09",
            "taxable_value": Decimal("100000.00"),
            "rate": Decimal("18"),
            "igst": Decimal("18000.00"),
            "counterparty_gstin": "27AAPCS8928R1Z1",
        }
        assert check_invariants(clean) is None
