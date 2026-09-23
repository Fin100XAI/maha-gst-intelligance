"""Joins run once, before rules, and are cached on the context.

`CLAUDE.md`: *a rule consumes a `MatchResult`; it never re-runs a join.* One
join feeds many checks - J04 alone feeds B-04, P14 and the Rule 37A demand -
and two checks that each ran their own pairing could disagree about which two
rows are the same document while both looking correct.

The other half is what happens when a join cannot run. An empty join
reconciles perfectly and reads as agreement, so absence has to be a different
object from emptiness.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, Period
from app.engine.context import RuleContext
from app.engine.join_adapters import ADAPTERS, inputs_for
from app.engine.params import ParameterSet
from app.engine.records import InwardRecord, OutwardRecord, TaxpayerData, TaxpayerProfile
from app.matching.joins import JOINS

GSTIN = "27AAPCS8928R1Z1"
SUPPLIER = "24ABVFA2224Q1Z0"
OCT = Period.parse("102025")


def _inward(
    doc_no: str,
    *,
    form: str,
    day: int = 4,
    value: str = "2760000.00",
    filed_3b: bool | None = None,
) -> InwardRecord:
    return InwardRecord(
        gstin=GSTIN,
        period=OCT,
        section="B2B",
        doc_type="INVOICE",
        doc_no=doc_no,
        doc_date=date(2025, 10, day),
        supplier_gstin=SUPPLIER,
        pos="27",
        rate=Decimal("18"),
        taxable_value=Decimal(value),
        igst=Decimal("496800.00"),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        source_form=form,
        supplier_3b_filed=filed_3b,
        itc_available=True if form == "GSTR2B" else None,
        row_id=f"{form}-{doc_no}",
    )


def _outward(
    doc_no: str, *, doc_type: str, section: str, value: str = "500000.00"
) -> OutwardRecord:
    return OutwardRecord(
        gstin=GSTIN,
        period=OCT,
        section=section,
        doc_type=doc_type,
        doc_no=doc_no,
        doc_date=date(2025, 10, 4),
        counterparty_gstin=SUPPLIER,
        pos="24",
        rate=Decimal("18"),
        taxable_value=Decimal(value),
        igst=Decimal("90000.00"),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        row_id=f"out-{doc_no}",
    )


def _ctx(
    inward: tuple[InwardRecord, ...] = (),
    outward: tuple[OutwardRecord, ...] = (),
) -> RuleContext:
    return RuleContext(
        data=TaxpayerData(
            profile=TaxpayerProfile(
                gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
            ),
            inward=inward,
            outward=outward,
        ),
        fy=FinancialYear(2025),
        snapshot_id="join-phase",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


class TestTheJoinRunsOnce:
    @pytest.mark.golden
    def test_two_reads_return_the_same_object(self) -> None:
        """Not merely equal - the same object. Equality would still permit two
        checks to compute two pairings and agree by luck."""
        ctx = _ctx(
            inward=(
                _inward("AZ/1", form="GSTR2B"),
                _inward("AZ/1", form="GSTR2A"),
            )
        )
        assert ctx.join("J03") is ctx.join("J03")
        assert ctx.joins is ctx.joins

    def test_every_declared_join_is_accounted_for(self) -> None:
        """Twenty-one declared, twenty-one answered - each either a result or
        a named absence. A join missing from the map is a check that will look
        clean because nothing ran."""
        ctx = _ctx(inward=(_inward("AZ/1", form="GSTR2B"),))
        assert set(ctx.joins) == set(JOINS)

    def test_a_join_that_ran_reconciles(self) -> None:
        """Every input row in exactly one bucket. The join's own version of
        the ingestion ledger."""
        ctx = _ctx(
            inward=(
                _inward("AZ/1", form="GSTR2B"),
                _inward("AZ/2", form="GSTR2B"),
                _inward("AZ/1", form="GSTR2A"),
            )
        )
        result = ctx.join("J03")
        assert result is not None
        assert result.reconciles()
        assert len(result.matched) == 1
        assert len(result.only_left) == 1


class TestAbsenceIsNotEmptiness:
    @pytest.mark.golden
    def test_a_join_with_no_data_names_what_it_wanted(self) -> None:
        """An empty `MatchResult` reconciles perfectly and reads as two sides
        agreeing. That is the wrong answer for a sheet nobody uploaded."""
        ctx = _ctx(inward=(_inward("AZ/1", form="GSTR2B"),))
        assert ctx.join("J03") is None
        assert ctx.join_missing("J03") == ("GSTR-2A B2B",)

    def test_a_join_with_no_adapter_says_so_rather_than_raising(self) -> None:
        """Twenty-one are declared and three have adapters. The other eighteen
        are waiting on sheets the platform recognises and does not yet ingest,
        which is a state to report, not a crash."""
        ctx = _ctx(inward=(_inward("AZ/1", form="GSTR2B"),))
        assert "J19" not in ADAPTERS
        assert ctx.join("J19") is None
        assert ctx.join_missing("J19")

    def test_an_unknown_join_is_a_programming_error(self) -> None:
        ctx = _ctx()
        with pytest.raises(KeyError):
            inputs_for("J99", ctx.data)

    def test_the_map_of_waiting_checks_is_an_input_not_a_verdict(self) -> None:
        """X-01 reads J21, J21 has no adapter, and X-01 still produces its
        figure by pairing the rows itself. Only a check's own NOT_EVALUATED
        says it is dark."""
        ctx = _ctx(inward=(_inward("AZ/1", form="GSTR2B"),))
        waiting = ctx.checks_with_unavailable_joins
        assert "X-01" in waiting
        assert waiting["X-01"]


class TestTheAdaptersPairTheRightSides:
    def test_j03_puts_two_b_on_the_left_and_two_a_on_the_right(self) -> None:
        """The direction carries meaning: `only_right` is a document in 2A and
        not in 2B, which is a supplier who filed after the cut-off."""
        ctx = _ctx(
            inward=(
                _inward("AZ/1", form="GSTR2B"),
                _inward("AZ/1", form="GSTR2A"),
                _inward("AZ/9", form="GSTR2A"),
            )
        )
        result = ctx.join("J03")
        assert result is not None
        assert result.left_count == 1
        assert result.right_count == 2
        assert [r.doc_no for r in result.only_right] == ["AZ/9"]

    def test_j04_takes_only_the_defaulting_suppliers(self) -> None:
        ctx = _ctx(
            inward=(
                _inward("A/1", form="GSTR2A", filed_3b=False),
                _inward("A/2", form="GSTR2A", filed_3b=True),
                _inward("A/1", form="GSTR2B"),
            )
        )
        result = ctx.join("J04")
        assert result is not None
        assert result.left_count == 1

    def test_j04_abstains_when_no_row_states_a_status(self) -> None:
        """A 2B-only file cannot answer Rule 37A, and a join over it must not
        report that every claim is clean."""
        ctx = _ctx(inward=(_inward("A/1", form="GSTR2B"),))
        assert ctx.join("J04") is None
        assert "GSTR-3B filing status" in ctx.join_missing("J04")[0]

    def test_j07_pairs_notes_against_invoices(self) -> None:
        ctx = _ctx(
            outward=(
                _outward("CN/1", doc_type="CREDIT_NOTE", section="CDNR"),
                _outward("SSR/1", doc_type="INVOICE", section="B2B"),
            )
        )
        result = ctx.join("J07")
        assert result is not None
        assert result.left_count == 1
        assert result.right_count == 1

    def test_j07_needs_notes_before_it_can_run(self) -> None:
        ctx = _ctx(outward=(_outward("SSR/1", doc_type="INVOICE", section="B2B"),))
        assert ctx.join("J07") is None


class TestDeterminism:
    def test_the_same_data_pairs_the_same_way_twice(self) -> None:
        """Replay depends on it. A matcher resolving ties by set iteration
        would break `calc_id` without changing a single figure."""
        rows = (
            _inward("AZ/1", form="GSTR2B"),
            _inward("AZ/2", form="GSTR2B", value="2760000.00"),
            _inward("AZ/1", form="GSTR2A"),
            _inward("AZ/3", form="GSTR2A", value="2760000.00"),
        )
        first = _ctx(inward=rows).join("J03")
        second = _ctx(inward=rows).join("J03")
        assert first is not None
        assert second is not None
        assert [(p.left.doc_no, p.right.doc_no, p.level) for p in first.matched] == [
            (p.left.doc_no, p.right.doc_no, p.level) for p in second.matched
        ]


class TestMatchResultIsUsableByACheck:
    def test_it_reports_head_wise_and_never_a_scalar(self) -> None:
        ctx = _ctx(
            inward=(
                _inward("AZ/1", form="GSTR2B"),
                _inward("AZ/1", form="GSTR2A"),
            )
        )
        result = ctx.join("J03")
        assert result is not None
        assert set(result.delta.dict()) == {"igst", "cgst", "sgst", "cess"}

    def test_a_pair_carries_how_firmly_it_matched(self) -> None:
        """An officer disputing a pairing needs to know whether it was an
        exact document number or a fuzzy value match."""
        ctx = _ctx(
            inward=(
                _inward("AZ/1", form="GSTR2B"),
                _inward("AZ/1", form="GSTR2A"),
            )
        )
        result = ctx.join("J03")
        assert result is not None
        assert result.matched[0].confidence
        assert result.by_level["L1_EXACT"] == 1
