"""Roles, scope, and the mandatory jurisdiction predicate.

**RBAC is enforced at the query layer.**  Not in the UI, not in a decorator that
a new endpoint can forget.  :func:`scoped` takes a SELECT over a table carrying
a GSTIN and returns it narrowed to what the caller may see; an endpoint that
does not call it does not compile past review, and :func:`assert_in_scope`
answers a direct GSTIN lookup.

**An out-of-scope GSTIN returns 404, not 403.**  403 confirms the registration
exists, which is itself a disclosure: an officer in Nagpur must not be able to
probe whether a Pune taxpayer is under scrutiny.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Final, TypeVar

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models import Taxpayer

__all__ = [
    "OutOfScopeError",
    "Principal",
    "Role",
    "assert_in_scope",
    "scoped",
    "visible_gstins",
]


class Role(StrEnum):
    """docs/02 section 10.  Ordered from narrowest to widest."""

    INSPECTOR = "INSPECTOR"
    STO = "STO"
    ASST_COMMISSIONER = "ASST_COMMISSIONER"
    DEPUTY_JOINT_COMMISSIONER = "DEPUTY_JOINT_COMMISSIONER"
    ADDL_COMMISSIONER_ENFORCEMENT = "ADDL_COMMISSIONER_ENFORCEMENT"
    #: docs/03 section 0: the Commissioner's dashboard is the whole thesis, so
    #: the role exists here even though docs/02 section 10 lists the field
    #: hierarchy only.
    COMMISSIONER = "COMMISSIONER"
    SYSTEMS_ADMIN = "SYSTEMS_ADMIN"
    AUDITOR = "AUDITOR"
    ANALYTICS = "ANALYTICS"


#: Who may generate a notice draft.
MAY_DRAFT: Final[frozenset[Role]] = frozenset(
    {Role.INSPECTOR, Role.STO, Role.ASST_COMMISSIONER, Role.DEPUTY_JOINT_COMMISSIONER}
)

#: Who may approve one.  An Inspector may draft but never approve: the checker
#: must outrank the maker.
MAY_APPROVE: Final[frozenset[Role]] = frozenset(
    {
        Role.ASST_COMMISSIONER,
        Role.DEPUTY_JOINT_COMMISSIONER,
        Role.ADDL_COMMISSIONER_ENFORCEMENT,
        Role.COMMISSIONER,
    }
)

#: Read-only roles.  Analytics additionally never sees an identifier.
READ_ONLY: Final[frozenset[Role]] = frozenset({Role.AUDITOR, Role.ANALYTICS})

#: Roles that may never see a GSTIN, PAN, name or any other identifier.
DEIDENTIFIED: Final[frozenset[Role]] = frozenset({Role.ANALYTICS})

#: Roles whose scope is the whole State rather than a division or a range.
STATE_WIDE: Final[frozenset[Role]] = frozenset(
    {
        Role.ADDL_COMMISSIONER_ENFORCEMENT,
        Role.COMMISSIONER,
        Role.SYSTEMS_ADMIN,
        Role.AUDITOR,
        Role.ANALYTICS,
    }
)


class OutOfScopeError(LookupError):
    """The subject is outside the caller's jurisdiction.

    Raised -- and rendered as 404 -- rather than a 403, which would confirm
    that the registration exists.
    """


@dataclass(frozen=True, slots=True)
class Principal:
    """The authenticated caller, as the State SSO describes them."""

    officer_id: str
    role: Role
    #: The commissionerates, divisions and ranges this officer covers.  Empty
    #: for a State-wide role; never empty for a field role -- an officer with no
    #: jurisdiction sees nothing, which is the safe failure.
    commissionerates: frozenset[str] = field(default_factory=frozenset)
    divisions: frozenset[str] = field(default_factory=frozenset)
    ranges: frozenset[str] = field(default_factory=frozenset)
    #: Set only when the officer's scope is their own assigned taxpayers.
    own_taxpayers_only: bool = False
    #: Force de-identification on for a role that would not otherwise have it.
    #: Analytics is de-identified by its role and needs no flag; see
    #: :attr:`deidentified`.
    force_deidentified: bool = False

    @property
    def state_wide(self) -> bool:
        return self.role in STATE_WIDE

    @property
    def may_draft(self) -> bool:
        return self.role in MAY_DRAFT

    @property
    def may_approve(self) -> bool:
        return self.role in MAY_APPROVE

    @property
    def read_only(self) -> bool:
        return self.role in READ_ONLY

    @property
    def deidentified(self) -> bool:
        """Whether this caller may see an identifier at all.

        Derived from the role rather than set by the caller.  Analytics is
        de-identified by definition, and a security property that depends on
        somebody remembering to pass a flag is a property that will eventually
        not hold.
        """
        return self.role in DEIDENTIFIED or self.force_deidentified

    def describe_scope(self) -> str:
        """What the caller is looking at, for the header strip and the audit log."""
        if self.state_wide:
            return "State-wide"
        parts = [
            *sorted(self.commissionerates),
            *sorted(self.divisions),
            *sorted(self.ranges),
        ]
        if self.own_taxpayers_only:
            parts.append(f"assigned to {self.officer_id}")
        return " · ".join(parts) if parts else "no jurisdiction assigned"


def _predicate(principal: Principal) -> list[object]:
    """The jurisdiction predicate, as a list of SQLAlchemy criteria.

    A State-wide role gets an empty list.  Every other role gets at least one
    criterion, so a field officer can never issue an unfiltered query.
    """
    if principal.state_wide:
        return []

    clauses: list[object] = []
    if principal.commissionerates:
        clauses.append(Taxpayer.commissionerate.in_(sorted(principal.commissionerates)))
    if principal.divisions:
        clauses.append(Taxpayer.division.in_(sorted(principal.divisions)))
    if principal.ranges:
        clauses.append(Taxpayer.range_office.in_(sorted(principal.ranges)))
    if principal.own_taxpayers_only:
        clauses.append(Taxpayer.officer_id == principal.officer_id)

    if not clauses:
        # No jurisdiction assigned.  Show nothing rather than everything: a
        # misconfigured account must fail closed.
        clauses.append(Taxpayer.gstin.is_(None))
    return clauses


def visible_gstins(principal: Principal) -> Select[tuple[str]]:
    """A sub-select of every GSTIN the caller may see."""
    stmt = select(Taxpayer.gstin)
    for clause in _predicate(principal):
        stmt = stmt.where(clause)  # type: ignore[arg-type]
    return stmt


#: Deployment is Python 3.11, where PEP 695 type parameter lists do not parse.
_Row = TypeVar("_Row", bound=tuple[object, ...])


def scoped(stmt: Select[_Row], principal: Principal, gstin_column: object) -> Select[_Row]:
    """Narrow ``stmt`` to the caller's jurisdiction.

    ``gstin_column`` is the GSTIN column of whatever table the statement reads,
    so this works for findings, cases, notices and scores alike without any of
    them needing a jurisdiction column of their own.
    """
    if principal.state_wide:
        return stmt
    return stmt.where(gstin_column.in_(visible_gstins(principal)))  # type: ignore[attr-defined]


def assert_in_scope(session: Session, principal: Principal, gstin: str) -> Taxpayer:
    """Resolve a GSTIN, or raise :class:`OutOfScopeError`.

    The same exception is raised whether the GSTIN is outside the caller's
    jurisdiction or does not exist at all.  That is deliberate: the caller must
    not be able to tell the two apart.
    """
    stmt = select(Taxpayer).where(Taxpayer.gstin == gstin)
    for clause in _predicate(principal):
        stmt = stmt.where(clause)  # type: ignore[arg-type]
    taxpayer = session.execute(stmt).scalars().one_or_none()
    if taxpayer is None:
        raise OutOfScopeError(gstin)
    return taxpayer
