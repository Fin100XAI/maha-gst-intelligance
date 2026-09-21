"""EWB -- movement (seven rules) and EIN -- e-invoicing (three rules)."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import ActionForm, Confidence, RiskDimension, Severity
from app.engine.context import RuleContext
from app.engine.records import EwbRecord
from app.engine.registry import Finding, clear, not_evaluated, rule, triggered
from app.engine.trace import CalcKind
from app.money import TaxVector

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")
_HOURS_PER_DAY: Final[Decimal] = Decimal("24")

#: Sort key for bills already filtered to have a generation date.
_EPOCH: Final[date] = date(1970, 1, 1)


def _doc_key(doc_no: str | None, doc_date: object) -> tuple[str, object]:
    return ((doc_no or "").strip().upper(), doc_date)


# ---------------------------------------------------------------------------
# EWB-01 / EWB-02 -- the two sides of the movement join
# ---------------------------------------------------------------------------


@rule(
    id="EWB-01",
    title="E-way bill with no corresponding GSTR-1 invoice",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138 CGST Rules, 2017 r/w s.37 CGST Act, 2017",
    severity=Severity.CRITICAL,
    confidence=Confidence.CERTAIN,
    requires=("eway_bill", "gstr1"),
    params=("EWB-01.min_value",),
    form=ActionForm.ASMT_10,
    threshold="above 50,000 of unmatched movement",
)
def ewb_01(ctx: RuleContext) -> list[Finding]:
    """Goods moved that were never declared as a supply."""
    missing = ctx.missing(("eway_bill", "gstr1"))
    if missing:
        return [not_evaluated(ctx, "EWB-01", missing)]

    minimum = ctx.params.get("EWB-01", "min_value", on=ctx.fy.end)
    tracer = ctx.tracer(
        CalcKind.RULE, "EWB-01", legal_basis="Rule 138 CGST Rules, 2017 r/w s.37 CGST Act, 2017"
    )
    tracer.used_parameter(minimum.use())

    declared = {_doc_key(row.doc_no, row.doc_date) for row in ctx.data.outward}
    unmatched_value = _ZERO
    unmatched = 0

    for bill in ctx.data.ewb:
        if bill.status != "ACTIVE" or bill.value <= minimum.decimal:
            continue
        if _doc_key(bill.doc_no, bill.doc_date) not in declared:
            unmatched_value += bill.value
            unmatched += 1
            tracer.evidence(bill.prov_id)

    tracer.step(
        "e-way bills with no matching GSTR-1 document",
        "left anti-join on (doc_no, doc_date)",
        {"bills": len(ctx.data.ewb), "declared_documents": len(declared)},
        unmatched,
    )
    tracer.note("unmatched", unmatched)
    tracer.note("value", unmatched_value)

    trace = tracer.finish(
        result=unmatched_value,
        formula_template="e-way bills LEFT ANTI JOIN GSTR-1 on (doc_no, doc_date)",
        formula_rendered=f"{unmatched} bill(s), {unmatched_value}",
    )
    if unmatched:
        return [
            triggered(
                ctx,
                "EWB-01",
                taxable_value_effect=unmatched_value,
                trace=trace,
                narrative=f"{unmatched} e-way bill(s) worth {unmatched_value} have no "
                f"corresponding invoice in GSTR-1.",
            )
        ]
    return [
        clear(
            ctx,
            "EWB-01",
            trace=trace,
            narrative="Every e-way bill above the threshold matches a declared document.",
        )
    ]


@rule(
    id="EWB-02",
    title="Invoice above the threshold with no e-way bill",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138(1) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("eway_bill", "gstr1"),
    params=("EWB-02.state_threshold",),
    form=ActionForm.ASMT_10,
    threshold="consignment value above the State threshold",
)
def ewb_02(ctx: RuleContext) -> list[Finding]:
    """Goods HSN only: a supply of services needs no e-way bill."""
    missing = ctx.missing(("eway_bill", "gstr1"))
    if missing:
        return [not_evaluated(ctx, "EWB-02", missing)]

    threshold = ctx.params.get("EWB-02", "state_threshold", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "EWB-02", legal_basis="Rule 138(1) CGST Rules, 2017")
    tracer.used_parameter(threshold.use())

    moved = {_doc_key(bill.doc_no, bill.doc_date) for bill in ctx.data.ewb}
    unmatched_value = _ZERO
    unmatched = 0

    for row in ctx.data.outward:
        # SAC codes (99xxxx) are services and are outside Rule 138.
        if row.hsn is None or row.hsn.startswith("99"):
            continue
        consignment = row.taxable_value + row.tax.total
        if consignment <= threshold.decimal:
            continue
        if _doc_key(row.doc_no, row.doc_date) not in moved:
            unmatched_value += consignment
            unmatched += 1
            tracer.evidence(row.row_id)

    tracer.step(
        "invoices above the threshold with no e-way bill",
        "right anti-join, goods HSN only",
        {"threshold": threshold.decimal},
        unmatched,
    )
    tracer.note("unmatched", unmatched)
    tracer.note("value", unmatched_value)

    trace = tracer.finish(
        result=unmatched_value,
        formula_template="GSTR-1 goods lines above the State threshold ANTI JOIN e-way bills",
        formula_rendered=f"{unmatched} invoice(s), {unmatched_value}",
    )
    if unmatched:
        return [
            triggered(
                ctx,
                "EWB-02",
                taxable_value_effect=unmatched_value,
                trace=trace,
                narrative=f"{unmatched} invoice(s) worth {unmatched_value} exceed the "
                f"e-way bill threshold with no bill raised.",
            )
        ]
    return [
        clear(
            ctx,
            "EWB-02",
            trace=trace,
            narrative="Every goods invoice above the threshold has an e-way bill.",
        )
    ]


@rule(
    id="EWB-03",
    title="E-way bill value differs from the invoice value",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138A CGST Rules, 2017",
    severity=Severity.MEDIUM,
    confidence=Confidence.STRONG,
    requires=("eway_bill", "gstr1"),
    params=("EWB-03.variance_percent", "EWB-03.min_amount"),
    form=ActionForm.ASMT_10,
    threshold="more than 2% and more than 25,000",
)
def ewb_03(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("eway_bill", "gstr1"))
    if missing:
        return [not_evaluated(ctx, "EWB-03", missing)]

    variance = ctx.params.get("EWB-03", "variance_percent", on=ctx.fy.end)
    minimum = ctx.params.get("EWB-03", "min_amount", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "EWB-03", legal_basis="Rule 138A CGST Rules, 2017")
    tracer.used_parameter(variance.use())
    tracer.used_parameter(minimum.use())

    invoices = {_doc_key(row.doc_no, row.doc_date): row for row in ctx.data.outward}
    total_gap = _ZERO
    affected = 0

    for bill in ctx.data.ewb:
        row = invoices.get(_doc_key(bill.doc_no, bill.doc_date))
        if row is None:
            continue
        # The e-way bill value includes tax.
        invoice_value = row.taxable_value + row.tax.total
        if invoice_value <= 0:
            continue
        gap = abs(bill.value - invoice_value)
        share = (gap / invoice_value * _HUNDRED).quantize(Decimal("0.01"))
        if share > variance.decimal and gap > minimum.decimal:
            total_gap += gap
            affected += 1
            tracer.evidence(bill.prov_id, row.row_id)
            tracer.step(
                f"e-way bill {bill.ewb_no} against {row.doc_no}",
                "|EWB value - (taxable + tax)| / invoice value",
                {"ewb": bill.value, "invoice": invoice_value},
                share,
            )

    tracer.note("affected", affected)
    tracer.note("total_gap", total_gap)
    trace = tracer.finish(
        result=total_gap,
        formula_template="|EWB - (taxable + tax)| / invoice value > 2% AND gap > 25,000",
        formula_rendered=f"{affected} bill(s), total variance {total_gap}",
    )
    if affected:
        return [
            triggered(
                ctx,
                "EWB-03",
                taxable_value_effect=total_gap,
                trace=trace,
                narrative=f"{affected} e-way bill(s) differ materially in value from "
                f"the invoice they accompany.",
            )
        ]
    return [clear(ctx, "EWB-03", trace=trace, narrative="E-way bill values match their invoices.")]


@rule(
    id="EWB-04",
    title="Part-B never filled on a long-distance movement",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138(3) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("eway_bill",),
    params=("EWB-04.min_distance_km",),
    form=ActionForm.ASMT_10,
    threshold="distance above 50 km with no vehicle recorded",
)
def ewb_04(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("eway_bill",))
    if missing:
        return [not_evaluated(ctx, "EWB-04", missing)]

    distance = ctx.params.get("EWB-04", "min_distance_km", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "EWB-04", legal_basis="Rule 138(3) CGST Rules, 2017")
    tracer.used_parameter(distance.use())

    value = _ZERO
    count = 0
    for bill in ctx.data.ewb:
        if bill.status != "ACTIVE" or bill.part_b_filled:
            continue
        if bill.distance_km is not None and Decimal(bill.distance_km) > distance.decimal:
            value += bill.value
            count += 1
            tracer.evidence(bill.prov_id)

    tracer.step(
        "bills with no Part-B beyond the distance exemption",
        "part_b_filled = false AND distance > 50 km",
        {},
        count,
    )
    tracer.note("count", count)
    tracer.note("value", value)

    trace = tracer.finish(
        result=value,
        formula_template="part_b_filled = false AND distance > {km} km",
        formula_rendered=f"{count} bill(s), {value}",
    )
    if count:
        return [
            triggered(
                ctx,
                "EWB-04",
                taxable_value_effect=value,
                trace=trace,
                narrative=f"{count} e-way bill(s) covering more than "
                f"{distance.decimal} km carry no vehicle in Part-B.",
            )
        ]
    return [
        clear(ctx, "EWB-04", trace=trace, narrative="Part-B is complete on every long movement.")
    ]


@rule(
    id="EWB-05",
    title="Physically impossible movement",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138(10) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.STRONG,
    requires=("eway_bill",),
    params=("EWB-05.max_speed_kmph",),
    form=ActionForm.ASMT_10,
    threshold="implied speed above 90 km/h, or delivery before generation",
)
def ewb_05(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("eway_bill",))
    if missing:
        return [not_evaluated(ctx, "EWB-05", missing)]

    max_speed = ctx.params.get("EWB-05", "max_speed_kmph", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "EWB-05", legal_basis="Rule 138(10) CGST Rules, 2017")
    tracer.used_parameter(max_speed.use())

    impossible = 0
    value = _ZERO
    for bill in ctx.data.ewb:
        if bill.ewb_date is None or bill.delivered_at is None or bill.distance_km is None:
            continue
        elapsed_days = Decimal((bill.delivered_at - bill.ewb_date).days)
        if elapsed_days < 0:
            impossible += 1
            value += bill.value
            tracer.evidence(bill.prov_id)
            tracer.step(
                f"{bill.ewb_no}",
                "delivered before the bill was generated",
                {"generated": bill.ewb_date, "delivered": bill.delivered_at},
                "impossible",
            )
            continue
        hours = elapsed_days * _HOURS_PER_DAY
        if hours <= 0:
            hours = Decimal("1")
        speed = (Decimal(bill.distance_km) / hours).quantize(Decimal("0.01"))
        if speed > max_speed.decimal:
            impossible += 1
            value += bill.value
            tracer.evidence(bill.prov_id)
            tracer.step(
                f"{bill.ewb_no}",
                "distance / elapsed hours",
                {"km": bill.distance_km, "hours": hours},
                speed,
            )

    tracer.note("impossible", impossible)
    tracer.note("value", value)
    trace = tracer.finish(
        result=impossible,
        formula_template="distance / elapsed hours > {speed} km/h, or delivery before generation",
        formula_rendered=f"{impossible} movement(s), {value}",
    )
    if impossible:
        return [
            triggered(
                ctx,
                "EWB-05",
                taxable_value_effect=value,
                trace=trace,
                narrative=f"{impossible} movement(s) could not have happened as recorded.",
            )
        ]
    return [clear(ctx, "EWB-05", trace=trace, narrative="No physically impossible movement.")]


@rule(
    id="EWB-06",
    title="One vehicle carrying overlapping consignments",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138A CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.ADVISORY,
    requires=("eway_bill",),
    form=ActionForm.ASMT_10,
    threshold="two or more overlapping consignments on one vehicle",
)
def ewb_06(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("eway_bill",))
    if missing:
        return [not_evaluated(ctx, "EWB-06", missing)]

    tracer = ctx.tracer(CalcKind.RULE, "EWB-06", legal_basis="Rule 138A CGST Rules, 2017")
    by_vehicle: dict[str, list[EwbRecord]] = {}
    for bill in ctx.data.ewb:
        if bill.vehicle_no and bill.ewb_date and bill.valid_upto:
            by_vehicle.setdefault(bill.vehicle_no.upper().replace(" ", ""), []).append(bill)

    conflicts = 0
    for vehicle, bills in sorted(by_vehicle.items()):
        ordered = sorted(bills, key=lambda b: b.ewb_date or _EPOCH)
        for index in range(len(ordered) - 1):
            current, following = ordered[index], ordered[index + 1]
            # Both dates are present: the grouping above admitted only bills
            # that carry a generation date and a validity, and mypy cannot see
            # that through the dict.
            if current.valid_upto is None or following.ewb_date is None:
                continue
            overlapping = following.ewb_date < current.valid_upto
            different_corridor = (
                current.to_state != following.to_state or current.from_state != following.from_state
            )
            if overlapping and different_corridor:
                conflicts += 1
                tracer.evidence(current.prov_id, following.prov_id)
                tracer.step(
                    f"vehicle {vehicle}",
                    "overlapping validity on different corridors",
                    {"first": current.ewb_no, "second": following.ewb_no},
                    "conflict",
                )

    tracer.note("vehicles", len(by_vehicle))
    tracer.note("conflicts", conflicts)
    trace = tracer.finish(
        result=conflicts,
        formula_template="same vehicle, overlapping validity, different corridors",
        formula_rendered=f"{conflicts} conflict(s) across {len(by_vehicle)} vehicle(s)",
    )
    if conflicts:
        return [
            triggered(
                ctx,
                "EWB-06",
                trace=trace,
                narrative=f"{conflicts} pair(s) of consignments were on one vehicle at "
                f"the same time on different corridors. This is an "
                f"investigative lead, not a finding of fact.",
            )
        ]
    return [
        clear(ctx, "EWB-06", trace=trace, narrative="No vehicle carried overlapping consignments.")
    ]


@rule(
    id="EWB-08",
    title="High e-way bill cancellation rate",
    family="EWB",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 138(9) CGST Rules, 2017",
    severity=Severity.MEDIUM,
    confidence=Confidence.ADVISORY,
    requires=("eway_bill",),
    params=("EWB-08.cancellation_percent",),
    form=ActionForm.ASMT_10,
    threshold="above 10% cancelled",
)
def ewb_08(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("eway_bill",))
    if missing:
        return [not_evaluated(ctx, "EWB-08", missing)]

    threshold = ctx.params.get("EWB-08", "cancellation_percent", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "EWB-08", legal_basis="Rule 138(9) CGST Rules, 2017")
    tracer.used_parameter(threshold.use())

    generated = len(ctx.data.ewb)
    cancelled = sum(1 for bill in ctx.data.ewb if bill.status == "CANCELLED")
    if generated == 0:
        return [not_evaluated(ctx, "EWB-08", ("e-way bills for this financial year",))]

    rate = (Decimal(cancelled) / Decimal(generated) * _HUNDRED).quantize(Decimal("0.01"))
    tracer.step(
        "cancellation rate",
        "cancelled / generated x 100",
        {"cancelled": cancelled, "generated": generated},
        rate,
    )
    tracer.note("rate", rate)

    trace = tracer.finish(
        result=rate,
        formula_template="cancelled / generated x 100 > {threshold}%",
        formula_rendered=f"{cancelled} / {generated} = {rate}%",
    )
    if rate > threshold.decimal:
        return [
            triggered(
                ctx, "EWB-08", trace=trace, narrative=f"{rate}% of e-way bills were cancelled."
            )
        ]
    return [
        clear(
            ctx,
            "EWB-08",
            trace=trace,
            narrative=f"Cancellation rate is {rate}%, within the threshold.",
        )
    ]


# ---------------------------------------------------------------------------
# EIN -- e-invoicing
# ---------------------------------------------------------------------------


@rule(
    id="EIN-01",
    title="Above the e-invoice threshold with no IRN raised",
    family="EIN",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 48(4) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr1",),
    params=("EIN-01.aato_threshold",),
    form=ActionForm.ASMT_10,
    threshold="AATO at or above 5 crore with zero IRNs",
)
def ein_01(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("gstr1",))
    if missing:
        return [not_evaluated(ctx, "EIN-01", missing)]

    aato = ctx.data.profile.aato
    if aato is None:
        return [
            not_evaluated(ctx, "EIN-01", ("aggregate annual turnover in the registration master",))
        ]

    threshold = ctx.params.get("EIN-01", "aato_threshold", on=ctx.fy.end)
    tracer = ctx.tracer(CalcKind.RULE, "EIN-01", legal_basis="Rule 48(4) CGST Rules, 2017")
    tracer.used_parameter(threshold.use())

    irn_count = len([row for row in ctx.data.einvoices if row.status == "ACTIVE"])
    b2b_documents = len(
        {row.doc_no for row in ctx.data.outward if row.section == "B2B" and row.doc_no}
    )
    tracer.step("aggregate annual turnover", "registration master", {}, aato)
    tracer.step("active IRNs", "count", {}, irn_count)
    tracer.step("B2B documents in GSTR-1", "count(distinct doc_no)", {}, b2b_documents)
    tracer.note("aato", aato)
    tracer.note("irn_count", irn_count)

    trace = tracer.finish(
        result=irn_count,
        formula_template="AATO >= {threshold} AND active IRN count = 0",
        formula_rendered=f"AATO {aato}, {irn_count} IRN(s), {b2b_documents} B2B document(s)",
    )
    if aato >= threshold.decimal and irn_count == 0 and b2b_documents > 0:
        return [
            triggered(
                ctx,
                "EIN-01",
                trace=trace,
                narrative=f"Turnover of {aato} makes e-invoicing mandatory, yet "
                f"{b2b_documents} B2B document(s) were reported with no IRN.",
            )
        ]
    return [
        clear(
            ctx,
            "EIN-01",
            trace=trace,
            narrative="E-invoicing obligations appear to be met, or do not apply.",
        )
    ]


@rule(
    id="EIN-02",
    title="IRN reported beyond the 30-day limit",
    family="EIN",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Proviso to Rule 48(4) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("einvoice",),
    params=("EIN-02.reporting_days", "EIN-02.aato_threshold"),
    form=ActionForm.ASMT_10,
    threshold="acknowledgement more than 30 days after the document date",
)
def ein_02(ctx: RuleContext) -> list[Finding]:
    missing = ctx.missing(("einvoice",))
    if missing:
        return [not_evaluated(ctx, "EIN-02", missing)]

    days_param = ctx.params.get("EIN-02", "reporting_days", on=ctx.fy.end)
    aato_param = ctx.params.get("EIN-02", "aato_threshold", on=ctx.fy.end)
    aato = ctx.data.profile.aato
    if aato is None:
        return [
            not_evaluated(ctx, "EIN-02", ("aggregate annual turnover in the registration master",))
        ]
    if aato < aato_param.decimal:
        return [
            clear(
                ctx,
                "EIN-02",
                narrative=f"The 30-day reporting limit applies above {aato_param.decimal}; "
                f"turnover is {aato}.",
            )
        ]

    tracer = ctx.tracer(
        CalcKind.RULE, "EIN-02", legal_basis="Proviso to Rule 48(4) CGST Rules, 2017"
    )
    tracer.used_parameter(days_param.use())
    tracer.used_parameter(aato_param.use())

    late = 0
    value = _ZERO
    for row in ctx.data.einvoices:
        if row.ack_date is None or row.doc_date is None:
            continue
        lag = (row.ack_date - row.doc_date).days
        if Decimal(lag) > days_param.decimal:
            late += 1
            value += row.taxable_value
            tracer.evidence(row.prov_id)

    tracer.step("IRNs reported late", "ack_date - doc_date > 30 days", {}, late)
    tracer.note("late", late)
    tracer.note("value", value)

    trace = tracer.finish(
        result=late,
        formula_template="ack_date - doc_date > {days} days where AATO >= {aato}",
        formula_rendered=f"{late} IRN(s) reported late, covering {value}",
    )
    if late:
        return [
            triggered(
                ctx,
                "EIN-02",
                taxable_value_effect=value,
                trace=trace,
                narrative=f"{late} invoice(s) were reported to the IRP more than "
                f"{days_param.decimal} days after their document date.",
            )
        ]
    return [clear(ctx, "EIN-02", trace=trace, narrative="Every IRN was reported within the limit.")]


@rule(
    id="EIN-04",
    title="Mandated B2B invoice with no IRN, so not a valid document",
    family="EIN",
    dimension=RiskDimension.MOVEMENT,
    legal_basis="Rule 48(5) CGST Rules, 2017",
    severity=Severity.HIGH,
    confidence=Confidence.CERTAIN,
    requires=("gstr1", "einvoice"),
    params=("EIN-01.aato_threshold",),
    form=ActionForm.ASMT_10,
    threshold="any mandated B2B document without an IRN",
)
def ein_04(ctx: RuleContext) -> list[Finding]:
    """An invoice that should carry an IRN and does not is not a valid document
    at all, which means the recipient's credit on it is at risk too."""
    missing = ctx.missing(("gstr1", "einvoice"))
    if missing:
        return [not_evaluated(ctx, "EIN-04", missing)]

    aato = ctx.data.profile.aato
    if aato is None:
        return [
            not_evaluated(ctx, "EIN-04", ("aggregate annual turnover in the registration master",))
        ]

    threshold = ctx.params.get("EIN-01", "aato_threshold", on=ctx.fy.end)
    if aato < threshold.decimal:
        return [
            clear(ctx, "EIN-04", narrative=f"E-invoicing is not mandated at a turnover of {aato}.")
        ]

    tracer = ctx.tracer(CalcKind.RULE, "EIN-04", legal_basis="Rule 48(5) CGST Rules, 2017")
    tracer.used_parameter(threshold.use())

    with_irn = {row.doc_no for row in ctx.data.einvoices if row.doc_no}
    missing_irn = 0
    exposure = TaxVector()
    for row in ctx.data.outward:
        if row.section not in {"B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEEMED"}:
            continue
        if row.doc_no and row.doc_no not in with_irn and not row.irn:
            missing_irn += 1
            exposure = exposure + row.tax
            tracer.evidence(row.row_id)

    tracer.step(
        "mandated documents with no IRN", "GSTR-1 B2B/export ANTI JOIN e-invoice", {}, missing_irn
    )
    tracer.note("missing_irn", missing_irn)
    tracer.note("exposure", exposure)

    trace = tracer.finish(
        result=missing_irn,
        formula_template="mandated B2B/export document with no IRN",
        formula_rendered=f"{missing_irn} document(s), tax {exposure.total}",
    )
    if missing_irn:
        return [
            triggered(
                ctx,
                "EIN-04",
                observed=exposure,
                trace=trace,
                narrative=f"{missing_irn} mandated document(s) carry no IRN and are "
                f"therefore not valid documents under Rule 48(5).",
            )
        ]
    return [clear(ctx, "EIN-04", trace=trace, narrative="Every mandated document carries an IRN.")]
