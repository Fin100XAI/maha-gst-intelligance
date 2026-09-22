"""The filing scorecard, and the five states that must stay distinct.

The scorecard's whole value is that a reader can tell the difference between
"I looked and it is fine" and "I could not look". A platform that renders
both as a green tick has stopped being a scrutiny tool and become a
reassurance machine, so most of these tests are about that distinction rather
than about arithmetic.

docs/02 Part C.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.canonical import (
    Confidence,
    FindingStatus,
    Period,
    RiskDimension,
    Severity,
)
from app.engine.registry import Finding
from app.engine.scorecard import (
    Cell,
    CellStatus,
    Coverage,
    FilingScorecard,
    annual_rollup,
    build_scorecard,
)
from app.engine.tiers import ChecklistItem, DocumentCall, Tier
from app.money import TaxVector

GSTIN = "27AAPCS8928R1Z1"
APRIL = Period.parse("042025")
MAY = Period.parse("052025")


def _finding(
    rule_id: str,
    status: FindingStatus,
    *,
    period: Period | None = APRIL,
    delta: TaxVector | None = None,
    missing: tuple[str, ...] = (),
) -> Finding:
    return Finding(
        rule_id=rule_id,
        status=status,
        severity=Severity.HIGH,
        confidence=Confidence.STRONG,
        dimension=RiskDimension.CREDIT,
        title=rule_id,
        legal_basis="s.16",
        gstin=GSTIN,
        period=period,
        delta=delta or TaxVector(),
        missing_inputs=missing,
    )


class TestTheFiveStatesStayDistinct:
    def test_a_clear_check_is_a_pass(self) -> None:
        card = build_scorecard(GSTIN, APRIL, [_finding("B-08", FindingStatus.CLEAR)])
        assert card.cells[0].status is CellStatus.PASS

    def test_a_triggered_check_is_a_failure(self) -> None:
        card = build_scorecard(GSTIN, APRIL, [_finding("B-01", FindingStatus.TRIGGERED)])
        assert card.cells[0].status is CellStatus.FAIL

    @pytest.mark.golden
    def test_an_unevaluated_check_is_not_a_pass_and_names_its_gap(self) -> None:
        """The one that matters. `NOT_EVALUATED` renders separately and says
        which dataset was missing - never a tick, never a zero."""
        card = build_scorecard(
            GSTIN,
            APRIL,
            [_finding("P-15", FindingStatus.NOT_EVALUATED, missing=("ICEGATE customs feed",))],
        )
        cell = card.cells[0]
        assert cell.status is CellStatus.NOT_EVALUATED
        assert cell.status is not CellStatus.PASS
        assert cell.reason == "ICEGATE customs feed"

    def test_a_cell_that_abstains_without_a_reason_is_refused_outright(self) -> None:
        """An unexplained abstention reads as a pass to anybody scanning the
        grid, so the object will not let one be constructed."""
        with pytest.raises(ValueError, match="must name what was missing"):
            Cell(check_id="B-01", tier=Tier.AUTO, status=CellStatus.NOT_EVALUATED)

    def test_a_suppressed_check_is_neither_pass_nor_fail(self) -> None:
        """Rule 86B exempted under its proviso did not pass - it did not
        apply, and the card must show that it was considered."""
        card = build_scorecard(GSTIN, APRIL, [_finding("F-06", FindingStatus.SUPPRESSED)])
        assert card.cells[0].status is CellStatus.SUPPRESSED

    def test_a_non_applicable_check_is_not_clear(self) -> None:
        card = build_scorecard(
            GSTIN, APRIL, [], not_applicable={"L-01": "not a real-estate developer"}
        )
        assert card.cells[0].status is CellStatus.NOT_APPLICABLE
        assert card.cells[0].reason == "not a real-estate developer"


class TestAssistedChecksDoNotBecomeFindings:
    def test_a_document_call_is_its_own_state(self) -> None:
        call = DocumentCall(
            check_id="E-09",
            gstin=GSTIN,
            period=APRIL,
            document="the fixed-asset register for FY 2025-26",
            legal_basis="s.17(5)(c)",
            question="Was the works contract for plant and machinery?",
            unquantified_exposure=Decimal("450000.00"),
        )
        card = build_scorecard(GSTIN, APRIL, [], calls=[call])
        assert card.cells[0].status is CellStatus.NEEDS_DOCUMENT
        assert card.cells[0].tier is Tier.ASSISTED

    def test_open_documents_and_unquantified_exposure_are_counted(self) -> None:
        """A file with 3 findings and 18 open calls is not a clean file, and
        only the scorecard is in a position to say so."""
        calls = [
            DocumentCall(
                check_id=f"E-{n:02d}",
                gstin=GSTIN,
                period=APRIL,
                document="a document",
                legal_basis="s.17(5)",
                question="?",
                unquantified_exposure=Decimal("100000.00"),
            )
            for n in (9, 10, 12)
        ]
        card = build_scorecard(GSTIN, APRIL, [], calls=calls)
        assert card.open_documents == 3
        assert card.unquantified_exposure == Decimal("300000.00")

    def test_a_manual_check_carries_no_number(self) -> None:
        item = ChecklistItem(
            check_id="E-01",
            gstin=GSTIN,
            legal_basis="s.17(5)(a)",
            test="ITC on cars unless used for further supply",
            action="Inspect the vehicle register",
        )
        card = build_scorecard(GSTIN, APRIL, [], checklist=[item])
        assert card.cells[0].tier is Tier.MANUAL
        assert card.cells[0].delta == {}


class TestTheCardIsScopedToItsOwnPeriod:
    def test_another_period_s_finding_is_not_borrowed(self) -> None:
        card = build_scorecard(
            GSTIN,
            APRIL,
            [
                _finding("B-01", FindingStatus.TRIGGERED, period=APRIL),
                _finding("B-04", FindingStatus.TRIGGERED, period=MAY),
            ],
        )
        assert [c.check_id for c in card.cells] == ["B-01"]

    def test_an_fy_level_finding_with_no_period_lands_on_every_card(self) -> None:
        """Rule 37A and s.16(4) have no month. They are shown on the filing
        as well as in the roll-up, because the officer works a filing."""
        card = build_scorecard(
            GSTIN, APRIL, [_finding("B-07", FindingStatus.TRIGGERED, period=None)]
        )
        assert [c.check_id for c in card.cells] == ["B-07"]


class TestTheAnnualRollupIsNotTheSum:
    def test_it_says_so_in_its_own_api(self) -> None:
        """Not a comment: the screen renders this, because a twelve-column
        grid with a thirteenth column invites the reader to add up."""
        rollup = annual_rollup(GSTIN, "2025-26", [])
        assert rollup.is_the_sum_of_the_monthlies is False

    def test_fy_level_cells_are_separate_from_the_monthly_ones(self) -> None:
        monthly = [build_scorecard(GSTIN, APRIL, [_finding("B-01", FindingStatus.CLEAR)])]
        rollup = annual_rollup(
            GSTIN,
            "2025-26",
            monthly,
            [_finding("B-07", FindingStatus.TRIGGERED, period=None)],
        )
        assert [c.check_id for c in rollup.cells] == ["B-07"]
        assert [c.check_id for c in rollup.monthly[0].cells] == ["B-01"]

    def test_the_wire_form_carries_the_warning(self) -> None:
        body = annual_rollup(GSTIN, "2025-26", []).as_dict()
        assert "computed separately, not summed" in body["note"]


class TestCoverageIsThreeWayNotTwo:
    def test_nil_by_identity_is_distinguishable_from_absent(self) -> None:
        """A GSTR-1 with only B2B and CDN is not incomplete if those sum to
        the 3B total. Reporting it ABSENT abstains on a computable file."""
        card = FilingScorecard(
            gstin=GSTIN,
            period=APRIL,
            coverage={
                "gstr1_b2c": Coverage.NIL_BY_IDENTITY,
                "icegate": Coverage.ABSENT,
                "gstr2b_isd": Coverage.PRESENT_EMPTY,
            },
        )
        body = card.as_dict()
        assert body["coverage"]["gstr1_b2c"] == "NIL_BY_IDENTITY"
        assert body["coverage"]["icegate"] == "ABSENT"
        assert body["coverage"]["gstr2b_isd"] == "PRESENT_EMPTY"
