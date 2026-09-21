"""The filer's name, when the workbook states it.

The platform registers a stub taxpayer for any GSTIN it meets in a return, and
labels it with the GSTIN because -- the comment said -- a return does not carry
the filer's legal name. That is true of the portal's own monthly export. It is
not true of the whole-year exports the department actually receives, every one
of which opens with:

    Company Name : RALGAN LIFE SCIENCES PRIVATE LIMITED
    Company GSTN : 27AAHCR8533P1ZL

So nine real filed workbooks produced nine taxpayers named after their own
GSTINs, on every screen, in every worklist, and in the address block of
anything drafted from them.

Reading the name from the file is not inventing it. The two rules that keep
the GSTIN honest apply unchanged to the name: only the sparse title block is
read, never a data row, and the name is taken only from the row that also
carries a valid GSTIN or one immediately around it -- so a customer named on
line one of a table can never become the filer.
"""

from __future__ import annotations

import pytest

from app.ingestion.banner import legal_name_from, owner_gstin_from
from app.ingestion.reader import RawSheet

GSTIN = "27AAHCR8533P1ZL"
NAME = "RALGAN LIFE SCIENCES PRIVATE LIMITED"


def _sheet(rows: list[list[object]]) -> RawSheet:
    return RawSheet(name="GSTR1_B2B", index=0, rows=rows)


TITLE_BLOCK: list[list[object]] = [
    ["", "Company Name : ", NAME],
    ["", "Company GSTN : ", GSTIN],
    ["", "Return Period : ", "2025 - 2026"],
    ["", "Report Name : ", "GSTR1-B2B"],
    [],
    ["Sr. #", "Month", "GSTIN/UIN", "Party Name", "Invoice No", "Invoice Date", "Rate"],
    ["1", "April", "27AAACK6801E1ZV", "Kamal Medico", "S000010", "2025-04-14", "18"],
]


class TestTheNameIsReadFromTheTitleBlock:
    def test_the_shape_the_filed_workbooks_use(self) -> None:
        assert legal_name_from([_sheet(TITLE_BLOCK)]) == NAME

    @pytest.mark.parametrize(
        "label",
        ["Company Name :", "Legal Name :", "Trade Name :", "Name of Taxpayer :", "Taxpayer Name"],
    )
    def test_the_labels_a_filing_tool_writes(self, label: str) -> None:
        rows: list[list[object]] = [["", label, NAME], ["", "Company GSTN : ", GSTIN]]
        assert legal_name_from([_sheet(rows)]) == NAME

    def test_the_gstin_is_still_read_from_the_same_block(self) -> None:
        """The name must not be won at the cost of the GSTIN."""
        assert owner_gstin_from([_sheet(TITLE_BLOCK)]) == GSTIN


class TestACustomerCanNeverBecomeTheFiler:
    def test_a_data_row_is_not_read(self) -> None:
        """Every row of a GSTR-1 names a *recipient*. Reading one would
        attribute the return to whoever happens to be on its first line --
        the same defect that made 631 taxpayers out of nine files."""
        rows: list[list[object]] = [
            ["Sr. #", "Month", "GSTIN/UIN", "Party Name", "Invoice No", "Invoice Date", "Rate"],
            ["1", "April", "27AAACK6801E1ZV", "Kamal Medico", "S000010", "2025-04-14", "18"],
        ]
        assert legal_name_from([_sheet(rows)]) is None

    def test_a_workbook_with_no_name_says_so_rather_than_guessing(self) -> None:
        rows: list[list[object]] = [["", "Company GSTN : ", GSTIN], ["", "Return Period : ", "x"]]
        assert legal_name_from([_sheet(rows)]) is None

    def test_a_label_with_no_value_is_not_a_name(self) -> None:
        rows: list[list[object]] = [["", "Company Name : ", ""], ["", "Company GSTN : ", GSTIN]]
        assert legal_name_from([_sheet(rows)]) is None

    def test_a_gstin_is_not_mistaken_for_a_name(self) -> None:
        """ "Company GSTN : 27AAH..." must not register as the legal name."""
        rows: list[list[object]] = [["", "Company GSTN : ", GSTIN]]
        assert legal_name_from([_sheet(rows)]) is None


class TestTheRegistrationCarriesTheName:
    """The point of reading it: what an officer sees in a worklist."""

    def test_the_stub_taxpayer_is_named_from_the_workbook(self) -> None:
        from app.ingestion.pipeline import ingest_sheets

        report = ingest_sheets([_sheet(TITLE_BLOCK)], filename="all_report.xlsx")
        assert report.owner_legal_name == NAME

    def test_a_workbook_without_a_name_leaves_the_report_silent(self) -> None:
        from app.ingestion.pipeline import ingest_sheets

        rows: list[list[object]] = [
            ["", "Company GSTN : ", GSTIN],
            ["", "Return Period : ", "2025 - 2026"],
            [],
            ["Sr. #", "Month", "GSTIN/UIN", "Party Name", "Invoice No", "Invoice Date", "Rate"],
            ["1", "April", "27AAACK6801E1ZV", "Kamal Medico", "S000010", "2025-04-14", "18"],
        ]
        report = ingest_sheets([_sheet(rows)], filename="all_report.xlsx")
        assert report.owner_legal_name is None
