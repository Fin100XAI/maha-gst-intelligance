"""Place of supply: was it mapped, and does it agree with everything else?

Three questions, and only the first is about mapping.

**Was it read at all?** A row with no place of supply cannot be tested against
anything, and a file where the column never mapped looks identical to a file
where every supply was intra-State. The coverage line is the first thing this
report says.

**Does the head follow the place of supply?** s.7 and s.8 IGST Act: supplier
State and place of supply the same means CGST and SGST, different means IGST.
This is invariant `I-06` and a contradicting row never reaches a rule - so a
count here of anything but zero means rows were *held*, and the report points
at the quarantine rather than at the taxpayer.

**Does the place of supply agree with the recipient's own registration?** This
is the one that finds things. For a B2B supply of goods the place of supply is
normally the recipient's State, and their GSTIN says what that is. A mismatch
is not automatically wrong - a bill-to-ship-to under s.10(1)(b), an
installation supply under s.10(1)(d), or any service under s.12 can each move
it legitimately - so this is reported as a **question with a figure**, never as
a finding.

Pure: no I/O, no clock. `docs/08` pattern report.
"""

from __future__ import annotations

import collections
from decimal import Decimal
from typing import Final

from app.engine.records import OutwardRecord, TaxpayerData
from app.money import TaxVector
from app.reports.base import Point, Report, ReportRow, Series, money, pct, rupees
from app.reports.base import not_evaluated as _dark

__all__ = ["REPORT_ID", "build"]

REPORT_ID: Final[str] = "place_of_supply"
_TITLE: Final[str] = "Place of supply: mapping and consistency"
_ZERO: Final[Decimal] = Decimal("0.00")

#: A GSTIN carries its State in the first two characters.
_STATE_CODE_LEN: Final[int] = 2

#: State codes that are not a State. `96` is "other country" and `97` is
#: "other territory"; both are valid places of supply and neither can be
#: compared against a recipient's registration.
_NON_STATE: Final[frozenset[str]] = frozenset({"96", "97"})


def _recipient_state(row: OutwardRecord) -> str | None:
    gstin = row.counterparty_gstin
    if not gstin or len(gstin) < _STATE_CODE_LEN:
        return None
    return gstin[:_STATE_CODE_LEN]


def build(data: TaxpayerData, fy: str, _periods: object = None) -> Report:
    """Coverage first, then the head test, then the recipient test."""
    if not data.outward:
        return _dark(REPORT_ID, _TITLE, data.profile.gstin, fy, ("GSTR-1 as filed",))

    supplier_state = data.profile.state_code
    total = len(data.outward)
    without = [row for row in data.outward if not row.pos]
    with_pos = [row for row in data.outward if row.pos]

    head_contradictions: list[OutwardRecord] = []
    recipient_mismatches: list[OutwardRecord] = []

    for row in with_pos:
        intrastate = row.pos == supplier_state
        wrong_interstate_head = intrastate and row.igst > _ZERO
        wrong_intrastate_head = not intrastate and (row.cgst > _ZERO or row.sgst > _ZERO)
        if wrong_interstate_head or wrong_intrastate_head:
            head_contradictions.append(row)

        recipient = _recipient_state(row)
        if recipient and row.pos not in _NON_STATE and row.pos != recipient:
            recipient_mismatches.append(row)

    by_state: dict[str, TaxVector] = collections.defaultdict(TaxVector)
    counts: collections.Counter[str] = collections.Counter()
    for row in with_pos:
        assert row.pos is not None  # noqa: S101 - narrowed by the filter above
        by_state[row.pos] = by_state[row.pos] + row.signed_tax
        counts[row.pos] += 1

    points = tuple(
        Point(
            label=state,
            value=money(vector.total),
            heads=vector.dict(),
            drill=f"/scrutiny/taxpayer/{data.profile.gstin}?pos={state}",
            note=f"{counts[state]} lines",
        )
        for state, vector in sorted(by_state.items(), key=lambda kv: -kv[1].total)
    )

    rows: list[ReportRow] = [
        ReportRow(
            cells={
                "Document": row.doc_no or "",
                "Date": row.doc_date.isoformat() if row.doc_date else "",
                "Recipient": row.counterparty_gstin or "",
                "Recipient State": _recipient_state(row) or "",
                "Place of supply": row.pos or "",
                "Taxable value": money(row.taxable_value),
                "Tax": money(row.tax.total),
                "Question": (
                    "Place of supply is not the recipient's registered State. "
                    "Bill-to-ship-to, installation, or a service can each explain "
                    "this - state which applies."
                ),
            },
            evidence_ids=(row.row_id,) if row.row_id else (),
            flag="ASK",
        )
        for row in sorted(recipient_mismatches, key=lambda r: -r.taxable_value)[:200]
    ]

    exposure = sum((row.signed_tax for row in recipient_mismatches), TaxVector())

    return Report(
        id=REPORT_ID,
        title=_TITLE,
        gstin=data.profile.gstin,
        fy=fy,
        headline=_headline(
            total, len(without), head_contradictions, recipient_mismatches, exposure
        ),
        columns=(
            "Document",
            "Date",
            "Recipient",
            "Recipient State",
            "Place of supply",
            "Taxable value",
            "Tax",
            "Question",
        ),
        series=(
            Series(
                id="by_state",
                title="Outward supply by place of supply",
                kind="bar",
                unit="rupees of tax",
                points=points,
            ),
            Series(
                id="mapping",
                title="Was the place of supply read?",
                kind="stacked_bar",
                unit="lines",
                points=(
                    Point(
                        label="Place of supply present",
                        value=str(len(with_pos)),
                        note=f"{pct(Decimal(len(with_pos)), Decimal(total))}%",
                    ),
                    Point(
                        label="Absent",
                        value=str(len(without)),
                        drill=f"/setup/data?missing=pos&gstin={data.profile.gstin}",
                        note="cannot be tested against anything",
                    ),
                ),
            ),
        ),
        rows=tuple(rows),
        total=exposure,
        caveat=(
            "A place of supply that differs from the recipient's registered State "
            "is a question, not a finding. s.10(1)(b) bill-to-ship-to, s.10(1)(d) "
            "installation and every s.12 service can each move it legitimately. "
            "The figure is what turns on the answer, not what is owed."
        ),
    )


def _headline(
    total: int,
    without: int,
    head: list[OutwardRecord],
    recipient: list[OutwardRecord],
    exposure: TaxVector,
) -> str:
    if without == total:
        return (
            "The place of supply column was never mapped on this file, so no "
            "supply could be tested. Every line is untested, not correct."
        )
    parts: list[str] = []
    if without:
        parts.append(f"{without} of {total} lines carry no place of supply and could not be tested")
    else:
        parts.append(f"All {total} lines carry a place of supply")
    if head:
        parts.append(
            f"{len(head)} contradict the tax head charged - these should have been "
            f"held at ingestion, so check the quarantine"
        )
    if recipient:
        parts.append(
            f"{len(recipient)} name a place of supply that is not the recipient's "
            f"registered State, covering {rupees(exposure.total)} of tax"
        )
    else:
        parts.append("and every one agrees with the recipient's registered State")
    return ", ".join(parts) + "."
