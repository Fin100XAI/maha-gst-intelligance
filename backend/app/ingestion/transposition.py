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

__all__ = ["Verdict", "correct_transposed", "detect_transposition", "transposition_counts"]

#: Above this, a number cannot be a month, so Excel cannot have parsed it.
MAX_MONTH: Final[int] = 12

#: No month has more days than this; a larger leading number is not a day.
MAX_DAY: Final[int] = 31

#: A leading day in a `dd-mm-yyyy` / `dd/mm/yy` string.
_LEADING_DAY: Final[re.Pattern[str]] = re.compile(r"^\s*(\d{1,2})\s*[-/.]")


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


def detect_transposition(column: Sequence[object]) -> Verdict:
    """Whether this column's datetime cells have had day and month swapped.

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
