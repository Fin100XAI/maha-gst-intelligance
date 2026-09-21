"""Alembic environment.

The database URL comes from the application settings so that the migration a
developer runs is the migration CI runs.  ``compare_type`` is on because a money
column silently changing type is precisely the class of drift gate G2 exists to
catch.
"""

from __future__ import annotations

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context
from app.db import models as _models  # noqa: F401 - import registers every table
from app.db.base import Base
from app.settings import get_settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The URL comes from the application's own settings, so a migration runs
# against exactly the database the application will open -- including
# `DRISHTI_DATABASE_URL`, which is how the demo and the tests point at SQLite.
# A bare DATABASE_URL still wins, for a deployment that sets only that.
_url = os.environ.get("DATABASE_URL") or get_settings().database_url_for_alembic()
config.set_main_option("sqlalchemy.url", _url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=connection.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
