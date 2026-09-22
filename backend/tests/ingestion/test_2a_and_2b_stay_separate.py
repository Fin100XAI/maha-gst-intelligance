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

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import Period
from app.engine.records import InwardRecord, TaxpayerData, TaxpayerProfile
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


class TestTheRulesReadTheLabelToo:
    """Recording which statement a row came from only helps if something asks.

    The first fix to this defect stopped at the ingestion layer: the source
    form was recorded correctly and then nothing downstream read it. That half
    was invisible on the reference workbook for a reason worth writing down -
    a GSTR-2A export carries a `GSTR-3B Filing Status` column where 2B carries
    `ITC Availability`, so every 2A row arrives with `itc_available` unset and
    was already failing the bucket test by accident.

    Accident is not a control. A 2A export from a tool that did emit an
    availability column would have doubled the credit the Rule 88D comparison
    is made against, and nothing would have said so.
    """

    @staticmethod
    def _row(source_form: str, *, available: bool | None) -> InwardRecord:
        return InwardRecord(
            gstin=GSTIN,
            period=Period.parse("102025"),
            section="B2B",
            doc_type="INVOICE",
            doc_no="AZ/25-26/05",
            doc_date=date(2025, 10, 4),
            supplier_gstin="24ABVFA2224Q1Z0",
            pos="27",
            rate=Decimal("18"),
            taxable_value=Decimal("2760000.00"),
            igst=Decimal("496800.00"),
            cgst=Decimal("0.00"),
            sgst=Decimal("0.00"),
            cess=Decimal("0.00"),
            itc_available=available,
            source_form=source_form,
        )

    @pytest.mark.golden
    def test_a_2a_line_is_not_credit_available_under_2b(self) -> None:
        """2B is the statutory gate under s.16(2)(aa). A 2A line is evidence
        about the supplier, never entitlement - even when it says available."""
        assert self._row("GSTR2A", available=True).counts_toward_2b_available is False
        assert self._row("GSTR2B", available=True).counts_toward_2b_available is True

    def test_a_2a_only_file_cannot_answer_an_entitlement_question(self) -> None:
        """It must abstain, not compare a 3B claim against nothing and report
        the whole of it as excess. `requires=("gstr2b",)` has to mean the
        statement, not the family."""
        data = TaxpayerData(
            profile=TaxpayerProfile(
                gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
            ),
            inward=(self._row("GSTR2A", available=None),),
        )
        present = data.present_datasets()
        assert "gstr2a" in present
        assert "gstr2b" not in present

    def test_a_2b_file_answers_it_and_says_2a_is_missing(self) -> None:
        data = TaxpayerData(
            profile=TaxpayerProfile(
                gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
            ),
            inward=(self._row("GSTR2B", available=True),),
        )
        present = data.present_datasets()
        assert "gstr2b" in present
        assert "gstr2a" not in present
