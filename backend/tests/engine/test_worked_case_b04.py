"""B-04 must reproduce docs/07 Finding 2: Rule 37A, Rs 95,79,967.

`docs/07` calls this *"the highest-yield rule per hour of engineering"* - one
join, one column, `CERTAIN` confidence, and nothing asked of the taxpayer.
The published figures are:

    supplier's GSTR-3B FILED       4,539 records   68,83,12,916   12,23,25,431
    supplier's GSTR-3B NOT FILED     103 records    5,34,11,416       95,79,967

    29 suppliers, of which SSR SHIPYARD 27ABQCS3690E1ZW is 9 invoices
    and Rs 77,99,267 - the second-largest supplier in the file.

Measured against the ingested workbook on 2026-09-22, reading the
`GSTR-3B Filing Status` column of `GSTR2A_B2B` directly:

    'Yes'  4,539 records   688,312,916.09   122,325,430.95   442 suppliers
    'No'     103 records    53,411,416.09     9,579,967.02    29 suppliers

Exact on every figure. The fixture below is scaled down to the shape of that
data rather than reproducing four and a half thousand rows, and the ratios
that matter - which side is counted, and what an absent column means - are
asserted directly.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import FinancialYear, FindingStatus, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import InwardRecord, TaxpayerData, TaxpayerProfile
from app.engine.registry import RULES
from app.engine.runner import run_for_taxpayer  # noqa: F401  # registers every rule

FILER = "27AAPCS8928R1Z1"
SHIPYARD = "27ABQCS3690E1ZW"
SAHAY = "27CPJPT5604K1ZD"
COMPLIANT = "27AAACK6801E1ZV"


def _inward(
    supplier: str,
    taxable: str,
    igst: str,
    *,
    filed_3b: bool | None,
    doc_no: str = "INV1",
    source_form: str = "GSTR2A",
) -> InwardRecord:
    return InwardRecord(
        gstin=FILER,
        period=Period.parse("102025"),
        section="B2B",
        doc_type="INVOICE",
        doc_no=doc_no,
        doc_date=date(2025, 10, 4),
        supplier_gstin=supplier,
        pos="27",
        rate=Decimal("18"),
        taxable_value=Decimal(taxable),
        igst=Decimal(igst),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
        source_form=source_form,
        supplier_3b_filed=filed_3b,
        row_id=f"{supplier}-{doc_no}",
    )


def _ctx(rows: tuple[InwardRecord, ...]) -> RuleContext:
    return RuleContext(
        data=TaxpayerData(
            profile=TaxpayerProfile(
                gstin=FILER, pan=FILER[2:12], legal_name="SSR Marine", state_code="27"
            ),
            inward=rows,
        ),
        fy=FinancialYear(2025),
        snapshot_id="worked-case",
        params=ParameterSet(),
        as_of=date(2026, 3, 31),
    )


class TestOnlyTheDefaultingSuppliersAreCounted:
    @pytest.mark.golden
    def test_the_exposure_is_the_unfiled_side_only(self) -> None:
        ctx = _ctx(
            (
                _inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False, doc_no="SHIYARD/05"),
                _inward(SAHAY, "675137.00", "121524.70", filed_3b=False, doc_no="SR/12"),
                _inward(COMPLIANT, "6883129.00", "1223543.10", filed_3b=True, doc_no="K/900"),
            )
        )
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == Decimal("901451.40")
        assert finding.taxable_value_effect == Decimal("5008063.00")

    def test_the_compliant_supplier_is_not_in_the_figure(self) -> None:
        """The filed side is 4,539 of 4,642 records on the real file. Counting
        it would turn a Rs 95.80 lakh finding into a Rs 12.9 crore one."""
        ctx = _ctx((_inward(COMPLIANT, "6883129.00", "1223543.10", filed_3b=True),))
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.status is FindingStatus.CLEAR

    def test_the_largest_supplier_is_named(self) -> None:
        """docs/07: SSR Shipyard is the second-largest supplier in the file
        and 9 of the 103 invoices. The name is the point - it shares the
        taxpayer's own SSR branding on a different PAN."""
        ctx = _ctx(
            (
                _inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False, doc_no="SHIYARD/05"),
                _inward(SAHAY, "675137.00", "121524.70", filed_3b=False, doc_no="SR/12"),
            )
        )
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.extra["largest_supplier"] == SHIPYARD
        assert finding.narrative is not None
        assert SHIPYARD in finding.narrative


class TestAnAbsentColumnIsNotCompliance:
    @pytest.mark.golden
    def test_a_2b_only_file_abstains_rather_than_clearing(self) -> None:
        """GSTR-2B does not carry the supplier's 3B status. Treating that
        absence as "the supplier filed" would silently clear the
        highest-yield check in the rulebook on every 2B-only upload."""
        ctx = _ctx(
            (_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=None, source_form="GSTR2B"),)
        )
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.status is FindingStatus.NOT_EVALUATED
        assert finding.missing_inputs
        assert "GSTR-2A" in finding.missing_inputs[0]

    def test_a_mixed_file_reads_only_the_rows_that_state_a_status(self) -> None:
        """2A and 2B rows sit side by side after D-0075. Only the 2A rows
        can answer this question, and the 2B rows must not dilute it."""
        ctx = _ctx(
            (
                _inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False, doc_no="A/1"),
                _inward(
                    COMPLIANT,
                    "9999999.00",
                    "1799999.82",
                    filed_3b=None,
                    doc_no="B/1",
                    source_form="GSTR2B",
                ),
            )
        )
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.status is FindingStatus.TRIGGERED
        assert finding.delta.abs_total == Decimal("779926.70")


class TestWhatTheCardMustSay:
    def test_it_is_certain_because_there_is_no_band_to_argue_about(self) -> None:
        ctx = _ctx((_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False),))
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.confidence.value == "CERTAIN"

    def test_it_says_the_figure_is_gross_and_asks_for_the_working(self) -> None:
        """docs/07: the Rs 80.05 lakh August reversal cannot cover October and
        November invoices, but a Table 4(B)(2) total does not say which
        invoices it covered, so the engine must not net it."""
        ctx = _ctx((_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False),))
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.narrative is not None
        assert "GROSS" in finding.narrative
        assert "reversal working" in finding.narrative

    def test_it_routes_to_drc_01a(self) -> None:
        ctx = _ctx((_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False),))
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.suggested_form is not None
        assert finding.suggested_form.value == "DRC-01A"


class TestTheFigureCanAnswerForItself:
    """Law 2: every number carries a `calc_id` resolving to the rule.

    B-04 produced none. It is the flagship finding - Rs 98.47 lakh on the
    reference workbook - and on screen its figure wore the warning triangle
    `<Money>` puts on anything untraceable, which is exactly right and exactly
    what should never have shipped.
    """

    @pytest.mark.golden
    def test_the_finding_carries_a_trace(self) -> None:
        ctx = _ctx((_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False),))
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.trace is not None
        assert finding.trace.calc_id

    def test_the_calc_id_is_a_hash_of_the_inputs_not_the_clock(self) -> None:
        """Replay depends on it: the same snapshot, the same id, every time."""
        rows = (_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False),)
        first = RULES["B-04"].function(_ctx(rows))[0]
        second = RULES["B-04"].function(_ctx(rows))[0]
        assert first.trace is not None
        assert second.trace is not None
        assert first.trace.calc_id == second.trace.calc_id

    def test_the_formula_says_what_was_summed(self) -> None:
        ctx = _ctx((_inward(SHIPYARD, "4332926.00", "779926.70", filed_3b=False),))
        (finding,) = RULES["B-04"].function(ctx)
        assert finding.trace is not None
        assert "GSTR-3B is unfiled" in (finding.trace.formula_template or "")
