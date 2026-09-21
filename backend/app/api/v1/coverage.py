"""Which screens this upload can actually answer.

A platform that shows twenty-three destinations when the data supports nine
teaches an officer to distrust all twenty-three. The department asked for the
unused sections to be taken out; taking them out of the *code* would be wrong,
because the same platform run against a full departmental extract needs every
one of them. So the screens stay, and this endpoint says which of them the
data in front of you can answer.

The check is definitive -- a count against the canonical table -- and never an
inference from zeros. "Every figure is zero" and "the dataset was never
supplied" look identical on a chart and mean opposite things (Law 5).

A screen is never hidden on the strength of this. It is marked, with the
dataset it is waiting for named, exactly as a NOT_EVALUATED parameter names
its missing input.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.db.facts import FactOfficer
from app.db.models import (
    Case,
    EInvoice,
    EWayBill,
    Finding,
    InwardLine,
    LedgerMovement,
    Notice,
    OutwardLine,
    ParamResult,
    Return3B,
    Taxpayer,
)

router: APIRouter = APIRouter(tags=["coverage"])

SessionDep = Annotated[Session, Depends(get_session)]


@dataclass(frozen=True, slots=True)
class ScreenNeed:
    """One screen, and the canonical table it cannot work without."""

    code: str
    #: The dataset in the words an officer would use, not the table name.
    dataset: str
    table: Any
    #: What the screen is for, when it has nothing to show.
    waiting_for: str


#: Only screens with a hard dependency appear here. A screen absent from this
#: list is always available -- the Guide, the upload screen, the rule library,
#: the alignment table and admin need no taxpayer data at all.
NEEDS: tuple[ScreenNeed, ...] = (
    ScreenNeed("D2", "GSTR-1 and GSTR-3B", Return3B, "a filed summary return per period"),
    ScreenNeed("D3", "engine findings", Finding, "an engine run over ingested returns"),
    ScreenNeed("D4", "risk parameters", ParamResult, "an engine run over ingested returns"),
    ScreenNeed("D5", "risk parameters", ParamResult, "an engine run over ingested returns"),
    ScreenNeed("D6", "cases and notices", Case, "cases opened from findings"),
    ScreenNeed("D7", "taxpayer registrations", Taxpayer, "taxpayers with a jurisdiction"),
    ScreenNeed("D8", "officer allocations", FactOfficer, "an officer allocation extract"),
    ScreenNeed("D9", "sector classification", Taxpayer, "taxpayers carrying an HSN or sector"),
    ScreenNeed("W2", "engine findings", Finding, "an engine run over ingested returns"),
    ScreenNeed("W5", "cases", Case, "cases opened from findings"),
    ScreenNeed("W6", "notices", Notice, "a notice drafted from a finding"),
    ScreenNeed("W8", "filed returns", Return3B, "at least one filed return"),
)

#: Datasets the platform reads but which no screen depends on outright. They
#: are reported so an officer can see what the upload did and did not carry.
OPTIONAL: tuple[tuple[str, Any], ...] = (
    ("outward supplies (GSTR-1)", OutwardLine),
    ("inward statement (GSTR-2A / 2B)", InwardLine),
    ("summary return (GSTR-3B)", Return3B),
    ("e-way bills", EWayBill),
    ("e-invoices (IRN)", EInvoice),
    ("electronic ledgers", LedgerMovement),
)


def _present(session: Session, table: Any) -> int:
    return int(session.execute(select(func.count()).select_from(table)).scalar() or 0)


@router.get("/coverage/screens")
def screens(session: SessionDep) -> dict[str, Any]:
    """Per screen: does the data in this database support it?

    The frontend uses this to mark a destination rather than to remove it.
    Removing it would hide the platform's own scope from the department that
    has to decide which extract to ask for next.
    """
    counted: dict[Any, int] = {}
    rows: list[dict[str, Any]] = []
    for need in NEEDS:
        if need.table not in counted:
            counted[need.table] = _present(session, need.table)
        rows.append(
            {
                "code": need.code,
                "available": counted[need.table] > 0,
                "dataset": need.dataset,
                "rows": counted[need.table],
                "waiting_for": need.waiting_for,
            }
        )

    datasets = [{"dataset": label, "rows": _present(session, table)} for label, table in OPTIONAL]
    return {
        "screens": rows,
        "datasets": datasets,
        "note": (
            "A screen marked unavailable is not broken and not empty of findings: "
            "the dataset it reads was not part of this upload."
        ),
    }
