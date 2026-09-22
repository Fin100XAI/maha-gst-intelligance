"""Provisos are part of the rule.

**A statutory test implemented without its exemptions is not conservative -
it is wrong.** In `docs/07` Part C2, Rule 86B fired on two months with zero
cash against seven crore of turnover. A headline breach, and a demand of
Rs 2,61,545. It was a false positive: clause (d) of the first proviso exempts
anyone already above 1% *cumulative* cash for the year to date, and April's
payment put them at 5.62%.

Rule 86B does not bite in any month of that file. An engine that says it does
has not been careful, it has been incomplete - and the first wrong allegation
is what destroys a scrutiny platform's credibility, not the first right one.

Every exemption is one of two kinds, and the difference decides what the
engine may do:

    TESTABLE    computable from the returns. The engine applies it and
                SUPPRESSES the finding, showing the suppression on screen
                with its own calc_id.
    UNTESTABLE  needs a document or a judgement. The finding survives but
                drops to ADVISORY with an officer prompt naming the exemption.

Never silently ignore an exemption. Never silently apply one. A suppression
the officer cannot see is indistinguishable from a rule that did not run.

docs/01 section 3.
"""

from __future__ import annotations

import dataclasses
from collections.abc import Callable
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Final

from app.canonical import Confidence, FindingStatus
from app.engine.context import RuleContext
from app.engine.registry import Finding

__all__ = [
    "EXEMPTIONS",
    "Exemption",
    "Kind",
    "Suppression",
    "apply_exemptions",
]

_ZERO: Final[Decimal] = Decimal("0.00")


class Kind(StrEnum):
    """Whether the returns can settle this exemption on their own."""

    TESTABLE = "TESTABLE"
    UNTESTABLE = "UNTESTABLE"


@dataclass(frozen=True, slots=True)
class Suppression:
    """Why a finding did not stand, in the words that go on the card."""

    exemption_id: str
    legal_basis: str
    reason: str
    #: The figures that settle it, so the officer can check the arithmetic
    #: rather than take the suppression on trust.
    observed: dict[str, str]


@dataclass(frozen=True, slots=True)
class Exemption:
    """One proviso, attached to the rule it qualifies."""

    id: str
    rule_id: str
    kind: Kind
    legal_basis: str
    description: str
    #: Returns a `Suppression` when the exemption applies, else None. Only
    #: meaningful for TESTABLE; an UNTESTABLE exemption never runs it.
    test: Callable[[RuleContext, Finding], Suppression | None] | None = None
    #: What to ask the officer, for UNTESTABLE.
    prompt: str = ""


# ---------------------------------------------------------------------------
# Rule 86B, first proviso clause (d)
# ---------------------------------------------------------------------------


def _cumulative_cash_ratio(ctx: RuleContext, upto_index: int) -> tuple[Decimal, Decimal]:
    """Cash paid and total liability, from April to the given period.

    Cumulative is the whole point. A month read on its own shows zero cash
    and looks like a breach; the year to date shows the taxpayer is already
    far above the 1% the proviso asks for.
    """
    cash = liability = _ZERO
    for period in ctx.periods[: upto_index + 1]:
        record = ctx.return_3b(period)
        if record is None:
            continue
        cells = getattr(record, "cells", {})
        for key, target in (("t61_cash", "cash"), ("t61_payable", "liability")):
            value = cells.get(key)
            if isinstance(value, Decimal):
                if target == "cash":
                    cash += value
                else:
                    liability += value
    return cash, liability


def _rule_86b_cumulative_cash(ctx: RuleContext, finding: Finding) -> Suppression | None:
    """Clause (d): already above 1% cumulative cash for the FY to date.

    On the real file April's Rs 12,69,228 of cash put the taxpayer at 12.99%,
    and the cumulative figure never fell below 3.5% all year. May reads 5.62%
    and June 3.53% - both comfortably exempt, both flagged by a naive test.
    """
    if finding.period is None:
        return None
    try:
        index = ctx.periods.index(finding.period)
    except ValueError:
        return None

    cash, liability = _cumulative_cash_ratio(ctx, index)
    if liability <= _ZERO:
        return None
    ratio = (cash / liability * Decimal("100")).quantize(Decimal("0.01"))
    threshold = ctx.params.get("F-06", "cumulative_cash_pct", on=finding.period.last_day)
    floor = threshold.decimal if threshold is not None else Decimal("1")
    if ratio <= floor:
        return None
    return Suppression(
        exemption_id="R86B-proviso-1-d",
        legal_basis="Rule 86B, first proviso, clause (d)",
        reason=(
            f"cumulative cash payment for the year to date is {ratio}% of "
            f"cumulative output liability, above the {floor}% the proviso "
            f"requires, so Rule 86B does not apply in this period"
        ),
        observed={
            "cumulative_cash": format(cash, "f"),
            "cumulative_liability": format(liability, "f"),
            "ratio_pct": format(ratio, "f"),
            "threshold_pct": format(floor, "f"),
        },
    )


#: Attached to the rules they qualify. A rule with no entry here has no
#: modelled exemptions, which is a statement about the rule and should be
#: true rather than merely unwritten.
EXEMPTIONS: Final[tuple[Exemption, ...]] = (
    Exemption(
        id="R86B-proviso-1-d",
        rule_id="F-06",
        kind=Kind.TESTABLE,
        legal_basis="Rule 86B, first proviso, clause (d)",
        description=(
            "More than 1% of cumulative output liability already discharged in "
            "cash for the financial year to date."
        ),
        test=_rule_86b_cumulative_cash,
    ),
    Exemption(
        id="R86B-proviso-1-a",
        rule_id="F-06",
        kind=Kind.UNTESTABLE,
        legal_basis="Rule 86B, first proviso, clause (a)",
        description=(
            "The proprietor, karta, managing director or partner has paid more "
            "than Rs 1 lakh of income tax in each of the last two financial years."
        ),
        prompt=(
            "Confirm whether the proprietor or a partner paid over Rs 1 lakh of "
            "income tax in each of the last two years. Income-tax records are "
            "not GST data and the engine cannot settle this."
        ),
    ),
    Exemption(
        id="S16-4-reclaim",
        rule_id="B-07",
        kind=Kind.UNTESTABLE,
        legal_basis="s.16(5) and s.16(6)",
        description=(
            "Credit restored on revocation of cancellation, or allowed by the "
            "retrospective relief in s.16(5)."
        ),
        prompt=(
            "Check whether s.16(5) or s.16(6) restores this credit. Both turn "
            "on the registration history rather than on the return."
        ),
    ),
)


def apply_exemptions(ctx: RuleContext, finding: Finding) -> Finding:
    """Suppress, downgrade, or leave the finding exactly as it is.

    A testable exemption that applies suppresses the finding and records why.
    An untestable one leaves the figure standing but drops the confidence to
    ADVISORY and attaches the question - because an officer must decide it,
    and a finding that reaches a notice without that decision is the defect
    this module exists to prevent.
    """
    if finding.status is not FindingStatus.TRIGGERED:
        return finding

    relevant = [e for e in EXEMPTIONS if e.rule_id == finding.rule_id]
    if not relevant:
        return finding

    for exemption in relevant:
        if exemption.kind is not Kind.TESTABLE or exemption.test is None:
            continue
        suppression = exemption.test(ctx, finding)
        if suppression is None:
            continue
        return dataclasses.replace(
            finding,
            status=FindingStatus.SUPPRESSED,
            suppressed_by=suppression.exemption_id,
            narrative=f"Suppressed under {suppression.legal_basis}: {suppression.reason}.",
            extra={**finding.extra, "suppression": suppression.observed},
        )

    untestable = [e for e in relevant if e.kind is Kind.UNTESTABLE]
    if not untestable:
        return finding

    prompts = " ".join(e.prompt for e in untestable)
    return dataclasses.replace(
        finding,
        confidence=Confidence.ADVISORY,
        narrative=(
            f"{finding.narrative or ''} An exemption applies that the returns "
            f"cannot settle. {prompts}"
        ).strip(),
    )
