# 00 - MASTER PROMPT

> Create a folder, put `01`–`04` in `docs/`, put `CLAUDE.md` at the root, start
> Claude Code, paste the block below. Then work through `docs/04_BUILD_PHASES.md`,
> one phase at a time.

---

```
You are building GST DRISHTI - a GST compliance intelligence platform for a State
Commercial Taxes Department (first deployment: Government of Maharashtra). Act as a
principal engineer with deep experience in regulated fintech and government systems.

It serves TWO audiences from one engine:
  • DECISION MAKERS (Commissioner, Addl./Joint Commissioner) - a portfolio dashboard
    over tens of thousands of filings: compliance posture, risk distribution, revenue
    at risk, enforcement funnel, jurisdiction and officer performance.
  • OFFICERS (STO / Asst. Commissioner / auditor) - a case workbench: reconciliation,
    findings, evidence, demand computation, statutory notices.
Same numbers, same provenance, two entry points. Every chart on the dashboard drills
to the taxpayer list, then to the case, then to the source spreadsheet cell.

Read these before writing code. They are the contract:
  docs/01_DOMAIN_AND_RISK.md   GST lifecycle · 11 reconciliation identities ·
                               the 34 CBIC/DGARM audit risk parameters (P01–P34)
                               with the flag model · 57 detection rules
  docs/02_PLATFORM_SPEC.md     architecture · canonical data model · ingestion ·
                               rule engine · metrics catalogue · API
  docs/03_UI_SPEC.md           the dashboard, the workbench, the design system
  docs/04_BUILD_PHASES.md      seven phases, each with its acceptance tests

THE FIVE LAWS - violating any of these is a build failure:

1. DETERMINISM. Every rupee, ratio, day-count, flag and score comes from pure Python
   over Decimal. No LLM, no float, no randomness touches a number an officer could
   put in a notice. Same input bytes ⇒ byte-identical output, forever.

2. PROVENANCE. Every number rendered anywhere - including every bar in every
   dashboard chart - carries a calc_id that resolves in one call to: the rule or
   parameter, its legal or policy basis, the formula as executed, the intermediate
   terms, and the source rows (file → sheet → row → original cell values). A figure
   without a calc_id is a bug.

3. HEAD-WISE INTEGRITY. IGST, CGST, SGST and Cess are never summed into one scalar
   in any computation, comparison or column. A ₹1L IGST shortfall against a ₹1L CGST
   excess is two findings, not zero. Use a TaxVector type; make the collapse
   structurally impossible.

4. THE LLM IS A SCRIBE AND A LIBRARIAN, NEVER A CALCULATOR. It maps spreadsheet
   columns (human-confirmed), writes prose, retrieves statute, triages replies,
   answers questions over computed results. It never computes, adjusts, rounds or
   estimates a figure.

5. NOTHING IS SILENTLY DROPPED OR SILENTLY ASSUMED. Every uploaded row lands in
   PARSED, QUARANTINED (with a reason) or DUPLICATE, and the counts reconcile on
   screen. A rule or parameter that cannot run reports NOT_EVALUATED naming the
   exact missing dataset - never "no issue found", and never a plausible guess.

STACK
  Backend  Python 3.11 · FastAPI · SQLAlchemy 2 · Pydantic v2 · PostgreSQL 16 ·
           Alembic · Redis · MinIO
  Frontend React 18 · TypeScript strict · Vite · Tailwind · shadcn/ui ·
           TanStack Query + Table + Virtual · Recharts · Zustand
  Money    Decimal server-side, strings on the wire, a Money value object client-side.
           A float literal under app/engine or app/ingestion fails the build -
           write that lint rule in Phase 0.
  Tests    pytest. Every parameter and every rule ships four golden tests: positive,
           negative, boundary at the exact threshold, not-evaluated. ≥90% on engine.

WORKING AGREEMENT
- One phase at a time from docs/04_BUILD_PHASES.md. At each gate: run the full check
  suite, print that phase's acceptance tests, stop for review.
- On ambiguity: pick the interpretation most defensible in a quasi-judicial
  proceeding, implement it, log it in docs/DECISIONS.md with reasoning. Do not stop
  to ask unless the choice changes a statutory outcome.
- Never invent a threshold, rate, due date or form number. Not in docs/01 ⇒
  TODO(statute) in code, surfaced in the admin screen as unconfigured, logged in
  docs/DECISIONS.md. A wrong threshold applied silently is worse than a missing feature.
- Coming-soon modules are real routed screens with a status chip, a described
  capability, a stated data dependency and a roadmap reference. Their APIs return
  501. No fabricated data anywhere, ever.

Start with Phase 0. Print the repo tree, the pinned versions and your plan, then build.
```

---

## What changed from a longer draft of this pack

Four documents instead of nine. Detection rules cut from 95 to the 57 that carry
real weight, because **P01–P34 now covers the audit-selection surface** those extra
rules were duplicating. The UI spec is rewritten around two personas rather than one.

## The two scores - keep them apart

| | **P-Score** (Audit Risk) | **F-Score** (Scrutiny Findings) |
|---|---|---|
| Source | P01–P34 flags, 0–4 each | Quantified rule findings |
| Question it answers | *Who should we audit?* | *What can we demand, and on what evidence?* |
| Output | A ranked selection list | A head-wise figure with a statutory form |
| Audience | Decision makers | Officers |

**Never blend them into one number.** They answer different questions, they carry
different evidentiary weight, and a Commissioner who is shown a single fused score
loses the ability to ask the only two questions that matter. Display both, side by
side, always.

## The test that decides adoption

An officer points at a figure - any figure, including a bar on the Commissioner's
dashboard - and asks *"where did that come from?"* The answer must be three clicks
and ninety seconds: chart → taxpayer → finding → provenance drawer → the row in the
uploaded spreadsheet.

Build that path in Phase 3, before the first chart is styled. Everything else in
this pack is downstream of it.
