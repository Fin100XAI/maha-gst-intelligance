# GAP — this repository against the v3 build pack

Measured 2026-09-22, by running the checks rather than reading the code. Read
this before starting a phase.

This is not a greenfield build. A working v2 platform exists: it ingests nine
real filed workbooks, runs 34 parameters and 57 rules over them, computes both
scores, and the drill path works end to end. v3 keeps the parameters and
replaces almost everything else around them.

**The acceptance fixture is already in the database.** `docs/06` and `docs/07`
dissect SSR Marine, `27AAPCS8928R1Z1`, which is one of the nine ingested
workbooks. Every claim below marked *verified* was checked against it.

---

## Present and correct

| v3 requirement | Where |
|---|---|
| 34 audit parameters P01–P34 | `app/engine/params_p01_p34.py` |
| P-Score with coverage, F-Score, never fused | `app/engine/scoring.py` |
| Cohort fallback below `min_cohort` | `app/engine/peers.py` |
| `calc_id` as a deterministic hash, not a UUID | `app/engine/trace.py` |
| Effective-dated parameters resolved at the tax period | `app/engine/params.py` |
| Ledger movements at daily grain | `ledger_movement.as_on` |
| EXTERNAL parameters excluded from both sides of the score | verified: coverage reads 4/34 on real data |
| Rows reconcile: in = parsed + held + duplicates | verified on all nine workbooks |
| Money `NUMERIC(18,2)`, no float under the engine | gates G1, G2 |
| Hash-chained audit log | `app/audit/chain.py` |

## Closed this session

| Item | Evidence |
|---|---|
| **GSTIN position 14 accepts `[ZDC]`** — Phase 0 gate, was failing | 12 held rows recovered on real data, including IWAI's own deductor registration `09AAATI7021F1D5`, which `docs/07` Finding 1 needs for its corroboration limb |
| **Mixed-type date-transposition detector** | `app/ingestion/transposition.py`. On the real IRN Date column: 1,408 strings days 13–31, 635 datetimes days 1–12, verdict `CERTAIN`. Naive read gives 314 negative lags and 250 Rule 48(4) breaches; corrected gives **0 and 0**. `docs/07` C1 says 314→0 and 250→0. Reproduced to the row. |

## Absent — the v3 build, in the pack's own phase order

| # | Requirement | Phase | Notes |
|---|---|---|---|
| 1 | **`I-01`–`I-10` post-coercion invariants** | 1 | Law 4. No module exists. A row failing one must be quarantined and invisible to every rule (gate G11). |
| 2 | **Transposition detector wired into the pipeline** | 1 | The detector is built and proven; nothing calls it yet. See the note below on `irn_date`. |
| 3 | **`NIL_BY_IDENTITY` coverage state** | 1 | Only absent/empty are distinguished today. The third state is what lets R1 run on a GSTR-1 with genuinely nil sections instead of abstaining. |
| 4 | **`app/matching/` — 21 named joins, L1–L5 key ladder, four buckets** | 2 | Does not exist. The pack calls matching the product, and every material finding in `docs/07` came from a join. **Do not compress this phase.** |
| 5 | **`X-01`–`X-12` self-contradiction family** | 3 | Does not exist. Worth ₹1.91 crore on the fixture, more than every other finding combined. The pack says build it first. |
| 6 | **Tier model AUTO / ASSISTED / MANUAL / CASE** | 3 | The registry has no tier concept. Only `AUTO` may emit a rupee finding. |
| 7 | **The 141-check A–L matrix** | 3–4 | 57 rules exist in the v2 ID space (`OUT`/`ITC`/`PAY`/`BEH`/`EWB`/`NET`/`REG`/`SEC`/`EIN`). The pack supersedes them with the department's own IDs and calls duplicate ID spaces a maintenance trap. This is a migration, not an addition. |
| 8 | **Exemption engine** | 3 | Rule 86B without clause (d) of its first proviso produced a confident wrong demand on the fixture. |
| 9 | **Multi-period netting** | 3 | April under-claim ₹22.67 L against May over-claim ₹22.01 L is one event; a single-period engine raises ₹22 L and loses it. |
| 10 | **Per-filing scorecard + separate annual roll-up** | 4 | The officer's unit of work is a filing. Today the engine is per taxpayer per FY. |
| 11 | **Applicability grid → `NOT_APPLICABLE`** | 4 | A non-applicable check is not `CLEAR`. |
| 12 | **Module K case engine** | 4 | Section by FY, limitation clocks, penalty by payment stage, s.128A, COVID extension as `LITIGATION_UNCERTAIN`. |
| 13 | **Screen count** | 5 | v3 wants 5 dashboard + 5 workbench. Today: 9 + 9. W1 Scorecard Grid, W2 Match Workbench and W4 Call Book do not exist. |
| 14 | **Numeric-fidelity middleware** | 6 | Gate G10, build-breaking, tested adversarially. |

---

## Two things the pack assumes that are not true here

**`irn_date` is not ingested.** 2,783 of 10,145 outward lines carry an IRN
*number*, but no synonym maps the IRN *date*, so the column is dropped at the
mapping stage. Two consequences, and they pull in opposite directions:

* the platform cannot currently produce the 250 false Rule 48(4) notices,
  because it never reads the column; and
* it cannot run `G-03` or `G-04` either.

So the transposition detector is pre-emptive rather than corrective today. It
becomes load-bearing the moment `irn_date` is mapped, which `G-04` requires —
and the mapping must not land before the detector is wired, or the 250 arrive
with it.

**The 57 rules are not a subset of the 141.** The CHANGELOG describes the v2
catalogue as superseded, but it was written for a greenfield build. Here the
57 are live, tested, and producing the findings on nine real workbooks. They
cannot be deleted and re-derived in one step without losing coverage the
department can currently see. The migration wants its own decision: map each
of the 57 onto its A–L identity, keep the tests, retire the old ID. That is
recorded as an open question rather than assumed.

---

## Suggested order

The pack's order, with one deviation argued below:

1. **Phase 1 remainder** — invariants `I-01`–`I-10`, wire the transposition
   detector, `NIL_BY_IDENTITY`. Small, and everything downstream is wrong
   without them.
2. **Phase 2** — `app/matching/`, all 21 joins. The pack is explicit that this
   cannot be retrofitted.
3. **`J04` → `B-04` Rule 37A first**, before the rest of Phase 3. One join, one
   column, ₹95.80 lakh on the fixture, `CERTAIN` confidence, nothing asked of
   the taxpayer. The pack calls it the highest yield per hour of engineering,
   and it is verifiable against `docs/07` Finding 2 the day it is written.
4. **`J21` → `X-01`/`X-05`** — ₹1.91 crore, and the reason the X family exists.
5. Then the tier model, the A–L migration, the scorecard, module K, the screens.

**The deviation:** the pack says build the whole X family first. `J04`/`B-04`
is one join ahead of it because it is `CERTAIN` rather than `STRONG`, needs no
exemption engine, and its deadline is live — the fixture's Rule 37A reversal
window closes 30 November 2026. X-01 is worth more and should follow
immediately, but it routes to ASMT-10 for a contract, not to a demand.
