"""The departmental matrix, loaded from versioned reference data.

The department sends a spreadsheet; `tools/import_rule_matrix.py` turns it into
JSON that a reviewer can diff, and this reads that. A threshold changing
between two versions of the workbook then shows up as a line in a pull request
rather than as a silently different demand.

Read once at import and never mutated: the catalogue is reference data, and a
run that could edit it would not be replayable.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Final

__all__ = ["APPLICABILITY", "INDUSTRIES", "MATRIX", "Applicability", "MatrixCheck"]

_ROOT: Final[Path] = Path(__file__).resolve().parent.parent.parent / "config" / "rule_matrix"


@dataclass(frozen=True, slots=True)
class MatrixCheck:
    """One row of the departmental matrix, exactly as they wrote it."""

    id: str
    module: str
    check: str
    legal_reference: str
    data_sources: str
    logic: str
    threshold: str
    severity: str
    exposure_basis: str
    action: str


@dataclass(frozen=True, slots=True)
class Applicability:
    """Which trades a check applies to, and the client flag it needs."""

    required_flag: str
    applies_to: frozenset[str]


@lru_cache(maxsize=1)
def _load() -> tuple[tuple[MatrixCheck, ...], dict[str, Applicability], tuple[str, ...]]:
    matrix_file = _ROOT / "matrix.json"
    grid_file = _ROOT / "applicability.json"
    if not matrix_file.exists():
        # The catalogue is optional: a deployment that has not been given the
        # departmental workbook still runs every built check, it simply cannot
        # report against the matrix. Failing to import would take the whole
        # platform down over reference data.
        return (), {}, ()

    raw = json.loads(matrix_file.read_text(encoding="utf-8"))
    checks = tuple(MatrixCheck(**row) for row in raw["checks"])

    if not grid_file.exists():
        return checks, {}, ()
    grid_raw = json.loads(grid_file.read_text(encoding="utf-8"))
    grid = {
        check_id: Applicability(
            required_flag=entry["required_flag"],
            applies_to=frozenset(entry["applies_to"]),
        )
        for check_id, entry in grid_raw["grid"].items()
    }
    return checks, grid, tuple(grid_raw["industries"])


MATRIX: Final[tuple[MatrixCheck, ...]] = _load()[0]
APPLICABILITY: Final[dict[str, Applicability]] = _load()[1]
INDUSTRIES: Final[tuple[str, ...]] = _load()[2]
