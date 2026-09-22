"""GSTR-2A and GSTR-2B are different statements and must stay apart.

`docs/06` point 7 is unambiguous: *"Ingest both, keep them separate, and never
reconcile 3B against 2A - 2B is the statutory gate under s.16(2)(aa). 2A is
for supplier behaviour (filing status, Rule 37A); 2B is for entitlement.
Conflating them is a defect that will be found on reply."*

They were conflated here, and it was self-inflicted. D-0057 made `GSTR2A_*`
sheets classify into the `GSTR2B` *family* so that a sheet named
`GSTR2A_B2B` would stop being read as an outward return - which fixed 631
phantom taxpayers, and quietly created this.

The family is the right place for that decision: 2A and 2B carry the same
columns and want the same mapping. The **source form** is not, and it was
being defaulted rather than recorded.

What it cost, measured on the ingested SSR Marine workbook:

    GSTR-2B   4,678 rows   Rs 14,72,18,156.94
    GSTR-2A   4,772 rows   Rs 14,11,52,211.94
    combined  9,450 rows   Rs 28,83,70,368.88   <- what the engine saw

Available ITC roughly doubled, so P14 and B-01 - "ITC claimed in excess of
2B" - could not fire on any taxpayer. A silent false negative across the
whole portfolio, which is the worst shape a defect can take: nothing on
screen is wrong, there is simply nothing on screen.
"""

from __future__ import annotations

import pytest

from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import RawSheet

GSTIN = "27AAPCS8928R1Z1"

HEADER_2B = [
    "Month",
    "GSTIN of supplier",
    "Trade/Legal name",
    "Invoice number",
    "Invoice Date",
    "Invoice Value",
    "Place of supply",
    "Rate",
    "Taxable Value",
    "Integrated Tax",
    "ITC Availability",
]

HEADER_2A = [
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
    "GSTR-3B Filing Status",
]


def _banner() -> list[list[object]]:
    return [
        ["", "Company Name : ", "SSR MARINE SERVICES PRIVATE LIMITED"],
        ["", "Company GSTN : ", GSTIN],
        ["", "Return Period : ", "2025 - 2026"],
        [],
    ]


def _sheet(name: str, header: list[str], last: str) -> RawSheet:
    return RawSheet(
        name=name,
        index=0,
        rows=[
            *_banner(),
            list(header),
            # Inter-State: a Gujarat supplier into Maharashtra, so the tax
            # is IGST and the line arithmetic holds. A fixture that fails an
            # invariant tests the invariant, not the thing under test.
            [
                "October",
                "24ABVFA2224Q1Z0",
                "Azimuth Maritime",
                "AZ/25-26/05",
                "2025-10-04",
                "3256800",
                "27",
                "18",
                "2760000",
                "496800",
                last,
            ],
        ],
    )


def _forms(name: str, header: list[str], last: str) -> set[str]:
    report = ingest_sheets([_sheet(name, header, last)], filename="all_report.xlsx")
    return {str(record.fields.get("source_form")) for record in report.records}


class TestTheSourceFormRecordsWhichStatement:
    @pytest.mark.golden
    def test_a_2a_sheet_is_recorded_as_gstr2a(self) -> None:
        """The regression: 13,501 GSTR-2A rows stored as GSTR2B."""
        assert _forms("GSTR2A_B2B", HEADER_2A, "Y") == {"GSTR2A"}

    def test_a_2b_sheet_is_recorded_as_gstr2b(self) -> None:
        assert _forms("GSTR2B_B2B", HEADER_2B, "Yes") == {"GSTR2B"}

    @pytest.mark.parametrize(
        ("sheet", "expected"),
        [
            ("GSTR2A_CDN", "GSTR2A"),
            ("GSTR2A_B2BA", "GSTR2A"),
            ("GSTR2A_IMPGOS", "GSTR2A"),
            ("GSTR2B_CDNR", "GSTR2B"),
            ("GSTR2B_B2BA", "GSTR2B"),
            ("GSTR2B_IMPG", "GSTR2B"),
        ],
    )
    def test_every_section_of_both_statements(self, sheet: str, expected: str) -> None:
        header = HEADER_2A if expected == "GSTR2A" else HEADER_2B
        assert _forms(sheet, header, "Y") == {expected}


class TestTheFamilyDecisionIsUnchanged:
    def test_a_2a_sheet_is_still_read_as_an_inward_statement(self) -> None:
        """D-0057 stands: the columns of 2A and 2B are the same and want the
        same mapping. Only the source form was wrong, and undoing the family
        decision would bring back 631 phantom taxpayers."""
        from app.ingestion.sniffer import classify_sheet

        assert classify_sheet("GSTR2A_B2B", HEADER_2A, [HEADER_2A]).family == "GSTR2B"

    def test_the_filer_is_still_the_company_in_the_banner(self) -> None:
        report = ingest_sheets([_sheet("GSTR2A_B2B", HEADER_2A, "Y")], filename="all_report.xlsx")
        assert {record.fields.get("gstin") for record in report.records} == {GSTIN}
