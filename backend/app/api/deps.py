"""Shared API dependencies."""

from __future__ import annotations

from collections.abc import Iterator
from functools import lru_cache
from typing import Any

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.settings import get_settings


def _configure_sqlite(engine: Engine) -> None:
    """Make SQLite behave like the database this platform needs.

    Three settings, none of them optional here:

    ``foreign_keys=ON``
        SQLite does **not** enforce foreign keys unless asked, per connection.
        Without this a notice could point at a case that no longer exists and
        nothing would object.

    ``journal_mode=WAL``
        Readers do not block the writer. The nightly engine run writes while
        officers are reading their screens, and the default rollback journal
        would lock them out for the duration.

    ``busy_timeout``
        A writer that finds the database locked waits rather than failing
        immediately, which is the difference between a slow save and a lost one.
    """

    @event.listens_for(engine, "connect")
    def _on_connect(dbapi_connection: Any, _record: Any) -> None:
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=10000")
        finally:
            cursor.close()


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    """One engine per process, created on first use."""
    url = get_settings().database_url
    is_sqlite = url.startswith("sqlite")

    engine = create_engine(
        url,
        future=True,
        pool_pre_ping=True,
        # The API serves requests on worker threads; SQLite's default guard
        # would reject a connection reused across them.
        connect_args={"check_same_thread": False} if is_sqlite else {},
    )
    if is_sqlite:
        _configure_sqlite(engine)
    return engine


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), future=True, expire_on_commit=False)


def get_session() -> Iterator[Session]:
    """One session per request, rolled back on an unhandled error."""
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
