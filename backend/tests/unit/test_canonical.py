"""Phase 0 acceptance for app.canonical: GSTIN, Period, statutory dates."""

from __future__ import annotations

from datetime import date

import pytest

from app.canonical import (
    UNCONFIGURED,
    FinancialYear,
    GstinError,
    Period,
    Regime,
    ReturnType,
    UnconfiguredStatutoryParameterError,
    days_late,
    due_date,
    gstin_checksum,
    is_intrastate,
    is_valid_gstin,
    pan_of,
    state_name,
    three_year_bar,
    validate_gstin,
)

VALID = "27AAPFU0939F1ZV"
ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


# ---------------------------------------------------------------------------
# GSTIN
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_the_gate_gstin_is_valid() -> None:
    assert validate_gstin(VALID) == VALID
    assert pan_of(VALID) == "AAPFU0939F"


def test_normalisation_before_validation() -> None:
    assert validate_gstin("  27aapfu0939f1zv ") == VALID
    assert validate_gstin("27 AAPFU0939F 1ZV") == VALID


@pytest.mark.golden
def test_every_single_character_mutation_is_rejected_with_a_reason() -> None:
    """A structurally valid GSTIN failing checksum is the fabricated-supplier
    signature, so the checksum is not optional and the reason is specific."""
    rejected = 0
    for index in range(15):
        for char in ALPHABET:
            candidate = VALID[:index] + char + VALID[index + 1 :]
            if candidate == VALID:
                continue
            with pytest.raises(GstinError) as caught:
                validate_gstin(candidate)
            assert caught.value.reason
            rejected += 1
    assert rejected == 15 * 36 - 15


@pytest.mark.parametrize(
    ("candidate", "fragment"),
    [
        ("27AAPFU0939F1ZX", "checksum"),
        ("27AAPFU0939F1YV", "14th character"),  # the literal Z is missing
        ("99AAPFU0939F1ZV", "checksum"),
        ("27AAPFU0939F1Z", "length"),
        ("27AAPFU0939F1ZVV", "length"),
        ("00AAPFU0939F1ZG", "State code"),
    ],
)
def test_rejection_reasons_are_specific(candidate: str, fragment: str) -> None:
    with pytest.raises(GstinError) as caught:
        validate_gstin(candidate)
    assert fragment.lower() in caught.value.reason.lower()


def test_checksum_is_computed_not_looked_up() -> None:
    assert gstin_checksum(VALID[:14]) == "V"
    with pytest.raises(ValueError, match="14 characters"):
        gstin_checksum("SHORT")


def test_is_valid_gstin_never_raises() -> None:
    assert is_valid_gstin(VALID) is True
    assert is_valid_gstin("rubbish") is False


# ---------------------------------------------------------------------------
# State codes and place of supply
# ---------------------------------------------------------------------------


def test_state_codes() -> None:
    assert state_name("27") == "Maharashtra"
    with pytest.raises(ValueError, match="unknown State code"):
        state_name("00")


def test_is_intrastate_decides_which_government_gets_the_money() -> None:
    assert is_intrastate("27", "27") is True
    assert is_intrastate("27", "29") is False
    with pytest.raises(ValueError):
        is_intrastate("27", "00")


# ---------------------------------------------------------------------------
# Period
# ---------------------------------------------------------------------------


@pytest.mark.golden
@pytest.mark.parametrize(
    "spelling",
    [
        "062025",
        "06-2025",
        "06/2025",
        "6-2025",
        "2025-06",
        "2025-06-15",
        "Jun-2025",
        "JUN 2025",
        "June 2025",
        "2025-Jun",
    ],
)
def test_every_spelling_parses_to_the_same_period(spelling: str) -> None:
    assert Period.parse(spelling) == Period(2025, 6)


def test_period_identity_and_financial_year() -> None:
    period = Period(2025, 6)
    assert period.mmyyyy == "062025"
    assert str(period) == "062025"
    assert period.label == "Jun 2025"
    assert period.fy == "2025-26"
    assert period.financial_year == FinancialYear(2025)


@pytest.mark.parametrize(
    ("year", "month", "fy"),
    [(2025, 4, "2025-26"), (2026, 3, "2025-26"), (2026, 4, "2026-27"), (2025, 1, "2024-25")],
)
def test_financial_year_boundary_is_april(year: int, month: int, fy: str) -> None:
    assert Period(year, month).fy == fy


@pytest.mark.parametrize(
    ("month", "quarter"), [(4, 1), (6, 1), (7, 2), (9, 2), (10, 3), (12, 3), (1, 4), (3, 4)]
)
def test_quarters_are_financial_not_calendar(month: int, quarter: int) -> None:
    assert Period(2025, month).quarter == quarter


def test_period_arithmetic() -> None:
    period = Period(2025, 6)
    assert period.next == Period(2025, 7)
    assert period.prev == Period(2025, 5)
    assert period.plus(7) == Period(2026, 1)
    assert period.plus(-6) == Period(2024, 12)
    assert Period(2026, 3).months_since(Period(2025, 4)) == 11
    assert Period(2025, 4).months_since(Period(2026, 3)) == -11


def test_period_bounds() -> None:
    assert Period(2025, 6).first_day == date(2025, 6, 1)
    assert Period(2025, 6).last_day == date(2025, 6, 30)
    assert Period(2025, 2).last_day == date(2025, 2, 28)
    assert Period(2024, 2).last_day == date(2024, 2, 29)


def test_periods_order_and_hash() -> None:
    assert Period(2025, 6) < Period(2025, 7) < Period(2026, 1)
    assert len({Period(2025, 6), Period(2025, 6)}) == 1


@pytest.mark.parametrize("spelling", ["", "13-2025", "Jun-1999", "Smarch 2025", "20250601"])
def test_unreadable_periods_raise(spelling: str) -> None:
    with pytest.raises(ValueError):
        Period.parse(spelling)


@pytest.mark.golden
def test_the_hard_lock_regime_boundary_is_july_2025() -> None:
    """A GSTR-1 vs 3B mismatch after the lock is a far stronger signal, so the
    regime is carried on every period rather than inferred later."""
    assert Period(2025, 6).regime is Regime.PRE_HARD_LOCK
    assert Period(2025, 7).regime is Regime.POST_HARD_LOCK
    assert Period(2025, 8).regime is Regime.POST_HARD_LOCK


def test_financial_year_helpers() -> None:
    fy = FinancialYear.parse("2025-26")
    assert fy.label == "2025-26"
    assert fy.start == date(2025, 4, 1)
    assert fy.end == date(2026, 3, 31)
    assert len(fy.periods) == 12
    assert fy.periods[0] == Period(2025, 4)
    assert fy.periods[-1] == Period(2026, 3)
    assert fy.annual_return_due_date == date(2026, 12, 31)


# ---------------------------------------------------------------------------
# Statutory dates
# ---------------------------------------------------------------------------


@pytest.mark.golden
def test_the_gate_due_dates() -> None:
    assert due_date(ReturnType.GSTR3B, Period(2025, 6)) == date(2025, 7, 20)
    assert due_date(ReturnType.GSTR3B, Period(2025, 6), qrmp=True, state_code="27") == date(
        2025, 7, 22
    )


def test_monthly_due_dates_stated_by_the_spec() -> None:
    assert due_date(ReturnType.GSTR1, Period(2025, 6)) == date(2025, 7, 11)
    assert due_date(ReturnType.GSTR1A, Period(2025, 6)) == date(2025, 7, 13)
    assert due_date(ReturnType.GSTR3B, Period(2025, 12)) == date(2026, 1, 20)


def test_qrmp_state_category_changes_the_day() -> None:
    assert due_date(ReturnType.GSTR3B, Period(2025, 6), qrmp=True, state_code="19") == date(
        2025, 7, 24
    )
    with pytest.raises(ValueError, match="not a quarter end"):
        due_date(ReturnType.GSTR3B, Period(2025, 5), qrmp=True, state_code="27")
    with pytest.raises(ValueError, match="state_code"):
        due_date(ReturnType.GSTR3B, Period(2025, 6), qrmp=True)


def test_annual_returns_are_due_on_31_december_of_the_following_fy() -> None:
    assert due_date(ReturnType.GSTR9, FinancialYear(2025)) == date(2026, 12, 31)
    assert due_date(ReturnType.GSTR9C, Period(2025, 6)) == date(2026, 12, 31)


def test_gstr2b_is_generated_not_filed() -> None:
    with pytest.raises(ValueError, match="no due date"):
        due_date(ReturnType.GSTR2B, Period(2025, 6))


@pytest.mark.golden
@pytest.mark.parametrize(
    "return_type",
    [ReturnType.GSTR5, ReturnType.GSTR6, ReturnType.GSTR7, ReturnType.GSTR8, ReturnType.ITC04],
)
def test_a_due_date_the_spec_does_not_state_is_refused_not_guessed(
    return_type: ReturnType,
) -> None:
    """Never invent a due date.  An unconfigured one surfaces in admin instead."""
    with pytest.raises(UnconfiguredStatutoryParameterError) as caught:
        due_date(return_type, Period(2025, 6))
    assert caught.value.todo_ref
    assert "TODO(statute)" in str(caught.value)


def test_every_known_gap_is_listed_for_the_admin_screen() -> None:
    ids = {entry.parameter_id for entry in UNCONFIGURED}
    assert "due_date.GSTR7" in ids
    assert "qrmp.state_category" in ids
    assert all(entry.missing and entry.todo_ref for entry in UNCONFIGURED)


def test_days_late_uses_the_injected_date_never_the_clock() -> None:
    due = date(2025, 7, 20)
    assert days_late(due, date(2025, 7, 25), as_of=date(2026, 1, 1)) == 5
    assert days_late(due, date(2025, 7, 18), as_of=date(2026, 1, 1)) == 0
    # Unfiled: the count runs to the injected as_of, so a replay is stable.
    assert days_late(due, None, as_of=date(2025, 8, 20)) == 31


@pytest.mark.golden
def test_the_three_year_bar() -> None:
    """A return due 20-Jul-2022 is barred from 20-Jul-2025; the only route left
    is a s.62 best-judgement assessment."""
    assert three_year_bar(date(2022, 7, 20)) == date(2025, 7, 20)
    assert three_year_bar(date(2024, 2, 29)) == date(2027, 2, 28)
