"""The column synonym lexicon.

An officer uploads a portal export, a consultant's working file, or a 40-tab
workbook with Marathi headers.  Sniff, do not demand.

Three layers, tried in order:
 1. an exact match on a normalised synonym,
 2. a token-overlap match,
 3. a normalised edit-distance match above a threshold.

Anything still unmatched is reported for human confirmation.  A mapping the
officer confirms is written back into the lexicon (Phase 6, the Column Mapper
agent), so the deterministic layer improves and the agent is called less.

Marathi and Hindi are here from day one, not in v2.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from typing import Final

from app.canonical import ReturnType

__all__ = [
    "CANONICAL_FIELDS",
    "FieldMatch",
    "match_header",
    "match_headers",
    "normalise_header",
    "synonyms_for",
]

#: Ornament a portal or an accounting package hangs off a column name.
_STRIP = re.compile(
    r"[\(\)\[\]\{\}₹$,:;.\-_/\\|*#@\"'`]|"
    r"\b(?:rs|inr|amount|amt|value|val|in\s*rupees|rupees)\b",
    re.IGNORECASE,
)
_SPACES = re.compile(r"\s+")


def normalise_header(raw: object) -> str:
    """Lowercase, strip ornament and collapse whitespace, Unicode-normalised."""
    if raw is None:
        return ""
    text = unicodedata.normalize("NFKC", str(raw)).strip().lower()
    text = text.replace("\n", " ").replace("\u00a0", " ")
    text = _STRIP.sub(" ", text)
    return _SPACES.sub(" ", text).strip()


# ---------------------------------------------------------------------------
# canonical fields per family
# ---------------------------------------------------------------------------

#: canonical field -> the spellings seen in the wild.
#: Sources: the GST portal's own CSV/Excel exports, Tally Prime, Busy,
#: ClearTax and Zoho Books export headers, plus Marathi and Hindi.
_OUTWARD: Final[dict[str, tuple[str, ...]]] = {
    "counterparty_gstin": (
        "gstin uin of recipient",
        # On an OUTWARD return every per-row GSTIN is the recipient's: the
        # filer's own appears once, in the title block. A whole-year export
        # abbreviates the column to "GSTIN/UIN", and reading that as the
        # filer's overwrites the company with its own customer.
        "gstin uin",
        "gstin of recipient",
        "recipient gstin",
        "buyer gstin",
        "customer gstin",
        "party gstin",
        "gstin",
        "ग्राहक जीएसटीआयएन",  # mr: customer GSTIN
        "प्राप्तकर्ता जीएसटीआयएन",  # hi,
        "प्राप्तकर्त्याचा जीएसटीआयएन",
        "खरेदीदाराचा जीएसटीआयएन",
    ),
    "counterparty_name": (
        "receiver name",
        "recipient name",
        "trade legal name",
        "party name",
        "customer name",
        "buyer name",
        "ग्राहकाचे नाव",  # mr,
        "प्राप्तकर्त्याचे नाव",
        "खरेदीदाराचे नाव",
    ),
    "doc_no": (
        "invoice number",
        "invoice no",
        "document number",
        "doc no",
        "bill no",
        "voucher no",
        "note number",
        "credit note number",
        "debit note number",
        "पावती क्रमांक",  # mr: invoice number
        "चलान संख्या",  # hi,
        "बीजक क्रमांक",
        "बीजक क्र",
        "चलन क्रमांक",
    ),
    "doc_date": (
        "invoice date",
        "document date",
        "doc date",
        "bill date",
        "voucher date",
        "note date",
        "date",
        "पावती दिनांक",  # mr
        "चलान तिथि",  # hi,
        "बीजक दिनांक",
        "चलन दिनांक",
    ),
    "doc_value": (
        "invoice value",
        "document value",
        "total invoice value",
        "gross total",
        "बीजक मूल्य",
        "एकूण मूल्य",
    ),
    "pos": (
        "place of supply",
        "pos",
        "place of supply state",
        "पुरवठ्याचे ठिकाण",  # mr,
        "पुरवठा ठिकाण",
    ),
    "reverse_charge": ("reverse charge", "supply attract reverse charge", "rcm", "is rcm"),
    "doc_type": ("invoice type", "document type", "note type", "type"),
    "ecom_gstin": ("e commerce gstin", "ecommerce gstin", "eco gstin"),
    "applicable_percent": (
        "applicable % of tax rate",
        "applicable percentage of tax rate",
        "applicable % of tax",
    ),
    "rate": (
        "rate",
        "rate %",
        "tax rate",
        "gst rate",
        "दर",  # mr/hi: rate,
        "कर दर",
    ),
    "taxable_value": (
        "taxable",
        "taxable turnover",
        "assessable",
        "net taxable",
        "करपात्र मूल्य",  # mr
        "कर योग्य मूल्य",  # hi,
        "करपात्र रक्कम",
    ),
    "igst": (
        "integrated tax",
        "igst",
        "igst paid",
        "i tax",
        "आयजीएसटी",
        "एकात्मिक कर",
        "एकीकृत कर",
    ),
    "cgst": (
        "central tax",
        "cgst",
        "cgst paid",
        "c tax",
        "सीजीएसटी",
        "केंद्रीय कर",
        "केन्द्रीय कर",
    ),
    "sgst": (
        "state ut tax",
        "state tax",
        "sgst",
        "utgst",
        "sgst utgst",
        "s tax",
        "एसजीएसटी",
        "राज्य कर",
        "राज्य/केंद्रशासित प्रदेश कर",
    ),
    "cess": (
        "cess",
        "compensation cess",
        "cess paid",
        "उपकर",
        "भरपाई उपकर",
    ),
    "hsn": ("hsn", "hsn sac", "sac", "hsn code", "hsn of supply"),
    "uqc": ("uqc", "unit", "unit of measure", "uom"),
    "quantity": ("quantity", "qty", "total quantity", "प्रमाण"),
    "irn": ("irn", "invoice reference number", "irn number"),
    # Which document this row amends. The B2BA and CDNRA tables carry it
    # and nothing read it, so an amendment arrived indistinguishable from
    # a fresh invoice - and a check excluding amendments excluded nothing.
    "amends_doc_no": (
        "original invoice number",
        "original invoice no",
        "original document number",
        "original doc no",
        "original note number",
    ),
    "amends_doc_date": (
        "original invoice date",
        "original document date",
        "original note date",
    ),
    # The IRP's acknowledgement date, not the invoice date. Mapping it is
    # what makes Rule 48(4) computable, and it is also the column that
    # arrives with its day and month swapped on half its rows -- so it is
    # read only because app/ingestion/transposition.py now runs over it.
    "irn_date": ("irn date", "irn generated date", "irn generation date", "ack date"),
    "period": ("period", "tax period", "return period", "month", "कर कालावधी"),
    # NOT bare "gstin uin": on an outward return that column is the
    # recipient's, and the filer's own GSTIN is in the title block. Listing
    # it here as well left the winner to dictionary order.
    "gstin": ("gstin of supplier", "supplier gstin", "own gstin"),
}

_INWARD: Final[dict[str, tuple[str, ...]]] = {
    **{k: v for k, v in _OUTWARD.items() if k not in {"counterparty_gstin", "gstin"}},
    "supplier_gstin": (
        "gstin of supplier",
        "supplier gstin",
        "gstin uin of supplier",
        "seller gstin",
        "vendor gstin",
        "gstin",
        "पुरवठादार जीएसटीआयएन",  # mr
    ),
    "supplier_name": ("trade legal name", "supplier name", "vendor name", "seller name"),
    "itc_available": ("itc availability", "itc available", "eligibility", "itc eligible"),
    "itc_unavailable_reason": ("reason", "itc reason", "ineligibility reason"),
    "supplier_return_period": (
        "gstr 1 iff gstr 5 period",
        "supplier return period",
        "filing period",
        "return period of supplier",
    ),
    "supplier_filing_date": (
        "gstr 1 iff gstr 5 filing date",
        "supplier filing date",
        "filing date",
        "date of filing",
    ),
    "ims_action": ("ims action", "ims status", "invoice management action", "action taken"),
    # docs/06 point 7 calls this the most valuable column in the workbook,
    # and it is: it makes Rule 37A computable from this one file, with
    # nothing asked of the taxpayer and no external feed. Supplier filed
    # GSTR-1 (so the credit appeared in 2B and was claimed) but not GSTR-3B
    # (so the tax never reached the exchequer) => the recipient must reverse.
    #
    # It exists only on GSTR-2A. 2B does not carry it, which is one more
    # reason the two statements must stay separate (D-0075).
    "supplier_3b_filed": (
        "gstr 3b filing status",
        "supplier gstr 3b status",
        "3b filing status",
        "gstr3b filed",
    ),
    "supplier_1_filed": ("gstr 1 iff gstr 5 filing status", "gstr 1 filing status"),
}

_EWB: Final[dict[str, tuple[str, ...]]] = {
    "ewb_no": ("e way bill no", "ewb no", "eway bill number", "ewaybill no"),
    "ewb_date": ("e way bill date", "ewb date", "generated date", "date of generation"),
    "doc_no": ("document no", "invoice no", "doc no"),
    "doc_date": ("document date", "invoice date", "doc date"),
    "doc_type": ("document type", "doc type", "supply type"),
    "from_gstin": ("from gstin", "consignor gstin", "supplier gstin"),
    "to_gstin": ("to gstin", "consignee gstin", "recipient gstin"),
    "from_state": ("from state", "consignor state", "dispatch state"),
    "to_state": ("to state", "consignee state", "ship to state"),
    "from_pin": ("from pin", "from pincode", "dispatch pincode"),
    "to_pin": ("to pin", "to pincode", "ship to pincode"),
    "hsn": ("hsn", "hsn code", "main hsn"),
    "value": ("total inv value", "invoice value", "assessable value", "total value"),
    "distance_km": ("distance", "approx distance", "distance km", "transportation distance"),
    "vehicle_no": ("vehicle no", "vehicle number", "vehicle"),
    "transport_mode": ("mode", "transportation mode", "trans mode"),
    "part_b_filled": ("part b", "part b filled", "vehicle updated"),
    "valid_upto": ("valid upto", "valid until", "validity"),
    "status": ("status", "ewb status"),
    "cancelled_on": ("cancelled date", "date of cancellation", "cancel date"),
    "gstin": ("gstin", "user gstin", "generated by"),
}

_LEDGER: Final[dict[str, tuple[str, ...]]] = {
    # "Transaction Type (Debit/Credit)" is a flag, not an amount. Without a
    # field of its own it matched "credit" and its value -- the word "Credit"
    # -- was then read as money and failed. Claiming the header here is what
    # keeps a money synonym from taking it.
    "transaction_type": ("transaction type", "type of transaction", "dr cr", "debit credit"),
    "as_on": (
        "date",
        "transaction date",
        "posting date",
        # What the department's own exports write.
        "date of deposit debit",
        "date of deposit",
        "reporting date",
        "दिनांक",
    ),
    "period": ("period", "tax period", "return period"),
    "ledger": ("ledger", "ledger type", "ledger name"),
    "head": ("head", "tax head", "major head", "description"),
    "opening": ("opening balance", "opening", "balance brought forward"),
    "credited": ("credit", "credited", "amount credited"),
    "debited": ("debit", "debited", "amount debited"),
    "closing": ("closing balance", "closing", "balance carried forward"),
    "reference": ("reference no", "ref no", "transaction id"),
    "gstin": ("gstin", "gstin uin"),
}

_EINVOICE: Final[dict[str, tuple[str, ...]]] = {
    "irn": ("irn", "invoice reference number"),
    "ack_no": ("ack no", "acknowledgement number", "ack number"),
    "ack_date": ("ack date", "acknowledgement date"),
    "irn_date": ("irn date", "irn generated date", "irn generation date"),
    "doc_no": ("document number", "invoice number", "doc no"),
    "doc_date": ("document date", "invoice date"),
    "doc_type": ("document type", "doc type"),
    "counterparty_gstin": ("recipient gstin", "buyer gstin", "gstin of recipient"),
    "taxable_value": ("taxable", "assessable"),
    "igst": ("integrated tax", "igst"),
    "cgst": ("central tax", "cgst"),
    "sgst": ("state ut tax", "sgst"),
    "cess": ("cess",),
    "status": ("status", "irn status"),
    "cancelled_on": ("cancel date", "cancelled date"),
    "gstin": ("gstin", "supplier gstin", "seller gstin"),
}

#: GSTR-3B is a fixed-shape form, so its "columns" are table cells.  The header
#: text is matched against the portal's own row labels.
_RETURN_3B: Final[dict[str, tuple[str, ...]]] = {
    "t31a": ("outward taxable supplies other than zero rated nil rated and exempted", "3.1 a"),
    "t31b": ("outward taxable supplies zero rated", "3.1 b"),
    "t31c": ("other outward supplies nil rated exempted", "3.1 c"),
    "t31d": ("inward supplies liable to reverse charge", "3.1 d"),
    "t31e": ("non gst outward supplies", "3.1 e"),
    "t311i": ("taxable supplies on which electronic commerce operator pays tax u s 9 5", "3.1.1 i"),
    "t311ii": (
        "taxable supplies made by registered person through electronic commerce operator",
        "3.1.1 ii",
    ),
    "t4a1": ("import of goods", "4 a 1"),
    "t4a2": ("import of services", "4 a 2"),
    "t4a3": ("inward supplies liable to reverse charge other than 1 2 above", "4 a 3"),
    "t4a4": ("inward supplies from isd", "4 a 4"),
    "t4a5": ("all other itc", "4 a 5"),
    "t4b1": ("as per rules 38 42 43 of cgst rules and section 17 5", "4 b 1"),
    "t4b2": ("others", "4 b 2"),
    "t4c": ("net itc available", "4 c"),
    "t4d1": ("itc reclaimed which was reversed", "4 d 1"),
    "t4d2": ("ineligible itc under section 16 4", "4 d 2"),
    "period": ("period", "tax period", "return period"),
    "gstin": ("gstin", "gstin uin"),
}

CANONICAL_FIELDS: Final[dict[ReturnType, dict[str, tuple[str, ...]]]] = {
    ReturnType.GSTR1: _OUTWARD,
    ReturnType.GSTR1A: _OUTWARD,
    ReturnType.GSTR2B: _INWARD,
    ReturnType.GSTR3B: _RETURN_3B,
    ReturnType.GSTR9: _RETURN_3B,
}

#: Datasets that are not a return type but arrive in the same workbooks.
EXTRA_FAMILIES: Final[dict[str, dict[str, tuple[str, ...]]]] = {
    "EWAYBILL": _EWB,
    "LEDGER": _LEDGER,
    "EINVOICE": _EINVOICE,
}


def synonyms_for(family: ReturnType | str) -> dict[str, tuple[str, ...]]:
    key = family if isinstance(family, ReturnType) else None
    if key is None:
        try:
            key = ReturnType(str(family))
        except ValueError:
            return EXTRA_FAMILIES.get(str(family), _OUTWARD)
    return CANONICAL_FIELDS.get(key, _OUTWARD)


# ---------------------------------------------------------------------------
# matching
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class FieldMatch:
    """One header's mapping decision, with how confident and why."""

    header: str
    field: str | None
    score: str  # a Decimal-free confidence label; see CONFIDENCE
    method: str

    @property
    def needs_confirmation(self) -> bool:
        return self.field is None or self.method != "exact"


def _edit_distance(left: str, right: str) -> int:
    """Damerau-Levenshtein: a transposition costs one, not two.

    "Taxabel Value" for "Taxable Value" is one swapped pair, and a metric that
    charged it as two substitutions would push a genuine typo below the fuzzy
    floor -- forcing the officer to map a column they should never have seen.
    """
    if left == right:
        return 0
    if not left or not right:
        return max(len(left), len(right))
    rows = len(left) + 1
    columns = len(right) + 1
    grid = [[0] * columns for _ in range(rows)]
    for i in range(rows):
        grid[i][0] = i
    for j in range(columns):
        grid[0][j] = j
    for i in range(1, rows):
        for j in range(1, columns):
            cost = 0 if left[i - 1] == right[j - 1] else 1
            grid[i][j] = min(
                grid[i - 1][j] + 1,
                grid[i][j - 1] + 1,
                grid[i - 1][j - 1] + cost,
            )
            if i > 1 and j > 1 and left[i - 1] == right[j - 2] and left[i - 2] == right[j - 1]:
                grid[i][j] = min(grid[i][j], grid[i - 2][j - 2] + 1)
    return grid[-1][-1]


def _similarity_percent(left: str, right: str) -> int:
    longest = max(len(left), len(right))
    if longest == 0:
        return 0
    return round((longest - _edit_distance(left, right)) * 100 / longest)


#: Below this normalised similarity a fuzzy match is not proposed at all.
FUZZY_FLOOR: Final[int] = 82


@lru_cache(maxsize=4096)
def _match_normalised(normalised: str, raw: str, family: str) -> FieldMatch:
    # The three matching layers -- exact, token containment, edit distance --
    # stay separate branches on purpose: which layer matched is reported to
    # the officer as the mapping's confidence, and merging them loses that.
    lexicon = synonyms_for(family)

    # 1. exact, on the normalised form
    for field, spellings in lexicon.items():
        if normalised == field or normalised in {normalise_header(s) for s in spellings}:
            return FieldMatch(raw, field, "100", "exact")

    # 2. token containment -- "integrated tax igst" contains a known spelling
    tokens = set(normalised.split())
    best_field: str | None = None
    best_cover = 0
    for field, spellings in lexicon.items():
        for spelling in spellings:
            spelling_tokens = set(normalise_header(spelling).split())
            if not spelling_tokens:
                continue
            if spelling_tokens <= tokens:
                cover = len(spelling_tokens)
                if cover > best_cover:
                    best_field, best_cover = field, cover
    if best_field is not None and best_cover >= 1:
        return FieldMatch(raw, best_field, "90", "tokens")

    # 3. normalised edit distance
    best_score = 0
    best_field = None
    for field, spellings in lexicon.items():
        for candidate in (field, *spellings):
            score = _similarity_percent(normalised, normalise_header(candidate))
            if score > best_score:
                best_score, best_field = score, field
    if best_field is not None and best_score >= FUZZY_FLOOR:
        return FieldMatch(raw, best_field, str(best_score), "fuzzy")

    return FieldMatch(raw, None, str(best_score), "unmatched")


def match_header(header: object, family: ReturnType | str) -> FieldMatch:
    """Map one source header to a canonical field.

    Cached on the normalised header: a workbook repeats the same headers on
    every sheet, and header detection scores dozens of candidate rows against
    the whole lexicon.  Without the cache the edit-distance layer dominates the
    entire ingestion run.
    """
    normalised = normalise_header(header)
    raw = str(header) if header is not None else ""
    if not normalised:
        return FieldMatch(raw, None, "0", "empty")
    family_key = family.value if isinstance(family, ReturnType) else str(family)
    match = _match_normalised(normalised, raw, family_key)
    # The cache is keyed on the normalised form, so the raw spelling that comes
    # back is the first one seen; restore this call's own spelling.
    return FieldMatch(raw, match.field, match.score, match.method)


def match_headers(headers: list[object], family: ReturnType | str) -> list[FieldMatch]:
    """Map a header row, refusing to assign one canonical field twice.

    Two columns claiming ``taxable_value`` is a real shape in consultants'
    files (a subtotal column next to the real one).  The better match keeps the
    field; the other is reported unmatched for the officer to decide.
    """
    matches = [match_header(header, family) for header in headers]
    claimed: dict[str, int] = {}
    resolved: list[FieldMatch] = []
    for index, match in enumerate(matches):
        if match.field is None:
            resolved.append(match)
            continue
        previous = claimed.get(match.field)
        if previous is None:
            claimed[match.field] = index
            resolved.append(match)
            continue
        if int(match.score) > int(resolved[previous].score):
            resolved[previous] = FieldMatch(
                resolved[previous].header, None, resolved[previous].score, "duplicate_field"
            )
            claimed[match.field] = index
            resolved.append(match)
        else:
            resolved.append(FieldMatch(match.header, None, match.score, "duplicate_field"))
    return resolved
