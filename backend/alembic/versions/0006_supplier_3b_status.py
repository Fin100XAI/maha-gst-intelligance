"""The supplier's own GSTR-3B filing status, from GSTR-2A.

docs/06 point 7 calls this the most valuable column in the workbook. It makes
Rule 37A (check B-04) computable from a single uploaded file: the supplier
filed GSTR-1, so the credit appeared in the recipient's 2B and was claimed,
but never filed GSTR-3B, so the tax never reached the exchequer. The recipient
must reverse.

Nullable on purpose and never defaulted. GSTR-2B does not carry this column,
so every 2B row is legitimately null, and B-04 abstains on a null rather than
assuming the supplier complied - defaulting it to True would silently clear
the highest-yield check in the rulebook on the majority of rows.

Revision ID: 0006
Revises: 0005
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("inward_line", sa.Column("supplier_3b_filed", sa.Boolean(), nullable=True))
    op.create_index("ix_inward_line_supplier_3b_filed", "inward_line", ["supplier_3b_filed"])


def downgrade() -> None:
    op.drop_index("ix_inward_line_supplier_3b_filed", table_name="inward_line")
    op.drop_column("inward_line", "supplier_3b_filed")
