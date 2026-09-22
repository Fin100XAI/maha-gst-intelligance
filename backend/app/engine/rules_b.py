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
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.records import InwardRecord
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
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

    return [
        triggered(
            ctx,
            "B-04",
            delta=exposure,
            taxable_value_effect=taxable,
            confidence=Confidence.CERTAIN,
            form=ActionForm.DRC_01A,
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
