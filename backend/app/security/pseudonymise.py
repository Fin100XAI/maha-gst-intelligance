"""Pseudonymisation of everything that leaves for a model.

A prompt carries ``TP-0447``.  It never carries a GSTIN, a PAN, a trade name, a
legal name, a mobile number, an email address or a bank account.  The reverse
mapping stays server-side, in the :class:`Pseudonymiser` that built the prompt,
and is applied to the completion on the way back so the officer reads real
names on screen.

This is not redaction after the fact.  :func:`Pseudonymiser.text` is the only
way taxpayer text reaches a prompt, and :func:`assert_clean` is run over the
finished prompt as a second, independent check -- a belt over the braces,
because a single missed interpolation is a disclosure.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Final

__all__ = ["LeakDetectedError", "Pseudonymiser", "assert_clean"]

#: The identifiers a prompt must never contain.  GSTIN and PAN are matched by
#: shape, so an identifier that was never registered with the pseudonymiser is
#: still caught.
_GSTIN: Final[re.Pattern[str]] = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")
_PAN: Final[re.Pattern[str]] = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
#: A ten-digit run is a mobile number only when it stands alone.  The digits
#: after a decimal point are a ratio -- a P-Score of 0.6470588235 is not a
#: telephone, and refusing it would make the agent layer unusable.
_MOBILE: Final[re.Pattern[str]] = re.compile(r"(?<![\d.])(?:\+91[\- ]?)?[6-9]\d{9}(?![\d.])")
_EMAIL: Final[re.Pattern[str]] = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]+\b")
#: Only with a banking word beside it.  A bare twelve-digit run is as likely to
#: be an e-way bill number, which the agents legitimately discuss.
_ACCOUNT: Final[re.Pattern[str]] = re.compile(
    r"(?i)\b(?:a/?c|account|bank|ifsc)\b[^\n]{0,24}?\b(\d{9,18})\b"
)

_PATTERNS: Final[tuple[tuple[str, re.Pattern[str]], ...]] = (
    ("GSTIN", _GSTIN),
    ("PAN", _PAN),
    ("mobile number", _MOBILE),
    ("email address", _EMAIL),
    ("bank account number", _ACCOUNT),
)


class LeakDetectedError(ValueError):
    """An identifier reached -- or was about to reach -- a prompt."""


@dataclass(slots=True)
class Pseudonymiser:
    """Stable ``TP-nnnn`` labels for the life of one agent call.

    Labels are assigned in order of first appearance, so the same conversation
    refers to the same taxpayer by the same label, and two different officers'
    conversations do not share labels that could be correlated across sessions.
    """

    _forward: dict[str, str] = field(default_factory=dict)
    _reverse: dict[str, str] = field(default_factory=dict)
    #: Every name to mask for a label.  A taxpayer has a legal name *and* a
    #: trade name, and often a shortened form of each; masking only the last
    #: one registered would disclose the others.
    _names: dict[str, list[str]] = field(default_factory=dict)
    #: The one name to show the officer when the completion comes back.
    _display: dict[str, str] = field(default_factory=dict)
    _next: int = 1

    def label(self, gstin: str, *, display_name: str | None = None) -> str:
        """The pseudonym for a GSTIN, minting one on first sight."""
        existing = self._forward.get(gstin)
        if existing is None:
            existing = f"TP-{self._next:04d}"
            self._next += 1
            self._forward[gstin] = existing
            self._reverse[existing] = gstin
            self._names.setdefault(existing, [])
        if display_name:
            self._add_name(existing, display_name)
        return existing

    def _add_name(self, label: str, name: str) -> None:
        names = self._names.setdefault(label, [])
        if name not in names:
            names.append(name)
        self._display.setdefault(label, name)

    def text(self, value: str) -> str:
        """Replace every registered identifier in ``value`` with its label."""
        out = value
        # Longest first, so a trade name that contains another does not leave a
        # fragment behind.
        for identifier in sorted(self._forward, key=len, reverse=True):
            out = out.replace(identifier, self._forward[identifier])
        pairs = [(name, label) for label, names in self._names.items() for name in names if name]
        for name, label in sorted(pairs, key=lambda pair: len(pair[0]), reverse=True):
            out = out.replace(name, label)
        return out

    def register_name(self, gstin: str, name: str | None) -> None:
        """Teach the pseudonymiser a legal or trade name to mask."""
        if name:
            self._add_name(self.label(gstin), name)

    def restore(self, completion: str) -> str:
        """Put the real names back, for the officer's screen only.

        Never call this on anything that goes back to a model.
        """
        out = completion
        for label, gstin in self._reverse.items():
            out = out.replace(label, self._display.get(label) or gstin)
        return out

    def mapping(self) -> dict[str, str]:
        """The reverse map, for the audit record.  Stays server-side."""
        return dict(self._reverse)


def assert_clean(prompt: str) -> None:
    """Refuse a prompt that still contains an identifier.

    Raised as an error rather than scrubbed silently: a leak means the code
    that built the prompt is wrong, and scrubbing would hide that.
    """
    for label, pattern in _PATTERNS:
        match = pattern.search(prompt)
        if match is not None:
            raise LeakDetectedError(
                f"prompt contains what looks like a {label} at offset {match.start()}; "
                "every identifier must be pseudonymised before it reaches a model"
            )
