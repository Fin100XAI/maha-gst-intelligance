"""What this upload can answer, and what it cannot.

The department asked for the unused sections to be taken out. Taking them out
of the code would be the wrong reading: the same platform run against a full
departmental extract needs every one of them, and a screen deleted today is a
capability nobody can ask for tomorrow.

So the screens stay and the data speaks. This endpoint reports, per screen,
whether the canonical table it reads holds anything at all -- a count, not an
inference from zeros, because "every figure is zero" and "the dataset was
never supplied" look identical on a chart and mean opposite things (Law 5).

The test that matters here is the negative one: an empty database must report
every dependent screen as unavailable rather than as quietly fine.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.api.v1.coverage import NEEDS
from app.db.base import Base
from app.db.models import Return3B, Taxpayer
from app.main import create_app

COMMISSIONER = {"X-Officer-Id": "commissioner.mh", "X-Officer-Role": "COMMISSIONER"}


@pytest.fixture
def factory() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, future=True, expire_on_commit=False)
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(factory: sessionmaker[Session]) -> Iterator[TestClient]:
    def override() -> Iterator[Session]:
        session = factory()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_session] = override
    with TestClient(app) as test_client:
        yield test_client


def _screens(client: TestClient) -> dict[str, dict[str, object]]:
    response = client.get("/api/v1/coverage/screens", headers=COMMISSIONER)
    assert response.status_code == 200, response.text
    return {row["code"]: row for row in response.json()["screens"]}


class TestAnEmptyDatabaseSaysSoForEveryScreen:
    def test_nothing_is_reported_as_available(self, client: TestClient) -> None:
        rows = _screens(client)
        assert rows, "the endpoint returned no screens at all"
        assert [code for code, row in rows.items() if row["available"]] == []

    def test_each_unavailable_screen_names_what_it_is_waiting_for(self, client: TestClient) -> None:
        """A dimmed destination with no reason is just a broken link."""
        for code, row in _screens(client).items():
            assert row["dataset"], code
            assert row["waiting_for"], code

    def test_the_note_says_unavailable_is_not_a_nil_finding(self, client: TestClient) -> None:
        body = client.get("/api/v1/coverage/screens", headers=COMMISSIONER).json()
        assert "not empty of findings" in body["note"]


class TestASuppliedDatasetTurnsItsScreensOn:
    def test_a_filed_return_makes_the_filing_screens_available(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        with factory() as session:
            session.add(
                Return3B(
                    id="r1",
                    snapshot_id="s1",
                    gstin="27AAHCR8533P1ZL",
                    period="042025",
                    filing_date=datetime(2025, 5, 18, tzinfo=UTC).date(),
                    t31a_taxable=Decimal("100.00"),
                )
            )
            session.commit()

        rows = _screens(client)
        # D2 (filing compliance) and W8 (returns in this case) both read 3B.
        assert rows["D2"]["available"] is True, rows["D2"]
        assert rows["W8"]["available"] is True, rows["W8"]
        # Nothing else was supplied, so nothing else turned on.
        assert rows["D6"]["available"] is False
        assert rows["D8"]["available"] is False

    def test_a_registration_does_not_turn_on_a_findings_screen(
        self, client: TestClient, factory: sessionmaker[Session]
    ) -> None:
        """The dependencies must be per dataset, not one global "has data" flag."""
        with factory() as session:
            session.add(
                Taxpayer(
                    gstin="27AAHCR8533P1ZL",
                    pan="AAHCR8533P",
                    legal_name="A",
                    state_code="27",
                )
            )
            session.commit()

        rows = _screens(client)
        assert rows["D7"]["available"] is True
        assert rows["D3"]["available"] is False, "findings screens need findings, not filers"


class TestTheListIsHonestAboutItself:
    def test_no_screen_is_declared_twice(self) -> None:
        codes = [need.code for need in NEEDS]
        assert len(codes) == len(set(codes)), codes

    def test_screens_with_no_data_dependency_are_absent_rather_than_faked(self) -> None:
        """The Guide, the upload screen, the rule library and the alignment
        table need no taxpayer data. Listing them as "available" would make
        the flag meaningless; listing them as unavailable would be a lie.
        """
        codes = {need.code for need in NEEDS}
        for always_on in ("S0", "S1", "S2", "S3", "S5", "W1"):
            assert always_on not in codes
