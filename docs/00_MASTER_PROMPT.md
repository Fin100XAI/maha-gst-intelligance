# 00 — MASTER PROMPT

> Create a folder, put `01`–`07` and `CHANGELOG.md` in `docs/`, `CLAUDE.md` at the root,
> start Claude Code, paste the block below. Then work through `docs/05_BUILD_PHASES.md`,
> one phase at a time.

---

```
You are building GST DRISHTI — a GST scrutiny, reconciliation and fraud-detection
platform for a State Commercial Taxes Department (first deployment: Government of
Maharashtra). Act as a principal engineer with deep experience in regulated fintech and
government systems.

WHAT IT DOES
Excel returns in → sniffed, coerced, invariant-checked, canonicalised → 21 named
cross-sheet joins → 34 audit risk parameters (P01–P34), 141 departmental scrutiny checks
(modules A–L) and 12 self-contradiction rules (X-01–X-12) → a scorecard per filing → a
case with a limitation clock → a statutory notice with maker-checker approval.

TWO AUDIENCES, ONE ENGINE
  • DECISION MAKERS — a portfolio dashboard: compliance posture, P-Score distribution,
    revenue at risk, enforcement funnel.
  • OFFICERS — a workbench: the filing scorecard grid, the match workbench, the flag
    ladders, the call book, the case file.
Same numbers, same provenance. Every chart drills to the taxpayer, the filing, the
matched pair, and the source spreadsheet cell.

READ BEFORE WRITING CODE — these are the contract:
  docs/01_RULEBOOK.md               tiers · P01–P34 · X-01–X-12 · the 141 A–L checks · scoring
  docs/02_INGESTION_AND_MATCHING.md coercion · the 10 invariants · the 21 joins · the scorecard
  docs/03_PLATFORM_SPEC.md          architecture · data model · engine order · API
  docs/04_UI_SPEC.md                dashboard · workbench · design system
  docs/05_BUILD_PHASES.md           eight phases, each with its gate
  docs/06_WORKBOOK_ANATOMY.md       a real 29-sheet GSP export, dissected — fixture #1
  docs/07_WORKED_SCRUTINY_CASE.md   the findings that fixture must reproduce, to the paisa
  docs/CHANGELOG.md                 what was cut and why — do not rebuild it

THE SEVEN LAWS — violating any is a build failure:

1. DETERMINISM. Every rupee, ratio, day-count, flag and score comes from pure Python
   over Decimal. No LLM, no float, no randomness. Same input bytes ⇒ byte-identical
   output, forever.

2. PROVENANCE. Every number anywhere — including every bar on the Commissioner's
   dashboard — carries a calc_id resolving in one call to the check, its legal basis,
   the formula as executed, the intermediate terms, the matched pair, and the source
   rows. A figure without a calc_id is a bug.

3. HEAD-WISE INTEGRITY. IGST, CGST, SGST and Cess are never summed into one scalar. A
   ₹1L IGST shortfall against a ₹1L CGST excess is two findings, not zero. Use a
   TaxVector; make the collapse structurally impossible.

4. INVARIANTS BEFORE RULES. The ten invariants in docs/02 §A3 run first. A row that
   fails one is quarantined and is invisible to every rule. An acknowledgement date
   earlier than its document date never becomes a finding — reading one real column
   naively manufactured 250 fabricated notices.

5. TIER HONESTY. A check declares AUTO, ASSISTED, MANUAL or CASE. Only AUTO emits a
   rupee finding. ASSISTED emits a document call naming the document it needs. MANUAL
   emits a checklist item and no number. Never let a tier promote itself.

6. PROVISOS ARE PART OF THE RULE. Implement every exemption. Testable ones suppress the
   finding visibly; untestable ones downgrade it to ADVISORY with an officer prompt.
   Rule 86B without clause (d) of its first proviso produced a confident wrong demand
   on real data.

7. NOTHING SILENTLY DROPPED OR SILENTLY ASSUMED. Every row lands in PARSED, QUARANTINED
   (with a reason) or DUPLICATE, and the counts reconcile on screen. A check that cannot
   run reports NOT_EVALUATED naming the exact missing dataset — never "no issue found",
   never a default of zero, never a guess.

TWO SCORES, NEVER FUSED
  P-Score (P01–P34, with COVERAGE always displayed beside it) answers *who to audit*.
  F-Score (AUTO findings) answers *what to demand and on what evidence*.
  Different questions, different evidentiary weight. Side by side, always.

STACK
  Python 3.11 · FastAPI · SQLAlchemy 2 · Pydantic v2 · PostgreSQL 16 · Alembic · Redis · MinIO
  React 18 · TS strict · Vite · Tailwind · shadcn/ui · TanStack Query/Table/Virtual ·
  Recharts · Zustand
  Decimal server-side, strings on the wire. A float literal under app/engine,
  app/matching or app/ingestion fails the build — write that lint rule in Phase 0.
  Every check ships four golden tests: positive, negative, boundary AT the exact
  threshold, not-evaluated.

WORKING AGREEMENT
- One phase at a time. At each gate: full check suite, print that phase's acceptance
  tests, stop for review.
- On ambiguity: pick the reading most defensible in a quasi-judicial proceeding,
  implement it, log it in docs/DECISIONS.md. Do not stop to ask unless the choice
  changes a statutory outcome.
- Never invent a threshold, rate, due date or form number. Not in docs/01 ⇒
  TODO(statute), surfaced in admin as unconfigured, logged in DECISIONS.md.
- Build order inside Phase 3 is X family first. It found more money on the real file
  than every other check combined.

Start with Phase 0. Print the repo tree, the pinned versions and your plan, then build.
```

---

## The shape of the thing

```
34 audit parameters  ──┐
141 A–L checks       ──┼──► one engine ──► per-filing scorecard ──► case ──► notice
12 X-family rules    ──┘         ▲
                                 │
      21 named joins ────────────┤
      10 invariants  ────────────┘
```

## The test that decides adoption

An officer points at any figure — a bar on the Commissioner's dashboard included — and
asks *"where did that come from?"* The answer is ninety seconds: chart → taxpayer →
scorecard cell → check card → provenance drawer → the matched pair → the row in the
uploaded spreadsheet.

Build that path in Phase 2, before the first chart is styled. Everything else is
downstream of it.
