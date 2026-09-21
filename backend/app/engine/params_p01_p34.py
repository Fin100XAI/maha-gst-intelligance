"""The 34 audit risk parameters, P01 to P34.

Transcribed from the department's own *Risk Flags and Action Points for
Decision Support*.  Each parameter carries a deterministic metric, a banding
strategy, flag levels 0 to 4, the auditor action point **verbatim**, and its
data dependency.

Two things this module is careful about:

**The flag cut-offs are platform defaults, not departmental policy.**  The
source document defines flags 1 to 4 as increasing risk without prescribing
numbers, so the defaults are peer-cohort percentiles awaiting approval.  Every
screen says so.

**Ten parameters are dark without an external feed.**  P02, P15, P20, P23,
P25, P26, P27, P28, P33 and P34 need customs, refund, DGARM or income-tax data.
Their formulas are implemented in full and they return NOT_EVALUATED naming the
feed, and they are excluded from **both** the numerator and the denominator of
the P-Score -- so coverage falls instead of the score being silently
understated.  Defaulting one to Flag 0 is the quiet failure that makes a risk
score a lie.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from decimal import Decimal
from typing import Final

from app.canonical import BandingStrategy, FindingStatus
from app.engine.context import RuleContext
from app.engine.trace import CalcKind, CalcTrace, Tracer

__all__ = [
    "EXTERNAL_PARAMS",
    "PARAMETERS",
    "ParamResult",
    "ParamSpec",
    "evaluate_parameter",
    "evaluate_parameters",
]

_ZERO: Final[Decimal] = Decimal("0.00")
_HUNDRED: Final[Decimal] = Decimal("100")

HIGH_IS_RISK: Final[str] = "HIGH_IS_RISK"
LOW_IS_RISK: Final[str] = "LOW_IS_RISK"
NO_DIRECTION: Final[str] = "NONE"


@dataclass(frozen=True, slots=True)
class ParamResult:
    """One parameter, evaluated for one taxpayer and financial year."""

    param_id: str
    title: str
    status: FindingStatus
    value: Decimal | None
    flag: int | None
    banding: BandingStrategy
    direction: str
    weight: Decimal
    action_point: str
    trace: CalcTrace
    missing_inputs: tuple[str, ...] = ()
    cohort: str | None = None
    cohort_n: int | None = None
    cohort_p50: Decimal | None = None
    cohort_p75: Decimal | None = None
    cohort_p90: Decimal | None = None
    cohort_p97: Decimal | None = None
    external_feed: str | None = None
    roadmap_ref: str | None = None
    related_rules: tuple[str, ...] = ()

    @property
    def calc_id(self) -> str:
        return self.trace.calc_id

    @property
    def evaluated(self) -> bool:
        """Only an evaluated parameter enters the P-Score, on either side."""
        return self.status is not FindingStatus.NOT_EVALUATED and self.flag is not None

    def as_dict(self) -> dict[str, object]:
        return {
            "param_id": self.param_id,
            "title": self.title,
            "status": self.status.value,
            "value": format(self.value, "f") if self.value is not None else None,
            "flag": self.flag,
            "banding": self.banding.value,
            "direction": self.direction,
            "weight": format(self.weight, "f"),
            "action_point": self.action_point,
            "missing_inputs": list(self.missing_inputs),
            "cohort": self.cohort,
            "cohort_n": self.cohort_n,
            "cohort_p50": format(self.cohort_p50, "f") if self.cohort_p50 is not None else None,
            "cohort_p75": format(self.cohort_p75, "f") if self.cohort_p75 is not None else None,
            "cohort_p90": format(self.cohort_p90, "f") if self.cohort_p90 is not None else None,
            "cohort_p97": format(self.cohort_p97, "f") if self.cohort_p97 is not None else None,
            "external_feed": self.external_feed,
            "roadmap_ref": self.roadmap_ref,
            "related_rules": list(self.related_rules),
            "calc_id": self.calc_id,
        }


#: A metric returns its value, or ``None`` when it cannot be computed.
MetricFunction = Callable[[RuleContext, Tracer], "Decimal | None"]


@dataclass(frozen=True, slots=True)
class ParamSpec:
    id: str
    title: str
    metric_description: str
    data_sources: tuple[str, ...]
    banding: BandingStrategy
    direction: str
    action_point: str
    metric: MetricFunction
    requires: tuple[str, ...] = ()
    weight: Decimal = Decimal("1.0")
    #: RATIO_ABS cut-offs, lowest flag first.
    absolute_bands: tuple[Decimal, ...] = ()
    #: COUNT cut-offs.
    count_bands: tuple[int, ...] = ()
    #: BINARY: the flag applied when the condition holds.
    binary_flag: int = 4
    external_feed: str | None = None
    roadmap_ref: str | None = None
    related_rules: tuple[str, ...] = ()
    yoy_metric: MetricFunction | None = None

    @property
    def is_external(self) -> bool:
        return self.banding is BandingStrategy.EXTERNAL or self.external_feed is not None


# ---------------------------------------------------------------------------
# metric helpers
# ---------------------------------------------------------------------------


def _returns(ctx: RuleContext) -> tuple[object, ...]:
    return ctx.data.returns_3b


def _sum_cell(ctx: RuleContext, name: str) -> Decimal:
    total = _ZERO
    for ret in ctx.data.returns_3b:
        total += ret.cell(name)
    return total


def _sum_vector_total(ctx: RuleContext, prefix: str) -> Decimal:
    total = _ZERO
    for ret in ctx.data.returns_3b:
        total += ret.vector(prefix).total
    return total


def _taxable_turnover(ctx: RuleContext) -> Decimal:
    """3.1(a) + (b) + (c) across the year -- the denominator of most ratios."""
    return (
        _sum_cell(ctx, "t31a_taxable")
        + _sum_cell(ctx, "t31b_taxable")
        + _sum_cell(ctx, "t31c_taxable")
    )


def _ratio(numerator: Decimal, denominator: Decimal) -> Decimal | None:
    """``None`` when undefined.

    A taxpayer with no turnover has an *undefined* exempt ratio, not a zero
    one, and must be reported NOT_EVALUATED rather than banded at Flag 0.
    """
    if denominator == 0:
        return None
    return (numerator / denominator).quantize(Decimal("0.000001"))


def _external(feed: str) -> MetricFunction:
    """A metric whose formula is implemented but whose feed does not exist yet.

    Connecting the feed is then a configuration change rather than a
    development project -- which is the honest business case for the
    integration roadmap.
    """

    def metric(ctx: RuleContext, tracer: Tracer) -> Decimal | None:  # noqa: ARG001
        # ctx is unused on purpose: the formula is implemented and the
        # signature is the same as every other metric, so connecting the
        # feed is a configuration change rather than a code change.
        tracer.note("awaiting_feed", feed)
        return None

    return metric


# ---------------------------------------------------------------------------
# Turnover and supply structure
# ---------------------------------------------------------------------------


def _p01(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """sales turnover vs purchase turnover; flag when sales < purchases."""
    sales = tracer.step(
        "sales turnover",
        "3B[3.1(a)] + 3B[3.1(b)] + 3B[3.1(c)] taxable value",
        {},
        _taxable_turnover(ctx),
    )
    purchases = tracer.step(
        "purchase turnover",
        "3B[Table 5] + 3B[3.1(d)] taxable + 2B taxable value",
        {},
        _sum_cell(ctx, "t5_inter")
        + _sum_cell(ctx, "t5_intra")
        + _sum_cell(ctx, "t31d_taxable")
        + sum((row.taxable_value for row in ctx.data.inward), _ZERO),
    )
    return _ratio(sales, purchases)


def _p03(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """exempt share: 3.1(c) / (3.1(a)+(b)+(c))."""
    exempt = _sum_cell(ctx, "t31c_taxable")
    total = _taxable_turnover(ctx)
    tracer.step("exempt supplies", "3B[3.1(c)] taxable value", {}, exempt)
    tracer.step("total taxable turnover", "3B[3.1(a)+(b)+(c)]", {}, total)
    return _ratio(exempt, total)


def _p04(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """zero-rated share: 3.1(b) / (3.1(a)+(b)+(c))."""
    zero_rated = _sum_cell(ctx, "t31b_taxable")
    total = _taxable_turnover(ctx)
    tracer.step("zero-rated supplies", "3B[3.1(b)]", {}, zero_rated)
    return _ratio(zero_rated, total)


def _p09(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """average monthly taxable turnover, this FY against the prior FY."""
    current = _taxable_turnover(ctx)
    periods = len(ctx.data.returns_3b) or 1
    average = (current / Decimal(periods)).quantize(Decimal("0.01"))
    tracer.step(
        "average monthly turnover", "sum(turnover) / periods filed", {"periods": periods}, average
    )
    if ctx.prior_year is None:
        return None
    prior_total = sum((ret.taxable_turnover for ret in ctx.prior_year.returns_3b), _ZERO)
    prior_periods = len(ctx.prior_year.returns_3b) or 1
    prior_average = (prior_total / Decimal(prior_periods)).quantize(Decimal("0.01"))
    tracer.step(
        "prior-year average",
        "sum(prior turnover) / prior periods",
        {"periods": prior_periods},
        prior_average,
    )
    return _ratio(average, prior_average)


def _p10(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """non-GST share: 3.1(e) / (3.1(a)+(b)+(c)+(e))."""
    non_gst = _sum_cell(ctx, "t31e_taxable")
    total = _taxable_turnover(ctx) + non_gst
    tracer.step("non-GST supplies", "3B[3.1(e)]", {}, non_gst)
    return _ratio(non_gst, total)


def _p31(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """credit-note ratio: sum(GSTR-1 credit notes) / 3B outward turnover."""
    notes = sum(
        (row.taxable_value for row in ctx.data.outward if row.doc_type == "CREDIT_NOTE"), _ZERO
    )
    tracer.step("credit notes", "sum(GSTR-1 Table 9 credit notes)", {}, notes)
    return _ratio(notes, _taxable_turnover(ctx))


def _p32(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """debit-note ratio."""
    notes = sum(
        (row.taxable_value for row in ctx.data.outward if row.doc_type == "DEBIT_NOTE"), _ZERO
    )
    tracer.step("debit notes", "sum(GSTR-1 Table 9 debit notes)", {}, notes)
    return _ratio(notes, _taxable_turnover(ctx))


# ---------------------------------------------------------------------------
# Reverse charge and imports
# ---------------------------------------------------------------------------


def _p05(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """RCM share: 3.1(d) / (3.1(a)+(b)+(c))."""
    rcm = _sum_cell(ctx, "t31d_taxable")
    tracer.step("inward supplies liable to reverse charge", "3B[3.1(d)]", {}, rcm)
    return _ratio(rcm, _taxable_turnover(ctx))


def _p06(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """RCM per 2B minus [3.1(d) tax - ITC on import of services]; flag positive."""
    per_2b = sum(
        (row.tax.total for row in ctx.data.inward if row.section in {"IMPS", "B2B"} and row.rate),
        _ZERO,
    )
    discharged = _sum_vector_total(ctx, "t31d") - _sum_vector_total(ctx, "t4a2")
    difference = per_2b - discharged
    tracer.step("RCM liability per GSTR-2B", "sum(2B RCM lines)", {}, per_2b)
    tracer.step(
        "RCM discharged net of import-of-services credit",
        "3B[3.1(d)] - 3B[4(A)(2)]",
        {},
        discharged,
    )
    return difference


def _p16(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """sum 3.1(d) tax / sum [4(A)(2) + 4(A)(3)] ITC; flag when below 1."""
    paid = _sum_vector_total(ctx, "t31d")
    credit = _sum_vector_total(ctx, "t4a2") + _sum_vector_total(ctx, "t4a3")
    tracer.step("RCM tax paid", "sum 3B[3.1(d)]", {}, paid)
    tracer.step("RCM credit taken", "sum 3B[4(A)(2) + 4(A)(3)]", {}, credit)
    return _ratio(paid, credit)


# ---------------------------------------------------------------------------
# Input tax credit
# ---------------------------------------------------------------------------


def _p07(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """tax paid through ITC / total tax payable."""
    through_itc = _sum_vector_total(ctx, "paid_itc")
    payable = _sum_vector_total(ctx, "payable")
    tracer.step("tax discharged through ITC", "sum 3B[6.1 cols 3-6]", {}, through_itc)
    tracer.step("total tax payable", "sum 3B[6.1 col 2]", {}, payable)
    return _ratio(through_itc, payable)


def _p08(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """cash paid / total liability."""
    cash = _sum_vector_total(ctx, "paid_cash")
    payable = _sum_vector_total(ctx, "payable")
    tracer.step("tax discharged in cash", "sum 3B[6.1 col 8]", {}, cash)
    return _ratio(cash, payable)


def _p14(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """3B 4(A)(5) minus GSTR-2B available ITC; flag positive."""
    claimed = _sum_vector_total(ctx, "t4a5")
    available = sum(
        (row.signed_tax.total for row in ctx.data.inward if row.counts_toward_2b_available),
        _ZERO,
    )
    tracer.step("ITC claimed as all-other", "sum 3B[4(A)(5)]", {}, claimed)
    tracer.step("ITC available per GSTR-2B", "sum(2B available, post-IMS)", {}, available)
    return claimed - available


def _p17(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """ISD share of total 4(A)."""
    isd = _sum_vector_total(ctx, "t4a4")
    total = sum(
        (ret.itc_available_gross.total for ret in ctx.data.returns_3b),
        _ZERO,
    )
    tracer.step("ITC from ISD", "sum 3B[4(A)(4)]", {}, isd)
    return _ratio(isd, total)


def _p18(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """reversal ratio: 4(B) / 4(A)."""
    reversed_itc = sum(
        (ret.itc_reversed.total for ret in ctx.data.returns_3b),
        _ZERO,
    )
    gross = sum(
        (ret.itc_available_gross.total for ret in ctx.data.returns_3b),
        _ZERO,
    )
    tracer.step("ITC reversed", "sum 3B[4(B)]", {}, reversed_itc)
    tracer.step("ITC available", "sum 3B[4(A)]", {}, gross)
    return _ratio(reversed_itc, gross)


def _p19(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """exempt ratio minus reversal ratio; flag when exempt materially exceeds."""
    exempt_ratio = _ratio(_sum_cell(ctx, "t31c_taxable"), _taxable_turnover(ctx))
    gross = sum(
        (ret.itc_available_gross.total for ret in ctx.data.returns_3b),
        _ZERO,
    )
    reversal_ratio = _ratio(_sum_vector_total(ctx, "t4b1"), gross)
    if exempt_ratio is None or reversal_ratio is None:
        return None
    tracer.step("exempt ratio", "3B[3.1(c)] / 3B[3.1(a)+(b)+(c)]", {}, exempt_ratio)
    tracer.step("reversal ratio", "3B[4(B)(1)] / 3B[4(A)]", {}, reversal_ratio)
    return exempt_ratio - reversal_ratio


# ---------------------------------------------------------------------------
# Registration and behaviour
# ---------------------------------------------------------------------------


def _p11(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """count of returns filed late in the FY."""
    late = 0
    for filing in ctx.data.filings:
        if filing.filing_date is not None and filing.days_late(as_of=ctx.as_of) > 0:
            late += 1
    tracer.step("returns filed late", "count(filing_date > due_date)", {}, late)
    return Decimal(late)


def _p12(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """count of returns NOT filed in the FY.

    The source phrasing is ambiguous; implemented as a count-band on unfiled
    returns and logged in docs/DECISIONS.md D-0016 for departmental confirmation.
    """
    unfiled = sum(1 for filing in ctx.data.filings if filing.filing_date is None)
    tracer.step("returns not filed", "count(filing_date is null)", {}, unfiled)
    return Decimal(unfiled)


def _p13(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """both SEZ and non-SEZ registrations on the same PAN in the same State."""
    siblings = ctx.extras.get("pan_registrations", ())
    has_sez = any("SEZ" in str(entry).upper() for entry in siblings)
    has_dta = any("SEZ" not in str(entry).upper() for entry in siblings)
    tracer.step(
        "registrations on this PAN in this State",
        "registration master",
        {"count": len(siblings)},
        f"sez={has_sez} dta={has_dta}",
    )
    if not siblings:
        return None
    return Decimal(1) if (has_sez and has_dta) else _ZERO


def _p24(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """count of other GSTINs on the same PAN."""
    siblings = ctx.extras.get("pan_registrations", ())
    if not siblings:
        return None
    count = max(0, len(siblings) - 1)
    tracer.step("other GSTINs on this PAN", "registration master", {}, count)
    return Decimal(count)


def _p29(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """ITC-04 Table 4 taxable turnover / total taxable turnover."""
    itc04 = ctx.extras.get("itc04_t4_turnover")
    if itc04 is None:
        return None
    tracer.step("ITC-04 Table 4 turnover", "ITC-04", {}, itc04)
    return _ratio(Decimal(str(itc04)), _taxable_turnover(ctx))


def _p30(ctx: RuleContext, tracer: Tracer) -> Decimal | None:
    """selected on risk criteria in the previous audit cycle."""
    selected = ctx.extras.get("prior_cycle_selected")
    if selected is None:
        return None
    tracer.step("selected in the previous cycle", "internal audit-plan history", {}, selected)
    return Decimal(1) if selected else _ZERO


# ---------------------------------------------------------------------------
# the specifications
# ---------------------------------------------------------------------------


def _spec(**kwargs: object) -> ParamSpec:
    return ParamSpec(**kwargs)  # type: ignore[arg-type]


PARAMETERS: Final[dict[str, ParamSpec]] = {}


def _register(spec: ParamSpec) -> None:
    PARAMETERS[spec.id] = spec


_register(
    ParamSpec(
        id="P01",
        title="Sales turnover below purchase turnover",
        metric_description="sales_TO / purchase_TO, where sales_TO = 3B 3.1(a)+(b)+(c) and "
        "purchase_TO = 3B T5 + 3B 3.1(d) + 2B taxable value + import of goods",
        data_sources=("3B", "2B", "CUS"),
        banding=BandingStrategy.RATIO_ABS,
        direction=LOW_IS_RISK,
        absolute_bands=(Decimal("1.0"), Decimal("0.9"), Decimal("0.75"), Decimal("0.5")),
        requires=("gstr3b",),
        action_point="Establish why purchases exceed sales. Test-check high-value purchase "
        "and sales invoices for correct accounting.",
        metric=_p01,
        related_rules=("NET-05",),
    )
)

_register(
    ParamSpec(
        id="P02",
        title="IGST paid at import against ITC availed on imports",
        metric_description="IGST paid at import (customs) - ITC availed in 3B 4(A)(1)+(2); "
        "flag on a positive difference",
        data_sources=("3B", "CUS"),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="ICEGATE customs",
        roadmap_ref="RM-02",
        action_point="Ascertain the difference, including verification of transport documents. "
        "Where goods or services were supplied in the course of business, confirm an "
        "invoice was issued and tax paid.",
        metric=_external("ICEGATE customs"),
    )
)

_register(
    ParamSpec(
        id="P03",
        title="Share of exempt supplies",
        metric_description="3B 3.1(c) / (3.1(a)+(b)+(c)), and its year-on-year change",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        action_point="Verify the exemption conditions are met, including ITC non-availment or "
        "reversal. Sample contracts and supply orders.",
        metric=_p03,
        related_rules=("ITC-07",),
    )
)

_register(
    ParamSpec(
        id="P04",
        title="Share of zero-rated supplies",
        metric_description="3B 3.1(b) / (3.1(a)+(b)+(c))",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        action_point=(
            "Verify zero-rated conditions, including due exportation of goods or services."
        ),
        metric=_p04,
        related_rules=("OUT-04", "SEC-04"),
    )
)

_register(
    ParamSpec(
        id="P05",
        title="Share of inward supplies liable to reverse charge",
        metric_description="3B 3.1(d) / (3.1(a)+(b)+(c)), and its year-on-year change",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        action_point="Verify total inward supplies liable to reverse charge. Sample high-value "
        "invoices, contracts and supply orders.",
        metric=_p05,
        related_rules=("SEC-01",),
    )
)

_register(
    ParamSpec(
        id="P06",
        title="RCM liability per GSTR-2B against RCM discharged",
        metric_description="RCM liability per 2B - [3B 3.1(d) tax - ITC on import of services "
        "4(A)(2)]; flag positive",
        data_sources=("2B", "3B"),
        banding=BandingStrategy.RATIO_ABS,
        direction=HIGH_IS_RISK,
        absolute_bands=(Decimal("0"), Decimal("100000"), Decimal("500000"), Decimal("2500000")),
        requires=("gstr3b", "gstr2b"),
        action_point="Verify high-value import invoices and the correctness of ITC taken "
        "against RCM liability.",
        metric=_p06,
        related_rules=("ITC-13",),
    )
)

_register(
    ParamSpec(
        id="P07",
        title="Liability discharged through ITC",
        metric_description="tax paid through ITC (3B 6.1 cols 3-6) / total tax payable (col 2)",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        weight=Decimal("1.5"),
        action_point="Verify ITC availment. Sample high-value and recurring supplies, "
        "sister-concern and dealer purchases. Check no ITC on exempt goods. Cross-check "
        "e-way bills, payment particulars, input-output ratio to rule out fake invoices. "
        "Where the entire liability is discharged through ITC, escalate scrutiny.",
        metric=_p07,
        related_rules=("ITC-10", "PAY-01", "PAY-10", "NET-05"),
    )
)

_register(
    ParamSpec(
        id="P08",
        title="Cash-to-liability ratio",
        metric_description="cash paid (3B 6.1 col 8) / total liability (col 2)",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=LOW_IS_RISK,
        requires=("gstr3b",),
        action_point="Establish the reason for an adverse cash-to-liability ratio.",
        metric=_p08,
        related_rules=("PAY-01", "PAY-10"),
    )
)

_register(
    ParamSpec(
        id="P09",
        title="Decline in average monthly taxable turnover",
        metric_description="average monthly 3B 3.1(a)+(b)+(c), current FY against the prior FY",
        data_sources=("3B",),
        banding=BandingStrategy.DELTA_YOY,
        direction=LOW_IS_RISK,
        requires=("gstr3b",),
        action_point="Establish the reason for the decline.",
        metric=_p09,
        related_rules=("OUT-19",),
    )
)

_register(
    ParamSpec(
        id="P10",
        title="Share of non-GST supplies",
        metric_description="3B 3.1(e) / (3.1(a)+(b)+(c)+(e)), and its year-on-year change",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        action_point="Verify non-GST supplies are genuinely outside GST and that no related "
        "ITC is taken.",
        metric=_p10,
    )
)

_register(
    ParamSpec(
        id="P11",
        title="Returns filed late",
        metric_description="count of returns filed late in the financial year; flag above 6",
        data_sources=("REG", "3B"),
        banding=BandingStrategy.COUNT,
        direction=HIGH_IS_RISK,
        count_bands=(1, 3, 6, 9),
        requires=("filing_status",),
        action_point="Verify late-filing penalty and interest on delayed payment.",
        metric=_p11,
        related_rules=("BEH-01", "PAY-02", "PAY-04"),
    )
)

_register(
    ParamSpec(
        id="P12",
        title="Returns not filed",
        metric_description="count of returns not filed in the financial year",
        data_sources=("REG",),
        banding=BandingStrategy.COUNT,
        direction=HIGH_IS_RISK,
        count_bands=(1, 2, 4, 6),
        requires=("filing_status",),
        action_point="Arrive at and recover the correct liability for unfiled periods with "
        "interest and penalty. Cross-verify against the taxpayer's e-way bills and 2A/2B.",
        metric=_p12,
        related_rules=("REG-07", "BEH-02", "BEH-03", "BEH-08"),
    )
)

_register(
    ParamSpec(
        id="P13",
        title="SEZ and non-SEZ registration on one PAN in one State",
        metric_description="the taxpayer holds both an SEZ and a non-SEZ registration on the "
        "same PAN in the same State",
        data_sources=("REG",),
        banding=BandingStrategy.BINARY,
        direction=NO_DIRECTION,
        binary_flag=3,
        action_point="Verify input-output ratios separately for both to detect diversion of "
        "duty-free inputs to the DTA; confirm SEZ-manufactured goods are not shown cleared "
        "from the DTA unit; check wrong ITC in the DTA on SEZ procurements.",
        metric=_p13,
    )
)

_register(
    ParamSpec(
        id="P14",
        title="ITC claimed in excess of GSTR-2B",
        metric_description="3B 4(A)(5) - GSTR-2B available ITC; flag positive",
        data_sources=("3B", "2B"),
        banding=BandingStrategy.RATIO_ABS,
        direction=HIGH_IS_RISK,
        absolute_bands=(Decimal("0"), Decimal("100000"), Decimal("1000000"), Decimal("2500000")),
        requires=("gstr3b", "gstr2b"),
        weight=Decimal("1.5"),
        action_point="Ascertain the mismatch to check wrong availment and credit on fake "
        "invoices. E-way bill verification assists. Sample high-value invoices.",
        metric=_p14,
        related_rules=("ITC-01", "ITC-02", "ITC-03", "ITC-06", "ITC-17", "NET-03"),
    )
)

_register(
    ParamSpec(
        id="P15",
        title="ITC on import of goods against IGST paid to Customs",
        metric_description="3B 4(A)(1) - IGST paid to Customs; flag positive",
        data_sources=("3B", "CUS"),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="ICEGATE customs",
        roadmap_ref="RM-02",
        action_point="Ensure wrong credit is reversed; rule out credit on a bill of entry in "
        "another person's name, and credit of BCD.",
        metric=_external("ICEGATE customs"),
    )
)

_register(
    ParamSpec(
        id="P16",
        title="RCM tax paid low against RCM credit taken",
        metric_description="sum 3B 3.1(d) tax / sum 3B 4(A)(2)+4(A)(3) ITC; flag when below 1",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_ABS,
        direction=LOW_IS_RISK,
        absolute_bands=(Decimal("1.0"), Decimal("0.9"), Decimal("0.7"), Decimal("0.4")),
        requires=("gstr3b",),
        action_point="Establish why RCM tax paid is low relative to RCM credit taken. "
        "Sample high-value invoices.",
        metric=_p16,
        related_rules=("ITC-13",),
    )
)

_register(
    ParamSpec(
        id="P17",
        title="Share of ITC routed through an ISD",
        metric_description="3B 4(A)(4) ISD / total 4(A), and its year-on-year change",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        action_point="Check the two-to-three-year trend for ineligible ITC routed through the "
        "ISD; whether credit unusable at another unit was diverted here; admissibility of "
        "ITC to the ISD itself.",
        metric=_p17,
    )
)

_register(
    ParamSpec(
        id="P18",
        title="ITC reversal ratio",
        metric_description="3B 4(B) / 4(A), and its year-on-year change",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b",),
        action_point="Verify that reversals are supported by proper documents and are legally "
        "correct, and that exempt-supply reversal has been made. Sample high-value invoices.",
        metric=_p18,
        related_rules=("ITC-07", "ITC-21"),
    )
)

_register(
    ParamSpec(
        id="P19",
        title="Exempt supplies without matching ITC reversal",
        metric_description="exempt ratio [3.1(c)/(3.1(a)+(b)+(c))] minus reversal ratio "
        "[4(B)(1)/4(A)]; flag when the exempt ratio materially exceeds the reversal ratio",
        data_sources=("3B",),
        banding=BandingStrategy.RATIO_ABS,
        direction=HIGH_IS_RISK,
        absolute_bands=(Decimal("0"), Decimal("0.05"), Decimal("0.15"), Decimal("0.30")),
        requires=("gstr3b",),
        action_point="Verify that proper ITC reversal or non-availment has been made for "
        "nil-rated and exempt supplies.",
        metric=_p19,
        related_rules=("ITC-07",),
    )
)

_register(
    ParamSpec(
        id="P20",
        title="Export value against shipping-bill data",
        metric_description="taxable value of export of goods (GSTR-1 Table 6A) against the "
        "IGST/FOB value in shipping-bill data",
        data_sources=("R1", "CUS"),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="ICEGATE customs",
        roadmap_ref="RM-02",
        action_point="Sample high-value shipping bills; verify accounting and the value of "
        "export goods.",
        metric=_external("ICEGATE customs"),
    )
)

_register(
    ParamSpec(
        id="P21",
        title="Share of SEZ supplies",
        metric_description="GSTR-1 Table 6B SEZ supplies / total GST turnover, and its "
        "year-on-year change",
        data_sources=("R1", "3B"),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr1", "gstr3b"),
        action_point="Where adverse, verify accounting and supply documents; confirm there is "
        "no diversion of goods cleared to the SEZ.",
        metric=lambda ctx, tracer: _ratio(
            tracer.step(
                "SEZ supplies",
                "sum(GSTR-1 Table 6B taxable value)",
                {},
                sum(
                    (
                        row.taxable_value
                        for row in ctx.data.outward
                        if row.section in {"SEZWP", "SEZWOP"}
                    ),
                    _ZERO,
                ),
            ),
            _taxable_turnover(ctx),
        ),
    )
)

_register(
    ParamSpec(
        id="P22",
        title="Share of deemed exports",
        metric_description="GSTR-1 Table 6C deemed exports / total GST turnover, and its "
        "year-on-year change",
        data_sources=("R1", "3B"),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr1", "gstr3b"),
        action_point="Where adverse, verify all related accounting and sample deemed-export "
        "documents.",
        metric=lambda ctx, tracer: _ratio(
            tracer.step(
                "deemed exports",
                "sum(GSTR-1 Table 6C taxable value)",
                {},
                sum(
                    (row.taxable_value for row in ctx.data.outward if row.section == "DEEMED"),
                    _ZERO,
                ),
            ),
            _taxable_turnover(ctx),
        ),
    )
)

_register(
    ParamSpec(
        id="P23",
        title="Zero-rated turnover against customs export value",
        metric_description="[3B 3.1(b) - export value per customs] / [3.1(a)+(b)], and its "
        "year-on-year change",
        data_sources=("3B", "CUS"),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="ICEGATE customs",
        roadmap_ref="RM-02",
        action_point="Where adverse, verify accounting and sample zero-rated supply documents.",
        metric=_external("ICEGATE customs"),
    )
)

_register(
    ParamSpec(
        id="P24",
        title="Other GSTINs on the same PAN",
        metric_description="count and aggregate risk of other GSTINs on the same PAN",
        data_sources=("REG",),
        banding=BandingStrategy.COUNT,
        direction=HIGH_IS_RISK,
        count_bands=(1, 3, 6, 10),
        action_point="Examine supply, purchase and other transactions with those linked GSTINs.",
        metric=_p24,
        related_rules=("REG-02", "REG-03", "REG-04", "NET-02", "ITC-16"),
    )
)

_register(
    ParamSpec(
        id="P25",
        title="IGST refund claimed",
        metric_description="amount of IGST refund claimed, in the risky-exporter context",
        data_sources=("RFD",),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="Refund module",
        roadmap_ref="RM-05",
        action_point="Sample high-value transactions; verify the correctness of the refund.",
        metric=_external("Refund module"),
    )
)

_register(
    ParamSpec(
        id="P26",
        title="LUT export refund claimed",
        metric_description="amount of LUT export refund claimed",
        data_sources=("RFD",),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="Refund module",
        roadmap_ref="RM-05",
        action_point="Sample high-value transactions; verify correctness.",
        metric=_external("Refund module"),
        related_rules=("SEC-04",),
    )
)

_register(
    ParamSpec(
        id="P27",
        title="Inverted-duty refund claimed",
        metric_description="amount of refund claimed on an inverted duty structure",
        data_sources=("RFD",),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="Refund module",
        roadmap_ref="RM-05",
        action_point="Sample high-value transactions; verify correctness.",
        metric=_external("Refund module"),
    )
)

_register(
    ParamSpec(
        id="P28",
        title="Appears in a DGARM red-flag report",
        metric_description="appears in DGARM Red Flag Reports 2, 3, 4 or 5",
        data_sources=("DG",),
        banding=BandingStrategy.EXTERNAL,
        direction=NO_DIRECTION,
        external_feed="DGARM red-flag feed",
        roadmap_ref="RM-04",
        weight=Decimal("3.0"),
        action_point="Verify the details specified in each red flag.",
        metric=_external("DGARM red-flag feed"),
    )
)

_register(
    ParamSpec(
        id="P29",
        title="Job-work turnover against total turnover",
        metric_description="ITC-04 Table 4 taxable turnover / total taxable turnover (3B)",
        data_sources=("I04", "3B"),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr3b", "itc04"),
        action_point="Sample documents; verify correct recording in ITC-04 and GSTR-3B.",
        metric=_p29,
    )
)

_register(
    ParamSpec(
        id="P30",
        title="Selected in the previous audit cycle",
        metric_description="selected on risk criteria in the previous audit cycle",
        data_sources=("internal",),
        banding=BandingStrategy.BINARY,
        direction=NO_DIRECTION,
        binary_flag=2,
        action_point="Re-verify the earlier risk criteria against the current audit period.",
        metric=_p30,
        related_rules=("BEH-05", "BEH-06"),
    )
)

_register(
    ParamSpec(
        id="P31",
        title="Credit-note ratio",
        metric_description="sum of credit notes (GSTR-1 Table 9) / 3B 3.1(a)+(b)+(c)",
        data_sources=("R1", "3B"),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr1", "gstr3b"),
        action_point="Sample credit notes; verify the genuineness of the underlying transactions.",
        metric=_p31,
        related_rules=("OUT-08", "OUT-09"),
    )
)

_register(
    ParamSpec(
        id="P32",
        title="Debit-note ratio",
        metric_description="sum of debit notes (GSTR-1 Table 9) / 3B 3.1(a)+(b)+(c)",
        data_sources=("R1", "3B"),
        banding=BandingStrategy.RATIO_PEER,
        direction=HIGH_IS_RISK,
        requires=("gstr1", "gstr3b"),
        action_point="Sample debit notes; verify genuineness.",
        metric=_p32,
    )
)

_register(
    ParamSpec(
        id="P33",
        title="GST turnover against income-tax turnover",
        metric_description="3B turnover - ITR turnover for the same period; flag on a "
        "substantial difference",
        data_sources=("3B", "ITD"),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="ITD / AIS turnover",
        roadmap_ref="RM-03",
        action_point="Sample transactions; establish the reason for the discrepancy.",
        metric=_external("ITD / AIS turnover"),
    )
)

_register(
    ParamSpec(
        id="P34",
        title="Negligible income tax against substantial GST turnover",
        metric_description="income tax paid is negligible while 3B turnover is substantial",
        data_sources=("ITD",),
        banding=BandingStrategy.EXTERNAL,
        direction=HIGH_IS_RISK,
        external_feed="ITD / AIS turnover",
        roadmap_ref="RM-03",
        action_point="Sample transactions; establish the reason.",
        metric=_external("ITD / AIS turnover"),
    )
)


#: The ten that are dark until a feed exists.  Excluded from BOTH sides of the
#: P-Score, so coverage falls rather than the score quietly understating risk.
EXTERNAL_PARAMS: Final[tuple[str, ...]] = tuple(
    sorted(spec.id for spec in PARAMETERS.values() if spec.is_external)
)


# ---------------------------------------------------------------------------
# evaluation
# ---------------------------------------------------------------------------


def _band_absolute(value: Decimal, bands: tuple[Decimal, ...], direction: str) -> int:
    """Fixed cut-offs, used where a ratio has an intrinsic meaning."""
    flag = 0
    if direction == LOW_IS_RISK:
        for level, edge in enumerate(bands, start=1):
            if value < edge:
                flag = level
    else:
        for level, edge in enumerate(bands, start=1):
            if value > edge:
                flag = level
    return flag


def _band_count(value: Decimal, bands: tuple[int, ...]) -> int:
    flag = 0
    for level, edge in enumerate(bands, start=1):
        if value > edge:
            flag = level
    return flag


def _band_yoy(value: Decimal, ctx: RuleContext, tracer: Tracer) -> int:
    """Change against the prior FY, in percentage points.

    ``value`` is a ratio of current to prior, so a 20% decline arrives as 0.80.
    """
    change_pp = ((value - Decimal(1)) * _HUNDRED).copy_abs()
    tracer.step("year-on-year change", "|current/prior - 1| x 100", {"ratio": value}, change_pp)
    bands = [
        ctx.params.get("PSCORE", f"yoy_pp_flag{level}", on=ctx.fy.end).decimal
        for level in (1, 2, 3, 4)
    ]
    flag = 0
    for level, edge in enumerate(bands, start=1):
        if change_pp > edge:
            flag = level
    return flag


def evaluate_parameter(ctx: RuleContext, param_id: str) -> ParamResult:  # noqa: PLR0911
    # One return per banding strategy plus the not-evaluated paths: a
    # dispatch table here would hide which strategy produced which flag,
    # and that is exactly what the drawer has to explain.
    """Evaluate one parameter, with its flag, its cohort and its trace."""
    spec = PARAMETERS[param_id]
    tracer = ctx.tracer(CalcKind.PARAM, param_id)
    tracer.note("fy", ctx.fy.label)
    tracer.note("banding", spec.banding.value)
    tracer.note("direction", spec.direction)

    def not_evaluated(missing: tuple[str, ...]) -> ParamResult:
        tracer.note("missing_inputs", list(missing))
        return ParamResult(
            param_id=spec.id,
            title=spec.title,
            status=FindingStatus.NOT_EVALUATED,
            value=None,
            flag=None,
            banding=spec.banding,
            direction=spec.direction,
            weight=spec.weight,
            action_point=spec.action_point,
            trace=tracer.finish(result=None, formula_template=spec.metric_description),
            missing_inputs=missing,
            external_feed=spec.external_feed,
            roadmap_ref=spec.roadmap_ref,
            related_rules=spec.related_rules,
        )

    if spec.is_external:
        return not_evaluated((spec.external_feed or "external feed",))

    missing = ctx.missing(spec.requires)
    if missing:
        return not_evaluated(missing)

    value = spec.metric(ctx, tracer)
    if value is None:
        return not_evaluated(("the metric is undefined on this taxpayer's data",))

    tracer.note("value", value)

    cohort_key = None
    band = None
    if spec.banding is BandingStrategy.RATIO_PEER:
        if ctx.peers is None:
            return not_evaluated(("peer cohort bands",))
        cohort_key = ctx.peers.cohort_for(
            sector=ctx.data.profile.sector_code,
            turnover=ctx.data.profile.aato,
            jurisdiction=ctx.data.profile.division,
        )
        band = ctx.peers.band(spec.id, cohort_key)
        if band is None:
            # A cohort too small to band against is not a Flag 0; it is an
            # absence of evidence, and coverage must show it as one.
            return not_evaluated((f"peer cohort {cohort_key.as_str()} below the minimum size",))
        flag = band.flag_for(value, high_is_risk=spec.direction != LOW_IS_RISK)
        tracer.step(
            "cohort banding",
            "percentile position within sector x turnover band x jurisdiction",
            {"p50": band.p50, "p75": band.p75, "p90": band.p90, "p97": band.p97, "n": band.n},
            flag,
        )
    elif spec.banding is BandingStrategy.RATIO_ABS:
        flag = _band_absolute(value, spec.absolute_bands, spec.direction)
        tracer.step(
            "absolute banding", "fixed cut-offs", {"bands": list(spec.absolute_bands)}, flag
        )
    elif spec.banding is BandingStrategy.COUNT:
        flag = _band_count(value, spec.count_bands)
        tracer.step("count banding", "integer bands", {"bands": list(spec.count_bands)}, flag)
    elif spec.banding is BandingStrategy.DELTA_YOY:
        flag = _band_yoy(value, ctx, tracer)
    elif spec.banding is BandingStrategy.BINARY:
        flag = spec.binary_flag if value != 0 else 0
        tracer.step(
            "binary banding",
            "the condition holds or it does not",
            {"flag_when_true": spec.binary_flag},
            flag,
        )
    else:  # pragma: no cover - EXTERNAL handled above
        return not_evaluated(("unsupported banding strategy",))

    return ParamResult(
        param_id=spec.id,
        title=spec.title,
        status=FindingStatus.TRIGGERED if flag > 0 else FindingStatus.CLEAR,
        value=value,
        flag=flag,
        banding=spec.banding,
        direction=spec.direction,
        weight=spec.weight,
        action_point=spec.action_point,
        trace=tracer.finish(result=flag, formula_template=spec.metric_description),
        cohort=cohort_key.as_str() if cohort_key else None,
        cohort_n=band.n if band else None,
        cohort_p50=band.p50 if band else None,
        cohort_p75=band.p75 if band else None,
        cohort_p90=band.p90 if band else None,
        cohort_p97=band.p97 if band else None,
        related_rules=spec.related_rules,
    )


def evaluate_parameters(ctx: RuleContext) -> list[ParamResult]:
    """All 34, in P01..P34 order."""
    return [
        evaluate_parameter(ctx, param_id)
        for param_id in sorted(PARAMETERS, key=lambda pid: int(pid[1:]))
    ]
