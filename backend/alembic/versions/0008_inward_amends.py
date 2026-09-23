"""Which document an inward amendment amends.

The GSTR-2A B2BA table carries `Original Invoice Number` and `Original
Invoice Date`, the 2B one carries the original number and date in its first
two columns, and neither was read. The outward line has had these columns
since 0001 and nothing wrote them either.

Without the reference an amendment is indistinguishable from a fresh
document: it cannot be folded into the line it corrects, so the same supply
appears twice, and J17 - amendments against their originals - has nothing to
join on.

Nullable, and null is not a statement that the row amends nothing. `section`
says that: an ordinary B2B line is section `B2B` and carries no reference,
while a B2BA line is section `AMENDMENT` and should carry one. A B2BA line
with a null reference is a sheet that did not state it, which is a different
thing again and stays visible as such.

Revision ID: 0008
Revises: 0007
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("inward_line", sa.Column("amends_doc_no", sa.String(length=64), nullable=True))
    op.add_column("inward_line", sa.Column("amends_doc_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("inward_line", "amends_doc_date")
    op.drop_column("inward_line", "amends_doc_no")
