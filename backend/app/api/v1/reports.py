"""Reports over one taxpayer's snapshot.

Three endpoints and one rule between them: a report that cannot be built
answers with what it wanted, never with an empty table. An empty table on a
screen reads as "nothing to see", which is the one thing absence must never
mean.

A report asked for and not yet buildable returns **501** with the dataset it
needs in the body, per `CLAUDE.md`: a coming-soon feature is a real routed
screen with a stated data dependency, never a fabricated number.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.canonical import FinancialYear
from app.engine.load import load_taxpayer_data
from app.reports.registry import PLANNED, REPORTS, build

router = APIRouter(tags=["reports"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/reports")
def list_reports() -> dict[str, Any]:
    """Every report, buildable or not, with the absent ones saying why.

    One list rather than two, because a screen that only shows what works
    cannot tell an officer what to ask the taxpayer for.
    """
    return {
        "reports": [spec.as_dict() for spec in REPORTS.values()]
        + [spec.as_dict() for spec in PLANNED.values()],
    }


@router.get("/reports/{report_id}")
def run_report(
    report_id: str,
    session: SessionDep,
    gstin: Annotated[str, Query(min_length=15, max_length=15)],
    snapshot_id: Annotated[str, Query()],
    fy: Annotated[int, Query(ge=2017, le=2099)] = 2025,
) -> dict[str, Any]:
    """Build one report for one taxpayer over one snapshot."""
    if report_id in PLANNED:
        planned = PLANNED[report_id]
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail={
                "report": planned.id,
                "title": planned.title,
                "needs": planned.needs,
                "roadmap_ref": planned.roadmap_ref,
                "message": (
                    f"'{planned.title}' is not built yet because the platform does "
                    f"not have {planned.needs}. No figure is shown rather than a "
                    f"figure that would be invented."
                ),
            },
        )
    if report_id not in REPORTS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"no report {report_id!r}"
        )

    year = FinancialYear(fy)
    # `load_taxpayer_data` returns an empty `TaxpayerData` rather than None
    # for a taxpayer with nothing in this snapshot, and each report turns that
    # into its own named abstention. A 404 here would lose which dataset was
    # wanted, which is the whole answer.
    data = load_taxpayer_data(session, gstin, snapshot_id)
    report = build(report_id, data, year.label, year.periods)
    return report.as_dict()
