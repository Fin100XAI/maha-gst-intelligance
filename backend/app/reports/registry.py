"""The reports an officer can ask for, and the ones that are honestly absent.

Two dictionaries, and the second is as important as the first. `REPORTS`
holds what can be built from the data this platform ingests. `PLANNED` holds
what has been asked for and cannot be built yet, each naming the dataset it
waits on - because `CLAUDE.md` is explicit that a coming-soon feature is a
real routed screen with a stated data dependency and a `501`, never a
fabricated number.

Adding a report is one module and one entry here. It never touches the
runner, the store, the scorecard or the checks.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Final

from app.canonical import Period
from app.engine.records import TaxpayerData
from app.reports import (
    counterparty,
    date_sequence,
    notes,
    place_of_supply,
    rate_wise,
    three_b_vs_one,
    three_b_vs_two_b,
)
from app.reports.base import Report

__all__ = ["PLANNED", "REPORTS", "Planned", "ReportSpec", "build"]

Builder = Callable[[TaxpayerData, str, tuple[Period, ...]], Report]


@dataclass(frozen=True, slots=True)
class ReportSpec:
    """One report an officer can run today."""

    id: str
    title: str
    #: Which of the two sections it belongs under, in the words of `docs/08`.
    group: str
    #: One sentence, for the card on the reports index.
    purpose: str
    builder: Builder

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "title": self.title,
            "group": self.group,
            "purpose": self.purpose,
            "available": True,
        }


@dataclass(frozen=True, slots=True)
class Planned:
    """A report that was asked for and cannot be built honestly yet."""

    id: str
    title: str
    group: str
    purpose: str
    #: The dataset that would make it possible. Shown on the screen and
    #: returned in the 501 body, so the answer to "why not?" is on the page.
    needs: str
    roadmap_ref: str

    def as_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "title": self.title,
            "group": self.group,
            "purpose": self.purpose,
            "available": False,
            "needs": self.needs,
            "roadmap_ref": self.roadmap_ref,
        }


def _ignores_periods(fn: Callable[[TaxpayerData, str], Report]) -> Builder:
    """Adapt a whole-year report to the common signature.

    A report that reasons across the year rather than period by period still
    takes the periods argument, so the caller never has to know which kind it
    is holding.
    """

    def call(data: TaxpayerData, fy: str, _periods: tuple[Period, ...]) -> Report:
        return fn(data, fy)

    return call


REPORTS: Final[dict[str, ReportSpec]] = {
    spec.id: spec
    for spec in (
        ReportSpec(
            three_b_vs_one.REPORT_ID,
            "GSTR-3B against GSTR-1",
            "Reconciliation",
            "Did the taxpayer pay tax on everything they invoiced?",
            three_b_vs_one.build,
        ),
        ReportSpec(
            three_b_vs_two_b.REPORT_ID,
            "GSTR-3B against GSTR-2B (ITC)",
            "Reconciliation",
            "Did they claim more credit than GSTR-2B made available?",
            three_b_vs_two_b.build,
        ),
        ReportSpec(
            counterparty.SUPPLIER_ID,
            "Supplier-wise credit and filing status",
            "Reconciliation",
            "Which suppliers did they claim credit from, and did those suppliers pay?",
            _ignores_periods(counterparty.build_suppliers),
        ),
        ReportSpec(
            counterparty.CUSTOMER_ID,
            "Customer-wise turnover",
            "Reconciliation",
            "Who do they sell to, and how concentrated is it?",
            _ignores_periods(counterparty.build_customers),
        ),
        ReportSpec(
            rate_wise.REPORT_ID,
            "Rate-wise purchases and sales",
            "Reconciliation",
            "What rates do they buy at and sell at, and does the mix make sense?",
            _ignores_periods(rate_wise.build),
        ),
        ReportSpec(
            place_of_supply.REPORT_ID,
            "Place of supply",
            "Pattern",
            "Was it mapped, and does it agree with the recipient and the tax head?",
            _ignores_periods(place_of_supply.build),
        ),
        ReportSpec(
            date_sequence.REPORT_ID,
            "Date sequences",
            "Pattern",
            "Is anything dated before something it depends on?",
            _ignores_periods(date_sequence.build),
        ),
        ReportSpec(
            notes.REPORT_ID,
            "Credit and debit notes, both directions",
            "Pattern",
            "Sales returns out against purchase returns in.",
            _ignores_periods(notes.build),
        ),
        ReportSpec(
            counterparty.OVERLAP_ID,
            "Counterparties on both sides",
            "Pattern",
            "Who do they both buy from and sell to?",
            _ignores_periods(counterparty.build_overlap),
        ),
    )
}


PLANNED: Final[dict[str, Planned]] = {
    spec.id: spec
    for spec in (
        Planned(
            "einvoice_ewaybill_pack",
            "One-click e-Invoice and e-Way Bill pack",
            "Reconciliation",
            "Every IRN and e-way bill for the year in one download.",
            needs="the e-invoice register and the e-way bill register, neither ingested",
            roadmap_ref="docs/08 s.3.5",
        ),
        Planned(
            "pan_based",
            "PAN-based view across registrations",
            "Reconciliation",
            "Every GSTIN under one PAN, side by side.",
            needs="the PAN-to-GSTIN map, which is registration master data",
            roadmap_ref="docs/08 s.3.5",
        ),
        Planned(
            "interest_late_fee",
            "Interest and late fee calculator",
            "Reconciliation",
            "What is owed for filing late, period by period.",
            needs="the filing-date feed; the arithmetic exists in app/cases",
            roadmap_ref="docs/08 s.3.5",
        ),
        Planned(
            "filing_status",
            "Filing status and lateness",
            "Reconciliation",
            "What was filed, when, and how late.",
            needs="filing dates per return per period, not present in the workbook",
            roadmap_ref="docs/08 s.3.5",
        ),
        Planned(
            "hsn_summary",
            "HSN summary and rate master comparison",
            "Reconciliation",
            "What was supplied under each HSN, against the notified rate.",
            needs="GSTR-1 Table 12, recognised at ingestion and not yet stored",
            roadmap_ref="docs/08 s.3.5",
        ),
        Planned(
            "cost_audit",
            "Cost audit reconciliation",
            "Pattern",
            "Turnover and credit against the cost records.",
            needs="the cost records, which are not GST returns",
            roadmap_ref="docs/08 s.3.5",
        ),
        Planned(
            "icegate",
            "ICEGATE customs reconciliation",
            "Pattern",
            "Bills of entry against import credit claimed.",
            needs="the ICEGATE feed",
            roadmap_ref="docs/08 s.3.5",
        ),
    )
}


def build(report_id: str, data: TaxpayerData, fy: str, periods: tuple[Period, ...]) -> Report:
    """Run one report. Raises `KeyError` for an id in neither dictionary."""
    spec = REPORTS.get(report_id)
    if spec is None:
        message = f"unknown report {report_id!r}"
        raise KeyError(message)
    return spec.builder(data, fy, periods)
