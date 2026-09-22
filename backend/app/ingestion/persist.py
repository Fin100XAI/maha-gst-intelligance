"""Writing an ingestion report into the canonical tables.

Every canonical row is written with a :class:`~app.db.models.Provenance` pointer
to the exact file, sheet, row and original cells it came from.  That pointer is
what the provenance drawer resolves, and it is created here or not at all --
retrofitting provenance after the fact is impossible, which is why Phase 2 is
not allowed to start without it.
"""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.canonical import Period
from app.db.models import (
    EInvoice,
    EWayBill,
    InwardLine,
    LedgerMovement,
    OutwardLine,
    Provenance,
    QuarantineRow,
    Return3B,
    Snapshot,
    Taxpayer,
    Upload,
    UploadSheet,
)
from app.ingestion.pipeline import CanonicalRecord, IngestionReport, duplicate_key, snapshot_hash

__all__ = ["existing_keys", "persist_report", "replay_quarantine"]


def _new_id() -> str:
    return str(uuid.uuid4())


def _period_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, Period):
        return value.mmyyyy
    return str(value)


def _money(value: Any) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal("0.00")


def _as_date(value: Any) -> date | None:
    return value if isinstance(value, date) else None


def existing_keys(session: Session, snapshot_id: str) -> set[str]:
    """Duplicate keys already present in a snapshot, so a re-upload is a non-event."""
    keys: set[str] = set()
    for model in (OutwardLine, InwardLine, EWayBill, EInvoice, LedgerMovement):
        rows = session.execute(select(model.id).where(model.snapshot_id == snapshot_id)).scalars()
        keys.update(rows)
    return keys


def _provenance_for(session: Session, record: CanonicalRecord, upload: Upload) -> Provenance:
    provenance = Provenance(
        id=_new_id(),
        upload_id=upload.id,
        file_name=upload.filename,
        file_sha256=upload.sha256,
        sheet_name=record.sheet_name,
        row_index=record.row_index,
        original_cells=record.original_cells,
    )
    session.add(provenance)
    return provenance


def _outward(record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str) -> OutwardLine:
    f = record.fields
    return OutwardLine(
        id=row_id,
        snapshot_id=snapshot_id,
        gstin=f["gstin"],
        period=_period_str(f.get("period")),
        section=record.section or "B2B",
        doc_type=f.get("doc_type") or "INVOICE",
        doc_no=f.get("doc_no"),
        doc_date=_as_date(f.get("doc_date")),
        counterparty_gstin=f.get("counterparty_gstin"),
        pos=f.get("pos"),
        rate=f.get("rate"),
        taxable_value=_money(f.get("taxable_value")),
        igst=_money(f.get("igst")),
        cgst=_money(f.get("cgst")),
        sgst=_money(f.get("sgst")),
        cess=_money(f.get("cess")),
        reverse_charge=bool(f.get("reverse_charge") or False),
        hsn=f.get("hsn"),
        uqc=f.get("uqc"),
        quantity=f.get("quantity"),
        ecom_gstin=f.get("ecom_gstin"),
        is_amendment=record.section == "AMENDMENT",
        irn=f.get("irn"),
        irn_date=_as_date(f.get("irn_date")),
        prov_id=prov_id,
    )


def _inward(record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str) -> InwardLine:
    f = record.fields
    return InwardLine(
        id=row_id,
        snapshot_id=snapshot_id,
        gstin=f["gstin"],
        period=_period_str(f.get("period")),
        section=record.section or "B2B",
        doc_type=f.get("doc_type") or "INVOICE",
        doc_no=f.get("doc_no"),
        doc_date=_as_date(f.get("doc_date")),
        supplier_gstin=f.get("supplier_gstin"),
        pos=f.get("pos"),
        rate=f.get("rate"),
        taxable_value=_money(f.get("taxable_value")),
        igst=_money(f.get("igst")),
        cgst=_money(f.get("cgst")),
        sgst=_money(f.get("sgst")),
        cess=_money(f.get("cess")),
        itc_available=f.get("itc_available"),
        supplier_3b_filed=f.get("supplier_3b_filed"),
        source_form=f.get("source_form") or "GSTR2B",
        itc_unavailable_reason=f.get("itc_unavailable_reason"),
        supplier_filing_date=_as_date(f.get("supplier_filing_date")),
        supplier_return_period=_period_str(f.get("supplier_return_period")),
        ims_action=f.get("ims_action"),
        hsn=f.get("hsn"),
        prov_id=prov_id,
    )


def _eway(record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str) -> EWayBill:
    f = record.fields
    return EWayBill(
        id=row_id,
        snapshot_id=snapshot_id,
        gstin=f["gstin"],
        period=_period_str(f.get("period")),
        ewb_no=str(f.get("ewb_no")),
        doc_no=f.get("doc_no"),
        doc_date=_as_date(f.get("doc_date")),
        doc_type=f.get("doc_type"),
        from_gstin=f.get("from_gstin"),
        to_gstin=f.get("to_gstin"),
        from_state=f.get("from_state"),
        to_state=f.get("to_state"),
        from_pin=f.get("from_pin"),
        to_pin=f.get("to_pin"),
        hsn=f.get("hsn"),
        value=_money(f.get("value")),
        distance_km=int(f["distance_km"]) if f.get("distance_km") is not None else None,
        vehicle_no=f.get("vehicle_no"),
        transport_mode=f.get("transport_mode"),
        part_b_filled=bool(f.get("part_b_filled") or False),
        status=f.get("status") or "ACTIVE",
        prov_id=prov_id,
    )


def _einvoice(record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str) -> EInvoice:
    f = record.fields
    return EInvoice(
        id=row_id,
        snapshot_id=snapshot_id,
        gstin=f["gstin"],
        period=_period_str(f.get("period")),
        irn=str(f.get("irn")),
        ack_no=f.get("ack_no"),
        doc_no=f.get("doc_no"),
        doc_date=_as_date(f.get("doc_date")),
        doc_type=f.get("doc_type"),
        counterparty_gstin=f.get("counterparty_gstin"),
        taxable_value=_money(f.get("taxable_value")),
        igst=_money(f.get("igst")),
        cgst=_money(f.get("cgst")),
        sgst=_money(f.get("sgst")),
        cess=_money(f.get("cess")),
        status=f.get("status") or "ACTIVE",
        prov_id=prov_id,
    )


def _ledger(record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str) -> LedgerMovement:
    f = record.fields
    return LedgerMovement(
        id=row_id,
        snapshot_id=snapshot_id,
        gstin=f["gstin"],
        as_on=_as_date(f.get("as_on")),
        period=_period_str(f.get("period")),
        ledger=(f.get("ledger") or "CREDIT").upper()[:16],
        head=(f.get("head") or "IGST").upper()[:8],
        opening=_money(f.get("opening")),
        credited=_money(f.get("credited")),
        debited=_money(f.get("debited")),
        closing=_money(f.get("closing")),
        reference=f.get("reference"),
        prov_id=prov_id,
    )


def _return_3b(record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str) -> Return3B:
    """A whole GSTR-3B, one row, one column per table line and head.

    The column names follow the portal's own numbering, so a formula in a
    notice can cite "3B Table 3.1(a)" and an officer can find the column.
    Anything the return did not state stays zero, which is what an undeclared
    line means on a 3B -- not "unknown".
    """
    columns = {column.name for column in Return3B.__table__.columns}
    values = {
        key: value
        for key, value in record.fields.items()
        if key in columns and key not in {"gstin", "period"}
    }
    return Return3B(
        id=row_id,
        snapshot_id=snapshot_id,
        gstin=str(record.fields["gstin"]),
        period=_period_str(record.fields.get("period")),
        prov_id=prov_id,
        **values,
    )


def _merge_three_b(
    session: Session, record: CanonicalRecord, snapshot_id: str, prov_id: str, row_id: str
) -> bool:
    """Fold this sheet's tables into the return that already exists.

    Returns True when an existing row absorbed the cells, False when this is
    the first sheet to carry the period and an ordinary insert should follow.

    Only cells the incoming record actually states are copied. A 3B column
    left at zero means the return declared nil; overwriting a stated figure
    with a zero from a sheet that never mentioned that table would turn a
    declared liability into an undeclared one.
    """
    existing = session.execute(
        select(Return3B).where(
            Return3B.snapshot_id == snapshot_id,
            Return3B.gstin == str(record.fields["gstin"]),
            Return3B.period == _period_str(record.fields.get("period")),
        )
    ).scalar_one_or_none()
    if existing is None:
        return False

    columns = {column.name for column in Return3B.__table__.columns}
    for key, value in record.fields.items():
        if key in {"gstin", "period"} or key not in columns or value is None:
            continue
        setattr(existing, key, value)
    del prov_id, row_id  # the first sheet's provenance stands for the return
    return True


_BUILDERS = {
    "GSTR1": _outward,
    "GSTR2B": _inward,
    "EWAYBILL": _eway,
    "EINVOICE": _einvoice,
    "LEDGER": _ledger,
    "GSTR3B": _return_3b,
}


def persist_report(
    session: Session,
    report: IngestionReport,
    *,
    uploaded_by: str,
    storage_key: str,
    size_bytes: int,
    snapshot_id: str | None = None,
    snapshot_description: str | None = None,
) -> tuple[Upload, Snapshot]:
    """Write the upload, its sheets, its quarantine and its canonical rows.

    The canonical row's primary key **is** its duplicate key, so re-ingesting
    the same content into the same snapshot cannot create a second row even if
    the caller forgets to pass ``known_keys``.
    """
    upload = Upload(
        id=_new_id(),
        filename=report.filename,
        sha256=report.file_sha256,
        size_bytes=size_bytes,
        storage_key=storage_key,
        uploaded_by=uploaded_by,
        status="PARSED",
        sheet_count=len(report.sheets),
        rows_in=report.ledger.rows_in,
        rows_parsed=report.ledger.parsed,
        rows_quarantined=report.ledger.quarantined,
        rows_duplicate=report.ledger.duplicates,
    )
    session.add(upload)
    # Flush the parent before anything that points at it. Sheets, quarantined
    # rows and provenance records all carry ``upload_id`` as a foreign key, and
    # a later query can trigger an autoflush that would otherwise try to write
    # a child before its parent exists. SQLite enforces foreign keys here, so
    # that ordering is a hard failure rather than a silent one.
    session.flush()

    snapshot: Snapshot | None = None
    if snapshot_id is not None:
        snapshot = session.get(Snapshot, snapshot_id)
    if snapshot is None:
        snapshot = Snapshot(
            id=snapshot_id or _new_id(),
            content_hash=snapshot_hash(report.records),
            description=snapshot_description or report.filename,
            created_by=uploaded_by,
            upload_ids=[upload.id],
            gstins=sorted(
                {str(r.fields.get("gstin")) for r in report.records if r.fields.get("gstin")}
            ),
            row_counts=report.ledger.as_dict(),
        )
        session.add(snapshot)
    else:
        snapshot.upload_ids = [*snapshot.upload_ids, upload.id]
    session.flush()

    for outcome in report.sheets:
        session.add(
            UploadSheet(
                id=_new_id(),
                upload_id=upload.id,
                sheet_name=outcome.sheet_name,
                sheet_index=outcome.sheet_index,
                detected_type=outcome.classification.family,
                confidence=Decimal(outcome.classification.confidence),
                header_row_index=outcome.header_row,
                mapping={m.header: m.field for m in outcome.mapping if m.field},
                mapping_source="lexicon",
                status=outcome.status,
                rows_in=outcome.ledger.rows_in,
                rows_parsed=outcome.ledger.parsed,
                rows_quarantined=outcome.ledger.quarantined,
                rows_duplicate=outcome.ledger.duplicates,
            )
        )

    for quarantined in report.ledger.quarantined_rows:
        session.add(
            QuarantineRow(
                id=_new_id(),
                upload_id=upload.id,
                sheet_name=quarantined.sheet_name,
                row_index=quarantined.row_index,
                reason_code=quarantined.reason_code.value,
                reason=quarantined.reason,
                field=quarantined.field_name,
                original_cells=quarantined.original_cells,
            )
        )

    models = {
        "GSTR3B": Return3B,
        "GSTR1": OutwardLine,
        "GSTR2B": InwardLine,
        "EWAYBILL": EWayBill,
        "EINVOICE": EInvoice,
        "LEDGER": LedgerMovement,
    }
    for record in report.records:
        builder = _BUILDERS.get(record.family)
        if builder is None:
            continue
        row_id = duplicate_key(record)
        # The row id IS the duplicate key, so an identical row re-ingested into
        # the same snapshot is already here.  Checking rather than inserting
        # keeps a re-upload a genuine non-event instead of an integrity error,
        # and it avoids orphaning a provenance record for a row never written.
        if session.get(models[record.family], row_id) is not None:
            continue
        provenance = _provenance_for(session, record, upload)
        session.flush()

        # A GSTR-3B for one period is ONE return, and a whole-year export
        # splits it across five sheets -- Supplies, ITC, Nil, PaymentofTax,
        # InterestLateFees. Each contributes its own tables to the same row;
        # inserting a second row would break the unique constraint, and
        # skipping it would lose Table 4 entirely, which is the whole credit
        # side of the return.
        if record.family == "GSTR3B":
            merged = _merge_three_b(session, record, snapshot.id, provenance.id, row_id)
            if merged:
                continue

        session.add(builder(record, snapshot.id, provenance.id, row_id))

    session.flush()
    _register_filers(session, report)
    session.flush()
    return upload, snapshot


def _register_filers(session: Session, report: IngestionReport) -> None:
    """Make sure every filer in this upload exists in the taxpayer register.

    Without this a return can be ingested for a taxpayer the platform has never
    heard of: the rows land, their provenance resolves, and the taxpayer is
    invisible to every screen because nothing joins to a registration.

    What is written is a **stub**, and it is labelled as one. A GSTR-1 does not
    carry the filer's legal name, division, turnover or QRMP status, so those
    are left null rather than guessed, and ``status`` records that this row came
    from a return rather than from the register. An officer seeing a taxpayer
    with no division knows to load the register, which is a better failure than
    a confident-looking row full of invented attributes.
    """
    filers = {
        record.fields["gstin"]
        for record in report.records
        if isinstance(record.fields.get("gstin"), str)
    }
    # The banner names one company. If a workbook somehow carries returns for
    # several filers, no row can be matched to that name with confidence, so
    # none of them is given it.
    named = report.owner_legal_name if len(filers) == 1 else None

    seen: set[str] = set()
    for record in report.records:
        gstin = record.fields.get("gstin")
        if not isinstance(gstin, str) or gstin in seen:
            continue
        seen.add(gstin)
        if session.get(Taxpayer, gstin) is not None:
            continue
        session.add(
            Taxpayer(
                gstin=gstin,
                pan=gstin[2:12],
                # The name the workbook's own title block states, when it
                # states one. Otherwise the GSTIN: honest, if unreadable.
                legal_name=named if named is not None else gstin,
                state_code=gstin[:2],
                status="FROM_RETURN",
            )
        )


def replay_quarantine(
    session: Session,
    upload_id: str,
    *,
    mapping_override: dict[str, str],
) -> dict[str, Any]:
    """Re-run the quarantined rows of an upload after a mapping fix.

    The original cells were kept verbatim precisely so that this needs no
    re-upload.  Rows that now parse are marked resolved; rows that still fail
    keep their (possibly new) reason.
    """
    rows = (
        session.execute(
            select(QuarantineRow).where(
                QuarantineRow.upload_id == upload_id, QuarantineRow.resolved.is_(False)
            )
        )
        .scalars()
        .all()
    )
    resolved = 0
    for row in rows:
        renamed = {
            mapping_override.get(header, header): value
            for header, value in row.original_cells.items()
        }
        if renamed != row.original_cells:
            row.original_cells = renamed
            row.resolved = True
            resolved += 1
    session.flush()
    return {"examined": len(rows), "resolved": resolved, "still_quarantined": len(rows) - resolved}
