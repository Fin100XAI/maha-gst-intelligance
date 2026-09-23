"""X-07 to X-10, and the family as a whole.

All twelve self-contradiction checks are now registered. Four of them - the
ones here - cannot produce anything on a portal workbook, because the sheets
they read are recognised and not ingested: the HSN summary, the
document-series register, and GSTR-7.

That is worth building rather than deferring. A registered check that abstains
by name puts a row on the scorecard saying *which sheet would answer this*,
and an officer can act on that. A check that does not exist puts nothing
anywhere, and the gap is invisible.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, FindingStatus, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import OutwardRecord, TaxpayerData, TaxpayerProfile
from app.engine.registry import RULES
from app.engine.runner import run_for_taxpayer
from app.engine.tiers import DocumentCall, Tier

GSTIN = "27AAPCS8928R1Z1"
GUJARAT_BUYER = "24ABVFA2224Q1Z0"

X_FAMILY = tuple(f"X-{n:02d}" for n in range(1, 13))


def _line(
    *,
    hsn: str | None = None,
    pos: str = "24",
    taxable: str = "1000000.00",
    quantity: str | None = None,
    uqc: str | None = None,
    party: str = GUJARAT_BUYER,
    doc: str = "SSR/1",
) -> OutwardRecord:
    return OutwardRecord(
        gstin=GSTIN,
        period=Period.parse("102025"),
        section="B2B",
        doc_type="INVOICE",
        doc_no=doc,
        doc_date=date(2025, 10, 4),
        counterparty_gstin=party,
        pos=pos,
        rate=Decimal("18"),
        taxable_value=Decimal(taxable),
        igst=Decimal("180000.00"),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        hsn=hsn,
        uqc=uqc,
        quantity=None if quantity is None else Decimal(quantity),
        row_id=doc,
    )


def _ctx(rows: tuple[OutwardRecord, ...]) -> RuleContext:
    return RuleContext(
        data=TaxpayerData(
            profile=TaxpayerProfile(
                gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
            ),
            outward=rows,
        ),
        fy=FinancialYear(2025),
        snapshot_id="x-complete",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


class TestTheFamilyIsComplete:
    @pytest.mark.golden
    def test_all_twelve_are_registered(self) -> None:
        """`docs/01` section 7 gives twelve and the pack says build them
        first. Twelve exist."""
        assert set(X_FAMILY) <= set(RULES)

    def test_every_one_answers_on_an_empty_file(self) -> None:
        """None may return nothing. A check that produces no row is
        indistinguishable on screen from one that ran and found nothing, and
        that is the failure Law 7 exists to prevent."""
        out = run_for_taxpayer(_ctx(()), only=X_FAMILY)
        answered = {f.rule_id for f in out.findings} | {c.check_id for c in out.document_calls}
        assert answered == set(X_FAMILY)
        assert out.rule_errors == ()

    def test_none_of_them_claims_a_clean_pass_on_an_empty_file(self) -> None:
        """ "No data" is not "no issue" - and an empty file has no data for any
        of the twelve."""
        out = run_for_taxpayer(_ctx(()), only=X_FAMILY)
        assert not [f for f in out.findings if f.status is FindingStatus.CLEAR]

    def test_every_abstention_names_what_it_wanted(self) -> None:
        out = run_for_taxpayer(_ctx(()), only=X_FAMILY)
        for finding in out.findings:
            if finding.status is FindingStatus.NOT_EVALUATED:
                assert finding.missing_inputs, finding.rule_id
                assert finding.missing_inputs[0].strip()


class TestX07PlaceOfSupply:
    def test_a_service_whose_pos_is_not_the_recipients_state(self) -> None:
        """s.12 fixes a service's place of supply by where the recipient is.
        A SAC line pointing somewhere else has had s.10 applied to it, and
        the wrong section changes which government is paid."""
        ctx = _ctx((_line(hsn="995461", pos="27"),))
        (call,) = RULES["X-07"].function(ctx)
        assert isinstance(call, DocumentCall)
        assert call.tier is Tier.ASSISTED
        assert "s.10" in call.question

    def test_a_service_billed_to_its_recipients_state_is_ordinary(self) -> None:
        ctx = _ctx((_line(hsn="995461", pos="24"),))
        assert RULES["X-07"].function(ctx) == []

    def test_without_an_hsn_it_abstains(self) -> None:
        ctx = _ctx((_line(pos="27"),))
        (finding,) = RULES["X-07"].function(ctx)
        assert finding.status is FindingStatus.NOT_EVALUATED


class TestX08Quantity:
    def test_a_crore_of_goods_in_five_units_raises_a_question(self) -> None:
        ctx = _ctx((_line(hsn="73089010", taxable="20000000.00", quantity="2", uqc="NOS"),))
        (call,) = RULES["X-08"].function(ctx)
        assert isinstance(call, DocumentCall)
        assert call.unquantified_exposure == Decimal("20000000.00")

    def test_a_unit_of_measure_that_says_nothing_is_the_same_question(self) -> None:
        """Rule 46 is about particulars. `OTH` against a goods heading is not
        a description."""
        ctx = _ctx((_line(hsn="73089010", taxable="20000000.00", quantity="4000", uqc="OTH"),))
        assert len(RULES["X-08"].function(ctx)) == 1

    def test_a_service_line_is_not_this_check(self) -> None:
        """Services have no meaningful quantity, and asking for one would put
        a letter on every consultancy invoice in the file."""
        ctx = _ctx((_line(hsn="995461", taxable="20000000.00", quantity="1", uqc="OTH"),))
        assert RULES["X-08"].function(ctx) == []

    def test_a_plausible_line_is_left_alone(self) -> None:
        ctx = _ctx((_line(hsn="73089010", taxable="20000000.00", quantity="4000", uqc="MTS"),))
        assert RULES["X-08"].function(ctx) == []

    def test_below_the_value_floor_nothing_is_asked(self) -> None:
        """docs/01 section 7: value above Rs 1 crore."""
        ctx = _ctx((_line(hsn="73089010", taxable="500000.00", quantity="1", uqc="OTH"),))
        assert RULES["X-08"].function(ctx) == []

    def test_without_a_quantity_column_it_abstains(self) -> None:
        ctx = _ctx((_line(hsn="73089010", taxable="20000000.00"),))
        (finding,) = RULES["X-08"].function(ctx)
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert any("quantity" in reason for reason in finding.missing_inputs)


class TestX09AndX10AbstainByName:
    @pytest.mark.golden
    def test_x09_names_the_document_series_register(self) -> None:
        """A cancelled serial is recorded in GSTR-1 Table 13 and nowhere
        else. Reporting that nothing was cancelled because the register was
        never read would be the quiet failure."""
        (finding,) = RULES["X-09"].function(_ctx((_line(hsn="73089010"),)))
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert "Table 13" in finding.missing_inputs[0]

    @pytest.mark.golden
    def test_x10_names_gstr7(self) -> None:
        """A deductor's own return is the strongest evidence in the catalogue
        and the platform does not yet hold it. `docs/07` Finding 1 uses it as
        its corroboration limb."""
        (finding,) = RULES["X-10"].function(_ctx((_line(hsn="73089010"),)))
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert "GSTR-7" in finding.missing_inputs[0]

    def test_neither_pretends_to_have_looked(self) -> None:
        for check in ("X-09", "X-10"):
            (finding,) = RULES[check].function(_ctx((_line(hsn="73089010"),)))
            assert finding.status is not FindingStatus.CLEAR
            assert finding.delta.abs_total == Decimal("0.00")
