"""Which of the 141 departmental checks this platform can answer, and with what.

One entry per matrix row that a built check genuinely answers. **Genuinely** is
the whole discipline here: it is easy to draw a line from `E-01 Motor vehicles`
to `ITC-10 Indicators of credit blocked under s.17(5)` and call the module
covered, and it would be false - ITC-10 reports that *something* in the s.17(5)
family looks blocked, not that a car was bought. A row with no honest answer is
left out, and the run reports it as `NOT_BUILT` naming the data it needs.

The count is the point of the screen. 141 checks, and the department should be
able to see at a glance how many of them a GSTR-only platform can reach - and
what the rest would cost in data.
"""

from __future__ import annotations

from typing import Final

__all__ = ["ANSWERED_BY", "coverage_note"]

#: matrix id -> the built check ids that answer it, and why the link holds.
#:
#: Where several checks answer one matrix row, the row fails if any of them
#: fires: the department's check is the question, and the platform may have
#: split it.
ANSWERED_BY: Final[dict[str, tuple[str, ...]]] = {
    # --- A. Data integrity -------------------------------------------------
    # A-01 wants a live GSTIN master. What the platform has is the two checks
    # that catch the same vendors from the returns themselves.
    "A-01": ("ITC-05", "ITC-06"),
    "A-02": ("BEH-01", "BEH-08", "REG-07"),
    # --- B. ITC eligibility ------------------------------------------------
    "B-01": ("ITC-01",),
    "B-04": ("B-04",),
    "B-07": ("ITC-04",),
    "B-08": ("B-08",),
    "B-10": ("ITC-05", "ITC-06"),
    "B-11": ("EIN-04",),
    # --- C. Reverse charge -------------------------------------------------
    # C-02 is the only RCM row answerable from 3B alone: the credit taken
    # against the tax discharged. The rest need the general ledger.
    "C-02": ("ITC-13",),
    # --- D. Place of supply ------------------------------------------------
    "D-01": ("OUT-11", "X-07"),
    # --- F. Reversals and apportionment ------------------------------------
    "F-01": ("ITC-07",),
    "F-06": ("PAY-01",),
    # --- G. Outward supplies -----------------------------------------------
    "G-02": ("OUT-01", "OUT-02"),
    "G-03": ("OUT-14", "EIN-04"),
    "G-04": ("EIN-01", "EIN-02"),
    "G-05": ("EWB-01", "EWB-02", "EWB-03"),
    "G-10": ("OUT-07", "X-03"),
    "G-11": ("OUT-04",),
    "G-12": ("X-09",),
    "G-14": ("X-10",),
    "G-15": ("X-12",),
    # --- H. Credit and debit notes -----------------------------------------
    "H-01": ("OUT-09",),
    "H-02": ("X-02", "X-06"),
    "H-06": ("ITC-21",),
    "H-08": ("OUT-08",),
    # --- J. Interest, fees, payments ---------------------------------------
    "J-01": ("PAY-02",),
    "J-02": ("PAY-03", "X-11"),
    "J-03": ("PAY-04",),
    # --- L. Industry-specific ----------------------------------------------
    "L-02": ("SEC-01",),
}

#: Checks the platform runs that the department's matrix has no row for.
#: Recorded rather than hidden: they are findings the matrix would miss, and a
#: department comparing the two is entitled to see the difference in both
#: directions.
BEYOND_THE_MATRIX: Final[tuple[str, ...]] = (
    "X-01",
    "X-04",
    "X-05",
    "X-08",
    "NET-02",
    "NET-03",
    "NET-05",
    "REG-03",
    "REG-04",
    "ITC-16",
    "ITC-20",
    "PAY-10",
    "BEH-02",
    "BEH-03",
    "OUT-12",
    "OUT-19",
    "EWB-04",
    "EWB-05",
    "EWB-06",
)


def coverage_note(total: int) -> str:
    """One sentence about how much of the matrix a returns-only platform reaches."""
    answered = len(ANSWERED_BY)
    return (
        f"{answered} of the {total} departmental checks can be answered from the "
        f"returns this platform ingests. The remaining {total - answered} need the "
        f"general ledger, the fixed-asset register, the annual report, or an "
        f"external feed - each one names which."
    )
