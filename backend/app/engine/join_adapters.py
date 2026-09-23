"""What each named join actually pairs, drawn from one taxpayer's records.

`app/matching` knows how to pair two `Candidate` sequences and how to bucket
the result. It deliberately does not know what a GSTR-2A row is. This module
is the other half: one adapter per join, turning `TaxpayerData` into the two
sides, so the ladder stays pure over four fields and the domain knowledge
stays here.

The direction matters. `app/engine` imports `app/matching`; the reverse would
be a cycle, and it would also put return semantics inside a matcher that has
no business holding them.

**An adapter that cannot run says what it wanted.** `Unavailable` names the
dataset, and because `JoinSpec.feeds` records which checks read the join, the
scorecard can tell an officer *which checks went dark and why* rather than
reporting a silent pass. That is the whole reason `feeds` exists.

**Joins are whole-year.** Every adapter below pairs across the financial
year rather than within a period, because a credit note in November can
name an invoice from April and a 2A row can arrive a quarter after its 2B
counterpart. A per-period variant would need its own spec entry saying so;
narrowing one silently would narrow every check that reads it.

Pure: no I/O, no clock, no randomness.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Final

from app.engine.records import InwardRecord, OutwardRecord, TaxpayerData
from app.matching.joins import JOINS, JoinId
from app.matching.keys import Candidate
from app.money import TaxVector

__all__ = [
    "ADAPTERS",
    "JoinInputs",
    "Unavailable",
    "inputs_for",
]


@dataclass(frozen=True, slots=True)
class JoinInputs:
    """The two sides of one join, ready for the ladder."""

    left: list[Candidate]
    right: list[Candidate]
    #: How to read a row's head-wise tax, so the join can total both sides
    #: without `app/matching` knowing what a tax head is.
    heads: Callable[[Any], TaxVector] | None = None


@dataclass(frozen=True, slots=True)
class Unavailable:
    """This join cannot run, and these are the datasets it wanted.

    Not an error and not an empty result. An empty join reconciles perfectly
    and reads as agreement; this reads as absence, which is the truth.
    """

    missing: tuple[str, ...]
    #: The checks that therefore cannot run. Copied from `JoinSpec.feeds` so
    #: the scorecard does not have to look it up again.
    starves: tuple[str, ...] = field(default=())


#: `TaxpayerData` -> the two sides, or what was missing.
JoinAdapter = Callable[[TaxpayerData], JoinInputs | Unavailable]

_INWARD_HEADS: Final[Callable[[Any], TaxVector]] = lambda row: row.signed_tax  # noqa: E731
_OUTWARD_HEADS: Final[Callable[[Any], TaxVector]] = lambda row: row.signed_tax  # noqa: E731


def _inward_candidate(row: InwardRecord) -> Candidate:
    return Candidate(
        gstin=row.supplier_gstin,
        doc_no=row.doc_no,
        doc_date=row.doc_date,
        taxable_value=row.taxable_value,
        row=row,
    )


def _outward_candidate(row: OutwardRecord) -> Candidate:
    return Candidate(
        gstin=row.counterparty_gstin,
        doc_no=row.doc_no,
        doc_date=row.doc_date,
        taxable_value=row.taxable_value,
        row=row,
    )


def _inward(data: TaxpayerData, *, form: str, sections: frozenset[str]) -> list[InwardRecord]:
    return [row for row in data.inward if row.source_form == form and row.section in sections]


def _outward(data: TaxpayerData, *, sections: frozenset[str]) -> list[OutwardRecord]:
    return [row for row in data.outward if row.section in sections]


# ---------------------------------------------------------------------------
# J03 — GSTR-2B against GSTR-2A
# ---------------------------------------------------------------------------

_B2B: Final[frozenset[str]] = frozenset({"B2B"})


def j03_two_b_against_two_a(data: TaxpayerData) -> JoinInputs | Unavailable:
    """The population gap between the two inward statements.

    `docs/02`: *"The gap is late supplier filings, and it is the point."* A
    document in 2A but not in 2B is a supplier who filed their GSTR-1 after
    the 2B cut-off, so the credit is not yet available under s.16(2)(aa) even
    though the invoice plainly exists. A document in 2B but not in 2A is
    rarer and more interesting.

    This is the join that exercises the ladder on real document numbers: both
    sides are the same invoices written by the same suppliers into two
    statements, so L1 should carry almost all of it and anything falling to
    L3 or L4 is a formatting difference worth seeing.
    """
    left = _inward(data, form="GSTR2B", sections=_B2B)
    right = _inward(data, form="GSTR2A", sections=_B2B)
    missing: list[str] = []
    if not left:
        missing.append("GSTR-2B B2B")
    if not right:
        missing.append("GSTR-2A B2B")
    if missing:
        return Unavailable(tuple(missing), JOINS["J03"].feeds)
    return JoinInputs(
        left=[_inward_candidate(row) for row in left],
        right=[_inward_candidate(row) for row in right],
        heads=_INWARD_HEADS,
    )


# ---------------------------------------------------------------------------
# J07 — a credit note against the invoice it names
# ---------------------------------------------------------------------------

_CDN: Final[frozenset[str]] = frozenset({"CDNR", "CDNUR"})


def j07_credit_note_against_invoice(data: TaxpayerData) -> JoinInputs | Unavailable:
    """Outward credit notes against the outward invoices they refer to.

    `docs/02` notes this is why the **original** `doc_no` is kept beside the
    normalised one: a credit note numbered `CN/SSR/1439` names invoice
    `SSR/M/1439/25-26` by containing its digits, and normalising both to
    compare them would destroy exactly the evidence the pairing rests on.

    Feeds X-02 and X-06, which both ask what happened after a credit note.

    **This adapter does not yet implement the whole of J07's key.** The spec
    says *value + party, digit containment*; the ladder does value and party
    and has no rung for digit containment, which lives beside it in
    `keys.shares_digit_run`. On the reference workbook the ladder pairs 52 of
    211 notes, all at `L3_VALUE`, and X-02 continues to do its own digit
    matching rather than read this result - because rewiring it to a join
    that implements a different test would change a verified figure.

    Closing that gap means either a sixth rung in `MatchLevel`, which is a
    `docs/02` contract change, or a second J07 variant. Recorded rather than
    quietly resolved.
    """
    notes = [row for row in _outward(data, sections=_CDN) if row.doc_type != "INVOICE"]
    invoices = [row for row in _outward(data, sections=_B2B) if row.doc_type == "INVOICE"]
    missing: list[str] = []
    if not notes:
        missing.append("GSTR-1 credit and debit notes (Table 9B)")
    if not invoices:
        missing.append("GSTR-1 B2B invoices (Table 4)")
    if missing:
        return Unavailable(tuple(missing), JOINS["J07"].feeds)
    return JoinInputs(
        left=[_outward_candidate(row) for row in notes],
        right=[_outward_candidate(row) for row in invoices],
        heads=_OUTWARD_HEADS,
    )


# ---------------------------------------------------------------------------
# J04 — the supplier's GSTR-3B status against the credit claimed
# ---------------------------------------------------------------------------


def j04_supplier_status_against_claim(data: TaxpayerData) -> JoinInputs | Unavailable:
    """Rule 37A, as a join rather than as a column read.

    B-04 answers this question directly off the 2A rows, which is correct and
    is how the Rs 95.80 lakh was verified. The join exists so the *pairing* is
    addressable: an officer asking which claimed lines correspond to a
    defaulting supplier's invoices wants the matched bucket, not a total.

    Left is every 2A line whose supplier has not filed; right is every 2B line
    the taxpayer could have claimed. A left row with no partner is a credit
    claimed against a document that never reached 2B at all.
    """
    defaulting = [
        row for row in data.inward if row.source_form == "GSTR2A" and row.supplier_3b_filed is False
    ]
    claimable = [row for row in data.inward if row.source_form == "GSTR2B"]
    missing: list[str] = []
    if not any(row.supplier_3b_filed is not None for row in data.inward):
        missing.append("GSTR-2A with the supplier's GSTR-3B filing status")
    if not claimable:
        missing.append("GSTR-2B")
    if missing:
        return Unavailable(tuple(missing), JOINS["J04"].feeds)
    return JoinInputs(
        left=[_inward_candidate(row) for row in defaulting],
        right=[_inward_candidate(row) for row in claimable],
        heads=_INWARD_HEADS,
    )


# ---------------------------------------------------------------------------
# J17 — an amendment against the document it amends
# ---------------------------------------------------------------------------

_AMENDMENT: Final[frozenset[str]] = frozenset({"AMENDMENT"})


def j17_amendments_against_originals(data: TaxpayerData) -> JoinInputs | Unavailable:
    """Inward B2BA and CDNRA rows against the records they correct.

    The trick is on the left side. An amendment's own `doc_no` is the *new*
    number; the document it corrects is named in `amends_doc_no`, read from
    the table's own column. So the left candidate is built with
    `amends_doc_no` as its document number, and the ladder's L1 rung then
    finds the original by exact match - which is the correct pairing, arrived
    at from a stated reference rather than from two numbers that resemble each
    other.

    On the reference workbook `9936A` amends `9936` and `9945A` amends `9945`.
    The resemblance is obvious and the engine still does not use it: guessing
    which document was amended is how a demand is raised against the wrong
    invoice.
    """
    amendments = [row for row in data.inward if row.section in _AMENDMENT and row.amends_doc_no]
    originals = [row for row in data.inward if row.section in _B2B]
    missing: list[str] = []
    if not amendments:
        missing.append("amendment rows stating the document they amend (B2BA/CDNRA)")
    if not originals:
        missing.append("the original inward records")
    if missing:
        return Unavailable(tuple(missing), JOINS["J17"].feeds)
    return JoinInputs(
        left=[
            Candidate(
                gstin=row.supplier_gstin,
                doc_no=row.amends_doc_no,
                doc_date=row.amends_doc_date,
                taxable_value=row.taxable_value,
                row=row,
            )
            for row in amendments
        ],
        right=[_inward_candidate(row) for row in originals],
        heads=_INWARD_HEADS,
    )


#: join id -> adapter. Only the joins whose data this platform ingests have
#: one; the rest are declared in `JOINS` and report their missing dataset
#: through `inputs_for`, which is the honest state for a join over a sheet
#: that is recognised and not yet read.
ADAPTERS: Final[dict[JoinId, JoinAdapter]] = {
    "J03": j03_two_b_against_two_a,
    "J04": j04_supplier_status_against_claim,
    "J07": j07_credit_note_against_invoice,
    "J17": j17_amendments_against_originals,
}


def inputs_for(join_id: JoinId, data: TaxpayerData) -> JoinInputs | Unavailable:
    """The two sides for one join, or what it wanted and did not get.

    A join with no adapter is `Unavailable` naming its own description rather
    than raising. Twenty-one joins are declared and three have adapters; the
    other eighteen are not broken, they are waiting on sheets the platform
    recognises and does not yet ingest, and the scorecard should say that
    rather than the runner crashing.
    """
    spec = JOINS.get(join_id)
    if spec is None:
        message = f"unknown join {join_id!r}; the twenty-one are declared in JOINS"
        raise KeyError(message)
    adapter = ADAPTERS.get(join_id)
    if adapter is None:
        return Unavailable((spec.left, spec.right), spec.feeds)
    return adapter(data)
