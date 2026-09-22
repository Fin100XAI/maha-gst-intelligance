"""What was in the file, what was empty, and what is nil because it must be.

Coverage is the difference between *"we checked and found nothing"* and
*"we could not check"*, and Law 5 turns on it. A check whose dataset is absent
reports `NOT_EVALUATED` naming what it needed; a check whose dataset is
genuinely empty reports a clean pass. Both look identical on screen unless
something says which is which.

Three of the four states are counting. The fourth is the one everyone gets
wrong.

**`NIL_BY_IDENTITY`.** A GSTR-1 carrying only B2B and CDN looks incomplete.
But 3B table 3.1 is auto-populated from GSTR-1, so if the sections that *are*
present sum to the 3.1 outward liability to the paisa, there is nothing else
in the return: no B2C, no exports, no advances. The missing sections are not
missing, they are nil, and every check over them is fully computable.

Guessing either way is a defect with a direction. Guessing `ABSENT` abstains
on a file that could have been decided, and an abstention nobody reads is how
a real finding is lost. Guessing `PRESENT` invents a reconciliation against
sections that were never filed.

**Why only GSTR-1 gets this state.** The same arithmetic on the inward side -
2B against 3B table 4(A)(5) - is not an identity, it is check B-01. Reading a
match there as proof that the unseen sections are nil would use the answer to
a question to decide whether the question may be asked, and would suppress the
highest-value ITC check in the rulebook on exactly the files where it agrees.

Pure: no I/O, no clock, no randomness. `as_of` is not needed and not taken.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Final

from app.canonical import Period, SupplySection
from app.engine.records import TaxpayerData
from app.engine.scorecard import Coverage
from app.money import TaxVector

__all__ = ["GSTR1_SECTIONS", "coverage_for", "gstr1_section_coverage"]

_ZERO: Final[Decimal] = Decimal("0.00")

#: The GSTR-1 sections a filer may have to declare. `AMENDMENT` is excluded:
#: it is a correction to another section rather than a section of its own, and
#: a return with no amendments is the normal case, not a gap in coverage.
GSTR1_SECTIONS: Final[tuple[SupplySection, ...]] = (
    SupplySection.B2B,
    SupplySection.B2CL,
    SupplySection.B2CS,
    SupplySection.EXPWP,
    SupplySection.EXPWOP,
    SupplySection.SEZWP,
    SupplySection.SEZWOP,
    SupplySection.DEEMED,
    SupplySection.CDNR,
    SupplySection.CDNUR,
    SupplySection.ECOM_9_5,
    SupplySection.NIL_EXEMPT,
    SupplySection.AT,
)

#: Datasets reported as one unit, with no sections to account for separately.
_WHOLE_DATASETS: Final[tuple[str, ...]] = (
    "gstr3b",
    "ledgers",
    "eway_bill",
    "einvoice",
    "filing_status",
    "supplier_filing_status",
)


def _outward_declared(data: TaxpayerData, period: Period) -> TaxVector:
    """Tax declared across every outward section the file actually carries.

    Signed, so a credit note reduces the total exactly as it does in the
    return that 3.1 was populated from. Amendment rows are included because
    the portal populates 3.1 from the amended figures.
    """
    return sum(
        (row.signed_tax for row in data.outward_for(period)),
        TaxVector(),
    )


def _sections_filed(data: TaxpayerData, period: Period) -> set[str]:
    return {row.section for row in data.outward_for(period) if row.section}


def _remainder_is_nil(data: TaxpayerData, period: Period) -> bool:
    """Whether 3B's own figure proves the unfiled sections carry nothing.

    Exact equality, head by head, and deliberately so. A tolerance here would
    be a threshold nobody voted for: a rupee of difference is a rupee of
    undeclared supply somewhere, and calling it nil would close the file on
    it. `TaxVector` equality is head-wise, so an IGST/CGST swap that nets to
    zero does not pass either.
    """
    filed = _sections_filed(data, period)
    if not filed:
        # Nothing to reason from. An empty return cannot prove itself nil.
        return False
    three_b = data.return_3b_for(period)
    if three_b is None:
        return False
    return _outward_declared(data, period) == three_b.outward_tax


def gstr1_section_coverage(data: TaxpayerData, period: Period) -> dict[str, Coverage]:
    """One state per GSTR-1 section, keyed `gstr1:<SECTION>`.

    Per section rather than per dataset because the enum only makes sense at
    that grain: "GSTR-1 is present" says nothing about whether the B2C table
    was filed, and it is the missing table that decides whether a check over
    B2C may run.
    """
    if not data.outward:
        return {f"gstr1:{section.value}": Coverage.ABSENT for section in GSTR1_SECTIONS}

    filed = _sections_filed(data, period)
    nil = _remainder_is_nil(data, period)

    out: dict[str, Coverage] = {}
    for section in GSTR1_SECTIONS:
        name = section.value
        if name in filed:
            out[f"gstr1:{name}"] = Coverage.PRESENT
        elif nil:
            out[f"gstr1:{name}"] = Coverage.NIL_BY_IDENTITY
        else:
            out[f"gstr1:{name}"] = Coverage.ABSENT
    return out


def coverage_for(data: TaxpayerData, period: Period) -> dict[str, Coverage]:
    """Every dataset's coverage for one filing period.

    `PRESENT_EMPTY` is reserved for a dataset the taxpayer has in the financial
    year but not in this period - a real observation, and different from never
    having uploaded it at all. An officer looking at a dark check needs to know
    which, because one is a question for the taxpayer and the other is a
    question for whoever did the upload.
    """
    out: dict[str, Coverage] = dict(gstr1_section_coverage(data, period))

    out["gstr2b"] = _presence(
        bool(data.inward),
        any(row.period == period and row.source_form == "GSTR2B" for row in data.inward),
    )
    out["gstr2a"] = _presence(
        bool(data.inward),
        any(row.period == period and row.source_form == "GSTR2A" for row in data.inward),
    )

    in_period: dict[str, bool] = {
        "gstr3b": data.return_3b_for(period) is not None,
        "ledgers": any(row.period == period for row in data.ledgers),
        "eway_bill": any(row.period == period for row in data.ewb),
        "einvoice": any(row.period == period for row in data.einvoices),
        "filing_status": any(row.period == period for row in data.filings),
        "supplier_filing_status": bool(data.supplier_filing),
    }
    held = data.present_datasets()
    for name in _WHOLE_DATASETS:
        out[name] = _presence(name in held, in_period[name])
    return out


def _presence(in_year: bool, in_period: bool) -> Coverage:
    if in_period:
        return Coverage.PRESENT
    return Coverage.PRESENT_EMPTY if in_year else Coverage.ABSENT
