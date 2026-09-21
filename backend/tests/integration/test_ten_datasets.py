"""The whole chain, over all ten datasets, against the declared manifest.

Thirty files -- a GSTR-1, a GSTR-3B and a GSTR-2B for each of ten businesses,
each in a different dialect -- ingested into one snapshot, then the engine over
all of it. The point is not that it runs. The point is that what comes out
matches what was built in: four businesses were given a credit over-claim of a
declared size, six were not, and the engine has to find exactly that.

This is the test that makes "validated across dummy datasets" a fact rather
than an afternoon somebody remembers. Every defect it has caught so far was
invisible to the unit tests, because each one was a figure that was well-formed
and wrong:

* a GSTR-2B classified as a GSTR-1, so every supplier was registered as a
  filer and ten businesses became fourteen;
* the filer's State used as the supplier's on an inward line, quarantining
  every genuine inter-State purchase;
* Table 4 read on Table 3.1's columns, putting credit under the wrong head;
* eligibility dropped between the database and the engine, so the whole 2B
  counted as nil and "ITC in excess of 2B" flagged all ten businesses.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.db.base import Base
from app.db.models import ParamResult, Taxpayer
from app.main import create_app
from app.seed.datasets import BUSINESSES, DIALECTS, build_all

pytestmark = pytest.mark.slow

HEAD = {"X-Officer-Id": "commissioner.mh", "X-Officer-Role": "COMMISSIONER"}

#: The trailing "Total" row the portal writes on each of twelve sheets. It is
#: held rather than ingested: counting it would double the month.
EXPECTED_HELD = 12


@pytest.fixture(scope="module")
def run(tmp_path_factory: pytest.TempPathFactory) -> dict[str, object]:
    """Ingest all thirty files and run the engine once, for the whole module."""
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

    def override() -> object:
        session = factory()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_session] = override

    out = tmp_path_factory.mktemp("datasets")
    files: list[Path] = []
    for filing in build_all():
        stem = filing.dialect.key
        suffix = "csv" if filing.dialect.container == "csv" else "xlsx"
        for name, payload in (
            (f"{stem}_GSTR1.{suffix}", filing.gstr1),
            (f"{stem}_GSTR3B.xlsx", filing.gstr3b),
            (f"{stem}_GSTR2B.xlsx", filing.gstr2b),
        ):
            path = out / name
            path.write_bytes(payload)
            files.append(path)

    totals = {"in": 0, "read": 0, "held": 0, "dup": 0}
    snapshot: str | None = None
    with TestClient(app) as client:
        for path in files:
            query = "" if snapshot is None else f"?snapshot_id={snapshot}"
            with path.open("rb") as handle:
                response = client.post(
                    f"/api/v1/ingestion/upload{query}",
                    headers=HEAD,
                    files={"file": (path.name, handle, "application/vnd.ms-excel")},
                    data={"commit": "true"},
                )
            assert response.status_code in (200, 201), f"{path.name}: {response.text[:200]}"
            body = response.json()
            snapshot = snapshot or body["snapshot_id"]
            counts = body["counts"]
            totals["in"] += counts["rows_in"]
            totals["read"] += counts["parsed"]
            totals["held"] += counts["quarantined"]
            totals["dup"] += counts["duplicates"]

        engine_response = client.post(
            "/api/v1/engine/run",
            headers=HEAD,
            json={"snapshot_id": snapshot, "fy": "2025-26", "as_of": "2026-03-31"},
        )
        assert engine_response.status_code in (200, 201), engine_response.text[:300]

    with factory() as session:
        yield {
            "totals": totals,
            "summary": engine_response.json(),
            "session": session,
        }

    Base.metadata.drop_all(engine)
    engine.dispose()


class TestEverythingIsRead:
    def test_every_row_is_accounted_for(self, run: dict[str, object]) -> None:
        totals = run["totals"]  # type: ignore[index]
        assert totals["in"] == totals["read"] + totals["held"] + totals["dup"]

    @pytest.mark.golden
    def test_only_the_totals_rows_are_held(self, run: dict[str, object]) -> None:
        """Across thirty files in ten shapes, nothing else should be held."""
        totals = run["totals"]  # type: ignore[index]
        assert totals["held"] == EXPECTED_HELD
        assert totals["dup"] == 0

    @pytest.mark.golden
    def test_ten_businesses_not_the_suppliers_as_well(self, run: dict[str, object]) -> None:
        """A GSTR-2B read as a GSTR-1 registers every supplier as a filer."""
        session: Session = run["session"]  # type: ignore[assignment]
        registered = {row.gstin for row in session.execute(select(Taxpayer)).scalars()}
        assert registered == {business.gstin for business in BUSINESSES}


class TestTheEngineFindsWhatWasBuiltIn:
    @pytest.mark.golden
    def test_the_credit_over_claim_matches_the_manifest(self, run: dict[str, object]) -> None:
        """P14 must find exactly the four, at exactly the declared amounts."""
        session: Session = run["session"]  # type: ignore[assignment]
        found = {
            row.gstin: row.value
            for row in session.execute(
                select(ParamResult).where(ParamResult.param_id == "P14")
            ).scalars()
        }
        expected = {
            business.gstin: business.itc_overclaim * len(business.itc_overclaim_months)
            for business in BUSINESSES
        }
        assert {k: Decimal(str(v)) for k, v in found.items()} == expected

    def test_the_clean_businesses_read_flag_zero(self, run: dict[str, object]) -> None:
        """Six of the ten agree to the paisa and must say so."""
        session: Session = run["session"]  # type: ignore[assignment]
        clean = {b.gstin for b in BUSINESSES if not b.itc_overclaim_months}
        flags = {
            row.gstin: row.flag
            for row in session.execute(
                select(ParamResult).where(ParamResult.param_id == "P14")
            ).scalars()
        }
        assert all(flags[gstin] == 0 for gstin in clean), flags

    def test_a_parameter_that_flags_everybody_has_stopped_being_one(
        self, run: dict[str, object]
    ) -> None:
        """The shape of the bug that hid behind a working-looking screen."""
        session: Session = run["session"]  # type: ignore[assignment]
        flagged = [
            row.gstin
            for row in session.execute(
                select(ParamResult).where(ParamResult.param_id == "P14")
            ).scalars()
            if (row.flag or 0) > 0
        ]
        assert 0 < len(flagged) < len(BUSINESSES)

    def test_nothing_untested_was_scored_as_a_pass(self, run: dict[str, object]) -> None:
        summary = run["summary"]  # type: ignore[index]
        assert summary["not_evaluated"] > 0
        assert "none was scored as a pass" in summary["note"]

    def test_the_dialects_and_businesses_still_line_up(self) -> None:
        assert len(BUSINESSES) == len(DIALECTS) == 10
