"""The ingestion pipeline.

    upload -> per sheet:
      1 CLASSIFY   against ReturnType fingerprints
      2 LOCATE     the header row, forward-filling merged upper rows
      3 MAP        synonyms -> edit distance -> (agent proposal)
      4 COERCE     money, dates, GSTIN, HSN, rate, booleans
      5 VALIDATE   per-field and cross-field
      6 CANONICALISE
      7 RECONCILE  rows_in = parsed + quarantined + duplicates.  ASSERT.
      8 SNAPSHOT   an immutable, content-hashed dataset version

Three rules govern this module:

* Never reject a whole workbook because one sheet is unrecognised.
* Never silently drop a row.
* Re-uploading the same file is a non-event.
"""

from __future__ import annotations

import hashlib
import re
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any, Final

from app.canonical import DocType, FinancialYear, Period, ReturnType, RowDisposition, SupplySection
from app.ingestion.banner import financial_year_from, legal_name_from, owner_gstin_from
from app.ingestion.coerce import (
    CoercionError,
    coerce_bool,
    coerce_date,
    coerce_gstin,
    coerce_hsn,
    coerce_ims_action,
    coerce_money,
    coerce_period,
    coerce_quantity,
    coerce_rate,
    coerce_state_code,
    coerce_text,
    coerce_uqc,
)
from app.ingestion.header import detect_header
from app.ingestion.invariants import check_invariants
from app.ingestion.quarantine import QuarantineReason, RowLedger
from app.ingestion.reader import RawSheet
from app.ingestion.sniffer import NOT_INGESTED, Classification, classify_sheet
from app.ingestion.synonyms import FieldMatch, match_headers, normalise_header
from app.ingestion.three_b import read_three_b
from app.ingestion.transposition import (
    Verdict,
    correct_transposed,
    detect_transposition,
    is_suspect,
)
from app.ingestion.validators import validate_line

__all__ = [
    "CanonicalRecord",
    "IngestionReport",
    "SheetOutcome",
    "duplicate_key",
    "ingest_sheet",
    "ingest_sheets",
    "period_from_sheet_name",
    "snapshot_hash",
]

#: Families that become transaction lines rather than form cells.
_LINE_FAMILIES: Final[frozenset[str]] = frozenset(
    {"GSTR1", "GSTR2B", "EWAYBILL", "EINVOICE", "LEDGER"}
)

#: canonical field -> the coercer that reads it.
_COERCERS: Final[dict[str, Any]] = {
    "doc_date": coerce_date,
    "ewb_date": coerce_date,
    "ack_date": coerce_date,
    "irn_date": coerce_date,
    "valid_upto": coerce_date,
    "cancelled_on": coerce_date,
    "supplier_filing_date": coerce_date,
    "as_on": coerce_date,
    "period": coerce_period,
    "supplier_return_period": coerce_period,
    "taxable_value": coerce_money,
    "igst": coerce_money,
    "cgst": coerce_money,
    "sgst": coerce_money,
    "cess": coerce_money,
    "doc_value": coerce_money,
    "value": coerce_money,
    "opening": coerce_money,
    "credited": coerce_money,
    "debited": coerce_money,
    "closing": coerce_money,
    "rate": coerce_rate,
    "quantity": coerce_quantity,
    "hsn": coerce_hsn,
    "uqc": coerce_uqc,
    "pos": coerce_state_code,
    "from_state": coerce_state_code,
    "to_state": coerce_state_code,
    "reverse_charge": coerce_bool,
    "part_b_filled": coerce_bool,
    "itc_available": coerce_bool,
    "supplier_3b_filed": coerce_bool,
    "supplier_1_filed": coerce_bool,
    "ims_action": coerce_ims_action,
}

#: The canonical fields read as dates. Derived from the coercer table so a
#: new date column cannot be added without the transposition check seeing it.
_DATE_FIELDS: Final[frozenset[str]] = frozenset(
    {name for name, coercer in _COERCERS.items() if coercer is coerce_date}
)

#: GSTIN columns, and whether a blank is acceptable.  A B2C line legitimately
#: has no counterparty GSTIN; a B2B line without one is not a B2B line.
_GSTIN_FIELDS: Final[dict[str, bool]] = {
    "gstin": False,
    "counterparty_gstin": False,
    "supplier_gstin": False,
    "ecom_gstin": False,
    "from_gstin": False,
    "to_gstin": False,
}

#: Text that marks a trailing totals row, which is not data.
#: A totals row announces itself in one of the first few columns.
_TOTALS_SCAN_COLUMNS: Final[int] = 3

_TOTAL_MARKERS: Final[frozenset[str]] = frozenset(
    {"total", "grand total", "sub total", "subtotal", "totals", "एकूण"}
)


@dataclass(frozen=True, slots=True)
class CanonicalRecord:
    """One canonicalised row, with a pointer back to the cells it came from."""

    family: str
    section: str | None
    fields: dict[str, Any]
    sheet_name: str
    row_index: int
    original_cells: dict[str, Any]

    def wire(self) -> dict[str, Any]:
        """JSON-safe form: money and ratios as strings, dates as ISO."""
        out: dict[str, Any] = {}
        for key, value in self.fields.items():
            if isinstance(value, Decimal):
                out[key] = format(value, "f")
            elif isinstance(value, date):
                out[key] = value.isoformat()
            elif value is not None and hasattr(value, "mmyyyy"):
                out[key] = value.mmyyyy
            else:
                out[key] = value
        return out


@dataclass
class SheetOutcome:
    """What happened to one sheet."""

    sheet_name: str
    sheet_index: int
    classification: Classification
    header_row: int | None
    mapping: list[FieldMatch] = field(default_factory=list)
    records: list[CanonicalRecord] = field(default_factory=list)
    ledger: RowLedger = field(default_factory=RowLedger)
    status: str = "PARSED"
    #: canonical date field -> what the transposition detector said about its
    #: column, and how many cells that verdict moved. Reported rather than
    #: applied silently: a date this platform changed is a date an officer is
    #: entitled to be told about, because the reporting lag computed from it
    #: is what a Rule 48(4) notice would be built on.
    date_corrections: dict[str, dict[str, Any]] = field(default_factory=dict)

    @property
    def unmapped_headers(self) -> list[str]:
        return [m.header for m in self.mapping if m.field is None and m.header.strip()]

    def as_dict(self) -> dict[str, Any]:
        return {
            "sheet_name": self.sheet_name,
            "sheet_index": self.sheet_index,
            "detected_type": self.classification.family,
            "confidence": self.classification.confidence,
            "section": self.classification.section,
            "header_row_index": self.header_row,
            "status": self.status,
            "unmapped_headers": self.unmapped_headers,
            "date_corrections": self.date_corrections,
            "counts": self.ledger.as_dict(),
        }


@dataclass
class IngestionReport:
    """What happened to a whole workbook.  This is what the screen renders."""

    filename: str
    file_sha256: str
    sheets: list[SheetOutcome] = field(default_factory=list)
    ledger: RowLedger = field(default_factory=RowLedger)
    #: The filer's registered name when the workbook's title block states it.
    #: ``None`` leaves the stub registration labelled with its GSTIN, which is
    #: honest but unreadable; a name read from the file is neither invented
    #: nor guessed.
    owner_legal_name: str | None = None

    @property
    def records(self) -> list[CanonicalRecord]:
        return [record for sheet in self.sheets for record in sheet.records]

    def as_dict(self) -> dict[str, Any]:
        return {
            "filename": self.filename,
            "file_sha256": self.file_sha256,
            "counts": self.ledger.as_dict(),
            "sheets": [sheet.as_dict() for sheet in self.sheets],
            "quarantine": [row.as_dict() for row in self.ledger.quarantined_rows],
        }


# ---------------------------------------------------------------------------
# duplicates
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# date transposition
# ---------------------------------------------------------------------------


#: Which date field can vouch for which. An acknowledgement cannot precede
#: the document it acknowledges, so the document date is a witness against the
#: IRN date -- and the only such pair the rulebook actually states. Others
#: would be invented, and an invented witness is how a correct column gets
#: "corrected".
_DATE_WITNESS: Final[dict[str, str]] = {"irn_date": "doc_date"}


def _column_verdicts(
    rows: Sequence[Sequence[object]],
    start: int,
    columns: dict[str, int],
) -> dict[str, Verdict]:
    """Run the transposition detector over every mapped date column.

    Whole columns, before any row is coerced. The signature the detector looks
    for -- every text cell a day above 12, every parsed cell a day of 12 or
    less -- exists only in the column, never in one row, so this cannot be
    decided row by row however convenient that would be.

    Where the sheet also carries the field's witness, that column is handed
    over with it. It is what catches a small column whose dates all happen to
    fall in the first twelve days of their months: Excel parses every one of
    them, so the partition has nothing to see, while every value is wrong.
    """
    verdicts: dict[str, Verdict] = {}
    for name, index in columns.items():
        if name not in _DATE_FIELDS:
            continue
        column = [row[index] if index < len(row) else None for row in rows[start:]]
        witness_at = columns.get(_DATE_WITNESS.get(name, ""))
        witness = (
            None
            if witness_at is None
            else [row[witness_at] if witness_at < len(row) else None for row in rows[start:]]
        )
        verdict = detect_transposition(column, witness=witness)
        if verdict is not Verdict.ABSENT:
            verdicts[name] = verdict
    return verdicts


def _unresolved_date(
    row: Sequence[object],
    columns: dict[str, int],
    verdicts: dict[str, Verdict],
) -> str | None:
    """The first date field on this row whose value cannot be resolved.

    Only under ``AMBIGUOUS``, and only for a cell that a swap could actually
    have produced. A text cell was never parsed and a parsed cell with a day
    above 12 cannot have been swapped; both are safe to read, and holding them
    would quarantine thousands of rows that were never in doubt.
    """
    for name, verdict in verdicts.items():
        if verdict is not Verdict.AMBIGUOUS:
            continue
        index = columns[name]
        if index < len(row) and is_suspect(row[index]):
            return name
    return None


def _undo_transposition(
    row: Sequence[object],
    columns: dict[str, int],
    verdicts: dict[str, Verdict],
) -> tuple[list[object], dict[str, int]]:
    """Put the ``CERTAIN`` columns back the way the taxpayer wrote them.

    Returns the repaired row and a count per field, so the sheet's report can
    say how many cells moved rather than only that something did.
    """
    repaired = list(row)
    moved: dict[str, int] = {}
    for name, verdict in verdicts.items():
        if verdict is not Verdict.CERTAIN:
            continue
        index = columns[name]
        if index >= len(repaired):
            continue
        before = repaired[index]
        after = correct_transposed(before)
        if after is not before:
            repaired[index] = after
            moved[name] = 1
    return repaired, moved


def duplicate_key(record: CanonicalRecord) -> str:
    """docs/02 section 3: (gstin, period, return_type, doc_no, doc_date,
    counterparty, taxable_value).

    Re-uploading the same file must be a non-event, so the key is derived from
    the content of the row and never from its position in the sheet.
    """
    fields = record.fields
    counterparty = (
        fields.get("counterparty_gstin")
        or fields.get("supplier_gstin")
        or fields.get("to_gstin")
        or ""
    )
    period = fields.get("period")
    parts = [
        str(fields.get("gstin") or ""),
        period.mmyyyy if period is not None and hasattr(period, "mmyyyy") else "",
        record.family,
        record.section or "",
        str(fields.get("doc_no") or fields.get("ewb_no") or fields.get("irn") or ""),
        str(fields.get("doc_date") or fields.get("as_on") or ""),
        str(counterparty),
        format(fields.get("taxable_value") or fields.get("value") or Decimal("0.00"), "f"),
        str(fields.get("head") or ""),
        str(fields.get("rate") or ""),
    ]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def snapshot_hash(records: list[CanonicalRecord]) -> str:
    """A content hash over the canonical rows, independent of their order.

    Order independence matters: two uploads of the same data in a different
    sheet order are the same dataset, and a snapshot that said otherwise would
    make replay comparisons meaningless.
    """
    digests = sorted(duplicate_key(record) for record in records)
    return hashlib.sha256("|".join(digests).encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# the pipeline
# ---------------------------------------------------------------------------


def _is_empty_row(row: list[Any]) -> bool:
    return not any(cell is not None and str(cell).strip() for cell in row)


#: What a ledger writes where a transaction would be, to mark the state of
#: the account rather than a movement of it.
_BALANCE_MARKERS: Final[frozenset[str]] = frozenset(
    {"opening balance", "closing balance", "balance brought forward", "balance carried forward"}
)


def _is_balance_marker(row: list[Any]) -> bool:
    """Whether this ledger row states a balance rather than a movement.

    A cash ledger opens and closes every month with such a row. It carries no
    date because there is no date: it is the state of the account before
    anything happened, not something that happened. Requiring ``as_on`` of it
    held two rows a month per filer and reported each as a missing field in
    the department's file -- 192 rows across nine filed workbooks, none of
    them a fault in the file.

    Matched on a cell's whole value rather than on a substring of the row,
    because "balance" appears in the balance columns of every real movement
    too, and skipping those would lose the ledger entirely.
    """
    return any(
        isinstance(cell, str) and cell.strip().casefold() in _BALANCE_MARKERS for cell in row
    )


def _is_totals_row(row: list[Any]) -> bool:
    return any(
        isinstance(cell, str) and cell.strip().lower() in _TOTAL_MARKERS
        for cell in row[:_TOTALS_SCAN_COLUMNS]
    )


#: The head-wise tax columns.  A sheet that maps none of them, yet states a
#: taxable value, has tax the lexicon did not recognise.
_TAX_HEADS: Final[tuple[str, ...]] = ("igst", "cgst", "sgst", "cess")


#: Money fields whose sign is carried by ``doc_type`` rather than by the value.
_SIGNED_FIELDS: Final[tuple[str, ...]] = (
    "taxable_value",
    "igst",
    "cgst",
    "sgst",
    "cess",
    "doc_value",
)

#: Documents whose amounts reduce a liability.  Their stored value is a
#: magnitude; ``OutwardRecord.signed_tax`` applies the sign, once.
_NEGATIVE_DOC_TYPES: Final[frozenset[str]] = frozenset({DocType.CREDIT_NOTE.value})


def _normalise_credit_note(fields: dict[str, Any]) -> None:
    """Store a credit note's **magnitude**; the direction is its ``doc_type``.

    Both conventions arrive in real files.  The portal's own CDNR table writes
    a credit note as a positive amount and carries the direction in "Note Type
    = C"; an accountant's export writes it in parentheses, i.e. negative.

    The engine applies the sign exactly once, in ``OutwardRecord.signed_tax``.
    If the stored value were already negative that sign would be applied twice
    and the credit note would be *added* to outward liability -- a demand
    overstated by twice the note, on the one document whose whole purpose is to
    reduce a liability.
    """
    if fields.get("doc_type") not in _NEGATIVE_DOC_TYPES:
        return
    for name in _SIGNED_FIELDS:
        value = fields.get(name)
        if isinstance(value, Decimal) and value < 0:
            fields[name] = -value


def _doc_type_for(section: str | None, raw: object) -> str:
    text = str(raw or "").strip().lower()
    if "credit" in text or text in {"c", "cr"}:
        return DocType.CREDIT_NOTE.value
    if "debit" in text or text in {"d", "dr"}:
        return DocType.DEBIT_NOTE.value
    if section in {"IMPG"}:
        return DocType.BILL_OF_ENTRY.value
    if section == "ISD":
        return DocType.ISD_INVOICE.value
    return DocType.INVOICE.value


def ingest_sheet(  # noqa: PLR0911, PLR0912, PLR0915
    # The eight numbered stages in the module docstring run in order, and
    # each can quarantine the row it is looking at.  Splitting them into
    # helpers would scatter the row ledger across call frames, and the
    # ledger reconciling exactly is the whole point of this function.
    sheet: RawSheet,
    *,
    owner_gstin: str | None = None,
    period_hint: str | None = None,
    supplier_state: str | None = None,
    mapping_override: dict[str, str] | None = None,
    fy: FinancialYear | None = None,
) -> SheetOutcome:
    """Run one sheet all the way through, never raising on bad data."""
    sample = sheet.sample()
    classification = classify_sheet(sheet.name, sample[0] if sample else [], sample)

    outcome = SheetOutcome(
        sheet_name=sheet.name,
        sheet_index=sheet.index,
        classification=classification,
        header_row=None,
    )

    if classification.family is None:
        outcome.status = "UNRECOGNISED"
        outcome.ledger.saw_row()
        outcome.ledger.quarantine(
            sheet_name=sheet.name,
            row_index=0,
            reason_code=QuarantineReason.SHEET_UNRECOGNISED,
            reason=f"no return-type fingerprint matched ({classification.evidence[0]})",
            original_cells={
                "sheet": sheet.name,
                "first_row": _cells_as_text(sample[0] if sample else []),
            },
        )
        outcome.ledger.assert_reconciled(f"sheet {sheet.name}")
        return outcome

    family = classification.family

    if family == NOT_INGESTED:
        return _out_of_scope_sheet(sheet, outcome, classification)

    if family == "GSTR3B":
        return _ingest_three_b(sheet, outcome, owner_gstin=owner_gstin, fy=fy)

    detection = detect_header(sheet.rows, family)
    if detection is None:
        outcome.status = "HEADER_NOT_FOUND"
        outcome.ledger.saw_row()
        outcome.ledger.quarantine(
            sheet_name=sheet.name,
            row_index=0,
            reason_code=QuarantineReason.HEADER_NOT_FOUND,
            reason="no row in the first 40 scored as a header",
            original_cells={"sheet": sheet.name},
        )
        outcome.ledger.assert_reconciled(f"sheet {sheet.name}")
        return outcome

    sheet_period = period_from_sheet_name(sheet.name)
    outcome.header_row = detection.row_index
    headers: list[object] = list(detection.headers)
    mapping = match_headers(headers, family)

    if mapping_override:
        mapping = [
            FieldMatch(m.header, mapping_override.get(m.header, m.field), "100", "officer")
            if m.header in mapping_override
            else m
            for m in mapping
        ]
    outcome.mapping = mapping

    columns: dict[str, int] = {}
    for index, match in enumerate(mapping):
        if match.field is not None and match.field not in columns:
            columns[match.field] = index

    # A sheet that states a taxable value and a rate, maps no tax head at all,
    # and still has headers the lexicon did not recognise, is a sheet whose tax
    # columns were not understood.  Parsing it would write zero into IGST, CGST
    # and SGST and count the row as a success -- the quiet failure Law 5 exists
    # to prevent.  The portal's own B2B export carries no tax columns *and* no
    # unmapped headers, so it is unaffected.
    if (
        family in {"GSTR1", "GSTR2B"}
        and "taxable_value" in columns
        and not any(head in columns for head in _TAX_HEADS)
        and outcome.unmapped_headers
    ):
        outcome.status = "TAX_COLUMN_UNMAPPED"
        for row_index in range(detection.data_starts_at, len(sheet.rows)):
            row = sheet.rows[row_index]
            if _is_empty_row(row):
                continue
            outcome.ledger.saw_row()
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=QuarantineReason.TAX_COLUMN_UNMAPPED,
                reason=(
                    "the sheet states a taxable value but no tax column was "
                    "recognised; unmapped headers: " + ", ".join(outcome.unmapped_headers)
                ),
                original_cells=_row_as_dict(headers, row),
                field_name="igst",
            )
        return outcome

    if not columns:
        outcome.status = "MAPPING_REQUIRED"
        outcome.ledger.saw_row()
        outcome.ledger.quarantine(
            sheet_name=sheet.name,
            row_index=detection.row_index,
            reason_code=QuarantineReason.MAPPING_REQUIRED,
            reason="no header mapped to a canonical field",
            original_cells={"headers": [str(h) for h in headers]},
        )
        outcome.ledger.assert_reconciled(f"sheet {sheet.name}")
        return outcome

    # The transposition detector runs over whole columns, before a single row
    # is coerced. A producing tool writes dd-mm-yyyy, an mm-dd locale opens the
    # sheet, and Excel parses the cells it can while leaving the rest as text --
    # so half the column is silently a different date from the one the taxpayer
    # wrote. Read naively on the reference workbook that produced 250 breaches
    # of the Rule 48(4) window and 314 acknowledgements dated before their own
    # invoices; corrected, both are zero. docs/07 part C1.
    verdicts = _column_verdicts(sheet.rows, detection.data_starts_at, columns)
    outcome.date_corrections = {
        name: {"verdict": verdict.value, "cells_corrected": 0, "cells_held": 0}
        for name, verdict in verdicts.items()
    }

    seen: set[str] = set()
    for row_index in range(detection.data_starts_at, len(sheet.rows)):
        row = sheet.rows[row_index]
        if _is_empty_row(row):
            continue  # a blank spacer row is not a row of data and is not counted

        outcome.ledger.saw_row()
        original = _row_as_dict(headers, row)

        if _is_totals_row(row):
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=QuarantineReason.TOTALS_ROW,
                reason="trailing totals row, not a transaction",
                original_cells=original,
            )
            continue

        if family == "LEDGER" and _is_balance_marker(row):
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=QuarantineReason.TOTALS_ROW,
                reason=(
                    "opening or closing balance marker, not a movement; "
                    "it carries no date because there is none to carry"
                ),
                original_cells=original,
            )
            continue

        unresolved = _unresolved_date(row, columns, verdicts)
        if unresolved is not None:
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=QuarantineReason.DATE_TRANSPOSITION_AMBIGUOUS,
                reason=(
                    f"{unresolved}: this column mixes text and parsed dates, but "
                    "not in the pattern that proves Excel swapped day and month, "
                    "so this cell could be either reading and the platform will "
                    "not choose one"
                ),
                original_cells=original,
                field_name=unresolved,
            )
            outcome.date_corrections[unresolved]["cells_held"] += 1
            continue

        row, moved = _undo_transposition(row, columns, verdicts)
        for name, count in moved.items():
            outcome.date_corrections[name]["cells_corrected"] += count

        try:
            fields = _coerce_row(row, columns, family, fy)
        except CoercionError as exc:
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=(
                    QuarantineReason.GSTIN_INVALID
                    if "gstin" in exc.field
                    else QuarantineReason.COERCION_FAILED
                ),
                reason=exc.reason,
                original_cells=original,
                field_name=exc.field,
            )
            continue

        if owner_gstin is not None:
            fields.setdefault("gstin", owner_gstin)
            if fields.get("gstin") is None:
                fields["gstin"] = owner_gstin
        if fields.get("period") is None:
            # The period is not a column in a GSTR-1 B2B export; it is in
            # the sheet name, and the caller's hint is the last resort.
            fields["period"] = sheet_period or (
                coerce_period(period_hint) if period_hint is not None else None
            )

        if family in {"GSTR1", "GSTR2B"}:
            fields["section"] = classification.section or _default_section(family)
            if family == "GSTR2B":
                # WHICH inward statement this row came from, recorded rather
                # than defaulted. 2A and 2B share a family because they share
                # their columns (D-0057), but they are different documents:
                # 2B is the statutory gate under s.16(2)(aa) and 2A is the
                # record of supplier behaviour that Rule 37A reads.
                #
                # Defaulting this to GSTR2B stored 13,501 GSTR-2A rows as 2B
                # and roughly doubled available ITC, so "ITC claimed in
                # excess of 2B" could not fire on any taxpayer. docs/06
                # point 7 calls conflating them a defect that will be found
                # on reply, and it was right.
                fields["source_form"] = _inward_source_form(sheet.name)
            # The document type comes from whichever column the lexicon mapped
            # to it -- "Invoice Type" on a B2B sheet, "Note Type" on a CDNR
            # sheet, and their Marathi and Hindi equivalents.  Reading a
            # hard-coded English header here would reach past the synonym layer
            # and lose the type on every sheet that names the column anything
            # else: a credit note would become an invoice, its negative values
            # would be quarantined as an error, and the liability it was meant
            # to reduce would stand.
            fields["doc_type"] = _doc_type_for(fields.get("section"), fields.get("doc_type"))
            _normalise_credit_note(fields)

        missing = _missing_required(fields, family, sheet_name=sheet.name)
        if missing:
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=QuarantineReason.REQUIRED_FIELD_MISSING,
                reason=f"required field(s) absent: {', '.join(missing)}",
                original_cells=original,
                field_name=missing[0],
            )
            continue

        issues = validate_line(fields, supplier_state=supplier_state)
        if issues:
            first = issues[0]
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=(
                    QuarantineReason.GSTIN_INVALID
                    if "gstin" in first.field
                    else QuarantineReason.CROSS_FIELD_MISMATCH
                ),
                reason="; ".join(issue.reason for issue in issues),
                original_cells=original,
                field_name=first.field,
            )
            continue

        # Law 4: the invariants run LAST in coercion and FIRST relative to
        # every rule. A row that fails one is quarantined here and is
        # invisible to every check, parameter and join downstream -- which is
        # the whole point, because the next rule to read a transposed date
        # column would have made the same mistake as the last one.
        violation = check_invariants(fields)
        if violation is not None:
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=row_index,
                reason_code=QuarantineReason.INVARIANT_FAILED,
                reason=f"{violation.invariant}: {violation.reason}",
                original_cells={**original, **violation.observed},
                field_name=next(iter(violation.observed), None),
            )
            continue

        record = CanonicalRecord(
            family=family,
            section=fields.get("section"),
            fields=fields,
            sheet_name=sheet.name,
            row_index=row_index,
            original_cells=original,
        )
        key = duplicate_key(record)
        if key in seen:
            outcome.ledger.duplicate()
            continue
        seen.add(key)
        outcome.records.append(record)
        outcome.ledger.accept()

    outcome.ledger.assert_reconciled(f"sheet {sheet.name}")
    return outcome


def _ingest_three_b(
    sheet: RawSheet,
    outcome: SheetOutcome,
    *,
    owner_gstin: str | None,
    fy: FinancialYear | None = None,
) -> SheetOutcome:
    """A GSTR-3B is a summary table, not a register, and is read as one.

    The whole return becomes a single canonical record. A sheet that names no
    filer or no period yields nothing, and says which was missing: a 3B whose
    subject is unknown cannot be compared with anything.
    """
    results = read_three_b(sheet, owner_gstin=owner_gstin, fy=fy)
    outcome.header_row = results[0].header_row if results else None

    # A sheet may carry a whole year: one return per month, each counted on
    # its own, because "the sheet read" and "twelve returns read" are
    # different facts and the officer is owed the second.
    for result in results:
        outcome.ledger.saw_row()
        if not result.usable:
            # A sheet that yielded no figures at all did not fail to read: it
            # is a 3B table the reader has no field map for. The filed
            # workbooks split the return across six sheets, and Payment of
            # Tax, Interest and Late Fees, Nil-rated and the document summary
            # are among them. Reporting those as "missing period" blames a
            # file that states its period perfectly well on every row, and
            # sends an officer looking for a fault that is not there. The gap
            # is ours, as in D-0062, and the reason says so.
            if not result.cells:
                outcome.status = "NOT_INGESTED"
                outcome.ledger.quarantine(
                    sheet_name=sheet.name,
                    row_index=result.header_row or 0,
                    reason_code=QuarantineReason.SHEET_NOT_INGESTED,
                    reason=(
                        "a GSTR-3B table the platform has no field map for yet; "
                        "nothing on this sheet was ingested"
                    ),
                    original_cells={"sheet": sheet.name},
                )
                continue

            missing = [
                name
                for name, value in (("gstin", result.gstin), ("period", result.period))
                if value is None
            ] or ["a readable 3.1 table"]
            outcome.status = "REQUIRED_FIELD_MISSING"
            outcome.ledger.quarantine(
                sheet_name=sheet.name,
                row_index=result.header_row or 0,
                reason_code=QuarantineReason.REQUIRED_FIELD_MISSING,
                reason=f"GSTR-3B could not be read: missing {', '.join(missing)}",
                original_cells={"sheet": sheet.name},
                field_name=missing[0],
            )
            continue
        _emit_three_b(sheet, outcome, result)

    outcome.ledger.assert_reconciled(f"sheet {sheet.name}")
    return outcome


def _three_b_section(cells: dict[str, Any]) -> str:
    """The tables a 3B record carries, e.g. "3.1" or "4"."""
    tables = sorted({_TABLE_OF.get(key[:3], key[:2]) for key in cells})
    return ",".join(tables) or "3.1"


#: Field prefix -> the table it belongs to, for naming a partial 3B record.
_TABLE_OF: Final[dict[str, str]] = {
    "t31": "3.1",
    "t32": "3.2",
    "t4a": "4",
    "t4b": "4",
    "t4c": "4",
    "t4d": "4",
    "t5_": "5",
    "t51": "5.1",
    "t61": "6.1",
}


def _emit_three_b(sheet: RawSheet, outcome: SheetOutcome, result: Any) -> None:
    """One month of a GSTR-3B, as a canonical record."""
    fields: dict[str, Any] = {
        "gstin": result.gstin,
        "period": result.period,
        **result.cells,
    }
    outcome.records.append(
        CanonicalRecord(
            family="GSTR3B",
            # Which tables of the return this sheet carried. A whole-year
            # export splits one return across five sheets -- Supplies, ITC,
            # Nil, PaymentofTax, InterestLateFees -- and they are parts of the
            # same return, not five returns and not duplicates of one. Naming
            # the part keeps them distinct here; persist merges them into the
            # single row the return actually is.
            section=_three_b_section(result.cells),
            fields=fields,
            sheet_name=sheet.name,
            row_index=result.header_row or 0,
            original_cells={
                "sheet": sheet.name,
                "lines_read": result.rows_seen,
                "cells": {key: str(value) for key, value in result.cells.items()},
            },
        )
    )
    outcome.ledger.accept()

    # A line the lexicon did not recognise is held on its own, so the officer
    # sees that the return was read but not wholly understood.
    for row_index, label in result.unreadable_lines:
        outcome.ledger.saw_row()
        outcome.ledger.quarantine(
            sheet_name=sheet.name,
            row_index=row_index,
            reason_code=QuarantineReason.MAPPING_REQUIRED,
            reason=f"3B line not recognised: {label}",
            original_cells={"label": label},
        )


def ingest_sheets(
    sheets: list[RawSheet],
    *,
    filename: str,
    payload: bytes | None = None,
    owner_gstin: str | None = None,
    period_hint: str | None = None,
    supplier_state: str | None = None,
    known_keys: set[str] | None = None,
    fy: FinancialYear | None = None,
) -> IngestionReport:
    """Ingest a whole workbook.

    ``known_keys`` carries the duplicate keys already in the snapshot, so a
    re-upload of the same file reports every row as a duplicate and changes
    nothing.
    """
    digest = hashlib.sha256(payload).hexdigest() if payload is not None else ""
    # The filer's own GSTIN is context, not a column: a GSTR-1 names the
    # recipient on every row. Read it from the banner the portal writes above
    # the table unless the caller supplied one, so that every entry point --
    # the API, the seeder, a CLI, a test -- behaves the same way.
    owner_gstin = owner_gstin or owner_gstin_from(sheets)
    # A whole-year export states its financial year once, in the title block,
    # and then writes a bare month name on every row. Without it those rows
    # cannot be dated and the entire workbook is held.
    fy = fy or financial_year_from(sheets)

    report = IngestionReport(
        filename=filename, file_sha256=digest, owner_legal_name=legal_name_from(sheets)
    )
    seen = set(known_keys or set())

    for sheet in sheets:
        outcome = ingest_sheet(
            sheet,
            owner_gstin=owner_gstin,
            period_hint=period_hint,
            fy=fy,
            supplier_state=supplier_state,
        )
        # Cross-sheet and cross-upload duplicate suppression.
        kept: list[CanonicalRecord] = []
        for record in outcome.records:
            key = duplicate_key(record)
            if key in seen:
                outcome.ledger.parsed -= 1
                outcome.ledger.duplicate()
                continue
            seen.add(key)
            kept.append(record)
        outcome.records = kept
        outcome.ledger.assert_reconciled(f"sheet {sheet.name} after cross-sheet dedupe")

        report.sheets.append(outcome)
        report.ledger.merge(outcome.ledger)

    report.ledger.assert_reconciled(f"upload {filename}")
    return report


def _out_of_scope_sheet(
    sheet: RawSheet, outcome: SheetOutcome, classification: Classification
) -> SheetOutcome:
    """A sheet the platform recognises and has nowhere to put.

    Every data row is held, named for what the sheet is rather than for the
    first field that failed. Law 5 is unchanged -- in = parsed + held +
    duplicates -- but the reason now says the gap is ours. Before this, a
    GSTR-1 Table 13 sheet was read as a transaction register and every row
    failed on ``Sr. No. From``, which is an invoice series and was reported as
    "not a numeric literal": four hundred rows of one workbook, each blaming
    a file that was perfectly correct.
    """
    outcome.status = "NOT_INGESTED"
    what = classification.evidence[0].partition(":")[2] if classification.evidence else "this sheet"
    for row_index, row in enumerate(sheet.rows):
        if not any(cell not in (None, "") for cell in row):
            continue
        outcome.ledger.saw_row()
        outcome.ledger.quarantine(
            sheet_name=sheet.name,
            row_index=row_index,
            reason_code=QuarantineReason.SHEET_NOT_INGESTED,
            reason=(
                f"recognised as {what}; the platform has no dataset for it yet, "
                f"so nothing on this sheet was ingested"
            ),
            original_cells={"sheet": sheet.name, "row": _cells_as_text(list(row))},
        )
    outcome.ledger.assert_reconciled(f"sheet {sheet.name}")
    return outcome


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


#: A portal export names its sheets by period: "b2b_062025", "GSTR1_Jun2025",
#: "B2B Jun-2025".  When the rows carry no period column -- and the GSTR-1 B2B
#: export does not -- that is where the period lives.
_SHEET_PERIOD: Final[re.Pattern[str]] = re.compile(
    r"(?:^|[^0-9a-z])("
    r"\d{6}"  # 062025
    r"|\d{1,2}[-_/]\d{4}"  # 06-2025
    r"|[a-z]{3,9}[-_ ]?\d{4}"  # Jun2025, June-2025
    r"|\d{4}[-_/]\d{1,2}"  # 2025-06
    r")(?:$|[^0-9a-z])",
    re.IGNORECASE,
)


def period_from_sheet_name(sheet_name: str) -> Period | None:
    """Read the tax period out of a sheet name, or return None.

    None is not a failure: the caller falls back to the period hint, and a row
    with no period at all is quarantined naming the field.
    """
    match = _SHEET_PERIOD.search(sheet_name)
    if match is None:
        return None
    try:
        return Period.parse(match.group(1).replace("_", "-"))
    except ValueError:
        return None


def _inward_source_form(sheet_name: str) -> str:
    """`GSTR2A` or `GSTR2B`, read from the sheet's own name.

    The name is the only place the distinction survives: the two statements
    carry the same columns, so nothing in the data itself says which one this
    is. A sheet that names neither defaults to 2B, because that is the
    statutory gate and treating an unknown inward row as entitlement is the
    conservative direction -- it can only ever reduce a claimed-versus-
    available gap, never invent one.
    """
    normalised = sheet_name.upper().replace("-", "").replace("_", "").replace(" ", "")
    return "GSTR2A" if "GSTR2A" in normalised else "GSTR2B"


def _default_section(family: str) -> str:
    return SupplySection.B2B.value if family in {"GSTR1", "GSTR2B"} else ""


def _cells_as_text(row: list[Any]) -> list[str]:
    return ["" if cell is None else str(cell) for cell in row]


def _row_as_dict(headers: list[object], row: list[Any]) -> dict[str, Any]:
    """The original cells, keyed by their header, kept verbatim for replay."""
    out: dict[str, Any] = {}
    for index, header in enumerate(headers):
        label = str(header).strip() or f"column_{index}"
        value = row[index] if index < len(row) else None
        out[label] = None if value is None else str(value)
    return out


def _coerce_row(
    row: list[Any],
    columns: dict[str, int],
    family: str,
    fy: FinancialYear | None = None,
) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    for name, index in columns.items():
        raw = row[index] if index < len(row) else None
        if name in _GSTIN_FIELDS:
            fields[name] = coerce_gstin(raw, field=name, required=False)
        elif name in _PERIOD_FIELDS:
            # A Month column holding a bare month name resolves against the
            # financial year the workbook states in its title block.
            fields[name] = coerce_period(raw, field=name, fy=fy)
        elif name in _COERCERS:
            fields[name] = _COERCERS[name](raw, field=name)
        else:
            fields[name] = coerce_text(raw, field=name)
    if family == "LEDGER" and fields.get("head"):
        fields["head"] = str(fields["head"]).strip().upper()[:8]
    return fields


#: Fields that carry a tax period and may therefore be a bare month name.
_PERIOD_FIELDS: Final[frozenset[str]] = frozenset({"period", "supplier_return_period"})

_REQUIRED: Final[dict[str, tuple[str, ...]]] = {
    "GSTR1": ("gstin", "period", "taxable_value"),
    "GSTR2B": ("gstin", "period", "supplier_gstin", "taxable_value"),
    "EWAYBILL": ("gstin", "ewb_no"),
    "EINVOICE": ("gstin", "irn"),
    "LEDGER": ("gstin", "as_on", "head"),
    "GSTR3B": ("gstin", "period"),
}


#: Inward sections recording an import of goods. The credit arises on a bill
#: of entry filed with Customs, so there is no supplier GSTIN: the
#: counterparty is not a registered person under the Act, and the line names a
#: port code and a bill number instead.
_IMPORT_SECTIONS: Final[tuple[str, ...]] = ("impg", "impgsez", "impgos")


def _is_import_sheet(sheet_name: str) -> bool:
    normalised = normalise_header(sheet_name).replace(" ", "")
    return any(section in normalised for section in _IMPORT_SECTIONS)


def _missing_required(fields: dict[str, Any], family: str, *, sheet_name: str = "") -> list[str]:
    """Which required fields this row does not carry.

    ``supplier_gstin`` is required of an inward line in general and cannot be
    required of an import line, where no such number exists. Holding those
    lines dropped real, available credit from the GSTR-2B -- and because P14
    compares claimed ITC against available ITC, losing available credit makes
    the gap look larger than it is, so the flag reads higher than the facts
    support. An error in that direction ends up in a demand.

    The exemption is for imports specifically. A B2B line with no supplier is
    still held, because there is no way to tell whose compliance that credit
    rests on.
    """
    required = _REQUIRED.get(family, ())
    if _is_import_sheet(sheet_name):
        required = tuple(name for name in required if name != "supplier_gstin")
    return [name for name in required if fields.get(name) is None]


def disposition_counts(report: IngestionReport) -> dict[str, int]:
    """The three dispositions Law 5 names, for the screen."""
    return {
        RowDisposition.PARSED.value: report.ledger.parsed,
        RowDisposition.QUARANTINED.value: report.ledger.quarantined,
        RowDisposition.DUPLICATE.value: report.ledger.duplicates,
    }


def return_type_of(family: str) -> ReturnType | None:
    return {
        "GSTR1": ReturnType.GSTR1,
        "GSTR2B": ReturnType.GSTR2B,
        "GSTR3B": ReturnType.GSTR3B,
    }.get(family)
