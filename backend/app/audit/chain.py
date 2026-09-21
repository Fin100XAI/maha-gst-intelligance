"""The hash-chained, append-only audit log.

Every officer action that touches taxpayer data lands here, and every entry
carries the hash of the entry before it.  Deleting a row, reordering rows or
editing a field in place all break the chain, and :func:`verify_chain` names the
sequence number where it broke.

The chain matters most at one moment: an approved notice PDF's hash enters it at
approval, so the department can prove in an appellate forum that the document
served is the document that was approved.

Gate G11 verifies the chain from genesis on every build.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Final

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.db.models import AuditLog

__all__ = [
    "GENESIS_HASH",
    "ChainBrokenError",
    "ChainVerification",
    "append",
    "canonical_json",
    "chain_hash_for",
    "hash_record",
    "verify_chain",
]

#: The anchor the first entry chains to.  Changing this string invalidates every
#: existing chain, which is the point: it is a version marker for the scheme.
GENESIS_HASH: Final[str] = hashlib.sha256(b"GST-DRISHTI-AUDIT-GENESIS-v1").hexdigest()

#: The fields that are bound into the chain.  Adding a field here is a breaking
#: change to every stored chain and needs a documented migration.
CHAINED_FIELDS: Final[tuple[str, ...]] = (
    "seq",
    "at",
    "actor",
    "action",
    "entity",
    "entity_id",
    "before_hash",
    "after_hash",
    "ip",
    "detail",
)


class ChainBrokenError(RuntimeError):
    """The audit chain failed verification."""

    def __init__(self, seq: int, reason: str) -> None:
        self.seq = seq
        self.reason = reason
        super().__init__(f"audit chain broken at seq {seq}: {reason}")


def _encode(value: Any) -> Any:
    """Make Decimals, dates and enums canonical rather than lossy.

    Decimal goes to its string form, never through a float, so a hash computed
    today matches one computed after a round-trip through the database.
    """
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, datetime):
        # Normalise to a UTC instant.  Some drivers (SQLite) hand back a naive
        # datetime for a column stored as UTC, so hashing the *representation*
        # would break a chain that nobody tampered with.  A naive value is read
        # as UTC, which is the only thing this application ever stores.
        moment = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
        return moment.astimezone(UTC).isoformat(timespec="microseconds")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, bytes):
        return value.hex()
    raise TypeError(f"{type(value).__name__} is not canonically serialisable")


def canonical_json(payload: Any) -> str:
    """Deterministic JSON: sorted keys, no incidental whitespace, stable escapes."""
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        default=_encode,
    )


def hash_record(payload: Any | None) -> str | None:
    """sha256 over the canonical form of a record, or ``None`` for no record."""
    if payload is None:
        return None
    return hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def chain_hash_for(previous_chain_hash: str, entry: dict[str, Any]) -> str:
    """The chain hash of an entry, given the hash of the entry before it."""
    missing = [field for field in CHAINED_FIELDS if field not in entry]
    if missing:
        raise ValueError(f"entry is missing chained field(s): {missing}")
    body = {field: entry[field] for field in CHAINED_FIELDS}
    material = f"{previous_chain_hash}|{canonical_json(body)}"
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def _last_entry(session: Session) -> AuditLog | None:
    statement = select(AuditLog).order_by(AuditLog.seq.desc()).limit(1)
    # Serialise concurrent appends so two writers cannot claim one seq.  SQLite
    # has no row locks and no concurrent writers, so it is skipped there.
    if session.get_bind().dialect.name != "sqlite":
        statement = statement.with_for_update()
    return session.execute(statement).scalars().first()


def append(
    session: Session,
    *,
    actor: str,
    action: str,
    entity: str,
    entity_id: str | None = None,
    before: Any | None = None,
    after: Any | None = None,
    ip: str | None = None,
    detail: dict[str, Any] | None = None,
    at: datetime | None = None,
) -> AuditLog:
    """Append one entry, chaining it to the current tail.

    ``at`` may be injected so that a test, a replay or a seed run is
    deterministic; it defaults to the wall clock for real traffic.
    """
    previous = _last_entry(session)
    seq = previous.seq + 1 if previous is not None else 1
    previous_hash = previous.chain_hash if previous is not None else GENESIS_HASH

    entry: dict[str, Any] = {
        "seq": seq,
        "at": at if at is not None else utcnow(),
        "actor": actor,
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "before_hash": hash_record(before),
        "after_hash": hash_record(after),
        "ip": ip,
        "detail": detail or {},
    }

    row = AuditLog(**entry, chain_hash=chain_hash_for(previous_hash, entry))
    session.add(row)
    session.flush()
    return row


@dataclass(frozen=True, slots=True)
class ChainVerification:
    """The result of walking the chain from genesis."""

    ok: bool
    entries: int
    broken_at: int | None = None
    reason: str | None = None

    def raise_for_status(self) -> None:
        if not self.ok:
            raise ChainBrokenError(self.broken_at or 0, self.reason or "unknown")


def verify_chain(session: Session, *, strict_sequence: bool = True) -> ChainVerification:
    """Recompute every chain hash from genesis and report the first break.

    Detects three tampering shapes: an edited field (hash mismatch), a deleted
    entry (sequence gap) and a reordered entry (predecessor mismatch).
    """
    rows = session.execute(select(AuditLog).order_by(AuditLog.seq.asc())).scalars().all()

    previous_hash = GENESIS_HASH
    expected_seq = 1
    for row in rows:
        if strict_sequence and row.seq != expected_seq:
            return ChainVerification(
                ok=False,
                entries=len(rows),
                broken_at=row.seq,
                reason=f"sequence gap: expected {expected_seq}, found {row.seq}",
            )

        entry = {field: getattr(row, field) for field in CHAINED_FIELDS}
        recomputed = chain_hash_for(previous_hash, entry)
        if recomputed != row.chain_hash:
            return ChainVerification(
                ok=False,
                entries=len(rows),
                broken_at=row.seq,
                reason=f"chain hash mismatch: stored {row.chain_hash[:12]}..., "
                f"recomputed {recomputed[:12]}...",
            )

        previous_hash = row.chain_hash
        expected_seq = row.seq + 1

    return ChainVerification(ok=True, entries=len(rows))
