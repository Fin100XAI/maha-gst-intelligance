"""Module B — ITC eligibility under section 16.

B-04 is the one to read first. `docs/07` calls Rule 37A *"the highest-yield
rule per hour of engineering"*: one join, one column, **Rs 95,79,967** on the
reference workbook, `CERTAIN` confidence, and nothing asked of the taxpayer.

The mechanism is that every party's return is another party's evidence. The
supplier filed their GSTR-1, so the credit appeared in the recipient's GSTR-2B
and was claimed. The supplier never filed their GSTR-3B, so the tax never
reached the exchequer. Rule 37A requires the recipient to reverse.

A taxpayer can control their own filing. They cannot control their suppliers'.

Pure: no I/O, no clock, `as_of` injected. docs/01 section 8, module B.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.records import InwardRecord
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.trace import CalcKind
from app.matching.keys import normalise_doc_no
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")

#: How many defaulting suppliers to name on the card before summarising.
_NAMED_SUPPLIERS: Final[int] = 3


def _supplier_status_rows(ctx: RuleContext) -> list[InwardRecord]:
    """Inward lines that actually state the supplier's GSTR-3B status.

    Only GSTR-2A carries the column. A 2B row has `None` and is excluded
    here rather than treated as compliant - the difference between "the
    supplier filed" and "this statement does not say" is the whole rule.
    """
    rows: list[InwardRecord] = []
    for period in ctx.periods:
        rows.extend(row for row in ctx.inward(period) if row.supplier_3b_filed is not None)
    return rows


@rule(
    id="B-04",
    title="ITC claimed against suppliers who never filed their GSTR-3B",
    family="B",
    dimension=RiskDimension.CREDIT,
    legal_basis="Rule 37A CGST Rules, 2017 r/w s.16(2)(c) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr2a",),
    relates_to=("P14",),
    form=ActionForm.DRC_01A,
    threshold="any credit from a supplier whose GSTR-3B is unfiled",
)
def b04_rule_37a_supplier_default(ctx: RuleContext) -> list[Finding]:
    """Join the supplier's GSTR-3B status against the credit claimed.

    `CERTAIN` rather than `STRONG`: this is not a threshold judgement or a
    peer comparison. The statement says the supplier did not file, and the
    credit is in the recipient's own claim. There is no band to argue about.

    **What the figure is not.** This is the *gross* Rule 37A exposure. It must
    be reduced by any reversal the taxpayer has already made, and the engine
    cannot net the two without the reversal working - a Table 4(B)(2) figure
    does not say which invoices it covered. On the reference workbook a
    Rs 80.05 lakh reversal in August cannot cover invoices dated October and
    November, so the largest limb stands; but that is a reading of dates, not
    arithmetic the engine can do in general. The card says so.
    """
    rows = _supplier_status_rows(ctx)
    if not rows:
        return [
            not_evaluated(
                ctx,
                "B-04",
                (
                    "GSTR-2A with the supplier's GSTR-3B filing status "
                    "(GSTR-2B does not carry this column)",
                ),
            )
        ]

    defaulting = [row for row in rows if row.supplier_3b_filed is False]
    if not defaulting:
        return [clear(ctx, "B-04")]

    tracer = ctx.tracer(
        CalcKind.RULE,
        "B-04",
        legal_basis="Rule 37A CGST Rules, 2017 r/w s.16(2)(c) CGST Act, 2017",
    )

    by_supplier: dict[str, list[InwardRecord]] = defaultdict(list)
    for row in defaulting:
        by_supplier[row.supplier_gstin or "unidentified"].append(row)

    # A credit note from a defaulting supplier REDUCES the credit at risk.
    # Inward credit notes are stored positive and signed at the identity
    # layer, never at the row layer, so the sign is applied here - summing
    # them raw would inflate a Rule 37A demand with the very documents that
    # reduce it.
    def _signed(row: InwardRecord) -> TaxVector:
        return row.tax.scale(Decimal("-1")) if row.doc_type == "CREDIT_NOTE" else row.tax

    exposure = sum((_signed(row) for row in defaulting), TaxVector())
    taxable = sum(
        (
            -row.taxable_value if row.doc_type == "CREDIT_NOTE" else row.taxable_value
            for row in defaulting
        ),
        _ZERO,
    )

    ranked = sorted(
        by_supplier.items(),
        key=lambda pair: sum((r.tax.abs_total for r in pair[1]), _ZERO),
        reverse=True,
    )
    worst = ranked[0]
    worst_tax = sum((r.tax.abs_total for r in worst[1]), _ZERO)

    named = ", ".join(
        f"{gstin} ({len(lines)} invoices, {sum((r.tax.abs_total for r in lines), _ZERO)})"
        for gstin, lines in ranked[:_NAMED_SUPPLIERS]
    )

    tracer.note("suppliers", len(by_supplier))
    tracer.step("invoices from a defaulting supplier", "count", {}, len(defaulting))
    tracer.step("taxable value at risk", "sum(taxable_value), credit notes signed", {}, taxable)
    tracer.step(
        "credit at risk",
        "sum(tax), credit notes signed negative",
        {"largest_supplier": worst[0]},
        exposure.abs_total,
    )

    return [
        triggered(
            ctx,
            "B-04",
            delta=exposure,
            taxable_value_effect=taxable,
            confidence=Confidence.CERTAIN,
            form=ActionForm.DRC_01A,
            trace=tracer.finish(
                result=exposure.abs_total,
                formula_template=(
                    "credit at risk = sum of tax on lines whose supplier's GSTR-3B is unfiled"
                ),
                formula_rendered=(
                    f"{len(defaulting)} invoices from {len(by_supplier)} suppliers "
                    f"= {exposure.abs_total}"
                ),
            ),
            evidence_ids=tuple(r.row_id for r in defaulting[:50] if r.row_id),
            narrative=(
                f"{len(defaulting)} invoices from {len(by_supplier)} suppliers "
                f"whose GSTR-3B is unfiled. Each supplier filed their GSTR-1, so "
                f"the credit reached this taxpayer's GSTR-2B and was claimed; the "
                f"tax was never paid. Largest exposure: {worst[0]} at {worst_tax}. "
                f"By tax at risk: {named}. "
                f"This is the GROSS Rule 37A figure and must be reduced by any "
                f"reversal already made - call for the reversal working, because "
                f"a Table 4(B)(2) total does not say which invoices it covered."
            ),
            extra={
                "suppliers": len(by_supplier),
                "invoices": len(defaulting),
                "largest_supplier": worst[0],
                "largest_supplier_tax": format(worst_tax, "f"),
                "gross": format(exposure.abs_total, "f"),
            },
        )
    ]


# ---------------------------------------------------------------------------
# B-08 — the same invoice claimed twice
# ---------------------------------------------------------------------------

#: A note and an amendment both carry the document number of the record they
#: refer to. Neither is a second claim, and both look exactly like one.
_REPEATS_ANOTHERS_NUMBER: Final[frozenset[str]] = frozenset({"CDNR", "CDNUR", "AMENDMENT"})

_NOTE_TYPES: Final[frozenset[str]] = frozenset({"CREDIT_NOTE", "DEBIT_NOTE"})


def _claimable_2b(ctx: RuleContext) -> list[InwardRecord]:
    """The rows that represent a claim in their own right.

    Three exclusions, and each one is the difference between this check and a
    catastrophe - see `b08_duplicate_itc`.
    """
    return [
        row
        for period in ctx.periods
        for row in ctx.inward(period)
        if row.source_form == "GSTR2B"
        and row.section not in _REPEATS_ANOTHERS_NUMBER
        and row.doc_type not in _NOTE_TYPES
    ]


@rule(
    id="B-08",
    title="The same supplier invoice claimed in more than one period",
    family="B",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.16 CGST Act, 2017 r/w Rule 36(1)",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr2b",),
    relates_to=("B-01", "P14"),
    form=ActionForm.DRC_01A,
    threshold="any invoice appearing under one supplier in two or more periods",
)
def b08_duplicate_itc(ctx: RuleContext) -> list[Finding]:
    """One invoice, one credit. A second claim on it is the whole finding.

    **What makes this check dangerous is the false positives, not the true
    ones.** Measured on the reference workbook, grouping every inward row by
    supplier and document number finds **4,636** groups with more than one row
    out of 9,450 rows - practically the entire file. Three exclusions take
    that to zero, and each removes a different kind of legitimate repeat:

    * **GSTR-2B only.** A document appears in both 2A and 2B because they are
      two statements of one invoice, not two claims. J03 pairs 4,404 of them.
      2B is also the right side on the law: s.16(2)(aa) makes it the gate.
    * **Not an amendment.** A B2BA row names the document it corrects, and on
      the portal's own 2B export it literally carries that number as its own.
    * **Not a credit or debit note.** A note carries the number of the invoice
      it adjusts, by design.

    After all three, four of the five surviving groups on the reference file
    were amendments and the fifth was a credit note. The honest answer there is
    **no duplicate credit**, and a naive implementation would have raised
    4,636 demands.

    **Two rows in one period are not this check either.** An invoice can carry
    several rate lines, and an identical row re-uploaded is already collapsed
    by the ingestion duplicate key. What this looks for is a claim repeated
    *across* periods, which neither of those explains.

    The exposure is every claim after the first: the earliest period keeps the
    credit, and the rest is the excess.
    """
    rows = _claimable_2b(ctx)
    if not rows:
        return [
            not_evaluated(
                ctx,
                "B-08",
                ("GSTR-2B (the statutory gate under s.16(2)(aa))",),
            )
        ]

    by_document: dict[tuple[str, str], list[InwardRecord]] = defaultdict(list)
    for row in rows:
        if row.supplier_gstin and row.doc_no:
            by_document[(row.supplier_gstin, normalise_doc_no(row.doc_no))].append(row)

    repeated: list[list[InwardRecord]] = []
    for lines in by_document.values():
        periods = {row.period for row in lines if row.period is not None}
        if len(periods) > 1:
            repeated.append(sorted(lines, key=lambda r: (str(r.period), r.doc_date or date.min)))

    if not repeated:
        return [clear(ctx, "B-08")]

    excess = TaxVector()
    taxable = _ZERO
    later: list[InwardRecord] = []
    for lines in repeated:
        # The earliest claim stands; everything after it is the duplicate.
        for row in lines[1:]:
            excess = excess + row.tax
            taxable += row.taxable_value
            later.append(row)

    worst = max(repeated, key=lambda lines: sum((r.tax.abs_total for r in lines[1:]), _ZERO))

    tracer = ctx.tracer(CalcKind.RULE, "B-08", legal_basis="s.16 CGST Act, 2017 r/w Rule 36(1)")
    tracer.step("documents claimed in more than one period", "count", {}, len(repeated))
    tracer.step("duplicate claims", "count, excluding the earliest", {}, len(later))
    tracer.step(
        "credit claimed twice", "sum(tax) over every claim after the first", {}, excess.total
    )

    return [
        triggered(
            ctx,
            "B-08",
            delta=excess,
            taxable_value_effect=taxable,
            confidence=Confidence.STRONG,
            form=ActionForm.DRC_01A,
            trace=tracer.finish(
                result=excess.total,
                formula_template="excess = sum of tax on every claim after the earliest",
                formula_rendered=f"{len(later)} duplicate claims = {excess.total}",
            ),
            evidence_ids=tuple(r.row_id for r in later[:50] if r.row_id),
            narrative=(
                f"{len(repeated)} supplier invoices appear in more than one tax "
                f"period in GSTR-2B, and the credit was claimed each time. The "
                f"largest is {worst[0].doc_no} from {worst[0].supplier_gstin}, in "
                f"{', '.join(sorted({str(r.period) for r in worst}))}. "
                f"Credit notes and amendments are excluded - both carry the "
                f"document number of the record they refer to and neither is a "
                f"second claim. The earliest claim stands; the figure is "
                f"everything after it."
            ),
            extra={
                "documents": len(repeated),
                "duplicate_claims": len(later),
                "largest_document": worst[0].doc_no or "",
                "largest_supplier": worst[0].supplier_gstin or "",
            },
        )
    ]
