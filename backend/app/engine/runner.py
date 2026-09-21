"""Engine orchestration.

    resolve dependencies -> run rules in deterministic ID order
    -> a missing dataset yields NOT_EVALUATED naming it
    -> apply suppressions (s.128A amnesty, limitation, accepted prior replies)
    -> score -> persist under one engine_run_id

Suppressed findings stay visible and labelled.  They are never deleted, because
an officer needs to see that the platform considered a period and set it aside,
and why.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from typing import Any

from app.canonical import FindingStatus

# Importing the rule modules is what populates the registry.
from app.engine import (  # noqa: F401  - registration side effect, confined here
    rules_beh,
    rules_ewb,
    rules_itc,
    rules_net,
    rules_out,
    rules_pay,
)
from app.engine.context import RuleContext
from app.engine.identities import IdentityResult, identity_matrix
from app.engine.params_p01_p34 import ParamResult, evaluate_parameters
from app.engine.registry import Finding, clear, rules_in_order
from app.engine.scoring import FScore, PScore, compute_f_score, compute_p_score
from app.engine.trace import CalcTrace

__all__ = ["TaxpayerOutcome", "run_for_taxpayer", "suppression_for"]


@dataclass(frozen=True, slots=True)
class TaxpayerOutcome:
    """Everything one taxpayer's run produced, for one financial year."""

    gstin: str
    fy: str
    findings: tuple[Finding, ...]
    parameters: tuple[ParamResult, ...]
    identities: dict[str, list[IdentityResult]]
    p_score: PScore
    f_score: FScore
    rule_errors: tuple[dict[str, str], ...] = ()

    @property
    def traces(self) -> list[CalcTrace]:
        """Every trace this run produced, for the provenance store."""
        found: list[CalcTrace] = [self.p_score.trace, self.f_score.trace]
        found.extend(f.trace for f in self.findings if f.trace is not None)
        found.extend(p.trace for p in self.parameters)
        found.extend(r.trace for rows in self.identities.values() for r in rows)
        return found

    def as_dict(self) -> dict[str, Any]:
        return {
            "gstin": self.gstin,
            "fy": self.fy,
            "p_score": self.p_score.as_dict(),
            "f_score": self.f_score.as_dict(),
            "findings": [f.as_dict() for f in self.findings],
            "parameters": [p.as_dict() for p in self.parameters],
            "counts": {
                "triggered": sum(1 for f in self.findings if f.triggered),
                "clear": sum(1 for f in self.findings if f.status is FindingStatus.CLEAR),
                "not_evaluated": sum(
                    1 for f in self.findings if f.status is FindingStatus.NOT_EVALUATED
                ),
                "suppressed": sum(1 for f in self.findings if f.status is FindingStatus.SUPPRESSED),
            },
            "rule_errors": list(self.rule_errors),
        }


# ---------------------------------------------------------------------------
# suppressions
# ---------------------------------------------------------------------------


def suppression_for(ctx: RuleContext, finding: Finding) -> str | None:
    """Why this finding must not reach the enforcement queue, if it must not.

    Three suppressions, in the order they bite:

    * **s.128A amnesty** -- interest and penalty are waived for s.73 demands for
      FY 2017-18 to 2019-20 on full payment of tax.  Issuing a notice for a
      waived period is a credibility-destroying error and is trivially
      avoidable, so those periods are suppressed from the queue and shown in a
      separate amnesty view.
    * **limitation expired** -- the order deadline has passed, so no demand can
      issue.
    * **accepted prior reply** -- the taxpayer already answered this rule for
      this period and the officer accepted it.
    """
    amnesty_from = int(ctx.params.get("AMNESTY", "s128a_from_fy", on=ctx.fy.end).decimal)
    amnesty_to = int(ctx.params.get("AMNESTY", "s128a_to_fy", on=ctx.fy.end).decimal)
    if amnesty_from <= ctx.fy.start_year <= amnesty_to:
        return f"s.128A amnesty: FY {ctx.fy.label} is within {amnesty_from}-{amnesty_to}"

    accepted = ctx.extras.get("accepted_replies", ())
    period_key = finding.period.mmyyyy if finding.period else ""
    if (finding.rule_id, period_key) in accepted:
        return "an earlier reply on this rule and period was accepted by the officer"

    deadline = ctx.extras.get("order_deadline")
    if isinstance(deadline, date) and ctx.as_of > deadline:
        return f"limitation expired: the order deadline was {deadline}"

    return None


# ---------------------------------------------------------------------------
# the run
# ---------------------------------------------------------------------------

#: A rule that raises must not take the run down with it; the failure is
#: recorded against that rule and every other rule still produces its finding.
_RuleRunner = Callable[[RuleContext], list[Finding]]


def run_for_taxpayer(
    ctx: RuleContext,
    *,
    only: tuple[str, ...] | None = None,
    with_identities: bool = True,
) -> TaxpayerOutcome:
    """Run every rule and every parameter for one taxpayer, in a fixed order."""
    findings: list[Finding] = []
    errors: list[dict[str, str]] = []

    for spec in rules_in_order():
        if only is not None and spec.id not in only:
            continue
        try:
            produced = spec.function(ctx)
        except Exception as exc:
            errors.append({"rule_id": spec.id, "error": f"{type(exc).__name__}: {exc}"})
            continue
        if not produced:
            # Showing why a rule did NOT fire is as important as showing why it
            # did: it is how an officer learns to trust the engine's silence,
            # and silence is most of what the engine produces.  A rule that
            # simply returned nothing would be indistinguishable on screen from
            # a rule that never ran.
            produced = [
                clear(
                    ctx,
                    spec.id,
                    narrative="The rule ran across every period and found nothing to report.",
                )
            ]
        findings.extend(produced)

    # Suppressions are applied after every rule has spoken, so the officer can
    # see what was found *and* that it was set aside.
    suppressed: list[Finding] = []
    for finding in findings:
        if finding.status is FindingStatus.TRIGGERED:
            reason = suppression_for(ctx, finding)
            if reason is not None:
                suppressed.append(finding.suppress(reason))
                continue
        suppressed.append(finding)

    parameters = evaluate_parameters(ctx)
    p_score = compute_p_score(ctx, parameters)
    f_score = compute_f_score(ctx, suppressed)
    identities = identity_matrix(ctx) if with_identities else {}

    return TaxpayerOutcome(
        gstin=ctx.gstin,
        fy=ctx.fy.label,
        findings=tuple(suppressed),
        parameters=tuple(parameters),
        identities=identities,
        p_score=p_score,
        f_score=f_score,
        rule_errors=tuple(errors),
    )
