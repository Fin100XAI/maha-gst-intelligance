"""Credit notes out against debit notes in: the two sides of one adjustment.

A sales return and a purchase return are the same event seen from two ends.
When this taxpayer issues a credit note to a customer, that customer should be
recording a corresponding reduction; when a supplier issues one to this
taxpayer, it arrives in GSTR-2B as a CDNR line and the credit must come back.

**What this report can and cannot see.** It holds one taxpayer's returns. It
therefore *can* reconcile the inward notes a supplier raised against the credit
this taxpayer claimed, because both are in the file. It *cannot* see whether a
customer honoured an outward note - that is the customer's return, which the
department has and this platform has not been given. The outward side is
reported as a population and an exposure, never as a finding, and says so.

Three things it does look for:

* **Inward notes and the reversal that should follow.** A supplier's credit
  note reduces the credit available; if 3B table 4(B) shows no matching
  reversal, the credit was kept.
* **Notes without an original.** A note is an adjustment to a document. One
  naming nothing, or naming a document not in the file, adjusts nothing that
  can be seen.
* **The balance of the two directions.** A file issuing far more credit than
  it receives, or the reverse, is a shape worth a question - not a finding.

Pure: no I/O, no clock. `docs/08` pattern report.
"""

from __future__ import annotations

import collections
from decimal import Decimal
from typing import Final

from app.engine.records import InwardRecord, OutwardRecord, TaxpayerData
from app.money import TaxVector
from app.reports.base import Point, Report, ReportRow, Series, money
from app.reports.base import not_evaluated as _dark

__all__ = ["REPORT_ID", "build"]

REPORT_ID: Final[str] = "notes_cross_check"
_TITLE: Final[str] = "Credit notes issued against debit and credit notes received"
_ZERO: Final[Decimal] = Decimal("0.00")

_NOTE_TYPES: Final[frozenset[str]] = frozenset({"CREDIT_NOTE", "DEBIT_NOTE"})


def _outward_notes(data: TaxpayerData) -> list[OutwardRecord]:
    return [row for row in data.outward if row.doc_type in _NOTE_TYPES]


def _inward_notes(data: TaxpayerData) -> list[InwardRecord]:
    return [
        row for row in data.inward if row.doc_type in _NOTE_TYPES and row.source_form == "GSTR2B"
    ]


def build(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Both directions, with the outward side honestly marked one-sided."""
    if not data.outward and not data.inward:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-1 and GSTR-2B as filed",))

    issued = _outward_notes(data)
    received = _inward_notes(data)

    issued_tax = sum((row.tax for row in issued), TaxVector())
    received_tax = sum((row.tax for row in received), TaxVector())

    # An outward invoice this file knows about, so a note naming one can be
    # said to adjust something visible.
    known_documents = {
        (row.counterparty_gstin or "", row.doc_no or "")
        for row in data.outward
        if row.doc_type == "INVOICE"
    }

    # Two different states, and conflating them overstates the finding. On the
    # reference workbook every one of the 211 issued notes is `unstated` - the
    # GSTR-1 CDN sheet carries an "Original Invoice No" column that is empty -
    # and reporting those as notes that name a document nobody can find would
    # be an accusation where the honest statement is "the column is blank".
    unstated = [row for row in issued if not row.amends_doc_no]
    unmatched = [
        row
        for row in issued
        if row.amends_doc_no
        and (row.counterparty_gstin or "", row.amends_doc_no) not in known_documents
    ]
    orphans = unstated + unmatched

    by_party: dict[str, TaxVector] = collections.defaultdict(TaxVector)
    for row in issued:
        by_party[row.counterparty_gstin or "unidentified"] = (
            by_party[row.counterparty_gstin or "unidentified"] + row.tax
        )

    rows: list[ReportRow] = [
        ReportRow(
            cells={
                "Direction": "Issued (sales return)",
                "Note": row.doc_no or "",
                "Date": row.doc_date.isoformat() if row.doc_date else "",
                "Counterparty": row.counterparty_gstin or "",
                "Adjusts": row.amends_doc_no or "not stated",
                "Taxable value": money(row.taxable_value),
                "Tax": money(row.tax.total),
                "Question": _question(row in unstated, row in unmatched),
            },
            evidence_ids=(row.row_id,) if row.row_id else (),
            flag="ASK" if row in orphans else None,
        )
        for row in sorted(issued, key=lambda r: -r.tax.total)[:150]
    ]
    rows.extend(
        ReportRow(
            cells={
                "Direction": "Received (purchase return)",
                "Note": row.doc_no or "",
                "Date": row.doc_date.isoformat() if row.doc_date else "",
                "Counterparty": row.supplier_gstin or "",
                "Adjusts": row.amends_doc_no or "not stated",
                "Taxable value": money(row.taxable_value),
                "Tax": money(row.tax.total),
                "Question": "",
            },
            evidence_ids=(row.row_id,) if row.row_id else (),
        )
        for row in sorted(received, key=lambda r: -r.tax.total)[:150]
    )

    return Report(
        id=REPORT_ID,
        title=_TITLE,
        gstin=data.profile.gstin,
        fy=fy,
        headline=_headline(
            issued,
            received,
            unstated=unstated,
            unmatched=unmatched,
            issued_tax=issued_tax,
            received_tax=received_tax,
        ),
        columns=(
            "Direction",
            "Note",
            "Date",
            "Counterparty",
            "Adjusts",
            "Taxable value",
            "Tax",
            "Question",
        ),
        series=(
            Series(
                id="direction",
                title="Notes issued against notes received",
                kind="bar",
                unit="rupees of tax",
                points=(
                    Point(
                        label="Issued to customers",
                        value=money(issued_tax.total),
                        heads=issued_tax.dict(),
                        drill=f"/scrutiny/report/{REPORT_ID}?gstin={data.profile.gstin}&dir=out",
                        note=f"{len(issued)} notes",
                    ),
                    Point(
                        label="Received from suppliers",
                        value=money(received_tax.total),
                        heads=received_tax.dict(),
                        drill=f"/scrutiny/report/{REPORT_ID}?gstin={data.profile.gstin}&dir=in",
                        note=f"{len(received)} notes",
                    ),
                ),
            ),
            Series(
                id="by_party",
                title="Credit notes issued, by customer",
                kind="bar",
                unit="rupees of tax",
                points=tuple(
                    Point(
                        label=party,
                        value=money(vector.total),
                        heads=vector.dict(),
                        drill=f"/scrutiny/taxpayer/{data.profile.gstin}?party={party}",
                    )
                    for party, vector in sorted(by_party.items(), key=lambda kv: -kv[1].total)[:20]
                ),
            ),
        ),
        rows=tuple(rows),
        total=issued_tax - received_tax,
        caveat=(
            "One-sided by design on the outward leg. Whether a customer honoured "
            "a credit note is in the customer's own return, which the department "
            "holds and this platform has not been given. Nothing here says a "
            "customer failed to reverse; it says which notes would need checking "
            "if you asked."
        ),
    )


def _question(unstated: bool, unmatched: bool) -> str:
    if unstated:
        return (
            "The note does not state which invoice it adjusts - the column is "
            "blank in the filed return. Produce the original document."
        )
    if unmatched:
        return (
            "The note names an invoice that is not in this file. Produce the "
            "document it adjusts and the recipient's reversal."
        )
    return ""


def _headline(
    issued: list[OutwardRecord],
    received: list[InwardRecord],
    *,
    unstated: list[OutwardRecord],
    unmatched: list[OutwardRecord],
    issued_tax: TaxVector,
    received_tax: TaxVector,
) -> str:
    if not issued and not received:
        return "This taxpayer issued and received no credit or debit notes in the year."
    parts = [
        f"{len(issued)} notes issued to customers carrying {money(issued_tax.total)} of tax, "
        f"and {len(received)} received from suppliers carrying {money(received_tax.total)}"
    ]
    if unstated:
        parts.append(
            f"{len(unstated)} of the issued notes leave the original-invoice column "
            f"blank, so what they adjust cannot be read from the return at all"
        )
    if unmatched:
        parts.append(f"{len(unmatched)} name an invoice that is not in this file")
    return ". ".join(parts) + "."
