"""Per-field and cross-field validation.

Cross-field checks are where a genuinely wrong row is caught: a line whose tax
does not follow from its taxable value and rate is either mis-mapped or
mis-stated, and either way an officer must see it rather than have it silently
join the evidence behind a demand.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Final

from app.canonical import is_valid_gstin, state_name
from app.money import TaxVector

#: A GSTIN opens with its two-digit State code.
_STATE_CODE_LENGTH: Final[int] = 2

__all__ = ["ValidationIssue", "validate_line", "validate_tax_against_rate"]

#: Rounding on the portal is to the rupee, and a line may legitimately differ
#: by up to a rupee from taxable x rate.  Beyond that the row is quarantined.
TAX_TOLERANCE: Final[Decimal] = Decimal("1.00")

#: A document dated this far from its return period is a mapping error,
#: not a late-reported invoice.
_MAX_MONTHS_AHEAD: Final[int] = 18
_MAX_MONTHS_BEHIND: Final[int] = -1

_HUNDRED: Final[Decimal] = Decimal("100")


@dataclass(frozen=True, slots=True)
class ValidationIssue:
    field: str
    reason: str
    observed: str | None = None
    expected: str | None = None


def validate_tax_against_rate(
    *,
    taxable_value: Decimal,
    rate: Decimal | None,
    tax: TaxVector,
    tolerance: Decimal = TAX_TOLERANCE,
) -> ValidationIssue | None:
    """``taxable x rate`` must equal the tax charged, within a rupee.

    Cess is excluded: it is levied on its own basis (often a specific rate per
    unit), so folding it into this test produces a false positive on every
    demerit-goods line.
    """
    if rate is None or rate == 0:
        return None
    expected = (taxable_value * rate / _HUNDRED).quantize(Decimal("0.01"))
    charged = tax.igst + tax.cgst + tax.sgst
    difference = abs(charged - expected)
    if difference <= tolerance:
        return None
    return ValidationIssue(
        field="tax",
        reason=f"taxable {taxable_value} at {rate}% implies {expected}, "
        f"but {charged} was charged (off by {difference})",
        observed=format(charged, "f"),
        expected=format(expected, "f"),
    )


def validate_head_against_pos(
    *,
    supplier_state: str | None,
    place_of_supply: str | None,
    tax: TaxVector,
) -> ValidationIssue | None:
    """The head charged must follow from the place of supply.

    Intra-State is CGST+SGST; inter-State is IGST.  A supply mischaracterised
    here has diverted revenue between the Centre and the State, which is why
    this is a validation rather than a note.
    """
    if supplier_state is None or place_of_supply is None:
        return None
    try:
        state_name(supplier_state)
        state_name(place_of_supply)
    except ValueError as exc:
        return ValidationIssue(field="pos", reason=str(exc), observed=place_of_supply)

    intrastate = supplier_state == place_of_supply
    has_igst = tax.igst != 0
    has_local = tax.cgst != 0 or tax.sgst != 0

    if intrastate and has_igst and not has_local:
        return ValidationIssue(
            field="tax",
            reason=f"IGST charged on an intra-State supply ({supplier_state} to {place_of_supply})",
            observed="IGST",
            expected="CGST+SGST",
        )
    if not intrastate and has_local and not has_igst:
        return ValidationIssue(
            field="tax",
            reason=f"CGST/SGST charged on an inter-State supply "
            f"({supplier_state} to {place_of_supply})",
            observed="CGST+SGST",
            expected="IGST",
        )
    if intrastate and tax.cgst != tax.sgst and has_local:
        return ValidationIssue(
            field="tax",
            reason=f"CGST {tax.cgst} does not equal SGST {tax.sgst} on an intra-State supply",
            observed=format(tax.cgst, "f"),
            expected=format(tax.sgst, "f"),
        )
    return None


def _selling_state(record: dict[str, Any], filer_state: str | None) -> str | None:
    """Whose State decides intra- against inter-State on this line.

    The head charged follows from the *supplier's* State against the place of
    supply. Which party that is depends on which way the return faces:

    * On an outward return the filer is the supplier, so the filer's State is
      the right answer and is all there is.
    * On an inward statement the filer is the **recipient**. The supplier is
      named on each row, and using the filer's State instead makes every
      genuine inter-State purchase look like an intra-State supply wrongly
      charged IGST.

    So a row that names its own supplier is judged on that supplier. The
    filer's State is the fallback, not the default.
    """
    supplier_gstin = record.get("supplier_gstin")
    if supplier_gstin is not None:
        text = str(supplier_gstin).strip()
        if len(text) >= _STATE_CODE_LENGTH:
            return text[:_STATE_CODE_LENGTH]
    return filer_state


def validate_line(
    record: dict[str, Any], *, supplier_state: str | None = None
) -> list[ValidationIssue]:
    """Every per-field and cross-field check for one transaction line."""
    issues: list[ValidationIssue] = []

    for field_name in ("counterparty_gstin", "supplier_gstin", "gstin", "ecom_gstin"):
        value = record.get(field_name)
        if value is not None and not is_valid_gstin(str(value)):
            issues.append(
                ValidationIssue(
                    field=field_name, reason="failed GSTIN checksum", observed=str(value)
                )
            )

    taxable = record.get("taxable_value")
    # The portal's own GSTR-1 B2B export carries Rate and Taxable Value but no
    # tax columns at all -- the tax is derived downstream.  A cross-field check
    # against absent columns would quarantine every row of a valid portal file,
    # so the head-wise tests run only when a tax column was actually mapped.
    has_tax_columns = any(head in record for head in ("igst", "cgst", "sgst"))

    if isinstance(taxable, Decimal) and has_tax_columns:
        tax = TaxVector(
            igst=record.get("igst"),
            cgst=record.get("cgst"),
            sgst=record.get("sgst"),
            cess=record.get("cess"),
        )
        rate_issue = validate_tax_against_rate(
            taxable_value=taxable, rate=record.get("rate"), tax=tax
        )
        if rate_issue is not None:
            issues.append(rate_issue)

        pos_issue = validate_head_against_pos(
            supplier_state=_selling_state(record, supplier_state),
            place_of_supply=record.get("pos"),
            tax=tax,
        )
        if pos_issue is not None:
            issues.append(pos_issue)

    if isinstance(taxable, Decimal) and taxable < 0 and record.get("doc_type") != "CREDIT_NOTE":
        issues.append(
            ValidationIssue(
                field="taxable_value",
                reason="negative taxable value on a document that is not a credit note",
                observed=format(taxable, "f"),
            )
        )

    doc_date = record.get("doc_date")
    period = record.get("period")
    if doc_date is not None and period is not None:
        # A document dated far outside its return period is usually a mapping
        # error; more than a year out is not a late-reported invoice, it is a
        # wrong column.
        months = (period.year * 12 + period.month) - (doc_date.year * 12 + doc_date.month)
        if months < _MAX_MONTHS_BEHIND or months > _MAX_MONTHS_AHEAD:
            issues.append(
                ValidationIssue(
                    field="doc_date",
                    reason=f"document dated {doc_date} sits {months} months from period {period}",
                    observed=str(doc_date),
                    expected=str(period),
                )
            )

    return issues
