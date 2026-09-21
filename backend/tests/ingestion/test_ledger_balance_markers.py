"""An opening balance is not a transaction.

The electronic cash ledger opens and closes every month with a marker row:

    ['1', 'April', '-', 'Opening Balance', '0', '0', ...]

It carries no date, because there is no date: it is the state of the ledger
before anything happened, not something that happened. The platform required
``as_on`` on every ledger row and held these with

    required field(s) absent: as_on

Two rows a month, twenty-four a year, per filer -- 192 across the nine filed
workbooks, every one reported as a missing field in the department's file.
The field is not missing. The row is not a movement.

The existing trailing-totals rule is the same idea and does not reach these:
it scans the first three cells, and the marker sits in the Description column,
eighth along.

What the fix must not do is start skipping real movements. A ledger row
describing a deposit is a movement even if the word "balance" appears
somewhere else on it, so the marker is matched on the description cell's whole
value, not on a substring of the row.
"""

from __future__ import annotations

import pytest

from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import RawSheet

GSTIN = "24ABCCS8830L1Z1"

HEADER = [
    "Sr. #",
    "Month",
    "Date of Deposit/Debit",
    "Reference No.",
    "Tax Preiod if Applicable",
    "Description",
    "Transaction Type (Debit/Credit)",
    "Amount (Dr/Cr) Integrated Tax",
    "Amount (Dr/Cr) Central Tax",
    "Amount (Dr/Cr) State Tax",
    "Amount (Dr/Cr) Cess",
    "Balance Integrated Tax",
    "Balance Central Tax",
]


def _sheet() -> RawSheet:
    return RawSheet(
        name="CashLedger",
        index=0,
        rows=[
            ["", "Company Name : ", "SHREE YANTRA PANELS PRIVATE LIMITED"],
            ["", "Company GSTN : ", GSTIN],
            ["", "Return Period : ", "2025 - 2026"],
            [],
            list(HEADER),
            ["1", "April", "-", None, "-", "Opening Balance", None, "0", "0", "0", "0", "0", "0"],
            [
                "2",
                "April",
                "2025-05-19",
                "189907267",
                "-",
                "Amount deposited",
                "Credit",
                "62312",
                "19979",
                "19979",
                "0",
                "62312",
                "19979",
            ],
            ["3", "April", "-", None, "-", "Closing Balance", None, "0", "0", "0", "0", "0", "0"],
        ],
    )


def _held() -> list[str]:
    report = ingest_sheets([_sheet()], filename="all_report.xlsx")
    return [row.reason for row in report.ledger.quarantined_rows]


class TestABalanceMarkerIsNotAMissingField:
    @pytest.mark.golden
    def test_no_row_is_held_for_a_date_that_was_never_due(self) -> None:
        """The regression: 192 rows across nine workbooks, all of them this."""
        assert [reason for reason in _held() if "as_on" in reason] == []

    def test_the_marker_rows_are_named_for_what_they_are(self) -> None:
        reasons = [reason for reason in _held() if "balance" in reason.lower()]
        assert len(reasons) == 2, _held()

    def test_the_real_movement_still_parses(self) -> None:
        """The fix must not become "skip anything without a date"."""
        report = ingest_sheets([_sheet()], filename="all_report.xlsx")
        assert report.ledger.parsed == 1, [row.reason for row in report.ledger.quarantined_rows]

    def test_the_rows_still_reconcile(self) -> None:
        ledger = ingest_sheets([_sheet()], filename="all_report.xlsx").ledger
        assert ledger.rows_in == ledger.parsed + ledger.quarantined + ledger.duplicates
