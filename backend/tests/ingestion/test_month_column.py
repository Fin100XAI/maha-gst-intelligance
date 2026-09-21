"""A year of returns in one sheet, with the month in a column.

The portal's own monthly export names its sheets by period. A compliance tool
exporting a whole financial year does not: it puts every month of every return
in one sheet and carries the period in a ``Month`` column, written as a bare
month name -- "June", "September" -- with the financial year stated once in
the title block above.

``Period.parse`` refuses a bare month name, and is right to: September of which
year? But the file does say which. "Return Period : 2025 - 2026" sits three
rows above the header, and April to December belong to 2025 while January to
March belong to 2026.

Without this, a real filed workbook reads as 3,950 held rows out of 4,044 --
every transaction in the file, quarantined as "unrecognised period 'June'",
with nothing wrong with the file at all.
"""

from __future__ import annotations

import pytest

from app.canonical import FinancialYear, Period
from app.ingestion.banner import financial_year_from
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import RawSheet

GSTIN = "27AAHCR8533P1ZL"

HEADER = [
    "Sr. #",
    "Month",
    "GSTIN/UIN",
    "Party Name",
    "Invoice No",
    "Invoice Date",
    "Invoice Value",
    "Rate",
    "Total Taxable Value",
    "IGST Amount",
    "CGST Amount",
    "SGST Amount",
]


def _sheet() -> RawSheet:
    return RawSheet(
        name="GSTR1_B2B",
        index=0,
        rows=[
            ["", "Company Name : ", "RALGAN LIFE SCIENCES PRIVATE LIMITED"],
            ["", "Company GSTN : ", GSTIN],
            ["", "Return Period : ", "2025 - 2026"],
            ["", "Report Name : ", "GSTR1-B2B"],
            [],
            list(HEADER),
            # April belongs to the first calendar year of the financial year.
            [
                "1",
                "April",
                "27AAACK6801E1ZV",
                "Kamal Medico",
                "S000010",
                "2025-04-14",
                "33443.13",
                "18",
                "28341.65",
                "0",
                "2550.74",
                "2550.74",
            ],
            # March belongs to the second.
            [
                "2",
                "March",
                "27AAACK6801E1ZV",
                "Kamal Medico",
                "S000099",
                "2026-03-04",
                "33443.13",
                "18",
                "28341.65",
                "0",
                "2550.74",
                "2550.74",
            ],
        ],
    )


class TestTheFinancialYearIsReadFromTheTitleBlock:
    @pytest.mark.parametrize(
        ("written", "expected"),
        [
            ("2025 - 2026", 2025),
            ("2025-26", 2025),
            ("Return Period : 2024 - 2025", 2024),
            ("FY 2023-24", 2023),
        ],
    )
    def test_it_reads_the_shapes_a_tool_writes(self, written: str, expected: int) -> None:
        sheet = RawSheet(name="x", index=0, rows=[["", "Return Period : ", written]])
        found = financial_year_from([sheet])
        assert found is not None
        assert found.start_year == expected

    def test_a_workbook_with_no_year_says_so_rather_than_guessing(self) -> None:
        sheet = RawSheet(name="x", index=0, rows=[["", "Company Name : ", "Somebody"]])
        assert financial_year_from([sheet]) is None


class TestABareMonthResolvesAgainstThatYear:
    @pytest.mark.parametrize(
        ("month", "expected"),
        [
            ("April", "042025"),
            ("June", "062025"),
            ("December", "122025"),
            ("January", "012026"),
            ("March", "032026"),
            ("Sep", "092025"),
        ],
    )
    def test_april_to_december_is_the_first_year_january_to_march_the_second(
        self, month: str, expected: str
    ) -> None:
        found = Period.in_financial_year(month, FinancialYear(2025))
        assert found is not None
        assert found.mmyyyy == expected

    def test_something_that_is_not_a_month_is_refused(self) -> None:
        assert Period.in_financial_year("Total", FinancialYear(2025)) is None
        assert Period.in_financial_year("", FinancialYear(2025)) is None

    def test_a_bare_month_is_still_refused_without_a_year(self) -> None:
        """The ambiguity is real. It is resolved by evidence, not assumed."""
        with pytest.raises(ValueError, match="unrecognised period"):
            Period.parse("September")


class TestAYearOfReturnsInOneSheet:
    @pytest.mark.golden
    def test_every_row_reads(self) -> None:
        """The regression: both rows held as 'unrecognised period'."""
        report = ingest_sheets([_sheet()], filename="all_report.xlsx")
        assert report.ledger.quarantined == 0, [
            row.reason for row in report.ledger.quarantined_rows
        ]
        assert report.ledger.parsed == 2

    def test_each_row_lands_in_its_own_month(self) -> None:
        report = ingest_sheets([_sheet()], filename="all_report.xlsx")
        periods = sorted(str(record.fields["period"]) for record in report.records)
        assert periods == ["032026", "042025"]

    def test_the_filer_is_the_company_in_the_banner_not_the_customer(self) -> None:
        """ "GSTIN/UIN" on an outward sheet is the recipient, not the filer.

        Mapping it to the filer's own field overwrites the company with its
        customer -- the same defect class as reading a GSTR-2B as a GSTR-1.
        """
        report = ingest_sheets([_sheet()], filename="all_report.xlsx")
        owners = {record.fields.get("gstin") for record in report.records}
        assert owners == {GSTIN}
