# 05 — BUILD PHASES AND ACCEPTANCE
### Eight phases. Each block is a paste-ready prompt with its own gate.

Do not compress Phase 2 (invariants + matching + provenance). Everything downstream is
wrong without it, and none of it can be retrofitted.

## GLOBAL GATES — every commit

| # | Gate | Enforcement |
|---|---|---|
| G1 | No float literal or `float()` under `app/engine`, `app/matching`, `app/ingestion` | AST lint, **build-breaking** |
| G2 | No money column is floating-point | Migration test |
| G3 | No money crosses the API as a JSON number | OpenAPI schema test |
| G4 | `mypy --strict` clean on `app/engine` and `app/matching` | CI |
| G5 | `tsc --noEmit` clean; zero `any` in `src/lib`, `src/components` | CI |
| G6 | Engine + matching coverage ≥ 90% | pytest-cov |
| G7 | Replay: same snapshot twice ⇒ identical `calc_id`s, flags, findings, scorecards | `test_replay.py` |
| G8 | Every rendered figure carries a `calc_id` | `<Money>` contract test |
| G9 | Every `ChartCard` has a drill handler | Component test |
| G10 | No agent completion contains an untraceable number | Middleware test, **build-breaking** |
| G11 | No rule reads a row that failed an invariant | Engine test |
| G12 | Audit chain verifies from genesis | `test_audit_chain.py` |

---

## PHASE 0 — Foundation
```
1. Monorepo per docs/03 §2. docker-compose: postgres:16, redis, minio, api, web.
2. app/money.py FIRST: D() coercing str-with-commas / ₹ / accountancy parentheses /
   Excel floats / None / "NIL" to 2dp Decimal ROUND_HALF_UP; TaxVector(igst,cgst,sgst,
   cess) with + - == .total .abs_total .positive_part() .is_zero() .dict()→strings;
   rupee() for s.170; inr() for Indian display. Property-test it.
3. The G1 lint rule. Prove it fails on a deliberate violation.
4. app/canonical.py: enums; Period (MMYYYY + month-name + FY, Jan–Mar → next CY);
   GSTIN structure + Luhn mod-36, position 14 accepting [ZDC]; state codes; due dates.
5. Alembic 0001 with every table in docs/03 §3. Money NUMERIC(18,2) + the G2 test.
6. Hash-chained audit log with an append helper and a chain verifier.
7. Frontend shell: /dashboard and /workbench split, role-based landing, tokens per
   docs/04 §1 including the dark-mode double-scope declaration, i18n en + mr keys.
```
**Gate.** `D("₹ 12,34,567.89")` → `1234567.89`; `D("(1,000)")` → `-1000.00`;
`D(0.1)+D(0.2) == D("0.3")` exactly. `TaxVector(igst="100") − TaxVector(cgst="100")`
has `.total == 0`, `.abs_total == 200.00`, `.is_zero() is False`. `Period.parse` agrees
across formats; January 2026 resolves to FY 2025-26. `validate_gstin` accepts
`27AAPCS8928R1Z1` **and** `24AAAGD0803M1D2` (deductor), rejects a flipped character.
G1 and G2 fail the build when violated — prove it.

## PHASE 1 — Ingestion and invariants
```
1. sniffer (classify by COLUMNS not sheet name) · header locator (argmax, merged-row
   forward fill) · synonym lexicon (GSTN portal + Tally/Busy/ClearTax/Zoho + Marathi
   + the literal typos in docs/06: "Centarl Tax", "Repoting Date", "Tax Preiod",
   "GSTIN of Debuctor", "Larger Used For discharging liability")
2. coerce.py per docs/02 §A2, INCLUDING the mixed-type date-transposition detector:
   if a date column is mixed str/datetime AND every datetime has day ≤ 12 AND every
   string has day > 12 → transposition certain; correct, log, surface in the report.
   Ambiguous → quarantine the column and ask. Never guess.
3. invariants.py — I-01..I-10 per docs/02 §A3. A failing row is quarantined and is
   invisible to every rule. Wire G11.
4. Coverage classification: ABSENT | PRESENT_EMPTY | NIL_BY_IDENTITY per docs/02 §A4.
5. quarantine with reason + original row, replayable after a mapping fix.
6. duplicates on (gstin, period, return_type, doc_no, doc_date, counterparty, value).
7. pipeline with SSE; ASSERT rows_in = parsed + quarantined + duplicates.
8. snapshots: immutable, content-hashed.
```
**Gate.** The reference workbook in `docs/06` ingests: 29 sheets classified, 0 rejected,
header row 6 on 21 and row 7 on 8, 12 periods with Jan–Mar mapped to CY2026, all five
typo'd headers mapped, `GSTR2B_B2BA` duplicate columns disambiguated positionally, six
empty sheets recorded `PRESENT_EMPTY`, `"GSTR-7 TCS"` classified as GSTR-8 by columns.
**The date transposition is detected and corrected: 635 cells fixed, negative lags fall
from 314 to 0.** Row identity holds and is displayed. Re-upload gives 0 parsed, N
duplicates.

## PHASE 2 — Matching and provenance ★
```
1. matching/keys.py — normalisation + the L1–L5 key ladder per docs/02 §B2. Keep the
   ORIGINAL doc_no on the record: X-02 matches CN "CNM118" to invoice "1118" by digit
   containment, which normalisation destroys.
2. matching/joins.py — all 21 joins (J01–J21), each returning a MatchResult with four
   buckets and per-pair match levels. J21 is the outward self-join.
3. engine/identities.py — R1..R11, head-wise, each returning a TaxVector delta + trace.
4. Indexes on RuleContext; ledgers at DAILY grain (X-11 needs a running balance).
5. engine/trace.py — calc_id = DETERMINISTIC HASH of check_id + snapshot_id + inputs.
   NOT a random UUID.
6. engine/params.py — effective-dated resolution AS AT THE TAX PERIOD, never today.
7. GET /calc/{calc_id} and GET /match/... ; frontend <ProvenanceDrawer> and
   <Money calcId> — the only way a figure renders. <MatchBuckets>.
8. tests/test_replay.py.
```
**Gate.** R1–R11 match hand-computed fixtures head-wise. **The critical case:** IGST
short ₹1,00,000 against CGST excess ₹1,00,000 gives two findings with `delta.total == 0`
and `delta.abs_total == 200000.00`. Credit notes reduce the R1 side; amendments fold
once. J04 on the reference workbook returns **103 records, ₹95,79,967 tax, 29 suppliers,
SSR Shipyard ₹77,99,267**. J21 finds the two ₹3,66,75,640 IWAI invoices at 18% and 5%
four days apart. Two runs over one snapshot give identical `calc_id`s. Drawer < 250 ms.

## PHASE 3 — The X family and the AUTO checks
```
1. rules_x.py — X-01..X-12 per docs/01 §7, X-01/X-05 and X-11 exactly as worked.
   X-01 exposure is every LATER line that adopted the lower rate, not just the two
   contradicting invoices.
2. engine/exemptions.py — testable exemptions suppress (with their own calc_id and a
   visible suppression card); untestable ones downgrade to ADVISORY with an officer
   prompt. Rule 86B ships with clause (d) of its first proviso.
3. engine/netting.py — rolling window per docs/01 §4; emit ONE netted finding with both
   figures on the card.
4. The 41 AUTO checks from docs/01 §8, by module: A → B → J → F → G → C → D → H → L.
5. engine/params_p01_p34.py — all 34, with the cohort fallback in docs/01 §5 and
   EXTERNAL parameters returning NOT_EVALUATED excluded from BOTH sides of the score.
6. Golden tests per check: positive, negative, boundary AT the exact threshold,
   not-evaluated.
```
**Gate.** On the reference workbook the engine reproduces `docs/07` **to the paisa**:
X-01/X-05 ₹1,90,71,333 · B-04 ₹95,79,967 · X-11 ₹1,22,380 floor · J-01 ₹17,083 ·
G-10 three post-22-Sep lines. **Rule 86B is SUPPRESSED in May and June** by the
cumulative-1% exemption, with the suppression visible. R1 returns ₹0.00 head-wise in all
12 months. G-04 returns **zero** late IRNs. Boundary: OUT/G-02 at exactly 20.00% and
₹25,00,000 does not trigger; at 20.01% and ₹25,00,001 it does.

## PHASE 4 — Scorecard, ASSISTED checks, case engine
```
1. scorecard.py — per (gstin, period) per docs/02 Part C, plus the ANNUAL roll-up
   computed separately (netting, s.16(4), Rule 37A cut-offs are FY-level).
2. Applicability: industry grid × client flags → NOT_APPLICABLE (not CLEAR).
   Industry derived from dominant HSN class in Table 12, officer-confirmed.
3. The 46 ASSISTED checks: emit DocumentCall with the partial figure and the named
   document. They do NOT score; they drive open_documents and unquantified_exposure.
4. The 43 MANUAL checks as checklist items with the legal test and action point.
5. Module K case engine: section by FY (73/74 to FY 2023-24, 74A from FY 2024-25 —
   42/54 months, SCN ≥12 months before order), AR due dates, penalty % by payment
   stage, interest, s.128A eligibility, COVID extension as an effective-dated
   parameter carrying LITIGATION_UNCERTAIN.
6. scoring.py — P-Score + coverage, F-Score + waterfall, SEPARATE.
7. Frontend W1 ScorecardGrid, W2 Match Workbench, W3 Taxpayer File, W4 Call Book.
```
**Gate.** Twelve scorecards + one annual roll-up for the reference workbook; the annual
is not the sum of the monthlies and the screen says so. Waterfall contributions sum
exactly to the dimension score. FY 2023-24 uses §73/§74; FY 2024-25 uses §74A with the
right months, verified against hand-computed dates. A §128A-eligible period is
suppressed, visible and labelled. Call Book groups by document, not by rule.

## PHASE 5 — Dashboard and aggregation
```
1. Nightly rollups: fact_filing_period, fact_risk_snapshot, fact_param_incidence,
   fact_enforcement. Every fact row carries its engine_run_id.
2. GET /dashboard/* including /dashboard/drill — BUILD THE DRILL ENDPOINT BEFORE
   STYLING ANY CHART.
3. D1–D5 per docs/04 §3. D4 Parameter Explorer is the centrepiece.
4. Chart discipline per docs/04 §1: validated palette, ONE y-axis ever, status colours
   reserved and always with icon + label, hover by default, table view on every chart.
5. <ChartCard> with a mandatory drill handler (G9).
```
**Gate.** Overview over 48k taxpayers < 500 ms from rollups. Every chart element drills
with no dead end. The P-coverage meter names the dark feeds. **Grep for a dual-axis
chart: zero results.** Dark mode selected, toggle beats OS both ways.

## PHASE 6 — Notices, agents, i18n
```
1. ASMT-10, DRC-01A, DRC-01B, DRC-01C in English and Marathi. Numeric slots bind ONLY
   to check results; attempting to edit one returns 422.
2. Slot fill → PDF → DIN (Circular 122/41/2019) → hash into the audit chain at approval.
   Maker-checker rejected at the API; self-approval impossible.
3. LLMProvider with hosted + on-premise adapters. The three agents in docs/03 §6.
4. THE NUMERIC-FIDELITY MIDDLEWARE, tested adversarially. Build-breaking.
5. Pseudonymisation (TP-nnnn), full agent logging.
6. Marathi locale ships.
```
**Gate.** The adversarial agent test passes — the model is prompted to invent a figure
and the response is rejected. Every agent figure carries a resolvable `calc_id`. Prompts
contain no GSTIN, PAN or trade name.

## PHASE 7 — Hardening
```
RBAC at the QUERY layer (out-of-scope GSTIN → 404, not 403) · field-level encryption
with logged reveals · load test 50k taxpayers × 12 periods < 1 hour · WCAG 2.1 AA audit
· OpenTelemetry · snapshot export/import/replay · coming-soon screens with 501 APIs
naming the parameters each unlocks (NO fabricated data) · officer manual (en + mr) and
the rule handbook for the law officer's sign-off.
```

---

## FIXTURES

**Fixture 1 — the real workbook.** `docs/06_WORKBOOK_ANATOMY.md` and
`docs/07_WORKED_SCRUTINY_CASE.md` describe a genuine 29-sheet GSP export and the exact
findings it must produce. Anonymise the GSTIN and trade names and make it
`tests/fixtures/real/`. **This is the primary acceptance fixture** — the synthetic set
passes on day one because the generator shares the engine's assumptions; this one does
not, and that is its value.

**Fixture 2 — synthetic, 12 taxpayers.** FY 2025-26 (straddling 22-Sep-2025, inside the
hard-lock regime) plus one FY 2022-23 non-filer. Checksum-valid synthetic GSTINs, state
27, fictional names, workbooks generated to look like real exports (title block, merged
two-row header, spacer columns, trailing totals, inconsistent date formats, one Marathi
sheet, **one deliberately transposed date column**). Taxpayer 1 is clean — a platform
that cannot show a clean taxpayer cannot be trusted on a dirty one.

Ship `expected_results.json` asserting flags, checks, head-wise deltas, scorecards and
both scores. **Money compared as strings, to the paisa** — a float tolerance here would
hide exactly the class of bug this architecture exists to prevent.

> Before the first real demo, ingest at least three genuine anonymised departmental
> workbooks from different producers. Three files from three tools is the point at which
> ingestion stops being a demo and starts being infrastructure.

---

## THE DEMO TEST

1. Open the Dashboard. Point at **Revenue at risk**. Click it.
2. Land in D3. Click the **CERTAIN** confidence bar. Land on the taxpayer list.
3. Open one. Land on the **Scorecard Grid**. Click the red X-family cell in November.
4. Read the X-01 card: two invoices, same value, four days apart, 18% and 5%.
5. Click `◉ calc`. Read the formula, the parameters with their notification references,
   the matched pair from J21, and the source rows. Open the workbook and find them.

**Ninety seconds, Commissioner's number to spreadsheet cell.** If that path works the
platform is adopted. If it breaks anywhere, fix it before anything else — no chart, no
model and no agent compensates for a number an officer cannot trace.
