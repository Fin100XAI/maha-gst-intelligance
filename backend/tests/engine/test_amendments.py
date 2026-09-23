"""Amendments: X-12, and the J17 pairing that reads the stated reference.

An amendment was invisible to this platform in two separate ways at once.
`section` never resolved, so `is_amendment` was written as `section ==
"AMENDMENT"` and no row in any database carried it (D-0089). And the
`Original Invoice Number` column the B2BA table actually provides was never
mapped, so even a correctly flagged amendment could not say what it amended.

Both are fixed, and these tests pin what the platform may now conclude - and,
more carefully, what it still may not.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, FindingStatus, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import InwardRecord, OutwardRecord, TaxpayerData, TaxpayerProfile
from app.engine.registry import RULES
from app.engine.runner import run_for_taxpayer  # noqa: F401  # registers every check

GSTIN = "27AAPCS8928R1Z1"
BUYER = "24ABVFA2224Q1Z0"


def _out(
    doc_no: str,
    *,
    month: int,
    tax: str,
    section: str = "B2B",
    amends: str | None = None,
    taxable: str = "1000000.00",
    party: str = BUYER,
) -> OutwardRecord:
    year = 2025 if month >= 4 else 2026
    return OutwardRecord(
        gstin=GSTIN,
        period=Period(year, month),
        section=section,
        doc_type="INVOICE",
        doc_no=doc_no,
        doc_date=date(year, month, 4),
        counterparty_gstin=party,
        pos="24",
        rate=Decimal("18"),
        taxable_value=Decimal(taxable),
        igst=Decimal(tax),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        is_amendment=section == "AMENDMENT",
        amends_doc_no=amends,
        amends_doc_date=date(2025, 4, 4) if amends else None,
        row_id=f"{doc_no}-{month}",
    )


def _in(
    doc_no: str,
    *,
    section: str = "B2B",
    amends: str | None = None,
    taxable: str = "1000000.00",
) -> InwardRecord:
    return InwardRecord(
        gstin=GSTIN,
        period=Period.parse("102025"),
        section=section,
        doc_type="INVOICE",
        doc_no=doc_no,
        doc_date=date(2025, 10, 4),
        supplier_gstin=BUYER,
        pos="27",
        rate=Decimal("18"),
        taxable_value=Decimal(taxable),
        igst=Decimal("180000.00"),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        source_form="GSTR2A",
        amends_doc_no=amends,
        amends_doc_date=date(2025, 10, 4) if amends else None,
        row_id=f"in-{doc_no}",
    )


def _ctx(
    outward: tuple[OutwardRecord, ...] = (),
    inward: tuple[InwardRecord, ...] = (),
) -> RuleContext:
    return RuleContext(
        data=TaxpayerData(
            profile=TaxpayerProfile(
                gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
            ),
            outward=outward,
            inward=inward,
        ),
        fy=FinancialYear(2025),
        snapshot_id="amendments",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


class TestX12TimingIsTheWholeCheck:
    @pytest.mark.golden
    def test_a_later_amendment_reducing_tax_triggers(self) -> None:
        """The liability was declared in April and discharged through April's
        GSTR-3B. Reducing it in September is a claim against tax already in
        the exchequer."""
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="180000.00"),
                _out(
                    "SSR/1A",
                    month=9,
                    tax="90000.00",
                    section="AMENDMENT",
                    amends="SSR/1",
                    taxable="500000.00",
                ),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == Decimal("90000.00")

    @pytest.mark.golden
    def test_an_amendment_inside_its_own_period_is_bookkeeping(self) -> None:
        """Declared once, net, through the same return. Nothing has been paid
        that the correction claws back, and treating it as a reduction would
        raise a demand against every ordinary revision in the file."""
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="180000.00"),
                _out(
                    "SSR/1A",
                    month=4,
                    tax="90000.00",
                    section="AMENDMENT",
                    amends="SSR/1",
                    taxable="500000.00",
                ),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_an_amendment_that_increases_tax_is_not_this_check(self) -> None:
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="90000.00"),
                _out(
                    "SSR/1A",
                    month=9,
                    tax="180000.00",
                    section="AMENDMENT",
                    amends="SSR/1",
                ),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_a_reduction_below_the_threshold_is_left_alone(self) -> None:
        """docs/01 section 7: delta above Rs 25,000."""
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="180000.00"),
                _out(
                    "SSR/1A",
                    month=9,
                    tax="160000.00",
                    section="AMENDMENT",
                    amends="SSR/1",
                ),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_at_the_threshold_exactly_it_does_not_fire(self) -> None:
        """Rs 25,000 is the boundary and the rule reads *above* it."""
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="180000.00"),
                _out(
                    "SSR/1A",
                    month=9,
                    tax="155000.00",
                    section="AMENDMENT",
                    amends="SSR/1",
                ),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.CLEAR


class TestX12WillNotGuessWhatWasAmended:
    @pytest.mark.golden
    def test_an_amendment_with_no_stated_reference_abstains(self) -> None:
        """`SSR/1A` plainly amends `SSR/1`. The engine still will not act on
        the resemblance - guessing which document was amended is how a demand
        is raised against the wrong invoice."""
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="180000.00"),
                _out("SSR/1A", month=9, tax="90000.00", section="AMENDMENT"),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert "original document reference" in finding.missing_inputs[0]

    def test_a_reference_to_another_party_does_not_pair(self) -> None:
        """The document number is only unique within a supplier's own series."""
        ctx = _ctx(
            (
                _out("SSR/1", month=4, tax="180000.00", party="27AAACK6801E1ZV"),
                _out(
                    "SSR/1A",
                    month=9,
                    tax="90000.00",
                    section="AMENDMENT",
                    amends="SSR/1",
                ),
            )
        )
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_a_file_with_no_amendments_is_clear_not_dark(self) -> None:
        ctx = _ctx((_out("SSR/1", month=4, tax="180000.00"),))
        (finding,) = RULES["X-12"].function(ctx)
        assert finding.status is FindingStatus.CLEAR


class TestJ17PairsOnTheStatedReference:
    @pytest.mark.golden
    def test_the_amendment_finds_its_original_by_what_it_names(self) -> None:
        """The left candidate is built with `amends_doc_no` as its document
        number, so the ladder's exact rung finds the original - a correct
        pairing reached from a stated reference, not from two numbers that
        look alike."""
        ctx = _ctx(
            inward=(
                _in("9936"),
                _in("9936A", section="AMENDMENT", amends="9936", taxable="900000.00"),
            )
        )
        result = ctx.join("J17")
        assert result is not None
        assert result.reconciles()
        assert result.left_count == 1

    def test_a_changed_value_is_the_signal_not_an_error(self) -> None:
        """For J03 the value-differs bucket is a discrepancy between two
        statements. For J17 it is the amendment doing its job - a correction
        that changed nothing would be the odd one. The bucket's meaning is
        the join's, not the matcher's."""
        ctx = _ctx(
            inward=(
                _in("9936"),
                _in("9936A", section="AMENDMENT", amends="9936", taxable="500000.00"),
            )
        )
        result = ctx.join("J17")
        assert result is not None
        assert len(result.value_differs) == 1
        assert len(result.matched) == 0

    def test_an_amendment_naming_nothing_keeps_the_join_dark(self) -> None:
        ctx = _ctx(inward=(_in("9936"), _in("9936A", section="AMENDMENT")))
        assert ctx.join("J17") is None
        assert "amendment rows stating" in ctx.join_missing("J17")[0]
