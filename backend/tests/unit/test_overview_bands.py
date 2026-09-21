"""D1: the risk-band chart shows bands, not bands multiplied by divisions.

``FactRiskSnapshot`` is keyed on (jurisdiction, fy, band_kind, band), which is
what the per-office screens need. The State-wide overview iterated those rows
directly, so a State with six divisions drew six bars all labelled LOW. Read as
a chart that claims to show four risk bands, that is wrong twice: the reader
sees six bands where there are two, and no bar shows how many taxpayers are
actually in a band.

These tests pin the collapse, the weighting and the order.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.db.base import Base
from app.db.facts import FactRiskSnapshot
from app.db.models import EngineRun
from app.main import create_app

RUN = "run-bands"
HEAD = {"X-Officer-Id": "c", "X-Officer-Role": "COMMISSIONER"}

#: (division, kind, band, taxpayers, score mean over those taxpayers)
ROWS = (
    ("PUNE-I", "P", "LOW", 10, "10.00"),
    ("PUNE-II", "P", "LOW", 2, "60.00"),
    ("NAGPUR-I", "P", "SEVERE", 1, "95.00"),
    ("PUNE-I", "P", "MODERATE", 3, "40.00"),
    ("PUNE-I", "F", "GREEN", 11, "5.00"),
    ("NAGPUR-I", "F", "RED", 5, "80.00"),
)


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

    with factory() as session:
        session.add(
            EngineRun(
                id=RUN,
                snapshot_id="snap-1",
                as_of=date(2026, 3, 31),
                fy="2025-26",
                engine_version="0.1.0",
                params_version="defaults",
                triggered_by="test",
                status="COMPLETE",
                gstin_count=16,
            )
        )
        for index, (division, kind, band, count, score) in enumerate(ROWS):
            session.add(
                FactRiskSnapshot(
                    id=f"fr-{index}",
                    engine_run_id=RUN,
                    jurisdiction=division,
                    fy="2025-26",
                    band_kind=kind,
                    band=band,
                    taxpayer_count=count,
                    p_score_mean=Decimal(score),
                    p_coverage_mean=Decimal("0.5000"),
                    f_score_mean=Decimal(score),
                    revenue_at_risk=Decimal("0.00"),
                    revenue_at_risk_certain=Decimal("0.00"),
                    revenue_at_risk_strong=Decimal("0.00"),
                    revenue_at_risk_advisory=Decimal("0.00"),
                )
            )
        session.commit()

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
    Base.metadata.drop_all(engine)
    engine.dispose()


def _overview(client: TestClient) -> dict[str, object]:
    response = client.get("/api/v1/dashboard/overview", headers=HEAD)
    assert response.status_code == 200
    return response.json()  # type: ignore[no-any-return]


class TestBandsCollapse:
    @pytest.mark.golden
    def test_one_bar_per_band_however_many_divisions(self, client: TestClient) -> None:
        bands = _overview(client)["risk_landscape"]["p_bands"]  # type: ignore[index]
        assert [row["band"] for row in bands] == ["LOW", "MODERATE", "SEVERE"]

    @pytest.mark.golden
    def test_the_count_is_the_taxpayers_in_that_band(self, client: TestClient) -> None:
        """Ten in Pune-I plus two in Pune-II is twelve, not two bars."""
        bands = {
            row["band"]: row["taxpayer_count"]
            for row in _overview(client)["risk_landscape"]["p_bands"]  # type: ignore[index]
        }
        assert bands == {"LOW": 12, "MODERATE": 3, "SEVERE": 1}

    @pytest.mark.golden
    def test_the_mean_is_weighted_by_taxpayer_count(self, client: TestClient) -> None:
        """Averaging the averages would give a two-taxpayer division equal say.

        LOW holds ten taxpayers at 10.00 and two at 60.00:
        (10*10 + 2*60) / 12 = 220/12 = 18.33. The unweighted mean would be
        35.00, which is nearly twice the truth.
        """
        bands = {
            row["band"]: row["p_score_mean"]
            for row in _overview(client)["risk_landscape"]["p_bands"]  # type: ignore[index]
        }
        assert bands["LOW"] == "18.33"
        assert bands["MODERATE"] == "40.00"

    def test_the_bands_read_as_a_ladder_not_as_an_alphabet(self, client: TestClient) -> None:
        """Sorted by name it is HIGH, LOW, MODERATE, SEVERE -- reordered by eye."""
        body = _overview(client)
        assert [row["band"] for row in body["risk_landscape"]["p_bands"]] == [  # type: ignore[index]
            "LOW",
            "MODERATE",
            "SEVERE",
        ]
        assert [row["band"] for row in body["risk_landscape"]["f_bands"]] == [  # type: ignore[index]
            "GREEN",
            "RED",
        ]

    def test_the_f_bands_carry_the_f_score_not_the_p_score(self, client: TestClient) -> None:
        bands = {
            row["band"]: row["f_score_mean"]
            for row in _overview(client)["risk_landscape"]["f_bands"]  # type: ignore[index]
        }
        assert bands == {"GREEN": "5.00", "RED": "80.00"}

    def test_every_taxpayer_appears_in_exactly_one_band(self, client: TestClient) -> None:
        """The chart must account for the whole portfolio, or it misleads."""
        body = _overview(client)
        total = sum(
            row["taxpayer_count"]
            for row in body["risk_landscape"]["p_bands"]  # type: ignore[index]
        )
        assert total == 16
