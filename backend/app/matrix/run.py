"""Run one taxpayer against the 141 departmental checks.

Five outcomes, and the distinctions between them are the whole value:

    FAIL            a built check fired, with a rupee figure and a calc_id
    PASS            a built check ran and found nothing
    NOT_EVALUATED   a built check ran and abstained, naming the dataset
    NOT_BUILT       no built check answers this row, and it says what it needs
    NOT_APPLICABLE  the industry grid says this row does not apply here

`NOT_BUILT` and `NOT_EVALUATED` are different answers and a screen that merged
them would be useless: one is a gap in the platform and the other is a gap in
the data, and they are fixed by different people.

`NOT_APPLICABLE` is possible for the first time because the departmental
workbook carries the rule x industry grid `docs/01` section 12 asks for.
Industry is **read from the taxpayer's profile, never inferred** - the pack is
explicit that it is confirmed by an officer and never guessed - so a taxpayer
with no industry set gets no `NOT_APPLICABLE` rows at all rather than a guess.

Pure: no I/O, no clock. The catalogue is loaded once at import.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Final

from app.canonical import FindingStatus
from app.engine.registry import Finding
from app.matrix.catalogue import APPLICABILITY, MATRIX, MatrixCheck
from app.matrix.mapping import ANSWERED_BY
from app.money import TaxVector

__all__ = ["MatrixResult", "MatrixRow", "run_matrix"]

_ZERO: Final[Decimal] = Decimal("0.00")

FAIL: Final[str] = "FAIL"
PASS: Final[str] = "PASS"  # noqa: S105 - a check outcome, not a credential
NOT_EVALUATED: Final[str] = "NOT_EVALUATED"
NOT_BUILT: Final[str] = "NOT_BUILT"
NOT_APPLICABLE: Final[str] = "NOT_APPLICABLE"


@dataclass(frozen=True, slots=True)
class MatrixRow:
    """One departmental check, against one taxpayer."""

    check: MatrixCheck
    status: str
    #: Head-wise. Zero unless the status is FAIL.
    exposure: TaxVector = field(default_factory=TaxVector)
    #: The built checks that answered this row, for the drill.
    answered_by: tuple[str, ...] = ()
    #: Why it could not be answered - the dataset, or the words "not built".
    reason: str = ""
    calc_ids: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.check.id,
            "module": self.check.module,
            "check": self.check.check,
            "legal_reference": self.check.legal_reference,
            "severity": self.check.severity,
            "data_sources": self.check.data_sources,
            "action": self.check.action,
            "status": self.status,
            "exposure": self.exposure.dict(),
            "exposure_total": format(self.exposure.total, "f"),
            "answered_by": list(self.answered_by),
            "reason": self.reason,
            "calc_ids": list(self.calc_ids),
        }


@dataclass(frozen=True, slots=True)
class MatrixResult:
    """The whole matrix for one taxpayer."""

    gstin: str
    fy: str
    legal_name: str | None
    industry: str | None
    rows: tuple[MatrixRow, ...]

    @property
    def counts(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for row in self.rows:
            out[row.status] = out.get(row.status, 0) + 1
        return out

    @property
    def exposure(self) -> TaxVector:
        return sum((row.exposure for row in self.rows), TaxVector())

    def as_dict(self) -> dict[str, Any]:
        return {
            "gstin": self.gstin,
            "fy": self.fy,
            "legal_name": self.legal_name,
            "industry": self.industry,
            "counts": self.counts,
            "exposure": self.exposure.dict(),
            "exposure_total": format(self.exposure.total, "f"),
            "rows": [row.as_dict() for row in self.rows],
        }


def _applies(check_id: str, industry: str | None) -> bool:
    """Whether this row applies to this taxpayer's trade.

    An unknown industry means *do not exclude anything*. The pack forbids
    inferring industry silently, so the honest behaviour with no industry on
    file is to run every row - over-reporting a question, never suppressing
    one.
    """
    if industry is None:
        return True
    entry = APPLICABILITY.get(check_id)
    if entry is None:
        return True
    return industry in entry.applies_to


def run_matrix(
    gstin: str,
    fy: str,
    findings: list[Finding],
    *,
    legal_name: str | None = None,
    industry: str | None = None,
) -> MatrixResult:
    """Project this taxpayer's findings onto the departmental matrix."""
    by_rule: dict[str, list[Finding]] = {}
    for finding in findings:
        by_rule.setdefault(finding.rule_id, []).append(finding)

    rows: list[MatrixRow] = []
    for check in MATRIX:
        if not _applies(check.id, industry):
            rows.append(
                MatrixRow(
                    check=check,
                    status=NOT_APPLICABLE,
                    reason=f"does not apply to a {industry}",
                )
            )
            continue

        answering = ANSWERED_BY.get(check.id)
        if answering is None:
            rows.append(
                MatrixRow(
                    check=check,
                    status=NOT_BUILT,
                    reason=f"needs {check.data_sources}",
                )
            )
            continue

        produced = [f for rule in answering for f in by_rule.get(rule, [])]
        if not produced:
            rows.append(
                MatrixRow(
                    check=check,
                    status=NOT_EVALUATED,
                    answered_by=answering,
                    reason="the check did not run on this taxpayer",
                )
            )
            continue

        triggered = [f for f in produced if f.status is FindingStatus.TRIGGERED]
        if triggered:
            rows.append(
                MatrixRow(
                    check=check,
                    status=FAIL,
                    exposure=sum((f.delta for f in triggered), TaxVector()),
                    answered_by=tuple(f.rule_id for f in triggered),
                    reason="",
                    calc_ids=tuple(f.trace.calc_id for f in triggered if f.trace is not None),
                )
            )
            continue

        dark = [f for f in produced if f.status is FindingStatus.NOT_EVALUATED]
        if dark and len(dark) == len(produced):
            rows.append(
                MatrixRow(
                    check=check,
                    status=NOT_EVALUATED,
                    answered_by=answering,
                    reason=", ".join(sorted({need for f in dark for need in f.missing_inputs})),
                )
            )
            continue

        rows.append(MatrixRow(check=check, status=PASS, answered_by=answering))

    return MatrixResult(
        gstin=gstin,
        fy=fy,
        legal_name=legal_name,
        industry=industry,
        rows=tuple(rows),
    )
