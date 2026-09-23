"""The section a sheet holds, read from its name - which never once worked.

Every pattern in `_SECTION_HINTS` is anchored on `\\b`. `_` is a word
character. So `\\bb2b\\b` cannot match `GSTR1_B2B`, which is exactly how the
portal names its sheets - and `section_from_name` returned `None` for every
sheet of every real workbook since it was written.

`_default_section` then turned that `None` into `B2B`, so on the reference
file all 11,777 parsed rows were section `B2B`: 478 credit notes, 18
amendments and 2 import lines among them.

Three things that cost, in rising order of how quiet they are:

1. `gstr1_section_coverage` reported `CDNR` as absent on a taxpayer who filed
   478 credit notes.
2. `is_amendment` is written as `section == "AMENDMENT"`, so no row in the
   database has ever carried it - and a check excluding amendments excluded
   nothing.
3. `counts_toward_2b_available` tests `section in {B2B, CDNR, ...}` precisely
   so that IMPG, IMPS and ISD credit - which sits in 3B table 4(A)(1) to (4)
   and is *not* part of the "all other ITC" bucket - stays out of the Rule 88D
   comparison. With every row labelled B2B, that filter did nothing.

On this workbook the arithmetic is unchanged: the two import rows that reached
the bucket carry no availability flag, so they were failing an earlier
condition anyway. On an importer's file it would not be unchanged.
"""

from __future__ import annotations

import pytest

from app.ingestion.sniffer import section_from_name


class TestThePortalsOwnSheetNames:
    @pytest.mark.golden
    @pytest.mark.parametrize(
        ("sheet", "section"),
        [
            ("GSTR1_B2B", "B2B"),
            ("GSTR1_CDN", "CDNR"),
            ("GSTR2B_B2B", "B2B"),
            ("GSTR2B_CDNR", "CDNR"),
            ("GSTR2B_B2BA", "AMENDMENT"),
            ("GSTR2B_CDNRA", "AMENDMENT"),
            ("GSTR2B_ISD", "ISD"),
            ("GSTR2B_ISDA", "AMENDMENT"),
            ("GSTR2B_IMPG", "IMPG"),
            ("GSTR2B_IMPGSEZ", "IMPG"),
            ("GSTR2A_B2B", "B2B"),
            ("GSTR2A_CDN", "CDNR"),
            ("GSTR2A_B2BA", "AMENDMENT"),
            ("GSTR2A_IMPGOS", "IMPG"),
        ],
    )
    def test_every_sheet_in_the_reference_workbook(self, sheet: str, section: str) -> None:
        assert section_from_name(sheet) == section

    def test_the_separator_is_the_whole_bug(self) -> None:
        """Spaces always worked. Underscores never did, and underscores are
        what the portal emits."""
        assert section_from_name("GSTR1 B2B") == section_from_name("GSTR1_B2B")
        assert section_from_name("GSTR1-B2B") == "B2B"
        assert section_from_name("GSTR1.B2B") == "B2B"


class TestTheOrderOfTheRules:
    def test_an_amendment_is_an_amendment_before_it_is_a_table(self) -> None:
        """`B2BA` contains `b2b` and `CDNRA` contains `cdnr`. The amendment
        patterns are tested first so the longer name wins, and a correction
        never folds into the table it corrects."""
        assert section_from_name("GSTR2B_B2BA") == "AMENDMENT"
        assert section_from_name("GSTR2B_CDNRA") == "AMENDMENT"

    def test_cdnur_keeps_its_own_meaning_against_cdn(self) -> None:
        """Unregistered notes are a different table from registered ones, and
        the new `cdn` pattern must not swallow them."""
        assert section_from_name("GSTR1_CDNUR") == "CDNUR"
        assert section_from_name("GSTR1_CDNR") == "CDNR"


class TestWhatItStillDoesNotKnow:
    def test_a_tds_sheet_has_no_supply_section(self) -> None:
        """GSTR-7 credit is not a supply and has no `SupplySection` member.
        `None` is the honest answer; inventing one to fill the gap is how a
        canonical enum stops meaning anything."""
        assert section_from_name("GSTR2A_TDS") is None

    def test_an_unrecognised_name_says_so(self) -> None:
        assert section_from_name("Sheet1") is None
        assert section_from_name("") is None
