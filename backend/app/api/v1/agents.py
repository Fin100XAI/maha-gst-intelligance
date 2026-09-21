"""W7 - Copilot, and the agent log.

The agent layer is optional by design.  Every figure on every screen is
computed without a model, so a deployment with no model configured is fully
usable and this endpoint answers **501 naming what is missing** rather than
degrading into something that looks like an answer.

Nothing here reimplements the guarantees in :mod:`app.agents`: the prompt is
pseudonymised there, the completion is grounded there, and the call is logged
there whether it passed or failed.  This module is the HTTP surface and the
jurisdiction check, and it adds one thing of its own - a refusal to answer
about a taxpayer the caller may not see, checked before the pseudonym is
minted, so an out-of-scope GSTIN never reaches a prompt at all.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.base import invoke
from app.agents.catalogue import AGENTS, agent_for
from app.agents.fidelity import FidelityError
from app.agents.provider import LLMUnavailableError, build_provider
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.api.v1.workbench import taxpayer_in_scope
from app.db.models import AgentCall
from app.security.pseudonymise import LeakDetectedError, Pseudonymiser

router = APIRouter(tags=["agents"])

SessionDep = Annotated[Session, Depends(get_session)]


class Ask(BaseModel):
    """A question for an agent, about at most a few named taxpayers."""

    question: str = Field(min_length=3, max_length=2000)
    #: The taxpayers the agent may read. Each is checked against the caller's
    #: jurisdiction before a pseudonym is minted for it.
    gstins: list[str] = Field(default_factory=list, max_length=10)
    case_id: str | None = None


@router.get("/agents")
def list_agents() -> dict[str, Any]:
    """The six agents, and what each is allowed to read."""
    return {
        "count": len(AGENTS),
        "items": [
            {
                "key": spec.key,
                "title": spec.title,
                "tools": [
                    {"name": tool.name, "description": tool.description} for tool in spec.tools
                ],
                "allows_ungrounded_numbers": spec.allows_ungrounded_numbers,
            }
            for spec in AGENTS.values()
        ],
        "guarantees": [
            "No agent has a tool that performs arithmetic.",
            "Every completion is scanned; a number that is not in that call's tool "
            "results and carries no calc_id fails the response.",
            "The drafting model never sees numeric slot syntax.",
            "Prompts carry a pseudonymous reference, never a GSTIN, PAN or trade name.",
        ],
    }


@router.post("/agents/{agent_key}")
def ask(
    agent_key: str,
    body: Annotated[Ask, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> Any:
    """Put a question to an agent.

    Returns 501 when no model is configured, 403 when the role may not use the
    agent layer, 404 when a named taxpayer is outside the caller's
    jurisdiction, and 422 when the model's answer contained a figure it could
    not have been given.
    """
    try:
        spec = agent_for(agent_key)
    except LookupError as exc:
        raise HTTPException(
            status_code=404,
            detail={"code": "UNKNOWN_AGENT", "message": str(exc)},
        ) from exc

    if principal.deidentified:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "DEIDENTIFIED_ROLE",
                "message": "the analytics role sees no identifiers and may not use agents",
            },
        )

    # Jurisdiction first, before a pseudonym exists for the subject: an
    # out-of-scope GSTIN must never reach a prompt, not even masked.
    masker = Pseudonymiser()
    subject_ref: str | None = None
    for gstin in body.gstins:
        taxpayer = taxpayer_in_scope(session, principal, gstin)
        label = masker.label(gstin, display_name=taxpayer.legal_name)
        masker.register_name(gstin, taxpayer.trade_name)
        subject_ref = subject_ref or label

    try:
        provider = build_provider()
    except LLMUnavailableError as exc:
        return JSONResponse(
            status_code=501,
            content={
                "code": "NO_MODEL_CONFIGURED",
                "message": str(exc),
                "roadmap_ref": "RM-10",
                "available_now": (
                    "Every figure this agent would quote is already computed and "
                    "drillable without a model."
                ),
            },
        )

    tool_args = {tool.name: {"gstin": gstin} for tool in spec.tools for gstin in body.gstins[:1]}

    try:
        result = invoke(
            session,
            spec,
            provider=provider,
            officer_id=principal.officer_id,
            task=body.question,
            masker=masker,
            tool_args=tool_args,
            case_id=body.case_id,
            subject_ref=subject_ref,
        )
    except LeakDetectedError as exc:
        # The prompt-building code is wrong. Refusing is the honest failure;
        # scrubbing and continuing would hide a disclosure bug.
        raise HTTPException(
            status_code=500,
            detail={"code": "LEAK_DETECTED", "message": str(exc)},
        ) from exc
    except FidelityError as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "NUMERIC_FIDELITY_FAILED",
                "message": (
                    "The model produced a figure that was not in its tool results and "
                    "carried no calc_id. The response was rejected and the attempt is "
                    "in the agent log."
                ),
                "untraceable": [
                    {"value": item.value, "context": item.context}
                    for item in exc.report.untraceable
                ],
            },
        ) from exc
    except LLMUnavailableError as exc:
        raise HTTPException(
            status_code=502,
            detail={"code": "MODEL_UNAVAILABLE", "message": str(exc)},
        ) from exc

    return result.as_dict()


@router.get("/agents/calls")
def calls(
    session: SessionDep,
    principal: PrincipalDep,
    agent: Annotated[str | None, Query()] = None,
    failed_only: Annotated[bool, Query()] = False,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> dict[str, Any]:
    """The agent log: every invocation, including the rejected ones.

    A rejected completion is kept deliberately. An agent that tried to invent a
    figure is exactly what a reviewer needs to see, and a log that held only
    the successes would be evidence of nothing.
    """
    stmt = select(AgentCall).order_by(AgentCall.at.desc()).limit(limit)
    if agent:
        stmt = stmt.where(AgentCall.agent == agent)
    if failed_only:
        stmt = stmt.where(AgentCall.fidelity_ok.is_(False))

    rows = session.execute(stmt).scalars().all()
    return {
        "count": len(rows),
        "items": [
            {
                "call_id": row.id,
                "at": row.at.isoformat(),
                "agent": row.agent,
                "officer_id": row.officer_id,
                "case_id": row.case_id,
                "subject_ref": row.subject_ref,
                "provider": row.provider,
                "model": row.model,
                # The stored prompt is the pseudonymised one: this log is
                # evidence of what was disclosed, not a second copy of it.
                "prompt": row.prompt,
                "completion": row.completion,
                "tool_calls": row.tool_calls,
                "prompt_tokens": row.prompt_tokens,
                "completion_tokens": row.completion_tokens,
                "cost_inr": format(row.cost_inr, "f") if row.cost_inr is not None else None,
                "latency_ms": row.latency_ms,
                "fidelity_ok": row.fidelity_ok,
                "fidelity_detail": row.fidelity_detail,
            }
            for row in rows
        ],
        "scope": principal.describe_scope(),
        "note": (
            "Prompts here carry pseudonymous references only. A call whose completion "
            "failed the fidelity check is kept, not discarded."
        ),
    }
