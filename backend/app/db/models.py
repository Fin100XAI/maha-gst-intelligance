"""The canonical data model -- every table in docs/02_PLATFORM_SPEC.md section 4.

Two structural commitments are load-bearing:

* **Four columns per tax field, never a JSON blob.**  Every rule compares
  head-wise (Law 3), and every index the engine needs sits on one of the four.
* **Money is NUMERIC(18,2).**  Gate G2 fails the build if that ever slips.

Tables are append-only in spirit: ingestion writes rows against an immutable
``snapshot``, and the engine writes findings against an immutable
``engine_run``.  Nothing recomputes in place, because replay is what makes a
figure defensible.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import (
    FY,
    GSTIN,
    HASH,
    JSON_DOC,
    MONEY,
    PERIOD,
    RATIO,
    TIMESTAMP,
    Base,
    utcnow,
)

_ZERO = Decimal("0.00")


def money_col(*, nullable: bool = False) -> Any:
    """A rupee column: NUMERIC(18,2), defaulting to 0.00 rather than NULL."""
    if nullable:
        return mapped_column(MONEY, nullable=True)
    return mapped_column(MONEY, nullable=False, default=_ZERO, server_default="0")


def ratio_col(*, nullable: bool = True) -> Any:
    """A ratio or metric column: NUMERIC(28,10)."""
    return mapped_column(RATIO, nullable=nullable)


# ===========================================================================
# Ingestion: uploads, provenance, snapshots
# ===========================================================================


class Upload(Base):
    """One uploaded workbook, stored raw and immutable in object storage."""

    __tablename__ = "upload"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    sha256: Mapped[str] = mapped_column(HASH, nullable=False, index=True)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(255))
    uploaded_by: Mapped[str] = mapped_column(String(128), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="RECEIVED")
    virus_scan: Mapped[str | None] = mapped_column(String(32))
    sheet_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    #: Law 5 on screen: rows_in = parsed + quarantined + duplicates.
    rows_in: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_parsed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_quarantined: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_duplicate: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class UploadSheet(Base):
    """One sheet inside a workbook, with how it was classified and mapped."""

    __tablename__ = "upload_sheet"
    __table_args__ = (UniqueConstraint("upload_id", "sheet_name"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    upload_id: Mapped[str] = mapped_column(ForeignKey("upload.id"), nullable=False, index=True)
    sheet_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sheet_index: Mapped[int] = mapped_column(Integer, nullable=False)
    detected_type: Mapped[str | None] = mapped_column(String(32))
    confidence: Mapped[Decimal | None] = ratio_col()
    header_row_index: Mapped[int | None] = mapped_column(Integer)
    #: The confirmed column mapping, source header -> canonical field.
    mapping: Mapped[dict[str, Any] | None] = mapped_column(JSON_DOC)
    mapping_source: Mapped[str | None] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    rows_in: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_parsed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_quarantined: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_duplicate: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class QuarantineRow(Base):
    """A row that could not be canonicalised, with its reason and original cells.

    Law 5: never silently dropped.  Replayable after a mapping fix without a
    re-upload, which is why the original cells are kept verbatim.
    """

    __tablename__ = "quarantine_row"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    upload_id: Mapped[str] = mapped_column(ForeignKey("upload.id"), nullable=False, index=True)
    sheet_name: Mapped[str] = mapped_column(String(255), nullable=False)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    reason_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    field: Mapped[str | None] = mapped_column(String(128))
    original_cells: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    replayed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)


class Provenance(Base):
    """file -> sheet -> row -> original cell values, for one canonical row.

    Law 2: this is what the provenance drawer resolves to.  Every canonical row
    points at exactly one of these.
    """

    __tablename__ = "provenance"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    upload_id: Mapped[str] = mapped_column(ForeignKey("upload.id"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(512), nullable=False)
    file_sha256: Mapped[str] = mapped_column(HASH, nullable=False)
    sheet_name: Mapped[str] = mapped_column(String(255), nullable=False)
    header_row_index: Mapped[int | None] = mapped_column(Integer)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    #: The cells exactly as they appeared, before coercion.
    original_cells: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)


class Snapshot(Base):
    """An immutable, content-hashed dataset version.  The engine runs against one."""

    __tablename__ = "snapshot"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    content_hash: Mapped[str] = mapped_column(HASH, nullable=False, index=True)
    fy: Mapped[str | None] = mapped_column(FY)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)
    created_by: Mapped[str] = mapped_column(String(128), nullable=False)
    upload_ids: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    gstins: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    row_counts: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)
    frozen: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


# ===========================================================================
# Registry and filing
# ===========================================================================


class Taxpayer(Base):
    __tablename__ = "taxpayer"

    gstin: Mapped[str] = mapped_column(GSTIN, primary_key=True)
    pan: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    legal_name: Mapped[str] = mapped_column(String(512), nullable=False)
    trade_name: Mapped[str | None] = mapped_column(String(512))
    state_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    registration_type: Mapped[str | None] = mapped_column(String(64))
    registration_date: Mapped[date | None] = mapped_column(Date)
    cancellation_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    aato: Mapped[Decimal | None] = money_col(nullable=True)
    qrmp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    einvoice_applicable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sector_code: Mapped[str | None] = mapped_column(String(32), index=True)
    commissionerate: Mapped[str | None] = mapped_column(String(128), index=True)
    division: Mapped[str | None] = mapped_column(String(128), index=True)
    range_office: Mapped[str | None] = mapped_column("range", String(128), index=True)
    officer_id: Mapped[str | None] = mapped_column(String(64), index=True)
    #: Hashed so REG-03/REG-04 can match on shared premises, contacts and banks
    #: without holding the identifiers in the clear (section 10 field encryption).
    address_norm_hash: Mapped[str | None] = mapped_column(HASH, index=True)
    bank_hash: Mapped[str | None] = mapped_column(HASH, index=True)
    mobile_hash: Mapped[str | None] = mapped_column(HASH, index=True)
    email_hash: Mapped[str | None] = mapped_column(HASH, index=True)


class FilingStatus(Base):
    __tablename__ = "filing_status"
    __table_args__ = (
        UniqueConstraint("gstin", "return_type", "period"),
        Index("ix_filing_status_barred_on", "barred_on"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    return_type: Mapped[str] = mapped_column(String(16), nullable=False)
    period: Mapped[str] = mapped_column(PERIOD, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    filing_date: Mapped[date | None] = mapped_column(Date)
    arn: Mapped[str | None] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    days_late: Mapped[int | None] = mapped_column(Integer)
    barred_on: Mapped[date | None] = mapped_column(Date)
    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


# ===========================================================================
# Transaction lines
# ===========================================================================


class OutwardLine(Base):
    """One GSTR-1 document line, head-wise."""

    __tablename__ = "outward_line"
    __table_args__ = (
        Index("ix_outward_line_gstin_period", "gstin", "period"),
        Index("ix_outward_line_doc", "gstin", "doc_no", "doc_date"),
        Index("ix_outward_line_counterparty", "counterparty_gstin", "period"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False)
    period: Mapped[str] = mapped_column(PERIOD, nullable=False)
    section: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    doc_type: Mapped[str] = mapped_column(String(24), nullable=False)
    doc_no: Mapped[str | None] = mapped_column(String(64))
    doc_date: Mapped[date | None] = mapped_column(Date)
    counterparty_gstin: Mapped[str | None] = mapped_column(GSTIN)
    pos: Mapped[str | None] = mapped_column(String(2))
    rate: Mapped[Decimal | None] = ratio_col()
    taxable_value: Mapped[Decimal] = money_col()
    igst: Mapped[Decimal] = money_col()
    cgst: Mapped[Decimal] = money_col()
    sgst: Mapped[Decimal] = money_col()
    cess: Mapped[Decimal] = money_col()
    reverse_charge: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    hsn: Mapped[str | None] = mapped_column(String(8), index=True)
    uqc: Mapped[str | None] = mapped_column(String(16))
    quantity: Mapped[Decimal | None] = ratio_col()
    ecom_gstin: Mapped[str | None] = mapped_column(GSTIN)
    #: Amendments fold at the identity layer, never at the row layer.
    is_amendment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    amends_doc_no: Mapped[str | None] = mapped_column(String(64))
    amends_doc_date: Mapped[date | None] = mapped_column(Date)
    irn: Mapped[str | None] = mapped_column(String(64))
    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


class InwardLine(Base):
    """One GSTR-2B (or legacy 2A) line, head-wise, with its IMS action."""

    __tablename__ = "inward_line"
    __table_args__ = (
        Index("ix_inward_line_gstin_period", "gstin", "period"),
        Index("ix_inward_line_supplier", "supplier_gstin", "supplier_return_period"),
        Index("ix_inward_line_availability", "gstin", "period", "itc_available"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False)
    period: Mapped[str] = mapped_column(PERIOD, nullable=False)
    section: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    doc_type: Mapped[str] = mapped_column(String(24), nullable=False, default="INVOICE")
    doc_no: Mapped[str | None] = mapped_column(String(64))
    doc_date: Mapped[date | None] = mapped_column(Date)
    supplier_gstin: Mapped[str | None] = mapped_column(GSTIN)
    pos: Mapped[str | None] = mapped_column(String(2))
    rate: Mapped[Decimal | None] = ratio_col()
    taxable_value: Mapped[Decimal] = money_col()
    igst: Mapped[Decimal] = money_col()
    cgst: Mapped[Decimal] = money_col()
    sgst: Mapped[Decimal] = money_col()
    cess: Mapped[Decimal] = money_col()
    itc_available: Mapped[bool | None] = mapped_column(Boolean)
    itc_unavailable_reason: Mapped[str | None] = mapped_column(String(128))
    supplier_filing_date: Mapped[date | None] = mapped_column(Date)
    supplier_return_period: Mapped[str | None] = mapped_column(PERIOD)
    #: ACCEPTED | REJECTED | PENDING | NO_ACTION -- evidence, not metadata.
    ims_action: Mapped[str | None] = mapped_column(String(16), index=True)
    ims_action_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    hsn: Mapped[str | None] = mapped_column(String(8))
    source_form: Mapped[str] = mapped_column(String(8), nullable=False, default="GSTR2B")
    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


class Return3B(Base):
    """GSTR-3B as filed.  Every tax field is four columns, one per head.

    Column names follow the portal's own table numbering so that a formula in a
    notice can cite ``3B Table 4(A)(5)`` and an officer can find the column.
    """

    __tablename__ = "return_3b"
    __table_args__ = (UniqueConstraint("snapshot_id", "gstin", "period"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    period: Mapped[str] = mapped_column(PERIOD, nullable=False)
    filing_date: Mapped[date | None] = mapped_column(Date)
    arn: Mapped[str | None] = mapped_column(String(32))

    # -- Table 3.1 outward supplies, and 3.1.1 supplies under s.9(5) ---------
    # (a) taxable outward other than zero-rated, nil-rated, exempt
    t31a_taxable: Mapped[Decimal] = money_col()
    t31a_igst: Mapped[Decimal] = money_col()
    t31a_cgst: Mapped[Decimal] = money_col()
    t31a_sgst: Mapped[Decimal] = money_col()
    t31a_cess: Mapped[Decimal] = money_col()
    # (b) outward zero-rated
    t31b_taxable: Mapped[Decimal] = money_col()
    t31b_igst: Mapped[Decimal] = money_col()
    t31b_cgst: Mapped[Decimal] = money_col()
    t31b_sgst: Mapped[Decimal] = money_col()
    t31b_cess: Mapped[Decimal] = money_col()
    # (c) other outward: nil-rated and exempt
    t31c_taxable: Mapped[Decimal] = money_col()
    t31c_igst: Mapped[Decimal] = money_col()
    t31c_cgst: Mapped[Decimal] = money_col()
    t31c_sgst: Mapped[Decimal] = money_col()
    t31c_cess: Mapped[Decimal] = money_col()
    # (d) inward liable to reverse charge -- a liability, NOT an outward supply.
    # OUT-01 must exclude this from the 3B side; including it is the commonest
    # false positive on Rule 88C.
    t31d_taxable: Mapped[Decimal] = money_col()
    t31d_igst: Mapped[Decimal] = money_col()
    t31d_cgst: Mapped[Decimal] = money_col()
    t31d_sgst: Mapped[Decimal] = money_col()
    t31d_cess: Mapped[Decimal] = money_col()
    # (e) non-GST outward
    t31e_taxable: Mapped[Decimal] = money_col()
    t31e_igst: Mapped[Decimal] = money_col()
    t31e_cgst: Mapped[Decimal] = money_col()
    t31e_sgst: Mapped[Decimal] = money_col()
    t31e_cess: Mapped[Decimal] = money_col()
    # 3.1.1(i) supplies u/s 9(5) on which the ECO pays tax
    t311i_taxable: Mapped[Decimal] = money_col()
    t311i_igst: Mapped[Decimal] = money_col()
    t311i_cgst: Mapped[Decimal] = money_col()
    t311i_sgst: Mapped[Decimal] = money_col()
    t311i_cess: Mapped[Decimal] = money_col()
    # 3.1.1(ii) supplies u/s 9(5) made by the registered person through an ECO
    t311ii_taxable: Mapped[Decimal] = money_col()
    t311ii_igst: Mapped[Decimal] = money_col()
    t311ii_cgst: Mapped[Decimal] = money_col()
    t311ii_sgst: Mapped[Decimal] = money_col()
    t311ii_cess: Mapped[Decimal] = money_col()
    # 3.2 inter-State supplies to unregistered, composition and UIN holders
    t32_taxable: Mapped[Decimal] = money_col()
    t32_igst: Mapped[Decimal] = money_col()
    t32_cgst: Mapped[Decimal] = money_col()
    t32_sgst: Mapped[Decimal] = money_col()
    t32_cess: Mapped[Decimal] = money_col()

    # -- Table 4(A) ITC available -------------------------------------------
    # (1) import of goods
    t4a1_igst: Mapped[Decimal] = money_col()
    t4a1_cgst: Mapped[Decimal] = money_col()
    t4a1_sgst: Mapped[Decimal] = money_col()
    t4a1_cess: Mapped[Decimal] = money_col()
    # (2) import of services
    t4a2_igst: Mapped[Decimal] = money_col()
    t4a2_cgst: Mapped[Decimal] = money_col()
    t4a2_sgst: Mapped[Decimal] = money_col()
    t4a2_cess: Mapped[Decimal] = money_col()
    # (3) inward supplies liable to reverse charge, other than 1 and 2
    t4a3_igst: Mapped[Decimal] = money_col()
    t4a3_cgst: Mapped[Decimal] = money_col()
    t4a3_sgst: Mapped[Decimal] = money_col()
    t4a3_cess: Mapped[Decimal] = money_col()
    # (4) inward supplies from ISD
    t4a4_igst: Mapped[Decimal] = money_col()
    t4a4_cgst: Mapped[Decimal] = money_col()
    t4a4_sgst: Mapped[Decimal] = money_col()
    t4a4_cess: Mapped[Decimal] = money_col()
    # (5) all other ITC -- the ONLY bucket comparable to GSTR-2B (Rule 88D)
    t4a5_igst: Mapped[Decimal] = money_col()
    t4a5_cgst: Mapped[Decimal] = money_col()
    t4a5_sgst: Mapped[Decimal] = money_col()
    t4a5_cess: Mapped[Decimal] = money_col()

    # -- Table 4(B) ITC reversed --------------------------------------------
    # (1) as per Rules 38, 42 and 43 and s.17(5)
    t4b1_igst: Mapped[Decimal] = money_col()
    t4b1_cgst: Mapped[Decimal] = money_col()
    t4b1_sgst: Mapped[Decimal] = money_col()
    t4b1_cess: Mapped[Decimal] = money_col()
    # (2) others
    t4b2_igst: Mapped[Decimal] = money_col()
    t4b2_cgst: Mapped[Decimal] = money_col()
    t4b2_sgst: Mapped[Decimal] = money_col()
    t4b2_cess: Mapped[Decimal] = money_col()

    # -- Table 4(C) net ITC available: must equal 4(A) - 4(B) exactly (R3) ---
    t4c_igst: Mapped[Decimal] = money_col()
    t4c_cgst: Mapped[Decimal] = money_col()
    t4c_sgst: Mapped[Decimal] = money_col()
    t4c_cess: Mapped[Decimal] = money_col()

    # -- Table 4(D) ineligible ITC ------------------------------------------
    t4d1_igst: Mapped[Decimal] = money_col()
    t4d1_cgst: Mapped[Decimal] = money_col()
    t4d1_sgst: Mapped[Decimal] = money_col()
    t4d1_cess: Mapped[Decimal] = money_col()
    t4d2_igst: Mapped[Decimal] = money_col()
    t4d2_cgst: Mapped[Decimal] = money_col()
    t4d2_sgst: Mapped[Decimal] = money_col()
    t4d2_cess: Mapped[Decimal] = money_col()

    # -- Table 5 exempt, nil-rated and non-GST inward -----------------------
    t5_inter: Mapped[Decimal] = money_col()
    t5_intra: Mapped[Decimal] = money_col()

    # -- Table 5.1 interest and late fee ------------------------------------
    interest_igst: Mapped[Decimal] = money_col()
    interest_cgst: Mapped[Decimal] = money_col()
    interest_sgst: Mapped[Decimal] = money_col()
    interest_cess: Mapped[Decimal] = money_col()
    late_fee_igst: Mapped[Decimal] = money_col()
    late_fee_cgst: Mapped[Decimal] = money_col()
    late_fee_sgst: Mapped[Decimal] = money_col()
    late_fee_cess: Mapped[Decimal] = money_col()

    # -- Table 6.1 payment of tax -------------------------------------------
    #: col 2: total tax payable
    payable_igst: Mapped[Decimal] = money_col()
    payable_cgst: Mapped[Decimal] = money_col()
    payable_sgst: Mapped[Decimal] = money_col()
    payable_cess: Mapped[Decimal] = money_col()
    #: cols 3-6: paid through the credit ledger
    paid_itc_igst: Mapped[Decimal] = money_col()
    paid_itc_cgst: Mapped[Decimal] = money_col()
    paid_itc_sgst: Mapped[Decimal] = money_col()
    paid_itc_cess: Mapped[Decimal] = money_col()
    #: col 8: paid in cash -- the numerator of the department's most watched ratio
    paid_cash_igst: Mapped[Decimal] = money_col()
    paid_cash_cgst: Mapped[Decimal] = money_col()
    paid_cash_sgst: Mapped[Decimal] = money_col()
    paid_cash_cess: Mapped[Decimal] = money_col()

    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


class LedgerMovement(Base):
    """Ledger balances at DAILY grain.

    PAY-03 charges interest from the date the credit balance first fell below
    the wrongly availed amount.  A period-end snapshot cannot answer that, and
    an interest computation that cannot answer it will be challenged.
    """

    __tablename__ = "ledger_movement"
    __table_args__ = (
        UniqueConstraint("snapshot_id", "gstin", "as_on", "ledger", "head"),
        Index("ix_ledger_movement_gstin_ason", "gstin", "as_on"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False)
    as_on: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[str | None] = mapped_column(PERIOD)
    ledger: Mapped[str] = mapped_column(String(16), nullable=False)
    head: Mapped[str] = mapped_column(String(8), nullable=False)
    opening: Mapped[Decimal] = money_col()
    credited: Mapped[Decimal] = money_col()
    debited: Mapped[Decimal] = money_col()
    closing: Mapped[Decimal] = money_col()
    reference: Mapped[str | None] = mapped_column(String(64))
    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


class EWayBill(Base):
    __tablename__ = "eway_bill"
    __table_args__ = (
        Index("ix_eway_bill_gstin_date", "gstin", "ewb_date"),
        Index("ix_eway_bill_vehicle", "vehicle_no", "ewb_date"),
        Index("ix_eway_bill_doc", "gstin", "doc_no", "doc_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False)
    period: Mapped[str | None] = mapped_column(PERIOD)
    ewb_no: Mapped[str] = mapped_column(String(16), nullable=False)
    ewb_date: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    doc_no: Mapped[str | None] = mapped_column(String(64))
    doc_date: Mapped[date | None] = mapped_column(Date)
    doc_type: Mapped[str | None] = mapped_column(String(24))
    from_gstin: Mapped[str | None] = mapped_column(GSTIN)
    to_gstin: Mapped[str | None] = mapped_column(GSTIN)
    from_state: Mapped[str | None] = mapped_column(String(2))
    to_state: Mapped[str | None] = mapped_column(String(2))
    from_pin: Mapped[str | None] = mapped_column(String(6))
    to_pin: Mapped[str | None] = mapped_column(String(6))
    hsn: Mapped[str | None] = mapped_column(String(8))
    #: EWB value INCLUDES tax -- R4 compares it against GSTR-1 within a 2% band.
    value: Mapped[Decimal] = money_col()
    distance_km: Mapped[int | None] = mapped_column(Integer)
    vehicle_no: Mapped[str | None] = mapped_column(String(20))
    transport_mode: Mapped[str | None] = mapped_column(String(16))
    part_b_filled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    valid_upto: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    delivered_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE")
    cancelled_on: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


class EInvoice(Base):
    __tablename__ = "einvoice"
    __table_args__ = (
        Index("ix_einvoice_gstin_period", "gstin", "period"),
        Index("ix_einvoice_doc", "gstin", "doc_no", "doc_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False)
    period: Mapped[str | None] = mapped_column(PERIOD)
    irn: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    ack_no: Mapped[str | None] = mapped_column(String(32))
    ack_date: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    doc_no: Mapped[str | None] = mapped_column(String(64))
    doc_date: Mapped[date | None] = mapped_column(Date)
    doc_type: Mapped[str | None] = mapped_column(String(24))
    counterparty_gstin: Mapped[str | None] = mapped_column(GSTIN)
    taxable_value: Mapped[Decimal] = money_col()
    igst: Mapped[Decimal] = money_col()
    cgst: Mapped[Decimal] = money_col()
    sgst: Mapped[Decimal] = money_col()
    cess: Mapped[Decimal] = money_col()
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ACTIVE")
    cancelled_on: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    prov_id: Mapped[str | None] = mapped_column(ForeignKey("provenance.id"))


# ===========================================================================
# Engine: parameters, runs, results
# ===========================================================================


class RuleParameter(Base):
    """Effective-dated governance of every threshold, statutory or policy.

    The engine resolves a parameter **as at the tax period under scrutiny**,
    never as at today: scrutinising FY 2019-20 applies FY 2019-20 thresholds.
    Changing a parameter never rewrites history.

    ``value`` is stored as text so that a Decimal, a date and a form number all
    round-trip without a lossy cast; ``value_type`` says how to read it.
    """

    __tablename__ = "rule_parameter"
    __table_args__ = (
        Index("ix_rule_parameter_lookup", "rule_or_param_id", "key", "effective_from"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    rule_or_param_id: Mapped[str] = mapped_column(String(32), nullable=False)
    key: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    value_type: Mapped[str] = mapped_column(String(16), nullable=False, default="decimal")
    unit: Mapped[str | None] = mapped_column(String(32))
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date)
    notification_ref: Mapped[str | None] = mapped_column(String(255))
    source_note: Mapped[str | None] = mapped_column(Text)
    approved_by: Mapped[str | None] = mapped_column(String(128))
    approved_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    supersedes_id: Mapped[str | None] = mapped_column(ForeignKey("rule_parameter.id"))
    #: True until the law officer signs the row.  An unapproved parameter may
    #: not populate a notice.
    provisional: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class EngineRun(Base):
    __tablename__ = "engine_run"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("snapshot.id"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    #: The injected evaluation date.  Rules never call date.today().
    as_of: Mapped[date] = mapped_column(Date, nullable=False)
    fy: Mapped[str | None] = mapped_column(FY)
    engine_version: Mapped[str] = mapped_column(String(32), nullable=False)
    params_version: Mapped[str] = mapped_column(String(32), nullable=False)
    triggered_by: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="RUNNING")
    gstin_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    finding_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)


class ParamResult(Base):
    """One of the 34 audit risk parameters, evaluated for one taxpayer and FY."""

    __tablename__ = "param_result"
    __table_args__ = (
        UniqueConstraint("engine_run_id", "gstin", "fy", "param_id"),
        Index("ix_param_result_incidence", "engine_run_id", "param_id", "flag"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    fy: Mapped[str] = mapped_column(FY, nullable=False)
    param_id: Mapped[str] = mapped_column(String(8), nullable=False)
    value: Mapped[Decimal | None] = ratio_col()
    #: 0-4.  NULL when status is NOT_EVALUATED -- never defaulted to 0, because
    #: an unevaluable parameter shown as Flag 0 is what makes a risk score a lie.
    flag: Mapped[int | None] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    banding: Mapped[str | None] = mapped_column(String(16))
    direction: Mapped[str | None] = mapped_column(String(16))
    weight: Mapped[Decimal | None] = ratio_col()
    cohort_p50: Mapped[Decimal | None] = ratio_col()
    cohort_p75: Mapped[Decimal | None] = ratio_col()
    cohort_p90: Mapped[Decimal | None] = ratio_col()
    cohort_p97: Mapped[Decimal | None] = ratio_col()
    cohort_n: Mapped[int | None] = mapped_column(Integer)
    calc_id: Mapped[str] = mapped_column(HASH, nullable=False, index=True)
    #: Required whenever status is NOT_EVALUATED: names the exact missing dataset.
    missing_inputs: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)


class Finding(Base):
    """One rule outcome for one taxpayer and period, head-wise throughout."""

    __tablename__ = "finding"
    __table_args__ = (
        Index("ix_finding_run_gstin", "engine_run_id", "gstin"),
        Index("ix_finding_rule", "engine_run_id", "rule_id", "status"),
        Index("ix_finding_triage", "engine_run_id", "severity", "confidence"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False)
    period: Mapped[str | None] = mapped_column(PERIOD)
    fy: Mapped[str | None] = mapped_column(FY)
    rule_id: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    confidence: Mapped[str] = mapped_column(String(16), nullable=False)
    dimension: Mapped[str] = mapped_column(String(16), nullable=False)

    observed_igst: Mapped[Decimal] = money_col()
    observed_cgst: Mapped[Decimal] = money_col()
    observed_sgst: Mapped[Decimal] = money_col()
    observed_cess: Mapped[Decimal] = money_col()
    expected_igst: Mapped[Decimal] = money_col()
    expected_cgst: Mapped[Decimal] = money_col()
    expected_sgst: Mapped[Decimal] = money_col()
    expected_cess: Mapped[Decimal] = money_col()
    delta_igst: Mapped[Decimal] = money_col()
    delta_cgst: Mapped[Decimal] = money_col()
    delta_sgst: Mapped[Decimal] = money_col()
    delta_cess: Mapped[Decimal] = money_col()
    taxable_value_effect: Mapped[Decimal] = money_col()
    interest: Mapped[Decimal] = money_col()
    penalty: Mapped[Decimal] = money_col()

    points: Mapped[Decimal | None] = ratio_col()
    calc_id: Mapped[str] = mapped_column(HASH, nullable=False, index=True)
    #: The formula with its actual values substituted, as shown in the drawer.
    formula_rendered: Mapped[str | None] = mapped_column(Text)
    legal_basis: Mapped[str | None] = mapped_column(String(512))
    evidence_ids: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    #: Required on NOT_EVALUATED -- never "no issue found".
    missing_inputs: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    suggested_form: Mapped[str | None] = mapped_column(String(16))
    #: s.128A amnesty, limitation, an accepted prior reply.  Suppressed findings
    #: stay visible and labelled; they are never deleted.
    suppressed_by: Mapped[str | None] = mapped_column(String(64))
    officer_disposition: Mapped[str | None] = mapped_column(String(24))
    disposition_by: Mapped[str | None] = mapped_column(String(128))
    disposition_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    disposition_note: Mapped[str | None] = mapped_column(Text)


class RiskScore(Base):
    """P-Score and F-Score for one taxpayer and FY.  Stored side by side, never fused."""

    __tablename__ = "risk_score"
    __table_args__ = (UniqueConstraint("engine_run_id", "gstin", "fy"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    fy: Mapped[str] = mapped_column(FY, nullable=False)
    p_score: Mapped[Decimal | None] = ratio_col()
    #: evaluated parameters / 34.  Rendered beside the score at equal weight.
    p_coverage: Mapped[Decimal | None] = ratio_col()
    p_evaluated: Mapped[int | None] = mapped_column(SmallInteger)
    p_band: Mapped[str | None] = mapped_column(String(16), index=True)
    f_score: Mapped[Decimal | None] = ratio_col()
    f_band: Mapped[str | None] = mapped_column(String(16), index=True)
    dimension_scores: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)
    waterfall_json: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)
    p_calc_id: Mapped[str | None] = mapped_column(HASH)
    f_calc_id: Mapped[str | None] = mapped_column(HASH)


class IdentityCheck(Base):
    """One of the eleven reconciliation identities, for one taxpayer and period.

    The 12 x 11 matrix the Reconciliation Workbench renders.  Stored rather
    than recomputed for the same reason findings are: the screen must show
    what the run concluded, not what a later recomputation would conclude
    against data that has since changed.

    ``status`` is recorded, never derived downstream.  Whether an identity
    holds is the engine's judgement -- it knows each identity's tolerance --
    and a screen that re-derived it from the delta would eventually disagree
    with the engine about the same row.
    """

    __tablename__ = "identity_check"
    __table_args__ = (
        UniqueConstraint("engine_run_id", "gstin", "period", "identity_id"),
        Index("ix_identity_check_status", "engine_run_id", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    engine_run_id: Mapped[str] = mapped_column(
        ForeignKey("engine_run.id"), nullable=False, index=True
    )
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    period: Mapped[str | None] = mapped_column(PERIOD)
    fy: Mapped[str | None] = mapped_column(FY)
    identity_id: Mapped[str] = mapped_column(String(8), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    #: HOLDS / BREACHED / NOT_EVALUATED.
    status: Mapped[str] = mapped_column(String(16), nullable=False)

    delta_igst: Mapped[Decimal] = money_col()
    delta_cgst: Mapped[Decimal] = money_col()
    delta_sgst: Mapped[Decimal] = money_col()
    delta_cess: Mapped[Decimal] = money_col()

    #: Required on NOT_EVALUATED -- never "the identity holds".
    missing_inputs: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    consequence: Mapped[str | None] = mapped_column(String(512))
    note: Mapped[str | None] = mapped_column(Text)
    calc_id: Mapped[str] = mapped_column(HASH, nullable=False, index=True)


# ===========================================================================
# Cases and notices
# ===========================================================================


class Case(Base):
    """A scrutiny, audit or demand case, carrying its own limitation clock."""

    __tablename__ = "case"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    fy: Mapped[str] = mapped_column(FY, nullable=False)
    periods: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="IDENTIFIED")
    officer_id: Mapped[str | None] = mapped_column(String(64), index=True)
    finding_ids: Mapped[list[str]] = mapped_column(JSON_DOC, nullable=False, default=list)
    demand_igst: Mapped[Decimal] = money_col()
    demand_cgst: Mapped[Decimal] = money_col()
    demand_sgst: Mapped[Decimal] = money_col()
    demand_cess: Mapped[Decimal] = money_col()
    interest: Mapped[Decimal] = money_col()
    penalty: Mapped[Decimal] = money_col()
    #: s.73 / s.74 to FY 2023-24; s.74A from FY 2024-25.
    section_applied: Mapped[str | None] = mapped_column(String(16))
    scn_deadline: Mapped[date | None] = mapped_column(Date)
    order_deadline: Mapped[date | None] = mapped_column(Date)
    days_to_limitation: Mapped[int | None] = mapped_column(Integer, index=True)
    outcome: Mapped[str | None] = mapped_column(String(32))
    demand_confirmed: Mapped[Decimal] = money_col()
    demand_collected: Mapped[Decimal] = money_col()
    calc_id: Mapped[str | None] = mapped_column(HASH)
    opened_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)
    closed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)


class Notice(Base):
    __tablename__ = "notice"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("case.id"), nullable=False, index=True)
    form: Mapped[str] = mapped_column(String(16), nullable=False)
    din: Mapped[str | None] = mapped_column(String(32), unique=True)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="en")
    #: Numeric slots bind only to finding fields and are locked at the API.
    body_json: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)
    pdf_hash: Mapped[str | None] = mapped_column(HASH)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="DRAFT")
    generated_by: Mapped[str | None] = mapped_column(String(128))
    #: Maker-checker: approver must differ from generator, rejected at the API.
    approved_by: Mapped[str | None] = mapped_column(String(128))
    approved_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    served_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    service_mode: Mapped[str | None] = mapped_column(String(32))
    reply_due: Mapped[date | None] = mapped_column(Date)
    reply_received_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)


# ===========================================================================
# Audit
# ===========================================================================


class AuditLog(Base):
    """Hash-chained, append-only.  Verified from genesis by gate G11.

    The approved notice PDF's hash enters this chain at approval, so the
    department can prove in an appellate forum that the document served is the
    document approved.
    """

    __tablename__ = "audit_log"
    __table_args__ = (Index("ix_audit_log_entity", "entity", "entity_id"),)

    seq: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, index=True)
    actor: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    entity: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64))
    before_hash: Mapped[str | None] = mapped_column(HASH)
    after_hash: Mapped[str | None] = mapped_column(HASH)
    chain_hash: Mapped[str] = mapped_column(HASH, nullable=False)
    ip: Mapped[str | None] = mapped_column(String(45))
    detail: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)


class AgentCall(Base):
    """Every agent invocation, logged whole.

    docs/02 section 9: prompt, completion, tools, tokens, latency, cost, model
    version, officer and case.  The prompt stored here is the *pseudonymised*
    one -- the text that actually went to the model -- so the log is evidence
    of what was disclosed, not a second copy of the taxpayer's identity.

    ``fidelity_ok`` records whether the numeric-fidelity middleware passed the
    completion.  A rejected completion is still logged: an agent that tried to
    invent a figure is exactly what a reviewer wants to see.
    """

    __tablename__ = "agent_call"
    __table_args__ = (Index("ix_agent_call_agent_at", "agent", "at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, index=True)
    agent: Mapped[str] = mapped_column(String(32), nullable=False)
    officer_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    case_id: Mapped[str | None] = mapped_column(String(36), index=True)
    #: The pseudonymous reference the prompt carried, never a GSTIN.
    subject_ref: Mapped[str | None] = mapped_column(String(32))
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    completion: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls: Mapped[list[Any]] = mapped_column(JSON_DOC, nullable=False, default=list)
    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    #: ``None`` where the deployment does not meter cost -- never a guess.
    cost_inr: Mapped[Decimal | None] = money_col(nullable=True)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fidelity_ok: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fidelity_detail: Mapped[dict[str, Any]] = mapped_column(JSON_DOC, nullable=False, default=dict)
    accepted_by: Mapped[str | None] = mapped_column(String(128))
    accepted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP)


class FilingReview(Base):
    """An officer's note against one return for one period.

    The unit an officer actually works is a *filing*: this taxpayer, this
    month, this return. A case is the thing you open once you have decided
    there is something to answer for; a review is what you write while
    deciding, including the times you decide there is nothing.

    Kept apart from the audit chain on purpose. The chain records that an
    officer looked and what they did; this records what they *thought*, which
    is content, is editable in the ordinary sense that a note is, and must
    never be mistaken for a tamper-evident record. Both exist; they answer
    different questions.
    """

    __tablename__ = "filing_review"
    __table_args__ = (Index("ix_filing_review_subject", "gstin", "period"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    gstin: Mapped[str] = mapped_column(GSTIN, nullable=False, index=True)
    period: Mapped[str] = mapped_column(PERIOD, nullable=False)
    #: The run the officer was looking at. A note written against one set of
    #: results should not silently attach itself to a later, different one.
    engine_run_id: Mapped[str | None] = mapped_column(String(36))
    officer_id: Mapped[str] = mapped_column(String(128), nullable=False)
    at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False, default=utcnow)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    #: OPEN | NO_ACTION | WATCH | ESCALATE -- what the officer concluded.
    disposition: Mapped[str] = mapped_column(String(16), nullable=False, default="OPEN")


# The provenance store and the aggregation fact tables live in a sibling
# module; importing it here keeps `app.db.models` the single import that
# registers the whole schema on Base.metadata.
from app.db import facts as _facts  # noqa: E402, F401
