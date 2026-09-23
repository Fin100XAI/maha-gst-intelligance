"""The departmental matrix, per taxpayer and across the portfolio.

Two endpoints. `/matrix` is the portfolio: one row per taxpayer, how many of
the 141 checks failed and what that is worth. `/matrix/{gstin}` is the whole
matrix for one of them.

Both run the engine rather than reading a stored run, which is honest while
there is no run store keyed by taxpayer: `calc_id`s are deterministic, so two
calls produce the same cells.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.canonical import FinancialYear
from app.db.models import Taxpayer
from app.engine.context import RuleContext
from app.engine.load import load_taxpayer_data
from app.engine.params import ParameterSet
from app.engine.runner import run_for_taxpayer
from app.matrix import MATRIX, run_matrix
from app.matrix.mapping import coverage_note

router = APIRouter(tags=["matrix"])

SessionDep = Annotated[Session, Depends(get_session)]

_GSTIN_LENGTH = 15


def _result(session: Session, gstin: str, snapshot_id: str, year: FinancialYear) -> Any:
    data = load_taxpayer_data(session, gstin, snapshot_id)
    context = RuleContext(
        data=data,
        fy=year,
        snapshot_id=snapshot_id,
        params=ParameterSet(),
        as_of=year.end,
    )
    outcome = run_for_taxpayer(context)
    return run_matrix(
        gstin,
        year.label,
        list(outcome.findings),
        legal_name=data.profile.legal_name,
        # Never inferred. `docs/01` section 12 is explicit that industry is
        # confirmed by an officer, so until one has, no row is excluded.
        industry=None,
    )


@router.get("/matrix")
def portfolio(
    session: SessionDep,
    snapshot_id: Annotated[str, Query()],
    fy: Annotated[int, Query(ge=2017, le=2099)] = 2025,
) -> dict[str, Any]:
    """Every taxpayer in the snapshot, against the whole matrix."""
    year = FinancialYear(fy)
    rows: list[dict[str, Any]] = []
    for taxpayer in session.execute(select(Taxpayer)).scalars().all():
        data = load_taxpayer_data(session, taxpayer.gstin, snapshot_id)
        if not data.outward and not data.inward and not data.returns_3b:
            continue
        result = _result(session, taxpayer.gstin, snapshot_id, year)
        rows.append(
            {
                "gstin": result.gstin,
                "legal_name": result.legal_name,
                "counts": result.counts,
                "exposure": result.exposure.dict(),
                "exposure_total": format(result.exposure.total, "f"),
                "failed": [
                    {
                        "id": row.check.id,
                        "check": row.check.check,
                        "module": row.check.module,
                        "exposure_total": format(row.exposure.total, "f"),
                    }
                    for row in result.rows
                    if row.status == "FAIL"
                ],
            }
        )

    # Sorted on `Decimal`, not `float`. G1 caught this, and it was right to:
    # a float comparison of two rupee figures can order them wrongly when
    # they differ in the last paisa, and this list decides which file an
    # officer opens first.
    rows.sort(key=lambda r: -Decimal(str(r["exposure_total"]) or "0"))
    return {
        "fy": year.label,
        "matrix_size": len(MATRIX),
        "coverage_note": coverage_note(len(MATRIX)),
        "taxpayers": rows,
    }


@router.get("/matrix/{gstin}")
def one(
    gstin: str,
    session: SessionDep,
    snapshot_id: Annotated[str, Query()],
    fy: Annotated[int, Query(ge=2017, le=2099)] = 2025,
) -> dict[str, Any]:
    """All 141 departmental checks for one taxpayer."""
    if len(gstin) != _GSTIN_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="a GSTIN is fifteen characters",
        )
    year = FinancialYear(fy)
    result = _result(session, gstin, snapshot_id, year)
    payload: dict[str, Any] = result.as_dict()
    payload["coverage_note"] = coverage_note(len(MATRIX))
    return payload
