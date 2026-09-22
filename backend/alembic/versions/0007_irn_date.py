"""The IRP's acknowledgement date on the outward line.

Without it Rule 48(4) - report an e-invoice within thirty days - cannot be
computed at all, so checks G-03 and G-04 abstain. With it they can run.

This column is also the reason `app/ingestion/transposition.py` exists, and
the order of the two is not incidental. On the reference workbook the column
arrives mixed: 1,408 cells Excel could not parse and left as text, and 635 it
parsed with the day and month swapped. Read naively that produces 314
acknowledgements dated before their own invoices and 250 breaches of the
thirty-day window - two hundred and fifty notices the department would have
issued and lost. The detector was wired into the pipeline before this
migration landed, on purpose; mapping the column first would have shipped the
defect and the capability together.

Nullable, and an absent value is not a late one. Most documents carry no IRN,
and G-03/G-04 report NOT_EVALUATED on those rather than reading a null as
zero days elapsed.

Revision ID: 0007
Revises: 0006
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("outward_line", sa.Column("irn_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("outward_line", "irn_date")
