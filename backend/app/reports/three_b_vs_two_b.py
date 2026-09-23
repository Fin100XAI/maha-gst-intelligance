"""GSTR-3B against GSTR-2B: credit claimed against credit available.

Rule 88D. The comparison that produces DRC-01C, and the one most often got
wrong in two specific ways, both of which this report refuses to make.

**Only table 4(A)(5) is comparable.** Import IGST, import services, ISD
credit and reverse charge sit in 4(A)(1) to (4) and are *not* part of the
GSTR-2B "all other ITC" bucket. Comparing gross 4(A) against 2B overstates
the claim by every import line in the file and collapses on reply.

**2B, never 2A.** 2B is the statutory gate under s.16(2)(aa); 2A is the
record of supplier behaviour that Rule 37A reads. They share their columns and
are different documents, and a file carrying both has roughly twice the rows.

Pure: no I/O, no clock. docs/01 module B; `docs/08` report 2.
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

REPORT_ID: Final[str] = "gstr3b_vs_gstr2b"
_TITLE: Final[str] = "GSTR-3B against GSTR-2B (input tax credit)"
_ZERO: Final[Decimal] = Decimal("0.00")
MATERIAL: Final[Decimal] = Decimal("1.00")


def _available(data: TaxpayerData, period: Period) -> TaxVector:
    """The 2B "all other ITC" bucket, as Rule 88D compares it."""
    return sum(
        (row.signed_tax for row in data.inward_for(period) if row.counts_toward_2b_available),
        TaxVector(),
    )


def build(data: TaxpayerData, fy: str, periods: tuple[Period, ...]) -> Report:
    """One row per period: available in 2B, claimed in 3B 4(A)(5), and the excess."""
    if not any(row.source_form == "GSTR2B" for row in data.inward):
        return _dark(
            REPORT_ID,
            _TITLE,
            data.profile.gstin,
            fy,
            ("GSTR-2B as generated (GSTR-2A is a different statement and cannot answer this)",),
        )
    if not data.returns_3b:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-3B as filed",))

    rows: list[ReportRow] = []
    points: list[Point] = []
    excess_total = TaxVector()
    flagged = 0

    for period in periods:
        three_b = data.return_3b_for(period)
        if three_b is None:
            rows.append(
                ReportRow(
                    cells={
                        "Period": period.mmyyyy,
                        "GSTR-2B available": money(_available(data, period).total),
                        "GSTR-3B 4(A)(5) claimed": "",
                        "Excess claimed": "",
                        "Status": "GSTR-3B not filed for this period",
                    },
                    flag="NOT_EVALUATED",
                )
            )
            continue

        available = _available(data, period)
        claimed = three_b.itc_all_other
        excess = (claimed - available).positive_part()
        excess_total = excess_total + excess
        material = excess.abs_total > MATERIAL
        flagged += 1 if material else 0

        rows.append(
            ReportRow(
                cells={
                    "Period": period.mmyyyy,
                    "GSTR-2B available": money(available.total),
                    "GSTR-3B 4(A)(5) claimed": money(claimed.total),
                    "Excess claimed": money(excess.total),
                    "IGST": money(excess.igst),
                    "CGST": money(excess.cgst),
                    "SGST": money(excess.sgst),
                    "Cess": money(excess.cess),
                    "Status": "Excess" if material else "Within 2B",
                },
                evidence_ids=tuple(
                    r.row_id
                    for r in data.inward_for(period)[:50]
                    if r.row_id and r.counts_toward_2b_available
                ),
                flag="FAIL" if material else "PASS",
            )
        )
        points.append(
            Point(
                label=period.mmyyyy,
                value=money(available.total),
                compare=money(claimed.total),
                heads=excess.dict(),
                drill=f"/scrutiny/taxpayer/{data.profile.gstin}?period={period.mmyyyy}",
                note=f"excess {money(excess.total)}",
            )
        )

    return Report(
        id=REPORT_ID,
        title=_TITLE,
        gstin=data.profile.gstin,
        fy=fy,
        headline=_headline(excess_total, flagged, len(points)),
        columns=(
            "Period",
            "GSTR-2B available",
            "GSTR-3B 4(A)(5) claimed",
            "Excess claimed",
            "IGST",
            "CGST",
            "SGST",
            "Cess",
            "Status",
        ),
        series=(
            Series(
                id="by_period",
                title="Credit available in GSTR-2B against credit claimed in GSTR-3B",
                kind="grouped_bar",
                unit="rupees of credit",
                value_label="Available (2B)",
                compare_label="Claimed (3B 4A5)",
                points=tuple(points),
            ),
        ),
        rows=tuple(rows),
        total=excess_total,
        caveat=(
            "Compared against table 4(A)(5) only. Import IGST, import services, "
            "ISD credit and reverse charge sit in 4(A)(1) to (4) and are not part "
            "of the 2B 'all other ITC' bucket. The excess is shown head by head."
        ),
    )


def _headline(excess: TaxVector, flagged: int, periods: int) -> str:
    if periods == 0:
        return "No period in this year has both a GSTR-2B and a GSTR-3B to compare."
    if flagged == 0:
        return (
            f"Across {periods} periods the credit claimed never exceeded the credit "
            f"GSTR-2B made available."
        )
    return (
        f"In {flagged} of {periods} periods more credit was claimed than GSTR-2B "
        f"made available, {money(excess.total)} in total across the year. Under "
        f"Rule 88D the taxpayer must explain the difference or reverse it."
    )
