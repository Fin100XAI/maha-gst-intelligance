"""A GSTR-3B holds several tables, and they are not the same shape.

Table 3.1 has a taxable-value column between the label and the tax heads.
Table 4 does not -- it is label, IGST, CGST, SGST, Cess. Both sit in one sheet,
because that is how the portal writes the return.

The reader found the first header row and used its column map for the whole
sheet. Everything in Table 4 therefore shifted one column left: the CGST figure
was read as IGST, the SGST figure as CGST, and the last head was lost. Credit
of Rs 2,61,000 landed under the wrong government.

Nothing about that is visible downstream. The figures are well-formed, they
reconcile against nothing that would catch them, and the first sign of trouble
would be a demand apportioned wrongly between the Centre and the State.
"""

from __future__ import annotations

from decimal import Decimal

from app.ingestion.reader import RawSheet
from app.ingestion.three_b import read_three_b

GSTIN = "27AAGCS4521P1ZX"

#: Table 3.1: label, taxable, then the four heads.
#: Table 4:   label, then the four heads. One column narrower.
SHEET: list[list[object]] = [
    ["FORM GSTR-3B"],
    [f"GSTIN {GSTIN}   Shivneri Engineering Works Private Limited"],
    ["Period 042025"],
    [],
    [
        "Nature of Supplies",
        "Total Taxable value",
        "Integrated Tax",
        "Central Tax",
        "State/UT Tax",
        "Cess",
    ],
    [
        "(a) Outward taxable supplies (other than zero rated, nil rated and exempted)",
        "4200000.00",
        "378000.00",
        "189000.00",
        "189000.00",
        "0.00",
    ],
    ["(b) Outward taxable supplies (zero rated)", "0.00", "0.00", "0.00", "0.00", "0.00"],
    [],
    ["4. Eligible ITC"],
    ["Details", "Integrated Tax", "Central Tax", "State/UT Tax", "Cess"],
    ["(1) Import of goods", "0.00", "0.00", "0.00", "0.00"],
    ["(5) All other ITC", "0.00", "261000.00", "261000.00", "0.00"],
]


def _read() -> dict[str, Decimal]:
    outcomes = read_three_b(RawSheet(name="GSTR3B_042025", index=0, rows=SHEET))
    assert len(outcomes) == 1, "a sheet with no Month column is one return"
    return outcomes[0].cells


class TestEachTableIsReadOnItsOwnColumns:
    def test_table_31_is_unaffected(self) -> None:
        cells = _read()
        assert cells["t31a_taxable"] == Decimal("4200000.00")
        assert cells["t31a_igst"] == Decimal("378000.00")
        assert cells["t31a_cgst"] == Decimal("189000.00")
        assert cells["t31a_sgst"] == Decimal("189000.00")

    def test_table_4_credit_lands_under_the_right_head(self) -> None:
        """The regression. IGST is nil here; CGST and SGST carry the credit."""
        cells = _read()
        assert cells["t4a5_igst"] == Decimal("0.00"), (
            "Table 4 was read on Table 3.1's columns, so the CGST figure was "
            "taken for IGST -- credit apportioned to the wrong government"
        )
        assert cells["t4a5_cgst"] == Decimal("261000.00")
        assert cells["t4a5_sgst"] == Decimal("261000.00")

    def test_a_nil_line_in_table_4_stays_nil(self) -> None:
        cells = _read()
        assert cells["t4a1_igst"] == Decimal("0.00")
        assert cells["t4a1_cgst"] == Decimal("0.00")


class TestStructuralRowsAreNotDataLines:
    def test_a_section_title_is_not_reported_as_unreadable(self) -> None:
        """ "4. Eligible ITC" is a heading. It is not a line that failed to read.

        D-0035 holds that an unrecognised 3B line is quarantined individually
        and named, which is right for a line carrying figures. A title carries
        none, and reporting it as unreadable buries the real failures among
        two structural rows per month -- twenty-four across a year.
        """
        outcome = read_three_b(RawSheet(name="GSTR3B_042025", index=0, rows=SHEET))[0]
        unreadable = [label for _, label in outcome.unreadable_lines]
        assert "4. Eligible ITC" not in unreadable
        assert "Details" not in unreadable

    def test_a_genuinely_unreadable_line_is_still_reported(self) -> None:
        """The distinction must not become an excuse to drop real lines."""
        rows = [*SHEET, ["(9) Some line the portal invented", "1.00", "2.00", "3.00", "4.00"]]
        outcome = read_three_b(RawSheet(name="GSTR3B_042025", index=0, rows=rows))[0]
        assert [label for _, label in outcome.unreadable_lines] == [
            "(9) Some line the portal invented"
        ]


class TestALineIsMatchedThroughAMisspelling:
    """Real returns carry typos, and the return is still the return.

    The first nine filed workbooks all write "exemted" for "exempted" in
    Table 3.1(a) and 3.1(c) -- the same misspelling in every one, so it is the
    filing tool's, not a slip. Exact matching lost those two lines a month:
    twenty-four a year, and 3.1(a) is the outward figure that twenty-one of
    the fifty-seven rules compare against.
    """

    def test_the_misspelling_in_the_filed_files_still_resolves(self) -> None:
        from app.ingestion.three_b import _label_to_field

        assert (
            _label_to_field(
                "(a) Outward Taxable Supplies (other than Zero rated,nil rated and exemted)"
            )
            == "t31a"
        )
        assert _label_to_field("(c) Other outward Supplies(Nil rated, exemted)") == "t31c"

    def test_the_correctly_spelled_form_still_resolves(self) -> None:
        from app.ingestion.three_b import _label_to_field

        assert (
            _label_to_field(
                "(a) Outward taxable supplies (other than zero rated, nil rated and exempted)"
            )
            == "t31a"
        )

    def test_a_line_that_is_not_a_3b_line_is_still_refused(self) -> None:
        """Fuzzy matching must not become matching anything to something."""
        from app.ingestion.three_b import _label_to_field

        assert _label_to_field("Total") is None
        assert _label_to_field("Grand total for the year") is None
