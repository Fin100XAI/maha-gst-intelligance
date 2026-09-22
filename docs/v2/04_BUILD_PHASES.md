# 04 - BUILD PHASES AND ACCEPTANCE
### Seven phases. Each block is a paste-ready prompt with its own gate.

Run them in order. At each gate: full check suite green, the phase's acceptance tests
printed and passing, then stop for review.

**Realistic effort with Claude Code:** Phases 0–4 give a demoable dual-surface portal
in about a week of focused sessions. Phases 5–6 make it something a department can
run. Do not compress Phase 2 - the provenance layer cannot be retrofitted.

---

## GLOBAL GATES - every commit

| # | Gate | Enforcement |
|---|---|---|
| G1 | No float literal or `float()` under `app/engine/` or `app/ingestion/` | Custom AST lint, **build-breaking** |
| G2 | No money column is floating-point | Migration test |
| G3 | No money value crosses the API as a JSON number | Schema test over the OpenAPI doc |
| G4 | `mypy --strict` clean on `app/engine/` | CI |
| G5 | `tsc --noEmit` clean; zero `any` in `src/lib` and `src/components` | CI |
| G6 | Engine coverage ≥ 90% | pytest-cov |
| G7 | Replay: same snapshot twice ⇒ identical `calc_id`s, flags, findings, ordering | `test_replay.py` |
| G8 | Every rendered figure carries a `calc_id` | `<Money>` contract test |
| G9 | Every ChartCard has a drill handler | Component test |
| G10 | No agent completion contains an untraceable number | Middleware test, **build-breaking** |
| G11 | Audit chain verifies from genesis | `test_audit_chain.py` |

---

## PHASE 0 - Foundation

```
Build the skeleton per docs/02_PLATFORM_SPEC.md §2.

1. Monorepo: backend/ (Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic) and
   frontend/ (Vite, React 18, TS strict, Tailwind, shadcn/ui).
2. docker-compose: postgres:16, redis:7, minio, api, web. `make dev` brings it up.
3. app/money.py FIRST - the foundation of everything:
     D(value)  coerces str with commas / ₹ / accountancy parentheses / Excel floats /
               None / "NIL" to a 2dp Decimal, ROUND_HALF_UP
     TaxVector(igst,cgst,sgst,cess) with + - == .total .abs_total .positive_part()
               .is_zero(tol) .dict() serialising to STRINGS
     rupee()   s.170 rounding, statutory demand figures only
     inr()     Indian display format
   Property-test it: no float escapes, dsum associative, quantisation idempotent.
4. The G1 lint rule. Write it now; prove it fails on a deliberate violation.
5. app/canonical.py - ReturnType / SupplySection / DocType / Severity /
   RiskDimension / ActionForm enums; Period (MMYYYY parse, .fy, .quarter, .next,
   .plus, .months_since); GSTIN structure + Luhn-mod-36 checksum; state codes;
   due dates including QRMP.
6. Alembic 0001 with every table in docs/02 §4. Money = NUMERIC(18,2). Migration test
   for G2.
7. Hash-chained append-only audit_log with an append helper and a chain verifier.
8. CI: ruff, mypy --strict, pytest, tsc --noEmit, eslint.
9. Frontend shell: routing split into /dashboard and /workbench, role-based landing,
   layout and nav per docs/03 §2, design tokens per docs/03 §1 including the dark-mode
   double-scope declaration, i18n with en + mr.
```

**Gate.** `D("₹ 12,34,567.89")` → `Decimal("1234567.89")`; `D("(1,000)")` →
`-1000.00`; `D("NIL")` → `0.00`; `D(0.1)+D(0.2) == D("0.3")` exactly.
`TaxVector(igst="100") - TaxVector(cgst="100")` has `.total == 0`,
`.abs_total == 200.00`, `.is_zero() is False` - **this test is Law 3 made
executable**. `Period.parse` agrees across all formats; `.fy == "2025-26"`.
`validate_gstin("27AAPFU0939F1ZV")` valid; any single character flipped invalid with a
reason. `due_date(GSTR3B, Jun-2025)` = 20-Jul-2025; QRMP = 22-Jul-2025. G1 and G2 fail
the build when deliberately violated - **prove it by violating them**.

---

## PHASE 1 - Ingestion

```
Build the pipeline per docs/02 §3. Forgiving by design.

1. sniffer.py    classify each sheet against ReturnType fingerprints → (type, conf)
2. header.py     argmax(non_null × token_match × type_consistency_of_next_5);
                 forward-fill merged upper rows
3. synonyms.py   GSTN portal headers for GSTR-1/2B/3B/9/EWB/ledgers, PLUS
                 Tally/Busy/ClearTax/Zoho variants, PLUS Marathi and Hindi.
                 Normalised edit distance as fallback.
4. coerce.py     dates (dd-mm-yyyy, dd/mm/yy, Excel serial, "Jun-2025", ISO),
                 money via D(), GSTIN, HSN (pad 2/4/6/8), UQC, rate, booleans
5. validators.py per-field + cross-field (taxable × rate ≈ tax within ₹1; head vs POS)
6. quarantine.py reason + original row; replayable after a mapping fix, no re-upload
7. duplicates    (gstin, period, return_type, doc_no, doc_date, counterparty,
                 taxable_value) - re-upload is idempotent
8. pipeline.py   SSE progress; ASSERT rows_in = parsed + quarantined + duplicates
9. snapshots     immutable, content-hashed
10. Endpoints per docs/02 §8 INGESTION.

NEVER reject a whole workbook for one bad sheet. NEVER silently drop a row.
```

**Gate.** A 40-tab workbook with a logo in row 1, merged headers and one unreadable
sheet ingests; the unreadable sheet is quarantined and the other 39 are not. Header
detection finds row 5 behind a 4-row title block. The row identity holds and is
displayed. Re-upload gives 0 parsed, N duplicates. Marathi GSTR-1 headers map. A row
with `taxable × rate ≠ tax` beyond ₹1 is quarantined with that reason and its original
cells. Fix a mapping, hit Replay, rows move out of quarantine with no re-upload.

---

## PHASE 2 - Canonical layer, identities, provenance ★

```
1. Canonical builders: OutwardLine, InwardLine, Return3B, LedgerEntry, EWayBill,
   EInvoice, TaxpayerProfile - each with a Provenance pointer to file→sheet→row→cells.
2. Amendments (9A/9B/9C) fold at the IDENTITY layer, never the row layer.
   Credit notes sign negative at the identity layer, never the row layer.
3. engine/identities.py - R1..R11 from docs/01 §A4 as named head-wise functions,
   each returning a TaxVector delta plus a trace.
4. Indexes for RuleContext: outward by (period, section, counterparty, hsn, doc);
   inward by (period, section, supplier, availability); ledgers at DAILY grain
   (PAY-03 needs a running balance, not a period-end snapshot).
5. PeerBands - percentile bands by HSN sector × turnover cohort × jurisdiction.
   Every RATIO_PEER flag depends on this; build it properly now.
6. engine/trace.py - Tracer. calc_id = DETERMINISTIC HASH of
   rule_id + snapshot_id + inputs. NOT a random UUID; replay depends on it.
7. engine/params.py - effective-dated resolution. params.get(id, key, on=period)
   resolves as at the TAX PERIOD, never as at today.
8. GET /calc/{calc_id} returning the full payload in docs/03 §6.
9. Frontend: <ProvenanceDrawer> and <Money calcId> - the ONLY way a figure renders.
10. tests/test_replay.py.

Do not proceed until a figure on screen opens its drawer, shows the formula with
substituted values, and lists the source rows.
```

**Gate.** R1–R11 match hand-computed fixtures head-wise. **The critical case:** IGST
short ₹1,00,000 against CGST excess ₹1,00,000 produces two findings with
`delta.total == 0` and `delta.abs_total == 200000.00` - a system reporting
"reconciled" here has failed Law 3. Credit notes reduce the R1 side. Amendments fold
once, not twice. R3 fails loudly on a malformed 3B. R8 catches an injected ₹1
discrepancy. R9 flags CGST against SGST. Two runs over one snapshot give identical
`calc_id`s. Parameter resolution is period-aware: FY 2019-20 scrutiny uses FY 2019-20
thresholds after a 2026 change. Drawer opens in <250 ms.

---

## PHASE 3 - The 34 parameters and the 57 rules

```
1. engine/params_p01_p34.py - all 34 from docs/01 Part B.
   Each: deterministic metric, banding strategy (RATIO_PEER | RATIO_ABS | DELTA_YOY |
   COUNT | BINARY | EXTERNAL), direction, weight, the auditor action point verbatim,
   and its data dependencies.
   EXTERNAL parameters (P02, P15, P20, P23, P25, P26, P27, P28, P33, P34) implement
   their formula fully and return NOT_EVALUATED naming the missing feed. They are
   excluded from BOTH numerator and denominator of the P-Score, so COVERAGE falls
   instead of the score being silently understated. Never default them to Flag 0.
2. engine/registry.py - @rule decorator (id, title, family, dimension, legal_basis,
   severity, params, requires, relates_to). Topological deps, deterministic ID order.
3. engine/context.py - RuleContext per docs/02 §5. Immutable. No I/O. No clock -
   as_of injected. A rule calling date.today() is a build failure; add that check.
4. All 57 rules from docs/01 Part C, in order:
   OUT(10) → ITC(13) → PAY(7) → BEH(6) → EWB(7) → EIN(3) → REG(5) → SEC(3) → NET(3)
   Implement the six WORKED SPECIFICATIONS in docs/01 §C3 exactly as written.
   NET-* last - they need InvoiceGraph (lazy on RuleContext; Johnson's algorithm,
   cycles 2-5, edges pruned below ₹1 lakh).
5. engine/scoring.py - P-Score (+ coverage) and F-Score, SEPARATE, each with a
   waterfall. No ML in either path.
6. NOT_EVALUATED names the exact missing dataset. NEVER "no issue found".
7. Golden tests: every parameter and every rule gets positive, negative, boundary at
   the EXACT threshold, and not-evaluated.

Never invent a threshold. Not in docs/01 ⇒ TODO(statute), surfaced in admin as
unconfigured, logged in docs/DECISIONS.md.
```

**Gate.** All 34 parameters and 57 rules registered with non-empty `legal_basis`.
Golden tests pass. Boundary tests sit **exactly on** the threshold: OUT-01 at 20.00%
and ₹25,00,000 does **not** trigger; at 20.01% and ₹25,00,001 it does - document the
inclusive/exclusive choice. A taxpayer with 10 EXTERNAL parameters dark shows
coverage 24/34 and a P-Score computed over 24, not 34. OUT-01 severity escalates one
level post-July-2025. NET-02 finds a planted 3-node ₹1.2 cr cycle and finds none in a
clean graph. Engine run: 1 taxpayer × 12 periods × (34 + 57) in **< 5 s**.

---

## PHASE 4 - Aggregation and the Dashboard

```
1. app/aggregation/ - nightly rollups into fact_filing_period, fact_risk_snapshot,
   fact_param_incidence, fact_enforcement, fact_officer (docs/02 §6). On-demand
   rebuild for one jurisdiction. EVERY fact row carries its engine_run_id.
2. The metrics catalogue, docs/02 §7 - M-F, M-R, M-K, M-E, M-Q. Each with a formula,
   a grain and a calc_id.
3. GET /dashboard/* per docs/02 §8, including /dashboard/drill.
   BUILD THE DRILL ENDPOINT BEFORE STYLING ANY CHART.
4. Dashboard screens D1–D9 per docs/03 §4.
   D5 Parameter Explorer is the centrepiece: the 34 × (flag 0-4 + NOT_EVALUATED)
   incidence matrix, parameter detail with the cohort distribution and flag
   thresholds drawn as reference lines, and the co-occurrence view.
5. Chart discipline per docs/03 §1 - validated palette, ONE y-axis ever, fixed
   categorical order, status colors reserved and always with icon + label, hover
   layer by default, table view on every chart, legend for ≥2 series.
6. <ChartCard> with a mandatory drill handler. A ChartCard without one fails review.
```

**Gate.** Dashboard overview over 48k taxpayers renders in < 500 ms from rollups, not
live queries. **Every chart element drills to the taxpayer list behind it** - click
through all of D1–D9 and find no dead end. The parameter matrix shows the
NOT_EVALUATED column at full visual weight. The P-coverage meter states the number of
dark parameters and names the feeds. No dual-axis chart exists anywhere - grep for it.
Every chart has a working table view. Status colors never appear as a series color.
Dark mode is selected, not inverted, and the theme toggle beats the OS setting both
ways.

---

## PHASE 5 - Workbench, cases, limitation

```
1. Workbench W1–W5 per docs/03 §5.
   W2 Audit Planner: select from P-Score, filter on individual parameter flags,
   record the selection rationale so next cycle's P30 is populated from real data.
   W4 Risk Profile: all 34 as <FlagLadder> - value, cohort percentiles, flag,
   the action point verbatim, related findings, calc handle. NOT_EVALUATED greyed
   with the named feed, never hidden, never defaulted to Flag 0.
2. Reconciliation Workbench: the 12 × 11 identity matrix, the bridge waterfall,
   the four-bucket matcher with Excel export. Head-wise split is the DEFAULT.
   Show why a rule did NOT fire, not only why it did.
3. Suppressions: s.128A amnesty periods, expired limitation, accepted prior replies.
   Suppressed findings are visible and labelled, never deleted.
4. Case lifecycle + limitation engine: §73/§74 to FY 2023-24, §74A from FY 2024-25
   (42 / 54 months, SCN ≥12 months before order). Recompute nightly.
5. REG-07 three-year bar: bar_date = due_date + 3y; BARRED / <90 / <180 / OK.
6. Demand computation: head-wise tax + day-counted interest + penalty with the
   section applied, addressed by one calc_id.
7. Admin: effective-dated rule and flag parameters with notification refs; the HSN
   rate master versioned across 22-Sep-2025; Rule & Parameter Library with the
   M-Q01 precision column.
```

**Gate.** Risk waterfall contributions sum exactly to the dimension score; dimension
scores weight exactly to the F-Score. FY 2023-24 uses §73/§74; FY 2024-25 uses §74A
with the right months - verified against hand-computed dates. A §128A-eligible period
is suppressed from the queue, still visible, labelled. A return due 20-Jul-2022 is
BARRED as at today. Demand reconciles to the sum of contributing findings. Registry
handles 50k rows with server-side filtering in < 400 ms. Recon matrix < 600 ms in one
request. The rate master returns 28% for an HSN on 20-Sep-2025 and 18% on 23-Sep-2025.

---

## PHASE 6 - Notices, agents, hardening

```
1. Templates ASMT-10, DRC-01A, DRC-01B, DRC-01C, DRC-01, ADT-01, REG-17, RFD-08 in
   English and Marathi. Numeric slots bind ONLY to finding fields.
2. Slot filling → PDF → DIN (CBIC Circular 122/41/2019) → PDF hash into the audit
   chain at approval. Maker-checker rejected at the API, not hidden in the UI.
3. Service log, reply clock, reply upload.
4. LLMProvider with hosted and on-premise adapters - a config switch, not a rewrite.
5. The six agents per docs/02 §9. Read-only tools. NO agent gets an arithmetic tool.
6. THE NUMERIC-FIDELITY MIDDLEWARE. Any number in a completion that is not in that
   call's tool results and not carrying a calc_id fails the response. Test it
   ADVERSARIALLY - prompt the model to invent a figure, assert rejection.
   Build-breaking.
7. Pseudonymisation (TP-0447), full agent logging.
8. Security: OIDC; RBAC at the QUERY layer with a mandatory jurisdiction predicate;
   out-of-scope GSTIN returns 404 not 403. Field-level encryption for PAN/bank/
   mobile/email, masked by default, reveal logged.
9. Coming-soon modules as real routed screens per docs/03 §7; APIs return 501 with
   roadmap_ref and the list of parameters each unlocks. NO FABRICATED DATA.
10. Synthetic dataset + `make demo`.
11. Load test 50k × 12 periods. Accessibility audit. Observability. Runbook.
    Officer manual (en + mr) and the rule/parameter handbook for the law officer.
```

**Gate.** Numeric slots cannot be edited (422 via the API). Self-approval rejected.
DIN verifies on the public page. Approved PDF hash in the chain; chain verifies.
**The adversarial agent test passes** - the model is prompted to invent a figure and
the response is rejected. Agent prompts contain no GSTIN, PAN or trade name. An
out-of-scope GSTIN returns 404. Grep coming-soon surfaces for fabricated data: zero
results. 50k × 12 periods completes in under an hour. Axe reports zero critical or
serious violations. A snapshot exports, imports clean and replays byte-identical.

---

## SYNTHETIC DATASET

Twelve taxpayers, FY 2025-26 (straddling the 22-Sep-2025 rate boundary, inside the
post-hard-lock regime), plus one FY 2022-23 taxpayer for the pre-lock regime and the
three-year bar. Checksum-valid but synthetic GSTINs, state code 27, fictional names.
Workbooks generated to look like **real portal exports**: title block, merged two-row
header, blank spacer columns, trailing total rows, inconsistent date formats between
sheets, one sheet with Marathi headers.

| # | Profile | Fires |
|---|---|---|
| 1 | Clean manufacturer, ₹48 cr | **Nothing.** The control. A platform that cannot show a clean taxpayer cannot be trusted on a dirty one |
| 2 | Trader ₹22 cr | OUT-01 below the 88C threshold (→ ASMT-10, not DRC-01B), OUT-02, BEH-01, P09, P11 |
| 3 | Works contract ₹65 cr | ITC-01 above threshold (→ DRC-01C), ITC-07, SEC-01, P14, P18, P19 |
| 4 | Exporter ₹31 cr | OUT-04, SEC-04 (LUT expired), P04, P21, P23 |
| 5 | Trader ₹18 cr | ITC-02 Rule 37A (14 suppliers, ₹38.42 L), ITC-05, P14 |
| 6 | GTA ₹9 cr | EWB-04, EWB-05, EWB-08, P05, P16 |
| 7 | B2C retail ₹27 cr | OUT-12, OUT-19, EIN-01, P08, P31 |
| 8 | Manufacturer ₹120 cr | EIN-02 (317 late IRNs), OUT-07 (28% post-GST-2.0), PAY-01, **P07 at Flag 4** |
| 9 | Shell ₹14 cr | REG-02, ITC-06, ITC-22, REG-03, P24, P12 |
| 10 | Shell ₹16 cr | NET-02 cycle with #9 and #11, NET-05, REG-04, P24 |
| 11 | Shell ₹11 cr | NET-02 same cycle, REG-06, ITC-17, P24 |
| 12 | FY 2022-23 non-filer ₹7 cr | REG-07 barred, BEH-02, BEH-08, pre-lock OUT-01, P12 |

Ship `expected_findings.json` with the asserted flags, findings, head-wise deltas and
both scores. `tests/test_demo_dataset.py` runs the pipeline and asserts it exactly -
**money compared as strings, to the paisa**, never with a float tolerance. A tolerance
here would hide precisely the class of bug the architecture exists to prevent.

> **Before the first real demo, ingest at least three genuine (anonymised) departmental
> workbooks.** Synthetic data makes an engine look infallible because the generator and
> the engine share assumptions. The gap between what the synthetic set catches and what
> real files do is the distance between a convincing pilot and a system that survives
> its first week.

---

## THE DEMO TEST

Not automatable, and more important than everything above.

1. Open the Dashboard. Point at **Revenue at risk**.
2. Click it. Land in D4. Click a **CERTAIN** confidence bar.
3. Land on the taxpayer list. Open one.
4. Open **Risk Profile** - read the P07 flag ladder and its action point aloud.
5. Open **Findings** - open ITC-02.
6. Click `◉ calc`. Read the formula, the parameters with their notification
   references, and the source rows. Then open the source workbook and find that row.

**Under ninety seconds, from a Commissioner's portfolio number to a cell in a
spreadsheet.** If that path works, the platform gets adopted. If it breaks anywhere,
fix it before you fix anything else - no chart, no model and no agent compensates for
a number an officer cannot trace.
