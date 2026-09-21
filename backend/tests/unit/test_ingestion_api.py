"""S1 - the upload path, and what it refuses.

Every refusal here happens before a single cell is read, because the cheapest
place to stop a bad file is at the door. The reconciliation test is the one
that matters most: a workbook whose rows do not account for themselves must
not be written at all.
"""

from __future__ import annotations

import io
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_session
from app.api.v1.ingestion import owner_gstin_from, sanitise_filename
from app.db.base import Base
from app.main import create_app

STO = {"X-Officer-Id": "sto.pune.4", "X-Officer-Role": "STO", "X-Officer-Divisions": "PUNE-II"}
AUDITOR = {"X-Officer-Id": "audit.hq", "X-Officer-Role": "AUDITOR"}


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("DRISHTI_UPLOAD_DIR", str(tmp_path / "uploads"))
    from app.settings import get_settings

    get_settings.cache_clear()

    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

    def override() -> Iterator[Session]:
        session = factory()
        try:
            yield session
            session.commit()
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_session] = override
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(engine)
    engine.dispose()
    get_settings.cache_clear()


FILER = "27AABCT2345L1Z7"


def _workbook(*, banner: str | None = None) -> bytes:
    """A small, real .xlsx in portal shape."""
    from openpyxl import Workbook

    book = Workbook()
    sheet = book.active
    assert sheet is not None
    sheet.title = "b2b_042025"
    sheet.append(["GSTR-1 : Outward supplies"])  # a title block, as the portal writes
    sheet.append([banner] if banner is not None else [])
    sheet.append(
        [
            "GSTIN/UIN of Recipient",
            "Invoice Number",
            "Invoice date",
            "Invoice Value",
            "Place Of Supply",
            "Rate",
            "Taxable Value",
            "Integrated Tax",
            "Central Tax",
            "State/UT Tax",
        ]
    )
    sheet.append(
        [
            "27AACCM9910C1ZN",
            "INV-001",
            "05-04-2025",
            "118000",
            "27-Maharashtra",
            "18",
            "100000",
            "0",
            "9000",
            "9000",
        ]
    )
    buffer = io.BytesIO()
    book.save(buffer)
    return buffer.getvalue()


def _post(
    client: TestClient,
    payload: bytes,
    name: str = "gstr1.xlsx",
    *,
    headers: dict[str, str] | None = None,
    commit: bool = True,
) -> object:
    return client.post(
        f"/api/v1/ingestion/upload?commit={'true' if commit else 'false'}",
        headers=headers or STO,
        files={"file": (name, payload, "application/vnd.ms-excel")},
    )


# ---------------------------------------------------------------------------
# what the door refuses
# ---------------------------------------------------------------------------


class TestRefusals:
    @pytest.mark.golden
    def test_an_executable_renamed_to_xlsx_is_refused(self, client: TestClient) -> None:
        """An extension is a claim; the container is evidence."""
        response = _post(client, b"MZ\x90\x00this is a PE binary", "payroll.xlsx")
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "UPLOAD_REJECTED"
        assert "not a spreadsheet container" in response.json()["detail"]["message"]

    def test_a_disallowed_extension_is_refused(self, client: TestClient) -> None:
        response = _post(client, b"PK\x03\x04payload", "archive.zip")
        assert response.status_code == 422
        assert "not accepted" in response.json()["detail"]["message"]

    def test_an_empty_file_is_refused(self, client: TestClient) -> None:
        response = _post(client, b"", "empty.xlsx")
        assert response.status_code == 422
        assert "empty" in response.json()["detail"]["message"]

    def test_a_file_over_the_cap_is_refused(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("DRISHTI_MAX_UPLOAD_MB", "1")
        from app.settings import get_settings

        get_settings.cache_clear()
        oversized = b"PK\x03\x04" + b"0" * (2 * 1024 * 1024)
        response = _post(client, oversized, "big.xlsx")
        get_settings.cache_clear()
        assert response.status_code == 422
        assert "the cap is 1 MB" in response.json()["detail"]["message"]

    def test_a_read_only_role_may_not_upload(self, client: TestClient) -> None:
        response = _post(client, _workbook(), headers=AUDITOR)
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "READ_ONLY"

    def test_an_unreadable_workbook_is_refused_not_half_ingested(self, client: TestClient) -> None:
        response = _post(client, b"PK\x03\x04truncated garbage", "corrupt.xlsx")
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "UNREADABLE"


class TestFilenameSanitisation:
    @pytest.mark.golden
    @pytest.mark.parametrize(
        ("raw", "forbidden"),
        [
            ("../../etc/passwd", ".."),
            ("..\\..\\windows\\system32\\cfg", ".."),
            ("/absolute/path.xlsx", "/"),
            ("C:\\Users\\x\\book.xlsx", "\\"),
        ],
    )
    def test_no_traversal_survives(self, raw: str, forbidden: str) -> None:
        cleaned = sanitise_filename(raw)
        assert forbidden not in cleaned
        assert "/" not in cleaned
        assert "\\" not in cleaned

    def test_a_name_of_only_punctuation_still_yields_something(self) -> None:
        assert sanitise_filename("...") == "upload"
        assert sanitise_filename("") == "upload"

    def test_a_very_long_name_is_truncated(self) -> None:
        assert len(sanitise_filename("a" * 500 + ".xlsx")) <= 120

    def test_a_right_to_left_override_does_not_survive(self) -> None:
        # U+202E is the classic "gpj.exe looks like exe.jpg" trick.
        cleaned = sanitise_filename("invoice\u202egpj.exe")
        assert "\u202e" not in cleaned


# ---------------------------------------------------------------------------
# what it accepts, and what it reports
# ---------------------------------------------------------------------------


class TestUpload:
    @pytest.mark.golden
    def test_every_row_is_accounted_for(self, client: TestClient) -> None:
        """Law 5 on screen: rows_in = parsed + quarantined + duplicates."""
        response = _post(client, _workbook())
        assert response.status_code == 201, response.text
        body = response.json()
        counts = body["counts"]
        assert counts["rows_in"] == counts["parsed"] + counts["quarantined"] + counts["duplicates"]
        assert body["reconciles"] is True

    def test_a_dry_run_writes_nothing(self, client: TestClient) -> None:
        body = _post(client, _workbook(), commit=False).json()
        assert body["committed"] is False
        assert client.get("/api/v1/ingestion/uploads", headers=STO).json()["count"] == 0

    @pytest.mark.golden
    def test_the_same_bytes_are_not_ingested_twice(self, client: TestClient) -> None:
        """Re-uploading a file is a common accident; duplicating its rows
        would corrupt every count downstream."""
        payload = _workbook()
        first = _post(client, payload)
        assert first.status_code == 201
        second = _post(client, payload, "a-different-name.xlsx")
        assert second.status_code == 409
        assert second.json()["detail"]["code"] == "ALREADY_INGESTED"
        assert second.json()["detail"]["upload_id"] == first.json()["upload_id"]

    def test_the_stored_name_is_sanitised_and_the_original_kept(self, client: TestClient) -> None:
        body = _post(client, _workbook(), "../../../GSTR 1 (April).xlsx").json()
        assert ".." not in body["stored_as"]
        assert "/" not in body["stored_as"]
        # The original survives as a display label, so nothing is lost.
        assert body["filename"] == "../../../GSTR 1 (April).xlsx"

    def test_the_upload_is_listed_with_its_reconciliation(self, client: TestClient) -> None:
        _post(client, _workbook())
        body = client.get("/api/v1/ingestion/uploads", headers=STO).json()
        assert body["count"] == 1
        assert body["items"][0]["reconciles"] is True

    def test_a_quarantined_row_keeps_its_reason_and_its_cells(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook()).json()["upload_id"]
        body = client.get(f"/api/v1/ingestion/uploads/{upload_id}", headers=STO).json()
        for held in body["quarantine"]:
            assert held["reason"]
            assert held["reason_code"]
            assert held["original_cells"] is not None
        assert "never discarded" in body["note"]

    def test_provenance_resolves_to_the_source_cells(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook()).json()["upload_id"]
        body = client.get(f"/api/v1/ingestion/uploads/{upload_id}/provenance", headers=STO).json()
        if body["count"]:
            row = body["items"][0]
            assert row["sheet_name"] == "b2b_042025"
            assert row["original_cells"]

    def test_an_unknown_upload_is_404(self, client: TestClient) -> None:
        assert client.get("/api/v1/ingestion/uploads/nope", headers=STO).status_code == 404


class TestOwnerGstin:
    """A GSTR-1 row names the recipient. The filer's own GSTIN is context."""

    @pytest.mark.golden
    def test_it_is_read_from_the_title_block(self, client: TestClient) -> None:
        """An officer uploading their own return should not have to retype
        what the portal already wrote at the top of it."""
        body = _post(
            client, _workbook(banner=f"GSTIN {FILER}   Period Apr 2025"), commit=False
        ).json()
        assert body["owner_gstin"] == FILER
        assert body["owner_gstin_source"] == "title block"
        assert body["hint"] is None

    def test_an_explicit_gstin_wins_and_is_recorded_as_such(self, client: TestClient) -> None:
        response = client.post(
            f"/api/v1/ingestion/upload?commit=false&gstin={FILER}",
            headers=STO,
            files={"file": ("gstr1.xlsx", _workbook(), "application/vnd.ms-excel")},
        )
        body = response.json()
        assert body["owner_gstin"] == FILER
        assert body["owner_gstin_source"] == "supplied"

    def test_a_gstin_failing_its_checksum_is_refused(self, client: TestClient) -> None:
        response = client.post(
            "/api/v1/ingestion/upload?commit=false&gstin=27AABCT2345L1ZZ",
            headers=STO,
            files={"file": ("gstr1.xlsx", _workbook(), "application/vnd.ms-excel")},
        )
        assert response.status_code == 422
        assert response.json()["detail"]["code"] == "INVALID_GSTIN"

    @pytest.mark.golden
    def test_with_no_owner_anywhere_the_reason_is_actionable(self, client: TestClient) -> None:
        """Quarantining a whole file is defensible; doing it without saying
        what to supply is not."""
        body = _post(client, _workbook(), commit=False).json()
        assert body["owner_gstin"] is None
        assert body["hint"]["code"] == "OWNER_GSTIN_UNKNOWN"
        assert "?gstin=" in body["hint"]["remedy"]

    def test_a_stray_invalid_gstin_in_a_title_is_not_mistaken_for_the_filer(
        self,
    ) -> None:
        from dataclasses import dataclass, field

        @dataclass
        class _Sheet:
            rows: list[list[object]] = field(
                default_factory=lambda: [["Prepared for 27AABCT2345L1ZZ, an invalid reference"]]
            )

        assert owner_gstin_from([_Sheet()]) is None


class TestSheetViewer:
    """The far end of the provenance chain: the officer's own file, on screen."""

    @pytest.mark.golden
    def test_the_cells_come_back_as_the_file_has_them(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook(banner=f"GSTIN {FILER}")).json()["upload_id"]
        body = client.get(
            f"/api/v1/ingestion/uploads/{upload_id}/sheets/0/cells", headers=STO
        ).json()

        assert body["sheet_name"] == "b2b_042025"
        assert body["header_row_index"] is not None
        assert body["total_rows"] >= 4

        # The banner the portal wrote, verbatim.
        first = body["rows"][0]["cells"]
        assert "GSTR-1" in " ".join(c for c in first if c)

        # The header row holds the column names the mapping was built from.
        header = body["rows"][body["header_row_index"]]["cells"]
        assert "GSTIN/UIN of Recipient" in header

    def test_a_held_row_is_marked_where_it_sits(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook()).json()["upload_id"]
        body = client.get(
            f"/api/v1/ingestion/uploads/{upload_id}/sheets/0/cells", headers=STO
        ).json()
        marked = [row for row in body["rows"] if row["held"] is not None]
        for row in marked:
            assert row["held"]["reason"]
            assert row["held"]["reason_code"]

    def test_it_reads_the_stored_file_not_the_canonical_rows(self, client: TestClient) -> None:
        """What is under question is the platform's reading, so the screen must
        not show the platform's reading back."""
        upload_id = _post(client, _workbook()).json()["upload_id"]
        body = client.get(
            f"/api/v1/ingestion/uploads/{upload_id}/sheets/0/cells", headers=STO
        ).json()
        assert "not rebuilt from the canonical rows" in body["note"]

    def test_paging_a_long_sheet(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook()).json()["upload_id"]
        body = client.get(
            f"/api/v1/ingestion/uploads/{upload_id}/sheets/0/cells?start=2&limit=1",
            headers=STO,
        ).json()
        assert body["start"] == 2
        assert len(body["rows"]) == 1
        assert body["rows"][0]["index"] == 2

    def test_the_sheet_list_names_what_each_was_taken_for(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook()).json()["upload_id"]
        body = client.get(f"/api/v1/ingestion/uploads/{upload_id}/sheets", headers=STO).json()
        assert body["items"][0]["sheet_name"] == "b2b_042025"
        assert body["items"][0]["detected_type"] == "GSTR1"

    def test_an_unknown_sheet_is_404(self, client: TestClient) -> None:
        upload_id = _post(client, _workbook()).json()["upload_id"]
        assert (
            client.get(
                f"/api/v1/ingestion/uploads/{upload_id}/sheets/9/cells", headers=STO
            ).status_code
            == 404
        )

    @pytest.mark.golden
    def test_a_file_no_longer_in_storage_says_so(self, client: TestClient, tmp_path: Path) -> None:
        """Retention is a real policy. When the bytes are gone the screen says
        that, rather than reconstructing something that looks like them."""
        upload_id = _post(client, _workbook()).json()["upload_id"]
        for stored in (tmp_path / "uploads").glob("*"):
            stored.unlink()
        response = client.get(f"/api/v1/ingestion/uploads/{upload_id}/sheets/0/cells", headers=STO)
        assert response.status_code == 410
        assert response.json()["detail"]["code"] == "FILE_NOT_RETAINED"
