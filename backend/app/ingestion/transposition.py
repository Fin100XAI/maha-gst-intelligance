"""Detecting a date column whose day and month Excel silently swapped.

A producing tool writes `dd-mm-yyyy` into a sheet an `mm-dd` locale then
opens. Excel parses what it can and leaves the rest:

* day > 12  -> not a valid month, so Excel gives up and stores the **string**
* day <= 12 -> a valid month, so Excel parses it and stores a **datetime**
               with the day and month **swapped**

The column then looks unremarkable. Every value in it with a day under 13 is a
different date from the one the taxpayer wrote, and nothing on screen says so.

Read naively on the real SSR Marine workbook this produced **250 breaches of
the Rule 48(4) thirty-day e-invoice window and 314 invoices with a negative
reporting lag** -- an acknowledgement generated before its own invoice
existed. Two hundred and fifty fabricated notices, from one coercion.
docs/07 Part C1.

**The signature is what makes this correctable rather than a guess.** If every
string cell has day > 12 and every datetime cell has day <= 12, no other
explanation fits: a genuine mixed column would not partition that cleanly. If
the partition is not clean the verdict is AMBIGUOUS and the column is
quarantined for a human, because a silent wrong correction is worse than a
refusal an officer can see.

Pure: no I/O, no clock, no logging. The caller records the correction and
surfaces it in the ingestion report.
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Sequence
from datetime import datetime
from enum import StrEnum
from typing import Final

__all__ = [
    "Verdict",
    "correct_transposed",
    "detect_transposition",
    "is_faithful",
    "is_suspect",
    "transposition_counts",
]

#: Above this, a number cannot be a month, so Excel cannot have parsed it.
MAX_MONTH: Final[int] = 12

#: No month has more days than this; a larger leading number is not a day.
MAX_DAY: Final[int] = 31

#: A two-digit year in a written date belongs to this century.
_CENTURY: Final[int] = 100

#: A leading day in a `dd-mm-yyyy` / `dd/mm/yy` string.
_LEADING_DAY: Final[re.Pattern[str]] = re.compile(r"^\s*(\d{1,2})\s*[-/.]")

#: A whole `dd-mm-yyyy` / `dd/mm/yy` string, for a text cell acting as a
#: witness. Text is the one form that cannot have been transposed, because
#: it is the form Excel produced by refusing to parse.
_WRITTEN_DATE: Final[re.Pattern[str]] = re.compile(
    r"^\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2,4})\s*$"
)


class Verdict(StrEnum):
    """What the column's shape says about it."""

    #: Every string has day > 12 and every datetime has day <= 12. Correct it.
    CERTAIN = "CERTAIN"
    #: Not a mixed column, or no dates at all. Nothing to do.
    ABSENT = "ABSENT"
    #: Mixed, but the partition does not hold. Quarantine and ask.
    AMBIGUOUS = "AMBIGUOUS"


def _string_day(value: str) -> int | None:
    found = _LEADING_DAY.match(value)
    if found is None:
        return None
    day = int(found.group(1))
    return day if 1 <= day <= MAX_DAY else None


def transposition_counts(column: Iterable[object]) -> tuple[list[int], list[int]]:
    """The day components, split by how the cell was stored.

    Returned separately because the whole diagnosis is the relationship
    between the two lists, and a caller reporting the correction wants to show
    both counts.
    """
    string_days: list[int] = []
    datetime_days: list[int] = []
    for cell in column:
        if cell is None:
            continue
        if isinstance(cell, datetime):
            datetime_days.append(cell.day)
        elif isinstance(cell, str):
            if not cell.strip():
                continue
            day = _string_day(cell)
            if day is not None:
                string_days.append(day)
    return string_days, datetime_days


def _by_partition(column: Sequence[object]) -> Verdict:
    """The first signature: how the column's own cells are stored.

    ``CERTAIN`` only when the partition is exact in both directions. One
    datetime with day > 12 proves Excel did not swap that cell, and one string
    with day <= 12 proves Excel could have parsed it and did not -- either
    breaks the explanation, and a broken explanation may not be acted on.
    """
    string_days, datetime_days = transposition_counts(column)

    # Not mixed: there is nothing to reconcile and nothing to correct.
    if not string_days or not datetime_days:
        return Verdict.ABSENT

    strings_all_high = all(day > MAX_MONTH for day in string_days)
    datetimes_all_low = all(day <= MAX_MONTH for day in datetime_days)
    if strings_all_high and datetimes_all_low:
        return Verdict.CERTAIN
    return Verdict.AMBIGUOUS


def _as_written(cell: object) -> datetime | None:
    """A cell's date as the taxpayer wrote it, or ``None`` if it is not one.

    A datetime is taken at face value -- whether it was swapped is the
    question being asked elsewhere. A string is parsed as `dd-mm-yyyy`, which
    is the premise of this whole module: the producing tool wrote that format,
    and the cells that stayed text are exactly the ones the locale refused.
    """
    if isinstance(cell, datetime):
        return cell
    if not isinstance(cell, str):
        return None
    found = _WRITTEN_DATE.match(cell)
    if found is None:
        return None
    day, month, year = (int(part) for part in found.groups())
    if year < _CENTURY:
        year += 2000
    try:
        return datetime(year, month, day)  # a sheet cell carries no zone
    except ValueError:
        return None


def is_faithful(column: Iterable[object]) -> bool:
    """Whether this column proves it was parsed the way it was written.

    Two ways to prove it. One parsed cell with a day above 12: no swap could
    have produced it, so the locale read this column literally. Or no parsed
    cell at all: nothing was parsed, so nothing was swapped, and text is the
    most trustworthy witness there is.

    What cannot prove itself is a column of parsed cells that all fall on the
    first twelve days of their months - which is exactly the shape a fully
    transposed small column has. Two swapped columns agree with each other
    perfectly while both being wrong, so such a column is never used as a
    witness.
    """
    _, datetime_days = transposition_counts(column)
    if not datetime_days:
        return True
    return any(day > MAX_MONTH for day in datetime_days)


def _by_corroboration(column: Sequence[object], witness: Sequence[object]) -> Verdict:
    """The second signature: the row contradicts itself and the swap fixes it.

    Needed because the first signature goes silent on a small column. If every
    date in it happens to fall on the first twelve days of its month, Excel
    parsed all of them, nothing is left as text, and the partition has nothing
    to partition -- while every value in the column is still wrong. On the
    reference workbook that is `GSTR2A_CDN`: fourteen credit notes, all days 4
    to 10, and nine of them acknowledged before they were issued.

    So ask the row instead. The witness is the same row's document date, and
    it is used only when it can prove it was itself read faithfully. If the
    naive reading has the acknowledgement preceding its own document, and
    swapping every swappable cell in the column leaves no such contradiction
    anywhere, the swap is the explanation. If a contradiction survives the
    swap, or the swap creates a new one, it is not, and the column is held.

    The signal is silent -- ``ABSENT`` -- when nothing contradicts. That is the
    important half: a clean column can never be corrected by this route,
    because a clean column offers no evidence to correct it with.
    """
    if not is_faithful(witness):
        return Verdict.ABSENT

    before = after = 0
    for cell, witnessed in zip(column, witness, strict=False):
        # Only a parsed cell can have been swapped, so only a parsed cell is
        # evidence either way. The witness may be text, and text is better.
        if not isinstance(cell, datetime):
            continue
        vouched = _as_written(witnessed)
        if vouched is None:
            continue
        if cell < vouched:
            before += 1
        swapped = correct_transposed(cell)
        if isinstance(swapped, datetime) and swapped < vouched:
            after += 1

    if before == 0:
        return Verdict.ABSENT
    return Verdict.CERTAIN if after == 0 else Verdict.AMBIGUOUS


def detect_transposition(
    column: Sequence[object],
    *,
    witness: Sequence[object] | None = None,
) -> Verdict:
    """Whether this column's datetime cells have had day and month swapped.

    Two independent signatures, and they must agree. Either alone can say
    ``CERTAIN``; either alone saying ``AMBIGUOUS`` overrules the other,
    because the question is not whether there is *an* explanation but whether
    there is any explanation left unaccounted for.
    """
    partition = _by_partition(column)
    corroboration = Verdict.ABSENT if witness is None else _by_corroboration(column, witness)

    if Verdict.AMBIGUOUS in (partition, corroboration):
        return Verdict.AMBIGUOUS
    if Verdict.CERTAIN in (partition, corroboration):
        return Verdict.CERTAIN
    return Verdict.ABSENT


def correct_transposed(cell: object) -> object:
    """Put a swapped datetime cell back the way the taxpayer wrote it.

    Only datetimes are touched. The string cells were never parsed, so they
    are already correct, and rewriting them would introduce exactly the error
    this exists to remove.

    A datetime whose day exceeds 12 cannot be un-swapped -- there is no month
    25 -- so it is returned unchanged. Such a cell also makes its column
    ``AMBIGUOUS``, so in practice this path is a guard rather than a decision.
    """
    if not isinstance(cell, datetime):
        return cell
    if cell.day > MAX_MONTH:
        return cell
    return cell.replace(day=cell.month, month=cell.day)


def is_suspect(cell: object) -> bool:
    """Whether this cell is one Excel could have swapped.

    A string was never parsed, so it says what the taxpayer wrote. A datetime
    whose day exceeds 12 cannot be the result of a swap, because there is no
    month 25. What remains -- a datetime with a day of 12 or less, in a column
    that is mixed -- is exactly the set of cells whose meaning depends on the
    verdict.

    Under ``CERTAIN`` these are corrected. Under ``AMBIGUOUS`` they are the
    rows that must be held, and the rest of the sheet is untouched: refusing a
    whole column over one unexplained cell would quarantine thousands of rows
    that were never in doubt.
    """
    return isinstance(cell, datetime) and cell.day <= MAX_MONTH
