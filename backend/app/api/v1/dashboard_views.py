"""The remaining Dashboard surfaces: D2, D3, D4, D6, D7, D8, D9.

Every one reads the nightly fact tables rather than recomputing, and every
element it returns carries the ``metric`` and ``bucket`` that
``/dashboard/drill`` resolves to the taxpayers behind it.  A chart element with
no drill path is not shipped -- ``<ChartCard>`` will not render one, and this is
the server side of that contract.

Three habits are load-bearing here:

* **A ratio with a zero denominator is ``None``, not zero.**  "No returns were
  due" and "no returns were filed" are different facts, and a screen that drew
  them the same way would be read wrongly by the only people who matter.
* **Money and ratios leave as strings.**  Division happens here, in ``Decimal``,
  once.
* **An empty fact table says so.**  A period with no rows returns no row and the
  screen names the gap, rather than drawing a zero that looks like a finding.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Any, Final

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.aggregation.rollup import latest_run
from app.api.deps import get_session
from app.db.facts import (
    FactEnforcement,
    FactFilingPeriod,
    FactOfficer,
    FactRiskSnapshot,
)
from app.db.models import EngineRun, FilingStatus, Finding, Return3B, RiskScore, Taxpayer
from app.engine.peers import MIN_COHORT

router = APIRouter(tags=["dashboard"])

SessionDep = Annotated[Session, Depends(get_session)]

#: The count columns of the filing fact, summed the same way everywhere.
_FILING_COUNTS: Final[tuple[str, ...]] = (
    "expected",
    "filed",
    "on_time",
    "late",
    "not_filed",
    "nil",
    "barred",
    "near_bar",
)

#: Ratios are carried at ten places, as the RATIO column stores them.
_RATIO_PLACES: Final[Decimal] = Decimal("0.0000000001")


def _money(value: Decimal | None) -> str:
    return format(value if value is not None else Decimal("0.00"), "f")


def _ratio(value: Decimal | None) -> str | None:
    return format(value, "f") if value is not None else None


def _divide(numerator: Decimal | int, denominator: Decimal | int) -> Decimal | None:
    """A ratio, or ``None`` when there is nothing to divide by.

    Never returns zero for a zero denominator.  "Nothing was due" is not "none
    complied", and the difference decides whether an officer acts.
    """
    bottom = Decimal(denominator)
    if bottom == 0:
        return None
    return (Decimal(numerator) / bottom).quantize(_RATIO_PLACES)


def _require_run(session: Session, run_id: str | None) -> EngineRun:
    run = session.get(EngineRun, run_id) if run_id else latest_run(session)
    if run is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_ENGINE_RUN", "message": "no engine run has been recorded yet"},
        )
    return run


def _drill(metric: str, bucket: str) -> str:
    return f"/dashboard/drill?metric={metric}&bucket={bucket}"


def _dataset_present(session: Session, table: Any) -> bool:
    """Whether a canonical table holds any row at all.

    This is a definitive check, not an inference from zeros: "every figure is
    zero" and "the dataset was never supplied" look identical on a chart and
    mean opposite things to an officer.
    """
    return bool(session.execute(select(func.count()).select_from(table)).scalar())


def _not_evaluated(*missing: str) -> dict[str, Any]:
    """The shape a metric reports when it could not be computed.

    Identical in spirit to a rule's NOT_EVALUATED: it names the dataset it
    needed. A zero would have been a lie an officer could act on.
    """
    return {
        "status": "NOT_EVALUATED",
        "value": None,
        "missing_inputs": list(missing),
        "note": (
            "Not evaluated. This is not zero and not a finding: the dataset named "
            "above was not present in this run."
        ),
    }


def _head_wise_total() -> Any:
    """The four heads summed, for a portfolio total only.

    Law 3 forbids collapsing a `TaxVector` into a scalar anywhere a head-wise
    answer is meaningful.  A portfolio "revenue at risk" is the one place it is
    not: no officer acts on the IGST share of a division.  The collapse is
    named here, once, so it is visible rather than buried in a query.
    """
    return func.sum(
        Finding.delta_igst + Finding.delta_cgst + Finding.delta_sgst + Finding.delta_cess
    )


# ---------------------------------------------------------------------------
# D2 -- filing compliance
# ---------------------------------------------------------------------------


@router.get("/dashboard/filing")
def filing(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
    jurisdiction: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """M-F01 to M-F09, on a calendar of periods against jurisdiction.

    The three-year bar is the number an officer acts on first, so it is
    returned beside the compliance rates rather than on a screen of its own.
    """
    run = _require_run(session, run_id)

    stmt = select(FactFilingPeriod).where(FactFilingPeriod.engine_run_id == run.id)
    if jurisdiction:
        stmt = stmt.where(FactFilingPeriod.jurisdiction == jurisdiction)
    rows = session.execute(stmt.order_by(FactFilingPeriod.period)).scalars().all()

    by_period: dict[str, dict[str, Any]] = {}
    for row in rows:
        bucket = by_period.setdefault(
            row.period,
            {
                "period": row.period,
                "expected": 0,
                "filed": 0,
                "on_time": 0,
                "late": 0,
                "not_filed": 0,
                "nil": 0,
                "barred": 0,
                "near_bar": 0,
                "return_types": [],
            },
        )
        for field in _FILING_COUNTS:
            bucket[field] += getattr(row, field)
        bucket["return_types"].append(row.return_type)

    # fact_filing_period is built from triggered REG-07 findings, so it holds
    # periods that were NOT filed.  A rate computed as filed/expected over it
    # would divide by a denominator that counts only failures -- a statistic
    # that reads as "0% compliance" and means nothing of the kind.  The filed
    # side needs the filing-status register, so the rates are reported only
    # when that register is present.
    register = _dataset_present(session, FilingStatus)

    periods = []
    for period, bucket in sorted(by_period.items()):
        expected = bucket["expected"]
        periods.append(
            {
                **bucket,
                "return_types": sorted(set(bucket["return_types"])),
                "compliance_rate": _ratio(_divide(bucket["filed"], expected)) if register else None,
                "on_time_rate": _ratio(_divide(bucket["on_time"], expected)) if register else None,
                "non_filer_share": _ratio(_divide(bucket["not_filed"], expected))
                if register
                else None,
                "nil_share": _ratio(_divide(bucket["nil"], bucket["filed"])) if register else None,
                "rates_evaluated": register,
                "drill": {
                    "on_time": _drill("M-F02", f"filing:{period}:on_time"),
                    "late": _drill("M-F02", f"filing:{period}:late"),
                    "not_filed": _drill("M-F04", f"filing:{period}:not_filed"),
                },
            }
        )

    totals = {field: sum(int(p[field]) for p in periods) for field in _FILING_COUNTS}

    return {
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "periods": periods,
        "totals": {
            **totals,
            "compliance_rate": _ratio(_divide(totals["filed"], totals["expected"]))
            if register
            else None,
            "on_time_rate": _ratio(_divide(totals["on_time"], totals["expected"]))
            if register
            else None,
        },
        "compliance": None
        if register
        else _not_evaluated("filing status register (filed returns with ARN and filing date)")
        | {
            "detail": (
                "What is shown below is drawn from the periods the engine found "
                "UNFILED. Counting those against themselves would report a compliance "
                "rate of zero, which is not what the data says."
            )
        },
        "bar": {
            "barred": totals["barred"],
            "near_bar": totals["near_bar"],
            "drill": {
                "barred": _drill("M-F07", "bar:barred"),
                "near_bar": _drill("M-F06", "bar:near"),
            },
            "note": (
                "Section 39(11): a return not filed within three years of its due date "
                "can no longer be filed at all. A barred period is revenue the "
                "department cannot recover through the return."
            ),
        },
        "note": (
            "Counts are of return-periods, not taxpayers. A rate is null where nothing "
            "was due in that period."
            if periods
            else "No filing facts were recorded in this run."
        ),
    }


# ---------------------------------------------------------------------------
# D3 -- revenue and liability
# ---------------------------------------------------------------------------


@router.get("/dashboard/revenue")
def revenue(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
    jurisdiction: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """M-R01 to M-R09.

    Turnover and liability are returned as two series and are never drawn on
    one pair of axes: a second y-axis invites a comparison the data does not
    support.
    """
    run = _require_run(session, run_id)

    stmt = select(FactFilingPeriod).where(FactFilingPeriod.engine_run_id == run.id)
    if jurisdiction:
        stmt = stmt.where(FactFilingPeriod.jurisdiction == jurisdiction)
    rows = session.execute(stmt.order_by(FactFilingPeriod.period)).scalars().all()

    by_period: dict[str, dict[str, Decimal]] = {}
    for row in rows:
        bucket = by_period.setdefault(
            row.period,
            {
                "turnover": Decimal("0.00"),
                "liability": Decimal("0.00"),
                "cash_paid": Decimal("0.00"),
                "itc_utilised": Decimal("0.00"),
            },
        )
        bucket["turnover"] += row.turnover
        bucket["liability"] += row.liability
        bucket["cash_paid"] += row.cash_paid
        bucket["itc_utilised"] += row.itc_utilised

    # Every money column of fact_filing_period is written from GSTR-3B.  With
    # no 3B ingested there is nothing to report, and reporting Rs 0.00 for a
    # period whose return was never supplied is the exact failure Law 5 names.
    returns_present = _dataset_present(session, Return3B)

    periods = [
        {
            "period": period,
            "turnover": _money(values["turnover"]) if returns_present else None,
            "liability": _money(values["liability"]) if returns_present else None,
            "cash_paid": _money(values["cash_paid"]) if returns_present else None,
            "itc_utilised": _money(values["itc_utilised"]) if returns_present else None,
            "cash_ratio": _ratio(_divide(values["cash_paid"], values["liability"]))
            if returns_present
            else None,
            "itc_ratio": _ratio(_divide(values["itc_utilised"], values["liability"]))
            if returns_present
            else None,
            "itc_to_turnover": _ratio(_divide(values["itc_utilised"], values["turnover"]))
            if returns_present
            else None,
            "effective_rate": _ratio(_divide(values["liability"], values["turnover"]))
            if returns_present
            else None,
            "evaluated": returns_present,
            "drill": _drill("M-R02", f"revenue:{period}"),
        }
        for period, values in sorted(by_period.items())
    ]

    return {
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "periods": periods,
        "series": None
        if returns_present
        else _not_evaluated("GSTR-3B (table 3.1 liability, table 6.1 cash and ITC utilisation)"),
        "boundary": {
            "period": "092025",
            "on": "2025-09-22",
            "label": "GST 2.0 rate revision",
            "note": (
                "Rates changed on 22 September 2025, mid-period. A series that crosses "
                "this date is not comparing like with like, and the boundary is marked "
                "on the time axis for that reason."
            ),
        },
        "note": (
            "Turnover and liability are separate series. There is no second y-axis."
            if returns_present
            else (
                "No GSTR-3B was ingested in this run, so no revenue series can be "
                "drawn. The periods below are listed so the gap is visible."
            )
        ),
    }


# ---------------------------------------------------------------------------
# D4 -- the risk landscape
# ---------------------------------------------------------------------------


@router.get("/dashboard/risk")
def risk(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
    jurisdiction: Annotated[str | None, Query()] = None,
    fy: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """M-K01 to M-K08: the two distributions, side by side, never fused."""
    run = _require_run(session, run_id)

    stmt = select(FactRiskSnapshot).where(FactRiskSnapshot.engine_run_id == run.id)
    if jurisdiction:
        stmt = stmt.where(FactRiskSnapshot.jurisdiction == jurisdiction)
    if fy:
        stmt = stmt.where(FactRiskSnapshot.fy == fy)
    rows = session.execute(stmt).scalars().all()

    def _bands(kind: str, metric: str) -> list[dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        for row in rows:
            if row.band_kind != kind:
                continue
            bucket = merged.setdefault(
                row.band,
                {
                    "band": row.band,
                    "taxpayer_count": 0,
                    "revenue_at_risk": Decimal("0.00"),
                    "_p_sum": Decimal("0"),
                    "_c_sum": Decimal("0"),
                    "_f_sum": Decimal("0"),
                    "_n": 0,
                },
            )
            bucket["taxpayer_count"] += row.taxpayer_count
            bucket["revenue_at_risk"] += row.revenue_at_risk
            if row.taxpayer_count:
                bucket["_n"] += row.taxpayer_count
                bucket["_p_sum"] += (row.p_score_mean or Decimal(0)) * row.taxpayer_count
                bucket["_c_sum"] += (row.p_coverage_mean or Decimal(0)) * row.taxpayer_count
                bucket["_f_sum"] += (row.f_score_mean or Decimal(0)) * row.taxpayer_count

        out = []
        for band, bucket in merged.items():
            n = bucket["_n"]
            out.append(
                {
                    "band": band,
                    "taxpayer_count": bucket["taxpayer_count"],
                    "revenue_at_risk": _money(bucket["revenue_at_risk"]),
                    "p_score_mean": _ratio(_divide(bucket["_p_sum"], n)) if n else None,
                    "p_coverage_mean": _ratio(_divide(bucket["_c_sum"], n)) if n else None,
                    "f_score_mean": _ratio(_divide(bucket["_f_sum"], n)) if n else None,
                    "drill": _drill(metric, band),
                }
            )
        return sorted(out, key=lambda item: -item["taxpayer_count"])

    confidence = {
        row.confidence: row.total
        for row in session.execute(
            select(
                Finding.confidence.label("confidence"),
                _head_wise_total().label("total"),
            )
            .where(Finding.engine_run_id == run.id, Finding.status == "TRIGGERED")
            .group_by(Finding.confidence)
        )
    }

    return {
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "p_bands": _bands("P", "M-K01"),
        "f_bands": _bands("F", "M-K04"),
        "revenue_at_risk_by_confidence": [
            {
                "confidence": level,
                "value": _money(confidence.get(level)),
                "drill": _drill("M-K05", level),
                "note": note,
            }
            for level, note in (
                ("CERTAIN", "An arithmetic identity failed. This survives a reply."),
                ("STRONG", "A documented rule fired on complete data."),
                (
                    "ADVISORY",
                    "A worklist item. It may never populate a notice without an "
                    "officer promoting it expressly.",
                ),
            )
        ],
        "note": (
            "P-Score answers who to audit. F-Score answers what can be demanded. They "
            "are two distributions and are never added, averaged or ranked together."
        ),
    }


# ---------------------------------------------------------------------------
# D6 -- the enforcement funnel
# ---------------------------------------------------------------------------


@router.get("/dashboard/funnel")
def funnel(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
    jurisdiction: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """M-E01 to M-E10: flagged to collected, with the drop at each step."""
    run = _require_run(session, run_id)

    stmt = select(FactEnforcement).where(FactEnforcement.engine_run_id == run.id)
    if jurisdiction:
        stmt = stmt.where(FactEnforcement.jurisdiction == jurisdiction)
    rows = session.execute(stmt.order_by(FactEnforcement.month)).scalars().all()

    stages = {
        key: sum(getattr(row, key) for row in rows)
        for key in (
            "flagged",
            "selected",
            "notices_issued",
            "replies_received",
            "appeals",
            "sustained",
        )
    }
    money = {
        key: sum((getattr(row, key) for row in rows), Decimal("0.00"))
        for key in ("demand_raised", "demand_confirmed", "demand_collected")
    }

    ladder = [
        ("flagged", "Flagged by the engine", "M-K06"),
        ("selected", "Selected for scrutiny", "M-E01"),
        ("notices_issued", "Notices issued", "M-E02"),
        ("replies_received", "Replies received", "M-E03"),
        ("appeals", "Appealed", "M-E09"),
        ("sustained", "Sustained on appeal", "M-E09"),
    ]

    by_month: dict[str, dict[str, Any]] = {}
    for row in rows:
        totals = by_month.setdefault(
            row.month,
            {
                "flagged": 0,
                "selected": 0,
                "notices_issued": 0,
                "demand_raised": Decimal("0.00"),
                "demand_collected": Decimal("0.00"),
            },
        )
        totals["flagged"] += row.flagged
        totals["selected"] += row.selected
        totals["notices_issued"] += row.notices_issued
        totals["demand_raised"] += row.demand_raised
        totals["demand_collected"] += row.demand_collected

    previous: int | None = None
    steps = []
    for key, label, metric in ladder:
        count = stages[key]
        steps.append(
            {
                "stage": key,
                "label": label,
                "count": count,
                "share_of_previous": _ratio(_divide(count, previous)) if previous else None,
                "share_of_flagged": _ratio(_divide(count, stages["flagged"])),
                "drill": _drill(metric, f"funnel:{key}"),
            }
        )
        previous = count

    return {
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "steps": steps,
        # fact_enforcement is grained by jurisdiction AND month, so a month
        # appears once per division.  Summing to one row per month here keeps
        # the series honest: five bars all labelled "2025-03" is not a time
        # series, it is the same month drawn five times.
        "months": [
            {
                "month": month,
                "flagged": totals["flagged"],
                "selected": totals["selected"],
                "notices_issued": totals["notices_issued"],
                "demand_raised": _money(totals["demand_raised"]),
                "demand_collected": _money(totals["demand_collected"]),
                "drill": _drill("M-E04", f"funnel:month:{month}"),
            }
            for month, totals in sorted(by_month.items())
        ],
        "money": {
            "demand_raised": _money(money["demand_raised"]),
            "demand_confirmed": _money(money["demand_confirmed"]),
            "demand_collected": _money(money["demand_collected"]),
            "confirmation_rate": _ratio(_divide(money["demand_confirmed"], money["demand_raised"])),
            "collection_rate": _ratio(
                _divide(money["demand_collected"], money["demand_confirmed"])
            ),
        },
        "note": (
            "A stage showing zero means nothing has reached it yet in this run, not "
            "that the stage failed. Rates are null where the stage above them is empty."
        ),
    }


# ---------------------------------------------------------------------------
# D7 -- jurisdictions
# ---------------------------------------------------------------------------


@router.get("/dashboard/jurisdictions")
def jurisdictions(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """A ranked, drillable table of divisions.

    Ranked on revenue at risk rather than on score, because a division of two
    hundred small taxpayers and a division of twenty large ones do not compare
    on a mean score and an officer would be misled by the ordering.
    """
    run = _require_run(session, run_id)

    risk_rows = (
        session.execute(select(FactRiskSnapshot).where(FactRiskSnapshot.engine_run_id == run.id))
        .scalars()
        .all()
    )
    filing_rows = (
        session.execute(select(FactFilingPeriod).where(FactFilingPeriod.engine_run_id == run.id))
        .scalars()
        .all()
    )

    merged: dict[str, dict[str, Any]] = {}

    def _bucket_for(name: str) -> dict[str, Any]:
        return merged.setdefault(
            name,
            {
                "jurisdiction": name,
                "taxpayers": 0,
                "revenue_at_risk": Decimal("0.00"),
                "expected": 0,
                "filed": 0,
                "barred": 0,
            },
        )

    for risk_row in risk_rows:
        bucket = _bucket_for(risk_row.jurisdiction)
        # Taxpayers are counted from the P bands only: the same taxpayer has a
        # row in both distributions, and counting both would double every
        # division's population.
        if risk_row.band_kind == "P":
            bucket["taxpayers"] += risk_row.taxpayer_count
        elif risk_row.band_kind == "F":
            bucket["revenue_at_risk"] += risk_row.revenue_at_risk

    for filing_row in filing_rows:
        bucket = _bucket_for(filing_row.jurisdiction)
        bucket["expected"] += filing_row.expected
        bucket["filed"] += filing_row.filed
        bucket["barred"] += filing_row.barred

    # The same failures-only denominator as D2: fact_filing_period carries
    # unfiled periods, so a compliance rate needs the filing register.  One
    # division showing a computed 0% beside six showing "not evaluated" would
    # read as that division being the bad one.
    register = _dataset_present(session, FilingStatus)

    items = [
        {
            "jurisdiction": name,
            "taxpayers": bucket["taxpayers"],
            "revenue_at_risk": _money(bucket["revenue_at_risk"]),
            "compliance_rate": _ratio(_divide(bucket["filed"], bucket["expected"]))
            if register
            else None,
            "barred_periods": bucket["barred"],
            "drill": _drill("M-K05", f"jurisdiction:{name}"),
            "href": f"/dashboard?jurisdiction={name}",
        }
        for name, bucket in merged.items()
    ]
    items.sort(key=lambda item: Decimal(str(item["revenue_at_risk"])), reverse=True)

    return {
        "engine_run_id": run.id,
        "items": items,
        "note": (
            "Ranked on revenue at risk, not on mean score. A mean score across "
            "differently sized populations is not a comparison."
        ),
    }


# ---------------------------------------------------------------------------
# D8 -- officers
# ---------------------------------------------------------------------------


@router.get("/dashboard/officers")
def officers(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
    jurisdiction: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Capacity and case mix.  **Not** a league table.

    Ten ITC-fraud cases do not compare with fifty late-fee cases, so the case
    mix travels with every throughput number and there is no single ranking
    column.  A screen that ranked officers on closures would be used to make
    bad decisions about people, and it would be used that way within a week.
    """
    run = _require_run(session, run_id)

    stmt = select(FactOfficer).where(FactOfficer.engine_run_id == run.id)
    if jurisdiction:
        stmt = stmt.where(FactOfficer.jurisdiction == jurisdiction)
    rows = session.execute(stmt.order_by(FactOfficer.officer_id, FactOfficer.month)).scalars().all()

    merged: dict[str, dict[str, Any]] = {}
    for row in rows:
        bucket = merged.setdefault(
            row.officer_id,
            {
                "officer_id": row.officer_id,
                "jurisdiction": row.jurisdiction,
                "cases_open": 0,
                "cases_closed": 0,
                "notices_pending_approval": 0,
                "demand_raised": Decimal("0.00"),
                "demand_collected": Decimal("0.00"),
                "case_mix": {},
                "months": [],
                "_age_sum": Decimal("0"),
                "_age_n": 0,
            },
        )
        bucket["cases_open"] += row.cases_open
        bucket["cases_closed"] += row.cases_closed
        bucket["notices_pending_approval"] += row.notices_pending_approval
        bucket["demand_raised"] += row.demand_raised
        bucket["demand_collected"] += row.demand_collected
        bucket["months"].append(row.month)
        if row.mean_age_days is not None:
            bucket["_age_sum"] += row.mean_age_days
            bucket["_age_n"] += 1
        for family, count in (row.case_mix or {}).items():
            bucket["case_mix"][family] = bucket["case_mix"].get(family, 0) + int(count)

    items = []
    for officer_id, bucket in sorted(merged.items()):
        items.append(
            {
                "officer_id": officer_id,
                "jurisdiction": bucket["jurisdiction"],
                "cases_open": bucket["cases_open"],
                "cases_closed": bucket["cases_closed"],
                "notices_pending_approval": bucket["notices_pending_approval"],
                "mean_age_days": _ratio(_divide(bucket["_age_sum"], bucket["_age_n"]))
                if bucket["_age_n"]
                else None,
                "demand_raised": _money(bucket["demand_raised"]),
                "demand_collected": _money(bucket["demand_collected"]),
                "case_mix": bucket["case_mix"],
                "months": sorted(set(bucket["months"])),
                "drill": _drill("M-E10", f"officer:{officer_id}"),
            }
        )

    return {
        "engine_run_id": run.id,
        "jurisdiction": jurisdiction,
        "items": items,
        "note": (
            "Capacity and case mix, not a ranking. Throughput is meaningless without "
            "the mix beside it, so the two are never separated here."
        ),
    }


# ---------------------------------------------------------------------------
# D9 -- sectors
# ---------------------------------------------------------------------------


@router.get("/dashboard/sectors")
def sectors(
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """Risk by sector, from the peer cohorts the engine already banded on.

    A cohort below the minimum size is reported as such rather than banded: a
    percentile over four taxpayers is not a percentile.
    """
    run = _require_run(session, run_id)

    rows = session.execute(
        select(
            Taxpayer.sector_code.label("sector"),
            func.count(RiskScore.gstin).label("taxpayers"),
            func.sum(RiskScore.p_score).label("p_sum"),
            func.sum(RiskScore.f_score).label("f_sum"),
        )
        .join(RiskScore, RiskScore.gstin == Taxpayer.gstin)
        .where(RiskScore.engine_run_id == run.id)
        .group_by(Taxpayer.sector_code)
    ).all()

    at_risk: dict[str | None, Decimal] = {
        row.sector: Decimal(str(row.total or "0.00"))
        for row in session.execute(
            select(
                Taxpayer.sector_code.label("sector"),
                _head_wise_total().label("total"),
            )
            .join(Finding, Finding.gstin == Taxpayer.gstin)
            .where(Finding.engine_run_id == run.id, Finding.status == "TRIGGERED")
            .group_by(Taxpayer.sector_code)
        ).all()
    }

    items = []
    for row in rows:
        sector = row.sector or "unclassified"
        count = int(row.taxpayers or 0)
        items.append(
            {
                "sector": sector,
                "taxpayers": count,
                "p_score_mean": _ratio(_divide(row.p_sum or Decimal(0), count)),
                "f_score_mean": _ratio(_divide(row.f_sum or Decimal(0), count)),
                "revenue_at_risk": _money(at_risk.get(row.sector)),
                "cohort_usable": count >= MIN_COHORT,
                "drill": _drill("M-R08", f"sector:{sector}"),
            }
        )
    items.sort(key=lambda item: Decimal(str(item["revenue_at_risk"])), reverse=True)

    return {
        "engine_run_id": run.id,
        "items": items,
        "min_cohort": MIN_COHORT,
        "note": (
            f"A sector with fewer than {MIN_COHORT} taxpayers is shown but marked "
            "unusable as a cohort: a percentile over a handful of taxpayers is not a "
            "percentile, and banding one against it would be a fabricated comparison."
        ),
    }
