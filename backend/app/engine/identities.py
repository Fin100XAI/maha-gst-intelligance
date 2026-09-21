"""The eleven reconciliation identities, R1 to R11.

Each is a named, head-wise identity a finding can cite.  Each returns a
``TaxVector`` delta and a trace, and each says explicitly when it could not be
evaluated and which dataset was missing.

Head-wise is not optional here.  An IGST shortfall of one lakh against a CGST
excess of one lakh is two breaches, not zero: ``delta.total`` is nil and
``delta.abs_total`` is two lakh, and the identity is BREACHED.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Final

from app.canonical import Period
from app.engine.context import RuleContext
from app.engine.records import LIABILITY_SECTIONS
from app.engine.trace import CalcKind, CalcTrace, render_formula
from app.money import TaxVector

__all__ = [
    "IDENTITIES",
    "IdentityResult",
    "IdentityStatus",
    "evaluate_identities",
    "identity_matrix",
]

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")


class IdentityStatus:
    HOLDS = "HOLDS"
    BREACHED = "BREACHED"
    NOT_EVALUATED = "NOT_EVALUATED"


@dataclass(frozen=True, slots=True)
class IdentityResult:
    identity_id: str
    title: str
    status: str
    period: Period | None
    delta: TaxVector
    trace: CalcTrace
    missing_inputs: tuple[str, ...] = ()
    consequence: str | None = None
    note: str | None = None

    @property
    def calc_id(self) -> str:
        return self.trace.calc_id

    @property
    def holds(self) -> bool:
        return self.status == IdentityStatus.HOLDS

    def as_dict(self) -> dict[str, object]:
        return {
            "identity_id": self.identity_id,
            "title": self.title,
            "status": self.status,
            "period": self.period.mmyyyy if self.period else None,
            "delta": self.delta.dict(),
            "delta_total": format(self.delta.total, "f"),
            "delta_abs_total": format(self.delta.abs_total, "f"),
            "missing_inputs": list(self.missing_inputs),
            "consequence": self.consequence,
            "note": self.note,
            "calc_id": self.calc_id,
        }


def _not_evaluated(  # noqa: PLR0917 - mirrors the identity call shape
    ctx: RuleContext,
    identity_id: str,
    title: str,
    period: Period | None,
    missing: tuple[str, ...],
    legal_basis: str | None = None,
) -> IdentityResult:
    tracer = ctx.tracer(CalcKind.IDENTITY, identity_id, period=period, legal_basis=legal_basis)
    tracer.note("missing_inputs", list(missing))
    trace = tracer.finish(result=None, formula_template=None, formula_rendered=None)
    return IdentityResult(
        identity_id=identity_id,
        title=title,
        status=IdentityStatus.NOT_EVALUATED,
        period=period,
        delta=TaxVector(),
        trace=trace,
        missing_inputs=missing,
        note=f"cannot be evaluated: {', '.join(missing)} not present",
    )


def _status(delta: TaxVector, tolerance: Decimal = _ZERO) -> str:
    return IdentityStatus.HOLDS if delta.is_zero(tolerance) else IdentityStatus.BREACHED


# ---------------------------------------------------------------------------
# R1 -- GSTR-1 outward liability vs GSTR-3B
# ---------------------------------------------------------------------------

R1_TEMPLATE = (
    "delta(head) = sum(GSTR-1 signed tax over {sections}) - 3B[3.1(a) + 3.1(b) + 3.1.1(i)](head)"
)


def r1(ctx: RuleContext, period: Period) -> IdentityResult:
    """Sum of GSTR-1 outward tax must equal 3B 3.1(a)+(b)+3.1.1(i), head-wise.

    Amendments fold in here, at the identity layer, and credit notes take their
    negative sign here -- never in the stored row.

    3.1(d) inward reverse charge is excluded.  It is a liability, but not an
    *outward-supply* liability, and including it is the commonest false
    positive on Rule 88C.
    """
    missing = ctx.missing(("gstr1", "gstr3b"))
    if missing:
        return _not_evaluated(
            ctx,
            "R1",
            "GSTR-1 vs GSTR-3B outward liability",
            period,
            missing,
            "Rule 88C CGST Rules, 2017",
        )

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R1", period=period, legal_basis="Rule 88C CGST Rules, 2017"
    )
    lines = [row for row in ctx.outward(period) if row.section in LIABILITY_SECTIONS]

    g1 = TaxVector()
    credit_notes = TaxVector()
    amendments = TaxVector()
    for row in lines:
        g1 = g1 + row.signed_tax
        if row.doc_type == "CREDIT_NOTE":
            credit_notes = credit_notes + row.tax
        if row.is_amendment or row.section == "AMENDMENT":
            amendments = amendments + row.signed_tax
        tracer.evidence(row.row_id)

    tracer.step(
        "GSTR-1 outward tax, net of credit notes and amendments",
        "sum(signed_tax) over B2B, B2CL, B2CS, EXPWP, SEZWP, CDNR, CDNUR, 9(5), amendments",
        {"lines": len(lines), "credit_notes": credit_notes, "amendments": amendments},
        g1,
    )

    ret = ctx.return_3b(period)
    if ret is None:
        # No 3B on record for this period.  That is not a 3B declaring zero:
        # the return may have been filed and simply not supplied to us.
        # Treating absence as a nil declaration would report the whole of the
        # GSTR-1 liability as undeclared and route an ASMT-10 for a
        # discrepancy nobody has established.  If the return is genuinely
        # unfiled, that is a filing finding (REG-07, BEH-02), not a Rule 88C
        # discrepancy.
        return _not_evaluated(
            ctx,
            "R1",
            "GSTR-1 vs GSTR-3B outward liability",
            period,
            (f"gstr3b for {period.mmyyyy}",),
            "Rule 88C CGST Rules, 2017",
        )

    b3 = ret.outward_tax
    tracer.step(
        "GSTR-3B outward liability",
        "3B[3.1(a)] + 3B[3.1(b)] + 3B[3.1.1(i)]  (3.1(d) inward RCM excluded)",
        {
            "t31a": ret.vector("t31a"),
            "t31b": ret.vector("t31b"),
            "t311i": ret.vector("t311i"),
        },
        b3,
    )

    delta = g1 - b3
    tracer.note("g1", g1)
    tracer.note("b3", b3)
    tracer.note("lines", len(lines))
    tracer.note("regime", period.regime.value)

    shortfall = delta.positive_part()
    pct = (
        (shortfall.total / g1.total * _HUNDRED).quantize(Decimal("0.01")) if g1.total > 0 else _ZERO
    )
    tracer.step(
        "shortfall as a percentage of GSTR-1 liability",
        "shortfall.total / g1.total x 100",
        {"shortfall": shortfall, "g1": g1},
        pct,
    )

    trace = tracer.finish(
        result=delta,
        formula_template=R1_TEMPLATE,
        formula_rendered=render_formula(
            "{g1} - {b3} = {delta}", {"g1": g1, "b3": b3, "delta": delta}
        ),
    )
    return IdentityResult(
        identity_id="R1",
        title="GSTR-1 vs GSTR-3B outward liability",
        status=_status(delta),
        period=period,
        delta=delta,
        trace=trace,
        consequence="Rule 88C: above 20% and 25 lakh, DRC-01B",
    )


# ---------------------------------------------------------------------------
# R2 -- GSTR-2B available ITC vs 3B 4(A)(5)
# ---------------------------------------------------------------------------

R2_TEMPLATE = "delta(head) = 3B[4(A)(5)](head) - sum(2B available ITC, post-IMS, net of CNs)(head)"


def r2(ctx: RuleContext, period: Period) -> IdentityResult:
    """3B Table 4(A)(5) must equal the GSTR-2B 'all other ITC' bucket.

    Only 4(A)(5).  IMPG, IMPS, ISD and RCM credit sit in 4(A)(1) to (4) and are
    not part of the 2B bucket; comparing gross 4(A) against 2B is wrong and
    collapses on reply.
    """
    missing = ctx.missing(("gstr2b", "gstr3b"))
    if missing:
        return _not_evaluated(
            ctx, "R2", "GSTR-2B vs GSTR-3B ITC", period, missing, "Rule 88D CGST Rules, 2017"
        )

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R2", period=period, legal_basis="Rule 88D CGST Rules, 2017"
    )
    lines = [row for row in ctx.inward(period) if row.counts_toward_2b_available]

    available = TaxVector()
    for row in lines:
        available = available + row.signed_tax
        tracer.evidence(row.row_id)

    tracer.step(
        "GSTR-2B available ITC",
        "sum(tax) over 2B B2B lines where itc_available='Y' and IMS in {ACCEPTED, NO_ACTION}, "
        "credit notes negative",
        {"lines": len(lines)},
        available,
    )

    ret = ctx.return_3b(period)
    claimed = ret.itc_all_other if ret is not None else TaxVector()
    tracer.step("GSTR-3B all other ITC", "3B[4(A)(5)]", {}, claimed)

    delta = claimed - available
    tracer.note("available", available)
    tracer.note("claimed", claimed)
    tracer.note("lines", len(lines))

    trace = tracer.finish(
        result=delta,
        formula_template=R2_TEMPLATE,
        formula_rendered=render_formula(
            "{claimed} - {available} = {delta}",
            {"claimed": claimed, "available": available, "delta": delta},
        ),
    )
    return IdentityResult(
        identity_id="R2",
        title="GSTR-2B vs GSTR-3B input tax credit",
        status=_status(delta),
        period=period,
        delta=delta,
        trace=trace,
        consequence="Rule 88D: above 20% and 25 lakh, DRC-01C",
    )


# ---------------------------------------------------------------------------
# R3 -- the internal 3B identity
# ---------------------------------------------------------------------------

R3_TEMPLATE = "3B[4(C)](head) = 3B[4(A)](head) - 3B[4(B)](head)"


def r3(ctx: RuleContext, period: Period) -> IdentityResult:
    """4(C) must equal 4(A) minus 4(B), exactly.

    If this fails the return is malformed and every downstream figure is
    suspect, so it is reported loudly rather than absorbed.
    """
    missing = ctx.missing(("gstr3b",))
    if missing:
        return _not_evaluated(
            ctx, "R3", "GSTR-3B internal ITC identity", period, missing, "GSTR-3B Table 4"
        )

    tracer = ctx.tracer(CalcKind.IDENTITY, "R3", period=period, legal_basis="GSTR-3B Table 4")
    ret = ctx.return_3b(period)
    if ret is None:
        return _not_evaluated(ctx, "R3", "GSTR-3B internal ITC identity", period, ("gstr3b",))

    gross = ret.itc_available_gross
    reversed_itc = ret.itc_reversed
    expected = gross - reversed_itc
    declared = ret.itc_net_declared

    tracer.step("4(A) ITC available", "4(A)(1..5)", {}, gross)
    tracer.step("4(B) ITC reversed", "4(B)(1) + 4(B)(2)", {}, reversed_itc)
    tracer.step(
        "4(A) - 4(B)", "expected net ITC", {"gross": gross, "reversed": reversed_itc}, expected
    )

    delta = declared - expected
    tracer.note("declared", declared)
    tracer.note("expected", expected)
    tracer.evidence(ret.prov_id)

    trace = tracer.finish(
        result=delta,
        formula_template=R3_TEMPLATE,
        formula_rendered=render_formula(
            "{declared} vs {expected} -> {delta}",
            {"declared": declared, "expected": expected, "delta": delta},
        ),
    )
    return IdentityResult(
        identity_id="R3",
        title="GSTR-3B internal ITC identity",
        status=_status(delta),
        period=period,
        delta=delta,
        trace=trace,
        consequence="A malformed return: every downstream figure is suspect",
    )


# ---------------------------------------------------------------------------
# R4 -- e-way bill value vs GSTR-1
# ---------------------------------------------------------------------------

R4_TEMPLATE = "|sum(EWB value) - sum(GSTR-1 taxable + tax above the threshold)| <= {band}%"


def r4(ctx: RuleContext, period: Period) -> IdentityResult:
    """EWB value against GSTR-1 value, within a band.

    The EWB value **includes tax**, so the comparison is against taxable plus
    tax, not against taxable alone.  A 2% band absorbs freight and rounding.
    """
    missing = ctx.missing(("eway_bill", "gstr1"))
    if missing:
        return _not_evaluated(
            ctx, "R4", "E-way bill value vs GSTR-1", period, missing, "Rule 138 CGST Rules, 2017"
        )

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R4", period=period, legal_basis="Rule 138 CGST Rules, 2017"
    )
    band = ctx.params.get("R4", "band_percent", on=period)
    threshold = ctx.params.get("EWB-02", "state_threshold", on=period)
    tracer.used_parameter(band.use())
    tracer.used_parameter(threshold.use())

    bills = [row for row in ctx.data.ewb if row.period == period and row.status == "ACTIVE"]
    ewb_total = sum((row.value for row in bills), _ZERO)
    for row in bills:
        tracer.evidence(row.prov_id)

    lines = [
        row
        for row in ctx.outward(period)
        if row.section in LIABILITY_SECTIONS
        and (row.taxable_value + row.tax.total) > threshold.decimal
    ]
    g1_total = sum((row.signed_taxable + row.signed_tax.total for row in lines), _ZERO)

    tracer.step(
        "E-way bill value (tax inclusive)",
        "sum(EWB.value) where active",
        {"bills": len(bills)},
        ewb_total,
    )
    tracer.step(
        "GSTR-1 value above the threshold",
        "sum(taxable + tax)",
        {"lines": len(lines), "threshold": threshold.decimal},
        g1_total,
    )

    difference = ewb_total - g1_total
    allowed = (g1_total * band.decimal / _HUNDRED).quantize(Decimal("0.01"))
    within = abs(difference) <= allowed

    tracer.note("ewb_total", ewb_total)
    tracer.note("g1_total", g1_total)
    tracer.note("allowed_band", allowed)

    # R4 is a value identity, not a head-wise one; the delta is carried in the
    # IGST slot purely so that the return type stays uniform, and the note says so.
    trace = tracer.finish(
        result=difference,
        formula_template=R4_TEMPLATE.replace("{band}", format(band.decimal, "f")),
        formula_rendered=f"{ewb_total} - {g1_total} = {difference} (band {allowed})",
    )
    return IdentityResult(
        identity_id="R4",
        title="E-way bill value vs GSTR-1",
        status=IdentityStatus.HOLDS if within else IdentityStatus.BREACHED,
        period=period,
        delta=TaxVector(igst=difference),
        trace=trace,
        note="A value identity, not head-wise: the difference is carried in the first slot.",
        consequence="Movement without a matching declared supply",
    )


# ---------------------------------------------------------------------------
# R5 -- IRN count vs GSTR-1 documents
# ---------------------------------------------------------------------------


def r5(ctx: RuleContext, period: Period) -> IdentityResult:
    """Active IRNs must equal the GSTR-1 B2B and export document count."""
    missing = ctx.missing(("einvoice", "gstr1"))
    if missing:
        return _not_evaluated(
            ctx,
            "R5",
            "IRN count vs GSTR-1 documents",
            period,
            missing,
            "Rule 48(4) CGST Rules, 2017",
        )

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R5", period=period, legal_basis="Rule 48(4) CGST Rules, 2017"
    )
    irns = {
        row.irn for row in ctx.data.einvoices if row.period == period and row.status == "ACTIVE"
    }
    documents = {
        (row.doc_no, row.doc_date)
        for row in ctx.outward(period)
        if row.section in {"B2B", "EXPWP", "EXPWOP", "SEZWP", "SEZWOP", "DEEMED"} and row.doc_no
    }
    difference = Decimal(len(documents) - len(irns))

    tracer.step("active IRNs", "count(distinct IRN where active)", {}, len(irns))
    tracer.step(
        "GSTR-1 B2B and export documents", "count(distinct doc_no, doc_date)", {}, len(documents)
    )
    tracer.note("irn_count", len(irns))
    tracer.note("document_count", len(documents))

    trace = tracer.finish(
        result=difference,
        formula_template="count(GSTR-1 B2B/export documents) - count(active IRNs)",
        formula_rendered=f"{len(documents)} - {len(irns)} = {difference}",
    )
    return IdentityResult(
        identity_id="R5",
        title="Active IRNs vs GSTR-1 documents",
        status=IdentityStatus.HOLDS if difference == 0 else IdentityStatus.BREACHED,
        period=period,
        delta=TaxVector(igst=difference),
        trace=trace,
        note="A count identity, not a money identity.",
        consequence="Manual intervention above the e-invoice threshold",
    )


# ---------------------------------------------------------------------------
# R6 -- RCM liability against RCM credit
# ---------------------------------------------------------------------------


def r6(ctx: RuleContext, period: Period) -> IdentityResult:
    """3B 3.1(d) RCM liability against 3B 4(A)(3) RCM credit.

    Credit taken without the corresponding liability discharged is the breach
    this identity exists to surface.
    """
    missing = ctx.missing(("gstr3b",))
    if missing:
        return _not_evaluated(
            ctx,
            "R6",
            "RCM liability vs RCM credit",
            period,
            missing,
            "s.9(3), s.9(4) CGST Act, 2017",
        )

    ret = ctx.return_3b(period)
    if ret is None:
        return _not_evaluated(ctx, "R6", "RCM liability vs RCM credit", period, ("gstr3b",))

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R6", period=period, legal_basis="s.9(3), s.9(4) CGST Act, 2017"
    )
    liability = ret.rcm_liability
    credit = ret.vector("t4a3") + ret.vector("t4a2")

    tracer.step("RCM liability discharged", "3B[3.1(d)]", {}, liability)
    tracer.step("RCM credit taken", "3B[4(A)(2)] + 3B[4(A)(3)]", {}, credit)

    delta = credit - liability
    tracer.note("liability", liability)
    tracer.note("credit", credit)
    tracer.evidence(ret.prov_id)

    trace = tracer.finish(
        result=delta,
        formula_template="delta(head) = 3B[4(A)(2)+4(A)(3)](head) - 3B[3.1(d)](head)",
        formula_rendered=render_formula(
            "{credit} - {liability} = {delta}",
            {"credit": credit, "liability": liability, "delta": delta},
        ),
    )
    return IdentityResult(
        identity_id="R6",
        title="Reverse charge: liability vs credit",
        status=_status(delta),
        period=period,
        delta=delta,
        trace=trace,
        consequence="Credit taken without the liability being discharged",
    )


# ---------------------------------------------------------------------------
# R7 -- the annual return identities
# ---------------------------------------------------------------------------


def r7(ctx: RuleContext, period: Period | None = None) -> IdentityResult:  # noqa: ARG001
    """GSTR-9 T4/T5 against twelve months of GSTR-1, and T6 against 4(A).

    The annual return is not part of the POC dataset, so this reports
    NOT_EVALUATED naming it rather than implying the year reconciles.
    """
    missing = ctx.missing(("gstr9",))
    return _not_evaluated(
        ctx,
        "R7",
        "GSTR-9 annual reconciliation",
        None,
        missing or ("gstr9",),
        "s.44 CGST Act, 2017; Rule 80",
    )


# ---------------------------------------------------------------------------
# R8 -- the ledger identity
# ---------------------------------------------------------------------------


def r8(ctx: RuleContext, period: Period) -> IdentityResult:
    """closing = opening + credited - debited, per head, per day.

    The cheapest possible data-quality check, and the one that catches an
    injected rupee.
    """
    missing = ctx.missing(("ledgers",))
    if missing:
        return _not_evaluated(
            ctx, "R8", "Ledger identity", period, missing, "s.49 CGST Act, 2017; Rule 86"
        )

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R8", period=period, legal_basis="s.49 CGST Act, 2017; Rule 86"
    )
    tolerance = ctx.params.get("R8", "tolerance", on=period)
    tracer.used_parameter(tolerance.use())

    rows = [row for row in ctx.data.ledgers if row.period == period]
    breaches: dict[str, Decimal] = {}
    for row in rows:
        expected = row.opening + row.credited - row.debited
        difference = row.closing - expected
        if abs(difference) > tolerance.decimal:
            breaches[row.head.lower()] = breaches.get(row.head.lower(), _ZERO) + difference
            tracer.step(
                f"{row.ledger} {row.head} on {row.as_on}",
                "closing - (opening + credited - debited)",
                {
                    "opening": row.opening,
                    "credited": row.credited,
                    "debited": row.debited,
                    "closing": row.closing,
                },
                difference,
            )
        tracer.evidence(row.prov_id)

    delta = TaxVector(
        igst=breaches.get("igst"),
        cgst=breaches.get("cgst"),
        sgst=breaches.get("sgst"),
        cess=breaches.get("cess"),
    )
    tracer.note("rows", len(rows))
    tracer.note("breaches", len(breaches))

    trace = tracer.finish(
        result=delta,
        formula_template="closing(head) = opening(head) + credited(head) - debited(head)",
        formula_rendered=render_formula("delta = {delta}", {"delta": delta}),
    )
    return IdentityResult(
        identity_id="R8",
        title="Ledger identity",
        status=_status(delta, tolerance.decimal),
        period=period,
        delta=delta,
        trace=trace,
        consequence="A ledger that does not balance is a data error or a portal bypass",
    )


# ---------------------------------------------------------------------------
# R9 -- the utilisation order
# ---------------------------------------------------------------------------


def r9(ctx: RuleContext, period: Period) -> IdentityResult:
    """s.49(5), 49A, 49B and Rule 88A: IGST first, and CGST never against SGST.

    Cross-utilisation of CGST against SGST is structurally impossible on the
    portal, so finding it means the figure did not come from the portal.
    """
    missing = ctx.missing(("gstr3b",))
    if missing:
        return _not_evaluated(
            ctx, "R9", "Utilisation order", period, missing, "s.49(5), 49A, 49B CGST Act; Rule 88A"
        )

    ret = ctx.return_3b(period)
    if ret is None:
        return _not_evaluated(ctx, "R9", "Utilisation order", period, ("gstr3b",))

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R9", period=period, legal_basis="s.49(5), 49A, 49B CGST Act; Rule 88A"
    )

    available = ret.itc_net_declared
    used = ret.paid_itc
    breaches: dict[str, Decimal] = {}

    for head in ("igst", "cgst", "sgst", "cess"):
        head_available = getattr(available, head)
        head_used = getattr(used, head)
        if head_used > head_available:
            excess = head_used - head_available
            breaches[head] = excess
            tracer.step(
                f"{head.upper()} utilised beyond the credit available under that head",
                "paid_itc(head) - net_itc_available(head)",
                {"available": head_available, "used": head_used},
                excess,
            )

    delta = TaxVector(
        igst=breaches.get("igst"),
        cgst=breaches.get("cgst"),
        sgst=breaches.get("sgst"),
        cess=breaches.get("cess"),
    )
    tracer.note("available", available)
    tracer.note("used", used)
    tracer.evidence(ret.prov_id)

    trace = tracer.finish(
        result=delta,
        formula_template="paid_itc(head) <= net_itc_available(head), IGST exhausted first",
        formula_rendered=render_formula("excess = {delta}", {"delta": delta}),
    )
    return IdentityResult(
        identity_id="R9",
        title="ITC utilisation order",
        status=_status(delta),
        period=period,
        delta=delta,
        trace=trace,
        consequence="CGST set off against SGST, or IGST left unexhausted",
    )


# ---------------------------------------------------------------------------
# R10 -- interest under Rule 88B
# ---------------------------------------------------------------------------


def r10(ctx: RuleContext, period: Period) -> IdentityResult:
    """Interest at 18% on the net cash liability for a late GSTR-3B.

    Rule 88B(3) interest on wrongly availed *and utilised* credit runs on a
    daily balance and is computed by PAY-03, which has the ledger; this
    identity covers 88B(1).
    """
    missing = ctx.missing(("gstr3b", "filing_status"))
    if missing:
        return _not_evaluated(
            ctx,
            "R10",
            "Interest on a late return",
            period,
            missing,
            "s.50(1) CGST Act; Rule 88B(1)",
        )

    filing = ctx.filings_by_key.get(("GSTR3B", period))
    ret = ctx.return_3b(period)
    if filing is None or ret is None:
        return _not_evaluated(
            ctx,
            "R10",
            "Interest on a late return",
            period,
            ("filing_status",) if filing is None else ("gstr3b",),
        )

    tracer = ctx.tracer(
        CalcKind.IDENTITY, "R10", period=period, legal_basis="s.50(1) CGST Act, 2017; Rule 88B(1)"
    )
    rate = ctx.params.get("PAY-02", "interest_rate", on=period)
    tracer.used_parameter(rate.use())

    days = filing.days_late(as_of=ctx.as_of)
    cash = ret.paid_cash
    year_days = Decimal("365")

    expected_heads: dict[str, Decimal] = {}
    for head in ("igst", "cgst", "sgst", "cess"):
        amount = getattr(cash, head)
        expected_heads[head] = (
            amount * rate.decimal / _HUNDRED * Decimal(days) / year_days
        ).quantize(Decimal("0.01"))

    expected = TaxVector(**expected_heads)
    declared = ret.interest
    delta = expected - declared

    tracer.step("days late", "filing_date - due_date", {"as_of": ctx.as_of}, days)
    tracer.step(
        "interest due", "net cash x 18% x days / 365", {"cash": cash, "days": days}, expected
    )
    tracer.step("interest declared", "3B[5.1]", {}, declared)
    tracer.note("days", days)
    tracer.note("expected", expected)
    tracer.note("declared", declared)

    trace = tracer.finish(
        result=delta,
        formula_template="interest(head) = net_cash(head) x rate/100 x days/365",
        formula_rendered=render_formula(
            "{expected} - {declared} = {delta}",
            {"expected": expected, "declared": declared, "delta": delta},
        ),
    )
    return IdentityResult(
        identity_id="R10",
        title="Interest on a late GSTR-3B",
        status=_status(delta.positive_part()),
        period=period,
        delta=delta,
        trace=trace,
        consequence="Short interest under s.50(1)",
    )


# ---------------------------------------------------------------------------
# R11 -- late fee under s.47
# ---------------------------------------------------------------------------


def r11(ctx: RuleContext, period: Period) -> IdentityResult:
    """Late fee: a daily rate, with turnover-graded caps.

    The caps grid is reference data the spec pack does not state, so the
    identity computes the uncapped fee and says so rather than applying a cap
    it invented.
    """
    missing = ctx.missing(("gstr3b", "filing_status"))
    if missing:
        return _not_evaluated(ctx, "R11", "Late fee", period, missing, "s.47 CGST Act, 2017")

    filing = ctx.filings_by_key.get(("GSTR3B", period))
    ret = ctx.return_3b(period)
    if filing is None or ret is None:
        return _not_evaluated(
            ctx, "R11", "Late fee", period, ("filing_status",) if filing is None else ("gstr3b",)
        )

    tracer = ctx.tracer(CalcKind.IDENTITY, "R11", period=period, legal_basis="s.47 CGST Act, 2017")
    is_nil = ret.payable.is_zero()
    key = "daily_fee_nil" if is_nil else "daily_fee"
    daily = ctx.params.get("PAY-04", key, on=period)
    tracer.used_parameter(daily.use())

    days = filing.days_late(as_of=ctx.as_of)
    # The daily fee is levied per Act -- CGST and SGST separately, halving the
    # headline figure per head.
    per_head = (daily.decimal * Decimal(days) / Decimal(2)).quantize(Decimal("0.01"))
    expected = TaxVector(cgst=per_head, sgst=per_head)
    declared = ret.late_fee
    delta = expected - declared

    tracer.step("days late", "filing_date - due_date", {"as_of": ctx.as_of}, days)
    tracer.step(
        "late fee due, uncapped",
        "daily rate x days, split CGST/SGST",
        {"daily": daily.decimal, "days": days, "nil_return": is_nil},
        expected,
    )
    tracer.note("days", days)
    tracer.note("nil_return", is_nil)
    tracer.note("expected", expected)
    tracer.note("declared", declared)

    trace = tracer.finish(
        result=delta,
        formula_template="late_fee = daily_rate x days_late, split equally between CGST and SGST",
        formula_rendered=render_formula(
            "{expected} - {declared} = {delta}",
            {"expected": expected, "declared": declared, "delta": delta},
        ),
    )
    return IdentityResult(
        identity_id="R11",
        title="Late fee under s.47",
        status=_status(delta.positive_part()),
        period=period,
        delta=delta,
        trace=trace,
        note=(
            "Computed uncapped: the turnover-graded cap grid is not stated in the "
            "spec pack and is not invented here (TODO(statute))."
        ),
        consequence="Short late fee under s.47",
    )


# ---------------------------------------------------------------------------
# registry
# ---------------------------------------------------------------------------

IDENTITIES: Final[dict[str, object]] = {
    "R1": r1,
    "R2": r2,
    "R3": r3,
    "R4": r4,
    "R5": r5,
    "R6": r6,
    "R7": r7,
    "R8": r8,
    "R9": r9,
    "R10": r10,
    "R11": r11,
}


def evaluate_identities(ctx: RuleContext, period: Period) -> list[IdentityResult]:
    """Every identity for one period, in R1..R11 order."""
    results: list[IdentityResult] = []
    for identity_id in ("R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11"):
        function = IDENTITIES[identity_id]
        results.append(function(ctx, period))  # type: ignore[operator]
    return results


def identity_matrix(ctx: RuleContext) -> dict[str, list[IdentityResult]]:
    """The 12 periods x 11 identities matrix the Reconciliation screen renders."""
    return {period.mmyyyy: evaluate_identities(ctx, period) for period in ctx.periods}
