"""Shared fixtures.

The suite runs entirely offline against in-memory SQLite: `pytest` with no
Docker, no PostgreSQL and no credentials must pass on a laptop.  Anything that
genuinely needs the stack is marked ``integration``.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db import models as _models  # noqa: F401 - registers every table
from app.db.base import Base

BACKEND_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_ROOT.parent


@pytest.fixture
def session() -> Iterator[Session]:
    """A clean in-memory database with the full canonical schema."""
    engine = create_engine("sqlite://", future=True)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as active:
        yield active
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def backend_root() -> Path:
    return BACKEND_ROOT
