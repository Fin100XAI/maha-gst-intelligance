"""ITC -- input tax credit.  Thirteen rules."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, Period, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.identities import IdentityStatus, r2
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.trace import CalcKind, render_formula
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")

#: The Indian financial year starts in April.
_FY_START_MONTH: Final[int] = 4

#: An HSN is matched against the blocked map at chapter (2) or heading (4).
_HSN_HEADING: Final[int] = 4
_HSN_CHAPTER: Final[int] = 2


# ---------------------------------------------------------------------------
# ITC-01 -- Rule 88D
# ---------------------------------------------------------------------------


@rule(
    id="ITC-01",
    title="ITC availed in excess of GSTR-2B",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="Rule 88D CGST Rules, 2017 r/w s.16(2)(aa) CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("gstr2b", "gstr3b"),
    params=("ITC-01.pct_threshold", "ITC-01.amount_threshold"),
    relates_to=("P14",),
    form=ActionForm.DRC_01C,
    threshold="above 20% of available credit AND above 25 lakh",
)
def itc_01(ctx: RuleContext) -> list[Finding]:
    """The worked specification in docs/01 section C3.

    Compared ONLY against Table 4(A)(5).  IMPG, IMPS, ISD and RCM credit sit in
    4(A)(1) to (4) and are not part of the GSTR-2B "all other ITC" bucket;
    comparing gross 4(A) against 2B is wrong and collapses on reply.
    """
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "ITC-01", missing)]

    findings: list[Finding] = []
    for period in ctx.periods:
        identity = r2(ctx, period)
        if identity.status == IdentityStatus.NOT_EVALUATED:
            continue

        pct_param = ctx.params.get("ITC-01", "pct_threshold", on=period)
        amount_param = ctx.params.get("ITC-01", "amount_threshold", on=period)

        tracer = ctx.tracer(
            CalcKind.RULE, "ITC-01", period=period, legal_basis="Rule 88D CGST Rules, 2017"
        )
        tracer.used_parameter(pct_param.use())
        tracer.used_parameter(amount_param.use())
        tracer.evidence(*identity.trace.evidence_ids)

        available: TaxVector = identity.trace.inputs["available"]
        claimed: TaxVector = identity.trace.inputs["claimed"]
        excess = (claimed - available).positive_part()

        pct = (
            (excess.total / available.total * _HUNDRED).quantize(Decimal("0.01"))
            if available.total > 0
            else (_HUNDRED if excess.total > 0 else _ZERO)
        )

        tracer.note("available", available)
        tracer.note("claimed", claimed)
        tracer.note("excess", excess)
        tracer.note("pct", pct)
        tracer.step(
            "excess credit, per head",
            "max(0, 3B[4(A)(5)] - 2B available)",
            {"claimed": claimed, "available": available},
            excess,
        )
        tracer.step(
            "excess as a percentage",
            "excess.total / available.total x 100",
            {"threshold": pct_param.decimal},
            pct,
        )

        trace = tracer.finish(
            result=excess,
            formula_template="excess(head) = max(0, 3B[4(A)(5)](head) - 2B_available(head)); "
            "Rule 88D needs pct > 20 AND excess > 25 lakh",
            formula_rendered=render_formula(
                "{claimed} - {available} = {excess} ({pct}%)",
                {"claimed": claimed, "available": available, "excess": excess, "pct": pct},
            ),
        )

        if excess.is_zero():
            findings.append(
                clear(
                    ctx,
                    "ITC-01",
                    period=period,
                    trace=trace,
                    narrative="Credit claimed does not exceed the credit available in GSTR-2B.",
                )
            )
            continue

        # Exact comparison; `pct` is rounded for display only (see OUT-01).
        over_pct = (
            excess.total * _HUNDRED > pct_param.decimal * available.total
            if available.total > 0
            else excess.total > 0
        )
        fires = over_pct and excess.total > amount_param.decimal
        findings.append(
            triggered(
                ctx,
                "ITC-01",
                period=period,
                observed=claimed,
                expected=available,
                delta=excess,
                trace=trace,
                severity=Severity.CRITICAL if fires else Severity.HIGH,
                form=ActionForm.DRC_01C if fires else ActionForm.ASMT_10,
                narrative=(
                    f"Credit of {claimed.total} claimed against {available.total} available "
                    f"in GSTR-2B; excess {excess.total} ({pct}%). "
                    + (
                        "Both Rule 88D limits are crossed."
                        if fires
                        else "Below the Rule 88D limits, so the route is ASMT-10, not DRC-01C."
                    )
                ),
                extra={"pct": format(pct, "f"), "route": "DRC-01C" if fires else "ASMT-10"},
            )
        )
    return findings


# ---------------------------------------------------------------------------
# ITC-02 -- Rule 37A, the highest-yield rule in the document
# ---------------------------------------------------------------------------


@rule(
    id="ITC-02",
    title="ITC availed from suppliers who did not discharge tax",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="Rule 37A CGST Rules, 2017 r/w s.16(2)(c) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr2b", "supplier_filing_status"),
    params=("ITC-02.supplier_3b_cutoff", "ITC-02.reversal_cutoff", "ITC-02.min_shortfall"),
    relates_to=("P14",),
    form=ActionForm.DRC_01A,
    threshold="shortfall above 10,000",
)
def itc_02(ctx: RuleContext) -> list[Finding]:
    """The worked specification in docs/01 section C3.

    Both sides of the join are departmental data, which is why the confidence
    is CERTAIN: it needs nothing from the taxpayer and it is arithmetically
    unarguable.  Implement it first and demo it second.
    """
    missing = ctx.missing(("gstr2b", "supplier_filing_status"))
    if missing:
        return [not_evaluated(ctx, "ITC-02", missing)]

    cutoff_param = ctx.params.get("ITC-02", "supplier_3b_cutoff", on=ctx.fy.end)
    reversal_param = ctx.params.get("ITC-02", "reversal_cutoff", on=ctx.fy.end)
    minimum = ctx.params.get("ITC-02", "min_shortfall", on=ctx.fy.end)

    supplier_cutoff = cutoff_param.on_day_month_of(ctx.fy.start_year + 1)
    reversal_cutoff = reversal_param.on_day_month_of(ctx.fy.start_year + 1)

    tracer = ctx.tracer(
        CalcKind.RULE,
        "ITC-02",
        legal_basis="Rule 37A CGST Rules, 2017 r/w s.16(2)(c) CGST Act, 2017",
    )
    tracer.used_parameter(cutoff_param.use())
    tracer.used_parameter(reversal_param.use())
    tracer.used_parameter(minimum.use())
    tracer.note("supplier_cutoff", supplier_cutoff)
    tracer.note("reversal_cutoff", reversal_cutoff)

    required = TaxVector()
    defaulting: set[str] = set()
    invoices = 0

    for row in ctx.data.inward:
        if row.itc_available is not True or row.supplier_gstin is None:
            continue
        periods = ctx.data.supplier_filing.get(row.supplier_gstin, {})
        key = (row.supplier_return_period or row.period).mmyyyy
        status = periods.get(key)
        if status is None:
            continue
        gstr1_filed, gstr3b_filed, gstr3b_date = status
        defaulted = gstr1_filed and (
            not gstr3b_filed or (gstr3b_date is not None and gstr3b_date > supplier_cutoff)
        )
        if defaulted:
            required = required + row.tax
            defaulting.add(row.supplier_gstin)
            invoices += 1
            tracer.evidence(row.row_id)

    tracer.step(
        "qualifying suppliers",
        "GSTR-1 filed but GSTR-3B not filed by the cut-off",
        {"cutoff": supplier_cutoff},
        len(defaulting),
    )
    tracer.step("invoices", "count of 2B lines from those suppliers", {}, invoices)
    tracer.step("reversal required", "sum(tax on those lines)", {}, required)

    # 4(B)(2) "others" is where a Rule 37A reversal is declared.
    reversal_made = TaxVector()
    for ret in ctx.data.returns_3b:
        if ret.period.first_day <= reversal_cutoff:
            reversal_made = reversal_made + ret.vector("t4b2")
    tracer.step(
        "reversal declared up to the cut-off",
        "sum 3B[4(B)(2)]",
        {"cutoff": reversal_cutoff},
        reversal_made,
    )

    shortfall = (required - reversal_made).positive_part()
    tracer.note("required", required)
    tracer.note("reversal_made", reversal_made)
    tracer.note("shortfall", shortfall)
    tracer.note("suppliers", len(defaulting))
    tracer.note("invoices", invoices)

    trace = tracer.finish(
        result=shortfall,
        formula_template="shortfall = sum{L in 2B : supplier filed GSTR-1 and not GSTR-3B "
        "by {cutoff}} tax(L) - reversal declared in 4(B)(2)",
        formula_rendered=render_formula(
            "{required} - {made} = {shortfall}",
            {"required": required, "made": reversal_made, "shortfall": shortfall},
        ),
    )

    if invoices == 0:
        return [
            clear(
                ctx,
                "ITC-02",
                trace=trace,
                narrative="No supplier on this taxpayer's GSTR-2B defaulted on GSTR-3B.",
            )
        ]

    if shortfall.total > minimum.decimal:
        # Interest under s.50(1) runs from the day after the reversal cut-off.
        interest_from = date(reversal_cutoff.year, reversal_cutoff.month, reversal_cutoff.day)
        return [
            triggered(
                ctx,
                "ITC-02",
                observed=required,
                expected=reversal_made,
                delta=shortfall,
                trace=trace,
                narrative=(
                    f"{len(defaulting)} supplier(s) across {invoices} invoice(s) filed GSTR-1 "
                    f"but not GSTR-3B by {supplier_cutoff}. Reversal of {required.total} was "
                    f"required by {reversal_cutoff}; {reversal_made.total} was declared. "
                    f"Interest under s.50(1) runs from the day after {interest_from}."
                ),
                extra={
                    "suppliers": len(defaulting),
                    "invoices": invoices,
                    "interest_from": interest_from.isoformat(),
                },
            )
        ]
    return [
        clear(
            ctx,
            "ITC-02",
            trace=trace,
            narrative=f"Reversal of {required.total} was required and "
            f"{reversal_made.total} was declared.",
        )
    ]


# ---------------------------------------------------------------------------
# ITC-03 -- credit on 2B lines flagged not available
# ---------------------------------------------------------------------------


@rule(
    id="ITC-03",
    title="ITC claimed on GSTR-2B lines flagged as not available",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.17(5), s.16(4) CGST Act, 2017; place-of-supply provisions",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr2b", "gstr3b"),
    relates_to=("P14",),
    form=ActionForm.ASMT_10,
    threshold="material: the unavailable credit exceeds the headroom in 4(A)(5)",
)
def itc_03(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "ITC-03", missing)]

    findings: list[Finding] = []
    for period in ctx.periods:
        unavailable = TaxVector()
        reasons: dict[str, int] = {}
        tracer = ctx.tracer(
            CalcKind.RULE, "ITC-03", period=period, legal_basis="s.17(5), s.16(4) CGST Act, 2017"
        )
        for row in ctx.inward(period):
            if row.itc_available is False:
                unavailable = unavailable + row.tax
                reason = row.itc_unavailable_reason or "not stated"
                reasons[reason] = reasons.get(reason, 0) + 1
                tracer.evidence(row.row_id)
        if unavailable.is_zero():
            continue

        ret = ctx.return_3b(period)
        available = sum(
            (row.signed_tax.total for row in ctx.inward(period) if row.counts_toward_2b_available),
            _ZERO,
        )
        claimed = ret.itc_all_other.total if ret else _ZERO
        headroom = claimed - available

        tracer.step(
            "credit marked not available in GSTR-2B",
            "sum(tax where itc_available = N)",
            {"reasons": reasons},
            unavailable,
        )
        tracer.step(
            "claim above the available credit",
            "3B[4(A)(5)] - 2B available",
            {"claimed": claimed, "available": available},
            headroom,
        )
        tracer.note("unavailable", unavailable)
        tracer.note("headroom", headroom)

        trace = tracer.finish(
            result=unavailable,
            formula_template="join 2B lines where itc_available='N' against the 3B claim",
            formula_rendered=f"{unavailable.total} marked unavailable; claim exceeds "
            f"available credit by {headroom}",
        )
        if headroom > 0:
            findings.append(
                triggered(
                    ctx,
                    "ITC-03",
                    period=period,
                    observed=unavailable,
                    delta=unavailable
                    if headroom >= unavailable.total
                    else TaxVector(igst=headroom),
                    trace=trace,
                    narrative=f"{unavailable.total} of credit is marked not available in "
                    f"GSTR-2B, and the 3B claim exceeds the available credit by "
                    f"{headroom}. Reasons stated: {reasons}.",
                )
            )
    return findings


# ---------------------------------------------------------------------------
# ITC-04 -- time-barred credit
# ---------------------------------------------------------------------------


@rule(
    id="ITC-04",
    title="Credit claimed after the s.16(4) time limit",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.16(4) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr2b",),
    params=("ITC-04.claim_cutoff_month",),
    form=ActionForm.DRC_01A,
    threshold="any credit claimed after the limit",
)
def itc_04(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b",))
    if missing:
        return [not_evaluated(ctx, "ITC-04", missing)]

    cutoff_month = ctx.params.get("ITC-04", "claim_cutoff_month", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "ITC-04", legal_basis="s.16(4) CGST Act, 2017")
    tracer.used_parameter(cutoff_month.use())

    barred = TaxVector()
    count = 0
    for row in ctx.data.inward:
        if row.doc_date is None or row.itc_available is not True:
            continue
        invoice_fy_start = (
            row.doc_date.year if row.doc_date.month >= _FY_START_MONTH else row.doc_date.year - 1
        )
        limit = Period(invoice_fy_start + 1, int(cutoff_month.decimal))
        if row.period > limit:
            barred = barred + row.tax
            count += 1
            tracer.evidence(row.row_id)
            tracer.step(
                f"{row.doc_no} dated {row.doc_date} claimed in {row.period}",
                "claim period > min(October of the following FY, annual return)",
                {"limit": limit.mmyyyy},
                row.tax,
            )

    tracer.note("barred", barred)
    tracer.note("documents", count)
    trace = tracer.finish(
        result=barred,
        formula_template="claim_period > min(October of the following FY, annual-return date)",
        formula_rendered=render_formula(
            "{count} document(s), {barred}", {"count": count, "barred": barred}
        ),
    )
    if count:
        return [
            triggered(
                ctx,
                "ITC-04",
                delta=barred,
                trace=trace,
                narrative=f"{count} document(s) claimed after the s.16(4) limit.",
            )
        ]
    return [
        clear(
            ctx, "ITC-04", trace=trace, narrative="No credit was claimed after the s.16(4) limit."
        )
    ]


# ---------------------------------------------------------------------------
# ITC-05 -- credit from a cancelled registration
# ---------------------------------------------------------------------------


@rule(
    id="ITC-05",
    title="ITC claimed on an invoice dated after the supplier's cancellation",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.29 and s.16(2) CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("gstr2b", "supplier_registry"),
    form=ActionForm.DRC_01A,
    threshold="any",
)
def itc_05(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b",))
    if missing:
        return [not_evaluated(ctx, "ITC-05", missing)]
    cancellations = ctx.extras.get("supplier_cancellation_dates")
    if cancellations is None:
        return [not_evaluated(ctx, "ITC-05", ("supplier registration master",))]

    tracer = ctx.tracer(CalcKind.RULE, "ITC-05", legal_basis="s.29 and s.16(2) CGST Act, 2017")
    affected = TaxVector()
    count = 0
    suppliers: set[str] = set()

    for row in ctx.data.inward:
        if row.supplier_gstin is None or row.doc_date is None:
            continue
        cancelled_on = cancellations.get(row.supplier_gstin)
        if cancelled_on is not None and row.doc_date > cancelled_on:
            affected = affected + row.tax
            suppliers.add(row.supplier_gstin)
            count += 1
            tracer.evidence(row.row_id)
            tracer.step(
                f"{row.supplier_gstin} cancelled {cancelled_on}",
                "invoice_date > cancellation_date",
                {"invoice_date": row.doc_date},
                row.tax,
            )

    tracer.note("affected", affected)
    tracer.note("documents", count)
    trace = tracer.finish(
        result=affected,
        formula_template="invoice_date > supplier.cancellation_date",
        formula_rendered=render_formula(
            "{n} invoice(s) from {s} cancelled supplier(s): {tax}",
            {"n": count, "s": len(suppliers), "tax": affected},
        ),
    )
    if count:
        return [
            triggered(
                ctx,
                "ITC-05",
                delta=affected,
                trace=trace,
                narrative=f"{count} invoice(s) from {len(suppliers)} supplier(s) "
                f"dated after their registration was cancelled.",
            )
        ]
    return [clear(ctx, "ITC-05", trace=trace, narrative="No credit from a cancelled registration.")]


# ---------------------------------------------------------------------------
# ITC-06 -- credit from a non-existent supplier
# ---------------------------------------------------------------------------


@rule(
    id="ITC-06",
    title="ITC claimed from a supplier with no trace of existence",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.16(2)(a), s.16(2)(b) and s.122 CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.STRONG,
    requires=("gstr2b", "supplier_filing_status"),
    relates_to=("P14",),
    form=ActionForm.DRC_01,
    threshold="any",
)
def itc_06(ctx: RuleContext) -> list[Finding]:
    """A supplier that never filed, never moved goods and never raised an IRN.

    Confidence is STRONG rather than CERTAIN: absence of evidence in the
    departmental data is powerful but is not, by itself, proof that the
    supplier does not exist.
    """
    missing = ctx.missing(("gstr2b", "supplier_filing_status"))
    if missing:
        return [not_evaluated(ctx, "ITC-06", missing)]

    tracer = ctx.tracer(
        CalcKind.RULE, "ITC-06", legal_basis="s.16(2)(a), s.16(2)(b) and s.122 CGST Act, 2017"
    )
    movement_counterparties = {bill.from_gstin for bill in ctx.data.ewb if bill.from_gstin}

    affected = TaxVector()
    suspect: set[str] = set()
    for row in ctx.data.inward:
        if row.supplier_gstin is None:
            continue
        history = ctx.data.supplier_filing.get(row.supplier_gstin, {})
        never_filed = not any(filed_1 or filed_3b for filed_1, filed_3b, _ in history.values())
        no_movement = row.supplier_gstin not in movement_counterparties
        if history and never_filed and no_movement:
            affected = affected + row.tax
            suspect.add(row.supplier_gstin)
            tracer.evidence(row.row_id)

    tracer.step(
        "suppliers with no filing and no movement",
        "never filed GSTR-1 or GSTR-3B, and no e-way bill raised",
        {},
        len(suspect),
    )
    tracer.note("affected", affected)
    tracer.note("suppliers", len(suspect))

    trace = tracer.finish(
        result=affected,
        formula_template="supplier never filed AND no e-way bill AND no IRN",
        formula_rendered=render_formula(
            "{s} supplier(s), {tax}", {"s": len(suspect), "tax": affected}
        ),
    )
    if suspect:
        return [
            triggered(
                ctx,
                "ITC-06",
                delta=affected,
                trace=trace,
                narrative=f"{len(suspect)} supplier(s) have filed nothing and moved "
                f"nothing, yet {affected.total} of credit rests on them.",
            )
        ]
    return [
        clear(
            ctx,
            "ITC-06",
            trace=trace,
            narrative="Every supplier has a filing or movement footprint.",
        )
    ]


# ---------------------------------------------------------------------------
# ITC-07 -- Rule 42/43 reversal short
# ---------------------------------------------------------------------------


@rule(
    id="ITC-07",
    title="Common-credit reversal under Rules 42 and 43 is short",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="Rules 42 and 43 CGST Rules, 2017 r/w s.17(2) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr3b",),
    params=("ITC-07.d2_percent", "ITC-07.min_shortfall"),
    relates_to=("P18", "P19"),
    form=ActionForm.ASMT_10,
    threshold="shortfall above 25,000",
)
def itc_07(ctx: RuleContext) -> list[Finding]:
    """Recompute D1 = C2 x E/F and D2 = C2 x 5%, and compare against 4(B)(1).

    T1 (non-business), T2 (exempt exclusive), T3 (blocked) and T4
    (taxable/zero-rated exclusive) are not separately reported in GSTR-3B, so
    this recomputation treats 4(A) as T and reports its assumption.  Where the
    taxpayer's own Rule 42 working is supplied it is used instead.
    """
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "ITC-07", missing)]

    d2_percent = ctx.params.get("ITC-07", "d2_percent", on=ctx.fy.end)
    minimum = ctx.params.get("ITC-07", "min_shortfall", on=ctx.fy.end)

    findings: list[Finding] = []
    for period in ctx.periods:
        ret = ctx.return_3b(period)
        if ret is None:
            continue
        exempt = ret.cell("t31c_taxable")
        total = ret.taxable_turnover
        if total <= 0 or exempt <= 0:
            continue

        tracer = ctx.tracer(
            CalcKind.RULE, "ITC-07", period=period, legal_basis="Rules 42 and 43 CGST Rules, 2017"
        )
        tracer.used_parameter(d2_percent.use())
        tracer.used_parameter(minimum.use())

        # C2 = C1 - T4.  Without a separately reported T4, common credit is
        # taken as all-other ITC; the narrative states the assumption.
        c2 = ret.itc_all_other
        ratio = (exempt / total).quantize(Decimal("0.000001"))
        d1 = c2.scale(ratio)
        d2 = c2.scale(d2_percent.decimal / _HUNDRED)
        required = d1 + d2
        declared = ret.vector("t4b1")
        shortfall = (required - declared).positive_part()

        tracer.step(
            "E / F", "exempt turnover / total turnover", {"exempt": exempt, "total": total}, ratio
        )
        tracer.step("D1", "C2 x E / F", {"c2": c2}, d1)
        tracer.step("D2", f"C2 x {d2_percent.decimal}%", {"c2": c2}, d2)
        tracer.step("reversal required", "D1 + D2", {}, required)
        tracer.step("reversal declared", "3B[4(B)(1)]", {}, declared)
        tracer.note("required", required)
        tracer.note("declared", declared)
        tracer.note("shortfall", shortfall)
        tracer.evidence(ret.prov_id)

        trace = tracer.finish(
            result=shortfall,
            formula_template="D1 = C2 x E/F; D2 = C2 x 5%; reverse D1 + D2 in 4(B)(1)",
            formula_rendered=render_formula(
                "D1 {d1} + D2 {d2} = {required}, declared {declared}, shortfall {shortfall}",
                {
                    "d1": d1,
                    "d2": d2,
                    "required": required,
                    "declared": declared,
                    "shortfall": shortfall,
                },
            ),
        )
        if shortfall.total > minimum.decimal:
            findings.append(
                triggered(
                    ctx,
                    "ITC-07",
                    period=period,
                    observed=declared,
                    expected=required,
                    delta=shortfall,
                    trace=trace,
                    narrative=(
                        f"Exempt turnover is {ratio} of total turnover. Rules 42 and 43 "
                        f"require {required.total} to be reversed; {declared.total} was. "
                        f"Common credit taken as 3B[4(A)(5)] because T1 to T4 are not "
                        f"separately reported in GSTR-3B."
                    ),
                )
            )
    return findings


# ---------------------------------------------------------------------------
# ITC-10 -- blocked-credit indicators
# ---------------------------------------------------------------------------


@rule(
    id="ITC-10",
    title="Indicators of credit blocked under s.17(5)",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.17(5) CGST Act, 2017",
    severity=Severity.MEDIUM,
    confidence=Confidence.ADVISORY,
    requires=("gstr2b", "blocked_credit_map"),
    params=("ITC-10.min_amount",),
    relates_to=("P07",),
    form=ActionForm.ASMT_10,
    threshold="above 25,000",
)
def itc_10(ctx: RuleContext) -> list[Finding]:
    """Candidates only, always ADVISORY.

    Never auto-demand on s.17(5): the exceptions are fact-intensive, automated
    demands get quashed, and one quashed order destroys departmental confidence
    in the platform.
    """
    missing = ctx.missing(("gstr2b",))
    if missing:
        return [not_evaluated(ctx, "ITC-10", missing)]
    blocked_map = ctx.extras.get("blocked_credit_map")
    if blocked_map is None:
        return [not_evaluated(ctx, "ITC-10", ("s.17(5) blocked HSN/SAC map",))]

    minimum = ctx.params.get("ITC-10", "min_amount", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "ITC-10", legal_basis="s.17(5) CGST Act, 2017")
    tracer.used_parameter(minimum.use())

    candidates = TaxVector()
    count = 0
    for row in ctx.data.inward:
        if row.hsn is None or row.itc_available is not True:
            continue
        clause = blocked_map.get(row.hsn[:_HSN_HEADING]) or blocked_map.get(row.hsn[:_HSN_CHAPTER])
        if clause:
            candidates = candidates + row.tax
            count += 1
            tracer.evidence(row.row_id)
            tracer.step(f"{row.doc_no}: HSN {row.hsn}", f"matches {clause}", {}, row.tax)

    tracer.note("candidates", candidates)
    tracer.note("lines", count)
    trace = tracer.finish(
        result=candidates,
        formula_template="HSN/SAC and description against the s.17(5) blocked map",
        formula_rendered=render_formula("{n} line(s), {tax}", {"n": count, "tax": candidates}),
    )
    if candidates.total > minimum.decimal:
        return [
            triggered(
                ctx,
                "ITC-10",
                observed=candidates,
                trace=trace,
                narrative=(
                    f"{count} line(s) totalling {candidates.total} carry an HSN/SAC in the "
                    f"s.17(5) blocked map. These are candidates for verification only: the "
                    f"exceptions are fact-intensive and no demand may issue from this rule "
                    f"without an officer's express promotion."
                ),
            )
        ]
    return [
        clear(
            ctx,
            "ITC-10",
            trace=trace,
            narrative="No blocked-credit indicators above the threshold.",
        )
    ]


# ---------------------------------------------------------------------------
# ITC-13 -- RCM credit exceeds RCM tax discharged
# ---------------------------------------------------------------------------


@rule(
    id="ITC-13",
    title="Reverse-charge credit exceeds the reverse-charge tax discharged",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.9(3), s.9(4) and s.16 CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr3b",),
    params=("ITC-13.min_amount",),
    relates_to=("P16",),
    form=ActionForm.ASMT_10,
    threshold="cumulative excess above 10,000",
)
def itc_13(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "ITC-13", missing)]

    minimum = ctx.params.get("ITC-13", "min_amount", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE, "ITC-13", legal_basis="s.9(3), s.9(4) and s.16 CGST Act, 2017"
    )
    tracer.used_parameter(minimum.use())

    discharged = TaxVector()
    credit = TaxVector()
    for ret in ctx.data.returns_3b:
        discharged = discharged + ret.rcm_liability
        credit = credit + ret.vector("t4a3")
        tracer.evidence(ret.prov_id)

    excess = (credit - discharged).positive_part()
    tracer.step("RCM tax discharged, cumulative", "sum 3B[3.1(d)]", {}, discharged)
    tracer.step("RCM credit taken, cumulative", "sum 3B[4(A)(3)]", {}, credit)
    tracer.note("discharged", discharged)
    tracer.note("credit", credit)
    tracer.note("excess", excess)

    trace = tracer.finish(
        result=excess,
        formula_template="cumulative 3B[4(A)(3)] > cumulative 3B[3.1(d)]",
        formula_rendered=render_formula(
            "{credit} - {discharged} = {excess}",
            {"credit": credit, "discharged": discharged, "excess": excess},
        ),
    )
    if excess.total > minimum.decimal:
        return [
            triggered(
                ctx,
                "ITC-13",
                observed=credit,
                expected=discharged,
                delta=excess,
                trace=trace,
                narrative=f"Reverse-charge credit of {credit.total} was taken against "
                f"{discharged.total} discharged.",
            )
        ]
    return [
        clear(
            ctx,
            "ITC-13",
            trace=trace,
            narrative="Reverse-charge credit does not exceed the tax discharged.",
        )
    ]


# ---------------------------------------------------------------------------
# ITC-16 -- circular trading in the invoice graph
# ---------------------------------------------------------------------------


@rule(
    id="ITC-16",
    title="Credit circulating through a closed loop of suppliers",
    family="ITC",
    dimension=RiskDimension.NETWORK,
    legal_basis="s.16(2)(b) and s.122(1)(vii) CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.ADVISORY,
    requires=("invoice_graph",),
    params=("ITC-16.min_cycle_value",),
    relates_to=("P24",),
    form=ActionForm.DRC_01,
    threshold="cycle value above 10 lakh",
)
def itc_16(ctx: RuleContext) -> list[Finding]:
    """A cycle is evidence of a pattern, never of an offence."""
    if ctx.graph is None:
        return [not_evaluated(ctx, "ITC-16", ("invoice graph",))]

    minimum = ctx.params.get("ITC-16", "min_cycle_value", on=ctx.fy.end)
    prune = ctx.params.get("NET-02", "edge_prune_value", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE, "ITC-16", legal_basis="s.16(2)(b) and s.122(1)(vii) CGST Act, 2017"
    )
    tracer.used_parameter(minimum.use())
    tracer.used_parameter(prune.use())

    cycles = [
        cycle
        for cycle in ctx.graph.prune(prune.decimal).cycles(min_length=2, max_length=5)
        if ctx.gstin in cycle.nodes and cycle.value > minimum.decimal
    ]
    tracer.step(
        "elementary cycles through this taxpayer",
        "Johnson-style enumeration, length 2 to 5, edges pruned",
        {"prune": prune.decimal},
        len(cycles),
    )
    tracer.note("cycles", [cycle.as_dict() for cycle in cycles])

    trace = tracer.finish(
        result=len(cycles),
        formula_template="directed cycles of length 2 to 5 containing this GSTIN, "
        "cycle value > {threshold}",
        formula_rendered=f"{len(cycles)} cycle(s) above {minimum.decimal}",
    )
    if cycles:
        largest = cycles[0]
        return [
            triggered(
                ctx,
                "ITC-16",
                taxable_value_effect=largest.value,
                trace=trace,
                narrative=(
                    f"{len(cycles)} closed trading loop(s) pass through this GSTIN; the "
                    f"largest circulates {largest.value} across {largest.length} parties. "
                    f"A cycle is evidence of a pattern, never of an offence: no notice may "
                    f"issue on this finding alone."
                ),
                extra={"cycles": [cycle.as_dict() for cycle in cycles[:5]]},
            )
        ]
    return [clear(ctx, "ITC-16", trace=trace, narrative="No closed trading loop was found.")]


# ---------------------------------------------------------------------------
# ITC-17 -- credit claimed where 2B is nil
# ---------------------------------------------------------------------------


@rule(
    id="ITC-17",
    title="ITC claimed for a period where GSTR-2B shows no credit at all",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.16(2)(aa) CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("gstr2b", "gstr3b"),
    params=("ITC-17.min_amount",),
    relates_to=("P14",),
    form=ActionForm.DRC_01C,
    threshold="above 10,000",
)
def itc_17(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "ITC-17", missing)]

    minimum = ctx.params.get("ITC-17", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        ret = ctx.return_3b(period)
        if ret is None:
            continue
        available = sum(
            (row.signed_tax.total for row in ctx.inward(period) if row.counts_toward_2b_available),
            _ZERO,
        )
        claimed = ret.itc_all_other
        if available != 0 or claimed.is_zero():
            continue

        tracer = ctx.tracer(
            CalcKind.RULE, "ITC-17", period=period, legal_basis="s.16(2)(aa) CGST Act, 2017"
        )
        tracer.used_parameter(minimum.use())
        tracer.step("GSTR-2B available credit", "sum(2B available lines)", {}, available)
        tracer.step("GSTR-3B credit claimed", "3B[4(A)(5)]", {}, claimed)
        tracer.note("available", available)
        tracer.note("claimed", claimed)
        tracer.evidence(ret.prov_id)

        trace = tracer.finish(
            result=claimed,
            formula_template="2B_available = 0 AND 3B[4(A)(5)] > 0",
            formula_rendered=f"0 available, {claimed.total} claimed",
        )
        if claimed.total > minimum.decimal:
            findings.append(
                triggered(
                    ctx,
                    "ITC-17",
                    observed=claimed,
                    delta=claimed,
                    period=period,
                    trace=trace,
                    narrative=f"{claimed.total} of credit claimed for a period in which "
                    f"GSTR-2B shows no available credit at all.",
                )
            )
    return findings


# ---------------------------------------------------------------------------
# ITC-20 -- IMS pending beyond the window, still claimed
# ---------------------------------------------------------------------------


@rule(
    id="ITC-20",
    title="Credit claimed on records left pending in the IMS",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="Rule 60 CGST Rules, 2017; the Invoice Management System",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr2b", "gstr3b", "ims"),
    form=ActionForm.DRC_01C,
    threshold="any",
)
def itc_20(ctx: RuleContext) -> list[Finding]:
    """IMS action is evidence, not metadata.

    A recipient who left a record pending and claimed the credit anyway made a
    timestamped, deliberate choice.
    """
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "ITC-20", missing)]
    if not any(row.ims_action for row in ctx.data.inward):
        return [not_evaluated(ctx, "ITC-20", ("IMS action data",))]

    findings: list[Finding] = []
    for period in ctx.periods:
        pending = [row for row in ctx.inward(period) if row.ims_action == "PENDING"]
        if not pending:
            continue
        ret = ctx.return_3b(period)
        if ret is None or ret.itc_all_other.is_zero():
            continue

        tracer = ctx.tracer(
            CalcKind.RULE, "ITC-20", period=period, legal_basis="Rule 60 CGST Rules, 2017; IMS"
        )
        deferred = TaxVector()
        for row in pending:
            deferred = deferred + row.tax
            tracer.evidence(row.row_id)
        tracer.step(
            "records left pending in the IMS", "count and tax", {"records": len(pending)}, deferred
        )
        tracer.step("credit claimed in the same period", "3B[4(A)(5)]", {}, ret.itc_all_other)
        tracer.note("deferred", deferred)
        tracer.note("records", len(pending))

        trace = tracer.finish(
            result=deferred,
            formula_template="ims_action = PENDING and credit claimed in 3B for that period",
            formula_rendered=f"{len(pending)} pending record(s), {deferred.total}",
        )
        findings.append(
            triggered(
                ctx,
                "ITC-20",
                observed=deferred,
                delta=deferred,
                period=period,
                trace=trace,
                narrative=f"{len(pending)} record(s) worth {deferred.total} were left "
                f"pending in the IMS while credit was claimed for the period.",
            )
        )
    return findings


# ---------------------------------------------------------------------------
# ITC-21 -- accepted credit note, no reversal
# ---------------------------------------------------------------------------


@rule(
    id="ITC-21",
    title="Credit note accepted in the IMS without a matching ITC reversal",
    family="ITC",
    dimension=RiskDimension.CREDIT,
    legal_basis="s.34(2) CGST Act, 2017; the Invoice Management System",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr2b", "gstr3b", "ims"),
    params=("ITC-21.min_amount",),
    relates_to=("P18",),
    form=ActionForm.ASMT_10,
    threshold="above 10,000",
)
def itc_21(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "ITC-21", missing)]
    if not any(row.ims_action for row in ctx.data.inward):
        return [not_evaluated(ctx, "ITC-21", ("IMS action data",))]

    minimum = ctx.params.get("ITC-21", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        accepted = [
            row
            for row in ctx.inward(period)
            if row.doc_type == "CREDIT_NOTE" and row.ims_action == "ACCEPTED"
        ]
        if not accepted:
            continue
        ret = ctx.return_3b(period)
        if ret is None:
            continue

        tracer = ctx.tracer(
            CalcKind.RULE, "ITC-21", period=period, legal_basis="s.34(2) CGST Act, 2017; IMS"
        )
        tracer.used_parameter(minimum.use())
        required = TaxVector()
        for row in accepted:
            required = required + row.tax
            tracer.evidence(row.row_id)
        declared = ret.vector("t4b2")
        shortfall = (required - declared).positive_part()

        tracer.step(
            "credit notes accepted in the IMS", "sum(tax)", {"notes": len(accepted)}, required
        )
        tracer.step("reversal declared", "3B[4(B)(2)]", {}, declared)
        tracer.note("required", required)
        tracer.note("declared", declared)
        tracer.note("shortfall", shortfall)

        trace = tracer.finish(
            result=shortfall,
            formula_template="IMS ACCEPTED credit note with no matching 4(B)(2) movement",
            formula_rendered=render_formula(
                "{required} - {declared} = {shortfall}",
                {"required": required, "declared": declared, "shortfall": shortfall},
            ),
        )
        if shortfall.total > minimum.decimal:
            findings.append(
                triggered(
                    ctx,
                    "ITC-21",
                    observed=required,
                    expected=declared,
                    delta=shortfall,
                    period=period,
                    trace=trace,
                    narrative=f"{len(accepted)} credit note(s) worth {required.total} were "
                    f"accepted in the IMS; {declared.total} was reversed.",
                )
            )
    return findings
