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

## Closed

| Item | Evidence |
|---|---|
| **GSTIN position 14 accepts `[ZDC]`** — Phase 0 gate, was failing | 12 held rows recovered on real data, including IWAI's own deductor registration `09AAATI7021F1D5`, which `docs/07` Finding 1 needs for its corroboration limb |
| **Mixed-type date-transposition detector** | `app/ingestion/transposition.py`. On the real IRN Date column: 1,408 strings days 13–31, 635 datetimes days 1–12, verdict `CERTAIN`. Naive read gives 314 negative lags and 250 Rule 48(4) breaches; corrected gives **0 and 0**. `docs/07` C1 says 314→0 and 250→0. Reproduced to the row. |

## Absent — the v3 build, in the pack's own phase order

Updated 2026-09-22 after the second build session.

| # | Requirement | Phase | State |
|---|---|---|---|
| 1 | `I-01`–`I-10` post-coercion invariants | 1 | **Built** — `app/ingestion/invariants.py`, 26 tests |
| 2 | Transposition detector wired into the pipeline | 1 | **Done.** Runs over whole date columns before coercion. 1,832 cells corrected on the reference workbook across six sheets; negative lags 314 -> 0, own-document Rule 48(4) breaches 250 -> 0. `irn_date` now mapped (migration 0007), so `G-03`/`G-04` are computable |
| 3 | `NIL_BY_IDENTITY` coverage state | 1 | **Done.** `app/engine/coverage.py`, computed per GSTR-1 section and per dataset, wired into the runner so every taxpayer gets twelve scorecards. On the reference taxpayer eight of twelve months reconcile to 3B table 3.1 exactly and four do not. D-0083 |
| 4 | `app/matching/` — L1–L5 ladder | 2 | **Built** — `keys.py`, 22 tests |
| 5 | The 21 named joins | 2 | **Join phase built.** `RuleContext.joins` runs all 21 once and caches them; adapters exist for **J03, J04, J07, J17** and the other 18 report their missing sheet by name. First run on the reference workbook: J03 pairs 4,404 of 4,500 at L1 with 125 documents in 2A and not in 2B; J04 finds 8 defaulting invoices with no 2B counterpart; all three reconcile. J07 does not yet implement digit containment, so X-02 still matches directly (D-0090) |
| 6 | `X-01`–`X-12` self-contradiction | 3 | **Complete — all twelve registered.** X-01 reproduces `docs/07` Finding 1 to the paisa and X-02 its credit-note limb; X-03/04/07/08 are ASSISTED; X-05 is X-01's complement by construction; X-12 became possible once sections resolved. **Five are dark and each names its sheet — four of the five want GSTR-1 Table 12**, which is now a measured argument for what to ingest next (D-0094) |
| 6b | `B-04` Rule 37A | 3 | **Built.** Reproduces `docs/07` Finding 2 exactly: Rs 95,79,967.02 on B2B, 29 suppliers, SSR Shipyard Rs 77,99,266.80. Needed migration 0006 for `supplier_3b_filed` |
| 7 | Tier model AUTO/ASSISTED/MANUAL/CASE | 3 | **Built and enforced** — `RuleSpec.tier`, and the runner refuses a triggered `Finding` from a non-AUTO check. X-03 and X-04 are the first two ASSISTED checks. D-0084 |
| 8 | Exemption engine | 3 | **Built** — `app/engine/exemptions.py`, Rule 86B clause (d) testable |
| 9 | Multi-period netting | 3 | **Built** — `app/engine/netting.py`, 10 tests |
| 10 | Per-filing scorecard + annual roll-up | 4 | **Built and wired** — `app/engine/scorecard.py`; the runner now returns `scorecards` and `annual` on every `TaxpayerOutcome` |
| 11 | Module K case engine | 4 | **Already present** — `app/cases/limitation.py` implements s.73/74 to FY 2023-24 and s.74A from FY 2024-25 with the 42-month rule. Verified |
| 12 | The 141-check A–L matrix | 3–4 | **Not started.** 57 rules exist in the v2 ID space. This is the open migration below |
| 13 | Applicability grid → `NOT_APPLICABLE` | 4 | Modelled in the scorecard; the grid itself is not loaded |
| 14 | Screen count 5 + 5, W1 grid, W2 match workbench, W4 call book | 5 | **Not started** |
| 15 | Numeric-fidelity middleware | 6 | **Already present** — `app/agents/fidelity.py` |

---

## Two things the pack assumes that are not true here

**~~`irn_date` is not ingested.~~ Closed 2026-09-23.** It is mapped now, and
in the order this section demanded: the detector was wired into the pipeline
first, then the column landed (migration 0007). Mapping it first would have
shipped the capability and the 250 false notices together.

Measured after wiring, on the reference workbook: 1,832 cells corrected across
six sheets, all `CERTAIN`; 5,954 lines carry an IRN date; **zero** are
acknowledged before their own invoice and **zero** of this taxpayer's own
documents are reported late. `docs/07` part C1 says 314 -> 0 and 250 -> 0.
Held rows were 593 before the mapping and 593 after.

One thing that took a second pass. `GSTR2A_CDN` has fourteen credit notes
whose dates all fall between the 4th and the 10th, so Excel parsed every one
and the column's own signature went silent while all fourteen values were
still wrong. The fix is a second signature - the row's own document date as a
witness, since an acknowledgement cannot precede what it acknowledges - and it
reproduces the 314 on `GSTR1_B2B` independently. D-0080.

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
