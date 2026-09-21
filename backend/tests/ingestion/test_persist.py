"""Canonical rows land in the database with a provenance pointer."""

from __future__ import annotations

import io
from typing import Any

from openpyxl import Workbook
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import OutwardLine, Provenance, QuarantineRow, Snapshot, Upload, UploadSheet
from app.ingestion.persist import persist_report
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import read_workbook
from tests.ingestion.test_pipeline import PORTAL_B2B, b2b_row


def _payload() -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    assert sheet is not None
    sheet.title = "b2b"
    sheet.append(PORTAL_B2B)
    for index in range(4):
        sheet.append(b2b_row(f"INV-{index}", "100000"))
    bad: list[Any] = b2b_row("INV-BAD", "100000")
    bad[3] = "not a date"
    sheet.append(bad)
    notes = workbook.create_sheet("Notes")
    notes.append(["Prepared by", "Remarks"])
    notes.append(["R. Deshmukh", "see covering letter"])
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _ingest(session: Session) -> tuple[Upload, Snapshot]:
    payload = _payload()
    report = ingest_sheets(
        read_workbook(payload),
        filename="GSTR1_Jun2025.xlsx",
        payload=payload,
        owner_gstin="27AAPFU0939F1ZV",
        period_hint="062025",
    )
    return persist_report(
        session,
        report,
        uploaded_by="sto.pune.1",
        storage_key="uploads/x.xlsx",
        size_bytes=len(payload),
    )


def test_rows_land_with_counts_that_reconcile(session: Session) -> None:
    upload, _ = _ingest(session)
    assert upload.rows_in == upload.rows_parsed + upload.rows_quarantined + upload.rows_duplicate
    assert upload.rows_parsed == 4
    assert upload.rows_quarantined == 2  # the bad date, and the unreadable sheet


def test_every_canonical_row_points_at_its_source_cells(session: Session) -> None:
    """Law 2: provenance is created here or not at all."""
    _ingest(session)
    lines = session.execute(select(OutwardLine)).scalars().all()
    assert len(lines) == 4
    for line in lines:
        assert line.prov_id is not None
        provenance = session.get(Provenance, line.prov_id)
        assert provenance is not None
        assert provenance.sheet_name == "b2b"
        assert provenance.original_cells["Invoice Number"] == line.doc_no
        assert provenance.file_sha256


def test_the_quarantine_keeps_the_original_cells_for_replay(session: Session) -> None:
    _ingest(session)
    rows = session.execute(select(QuarantineRow)).scalars().all()
    coercion = [row for row in rows if row.reason_code == "COERCION_FAILED"]
    assert len(coercion) == 1
    assert coercion[0].original_cells["Invoice date"] == "not a date"


def test_sheet_outcomes_are_recorded_including_the_unreadable_one(session: Session) -> None:
    _ingest(session)
    sheets = session.execute(select(UploadSheet)).scalars().all()
    assert {s.sheet_name for s in sheets} == {"b2b", "Notes"}
    assert next(s for s in sheets if s.sheet_name == "Notes").status == "UNRECOGNISED"
    assert next(s for s in sheets if s.sheet_name == "b2b").header_row_index == 0


def test_re_ingesting_into_the_same_snapshot_adds_no_rows(session: Session) -> None:
    """The canonical row's primary key IS its duplicate key."""
    _, snapshot = _ingest(session)
    before = session.execute(select(func.count()).select_from(OutwardLine)).scalar_one()

    payload = _payload()
    report = ingest_sheets(
        read_workbook(payload),
        filename="GSTR1_Jun2025.xlsx",
        payload=payload,
        owner_gstin="27AAPFU0939F1ZV",
        period_hint="062025",
    )
    persist_report(
        session,
        report,
        uploaded_by="sto.pune.1",
        storage_key="uploads/x.xlsx",
        size_bytes=len(payload),
        snapshot_id=snapshot.id,
    )
    after = session.execute(select(func.count()).select_from(OutwardLine)).scalar_one()
    assert after == before


def test_the_snapshot_is_content_hashed(session: Session) -> None:
    _, snapshot = _ingest(session)
    assert len(snapshot.content_hash) == 64
    assert snapshot.gstins == ["27AAPFU0939F1ZV"]
    assert snapshot.frozen is True
