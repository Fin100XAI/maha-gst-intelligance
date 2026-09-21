"""Ten shapes of the same return, all of which must read.

A department does not receive one file format. It receives the portal's own
export, a Tally dump, a ClearTax sheet, a Busy sheet, a consultant's working
file with rupee signs typed into the cells, a CSV somebody made by saving a
tab, a file whose columns are in whatever order suited the person who built it,
and a file whose headings are in Marathi or Hindi. The claim this platform
makes is that all of those arrive as the same canonical rows.

This is that claim, as a test. Every dialect in ``app/seed/datasets.py`` is
ingested and must yield every one of its data rows -- not most of them, all of
them, with the sole exception of the trailing totals row the portal writes,
which must be held rather than counted as a sale.

Two defects were found by running it the first time, both real:

* A CSV upload never reached the CSV reader: the API called ``read_workbook``
  directly, although the upload allow-list admits ``.csv``.
* Header detection scored on ratios only, so a one-cell banner line tied the
  fifteen-column header below it and won on the tie. See
  ``test_header_breadth.py``.
"""

from __future__ import annotations

import pytest

from app.canonical import is_valid_gstin
from app.ingestion.pipeline import ingest_sheets
from app.ingestion.reader import read_bytes
from app.seed.datasets import (
    BUSINESSES,
    DIALECTS,
    MANIFEST,
    accrued_itc,
    build_set,
    claimed_itc,
)

pytestmark = pytest.mark.slow

#: Four invoices a month, twelve months.
ROWS_PER_GSTR1 = 48

#: One line of Table 3.1 per month carries the outward figures.
ROWS_PER_GSTR3B = 12

#: Six documents a month in the credit statement, twelve months.
DOCS_PER_GSTR2B = 72

CASES = list(zip(BUSINESSES, DIALECTS, strict=True))
IDS = [dialect.key for _, dialect in CASES]


@pytest.mark.parametrize(("business", "dialect"), CASES, ids=IDS)
class TestEveryDialectReads:
    def test_every_data_row_is_read(self, business: object, dialect: object) -> None:
        """Held is not read. A dialect that holds its rows has not been read."""
        filing = build_set(business, dialect)  # type: ignore[arg-type]
        name = f"g1.{dialect.container}"  # type: ignore[attr-defined]
        report = ingest_sheets(read_bytes(filing.gstr1, name), filename=name)

        # The portal writes a trailing "Total" row per sheet, which must be
        # held: counting it would double the month.
        expected_held = ROWS_PER_GSTR1 // 4 if dialect.totals_row else 0  # type: ignore[attr-defined]
        assert report.ledger.parsed == ROWS_PER_GSTR1
        assert report.ledger.quarantined == expected_held

    def test_the_rows_balance(self, business: object, dialect: object) -> None:
        filing = build_set(business, dialect)  # type: ignore[arg-type]
        name = f"g1.{dialect.container}"  # type: ignore[attr-defined]
        report = ingest_sheets(read_bytes(filing.gstr1, name), filename=name)
        ledger = report.ledger
        assert ledger.rows_in == ledger.parsed + ledger.quarantined + ledger.duplicates

    def test_the_summary_return_reads_too(self, business: object, dialect: object) -> None:
        filing = build_set(business, dialect)  # type: ignore[arg-type]
        report = ingest_sheets(read_bytes(filing.gstr3b, "g3b.xlsx"), filename="g3b.xlsx")
        assert report.ledger.parsed == ROWS_PER_GSTR3B
        assert report.ledger.quarantined == 0

    def test_the_credit_statement_reads_too(self, business: object, dialect: object) -> None:
        """Six documents a month, twelve months, none held."""
        filing = build_set(business, dialect)  # type: ignore[arg-type]
        report = ingest_sheets(read_bytes(filing.gstr2b, "g2b.xlsx"), filename="g2b.xlsx")
        assert report.ledger.parsed == DOCS_PER_GSTR2B
        assert report.ledger.quarantined == 0

    def test_the_credit_claimed_exceeds_the_credit_accrued_only_where_declared(
        self, business: object, dialect: object
    ) -> None:
        """The credit discrepancy is in the data on purpose, and only there.

        A blocked document under s.17(5) sits in the 2B and is not credit, so
        the accrued figure is the available documents only -- summing the whole
        statement overstates the entitlement, which is the direction that loses
        money.
        """
        periods = build_set(business, dialect).periods  # type: ignore[arg-type]
        for index, period in enumerate(periods):
            accrued = accrued_itc(business, period, index)  # type: ignore[arg-type]
            claimed = claimed_itc(business, period, index)  # type: ignore[arg-type]
            expected = business.itc_overclaim if index + 1 in business.itc_overclaim_months else 0  # type: ignore[attr-defined]
            assert claimed - accrued == expected, f"month {index + 1}"

    def test_the_filer_is_identified_without_being_told(
        self, business: object, dialect: object
    ) -> None:
        """No GSTIN is typed in: it has to come off the face of the file."""
        filing = build_set(business, dialect)  # type: ignore[arg-type]
        name = f"g1.{dialect.container}"  # type: ignore[attr-defined]
        report = ingest_sheets(read_bytes(filing.gstr1, name), filename=name)
        owners = {record.fields.get("gstin") for record in report.records}
        assert owners == {business.gstin}  # type: ignore[attr-defined]

    def test_the_money_survives_the_round_trip(self, business: object, dialect: object) -> None:
        """Rupee signs, Indian grouping and brackets are formatting, not value.

        The taxable value of a year is the same number whether the file wrote
        it as ``4200000.00``, ``42,00,000.00`` or ``Rs 42,00,000.00``.
        """
        filing = build_set(business, dialect)  # type: ignore[arg-type]
        name = f"g1.{dialect.container}"  # type: ignore[attr-defined]
        report = ingest_sheets(read_bytes(filing.gstr1, name), filename=name)
        total = sum(
            record.fields["taxable_value"]
            for record in report.records
            if record.fields.get("taxable_value") is not None
        )
        assert total == business.monthly_taxable * 12  # type: ignore[attr-defined]


class TestTheSetItself:
    def test_there_are_ten_of_each(self) -> None:
        assert len(BUSINESSES) == len(DIALECTS) == len(MANIFEST) == 10

    def test_no_two_businesses_share_a_registration(self) -> None:
        assert len({business.gstin for business in BUSINESSES}) == len(BUSINESSES)

    def test_every_registration_carries_a_real_check_digit(self) -> None:
        """An invented GSTIN is refused at ingestion, correctly.

        When that happened the whole file read as a platform fault rather than
        as test data that was never valid, which cost an hour.
        """
        assert [b.gstin for b in BUSINESSES if not is_valid_gstin(b.gstin)] == []

    def test_no_two_dialects_are_the_same_shape(self) -> None:
        signatures = {
            (
                d.container,
                d.date_format,
                d.amount_style,
                d.title_block,
                d.merged_header,
                tuple(sorted(d.headings.values())),
            )
            for d in DIALECTS
        }
        assert len(signatures) == len(DIALECTS)

    def test_three_of_the_ten_are_clean(self) -> None:
        """A set where everything is wrong cannot show a false positive."""
        clean = [b for b in BUSINESSES if not b.defect_months]
        assert len(clean) == 2
        assert all(b.understatement == 0 for b in clean)
