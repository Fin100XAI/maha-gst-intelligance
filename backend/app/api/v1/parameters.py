"""Administering the thresholds the engine runs on.

Every figure the platform produces rests on a number in this register. Until
the department sets those numbers, each one is a working value the platform
shipped with, and the provenance drawer says so beside every figure computed
from it.

Two operations change what the engine does, so both are audited and neither
mutates history:

* **Set** writes a new effective-dated row and closes the previous one. A run
  over an earlier period keeps resolving the value that was in force then.
* **Adopt** takes the provisional working values and records that the
  department owns them. The figures do not move; the authority behind them
  does.

A statutory citation outranks a departmental decision, so a row carrying a
notification reference is never overwritten by an adoption.
"""

from __future__ import annotations

from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.admin.parameters import (
    STATUS_NOTIFIED,
    STATUS_PROVISIONAL,
    adopt_all,
    seed_parameters,
    set_parameter,
    status_of,
)
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.audit.chain import append as audit_append
from app.db.models import RuleParameter
from app.security.rbac import Role

router = APIRouter(tags=["admin"])

SessionDep = Annotated[Session, Depends(get_session)]

#: Who may change a threshold. A threshold change moves every figure computed
#: from it, so it sits with the roles that answer for those figures.
_MAY_ADMINISTER = frozenset(
    {
        Role.ADDL_COMMISSIONER_ENFORCEMENT,
        Role.COMMISSIONER,
        Role.SYSTEMS_ADMIN,
    }
)


def _row(row: RuleParameter) -> dict[str, Any]:
    return {
        "id": row.id,
        "owner": row.rule_or_param_id,
        "key": row.key,
        "value": row.value,
        "value_type": row.value_type,
        "unit": row.unit,
        "effective_from": row.effective_from.isoformat(),
        "effective_to": row.effective_to.isoformat() if row.effective_to else None,
        "notification_ref": row.notification_ref,
        "source_note": row.source_note,
        "approved_by": row.approved_by,
        "approved_at": row.approved_at.isoformat() if row.approved_at else None,
        "status": status_of(row),
        "in_force": row.effective_to is None,
    }


@router.get("/admin/parameters")
def list_parameters(
    session: SessionDep,
    status: Annotated[str | None, Query()] = None,
    owner: Annotated[str | None, Query()] = None,
    in_force_only: Annotated[bool, Query()] = True,
) -> dict[str, Any]:
    """The register: every threshold, its value, and what stands behind it."""
    seed_parameters(session)

    stmt = select(RuleParameter)
    if owner:
        stmt = stmt.where(RuleParameter.rule_or_param_id == owner)
    rows = [
        _row(row)
        for row in session.execute(
            stmt.order_by(RuleParameter.rule_or_param_id, RuleParameter.key)
        ).scalars()
    ]
    if in_force_only:
        rows = [row for row in rows if row["in_force"]]
    if status:
        rows = [row for row in rows if row["status"] == status.upper()]

    counts: dict[str, int] = {}
    for row in rows:
        counts[str(row["status"])] = counts.get(str(row["status"]), 0) + 1

    return {
        "count": len(rows),
        "by_status": counts,
        "items": rows,
        "note": (
            "PROVISIONAL is a working value the platform shipped with and nobody has "
            "adopted. DEPARTMENT means the department set it, and the register names "
            "who. NOTIFIED means a notification backs it - that is what a notice "
            "quotes."
        ),
    }


class SetParameter(BaseModel):
    """A new value for a threshold, from a stated date."""

    value: str = Field(min_length=1)
    effective_from: date
    notification_ref: str | None = None
    source_note: str | None = None


@router.put("/admin/parameters/{owner}/{key}")
def put_parameter(
    owner: str,
    key: str,
    body: Annotated[SetParameter, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Set a threshold from a given date.

    This changes what the engine concludes for every period from that date
    onward. Earlier periods are untouched: the previous row is closed, not
    edited, so a re-run over FY 2019-20 still applies the FY 2019-20 value.
    """
    if principal.role not in _MAY_ADMINISTER:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ROLE_MAY_NOT_ADMINISTER",
                "message": (
                    f"{principal.role} may not change a threshold. A threshold change "
                    "moves every figure computed from it."
                ),
            },
        )

    seed_parameters(session)
    try:
        created = set_parameter(
            session,
            owner_id=owner,
            key=key,
            value=body.value,
            effective_from=body.effective_from,
            approved_by=principal.officer_id,
            notification_ref=body.notification_ref,
            source_note=body.source_note,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": str(exc)}
        ) from exc

    audit_append(
        session,
        actor=principal.officer_id,
        action="PARAMETER_SET",
        entity="rule_parameter",
        entity_id=created.id,
        after={"owner": owner, "key": key, "value": body.value},
        detail={
            "owner": owner,
            "key": key,
            "value": body.value,
            "effective_from": body.effective_from.isoformat(),
            "notification_ref": body.notification_ref,
            "status": status_of(created),
        },
    )
    session.flush()

    return {
        **_row(created),
        "note": (
            "Runs over periods from this date forward will use the new value. Earlier "
            "periods keep the value that was in force then."
        ),
    }


class Adopt(BaseModel):
    acknowledgement: str = Field(min_length=10)


@router.post("/admin/parameters/adopt")
def adopt(
    body: Annotated[Adopt, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Adopt every provisional working value as a departmental value.

    The numbers do not change. What changes is that the department owns them,
    with a name and a date against each. An acknowledgement is required in the
    body because this is a decision, not a button: after it, findings computed
    from these thresholds stop being flagged as resting on unsigned values.
    """
    if principal.role not in _MAY_ADMINISTER:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "ROLE_MAY_NOT_ADMINISTER",
                "message": f"{principal.role} may not adopt thresholds",
            },
        )

    seed_parameters(session)
    before = sum(
        1
        for row in session.execute(select(RuleParameter)).scalars()
        if status_of(row) == STATUS_PROVISIONAL
    )
    adopted = adopt_all(session, approved_by=principal.officer_id)

    audit_append(
        session,
        actor=principal.officer_id,
        action="PARAMETERS_ADOPTED",
        entity="rule_parameter",
        entity_id=None,
        after={"adopted": adopted},
        detail={
            "adopted": adopted,
            "provisional_before": before,
            "acknowledgement": body.acknowledgement,
        },
    )
    session.flush()

    remaining = [
        row
        for row in session.execute(select(RuleParameter)).scalars()
        if status_of(row) == STATUS_PROVISIONAL
    ]
    notified = [
        row
        for row in session.execute(select(RuleParameter)).scalars()
        if status_of(row) == STATUS_NOTIFIED
    ]

    return {
        "adopted": adopted,
        "adopted_by": principal.officer_id,
        "still_provisional": len(remaining),
        "notified": len(notified),
        "note": (
            f"{adopted} thresholds are now departmental values. The figures are "
            "unchanged; the authority behind them is recorded. Replacing a value with "
            "a notified one remains a separate act, per threshold."
        ),
    }
