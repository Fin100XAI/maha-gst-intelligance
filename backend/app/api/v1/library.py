"""S2 Rule & Parameter Library, S3 Admin, W5 Cases.

The library is the law officer's screen. It states, for every rule and every
parameter, what it tests, under which provision, and - the column that matters
- which of its thresholds are **provisional**, meaning the platform is using a
working value that no one has signed.

A provisional threshold is not a bug. Refusing to show which ones are
provisional would be.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.admin.parameters import STATUS_PROVISIONAL, seed_parameters, status_of
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.api.v1.workbench import taxpayer_in_scope
from app.canonical import UNCONFIGURED
from app.db.models import Case, Notice, RuleParameter, Taxpayer

# Importing the rule modules is what populates the registry.
from app.engine import (  # noqa: F401  - registration side effect
    rules_beh,
    rules_ewb,
    rules_itc,
    rules_net,
    rules_out,
    rules_pay,
)
from app.engine.params import DEFAULT_PARAMETERS
from app.engine.params_p01_p34 import EXTERNAL_PARAMS, PARAMETERS
from app.engine.registry import RULES
from app.security.rbac import scoped

router = APIRouter(tags=["library"])

SessionDep = Annotated[Session, Depends(get_session)]


# ---------------------------------------------------------------------------
# S2 -- the rule and parameter library
# ---------------------------------------------------------------------------


@router.get("/library/rules")
def rules(
    family: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Every detection rule, with its legal basis and its threshold note."""
    items = [
        {
            "rule_id": spec.id,
            "title": spec.title,
            "family": spec.family,
            "dimension": spec.dimension.value,
            "legal_basis": spec.legal_basis,
            "severity": spec.severity.value,
            "confidence": spec.confidence.value,
            "requires": list(spec.requires),
            "parameters": list(spec.params),
            "relates_to": list(spec.relates_to),
            "suggested_form": spec.suggested_form.value if spec.suggested_form else None,
            "threshold_note": spec.threshold_note,
        }
        for spec in RULES.values()
        if family is None or spec.family == family
    ]
    return {
        "count": len(items),
        "families": sorted({spec.family for spec in RULES.values()}),
        "items": sorted(items, key=lambda item: str(item["rule_id"])),
    }


@router.get("/library/parameters")
def parameters() -> dict[str, Any]:
    """The 34 audit risk parameters, with their action points verbatim.

    The action point is quoted rather than paraphrased: it is what an officer
    is expected to do, and a paraphrase of an instruction is a different
    instruction.
    """
    return {
        "count": len(PARAMETERS),
        "items": [
            {
                "param_id": spec.id,
                "title": spec.title,
                # `spec.metric` is the function that computes the value; the
                # screen wants its name, not the callable.
                "metric": getattr(spec.metric, "__name__", str(spec.metric)),
                "metric_description": spec.metric_description,
                "banding": spec.banding.value,
                "direction": spec.direction,
                "weight": format(spec.weight, "f"),
                "action_point": spec.action_point,
                "data_sources": list(spec.data_sources),
                "requires": list(spec.requires),
                "external_feed": spec.external_feed,
                "roadmap_ref": spec.roadmap_ref,
                "related_rules": list(spec.related_rules),
                "excluded_from_score": spec.id in EXTERNAL_PARAMS,
            }
            for spec in PARAMETERS.values()
        ],
        "note": (
            f"{len(EXTERNAL_PARAMS)} parameters depend on a feed the platform does not "
            "have yet. They report NOT_EVALUATED and are excluded from both the "
            "numerator and the denominator of the P-Score, never scored as Flag 0."
        ),
    }


@router.get("/library/thresholds")
def thresholds() -> dict[str, Any]:
    """Every effective-dated threshold, and whether it has been signed.

    ``provisional`` means the platform is running on a working value. The law
    officer's job is to replace each one with a notification reference; until
    then every figure computed from it says so in the provenance drawer.
    """
    items = [
        {
            "owner": row.owner_id,
            "key": row.key,
            # The stored value is already a string: a threshold is carried
            # exactly as written, and coercing it here would lose the
            # distinction between "20" and "20.00".
            "value": row.value,
            "value_type": row.value_type,
            "unit": row.unit,
            "effective_from": row.effective_from.isoformat() if row.effective_from else None,
            "effective_to": row.effective_to.isoformat() if row.effective_to else None,
            "notification_ref": row.notification_ref,
            "provisional": row.provisional,
            "note": row.source_note,
        }
        for row in DEFAULT_PARAMETERS
    ]
    provisional = [item for item in items if item["provisional"]]
    return {
        "count": len(items),
        "provisional_count": len(provisional),
        "items": sorted(items, key=lambda item: (str(item["owner"]), str(item["key"]))),
        "note": (
            f"{len(provisional)} of {len(items)} thresholds are provisional: a working "
            "value with no notification reference behind it. Every figure computed from "
            "one is marked in its provenance drawer."
        ),
    }


# ---------------------------------------------------------------------------
# S3 -- admin: what the platform knows it does not know
# ---------------------------------------------------------------------------


@router.get("/admin/gaps")
def gaps(session: SessionDep) -> dict[str, Any]:
    """Every statutory gap, unadopted threshold and dark parameter, in one place.

    This screen exists so that "the platform does not know" is a fact someone
    owns, rather than a surprise discovered in an appellate forum.

    The threshold count comes from the register, not from the values the
    platform shipped with. It used to read the shipped constants, so after the
    department adopted all 106 the tile still said 106 were awaiting adoption
    while the register two inches below it said none were. A screen whose job
    is to report what is unresolved must not be the thing that is out of date.
    """
    seed_parameters(session)
    # Only rows still in force. Editing a threshold closes the previous row
    # rather than overwriting it, so the superseded value stays in the table
    # for the re-run of an earlier year -- but it is history, not something
    # awaiting anybody's adoption, and counting it here made this tile
    # disagree with the register by one for every threshold ever changed.
    registered = [
        row for row in session.execute(select(RuleParameter)).scalars() if row.effective_to is None
    ]
    provisional = [row for row in registered if status_of(row) == STATUS_PROVISIONAL]
    dark = [PARAMETERS[key] for key in EXTERNAL_PARAMS if key in PARAMETERS]

    return {
        "unconfigured_statutory": {
            "count": len(UNCONFIGURED),
            "items": [
                {
                    "parameter_id": entry.parameter_id,
                    "missing": entry.missing,
                    "todo_ref": entry.todo_ref,
                    "status": "AWAITING_STATUTORY_CONFIRMATION",
                }
                for entry in UNCONFIGURED
            ],
            "note": (
                "A date, rate or form number that docs/01 does not state. The platform "
                "raises rather than guessing, so a rule that needs one cannot run."
            ),
        },
        "provisional_thresholds": {
            "count": len(provisional),
            "items": [
                {
                    "owner": row.rule_or_param_id,
                    "key": row.key,
                    "value": row.value,
                    "value_type": row.value_type,
                    "effective_from": row.effective_from.isoformat()
                    if row.effective_from
                    else None,
                    "note": row.source_note,
                }
                for row in provisional
            ],
            "note": (
                "A working value nobody has adopted. Findings computed from one are valid "
                "arithmetic on an unsigned number. Adopting them changes no figure; it "
                "records who owns them."
            ),
        },
        "dark_parameters": {
            "count": len(dark),
            "items": [
                {
                    "param_id": spec.id,
                    "title": spec.title,
                    "external_feed": spec.external_feed,
                    "roadmap_ref": spec.roadmap_ref,
                }
                for spec in dark
            ],
            "note": (
                "Excluded from both sides of the P-Score. Each one is an integration "
                "that would widen coverage, and the count is the business case for it."
            ),
        },
    }


# ---------------------------------------------------------------------------
# W5 -- cases
# ---------------------------------------------------------------------------


@router.get("/cases")
def list_cases(
    session: SessionDep,
    principal: PrincipalDep,
    status: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Cases in the caller's jurisdiction, with the limitation clock on each."""
    stmt = select(Case)
    stmt = scoped(stmt, principal, Case.gstin)
    if status:
        stmt = stmt.where(Case.status == status)

    items: list[dict[str, Any]] = []
    for case in session.execute(stmt.order_by(Case.opened_at.desc())).scalars():
        taxpayer = session.get(Taxpayer, case.gstin)
        notices = session.execute(select(Notice).where(Notice.case_id == case.id)).scalars().all()
        items.append(
            {
                "case_id": case.id,
                "gstin": case.gstin,
                "legal_name": taxpayer.legal_name if taxpayer else None,
                "division": taxpayer.division if taxpayer else None,
                "fy": case.fy,
                "type": case.type,
                "status": case.status,
                "officer_id": case.officer_id,
                "finding_count": len(case.finding_ids),
                "section_applied": case.section_applied,
                "scn_deadline": case.scn_deadline.isoformat() if case.scn_deadline else None,
                "order_deadline": case.order_deadline.isoformat() if case.order_deadline else None,
                "days_to_limitation": case.days_to_limitation,
                "notices": [
                    {"notice_id": n.id, "form": n.form, "status": n.status, "din": n.din}
                    for n in notices
                ],
                "href": f"/workbench/cases/{case.id}",
            }
        )

    return {
        "count": len(items),
        "items": items,
        "scope": principal.describe_scope(),
        "note": (
            "The limitation clock is recomputed nightly. A case whose order deadline "
            "has passed can no longer be adjudicated, whatever its merits."
        ),
    }


@router.get("/cases/{case_id}")
def read_case(
    case_id: str,
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    case = session.get(Case, case_id)
    if case is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such case"}
        )
    taxpayer = taxpayer_in_scope(session, principal, case.gstin)
    notices = session.execute(select(Notice).where(Notice.case_id == case.id)).scalars().all()

    return {
        "case_id": case.id,
        "gstin": case.gstin,
        "legal_name": taxpayer.legal_name,
        "fy": case.fy,
        "type": case.type,
        "status": case.status,
        "officer_id": case.officer_id,
        "finding_ids": list(case.finding_ids),
        "periods": list(case.periods),
        "notices": [
            {
                "notice_id": n.id,
                "form": n.form,
                "status": n.status,
                "din": n.din,
                "reply_due": n.reply_due.isoformat() if n.reply_due else None,
            }
            for n in notices
        ],
        "href": f"/workbench/cases/{case.id}",
    }
