"""X-03, X-04 and X-05, and the tier model becoming load-bearing.

`docs/01` section 7 gives twelve X checks. Three of them cannot produce a
rupee figure from returns alone, and the interesting question is what the
engine does about that. Inventing a figure is the obvious wrong answer.
Staying silent is the less obvious one: a check nobody can see is a check
nobody acts on, and it looks exactly like a clean pass.

So they declare a tier, and the tier decides what they may say:

    X-03  ASSISTED  the second limb of its own test needs a rate master
    X-04  ASSISTED  goods or service is a contract question, not arithmetic
    X-05  AUTO      a series is evidence the return itself carries

The last class here is about X-05 not double-counting X-01, which it did
when first written.
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
IWAI = "09AAATI7021F1ZW"


def _line(
    value: str,
    rate: str,
    *,
    day: int,
    month: int = 10,
    party: str = IWAI,
    hsn: str | None = None,
    doc: str = "SSR/1",
) -> OutwardRecord:
    taxable = Decimal(value)
    tax = (taxable * Decimal(rate) / Decimal("100")).quantize(Decimal("0.01"))
    year = 2025 if month >= 4 else 2026
    return OutwardRecord(
        gstin=GSTIN,
        period=Period(year, month),
        section="B2B",
        doc_type="INVOICE",
        doc_no=doc,
        doc_date=date(year, month, day),
        counterparty_gstin=party,
        pos="09",
        rate=Decimal(rate),
        taxable_value=taxable,
        igst=tax,
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        hsn=hsn,
        row_id=f"{doc}-{month}",
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
        snapshot_id="x-assisted",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


class TestX03AsksRatherThanAsserts:
    @pytest.mark.golden
    def test_it_produces_a_document_call_not_a_finding(self) -> None:
        """Its own test has two limbs and the engine can only run one. The
        rate structure changed on 22 September 2025, inside the year under
        scrutiny, so the missing limb is the likely explanation rather than a
        theoretical gap - and a demand built without it rests on a
        notification the engine never read."""
        ctx = _ctx(
            (
                _line("10000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("10000000", "5", day=20, hsn="73089010", doc="A/2"),
            )
        )
        (call,) = RULES["X-03"].function(ctx)
        assert isinstance(call, DocumentCall)
        assert call.check_id == "X-03"
        assert call.tier is Tier.ASSISTED
        assert call.unquantified_exposure == Decimal("1300000.00")

    def test_the_question_names_the_notification_that_would_settle_it(self) -> None:
        ctx = _ctx(
            (
                _line("10000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("10000000", "5", day=20, hsn="73089010", doc="A/2"),
            )
        )
        (call,) = RULES["X-03"].function(ctx)
        assert "notification changed the rate inside" in call.question
        assert "73089010" in call.document

    def test_the_rate_reads_as_a_rate(self) -> None:
        """`5%`, not `5.0000000000%`. This sentence goes onto a notice, and a
        trailing-zero decimal there reads as a machine's output rather than a
        department's statement."""
        ctx = _ctx(
            (
                _line("10000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("10000000", "5", day=20, hsn="73089010", doc="A/2"),
            )
        )
        (call,) = RULES["X-03"].function(ctx)
        assert "5%" in call.question
        assert "5.0" not in call.question

    def test_a_small_differential_is_not_worth_a_letter(self) -> None:
        ctx = _ctx(
            (
                _line("10000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("10000", "5", day=20, hsn="73089010", doc="A/2"),
            )
        )
        assert RULES["X-03"].function(ctx) == []

    @pytest.mark.golden
    def test_without_an_hsn_column_it_abstains_by_name(self) -> None:
        """The portal's B2B export has no HSN column - it is in Table 12,
        which this platform recognises and does not yet ingest. Returning
        nothing would be read as a clean pass on every real workbook."""
        ctx = _ctx((_line("10000000", "18", day=4), _line("10000000", "5", day=20)))
        (finding,) = RULES["X-03"].function(ctx)
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert "Table 12" in finding.missing_inputs[0]


class TestX04AsksForTheContract:
    def test_goods_and_a_service_sac_at_one_value_raises_a_call(self) -> None:
        ctx = _ctx(
            (
                _line("5000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("5000000", "18", day=11, hsn="995461", doc="A/2"),
            )
        )
        (call,) = RULES["X-04"].function(ctx)
        assert isinstance(call, DocumentCall)
        assert call.unquantified_exposure == Decimal("0.00")
        assert "works contract" in call.question

    def test_two_goods_chapters_are_not_this_check(self) -> None:
        """Two goods headings at one value is X-03's territory or nothing at
        all. This check is about the goods/service boundary specifically."""
        ctx = _ctx(
            (
                _line("5000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("5000000", "18", day=11, hsn="84818090", doc="A/2"),
            )
        )
        assert RULES["X-04"].function(ctx) == []

    def test_it_carries_no_rupee_figure(self) -> None:
        """Whether a supply is goods or a service is a judgement. A figure
        attached to one would be a guess wearing a rupee sign."""
        ctx = _ctx(
            (
                _line("5000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("5000000", "18", day=11, hsn="995461", doc="A/2"),
            )
        )
        (call,) = RULES["X-04"].function(ctx)
        assert call.partial.total == Decimal("0.00")


class TestX05IsX01sComplement:
    @pytest.mark.golden
    def test_a_series_breaking_outside_the_window_is_x05s(self) -> None:
        """Three identical milestones to one counterparty are a contract. A
        contract does not reclassify itself mid-way without a reason, and
        that argument needs no thirty-day window."""
        rows = (
            _line("50000000", "18", day=4, month=4, doc="M/1"),
            _line("50000000", "18", day=4, month=6, doc="M/2"),
            _line("50000000", "5", day=4, month=10, doc="M/3"),
        )
        (finding,) = RULES["X-05"].function(_ctx(rows))
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == Decimal("6500000.00")

    @pytest.mark.golden
    def test_a_break_inside_the_window_belongs_to_x01_alone(self) -> None:
        """It double-counted when first written: X-05's evidence was a strict
        subset of X-01's, same counterparty and same two rates, and an officer
        reading both cards saw Rs 2.86 crore where there is Rs 1.91 crore."""
        rows = (
            _line("50000000", "18", day=4, doc="M/1"),
            _line("50000000", "18", day=8, doc="M/2"),
            _line("50000000", "5", day=12, doc="M/3"),
        )
        ctx = _ctx(rows)
        (x01,) = RULES["X-01"].function(ctx)
        (x05,) = RULES["X-05"].function(ctx)
        assert x01.status is FindingStatus.TRIGGERED
        assert x05.status is FindingStatus.CLEAR

    def test_two_billings_are_not_a_series(self) -> None:
        """Two is what X-01 looks at, with a window to argue they are one
        supply. X-05's whole claim rests on repetition."""
        rows = (
            _line("50000000", "18", day=4, month=4, doc="M/1"),
            _line("50000000", "5", day=4, month=10, doc="M/2"),
        )
        (finding,) = RULES["X-05"].function(_ctx(rows))
        assert finding.status is FindingStatus.CLEAR

    def test_the_exposure_is_every_milestone_at_the_lower_rate(self) -> None:
        """docs/01: confining it to the contradicting pair is the mistake
        that turns Rs 1.91 crore into Rs 47.7 lakh."""
        rows = (
            _line("50000000", "18", day=4, month=4, doc="M/1"),
            _line("50000000", "5", day=4, month=9, doc="M/2"),
            _line("50000000", "5", day=4, month=12, doc="M/3"),
        )
        (finding,) = RULES["X-05"].function(_ctx(rows))
        assert finding.taxable_value_effect == Decimal("100000000")
        assert finding.delta.abs_total == Decimal("13000000.00")

    def test_it_routes_to_asmt_10_because_it_is_a_dispute(self) -> None:
        rows = (
            _line("50000000", "18", day=4, month=4, doc="M/1"),
            _line("50000000", "18", day=4, month=6, doc="M/2"),
            _line("50000000", "5", day=4, month=10, doc="M/3"),
        )
        (finding,) = RULES["X-05"].function(_ctx(rows))
        assert finding.suggested_form is not None
        assert finding.suggested_form.value == "ASMT-10"
        assert finding.narrative is not None
        assert "rate dispute" in finding.narrative


class TestTheRunnerEnforcesTheTier:
    def test_an_assisted_check_reaches_the_call_book_not_the_findings(self) -> None:
        ctx = _ctx(
            (
                _line("10000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("10000000", "5", day=20, hsn="73089010", doc="A/2"),
            )
        )
        out = run_for_taxpayer(ctx, only=("X-03",))
        assert [c.check_id for c in out.document_calls] == ["X-03"]
        assert not [f for f in out.findings if f.rule_id == "X-03" and f.triggered]

    def test_an_assisted_exposure_does_not_move_the_score(self) -> None:
        """Letting an unquantified figure move the F-Score would make the
        score depend on how much the engine could not see."""
        ctx = _ctx(
            (
                _line("10000000", "18", day=4, hsn="73089010", doc="A/1"),
                _line("10000000", "5", day=20, hsn="73089010", doc="A/2"),
            )
        )
        out = run_for_taxpayer(ctx, only=("X-03",))
        assert out.document_calls[0].unquantified_exposure > Decimal("0")
        assert out.f_score.score == Decimal("0")

    def test_every_check_still_has_a_row_when_it_finds_nothing(self) -> None:
        """An ASSISTED check with nothing to call for has genuinely found
        nothing, and the scorecard must say so rather than omit it. That
        `clear` is the engine's statement about the check, not the check's
        own output, so no tier forbids it."""
        ctx = _ctx((_line("10000000", "18", day=4, hsn="73089010", doc="A/1"),))
        out = run_for_taxpayer(ctx, only=("X-03",))
        assert [f.rule_id for f in out.findings] == ["X-03"]
        assert out.findings[0].status is FindingStatus.CLEAR
        assert out.rule_errors == ()

    def test_the_declared_tiers_are_what_docs_01_says(self) -> None:
        assert RULES["X-01"].tier is Tier.AUTO
        assert RULES["X-03"].tier is Tier.ASSISTED
        assert RULES["X-04"].tier is Tier.ASSISTED
        assert RULES["X-05"].tier is Tier.AUTO
