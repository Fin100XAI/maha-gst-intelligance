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

from app.canonical import FinancialYear
from app.ingestion.pipeline import SheetOutcome, ingest_sheet
from app.ingestion.reader import RawSheet
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


class TestAnAssumedSectionIsCounted:
    """B2B is assumed when the sheet name does not name a table, and Law 7
    says an assumption is reported rather than made quietly.

    The alternative to assuming is dropping the row out of every
    section-aware check - the 4(A)(5) bucket, the coverage grid,
    `is_amendment` - and a row silently absent from a comparison is worse
    than a row read as the commonest table with a number on screen saying
    how many.
    """

    @staticmethod
    def _sheet(name: str) -> RawSheet:
        header = [
            "Month",
            "GSTIN of supplier",
            "Invoice number",
            "Invoice Date",
            "Place of supply",
            "Rate",
            "Taxable Value",
            "Integrated Tax",
            "ITC Availability",
        ]
        return RawSheet(
            name=name,
            index=0,
            rows=[
                ["", "Company GSTN : ", "27AAPCS8928R1Z1"],
                [],
                list(header),
                [
                    "October",
                    "24ABVFA2224Q1Z0",
                    "AZ/25-26/05",
                    "2025-10-04",
                    "27",
                    "18",
                    "2760000",
                    "496800",
                    "Yes",
                ],
            ],
        )

    @staticmethod
    def _run(sheet: RawSheet) -> SheetOutcome:
        """A sheet in isolation is handed the filer and the year that the
        banner and the workbook supply in a real ingest."""
        return ingest_sheet(
            sheet,
            owner_gstin="27AAPCS8928R1Z1",
            period_hint="102025",
            fy=FinancialYear(2025),
        )

    @pytest.mark.golden
    def test_a_named_sheet_assumes_nothing(self) -> None:
        outcome = self._run(self._sheet("GSTR2B_B2B"))
        assert outcome.ledger.parsed == 1
        assert outcome.sections_assumed == 0

    def test_an_unnamed_sheet_says_how_many_rows_it_assumed(self) -> None:
        """A consultant's export called `Sheet1` still carries B2B data, and
        reading it is right. Saying so is the other half."""
        outcome = self._run(self._sheet("Purchases"))
        assert outcome.ledger.parsed == 1
        assert outcome.sections_assumed == 1
        assert outcome.as_dict()["sections_assumed"] == 1

    def test_only_rows_that_actually_landed_are_counted(self) -> None:
        """The count means "rows in the store read as the default section",
        not "rows we were about to assume something about". Four rows on the
        reference workbook are assumed and then quarantined a few lines
        later; counting those would overstate it."""
        sheet = self._sheet("Purchases")
        sheet.rows.append(["October", "NOT-A-GSTIN", "", "", "", "", "", "", ""])
        outcome = self._run(sheet)
        assert outcome.ledger.quarantined == 1
        assert outcome.sections_assumed == 1
