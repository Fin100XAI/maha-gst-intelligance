"""Gate G11 -- the audit chain verifies from genesis, and breaks when tampered with.

A chain that cannot detect tampering is decoration.  These tests therefore spend
most of their effort breaking it in the three ways it can actually be broken:
editing a field, deleting an entry, and reordering entries.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.chain import (
    GENESIS_HASH,
    ChainBrokenError,
    append,
    canonical_json,
    chain_hash_for,
    hash_record,
    verify_chain,
)
from app.db.models import AuditLog

AT = datetime(2026, 9, 20, 10, 30, tzinfo=UTC)


def _three_entries(session: Session) -> None:
    append(session, actor="sto.pune.1", action="VIEW", entity="taxpayer", entity_id="27X", at=AT)
    append(
        session,
        actor="sto.pune.1",
        action="UPDATE",
        entity="finding",
        entity_id="f-1",
        before={"status": "TRIGGERED"},
        after={"status": "ACCEPTED"},
        at=AT,
    )
    append(session, actor="ac.pune", action="APPROVE", entity="notice", entity_id="n-1", at=AT)


def test_an_empty_chain_verifies(session: Session) -> None:
    result = verify_chain(session)
    assert result.ok is True
    assert result.entries == 0


def test_the_chain_verifies_from_genesis(session: Session) -> None:
    _three_entries(session)
    result = verify_chain(session)
    assert result.ok is True
    assert result.entries == 3
    result.raise_for_status()


def test_sequence_starts_at_one_and_is_contiguous(session: Session) -> None:
    _three_entries(session)
    rows = session.execute(select(AuditLog).order_by(AuditLog.seq)).scalars().all()
    assert [row.seq for row in rows] == [1, 2, 3]


def test_the_first_entry_chains_to_genesis(session: Session) -> None:
    row = append(session, actor="a", action="X", entity="e", at=AT)
    entry = {
        "seq": 1,
        "at": AT,
        "actor": "a",
        "action": "X",
        "entity": "e",
        "entity_id": None,
        "before_hash": None,
        "after_hash": None,
        "ip": None,
        "detail": {},
    }
    assert row.chain_hash == chain_hash_for(GENESIS_HASH, entry)


def test_before_and_after_hashes_record_the_change_without_the_payload(
    session: Session,
) -> None:
    row = append(
        session,
        actor="a",
        action="UPDATE",
        entity="finding",
        before={"status": "TRIGGERED"},
        after={"status": "ACCEPTED"},
        at=AT,
    )
    assert row.before_hash == hash_record({"status": "TRIGGERED"})
    assert row.after_hash == hash_record({"status": "ACCEPTED"})
    assert row.before_hash != row.after_hash


@pytest.mark.golden
def test_editing_a_field_in_place_breaks_the_chain(session: Session) -> None:
    _three_entries(session)
    target = session.get(AuditLog, 2)
    assert target is not None
    target.actor = "someone.else"
    session.flush()

    result = verify_chain(session)
    assert result.ok is False
    assert result.broken_at == 2
    assert "mismatch" in (result.reason or "")
    with pytest.raises(ChainBrokenError):
        result.raise_for_status()


@pytest.mark.golden
def test_deleting_an_entry_breaks_the_chain(session: Session) -> None:
    _three_entries(session)
    session.delete(session.get(AuditLog, 2))
    session.flush()

    result = verify_chain(session)
    assert result.ok is False
    assert result.broken_at == 3
    assert "sequence gap" in (result.reason or "")


@pytest.mark.golden
def test_reordering_entries_breaks_the_chain(session: Session) -> None:
    _three_entries(session)
    second, third = session.get(AuditLog, 2), session.get(AuditLog, 3)
    assert second is not None and third is not None
    second.chain_hash, third.chain_hash = third.chain_hash, second.chain_hash
    session.flush()

    assert verify_chain(session).ok is False


def test_truncating_the_tail_still_verifies(session: Session) -> None:
    """Removing the newest entries leaves a valid prefix.  Detecting that needs
    an external anchor, not the chain -- say so rather than implying otherwise."""
    _three_entries(session)
    session.delete(session.get(AuditLog, 3))
    session.flush()
    assert verify_chain(session).ok is True


# ---------------------------------------------------------------------------
# canonicalisation
# ---------------------------------------------------------------------------


def test_canonical_json_is_key_order_independent() -> None:
    assert canonical_json({"b": 1, "a": 2}) == canonical_json({"a": 2, "b": 1})


def test_decimals_hash_through_their_string_form_not_a_float() -> None:
    """A hash computed before a database round-trip must match one computed
    after it, so money is canonicalised as text."""
    assert canonical_json({"tax": Decimal("38.42")}) == '{"tax":"38.42"}'
    # A Decimal and its own string form are the same material, so a hash taken
    # before a database round-trip matches one taken after it.
    assert hash_record({"tax": Decimal("38.42")}) == hash_record({"tax": "38.42"})
    # Trailing zeros are significant in Decimal and stay significant here,
    # rather than being normalised away behind the officer's back.
    assert hash_record({"tax": Decimal("38.4200")}) != hash_record({"tax": Decimal("38.42")})


def test_datetimes_are_normalised_to_a_utc_instant() -> None:
    """Fixed precision and a fixed zone, so that a driver handing back a naive
    datetime for a column stored as UTC does not break an untampered chain."""
    assert canonical_json({"at": AT}) == '{"at":"2026-09-20T10:30:00.000000+00:00"}'
    naive = AT.replace(tzinfo=None)
    assert canonical_json({"at": naive}) == canonical_json({"at": AT})
    shifted = AT.astimezone(timezone(timedelta(hours=5, minutes=30)))
    assert canonical_json({"at": shifted}) == canonical_json({"at": AT})
    assert canonical_json({"on": date(2026, 9, 20)}) == '{"on":"2026-09-20"}'


def test_an_unserialisable_value_raises_rather_than_hashing_its_repr() -> None:
    with pytest.raises(TypeError):
        canonical_json({"x": object()})


def test_chain_hash_refuses_an_incomplete_entry() -> None:
    with pytest.raises(ValueError, match="missing chained field"):
        chain_hash_for(GENESIS_HASH, {"seq": 1})


def test_hash_record_of_nothing_is_none() -> None:
    assert hash_record(None) is None
