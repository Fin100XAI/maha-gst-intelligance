"""Demand computation: head-wise tax, day-counted interest, penalty.

One ``calc_id`` addresses the whole build-up, and the build-up decomposes to
the findings it came from.  A demand an officer cannot decompose in front of
the taxpayer is a demand that will not survive the reply.

Heads are never summed.  ``DemandBuildUp.total`` exists so that a covering
letter can state one figure, and it is the only place the collapse happens.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Final

from app.canonical import Confidence, FinancialYear, FindingStatus
from app.cases.limitation import LimitationClock, amnesty_applies, compute_limitation
from app.engine.params import ParameterSet
from app.engine.registry import Finding
from app.engine.trace import CalcKind, CalcTrace, Tracer
from app.money import TaxVector, rupee

__all__ = ["DemandBuildUp", "DemandLine", "compute_demand"]

_ZERO: Final[Decimal] = Decimal("0.00")


@dataclass(frozen=True, slots=True)
class DemandLine:
    """One finding's contribution to the demand."""

    rule_id: str
    period: str | None
    legal_basis: str
    confidence: str
    tax: TaxVector
    interest: Decimal
    penalty: Decimal
    calc_id: str | None

    def as_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "period": self.period,
            "legal_basis": self.legal_basis,
            "confidence": self.confidence,
            "tax": self.tax.dict(),
            "tax_total": format(self.tax.total, "f"),
            "interest": format(self.interest, "f"),
            "penalty": format(self.penalty, "f"),
            "calc_id": self.calc_id,
        }


@dataclass(frozen=True, slots=True)
class DemandBuildUp:
    """The whole demand, decomposable to the last rupee."""

    gstin: str
    fy: str
    section: str
    tax: TaxVector
    interest: Decimal
    penalty: Decimal
    lines: tuple[DemandLine, ...]
    excluded: tuple[dict[str, Any], ...]
    limitation: LimitationClock
    amnesty: bool
    trace: CalcTrace

    @property
    def calc_id(self) -> str:
        return self.trace.calc_id

    @property
    def total(self) -> Decimal:
        """Tax plus interest plus penalty, rounded to the rupee under s.170.

        The only place the four heads are collapsed, and it happens once, at
        the presentation boundary.
        """
        return rupee(self.tax.total + self.interest + self.penalty)

    def as_dict(self) -> dict[str, Any]:
        return {
            "gstin": self.gstin,
            "fy": self.fy,
            "section": self.section,
            "tax": self.tax.dict(),
            "tax_total": format(self.tax.total, "f"),
            "interest": format(self.interest, "f"),
            "penalty": format(self.penalty, "f"),
            "total": format(self.total, "f"),
            "lines": [line.as_dict() for line in self.lines],
            "excluded": list(self.excluded),
            "limitation": self.limitation.as_dict(),
            "amnesty": self.amnesty,
            "calc_id": self.calc_id,
            "formula_rendered": self.trace.formula_rendered,
        }


def compute_demand(
    findings: list[Finding],
    *,
    gstin: str,
    fy: FinancialYear,
    as_of: date,
    params: ParameterSet,
    snapshot_id: str,
    fraud_alleged: bool = False,
    engine_version: str = "0.1.0",
) -> DemandBuildUp:
    """Build a demand from a set of findings.

    Only findings that may populate a notice are counted: TRIGGERED, not
    suppressed, and CERTAIN or STRONG.  ADVISORY findings are listed in
    ``excluded`` with the reason, so the officer sees that they were considered
    and why they were left out -- promoting one is an explicit human act.
    """
    tracer = Tracer(
        kind=CalcKind.METRIC,
        subject_id="DEMAND",
        snapshot_id=snapshot_id,
        gstin=gstin,
        fy=fy.label,
        legal_basis="s.73, s.74 and s.74A CGST Act, 2017",
        engine_version=engine_version,
        params_version=params.version,
    )

    limitation = compute_limitation(fy, as_of=as_of, params=params, fraud_alleged=fraud_alleged)
    amnesty = amnesty_applies(fy, params)

    tax = TaxVector()
    interest = _ZERO
    penalty = _ZERO
    lines: list[DemandLine] = []
    excluded: list[dict[str, Any]] = []

    for finding in findings:
        if finding.status is FindingStatus.SUPPRESSED:
            excluded.append(
                {
                    "rule_id": finding.rule_id,
                    "period": finding.period.mmyyyy if finding.period else None,
                    "reason": finding.suppressed_by,
                    "tax": finding.delta.positive_part().dict(),
                }
            )
            continue
        if finding.status is not FindingStatus.TRIGGERED:
            continue
        if finding.confidence is Confidence.ADVISORY:
            excluded.append(
                {
                    "rule_id": finding.rule_id,
                    "period": finding.period.mmyyyy if finding.period else None,
                    "reason": "ADVISORY: a worklist item, not a demand. An officer must "
                    "promote it expressly before it can populate a notice.",
                    "tax": finding.delta.positive_part().dict(),
                }
            )
            continue

        contribution = finding.delta.positive_part()
        if contribution.is_zero() and finding.interest == 0 and finding.penalty == 0:
            continue

        tax = tax + contribution
        interest += finding.interest
        penalty += finding.penalty
        lines.append(
            DemandLine(
                rule_id=finding.rule_id,
                period=finding.period.mmyyyy if finding.period else None,
                legal_basis=finding.legal_basis,
                confidence=finding.confidence.value,
                tax=contribution,
                interest=finding.interest,
                penalty=finding.penalty,
                calc_id=finding.calc_id,
            )
        )
        tracer.evidence(*finding.evidence_ids)
        tracer.step(
            f"{finding.rule_id}" + (f" for {finding.period.mmyyyy}" if finding.period else ""),
            finding.legal_basis,
            {
                "tax": contribution,
                "interest": finding.interest,
                "penalty": finding.penalty,
                "calc_id": finding.calc_id,
            },
            contribution.total + finding.interest + finding.penalty,
        )

    if amnesty:
        # s.128A waives interest and penalty on payment of tax in full.
        tracer.step(
            "s.128A amnesty",
            "interest and penalty waived on full payment of tax for FY 2017-18 to 2019-20",
            {"interest_before": interest, "penalty_before": penalty},
            "waived",
        )
        interest = _ZERO
        penalty = _ZERO

    tracer.note("tax", tax)
    tracer.note("interest", interest)
    tracer.note("penalty", penalty)
    tracer.note("section", limitation.section)
    tracer.note("lines", len(lines))
    tracer.note("amnesty", amnesty)

    total = rupee(tax.total + interest + penalty)
    trace = tracer.finish(
        result=total,
        formula_template="demand = sum(finding tax, head-wise) + interest + penalty, "
        "rounded to the rupee under s.170",
        formula_rendered=(
            f"{tax} + interest {interest} + penalty {penalty} = {total} "
            f"under s.{limitation.section}"
        ),
    )

    return DemandBuildUp(
        gstin=gstin,
        fy=fy.label,
        section=limitation.section,
        tax=tax,
        interest=interest,
        penalty=penalty,
        lines=tuple(lines),
        excluded=tuple(excluded),
        limitation=limitation,
        amnesty=amnesty,
        trace=trace,
    )
