"""B-08, and the three exclusions that are the whole check.

The true positives are easy. The false positives are the reason this is hard:
grouping every inward row by supplier and document number on the reference
workbook finds **4,636** groups with more than one row, out of 9,450 rows -
practically the entire file. Every one of them is a legitimate repeat, and a
naive implementation would have raised 4,636 demands for duplicate credit.

Three exclusions take it to zero, and each removes a different kind of
legitimate repeat. Every one of them has a test here, because each is one line
of code standing between this platform and a portfolio-wide false positive.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, FindingStatus, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import InwardRecord, TaxpayerData, TaxpayerProfile
from app.engine.registry import RULES
from app.engine.runner import run_for_taxpayer  # noqa: F401  # registers every check

GSTIN = "27AAPCS8928R1Z1"
SUPPLIER = "27ATAPD1787A1Z5"
OTHER_SUPPLIER = "24ABVFA2224Q1Z0"


def _row(
    doc_no: str,
    *,
    month: int,
    form: str = "GSTR2B",
    section: str = "B2B",
    doc_type: str = "INVOICE",
    supplier: str = SUPPLIER,
    taxable: str = "233800.00",
    tax: str = "42084.00",
) -> InwardRecord:
    year = 2025 if month >= 4 else 2026
    return InwardRecord(
        gstin=GSTIN,
        period=Period(year, month),
        section=section,
        doc_type=doc_type,
        doc_no=doc_no,
        doc_date=date(year, month, 4),
        supplier_gstin=supplier,
        pos="27",
        rate=Decimal("18"),
        taxable_value=Decimal(taxable),
        igst=Decimal(tax),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        source_form=form,
        itc_available=True,
        row_id=f"{form}-{section}-{doc_no}-{month}",
    )


def _ctx(rows: tuple[InwardRecord, ...]) -> RuleContext:
    return RuleContext(
        data=TaxpayerData(
            profile=TaxpayerProfile(
                gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
            ),
            inward=rows,
        ),
        fy=FinancialYear(2025),
        snapshot_id="b08",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


def _b08(rows: tuple[InwardRecord, ...]):  # type: ignore[no-untyped-def]
    (finding,) = RULES["B-08"].function(_ctx(rows))
    return finding


class TestTheSameInvoiceClaimedTwice:
    @pytest.mark.golden
    def test_one_invoice_in_two_periods_is_the_finding(self) -> None:
        finding = _b08((_row("9936", month=7), _row("9936", month=8)))
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == Decimal("42084.00")

    def test_the_earliest_claim_stands_and_the_rest_is_the_excess(self) -> None:
        """Three claims on one invoice is two duplicates, not three."""
        finding = _b08((_row("9936", month=7), _row("9936", month=8), _row("9936", month=9)))
        assert finding.delta.abs_total == Decimal("84168.00")
        assert finding.extra["duplicate_claims"] == 2

    def test_the_document_and_supplier_are_named(self) -> None:
        finding = _b08((_row("9936", month=7), _row("9936", month=8)))
        assert finding.extra["largest_document"] == "9936"
        assert finding.extra["largest_supplier"] == SUPPLIER
        assert finding.narrative is not None
        assert "9936" in finding.narrative

    def test_two_suppliers_using_one_number_are_two_invoices(self) -> None:
        """A document number is unique only within a supplier's own series."""
        finding = _b08((_row("9936", month=7), _row("9936", month=8, supplier=OTHER_SUPPLIER)))
        assert finding.status is FindingStatus.CLEAR


class TestTheThreeExclusions:
    @pytest.mark.golden
    def test_the_same_document_in_2a_and_2b_is_one_invoice(self) -> None:
        """Two statements of one document, not two claims. On the reference
        workbook J03 pairs 4,404 of them, and counting those as duplicates is
        how a check reports the whole file."""
        finding = _b08((_row("9936", month=7), _row("9936", month=7, form="GSTR2A")))
        assert finding.status is FindingStatus.CLEAR

    @pytest.mark.golden
    def test_an_amendment_repeating_its_originals_number_is_not_a_claim(self) -> None:
        """A B2BA row names the document it corrects, and on the portal's own
        2B export it carries that number as its own. Four of the five
        surviving groups on the reference workbook were exactly this."""
        finding = _b08(
            (_row("9936", month=7), _row("9936", month=8, section="AMENDMENT", taxable="1.00"))
        )
        assert finding.status is FindingStatus.CLEAR

    @pytest.mark.golden
    def test_a_credit_note_carrying_the_invoice_number_is_not_a_claim(self) -> None:
        """The fifth surviving group. A note adjusts the invoice it names; it
        does not claim it again."""
        finding = _b08(
            (
                _row("IN11627", month=7),
                _row("IN11627", month=9, section="CDNR", doc_type="CREDIT_NOTE"),
            )
        )
        assert finding.status is FindingStatus.CLEAR

    def test_a_debit_note_is_excluded_for_the_same_reason(self) -> None:
        finding = _b08(
            (
                _row("IN11627", month=7),
                _row("IN11627", month=9, section="CDNR", doc_type="DEBIT_NOTE"),
            )
        )
        assert finding.status is FindingStatus.CLEAR


class TestWhatOnePeriodCannotTell:
    def test_two_rate_lines_of_one_invoice_are_not_a_duplicate(self) -> None:
        """One invoice can carry an 18% line and a 5% line. Both are the same
        claim, and both sit in the same period - which is why the test is
        across periods rather than across rows."""
        finding = _b08(
            (
                _row("9936", month=7, taxable="100000.00", tax="18000.00"),
                _row("9936", month=7, taxable="50000.00", tax="2500.00"),
            )
        )
        assert finding.status is FindingStatus.CLEAR

    def test_a_2b_only_file_with_no_repeats_is_clear_not_dark(self) -> None:
        finding = _b08((_row("9936", month=7), _row("9945", month=8)))
        assert finding.status is FindingStatus.CLEAR

    def test_a_file_with_no_2b_abstains(self) -> None:
        """2B is the statutory gate under s.16(2)(aa). Without it there is no
        claim to test, and reporting no duplicates would be a statement about
        a statement nobody uploaded."""
        finding = _b08((_row("9936", month=7, form="GSTR2A"),))
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert "GSTR-2B" in finding.missing_inputs[0]
