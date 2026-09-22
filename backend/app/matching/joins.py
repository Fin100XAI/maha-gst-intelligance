"""J01-J21 — the named cross-sheet joins, each with four addressable buckets.

Every material finding in `docs/07` came from a join, not from a single
sheet. The Rule 37A exposure is a supplier-status column joined to a claim;
the Rs 1.91 crore is an invoice joined to a credit note joined to an HSN
summary joined to a third party's TDS return.

Two rules the whole layer depends on:

**A join runs once.** The results are computed before any rule and cached on
the context. A rule consumes a `MatchResult`; it never re-runs a join. One
join feeds many rules - J04 alone feeds B-04, P14 and the Rule 37A demand -
and a rule that re-ran it could disagree with its neighbour about the same
pairing.

**Nothing is silently dropped.** Every row lands in exactly one of MATCHED,
ONLY-LEFT, ONLY-RIGHT or VALUE-DIFFERS, and the four buckets sum to the two
input counts. Officers live in Excel and will not adopt a tool that cannot
hand a working file back, so each bucket is addressable and exportable.

Pure: no I/O, no clock. docs/02 Part B.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Final

from app.matching.keys import Candidate, MatchLevel, best_match
from app.money import TaxVector

__all__ = [
    "JOINS",
    "Bucket",
    "JoinId",
    "JoinSpec",
    "MatchResult",
    "MatchedPair",
    "join",
    "run_join",
]

JoinId = str

#: Below this the two sides are the same figure differently rounded, not a
#: disagreement. docs/02 B4: value-based document match, 0.1% or Rs 100.
VALUE_DIFFERS_FLOOR: Final[Decimal] = Decimal("100.00")
VALUE_DIFFERS_FRACTION: Final[Decimal] = Decimal("0.001")


class Bucket(str):
    """The four outcomes. A string subclass so it renders straight to the wire."""

    __slots__ = ()


MATCHED: Final[str] = "MATCHED"
ONLY_LEFT: Final[str] = "ONLY_LEFT"
ONLY_RIGHT: Final[str] = "ONLY_RIGHT"
VALUE_DIFFERS: Final[str] = "VALUE_DIFFERS"


@dataclass(frozen=True, slots=True)
class MatchedPair:
    """Two rows the ladder says are one document, and how firmly."""

    left: Any
    right: Any
    level: MatchLevel
    #: Present only when the pair matched but the money did not agree.
    delta: Decimal | None = None

    @property
    def confidence(self) -> str:
        return self.level.confidence


@dataclass(slots=True)
class MatchResult:
    """What one join produced. The unit a rule consumes."""

    join_id: JoinId
    left_count: int
    right_count: int
    matched: list[MatchedPair] = field(default_factory=list)
    only_left: list[Any] = field(default_factory=list)
    only_right: list[Any] = field(default_factory=list)
    value_differs: list[MatchedPair] = field(default_factory=list)
    #: Head-wise totals for both sides and the difference between them.
    totals_left: TaxVector = field(default_factory=TaxVector)
    totals_right: TaxVector = field(default_factory=TaxVector)

    @property
    def delta(self) -> TaxVector:
        """Head-wise, and never collapsed. Law 3."""
        return self.totals_left - self.totals_right

    @property
    def by_level(self) -> dict[str, int]:
        counts = {level.name: 0 for level in MatchLevel if level is not MatchLevel.L5_UNMATCHED}
        for pair in (*self.matched, *self.value_differs):
            counts[pair.level.name] += 1
        return counts

    def reconciles(self) -> bool:
        """Every input row landed in exactly one bucket.

        The join's own version of the ingestion ledger: if this is false the
        join lost a row, and a rule reading it would under-report without
        anything on screen saying so.
        """
        left_out = len(self.matched) + len(self.value_differs) + len(self.only_left)
        right_out = len(self.matched) + len(self.value_differs) + len(self.only_right)
        return left_out == self.left_count and right_out == self.right_count

    def as_dict(self) -> dict[str, Any]:
        return {
            "join_id": self.join_id,
            "left_count": self.left_count,
            "right_count": self.right_count,
            "matched": len(self.matched),
            "only_left": len(self.only_left),
            "only_right": len(self.only_right),
            "value_differs": len(self.value_differs),
            "by_level": self.by_level,
            "totals_left": self.totals_left.dict(),
            "totals_right": self.totals_right.dict(),
            "delta": self.delta.dict(),
            "reconciles": self.reconciles(),
        }


@dataclass(frozen=True, slots=True)
class JoinSpec:
    """One named join: what it pairs, and which checks read it."""

    id: JoinId
    left: str
    right: str
    key: str
    feeds: tuple[str, ...]
    note: str = ""


#: The twenty-one, in the pack's order. docs/02 B3.
#:
#: `feeds` is not documentation: the scorecard uses it to tell an officer
#: which checks went dark when a join had nothing to run on, rather than
#: reporting a silent pass.
JOINS: Final[dict[JoinId, JoinSpec]] = {
    "J01": JoinSpec(
        "J01",
        "GSTR1_B2B + CDN",
        "3B 3.1(a)",
        "period, head",
        ("G-02", "R1"),
        "Rule 88C. Hard-locked from July 2025, so this should reconcile to zero.",
    ),
    "J02": JoinSpec(
        "J02",
        "GSTR2B B2B+CDNR+B2BA",
        "3B 4A(5)",
        "period, head",
        ("B-01", "P14"),
        "Rule 88D. 2B is the statutory gate under s.16(2)(aa), never 2A.",
    ),
    "J03": JoinSpec(
        "J03",
        "GSTR2B_B2B",
        "GSTR2A_B2B",
        "L1->L3",
        ("population gap",),
        "The gap is late supplier filings, and it is the point.",
    ),
    "J04": JoinSpec(
        "J04",
        "GSTR2A 3B filing status",
        "ITC claimed",
        "supplier, period",
        ("B-04", "Rule 37A"),
        "One join, one column. Rs 95.80 lakh on the fixture, CERTAIN.",
    ),
    "J05": JoinSpec("J05", "GSTR1_B2B", "GSTR1_HSNSummary", "period, rate", ("X-03", "X-04")),
    "J06": JoinSpec("J06", "GSTR1_B2B", "GSTR1_DocIssued", "series, count", ("G-12", "X-09")),
    "J07": JoinSpec(
        "J07",
        "GSTR1_CDN",
        "GSTR1_B2B",
        "value+party, digit containment",
        ("H-02", "X-02", "X-06"),
        "Digit containment is why the original doc_no is kept.",
    ),
    "J08": JoinSpec(
        "J08",
        "GSTR1_B2B net of CDN",
        "GSTR2A_TDS / GSTR-8",
        "counterparty, value",
        ("G-14", "X-10"),
        "Third-party proof of turnover. Needs the [ZDC] validator.",
    ),
    "J09": JoinSpec("J09", "GSTR2B_IMPG", "3B 4A(1)", "period", ("B-09", "P15")),
    "J10": JoinSpec("J10", "GSTR2A_IMPGOS", "3B 4A(2)", "period", ("C-04", "P02")),
    "J11": JoinSpec("J11", "3B 3.1(d)", "3B 4A(3)", "period, head", ("C-02", "P16")),
    "J12": JoinSpec("J12", "CreditLedger", "3B PaymentofTax", "period, head", ("X-11", "R8")),
    "J13": JoinSpec("J13", "CashLedger", "Challan", "CPIN, date", ("payment trail",)),
    "J14": JoinSpec("J14", "LiabilityLedger", "3B due dates", "period", ("A-02", "J-01", "P11")),
    "J15": JoinSpec(
        "J15",
        "GSTR1_B2B.IRN",
        "e-invoice mandate",
        "AATO, doc date",
        ("G-03", "G-04"),
        "Dark until irn_date is mapped. See docs/GAP_V3.md.",
    ),
    "J16": JoinSpec(
        "J16", "GSTR2B.ims_action", "3B claim", "document", ("IMS pending yet claimed",)
    ),
    "J17": JoinSpec("J17", "B2BA amendments", "original records", "original doc", ("X-12",)),
    "J18": JoinSpec("J18", "3B 4B(2) reversal", "3B 4D(1) reclaim", "rolling window", ("X-11",)),
    "J19": JoinSpec(
        "J19",
        "GSTR1_HSNSummary",
        "HSN rate master",
        "HSN, doc date",
        ("G-10",),
        "Effective-dated: 28% on 20-Sep-2025 is right, on 23-Sep-2025 it is not.",
    ),
    "J20": JoinSpec(
        "J20", "counterparty GSTINs", "GSTIN master", "GSTIN, doc date", ("A-01", "B-10")
    ),
    "J21": JoinSpec(
        "J21",
        "outward lines",
        "outward lines (self)",
        "counterparty x value bucket",
        ("X-01", "X-05"),
        "The self-join. Rs 1.91 crore on the fixture, and no conventional scrutiny tool runs it.",
    ),
}


def _value_differs(left: Decimal | None, right: Decimal | None) -> Decimal | None:
    """The gap, when it is larger than rounding can explain."""
    if left is None or right is None:
        return None
    gap = left - right
    if gap == 0:
        return None
    allowed = max(VALUE_DIFFERS_FLOOR, abs(left) * VALUE_DIFFERS_FRACTION)
    return gap if abs(gap) > allowed else None


def run_join(
    join_id: JoinId,
    left: Sequence[Candidate],
    right: Sequence[Candidate],
    *,
    heads: Callable[[Any], TaxVector] | None = None,
) -> MatchResult:
    """Pair two sides through the ladder and bucket every row.

    Greedy and order-deterministic: each left row takes the strongest
    unclaimed right row, first-in-order on a tie. Two runs over one snapshot
    therefore produce identical pairs, which is what `calc_id` replay depends
    on - a matcher that resolved ties by set iteration would break G7 without
    changing a single figure.
    """
    result = MatchResult(join_id=join_id, left_count=len(left), right_count=len(right))
    claimed: set[int] = set()
    available = list(enumerate(right))

    for row in left:
        candidates = [candidate for index, candidate in available if index not in claimed]
        found = best_match(row, candidates)
        if found is None:
            result.only_left.append(row.row)
            continue
        partner, level = found
        for index, candidate in available:
            if candidate is partner:
                claimed.add(index)
                break
        gap = _value_differs(row.taxable_value, partner.taxable_value)
        pair = MatchedPair(left=row.row, right=partner.row, level=level, delta=gap)
        if gap is None:
            result.matched.append(pair)
        else:
            result.value_differs.append(pair)

    for index, candidate in available:
        if index not in claimed:
            result.only_right.append(candidate.row)

    if heads is not None:
        result.totals_left = sum((heads(c.row) for c in left), TaxVector())
        result.totals_right = sum((heads(c.row) for c in right), TaxVector())

    return result


def join(
    join_id: JoinId,
    left: Iterable[Candidate],
    right: Iterable[Candidate],
    *,
    heads: Callable[[Any], TaxVector] | None = None,
) -> MatchResult:
    """`run_join`, accepting any iterable. The name rules use."""
    if join_id not in JOINS:
        message = f"unknown join {join_id!r}; the twenty-one are declared in JOINS"
        raise KeyError(message)
    return run_join(join_id, list(left), list(right), heads=heads)
