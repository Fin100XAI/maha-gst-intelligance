"""Ten complete filing sets, each in a different shape.

**These are synthetic.** Real GST returns are confidential under section 158 of
the CGST Act; there is no public corpus of filed returns to download, and
anybody offering one is offering something they should not have. So these are
built: ten businesses, twelve months each, GSTR-1 and GSTR-3B, with arithmetic
that holds together and discrepancies that are there on purpose.

What makes them worth having is not the numbers. It is that no two of them are
shaped alike. A department receives the portal's own export, a Tally dump, a
consultant's working file with rupee signs typed into the cells, a CSV somebody
made by saving a sheet, and a file whose headings are in Marathi. A platform
that reads only the first of those is a platform that works in a demonstration.

Each dialect below is a real shape seen in the wild:

===================  ==========================================================
``portal``           The GST portal's own export: title block, merged header,
                     spacer column, trailing totals row.
``tally``            Tally Prime: "Party's Name", "Voucher No.", amounts with
                     no decimals where they are round.
``cleartax``         ClearTax: flattened, every column present, ISO dates.
``busy``             Busy: abbreviated headings, the tax columns split by rate.
``marathi``          Marathi headings throughout, Devanagari digits absent but
                     the labels native.
``hindi``            Hindi headings.
``csv_flat``         A CSV, because somebody saved the sheet as one. No
                     workbook structure at all, so the period must come from a
                     column.
``merged``           Two-row merged headings, columns in an unhelpful order,
                     three junk columns the department does not want.
``accountant``       A working file: "₹ 1,23,456.00" as text, dd.mm.yyyy dates,
                     a Notes column, blank rows between months.
``minimal``          Only the mandatory columns, nothing else, sheets named by
                     month name rather than by period.
===================  ==========================================================

Every set carries a declared discrepancy so the engine has something true to
find, and :data:`MANIFEST` states what each one should produce. That makes the
ten a fixture as well as a demonstration: if ingestion regresses, the manifest
stops matching.

Written by ``python -m app.seed.datasets --out ../samples/datasets``.
"""

from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Final

from app.canonical import Period

__all__ = [
    "DIALECTS",
    "MANIFEST",
    "Business",
    "Dialect",
    "accrued_itc",
    "build_all",
    "build_set",
    "claimed_itc",
]

_ZERO: Final = Decimal("0.00")
_HUNDRED: Final = Decimal("100")


# ---------------------------------------------------------------------------
# the businesses
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Business:
    """One synthetic filer, with a discrepancy declared up front."""

    gstin: str
    legal_name: str
    trade_name: str
    division: str
    trade: str
    #: Monthly taxable turnover, before the discrepancy.
    monthly_taxable: Decimal
    #: Share of turnover that is inter-State, as a percentage.
    igst_share: Decimal
    rate: Decimal
    #: What is wrong with this filer, and by how much per affected month.
    defect: str
    #: Months (1-12 of the financial year) in which the defect appears.
    defect_months: tuple[int, ...] = ()
    #: How much outward tax the 3B under-declares in an affected month.
    understatement: Decimal = _ZERO
    #: Monthly purchases, which the GSTR-2B is built from.
    monthly_purchases: Decimal = _ZERO
    #: How much more credit the 3B claims than the 2B supports, per month.
    #: The outward side and the credit side are deliberately independent:
    #: a business can declare its sales honestly and still over-claim.
    itc_overclaim: Decimal = _ZERO
    itc_overclaim_months: tuple[int, ...] = ()


BUSINESSES: Final[tuple[Business, ...]] = (
    Business(
        gstin="27AAGCS4521P1ZX",
        legal_name="Shivneri Engineering Works Private Limited",
        trade_name="Shivneri Engineering",
        division="Pune-II",
        trade="Manufacture of machine tools",
        monthly_taxable=Decimal("4200000.00"),
        igst_share=Decimal("40"),
        rate=Decimal("18"),
        defect="GSTR-3B under-declares outward tax against the GSTR-1",
        defect_months=(4, 7, 11),
        understatement=Decimal("300000.00"),
        monthly_purchases=Decimal("2900000.00"),
    ),
    Business(
        gstin="27AABCT2345L1Z7",
        legal_name="Konkan Distributors LLP",
        trade_name="Konkan Distributors",
        division="Pune-I",
        trade="Wholesale of packaged foods",
        monthly_taxable=Decimal("8600000.00"),
        igst_share=Decimal("25"),
        rate=Decimal("12"),
        defect="Sustained under-declaration across most of the year",
        defect_months=(1, 2, 3, 5, 6, 8, 9, 10, 12),
        understatement=Decimal("148000.00"),
        monthly_purchases=Decimal("7100000.00"),
        itc_overclaim=Decimal("96000.00"),
        itc_overclaim_months=(3, 6, 9, 12),
    ),
    Business(
        gstin="27AACCB2894G1ZL",
        legal_name="Deccan Motors Private Limited",
        trade_name="Deccan Motors",
        division="Pune-I",
        trade="Retail of motor vehicles",
        monthly_taxable=Decimal("15400000.00"),
        igst_share=Decimal("10"),
        rate=Decimal("28"),
        defect="Clean filer. Nothing should fire; this is the control.",
        monthly_purchases=Decimal("11800000.00"),
    ),
    Business(
        gstin="27AAACN1234M1ZI",
        legal_name="Nashik Agro Processing Company Limited",
        trade_name="Nashik Agro",
        division="Nashik",
        trade="Processing of fruit and vegetables",
        monthly_taxable=Decimal("6300000.00"),
        igst_share=Decimal("55"),
        rate=Decimal("5"),
        defect="One large month under-declared, the rest clean",
        defect_months=(9,),
        understatement=Decimal("412500.00"),
        monthly_purchases=Decimal("4400000.00"),
    ),
    Business(
        gstin="27AAFCV8765R1Z5",
        legal_name="Vidarbha Textiles Private Limited",
        trade_name="Vidarbha Textiles",
        division="Nagpur",
        trade="Manufacture of cotton textiles",
        monthly_taxable=Decimal("9800000.00"),
        igst_share=Decimal("35"),
        rate=Decimal("5"),
        defect="Small, persistent shortfall -- below most thresholds by design",
        defect_months=(2, 4, 6, 8, 10, 12),
        understatement=Decimal("14000.00"),
        monthly_purchases=Decimal("8900000.00"),
        itc_overclaim=Decimal("31000.00"),
        itc_overclaim_months=(1, 5, 9),
    ),
    Business(
        gstin="27AAGCK5678T1ZD",
        legal_name="Kolhapur Foundry and Castings Limited",
        trade_name="Kolhapur Foundry",
        division="Kolhapur",
        trade="Casting of iron and steel",
        monthly_taxable=Decimal("11200000.00"),
        igst_share=Decimal("20"),
        rate=Decimal("18"),
        defect="Under-declared in the last quarter only",
        defect_months=(10, 11, 12),
        understatement=Decimal("520000.00"),
        monthly_purchases=Decimal("9600000.00"),
    ),
    Business(
        gstin="27AAJCA3456N1Z8",
        legal_name="Aurangabad Auto Components Private Limited",
        trade_name="Aurangabad Auto",
        division="Aurangabad",
        trade="Manufacture of motor vehicle parts",
        monthly_taxable=Decimal("7700000.00"),
        igst_share=Decimal("60"),
        rate=Decimal("18"),
        defect="Clean filer",
        monthly_purchases=Decimal("6200000.00"),
    ),
    Business(
        gstin="27AAHCJ9012W1ZN",
        legal_name="Jalgaon Pulses Trading Company",
        trade_name="Jalgaon Pulses",
        division="Jalgaon",
        trade="Wholesale of grain and pulses",
        monthly_taxable=Decimal("3100000.00"),
        igst_share=Decimal("15"),
        rate=Decimal("5"),
        defect="Under-declared in the first two months, then corrected",
        defect_months=(1, 2),
        understatement=Decimal("31000.00"),
        monthly_purchases=Decimal("2400000.00"),
        itc_overclaim=Decimal("18500.00"),
        itc_overclaim_months=(7, 8),
    ),
    Business(
        gstin="27AABFM7890K1ZQ",
        legal_name="Mumbai Marine Services LLP",
        trade_name="Mumbai Marine",
        division="Pune-II",
        trade="Support services to water transport",
        monthly_taxable=Decimal("5400000.00"),
        igst_share=Decimal("70"),
        rate=Decimal("18"),
        defect="Large single-month shortfall, over the DRC-01B threshold",
        defect_months=(6,),
        understatement=Decimal("2700000.00"),
        monthly_purchases=Decimal("4700000.00"),
        itc_overclaim=Decimal("640000.00"),
        itc_overclaim_months=(6,),
    ),
    Business(
        gstin="27AAECS2468H1Z6",
        legal_name="Satara Solar Energy Private Limited",
        trade_name="Satara Solar",
        division="Kolhapur",
        trade="Generation of solar electricity",
        monthly_taxable=Decimal("13500000.00"),
        igst_share=Decimal("30"),
        rate=Decimal("12"),
        defect="Alternating months under-declared",
        defect_months=(3, 5, 7, 9),
        understatement=Decimal("186000.00"),
        monthly_purchases=Decimal("14900000.00"),
    ),
)


# ---------------------------------------------------------------------------
# the dialects
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class Dialect:
    """One way a workbook can be shaped.

    Everything here is a real convention from a portal, an accounting package
    or somebody's working file. None of it is invented to be awkward.
    """

    key: str
    label: str
    #: canonical field -> the heading this dialect writes.
    headings: dict[str, str]
    #: ``strftime`` pattern, or ``"excel"`` for a real date cell.
    date_format: str
    #: ``"plain"`` | ``"grouped"`` (1,23,456.00) | ``"rupee"`` (₹ 1,23,456.00)
    amount_style: str = "plain"
    #: A title block above the header, as the portal writes.
    title_block: bool = False
    #: A merged group heading row above the column headings.
    merged_header: bool = False
    #: A blank column between two real ones.
    spacer_column: bool = False
    #: A trailing "Total" row, which must be held rather than ingested.
    totals_row: bool = False
    #: Extra columns the department does not want, in the middle of the table.
    junk_columns: tuple[str, ...] = ()
    #: ``"xlsx"`` or ``"csv"``.
    container: str = "xlsx"
    #: ``"period"`` (b2b_042025) | ``"monthname"`` (April 2025) | ``"single"``
    sheet_naming: str = "period"
    #: Blank rows scattered between records.
    blank_rows: bool = False
    #: The column order, by canonical field. Empty means the natural order.
    order: tuple[str, ...] = ()
    notes: str = ""


_NATURAL: Final[tuple[str, ...]] = (
    "counterparty_gstin",
    "counterparty_name",
    "doc_no",
    "doc_date",
    "doc_value",
    "pos",
    "reverse_charge",
    "doc_type",
    "rate",
    "taxable_value",
    "igst",
    "cgst",
    "sgst",
    "cess",
)


def _headings(**overrides: str) -> dict[str, str]:
    base = {
        "counterparty_gstin": "GSTIN/UIN of Recipient",
        "counterparty_name": "Receiver Name",
        "doc_no": "Invoice Number",
        "doc_date": "Invoice date",
        "doc_value": "Invoice Value",
        "pos": "Place Of Supply",
        "reverse_charge": "Reverse Charge",
        "doc_type": "Invoice Type",
        "rate": "Rate",
        "taxable_value": "Taxable Value",
        "igst": "Integrated Tax",
        "cgst": "Central Tax",
        "sgst": "State/UT Tax",
        "cess": "Cess",
    }
    base.update(overrides)
    return base


DIALECTS: Final[tuple[Dialect, ...]] = (
    Dialect(
        key="portal",
        label="GST portal export",
        headings=_headings(),
        date_format="%d-%m-%Y",
        title_block=True,
        merged_header=True,
        spacer_column=True,
        totals_row=True,
        notes="The baseline. If this one fails, nothing else matters.",
    ),
    Dialect(
        key="tally",
        label="Tally Prime export",
        headings=_headings(
            counterparty_gstin="Party GSTIN",
            counterparty_name="Party's Name",
            doc_no="Voucher No.",
            doc_date="Voucher Date",
            doc_value="Gross Total",
            taxable_value="Assessable Value",
            igst="IGST Amount",
            cgst="CGST Amount",
            sgst="SGST Amount",
            cess="Cess Amount",
            rate="Rate %",
        ),
        date_format="%d-%b-%Y",
        amount_style="grouped",
        notes="Tally writes its own vocabulary and groups its figures.",
    ),
    Dialect(
        key="cleartax",
        label="ClearTax export",
        headings=_headings(
            counterparty_gstin="Customer GSTIN",
            counterparty_name="Customer Name",
            doc_no="Document Number",
            doc_date="Document Date",
            doc_value="Total Invoice Value",
            taxable_value="Taxable Turnover",
            igst="IGST",
            cgst="CGST",
            sgst="SGST",
            rate="GST Rate",
        ),
        date_format="%Y-%m-%d",
        notes="Flattened and complete; the easy case after the portal.",
    ),
    Dialect(
        key="busy",
        label="Busy accounting export",
        headings=_headings(
            counterparty_gstin="Buyer GSTIN",
            counterparty_name="Buyer Name",
            doc_no="Bill No",
            doc_date="Bill Date",
            doc_value="Gross Total",
            taxable_value="Net Taxable",
            igst="I Tax",
            cgst="C Tax",
            sgst="S Tax",
            cess="Cess",
            rate="Tax Rate",
        ),
        date_format="%d/%m/%y",
        junk_columns=("Narration", "Cost Centre"),
        notes="Abbreviated headings and a two-digit year.",
    ),
    Dialect(
        key="marathi",
        label="Marathi headings",
        headings=_headings(
            counterparty_gstin="ग्राहक जीएसटीआयएन",
            counterparty_name="ग्राहकाचे नाव",
            doc_no="बीजक क्रमांक",
            doc_date="बीजक दिनांक",
            doc_value="बीजक मूल्य",
            pos="पुरवठ्याचे ठिकाण",
            rate="कर दर",
            taxable_value="करपात्र मूल्य",
            igst="एकात्मिक कर",
            cgst="केंद्रीय कर",
            sgst="राज्य कर",
            cess="उपकर",
        ),
        date_format="%d-%m-%Y",
        notes="Half the State files in Marathi. This is not an edge case.",
    ),
    Dialect(
        key="hindi",
        label="Hindi headings",
        headings=_headings(
            counterparty_gstin="प्राप्तकर्ता जीएसटीआयएन",
            counterparty_name="प्राप्तकर्त्याचे नाव",
            doc_no="चलान संख्या",
            doc_date="चलान तिथि",
            doc_value="एकूण मूल्य",
            pos="पुरवठा ठिकाण",
            rate="दर",
            taxable_value="कर योग्य मूल्य",
            igst="एकीकृत कर",
            cgst="केन्द्रीय कर",
            sgst="राज्य कर",
            cess="भरपाई उपकर",
        ),
        date_format="%d-%m-%Y",
        notes="Devanagari again, with a different vocabulary.",
    ),
    Dialect(
        key="csv_flat",
        label="Flat CSV",
        headings=_headings(),
        date_format="%Y-%m-%d",
        container="csv",
        sheet_naming="single",
        notes="No workbook structure, so the period has to come from a column.",
    ),
    Dialect(
        key="merged",
        label="Merged headings, awkward order",
        headings=_headings(),
        date_format="%d-%m-%Y",
        merged_header=True,
        junk_columns=("Sr. No.", "Remarks", "Entered By"),
        order=(
            "doc_date",
            "doc_no",
            "taxable_value",
            "cgst",
            "sgst",
            "igst",
            "cess",
            "rate",
            "counterparty_name",
            "counterparty_gstin",
            "pos",
            "doc_value",
            "reverse_charge",
            "doc_type",
        ),
        notes="The columns are in the order somebody found convenient.",
    ),
    Dialect(
        key="accountant",
        label="Consultant's working file",
        headings=_headings(
            counterparty_gstin="GSTIN",
            counterparty_name="Party Name",
            doc_no="Bill No",
            doc_date="Date",
            taxable_value="Taxable",
            igst="IGST",
            cgst="CGST",
            sgst="SGST",
        ),
        date_format="%d.%m.%Y",
        amount_style="rupee",
        junk_columns=("Notes",),
        blank_rows=True,
        notes="Rupee signs typed into the cells, and blank rows between months.",
    ),
    Dialect(
        key="minimal",
        label="Mandatory columns only",
        headings=_headings(),
        date_format="excel",
        sheet_naming="monthname",
        order=("doc_date", "counterparty_gstin", "taxable_value", "igst", "cgst", "sgst"),
        notes="Nothing but what is required, and real date cells.",
    ),
)


#: What each set should produce. The ten are a fixture as well as a demo: if
#: ingestion regresses, these numbers stop matching.
MANIFEST: Final[dict[str, dict[str, object]]] = {
    business.gstin: {
        "dialect": dialect.key,
        "legal_name": business.legal_name,
        "division": business.division,
        "defect": business.defect,
        "months_affected": len(business.defect_months),
        "understatement_per_month": format(business.understatement, "f"),
        "total_understatement": format(business.understatement * len(business.defect_months), "f"),
    }
    for business, dialect in zip(BUSINESSES, DIALECTS, strict=True)
}


# ---------------------------------------------------------------------------
# formatting
# ---------------------------------------------------------------------------


def _group_indian(value: Decimal) -> str:
    """1234567.89 -> 12,34,567.89. The last three digits, then pairs."""
    sign = "-" if value < 0 else ""
    whole, _, fraction = format(abs(value), "f").partition(".")
    fraction = (fraction + "00")[:2]
    if len(whole) <= 3:  # noqa: PLR2004 - the rule is literally "three"
        return f"{sign}{whole}.{fraction}"
    head, tail = whole[:-3], whole[-3:]
    parts: list[str] = []
    while len(head) > 2:  # noqa: PLR2004 - and then "pairs"
        parts.insert(0, head[-2:])
        head = head[:-2]
    if head:
        parts.insert(0, head)
    return f"{sign}{','.join(parts)},{tail}.{fraction}"


def _amount(value: Decimal, style: str) -> str:
    if style == "grouped":
        return _group_indian(value)
    if style == "rupee":
        return f"₹ {_group_indian(value)}"
    return format(value, "f")


def _date(when: date, dialect: Dialect) -> object:
    return when if dialect.date_format == "excel" else when.strftime(dialect.date_format)


def _sheet_name(period: Period, dialect: Dialect, prefix: str = "b2b") -> str:
    if dialect.sheet_naming == "monthname":
        return period.first_day.strftime("%B %Y")
    return f"{prefix}_{period.mmyyyy}"


# ---------------------------------------------------------------------------
# the returns
# ---------------------------------------------------------------------------


#: Half of one per cent, as the denominator that splits a rate between the two
#: local heads.
_TWO_HUNDRED: Final = Decimal("200")


def _local_heads(taxable: Decimal, rate: Decimal) -> tuple[Decimal, Decimal]:
    """CGST and SGST on an intra-State supply, each rounded on its own.

    They must be equal to the paisa: the platform quarantines a line where
    they differ, and it is right to. Halving the combined tax and giving the
    odd paisa to one side produces exactly that difference, so each head is
    computed from the taxable value at half the rate instead -- which is what
    the portal does.
    """
    half = (taxable * rate / _TWO_HUNDRED).quantize(Decimal("0.01"))
    return half, half


@dataclass(frozen=True, slots=True)
class _Line:
    counterparty_gstin: str
    counterparty_name: str
    doc_no: str
    doc_date: date
    doc_value: Decimal
    pos: str
    reverse_charge: str
    doc_type: str
    rate: Decimal
    taxable_value: Decimal
    igst: Decimal
    cgst: Decimal
    sgst: Decimal
    cess: Decimal = _ZERO


#: Every GSTIN here carries a real check digit. An invented one is rejected at
#: ingestion -- correctly -- and the whole file then reads as a platform bug
#: rather than as test data that was never valid.
_COUNTERPARTIES: Final[tuple[tuple[str, str], ...]] = (
    ("27AABCU9603R1ZN", "Maharashtra Auto Components Ltd"),
    ("29AACCB2894G1ZH", "Deccan Motors Private Limited"),
    ("24AAACN1234M1ZO", "Gujarat Traders LLP"),
    ("27AAFCV8765R1Z5", "Vidarbha Textiles Private Limited"),
    ("06AAGCK5678T1ZH", "Haryana Logistics Private Limited"),
)

#: Maharashtra. The State this deployment is for, and the one a supply is
#: intra-State with respect to.
_HOME_STATE: Final = "27"

_PLACES: Final[dict[str, str]] = {
    "27": "Maharashtra",
    "29": "Karnataka",
    "24": "Gujarat",
    "06": "Haryana",
}


def _lines_for(business: Business, period: Period, month_index: int) -> list[_Line]:
    """Four invoices a month: some intra-State, some inter-State."""
    lines: list[_Line] = []
    per_invoice = (business.monthly_taxable / Decimal("4")).quantize(Decimal("0.01"))
    # How many of the four go out of State, from the declared IGST share.
    out_of_state = int((business.igst_share / Decimal("25")).to_integral_value())

    # A line marked inter-State must go to a counterparty who is actually in
    # another State, or the file charges IGST on a 27-to-27 supply -- which
    # the platform quarantines, correctly.
    local = [pair for pair in _COUNTERPARTIES if pair[0].startswith(_HOME_STATE)]
    away = [pair for pair in _COUNTERPARTIES if not pair[0].startswith(_HOME_STATE)]

    for n in range(4):
        inter = n < out_of_state
        pool = away if inter else local
        counterparty, name = pool[(month_index + n) % len(pool)]
        pos = counterparty[:2] if inter else _HOME_STATE
        tax = (per_invoice * business.rate / _HUNDRED).quantize(Decimal("0.01"))
        cgst, sgst = _local_heads(per_invoice, business.rate)
        lines.append(
            _Line(
                counterparty_gstin=counterparty,
                counterparty_name=name,
                doc_no=f"{business.trade_name[:3].upper()}/{period.mmyyyy}/{n + 1:03d}",
                doc_date=date(period.first_day.year, period.first_day.month, min(4 + n * 6, 28)),
                doc_value=(per_invoice + tax).quantize(Decimal("0.01")),
                pos=f"{pos}-{_PLACES[pos]}",
                reverse_charge="N",
                doc_type="Regular B2B",
                rate=business.rate,
                taxable_value=per_invoice,
                igst=tax if inter else _ZERO,
                cgst=_ZERO if inter else cgst,
                sgst=_ZERO if inter else sgst,
            )
        )
    return lines


@dataclass(frozen=True, slots=True)
class FilingSet:
    """One business's year, ready to write."""

    business: Business
    dialect: Dialect
    gstr1: bytes
    gstr3b: bytes
    gstr2b: bytes = b""
    periods: tuple[Period, ...] = field(default=())


def _periods(fy_start_year: int) -> tuple[Period, ...]:
    out: list[Period] = []
    for n in range(12):
        month = 4 + n
        year = fy_start_year + (month - 1) // 12
        out.append(Period(month=((month - 1) % 12) + 1, year=year))
    return tuple(out)


# ---------------------------------------------------------------------------
# writing a GSTR-1
# ---------------------------------------------------------------------------

#: The line of GSTR-3B Table 3.1 that outward taxable supplies land on.
_T31A: Final = "(a) Outward taxable supplies (other than zero rated, nil rated and exempted)"

_THREE_B_LINES: Final[tuple[str, ...]] = (
    _T31A,
    "(b) Outward taxable supplies (zero rated)",
    "(c) Other outward supplies (nil rated, exempted)",
    "(d) Inward supplies (liable to reverse charge)",
    "(e) Non-GST outward supplies",
)

#: Where the blank spacer column goes, when a dialect has one.
_SPACER_AT: Final = 4


def _row_for(line: _Line, dialect: Dialect, period: Period) -> list[object]:
    """One invoice, in the column order and formatting this dialect uses."""
    order = dialect.order or _NATURAL
    cells: list[object] = []
    for n, name in enumerate(order):
        if dialect.spacer_column and n == _SPACER_AT:
            cells.append(None)
        value = getattr(line, name)
        if isinstance(value, Decimal):
            cells.append(_amount(value, dialect.amount_style))
        elif isinstance(value, date):
            cells.append(_date(value, dialect))
        else:
            cells.append(value)
    for junk in dialect.junk_columns:
        cells.append(f"{junk[:3].lower()}-{line.doc_no[-3:]}")
    if dialect.sheet_naming == "single":
        cells.append(period.mmyyyy)
    return cells


def _header_for(dialect: Dialect) -> list[object]:
    order = dialect.order or _NATURAL
    cells: list[object] = []
    for n, name in enumerate(order):
        if dialect.spacer_column and n == _SPACER_AT:
            cells.append(None)
        cells.append(dialect.headings[name])
    cells.extend(dialect.junk_columns)
    if dialect.sheet_naming == "single":
        cells.append("Return Period")
    return cells


#: A group heading needs somewhere to sit; below this width there is nowhere.
_WIDE_ENOUGH_FOR_A_TAX_GROUP: Final = 10


def _group_row(dialect: Dialect) -> list[object]:
    """A merged group heading above the real one, as the portal writes it."""
    width = len(_header_for(dialect))
    row: list[object] = [None] * width
    row[2] = "Invoice details"
    if width > _WIDE_ENOUGH_FOR_A_TAX_GROUP:
        row[_WIDE_ENOUGH_FOR_A_TAX_GROUP] = "Tax"
    return row


def _title_block(sheet: object, business: Business, period: Period, dialect: Dialect) -> None:
    """Whatever sits above the table, stating whose return this is."""
    append = sheet.append  # type: ignore[attr-defined]
    if dialect.title_block:
        append(["COMMERCIAL TAXES DEPARTMENT, GOVERNMENT OF MAHARASHTRA"])
        append([f"GSTR-1 outward supplies -- {business.trade_name}"])
        append([f"GSTIN {business.gstin}   Period {period.label}"])
        append([])
        return
    # Every dialect still states whose return it is somewhere above the
    # table: a file that does not is a file nobody can act on.
    append([f"GSTIN {business.gstin}  {business.legal_name}"])
    append([])


def _as_csv(business: Business, dialect: Dialect, periods: tuple[Period, ...]) -> bytes:
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer)
    writer.writerow([f"GSTIN {business.gstin}  {business.legal_name}"])
    writer.writerow(_header_for(dialect))
    for index, period in enumerate(periods):
        for line in _lines_for(business, period, index):
            writer.writerow(_row_for(line, dialect, period))
    return buffer.getvalue().encode("utf-8-sig")


def build_gstr1(business: Business, dialect: Dialect, periods: tuple[Period, ...]) -> bytes:
    """The outward-supply return for a whole year, in this dialect."""
    if dialect.container == "csv":
        return _as_csv(business, dialect, periods)

    from openpyxl import Workbook  # noqa: PLC0415 - optional dependency

    workbook = Workbook()
    first = True
    for index, period in enumerate(periods):
        name = _sheet_name(period, dialect)
        if first:
            sheet = workbook.active
            if sheet is None:  # pragma: no cover - openpyxl always gives one
                raise RuntimeError("openpyxl returned no active sheet")
            sheet.title = name
            first = False
        else:
            sheet = workbook.create_sheet(name)

        _title_block(sheet, business, period, dialect)

        if dialect.merged_header:
            sheet.append(_group_row(dialect))
        sheet.append(_header_for(dialect))

        for line in _lines_for(business, period, index):
            sheet.append(_row_for(line, dialect, period))
            if dialect.blank_rows:
                sheet.append([])

        if dialect.totals_row:
            row: list[object] = [None] * len(_header_for(dialect))
            row[0] = "Total"
            row[-1] = _amount(business.monthly_taxable, dialect.amount_style)
            sheet.append(row)

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# writing a GSTR-3B
# ---------------------------------------------------------------------------


def _declared(business: Business, period: Period, month_index: int) -> dict[str, Decimal]:
    """What the 3B says: the GSTR-1 total, less any declared shortfall."""
    lines = _lines_for(business, period, month_index)
    igst = sum((line.igst for line in lines), _ZERO)
    cgst = sum((line.cgst for line in lines), _ZERO)
    sgst = sum((line.sgst for line in lines), _ZERO)
    taxable = sum((line.taxable_value for line in lines), _ZERO)

    if month_index + 1 in business.defect_months:
        short = business.understatement
        total = igst + cgst + sgst
        if total > _ZERO:
            # Taken off the heads in proportion, so the shortfall is not an
            # artefact of whichever head happens to be largest.
            igst -= (short * igst / total).quantize(Decimal("0.01"))
            cgst -= (short * cgst / total).quantize(Decimal("0.01"))
            sgst -= (short * sgst / total).quantize(Decimal("0.01"))
        taxable -= (short * _HUNDRED / business.rate).quantize(Decimal("0.01"))

    return {"taxable": taxable, "igst": igst, "cgst": cgst, "sgst": sgst}


def build_gstr3b(business: Business, dialect: Dialect, periods: tuple[Period, ...]) -> bytes:
    """The summary return: one row per line of the return, one column per head."""
    from openpyxl import Workbook  # noqa: PLC0415 - optional dependency

    workbook = Workbook()
    first = True
    for index, period in enumerate(periods):
        name = _sheet_name(period, dialect, prefix="GSTR3B")[:31]
        if first:
            sheet = workbook.active
            if sheet is None:  # pragma: no cover
                raise RuntimeError("openpyxl returned no active sheet")
            sheet.title = name
            first = False
        else:
            sheet = workbook.create_sheet(name)

        declared = _declared(business, period, index)
        style = dialect.amount_style

        sheet.append(["FORM GSTR-3B"])
        sheet.append([f"GSTIN {business.gstin}   {business.legal_name}"])
        sheet.append([f"Period {period.label}"])
        sheet.append(
            ["3.1 Details of Outward Supplies and inward supplies liable to reverse charge"]
        )
        sheet.append([])
        sheet.append(
            [
                "Nature of Supplies",
                "Total Taxable value",
                "Integrated Tax",
                "Central Tax",
                "State/UT Tax",
                "Cess",
            ]
        )
        for label in _THREE_B_LINES:
            if label == _T31A:
                sheet.append(
                    [
                        label,
                        _amount(declared["taxable"], style),
                        _amount(declared["igst"], style),
                        _amount(declared["cgst"], style),
                        _amount(declared["sgst"], style),
                        _amount(_ZERO, style),
                    ]
                )
            else:
                sheet.append([label, *[_amount(_ZERO, style)] * 5])

        # Table 4, the credit side. Without it the 2B has nothing to be
        # compared against, and twelve of the fifty-seven rules cannot run.
        sheet.append([])
        sheet.append(["4. Eligible ITC"])
        sheet.append(
            [
                "Details",
                "Integrated Tax",
                "Central Tax",
                "State/UT Tax",
                "Cess",
            ]
        )
        claimed = claimed_itc(business, period, index)
        # Claimed entirely at 4(A)(5) "All other ITC": these are ordinary
        # domestic purchases, not imports, ISD or reverse charge.
        half = (claimed / Decimal("2")).quantize(Decimal("0.01"))
        for line, igst, cgst, sgst in (
            ("(1) Import of goods", _ZERO, _ZERO, _ZERO),
            ("(2) Import of services", _ZERO, _ZERO, _ZERO),
            (
                "(3) Inward supplies liable to reverse charge (other than 1 & 2 above)",
                _ZERO,
                _ZERO,
                _ZERO,
            ),
            ("(4) Inward supplies from ISD", _ZERO, _ZERO, _ZERO),
            ("(5) All other ITC", _ZERO, half, claimed - half),
        ):
            sheet.append(
                [
                    line,
                    _amount(igst, style),
                    _amount(cgst, style),
                    _amount(sgst, style),
                    _amount(_ZERO, style),
                ]
            )

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


# ---------------------------------------------------------------------------
# the ten
# ---------------------------------------------------------------------------


def build_set(business: Business, dialect: Dialect, *, fy_start_year: int = 2025) -> FilingSet:
    periods = _periods(fy_start_year)
    return FilingSet(
        business=business,
        dialect=dialect,
        gstr1=build_gstr1(business, dialect, periods),
        gstr3b=build_gstr3b(business, dialect, periods),
        gstr2b=build_gstr2b(business, dialect, periods),
        periods=periods,
    )


def build_all(*, fy_start_year: int = 2025) -> list[FilingSet]:
    """All ten, one dialect each."""
    return [
        build_set(business, dialect, fy_start_year=fy_start_year)
        for business, dialect in zip(BUSINESSES, DIALECTS, strict=True)
    ]


# ---------------------------------------------------------------------------
# the credit side: GSTR-2B, and the Table 4 it is compared against
# ---------------------------------------------------------------------------

#: Every supplier GSTIN here carries a real check digit -- see the note on
#: ``_COUNTERPARTIES``. An invented one is refused at ingestion, correctly, and
#: the whole file then reads as a platform bug rather than as bad test data.
_SUPPLIERS: Final[tuple[tuple[str, str], ...]] = (
    ("27AAACS1234F1ZS", "Sahyadri Steel Suppliers"),
    ("27AABCP5678K1ZV", "Pune Packaging Private Limited"),
    ("24AAACG9012L1ZP", "Gujarat Chemicals LLP"),
    ("29AAFCB3456M1Z9", "Bengaluru Components Private Limited"),
    ("27AAGCM7890N1ZL", "Maharashtra Logistics Services"),
    ("06AABCH2345P1ZF", "Haryana Tooling Company"),
    ("27AADCR6789Q1Z9", "Ratnagiri Rubber Works"),
    ("33AAECT0123R1ZB", "Tamil Nadu Electricals Limited"),
)

_DECEMBER: Final = 12
_MONTHS: Final = 12
#: The 11th is the GSTR-1 due date; a late supplier files on the 20th of the
#: month after. Both are the shape of the data, not a statutory claim -- the
#: due dates the engine uses come from the rate card, never from here.
_DUE_DAY: Final = 11
_LATE_DAY: Final = 20

#: Documents per month in the 2B. Enough to make a purchase pattern legible
#: without making a twelve-month workbook unreadable.
_DOCS_PER_MONTH: Final = 6

#: The GSTR-2B column headings the portal writes, in its own order.
_TWO_B_HEADER: Final[tuple[str, ...]] = (
    "GSTIN of supplier",
    "Trade/Legal name",
    "Invoice number",
    "Invoice Date",
    "Invoice Value",
    "Place of supply",
    "Supply Attract Reverse Charge",
    "Rate (%)",
    "Taxable Value",
    "Integrated Tax",
    "Central Tax",
    "State/UT Tax",
    "Cess",
    "GSTR-1/IFF/GSTR-5 Period",
    "GSTR-1/IFF/GSTR-5 Filing Date",
    "ITC Availability",
    "Reason",
)


@dataclass(frozen=True, slots=True)
class _Credit:
    """One document in the GSTR-2B: credit the supplier says it gave."""

    supplier_gstin: str
    supplier_name: str
    doc_no: str
    doc_date: date
    doc_value: Decimal
    pos: str
    rate: Decimal
    taxable_value: Decimal
    igst: Decimal
    cgst: Decimal
    sgst: Decimal
    supplier_period: str
    supplier_filed: date
    itc_available: str
    reason: str


def _credits_for(business: Business, period: Period, month_index: int) -> list[_Credit]:
    """A month of purchases, as the suppliers themselves declared them.

    Two things are deliberately imperfect, because both are ordinary and both
    are things a rule has to cope with:

    * one supplier files late most months, so the credit arrives in a later
      2B than the invoice date suggests; and
    * one document a quarter is marked ITC-unavailable under section 17(5),
      which must not be counted as credit the taxpayer was entitled to.
    """
    credits: list[_Credit] = []
    per_doc = (business.monthly_purchases / Decimal(_DOCS_PER_MONTH)).quantize(Decimal("0.01"))

    for n in range(_DOCS_PER_MONTH):
        supplier, name = _SUPPLIERS[(month_index * 2 + n) % len(_SUPPLIERS)]
        inter = supplier[:2] != "27"
        pos = "27-Maharashtra"
        tax = (per_doc * business.rate / _HUNDRED).quantize(Decimal("0.01"))
        cgst, sgst = _local_heads(per_doc, business.rate)

        # The last supplier in the rotation files a month late, so its credit
        # lands in a later statement than the invoice date suggests.
        late = n == _DOCS_PER_MONTH - 1
        rolls_over = late and period.first_day.month == _DECEMBER
        filed = date(
            period.first_day.year + (1 if rolls_over else 0),
            (period.first_day.month % _MONTHS) + 1 if late else period.first_day.month,
            _LATE_DAY if late else _DUE_DAY,
        )

        # One document a quarter is blocked credit under s.17(5).
        blocked = n == 0 and period.first_day.month % 3 == 0
        credits.append(
            _Credit(
                supplier_gstin=supplier,
                supplier_name=name,
                doc_no=f"{name[:3].upper()}/{period.mmyyyy}/{n + 1:03d}",
                doc_date=date(period.first_day.year, period.first_day.month, min(3 + n * 4, 28)),
                doc_value=(per_doc + tax).quantize(Decimal("0.01")),
                pos=pos,
                rate=business.rate,
                taxable_value=per_doc,
                igst=tax if inter else _ZERO,
                cgst=_ZERO if inter else cgst,
                sgst=_ZERO if inter else sgst,
                supplier_period=period.mmyyyy,
                supplier_filed=filed,
                itc_available="No" if blocked else "Yes",
                reason="Blocked credit under section 17(5)" if blocked else "",
            )
        )
    return credits


def accrued_itc(business: Business, period: Period, month_index: int) -> Decimal:
    """The credit the 2B actually supports: available documents only.

    A blocked document is in the 2B and is not credit. Summing the whole
    statement is the commonest way to get this wrong, and it overstates the
    taxpayer's entitlement, which is the direction that loses money.
    """
    return sum(
        (
            credit.igst + credit.cgst + credit.sgst
            for credit in _credits_for(business, period, month_index)
            if credit.itc_available == "Yes"
        ),
        _ZERO,
    )


def claimed_itc(business: Business, period: Period, month_index: int) -> Decimal:
    """What the GSTR-3B claims at Table 4(A)(5), which may be more."""
    accrued = accrued_itc(business, period, month_index)
    if month_index + 1 in business.itc_overclaim_months:
        return accrued + business.itc_overclaim
    return accrued


def build_gstr2b(business: Business, dialect: Dialect, periods: tuple[Period, ...]) -> bytes:
    """The auto-drafted credit statement, document by document."""
    from openpyxl import Workbook  # noqa: PLC0415 - optional dependency

    workbook = Workbook()
    first = True
    for index, period in enumerate(periods):
        name = _sheet_name(period, dialect, prefix="B2B")[:31]
        if first:
            sheet = workbook.active
            if sheet is None:  # pragma: no cover - openpyxl always gives one
                raise RuntimeError("openpyxl returned no active sheet")
            sheet.title = name
            first = False
        else:
            sheet = workbook.create_sheet(name)

        sheet.append(["FORM GSTR-2B  -  AUTO-DRAFTED INPUT TAX CREDIT STATEMENT"])
        sheet.append([f"GSTIN {business.gstin}   {business.legal_name}"])
        sheet.append([f"Return Period {period.label}"])
        sheet.append([])
        sheet.append(list(_TWO_B_HEADER))

        style = dialect.amount_style
        for credit in _credits_for(business, period, index):
            sheet.append(
                [
                    credit.supplier_gstin,
                    credit.supplier_name,
                    credit.doc_no,
                    _date(credit.doc_date, dialect),
                    _amount(credit.doc_value, style),
                    credit.pos,
                    "N",
                    format(credit.rate, "f"),
                    _amount(credit.taxable_value, style),
                    _amount(credit.igst, style),
                    _amount(credit.cgst, style),
                    _amount(credit.sgst, style),
                    _amount(_ZERO, style),
                    credit.supplier_period,
                    _date(credit.supplier_filed, dialect),
                    credit.itc_available,
                    credit.reason,
                ]
            )

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
