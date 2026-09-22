"""The worked case: X-01 must reproduce docs/07 Finding 1 to the paisa.

`docs/07` dissects a real GSP export and states the exposure the engine must
find. This is the pack's primary acceptance test, and the invoice sequence
below is transcribed from Finding 1 rather than read from a database, so it
commits: the figures are the spec's own published worked example.

    SSR/M/1118/25-26   21-Nov-2025   18%   3,66,75,640
    SSR/M/1147/25-26   25-Nov-2025    5%   3,66,75,640
    SSR/CNM118/25-26   26-Nov-2025   18%  (3,66,75,640)   credit note
    SSR/M/1764/25-26   25-Feb-2026    5%   3,66,75,640
    SSR/M/2019/25-26   25-Mar-2026    5%   7,33,51,280

On 21 November the supply was invoiced at **18% as a service**. Four days
later it was re-invoiced at **5%**. The next day a credit note - numbered
`CNM118`, naming invoice `1118` - cancelled the 18% document in full. Every
subsequent milestone went out at 5%.

**The exposure is every later line that adopted the lower rate**, not the two
contradicting invoices. That is the difference between Rs 47.7 lakh and
Rs 1.91 crore, and it is the mistake a careful implementation makes.

    taxable at 5%  =  3,66,75,640 + 3,66,75,640 + 7,33,51,280 = 14,67,02,560
    differential   =  14,67,02,560 x (18 - 5) / 100           =  1,90,71,332.80

`docs/07` prints Rs 1,90,71,333, which is that figure to the rupee.

Verified against the live ingestion of the same workbook on 2026-09-22: the
engine returned 19071332.80 on a taxable base of 146702560.00.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, FindingStatus, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import OutwardRecord, TaxpayerData, TaxpayerProfile
from app.engine.registry import RULES

import app.engine.rules_x  # noqa: F401  # registers X-01..X-11  # isort: skip

FILER = "27AAPCS8928R1Z1"
IWAI = "09AAATI7021F1ZW"

#: The milestone value the whole sequence is a multiple of.
MILESTONE = Decimal("36675640.00")

#: What docs/07 Finding 1 states, to the paisa.
EXPECTED_TAXABLE_AT_5 = Decimal("146702560.00")
EXPECTED_DIFFERENTIAL = Decimal("19071332.80")


def _line(
    doc_no: str,
    doc_date: date,
    rate: str,
    taxable: Decimal,
    *,
    doc_type: str = "INVOICE",
) -> OutwardRecord:
    igst = (taxable * Decimal(rate) / Decimal("100")).quantize(Decimal("0.01"))
    return OutwardRecord(
        gstin=FILER,
        period=Period.of(doc_date),
        section="B2B",
        doc_type=doc_type,
        doc_no=doc_no,
        doc_date=doc_date,
        counterparty_gstin=IWAI,
        pos="09",
        rate=Decimal(rate),
        taxable_value=taxable,
        igst=igst,
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        hsn="89079000",
        row_id=doc_no,
    )


THE_SEQUENCE: tuple[OutwardRecord, ...] = (
    _line("SSR/M/1118/25-26", date(2025, 11, 21), "18", MILESTONE),
    _line("SSR/M/1147/25-26", date(2025, 11, 25), "5", MILESTONE),
    _line("SSR/CNM118/25-26", date(2025, 11, 26), "18", MILESTONE, doc_type="CREDIT_NOTE"),
    _line("SSR/M/1764/25-26", date(2026, 2, 25), "5", MILESTONE),
    _line("SSR/M/2019/25-26", date(2026, 3, 25), "5", MILESTONE * 2),
)


@pytest.fixture
def ctx() -> RuleContext:
    return RuleContext(
        data=TaxpayerData(
            profile=TaxpayerProfile(
                gstin=FILER, pan=FILER[2:12], legal_name="SSR Marine", state_code="27"
            ),
            outward=THE_SEQUENCE,
        ),
        fy=FinancialYear(2025),
        snapshot_id="worked-case",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


class TestX01ReproducesFindingOne:
    @pytest.mark.golden
    def test_the_differential_to_the_paisa(self, ctx: RuleContext) -> None:
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == EXPECTED_DIFFERENTIAL

    def test_the_exposure_is_every_later_line_not_just_the_two(self, ctx: RuleContext) -> None:
        """The whole point of the rule. Restricting the base to the two
        contradicting invoices gives Rs 47.7 lakh instead of Rs 1.91 crore."""
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.taxable_value_effect == EXPECTED_TAXABLE_AT_5
        assert finding.taxable_value_effect > MILESTONE * 2

    def test_the_credit_note_is_not_counted_as_an_invoice(self, ctx: RuleContext) -> None:
        """CNM118 carries 18% and the milestone value. Counting it as a
        supply would add a fourth line to the base and overstate the demand."""
        (finding,) = RULES["X-01"].function(ctx)
        # Three 5% lines only: 1147, 1764 and 2019.
        assert finding.taxable_value_effect == MILESTONE + MILESTONE + MILESTONE * 2

    def test_it_routes_to_asmt_10_and_not_to_a_demand(self, ctx: RuleContext) -> None:
        """A rate dispute is a question for the contract. The taxpayer may be
        right, and a platform that jumps to DRC-01A here loses the room."""
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.suggested_form is not None
        assert finding.suggested_form.value == "ASMT-10"
        assert finding.narrative is not None
        assert "dispute" in finding.narrative

    def test_the_finding_names_the_counterparty(self, ctx: RuleContext) -> None:
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.narrative is not None
        assert IWAI in finding.narrative


class TestX01StaysQuietWhenItShould:
    def test_one_rate_throughout_is_not_a_contradiction(self) -> None:
        rows = tuple(
            _line(f"SSR/M/{n}/25-26", date(2025, 11, n), "18", MILESTONE) for n in (21, 22, 23)
        )
        ctx = RuleContext(
            data=TaxpayerData(
                profile=TaxpayerProfile(
                    gstin=FILER, pan=FILER[2:12], legal_name="x", state_code="27"
                ),
                outward=rows,
            ),
            fy=FinancialYear(2025),
            snapshot_id="s",
            params=ParameterSet(),
            as_of=date(2026, 3, 31),
        )
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_two_rates_far_apart_are_not_a_contradiction(self) -> None:
        """A rate that changes in September and stays changed is a rate
        notification, not a taxpayer contradicting itself. The window is
        thirty days precisely so this does not fire."""
        rows = (
            _line("SSR/M/1/25-26", date(2025, 4, 1), "18", MILESTONE),
            _line("SSR/M/2/25-26", date(2026, 3, 1), "5", MILESTONE),
        )
        ctx = RuleContext(
            data=TaxpayerData(
                profile=TaxpayerProfile(
                    gstin=FILER, pan=FILER[2:12], legal_name="x", state_code="27"
                ),
                outward=rows,
            ),
            fy=FinancialYear(2025),
            snapshot_id="s",
            params=ParameterSet(),
            as_of=date(2026, 3, 31),
        )
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_different_counterparties_are_never_compared(self) -> None:
        """Two customers on different rates is ordinary commerce."""
        import dataclasses

        other = dataclasses.replace(
            _line("SSR/M/9/25-26", date(2025, 11, 25), "5", MILESTONE),
            counterparty_gstin="27AAACK6801E1ZV",
        )
        rows = (THE_SEQUENCE[0], other)
        ctx = RuleContext(
            data=TaxpayerData(
                profile=TaxpayerProfile(
                    gstin=FILER, pan=FILER[2:12], legal_name="x", state_code="27"
                ),
                outward=rows,
            ),
            fy=FinancialYear(2025),
            snapshot_id="s",
            params=ParameterSet(),
            as_of=date(2026, 3, 31),
        )
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_no_outward_data_abstains_rather_than_clearing(self) -> None:
        """ "I could not look" is not "nothing found". Law 7."""
        ctx = RuleContext(
            data=TaxpayerData(
                profile=TaxpayerProfile(
                    gstin=FILER, pan=FILER[2:12], legal_name="x", state_code="27"
                )
            ),
            fy=FinancialYear(2025),
            snapshot_id="s",
            params=ParameterSet(),
            as_of=date(2026, 3, 31),
        )
        (finding,) = RULES["X-01"].function(ctx)
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert finding.missing_inputs


class TestX02TiesTheCreditNoteToItsInvoice:
    @pytest.mark.golden
    def test_the_second_limb_of_finding_one(self, ctx: RuleContext) -> None:
        """CNM118 names invoice 1118 by digit containment, and the 18%
        document it cancels was replaced at 5%. docs/07: unless IWAI reversed
        Rs 66,01,615 of ITC, the output-tax reduction is not available."""
        (finding,) = RULES["X-02"].function(ctx)
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == Decimal("6601615.20")
