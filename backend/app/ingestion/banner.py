"""Reading the banner a portal writes above a return's table.

A GSTR-1 names the **recipient** on every row; the filer's own GSTIN appears
once, in the title block.  An officer uploading their own return should not
have to retype what the file already says, and a platform that quarantines
their whole file for want of it is a platform they stop using.

This lives in the ingestion package rather than behind the upload endpoint
because it is a property of the file, not of the transport: the demonstration
seeder, a future CLI and the tests all read the same banner the API does.
"""

from __future__ import annotations

import re
from typing import Any, Final

from app.canonical import FinancialYear, GstinError, validate_gstin

__all__ = ["financial_year_from", "legal_name_from", "owner_gstin_from"]

#: A GSTIN anywhere inside a line of text.
_GSTIN_IN_TEXT: Final[re.Pattern[str]] = re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")

#: A financial year in a title block: "2025 - 2026", "2025-26", "FY 2023-24".
#: The second part may be two digits or four, and the dash may have spaces
#: around it, because every tool writes it differently.
_FY_IN_TEXT: Final[re.Pattern[str]] = re.compile(r"\b(20\d{2})\s*[-/]\s*(\d{2}|20\d{2})\b")

#: How many rows above the header a title block may occupy.
_TITLE_BLOCK_ROWS: Final[int] = 8

#: A banner line is sparse.  More populated cells than this and the row is a
#: header or a transaction, not a title.
_BANNER_MAX_CELLS: Final[int] = 3


def owner_gstin_from(sheets: list[Any]) -> str | None:
    """The filer's own GSTIN, read from the workbook's title block.

    A GSTR-1 export carries the *recipient's* GSTIN on every row; the filer's
    own appears once, in the banner the portal writes above the header.  An
    officer uploading their own return should not have to retype it, and a
    platform that quarantines their whole file for want of it is a platform
    they stop using.

    Two things keep this from picking the wrong taxpayer, and both matter: a
    filer attributed wrongly puts the wrong name on a notice.

    * **Only sparse rows are read.**  A banner line holds a cell or two; a
      header or data row holds many.  Every row in a GSTR-1 carries the
      *recipient's* GSTIN, so scanning a data row would silently attribute the
      return to whoever happened to be on its first line.
    * **Only a checksum-valid GSTIN is accepted**, so a mistyped reference in
      a title is ignored rather than believed.
    """
    for sheet in sheets:
        for row in list(sheet.rows)[:_TITLE_BLOCK_ROWS]:
            populated = [cell for cell in row if cell not in (None, "")]
            if len(populated) > _BANNER_MAX_CELLS:
                # A header or a data row: past the title block entirely.
                break
            for cell in populated:
                if not isinstance(cell, str):
                    continue
                for candidate in _GSTIN_IN_TEXT.findall(cell):
                    try:
                        validate_gstin(candidate)
                    except GstinError:
                        continue
                    return str(candidate)
    return None


#: The labels a filing tool writes above its table. The portal's own monthly
#: export carries none of these, which is why the stub registration exists at
#: all; the whole-year exports the department receives carry one of them in
#: every workbook.
_NAME_LABELS: Final[tuple[str, ...]] = (
    "company name",
    "legal name",
    "trade name",
    "name of taxpayer",
    "taxpayer name",
    "name of the taxpayer",
    "name of registered person",
)


def legal_name_from(sheets: list[Any]) -> str | None:
    """The filer's registered name, read from the workbook's title block.

    Registering a taxpayer as ``27AAHCR8533P1ZL`` when the first line of their
    own file says ``RALGAN LIFE SCIENCES PRIVATE LIMITED`` is not caution, it
    is a worklist an officer cannot read.

    The two rules that keep :func:`owner_gstin_from` from attributing a return
    to the wrong taxpayer apply here unchanged, and for the same reason -- a
    name is what goes on a notice:

    * **Only sparse rows are read.** A banner line holds a cell or two. Every
      data row of a GSTR-1 names a *recipient*, so reading one would label the
      filer with its own customer.
    * **Only a labelled cell is read.** The value must sit beside one of the
      labels above; free text in a title block is not a name.

    A workbook that states no name returns ``None`` and the GSTIN stub stands.
    """
    for sheet in sheets:
        for row in list(sheet.rows)[:_TITLE_BLOCK_ROWS]:
            populated = [cell for cell in row if cell not in (None, "")]
            if len(populated) > _BANNER_MAX_CELLS:
                break
            found = _labelled_value(populated)
            if found is not None:
                return found
    return None


def _labelled_value(cells: list[Any]) -> str | None:
    """The value beside a name label, from either two cells or one.

    A tool writes ``["Company Name : ", "ACME LIMITED"]`` in two cells or
    ``["Company Name : ACME LIMITED"]`` in one, and both appear in the filed
    workbooks.
    """
    for index, cell in enumerate(cells):
        if not isinstance(cell, str):
            continue
        label = cell.strip().rstrip(":").strip().casefold()
        if label in _NAME_LABELS:
            following = cells[index + 1] if index + 1 < len(cells) else None
            return _clean_name(following)
        for candidate in _NAME_LABELS:
            head, sep, tail = cell.partition(":")
            if sep and head.strip().casefold() == candidate:
                return _clean_name(tail)
    return None


def _clean_name(value: Any) -> str | None:
    """A name, or ``None`` if what was found is not one.

    A GSTIN beside a name label is a mislabelled cell, not a trade name, and
    storing it would put the platform back where it started.
    """
    if not isinstance(value, str):
        return None
    text = " ".join(value.split()).strip(" :-")
    if not text or _GSTIN_IN_TEXT.search(text):
        return None
    return text


def financial_year_from(sheets: list[Any]) -> FinancialYear | None:
    """The financial year the workbook covers, from its title block.

    A whole-year export states the period once -- "Return Period : 2025 -
    2026" -- and then writes a bare month name on every row. Without this the
    month cannot be resolved to a period and every transaction in the file is
    held, which is what happened to 3,950 rows of the first real workbook.

    Returns ``None`` when the workbook does not say. A guess here would put a
    year of transactions in the wrong financial year, which is worse than
    asking the officer.
    """
    for sheet in sheets:
        for row in list(getattr(sheet, "rows", []))[:_TITLE_BLOCK_ROWS]:
            cells = [cell for cell in row if cell not in (None, "")]
            if len(cells) > _BANNER_MAX_CELLS:
                continue
            for cell in cells:
                if not isinstance(cell, str):
                    continue
                match = _FY_IN_TEXT.search(cell)
                if match is None:
                    continue
                start = int(match.group(1))
                end = match.group(2)
                # "2025 - 2026" and "2025-26" both mean the year starting 2025.
                # "2025 - 2025" is not a financial year and is not read as one.
                closing = int(end) if len(end) == 4 else start // 100 * 100 + int(end)  # noqa: PLR2004
                if closing == start + 1:
                    return FinancialYear(start)
    return None
