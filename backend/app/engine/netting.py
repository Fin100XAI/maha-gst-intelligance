"""Multi-period netting, before any demand.

Rules run over a **rolling window**, not a single period. In `docs/07` Part D,
April under-claimed ITC by Rs 22.67 lakh and May over-claimed by Rs 22.01
lakh. That is **one carry-forward event**, net Rs 66,222 - and a
single-period engine raises a Rs 22 lakh DRC-01C on May and loses it on the
first reply.

This is the Rung 1 problem from `docs/07` Part A: timing differences have a
signature, which is that the delta reverses in an adjacent period and the
annual net is near zero. The response is interest under s.50, rarely tax. An
engine that cannot see across periods cannot tell Rung 1 from Rung 2, and
will keep raising demands it cannot sustain.

**Both figures stay on the card.** The netted finding shows the gross and the
net, and names the periods that offset - an officer asked why a Rs 22 lakh
discrepancy became Rs 66,222 must be able to see the arithmetic rather than
take it on trust.

Pure: no I/O, no clock. docs/01 section 4.
"""

from __future__ import annotations

import dataclasses
from collections import defaultdict
from decimal import Decimal
from typing import Final

from app.canonical import FindingStatus, Period
from app.engine.registry import Finding
from app.money import TaxVector

__all__ = ["DEFAULT_WINDOW", "net_findings"]

#: How many consecutive periods a reversal may span and still be one event.
#: Three is the pack's default; it is configurable per rule because a
#: quarterly filer's timing differences span further than a monthly one's.
DEFAULT_WINDOW: Final[int] = 3

#: Below this the netting is not worth reporting as a separate story.
DEFAULT_TOLERANCE: Final[Decimal] = Decimal("1000.00")

_ZERO: Final[Decimal] = Decimal("0.00")

#: A single delta has nothing to net against.
_PAIR: Final[int] = 2


def _ordered(periods: list[Period]) -> list[Period]:
    return sorted(periods, key=lambda p: (p.year, p.month))


def _adjacent(periods: list[Period], window: int) -> bool:
    """Whether these periods sit inside one rolling window.

    Two deltas six months apart are two events however neatly they cancel:
    an April under-claim and an October over-claim are not a carry-forward,
    they are two separate decisions that happen to net out, and treating
    them as one would suppress a real finding.
    """
    if len(periods) < _PAIR:
        return True
    ordered = _ordered(periods)
    return ordered[-1].months_since(ordered[0]) < window


def net_findings(
    findings: list[Finding],
    *,
    window: int = DEFAULT_WINDOW,
    tolerance: Decimal = DEFAULT_TOLERANCE,
) -> list[Finding]:
    """Collapse same-rule deltas that reverse within the window into one.

    Only opposing signs net. Two under-claims in consecutive months are two
    under-claims and their total is the exposure; an under-claim followed by
    an over-claim is one event seen twice.

    The surviving finding carries `netted_with` naming the periods it
    absorbed, and keeps the gross figure in `extra` so both appear on the
    card.
    """
    by_rule: dict[str, list[Finding]] = defaultdict(list)
    passthrough: list[Finding] = []

    for finding in findings:
        if finding.status is not FindingStatus.TRIGGERED or finding.period is None:
            passthrough.append(finding)
            continue
        by_rule[finding.rule_id].append(finding)

    out: list[Finding] = list(passthrough)

    for _rule_id, group in sorted(by_rule.items()):
        if len(group) < _PAIR:
            out.extend(group)
            continue

        ordered = sorted(group, key=lambda f: (f.period.year, f.period.month))  # type: ignore[union-attr]
        positives = [f for f in ordered if f.delta.total > _ZERO]
        negatives = [f for f in ordered if f.delta.total < _ZERO]

        if not positives or not negatives:
            out.extend(ordered)
            continue

        periods = [f.period for f in ordered if f.period is not None]
        if not _adjacent(periods, window):
            out.extend(ordered)
            continue

        gross = max((abs(f.delta.total) for f in ordered), default=_ZERO)
        net_vector = sum((f.delta for f in ordered), TaxVector())
        net = abs(net_vector.total)

        if gross - net <= tolerance:
            out.extend(ordered)
            continue

        # The finding that survives is the one in the EXPOSURE direction -
        # the largest signed delta, not the largest absolute one. April's
        # under-claim is bigger in magnitude than May's over-claim, but an
        # under-claim is the taxpayer claiming less than they were entitled
        # to: it is not a demand and an officer would never open it. The
        # over-claim is the finding; the under-claim is what reduces it.
        principal = max(ordered, key=lambda f: f.delta.total)
        absorbed = tuple(
            f.period.mmyyyy for f in ordered if f is not principal and f.period is not None
        )
        out.append(
            dataclasses.replace(
                principal,
                delta=net_vector,
                narrative=(
                    f"{principal.narrative or ''} Netted across "
                    f"{len(ordered)} periods: a gross discrepancy of {gross} "
                    f"reverses in {', '.join(absorbed)}, leaving {net}. "
                    f"This is a timing difference, so the exposure is interest "
                    f"under s.50 rather than tax."
                ).strip(),
                extra={
                    **principal.extra,
                    "netted": True,
                    "gross": format(gross, "f"),
                    "net": format(net, "f"),
                    "netted_with": absorbed,
                    "window_periods": window,
                },
            )
        )

    return out
