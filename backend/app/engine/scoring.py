"""The two scores.  They are never fused.

**P-Score** answers *who should we audit*, from the P01-P34 flags.  It always
travels with its **coverage**: a P-Score of 62 computed over 21 of 34 parameters
is a different statement from 62 over all 34, and an auditor must never be shown
the former as if it were the latter.

**F-Score** answers *what can we demand, and on what evidence*, from quantified
rule findings.

Different questions, different evidentiary weight.  A Commissioner shown a
single fused score loses the ability to ask either of them, so this module
returns two objects and there is no function that combines them.

**No machine-learning model influences either score.**  Every number here is
a pure Decimal computation with a waterfall that decomposes it exactly -- a
score an officer cannot decompose is a score an officer will not act on.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, localcontext
from typing import Any, Final

from app.canonical import Confidence, FindingStatus, Period, RiskBand, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.params_p01_p34 import PARAMETERS, ParamResult
from app.engine.registry import Finding
from app.engine.trace import CalcKind, CalcTrace

__all__ = [
    "FScore",
    "PScore",
    "WaterfallEntry",
    "compute_f_score",
    "compute_p_score",
]

_ZERO: Final[Decimal] = Decimal("0.00")
_ONE: Final[Decimal] = Decimal("1")
_HUNDRED: Final[Decimal] = Decimal("100")
_FOUR: Final[Decimal] = Decimal("4")
_LAKH: Final[Decimal] = Decimal("100000")
#: Euler's number, to the working precision.  Used by the materiality
#: denominator in docs/01 section C4.
_E: Final[Decimal] = Decimal("2.718281828459045235360287471")
_SCORE_QUANT: Final[Decimal] = Decimal("0.01")
_POINT_QUANT: Final[Decimal] = Decimal("0.000001")


# ---------------------------------------------------------------------------
# P-Score
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class PScore:
    """The audit-selection score, always rendered beside its coverage."""

    score: Decimal
    coverage: Decimal
    evaluated: int
    total: int
    band: RiskBand
    waterfall: tuple[dict[str, Any], ...]
    not_evaluated: tuple[dict[str, str], ...]
    trace: CalcTrace

    @property
    def calc_id(self) -> str:
        return self.trace.calc_id

    @property
    def coverage_sentence(self) -> str:
        """The sentence that belongs on the Commissioner's first screen."""
        dark = self.total - self.evaluated
        if dark == 0:
            return f"P-Score computed over all {self.total} parameters."

        # Two different kinds of darkness, and conflating them would overstate
        # the integration case: some parameters await an external feed, others
        # await this taxpayer's own data.
        awaiting_feed = [row for row in self.not_evaluated if row.get("feed")]
        feeds = sorted({row["feed"] for row in awaiting_feed})
        clauses: list[str] = []
        if feeds:
            clauses.append(f"{len(awaiting_feed)} await {', '.join(feeds)}")
        local = dark - len(awaiting_feed)
        if local:
            clauses.append(f"{local} lack the taxpayer's own data")
        tail = f" -- {'; '.join(clauses)}" if clauses else ""
        return f"P-Score computed over {self.evaluated} of {self.total} parameters{tail}."

    def as_dict(self) -> dict[str, Any]:
        return {
            "p_score": format(self.score, "f"),
            "p_coverage": format(self.coverage, "f"),
            "p_evaluated": self.evaluated,
            "p_total": self.total,
            "p_band": self.band.value,
            "coverage_sentence": self.coverage_sentence,
            "waterfall": list(self.waterfall),
            "not_evaluated": list(self.not_evaluated),
            "calc_id": self.calc_id,
        }


def _p_band(score: Decimal, ctx: RuleContext) -> RiskBand:
    low = ctx.params.get("PSCORE", "band_low_max", on=ctx.fy.end).decimal
    moderate = ctx.params.get("PSCORE", "band_moderate_max", on=ctx.fy.end).decimal
    high = ctx.params.get("PSCORE", "band_high_max", on=ctx.fy.end).decimal
    if score <= low:
        return RiskBand.LOW
    if score <= moderate:
        return RiskBand.MODERATE
    if score <= high:
        return RiskBand.HIGH
    return RiskBand.SEVERE


def compute_p_score(ctx: RuleContext, results: list[ParamResult]) -> PScore:
    """``100 x sum(flag x weight) / sum(4 x weight)`` over EVALUATED parameters.

    A NOT_EVALUATED parameter is excluded from **both** the numerator and the
    denominator, so coverage falls rather than the score being silently
    understated.  Defaulting one to Flag 0 would make a taxpayer with ten dark
    parameters look safer than one with ten evaluated zeros, which is the quiet
    failure that makes a risk score a lie.
    """
    tracer = ctx.tracer(CalcKind.SCORE, "P-SCORE")
    tracer.note("fy", ctx.fy.label)

    numerator = _ZERO
    denominator = _ZERO
    waterfall: list[dict[str, Any]] = []
    dark: list[dict[str, str]] = []

    for result in results:
        if not result.evaluated:
            dark.append(
                {
                    "param_id": result.param_id,
                    "title": result.title,
                    "reason": "; ".join(result.missing_inputs),
                    "feed": result.external_feed or "",
                    "roadmap_ref": result.roadmap_ref or "",
                }
            )
            continue
        flag = Decimal(result.flag or 0)
        contribution = (flag * result.weight).quantize(_POINT_QUANT)
        capacity = (_FOUR * result.weight).quantize(_POINT_QUANT)
        numerator += contribution
        denominator += capacity
        waterfall.append(
            {
                "param_id": result.param_id,
                "title": result.title,
                "flag": result.flag,
                "weight": format(result.weight, "f"),
                "contribution": format(contribution, "f"),
                "capacity": format(capacity, "f"),
                "calc_id": result.calc_id,
            }
        )

    evaluated = len(waterfall)
    total = len(PARAMETERS)

    tracer.step("evaluated parameters", "count(flag is not null)", {"total": total}, evaluated)
    tracer.step("weighted flags", "sum(flag x weight)", {}, numerator)
    tracer.step(
        "weighted capacity", "sum(4 x weight) over evaluated parameters only", {}, denominator
    )

    score = (
        (numerator / denominator * _HUNDRED).quantize(_SCORE_QUANT) if denominator > 0 else _ZERO
    )
    coverage = (Decimal(evaluated) / Decimal(total)).quantize(Decimal("0.0001"))

    tracer.step("P-Score", "100 x weighted flags / weighted capacity", {}, score)
    tracer.step("coverage", "evaluated / 34", {}, coverage)
    tracer.note("score", score)
    tracer.note("coverage", coverage)
    tracer.note("evaluated", evaluated)

    band = _p_band(score, ctx)
    trace = tracer.finish(
        result=score,
        formula_template="P-Score = 100 x sum(flag_i x weight_i) / sum(4 x weight_i), "
        "over EVALUATED parameters only",
        formula_rendered=f"100 x {numerator} / {denominator} = {score} "
        f"(coverage {evaluated}/{total})",
    )
    return PScore(
        score=score,
        coverage=coverage,
        evaluated=evaluated,
        total=total,
        band=band,
        waterfall=tuple(waterfall),
        not_evaluated=tuple(dark),
        trace=trace,
    )


# ---------------------------------------------------------------------------
# F-Score
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class WaterfallEntry:
    """One finding's exact point contribution, as the waterfall renders it."""

    rule_id: str
    period: str | None
    dimension: str
    severity: str
    confidence: str
    tax_effect: str
    materiality: str
    confidence_factor: str
    recency_factor: str
    severity_weight: str
    rule_weight: str
    points: str
    calc_id: str | None

    def as_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "period": self.period,
            "dimension": self.dimension,
            "severity": self.severity,
            "confidence": self.confidence,
            "tax_effect": self.tax_effect,
            "materiality": self.materiality,
            "confidence_factor": self.confidence_factor,
            "recency_factor": self.recency_factor,
            "severity_weight": self.severity_weight,
            "rule_weight": self.rule_weight,
            "points": self.points,
            "calc_id": self.calc_id,
        }


@dataclass(frozen=True, slots=True)
class FScore:
    """The findings score, decomposable to the last paisa of contribution."""

    score: Decimal
    band: str
    dimension_scores: dict[str, Decimal]
    dimension_points: dict[str, Decimal]
    dimension_contributions: dict[str, Decimal]
    waterfall: tuple[WaterfallEntry, ...]
    trace: CalcTrace

    @property
    def calc_id(self) -> str:
        return self.trace.calc_id

    def as_dict(self) -> dict[str, Any]:
        return {
            "f_score": format(self.score, "f"),
            "f_band": self.band,
            "dimension_scores": {k: format(v, "f") for k, v in self.dimension_scores.items()},
            "dimension_points": {k: format(v, "f") for k, v in self.dimension_points.items()},
            "dimension_contributions": {
                k: format(v, "f") for k, v in self.dimension_contributions.items()
            },
            "waterfall": [entry.as_dict() for entry in self.waterfall],
            "calc_id": self.calc_id,
        }


_SEVERITY_KEY: Final[dict[Severity, str]] = {
    Severity.LOW: "severity_low",
    Severity.MEDIUM: "severity_medium",
    Severity.HIGH: "severity_high",
    Severity.CRITICAL: "severity_critical",
}

_CONFIDENCE_KEY: Final[dict[Confidence, str]] = {
    Confidence.CERTAIN: "confidence_certain",
    Confidence.STRONG: "confidence_strong",
    Confidence.ADVISORY: "confidence_advisory",
}

_DIMENSION_WEIGHT_KEY: Final[dict[RiskDimension, str]] = {
    RiskDimension.LIABILITY: "weight_liability",
    RiskDimension.CREDIT: "weight_credit",
    RiskDimension.MOVEMENT: "weight_movement",
    RiskDimension.PAYMENT: "weight_payment",
    RiskDimension.BEHAVIOUR: "weight_behaviour",
    RiskDimension.NETWORK: "weight_network",
}


def _materiality(tax_effect: Decimal, turnover: Decimal) -> Decimal:
    """``min(1, ln(1 + effect/1e5) / ln(1 + turnover/1e5 + e))``.

    Computed entirely in Decimal.  A 5 lakh finding against a 10 crore taxpayer
    and the same finding against a 50 lakh taxpayer are not the same event, and
    this is what says so.
    """
    if tax_effect <= 0:
        return _ZERO
    with localcontext() as context:
        context.prec = 28
        numerator = (_ONE + tax_effect / _LAKH).ln()
        denominator = (_ONE + turnover / _LAKH + _E).ln()
        if denominator <= 0:
            return _ONE
        ratio = numerator / denominator
    return min(_ONE, ratio).quantize(_POINT_QUANT)


def _recency(periods_since: int) -> Decimal:
    """``0.5 ** (periods_since / 12)`` -- a two-year half-life on the exponent."""
    if periods_since <= 0:
        return _ONE
    with localcontext() as context:
        context.prec = 28
        exponent = Decimal(periods_since) / Decimal(12)
        value = Decimal("0.5") ** exponent
    return value.quantize(_POINT_QUANT)


def _saturate(points: Decimal, k: Decimal) -> Decimal:
    """``100 x (1 - exp(-points / k))``.

    Saturating rather than linear so that a taxpayer with forty small findings
    does not outrank one with a single fatal finding.
    """
    if points <= 0:
        return _ZERO
    with localcontext() as context:
        context.prec = 28
        value = _HUNDRED * (_ONE - (-(points / k)).exp())
    return value.quantize(_SCORE_QUANT)


def _f_band(score: Decimal, ctx: RuleContext) -> str:
    green = ctx.params.get("FSCORE", "band_green_max", on=ctx.fy.end).decimal
    amber = ctx.params.get("FSCORE", "band_amber_max", on=ctx.fy.end).decimal
    orange = ctx.params.get("FSCORE", "band_orange_max", on=ctx.fy.end).decimal
    if score <= green:
        return "GREEN"
    if score <= amber:
        return "AMBER"
    if score <= orange:
        return "ORANGE"
    return "RED"


def compute_f_score(ctx: RuleContext, findings: list[Finding]) -> FScore:
    """Deterministic, explainable, no model.

    Suppressed and NOT_EVALUATED findings contribute nothing: a finding that
    was never evaluated cannot raise a score, and a finding suppressed by the
    s.128A amnesty is not a live exposure.
    """
    tracer = ctx.tracer(CalcKind.SCORE, "F-SCORE")
    turnover = ctx.annual_turnover
    tracer.note("turnover", turnover)

    k_scale = ctx.params.get("FSCORE", "k_scale", on=ctx.fy.end).decimal
    tracer.used_parameter(ctx.params.get("FSCORE", "k_scale", on=ctx.fy.end).use())

    severity_weights = {
        severity: ctx.params.get("FSCORE", key, on=ctx.fy.end).decimal
        for severity, key in _SEVERITY_KEY.items()
    }
    confidence_factors = {
        confidence: ctx.params.get("FSCORE", key, on=ctx.fy.end).decimal
        for confidence, key in _CONFIDENCE_KEY.items()
    }

    latest = max(
        (f.period for f in findings if f.period is not None),
        default=Period(ctx.fy.start_year + 1, 3),
    )

    points_by_dimension: dict[str, Decimal] = {d.value: _ZERO for d in RiskDimension}
    waterfall: list[WaterfallEntry] = []

    for finding in findings:
        if finding.status is not FindingStatus.TRIGGERED:
            continue
        effect = finding.delta.abs_total
        if effect == 0:
            effect = finding.taxable_value_effect.copy_abs()
        materiality = _materiality(effect, turnover)
        confidence_factor = confidence_factors[finding.confidence]
        periods_since = latest.months_since(finding.period) if finding.period else 0
        recency = _recency(max(0, periods_since))
        severity_weight = severity_weights[finding.severity]
        rule_weight = ctx.params.maybe("RULEWEIGHT", finding.rule_id, on=ctx.fy.end) or None
        weight = rule_weight.decimal if rule_weight is not None else _ONE

        points = (severity_weight * materiality * confidence_factor * recency * weight).quantize(
            _POINT_QUANT
        )
        points_by_dimension[finding.dimension.value] += points

        waterfall.append(
            WaterfallEntry(
                rule_id=finding.rule_id,
                period=finding.period.mmyyyy if finding.period else None,
                dimension=finding.dimension.value,
                severity=finding.severity.value,
                confidence=finding.confidence.value,
                tax_effect=format(effect, "f"),
                materiality=format(materiality, "f"),
                confidence_factor=format(confidence_factor, "f"),
                recency_factor=format(recency, "f"),
                severity_weight=format(severity_weight, "f"),
                rule_weight=format(weight, "f"),
                points=format(points, "f"),
                calc_id=finding.calc_id,
            )
        )

    dimension_scores: dict[str, Decimal] = {}
    dimension_contributions: dict[str, Decimal] = {}
    score = _ZERO

    for dimension in RiskDimension:
        key = dimension.value
        points = points_by_dimension[key]
        dimension_score = _saturate(points, k_scale)
        dimension_scores[key] = dimension_score
        weight_param = ctx.params.get("FSCORE", _DIMENSION_WEIGHT_KEY[dimension], on=ctx.fy.end)
        tracer.used_parameter(weight_param.use())
        contribution = (dimension_score * weight_param.decimal).quantize(_SCORE_QUANT)
        dimension_contributions[key] = contribution
        score += contribution
        tracer.step(
            f"{key} dimension",
            "100 x (1 - exp(-points / k)), then x the dimension weight",
            {"points": points, "k": k_scale, "weight": weight_param.decimal},
            contribution,
        )

    score = score.quantize(_SCORE_QUANT)
    tracer.note("score", score)
    tracer.note("findings_counted", len(waterfall))

    trace = tracer.finish(
        result=score,
        formula_template="points = severity x materiality x confidence x recency x rule weight; "
        "score(d) = 100 x (1 - exp(-sum points(d) / k)); F-Score = sum(w_d x score(d))",
        formula_rendered=" + ".join(
            f"{key} {value}" for key, value in dimension_contributions.items() if value > 0
        )
        + f" = {score}",
    )
    return FScore(
        score=score,
        band=_f_band(score, ctx),
        dimension_scores=dimension_scores,
        dimension_points=points_by_dimension,
        dimension_contributions=dimension_contributions,
        waterfall=tuple(waterfall),
        trace=trace,
    )
