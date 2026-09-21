"""NET -- network (three rules) and SEC -- sector (three rules).

Every NET rule is ADVISORY.  The screen that renders them carries the mandatory
banner: *network patterns are investigative leads, not findings, and no notice
may be issued on the basis of that screen alone.*  An officer misled once by a
graph never trusts the platform again.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.trace import CalcKind
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")


# ---------------------------------------------------------------------------
# NET -- network
# ---------------------------------------------------------------------------


@rule(
    id="NET-02",
    title="Circular trading: value returning to its origin",
    family="NET",
    dimension=RiskDimension.NETWORK,
    legal_basis="s.122(1)(vii) CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.ADVISORY,
    requires=("invoice_graph",),
    params=(
        "NET-02.min_cycle_value",
        "NET-02.edge_prune_value",
        "NET-02.turnover_ratio",
        "NET-02.max_cycle_length",
    ),
    relates_to=("P24",),
    form=ActionForm.DRC_01,
    threshold="cycle value above 10 lakh AND above 30% of mean node turnover",
)
def net_02(ctx: RuleContext) -> list[Finding]:
    """The worked specification in docs/01 section C3.

    Johnson-style enumeration of elementary cycles of length 2 to 5, edges
    pruned below 1 lakh, cycle value taken as the minimum edge -- the most that
    can actually circulate.

    CONFIDENCE ADVISORY: a cycle is evidence of a pattern, never of an offence,
    and the card says exactly that on screen.
    """
    if ctx.graph is None:
        return [not_evaluated(ctx, "NET-02", ("invoice graph",))]

    min_value = ctx.params.get("NET-02", "min_cycle_value", on=ctx.fy.end)
    prune = ctx.params.get("NET-02", "edge_prune_value", on=ctx.fy.end)
    ratio_param = ctx.params.get("NET-02", "turnover_ratio", on=ctx.fy.end)
    max_length = ctx.params.get("NET-02", "max_cycle_length", on=ctx.fy.end)

    tracer = ctx.tracer(CalcKind.RULE, "NET-02", legal_basis="s.122(1)(vii) CGST Act, 2017")
    for parameter in (min_value, prune, ratio_param, max_length):
        tracer.used_parameter(parameter.use())

    pruned = ctx.graph.prune(prune.decimal)
    tracer.step(
        "graph after pruning",
        "edges below the prune value removed",
        {"edges_before": len(ctx.graph), "prune": prune.decimal},
        len(pruned),
    )

    candidates = pruned.cycles(min_length=2, max_length=int(max_length.decimal))
    qualifying = []
    for cycle in candidates:
        if ctx.gstin not in cycle.nodes:
            continue
        turnovers = [pruned.turnover_of(node) for node in cycle.nodes]
        mean_turnover = sum(turnovers, _ZERO) / Decimal(len(turnovers)) if turnovers else _ZERO
        if mean_turnover <= 0:
            continue
        share = (cycle.value / mean_turnover).quantize(Decimal("0.0001"))
        if cycle.value > min_value.decimal and share > ratio_param.decimal:
            qualifying.append((cycle, share))
            tracer.step(
                " -> ".join(cycle.nodes),
                "cycle value against the mean turnover of its nodes",
                {"cycle_value": cycle.value, "mean_turnover": mean_turnover},
                share,
            )

    tracer.note("cycles_examined", len(candidates))
    tracer.note("cycles_qualifying", len(qualifying))
    tracer.note("cycles", [cycle.as_dict() for cycle, _ in qualifying])

    trace = tracer.finish(
        result=len(qualifying),
        formula_template="elementary cycles of length 2 to {n}; cycle value = min edge; "
        "trigger when value > {v} AND value / mean(node turnover) > {r}",
        formula_rendered=f"{len(qualifying)} qualifying cycle(s) of {len(candidates)} examined",
    )
    if qualifying:
        largest, share = qualifying[0]
        return [
            triggered(
                ctx,
                "NET-02",
                taxable_value_effect=largest.value,
                trace=trace,
                narrative=(
                    f"{len(qualifying)} closed trading loop(s) include this GSTIN. The largest "
                    f"circulates {largest.value} across {largest.length} parties, which is "
                    f"{share} of their mean turnover. A cycle is evidence of a pattern, never "
                    f"of an offence: no notice may issue on this finding alone."
                ),
                extra={
                    "cycles": [cycle.as_dict() for cycle, _ in qualifying[:5]],
                    "investigative_lead_only": True,
                },
            )
        ]
    return [clear(ctx, "NET-02", trace=trace, narrative="No qualifying closed trading loop.")]


@rule(
    id="NET-03",
    title="Supply chain terminating in a non-filer within two hops",
    family="NET",
    dimension=RiskDimension.NETWORK,
    legal_basis="s.16(2)(c) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr2b", "supplier_filing_status"),
    params=("NET-03.min_exposure",),
    relates_to=("P14",),
    form=ActionForm.ASMT_10,
    threshold="exposure above 5 lakh",
)
def net_03(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b", "supplier_filing_status"))
    if missing:
        return [not_evaluated(ctx, "NET-03", missing)]

    minimum = ctx.params.get("NET-03", "min_exposure", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "NET-03", legal_basis="s.16(2)(c) CGST Act, 2017")
    tracer.used_parameter(minimum.use())

    exposure = TaxVector()
    non_filers: set[str] = set()
    for row in ctx.data.inward:
        if row.supplier_gstin is None:
            continue
        history = ctx.data.supplier_filing.get(row.supplier_gstin, {})
        if not history:
            continue
        filed_any_3b = any(filed_3b for _, filed_3b, _ in history.values())
        if not filed_any_3b:
            exposure = exposure + row.tax
            non_filers.add(row.supplier_gstin)
            tracer.evidence(row.row_id)

    tracer.step(
        "direct suppliers who have not filed GSTR-3B",
        "supplier filing history",
        {},
        len(non_filers),
    )
    tracer.note("exposure", exposure)
    tracer.note("non_filers", len(non_filers))

    trace = tracer.finish(
        result=exposure,
        formula_template="credit resting on suppliers with no GSTR-3B on record, within 2 hops",
        formula_rendered=f"{len(non_filers)} non-filing supplier(s), exposure {exposure.total}",
    )
    if exposure.total > minimum.decimal:
        return [
            triggered(
                ctx,
                "NET-03",
                observed=exposure,
                trace=trace,
                narrative=f"{exposure.total} of credit rests on {len(non_filers)} "
                f"supplier(s) with no GSTR-3B on record.",
            )
        ]
    return [
        clear(
            ctx,
            "NET-03",
            trace=trace,
            narrative="Credit exposure to non-filing suppliers is below the threshold.",
        )
    ]


@rule(
    id="NET-05",
    title="Pure pass-through trader: almost no value added",
    family="NET",
    dimension=RiskDimension.NETWORK,
    legal_basis="Analytical indicator; s.61 CGST Act, 2017 for scrutiny",
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("gstr3b",),
    params=("NET-05.margin_percent", "NET-05.periods"),
    relates_to=("P07",),
    form=ActionForm.ASMT_10,
    threshold="net margin below 1% of output tax across six or more periods",
)
def net_05(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "NET-05", missing)]

    margin_param = ctx.params.get("NET-05", "margin_percent", on=ctx.fy.end)
    periods_param = ctx.params.get("NET-05", "periods", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE,
        "NET-05",
        legal_basis="Analytical indicator; s.61 CGST Act, 2017 for scrutiny",
    )
    tracer.used_parameter(margin_param.use())
    tracer.used_parameter(periods_param.use())

    if Decimal(len(ctx.data.returns_3b)) < periods_param.decimal:
        return [
            not_evaluated(ctx, "NET-05", (f"at least {periods_param.decimal} periods of GSTR-3B",))
        ]

    output = sum((ret.outward_tax.total for ret in ctx.data.returns_3b), _ZERO)
    input_tax = sum((ret.itc_available_gross.total for ret in ctx.data.returns_3b), _ZERO)
    if output <= 0:
        return [not_evaluated(ctx, "NET-05", ("non-zero output tax",))]

    margin = ((output - input_tax) / output * _HUNDRED).quantize(Decimal("0.01"))
    tracer.step("output tax", "sum 3B outward tax", {}, output)
    tracer.step("input tax", "sum 3B[4(A)]", {}, input_tax)
    tracer.step("margin", "(output - input) / output x 100", {}, margin)
    tracer.note("margin", margin)

    trace = tracer.finish(
        result=margin,
        formula_template="(output tax - input tax) / output tax x 100 < {margin}% "
        "over {periods} periods",
        formula_rendered=f"({output} - {input_tax}) / {output} = {margin}%",
    )
    if margin < margin_param.decimal:
        return [
            triggered(
                ctx,
                "NET-05",
                trace=trace,
                narrative=f"Across {len(ctx.data.returns_3b)} periods the margin between "
                f"output and input tax is {margin}%, which is the signature of "
                f"a pass-through rather than a trading business.",
            )
        ]
    return [clear(ctx, "NET-05", trace=trace, narrative=f"Margin is {margin}% of output tax.")]


# ---------------------------------------------------------------------------
# SEC -- sector
# ---------------------------------------------------------------------------


@rule(
    id="SEC-01",
    title="Works contract: the 80%-from-registered condition breached",
    family="SEC",
    dimension=RiskDimension.LIABILITY,
    legal_basis="Notification 03/2019-Central Tax (Rate)",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr2b", "gstr3b", "sector"),
    params=("SEC-01.registered_share", "SEC-01.rcm_rate"),
    relates_to=("P05",),
    form=ActionForm.ASMT_10,
    threshold="registered procurement below 80%, with the shortfall RCM unpaid",
)
def sec_01(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "SEC-01", missing)]
    sector = ctx.data.profile.sector_code
    if sector is None:
        return [not_evaluated(ctx, "SEC-01", ("sector classification in the registration master",))]
    # Real estate and works contract: HSN chapter 99 services, sector 98/99.
    if not sector.startswith(("98", "99")):
        return [
            clear(
                ctx,
                "SEC-01",
                narrative=f"Notification 03/2019 applies to real estate and works "
                f"contract; this taxpayer's sector is {sector}.",
            )
        ]

    share_param = ctx.params.get("SEC-01", "registered_share", on=ctx.fy.end)
    rate_param = ctx.params.get("SEC-01", "rcm_rate", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE, "SEC-01", legal_basis="Notification 03/2019-Central Tax (Rate)"
    )
    tracer.used_parameter(share_param.use())
    tracer.used_parameter(rate_param.use())

    registered = sum((row.taxable_value for row in ctx.data.inward if row.supplier_gstin), _ZERO)
    unregistered = sum(
        (ret.cell("t5_inter") + ret.cell("t5_intra") for ret in ctx.data.returns_3b), _ZERO
    )
    total = registered + unregistered
    if total <= 0:
        return [not_evaluated(ctx, "SEC-01", ("inward procurement data",))]

    share = (registered / total * _HUNDRED).quantize(Decimal("0.01"))
    tracer.step("procurement from registered persons", "sum(2B taxable value)", {}, registered)
    tracer.step("procurement from unregistered persons", "sum 3B[Table 5]", {}, unregistered)
    tracer.step("registered share", "registered / total x 100", {}, share)

    required_share = share_param.decimal
    shortfall_value = _ZERO
    rcm_due = _ZERO
    if share < required_share:
        shortfall_value = ((required_share - share) / _HUNDRED * total).quantize(Decimal("0.01"))
        rcm_due = (shortfall_value * rate_param.decimal / _HUNDRED).quantize(Decimal("0.01"))
        tracer.step(
            "shortfall in registered procurement",
            "(80% - actual share) x total procurement",
            {},
            shortfall_value,
        )
        tracer.step("RCM due on the shortfall", f"shortfall x {rate_param.decimal}%", {}, rcm_due)

    discharged = sum((ret.rcm_liability.total for ret in ctx.data.returns_3b), _ZERO)
    tracer.note("share", share)
    tracer.note("rcm_due", rcm_due)
    tracer.note("rcm_discharged", discharged)

    trace = tracer.finish(
        result=rcm_due,
        formula_template="registered share < 80% -> RCM at 18% on the shortfall",
        formula_rendered=f"registered share {share}%, shortfall {shortfall_value}, "
        f"RCM due {rcm_due}, discharged {discharged}",
    )
    if rcm_due > discharged:
        gap = rcm_due - discharged
        return [
            triggered(
                ctx,
                "SEC-01",
                delta=TaxVector(cgst=gap / 2, sgst=gap / 2),
                taxable_value_effect=shortfall_value,
                trace=trace,
                narrative=f"Registered procurement is {share}% against the 80% condition. "
                f"RCM of {rcm_due} arises on the shortfall; {discharged} was "
                f"discharged.",
            )
        ]
    return [
        clear(
            ctx,
            "SEC-01",
            trace=trace,
            narrative=f"Registered procurement is {share}%, meeting the 80% condition.",
        )
    ]


@rule(
    id="SEC-04",
    title="Exporter: LUT expired while zero-rated supplies continued",
    family="SEC",
    dimension=RiskDimension.LIABILITY,
    legal_basis="Rule 96A CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr1", "lut_validity"),
    relates_to=("P04", "P26"),
    form=ActionForm.ASMT_10,
    threshold="any zero-rated supply without payment of IGST after the LUT expired",
)
def sec_04(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "SEC-04", missing)]
    lut_valid_to = ctx.extras.get("lut_valid_to")
    if lut_valid_to is None:
        return [not_evaluated(ctx, "SEC-04", ("LUT validity from the registration master",))]

    tracer = ctx.tracer(CalcKind.RULE, "SEC-04", legal_basis="Rule 96A CGST Rules, 2017")
    tracer.note("lut_valid_to", lut_valid_to)

    exposed = _ZERO
    count = 0
    for row in ctx.data.outward:
        # Without payment of tax: the LUT is what permits that.
        if row.section not in {"EXPWOP", "SEZWOP"} or row.doc_date is None:
            continue
        if row.doc_date > lut_valid_to:
            exposed += row.taxable_value
            count += 1
            tracer.evidence(row.row_id)
            tracer.step(
                f"{row.doc_no} dated {row.doc_date}",
                "zero-rated without payment of IGST after the LUT expired",
                {"lut_valid_to": lut_valid_to},
                row.taxable_value,
            )

    tracer.note("exposed", exposed)
    tracer.note("documents", count)
    trace = tracer.finish(
        result=exposed,
        formula_template="export/SEZ without payment of tax, doc_date > LUT validity",
        formula_rendered=f"{count} supply/supplies worth {exposed} after {lut_valid_to}",
    )
    if count:
        return [
            triggered(
                ctx,
                "SEC-04",
                taxable_value_effect=exposed,
                trace=trace,
                narrative=f"{count} zero-rated supply/supplies worth {exposed} were made "
                f"without payment of IGST after the LUT expired on "
                f"{lut_valid_to}.",
            )
        ]
    return [clear(ctx, "SEC-04", trace=trace, narrative="The LUT covered every zero-rated supply.")]


@rule(
    id="SEC-05",
    title="E-commerce operator: GSTR-8 TCS against supplier-declared turnover",
    family="SEC",
    dimension=RiskDimension.LIABILITY,
    legal_basis="s.52 CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("gstr1", "gstr8"),
    params=("SEC-05.min_amount",),
    form=ActionForm.ASMT_10,
    threshold="above 1 lakh of difference",
)
def sec_05(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "SEC-05", missing)]
    tcs = ctx.extras.get("gstr8_turnover")
    if tcs is None:
        return [not_evaluated(ctx, "SEC-05", ("GSTR-8 TCS statements from the operator",))]

    minimum = ctx.params.get("SEC-05", "min_amount", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "SEC-05", legal_basis="s.52 CGST Act, 2017")
    tracer.used_parameter(minimum.use())

    through_eco = sum((row.taxable_value for row in ctx.data.outward if row.ecom_gstin), _ZERO)
    reported = Decimal(str(tcs))
    gap = (reported - through_eco).copy_abs()

    tracer.step(
        "turnover declared through an operator",
        "sum(GSTR-1 lines with an ECO GSTIN)",
        {},
        through_eco,
    )
    tracer.step("turnover per the operator's GSTR-8", "GSTR-8", {}, reported)
    tracer.note("gap", gap)

    trace = tracer.finish(
        result=gap,
        formula_template="|GSTR-8 turnover through the operator - GSTR-1 turnover with that "
        "operator's GSTIN|",
        formula_rendered=f"|{reported} - {through_eco}| = {gap}",
    )
    if gap > minimum.decimal:
        return [
            triggered(
                ctx,
                "SEC-05",
                taxable_value_effect=gap,
                trace=trace,
                narrative=f"The operator reports {reported} of supplies through it, "
                f"against {through_eco} declared in GSTR-1.",
            )
        ]
    return [
        clear(
            ctx, "SEC-05", trace=trace, narrative="Operator-reported turnover agrees with GSTR-1."
        )
    ]
