"""S1 - Ingestion: upload, classify, reconcile.

The screen this serves is the one that decides whether the platform survives
contact with a real portal export.  Three things it must never do:

* **Accept a row it cannot account for.**  Every row lands in PARSED,
  QUARANTINED (with a reason) or DUPLICATE, and ``rows_in`` must equal their
  sum.  :func:`upload` refuses to record a report that does not reconcile --
  a silent loss here becomes a wrong figure in a notice six screens later.
* **Guess at a file it was not given.**  The extension allowlist, the size cap
  and the magic-byte check are all enforced before a single cell is read.
* **Trust a filename.**  An uploaded name is attacker-controlled text; it is
  sanitised for storage and the original is kept only as a display label.

A dry run (``?commit=false``) parses and reports without writing anything, so
an officer can see what a workbook would do before it does it.
"""

from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Annotated, Any, Final

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.api.principal import PrincipalDep
from app.canonical import GstinError, validate_gstin
from app.db.models import Provenance, QuarantineRow, Snapshot, Upload, UploadSheet
from app.ingestion.banner import owner_gstin_from
from app.ingestion.persist import persist_report
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import read_bytes
from app.settings import get_settings

router = APIRouter(tags=["ingestion"])

SessionDep = Annotated[Session, Depends(get_session)]

#: The first bytes of a ZIP container, which is what .xlsx/.xlsm actually are.
#: Checked because an extension is a claim and a magic number is evidence.
_ZIP_MAGIC: Final[bytes] = b"PK\x03\x04"

#: Everything that is not a safe filename character.
_UNSAFE: Final[re.Pattern[str]] = re.compile(r"[^A-Za-z0-9._-]+")

#: A stored name never exceeds this, so a long name cannot defeat a path limit.
_MAX_STORED_NAME: Final[int] = 120

_GSTIN_IN_TEXT: Final[re.Pattern[str]] = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")


class UploadRejectedError(ValueError):
    """The file was refused before any cell was read."""


def sanitise_filename(raw: str) -> str:
    """A filename safe to put on a filesystem.

    Directory separators, traversal sequences, control characters and
    right-to-left overrides are all removed rather than escaped: an uploaded
    name is attacker-controlled text and the original is kept separately as a
    display label, so nothing is lost by being strict here.
    """
    # Strip any directory component, in either separator style, before anything
    # else -- "..\\..\\etc\\passwd" must not survive as a path.
    base = raw.replace("\\", "/").rsplit("/", 1)[-1]
    normalised = unicodedata.normalize("NFKD", base)
    cleaned = _UNSAFE.sub("_", normalised).strip("._")
    if not cleaned:
        cleaned = "upload"
    return cleaned[:_MAX_STORED_NAME]


def _storage_dir() -> Path:
    """Where raw uploads are kept.

    One directory per deployment, created on demand.  Object storage replaces
    this in a real deployment; the interface is the storage key either way.
    """
    root = Path(get_settings().upload_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _check(payload: bytes, filename: str) -> None:
    """Every refusal happens here, before the workbook is opened."""
    settings = get_settings()
    cap = settings.max_upload_mb * 1024 * 1024

    if not payload:
        raise UploadRejectedError("the file is empty")
    if len(payload) > cap:
        raise UploadRejectedError(
            f"the file is {len(payload) // 1024 // 1024} MB; the cap is {settings.max_upload_mb} MB"
        )

    suffix = Path(filename).suffix.lower()
    if suffix not in settings.allowed_upload_extensions:
        raise UploadRejectedError(
            f"{suffix or 'a file with no extension'} is not accepted; "
            f"allowed: {', '.join(settings.allowed_upload_extensions)}"
        )

    # An extension is a claim.  For the spreadsheet formats the platform reads,
    # the container is a ZIP, so the magic number is checkable evidence.
    if suffix in {".xlsx", ".xlsm"} and not payload.startswith(_ZIP_MAGIC):
        raise UploadRejectedError(f"the file is named {suffix} but is not a spreadsheet container")


@router.post("/ingestion/upload", status_code=201)
async def upload(  # noqa: PLR0917 - FastAPI binds these by name
    session: SessionDep,
    principal: PrincipalDep,
    file: Annotated[UploadFile, File()],
    snapshot_id: Annotated[str | None, Query()] = None,
    gstin: Annotated[
        str | None, Query(description="the filer's own GSTIN, if not in the workbook")
    ] = None,
    commit: Annotated[bool, Query(description="false parses without writing")] = True,
) -> dict[str, Any]:
    """Ingest a workbook, and report exactly what happened to every row.

    The response is the reconciliation the screen renders:
    ``rows_in = parsed + quarantined + duplicates``, per sheet and in total,
    with every quarantined row carrying the reason it was held.
    """
    if principal.read_only:
        raise HTTPException(
            status_code=403,
            detail={"code": "READ_ONLY", "message": f"{principal.role} may not upload"},
        )

    display_name = file.filename or "upload"
    payload = await file.read()

    try:
        _check(payload, display_name)
    except UploadRejectedError as exc:
        raise HTTPException(
            status_code=422, detail={"code": "UPLOAD_REJECTED", "message": str(exc)}
        ) from exc

    digest = hashlib.sha256(payload).hexdigest()

    already = session.execute(select(Upload).where(Upload.sha256 == digest)).scalars().first()
    if already is not None and commit:
        # The same bytes have been ingested before.  Report the earlier upload
        # rather than creating a second one: re-uploading a file is a common
        # accident and duplicating its rows would corrupt every count downstream.
        raise HTTPException(
            status_code=409,
            detail={
                "code": "ALREADY_INGESTED",
                "message": "these exact bytes were ingested already",
                "upload_id": already.id,
                "filename": already.filename,
                "uploaded_at": already.uploaded_at.isoformat(),
            },
        )

    try:
        # Dispatch on the extension: the allow-list admits .csv, and a CSV
        # read as a workbook fails with a message about a ZIP container
        # that tells the officer nothing about their file.
        sheets = read_bytes(payload, display_name)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "UNREADABLE",
                "message": f"the workbook could not be opened: {type(exc).__name__}",
            },
        ) from exc

    # A GSTR-1 row names the recipient, not the filer. The filer's own GSTIN is
    # context: supplied by the caller, or read from the title block the portal
    # writes above the header. Which of the two it was is recorded, because a
    # figure's provenance includes where its subject came from.
    owner = gstin or owner_gstin_from(sheets)
    owner_source = "supplied" if gstin else ("title block" if owner else None)
    if gstin:
        try:
            validate_gstin(gstin)
        except GstinError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "INVALID_GSTIN", "message": str(exc)},
            ) from exc

    report = ingest_sheets(
        sheets,
        filename=display_name,
        payload=payload,
        owner_gstin=owner,
        supplier_state=owner[:2] if owner else None,
    )

    # Law 5, checked here rather than trusted.  A report that does not
    # reconcile is a bug in the pipeline, and writing it would bury the bug in
    # the data.
    counts = report.ledger.as_dict()
    total = int(counts["parsed"]) + int(counts["quarantined"]) + int(counts["duplicates"])
    if total != int(counts["rows_in"]):
        raise HTTPException(
            status_code=500,
            detail={
                "code": "DOES_NOT_RECONCILE",
                "message": (
                    f"{counts['rows_in']} rows in, {total} accounted for. Nothing was "
                    "written: a row that cannot be accounted for must not become a figure."
                ),
                "counts": counts,
            },
        )

    missing_owner = owner is None and any(
        held.reason_code == "REQUIRED_FIELD_MISSING" and held.field_name == "gstin"
        for held in report.ledger.quarantined_rows
    )
    hint = (
        {
            "code": "OWNER_GSTIN_UNKNOWN",
            "message": (
                "Rows were held because the filer's own GSTIN is not in them and was "
                "not found in the workbook's title block. A GSTR-1 export names the "
                "recipient on each row, not the filer."
            ),
            "remedy": "Re-upload with ?gstin=<the filer's GSTIN>.",
        }
        if missing_owner
        else None
    )

    if not commit:
        return {
            "committed": False,
            "owner_gstin": owner,
            "owner_gstin_source": owner_source,
            "hint": hint,
            "note": (
                "Dry run. Nothing was written. These are the counts this workbook would produce."
            ),
            **report.as_dict(),
        }

    stored_name = f"{digest[:16]}-{sanitise_filename(display_name)}"
    destination = _storage_dir() / stored_name
    destination.write_bytes(payload)

    upload_row, snapshot = persist_report(
        session,
        report,
        uploaded_by=principal.officer_id,
        storage_key=str(destination),
        size_bytes=len(payload),
        snapshot_id=snapshot_id,
        snapshot_description=f"uploaded by {principal.officer_id}",
    )
    session.flush()

    return {
        "committed": True,
        "upload_id": upload_row.id,
        "snapshot_id": snapshot.id,
        "filename": display_name,
        "stored_as": stored_name,
        "sha256": digest,
        "size_bytes": len(payload),
        "owner_gstin": owner,
        "owner_gstin_source": owner_source,
        "hint": hint,
        **report.as_dict(),
        "reconciles": True,
        "note": (
            "rows_in = parsed + quarantined + duplicates. Nothing was dropped and "
            "nothing was assumed."
        ),
    }


@router.get("/ingestion/uploads")
def list_uploads(session: SessionDep, principal: PrincipalDep) -> dict[str, Any]:
    """Every workbook ingested, with its reconciliation."""
    rows = session.execute(select(Upload).order_by(Upload.uploaded_at.desc())).scalars().all()
    return {
        "count": len(rows),
        "items": [
            {
                "upload_id": row.id,
                "filename": row.filename,
                "sha256": row.sha256,
                "size_bytes": row.size_bytes,
                "uploaded_by": row.uploaded_by,
                "uploaded_at": row.uploaded_at.isoformat(),
                "status": row.status,
                "sheet_count": row.sheet_count,
                "rows_in": row.rows_in,
                "rows_parsed": row.rows_parsed,
                "rows_quarantined": row.rows_quarantined,
                "rows_duplicate": row.rows_duplicate,
                "reconciles": row.rows_in
                == row.rows_parsed + row.rows_quarantined + row.rows_duplicate,
            }
            for row in rows
        ],
        "scope": principal.describe_scope(),
    }


@router.get("/ingestion/uploads/{upload_id}")
def read_upload(upload_id: str, session: SessionDep) -> dict[str, Any]:
    """One workbook: its sheets, how each was classified, and its quarantine."""
    row = session.get(Upload, upload_id)
    if row is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such upload"}
        )

    sheets = (
        session.execute(
            select(UploadSheet)
            .where(UploadSheet.upload_id == upload_id)
            .order_by(UploadSheet.sheet_index)
        )
        .scalars()
        .all()
    )
    quarantine = (
        session.execute(select(QuarantineRow).where(QuarantineRow.upload_id == upload_id))
        .scalars()
        .all()
    )

    return {
        "upload_id": row.id,
        "filename": row.filename,
        "sha256": row.sha256,
        "uploaded_by": row.uploaded_by,
        "uploaded_at": row.uploaded_at.isoformat(),
        "counts": {
            "rows_in": row.rows_in,
            "parsed": row.rows_parsed,
            "quarantined": row.rows_quarantined,
            "duplicates": row.rows_duplicate,
            "reconciles": row.rows_in
            == row.rows_parsed + row.rows_quarantined + row.rows_duplicate,
        },
        "sheets": [
            {
                "sheet_name": sheet.sheet_name,
                "sheet_index": sheet.sheet_index,
                "detected_type": sheet.detected_type,
                "confidence": format(sheet.confidence, "f")
                if sheet.confidence is not None
                else None,
                "header_row_index": sheet.header_row_index,
                "mapping": sheet.mapping,
                "mapping_source": sheet.mapping_source,
                "status": sheet.status,
                "rows_in": sheet.rows_in,
                "rows_parsed": sheet.rows_parsed,
                "rows_quarantined": sheet.rows_quarantined,
                "rows_duplicate": sheet.rows_duplicate,
            }
            for sheet in sheets
        ],
        "quarantine": [
            {
                "sheet_name": held.sheet_name,
                "row_index": held.row_index,
                "reason_code": held.reason_code,
                "reason": held.reason,
                "field": held.field,
                "original_cells": held.original_cells,
            }
            for held in quarantine
        ],
        "note": (
            "A quarantined row is held with a reason, never discarded. Fix the source "
            "or the mapping and re-upload; nothing here is silently assumed."
        ),
    }


@router.get("/ingestion/snapshots")
def list_snapshots(session: SessionDep) -> dict[str, Any]:
    """Every snapshot, which is what an engine run is computed over."""
    rows = session.execute(select(Snapshot).order_by(Snapshot.created_at.desc())).scalars().all()
    return {
        "count": len(rows),
        "items": [
            {
                "snapshot_id": row.id,
                "description": row.description,
                "created_at": row.created_at.isoformat(),
                "content_hash": row.content_hash,
                "fy": row.fy,
                "row_counts": row.row_counts,
                "upload_ids": list(row.upload_ids),
                "gstins": len(row.gstins),
            }
            for row in rows
        ],
    }


@router.get("/ingestion/uploads/{upload_id}/provenance")
def upload_provenance(
    upload_id: str,
    session: SessionDep,
    limit: Annotated[int, Query(le=500)] = 50,
) -> dict[str, Any]:
    """The file → sheet → row → cell records this upload produced."""
    if session.get(Upload, upload_id) is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such upload"}
        )
    rows = (
        session.execute(select(Provenance).where(Provenance.upload_id == upload_id).limit(limit))
        .scalars()
        .all()
    )
    return {
        "count": len(rows),
        "items": [
            {
                "id": row.id,
                "file_name": row.file_name,
                "sheet_name": row.sheet_name,
                "row_index": row.row_index,
                "header_row_index": row.header_row_index,
                "original_cells": row.original_cells,
            }
            for row in rows
        ],
    }


@router.get("/ingestion/uploads/{upload_id}/sheets")
def sheet_names(upload_id: str, session: SessionDep) -> dict[str, Any]:
    """The sheets in an uploaded workbook, as they were classified."""
    if session.get(Upload, upload_id) is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such upload"}
        )
    rows = (
        session.execute(
            select(UploadSheet)
            .where(UploadSheet.upload_id == upload_id)
            .order_by(UploadSheet.sheet_index)
        )
        .scalars()
        .all()
    )
    return {
        "upload_id": upload_id,
        "items": [
            {
                "sheet_name": row.sheet_name,
                "sheet_index": row.sheet_index,
                "detected_type": row.detected_type,
                "header_row_index": row.header_row_index,
                "status": row.status,
                "rows_in": row.rows_in,
            }
            for row in rows
        ],
    }


@router.get("/ingestion/uploads/{upload_id}/sheets/{sheet_index}/cells")
def sheet_cells(
    upload_id: str,
    sheet_index: int,
    session: SessionDep,
    start: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
) -> dict[str, Any]:
    """The workbook itself, cell by cell, as the officer's own file shows it.

    This is the far end of the provenance chain. A drawer can say "row 8 of
    sheet B2B_072025" and be believed; showing the officer that row, in the
    grid it came from, with the header the platform detected and the rows it
    held marked, is what makes the claim checkable rather than trusted.

    The cells are read back from the stored file, not reconstructed from the
    canonical rows. A reconstruction would show what the platform *understood*,
    which is precisely the thing under question.
    """
    upload = session.get(Upload, upload_id)
    if upload is None:
        raise HTTPException(
            status_code=404, detail={"code": "NOT_FOUND", "message": "no such upload"}
        )

    stored = Path(upload.storage_key)
    if not stored.exists():
        raise HTTPException(
            status_code=410,
            detail={
                "code": "FILE_NOT_RETAINED",
                "message": (
                    "the original workbook is no longer in storage, so its cells "
                    "cannot be shown. The canonical rows and their provenance record "
                    "remain."
                ),
                "storage_key": upload.storage_key,
            },
        )

    try:
        sheets = read_bytes(stored.read_bytes(), upload.filename)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "UNREADABLE", "message": f"{type(exc).__name__}"},
        ) from exc

    if sheet_index >= len(sheets):
        raise HTTPException(
            status_code=404,
            detail={"code": "NO_SUCH_SHEET", "message": f"sheet {sheet_index} is not in this file"},
        )
    sheet = sheets[sheet_index]

    meta = (
        session.execute(
            select(UploadSheet).where(
                UploadSheet.upload_id == upload_id, UploadSheet.sheet_index == sheet_index
            )
        )
        .scalars()
        .first()
    )

    held = {
        row.row_index: {"reason_code": row.reason_code, "reason": row.reason}
        for row in session.execute(
            select(QuarantineRow).where(
                QuarantineRow.upload_id == upload_id,
                QuarantineRow.sheet_name == sheet.name,
            )
        ).scalars()
    }

    window = sheet.rows[start : start + limit]
    width = max((len(row) for row in window), default=0)

    return {
        "upload_id": upload_id,
        "filename": upload.filename,
        "sheet_name": sheet.name,
        "sheet_index": sheet_index,
        "detected_type": meta.detected_type if meta else None,
        "header_row_index": meta.header_row_index if meta else None,
        "mapping": meta.mapping if meta else None,
        "total_rows": len(sheet.rows),
        "start": start,
        "width": width,
        "rows": [
            {
                "index": start + offset,
                "cells": [_cell(value) for value in row] + [None] * (width - len(row)),
                "held": held.get(start + offset),
            }
            for offset, row in enumerate(window)
        ],
        "note": (
            "Read back from the stored workbook, not rebuilt from the canonical rows: "
            "what this shows is the file, not the platform's reading of it."
        ),
    }


def _cell(value: object) -> str | None:
    """One cell, as text, exactly as it was read."""
    if value is None or value == "":
        return None
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, datetime):
        # A spreadsheet date cell arrives as a midnight datetime. Showing the
        # "T00:00:00" would be the reader's artefact, not the file's content,
        # and this view exists to show the file.
        return (
            value.date().isoformat()
            if (value.hour, value.minute, value.second) == (0, 0, 0)
            else value.isoformat(sep=" ")
        )
    if isinstance(value, date):
        return value.isoformat()
    return str(value)
