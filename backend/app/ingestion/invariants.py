"""I-01 to I-10 — the gates every row passes before any rule sees it.

Law 4 of the pack: **invariants before rules**. A row that fails one of these
is quarantined and is invisible to every check, every parameter and every
join. It is not scored, not matched, and never becomes a finding.

The reason this layer exists rather than being folded into validation is
`docs/07` Part C1. Reading one real date column naively produced **250
fabricated Rule 48(4) notices and 314 acknowledgements dated before their own
invoice**. `I-01` alone stops all of them, and it stops them *before* the rule
runs rather than by making the rule cleverer - because the next rule to read
that column would have made the same mistake again.

Each invariant is pure: it takes a canonical field mapping and returns either
nothing or a reason. No I/O, no clock, no logging. The caller quarantines.

**What these are not.** They are not business rules and they must never become
them. An invariant asserts a fact that cannot be false in a well-formed
document - an acknowledgement cannot precede its invoice, a return cannot be
filed before its period closes, a ledger cannot lose money between two rows.
A test about whether the taxpayer *should* have done something belongs in the
A-L matrix, where it can produce a finding an officer can act on. Quarantining
a row makes it invisible, which is the opposite of a finding.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Final

from app.canonical import GstinError, Period, validate_gstin

__all__ = [
    "INVARIANTS",
    "InvariantId",
    "Violation",
    "check_invariants",
]

#: Line arithmetic tolerance. The portal rounds each head to the rupee, so a
#: line can be out by a rupee without anything being wrong. docs/02 B4.
_LINE_TOLERANCE: Final[Decimal] = Decimal("1.00")

#: Ledger continuity tolerance, for the same reason.
_LEDGER_TOLERANCE: Final[Decimal] = Decimal("1.00")

#: A document dated more than a year outside its financial year is a century
#: or transposition error rather than a late entry.
_FY_SLACK_DAYS: Final[int] = 366

_HUNDRED: Final[Decimal] = Decimal("100")


InvariantId = str


@dataclass(frozen=True, slots=True)
class Violation:
    """Why this row may not be scrutinised."""

    invariant: InvariantId
    reason: str
    #: The fields that disagree, so the officer sees the contradiction itself
    #: rather than an invariant number.
    observed: dict[str, str]


def _as_date(value: Any) -> date | None:
    return value if isinstance(value, date) else None


def _as_money(value: Any) -> Decimal | None:
    return value if isinstance(value, Decimal) else None


def _fmt(value: Any) -> str:
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


# ---------------------------------------------------------------------------
# The ten
# ---------------------------------------------------------------------------


def i01_ack_not_before_document(fields: Mapping[str, Any]) -> Violation | None:
    """An IRN cannot be generated before the invoice it acknowledges.

    The one that matters most. On the real workbook a mixed-type date column
    put 314 acknowledgements before their own invoices and 250 outside the
    thirty-day window; every one of those would have become a notice.
    """
    ack, doc = _as_date(fields.get("irn_date")), _as_date(fields.get("doc_date"))
    if ack is None or doc is None or ack >= doc:
        return None
    return Violation(
        "I-01",
        "acknowledgement dated before the document it acknowledges",
        {"irn_date": _fmt(ack), "doc_date": _fmt(doc)},
    )


def i02_filed_after_period_end(fields: Mapping[str, Any]) -> Violation | None:
    """A return cannot be filed before the period it reports has closed."""
    filed = _as_date(fields.get("filing_date"))
    period = fields.get("period")
    if filed is None or not isinstance(period, Period):
        return None
    if filed >= period.last_day:
        return None
    return Violation(
        "I-02",
        "return filed before its tax period closed",
        {"filing_date": _fmt(filed), "period_end": _fmt(period.last_day)},
    )


def i03_ewb_valid_after_generation(fields: Mapping[str, Any]) -> Violation | None:
    """An e-way bill cannot expire before it is generated."""
    valid, generated = _as_date(fields.get("valid_upto")), _as_date(fields.get("ewb_date"))
    if valid is None or generated is None or valid >= generated:
        return None
    return Violation(
        "I-03",
        "e-way bill expires before it was generated",
        {"valid_upto": _fmt(valid), "ewb_date": _fmt(generated)},
    )


def i04_line_arithmetic(fields: Mapping[str, Any]) -> Violation | None:
    """taxable x rate must equal the tax charged, to the rupee.

    Skipped where the rate is absent or nil: a nil-rated or exempt line has
    no arithmetic to check, and asserting 0 x 0 == 0 would quarantine every
    exempt supply in the file.
    """
    taxable, rate = _as_money(fields.get("taxable_value")), fields.get("rate")
    if taxable is None or not isinstance(rate, Decimal) or rate == 0:
        return None
    heads = [_as_money(fields.get(h)) or Decimal("0.00") for h in ("igst", "cgst", "sgst")]
    if all(_as_money(fields.get(h)) is None for h in ("igst", "cgst", "sgst")):
        return None
    charged = sum(heads, Decimal("0.00"))
    expected = (taxable * rate / _HUNDRED).quantize(Decimal("0.01"))
    if abs(charged - expected) <= _LINE_TOLERANCE:
        return None
    return Violation(
        "I-04",
        "tax charged does not follow from taxable value and rate",
        {
            "taxable_value": _fmt(taxable),
            "rate": _fmt(rate),
            "tax_charged": _fmt(charged),
            "tax_expected": _fmt(expected),
        },
    )


def i05_document_within_its_year(fields: Mapping[str, Any]) -> Violation | None:
    """A document date more than a year outside its FY is a typing error.

    This is the century-and-transposition net: `12-01-2026` read as
    `01-12-2026` lands inside the window, but `2015` or `2026` in a 2025-26
    file does not.
    """
    doc, period = _as_date(fields.get("doc_date")), fields.get("period")
    if doc is None or not isinstance(period, Period):
        return None
    fy = period.financial_year
    if (fy.start - doc).days <= _FY_SLACK_DAYS and (doc - fy.end).days <= _FY_SLACK_DAYS:
        return None
    return Violation(
        "I-05",
        "document dated more than a year outside its financial year",
        {"doc_date": _fmt(doc), "fy": fy.label},
    )


def i06_head_matches_place_of_supply(fields: Mapping[str, Any]) -> Violation | None:
    """IGST on an intra-State supply, or CGST/SGST on an inter-State one.

    The direction is decided by the *seller's* State against the place of
    supply. The caller supplies `supplier_state`; on an outward line that is
    the filer, on an inward line it is the counterparty, and getting that
    backwards quarantined 529 genuine inter-State purchases once already.
    """
    supplier, pos = fields.get("supplier_state"), fields.get("pos")
    if not isinstance(supplier, str) or not isinstance(pos, str):
        return None
    igst = _as_money(fields.get("igst")) or Decimal("0.00")
    cgst = _as_money(fields.get("cgst")) or Decimal("0.00")
    sgst = _as_money(fields.get("sgst")) or Decimal("0.00")
    intrastate = supplier == pos
    if intrastate and igst != 0:
        return Violation(
            "I-06",
            "IGST charged on an intra-State supply",
            {"supplier_state": supplier, "pos": pos, "igst": _fmt(igst)},
        )
    if not intrastate and (cgst != 0 or sgst != 0):
        return Violation(
            "I-06",
            "CGST/SGST charged on an inter-State supply",
            {"supplier_state": supplier, "pos": pos, "cgst": _fmt(cgst), "sgst": _fmt(sgst)},
        )
    return None


def i07_ledger_continuity(fields: Mapping[str, Any]) -> Violation | None:
    """closing == opening + credited - debited, per head.

    A ledger that does not carry its own balance forward is not a ledger, and
    X-11's utilisation test reads the running balance directly.
    """
    opening, closing = _as_money(fields.get("opening")), _as_money(fields.get("closing"))
    credited = _as_money(fields.get("credited")) or Decimal("0.00")
    debited = _as_money(fields.get("debited")) or Decimal("0.00")
    if opening is None or closing is None:
        return None
    expected = opening + credited - debited
    if abs(closing - expected) <= _LEDGER_TOLERANCE:
        return None
    return Violation(
        "I-07",
        "ledger closing balance does not follow from its own movements",
        {"opening": _fmt(opening), "closing": _fmt(closing), "expected": _fmt(expected)},
    )


def i08_three_b_itc_identity(fields: Mapping[str, Any]) -> Violation | None:
    """3B Table 4(C) == 4(A) total - 4(B) total, per head.

    A well-formed return satisfies this by construction; one that does not has
    been transcribed wrongly, and every ITC check downstream would inherit the
    error.
    """
    for head in ("igst", "cgst", "sgst", "cess"):
        net = _as_money(fields.get(f"t4c_{head}"))
        if net is None:
            continue
        available = sum(
            (_as_money(fields.get(f"t4a{n}_{head}")) or Decimal("0.00") for n in range(1, 6)),
            Decimal("0.00"),
        )
        reversed_ = sum(
            (_as_money(fields.get(f"t4b{n}_{head}")) or Decimal("0.00") for n in (1, 2)),
            Decimal("0.00"),
        )
        expected = available - reversed_
        if abs(net - expected) > _LINE_TOLERANCE:
            return Violation(
                "I-08",
                f"3B Table 4(C) does not equal 4(A) minus 4(B) for {head.upper()}",
                {"head": head, "t4c": _fmt(net), "expected": _fmt(expected)},
            )
    return None


def i09_rows_reconcile(_fields: Mapping[str, Any]) -> Violation | None:
    """Sheet-level, asserted by the ledger rather than per row.

    Present so that the ten are addressable as a set and the scorecard can
    report `I-09` beside the others. The pipeline already asserts
    `rows_in == parsed + quarantined + duplicates` and refuses to commit a
    sheet that does not balance, so a row can never fail this individually.
    """
    return None


def i10_counterparty_identity(fields: Mapping[str, Any]) -> Violation | None:
    """A counterparty GSTIN is well-formed, or it is not a GSTIN.

    Position 14 accepts Z, D and C - ordinary taxpayer, s.51 deductor, s.52
    collector. A validator narrower than that rejects every government
    department in India, and on the real workbook it discarded the TDS
    records that corroborate declared turnover.
    """
    for key in ("counterparty_gstin", "supplier_gstin"):
        value = fields.get(key)
        if not isinstance(value, str) or not value:
            continue
        try:
            validate_gstin(value)
        except GstinError as exc:
            return Violation("I-10", f"counterparty GSTIN invalid: {exc.reason}", {key: value})
    return None


#: In order. The scorecard reports them in this order too.
INVARIANTS: Final[dict[InvariantId, Callable[[Mapping[str, Any]], Violation | None]]] = {
    "I-01": i01_ack_not_before_document,
    "I-02": i02_filed_after_period_end,
    "I-03": i03_ewb_valid_after_generation,
    "I-04": i04_line_arithmetic,
    "I-05": i05_document_within_its_year,
    "I-06": i06_head_matches_place_of_supply,
    "I-07": i07_ledger_continuity,
    "I-08": i08_three_b_itc_identity,
    "I-09": i09_rows_reconcile,
    "I-10": i10_counterparty_identity,
}


def check_invariants(fields: Mapping[str, Any]) -> Violation | None:
    """The first violation, or ``None`` if the row may be scrutinised.

    First rather than all: the row is quarantined either way, and one clear
    reason an officer can act on beats a list they have to read through. The
    invariant id is on the record, so the full set is recoverable by re-running
    a single row.
    """
    for check in INVARIANTS.values():
        found = check(fields)
        if found is not None:
            return found
    return None
