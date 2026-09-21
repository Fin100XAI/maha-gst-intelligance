"""OUT -- outward supply and liability.  Ten rules."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import (
    ActionForm,
    Confidence,
    Period,
    Regime,
    RiskDimension,
    Severity,
    is_intrastate,
)
from app.engine.context import RuleContext
from app.engine.identities import IdentityStatus, r1
from app.engine.registry import Finding, clear, escalate, not_evaluated, rule, triggered
from app.engine.trace import CalcKind, render_formula
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")
_TWO: Final[Decimal] = Decimal("2")

#: A spike needs something to be a spike against.
_MIN_COMPARISON_MONTHS: Final[int] = 2


# ---------------------------------------------------------------------------
# OUT-01 -- Rule 88C
# ---------------------------------------------------------------------------


@rule(
    id="OUT-01",
    title="GSTR-1 outward liability exceeds GSTR-3B",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="Rule 88C CGST Rules, 2017 r/w s.37 and s.39 CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("gstr1", "gstr3b"),
    params=("OUT-01.pct_threshold", "OUT-01.amount_threshold"),
    form=ActionForm.DRC_01B,
    threshold="above 20% of the GSTR-1 liability AND above 25 lakh",
)
def out_01(ctx: RuleContext) -> list[Finding]:
    """The worked specification in docs/01 section C3, implemented exactly.

    Both thresholds must be crossed for Rule 88C, and when only one is, the
    route is ASMT-10 rather than DRC-01B -- which is the distinction an officer
    most needs the engine to get right.
    """
    missing = ctx.missing(("gstr1", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "OUT-01", missing)]

    findings: list[Finding] = []
    for period in ctx.periods:
        identity = r1(ctx, period)
        if identity.status == IdentityStatus.NOT_EVALUATED:
            continue

        pct_param = ctx.params.get("OUT-01", "pct_threshold", on=period)
        amount_param = ctx.params.get("OUT-01", "amount_threshold", on=period)

        tracer = ctx.tracer(
            CalcKind.RULE, "OUT-01", period=period, legal_basis="Rule 88C CGST Rules, 2017"
        )
        tracer.used_parameter(pct_param.use())
        tracer.used_parameter(amount_param.use())
        tracer.evidence(*identity.trace.evidence_ids)

        g1: TaxVector = identity.trace.inputs["g1"]
        b3: TaxVector = identity.trace.inputs["b3"]
        delta = identity.delta
        shortfall = delta.positive_part()

        pct = (
            (shortfall.total / g1.total * _HUNDRED).quantize(Decimal("0.01"))
            if g1.total > 0
            else _ZERO
        )
        tracer.note("g1", g1)
        tracer.note("b3", b3)
        tracer.note("shortfall", shortfall)
        tracer.note("pct", pct)
        tracer.note("regime", period.regime.value)
        tracer.step(
            "head-wise delta", "GSTR-1 tax - 3B[3.1(a)+(b)+3.1.1(i)]", {"g1": g1, "b3": b3}, delta
        )
        tracer.step("shortfall, positive part per head", "delta.positive_part()", {}, shortfall)
        tracer.step(
            "shortfall as a percentage",
            "shortfall.total / g1.total x 100",
            {"threshold": pct_param.decimal},
            pct,
        )

        # Compare exactly.  `pct` above is rounded to two places for the
        # drawer, and letting a display rounding decide a statutory trigger
        # would make a shortfall of 20.000008% read as exactly 20% and escape
        # Rule 88C.  Cross-multiplying keeps the test on the raw figures.
        over_pct = shortfall.total * _HUNDRED > pct_param.decimal * g1.total
        over_amount = shortfall.total > amount_param.decimal
        fires = over_pct and over_amount

        trace = tracer.finish(
            result=shortfall,
            formula_template="shortfall(head) = max(0, sum(GSTR-1 signed tax)(head) "
            "- 3B[3.1(a)+3.1(b)+3.1.1(i)](head)); Rule 88C needs pct > {p}% AND "
            "shortfall > {a}",
            formula_rendered=render_formula(
                "{g1} - {b3} = shortfall {shortfall} ({pct}% of liability)",
                {"g1": g1, "b3": b3, "shortfall": shortfall, "pct": pct},
            ),
        )

        if shortfall.is_zero():
            findings.append(
                clear(
                    ctx,
                    "OUT-01",
                    period=period,
                    trace=trace,
                    narrative="GSTR-1 and GSTR-3B agree head-wise for this period.",
                )
            )
            continue

        severity = Severity.CRITICAL
        if period.regime is Regime.POST_HARD_LOCK:
            # Table 3 is auto-populated and non-editable from July 2025, so a
            # residual mismatch is a far stronger signal than the same number
            # before the lock.
            severity = escalate(severity)

        if fires:
            findings.append(
                triggered(
                    ctx,
                    "OUT-01",
                    period=period,
                    observed=g1,
                    expected=b3,
                    delta=shortfall,
                    trace=trace,
                    severity=severity,
                    form=ActionForm.DRC_01B,
                    narrative=(
                        f"Outward liability declared in GSTR-1 exceeds GSTR-3B by "
                        f"{shortfall.total} ({pct}% of the GSTR-1 liability). Both Rule 88C "
                        f"limits are crossed."
                    ),
                    extra={"pct": format(pct, "f"), "route": "DRC-01B"},
                )
            )
        else:
            # Below the Rule 88C limits the shortfall is still real; it simply
            # takes the s.61 scrutiny route instead of the intimation route.
            reason = []
            if not over_pct:
                reason.append(f"{pct}% does not exceed {pct_param.decimal}%")
            if not over_amount:
                reason.append(f"{shortfall.total} does not exceed {amount_param.decimal}")
            findings.append(
                triggered(
                    ctx,
                    "OUT-01",
                    period=period,
                    observed=g1,
                    expected=b3,
                    delta=shortfall,
                    trace=trace,
                    severity=Severity.HIGH,
                    form=ActionForm.ASMT_10,
                    confidence=Confidence.CERTAIN,
                    narrative=(
                        f"Shortfall of {shortfall.total} ({pct}%). Below the Rule 88C limits "
                        f"({'; '.join(reason)}), so the route is ASMT-10, not DRC-01B."
                    ),
                    extra={"pct": format(pct, "f"), "route": "ASMT-10"},
                )
            )
    return findings


# ---------------------------------------------------------------------------
# OUT-02 -- amendments not carried into 3B
# ---------------------------------------------------------------------------


@rule(
    id="OUT-02",
    title="GSTR-1 amendments not carried into GSTR-3B",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="s.37(3) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr1", "gstr3b"),
    params=("OUT-02.min_delta",),
    form=ActionForm.ASMT_10,
    threshold="net amendment effect above 1 lakh",
)
def out_02(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "OUT-02", missing)]

    findings: list[Finding] = []
    for period in ctx.periods:
        amendments = [
            row for row in ctx.outward(period) if row.is_amendment or row.section == "AMENDMENT"
        ]
        if not amendments:
            continue
        threshold = ctx.params.get("OUT-02", "min_delta", on=period)
        tracer = ctx.tracer(
            CalcKind.RULE, "OUT-02", period=period, legal_basis="s.37(3) CGST Act, 2017"
        )
        tracer.used_parameter(threshold.use())

        net = TaxVector()
        for row in amendments:
            net = net + row.signed_tax
            tracer.evidence(row.row_id)
        tracer.step(
            "net amendment effect",
            "sum(signed tax over Tables 9A/9B/9C)",
            {"amendments": len(amendments)},
            net,
        )

        current = ctx.return_3b(period)
        previous = ctx.return_3b(period.prev)
        declared_delta = (
            current.outward_tax - previous.outward_tax
            if current is not None and previous is not None
            else TaxVector()
        )
        tracer.step(
            "period-on-period 3B movement",
            "3B outward tax this period - last period",
            {},
            declared_delta,
        )

        tracer.note("net_amendment", net)
        tracer.note("declared_delta", declared_delta)
        trace = tracer.finish(
            result=net,
            formula_template="net(GSTR-1 9A/9B/9C) compared against the GSTR-3B movement",
            formula_rendered=render_formula("amendments {net}", {"net": net}),
        )

        if net.abs_total > threshold.decimal and previous is None:
            findings.append(
                triggered(
                    ctx,
                    "OUT-02",
                    period=period,
                    observed=net,
                    delta=net.positive_part(),
                    trace=trace,
                    narrative=(
                        f"Amendments of {net.abs_total} were reported in GSTR-1 but the "
                        f"prior period's GSTR-3B is not available to confirm they were "
                        f"carried through."
                    ),
                )
            )
        elif net.abs_total > threshold.decimal:
            findings.append(
                triggered(
                    ctx,
                    "OUT-02",
                    period=period,
                    observed=net,
                    expected=declared_delta,
                    delta=net.positive_part(),
                    trace=trace,
                    narrative=f"Amendments of {net.abs_total} reported in GSTR-1 for this period.",
                )
            )
    return findings


# ---------------------------------------------------------------------------
# OUT-04 -- zero-rated in 3B with no export or SEZ invoices
# ---------------------------------------------------------------------------


@rule(
    id="OUT-04",
    title="Zero-rated turnover declared with no export or SEZ invoices",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="s.16 IGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr1", "gstr3b"),
    relates_to=("P04",),
    form=ActionForm.ASMT_10,
    threshold="any zero-rated turnover with no supporting documents",
)
def out_04(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "OUT-04", missing)]

    findings: list[Finding] = []
    for period in ctx.periods:
        ret = ctx.return_3b(period)
        if ret is None:
            continue
        zero_rated = ret.cell("t31b_taxable")
        if zero_rated <= 0:
            continue

        supporting = [
            row
            for row in ctx.outward(period)
            if row.section in {"EXPWP", "EXPWOP", "SEZWP", "SEZWOP", "DEEMED"}
        ]
        tracer = ctx.tracer(
            CalcKind.RULE, "OUT-04", period=period, legal_basis="s.16 IGST Act, 2017"
        )
        tracer.note("zero_rated_3b", zero_rated)
        tracer.note("supporting_documents", len(supporting))
        tracer.step("3B zero-rated turnover", "3B[3.1(b)] taxable value", {}, zero_rated)
        tracer.step(
            "GSTR-1 export/SEZ/deemed documents", "count(Tables 6A, 6B, 6C)", {}, len(supporting)
        )
        for row in supporting:
            tracer.evidence(row.row_id)

        trace = tracer.finish(
            result=zero_rated,
            formula_template="3B[3.1(b)] > 0 AND count(GSTR-1 Tables 6A+6B+6C) = 0",
            formula_rendered=f"{zero_rated} zero-rated declared against "
            f"{len(supporting)} supporting documents",
        )
        if not supporting:
            findings.append(
                triggered(
                    ctx,
                    "OUT-04",
                    period=period,
                    taxable_value_effect=zero_rated,
                    trace=trace,
                    narrative=(
                        f"Zero-rated turnover of {zero_rated} declared in GSTR-3B with no "
                        f"export, SEZ or deemed-export document in GSTR-1."
                    ),
                )
            )
    return findings


# ---------------------------------------------------------------------------
# OUT-07 -- effective rate below the notified rate
# ---------------------------------------------------------------------------


@rule(
    id="OUT-07",
    title="Effective tax rate below the notified HSN rate",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="Rate notifications under s.9(1) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr1", "rate_master"),
    params=("OUT-07.min_rate_gap", "OUT-07.min_amount"),
    form=ActionForm.ASMT_10,
    threshold="more than 0.5 percentage points below, and above 50,000",
)
def out_07(ctx: RuleContext) -> list[Finding]:
    """Needs an effective-dated HSN rate master.

    The rate structure changed on 22 September 2025, so the master must be
    effective-dated: 28% on an invoice dated 20-Sep-2025 is correct and on
    23-Sep-2025 it is not.  Without the master this reports NOT_EVALUATED
    rather than assuming a rate.
    """
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "OUT-07", missing)]
    if "rate_master" not in ctx.extras:
        return [not_evaluated(ctx, "OUT-07", ("rate_master",))]

    rate_master = ctx.extras["rate_master"]
    gap_param = ctx.params.get("OUT-07", "min_rate_gap", on=ctx.fy.end)
    amount_param = ctx.params.get("OUT-07", "min_amount", on=ctx.fy.end)

    findings: list[Finding] = []
    for period in ctx.periods:
        shortfall = TaxVector()
        affected = 0
        tracer = ctx.tracer(
            CalcKind.RULE,
            "OUT-07",
            period=period,
            legal_basis="Rate notifications under s.9(1) CGST Act, 2017",
        )
        tracer.used_parameter(gap_param.use())
        tracer.used_parameter(amount_param.use())

        for row in ctx.outward(period):
            if row.hsn is None or row.doc_date is None or row.taxable_value <= 0:
                continue
            notified = rate_master.rate_for(row.hsn, row.doc_date)
            if notified is None:
                continue
            effective = (row.tax.total / row.taxable_value * _HUNDRED).quantize(Decimal("0.01"))
            if notified - effective > gap_param.decimal:
                expected_tax = (row.taxable_value * notified / _HUNDRED).quantize(Decimal("0.01"))
                gap = expected_tax - row.tax.total
                shortfall = (
                    shortfall + TaxVector(igst=gap)
                    if row.igst
                    else shortfall + TaxVector(cgst=gap / 2, sgst=gap / 2)
                )
                affected += 1
                tracer.evidence(row.row_id)
                tracer.step(
                    f"{row.doc_no}: HSN {row.hsn} on {row.doc_date}",
                    "effective rate vs notified rate",
                    {"effective": effective, "notified": notified, "taxable": row.taxable_value},
                    gap,
                )

        if affected == 0:
            continue
        tracer.note("affected_lines", affected)
        tracer.note("shortfall", shortfall)
        trace = tracer.finish(
            result=shortfall,
            formula_template="tax / taxable vs rate_master[hsn, doc_date]",
            formula_rendered=render_formula(
                "shortfall {shortfall} over {n} lines", {"shortfall": shortfall, "n": affected}
            ),
        )
        if shortfall.total > amount_param.decimal:
            findings.append(
                triggered(
                    ctx,
                    "OUT-07",
                    period=period,
                    delta=shortfall,
                    trace=trace,
                    narrative=f"{affected} line(s) taxed below the notified rate for their HSN.",
                )
            )
    return findings


# ---------------------------------------------------------------------------
# OUT-08 -- abnormal credit-note ratio
# ---------------------------------------------------------------------------


@rule(
    id="OUT-08",
    title="Abnormal credit-note ratio",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="s.34 CGST Act, 2017",
    severity=Severity.MEDIUM,
    confidence=Confidence.ADVISORY,
    requires=("gstr1",),
    params=("OUT-08.cn_ratio_threshold",),
    relates_to=("P31",),
    form=ActionForm.ASMT_10,
    threshold="credit notes above 15% of outward supplies",
)
def out_08(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "OUT-08", missing)]

    threshold = ctx.params.get("OUT-08", "cn_ratio_threshold", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "OUT-08", legal_basis="s.34 CGST Act, 2017")
    tracer.used_parameter(threshold.use())

    notes = _ZERO
    outward = _ZERO
    for row in ctx.data.outward:
        if row.doc_type == "CREDIT_NOTE":
            notes += row.taxable_value
            tracer.evidence(row.row_id)
        else:
            outward += row.taxable_value

    if outward <= 0:
        return [
            not_evaluated(ctx, "OUT-08", ("outward turnover is nil, so the ratio is undefined",))
        ]

    ratio = (notes / outward * _HUNDRED).quantize(Decimal("0.01"))
    tracer.step("credit notes", "sum(taxable value of credit notes)", {}, notes)
    tracer.step("outward supplies", "sum(taxable value of invoices)", {}, outward)
    tracer.step("ratio", "credit notes / outward x 100", {}, ratio)
    tracer.note("ratio", ratio)

    trace = tracer.finish(
        result=ratio,
        formula_template="sum(credit notes) / sum(outward) x 100 > {threshold}%",
        formula_rendered=f"{notes} / {outward} x 100 = {ratio}%",
    )
    if ratio > threshold.decimal:
        return [
            triggered(
                ctx,
                "OUT-08",
                taxable_value_effect=notes,
                trace=trace,
                narrative=f"Credit notes are {ratio}% of outward supplies for the year.",
            )
        ]
    return [
        clear(
            ctx,
            "OUT-08",
            trace=trace,
            narrative=f"Credit notes are {ratio}% of outward supplies, "
            f"within the {threshold.decimal}% threshold.",
        )
    ]


# ---------------------------------------------------------------------------
# OUT-09 -- credit note beyond the s.34(2) limit
# ---------------------------------------------------------------------------


@rule(
    id="OUT-09",
    title="Credit note issued beyond the s.34(2) time limit",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="s.34(2) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr1",),
    relates_to=("P31",),
    form=ActionForm.DRC_01A,
    threshold="any credit note adjusting tax after 30 November of the following FY",
)
def out_09(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "OUT-09", missing)]

    limit = ctx.fy.annual_return_due_date
    november = date(ctx.fy.start_year + 1, 11, 30)
    cutoff = min(november, limit)

    tracer = ctx.tracer(CalcKind.RULE, "OUT-09", legal_basis="s.34(2) CGST Act, 2017")
    tracer.note("cutoff", cutoff)
    tracer.step(
        "time limit",
        "min(30 November of the following FY, annual-return date)",
        {"november": november, "annual_return": limit},
        cutoff,
    )

    late = TaxVector()
    count = 0
    for row in ctx.data.outward:
        if row.doc_type != "CREDIT_NOTE" or row.doc_date is None:
            continue
        if row.doc_date > cutoff and not row.tax.is_zero():
            late = late + row.tax
            count += 1
            tracer.evidence(row.row_id)
            tracer.step(
                f"credit note {row.doc_no} dated {row.doc_date}",
                "doc_date > cutoff and tax adjusted",
                {"cutoff": cutoff},
                row.tax,
            )

    tracer.note("late_notes", count)
    tracer.note("tax_adjusted", late)
    trace = tracer.finish(
        result=late,
        formula_template="credit note date > min(30-Nov next FY, annual return) with tax adjusted",
        formula_rendered=render_formula(
            "{count} note(s), tax adjusted {late}", {"count": count, "late": late}
        ),
    )
    if count:
        return [
            triggered(
                ctx,
                "OUT-09",
                delta=late,
                trace=trace,
                narrative=f"{count} credit note(s) adjusted tax after {cutoff}.",
            )
        ]
    return [
        clear(ctx, "OUT-09", trace=trace, narrative=f"No credit note adjusted tax after {cutoff}.")
    ]


# ---------------------------------------------------------------------------
# OUT-11 -- wrong tax head for the place of supply
# ---------------------------------------------------------------------------


@rule(
    id="OUT-11",
    title="Wrong tax head for the place of supply",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="ss.7 to 14 IGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr1",),
    params=("OUT-11.min_amount",),
    form=ActionForm.ASMT_10,
    threshold="above 10,000 of tax under the wrong head",
)
def out_11(ctx: RuleContext) -> list[Finding]:
    """A supply mischaracterised here has diverted revenue between the Centre
    and the State.  That is why this is a rule and not a note."""
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "OUT-11", missing)]

    supplier_state = ctx.data.profile.state_code
    threshold = ctx.params.get("OUT-11", "min_amount", on=ctx.fy.end)

    findings: list[Finding] = []
    for period in ctx.periods:
        tracer = ctx.tracer(
            CalcKind.RULE, "OUT-11", period=period, legal_basis="ss.7 to 14 IGST Act, 2017"
        )
        tracer.used_parameter(threshold.use())
        misheaded = TaxVector()
        count = 0

        for row in ctx.outward(period):
            if row.pos is None or row.tax.is_zero():
                continue
            try:
                intrastate = is_intrastate(supplier_state, row.pos)
            except ValueError:
                continue
            wrong_igst = intrastate and row.igst != 0 and row.cgst == 0
            wrong_local = not intrastate and (row.cgst != 0 or row.sgst != 0) and row.igst == 0
            if wrong_igst or wrong_local:
                misheaded = misheaded + row.tax
                count += 1
                tracer.evidence(row.row_id)
                tracer.step(
                    f"{row.doc_no}: supplier {supplier_state}, place of supply {row.pos}",
                    "CGST+SGST for intra-State, IGST for inter-State",
                    {"charged": row.tax, "intrastate": intrastate},
                    "IGST on an intra-State supply"
                    if wrong_igst
                    else "CGST/SGST on an inter-State supply",
                )

        if count == 0:
            continue
        tracer.note("misheaded", misheaded)
        tracer.note("lines", count)
        trace = tracer.finish(
            result=misheaded,
            formula_template="is_intrastate(supplier_state, pos) vs the head charged",
            formula_rendered=render_formula(
                "{n} line(s), {tax} under the wrong head", {"n": count, "tax": misheaded}
            ),
        )
        if misheaded.total > threshold.decimal:
            findings.append(
                triggered(
                    ctx,
                    "OUT-11",
                    period=period,
                    delta=misheaded,
                    trace=trace,
                    narrative=f"{count} line(s) charged under the wrong head for their "
                    f"place of supply, totalling {misheaded.total}.",
                )
            )
    return findings


# ---------------------------------------------------------------------------
# OUT-12 -- B2B supply reported as B2CS
# ---------------------------------------------------------------------------


@rule(
    id="OUT-12",
    title="B2B supply reported in the B2CS table",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="s.37 CGST Act, 2017 r/w Rule 59",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr1",),
    form=ActionForm.ASMT_10,
    threshold="any B2CS line whose counterparty appears in the e-way bill or IRN data",
)
def out_12(ctx: RuleContext) -> list[Finding]:
    """Reporting a B2B supply as B2CS denies the recipient their credit and
    hides the counterparty from the network view."""
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "OUT-12", missing)]

    known_counterparties = {row.to_gstin for row in ctx.data.ewb if row.to_gstin} | {
        row.counterparty_gstin for row in ctx.data.einvoices if row.counterparty_gstin
    }

    if not known_counterparties:
        return [not_evaluated(ctx, "OUT-12", ("eway_bill or einvoice counterparty data",))]

    findings: list[Finding] = []
    for period in ctx.periods:
        tracer = ctx.tracer(
            CalcKind.RULE, "OUT-12", period=period, legal_basis="s.37 CGST Act, 2017 r/w Rule 59"
        )
        affected = TaxVector()
        count = 0
        for row in ctx.outward(period):
            if row.section != "B2CS":
                continue
            matches = [
                bill
                for bill in ctx.data.ewb
                if bill.doc_no == row.doc_no and bill.to_gstin in known_counterparties
            ]
            if matches:
                affected = affected + row.tax
                count += 1
                tracer.evidence(row.row_id)
                tracer.step(
                    f"{row.doc_no} reported as B2CS",
                    "counterparty GSTIN present in e-way bill data",
                    {"counterparty": matches[0].to_gstin},
                    row.tax,
                )
        if count == 0:
            continue
        tracer.note("lines", count)
        trace = tracer.finish(
            result=affected,
            formula_template="B2CS line whose counterparty GSTIN appears in EWB/IRN data",
            formula_rendered=f"{count} line(s), {affected.total}",
        )
        findings.append(
            triggered(
                ctx,
                "OUT-12",
                period=period,
                delta=affected,
                trace=trace,
                narrative=f"{count} supply/supplies reported as B2CS despite a "
                f"registered counterparty in the movement data.",
            )
        )
    return findings


# ---------------------------------------------------------------------------
# OUT-14 -- GSTR-1 turnover below the IRN aggregate
# ---------------------------------------------------------------------------


@rule(
    id="OUT-14",
    title="GSTR-1 turnover below the aggregate of reported IRNs",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="Rule 48(4) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr1", "einvoice"),
    params=("OUT-14.min_amount",),
    form=ActionForm.ASMT_10,
    threshold="above 1 lakh",
)
def out_14(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1", "einvoice"))
    if missing:
        return [not_evaluated(ctx, "OUT-14", missing)]

    threshold = ctx.params.get("OUT-14", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        irn_value = sum(
            (
                row.taxable_value
                for row in ctx.data.einvoices
                if row.period == period and row.status == "ACTIVE"
            ),
            _ZERO,
        )
        declared = sum(
            (
                row.taxable_value
                for row in ctx.outward(period)
                if row.section in {"B2B", "EXPWP", "EXPWOP", "SEZWP", "SEZWOP", "DEEMED"}
            ),
            _ZERO,
        )
        if irn_value <= declared:
            continue

        tracer = ctx.tracer(
            CalcKind.RULE, "OUT-14", period=period, legal_basis="Rule 48(4) CGST Rules, 2017"
        )
        tracer.used_parameter(threshold.use())
        tracer.step("aggregate active IRN value", "sum(e-invoice taxable value)", {}, irn_value)
        tracer.step("GSTR-1 B2B and export value", "sum(taxable value)", {}, declared)
        gap = irn_value - declared
        tracer.note("gap", gap)

        trace = tracer.finish(
            result=gap,
            formula_template="sum(active IRN value) > sum(GSTR-1 B2B + export)",
            formula_rendered=f"{irn_value} - {declared} = {gap}",
        )
        if gap > threshold.decimal:
            findings.append(
                triggered(
                    ctx,
                    "OUT-14",
                    period=period,
                    taxable_value_effect=gap,
                    trace=trace,
                    narrative=f"IRNs aggregate to {irn_value} against {declared} "
                    f"declared in GSTR-1.",
                )
            )
    return findings


# ---------------------------------------------------------------------------
# OUT-19 -- year-end turnover spike
# ---------------------------------------------------------------------------


@rule(
    id="OUT-19",
    title="Year-end turnover spike",
    family="OUT",
    dimension=RiskDimension.LIABILITY,
    legal_basis="Analytical indicator; s.61 CGST Act, 2017 for scrutiny",
    severity=Severity.MEDIUM,
    confidence=Confidence.ADVISORY,
    requires=("gstr3b",),
    params=("OUT-19.spike_multiple",),
    relates_to=("P09",),
    form=ActionForm.ASMT_10,
    threshold="March turnover above 3x the mean of the other eleven months",
)
def out_19(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "OUT-19", missing)]

    multiple = ctx.params.get("OUT-19", "spike_multiple", on=ctx.fy.end)
    march = Period(ctx.fy.start_year + 1, 3)
    march_return = ctx.return_3b(march)
    others = [ret for ret in ctx.data.returns_3b if ret.period != march]

    if march_return is None or len(others) < _MIN_COMPARISON_MONTHS:
        return [not_evaluated(ctx, "OUT-19", ("GSTR-3B for March and at least two other months",))]

    tracer = ctx.tracer(
        CalcKind.RULE,
        "OUT-19",
        legal_basis="Analytical indicator; s.61 CGST Act, 2017 for scrutiny",
    )
    tracer.used_parameter(multiple.use())

    march_turnover = march_return.taxable_turnover
    mean_other = (
        sum((ret.taxable_turnover for ret in others), _ZERO) / Decimal(len(others))
    ).quantize(Decimal("0.01"))

    tracer.step("March turnover", "3B[3.1(a)+(b)+(c)] for March", {}, march_turnover)
    tracer.step("mean of the other months", "sum / count", {"months": len(others)}, mean_other)
    tracer.note("march", march_turnover)
    tracer.note("mean_other", mean_other)

    if mean_other <= 0:
        return [not_evaluated(ctx, "OUT-19", ("non-zero turnover in the other months",))]

    ratio = (march_turnover / mean_other).quantize(Decimal("0.01"))
    tracer.step("spike multiple", "March / mean(other months)", {}, ratio)

    trace = tracer.finish(
        result=ratio,
        formula_template="March turnover / mean(other eleven months) > {multiple}x",
        formula_rendered=f"{march_turnover} / {mean_other} = {ratio}x",
    )
    if ratio > multiple.decimal:
        return [
            triggered(
                ctx,
                "OUT-19",
                period=march,
                taxable_value_effect=march_turnover,
                trace=trace,
                narrative=f"March turnover is {ratio}x the mean of the other months.",
            )
        ]
    return [
        clear(
            ctx,
            "OUT-19",
            trace=trace,
            narrative=f"March turnover is {ratio}x the mean, within the "
            f"{multiple.decimal}x threshold.",
        )
    ]
