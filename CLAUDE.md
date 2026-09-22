# CLAUDE.md - GST Intelligence
### Repo root. Read every session.

A GST scrutiny, reconciliation and fraud-detection platform for a State Commercial
Taxes Department. One engine, two surfaces: a **Dashboard** for decision makers and a
**Workbench** for officers. Output from this codebase is used to issue statutory notices
that create legal liability. Build accordingly.

## The seven laws

1. **Determinism.** Every rupee, ratio, day-count, flag and score comes from pure Python
   over `Decimal`. No LLM, no float, no randomness. Same bytes in, same bytes out.
2. **Provenance.** Every number - including every dashboard bar - carries a `calc_id`
   resolving to the check, its legal basis, the formula as executed, the matched pair
   and the source rows. A figure without one is a bug.
3. **Head-wise integrity.** IGST/CGST/SGST/Cess never collapse to one scalar. Use
   `TaxVector` and make the collapse structurally impossible.
4. **Invariants before rules.** I-01 to I-10 run first; a failing row is quarantined and
   invisible to every rule.
5. **Tier honesty.** `AUTO` emits a rupee finding. `ASSISTED` emits a document call.
   `MANUAL` emits a checklist item and no number. `CASE` feeds module K. No promotion.
6. **Provisos are part of the rule.** Testable exemptions suppress visibly; untestable
   ones downgrade to `ADVISORY` with an officer prompt.
7. **Nothing silently dropped or assumed.** Every row is `PARSED`, `QUARANTINED` (with a
   reason) or `DUPLICATE`, and the counts reconcile on screen. A check that cannot run
   reports `NOT_EVALUATED` naming the missing dataset - never a zero, never a guess.

## Two scores, never fused

**P-Score** (P01–P34, with **coverage** always beside it) → *who to audit*.
**F-Score** (AUTO findings only) → *what to demand and on what evidence*.

## Catalogues

`P01–P34` audit risk parameters · `A-01…L-46` the 141 departmental checks ·
`X-01…X-12` self-contradiction - **build X first**; it found more money on the real
workbook than every other family combined.

## Hard rules

- `Decimal` server-side, **strings on the wire**, a `Money` object client-side.
- A float literal or `float()` under `app/engine`, `app/matching` or `app/ingestion`
  fails the build. The lint rule exists; do not disable it.
- Money columns are `NUMERIC(18,2)`. Four columns per tax field, never a JSON blob.
- Checks are pure: no I/O, no clock (`as_of` injected - never `date.today()`), no
  randomness, no mutation.
- `calc_id` is a **deterministic hash** of `check_id + snapshot_id + inputs`, never a
  random UUID. Replay depends on it.
- Parameters resolve **as at the tax period under scrutiny**, never as at today.
- Joins run **once**, before rules, and are cached on the context. A rule consumes a
  `MatchResult`; it never re-runs a join.
- Ledger movements are stored at **daily** grain. X-11 needs a running balance.
- Keep the **original** `doc_no` alongside the normalised one - X-02 matches a credit
  note to its invoice by digit containment.
- GSTIN position 14 accepts `[ZDC]` (`D` = §51 deductor, `C` = §52 collector).
- Peer-banded parameters below `min_cohort` fall back to self-history and are badged
  `LOW CONFIDENCE`. Never show a percentile from n < min_cohort.
- EXTERNAL parameters return `NOT_EVALUATED` and are excluded from **both** sides of the
  P-Score, so coverage falls rather than the score understating risk.
- A non-applicable check is `NOT_APPLICABLE`, not `CLEAR`.
- Never invent a threshold, rate, due date or form number. Not in `docs/01` ⇒
  `TODO(statute)`, surfaced in admin, logged in `docs/DECISIONS.md`.
- **Every chart drills.** A `<ChartCard>` without a drill handler fails review.
- One y-axis ever. Status colours are reserved and always ship with an icon and a label.
- Coming-soon screens return `501` with a `roadmap_ref` and the parameters they unlock.
  **No fabricated data, ever.**

## Layout

```
backend/app/money.py           Decimal + TaxVector - read first
backend/app/ingestion/         classify · locate · bind · map · coerce · invariants
backend/app/matching/          keys.py (L1–L5 ladder) · joins.py (J01–J21)
backend/app/engine/rules_x.py  X-01..X-12  ← build first
backend/app/engine/            params_p01_p34 · rules_a..rules_l · netting · exemptions
                               · scorecard · scoring
backend/app/cases/             module K: section · limitation · penalty · interest
frontend/src/components/       Money · ProvenanceDrawer · FlagLadder · ScorecardGrid ·
                               MatchBuckets · ChartCard
docs/                          the v3 spec pack - it is the contract
docs/v2/                       the superseded v2 pack, kept for provenance only
docs/DECISIONS.md              every ambiguity resolved, with reasoning
docs/VERIFICATION.md           what has been run, and what has only been read
```

## Where this repo already stands against the pack

This is not a greenfield build. A v2 platform exists and runs: 34 parameters,
57 rules, ingestion over nine real filed workbooks, both scores, the drill
path. `docs/GAP_V3.md` measures it against this pack, item by item, and is
the thing to read before starting a phase.

**The acceptance fixture is already ingested.** `docs/06` and `docs/07`
dissect SSR Marine, `27AAPCS8928R1Z1` - which is one of the nine real
workbooks in the database. The worked case is therefore checkable against
live data rather than against a fixture somebody wrote to pass.

## Commands

```
make dev   stack up      make test  full suite     make lint  ruff+mypy+eslint
make seed  fixtures      make demo  reset · seed · ingest · run engine · open browser
```

## Working agreement

One phase at a time from `docs/05_BUILD_PHASES.md`. At each gate: full suite, print that
phase's acceptance tests, stop. Every check ships four golden tests - positive,
negative, boundary **at the exact threshold**, not-evaluated. `docs/07` is the primary
acceptance fixture: the engine must reproduce its findings **to the paisa**.

## The test that matters

Ninety seconds from a figure on the Commissioner's dashboard to the row in the uploaded
spreadsheet, through the drill path and the provenance drawer. If it breaks, fix it
before anything else.
