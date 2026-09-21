"""``make demo`` -- reset, seed, ingest, run the engine, roll up.

Everything downstream of this command reads real ingested rows with real
provenance, so the demonstration path that matters -- a figure on the
Commissioner's dashboard to a cell in a spreadsheet -- is exercised end to end
rather than mocked.
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import Session, sessionmaker

from app.aggregation.rollup import run_and_store
from app.canonical import Period
from app.db.base import Base
from app.db.models import OutwardLine, Taxpayer
from app.engine.context import RuleContext
from app.engine.graph import InvoiceGraph
from app.engine.params import ParameterSet
from app.engine.peers import CohortKey, PeerBands
from app.engine.records import (
    EInvoiceRecord,
    FilingRecord,
    OutwardRecord,
    Return3BRecord,
    TaxpayerData,
    TaxpayerProfile,
)
from app.engine.runner import TaxpayerOutcome, run_for_taxpayer
from app.ingestion.persist import persist_report
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import read_workbook
from app.money import D, TaxVector
from app.seed.synthetic import PROFILES, SyntheticTaxpayer, build_workbook

__all__ = ["main", "seed"]

AS_OF = date(2026, 9, 20)

#: Taxpayer 2 gets the Marathi-headed sheet, so the synonym lexicon is
#: exercised on Devanagari headers every time the demo runs.
_MARATHI_SHEET_TAXPAYER = 2


def _counterparties(exclude: str) -> tuple[str, ...]:
    """Other taxpayers in the set, so the invoice graph has real edges."""
    return tuple(p.gstin for p in PROFILES if p.gstin != exclude)[:4]


def _periods(taxpayer: SyntheticTaxpayer) -> tuple[Period, ...]:
    return taxpayer.financial_year.periods


def _profile(taxpayer: SyntheticTaxpayer) -> TaxpayerProfile:
    shape = taxpayer.shape
    return TaxpayerProfile(
        gstin=taxpayer.gstin,
        pan=taxpayer.pan,
        legal_name=taxpayer.legal_name,
        trade_name=taxpayer.trade_name,
        state_code="27",
        registration_date=date(2017, 7, 1),
        cancellation_date=(
            date.fromisoformat(shape["cancelled_on"]) if shape.get("cancelled_on") else None
        ),
        aato=taxpayer.turnover,
        sector_code=taxpayer.sector_code,
        commissionerate="Pune Zone",
        division=taxpayer.division,
        officer_id=taxpayer.officer_id,
        address_norm_hash="shared-address-hash" if shape.get("shared_address") else None,
    )


def _filings(taxpayer: SyntheticTaxpayer) -> tuple[FilingRecord, ...]:
    """Filing history, shaped by what each profile is built to fire."""
    shape = taxpayer.shape
    late = int(shape.get("late_returns", 0))
    unfiled_from = shape.get("unfiled_from")
    rows: list[FilingRecord] = []
    for index, period in enumerate(_periods(taxpayer)):
        due = date(period.next.year, period.next.month, 20)
        if unfiled_from and period >= Period.parse(str(unfiled_from)):
            rows.append(
                FilingRecord(
                    gstin=taxpayer.gstin,
                    return_type="GSTR3B",
                    period=period,
                    due_date=due,
                    filing_date=None,
                    status="NOT_FILED",
                )
            )
            continue
        delay = 25 if index < late else 0
        filed = date.fromordinal(due.toordinal() + delay)
        rows.append(
            FilingRecord(
                gstin=taxpayer.gstin,
                return_type="GSTR3B",
                period=period,
                due_date=due,
                filing_date=filed,
                status="FILED",
            )
        )
    return tuple(rows)


def _return_3b(taxpayer: SyntheticTaxpayer, period: Period, outward: TaxVector) -> Any:
    """A GSTR-3B consistent with the workbook, adjusted by the profile's shape.

    Head-wise: the control taxpayer's 3B must match its GSTR-1 under **each**
    head, or OUT-01 fires on it and the control stops being a control.
    """
    shape = taxpayer.shape
    taxable = (taxpayer.turnover / Decimal(12)).quantize(Decimal("0.01"))

    declared = outward
    if shape.get("out01_shortfall_pct"):
        keep = (Decimal("100") - D(shape["out01_shortfall_pct"])) / Decimal("100")
        declared = outward.scale(keep)

    # Credit taken is bounded by credit available, so the utilisation identity
    # (R9 / PAY-06) holds unless a profile is built to break it.
    available = declared.scale(Decimal("0.80"))
    through_credit = available.scale(Decimal("0.90"))
    in_cash = declared - through_credit

    cells: dict[str, Decimal] = {"t31a_taxable": taxable}
    for head in ("igst", "cgst", "sgst", "cess"):
        cells[f"t31a_{head}"] = getattr(declared, head)
        cells[f"payable_{head}"] = getattr(declared, head)
        cells[f"t4a5_{head}"] = getattr(available, head)
        cells[f"t4c_{head}"] = getattr(available, head)
        cells[f"paid_itc_{head}"] = getattr(through_credit, head)
        cells[f"paid_cash_{head}"] = getattr(in_cash, head)

    if shape.get("exempt_share"):
        cells["t31c_taxable"] = (taxable * D(shape["exempt_share"])).quantize(Decimal("0.01"))
    return Return3BRecord(gstin=taxpayer.gstin, period=period, cells=cells)


def _einvoices(
    taxpayer: SyntheticTaxpayer, outward: tuple[OutwardRecord, ...]
) -> tuple[EInvoiceRecord, ...]:
    """IRNs for the documents this taxpayer reported.

    Above the e-invoicing threshold, a B2B document without an IRN is not a
    valid document, so a compliant taxpayer must have them.  Profile 7 is built
    to have none (EIN-01) and profile 8 to report them late (EIN-02); the rest
    are given IRNs acknowledged on the document date.
    """
    if taxpayer.shape.get("no_irns"):
        return ()
    lag = int(taxpayer.shape.get("irn_lag_days", 0))
    rows: list[EInvoiceRecord] = []
    for index, row in enumerate(outward):
        if row.section != "B2B" or row.doc_date is None:
            continue
        rows.append(
            EInvoiceRecord(
                gstin=taxpayer.gstin,
                irn=f"{index:064x}",
                ack_date=date.fromordinal(row.doc_date.toordinal() + lag),
                doc_no=row.doc_no,
                doc_date=row.doc_date,
                taxable_value=row.taxable_value,
                igst=row.igst,
                cgst=row.cgst,
                sgst=row.sgst,
                cess=row.cess,
                counterparty_gstin=row.counterparty_gstin,
                period=row.period,
            )
        )
    return tuple(rows)


def seed(session: Session, *, as_of: date = AS_OF) -> dict[str, Any]:
    """Ingest a workbook per taxpayer, run the engine, persist and roll up."""
    # Reset: the demo is reproducible, so it starts from nothing.
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(delete(table))
    session.flush()

    graph = InvoiceGraph()
    outcomes: list[TaxpayerOutcome] = []
    jurisdiction_of: dict[str, str] = {}
    officer_of: dict[str, str] = {}
    report_rows: list[dict[str, Any]] = []
    snapshot_id: str | None = None

    for taxpayer in PROFILES:
        session.add(
            Taxpayer(
                gstin=taxpayer.gstin,
                pan=taxpayer.pan,
                legal_name=taxpayer.legal_name,
                trade_name=taxpayer.trade_name,
                state_code="27",
                registration_date=date(2017, 7, 1),
                cancellation_date=(
                    date.fromisoformat(taxpayer.shape["cancelled_on"])
                    if taxpayer.shape.get("cancelled_on")
                    else None
                ),
                aato=taxpayer.turnover,
                sector_code=taxpayer.sector_code,
                commissionerate="Pune Zone",
                division=taxpayer.division,
                officer_id=taxpayer.officer_id,
            )
        )
        jurisdiction_of[taxpayer.gstin] = taxpayer.division
        officer_of[taxpayer.gstin] = taxpayer.officer_id

    session.flush()

    for taxpayer in PROFILES:
        periods = _periods(taxpayer)
        payload = build_workbook(
            taxpayer,
            periods=periods,
            counterparties=_counterparties(taxpayer.gstin),
            marathi_sheet=taxpayer.number == _MARATHI_SHEET_TAXPAYER,
        )
        report = ingest_sheets(
            read_workbook(payload),
            filename=f"GSTR1_{taxpayer.trade_name.replace(' ', '')}_{taxpayer.fy}.xlsx",
            payload=payload,
            owner_gstin=taxpayer.gstin,
            supplier_state="27",
        )
        _, snapshot = persist_report(
            session,
            report,
            uploaded_by="demo",
            storage_key=f"demo/{taxpayer.gstin}.xlsx",
            size_bytes=len(payload),
            snapshot_id=snapshot_id,
            snapshot_description="Synthetic demonstration dataset",
        )
        snapshot_id = snapshot.id
        report_rows.append(
            {
                "taxpayer": taxpayer.number,
                "gstin": taxpayer.gstin,
                **report.ledger.as_dict(),
            }
        )

    session.flush()
    if snapshot_id is None:
        # Nothing was ingested, so there is nothing to run the engine over.
        # Raising beats continuing with an empty snapshot that would look like
        # a clean taxpayer population.
        raise RuntimeError("no workbook was ingested: refusing to seed an empty snapshot")

    # Build the engine's view from the rows that were actually ingested, so
    # every finding cites a real canonical row with real provenance.
    for taxpayer in PROFILES:
        rows = (
            session.execute(select(OutwardLine).where(OutwardLine.gstin == taxpayer.gstin))
            .scalars()
            .all()
        )
        outward = tuple(
            OutwardRecord(
                gstin=row.gstin,
                period=Period.parse(row.period) if row.period else _periods(taxpayer)[0],
                section=row.section,
                doc_type=row.doc_type,
                doc_no=row.doc_no,
                doc_date=row.doc_date,
                counterparty_gstin=row.counterparty_gstin,
                pos=row.pos,
                rate=row.rate,
                taxable_value=row.taxable_value,
                igst=row.igst,
                cgst=row.cgst,
                sgst=row.sgst,
                cess=row.cess,
                hsn=row.hsn,
                row_id=row.id,
                prov_id=row.prov_id,
            )
            for row in rows
        )
        for row in outward:
            if row.counterparty_gstin:
                graph.add(taxpayer.gstin, row.counterparty_gstin, row.taxable_value)

        by_period: dict[Period, TaxVector] = {}
        for row in outward:
            by_period[row.period] = by_period.get(row.period, TaxVector()) + row.signed_tax
        returns = tuple(
            _return_3b(taxpayer, period, by_period.get(period, TaxVector()))
            for period in _periods(taxpayer)
        )

        data = TaxpayerData(
            profile=_profile(taxpayer),
            outward=outward,
            returns_3b=returns,
            einvoices=_einvoices(taxpayer, outward),
            filings=_filings(taxpayer),
        )
        outcomes.append(
            run_for_taxpayer(
                RuleContext(
                    data=data,
                    fy=taxpayer.financial_year,
                    snapshot_id=snapshot_id,
                    params=ParameterSet(),
                    as_of=as_of,
                    peers=_peer_bands(),
                    graph=graph,
                ),
                with_identities=True,
            )
        )

    run, counts = run_and_store(
        session,
        outcomes,
        snapshot_id=snapshot_id,
        as_of=as_of,
        triggered_by="demo",
        jurisdiction_of=jurisdiction_of,
        officer_of=officer_of,
    )
    session.commit()

    return {
        "engine_run_id": run.id,
        "snapshot_id": snapshot_id,
        "taxpayers": len(PROFILES),
        "fact_counts": counts,
        "ingestion": report_rows,
        "findings": sum(len(o.findings) for o in outcomes),
        "triggered": sum(1 for o in outcomes for x in o.findings if x.triggered),
    }


def _peer_bands() -> PeerBands:
    """Cohort bands built from the demonstration set's own spread."""
    observations: dict[str, list[tuple[CohortKey, Decimal]]] = {}
    bands = PeerBands()
    for taxpayer in PROFILES:
        cohort = bands.cohort_for(
            sector=taxpayer.sector_code,
            turnover=taxpayer.turnover,
            jurisdiction=taxpayer.division,
        )
        for param_id in ("P03", "P04", "P05", "P07", "P08", "P10", "P17", "P18", "P31", "P32"):
            observations.setdefault(param_id, []).append(
                (cohort, taxpayer.turnover / Decimal("100000000"))
            )
    # Twelve taxpayers spread across divisions rarely reach the minimum cohort
    # size, and that is the honest outcome: the parameters report
    # NOT_EVALUATED rather than being banded against noise.
    return PeerBands.build(observations)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed the synthetic demonstration dataset.")
    parser.add_argument("--database-url", default="sqlite:///./demo.db")
    parser.add_argument("--as-of", default=AS_OF.isoformat())
    args = parser.parse_args(argv)

    engine = create_engine(args.database_url, future=True)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, future=True, expire_on_commit=False)

    with factory() as session:
        summary = seed(session, as_of=date.fromisoformat(args.as_of))

    print("Synthetic demonstration dataset seeded.")
    print(f"  engine run   {summary['engine_run_id']}")
    print(f"  snapshot     {summary['snapshot_id']}")
    print(f"  taxpayers    {summary['taxpayers']}")
    print(f"  findings     {summary['findings']} ({summary['triggered']} triggered)")
    for name, count in summary["fact_counts"].items():
        print(f"  {name:<24} {count}")
    print("\nIngestion, per taxpayer (rows in = parsed + quarantined + duplicates):")
    for row in summary["ingestion"]:
        print(
            f"  #{row['taxpayer']:<3} {row['gstin']}  in {row['rows_in']:<4}"
            f" parsed {row['parsed']:<4} quarantined {row['quarantined']:<4}"
            f" duplicates {row['duplicates']:<4} reconciles {row['reconciles']}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
