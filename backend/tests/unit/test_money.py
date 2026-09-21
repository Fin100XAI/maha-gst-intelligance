"""Phase 0 acceptance for app.money, plus the Law 3 test that decides the design."""

from __future__ import annotations

from decimal import Decimal

import pytest

from app.money import D, MoneyCoercionError, TaxVector, dsum, inr, rupee

# ---------------------------------------------------------------------------
# D() -- coercion
# ---------------------------------------------------------------------------


@pytest.mark.golden
@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        # The four spellings named in the docs/04 Phase 0 gate.
        ("₹ 12,34,567.89", "1234567.89"),
        ("(1,000)", "-1000.00"),
        ("NIL", "0.00"),
        (None, "0.00"),
        # Portal, Tally and ClearTax spellings seen in real exports.
        ("Rs. 1,00,000", "100000.00"),
        ("INR 2500", "2500.00"),
        ("1,000-", "-1000.00"),
        ("-(2,500.50)", "-2500.50"),
        ("  45,000.5  ", "45000.50"),
        ("\u20b9\u00a01,234", "1234.00"),  # non-breaking space after the symbol
        ("-", "0.00"),
        ("N/A", "0.00"),
        ("", "0.00"),
        ("1.2E+5", "120000.00"),  # Excel scientific notation
        (0, "0.00"),
        (1500, "1500.00"),
        (Decimal("99.005"), "99.01"),  # ROUND_HALF_UP, not banker's rounding
        (Decimal("99.004"), "99.00"),
    ],
)
def test_coercion(raw: object, expected: str) -> None:
    assert D(raw) == Decimal(expected)  # type: ignore[arg-type]


def test_excel_float_keeps_the_displayed_decimal() -> None:
    """0.1 + 0.2 is the canonical float trap; D must not fall into it."""
    assert D(0.1) + D(0.2) == D("0.3")
    assert D(0.1) + D(0.2) == Decimal("0.30")
    assert D(1234.567) == Decimal("1234.57")


def test_every_result_is_quantised_to_paise() -> None:
    for raw in ["1", "1.1", "1.005", 7, Decimal("3")]:
        assert D(raw).as_tuple().exponent == -2  # type: ignore[arg-type]


def test_negative_zero_never_survives() -> None:
    """A demand rendered as -0.00 reads as a bug to an officer."""
    assert str(D("-0.001")) == "0.00"
    assert str(D(Decimal("-0.00"))) == "0.00"


@pytest.mark.parametrize(
    "raw",
    [
        "abc",
        "12.5%",
        "1,000 Cr",  # ledger direction, not a sign -- must not be guessed
        "500 Dr",
        "1..2",
        "12-34",
        True,  # a checkbox is not an amount
        object(),
        float("nan"),
        float("inf"),
    ],
)
def test_unreadable_cells_raise_rather_than_defaulting_to_zero(raw: object) -> None:
    """Law 5: nothing is silently assumed.  The ingestion layer quarantines these."""
    with pytest.raises(MoneyCoercionError):
        D(raw)  # type: ignore[arg-type]


def test_coercion_error_carries_the_original_cell() -> None:
    with pytest.raises(MoneyCoercionError) as caught:
        D("1,000 Cr")
    assert caught.value.original == "1,000 Cr"
    assert "ledger direction" in caught.value.reason


def test_dsum_of_nothing_is_decimal_zero_not_int_zero() -> None:
    total = dsum([])
    assert isinstance(total, Decimal)
    assert total == Decimal("0.00")
    assert dsum(["1,000", "(500)", "NIL", 250]) == Decimal("750.00")


# ---------------------------------------------------------------------------
# rupee() and inr()
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("raw", "expected"),
    [("1234.50", "1235.00"), ("1234.49", "1234.00"), ("-1234.50", "-1235.00"), ("0.4", "0.00")],
)
def test_s170_rounds_half_up_to_the_nearest_rupee(raw: str, expected: str) -> None:
    assert rupee(raw) == Decimal(expected)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("1234567.89", "₹ 12,34,567.89"),
        ("100000", "₹ 1,00,000.00"),
        ("-100000", "-₹ 1,00,000.00"),
        ("999", "₹ 999.00"),
        ("1000", "₹ 1,000.00"),
        ("10000000", "₹ 1,00,00,000.00"),
    ],
)
def test_indian_grouping(raw: str, expected: str) -> None:
    assert inr(raw) == expected


def test_inr_without_ornament() -> None:
    assert inr("1234567.89", symbol=False) == "12,34,567.89"
    assert inr("1234567.89", symbol=False, paise=False) == "12,34,567"


# ---------------------------------------------------------------------------
# TaxVector -- Law 3
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_law_three_is_executable() -> None:
    """The test the whole type exists for.

    A 1,00,000 IGST shortfall against a 1,00,000 CGST excess is two findings,
    not zero.  A platform that reports 'reconciled' here has failed Law 3.
    """
    delta = TaxVector(igst="100000") - TaxVector(cgst="100000")

    assert delta.total == Decimal("0.00")
    assert delta.abs_total == Decimal("200000.00")
    assert delta.is_zero() is False
    assert delta.any_nonzero() is True
    assert delta.nonzero_heads() == (
        ("igst", Decimal("100000.00")),
        ("cgst", Decimal("-100000.00")),
    )


def test_the_gate_wording_at_its_exact_numbers() -> None:
    delta = TaxVector(igst="100") - TaxVector(cgst="100")
    assert delta.total == Decimal("0")
    assert delta.abs_total == Decimal("200.00")
    assert delta.is_zero() is False


def test_arithmetic_is_head_wise() -> None:
    a = TaxVector(igst="100", cgst="50", sgst="50", cess="10")
    b = TaxVector(igst="40", cgst="10", sgst="10", cess="2")
    assert (a + b).dict() == {
        "igst": "140.00",
        "cgst": "60.00",
        "sgst": "60.00",
        "cess": "12.00",
    }
    assert (a - b).dict() == {"igst": "60.00", "cgst": "40.00", "sgst": "40.00", "cess": "8.00"}
    assert (a - a).is_zero() is True
    negated = -a
    assert -negated == a


def test_positive_and_negative_parts_split_per_head() -> None:
    delta = TaxVector(igst="100", cgst="-40", sgst="0", cess="-5")
    assert delta.positive_part().dict() == {
        "igst": "100.00",
        "cgst": "0.00",
        "sgst": "0.00",
        "cess": "0.00",
    }
    assert delta.negative_part().dict() == {
        "igst": "0.00",
        "cgst": "40.00",
        "sgst": "0.00",
        "cess": "5.00",
    }
    assert delta.positive_part() - delta.negative_part() == delta


def test_is_zero_honours_a_tolerance_but_defaults_to_exact() -> None:
    nearly = TaxVector(igst="0.40")
    assert nearly.is_zero() is False
    assert nearly.is_zero("0.50") is True
    assert nearly.is_zero("0.30") is False


def test_scale_quantises_each_head() -> None:
    reversal = TaxVector(igst="1000", cgst="333.33")
    assert reversal.scale(Decimal("0.05")).dict()["cgst"] == "16.67"


def test_wire_form_is_strings() -> None:
    """Gate G3 upstream: money never crosses the API as a JSON number."""
    payload = TaxVector(igst="1234.5").dict()
    assert payload == {"igst": "1234.50", "cgst": "0.00", "sgst": "0.00", "cess": "0.00"}
    assert all(isinstance(value, str) for value in payload.values())


def test_vector_is_immutable_and_hashable() -> None:
    vector = TaxVector(igst="10")
    with pytest.raises(AttributeError):
        vector.igst = Decimal("20")  # type: ignore[misc]
    assert {vector, TaxVector(igst="10")} == {vector}


def test_adding_a_non_vector_is_refused() -> None:
    with pytest.raises(TypeError):
        _ = TaxVector(igst="1") + Decimal("1")  # type: ignore[operator]


def test_from_mapping_rejects_an_unknown_head() -> None:
    assert TaxVector.from_mapping({"igst": "5"}).igst == Decimal("5.00")
    with pytest.raises(ValueError, match="unknown tax head"):
        TaxVector.from_mapping({"vat": "5"})


def test_str_is_head_wise_and_says_nil_when_empty() -> None:
    assert str(TaxVector()) == "nil"
    assert str(TaxVector(igst="100000")) == "IGST 1,00,000.00"
