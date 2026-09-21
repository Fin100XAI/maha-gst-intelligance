"""Workbook reading.

openpyxl only -- deliberately not pandas.  pandas would infer dtypes, turn a
column of rupees into binary floats, and coerce a blank into NaN, all before
this code sees the cell.  Every value arrives here exactly as the file holds
it, and every number becomes an exact Decimal at the boundary.
"""

from __future__ import annotations

import csv
import io
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Final

from app.money import to_decimal

__all__ = ["RawSheet", "read_bytes", "read_csv", "read_workbook"]

#: Read no further than this into a sheet in one pass.  A GSTR-1 export for a
#: large taxpayer is big; a runaway file should not exhaust the worker.
MAX_ROWS: Final[int] = 1_000_000
MAX_COLUMNS: Final[int] = 200


@dataclass(frozen=True, slots=True)
class RawSheet:
    """One sheet, cells untouched except that numbers are exact Decimals."""

    name: str
    index: int
    rows: list[list[Any]]

    @property
    def row_count(self) -> int:
        return len(self.rows)

    def sample(self, count: int = 20) -> list[list[Any]]:
        return self.rows[:count]


def _normalise(value: Any) -> Any:
    """Convert a spreadsheet number to an exact Decimal; leave everything else.

    Dates and datetimes are left as they are so that :mod:`coerce` can tell an
    already-typed date from an Excel serial.
    """
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else None
    if isinstance(value, (int,)):
        return to_decimal(value)
    # datetime/date pass through; anything else numeric becomes a Decimal.
    if hasattr(value, "year") and hasattr(value, "month"):
        return value
    try:
        return to_decimal(value)
    except Exception:
        return value


def read_workbook(source: Path | bytes | io.BytesIO) -> list[RawSheet]:
    """Read every sheet of an .xlsx/.xlsm workbook.

    A sheet that cannot be read does not stop the workbook: it comes back with
    an empty row list, and the pipeline quarantines it with a reason.  Never
    reject a whole workbook because one sheet is unreadable.
    """
    from openpyxl import load_workbook  # noqa: PLC0415
    # Imported here, not at module scope, so `import app` works with the
    # optional spreadsheet dependency absent.

    handle: Any
    if isinstance(source, Path):
        handle = source
    elif isinstance(source, bytes):
        handle = io.BytesIO(source)
    else:
        handle = source

    workbook = load_workbook(handle, data_only=True, read_only=True)
    sheets: list[RawSheet] = []
    try:
        for index, name in enumerate(workbook.sheetnames):
            try:
                worksheet = workbook[name]
                rows: list[list[Any]] = []
                for row_number, row in enumerate(worksheet.iter_rows(values_only=True)):
                    if row_number >= MAX_ROWS:
                        break
                    rows.append([_normalise(cell) for cell in row[:MAX_COLUMNS]])
            except Exception:
                rows = []
            sheets.append(RawSheet(name=name, index=index, rows=rows))
    finally:
        workbook.close()
    return sheets


def read_csv(source: Path | bytes, *, name: str = "csv") -> list[RawSheet]:
    """Read a CSV or TSV as a single sheet."""
    if isinstance(source, Path):
        text = source.read_text(encoding="utf-8-sig", errors="replace")
        name = source.stem
    else:
        text = source.decode("utf-8-sig", errors="replace")

    sample = text[:4096]
    try:
        dialect: Any = csv.Sniffer().sniff(sample, delimiters=",;\t|")
    except csv.Error:
        dialect = csv.excel

    rows = [[_normalise(cell) for cell in row] for row in csv.reader(io.StringIO(text), dialect)]
    return [RawSheet(name=name, index=0, rows=rows)]


def read_bytes(payload: bytes, filename: str) -> list[RawSheet]:
    """Dispatch on the file extension, after the upload allow-list has passed."""
    suffix = Path(filename).suffix.lower()
    if suffix in {".csv", ".tsv", ".txt"}:
        return read_csv(payload, name=Path(filename).stem)
    return read_workbook(payload)
