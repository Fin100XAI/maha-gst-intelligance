"""Who this taxpayer buys from, who it sells to, and who is both.

Three reports from one shape, because they are the same grouping read three
ways.

**Supplier-wise (GSTR-2A/2B).** Credit claimed per supplier, largest first,
with the supplier's own GSTR-3B filing status beside it where 2A states it.
That last column is what turns a list into a worklist: a supplier at the top
by value who has not filed their 3B is a Rule 37A exposure, and the officer
can see it without running a check.

**Customer-wise (GSTR-1).** Turnover per customer, largest first. Concentration
is the signal - a taxpayer with 80% of its outward supply to one party has a
different risk profile from one with two hundred customers, and neither is
wrong.

**Both sides (purchase and sales correlation).** A counterparty that is both
customer and supplier is ordinary in some trades and is also the shape
circular trading takes. This report states the overlap and the net position
with each such party, and explicitly refuses to call it anything: the
department's own analysis across taxpayers is what settles it, and this
platform holds one taxpayer's file.

Pure: no I/O, no clock. `docs/08` reports 4, 5 and the correlation pattern.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Final

from app.engine.records import TaxpayerData
from app.money import TaxVector
from app.reports.base import Point, Report, ReportRow, Series, money, pct
from app.reports.base import not_evaluated as _dark

__all__ = [
    "CUSTOMER_ID",
    "OVERLAP_ID",
    "SUPPLIER_ID",
    "build_customers",
    "build_overlap",
    "build_suppliers",
]

SUPPLIER_ID: Final[str] = "supplier_wise"
CUSTOMER_ID: Final[str] = "customer_wise"
OVERLAP_ID: Final[str] = "counterparty_overlap"
_ZERO: Final[Decimal] = Decimal("0.00")
_TOP: Final[int] = 20


@dataclass
class _Party:
    gstin: str
    tax: TaxVector
    taxable: Decimal
    documents: int
    #: True / False / None, straight from GSTR-2A. `None` means the statement
    #: did not say, which is every 2B row - never "they filed".
    supplier_3b_filed: bool | None = None
    #: Credit on the rows that *state* the supplier had not filed. This is
    #: B-04's figure and must stay B-04's figure: summing every row from a
    #: supplier who defaulted in one period instead gives Rs 6.83 crore where
    #: the finding says Rs 98.5 lakh, and an officer reading both would not
    #: know which to believe. One question, one definition.
    at_risk: TaxVector = field(default_factory=TaxVector)


def _accumulate_inward(data: TaxpayerData) -> dict[str, _Party]:
    """Credit from GSTR-2B, filing status from GSTR-2A, and never mixed.

    The two statements carry the same invoices, so summing both gives a
    supplier roughly twice their real credit. 2B is what the taxpayer could
    claim (s.16(2)(aa)); 2A is the only statement that says whether the
    supplier filed. Each column is taken from the statement that can answer
    it.
    """
    out: dict[str, _Party] = {}
    for row in data.inward:
        if not row.supplier_gstin:
            continue
        party = out.setdefault(
            row.supplier_gstin, _Party(row.supplier_gstin, TaxVector(), _ZERO, 0)
        )
        if row.source_form == "GSTR2B":
            party.tax = party.tax + row.signed_tax
            party.taxable += row.taxable_value
            party.documents += 1
        if row.supplier_3b_filed is not None and party.supplier_3b_filed is not False:
            # False is sticky: one unfiled period is what Rule 37A turns on,
            # and a later filed period does not undo it.
            party.supplier_3b_filed = row.supplier_3b_filed
        if row.supplier_3b_filed is False:
            party.at_risk = party.at_risk + row.signed_tax
    return out


def _accumulate_outward(data: TaxpayerData) -> dict[str, _Party]:
    out: dict[str, _Party] = {}
    for row in data.outward:
        if not row.counterparty_gstin:
            continue
        party = out.setdefault(
            row.counterparty_gstin, _Party(row.counterparty_gstin, TaxVector(), _ZERO, 0)
        )
        party.tax = party.tax + row.signed_tax
        party.taxable += row.taxable_value
        party.documents += 1
    return out


def _points(parties: list[_Party], gstin: str, kind: str) -> tuple[Point, ...]:
    return tuple(
        Point(
            label=p.gstin,
            value=money(p.tax.total),
            heads=p.tax.dict(),
            drill=f"/scrutiny/taxpayer/{gstin}?{kind}={p.gstin}",
            note=f"{p.documents} documents",
        )
        for p in parties[:_TOP]
    )


def build_suppliers(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Credit per supplier, with the supplier's own filing status beside it."""
    if not data.inward:
        return _dark(
            SUPPLIER_ID, "Supplier-wise credit", data.profile.gstin, fy, ("GSTR-2A or GSTR-2B",)
        )

    parties = sorted(_accumulate_inward(data).values(), key=lambda p: -p.tax.total)
    total = sum((p.tax for p in parties), TaxVector())
    unfiled = [p for p in parties if p.supplier_3b_filed is False]
    unknown = [p for p in parties if p.supplier_3b_filed is None]
    at_risk = sum((p.at_risk for p in parties), TaxVector())

    rows = tuple(
        ReportRow(
            cells={
                "Supplier": p.gstin,
                "Documents": str(p.documents),
                "Taxable value": money(p.taxable),
                "Credit (2B)": money(p.tax.total),
                "Share": pct(p.tax.total, total.total),
                "Supplier's GSTR-3B": _filing_label(p.supplier_3b_filed),
                "Credit at risk (Rule 37A)": money(p.at_risk.total),
            },
            flag="FAIL" if p.supplier_3b_filed is False else None,
        )
        for p in parties
    )

    return Report(
        id=SUPPLIER_ID,
        title="Supplier-wise credit, and whether the supplier paid",
        gstin=data.profile.gstin,
        fy=fy,
        headline=(
            f"{len(parties)} suppliers account for {money(total.total)} of credit. "
            + (
                f"{len(unfiled)} of them had not filed their own GSTR-3B, covering "
                f"{money(at_risk.total)} - that is the Rule 37A exposure."
                if unfiled
                else "Every supplier whose status the statement records had filed their GSTR-3B."
            )
            + (
                f" {len(unknown)} suppliers' status is not stated, because GSTR-2B "
                f"does not carry that column."
                if unknown
                else ""
            )
        ),
        columns=(
            "Supplier",
            "Documents",
            "Taxable value",
            "Credit (2B)",
            "Share",
            "Supplier's GSTR-3B",
            "Credit at risk (Rule 37A)",
        ),
        series=(
            Series(
                id="top_suppliers",
                title=f"Largest {_TOP} suppliers by credit",
                kind="horizontal_bar",
                unit="rupees of credit",
                points=_points(parties, data.profile.gstin, "supplier"),
            ),
            Series(
                id="filing_status",
                title="Credit by the supplier's own filing status",
                kind="stacked_bar",
                unit="rupees of credit",
                points=(
                    Point(
                        label="Supplier filed",
                        value=money(
                            sum(
                                (p.tax for p in parties if p.supplier_3b_filed is True),
                                TaxVector(),
                            ).total
                        ),
                        drill=(
                            f"/scrutiny/report/{SUPPLIER_ID}?gstin={data.profile.gstin}&filed=1"
                        ),
                        note="the supplier's GSTR-3B is on record as filed",
                    ),
                    Point(
                        label="Supplier did not file",
                        value=money(at_risk.total),
                        drill=f"/scrutiny/report/{SUPPLIER_ID}?gstin={data.profile.gstin}&unfiled=1",
                        note="Rule 37A exposure",
                    ),
                    Point(
                        label="Statement does not say",
                        value=money(sum((p.tax for p in unknown), TaxVector()).total),
                        note="GSTR-2B carries no filing-status column",
                    ),
                ),
            ),
        ),
        rows=rows,
        total=at_risk,
        caveat=(
            "Credit is taken from GSTR-2B and filing status from GSTR-2A, because "
            "only one statement can answer each. 'Credit at risk' is the same "
            "figure check B-04 reports, computed the same way - the rows that "
            "state the supplier had not filed, not every row from a supplier who "
            "defaulted once. "
            "'Statement does not say' is not 'the supplier filed'. GSTR-2B has no "
            "filing-status column at all, so on a 2B-only upload every supplier "
            "lands there and Rule 37A cannot be tested."
        ),
    )


def _filing_label(state: bool | None) -> str:
    if state is True:
        return "Filed"
    if state is False:
        return "NOT FILED"
    return "Not stated"


def build_customers(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Turnover per customer, largest first, with concentration stated."""
    if not data.outward:
        return _dark(
            CUSTOMER_ID, "Customer-wise turnover", data.profile.gstin, fy, ("GSTR-1 as filed",)
        )

    parties = sorted(_accumulate_outward(data).values(), key=lambda p: -p.taxable)
    total_taxable = sum((p.taxable for p in parties), _ZERO)
    top_share = pct(parties[0].taxable, total_taxable) if parties else ""

    rows = tuple(
        ReportRow(
            cells={
                "Customer": p.gstin,
                "Documents": str(p.documents),
                "Taxable value": money(p.taxable),
                "Tax": money(p.tax.total),
                "Share": pct(p.taxable, total_taxable),
            }
        )
        for p in parties
    )

    return Report(
        id=CUSTOMER_ID,
        title="Customer-wise turnover",
        gstin=data.profile.gstin,
        fy=fy,
        headline=(
            f"{len(parties)} customers account for {money(total_taxable)} of taxable "
            f"supply. The largest single customer is {top_share}% of it."
        ),
        columns=("Customer", "Documents", "Taxable value", "Tax", "Share"),
        series=(
            Series(
                id="top_customers",
                title=f"Largest {_TOP} customers by taxable value",
                kind="horizontal_bar",
                unit="rupees of taxable value",
                points=_points(parties, data.profile.gstin, "customer"),
            ),
        ),
        rows=rows,
        caveat=(
            "Concentration is a risk profile, not a finding. A taxpayer with one "
            "customer and a taxpayer with two hundred are different files to "
            "scrutinise; neither is wrong."
        ),
    )


def build_overlap(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Counterparties on both sides: purchase and sales correlation."""
    if not data.outward or not data.inward:
        return _dark(
            OVERLAP_ID,
            "Counterparties on both sides",
            data.profile.gstin,
            fy,
            ("both GSTR-1 and GSTR-2A/2B, to have two sides to compare",),
        )

    suppliers = _accumulate_inward(data)
    customers = _accumulate_outward(data)
    both = sorted(set(suppliers) & set(customers))

    rows = tuple(
        ReportRow(
            cells={
                "Counterparty": gstin,
                "Bought from them": money(suppliers[gstin].taxable),
                "Sold to them": money(customers[gstin].taxable),
                "Net position": money(customers[gstin].taxable - suppliers[gstin].taxable),
                "Documents": str(suppliers[gstin].documents + customers[gstin].documents),
                "Supplier's GSTR-3B": _filing_label(suppliers[gstin].supplier_3b_filed),
            },
            flag="ASK",
        )
        for gstin in sorted(
            both,
            key=lambda g: -(suppliers[g].taxable + customers[g].taxable),
        )
    )

    purchases = sum((suppliers[g].taxable for g in both), _ZERO)
    sales = sum((customers[g].taxable for g in both), _ZERO)

    return Report(
        id=OVERLAP_ID,
        title="Counterparties this taxpayer both buys from and sells to",
        gstin=data.profile.gstin,
        fy=fy,
        headline=(
            f"{len(both)} counterparties appear on both sides of the file: "
            f"{money(purchases)} bought from them and {money(sales)} sold to them."
            if both
            else "No counterparty appears as both a customer and a supplier."
        ),
        columns=(
            "Counterparty",
            "Bought from them",
            "Sold to them",
            "Net position",
            "Documents",
            "Supplier's GSTR-3B",
        ),
        series=(
            Series(
                id="both_sides",
                title="Bought from against sold to, by counterparty",
                kind="grouped_bar",
                unit="rupees of taxable value",
                value_label="Bought from them",
                compare_label="Sold to them",
                points=tuple(
                    Point(
                        label=gstin,
                        value=money(suppliers[gstin].taxable),
                        compare=money(customers[gstin].taxable),
                        drill=f"/scrutiny/taxpayer/{data.profile.gstin}?party={gstin}",
                    )
                    for gstin in sorted(
                        both, key=lambda g: -(suppliers[g].taxable + customers[g].taxable)
                    )[:_TOP]
                ),
            ),
        ),
        rows=rows,
        caveat=(
            "Buying from a customer is ordinary in many trades - a job worker, a "
            "distributor taking returns, a group company. It is also the shape "
            "circular trading takes. This report states the overlap and stops "
            "there: settling it needs the counterparties' own returns, which the "
            "department holds and this platform has not been given."
        ),
    )
