"""What every report is, and the shape the wire sees.

A report is not a check. A check concludes something and carries a legal
basis; a report lays the numbers side by side and lets an officer conclude.
The difference matters at the boundary: a report may show a difference of
zero and that is a result, where a check showing zero has to say whether it
looked.

Three bands, always, because that is the screen contract in `docs/08`:

    headline   one sentence with the figure, for someone not in finance
    series     one chart's worth of numbers, one y-axis, always drillable
    rows       the working, exportable, because officers live in Excel

Pure: no I/O, no clock, no randomness. `as_of` is injected where a report
needs a date. Money is `Decimal` here and a string on the wire - never a
float, at any point, in either direction.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Final

from app.money import TaxVector

__all__ = [
    "Band",
    "Point",
    "Report",
    "ReportRow",
    "Series",
    "money",
    "pct",
    "rupees",
]

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")

#: Indian grouping: the last three digits, then pairs.
_LAST_THREE: Final[int] = 3
_PAIR: Final[int] = 2


def money(value: Decimal | None) -> str:
    """Money on the wire is a string. Law 1, at the boundary.

    A `Decimal` serialised through JSON becomes a float somewhere between here
    and the browser, and a float rupee is a rupee that can be wrong in the
    eighteenth place. The client re-reads this into its own `Money` object.
    """
    return format(value if value is not None else _ZERO, "f")


def rupees(value: Decimal | None) -> str:
    """A figure for a **sentence**, in Indian grouping: `Rs 12,93,25,891.68`.

    Distinct from `money()` and never interchangeable with it. `money()`
    produces the wire value that the client's `<Money>` component formats and
    attaches provenance to; this produces prose, for the one-line headline an
    officer reads before anything else.

    Still exact, still `Decimal`, still two places. The grouping is Indian
    because the reader is - `1,90,71,332.80`, not `19,071,332.80` - and a
    reader who has to count digits to find the crore is a reader who has
    stopped reading.
    """
    if value is None:
        return "Rs 0.00"
    quantised = value.quantize(Decimal("0.01"))
    sign = "-" if quantised < 0 else ""
    whole, _, paise = format(abs(quantised), "f").partition(".")
    if len(whole) > _LAST_THREE:
        head, tail = whole[:-_LAST_THREE], whole[-_LAST_THREE:]
        groups: list[str] = []
        while len(head) > _PAIR:
            groups.insert(0, head[-_PAIR:])
            head = head[:-_PAIR]
        if head:
            groups.insert(0, head)
        whole = ",".join([*groups, tail])
    return f"Rs {sign}{whole}.{paise}"


def pct(part: Decimal, whole: Decimal) -> str:
    """A percentage as a string, two places, with zero handled honestly.

    A denominator of zero is not 0% and not 100%: it is a question that has no
    answer, and the wire says so with an empty string rather than a number a
    chart would happily plot.
    """
    if whole == _ZERO:
        return ""
    return format((part / whole * _HUNDRED).quantize(Decimal("0.01")), "f")


class Band(str):
    """Which of the three bands a number belongs to. A string so it renders."""

    __slots__ = ()


HEADLINE: Final[str] = "headline"
SERIES: Final[str] = "series"
ROWS: Final[str] = "rows"


@dataclass(frozen=True, slots=True)
class Point:
    """One point on one chart, with what it drills to.

    `drill` is not optional in spirit: `CLAUDE.md` says a chart without a drill
    handler fails review. It is typed optional only because a total bar on a
    summary chart drills to the report it is already on.
    """

    label: str
    value: str
    #: Head-wise, where the number has heads. Never collapsed for display.
    heads: dict[str, str] = field(default_factory=dict)
    #: A second value for a grouped bar - declared against claimed, 1 against
    #: 3B. Never a second y-axis; the two share one scale or they are not
    #: comparable and should not be on one chart.
    compare: str | None = None
    drill: str | None = None
    #: Free-form, for a tooltip. Strings only - a float would arrive here.
    note: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "label": self.label,
            "value": self.value,
            "heads": self.heads,
            "compare": self.compare,
            "drill": self.drill,
            "note": self.note,
        }


@dataclass(frozen=True, slots=True)
class Series:
    """One chart. One y-axis, stated, because there is only ever one."""

    id: str
    title: str
    kind: str
    points: tuple[Point, ...]
    #: What the y-axis measures, in words an officer reads: "rupees of tax",
    #: "invoices", "days late".
    unit: str
    #: The legend labels when `Point.compare` is used.
    value_label: str = "value"
    compare_label: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "kind": self.kind,
            "unit": self.unit,
            "value_label": self.value_label,
            "compare_label": self.compare_label,
            "points": [p.as_dict() for p in self.points],
        }


@dataclass(frozen=True, slots=True)
class ReportRow:
    """One row of the working. Ordered columns, so the export matches the screen."""

    cells: dict[str, str]
    #: The canonical row ids this line was computed from, so the provenance
    #: drawer can reach the spreadsheet cells.
    evidence_ids: tuple[str, ...] = ()
    #: Set where the row is the interesting one, so the table can mark it
    #: without the client re-deriving why.
    flag: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {"cells": self.cells, "evidence_ids": list(self.evidence_ids), "flag": self.flag}


@dataclass(frozen=True, slots=True)
class Report:
    """One report: the answer, the picture, the working.

    `not_evaluated` is a first-class outcome here exactly as it is for a
    check. A report over a dataset nobody uploaded must say which sheet it
    wanted - an empty table reads as "nothing to see", which is the one thing
    it must never mean.
    """

    id: str
    title: str
    gstin: str
    fy: str
    #: The sentence. Written for someone who is not in finance.
    headline: str
    columns: tuple[str, ...] = ()
    series: tuple[Series, ...] = ()
    rows: tuple[ReportRow, ...] = ()
    #: Head-wise totals, where the report has a total worth stating.
    total: TaxVector | None = None
    #: Non-empty when the report could not be built. Names the dataset.
    missing_inputs: tuple[str, ...] = ()
    #: What this report is not. Shown as a footnote, never omitted for space.
    caveat: str | None = None

    @property
    def evaluated(self) -> bool:
        return not self.missing_inputs

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "gstin": self.gstin,
            "fy": self.fy,
            "evaluated": self.evaluated,
            "headline": self.headline,
            "missing_inputs": list(self.missing_inputs),
            "caveat": self.caveat,
            "columns": list(self.columns),
            "series": [s.as_dict() for s in self.series],
            "rows": [r.as_dict() for r in self.rows],
            "total": self.total.dict() if self.total is not None else None,
        }


def not_evaluated(
    report_id: str,
    title: str,
    gstin: str,
    fy: str,
    missing: tuple[str, ...],
) -> Report:
    """A report that could not be built, saying what it wanted.

    The headline is written so it reads correctly on a screen with no other
    context: an officer seeing only this sentence still knows what to ask the
    taxpayer for.
    """
    return Report(
        id=report_id,
        title=title,
        gstin=gstin,
        fy=fy,
        headline=(
            "This report could not be produced, because the platform does not "
            f"have {missing[0]}. Nothing here is a finding of compliance."
        ),
        missing_inputs=missing,
    )
