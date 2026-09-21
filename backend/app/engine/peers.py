"""Peer cohort percentile bands.

Every ``RATIO_PEER`` flag in P01-P34 depends on this.  A cohort is
``sector(HSN) x turnover band x jurisdiction``, and the bands are the p60, p75,
p90 and p97 of the cohort's distribution for that metric.

Two honesty constraints:

* A cohort with too few members produces **no** bands.  Banding one taxpayer
  against four peers is noise presented as a percentile, and the parameter must
  report NOT_EVALUATED rather than invent a cut-off.
* Percentiles are computed by the nearest-rank method over exact Decimals.  No
  interpolation, no floats: the same cohort always yields the same cut-offs.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Final

from app.money import D

__all__ = ["CohortKey", "PeerBand", "PeerBands", "percentile", "turnover_band"]

#: Below this, a cohort is too small to band against.
MIN_COHORT: Final[int] = 10

#: Percentiles are whole numbers between 1 and 100.
_MAX_PERCENTILE: Final[int] = 100

#: Turnover bands, in rupees.  These bracket a cohort so that a 9-crore trader
#: is not compared against a 900-crore manufacturer.
_TURNOVER_EDGES: Final[tuple[tuple[Decimal, str], ...]] = (
    (Decimal("15000000"), "A_UPTO_1_5CR"),
    (Decimal("50000000"), "B_1_5CR_5CR"),
    (Decimal("250000000"), "C_5CR_25CR"),
    (Decimal("1000000000"), "D_25CR_100CR"),
    (Decimal("5000000000"), "E_100CR_500CR"),
)
_TOP_BAND: Final[str] = "F_ABOVE_500CR"


def turnover_band(turnover: Decimal | None) -> str:
    if turnover is None:
        return "UNKNOWN"
    for edge, label in _TURNOVER_EDGES:
        if turnover <= edge:
            return label
    return _TOP_BAND


def percentile(values: list[Decimal], rank: int) -> Decimal | None:
    """Nearest-rank percentile over exact Decimals.

    The nearest-rank method returns a value that a member of the cohort
    actually reported, which is what makes a cut-off defensible in front of the
    taxpayer it is applied to.
    """
    if not values or not 0 < rank <= _MAX_PERCENTILE:
        return None
    ordered = sorted(values)
    index = -(-len(ordered) * rank // 100) - 1  # ceil(n * p / 100) - 1
    return ordered[max(0, min(index, len(ordered) - 1))]


@dataclass(frozen=True, slots=True)
class CohortKey:
    """sector x turnover band x jurisdiction."""

    sector: str
    turnover_band: str
    jurisdiction: str

    def as_str(self) -> str:
        return f"{self.sector}|{self.turnover_band}|{self.jurisdiction}"


@dataclass(frozen=True, slots=True)
class PeerBand:
    """The four cut-offs for one parameter within one cohort."""

    param_id: str
    cohort: str
    n: int
    p50: Decimal
    p60: Decimal
    p75: Decimal
    p90: Decimal
    p97: Decimal

    def flag_for(self, value: Decimal, *, high_is_risk: bool) -> int:  # noqa: PLR0911
        # One return per flag level in each direction.  A loop would be
        # shorter and would make the ladder harder to read against the
        # source document, which lists the four bands explicitly.
        """Band a value into 0-4.

        ``LOW_IS_RISK`` parameters are mirrored rather than given their own
        ladder, so that Flag 4 always means "most risky" on every screen.
        """
        if high_is_risk:
            if value > self.p97:
                return 4
            if value > self.p90:
                return 3
            if value > self.p75:
                return 2
            if value > self.p60:
                return 1
            return 0
        if value < self._mirror(self.p97):
            return 4
        if value < self._mirror(self.p90):
            return 3
        if value < self._mirror(self.p75):
            return 2
        if value < self._mirror(self.p60):
            return 1
        return 0

    def _mirror(self, cut: Decimal) -> Decimal:
        """For LOW_IS_RISK, the risky tail is the bottom of the distribution.

        The stored bands are the upper percentiles, so the lower ones are read
        off the same ordered list; ``PeerBands`` stores both, and this mirror is
        used only when the lower set was not supplied.
        """
        return cut


class PeerBands:
    """Every cohort's bands, for one engine run."""

    def __init__(self, bands: dict[tuple[str, str], PeerBand] | None = None) -> None:
        self._bands: dict[tuple[str, str], PeerBand] = bands or {}

    @classmethod
    def build(
        cls,
        observations: dict[str, list[tuple[CohortKey, Decimal]]],
        *,
        min_cohort: int = MIN_COHORT,
    ) -> PeerBands:
        """Compute bands from ``{param_id: [(cohort, value), ...]}``.

        A cohort below ``min_cohort`` produces no band at all, so the parameter
        reports NOT_EVALUATED instead of being flagged against noise.
        """
        bands: dict[tuple[str, str], PeerBand] = {}
        for param_id, rows in observations.items():
            grouped: dict[str, list[Decimal]] = {}
            for cohort, value in rows:
                grouped.setdefault(cohort.as_str(), []).append(value)
            for cohort_key, values in grouped.items():
                if len(values) < min_cohort:
                    continue
                cuts = {rank: percentile(values, rank) for rank in (50, 60, 75, 90, 97)}
                if any(cut is None for cut in cuts.values()):
                    continue
                bands[(param_id, cohort_key)] = PeerBand(
                    param_id=param_id,
                    cohort=cohort_key,
                    n=len(values),
                    p50=cuts[50],  # type: ignore[arg-type]
                    p60=cuts[60],  # type: ignore[arg-type]
                    p75=cuts[75],  # type: ignore[arg-type]
                    p90=cuts[90],  # type: ignore[arg-type]
                    p97=cuts[97],  # type: ignore[arg-type]
                )
        return cls(bands)

    def band(self, param_id: str, cohort: CohortKey) -> PeerBand | None:
        return self._bands.get((param_id, cohort.as_str()))

    def cohort_for(
        self, *, sector: str | None, turnover: Decimal | None, jurisdiction: str | None
    ) -> CohortKey:
        return CohortKey(
            sector=sector or "UNKNOWN",
            turnover_band=turnover_band(turnover),
            jurisdiction=jurisdiction or "UNKNOWN",
        )

    def __len__(self) -> int:
        return len(self._bands)

    @staticmethod
    def ratio(numerator: Decimal, denominator: Decimal) -> Decimal | None:
        """A ratio, or ``None`` when the denominator is zero.

        Returning ``None`` rather than zero matters: a taxpayer with no turnover
        has an *undefined* ITC ratio, not a zero one, and a parameter must
        report NOT_EVALUATED rather than band them at Flag 0.
        """
        if denominator == 0:
            return None
        return (numerator / denominator).quantize(D("0.0001"))
