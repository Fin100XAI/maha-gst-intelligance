"""The transposition detector, wired into the pipeline that reads the file.

The detector has been provably right about the reference workbook since it was
written, and provably useless, because nothing called it. These tests are
about the calling, not the detecting: `tests/ingestion/test_transposition.py`
pins the diagnosis, this pins what ingestion does with it.

Three behaviours, in order of how much damage each prevents:

1. A `CERTAIN` column is put back the way the taxpayer wrote it, before any
   rule sees it. On the reference workbook the naive read gives 250 breaches
   of the Rule 48(4) window and 314 acknowledgements dated before their own
   invoice. Both are zero once this runs. docs/07 part C1.
2. An `AMBIGUOUS` column holds only the cells whose meaning actually depends
   on the verdict, and says so with its own reason code. Quarantining the
   whole column would lose rows that were never in doubt; correcting it
   anyway would be a guess written into a statutory notice.
3. The correction is reported. A date this platform changed is a date an
   officer is entitled to be told about.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from app.ingestion.pipeline import SheetOutcome, ingest_sheet
from app.ingestion.quarantine import QuarantineReason
from app.ingestion.reader import RawSheet

GSTIN = "27AAPCS8928R1Z1"
BUYER = "24ABVFA2224Q1Z0"

HEADER = [
    "IRN",
    "Ack No",
    "Ack Date",
    "Document Number",
    "Document Date",
    "Buyer GSTIN",
    "Taxable Value",
    "Integrated Tax",
]


def _sheet(ack_cells: list[object], *, name: str = "EINVOICE") -> RawSheet:
    """One e-invoice sheet whose Ack Date column is whatever is handed in.

    Document Date is a plain string throughout, so it is never itself in
    doubt and the assertions are about the Ack Date column alone.
    """
    rows: list[list[object]] = [
        ["", "Company Name : ", "SSR MARINE SERVICES PRIVATE LIMITED"],
        ["", "Company GSTN : ", GSTIN],
        [],
        list(HEADER),
    ]
    for n, ack in enumerate(ack_cells, start=1):
        rows.append(
            [
                f"{n:064d}",
                f"11200{n:04d}",
                ack,
                f"SSR/25-26/{n:03d}",
                "01-10-2025",
                BUYER,
                "2760000",
                "496800",
            ]
        )
    return RawSheet(name=name, index=0, rows=rows)


def _run(sheet: RawSheet) -> SheetOutcome:
    """The banner and the sheet name carry the filer and the period on a real
    workbook; a single sheet in isolation is handed both."""
    return ingest_sheet(sheet, owner_gstin=GSTIN, period_hint="102025")


def _ack_dates(outcome: SheetOutcome) -> list[Any]:
    return [record.fields.get("ack_date") for record in outcome.records]


class TestACertainColumnIsPutBack:
    @pytest.mark.golden
    def test_the_parsed_cells_have_day_and_month_swapped_back(self) -> None:
        """`2025-10-04` in an mm-dd locale is what `04-10-2025` became. The
        taxpayer wrote 4 October; Excel stored 10 April."""
        outcome = _run(
            _sheet(
                [
                    "13-10-2025",  # day 13: Excel could not parse it, so it is text
                    "27-10-2025",
                    datetime(2025, 10, 4),  # an Excel cell carries no zone
                ]
            )
        )
        assert outcome.ledger.parsed == 3
        assert _ack_dates(outcome)[2].isoformat() == "2025-04-10"

    def test_the_text_cells_are_left_exactly_as_they_are(self) -> None:
        """They were never parsed, so they already say what the taxpayer
        wrote. Rewriting them would introduce the very error this removes."""
        outcome = _run(_sheet(["13-10-2025", "27-10-2025", datetime(2025, 10, 4)]))
        assert [d.isoformat() for d in _ack_dates(outcome)[:2]] == [
            "2025-10-13",
            "2025-10-27",
        ]

    def test_nothing_is_lost_or_held(self) -> None:
        outcome = _run(_sheet(["13-10-2025", datetime(2025, 10, 4)]))
        assert outcome.ledger.reconciles()
        assert outcome.ledger.quarantined == 0

    def test_the_correction_is_reported_and_counted(self) -> None:
        """Not applied silently. The reporting lag computed from this date is
        what a Rule 48(4) notice would be built on."""
        outcome = _run(
            _sheet(
                [
                    "13-10-2025",
                    datetime(2025, 10, 4),
                    datetime(2025, 11, 2),
                ]
            )
        )
        assert outcome.date_corrections["ack_date"] == {
            "verdict": "CERTAIN",
            "cells_corrected": 2,
            "cells_held": 0,
        }
        assert outcome.as_dict()["date_corrections"]["ack_date"]["cells_corrected"] == 2


class TestAnAmbiguousColumnIsNotGuessedAt:
    @pytest.mark.golden
    def test_only_the_cells_that_could_have_been_swapped_are_held(self) -> None:
        """A text cell with a day of 12 or less breaks the explanation: Excel
        could have parsed it and did not. The column is then unexplained, but
        the parsed cell with day 20 still cannot be a swap - there is no month
        20 - so it is read, and only the genuinely undecidable cell is held."""
        outcome = _run(
            _sheet(
                [
                    "05-10-2025",  # day 5, stored as text: nothing explains this
                    datetime(2025, 10, 20),  # day 20, cannot be a swap
                    datetime(2025, 10, 4),  # day 4, could be either
                ]
            )
        )
        assert outcome.ledger.parsed == 2
        assert outcome.ledger.quarantined == 1
        assert outcome.ledger.reconciles()

    def test_the_held_row_says_why_in_its_own_reason_code(self) -> None:
        outcome = _run(_sheet(["05-10-2025", datetime(2025, 10, 4)]))
        (held,) = outcome.ledger.quarantined_rows
        assert held.reason_code is QuarantineReason.DATE_TRANSPOSITION_AMBIGUOUS
        assert held.field_name == "ack_date"
        assert "will not choose" in held.reason

    def test_the_officer_sees_the_cell_the_file_actually_holds(self) -> None:
        """Provenance: the quarantine card shows the source cell, not the
        platform's reading of it, because the reading is the thing in doubt."""
        outcome = _run(_sheet(["05-10-2025", datetime(2025, 10, 4)]))
        (held,) = outcome.ledger.quarantined_rows
        assert "2025-10-04" in str(held.original_cells["Ack Date"])

    def test_no_cell_in_an_ambiguous_column_is_corrected(self) -> None:
        outcome = _run(
            _sheet(
                [
                    "05-10-2025",
                    datetime(2025, 10, 20),
                    datetime(2025, 10, 4),
                ]
            )
        )
        assert outcome.date_corrections["ack_date"] == {
            "verdict": "AMBIGUOUS",
            "cells_corrected": 0,
            "cells_held": 1,
        }
        assert _ack_dates(outcome)[1].isoformat() == "2025-10-20"


class TestAnOrdinaryColumnIsUntouched:
    def test_an_all_text_column_reports_nothing(self) -> None:
        """The overwhelmingly common case. A detector that announced itself on
        a clean file would be noise, and noise is how a real correction gets
        scrolled past."""
        outcome = _run(_sheet(["04-10-2025", "13-10-2025", "27-10-2025"]))
        assert outcome.date_corrections == {}
        assert [d.isoformat() for d in _ack_dates(outcome)] == [
            "2025-10-04",
            "2025-10-13",
            "2025-10-27",
        ]

    def test_an_all_datetime_column_is_not_a_mixed_column(self) -> None:
        """Nothing partitions, so nothing is diagnosable. A locale that parsed
        every cell leaves no evidence in the column at all, and inventing some
        would be the worst outcome available."""
        outcome = _run(
            _sheet(
                [
                    datetime(2025, 10, 4),
                    datetime(2025, 10, 8),
                ]
            )
        )
        assert outcome.date_corrections == {}
        assert _ack_dates(outcome)[0].isoformat() == "2025-10-04"


class TestTheOrderItRunsIn:
    def test_a_totals_row_is_a_totals_row_before_it_is_a_date_problem(self) -> None:
        """Two true statements about the same row; only one of them tells an
        officer what to do next."""
        sheet = _sheet(["05-10-2025", datetime(2025, 10, 4)])
        sheet.rows.append(["Total", "", datetime(2025, 10, 6), "", "", "", "5520000", "993600"])
        outcome = _run(sheet)
        codes = {row.reason_code for row in outcome.ledger.quarantined_rows}
        assert QuarantineReason.TOTALS_ROW in codes


class TestTheRowVouchesWhenTheColumnCannot:
    """`irn_date` is handed its row's `doc_date` as a witness.

    On the reference workbook this is the difference between five credit notes
    stored with a wrong date and nobody knowing, and all fourteen corrected:
    `GSTR2A_CDN` has no text cell at all, so the column-partition signature is
    silent on it while every value in it is still swapped.
    """

    @staticmethod
    def _sheet(irn_cells: list[object], doc_cells: list[str]) -> RawSheet:
        header = ["IRN", "Ack No", "IRN Date", "Document Number", "Document Date"]
        rows: list[list[object]] = [
            ["", "Company GSTN : ", GSTIN],
            [],
            list(header),
        ]
        for n, (irn, doc) in enumerate(zip(irn_cells, doc_cells, strict=True), start=1):
            rows.append([f"{n:064d}", f"11200{n:04d}", irn, f"CN/25-26/{n:03d}", doc])
        return RawSheet(name="EINVOICE", index=0, rows=rows)

    @pytest.mark.golden
    def test_an_all_datetime_column_is_still_put_back(self) -> None:
        """Every cell parsed, nothing left as text, and nine of fourteen
        acknowledged before they were issued. The column cannot say so; the
        rows can."""
        outcome = ingest_sheet(
            self._sheet(
                [datetime(2025, 3, 5), datetime(2025, 6, 10), datetime(2025, 4, 8)],
                ["28-04-2025", "26-09-2025", "02-08-2025"],
            ),
            owner_gstin=GSTIN,
            period_hint="102025",
        )
        assert outcome.date_corrections["irn_date"]["verdict"] == "CERTAIN"
        assert outcome.date_corrections["irn_date"]["cells_corrected"] == 3
        assert [r.fields["irn_date"].isoformat() for r in outcome.records] == [
            "2025-05-03",
            "2025-10-06",
            "2025-08-04",
        ]

    def test_a_column_nothing_contradicts_is_left_alone(self) -> None:
        """A small all-datetime column that is simply correct offers no
        evidence, and no evidence means no correction."""
        outcome = ingest_sheet(
            self._sheet(
                [datetime(2025, 3, 5), datetime(2025, 6, 10)],
                ["01-03-2025", "02-06-2025"],
            ),
            owner_gstin=GSTIN,
            period_hint="102025",
        )
        assert outcome.date_corrections == {}
        assert outcome.records[0].fields["irn_date"].isoformat() == "2025-03-05"
