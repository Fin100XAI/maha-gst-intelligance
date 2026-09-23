"""Convert the departmental rule-matrix workbook into versioned reference data.

The matrix arrives as `.xlsx`. A spreadsheet is the right thing to *receive* -
it is what the department wrote and what they will send corrections in - and
the wrong thing to *depend on*: a binary blob cannot be diffed, so a threshold
changing between two versions is invisible in review, and that is exactly the
kind of change that moves a demand.

So it is imported once into JSON, committed, and read from there. Re-running
this against a newer workbook produces a diff a law officer can read line by
line.

    python tools/import_rule_matrix.py --xlsx "<path>" --out config/rule_matrix

Two sheets matter. **Rule Matrix** is the 141 checks. **Applicability** is the
rule x industry grid `docs/01` section 12 asks for and which the platform has
never had - it is what makes `NOT_APPLICABLE` possible at all.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Final

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


#: Characters the department writes that the house style does not use.
#: Built from codepoints rather than literals so that the linter which
#: forbids an em dash in this codebase does not flag the code that
#: removes them.
_SUBSTITUTIONS: Final[dict[int, str]] = {
    0x2014: "-",  # em dash
    0x2013: "-",  # en dash
    0x2264: "<=",  # less than or equal
    0x2265: ">=",  # greater than or equal
}


def _clean(value: object) -> str:
    """A cell as a string, with the em dashes the house style forbids removed."""
    if value is None:
        return ""
    text = str(value).strip()
    # Written as escapes rather than literals: the house style forbids an em
    # dash in this codebase, and a linter that enforces that cannot tell a
    # rule from the code that removes it.
    return text.translate(_SUBSTITUTIONS)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xlsx", required=True)
    parser.add_argument("--out", default="config/rule_matrix")
    args = parser.parse_args()

    from openpyxl import load_workbook  # noqa: PLC0415 - a tool-only dependency

    book = load_workbook(Path(args.xlsx), read_only=True, data_only=True)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    # --- the 141 checks ----------------------------------------------------
    rows = list(book["Rule Matrix"].iter_rows(values_only=True))
    header = [_clean(c) for c in rows[0]]
    checks: list[dict[str, str]] = []
    for row in rows[1:]:
        if not row[0]:
            continue
        record = {header[i]: _clean(cell) for i, cell in enumerate(row) if i < len(header)}
        checks.append(
            {
                "id": record["Rule ID"],
                "module": record["Module"],
                "check": record["Check"],
                "legal_reference": record["Legal Reference"],
                "data_sources": record["Data Sources"],
                "logic": record["Logic / Test"],
                "threshold": record["Threshold"],
                "severity": record["Severity"],
                "exposure_basis": record["Exposure Basis"],
                "action": record["Action"],
            }
        )
    (out / "matrix.json").write_text(
        json.dumps({"count": len(checks), "checks": checks}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    # --- the industry grid -------------------------------------------------
    grid_rows = list(book["Applicability"].iter_rows(values_only=True))
    grid_header = [_clean(c) for c in grid_rows[0]]
    industries = grid_header[4:]
    grid: dict[str, dict[str, Any]] = {}
    for row in grid_rows[1:]:
        if not row[0]:
            continue
        cells = [_clean(c) for c in row]
        grid[cells[0]] = {
            "required_flag": cells[3],
            # "Y" means it applies. Anything else - blank, "N" - means it does
            # not, and the check reports NOT_APPLICABLE rather than CLEAR.
            "applies_to": [
                industries[i]
                for i, value in enumerate(cells[4 : 4 + len(industries)])
                if value.upper() == "Y"
            ],
        }
    (out / "applicability.json").write_text(
        json.dumps({"industries": industries, "grid": grid}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"{len(checks)} checks -> {out / 'matrix.json'}")
    print(f"{len(grid)} rows x {len(industries)} industries -> {out / 'applicability.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
