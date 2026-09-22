# 02 — INGESTION AND CROSS-SHEET MATCHING
### The layer that decides whether every rule above is right or worthless

Read `06_WORKBOOK_ANATOMY.md` alongside this. It dissects a real 29-sheet GSP export and
every requirement here answers something in that file.

---

# PART A — INGESTION

## A1. The pipeline

```
upload → virus scan → store raw bytes (sha256, immutable) → enumerate sheets
  1 CLASSIFY   score each sheet against ReturnType fingerprints (column tokens, value
               shapes, sheet-name hints) → (type, confidence). < 0.6 → ask the user, or
               route to the mapper agent for an ADVISORY proposal.
               Classify by COLUMNS, not by sheet name: the reference workbook labels a
               GSTR-8 TCS sheet "GSTR-7 TCS".
  2 LOCATE     header row = argmax(non_null_ratio × token_match ×
               type_consistency_of_next_5_rows); forward-fill merged upper rows.
               The reference workbook has the header on row 6 for 21 sheets and row 7
               for 8. A fixed skiprows is wrong on a quarter of the file.
  3 BIND       rows 1-4 carry Company Name / GSTIN / Return Period / Report Name.
               Parse them, validate the GSTIN, bind the whole workbook to a taxpayer
               and an FY with zero user input.
  4 MAP        synonym lexicon → normalised edit distance → agent proposal.
               Duplicate column names inside one sheet are disambiguated POSITIONALLY
               and prefixed original_* / revised_*.
  5 COERCE     §A2 below. This is where scrutiny software actually fails.
  6 VALIDATE   per-field, cross-field, then the INVARIANTS in §A3.
  7 CANONICALISE → typed records, each carrying provenance to file→sheet→row→cell
  8 RECONCILE  rows_in = parsed + quarantined + duplicates. ASSERT. DISPLAY.
  9 SNAPSHOT   immutable, content-hashed. The engine only ever runs on a snapshot.
```

Non-negotiables: never reject a whole workbook for one bad sheet · quarantine carries a
reason and the original row and replays after a mapping fix with no re-upload ·
duplicate detection on `(gstin, period, return_type, doc_no, doc_date, counterparty,
taxable_value)` so re-uploading is a non-event.

## A2. Coercion — the specific traps, all observed in real data

**Dates.** Accept `dd-mm-yyyy`, `dd/mm/yy`, Excel serial, `Jun-2025`, ISO. Then:

> **The mixed-type transposition trap.** A column can be *half strings and half Excel
> datetimes*, because the producing tool wrote `dd-mm-yyyy` into an `mm-dd` locale:
> Excel silently transposed every cell where the day was ≤ 12 and left the rest as
> strings. The signature is diagnostic — **datetime cells show day values 1–12 only,
> string cells show day > 12 only.** In the reference workbook this affected 635 of
> 2,043 IRN dates and, read naively, manufactured **250 fabricated Rule 48(4)
> violations and 314 physically impossible negative reporting lags.**
>
> **Detect it:** if a date column is mixed-type, and every datetime cell has
> `day ≤ 12`, and every string cell has `day > 12`, transposition is certain. Correct
> it, log the correction, and show it in the ingestion report. If the pattern is
> ambiguous, quarantine the column and ask — never guess.

**Money.** `Decimal` only. Strip `,` `₹` `Rs` `INR`; accountancy parentheses are
negative; `NIL`/`-`/`NA`/blank are `0.00`. Never `float`.

**GSTIN.** Upper, strip, structure, Luhn mod-36 checksum. Position 14 is `Z` for a normal
taxpayer, **`D` for a §51 deductor and `C` for a §52 collector** — a validator
hard-coded to `Z` rejects every government department in India. In the reference
workbook it wrongly flagged two BSF units that had deducted TDS on ₹8.00 crore.

**HSN/SAC.** Digits, padded to a valid 2/4/6/8 length. Classify: `99xxxx` = service SAC,
chapters 01–98 = goods. X-04 and X-07 depend on that classification.

**Period.** Month names plus the FY from the metadata block. **January–March belong to
the *following* calendar year.** Get this wrong and every limitation clock and every
§16(4) test is off by a year.

**Rates.** Resolve against the effective-dated HSN rate master. 28% on 20-Sep-2025 is
correct; 28% on 23-Sep-2025 is not.

## A3. Post-coercion invariants — a row that fails is quarantined, never scrutinised

These run **before any rule sees the data**. Each is a hard gate.

| # | Invariant | Rationale |
|---|---|---|
| I-01 | `ack_date ≥ doc_date` | An IRN cannot precede its invoice |
| I-02 | `filing_date ≥ period_end` | A return cannot be filed before its period closes |
| I-03 | `valid_upto ≥ ewb_date` | An e-way bill cannot expire before it is generated |
| I-04 | `\|taxable_value × rate ÷ 100 − tax_total\| ≤ ₹1` | Line arithmetic |
| I-05 | `doc_date` within the FY ± 1 year | Catches century and transposition errors |
| I-06 | tax head consistent with `is_intrastate(supplier_state, pos)` | Head/POS |
| I-07 | `ledger.closing == opening + credited − debited` per head | Ledger continuity |
| I-08 | `3B 4(C) == 4(A)total − 4(B)total` per head | The return is well-formed |
| I-09 | `rows_in == parsed + quarantined + duplicates` per sheet | Nothing vanished |
| I-10 | GSTIN checksum valid, or classified as deductor/collector | Counterparty identity |

**A finding must never be built on a row that failed an invariant.** I-01 alone would
have prevented all 250 false e-invoice notices in the reference workbook.

## A4. Absent versus empty versus nil — a three-way distinction, not two

| State | Meaning | Engine behaviour |
|---|---|---|
| `ABSENT` | The sheet was not in the workbook | Dependent rules → `NOT_EVALUATED`, naming the sheet |
| `PRESENT_EMPTY` | Sheet present, zero rows | Dependent rules **run** and may return `CLEAR` |
| `NIL_BY_IDENTITY` | Section absent, but the present sections sum to the auto-populated 3B total | Treat the remainder as nil and **run the identity** |

The third case is the one everyone gets wrong. In the reference workbook GSTR-1 carries
only B2B, CDN, HSN and DocIssued — no B2C, export or SEZ tables. That looks incomplete.
It is not: B2B + CDN equals 3B Table 3.1(a) **to the paisa in all twelve months**, which
is only possible if there are no B2C or export supplies at all. R1 is fully computable.

```
if sum(present_sections) == auto_populated_3B_total (within ₹1):
    remainder is NIL_BY_IDENTITY  → run the identity, confidence CERTAIN
else:
    NOT_EVALUATED, naming which tables would close the gap
```

Do not guess in either direction.

---

# PART B — THE MATCH ENGINE

## B1. Matching is the product

Single-sheet checks find clerical error. **Every material finding in the worked case
came from a join** — the Rule 37A exposure from a supplier-status column joined to a
claim, the ₹1.91 crore from an invoice joined to a credit note joined to an HSN summary
joined to a third party's TDS return.

## B2. Match-key strategy

Each join declares a **key ladder**, tried in order, and every match records which rung
matched so the officer can see the strength of the link:

```
L1 EXACT      normalised (gstin, doc_no, doc_date, taxable_value)      → CERTAIN
L2 STRONG     (gstin, doc_no_normalised, doc_date ± 3d)                → STRONG
L3 VALUE      (gstin, taxable_value exact, doc_date ± 15d)             → STRONG
L4 FUZZY      (gstin, doc_no edit-distance ≤ 2, value ± 1%)            → ADVISORY
L5 UNMATCHED  → its own bucket; NEVER silently dropped
```

`doc_no` normalisation: upper, strip whitespace, drop leading zeros in the numeric tail,
strip common separators. `SSR/M/0029/25-26` and `SSR-M-29-25-26` are the same document.
**Keep the original string on the record** — X-02 matches credit note `CNM118` to
invoice `1118` by digit containment, which normalisation would otherwise destroy.

Every join outputs four buckets, all of them addressable and Excel-exportable:
**MATCHED · ONLY-LEFT · ONLY-RIGHT · VALUE-DIFFERS**. Officers live in Excel and will
not adopt a tool that cannot hand a working file back.

## B3. The join graph — 20 named joins

| # | Left | Right | Key | Feeds |
|---|---|---|---|---|
| **J01** | `GSTR1_B2B` + `GSTR1_CDN` | `GSTR3B_Supplies 3.1(a)` | period, head | G-02, R1, Rule 88C |
| **J02** | `GSTR2B_B2B` + `CDNR` + `B2BA` | `GSTR3B_ITC 4A(5)` | period, head | B-01, P14, Rule 88D |
| **J03** | `GSTR2B_B2B` | `GSTR2A_B2B` | L1→L3 | population gap; late supplier filings |
| **J04** | `GSTR2A_B2B.GSTR-3B Filing Status` | ITC claimed | supplier GSTIN, period | **B-04 Rule 37A** |
| **J05** | `GSTR1_B2B` | `GSTR1_HSNSummary` | period, rate | value integrity; X-03, X-04 |
| **J06** | `GSTR1_B2B` | `GSTR1_DocIssued` | series, count | G-12 series gaps; X-09 |
| **J07** | `GSTR1_CDN` | `GSTR1_B2B` | L3 value+party, **plus digit containment of the doc number** | H-02, **X-02, X-06** |
| **J08** | `GSTR1_B2B` net of CDN | `GSTR2A_TDS` / GSTR-8 TCS | counterparty, value | G-14, **X-10** |
| **J09** | `GSTR2B_IMPG` | `GSTR3B_ITC 4A(1)` | period | B-09, P15 |
| **J10** | `GSTR2A_IMPGOS` | `GSTR3B_ITC 4A(2)` | period | C-04, P02 |
| **J11** | `GSTR3B 3.1(d)` | `GSTR3B 4A(3)` | period, head | C-02, P16 |
| **J12** | `CreditLedger` | `GSTR3B_PaymentofTax` | period, head | R8, §49 order, **X-11** |
| **J13** | `CashLedger` | `Challan` | CPIN, date | payment trail |
| **J14** | `LiabilityLedger` | `GSTR3B` due dates | period | A-02, J-01, P11 |
| **J15** | `GSTR1_B2B.IRN` | e-invoice mandate | AATO, doc date | G-03, G-04 |
| **J16** | `GSTR2B.ims_action` | 3B claim | document | IMS-pending-yet-claimed |
| **J17** | `GSTR2B_B2BA` / `GSTR2A_B2BA` | original records | original doc | amendment chain, **X-12** |
| **J18** | `3B 4B(2)` reversal | `3B 4D(1)` reclaim | rolling window | ECRRS balance, **X-11** |
| **J19** | `GSTR1_HSNSummary` | HSN rate master | HSN, doc date | G-10, GST 2.0 boundary |
| **J20** | counterparty GSTINs | GSTIN master | GSTIN, doc date | A-01, B-10 |
| **J21** | outward lines | outward lines, self-join | counterparty × value bucket | **X-01, X-05** |

**J21 is the self-join** that produced the largest finding in the worked case. It is
cheap — group by counterparty, bucket by exact taxable value, look for more than one
distinct rate — and no conventional scrutiny tool runs it.

## B4. Tolerances

| Comparison | Default | Why |
|---|---|---|
| Line arithmetic (`value × rate` vs tax) | ₹1.00 | Portal rounding |
| Head-wise return identity (R1, R2, R3) | ₹0.00 | These must be exact |
| Ledger continuity | ₹1.00 | Rupee rounding in ledger display |
| EWB value vs invoice value | ±2% | EWB includes tax and charges |
| Value-based document match (L3) | ±0.1% or ₹100 | Whichever is greater |
| X-01 value bucketing | exact to the rupee | The contradiction is the identical value |

Every tolerance is a named, effective-dated parameter, shown in the provenance drawer.

## B5. What the engine emits per join

```
MatchResult
  join_id · left_count · right_count
  matched[]        with match_level L1..L4 per pair
  only_left[]  only_right[]  value_differs[]
  totals  head-wise, both sides, and the delta
  calc_id · evidence pointers to source rows
```

A rule consumes a `MatchResult`; it never re-runs the join. One join, many rules —
J04 alone feeds B-04, P14 and the Rule 37A demand computation.

---

# PART C — THE FILING SCORECARD

The officer's unit of work is a **filing** — one GSTIN, one period, one return set. So
the engine's primary artefact is a per-filing scorecard, not a per-taxpayer summary.

```
FilingScorecard(gstin, period)
  coverage        which of the 11 source datasets are present / empty / absent
  invariants      I-01..I-10 pass/fail counts, with quarantined row counts
  identities      R1..R11 status and head-wise delta, each with a calc_id
  parameters      the applicable subset of P01..P34, with flag and cohort context
  checks          every applicable A-L and X check:
                    AUTO      → PASS | FAIL(₹, head-wise) | NOT_EVALUATED(reason)
                    ASSISTED  → NEEDS_DOCUMENT(named document, partial figure)
                    MANUAL    → CHECKLIST
                    n/a       → NOT_APPLICABLE(industry / flag)
  period_score    F-Score contribution from this period alone
  netting         any finding netted against an adjacent period, both figures shown
  open_documents  count and aggregate unquantified exposure
```

**A twelve-month FY produces twelve scorecards plus one annual roll-up**, and the UI's
default view is the 12 × N grid of them. That grid is what an officer scans in ten
seconds to decide where to spend the day, and it is the reason this platform exists
rather than a spreadsheet.

The annual roll-up is **not** the sum of the monthly scorecards: netting, §16(4) time
limits, Rule 37A cut-offs and annual reversal true-ups are FY-level tests that no
monthly scorecard can see. Compute it separately and say so on the screen.
