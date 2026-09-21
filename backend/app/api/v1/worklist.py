"""W1 Worklist, W2 Audit Planner, W3 Registry.

Three screens, one idea: turn a portfolio into an ordered list of things one
officer should do next, and record **why** each selection was made.

The rationale is not paperwork.  P30 measures whether last cycle's selections
found anything, and it can only be computed next cycle if the reason for each
selection was captured at the time.  A planner that lets an officer select
without stating a reason produces a parameter that can never be evaluated, so
the reason is required by the API rather than requested by the UI.

**ADVISORY findings may populate a worklist and never a notice.**  Promotion to
enforceable is an explicit, audited act by a named officer -- never a default,
never a side effect of adding the finding to a case.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Any, Final

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.aggregation.rollup import latest_run
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.api.v1.workbench import taxpayer_in_scope
from app.audit.chain import append as audit_append
from app.db.models import AuditLog, EngineRun, Finding, ParamResult, RiskScore, Taxpayer
from app.engine.params_p01_p34 import PARAMETERS
from app.engine.registry import RULES
from app.security.rbac import Principal, scoped

router = APIRouter(tags=["worklist"])

SessionDep = Annotated[Session, Depends(get_session)]

#: How severity orders a worklist.  Not alphabetical: an officer reading down
#: the list should meet the thing that matters most first.
_SEVERITY_RANK: Final[dict[str, int]] = {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "INFO": 4,
}

#: Confidence, likewise.  CERTAIN survives a reply; ADVISORY may not leave the
#: worklist at all.
_CONFIDENCE_RANK: Final[dict[str, int]] = {
    "CERTAIN": 0,
    "STRONG": 1,
    "PROBABLE": 2,
    "WEAK": 3,
    "ADVISORY": 4,
}

_MAX_PAGE: Final[int] = 200


def _money(value: Decimal | None) -> str:
    return format(value if value is not None else Decimal("0.00"), "f")


def _ratio(value: Decimal | None) -> str | None:
    return format(value, "f") if value is not None else None


def _require_run(session: Session, run_id: str | None) -> EngineRun:
    run = session.get(EngineRun, run_id) if run_id else latest_run(session)
    if run is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_ENGINE_RUN", "message": "no engine run has been recorded yet"},
        )
    return run


def _new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# W3 -- the registry
# ---------------------------------------------------------------------------


def _registry_query(
    principal: Principal,
    run: EngineRun,
    *,
    division: str | None,
    officer: str | None,
    p_band: str | None,
    f_band: str | None,
    search: str | None,
) -> Select[Any]:
    """The registry query, filtered server-side.

    Every filter is applied in SQL, not in Python after the fetch: this table
    is specified to hold fifty thousand rows, and a client-side filter over
    that is a screen that times out in front of a Commissioner.
    """
    stmt = select(Taxpayer, RiskScore).outerjoin(
        RiskScore,
        (RiskScore.gstin == Taxpayer.gstin) & (RiskScore.engine_run_id == run.id),
    )
    stmt = scoped(stmt, principal, Taxpayer.gstin)

    if division:
        stmt = stmt.where(Taxpayer.division == division)
    if officer:
        stmt = stmt.where(Taxpayer.officer_id == officer)
    if p_band:
        stmt = stmt.where(RiskScore.p_band == p_band)
    if f_band:
        stmt = stmt.where(RiskScore.f_band == f_band)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            Taxpayer.gstin.like(pattern)
            | Taxpayer.legal_name.ilike(pattern)
            | Taxpayer.trade_name.ilike(pattern)
        )
    return stmt


@router.get("/registry")
def registry(  # noqa: PLR0917 - FastAPI binds query parameters by name
    session: SessionDep,
    principal: PrincipalDep,
    run_id: Annotated[str | None, Query()] = None,
    division: Annotated[str | None, Query()] = None,
    officer: Annotated[str | None, Query()] = None,
    p_band: Annotated[str | None, Query()] = None,
    f_band: Annotated[str | None, Query()] = None,
    search: Annotated[str | None, Query(max_length=128)] = None,
    sort: Annotated[str, Query()] = "p_score",
    descending: Annotated[bool, Query()] = True,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=_MAX_PAGE)] = 50,
) -> dict[str, Any]:
    """The taxpayer registry: filtered, sorted and paged in the database."""
    run = _require_run(session, run_id)
    stmt = _registry_query(
        principal,
        run,
        division=division,
        officer=officer,
        p_band=p_band,
        f_band=f_band,
        search=search,
    )

    total = session.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()

    columns = {
        "p_score": RiskScore.p_score,
        "f_score": RiskScore.f_score,
        "legal_name": Taxpayer.legal_name,
        "gstin": Taxpayer.gstin,
        "aato": Taxpayer.aato,
    }
    if sort not in columns:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "UNKNOWN_SORT",
                "message": f"no sortable column {sort!r}; try {sorted(columns)}",
            },
        )
    column = columns[sort]
    # Nulls last either way: a taxpayer with no score is not the best or the
    # worst, it is unscored, and it should not head the list by accident.
    ordering = column.desc().nulls_last() if descending else column.asc().nulls_last()

    rows = session.execute(
        stmt.order_by(ordering, Taxpayer.gstin).offset((page - 1) * size).limit(size)
    ).all()

    return {
        "engine_run_id": run.id,
        "total": total,
        "page": page,
        "size": size,
        "sort": sort,
        "descending": descending,
        "items": [
            {
                "gstin": taxpayer.gstin,
                "legal_name": taxpayer.legal_name,
                "trade_name": taxpayer.trade_name,
                "division": taxpayer.division,
                "officer_id": taxpayer.officer_id,
                "sector_code": taxpayer.sector_code,
                "aato": _money(taxpayer.aato) if taxpayer.aato is not None else None,
                "status": taxpayer.status,
                "p_score": _ratio(score.p_score) if score else None,
                "p_coverage": _ratio(score.p_coverage) if score else None,
                "p_evaluated": score.p_evaluated if score else None,
                "p_band": score.p_band if score else None,
                "f_score": _ratio(score.f_score) if score else None,
                "f_band": score.f_band if score else None,
                "p_calc_id": score.p_calc_id if score else None,
                "f_calc_id": score.f_calc_id if score else None,
                "href": f"/workbench/taxpayer/{taxpayer.gstin}",
            }
            for taxpayer, score in rows
        ],
        "scope": principal.describe_scope(),
        "note": (
            "A taxpayer with no score is unscored, not zero: they sort last in either "
            "direction rather than heading the list."
        ),
    }


@router.get("/registry/facets")
def registry_facets(
    session: SessionDep,
    principal: PrincipalDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """The filter values that actually occur, so no filter returns nothing."""
    run = _require_run(session, run_id)

    def _values(column: Any) -> list[str]:
        stmt = scoped(select(column).distinct(), principal, Taxpayer.gstin)
        return sorted(str(v) for v in session.execute(stmt).scalars() if v is not None)

    bands = session.execute(
        scoped(
            select(RiskScore.p_band, RiskScore.f_band)
            .where(RiskScore.engine_run_id == run.id)
            .distinct(),
            principal,
            RiskScore.gstin,
        )
    ).all()

    return {
        "divisions": _values(Taxpayer.division),
        "officers": _values(Taxpayer.officer_id),
        "sectors": _values(Taxpayer.sector_code),
        "p_bands": sorted({row[0] for row in bands if row[0]}),
        "f_bands": sorted({row[1] for row in bands if row[1]}),
        "sortable": ["p_score", "f_score", "legal_name", "gstin", "aato"],
    }


# ---------------------------------------------------------------------------
# W1 -- the worklist
# ---------------------------------------------------------------------------


@router.get("/worklist")
def worklist(  # noqa: PLR0917 - FastAPI binds query parameters by name
    session: SessionDep,
    principal: PrincipalDep,
    run_id: Annotated[str | None, Query()] = None,
    officer: Annotated[str | None, Query()] = None,
    dimension: Annotated[str | None, Query()] = None,
    include_advisory: Annotated[bool, Query()] = True,
    undisposed_only: Annotated[bool, Query()] = True,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=_MAX_PAGE)] = 50,
) -> dict[str, Any]:
    """What this officer should look at next, worst first.

    Suppressed findings are excluded from the queue but are not deleted: they
    remain on the taxpayer file, labelled with what suppressed them.
    """
    run = _require_run(session, run_id)

    stmt = (
        select(Finding, Taxpayer)
        .join(Taxpayer, Taxpayer.gstin == Finding.gstin)
        .where(Finding.engine_run_id == run.id, Finding.status == "TRIGGERED")
        .where(Finding.suppressed_by.is_(None))
    )
    stmt = scoped(stmt, principal, Finding.gstin)

    if officer:
        stmt = stmt.where(Taxpayer.officer_id == officer)
    if dimension:
        stmt = stmt.where(Finding.dimension == dimension)
    if not include_advisory:
        stmt = stmt.where(Finding.confidence != "ADVISORY")
    if undisposed_only:
        stmt = stmt.where(Finding.officer_disposition.is_(None))

    # Materialised as plain tuples so the ordering key is a pure function of
    # two model objects rather than of a SQLAlchemy Row.
    rows: list[tuple[Finding, Taxpayer]] = [
        (finding, taxpayer) for finding, taxpayer in session.execute(stmt).all()
    ]

    def _key(pair: tuple[Finding, Taxpayer]) -> tuple[int, int, int, Decimal, str]:
        finding, _ = pair
        return (
            # Actionability first.  An ADVISORY finding cannot populate a
            # notice however severe it is, so heading an officer's queue with
            # one sends them to the thing they cannot act on.  Advisory items
            # stay on the list -- that is what a worklist is for -- but below
            # everything that can be taken forward today.
            0 if finding.confidence != "ADVISORY" else 1,
            _SEVERITY_RANK.get(finding.severity, len(_SEVERITY_RANK)),
            _CONFIDENCE_RANK.get(finding.confidence, len(_CONFIDENCE_RANK)),
            -(finding.delta_igst + finding.delta_cgst + finding.delta_sgst + finding.delta_cess),
            finding.id,
        )

    ordered = sorted(rows, key=_key)
    window = ordered[(page - 1) * size : page * size]

    return {
        "engine_run_id": run.id,
        "total": len(ordered),
        "page": page,
        "size": size,
        "items": [
            {
                "finding_id": finding.id,
                "rule_id": finding.rule_id,
                "title": RULES[finding.rule_id].title
                if finding.rule_id in RULES
                else finding.rule_id,
                "gstin": finding.gstin,
                "legal_name": taxpayer.legal_name,
                "division": taxpayer.division,
                "officer_id": taxpayer.officer_id,
                "period": finding.period,
                "fy": finding.fy,
                "severity": finding.severity,
                "confidence": finding.confidence,
                "dimension": finding.dimension,
                "legal_basis": finding.legal_basis,
                "delta": {
                    "igst": _money(finding.delta_igst),
                    "cgst": _money(finding.delta_cgst),
                    "sgst": _money(finding.delta_sgst),
                    "cess": _money(finding.delta_cess),
                },
                "interest": _money(finding.interest),
                "suggested_form": finding.suggested_form,
                "calc_id": finding.calc_id,
                # The one field that decides what an officer may do with it.
                "may_populate_notice": finding.confidence != "ADVISORY",
                "disposition": finding.officer_disposition,
                "href": f"/workbench/taxpayer/{finding.gstin}",
            }
            for finding, taxpayer in window
        ],
        "scope": principal.describe_scope(),
        "note": (
            "Ordered by what can be acted on first, then severity, then confidence, "
            "then amount. An ADVISORY finding may populate this list and may never "
            "populate a notice without an officer promoting it expressly, so it sits "
            "below everything that can be taken forward today."
        ),
    }


class Disposition(BaseModel):
    """What an officer decided about a finding, and why."""

    disposition: str
    note: str = Field(min_length=3)


#: What an officer may record.  ``PROMOTE`` is separate and deliberately not
#: here: promoting an ADVISORY finding is its own audited act.
_DISPOSITIONS: Final[frozenset[str]] = frozenset({"ACCEPTED", "REJECTED", "DEFERRED", "NEEDS_INFO"})


@router.post("/worklist/{finding_id}/disposition")
def dispose(
    finding_id: str,
    body: Annotated[Disposition, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Record an officer's decision on a finding.

    The note is required. A disposition without a reason is the input that
    makes M-Q01 rule precision uncomputable next cycle, and an officer who
    rejected a finding six months ago cannot reconstruct why.
    """
    if principal.read_only:
        raise HTTPException(
            status_code=403,
            detail={"code": "READ_ONLY", "message": f"{principal.role} may not dispose"},
        )

    finding = session.get(Finding, finding_id)
    if finding is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such finding"}
        )
    taxpayer_in_scope(session, principal, finding.gstin)

    choice = body.disposition.upper()
    if choice not in _DISPOSITIONS:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "UNKNOWN_DISPOSITION",
                "message": f"no disposition {choice!r}; one of {sorted(_DISPOSITIONS)}",
            },
        )

    before = finding.officer_disposition
    finding.officer_disposition = choice
    finding.disposition_by = principal.officer_id
    finding.disposition_at = datetime.now(tz=UTC)
    finding.disposition_note = body.note

    audit_append(
        session,
        actor=principal.officer_id,
        action="FINDING_DISPOSITION",
        entity="finding",
        entity_id=finding.id,
        before={"disposition": before},
        after={"disposition": choice, "note": body.note},
        detail={"rule_id": finding.rule_id, "disposition": choice},
    )
    session.flush()

    return {
        "finding_id": finding.id,
        "disposition": choice,
        "by": principal.officer_id,
        "note": body.note,
    }


@router.post("/worklist/{finding_id}/promote")
def promote(
    finding_id: str,
    body: Annotated[Disposition, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Promote an ADVISORY finding so it may populate a notice.

    This is its own endpoint, with its own audit action, because it is the one
    act that changes what a finding is allowed to become. An advisory signal is
    a reason to look; it is not evidence, and turning it into evidence must be
    a decision a named officer made on a stated day for a stated reason.
    """
    if not principal.may_draft:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ROLE_MAY_NOT_PROMOTE",
                "message": f"{principal.role} may not promote a finding",
            },
        )

    finding = session.get(Finding, finding_id)
    if finding is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such finding"}
        )
    taxpayer_in_scope(session, principal, finding.gstin)

    if finding.confidence != "ADVISORY":
        raise HTTPException(
            status_code=422,
            detail={
                "code": "NOT_ADVISORY",
                "message": (
                    f"{finding.rule_id} is {finding.confidence}, not ADVISORY. It needs "
                    "no promotion and none is recorded."
                ),
            },
        )

    finding.confidence = "PROBABLE"
    finding.officer_disposition = "PROMOTED"
    finding.disposition_by = principal.officer_id
    finding.disposition_at = datetime.now(tz=UTC)
    finding.disposition_note = body.note

    audit_append(
        session,
        actor=principal.officer_id,
        action="FINDING_PROMOTED",
        entity="finding",
        entity_id=finding.id,
        before={"confidence": "ADVISORY"},
        after={"confidence": "PROBABLE", "reason": body.note},
        detail={
            "rule_id": finding.rule_id,
            "reason": body.note,
            "effect": "may now populate a notice",
        },
    )
    session.flush()

    return {
        "finding_id": finding.id,
        "confidence": finding.confidence,
        "promoted_by": principal.officer_id,
        "reason": body.note,
        "note": (
            "This finding may now populate a notice. The promotion, its reason and its "
            "author are in the audit chain."
        ),
    }


# ---------------------------------------------------------------------------
# W2 -- the audit planner
# ---------------------------------------------------------------------------


@router.get("/planner/candidates")
def candidates(  # noqa: PLR0917 - FastAPI binds query parameters by name
    session: SessionDep,
    principal: PrincipalDep,
    run_id: Annotated[str | None, Query()] = None,
    min_p_score: Annotated[str | None, Query(description="a decimal, as a string")] = None,
    p_band: Annotated[str | None, Query()] = None,
    param_id: Annotated[str | None, Query(description="e.g. P14")] = None,
    min_flag: Annotated[int | None, Query(ge=0, le=4)] = None,
    min_coverage: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=_MAX_PAGE)] = 50,
) -> dict[str, Any]:
    """Selection candidates, filterable on an individual parameter flag.

    ``min_coverage`` matters more than it looks. Selecting the highest P-Score
    in the portfolio is meaningless if that score was computed over three of
    thirty-four parameters, so the planner lets an officer require a coverage
    floor and states the coverage of every candidate it returns.
    """
    run = _require_run(session, run_id)

    stmt = (
        select(Taxpayer, RiskScore)
        .join(RiskScore, RiskScore.gstin == Taxpayer.gstin)
        .where(RiskScore.engine_run_id == run.id)
    )
    stmt = scoped(stmt, principal, Taxpayer.gstin)

    if p_band:
        stmt = stmt.where(RiskScore.p_band == p_band)
    if min_p_score is not None:
        stmt = stmt.where(RiskScore.p_score >= Decimal(min_p_score))
    if min_coverage is not None:
        stmt = stmt.where(RiskScore.p_coverage >= Decimal(min_coverage))

    if param_id is not None:
        if param_id not in PARAMETERS:
            raise HTTPException(
                status_code=422,
                detail={"code": "UNKNOWN_PARAMETER", "message": f"no parameter {param_id!r}"},
            )
        flagged = (
            select(ParamResult.gstin)
            .where(
                ParamResult.engine_run_id == run.id,
                ParamResult.param_id == param_id,
                # A NOT_EVALUATED parameter has a null flag and must never
                # satisfy a "flag at least N" filter by being treated as zero.
                ParamResult.flag.is_not(None),
            )
            .where(ParamResult.flag >= (min_flag if min_flag is not None else 1))
        )
        stmt = stmt.where(Taxpayer.gstin.in_(flagged))

    total = session.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    rows = session.execute(
        stmt.order_by(RiskScore.p_score.desc().nulls_last(), Taxpayer.gstin)
        .offset((page - 1) * size)
        .limit(size)
    ).all()

    return {
        "engine_run_id": run.id,
        "total": total,
        "page": page,
        "size": size,
        "filters": {
            "min_p_score": min_p_score,
            "p_band": p_band,
            "param_id": param_id,
            "min_flag": min_flag,
            "min_coverage": min_coverage,
        },
        "items": [
            {
                "gstin": taxpayer.gstin,
                "legal_name": taxpayer.legal_name,
                "division": taxpayer.division,
                "officer_id": taxpayer.officer_id,
                "p_score": _ratio(score.p_score),
                "p_coverage": _ratio(score.p_coverage),
                "p_evaluated": score.p_evaluated,
                "p_of": len(PARAMETERS),
                "p_band": score.p_band,
                "f_score": _ratio(score.f_score),
                "f_band": score.f_band,
                "p_calc_id": score.p_calc_id,
                "href": f"/workbench/taxpayer/{taxpayer.gstin}",
            }
            for taxpayer, score in rows
        ],
        "note": (
            "Coverage is shown for every candidate. A high P-Score computed over three "
            "of 34 parameters is not a stronger signal than a lower one computed over "
            "thirty; it is a less complete one."
        ),
    }


class Selection(BaseModel):
    """A selection for audit, with the reason it was made."""

    gstins: list[str] = Field(min_length=1)
    fy: str
    rationale: str = Field(min_length=10)
    basis: str = Field(default="P_SCORE")


@router.post("/planner/selections", status_code=201)
def select_for_audit(
    body: Annotated[Selection, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Record a selection, with its rationale.

    The rationale is mandatory and is not free decoration: P30 measures whether
    selections made on a stated basis found anything, and it is computed next
    cycle from exactly these records. A selection with no stated reason makes
    that parameter permanently unevaluable.
    """
    if not principal.may_draft:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ROLE_MAY_NOT_SELECT",
                "message": f"{principal.role} may not select for audit",
            },
        )

    selected: list[str] = []
    for gstin in body.gstins:
        taxpayer_in_scope(session, principal, gstin)
        selected.append(gstin)

    selection_id = _new_id()
    audit_append(
        session,
        actor=principal.officer_id,
        action="AUDIT_SELECTION",
        entity="selection",
        entity_id=selection_id,
        after={"gstins": selected, "fy": body.fy, "rationale": body.rationale},
        detail={
            "selection_id": selection_id,
            "gstins": selected,
            "fy": body.fy,
            "basis": body.basis,
            "rationale": body.rationale,
            "count": len(selected),
        },
    )
    session.flush()

    return {
        "selection_id": selection_id,
        "fy": body.fy,
        "basis": body.basis,
        "rationale": body.rationale,
        "gstins": selected,
        "count": len(selected),
        "note": (
            "Recorded in the audit chain. Next cycle, P30 is computed from these "
            "records: what was selected, on what basis, and what it found."
        ),
    }


@router.get("/planner/selections")
def list_selections(
    session: SessionDep,
    principal: PrincipalDep,
    fy: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Selections made, with their rationale -- the input P30 needs."""
    rows = (
        session.execute(
            select(AuditLog)
            .where(AuditLog.action == "AUDIT_SELECTION")
            .order_by(AuditLog.seq.desc())
        )
        .scalars()
        .all()
    )

    items = []
    for row in rows:
        detail = row.detail or {}
        if fy and detail.get("fy") != fy:
            continue
        items.append(
            {
                "selection_id": detail.get("selection_id", row.entity_id),
                "at": row.at.isoformat(),
                "by": row.actor,
                "fy": detail.get("fy"),
                "basis": detail.get("basis"),
                "rationale": detail.get("rationale"),
                "gstins": detail.get("gstins", []),
                "count": detail.get("count", 0),
            }
        )

    return {
        "count": len(items),
        "items": items,
        "scope": principal.describe_scope(),
        "note": (
            "Every selection carries the reason it was made. This is what makes P30 "
            "computable next cycle rather than a parameter that is permanently dark."
        ),
    }
