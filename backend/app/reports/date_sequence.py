"""Dates that cannot be in the order the file puts them in.

Four sequences, each one impossible rather than merely unusual - which is why
this report can state them flatly where the place-of-supply one has to ask.

    acknowledgement before its own invoice      an IRN cannot precede the document
    document outside the period it is filed in  a July invoice is not August turnover
    credit note before the invoice it adjusts   nothing to adjust yet
    e-way bill before the invoice moves         goods cannot move before they are billed

**The first one is why this report exists at all.** Read naively, the
reference workbook produced 314 acknowledgements dated before their own
invoices and 250 breaches of the Rule 48(4) thirty-day window - two hundred
and fifty notices that would each have been wrong - because a spreadsheet
swapped the day and month in half a column. After correction both are zero.
So a non-zero count here means either a correction the platform has not made
yet, or a genuine sequencing problem, and the report says which by pointing at
the ingestion corrections panel.

`I-01` quarantines a row whose acknowledgement precedes its document, so a
count here of anything but zero on that sequence means rows were *held* and
the reader should look at the quarantine rather than at the taxpayer.

Pure: no I/O, no clock, `as_of` unused - every comparison is between two dates
the file itself carries. `docs/08` pattern report.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Final

from app.engine.records import TaxpayerData
from app.money import TaxVector
from app.reports.base import Point, Report, ReportRow, Series, money
from app.reports.base import not_evaluated as _dark

__all__ = ["REPORT_ID", "build"]

REPORT_ID: Final[str] = "date_sequence"
_TITLE: Final[str] = "Date sequences that cannot be right"
_ZERO: Final[Decimal] = Decimal("0.00")

#: A document dated this far outside the period it is filed in is a
#: sequencing problem rather than a late entry. One month either side is
#: ordinary: an invoice dated 31 March is filed in April.
_PERIOD_GRACE_DAYS: Final[int] = 31


@dataclass(frozen=True, slots=True)
class _Break:
    sequence: str
    doc_no: str
    earlier_label: str
    earlier: date
    later_label: str
    later: date
    tax: TaxVector
    row_id: str | None

    @property
    def days(self) -> int:
        return (self.earlier - self.later).days


def _collect(data: TaxpayerData) -> list[_Break]:
    breaks: list[_Break] = []

    for row in data.outward:
        if row.irn_date and row.doc_date and row.irn_date < row.doc_date:
            breaks.append(
                _Break(
                    "Acknowledgement before its own invoice",
                    row.doc_no or "",
                    "IRN date",
                    row.irn_date,
                    "invoice date",
                    row.doc_date,
                    row.tax,
                    row.row_id,
                )
            )
        if row.doc_date and row.period is not None:
            start, end = row.period.first_day, row.period.last_day
            if (start - row.doc_date).days > _PERIOD_GRACE_DAYS:
                breaks.append(
                    _Break(
                        "Document dated well before the period it is filed in",
                        row.doc_no or "",
                        "invoice date",
                        row.doc_date,
                        "period starts",
                        start,
                        row.tax,
                        row.row_id,
                    )
                )
            elif (row.doc_date - end).days > 0:
                breaks.append(
                    _Break(
                        "Document dated after the period it is filed in",
                        row.doc_no or "",
                        "period ends",
                        end,
                        "invoice date",
                        row.doc_date,
                        row.tax,
                        row.row_id,
                    )
                )
        note_date, original_date = row.doc_date, row.amends_doc_date
        if (
            row.doc_type == "CREDIT_NOTE"
            and note_date is not None
            and original_date is not None
            and note_date < original_date
        ):
            breaks.append(
                _Break(
                    "Credit note before the invoice it adjusts",
                    row.doc_no or "",
                    "note date",
                    note_date,
                    "original invoice date",
                    original_date,
                    row.tax,
                    row.row_id,
                )
            )

    for ewb in data.ewb:
        if ewb.ewb_date and ewb.doc_date and ewb.ewb_date < ewb.doc_date:
            breaks.append(
                _Break(
                    "Goods moved before the invoice was raised",
                    ewb.doc_no or ewb.ewb_no,
                    "e-way bill date",
                    ewb.ewb_date,
                    "invoice date",
                    ewb.doc_date,
                    TaxVector(),
                    ewb.prov_id,
                )
            )

    return breaks


def build(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Every impossible ordering the file contains, grouped by which one."""
    if not data.outward:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-1 as filed",))

    breaks = _collect(data)
    by_sequence: dict[str, list[_Break]] = {}
    for item in breaks:
        by_sequence.setdefault(item.sequence, []).append(item)

    exposure = sum((item.tax for item in breaks), TaxVector())

    rows = tuple(
        ReportRow(
            cells={
                "Sequence": item.sequence,
                "Document": item.doc_no,
                item.earlier_label.capitalize(): item.earlier.isoformat(),
                item.later_label.capitalize(): item.later.isoformat(),
                "Days out": str(item.days),
                "Tax on the line": money(item.tax.total),
            },
            evidence_ids=(item.row_id,) if item.row_id else (),
            flag="FAIL",
        )
        for item in sorted(breaks, key=lambda b: (b.sequence, -b.tax.total))[:200]
    )

    points = tuple(
        Point(
            label=sequence,
            value=str(len(items)),
            drill=f"/scrutiny/report/{REPORT_ID}?gstin={data.profile.gstin}&seq={sequence}",
            note=f"{money(sum((i.tax for i in items), TaxVector()).total)} of tax",
        )
        for sequence, items in sorted(by_sequence.items(), key=lambda kv: -len(kv[1]))
    )

    return Report(
        id=REPORT_ID,
        title=_TITLE,
        gstin=data.profile.gstin,
        fy=fy,
        headline=_headline(breaks, by_sequence),
        columns=(
            "Sequence",
            "Document",
            "Days out",
            "Tax on the line",
        ),
        series=(
            Series(
                id="by_sequence",
                title="Impossible orderings, by kind",
                kind="bar",
                unit="documents",
                points=points,
            ),
        ),
        rows=rows,
        total=exposure,
        caveat=(
            "Every sequence here is impossible rather than unusual, so a count "
            "above zero is a data problem or a real one - never a judgement. "
            "Before reading it as the taxpayer's error, check the ingestion "
            "corrections panel: a spreadsheet that swaps day and month produces "
            "all four of these at once, and on the reference workbook it "
            "produced 314 of the first."
        ),
    )


def _headline(breaks: list[_Break], by_sequence: dict[str, list[_Break]]) -> str:
    if not breaks:
        return (
            "No document in this file is dated before something it depends on. "
            "Acknowledgements follow their invoices, notes follow what they "
            "adjust, and goods move after they are billed."
        )
    worst = max(by_sequence.items(), key=lambda kv: len(kv[1]))
    return (
        f"{len(breaks)} documents are dated in an order that cannot be right. "
        f"The commonest is '{worst[0].lower()}', {len(worst[1])} of them. Check "
        f"the ingestion corrections panel before reading this as the taxpayer's "
        f"error - a spreadsheet that swaps day and month produces exactly this."
    )
