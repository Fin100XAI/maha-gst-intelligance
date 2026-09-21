"""Provenance store and the aggregation fact tables.

calc_trace is keyed on the deterministic calc_id itself, so two runs over
one snapshot write one row rather than two.

Revision ID: 0002
Revises: 0001
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from app.db.base import JSON_DOC

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "calc_trace",
        sa.Column("calc_id", sa.String(length=64), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=True),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("subject_id", sa.String(length=32), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=True),
        sa.Column("period", sa.String(length=6), nullable=True),
        sa.Column("fy", sa.String(length=7), nullable=True),
        sa.Column("legal_basis", sa.String(length=512), nullable=True),
        sa.Column("formula_template", sa.Text(), nullable=True),
        sa.Column("formula_rendered", sa.Text(), nullable=True),
        sa.Column("payload", JSON_DOC, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_calc_trace_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("calc_id", name=op.f("pk_calc_trace")),
    )
    with op.batch_alter_table("calc_trace", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_calc_trace_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index("ix_calc_trace_gstin", ["gstin", "fy"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_calc_trace_snapshot_id"), ["snapshot_id"], unique=False
        )
        batch_op.create_index("ix_calc_trace_subject", ["kind", "subject_id"], unique=False)

    op.create_table(
        "fact_enforcement",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("jurisdiction", sa.String(length=128), nullable=False),
        sa.Column("month", sa.String(length=7), nullable=False),
        sa.Column("flagged", sa.Integer(), nullable=False),
        sa.Column("selected", sa.Integer(), nullable=False),
        sa.Column("notices_issued", sa.Integer(), nullable=False),
        sa.Column("replies_received", sa.Integer(), nullable=False),
        sa.Column("appeals", sa.Integer(), nullable=False),
        sa.Column("sustained", sa.Integer(), nullable=False),
        sa.Column(
            "demand_raised", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "demand_confirmed",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "demand_collected",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_fact_enforcement_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_fact_enforcement")),
        sa.UniqueConstraint(
            "engine_run_id",
            "jurisdiction",
            "month",
            name=op.f("uq_fact_enforcement_engine_run_id_jurisdiction_month"),
        ),
    )
    with op.batch_alter_table("fact_enforcement", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_fact_enforcement_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_fact_enforcement_jurisdiction"), ["jurisdiction"], unique=False
        )

    op.create_table(
        "fact_filing_period",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("jurisdiction", sa.String(length=128), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("return_type", sa.String(length=16), nullable=False),
        sa.Column("expected", sa.Integer(), nullable=False),
        sa.Column("filed", sa.Integer(), nullable=False),
        sa.Column("on_time", sa.Integer(), nullable=False),
        sa.Column("late", sa.Integer(), nullable=False),
        sa.Column("not_filed", sa.Integer(), nullable=False),
        sa.Column("nil", sa.Integer(), nullable=False),
        sa.Column("barred", sa.Integer(), nullable=False),
        sa.Column("near_bar", sa.Integer(), nullable=False),
        sa.Column("mean_days_late", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column(
            "liability", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "cash_paid", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "itc_utilised", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "turnover", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_fact_filing_period_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_fact_filing_period")),
        sa.UniqueConstraint(
            "engine_run_id",
            "jurisdiction",
            "period",
            "return_type",
            name=op.f("uq_fact_filing_period_engine_run_id_jurisdiction_period_return_type"),
        ),
    )
    with op.batch_alter_table("fact_filing_period", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_fact_filing_period_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_fact_filing_period_jurisdiction"), ["jurisdiction"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_fact_filing_period_period"), ["period"], unique=False)

    op.create_table(
        "fact_officer",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("officer_id", sa.String(length=64), nullable=False),
        sa.Column("jurisdiction", sa.String(length=128), nullable=True),
        sa.Column("month", sa.String(length=7), nullable=False),
        sa.Column("cases_open", sa.Integer(), nullable=False),
        sa.Column("cases_closed", sa.Integer(), nullable=False),
        sa.Column("mean_age_days", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("notices_pending_approval", sa.Integer(), nullable=False),
        sa.Column(
            "demand_raised", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "demand_collected",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column("sustain_rate", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("case_mix", JSON_DOC, nullable=False),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_fact_officer_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_fact_officer")),
        sa.UniqueConstraint(
            "engine_run_id",
            "officer_id",
            "month",
            name=op.f("uq_fact_officer_engine_run_id_officer_id_month"),
        ),
    )
    with op.batch_alter_table("fact_officer", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_fact_officer_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_fact_officer_officer_id"), ["officer_id"], unique=False
        )

    op.create_table(
        "fact_param_incidence",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("jurisdiction", sa.String(length=128), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=False),
        sa.Column("param_id", sa.String(length=8), nullable=False),
        sa.Column("flag", sa.SmallInteger(), nullable=False),
        sa.Column("taxpayer_count", sa.Integer(), nullable=False),
        sa.Column("aggregate_value", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("external_feed", sa.String(length=64), nullable=True),
        sa.Column("roadmap_ref", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_fact_param_incidence_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_fact_param_incidence")),
        sa.UniqueConstraint(
            "engine_run_id",
            "jurisdiction",
            "fy",
            "param_id",
            "flag",
            name=op.f("uq_fact_param_incidence_engine_run_id_jurisdiction_fy_param_id_flag"),
        ),
    )
    with op.batch_alter_table("fact_param_incidence", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_fact_param_incidence_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_fact_param_incidence_jurisdiction"), ["jurisdiction"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_fact_param_incidence_param_id"), ["param_id"], unique=False
        )

    op.create_table(
        "fact_risk_snapshot",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("jurisdiction", sa.String(length=128), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=False),
        sa.Column("band_kind", sa.String(length=8), nullable=False),
        sa.Column("band", sa.String(length=16), nullable=False),
        sa.Column("taxpayer_count", sa.Integer(), nullable=False),
        sa.Column("p_score_mean", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("p_coverage_mean", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("f_score_mean", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column(
            "revenue_at_risk", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "revenue_at_risk_certain",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "revenue_at_risk_strong",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "revenue_at_risk_advisory",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column("findings_by_family", JSON_DOC, nullable=False),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_fact_risk_snapshot_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_fact_risk_snapshot")),
        sa.UniqueConstraint(
            "engine_run_id",
            "jurisdiction",
            "fy",
            "band_kind",
            "band",
            name=op.f("uq_fact_risk_snapshot_engine_run_id_jurisdiction_fy_band_kind_band"),
        ),
    )
    with op.batch_alter_table("fact_risk_snapshot", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_fact_risk_snapshot_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_fact_risk_snapshot_jurisdiction"), ["jurisdiction"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("fact_risk_snapshot", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_fact_risk_snapshot_jurisdiction"))
        batch_op.drop_index(batch_op.f("ix_fact_risk_snapshot_engine_run_id"))

    op.drop_table("fact_risk_snapshot")
    with op.batch_alter_table("fact_param_incidence", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_fact_param_incidence_param_id"))
        batch_op.drop_index(batch_op.f("ix_fact_param_incidence_jurisdiction"))
        batch_op.drop_index(batch_op.f("ix_fact_param_incidence_engine_run_id"))

    op.drop_table("fact_param_incidence")
    with op.batch_alter_table("fact_officer", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_fact_officer_officer_id"))
        batch_op.drop_index(batch_op.f("ix_fact_officer_engine_run_id"))

    op.drop_table("fact_officer")
    with op.batch_alter_table("fact_filing_period", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_fact_filing_period_period"))
        batch_op.drop_index(batch_op.f("ix_fact_filing_period_jurisdiction"))
        batch_op.drop_index(batch_op.f("ix_fact_filing_period_engine_run_id"))

    op.drop_table("fact_filing_period")
    with op.batch_alter_table("fact_enforcement", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_fact_enforcement_jurisdiction"))
        batch_op.drop_index(batch_op.f("ix_fact_enforcement_engine_run_id"))

    op.drop_table("fact_enforcement")
    with op.batch_alter_table("calc_trace", schema=None) as batch_op:
        batch_op.drop_index("ix_calc_trace_subject")
        batch_op.drop_index(batch_op.f("ix_calc_trace_snapshot_id"))
        batch_op.drop_index("ix_calc_trace_gstin")
        batch_op.drop_index(batch_op.f("ix_calc_trace_engine_run_id"))

    op.drop_table("calc_trace")
