"""Descriptive insight over the returns as filed.

**What this is not.** Nothing here is a finding, a flag or a demand. The
thirty-four parameters answer *who should we audit* and the fifty-seven rules
answer *what can we demand*; both compare a filing against a rule and both
carry a ``calc_id`` resolving to that rule. This module answers a third
question the filed data can answer on its own: **what does this taxpayer's
year actually look like?**

The distinction is deliberate and it is stated on the screen. A concentration
of purchases in one supplier is not an offence. Ten counterparties who are
both customer and supplier is not circular trading. These are shapes worth an
officer's attention *before* they open a case, and describing them as findings
would put an unearned word in front of a quasi-judicial decision.

**Provenance holds regardless.** Every figure here is a sum over rows the
platform ingested, and every figure drills to exactly those rows with their
``prov_id`` -- file, sheet, row, original cells. What a rule-backed figure
gets from its ``calc_id``, a descriptive figure gets from its row set: the
reader can always reach the spreadsheet cell.

**No thresholds.** Not one number here is compared against a limit, because
the department has published none for any of these shapes. Rank order and
share of total are reported; "high" and "low" are not.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.db.models import InwardLine, OutwardLine, Taxpayer

router: APIRouter = APIRouter(tags=["insights"])

SessionDep = Annotated[Session, Depends(get_session)]

#: How many rows a drill returns in one page.
PAGE = 100

#: How many entries a ranked panel shows. The rest are folded into an
#: "others" row carrying its own count and value, so the shares still sum to
#: the whole -- a top-five list that quietly drops the remainder is a chart
#: whose bars do not add up to its total.
TOP_N = 5


def _rate_label(rate: Decimal | int | None) -> str:
    """A rate as a person writes it: 5%, 18%, 0.25%.

    The column is NUMERIC with scale, so the stored value is 5.0000000000 and
    nil is 0E-10. Neither belongs on a screen, and neither should be rounded
    to an integer either -- 0.25% and 1.5% are real GST rates and a chart that
    printed them as 0% and 2% would be describing supplies that do not exist.
    """
    if rate is None:
        return "rate not stated"
    trimmed = Decimal(rate).normalize()
    # normalize() writes a whole number as 5E+1; quantize it back.
    if trimmed == trimmed.to_integral_value():
        trimmed = trimmed.quantize(Decimal(1))
    return f"{trimmed:f}%"


def _money(value: Decimal | int | None) -> str:
    return format(Decimal(value or 0).quantize(Decimal("0.01")), "f")


def _share(part: Decimal | int | None, whole: Decimal | int | None) -> str | None:
    """A share of the total, or ``None`` when there is no total.

    Never zero for an empty denominator: "nothing was purchased" is not
    "nothing came from this supplier".
    """
    bottom = Decimal(whole or 0)
    if bottom == 0:
        return None
    return format((Decimal(part or 0) / bottom).quantize(Decimal("0.0001")), "f")


@dataclass(frozen=True, slots=True)
class Panel:
    """One insight, in the words that go above it on the screen."""

    id: str
    title: str
    #: What the reader is looking at, and what it does not mean.
    reading: str


PANELS: tuple[Panel, ...] = (
    Panel(
        "supplier_concentration",
        "Where the purchases come from",
        "The suppliers behind this taxpayer's inward tax credit, largest first. "
        "Concentration is not an offence: a single-supplier business is ordinary. "
        "It is shown because a credit that rests on one counterparty also rests "
        "on that counterparty's own compliance.",
    ),
    Panel(
        "two_way_counterparties",
        "Counterparties on both sides",
        "GSTINs that appear as both customer and supplier, with the value each "
        "way. Two-way trade is common and lawful -- a manufacturer buys from its "
        "own distributor. It is listed, not judged.",
    ),
    Panel(
        "rate_mix",
        "Outward supplies by tax rate",
        "Taxable value declared at each rate. A change in the mix across the "
        "year is a question about classification, not an answer.",
    ),
    Panel(
        "credit_notes",
        "Credit and debit notes",
        "The value of notes issued against the value of invoices, by month. A "
        "credit note reduces declared outward tax, so when they are issued is "
        "worth seeing beside the turnover they adjust.",
    ),
    Panel(
        "credit_source",
        "Where the credit is evidenced",
        "Inward lines by the statement they came from and whether that statement "
        "marks the credit available. A GSTR-2A carries no availability column at "
        "all, so lines read from a 2A are reported as unstated rather than as "
        "available -- they are not the same thing.",
    ),
    Panel(
        "monthly_turnover",
        "Declared outward value by month",
        "Taxable value of outward supplies per return period, as filed in "
        "GSTR-1. Shown for shape: a month that breaks the year's pattern is "
        "worth opening, whether it is high or low.",
    ),
)

PANEL_BY_ID = {panel.id: panel for panel in PANELS}

#: A return period is written MMYYYY -- six digits, month first.
_PERIOD_LENGTH = 6

#: Panels answered from the outward register; the rest from the inward one.
_OUTWARD_PANELS = frozenset({"rate_mix", "credit_notes", "monthly_turnover"})


def _filer_or_404(session: Session, gstin: str) -> Taxpayer:
    """A registered filer, or 404.

    404 and not 403: an officer outside a taxpayer's jurisdiction must not be
    able to learn that the taxpayer exists from the shape of the refusal.
    """
    taxpayer = session.get(Taxpayer, gstin)
    if taxpayer is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "UNKNOWN_TAXPAYER", "message": "no such taxpayer in this snapshot"},
        )
    return taxpayer


def _supplier_concentration(session: Session, gstin: str) -> dict[str, Any]:
    rows = session.execute(
        select(
            InwardLine.supplier_gstin,
            func.sum(InwardLine.taxable_value),
            func.count(),
        )
        .where(InwardLine.gstin == gstin, InwardLine.supplier_gstin.is_not(None))
        .group_by(InwardLine.supplier_gstin)
        .order_by(func.sum(InwardLine.taxable_value).desc())
    ).all()
    total = sum((Decimal(row[1] or 0) for row in rows), Decimal(0))
    items: list[dict[str, Any]] = [
        {
            "label": str(row[0]),
            "value": _money(row[1]),
            "share": _share(row[1], total),
            "lines": int(row[2]),
            "drill": {"panel": "supplier_concentration", "bucket": str(row[0])},
        }
        for row in rows[:TOP_N]
    ]
    rest = rows[TOP_N:]
    if rest:
        rest_value = sum((Decimal(row[1] or 0) for row in rest), Decimal(0))
        items.append(
            {
                "label": f"{len(rest)} other suppliers",
                "value": _money(rest_value),
                "share": _share(rest_value, total),
                "lines": sum(int(row[2]) for row in rest),
                "drill": None,
            }
        )
    return {"items": items, "total": _money(total), "counterparties": len(rows)}


def _two_way(session: Session, gstin: str) -> dict[str, Any]:
    sold: dict[str, Decimal] = {
        str(party): Decimal(value or 0)
        for party, value in session.execute(
            select(OutwardLine.counterparty_gstin, func.sum(OutwardLine.taxable_value))
            .where(OutwardLine.gstin == gstin, OutwardLine.counterparty_gstin.is_not(None))
            .group_by(OutwardLine.counterparty_gstin)
        ).all()
    }
    bought: dict[str, Decimal] = {
        str(party): Decimal(value or 0)
        for party, value in session.execute(
            select(InwardLine.supplier_gstin, func.sum(InwardLine.taxable_value))
            .where(InwardLine.gstin == gstin, InwardLine.supplier_gstin.is_not(None))
            .group_by(InwardLine.supplier_gstin)
        ).all()
    }
    both = sorted(
        set(sold) & set(bought),
        key=lambda party: sold[party] + bought[party],
        reverse=True,
    )
    return {
        "items": [
            {
                "label": str(party),
                "sold_to": _money(sold[party]),
                "bought_from": _money(bought[party]),
                "drill": {"panel": "two_way_counterparties", "bucket": str(party)},
            }
            for party in both[:TOP_N]
        ],
        "count": len(both),
    }


def _rate_mix(session: Session, gstin: str) -> dict[str, Any]:
    rows = session.execute(
        select(OutwardLine.rate, func.sum(OutwardLine.taxable_value), func.count())
        .where(OutwardLine.gstin == gstin)
        .group_by(OutwardLine.rate)
        .order_by(func.sum(OutwardLine.taxable_value).desc())
    ).all()
    total = sum((Decimal(row[1] or 0) for row in rows), Decimal(0))
    return {
        "items": [
            {
                # A rate the file did not state is reported as unstated, never
                # as nil-rated. They are different declarations and only one
                # of them is a declaration at all.
                "label": _rate_label(row[0]),
                "value": _money(row[1]),
                "share": _share(row[1], total),
                "lines": int(row[2]),
                "drill": (None if row[0] is None else {"panel": "rate_mix", "bucket": str(row[0])}),
            }
            for row in rows
        ],
        "total": _money(total),
    }


def _period_key(period: str) -> tuple[int, int]:
    """Return-period order: MMYYYY sorts by year then month, not as text."""
    if len(period) != _PERIOD_LENGTH or not period.isdigit():
        return (0, 0)
    return (int(period[2:]), int(period[:2]))


def _credit_notes(session: Session, gstin: str) -> dict[str, Any]:
    rows = session.execute(
        select(OutwardLine.period, OutwardLine.doc_type, func.sum(OutwardLine.taxable_value))
        .where(OutwardLine.gstin == gstin)
        .group_by(OutwardLine.period, OutwardLine.doc_type)
    ).all()
    by_period: dict[str, dict[str, Decimal]] = {}
    for period, doc_type, value in rows:
        bucket = by_period.setdefault(str(period), {})
        bucket[str(doc_type)] = bucket.get(str(doc_type), Decimal(0)) + Decimal(value or 0)
    return {
        "items": [
            {
                "label": period,
                "invoices": _money(kinds.get("INVOICE")),
                "credit_notes": _money(kinds.get("CREDIT_NOTE")),
                "debit_notes": _money(kinds.get("DEBIT_NOTE")),
                "share": _share(kinds.get("CREDIT_NOTE"), kinds.get("INVOICE")),
                "drill": {"panel": "credit_notes", "bucket": period},
            }
            for period, kinds in sorted(by_period.items(), key=lambda pair: _period_key(pair[0]))
        ]
    }


def _credit_source(session: Session, gstin: str) -> dict[str, Any]:
    rows = session.execute(
        select(
            InwardLine.source_form,
            InwardLine.itc_available,
            func.sum(InwardLine.taxable_value),
            func.count(),
        )
        .where(InwardLine.gstin == gstin)
        .group_by(InwardLine.source_form, InwardLine.itc_available)
    ).all()
    labels: dict[bool | None, str] = {
        None: "availability not stated",
        True: "marked available",
        False: "marked unavailable",
    }
    return {
        "items": [
            {
                "label": f"{row[0] or 'statement not named'} - {labels[row[1]]}",
                "form": row[0],
                "availability": labels[row[1]],
                "value": _money(row[2]),
                "lines": int(row[3]),
                "drill": {
                    "panel": "credit_source",
                    "bucket": f"{row[0] or ''}|{'' if row[1] is None else int(row[1])}",
                },
            }
            for row in rows
        ]
    }


def _monthly_turnover(session: Session, gstin: str) -> dict[str, Any]:
    rows = session.execute(
        select(OutwardLine.period, func.sum(OutwardLine.taxable_value), func.count())
        .where(OutwardLine.gstin == gstin, OutwardLine.doc_type == "INVOICE")
        .group_by(OutwardLine.period)
    ).all()
    return {
        "items": [
            {
                "label": str(row[0]),
                "value": _money(row[1]),
                "lines": int(row[2]),
                "drill": {"panel": "monthly_turnover", "bucket": str(row[0])},
            }
            for row in sorted(rows, key=lambda row: _period_key(str(row[0])))
        ]
    }


_BUILDERS: dict[str, Callable[[Session, str], dict[str, Any]]] = {
    "supplier_concentration": _supplier_concentration,
    "two_way_counterparties": _two_way,
    "rate_mix": _rate_mix,
    "credit_notes": _credit_notes,
    "credit_source": _credit_source,
    "monthly_turnover": _monthly_turnover,
}


@router.get("/insights/taxpayer/{gstin}")
def taxpayer_insights(gstin: str, session: SessionDep) -> dict[str, Any]:
    """Six descriptive views of one filer's year, each drilling to its rows."""
    filer = _filer_or_404(session, gstin)
    return {
        "gstin": gstin,
        "legal_name": filer.legal_name,
        "panels": [
            {
                "id": panel.id,
                "title": panel.title,
                "reading": panel.reading,
                **_BUILDERS[panel.id](session, gstin),
            }
            for panel in PANELS
        ],
        "note": (
            "Descriptive summary of the returns as filed. Not a finding, not a "
            "flag and not a demand: every figure is a sum of rows, and every "
            "figure drills to those rows."
        ),
    }


@router.get("/insights/rows")
def insight_rows(
    session: SessionDep,
    gstin: Annotated[str, Query()],
    panel: Annotated[str, Query()],
    bucket: Annotated[str, Query()],
    page: int = 1,
) -> dict[str, Any]:
    """The source rows behind one element of one panel.

    This is the drill, and it is what makes a descriptive figure honest: the
    reader reaches the ingested row, its provenance id, and from there the
    file, the sheet, the row and the original cells.
    """
    if panel not in PANEL_BY_ID:
        raise HTTPException(
            status_code=404,
            detail={"code": "UNKNOWN_PANEL", "message": f"no insight panel {panel!r}"},
        )
    _filer_or_404(session, gstin)
    if panel in _OUTWARD_PANELS:
        return _outward_rows(session, gstin, panel, bucket, page)
    return _inward_rows(session, gstin, panel, bucket, page)


def _outward_rows(
    session: Session, gstin: str, panel: str, bucket: str, page: int
) -> dict[str, Any]:
    query = select(OutwardLine).where(OutwardLine.gstin == gstin)
    if panel == "rate_mix":
        query = query.where(OutwardLine.rate == _rate_or_none(bucket))
    elif panel == "credit_notes":
        query = query.where(OutwardLine.period == bucket)
    else:
        query = query.where(OutwardLine.period == bucket, OutwardLine.doc_type == "INVOICE")
    return _page(
        session,
        query.order_by(OutwardLine.doc_date, OutwardLine.doc_no),
        page,
        lambda row: {
            "id": row.id,
            "period": row.period,
            "doc_type": row.doc_type,
            "doc_no": row.doc_no,
            "doc_date": row.doc_date.isoformat() if row.doc_date else None,
            "counterparty": row.counterparty_gstin,
            "rate": row.rate,
            "taxable_value": _money(row.taxable_value),
            "igst": _money(row.igst),
            "cgst": _money(row.cgst),
            "sgst": _money(row.sgst),
            "prov_id": row.prov_id,
        },
    )


def _inward_rows(
    session: Session, gstin: str, panel: str, bucket: str, page: int
) -> dict[str, Any]:
    query = select(InwardLine).where(InwardLine.gstin == gstin)
    if panel == "credit_source":
        form, _, availability = bucket.partition("|")
        query = query.where(InwardLine.source_form == (form or None))
        query = query.where(
            InwardLine.itc_available.is_(None)
            if availability == ""
            else InwardLine.itc_available == bool(int(availability))
        )
    else:
        query = query.where(InwardLine.supplier_gstin == bucket)
    return _page(
        session,
        query.order_by(InwardLine.doc_date, InwardLine.doc_no),
        page,
        lambda row: {
            "id": row.id,
            "period": row.period,
            "doc_type": row.doc_type,
            "doc_no": row.doc_no,
            "doc_date": row.doc_date.isoformat() if row.doc_date else None,
            "counterparty": row.supplier_gstin,
            "rate": row.rate,
            "taxable_value": _money(row.taxable_value),
            "igst": _money(row.igst),
            "cgst": _money(row.cgst),
            "sgst": _money(row.sgst),
            "source_form": row.source_form,
            "itc_available": row.itc_available,
            "prov_id": row.prov_id,
        },
    )


def _rate_or_none(value: str) -> Decimal | None:
    """The rate a drill was asked for, as a number.

    Kept as a Decimal rather than an int: 0.25% and 1.5% are real GST rates,
    and truncating the bucket to an integer would drill into 0% and 1%
    instead -- a list of rows that does not match the bar that was clicked.
    """
    try:
        return Decimal(value)
    except ArithmeticError:
        return None


def _page(
    session: Session,
    query: Any,
    page: int,
    render: Callable[[Any], dict[str, Any]],
) -> dict[str, Any]:
    rows: Sequence[Any] = (
        session.execute(query.offset(max(page - 1, 0) * PAGE).limit(PAGE)).scalars().all()
    )
    total = session.execute(
        select(func.count()).select_from(query.order_by(None).subquery())
    ).scalar()
    return {
        "page": page,
        "size": PAGE,
        "total": int(total or 0),
        "items": [render(row) for row in rows],
    }
