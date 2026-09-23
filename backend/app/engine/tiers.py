"""The execution tier — what a check is allowed to output.

The platform ingests **GST returns**. It does not ingest a general ledger, a
fixed-asset register, contracts or an annual report. Pretending otherwise is
how scrutiny software loses officer trust in week three, so every check
declares a tier and the tier decides what the engine may emit:

    AUTO      a Finding with a head-wise rupee figure and a calc_id
    ASSISTED  a DocumentCall: the partial working, plus the document needed
    MANUAL    a ChecklistItem: the legal test and the action point, no number
    CASE      consumed by the limitation/section engine, not detection

Of the 141 departmental checks only 41 are AUTO. That is not a shortfall to
be engineered away; it is the honest count, and the other hundred are more
useful visible and tiered than invented.

**No check promotes its own tier.** An ASSISTED check never becomes a demand
because the figure happened to look complete - it produces a call-book entry
naming the document, with whatever partial figure the returns support. A file
with 3 findings and 18 open document calls is not a clean file, and the
scorecard says so through `open_documents` and `unquantified_exposure`.

docs/01 section 1.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from enum import StrEnum
from typing import Final

from app.canonical import Period, Severity
from app.engine.trace import CalcTrace
from app.money import TaxVector

__all__ = [
    "ChecklistItem",
    "DocumentCall",
    "Tier",
    "may_emit_finding",
    "may_score",
]

_ZERO: Final[Decimal] = Decimal("0.00")


class Tier(StrEnum):
    """What a check may output. Declared, never inferred."""

    AUTO = "AUTO"
    ASSISTED = "ASSISTED"
    MANUAL = "MANUAL"
    CASE = "CASE"


def may_emit_finding(tier: Tier) -> bool:
    """Only AUTO produces a rupee figure that can reach a notice."""
    return tier is Tier.AUTO


def may_score(tier: Tier) -> bool:
    """Only AUTO contributes to the F-Score.

    ASSISTED deliberately does not. Letting an unquantified exposure move a
    score would make the score depend on how much the engine could not see,
    which is the opposite of what it is for. ASSISTED drives the open-document
    count instead, shown beside the score rather than inside it.
    """
    return tier is Tier.AUTO


@dataclass(frozen=True, slots=True)
class DocumentCall:
    """An ASSISTED check's output: what is needed, and what it would settle.

    Grouped by **document** rather than by rule in the call book, so one
    letter asks for the fixed-asset register once and cites the four checks it
    unblocks, instead of four letters asking four times.
    """

    check_id: str
    gstin: str
    period: Period | None
    #: In the words that go into the letter: "the fixed-asset register for
    #: FY 2025-26", not "FAR".
    document: str
    legal_basis: str
    question: str
    #: What the returns already support. May be zero - and zero here means
    #: "nothing computable yet", never "nothing wrong".
    partial: TaxVector = field(default_factory=TaxVector)
    unquantified_exposure: Decimal = _ZERO
    severity: Severity = Severity.MEDIUM
    evidence_ids: tuple[str, ...] = ()
    #: Law 2 applies here too. `unquantified_exposure` is a number an officer
    #: reads off a call-book entry and may quote in a letter, so it carries
    #: the same trace a Finding would - the formula as executed, the rows it
    #: came from, and a `calc_id` that resolves to both. "Unquantified" means
    #: the platform will not turn it into a demand, not that nobody may ask
    #: where it came from.
    trace: CalcTrace | None = None

    @property
    def tier(self) -> Tier:
        return Tier.ASSISTED

    @property
    def calc_id(self) -> str | None:
        return None if self.trace is None else self.trace.calc_id

    def as_dict(self) -> dict[str, object]:
        return {
            "check_id": self.check_id,
            "tier": self.tier.value,
            "gstin": self.gstin,
            "period": None if self.period is None else self.period.mmyyyy,
            "document": self.document,
            "legal_basis": self.legal_basis,
            "question": self.question,
            "partial": self.partial.dict(),
            "unquantified_exposure": format(self.unquantified_exposure, "f"),
            "severity": self.severity.value,
            "calc_id": self.calc_id,
            "evidence_ids": list(self.evidence_ids),
        }


@dataclass(frozen=True, slots=True)
class ChecklistItem:
    """A MANUAL check's output: the legal test and the action point.

    No number, ever. These are contract- or judgement-driven - whether a car
    was used for further supply, whether an insurance policy was obligatory
    under law - and a figure attached to one would be a guess wearing a
    rupee sign.
    """

    check_id: str
    gstin: str
    legal_basis: str
    test: str
    action: str
    severity: Severity = Severity.MEDIUM

    @property
    def tier(self) -> Tier:
        return Tier.MANUAL

    def as_dict(self) -> dict[str, object]:
        return {
            "check_id": self.check_id,
            "tier": self.tier.value,
            "gstin": self.gstin,
            "legal_basis": self.legal_basis,
            "test": self.test,
            "action": self.action,
            "severity": self.severity.value,
        }
