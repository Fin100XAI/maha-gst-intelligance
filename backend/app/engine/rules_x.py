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
from app.engine.tiers import DocumentCall, Tier
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

#: Chapter 99 is services; 01 to 98 are goods.
_SERVICE_CHAPTER: Final[str] = "99"

#: X-05: three identical billings to one counterparty are a contract, not a
#: coincidence. Two are what X-01 already looks at, with a window.
MIN_SERIES_LENGTH: Final[int] = 3


def _invoices(ctx: RuleContext) -> list[OutwardRecord]:
    """Every outward invoice in the year, amendments excluded.

    Amendments are the subject of X-12 and would otherwise double-count here:
    an amended line and its original share a value and a counterparty, which
    is exactly the shape X-01 looks for.
    """
    rows: list[OutwardRecord] = []
    for period in ctx.periods:
        rows.extend(
            row
            for row in ctx.outward(period)
            if row.doc_type == "INVOICE" and not _amends_something(row)
        )
    return rows


def _amends_something(row: OutwardRecord) -> bool:
    """Both spellings, because a row can carry either.

    `is_amendment` is a column the loader fills from the section, and the
    section itself survives on the row. Testing only the flag was wrong: on a
    B2BA sheet the section says AMENDMENT and the flag agrees, but a row
    reaching the engine any other way carries only one of them, and X-01
    would then count an amendment as an ordinary invoice and compare it with
    the very line it amends.
    """
    return row.is_amendment or row.section == "AMENDMENT"


def _credit_notes(ctx: RuleContext) -> list[OutwardRecord]:
    rows: list[OutwardRecord] = []
    for period in ctx.periods:
        rows.extend(row for row in ctx.outward(period) if row.doc_type == "CREDIT_NOTE")
    return rows


def _rate(value: Decimal) -> str:
    """A rate as a person writes it. `5` and `18`, not `5.0000000000`.

    The column arrives as a high-precision decimal and goes straight into the
    sentence an officer reads on a notice. Trailing zeros there are not a
    cosmetic problem: they read as a machine's output rather than a
    department's statement.
    """
    return format(value.normalize(), "f")


def _days_between_rates(bucket: list[OutwardRecord]) -> int | None:
    """Smallest gap in days between two lines of this bucket at different rates.

    `None` when the bucket does not actually contain two rates, which the
    callers have already excluded - it is here so the type says so.
    """
    gaps = [
        abs((a.doc_date - b.doc_date).days)
        for a in bucket
        for b in bucket
        if a.doc_date and b.doc_date and a.rate != b.rate
    ]
    return min(gaps) if gaps else None


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
            gap = _days_between_rates(bucket)
            if gap is None or gap > window_days:
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
                f"Supplies to {party} appear at {_rate(low)}% and {_rate(high)}% within "
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


# ---------------------------------------------------------------------------
# X-03 — one HSN, two rates, one period
# ---------------------------------------------------------------------------


def _has_hsn(ctx: RuleContext) -> bool:
    """Whether any outward line carries an HSN at all.

    The portal's B2B export does not have an HSN column - it lives in Table
    12, the HSN summary, which this platform recognises and does not yet
    ingest. So on the reference workbook every HSN check is dark, and the two
    below say so by name instead of returning nothing and being read as a
    clean pass.
    """
    return any(row.hsn for row in ctx.data.outward)


def _hsn_chapter(hsn: str) -> str:
    """The first two digits. 99 is services; 01 to 98 are goods."""
    return hsn[:2]


@rule(
    id="X-03",
    title="One HSN taxed at two rates inside a single tax period",
    legal_basis="Rate notifications under s.9(1) CGST Act, 2017",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr1",),
    params=("X-03.min_delta",),
    relates_to=("X-01", "OUT-07"),
    form=ActionForm.ASMT_10,
    threshold="same HSN at two rates in one period, differential above Rs 1 lakh",
    tier=Tier.ASSISTED,
)
def x03_one_hsn_two_rates(ctx: RuleContext) -> list[DocumentCall] | list[Finding]:
    """ASSISTED, and the tier is the whole design of this check.

    `docs/01` states the test as *two rates on one HSN in one period **with no
    rate notification effective in that period***. The first limb is
    arithmetic over the return. The second needs an effective-dated rate
    master, which this platform declares as a seam (`OUT-07`) and does not yet
    hold.

    The rate structure changed on **22 September 2025**, inside the financial
    year under scrutiny. So the exclusion this check cannot apply is not
    hypothetical: for September 2025 it is the likely explanation, and a rupee
    finding emitted without it would be a demand resting on a notification the
    engine never read.

    So it calls for the document instead. The differential is computed and
    shown, because an officer needs to know whether this is worth a letter -
    but it is carried as `unquantified_exposure` on a `DocumentCall`, which
    does not move the F-Score and cannot reach a notice. Law 5 expressed as a
    tier rather than as an abstention: "the second limb could not be checked"
    is more useful than silence and safer than a number.
    """
    if not _has_hsn(ctx):
        return [not_evaluated(ctx, "X-03", ("HSN on the outward lines (GSTR-1 Table 12)",))]

    floor = ctx.params.get("X-03", "min_delta", on=ctx.fy.end)
    calls: list[DocumentCall] = []

    for period in ctx.periods:
        by_hsn: dict[str, list[OutwardRecord]] = defaultdict(list)
        for row in ctx.outward(period):
            if row.hsn and row.rate is not None and row.taxable_value > _ZERO:
                by_hsn[row.hsn].append(row)

        for hsn, lines in sorted(by_hsn.items()):
            rates = {row.rate for row in lines if row.rate is not None}
            if len(rates) < MIN_CONTRADICTING_RATES:
                continue
            high, low = max(rates), min(rates)
            at_low = [row for row in lines if row.rate == low]
            base = sum((row.taxable_value for row in at_low), _ZERO)
            differential = (base * (high - low) / _HUNDRED).quantize(Decimal("0.01"))
            if differential < floor.decimal:
                continue

            tracer = ctx.tracer(
                CalcKind.RULE,
                "X-03",
                period=period,
                legal_basis="Rate notifications under s.9(1) CGST Act, 2017",
            )
            tracer.used_parameter(floor.use())
            tracer.note("hsn", hsn)
            tracer.step("lines at the lower rate", "count", {"rate": _rate(low)}, len(at_low))
            tracer.step("taxable at the lower rate", "sum(taxable_value)", {}, base)
            tracer.step(
                "rate differential",
                "taxable x (high - low) / 100",
                {"high": _rate(high), "low": _rate(low)},
                differential,
            )

            calls.append(
                DocumentCall(
                    check_id="X-03",
                    gstin=ctx.gstin,
                    period=period,
                    document=(
                        f"the classification basis for HSN {hsn} - the rate "
                        f"notification relied on, and the date it took effect"
                    ),
                    legal_basis="Rate notifications under s.9(1) CGST Act, 2017",
                    question=(
                        f"HSN {hsn} was billed at both {_rate(low)}% and {_rate(high)}% within "
                        f"{period.mmyyyy}. If a notification changed the rate inside "
                        f"this period that is a complete answer and no further reply "
                        f"is needed; otherwise state the basis on which the same "
                        f"goods or service bore two rates. Differential on the "
                        f"{len(at_low)} lines at {_rate(low)}%: Rs {differential}."
                    ),
                    unquantified_exposure=differential,
                    severity=Severity.HIGH,
                    evidence_ids=tuple(r.row_id for r in at_low[:50] if r.row_id),
                    trace=tracer.finish(
                        result=differential,
                        formula_template=(
                            "differential = taxable at low rate x (high rate - low rate) / 100"
                        ),
                        formula_rendered=(
                            f"{base} x ({_rate(high)} - {_rate(low)}) / 100 = {differential}"
                        ),
                    ),
                )
            )
    return calls


# ---------------------------------------------------------------------------
# X-04 — the same supply under a goods chapter and a service SAC
# ---------------------------------------------------------------------------


@rule(
    id="X-04",
    title="The same value billed under both a goods chapter and a service SAC",
    legal_basis="Schedule II CGST Act, 2017; classification under s.9(1)",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr1",),
    relates_to=("X-03",),
    form=ActionForm.ASMT_10,
    threshold="identical taxable value under chapters 01-98 and 99xxxx",
    tier=Tier.ASSISTED,
)
def x04_goods_and_service_for_one_supply(ctx: RuleContext) -> list[DocumentCall] | list[Finding]:
    """Whether a supply is goods or a service is a contract question.

    The return carries an HSN and a value; it does not carry what was
    supplied. Two lines of identical value to one counterparty, one under a
    goods chapter and one under a service SAC, is a real signal - a works
    contract split, or a composite supply billed twice - and it is also
    exactly what a legitimate supply of goods plus its installation looks
    like.

    The engine cannot tell those apart from the return, and `ASSISTED` is the
    honest way to say so. It asks for the contract and the description rather
    than attaching a rupee figure to a judgement it has no basis for.
    """
    if not _has_hsn(ctx):
        return [not_evaluated(ctx, "X-04", ("HSN on the outward lines (GSTR-1 Table 12)",))]

    calls: list[DocumentCall] = []
    by_party: dict[str, list[OutwardRecord]] = defaultdict(list)
    for row in _invoices(ctx):
        if row.counterparty_gstin and row.hsn and row.taxable_value > _ZERO:
            by_party[row.counterparty_gstin].append(row)

    for party, lines in sorted(by_party.items()):
        buckets: dict[Decimal, list[OutwardRecord]] = defaultdict(list)
        for row in lines:
            buckets[row.taxable_value.quantize(Decimal("1"))].append(row)

        for value, bucket in sorted(buckets.items()):
            chapters = {_hsn_chapter(row.hsn) for row in bucket if row.hsn}
            services = {c for c in chapters if c == _SERVICE_CHAPTER}
            goods = chapters - services
            if not services or not goods:
                continue
            calls.append(
                DocumentCall(
                    check_id="X-04",
                    gstin=ctx.gstin,
                    period=None,
                    document=(
                        f"the contract and the supply description for the "
                        f"Rs {value} billings to {party}"
                    ),
                    legal_basis="Schedule II CGST Act, 2017; classification under s.9(1)",
                    question=(
                        f"Supplies of the same taxable value to {party} appear under "
                        f"both a goods chapter ({', '.join(sorted(goods))}) and a "
                        f"service SAC (99). State whether this is one composite "
                        f"supply, a works contract, or separate supplies of goods and "
                        f"of installation, and produce the contract."
                    ),
                    severity=Severity.HIGH,
                    evidence_ids=tuple(r.row_id for r in bucket[:50] if r.row_id),
                )
            )
    return calls


# ---------------------------------------------------------------------------
# X-05 — a rate break in a recurring series
# ---------------------------------------------------------------------------


@rule(
    id="X-05",
    title="A recurring same-value milestone series changes rate mid-contract",
    legal_basis="Rate notifications; s.14 time of supply. Scrutiny position, not a demand.",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.CRITICAL,
    confidence=Confidence.STRONG,
    requires=("gstr1",),
    params=("X-01.min_exposure",),
    relates_to=("X-01",),
    form=ActionForm.ASMT_10,
    threshold="three or more same-value milestones to one counterparty, then a rate change",
)
def x05_rate_break_in_a_series(ctx: RuleContext) -> list[Finding]:
    """X-01's sibling, and the stronger of the two where it applies.

    X-01 asks whether two invoices of the same value carry different rates
    within thirty days. X-05 drops the window entirely and asks a different
    question: was there an established *series* - the same value, to the same
    counterparty, three times or more - and did the rate change part-way
    through it?

    The window is what X-01 uses to argue that two lines are the same supply.
    A series argues it far better and needs no window: three identical
    milestone billings to one counterparty are a contract, and a contract does
    not change its classification in the middle without a reason. That is why
    this one can look across the whole year where X-01 cannot.

    **Same exposure rule as X-01, and for the same reason.** The break is the
    detection; the exposure is every milestone in the series that took the
    lower rate, not the one where it changed. `docs/01` is explicit that
    confining it to the contradicting pair is the mistake that turns
    Rs 1.91 crore into Rs 47.7 lakh.

    Still a dispute, not an error. Routes to ASMT-10 for the contract.
    """
    rows = _invoices(ctx)
    if not rows:
        return [not_evaluated(ctx, "X-05", ("outward supplies (GSTR-1 Table 4)",))]

    floor = ctx.params.get("X-01", "min_exposure", on=ctx.fy.end)
    window = ctx.params.get("X-01", "window_days", on=ctx.fy.end)
    window_days = int(window.decimal)
    tracer = ctx.tracer(CalcKind.RULE, "X-05")
    tracer.used_parameter(floor.use())
    tracer.used_parameter(window.use())
    tracer.note("ceded_to_x01_within_days", window_days)

    by_party: dict[str, list[OutwardRecord]] = defaultdict(list)
    for row in rows:
        if row.counterparty_gstin and row.rate is not None and row.doc_date is not None:
            by_party[row.counterparty_gstin].append(row)

    worst: tuple[Decimal, str, Decimal, Decimal, int, list[OutwardRecord]] | None = None

    for party, lines in sorted(by_party.items()):
        buckets: dict[Decimal, list[OutwardRecord]] = defaultdict(list)
        for row in lines:
            buckets[row.taxable_value.quantize(Decimal("1"))].append(row)

        for _value, bucket in sorted(buckets.items()):
            if len(bucket) < MIN_SERIES_LENGTH:
                continue
            rates = {row.rate for row in bucket if row.rate is not None}
            if len(rates) < MIN_CONTRADICTING_RATES:
                continue

            # X-01 owns any break that falls inside its window, and the two
            # checks must not both report one event. On the reference file
            # they did, briefly: X-05's evidence was a strict subset of
            # X-01's, the same counterparty and the same two rates, and an
            # officer reading both cards would have seen Rs 2.86 crore where
            # there is Rs 1.91 crore. The division of labour is the window -
            # X-01 argues two lines are one supply because they are days
            # apart, X-05 argues it because they are the third and fourth
            # identical milestone of a contract - so X-05 takes exactly the
            # breaks the window excludes.
            gap = _days_between_rates(bucket)
            if gap is not None and gap <= window_days:
                continue

            high, low = max(rates), min(rates)

            # Every milestone in the series that took the lower rate, whenever
            # it fell - not the two either side of the break.
            affected = [row for row in bucket if row.rate == low]
            base = sum((row.taxable_value for row in affected), _ZERO)
            exposure = (base * (high - low) / _HUNDRED).quantize(Decimal("0.01"))
            if exposure < floor.decimal:
                continue
            if worst is None or exposure > worst[0]:
                worst = (exposure, party, high, low, len(bucket), affected)

    if worst is None:
        return [clear(ctx, "X-05", trace=tracer.finish(result=_ZERO))]

    exposure, party, high, low, series_length, affected = worst
    base = sum((row.taxable_value for row in affected), _ZERO)
    tracer.note("counterparty", party)
    tracer.note("series_length", series_length)
    tracer.step("milestones at the lower rate", "count", {"rate": format(low, "f")}, len(affected))
    tracer.step("taxable at the lower rate", "sum(taxable_value)", {}, base)
    tracer.step(
        "rate differential",
        "taxable x (high - low) / 100",
        {"high": format(high, "f"), "low": format(low, "f")},
        exposure,
    )

    igst_share = sum((row.igst for row in affected), _ZERO)
    delta = (
        TaxVector(
            cgst=(exposure / _HALF).quantize(Decimal("0.01")),
            sgst=(exposure / _HALF).quantize(Decimal("0.01")),
        )
        if igst_share == _ZERO
        else TaxVector(igst=exposure)
    )

    return [
        triggered(
            ctx,
            "X-05",
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
                f"A series of {series_length} billings of the same taxable value to "
                f"{party} changes rate part-way through, from {_rate(high)}% to {_rate(low)}%. A "
                f"repeated identical milestone is a contract, and a contract does not "
                f"reclassify itself mid-way without a reason. The reason may be a good "
                f"one - this is a rate dispute, not an established error. Call for the "
                f"contract and the basis for the change before raising any demand. "
                f"This break falls outside X-01's {window_days}-day window; a break "
                f"inside it is reported there, so the two figures never overlap."
            ),
        )
    ]


# ---------------------------------------------------------------------------
# X-12 — an amendment that reduces tax after the tax was paid
# ---------------------------------------------------------------------------


def _amendments(ctx: RuleContext) -> list[OutwardRecord]:
    rows: list[OutwardRecord] = []
    for period in ctx.periods:
        rows.extend(row for row in ctx.outward(period) if _amends_something(row))
    return rows


@rule(
    id="X-12",
    title="An amendment reduces tax on a document discharged in an earlier period",
    legal_basis="s.34 r/w s.37(3) CGST Act, 2017; proviso to s.39(9)",
    family="X",
    dimension=RiskDimension.LIABILITY,
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr1",),
    params=("X-12.min_delta",),
    relates_to=("X-01", "G-02"),
    form=ActionForm.ASMT_10,
    threshold="amendment reducing tax by more than Rs 25,000 on an earlier period's document",
)
def x12_amendment_reduces_discharged_tax(ctx: RuleContext) -> list[Finding]:
    """A correction is ordinary. A correction that arrives after the money did
    is a different thing, and the timing is the whole check.

    An amendment filed in the same period as its original is bookkeeping: the
    liability is declared once, net. An amendment filed later reduces a
    liability that has already been discharged through a GSTR-3B, so the
    reduction becomes a claim against tax already in the exchequer - and s.34
    requires the recipient's credit to have been reversed before it can be
    allowed.

    **Only where the reference is stated.** The pairing is `amends_doc_no`
    read from the B2BA table's own column, never a document number that
    happens to look similar. `9936A` plainly amends `9936` on the reference
    workbook and the engine still will not act on the resemblance - guessing
    which document was amended is how a demand gets raised against the wrong
    invoice.
    """
    if not ctx.data.outward:
        # No return at all. "We looked and there were no amendments" and
        # "there is no GSTR-1 here" are different statements, and only one of
        # them is a clean pass.
        return [not_evaluated(ctx, "X-12", ("outward supplies (GSTR-1 Table 4)",))]

    amendments = _amendments(ctx)
    if not amendments:
        return [clear(ctx, "X-12")]

    stated = [row for row in amendments if row.amends_doc_no]
    if not stated:
        return [
            not_evaluated(
                ctx,
                "X-12",
                ("the original document reference on the amendment rows (B2BA/CDNRA)",),
            )
        ]

    floor = ctx.params.get("X-12", "min_delta", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "X-12", legal_basis="s.34 CGST Act, 2017")
    tracer.used_parameter(floor.use())

    originals: dict[tuple[str, str], OutwardRecord] = {}
    for period in ctx.periods:
        for row in ctx.outward(period):
            if _amends_something(row) or not row.doc_no:
                continue
            originals.setdefault((row.counterparty_gstin or "", row.doc_no), row)

    reductions: list[tuple[OutwardRecord, OutwardRecord, Decimal]] = []
    for row in stated:
        key = (row.counterparty_gstin or "", row.amends_doc_no or "")
        original = originals.get(key)
        if original is None or original.period is None or row.period is None:
            continue
        if original.period >= row.period:
            # Amended inside its own period: declared once, net, and not a
            # reduction of anything already paid.
            continue
        drop = original.tax.total - row.tax.total
        if drop > floor.decimal:
            reductions.append((row, original, drop))

    if not reductions:
        return [clear(ctx, "X-12", trace=tracer.finish(result=_ZERO))]

    total = sum((drop for _, _, drop in reductions), _ZERO)
    worst = max(reductions, key=lambda item: item[2])
    tracer.step("amendments reducing an earlier period's tax", "count", {}, len(reductions))
    tracer.step(
        "tax reduced",
        "sum(original.tax - amended.tax)",
        {"floor": format(floor.decimal, "f")},
        total,
    )

    delta = sum(
        ((original.tax - row.tax) for row, original, _ in reductions),
        TaxVector(),
    )

    return [
        triggered(
            ctx,
            "X-12",
            delta=delta,
            taxable_value_effect=sum(
                ((original.taxable_value - row.taxable_value) for row, original, _ in reductions),
                _ZERO,
            ),
            confidence=Confidence.STRONG,
            trace=tracer.finish(
                result=total,
                formula_template="reduction = sum(original tax - amended tax)",
                formula_rendered=f"{len(reductions)} amendments, {total} reduced",
            ),
            evidence_ids=tuple(r.row_id for r, _, _ in reductions[:50] if r.row_id),
            form=ActionForm.ASMT_10,
            narrative=(
                f"{len(reductions)} amendments reduce tax on documents declared in an "
                f"earlier period, by {total} in total. The largest is "
                f"{worst[0].doc_no} amending {worst[1].doc_no} "
                f"({worst[1].period} to {worst[0].period}) by {worst[2]}. "
                f"An amendment inside its own period is bookkeeping; one that "
                f"arrives after the liability was discharged reduces tax already "
                f"paid, and s.34 requires the recipient's credit to have been "
                f"reversed before the reduction can be allowed. Call for the "
                f"credit notes and the recipients' reversal confirmations."
            ),
        )
    ]
