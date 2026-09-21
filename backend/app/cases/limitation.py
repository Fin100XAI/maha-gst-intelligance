"""The limitation clock.

Time-barred demands are the largest avoidable revenue leak in any commercial
taxes department, and a countdown on a screen fixes more of it than any model
will.  So every case carries a computed clock: days to SCN, days to order,
derived from the financial year, the section that applies and the annual-return
due date.

    FY 2017-18 to 2023-24, non-fraud   s.73    3 years from the annual-return
                                               due date; SCN 3 months before
    FY 2017-18 to 2023-24, fraud       s.74    5 years; SCN 6 months before
    FY 2024-25 onward, all cases       s.74A   42 months (non-fraud) or
                                               54 months (fraud); SCN at least
                                               12 months before the order

s.74A unified the regimes: fraud is characterised in adjudication, not at
notice stage, so from FY 2024-25 the section no longer depends on an allegation
made before the reply is in.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Final

from app.canonical import FinancialYear
from app.engine.params import ParameterSet

__all__ = [
    "LimitationClock",
    "LimitationStatus",
    "amnesty_applies",
    "compute_limitation",
    "section_for",
]


class LimitationStatus:
    OK = "OK"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    EXPIRED = "EXPIRED"


#: Buckets on the countdown, in days remaining before the order deadline.
CRITICAL_DAYS: Final[int] = 90
WARNING_DAYS: Final[int] = 180


@dataclass(frozen=True, slots=True)
class LimitationClock:
    """What an officer needs to see, and the working behind it."""

    fy: str
    section: str
    fraud_alleged: bool
    reference_date: date
    scn_deadline: date
    order_deadline: date
    days_to_scn: int
    days_to_order: int
    status: str
    voluntary_payment_days: int
    working: tuple[str, ...]

    @property
    def expired(self) -> bool:
        return self.status == LimitationStatus.EXPIRED

    def as_dict(self) -> dict[str, object]:
        return {
            "fy": self.fy,
            "section": self.section,
            "fraud_alleged": self.fraud_alleged,
            "reference_date": self.reference_date.isoformat(),
            "scn_deadline": self.scn_deadline.isoformat(),
            "order_deadline": self.order_deadline.isoformat(),
            "days_to_scn": self.days_to_scn,
            "days_to_order": self.days_to_order,
            "status": self.status,
            "voluntary_payment_days": self.voluntary_payment_days,
            "working": list(self.working),
        }


def _add_months(start: date, months: int) -> date:
    """Calendar-month arithmetic, clamped to the end of a short month."""
    index = start.year * 12 + (start.month - 1) + months
    year, month = divmod(index, 12)
    month += 1
    day = start.day
    while True:
        try:
            return date(year, month, day)
        except ValueError:
            day -= 1


def _add_years(start: date, years: int) -> date:
    try:
        return start.replace(year=start.year + years)
    except ValueError:  # 29 February
        return start.replace(year=start.year + years, day=28)


def section_for(fy: FinancialYear, *, fraud_alleged: bool, params: ParameterSet) -> str:
    """Which demand provision governs this year.

    s.74A applies to every case from FY 2024-25, fraud or not.
    """
    from_fy = int(params.get("LIMITATION", "s74a_from_fy", on=fy.end).decimal)
    if fy.start_year >= from_fy:
        return "74A"
    return "74" if fraud_alleged else "73"


def compute_limitation(
    fy: FinancialYear,
    *,
    as_of: date,
    params: ParameterSet,
    fraud_alleged: bool = False,
) -> LimitationClock:
    """The clock for one case.

    The reference date is the **annual-return due date** for the year under
    scrutiny -- 31 December of the following financial year -- not the date the
    case was opened.
    """
    reference = fy.annual_return_due_date
    section = section_for(fy, fraud_alleged=fraud_alleged, params=params)
    working: list[str] = [
        f"Financial year {fy.label}; annual return due {reference.isoformat()}.",
        f"Section {section} applies"
        + (" (fraud alleged)" if fraud_alleged and section != "74A" else "")
        + ".",
    ]

    if section == "74A":
        key = "s74a_fraud_order_months" if fraud_alleged else "s74a_order_months"
        months = int(params.get("LIMITATION", key, on=fy.end).decimal)
        order_deadline = _add_months(reference, months)
        scn_months = int(params.get("LIMITATION", "s74a_scn_months_before", on=fy.end).decimal)
        scn_deadline = _add_months(order_deadline, -scn_months)
        working.append(f"Order deadline = annual-return date + {months} months.")
        working.append(
            f"The show-cause notice must issue at least {scn_months} months before the order."
        )
    elif section == "74":
        years = int(params.get("LIMITATION", "s74_order_years", on=fy.end).decimal)
        order_deadline = _add_years(reference, years)
        scn_months = int(params.get("LIMITATION", "s74_scn_months_before", on=fy.end).decimal)
        scn_deadline = _add_months(order_deadline, -scn_months)
        working.append(f"Order deadline = annual-return date + {years} years.")
        working.append(f"The notice must issue {scn_months} months before the order.")
    else:
        years = int(params.get("LIMITATION", "s73_order_years", on=fy.end).decimal)
        order_deadline = _add_years(reference, years)
        scn_months = int(params.get("LIMITATION", "s73_scn_months_before", on=fy.end).decimal)
        scn_deadline = _add_months(order_deadline, -scn_months)
        working.append(f"Order deadline = annual-return date + {years} years.")
        working.append(f"The notice must issue {scn_months} months before the order.")

    days_to_order = (order_deadline - as_of).days
    days_to_scn = (scn_deadline - as_of).days

    if days_to_order < 0:
        status = LimitationStatus.EXPIRED
    elif days_to_order < CRITICAL_DAYS:
        status = LimitationStatus.CRITICAL
    elif days_to_order < WARNING_DAYS:
        status = LimitationStatus.WARNING
    else:
        status = LimitationStatus.OK

    voluntary = int(params.get("LIMITATION", "voluntary_payment_days", on=fy.end).decimal)
    working.append(
        f"As at {as_of.isoformat()}: {days_to_scn} day(s) to the notice, "
        f"{days_to_order} day(s) to the order."
    )

    return LimitationClock(
        fy=fy.label,
        section=section,
        fraud_alleged=fraud_alleged,
        reference_date=reference,
        scn_deadline=scn_deadline,
        order_deadline=order_deadline,
        days_to_scn=days_to_scn,
        days_to_order=days_to_order,
        status=status,
        voluntary_payment_days=voluntary,
        working=tuple(working),
    )


def amnesty_applies(fy: FinancialYear, params: ParameterSet) -> bool:
    """s.128A waives interest and penalty for s.73 demands, FY 2017-18 to 2019-20.

    An eligible period must be suppressed from the enforcement queue and shown
    in a separate amnesty view.  Issuing a notice for a waived period is a
    credibility-destroying error and is trivially avoidable.
    """
    first = int(params.get("AMNESTY", "s128a_from_fy", on=fy.end).decimal)
    last = int(params.get("AMNESTY", "s128a_to_fy", on=fy.end).decimal)
    return first <= fy.start_year <= last
