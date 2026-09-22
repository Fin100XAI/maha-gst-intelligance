"""Load a :class:`RuleContext` from the canonical rows in the database.

This is the road between ingestion and the engine.  Without it an uploaded
return lands in the database and stops there: the rows exist, their provenance
resolves, and no rule ever sees them.

Two things this module is careful about.

**It reads only what was actually ingested.**  A taxpayer with no e-way bill
register gets an empty ``ewb`` tuple, and the rules that need one report
NOT_EVALUATED naming it.  Nothing is defaulted to zero to make a rule runnable,
because a rule that runs on invented inputs produces a finding an officer
cannot defend.

**Profile data is marked for what it is.**  Ingestion sees a return, not a
registration.  The filer's legal name, division and AATO are not in a GSTR-1,
so a taxpayer created from an upload carries ``registry_loaded=False`` and the
rules that depend on registration attributes can see that they are reading a
stub rather than the register.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from datetime import date
from decimal import Decimal
from typing import Any, Final

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.canonical import FinancialYear, Period
from app.db.models import (
    EInvoice,
    EWayBill,
    FilingStatus,
    InwardLine,
    LedgerMovement,
    OutwardLine,
    Return3B,
    Taxpayer,
)
from app.engine.context import RuleContext
from app.engine.params import ParameterSet
from app.engine.peers import PeerBands
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

__all__ = ["gstins_in_snapshot", "load_context", "load_taxpayer_data"]

_ZERO: Final[Decimal] = Decimal("0.00")

#: The GSTR-3B money columns, which become the record's ``cells`` dict.  Taken
#: from the table itself so a column added to the model is carried without an
#: edit here.
_SKIP_3B_COLUMNS: Final[frozenset[str]] = frozenset(
    {"id", "snapshot_id", "gstin", "period", "filing_date", "arn", "prov_id"}
)


def _money(value: Decimal | None) -> Decimal:
    return value if value is not None else _ZERO


def _period(value: str | None) -> Period | None:
    if not value:
        return None
    try:
        return Period.parse(value)
    except ValueError:
        return None


def gstins_in_snapshot(session: Session, snapshot_id: str) -> list[str]:
    """Every taxpayer that has at least one canonical row in this snapshot."""
    found: set[str] = set()
    for model in (OutwardLine, InwardLine, Return3B, LedgerMovement, EWayBill, EInvoice):
        rows = session.execute(
            select(model.gstin).where(model.snapshot_id == snapshot_id).distinct()
        ).scalars()
        found.update(value for value in rows if value)
    return sorted(found)


def _profile(session: Session, gstin: str) -> TaxpayerProfile:
    """The taxpayer's registration attributes, or an honest stub.

    A GSTR-1 does not carry the filer's legal name, division or turnover. When
    no registration row exists, the profile is built from what the GSTIN itself
    encodes -- the State code and the PAN -- and nothing more is invented.
    """
    row = session.get(Taxpayer, gstin)
    if row is not None:
        return TaxpayerProfile(
            gstin=row.gstin,
            pan=row.pan,
            legal_name=row.legal_name,
            state_code=row.state_code,
            trade_name=row.trade_name,
            registration_date=row.registration_date,
            cancellation_date=row.cancellation_date,
            status=row.status,
            aato=row.aato,
            qrmp=row.qrmp,
            einvoice_applicable=row.einvoice_applicable,
            sector_code=row.sector_code,
            commissionerate=row.commissionerate,
            division=row.division,
        )
    return TaxpayerProfile(
        gstin=gstin,
        pan=gstin[2:12],
        legal_name=gstin,
        state_code=gstin[:2],
    )


def _outward(session: Session, gstin: str, snapshot_id: str) -> tuple[OutwardRecord, ...]:
    rows = session.execute(
        select(OutwardLine).where(
            OutwardLine.snapshot_id == snapshot_id, OutwardLine.gstin == gstin
        )
    ).scalars()
    out: list[OutwardRecord] = []
    for row in rows:
        period = _period(row.period)
        if period is None:
            continue
        out.append(
            OutwardRecord(
                gstin=row.gstin,
                period=period,
                section=row.section or "B2B",
                doc_type=row.doc_type or "INVOICE",
                doc_no=row.doc_no,
                doc_date=row.doc_date,
                counterparty_gstin=row.counterparty_gstin,
                pos=row.pos,
                rate=row.rate,
                taxable_value=_money(row.taxable_value),
                igst=_money(row.igst),
                cgst=_money(row.cgst),
                sgst=_money(row.sgst),
                cess=_money(row.cess),
                reverse_charge=bool(row.reverse_charge),
                hsn=row.hsn,
                is_amendment=row.is_amendment,
                irn=row.irn,
                irn_date=row.irn_date,
                prov_id=row.prov_id,
                row_id=row.id,
            )
        )
    return tuple(out)


def _inward(session: Session, gstin: str, snapshot_id: str) -> tuple[InwardRecord, ...]:
    rows = session.execute(
        select(InwardLine).where(InwardLine.snapshot_id == snapshot_id, InwardLine.gstin == gstin)
    ).scalars()
    out: list[InwardRecord] = []
    for row in rows:
        period = _period(row.period)
        if period is None:
            continue
        out.append(
            InwardRecord(
                gstin=row.gstin,
                period=period,
                section=row.section or "B2B",
                doc_type=row.doc_type or "INVOICE",
                doc_no=row.doc_no,
                doc_date=row.doc_date,
                supplier_gstin=row.supplier_gstin,
                pos=row.pos,
                rate=row.rate,
                taxable_value=_money(row.taxable_value),
                igst=_money(row.igst),
                cgst=_money(row.cgst),
                sgst=_money(row.sgst),
                cess=_money(row.cess),
                # Eligibility, carried rather than dropped. Without these three
                # `counts_toward_2b_available` is False for every line, the
                # whole 2B counts as nil credit, and "ITC claimed in excess of
                # GSTR-2B" degenerates into "ITC claimed" -- which flags every
                # taxpayer at the top of the ladder and looks like a working
                # screen while doing it.
                itc_available=row.itc_available,
                supplier_3b_filed=row.supplier_3b_filed,
                source_form=row.source_form,
                itc_unavailable_reason=row.itc_unavailable_reason,
                ims_action=row.ims_action,
                # Three rules ask whether the supplier filed, and when.
                supplier_filing_date=row.supplier_filing_date,
                supplier_return_period=_period(row.supplier_return_period),
                hsn=row.hsn,
                prov_id=row.prov_id,
            )
        )
    return tuple(out)


def _returns_3b(session: Session, gstin: str, snapshot_id: str) -> tuple[Return3BRecord, ...]:
    rows = session.execute(
        select(Return3B).where(Return3B.snapshot_id == snapshot_id, Return3B.gstin == gstin)
    ).scalars()
    out: list[Return3BRecord] = []
    for row in rows:
        period = _period(row.period)
        if period is None:
            continue
        cells = {
            column.name: _money(getattr(row, column.name))
            for column in Return3B.__table__.columns
            if column.name not in _SKIP_3B_COLUMNS
        }
        out.append(
            Return3BRecord(
                gstin=row.gstin,
                period=period,
                filing_date=row.filing_date,
                arn=row.arn,
                cells=cells,
                prov_id=row.prov_id,
            )
        )
    return tuple(out)


def _ledgers(session: Session, gstin: str, snapshot_id: str) -> tuple[LedgerRecord, ...]:
    rows = session.execute(
        select(LedgerMovement).where(
            LedgerMovement.snapshot_id == snapshot_id, LedgerMovement.gstin == gstin
        )
    ).scalars()
    return tuple(
        LedgerRecord(
            gstin=row.gstin,
            as_on=row.as_on,
            ledger=row.ledger,
            head=row.head,
            opening=_money(row.opening),
            credited=_money(row.credited),
            debited=_money(row.debited),
            closing=_money(row.closing),
            period=_period(row.period),
            reference=row.reference,
            prov_id=row.prov_id,
        )
        for row in rows
        if row.as_on is not None
    )


def _ewb(session: Session, gstin: str, snapshot_id: str) -> tuple[EwbRecord, ...]:
    rows = session.execute(
        select(EWayBill).where(EWayBill.snapshot_id == snapshot_id, EWayBill.gstin == gstin)
    ).scalars()
    return tuple(
        EwbRecord(
            gstin=row.gstin,
            ewb_no=row.ewb_no,
            ewb_date=row.ewb_date,
            doc_no=row.doc_no,
            doc_date=row.doc_date,
            value=_money(row.value),
            from_gstin=row.from_gstin,
            to_gstin=row.to_gstin,
            from_state=row.from_state,
            to_state=row.to_state,
            hsn=row.hsn,
            distance_km=row.distance_km,
            vehicle_no=row.vehicle_no,
            part_b_filled=bool(row.part_b_filled),
            prov_id=row.prov_id,
        )
        for row in rows
    )


def _einvoices(session: Session, gstin: str, snapshot_id: str) -> tuple[EInvoiceRecord, ...]:
    rows = session.execute(
        select(EInvoice).where(EInvoice.snapshot_id == snapshot_id, EInvoice.gstin == gstin)
    ).scalars()
    return tuple(
        EInvoiceRecord(
            gstin=row.gstin,
            irn=row.irn,
            ack_date=row.ack_date,
            doc_no=row.doc_no,
            doc_date=row.doc_date,
            taxable_value=_money(row.taxable_value),
            igst=_money(row.igst),
            cgst=_money(row.cgst),
            sgst=_money(row.sgst),
            cess=_money(row.cess),
            status=row.status,
            prov_id=row.prov_id,
        )
        for row in rows
    )


def _filings(session: Session, gstin: str) -> tuple[FilingRecord, ...]:
    """Filing status is registration state, not snapshot content."""
    rows = session.execute(select(FilingStatus).where(FilingStatus.gstin == gstin)).scalars()
    out: list[FilingRecord] = []
    for row in rows:
        period = _period(row.period)
        if period is None:
            continue
        out.append(
            FilingRecord(
                gstin=row.gstin,
                return_type=row.return_type,
                period=period,
                due_date=row.due_date,
                filing_date=row.filing_date,
                status=row.status,
                arn=row.arn,
            )
        )
    return tuple(out)


def load_taxpayer_data(session: Session, gstin: str, snapshot_id: str) -> TaxpayerData:
    """Everything the rules may read for one taxpayer, from the database.

    A dataset that was never ingested comes back empty rather than zeroed, so
    the rules that need it report NOT_EVALUATED naming it.
    """
    return TaxpayerData(
        profile=_profile(session, gstin),
        outward=_outward(session, gstin, snapshot_id),
        inward=_inward(session, gstin, snapshot_id),
        returns_3b=_returns_3b(session, gstin, snapshot_id),
        ledgers=_ledgers(session, gstin, snapshot_id),
        ewb=_ewb(session, gstin, snapshot_id),
        einvoices=_einvoices(session, gstin, snapshot_id),
        filings=_filings(session, gstin),
    )


def load_context(
    session: Session,
    gstin: str,
    *,
    snapshot_id: str,
    fy: FinancialYear,
    as_of: date,
    params: ParameterSet | None = None,
    peers: PeerBands | None = None,
    graph: Any | None = None,
) -> RuleContext:
    """A :class:`RuleContext` over what was actually ingested."""
    return RuleContext(
        data=load_taxpayer_data(session, gstin, snapshot_id),
        fy=fy,
        snapshot_id=snapshot_id,
        params=params or ParameterSet(),
        as_of=as_of,
        peers=peers,
        graph=graph,
    )


def load_contexts(
    session: Session,
    *,
    snapshot_id: str,
    fy: FinancialYear,
    as_of: date,
    gstins: Sequence[str] | None = None,
    params: ParameterSet | None = None,
) -> Iterable[RuleContext]:
    """One context per taxpayer in the snapshot.

    Peer bands are built across the whole snapshot before any context is
    yielded, because a cohort percentile computed over a subset is not a
    percentile -- it is a comparison against whoever happened to be loaded.
    """
    subjects = list(gstins) if gstins else gstins_in_snapshot(session, snapshot_id)
    shared = params or ParameterSet()
    for gstin in subjects:
        yield load_context(
            session,
            gstin,
            snapshot_id=snapshot_id,
            fy=fy,
            as_of=as_of,
            params=shared,
        )
