"""The LLM boundary: one protocol, three adapters, a config switch.

Hosted or on-premise is a setting, not a rewrite.  Everything above this module
talks to :class:`LLMProvider`, so moving from a hosted endpoint to a model
running inside the State Data Centre changes one environment variable.

**No adapter here performs arithmetic, and no tool given to a model does
either.**  A provider returns text and a usage block.  Grounding that text is
:mod:`app.agents.fidelity`'s job, and it runs on every completion without
exception.

The :class:`ScriptedProvider` is not a toy.  It is how the agent layer is
tested offline, including the adversarial test in which the model is told to
invent a figure and the response must be rejected.
"""

from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from collections.abc import Sequence
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Final, Protocol, runtime_checkable

__all__ = [
    "Completion",
    "LLMProvider",
    "LLMUnavailableError",
    "Message",
    "OnPremiseProvider",
    "ScriptedProvider",
    "Usage",
    "build_provider",
]

#: Anything with the shape of an API key, for redaction in an error body.
_SECRET_SHAPED: Final[re.Pattern[str]] = re.compile(
    r"\b(?:sk|tgp|key|api)[-_][A-Za-z0-9_\-]{8,}", re.IGNORECASE
)

#: Rupees per 1,000 tokens.  Zero for an on-premise model, whose cost is the
#: hardware; a hosted model's real rate belongs in configuration, not here.
_UNPRICED: Final[Decimal] = Decimal("0")

#: Placeholder substituted with an exact decimal literal, so no float is ever
#: constructed (gate G1).
_TEMPERATURE_SLOT: Final[str] = "__drishti_temperature__"


#: Sent on every request. Some gateways 403 urllib's default agent.
_USER_AGENT: Final[str] = "GST-DRISHTI/0.1 (Commercial Taxes Department, Maharashtra)"

#: How much of an error body to carry into the exception message.
_DETAIL_CHARS: Final[int] = 300


def _safe_detail(exc: urllib.error.HTTPError) -> str:
    """The endpoint's own error text, with anything secret-shaped removed.

    An error message is an artefact like any other: Law 12 applies to it, and
    a key echoed back by a gateway must not land in a log because somebody
    wanted a better diagnostic.
    """
    try:
        raw = exc.read().decode("utf-8", errors="replace")
    except Exception:
        return "no detail"
    text = " ".join(_SECRET_SHAPED.sub("[redacted]", raw).split())
    return text[:_DETAIL_CHARS] if text else "no detail"


class LLMUnavailableError(RuntimeError):
    """The model could not be reached, or refused the request.

    Raised rather than degraded: an agent that silently returns nothing looks
    to an officer exactly like an agent that found nothing.
    """


@dataclass(frozen=True, slots=True)
class Message:
    role: str
    content: str


@dataclass(frozen=True, slots=True)
class Usage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    #: ``None`` when the deployment does not meter cost, which is the honest
    #: answer for a model running on the department's own hardware.
    cost_inr: Decimal | None = None

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


@dataclass(frozen=True, slots=True)
class Completion:
    text: str
    model: str
    usage: Usage
    latency_ms: int
    #: Whatever the provider returned that is worth keeping in the agent log.
    raw: dict[str, Any] = field(default_factory=dict)


@runtime_checkable
class LLMProvider(Protocol):
    """The whole surface.  Deliberately small."""

    name: str
    model: str

    def complete(
        self,
        messages: Sequence[Message],
        *,
        temperature: Decimal = Decimal("0"),
        max_tokens: int = 1024,
    ) -> Completion: ...


@dataclass(slots=True)
class ScriptedProvider:
    """A provider that replays fixed responses.  Used by every offline test.

    Responses are consumed in order; when they run out the last one repeats, so
    a test that makes an unexpected extra call gets a deterministic answer
    rather than an ``IndexError`` that hides what happened.
    """

    responses: list[str]
    name: str = "scripted"
    model: str = "scripted-v1"
    #: Every prompt this provider was given, for the leak assertions.
    seen: list[tuple[Message, ...]] = field(default_factory=list)
    _index: int = 0

    def complete(
        self,
        messages: Sequence[Message],
        *,
        temperature: Decimal = Decimal("0"),  # noqa: ARG002 - part of the protocol
        max_tokens: int = 1024,  # noqa: ARG002 - part of the protocol
    ) -> Completion:
        if not self.responses:
            raise LLMUnavailableError("the scripted provider has no responses configured")
        self.seen.append(tuple(messages))
        text = self.responses[min(self._index, len(self.responses) - 1)]
        self._index += 1
        prompt_chars = sum(len(message.content) for message in messages)
        return Completion(
            text=text,
            model=self.model,
            usage=Usage(
                prompt_tokens=prompt_chars // 4,
                completion_tokens=len(text) // 4,
                cost_inr=_UNPRICED,
            ),
            latency_ms=0,
        )


@dataclass(slots=True)
class OnPremiseProvider:
    """An OpenAI-compatible endpoint inside the State network.

    vLLM, Ollama and TGI all speak this shape, so the on-premise and hosted
    cases differ only in the base URL and whether a key is sent.  No taxpayer
    data leaves Indian soil on this path, which is the reason it exists.
    """

    base_url: str
    model: str
    name: str = "on_premise"
    api_key: str | None = None
    timeout_s: int = 60

    def complete(
        self,
        messages: Sequence[Message],
        *,
        temperature: Decimal = Decimal("0"),
        max_tokens: int = 1024,
    ) -> Completion:
        # Gate G1: no float exists anywhere in this process, not even for a
        # moment at a wire boundary.  The temperature is substituted into the
        # serialised JSON as an exact decimal literal.
        body_text = json.dumps(
            {
                "model": self.model,
                "messages": [{"role": m.role, "content": m.content} for m in messages],
                "temperature": _TEMPERATURE_SLOT,
                "max_tokens": max_tokens,
                "stream": False,
            }
        )
        payload = body_text.replace(json.dumps(_TEMPERATURE_SLOT), format(temperature, "f")).encode(
            "utf-8"
        )

        headers = {
            "Content-Type": "application/json",
            # Several hosted gateways reject urllib's default agent outright
            # with a 403, which is indistinguishable from a bad key until you
            # read the body. Identify ourselves.
            "User-Agent": _USER_AGENT,
            "Accept": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        request = urllib.request.Request(  # noqa: S310 - the URL is operator-configured
            f"{self.base_url.rstrip('/')}/chat/completions",
            data=payload,
            headers=headers,
            method="POST",
        )

        started = time.monotonic_ns()
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_s) as response:  # noqa: S310
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # The classification is still the exception class, never the text.
            # But the endpoint's own explanation is the difference between an
            # afternoon of guessing and a one-line fix -- "model not
            # serverless" and "bad key" are both 4xx and mean opposite things
            # -- so it is carried through, with anything key-shaped removed.
            raise LLMUnavailableError(
                f"{self.name} at {self.base_url} refused the request "
                f"(HTTP {exc.code}): {_safe_detail(exc)}"
            ) from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise LLMUnavailableError(f"{self.name} at {self.base_url} did not answer") from exc
        latency_ms = (time.monotonic_ns() - started) // 1_000_000

        try:
            text = str(body["choices"][0]["message"]["content"])
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMUnavailableError(f"{self.name} returned no completion") from exc

        usage_block = body.get("usage") or {}
        return Completion(
            text=text,
            model=str(body.get("model", self.model)),
            usage=Usage(
                prompt_tokens=int(usage_block.get("prompt_tokens", 0)),
                completion_tokens=int(usage_block.get("completion_tokens", 0)),
                cost_inr=None,
            ),
            latency_ms=latency_ms,
            raw={"finish_reason": body["choices"][0].get("finish_reason")},
        )


def build_provider() -> LLMProvider:
    """Resolve the configured provider.

    ``DRISHTI_LLM_MODE`` is ``off`` by default.  The platform is fully usable
    with no model at all -- every number on every screen is computed by the
    deterministic engine -- so an unconfigured deployment gets an agent layer
    that refuses rather than an agent layer that guesses.
    """
    mode = os.environ.get("DRISHTI_LLM_MODE", "off").strip().lower()
    if mode in {"on_premise", "hosted"}:
        base_url = os.environ.get("DRISHTI_LLM_BASE_URL", "").strip()
        model = os.environ.get("DRISHTI_LLM_MODEL", "").strip()
        if not base_url or not model:
            raise LLMUnavailableError(
                "DRISHTI_LLM_MODE is set but DRISHTI_LLM_BASE_URL or DRISHTI_LLM_MODEL is not"
            )
        return OnPremiseProvider(
            base_url=base_url,
            model=model,
            name=mode,
            api_key=os.environ.get("DRISHTI_LLM_API_KEY") or None,
        )
    raise LLMUnavailableError(
        "no model is configured (DRISHTI_LLM_MODE=off). Every figure on every screen is "
        "computed without one; the agent layer is optional by design."
    )
