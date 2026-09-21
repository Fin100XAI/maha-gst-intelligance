"""A place of supply written as a State name, not a code.

The portal writes "27-Maharashtra". A compliance tool exporting the same
return writes "Maharashtra". Both name the same place, and the platform read
only the first: the second failed with "no State code found", which took
3,868 rows of the first real filed workbook -- every B2B line, every credit
note, the whole GSTR-2B.

The State table already maps code to name. Reading it the other way is the
whole fix, and it is worth doing rather than asking officers to edit their
files, because a platform that only accepts one vendor's spelling of
Maharashtra is a platform that works on one vendor's exports.
"""

from __future__ import annotations

import pytest

from app.canonical import STATE_CODES
from app.ingestion.coerce import CoercionError, coerce_state_code


class TestAStateCodeIsReadHoweverItIsWritten:
    @pytest.mark.parametrize(
        ("written", "expected"),
        [
            ("27-Maharashtra", "27"),
            ("27", "27"),
            (27, "27"),
            ("06", "06"),
            # What the whole-year exports actually write.
            ("Maharashtra", "27"),
            ("maharashtra", "27"),
            ("  Karnataka  ", "29"),
            ("Gujarat", "24"),
            ("Tamil Nadu", "33"),
            # A name with the code appended rather than prefixed.
            ("Maharashtra (27)", "27"),
        ],
    )
    def test_it_reads_the_shapes_a_return_carries(self, written: object, expected: str) -> None:
        assert coerce_state_code(written) == expected

    def test_every_state_in_the_table_resolves_by_its_own_name(self) -> None:
        """Not a sample: all forty, because one missing State loses a region."""
        for code, name in STATE_CODES.items():
            assert coerce_state_code(name) == code, name

    def test_something_that_is_not_a_place_is_still_refused(self) -> None:
        """The check must not become "accept anything"."""
        for nonsense in ("Narnia", "Maharashtre", "West"):
            with pytest.raises(CoercionError):
                coerce_state_code(nonsense)

    def test_blank_is_absent_rather_than_an_error(self) -> None:
        """A dash or "n/a" in a spreadsheet cell means empty, not wrong."""
        for blank in (None, "", "-", "n/a", "NA", "--"):
            assert coerce_state_code(blank) is None, blank
