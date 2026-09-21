"""BEH -- behaviour (six rules) and REG -- registration (five rules)."""

from __future__ import annotations

from decimal import Decimal
from typing import Final

from app.canonical import (
    ActionForm,
    Confidence,
    RiskDimension,
    Severity,
    three_year_bar,
)
from app.engine.context import RuleContext
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.trace import CalcKind
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")

#: Credit taken against no turnover at all: the ratio is unbounded, and this
#: stands in for it so the comparison stays a plain Decimal comparison.
_NO_TURNOVER_RATIO: Final[Decimal] = Decimal("999")

#: REG-07 countdown buckets, in days remaining before the three-year bar.
_BAR_CRITICAL_DAYS: Final[int] = 90
_BAR_WARNING_DAYS: Final[int] = 180


# ---------------------------------------------------------------------------
# BEH -- behaviour
# ---------------------------------------------------------------------------


@rule(
    id="BEH-01",
    title="Chronic late filing",
    family="BEH",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.47 CGST Act, 2017",
    severity=Severity.MEDIUM,
    confidence=Confidence.CERTAIN,
    requires=("filing_status",),
    params=("BEH-01.mean_days_late",),
    relates_to=("P11",),
    form=ActionForm.ASMT_10,
    threshold="mean delay above 15 days across the year",
)
def beh_01(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("filing_status",))
    if missing:
        return [not_evaluated(ctx, "BEH-01", missing)]

    threshold = ctx.params.get("BEH-01", "mean_days_late", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "BEH-01", legal_basis="s.47 CGST Act, 2017")
    tracer.used_parameter(threshold.use())

    filed = [row for row in ctx.data.filings if row.filing_date is not None]
    if not filed:
        return [not_evaluated(ctx, "BEH-01", ("at least one filed return",))]

    total_days = sum(row.days_late(as_of=ctx.as_of) for row in filed)
    mean = (Decimal(total_days) / Decimal(len(filed))).quantize(Decimal("0.01"))
    late_count = sum(1 for row in filed if row.days_late(as_of=ctx.as_of) > 0)

    tracer.step(
        "mean days late",
        "sum(days late) / count(filed returns)",
        {"returns": len(filed), "late": late_count},
        mean,
    )
    tracer.note("mean_days_late", mean)
    tracer.note("late_returns", late_count)

    trace = tracer.finish(
        result=mean,
        formula_template="mean(days late) over the rolling twelve months > {threshold} days",
        formula_rendered=f"{total_days} days over {len(filed)} returns = {mean} days",
    )
    if mean > threshold.decimal:
        return [
            triggered(
                ctx,
                "BEH-01",
                trace=trace,
                narrative=f"{late_count} of {len(filed)} returns were late, averaging {mean} days.",
            )
        ]
    return [
        clear(
            ctx,
            "BEH-01",
            trace=trace,
            narrative=f"Mean filing delay is {mean} days, within the threshold.",
        )
    ]


@rule(
    id="BEH-02",
    title="GSTR-1 filed while a prior GSTR-3B remains unfiled",
    family="BEH",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="Rule 59(6) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("filing_status",),
    relates_to=("P12",),
    form=ActionForm.ASMT_10,
    threshold="any",
)
def beh_02(ctx: RuleContext) -> list[Finding]:
    """Rule 59(6) blocks GSTR-1 when the prior GSTR-3B is unfiled, so a later
    GSTR-1 existing means the block was not applied."""
    missing = ctx.missing(("filing_status",))
    if missing:
        return [not_evaluated(ctx, "BEH-02", missing)]

    tracer = ctx.tracer(CalcKind.RULE, "BEH-02", legal_basis="Rule 59(6) CGST Rules, 2017")
    unfiled_3b = {
        row.period
        for row in ctx.data.filings
        if row.return_type == "GSTR3B" and row.filing_date is None
    }
    violations = 0
    for row in ctx.data.filings:
        if row.return_type != "GSTR1" or row.filing_date is None:
            continue
        if any(period < row.period for period in unfiled_3b):
            violations += 1
            blocking = sorted(p for p in unfiled_3b if p < row.period)
            tracer.step(
                f"GSTR-1 for {row.period} filed on {row.filing_date}",
                "a prior GSTR-3B is unfiled",
                {"blocking_periods": [p.mmyyyy for p in blocking]},
                "sequential violation",
            )

    tracer.note("violations", violations)
    tracer.note("unfiled_3b", sorted(p.mmyyyy for p in unfiled_3b))

    trace = tracer.finish(
        result=violations,
        formula_template="GSTR-1 exists for a period later than an unfiled GSTR-3B",
        formula_rendered=f"{violations} sequential violation(s)",
    )
    if violations:
        return [
            triggered(
                ctx,
                "BEH-02",
                trace=trace,
                narrative=f"{violations} GSTR-1 return(s) were filed while an earlier "
                f"GSTR-3B remained unfiled.",
            )
        ]
    return [clear(ctx, "BEH-02", trace=trace, narrative="Filing sequence is intact.")]


@rule(
    id="BEH-03",
    title="Nil GSTR-3B filed against a non-nil GSTR-1",
    family="BEH",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.39 CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("gstr1", "gstr3b"),
    params=("BEH-03.min_amount",),
    relates_to=("P12",),
    form=ActionForm.DRC_01B,
    threshold="above 10,000 of undeclared liability",
)
def beh_03(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1", "gstr3b"))
    if missing:
        return [not_evaluated(ctx, "BEH-03", missing)]

    minimum = ctx.params.get("BEH-03", "min_amount", on=ctx.fy.end)
    findings: list[Finding] = []
    for period in ctx.periods:
        ret = ctx.return_3b(period)
        if ret is None or not ret.outward_tax.is_zero():
            continue
        declared = TaxVector()
        for row in ctx.outward(period):
            declared = declared + row.signed_tax
        if declared.total <= minimum.decimal:
            continue

        tracer = ctx.tracer(
            CalcKind.RULE, "BEH-03", period=period, legal_basis="s.39 CGST Act, 2017"
        )
        tracer.used_parameter(minimum.use())
        tracer.step("GSTR-1 outward tax", "sum(signed tax)", {}, declared)
        tracer.step("GSTR-3B outward tax", "3B[3.1(a)+(b)+3.1.1(i)]", {}, ret.outward_tax)
        tracer.note("declared", declared)
        tracer.evidence(ret.prov_id)

        trace = tracer.finish(
            result=declared,
            formula_template="3B outward tax = 0 while GSTR-1 outward tax > 0",
            formula_rendered=f"GSTR-1 {declared.total}, GSTR-3B 0",
        )
        findings.append(
            triggered(
                ctx,
                "BEH-03",
                period=period,
                observed=declared,
                delta=declared,
                trace=trace,
                narrative=f"A nil GSTR-3B was filed for a period in which GSTR-1 "
                f"declares {declared.total} of outward tax.",
            )
        )
    return findings


@rule(
    id="BEH-05",
    title="Repeated DRC-01B or DRC-01C intimations with no Part-B reply",
    family="BEH",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="Rule 88C(3) and Rule 88D CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("intimation_history",),
    params=("BEH-05.min_intimations",),
    relates_to=("P30",),
    form=ActionForm.DRC_01,
    threshold="two or more unanswered intimations",
)
def beh_05(ctx: RuleContext) -> list[Finding]:
    history = ctx.extras.get("intimations")
    if history is None:
        return [not_evaluated(ctx, "BEH-05", ("intimation and reply history",))]

    minimum = ctx.params.get("BEH-05", "min_intimations", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE, "BEH-05", legal_basis="Rule 88C(3) and Rule 88D CGST Rules, 2017"
    )
    tracer.used_parameter(minimum.use())

    unanswered = [row for row in history if not row.get("part_b_replied")]
    tracer.step(
        "intimations with no Part-B reply",
        "DRC-01B/01C issued, no reply recorded",
        {"total": len(history)},
        len(unanswered),
    )
    tracer.note("unanswered", len(unanswered))

    trace = tracer.finish(
        result=len(unanswered),
        formula_template="count(DRC-01B/01C with no Part-B reply) >= {n}",
        formula_rendered=f"{len(unanswered)} unanswered intimation(s)",
    )
    if Decimal(len(unanswered)) >= minimum.decimal:
        return [
            triggered(
                ctx,
                "BEH-05",
                trace=trace,
                narrative=f"{len(unanswered)} intimation(s) under Rule 88C or 88D went "
                f"unanswered. The next step is a show-cause notice.",
            )
        ]
    return [clear(ctx, "BEH-05", trace=trace, narrative="Intimations have been answered.")]


@rule(
    id="BEH-06",
    title="ASMT-10 issued with no ASMT-11 reply after 30 days",
    family="BEH",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.61(2) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("notice_history",),
    params=("BEH-06.reply_days",),
    relates_to=("P30",),
    form=ActionForm.DRC_01A,
    threshold="30 days after service with no reply",
)
def beh_06(ctx: RuleContext) -> list[Finding]:
    history = ctx.extras.get("notices")
    if history is None:
        return [not_evaluated(ctx, "BEH-06", ("notice service and reply history",))]

    days_param = ctx.params.get("BEH-06", "reply_days", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "BEH-06", legal_basis="s.61(2) CGST Act, 2017")
    tracer.used_parameter(days_param.use())

    overdue = 0
    for row in history:
        if row.get("form") != "ASMT-10" or row.get("reply_received_at"):
            continue
        served = row.get("served_at")
        if served is None:
            continue
        elapsed = (ctx.as_of - served).days
        if Decimal(elapsed) > days_param.decimal:
            overdue += 1
            tracer.step(
                f"ASMT-10 served {served}",
                "no ASMT-11 reply after the statutory period",
                {"elapsed_days": elapsed},
                "overdue",
            )

    tracer.note("overdue", overdue)
    tracer.note("as_of", ctx.as_of)
    trace = tracer.finish(
        result=overdue,
        formula_template="as_of - served_at > {days} days AND no ASMT-11 reply",
        formula_rendered=f"{overdue} overdue reply/replies",
    )
    if overdue:
        return [
            triggered(
                ctx,
                "BEH-06",
                trace=trace,
                narrative=f"{overdue} ASMT-10 notice(s) have gone unanswered beyond the "
                f"statutory reply period.",
            )
        ]
    return [clear(ctx, "BEH-06", trace=trace, narrative="Scrutiny notices have been answered.")]


@rule(
    id="BEH-08",
    title="Annual return not filed where mandatory",
    family="BEH",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.44 CGST Act, 2017 r/w Rule 80",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("filing_status",),
    params=("BEH-08.gstr9_aato", "BEH-08.gstr9c_aato"),
    relates_to=("P12",),
    form=ActionForm.ASMT_10,
    threshold="AATO above 2 crore for GSTR-9, above 5 crore for GSTR-9C",
)
def beh_08(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("filing_status",))
    if missing:
        return [not_evaluated(ctx, "BEH-08", missing)]

    aato = ctx.data.profile.aato
    if aato is None:
        return [
            not_evaluated(ctx, "BEH-08", ("aggregate annual turnover in the registration master",))
        ]

    gstr9_at = ctx.params.get("BEH-08", "gstr9_aato", on=ctx.fy.end)
    gstr9c_at = ctx.params.get("BEH-08", "gstr9c_aato", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "BEH-08", legal_basis="s.44 CGST Act, 2017 r/w Rule 80")
    tracer.used_parameter(gstr9_at.use())
    tracer.used_parameter(gstr9c_at.use())

    filed = {row.return_type for row in ctx.data.filings if row.filing_date is not None}
    due = ctx.fy.annual_return_due_date
    outstanding: list[str] = []
    if aato > gstr9_at.decimal and "GSTR9" not in filed:
        outstanding.append("GSTR-9")
    if aato > gstr9c_at.decimal and "GSTR9C" not in filed:
        outstanding.append("GSTR-9C")

    tracer.step(
        "annual returns mandated by turnover",
        "AATO against the thresholds",
        {"aato": aato},
        outstanding or "none",
    )
    tracer.note("outstanding", outstanding)
    tracer.note("due_date", due)

    trace = tracer.finish(
        result=len(outstanding),
        formula_template="AATO above the threshold AND the annual return is not on record",
        formula_rendered=f"AATO {aato}; outstanding: {', '.join(outstanding) or 'none'}",
    )
    if outstanding and ctx.as_of > due:
        return [
            triggered(
                ctx,
                "BEH-08",
                trace=trace,
                narrative=f"{', '.join(outstanding)} was due on {due} and is not on "
                f"record for a taxpayer with turnover of {aato}.",
            )
        ]
    return [
        clear(
            ctx,
            "BEH-08",
            trace=trace,
            narrative="Annual return obligations are met, or are not yet due.",
        )
    ]


# ---------------------------------------------------------------------------
# REG -- registration
# ---------------------------------------------------------------------------


@rule(
    id="REG-02",
    title="New registration taking immediate high credit",
    family="REG",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.29(2) CGST Act, 2017 r/w Rule 21A",
    severity=Severity.CRITICAL,
    confidence=Confidence.STRONG,
    requires=("gstr3b",),
    params=("REG-02.window_days", "REG-02.itc_turnover_ratio", "REG-02.min_itc"),
    relates_to=("P24",),
    form=ActionForm.REG_17,
    threshold="within 90 days of registration, ITC above 90% of turnover and above 25 lakh",
)
def reg_02(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr3b",))
    if missing:
        return [not_evaluated(ctx, "REG-02", missing)]

    registered = ctx.data.profile.registration_date
    if registered is None:
        return [not_evaluated(ctx, "REG-02", ("registration date",))]

    window = ctx.params.get("REG-02", "window_days", on=ctx.fy.end)
    ratio_param = ctx.params.get("REG-02", "itc_turnover_ratio", on=ctx.fy.end)
    min_itc = ctx.params.get("REG-02", "min_itc", on=ctx.fy.end)

    tracer = ctx.tracer(CalcKind.RULE, "REG-02", legal_basis="s.29(2) CGST Act, 2017 r/w Rule 21A")
    for parameter in (window, ratio_param, min_itc):
        tracer.used_parameter(parameter.use())

    early = [
        ret
        for ret in ctx.data.returns_3b
        if Decimal((ret.period.last_day - registered).days) <= window.decimal
        and ret.period.last_day >= registered
    ]
    if not early:
        return [
            clear(
                ctx,
                "REG-02",
                narrative=f"No return falls within {window.decimal} days of registration "
                f"on {registered}.",
            )
        ]

    itc = sum((ret.itc_available_gross.total for ret in early), _ZERO)
    turnover = sum((ret.taxable_turnover for ret in early), _ZERO)
    tracer.step("credit taken in the opening window", "sum 3B[4(A)]", {"periods": len(early)}, itc)
    tracer.step("turnover declared in the opening window", "sum 3B[3.1(a)+(b)+(c)]", {}, turnover)
    tracer.note("itc", itc)
    tracer.note("turnover", turnover)

    # No turnover at all in the opening window while credit is taken is the
    # strongest form of this pattern, not an undefined ratio.
    ratio = _NO_TURNOVER_RATIO if turnover <= 0 else (itc / turnover).quantize(Decimal("0.0001"))
    tracer.step("ITC-to-turnover ratio", "ITC / turnover", {}, ratio)

    trace = tracer.finish(
        result=ratio,
        formula_template="within {days} days of registration, ITC/turnover > {ratio} "
        "AND ITC > {min}",
        formula_rendered=f"ITC {itc} against turnover {turnover}, ratio {ratio}",
    )
    if ratio > ratio_param.decimal and itc > min_itc.decimal:
        return [
            triggered(
                ctx,
                "REG-02",
                taxable_value_effect=itc,
                trace=trace,
                narrative=f"Within {window.decimal} days of registration on {registered}, "
                f"{itc} of credit was taken against {turnover} of turnover.",
            )
        ]
    return [
        clear(
            ctx,
            "REG-02",
            trace=trace,
            narrative=f"Opening-window credit is {ratio} of turnover, below the threshold.",
        )
    ]


@rule(
    id="REG-03",
    title="Many active registrations at one principal place of business",
    family="REG",
    dimension=RiskDimension.NETWORK,
    legal_basis="Rule 25 CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("address_index",),
    params=("REG-03.min_gstins_at_address",),
    relates_to=("P24",),
    form=ActionForm.ADVISORY,
    threshold="five or more active GSTINs at one normalised address",
)
def reg_03(ctx: RuleContext) -> list[Finding]:
    """ADVISORY: a business centre legitimately hosts many registrations."""
    index = ctx.extras.get("address_index")
    if index is None or ctx.data.profile.address_norm_hash is None:
        return [not_evaluated(ctx, "REG-03", ("a normalised-address index across registrations",))]

    minimum = ctx.params.get("REG-03", "min_gstins_at_address", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "REG-03", legal_basis="Rule 25 CGST Rules, 2017")
    tracer.used_parameter(minimum.use())

    neighbours = index.get(ctx.data.profile.address_norm_hash, ())
    tracer.step(
        "active registrations at this address",
        "count by normalised address hash",
        {},
        len(neighbours),
    )
    tracer.note("count", len(neighbours))

    trace = tracer.finish(
        result=len(neighbours),
        formula_template=">= {n} active GSTINs at one normalised address",
        formula_rendered=f"{len(neighbours)} registration(s) at this address",
    )
    if Decimal(len(neighbours)) >= minimum.decimal:
        return [
            triggered(
                ctx,
                "REG-03",
                trace=trace,
                narrative=f"{len(neighbours)} active registrations share this principal "
                f"place of business. A shared address is common in a business "
                f"centre and is a lead, not a finding.",
            )
        ]
    return [
        clear(
            ctx,
            "REG-03",
            trace=trace,
            narrative=f"{len(neighbours)} registration(s) at this address.",
        )
    ]


@rule(
    id="REG-04",
    title="Shared contact or bank account across distinct PANs",
    family="REG",
    dimension=RiskDimension.NETWORK,
    legal_basis="Rule 10A CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("contact_index",),
    params=("REG-04.min_pans",),
    relates_to=("P24",),
    form=ActionForm.ADVISORY,
    threshold="two or more distinct PANs sharing a bank account, mobile or email",
)
def reg_04(ctx: RuleContext) -> list[Finding]:
    index = ctx.extras.get("contact_index")
    if index is None:
        return [
            not_evaluated(ctx, "REG-04", ("a hashed contact and bank index across registrations",))
        ]

    minimum = ctx.params.get("REG-04", "min_pans", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "REG-04", legal_basis="Rule 10A CGST Rules, 2017")
    tracer.used_parameter(minimum.use())

    profile = ctx.data.profile
    shared: dict[str, int] = {}
    for label, digest in (
        ("bank account", profile.bank_hash),
        ("mobile", profile.mobile_hash),
        ("email", profile.email_hash),
    ):
        if digest is None:
            continue
        pans = {pan for pan in index.get(digest, ()) if pan != profile.pan}
        if pans:
            shared[label] = len(pans) + 1
            tracer.step(
                f"shared {label}",
                "distinct PANs on one hashed identifier",
                {"other_pans": len(pans)},
                len(pans) + 1,
            )

    tracer.note("shared", shared)
    trace = tracer.finish(
        result=shared,
        formula_template=">= {n} distinct PANs sharing a bank account, mobile or email",
        formula_rendered=f"shared identifiers: {shared or 'none'}",
    )
    if any(Decimal(count) >= minimum.decimal for count in shared.values()):
        return [
            triggered(
                ctx,
                "REG-04",
                trace=trace,
                narrative=f"This registration shares {', '.join(shared)} with other PANs. "
                f"An investigative lead only; identifiers are compared as "
                f"hashes and are never shown in the clear.",
            )
        ]
    return [
        clear(
            ctx,
            "REG-04",
            trace=trace,
            narrative="No bank account, mobile or email is shared across distinct PANs.",
        )
    ]


@rule(
    id="REG-06",
    title="Activity after cancellation of registration",
    family="REG",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.29(3) CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("gstr1",),
    form=ActionForm.DRC_01,
    threshold="any supply, movement or IRN after the cancellation date",
)
def reg_06(ctx: RuleContext) -> list[Finding]:
    cancelled_on = ctx.data.profile.cancellation_date
    if cancelled_on is None:
        return [clear(ctx, "REG-06", narrative="The registration is not cancelled.")]

    tracer = ctx.tracer(CalcKind.RULE, "REG-06", legal_basis="s.29(3) CGST Act, 2017")
    tracer.note("cancellation_date", cancelled_on)

    supplies = [row for row in ctx.data.outward if row.doc_date and row.doc_date > cancelled_on]
    bills = [row for row in ctx.data.ewb if row.ewb_date and row.ewb_date > cancelled_on]
    irns = [row for row in ctx.data.einvoices if row.ack_date and row.ack_date > cancelled_on]

    exposure = TaxVector()
    for supply in supplies:
        exposure = exposure + supply.tax
        tracer.evidence(supply.row_id)
    for bill in bills:
        tracer.evidence(bill.prov_id)

    tracer.step(
        "supplies after cancellation", "GSTR-1 doc_date > cancellation_date", {}, len(supplies)
    )
    tracer.step(
        "movements after cancellation", "e-way bill date > cancellation_date", {}, len(bills)
    )
    tracer.step(
        "IRNs after cancellation", "acknowledgement date > cancellation_date", {}, len(irns)
    )
    tracer.note("supplies", len(supplies))
    tracer.note("exposure", exposure)

    trace = tracer.finish(
        result=exposure,
        formula_template="any GSTR-1, e-way bill or IRN dated after cancellation_date",
        formula_rendered=f"{len(supplies)} supply/supplies, {len(bills)} movement(s), "
        f"{len(irns)} IRN(s) after {cancelled_on}",
    )
    if supplies or bills or irns:
        return [
            triggered(
                ctx,
                "REG-06",
                observed=exposure,
                delta=exposure,
                trace=trace,
                narrative=f"Activity continued after the registration was cancelled on "
                f"{cancelled_on}: {len(supplies)} supply/supplies, "
                f"{len(bills)} movement(s), {len(irns)} IRN(s).",
            )
        ]
    return [clear(ctx, "REG-06", trace=trace, narrative="No activity after cancellation.")]


@rule(
    id="REG-07",
    title="Returns approaching or past the three-year bar",
    family="REG",
    dimension=RiskDimension.BEHAVIOUR,
    legal_basis="s.37(5), s.39(11), s.44(2) and s.52(15) CGST Act, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("filing_status",),
    params=("REG-07.bar_years",),
    relates_to=("P12",),
    form=ActionForm.ASMT_13,
    threshold="any unfiled return whose due date is within three years of expiry",
)
def reg_07(ctx: RuleContext) -> list[Finding]:
    """The worked specification in docs/01 section C3.

    Once barred, the return can never be filed and the only route left is a
    s.62 best-judgement assessment or s.63.  A countdown on a screen recovers
    more revenue than any model will.
    """
    missing = ctx.missing(("filing_status",))
    if missing:
        return [not_evaluated(ctx, "REG-07", missing)]

    tracer = ctx.tracer(
        CalcKind.RULE,
        "REG-07",
        legal_basis="s.37(5), s.39(11), s.44(2) and s.52(15) CGST Act, 2017",
    )
    tracer.used_parameter(ctx.params.get("REG-07", "bar_years", on=ctx.fy.end).use())
    tracer.note("as_of", ctx.as_of)

    buckets: dict[str, list[dict[str, object]]] = {
        "BARRED": [],
        "CRITICAL": [],
        "WARNING": [],
        "OK": [],
    }
    for row in ctx.data.filings:
        if row.filing_date is not None or row.due_date is None:
            continue
        bar_date = three_year_bar(row.due_date)
        days_left = (bar_date - ctx.as_of).days
        if days_left < 0:
            status = "BARRED"
        elif days_left < _BAR_CRITICAL_DAYS:
            status = "CRITICAL"
        elif days_left < _BAR_WARNING_DAYS:
            status = "WARNING"
        else:
            status = "OK"
        buckets[status].append(
            {
                "return_type": row.return_type,
                "period": row.period.mmyyyy,
                "due_date": row.due_date.isoformat(),
                "bar_date": bar_date.isoformat(),
                "days_left": days_left,
            }
        )
        tracer.step(
            f"{row.return_type} {row.period}",
            "due_date + 3 years - as_of",
            {"due": row.due_date, "bar": bar_date},
            f"{days_left} days ({status})",
        )

    at_risk = buckets["BARRED"] + buckets["CRITICAL"] + buckets["WARNING"]
    tracer.note("barred", len(buckets["BARRED"]))
    tracer.note("critical", len(buckets["CRITICAL"]))
    tracer.note("warning", len(buckets["WARNING"]))

    trace = tracer.finish(
        result=len(at_risk),
        formula_template="bar_date = due_date + 3 years; BARRED (<0) / CRITICAL (<90) / "
        "WARNING (<180) / OK",
        formula_rendered=f"{len(buckets['BARRED'])} barred, {len(buckets['CRITICAL'])} within "
        f"90 days, {len(buckets['WARNING'])} within 180 days",
    )
    if at_risk:
        barred = len(buckets["BARRED"])
        return [
            triggered(
                ctx,
                "REG-07",
                trace=trace,
                severity=Severity.CRITICAL if barred else Severity.HIGH,
                narrative=(
                    f"{barred} return(s) are already time-barred and can never be filed; the "
                    f"route is a s.62 best-judgement assessment. "
                    f"{len(buckets['CRITICAL'])} more expire within 90 days."
                ),
                extra={"buckets": buckets},
            )
        ]
    return [clear(ctx, "REG-07", trace=trace, narrative="No return is near the three-year bar.")]
