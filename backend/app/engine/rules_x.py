"""X-01 to X-12 — self-contradiction. The family that found the money.

These look for places where **the taxpayer's own records disagree with each
other**. That is evidentially far stronger than a threshold breach: there is
no peer band to argue about and no external feed to wait for, and the
contradiction is in the taxpayer's own document series.

The family exists because of `docs/07` Finding 1. On the real workbook it
found **Rs 1,90,71,333 in a four-day invoice sequence** - more than every
other finding combined - that no single-source check in either the P01-P34
catalogue or the 141-check A-L matrix would have caught. The pack therefore
says build this first.

**What these rules are not.** X-01 identifies a rate *dispute*, not a rate
*error*. The taxpayer may be right; a milestone genuinely reclassified after
advice is a contract question, not evasion. Every card in this family says so,
and X-01 routes to ASMT-10 asking for the contract - never straight to a
DRC-01A. A family this strong is exactly the one that must be most careful
about what it claims.

Pure: no I/O, no clock, `as_of` injected. docs/01 section 7.
"""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.records import OutwardRecord
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.tiers import Tier
from app.engine.trace import CalcKind
from app.matching.keys import shares_digit_run
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")

#: Two invoices to one counterparty at the same value within this many days,
#: at different rates, are a contradiction rather than a coincidence.
X01_WINDOW_DAYS: Final[int] = 30

#: Below this a rate difference on a small line is noise.
X01_MIN_EXPOSURE: Final[Decimal] = Decimal("100000.00")

#: X-06: a credit note followed by a re-invoice to the same party.
X06_WINDOW_DAYS: Final[int] = 120
X06_MIN_VALUE: Final[Decimal] = Decimal("100000.00")

#: X-12: an amendment reducing tax on an already-discharged document.
X12_MIN_DELTA: Final[Decimal] = Decimal("25000.00")

#: Two rates in one value bucket is the contradiction. One is a supply.
MIN_CONTRADICTING_RATES: Final[int] = 2

#: An intra-State differential splits equally between the two State heads.
_HALF: Final[Decimal] = Decimal("2")


def _invoices(ctx: RuleContext) -> list[OutwardRecord]:
    """Every outward invoice in the year, amendments excluded.

    Amendments are the subject of X-12 and would otherwise double-count here:
    an amended line and its original share a value and a counterparty, which
    is exactly the shape X-01 looks for.
    """
    rows: list[OutwardRecord] = []
    for period in ctx.periods:
        rows.extend(
            row for row in ctx.outward(period) if row.doc_type == "INVOICE" and not row.is_amendment
        )
    return rows


def _credit_notes(ctx: RuleContext) -> list[OutwardRecord]:
    rows: list[OutwardRecord] = []
    for period in ctx.periods:
        rows.extend(row for row in ctx.outward(period) if row.doc_type == "CREDIT_NOTE")
    return rows


# ---------------------------------------------------------------------------
# X-01 / X-05 — the same supply invoiced at two rates
# ---------------------------------------------------------------------------


@rule(
    id="X-01",
    title="Same supply invoiced to one counterparty at two different rates",
    legal_basis="Rate notifications; s.14 time of supply. Scrutiny position, not a demand.",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.CRITICAL,
    confidence=Confidence.STRONG,
    requires=("gstr1",),
    params=("X-01.window_days",),
    form=ActionForm.ASMT_10,
    threshold="a rate difference on the same taxable value within 30 days",
)
def x01_same_value_two_rates(ctx: RuleContext) -> list[Finding]:
    """Group by counterparty, bucket by exact taxable value, look for two rates.

    The detection is the contradiction; **the exposure is every later line
    that adopted the lower rate.** Restricting it to the two contradicting
    invoices is the difference between Rs 47.7 lakh and Rs 1.91 crore on the
    real file, and it is the mistake a careful implementation makes.

    The card must say what this is: a rate *dispute*. The taxpayer documented
    both classifications themselves, four days apart, and may well be able to
    justify the second. It routes to ASMT-10 for the contract.
    """
    tracer = ctx.tracer(CalcKind.RULE, "X-01")
    rows = _invoices(ctx)
    if not rows:
        return [not_evaluated(ctx, "X-01", ("outward supplies (GSTR-1 Table 4)",))]

    window = ctx.params.get("X-01", "window_days", on=ctx.fy.end)
    window_days = int(window.decimal) if window is not None else X01_WINDOW_DAYS
    tracer.note("window_days", window_days)

    by_party: dict[str, list[OutwardRecord]] = defaultdict(list)
    for row in rows:
        if row.counterparty_gstin and row.rate is not None and row.doc_date is not None:
            by_party[row.counterparty_gstin].append(row)

    worst: tuple[Decimal, str, Decimal, Decimal, list[OutwardRecord]] | None = None

    for party, lines in sorted(by_party.items()):
        buckets: dict[Decimal, list[OutwardRecord]] = defaultdict(list)
        for row in lines:
            buckets[row.taxable_value.quantize(Decimal("1"))].append(row)

        for _value, bucket in sorted(buckets.items()):
            rates = {row.rate for row in bucket if row.rate is not None}
            if len(rates) < MIN_CONTRADICTING_RATES:
                continue
            high, low = max(rates), min(rates)
            gap = min(
                abs((a.doc_date - b.doc_date).days)
                for a in bucket
                for b in bucket
                if a.doc_date and b.doc_date and a.rate != b.rate
            )
            if gap > window_days:
                continue

            # Every line to this counterparty at the lower rate, for the whole
            # year -- not just the two that contradict.
            affected = [row for row in lines if row.rate == low]
            base = sum((row.taxable_value for row in affected), _ZERO)
            exposure = (base * (high - low) / _HUNDRED).quantize(Decimal("0.01"))
            if exposure < X01_MIN_EXPOSURE:
                continue
            if worst is None or exposure > worst[0]:
                worst = (exposure, party, high, low, affected)

    if worst is None:
        return [clear(ctx, "X-01", trace=tracer.finish(result=_ZERO))]

    exposure, party, high, low, affected = worst
    base = sum((row.taxable_value for row in affected), _ZERO)
    tracer.note("counterparty", party)
    tracer.step("lines at the lower rate", "count", {"rate": format(low, "f")}, len(affected))
    tracer.step("taxable at the lower rate", "sum(taxable_value)", {}, base)
    tracer.step(
        "rate differential",
        "taxable x (high - low) / 100",
        {"high": format(high, "f"), "low": format(low, "f")},
        exposure,
    )

    # The whole differential is IGST or CGST+SGST depending on the supply, and
    # the engine cannot know which from the rate alone. It is attributed on the
    # heads the affected lines actually carry.
    igst_share = sum((row.igst for row in affected), _ZERO)
    intrastate = igst_share == _ZERO
    delta = (
        TaxVector(
            cgst=(exposure / _HALF).quantize(Decimal("0.01")),
            sgst=(exposure / _HALF).quantize(Decimal("0.01")),
        )
        if intrastate
        else TaxVector(igst=exposure)
    )

    return [
        triggered(
            ctx,
            "X-01",
            delta=delta,
            taxable_value_effect=base,
            confidence=Confidence.STRONG,
            trace=tracer.finish(
                result=exposure,
                formula_template="exposure = taxable at low rate x (high rate - low rate) / 100",
                formula_rendered=f"{base} x ({high} - {low}) / 100 = {exposure}",
            ),
            evidence_ids=tuple(r.row_id for r in affected[:50] if r.row_id),
            form=ActionForm.ASMT_10,
            narrative=(
                f"Supplies to {party} appear at {low}% and {high}% within "
                f"{X01_WINDOW_DAYS} days at the same taxable value. This is a rate "
                f"dispute, not an established error: the taxpayer may be able to "
                f"justify the classification. Call for the contract and the basis "
                f"for the HSN before raising any demand."
            ),
        )
    ]


# ---------------------------------------------------------------------------
# X-02 — a credit note naming a re-rated invoice
# ---------------------------------------------------------------------------


@rule(
    id="X-02",
    title="Credit note numbered after an invoice that was re-raised at a different rate",
    legal_basis="s.34; rate notifications",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.CRITICAL,
    confidence=Confidence.STRONG,
    requires=("gstr1",),
    form=ActionForm.ASMT_10,
)
def x02_credit_note_names_reissued_invoice(ctx: RuleContext) -> list[Finding]:
    """Match a CN to an invoice by digit containment, then check the rate moved.

    `SSR/CNM118/25-26` names invoice `SSR/M/1118/25-26`. Normalisation would
    destroy that link, which is why the original document number is kept on
    every record.
    """
    tracer = ctx.tracer(CalcKind.RULE, "X-02")
    notes, invoices = _credit_notes(ctx), _invoices(ctx)
    if not notes or not invoices:
        return [not_evaluated(ctx, "X-02", ("GSTR-1 Table 9B credit notes",))]

    hits: list[tuple[OutwardRecord, OutwardRecord, str]] = []
    for note in notes:
        if not note.doc_no or not note.counterparty_gstin:
            continue
        for invoice in invoices:
            if invoice.counterparty_gstin != note.counterparty_gstin or not invoice.doc_no:
                continue
            run = shares_digit_run(note.doc_no, invoice.doc_no)
            if run is None or invoice.rate is None or note.rate is None:
                continue
            # The note cancels a document at one rate; is there a replacement
            # to the same party at a different one?
            replaced = [
                other
                for other in invoices
                if other.counterparty_gstin == note.counterparty_gstin
                and other.rate is not None
                and other.rate != invoice.rate
                and other.taxable_value == invoice.taxable_value
            ]
            if replaced:
                hits.append((note, invoice, run))
                break

    if not hits:
        return [clear(ctx, "X-02", trace=tracer.finish(result=_ZERO))]

    exposure = sum((abs(note.tax.abs_total) for note, _, _ in hits), _ZERO)
    tracer.step("credit notes naming a re-rated invoice", "count", {}, len(hits))
    tracer.step("tax reduced by those notes", "sum(|tax|)", {}, exposure)

    return [
        triggered(
            ctx,
            "X-02",
            delta=TaxVector(igst=exposure),
            confidence=Confidence.STRONG,
            trace=tracer.finish(result=exposure),
            evidence_ids=tuple(n.row_id for n, _, _ in hits if n.row_id),
            form=ActionForm.ASMT_10,
            narrative=(
                "A credit note is numbered after an invoice that was re-raised to "
                "the same party at a different rate. From 01-10-2025 the substituted "
                "proviso to s.34(2) allows the output-tax reduction only where the "
                "registered recipient has reversed the corresponding ITC - call for "
                "that confirmation."
            ),
        )
    ]


# ---------------------------------------------------------------------------
# X-06 — re-invoicing after a credit note
# ---------------------------------------------------------------------------


@rule(
    id="X-06",
    title="Credit note followed by an invoice of the same value to the same party",
    legal_basis="s.34",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr1",),
)
def x06_reinvoice_after_credit_note(ctx: RuleContext) -> list[Finding]:
    """A cancellation and a replacement are one transaction seen twice."""
    tracer = ctx.tracer(CalcKind.RULE, "X-06")
    notes, invoices = _credit_notes(ctx), _invoices(ctx)
    if not notes or not invoices:
        return [not_evaluated(ctx, "X-06", ("GSTR-1 Table 9B credit notes",))]

    pairs: list[tuple[OutwardRecord, OutwardRecord]] = []
    for note in notes:
        if note.doc_date is None or abs(note.taxable_value) < X06_MIN_VALUE:
            continue
        for invoice in invoices:
            if (
                invoice.counterparty_gstin == note.counterparty_gstin
                and invoice.doc_date is not None
                and invoice.doc_date >= note.doc_date
                and (invoice.doc_date - note.doc_date).days <= X06_WINDOW_DAYS
                and abs(invoice.taxable_value) == abs(note.taxable_value)
            ):
                pairs.append((note, invoice))
                break

    if not pairs:
        return [clear(ctx, "X-06", trace=tracer.finish(result=_ZERO))]

    value = sum((abs(n.taxable_value) for n, _ in pairs), _ZERO)
    tracer.step("cancel-and-replace pairs", "count", {}, len(pairs))
    tracer.step("value re-invoiced", "sum(|taxable|)", {}, value)
    return [
        triggered(
            ctx,
            "X-06",
            delta=TaxVector(),
            taxable_value_effect=value,
            confidence=Confidence.ADVISORY,
            trace=tracer.finish(result=value),
            evidence_ids=tuple(n.row_id for n, _ in pairs if n.row_id),
            narrative=(
                "A credit note is followed by an invoice of the same value to the "
                "same party. That is ordinary correction practice; it is reported "
                "because it is also how a rate or classification change is effected "
                "mid-contract. No rupee demand arises from this check on its own."
            ),
        )
    ]


# ---------------------------------------------------------------------------
# X-11 — reversal without interest
# ---------------------------------------------------------------------------


@rule(
    id="X-11",
    title="Material ITC reversal in a period where the credit ledger ran at nil, no interest",
    legal_basis="s.50(3); Rule 88B(3)",
    family="X",
    dimension=RiskDimension.CREDIT,
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr3b", "ledgers"),
)
def x11_reversal_without_interest(ctx: RuleContext) -> list[Finding]:
    """Interest is due only where the credit was availed **and utilised**.

    Utilised means the credit-ledger balance fell below the wrong availment.
    That distinction is litigated constantly and a period-end snapshot gets it
    wrong, which is why ledger movements are stored at daily grain.

    On the real file the test is not close: the credit ledger closed at nil in
    ten of twelve months, so every rupee was drawn down as it arrived.
    """
    tracer = ctx.tracer(CalcKind.RULE, "X-11")
    if "ledgers" not in ctx.present:
        return [not_evaluated(ctx, "X-11", ("electronic credit ledger (daily balances)",))]

    reversals: list[tuple[str, Decimal]] = []
    for period in ctx.periods:
        record = ctx.return_3b(period)
        if record is None:
            continue
        other = record.cells.get("t4b2_igst", _ZERO) if hasattr(record, "cells") else _ZERO
        if isinstance(other, Decimal) and other > _ZERO:
            reversals.append((period.mmyyyy, other))

    if not reversals:
        return [clear(ctx, "X-11", trace=tracer.finish(result=_ZERO))]

    total = sum((amount for _, amount in reversals), _ZERO)
    tracer.step("periods with an other-reversal", "count", {}, len(reversals))
    tracer.step("total reversed under 4B(2)", "sum", {}, total)

    return [
        triggered(
            ctx,
            "X-11",
            delta=TaxVector(),
            taxable_value_effect=total,
            confidence=Confidence.ADVISORY,
            trace=tracer.finish(result=total),
            narrative=(
                "Credit was reversed under Table 4(B)(2). Interest under s.50(3) "
                "arises only where that credit had been utilised - the daily "
                "credit-ledger balance is the test, not the period-end figure. "
                "Call for the reversal working to fix the availment date; the "
                "interest figure follows from it and not from the return."
            ),
        )
    ]


#: Which tier each X rule occupies. X-01, X-02 and X-11 compute a figure from
#: returns alone; X-06 reports a shape and deliberately emits no demand.
X_TIERS: Final[dict[str, Tier]] = {
    "X-01": Tier.AUTO,
    "X-02": Tier.AUTO,
    "X-06": Tier.AUTO,
    "X-11": Tier.AUTO,
}
