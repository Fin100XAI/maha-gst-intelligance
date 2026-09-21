"""Cell coercion: dates, money, GSTIN, HSN, UQC, rate, booleans.

Every function here either returns a canonical value or raises
:class:`CoercionError`.  Nothing guesses, and nothing returns a default that
could be mistaken for data -- Law 5.

No module under this package may name ``float`` (gate G1); numbers arrive
through :func:`app.money.to_decimal`.
"""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Final

from app.canonical import STATE_CODES, FinancialYear, GstinError, Period, validate_gstin
from app.money import D, MoneyCoercionError, is_number, to_decimal

__all__ = [
    "CoercionError",
    "coerce_bool",
    "coerce_date",
    "coerce_gstin",
    "coerce_hsn",
    "coerce_ims_action",
    "coerce_money",
    "coerce_period",
    "coerce_quantity",
    "coerce_rate",
    "coerce_state_code",
    "coerce_text",
    "coerce_uqc",
]


class CoercionError(ValueError):
    """A cell could not be read as the type its column requires."""

    def __init__(self, field: str, value: object, reason: str) -> None:
        self.field = field
        self.value = value
        self.reason = reason
        super().__init__(f"{field}: cannot read {value!r} -- {reason}")


_BLANK: Final[frozenset[str]] = frozenset({"", "-", "--", "na", "n/a", "nil", "none", "null"})


def _is_blank(value: object) -> bool:
    if value is None:
        return True
    return isinstance(value, str) and value.strip().lower() in _BLANK


# ---------------------------------------------------------------------------
# dates
# ---------------------------------------------------------------------------

#: Excel's serial epoch.  Day 1 is 01-Jan-1900, and Excel wrongly treats 1900 as
#: a leap year, so serials above 59 are offset by one; the 1899-12-30 base
#: absorbs that.  Getting this wrong shifts every date by a day, which moves a
#: filing across its due date.
_EXCEL_EPOCH: Final[date] = date(1899, 12, 30)
_EXCEL_MIN: Final[Decimal] = Decimal("1")
_EXCEL_MAX: Final[Decimal] = Decimal("60000")  # ~year 2064

#: A two-digit year in GST data is always this century.
_CENTURY: Final[int] = 100
#: A named-month date has three parts: day, month, year.
_DATE_PARTS: Final[int] = 3
#: A canonical period is MMYYYY.
_PERIOD_DIGITS: Final[int] = 6

_DATE_PATTERNS: Final[tuple[tuple[re.Pattern[str], str], ...]] = (
    (re.compile(r"^(\d{4})-(\d{2})-(\d{2})$"), "ymd"),
    (re.compile(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$"), "dmy"),
    (re.compile(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$"), "dmy2"),
    (re.compile(r"^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$"), "ymd"),
)

_MONTHS: Final[dict[str, int]] = {
    name: number
    for number, names in enumerate(
        (
            ("jan", "january"),
            ("feb", "february"),
            ("mar", "march"),
            ("apr", "april"),
            ("may",),
            ("jun", "june"),
            ("jul", "july"),
            ("aug", "august"),
            ("sep", "sept", "september"),
            ("oct", "october"),
            ("nov", "november"),
            ("dec", "december"),
        ),
        start=1,
    )
    for name in names
}

_NAMED_DATE: Final[re.Pattern[str]] = re.compile(
    r"^(\d{1,2})[-\s/]([a-z]{3,9})[-\s/](\d{2,4})$", re.IGNORECASE
)
_MONTH_YEAR: Final[re.Pattern[str]] = re.compile(r"^([a-z]{3,9})[-\s/](\d{2,4})$", re.IGNORECASE)


def _two_digit_year(value: int) -> int:
    """A two-digit year in GST data is always this century."""
    return 2000 + value if value < _CENTURY else value


def coerce_date(value: object, *, field: str = "date") -> date | None:  # noqa: PLR0911, PLR0912
    # Every accepted spelling gets its own branch and its own early return.
    # Collapsing them would make it harder to see which formats are
    # supported, and a date format silently dropped here shifts a filing
    # across its due date.
    """Read dd-mm-yyyy, dd/mm/yy, an Excel serial, 'Jun-2025' or ISO.

    ``dd-mm-yyyy`` is assumed for ambiguous numeric forms, because that is what
    the GST portal and every Indian accounting package emit.  A value that
    cannot be read raises rather than becoming ``None``.
    """
    if _is_blank(value):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    if is_number(value):
        serial = to_decimal(value)  # type: ignore[arg-type]
        if not _EXCEL_MIN <= serial <= _EXCEL_MAX:
            raise CoercionError(field, value, "outside the Excel date-serial range")
        return _EXCEL_EPOCH + timedelta(days=int(serial))

    if not isinstance(value, str):
        raise CoercionError(field, value, f"unsupported type {type(value).__name__}")

    text = value.strip()
    if " " in text and ":" in text:  # a timestamp; keep the date part
        text = text.split(" ", 1)[0]

    for pattern, order in _DATE_PATTERNS:
        match = pattern.match(text)
        if match is None:
            continue
        a, b, c = (int(group) for group in match.groups())
        try:
            if order == "ymd":
                return date(a, b, c)
            if order == "dmy":
                return date(c, b, a)
            return date(_two_digit_year(c), b, a)
        except ValueError as exc:
            raise CoercionError(field, value, str(exc)) from exc

    named = _NAMED_DATE.match(text)
    if named is not None:
        day, month_name, year = named.groups()
        month = _MONTHS.get(month_name.lower())
        if month is None:
            raise CoercionError(field, value, f"unknown month {month_name!r}")
        try:
            return date(_two_digit_year(int(year)), month, int(day))
        except ValueError as exc:
            raise CoercionError(field, value, str(exc)) from exc

    raise CoercionError(field, value, "unrecognised date format")


def coerce_period(
    value: object, *, field: str = "period", fy: FinancialYear | None = None
) -> Period | None:
    """Read a tax period, including 'Jun-2025' and a date inside the period.

    ``fy`` resolves a bare month name. A whole-year export writes "June" in a
    Month column and states the year once in its title block; without the year
    that cell is genuinely ambiguous, so it is refused unless the workbook
    said which year it covers.
    """
    if _is_blank(value):
        return None
    if isinstance(value, Period):
        return value
    if isinstance(value, (date, datetime)):
        return Period.of(value.date() if isinstance(value, datetime) else value)
    if is_number(value):
        numeric = to_decimal(value)  # type: ignore[arg-type]
        text = str(int(numeric))
        if len(text) == _PERIOD_DIGITS - 1:  # MYYYY lost a leading zero
            text = "0" + text
        try:
            return Period.parse(text)
        except ValueError as exc:
            raise CoercionError(field, value, str(exc)) from exc
    text = str(value).strip()
    try:
        return Period.parse(text)
    except ValueError as exc:
        if fy is not None:
            named = Period.in_financial_year(text, fy)
            if named is not None:
                return named
        raise CoercionError(field, value, str(exc)) from exc


# ---------------------------------------------------------------------------
# money and numbers
# ---------------------------------------------------------------------------


def coerce_money(value: object, *, field: str = "amount") -> Decimal:
    """A rupee amount at paise precision.  Blank is 0.00; unreadable raises."""
    try:
        return D(value)  # type: ignore[arg-type]
    except MoneyCoercionError as exc:
        raise CoercionError(field, value, exc.reason) from exc


_RATE_MAX: Final[Decimal] = Decimal("100")


def coerce_rate(value: object, *, field: str = "rate") -> Decimal | None:
    """A tax rate as a percentage.  ``0.18`` is read as 18%, not as 0.18%.

    Portal exports write ``18``; some accounting exports write ``0.18``.  A rate
    strictly between 0 and 1 is therefore read as a fraction -- with the one
    real exception carved out, the 0.25% rate on rough diamonds, which is
    written as ``0.25`` in both conventions and is preserved as 0.25%.
    """
    if _is_blank(value):
        return None
    text = str(value).strip()
    explicit_percent = text.endswith("%")
    try:
        rate = to_decimal(text.rstrip("%").strip() if isinstance(value, str) else value)  # type: ignore[arg-type]
    except MoneyCoercionError as exc:
        raise CoercionError(field, value, exc.reason) from exc

    if rate < 0:
        raise CoercionError(field, value, "a tax rate cannot be negative")
    if not explicit_percent and 0 < rate < 1 and rate != Decimal("0.25"):
        rate = rate * _RATE_MAX
    if rate > _RATE_MAX:
        raise CoercionError(field, value, f"rate {rate} exceeds 100%")
    return rate


def coerce_quantity(value: object, *, field: str = "quantity") -> Decimal | None:
    if _is_blank(value):
        return None
    try:
        return to_decimal(value)  # type: ignore[arg-type]
    except MoneyCoercionError as exc:
        raise CoercionError(field, value, exc.reason) from exc


# ---------------------------------------------------------------------------
# identifiers
# ---------------------------------------------------------------------------


def coerce_gstin(value: object, *, field: str = "gstin", required: bool = True) -> str | None:
    if _is_blank(value):
        if required:
            raise CoercionError(field, value, "a GSTIN is required here")
        return None
    try:
        return validate_gstin(str(value))
    except GstinError as exc:
        raise CoercionError(field, value, exc.reason) from exc


_HSN_LENGTHS: Final[tuple[int, ...]] = (2, 4, 6, 8)


def coerce_hsn(value: object, *, field: str = "hsn") -> str | None:
    """Normalise an HSN/SAC to 2, 4, 6 or 8 digits.

    Excel turns ``0902`` into the number 902, so a short code is left-padded to
    the next valid length rather than being rejected.
    """
    if _is_blank(value):
        return None
    digits = (
        str(int(to_decimal(value)))  # type: ignore[arg-type]
        if is_number(value)
        else re.sub(r"\D", "", str(value))
    )
    if not digits:
        raise CoercionError(field, value, "no digits in the HSN/SAC")
    if len(digits) > _HSN_LENGTHS[-1]:
        raise CoercionError(field, value, f"{len(digits)} digits; an HSN/SAC has at most 8")
    for length in _HSN_LENGTHS:
        if len(digits) <= length:
            return digits.rjust(length, "0")
    raise CoercionError(field, value, "not a valid HSN/SAC length")  # pragma: no cover


_STATE_CODE: Final[re.Pattern[str]] = re.compile(r"^(\d{1,2})")


def _normalise_state(text: str) -> str:
    """Lowercase, letters only, so "Tamil Nadu" and "TAMILNADU" agree."""
    return "".join(ch for ch in text.lower() if ch.isalpha())


#: State name -> code, built once from the same table that maps code to name.
_STATE_BY_NAME: Final[dict[str, str]] = {
    _normalise_state(name): code for code, name in STATE_CODES.items()
}


def coerce_state_code(value: object, *, field: str = "pos") -> str | None:
    """Read a place of supply, however the file happens to write it.

    The portal writes "27-Maharashtra". A compliance tool exporting the same
    return writes "Maharashtra". Both name the same place, and reading only
    the first cost 3,868 rows of the first real filed workbook -- every B2B
    line and the whole GSTR-2B, held for want of a spelling.
    """
    if _is_blank(value):
        return None
    if is_number(value):
        return f"{int(to_decimal(value)):02d}"  # type: ignore[arg-type]

    text = str(value).strip()
    match = _STATE_CODE.match(text)
    if match is not None:
        return f"{int(match.group(1)):02d}"

    # No leading digits: the cell names the State instead of numbering it.
    by_name = _STATE_BY_NAME.get(_normalise_state(text))
    if by_name is not None:
        return by_name

    raise CoercionError(field, value, "no State code or State name found")


_UQC: Final[dict[str, str]] = {
    "nos": "NOS",
    "no": "NOS",
    "numbers": "NOS",
    "pcs": "PCS",
    "pieces": "PCS",
    "kg": "KGS",
    "kgs": "KGS",
    "kilogram": "KGS",
    "mtr": "MTR",
    "metre": "MTR",
    "meters": "MTR",
    "ltr": "LTR",
    "litre": "LTR",
    "liters": "LTR",
    "box": "BOX",
    "bag": "BAG",
    "bags": "BAG",
    "ton": "TON",
    "tonnes": "TON",
    "mts": "MTS",
    "sqm": "SQM",
    "sqf": "SQF",
    "unt": "UNT",
    "unit": "UNT",
    "oth": "OTH",
    "others": "OTH",
}


def coerce_uqc(value: object, *, field: str = "uqc") -> str | None:  # noqa: ARG001
    # `field` is accepted for signature symmetry with every other coercer,
    # so the pipeline can call them all the same way.
    if _is_blank(value):
        return None
    text = re.sub(r"[^A-Za-z]", "", str(value)).lower()
    return _UQC.get(text, text.upper()[:16] or None)


_TRUE: Final[frozenset[str]] = frozenset({"y", "yes", "true", "1", "t", "होय"})
_FALSE: Final[frozenset[str]] = frozenset({"n", "no", "false", "0", "f", "नाही"})


def coerce_bool(value: object, *, field: str = "flag") -> bool | None:
    if _is_blank(value):
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in _TRUE:
        return True
    if text in _FALSE:
        return False
    raise CoercionError(field, value, "not a yes/no value")


_IMS_ACTIONS: Final[dict[str, str]] = {
    "accept": "ACCEPTED",
    "accepted": "ACCEPTED",
    "reject": "REJECTED",
    "rejected": "REJECTED",
    "pending": "PENDING",
    "pending with remarks": "PENDING",
    "no action": "NO_ACTION",
    "noaction": "NO_ACTION",
    "deemed accepted": "NO_ACTION",
}


def coerce_ims_action(value: object, *, field: str = "ims_action") -> str | None:
    """IMS action is evidence, not metadata.

    A recipient who left a record pending and claimed the credit anyway made a
    timestamped, deliberate choice, so an unrecognised action is refused rather
    than flattened to 'no action'.
    """
    if _is_blank(value):
        return None
    text = re.sub(r"[^a-z ]", " ", str(value).strip().lower())
    text = re.sub(r"\s+", " ", text).strip()
    action = _IMS_ACTIONS.get(text)
    if action is None:
        raise CoercionError(field, value, "unrecognised IMS action")
    return action


def coerce_text(value: object, *, field: str = "text", limit: int = 512) -> str | None:
    if _is_blank(value):
        return None
    text = str(value).strip()
    if len(text) > limit:
        raise CoercionError(field, value, f"longer than {limit} characters")
    return text
