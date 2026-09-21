"""The six agents, and the read-only tools they may use.

docs/02 section 9.  Column Mapper · Narrator · Notice Drafter · Legal Research
· Reply Triage · Copilot.

**Not one tool in this module performs arithmetic.**  Every one is a SELECT
over figures the deterministic engine already computed and stamped with a
``calc_id``.  There is no add, no subtract, no percentage and no total, so
there is nothing for an agent to misuse -- which is a stronger guarantee than
instructing it not to.

Figures are handed to the model already rendered, each preceded by its
``[[calc:...]]`` chip, so a quoted figure arrives back carrying the identifier
that resolves it to a spreadsheet cell.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Final

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.base import AgentSpec, Tool
from app.db.models import Finding, ParamResult, RiskScore

# The rule registry is populated by importing the rule modules.  Doing it here
# means the library tool can never be silently empty, which would look to an
# officer exactly like a platform that has no rules.
from app.engine import (  # noqa: F401  - registration side effect
    rules_beh,
    rules_ewb,
    rules_itc,
    rules_net,
    rules_out,
    rules_pay,
)
from app.engine.params_p01_p34 import PARAMETERS
from app.engine.registry import RULES

__all__ = ["AGENTS", "agent_for"]


def _chip(calc_id: str | None, value: Decimal | None) -> str:
    """A figure as the model must see it: its chip, then the figure.

    Money is rendered here and never re-rendered by the model.  The chip is
    what lets the numeric-fidelity middleware pass the figure and what lets the
    officer click through to the spreadsheet row.
    """
    if value is None:
        return "not available"
    rendered = format(value, "f")
    return f"[[calc:{calc_id}]] {rendered}" if calc_id else rendered


# ---------------------------------------------------------------------------
# tools -- read-only, every one
# ---------------------------------------------------------------------------


def _findings(session: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    """The findings for one taxpayer, as the engine recorded them."""
    gstin = str(args.get("gstin", ""))
    run_id = args.get("engine_run_id")
    stmt = select(Finding).where(Finding.gstin == gstin)
    if run_id:
        stmt = stmt.where(Finding.engine_run_id == str(run_id))
    stmt = stmt.order_by(Finding.rule_id, Finding.period)

    rows: list[dict[str, Any]] = []
    for finding in session.execute(stmt).scalars():
        spec = RULES.get(finding.rule_id)
        row: dict[str, Any] = {
            "rule": finding.rule_id,
            "title": spec.title if spec else finding.rule_id,
            "status": finding.status,
            "severity": finding.severity,
            "confidence": finding.confidence,
            "period": finding.period or "-",
            "legal_basis": finding.legal_basis or "-",
        }
        if finding.status == "NOT_EVALUATED":
            row["not_evaluated_because"] = ", ".join(finding.missing_inputs) or "unstated"
        else:
            row["igst"] = _chip(finding.calc_id, finding.delta_igst)
            row["cgst"] = _chip(finding.calc_id, finding.delta_cgst)
            row["sgst"] = _chip(finding.calc_id, finding.delta_sgst)
            row["cess"] = _chip(finding.calc_id, finding.delta_cess)
        if finding.suppressed_by:
            row["suppressed_by"] = finding.suppressed_by
        rows.append(row)
    return rows


def _parameters(session: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    """The 34 audit risk parameters for one taxpayer, including the dark ones."""
    gstin = str(args.get("gstin", ""))
    stmt = select(ParamResult).where(ParamResult.gstin == gstin).order_by(ParamResult.param_id)
    rows: list[dict[str, Any]] = []
    for result in session.execute(stmt).scalars():
        spec = PARAMETERS.get(result.param_id)
        rows.append(
            {
                "parameter": result.param_id,
                "title": spec.title if spec else result.param_id,
                "status": result.status,
                "flag": "not evaluated" if result.flag is None else result.flag,
                "action_point": spec.action_point if spec else "-",
            }
        )
    return rows


def _scores(session: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    """P-Score with its coverage, and F-Score.  Never fused, never averaged."""
    gstin = str(args.get("gstin", ""))
    stmt = select(RiskScore).where(RiskScore.gstin == gstin)
    rows: list[dict[str, Any]] = []
    for score in session.execute(stmt).scalars():
        rows.append(
            {
                "fy": score.fy,
                "p_score": _chip(score.p_calc_id, score.p_score),
                "p_evaluated_of_34": score.p_evaluated if score.p_evaluated is not None else "-",
                "p_band": score.p_band or "-",
                "f_score": _chip(score.f_calc_id, score.f_score),
                "f_band": score.f_band or "-",
            }
        )
    return rows


def _rule_library(_session: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    """The rule catalogue: what a rule tests and under what provision."""
    wanted = {str(r).upper() for r in (args.get("rule_ids") or [])}
    return [
        {
            "rule": spec.id,
            "title": spec.title,
            "legal_basis": spec.legal_basis,
            "dimension": spec.dimension.value,
            "default_severity": spec.severity.value,
        }
        for spec in RULES.values()
        if not wanted or spec.id in wanted
    ]


def _parameter_library(_session: Session, args: dict[str, Any]) -> list[dict[str, Any]]:
    """The 34 parameters with their action points, verbatim."""
    wanted = {str(p).upper() for p in (args.get("param_ids") or [])}
    return [
        {
            "parameter": spec.id,
            "title": spec.title,
            "action_point": spec.action_point,
            "external_feed": spec.external_feed or "-",
        }
        for spec in PARAMETERS.values()
        if not wanted or spec.id in wanted
    ]


FINDINGS_TOOL: Final = Tool(
    "findings",
    "Findings recorded for this taxpayer by the deterministic engine.",
    _findings,
)
PARAMETERS_TOOL: Final = Tool(
    "parameters",
    "The 34 audit risk parameters as evaluated for this taxpayer.",
    _parameters,
)
SCORES_TOOL: Final = Tool(
    "scores",
    "P-Score with its coverage, and F-Score. They are separate numbers.",
    _scores,
)
RULE_LIBRARY_TOOL: Final = Tool(
    "rule_library", "What each rule tests and under which provision.", _rule_library
)
PARAMETER_LIBRARY_TOOL: Final = Tool(
    "parameter_library", "The 34 parameters and their action points.", _parameter_library
)


# ---------------------------------------------------------------------------
# the six agents
# ---------------------------------------------------------------------------

COLUMN_MAPPER: Final = AgentSpec(
    key="column_mapper",
    title="Column Mapper",
    system="""\
You propose a mapping from the column headers of an uploaded spreadsheet to the
platform's canonical fields. You propose only; an officer confirms.

Answer as one line per column: the header exactly as it appears, an arrow, the
canonical field you propose, and a short reason. Where you are unsure, say
"uncertain" rather than guessing -- a wrong mapping silently changes every
figure computed from that column.

Accepted mappings are written back to the deterministic lexicon, so a header
you map today should not need you tomorrow.""",
)

NARRATOR: Final = AgentSpec(
    key="narrator",
    title="Narrator",
    system="""\
You turn findings into prose an officer can read, in the language asked for
(English, Marathi or Hindi).

Quote every figure exactly as it appears in the material, keeping its calc chip
immediately before it. Do not total anything, do not compute a percentage, and
do not describe a trend you were not given.

Where a rule was not evaluated, say which dataset was missing. Never write that
nothing was found when the truth is that nothing could be tested.""",
    tools=(FINDINGS_TOOL, PARAMETERS_TOOL, SCORES_TOOL),
)

NOTICE_DRAFTER: Final = AgentSpec(
    key="notice_drafter",
    title="Notice Drafter",
    system="""\
You draft the narrative paragraph of a statutory notice, and nothing else.

Every figure, every table and every statutory reference on the notice is filled
by the platform from the finding itself. You will never see the numeric slots
and must not attempt to write any figure into your paragraph.

Write plainly, in the register of a departmental communication: what was
observed, from which return and period, and what the taxpayer is being asked to
explain. No adjectives about the taxpayer's conduct and no conclusion about
intent -- that is the officer's to form and the adjudication's to record.""",
    tools=(FINDINGS_TOOL, RULE_LIBRARY_TOOL),
)

LEGAL_RESEARCH: Final = AgentSpec(
    key="legal_research",
    title="Legal Research",
    system="""\
You answer questions about the Acts, Rules, notifications, circulars, advance
rulings and case law supplied to you, and only from those.

The law changes. Everything you are given is dated, and you must answer as at
the tax period under scrutiny, not as at today. Where the provision you are
asked about changed within the period, say so and give both.

Cite what you rely on. Where the supplied material does not answer the
question, say that it does not -- do not reason from memory.""",
    tools=(RULE_LIBRARY_TOOL, PARAMETER_LIBRARY_TOOL),
)

REPLY_TRIAGE: Final = AgentSpec(
    key="reply_triage",
    title="Reply Triage",
    system="""\
You map the paragraphs of a taxpayer's reply to the findings they answer.

Produce two lists. First: each finding, with the paragraph that addresses it
and a one-line summary of what the taxpayer says. Second, and more important:
the findings no paragraph addresses at all.

The unaddressed list is the output the officer is actually here for. Be
conservative -- a paragraph that mentions a period without answering the point
is not an answer.""",
    tools=(FINDINGS_TOOL,),
)

COPILOT: Final = AgentSpec(
    key="copilot",
    title="Copilot",
    system="""\
You answer questions about results the platform has already computed. You are a
read-only conversational surface over those results.

You cannot run the engine, change a parameter, open a case or issue anything.
If asked to, say what the officer should click instead.

Quote figures with their calc chips. If a question needs a figure you were not
given, say so plainly: the officer can drill to it in one click, and a guess
from you would be worse than useless.""",
    tools=(FINDINGS_TOOL, PARAMETERS_TOOL, SCORES_TOOL, RULE_LIBRARY_TOOL),
)


AGENTS: Final[dict[str, AgentSpec]] = {
    spec.key: spec
    for spec in (
        COLUMN_MAPPER,
        NARRATOR,
        NOTICE_DRAFTER,
        LEGAL_RESEARCH,
        REPLY_TRIAGE,
        COPILOT,
    )
}


def agent_for(key: str) -> AgentSpec:
    try:
        return AGENTS[key]
    except KeyError as exc:
        raise LookupError(f"no agent {key!r}; the six are {sorted(AGENTS)}") from exc
