"""On an inward statement the filer is the buyer, not the seller.

The head charged must follow from the place of supply: intra-State is
CGST+SGST, inter-State is IGST. To decide which, the validator needs the
*supplier's* State.

On a GSTR-1 the filer is the supplier, so the filer's State is the right
answer. On a GSTR-2B it is exactly the wrong one: the filer is the recipient,
and the supplier is named on each row. Passing the filer's State made every
genuine inter-State purchase look like an intra-State supply wrongly charged
IGST -- 529 rows of a ten-business sample, quarantined with a confident and
incorrect reason.

The direction of the error is what makes it serious. Credit the taxpayer was
entitled to vanishes from the platform's view, so the credit side reads lower
than it is, so a demand built on it reads higher than it should.
"""

from __future__ import annotations

from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import RawSheet

BUYER = "27AAGCS4521P1ZX"
#: A Karnataka supplier selling to a Maharashtra buyer. Inter-State: IGST.
KARNATAKA_SUPPLIER = "29AAFCB3456M1Z9"
#: A Maharashtra supplier selling to the same buyer. Intra-State: CGST+SGST.
MAHARASHTRA_SUPPLIER = "27AAACS1234F1ZS"

HEADER = [
    "GSTIN of supplier",
    "Trade/Legal name",
    "Invoice number",
    "Invoice Date",
    "Invoice Value",
    "Place of supply",
    "Rate (%)",
    "Taxable Value",
    "Integrated Tax",
    "Central Tax",
    "State/UT Tax",
    "Cess",
    # The column that says this is an inward statement and not an outward
    # return: only a GSTR-2B reports whether the credit is available.
    "ITC Availability",
]


def _sheet() -> RawSheet:
    return RawSheet(
        name="B2B_042025",
        index=0,
        rows=[
            ["FORM GSTR-2B  -  AUTO-DRAFTED INPUT TAX CREDIT STATEMENT"],
            [f"GSTIN {BUYER}   Shivneri Engineering Works Private Limited"],
            ["Return Period 042025"],
            [],
            list(HEADER),
            [
                KARNATAKA_SUPPLIER,
                "Bengaluru Components Private Limited",
                "BEN/042025/001",
                "2025-04-07",
                "118000.00",
                "27-Maharashtra",
                "18",
                "100000.00",
                "18000.00",
                "0.00",
                "0.00",
                "0.00",
                "Yes",
            ],
            [
                MAHARASHTRA_SUPPLIER,
                "Sahyadri Steel Suppliers",
                "SAH/042025/001",
                "2025-04-09",
                "118000.00",
                "27-Maharashtra",
                "18",
                "100000.00",
                "0.00",
                "9000.00",
                "9000.00",
                "0.00",
                "Yes",
            ],
        ],
    )


def _ingest() -> object:
    # The filer's State, which is what the upload endpoint passes.
    return ingest_sheets(
        [_sheet()], filename="g2b.xlsx", owner_gstin=BUYER, supplier_state=BUYER[:2]
    )


class TestAnInwardLineIsJudgedOnItsOwnSupplier:
    def test_an_inter_state_purchase_is_not_quarantined(self) -> None:
        """The regression. Karnataka to Maharashtra is IGST, and correct."""
        report = _ingest()
        held = [
            (row.reason_code, row.reason)
            for row in report.ledger.quarantined_rows  # type: ignore[attr-defined]
        ]
        assert held == [], f"a genuine inter-State purchase was held: {held}"
        assert report.ledger.parsed == 2  # type: ignore[attr-defined]

    def test_an_intra_state_purchase_still_reads(self) -> None:
        report = _ingest()
        records = report.records  # type: ignore[attr-defined]
        local = [r for r in records if r.fields.get("supplier_gstin") == MAHARASHTRA_SUPPLIER]
        assert len(local) == 1
        assert local[0].fields["cgst"] == local[0].fields["sgst"]

    def test_a_mischarged_inward_line_is_still_caught(self) -> None:
        """The check must not be switched off, only pointed at the right State.

        A Maharashtra supplier charging IGST to a Maharashtra buyer has
        mischaracterised the supply and diverted revenue between the Centre
        and the State. That is the thing this validation exists for.
        """
        sheet = _sheet()
        sheet.rows[6][8] = "18000.00"  # IGST
        sheet.rows[6][9] = "0.00"  # CGST
        sheet.rows[6][10] = "0.00"  # SGST
        report = ingest_sheets(
            [sheet], filename="g2b.xlsx", owner_gstin=BUYER, supplier_state=BUYER[:2]
        )
        reasons = [row.reason for row in report.ledger.quarantined_rows]
        assert len(reasons) == 1
        assert "intra-State" in reasons[0]
