"""Sheet classification: what kind of return is this sheet?

Scored against fingerprints built from column tokens, value shapes and sheet-name
hints.  Below :data:`ASK_BELOW` the pipeline asks the officer (or routes to the
Column Mapper agent for an advisory proposal) rather than guessing.

**A workbook is never rejected because one sheet is unrecognised.**  An
unrecognised sheet is quarantined with a reason; the other thirty-nine are
ingested.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final

from app.canonical import ReturnType
from app.ingestion.synonyms import normalise_header

__all__ = ["FINGERPRINTS", "Classification", "Fingerprint", "classify_sheet"]

#: Confidence, expressed in whole percent so that no float exists in this tree.
CONFIDENT_AT: Final[int] = 60

#: Below this the pipeline must ask.
ASK_BELOW: Final[int] = CONFIDENT_AT

#: What a decisive token is worth. Large enough that one settles a tie between
#: two families that otherwise score identically, small enough that it cannot
#: rescue a family whose required columns are absent -- those are skipped
#: before scoring begins.
_DECISIVE_WEIGHT: Final[int] = 60

#: How far down a sheet to look for header-shaped text when classifying.
HEADER_SEARCH_ROWS: Final[int] = 10


@dataclass(frozen=True, slots=True)
class Fingerprint:
    """What a sheet of this family looks like."""

    family: str
    #: Tokens that must be present for the family to be considered at all.
    required: frozenset[str]
    #: Tokens that raise confidence when present.
    supporting: frozenset[str]
    #: Substrings in the sheet name that point at this family.
    name_hints: frozenset[str]
    #: Sheet-name hints that name the FORM rather than a section. "b2b" is a
    #: section and appears in GSTR-1, GSTR-2A and GSTR-2B alike, so it settles
    #: nothing; "gstr2a" names the form and settles everything. Without the
    #: distinction a sheet called GSTR2A_B2B read as an outward return and
    #: every supplier on it was registered as a filer -- 631 taxpayers from
    #: nine files.
    form_hints: frozenset[str] = frozenset()
    #: Tokens that settle the question. Two families can both score full marks
    #: on shape -- a GSTR-2B B2B tab and a GSTR-1 B2B tab carry almost the same
    #: columns and the same sheet name -- and then the winner is decided by
    #: declaration order, which is no decision at all. A decisive token is one
    #: the other family cannot have: only an inward statement says whether ITC
    #: is available, and only an outward return names a recipient.
    decisive: frozenset[str] = frozenset()
    #: A section this sheet carries, when the family has sections (GSTR-1 B2B).
    section: str | None = None


FINGERPRINTS: Final[tuple[Fingerprint, ...]] = (
    Fingerprint(
        family="GSTR1",
        required=frozenset({"taxable", "invoice"}),
        supporting=frozenset(
            {"recipient", "gstin", "rate", "integrated", "central", "state", "cess", "place"}
        ),
        name_hints=frozenset(
            {"gstr1", "gstr-1", "b2b", "b2cl", "b2cs", "outward", "sales", "cdnr"}
        ),
        decisive=frozenset({"recipient"}),
        form_hints=frozenset({"gstr1", "gstr-1"}),
    ),
    Fingerprint(
        family="GSTR2B",
        required=frozenset({"supplier", "taxable"}),
        supporting=frozenset(
            {"itc", "availability", "filing", "period", "integrated", "central", "reason", "ims"}
        ),
        name_hints=frozenset({"gstr2b", "gstr-2b", "gstr2a", "2b", "inward", "purchase", "itc"}),
        decisive=frozenset({"availability", "ims"}),
        form_hints=frozenset({"gstr2b", "gstr-2b", "gstr2a", "gstr-2a"}),
    ),
    Fingerprint(
        family="GSTR3B",
        required=frozenset({"nature"}),
        supporting=frozenset(
            {"supplies", "integrated", "central", "state", "cess", "outward", "inward", "itc"}
        ),
        name_hints=frozenset({"gstr3b", "gstr-3b", "3b", "summary"}),
        form_hints=frozenset({"gstr3b", "gstr-3b"}),
    ),
    Fingerprint(
        family="EWAYBILL",
        required=frozenset({"way"}),
        supporting=frozenset({"vehicle", "distance", "consignor", "consignee", "valid", "part"}),
        name_hints=frozenset({"eway", "e-way", "ewb", "waybill"}),
    ),
    Fingerprint(
        family="EINVOICE",
        required=frozenset({"irn"}),
        supporting=frozenset({"ack", "acknowledgement", "invoice", "taxable"}),
        name_hints=frozenset({"einvoice", "e-invoice", "irn", "irp"}),
    ),
    Fingerprint(
        family="LEDGER",
        required=frozenset({"balance"}),
        supporting=frozenset({"opening", "closing", "credit", "debit", "ledger", "cash", "head"}),
        name_hints=frozenset({"ledger", "cash", "credit", "liability"}),
    ),
)


#: Sheets a filed workbook carries that the platform recognises and has no
#: canonical table for: GSTR-1 Table 13 (the document-series register), the
#: HSN summary, the challan register, the GSTR-7 TDS/TCS statements.
#:
#: These are an *exclusion*, checked before scoring, not a fingerprint that
#: competes with the others. A fingerprint could not win: ``GSTR1_DocIssued``
#: genuinely is a GSTR-1 sheet and scores as one, so any evidence-weighing
#: contest is lost before it starts. The sheet is out of scope for a reason
#: that has nothing to do with which return it belongs to.
#:
#: Why it matters that they are named at all: falling through meant the
#: best-scoring transaction fingerprint won and every row then failed one
#: field at a time -- "not a numeric literal" against ``ST/2526/0000001``,
#: which is an invoice series, not a number. Four hundred rows of one
#: workbook, each reported as though the department's file were malformed. It
#: is not malformed. The gap is ours, and the reason an officer reads should
#: say so.
OUT_OF_SCOPE: Final[tuple[tuple[str, str], ...]] = (
    ("docissued", "GSTR-1 Table 13, the document-series register"),
    ("documentissued", "GSTR-1 Table 13, the document-series register"),
    ("docseries", "GSTR-1 Table 13, the document-series register"),
    ("hsnsummary", "the HSN summary"),
    ("challan", "the challan register"),
    ("gstr7", "the GSTR-7 TDS/TCS statement"),
    ("gstr-7", "the GSTR-7 TDS/TCS statement"),
)

#: The family such a sheet is reported as. It is not "unrecognised": the
#: platform knows exactly what the sheet is.
NOT_INGESTED: Final[str] = "NOT_INGESTED"


def out_of_scope(sheet_name: str) -> str | None:
    """What this sheet is, when it is one the platform does not yet ingest.

    Returns the form in the words an officer would use, or ``None`` when the
    sheet is in scope and should be classified normally.
    """
    normalised = normalise_header(sheet_name).replace(" ", "")
    for token, description in OUT_OF_SCOPE:
        if token.replace("-", "") in normalised:
            return description
    return None


#: GSTR-1 sections, recognised from the sheet name.  The portal names them
#: exactly like this, and a consultant's file usually keeps the convention.
_SECTION_HINTS: Final[tuple[tuple[re.Pattern[str], str], ...]] = (
    (re.compile(r"\bb2b\b.*\b(a|amend)", re.IGNORECASE), "AMENDMENT"),
    (
        re.compile(
            r"\bb2ba\b|\bb2cla\b|\bb2csa\b|\bcdnra\b|\bcdnura\b|\b9a\b|\b9c\b", re.IGNORECASE
        ),
        "AMENDMENT",
    ),
    (re.compile(r"\bb2b\b", re.IGNORECASE), "B2B"),
    (re.compile(r"\bb2cl\b", re.IGNORECASE), "B2CL"),
    (re.compile(r"\bb2cs\b", re.IGNORECASE), "B2CS"),
    (re.compile(r"\bexpwp\b|\bexport.*with\b", re.IGNORECASE), "EXPWP"),
    (re.compile(r"\bexpwop\b|\bexport", re.IGNORECASE), "EXPWOP"),
    (re.compile(r"\bsez.*wp\b|\bsezwp\b", re.IGNORECASE), "SEZWP"),
    (re.compile(r"\bsez", re.IGNORECASE), "SEZWOP"),
    (re.compile(r"\bcdnur\b", re.IGNORECASE), "CDNUR"),
    (re.compile(r"\bcdnr\b|credit.*note|debit.*note", re.IGNORECASE), "CDNR"),
    (re.compile(r"\bdeemed\b|\bdexp\b", re.IGNORECASE), "DEEMED"),
    (re.compile(r"9\s*\(?5\)?|\becom\b|e-?commerce", re.IGNORECASE), "ECOM_9_5"),
    (re.compile(r"\bnil\b|\bexempt", re.IGNORECASE), "NIL_EXEMPT"),
    (re.compile(r"\bimpg\b|import.*goods", re.IGNORECASE), "IMPG"),
    (re.compile(r"\bimps\b|import.*serv", re.IGNORECASE), "IMPS"),
    (re.compile(r"\bisd\b", re.IGNORECASE), "ISD"),
)

_FAMILY_TO_RETURN: Final[dict[str, ReturnType]] = {
    "GSTR1": ReturnType.GSTR1,
    "GSTR2B": ReturnType.GSTR2B,
    "GSTR3B": ReturnType.GSTR3B,
}


@dataclass(frozen=True, slots=True)
class Classification:
    """What a sheet was taken to be, how sure we are, and why."""

    family: str | None
    confidence: int
    section: str | None
    evidence: tuple[str, ...]

    @property
    def return_type(self) -> ReturnType | None:
        return _FAMILY_TO_RETURN.get(self.family or "")

    @property
    def needs_confirmation(self) -> bool:
        return self.family is None or self.confidence < CONFIDENT_AT


def section_from_name(sheet_name: str) -> str | None:
    for pattern, section in _SECTION_HINTS:
        if pattern.search(sheet_name):
            return section
    return None


def classify_sheet(
    sheet_name: str, header_cells: list[object], sample_rows: list[list[object]] | None = None
) -> Classification:
    """Score a sheet against every fingerprint and return the best.

    ``sample_rows`` is accepted so that value shapes can strengthen a weak
    header match -- a column of 15-character GSTIN-shaped strings is strong
    evidence even when the header is in Marathi.
    """
    tokens: set[str] = set()
    for cell in header_cells:
        tokens.update(normalise_header(cell).split())

    # The header is rarely on row 0: a logo, a title block and a spacer row sit
    # above it.  Harvesting label tokens from the first few rows -- rather than
    # only from the row we were handed -- is what lets a sheet behind a title
    # block be classified at all.  Header detection cannot run first, because it
    # needs to know the family to score token matches against.
    rows = sample_rows or []
    for row in rows[:HEADER_SEARCH_ROWS]:
        for cell in row:
            if isinstance(cell, str):
                tokens.update(normalise_header(cell).split())

    # Out of scope before anything is weighed. A GSTR-1 Table 13 sheet is a
    # genuine GSTR-1 sheet and would win any scoring contest against a
    # fingerprint meant to catch it, so the question is asked first and
    # separately.
    beyond = out_of_scope(sheet_name)
    if beyond is not None:
        return Classification(NOT_INGESTED, 100, None, (f"out-of-scope:{beyond}",))

    name_normalised = normalise_header(sheet_name).replace(" ", "")
    tokens |= _value_evidence(rows)

    best: Classification | None = None
    best_strength = 0
    for fingerprint in FINGERPRINTS:
        scored = _score_against(fingerprint, tokens, name_normalised)
        if scored is None:
            continue
        strength, score, evidence = scored
        candidate = Classification(
            family=fingerprint.family,
            confidence=min(score, 100),
            section=section_from_name(sheet_name) if fingerprint.family == "GSTR1" else None,
            evidence=evidence,
        )
        if best is None or strength > best_strength:
            best, best_strength = candidate, strength

    if best is None:
        return Classification(None, 0, None, ("no fingerprint matched",))
    return best


def _in_name(hints: frozenset[str], name_normalised: str) -> set[str]:
    return {hint for hint in hints if hint.replace("-", "") in name_normalised}


def _score_against(
    fingerprint: Fingerprint, tokens: set[str], name_normalised: str
) -> tuple[int, int, tuple[str, ...]] | None:
    """Score one fingerprint. ``None`` means it does not apply at all.

    Returns ``(strength, score, evidence)``. Strength is uncapped and carries
    the decisive tokens; score is what the screen shows as confidence.
    Comparing on the capped figure let two families tie at 100 and handed the
    decision to declaration order.
    """
    evidence: list[str] = []
    required_hit = fingerprint.required & tokens
    name_hit = _in_name(fingerprint.name_hints, name_normalised)
    if not required_hit and not name_hit:
        return None

    score = 0
    if required_hit:
        score += 40 * len(required_hit) // max(len(fingerprint.required), 1)
        evidence.append("columns:" + ",".join(sorted(required_hit)))
    supporting_hit = fingerprint.supporting & tokens
    if supporting_hit:
        score += min(40, 8 * len(supporting_hit))
        evidence.append("supporting:" + ",".join(sorted(supporting_hit)))
    if name_hit:
        score += 35
        evidence.append("sheet-name:" + ",".join(sorted(name_hit)))

    decisive_hit = fingerprint.decisive & tokens
    form_hit = _in_name(fingerprint.form_hints, name_normalised)
    if decisive_hit:
        evidence.append("decisive:" + ",".join(sorted(decisive_hit)))
    if form_hit:
        evidence.append("form-name:" + ",".join(sorted(form_hit)))
    strength = score + _DECISIVE_WEIGHT * (len(decisive_hit) + len(form_hit))
    return strength, score, tuple(evidence)


_GSTIN_SHAPE: Final[re.Pattern[str]] = re.compile(r"^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$")
_EWB_SHAPE: Final[re.Pattern[str]] = re.compile(r"^\d{12}$")
_IRN_SHAPE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")


def _value_evidence(rows: list[list[object]]) -> set[str]:
    """Tokens implied by the *shape* of the values, not by the header text.

    This is what lets a Marathi-headed sheet still be classified.
    """
    found: set[str] = set()
    for row in rows[:20]:
        for cell in row:
            if not isinstance(cell, str):
                continue
            text = cell.strip().upper()
            if _GSTIN_SHAPE.match(text):
                found.add("gstin")
            elif _IRN_SHAPE.match(text.lower()):
                found.add("irn")
            elif _EWB_SHAPE.match(text):
                found.add("way")
    return found
