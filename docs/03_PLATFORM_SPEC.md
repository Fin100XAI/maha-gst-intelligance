# 03 — PLATFORM SPEC
### Architecture · data model · engine · API

## 1. Shape

```
┌────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION  React 18 · TS strict · Vite · Tailwind · shadcn/ui       │
│               TanStack Query/Table/Virtual · Recharts · Zustand        │
│               DASHBOARD (decision makers) + WORKBENCH (officers)       │
└──────────────────────────────┬─────────────────────────────────────────┘
┌──────────────────────────────▼─────────────────────────────────────────┐
│ API           FastAPI · Pydantic v2 · OIDC · RBAC by jurisdiction      │
├────────────────────────────────────────────────────────────────────────┤
│ INGESTION     classify → locate → bind → map → coerce → INVARIANTS     │
│               → canonicalise → quarantine → snapshot                   │
├────────────────────────────────────────────────────────────────────────┤
│ MATCH ENGINE  21 named joins, key ladder L1–L5, four buckets each      │
├────────────────────────────────────────────────────────────────────────┤
│ RULE ENGINE   34 P-params · 141 A-L checks · 12 X rules                │
│               tiers AUTO / ASSISTED / MANUAL · pure · Decimal · traced  │
├────────────────────────────────────────────────────────────────────────┤
│ SCORECARD     per (gstin, period) + annual roll-up · netting engine    │
├────────────────────────────────────────────────────────────────────────┤
│ CASE ENGINE   module K: section, limitation clocks, penalty, interest  │
├────────────────────────────────────────────────────────────────────────┤
│ AGGREGATION   nightly rollups → portfolio fact tables                  │
├────────────────────────────────────────────────────────────────────────┤
│ NOTICE        ASMT-10 · DRC-01A/01B/01C · maker-checker · DIN          │
├────────────────────────────────────────────────────────────────────────┤
│ AGENTS        3 only: mapper · narrator · copilot. Advisory. Read-only.│
├────────────────────────────────────────────────────────────────────────┤
│ DATA          PostgreSQL 16 · MinIO · Redis · hash-chained audit log   │
└────────────────────────────────────────────────────────────────────────┘
```

Deployment: State Data Centre or NIC, inside the State network. No taxpayer data leaves
Indian soil. The LLM sits behind one `LLMProvider` with a hosted and an on-premise
adapter — a config switch, not a rewrite.

## 2. Repo layout

```
backend/app/
  money.py                 Decimal + TaxVector — read first
  canonical.py             enums · Period · GSTIN validation · records
  ingestion/               sniffer header synonyms coerce invariants quarantine pipeline
  matching/
    keys.py                normalisation + the L1–L5 key ladder
    joins.py               the 21 named joins, each returning a MatchResult
  engine/
    registry.py context.py trace.py params.py netting.py exemptions.py
    params_p01_p34.py      the 34 audit parameters + flag banding + cohort fallback
    rules_x.py             X-01..X-12  ← build first
    rules_a.py … rules_l.py   the A-L matrix by module
    scorecard.py           per-filing scorecard + annual roll-up
    scoring.py             P-Score (+coverage) and F-Score, separate
  cases/                   module K: section, limitation, penalty, interest
  notices/ agents/ aggregation/ api/v1/ audit/ seed/
frontend/src/
  components/  Money · ProvenanceDrawer · FlagLadder · ScorecardGrid ·
               MatchBuckets · ChartCard · StatusChip · LimitationClock
  pages/dashboard/  pages/workbench/
```

## 3. Data model — the additions that matter

Everything from a conventional GST schema, plus:

```
snapshot            id · gstin · fy · content_hash · param_version · upload_ids[]
                    ← the unit of reproducibility; engine runs bind to one

ingest_invariant    snapshot_id · invariant_id (I-01..I-10) · sheet · row
                    · passed · detail · corrected (e.g. date transposition)

match_result        snapshot_id · join_id (J01..J21) · left_count · right_count
                    · matched_l1..l4 · only_left · only_right · value_differs
                    · totals_json · calc_id

param_result        engine_run_id · gstin · fy · param_id · value · flag 0-4
                    · status · banding_strategy · cohort_size · cohort_p50/75/90/97
                    · low_confidence · calc_id · missing_inputs[]

check_result        engine_run_id · gstin · period · check_id (A-01..L-46, X-01..X-12)
                    · tier · status (PASS|FAIL|NOT_EVALUATED|NEEDS_DOCUMENT
                                    |NOT_APPLICABLE|SUPPRESSED)
                    · severity · confidence · dimension
                    · observed_* expected_* delta_* (FOUR columns each: igst/cgst/sgst/cess)
                    · taxable_value_effect · netted_with[] · suppressed_by_exemption
                    · required_document · calc_id · formula_rendered · evidence_ids[]

filing_scorecard    gstin · period · coverage_json · invariant_summary
                    · identity_status_json · period_score · open_documents
                    · unquantified_exposure · engine_run_id

ledger_movement     gstin · as_on (DAILY) · ledger · head · opening · credited
                    · debited · closing      ← X-11 needs daily, not period-end

rule_parameter      id · key · value · effective_from · effective_to
                    · notification_ref · approved_by · litigation_uncertain

case                gstin · fy · check_ids[] · section_applied · nature
                    · demand_* (head-wise) · interest · penalty_pct · penalty
                    · ar_due_date · scn_deadline · order_deadline · days_left
                    · s128a_eligible · covid_extension_applied
```

Money columns are `NUMERIC(18,2)`; a migration test fails the build on any
floating-point column matching `igst|cgst|sgst|cess|value|amount`. Four columns per tax
field, never a JSON blob — every rule compares head-wise and every index you need is on
one of those four.

## 4. Engine

```python
class RuleContext:      # immutable · pre-indexed · no I/O · no clock
    gstin; fy; period; window          # window = rolling periods for netting
    regime                             # PRE_HARD_LOCK | POST_HARD_LOCK
    profile                            # incl. industry + client flags for applicability
    outward; inward; returns_3b; ledgers(DAILY); einv; filing
    matches: dict[JoinId, MatchResult] # joins run ONCE, before rules
    coverage                           # ABSENT | PRESENT_EMPTY | NIL_BY_IDENTITY
    peers                              # cohort bands + cohort_size (may be < min_cohort)
    params                             # params.get(id, key, on=period) — period-aware
    exemptions                         # testable exemptions resolved per rule
    trace; as_of                       # as_of injected; date.today() is a build failure
```

Execution order, and it is not negotiable:

```
1 invariants   any failing row is quarantined and invisible to every rule
2 joins        all 21 MatchResults computed once and cached on the context
3 applicability  industry grid × client flags → NOT_APPLICABLE set
4 rules        deterministic ID order; X family first (they seed evidence others cite)
5 exemptions   testable ones suppress; untestable ones downgrade to ADVISORY
6 netting      roll deltas across the window; emit NETTED findings
7 scorecard    per period, then the annual roll-up
8 scoring      P-Score + coverage, F-Score + waterfall, separately
```

`calc_id` is a **deterministic hash** of `check_id + snapshot_id + inputs`, never a
random UUID — replay depends on it. `test_replay.py` runs a snapshot twice and asserts
identical `calc_id`s, flags, findings, scorecards and scores.

Performance: 1 taxpayer × 12 periods × (34 + 141 + 12) < 8 s. Vectorise inside a rule
over integer paise if needed, but convert back to `Decimal` at every boundary and never
let a numpy float reach a result.

## 5. API — additions and changes

Base `/api/v1`. **Money is a string on the wire, always.**

```
INGESTION   POST /uploads · GET /uploads/{id} · POST /uploads/{id}/classify
            GET|POST /uploads/{id}/mapping · POST /uploads/{id}/commit
            GET /uploads/{id}/report        ← rows_in reconciliation + invariant summary
                                              + any date-transposition corrections applied
            GET /uploads/{id}/quarantine · POST /uploads/{id}/quarantine/replay
            POST /snapshots · GET /snapshots/{id}/coverage

MATCHING    GET /match/{snapshot}/joins                  all 21, with bucket counts
            GET /match/{snapshot}/{join_id}?bucket=      matched|only_left|only_right|
                                                         value_differs  (+ ?format=xlsx)
            GET /match/{snapshot}/{join_id}/pair/{id}    both source rows side by side

SCORECARD   GET /scorecard/{gstin}/{fy}                  the 12 × N grid
            GET /scorecard/{gstin}/{period}              one filing, every check
            GET /scorecard/{gstin}/{fy}/annual           the FY-level roll-up

PARAMETERS  GET /parameters/{gstin}/{fy}                 34 rows: value, flag, cohort,
                                                         cohort_size, action point, calc_id
CHECKS      GET /checks · GET /checks/{id}               the live catalogue with tiers
            GET /findings?tier=AUTO&status=FAIL
            GET /documents-required?gstin=&fy=           the ASSISTED call-book
            POST /findings/{id}/disposition

PROVENANCE  GET /calc/{calc_id}                          build before any chart

CASE        POST /cases · POST /cases/{id}/classify      module K: section, limitation,
                                                         penalty, interest, s.128A
NOTICES     ASMT-10 · DRC-01A · DRC-01B · DRC-01C only
DASHBOARD   /dashboard/{overview|filing|risk|parameters|funnel|drill}
AGENTS      /agents/{column-mapper|narrator|copilot} · GET /agents/log
ADMIN       /admin/{parameters|rate-master|applicability|users|audit|health}
```

Coming-soon integrations return `501` with a `roadmap_ref` and the list of parameters
each unlocks. No fabricated data anywhere.

## 6. Agents — three, all advisory

**Column Mapper** proposes ingestion mappings for unresolved columns; every accepted
mapping is written back to the synonym lexicon, so the deterministic layer improves and
the agent is called less. Track that call rate — it should fall monthly.
**Narrator** turns findings into prose for the officer.
**Copilot** answers questions over computed results, read-only.

Four enforcement layers: no agent has an arithmetic tool · a **numeric-fidelity
middleware** rejects any completion containing a number absent from that call's tool
results and lacking a `calc_id` (build-breaking, tested adversarially) · notice
templates slot numerics the model never sees · every rendered figure carries its
`calc_id`. Prompts carry `TP-0447`, never a GSTIN or trade name.

## 7. Security

OIDC against the State SSO. **RBAC at the query layer** with a mandatory jurisdiction
predicate — an out-of-scope GSTIN returns **404, not 403**, because 403 leaks existence.
Maker-checker on every notice, rejected at the API. DIN per CBIC Circular 122/41/2019.
Field-level encryption for PAN, bank, mobile, email; masked by default, every reveal
logged. Hash-chained append-only audit over every read of taxpayer data, every parameter
change, every notice action and every agent call. The approved PDF's hash enters the
chain at approval, so the department can prove the document served is the document
approved.
