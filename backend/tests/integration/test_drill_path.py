"""The path that decides adoption.

    a figure on the Commissioner's dashboard
      -> the taxpayer list behind it
        -> the taxpayer
          -> the finding
            -> the provenance drawer
              -> the row in the uploaded spreadsheet

If this path works, the platform gets adopted.  If it breaks anywhere, that is
fixed before anything else -- no chart, no model and no agent compensates for a
number an officer cannot trace.
"""

from __future__ import annotations

import io
from collections.abc import Iterator
from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.aggregation.rollup import run_and_store
from app.api.deps import get_session
from app.db.base import Base
from app.db.facts import CalcTraceRow
from app.db.models import OutwardLine, Taxpayer
from app.engine.records import (
    OutwardRecord,
    TaxpayerData,
    TaxpayerProfile,
)
from app.engine.runner import run_for_taxpayer
from app.ingestion.persist import persist_report
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import read_workbook
from app.main import create_app
from app.money import D
from tests.engine import factories as f
from tests.engine.factories import JUN
from tests.ingestion.test_pipeline import PORTAL_B2B, b2b_row

AS_OF = date(2026, 9, 20)


@pytest.fixture
def db() -> Iterator[Session]:
    # TestClient serves requests on a worker thread, and an in-memory SQLite
    # connection belongs to the thread that opened it.  StaticPool keeps one
    # shared connection so the request thread sees the same database the test
    # seeded.
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)
    with factory() as session:
        yield session
    engine.dispose()


@pytest.fixture
def client(db: Session) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_session] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _workbook() -> bytes:
    """A GSTR-1 export with a real Rule 88C shortfall behind it."""
    workbook = Workbook()
    sheet = workbook.active
    assert sheet is not None
    sheet.title = "b2b"
    sheet.append(PORTAL_B2B)
    for index in range(5):
        sheet.append(b2b_row(f"INV-{index:03d}", "25000000"))
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _seeded(db: Session) -> dict[str, Any]:
    """Ingest a workbook, run the engine over it, persist and roll up."""
    payload = _workbook()
    report = ingest_sheets(
        read_workbook(payload),
        filename="GSTR1_Jun2025.xlsx",
        payload=payload,
        owner_gstin=f.GSTIN,
        period_hint="062025",
    )
    _, snapshot = persist_report(
        db,
        report,
        uploaded_by="sto.pune.4",
        storage_key="uploads/g1.xlsx",
        size_bytes=len(payload),
    )

    # Ingestion registers the filer itself, as a stub built from the GSTIN.
    # Loading the register then fills in what a return cannot carry: the legal
    # name, the division, the officer and the turnover.
    registered = db.get(Taxpayer, f.GSTIN)
    assert registered is not None, "ingestion did not register the filer"
    assert registered.status == "FROM_RETURN"
    registered.pan = "AAPFU0939F"
    registered.legal_name = "Umang Fabricators LLP"
    registered.trade_name = "Umang Fabricators"
    registered.division = "Pune-II"
    registered.officer_id = "sto.pune.4"
    registered.aato = D("480000000")
    registered.status = "ACTIVE"
    db.flush()

    # Build the engine's view from the rows that were just ingested, so the
    # evidence ids in the trace are the real canonical row ids.
    rows = db.execute(select(OutwardLine).where(OutwardLine.gstin == f.GSTIN)).scalars().all()
    outward = tuple(
        OutwardRecord(
            gstin=row.gstin,
            period=JUN,
            section=row.section,
            doc_type=row.doc_type,
            doc_no=row.doc_no,
            doc_date=row.doc_date,
            counterparty_gstin=row.counterparty_gstin,
            pos=row.pos,
            rate=row.rate,
            taxable_value=row.taxable_value,
            igst=D("4500000"),  # 18% of 2,50,00,000
            cgst=D("0"),
            sgst=D("0"),
            cess=D("0"),
            row_id=row.id,
            prov_id=row.prov_id,
        )
        for row in rows
    )
    # GSTR-3B declares far less than GSTR-1: a Rule 88C shortfall.
    data = TaxpayerData(
        profile=TaxpayerProfile(
            gstin=f.GSTIN,
            pan="AAPFU0939F",
            legal_name="Umang Fabricators LLP",
            state_code="27",
            division="Pune-II",
            officer_id="sto.pune.4",
            aato=D("480000000"),
        ),
        outward=outward,
        returns_3b=(f.return_3b(JUN, t31a_taxable="125000000", t31a_igst="1000000"),),
    )
    outcome = run_for_taxpayer(
        f.context(data, as_of=AS_OF, snapshot_id=snapshot.id), with_identities=False
    )
    run, counts = run_and_store(
        db,
        [outcome],
        snapshot_id=snapshot.id,
        as_of=AS_OF,
        triggered_by="sto.pune.4",
        jurisdiction_of={f.GSTIN: "Pune-II"},
        officer_of={f.GSTIN: "sto.pune.4"},
    )
    db.flush()
    return {"run": run, "counts": counts, "outcome": outcome, "snapshot": snapshot}


# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_the_whole_path_from_a_dashboard_figure_to_a_spreadsheet_cell(
    db: Session, client: TestClient
) -> None:
    seeded = _seeded(db)
    run_id = seeded["run"].id

    # 1. The Commissioner's overview.
    overview = client.get(f"/api/v1/dashboard/overview?run_id={run_id}").json()
    assert overview["engine_run_id"] == run_id
    revenue = next(tile for tile in overview["kpi"] if tile["metric"] == "M-K05")
    assert Decimal(revenue["value"]) > 0, "there is revenue at risk to click on"
    assert isinstance(revenue["value"], str), "money crosses the API as a string"

    # 2. Click the CERTAIN confidence bar.
    drill = client.get(f"/api/v1{revenue['drill']}").json()
    assert drill["total"] >= 1
    assert drill["metric"]["id"] == "M-K05"

    # 3. Land on the taxpayer list and open one.
    row = drill["items"][0]
    assert row["gstin"] == f.GSTIN
    assert row["legal_name"] == "Umang Fabricators LLP"
    assert row["f_calc_id"] and row["p_calc_id"]

    # 4. Open a finding and take its calc_id.
    finding = next(x for x in seeded["outcome"].findings if x.rule_id == "OUT-01" and x.triggered)
    assert finding.calc_id

    # 5. The provenance drawer.
    drawer = client.get(f"/api/v1/calc/{finding.calc_id}").json()
    assert drawer["calc_id"] == finding.calc_id
    assert drawer["subject_id"] == "OUT-01"
    assert drawer["legal_basis"].startswith("Rule 88C")
    assert drawer["formula_rendered"], "the formula as executed"
    assert drawer["steps"], "the intermediate terms"
    assert any(
        p["parameter_id"] == "OUT-01" and p["key"] == "pct_threshold" for p in drawer["parameters"]
    ), "the thresholds, with their effective dates"

    # 6. The row in the uploaded spreadsheet.
    resolved = [s for s in drawer["sources"] if s.get("resolved")]
    assert resolved, "the drawer resolves to source rows"
    source = resolved[0]
    assert source["file_name"] == "GSTR1_Jun2025.xlsx"
    assert source["sheet_name"] == "b2b"
    assert source["original_cells"]["Taxable Value"] == "25000000"
    assert source["file_sha256"]


def test_the_parameter_explorer_shows_the_dark_column_at_full_weight(
    db: Session, client: TestClient
) -> None:
    """The NOT_EVALUATED column is not an embarrassment to hide -- it is the
    roadmap, priced."""
    seeded = _seeded(db)
    body = client.get(f"/api/v1/dashboard/parameters?run_id={seeded['run'].id}").json()

    assert len(body["items"]) == 34
    dark = [row for row in body["items"] if row["not_evaluated"] > 0]
    external = [row for row in dark if row["external_feed"]]
    assert {row["param_id"] for row in external} >= {
        "P02",
        "P15",
        "P20",
        "P23",
        "P25",
        "P26",
        "P27",
        "P28",
        "P33",
        "P34",
    }
    for row in external:
        assert row["roadmap_ref"], "a dark parameter names the roadmap item that lights it"
        assert row["drill"]["not_evaluated"], "the dark cell is clickable too"
    assert "not departmental policy" in body["note"]


def test_every_parameter_cell_drills(db: Session, client: TestClient) -> None:
    seeded = _seeded(db)
    body = client.get(f"/api/v1/dashboard/parameters?run_id={seeded['run'].id}").json()
    row = next(item for item in body["items"] if item["param_id"] == "P14")
    response = client.get(f"/api/v1{row['drill']['not_evaluated']}")
    assert response.status_code == 200
    assert response.json()["metric"]["id"] == "M-K03"


def test_the_coverage_sentence_is_on_the_first_screen(db: Session, client: TestClient) -> None:
    seeded = _seeded(db)
    overview = client.get(f"/api/v1/dashboard/overview?run_id={seeded['run'].id}").json()
    sentence = overview["coverage"]["sentence"]
    assert "of 34 parameters" in sentence
    assert overview["coverage"]["awaiting_feeds"]
    assert set(overview["coverage"]["dark_parameters"]) >= {"P02", "P28", "P33"}


def test_revenue_at_risk_separates_the_confidence_tiers(db: Session, client: TestClient) -> None:
    """A Commissioner reading one 'revenue at risk' number needs to know how
    much of it would survive a reply."""
    seeded = _seeded(db)
    overview = client.get(f"/api/v1/dashboard/overview?run_id={seeded['run'].id}").json()
    tiers = {row["confidence"]: row for row in overview["revenue_at_risk_by_confidence"]}
    assert set(tiers) == {"CERTAIN", "STRONG", "ADVISORY"}
    assert "Excluded" in tiers["ADVISORY"]["note"]
    headline = next(t for t in overview["kpi"] if t["metric"] == "M-K05")
    assert Decimal(headline["value"]) == Decimal(tiers["CERTAIN"]["value"]) + Decimal(
        tiers["STRONG"]["value"]
    )


def test_an_unknown_calc_id_is_404_not_an_empty_drawer(client: TestClient) -> None:
    response = client.get("/api/v1/calc/" + "0" * 64)
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "UNKNOWN_CALC_ID"


def test_traces_are_written_once_per_computation(db: Session) -> None:
    """calc_id is the primary key, so a re-run over one snapshot rewrites the
    same rows rather than duplicating them."""
    seeded = _seeded(db)
    before = db.execute(select(CalcTraceRow)).scalars().all()
    assert before

    run_and_store(
        db,
        [seeded["outcome"]],
        snapshot_id=seeded["snapshot"].id,
        as_of=AS_OF,
        triggered_by="sto.pune.4",
        jurisdiction_of={f.GSTIN: "Pune-II"},
    )
    db.flush()
    after = db.execute(select(CalcTraceRow)).scalars().all()
    assert len(after) == len(before)


def test_the_two_scores_are_stored_side_by_side_never_fused(
    db: Session, client: TestClient
) -> None:
    seeded = _seeded(db)
    overview = client.get(f"/api/v1/dashboard/overview?run_id={seeded['run'].id}").json()
    landscape = overview["risk_landscape"]
    assert landscape["p_bands"] and landscape["f_bands"]
    assert "never fused" in landscape["note"]
    assert not any("combined" in key for key in overview)
