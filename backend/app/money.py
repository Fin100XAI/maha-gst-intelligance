"""Decimal money and the head-wise TaxVector.

This module is the foundation of the platform and is read first.

Law 1 (Determinism): every rupee is a ``Decimal``. No binary float ever reaches a
stored or rendered figure.  ``D`` accepts a float only because spreadsheets emit
them, and it converts through ``str`` so that the *decimal* value the user saw in
Excel is the value we keep.

Law 3 (Head-wise integrity): IGST, CGST, SGST and Cess are carried in a
:class:`TaxVector` and are never added into one scalar by accident.  A scalar is
obtainable only through the explicitly named ``.total`` / ``.abs_total``
properties, which exist so that a threshold test can be written honestly.

Law 5 (Nothing silently assumed): an unparseable money cell raises
:class:`MoneyCoercionError`.  It never degrades to zero.  The ingestion layer
turns that exception into a quarantined row carrying the reason.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from dataclasses import dataclass, replace
from decimal import ROUND_HALF_UP, Decimal, DecimalException, InvalidOperation
from typing import Final

__all__ = [
    "HEADS",
    "MONEY_QUANT",
    "D",
    "MoneyCoercionError",
    "TaxVector",
    "dsum",
    "inr",
    "is_number",
    "rupee",
    "to_decimal",
]

# ---------------------------------------------------------------------------
# constants
# ---------------------------------------------------------------------------

#: Every stored money value is quantised to paise.
MONEY_QUANT: Final[Decimal] = Decimal("0.01")

#: The rupee quantum used by s.170 CGST Act rounding.
RUPEE_QUANT: Final[Decimal] = Decimal("1")

#: Indian grouping: the last three digits, then groups of two.
_GROUP_TAIL: Final[int] = 3
_GROUP_HEAD: Final[int] = 2

#: The four tax heads, in their canonical order.  This order is fixed and is
#: relied upon by serialisation, display and the API contract.
HEADS: Final[tuple[str, ...]] = ("igst", "cgst", "sgst", "cess")

_ZERO: Final[Decimal] = Decimal("0.00")

#: Tokens a portal or accounting export uses to mean "no amount".
_NIL_TOKENS: Final[frozenset[str]] = frozenset(
    {"", "-", "--", "NIL", "NILL", "NA", "N/A", "NONE", "NOT APPLICABLE"}
)

#: Currency ornament stripped before parsing: the rupee sign, the two
#: non-breaking spaces Excel emits, thousands separators and stray quotes.
#: Written as escapes so the pattern stays legible in a plain-text diff.
_ORNAMENT: Final[re.Pattern[str]] = re.compile(
    r"[\u20b9\u00a0\u202f\s,_\u2019']|(?<![A-Za-z])(?:RS\.?|INR)(?![A-Za-z])",
    re.IGNORECASE,
)

#: A Cr/Dr suffix carries ledger direction, not sign.
_LEDGER_SUFFIX: Final[re.Pattern[str]] = re.compile(r"(?:^|\s)(?:CR|DR)\.?$", re.IGNORECASE)

#: What a cleaned numeric literal is allowed to look like.
_NUMERIC: Final[re.Pattern[str]] = re.compile(r"^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$")

Coercible = str | int | float | Decimal | None


class MoneyCoercionError(ValueError):
    """A cell could not be read as a money value.

    Carries the original text so the quarantine record can show the officer the
    exact cell that failed.
    """

    def __init__(self, original: object, reason: str) -> None:
        self.original = original
        self.reason = reason
        super().__init__(f"cannot read {original!r} as money: {reason}")


# ---------------------------------------------------------------------------
# coercion
# ---------------------------------------------------------------------------


def D(value: Coercible) -> Decimal:  # noqa: N802 - `D` is the documented spelling
    """Coerce a spreadsheet cell to a 2-decimal-place ``Decimal``.

    Accepts ``None``, blank and NIL tokens as zero; strips the rupee sign,
    thousands separators and non-breaking space; reads accountancy parentheses
    and a trailing minus as negative; and converts a float through ``str`` so
    that ``D(0.1) + D(0.2) == D("0.3")`` exactly.

    Raises:
        MoneyCoercionError: the cell is not a money value.  It is never assumed
            to be zero -- see Law 5.
    """
    if value is None:
        return _ZERO

    # bool is an int subclass; a checkbox is not an amount.
    if isinstance(value, bool):
        raise MoneyCoercionError(value, "boolean is not a money value")

    if isinstance(value, Decimal):
        return _quantise(value, value)

    if isinstance(value, int):
        return _quantise(Decimal(value), value)

    if isinstance(value, float):
        # str() gives the shortest repr that round-trips, i.e. the decimal
        # number the spreadsheet displayed rather than its binary expansion.
        # NaN and Infinity survive that conversion as non-finite Decimals and
        # are refused by _quantise, so they need no separate check here.
        return _quantise(Decimal(str(value)), value)

    if not isinstance(value, str):
        raise MoneyCoercionError(value, f"unsupported type {type(value).__name__}")

    return _from_str(value)


def _from_str(raw: str) -> Decimal:
    text = raw.strip()
    if text.upper() in _NIL_TOKENS:
        return _ZERO

    # Cr/Dr means "credit"/"debit" against a ledger, and which sign that implies
    # depends on the ledger the column belongs to.  Guessing would silently
    # invert a balance, so refuse and let the row quarantine with a reason.
    if _LEDGER_SUFFIX.search(text):
        raise MoneyCoercionError(raw, "Cr/Dr suffix is ledger direction, not a sign")

    negative = False

    # Accountancy parentheses: (1,000) and -(1,000) are both negative.
    if text.startswith("-(") and text.endswith(")"):
        negative, text = True, text[2:-1]
    elif text.startswith("(") and text.endswith(")"):
        negative, text = True, text[1:-1]

    cleaned = _ORNAMENT.sub("", text)

    # Trailing minus, as emitted by some Tally and mainframe exports.
    if cleaned.endswith("-"):
        negative = not negative
        cleaned = cleaned[:-1]
    if cleaned.startswith("-"):
        negative = not negative
        cleaned = cleaned[1:]
    elif cleaned.startswith("+"):
        cleaned = cleaned[1:]

    if cleaned.upper() in _NIL_TOKENS:
        return _ZERO

    if not _NUMERIC.match(cleaned):
        raise MoneyCoercionError(raw, "not a numeric literal after cleaning")

    try:
        parsed = Decimal(cleaned)
    except (InvalidOperation, DecimalException) as exc:  # pragma: no cover - guarded above
        raise MoneyCoercionError(raw, "not a decimal literal") from exc

    if not parsed.is_finite():
        raise MoneyCoercionError(raw, "not a finite number")

    return _quantise(-parsed if negative else parsed, raw)


def _quantise(value: Decimal, original: object) -> Decimal:
    if not value.is_finite():
        raise MoneyCoercionError(original, "not a finite number")
    try:
        quantised = value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    except InvalidOperation as exc:
        raise MoneyCoercionError(original, "magnitude exceeds money precision") from exc
    # Decimal keeps a negative zero; a demand of -0.00 reads as a bug on screen.
    return _ZERO if quantised == 0 else quantised


def to_decimal(value: Coercible) -> Decimal:
    """Convert a cell to an **exact** Decimal, without quantising to paise.

    Used by ingestion for values that are not money -- a tax rate, a quantity,
    an HSN code read as a number, an Excel date serial.  Quantising those to two
    places would silently change an 18.5% rate or a six-digit HSN.

    This lives here, beside D(), because it is the only place allowed to know
    that ``float`` exists: the G1 lint forbids the name anywhere under
    app/ingestion or app/engine, so those layers call this instead.
    """
    if value is None:
        return _ZERO
    if isinstance(value, bool):
        raise MoneyCoercionError(value, "boolean is not a number")
    if isinstance(value, Decimal):
        converted = value
    elif isinstance(value, int):
        converted = Decimal(value)
    elif isinstance(value, float):
        converted = Decimal(str(value))
    elif isinstance(value, str):
        cleaned = _ORNAMENT.sub("", value.strip())
        negative = cleaned.startswith("-")
        if negative or cleaned.startswith("+"):
            cleaned = cleaned[1:]
        if not _NUMERIC.match(cleaned):
            raise MoneyCoercionError(value, "not a numeric literal")
        converted = -Decimal(cleaned) if negative else Decimal(cleaned)
    else:
        raise MoneyCoercionError(value, f"unsupported type {type(value).__name__}")
    if not converted.is_finite():
        raise MoneyCoercionError(value, "not a finite number")
    return converted


def is_number(value: object) -> bool:
    """True when a cell holds a number rather than text.

    Ingestion uses this for header detection and type-consistency scoring; it
    exists here so that no module under the G1-guarded trees names ``float``.
    """
    return isinstance(value, (int, Decimal, float)) and not isinstance(value, bool)


def dsum(values: Iterable[Coercible]) -> Decimal:
    """Sum an iterable of money cells.  An empty sum is ``0.00``, not ``int`` 0."""
    total = _ZERO
    for value in values:
        total += D(value)
    return _quantise(total, values)


def rupee(value: Coercible) -> Decimal:
    """Round to the nearest rupee, per s.170 CGST Act.

    Use this **only** where the statute requires it -- the tax, interest and
    penalty figures that appear on a notice.  Intermediate arithmetic stays at
    paise precision, because rounding twice is how a demand ends up off by a
    rupee, and a demand off by a rupee is a demand counsel attacks.
    """
    amount = D(value)
    return _quantise(amount.quantize(RUPEE_QUANT, rounding=ROUND_HALF_UP), value)


def inr(value: Coercible, *, symbol: bool = True, paise: bool = True) -> str:
    """Format for display in the Indian numbering system: ``12,34,567.89``."""
    amount = D(value)
    negative = amount < 0
    digits = format(-amount if negative else amount, "f")
    whole, _, frac = digits.partition(".")

    if len(whole) > _GROUP_TAIL:
        head, tail = whole[:-_GROUP_TAIL], whole[-_GROUP_TAIL:]
        groups: list[str] = []
        while len(head) > _GROUP_HEAD:
            head, group = head[:-_GROUP_HEAD], head[-_GROUP_HEAD:]
            groups.insert(0, group)
        if head:
            groups.insert(0, head)
        whole = ",".join([*groups, tail])

    out = f"{whole}.{frac}" if paise else whole
    if symbol:
        out = f"₹ {out}"
    return f"-{out}" if negative else out


# ---------------------------------------------------------------------------
# TaxVector
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class TaxVector:
    """Four tax heads carried together, never collapsed by accident.

    A GSTIN short by ``1,00,000`` of IGST while ``1,00,000`` in excess of CGST
    has two findings, not zero.  ``total`` is ``0`` there and ``abs_total`` is
    ``2,00,000``; ``is_zero()`` is ``False``.  That asymmetry is Law 3 made
    executable, and ``tests/unit/test_money.py`` pins it.
    """

    igst: Decimal = _ZERO
    cgst: Decimal = _ZERO
    sgst: Decimal = _ZERO
    cess: Decimal = _ZERO

    def __init__(
        self,
        igst: Coercible = None,
        cgst: Coercible = None,
        sgst: Coercible = None,
        cess: Coercible = None,
    ) -> None:
        object.__setattr__(self, "igst", D(igst))
        object.__setattr__(self, "cgst", D(cgst))
        object.__setattr__(self, "sgst", D(sgst))
        object.__setattr__(self, "cess", D(cess))

    # -- construction -------------------------------------------------------

    @classmethod
    def zero(cls) -> TaxVector:
        return cls()

    @classmethod
    def from_mapping(cls, mapping: dict[str, Coercible]) -> TaxVector:
        unknown = set(mapping) - set(HEADS)
        if unknown:
            raise ValueError(f"unknown tax head(s): {sorted(unknown)}")
        return cls(
            igst=mapping.get("igst"),
            cgst=mapping.get("cgst"),
            sgst=mapping.get("sgst"),
            cess=mapping.get("cess"),
        )

    # -- arithmetic ---------------------------------------------------------

    def __add__(self, other: TaxVector) -> TaxVector:
        if not isinstance(other, TaxVector):
            return NotImplemented
        return replace(
            self,
            igst=self.igst + other.igst,
            cgst=self.cgst + other.cgst,
            sgst=self.sgst + other.sgst,
            cess=self.cess + other.cess,
        )

    def __sub__(self, other: TaxVector) -> TaxVector:
        if not isinstance(other, TaxVector):
            return NotImplemented
        return replace(
            self,
            igst=self.igst - other.igst,
            cgst=self.cgst - other.cgst,
            sgst=self.sgst - other.sgst,
            cess=self.cess - other.cess,
        )

    def __neg__(self) -> TaxVector:
        return replace(self, igst=-self.igst, cgst=-self.cgst, sgst=-self.sgst, cess=-self.cess)

    def scale(self, factor: Decimal | int | str) -> TaxVector:
        """Multiply every head by a ratio -- used by interest and reversal maths."""
        multiplier = factor if isinstance(factor, Decimal) else Decimal(str(factor))
        return replace(
            self,
            igst=_quantise(self.igst * multiplier, self.igst),
            cgst=_quantise(self.cgst * multiplier, self.cgst),
            sgst=_quantise(self.sgst * multiplier, self.sgst),
            cess=_quantise(self.cess * multiplier, self.cess),
        )

    # -- named collapses ----------------------------------------------------

    @property
    def total(self) -> Decimal:
        """Signed sum across heads.  Only ever for a threshold test that says so."""
        return _quantise(self.igst + self.cgst + self.sgst + self.cess, self)

    @property
    def abs_total(self) -> Decimal:
        """Sum of absolute head values -- the honest size of a head-wise breach."""
        return _quantise(abs(self.igst) + abs(self.cgst) + abs(self.sgst) + abs(self.cess), self)

    # -- predicates and parts ----------------------------------------------

    def positive_part(self) -> TaxVector:
        """Per head, the shortfall only: a negative head becomes zero."""
        return replace(
            self,
            igst=max(self.igst, _ZERO),
            cgst=max(self.cgst, _ZERO),
            sgst=max(self.sgst, _ZERO),
            cess=max(self.cess, _ZERO),
        )

    def negative_part(self) -> TaxVector:
        """Per head, the excess only, returned positive."""
        return (-self).positive_part()

    def is_zero(self, tol: Coercible = None) -> bool:
        """True only when **every** head is within ``tol`` of zero."""
        tolerance = D(tol)
        return all(abs(getattr(self, head)) <= tolerance for head in HEADS)

    def any_nonzero(self) -> bool:
        return not self.is_zero()

    def heads(self) -> tuple[tuple[str, Decimal], ...]:
        return tuple((head, getattr(self, head)) for head in HEADS)

    def nonzero_heads(self) -> tuple[tuple[str, Decimal], ...]:
        return tuple((head, amt) for head, amt in self.heads() if amt != 0)

    # -- serialisation ------------------------------------------------------

    def dict(self) -> dict[str, str]:
        """Wire form.  Every head is a **string**; money never crosses as a JSON number."""
        return {head: format(getattr(self, head), "f") for head in HEADS}

    def __str__(self) -> str:
        parts = [f"{head.upper()} {inr(amt, symbol=False)}" for head, amt in self.nonzero_heads()]
        return " · ".join(parts) if parts else "nil"
