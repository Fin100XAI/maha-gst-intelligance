"""An officer's note against one return for one period.

The unit an officer works is a filing: this taxpayer, this month, this return.
A case is opened once there is something to answer for; a review is what gets
written while deciding, including the times the decision is that there is
nothing to do -- which is the outcome no system records and every officer is
later asked about.

Revision ID: 0005
Revises: 0004
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "filing_review",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=True),
        sa.Column("officer_id", sa.String(length=128), nullable=False),
        sa.Column("at", sa.TIMESTAMP(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("disposition", sa.String(length=16), nullable=False),
    )
    op.create_index("ix_filing_review_gstin", "filing_review", ["gstin"])
    op.create_index("ix_filing_review_subject", "filing_review", ["gstin", "period"])


def downgrade() -> None:
    op.drop_index("ix_filing_review_subject", table_name="filing_review")
    op.drop_index("ix_filing_review_gstin", table_name="filing_review")
    op.drop_table("filing_review")
