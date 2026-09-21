"""Dashboard, drill and provenance endpoints.

**Every monetary value crosses this API as a string.**  Gate G3 tests the
OpenAPI document for it, and the client-side ``Money`` type refuses anything
else.

The drill endpoint is the spine of the whole product:

    chart element -> /dashboard/drill?metric=&bucket=
                  -> the taxpayer list behind it
                  -> the taxpayer file -> the finding -> /calc/{calc_id}
                  -> the row in the uploaded spreadsheet

It exists before any chart is styled, because a bar a Commissioner cannot click
is a bar a Commissioner cannot act on.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from decimal import Decimal
from typing import Annotated, Any, Final

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.aggregation.metrics import METRICS
from app.aggregation.rollup import NOT_EVALUATED_FLAG, latest_run
from app.api.deps import get_session
from app.db.facts import (
    CalcTraceRow,
    FactFilingPeriod,
    FactParamIncidence,
    FactRiskSnapshot,
)
from app.db.models import (
    Case,
    EInvoice,
    EngineRun,
    EWayBill,
    FilingStatus,
    Finding,
    InwardLine,
    LedgerMovement,
    Notice,
    OutwardLine,
    ParamResult,
    Provenance,
    Return3B,
    RiskScore,
    Taxpayer,
)
from app.engine.params_p01_p34 import PARAMETERS

router = APIRouter(tags=["dashboard"])

SessionDep = Annotated[Session, Depends(get_session)]


def _money(value: Decimal | None) -> str:
    """Money leaves this API as a string, always."""
    return format(value if value is not None else Decimal("0.00"), "f")


def _ratio(value: Decimal | None) -> str | None:
    return format(value, "f") if value is not None else None


#: Risk bands, worst last, so a chart reads as a ladder rather than as an
#: alphabet.  Sorting by name gives HIGH, LOW, MODERATE, SEVERE, which asks the
#: reader to reorder it in their head every time.
P_BAND_ORDER: Final[tuple[str, ...]] = ("LOW", "MODERATE", "HIGH", "SEVERE")
F_BAND_ORDER: Final[tuple[str, ...]] = ("GREEN", "AMBER", "ORANGE", "RED")


@dataclass(frozen=True, slots=True)
class _Band:
    band: str
    taxpayer_count: int
    score_mean: Decimal | None
    coverage_mean: Decimal | None


def _collapse_bands(rows: Sequence[FactRiskSnapshot], order: tuple[str, ...]) -> list[_Band]:
    """One row per band, across every jurisdiction and year in scope.

    ``FactRiskSnapshot`` is keyed on (jurisdiction, fy, kind, band) because
    that is what the per-office screens need. A State-wide chart that iterated
    those rows directly showed one bar per jurisdiction per band -- six bars
    all labelled LOW -- which reads as six bands and is not what the chart
    claims to be. So they are summed here.

    The means are weighted by taxpayer count, because each stored mean is
    already an average over that many taxpayers. Averaging the averages would
    give a small division the same say as a large one.
    """
    counts: dict[str, int] = {}
    score_sum: dict[str, Decimal] = {}
    coverage_sum: dict[str, Decimal] = {}
    for row in rows:
        n = row.taxpayer_count
        counts[row.band] = counts.get(row.band, 0) + n
        score = row.p_score_mean if row.band_kind == "P" else row.f_score_mean
        if score is not None:
            score_sum[row.band] = score_sum.get(row.band, Decimal("0")) + score * n
        if row.p_coverage_mean is not None:
            coverage_sum[row.band] = (
                coverage_sum.get(row.band, Decimal("0")) + row.p_coverage_mean * n
            )

    def mean(totals: dict[str, Decimal], band: str, places: str) -> Decimal | None:
        total = totals.get(band)
        n = counts.get(band, 0)
        return None if total is None or n == 0 else (total / n).quantize(Decimal(places))

    known = [band for band in order if band in counts]
    # A band the ladder does not name is still shown, at the end, rather than
    # dropped: silently losing a band would understate the portfolio.
    unknown = sorted(band for band in counts if band not in order)
    return [
        _Band(
            band=band,
            taxpayer_count=counts[band],
            score_mean=mean(score_sum, band, "0.01"),
            coverage_mean=mean(coverage_sum, band, "0.0001"),
        )
        for band in [*known, *unknown]
    ]


def _require_run(session: Session, run_id: str | None) -> EngineRun:
    run = session.get(EngineRun, run_id) if run_id else latest_run(session)
    if run is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_ENGINE_RUN", "message": "no engine run has been recorded yet"},
        )
    return run


# ---------------------------------------------------------------------------
# metric catalogue
# ---------------------------------------------------------------------------


@router.get("/dashboard/metrics")
def metric_catalogue() -> dict[str, Any]:
    """Every reported number, with its formula, grain and drill dimension.

    One definition site per metric: this is what `report`, the dashboard and
    any export all read, so they cannot drift apart.
    """
    return {"count": len(METRICS), "items": [spec.as_dict() for spec in METRICS.values()]}


# ---------------------------------------------------------------------------
# overview
# ---------------------------------------------------------------------------


@router.get("/dashboard/overview")
def overview(
    session: SessionDep,
    run_id: str | None = None,
    jurisdiction: str | None = None,
) -> dict[str, Any]:
    """The KPI strip and the headline cards.

    Served entirely from the rollups.  Nothing here scans the transaction
    tables, which is what keeps a 48,000-taxpayer dashboard inside its budget.
    """
    run = _require_run(session, run_id)

    risk_query = select(FactRiskSnapshot).where(FactRiskSnapshot.engine_run_id == run.id)
    if jurisdiction:
        risk_query = risk_query.where(FactRiskSnapshot.jurisdiction == jurisdiction)
    risk_rows = session.execute(risk_query).scalars().all()

    p_rows = [row for row in risk_rows if row.band_kind == "P"]
    f_rows = [row for row in risk_rows if row.band_kind == "F"]

    taxpayers = sum(row.taxpayer_count for row in p_rows)
    at_risk = sum((row.revenue_at_risk for row in p_rows), Decimal("0.00"))
    certain = sum((row.revenue_at_risk_certain for row in p_rows), Decimal("0.00"))
    strong = sum((row.revenue_at_risk_strong for row in p_rows), Decimal("0.00"))
    advisory = sum((row.revenue_at_risk_advisory for row in p_rows), Decimal("0.00"))

    filing_query = select(
        func.coalesce(func.sum(FactFilingPeriod.expected), 0),
        func.coalesce(func.sum(FactFilingPeriod.not_filed), 0),
        func.coalesce(func.sum(FactFilingPeriod.barred), 0),
        func.coalesce(func.sum(FactFilingPeriod.near_bar), 0),
    ).where(FactFilingPeriod.engine_run_id == run.id)
    if jurisdiction:
        filing_query = filing_query.where(FactFilingPeriod.jurisdiction == jurisdiction)
    expected, not_filed, barred, near_bar = session.execute(filing_query).one()

    coverage = _coverage_summary(session, run, jurisdiction)

    return {
        "engine_run_id": run.id,
        "as_of": run.as_of.isoformat(),
        "fy": run.fy,
        "jurisdiction": jurisdiction,
        "kpi": [
            {
                "metric": "taxpayers",
                "title": "Taxpayers",
                "value": str(taxpayers),
                "unit": "count",
                "drill": f"/dashboard/drill?metric=M-K01&bucket=ALL&run_id={run.id}",
            },
            {
                "metric": "M-K05",
                "title": "Revenue at risk",
                "value": _money(at_risk),
                "unit": "money",
                "note": "CERTAIN and STRONG only; ADVISORY would not survive a reply.",
                "drill": f"/dashboard/drill?metric=M-K05&bucket=CERTAIN&run_id={run.id}",
            },
            {
                "metric": "M-F04",
                "title": "Periods not filed",
                "value": str(not_filed),
                "unit": "count",
                "drill": f"/dashboard/drill?metric=M-F04&bucket=NOT_FILED&run_id={run.id}",
            },
            {
                "metric": "M-F06",
                "title": "Periods near the three-year bar",
                "value": str(near_bar),
                "unit": "count",
                "drill": f"/dashboard/drill?metric=M-F06&bucket=NEAR_BAR&run_id={run.id}",
            },
            {
                "metric": "M-F07",
                "title": "Periods already barred",
                "value": str(barred),
                "unit": "count",
                "note": "Time-barred: the return can never be filed.",
                "drill": f"/dashboard/drill?metric=M-F07&bucket=BARRED&run_id={run.id}",
            },
            {
                "metric": "M-K02",
                "title": "Mean P-coverage",
                "value": coverage["coverage"],
                "unit": "ratio",
                "note": coverage["sentence"],
                "drill": f"/dashboard/drill?metric=M-K02&bucket=ALL&run_id={run.id}",
            },
        ],
        "risk_landscape": {
            "p_bands": [
                {
                    "band": band.band,
                    "taxpayer_count": band.taxpayer_count,
                    "p_score_mean": _ratio(band.score_mean),
                    "p_coverage_mean": _ratio(band.coverage_mean),
                    "drill": f"/dashboard/drill?metric=M-K01&bucket={band.band}&run_id={run.id}",
                }
                for band in _collapse_bands(p_rows, P_BAND_ORDER)
            ],
            "f_bands": [
                {
                    "band": band.band,
                    "taxpayer_count": band.taxpayer_count,
                    "f_score_mean": _ratio(band.score_mean),
                    "drill": f"/dashboard/drill?metric=M-K04&bucket={band.band}&run_id={run.id}",
                }
                for band in _collapse_bands(f_rows, F_BAND_ORDER)
            ],
            "note": "The two scores answer different questions and are never fused.",
        },
        "revenue_at_risk_by_confidence": [
            {
                "confidence": "CERTAIN",
                "value": _money(certain),
                "drill": f"/dashboard/drill?metric=M-K05&bucket=CERTAIN&run_id={run.id}",
            },
            {
                "confidence": "STRONG",
                "value": _money(strong),
                "drill": f"/dashboard/drill?metric=M-K05&bucket=STRONG&run_id={run.id}",
            },
            {
                "confidence": "ADVISORY",
                "value": _money(advisory),
                "drill": f"/dashboard/drill?metric=M-K05&bucket=ADVISORY&run_id={run.id}",
                "note": "Excluded from revenue at risk.",
            },
        ],
        "coverage": coverage,
        "expected_filings": expected,
    }


def _coverage_summary(session: Session, run: EngineRun, jurisdiction: str | None) -> dict[str, Any]:
    """The P-coverage meter: how many of the 34 are dark, and what they await.

    That sentence, with a number attached, is the integration business case,
    and it belongs on the Commissioner's first screen rather than in a slide.
    """
    query = select(FactParamIncidence).where(
        FactParamIncidence.engine_run_id == run.id,
        FactParamIncidence.flag == NOT_EVALUATED_FLAG,
    )
    if jurisdiction:
        query = query.where(FactParamIncidence.jurisdiction == jurisdiction)
    dark_rows = session.execute(query).scalars().all()

    total_query = select(func.count(func.distinct(RiskScore.gstin))).where(
        RiskScore.engine_run_id == run.id
    )
    taxpayers = session.execute(total_query).scalar_one() or 0

    dark_params = {row.param_id for row in dark_rows}
    feeds = sorted({row.external_feed for row in dark_rows if row.external_feed})
    evaluated = len(PARAMETERS) - len(dark_params)
    coverage = format(Decimal(evaluated) / Decimal(len(PARAMETERS)), ".4f") if PARAMETERS else "0"

    sentence = (
        f"P-Score computed over an average of {evaluated} of {len(PARAMETERS)} parameters"
        + (f" -- {len(dark_params)} await {', '.join(feeds)}." if feeds else ".")
    )
    return {
        "evaluated": evaluated,
        "total": len(PARAMETERS),
        "coverage": coverage,
        "dark_parameters": sorted(dark_params),
        "awaiting_feeds": feeds,
        "taxpayers": taxpayers,
        "sentence": sentence,
    }


# ---------------------------------------------------------------------------
# D5 -- the parameter explorer
# ---------------------------------------------------------------------------


@router.get("/dashboard/parameters")
def parameter_incidence(
    session: SessionDep,
    run_id: str | None = None,
    jurisdiction: str | None = None,
) -> dict[str, Any]:
    """The 34 x (flag 0-4 + NOT_EVALUATED) incidence matrix.

    The NOT_EVALUATED column is not an embarrassment to hide -- it is the
    roadmap, priced -- so it is returned at the same weight as the rest.
    """
    run = _require_run(session, run_id)
    query = select(FactParamIncidence).where(FactParamIncidence.engine_run_id == run.id)
    if jurisdiction:
        query = query.where(FactParamIncidence.jurisdiction == jurisdiction)
    rows = session.execute(query).scalars().all()

    matrix: dict[str, dict[str, Any]] = {}
    for param_id, spec in sorted(PARAMETERS.items()):
        matrix[param_id] = {
            "param_id": param_id,
            "title": spec.title,
            "banding": spec.banding.value,
            "direction": spec.direction,
            "weight": format(spec.weight, "f"),
            "action_point": spec.action_point,
            "metric": spec.metric_description,
            "external_feed": spec.external_feed,
            "roadmap_ref": spec.roadmap_ref,
            "related_rules": list(spec.related_rules),
            "flags": {str(level): 0 for level in range(5)},
            "not_evaluated": 0,
        }
    for row in rows:
        entry = matrix.get(row.param_id)
        if entry is None:
            continue
        if row.flag == NOT_EVALUATED_FLAG:
            entry["not_evaluated"] += row.taxpayer_count
        else:
            entry["flags"][str(row.flag)] += row.taxpayer_count

    for param_id, entry in matrix.items():
        entry["drill"] = {
            **{
                f"flag{level}": (
                    f"/dashboard/drill?metric=M-K03&bucket={param_id}:flag{level}&run_id={run.id}"
                )
                for level in range(5)
            },
            "not_evaluated": (
                f"/dashboard/drill?metric=M-K03&bucket={param_id}:not_evaluated&run_id={run.id}"
            ),
        }

    return {
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "items": list(matrix.values()),
        "note": (
            "Flag cut-offs are platform defaults -- peer-cohort percentiles -- "
            "awaiting departmental approval. They are not departmental policy."
        ),
    }


# ---------------------------------------------------------------------------
# the drill contract
# ---------------------------------------------------------------------------


@router.get("/dashboard/drill")
def drill(  # noqa: PLR0917 - FastAPI binds query parameters by name
    session: SessionDep,
    metric: Annotated[str, Query(description="a metric id from /dashboard/metrics")],
    bucket: Annotated[str, Query(description="the chart element that was clicked")],
    run_id: str | None = None,
    jurisdiction: str | None = None,
    page: int = 1,
    size: int = 50,
) -> dict[str, Any]:
    """The taxpayer list behind any chart element.

    Every visual element on every dashboard resolves here.  No exceptions, no
    dead ends.
    """
    if metric not in METRICS:
        raise HTTPException(
            status_code=404,
            detail={"code": "UNKNOWN_METRIC", "message": f"no metric {metric!r}"},
        )
    run = _require_run(session, run_id)
    spec = METRICS[metric]

    gstins = _gstins_for_bucket(session, run, metric, bucket)
    total = len(gstins)
    empty_because = _why_empty(session, bucket) if total == 0 else None
    window = sorted(gstins)[(page - 1) * size : page * size]

    items: list[dict[str, Any]] = []
    for gstin in window:
        taxpayer = session.get(Taxpayer, gstin)
        score = (
            session.execute(
                select(RiskScore).where(RiskScore.engine_run_id == run.id, RiskScore.gstin == gstin)
            )
            .scalars()
            .first()
        )
        items.append(
            {
                "gstin": gstin,
                "legal_name": taxpayer.legal_name if taxpayer else None,
                "trade_name": taxpayer.trade_name if taxpayer else None,
                "division": taxpayer.division if taxpayer else None,
                "officer_id": taxpayer.officer_id if taxpayer else None,
                "p_score": _ratio(score.p_score) if score else None,
                "p_coverage": _ratio(score.p_coverage) if score else None,
                "p_band": score.p_band if score else None,
                "f_score": _ratio(score.f_score) if score else None,
                "f_band": score.f_band if score else None,
                "p_calc_id": score.p_calc_id if score else None,
                "f_calc_id": score.f_calc_id if score else None,
                "href": f"/workbench/taxpayer/{gstin}",
            }
        )

    return {
        "metric": spec.as_dict(),
        "bucket": bucket,
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "total": total,
        "page": page,
        "size": size,
        "items": items,
        # An empty drill has two very different causes, and a screen that drew
        # them the same way would send an officer looking for a bug that is
        # really a missing upload.
        "empty_because": empty_because,
    }


#: Bucket prefix -> the canonical table that must be present for it to resolve.
_BUCKET_REQUIRES: Final[tuple[tuple[str, type[Any], str], ...]] = (
    ("filing:", FilingStatus, "filing status register (filed returns with ARN and date)"),
    ("bar:", FilingStatus, "filing status register (filed returns with ARN and date)"),
    ("revenue:", Return3B, "GSTR-3B"),
)


def _why_empty(session: Session, bucket: str) -> dict[str, Any] | None:
    """Why a drill returned nothing.

    ``None`` means the query ran against data that was present and simply
    matched no taxpayer -- a real answer. A dict means the dataset the bucket
    needs was never supplied, which is a different statement entirely.
    """
    for prefix, table, dataset in _BUCKET_REQUIRES:
        if (
            bucket.startswith(prefix)
            and not session.execute(select(func.count()).select_from(table)).scalar()
        ):
            return {
                "reason": "DATASET_NOT_SUPPLIED",
                "missing_inputs": [dataset],
                "message": (
                    f"No taxpayer is listed because {dataset} was not ingested in this "
                    "run. This is not a count of zero."
                ),
            }
    return {
        "reason": "NO_MATCH",
        "missing_inputs": [],
        "message": "The data for this element was present; no taxpayer matched it.",
    }


def _bucket_param_incidence(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """M-K03: one cell of the parameter incidence matrix, "P14:flag4"."""
    param_id, _, cell = bucket.partition(":")
    query = select(ParamResult.gstin).where(
        ParamResult.engine_run_id == run.id, ParamResult.param_id == param_id
    )
    if cell == "not_evaluated":
        query = query.where(ParamResult.flag.is_(None))
    elif cell.startswith("flag"):
        query = query.where(ParamResult.flag == int(cell.removeprefix("flag")))
    return set(session.execute(query).scalars().all())


def _bucket_filing(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """D2: a filing cell, "filing:062025:late".

    The filing facts count return-periods, so the taxpayers behind a cell come
    from the filing status rows rather than from a rule.
    """
    del run
    period, _, status = bucket.removeprefix("filing:").partition(":")
    query = select(FilingStatus.gstin).where(FilingStatus.period == period)
    if status == "on_time":
        query = query.where(FilingStatus.status == "FILED", FilingStatus.days_late <= 0)
    elif status == "late":
        query = query.where(FilingStatus.days_late > 0)
    elif status == "not_filed":
        query = query.where(FilingStatus.status != "FILED")
    return set(session.execute(query).scalars().all())


def _bucket_bar(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """D2: the three-year bar, as at the run's injected evaluation date."""
    query = select(FilingStatus.gstin).where(FilingStatus.barred_on.is_not(None))
    if bucket == "bar:barred":
        query = query.where(FilingStatus.barred_on <= run.as_of)
    elif bucket == "bar:near":
        query = query.where(FilingStatus.barred_on > run.as_of)
    return set(session.execute(query).scalars().all())


def _bucket_revenue(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """D3: everyone who filed a 3B for that period."""
    del run
    period = bucket.removeprefix("revenue:")
    return set(session.execute(select(Return3B.gstin).where(Return3B.period == period)).scalars())


def _bucket_funnel(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """D6: one stage of the enforcement funnel.

    Appeals are not modelled yet, so the appeal stages resolve to an empty set.
    That is the honest answer, and the funnel already states that a zero stage
    means nothing has reached it rather than that the stage failed.
    """
    stage = bucket.removeprefix("funnel:")
    if stage.startswith("month:"):
        month = stage.removeprefix("month:")
        return set(
            session.execute(select(Case.gstin).where(func.substr(Case.fy, 1, 7) == month)).scalars()
        )
    if stage == "flagged":
        return set(
            session.execute(
                select(Finding.gstin).where(
                    Finding.engine_run_id == run.id, Finding.status == "TRIGGERED"
                )
            ).scalars()
        )
    if stage == "selected":
        return set(session.execute(select(Case.gstin)).scalars())
    if stage in {"notices_issued", "replies_received"}:
        query = select(Case.gstin).join(Notice, Notice.case_id == Case.id)
        if stage == "replies_received":
            query = query.where(Notice.reply_received_at.is_not(None))
        return set(session.execute(query).scalars())
    return set()


def _bucket_attribute(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """D7 / D8 / D9: a division, an officer or a sector."""
    del run
    prefix, _, value = bucket.partition(":")
    column = {
        "jurisdiction": Taxpayer.division,
        "officer": Taxpayer.officer_id,
        "sector": Taxpayer.sector_code,
    }[prefix]
    query = select(Taxpayer.gstin)
    query = (
        query.where(column.is_(None)) if value == "unclassified" else query.where(column == value)
    )
    return set(session.execute(query).scalars())


def _bucket_confidence(session: Session, run: EngineRun, bucket: str) -> set[str]:
    """M-K05: revenue at risk, by confidence tier."""
    query = select(Finding.gstin).where(
        Finding.engine_run_id == run.id, Finding.status == "TRIGGERED"
    )
    if bucket in {"CERTAIN", "STRONG", "ADVISORY"}:
        query = query.where(Finding.confidence == bucket)
    return set(session.execute(query).scalars())


def _bucket_band(session: Session, run: EngineRun, metric: str, bucket: str) -> set[str]:
    """M-K01 / M-K04: a risk band, on whichever score the metric names."""
    column = RiskScore.p_band if metric == "M-K01" else RiskScore.f_band
    query = select(RiskScore.gstin).where(RiskScore.engine_run_id == run.id)
    if bucket != "ALL":
        query = query.where(column == bucket)
    return set(session.execute(query).scalars())


#: Bucket prefix -> resolver.  An explicit dict rather than a chain of ifs, so
#: adding a chart means adding a row here and nothing else.
_BUCKET_RESOLVERS: Final[tuple[tuple[str, Callable[[Session, EngineRun, str], set[str]]], ...]] = (
    ("filing:", _bucket_filing),
    ("bar:", _bucket_bar),
    ("revenue:", _bucket_revenue),
    ("funnel:", _bucket_funnel),
    ("jurisdiction:", _bucket_attribute),
    ("officer:", _bucket_attribute),
    ("sector:", _bucket_attribute),
)


def _gstins_for_bucket(session: Session, run: EngineRun, metric: str, bucket: str) -> set[str]:
    """Resolve one chart element to the taxpayers behind it.

    Every element of every chart reaches this function. A bucket that does not
    resolve returns the empty set and the drill screen says so, rather than
    quietly falling back to "everyone", which would look like a working drill
    and be a wrong answer.
    """
    for prefix, resolver in _BUCKET_RESOLVERS:
        if bucket.startswith(prefix):
            return resolver(session, run, bucket)

    if metric == "M-K03" and ":" in bucket:
        return _bucket_param_incidence(session, run, bucket)
    if metric == "M-K05":
        return _bucket_confidence(session, run, bucket)
    if metric in {"M-K01", "M-K04"}:
        return _bucket_band(session, run, metric, bucket)

    # M-F*: the filing rules, which come from REG-07.
    if metric.startswith("M-F"):
        return set(
            session.execute(
                select(Finding.gstin).where(
                    Finding.engine_run_id == run.id,
                    Finding.rule_id == "REG-07",
                    Finding.status == "TRIGGERED",
                )
            ).scalars()
        )

    # M-K06 / M-Q*: a rule family or a single rule.
    query = select(Finding.gstin).where(
        Finding.engine_run_id == run.id, Finding.status == "TRIGGERED"
    )
    if bucket not in {"ALL", ""}:
        query = query.where(Finding.rule_id.startswith(bucket))
    return set(session.execute(query).scalars())


# ---------------------------------------------------------------------------
# provenance -- the drawer that is the product
# ---------------------------------------------------------------------------


#: The canonical row tables an evidence id can point at.  A rule cites the row
#: it read; the drawer follows that row to the file, sheet and cells behind it.
_EVIDENCE_TABLES: Final[tuple[type[Any], ...]] = (
    OutwardLine,
    InwardLine,
    Return3B,
    LedgerMovement,
    EWayBill,
    EInvoice,
)


def _resolve_evidence(session: Session, evidence_id: str) -> dict[str, Any]:
    """Follow one evidence id to the spreadsheet cells behind it.

    An evidence id is usually a canonical row id; the row carries the pointer
    to its Provenance record.  A trace written before the rows were persisted
    may also cite a provenance id directly, so both are tried.
    """
    provenance = session.get(Provenance, evidence_id)
    if provenance is None:
        for table in _EVIDENCE_TABLES:
            canonical = session.get(table, evidence_id)
            if canonical is not None and canonical.prov_id:
                provenance = session.get(Provenance, canonical.prov_id)
                break
    if provenance is None:
        return {
            "id": evidence_id,
            "resolved": False,
            "reason": "the source row is not in this database",
        }
    return {
        "id": evidence_id,
        "resolved": True,
        "file_name": provenance.file_name,
        "file_sha256": provenance.file_sha256,
        "sheet_name": provenance.sheet_name,
        "row_index": provenance.row_index,
        "header_row_index": provenance.header_row_index,
        "original_cells": provenance.original_cells,
    }


@router.get("/calc/{calc_id}")
def calc(calc_id: str, session: SessionDep) -> dict[str, Any]:
    """Resolve a calc_id to the whole computation behind it.

    The rule or parameter, its legal basis, the formula as written, the formula
    as executed, every intermediate term, every parameter with its effective
    date and notification reference, and the source rows with their original
    cell values.

    This drawer is the product.  Everything else is navigation to it.
    """
    row = session.get(CalcTraceRow, calc_id)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "UNKNOWN_CALC_ID", "message": f"no computation {calc_id!r}"},
        )

    payload = dict(row.payload)
    payload["sources"] = [
        _resolve_evidence(session, evidence_id) for evidence_id in payload.get("evidence_ids", [])
    ]
    payload["engine_run_id"] = row.engine_run_id
    return payload
