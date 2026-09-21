"""``RuleContext`` -- everything a rule may read, and nothing it may do.

Immutable, pre-indexed, no I/O, no clock, no randomness.  ``as_of`` is injected;
a rule that called ``date.today()`` would be unreplayable, and
``tests/engine/test_purity.py`` fails the build if one does.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from functools import cached_property
from typing import TYPE_CHECKING, Any, Final

from app.canonical import FinancialYear, Period, Regime
from app.engine.params import ParameterSet
from app.engine.records import (
    FilingRecord,
    InwardRecord,
    LedgerRecord,
    OutwardRecord,
    Return3BRecord,
    TaxpayerData,
    TaxpayerProfile,
)
from app.engine.trace import CalcKind, Tracer

if TYPE_CHECKING:  # pragma: no cover - typing only
    from app.engine.graph import InvoiceGraph
    from app.engine.peers import PeerBands

__all__ = ["RuleContext"]

_ZERO: Final[Decimal] = Decimal("0.00")


@dataclass(frozen=True)
class RuleContext:
    """One taxpayer, one financial year, pre-indexed for the rules."""

    data: TaxpayerData
    fy: FinancialYear
    snapshot_id: str
    params: ParameterSet
    #: Injected.  Never the wall clock.
    as_of: date
    peers: PeerBands | None = None
    graph: InvoiceGraph | None = None
    engine_version: str = "0.1.0"
    prior_year: TaxpayerData | None = None
    #: Findings already known for this taxpayer, so a rule can see what fired
    #: before it without re-running anything.
    prior_findings: tuple[str, ...] = ()
    #: Datasets supplied through ``extras`` rather than through TaxpayerData --
    #: ITC-04, the HSN rate master, a registration index.  Declaring them here
    #: rather than inferring them from extras keys keeps "is this dataset
    #: present?" a single, explicit question.
    extra_datasets: frozenset[str] = frozenset()
    #: The single typed escape hatch: datasets and indexes a rule needs that
    #: are not part of TaxpayerData (a rate master, a registration index, an
    #: established wrong availment).  Declared `Any` deliberately -- what is
    #: present is declared in `extra_datasets`, and each rule checks for what
    #: it needs before reaching in.
    extras: dict[str, Any] = field(default_factory=dict)

    # -- identity ----------------------------------------------------------

    @property
    def gstin(self) -> str:
        return self.data.profile.gstin

    @property
    def profile(self) -> TaxpayerProfile:
        return self.data.profile

    @property
    def periods(self) -> tuple[Period, ...]:
        return self.fy.periods

    def regime(self, period: Period) -> Regime:
        return period.regime

    # -- indexes -----------------------------------------------------------

    @cached_property
    def outward_by_period(self) -> dict[Period, tuple[OutwardRecord, ...]]:
        index: dict[Period, list[OutwardRecord]] = {}
        for row in self.data.outward:
            index.setdefault(row.period, []).append(row)
        return {period: tuple(rows) for period, rows in index.items()}

    @cached_property
    def inward_by_period(self) -> dict[Period, tuple[InwardRecord, ...]]:
        index: dict[Period, list[InwardRecord]] = {}
        for row in self.data.inward:
            index.setdefault(row.period, []).append(row)
        return {period: tuple(rows) for period, rows in index.items()}

    @cached_property
    def outward_by_section(self) -> dict[tuple[Period, str], tuple[OutwardRecord, ...]]:
        index: dict[tuple[Period, str], list[OutwardRecord]] = {}
        for row in self.data.outward:
            index.setdefault((row.period, row.section), []).append(row)
        return {key: tuple(rows) for key, rows in index.items()}

    @cached_property
    def outward_by_counterparty(self) -> dict[str, tuple[OutwardRecord, ...]]:
        index: dict[str, list[OutwardRecord]] = {}
        for row in self.data.outward:
            if row.counterparty_gstin:
                index.setdefault(row.counterparty_gstin, []).append(row)
        return {key: tuple(rows) for key, rows in index.items()}

    @cached_property
    def inward_by_supplier(self) -> dict[str, tuple[InwardRecord, ...]]:
        index: dict[str, list[InwardRecord]] = {}
        for row in self.data.inward:
            if row.supplier_gstin:
                index.setdefault(row.supplier_gstin, []).append(row)
        return {key: tuple(rows) for key, rows in index.items()}

    @cached_property
    def outward_by_doc(self) -> dict[tuple[str, date | None], tuple[OutwardRecord, ...]]:
        index: dict[tuple[str, date | None], list[OutwardRecord]] = {}
        for row in self.data.outward:
            if row.doc_no:
                index.setdefault((row.doc_no, row.doc_date), []).append(row)
        return {key: tuple(rows) for key, rows in index.items()}

    @cached_property
    def returns_by_period(self) -> dict[Period, Return3BRecord]:
        return {row.period: row for row in self.data.returns_3b}

    @cached_property
    def ledger_by_day(self) -> dict[tuple[date, str, str], LedgerRecord]:
        """Daily grain: PAY-03 needs a running balance, not a period-end snapshot."""
        return {(row.as_on, row.ledger, row.head): row for row in self.data.ledgers}

    @cached_property
    def filings_by_key(self) -> dict[tuple[str, Period], FilingRecord]:
        return {(row.return_type, row.period): row for row in self.data.filings}

    @cached_property
    def present(self) -> set[str]:
        return self.data.present_datasets() | set(self.extra_datasets)

    def missing(self, required: tuple[str, ...]) -> tuple[str, ...]:
        """The required datasets this taxpayer does not have.

        A rule with anything missing reports NOT_EVALUATED naming them -- never
        'no issue found'.
        """
        return tuple(name for name in required if name not in self.present)

    def return_3b(self, period: Period) -> Return3BRecord | None:
        return self.returns_by_period.get(period)

    def outward(self, period: Period) -> tuple[OutwardRecord, ...]:
        return self.outward_by_period.get(period, ())

    def inward(self, period: Period) -> tuple[InwardRecord, ...]:
        return self.inward_by_period.get(period, ())

    # -- turnover ----------------------------------------------------------

    @cached_property
    def annual_turnover(self) -> Decimal:
        """Declared taxable turnover across the year, from GSTR-3B."""
        total = _ZERO
        for row in self.data.returns_3b:
            total += row.taxable_turnover
        return total

    # -- tracing -----------------------------------------------------------

    def tracer(
        self,
        kind: CalcKind,
        subject_id: str,
        *,
        period: Period | None = None,
        legal_basis: str | None = None,
    ) -> Tracer:
        return Tracer(
            kind=kind,
            subject_id=subject_id,
            snapshot_id=self.snapshot_id,
            gstin=self.gstin,
            period=period.mmyyyy if period is not None else None,
            fy=self.fy.label,
            legal_basis=legal_basis,
            engine_version=self.engine_version,
            params_version=self.params.version,
        )
