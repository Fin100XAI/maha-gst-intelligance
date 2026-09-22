"""Coverage: the difference between a clean file and a dark one.

Law 5 rests on this. "We checked and found nothing" and "we could not check"
look identical on screen unless something says which is which, and the second
one dressed as the first is the failure mode the whole platform exists to
avoid.

Most of these tests are about `NIL_BY_IDENTITY` refusing to fire. It is the
state that turns an abstention into a decision, so a wrong one closes a file
that should have stayed open - and closed files are not reviewed.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from app.canonical import Period
from app.engine.coverage import GSTR1_SECTIONS, coverage_for, gstr1_section_coverage
from app.engine.records import (
    LedgerRecord,
    OutwardRecord,
    Return3BRecord,
    TaxpayerData,
    TaxpayerProfile,
)
from app.engine.scorecard import Coverage

GSTIN = "27AAPCS8928R1Z1"
OCT = Period.parse("102025")
NOV = Period.parse("112025")


def _outward(
    section: str, igst: str, *, doc_type: str = "INVOICE", period: Period = OCT
) -> OutwardRecord:
    return OutwardRecord(
        gstin=GSTIN,
        period=period,
        section=section,
        doc_type=doc_type,
        doc_no=f"SSR/{section}/1",
        doc_date=date(2025, 10, 4),
        counterparty_gstin="24ABVFA2224Q1Z0",
        pos="24",
        rate=Decimal("18"),
        taxable_value=Decimal(igst) * Decimal("100") / Decimal("18"),
        igst=Decimal(igst),
        cgst=Decimal("0.00"),
        sgst=Decimal("0.00"),
        cess=Decimal("0.00"),
    )


def _three_b(igst: str, *, period: Period = OCT) -> Return3BRecord:
    return Return3BRecord(
        gstin=GSTIN,
        period=period,
        cells={
            "t31a_igst": Decimal(igst),
            "t31a_cgst": Decimal("0.00"),
            "t31a_sgst": Decimal("0.00"),
            "t31a_cess": Decimal("0.00"),
        },
    )


def _data(**kw: object) -> TaxpayerData:
    return TaxpayerData(
        profile=TaxpayerProfile(
            gstin=GSTIN, pan=GSTIN[2:12], legal_name="SSR Marine", state_code="27"
        ),
        **kw,  # type: ignore[arg-type]
    )


class TestTheIdentityThatProvesTheRestIsNil:
    @pytest.mark.golden
    def test_b2b_matching_three_b_to_the_paisa_makes_the_rest_nil(self) -> None:
        """3B table 3.1 is auto-populated from GSTR-1. If what was filed sums
        to it exactly, nothing else was filed - so B2C, exports and advances
        are nil rather than unknown, and every check over them can run."""
        data = _data(
            outward=(_outward("B2B", "496800.00"),),
            returns_3b=(_three_b("496800.00"),),
        )
        out = gstr1_section_coverage(data, OCT)
        assert out["gstr1:B2B"] is Coverage.PRESENT
        assert out["gstr1:B2CS"] is Coverage.NIL_BY_IDENTITY
        assert out["gstr1:EXPWP"] is Coverage.NIL_BY_IDENTITY

    def test_a_credit_note_reduces_the_total_the_way_the_return_does(self) -> None:
        """Signed, because 3.1 is populated from the net of the return. Summing
        a credit note as positive would break the identity on every file that
        has one, and most files have one."""
        data = _data(
            outward=(
                _outward("B2B", "600000.00"),
                _outward("CDNR", "103200.00", doc_type="CREDIT_NOTE"),
            ),
            returns_3b=(_three_b("496800.00"),),
        )
        assert gstr1_section_coverage(data, OCT)["gstr1:B2CS"] is Coverage.NIL_BY_IDENTITY


class TestWhenItMustRefuse:
    def test_one_rupee_out_and_nothing_is_nil(self) -> None:
        """No tolerance, on purpose. A rupee of difference is a rupee of
        supply declared somewhere the file does not show, and calling it nil
        closes the file on it. A tolerance here would be a threshold nobody
        voted for."""
        data = _data(
            outward=(_outward("B2B", "496800.00"),),
            returns_3b=(_three_b("496801.00"),),
        )
        out = gstr1_section_coverage(data, OCT)
        assert out["gstr1:B2CS"] is Coverage.ABSENT

    def test_heads_that_net_to_zero_do_not_reconcile(self) -> None:
        """An IGST line declared as CGST plus SGST sums to the same scalar and
        is a different tax to a different government. `TaxVector` equality is
        head-wise so this cannot pass, and Law 3 requires that it cannot."""
        row = _outward("B2B", "0.00")
        split = OutwardRecord(
            **{
                **{
                    field: getattr(row, field)
                    for field in (
                        "gstin",
                        "period",
                        "section",
                        "doc_type",
                        "doc_no",
                        "doc_date",
                        "counterparty_gstin",
                        "pos",
                        "rate",
                        "taxable_value",
                    )
                },
                "igst": Decimal("0.00"),
                "cgst": Decimal("248400.00"),
                "sgst": Decimal("248400.00"),
                "cess": Decimal("0.00"),
            }
        )
        data = _data(outward=(split,), returns_3b=(_three_b("496800.00"),))
        assert gstr1_section_coverage(data, OCT)["gstr1:B2CS"] is Coverage.ABSENT

    def test_without_a_three_b_there_is_nothing_to_reconcile_against(self) -> None:
        data = _data(outward=(_outward("B2B", "496800.00"),))
        assert gstr1_section_coverage(data, OCT)["gstr1:B2CS"] is Coverage.ABSENT

    def test_an_empty_return_cannot_prove_itself_nil(self) -> None:
        """Zero equals zero, and it proves nothing: a file with no outward rows
        at all is exactly the file whose GSTR-1 might never have been uploaded.
        Reading that as "everything is nil" would clear every outward check on
        the emptiest file in the portfolio."""
        data = _data(outward=(_outward("B2B", "0.00", period=NOV),), returns_3b=(_three_b("0.00"),))
        out = gstr1_section_coverage(data, OCT)
        assert set(out.values()) == {Coverage.ABSENT}

    def test_a_taxpayer_with_no_outward_data_is_absent_everywhere(self) -> None:
        data = _data(returns_3b=(_three_b("496800.00"),))
        out = gstr1_section_coverage(data, OCT)
        assert len(out) == len(GSTR1_SECTIONS)
        assert set(out.values()) == {Coverage.ABSENT}


class TestTheOtherDatasets:
    def test_a_dataset_held_for_the_year_but_not_this_period_is_empty_not_absent(
        self,
    ) -> None:
        """Different questions for different people. `ABSENT` is a question for
        whoever did the upload; `PRESENT_EMPTY` is a question for the
        taxpayer."""
        data = _data(
            ledgers=(
                LedgerRecord(
                    gstin=GSTIN,
                    period=NOV,
                    ledger="CASH",
                    head="IGST",
                    as_on=date(2025, 11, 4),
                    opening=Decimal("0.00"),
                    credited=Decimal("100.00"),
                    debited=Decimal("0.00"),
                    closing=Decimal("100.00"),
                ),
            )
        )
        out = coverage_for(data, OCT)
        assert out["ledgers"] is Coverage.PRESENT_EMPTY
        assert coverage_for(data, NOV)["ledgers"] is Coverage.PRESENT

    def test_a_dataset_never_uploaded_is_absent(self) -> None:
        assert coverage_for(_data(), OCT)["eway_bill"] is Coverage.ABSENT

    def test_two_a_and_two_b_are_reported_separately(self) -> None:
        """They are different statements and D-0075 was the cost of pretending
        otherwise. A file with 2B and no 2A can answer entitlement and cannot
        answer Rule 37A, and the scorecard has to say so."""
        out = coverage_for(_data(), OCT)
        assert out["gstr2a"] is Coverage.ABSENT
        assert out["gstr2b"] is Coverage.ABSENT


class TestPurity:
    def test_the_same_input_gives_the_same_answer_twice(self) -> None:
        data = _data(
            outward=(_outward("B2B", "496800.00"),),
            returns_3b=(_three_b("496800.00"),),
        )
        assert coverage_for(data, OCT) == coverage_for(data, OCT)
