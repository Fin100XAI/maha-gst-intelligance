"""Write the ten sample filing sets to disk.

    python -m app.seed --out ../samples/datasets

Produces, for each of the ten businesses, a GSTR-1, a GSTR-3B and a
GSTR-2B in that business's dialect, plus a manifest stating what each set
contains and what the platform should conclude from it.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from app.seed.datasets import DIALECTS, MANIFEST, build_all


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", default="../samples/datasets", help="directory to write into")
    parser.add_argument("--fy-start-year", type=int, default=2025)
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    rows: list[str] = []
    for filing in build_all(fy_start_year=args.fy_start_year):
        stem = f"{filing.dialect.key}_{filing.business.trade_name.replace(' ', '_')}"
        suffix = "csv" if filing.dialect.container == "csv" else "xlsx"
        (out / f"{stem}_GSTR1.{suffix}").write_bytes(filing.gstr1)
        (out / f"{stem}_GSTR3B.xlsx").write_bytes(filing.gstr3b)
        (out / f"{stem}_GSTR2B.xlsx").write_bytes(filing.gstr2b)
        rows.append(
            f"| {filing.dialect.label} | {filing.business.trade_name} "
            f"| `{filing.business.gstin}` | {filing.business.division} "
            f"| {filing.business.defect} |"
        )
        print(f"wrote {stem} ({filing.dialect.label})")

    (out / "MANIFEST.json").write_text(json.dumps(MANIFEST, indent=2), encoding="utf-8")
    (out / "README.md").write_text(_readme(rows), encoding="utf-8")
    print(f"\n{len(DIALECTS)} sets written to {out.resolve()}")
    return 0


def _readme(rows: list[str]) -> str:
    return (
        "# Ten sample filing sets\n\n"
        "**These are synthetic.** Filed GST returns are confidential under section 158 of\n"
        "the CGST Act, so there is no public corpus to download and anybody offering one\n"
        "is offering something they should not have. These were built instead: ten\n"
        "businesses, twelve months each, GSTR-1, GSTR-3B and GSTR-2B, with arithmetic\n"
        "that holds together and discrepancies that are there on purpose.\n\n"
        "What makes them useful is that **no two are shaped alike**. A department\n"
        "receives the portal's own export, a Tally dump, a consultant's working file with\n"
        "rupee signs typed into the cells, a CSV somebody made by saving a sheet, and a\n"
        "file whose headings are in Marathi. Each set below is one of those shapes.\n\n"
        "Upload all three. The gap between the GSTR-1 and the GSTR-3B is the outward\n"
        "finding; the gap between the GSTR-3B and the GSTR-2B is the credit finding.\n"
        "They are independent - a business can declare its sales honestly and still\n"
        "over-claim credit.\n\n"
        "| Shape | Business | GSTIN | Division | What is wrong with it |\n"
        "|---|---|---|---|---|\n" + "\n".join(rows) + "\n\n"
        "`MANIFEST.json` states the expected shortfall per business, so these double as\n"
        "an acceptance fixture: if ingestion regresses, the numbers stop matching.\n"
    )


if __name__ == "__main__":
    raise SystemExit(main())
