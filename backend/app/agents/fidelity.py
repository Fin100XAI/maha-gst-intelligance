"""Numeric fidelity: the agent layer cannot invent a figure.

Law 4 says the LLM is a scribe and a librarian, never a calculator.  Four
enforcement layers stand behind that, and this module is the second:

1. **No agent has a tool that performs arithmetic.**  There is nothing to
   misuse.
2. **This middleware.**  Every number in a completion must appear in that
   call's tool results, or carry a ``calc_id``, or be on a short list of
   non-quantitative forms (a year, a section number, a form number).  Anything
   else fails the response.
3. **Template slotting** -- the model never sees numeric slot syntax.
4. **Provenance** -- every figure renders as a chip carrying its ``calc_id``.

The test for this is adversarial and build-breaking: the model is prompted to
invent a figure and the response must be rejected.  A middleware that has never
been watched reject something is a middleware nobody knows works.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any, Final

__all__ = [
    "FidelityError",
    "FidelityReport",
    "check_completion",
    "extract_numbers",
    "normalise_number",
]

#: Anything that looks like a quantity: 1,23,456.78 / 12.5% / 38,42,110
_NUMBER: Final[re.Pattern[str]] = re.compile(r"(?<![\w.])(\d[\d,]*(?:\.\d+)?)(?![\w])")

#: A calc_id chip in the completion: the model is allowed to cite a figure it
#: was handed, provided it carries the identifier that resolves it.
_CALC_CHIP: Final[re.Pattern[str]] = re.compile(r"\[\[calc:([0-9a-f]{64})\]\]")

#: Forms that are identifiers rather than quantities.  A section number is not
#: a figure an officer could act on, and refusing them would make the agent
#: unable to write "under section 16(4)".
_IDENTIFIER_CONTEXT: Final[re.Pattern[str]] = re.compile(
    r"(?:section|s\.|sub-section|rule|r\.|notification|circular|form|table|clause|"
    r"chapter|article|gstr|drc|asmt|adt|reg|rfd|din|irn|hsn|sac|gstin|pan|fy|"
    r"financial year|paragraph|para|annexure|schedule|tp)"
    r"[\s\-:.]*[^\s]*$",
    re.IGNORECASE,
)

#: Small integers that are almost always prose ("the three-year bar", "both
#: limits", "14 suppliers" is NOT here -- a count of suppliers is a figure).
_ALLOWED_BARE: Final[frozenset[str]] = frozenset({"0", "1", "2", "3", "4"})

#: A four-digit year, used in dates and citations.
_YEAR: Final[re.Pattern[str]] = re.compile(r"^(19|20)\d{2}$")

#: A tax period or a date: 06/2025, 06-2025, 20-07-2022, 2025-06.  A point in
#: time is an identifier, not a quantity -- an officer cannot act on "June" the
#: way they can act on a rupee figure -- so a date does not need grounding.
_DATE_PART: Final[re.Pattern[str]] = re.compile(
    r"(?:\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b)"
    r"|(?:\b\d{1,2}[/-](?:19|20)\d{2}\b)"
    r"|(?:\b(?:19|20)\d{2}[/-]\d{1,2}\b)"
)


def _date_spans(text: str) -> list[tuple[int, int]]:
    """Where dates and tax periods sit, so their parts are not read as figures."""
    return [(match.start(), match.end()) for match in _DATE_PART.finditer(text)]


class FidelityError(ValueError):
    """A completion contained a number that cannot be traced.

    Raised instead of returning the text, so a failure here can never reach an
    officer's screen.
    """

    def __init__(self, report: FidelityReport) -> None:
        self.report = report
        super().__init__(
            "numeric fidelity check failed: "
            + ", ".join(f"{u.value!r} ({u.context})" for u in report.untraceable)
        )


@dataclass(frozen=True, slots=True)
class Untraceable:
    value: str
    normalised: str
    context: str


@dataclass(frozen=True, slots=True)
class FidelityReport:
    ok: bool
    checked: int
    grounded: tuple[str, ...] = ()
    untraceable: tuple[Untraceable, ...] = ()
    calc_ids: tuple[str, ...] = ()

    def raise_for_status(self) -> None:
        if not self.ok:
            raise FidelityError(self)

    def as_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "checked": self.checked,
            "grounded": list(self.grounded),
            "untraceable": [
                {"value": u.value, "normalised": u.normalised, "context": u.context}
                for u in self.untraceable
            ],
            "calc_ids": list(self.calc_ids),
        }


def normalise_number(text: str) -> str:
    """Canonical form, so 38,42,110 and 3842110.00 compare equal.

    Comparison is on the *value*, not the spelling: the model is allowed to
    format a figure for an Indian reader, and it is not allowed to change it.
    """
    cleaned = text.replace(",", "").strip()
    try:
        value = Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return cleaned
    normalised = value.normalize()
    # Decimal.normalize() renders 3842110 as 3.84211E+6; expand it back.
    return format(normalised, "f")


def extract_numbers(text: str) -> list[tuple[str, int]]:
    """Every number in the text, with the offset it was found at."""
    return [(match.group(1), match.start(1)) for match in _NUMBER.finditer(text)]


def _collect_grounded(payload: Any, into: set[str]) -> None:
    """Every number the tool results actually contain, at any depth."""
    if payload is None or isinstance(payload, bool):
        return
    if isinstance(payload, (int, Decimal)):
        into.add(normalise_number(str(payload)))
        return
    if isinstance(payload, str):
        for value, _ in extract_numbers(payload):
            into.add(normalise_number(value))
        return
    if isinstance(payload, dict):
        for key, value in payload.items():
            into.add(normalise_number(str(key))) if str(key).isdigit() else None
            _collect_grounded(value, into)
        return
    if isinstance(payload, (list, tuple, set, frozenset)):
        for item in payload:
            _collect_grounded(item, into)


def check_completion(
    completion: str,
    *,
    tool_results: Any,
    allow_years: bool = True,
) -> FidelityReport:
    """Scan a completion and ground every number in it.

    A number passes when it appears in the tool results for this call, when it
    is immediately preceded by a ``[[calc:...]]`` chip, when it is a statutory
    identifier (a section, rule, form or table number), or when it is a year.
    Everything else is untraceable and fails the response.
    """
    grounded: set[str] = set()
    _collect_grounded(tool_results, grounded)

    calc_ids = tuple(match.group(1) for match in _CALC_CHIP.finditer(completion))
    # A chip grounds the figure that follows it, so the chip itself is removed
    # before scanning -- otherwise its 64 hex characters would be read as text.
    scannable = _CALC_CHIP.sub("  ", completion)

    untraceable: list[Untraceable] = []
    checked = 0
    dates = _date_spans(scannable)

    for value, offset in extract_numbers(scannable):
        checked += 1
        normalised = normalise_number(value)

        if normalised in grounded or value in grounded:
            continue
        if value in _ALLOWED_BARE:
            continue
        if allow_years and _YEAR.match(value):
            continue
        if any(start <= offset < end for start, end in dates):
            continue

        before = scannable[max(0, offset - 48) : offset]
        # A chip immediately before the figure grounds it.
        if "" in before[-12:]:
            continue
        if _IDENTIFIER_CONTEXT.search(before):
            continue

        untraceable.append(
            Untraceable(
                value=value,
                normalised=normalised,
                context=(before[-32:] + "[" + value + "]").strip(),
            )
        )

    return FidelityReport(
        ok=not untraceable,
        checked=checked,
        grounded=tuple(sorted(grounded)),
        untraceable=tuple(untraceable),
        calc_ids=calc_ids,
    )
