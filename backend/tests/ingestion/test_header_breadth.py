"""A header row that names fifteen columns beats one that names a fragment.

Every term in the header score was a ratio, and a ratio ignores width. A
one-cell banner line reading ``GSTIN 27AAJCA3456N1Z8  Aurangabad Auto`` scored
100 on every component -- it is entirely non-null, entirely textual, its single
label fuzzy-matches "gstin", and one column of text below it is perfectly
type-consistent -- and tied the real fifteen-column header underneath it. Ties
keep the first candidate, so the banner won and the whole file read as garbage:
every row held for a missing period and a missing taxable value.

It surfaced on a CSV, because a CSV has no sheet structure to fall back on, but
nothing about the bug was CSV-specific.
"""

from __future__ import annotations

from app.ingestion.header import detect_header

BANNER = ["GSTIN 27AAJCA3456N1Z8  Aurangabad Auto Components Private Limited"]

HEADER = [
    "GSTIN/UIN of Recipient",
    "Receiver Name",
    "Invoice Number",
    "Invoice date",
    "Invoice Value",
    "Place Of Supply",
    "Reverse Charge",
    "Invoice Type",
    "Rate",
    "Taxable Value",
    "Integrated Tax",
    "Central Tax",
    "State/UT Tax",
    "Cess",
    "Return Period",
]

DATA = [
    [
        "27AABCU9603R1ZN",
        "Maharashtra Auto Components Ltd",
        "AUR/042025/001",
        "2025-04-04",
        "2271500.00",
        "27-Maharashtra",
        "N",
        "Regular B2B",
        "18",
        "1925000.00",
        "0.00",
        "173250.00",
        "173250.00",
        "0.00",
        "042025",
    ],
]


def _rows(*, banner_first: bool) -> list[list[object]]:
    body = [list(row) for row in DATA * 4]
    if banner_first:
        return [list(BANNER), list(HEADER), *body]
    return [list(HEADER), *body]


class TestBreadthBeatsAFragment:
    def test_a_one_cell_banner_does_not_win_the_header(self) -> None:
        """The regression. Row 0 is a banner; row 1 is the header."""
        found = detect_header(_rows(banner_first=True), "GSTR1")
        assert found is not None
        assert found.row_index == 1, (
            f"chose row {found.row_index} "
            f"({found.headers[:2]}) -- a banner line beat a fifteen-column header"
        )
        assert found.headers[0] == "GSTIN/UIN of Recipient"
        assert len(found.headers) == len(HEADER)

    def test_the_header_is_still_found_without_a_banner(self) -> None:
        found = detect_header(_rows(banner_first=False), "GSTR1")
        assert found is not None
        assert found.row_index == 0
        assert found.is_confident

    def test_a_wide_header_scores_above_a_narrow_one(self) -> None:
        """Stated directly, because the fix is a change to the score."""
        wide = detect_header(_rows(banner_first=False), "GSTR1")
        narrow = detect_header(
            [["Taxable Value"], ["1925000.00"], ["1925000.00"], ["1925000.00"]], "GSTR1"
        )
        assert wide is not None
        assert narrow is not None
        assert wide.score > narrow.score

    def test_a_confident_header_stays_confident(self) -> None:
        """The fix must not push real headers below the confidence floor."""
        found = detect_header(_rows(banner_first=True), "GSTR1")
        assert found is not None
        assert found.is_confident

    def test_a_two_row_merged_header_still_merges(self) -> None:
        """The portal's group heading above the real one must survive the change."""
        group: list[object] = [None] * len(HEADER)
        group[2] = "Invoice details"
        group[10] = "Tax"
        rows: list[list[object]] = [
            ["COMMERCIAL TAXES DEPARTMENT, GOVERNMENT OF MAHARASHTRA"],
            [],
            group,
            list(HEADER),
            *[list(row) for row in DATA * 4],
        ]
        found = detect_header(rows, "GSTR1")
        assert found is not None
        assert found.row_index == 3
        assert "GSTIN/UIN of Recipient" in found.headers[0]
