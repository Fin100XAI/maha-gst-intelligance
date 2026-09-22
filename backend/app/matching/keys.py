"""Document-number normalisation and the L1-L5 key ladder.

Two documents are the same document when two parties wrote the same thing
down differently. `SSR/M/0029/25-26` and `SSR-M-29-25-26` are one invoice;
matching them on the raw string finds nothing, and matching them on value
alone finds too much.

So each join tries a **ladder**, in order, and records which rung matched.
The rung is the evidence strength, and it travels with the pair so an officer
sees how firm the link is before relying on it:

    L1 EXACT     gstin + doc_no + doc_date + taxable_value      CERTAIN
    L2 STRONG    gstin + doc_no + doc_date within 3 days        STRONG
    L3 VALUE     gstin + exact value + doc_date within 15 days  STRONG
    L4 FUZZY     gstin + doc_no edit distance <= 2 + value 1%   ADVISORY
    L5 UNMATCHED its own bucket, never silently dropped

**The original string is kept, always.** Normalisation strips leading zeros
from the numeric tail, which is exactly what X-02 needs to survive: it matches
credit note `CNM118` to invoice `1118` by digit containment, and a normaliser
that helpfully removed those digits would destroy the only link between them.

Pure: no I/O, no clock. docs/02 Part B.
"""

from __future__ import annotations

import re
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from enum import IntEnum
from typing import Any, Final

__all__ = [
    "L2_WINDOW",
    "L3_WINDOW",
    "Candidate",
    "MatchLevel",
    "digits_of",
    "match_level",
    "normalise_doc_no",
    "shares_digit_run",
]

#: L2 allows the two parties to have keyed the date a few days apart.
L2_WINDOW: Final[timedelta] = timedelta(days=3)

#: L3 has no document number to lean on, so the window is wider and the value
#: must be exact. Wider than this and unrelated invoices of the same value in
#: the same month start pairing up.
L3_WINDOW: Final[timedelta] = timedelta(days=15)

#: L4's value tolerance, as a fraction.
L4_VALUE_TOLERANCE: Final[Decimal] = Decimal("0.01")

#: L4's document-number edit distance.
L4_MAX_EDITS: Final[int] = 2

#: A run of digits this long or longer is distinctive enough to link two
#: documents by containment. Three would match any two invoices in a series.
MIN_DIGIT_RUN: Final[int] = 3

_SEPARATORS: Final[re.Pattern[str]] = re.compile(r"[\s/\\\-_.,#]+")
_LEADING_ZEROS: Final[re.Pattern[str]] = re.compile(r"(?<![0-9])0+(?=[0-9])")
_DIGIT_RUN: Final[re.Pattern[str]] = re.compile(r"\d+")


class MatchLevel(IntEnum):
    """Which rung matched. Lower is stronger."""

    L1_EXACT = 1
    L2_STRONG = 2
    L3_VALUE = 3
    L4_FUZZY = 4
    L5_UNMATCHED = 5

    @property
    def confidence(self) -> str:
        """What a finding built on this pair may claim."""
        if self is MatchLevel.L1_EXACT:
            return "CERTAIN"
        if self in (MatchLevel.L2_STRONG, MatchLevel.L3_VALUE):
            return "STRONG"
        return "ADVISORY"


def normalise_doc_no(raw: object) -> str:
    """Upper, separators stripped, leading zeros dropped from each digit run.

    `SSR/M/0029/25-26` -> `SSRM292526`. The original is never replaced; the
    caller keeps it on the record, because X-02's digit-containment match
    needs the digits this function removes.
    """
    if not isinstance(raw, str):
        return ""
    collapsed = _SEPARATORS.sub("", raw.strip().upper())
    return _LEADING_ZEROS.sub("", collapsed)


def digits_of(raw: object) -> list[str]:
    """Every run of digits in a document number, longest first.

    X-02 asks whether a credit note's number references an invoice's. The
    answer is a containment test over these runs, on the ORIGINAL string.
    """
    if not isinstance(raw, str):
        return []
    runs = _DIGIT_RUN.findall(raw)
    return sorted((r for r in runs if len(r) >= MIN_DIGIT_RUN), key=len, reverse=True)


def shares_digit_run(left: object, right: object) -> str | None:
    """The digit run that links two document numbers, if there is one.

    `SSR/CNM118/25-26` and `SSR/M/1118/25-26` share `118`. That is how the
    credit note in `docs/07` Finding 1 is tied to the invoice it cancels -
    the CN is numbered after the document it reverses, which is ordinary
    practice and the only link in the file.
    """
    right_runs = digits_of(right)
    for run in digits_of(left):
        for other in right_runs:
            if run == other or run in other or other in run:
                return run if len(run) <= len(other) else other
    return None


def _edit_distance(a: str, b: str, *, cap: int) -> int:
    """Levenshtein, abandoned once it exceeds `cap`.

    The cap matters: L4 runs over every unmatched pair in a join, and a full
    distance on two long numbers is wasted work when the answer is only ever
    compared against 2.
    """
    if abs(len(a) - len(b)) > cap:
        return cap + 1
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        current = [i]
        for j, cb in enumerate(b, start=1):
            current.append(
                previous[j - 1]
                if ca == cb
                else 1 + min(previous[j - 1], previous[j], current[j - 1])
            )
        if min(current) > cap:
            return cap + 1
        previous = current
    return previous[-1]


@dataclass(frozen=True, slots=True)
class Candidate:
    """One side of a potential pair, reduced to what the ladder reads."""

    gstin: str | None
    doc_no: str | None
    doc_date: date | None
    taxable_value: Decimal | None
    #: Everything else, carried through so the caller can render the row.
    row: Any = field(default=None, compare=False)

    @property
    def key(self) -> str:
        return normalise_doc_no(self.doc_no)


def _within(left: date | None, right: date | None, window: timedelta) -> bool:
    if left is None or right is None:
        return False
    return abs(left - right) <= window


def _values_close(left: Decimal | None, right: Decimal | None, tolerance: Decimal) -> bool:
    if left is None or right is None:
        return False
    if left == right:
        return True
    larger = max(abs(left), abs(right))
    if larger == 0:
        return True
    return abs(left - right) / larger <= tolerance


def match_level(left: Candidate, right: Candidate) -> MatchLevel:
    """The strongest rung on which these two are the same document.

    The counterparty must agree on every rung. Two documents from different
    parties are never the same document however similar their numbers, and a
    ladder that allowed it would pair invoices across suppliers - which is how
    a reconciliation tool produces a confident nonsense.
    """
    if left.gstin is None or right.gstin is None or left.gstin != right.gstin:
        return MatchLevel.L5_UNMATCHED

    same_key = bool(left.key) and left.key == right.key

    if (
        same_key
        and left.doc_date is not None
        and left.doc_date == right.doc_date
        and left.taxable_value is not None
        and left.taxable_value == right.taxable_value
    ):
        return MatchLevel.L1_EXACT

    if same_key and _within(left.doc_date, right.doc_date, L2_WINDOW):
        return MatchLevel.L2_STRONG

    if (
        left.taxable_value is not None
        and left.taxable_value == right.taxable_value
        and _within(left.doc_date, right.doc_date, L3_WINDOW)
    ):
        return MatchLevel.L3_VALUE

    if (
        left.key
        and right.key
        and _edit_distance(left.key, right.key, cap=L4_MAX_EDITS) <= L4_MAX_EDITS
        and _values_close(left.taxable_value, right.taxable_value, L4_VALUE_TOLERANCE)
    ):
        return MatchLevel.L4_FUZZY

    return MatchLevel.L5_UNMATCHED


def best_match(left: Candidate, rights: Sequence[Candidate]) -> tuple[Candidate, MatchLevel] | None:
    """The strongest available pairing for one row, or nothing.

    Deterministic on ties: the first candidate in the given order wins, so two
    runs over one snapshot produce identical pairs and identical calc_ids.
    """
    best: tuple[Candidate, MatchLevel] | None = None
    for right in rights:
        level = match_level(left, right)
        if level is MatchLevel.L5_UNMATCHED:
            continue
        if best is None or level < best[1]:
            best = (right, level)
        if level is MatchLevel.L1_EXACT:
            break
    return best
