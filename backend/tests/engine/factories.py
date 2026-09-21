"""Hand-built fixtures for the engine tests.

Everything is constructed explicitly so that a golden test asserts a figure a
human worked out, not a figure the generator and the engine agreed on between
themselves.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from app.canonical import FinancialYear, Period
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.records import (
    EInvoiceRecord,
    EwbRecord,
    FilingRecord,
    InwardRecord,
    LedgerRecord,
    OutwardRecord,
    Return3BRecord,
    TaxpayerData,
    TaxpayerProfile,
)
from app.money import D

# Checksum-valid, synthetic, State code 27.
GSTIN = "27AAPFU0939F1ZV"
SUPPLIER_A = "27AACCM9910C1ZN"
SUPPLIER_B = "27AAACI1195H1ZM"
BUYER_A = "27AABCT3518Q1ZW"
BUYER_B = "29AAFCD5862P1ZH"
SNAPSHOT = "snapshot-test-0001"
AS_OF = date(2026, 9, 20)


def profile(**overrides: Any) -> TaxpayerProfile:
    base: dict[str, Any] = {
        "gstin": GSTIN,
        "pan": "AAPFU0939F",
        "legal_name": "Umang Fabricators LLP",
        "trade_name": "Umang Fabricators",
        "state_code": "27",
        "registration_date": date(2017, 7, 1),
        "status": "ACTIVE",
        "aato": D("480000000"),
        "commissionerate": "Pune",
        "division": "Pune-II",
        "range_office": "Range-IV",
        "officer_id": "sto.pune.4",
        "sector_code": "72",
    }
    base.update(overrides)
    return TaxpayerProfile(**base)


def outward(
    period: Period,
    *,
    section: str = "B2B",
    doc_no: str = "INV-1",
    taxable: str = "1000000",
    igst: str = "0",
    cgst: str = "0",
    sgst: str = "0",
    cess: str = "0",
    doc_type: str = "INVOICE",
    counterparty: str | None = BUYER_A,
    pos: str = "27",
    rate: str | None = "18",
    doc_date: date | None = None,
    **overrides: Any,
) -> OutwardRecord:
    return OutwardRecord(
        gstin=GSTIN,
        period=period,
        section=section,
        doc_type=doc_type,
        doc_no=doc_no,
        doc_date=doc_date or period.first_day,
        counterparty_gstin=counterparty,
        pos=pos,
        rate=D(rate) if rate is not None else None,
        taxable_value=D(taxable),
        igst=D(igst),
        cgst=D(cgst),
        sgst=D(sgst),
        cess=D(cess),
        row_id=f"out-{period.mmyyyy}-{section}-{doc_no}",
        prov_id=f"prov-out-{period.mmyyyy}-{doc_no}",
        **overrides,
    )


def inward(
    period: Period,
    *,
    section: str = "B2B",
    doc_no: str = "PINV-1",
    taxable: str = "500000",
    igst: str = "0",
    cgst: str = "0",
    sgst: str = "0",
    cess: str = "0",
    supplier: str | None = SUPPLIER_A,
    itc_available: bool | None = True,
    ims_action: str | None = "ACCEPTED",
    doc_type: str = "INVOICE",
    **overrides: Any,
) -> InwardRecord:
    return InwardRecord(
        gstin=GSTIN,
        period=period,
        section=section,
        doc_type=doc_type,
        doc_no=doc_no,
        doc_date=period.first_day,
        supplier_gstin=supplier,
        pos="27",
        rate=D("18"),
        taxable_value=D(taxable),
        igst=D(igst),
        cgst=D(cgst),
        sgst=D(sgst),
        cess=D(cess),
        itc_available=itc_available,
        ims_action=ims_action,
        row_id=f"in-{period.mmyyyy}-{doc_no}",
        prov_id=f"prov-in-{period.mmyyyy}-{doc_no}",
        **overrides,
    )


def return_3b(period: Period, **cells: str) -> Return3BRecord:
    """Build a 3B from named cells, e.g. ``t31a_igst="180000"``."""
    return Return3BRecord(
        gstin=GSTIN,
        period=period,
        filing_date=None,
        cells={name: D(value) for name, value in cells.items()},
        prov_id=f"prov-3b-{period.mmyyyy}",
    )


def ledger(
    period: Period,
    *,
    head: str = "IGST",
    ledger_name: str = "CREDIT",
    opening: str = "0",
    credited: str = "0",
    debited: str = "0",
    closing: str | None = None,
    as_on: date | None = None,
) -> LedgerRecord:
    opening_d, credited_d, debited_d = D(opening), D(credited), D(debited)
    closing_d = D(closing) if closing is not None else opening_d + credited_d - debited_d
    return LedgerRecord(
        gstin=GSTIN,
        as_on=as_on or period.last_day,
        ledger=ledger_name,
        head=head,
        opening=opening_d,
        credited=credited_d,
        debited=debited_d,
        closing=closing_d,
        period=period,
        prov_id=f"prov-led-{period.mmyyyy}-{head}",
    )


def eway(
    period: Period,
    *,
    ewb_no: str = "301000000001",
    value: str = "1180000",
    doc_no: str = "INV-1",
    distance_km: int | None = 120,
    part_b_filled: bool = True,
    status: str = "ACTIVE",
    **overrides: Any,
) -> EwbRecord:
    return EwbRecord(
        gstin=GSTIN,
        ewb_no=ewb_no,
        ewb_date=period.first_day,
        doc_no=doc_no,
        doc_date=period.first_day,
        value=D(value),
        distance_km=distance_km,
        part_b_filled=part_b_filled,
        status=status,
        period=period,
        prov_id=f"prov-ewb-{ewb_no}",
        **overrides,
    )


def einvoice(period: Period, *, irn: str = "a" * 64, doc_no: str = "INV-1") -> EInvoiceRecord:
    return EInvoiceRecord(
        gstin=GSTIN,
        irn=irn,
        ack_date=period.first_day,
        doc_no=doc_no,
        doc_date=period.first_day,
        taxable_value=D("1000000"),
        period=period,
        prov_id=f"prov-einv-{irn[:8]}",
    )


def filing(
    period: Period,
    *,
    return_type: str = "GSTR3B",
    due: date | None = None,
    filed: date | None = None,
    status: str = "FILED",
) -> FilingRecord:
    return FilingRecord(
        gstin=GSTIN,
        return_type=return_type,
        period=period,
        due_date=due or date(period.next.year, period.next.month, 20),
        filing_date=filed,
        status=status,
    )


def data(**overrides: Any) -> TaxpayerData:
    base: dict[str, Any] = {"profile": profile()}
    base.update(overrides)
    return TaxpayerData(**base)


def context(
    taxpayer: TaxpayerData | None = None,
    *,
    fy: str = "2025-26",
    as_of: date = AS_OF,
    snapshot_id: str = SNAPSHOT,
    params: ParameterSet | None = None,
    **overrides: Any,
) -> RuleContext:
    return RuleContext(
        data=taxpayer if taxpayer is not None else data(),
        fy=FinancialYear.parse(fy),
        snapshot_id=snapshot_id,
        params=params or ParameterSet(),
        as_of=as_of,
        **overrides,
    )


JUN = Period(2025, 6)
JUL = Period(2025, 7)
DEC = Period(2025, 12)


def money(value: str) -> Decimal:
    return D(value)
