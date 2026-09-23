"""GSTR-3B against GSTR-1: what was declared against what was paid on.

The oldest reconciliation in scrutiny and still the first one an officer
asks for. GSTR-1 is the invoice-level statement of outward supply; 3B table
3.1 is the summary the liability is discharged from. They are populated from
the same invoices, so a difference is either an amendment that did not carry
through, a table filed late, or liability declared in one place and not the
other.

**Head-wise, never a scalar.** IGST short and CGST long by the same amount is
not "reconciled": it is two different taxes owed to two different
governments, and a report that nets them has hidden the entire finding. This
is Law 3 at the reporting layer, and the reason the difference is a
`TaxVector` all the way to the wire.

**Signed, because a credit note reduces.** Outward credit notes are stored
positive and signed at the identity layer, so the GSTR-1 side is summed
through `signed_tax`. Summing raw would overstate the declared figure by twice
every note in the file.

Pure: no I/O, no clock. docs/01 module G; `docs/08` report 1.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Final

from app.canonical import Period
from app.engine.records import TaxpayerData
from app.money import TaxVector
from app.reports.base import Point, Report, ReportRow, Series, money
from app.reports.base import not_evaluated as _dark

__all__ = ["REPORT_ID", "build"]

REPORT_ID: Final[str] = "gstr3b_vs_gstr1"
_TITLE: Final[str] = "GSTR-3B against GSTR-1"
_ZERO: Final[Decimal] = Decimal("0.00")

#: Below this a difference is rounding in the taxpayer's own software rather
#: than a liability. Stated here rather than hidden in a comparison, and it
#: only ever suppresses the *flag*, never the row - the number is always shown.
MATERIAL: Final[Decimal] = Decimal("1.00")


def _declared_in_gstr1(data: TaxpayerData, period: Period) -> TaxVector:
    return sum((row.signed_tax for row in data.outward_for(period)), TaxVector())


def build(data: TaxpayerData, fy: str, periods: tuple[Period, ...]) -> Report:
    """One row per period: declared in GSTR-1, paid on in 3B, and the gap."""
    if not data.outward:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-1 as filed",))
    if not data.returns_3b:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-3B as filed",))

    rows: list[ReportRow] = []
    points: list[Point] = []
    running = TaxVector()
    flagged = 0

    for period in periods:
        one = _declared_in_gstr1(data, period)
        three_b = data.return_3b_for(period)
        if three_b is None:
            # A period with no 3B is not a period that declared nil. It is a
            # return nobody filed, and saying "difference = the whole of
            # GSTR-1" would be arithmetic on an absence.
            rows.append(
                ReportRow(
                    cells={
                        "Period": period.mmyyyy,
                        "GSTR-1 (declared)": money(one.total),
                        "GSTR-3B 3.1 (paid on)": "",
                        "Difference": "",
                        "Status": "GSTR-3B not filed for this period",
                    },
                    flag="NOT_EVALUATED",
                )
            )
            continue

        paid = three_b.outward_tax
        gap = one - paid
        running = running + gap
        material = gap.abs_total > MATERIAL
        flagged += 1 if material else 0

        rows.append(
            ReportRow(
                cells={
                    "Period": period.mmyyyy,
                    "GSTR-1 (declared)": money(one.total),
                    "GSTR-3B 3.1 (paid on)": money(paid.total),
                    "Difference": money(gap.total),
                    "IGST": money(gap.igst),
                    "CGST": money(gap.cgst),
                    "SGST": money(gap.sgst),
                    "Cess": money(gap.cess),
                    "Status": "Differs" if material else "Agrees",
                },
                evidence_ids=tuple(r.row_id for r in data.outward_for(period)[:50] if r.row_id),
                flag="FAIL" if material else "PASS",
            )
        )
        points.append(
            Point(
                label=period.mmyyyy,
                value=money(one.total),
                compare=money(paid.total),
                heads=gap.dict(),
                drill=f"/scrutiny/taxpayer/{data.profile.gstin}?period={period.mmyyyy}",
                note=f"difference {money(gap.total)}",
            )
        )

    return Report(
        id=REPORT_ID,
        title=_TITLE,
        gstin=data.profile.gstin,
        fy=fy,
        headline=_headline(running, flagged, len(points)),
        columns=(
            "Period",
            "GSTR-1 (declared)",
            "GSTR-3B 3.1 (paid on)",
            "Difference",
            "IGST",
            "CGST",
            "SGST",
            "Cess",
            "Status",
        ),
        series=(
            Series(
                id="by_period",
                title="Declared in GSTR-1 against paid on in GSTR-3B",
                kind="grouped_bar",
                unit="rupees of tax",
                value_label="GSTR-1",
                compare_label="GSTR-3B 3.1",
                points=tuple(points),
            ),
        ),
        rows=tuple(rows),
        total=running,
        caveat=(
            "The difference is shown head by head and never as one number. "
            "IGST short and CGST long by the same amount is not a reconciled "
            "return; it is two taxes owed to two different governments."
        ),
    )


def _headline(total: TaxVector, flagged: int, periods: int) -> str:
    if periods == 0:
        return "No period in this year has both a GSTR-1 and a GSTR-3B to compare."
    if flagged == 0:
        return (
            f"Across {periods} periods, what was declared in GSTR-1 and what was "
            f"paid on in GSTR-3B agree to the rupee."
        )
    direction = "more than" if total.total > _ZERO else "less than"
    return (
        f"In {flagged} of {periods} periods the two returns disagree. Across the "
        f"year GSTR-1 declares {money(abs(total.total))} {direction} GSTR-3B paid "
        f"tax on."
    )
