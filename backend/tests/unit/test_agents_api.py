"""W7 - the Copilot endpoint.

The agent layer is optional. With no model configured the endpoint answers 501
naming what is missing, because every figure it would quote is already computed
and drillable without one - degrading into a plausible-sounding answer would be
strictly worse than refusing.
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
from app.db.models import AgentCall, EngineRun, Finding, Taxpayer
from app.main import create_app

PUNE = "27AAPFU0939F1ZV"
NAGPUR = "27AACCM9910C1ZN"
STO = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}
ANALYTICS = {"X-Officer-Id": "analytics.1", "X-Officer-Role": "ANALYTICS"}


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.delenv("DRISHTI_LLM_MODE", raising=False)

    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as setup:
        setup.add_all(
            [
                Taxpayer(
                    gstin=PUNE,
                    pan="AAPFU0939F",
                    legal_name="Umang Fabricators LLP",
                    trade_name="Umang Steels",
                    state_code="27",
                    division="PUNE-II",
                ),
                Taxpayer(
                    gstin=NAGPUR,
                    pan="AACCM9910C",
                    legal_name="Mahalaxmi Traders Pvt Ltd",
                    state_code="27",
                    division="NAGPUR-I",
                ),
                EngineRun(
                    id="run-1",
                    snapshot_id="snap-1",
                    as_of=date(2026, 9, 20),
                    fy="2025-26",
                    engine_version="0.1.0",
                    params_version="unapproved-defaults",
                    triggered_by="test",
                    status="COMPLETE",
                ),
                Finding(
                    id="f-1",
                    engine_run_id="run-1",
                    gstin=PUNE,
                    period="062025",
                    fy="2025-26",
                    rule_id="ITC-02",
                    status="TRIGGERED",
                    severity="HIGH",
                    confidence="CERTAIN",
                    dimension="CREDIT",
                    delta_igst=Decimal("3842110.00"),
                    calc_id="a" * 64,
                ),
                AgentCall(
                    id="call-1",
                    at=date(2026, 9, 20),
                    agent="copilot",
                    officer_id="sto.pune.4",
                    subject_ref="TP-0001",
                    provider="scripted",
                    model="scripted-v1",
                    prompt="What did we find for TP-0001?",
                    completion="The total is 99,99,999.",
                    tool_calls=[],
                    prompt_tokens=12,
                    completion_tokens=8,
                    latency_ms=3,
                    fidelity_ok=False,
                    fidelity_detail={"ok": False},
                ),
            ]
        )
        setup.commit()

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


class TestCatalogue:
    def test_the_six_agents_and_their_guarantees_are_listed(self, client: TestClient) -> None:
        body = client.get("/api/v1/agents", headers=STO).json()
        assert body["count"] == 6
        assert any("arithmetic" in line for line in body["guarantees"])
        assert all(item["allows_ungrounded_numbers"] is False for item in body["items"])

    def test_an_unknown_agent_is_404(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/agents/oracle", headers=STO, json={"question": "tell me everything"}
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "UNKNOWN_AGENT"


class TestRefusals:
    @pytest.mark.golden
    def test_with_no_model_configured_it_refuses_rather_than_guesses(
        self, client: TestClient
    ) -> None:
        response = client.post(
            "/api/v1/agents/copilot",
            headers=STO,
            json={"question": "Summarise this taxpayer.", "gstins": [PUNE]},
        )
        assert response.status_code == 501
        body = response.json()
        assert body["code"] == "NO_MODEL_CONFIGURED"
        assert "without a model" in body["available_now"]

    @pytest.mark.golden
    def test_an_out_of_scope_gstin_is_404_before_any_prompt_is_built(
        self, client: TestClient
    ) -> None:
        """The jurisdiction check runs before a pseudonym exists, so an
        out-of-scope GSTIN never reaches a prompt even masked."""
        response = client.post(
            "/api/v1/agents/copilot",
            headers=STO,
            json={"question": "Summarise this taxpayer.", "gstins": [NAGPUR]},
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "NOT_FOUND"

    @pytest.mark.golden
    def test_the_analytics_role_may_not_use_agents(self, client: TestClient) -> None:
        """De-identification is derived from the role, not a flag a caller
        has to remember to set."""
        response = client.post(
            "/api/v1/agents/copilot",
            headers=ANALYTICS,
            json={"question": "Summarise everything."},
        )
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "DEIDENTIFIED_ROLE"

    def test_a_question_must_not_be_empty(self, client: TestClient) -> None:
        response = client.post("/api/v1/agents/copilot", headers=STO, json={"question": "a"})
        assert response.status_code == 422


class TestAgentLog:
    @pytest.mark.golden
    def test_a_rejected_completion_is_kept(self, client: TestClient) -> None:
        """An agent that tried to invent a figure is what a reviewer needs."""
        body = client.get("/api/v1/agents/calls?failed_only=true", headers=STO).json()
        assert body["count"] == 1
        call = body["items"][0]
        assert call["fidelity_ok"] is False
        assert "99,99,999" in call["completion"]

    def test_the_logged_prompt_carries_no_identifier(self, client: TestClient) -> None:
        body = client.get("/api/v1/agents/calls", headers=STO).json()
        for call in body["items"]:
            assert PUNE not in call["prompt"]
            assert "TP-" in call["prompt"] or call["subject_ref"] is not None

    def test_filtering_by_agent_works(self, client: TestClient) -> None:
        assert client.get("/api/v1/agents/calls?agent=copilot", headers=STO).json()["count"] == 1
        assert client.get("/api/v1/agents/calls?agent=narrator", headers=STO).json()["count"] == 0


class TestWithAModel:
    """The same endpoint once a provider is configured."""

    @pytest.mark.golden
    def test_an_invented_figure_is_rejected_at_the_api(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from app.agents.provider import ScriptedProvider

        monkeypatch.setattr(
            "app.api.v1.agents.build_provider",
            lambda: ScriptedProvider(responses=["The total demand is 45,63,559."]),
        )
        response = client.post(
            "/api/v1/agents/copilot",
            headers=STO,
            json={"question": "What is owed?", "gstins": [PUNE]},
        )
        assert response.status_code == 422
        body = response.json()["detail"]
        assert body["code"] == "NUMERIC_FIDELITY_FAILED"
        assert any(item["value"] == "45,63,559" for item in body["untraceable"])

    def test_a_grounded_answer_comes_back_with_names_restored(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from app.agents.provider import ScriptedProvider

        monkeypatch.setattr(
            "app.api.v1.agents.build_provider",
            lambda: ScriptedProvider(responses=["TP-0001 has one open ITC finding."]),
        )
        response = client.post(
            "/api/v1/agents/copilot",
            headers=STO,
            json={"question": "Anything open?", "gstins": [PUNE]},
        )
        assert response.status_code == 200
        body = response.json()
        assert "Umang Fabricators LLP" in body["text"]
        assert body["badge"] == "AI-DRAFTED - OFFICER RESPONSIBLE"
        assert body["fidelity"]["ok"] is True
