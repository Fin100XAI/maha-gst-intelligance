# Verification record - 20 September 2026

*Updated at the close of the end-to-end evaluation: a realistic workbook walked
from upload to served notice, and the seven defects that walk found, fixed.*

Every line below is output that was actually produced, not a summary of what it
was expected to say. Where a check was not run, it says so.

Toolchain: `backend/.venv` (Python 3.12.7), Node 22, on Windows.

## The gate

| Check | Ran? | Result | Notes |
|---|---|---|---|
| `ruff check .` | yes | **All checks passed** | 119 files |
| `ruff format --check .` | yes | **119 files formatted** | two test files reformatted, then clean |
| `mypy app` (G4) | yes | **no issues in 77 source files** | strict on engine, contracts, ingestion, store |
| `tsc --noEmit` (G5) | yes | **clean** | `exactOptionalPropertyTypes` on |
| `eslint src --max-warnings=0` | yes | **clean** | |
| `pytest` (backend) | yes | **630 passed**, exit 0 | offline, no credentials, no Docker |
| `pytest --cov=app` | yes | **86% total** | see the gaps below |
| `vitest run` (frontend) | yes | **28 passed** | |
| `pytest -m golden` | yes | **227 passed**, 376 deselected | the hand-computed statutory fixtures |
| every read endpoint, live | yes | **27 of 27 → 200** | against the demo database |
| every screen, rendered | yes | **20 of 20** render real content | no placeholders, no error states |
| no unprovenanced figure | yes | **0** across all screens | every figure has a `calc_id` or a drill |
| G1 `lint_no_float.py` | yes | **clean** across 8 trees | widened this phase from 2 to 8 |
| G1 proven to fail | yes | **exit 1** on a planted `0.18`, **exit 0** once removed | |
| G2 money columns NUMERIC | yes | **6 passed** | models and migration both |
| G11 audit chain | yes | **15 passed**, and `ChainVerification(ok=True, entries=3)` on the live demo database | |
| `alembic upgrade head` | yes | 0001 → 0004, **30 tables** on a fresh SQLite file | **not** applied to PostgreSQL |
| upload → engine → case → demand → notice | yes | **served**, DIN `CBIC202609PUNEI0000010AA` | a hand-built realistic workbook, below |
| threshold register | yes | **106 adopted**, then 105 department + 1 notified | effective-dating checked across the edit |
| `make demo` | yes | 12 taxpayers, 857 findings (67 triggered), every taxpayer reconciling | ~40 s |

## What was exercised by execution

Against the database `make demo` built, through the running API and the running
web app:

* **Ingestion** - portal-shaped workbooks with a title block, a merged two-row
  header, a spacer column, a trailing totals row, mixed date formats and one
  Marathi-headed sheet. Every taxpayer reported `rows in = parsed + quarantined
  + duplicates` and reconciled.
* **The engine** - 34 parameters and 57 rules over 12 taxpayers. Taxpayer #1,
  the control, fires nothing.
* **The dashboard** - the KPI strip, Indian-formatted money
  (`₹1,23,57,15,130.85`), and the coverage sentence: *"P-Score computed over an
  average of 3 of 34 parameters - 31 await DGARM red-flag feed, ICEGATE
  customs, ITD / AIS turnover, Refund module."*
* **W4, the taxpayer file** - all 34 parameters, 31 of them greyed as not
  evaluated and named with the feed they wait on; the two scores side by side
  with the note that they are never combined; findings with their head-wise
  split; and the "why these rules did not fire" section.
* **The provenance drawer**, opened from a P11 flag on that screen:
  `P11 · calc_id b22c5613ee20… · engine 0.1.0 · params defaults`, the formula,
  and both decomposed steps.
* **A case and its demand** - section 74A, head-wise tax, a total of
  `₹49,34,810.00`, 26 contributing lines, and one ADVISORY finding excluded with
  its reason stated.
* **The notice lifecycle over HTTP** - DRC-01A drafted with every figure slotted
  from the demand; self-approval refused **403**; approval by a second officer
  minting `CBIC202609PUNEI0000010AA`; a slot edit refused **422**; the notice
  read from another division **404**; service recorded with a reply clock of
  22 October 2026; `/pdf` answering **501** with its roadmap reference; and the
  audit chain verifying from genesis with the approved document's hash readable
  in the approval entry.

## The interface, walked in a browser

Every one of the twenty routed screens was rendered against the demo database
and read, not merely compiled. The interactive paths were driven rather than
assumed:

* **S1 Ingestion** - a real portal-shaped workbook uploaded through the file
  input, reconciling on screen as `5 rows in = 4 parsed + 1 held + 0
  duplicates`, the filer's GSTIN read from the title block, and the held row
  shown as the trailing totals row it is.
* **W1 Worklist** - a finding disposed of with a reason; the queue dropped from
  28 to 27 and the entry appeared in the audit chain, which still verifies.
* **W2 Audit Planner** - a taxpayer selected with a rationale, and the
  selection listed back with its basis and author.
* **W7 Copilot** - asked a question with no model configured, and told plainly
  that none is, rather than given an answer.
* **W4 Reconciliation** - the 12 × 11 matrix, a breached R1 cell opened to its
  head-wise split, and on into the provenance drawer showing the formula, the
  as-executed line and both steps.

A scripted pass over all nineteen data-bearing screens found **no figure
without provenance**: every rendered number carries either a `calc_id` or a
drill to the taxpayers it was summed from.

## The end-to-end walk, and what it found

A workbook was built to be realistic rather than convenient: a GSTR-1 with a
title block, a merged header, a spacer column, a totals row, three different
date formats, a credit note, an invalid-checksum GSTIN, a Marathi-headed sheet,
and a separate GSTR-3B whose declared outward tax was deliberately short of the
GSTR-1. It was uploaded through the browser, run through the engine, worked into
a case, and served as a notice.

It did not work first time, which was the point. Seven defects, each now fixed
with a regression test and a decision recorded:

| # | What went wrong | Decision |
|---|---|---|
| 1 | The ingested returns were invisible to the engine - nothing read them back | D-0030 |
| 2 | A credit note was quarantined: the document type was read from a hard-coded column name | D-0032 |
| 3 | A credit note was **added** to the demand - a negative amount and a negative sign | D-0032 |
| 4 | Marathi tax columns read as zero, silently | D-0035 |
| 5 | A period with no GSTR-3B was reconciled as though it had declared nil | D-0033 |
| 6 | A notice was addressed "To 27AAGCS4521P1ZX" | D-0034 |
| 7 | GSTR-3B could not be ingested at all - 21 of the 57 rules need one | D-0035 |

Defects 3 and 5 would each have produced a demand for money that was not owed.

The completed chain, driven in the browser: GSTR-1 and GSTR-3B ingested and
reconciling; the engine run over the snapshot; OUT-01 firing for July only, at
IGST ₹2,00,000 / CGST ₹50,000 / SGST ₹50,000; routed to ASMT-10 rather than
DRC-01B, correctly, the shortfall being over 20% but under ₹25 lakh; a case
opened; a demand of ₹3,00,000 under s.74A; the draft refused until the
registration was loaded; self-approval refused 403; approved by a second officer
as `CBIC202609PUNEI0000010AA`; and the audit chain verifying from genesis.

## The workbook on screen

The stored file is rendered back as a grid - column letters, the detected header
row tinted, held rows flagged ▲ with their reason on hover, and the derived
mapping available as an overlay. The file's own inconsistencies survive the
round trip: `2025-07-04`, `05-07-2025` and the raw Excel serial `45845` are each
shown as the file has them. That is deliberate (D-0039); a view that tidied them
would be showing the platform's reading rather than the officer's file.

## What was exercised by test only

The Marathi ASMT-10; the s.128A amnesty and limitation refusals; the six agents
(against a scripted provider - **no live model has been called**); the
numeric-fidelity middleware including the adversarial case; pseudonymisation and
leak detection; RBAC's 404 rule; and slot locking.

## What was not exercised at all

PostgreSQL, OIDC, PDF rendering, field-level encryption, the 50,000 × 12 load
test, and the accessibility audit.

SQLite is now the supported database and the one everything above ran on, with
`foreign_keys`, WAL and a busy timeout set on every connection (D-0038).
PostgreSQL remains a URL change and remains untested - the dialect difference in
`NUMERIC(18,2)`, JSONB and partial indexes is real, and a passing SQLite suite is
not evidence about it.

These remain the honest gaps at the close of the build. Everything the spec
describes as a screen exists and is served from real computation; what is
listed here is infrastructure and hardening that no amount of interface work
substitutes for.

## The language, design and agent round

Run at the close of the work the department asked for after the end-to-end
walk: plainer language, three named officers, a check against the circular, a
guide, a redesign onto the InQAI system, ten sample datasets, and a live model.

| Check | Ran? | Result |
|---|---|---|
| `ruff check .` / `ruff format --check .` | yes | clean, 129 files |
| `mypy app` | yes | no issues in 82 source files |
| `tools/lint_no_float.py` (G1) | yes | clean across 8 trees |
| `pytest` | yes | **719 passed**, exit 0 |
| `tsc --noEmit` / `eslint .` | yes | clean |
| `vitest run` | yes | 31 passed |
| ten dialects through ingestion | yes | **10 of 10 read every data row** |
| live model, Together AI | yes | Llama 3.3 70B answered; 11 figures checked, 3 with provenance handles |
| pseudonymisation, checked not assumed | yes | stored prompt held no GSTIN and no trade name |

**What the ten datasets found.** Running ten differently-shaped files through
ingestion for the first time exposed three things. Two were platform defects:
a CSV upload never reached the CSV reader (D-0045), and a one-cell banner line
beat a fifteen-column header because every term in the header score was a ratio
(D-0044). The third was a fault in the test data -- the invented GSTINs had
wrong check digits, so ingestion refused them, correctly, and the whole file
read as a platform bug until the check digits were computed properly.

All three were found by execution. None would have been found by reading.

**A number that changed.** The State-wide risk-band chart was drawing one bar
per jurisdiction per band -- six bars all labelled LOW -- rather than one bar
per band. Fixed, with the band means now weighted by taxpayer count; on the
test fixture that moves a band mean from 35.00 to 18.33, the latter being
correct (D-0043).

**Still not exercised.** PostgreSQL, OIDC, PDF rendering, field-level
encryption, the 50,000 x 12 load test, and the accessibility audit. The
accessibility audit matters more after a visual redesign than before it, and it
has not been done.

## The interface round

| Check | Ran? | Result |
|---|---|---|
| `ruff check .` / `format --check` | yes | clean, 133 files |
| `mypy app` | yes | no issues in 83 source files |
| `tools/lint_no_float.py` (G1) | yes | clean across 8 trees |
| `pytest` | yes | **752 passed**, exit 0 |
| `tsc` / `eslint` / `vitest` | yes | clean · clean · 32 passed |
| `alembic upgrade head` | yes | 0004 -> 0005, filing_review created |
| W8 filings, end to end | yes | list, detail, review; audit chain verifies |

**Law 4, now asserted rather than trusted.** The audit found the invariant
already holding -- the only `Decimal()` constructed from model text is in the
fidelity checker, in the direction of refusal, and nothing outside
`app/agents/` reads a completion at all. That is worth little as an
observation and a good deal as a test, so it is now thirteen of them
(D-0049).

**What the department asked for, and what it cost.** Standard terminology came
back to the sidebar (D-0052) after a round of plain English went too far; the
explanations moved onto the screens, where they belong. The nav collapsed from
twenty-two visible destinations to one open group, with nothing removed. The
screens now fill the width (D-0051). shadcn/ui and Recharts -- both already in
the declared stack, neither previously used -- are now actually used (D-0050).

**The new unit of work.** W8 Filings (D-0053) gives an officer the thing on
the desk: one business, one month, one return. It shows the rules that came
back clear as well as the ones that fired, because justifying not pursuing
something needs the same evidence as pursuing it; it counts "could not be
tested" apart from "nothing found"; and it lets an officer record that there
was nothing to do, which is the outcome no system records and every officer is
later asked about.

**Not exercised.** The new `filing_review` table has been migrated and
exercised through the API and the browser, but never against PostgreSQL --
which remains true of everything. The accessibility audit still has not been
done, and now matters more than before, because the interface changed.

## Answers to the four standing questions

**1. Which §2 invariants are enforced by code, and which by convention?**

| Law | Enforcement |
|---|---|
| Determinism | **Code.** G1 across eight trees with no suppression comment; `calc_id` is a hash of inputs, never a UUID and never the clock. |
| Provenance | **Code** on the engine path - a `Finding` without a trace cannot be constructed, and `clear()` builds a tracer. **Convention** in the UI, guarded by `<Money>` rendering a visible ⚠ for a figure with no `calc_id`. |
| Head-wise integrity | **Code.** `TaxVector` has no scalar constructor and `.total` is the one collapse, at the presentation boundary. |
| The LLM never calculates | **Code**, four ways: no tool returns a live number (asserted by a test that runs every tool of every agent), the fidelity middleware raises rather than warns, the drafter's prompt never contains slot syntax, and slots are filled from the demand. |
| Nothing silently dropped | **Code** in ingestion (`RowLedger.assert_reconciled`) and in the rules (`NOT_EVALUATED` cannot be constructed without naming the missing dataset). |

**2. Which reported numbers would change if an input were missing or wrong?**

Every figure on a screen is traceable to a spreadsheet cell, so a wrong input
changes the figure and the drawer shows where it came from. The numbers most
sensitive to a *missing* input are the two scores: the P-Score is computed over
the parameters that could be evaluated, and its coverage - currently 3 of 34 -
is printed beside it every time precisely because the score alone would mislead.

**3. What is the largest untested surface?**

Scale. Everything above ran over a dozen taxpayers and a few hundred rows. The
aggregation layer exists precisely because 50,000 taxpayers × 12 periods is a
different problem, and that number has never been put through it. Second is the
live provider path in `OnPremiseProvider`, which has no cassette; third is
PostgreSQL, which is no longer claimed (D-0038) but is still where this would
have to run.

**4. What changed this phase that changes a reported number?**

Four, all of them in the direction of a smaller or absent demand:

* A credit note is now subtracted rather than added. On the test workbook this
  moved a demand from ₹86,000 to ₹50,000 - the correct figure (D-0032).
* A period with no GSTR-3B now reports `NOT_EVALUATED` instead of reconciling
  against an assumed nil return (D-0033).
* Marathi-headed tax columns now map, so the tax they carry is counted instead
  of read as zero; a sheet with an unmapped tax column is held and named.
* A threshold edited in the register changes what the next run concludes, and
  resolves as at the tax period, not as at today (D-0037).

Earlier in the same build: a P-Score of exactly zero was rendered as "no score
recorded" because the API tested the Decimal for truthiness. The control
taxpayer scores zero, so the one taxpayer the platform most needs to be able to
show was the one it showed nothing for. Fixed, with a golden regression test.

---

# Verification record - 23 September 2026

*The v3 build pack's phases 1 to 3, measured against the live SSR Marine
workbook rather than against a fixture written to pass.*

The record above stands; nothing in it is withdrawn. This section covers what
has been built since, and keeps the same discipline: every figure below was
produced by running the code, and where something was reasoned about but never
executed, it says so.

**The acceptance fixture is real data.** `docs/06` and `docs/07` dissect
`27AAPCS8928R1Z1`, which is one of the nine filed workbooks in the database.
So "reproduces the worked case" means the engine agrees with a document
somebody wrote by hand from the same spreadsheet - not that a fixture agrees
with itself.

## The gate

| Check | Ran? | Result | Notes |
|---|---|---|---|
| `ruff check .` | yes | **All checks passed** | 176 files |
| `ruff format --check .` | yes | **176 files formatted** | |
| `mypy app` (G4) | yes | **no issues in 97 source files** | |
| `pytest` (backend) | yes | **1,078 passed, 0 failed**, exit 0 | offline, no credentials |
| G1 `lint_no_float.py` | yes | **clean across 9 trees** | widened this phase from 8 to 9: `app/matching` |
| `alembic upgrade head` | yes | 0001 → **0007** on a fresh SQLite file | still **not** applied to PostgreSQL |
| Full workbook re-ingested | yes | `12,449 in = 11,777 parsed + 593 held + 79 duplicates`, reconciles | |
| Engine over the real snapshot | yes | `rule_errors == []`, 12 scorecards | |

The frontend gate was **not** re-run this phase: no frontend file was touched.

## The reference run

Held rows, by reason:

| Reason | Rows |
|---|---|
| `SHEET_NOT_INGESTED` | 512 |
| `TOTALS_ROW` | 60 |
| `GSTIN_INVALID` | 9 |
| `CROSS_FIELD_MISMATCH` | 8 |
| `REQUIRED_FIELD_MISSING` | 4 |

The 512 are GSTR-1 Table 12 and Table 13, the challan register and the three
GSTR-7 sheets: recognised, with no canonical table yet. "We have not built this
yet" and "we could not read your file" are different statements and only one of
them is true here.

## Reproduced from `docs/07`, to the paisa

| Finding | `docs/07` says | The engine produces | Status |
|---|---|---|---|
| **Finding 1** - X-01 rate differential | Rs 1,90,71,333 | **Rs 1,90,71,332.80** on a base of Rs 14,67,02,560 | exact |
| Finding 1, credit-note limb - X-02 | - | **Rs 66,01,615.20** | runs |
| **Finding 2** - B-04 Rule 37A, B2B only | Rs 95,79,967 | **Rs 95,79,967.02** | exact |
| Finding 2, defaulting suppliers | 29 | **29** | exact |
| Finding 2, SSR Shipyard `27ABQCS3690E1ZW` | Rs 77,99,267 | **Rs 77,99,266.80** | exact |
| **C1** - acknowledgements before their own invoice | 314 → 0 | **314 → 0** | exact |
| **C1** - own documents outside the Rule 48(4) window | 250 → 0 | **250 → 0** | exact |

B-04's headline is **Rs 98,47,287.78**. It differs from the document's table
because the engine also reads the B2BA amendment (+Rs 2,68,664.76) and the
credit note (−Rs 1,344.00, correctly signed). The B2B-only component is the
document's figure exactly, and the fuller number is the more complete answer.

**Three of `docs/07`'s six findings do not yet reproduce.** Part D's April/May
carry-forward is the nearest miss: ITC-01 reports Rs 22,01,253.66 for May 2025,
which is the document's over-claim limb, but the April under-claim is not
emitted as a finding, so `net_findings` has nothing to net it against and the
Rs 66,222 net figure cannot be produced.

## Exercised by execution

| Path | How |
|---|---|
| Ingestion, all 29 sheets | Full workbook through `ingest_sheets`; ledger reconciled |
| Invariants `I-01`–`I-10` | In the pipeline on the real file. `I-01` held 9 rows before the transposition fix and 0 after - they were a symptom of it, not nine bad documents |
| Transposition detector | **1,832 cells corrected** across six sheets, every column `CERTAIN` |
| `irn_date` + migration 0007 | Fresh DB at head, re-ingested; 5,954 lines carry an IRN date |
| 2A/2B separation | 4,678 2B rows and 4,772 2A rows, labelled separately |
| `counts_toward_2b_available` | Measured both ways: **Rs 12,92,86,091.72 either way** (D-0082) |
| Coverage and scorecards | 12 cards; **8 months `NIL_BY_IDENTITY`, 4 `ABSENT`** |
| Tier enforcement | X-03/X-04 emit `DocumentCall`s; a triggered `Finding` from a non-AUTO check is refused with a rule error |
| X-01, X-02, X-05, X-06, X-11, B-04 | Run on real data. X-05 verified against X-01 by evidence-set comparison |

## Read but not exercised

| Path | Why |
|---|---|
| **`app/matching/joins.py` J01–J21** | All 21 declared with their `feeds`; `run_join` is unit-tested; **no per-join data adapter exists**, so no join has run against the workbook. B-04 answers `J04`'s question directly rather than through the join |
| **Joins cached on the context** | `CLAUDE.md` requires joins to run once before rules and be consumed as a `MatchResult`. Not yet true - there is no join phase in the runner |
| **`X-03`, `X-04`** | Correct on fixtures; on every real workbook they abstain, because the B2B export carries no HSN and Table 12 is not ingested. Their firing path has never run on real data |
| **`OUT-07`** | Declares `rate_master`; nothing populates it, so it has only ever returned `NOT_EVALUATED` |
| **`G-03`, `G-04`** | Not written. `irn_date` now exists for them |
| **Exemption engine** | Unit-tested. No check declares an exemption yet, so `apply_exemptions` has not run in a pipeline |
| **Netting** | Unit-tested against `docs/07` Part D. Has never netted anything on real data - see the April limb above |
| **Annual roll-up** | Built and returned by the runner; no screen reads it |
| **The 141-check A–L matrix** | One check exists (`B-04`). The migration from the 57 v2 IDs is an open question in `docs/GAP_V3.md` |
| **Applicability grid** | `NOT_APPLICABLE` is modelled in the scorecard; no grid is loaded, so no check has returned it |
| **Phase 5 screens** | Not started. Document calls are produced and have nowhere to render |

## The four questions

**1. What was exercised, and what only read?** The two tables above. The short
version: the ingestion path, the invariants, the transposition correction, the
2A/2B split and seven checks were run against real data and their output read.
The join layer, the exemption engine and the netting layer have only ever run
against fixtures.

**2. Which laws are enforced by code?**

| Law | Enforced by |
|---|---|
| 4, invariants before rules | **Code.** `check_invariants` is the last gate in `ingest_sheet`; a failing row never becomes a `CanonicalRecord`, so no rule can see it |
| 5, tier honesty | **Code**, as of this phase. The runner refuses a triggered `Finding` from a non-AUTO check. Abstentions stay permitted from any tier, deliberately |
| 7, nothing silently assumed | **Code** in ingestion (`RowLedger.assert_reconciled`) and in the checks (`not_evaluated` cannot be built without naming the missing dataset) |
| 6, provisos | **Convention.** The exemption engine exists and no check declares one, so nothing tests the path |
| 2, provenance | **Code** on the engine path. The `DocumentCall` output added this phase carries evidence ids but **no `calc_id`** - a gap, because an officer reading a call book entry cannot yet drill it |

**3. Which numbers would change if a source column were wrong?**

* **`supplier_3b_filed`** - B-04 entirely. Read from one sheet by one synonym. Absent means `NOT_EVALUATED`; mis-parsed means a wrong demand.
* **`irn_date`** - every Rule 48(4) figure and `I-01`. Demonstrated: read naively it manufactures 250 notices that should not exist.
* **`itc_available`** - the whole 2B bucket, so ITC-01 and ITC-03. A 2A export that emitted this column would have doubled it until D-0082.
* **`source_form`** - which statement a row came from. Defaulted once, and it took two decisions to state the consequence correctly (D-0075, then D-0082 correcting it).

**4. What is the largest untested surface?**

**The join layer.** Twenty-one joins are named, typed, and declared with what
they feed, and not one has run against the workbook. Every check that will
consume a `MatchResult` is currently written against raw records or not written
at all - so the L1–L5 ladder's behaviour on real document numbers, which is the
thing the matching design exists for, rests on unit tests and nothing else.

## Defects found and fixed this phase

All five were introduced by this work, not inherited.

| # | What went wrong | Decision |
|---|---|---|
| 1 | The loader never read `is_amendment`, and X-01 tested only that flag - an amendment would have been compared against the line it amends | D-0081 |
| 2 | X-05 double-counted X-01: same counterparty, same rates, evidence a strict subset. Rs 2.86 crore on screen where there is Rs 1.91 crore | D-0085 |
| 3 | The tier guard rejected the engine's own "ran and found nothing" row, so X-03 and X-04 had no scorecard rows at all | D-0084 |
| 4 | The transposition detector was silent on a column whose dates all fall in the first twelve days - five credit notes stored with a date the taxpayer never wrote | D-0080 |
| 5 | B-04's first version summed credit notes **into** the demand rather than out of it | D-0077 |

And one correction to the record rather than to the code: **D-0075 overstated
its own consequence.** It claimed conflating 2A and 2B meant ITC-in-excess-of-2B
could not fire on any taxpayer. Measured, the bucket is identical either way and
ITC-01 fires on 8 of 12 periods. The fix still stands - the 2A rows were being
excluded by an accident of one vendor's column layout, and accident is not a
control - but the claim was wrong and D-0082 says so.
