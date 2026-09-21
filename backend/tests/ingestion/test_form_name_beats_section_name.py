"""A sheet named for its *form* outranks a sheet named for its *section*.

B2B is a section. It exists in GSTR-1, in GSTR-2A and in GSTR-2B alike, so
the word settles nothing about which return the sheet belongs to. GSTR2A
names the form, and that settles everything.

The platform scored them the same. A sheet called ``GSTR2A_B2B`` therefore
read as an outward return, its ``GSTIN of supplier`` column was taken for the
filer's own GSTIN, and every supplier on every purchase register was
registered as a taxpayer in its own right: **631 taxpayers out of nine filed
workbooks**.

Downstream that is not a cosmetic fault. Six hundred phantom filers each
arrive with one return and no counterpart, so the reconciliation rules score
them as non-filers, the portfolio figures are computed over a population
twenty times too large, and the four genuine taxpayers with real gaps are
buried among them.

This is the third instance of one defect class -- a tie broken by declaration
order rather than by evidence. The other two were header breadth (D-0051) and
GSTR-2B read as GSTR-1 (D-0055).
"""

from __future__ import annotations

import pytest

from app.ingestion.sniffer import classify_sheet

#: The real header of the GSTR-2A sheets in the filed workbooks. Note what is
#: absent: no "ITC Availability" column, which is the decisive token that
#: rescues a GSTR-2B. 2A has nothing in its columns that a GSTR-1 lacks.
GSTR2A_HEADER = [
    "Sr. #",
    "Month",
    "GSTIN of supplier",
    "Name of Party",
    "Invoice No.",
    "Invoice Date",
    "Invoice Value",
    "Place of supply",
    "Rate",
    "Taxable Value",
    "Integrated Tax",
    "Central Tax",
    "State/UT Tax",
]

GSTR1_HEADER = [
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


class TestAnInwardStatementIsNotAnOutwardReturn:
    @pytest.mark.golden
    @pytest.mark.parametrize(
        "sheet_name", ["GSTR2A_B2B", "GSTR2A_CDN", "GSTR2A_B2BA", "GSTR-2A B2B"]
    )
    def test_a_2a_sheet_reads_as_inward_however_its_section_is_named(self, sheet_name: str) -> None:
        """The regression: every one of these read as GSTR1."""
        found = classify_sheet(sheet_name, GSTR2A_HEADER, [GSTR2A_HEADER])
        assert found.family == "GSTR2B", (
            f"{sheet_name} read as {found.family}: the section name beat the "
            f"form name, so each supplier becomes a filer -- {found.evidence}"
        )

    def test_the_evidence_names_the_form_so_an_officer_can_see_why(self) -> None:
        found = classify_sheet("GSTR2A_B2B", GSTR2A_HEADER, [GSTR2A_HEADER])
        assert any(item.startswith("form-name:") for item in found.evidence), found.evidence


class TestTheFixDoesNotDragOutwardSheetsWithIt:
    """A correction that broke GSTR-1 would trade one silent fault for another."""

    @pytest.mark.parametrize("sheet_name", ["GSTR1_B2B", "GSTR1_CDN", "GSTR-1 B2B", "GSTR1_HSN"])
    def test_a_gstr1_sheet_still_reads_as_outward(self, sheet_name: str) -> None:
        found = classify_sheet(sheet_name, GSTR1_HEADER, [GSTR1_HEADER])
        assert found.family == "GSTR1", found.evidence

    def test_a_bare_section_name_still_falls_back_to_its_columns(self) -> None:
        """No form named at all: the columns decide, as they always did."""
        found = classify_sheet("b2b_042025", GSTR1_HEADER, [GSTR1_HEADER])
        assert found.family == "GSTR1", found.evidence

    def test_a_2b_sheet_is_unaffected(self) -> None:
        header = [*GSTR2A_HEADER, "ITC Availability"]
        found = classify_sheet("GSTR2B_B2B", header, [header])
        assert found.family == "GSTR2B", found.evidence
