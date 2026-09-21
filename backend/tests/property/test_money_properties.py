"""Property tests for the money layer.

These say something the example tests cannot: that the invariants hold for every
input, not for the ones we happened to think of.  Phase 0 asks for three
specifically -- no float escapes, dsum associative, quantisation idempotent.
"""

from __future__ import annotations

from decimal import Decimal

from hypothesis import given, settings
from hypothesis import strategies as st

from app.money import D, TaxVector, dsum, inr

# Amounts are bounded to a range a State's revenue can actually occupy, so that
# shrinking reports a realistic counterexample rather than a 10**30 artefact.
amounts = st.decimals(
    min_value=Decimal("-1e12"),
    max_value=Decimal("1e12"),
    allow_nan=False,
    allow_infinity=False,
    places=4,
)
small_amounts = st.decimals(
    min_value=Decimal("-1e6"),
    max_value=Decimal("1e6"),
    allow_nan=False,
    allow_infinity=False,
    places=2,
)
vectors = st.builds(TaxVector, small_amounts, small_amounts, small_amounts, small_amounts)


@given(amounts)
def test_no_float_ever_escapes(value: Decimal) -> None:
    result = D(value)
    assert isinstance(result, Decimal)
    assert not isinstance(result, float)
    assert result.is_finite()


@given(amounts)
def test_quantisation_is_idempotent(value: Decimal) -> None:
    once = D(value)
    assert D(once) == once
    assert D(str(once)) == once
    assert once.as_tuple().exponent == -2


@given(st.lists(small_amounts, max_size=40))
def test_dsum_is_associative(values: list[Decimal]) -> None:
    """Splitting a total anywhere gives the same answer -- the property a
    reconciliation bridge silently depends on."""
    whole = dsum(values)
    for cut in range(len(values) + 1):
        assert dsum(values[:cut]) + dsum(values[cut:]) == whole


@given(st.lists(small_amounts, min_size=1, max_size=20))
def test_dsum_is_commutative(values: list[Decimal]) -> None:
    assert dsum(values) == dsum(sorted(values))


@given(amounts)
def test_string_round_trip(value: Decimal) -> None:
    quantised = D(value)
    assert D(format(quantised, "f")) == quantised


@given(amounts)
def test_whitespace_and_grouping_do_not_change_the_value(value: Decimal) -> None:
    quantised = D(value)
    assert D(f"  {format(quantised, 'f')}  ") == quantised
    assert D(inr(quantised, symbol=False)) == quantised
    assert D(inr(quantised, symbol=True)) == quantised


# ---------------------------------------------------------------------------
# TaxVector
# ---------------------------------------------------------------------------


@given(vectors, vectors)
def test_addition_and_subtraction_invert(a: TaxVector, b: TaxVector) -> None:
    assert (a + b) - b == a


@given(vectors, vectors, vectors)
def test_addition_is_associative(a: TaxVector, b: TaxVector, c: TaxVector) -> None:
    assert (a + b) + c == a + (b + c)


@given(vectors)
def test_abs_total_never_understates_the_breach(vector: TaxVector) -> None:
    """The Law 3 property in general form: offsetting heads can cancel in
    ``total``, but they can never cancel in ``abs_total``."""
    assert vector.abs_total >= abs(vector.total)


@given(vectors)
def test_a_vector_is_zero_only_when_every_head_is(vector: TaxVector) -> None:
    assert vector.is_zero() == all(amount == 0 for _, amount in vector.heads())


@given(vectors)
def test_positive_and_negative_parts_reconstruct_the_vector(vector: TaxVector) -> None:
    assert vector.positive_part() - vector.negative_part() == vector
    assert all(amount >= 0 for _, amount in vector.positive_part().heads())
    assert all(amount >= 0 for _, amount in vector.negative_part().heads())


@given(vectors)
@settings(max_examples=50)
def test_wire_form_is_always_strings_and_reparses(vector: TaxVector) -> None:
    payload = vector.dict()
    assert set(payload) == {"igst", "cgst", "sgst", "cess"}
    assert all(isinstance(value, str) for value in payload.values())
    assert TaxVector.from_mapping(dict(payload)) == vector  # type: ignore[arg-type]
