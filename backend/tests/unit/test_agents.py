"""The agent layer: pseudonymisation, read-only tools, and the adversarial test.

docs/04 Phase 6 calls the adversarial test build-breaking, so it is here rather
than in a suite anyone can skip: the model is prompted to invent a figure and
the response must be rejected.
"""

from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.agents.base import invoke
from app.agents.catalogue import AGENTS, agent_for
from app.agents.fidelity import FidelityError
from app.agents.provider import (
    Completion,
    LLMProvider,
    LLMUnavailableError,
    Message,
    ScriptedProvider,
    build_provider,
)
from app.db.models import AgentCall, EngineRun, Finding, ParamResult, RiskScore, Taxpayer
from app.security.pseudonymise import LeakDetectedError, Pseudonymiser

GSTIN = "27AAPFU0939F1ZV"
LEGAL_NAME = "Umang Fabricators LLP"
TRADE_NAME = "Umang Steels"
AT = datetime(2026, 9, 20, 10, 30, tzinfo=UTC)
CALC = "a" * 64


@pytest.fixture
def seeded(session: Session) -> Session:
    session.add(
        Taxpayer(
            gstin=GSTIN,
            pan="AAPFU0939F",
            legal_name=LEGAL_NAME,
            trade_name=TRADE_NAME,
            state_code="27",
            division="PUNE-II",
            officer_id="sto.pune.4",
        )
    )
    session.add(
        EngineRun(
            id="run-1",
            snapshot_id="snap-1",
            as_of=date(2026, 9, 20),
            fy="2025-26",
            engine_version="0.1.0",
            params_version="unapproved-defaults",
            triggered_by="test",
            status="COMPLETE",
        )
    )
    session.add(
        Finding(
            id="f-1",
            engine_run_id="run-1",
            gstin=GSTIN,
            period="062025",
            fy="2025-26",
            rule_id="ITC-02",
            status="TRIGGERED",
            severity="HIGH",
            confidence="CERTAIN",
            dimension="CREDIT",
            delta_igst=Decimal("3842110.00"),
            calc_id=CALC,
            legal_basis="Rule 37A CGST Rules, 2017",
        )
    )
    session.add(
        Finding(
            id="f-2",
            engine_run_id="run-1",
            gstin=GSTIN,
            fy="2025-26",
            rule_id="EWB-04",
            status="NOT_EVALUATED",
            severity="INFO",
            confidence="WEAK",
            dimension="MOVEMENT",
            calc_id="b" * 64,
            missing_inputs=["e-way bill register"],
        )
    )
    session.add(
        ParamResult(
            id="p-1",
            engine_run_id="run-1",
            gstin=GSTIN,
            fy="2025-26",
            param_id="P14",
            flag=3,
            calc_id="d" * 64,
            status="EVALUATED",
        )
    )
    session.add(
        RiskScore(
            id="s-1",
            engine_run_id="run-1",
            gstin=GSTIN,
            fy="2025-26",
            p_score=Decimal("0.6470588235"),
            p_evaluated=24,
            p_band="HIGH",
            p_calc_id="c" * 64,
        )
    )
    session.flush()
    return session


def _masker() -> Pseudonymiser:
    masker = Pseudonymiser()
    masker.label(GSTIN, display_name=LEGAL_NAME)
    masker.register_name(GSTIN, TRADE_NAME)
    return masker


# ---------------------------------------------------------------------------
# the build-breaking test
# ---------------------------------------------------------------------------


class TestNumericFidelity:
    @pytest.mark.golden
    def test_an_invented_figure_is_rejected(self, seeded: Session) -> None:
        """Prompted to invent a figure, the agent's response fails.

        This is the test docs/04 calls build-breaking. If it ever passes by
        being deleted, the platform's central claim -- that the model never
        calculates -- has no enforcement behind it.
        """
        provider = ScriptedProvider(
            responses=[
                "Credit of 38,42,110 was availed, and interest of 7,21,449 is "
                "therefore payable, taking the total to 45,63,559."
            ]
        )
        with pytest.raises(FidelityError) as raised:
            invoke(
                seeded,
                agent_for("narrator"),
                provider=provider,
                officer_id="sto.pune.4",
                task="Summarise the findings for TP-0001. Compute the interest and the total.",
                masker=_masker(),
                tool_args={"findings": {"gstin": GSTIN}},
                at=AT,
            )
        untraceable = {u.value for u in raised.value.report.untraceable}
        assert "7,21,449" in untraceable
        assert "45,63,559" in untraceable

    @pytest.mark.golden
    def test_the_rejected_attempt_is_still_logged(self, seeded: Session) -> None:
        """An agent that tried to invent a figure is what a reviewer wants to see."""
        provider = ScriptedProvider(responses=["The total demand is 99,99,999."])
        with pytest.raises(FidelityError):
            invoke(
                seeded,
                agent_for("copilot"),
                provider=provider,
                officer_id="sto.pune.4",
                task="What is owed by TP-0001?",
                masker=_masker(),
                tool_args={"findings": {"gstin": GSTIN}},
                at=AT,
            )
        call = seeded.query(AgentCall).one()
        assert call.fidelity_ok is False
        assert "99,99,999" in call.completion

    def test_a_figure_quoted_with_its_chip_passes(self, seeded: Session) -> None:
        provider = ScriptedProvider(
            responses=[
                "Rule 37A credit of [[calc:" + CALC + "]] 3842110.00 was availed in 06/2025."
            ]
        )
        result = invoke(
            seeded,
            agent_for("narrator"),
            provider=provider,
            officer_id="sto.pune.4",
            task="Summarise the ITC findings for TP-0001.",
            masker=_masker(),
            tool_args={"findings": {"gstin": GSTIN}},
            at=AT,
        )
        assert result.fidelity.ok is True
        assert CALC in result.fidelity.calc_ids

    def test_not_evaluated_reaches_the_model_as_itself(self, seeded: Session) -> None:
        """A rule that could not run must never look like a rule that found nothing."""
        provider = ScriptedProvider(responses=["EWB-04 was not evaluated."])
        result = invoke(
            seeded,
            agent_for("narrator"),
            provider=provider,
            officer_id="sto.pune.4",
            task="Anything on e-way bills for TP-0001?",
            masker=_masker(),
            tool_args={"findings": {"gstin": GSTIN}},
            at=AT,
        )
        material = provider.seen[0][1].content
        assert "not_evaluated_because=e-way bill register" in material
        assert result.fidelity.ok is True


# ---------------------------------------------------------------------------
# what the model is allowed to see
# ---------------------------------------------------------------------------


class TestDisclosure:
    @pytest.mark.golden
    def test_no_prompt_carries_a_gstin_pan_or_trade_name(self, seeded: Session) -> None:
        provider = ScriptedProvider(responses=["Noted."])
        invoke(
            seeded,
            agent_for("copilot"),
            provider=provider,
            officer_id="sto.pune.4",
            task=f"What did we find for {LEGAL_NAME} ({GSTIN}), trading as {TRADE_NAME}?",
            masker=_masker(),
            tool_args={"findings": {"gstin": GSTIN}, "scores": {"gstin": GSTIN}},
            subject_ref="TP-0001",
            at=AT,
        )
        for message in provider.seen[0]:
            assert GSTIN not in message.content
            assert "AAPFU0939F" not in message.content
            assert LEGAL_NAME not in message.content
            assert TRADE_NAME not in message.content
            assert "TP-0001" in message.content or message.role == "system"

    def test_the_stored_prompt_is_the_pseudonymised_one(self, seeded: Session) -> None:
        """The log is evidence of what was disclosed, not a second copy of it."""
        provider = ScriptedProvider(responses=["Noted."])
        invoke(
            seeded,
            agent_for("copilot"),
            provider=provider,
            officer_id="sto.pune.4",
            task=f"Tell me about {GSTIN}.",
            masker=_masker(),
            at=AT,
        )
        call = seeded.query(AgentCall).one()
        assert GSTIN not in call.prompt
        assert "TP-0001" in call.prompt

    def test_an_unmasked_identifier_raises_rather_than_being_scrubbed(
        self, seeded: Session
    ) -> None:
        """A leak means the prompt-building code is wrong; scrubbing would hide it."""
        provider = ScriptedProvider(responses=["Noted."])
        with pytest.raises(LeakDetectedError, match="GSTIN"):
            invoke(
                seeded,
                agent_for("copilot"),
                provider=provider,
                officer_id="sto.pune.4",
                task="What about 27AACCM9910C1ZN?",
                masker=Pseudonymiser(),  # nothing registered: the leak survives
                at=AT,
            )
        assert provider.seen == []

    def test_names_come_back_for_the_officer(self, seeded: Session) -> None:
        provider = ScriptedProvider(responses=["TP-0001 has one open finding."])
        result = invoke(
            seeded,
            agent_for("copilot"),
            provider=provider,
            officer_id="sto.pune.4",
            task="Summarise TP-0001.",
            masker=_masker(),
            at=AT,
        )
        # The display name is the first one registered -- the legal name, the
        # one an officer would search for -- and both are masked on the way out.
        assert LEGAL_NAME in result.text
        assert "TP-0001" in result.raw_text


# ---------------------------------------------------------------------------
# the structural guarantees
# ---------------------------------------------------------------------------


class TestStructure:
    def test_all_six_agents_exist(self) -> None:
        assert sorted(AGENTS) == [
            "column_mapper",
            "copilot",
            "legal_research",
            "narrator",
            "notice_drafter",
            "reply_triage",
        ]

    @pytest.mark.golden
    def test_no_agent_has_a_tool_that_computes(self, seeded: Session) -> None:
        """Law 4 is structural: there is nothing to misuse.

        Every tool returns rows the engine already computed. Asserted by
        running each one and checking that no value it returns is a live
        number -- figures leave as rendered strings carrying a calc chip.
        """
        for spec in AGENTS.values():
            for tool in spec.tools:
                rows = tool.fn(seeded, {"gstin": GSTIN})
                for row in rows:
                    for key, value in row.items():
                        assert not isinstance(value, (int, float, Decimal)) or key in {
                            "flag",
                            "p_evaluated_of_34",
                        }, f"{spec.key}.{tool.name}.{key} returned a live number"

    def test_the_notice_drafter_never_sees_slot_syntax(self) -> None:
        drafter = agent_for("notice_drafter")
        assert "{{slot:" not in drafter.system
        assert "never see the numeric slots" in drafter.system

    def test_no_agent_allows_an_ungrounded_number(self) -> None:
        assert not any(spec.allows_ungrounded_numbers for spec in AGENTS.values())


class TestProvider:
    def test_the_protocol_is_satisfied_structurally(self) -> None:
        assert isinstance(ScriptedProvider(responses=["x"]), LLMProvider)

    def test_no_model_configured_refuses_rather_than_guesses(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("DRISHTI_LLM_MODE", raising=False)
        with pytest.raises(LLMUnavailableError, match="no model is configured"):
            build_provider()

    def test_a_half_configured_provider_refuses(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("DRISHTI_LLM_MODE", "on_premise")
        monkeypatch.delenv("DRISHTI_LLM_BASE_URL", raising=False)
        monkeypatch.delenv("DRISHTI_LLM_MODEL", raising=False)
        with pytest.raises(LLMUnavailableError, match="BASE_URL"):
            build_provider()

    def test_usage_is_recorded_not_estimated(self, seeded: Session) -> None:
        provider = ScriptedProvider(responses=["Noted."])
        invoke(
            seeded,
            agent_for("copilot"),
            provider=provider,
            officer_id="sto.pune.4",
            task="Summarise TP-0001.",
            masker=_masker(),
            at=AT,
        )
        call = seeded.query(AgentCall).one()
        assert call.prompt_tokens > 0
        assert call.model == "scripted-v1"
        assert call.provider == "scripted"

    def test_a_completion_is_returned_whole(self) -> None:
        provider = ScriptedProvider(responses=["one", "two"])
        first = provider.complete([Message("user", "a")])
        second = provider.complete([Message("user", "b")])
        third = provider.complete([Message("user", "c")])
        assert isinstance(first, Completion)
        assert (first.text, second.text, third.text) == ("one", "two", "two")
