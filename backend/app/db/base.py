"""Declarative base, shared column types and the session factory.

Money is ``NUMERIC(18,2)`` everywhere.  ``tests/migration/test_money_columns.py``
(gate G2) fails the build if any money column is ever declared floating-point,
because a demand that is off by a paisa is a demand competent counsel uses to
attack the whole order.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, Final

from sqlalchemy import JSON, DateTime, MetaData, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase

#: Every rupee column.  18 digits with 2 decimal places holds the national
#: revenue of a mid-sized State in paise, with room to spare.
MONEY: Final[Numeric[Decimal]] = Numeric(18, 2)

#: Ratios, percentages and parameter metrics.  Wider than money on purpose: a
#: P-parameter value such as 0.9921 must not be rounded to two places before it
#: is banded against a cohort percentile.
RATIO: Final[Numeric[Decimal]] = Numeric(28, 10)

#: A GSTIN is always exactly 15 characters.
GSTIN: Final[String] = String(15)

#: A tax period on the wire is MMYYYY.
PERIOD: Final[String] = String(6)

#: A financial year label: 2025-26.
FY: Final[String] = String(7)

#: sha256 hex.
HASH: Final[String] = String(64)

#: JSON that becomes JSONB on PostgreSQL and stays JSON on SQLite, so the
#: offline test suite runs without a server.
#: JSON on SQLite, which is the supported database; JSONB where PostgreSQL is
#: used instead.  Declaring the variant costs nothing and keeps that a
#: configuration choice rather than a migration.
JSON_DOC: Final[Any] = JSON().with_variant(JSONB, "postgresql")

#: Timestamps are stored with a timezone.  A service date argued in an
#: appellate forum cannot be ambiguous about which clock it came from.
TIMESTAMP: Final[DateTime] = DateTime(timezone=True)


def utcnow() -> datetime:
    return datetime.now(UTC)


#: Explicit, stable constraint names so Alembic autogenerate produces reviewable
#: diffs rather than churn.
NAMING_CONVENTION: Final[dict[str, str]] = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
