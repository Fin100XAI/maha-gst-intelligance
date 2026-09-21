"""Running the engine over what was ingested.

This is the endpoint that makes an upload mean something.  Before it existed a
return could be ingested perfectly -- rows canonicalised, provenance resolving
to the cell -- and no rule would ever see it, because the only code that built
a ``RuleContext`` was the demo seeder and it built one from synthetic records
held in memory.

Three properties this endpoint keeps.

**It runs over a snapshot, not over "the data".**  A snapshot is immutable and
content-hashed, so a run is reproducible: the same snapshot and the same
``as_of`` produce the same ``calc_id`` for every figure, forever.

**``as_of`` is injected.**  Rules never read the clock.  A run made today over
last year's data must evaluate limitation and the three-year bar as at the date
the caller states, not as at now, or replaying a run would silently change its
conclusions.

**Peer cohorts are built across the whole snapshot.**  A percentile computed
over a subset is not a percentile; it is a comparison against whoever happened
to be loaded.
"""

from __future__ import annotations

from dataclasses import replace
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.admin.parameters import load_parameter_set
from app.aggregation.rollup import run_and_store
from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.audit.chain import append as audit_append
from app.canonical import FinancialYear
from app.db.models import EngineRun, Snapshot, Taxpayer
from app.engine.context import RuleContext
from app.engine.graph import InvoiceGraph
from app.engine.load import gstins_in_snapshot, load_context
from app.engine.peers import CohortKey, PeerBands
from app.engine.runner import TaxpayerOutcome, run_for_taxpayer

router = APIRouter(tags=["engine"])

SessionDep = Annotated[Session, Depends(get_session)]

#: The parameters banded against a peer cohort rather than an absolute
#: threshold.  Same set the demonstration run uses.
_COHORT_PARAMS: tuple[str, ...] = (
    "P03",
    "P04",
    "P05",
    "P07",
    "P08",
    "P10",
    "P17",
    "P18",
    "P31",
    "P32",
)


class RunRequest(BaseModel):
    """What to run, over what, as at when."""

    snapshot_id: str
    fy: str
    #: The evaluation date. Injected, never the wall clock: limitation and the
    #: three-year bar are computed against it.
    as_of: date | None = None
    #: Restrict the run to named taxpayers. Empty means every taxpayer with a
    #: row in the snapshot.
    gstins: list[str] = Field(default_factory=list)
    with_identities: bool = True


def _peer_bands(contexts: list[RuleContext]) -> PeerBands:
    """Cohort bands over the whole snapshot.

    A cohort below the minimum size is not banded at all: the parameters that
    would have used it report NOT_EVALUATED rather than being scored against
    two or three neighbours, which is not a percentile.
    """
    bands = PeerBands()
    observations: dict[str, list[tuple[CohortKey, Decimal]]] = {}
    for context in contexts:
        profile = context.data.profile
        turnover = profile.aato or sum(
            (row.taxable_value for row in context.data.outward), Decimal("0.00")
        )
        cohort = bands.cohort_for(
            sector=profile.sector_code,
            turnover=turnover,
            jurisdiction=profile.division,
        )
        for param_id in _COHORT_PARAMS:
            observations.setdefault(param_id, []).append((cohort, turnover / Decimal("100000000")))
    return PeerBands.build(observations)


@router.post("/engine/run", status_code=201)
def run_engine(
    body: Annotated[RunRequest, Body()],
    session: SessionDep,
    principal: PrincipalDep,
) -> dict[str, Any]:
    """Run the rules, parameters, identities and scores over a snapshot."""
    if principal.read_only:
        raise HTTPException(
            status_code=403,
            detail={"code": "READ_ONLY", "message": f"{principal.role} may not run the engine"},
        )

    snapshot = session.get(Snapshot, body.snapshot_id)
    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_SNAPSHOT", "message": f"no snapshot {body.snapshot_id!r}"},
        )

    try:
        financial_year = FinancialYear.parse(body.fy)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "BAD_FY", "message": f"{body.fy!r} is not a financial year"},
        ) from exc

    subjects = body.gstins or gstins_in_snapshot(session, snapshot.id)
    if not subjects:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "EMPTY_SNAPSHOT",
                "message": (
                    "this snapshot holds no canonical row for any taxpayer, so there is "
                    "nothing to run. Ingest a return first."
                ),
            },
        )

    as_of = body.as_of or datetime.now(tz=UTC).date()
    # The thresholds the department administers, not the values shipped in
    # code: an edit in the register changes what the next run concludes.
    params = load_parameter_set(session)

    # Every context first, so the peer cohort spans the whole snapshot rather
    # than being rebuilt per taxpayer against a moving population.
    contexts = [
        load_context(
            session,
            gstin,
            snapshot_id=snapshot.id,
            fy=financial_year,
            as_of=as_of,
            params=params,
        )
        for gstin in subjects
    ]

    peers = _peer_bands(contexts)

    # One graph across the whole snapshot: a circular-trading cycle is only
    # visible when every party's invoices are in the same graph.
    graph = InvoiceGraph()
    for context in contexts:
        for row in context.data.outward:
            if row.counterparty_gstin:
                graph.add(context.data.profile.gstin, row.counterparty_gstin, row.taxable_value)

    outcomes: list[TaxpayerOutcome] = [
        run_for_taxpayer(
            replace(context, peers=peers, graph=graph),
            with_identities=body.with_identities,
        )
        for context in contexts
    ]

    taxpayers = {
        row.gstin: row
        for row in session.execute(select(Taxpayer).where(Taxpayer.gstin.in_(subjects))).scalars()
    }
    run, counts = run_and_store(
        session,
        outcomes,
        snapshot_id=snapshot.id,
        as_of=as_of,
        triggered_by=principal.officer_id,
        jurisdiction_of={gstin: (row.division or "UNASSIGNED") for gstin, row in taxpayers.items()},
        officer_of={gstin: row.officer_id for gstin, row in taxpayers.items() if row.officer_id},
    )

    audit_append(
        session,
        actor=principal.officer_id,
        action="ENGINE_RUN",
        entity="engine_run",
        entity_id=run.id,
        after={"snapshot_id": snapshot.id, "as_of": as_of, "taxpayers": len(subjects)},
        detail={
            "snapshot_id": snapshot.id,
            "as_of": as_of.isoformat(),
            "taxpayers": len(subjects),
            "fy": body.fy,
        },
    )
    session.flush()

    triggered = sum(1 for outcome in outcomes for f in outcome.findings if f.triggered)
    not_evaluated = sum(
        1 for outcome in outcomes for f in outcome.findings if f.status.value == "NOT_EVALUATED"
    )

    return {
        "engine_run_id": run.id,
        "snapshot_id": snapshot.id,
        "as_of": as_of.isoformat(),
        "fy": body.fy,
        "params_version": params.version,
        "taxpayers": len(subjects),
        "findings": sum(len(outcome.findings) for outcome in outcomes),
        "triggered": triggered,
        "not_evaluated": not_evaluated,
        "facts": counts,
        "note": (
            f"{not_evaluated} rule outcomes could not be evaluated for want of a "
            "dataset. Each names what it needed; none was scored as a pass."
        ),
    }


@router.get("/engine/runs")
def list_runs(session: SessionDep) -> dict[str, Any]:
    """Every engine run, newest first."""
    rows = session.execute(select(EngineRun).order_by(EngineRun.started_at.desc())).scalars().all()
    return {
        "count": len(rows),
        "items": [
            {
                "engine_run_id": row.id,
                "snapshot_id": row.snapshot_id,
                "as_of": row.as_of.isoformat(),
                "fy": row.fy,
                "status": row.status,
                "triggered_by": row.triggered_by,
                "started_at": row.started_at.isoformat(),
                "gstin_count": row.gstin_count,
                "finding_count": row.finding_count,
                "engine_version": row.engine_version,
                "params_version": row.params_version,
            }
            for row in rows
        ],
    }
