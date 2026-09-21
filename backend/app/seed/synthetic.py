"""The synthetic demonstration dataset -- docs/04 SYNTHETIC DATASET.

Twelve taxpayers in FY 2025-26, straddling the 22 September 2025 rate boundary
and inside the post-hard-lock regime, plus one FY 2022-23 taxpayer for the
pre-lock regime and the three-year bar.

GSTINs are checksum-valid but synthetic, State code 27, with fictional names.
Workbooks are written to look like real portal exports: a title block, a merged
header, blank spacer columns, a trailing totals row, inconsistent date formats
between sheets, and one sheet with Marathi headers.

**Taxpayer 1 is the control and must fire nothing.**  A platform that cannot
show a clean taxpayer cannot be trusted on a dirty one.

> Before the first real demo, ingest at least three genuine (anonymised)
> departmental workbooks.  Synthetic data makes an engine look infallible,
> because the generator and the engine share assumptions.  The gap between what
> this set catches and what real files do is the distance between a convincing
> pilot and a system that survives its first week.
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any, Final

from app.canonical import FinancialYear, Period, gstin_checksum
from app.money import D

__all__ = ["PROFILES", "SyntheticTaxpayer", "build_workbook", "synthetic_gstin"]


def synthetic_gstin(pan: str, entity: str = "1") -> str:
    """A checksum-valid GSTIN for State 27 from a fictional PAN."""
    body = f"27{pan}{entity}Z"
    return body + gstin_checksum(body)


@dataclass(frozen=True, slots=True)
class SyntheticTaxpayer:
    """One profile in the demonstration set, and what it is built to fire."""

    number: int
    pan: str
    legal_name: str
    trade_name: str
    sector_code: str
    division: str
    officer_id: str
    turnover: Decimal
    fy: str
    fires: tuple[str, ...]
    #: What the generator does to produce those findings.
    shape: dict[str, Any] = field(default_factory=dict)

    @property
    def gstin(self) -> str:
        return synthetic_gstin(self.pan)

    @property
    def financial_year(self) -> FinancialYear:
        return FinancialYear.parse(self.fy)

    def as_dict(self) -> dict[str, Any]:
        return {
            "number": self.number,
            "gstin": self.gstin,
            "legal_name": self.legal_name,
            "trade_name": self.trade_name,
            "sector_code": self.sector_code,
            "division": self.division,
            "officer_id": self.officer_id,
            "turnover": format(self.turnover, "f"),
            "fy": self.fy,
            "fires": list(self.fires),
        }


_CR: Final[Decimal] = Decimal("10000000")


def _crore(value: str) -> Decimal:
    return (D(value) * _CR).quantize(Decimal("0.01"))


PROFILES: Final[tuple[SyntheticTaxpayer, ...]] = (
    SyntheticTaxpayer(
        number=1,
        pan="AAACU1234K",
        legal_name="Sahyadri Precision Works Private Limited",
        trade_name="Sahyadri Precision",
        sector_code="84",
        division="Pune-I",
        officer_id="sto.pune.1",
        turnover=_crore("48"),
        fy="2025-26",
        fires=(),
        shape={
            "role": "control",
            "note": "The control. Fires nothing. A platform that cannot show a "
            "clean taxpayer cannot be trusted on a dirty one.",
        },
    ),
    SyntheticTaxpayer(
        number=2,
        pan="AABCT2345L",
        legal_name="Konkan Distributors LLP",
        trade_name="Konkan Distributors",
        sector_code="72",
        division="Pune-I",
        officer_id="sto.pune.1",
        turnover=_crore("22"),
        fy="2025-26",
        fires=("OUT-01", "OUT-02", "BEH-01", "P09", "P11"),
        shape={
            "out01_shortfall_pct": "12",
            "note": "OUT-01 below the Rule 88C threshold, so the route is ASMT-10 and not DRC-01B.",
            "late_returns": 7,
        },
    ),
    SyntheticTaxpayer(
        number=3,
        pan="AACCW3456M",
        legal_name="Deccan Infrastructure Projects Private Limited",
        trade_name="Deccan Infra",
        sector_code="99",
        division="Pune-II",
        officer_id="sto.pune.4",
        turnover=_crore("65"),
        fy="2025-26",
        fires=("ITC-01", "ITC-07", "SEC-01", "P14", "P18", "P19"),
        shape={"itc01_excess": "3200000", "exempt_share": "0.22", "registered_share": "62"},
    ),
    SyntheticTaxpayer(
        number=4,
        pan="AADCE4567N",
        legal_name="Godavari Exports Private Limited",
        trade_name="Godavari Exports",
        sector_code="52",
        division="Nashik",
        officer_id="sto.nashik.2",
        turnover=_crore("31"),
        fy="2025-26",
        fires=("OUT-04", "SEC-04", "P04", "P21", "P23"),
        shape={"lut_expired_on": "2025-09-30", "zero_rated_without_documents": True},
    ),
    SyntheticTaxpayer(
        number=5,
        pan="AAECT5678P",
        legal_name="Vidarbha Trading Company",
        trade_name="Vidarbha Trading",
        sector_code="72",
        division="Nagpur",
        officer_id="sto.nagpur.1",
        turnover=_crore("18"),
        fy="2025-26",
        fires=("ITC-02", "ITC-05", "P14"),
        shape={
            "defaulting_suppliers": 14,
            "reversal_required": "3842110",
            "note": "The Rule 37A demonstration: 14 suppliers, 38.42 lakh, "
            "both sides of the join departmental data.",
        },
    ),
    SyntheticTaxpayer(
        number=6,
        pan="AAFCG6789Q",
        legal_name="Sahyadri Roadlines",
        trade_name="Sahyadri Roadlines",
        sector_code="99",
        division="Pune-II",
        officer_id="sto.pune.4",
        turnover=_crore("9"),
        fy="2025-26",
        fires=("EWB-04", "EWB-05", "EWB-08", "P05", "P16"),
        shape={"impossible_movements": 3, "part_b_missing": 11, "cancellation_rate": "14"},
    ),
    SyntheticTaxpayer(
        number=7,
        pan="AAGCR7890R",
        legal_name="Marathwada Retail Private Limited",
        trade_name="Marathwada Retail",
        sector_code="62",
        division="Aurangabad",
        officer_id="sto.abad.3",
        turnover=_crore("27"),
        fy="2025-26",
        fires=("OUT-12", "OUT-19", "EIN-01", "P08", "P31"),
        shape={
            "march_spike_multiple": "4.2",
            "b2cs_with_known_counterparty": 9,
            "no_irns": True,
        },
    ),
    SyntheticTaxpayer(
        number=8,
        pan="AAHCM8901S",
        legal_name="Bhima Alloys Limited",
        trade_name="Bhima Alloys",
        sector_code="72",
        division="Pune-I",
        officer_id="sto.pune.1",
        turnover=_crore("120"),
        fy="2025-26",
        fires=("EIN-02", "OUT-07", "PAY-01", "P07"),
        shape={
            "late_irns": 317,
            "irn_lag_days": 45,
            "rate_after_gst20": "28",
            "note": "OUT-07 fires because 28% was charged after 22 September 2025, "
            "when the notified rate had changed. P07 at Flag 4.",
        },
    ),
    SyntheticTaxpayer(
        number=9,
        pan="AAJCS9012T",
        legal_name="Panchganga Commodities Private Limited",
        trade_name="Panchganga Commodities",
        sector_code="72",
        division="Kolhapur",
        officer_id="sto.kop.1",
        turnover=_crore("14"),
        fy="2025-26",
        fires=("REG-02", "ITC-06", "REG-03", "P24", "P12"),
        shape={"registered_days_before_first_claim": 41, "shared_address": True},
    ),
    SyntheticTaxpayer(
        number=10,
        pan="AAKCS0123U",
        legal_name="Krishna Valley Traders Private Limited",
        trade_name="Krishna Valley Traders",
        sector_code="72",
        division="Kolhapur",
        officer_id="sto.kop.1",
        turnover=_crore("16"),
        fy="2025-26",
        fires=("NET-02", "NET-05", "REG-04", "P24"),
        shape={"cycle_with": (9, 11), "cycle_value": "12000000"},
    ),
    SyntheticTaxpayer(
        number=11,
        pan="AALCS1234V",
        legal_name="Bhima Valley Commodities Private Limited",
        trade_name="Bhima Valley Commodities",
        sector_code="72",
        division="Kolhapur",
        officer_id="sto.kop.1",
        turnover=_crore("11"),
        fy="2025-26",
        fires=("NET-02", "REG-06", "ITC-17", "P24"),
        shape={"cancelled_on": "2025-11-30", "activity_after_cancellation": True},
    ),
    SyntheticTaxpayer(
        number=12,
        pan="AAMCN2345W",
        legal_name="Tapi Engineering Works",
        trade_name="Tapi Engineering",
        sector_code="84",
        division="Jalgaon",
        officer_id="sto.jal.1",
        turnover=_crore("7"),
        fy="2022-23",
        fires=("REG-07", "BEH-02", "BEH-08", "OUT-01", "P12"),
        shape={
            "unfiled_from": "062022",
            "note": "Pre-hard-lock regime, and the three-year bar has already "
            "closed on the earliest periods.",
        },
    ),
)


# ---------------------------------------------------------------------------
# workbook generation
# ---------------------------------------------------------------------------

#: The portal's own GSTR-1 B2B export header.
B2B_HEADER: Final[list[str]] = [
    "GSTIN/UIN of Recipient",
    "Receiver Name",
    "Invoice Number",
    "Invoice date",
    "Invoice Value",
    "Place Of Supply",
    "Reverse Charge",
    "Applicable % of Tax Rate",
    "Invoice Type",
    "E-Commerce GSTIN",
    "Rate",
    "Taxable Value",
    "Cess Amount",
    "Integrated Tax",
    "Central Tax",
    "State/UT Tax",
]

#: The same header in Marathi, for the sheet that proves the lexicon works.
B2B_HEADER_MR: Final[list[str]] = [
    "ग्राहक जीएसटीआयएन",
    "ग्राहकाचे नाव",
    "पावती क्रमांक",
    "पावती दिनांक",
    "पुरवठ्याचे ठिकाण",
    "दर",
    "करपात्र मूल्य",
    "आयजीएसटी",
]

#: Places of supply outside Maharashtra, so the set exercises IGST as well as
#: the CGST+SGST pair.
_OUT_OF_STATE: Final[tuple[str, ...]] = ("29", "24")

#: The first two lines of each B2B sheet are intra-State (CGST + SGST); the
#: rest go out of State so IGST is exercised too.  A generator that emitted
#: IGST on an intra-State supply would be quarantined by the validator, which
#: is how this number was arrived at.
_FIRST_IGST_LINE: Final[int] = 2
_STATE_NAMES: Final[dict[str, str]] = {
    "27": "Maharashtra",
    "29": "Karnataka",
    "24": "Gujarat",
}

#: Date formats differ between sheets, exactly as they do in real files.
_DATE_FORMATS: Final[tuple[str, ...]] = ("%d-%m-%Y", "%d/%m/%y", "%d-%b-%Y", "%Y-%m-%d")


def _format_date(when: date, sheet_index: int) -> str:
    return when.strftime(_DATE_FORMATS[sheet_index % len(_DATE_FORMATS)])


def build_workbook(
    taxpayer: SyntheticTaxpayer,
    *,
    periods: tuple[Period, ...],
    counterparties: tuple[str, ...],
    marathi_sheet: bool = False,
) -> bytes:
    """Write a GSTR-1 workbook shaped like a portal export.

    Title block, merged two-row header, a blank spacer column, a trailing
    totals row, and a date format that differs from the next sheet's.
    """
    from openpyxl import Workbook  # noqa: PLC0415 - optional dependency

    workbook = Workbook()
    first = True

    for index, period in enumerate(periods):
        title = f"b2b_{period.mmyyyy}"
        sheet = workbook.active if first else workbook.create_sheet(title)
        if first:
            if sheet is None:  # pragma: no cover - openpyxl always gives one
                raise RuntimeError("openpyxl returned no active sheet")
            sheet.title = title
            first = False

        # A title block, as the portal writes it.
        sheet.append(["COMMERCIAL TAXES DEPARTMENT, GOVERNMENT OF MAHARASHTRA"])
        sheet.append([f"GSTR-1 outward supplies -- {taxpayer.trade_name}"])
        sheet.append([f"GSTIN {taxpayer.gstin}   Period {period.label}"])
        sheet.append([])

        # A merged two-row header: a group heading above, the columns below.
        sheet.append(
            [
                None,
                None,
                "Invoice",
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                "Tax",
                None,
                None,
            ]
        )
        sheet.append(B2B_HEADER)

        base = (taxpayer.turnover / Decimal(len(periods)) / Decimal(4)).quantize(Decimal("0.01"))
        for line in range(4):
            counterparty = counterparties[(index + line) % len(counterparties)]
            taxable = base
            tax = (taxable * Decimal("18") / Decimal("100")).quantize(Decimal("0.01"))
            # The head follows the place of supply.  Every counterparty in this
            # set is registered in Maharashtra, so two of the four lines are
            # given an out-of-State place of supply to exercise IGST as well.
            place_of_supply = (
                _OUT_OF_STATE[line % len(_OUT_OF_STATE)] if line >= _FIRST_IGST_LINE else "27"
            )
            intra = place_of_supply == "27"
            half = (tax / Decimal("2")).quantize(Decimal("0.01"))
            igst = "0" if intra else format(tax, "f")
            cgst = format(half, "f") if intra else "0"
            # CGST and SGST must be equal to the paisa on an intra-State supply.
            sgst = format(tax - half, "f") if intra else "0"
            sheet.append(
                [
                    counterparty,
                    f"Counterparty {line + 1}",
                    f"{taxpayer.trade_name[:3].upper()}/{period.mmyyyy}/{line + 1:03d}",
                    _format_date(period.first_day, index),
                    None,  # a blank spacer column, as the portal leaves it
                    f"{place_of_supply}-{_STATE_NAMES[place_of_supply]}",
                    "N",
                    None,
                    "Regular B2B",
                    None,
                    "18",
                    format(taxable, "f"),
                    "0",
                    igst,
                    cgst,
                    sgst,
                ]
            )
        # A trailing totals row, which must be quarantined rather than ingested.
        sheet.append(
            [
                "Total",
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                None,
                format(base * 4, "f"),
                None,
                None,
                None,
                None,
            ]
        )

    if marathi_sheet:
        sheet = workbook.create_sheet(f"b2b_marathi_{periods[0].mmyyyy}")
        sheet.append(B2B_HEADER_MR)
        base = (taxpayer.turnover / Decimal("200")).quantize(Decimal("0.01"))
        sheet.append(
            [
                counterparties[0],
                "ग्राहक",
                "MR/001",
                _format_date(periods[0].first_day, 2),
                "29-Karnataka",
                "18",
                format(base, "f"),
                format((base * Decimal("18") / Decimal("100")).quantize(Decimal("0.01")), "f"),
            ]
        )

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
