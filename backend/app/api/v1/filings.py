"""W8 - filings: one return, one period, worked on its own.

The platform was built around two units, and neither is the one an officer
actually holds in their hand. A *taxpayer* is a year of behaviour; a *case* is
what you open after you have decided there is something to answer for. In
between sits the thing on the desk: **this business, this month, this return**.

That gap showed. An officer could see that a taxpayer had thirty findings
across a year and could see the portfolio they sat in, but had nowhere to
stand and ask "what about July?" - and July is the question, because a notice
is issued for a period.

So: a list of every filing the platform holds, each with its own risk profile,
and a detail view that puts one filing through everything the platform knows -
every rule that fired, every rule that did not and why, the 34 risk flags for
the year it falls in, and the declared figures themselves. An officer can then
record what they concluded, including "nothing", which is the outcome no
system records and every officer is later asked about.

Nothing here computes a new number. Every figure is read back from what the
engine already wrote, carrying the ``calc_id`` it was written with.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.aggregation.rollup import latest_run
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.api.v1.workbench import taxpayer_in_scope
from app.audit.chain import append as audit_append
from app.canonical import FindingStatus, Period
from app.db.models import (
    EngineRun,
    FilingReview,
    FilingStatus,
    Finding,
    ParamResult,
    Return3B,
    Taxpayer,
)
from app.engine.registry import RULES
from app.security.rbac import visible_gstins

router = APIRouter(tags=["filings"])

SessionDep = Annotated[Session, Depends(get_session)]

_ZERO = Decimal("0.00")

#: What an officer can conclude about a filing.
DISPOSITIONS = ("OPEN", "NO_ACTION", "WATCH", "ESCALATE")

#: Severity, worst first, for ordering a list an officer works top-down.
_SEVERITY_RANK = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "ADVISORY": 4}


def _money(value: Decimal | None) -> str:
    return format(value if value is not None else _ZERO, "f")


def _heads(finding: Finding) -> dict[str, str]:
    """The head-wise split, never summed into one scalar here."""
    return {
        "igst": _money(finding.delta_igst),
        "cgst": _money(finding.delta_cgst),
        "sgst": _money(finding.delta_sgst),
        "cess": _money(finding.delta_cess),
    }


def _total(finding: Finding) -> Decimal:
    """The one place the heads collapse, and only to sort and to display."""
    return finding.delta_igst + finding.delta_cgst + finding.delta_sgst + finding.delta_cess


class ReviewIn(BaseModel):
    """What an officer concluded about one filing."""

    comment: str = Field(min_length=3, max_length=4000)
    disposition: str = Field(default="OPEN")


# ---------------------------------------------------------------------------
# the list
# ---------------------------------------------------------------------------


@router.get("/filings")
def list_filings(
    principal: PrincipalDep,
    session: SessionDep,
    *,
    run_id: Annotated[str | None, Query()] = None,
    gstin: Annotated[str | None, Query()] = None,
    period: Annotated[str | None, Query()] = None,
    only: Annotated[str | None, Query(description="triggered | clean | reviewed")] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
) -> dict[str, Any]:
    """Every filing in the caller's jurisdiction, with its own risk profile.

    A filing is one taxpayer and one period. It is listed if the platform holds
    anything about it at all -- a return, a filing status, or a finding --
    because "we have a GSTR-1 and no GSTR-3B" is itself the answer to a
    question somebody is going to ask.
    """
    run = session.get(EngineRun, run_id) if run_id else latest_run(session)
    scope = visible_gstins(principal)

    # (gstin, period) -> what we know about it.
    known: dict[tuple[str, str], dict[str, Any]] = {}

    def slot(key_gstin: str, key_period: str) -> dict[str, Any]:
        return known.setdefault(
            (key_gstin, key_period),
            {
                "gstin": key_gstin,
                "period": key_period,
                "returns_held": set(),
                "findings": 0,
                "triggered": 0,
                "worst_severity": None,
                "at_stake": _ZERO,
                "not_evaluated": 0,
            },
        )

    for summary in session.execute(select(Return3B).where(Return3B.gstin.in_(scope))).scalars():
        slot(summary.gstin, summary.period)["returns_held"].add("GSTR-3B")

    for status in session.execute(
        select(FilingStatus).where(FilingStatus.gstin.in_(scope))
    ).scalars():
        entry = slot(status.gstin, status.period)
        entry["returns_held"].add(status.return_type)
        entry["filing_status"] = status.status
        entry["days_late"] = status.days_late
        entry["barred_on"] = status.barred_on.isoformat() if status.barred_on else None

    if run is not None:
        findings = session.execute(
            select(Finding).where(
                Finding.engine_run_id == run.id,
                Finding.gstin.in_(scope),
                Finding.period.is_not(None),
            )
        ).scalars()
        for finding in findings:
            entry = slot(finding.gstin, str(finding.period))
            entry["findings"] += 1
            if finding.status == FindingStatus.NOT_EVALUATED.value:
                entry["not_evaluated"] += 1
                continue
            if finding.status != FindingStatus.TRIGGERED.value:
                continue
            entry["triggered"] += 1
            entry["at_stake"] += _total(finding)
            rank = _SEVERITY_RANK.get(finding.severity, 9)
            current = entry["worst_severity"]
            if current is None or rank < _SEVERITY_RANK.get(str(current), 9):
                entry["worst_severity"] = finding.severity

    reviews: dict[tuple[str, str], int] = defaultdict(int)
    latest_note: dict[tuple[str, str], FilingReview] = {}
    for review in session.execute(
        select(FilingReview).where(FilingReview.gstin.in_(scope)).order_by(FilingReview.at)
    ).scalars():
        key = (review.gstin, review.period)
        reviews[key] += 1
        latest_note[key] = review

    names = {
        found.gstin: found
        for found in session.execute(select(Taxpayer).where(Taxpayer.gstin.in_(scope))).scalars()
    }

    items: list[dict[str, Any]] = []
    for key, entry in known.items():
        if not _wanted(entry, gstin=gstin, period=period):
            continue
        note = latest_note.get(key)
        taxpayer = names.get(entry["gstin"])
        listed: dict[str, Any] = {
            "gstin": entry["gstin"],
            "period": entry["period"],
            "period_label": _period_label(entry["period"]),
            "legal_name": taxpayer.legal_name if taxpayer else None,
            "division": taxpayer.division if taxpayer else None,
            "returns_held": sorted(entry["returns_held"]),
            "findings": entry["findings"],
            "triggered": entry["triggered"],
            "not_evaluated": entry["not_evaluated"],
            "worst_severity": entry["worst_severity"],
            "at_stake": _money(entry["at_stake"]),
            "filing_status": entry.get("filing_status"),
            "days_late": entry.get("days_late"),
            "barred_on": entry.get("barred_on"),
            "review_count": reviews.get(key, 0),
            "disposition": note.disposition if note else None,
            "reviewed_by": note.officer_id if note else None,
        }
        if _passes(listed, only):
            items.append(listed)

    # Worst first, then largest amount, then newest period: an officer works
    # this list from the top and should not have to sort it themselves.
    items.sort(
        key=lambda entry: (
            _SEVERITY_RANK.get(str(entry["worst_severity"]), 9),
            -Decimal(str(entry["at_stake"])),
            str(entry["period"]),
        )
    )

    return {
        "count": len(items),
        "shown": min(len(items), limit),
        "run_id": None if run is None else run.id,
        "scope": principal.describe_scope(),
        "items": items[:limit],
        "note": (
            "One row is one return for one period. The risk profile is read back from the "
            "engine's results -- nothing on this screen is recomputed, and nothing is "
            "estimated."
        ),
    }


def _wanted(entry: dict[str, Any], *, gstin: str | None, period: str | None) -> bool:
    """The subject filters, which say nothing about risk."""
    if gstin and entry["gstin"] != gstin.upper():
        return False
    return not (period and entry["period"] != period)


def _passes(listed: dict[str, Any], only: str | None) -> bool:
    """The outcome filter.

    ``clean`` means no rule fired -- which is not the same as "nothing to see",
    because a filing with rules that could not be evaluated is also not
    triggered. The screen shows that count separately for exactly this reason.
    """
    triggered = int(listed["triggered"])
    reviews = int(listed["review_count"])
    if only == "triggered":
        return triggered != 0
    if only == "clean":
        return triggered == 0
    if only == "reviewed":
        return reviews != 0
    return True


def _period_label(period: str) -> str:
    try:
        return Period.parse(period).label
    except ValueError:
        return period


# ---------------------------------------------------------------------------
# one filing
# ---------------------------------------------------------------------------


@router.get("/filings/{gstin}/{period}")
def filing_detail(
    gstin: str,
    period: str,
    principal: PrincipalDep,
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """One filing, against everything the platform knows about it.

    Four sections, and the third is the one that is usually missing from a
    screen like this: the rules that did **not** fire, and why. An officer
    asked to justify not pursuing something needs the same evidence as one
    asked to justify pursuing it.
    """
    taxpayer = taxpayer_in_scope(session, principal, gstin)
    run = session.get(EngineRun, run_id) if run_id else latest_run(session)

    try:
        parsed = Period.parse(period)
    except ValueError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "BAD_PERIOD", "message": str(exc)}
        ) from exc
    period = parsed.mmyyyy

    declared = session.execute(
        select(Return3B).where(Return3B.gstin == gstin, Return3B.period == period)
    ).scalar_one_or_none()

    triggered: list[dict[str, Any]] = []
    cleared: list[dict[str, Any]] = []
    not_evaluated: list[dict[str, Any]] = []

    if run is not None:
        for finding in session.execute(
            select(Finding)
            .where(
                Finding.engine_run_id == run.id,
                Finding.gstin == gstin,
                Finding.period == period,
            )
            .order_by(Finding.rule_id)
        ).scalars():
            spec = RULES.get(finding.rule_id)
            row = {
                "rule_id": finding.rule_id,
                "title": spec.title if spec else finding.rule_id,
                "family": spec.family if spec else None,
                "legal_basis": spec.legal_basis if spec else None,
                "status": finding.status,
                "severity": finding.severity,
                "confidence": finding.confidence,
                "heads": _heads(finding),
                "total": _money(_total(finding)),
                "interest": _money(finding.interest),
                "penalty": _money(finding.penalty),
                "calc_id": finding.calc_id,
                "missing_inputs": list(finding.missing_inputs or []),
            }
            if finding.status == FindingStatus.TRIGGERED.value:
                triggered.append(row)
            elif finding.status == FindingStatus.NOT_EVALUATED.value:
                not_evaluated.append(row)
            else:
                cleared.append(row)

    triggered.sort(key=lambda row: _SEVERITY_RANK.get(str(row["severity"]), 9))

    # The 34 risk flags belong to the financial year, not the month. Shown
    # here with that said plainly, because a flag is not evidence about July.
    flags: list[dict[str, Any]] = []
    if run is not None:
        for result in session.execute(
            select(ParamResult)
            .where(ParamResult.engine_run_id == run.id, ParamResult.gstin == gstin)
            .order_by(ParamResult.param_id)
        ).scalars():
            flags.append(
                {
                    "param_id": result.param_id,
                    "flag": result.flag,
                    "status": result.status,
                    "value": None if result.value is None else format(result.value, "f"),
                    "fy": result.fy,
                    "missing_inputs": list(result.missing_inputs or []),
                    "calc_id": result.calc_id,
                }
            )

    reviews = [
        {
            "id": review.id,
            "at": review.at.isoformat(),
            "officer_id": review.officer_id,
            "comment": review.comment,
            "disposition": review.disposition,
            "engine_run_id": review.engine_run_id,
        }
        for review in session.execute(
            select(FilingReview)
            .where(FilingReview.gstin == gstin, FilingReview.period == period)
            .order_by(FilingReview.at.desc())
        ).scalars()
    ]

    at_stake = sum((Decimal(str(row["total"])) for row in triggered), _ZERO)

    return {
        "gstin": gstin,
        "period": period,
        "period_label": parsed.label,
        "legal_name": taxpayer.legal_name,
        "trade_name": taxpayer.trade_name,
        "division": taxpayer.division,
        "registration_status": taxpayer.status,
        "run_id": None if run is None else run.id,
        "as_of": None if run is None else run.as_of.isoformat(),
        "declared": _declared(declared),
        "summary": {
            "rules_run": len(triggered) + len(cleared),
            "triggered": len(triggered),
            "cleared": len(cleared),
            "not_evaluated": len(not_evaluated),
            "at_stake": _money(at_stake),
            "flags_evaluated": sum(1 for flag in flags if flag["flag"] is not None),
            "flags_total": len(flags),
        },
        "triggered": triggered,
        "cleared": cleared,
        "not_evaluated": not_evaluated,
        "flags": flags,
        "reviews": reviews,
        "note": (
            "Every figure here was written by the engine and carries the calc_id it was "
            "written with. The risk flags are computed over the financial year, not this "
            "month: they say whether the business is worth examining, not what this return "
            "shows."
        ),
    }


def _declared(row: Return3B | None) -> dict[str, Any] | None:
    """What the summary return itself says, before any rule looks at it."""
    if row is None:
        return None
    return {
        "period": row.period,
        "t31a": {
            "taxable": _money(row.t31a_taxable),
            "igst": _money(row.t31a_igst),
            "cgst": _money(row.t31a_cgst),
            "sgst": _money(row.t31a_sgst),
            "cess": _money(row.t31a_cess),
        },
        "filing_date": row.filing_date.isoformat() if row.filing_date else None,
        "arn": row.arn,
    }


# ---------------------------------------------------------------------------
# what the officer concluded
# ---------------------------------------------------------------------------


@router.post("/filings/{gstin}/{period}/review", status_code=201)
def add_review(
    gstin: str,
    period: str,
    body: Annotated[ReviewIn, Body()],
    principal: PrincipalDep,
    session: SessionDep,
) -> dict[str, Any]:
    """Record what an officer concluded about one filing.

    Including "nothing to do". A platform that records only the cases somebody
    opened cannot answer the question an officer is actually asked two years
    later, which is why they did *not* open one.
    """
    taxpayer_in_scope(session, principal, gstin)
    if principal.read_only:
        raise HTTPException(
            status_code=403,
            detail={"code": "READ_ONLY", "message": "this role may not record a review"},
        )
    if body.disposition not in DISPOSITIONS:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "BAD_DISPOSITION",
                "message": f"disposition must be one of {list(DISPOSITIONS)}",
            },
        )

    try:
        parsed = Period.parse(period)
    except ValueError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "BAD_PERIOD", "message": str(exc)}
        ) from exc

    run = latest_run(session)
    review = FilingReview(
        id=str(uuid.uuid4()),
        gstin=gstin,
        period=parsed.mmyyyy,
        engine_run_id=None if run is None else run.id,
        officer_id=principal.officer_id,
        comment=body.comment.strip(),
        disposition=body.disposition,
    )
    session.add(review)
    session.flush()

    audit_append(
        session,
        actor=principal.officer_id,
        action="FILING_REVIEWED",
        entity="filing_review",
        entity_id=review.id,
        after={"disposition": review.disposition},
        detail={"gstin": gstin, "period": parsed.mmyyyy},
    )

    return {
        "id": review.id,
        "at": review.at.isoformat(),
        "officer_id": review.officer_id,
        "comment": review.comment,
        "disposition": review.disposition,
        "engine_run_id": review.engine_run_id,
    }
