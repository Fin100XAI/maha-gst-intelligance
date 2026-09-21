# 02 — PLATFORM SPEC
### Architecture · data model · ingestion · engine · metrics · API

## 1. Shape

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION   React 18 · TS strict · Vite · Tailwind · shadcn/ui       │
│                TanStack Query/Table/Virtual · Recharts · Zustand        │
│                two entry surfaces: DASHBOARD (decision makers)          │
│                                    WORKBENCH (officers)                 │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ REST + SSE
┌──────────────────────────────▼──────────────────────────────────────────┐
│ API          FastAPI · Pydantic v2 · OIDC · RBAC scoped by jurisdiction │
├─────────────────────────────────────────────────────────────────────────┤
│ INGESTION    sniff → header → map → coerce → validate → canonicalise    │
│              → quarantine → immutable snapshot                          │
├─────────────────────────────────────────────────────────────────────────┤
│ ENGINE       P01–P34 flag evaluator  +  57 detection rules              │
│              pure functions · Decimal only · replayable · traced        │
├─────────────────────────────────────────────────────────────────────────┤
│ AGGREGATION  nightly rollup into portfolio fact tables — this is what   │
│              makes a 50k-taxpayer dashboard load in 400 ms              │
├─────────────────────────────────────────────────────────────────────────┤
│ CASE & NOTICE  lifecycle · limitation clocks · slot-filled statutory    │
│                forms · maker-checker · DIN · service log                │
├─────────────────────────────────────────────────────────────────────────┤
│ AGENTS       advisory only · read-only tools · numeric-fidelity gate    │
├─────────────────────────────────────────────────────────────────────────┤
│ DATA         PostgreSQL 16 · MinIO (raw uploads) · Redis (jobs)         │
│              hash-chained append-only audit log                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Deployment:** State Data Centre or NIC/MeghRaj, inside the State network. No
taxpayer data leaves Indian soil. The LLM layer sits behind one `LLMProvider`
interface with a hosted adapter and an on-premise open-weights adapter — assume
procurement eventually mandates on-premise inference, and make that a config change
rather than a rewrite.

## 2. Repo layout

```
gst-drishti/
├── CLAUDE.md · docker-compose.yml · Makefile · docs/
├── backend/app/
│   ├── money.py            Decimal + TaxVector — read this first
│   ├── canonical.py        enums · Period · GSTIN validation · records
│   ├── ingestion/          sniffer header synonyms coerce validators quarantine pipeline
│   ├── engine/
│   │   ├── registry.py context.py trace.py params.py identities.py
│   │   ├── params_p01_p34.py     the 34 audit risk parameters + flag banding
│   │   ├── rules_*.py            57 detection rules by family
│   │   └── scoring.py            P-Score + F-Score, both with waterfalls
│   ├── aggregation/        nightly rollups → portfolio fact tables
│   ├── cases/ notices/ agents/ analytics/ audit/ api/v1/ seed/
└── frontend/src/
    ├── lib/                api money format rbac
    ├── components/         Money · ProvenanceDrawer · KpiTile · FlagLadder ·
    │                       ReconBridge · FindingCard · RiskWaterfall ·
    │                       LimitationClock · DrillTable · ComingSoon
    └── pages/dashboard/    executive surfaces
        pages/workbench/    officer surfaces
```

## 3. Ingestion — the layer that decides whether the platform survives

An officer will upload a portal export, a consultant's working file, or a 40-tab
workbook with merged cells, a logo in row 1 and Marathi headers. **Sniff, don't
demand.**

```
upload → virus scan → store raw bytes (hashed, immutable) → per sheet:
  1 CLASSIFY  score against ReturnType fingerprints (column tokens, value shapes,
              sheet-name hints) → (type, confidence). <0.6 → ask, or route to the
              Ingestion Agent for an advisory proposal
  2 LOCATE    header row = argmax(non_null_ratio × token_match ×
              type_consistency_of_next_5_rows). Forward-fill merged upper rows
  3 MAP       synonym lexicon → normalised edit distance → agent proposal.
              Every mapping is shown before commit
  4 COERCE    money via D() · dates (dd-mm-yyyy, dd/mm/yy, Excel serial, "Jun-2025",
              ISO) · GSTIN (upper, strip, structure + checksum) · HSN (pad 2/4/6/8)
  5 VALIDATE  per-field + cross-field (taxable × rate ≈ tax within ₹1; head vs POS)
  6 CANONICALISE → OutwardLine / InwardLine / Return3B / EWayBill / LedgerEntry
  7 RECONCILE rows_in = parsed + quarantined + duplicates. ASSERT. DISPLAY.
  8 SNAPSHOT  freeze an immutable dataset version with a content hash
```

Non-negotiables for this layer:
- **Never reject a whole workbook** because one sheet is unrecognised.
- **Quarantine carries a reason and the original row**, and replays after a mapping
  fix without re-uploading.
- **Duplicate detection** on `(gstin, period, return_type, doc_no, doc_date,
  counterparty, taxable_value)` — re-uploading the same file is a non-event.
- **Marathi and Hindi column synonyms from day one**, not v2.

## 4. Data model

```
taxpayer          gstin PK · pan · legal_name · trade_name · state_code
                  · registration_type · registration_date · cancellation_date
                  · status · aato · qrmp · einvoice_applicable · sector_code
                  · commissionerate · division · range · officer_id
                  · address_norm_hash · bank_hash · mobile_hash · email_hash

filing_status     gstin · return_type · period · due_date · filing_date · arn
                  · status · days_late · barred_on        UNIQUE(gstin,type,period)

outward_line      snapshot_id · gstin · period · section · doc_type · doc_no
                  · doc_date · counterparty_gstin · pos · rate · taxable_value
                  · igst · cgst · sgst · cess · reverse_charge · hsn · uqc
                  · quantity · ecom_gstin · is_amendment · irn · prov_id

inward_line       snapshot_id · gstin · period · section · doc_no · doc_date
                  · supplier_gstin · pos · rate · taxable_value
                  · igst · cgst · sgst · cess · itc_available
                  · itc_unavailable_reason · supplier_filing_date
                  · supplier_return_period · ims_action · prov_id

return_3b         gstin · period · filing_date · arn
                  · t31a_* t31b_* t31c_* t31d_* t31e_* t311i_* t311ii_* t32_*
                  · t4a1..t4a5 · t4b1 t4b2 · t4d1 t4d2 · t5_inter t5_intra
                  · interest_* · late_fee_* · paid_cash_* · paid_itc_*
                  (every tax field is FOUR columns: igst, cgst, sgst, cess)

ledger_movement   gstin · as_on (DAILY) · ledger · head · opening · credited
                  · debited · closing            ← PAY-03 needs daily, not period-end

eway_bill · einvoice · provenance · snapshot · rule_parameter · engine_run

param_result      engine_run_id · gstin · fy · param_id (P01..P34) · value
                  · flag 0-4 · status · cohort_p50/p75/p90/p97 · calc_id
                  · missing_inputs[]

finding           engine_run_id · gstin · period · rule_id · status · severity
                  · confidence · dimension · observed_* expected_* delta_*
                  (head-wise) · taxable_value_effect · points · calc_id
                  · formula_rendered · evidence_ids[] · suggested_form
                  · suppressed_by · officer_disposition

risk_score        gstin · fy · p_score · p_coverage · p_band
                  · f_score · f_band · dimension_scores · waterfall_json

case              gstin · fy · periods[] · type · status · officer_id
                  · finding_ids[] · demand_igst/cgst/sgst/cess · interest · penalty
                  · section_applied · scn_deadline · order_deadline · days_to_limitation
                  · outcome

notice            case_id · form · din · body_json · pdf_hash · generated_by
                  · approved_by · served_at · reply_due · reply_received_at

audit_log         seq PK · at · actor · action · entity · entity_id
                  · before_hash · after_hash · chain_hash · ip
```

**Money columns are `NUMERIC(18,2)`.** Add a migration test that fails the build if
any column matching `igst|cgst|sgst|cess|value|amount` is floating-point. A demand
that is off by a paisa is a demand competent counsel uses to attack the whole order.

**Four columns per tax field, not a JSON blob** — every rule compares head-wise and
every index you will need is on one of these four.

## 5. Engine

```python
class RuleContext:       # immutable · pre-indexed · no I/O · no clock
    gstin; fy; period; regime          # PRE_HARD_LOCK | POST_HARD_LOCK
    profile; outward; inward; returns_3b; ledgers; ewb; einv; filing
    peers          # cohort percentile bands — drives every RATIO_PEER flag
    graph          # lazy; only NET-* and ITC-16 touch it
    params         # params.get(id, key, on=period) — period-aware, never today
    trace          # trace.step(label, expression, inputs, result)
    as_of          # injected. A rule calling date.today() is a build failure.
```

Execution: resolve `requires` topologically → run in deterministic ID order →
missing dataset ⇒ `NOT_EVALUATED(missing_inputs=[...])` → apply suppressions (§128A,
limitation, accepted prior replies) → score → persist under one `engine_run_id`.

**`calc_id` is a deterministic hash** of `rule_id + snapshot_id + inputs` — never a
random UUID. Replay depends on it. `tests/test_replay.py` runs the same snapshot
twice and asserts identical `calc_id`s, findings, flags and scores. Write it in
Phase 3; it is cheap then and near-impossible to retrofit.

**Performance:** vectorise *inside* a rule over integer paise if you need to, but
convert back to `Decimal` at every boundary and never let a numpy float reach a
`Finding`. Targets: 1 taxpayer × 12 periods × (34 params + 57 rules) < 5 s;
50,000 taxpayers < 1 hour.

## 6. Aggregation — what makes the dashboard fast

A Commissioner's dashboard spans every taxpayer in a commissionerate. Computing that
live is impossible. After each engine run, roll up into fact tables:

```
fact_filing_period     grain: jurisdiction × period × return_type
    expected · filed · on_time · late · not_filed · nil · barred
    · mean_days_late · liability · cash_paid · itc_utilised · turnover

fact_risk_snapshot     grain: jurisdiction × fy × band
    taxpayer_count · p_score_mean · p_coverage_mean · f_score_mean
    · revenue_at_risk · findings_by_family

fact_param_incidence   grain: jurisdiction × fy × param_id × flag
    taxpayer_count · aggregate_value · not_evaluated_count
    ← powers "which of the 34 parameters fire most in my division"

fact_enforcement       grain: jurisdiction × month
    flagged · selected · notices_issued · replies_received
    · demand_raised · demand_confirmed · demand_collected · appeals · sustained

fact_officer           grain: officer × month
    cases_open · cases_closed · mean_age · demand_raised · demand_collected
    · sustain_rate · notices_pending_approval
```

Rebuild nightly; support an on-demand rebuild for a single jurisdiction after an
ad-hoc engine run. **Every fact row carries the `engine_run_id` it was built from**,
so a dashboard figure drills to the exact run, and from there to the finding, and
from there to the spreadsheet cell.

## 7. Metrics catalogue

The dashboard is built from these. Each has an ID, a formula and a grain, and each is
drillable to the taxpayer list behind it.

### Filing compliance
| ID | Metric | Formula |
|---|---|---|
| M-F01 | Filing compliance rate | `filed ÷ expected` |
| M-F02 | On-time filing rate | `on_time ÷ filed` |
| M-F03 | Mean filing delay | `Σ days_late ÷ filed` |
| M-F04 | Non-filer count / share | `not_filed ÷ expected` |
| M-F05 | Nil-filer share | `nil ÷ filed` |
| M-F06 | Periods approaching the 3-year bar | count where `days_to_bar < 180` |
| M-F07 | Periods already barred | count where `days_to_bar < 0` |
| M-F08 | Sequential-filing violations (Rule 59(6)) | count |
| M-F09 | Annual return compliance | `GSTR-9 filed ÷ GSTR-9 liable` |

### Revenue and liability
| ID | Metric | Formula |
|---|---|---|
| M-R01 | Declared turnover | `Σ 3B 3.1(a)+(b)+(c)+(e)` |
| M-R02 | Gross liability | `Σ 3B 6.1 col 2`, head-wise |
| M-R03 | Cash-to-liability ratio | `Σ cash ÷ Σ liability` ← the department's single most watched number |
| M-R04 | ITC utilisation ratio | `Σ ITC utilised ÷ Σ liability` |
| M-R05 | ITC-to-turnover ratio | `Σ 4(A) ÷ Σ turnover` |
| M-R06 | Net revenue growth | YoY on `M-R02` |
| M-R07 | Credit-ledger overhang | `Σ closing credit ÷ mean monthly liability` (months of cover) |
| M-R08 | Effective tax rate | `Σ output tax ÷ Σ taxable value` |
| M-R09 | Exempt / zero-rated / non-GST share | each as a share of turnover |

### Risk
| ID | Metric | Formula |
|---|---|---|
| M-K01 | P-Score distribution | histogram by band |
| M-K02 | Mean P-coverage | `Σ evaluated ÷ (34 × taxpayers)` |
| M-K03 | Flag incidence by parameter | count by `(param_id, flag)` |
| M-K04 | F-Score distribution | histogram by band |
| M-K05 | Revenue at risk | `Σ finding tax_effect` where confidence ∈ {CERTAIN, STRONG} |
| M-K06 | Findings by family | count and value |
| M-K07 | Severe + High share | `(SEVERE + HIGH) ÷ taxpayers` |
| M-K08 | Risk migration | band movement vs the prior quarter |

### Enforcement funnel
| ID | Metric | Formula |
|---|---|---|
| M-E01 | Selection rate | `selected ÷ flagged` |
| M-E02 | Notice issuance rate | `notices ÷ selected` |
| M-E03 | Reply rate | `replies ÷ notices served` |
| M-E04 | Demand raised | head-wise |
| M-E05 | Demand confirmed | `confirmed ÷ raised` |
| M-E06 | Collection efficiency | `collected ÷ confirmed` |
| M-E07 | Cases within 90 days of limitation | count |
| M-E08 | Time-barred cases | count ← the metric nobody wants and everybody needs |
| M-E09 | Appeal sustain rate | `sustained ÷ appealed` |
| M-E10 | Mean case age | days |

### Rule and parameter quality
| ID | Metric | Formula |
|---|---|---|
| M-Q01 | Rule precision | `accepted dispositions ÷ total dispositions`, per rule |
| M-Q02 | Parameter hit rate | `params flagged that led to a confirmed demand ÷ flagged` |
| M-Q03 | False-positive rate | `rejected ÷ total`, per rule |
| M-Q04 | Data coverage | datasets present ÷ datasets expected, per taxpayer |
| M-Q05 | NOT_EVALUATED rate | per rule and per parameter |

**M-Q01 to M-Q03 are the feedback loop that keeps the platform honest.** A rule at 12%
precision needs its threshold revisited, and the Rule Library screen should say so in
words. Without this loop the catalogue silently rots.

## 8. API

Base `/api/v1`. **Every monetary value is a string.** Dates ISO-8601, periods
`MMYYYY`. List endpoints take `?page=&size=&sort=&q=` and return
`{items,total,page,size}`. All dashboard endpoints take
`?jurisdiction=&fy=&period=&sector=&officer=` and honour the caller's RBAC scope.

```
AUTH        POST /auth/login · GET /auth/me · POST /auth/refresh

INGESTION   POST /uploads · GET /uploads/{id} · POST /uploads/{id}/classify
            GET|POST /uploads/{id}/mapping · POST /uploads/{id}/commit
            GET /uploads/{id}/report · GET /uploads/{id}/quarantine
            POST /uploads/{id}/quarantine/replay · GET /jobs/{id}/stream (SSE)
            POST /snapshots · GET /snapshots/{id}/coverage

DASHBOARD   GET /dashboard/overview          KPI strip, all five metric groups
            GET /dashboard/filing            M-F01..F09 by period and jurisdiction
            GET /dashboard/revenue           M-R01..R09 with trends
            GET /dashboard/risk              M-K01..K08, P/F distributions
            GET /dashboard/parameters        M-K03 flag incidence across P01–P34
            GET /dashboard/funnel            M-E01..E10
            GET /dashboard/jurisdictions     ranked table, drillable
            GET /dashboard/officers          M-Q + workload, RBAC-gated
            GET /dashboard/sectors           by HSN sector
            GET /dashboard/drill?metric=&bucket=   → the taxpayer list behind any
                                                     chart element. EVERY chart
                                                     element must resolve here.

ENGINE      POST /engine/run · GET /engine/runs/{id} · GET /engine/rules
            GET /engine/parameters           the P01–P34 definitions and bandings

TAXPAYER    GET /taxpayers · GET /taxpayers/{gstin}
            GET /taxpayers/{gstin}/timeline · /coverage · /limitation · /network
            GET /taxpayers/{gstin}/parameters?fy=   → 34 rows: value, flag, cohort
                                                      percentiles, action point,
                                                      status, calc_id

RECON       GET /recon/{gstin}/{fy}/matrix         12 periods × 11 identities
            GET /recon/{gstin}/{fy}/{identity}?period=   four-bucket matcher
                                                          (+ ?format=xlsx)

FINDINGS    GET /findings · GET /findings/{id} · /evidence
            POST /findings/{id}/disposition · /bulk-disposition

PROVENANCE  GET /calc/{calc_id}    rule/param · basis · formula template ·
                                   formula rendered · steps · parameters with
                                   notification refs · source rows
                                   ← build this before any chart

RISK        GET /risk/{gstin}/{fy} · GET /risk/leaderboard
            GET|PUT /risk/weights   (admin, audited, triggers recompute)

CASES       POST /cases · GET /cases · GET /cases/{id} · PATCH /cases/{id}
            POST /cases/{id}/compute-demand

NOTICES     GET /notices/templates · POST /notices/draft · GET|PATCH /notices/{id}
            POST /notices/{id}/approve  (maker-checker, mints DIN)
            GET /notices/{id}/pdf · POST /notices/{id}/serve · /reply
            GET /notices/{id}/reply/triage

AGENTS      POST /agents/{column-mapper|narrator|notice-narrative|legal-research
                        |reply-triage|copilot} · GET /agents/log

ADMIN       GET|PUT /admin/parameters · /rate-master · /users
            GET /admin/audit · /health

COMING SOON GET /integrations/{gstn|icegate|itd|dgarm|mca|vahan}/status → 501
            { code: "NOT_IMPLEMENTED", roadmap_ref, unlocks: ["P20","P33",...] }
```

Error codes: `VALIDATION_FAILED` · `SHEET_UNRECOGNISED` · `MAPPING_REQUIRED` ·
`RULE_INPUT_MISSING` · `PARAM_NOT_EVALUATED` · `JURISDICTION_DENIED` ·
`APPROVAL_REQUIRED` · `LIMITATION_EXPIRED` · `NOT_IMPLEMENTED`.

## 9. Agents — advisory only

Six agents behind one `LLMProvider`: **Column Mapper** (proposes ingestion mappings,
human-confirmed, and writes accepted mappings back to the synonym lexicon so the
deterministic layer improves and the agent is called less) · **Narrator** (findings →
prose, en/mr/hi) · **Notice Drafter** (the narrative paragraph only; numeric slots
arrive pre-filled as opaque tokens) · **Legal Research** (RAG over Acts, Rules,
notifications, circulars, AAR and case law, chunked with effective dates, retrieved
**as at the period under scrutiny**) · **Reply Triage** (maps reply paragraphs to
findings; the *unaddressed* list is the valuable output) · **Copilot** (read-only
conversational surface over computed results).

Four enforcement layers:
1. **No agent has a tool that performs arithmetic.** There is nothing to misuse.
2. **Numeric-fidelity middleware** scans every completion; any number not present in
   that call's tool results and not carrying a `calc_id` fails the response. Test it
   adversarially — prompt the model to invent a figure and assert rejection. **This
   test is build-breaking.**
3. **Template slotting** — the model never sees numeric slot syntax.
4. **Provenance** — every figure renders as a chip carrying its `calc_id`.

Prompts carry a pseudonymous reference (`TP-0447`), never a GSTIN or trade name; the
reverse mapping stays server-side. Every call is logged with prompt, completion,
tools, tokens, latency, cost, model version, officer and case.

## 10. Security

OIDC against the State SSO. **RBAC enforced at the query layer** with a mandatory
jurisdiction predicate, not in the UI — and an out-of-scope GSTIN returns **404, not
403**, because 403 leaks existence. Roles: Inspector · STO · Asst. Commissioner ·
Deputy/Joint Commissioner · Addl. Commissioner (Enforcement) · Systems Administrator ·
Auditor (read-only) · Analytics (de-identified only).

Maker-checker on every notice, rejected at the API and not merely hidden in the UI.
DIN per CBIC Circular 122/41/2019, verifiable from a public GIGW-compliant page.
Field-level encryption for PAN, bank, mobile and email, masked by default with each
reveal logged. Hash-chained append-only audit covering every read of taxpayer data,
every parameter change, every notice action and every agent invocation. The approved
notice PDF's hash goes into the chain at approval, so the department can prove in an
appellate forum that the document served is the document approved.
