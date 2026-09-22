"""Canonical vocabulary: enums, tax periods, GSTIN validation, statutory dates.

Everything here is a pure function of its arguments.  Nothing in this module
reads a clock, a database or the network -- ``as_of`` is always injected by the
caller, because a rule that asks the operating system what day it is cannot be
replayed (Law 1).

Where the spec pack does not state a threshold or a due date, this module does
**not** invent one.  It registers the gap in :data:`UNCONFIGURED` and raises
:class:`UnconfiguredStatutoryParameterError` at the point of use, so the admin screen
can list exactly what is awaiting the law officer's signature.  A wrong due date
applied silently is worse than a missing feature.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, timedelta
from enum import StrEnum
from typing import Final

__all__ = [
    "GSTIN_RE",
    "STATE_CODES",
    "UNCONFIGURED",
    "ActionForm",
    "BandingStrategy",
    "Confidence",
    "DocType",
    "FinancialYear",
    "FindingStatus",
    "GstinError",
    "LedgerName",
    "Period",
    "Regime",
    "ReturnType",
    "RiskBand",
    "RiskDimension",
    "RowDisposition",
    "Severity",
    "SupplySection",
    "UnconfiguredStatutoryParameterError",
    "days_late",
    "due_date",
    "is_intrastate",
    "state_name",
    "three_year_bar",
    "validate_gstin",
]


# ---------------------------------------------------------------------------
# statutory gaps
# ---------------------------------------------------------------------------


class UnconfiguredStatutoryParameterError(LookupError):
    """A statutory value the spec pack does not state, so the platform refuses to guess."""

    def __init__(self, parameter_id: str, missing: str, todo_ref: str) -> None:
        self.parameter_id = parameter_id
        self.missing = missing
        self.todo_ref = todo_ref
        super().__init__(f"{parameter_id}: {missing} (TODO(statute): {todo_ref})")


@dataclass(frozen=True, slots=True)
class UnconfiguredEntry:
    """One row on the admin screen's 'awaiting statutory confirmation' list."""

    parameter_id: str
    missing: str
    todo_ref: str


#: Everything the platform knows it does not know.  The admin screen renders
#: this list; nothing here may be defaulted into a computation.
UNCONFIGURED: Final[tuple[UnconfiguredEntry, ...]] = (
    UnconfiguredEntry(
        "due_date.GSTR1.qrmp",
        "quarterly GSTR-1/IFF due date under QRMP",
        "docs/01 A2 states the monthly 11th only",
    ),
    UnconfiguredEntry(
        "due_date.GSTR4", "annual composition return due date", "not stated in docs/01"
    ),
    UnconfiguredEntry("due_date.GSTR5", "non-resident return due date", "not stated in docs/01"),
    UnconfiguredEntry("due_date.GSTR6", "ISD return due date", "not stated in docs/01"),
    UnconfiguredEntry("due_date.GSTR7", "TDS return due date", "not stated in docs/01"),
    UnconfiguredEntry("due_date.GSTR8", "TCS return due date", "not stated in docs/01"),
    UnconfiguredEntry("due_date.CMP08", "composition statement due date", "not stated in docs/01"),
    UnconfiguredEntry("due_date.ITC04", "job-work statement due date", "not stated in docs/01"),
    UnconfiguredEntry(
        "qrmp.state_category",
        "the 22nd/24th State categorisation for QRMP GSTR-3B",
        "docs/04 gate fixes Maharashtra at the 22nd; the full table needs sign-off",
    ),
)


# ---------------------------------------------------------------------------
# enums
# ---------------------------------------------------------------------------


class ReturnType(StrEnum):
    GSTR1 = "GSTR1"
    GSTR1A = "GSTR1A"
    GSTR2B = "GSTR2B"
    GSTR3B = "GSTR3B"
    GSTR4 = "GSTR4"
    GSTR5 = "GSTR5"
    GSTR6 = "GSTR6"
    GSTR7 = "GSTR7"
    GSTR8 = "GSTR8"
    GSTR9 = "GSTR9"
    GSTR9C = "GSTR9C"
    CMP08 = "CMP08"
    ITC04 = "ITC04"


class SupplySection(StrEnum):
    """GSTR-1 and GSTR-2B table sections, as the portal names them."""

    B2B = "B2B"
    B2CL = "B2CL"
    B2CS = "B2CS"
    EXPWP = "EXPWP"
    EXPWOP = "EXPWOP"
    SEZWP = "SEZWP"
    SEZWOP = "SEZWOP"
    DEEMED = "DEEMED"
    CDNR = "CDNR"
    CDNUR = "CDNUR"
    ECOM_9_5 = "ECOM_9_5"
    NIL_EXEMPT = "NIL_EXEMPT"
    AT = "AT"
    IMPG = "IMPG"
    IMPS = "IMPS"
    ISD = "ISD"
    AMENDMENT = "AMENDMENT"


class DocType(StrEnum):
    INVOICE = "INVOICE"
    CREDIT_NOTE = "CREDIT_NOTE"
    DEBIT_NOTE = "DEBIT_NOTE"
    BILL_OF_SUPPLY = "BILL_OF_SUPPLY"
    BILL_OF_ENTRY = "BILL_OF_ENTRY"
    ISD_INVOICE = "ISD_INVOICE"
    REFUND_VOUCHER = "REFUND_VOUCHER"
    PAYMENT_VOUCHER = "PAYMENT_VOUCHER"


class Severity(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskDimension(StrEnum):
    LIABILITY = "LIABILITY"
    CREDIT = "CREDIT"
    MOVEMENT = "MOVEMENT"
    PAYMENT = "PAYMENT"
    BEHAVIOUR = "BEHAVIOUR"
    NETWORK = "NETWORK"


class ActionForm(StrEnum):
    """Statutory forms a finding may propose.  ADVISORY means 'worklist, no form'."""

    ASMT_10 = "ASMT-10"
    ASMT_11 = "ASMT-11"
    ASMT_12 = "ASMT-12"
    ASMT_13 = "ASMT-13"
    ADT_01 = "ADT-01"
    ADT_02 = "ADT-02"
    DRC_01 = "DRC-01"
    DRC_01A = "DRC-01A"
    DRC_01B = "DRC-01B"
    DRC_01C = "DRC-01C"
    DRC_03 = "DRC-03"
    DRC_06 = "DRC-06"
    DRC_07 = "DRC-07"
    REG_17 = "REG-17"
    RFD_08 = "RFD-08"
    ADVISORY = "ADVISORY"


class Confidence(StrEnum):
    """Drives workflow.  ADVISORY may never reach a notice without human promotion."""

    CERTAIN = "CERTAIN"
    STRONG = "STRONG"
    ADVISORY = "ADVISORY"


class FindingStatus(StrEnum):
    TRIGGERED = "TRIGGERED"
    CLEAR = "CLEAR"
    NOT_EVALUATED = "NOT_EVALUATED"
    SUPPRESSED = "SUPPRESSED"


class BandingStrategy(StrEnum):
    RATIO_PEER = "RATIO_PEER"
    RATIO_ABS = "RATIO_ABS"
    DELTA_YOY = "DELTA_YOY"
    COUNT = "COUNT"
    BINARY = "BINARY"
    EXTERNAL = "EXTERNAL"


class RiskBand(StrEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    SEVERE = "SEVERE"


class Regime(StrEnum):
    """GSTR-3B Table 3 became non-editable from the July 2025 period."""

    PRE_HARD_LOCK = "PRE_HARD_LOCK"
    POST_HARD_LOCK = "POST_HARD_LOCK"


class RowDisposition(StrEnum):
    """Law 5: every uploaded row lands in exactly one of these."""

    PARSED = "PARSED"
    QUARANTINED = "QUARANTINED"
    DUPLICATE = "DUPLICATE"


class LedgerName(StrEnum):
    CREDIT = "CREDIT"
    CASH = "CASH"
    LIABILITY = "LIABILITY"


# ---------------------------------------------------------------------------
# State codes
# ---------------------------------------------------------------------------

STATE_CODES: Final[dict[str, str]] = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman and Diu (pre-merger)",
    "26": "Dadra and Nagar Haveli and Daman and Diu",
    "27": "Maharashtra",
    "28": "Andhra Pradesh (pre-bifurcation)",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
    "97": "Other Territory",
    "99": "Centre Jurisdiction",
}

#: States and UTs whose QRMP GSTR-3B falls on the 22nd.  Everything else is the
#: 24th.  Maharashtra ("27") is fixed here by the docs/04 acceptance gate; the
#: remainder of the table is listed in UNCONFIGURED pending sign-off.
_QRMP_22ND: Final[frozenset[str]] = frozenset(
    {"22", "23", "24", "26", "27", "29", "30", "31", "32", "33", "34", "35", "36", "37", "97"}
)


def state_name(code: str) -> str:
    """Resolve a two-digit State code.  Raises on an unknown code -- never 'Unknown'."""
    try:
        return STATE_CODES[code]
    except KeyError as exc:
        raise ValueError(f"unknown State code {code!r}") from exc


def is_intrastate(supplier_state: str, place_of_supply: str) -> bool:
    """CGST+SGST applies when the supplier's State is the place of supply.

    Both arguments are two-digit State codes.  This is the test OUT-11 uses to
    detect a supply charged under the wrong head, which is a diversion of
    revenue between the Centre and the State rather than a rounding quibble.
    """
    state_name(supplier_state)
    state_name(place_of_supply)
    return supplier_state == place_of_supply


# ---------------------------------------------------------------------------
# GSTIN
# ---------------------------------------------------------------------------

#: What position 14 may be, and what each one means.
#:
#: It is NOT always ``Z``. ``Z`` is the ordinary taxpayer; ``D`` is a section
#: 51 deductor and ``C`` is a section 52 collector. A validator hard-coded to
#: ``Z`` rejects every government department in India -- on the real SSR Marine
#: workbook it flagged two BSF units as structurally invalid, and those two are
#: not suppliers at all: they deducted TDS on Rs 8.00 crore of payments TO the
#: taxpayer, which is the third-party corroboration of declared turnover that
#: G-14 and X-10 are built on. docs/07 Part C3.
REGISTRATION_CLASS: Final[dict[str, str]] = {
    "Z": "ordinary taxpayer",
    "D": "s.51 deductor",
    "C": "s.52 collector",
}

#: SS PPPPPPPPPP E [ZDC] C -- State code, PAN, entity code, class, checksum.
GSTIN_RE: Final[re.Pattern[str]] = re.compile(
    r"^(?P<state>[0-9]{2})"
    r"(?P<pan>[A-Z]{5}[0-9]{4}[A-Z])"
    r"(?P<entity>[1-9A-Z])"
    r"(?P<klass>[ZDC])"
    r"(?P<check>[0-9A-Z])$"
)

_CHECKSUM_ALPHABET: Final[str] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

#: A GSTIN is SS + PAN(10) + entity + [ZDC] + checksum.
GSTIN_LENGTH: Final[int] = 15
#: The checksum is computed over everything before it.
GSTIN_BODY_LENGTH: Final[int] = GSTIN_LENGTH - 1
#: Luhn mod 36: ten digits plus twenty-six letters.
CHECKSUM_MODULUS: Final[int] = 36


class GstinError(ValueError):
    """A GSTIN failed structure or checksum, with the reason an officer can read."""

    def __init__(self, gstin: str, reason: str) -> None:
        self.gstin = gstin
        self.reason = reason
        super().__init__(f"invalid GSTIN {gstin!r}: {reason}")


def gstin_checksum(first_fourteen: str) -> str:
    """The 15th character, by Luhn mod 36 over the first fourteen."""
    if len(first_fourteen) != GSTIN_BODY_LENGTH:
        raise ValueError(f"checksum is computed over exactly {GSTIN_BODY_LENGTH} characters")
    total = 0
    for index, char in enumerate(first_fourteen):
        position = _CHECKSUM_ALPHABET.find(char)
        if position < 0:
            raise GstinError(first_fourteen, f"character {char!r} is not alphanumeric")
        factor = 1 if index % 2 == 0 else 2
        product = position * factor
        total += product // CHECKSUM_MODULUS + product % CHECKSUM_MODULUS
    remainder = total % CHECKSUM_MODULUS
    return _CHECKSUM_ALPHABET[(CHECKSUM_MODULUS - remainder) % CHECKSUM_MODULUS]


def validate_gstin(candidate: str, *, normalise: bool = True) -> str:
    """Validate structure **and** checksum, returning the normalised GSTIN.

    A structurally valid GSTIN that fails its checksum is the classic fabricated
    supplier signature, so the two tests are reported separately.
    """
    if not isinstance(candidate, str):
        # Deliberately GstinError and not TypeError: ingestion has one handler
        # for "this cell is not a GSTIN", and the officer sees one reason format.
        raise GstinError(str(candidate), "not a string")
    value = candidate.strip().upper().replace(" ", "") if normalise else candidate

    if len(value) != GSTIN_LENGTH:
        raise GstinError(candidate, f"length {len(value)}, expected {GSTIN_LENGTH}")

    match = GSTIN_RE.match(value)
    if match is None:
        if value[13] not in REGISTRATION_CLASS:
            raise GstinError(
                candidate,
                f"14th character is {value[13]!r}; expected "
                f"'Z' (ordinary taxpayer), 'D' (s.51 deductor) or "
                f"'C' (s.52 collector)",
            )
        raise GstinError(candidate, "does not match the SS-PAN-E-[ZDC]-C structure")

    state = match.group("state")
    if state not in STATE_CODES:
        raise GstinError(candidate, f"unknown State code {state!r}")

    expected = gstin_checksum(value[:14])
    if value[14] != expected:
        raise GstinError(candidate, f"checksum {value[14]!r}, expected {expected!r}")

    return value


def is_valid_gstin(candidate: str) -> bool:
    try:
        validate_gstin(candidate)
    except (GstinError, ValueError):
        return False
    return True


def pan_of(gstin: str) -> str:
    """The PAN embedded in a GSTIN -- the join key for 'other GSTINs on this PAN' (P24)."""
    return validate_gstin(gstin)[2:12]


# ---------------------------------------------------------------------------
# Period and FinancialYear
# ---------------------------------------------------------------------------

#: The Indian financial year runs April to March.
FY_START_MONTH: Final[int] = 4
MONTHS_IN_YEAR: Final[int] = 12
#: GST commenced on 1 July 2017; anything earlier is a parse error.
GST_ERA_FIRST_YEAR: Final[int] = 2017
_LAST_SUPPORTED_YEAR: Final[int] = 2099

_MONTH_NAMES: Final[dict[str, int]] = {
    name: number
    for number, names in enumerate(
        [
            ("JAN", "JANUARY"),
            ("FEB", "FEBRUARY"),
            ("MAR", "MARCH"),
            ("APR", "APRIL"),
            ("MAY",),
            ("JUN", "JUNE"),
            ("JUL", "JULY"),
            ("AUG", "AUGUST"),
            ("SEP", "SEPT", "SEPTEMBER"),
            ("OCT", "OCTOBER"),
            ("NOV", "NOVEMBER"),
            ("DEC", "DECEMBER"),
        ],
        start=1,
    )
    for name in names
}

_MONTH_ABBR: Final[tuple[str, ...]] = (
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
)  # fmt: skip


@dataclass(frozen=True, order=True, slots=True)
class Period:
    """A monthly tax period.  The canonical wire form is ``MMYYYY``."""

    year: int
    month: int

    def __post_init__(self) -> None:
        if not 1 <= self.month <= MONTHS_IN_YEAR:
            raise ValueError(f"month {self.month} out of range")
        if not GST_ERA_FIRST_YEAR <= self.year <= _LAST_SUPPORTED_YEAR:
            raise ValueError(f"year {self.year} outside the GST era")

    # -- parsing ------------------------------------------------------------

    @classmethod
    def parse(cls, raw: str | Period) -> Period:
        """Read MMYYYY, MM-YYYY, MM/YYYY, YYYY-MM, Jun-2025, June 2025 or an ISO date."""
        if isinstance(raw, Period):
            return raw
        text = str(raw).strip().upper().replace("_", "-")
        if not text:
            raise ValueError("empty period")

        if re.fullmatch(r"\d{6}", text):  # MMYYYY
            return cls(int(text[2:]), int(text[:2]))

        iso = re.fullmatch(r"(\d{4})-(\d{2})(?:-\d{2})?", text)  # YYYY-MM or ISO date
        if iso:
            return cls(int(iso.group(1)), int(iso.group(2)))

        numeric = re.fullmatch(r"(\d{1,2})[-/](\d{4})", text)  # MM-YYYY
        if numeric:
            return cls(int(numeric.group(2)), int(numeric.group(1)))

        # The separator is optional: a sheet named "Jun2025" is as common as
        # a cell reading "Jun-2025".
        named = re.fullmatch(r"([A-Z]{3,9})[-/ ,]*(\d{4})", text)  # Jun-2025, Jun2025
        if named and named.group(1) in _MONTH_NAMES:
            return cls(int(named.group(2)), _MONTH_NAMES[named.group(1)])

        named_rev = re.fullmatch(r"(\d{4})[-/ ]+([A-Z]{3,9})", text)  # 2025-Jun
        if named_rev and named_rev.group(2) in _MONTH_NAMES:
            return cls(int(named_rev.group(1)), _MONTH_NAMES[named_rev.group(2)])

        raise ValueError(f"unrecognised period {raw!r}")

    @classmethod
    def in_financial_year(cls, raw: str, fy: FinancialYear) -> Period | None:
        """A bare month name, resolved against a stated financial year.

        A compliance tool exporting a whole year puts every month in one sheet
        and writes the period as "June" -- the year is stated once, in the
        title block. ``parse`` refuses that and is right to: June of which
        year? This answers the question from evidence rather than assuming it,
        and returns ``None`` rather than raising, because the caller is asking
        "is this cell a month?" and "Total" is a perfectly ordinary answer.

        April to December fall in the financial year's first calendar year;
        January to March in its second.
        """
        text = str(raw).strip().upper()
        month = _MONTH_NAMES.get(text)
        if month is None:
            return None
        year = fy.start_year if month >= FY_START_MONTH else fy.start_year + 1
        return cls(year, month)

    @classmethod
    def of(cls, day: date) -> Period:
        return cls(day.year, day.month)

    # -- identity -----------------------------------------------------------

    @property
    def mmyyyy(self) -> str:
        return f"{self.month:02d}{self.year}"

    @property
    def label(self) -> str:
        return f"{_MONTH_ABBR[self.month - 1]} {self.year}"

    def __str__(self) -> str:
        return self.mmyyyy

    # -- financial year -----------------------------------------------------

    @property
    def fy(self) -> str:
        """The Indian financial year label, April to March: ``2025-26``."""
        start = self.year if self.month >= FY_START_MONTH else self.year - 1
        return f"{start}-{(start + 1) % 100:02d}"

    @property
    def financial_year(self) -> FinancialYear:
        start = self.year if self.month >= FY_START_MONTH else self.year - 1
        return FinancialYear(start)

    @property
    def quarter(self) -> int:
        """Financial quarter: Apr-Jun is 1, Jan-Mar is 4."""
        return (self.month - 4) % 12 // 3 + 1

    @property
    def quarter_label(self) -> str:
        return f"Q{self.quarter} {self.fy}"

    @property
    def is_quarter_end(self) -> bool:
        return self.month in (6, 9, 12, 3)

    # -- arithmetic ---------------------------------------------------------

    def plus(self, months: int) -> Period:
        index = self.year * 12 + (self.month - 1) + months
        return Period(index // 12, index % 12 + 1)

    @property
    def next(self) -> Period:
        return self.plus(1)

    @property
    def prev(self) -> Period:
        return self.plus(-1)

    def months_since(self, other: Period) -> int:
        """Signed month count from ``other`` to ``self``."""
        return (self.year * 12 + self.month) - (other.year * 12 + other.month)

    @property
    def first_day(self) -> date:
        return date(self.year, self.month, 1)

    @property
    def last_day(self) -> date:
        return self.next.first_day - _ONE_DAY

    @property
    def regime(self) -> Regime:
        """Table 3 of GSTR-3B is hard-locked from the July 2025 period onward."""
        return Regime.POST_HARD_LOCK if self >= _HARD_LOCK_FROM else Regime.PRE_HARD_LOCK


@dataclass(frozen=True, order=True, slots=True)
class FinancialYear:
    """An Indian financial year, identified by its starting calendar year."""

    start_year: int

    @classmethod
    def parse(cls, raw: str | FinancialYear) -> FinancialYear:
        if isinstance(raw, FinancialYear):
            return raw
        text = str(raw).strip()
        match = re.fullmatch(r"(\d{4})\s*[-/]\s*(\d{2}|\d{4})", text)
        if not match:
            raise ValueError(f"unrecognised financial year {raw!r}")
        return cls(int(match.group(1)))

    @property
    def label(self) -> str:
        return f"{self.start_year}-{(self.start_year + 1) % 100:02d}"

    def __str__(self) -> str:
        return self.label

    @property
    def start(self) -> date:
        return date(self.start_year, 4, 1)

    @property
    def end(self) -> date:
        return date(self.start_year + 1, 3, 31)

    @property
    def periods(self) -> tuple[Period, ...]:
        first = Period(self.start_year, 4)
        return tuple(first.plus(offset) for offset in range(12))

    @property
    def annual_return_due_date(self) -> date:
        """GSTR-9/9C: 31 December of the following financial year (docs/01 A2)."""
        return date(self.start_year + 1, 12, 31)


_ONE_DAY: Final[timedelta] = timedelta(days=1)
_HARD_LOCK_FROM: Final[Period] = Period(2025, 7)


# ---------------------------------------------------------------------------
# Statutory dates
# ---------------------------------------------------------------------------

#: Monthly filing due days that docs/01 A2 states outright.
_MONTHLY_DUE_DAY: Final[dict[ReturnType, int]] = {
    ReturnType.GSTR1: 11,
    ReturnType.GSTR1A: 13,
    ReturnType.GSTR3B: 20,
}


def due_date(
    return_type: ReturnType,
    period: Period | FinancialYear,
    *,
    qrmp: bool = False,
    state_code: str | None = None,
) -> date:
    """The statutory due date for a return and period.

    Only the dates docs/01 A2 states are implemented.  Anything else raises
    :class:`UnconfiguredStatutoryParameterError` naming the gap, rather than applying
    a plausible guess.
    """
    if return_type in (ReturnType.GSTR9, ReturnType.GSTR9C):
        year = period.financial_year if isinstance(period, Period) else period
        return year.annual_return_due_date

    if isinstance(period, FinancialYear):
        raise TypeError(f"{return_type} is a periodic return; pass a Period, not a FinancialYear")

    if return_type is ReturnType.GSTR2B:
        raise ValueError("GSTR-2B is generated, not filed; it has no due date")

    if qrmp:
        if return_type is ReturnType.GSTR3B:
            if not period.is_quarter_end:
                raise ValueError(
                    f"{period} is not a quarter end; a QRMP GSTR-3B is filed quarterly"
                )
            if state_code is None:
                raise ValueError("QRMP GSTR-3B due date depends on the State; pass state_code")
            day = 22 if state_code in _QRMP_22ND else 24
            return _day_in_next_month(period, day)
        raise UnconfiguredStatutoryParameterError(
            f"due_date.{return_type.value}.qrmp",
            f"QRMP due date for {return_type.value}",
            "docs/01 A2 states the monthly cycle only",
        )

    monthly_day = _MONTHLY_DUE_DAY.get(return_type)
    if monthly_day is None:
        raise UnconfiguredStatutoryParameterError(
            f"due_date.{return_type.value}",
            f"due date for {return_type.value}",
            "not stated in docs/01; awaiting the law officer",
        )
    return _day_in_next_month(period, monthly_day)


def _day_in_next_month(period: Period, day: int) -> date:
    following = period.next
    return date(following.year, following.month, day)


def days_late(due: date, filed: date | None, *, as_of: date) -> int:
    """Days between the due date and filing.  Unfiled counts up to ``as_of``.

    ``as_of`` is injected, never read from the clock, so a run replays.
    """
    reference = filed if filed is not None else as_of
    return max(0, (reference - due).days)


def three_year_bar(due: date) -> date:
    """s.37(5)/39(11)/44(2)/52(15): a return cannot be filed 3 years after its due date."""
    try:
        return due.replace(year=due.year + 3)
    except ValueError:
        # 29 February: the bar lands on 28 February of the non-leap year.
        return due.replace(year=due.year + 3, day=28)
