"""Persisting an engine run, and rolling it up into the fact tables.

Two jobs, in order:

1. **Persist** -- write every finding, parameter result, score and trace under
   one ``engine_run_id``.  Traces are keyed on their own ``calc_id``, so a
   re-run over the same snapshot rewrites the same rows rather than duplicating
   them.
2. **Roll up** -- aggregate into the five fact tables, so that a dashboard
   spanning 48,000 taxpayers is a handful of indexed reads rather than a live
   scan.

Every fact row carries the ``engine_run_id`` it was built from.  That is what
makes a dashboard figure drillable all the way down to a spreadsheet cell.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Final

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.canonical import Confidence, FindingStatus
from app.db.facts import (
    CalcTraceRow,
    FactEnforcement,
    FactFilingPeriod,
    FactOfficer,
    FactParamIncidence,
    FactRiskSnapshot,
)
from app.db.models import EngineRun, IdentityCheck, RiskScore
from app.db.models import Finding as FindingRow
from app.db.models import ParamResult as ParamRow
from app.engine.runner import TaxpayerOutcome

__all__ = ["NOT_EVALUATED_FLAG", "persist_run", "rebuild_facts", "run_and_store"]

_ZERO: Final[Decimal] = Decimal("0.00")

#: The flag value standing for NOT_EVALUATED in fact_param_incidence.  It is a
#: real row, not an absence: the dark column on the Parameter Explorer is the
#: integration roadmap, priced, and hiding it would understate it.
NOT_EVALUATED_FLAG: Final[int] = -1

#: Where a taxpayer with no division recorded is counted.
UNASSIGNED: Final[str] = "UNASSIGNED"


def _new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# persist
# ---------------------------------------------------------------------------


def persist_run(
    session: Session,
    outcomes: list[TaxpayerOutcome],
    *,
    snapshot_id: str,
    as_of: date,
    triggered_by: str,
    engine_version: str = "0.1.0",
    params_version: str = "unapproved-defaults",
    jurisdiction_of: dict[str, str] | None = None,
) -> EngineRun:
    """Write one engine run and everything it produced."""
    run = EngineRun(
        id=_new_id(),
        snapshot_id=snapshot_id,
        as_of=as_of,
        fy=outcomes[0].fy if outcomes else None,
        engine_version=engine_version,
        params_version=params_version,
        triggered_by=triggered_by,
        status="COMPLETE",
        gstin_count=len(outcomes),
        finding_count=sum(len(o.findings) for o in outcomes),
        config={"jurisdiction_map": bool(jurisdiction_of)},
    )
    session.add(run)
    session.flush()

    for outcome in outcomes:
        for finding in outcome.findings:
            session.add(
                FindingRow(
                    id=_new_id(),
                    engine_run_id=run.id,
                    gstin=outcome.gstin,
                    period=finding.period.mmyyyy if finding.period else None,
                    fy=outcome.fy,
                    rule_id=finding.rule_id,
                    status=finding.status.value,
                    severity=finding.severity.value,
                    confidence=finding.confidence.value,
                    dimension=finding.dimension.value,
                    observed_igst=finding.observed.igst,
                    observed_cgst=finding.observed.cgst,
                    observed_sgst=finding.observed.sgst,
                    observed_cess=finding.observed.cess,
                    expected_igst=finding.expected.igst,
                    expected_cgst=finding.expected.cgst,
                    expected_sgst=finding.expected.sgst,
                    expected_cess=finding.expected.cess,
                    delta_igst=finding.delta.igst,
                    delta_cgst=finding.delta.cgst,
                    delta_sgst=finding.delta.sgst,
                    delta_cess=finding.delta.cess,
                    taxable_value_effect=finding.taxable_value_effect,
                    interest=finding.interest,
                    penalty=finding.penalty,
                    calc_id=finding.calc_id or "",
                    formula_rendered=finding.trace.formula_rendered if finding.trace else None,
                    legal_basis=finding.legal_basis,
                    evidence_ids=list(finding.evidence_ids),
                    missing_inputs=list(finding.missing_inputs),
                    suggested_form=(
                        finding.suggested_form.value if finding.suggested_form else None
                    ),
                    suppressed_by=finding.suppressed_by,
                )
            )

        for parameter in outcome.parameters:
            session.add(
                ParamRow(
                    id=_new_id(),
                    engine_run_id=run.id,
                    gstin=outcome.gstin,
                    fy=outcome.fy,
                    param_id=parameter.param_id,
                    value=parameter.value,
                    flag=parameter.flag,
                    status=parameter.status.value,
                    banding=parameter.banding.value,
                    direction=parameter.direction,
                    weight=parameter.weight,
                    cohort_p50=parameter.cohort_p50,
                    cohort_p75=parameter.cohort_p75,
                    cohort_p90=parameter.cohort_p90,
                    cohort_p97=parameter.cohort_p97,
                    cohort_n=parameter.cohort_n,
                    calc_id=parameter.calc_id,
                    missing_inputs=list(parameter.missing_inputs),
                )
            )

        session.add(
            RiskScore(
                id=_new_id(),
                engine_run_id=run.id,
                gstin=outcome.gstin,
                fy=outcome.fy,
                p_score=outcome.p_score.score,
                p_coverage=outcome.p_score.coverage,
                p_evaluated=outcome.p_score.evaluated,
                p_band=outcome.p_score.band.value,
                f_score=outcome.f_score.score,
                f_band=outcome.f_score.band,
                dimension_scores={
                    key: format(value, "f")
                    for key, value in outcome.f_score.dimension_scores.items()
                },
                waterfall_json={
                    "p": list(outcome.p_score.waterfall),
                    "f": [entry.as_dict() for entry in outcome.f_score.waterfall],
                    "p_not_evaluated": list(outcome.p_score.not_evaluated),
                },
                p_calc_id=outcome.p_score.calc_id,
                f_calc_id=outcome.f_score.calc_id,
            )
        )

        # The reconciliation matrix, recorded per taxpayer and period.  Its
        # status comes from the engine, which knows each identity's tolerance;
        # deriving it downstream from the delta would eventually disagree with
        # the engine about the same row.
        for period_key, results in outcome.identities.items():
            for identity in results:
                session.add(
                    IdentityCheck(
                        id=_new_id(),
                        engine_run_id=run.id,
                        gstin=outcome.gstin,
                        period=period_key,
                        fy=outcome.fy,
                        identity_id=identity.identity_id,
                        title=identity.title,
                        status=identity.status,
                        delta_igst=identity.delta.igst,
                        delta_cgst=identity.delta.cgst,
                        delta_sgst=identity.delta.sgst,
                        delta_cess=identity.delta.cess,
                        missing_inputs=list(identity.missing_inputs),
                        consequence=identity.consequence,
                        note=identity.note,
                        calc_id=identity.calc_id,
                    )
                )

        for trace in outcome.traces:
            if session.get(CalcTraceRow, trace.calc_id) is not None:
                continue  # the same computation over the same snapshot
            session.add(
                CalcTraceRow(
                    calc_id=trace.calc_id,
                    engine_run_id=run.id,
                    kind=trace.kind.value,
                    subject_id=trace.subject_id,
                    snapshot_id=trace.snapshot_id,
                    gstin=trace.gstin,
                    period=trace.period,
                    fy=trace.fy,
                    legal_basis=trace.legal_basis,
                    formula_template=trace.formula_template,
                    formula_rendered=trace.formula_rendered,
                    payload=trace.as_dict(),
                )
            )

    session.flush()
    return run


# ---------------------------------------------------------------------------
# roll up
# ---------------------------------------------------------------------------


@dataclass
class _RiskBucket:
    taxpayers: int = 0
    p_score_sum: Decimal = _ZERO
    p_coverage_sum: Decimal = _ZERO
    f_score_sum: Decimal = _ZERO
    at_risk: Decimal = _ZERO
    certain: Decimal = _ZERO
    strong: Decimal = _ZERO
    advisory: Decimal = _ZERO
    families: dict[str, int] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.families is None:
            self.families = {}


def rebuild_facts(  # noqa: PLR0912, PLR0915
    # One pass over the outcomes fills all five fact tables.  Splitting it
    # would mean five passes over the same data and five places where a
    # jurisdiction could be attributed differently.
    session: Session,
    run: EngineRun,
    outcomes: list[TaxpayerOutcome],
    *,
    jurisdiction_of: dict[str, str] | None = None,
    officer_of: dict[str, str] | None = None,
) -> dict[str, int]:
    """Roll one engine run up into the fact tables, replacing any earlier build.

    Rebuilding is idempotent: the previous rows for this run are removed first,
    so an on-demand rebuild for one jurisdiction cannot double-count.
    """
    for table in (
        FactFilingPeriod,
        FactRiskSnapshot,
        FactParamIncidence,
        FactEnforcement,
        FactOfficer,
    ):
        session.execute(delete(table).where(table.engine_run_id == run.id))

    jurisdictions = jurisdiction_of or {}
    officers = officer_of or {}

    risk: dict[tuple[str, str, str, str], _RiskBucket] = defaultdict(_RiskBucket)
    incidence: dict[tuple[str, str, str, int], dict[str, Any]] = {}
    filing: dict[tuple[str, str, str], FactFilingPeriod] = {}
    enforcement: dict[tuple[str, str], FactEnforcement] = {}
    officer_rows: dict[tuple[str, str], FactOfficer] = {}

    for outcome in outcomes:
        area = jurisdictions.get(outcome.gstin, UNASSIGNED)
        fy = outcome.fy

        # -- risk, one row per band, P and F kept apart -----------------------
        for kind, band in (("P", outcome.p_score.band.value), ("F", outcome.f_score.band)):
            bucket = risk[(area, fy, kind, band)]
            bucket.taxpayers += 1
            bucket.p_score_sum += outcome.p_score.score
            bucket.p_coverage_sum += outcome.p_score.coverage
            bucket.f_score_sum += outcome.f_score.score
            for finding in outcome.findings:
                if finding.status is not FindingStatus.TRIGGERED:
                    continue
                effect = finding.delta.abs_total or finding.taxable_value_effect.copy_abs()
                family = finding.rule_id.split("-")[0]
                bucket.families[family] = bucket.families.get(family, 0) + 1
                if finding.confidence is Confidence.CERTAIN:
                    bucket.certain += effect
                    bucket.at_risk += effect
                elif finding.confidence is Confidence.STRONG:
                    bucket.strong += effect
                    bucket.at_risk += effect
                else:
                    # ADVISORY is tracked but excluded from revenue at risk:
                    # it would not survive a reply.
                    bucket.advisory += effect

        # -- parameter incidence ---------------------------------------------
        for parameter in outcome.parameters:
            flag = parameter.flag if parameter.evaluated else NOT_EVALUATED_FLAG
            incidence_key = (area, fy, parameter.param_id, int(flag or 0))
            row = incidence.setdefault(
                incidence_key,
                {
                    "count": 0,
                    "feed": parameter.external_feed,
                    "roadmap": parameter.roadmap_ref,
                    "value_sum": _ZERO,
                    "value_n": 0,
                },
            )
            row["count"] += 1
            if parameter.value is not None:
                row["value_sum"] += parameter.value
                row["value_n"] += 1

        # -- filing, from the REG-07 and BEH findings -------------------------
        for finding in outcome.findings:
            if finding.rule_id != "REG-07" or not finding.triggered:
                continue
            buckets: dict[str, Any] = finding.extra.get("buckets", {})  # type: ignore[assignment]
            for status, rows in buckets.items():
                for entry in rows:
                    filing_key = (area, entry["period"], entry["return_type"])
                    fact = filing.get(filing_key)
                    if fact is None:
                        fact = FactFilingPeriod(
                            id=_new_id(),
                            engine_run_id=run.id,
                            jurisdiction=area,
                            period=entry["period"],
                            return_type=entry["return_type"],
                            expected=0,
                            filed=0,
                            on_time=0,
                            late=0,
                            not_filed=0,
                            nil=0,
                            barred=0,
                            near_bar=0,
                            liability=_ZERO,
                            cash_paid=_ZERO,
                            itc_utilised=_ZERO,
                            turnover=_ZERO,
                        )
                        filing[filing_key] = fact
                    fact.expected += 1
                    fact.not_filed += 1
                    if status == "BARRED":
                        fact.barred += 1
                    elif status in {"CRITICAL", "WARNING"}:
                        fact.near_bar += 1

        # -- enforcement and officer -----------------------------------------
        month = f"{fy[:4]}-03"
        enforcement_row = enforcement.get((area, month))
        if enforcement_row is None:
            enforcement_row = FactEnforcement(
                id=_new_id(),
                engine_run_id=run.id,
                jurisdiction=area,
                month=month,
                flagged=0,
                selected=0,
                notices_issued=0,
                replies_received=0,
                appeals=0,
                sustained=0,
                demand_raised=_ZERO,
                demand_confirmed=_ZERO,
                demand_collected=_ZERO,
            )
            enforcement[(area, month)] = enforcement_row
        triggered = [x for x in outcome.findings if x.triggered]
        if triggered:
            enforcement_row.flagged += 1
            enforcement_row.demand_raised += sum(
                (x.delta.positive_part().total for x in triggered), _ZERO
            )

        officer = officers.get(outcome.gstin)
        if officer is not None:
            officer_row = officer_rows.get((officer, month))
            if officer_row is None:
                officer_row = FactOfficer(
                    id=_new_id(),
                    engine_run_id=run.id,
                    officer_id=officer,
                    jurisdiction=area,
                    month=month,
                    cases_open=0,
                    cases_closed=0,
                    notices_pending_approval=0,
                    demand_raised=_ZERO,
                    demand_collected=_ZERO,
                    case_mix={},
                )
                officer_rows[(officer, month)] = officer_row
            officer_row.cases_open += 1 if triggered else 0
            mix = dict(officer_row.case_mix)
            for finding in triggered:
                family = finding.rule_id.split("-")[0]
                mix[family] = mix.get(family, 0) + 1
            officer_row.case_mix = mix

    # -- materialise -------------------------------------------------------
    for (area, fy, kind, band), bucket in risk.items():
        count = Decimal(bucket.taxpayers or 1)
        session.add(
            FactRiskSnapshot(
                id=_new_id(),
                engine_run_id=run.id,
                jurisdiction=area,
                fy=fy,
                band_kind=kind,
                band=band,
                taxpayer_count=bucket.taxpayers,
                p_score_mean=(bucket.p_score_sum / count).quantize(Decimal("0.01")),
                p_coverage_mean=(bucket.p_coverage_sum / count).quantize(Decimal("0.0001")),
                f_score_mean=(bucket.f_score_sum / count).quantize(Decimal("0.01")),
                revenue_at_risk=bucket.at_risk,
                revenue_at_risk_certain=bucket.certain,
                revenue_at_risk_strong=bucket.strong,
                revenue_at_risk_advisory=bucket.advisory,
                findings_by_family=bucket.families,
            )
        )

    for (area, fy, param_id, incidence_flag), row in incidence.items():
        session.add(
            FactParamIncidence(
                id=_new_id(),
                engine_run_id=run.id,
                jurisdiction=area,
                fy=fy,
                param_id=param_id,
                flag=incidence_flag,
                taxpayer_count=row["count"],
                aggregate_value=(
                    (row["value_sum"] / Decimal(row["value_n"])).quantize(Decimal("0.000001"))
                    if row["value_n"]
                    else None
                ),
                external_feed=row["feed"],
                roadmap_ref=row["roadmap"],
            )
        )

    for filing_fact in filing.values():
        session.add(filing_fact)
    for enforcement_fact in enforcement.values():
        session.add(enforcement_fact)
    for officer_fact in officer_rows.values():
        session.add(officer_fact)

    session.flush()
    return {
        "fact_risk_snapshot": len(risk),
        "fact_param_incidence": len(incidence),
        "fact_filing_period": len(filing),
        "fact_enforcement": len(enforcement),
        "fact_officer": len(officer_rows),
    }


def run_and_store(
    session: Session,
    outcomes: list[TaxpayerOutcome],
    *,
    snapshot_id: str,
    as_of: date,
    triggered_by: str,
    jurisdiction_of: dict[str, str] | None = None,
    officer_of: dict[str, str] | None = None,
) -> tuple[EngineRun, dict[str, int]]:
    """Persist a run and roll it up in one step."""
    run = persist_run(
        session,
        outcomes,
        snapshot_id=snapshot_id,
        as_of=as_of,
        triggered_by=triggered_by,
        jurisdiction_of=jurisdiction_of,
    )
    counts = rebuild_facts(
        session, run, outcomes, jurisdiction_of=jurisdiction_of, officer_of=officer_of
    )
    return run, counts


def latest_run(session: Session) -> EngineRun | None:
    return (
        session.execute(select(EngineRun).order_by(EngineRun.started_at.desc()).limit(1))
        .scalars()
        .first()
    )
