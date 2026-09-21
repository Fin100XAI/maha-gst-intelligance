# CLAUDE.md - GST Intelligence
### Repo root. Claude Code reads this every session.

A GST compliance intelligence platform for a State Commercial Taxes Department.
One engine, two surfaces: a **Dashboard** for decision makers (portfolio scale) and a
**Workbench** for officers (case scale). Output from this codebase is used to issue
statutory notices that create legal liability. Build accordingly.

## The five laws

1. **Determinism.** Every rupee, ratio, day-count, flag and score comes from pure
   Python over `Decimal`. No LLM, no float, no randomness. Same input bytes ⇒
   byte-identical output, forever.
2. **Provenance.** Every number - including every bar on every dashboard chart -
   carries a `calc_id` resolving to the rule or parameter, its basis, the formula as
   executed, the intermediate terms and the source rows. A figure without one is a bug.
3. **Head-wise integrity.** IGST, CGST, SGST and Cess are never summed into one
   scalar. Use `TaxVector`. Make the collapse structurally impossible.
4. **The LLM is a scribe and a librarian, never a calculator.**
5. **Nothing is silently dropped or silently assumed.** Every row lands in `PARSED`,
   `QUARANTINED` (with a reason) or `DUPLICATE`, and the counts reconcile on screen.
   A rule or parameter that cannot run reports `NOT_EVALUATED` naming the missing
   dataset - never "no issue found", never a default of zero.

## Two scores, never fused

**P-Score** (P01–P34 audit risk flags 0–4, with **coverage** always displayed beside
it) answers *who should we audit*. **F-Score** (quantified rule findings) answers
*what can we demand and on what evidence*. Different questions, different evidentiary
weight. Show both, side by side, always.

## Stack

Python 3.11 · FastAPI · SQLAlchemy 2 · Pydantic v2 · PostgreSQL 16 · Alembic · Redis ·
MinIO. React 18 · TS strict · Vite · Tailwind · shadcn/ui · TanStack Query/Table/Virtual ·
Recharts · Zustand.

## Hard rules

- `Decimal` server-side, **strings on the wire**, a `Money` object client-side.
- A float literal or `float()` under `app/engine/` or `app/ingestion/` fails the build.
  The lint rule exists; do not disable it.
- Money columns are `NUMERIC(18,2)`; a migration test enforces it.
- Rules and parameters are pure: no I/O, no clock (`as_of` is injected - never
  `date.today()`), no randomness, no mutation.
- `calc_id` is a **deterministic hash** of `rule_id + snapshot_id + inputs`, never a
  random UUID. Replay depends on it.
- Parameters resolve **as at the tax period under scrutiny**, never as at today.
- EXTERNAL parameters (P02, P15, P20, P23, P25–P28, P33, P34) return `NOT_EVALUATED`
  and are excluded from **both** the numerator and denominator of the P-Score.
  Defaulting one to Flag 0 is the quiet failure that makes a risk score a lie.
- Never invent a threshold, rate, due date or form number. Not in `docs/01` ⇒
  `TODO(statute)`, surfaced in admin as unconfigured, logged in `docs/DECISIONS.md`.
- **Every chart drills.** A `<ChartCard>` without a drill handler fails review.
- One y-axis ever. No dual-axis charts. Status colors are reserved and always ship
  with an icon and a label.
- Coming-soon features are real routed screens with a status chip, a stated data
  dependency, a roadmap ref and the parameters they unlock. APIs return 501.
  **No fabricated data, ever.**
- Every officer action touching taxpayer data is audited to the hash-chained log.

## Layout

```
backend/app/money.py                 Decimal + TaxVector - read first
backend/app/canonical.py             enums · Period · GSTIN validation
backend/app/ingestion/               sniff → header → map → coerce → quarantine
backend/app/engine/params_p01_p34.py the 34 audit risk parameters
backend/app/engine/rules_*.py        57 detection rules
backend/app/engine/scoring.py        P-Score + F-Score, separate
backend/app/aggregation/             nightly rollups → the dashboard's speed
frontend/src/components/             Money · ProvenanceDrawer · FlagLadder ·
                                     ChartCard are the four that matter
frontend/src/pages/dashboard|workbench
docs/                                the spec pack - it is the contract
docs/DECISIONS.md                    every ambiguity resolved, with reasoning
```

## Commands

```
make dev     stack up          make test   full suite
make lint    ruff+mypy+eslint  make seed   synthetic dataset
make demo    reset · seed · ingest · run engine · open browser
```

## Working agreement

One phase at a time from `docs/04_BUILD_PHASES.md`. At each gate: full suite, print
that phase's acceptance tests, stop for review. On ambiguity, pick the reading most
defensible in a quasi-judicial proceeding, implement it, log it in
`docs/DECISIONS.md`. Every parameter and every rule ships four golden tests: positive,
negative, boundary **at the exact threshold**, not-evaluated.

## The test that matters

From a figure on the Commissioner's dashboard to the source cell in a spreadsheet, in
under ninety seconds, through the drill path and the provenance drawer. If that path
breaks, fix it before anything else.
