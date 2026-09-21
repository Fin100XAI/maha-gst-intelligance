"""Workbench: the taxpayer file, cases, demands and notices.

Three things are enforced here rather than in the UI, because the UI is not a
security boundary:

* **Jurisdiction.**  Every query goes through :mod:`app.security.rbac`, and an
  out-of-scope GSTIN returns 404 -- never 403, which would confirm that the
  registration exists.
* **Maker-checker.**  Self-approval is refused by the service layer and again
  by role here: an Inspector may draft, an Assistant Commissioner approves.
* **Slot locking.**  A request that tries to change a numeric slot is rejected
  with 422.  Only the narrative is editable.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.aggregation.rollup import latest_run
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.canonical import (
    ActionForm,
    Confidence,
    FinancialYear,
    FindingStatus,
    Period,
    RiskDimension,
    Severity,
)
from app.cases.demand import DemandBuildUp, compute_demand
from app.db.models import (
    Case,
    EngineRun,
    Finding,
    IdentityCheck,
    Notice,
    ParamResult,
    RiskScore,
    Taxpayer,
)
from app.engine.params import ParameterSet
from app.engine.params_p01_p34 import EXTERNAL_PARAMS, PARAMETERS
from app.engine.registry import RULES
from app.engine.registry import Finding as EngineFinding
from app.engine.trace import CalcKind, Tracer
from app.money import TaxVector
from app.notices import service as notices
from app.notices.templates import TEMPLATES, SlotError
from app.security.rbac import OutOfScopeError, Principal, assert_in_scope, scoped

router = APIRouter(tags=["workbench"])

SessionDep = Annotated[Session, Depends(get_session)]


def _money(value: Decimal | None) -> str:
    return format(value if value is not None else Decimal("0.00"), "f")


def _ratio(value: Decimal | None) -> str | None:
    """A ratio as a string, or ``None``.  A zero ratio is a ratio."""
    return format(value, "f") if value is not None else None


def taxpayer_in_scope(session: Session, principal: Principal, gstin: str) -> Taxpayer:
    """Resolve a GSTIN inside the caller's jurisdiction, or 404."""
    try:
        return assert_in_scope(session, principal, gstin)
    except OutOfScopeError as exc:
        # 404, not 403.  The caller must not learn whether this registration
        # exists outside their jurisdiction.
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "no such taxpayer in your jurisdiction"},
        ) from exc


def _notice_in_scope(session: Session, principal: Principal, notice_id: str) -> Notice:
    notice = session.get(Notice, notice_id)
    if notice is not None:
        case = session.get(Case, notice.case_id)
        if case is not None:
            taxpayer_in_scope(session, principal, case.gstin)
            return notice
    raise HTTPException(
        status_code=404,
        detail={"code": "NOT_FOUND", "message": "no such notice in your jurisdiction"},
    )


# ---------------------------------------------------------------------------
# W4 -- the taxpayer file
# ---------------------------------------------------------------------------


@router.get("/taxpayers/{gstin}")
def taxpayer_file(
    gstin: str,
    session: SessionDep,
    principal: PrincipalDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Everything known about one taxpayer, as W4 renders it.

    All 34 parameters are returned, including the ones that could not be
    evaluated.  A dark parameter comes back with ``flag: null`` and the feed it
    waits on -- never hidden, and never defaulted to Flag 0, because a
    parameter shown as Flag 0 when it was never tested is what turns a risk
    score into a lie.
    """
    taxpayer = taxpayer_in_scope(session, principal, gstin)
    engine_run = session.get(EngineRun, run_id) if run_id else latest_run(session)
    if engine_run is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_ENGINE_RUN", "message": "no engine run has been recorded yet"},
        )

    score = (
        session.execute(
            select(RiskScore).where(
                RiskScore.engine_run_id == engine_run.id, RiskScore.gstin == gstin
            )
        )
        .scalars()
        .first()
    )

    results = {
        row.param_id: row
        for row in session.execute(
            select(ParamResult).where(
                ParamResult.engine_run_id == engine_run.id, ParamResult.gstin == gstin
            )
        ).scalars()
    }

    ladder: list[dict[str, Any]] = []
    for param_id, spec in PARAMETERS.items():
        row = results.get(param_id)
        ladder.append(
            {
                "param_id": param_id,
                "title": spec.title,
                "banding": spec.banding,
                "direction": spec.direction,
                "action_point": spec.action_point,
                "value": format(row.value, "f") if row and row.value is not None else None,
                "flag": row.flag if row else None,
                "status": row.status if row else "NOT_EVALUATED",
                "missing_inputs": list(row.missing_inputs) if row else [],
                "external_feed": spec.external_feed,
                "roadmap_ref": spec.roadmap_ref,
                "excluded_from_score": param_id in EXTERNAL_PARAMS,
                "cohort": {
                    "p50": _ratio(row.cohort_p50 if row else None),
                    "p75": _ratio(row.cohort_p75 if row else None),
                    "p90": _ratio(row.cohort_p90 if row else None),
                    "n": row.cohort_n if row else None,
                },
                "related_rules": list(spec.related_rules),
                "calc_id": row.calc_id if row else None,
            }
        )

    findings = (
        session.execute(
            select(Finding)
            .where(Finding.engine_run_id == engine_run.id, Finding.gstin == gstin)
            .order_by(Finding.rule_id, Finding.period)
        )
        .scalars()
        .all()
    )

    return {
        "engine_run_id": engine_run.id,
        "taxpayer": {
            "gstin": taxpayer.gstin,
            "legal_name": taxpayer.legal_name,
            "trade_name": taxpayer.trade_name,
            "division": taxpayer.division,
            "range": taxpayer.range_office,
            "officer_id": taxpayer.officer_id,
            "sector_code": taxpayer.sector_code,
            "aato": _money(taxpayer.aato) if taxpayer.aato is not None else None,
            "qrmp": taxpayer.qrmp,
            "status": taxpayer.status,
        },
        "scores": {
            "p_score": format(score.p_score, "f") if score.p_score is not None else None,
            "p_evaluated": score.p_evaluated if score else None,
            "p_of": len(PARAMETERS),
            "p_band": score.p_band if score else None,
            "p_calc_id": score.p_calc_id if score else None,
            "f_score": format(score.f_score, "f") if score.f_score is not None else None,
            "f_band": score.f_band if score else None,
            "f_calc_id": score.f_calc_id if score else None,
            "note": (
                "P-Score and F-Score answer different questions and are never "
                "combined into one number."
            ),
        }
        if score
        else None,
        "flag_ladder": ladder,
        "findings": [
            {
                "id": finding.id,
                "rule_id": finding.rule_id,
                "title": RULES[finding.rule_id].title
                if finding.rule_id in RULES
                else finding.rule_id,
                "status": finding.status,
                "severity": finding.severity,
                "confidence": finding.confidence,
                "dimension": finding.dimension,
                "period": finding.period,
                "legal_basis": finding.legal_basis,
                "delta": {
                    "igst": _money(finding.delta_igst),
                    "cgst": _money(finding.delta_cgst),
                    "sgst": _money(finding.delta_sgst),
                    "cess": _money(finding.delta_cess),
                },
                "interest": _money(finding.interest),
                "penalty": _money(finding.penalty),
                "missing_inputs": list(finding.missing_inputs),
                "suppressed_by": finding.suppressed_by,
                "suggested_form": finding.suggested_form,
                "calc_id": finding.calc_id,
                "formula_rendered": finding.formula_rendered,
            }
            for finding in findings
        ],
        "scope": principal.describe_scope(),
    }


@router.get("/taxpayers/{gstin}/reconciliation")
def reconciliation(
    gstin: str,
    session: SessionDep,
    principal: PrincipalDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """The Reconciliation Workbench: eleven identities across every period.

    An identity either holds, is breached by a stated head-wise amount, or
    could not be evaluated because a dataset was absent. Those are three
    different answers and the matrix shows three different cells -- a blank
    where the third should be is the failure this screen exists to prevent.

    The head-wise split is the default. An identity breached by +1,00,000 IGST
    and -1,00,000 CGST nets to zero, and a screen that showed the net would
    report a clean reconciliation over two real errors.
    """
    taxpayer_in_scope(session, principal, gstin)
    engine_run = session.get(EngineRun, run_id) if run_id else latest_run(session)
    if engine_run is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_ENGINE_RUN", "message": "no engine run has been recorded yet"},
        )

    rows = (
        session.execute(
            select(IdentityCheck)
            .where(
                IdentityCheck.engine_run_id == engine_run.id,
                IdentityCheck.gstin == gstin,
            )
            .order_by(IdentityCheck.period, IdentityCheck.identity_id)
        )
        .scalars()
        .all()
    )

    periods = sorted({row.period for row in rows if row.period})
    identities = sorted(
        {row.identity_id for row in rows},
        key=lambda value: int(value.removeprefix("R")) if value[1:].isdigit() else 0,
    )
    titles = {row.identity_id: row.title for row in rows}
    cells = {
        (row.period, row.identity_id): {
            "status": row.status,
            "delta": {
                "igst": _money(row.delta_igst),
                "cgst": _money(row.delta_cgst),
                "sgst": _money(row.delta_sgst),
                "cess": _money(row.delta_cess),
            },
            "delta_total": _money(
                row.delta_igst + row.delta_cgst + row.delta_sgst + row.delta_cess
            ),
            "missing_inputs": list(row.missing_inputs),
            "consequence": row.consequence,
            "note": row.note,
            "calc_id": row.calc_id,
        }
        for row in rows
    }

    counts = dict.fromkeys(("HOLDS", "BREACHED", "NOT_EVALUATED"), 0)
    for row in rows:
        counts[row.status] = counts.get(row.status, 0) + 1

    return {
        "engine_run_id": engine_run.id,
        "gstin": gstin,
        "periods": periods,
        "identities": [{"identity_id": key, "title": titles.get(key, key)} for key in identities],
        "cells": [
            {"period": period, "identity_id": identity, **cells[(period, identity)]}
            for period in periods
            for identity in identities
            if (period, identity) in cells
        ],
        "counts": counts,
        "note": (
            "Head-wise by default. An identity breached by +1,00,000 IGST and "
            "-1,00,000 CGST nets to zero, and a net view would report a clean "
            "reconciliation over two real errors."
        )
        if rows
        else (
            "No identity was evaluated in this run. The reconciliation matrix is "
            "computed by the engine; a run made with identities disabled has none."
        ),
    }


# ---------------------------------------------------------------------------
# cases and demands
# ---------------------------------------------------------------------------


class OpenCase(BaseModel):
    gstin: str
    fy: str
    type: str = "SCRUTINY"
    finding_ids: list[str] = Field(default_factory=list)


@router.post("/cases", status_code=201)
def open_case(
    body: Annotated[OpenCase, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Open a case over a set of findings."""
    if principal.read_only:
        raise HTTPException(
            status_code=403,
            detail={"code": "READ_ONLY", "message": f"{principal.role} may not open a case"},
        )
    taxpayer_in_scope(session, principal, body.gstin)

    case = Case(
        id=str(uuid.uuid4()),
        gstin=body.gstin,
        fy=body.fy,
        type=body.type,
        status="IDENTIFIED",
        officer_id=principal.officer_id,
        finding_ids=list(body.finding_ids),
    )
    session.add(case)
    session.flush()
    return {"case_id": case.id, "status": case.status}


def _demand_for(session: Session, case: Case, *, as_of: date | None = None) -> DemandBuildUp:
    stmt = select(Finding).where(Finding.gstin == case.gstin)
    if case.finding_ids:
        stmt = stmt.where(Finding.id.in_(list(case.finding_ids)))
    rows = session.execute(stmt).scalars().all()

    return compute_demand(
        [_rehydrate(row) for row in rows],
        gstin=case.gstin,
        fy=FinancialYear.parse(case.fy),
        as_of=as_of or datetime.now(tz=UTC).date(),
        params=ParameterSet(),
        snapshot_id=case.id,
    )


def _rehydrate(row: Finding) -> EngineFinding:
    """Rebuild the engine's Finding from the stored row.

    The demand is computed from the same objects the engine produced, so the
    figure on a notice and the figure in the drawer come from one computation
    rather than two.
    """
    tracer = Tracer(CalcKind.RULE, row.rule_id, row.engine_run_id, gstin=row.gstin)
    trace = tracer.finish(result=None, formula_rendered=row.formula_rendered)
    return EngineFinding(
        rule_id=row.rule_id,
        status=FindingStatus(row.status),
        severity=Severity(row.severity),
        confidence=Confidence(row.confidence),
        dimension=RiskDimension(row.dimension),
        title=RULES[row.rule_id].title if row.rule_id in RULES else row.rule_id,
        legal_basis=row.legal_basis or "",
        gstin=row.gstin,
        period=Period.parse(row.period) if row.period else None,
        delta=TaxVector(
            igst=row.delta_igst,
            cgst=row.delta_cgst,
            sgst=row.delta_sgst,
            cess=row.delta_cess,
        ),
        interest=row.interest,
        penalty=row.penalty,
        missing_inputs=tuple(row.missing_inputs),
        suppressed_by=row.suppressed_by,
        trace=trace,
    )


@router.get("/cases/{case_id}/demand")
def case_demand(
    case_id: str,
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """The demand build-up: every line, every exclusion, one calc_id."""
    case = session.get(Case, case_id)
    if case is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such case"}
        )
    taxpayer_in_scope(session, principal, case.gstin)
    return _demand_for(session, case).as_dict()


# ---------------------------------------------------------------------------
# notices
# ---------------------------------------------------------------------------


class DraftNotice(BaseModel):
    case_id: str
    form: str
    narrative: str
    language: str = "en"


class EditNarrative(BaseModel):
    narrative: str


class ApproveNotice(BaseModel):
    office_code: str
    issued_on: date
    sequence: int


class ServeNotice(BaseModel):
    service_mode: str
    served_at: datetime


@router.get("/notices/templates")
def notice_templates() -> dict[str, Any]:
    """Which forms are drafted, in which languages, and what each one requires."""
    return {
        "items": [
            {
                "form": template.form.value,
                "language": template.language,
                "title": template.title,
                "legal_basis": template.legal_basis,
                "reply_days": template.reply_days,
                "slots": list(template.slots),
                "preconditions": list(template.preconditions),
            }
            for template in TEMPLATES.values()
        ],
        "note": (
            "Numeric slots bind only to finding fields. They cannot be edited, and a "
            "request that tries is rejected with 422."
        ),
    }


@router.post("/notices/draft", status_code=201)
def draft_notice(
    body: Annotated[DraftNotice, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    if not principal.may_draft:
        raise HTTPException(
            status_code=403,
            detail={"code": "ROLE_MAY_NOT_DRAFT", "message": f"{principal.role} may not draft"},
        )
    case = session.get(Case, body.case_id)
    if case is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such case"}
        )
    taxpayer = taxpayer_in_scope(session, principal, case.gstin)

    try:
        form = ActionForm(body.form)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "UNKNOWN_FORM", "message": f"no form {body.form!r}"},
        ) from exc

    # A notice addressed to a GSTIN rather than to a person is defective on its
    # face. Ingestion registers a filer as a stub built from the return, because
    # a GSTR-1 does not carry a legal name; that stub is enough to analyse a
    # taxpayer and not enough to serve one.
    if taxpayer.status == "FROM_RETURN" or taxpayer.legal_name == taxpayer.gstin:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "REGISTRATION_NOT_LOADED",
                "message": (
                    "this taxpayer is known only from an ingested return: the platform "
                    "has no legal name for them, and a notice addressed to a GSTIN is "
                    "defective. Load the registration before drafting."
                ),
                "gstin": taxpayer.gstin,
            },
        )

    demand = _demand_for(session, case)
    try:
        drafted = notices.draft(
            session,
            case_id=case.id,
            form=form,
            demand=demand,
            taxpayer={
                "gstin": taxpayer.gstin,
                "legal_name": taxpayer.legal_name,
                "trade_name": taxpayer.trade_name or taxpayer.legal_name,
            },
            narrative=body.narrative,
            generated_by=principal.officer_id,
            language=body.language,
        )
    except notices.ApprovalRefusedError as exc:
        # Limitation expired, or a s.128A amnesty period.  422: the request was
        # well-formed, the notice is simply not one that may issue.
        raise HTTPException(
            status_code=422, detail={"code": "MAY_NOT_ISSUE", "message": str(exc)}
        ) from exc
    except SlotError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "SLOT_ERROR", "message": str(exc)}
        ) from exc

    return drafted.as_dict()


@router.patch("/notices/{notice_id}/narrative")
def edit_notice_narrative(
    notice_id: str,
    body: Annotated[EditNarrative, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Replace the narrative.  Numeric slots are untouched and untouchable."""
    _notice_in_scope(session, principal, notice_id)
    try:
        edited = notices.edit_narrative(
            session, notice_id, narrative=body.narrative, edited_by=principal.officer_id
        )
    except notices.SlotLockedError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "SLOT_LOCKED", "message": str(exc)}
        ) from exc
    except SlotError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "SLOT_ERROR", "message": str(exc)}
        ) from exc
    return edited.as_dict()


@router.patch("/notices/{notice_id}/slots")
def edit_notice_slots(notice_id: str) -> Response:
    """There is no such operation, and saying so is the point.

    A figure on a notice is the figure the engine computed, addressed by its
    ``calc_id``.  If it is wrong, the rule or the data is wrong, and both are
    fixed upstream where the correction is recorded.
    """
    del notice_id
    raise HTTPException(
        status_code=422,
        detail={
            "code": "SLOT_LOCKED",
            "message": (
                "numeric slots cannot be edited. Correct the finding or the underlying "
                "data and re-draft; the figure on a notice is always a computed figure."
            ),
        },
    )


@router.post("/notices/{notice_id}/approve")
def approve_notice(
    notice_id: str,
    body: Annotated[ApproveNotice, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Maker-checker approval.  Rejected here, not hidden in the UI."""
    _notice_in_scope(session, principal, notice_id)
    if not principal.may_approve:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ROLE_MAY_NOT_APPROVE",
                "message": f"{principal.role} may draft but not approve",
            },
        )
    try:
        notice = notices.approve(
            session,
            notice_id,
            approved_by=principal.officer_id,
            office_code=body.office_code,
            issued_on=body.issued_on,
            sequence=body.sequence,
        )
    except notices.ApprovalRefusedError as exc:
        raise HTTPException(
            status_code=403, detail={"code": "MAKER_CHECKER", "message": str(exc)}
        ) from exc
    return {
        "notice_id": notice.id,
        "status": notice.status,
        "din": notice.din,
        "pdf_hash": notice.pdf_hash,
        "approved_by": notice.approved_by,
    }


@router.post("/notices/{notice_id}/serve")
def serve_notice(
    notice_id: str,
    body: Annotated[ServeNotice, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    _notice_in_scope(session, principal, notice_id)
    try:
        notice = notices.serve(
            session,
            notice_id,
            served_by=principal.officer_id,
            service_mode=body.service_mode,
            served_at=body.served_at,
        )
    except notices.ApprovalRefusedError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "NOT_APPROVED", "message": str(exc)}
        ) from exc
    return {
        "notice_id": notice.id,
        "status": notice.status,
        "served_at": notice.served_at.isoformat() if notice.served_at else None,
        "reply_due": notice.reply_due.isoformat() if notice.reply_due else None,
    }


@router.get("/notices/{notice_id}")
def read_notice(
    notice_id: str,
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """The notice as it stands, with every slot and the figure behind it."""
    notice = _notice_in_scope(session, principal, notice_id)
    return {
        "notice_id": notice.id,
        "case_id": notice.case_id,
        "form": notice.form,
        "language": notice.language,
        "status": notice.status,
        "din": notice.din,
        "pdf_hash": notice.pdf_hash,
        "generated_by": notice.generated_by,
        "approved_by": notice.approved_by,
        "reply_due": notice.reply_due.isoformat() if notice.reply_due else None,
        **notice.body_json,
    }


@router.get("/notices/{notice_id}/pdf")
def notice_pdf(notice_id: str, session: SessionDep, principal: PrincipalDep) -> Response:
    """Not implemented, and deliberately not faked.

    A Marathi notice is Devanagari, which the base PDF fonts cannot render; a
    PDF that silently drops the script would be worse than no PDF. The document
    text and its hash are available from ``GET /notices/{id}``, and the hash in
    the audit chain is computed over that text, so approval is already provable.
    """
    _notice_in_scope(session, principal, notice_id)
    return JSONResponse(
        status_code=501,
        content={
            "code": "NOT_IMPLEMENTED",
            "title": "PDF rendering",
            "status": "IN DEVELOPMENT",
            "roadmap_ref": "RM-08",
            "reason": (
                "Devanagari rendering needs an embedded font; the base PDF fonts would "
                "drop the Marathi text silently."
            ),
            "available_now": f"GET /notices/{notice_id} returns the document text and its hash",
        },
    )


@router.get("/notices")
def list_notices(
    session: SessionDep,
    principal: PrincipalDep,
    status: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Notices within the caller's jurisdiction, and no others."""
    stmt = select(Notice, Case).join(Case, Notice.case_id == Case.id)
    stmt = scoped(stmt, principal, Case.gstin)
    if status:
        stmt = stmt.where(Notice.status == status)

    items = []
    for notice, case in session.execute(stmt.order_by(Notice.created_at.desc())):
        items.append(
            {
                "notice_id": notice.id,
                "case_id": case.id,
                "gstin": case.gstin,
                "form": notice.form,
                "status": notice.status,
                "din": notice.din,
                "reply_due": notice.reply_due.isoformat() if notice.reply_due else None,
            }
        )
    return {"items": items, "scope": principal.describe_scope()}
