"""A serial number is not a figure.

Table 4 of a GSTR-3B is built out of headings and subtotals as well as lines:

    (A) ITC Available (Whether in full or part)      <- heading, no figures
    (1) Import of goods                    594046  0
    ...
    Total ITC Available (A)                          <- subtotal, no figures
    (B) ITC Reversed                                 <- heading, no figures

The reader already knows a row with nothing numeric on it is structural and
skips it. On the portal's own monthly export that works. On the whole-year
exports the department receives it does not, because those carry a running
serial number in the first column:

    ['7', 'April', 'Total ITC Available (A)']

The "7" reads as money, so the row looks like a line that carries figures, so
a heading is reported as an unreadable 3B line. Five such rows a month is
sixty across a year, per filer -- and they crowd out the real failures, which
is exactly what the structural-row rule was written to prevent (D-0035).

The fix is to ask the question of the right cells. Whether a row carries a
figure is a question about the tax-head columns, never about the serial
number or the month beside it.
"""

from __future__ import annotations

from decimal import Decimal

from app.canonical import FinancialYear
from app.ingestion.reader import RawSheet
from app.ingestion.three_b import read_three_b

GSTIN = "24ABCCS8830L1Z1"

#: The real shape, from the first filed workbook: Sr. #, Month, Details, heads.
SHEET: list[list[object]] = [
    ["Company Name :", "SHREE YANTRA PANELS PRIVATE LIMITED"],
    ["Company GSTN :", GSTIN],
    ["Return Period :", "2025 - 2026"],
    ["Report Name :", "GSTR3B-ITC"],
    [],
    ["Sr. #", "Month", "Details", "Integrated Tax", "Central Tax", "State/UT Tax", "Cess"],
    ["1", "April", "(A) ITC Available (Whether in full or part)"],
    ["2", "April", "(1) Import of goods", "594046", "0"],
    ["3", "April", "(2) Import of Services", "0", "0"],
    ["4", "April", "(4) Inward supplies from ISD", "0", "0", "0", "0"],
    ["5", "April", "(5) All other ITC", "567464.64", "1157333.73", "1157333.73", "0"],
    ["6", "April", "Total ITC Available (A)"],
    ["7", "April", "(B) ITC Reversed"],
    ["8", "April", "(2) Others ITC Reversed", "0", "0", "0", "0"],
    ["9", "April", "Total ITC Reversed (B)"],
    ["10", "April", "(D) Ineligible ITC"],
]


def _outcome() -> object:
    found = read_three_b(RawSheet(name="GSTR3B_ITC", index=0, rows=SHEET), fy=FinancialYear(2025))
    assert len(found) == 1, found
    return found[0]


class TestAHeadingIsNotAFailedLine:
    def test_the_structural_rows_are_not_reported_as_unreadable(self) -> None:
        """The regression: five of these a month, sixty a year, per filer."""
        outcome = _outcome()
        unreadable = [label for _, label in outcome.unreadable_lines]  # type: ignore[attr-defined]
        assert unreadable == [], unreadable

    def test_the_real_lines_still_read(self) -> None:
        """The fix must not become "skip anything awkward"."""
        cells = _outcome().cells  # type: ignore[attr-defined]
        assert cells["t4a5_igst"] == Decimal("567464.64")
        assert cells["t4a5_cgst"] == Decimal("1157333.73")
        assert cells["t4a5_sgst"] == Decimal("1157333.73")

    def test_a_nil_line_is_still_read_as_nil(self) -> None:
        """A line showing only zeros is a real line that happens to be nil.
        Treating it as structural would turn a declared nil into silence."""
        cells = _outcome().cells  # type: ignore[attr-defined]
        assert cells["t4a4_igst"] == Decimal("0")
        assert cells["t4a4_cgst"] == Decimal("0")

    def test_a_genuinely_unrecognised_line_is_still_reported(self) -> None:
        """A line the portal invented, carrying figures, must still surface."""
        rows = [*SHEET, ["11", "April", "(9) Some line nobody has seen", "1", "2", "3", "4"]]
        outcome = read_three_b(
            RawSheet(name="GSTR3B_ITC", index=0, rows=rows), fy=FinancialYear(2025)
        )[0]
        assert [label for _, label in outcome.unreadable_lines] == ["(9) Some line nobody has seen"]
