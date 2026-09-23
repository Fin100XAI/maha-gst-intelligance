"""What rates this taxpayer buys at, and what rates it sells at.

The simplest report here and one of the most read, because the *shape* is the
signal. A manufacturer buying inputs at 18% and selling output at 5% has an
inverted duty structure and a refund claim; one buying at 5% and selling at
18% has value addition and pays. Neither is wrong and both are worth knowing
before opening a file.

**Rates are grouped as written, not rounded into bands.** The rate column
arrives as a high-precision decimal, and 18 and 18.000000 are the same rate
while 18 and 12 are not. Normalising for display is done once, here, so the
same rate never appears twice on one chart.

**The 22 September 2025 change is inside this year.** A taxpayer showing two
rates on one HSN across the year may simply have straddled the notification,
which is why this report states the mix and leaves the contradiction to X-03 -
and X-03 is `ASSISTED` precisely because the notification calendar is not
loaded.

Pure: no I/O, no clock. `docs/08` report 6.
"""

from __future__ import annotations

import collections
from decimal import Decimal
from typing import Final

from app.engine.records import TaxpayerData
from app.money import TaxVector
from app.reports.base import Point, Report, ReportRow, Series, money, pct
from app.reports.base import not_evaluated as _dark

__all__ = ["REPORT_ID", "build"]

REPORT_ID: Final[str] = "rate_wise"
_TITLE: Final[str] = "Purchases and sales by tax rate"
_ZERO: Final[Decimal] = Decimal("0.00")


#: What the label says when the source column is blank. It is not a rate and
#: the report never treats it as one - see `_headline`.
UNSTATED: Final[str] = "not stated"


def _rate_label(rate: Decimal | None) -> str:
    """`18`, not `18.0000000000`. One rate, one column on the chart."""
    if rate is None:
        return UNSTATED
    return format(rate.normalize(), "f")


def build(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Two sides, one scale, and the mix stated in words."""
    if not data.outward and not data.inward:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-1 and GSTR-2B as filed",))

    sales: dict[str, Decimal] = collections.defaultdict(lambda: _ZERO)
    sales_tax: dict[str, TaxVector] = collections.defaultdict(TaxVector)
    purchases: dict[str, Decimal] = collections.defaultdict(lambda: _ZERO)
    purchase_tax: dict[str, TaxVector] = collections.defaultdict(TaxVector)

    for sold in data.outward:
        key = _rate_label(sold.rate)
        sales[key] += sold.taxable_value
        sales_tax[key] = sales_tax[key] + sold.signed_tax

    for bought in data.inward:
        if bought.source_form != "GSTR2B":
            # 2B only, for the same reason every other report uses it: 2A
            # carries the same invoices and would double the purchase side.
            continue
        key = _rate_label(bought.rate)
        purchases[key] += bought.taxable_value
        purchase_tax[key] = purchase_tax[key] + bought.signed_tax

    rates = sorted(
        set(sales) | set(purchases),
        key=lambda r: (r == UNSTATED, Decimal(r) if r != "not stated" else _ZERO),
    )
    total_sales = sum(sales.values(), _ZERO)
    total_purchases = sum(purchases.values(), _ZERO)

    rows = tuple(
        ReportRow(
            cells={
                "Rate": f"{rate}%" if rate != UNSTATED else rate,
                "Sales (taxable value)": money(sales.get(rate)),
                "Sales share": pct(sales.get(rate, _ZERO), total_sales),
                "Output tax": money(sales_tax[rate].total),
                "Purchases (taxable value)": money(purchases.get(rate)),
                "Purchase share": pct(purchases.get(rate, _ZERO), total_purchases),
                "Input tax": money(purchase_tax[rate].total),
            }
        )
        for rate in rates
    )

    points = tuple(
        Point(
            label=f"{rate}%" if rate != UNSTATED else rate,
            value=money(sales.get(rate)),
            compare=money(purchases.get(rate)),
            drill=f"/scrutiny/taxpayer/{data.profile.gstin}?rate={rate}",
        )
        for rate in rates
    )

    return Report(
        id=REPORT_ID,
        title=_TITLE,
        gstin=data.profile.gstin,
        fy=fy,
        headline=_headline(sales, purchases, total_sales, total_purchases),
        columns=(
            "Rate",
            "Sales (taxable value)",
            "Sales share",
            "Output tax",
            "Purchases (taxable value)",
            "Purchase share",
            "Input tax",
        ),
        series=(
            Series(
                id="by_rate",
                title="Taxable value by rate, sales against purchases",
                kind="grouped_bar",
                unit="rupees of taxable value",
                value_label="Sales",
                compare_label="Purchases",
                points=points,
            ),
        ),
        rows=rows,
        caveat=(
            "The rate structure changed on 22 September 2025, inside this year. "
            "A taxpayer showing two rates for the same goods may simply have "
            "straddled the notification. This report states the mix; whether two "
            "rates on one HSN contradict each other is check X-03, which asks for "
            "the notification rather than assuming."
        ),
    )


def _headline(
    sales: dict[str, Decimal],
    purchases: dict[str, Decimal],
    total_sales: Decimal,
    total_purchases: Decimal,
) -> str:
    if not sales and not purchases:
        return "No rate could be read from either side of this file."

    parts = [
        _side("sales", sales, total_sales),
        _side("purchases", purchases, total_purchases),
    ]
    stated = [p for p in parts if p]
    if not stated:
        return "Neither side of this file carries a taxable value to group by rate."
    sentence = ", and ".join(stated) + "."
    if _readable(sales) and _readable(purchases):
        sentence += (
            " A business buying at a higher rate than it sells at is accumulating "
            "credit; the reverse is adding value and paying."
        )
    return sentence


def _readable(side: dict[str, Decimal]) -> bool:
    """Whether this side has any rate at all, as opposed to blank columns."""
    return any(rate != UNSTATED for rate in side)


def _side(name: str, side: dict[str, Decimal], total: Decimal) -> str:
    """One side of the sentence, refusing to read a blank column as a rate.

    The portal's GSTR-2B export leaves its `Rate` column empty - the rate is
    implicit in the tax over the taxable value, and 2B is an invoice-level
    statement rather than a rate-level one. Deriving a rate from the division
    would be an assumption made silently, which Law 7 forbids and which would
    read on screen as though the statement had said it.
    """
    if total <= _ZERO:
        return ""
    if not _readable(side):
        return (
            f"no rate is stated on the {name} side at all - the portal's GSTR-2B "
            f"export leaves that column blank, so the {name} mix cannot be read "
            f"from the return"
        )
    top = max(
        ((rate, value) for rate, value in side.items() if rate != UNSTATED),
        key=lambda kv: kv[1],
        default=("", _ZERO),
    )
    blank = side.get(UNSTATED, _ZERO)
    tail = f" ({pct(blank, total)}% of the {name} side states no rate)" if blank > _ZERO else ""
    return f"{pct(top[1], total)}% of {name} are at {top[0]}%{tail}"
