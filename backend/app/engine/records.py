"""The immutable records the engine computes over.

These are deliberately *not* the SQLAlchemy models.  A rule that held an ORM
object could lazy-load, which is a database call, which makes the rule impure
and the run unreplayable.  The loader builds these at the edge; from there
inwards there is no session, no clock and no network.

Every record carries ``prov_id`` -- the pointer to the file, sheet, row and
original cells behind it.  That is what a finding cites as its evidence.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import Period
from app.money import TaxVector

__all__ = [
    "EInvoiceRecord",
    "EwbRecord",
    "FilingRecord",
    "InwardRecord",
    "LedgerRecord",
    "OutwardRecord",
    "Return3BRecord",
    "TaxpayerData",
    "TaxpayerProfile",
]

_ZERO: Final[Decimal] = Decimal("0.00")

#: GSTR-1 sections whose tax counts toward the outward liability identity (R1).
#: 3.1(d) inward RCM is deliberately absent -- see Return3BRecord.outward_tax.
LIABILITY_SECTIONS: Final[frozenset[str]] = frozenset(
    {"B2B", "B2CL", "B2CS", "EXPWP", "SEZWP", "CDNR", "CDNUR", "ECOM_9_5", "AMENDMENT"}
)

#: Credit notes reduce the liability; debit notes raise it.  The sign is applied
#: at the identity layer, never written into the row.
_NEGATIVE_DOCS: Final[frozenset[str]] = frozenset({"CREDIT_NOTE"})


@dataclass(frozen=True, slots=True)
class OutwardRecord:
    gstin: str
    period: Period
    section: str
    doc_type: str
    doc_no: str | None
    doc_date: date | None
    counterparty_gstin: str | None
    pos: str | None
    rate: Decimal | None
    taxable_value: Decimal
    igst: Decimal
    cgst: Decimal
    sgst: Decimal
    cess: Decimal
    reverse_charge: bool = False
    hsn: str | None = None
    uqc: str | None = None
    quantity: Decimal | None = None
    ecom_gstin: str | None = None
    is_amendment: bool = False
    irn: str | None = None
    #: When the IRP acknowledged this document. `None` on every line that
    #: carries no IRN, which is most of them; a check reading it must
    #: abstain rather than treat the absence as a lag of zero days.
    irn_date: date | None = None
    prov_id: str | None = None
    row_id: str | None = None

    @property
    def tax(self) -> TaxVector:
        return TaxVector(self.igst, self.cgst, self.sgst, self.cess)

    @property
    def signed_tax(self) -> TaxVector:
        """Credit notes negative, everything else positive.

        Applied here and not in the row, so that the stored data stays a
        faithful copy of the return and the sign is a stated interpretation.
        """
        return -self.tax if self.doc_type in _NEGATIVE_DOCS else self.tax

    @property
    def signed_taxable(self) -> Decimal:
        return -self.taxable_value if self.doc_type in _NEGATIVE_DOCS else self.taxable_value


@dataclass(frozen=True, slots=True)
class InwardRecord:
    gstin: str
    period: Period
    section: str
    doc_type: str
    doc_no: str | None
    doc_date: date | None
    supplier_gstin: str | None
    pos: str | None
    rate: Decimal | None
    taxable_value: Decimal
    igst: Decimal
    cgst: Decimal
    sgst: Decimal
    cess: Decimal
    itc_available: bool | None = None
    itc_unavailable_reason: str | None = None
    supplier_filing_date: date | None = None
    supplier_return_period: Period | None = None
    ims_action: str | None = None
    hsn: str | None = None
    source_form: str = "GSTR2B"
    #: The supplier's own GSTR-3B status, from GSTR-2A. None = not stated.
    supplier_3b_filed: bool | None = None
    prov_id: str | None = None
    row_id: str | None = None

    @property
    def tax(self) -> TaxVector:
        return TaxVector(self.igst, self.cgst, self.sgst, self.cess)

    @property
    def signed_tax(self) -> TaxVector:
        return -self.tax if self.doc_type in _NEGATIVE_DOCS else self.tax

    @property
    def counts_toward_2b_available(self) -> bool:
        """The GSTR-2B 'all other ITC' bucket, as Rule 88D compares it.

        **From GSTR-2B and only GSTR-2B.** 2B is the statutory gate under
        s.16(2)(aa); 2A is the record of supplier behaviour that Rule 37A
        reads. They share a family here because they share their columns
        (D-0057) and the ingestion layer records which is which (D-0075) - but
        until this line, nothing downstream read the label, so a file carrying
        both counted every credit twice. On the reference taxpayer that turned
        Rs 14.72 crore of available credit into Rs 28.84 crore, and "ITC
        claimed in excess of 2B" could not fire.

        Only B2B lines marked available, and only where the recipient accepted
        the record or left it to be deemed accepted.  IMPG, IMPS, ISD and RCM
        credit sit in 4(A)(1)-(4) and are NOT part of this bucket -- comparing
        gross 4(A) against 2B is the mistake that collapses on reply.
        """
        return (
            self.source_form == "GSTR2B"
            and self.itc_available is True
            and self.section in {"B2B", "CDNR"}
            and (self.ims_action is None or self.ims_action in {"ACCEPTED", "NO_ACTION"})
        )


@dataclass(frozen=True, slots=True)
class Return3BRecord:
    """GSTR-3B as filed, head-wise throughout."""

    gstin: str
    period: Period
    filing_date: date | None = None
    arn: str | None = None
    cells: dict[str, Decimal] = field(default_factory=dict)
    prov_id: str | None = None

    def cell(self, name: str) -> Decimal:
        return self.cells.get(name, _ZERO)

    def vector(self, prefix: str) -> TaxVector:
        return TaxVector(
            self.cell(f"{prefix}_igst"),
            self.cell(f"{prefix}_cgst"),
            self.cell(f"{prefix}_sgst"),
            self.cell(f"{prefix}_cess"),
        )

    @property
    def outward_tax(self) -> TaxVector:
        """3.1(a) + 3.1(b) + 3.1.1(i) -- the outward-supply liability.

        3.1(d) inward reverse charge is a liability but **not** an outward-supply
        liability, and including it is the commonest false positive on Rule 88C.
        3.1(c) nil/exempt and 3.1(e) non-GST carry no tax at all.
        """
        return self.vector("t31a") + self.vector("t31b") + self.vector("t311i")

    @property
    def rcm_liability(self) -> TaxVector:
        return self.vector("t31d")

    @property
    def itc_all_other(self) -> TaxVector:
        """Table 4(A)(5) -- the only bucket comparable to GSTR-2B."""
        return self.vector("t4a5")

    @property
    def itc_available_gross(self) -> TaxVector:
        """Table 4(A) total: (1) imports + (2) import of services + (3) RCM + (4) ISD + (5)."""
        return (
            self.vector("t4a1")
            + self.vector("t4a2")
            + self.vector("t4a3")
            + self.vector("t4a4")
            + self.vector("t4a5")
        )

    @property
    def itc_reversed(self) -> TaxVector:
        return self.vector("t4b1") + self.vector("t4b2")

    @property
    def itc_net_declared(self) -> TaxVector:
        """Table 4(C) as the taxpayer stated it."""
        return self.vector("t4c")

    @property
    def taxable_turnover(self) -> Decimal:
        """3.1(a) + (b) + (c) -- the denominator of most P-parameters."""
        return self.cell("t31a_taxable") + self.cell("t31b_taxable") + self.cell("t31c_taxable")

    @property
    def total_turnover(self) -> Decimal:
        """Including 3.1(e) non-GST, for the P10 ratio."""
        return self.taxable_turnover + self.cell("t31e_taxable")

    @property
    def payable(self) -> TaxVector:
        return self.vector("payable")

    @property
    def paid_cash(self) -> TaxVector:
        return self.vector("paid_cash")

    @property
    def paid_itc(self) -> TaxVector:
        return self.vector("paid_itc")

    @property
    def interest(self) -> TaxVector:
        return self.vector("interest")

    @property
    def late_fee(self) -> TaxVector:
        return self.vector("late_fee")


@dataclass(frozen=True, slots=True)
class LedgerRecord:
    gstin: str
    as_on: date
    ledger: str
    head: str
    opening: Decimal
    credited: Decimal
    debited: Decimal
    closing: Decimal
    period: Period | None = None
    reference: str | None = None
    prov_id: str | None = None


@dataclass(frozen=True, slots=True)
class EwbRecord:
    gstin: str
    ewb_no: str
    ewb_date: date | None
    doc_no: str | None
    doc_date: date | None
    value: Decimal
    from_gstin: str | None = None
    to_gstin: str | None = None
    from_state: str | None = None
    to_state: str | None = None
    hsn: str | None = None
    distance_km: int | None = None
    vehicle_no: str | None = None
    part_b_filled: bool = False
    valid_upto: date | None = None
    delivered_at: date | None = None
    status: str = "ACTIVE"
    cancelled_on: date | None = None
    period: Period | None = None
    prov_id: str | None = None


@dataclass(frozen=True, slots=True)
class EInvoiceRecord:
    gstin: str
    irn: str
    ack_date: date | None
    doc_no: str | None
    doc_date: date | None
    taxable_value: Decimal
    igst: Decimal = _ZERO
    cgst: Decimal = _ZERO
    sgst: Decimal = _ZERO
    cess: Decimal = _ZERO
    counterparty_gstin: str | None = None
    status: str = "ACTIVE"
    period: Period | None = None
    prov_id: str | None = None

    @property
    def tax(self) -> TaxVector:
        return TaxVector(self.igst, self.cgst, self.sgst, self.cess)


@dataclass(frozen=True, slots=True)
class FilingRecord:
    gstin: str
    return_type: str
    period: Period
    due_date: date | None
    filing_date: date | None
    status: str
    arn: str | None = None

    @property
    def filed(self) -> bool:
        return self.filing_date is not None

    def days_late(self, *, as_of: date) -> int:
        if self.due_date is None:
            return 0
        reference = self.filing_date or as_of
        return max(0, (reference - self.due_date).days)


@dataclass(frozen=True, slots=True)
class TaxpayerProfile:
    gstin: str
    pan: str
    legal_name: str
    state_code: str
    trade_name: str | None = None
    registration_date: date | None = None
    cancellation_date: date | None = None
    status: str = "ACTIVE"
    aato: Decimal | None = None
    qrmp: bool = False
    einvoice_applicable: bool = False
    sector_code: str | None = None
    commissionerate: str | None = None
    division: str | None = None
    range_office: str | None = None
    officer_id: str | None = None
    address_norm_hash: str | None = None
    bank_hash: str | None = None
    mobile_hash: str | None = None
    email_hash: str | None = None


@dataclass(frozen=True, slots=True)
class TaxpayerData:
    """Everything one taxpayer's rules may read, for one financial year."""

    profile: TaxpayerProfile
    outward: tuple[OutwardRecord, ...] = ()
    inward: tuple[InwardRecord, ...] = ()
    returns_3b: tuple[Return3BRecord, ...] = ()
    ledgers: tuple[LedgerRecord, ...] = ()
    ewb: tuple[EwbRecord, ...] = ()
    einvoices: tuple[EInvoiceRecord, ...] = ()
    filings: tuple[FilingRecord, ...] = ()
    #: supplier GSTIN -> period -> (gstr1_filed, gstr3b_filed, gstr3b_date)
    supplier_filing: dict[str, dict[str, tuple[bool, bool, date | None]]] = field(
        default_factory=dict
    )

    def outward_for(self, period: Period) -> tuple[OutwardRecord, ...]:
        return tuple(row for row in self.outward if row.period == period)

    def inward_for(self, period: Period) -> tuple[InwardRecord, ...]:
        return tuple(row for row in self.inward if row.period == period)

    def return_3b_for(self, period: Period) -> Return3BRecord | None:
        for row in self.returns_3b:
            if row.period == period:
                return row
        return None

    def present_datasets(self) -> set[str]:
        """Which datasets this taxpayer actually has.

        A rule whose required dataset is absent reports NOT_EVALUATED naming it,
        never 'no issue found'.
        """
        present: set[str] = set()
        if self.outward:
            present.add("gstr1")
        # By statement, not by family. A file carrying only GSTR-2A can answer
        # Rule 37A and cannot answer entitlement, and a check that declares it
        # requires 2B must abstain on it rather than compare a 3B claim against
        # nothing and call the whole of it excess.
        if any(row.source_form == "GSTR2B" for row in self.inward):
            present.add("gstr2b")
        if any(row.source_form == "GSTR2A" for row in self.inward):
            present.add("gstr2a")
        if self.returns_3b:
            present.add("gstr3b")
        if self.ledgers:
            present.add("ledgers")
        if self.ewb:
            present.add("eway_bill")
        if self.einvoices:
            present.add("einvoice")
        if self.filings:
            present.add("filing_status")
        if self.supplier_filing:
            present.add("supplier_filing_status")
        return present
