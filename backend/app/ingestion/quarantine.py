"""Quarantine: nothing is silently dropped.

Every row that cannot be canonicalised lands here with a machine-readable
reason code, an officer-readable reason, the offending field, and **the
original cells verbatim**.  That last part is what makes replay possible: fix
the mapping, press Replay, and the rows move out of quarantine without a
re-upload.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

__all__ = ["QuarantineReason", "QuarantinedRow", "RowLedger"]


class QuarantineReason(StrEnum):
    """Why a row did not become a canonical record."""

    SHEET_UNRECOGNISED = "SHEET_UNRECOGNISED"
    HEADER_NOT_FOUND = "HEADER_NOT_FOUND"
    MAPPING_REQUIRED = "MAPPING_REQUIRED"
    COERCION_FAILED = "COERCION_FAILED"
    VALIDATION_FAILED = "VALIDATION_FAILED"
    REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING"
    CROSS_FIELD_MISMATCH = "CROSS_FIELD_MISMATCH"
    #: The sheet carries tax columns the lexicon did not recognise.  Parsing
    #: the row would record its tax as zero, which is worse than holding it.
    TAX_COLUMN_UNMAPPED = "TAX_COLUMN_UNMAPPED"
    GSTIN_INVALID = "GSTIN_INVALID"
    ROW_EMPTY = "ROW_EMPTY"
    TOTALS_ROW = "TOTALS_ROW"
    #: The platform knows exactly what this sheet is and has no canonical
    #: table for it yet -- GSTR-1 Table 13, the HSN summary, the challan
    #: register, GSTR-7. Distinct from SHEET_UNRECOGNISED on purpose: "we
    #: could not read your file" and "we have not built this yet" are
    #: different statements, only one of them is true, and only one tells an
    #: officer what to do next.
    SHEET_NOT_INGESTED = "SHEET_NOT_INGESTED"


@dataclass(frozen=True, slots=True)
class QuarantinedRow:
    sheet_name: str
    row_index: int
    reason_code: QuarantineReason
    reason: str
    original_cells: dict[str, Any]
    field_name: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "sheet_name": self.sheet_name,
            "row_index": self.row_index,
            "reason_code": self.reason_code.value,
            "reason": self.reason,
            "field": self.field_name,
            "original_cells": self.original_cells,
        }


@dataclass
class RowLedger:
    """The count that must reconcile on screen.

    ``rows_in == parsed + quarantined + duplicates``.  :meth:`assert_reconciled`
    is called at the end of every sheet and every upload; a mismatch is a bug in
    the pipeline, not a data problem, and it fails loudly.
    """

    rows_in: int = 0
    parsed: int = 0
    duplicates: int = 0
    quarantined_rows: list[QuarantinedRow] = field(default_factory=list)

    @property
    def quarantined(self) -> int:
        return len(self.quarantined_rows)

    def saw_row(self) -> None:
        self.rows_in += 1

    def accept(self) -> None:
        self.parsed += 1

    def duplicate(self) -> None:
        self.duplicates += 1

    def quarantine(
        self,
        *,
        sheet_name: str,
        row_index: int,
        reason_code: QuarantineReason,
        reason: str,
        original_cells: dict[str, Any],
        field_name: str | None = None,
    ) -> None:
        self.quarantined_rows.append(
            QuarantinedRow(
                sheet_name=sheet_name,
                row_index=row_index,
                reason_code=reason_code,
                reason=reason,
                original_cells=original_cells,
                field_name=field_name,
            )
        )

    def merge(self, other: RowLedger) -> None:
        self.rows_in += other.rows_in
        self.parsed += other.parsed
        self.duplicates += other.duplicates
        self.quarantined_rows.extend(other.quarantined_rows)

    def reconciles(self) -> bool:
        return self.rows_in == self.parsed + self.quarantined + self.duplicates

    def assert_reconciled(self, where: str) -> None:
        if not self.reconciles():
            raise AssertionError(
                f"{where}: row identity broken -- "
                f"in {self.rows_in} != parsed {self.parsed} "
                f"+ quarantined {self.quarantined} + duplicates {self.duplicates}"
            )

    def as_dict(self) -> dict[str, Any]:
        return {
            "rows_in": self.rows_in,
            "parsed": self.parsed,
            "quarantined": self.quarantined,
            "duplicates": self.duplicates,
            "reconciles": self.reconciles(),
        }
