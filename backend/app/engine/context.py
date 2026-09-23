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
from app.engine.join_adapters import Unavailable, inputs_for
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
from app.matching.joins import JOINS, MatchResult, join

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

    # -- joins -------------------------------------------------------------

    @cached_property
    def joins(self) -> dict[str, MatchResult | Unavailable]:
        """Every declared join, run once.

        `CLAUDE.md`: *joins run once, before rules, and are cached on the
        context; a rule consumes a `MatchResult` and never re-runs a join.*
        `cached_property` is what makes that true rather than aspirational -
        the first rule to ask pays for all twenty-one, every rule after it
        reads the same object, and two rules can no longer disagree about the
        same pairing.

        A join whose sheets are not ingested is `Unavailable` naming them,
        never an empty `MatchResult`: an empty join reconciles perfectly and
        reads as agreement.
        """
        out: dict[str, MatchResult | Unavailable] = {}
        for join_id in JOINS:
            found = inputs_for(join_id, self.data)
            if isinstance(found, Unavailable):
                out[join_id] = found
                continue
            out[join_id] = join(join_id, found.left, found.right, heads=found.heads)
        return out

    def join(self, join_id: str) -> MatchResult | None:
        """The pairing for one join, or `None` if it could not run.

        Named `join` for the rules to read; the module-level `join()` it
        shadows is reached through `self.joins`, which has already run.
        """
        found = self.joins.get(join_id)
        return found if isinstance(found, MatchResult) else None

    def join_missing(self, join_id: str) -> tuple[str, ...]:
        """What a join wanted and did not get. Empty when it ran."""
        found = self.joins.get(join_id)
        return found.missing if isinstance(found, Unavailable) else ()

    @property
    def checks_with_unavailable_joins(self) -> dict[str, tuple[str, ...]]:
        """check id -> the datasets whose absence stopped a join it reads.

        This is what `JoinSpec.feeds` is for: when a check does go dark, the
        scorecard can say which sheet it was waiting on instead of leaving a
        blank row.

        **It is an input, not a conclusion.** A check can appear here and run
        perfectly well - X-01 reads J21, J21 has no adapter, and X-01 still
        produces Rs 1.91 crore by pairing the rows itself. Only the check's
        own `NOT_EVALUATED` says it is dark; this says what it would have
        liked to have.
        """
        out: dict[str, tuple[str, ...]] = {}
        for found in self.joins.values():
            if not isinstance(found, Unavailable):
                continue
            for check in found.starves:
                out[check] = found.missing
        return out

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
