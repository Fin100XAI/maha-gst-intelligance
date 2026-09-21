"""The agent runtime: read-only tools, pseudonymised prompts, logged calls.

Every agent in this package runs through :func:`invoke`.  There is no other
path to a model, which is what makes the four enforcement layers of docs/02
section 9 true of *every* call rather than of the calls someone remembered:

1. **No tool performs arithmetic.**  A :class:`Tool` returns rows the engine
   already computed.  There is no add, no percentage, no total; if a figure is
   not already in the database with a ``calc_id``, no agent can produce it.
2. **Numeric fidelity** runs on the completion, always, and a failure is an
   error rather than a warning.
3. **Template slotting** -- the Notice Drafter is handed prose only.
4. **Provenance** -- figures come back as ``[[calc:...]]`` chips.

The prompt is pseudonymised before it is sent and checked again afterwards by
:func:`assert_clean`, which is an independent implementation: one missed
interpolation is a disclosure.
"""

from __future__ import annotations

import uuid
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.agents.fidelity import FidelityReport, check_completion
from app.agents.provider import Completion, LLMProvider, Message
from app.db.models import AgentCall
from app.security.pseudonymise import Pseudonymiser, assert_clean

__all__ = ["AgentResult", "AgentSpec", "Tool", "ToolResult", "invoke"]


@dataclass(frozen=True, slots=True)
class ToolResult:
    """What a tool returned, and how it is described to the model."""

    name: str
    rows: list[dict[str, Any]]
    note: str = ""

    def render(self, masker: Pseudonymiser) -> str:
        lines = [f"## {self.name}"]
        if self.note:
            lines.append(masker.text(self.note))
        for row in self.rows:
            rendered = ", ".join(f"{key}={value}" for key, value in row.items())
            lines.append(f"- {masker.text(rendered)}")
        if not self.rows:
            lines.append("- (no rows: this dataset was not supplied)")
        return "\n".join(lines)


@dataclass(frozen=True, slots=True)
class Tool:
    """A read-only lookup.

    ``fn`` takes a session and the call's arguments and returns rows.  It may
    select; it may not compute.  The type signature carries no numeric return
    precisely so that nothing here can be mistaken for a calculator.
    """

    name: str
    description: str
    fn: Callable[[Session, dict[str, Any]], list[dict[str, Any]]]

    def run(self, session: Session, args: dict[str, Any]) -> ToolResult:
        return ToolResult(name=self.name, rows=self.fn(session, args), note=self.description)


@dataclass(frozen=True, slots=True)
class AgentSpec:
    """One agent.  Its system prompt and the tools it may read."""

    key: str
    title: str
    system: str
    tools: tuple[Tool, ...] = ()
    #: Whether a bare number with no grounding may pass.  Never true.
    allows_ungrounded_numbers: bool = False


@dataclass(frozen=True, slots=True)
class AgentResult:
    call_id: str
    agent: str
    #: The completion with real names restored, for the officer's screen.
    text: str
    #: The completion exactly as the model produced it, for the log.
    raw_text: str
    fidelity: FidelityReport
    completion: Completion
    tool_results: tuple[ToolResult, ...] = field(default_factory=tuple)

    def as_dict(self) -> dict[str, Any]:
        return {
            "call_id": self.call_id,
            "agent": self.agent,
            "text": self.text,
            "fidelity": self.fidelity.as_dict(),
            "model": self.completion.model,
            "tokens": self.completion.usage.total_tokens,
            "latency_ms": self.completion.latency_ms,
            "badge": "AI-DRAFTED - OFFICER RESPONSIBLE",
        }


_PREAMBLE = """\
You are assisting an officer of a State Commercial Taxes Department.

Rules you must follow without exception:
* You are a scribe and a librarian. You never calculate. Every figure you use
  must appear verbatim in the material below; if a figure you want is not
  there, say that it is not available rather than producing one.
* Taxpayers are identified only by a reference such as TP-0001. Do not ask for
  or invent a GSTIN, a PAN, or a trade name.
* Where the material gives a figure with a calc chip such as [[calc:...]],
  keep the chip immediately before the figure when you quote it.
* Say plainly when something was not evaluated. "Not evaluated" is a real
  answer and is never the same as "no issue found".
"""


def invoke(
    session: Session,
    spec: AgentSpec,
    *,
    provider: LLMProvider,
    officer_id: str,
    task: str,
    masker: Pseudonymiser,
    tool_args: dict[str, dict[str, Any]] | None = None,
    case_id: str | None = None,
    subject_ref: str | None = None,
    at: datetime | None = None,
) -> AgentResult:
    """Run an agent, ground its answer, and log the call.

    Raises :class:`app.agents.fidelity.FidelityError` when the completion
    contains a number that is not in this call's tool results and does not
    carry a ``calc_id``.  The call is logged first, so the rejected completion
    survives for review.
    """
    args = tool_args or {}
    results = tuple(tool.run(session, args.get(tool.name, {})) for tool in spec.tools)

    material = "\n\n".join(result.render(masker) for result in results)
    prompt = "\n\n".join(
        part
        for part in (
            masker.text(task),
            ("Material available to you:\n\n" + material) if results else "",
        )
        if part
    )

    # Independent of the masking above: if anything that looks like an
    # identifier survived, the prompt-building code is wrong and the call must
    # not go out.
    assert_clean(prompt)
    assert_clean(spec.system)

    messages: Sequence[Message] = (
        Message("system", _PREAMBLE + "\n" + spec.system),
        Message("user", prompt),
    )
    completion = provider.complete(messages)

    report = check_completion(
        completion.text,
        tool_results=[{"tool": result.name, "rows": result.rows} for result in results],
    )

    call = AgentCall(
        id=str(uuid.uuid4()),
        at=at or datetime.now(tz=UTC),
        agent=spec.key,
        officer_id=officer_id,
        case_id=case_id,
        subject_ref=subject_ref,
        provider=provider.name,
        model=completion.model,
        prompt=prompt,
        completion=completion.text,
        tool_calls=[{"tool": r.name, "rows": len(r.rows)} for r in results],
        prompt_tokens=completion.usage.prompt_tokens,
        completion_tokens=completion.usage.completion_tokens,
        cost_inr=completion.usage.cost_inr,
        latency_ms=completion.latency_ms,
        fidelity_ok=report.ok,
        fidelity_detail=report.as_dict(),
    )
    session.add(call)
    session.flush()

    # Logged first, refused second: the attempt is part of the record.
    report.raise_for_status()

    return AgentResult(
        call_id=call.id,
        agent=spec.key,
        text=masker.restore(completion.text),
        raw_text=completion.text,
        fidelity=report,
        completion=completion,
        tool_results=results,
    )
