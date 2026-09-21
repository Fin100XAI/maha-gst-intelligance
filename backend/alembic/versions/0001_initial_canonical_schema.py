"""Initial canonical schema -- every table in docs/02_PLATFORM_SPEC.md section 4.

Money is NUMERIC(18,2) throughout; gate G2 (tests/migration/test_money_columns.py)
fails the build if that ever becomes floating point.

Revision ID: 0001
Revises: nothing -- this is genesis
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from app.db.base import JSON_DOC

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("seq", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(length=128), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=True),
        sa.Column("before_hash", sa.String(length=64), nullable=True),
        sa.Column("after_hash", sa.String(length=64), nullable=True),
        sa.Column("chain_hash", sa.String(length=64), nullable=False),
        sa.Column("ip", sa.String(length=45), nullable=True),
        sa.Column("detail", JSON_DOC, nullable=False),
        sa.PrimaryKeyConstraint("seq", name=op.f("pk_audit_log")),
    )
    with op.batch_alter_table("audit_log", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_audit_log_actor"), ["actor"], unique=False)
        batch_op.create_index(batch_op.f("ix_audit_log_at"), ["at"], unique=False)
        batch_op.create_index("ix_audit_log_entity", ["entity", "entity_id"], unique=False)

    op.create_table(
        "case",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=False),
        sa.Column("periods", JSON_DOC, nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("officer_id", sa.String(length=64), nullable=True),
        sa.Column("finding_ids", JSON_DOC, nullable=False),
        sa.Column(
            "demand_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "demand_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "demand_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "demand_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "interest", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("penalty", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("section_applied", sa.String(length=16), nullable=True),
        sa.Column("scn_deadline", sa.Date(), nullable=True),
        sa.Column("order_deadline", sa.Date(), nullable=True),
        sa.Column("days_to_limitation", sa.Integer(), nullable=True),
        sa.Column("outcome", sa.String(length=32), nullable=True),
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
        sa.Column("calc_id", sa.String(length=64), nullable=True),
        sa.Column("opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_case")),
    )
    with op.batch_alter_table("case", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_case_days_to_limitation"), ["days_to_limitation"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_case_gstin"), ["gstin"], unique=False)
        batch_op.create_index(batch_op.f("ix_case_officer_id"), ["officer_id"], unique=False)

    op.create_table(
        "rule_parameter",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("rule_or_param_id", sa.String(length=32), nullable=False),
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("value_type", sa.String(length=16), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date(), nullable=True),
        sa.Column("notification_ref", sa.String(length=255), nullable=True),
        sa.Column("source_note", sa.Text(), nullable=True),
        sa.Column("approved_by", sa.String(length=128), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("supersedes_id", sa.String(length=36), nullable=True),
        sa.Column("provisional", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["supersedes_id"],
            ["rule_parameter.id"],
            name=op.f("fk_rule_parameter_supersedes_id_rule_parameter"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rule_parameter")),
    )
    with op.batch_alter_table("rule_parameter", schema=None) as batch_op:
        batch_op.create_index(
            "ix_rule_parameter_lookup", ["rule_or_param_id", "key", "effective_from"], unique=False
        )

    op.create_table(
        "snapshot",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", sa.String(length=128), nullable=False),
        sa.Column("upload_ids", JSON_DOC, nullable=False),
        sa.Column("gstins", JSON_DOC, nullable=False),
        sa.Column("row_counts", JSON_DOC, nullable=False),
        sa.Column("frozen", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_snapshot")),
    )
    with op.batch_alter_table("snapshot", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_snapshot_content_hash"), ["content_hash"], unique=False
        )

    op.create_table(
        "taxpayer",
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("pan", sa.String(length=10), nullable=False),
        sa.Column("legal_name", sa.String(length=512), nullable=False),
        sa.Column("trade_name", sa.String(length=512), nullable=True),
        sa.Column("state_code", sa.String(length=2), nullable=False),
        sa.Column("registration_type", sa.String(length=64), nullable=True),
        sa.Column("registration_date", sa.Date(), nullable=True),
        sa.Column("cancellation_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("aato", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("qrmp", sa.Boolean(), nullable=False),
        sa.Column("einvoice_applicable", sa.Boolean(), nullable=False),
        sa.Column("sector_code", sa.String(length=32), nullable=True),
        sa.Column("commissionerate", sa.String(length=128), nullable=True),
        sa.Column("division", sa.String(length=128), nullable=True),
        sa.Column("range", sa.String(length=128), nullable=True),
        sa.Column("officer_id", sa.String(length=64), nullable=True),
        sa.Column("address_norm_hash", sa.String(length=64), nullable=True),
        sa.Column("bank_hash", sa.String(length=64), nullable=True),
        sa.Column("mobile_hash", sa.String(length=64), nullable=True),
        sa.Column("email_hash", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("gstin", name=op.f("pk_taxpayer")),
    )
    with op.batch_alter_table("taxpayer", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_taxpayer_address_norm_hash"), ["address_norm_hash"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_taxpayer_bank_hash"), ["bank_hash"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_taxpayer_commissionerate"), ["commissionerate"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_taxpayer_division"), ["division"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_email_hash"), ["email_hash"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_mobile_hash"), ["mobile_hash"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_officer_id"), ["officer_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_pan"), ["pan"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_range"), ["range"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_sector_code"), ["sector_code"], unique=False)
        batch_op.create_index(batch_op.f("ix_taxpayer_state_code"), ["state_code"], unique=False)

    op.create_table(
        "upload",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("filename", sa.String(length=512), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("storage_key", sa.String(length=1024), nullable=False),
        sa.Column("content_type", sa.String(length=255), nullable=True),
        sa.Column("uploaded_by", sa.String(length=128), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("virus_scan", sa.String(length=32), nullable=True),
        sa.Column("sheet_count", sa.Integer(), nullable=False),
        sa.Column("rows_in", sa.Integer(), nullable=False),
        sa.Column("rows_parsed", sa.Integer(), nullable=False),
        sa.Column("rows_quarantined", sa.Integer(), nullable=False),
        sa.Column("rows_duplicate", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_upload")),
    )
    with op.batch_alter_table("upload", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_upload_sha256"), ["sha256"], unique=False)

    op.create_table(
        "engine_run",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("as_of", sa.Date(), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=True),
        sa.Column("engine_version", sa.String(length=32), nullable=False),
        sa.Column("params_version", sa.String(length=32), nullable=False),
        sa.Column("triggered_by", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("gstin_count", sa.Integer(), nullable=False),
        sa.Column("finding_count", sa.Integer(), nullable=False),
        sa.Column("config", JSON_DOC, nullable=False),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_engine_run_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_engine_run")),
    )
    with op.batch_alter_table("engine_run", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_engine_run_snapshot_id"), ["snapshot_id"], unique=False
        )

    op.create_table(
        "notice",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("form", sa.String(length=16), nullable=False),
        sa.Column("din", sa.String(length=32), nullable=True),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("body_json", JSON_DOC, nullable=False),
        sa.Column("pdf_hash", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("generated_by", sa.String(length=128), nullable=True),
        sa.Column("approved_by", sa.String(length=128), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("served_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("service_mode", sa.String(length=32), nullable=True),
        sa.Column("reply_due", sa.Date(), nullable=True),
        sa.Column("reply_received_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["case.id"], name=op.f("fk_notice_case_id_case")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notice")),
        sa.UniqueConstraint("din", name=op.f("uq_notice_din")),
    )
    with op.batch_alter_table("notice", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_notice_case_id"), ["case_id"], unique=False)

    op.create_table(
        "provenance",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("upload_id", sa.String(length=36), nullable=False),
        sa.Column("file_name", sa.String(length=512), nullable=False),
        sa.Column("file_sha256", sa.String(length=64), nullable=False),
        sa.Column("sheet_name", sa.String(length=255), nullable=False),
        sa.Column("header_row_index", sa.Integer(), nullable=True),
        sa.Column("row_index", sa.Integer(), nullable=False),
        sa.Column("original_cells", JSON_DOC, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["upload_id"], ["upload.id"], name=op.f("fk_provenance_upload_id_upload")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_provenance")),
    )
    with op.batch_alter_table("provenance", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_provenance_upload_id"), ["upload_id"], unique=False)

    op.create_table(
        "quarantine_row",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("upload_id", sa.String(length=36), nullable=False),
        sa.Column("sheet_name", sa.String(length=255), nullable=False),
        sa.Column("row_index", sa.Integer(), nullable=False),
        sa.Column("reason_code", sa.String(length=64), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("field", sa.String(length=128), nullable=True),
        sa.Column("original_cells", JSON_DOC, nullable=False),
        sa.Column("resolved", sa.Boolean(), nullable=False),
        sa.Column("replayed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["upload_id"], ["upload.id"], name=op.f("fk_quarantine_row_upload_id_upload")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_quarantine_row")),
    )
    with op.batch_alter_table("quarantine_row", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_quarantine_row_reason_code"), ["reason_code"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_quarantine_row_upload_id"), ["upload_id"], unique=False
        )

    op.create_table(
        "upload_sheet",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("upload_id", sa.String(length=36), nullable=False),
        sa.Column("sheet_name", sa.String(length=255), nullable=False),
        sa.Column("sheet_index", sa.Integer(), nullable=False),
        sa.Column("detected_type", sa.String(length=32), nullable=True),
        sa.Column("confidence", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("header_row_index", sa.Integer(), nullable=True),
        sa.Column("mapping", JSON_DOC, nullable=True),
        sa.Column("mapping_source", sa.String(length=32), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("rows_in", sa.Integer(), nullable=False),
        sa.Column("rows_parsed", sa.Integer(), nullable=False),
        sa.Column("rows_quarantined", sa.Integer(), nullable=False),
        sa.Column("rows_duplicate", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["upload_id"], ["upload.id"], name=op.f("fk_upload_sheet_upload_id_upload")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_upload_sheet")),
        sa.UniqueConstraint(
            "upload_id", "sheet_name", name=op.f("uq_upload_sheet_upload_id_sheet_name")
        ),
    )
    with op.batch_alter_table("upload_sheet", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_upload_sheet_upload_id"), ["upload_id"], unique=False)

    op.create_table(
        "einvoice",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=True),
        sa.Column("irn", sa.String(length=64), nullable=False),
        sa.Column("ack_no", sa.String(length=32), nullable=True),
        sa.Column("ack_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("doc_no", sa.String(length=64), nullable=True),
        sa.Column("doc_date", sa.Date(), nullable=True),
        sa.Column("doc_type", sa.String(length=24), nullable=True),
        sa.Column("counterparty_gstin", sa.String(length=15), nullable=True),
        sa.Column(
            "taxable_value", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("cancelled_on", sa.DateTime(timezone=True), nullable=True),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_einvoice_prov_id_provenance")
        ),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_einvoice_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_einvoice")),
    )
    with op.batch_alter_table("einvoice", schema=None) as batch_op:
        batch_op.create_index("ix_einvoice_doc", ["gstin", "doc_no", "doc_date"], unique=False)
        batch_op.create_index("ix_einvoice_gstin_period", ["gstin", "period"], unique=False)
        batch_op.create_index(batch_op.f("ix_einvoice_irn"), ["irn"], unique=False)
        batch_op.create_index(batch_op.f("ix_einvoice_snapshot_id"), ["snapshot_id"], unique=False)

    op.create_table(
        "eway_bill",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=True),
        sa.Column("ewb_no", sa.String(length=16), nullable=False),
        sa.Column("ewb_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("doc_no", sa.String(length=64), nullable=True),
        sa.Column("doc_date", sa.Date(), nullable=True),
        sa.Column("doc_type", sa.String(length=24), nullable=True),
        sa.Column("from_gstin", sa.String(length=15), nullable=True),
        sa.Column("to_gstin", sa.String(length=15), nullable=True),
        sa.Column("from_state", sa.String(length=2), nullable=True),
        sa.Column("to_state", sa.String(length=2), nullable=True),
        sa.Column("from_pin", sa.String(length=6), nullable=True),
        sa.Column("to_pin", sa.String(length=6), nullable=True),
        sa.Column("hsn", sa.String(length=8), nullable=True),
        sa.Column("value", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("distance_km", sa.Integer(), nullable=True),
        sa.Column("vehicle_no", sa.String(length=20), nullable=True),
        sa.Column("transport_mode", sa.String(length=16), nullable=True),
        sa.Column("part_b_filled", sa.Boolean(), nullable=False),
        sa.Column("valid_upto", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("cancelled_on", sa.DateTime(timezone=True), nullable=True),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_eway_bill_prov_id_provenance")
        ),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_eway_bill_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_eway_bill")),
    )
    with op.batch_alter_table("eway_bill", schema=None) as batch_op:
        batch_op.create_index("ix_eway_bill_doc", ["gstin", "doc_no", "doc_date"], unique=False)
        batch_op.create_index("ix_eway_bill_gstin_date", ["gstin", "ewb_date"], unique=False)
        batch_op.create_index(batch_op.f("ix_eway_bill_snapshot_id"), ["snapshot_id"], unique=False)
        batch_op.create_index("ix_eway_bill_vehicle", ["vehicle_no", "ewb_date"], unique=False)

    op.create_table(
        "filing_status",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("return_type", sa.String(length=16), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("filing_date", sa.Date(), nullable=True),
        sa.Column("arn", sa.String(length=32), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("days_late", sa.Integer(), nullable=True),
        sa.Column("barred_on", sa.Date(), nullable=True),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_filing_status_prov_id_provenance")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_filing_status")),
        sa.UniqueConstraint(
            "gstin", "return_type", "period", name=op.f("uq_filing_status_gstin_return_type_period")
        ),
    )
    with op.batch_alter_table("filing_status", schema=None) as batch_op:
        batch_op.create_index("ix_filing_status_barred_on", ["barred_on"], unique=False)
        batch_op.create_index(batch_op.f("ix_filing_status_gstin"), ["gstin"], unique=False)

    op.create_table(
        "finding",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=True),
        sa.Column("fy", sa.String(length=7), nullable=True),
        sa.Column("rule_id", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=False),
        sa.Column("confidence", sa.String(length=16), nullable=False),
        sa.Column("dimension", sa.String(length=16), nullable=False),
        sa.Column(
            "observed_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "observed_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "observed_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "observed_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "expected_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "expected_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "expected_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "expected_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "delta_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "delta_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "delta_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "delta_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "taxable_value_effect",
            sa.Numeric(precision=18, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "interest", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("penalty", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("points", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("calc_id", sa.String(length=64), nullable=False),
        sa.Column("formula_rendered", sa.Text(), nullable=True),
        sa.Column("legal_basis", sa.String(length=512), nullable=True),
        sa.Column("evidence_ids", JSON_DOC, nullable=False),
        sa.Column("missing_inputs", JSON_DOC, nullable=False),
        sa.Column("suggested_form", sa.String(length=16), nullable=True),
        sa.Column("suppressed_by", sa.String(length=64), nullable=True),
        sa.Column("officer_disposition", sa.String(length=24), nullable=True),
        sa.Column("disposition_by", sa.String(length=128), nullable=True),
        sa.Column("disposition_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("disposition_note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["engine_run_id"], ["engine_run.id"], name=op.f("fk_finding_engine_run_id_engine_run")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_finding")),
    )
    with op.batch_alter_table("finding", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_finding_calc_id"), ["calc_id"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_finding_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(
            "ix_finding_rule", ["engine_run_id", "rule_id", "status"], unique=False
        )
        batch_op.create_index("ix_finding_run_gstin", ["engine_run_id", "gstin"], unique=False)
        batch_op.create_index(
            "ix_finding_triage", ["engine_run_id", "severity", "confidence"], unique=False
        )

    op.create_table(
        "inward_line",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("section", sa.String(length=16), nullable=False),
        sa.Column("doc_type", sa.String(length=24), nullable=False),
        sa.Column("doc_no", sa.String(length=64), nullable=True),
        sa.Column("doc_date", sa.Date(), nullable=True),
        sa.Column("supplier_gstin", sa.String(length=15), nullable=True),
        sa.Column("pos", sa.String(length=2), nullable=True),
        sa.Column("rate", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column(
            "taxable_value", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("itc_available", sa.Boolean(), nullable=True),
        sa.Column("itc_unavailable_reason", sa.String(length=128), nullable=True),
        sa.Column("supplier_filing_date", sa.Date(), nullable=True),
        sa.Column("supplier_return_period", sa.String(length=6), nullable=True),
        sa.Column("ims_action", sa.String(length=16), nullable=True),
        sa.Column("ims_action_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("hsn", sa.String(length=8), nullable=True),
        sa.Column("source_form", sa.String(length=8), nullable=False),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_inward_line_prov_id_provenance")
        ),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_inward_line_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inward_line")),
    )
    with op.batch_alter_table("inward_line", schema=None) as batch_op:
        batch_op.create_index(
            "ix_inward_line_availability", ["gstin", "period", "itc_available"], unique=False
        )
        batch_op.create_index("ix_inward_line_gstin_period", ["gstin", "period"], unique=False)
        batch_op.create_index(batch_op.f("ix_inward_line_ims_action"), ["ims_action"], unique=False)
        batch_op.create_index(batch_op.f("ix_inward_line_section"), ["section"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_inward_line_snapshot_id"), ["snapshot_id"], unique=False
        )
        batch_op.create_index(
            "ix_inward_line_supplier", ["supplier_gstin", "supplier_return_period"], unique=False
        )

    op.create_table(
        "ledger_movement",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("as_on", sa.Date(), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=True),
        sa.Column("ledger", sa.String(length=16), nullable=False),
        sa.Column("head", sa.String(length=8), nullable=False),
        sa.Column("opening", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column(
            "credited", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("debited", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("closing", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("reference", sa.String(length=64), nullable=True),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_ledger_movement_prov_id_provenance")
        ),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_ledger_movement_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ledger_movement")),
        sa.UniqueConstraint(
            "snapshot_id",
            "gstin",
            "as_on",
            "ledger",
            "head",
            name=op.f("uq_ledger_movement_snapshot_id_gstin_as_on_ledger_head"),
        ),
    )
    with op.batch_alter_table("ledger_movement", schema=None) as batch_op:
        batch_op.create_index("ix_ledger_movement_gstin_ason", ["gstin", "as_on"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_ledger_movement_snapshot_id"), ["snapshot_id"], unique=False
        )

    op.create_table(
        "outward_line",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("section", sa.String(length=16), nullable=False),
        sa.Column("doc_type", sa.String(length=24), nullable=False),
        sa.Column("doc_no", sa.String(length=64), nullable=True),
        sa.Column("doc_date", sa.Date(), nullable=True),
        sa.Column("counterparty_gstin", sa.String(length=15), nullable=True),
        sa.Column("pos", sa.String(length=2), nullable=True),
        sa.Column("rate", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column(
            "taxable_value", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False),
        sa.Column("reverse_charge", sa.Boolean(), nullable=False),
        sa.Column("hsn", sa.String(length=8), nullable=True),
        sa.Column("uqc", sa.String(length=16), nullable=True),
        sa.Column("quantity", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("ecom_gstin", sa.String(length=15), nullable=True),
        sa.Column("is_amendment", sa.Boolean(), nullable=False),
        sa.Column("amends_doc_no", sa.String(length=64), nullable=True),
        sa.Column("amends_doc_date", sa.Date(), nullable=True),
        sa.Column("irn", sa.String(length=64), nullable=True),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_outward_line_prov_id_provenance")
        ),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_outward_line_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_outward_line")),
    )
    with op.batch_alter_table("outward_line", schema=None) as batch_op:
        batch_op.create_index(
            "ix_outward_line_counterparty", ["counterparty_gstin", "period"], unique=False
        )
        batch_op.create_index("ix_outward_line_doc", ["gstin", "doc_no", "doc_date"], unique=False)
        batch_op.create_index("ix_outward_line_gstin_period", ["gstin", "period"], unique=False)
        batch_op.create_index(batch_op.f("ix_outward_line_hsn"), ["hsn"], unique=False)
        batch_op.create_index(batch_op.f("ix_outward_line_section"), ["section"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_outward_line_snapshot_id"), ["snapshot_id"], unique=False
        )

    op.create_table(
        "param_result",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=False),
        sa.Column("param_id", sa.String(length=8), nullable=False),
        sa.Column("value", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("flag", sa.SmallInteger(), nullable=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("banding", sa.String(length=16), nullable=True),
        sa.Column("direction", sa.String(length=16), nullable=True),
        sa.Column("weight", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("cohort_p50", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("cohort_p75", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("cohort_p90", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("cohort_p97", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("cohort_n", sa.Integer(), nullable=True),
        sa.Column("calc_id", sa.String(length=64), nullable=False),
        sa.Column("missing_inputs", JSON_DOC, nullable=False),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_param_result_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_param_result")),
        sa.UniqueConstraint(
            "engine_run_id",
            "gstin",
            "fy",
            "param_id",
            name=op.f("uq_param_result_engine_run_id_gstin_fy_param_id"),
        ),
    )
    with op.batch_alter_table("param_result", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_param_result_calc_id"), ["calc_id"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_param_result_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_param_result_gstin"), ["gstin"], unique=False)
        batch_op.create_index(
            "ix_param_result_incidence", ["engine_run_id", "param_id", "flag"], unique=False
        )

    op.create_table(
        "return_3b",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("snapshot_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("filing_date", sa.Date(), nullable=True),
        sa.Column("arn", sa.String(length=32), nullable=True),
        sa.Column(
            "t31a_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31a_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31a_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31a_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31a_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31b_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31b_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31b_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31b_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31b_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31c_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31c_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31c_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31c_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31c_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31d_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31d_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31d_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31d_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31d_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31e_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31e_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31e_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31e_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t31e_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311i_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311i_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311i_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311i_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311i_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311ii_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311ii_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311ii_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311ii_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t311ii_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t32_taxable", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t32_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t32_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t32_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t32_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a1_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a1_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a1_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a1_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a2_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a2_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a2_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a2_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a3_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a3_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a3_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a3_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a4_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a4_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a4_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a4_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a5_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a5_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a5_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4a5_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b1_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b1_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b1_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b1_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b2_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b2_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b2_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4b2_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4c_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4c_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4c_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4c_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d1_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d1_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d1_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d1_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d2_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d2_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d2_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t4d2_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t5_inter", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "t5_intra", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "interest_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "interest_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "interest_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "interest_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "late_fee_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "late_fee_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "late_fee_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "late_fee_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "payable_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "payable_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "payable_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "payable_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_itc_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_itc_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_itc_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_itc_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_cash_igst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_cash_cgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_cash_sgst", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column(
            "paid_cash_cess", sa.Numeric(precision=18, scale=2), server_default="0", nullable=False
        ),
        sa.Column("prov_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(
            ["prov_id"], ["provenance.id"], name=op.f("fk_return_3b_prov_id_provenance")
        ),
        sa.ForeignKeyConstraint(
            ["snapshot_id"], ["snapshot.id"], name=op.f("fk_return_3b_snapshot_id_snapshot")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_return_3b")),
        sa.UniqueConstraint(
            "snapshot_id", "gstin", "period", name=op.f("uq_return_3b_snapshot_id_gstin_period")
        ),
    )
    with op.batch_alter_table("return_3b", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_return_3b_gstin"), ["gstin"], unique=False)
        batch_op.create_index(batch_op.f("ix_return_3b_snapshot_id"), ["snapshot_id"], unique=False)

    op.create_table(
        "risk_score",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("engine_run_id", sa.String(length=36), nullable=False),
        sa.Column("gstin", sa.String(length=15), nullable=False),
        sa.Column("fy", sa.String(length=7), nullable=False),
        sa.Column("p_score", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("p_coverage", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("p_evaluated", sa.SmallInteger(), nullable=True),
        sa.Column("p_band", sa.String(length=16), nullable=True),
        sa.Column("f_score", sa.Numeric(precision=28, scale=10), nullable=True),
        sa.Column("f_band", sa.String(length=16), nullable=True),
        sa.Column("dimension_scores", JSON_DOC, nullable=False),
        sa.Column("waterfall_json", JSON_DOC, nullable=False),
        sa.Column("p_calc_id", sa.String(length=64), nullable=True),
        sa.Column("f_calc_id", sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(
            ["engine_run_id"],
            ["engine_run.id"],
            name=op.f("fk_risk_score_engine_run_id_engine_run"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_risk_score")),
        sa.UniqueConstraint(
            "engine_run_id", "gstin", "fy", name=op.f("uq_risk_score_engine_run_id_gstin_fy")
        ),
    )
    with op.batch_alter_table("risk_score", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_risk_score_engine_run_id"), ["engine_run_id"], unique=False
        )
        batch_op.create_index(batch_op.f("ix_risk_score_f_band"), ["f_band"], unique=False)
        batch_op.create_index(batch_op.f("ix_risk_score_gstin"), ["gstin"], unique=False)
        batch_op.create_index(batch_op.f("ix_risk_score_p_band"), ["p_band"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("risk_score", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_risk_score_p_band"))
        batch_op.drop_index(batch_op.f("ix_risk_score_gstin"))
        batch_op.drop_index(batch_op.f("ix_risk_score_f_band"))
        batch_op.drop_index(batch_op.f("ix_risk_score_engine_run_id"))

    op.drop_table("risk_score")
    with op.batch_alter_table("return_3b", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_return_3b_snapshot_id"))
        batch_op.drop_index(batch_op.f("ix_return_3b_gstin"))

    op.drop_table("return_3b")
    with op.batch_alter_table("param_result", schema=None) as batch_op:
        batch_op.drop_index("ix_param_result_incidence")
        batch_op.drop_index(batch_op.f("ix_param_result_gstin"))
        batch_op.drop_index(batch_op.f("ix_param_result_engine_run_id"))
        batch_op.drop_index(batch_op.f("ix_param_result_calc_id"))

    op.drop_table("param_result")
    with op.batch_alter_table("outward_line", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_outward_line_snapshot_id"))
        batch_op.drop_index(batch_op.f("ix_outward_line_section"))
        batch_op.drop_index(batch_op.f("ix_outward_line_hsn"))
        batch_op.drop_index("ix_outward_line_gstin_period")
        batch_op.drop_index("ix_outward_line_doc")
        batch_op.drop_index("ix_outward_line_counterparty")

    op.drop_table("outward_line")
    with op.batch_alter_table("ledger_movement", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_ledger_movement_snapshot_id"))
        batch_op.drop_index("ix_ledger_movement_gstin_ason")

    op.drop_table("ledger_movement")
    with op.batch_alter_table("inward_line", schema=None) as batch_op:
        batch_op.drop_index("ix_inward_line_supplier")
        batch_op.drop_index(batch_op.f("ix_inward_line_snapshot_id"))
        batch_op.drop_index(batch_op.f("ix_inward_line_section"))
        batch_op.drop_index(batch_op.f("ix_inward_line_ims_action"))
        batch_op.drop_index("ix_inward_line_gstin_period")
        batch_op.drop_index("ix_inward_line_availability")

    op.drop_table("inward_line")
    with op.batch_alter_table("finding", schema=None) as batch_op:
        batch_op.drop_index("ix_finding_triage")
        batch_op.drop_index("ix_finding_run_gstin")
        batch_op.drop_index("ix_finding_rule")
        batch_op.drop_index(batch_op.f("ix_finding_engine_run_id"))
        batch_op.drop_index(batch_op.f("ix_finding_calc_id"))

    op.drop_table("finding")
    with op.batch_alter_table("filing_status", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_filing_status_gstin"))
        batch_op.drop_index("ix_filing_status_barred_on")

    op.drop_table("filing_status")
    with op.batch_alter_table("eway_bill", schema=None) as batch_op:
        batch_op.drop_index("ix_eway_bill_vehicle")
        batch_op.drop_index(batch_op.f("ix_eway_bill_snapshot_id"))
        batch_op.drop_index("ix_eway_bill_gstin_date")
        batch_op.drop_index("ix_eway_bill_doc")

    op.drop_table("eway_bill")
    with op.batch_alter_table("einvoice", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_einvoice_snapshot_id"))
        batch_op.drop_index(batch_op.f("ix_einvoice_irn"))
        batch_op.drop_index("ix_einvoice_gstin_period")
        batch_op.drop_index("ix_einvoice_doc")

    op.drop_table("einvoice")
    with op.batch_alter_table("upload_sheet", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_upload_sheet_upload_id"))

    op.drop_table("upload_sheet")
    with op.batch_alter_table("quarantine_row", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_quarantine_row_upload_id"))
        batch_op.drop_index(batch_op.f("ix_quarantine_row_reason_code"))

    op.drop_table("quarantine_row")
    with op.batch_alter_table("provenance", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_provenance_upload_id"))

    op.drop_table("provenance")
    with op.batch_alter_table("notice", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_notice_case_id"))

    op.drop_table("notice")
    with op.batch_alter_table("engine_run", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_engine_run_snapshot_id"))

    op.drop_table("engine_run")
    with op.batch_alter_table("upload", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_upload_sha256"))

    op.drop_table("upload")
    with op.batch_alter_table("taxpayer", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_taxpayer_state_code"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_sector_code"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_range"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_pan"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_officer_id"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_mobile_hash"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_email_hash"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_division"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_commissionerate"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_bank_hash"))
        batch_op.drop_index(batch_op.f("ix_taxpayer_address_norm_hash"))

    op.drop_table("taxpayer")
    with op.batch_alter_table("snapshot", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_snapshot_content_hash"))

    op.drop_table("snapshot")
    with op.batch_alter_table("rule_parameter", schema=None) as batch_op:
        batch_op.drop_index("ix_rule_parameter_lookup")

    op.drop_table("rule_parameter")
    with op.batch_alter_table("case", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_case_officer_id"))
        batch_op.drop_index(batch_op.f("ix_case_gstin"))
        batch_op.drop_index(batch_op.f("ix_case_days_to_limitation"))

    op.drop_table("case")
    with op.batch_alter_table("audit_log", schema=None) as batch_op:
        batch_op.drop_index("ix_audit_log_entity")
        batch_op.drop_index(batch_op.f("ix_audit_log_at"))
        batch_op.drop_index(batch_op.f("ix_audit_log_actor"))

    op.drop_table("audit_log")
