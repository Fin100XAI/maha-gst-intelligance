"""Run every buildable report for one taxpayer and save what comes out.

Not a test and not part of the suite: this is the thing you run before a demo
to see, on real data, what the officer will see. It writes one JSON per report
and one CSV of the working, because the CSV is what gets sent to the taxpayer.

    python tools/run_reports.py --db v6.db --gstin 27AAPCS8928R1Z1 --out ../reports_out

Every figure it writes is a string. A report serialised through a float is a
report that can be wrong in the eighteenth place, and these files are the ones
that leave the building.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.canonical import FinancialYear
from app.db.models import Snapshot
from app.engine.load import load_taxpayer_data
from app.reports.registry import PLANNED, REPORTS, build


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="v6.db")
    parser.add_argument("--gstin", required=True)
    parser.add_argument("--fy", type=int, default=2025)
    parser.add_argument("--out", default="../reports_out")
    args = parser.parse_args()

    engine = create_engine(f"sqlite:///{args.db}")
    with Session(engine) as session:
        snapshot = (
            session.execute(select(Snapshot).order_by(Snapshot.created_at.desc())).scalars().first()
        )
        if snapshot is None:
            print(f"no snapshot in {args.db}")
            return 1
        data = load_taxpayer_data(session, args.gstin, snapshot.id)

    year = FinancialYear(args.fy)
    out = Path(args.out) / args.gstin / year.label.replace("/", "-")
    out.mkdir(parents=True, exist_ok=True)

    index: list[dict[str, object]] = []
    print(f"snapshot {snapshot.id}\n{args.gstin}  {year.label}\n")

    for report_id, spec in REPORTS.items():
        report = build(report_id, data, year.label, year.periods)
        payload = report.as_dict()
        (out / f"{report_id}.json").write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        if report.rows and report.columns:
            with (out / f"{report_id}.csv").open("w", newline="", encoding="utf-8-sig") as handle:
                writer = csv.DictWriter(
                    handle, fieldnames=list(report.columns), extrasaction="ignore"
                )
                writer.writeheader()
                for row in report.rows:
                    writer.writerow(row.cells)

        state = "OK " if report.evaluated else "DARK"
        print(f"  [{state}] {spec.title}")
        print(f"         {report.headline[:150]}")
        index.append(
            {
                "id": report_id,
                "title": spec.title,
                "group": spec.group,
                "evaluated": report.evaluated,
                "rows": len(report.rows),
                "headline": report.headline,
            }
        )

    for planned in PLANNED.values():
        print(f"  [PLAN] {planned.title} - needs {planned.needs}")
        index.append(
            {
                "id": planned.id,
                "title": planned.title,
                "group": planned.group,
                "evaluated": False,
                "planned": True,
                "needs": planned.needs,
            }
        )

    (out / "index.json").write_text(
        json.dumps(
            {"gstin": args.gstin, "fy": year.label, "snapshot": snapshot.id, "reports": index},
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\nwritten to {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
