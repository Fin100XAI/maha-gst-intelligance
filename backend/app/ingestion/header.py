"""Header-row location.

Real files carry a logo in row 1, a title block, a merged two-row header and a
blank spacer row before the data starts.  The header row is chosen as

    argmax( non_null_ratio, token_match, breadth, type_consistency_of_the_next_5 )

``breadth`` counts how many labels name a canonical field, rather than what
share of them do.  Without it every term is a ratio, and a one-cell banner line
scores exactly as well as the fifteen-column header beneath it.

and merged upper rows are forward-filled first, so that a two-row header like

    |        | Invoice           | Tax                        |
    | GSTIN  | Number | Date     | IGST | CGST | SGST | Cess  |

collapses into one usable row.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final

from app.ingestion.synonyms import match_header, normalise_header
from app.money import is_number

__all__ = ["HeaderDetection", "detect_header", "forward_fill", "merge_header_rows"]

#: How many rows below a candidate are inspected for type consistency.
LOOKAHEAD: Final[int] = 5

#: How far into the sheet a header may reasonably hide.
MAX_HEADER_ROW: Final[int] = 40

#: A detection scoring below this is reported as needing confirmation.
CONFIDENT_SCORE: Final[int] = 45

#: Two rows of evidence is the least that says anything about a column's type.
_MIN_BODY_ROWS: Final[int] = 2

#: How many recognised column names count as a full-breadth header.
#:
#: Every other term in the score is a ratio, and a ratio cannot tell a header
#: naming fifteen columns from a banner line naming one -- both are "100%
#: non-null, 100% textual, 100% matched".  A real GSTR-1 header names a dozen
#: or more; six is well clear of any fragment and below the narrowest genuine
#: header seen in the wild.
_BREADTH_SATURATES_AT: Final[int] = 6


@dataclass(frozen=True, slots=True)
class HeaderDetection:
    """Where the header is, what it says, and how sure we are."""

    row_index: int
    headers: tuple[str, ...]
    score: int
    merged_from: tuple[int, ...]
    data_starts_at: int

    @property
    def is_confident(self) -> bool:
        return self.score >= CONFIDENT_SCORE


def forward_fill(row: list[object]) -> list[object]:
    """Fill blanks from the left, as a merged cell would display."""
    filled: list[object] = []
    carry: object = None
    for cell in row:
        if cell is None or (isinstance(cell, str) and not cell.strip()):
            filled.append(carry)
        else:
            carry = cell
            filled.append(cell)
    return filled


def merge_header_rows(rows: list[list[object]]) -> list[str]:
    """Collapse a multi-row header into one label per column.

    The upper rows are forward-filled (they are the merged group headings); the
    lowest row is not, because a genuinely empty cell there means the column is
    covered by the group heading alone.
    """
    if not rows:
        return []
    prepared = [forward_fill(row) for row in rows[:-1]] + [rows[-1]]
    width = max(len(row) for row in prepared)
    labels: list[str] = []
    for column in range(width):
        parts: list[str] = []
        for row in prepared:
            cell = row[column] if column < len(row) else None
            if cell is None:
                continue
            text = str(cell).strip()
            if text and text not in parts:
                parts.append(text)
        labels.append(" ".join(parts))
    return labels


def _non_null_ratio(row: list[object]) -> int:
    if not row:
        return 0
    filled = sum(1 for cell in row if cell is not None and str(cell).strip())
    return filled * 100 // len(row)


def _looks_like_labels(row: list[object]) -> int:
    """Headers are text, not numbers.  A row of numbers is data, not a header."""
    cells = [cell for cell in row if cell is not None and str(cell).strip()]
    if not cells:
        return 0
    textual = sum(1 for cell in cells if not is_number(cell))
    return textual * 100 // len(cells)


def _token_match(labels: list[str], family: str) -> int:
    """How many labels map to a canonical field."""
    named = [label for label in labels if normalise_header(label)]
    if not named:
        return 0
    matched = sum(1 for label in named if match_header(label, family).field is not None)
    return matched * 100 // len(named)


def _breadth(labels: list[str], family: str) -> int:
    """How MANY labels name a canonical field, not what share of them do.

    This is the term that stops a one-cell banner beating a fifteen-column
    header.  ``GSTIN 27AAJCA3456N1Z8  Aurangabad Auto`` fuzzy-matches "gstin",
    so its token-match ratio is a perfect 100 on a single label; counting the
    matches rather than their share puts it where it belongs.
    """
    matched = sum(1 for label in labels if match_header(label, family).field is not None)
    return min(matched, _BREADTH_SATURATES_AT) * 100 // _BREADTH_SATURATES_AT


def _type_consistency(rows: list[list[object]], width: int) -> int:
    """Data rows below a header agree on each column's type; a title block does not."""
    body = [row for row in rows if any(cell is not None and str(cell).strip() for cell in row)]
    if len(body) < _MIN_BODY_ROWS:
        return 50  # not enough evidence either way; stay neutral
    agreeing = 0
    considered = 0
    for column in range(width):
        kinds = set()
        for row in body:
            cell = row[column] if column < len(row) else None
            if cell is None or (isinstance(cell, str) and not cell.strip()):
                continue
            kinds.add("number" if is_number(cell) else "text")
        if not kinds:
            continue
        considered += 1
        if len(kinds) == 1:
            agreeing += 1
    if considered == 0:
        return 0
    return agreeing * 100 // considered


def detect_header(
    rows: list[list[object]], family: str = "GSTR1", *, max_row: int = MAX_HEADER_ROW
) -> HeaderDetection | None:
    """Find the header row behind a title block.

    Returns ``None`` when nothing in the sheet scores as a header at all, which
    the pipeline reports as SHEET_UNRECOGNISED rather than guessing row 0.
    """
    if not rows:
        return None

    best: HeaderDetection | None = None
    limit = min(len(rows), max_row)

    for index in range(limit):
        row = rows[index]
        if not any(cell is not None and str(cell).strip() for cell in row):
            continue

        # Try this row alone, and this row merged with the one above it.
        candidates: list[tuple[list[str], tuple[int, ...]]] = [
            ([str(cell).strip() if cell is not None else "" for cell in row], (index,))
        ]
        if index > 0:
            candidates.append((merge_header_rows([rows[index - 1], row]), (index - 1, index)))

        for labels, merged_from in candidates:
            width = len(labels)
            if width == 0:
                continue
            body = rows[index + 1 : index + 1 + LOOKAHEAD]
            score = (
                _non_null_ratio(row) * 2
                + _looks_like_labels(row)
                + _token_match(labels, family) * 4
                + _breadth(labels, family) * 3
                + _type_consistency(body, width)
            ) // 11
            if best is None or score > best.score:
                best = HeaderDetection(
                    row_index=index,
                    headers=tuple(labels),
                    score=score,
                    merged_from=merged_from,
                    data_starts_at=index + 1,
                )

    return best
