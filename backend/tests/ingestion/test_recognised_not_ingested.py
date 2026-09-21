"""Sheets the platform recognises but has nowhere to put.

A filed workbook carries thirty-two sheets. The platform has a canonical table
for most of them. For four it does not: GSTR-1 Table 13 (the document-series
register), the HSN summary, the challan register, and the GSTR-7 TDS/TCS
statements.

Before this, those sheets fell through to whichever fingerprint scored
highest and their rows failed one field at a time. `GSTR1_DocIssued` was read
as a transaction sheet and every row was held with:

    not a numeric literal after cleaning

because ``Sr. No. From`` is ``ST/2526/0000001``, an invoice series, not a
number. Four hundred and three rows of one workbook, each reported as though
the department's file were malformed. It is not malformed. It is a perfectly
good Table 13 and the platform has no table for it.

The distinction is the point. "We could not read your file" and "we have not
built this yet" are different statements, only one of them is true, and only
one of them tells an officer what to do next. Law 5 still holds -- every row
lands somewhere with a reason -- but the reason now names the form and says
the gap is ours.
"""

from __future__ import annotations

import pytest

from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import RawSheet
from app.ingestion.sniffer import classify_sheet

DOC_ISSUED = [
    "Sr. #",
    "Month",
    "Nature of Document",
    "Sr. No. From",
    "Sr. No. To",
    "Total Number",
    "Cancelled",
    "Net Issued",
]

DOC_ROWS: list[list[object]] = [
    ["", "Company Name : ", "SHREE YANTRA PANELS PRIVATE LIMITED"],
    ["", "Company GSTN : ", "24ABCCS8830L1Z1"],
    ["", "Return Period : ", "2025 - 2026"],
    [],
    list(DOC_ISSUED),
    [
        "1",
        "April",
        "Invoice for outward supply",
        "ST/2526/0000001",
        "ST/2526/0000051",
        "51",
        "0",
        "51",
    ],
    ["2", "April", "Credit Note", "CNG/2324/000001", "CNG/2324/000001", "1", "0", "1"],
]


class TestTheSheetIsRecognisedRatherThanMisread:
    @pytest.mark.parametrize(
        "sheet_name", ["GSTR1_DocIssued", "GSTR1_HSNSummary", "Challan", "GSTR-7 TDS", "GSTR-7 TCS"]
    )
    def test_it_is_classified_as_a_form_with_no_dataset(self, sheet_name: str) -> None:
        found = classify_sheet(sheet_name, DOC_ISSUED, [DOC_ISSUED])
        assert found.family == "NOT_INGESTED", (sheet_name, found.family, found.evidence)

    def test_a_transaction_sheet_is_not_swept_up_with_them(self) -> None:
        """The fix must not become "anything awkward is out of scope"."""
        header = [
            "Sr. #",
            "Month",
            "GSTIN/UIN",
            "Party Name",
            "Invoice No",
            "Invoice Date",
            "Rate",
            "Total Taxable Value",
            "IGST Amount",
        ]
        assert classify_sheet("GSTR1_B2B", header, [header]).family == "GSTR1"


class TestTheReasonNamesTheGapAsOurs:
    def test_the_rows_are_held_with_a_reason_that_does_not_blame_the_file(self) -> None:
        report = ingest_sheets(
            [RawSheet(name="GSTR1_DocIssued", index=0, rows=DOC_ROWS)],
            filename="all_report.xlsx",
        )
        reasons = {row.reason for row in report.ledger.quarantined_rows}
        assert reasons, "nothing was held at all"
        for reason in reasons:
            assert "numeric literal" not in reason, reason
            assert "no dataset" in reason.lower() or "not ingested" in reason.lower(), reason

    def test_the_rows_still_reconcile(self) -> None:
        """Law 5: in = parsed + held + duplicates, whatever the sheet is."""
        report = ingest_sheets(
            [RawSheet(name="Challan", index=0, rows=DOC_ROWS)], filename="all_report.xlsx"
        )
        ledger = report.ledger
        assert ledger.rows_in == ledger.parsed + ledger.quarantined + ledger.duplicates

    def test_nothing_from_such_a_sheet_is_parsed_into_a_canonical_table(self) -> None:
        """A sheet with no dataset must not quietly land in someone else's."""
        report = ingest_sheets(
            [RawSheet(name="GSTR1_DocIssued", index=0, rows=DOC_ROWS)],
            filename="all_report.xlsx",
        )
        assert report.records == []


class TestAThreeBTableWithNoFieldMap:
    """The filed workbooks split one GSTR-3B across six sheets.

    Supplies and ITC map to fields. Payment of Tax, Interest and Late Fees,
    Nil-rated and the document summary do not -- the canonical Return3B has
    no columns for Table 6.1 or Table 5.1, and adding them is a schema
    decision, not a bug fix.

    What was wrong was the reason. Those sheets were reported as "GSTR-3B
    could not be read: missing period", which blames a file that states its
    period on every single row, and sends an officer looking for a fault that
    is not there.
    """

    def test_an_unmapped_table_is_not_reported_as_a_missing_period(self) -> None:
        sheet = RawSheet(
            name="GSTR3B_PaymentofTax",
            index=0,
            rows=[
                ["", "Company Name : ", "SHREE YANTRA PANELS PRIVATE LIMITED"],
                ["", "Company GSTN : ", "24ABCCS8830L1Z1"],
                ["", "Return Period : ", "2025 - 2026"],
                [],
                ["Sr. #", "Month", "Nature of Supplies", "Tax Payable", "Paid in Cash"],
                ["1", "April", "Integrated Tax", "5501213.65", "5501213.65"],
            ],
        )
        report = ingest_sheets([sheet], filename="all_report.xlsx")
        held = [row.reason for row in report.ledger.quarantined_rows]
        assert held, "nothing was held at all"
        for reason in held:
            assert "missing period" not in reason, reason
            assert "no field map" in reason, reason
