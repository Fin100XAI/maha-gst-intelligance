"""Gate G2 -- no money column is floating point, in the models or the migration.

A demand that is off by a paisa is a demand competent counsel uses to attack the
whole order, so this is checked two ways: against the declared metadata, and
against the schema the migration actually produces.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import Float, Numeric, String, Text, create_engine, inspect

from app.db import models as _models  # noqa: F401 - registers every table
from app.db.base import Base

#: The column-name test docs/04 gate G2 prescribes.
MONEY_NAME = re.compile(r"igst|cgst|sgst|cess|value|amount", re.IGNORECASE)

#: The four heads, wherever they appear, must be exactly NUMERIC(18,2).
HEAD_NAME = re.compile(r"(^|_)(igst|cgst|sgst|cess)$", re.IGNORECASE)

#: Columns that match the name test but are deliberately not money.  Each one is
#: listed explicitly so that adding a new exception is a visible decision.
NOT_MONEY: dict[tuple[str, str], str] = {
    ("rule_parameter", "value"): "the governed parameter value; text so a Decimal, a date "
    "and a form number all round-trip without a lossy cast",
    ("param_result", "value"): "a P-parameter metric, which may be a ratio; NUMERIC(28,10)",
    ("rule_parameter", "value_type"): "names how to read rule_parameter.value; it is a "
    "discriminator, not an amount",
}


def _money_columns() -> list[tuple[str, str, object]]:
    found = []
    for table_name, table in Base.metadata.tables.items():
        for column in table.columns:
            if MONEY_NAME.search(column.name):
                found.append((table_name, column.name, column.type))
    return found


def test_the_gate_actually_inspects_something() -> None:
    columns = _money_columns()
    assert len(columns) > 100, "G2 must be scanning the real schema, not an empty one"


@pytest.mark.golden
def test_no_money_column_is_floating_point() -> None:
    offenders = [
        f"{table}.{name} is {type_!r}"
        for table, name, type_ in _money_columns()
        if isinstance(type_, Float)
    ]
    assert not offenders, "floating-point money columns: " + "; ".join(offenders)


def test_every_money_column_is_numeric_or_a_declared_exception() -> None:
    offenders = []
    for table, name, type_ in _money_columns():
        if (table, name) in NOT_MONEY:
            assert isinstance(type_, (Numeric, String, Text)), f"{table}.{name}"
            continue
        if not isinstance(type_, Numeric):
            offenders.append(f"{table}.{name} is {type_!r}")
    assert not offenders, "money columns that are not NUMERIC: " + "; ".join(offenders)


@pytest.mark.golden
def test_every_tax_head_column_is_numeric_18_2() -> None:
    """Head-wise columns carry rupees and nothing else, at one precision."""
    checked = 0
    for table_name, table in Base.metadata.tables.items():
        for column in table.columns:
            if not HEAD_NAME.search(column.name):
                continue
            checked += 1
            assert isinstance(column.type, Numeric), f"{table_name}.{column.name}"
            assert (column.type.precision, column.type.scale) == (18, 2), (
                f"{table_name}.{column.name} is NUMERIC"
                f"({column.type.precision},{column.type.scale}), expected (18,2)"
            )
    assert checked >= 100, "expected the four heads across every transactional table"


def test_return_3b_carries_four_columns_per_tax_field() -> None:
    """Four columns per field, never a JSON blob: every rule compares head-wise."""
    columns = {c.name for c in Base.metadata.tables["return_3b"].columns}
    for field in ("t31a", "t31b", "t31c", "t31d", "t31e", "t311i", "t311ii", "t32"):
        for head in ("igst", "cgst", "sgst", "cess"):
            assert f"{field}_{head}" in columns
        assert f"{field}_taxable" in columns
    for field in ("t4a1", "t4a2", "t4a3", "t4a4", "t4a5", "t4b1", "t4b2", "t4c", "t4d1", "t4d2"):
        for head in ("igst", "cgst", "sgst", "cess"):
            assert f"{field}_{head}" in columns
    for field in ("interest", "late_fee", "payable", "paid_itc", "paid_cash"):
        for head in ("igst", "cgst", "sgst", "cess"):
            assert f"{field}_{head}" in columns


@pytest.mark.golden
def test_the_migration_produces_the_same_schema_as_the_models(tmp_path: Path) -> None:
    """The migration is the thing that actually runs in production, so it is the
    thing G2 must hold against -- not only the declarative metadata."""
    backend = Path(__file__).resolve().parent.parent.parent
    database = tmp_path / "migrated.db"
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend,
        env={**os.environ, "DATABASE_URL": f"sqlite:///{database}"},
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr

    engine = create_engine(f"sqlite:///{database}")
    inspector = inspect(engine)
    migrated = {name for name in inspector.get_table_names() if name != "alembic_version"}
    declared = set(Base.metadata.tables)
    assert migrated == declared, (
        f"only in migration: {sorted(migrated - declared)}; "
        f"only in models: {sorted(declared - migrated)}"
    )

    for table in sorted(declared):
        migrated_columns = {c["name"]: c for c in inspector.get_columns(table)}
        declared_columns = {c.name: c for c in Base.metadata.tables[table].columns}
        assert set(migrated_columns) == set(declared_columns), f"{table} columns drifted"
        for name in declared_columns:
            if not MONEY_NAME.search(name) or (table, name) in NOT_MONEY:
                continue
            rendered = str(migrated_columns[name]["type"]).upper()
            assert (
                "FLOAT" not in rendered and "REAL" not in rendered and "DOUBLE" not in rendered
            ), f"{table}.{name} migrated as {rendered}"
            assert rendered.startswith("NUMERIC"), f"{table}.{name} migrated as {rendered}"
    engine.dispose()
