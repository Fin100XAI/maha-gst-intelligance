"""Ingest every filed workbook and run each taxpayer against the 141 checks.

This is the whole demo in one command: real portal downloads in, the
departmental matrix out, nothing seeded and nothing faked.

    python tools/run_matrix.py --db matrix.db --out ../reports_out/matrix

It writes one JSON per taxpayer and one portfolio summary. Those files carry
real GSTINs and turnover, so the output directory is gitignored.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.canonical import FinancialYear
from app.db.models import Snapshot, Taxpayer
from app.engine.context import RuleContext
from app.engine.load import load_taxpayer_data
from app.engine.params import ParameterSet
from app.engine.runner import run_for_taxpayer
from app.ingestion.persist import persist_report
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import read_workbook
from app.matrix import MATRIX, run_matrix
from app.matrix.mapping import coverage_note


def _workbooks(folder: Path) -> list[Path]:
    """The filed portal downloads, which all carry `All_Report` in the name."""
    return sorted(p for p in folder.glob("*.xlsx") if "All_Report" in p.name.replace(" ", "_"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="matrix.db")
    parser.add_argument("--uploads", default="uploads")
    parser.add_argument("--fy", type=int, default=2025)
    parser.add_argument("--out", default="../reports_out/matrix")
    args = parser.parse_args()

    files = _workbooks(Path(args.uploads))
    if not files:
        print(f"no filed workbooks under {args.uploads}")
        return 1
    print(f"{len(files)} filed workbooks\n")

    engine = create_engine(f"sqlite:///{args.db}")
    year = FinancialYear(args.fy)

    # --- ingest ------------------------------------------------------------
    # Every workbook lands in ONE snapshot. A snapshot is a scan of the
    # portfolio at a point in time; giving each file its own would mean the
    # last one ingested was the only taxpayer any portfolio query could see,
    # which is exactly what happened on the first run.
    shared_snapshot: str | None = None
    with Session(engine) as session:
        for path in files:
            report = ingest_sheets(read_workbook(path), filename=path.name)
            _, snap = persist_report(
                session,
                report,
                uploaded_by="matrix-run",
                storage_key=path.name,
                size_bytes=path.stat().st_size,
                snapshot_id=shared_snapshot,
                snapshot_description="portfolio scan",
            )
            shared_snapshot = snap.id
            session.commit()
            ledger = report.ledger
            print(
                f"  {path.name[:56]:58s} "
                f"in {ledger.rows_in:6d} = read {ledger.parsed:6d} "
                f"+ held {ledger.quarantined:4d} + dup {ledger.duplicates:4d} "
                f"{'OK' if ledger.reconciles() else 'DOES NOT RECONCILE'}"
            )

    # --- run ---------------------------------------------------------------
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    summary: list[dict[str, Any]] = []

    with Session(engine) as session:
        snapshot = session.get(Snapshot, shared_snapshot)
        assert snapshot is not None
        taxpayers = session.execute(select(Taxpayer)).scalars().all()
        print(f"\n{len(taxpayers)} taxpayers, {len(MATRIX)} departmental checks each\n")

        for taxpayer in taxpayers:
            data = load_taxpayer_data(session, taxpayer.gstin, snapshot.id)
            if not data.outward and not data.inward and not data.returns_3b:
                continue
            context = RuleContext(
                data=data,
                fy=year,
                snapshot_id=snapshot.id,
                params=ParameterSet(),
                as_of=year.end,
            )
            outcome = run_for_taxpayer(context)
            result = run_matrix(
                taxpayer.gstin,
                year.label,
                list(outcome.findings),
                legal_name=taxpayer.legal_name,
                industry=None,
            )
            (out / f"{taxpayer.gstin}.json").write_text(
                json.dumps(result.as_dict(), indent=2, ensure_ascii=False), encoding="utf-8"
            )
            counts = result.counts
            print(
                f"  {taxpayer.gstin}  {(taxpayer.legal_name or '')[:30]:32s} "
                f"FAIL {counts.get('FAIL', 0):3d}  "
                f"PASS {counts.get('PASS', 0):3d}  "
                f"dark {counts.get('NOT_EVALUATED', 0):3d}  "
                f"not built {counts.get('NOT_BUILT', 0):3d}  "
                f"exposure {result.exposure.total:>16,.2f}"
            )
            summary.append(
                {
                    "gstin": taxpayer.gstin,
                    "legal_name": taxpayer.legal_name,
                    "counts": counts,
                    "exposure_total": format(result.exposure.total, "f"),
                    "failed_checks": [
                        {
                            "id": r.check.id,
                            "check": r.check.check,
                            "exposure": format(r.exposure.total, "f"),
                        }
                        for r in result.rows
                        if r.status == "FAIL"
                    ],
                }
            )

    (out / "portfolio.json").write_text(
        json.dumps(
            {
                "fy": year.label,
                "snapshot": snapshot.id,
                "matrix_size": len(MATRIX),
                "coverage_note": coverage_note(len(MATRIX)),
                "taxpayers": summary,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\n{coverage_note(len(MATRIX))}")
    print(f"written to {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
