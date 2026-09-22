"""Effective-dated parameter governance.

Every threshold in this platform -- statutory or flag cut-off -- is a row:

    rule_or_param_id | key | value | effective_from | effective_to
                     | notification_ref | approved_by | approved_at | supersedes

The engine resolves a parameter **as at the tax period under scrutiny**, never
as at today.  Scrutinising FY 2019-20 applies FY 2019-20 thresholds, so
re-running the engine over an old snapshot reproduces the original findings byte
for byte even after the Council changes a number.

Nothing here is departmental policy until the law officer signs the row.  Every
default ships with ``provisional=True``, and the admin screen shows it as such.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import Period
from app.engine.trace import ParameterUse
from app.money import D

__all__ = [
    "DEFAULT_PARAMETERS",
    "ParameterNotConfiguredError",
    "ParameterRow",
    "ParameterSet",
    "ResolvedParameter",
]

#: Before this, nothing GST existed.  A default parameter effective from here
#: applies to every period the platform can be asked about.
GST_START: Final[date] = date(2017, 7, 1)


class ParameterNotConfiguredError(LookupError):
    """A threshold was asked for that nobody has configured.

    This is raised rather than defaulted, because a wrong threshold applied
    silently is worse than a missing feature.  The caller turns it into a
    NOT_EVALUATED finding naming the parameter.
    """

    def __init__(self, owner_id: str, key: str, on: date) -> None:
        self.owner_id = owner_id
        self.key = key
        self.on = on
        super().__init__(
            f"no value for {owner_id}.{key} effective on {on.isoformat()} "
            f"-- TODO(statute): configure it in the admin screen"
        )


@dataclass(frozen=True, slots=True)
class ParameterRow:
    """One governed value, valid over a date range."""

    owner_id: str
    key: str
    value: str
    effective_from: date
    effective_to: date | None = None
    value_type: str = "decimal"
    unit: str | None = None
    notification_ref: str | None = None
    source_note: str | None = None
    approved_by: str | None = None
    provisional: bool = True

    def covers(self, moment: date) -> bool:
        if moment < self.effective_from:
            return False
        return self.effective_to is None or moment <= self.effective_to


@dataclass(frozen=True, slots=True)
class ResolvedParameter:
    """A parameter value, with everything the drawer needs to explain it."""

    owner_id: str
    key: str
    raw: str
    value_type: str
    effective_from: date
    notification_ref: str | None
    provisional: bool

    @property
    def decimal(self) -> Decimal:
        return D(self.raw)

    @property
    def text(self) -> str:
        return self.raw

    @property
    def day_month(self) -> tuple[int, int]:
        """Read a ``DD-MM`` cut-off such as the Rule 37A 30-09 date."""
        day, month = self.raw.split("-")
        return int(day), int(month)

    def on_day_month_of(self, year: int) -> date:
        day, month = self.day_month
        return date(year, month, day)

    def use(self) -> ParameterUse:
        return ParameterUse(
            parameter_id=self.owner_id,
            key=self.key,
            value=self.raw,
            effective_from=self.effective_from,
            notification_ref=self.notification_ref,
            provisional=self.provisional,
        )


class ParameterSet:
    """A period-aware view over the parameter table."""

    def __init__(
        self, rows: list[ParameterRow] | None = None, *, version: str = "defaults"
    ) -> None:
        self._rows: dict[tuple[str, str], list[ParameterRow]] = {}
        self.version = version
        for row in rows if rows is not None else list(DEFAULT_PARAMETERS):
            self._rows.setdefault((row.owner_id, row.key), []).append(row)
        for bucket in self._rows.values():
            bucket.sort(key=lambda r: r.effective_from, reverse=True)

    def get(self, owner_id: str, key: str, *, on: date | Period) -> ResolvedParameter:
        """Resolve as at the tax period, never as at today.

        A ``Period`` resolves on its **last day**, which is the moment the
        liability for that period crystallises.
        """
        moment = on.last_day if isinstance(on, Period) else on
        for row in self._rows.get((owner_id, key), []):
            if row.covers(moment):
                return ResolvedParameter(
                    owner_id=row.owner_id,
                    key=row.key,
                    raw=row.value,
                    value_type=row.value_type,
                    effective_from=row.effective_from,
                    notification_ref=row.notification_ref,
                    provisional=row.provisional,
                )
        raise ParameterNotConfiguredError(owner_id, key, moment)

    def maybe(self, owner_id: str, key: str, *, on: date | Period) -> ResolvedParameter | None:
        try:
            return self.get(owner_id, key, on=on)
        except ParameterNotConfiguredError:
            return None

    def keys_for(self, owner_id: str) -> list[str]:
        return sorted({key for owner, key in self._rows if owner == owner_id})

    def all_rows(self) -> list[ParameterRow]:
        return [row for bucket in self._rows.values() for row in bucket]

    def unapproved(self) -> list[ParameterRow]:
        """Rows the law officer has not signed.  The admin screen lists these."""
        return [row for row in self.all_rows() if row.provisional]


def _p(
    owner: str,
    key: str,
    value: str,
    *,
    unit: str | None = None,
    frm: date = GST_START,
    to: date | None = None,
    notification: str | None = None,
    note: str | None = None,
    value_type: str = "decimal",
) -> ParameterRow:
    return ParameterRow(
        owner_id=owner,
        key=key,
        value=value,
        effective_from=frm,
        effective_to=to,
        value_type=value_type,
        unit=unit,
        notification_ref=notification,
        source_note=note,
    )


#: The thresholds docs/01 states, and nothing else.
#:
#: Every row is provisional until signed.  Where docs/01 gives a number, the
#: source_note cites where; where it does not, the parameter is simply absent
#: and the rule reports NOT_EVALUATED rather than guessing.
DEFAULT_PARAMETERS: Final[tuple[ParameterRow, ...]] = (
    # -- X family: self-contradiction (docs/01 section 7) -------------------
    # These are the pack's own stated thresholds, not invented ones. X-01's
    # table gives N=30; X-06 gives 120 days and Rs 1 lakh; X-12 gives
    # Rs 25,000. They are configurable and effective-dated like every other
    # threshold, so a law officer signs a row rather than a pull request.
    _p("X-01", "window_days", "30", unit="days", note="docs/01 section 7: N=30"),
    _p(
        "X-01",
        "min_exposure",
        "100000",
        unit="INR",
        note="docs/01 section 7 X-03 floor, applied to X-01 so a small "
        "rate difference is not a critical finding",
    ),
    _p("X-03", "min_delta", "100000", unit="INR", note="docs/01 section 7: delta value > Rs 1 L"),
    _p("X-06", "window_days", "120", unit="days", note="docs/01 section 7: within 120 days"),
    _p("X-06", "min_value", "100000", unit="INR", note="docs/01 section 7: value > Rs 1 L"),
    _p("X-12", "min_delta", "25000", unit="INR", note="docs/01 section 7: delta > Rs 25 K"),
    # -- Rule 88C: GSTR-1 vs 3B liability mismatch (OUT-01) ------------------
    _p("OUT-01", "pct_threshold", "20", unit="percent", note="docs/01 A4 R1, C2, C3"),
    _p("OUT-01", "amount_threshold", "2500000", unit="INR", note="docs/01 A4 R1: 25 lakh"),
    # -- Rule 88D: ITC in excess of 2B (ITC-01) -----------------------------
    _p("ITC-01", "pct_threshold", "20", unit="percent", note="docs/01 A4 R2, C3"),
    _p("ITC-01", "amount_threshold", "2500000", unit="INR", note="docs/01 A4 R2: 25 lakh"),
    # -- Rule 37A: supplier default (ITC-02) --------------------------------
    _p(
        "ITC-02",
        "supplier_3b_cutoff",
        "30-09",
        value_type="day_month",
        note="docs/01 A3 Rule 37A: supplier's GSTR-3B by 30 Sep of the following FY",
    ),
    _p(
        "ITC-02",
        "reversal_cutoff",
        "30-11",
        value_type="day_month",
        note="docs/01 A3 Rule 37A: recipient reverses by 30 Nov",
    ),
    _p("ITC-02", "min_shortfall", "10000", unit="INR", note="docs/01 C2 ITC-02"),
    # -- other stated thresholds --------------------------------------------
    _p("OUT-02", "min_delta", "100000", unit="INR", note="docs/01 C2 OUT-02: 1 lakh"),
    _p("OUT-07", "min_rate_gap", "0.5", unit="pp", note="docs/01 C2 OUT-07"),
    _p("OUT-07", "min_amount", "50000", unit="INR", note="docs/01 C2 OUT-07"),
    _p("OUT-08", "cn_ratio_threshold", "15", unit="percent", note="docs/01 C2 OUT-08"),
    _p("OUT-11", "min_amount", "10000", unit="INR", note="docs/01 C2 OUT-11"),
    _p("OUT-14", "min_amount", "100000", unit="INR", note="docs/01 C2 OUT-14"),
    _p("OUT-19", "spike_multiple", "3", unit="x", note="docs/01 C2 OUT-19"),
    _p("ITC-04", "claim_cutoff_month", "10", unit="month", note="docs/01 C2 ITC-04: Oct next FY"),
    _p("ITC-07", "d2_percent", "5", unit="percent", note="docs/01 A3 Rule 42: D2 = C2 x 5%"),
    _p("ITC-07", "min_shortfall", "25000", unit="INR", note="docs/01 C2 ITC-07"),
    _p("ITC-10", "min_amount", "25000", unit="INR", note="docs/01 C2 ITC-10"),
    _p("ITC-13", "min_amount", "10000", unit="INR", note="docs/01 C2 ITC-13"),
    _p("ITC-16", "min_cycle_value", "1000000", unit="INR", note="docs/01 C2 ITC-16: 10 lakh"),
    _p("ITC-17", "min_amount", "10000", unit="INR", note="docs/01 C2 ITC-17"),
    _p("ITC-21", "min_amount", "10000", unit="INR", note="docs/01 C2 ITC-21"),
    _p("PAY-01", "turnover_threshold", "5000000", unit="INR", note="docs/01 A3 Rule 86B: 50 lakh"),
    _p("PAY-01", "min_cash_percent", "1", unit="percent", note="docs/01 A3 Rule 86B"),
    _p("PAY-02", "interest_rate", "18", unit="percent", note="docs/01 A4 R10, s.50(1)"),
    _p("PAY-02", "min_amount", "1000", unit="INR", note="docs/01 C2 PAY-02"),
    _p("PAY-03", "interest_rate", "18", unit="percent", note="docs/01 A4 R10, s.50(3)"),
    _p("PAY-03", "min_amount", "1000", unit="INR", note="docs/01 C2 PAY-03"),
    _p("PAY-04", "min_amount", "500", unit="INR", note="docs/01 C2 PAY-04"),
    _p("PAY-04", "daily_fee", "50", unit="INR", note="docs/01 A4 R11, s.47"),
    _p("PAY-04", "daily_fee_nil", "20", unit="INR", note="docs/01 A4 R11, s.47"),
    _p("PAY-05", "min_amount", "1", unit="INR", note="docs/01 C2 PAY-05"),
    _p("PAY-10", "consecutive_periods", "12", unit="periods", note="docs/01 C2 PAY-10"),
    _p("EWB-01", "min_value", "50000", unit="INR", note="docs/01 C2 EWB-01"),
    _p("EWB-02", "state_threshold", "50000", unit="INR", note="docs/01 A2 Rule 138"),
    _p("EWB-03", "variance_percent", "2", unit="percent", note="docs/01 C2 EWB-03"),
    _p("EWB-03", "min_amount", "25000", unit="INR", note="docs/01 C2 EWB-03"),
    _p("EWB-04", "min_distance_km", "50", unit="km", note="docs/01 C2 EWB-04"),
    _p("EWB-05", "max_speed_kmph", "90", unit="km/h", note="docs/01 C2 EWB-05"),
    _p("EWB-08", "cancellation_percent", "10", unit="percent", note="docs/01 C2 EWB-08"),
    _p("EIN-01", "aato_threshold", "50000000", unit="INR", note="docs/01 A2 Rule 48(4): 5 crore"),
    _p("EIN-02", "reporting_days", "30", unit="days", note="docs/01 C2 EIN-02"),
    _p("EIN-02", "aato_threshold", "100000000", unit="INR", note="docs/01 C2 EIN-02: 10 crore"),
    _p("REG-02", "window_days", "90", unit="days", note="docs/01 C2 REG-02"),
    _p("REG-02", "itc_turnover_ratio", "0.9", unit="ratio", note="docs/01 C2 REG-02"),
    _p("REG-02", "min_itc", "2500000", unit="INR", note="docs/01 C2 REG-02: 25 lakh"),
    _p("REG-03", "min_gstins_at_address", "5", unit="count", note="docs/01 C2 REG-03"),
    _p("REG-04", "min_pans", "2", unit="count", note="docs/01 C2 REG-04"),
    _p("REG-07", "bar_years", "3", unit="years", note="docs/01 A2: the three-year time bar"),
    _p("BEH-01", "mean_days_late", "15", unit="days", note="docs/01 C2 BEH-01"),
    _p("BEH-03", "min_amount", "10000", unit="INR", note="docs/01 C2 BEH-03"),
    _p("BEH-05", "min_intimations", "2", unit="count", note="docs/01 C2 BEH-05"),
    _p("BEH-06", "reply_days", "30", unit="days", note="docs/01 A5, s.61(2)"),
    _p("NET-02", "min_cycle_value", "1000000", unit="INR", note="docs/01 C3 NET-02: 10 lakh"),
    _p("NET-02", "edge_prune_value", "100000", unit="INR", note="docs/01 C3 NET-02: 1 lakh"),
    _p("NET-02", "turnover_ratio", "0.3", unit="ratio", note="docs/01 C3 NET-02"),
    _p("NET-02", "max_cycle_length", "5", unit="nodes", note="docs/01 C3 NET-02"),
    _p("NET-03", "min_exposure", "500000", unit="INR", note="docs/01 C2 NET-03: 5 lakh"),
    _p("NET-05", "margin_percent", "1", unit="percent", note="docs/01 C2 NET-05"),
    _p("NET-05", "periods", "6", unit="periods", note="docs/01 C2 NET-05"),
    _p("SEC-01", "registered_share", "80", unit="percent", note="docs/01 C2 SEC-01"),
    _p("SEC-01", "rcm_rate", "18", unit="percent", note="docs/01 C2 SEC-01, Notif. 03/2019-CTR"),
    _p("SEC-05", "min_amount", "100000", unit="INR", note="docs/01 C2 SEC-05: 1 lakh"),
    # -- identities ---------------------------------------------------------
    # The ledger identity is arithmetic, not an estimate, so it holds to the
    # paisa.  The materiality threshold of one rupee belongs to the PAY-05
    # *rule*, which decides whether a breach is worth an officer's attention --
    # a distinction docs/01 draws between A4 R8 ("must hold") and C2 PAY-05
    # ("> 1 rupee").  See docs/DECISIONS.md D-0015.
    _p("R8", "tolerance", "0", unit="INR", note="docs/01 A4 R8: the identity must hold exactly"),
    _p("R4", "band_percent", "2", unit="percent", note="docs/01 A4 R4"),
    # -- annual return applicability ----------------------------------------
    _p("BEH-08", "gstr9_aato", "20000000", unit="INR", note="docs/01 A2: GSTR-9 above 2 crore"),
    _p("BEH-08", "gstr9c_aato", "50000000", unit="INR", note="docs/01 A2: GSTR-9C above 5 crore"),
    # -- P-Score banding (docs/01 B1) ---------------------------------------
    _p("PSCORE", "band_low_max", "25", unit="score", note="docs/01 B1"),
    _p("PSCORE", "band_moderate_max", "50", unit="score", note="docs/01 B1"),
    _p("PSCORE", "band_high_max", "75", unit="score", note="docs/01 B1"),
    _p("PSCORE", "percentile_flag1", "60", unit="percentile", note="docs/01 B1 RATIO_PEER"),
    _p("PSCORE", "percentile_flag2", "75", unit="percentile", note="docs/01 B1 RATIO_PEER"),
    _p("PSCORE", "percentile_flag3", "90", unit="percentile", note="docs/01 B1 RATIO_PEER"),
    _p("PSCORE", "percentile_flag4", "97", unit="percentile", note="docs/01 B1 RATIO_PEER"),
    _p("PSCORE", "yoy_pp_flag1", "5", unit="pp", note="docs/01 B1 DELTA_YOY"),
    _p("PSCORE", "yoy_pp_flag2", "10", unit="pp", note="docs/01 B1 DELTA_YOY"),
    _p("PSCORE", "yoy_pp_flag3", "20", unit="pp", note="docs/01 B1 DELTA_YOY"),
    _p("PSCORE", "yoy_pp_flag4", "35", unit="pp", note="docs/01 B1 DELTA_YOY"),
    # -- F-Score (docs/01 C4) -----------------------------------------------
    _p("FSCORE", "band_green_max", "20", unit="score", note="docs/01 C4"),
    _p("FSCORE", "band_amber_max", "45", unit="score", note="docs/01 C4"),
    _p("FSCORE", "band_orange_max", "70", unit="score", note="docs/01 C4"),
    _p("FSCORE", "severity_low", "1.0", note="docs/01 C4"),
    _p("FSCORE", "severity_medium", "2.5", note="docs/01 C4"),
    _p("FSCORE", "severity_high", "5.0", note="docs/01 C4"),
    _p("FSCORE", "severity_critical", "9.0", note="docs/01 C4"),
    _p("FSCORE", "confidence_certain", "1.0", note="docs/01 C4"),
    _p("FSCORE", "confidence_strong", "0.8", note="docs/01 C4"),
    _p("FSCORE", "confidence_advisory", "0.4", note="docs/01 C4"),
    _p("FSCORE", "weight_liability", "0.25", note="docs/01 C4 default weights"),
    _p("FSCORE", "weight_credit", "0.25", note="docs/01 C4"),
    _p("FSCORE", "weight_movement", "0.15", note="docs/01 C4"),
    _p("FSCORE", "weight_payment", "0.10", note="docs/01 C4"),
    _p("FSCORE", "weight_behaviour", "0.10", note="docs/01 C4"),
    _p("FSCORE", "weight_network", "0.15", note="docs/01 C4"),
    _p("FSCORE", "k_scale", "10", note="docs/01 C4: the per-dimension saturation constant"),
    # -- limitation (docs/01 A5) --------------------------------------------
    _p("LIMITATION", "s73_order_years", "3", unit="years", note="docs/01 A5"),
    _p("LIMITATION", "s73_scn_months_before", "3", unit="months", note="docs/01 A5"),
    _p("LIMITATION", "s74_order_years", "5", unit="years", note="docs/01 A5"),
    _p("LIMITATION", "s74_scn_months_before", "6", unit="months", note="docs/01 A5"),
    _p("LIMITATION", "s74a_order_months", "42", unit="months", note="docs/01 A5: non-fraud"),
    _p("LIMITATION", "s74a_fraud_order_months", "54", unit="months", note="docs/01 A5: fraud"),
    _p("LIMITATION", "s74a_scn_months_before", "12", unit="months", note="docs/01 A5"),
    _p("LIMITATION", "voluntary_payment_days", "60", unit="days", note="docs/01 A5"),
    _p("LIMITATION", "s74a_from_fy", "2024", unit="fy", note="docs/01 A5: s.74A from FY 2024-25"),
    # -- s.128A amnesty (docs/01 A5) ----------------------------------------
    _p("AMNESTY", "s128a_from_fy", "2017", unit="fy", note="docs/01 A5: FY 2017-18"),
    _p("AMNESTY", "s128a_to_fy", "2019", unit="fy", note="docs/01 A5: to FY 2019-20"),
)
