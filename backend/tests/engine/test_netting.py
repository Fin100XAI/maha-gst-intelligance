"""Netting: telling a timing difference from a real shortfall.

`docs/07` Part D: April under-claimed ITC by Rs 22.67 lakh and May
over-claimed by Rs 22.01 lakh. One carry-forward event, net Rs 66,222. A
single-period engine raises a Rs 22 lakh DRC-01C on May and loses it on the
first reply, which is worse than not raising it - the taxpayer learns the
platform can be argued down.

The tests below are mostly about what must NOT net. Netting is a claim that
two discrepancies are one event, and a wrong claim in that direction
suppresses a real finding, which nobody will ever see.
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
from app.engine.netting import net_findings
from app.engine.registry import Finding
from app.money import TaxVector

GSTIN = "27AAPCS8928R1Z1"


def _f(rule_id: str, period: str, igst: str) -> Finding:
    return Finding(
        rule_id=rule_id,
        status=FindingStatus.TRIGGERED,
        severity=Severity.HIGH,
        confidence=Confidence.STRONG,
        dimension=RiskDimension.CREDIT,
        title=rule_id,
        legal_basis="Rule 88D",
        gstin=GSTIN,
        period=Period.parse(period),
        delta=TaxVector(igst=Decimal(igst)),
    )


class TestTheAprilMayCarryForward:
    @pytest.mark.golden
    def test_the_two_become_one_at_the_net(self) -> None:
        """docs/07: gross Rs 22.01 lakh, net Rs 66,222."""
        out = net_findings([_f("B-01", "042025", "-2267000"), _f("B-01", "052025", "2201000")])
        assert len(out) == 1
        assert out[0].delta.abs_total == Decimal("66000")

    def test_both_figures_survive_on_the_card(self) -> None:
        """An officer asked why Rs 22 lakh became Rs 66,000 must be able to
        see the arithmetic, not take it on trust."""
        out = net_findings([_f("B-01", "042025", "-2267000"), _f("B-01", "052025", "2201000")])
        extra = out[0].extra
        assert extra["netted"] is True
        assert extra["gross"] == "2267000.00"
        assert extra["net"] == "66000.00"
        assert extra["netted_with"] == ("042025",)

    def test_the_narrative_says_it_is_interest_not_tax(self) -> None:
        out = net_findings([_f("B-01", "042025", "-2267000"), _f("B-01", "052025", "2201000")])
        assert out[0].narrative is not None
        assert "timing difference" in out[0].narrative
        assert "s.50" in out[0].narrative


class TestWhatMustNeverNet:
    def test_two_shortfalls_in_the_same_direction_stay_two(self) -> None:
        """Two under-claims are not one event. Their total is the exposure,
        and collapsing them would halve a real demand."""
        out = net_findings([_f("B-01", "042025", "500000"), _f("B-01", "052025", "500000")])
        assert len(out) == 2

    def test_deltas_six_months_apart_are_two_events(self) -> None:
        """April and October cancelling neatly is a coincidence, not a
        carry-forward. The window exists to say so."""
        out = net_findings([_f("B-01", "042025", "-2267000"), _f("B-01", "102025", "2267000")])
        assert len(out) == 2

    def test_different_rules_never_net_against_each_other(self) -> None:
        """An ITC over-claim and an outward shortfall are unrelated however
        neatly the rupees cancel."""
        out = net_findings([_f("B-01", "042025", "-500000"), _f("G-02", "052025", "500000")])
        assert len(out) == 2

    def test_a_trivial_offset_leaves_both_findings_alone(self) -> None:
        """If netting barely changes the figure it is not a story, and
        rewriting the finding would only lose the period detail."""
        out = net_findings([_f("B-01", "042025", "-100"), _f("B-01", "052025", "500000")])
        assert len(out) == 2

    def test_an_unevaluated_finding_passes_through_untouched(self) -> None:
        """Netting reasons about figures. A check that could not run has
        none, and must not be folded into one that did."""
        dark = Finding(
            rule_id="B-01",
            status=FindingStatus.NOT_EVALUATED,
            severity=Severity.HIGH,
            confidence=Confidence.ADVISORY,
            dimension=RiskDimension.CREDIT,
            title="B-01",
            legal_basis="Rule 88D",
            gstin=GSTIN,
            period=Period.parse("062025"),
            missing_inputs=("GSTR-2B",),
        )
        out = net_findings(
            [dark, _f("B-01", "042025", "-2267000"), _f("B-01", "052025", "2201000")]
        )
        assert len(out) == 2
        assert any(f.status is FindingStatus.NOT_EVALUATED for f in out)

    def test_an_fy_level_finding_has_no_period_to_net_over(self) -> None:
        annual = Finding(
            rule_id="B-07",
            status=FindingStatus.TRIGGERED,
            severity=Severity.HIGH,
            confidence=Confidence.STRONG,
            dimension=RiskDimension.CREDIT,
            title="B-07",
            legal_basis="s.16(4)",
            gstin=GSTIN,
            period=None,
            delta=TaxVector(igst=Decimal("100000")),
        )
        assert net_findings([annual]) == [annual]


class TestDeterminism:
    def test_the_same_input_nets_the_same_way_twice(self) -> None:
        """Replay depends on it: the same snapshot must produce the same
        findings and the same calc_ids on every run."""
        findings = [_f("B-01", "042025", "-2267000"), _f("B-01", "052025", "2201000")]
        first, second = net_findings(list(findings)), net_findings(list(findings))
        assert [f.delta.dict() for f in first] == [f.delta.dict() for f in second]
        assert [f.extra for f in first] == [f.extra for f in second]
