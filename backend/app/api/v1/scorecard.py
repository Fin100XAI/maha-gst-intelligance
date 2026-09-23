"""The scorecard: a taxpayer's whole year, one cell per check per period.

`docs/08` calls the grid the single most useful object on the platform, and
it has existed in the engine since the scorecard was built - `run_for_taxpayer`
returns twelve `FilingScorecard`s on every run and nothing has ever read them.
This is the endpoint that lets a screen.

**It runs the engine.** The alternative is to store the cards and serve them,
which is right once there is a run store keyed by taxpayer; until then a
recomputation is honest and the `calc_id`s are deterministic, so two calls
produce the same cells.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.canonical import FinancialYear
from app.engine.context import RuleContext
from app.engine.load import load_taxpayer_data
from app.engine.params import ParameterSet
from app.engine.runner import run_for_taxpayer

router = APIRouter(tags=["scorecard"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/scorecard/{gstin}")
def scorecard(
    gstin: str,
    session: SessionDep,
    snapshot_id: Annotated[str, Query()],
    fy: Annotated[int, Query(ge=2017, le=2099)] = 2025,
) -> dict[str, Any]:
    """Twelve cards, the findings behind them, and what could not be checked."""
    if len(gstin) != 15:  # noqa: PLR2004 - a GSTIN is fifteen characters
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="a GSTIN is fifteen characters",
        )

    year = FinancialYear(fy)
    data = load_taxpayer_data(session, gstin, snapshot_id)
    context = RuleContext(
        data=data,
        fy=year,
        snapshot_id=snapshot_id,
        params=ParameterSet(),
        # Injected, never the wall clock: the same snapshot must produce the
        # same cells whenever it is asked for.
        as_of=year.end,
    )
    outcome = run_for_taxpayer(context)

    return {
        "gstin": gstin,
        "fy": year.label,
        "legal_name": data.profile.legal_name,
        "p_score": outcome.p_score.as_dict(),
        "f_score": outcome.f_score.as_dict(),
        "months": [card.as_dict() for card in outcome.scorecards],
        "findings": [
            finding.as_dict()
            for finding in outcome.findings
            if finding.triggered or finding.missing_inputs
        ],
        "document_calls": [call.as_dict() for call in outcome.document_calls],
        "rule_errors": list(outcome.rule_errors),
    }
