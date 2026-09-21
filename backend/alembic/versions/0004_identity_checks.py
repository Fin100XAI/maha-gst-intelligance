"""The reconciliation identities, stored per taxpayer and period.

The 12 x 11 matrix the Reconciliation Workbench renders. Recorded rather than
recomputed, and carrying its own ``status``: whether an identity holds is the
engine's judgement, because only the engine knows each identity's tolerance.

Revision ID: 0004
Revises: 0003
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from app.db.base import JSON_DOC

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "identity_check",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=True),
        sa.Column("fy", sa.String(length=7), nullable=True),
        sa.Column("identity_id", sa.String(length=8), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("delta_igst", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("delta_cgst", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("delta_sgst", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("delta_cess", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("missing_inputs", JSON_DOC, nullable=False),
        sa.Column("consequence", sa.String(length=512), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("calc_id", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["engine_run_id"], ["engine_run.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("engine_run_id", "gstin", "period", "identity_id"),
    )
    with op.batch_alter_table("identity_check", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_identity_check_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_identity_check_gstin"), ["gstin"], unique=False)
        batch_op.create_index(batch_op.f("ix_identity_check_calc_id"), ["calc_id"], unique=False)
        batch_op.create_index("ix_identity_check_status", ["engine_run_id", "status"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("identity_check", schema=None) as batch_op:
        batch_op.drop_index("ix_identity_check_status")
        batch_op.drop_index(batch_op.f("ix_identity_check_calc_id"))
        batch_op.drop_index(batch_op.f("ix_identity_check_gstin"))
        batch_op.drop_index(batch_op.f("ix_identity_check_engine_run_id"))
    op.drop_table("identity_check")
