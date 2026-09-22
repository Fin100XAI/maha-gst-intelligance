"""The filing scorecard — one GSTIN, one period, every applicable check.

The officer's unit of work is a **filing**, not a taxpayer. So the engine's
primary artefact is a per-filing scorecard, and the workbench's default view
is the twelve-by-N grid of them: one screenful is an entire financial year's
compliance posture, and it is what an officer scans in ten seconds to decide
where to spend the day.

**The annual roll-up is not the sum of the monthly scorecards.** Netting,
s.16(4) time limits, Rule 37A cut-offs and annual reversal true-ups are
FY-level tests that no monthly cell can see - a month that looks clean twelve
times over can still fail all four. It is computed separately, and the screen
says so rather than letting a reader assume addition.

**A silent pass is the thing to avoid.** Every cell is one of PASS, FAIL,
NOT_EVALUATED naming what was missing, NEEDS_DOCUMENT naming the document, or
NOT_APPLICABLE naming why. A check that could not run must never look like a
check that ran and found nothing.

docs/02 Part C.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum
from typing import Any, Final

from app.canonical import FindingStatus, Period
from app.engine.registry import Finding
from app.engine.tiers import ChecklistItem, DocumentCall, Tier

__all__ = [
    "CellStatus",
    "Coverage",
    "FilingScorecard",
    "annual_rollup",
    "build_scorecard",
]

_ZERO: Final[Decimal] = Decimal("0.00")


class CellStatus(StrEnum):
    """What one check said about one filing.

    Five states, not two. The difference between `NOT_EVALUATED` and `PASS`
    is the difference between "I could not look" and "I looked and it is
    fine", and collapsing them is how a scrutiny platform quietly stops
    being one.
    """

    PASS = "PASS"  # noqa: S105 - a check outcome, not a credential
    FAIL = "FAIL"
    NOT_EVALUATED = "NOT_EVALUATED"
    NEEDS_DOCUMENT = "NEEDS_DOCUMENT"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    SUPPRESSED = "SUPPRESSED"


class Coverage(StrEnum):
    """Whether a dataset was there, empty, or nil by identity.

    The third state is the one everyone gets wrong. A GSTR-1 carrying only
    B2B and CDN looks incomplete - but if those sections sum to the
    auto-populated 3B total to the paisa, there are no B2C or export supplies
    at all, the remainder is nil, and the identity is fully computable.
    Guessing in either direction is wrong: guessing absent abstains on a file
    that could have been checked, guessing nil invents a reconciliation.
    """

    ABSENT = "ABSENT"
    PRESENT_EMPTY = "PRESENT_EMPTY"
    NIL_BY_IDENTITY = "NIL_BY_IDENTITY"
    PRESENT = "PRESENT"


_STATUS_MAP: Final[dict[FindingStatus, CellStatus]] = {
    FindingStatus.CLEAR: CellStatus.PASS,
    FindingStatus.TRIGGERED: CellStatus.FAIL,
    FindingStatus.NOT_EVALUATED: CellStatus.NOT_EVALUATED,
    FindingStatus.SUPPRESSED: CellStatus.SUPPRESSED,
}


@dataclass(frozen=True, slots=True)
class Cell:
    """One check against one filing."""

    check_id: str
    tier: Tier
    status: CellStatus
    severity: str | None = None
    #: Head-wise effect, as strings. Never a float, never a single scalar.
    delta: dict[str, str] = field(default_factory=dict)
    #: Required whenever the status is NOT_EVALUATED or NEEDS_DOCUMENT.
    reason: str | None = None
    calc_id: str | None = None

    def __post_init__(self) -> None:
        needs_reason = {CellStatus.NOT_EVALUATED, CellStatus.NEEDS_DOCUMENT}
        if self.status in needs_reason and not self.reason:
            message = (
                f"{self.check_id}: a {self.status.value} cell must name what was "
                f"missing. An unexplained abstention reads as a pass."
            )
            raise ValueError(message)


@dataclass(slots=True)
class FilingScorecard:
    """Everything the engine concluded about one (GSTIN, period)."""

    gstin: str
    period: Period
    engine_run_id: str | None = None
    coverage: dict[str, Coverage] = field(default_factory=dict)
    invariants: dict[str, int] = field(default_factory=dict)
    quarantined_rows: int = 0
    cells: list[Cell] = field(default_factory=list)
    #: This period's own contribution to the F-Score. Not the whole score.
    period_score: Decimal = _ZERO
    open_documents: int = 0
    unquantified_exposure: Decimal = _ZERO
    netted_with: tuple[str, ...] = ()

    @property
    def counts(self) -> dict[str, int]:
        return dict(Counter(cell.status.value for cell in self.cells))

    @property
    def failures(self) -> list[Cell]:
        return [cell for cell in self.cells if cell.status is CellStatus.FAIL]

    @property
    def dark(self) -> list[Cell]:
        """Checks that could not run. Shown, never hidden."""
        return [cell for cell in self.cells if cell.status is CellStatus.NOT_EVALUATED]

    def as_dict(self) -> dict[str, Any]:
        return {
            "gstin": self.gstin,
            "period": self.period.mmyyyy,
            "engine_run_id": self.engine_run_id,
            "coverage": {k: v.value for k, v in self.coverage.items()},
            "invariants": self.invariants,
            "quarantined_rows": self.quarantined_rows,
            "counts": self.counts,
            "cells": [
                {
                    "check_id": c.check_id,
                    "tier": c.tier.value,
                    "status": c.status.value,
                    "severity": c.severity,
                    "delta": c.delta,
                    "reason": c.reason,
                    "calc_id": c.calc_id,
                }
                for c in self.cells
            ],
            "period_score": format(self.period_score, "f"),
            "open_documents": self.open_documents,
            "unquantified_exposure": format(self.unquantified_exposure, "f"),
        }


def build_scorecard(
    gstin: str,
    period: Period,
    findings: list[Finding],
    *,
    calls: list[DocumentCall] | None = None,
    checklist: list[ChecklistItem] | None = None,
    coverage: dict[str, Coverage] | None = None,
    not_applicable: dict[str, str] | None = None,
    engine_run_id: str | None = None,
) -> FilingScorecard:
    """Assemble one filing's scorecard from what the engine produced.

    Pure assembly: it computes nothing that a rule did not already conclude.
    The scorecard's job is to make the whole picture addressable in one place,
    including the parts that are dark - a file with 3 findings and 18 open
    document calls is not a clean file, and only this object can say so.
    """
    card = FilingScorecard(
        gstin=gstin,
        period=period,
        engine_run_id=engine_run_id,
        coverage=coverage or {},
    )

    for finding in findings:
        if finding.period is not None and finding.period != period:
            continue
        status = _STATUS_MAP.get(finding.status, CellStatus.NOT_EVALUATED)
        reason = None
        if status is CellStatus.NOT_EVALUATED:
            reason = ", ".join(finding.missing_inputs) or "no reason recorded"
        card.cells.append(
            Cell(
                check_id=finding.rule_id,
                tier=Tier.AUTO,
                status=status,
                severity=finding.severity.value,
                delta=finding.delta.dict(),
                reason=reason,
                calc_id=finding.trace.calc_id if finding.trace else None,
            )
        )

    for call in calls or ():
        if call.period is not None and call.period != period:
            continue
        card.cells.append(
            Cell(
                check_id=call.check_id,
                tier=Tier.ASSISTED,
                status=CellStatus.NEEDS_DOCUMENT,
                severity=call.severity.value,
                delta=call.partial.dict(),
                reason=call.document,
            )
        )
        card.open_documents += 1
        card.unquantified_exposure += call.unquantified_exposure

    for item in checklist or ():
        card.cells.append(
            Cell(
                check_id=item.check_id,
                tier=Tier.MANUAL,
                # A MANUAL check is a checklist item: it carries the legal
                # test and no number, and it is neither a pass nor a failure
                # until an officer has looked at the contract.
                status=CellStatus.NEEDS_DOCUMENT,
                severity=item.severity.value,
                reason=item.test,
            )
        )

    for check_id, why in (not_applicable or {}).items():
        card.cells.append(
            Cell(
                check_id=check_id,
                tier=Tier.AUTO,
                status=CellStatus.NOT_APPLICABLE,
                reason=why,
            )
        )

    card.cells.sort(key=lambda cell: cell.check_id)
    return card


@dataclass(slots=True)
class AnnualRollup:
    """The FY-level view, computed separately and labelled as such."""

    gstin: str
    fy: str
    monthly: list[FilingScorecard]
    #: FY-level checks only: netting, s.16(4), Rule 37A cut-offs, annual
    #: true-ups. These are NOT in any monthly card.
    cells: list[Cell] = field(default_factory=list)

    @property
    def is_the_sum_of_the_monthlies(self) -> bool:
        """Always false, and named so a reader cannot assume otherwise.

        Kept as a property rather than a comment because the screen renders
        it: "the FY column is computed separately, not summed".
        """
        return False

    def as_dict(self) -> dict[str, Any]:
        return {
            "gstin": self.gstin,
            "fy": self.fy,
            "months": [card.as_dict() for card in self.monthly],
            "annual_cells": [
                {"check_id": c.check_id, "status": c.status.value, "reason": c.reason}
                for c in self.cells
            ],
            "note": (
                "The FY column is computed separately, not summed. Netting, "
                "s.16(4), Rule 37A cut-offs and annual true-ups are FY-level "
                "tests that no monthly cell can see."
            ),
        }


def annual_rollup(
    gstin: str,
    fy: str,
    monthly: list[FilingScorecard],
    annual_findings: list[Finding] | None = None,
) -> AnnualRollup:
    """The FY view. Deliberately not an aggregation of the monthly cards."""
    rollup = AnnualRollup(gstin=gstin, fy=fy, monthly=monthly)
    for finding in annual_findings or ():
        status = _STATUS_MAP.get(finding.status, CellStatus.NOT_EVALUATED)
        reason = None
        if status is CellStatus.NOT_EVALUATED:
            reason = ", ".join(finding.missing_inputs) or "no reason recorded"
        rollup.cells.append(
            Cell(
                check_id=finding.rule_id,
                tier=Tier.AUTO,
                status=status,
                severity=finding.severity.value,
                delta=finding.delta.dict(),
                reason=reason,
                calc_id=finding.trace.calc_id if finding.trace else None,
            )
        )
    return rollup
