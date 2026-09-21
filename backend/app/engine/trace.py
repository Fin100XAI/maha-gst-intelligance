"""Provenance: the Tracer and the deterministic ``calc_id``.

Law 2 says every number rendered anywhere carries a ``calc_id`` that resolves
in one call to the rule or parameter, its legal basis, the formula as executed,
the intermediate terms and the source rows.

``calc_id`` is a **deterministic hash** of what produced the number -- the
subject, the snapshot and the inputs -- and never a random UUID.  Replay
depends on it: running the same snapshot twice must produce byte-identical
``calc_id``s, and ``tests/engine/test_replay.py`` pins that.

It deliberately excludes the engine run id and every timestamp.  If it included
them, two runs over one snapshot would disagree, and the provenance drawer
would become a per-run artefact rather than a property of the computation.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Any, Final

from app.canonical import Period
from app.money import TaxVector

__all__ = [
    "CalcKind",
    "CalcTrace",
    "ParameterUse",
    "TraceStep",
    "Tracer",
    "canonical_value",
]


class CalcKind(StrEnum):
    RULE = "RULE"
    PARAM = "PARAM"
    IDENTITY = "IDENTITY"
    METRIC = "METRIC"
    SCORE = "SCORE"


def canonical_value(value: Any) -> Any:  # noqa: PLR0911 - one return per canonical form
    """Render any engine value as a stable, JSON-safe form.

    Decimals go through their string form so that a hash computed before a
    database round-trip matches one computed after it, and so that no binary
    float can ever enter a calc_id.
    """
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, TaxVector):
        return value.dict()
    if isinstance(value, Period):
        return value.mmyyyy
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): canonical_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        items = [canonical_value(v) for v in value]
        return sorted(items, key=repr) if isinstance(value, (set, frozenset)) else items
    return str(value)


def _digest(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
            "utf-8"
        )
    ).hexdigest()


@dataclass(frozen=True, slots=True)
class TraceStep:
    """One intermediate term, as the drawer lists it."""

    label: str
    expression: str
    inputs: dict[str, Any]
    result: Any

    def as_dict(self) -> dict[str, Any]:
        return {
            "label": self.label,
            "expression": self.expression,
            "inputs": canonical_value(self.inputs),
            "result": canonical_value(self.result),
        }


@dataclass(frozen=True, slots=True)
class ParameterUse:
    """A governed threshold, with the notification that put it there."""

    parameter_id: str
    key: str
    value: str
    effective_from: date | None
    notification_ref: str | None = None
    provisional: bool = True

    def as_dict(self) -> dict[str, Any]:
        return {
            "parameter_id": self.parameter_id,
            "key": self.key,
            "value": self.value,
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "notification_ref": self.notification_ref,
            "provisional": self.provisional,
        }


@dataclass(frozen=True, slots=True)
class CalcTrace:
    """The payload ``GET /calc/{calc_id}`` returns.  This drawer is the product."""

    calc_id: str
    kind: CalcKind
    subject_id: str
    snapshot_id: str
    gstin: str | None
    period: str | None
    fy: str | None
    legal_basis: str | None
    formula_template: str | None
    formula_rendered: str | None
    inputs: dict[str, Any]
    steps: tuple[TraceStep, ...]
    parameters: tuple[ParameterUse, ...]
    evidence_ids: tuple[str, ...]
    result: Any
    engine_version: str
    params_version: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "calc_id": self.calc_id,
            "kind": self.kind.value,
            "subject_id": self.subject_id,
            "snapshot_id": self.snapshot_id,
            "gstin": self.gstin,
            "period": self.period,
            "fy": self.fy,
            "legal_basis": self.legal_basis,
            "formula_template": self.formula_template,
            "formula_rendered": self.formula_rendered,
            "inputs": canonical_value(self.inputs),
            "steps": [step.as_dict() for step in self.steps],
            "parameters": [parameter.as_dict() for parameter in self.parameters],
            "evidence_ids": list(self.evidence_ids),
            "result": canonical_value(self.result),
            "engine_version": self.engine_version,
            "params_version": self.params_version,
        }


#: Bumped when the shape of a trace changes, so a stored calc_id is never
#: silently reinterpreted under a new scheme.
TRACE_SCHEME: Final[str] = "drishti-calc-v1"


@dataclass
class Tracer:
    """Records a computation as it happens, then seals it into a CalcTrace.

    Usage inside a rule::

        tracer = ctx.tracer(CalcKind.RULE, "OUT-01", legal_basis="Rule 88C")
        tracer.note("g1", g1_tax)
        tracer.step("GSTR-1 outward tax", "sum(signed_tax over liability sections)",
                    {"lines": 212}, g1_tax)
        trace = tracer.finish(result=shortfall, formula_template="...",
                              formula_rendered="...")
    """

    kind: CalcKind
    subject_id: str
    snapshot_id: str
    gstin: str | None = None
    period: str | None = None
    fy: str | None = None
    legal_basis: str | None = None
    engine_version: str = "0.1.0"
    params_version: str = "unapproved-defaults"
    inputs: dict[str, Any] = field(default_factory=dict)
    steps: list[TraceStep] = field(default_factory=list)
    parameters: list[ParameterUse] = field(default_factory=list)
    evidence_ids: list[str] = field(default_factory=list)

    def note(self, name: str, value: Any) -> None:
        """Record an input.  Inputs are what the calc_id is computed over."""
        self.inputs[name] = value

    def step(self, label: str, expression: str, inputs: dict[str, Any], result: Any) -> Any:
        """Record an intermediate term and return its result unchanged."""
        self.steps.append(
            TraceStep(label=label, expression=expression, inputs=inputs, result=result)
        )
        return result

    def used_parameter(self, use: ParameterUse) -> None:
        if use not in self.parameters:
            self.parameters.append(use)

    def evidence(self, *row_ids: str | None) -> None:
        for row_id in row_ids:
            if row_id is not None and row_id not in self.evidence_ids:
                self.evidence_ids.append(row_id)

    # -- the hash ----------------------------------------------------------

    def calc_id(self) -> str:
        """Deterministic over (scheme, kind, subject, snapshot, subject scope, inputs).

        Parameters are included because changing a threshold changes the
        computation, and a drawer that showed the new threshold under the old
        calc_id would misdescribe what was actually run.
        """
        return _digest(
            {
                "scheme": TRACE_SCHEME,
                "kind": self.kind.value,
                "subject": self.subject_id,
                "snapshot": self.snapshot_id,
                "gstin": self.gstin,
                "period": self.period,
                "fy": self.fy,
                "inputs": canonical_value(self.inputs),
                "parameters": [p.as_dict() for p in self.parameters],
            }
        )

    def finish(
        self,
        *,
        result: Any,
        formula_template: str | None = None,
        formula_rendered: str | None = None,
    ) -> CalcTrace:
        return CalcTrace(
            calc_id=self.calc_id(),
            kind=self.kind,
            subject_id=self.subject_id,
            snapshot_id=self.snapshot_id,
            gstin=self.gstin,
            period=self.period,
            fy=self.fy,
            legal_basis=self.legal_basis,
            formula_template=formula_template,
            formula_rendered=formula_rendered,
            inputs=dict(self.inputs),
            steps=tuple(self.steps),
            parameters=tuple(self.parameters),
            evidence_ids=tuple(self.evidence_ids),
            result=result,
            engine_version=self.engine_version,
            params_version=self.params_version,
        )


def render_formula(template: str, values: dict[str, Any]) -> str:
    """Substitute actual values into a formula template.

    The drawer shows both: the formula as written, and the formula as executed.
    An officer reading ``38,42,110.00 = 38,42,110.00 - 0.00`` can check the
    arithmetic without trusting the engine.
    """
    rendered = template
    for name, value in values.items():
        shown = canonical_value(value)
        if isinstance(shown, dict):
            shown = " / ".join(f"{k.upper()} {v}" for k, v in shown.items())
        rendered = rendered.replace(f"{{{name}}}", str(shown))
    return rendered
