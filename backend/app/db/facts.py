"""The provenance store and the nightly aggregation fact tables.

A Commissioner's dashboard spans every taxpayer in a commissionerate.
Computing that live is impossible, so the engine rolls up into these after each
run, and **every fact row carries the engine_run_id it was built from** -- which
is what lets a dashboard figure drill to the exact run, then to the finding,
then to the spreadsheet cell.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import ForeignKey, Index, Integer, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import FY, GSTIN, HASH, JSON_DOC, PERIOD, TIMESTAMP, Base, utcnow
from app.db.models import money_col, ratio_col

__all__ = [
    "CalcTraceRow",
    "FactEnforcement",
    "FactFilingPeriod",
    "FactOfficer",
    "FactParamIncidence",
    "FactRiskSnapshot",
]

#: The flag value that stands for NOT_EVALUATED in fact_param_incidence, so the
#: roadmap column is a first-class row rather than an absence to be inferred.
NOT_EVALUATED_FLAG = -1


class CalcTraceRow(Base):
    """One computation, addressable by its calc_id.

    ``GET /calc/{calc_id}`` reads exactly this, and the provenance drawer is
    built from it.  The primary key is the deterministic hash itself, so two
    runs over one snapshot write the same row rather than two.
    """

    __tablename__ = "calc_trace"
    __table_args__ = (
        Index("ix_calc_trace_subject", "kind", "subject_id"),
        Index("ix_calc_trace_gstin", "gstin", "fy"),
    )

    calc_id: Mapped[str] = mapped_column(HASH, primary_key=True)
    engine_run_id: Mapped[str | None] = mapped_column(ForeignKey("engine_run.id"), index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(32), nullable=False)
    snapshot_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    gstin: Mapped[str | None] = mapped_column(GSTIN)
    period: Mapped[str | None] = mapped_column(PERIOD)
    fy: Mapped[str | None] = mapped_column(FY)
    legal_basis: Mapped[str | None] = mapped_column(String(512))
    formula_template: Mapped[str | None] = mapped_column(Text)
    formula_rendered: Mapped[str | None] = mapped_column(Text)
    #: The whole trace: inputs, steps, parameters, evidence, result.
    payload: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)


class FactFilingPeriod(Base):
    """grain: jurisdiction x period x return type."""

    __tablename__ = "fact_filing_period"
    __table_args__ = (UniqueConstraint("engine_run_id", "jurisdiction", "period", "return_type"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    jurisdiction: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    period: Mapped[str] = mapped_column(PERIOD, nullable=False, index=True)
    return_type: Mapped[str] = mapped_column(String(16), nullable=False)
    expected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    filed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    on_time: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    late: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    not_filed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nil: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    barred: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    near_bar: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mean_days_late: Mapped[Decimal | None] = ratio_col()
    liability: Mapped[Decimal] = money_col()
    cash_paid: Mapped[Decimal] = money_col()
    itc_utilised: Mapped[Decimal] = money_col()
    turnover: Mapped[Decimal] = money_col()


class FactRiskSnapshot(Base):
    """grain: jurisdiction x fy x band."""

    __tablename__ = "fact_risk_snapshot"
    __table_args__ = (UniqueConstraint("engine_run_id", "jurisdiction", "fy", "band_kind", "band"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    jurisdiction: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    fy: Mapped[str] = mapped_column(FY, nullable=False)
    #: "P" or "F".  The two scores are stored in separate rows and are never
    #: fused into one distribution.
    band_kind: Mapped[str] = mapped_column(String(8), nullable=False, default="P")
    band: Mapped[str] = mapped_column(String(16), nullable=False)
    taxpayer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    p_score_mean: Mapped[Decimal | None] = ratio_col()
    p_coverage_mean: Mapped[Decimal | None] = ratio_col()
    f_score_mean: Mapped[Decimal | None] = ratio_col()
    revenue_at_risk: Mapped[Decimal] = money_col()
    #: Split by confidence, because a Commissioner reading a single
    #: "revenue at risk" number needs to know how much would survive a reply.
    revenue_at_risk_certain: Mapped[Decimal] = money_col()
    revenue_at_risk_strong: Mapped[Decimal] = money_col()
    revenue_at_risk_advisory: Mapped[Decimal] = money_col()
    findings_by_family: Mapped[dict[str, Any]] = mapped_column(
        JSON_DOC, nullable=False, default=dict
    )


class FactParamIncidence(Base):
    """grain: jurisdiction x fy x param_id x flag.

    Powers "which of the 34 parameters fire most in my division", and the
    NOT_EVALUATED column that prices the integration roadmap.
    """

    __tablename__ = "fact_param_incidence"
    __table_args__ = (UniqueConstraint("engine_run_id", "jurisdiction", "fy", "param_id", "flag"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    jurisdiction: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    fy: Mapped[str] = mapped_column(FY, nullable=False)
    param_id: Mapped[str] = mapped_column(String(8), nullable=False, index=True)
    flag: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    taxpayer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    aggregate_value: Mapped[Decimal | None] = ratio_col()
    external_feed: Mapped[str | None] = mapped_column(String(64))
    roadmap_ref: Mapped[str | None] = mapped_column(String(32))


class FactEnforcement(Base):
    """grain: jurisdiction x month."""

    __tablename__ = "fact_enforcement"
    __table_args__ = (UniqueConstraint("engine_run_id", "jurisdiction", "month"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    jurisdiction: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    month: Mapped[str] = mapped_column(String(7), nullable=False)
    flagged: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    selected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notices_issued: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    replies_received: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    appeals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sustained: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    demand_raised: Mapped[Decimal] = money_col()
    demand_confirmed: Mapped[Decimal] = money_col()
    demand_collected: Mapped[Decimal] = money_col()


class FactOfficer(Base):
    """grain: officer x month.

    Rendered as capacity and case mix, never as a league table: ten complex
    ITC-fraud cases do not compare with fifty late-fee cases, and a screen that
    hid that would be used to make bad decisions about people.  ``case_mix`` is
    therefore not optional -- it travels with every throughput number.
    """

    __tablename__ = "fact_officer"
    __table_args__ = (UniqueConstraint("engine_run_id", "officer_id", "month"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    officer_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(128))
    month: Mapped[str] = mapped_column(String(7), nullable=False)
    cases_open: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cases_closed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mean_age_days: Mapped[Decimal | None] = ratio_col()
    notices_pending_approval: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    demand_raised: Mapped[Decimal] = money_col()
    demand_collected: Mapped[Decimal] = money_col()
    sustain_rate: Mapped[Decimal | None] = ratio_col()
    case_mix: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)
