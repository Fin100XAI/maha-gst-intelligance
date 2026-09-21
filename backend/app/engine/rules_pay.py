"""PAY -- payment, ledgers, interest and late fee.  Seven rules."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.identities import IdentityStatus, r8, r9, r10, r11
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.trace import CalcKind, render_formula
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")
_YEAR_DAYS: Final[Decimal] = Decimal("365")


@rule(
    id="PAY-01",
    title="Rule 86B: less than 1% of liability discharged in cash",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="Rule 86B CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr3b",),
    params=("PAY-01.turnover_threshold", "PAY-01.min_cash_percent"),
    relates_to=("P07", "P08"),
    form=ActionForm.ASMT_10,
    threshold="monthly taxable turnover above 50 lakh and cash below 1% of liability",
)
def pay_01(ctx: RuleContext) -> list[Finding]:
    """ADVISORY, with an officer confirmation prompt, never an automatic demand.

    Rule 86B has four exemptions -- income tax above 1 lakh in each of two
    preceding years, a refund above 1 lakh, cumulative 1% already paid in the
    year, and government bodies -- and only the third is checkable from GST
    data alone.  Raising this as a demand would be wrong in every exempt case.
    """
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "PAY-01", missing)]

    turnover_threshold = ctx.params.get("PAY-01", "turnover_threshold", on=ctx.fy.end)
    cash_percent = ctx.params.get("PAY-01", "min_cash_percent", on=ctx.fy.end)

    findings: list[Finding] = []
    cumulative_cash = _ZERO
    cumulative_liability = _ZERO

    for period in ctx.periods:
        ret = ctx.return_3b(period)
        if ret is None:
            continue
        # Exclude exempt and zero-rated: Rule 86B is on taxable turnover.
        monthly_taxable = ret.cell("t31a_taxable")
        liability = ret.payable.total
        cash = ret.paid_cash.total
        cumulative_cash += cash
        cumulative_liability += liability

        if monthly_taxable <= turnover_threshold.decimal or liability <= 0:
            continue

        share = (cash / liability * _HUNDRED).quantize(Decimal("0.01"))
        if share >= cash_percent.decimal:
            continue

        cumulative_share = (
            (cumulative_cash / cumulative_liability * _HUNDRED).quantize(Decimal("0.01"))
            if cumulative_liability > 0
            else _ZERO
        )

        tracer = ctx.tracer(
            CalcKind.RULE, "PAY-01", period=period, legal_basis="Rule 86B CGST Rules, 2017"
        )
        tracer.used_parameter(turnover_threshold.use())
        tracer.used_parameter(cash_percent.use())
        tracer.step("monthly taxable turnover", "3B[3.1(a)] taxable value", {}, monthly_taxable)
        tracer.step(
            "cash share of liability",
            "3B[6.1 col 8] / 3B[6.1 col 2] x 100",
            {"cash": cash, "liability": liability},
            share,
        )
        tracer.step(
            "cumulative cash share for the year so far",
            "the only Rule 86B exemption checkable from GST data alone",
            {},
            cumulative_share,
        )
        tracer.note("share", share)
        tracer.note("cumulative_share", cumulative_share)
        tracer.evidence(ret.prov_id)

        exempt_by_cumulative = cumulative_share >= cash_percent.decimal
        trace = tracer.finish(
            result=share,
            formula_template="taxable turnover > 50 lakh AND cash / liability < 1%",
            formula_rendered=f"{cash} / {liability} = {share}% (cumulative {cumulative_share}%)",
        )
        if exempt_by_cumulative:
            findings.append(
                clear(
                    ctx,
                    "PAY-01",
                    period=period,
                    trace=trace,
                    narrative=f"Cash share is {share}% this period but {cumulative_share}% "
                    f"cumulatively, which meets the Rule 86B proviso.",
                )
            )
            continue

        findings.append(
            triggered(
                ctx,
                "PAY-01",
                period=period,
                taxable_value_effect=monthly_taxable,
                trace=trace,
                narrative=(
                    f"Taxable turnover of {monthly_taxable} with only {share}% of liability "
                    f"discharged in cash. Rule 86B exemptions for income tax paid, refunds "
                    f"received and government bodies cannot be checked from GST data: an "
                    f"officer must confirm before any demand."
                ),
                extra={"requires_officer_confirmation": True, "cash_share": format(share, "f")},
            )
        )
    return findings


@rule(
    id="PAY-02",
    title="Interest short-paid on a late GSTR-3B",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="s.50(1) CGST Act, 2017 r/w Rule 88B(1)",
    severity=Severity.MEDIUM,
    confidence=Confidence.CERTAIN,
    requires=("gstr3b", "filing_status"),
    params=("PAY-02.interest_rate", "PAY-02.min_amount"),
    relates_to=("P11",),
    form=ActionForm.DRC_01A,
    threshold="above 1,000",
)
def pay_02(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b", "filing_status"))
    if missing:
        return [not_evaluated(ctx, "PAY-02", missing)]

    minimum = ctx.params.get("PAY-02", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        identity = r10(ctx, period)
        if identity.status == IdentityStatus.NOT_EVALUATED:
            continue
        shortfall = identity.delta.positive_part()
        if shortfall.total <= minimum.decimal:
            continue
        findings.append(
            triggered(
                ctx,
                "PAY-02",
                period=period,
                observed=identity.trace.inputs["declared"],
                expected=identity.trace.inputs["expected"],
                delta=shortfall,
                interest=shortfall.total,
                trace=identity.trace,
                narrative=f"Return filed {identity.trace.inputs['days']} day(s) late; interest "
                f"of {identity.trace.inputs['expected'].total} was due and "
                f"{identity.trace.inputs['declared'].total} was declared.",
            )
        )
    return findings


@rule(
    id="PAY-03",
    title="Interest on credit wrongly availed and utilised",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="s.50(3) CGST Act, 2017 r/w Rule 88B(3)",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("ledgers", "gstr3b"),
    params=("PAY-03.interest_rate", "PAY-03.min_amount"),
    form=ActionForm.DRC_01A,
    threshold="above 1,000",
)
def pay_03(ctx: RuleContext) -> list[Finding]:
    """The worked specification in docs/01 section C3.

    Interest runs from the day the credit balance first fell **below** the
    wrongly availed amount -- the day the wrong credit was actually used.  If
    the balance never fell that far, the credit was availed but never utilised,
    and only reversal is due, with **no interest**.  That distinction is
    litigated constantly, which is why it is computed on a daily running
    balance rather than a period-end snapshot.
    """
    missing = ctx.missing(("ledgers", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "PAY-03", missing)]

    wrong_availment = ctx.extras.get("wrong_availment")
    if wrong_availment is None:
        return [
            not_evaluated(
                ctx,
                "PAY-03",
                ("an established wrongly-availed amount (from ITC-01/02/03 disposition)",),
            )
        ]

    rate = ctx.params.get("PAY-03", "interest_rate", on=ctx.fy.end)
    minimum = ctx.params.get("PAY-03", "min_amount", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE, "PAY-03", legal_basis="s.50(3) CGST Act, 2017 r/w Rule 88B(3)"
    )
    tracer.used_parameter(rate.use())
    tracer.used_parameter(minimum.use())

    wrong: TaxVector = wrong_availment
    reversal_date = ctx.extras.get("reversal_date") or ctx.as_of
    interest_total = _ZERO
    per_head: dict[str, Decimal] = {}

    for head in ("igst", "cgst", "sgst", "cess"):
        amount = getattr(wrong, head)
        if amount <= 0:
            continue
        # The daily balance for this head, in date order.
        daily = sorted(
            (
                row
                for row in ctx.data.ledgers
                if row.head.lower() == head and row.ledger == "CREDIT"
            ),
            key=lambda row: row.as_on,
        )
        utilisation_date: date | None = None
        for row in daily:
            if row.closing < amount:
                utilisation_date = row.as_on
                break

        if utilisation_date is None:
            tracer.step(
                f"{head.upper()}: availed but never utilised",
                "the credit balance never fell below the wrongly availed amount",
                {"wrong": amount, "days_examined": len(daily)},
                "reversal only, NO interest",
            )
            continue

        days = max(0, (reversal_date - utilisation_date).days)
        interest = (amount * rate.decimal / _HUNDRED * Decimal(days) / _YEAR_DAYS).quantize(
            Decimal("0.01")
        )
        per_head[head] = interest
        interest_total += interest
        tracer.step(
            f"{head.upper()}: utilised from {utilisation_date}",
            "first date the balance fell below the wrongly availed amount",
            {"wrong": amount, "days": days, "rate": rate.decimal},
            interest,
        )

    tracer.note("wrong_availment", wrong)
    tracer.note("reversal_date", reversal_date)
    tracer.note("interest", interest_total)

    trace = tracer.finish(
        result=interest_total,
        formula_template="interest = utilised x rate/100 x (reversal_date - utilisation_date)/365, "
        "where utilisation_date is the first day the daily balance fell below the availment",
        formula_rendered=render_formula(
            "interest {interest} on {wrong}", {"interest": interest_total, "wrong": wrong}
        ),
    )
    if interest_total > minimum.decimal:
        return [
            triggered(
                ctx,
                "PAY-03",
                observed=wrong,
                delta=TaxVector(**per_head),
                interest=interest_total,
                trace=trace,
                narrative=f"Interest of {interest_total} on credit wrongly availed and "
                f"utilised, computed on the daily credit-ledger balance.",
            )
        ]
    return [
        clear(
            ctx,
            "PAY-03",
            trace=trace,
            narrative="The credit balance never fell below the wrongly availed amount, so "
            "the credit was availed but never utilised: reversal only, no interest.",
        )
    ]


@rule(
    id="PAY-04",
    title="Late fee short-paid",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="s.47 CGST Act, 2017",
    severity=Severity.LOW,
    confidence=Confidence.STRONG,
    requires=("gstr3b", "filing_status"),
    params=("PAY-04.daily_fee", "PAY-04.daily_fee_nil", "PAY-04.min_amount"),
    relates_to=("P11",),
    form=ActionForm.DRC_01A,
    threshold="above 500",
)
def pay_04(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b", "filing_status"))
    if missing:
        return [not_evaluated(ctx, "PAY-04", missing)]

    minimum = ctx.params.get("PAY-04", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        identity = r11(ctx, period)
        if identity.status == IdentityStatus.NOT_EVALUATED:
            continue
        shortfall = identity.delta.positive_part()
        if shortfall.total <= minimum.decimal:
            continue
        findings.append(
            triggered(
                ctx,
                "PAY-04",
                period=period,
                observed=identity.trace.inputs["declared"],
                expected=identity.trace.inputs["expected"],
                delta=shortfall,
                penalty=shortfall.total,
                trace=identity.trace,
                narrative=f"Late fee of {identity.trace.inputs['expected'].total} was due for "
                f"{identity.trace.inputs['days']} day(s); "
                f"{identity.trace.inputs['declared'].total} was declared. Computed "
                f"uncapped: the turnover-graded cap grid is not configured.",
            )
        )
    return findings


@rule(
    id="PAY-05",
    title="Credit-ledger identity broken",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="s.49 CGST Act, 2017 r/w Rule 86",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("ledgers",),
    params=("PAY-05.min_amount",),
    form=ActionForm.ASMT_10,
    threshold="above 1 rupee",
)
def pay_05(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("ledgers",))
    if missing:
        return [not_evaluated(ctx, "PAY-05", missing)]

    minimum = ctx.params.get("PAY-05", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        identity = r8(ctx, period)
        if identity.status != IdentityStatus.BREACHED:
            continue
        if identity.delta.abs_total < minimum.decimal:
            continue
        findings.append(
            triggered(
                ctx,
                "PAY-05",
                period=period,
                delta=identity.delta,
                trace=identity.trace,
                narrative=f"The credit ledger does not balance: closing differs from "
                f"opening + credited - debited by {identity.delta.abs_total}.",
            )
        )
    return findings


@rule(
    id="PAY-06",
    title="Utilisation order violated",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="s.49(5), s.49A, s.49B CGST Act, 2017 r/w Rule 88A",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr3b",),
    form=ActionForm.ASMT_10,
    threshold="any",
)
def pay_06(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "PAY-06", missing)]

    findings: list[Finding] = []
    for period in ctx.periods:
        identity = r9(ctx, period)
        if identity.status != IdentityStatus.BREACHED:
            continue
        findings.append(
            triggered(
                ctx,
                "PAY-06",
                period=period,
                delta=identity.delta,
                trace=identity.trace,
                narrative="Credit was set off under a head beyond the credit available "
                "under that head. Cross-utilisation of CGST against SGST is "
                "structurally impossible on the portal.",
            )
        )
    return findings


@rule(
    id="PAY-10",
    title="Liability discharged wholly through ITC over many periods",
    family="PAY",
    dimension=RiskDimension.PAYMENT,
    legal_basis="Analytical indicator; s.61 CGST Act, 2017 for scrutiny",
    severity=Severity.MEDIUM,
    confidence=Confidence.ADVISORY,
    requires=("gstr3b",),
    params=("PAY-10.consecutive_periods",),
    relates_to=("P07", "P08"),
    form=ActionForm.ASMT_10,
    threshold="cash component nil for 12 or more consecutive periods",
)
def pay_10(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "PAY-10", missing)]

    required = int(ctx.params.get("PAY-10", "consecutive_periods", on=ctx.fy.end).decimal)
    tracer = ctx.tracer(
        CalcKind.RULE,
        "PAY-10",
        legal_basis="Analytical indicator; s.61 CGST Act, 2017 for scrutiny",
    )
    tracer.used_parameter(ctx.params.get("PAY-10", "consecutive_periods", on=ctx.fy.end).use())

    ordered = sorted(ctx.data.returns_3b, key=lambda ret: (ret.period.year, ret.period.month))
    run = 0
    longest = 0
    for ret in ordered:
        if ret.payable.total > 0 and ret.paid_cash.total == 0:
            run += 1
            longest = max(longest, run)
        else:
            run = 0
        tracer.evidence(ret.prov_id)

    tracer.step(
        "longest run of periods discharged wholly through ITC",
        "cash component = 0 while liability > 0",
        {"periods": len(ordered)},
        longest,
    )
    tracer.note("longest_run", longest)

    trace = tracer.finish(
        result=longest,
        formula_template="cash component = 0 for >= {n} consecutive periods",
        formula_rendered=f"longest run {longest} period(s), threshold {required}",
    )
    if longest >= required:
        return [
            triggered(
                ctx,
                "PAY-10",
                trace=trace,
                narrative=f"Liability was discharged entirely through credit for "
                f"{longest} consecutive period(s).",
            )
        ]
    return [
        clear(
            ctx,
            "PAY-10",
            trace=trace,
            narrative=f"The longest run of wholly-ITC periods is {longest}, below the "
            f"threshold of {required}.",
        )
    ]
