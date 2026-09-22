# CHANGELOG — v3
### What was added, what was cut, and why

The brief: *add all 34 risk metrics and the 141-check matrix, evaluate individual
filings against them, deepen breach/fraud/mismatch detection with proper ingestion and
cross-sheet matching, and comment out what is redundant.*

---

## ADDED

| Addition | Where | Why |
|---|---|---|
| **The full 141-check A–L matrix**, transcribed with legal refs, tests and thresholds | `01 §8` | It is the department's own scrutiny framework. Ours was a parallel invention of a subset. |
| **Tier model — AUTO / ASSISTED / MANUAL / CASE** | `01 §1` | Only 41 of 141 checks are computable from returns. Pretending otherwise is how scrutiny software loses trust in week three. |
| **X-01 to X-12, the self-contradiction family** | `01 §7` | The worked case found **₹1.91 crore — more than every other finding combined** — in a four-day invoice sequence. No check in either source catalogue caught it. Now built first. |
| **Post-coercion invariants I-01 to I-10** | `02 §A3` | A naive read of one date column manufactured **250 fabricated notices**. `I-01: ack_date ≥ doc_date` alone prevents all of them. |
| **Mixed-type date-transposition detector** | `02 §A2` | Observed in real data: 635 of 2,043 cells silently day/month-swapped by Excel. The signature is diagnostic and the fix is deterministic. |
| **The 21-join match engine with an L1–L5 key ladder** | `02 Part B` | Every material finding came from a join. Matching is the product. |
| **J21, the outward self-join** | `02 §B3` | Group by counterparty, bucket by exact value, look for two rates. Cheap, and no conventional tool runs it. |
| **Filing scorecard, per (GSTIN, period), + a separately computed annual roll-up** | `02 Part C`, `04 W1` | The officer's unit of work is a filing, not a taxpayer. The annual is not the sum — netting, §16(4) and Rule 37A cut-offs are FY-level. |
| **Exemption engine** | `01 §3`, `03 §4` | Rule 86B without clause (d) of its first proviso produced a confident wrong demand on the real file. A test without its provisos is not conservative, it is wrong. |
| **Multi-period netting** | `01 §4` | April under-claim ₹22.67 L vs May over-claim ₹22.01 L is one event. A single-period engine raises ₹22 L and loses it. |
| **Cohort-size fallback for peer-banded parameters** | `01 §5` | 16 of 34 parameters band by percentile. A percentile over n=1 is meaningless; below `min_cohort` fall back to self-history and badge it. |
| **`ABSENT` / `PRESENT_EMPTY` / `NIL_BY_IDENTITY`** | `02 §A4` | The third state is the one everyone gets wrong — and getting it wrong is what made the v2 note wrongly call the real GSTR-1 incomplete. |
| **Call Book, grouped by document not by rule** | `04 W4` | One letter asking for the fixed-asset register once, citing the four checks it unblocks. |
| **Module K wired as a case engine** | `01 §11`, `03` | Section by FY, limitation clocks, penalty by payment stage, §128A, COVID extension flagged `LITIGATION_UNCERTAIN`. |
| **Applicability grid × client flags** | `01 §12` | A rule that does not apply is `NOT_APPLICABLE`, not `CLEAR`. |
| **GSTIN position 14 accepts `[ZDC]`** | `02 §A2` | A `Z`-only validator rejects every government department in India. It wrongly flagged two BSF units on the real file. |

---

## CUT — removed from the build entirely

| Cut | Why |
|---|---|
| **Analytics module** — Benford, isolation forest, PageRank, community detection | Never fed either score, so it produced leads no one could act on. Reinstate only after a documented back-test against appellate outcomes. |
| **NET-01 to NET-05 network rules** | Need a multi-taxpayer invoice corpus. With one taxpayer ingested they return nothing. Folded the useful part into P24 and X-10. |
| **The network graph screen** | Same reason. An empty force-directed graph is worse than no screen. |
| **Three of six agents** — notice drafter, legal research, reply triage | Legal-research RAG over Acts, Rules, circulars and case law, chunked with effective dates, is a project of its own. Shipping it half-built is worse than not shipping it. |
| **Four of eight notice forms** — DRC-01, ADT-01, REG-17, RFD-08 | The POC issues intimations and scrutiny notices. SCNs, audits, cancellations and refund rejections are separate workflows with separate approval chains. |
| **E-way bill module (EWB-01 to EWB-10)** | **There is no EWB data in the real workbook.** Ten rules that always return `NOT_EVALUATED` are ten rules of noise. Kept as G-05 in the matrix, tier ASSISTED. |
| **Dashboard D7 Jurisdictions, D8 Officers, D9 Sectors** | All three need a portfolio. With one taxpayer they render empty tables. D8 also carried a real risk of being read as a league table. |
| **The 95-rule parallel catalogue from v2** | Superseded. Its content is now inside the A–L matrix and the X family, with the department's own IDs. Duplicate ID spaces are a maintenance trap. |

---

## DEFERRED — built later, not now

| Deferred | To |
|---|---|
| The 43 `MANUAL` checks as anything more than checklist items | Phase 4 ships the checklist; automation waits for the document-management module |
| Marathi locale (keys are in place from Phase 0) | Phase 6 |
| GSTR-6 / ISD, ITC-04 detail, GSTR-9/9C ingestion | Phase 7 — absent from the reference workbook |
| Predictive default model | Research; explicitly not in either score |
| Mobile field verification, taxpayer self-service, public DIN page | Coming-soon screens with 501 APIs |
| ICEGATE, ITD, DGARM, refund-module feeds | Coming-soon, each naming the parameters it unlocks (10 of 34 are dark without them) |

---

## CORRECTED

**`06_WORKBOOK_ANATOMY.md` said GSTR-1 was incomplete and R1 incomputable. It was
wrong.** GSTR-1 B2B + credit notes equals 3B Table 3.1(a) **to the paisa in all twelve
months** — only possible if there are no B2C, export or SEZ supplies at all. The missing
sheets are nil sections. R1 reconciles at ₹0.00 across the year.

The engineering point survives, restated as the three-way coverage state in `02 §A4`:
test whether the present sections sum to the auto-populated total. Where they do, treat
the remainder as nil and run the identity. Where they do not, report `NOT_EVALUATED`
naming the missing tables. **Do not guess in either direction** — which is what the
original note did.

---

## Net effect

| | v2 | v3 |
|---|---|---|
| Risk parameters | 34 | 34 |
| Detection checks | 57 (parallel invention) | **141 (departmental) + 12 (new X family)** |
| Named cross-sheet joins | 0 (implied) | **21** |
| Ingest invariants | 0 | **10** |
| Dashboard screens | 9 | 5 |
| Workbench screens | 7 | 5 |
| Agents | 6 | 3 |
| Notice forms | 8 | 4 |
| Spec documents | 5 + 2 appendices | 6 + 2 appendices |

More detection, less surface. The checks the platform cannot honestly compute are still
in the catalogue — tiered, visible, and producing document calls instead of fabricated
numbers.
