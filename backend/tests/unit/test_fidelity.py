"""Gate G10 -- the adversarial agent test.  Build-breaking.

The model is prompted to invent a figure and the response must be rejected.
A middleware nobody has watched reject something is a middleware nobody knows
works, so most of this file is attempts to smuggle a number past it.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.agents.fidelity import (
    FidelityError,
    check_completion,
    extract_numbers,
    normalise_number,
)

TOOL_RESULTS = {
    "finding": {
        "rule_id": "ITC-02",
        "delta": {"igst": "2210000.00", "cgst": "816055.00", "sgst": "816055.00"},
        "delta_total": "3842110.00",
        "suppliers": 14,
        "invoices": 212,
        "calc_id": "a" * 64,
    },
    "period": "062025",
}


# ---------------------------------------------------------------------------
# what must pass
# ---------------------------------------------------------------------------


class TestGroundedCompletions:
    def test_a_figure_taken_from_the_tool_results_passes(self) -> None:
        report = check_completion(
            "The required reversal is 3842110.00 across 14 suppliers.",
            tool_results=TOOL_RESULTS,
        )
        assert report.ok, report.as_dict()

    def test_indian_formatting_of_a_grounded_figure_passes(self) -> None:
        """The model may format a figure for an Indian reader.  It may not
        change it."""
        report = check_completion(
            "The required reversal is 38,42,110.00 (IGST 22,10,000.00).",
            tool_results=TOOL_RESULTS,
        )
        assert report.ok, report.as_dict()

    def test_statutory_citations_are_not_figures(self) -> None:
        report = check_completion(
            "Reversal is required under Rule 37A read with section 16(2)(c), and the "
            "credit was claimed in Table 4(A)(5) of GSTR-3B. Form DRC-01A applies.",
            tool_results={},
        )
        assert report.ok, report.as_dict()

    def test_a_year_is_not_a_figure(self) -> None:
        report = check_completion(
            "The CGST Act, 2017 applies; the period falls in 2025.", tool_results={}
        )
        assert report.ok, report.as_dict()

    def test_a_calc_chip_grounds_the_figure_that_follows_it(self) -> None:
        chip = "[[calc:" + "b" * 64 + "]]"
        report = check_completion(
            f"The shortfall is {chip} 9876543.21 for the period.", tool_results={}
        )
        assert report.ok, report.as_dict()
        assert report.calc_ids == ("b" * 64,)


# ---------------------------------------------------------------------------
# what must fail -- the adversarial half
# ---------------------------------------------------------------------------


class TestInventedFigures:
    @pytest.mark.golden
    def test_an_invented_figure_is_rejected(self) -> None:
        """The build-breaking case: prompted to invent, the response is refused."""
        report = check_completion(
            "The required reversal is approximately 4200000.00, which I estimate "
            "from the pattern of the invoices.",
            tool_results=TOOL_RESULTS,
        )
        assert report.ok is False
        assert any(u.normalised == "4200000" for u in report.untraceable)
        with pytest.raises(FidelityError):
            report.raise_for_status()

    @pytest.mark.golden
    def test_a_figure_that_is_almost_right_is_still_rejected(self) -> None:
        """One digit off is the dangerous case: it looks right on screen."""
        report = check_completion(
            "The required reversal is 38,42,100.00.", tool_results=TOOL_RESULTS
        )
        assert report.ok is False

    @pytest.mark.golden
    def test_arithmetic_the_model_did_itself_is_rejected(self) -> None:
        """22,10,000 + 8,16,055 + 8,16,055 is 38,42,110 -- but the model is not
        allowed to be the one who added them up."""
        report = check_completion(
            "IGST 2210000.00 plus CGST 816055.00 plus SGST 816055.00 comes to 3842111.00 in total.",
            tool_results=TOOL_RESULTS,
        )
        assert report.ok is False
        assert any(u.normalised == "3842111" for u in report.untraceable)

    def test_a_percentage_it_computed_is_rejected(self) -> None:
        report = check_completion(
            "That is 23.7% of the declared liability.", tool_results=TOOL_RESULTS
        )
        assert report.ok is False

    def test_an_invented_count_is_rejected(self) -> None:
        report = check_completion("There were 17 suppliers involved.", tool_results=TOOL_RESULTS)
        assert report.ok is False
        assert any(u.normalised == "17" for u in report.untraceable)

    def test_a_fabricated_figure_beside_a_real_one_is_still_caught(self) -> None:
        report = check_completion(
            "The reversal of 3842110.00 attracts interest of 512000.00.",
            tool_results=TOOL_RESULTS,
        )
        assert report.ok is False
        assert [u.normalised for u in report.untraceable] == ["512000"]

    def test_the_error_names_the_offending_value_and_its_context(self) -> None:
        report = check_completion("Interest of 512000.00 is payable.", tool_results=TOOL_RESULTS)
        with pytest.raises(FidelityError) as caught:
            report.raise_for_status()
        assert "512000" in str(caught.value)
        assert caught.value.report.untraceable[0].context


# ---------------------------------------------------------------------------
# the scanner itself
# ---------------------------------------------------------------------------


class TestScanner:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("38,42,110.00", "3842110.00"),
            ("3842110", "3842110"),
            ("0.5", "0.5"),
            ("1,000", "1000"),
        ],
    )
    def test_normalisation_compares_on_value_not_spelling(self, raw: str, expected: str) -> None:
        assert normalise_number(raw) == normalise_number(expected)

    def test_large_values_do_not_come_back_in_scientific_notation(self) -> None:
        assert normalise_number("38,42,110") == "3842110"
        assert "E" not in normalise_number("100000000")

    def test_numbers_are_found_with_their_offsets(self) -> None:
        found = extract_numbers("a 12 b 3,456.78")
        assert [value for value, _ in found] == ["12", "3,456.78"]

    def test_a_decimal_in_the_tool_results_grounds_a_figure(self) -> None:
        report = check_completion(
            "The amount is 1234.50.", tool_results={"amount": Decimal("1234.50")}
        )
        assert report.ok

    def test_a_nested_tool_result_still_grounds(self) -> None:
        report = check_completion(
            "Across 212 invoices.",
            tool_results={"outer": [{"inner": {"invoices": 212}}]},
        )
        assert report.ok

    def test_an_empty_completion_passes_trivially(self) -> None:
        report = check_completion("No figures here.", tool_results={})
        assert report.ok
        assert report.checked == 0
