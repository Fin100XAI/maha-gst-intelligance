"""The rule contract and the registry.

A rule is a pure function of a :class:`~app.engine.context.RuleContext` that
returns a list of :class:`Finding`.  It performs no I/O, reads no clock, uses
no randomness and mutates nothing -- that is what makes the engine replayable.

Confidence drives workflow, and the constraint that keeps the platform
defensible is here rather than in the UI:

* ``CERTAIN``  -- an arithmetic identity over departmental data.  May populate a
  draft notice.
* ``STRONG``   -- a statutory test on complete data.  May populate a draft notice.
* ``ADVISORY`` -- a pattern, an indicator, a graph.  May populate a **worklist
  only**, and :meth:`Finding.may_populate_notice` refuses it.

An ADVISORY finding reaching a notice template without an explicit human
promotion step is the single failure that would end the platform's credibility,
so it is refused in code and tested adversarially.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass, field, replace
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, FindingStatus, Period, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.trace import CalcKind, CalcTrace
from app.money import TaxVector

__all__ = [
    "RULES",
    "Finding",
    "RuleSpec",
    "clear_registry",
    "rule",
    "rules_in_order",
]

_ZERO: Final[Decimal] = Decimal("0.00")


@dataclass(frozen=True, slots=True)
class Finding:
    """One rule outcome for one taxpayer and period, head-wise throughout."""

    rule_id: str
    status: FindingStatus
    severity: Severity
    confidence: Confidence
    dimension: RiskDimension
    title: str
    legal_basis: str
    gstin: str
    period: Period | None = None
    fy: str | None = None

    observed: TaxVector = field(default_factory=TaxVector)
    expected: TaxVector = field(default_factory=TaxVector)
    delta: TaxVector = field(default_factory=TaxVector)
    taxable_value_effect: Decimal = _ZERO
    interest: Decimal = _ZERO
    penalty: Decimal = _ZERO

    #: Required whenever status is NOT_EVALUATED.  Never "no issue found".
    missing_inputs: tuple[str, ...] = ()
    evidence_ids: tuple[str, ...] = ()
    suggested_form: ActionForm | None = None
    suppressed_by: str | None = None
    narrative: str | None = None
    trace: CalcTrace | None = None
    related_params: tuple[str, ...] = ()
    extra: dict[str, object] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.status is FindingStatus.NOT_EVALUATED and not self.missing_inputs:
            raise ValueError(
                f"{self.rule_id}: NOT_EVALUATED must name the missing dataset(s). "
                "Reporting 'no issue found' when a rule could not run is Law 5's "
                "quiet failure."
            )

    @property
    def calc_id(self) -> str | None:
        return self.trace.calc_id if self.trace is not None else None

    @property
    def triggered(self) -> bool:
        return self.status is FindingStatus.TRIGGERED

    @property
    def may_populate_notice(self) -> bool:
        """ADVISORY findings populate a worklist, never a notice.

        Promotion to a notice is an explicit human act recorded in the audit
        chain; there is no code path that does it automatically.
        """
        return (
            self.status is FindingStatus.TRIGGERED
            and self.confidence in {Confidence.CERTAIN, Confidence.STRONG}
            and self.suppressed_by is None
        )

    def suppress(self, reason: str) -> Finding:
        """Suppressed findings stay visible and labelled; they are never deleted."""
        return replace(self, status=FindingStatus.SUPPRESSED, suppressed_by=reason)

    def as_dict(self) -> dict[str, object]:
        return {
            "rule_id": self.rule_id,
            "title": self.title,
            "status": self.status.value,
            "severity": self.severity.value,
            "confidence": self.confidence.value,
            "dimension": self.dimension.value,
            "legal_basis": self.legal_basis,
            "gstin": self.gstin,
            "period": self.period.mmyyyy if self.period else None,
            "fy": self.fy,
            "observed": self.observed.dict(),
            "expected": self.expected.dict(),
            "delta": self.delta.dict(),
            "delta_total": format(self.delta.total, "f"),
            "delta_abs_total": format(self.delta.abs_total, "f"),
            "taxable_value_effect": format(self.taxable_value_effect, "f"),
            "interest": format(self.interest, "f"),
            "penalty": format(self.penalty, "f"),
            "missing_inputs": list(self.missing_inputs),
            "evidence_ids": list(self.evidence_ids),
            "suggested_form": self.suggested_form.value if self.suggested_form else None,
            "suppressed_by": self.suppressed_by,
            "narrative": self.narrative,
            "related_params": list(self.related_params),
            "calc_id": self.calc_id,
            "formula_rendered": self.trace.formula_rendered if self.trace else None,
            "may_populate_notice": self.may_populate_notice,
        }


RuleFunction = Callable[[RuleContext], list[Finding]]


@dataclass(frozen=True, slots=True)
class RuleSpec:
    """Everything the Rule Library screen shows about a rule."""

    id: str
    title: str
    family: str
    dimension: RiskDimension
    legal_basis: str
    severity: Severity
    confidence: Confidence
    requires: tuple[str, ...]
    params: tuple[str, ...]
    relates_to: tuple[str, ...]
    suggested_form: ActionForm | None
    function: RuleFunction
    threshold_note: str | None = None

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "title": self.title,
            "family": self.family,
            "dimension": self.dimension.value,
            "legal_basis": self.legal_basis,
            "severity": self.severity.value,
            "confidence": self.confidence.value,
            "requires": list(self.requires),
            "params": list(self.params),
            "relates_to": list(self.relates_to),
            "suggested_form": self.suggested_form.value if self.suggested_form else None,
            "threshold": self.threshold_note,
        }


#: The single registry.  Populated by the @rule decorator at import time, which
#: is the one import-time side effect this codebase allows, and it is confined
#: to this module's decorator.
RULES: Final[dict[str, RuleSpec]] = {}


def clear_registry() -> None:
    """Only for tests that register a throwaway rule."""
    RULES.clear()


def rule(
    *,
    id: str,
    title: str,
    family: str,
    dimension: RiskDimension,
    legal_basis: str,
    severity: Severity,
    confidence: Confidence,
    requires: Sequence[str] = (),
    params: Sequence[str] = (),
    relates_to: Sequence[str] = (),
    form: ActionForm | None = None,
    threshold: str | None = None,
) -> Callable[[RuleFunction], RuleFunction]:
    """Register a detection rule.

    ``legal_basis`` is mandatory and must be non-empty: a finding an officer
    cannot trace to a provision is a finding they cannot act on.
    """

    def decorate(function: RuleFunction) -> RuleFunction:
        if not legal_basis.strip():
            raise ValueError(f"{id}: legal_basis is mandatory")
        if id in RULES:
            raise ValueError(f"{id}: already registered")
        RULES[id] = RuleSpec(
            id=id,
            title=title,
            family=family,
            dimension=dimension,
            legal_basis=legal_basis,
            severity=severity,
            confidence=confidence,
            requires=tuple(requires),
            params=tuple(params),
            relates_to=tuple(relates_to),
            suggested_form=form,
            function=function,
            threshold_note=threshold,
        )
        return function

    return decorate


def rules_in_order() -> list[RuleSpec]:
    """Deterministic execution order: family, then numeric id.

    Ordering is part of replay.  ``OUT-01`` before ``OUT-02`` before ``ITC-01``,
    always, so two runs produce findings in the same sequence.
    """
    family_order = {
        "OUT": 0,
        "ITC": 1,
        "PAY": 2,
        "BEH": 3,
        "EWB": 4,
        "EIN": 5,
        "REG": 6,
        "SEC": 7,
        "NET": 8,
    }

    def sort_key(spec: RuleSpec) -> tuple[int, str, int]:
        prefix, _, number = spec.id.partition("-")
        return (family_order.get(prefix, 99), prefix, int(number) if number.isdigit() else 0)

    return sorted(RULES.values(), key=sort_key)


# ---------------------------------------------------------------------------
# helpers rules share
# ---------------------------------------------------------------------------


def not_evaluated(
    ctx: RuleContext,
    spec_id: str,
    missing: tuple[str, ...],
    *,
    period: Period | None = None,
) -> Finding:
    """The honest answer when a rule cannot run.

    Names the exact missing dataset, and is rendered on screen under
    "Could not be evaluated -- missing data" rather than among the clear rules.
    """
    spec = RULES[spec_id]
    tracer = ctx.tracer(CalcKind.RULE, spec_id, period=period, legal_basis=spec.legal_basis)
    tracer.note("missing_inputs", list(missing))
    return Finding(
        rule_id=spec_id,
        status=FindingStatus.NOT_EVALUATED,
        severity=spec.severity,
        confidence=spec.confidence,
        dimension=spec.dimension,
        title=spec.title,
        legal_basis=spec.legal_basis,
        gstin=ctx.gstin,
        period=period,
        fy=ctx.fy.label,
        missing_inputs=missing,
        related_params=spec.relates_to,
        trace=tracer.finish(result=None),
    )


def clear(
    ctx: RuleContext,
    spec_id: str,
    *,
    period: Period | None = None,
    trace: CalcTrace | None = None,
    observed: TaxVector | None = None,
    narrative: str | None = None,
) -> Finding:
    """A rule that ran and found nothing.

    Showing *why* a rule did not fire is as important as showing why it did: it
    is how an officer learns to trust the engine's silence, and silence is most
    of what the engine produces.
    """
    spec = RULES[spec_id]
    if trace is None:
        # Every finding carries a calc_id, including a clear one: an officer
        # asking "why did this NOT fire?" needs the same drawer as one asking
        # why it did.
        tracer = ctx.tracer(CalcKind.RULE, spec_id, period=period, legal_basis=spec.legal_basis)
        tracer.note("outcome", "CLEAR")
        if narrative:
            tracer.note("reason", narrative)
        trace = tracer.finish(result=None, formula_rendered=narrative)
    return Finding(
        rule_id=spec_id,
        status=FindingStatus.CLEAR,
        severity=spec.severity,
        confidence=spec.confidence,
        dimension=spec.dimension,
        title=spec.title,
        legal_basis=spec.legal_basis,
        gstin=ctx.gstin,
        period=period,
        fy=ctx.fy.label,
        observed=observed or TaxVector(),
        related_params=spec.relates_to,
        narrative=narrative,
        trace=trace,
    )


def triggered(
    ctx: RuleContext,
    spec_id: str,
    *,
    period: Period | None = None,
    observed: TaxVector | None = None,
    expected: TaxVector | None = None,
    delta: TaxVector | None = None,
    taxable_value_effect: Decimal = _ZERO,
    interest: Decimal = _ZERO,
    penalty: Decimal = _ZERO,
    trace: CalcTrace | None = None,
    narrative: str | None = None,
    severity: Severity | None = None,
    confidence: Confidence | None = None,
    form: ActionForm | None = None,
    evidence_ids: tuple[str, ...] = (),
    extra: dict[str, object] | None = None,
) -> Finding:
    spec = RULES[spec_id]
    return Finding(
        rule_id=spec_id,
        status=FindingStatus.TRIGGERED,
        severity=severity or spec.severity,
        confidence=confidence or spec.confidence,
        dimension=spec.dimension,
        title=spec.title,
        legal_basis=spec.legal_basis,
        gstin=ctx.gstin,
        period=period,
        fy=ctx.fy.label,
        observed=observed or TaxVector(),
        expected=expected or TaxVector(),
        delta=delta or TaxVector(),
        taxable_value_effect=taxable_value_effect,
        interest=interest,
        penalty=penalty,
        evidence_ids=evidence_ids or (tuple(trace.evidence_ids) if trace else ()),
        suggested_form=form or spec.suggested_form,
        narrative=narrative,
        related_params=spec.relates_to,
        trace=trace,
        extra=extra or {},
    )


def escalate(severity: Severity) -> Severity:
    """One level up, for a post-hard-lock breach.

    A GSTR-1 vs 3B mismatch after July 2025 is structurally near-impossible,
    which makes any residual mismatch a far stronger signal than the same
    number before the lock.
    """
    ladder = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL]
    index = ladder.index(severity)
    return ladder[min(index + 1, len(ladder) - 1)]
