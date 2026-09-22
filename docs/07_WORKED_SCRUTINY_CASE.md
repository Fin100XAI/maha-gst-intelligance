# 07 — WORKED SCRUTINY CASE
### How GST mismatch and fraud actually happen, and what the engine found in one real return

**Subject:** SSR Marine Services Private Limited · `27AAPCS8928R1Z1` · FY 2025-26
**Source:** the 29-sheet GSP consolidated export dissected in `06_WORKBOOK_ANATOMY.md`
**Rule framework:** the 141-rule CS scrutiny matrix (modules A–L) supplied with this brief,
mapped against the 34 CBIC/DGARM audit parameters in `01_RULEBOOK.md`
**Declared turnover:** ₹138.65 crore · **Output tax:** ₹21.38 crore · **ITC claimed:** ₹12.90 crore

> Everything below was computed from the workbook. Every figure is reproducible from the
> sheet, row and column named beside it. Nothing here is an allegation — these are
> scrutiny positions an officer would put to the taxpayer, and several of them have
> innocent explanations the taxpayer may well be able to produce.

---

# PART A — HOW MISMATCHES ACTUALLY HAPPEN

Fraud and error in GST are not one phenomenon. They sit on a ladder, and the
detection method changes completely at each rung. A platform that treats them as a
single "mismatch" problem catches only the bottom rung.

## A1. The ladder of intensity

### Rung 0 — Clerical (no intent, high volume)
Wrong tax head for the place of supply · HSN keyed wrong · decimal or transposition
error · invoice entered twice · month tagged wrong. **Signature:** random sign,
random size, no pattern across periods. **Detection:** arithmetic identities (R1–R11)
and field validation. **Response:** correction, not demand.

### Rung 1 — Timing (intent is deferral, not evasion)
ITC claimed a month late or a month early · liability declared in a later return ·
credit notes at year-end pulling turnover backwards · advances never adjusted.
**Signature:** the delta reverses in an adjacent period and the annual net is near
zero. **Detection:** rolling multi-period reconciliation, never single-period.
**Response:** interest under §50, rarely tax. *A platform that reconciles one month at
a time will raise a demand here and lose it on reply.*

### Rung 2 — Classification (the largest rupee category, and the most defensible)
Rate applied at 5% where 18% is due · a service re-badged as a goods supply to reach a
lower HSN · exempt vs taxable mischaracterisation · composite vs mixed supply ·
intra-State declared as inter-State. **Signature:** internally consistent, fully
documented, and *wrong* — or arguably right. **Detection:** HSN→rate master with
effective dates, peer comparison within the sector, and above all **self-contradiction
in the taxpayer's own records** — the same supply invoiced two ways. **Response:**
§73/§74A demand, heavily litigated. **This is where Finding 1 below sits, and it is
₹1.91 crore.**

### Rung 3 — Credit leakage (the department's own data is enough)
ITC on invoices whose supplier never filed GSTR-3B (Rule 37A) · credit claimed on
2B lines flagged unavailable · §16(4) time-barred credit · blocked credit under
§17(5) · Rule 42/43 reversal not made · 180-day non-payment reversal skipped.
**Signature:** a join between two departmental datasets that the taxpayer cannot see
until it is put to them. **Detection:** trivially computable, needs nothing from the
taxpayer. **Response:** reversal plus interest. **Finding 2 below, ₹95.80 lakh.**

### Rung 4 — Suppression (the supply happened; the return says otherwise)
E-way bills with no matching invoice · IRNs generated and not carried into GSTR-1 ·
B2B supplies reported as B2CS to hide the counterparty · TDS/TCS deducted by a
government buyer on a payment larger than the turnover declared · cash sales absent
from the books. **Signature:** an external record of a transaction that the return
does not contain. **Detection:** anti-joins against movement and third-party data.
**Response:** §74A, fraud limb.

### Rung 5 — Fabrication (no supply at all)
Invoices from non-existent or cancelled registrations · circular trading rings ·
shell entities registered and drained within 90 days · shared address, bank account
or promoter across a cluster · pure pass-through traders with sub-1% value addition.
**Signature:** network structure, not arithmetic. **Detection:** graph analysis over
the invoice ledger. **Response:** investigation, arrest powers, §132. *A finding here
is a lead, never an offence — say so on the screen.*

## A2. Why the mismatch survives to be found

Three structural facts make all of this detectable, and the platform is built on them.

**GSTR-2B is static.** Generated on the 14th, never amended. That immutability is what
makes it *evidence* rather than a working figure. Compare GSTR-3B Table 4(A)(5)
against 2B and the taxpayer cannot move the goalposts afterwards.

**GSTR-3B Table 3 is hard-locked** from the July 2025 period — auto-populated from
GSTR-1/1A and non-editable. So the classic GSTR-1-vs-3B liability mismatch is now
structurally impossible. **In this return R1 reconciles to ₹0.00 in all twelve
months.** That is not the engine finding nothing; it is the engine confirming the
lock works — and it means outward-side evasion has *migrated* from the 3B into
classification (Rung 2) and credit notes. Which is exactly what this taxpayer's file
shows.

**Every party's return is another party's evidence.** The supplier's GSTR-1 becomes
the recipient's 2B. The recipient's IMS action is timestamped. The government buyer's
GSTR-7 records a payment the seller may not have declared. The customs BoE records an
import. A taxpayer can control their own filing; they cannot control seven other
parties' filings simultaneously. **Cross-source joins are the whole game.**

## A3. How the filing types interlock

```
                     ┌─────────────────────────────────────────┐
   e-invoice (IRN) ──┤ auto-populates                          │
   Rule 48(4)        │                                         ▼
   AATO ≥ ₹5 cr      │                                    GSTR-1  §37
                     │                                  (Tables 4/5/6/7/9/12/13)
   e-way bill ───────┘  movement must match                    │
   Rule 138             the document                           │ hard-locks
                                                               ▼
                        GSTR-1A ──► amends before 3B ──► GSTR-3B Table 3
                                                               │
   counterparty's ────► IMS ────► GSTR-2B ────► GSTR-3B Table 4
   GSTR-1 §37           accept/   (static,      (auto-populated)
                        reject/   14th)                        │
                        pending                                ▼
   supplier's GSTR-3B ──► Rule 37A: filed 1 but not 3B    payment §49
   filing status           ⇒ recipient must reverse       cash + credit ledgers
                                                               │
   GSTR-7 (TDS §51) ────┐                                      ▼
   GSTR-8 (TCS §52) ────┼──► third-party proof of turnover   GSTR-9 / 9C §44
   ICEGATE BoE ─────────┘                                    annual true-up
```

**Read the diagram as a set of joins, because that is what the engine is.** Eleven of
them are named identities R1–R11. The two that found real money in this file are the
supplier-3B-status join (Rung 3) and the taxpayer's own invoice-to-invoice
self-contradiction (Rung 2).

---

# PART B — WHAT THE ENGINE FOUND

## Exposure summary

| # | Finding | Matrix rule | Statutory basis | Exposure (₹) | Confidence |
|---|---|---|---|---|---|
| **1** | IWAI supply re-invoiced 18% → 5% mid-contract | **G-10**, H-03 | Rate notifications; §34(2) proviso (w.e.f. 01.10.2025) | **1,90,71,333** | STRONG |
| **2** | ITC from suppliers who never filed GSTR-3B | **B-04** | Rule 37A; §16(2)(c) | **95,79,967** | CERTAIN |
| **3** | Lift/elevator repair (SAC 998718) at 5% | **G-10** | Notification 11/2017-CT(R) | **16,99,157** | ADVISORY |
| **4** | ₹80.05 lakh ITC reversed, nil interest declared | **J-02** | §50(3); Rule 88B(3) | **1,22,380 – 4,85,573** | STRONG |
| **5** | September GSTR-3B filed 4 days late, nil interest | **J-01** | §50(1); Rule 88B(1) | **17,083** | CERTAIN |
| **6** | Invoices at abolished 12%/28% slabs post-22.09.2025 | **G-10** | GST 2.0 rate notifications | 634 short + 3,727 over-collected | CERTAIN |
| | **Total quantified** | | | **≈ ₹3.05 crore** | |

Three further checks fired on first pass and were **correctly suppressed on
re-testing** — they are set out in Part C, because a platform that cannot explain why
it *stopped* alleging something will not be trusted when it alleges.

---

## FINDING 1 — The IWAI reclassification · ₹1.91 crore
**Matrix G-10 (rate & HSN validation), H-03 (CN reducing output tax) · Parameters P03/P31**

The taxpayer's single largest customer is the **Inland Waterways Authority of India**
(`09AAATI7021F1ZW`), a statutory authority. Four milestone invoices, all identical
multiples of ₹3,66,75,640:

| Invoice | Date | Rate | Taxable ₹ | IGST ₹ |
|---|---|---|---|---|
| `SSR/M/1118/25-26` | 21-Nov-2025 | **18%** | 3,66,75,640 | **66,01,615.20** |
| `SSR/M/1147/25-26` | 25-Nov-2025 | **5%** | 3,66,75,640 | 18,33,782.00 |
| `SSR/CNM118/25-26` | 26-Nov-2025 | 18% | **(3,66,75,640)** | **(66,01,615.20)** |
| `SSR/M/1764/25-26` | 25-Feb-2026 | 5% | 3,66,75,640 | 18,33,782.00 |
| `SSR/M/2019/25-26` | 25-Mar-2026 | 5% | 7,33,51,280 | 36,67,564.00 |

**Read the sequence.** On 21 November the same supply was invoiced at **18% as a
service**. Four days later it was re-invoiced at **5%**. The next day a credit note —
numbered `CNM**118**`, naming invoice `1118` — cancelled the 18% document in full.
Every subsequent milestone went out at 5%. In the HSN summary the 5% lines sit under
**HSN 89079000 — "other floating structures"**, a *goods* heading.

**Why this is a scrutiny position, not a clerical matter:**

- The taxpayer's **own first classification was 18% as a service**. The change of
  mind is on the record, in their own invoice series, four days apart.
- Every other line in the file is a service: SAC 996521 (inland water transport,
  ₹50.57 cr), 998515, 998719 (repair & maintenance), 996602, 998714, 998717.
  ₹14.67 crore of "floating structures" is the sole goods supply in a services book.
- The HSN summary reports **quantity 1** against ₹7.33 crore (March) and **quantity 5**
  against ₹3.67 crore (November) — not the profile of a goods supply.
- **Place of supply is declared as Uttar Pradesh** (IWAI's registered location). That
  is the §12(2) *service* rule. For a goods supply, §10(1)(a) fixes POS where the
  movement terminates — for inland-waterways works, that is unlikely to be Noida.
- There are no e-way bills in the file evidencing movement of any floating structure.

**Exposure.** ₹14,67,02,560 taxable charged at 5% (IGST ₹73,35,128). At 18% the IGST
would be ₹2,64,06,461. **Differential: ₹1,90,71,333.**

**Second, independent limb.** The credit note is dated **26-Nov-2025** — after the
substituted proviso to §34(2) took effect on **01-10-2025**. Output-tax reduction is
now permissible only where the **registered recipient has reversed the corresponding
ITC**. IWAI is registered (it operates as a TDS deductor, `09AAATI7021F1D5`). Unless
the taxpayer produces proof that IWAI reversed ₹66,01,615 of ITC, the output-tax
reduction is not available and that amount is recoverable on its own footing.

**Corroboration from a second source.** IWAI's GSTR-7 shows TDS deducted on payments
of ₹3,66,75,640 in **December 2025** and again in **March 2026** — the money moved.
The supply was performed and paid for; only its characterisation changed.

**Action:** ASMT-10 under §61 calling for the contract, scope of work, the basis for
HSN 89079000, delivery evidence for the "floating structures", and IWAI's ITC-reversal
confirmation for `SSR/CNM118/25-26`.

---

## FINDING 2 — Rule 37A: suppliers who collected tax and never filed GSTR-3B · ₹95.80 lakh
**Matrix B-04 · §16(2)(c) · Parameter P14 · Rule ITC-02**

Joining GSTR-2A's `GSTR-3B Filing Status` column against the ITC claimed:

| | Records | Taxable ₹ | Tax ₹ |
|---|---|---|---|
| Supplier's GSTR-3B **filed** | 4,539 | 68,83,12,916 | 12,23,25,431 |
| Supplier's GSTR-3B **NOT filed** | **103** | **5,34,11,416** | **95,79,967** |

Every one of the 4,642 records shows the supplier's **GSTR-1 as filed** — so the
credit appeared in 2B and was claimed. It is only the **3B** that is missing, which is
precisely the Rule 37A trigger: tax charged, credit passed, tax never paid to the
exchequer.

**29 suppliers, but one dominates:**

| Supplier | Invoices | Taxable ₹ | Tax at risk ₹ |
|---|---|---|---|
| **SSR SHIPYARD PRIVATE LIMITED** `27ABQCS3690E1ZW` | 9 | 4,33,29,260 | **77,99,267** |
| SAHAY RAJ ENTERPRISES `27CPJPT5604K1ZD` | 4 | 67,51,370 | 12,15,247 |
| AZIMUTH MARITIME SOLUTIONS `24ABVFA2224Q1Z0` | 10 | 13,78,100 | 2,16,195 |
| 26 others | 80 | 19,52,686 | 3,49,258 |

**The name is the point.** *SSR Shipyard* shares the taxpayer's own *SSR* identifier
(PANs differ — `ABQCS3690E` vs `AAPCS8928R` — so they are not the same person, but the
common branding is a related-party indicator). It is the **second-largest supplier in
the file, at 22.25% of all ITC (₹3.07 crore)**, and the nine defaulting invoices are a
**consecutive unbroken series** — `SHIYARD/25-26/05` through `SHIYARD/2526/013`, dated
4-Oct-2025 to 21-Nov-2025, rising from ₹27.6 lakh to ₹90.6 lakh each.

An unbroken consecutive run from a name-related supplier, filing GSTR-1 (so the buyer
gets the credit) but not GSTR-3B (so the exchequer gets nothing), is the classic
**credit-passing** pattern. It is not proof of collusion. It is a very strong reason
to open the supplier's file at the same time as this one.

**Netting caution — get this right or the demand fails.** ₹95.80 lakh is the *gross*
Rule 37A exposure and must be reduced by any reversal already made. The taxpayer
reversed ₹80,05,163.54 in the **August 2025** return (Finding 4). Those reversals
**cannot** cover the SSR Shipyard invoices, which are dated October and November —
three months later. The ₹77.99 lakh limb stands on its own.

**Deadlines.** Supplier 3B cut-off **30-Sep-2026**; recipient's reversal deadline
**30-Nov-2026**. As at today, **69 days remain** — this is a live case, not a
historical one, and reversal now avoids the interest entirely.

**Action:** DRC-01A under §74A(8), with a parallel reference for enforcement action
against SSR Shipyard.

---

## FINDING 3 — Lift and elevator repair at 5% · ₹16.99 lakh
**Matrix G-10 · ADVISORY**

November 2025 carries **₹1,30,70,437 under SAC 998718** — *"Maintenance and repair
services of elevators and escalators"* — at **5%**.

Ship maintenance, repair and overhaul does attract 5% with full ITC under the MRO
entry in Notification 11/2017-CT(R), and much of the taxpayer's 5% work under SAC
998719 (₹4.45 crore) plausibly qualifies. **SAC 998718 is not ship MRO.** If the
supply is genuinely lift and escalator repair, the rate is 18% and the differential is
**₹16,99,157**. If it is ship equipment misfiled under the wrong SAC, the rate may be
right and the **SAC is wrong** — which still needs correcting, and still needs asking.

Flagged **ADVISORY**: the answer turns on what was actually serviced, which only the
work order shows. Do not demand on this without the document.

---

## FINDING 4 — ₹80.05 lakh ITC reversed, no interest paid · ₹1.22–4.86 lakh
**Matrix J-02 · §50(3) r/w Rule 88B(3)**

| Month | 4(B)(2) "other reversals" ₹ | as % of that month's 4(A)(5) |
|---|---|---|
| **August 2025** | **80,05,163.54** | **73.56%** |
| October | 19,301.36 | 0.29% |
| January | 25,110.42 | 0.24% |
| March | 20,638.00 | 0.14% |
| **Year** | **80,70,213.32** | |

A single-month reversal of 73.56% of that month's credit, with **₹0 ever reclaimed**
in Table 4(D)(1) across the whole year. The credit was given up permanently.

**Corroboration:** in the same month, cash payment jumps from 4.23% of liability (July)
to **80.29%** — ₹1.18 crore paid in cash, because the credit ledger had just been
emptied. The two facts explain each other.

**Why interest is due.** Rule 88B(3) charges interest only where wrongly-availed credit
was **availed *and* utilised** — utilised meaning the credit-ledger balance fell below
the wrong availment. Here the test is not close:

> **The credit ledger closed at NIL in ten of twelve months** — the only non-nil
> closings are May (₹31,343) and June (₹5,21,082). Every rupee of credit was drawn
> down as it arrived.

So the reversed credit was unquestionably utilised, and **₹0 interest was declared in
Table 5.1 for the entire year**. Exposure depends on when the credit was originally
availed, which only the taxpayer's reversal working can establish:

| If the credit was availed in | Days utilised | Interest @18% ₹ |
|---|---|---|
| July 2025 | 31 | 1,22,380 |
| June 2025 | 62 | 2,44,761 |
| May 2025 | 92 | 3,63,193 |
| April 2025 | 123 | 4,85,573 |

**Action:** call for the August reversal working. ₹1,22,380 is the floor.

---

## FINDING 5 — September return filed late, no interest · ₹17,083
**Matrix J-01 · §50(1) r/w Rule 88B(1) · Parameter P11**

Liability-ledger debits against each 3B, versus the 20th-of-the-following-month due
date:

| Month | Ledger debit | Due | Delay |
|---|---|---|---|
| September 2025 | **24-Oct-2025** | 20-Oct-2025 | **+4 days** |
| All other 11 months | on or before due date | | 0 |

September net cash liability **₹86,60,200**. Interest at 18% for 4 days =
**₹17,083** (₹17,191 including the ₹54,601 of RCM cash). **Declared: nil.**

Eleven of twelve on time is good discipline, and this is a small amount — but
Table 5.1 shows **zero interest and zero late fee for the whole year**, so it was
not paid, and §50(1) is not discretionary.

---

## FINDING 6 — Invoices at abolished slabs after GST 2.0
**Matrix G-10 · CERTAIN but immaterial**

The 12% and 28% slabs ceased on **22-Sep-2025**. Three lines after that date still use
them, all to the same customer (`24AAJCR7354J1Z0`, Rishi Shipping):

| Invoice | Date | Rate | Taxable ₹ | Effect |
|---|---|---|---|---|
| `SSR/M/1157/25-26` | 28-Nov-2025 | 12% | 7,369.00 | ₹442 short of 18% |
| `SSR/M/1210/25-26` | 06-Dec-2025 | 12% | 3,200.00 | ₹192 short of 18% |
| `SSR/M/1210/25-26` | 06-Dec-2025 | **28%** | 37,265.62 | **₹3,727 over-collected** |

Before 22-Sep-2025, 16 lines at 12% and 8 at 28% — entirely proper under the old
structure. **The engine must not flag those**, which is the entire reason the HSN→rate
master is effective-dated. Tax collected in excess of the rate due is recoverable
under §76 and must be deposited, not retained.

---

# PART C — THREE FALSE POSITIVES, AND WHY THEY MATTER MORE THAN THE FINDINGS

A scrutiny engine's credibility is destroyed by its first wrong allegation, not earned
by its first right one. All three of these fire on a naive implementation of the
matrix. All three are wrong.

## C1. "250 breaches of the 30-day e-invoice limit" — a date-parsing artifact

Reading the `IRN Date` column as delivered produces **250 invoices reported beyond the
Rule 48(4) 30-day window** and **314 invoices with a *negative* reporting lag** — IRNs
generated before the invoice existed. A negative lag is physically impossible, and it
is the tell.

The column is **mixed-type**, and the split is diagnostic:

| Cell type | Count | Day component |
|---|---|---|
| String `'23-04-2025'` | 1,408 | **all** with day > 12 |
| Excel datetime | 635 | **only** days 1–12 |

The producing tool wrote the column in a locale that reads `dd-mm-yyyy` as `mm-dd-yyyy`.
Where the day exceeded 12 Excel could not coerce it and left a string; where the day was
12 or less it silently **transposed day and month**. Invoice `SSR/M/1439/25-26` dated
12-Jan-2026 carries an IRN date parsed as **01-Dec-2026** — a 323-day lag out of thin air.

**Correcting the transposition:**

| | Naive read | Corrected |
|---|---|---|
| Negative lags | 314 | **0** |
| IRNs beyond 30 days | **250** | **0** |
| Same-day reporting | — | 1,351 of 2,043 (66%) |
| B2B lines without any IRN | 1 | 1 (₹3,40,484 taxable, Nov) |

E-invoice discipline here is **excellent**: 2,043 of 2,044 B2B lines carry an IRN, two
thirds reported the same day, none late.

**The lesson for the build.** Two hundred and fifty fabricated notices, from one date
coercion. This is why `04_UI_SPEC.md` demands that every figure resolve to its source
cell, and why `02_INGESTION_AND_MATCHING.md` puts date coercion ahead of every rule. Add a
hard post-coercion invariant: **an acknowledgement date earlier than its document date
quarantines the row** — it never becomes a finding.

## C2. "Rule 86B breached in May and June" — the exemption the main clause hides

Tested on the bare rule, two months fail outright:

| Month | Taxable turnover | Liability | Paid in cash | Month cash % |
|---|---|---|---|---|
| May 2025 | ₹7.13 cr | ₹1,28,24,167 | **₹0** | **0.00%** |
| June 2025 | ₹7.43 cr | ₹1,33,30,322 | **₹0** | **0.00%** |

Turnover far above ₹50 lakh, zero cash, 100% discharged from the credit ledger. A
headline breach — and a demand of ₹2,61,545.

It is wrong. Clause (d) of the first proviso to Rule 86B exempts a person who has
already discharged **more than 1% of cumulative output liability in cash for the
financial year to date**. April's ₹12,69,228 of cash does exactly that:

| Month | Cumulative cash % | Verdict |
|---|---|---|
| April | 12.99% | exempt |
| May | **5.62%** | **exempt** |
| June | **3.53%** | **exempt** |
| … through March | never below 3.5% | exempt |

**Rule 86B does not bite in any month.** Implementing a statutory test without its
provisos does not produce a conservative engine; it produces a wrong one.

## C3. "Two invalid supplier GSTINs" — the validator is too narrow

Checksum validation across 483 counterparties flags two as structurally invalid:

- `24RKTO00351B1DX` — OC Water Wing, BSF Bhuj
- `24AAAGD0803M1D2` — DDO 153 Bn, BSF

Both are **genuine government TDS-deductor registrations**. Position 14 of a GSTIN is
`Z` for a normal taxpayer but **`D` for a §51 deductor** and `C` for a §52 collector.
A validator hard-coded to `Z` rejects every government department in the country.

These two are not suppliers at all — they appear in GSTR-2A TDS, deducting tax on
₹8.00 crore of payments to this taxpayer. **Fix the regex to accept `[ZDC]` at
position 14 before this reaches an officer.**

---

# PART D — WHAT DID *NOT* FIRE, AND WHY THAT IS THE REPORT

Silence is a result. An officer needs to know the engine looked.

| Check | Result |
|---|---|
| **R1 · GSTR-1 vs 3B liability** (G-02, Rule 88C) | **₹0.00 in all 12 months, head-wise.** Confirms the post-July-2025 hard-lock. No DRC-01B. |
| **R3 · 4(C) = 4(A) − 4(B)** | Holds exactly, all 12 months. The return is internally well-formed. |
| **R2 · 2B vs 3B ITC** (B-01, Rule 88D) | Annual ITC claimed ₹12,90,38,224 vs 2B available ₹12,92,86,092 — **under-claimed by ₹2,47,867.** April under-claims ₹22.67 lakh, May over-claims ₹22.01 lakh: a one-month carry-forward, net ₹66,222. May's excess is 20.7% of that month's 2B but **₹22.01 lakh, below the ₹25 lakh Rule 88D floor** — no DRC-01C. |
| **Table 4(D)(2) vs 2B unavailable lines** | Matches to **₹0.00 in all 12 months** (₹39,800 for the year, all POS-rule). Exemplary reporting. |
| **D-01 · place of supply vs tax head** | 2,044 outward and 4,538 inward lines: **zero** mismatches, both directions. |
| **C-02 · RCM liability vs RCM credit** | Liability ₹9,45,079 against credit ₹9,37,123 — liability exceeds credit. Correct direction. |
| **B-09 · import IGST** | 2B IMPG ₹21,150 = 3B Table 4(A)(1) ₹21,150 exactly. One BoE, port INBOM4. |
| **B-08 · duplicate ITC** | Zero duplicate (supplier GSTIN + invoice number) keys across 4,538 lines. |
| **R8 · ledger integrity** | Credit ledger 48 rows, cash ledger 65 rows — **zero continuity breaks.** |
| **G-14 · TDS-implied turnover** | ₹16.54 crore subjected to §51 TDS against ₹138.65 crore declared (11.93%). Correct direction — no suppression signal. |
| **F-01 · Rule 42/43** | Nil exempt and nil non-GST outward all year, so no apportionment arises. Reversal of ₹2,69,618 under 4(B)(1) is consistent. |
| **2A vs 2B population** | 21 records in 2A absent from 2B, tax ₹1,02,447 — late supplier filings, **not claimed**. Correct treatment under §16(2)(aa). |

### A correction to `06_WORKBOOK_ANATOMY.md`

That note recorded GSTR-1 as incomplete — no B2C, export, SEZ or advance tables — and
concluded R1 could not be computed. **That was wrong, and the data disproves it.**
GSTR-1 B2B plus credit/debit notes equals 3B Table 3.1(a) **to the paisa in all twelve
months**, which is only possible if there are no B2C, export or SEZ supplies at all.
The missing sheets are genuinely nil sections the GSP omitted. **R1 is fully
computable and reconciles.**

The engineering point survives, restated correctly: the platform must distinguish
**"section absent because nil"** from **"section absent because not supplied"** — and
it can, by testing whether the sections present sum to the auto-populated 3B total.
Where they do, mark the remainder nil and run the identity; where they do not, report
`NOT_EVALUATED`. Do not guess in either direction.

---

# PART E — WHAT THIS CASE CHANGES IN THE BUILD

1. **Self-contradiction detection is a rule family, and the spec does not have it.**
   Finding 1 was found because the taxpayer invoiced one supply two ways in four days.
   No single-source check catches that. Add **`OUT-21 — same counterparty, same
   taxable value, different rate, within N days`** and **`OUT-22 — credit note whose
   number references an invoice that was re-raised at a different rate`**. On this file
   they are worth ₹1.91 crore, more than every other finding combined.

2. **Rule 37A is the highest-yield rule per hour of engineering, as predicted.** One
   join, one column, ₹95.80 lakh, `CERTAIN` confidence, nothing asked of the taxpayer.
   Build it first and demo it second.

3. **Implement provisos, not just main clauses.** Rule 86B without clause (d) of its
   first proviso produces a confident wrong demand. Every rule needs its exemption set
   modelled, and where an exemption cannot be tested from GST data the finding must
   drop to `ADVISORY` with an officer confirmation prompt.

4. **Date coercion needs invariants, not just parsers.** Mixed-type date columns with
   silent day/month transposition are not an edge case — they are what a GSP export
   looks like. Post-coercion invariants (`ack_date ≥ doc_date`, `filing_date ≥
   period_end`, `valid_upto ≥ ewb_date`) must quarantine the row before any rule sees it.

5. **Multi-period netting before any demand.** April's ₹22.67 lakh under-claim and
   May's ₹22.01 lakh over-claim are one event. A single-period engine raises a
   ₹22 lakh DRC-01C and loses it.

6. **Widen the GSTIN validator to `[ZDC]` at position 14** and treat deductor and
   collector registrations as a distinct counterparty class.

7. **Credit notes need their own module.** ₹8.21 crore of credit notes for the year
   (5.92% of turnover), spiking to 34.27% in November, **none carrying an original
   invoice reference** — because the current GSTR-1 CDNR format no longer has that
   field. So §34(2) time-limit testing (H-01) and invoice linkage (H-02) are
   **structurally impossible from GSTR-1 alone.** The engine must report that as
   `NOT_EVALUATED —original-invoice linkage not available in CDNR format; call for notes`
   rather than passing the check in silence.

8. **The related-party signal came from a name, not a PAN.** SSR Marine and SSR
   Shipyard have different PANs. Add fuzzy trade-name clustering alongside the PAN,
   address, bank and promoter joins in `REG-03`/`REG-04` — and label it a lead.

---

## Reading this case against the two scores

**F-Score inputs:** six findings, ₹3.05 crore quantified, two `CERTAIN`, two `STRONG`,
one `ADVISORY`. Dimension weight falls on **LIABILITY** (Finding 1) and **CREDIT**
(Finding 2).

**P-Score inputs from this file:** P07 (ITC discharge ratio) is high in May–July at
100%; P14 (2B vs 3B) is negative — under-claimed, so it does **not** flag; P24 flags on
the SSR Shipyard relationship; P31 (credit-note ratio) flags on November; P11 flags on
one late return. **P-coverage is 21 of 34** — P02, P15, P20, P23, P25–P28, P33 and P34
stay dark until ICEGATE, DGARM, the refund module and the income-tax feed are
connected.

The two scores disagree about this taxpayer, and **that disagreement is the finding.**
On audit-selection parameters the file looks unremarkable: returns filed, ledgers
clean, R1 and R3 exact, no duplicate ITC, no POS errors, e-invoicing near-perfect. It
would not have been picked. The ₹1.91 crore sits in a **classification decision the
taxpayer documented themselves** and the ₹95.80 lakh sits in **another taxpayer's
unfiled return**. Neither is visible to a parameter that only reads ratios.

That is the argument for building both layers, and for never fusing them into one
number.
