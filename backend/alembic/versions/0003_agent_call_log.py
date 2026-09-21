"""The agent call log.

Every invocation is recorded whole -- the pseudonymised prompt that actually
went to the model, the completion, the tools, the tokens, the latency, the
cost, the model version, the officer and the case.  A completion the
numeric-fidelity middleware rejected is logged too: an agent that tried to
invent a figure is exactly what a reviewer needs to see.

Revision ID: 0003
Revises: 0002
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from app.db.base import JSON_DOC

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "agent_call",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("agent", sa.String(length=32), nullable=False),
        sa.Column("officer_id", sa.String(length=128), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=True),
        sa.Column("subject_ref", sa.String(length=32), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("completion", sa.Text(), nullable=False),
        sa.Column("tool_calls", JSON_DOC, nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False),
        sa.Column("completion_tokens", sa.Integer(), nullable=False),
        sa.Column("cost_inr", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("fidelity_ok", sa.Boolean(), nullable=False),
        sa.Column("fidelity_detail", JSON_DOC, nullable=False),
        sa.Column("accepted_by", sa.String(length=128), nullable=True),
        sa.Column("accepted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("agent_call", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_agent_call_at"), ["at"], unique=False)
        batch_op.create_index(batch_op.f("ix_agent_call_case_id"), ["case_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_agent_call_officer_id"), ["officer_id"], unique=False)
        batch_op.create_index("ix_agent_call_agent_at", ["agent", "at"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("agent_call", schema=None) as batch_op:
        batch_op.drop_index("ix_agent_call_agent_at")
        batch_op.drop_index(batch_op.f("ix_agent_call_officer_id"))
        batch_op.drop_index(batch_op.f("ix_agent_call_case_id"))
        batch_op.drop_index(batch_op.f("ix_agent_call_at"))
    op.drop_table("agent_call")
