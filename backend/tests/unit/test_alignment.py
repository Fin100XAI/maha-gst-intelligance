"""The alignment screen: the department's circular against what the platform does.

The claim this screen makes is that all 34 risk flags in the department's
circular are implemented. That claim is worth very little unless something
checks it, so these tests check it - including the part that is easy to fake,
which is whether a parameter that exists is ever actually evaluated.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.db.base import Base
from app.engine.params_p01_p34 import PARAMETERS
from app.main import create_app
from app.reference.risk_flags import SOURCE_FLAGS

STO = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

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


class TestTheCircularIsStoredWhole:
    def test_all_thirty_four_flags_are_present(self) -> None:
        assert len(SOURCE_FLAGS) == 34
        assert [flag.param_id for flag in SOURCE_FLAGS] == [f"P{n:02d}" for n in range(1, 35)]

    def test_every_flag_in_the_circular_has_a_parameter(self) -> None:
        """The alignment claim, asserted rather than displayed."""
        assert [flag.param_id for flag in SOURCE_FLAGS if flag.param_id not in PARAMETERS] == []

    def test_no_parameter_exists_that_the_circular_does_not_ask_for(self) -> None:
        """The other direction. An invented risk flag would be a liberty."""
        in_circular = {flag.param_id for flag in SOURCE_FLAGS}
        assert sorted(pid for pid in PARAMETERS if pid not in in_circular) == []

    def test_the_source_text_is_not_paraphrased(self) -> None:
        """Spot-check that the circular's own wording survived being stored.

        If someone tidies this text, the screen stops being a comparison and
        becomes two paraphrases agreeing with each other.
        """
        p07 = next(flag for flag in SOURCE_FLAGS if flag.param_id == "P07")
        assert "In case the entire tax liability is paid out of ITC" in p07.source_text
        p12 = next(flag for flag in SOURCE_FLAGS if flag.param_id == "P12")
        assert "has not filed less than 3 GST returns" in p12.source_text

    def test_the_plain_restatement_is_distinct_from_the_source(self) -> None:
        for flag in SOURCE_FLAGS:
            assert flag.plain != flag.source_text
            assert len(flag.plain) < len(flag.source_text)


class TestTheEndpoint:
    @pytest.mark.golden
    def test_it_reports_thirty_four_of_thirty_four(self, client: TestClient) -> None:
        body = client.get("/api/v1/alignment/risk-flags", headers=STO).json()
        assert body["summary"]["in_circular"] == 34
        assert body["summary"]["implemented"] == 34
        assert body["summary"]["missing"] == []
        assert len(body["items"]) == 34

    @pytest.mark.golden
    def test_the_ten_dark_parameters_are_named_with_their_feed(self, client: TestClient) -> None:
        """A flag that cannot run must say so, and say what would fix it."""
        body = client.get("/api/v1/alignment/risk-flags", headers=STO).json()
        assert body["summary"]["awaiting_feed"] == 10
        assert body["summary"]["computed_from_returns"] == 24

        awaiting = [i for i in body["items"] if i["availability"]["state"] == "AWAITING_FEED"]
        assert [i["param_id"] for i in awaiting] == [
            "P02",
            "P15",
            "P20",
            "P23",
            "P25",
            "P26",
            "P27",
            "P28",
            "P33",
            "P34",
        ]
        for item in awaiting:
            assert item["availability"]["feed"] is not None

    def test_every_flag_carries_both_texts_and_what_the_platform_computes(
        self, client: TestClient
    ) -> None:
        body = client.get("/api/v1/alignment/risk-flags", headers=STO).json()
        for item in body["items"]:
            assert item["source_text"].strip() != ""
            assert item["plain"].strip() != ""
            assert item["platform"]["computes"].strip() != ""
            assert item["platform"]["how_flagged"].strip() != ""
            assert item["platform"]["data_sources"] != []

    def test_without_a_run_the_incidence_columns_are_absent_not_zero(
        self, client: TestClient
    ) -> None:
        """Nothing counted is not the same as counted and found to be nothing."""
        body = client.get("/api/v1/alignment/risk-flags", headers=STO).json()
        assert body["summary"]["run_id"] is None
        assert all(item["run"] is None for item in body["items"])

    def test_an_unknown_run_is_404(self, client: TestClient) -> None:
        response = client.get("/api/v1/alignment/risk-flags?run_id=nope", headers=STO)
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "RUN_NOT_FOUND"

    def test_the_feeds_are_grouped_so_the_business_case_is_countable(
        self, client: TestClient
    ) -> None:
        """Four integrations unlock ten flags. That is the procurement sentence."""
        body = client.get("/api/v1/alignment/risk-flags", headers=STO).json()
        by_feed = {entry["feed"]: entry["flags"] for entry in body["feeds"]}
        assert by_feed["ICEGATE customs"] == ["P02", "P15", "P20", "P23"]
        assert by_feed["Refund module"] == ["P25", "P26", "P27"]
        assert by_feed["ITD / AIS turnover"] == ["P33", "P34"]
        assert by_feed["DGARM red-flag feed"] == ["P28"]
        assert sum(len(flags) for flags in by_feed.values()) == 10
