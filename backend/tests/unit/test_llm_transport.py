"""The HTTP details that decide whether a hosted model answers at all.

Both tests here exist because of the same afternoon. Pointing the provider at
Together AI returned ``HTTP 403 Forbidden``, which reads as "your key is
wrong". The key was fine: the gateway rejects urllib's default ``User-Agent``.
The 403 was undiagnosable from the platform because the error handler threw the
response body away, so the message said only that the endpoint "did not
answer" -- when in fact it had answered, at length, explaining the problem.

Offline throughout: the transport is exercised against a stub opener, never a
network.
"""

from __future__ import annotations

import io
import json
import urllib.error
from decimal import Decimal
from typing import Any

import pytest

from app.agents.provider import (
    LLMUnavailableError,
    Message,
    OnPremiseProvider,
    _safe_detail,
)

PROMPT = [Message(role="user", content="hello")]


def _body(text: str = "ok") -> bytes:
    return json.dumps(
        {
            "model": "test-model",
            "choices": [{"message": {"content": text}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 1},
        }
    ).encode("utf-8")


class _Response(io.BytesIO):
    def __enter__(self) -> _Response:
        return self

    def __exit__(self, *_: object) -> None:
        return None


class TestTheRequestIdentifiesItself:
    def test_a_user_agent_is_sent(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Several hosted gateways 403 urllib's default agent outright."""
        seen: dict[str, Any] = {}

        def fake_urlopen(request: Any, timeout: int = 0) -> _Response:
            seen["headers"] = dict(request.headers)
            return _Response(_body())

        monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
        provider = OnPremiseProvider(base_url="https://example.invalid/v1", model="test-model")
        provider.complete(PROMPT, temperature=Decimal("0"), max_tokens=8)

        # urllib title-cases header names.
        agent = seen["headers"].get("User-agent", "")
        # The product token names the platform and carries no space: a space
        # in a User-Agent product token is a malformed header, which is what
        # renaming it to "GST Intelligence/0.1" produced before this caught it.
        assert agent.startswith("GST-Intelligence/")
        assert "urllib" not in agent.lower()

    def test_the_key_is_sent_as_a_bearer_token_and_nowhere_else(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Law 12: a key belongs in one header, never in a URL or a body."""
        seen: dict[str, Any] = {}

        def fake_urlopen(request: Any, timeout: int = 0) -> _Response:
            seen["headers"] = dict(request.headers)
            seen["url"] = request.full_url
            seen["data"] = request.data.decode("utf-8")
            return _Response(_body())

        monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
        provider = OnPremiseProvider(
            base_url="https://example.invalid/v1", model="test-model", api_key="tgp_v1_secretvalue"
        )
        provider.complete(PROMPT, temperature=Decimal("0"), max_tokens=8)

        assert seen["headers"]["Authorization"] == "Bearer tgp_v1_secretvalue"
        assert "tgp_v1_secretvalue" not in seen["url"]
        assert "tgp_v1_secretvalue" not in seen["data"]


class TestAFailureExplainsItself:
    def _raise(self, code: int, payload: str) -> Any:
        def fake_urlopen(request: Any, timeout: int = 0) -> None:
            raise urllib.error.HTTPError(
                url="https://example.invalid/v1/chat/completions",
                code=code,
                msg="nope",
                hdrs=None,  # type: ignore[arg-type]
                fp=io.BytesIO(payload.encode("utf-8")),
            )

        return fake_urlopen

    def test_the_status_and_the_endpoints_own_words_reach_the_message(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """ "Model not serverless" and "bad key" are both 4xx and opposite."""
        monkeypatch.setattr(
            "urllib.request.urlopen",
            self._raise(400, '{"error": {"message": "Unable to access non-serverless model X"}}'),
        )
        provider = OnPremiseProvider(base_url="https://example.invalid/v1", model="X")

        with pytest.raises(LLMUnavailableError) as caught:
            provider.complete(PROMPT, temperature=Decimal("0"), max_tokens=8)

        assert "400" in str(caught.value)
        assert "non-serverless" in str(caught.value)

    @pytest.mark.golden
    def test_a_key_echoed_back_by_the_gateway_is_redacted(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Law 12 applies to an error message like any other artefact.

        Some gateways quote the offending credential straight back at you. A
        better diagnostic must not become the thing that writes a live key
        into a log file.
        """
        monkeypatch.setattr(
            "urllib.request.urlopen",
            self._raise(401, '{"error": "invalid key tgp_v1_fgW0lK2iEvAhYnfRQpyyp"}'),
        )
        provider = OnPremiseProvider(base_url="https://example.invalid/v1", model="X")

        with pytest.raises(LLMUnavailableError) as caught:
            provider.complete(PROMPT, temperature=Decimal("0"), max_tokens=8)

        message = str(caught.value)
        assert "tgp_v1_fgW0lK2iEvAhYnfRQpyyp" not in message
        assert "[redacted]" in message
        assert "401" in message

    def test_a_connection_that_never_answered_says_so_instead(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """No response is a different fact from a refusal, and reads as one."""

        def fake_urlopen(request: Any, timeout: int = 0) -> None:
            raise urllib.error.URLError("unreachable")

        monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
        provider = OnPremiseProvider(base_url="https://example.invalid/v1", model="X")

        with pytest.raises(LLMUnavailableError, match="did not answer"):
            provider.complete(PROMPT, temperature=Decimal("0"), max_tokens=8)


class TestRedaction:
    @pytest.mark.parametrize(
        "secret",
        [
            "tgp_v1_abcdefghijklmnop",
            "sk-proj-abcdefghijklmnop",
            "api_key_abcdefghijklmnop",
        ],
    )
    def test_every_key_shape_is_caught(self, secret: str) -> None:
        error = urllib.error.HTTPError(
            url="u", code=401, msg="m", hdrs=None, fp=io.BytesIO(f"bad {secret}".encode())
        )
        assert secret not in _safe_detail(error)

    def test_an_unreadable_body_is_not_a_second_failure(self) -> None:
        error = urllib.error.HTTPError(url="u", code=500, msg="m", hdrs=None, fp=None)
        assert _safe_detail(error) == "no detail"
