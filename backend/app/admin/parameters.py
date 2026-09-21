"""The parameter register: thresholds the department owns, in the database.

Until now every threshold lived in code as a working value, and the
``rule_parameter`` table -- the governance surface the schema was designed
around -- was never populated.  That made every figure in the platform correct
arithmetic on a number nobody had signed.

Three states, and the difference between them is what an officer relies on:

``PROVISIONAL``
    A working value shipped with the platform.  Nobody has adopted it.  It is
    enough to analyse with and not enough to demand on.

``DEPARTMENT``
    The department has set this value, and the register records who and when.
    Defensible as departmental policy; not a statutory citation.

``NOTIFIED``
    Backed by a notification, circular or rule, cited in ``notification_ref``.
    This is what a notice quotes.

A change never rewrites history.  Setting a value writes a **new row** with its
own ``effective_from`` and closes the previous one, because the engine resolves
a parameter as at the tax period under scrutiny: re-scrutinising FY 2019-20
must apply the FY 2019-20 threshold, whatever the department decided since.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from typing import Final

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import RuleParameter
from app.engine.params import DEFAULT_PARAMETERS, ParameterRow, ParameterSet

__all__ = [
    "STATUS_DEPARTMENT",
    "STATUS_NOTIFIED",
    "STATUS_PROVISIONAL",
    "adopt_all",
    "load_parameter_set",
    "seed_parameters",
    "set_parameter",
    "status_of",
]

STATUS_PROVISIONAL: Final[str] = "PROVISIONAL"
STATUS_DEPARTMENT: Final[str] = "DEPARTMENT"
STATUS_NOTIFIED: Final[str] = "NOTIFIED"


def status_of(row: RuleParameter) -> str:
    """What authority stands behind this value.

    Derived from the evidence rather than stored separately, so the status can
    never disagree with the citation it claims.
    """
    if row.notification_ref:
        return STATUS_NOTIFIED
    if not row.provisional and row.approved_by:
        return STATUS_DEPARTMENT
    return STATUS_PROVISIONAL


def _new_id() -> str:
    return str(uuid.uuid4())


def seed_parameters(session: Session) -> int:
    """Put the shipped working values into the register, once.

    They arrive ``PROVISIONAL``: the platform is stating what it is running on,
    not claiming anyone approved it. Rows already present are left alone, so
    this is safe to call on every start.
    """
    existing = {
        (row.rule_or_param_id, row.key, row.effective_from)
        for row in session.execute(select(RuleParameter)).scalars()
    }
    written = 0
    for row in DEFAULT_PARAMETERS:
        if (row.owner_id, row.key, row.effective_from) in existing:
            continue
        session.add(
            RuleParameter(
                id=_new_id(),
                rule_or_param_id=row.owner_id,
                key=row.key,
                value=row.value,
                value_type=row.value_type,
                unit=row.unit,
                effective_from=row.effective_from,
                effective_to=row.effective_to,
                notification_ref=row.notification_ref,
                source_note=row.source_note,
                approved_by=row.approved_by,
                provisional=row.provisional,
            )
        )
        written += 1
    session.flush()
    return written


def load_parameter_set(session: Session) -> ParameterSet:
    """The engine's parameters, as the register now holds them.

    Falls back to the shipped values when the register is empty -- a fresh
    database is usable before anyone has administered it -- and says which it
    used through ``ParameterSet.version``.
    """
    rows = session.execute(select(RuleParameter)).scalars().all()
    if not rows:
        return ParameterSet()

    approved = sum(1 for row in rows if status_of(row) != STATUS_PROVISIONAL)
    return ParameterSet(
        [
            ParameterRow(
                owner_id=row.rule_or_param_id,
                key=row.key,
                value=row.value,
                effective_from=row.effective_from,
                effective_to=row.effective_to,
                value_type=row.value_type,
                unit=row.unit,
                notification_ref=row.notification_ref,
                source_note=row.source_note,
                approved_by=row.approved_by,
                provisional=row.provisional,
            )
            for row in rows
        ],
        version=f"register-{approved}-of-{len(rows)}",
    )


def set_parameter(
    session: Session,
    *,
    owner_id: str,
    key: str,
    value: str,
    effective_from: date,
    approved_by: str,
    notification_ref: str | None = None,
    source_note: str | None = None,
    at: datetime | None = None,
) -> RuleParameter:
    """Set a threshold from a given date, superseding what came before.

    The previous row is closed the day before this one opens rather than
    deleted or edited. A run over an earlier period keeps resolving the value
    that was in force then, which is the whole reason the table is
    effective-dated.
    """
    current = [
        row
        for row in session.execute(
            select(RuleParameter).where(
                RuleParameter.rule_or_param_id == owner_id, RuleParameter.key == key
            )
        ).scalars()
        if row.effective_to is None or row.effective_to >= effective_from
    ]
    if not current:
        raise LookupError(f"no parameter {owner_id}.{key} in the register")

    superseded = None
    for row in current:
        if row.effective_from < effective_from:
            row.effective_to = date.fromordinal(effective_from.toordinal() - 1)
            superseded = row
        elif row.effective_from == effective_from:
            # Replacing a row that opens on the same day: close it entirely
            # rather than leaving two rows in force at once.
            row.effective_to = row.effective_from
            superseded = row

    created = RuleParameter(
        id=_new_id(),
        rule_or_param_id=owner_id,
        key=key,
        value=value,
        value_type=current[0].value_type,
        unit=current[0].unit,
        effective_from=effective_from,
        effective_to=None,
        notification_ref=notification_ref,
        source_note=source_note,
        approved_by=approved_by,
        approved_at=at or datetime.now(tz=UTC),
        supersedes_id=superseded.id if superseded else None,
        # A value someone set with their name against it is no longer a working
        # guess, whether or not a notification backs it yet.
        provisional=False,
    )
    session.add(created)
    session.flush()
    return created


def adopt_all(session: Session, *, approved_by: str, at: datetime | None = None) -> int:
    """Adopt every provisional working value as a departmental value.

    The figures do not change -- these are the numbers the platform has been
    running on. What changes is that the department now owns them: each row
    records who adopted it and when, and stops claiming to be an unsigned
    guess.

    A row already carrying a notification reference is left alone: a statutory
    citation outranks a departmental decision and must not be overwritten by
    one.
    """
    stamped = at or datetime.now(tz=UTC)
    adopted = 0
    for row in session.execute(select(RuleParameter)).scalars():
        if status_of(row) != STATUS_PROVISIONAL:
            continue
        row.provisional = False
        row.approved_by = approved_by
        row.approved_at = stamped
        row.source_note = (
            f"{row.source_note} · adopted as a departmental value"
            if row.source_note
            else "adopted as a departmental value"
        )
        adopted += 1
    session.flush()
    return adopted
