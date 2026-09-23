"""The reports, and the four things every one of them must do.

A report is not a check, and the difference is where the danger is. A check
carries a legal basis and a tier that constrains what it may assert. A report
puts numbers side by side and lets an officer conclude - which means a report
that quietly picks a different definition from the check beside it produces
two figures for one question, and the officer has no way to tell which is
right.

That is not hypothetical here. The supplier report first summed every row from
a supplier who had defaulted in one period and reported Rs 6.83 crore where
check B-04 reports Rs 98.47 lakh, on the same question, on the same file.
`TestOneQuestionOneDefinition` exists so it cannot happen again.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import (
    InwardRecord,
    OutwardRecord,
    Return3BRecord,
    TaxpayerData,
    TaxpayerProfile,
)
from app.engine.registry import RULES
from app.engine.runner import run_for_taxpayer  # noqa: F401  # registers every check
from app.reports.registry import PLANNED, REPORTS, build

GSTIN = "27AAPCS8928R1Z1"
SUPPLIER = "27ATAPD1787A1Z5"
BUYER = "24ABVFA2224Q1Z0"
FY = FinancialYear(2025)


def _out(*, month: int = 10, taxable: str = "1000000.00", tax: str = "180000.00") -> OutwardRecord:
    return OutwardRecord(
        gstin=GSTIN,
        period=Period(2025, month),
        section="B2B",
        doc_type="INVOICE",
        doc_no=f"SSR/{month}",
        doc_date=date(2025, month, 4),
        counterparty_gstin=BUYER,
        pos="24",
        rate=Decimal("18"),
        taxable_value=Decimal(taxable),
        igst=Decimal(tax),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        row_id=f"out-{month}",
    )


def _in(
    *,
    month: int = 10,
    form: str = "GSTR2B",
    filed_3b: bool | None = None,
    tax: str = "180000.00",
) -> InwardRecord:
    return InwardRecord(
        gstin=GSTIN,
        period=Period(2025, month),
        section="B2B",
        doc_type="INVOICE",
        doc_no=f"P/{month}",
        doc_date=date(2025, month, 4),
        supplier_gstin=SUPPLIER,
        pos="27",
        rate=Decimal("18"),
        taxable_value=Decimal("1000000.00"),
        igst=Decimal(tax),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        source_form=form,
        supplier_3b_filed=filed_3b,
        itc_available=True,
        row_id=f"{form}-{month}",
    )


def _three_b(
    *, month: int = 10, outward: str = "180000.00", itc: str = "180000.00"
) -> Return3BRecord:
    return Return3BRecord(
        gstin=GSTIN,
        period=Period(2025, month),
        cells={
            "t31a_igst": Decimal(outward),
            "t31a_cgst": Decimal("0.00"),
            "t31a_sgst": Decimal("0.00"),
            "t31a_cess": Decimal("0.00"),
            "t4a5_igst": Decimal(itc),
            "t4a5_cgst": Decimal("0.00"),
            "t4a5_sgst": Decimal("0.00"),
            "t4a5_cess": Decimal("0.00"),
        },
    )


def _data(**kw: object) -> TaxpayerData:
    return TaxpayerData(
        profile=TaxpayerProfile(
            gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
        ),
        **kw,  # type: ignore[arg-type]
    )


def _run(report_id: str, data: TaxpayerData):  # type: ignore[no-untyped-def]
    return build(report_id, data, FY.label, FY.periods)


class TestEveryReportAnswers:
    @pytest.mark.golden
    def test_none_of_them_returns_an_empty_table_on_an_empty_file(self) -> None:
        """An empty table reads as "nothing to see", which is the one thing
        absence must never mean. Each report has to name the dataset it
        wanted instead."""
        empty = _data()
        for report_id in REPORTS:
            report = _run(report_id, empty)
            assert not report.evaluated, report_id
            assert report.missing_inputs, report_id
            assert report.missing_inputs[0].strip(), report_id

    def test_a_dark_report_says_so_in_its_headline(self) -> None:
        """The sentence has to read correctly with no other context on
        screen - an officer seeing only it still knows what to ask for."""
        report = _run("gstr3b_vs_gstr1", _data())
        assert "could not be produced" in report.headline
        assert "GSTR-1" in report.headline

    def test_every_report_has_at_least_one_chart_when_it_runs(self) -> None:
        data = _data(
            outward=(_out(),),
            inward=(_in(filed_3b=False),),
            returns_3b=(_three_b(),),
        )
        for report_id in REPORTS:
            report = _run(report_id, data)
            if report.evaluated:
                assert report.series, report_id

    def test_every_chart_point_that_can_drill_does(self) -> None:
        """`CLAUDE.md`: a chart without a drill handler fails review. The
        exceptions are legend-style points that describe the report you are
        already on."""
        data = _data(
            outward=(_out(),),
            inward=(_in(filed_3b=False),),
            returns_3b=(_three_b(),),
        )
        undrillable = [
            (report_id, series.id, point.label)
            for report_id in REPORTS
            for series in _run(report_id, data).series
            for point in series.points
            if point.drill is None and point.note is None
        ]
        assert undrillable == []


class TestMoneyNeverBecomesAFloat:
    @pytest.mark.golden
    def test_every_figure_on_the_wire_is_a_string(self) -> None:
        """A `Decimal` serialised through JSON becomes a float somewhere
        between here and the browser, and a float rupee can be wrong in the
        eighteenth place."""
        data = _data(
            outward=(_out(),),
            inward=(_in(filed_3b=False),),
            returns_3b=(_three_b(),),
        )
        for report_id in REPORTS:
            payload = _run(report_id, data).as_dict()
            _assert_no_floats(payload, f"{report_id}")


def _assert_no_floats(node: object, path: str) -> None:
    assert not isinstance(node, float), f"float on the wire at {path}"
    if isinstance(node, dict):
        for key, value in node.items():
            _assert_no_floats(value, f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            _assert_no_floats(value, f"{path}[{index}]")


class TestOneQuestionOneDefinition:
    """The supplier report and check B-04 answer the same question.

    They must produce the same number. The first version of the report did
    not: it summed every row from a supplier who had defaulted in any period
    and reported roughly six times the finding.
    """

    @pytest.mark.golden
    def test_the_supplier_report_agrees_with_b04_to_the_paisa(self) -> None:
        data = _data(
            inward=(
                _in(month=7, filed_3b=False, form="GSTR2A"),
                _in(month=8, filed_3b=True, form="GSTR2A"),
                _in(month=7, form="GSTR2B"),
                _in(month=8, form="GSTR2B"),
            ),
        )
        ctx = RuleContext(
            data=data,
            fy=FY,
            snapshot_id="reports",
            params=ParameterSet(),
            as_of=date(2026, 3, 31),
        )
        (finding,) = RULES["B-04"].function(ctx)
        report = _run("supplier_wise", data)
        assert report.total is not None
        assert abs(report.total.total) == finding.delta.abs_total

    def test_credit_comes_from_2b_and_status_from_2a(self) -> None:
        """Summing both statements gives a supplier twice their real credit,
        because 2A and 2B carry the same invoices."""
        data = _data(
            inward=(
                _in(month=7, form="GSTR2A", filed_3b=True),
                _in(month=7, form="GSTR2B"),
            )
        )
        report = _run("supplier_wise", data)
        credit = next(r for r in report.rows if r.cells["Supplier"] == SUPPLIER)
        assert credit.cells["Credit (2B)"] == "180000.00"
        assert credit.cells["Supplier's GSTR-3B"] == "Filed"


class TestTheHeadWiseSplitSurvives:
    def test_the_3b_against_1_difference_is_never_one_number(self) -> None:
        """IGST short and CGST long by the same amount is not a reconciled
        return. Law 3 at the reporting layer."""
        data = _data(outward=(_out(),), returns_3b=(_three_b(outward="90000.00"),))
        report = _run("gstr3b_vs_gstr1", data)
        row = next(r for r in report.rows if r.cells["Period"] == "102025")
        assert {"IGST", "CGST", "SGST", "Cess"} <= set(row.cells)
        assert report.total is not None
        assert report.total.igst == Decimal("90000.00")


class TestPlannedReportsAreHonest:
    def test_every_planned_report_names_the_dataset_it_waits_on(self) -> None:
        for spec in PLANNED.values():
            assert spec.needs.strip(), spec.id
            assert spec.roadmap_ref.strip(), spec.id

    def test_a_planned_report_is_not_in_the_buildable_registry(self) -> None:
        assert not set(PLANNED) & set(REPORTS)

    def test_asking_for_an_unknown_report_is_an_error_not_an_empty_one(self) -> None:
        with pytest.raises(KeyError):
            build("no_such_report", _data(), FY.label, FY.periods)


class TestTheRateSideRefusesToInvent:
    def test_a_blank_rate_column_is_said_to_be_blank(self) -> None:
        """The portal's 2B export leaves `Rate` empty. Dividing tax by
        taxable value would produce a rate the statement never stated."""
        data = _data(
            outward=(_out(),),
            inward=(
                InwardRecord(
                    gstin=GSTIN,
                    period=Period(2025, 10),
                    section="B2B",
                    doc_type="INVOICE",
                    doc_no="P/1",
                    doc_date=date(2025, 10, 4),
                    supplier_gstin=SUPPLIER,
                    pos="27",
                    rate=None,
                    taxable_value=Decimal("1000000.00"),
                    igst=Decimal("180000.00"),
                    cgst=Decimal("0.00"),
                    sgst=Decimal("0.00"),
                    cess=Decimal("0.00"),
                    source_form="GSTR2B",
                    row_id="p1",
                ),
            ),
        )
        report = _run("rate_wise", data)
        assert "no rate is stated on the purchases side" in report.headline
        assert "at not stated%" not in report.headline


class TestProseAndWireAreNotInterchangeable:
    """`rupees()` is for a sentence; `money()` is for the wire.

    They were mixed once, by a blunt search-and-replace that was meant to
    reach only the headline functions and reached three chart values as well.
    A point whose `value` is `Rs 1,47,93,540.47` cannot be parsed into a bar
    length, so the chart silently drew zero - the figure was still on screen,
    in the label, which is exactly how this kind of mistake survives review.
    """

    @pytest.mark.golden
    def test_no_chart_value_is_formatted_prose(self) -> None:
        data = _data(
            outward=(_out(),),
            inward=(_in(filed_3b=False),),
            returns_3b=(_three_b(),),
        )
        for report_id in REPORTS:
            for series in _run(report_id, data).series:
                for point in series.points:
                    assert "Rs " not in point.value, f"{report_id}/{series.id}/{point.label}"
                    assert "," not in point.value, f"{report_id}/{series.id}/{point.label}"
                    if point.compare is not None:
                        assert "Rs " not in point.compare
                        assert "," not in point.compare

    def test_every_chart_value_parses_as_a_number(self) -> None:
        """The one thing the client does with it is measure a bar."""
        data = _data(
            outward=(_out(),),
            inward=(_in(filed_3b=False),),
            returns_3b=(_three_b(),),
        )
        for report_id in REPORTS:
            for series in _run(report_id, data).series:
                for point in series.points:
                    Decimal(point.value)

    def test_the_headline_is_readable_by_a_person(self) -> None:
        """Indian grouping, because the reader is. A headline with
        `129325891.68` in it is a headline nobody finishes."""
        data = _data(
            inward=(_in(month=7, filed_3b=False, form="GSTR2A"), _in(month=7, form="GSTR2B")),
        )
        headline = _run("supplier_wise", data).headline
        assert "Rs " in headline
