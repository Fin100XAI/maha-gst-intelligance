"""S6 - Alignment with the department's 34 risk flags.

The department's circular defines 34 risk flags. This platform implements 34
audit risk parameters. That those two numbers match proves nothing on its own,
so this endpoint puts them side by side, flag by flag, and lets a reader check:

* the circular's own words, verbatim (``app/reference/risk_flags.py``);
* what the platform actually computes for that flag, and from which return;
* whether it can be computed today or is waiting on a feed the State does not
  yet receive - and, if so, which feed;
* and, when an engine run is named, how many taxpayers it was actually
  evaluated for and how many it flagged.

The last of those is the reconciliation. A parameter that is implemented,
documented and never evaluated is not doing any work, and the only way to know
is to count.

Nothing here computes a risk figure. It reads the registry, the circular and -
when asked - the counts from a completed run.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.canonical import BandingStrategy, FindingStatus
from app.db.models import EngineRun, ParamResult
from app.engine.params_p01_p34 import PARAMETERS, ParamSpec
from app.reference.risk_flags import SOURCE_FLAGS, SOURCE_LADDER_NOTE, SOURCE_TITLE

router = APIRouter(tags=["alignment"])

SessionDep = Annotated[Session, Depends(get_session)]

_SOURCE_LABELS = {"3B": "GSTR-3B", "1": "GSTR-1", "2B": "GSTR-2B", "CUS": "Customs (ICEGATE)"}


def _how_flagged(spec: ParamSpec) -> str:
    """How Flag 0 to 4 is arrived at, in a sentence a reader can check."""
    strategy = spec.banding
    if strategy is BandingStrategy.EXTERNAL:
        return "Not computed here: the data comes from outside the State's own returns."
    if strategy is BandingStrategy.BINARY:
        return f"Either it is true or it is not. When true, Flag {spec.binary_flag}."
    if strategy is BandingStrategy.COUNT:
        cuts = ", ".join(str(c) for c in spec.count_bands)
        return f"Counted. The flag rises at {cuts}."
    if strategy is BandingStrategy.RATIO_ABS:
        cuts = ", ".join(format(c, "f") for c in spec.absolute_bands)
        direction = "falls below" if spec.direction == "LOW_IS_RISK" else "rises above"
        return f"A fixed scale. The flag rises as the figure {direction} {cuts}."
    if strategy is BandingStrategy.DELTA_YOY:
        return "Measured as the change against the previous year, not as a level."
    # RATIO_PEER
    worse = "above" if spec.direction == "HIGH_IS_RISK" else "below"
    return (
        "Judged against similar businesses rather than a fixed number: the flag rises as the "
        f"figure moves {worse} the 50th, 75th, 90th and 97th percentile of its peer group."
    )


def _sources(spec: ParamSpec) -> list[str]:
    return [_SOURCE_LABELS.get(code, code) for code in spec.data_sources]


@router.get("/alignment/risk-flags")
def risk_flag_alignment(
    principal: PrincipalDep,
    session: SessionDep,
    run_id: Annotated[str | None, Query()] = None,
) -> dict[str, Any]:
    """The circular's 34 flags beside what the platform does about each one."""
    del principal  # Reference text and registry metadata: no taxpayer data here.

    run: EngineRun | None = None
    counts: dict[str, dict[str, int]] = {}
    missing: dict[str, list[str]] = {}
    if run_id is not None:
        run = session.get(EngineRun, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail={"code": "RUN_NOT_FOUND", "id": run_id})
        counts = _incidence(session, run_id)
        missing = _missing_inputs(session, run_id)

    items: list[dict[str, Any]] = []
    for flag in SOURCE_FLAGS:
        spec = PARAMETERS[flag.param_id]
        seen = counts.get(flag.param_id, {})
        evaluated = seen.get("evaluated", 0)
        items.append(
            {
                "label": flag.label,
                "param_id": flag.param_id,
                "source_text": flag.source_text,
                "plain": flag.plain,
                "implemented": True,
                "platform": {
                    "title": spec.title,
                    "computes": spec.metric_description,
                    "data_sources": _sources(spec),
                    "how_flagged": _how_flagged(spec),
                    "action_point": spec.action_point,
                    "related_rules": list(spec.related_rules),
                    "compares_year_on_year": spec.yoy_metric is not None,
                },
                "availability": {
                    "state": "AWAITING_FEED" if spec.is_external else "COMPUTED",
                    "feed": spec.external_feed,
                    "roadmap_ref": spec.roadmap_ref,
                },
                "run": None
                if run is None
                else {
                    "evaluated": evaluated,
                    "not_evaluated": seen.get("not_evaluated", 0),
                    "flagged": seen.get("flagged", 0),
                    "missing_inputs": missing.get(flag.param_id, []),
                },
            }
        )

    computed = [item for item in items if item["availability"]["state"] == "COMPUTED"]
    awaiting = [item for item in items if item["availability"]["state"] == "AWAITING_FEED"]

    feeds: dict[str, dict[str, Any]] = {}
    for item in awaiting:
        feed = str(item["availability"]["feed"])
        entry = feeds.setdefault(
            feed, {"feed": feed, "flags": [], "roadmap_ref": item["availability"]["roadmap_ref"]}
        )
        flags_list: list[str] = entry["flags"]
        flags_list.append(str(item["param_id"]))

    return {
        "source": {
            "title": SOURCE_TITLE,
            "ladder_note": SOURCE_LADDER_NOTE,
            "flag_count": len(SOURCE_FLAGS),
        },
        "summary": {
            "in_circular": len(SOURCE_FLAGS),
            "implemented": sum(1 for item in items if item["implemented"]),
            "missing": [flag.param_id for flag in SOURCE_FLAGS if flag.param_id not in PARAMETERS],
            "computed_from_returns": len(computed),
            "awaiting_feed": len(awaiting),
            "run_id": None if run is None else run.id,
            "run_fy": None if run is None else run.fy,
            "run_taxpayers": None if run is None else run.gstin_count,
            "evaluated_in_run": None
            if run is None
            else sum(1 for item in items if (item["run"] or {}).get("evaluated", 0) > 0),
        },
        "feeds": sorted(feeds.values(), key=lambda entry: str(entry["feed"])),
        "note": (
            "The left column is the department's circular, stored word for word. The right "
            "column is what this platform does about it. Where a flag needs data the State "
            "does not yet receive, it is reported as not evaluated and is left out of both "
            "sides of the P-Score - it is never quietly scored as clear."
        ),
        "items": items,
    }


def _incidence(session: Session, run_id: str) -> dict[str, dict[str, int]]:
    """Per parameter: how many taxpayers it was evaluated for, and flagged."""
    rows = session.execute(
        select(
            ParamResult.param_id,
            ParamResult.status,
            func.count().label("n"),
            func.sum(func.coalesce(ParamResult.flag, 0)).label("flag_sum"),
        )
        .where(ParamResult.engine_run_id == run_id)
        .group_by(ParamResult.param_id, ParamResult.status)
    ).all()

    out: dict[str, dict[str, int]] = {}
    for param_id, status, n, _flag_sum in rows:
        entry = out.setdefault(param_id, {"evaluated": 0, "not_evaluated": 0, "flagged": 0})
        if status == FindingStatus.NOT_EVALUATED.value:
            entry["not_evaluated"] += int(n)
        else:
            entry["evaluated"] += int(n)

    flagged = session.execute(
        select(ParamResult.param_id, func.count())
        .where(ParamResult.engine_run_id == run_id, ParamResult.flag.is_not(None))
        .where(ParamResult.flag > 0)
        .group_by(ParamResult.param_id)
    ).all()
    for param_id, n in flagged:
        out.setdefault(param_id, {"evaluated": 0, "not_evaluated": 0, "flagged": 0})
        out[param_id]["flagged"] = int(n)
    return out


def _missing_inputs(session: Session, run_id: str) -> dict[str, list[str]]:
    """Per parameter, the datasets that stopped it being evaluated.

    This is the actionable half of the reconciliation. "P01 was not evaluated"
    is a fact; "P01 was not evaluated because no GSTR-3B has been loaded" is a
    fact somebody can do something about this afternoon.
    """
    rows = session.execute(
        select(ParamResult.param_id, ParamResult.missing_inputs).where(
            ParamResult.engine_run_id == run_id,
            ParamResult.status == FindingStatus.NOT_EVALUATED.value,
        )
    ).all()
    out: dict[str, set[str]] = {}
    for param_id, inputs in rows:
        out.setdefault(param_id, set()).update(str(name) for name in inputs or ())
    return {param_id: _collapse(names) for param_id, names in out.items()}


def _collapse(names: set[str]) -> list[str]:
    """Group the peer-cohort reasons, which are one per cohort and read as noise.

    "Not evaluated because ten separate peer groups were each too small" is one
    fact about the size of the dataset, not ten facts. The cohort names are
    still in the trace for anyone who needs them; a reader deciding what to
    upload next needs the count.
    """
    cohorts = sorted(name for name in names if name.startswith("peer cohort"))
    rest = sorted(name for name in names if not name.startswith("peer cohort"))
    if not cohorts:
        return rest
    plural = "" if len(cohorts) == 1 else "s"
    return [
        *rest,
        f"too few similar businesses to compare against ({len(cohorts)} peer group{plural})",
    ]
