"""Reading a GSTR-3B, which is shaped the other way round.

Every other return the platform ingests is a register: one row per invoice,
one column per attribute.  A 3B is a **summary table** -- one row per line of
the return ("3.1(a) Outward taxable supplies…") and one column per tax head.
The row-per-record pipeline cannot read it, and before this module a 3B
workbook quarantined every row with "unrecognised period", which is true but
unhelpful.

The whole return becomes **one** canonical record whose ``cells`` carry
``t31a_igst``, ``t31a_cgst`` and so on -- the portal's own table numbering, so
that a formula in a notice can cite "3B Table 3.1(a)" and an officer can find
the column it came from.

A line whose label matches nothing is reported, not guessed at: a 3B with an
unreadable line is a 3B whose totals cannot be trusted.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from itertools import pairwise
from typing import Any, Final

from app.canonical import FinancialYear, Period
from app.ingestion.coerce import CoercionError, coerce_money, coerce_period
from app.ingestion.reader import RawSheet
from app.ingestion.synonyms import _RETURN_3B, _edit_distance, normalise_header

__all__ = ["ThreeBOutcome", "read_three_b"]

#: Column header -> the suffix the cell takes in the record.
_HEAD_COLUMNS: Final[tuple[tuple[tuple[str, ...], str], ...]] = (
    (("integrated tax", "igst", "integrated"), "igst"),
    (("central tax", "cgst", "central"), "cgst"),
    (("state ut tax", "state tax", "sgst", "utgst", "state"), "sgst"),
    (("cess", "compensation cess"), "cess"),
    (("total taxable value", "taxable value", "taxable"), "taxable"),
)

#: A GSTIN anywhere in the banner above the table.
_GSTIN: Final[re.Pattern[str]] = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")

#: How far down to look for the banner and the header row.
_SCAN_ROWS: Final[int] = 12

#: A row naming this many distinct tax heads is the header.  One alone is too
#: easily a stray label; two together are unambiguous.
_MIN_HEAD_COLUMNS: Final[int] = 2


@dataclass
class ThreeBOutcome:
    """What one 3B sheet yielded."""

    gstin: str | None = None
    period: Period | None = None
    cells: dict[str, Any] = field(default_factory=dict)
    #: (row index, the label that matched nothing).
    unreadable_lines: list[tuple[int, str]] = field(default_factory=list)
    header_row: int | None = None
    rows_seen: int = 0

    @property
    def usable(self) -> bool:
        """A 3B is usable when it names its filer, its period and any figure."""
        return self.gstin is not None and self.period is not None and bool(self.cells)


def _period_in(text: str) -> Period | None:
    """The tax period named anywhere in a banner line.

    A banner reads "GSTIN 27... Return Period: Jul-2025", so the period is a
    token inside a longer line rather than the line itself. Every token and
    every adjacent pair is tried, longest first, so "Jul 2025" is found as
    readily as "Jul-2025" or "072025".
    """
    tokens = [token for token in re.split(r"[\s:,]+", text) if token]
    pairs = [f"{a} {b}" for a, b in pairwise(tokens)]
    for candidate in [*pairs, *tokens]:
        try:
            return coerce_period(candidate)
        except (CoercionError, ValueError):
            continue
    return None


def _label_to_field(label: str) -> str | None:
    """Match a table line's label to its field, e.g. "3.1(a)" -> ``t31a``."""
    text = normalise_header(label)
    if not text:
        return None
    for field_name, synonyms in _RETURN_3B.items():
        for synonym in synonyms:
            candidate = normalise_header(synonym)
            if not candidate:
                continue
            # A 3B line is written either as its number ("3.1 a") or as its
            # words ("outward taxable supplies other than zero rated ...").
            # Both appear in the wild, often in the same file.
            if candidate in text or text in candidate:
                return field_name

    # Exact containment missed. Real returns carry typos -- every one of the
    # first nine filed workbooks writes "exemted" for "exempted" in Table
    # 3.1(a) and 3.1(c), the same slip in all of them, so it is the filing
    # tool's rather than one accountant's. Twenty-four lines a year, and
    # 3.1(a) is the figure twenty-one rules compare against.
    return _closest_line(text)


#: How close a misspelt label must be to count as the same line. The lexicon's
#: own floor for a column header; a 3B line is longer and more distinctive, so
#: the same floor is a stricter test here, not a looser one.
_LINE_FLOOR: Final[int] = 88


def _closest_line(text: str) -> str | None:
    """The 3B line this label is nearest to, if it is near enough.

    Scored on the same edit distance the column lexicon uses. The numeric
    synonyms ("3 1 a") are skipped: they are short, so an unrelated label
    scores well against them by accident.
    """
    best_field: str | None = None
    best_score = 0
    for field_name, synonyms in _RETURN_3B.items():
        for synonym in synonyms:
            candidate = normalise_header(synonym)
            if len(candidate) < _MIN_LINE_LENGTH:
                continue
            score = _similarity(text, candidate)
            if score > best_score:
                best_field, best_score = field_name, score
    return best_field if best_score >= _LINE_FLOOR else None


#: Below this a synonym is a table number, not a description.
_MIN_LINE_LENGTH: Final[int] = 12


def _similarity(left: str, right: str) -> int:
    """Percentage similarity, 0-100, on normalised edit distance."""
    longest = max(len(left), len(right))
    if longest == 0:
        return 0
    return int((1 - _edit_distance(left, right) / longest) * 100)


def _head_columns(headers: list[object]) -> dict[int, str]:
    """Which column carries which tax head."""
    found: dict[int, str] = {}
    for index, raw in enumerate(headers):
        text = normalise_header(str(raw or ""))
        if not text:
            continue
        for aliases, suffix in _HEAD_COLUMNS:
            if any(alias == text or alias in text for alias in aliases):
                found.setdefault(index, suffix)
                break
    return found


def _banner(rows: list[list[Any]]) -> tuple[str | None, Period | None]:
    """The filer and the period, from the lines above the table."""
    gstin: str | None = None
    period: Period | None = None
    for row in rows[:_SCAN_ROWS]:
        for cell in row:
            if not isinstance(cell, str):
                continue
            if gstin is None:
                match = _GSTIN.search(cell)
                if match:
                    gstin = match.group(0)
            if period is None:
                period = _period_in(cell)
    return gstin, period


def read_three_b(
    sheet: RawSheet,
    *,
    owner_gstin: str | None = None,
    period_hint: Period | None = None,
    fy: FinancialYear | None = None,
) -> list[ThreeBOutcome]:
    """Read a GSTR-3B sheet into one outcome per tax period it carries.

    The portal exports a 3B one month at a time and names the sheet for the
    period. A compliance tool exporting a whole year puts every month in one
    sheet and carries the period in a ``Month`` column -- so a sheet is not a
    return, and reading it as one loses eleven months of twelve.

    Returns a list because a sheet genuinely holds several returns. A sheet
    with no month column yields a list of one, which is the portal's case.
    """
    rows = sheet.rows
    gstin, banner_period = _banner(rows)
    gstin = gstin or owner_gstin
    banner_period = banner_period or period_hint

    heads, header_row = _find_head_row(rows)
    if not heads or header_row is None:
        empty = ThreeBOutcome(gstin=gstin, period=banner_period)
        return [empty]

    month_column = _month_column(list(rows[header_row]))
    by_period: dict[Period | None, ThreeBOutcome] = {}

    def outcome_for(period: Period | None) -> ThreeBOutcome:
        found = by_period.get(period)
        if found is None:
            found = ThreeBOutcome(gstin=gstin, period=period, header_row=header_row)
            by_period[period] = found
        return found

    outcome = outcome_for(banner_period)

    for row_index in range(header_row + 1, len(rows)):
        row = list(rows[row_index])
        if not any(cell not in (None, "") for cell in row):
            continue
        label = next((str(cell) for cell in row if isinstance(cell, str) and cell.strip()), "")
        if not label:
            continue

        # A 3B sheet holds several tables and they are NOT the same shape:
        # Table 3.1 carries a taxable-value column between the label and the
        # heads, Table 4 does not.  Re-read the column map whenever a row is
        # itself a header, or every figure below it shifts one column left --
        # which silently apportions credit to the wrong government.
        restated = _head_columns(row)
        if len(set(restated.values())) >= _MIN_HEAD_COLUMNS:
            heads = restated
            continue

        # A section title carries no figures.  It is not a line that failed to
        # read, and reporting it as one buries the real failures: two such rows
        # a month is twenty-four across a year.
        if not _carries_a_figure(row, heads):
            continue

        # Which return this line belongs to. A Month column names it per row;
        # otherwise the whole sheet is one return, named in the banner.
        if month_column is not None:
            cell = row[month_column] if month_column < len(row) else None
            named = _period_for(cell, fy, banner_period)
            if named is None:
                continue
            outcome = outcome_for(named)
            # The line's own label sits past the serial number and the month;
            # the first textual cell of such a row is "1" or "June", and
            # matching a 3B line against either finds nothing.
            label = _label_beyond(row, month_column)
            if not label:
                continue

        outcome.rows_seen += 1

        field_name = _label_to_field(label)
        if field_name is None:
            outcome.unreadable_lines.append((row_index, label.strip()[:120]))
            continue

        _read_line_into(outcome, row, heads, field_name)

    return [found for found in by_period.values() if found.cells] or [outcome_for(banner_period)]


def _carries_a_figure(row: list[Any], heads: dict[int, str]) -> bool:
    """Whether this row carries money *in a tax-head column*.

    The column restriction is the whole point. A whole-year export writes a
    running serial number in its first column, so

        ["7", "April", "Total ITC Available (A)"]

    has a number on it -- and scanning every cell therefore read a subtotal
    heading as a line that carries figures. Five such rows a month is sixty a
    year per filer, every one reported as an unreadable 3B line, burying the
    real failures among them. That is precisely what the structural-row rule
    exists to prevent (D-0035), defeated by the serial number beside the
    label.

    Deliberately generous within those columns: a line showing only zeros is a
    real line of the return that happens to be nil, and must be read as nil
    rather than skipped. Only a row with nothing numeric *under a head* is
    structural.
    """
    for column in heads:
        cell = row[column] if column < len(row) else None
        if cell in (None, ""):
            continue
        try:
            coerce_money(cell)
        except CoercionError:
            continue
        return True
    return False


#: Header spellings that name the tax period on a whole-year 3B export.
_MONTH_HEADERS: Final[frozenset[str]] = frozenset(
    {"month", "period", "tax period", "return period", "month year"}
)


def _read_line_into(
    outcome: ThreeBOutcome, row: list[Any], heads: dict[int, str], field_name: str
) -> None:
    """Copy one 3B line's figures into the outcome, head by head."""
    for column, suffix in heads.items():
        if column >= len(row):
            continue
        try:
            value = coerce_money(row[column])
        except CoercionError:
            continue
        outcome.cells[f"{field_name}_{suffix}"] = value


def _find_head_row(rows: list[list[Any]]) -> tuple[dict[int, str], int | None]:
    """The first row that names at least two tax heads, and its column map."""
    for index, row in enumerate(rows[:_SCAN_ROWS]):
        candidate = _head_columns(list(row))
        if len(set(candidate.values())) >= _MIN_HEAD_COLUMNS:
            return candidate, index
    return {}, None


def _month_column(header: list[Any]) -> int | None:
    """Which column names the tax period, if any."""
    for index, cell in enumerate(header):
        if normalise_header(str(cell or "")) in _MONTH_HEADERS:
            return index
    return None


def _period_for(cell: Any, fy: FinancialYear | None, fallback: Period | None) -> Period | None:
    """The period a 3B line belongs to, from its Month cell."""
    text = str(cell or "").strip()
    if not text:
        return fallback
    try:
        return Period.parse(text)
    except ValueError:
        if fy is not None:
            named = Period.in_financial_year(text, fy)
            if named is not None:
                return named
    return None


def _label_beyond(row: list[Any], month_column: int) -> str:
    """The line's own label, ignoring the serial number and the month.

    On a whole-year export the first textual cell of a row is "1" or the month
    name; the label of the 3B line sits after them.
    """
    for index in range(month_column + 1, len(row)):
        cell = row[index]
        if isinstance(cell, str) and cell.strip():
            return cell
    return ""
