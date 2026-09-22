"""The L1-L5 ladder, and the two things it must never do.

A matcher has two failure modes and they are not symmetric. Matching too
little leaves rows in ONLY-LEFT where an officer can see them. Matching too
much produces a confident pairing between two unrelated documents, and every
figure built on it is wrong in a way nothing on screen reveals.

So the counterparty must agree on every rung, and the tests below spend more
effort on what does *not* match than on what does.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.matching.keys import (
    Candidate,
    MatchLevel,
    digits_of,
    match_level,
    normalise_doc_no,
    shares_digit_run,
)

PARTY = "27ABQCS3690E1ZW"
OTHER = "27CPJPT5604K1ZD"


def _c(
    doc_no: str | None = "SSR/M/1118/25-26",
    doc_date: date | None = date(2025, 11, 21),
    value: str | None = "366756.40",
    gstin: str | None = PARTY,
) -> Candidate:
    return Candidate(
        gstin=gstin,
        doc_no=doc_no,
        doc_date=doc_date,
        taxable_value=None if value is None else Decimal(value),
    )


class TestNormalisation:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("SSR/M/0029/25-26", "SSRM292526"),
            ("SSR-M-29-25-26", "SSRM292526"),
            ("  ssr m 0029 25 26  ", "SSRM292526"),
            ("SSR#M#0029#25.26", "SSRM292526"),
        ],
    )
    def test_the_same_document_written_four_ways(self, raw: str, expected: str) -> None:
        assert normalise_doc_no(raw) == expected

    def test_two_genuinely_different_series_stay_different(self) -> None:
        assert normalise_doc_no("SSR/M/29/25-26") != normalise_doc_no("SSR/N/29/25-26")

    def test_a_non_string_normalises_to_nothing_rather_than_raising(self) -> None:
        assert normalise_doc_no(None) == ""
        assert normalise_doc_no(1118) == ""


class TestDigitContainmentSurvivesNormalisation:
    """X-02's only link between a credit note and the invoice it cancels."""

    def test_the_credit_note_from_the_worked_case(self) -> None:
        assert shares_digit_run("SSR/CNM118/25-26", "SSR/M/1118/25-26") == "118"

    def test_a_short_run_is_not_a_link(self) -> None:
        """Two digits would match half the invoice series, so runs shorter
        than three are not offered as links. `SSR/M/11/25-26` contains 11, 25
        and 26 and therefore contributes nothing: the separator splits the
        year, which is correct - `25-26` is two numbers, not `2526`."""
        assert digits_of("SSR/M/11/25-26") == []

    def test_a_run_of_three_or_more_is_offered_longest_first(self) -> None:
        assert digits_of("SSR/M/1118/2526") == ["1118", "2526"]

    def test_unrelated_numbers_share_nothing(self) -> None:
        assert shares_digit_run("SSR/M/4471/26-27", "SSR/M/1118/25-26") is None


class TestTheRungs:
    def test_l1_needs_party_number_date_and_value(self) -> None:
        assert match_level(_c(), _c()) is MatchLevel.L1_EXACT

    def test_l2_tolerates_three_days(self) -> None:
        assert (
            match_level(_c(), _c(doc_date=date(2025, 11, 24), value="1.00")) is MatchLevel.L2_STRONG
        )

    def test_l2_does_not_tolerate_four(self) -> None:
        assert (
            match_level(_c(), _c(doc_date=date(2025, 11, 25), value="1.00"))
            is MatchLevel.L5_UNMATCHED
        )

    def test_l3_matches_on_exact_value_without_a_number(self) -> None:
        assert (
            match_level(_c(), _c(doc_no="NO SERIES", doc_date=date(2025, 12, 1)))
            is MatchLevel.L3_VALUE
        )

    def test_l3_will_not_bridge_sixteen_days(self) -> None:
        assert (
            match_level(_c(), _c(doc_no="NO SERIES", doc_date=date(2025, 12, 7)))
            is MatchLevel.L5_UNMATCHED
        )

    def test_l4_forgives_two_keystrokes_and_one_percent(self) -> None:
        assert (
            match_level(_c(), _c(doc_no="SSR/M/1119/25-26", value="366800.00", doc_date=None))
            is MatchLevel.L4_FUZZY
        )

    def test_l4_does_not_forgive_three(self) -> None:
        assert (
            match_level(_c(), _c(doc_no="SSR/M/9999/25-26", value="366800.00", doc_date=None))
            is MatchLevel.L5_UNMATCHED
        )


class TestTheCounterpartyIsNeverNegotiable:
    @pytest.mark.golden
    def test_an_identical_document_from_another_party_does_not_match(self) -> None:
        """The failure that produces confident nonsense: same number, same
        date, same value, different supplier. These are two documents."""
        assert match_level(_c(), _c(gstin=OTHER)) is MatchLevel.L5_UNMATCHED

    def test_an_absent_counterparty_does_not_match_anything(self) -> None:
        assert match_level(_c(gstin=None), _c()) is MatchLevel.L5_UNMATCHED
        assert match_level(_c(), _c(gstin=None)) is MatchLevel.L5_UNMATCHED

    def test_two_absent_counterparties_are_not_a_match_either(self) -> None:
        """Import lines have no supplier GSTIN. Pairing them with each other
        on that basis would match every bill of entry to every other."""
        assert match_level(_c(gstin=None), _c(gstin=None)) is MatchLevel.L5_UNMATCHED


class TestConfidenceTravelsWithTheRung:
    def test_only_an_exact_match_is_certain(self) -> None:
        assert MatchLevel.L1_EXACT.confidence == "CERTAIN"
        assert MatchLevel.L2_STRONG.confidence == "STRONG"
        assert MatchLevel.L3_VALUE.confidence == "STRONG"

    def test_a_fuzzy_match_is_only_ever_advisory(self) -> None:
        """An edit-distance pairing may not reach a notice on its own."""
        assert MatchLevel.L4_FUZZY.confidence == "ADVISORY"
