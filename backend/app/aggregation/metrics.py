"""The metrics catalogue -- docs/02 section 7.

Every number the dashboard shows is defined here, once, with its formula and
its grain.  There is exactly one definition site per metric: if `report`,
`decide`, `gate` and the HTML export each computed the composite their own way,
they would disagree eventually, and the disagreement would surface as a
procurement decision rather than as a test failure.

Every metric is drillable.  ``drill_dimension`` names the column the taxpayer
list behind a chart element is filtered on, and a metric without one fails
:func:`assert_every_metric_drills`.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Final

__all__ = ["METRICS", "MetricGroup", "MetricSpec", "assert_every_metric_drills", "metric"]


class MetricGroup(StrEnum):
    FILING = "FILING"
    REVENUE = "REVENUE"
    RISK = "RISK"
    ENFORCEMENT = "ENFORCEMENT"
    QUALITY = "QUALITY"


class Unit(StrEnum):
    COUNT = "count"
    RATIO = "ratio"
    PERCENT = "percent"
    MONEY = "money"
    DAYS = "days"
    MONTHS = "months"


@dataclass(frozen=True, slots=True)
class MetricSpec:
    """One reported number: what it is, how it is computed, and how to drill it."""

    id: str
    title: str
    group: MetricGroup
    formula: str
    grain: str
    unit: Unit
    #: The fact table this reads.  Named so that a reviewer can check that two
    #: metrics claiming the same thing read the same place.
    source: str
    #: What the taxpayer list behind a chart element is filtered on.
    drill_dimension: str
    #: Head-wise metrics are never collapsed into one scalar on a chart.
    head_wise: bool = False
    note: str | None = None

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "title": self.title,
            "group": self.group.value,
            "formula": self.formula,
            "grain": self.grain,
            "unit": self.unit.value,
            "source": self.source,
            "drill_dimension": self.drill_dimension,
            "head_wise": self.head_wise,
            "note": self.note,
        }


def _m(**kwargs: object) -> MetricSpec:
    return MetricSpec(**kwargs)  # type: ignore[arg-type]


_CATALOGUE: Final[tuple[MetricSpec, ...]] = (
    # -- filing compliance --------------------------------------------------
    _m(
        id="M-F01",
        title="Filing compliance rate",
        group=MetricGroup.FILING,
        formula="filed / expected",
        grain="jurisdiction x period x return type",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="filing_status",
    ),
    _m(
        id="M-F02",
        title="On-time filing rate",
        group=MetricGroup.FILING,
        formula="on_time / filed",
        grain="jurisdiction x period x return type",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="filing_status",
    ),
    _m(
        id="M-F03",
        title="Mean filing delay",
        group=MetricGroup.FILING,
        formula="sum(days_late) / filed",
        grain="jurisdiction x period",
        unit=Unit.DAYS,
        source="fact_filing_period",
        drill_dimension="days_late",
    ),
    _m(
        id="M-F04",
        title="Non-filer share",
        group=MetricGroup.FILING,
        formula="not_filed / expected",
        grain="jurisdiction x period",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="filing_status",
    ),
    _m(
        id="M-F05",
        title="Nil-filer share",
        group=MetricGroup.FILING,
        formula="nil / filed",
        grain="jurisdiction x period",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="filing_status",
    ),
    _m(
        id="M-F06",
        title="Periods approaching the three-year bar",
        group=MetricGroup.FILING,
        formula="count(days_to_bar < 180)",
        grain="jurisdiction",
        unit=Unit.COUNT,
        source="fact_filing_period",
        drill_dimension="bar_bucket",
        note="The most defensible ROI story the platform has.",
    ),
    _m(
        id="M-F07",
        title="Periods already barred",
        group=MetricGroup.FILING,
        formula="count(days_to_bar < 0)",
        grain="jurisdiction",
        unit=Unit.COUNT,
        source="fact_filing_period",
        drill_dimension="bar_bucket",
    ),
    _m(
        id="M-F08",
        title="Sequential-filing violations",
        group=MetricGroup.FILING,
        formula="count(BEH-02 triggered)",
        grain="jurisdiction",
        unit=Unit.COUNT,
        source="finding",
        drill_dimension="rule_id",
    ),
    _m(
        id="M-F09",
        title="Annual return compliance",
        group=MetricGroup.FILING,
        formula="GSTR-9 filed / GSTR-9 liable",
        grain="jurisdiction x fy",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="filing_status",
    ),
    # -- revenue and liability ---------------------------------------------
    _m(
        id="M-R01",
        title="Declared turnover",
        group=MetricGroup.REVENUE,
        formula="sum(3B 3.1(a)+(b)+(c)+(e) taxable value)",
        grain="jurisdiction x period",
        unit=Unit.MONEY,
        source="fact_filing_period",
        drill_dimension="turnover_band",
    ),
    _m(
        id="M-R02",
        title="Gross liability",
        group=MetricGroup.REVENUE,
        formula="sum(3B 6.1 col 2), head-wise",
        grain="jurisdiction x period",
        unit=Unit.MONEY,
        source="fact_filing_period",
        drill_dimension="turnover_band",
        head_wise=True,
    ),
    _m(
        id="M-R03",
        title="Cash-to-liability ratio",
        group=MetricGroup.REVENUE,
        formula="sum(cash paid) / sum(liability)",
        grain="jurisdiction x period",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="cash_ratio_band",
        note="The department's single most watched number.",
    ),
    _m(
        id="M-R04",
        title="ITC utilisation ratio",
        group=MetricGroup.REVENUE,
        formula="sum(ITC utilised) / sum(liability)",
        grain="jurisdiction x period",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="itc_ratio_band",
    ),
    _m(
        id="M-R05",
        title="ITC-to-turnover ratio",
        group=MetricGroup.REVENUE,
        formula="sum(3B 4(A)) / sum(turnover)",
        grain="jurisdiction x period",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="itc_ratio_band",
    ),
    _m(
        id="M-R06",
        title="Net revenue growth",
        group=MetricGroup.REVENUE,
        formula="year-on-year change in M-R02",
        grain="jurisdiction x fy",
        unit=Unit.PERCENT,
        source="fact_filing_period",
        drill_dimension="turnover_band",
    ),
    _m(
        id="M-R07",
        title="Credit-ledger overhang",
        group=MetricGroup.REVENUE,
        formula="sum(closing credit) / mean monthly liability",
        grain="jurisdiction",
        unit=Unit.MONTHS,
        source="fact_filing_period",
        drill_dimension="overhang_band",
    ),
    _m(
        id="M-R08",
        title="Effective tax rate",
        group=MetricGroup.REVENUE,
        formula="sum(output tax) / sum(taxable value)",
        grain="jurisdiction x period",
        unit=Unit.PERCENT,
        source="fact_filing_period",
        drill_dimension="sector",
        note="Chart this across 22 September 2025 with the GST 2.0 boundary marked, "
        "or every reader will misinterpret the step.",
    ),
    _m(
        id="M-R09",
        title="Exempt, zero-rated and non-GST share",
        group=MetricGroup.REVENUE,
        formula="each as a share of turnover",
        grain="jurisdiction x period",
        unit=Unit.RATIO,
        source="fact_filing_period",
        drill_dimension="supply_type",
    ),
    # -- risk ---------------------------------------------------------------
    _m(
        id="M-K01",
        title="P-Score distribution",
        group=MetricGroup.RISK,
        formula="taxpayer count by P-band",
        grain="jurisdiction x fy x band",
        unit=Unit.COUNT,
        source="fact_risk_snapshot",
        drill_dimension="p_band",
    ),
    _m(
        id="M-K02",
        title="Mean P-coverage",
        group=MetricGroup.RISK,
        formula="sum(evaluated parameters) / (34 x taxpayers)",
        grain="jurisdiction x fy",
        unit=Unit.RATIO,
        source="fact_risk_snapshot",
        drill_dimension="p_band",
        note="Rendered adjacent to the score, at the same visual weight, always.",
    ),
    _m(
        id="M-K03",
        title="Flag incidence by parameter",
        group=MetricGroup.RISK,
        formula="taxpayer count by (param_id, flag)",
        grain="jurisdiction x fy x param x flag",
        unit=Unit.COUNT,
        source="fact_param_incidence",
        drill_dimension="param_flag",
    ),
    _m(
        id="M-K04",
        title="F-Score distribution",
        group=MetricGroup.RISK,
        formula="taxpayer count by F-band",
        grain="jurisdiction x fy x band",
        unit=Unit.COUNT,
        source="fact_risk_snapshot",
        drill_dimension="f_band",
    ),
    _m(
        id="M-K05",
        title="Revenue at risk",
        group=MetricGroup.RISK,
        formula="sum(finding tax effect) where confidence in (CERTAIN, STRONG)",
        grain="jurisdiction x fy",
        unit=Unit.MONEY,
        source="fact_risk_snapshot",
        drill_dimension="confidence",
        head_wise=True,
        note="ADVISORY findings are excluded: they would not survive a reply.",
    ),
    _m(
        id="M-K06",
        title="Findings by family",
        group=MetricGroup.RISK,
        formula="count and value by rule family",
        grain="jurisdiction x fy x family",
        unit=Unit.COUNT,
        source="fact_risk_snapshot",
        drill_dimension="family",
    ),
    _m(
        id="M-K07",
        title="Severe and High share",
        group=MetricGroup.RISK,
        formula="(SEVERE + HIGH) / taxpayers",
        grain="jurisdiction x fy",
        unit=Unit.RATIO,
        source="fact_risk_snapshot",
        drill_dimension="p_band",
    ),
    _m(
        id="M-K08",
        title="Risk migration",
        group=MetricGroup.RISK,
        formula="band this quarter x band last quarter",
        grain="jurisdiction x quarter",
        unit=Unit.COUNT,
        source="fact_risk_snapshot",
        drill_dimension="band_migration",
    ),
    # -- enforcement funnel -------------------------------------------------
    _m(
        id="M-E01",
        title="Selection rate",
        group=MetricGroup.ENFORCEMENT,
        formula="selected / flagged",
        grain="jurisdiction x month",
        unit=Unit.RATIO,
        source="fact_enforcement",
        drill_dimension="case_status",
    ),
    _m(
        id="M-E02",
        title="Notice issuance rate",
        group=MetricGroup.ENFORCEMENT,
        formula="notices / selected",
        grain="jurisdiction x month",
        unit=Unit.RATIO,
        source="fact_enforcement",
        drill_dimension="case_status",
    ),
    _m(
        id="M-E03",
        title="Reply rate",
        group=MetricGroup.ENFORCEMENT,
        formula="replies / notices served",
        grain="jurisdiction x month",
        unit=Unit.RATIO,
        source="fact_enforcement",
        drill_dimension="notice_status",
    ),
    _m(
        id="M-E04",
        title="Demand raised",
        group=MetricGroup.ENFORCEMENT,
        formula="sum(case demand), head-wise",
        grain="jurisdiction x month",
        unit=Unit.MONEY,
        source="fact_enforcement",
        drill_dimension="case_status",
        head_wise=True,
    ),
    _m(
        id="M-E05",
        title="Demand confirmed",
        group=MetricGroup.ENFORCEMENT,
        formula="confirmed / raised",
        grain="jurisdiction x month",
        unit=Unit.RATIO,
        source="fact_enforcement",
        drill_dimension="case_status",
    ),
    _m(
        id="M-E06",
        title="Collection efficiency",
        group=MetricGroup.ENFORCEMENT,
        formula="collected / confirmed",
        grain="jurisdiction x month",
        unit=Unit.RATIO,
        source="fact_enforcement",
        drill_dimension="case_status",
    ),
    _m(
        id="M-E07",
        title="Cases within 90 days of limitation",
        group=MetricGroup.ENFORCEMENT,
        formula="count(days_to_limitation < 90)",
        grain="jurisdiction",
        unit=Unit.COUNT,
        source="case",
        drill_dimension="limitation_bucket",
    ),
    _m(
        id="M-E08",
        title="Time-barred cases",
        group=MetricGroup.ENFORCEMENT,
        formula="count(days_to_limitation < 0)",
        grain="jurisdiction",
        unit=Unit.COUNT,
        source="case",
        drill_dimension="limitation_bucket",
        note="The metric nobody wants on a screen and everybody needs.",
    ),
    _m(
        id="M-E09",
        title="Appeal sustain rate",
        group=MetricGroup.ENFORCEMENT,
        formula="sustained / appealed",
        grain="jurisdiction x rule",
        unit=Unit.RATIO,
        source="fact_enforcement",
        drill_dimension="rule_id",
    ),
    _m(
        id="M-E10",
        title="Mean case age",
        group=MetricGroup.ENFORCEMENT,
        formula="mean(as_of - opened_at)",
        grain="jurisdiction",
        unit=Unit.DAYS,
        source="case",
        drill_dimension="case_status",
    ),
    # -- rule and parameter quality ----------------------------------------
    _m(
        id="M-Q01",
        title="Rule precision",
        group=MetricGroup.QUALITY,
        formula="accepted dispositions / total dispositions, per rule",
        grain="rule",
        unit=Unit.RATIO,
        source="finding",
        drill_dimension="rule_id",
        note="A rule at 12% precision needs its threshold revisited, and the Rule "
        "Library should say so in words.",
    ),
    _m(
        id="M-Q02",
        title="Parameter hit rate",
        group=MetricGroup.QUALITY,
        formula="flagged params that led to a confirmed demand / flagged",
        grain="param",
        unit=Unit.RATIO,
        source="param_result",
        drill_dimension="param_flag",
    ),
    _m(
        id="M-Q03",
        title="False-positive rate",
        group=MetricGroup.QUALITY,
        formula="rejected / total, per rule",
        grain="rule",
        unit=Unit.RATIO,
        source="finding",
        drill_dimension="rule_id",
    ),
    _m(
        id="M-Q04",
        title="Data coverage",
        group=MetricGroup.QUALITY,
        formula="datasets present / datasets expected, per taxpayer",
        grain="taxpayer",
        unit=Unit.RATIO,
        source="fact_risk_snapshot",
        drill_dimension="coverage_band",
    ),
    _m(
        id="M-Q05",
        title="NOT_EVALUATED rate",
        group=MetricGroup.QUALITY,
        formula="not-evaluated / total, per rule and per parameter",
        grain="rule, param",
        unit=Unit.RATIO,
        source="finding",
        drill_dimension="rule_id",
    ),
)

METRICS: Final[dict[str, MetricSpec]] = {spec.id: spec for spec in _CATALOGUE}


def metric(metric_id: str) -> MetricSpec:
    try:
        return METRICS[metric_id]
    except KeyError as exc:
        raise KeyError(f"unknown metric {metric_id!r}") from exc


def assert_every_metric_drills() -> None:
    """Every visual element resolves to the taxpayers behind it.

    A bar a Commissioner cannot click is a bar a Commissioner cannot act on,
    and it will be the first thing they try.
    """
    undrillable = [spec.id for spec in METRICS.values() if not spec.drill_dimension]
    if undrillable:
        raise AssertionError(f"metrics with no drill dimension: {undrillable}")
