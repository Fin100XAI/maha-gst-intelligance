"""A bill of entry has no supplier GSTIN, and that is not a defect.

GSTR-2B sections IMPG and IMPGSEZ — and the GSTR-2A equivalent, IMPGOS —
record **import of goods**. The credit arises on a bill of entry filed with
Customs. There is no supplier GSTIN on such a line because the counterparty is
not a registered person under the Act; the line names a port code and a bill
number instead.

The platform required ``supplier_gstin`` on every inward line, so it held all
of them:

    {"Month": "May", "Port Code": "INMUN1", "Number": "9758797",
     "Taxable Value": "2708909.25", "Integrated Tax": "487604", ...}

That is Rs 4.87 lakh of integrated tax — real, available credit — dropped from
the GSTR-2B for want of a field that cannot exist. Forty-three lines across
one workbook.

The direction of the error is what makes this urgent rather than untidy. P14
compares ITC *claimed* in the GSTR-3B against ITC *available* in the GSTR-2B.
Losing available credit makes the gap look **larger** than it is, so the flag
reads higher than the facts support and a demand built on it would overstate.
This is the same shape as the eligibility defect in D-0055: credit vanishing
silently, in the direction that harms the taxpayer.
"""

from __future__ import annotations

import pytest

from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import RawSheet

GSTIN = "24ABCCS8830L1Z1"

IMPG_HEADER = [
    "Month",
    "Icegate Reference Date",
    "Port Code",
    "Number",
    "Date",
    "Taxable Value",
    "Integrated Tax",
    "Cess",
]

B2B_HEADER = [
    "Month",
    "GSTIN of supplier",
    "Trade/Legal name",
    "Invoice number",
    "Invoice Date",
    "Taxable Value",
    "Integrated Tax",
    "ITC Availability",
]


def _banner() -> list[list[object]]:
    return [
        ["", "Company Name : ", "SHREE YANTRA PANELS PRIVATE LIMITED"],
        ["", "Company GSTN : ", GSTIN],
        ["", "Return Period : ", "2025 - 2026"],
        [],
    ]


def _impg() -> RawSheet:
    return RawSheet(
        name="GSTR2B_IMPG",
        index=0,
        rows=[
            *_banner(),
            list(IMPG_HEADER),
            ["May", None, "INMUN1", "9758797", "2025-04-28", "2708909.25", "487604", "0"],
            ["June", None, "INNSA1", "9758798", "2025-05-14", "1000000.00", "180000", "0"],
        ],
    )


class TestAnImportLineIsRead:
    @pytest.mark.golden
    def test_no_import_line_is_held_for_a_supplier_that_cannot_exist(self) -> None:
        """The regression: 43 lines of one workbook, all of them this."""
        report = ingest_sheets([_impg()], filename="all_report.xlsx")
        held = [row.reason for row in report.ledger.quarantined_rows]
        assert [reason for reason in held if "supplier_gstin" in reason] == [], held

    def test_the_credit_survives_to_the_canonical_record(self) -> None:
        """The point of the fix. Rs 4.87 lakh of integrated tax, not nothing."""
        from decimal import Decimal

        report = ingest_sheets([_impg()], filename="all_report.xlsx")
        assert report.ledger.parsed == 2, [row.reason for row in report.ledger.quarantined_rows]
        igst = sum(Decimal(str(record.fields.get("igst") or 0)) for record in report.records)
        assert igst == Decimal("667604")

    def test_the_line_records_that_it_has_no_supplier_rather_than_inventing_one(self) -> None:
        report = ingest_sheets([_impg()], filename="all_report.xlsx")
        assert all(record.fields.get("supplier_gstin") is None for record in report.records)


class TestAnOrdinaryInwardLineStillNeedsItsSupplier:
    def test_a_b2b_line_without_a_supplier_is_still_held(self) -> None:
        """The exemption is for imports, not for inward lines in general. A
        B2B line with no supplier is a real defect: there is no way to tell
        whose compliance the credit rests on."""
        sheet = RawSheet(
            name="GSTR2B_B2B",
            index=0,
            rows=[
                *_banner(),
                list(B2B_HEADER),
                ["May", None, "Somebody", "INV1", "2025-05-02", "1000.00", "180", "Yes"],
            ],
        )
        report = ingest_sheets([sheet], filename="all_report.xlsx")
        held = [row.reason for row in report.ledger.quarantined_rows]
        assert any("supplier_gstin" in reason for reason in held), held
