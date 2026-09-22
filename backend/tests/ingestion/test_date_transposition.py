"""A date column that is half strings and half datetimes, and silently wrong.

The producing tool wrote `dd-mm-yyyy` into an `mm-dd` locale. Where the day
exceeded 12 Excel could not coerce it and left a string; where the day was 12
or less it silently **transposed day and month** and stored a datetime. The
column looks fine. Every value in it with a day under 13 is a different date
from the one the taxpayer wrote.

The signature is diagnostic, and it is the whole reason this can be corrected
rather than guessed at:

    string cells   -> day > 12  ALWAYS   (Excel could not parse them)
    datetime cells -> day <= 12 ALWAYS   (Excel parsed, and swapped)

Read naively on the real SSR Marine workbook this manufactured **250 breaches
of the Rule 48(4) thirty-day e-invoice window and 314 invoices with a negative
reporting lag** - an IRN generated before its own invoice existed. A negative
lag is physically impossible, which is the tell. docs/07 Part C1.

Measured on that workbook as ingested here: 1,408 strings with days 13-31 and
635 datetimes with days 1-12, out of 2,043 rows. The document says 635 of
2,043. It matches to the row.

**Ambiguity is not corrected.** If the pattern does not hold cleanly the
column is reported AMBIGUOUS and quarantined for a human, because a wrong
correction is worse than a refusal: it is silent.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from app.ingestion.transposition import Verdict, correct_transposed, detect_transposition


def _dt(day: int, month: int) -> datetime:
    return datetime(2025, month, day)


class TestTheSignatureIsRecognised:
    @pytest.mark.golden
    def test_the_real_columns_shape_is_certain(self) -> None:
        """Strings all day > 12, datetimes all day <= 12."""
        column: list[object] = [
            "23-04-2025",
            "31-05-2025",
            "13-06-2025",
            _dt(4, 1),  # written 01-04, stored as 4 Jan
            _dt(12, 3),  # written 03-12, stored as 12 Mar
        ]
        assert detect_transposition(column) is Verdict.CERTAIN

    def test_a_clean_string_column_is_absent(self) -> None:
        assert detect_transposition(["23-04-2025", "02-05-2025"]) is Verdict.ABSENT

    def test_a_clean_datetime_column_is_absent(self) -> None:
        assert detect_transposition([_dt(23, 4), _dt(2, 5)]) is Verdict.ABSENT

    def test_a_mixed_column_that_breaks_the_pattern_is_ambiguous(self) -> None:
        """A datetime with day > 12 means Excel did NOT transpose that cell,
        so the tidy story does not hold and nothing may be corrected."""
        column: list[object] = ["23-04-2025", _dt(25, 4), _dt(3, 1)]
        assert detect_transposition(column) is Verdict.AMBIGUOUS

    def test_a_string_with_day_under_13_also_breaks_it(self) -> None:
        column: list[object] = ["03-04-2025", _dt(4, 1)]
        assert detect_transposition(column) is Verdict.AMBIGUOUS

    def test_blanks_are_ignored_rather_than_counted(self) -> None:
        column: list[object] = ["23-04-2025", None, "", "  ", _dt(4, 1)]
        assert detect_transposition(column) is Verdict.CERTAIN

    def test_a_column_with_no_dates_at_all_is_absent(self) -> None:
        assert detect_transposition(["SSR/M/1118/25-26", "not a date"]) is Verdict.ABSENT

    def test_one_sided_columns_are_absent_not_ambiguous(self) -> None:
        """Nothing is mixed, so there is nothing to correct and nothing to
        ask about. Reporting these as ambiguous would bury the real ones."""
        assert detect_transposition([_dt(4, 1), _dt(12, 3)]) is Verdict.ABSENT
        assert detect_transposition(["23-04-2025"]) is Verdict.ABSENT


class TestTheCorrectionSwapsDayAndMonth:
    def test_a_transposed_cell_is_put_back(self) -> None:
        # Written 01-04-2025 (1 April). Excel stored 4 January.
        assert correct_transposed(_dt(4, 1)) == _dt(1, 4)

    def test_a_string_cell_is_left_exactly_as_it_is(self) -> None:
        """Only the datetime cells were transposed. Touching the strings
        would introduce the very error this exists to remove."""
        assert correct_transposed("23-04-2025") == "23-04-2025"

    def test_the_swap_is_its_own_inverse(self) -> None:
        for day, month in ((4, 1), (12, 3), (1, 1), (7, 11)):
            there = correct_transposed(_dt(day, month))
            assert isinstance(there, datetime)
            assert correct_transposed(there) == _dt(day, month)

    def test_a_cell_that_cannot_be_swapped_is_returned_unchanged(self) -> None:
        """Day 25 cannot become a month. Such a cell is not transposed, and
        a column containing one is AMBIGUOUS anyway."""
        assert correct_transposed(_dt(25, 4)) == _dt(25, 4)

    def test_blanks_survive(self) -> None:
        assert correct_transposed(None) is None


class TestTheNegativeLagThatGivesItAway:
    def test_correction_removes_an_impossible_lag(self) -> None:
        """Invoice SSR/M/1439/25-26 dated 12-Jan-2026 carried an IRN date
        parsed as 01-Dec-2026: a 323-day lag out of thin air. Corrected, the
        IRN lands on the invoice date itself."""
        invoice = _dt(12, 1)
        irn_as_stored = _dt(1, 12)
        assert (irn_as_stored - invoice).days < 0 or (irn_as_stored - invoice).days > 300
        corrected = correct_transposed(irn_as_stored)
        assert isinstance(corrected, datetime)
        assert (corrected - invoice).days == 0
