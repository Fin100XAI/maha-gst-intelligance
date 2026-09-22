# 01 — RULEBOOK
### 34 audit parameters · 141 scrutiny checks · 12 self-contradiction rules · one engine

Three catalogues, one execution model:

| Layer | Source | Count | Answers |
|---|---|---|---|
| **P01–P34** | CBIC/DGARM audit risk parameters | 34 | *Who should we audit?* |
| **A–L matrix** | The CS/departmental scrutiny matrix | 141 | *What is wrong, and under which provision?* |
| **X-01–X-12** | Self-contradiction family (new) | 12 | *Where has the taxpayer's own record contradicted itself?* |

The X family is new in this revision. It exists because the worked case in
`07_WORKED_SCRUTINY_CASE.md` found **₹1.91 crore — more than every other finding
combined — in a four-day invoice sequence that no single-source check in either of the
other two catalogues would have caught.** It is now the first family to implement.

---

## 1. The execution tier — read this before anything else

The platform ingests **GST returns**. It does not ingest a general ledger, a fixed-asset
register, contracts or an annual report. Pretending otherwise is how scrutiny software
loses officer trust in week three. So every check declares a tier, and the tier decides
what the engine is allowed to output:

| Tier | Count | Engine output | Meaning |
|---|---|---|---|
| **AUTO** | 41 | `Finding` with a head-wise rupee figure and a `calc_id` | Computable end to end from ingested returns |
| **ASSISTED** | 46 | `DocumentCall` — the partial working plus the exact document required | The engine computes what it can and names what it needs |
| **MANUAL** | 43 | `ChecklistItem` — guidance, no computation | Contract or judgement driven |
| **CASE** | 11 | Consumed by the limitation/section engine, not a detection rule | Module K is post-finding machinery |

**An ASSISTED check never becomes a demand on its own.** It produces a call-book entry
naming the document — *"produce the fixed-asset register for FY 2025-26 to test E-09"* —
with whatever partial figure the returns support. That is a real deliverable to an
officer, and it is honest about its own limits.

**A MANUAL check never produces a number at all.** It appears on the officer's checklist
with the legal test and the action point, and nothing else.

## 2. Confidence, and what may reach a notice

| Confidence | Meaning | May populate |
|---|---|---|
| `CERTAIN` | Arithmetic identity over complete data | Draft notice |
| `STRONG` | Statutory test satisfied on complete data | Draft notice |
| `ADVISORY` | Needs officer judgement or an untested exemption | Worklist only |

An `ADVISORY` finding reaching a notice template without an explicit human promotion
step is a build failure. That single constraint is what keeps the platform defensible.

## 3. Provisos are part of the rule

**A statutory test implemented without its exemptions is not conservative — it is
wrong.** In the worked case, Rule 86B fired on two months with ₹0 cash against ₹7 crore
turnover. It was a false positive: clause (d) of the first proviso exempts anyone
already above 1% *cumulative* cash for the year, and April's payment put them at 5.62%.

Every rule declares an `exemptions` list. Each exemption is either:
- **TESTABLE** from returns → the engine applies it and suppresses the finding, showing
  the suppression on screen with its own `calc_id`; or
- **UNTESTABLE** from returns → the finding drops to `ADVISORY` with an officer
  confirmation prompt naming the exemption.

Never silently ignore an exemption. Never silently apply one.

## 4. Multi-period netting before any demand

Rules run over a **rolling window**, not a single period. In the worked case April
under-claimed ITC by ₹22.67 lakh and May over-claimed by ₹22.01 lakh — one carry-forward
event, net ₹66,222. A single-period engine raises a ₹22 lakh DRC-01C and loses it.

```
for each rule:
    evaluate per period                     → raw deltas
    net across the window (default 3 periods, configurable per rule)
    if |net| < |raw| by more than netting_tolerance:
        emit ONE finding on the net, with the constituent periods as evidence
        and status NETTED, showing both figures on the card
```

## 5. Peer cohorts need a cohort

Sixteen of the 34 parameters band by **percentile within a peer cohort**. With one
taxpayer ingested there is no cohort, and a percentile computed over n=1 is meaningless.

```
cohort_size >= min_cohort (default 30)  → RATIO_PEER, percentile banding
cohort_size <  min_cohort               → fall back to SELF_HISTORY:
                                          band on the taxpayer's own 12-period
                                          distribution + YoY change, and mark the
                                          parameter LOW_CONFIDENCE on the card
```

Never present a percentile derived from a cohort smaller than `min_cohort`. Show the
cohort size next to every peer-banded flag.

---

## 6. P01–P34 — the audit risk parameters

Flag 0–4 per parameter. The source document defines the flag levels as increasing risk
but **prescribes no cut-offs**, so the platform's defaults are configurable,
effective-dated and awaiting departmental approval. Say that on screen.

```
P-SCORE  = 100 × Σ(flag × weight) ÷ Σ(4 × weight)   over EVALUATED parameters only
COVERAGE = evaluated ÷ 34          ← displayed adjacent, at equal visual weight
BAND     = LOW 0-25 · MODERATE 26-50 · HIGH 51-75 · SEVERE 76-100
```

Banding strategies: `RATIO_PEER` (p60/p75/p90/p97, with the fallback above) ·
`RATIO_ABS` (fixed cut-offs) · `DELTA_YOY` (5/10/20/35 pp) · `COUNT` · `BINARY` ·
`EXTERNAL` (needs a non-GST feed → `NOT_EVALUATED`, excluded from **both** sides of the
score so coverage falls instead of the score understating risk).

| ID | Metric (GSTR table references) | Band | Dir | Tier |
|---|---|---|---|---|
| P01 | `3B 3.1(a)+(b)+(c)` vs `3B T5 + 3B 3.1(d) + 2B taxable + imports`; flag when sales < purchases, and on the YoY ratio | ABS + YOY | LOW | AUTO |
| P02 | IGST paid at import (customs) − ITC in `4A(1)+(2)`; flag positive | ABS | HIGH | EXTERNAL |
| P03 | `3.1(c) ÷ (3.1(a)+(b)+(c))` + YoY | PEER + YOY | HIGH | AUTO |
| P04 | `3.1(b) ÷ (3.1(a)+(b)+(c))` | PEER | HIGH | AUTO |
| P05 | `3.1(d) ÷ (3.1(a)+(b)+(c))` + YoY | PEER + YOY | HIGH | AUTO |
| P06 | RCM liability per 2A T4 − [`3.1(d)` tax − `4A(2)`]; flag positive | ABS | HIGH | AUTO |
| P07 | `tax paid through ITC (6.1 c3–6) ÷ total payable (6.1 c2)` | PEER | HIGH | AUTO |
| P08 | `cash paid (6.1 c8) ÷ total liability (6.1 c2)` | PEER | LOW | AUTO |
| P09 | Avg monthly taxable turnover `3.1(a)+(b)+(c)`, YoY decline | YOY | LOW | AUTO |
| P10 | `3.1(e) ÷ (3.1(a)+(b)+(c)+(e))` + YoY | PEER + YOY | HIGH | AUTO |
| P11 | Count of returns filed late in the FY; flag > 6 | COUNT | HIGH | AUTO |
| P12 | Count of returns **not filed** in the FY *(source phrasing ambiguous — log in DECISIONS.md)* | COUNT | HIGH | AUTO |
| P13 | SEZ **and** non-SEZ registration on the same PAN in the same State | BINARY | — | AUTO |
| P14 | `3B 4A(5) − 2B available`; flag positive | ABS | HIGH | AUTO |
| P15 | `4A(1)` − IGST paid to Customs; flag positive | ABS | HIGH | EXTERNAL |
| P16 | `Σ 3.1(d) tax ÷ Σ 4A(2)+4A(3)`; flag when **< 1** | ABS | LOW | AUTO |
| P17 | `4A(4) ISD ÷ total 4A` + YoY | PEER + YOY | HIGH | AUTO |
| P18 | `4B ÷ 4A` + YoY | PEER + YOY | HIGH | AUTO |
| P19 | exempt ratio `3.1(c)÷(3.1(a)+(b)+(c))` vs reversal ratio `4B(1)÷4A` | ABS | HIGH | AUTO |
| P20 | GSTR-1 T6(A) export value vs shipping-bill data | EXTERNAL | HIGH | EXTERNAL |
| P21 | `R1 T6(B) SEZ ÷ total turnover` + YoY | PEER + YOY | HIGH | AUTO |
| P22 | `R1 T6(C) deemed exports ÷ total turnover` + YoY | PEER + YOY | HIGH | AUTO |
| P23 | `[3.1(b) − customs export value] ÷ [3.1(a)+(b)]` + YoY | PEER + YOY | HIGH | EXTERNAL |
| P24 | Count and aggregate risk of other GSTINs on the same PAN | COUNT | HIGH | AUTO |
| P25 | IGST refund claimed | PEER | HIGH | EXTERNAL |
| P26 | LUT export refund claimed | PEER | HIGH | EXTERNAL |
| P27 | Inverted-duty refund claimed | PEER | HIGH | EXTERNAL |
| P28 | Appears in DGARM Red Flag Report 2/3/4/5 | BINARY | — | EXTERNAL |
| P29 | `ITC-04 T4 turnover ÷ total taxable turnover (3B)` | PEER | HIGH | AUTO |
| P30 | Selected on risk criteria in the previous cycle | BINARY | — | AUTO |
| P31 | `Σ credit notes (R1 T9) ÷ 3B 3.1(a)+(b)+(c)` | PEER | HIGH | AUTO |
| P32 | `Σ debit notes (R1 T9) ÷ 3B 3.1(a)+(b)+(c)` | PEER | HIGH | AUTO |
| P33 | `3B turnover − ITR turnover` | EXTERNAL | HIGH | EXTERNAL |
| P34 | Negligible income tax paid against substantial 3B turnover | EXTERNAL | HIGH | EXTERNAL |

Each parameter also carries the **auditor action point verbatim** from the source
document — render it on the flag ladder, unedited. It is what tells the officer what to
do next, and it is the department's own language.

---

## 7. X-01 to X-12 — self-contradiction (NEW, build first)

The highest-yield family in this rulebook. These find cases where **the taxpayer's own
records disagree with each other** — which is evidentially far stronger than a
threshold breach, because there is no peer band to argue about and no external feed to
wait for.

| ID | Rule | Deterministic test | Threshold | Sev | Conf |
|---|---|---|---|---|---|
| **X-01** | Same supply invoiced at two rates | Same counterparty + same taxable value ± tolerance + different `rate`, within N days | N=30, Δrate>0 | CRITICAL | STRONG |
| **X-02** | Credit note naming a re-rated invoice | CN document number contains the digits of an invoice number that was re-raised at a different rate or HSN | any | CRITICAL | STRONG |
| **X-03** | One HSN, two rates, one period | Same HSN/SAC at two different rates in the same tax period, with no rate notification effective in that period | Δ value > ₹1 L | HIGH | ADVISORY |
| **X-04** | Same supply, goods and service HSN | Identical description or value billed under both a goods chapter (01–98) and a service SAC (99xxxx) | any | HIGH | ADVISORY |
| **X-05** | Rate break in a recurring series | A counterparty's recurring same-value milestone series changes rate mid-contract | any | CRITICAL | STRONG |
| **X-06** | Re-invoicing after a credit note | CN to a party followed by an invoice of the same value to the same party within 120 days | value > ₹1 L | HIGH | STRONG |
| **X-07** | POS rule contradicts the HSN class | POS declared per §12(2) (recipient location) while the HSN is a goods heading, or per §10 while the SAC is a service | any | HIGH | ADVISORY |
| **X-08** | Implausible quantity for a goods HSN | Goods HSN with `quantity ≤ 5` against value > ₹1 crore, or UQC = OTH on a goods heading | any | MEDIUM | ADVISORY |
| **X-09** | Cancelled and re-raised cheaper | Document cancelled in Table 13 and a replacement to the same party at a lower effective rate | any | HIGH | STRONG |
| **X-10** | Third-party value exceeds declared | GSTR-7/8 payment value from a party > net supply declared to that party | Δ > ₹1 L | HIGH | STRONG |
| **X-11** | Reversal without interest | Material `4B(2)` reversal in a period where the credit ledger ran at nil, with `5.1` interest = 0 | reversal > ₹1 L | HIGH | CERTAIN |
| **X-12** | Amendment reduces tax after payment | Amendment table (9A/9C, B2BA) reducing tax on a document already discharged in an earlier period | Δ > ₹25 K | HIGH | STRONG |

### X-01 / X-05 worked, exactly as they must be implemented

```
INPUTS   outward lines for the window, grouped by counterparty_gstin
COMPUTE  for each counterparty C:
    bucket lines by round(taxable_value, 0)            # exact-value clustering
    for each bucket with >= 2 distinct rates:
        r_hi, r_lo   = max(rate), min(rate)
        gap_days     = min pairwise |doc_date difference|
        if gap_days <= p.window_days (30):
            affected = every line to C at r_lo, for the whole FY, same HSN class
            exposure = Σ affected.taxable_value × (r_hi − r_lo) / 100
            EMIT X-01, severity CRITICAL, confidence STRONG
EVIDENCE the full invoice sequence in date order, and any credit note whose
         document number contains the digits of the higher-rated invoice
GOTCHA   Do NOT restrict the exposure to the two contradicting invoices. The
         contradiction is the DETECTION; the exposure is every later line that
         adopted the lower rate. In the worked case that is the difference between
         ₹47.7 lakh and ₹1.91 crore.
NOTE     This rule identifies a rate DISPUTE, not a rate ERROR. The card must say so:
         the taxpayer may be right. It routes to ASMT-10 for the contract, never
         straight to DRC-01A.
```

### X-11, which needs the daily ledger

```
for each period with 4B(2) reversal > threshold:
    daily_min_balance = min(credit_ledger.balance(head)) over the period   # DAILY grain
    if daily_min_balance < reversal_amount:  → the credit was UTILISED
        interest_days = (reversal_date − first_utilisation_date).days
        interest = utilised × rate(on=first_utilisation_date) × days ÷ 365
        compare against 3B Table 5.1 interest declared
    else: → availed but never utilised: reversal only, NO interest
GOTCHA   That distinction is litigated constantly. A period-end snapshot gets it
         wrong. Store ledger movements at DAILY grain from Phase 1.
```

---

## 8. The A–L scrutiny matrix — 141 checks

Transcribed from the departmental/CS matrix. `Tier` per §1. Status, exposure and remarks are filled by the engine and the officer. Module K is the case engine (§11), not detection.

### A. Data Integrity — 3 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **A-01** | GSTIN master validation | Rule 10A/21A | Check each vendor/customer GSTIN active on invoice date; flag cancelled (incl. retrospective), suspended, composition | Any mismatch | High | AUTO |
| **A-02** | Period & return filing completeness | s.37/39/44 | All GSTR-1/3B/9/9C filed for all periods; compute delay days | Any non-filing | Med | AUTO |
| **A-03** | Books vs return data completeness | — | Sum of registers = GL control accounts; all GSTINs of PAN covered | Diff > ₹1,000 | Med | ASSISTED |

### B. ITC Eligibility (s.16) — 11 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **B-01** | ITC claimed vs GSTR-2B | s.16(2)(aa), Rule 36(4) | Line-level match: GSTIN+Inv No+Date+Taxable+Tax; ITC in 3B > 2B → excess | Diff > ₹1,000/month or > … | High | AUTO |
| **B-02** | ITC in books but not in 2B | s.16(2)(aa) | Invoices in books absent in 2B/IMS | Any | Med | ASSISTED |
| **B-03** | Receipt of goods/services | s.16(2)(b) | Invoice without GRN/EWB for goods; bill-to-ship-to documentation | Any | High | ASSISTED |
| **B-04** | Supplier tax payment (Rule 37A) | s.16(2)(c), Rule 37A; Suncraft Energy (Cal HC; … | Vendor 3B not filed by 30 Sept of next FY → reverse by 30 Nov. Defence: ITC cannot be denied to bona fide buyer solely for supplier default without f… | Any | High | AUTO |
| **B-05** | Payment within 180 days | Rule 37, s.16(2) 2nd proviso | Unpaid value > 180 days from invoice date (excl. RCM, deemed supply) | Any | High | ASSISTED |
| **B-06** | Depreciation on tax component | s.16(3) | Capital goods where ITC claimed AND GST capitalised in cost | Any | High | ASSISTED |
| **B-07** | Time limit for ITC | s.16(4), 16(5), 16(6) | Claimed after earlier of 30 Nov next FY / annual return date; DN date used for DN | Any | High | AUTO |
| **B-08** | Duplicate ITC | s.16 | Same GSTIN+Inv No claimed twice / across GSTINs / periods | Any | High | AUTO |
| **B-09** | Import IGST | s.16, Rule 36(1)(d) | BoE IGST in books = 2B = 3B | Diff > ₹1,000 | Med | AUTO |
| **B-10** | ITC on invoices from cancelled/composition vendors | s.16, s.10(4) | Tax charged by composition dealer or post-cancellation invoice | Any | High | AUTO |
| **B-11** | Document validity | s.16(2)(a), Rule 36 | Mandatory particulars present (Rule 46): GSTIN, HSN, POS, tax break-up; e-invoice IRN where supplier mandated | Any | Med | ASSISTED |

### C. RCM — 5 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **C-01** | RCM liability identification | s.9(3), 9(4); Notfn 13/2017-CT(R) | Map GTA, legal, security, director sitting fees, sponsorship, renting by URP, import of services; compute liability | Any unpaid | High | ASSISTED |
| **C-02** | RCM ITC after payment | s.16, Rule 36(1)(b) | ITC on RCM ≤ RCM tax paid in cash in same/earlier period | ITC > paid | High | AUTO |
| **C-03** | RCM self-invoice | s.31(3)(f), Rule 47A | Self-invoice issued within 30 days of receipt of supply | Delay | Low | MANUAL |
| **C-04** | Import of services | s.5(3) IGST, s.13 | All foreign service payments offered to RCM (IGST). From 30.03.2026 commission/agency paid to foreign intermediaries also under RCM (POS = recipient … | Any gap | High | ASSISTED |
| **C-05** | Metal scrap from unregistered & TDS on scrap | Notfn 6/2024-CT(R) (RCM, w.e.f. 10.10.2024); No… | Metal scrap bought from URD → RCM + self-invoice; registered scrap purchases → TDS 2% deducted, GSTR-7 filed | Any | Med | ASSISTED |

### D. Place of Supply — 8 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **D-01** | Tax head vs state codes | IGST s.7, 8 | Supplier state ≠ POS → IGST; same → CGST+SGST; mismatch flagged | Any | High | AUTO |
| **D-02** | Hotel/immovable property services | IGST s.12(3) | POS = location of property; out-of-state CGST/SGST → ITC not available to recipient | Any | Med | MANUAL |
| **D-03** | Restaurant/catering, training, events | IGST s.12(4)(5)(7) | Services performed in other state with other state CGST/SGST | Any | Med | MANUAL |
| **D-04** | Goods transport / passenger transport | IGST s.12(8)(9) | POS per recipient location (registered) / boarding point; head consistency | Any | Low | MANUAL |
| **D-05** | Bill-to-ship-to goods | IGST s.10(1)(b) | POS = principal place of 'bill-to' party; verify tax head | Any | Med | AUTO |
| **D-06** | B2C recipient address | IGST s.10(1)(ca) | B2C inter-state: recipient state recorded; else POS = supplier location | Missing | Low | MANUAL |
| **D-07** | Export of services conditions | IGST s.2(6), s.13 | s.2(6) conditions incl. FX realisation and not merely establishments of distinct person. Intermediary: up to 29.03.2026 POS = supplier location (s.13… | Any failing | High | ASSISTED |
| **D-08** | SEZ supplies | IGST s.16 | SEZ supplies as zero-rated under LUT or IGST; endorsement proof | Any | Med | ASSISTED |

### E. Blocked Credits s.17(5) — 15 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **E-01** | Motor vehicles ≤13 seats | s.17(5)(a),(ab) | ITC on cars and their repairs/insurance unless used for further supply, passenger transport, driving training | Any | High | MANUAL |
| **E-02** | Vessels & aircraft | s.17(5)(aa),(ab) | ITC except permitted uses | Any | High | MANUAL |
| **E-03** | Food, beverages, outdoor catering | s.17(5)(b)(i) | ITC unless obligatory under law or same line of outward supply | Any | High | MANUAL |
| **E-04** | Beauty, health, cosmetic surgery | s.17(5)(b)(i) | Blocked unless same line of outward supply. Note: beauty/wellness now 5% without ITC w.e.f. 22.09.2025 (Notfn 15/2025-CT(R)) | Any | Med | MANUAL |
| **E-05** | Life & health insurance | s.17(5)(b)(i) | Individual life & health policies exempt w.e.f. 22.09.2025 (no ITC issue). Group / employer policies: ITC blocked unless obligatory under law (s.17(5… | Any | Med | MANUAL |
| **E-06** | Club / fitness membership | s.17(5)(b)(ii) | Any ITC | Any | Med | MANUAL |
| **E-07** | Rent-a-cab | s.17(5)(b)(i) | Cab hire ITC unless obligatory / same outward supply | Any | Med | MANUAL |
| **E-08** | Employee travel benefits (LTC/vacation) | s.17(5)(b)(iii) | Any ITC | Any | Med | MANUAL |
| **E-09** | Works contract - immovable property | s.17(5)(c) | ITC on works contract services for construction of immovable property (other than 'plant and machinery') blocked, except where it is input service fo… | Any | High | ASSISTED |
| **E-10** | Construction on own account | s.17(5)(d); Expl. 2 inserted by FA 2025 (retro … | 'plant or machinery' substituted by 'plant and machinery' retrospectively from 01.07.2017 - overrides functionality test of Safari Retreats (SC, 03.1… | Any | High | ASSISTED |
| **E-11** | Composition tax / NRTP | s.17(5)(e),(f) | ITC on goods/services where tax paid under composition or by NRTP (except imports) | Any | Med | MANUAL |
| **E-12** | CSR expenditure | s.17(5)(fa) | ITC on CSR spend (from 1.10.2023) | Any | High | ASSISTED |
| **E-13** | Personal consumption | s.17(5)(g) | Director/employee personal expenses | Any | Med | MANUAL |
| **E-14** | Lost/stolen/destroyed/written off/gifts/samples | s.17(5)(h) | ITC on inputs so disposed; free samples/gifts | Any | High | ASSISTED |
| **E-15** | Tax paid under s.74/74A | s.17(5)(i) | ITC claimed on tax paid in fraud proceedings | Any | Med | MANUAL |

### F. Reversals & Apportionment — 7 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **F-01** | Common credit - exempt turnover | s.17(2), Rule 42/43 | Compute D1/D2/C3; exempt T/O incl. land/building sale, securities @1% of sale value, interest (non-banks) | Diff > ₹1,000 | High | AUTO |
| **F-02** | Non-business use | s.17(1) | Common ITC used for non-business purposes (D1 5%-type computation) | Any | Med | ASSISTED |
| **F-03** | Banks/NBFC 50% option | s.17(4), Rule 38 | Option applied consistently for full FY; exclusions for inter-GSTIN supplies | Inconsistency | High | ASSISTED |
| **F-04** | Capital goods sold within 5 yrs | s.18(6), Rule 44(6) | Pay higher of ITC reduced 5%/quarter or tax on transaction value | Any | Med | ASSISTED |
| **F-05** | Registration cancellation / composition switch | s.18(4), s.29(5), Rule 44 | ITC on stock & capital goods reversed | Any | High | ASSISTED |
| **F-06** | Rule 86B cash payment | Rule 86B | Taxable T/O > ₹50 lakh/month: min 1% cash unless exemption | Breach | Med | AUTO |
| **F-07** | ISD distribution | s.2(61), s.20, Rule 39 | Common third-party input services distributed via ISD (mandatory from 1.4.2025); pro-rata by turnover | Any gap | Med | AUTO |

### G. Outward Supplies — 15 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **G-01** | Turnover reconciliation | s.35, s.44 | Books = GSTR-1 = 3B = GSTR-9 (Table 4/5) | Diff > ₹10,000 or 0.1% | High | AUTO |
| **G-02** | GSTR-1 vs 3B liability | Rule 88C | Month-wise liability; 1 > 3B | Beyond threshold | High | AUTO |
| **G-03** | e-invoice vs GSTR-1 | Rule 48(4) | All B2B invoices above threshold have IRN; IRN value = GSTR-1 | Any | High | AUTO |
| **G-04** | e-invoice applicability & 30-day limit | Notfn 13/2020-CT; 10/2023 | AATO > ₹5 cr → mandatory; AATO ≥ ₹10 cr → report within 30 days | Any | Med | AUTO |
| **G-05** | E-way bill vs sales | Rule 138 | EWB generated without invoice in GSTR-1 → suppressed sales | Any | High | AUTO |
| **G-06** | Other income scan | s.7, s.15 | Taxability of scrap sale, asset sale, rent, late-payment interest (s.15(2)(d)), notice pay, canteen recovery, commission, mgmt fees. LD/penalties for… | Any untaxed | High | ASSISTED |
| **G-07** | Schedule I deemed supplies | Sch. I, Rule 28 | Stock transfer to other GSTIN; RP supplies w/o consideration; gifts to employee > ₹50k | Any | High | ASSISTED |
| **G-08** | Related party valuation | s.15(4), Rule 28 | RP transaction value vs open market; full ITC buyer exception (2nd proviso Rule 28) | Deviation | Med | ASSISTED |
| **G-09** | Advances received | s.12, s.13 | Tax on advances for services; not for goods (Notfn 66/2017) | Any | Med | ASSISTED |
| **G-10** | Rate & HSN validation | Rate notfns; s.14 | HSN-rate master check; rate change at 22.9.2025 (GST 2.0) applied per s.14 time-of-supply | Any | High | AUTO |
| **G-11** | Exempt/nil/non-GST classification | s.11, exemption notfns | Exemption entry validity; condition compliance | Any | Med | AUTO |
| **G-12** | Invoice series gaps | Rule 46(b) | Missing/cancelled invoice numbers | Any | Med | AUTO |
| **G-13** | Exports - LUT & realisation | s.16 IGST, Rule 96A | Valid LUT; realisation within time; else pay IGST | Any | High | ASSISTED |
| **G-14** | TDS/TCS credits vs turnover | s.51, s.52 | Turnover implied by TDS/TCS ≤ declared turnover | Any | Med | AUTO |
| **G-15** | Amendment time limit | s.37(3), s.39(9) | Amendments made within 30 Nov next FY | Late | Low | AUTO |

### H. Credit & Debit Notes — 8 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **H-01** | CN time limit | s.34(2) | CN issued / declared by earlier of 30 Nov next FY or annual return | Late | High | ASSISTED |
| **H-02** | CN linkage to invoice | s.34(1), Circ 212/2024 | Each CN linked to original invoice(s) | Missing | Med | AUTO |
| **H-03** | Recipient ITC reversal for tax reduction | s.34(2) proviso subst. by FA 2025 w.e.f. 01.10.… | CNs from 01.10.2025: output reduction only if registered recipient reversed attributable ITC (IMS accept); IMS-rejected CN adds back to supplier liab… | Unproved | High | AUTO |
| **H-04** | Post-sale discounts | s.15(3)(b); Circ 92/2019, 251/08/2025; FA 2026 … | Until FA 2026 amendment notified: pre-agreement + invoice linkage + recipient ITC reversal. Financial/commercial CN: no output reduction, and recipie… | Non-compliant | High | ASSISTED |
| **H-05** | Books CN vs GST CN | — | Financial CNs (no GST) vs GST CNs - explain difference | Diff | Low | MANUAL |
| **H-06** | Purchase-side CNs | s.16, s.34 | CNs received in 2B reversed in 3B; IMS rejected/pending CNs tracked | Any | High | AUTO |
| **H-07** | Debit notes - ITC time limit | s.16(4) as amended by FA 2020 w.e.f. 01.01.2021 | Time limit reckoned from DN date, not original invoice | Mis-applied | Low | ASSISTED |
| **H-08** | Unusual CN pattern | — | High CN % to same party / year-end CNs reversing sales | > 10% of party sales | Med | ASSISTED |

### I. Annual Report Linkages — 8 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **I-01** | Capex additions vs capital goods ITC | s.17(5)(c)(d) | Building/civil CWIP with ITC; P&M classification | Any | High | ASSISTED |
| **I-02** | Expense heads vs 3CD cl.44 | s.16, s.17 | ITC claimed on expenses shown as unregistered/exempt/composition in cl.44 | Any | High | ASSISTED |
| **I-03** | Inventory losses & write-offs | s.17(5)(h) | Shortages, obsolescence, destruction written off without ITC reversal | Any | High | ASSISTED |
| **I-04** | Trade payables > 180 days | Rule 37 | Cross-check with ITC reversal | Any gap | High | ASSISTED |
| **I-05** | Year-end accruals | s.16(2)(a) | ITC claimed on provisions without invoice | Any | Med | MANUAL |
| **I-06** | Bad debts written off | s.34 | Output tax reduced without valid CN | Any | Med | MANUAL |
| **I-07** | Contingent liabilities & CARO (vii) | — | Disputed/undisputed GST dues, pending notices captured | Any | Med | MANUAL |
| **I-08** | Deferred revenue / unbilled revenue | s.12, s.13, s.31 | Time of supply triggered on milestones/due date vs invoicing | Any | Med | MANUAL |

### J. Interest, Fees, Payments — 4 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **J-01** | Interest on delayed payment | s.50(1), proviso | 18% on net cash liability paid late | Any | Med | AUTO |
| **J-02** | Interest on wrong ITC availed & utilised | s.50(3), Rule 88B | 18% only when ITC utilised (ledger balance below wrong ITC) | Any | High | AUTO |
| **J-03** | Late fees | s.47 | GSTR-1/3B/9 late fee computation | Any | Low | AUTO |
| **J-04** | DRC-03 mapping | Rule 142(2) | Each voluntary payment mapped to issue & period; ledger debit correct | Unmapped | Low | AUTO |

### K. Sec 73 / 74 / 74A Applicability — 11 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **K-01** | Proceeding section by FY | s.73, 74 (up to FY 2023-24); s.74A (FY 2024-25 … | FY ≤ 2023-24 → s.73 (non-fraud) / s.74 (fraud); FY ≥ 2024-25 → s.74A | Every flagged issue | High | CASE |
| **K-02** | Fraud / suppression indicators | s.74 Expl. 2; s.74A; Uniworth Textiles (2013) 9… | Fake invoices / ITC without supply, non-existent vendor, circular trading, non-declaration in returns, not furnishing info on request, wilful misstat… | Any Y | High | CASE |
| **K-03** | Limitation - SCN & order | s.73(2)(10), 74(2)(10), 74A(2)(10) | 73: order 3 yrs, SCN 3 months earlier; 74: order 5 yrs, SCN 6 months earlier; 74A: SCN 42 months, order 12 months from SCN (+6 extendable) | SCN after deadline | High | CASE |
| **K-04** | s.74A de minimis | s.74A(1) proviso | No SCN under s.74A where tax involved in a FY < ₹1,000 | < ₹1,000 | Low | CASE |
| **K-05** | COVID extension (s.73 only) | Notfn 13/2022, 9/2023, 56/2023 (s.168A); Tata P… | Order deadlines: FY17-18 31.12.2023; FY18-19 30.04.2024; FY19-20 31.08.2024. Validity sub judice before SC - plead limitation where orders rely on th… | Order after date | Med | CASE |
| **K-06** | Pre-SCN voluntary payment | s.73(5)(6), 74(5)(6), 74A(5)(8) | Tax + interest paid before SCN: no SCN; penalty nil (non-fraud) / 15% (fraud) | — | Med | CASE |
| **K-07** | Penalty exposure by payment stage | s.73(8)(9)(11), 74(8)(9)(10)(11), 74A(5)(8)(9) | Non-fraud: nil if paid within 30 days of SCN (60 for 74A), else 10% or ₹10,000 higher. Fraud: 15% pre-SCN / 25% within 30 (60) days of SCN / 50% with… | — | High | CASE |
| **K-08** | s.128A waiver eligibility | s.128A, Rule 164 | Interest & penalty waived if full tax paid by 31.03.2025; not for erroneous refunds | Eligible cases | Med | CASE |
| **K-09** | Fraud not established | s.75(2) | If fraud limb fails before appellate authority, re-determine as non-fraud within non-fraud limitation | — | Med | CASE |
| **K-10** | Erroneous refunds | s.73(10), 74(10), 74A(2) | Limitation from date of refund order, not annual return | — | Med | CASE |
| **K-11** | Recurring issues - statement route | s.73(3), 74(3), 74A(3) | Same grounds for later periods via statement (DRC-02) - no fresh SCN needed | Repeat issue | Low | CASE |

### L. Industry-Specific — 46 checks

| ID | Check | Legal ref | Test | Threshold | Sev | Tier |
|---|---|---|---|---|---|---|
| **L-01** | Residential project rate & ITC bar | Notfn 11/2017-CTR entries (i),(ia)-(if) as amen… | Residential RREP/non-RREP at concessional rate without ITC; no ITC claimed on such projects; ongoing-project option exercised | Any ITC | High | ASSISTED |
| **L-02** | 80% procurement from registered persons | Notfn 3/2019, 7/2019-CTR | Inputs/input services from registered ≥ 80% (project-wise, FY-wise); shortfall RCM @18%; cement from URP always RCM at applicable rate (18% w.e.f. 22… | Shortfall | High | ASSISTED |
| **L-03** | Land value deduction | Notfn 11/2017-CTR para 2 | Deemed land value 1/3 of total consideration deducted; no other land deduction | Deviation | Med | MANUAL |
| **L-04** | TDR / FSI / long-term lease premium | Notfn 4/2019, 5/2019-CTR, 13/2017-CTR | RCM on TDR/FSI/upfront lease premium; exemption proportion for residential units sold before CC; tax on unsold area at CC | Any | High | MANUAL |
| **L-05** | Completion certificate & unsold units | Sch III para 5(b), Rule 42/43 (Annexure for RE) | Sales after CC not a supply; common ITC reversal for area unsold on CC | Any | High | ASSISTED |
| **L-06** | Joint development - landowner share | Notfn 11/2017, 4/2019-CTR; s.15 | Construction service to landowner valued at similar flat price; landowner TDR/development rights RCM | Any | High | MANUAL |
| **L-07** | Booking cancellations | s.34 | CN within s.34 time limit; linked to original demand invoice | Late CN | Med | MANUAL |
| **L-08** | Commercial units / mixed projects | Notfn 11/2017-CTR | Rate & ITC per current notification for commercial portion; common ITC apportioned by carpet area | Deviation | Med | MANUAL |
| **L-09** | Stage-wise demands & advances | s.13, s.31(5) | Time of supply at earlier of invoice/demand due date/receipt | Delay | Med | MANUAL |
| **L-10** | Works contract classification & rate | s.2(119); Notfn 11/2017-CTR entry 3 | Composite works contract; rate per recipient type & nature. W.e.f. 22.09.2025 Govt earthwork (>75%) and related sub-contracts moved 12% → 18% with IT… | Mis-rate | High | MANUAL |
| **L-11** | Govt TDS credits | s.51, GSTR-7 | TDS credit vs invoices & declared turnover; accepted on portal | Mismatch | Med | ASSISTED |
| **L-12** | Retention money & mobilisation advance | s.13, s.31 | Tax on mobilisation advance at receipt; retention part of invoice value | Any | Med | ASSISTED |
| **L-13** | Job work - ITC-04 & return timeline | s.143, s.19, Rule 45 | Inputs returned in 1 yr / capital goods 3 yrs; else deemed supply | Any | High | AUTO |
| **L-14** | Quantitative stock reconciliation | s.17(5)(h), s.35 | Opening + purchases/production − sales = closing; shortages → ITC reversal; excess → suppressed sales | > 1% variance | High | ASSISTED |
| **L-15** | Inverted duty refund | s.54(3), Rule 89(5) | Refund formula; 2-year limit; input services & capital goods excluded | Any | Med | AUTO |
| **L-16** | Warranty replacements | Circ 195/2023 | No tax on free replacement; no ITC reversal where warranty cost built into price | — | Low | MANUAL |
| **L-17** | By-products & scrap | s.7, s.17(2) | Taxable at correct rate; exempt by-products → Rule 42 reversal | Any | Med | ASSISTED |
| **L-18** | Cash sales vs bank/POS/UPI | s.35 | Receipts per bank/POS ≥ declared sales; unexplained credits flagged | Diff > 1% | High | ASSISTED |
| **L-19** | Schemes, free gifts, BOGO, dealer incentives | Circ 92/2019, 212/2024; s.15(3) | BOGO = single supply; free gifts → ITC reversal; post-sale incentives via s.15(3)(b) conditions | Non-compliant | Med | MANUAL |
| **L-20** | Sales returns | s.34 | Returns within s.34 limit via CN; later returns as fresh supply by buyer | Late | Med | ASSISTED |
| **L-21** | Dynamic QR on B2C invoices | Notfn 14/2020-CT | AATO > ₹500 cr: dynamic QR code on B2C invoices | Missing | Low | MANUAL |
| **L-22** | Composition scheme conditions | s.10, Rule 5 | Turnover limit; no inter-state outward supply; bill of supply; CMP-08/GSTR-4 filed | Breach | Med | AUTO |
| **L-23** | Continuous supply of services | s.13, s.31(5) | Invoice on/before payment due date or milestone | Delay | Med | MANUAL |
| **L-24** | Intermediary classification | IGST s.2(13), s.13(8)(b) (omitted w.e.f. 30.03.… | Periods up to 29.03.2026: intermediary → POS India, IGST payable (legacy exposure). From 30.03.2026: POS = recipient; zero-rated if s.2(6) met. Verif… | Any | High | MANUAL |
| **L-25** | Cross-charge between distinct persons | Sch I para 2, Rule 28; Circ 199/2023 | Cross-charge of common services; employee cost excluded; invoice value deemed OMV where full ITC available | Missing | Med | MANUAL |
| **L-26** | Import of services from related party | Sch I para 4; s.5(3) IGST | Services from foreign related party even without consideration → RCM | Any | High | MANUAL |
| **L-27** | Refund of accumulated ITC (LUT) | s.54, Rule 89(4) | Formula computation; 2-year limit; restricted to ITC in 2B | Deviation | Med | AUTO |
| **L-28** | Export proceeds realisation | Rule 96B, FEMA timeline | Realised within RBI period; else refund recovered with interest | Unrealised | High | ASSISTED |
| **L-29** | Merchant exporter concessional rate | Notfn 40/2017-CT(R), 41/2017-IT(R) | 0.1% supplies exported within 90 days; conditions met | Breach | Med | MANUAL |
| **L-30** | Shipping bill vs GSTR-1 (Table 6A) | Rule 96 | Invoice-wise match to avoid IGST refund blockage | Mismatch | High | AUTO |
| **L-31** | Exempt interest vs taxable fees | Notfn 12/2017-CT(R) entry 27; Circ 178/10/2022;… | Interest exempt; processing fees, locker rent, BG commission taxable; penal charges under RBI directions (w.e.f. 01.01.2024) not taxable (Circ 245/02… | Mis-classified | Med | MANUAL |
| **L-32** | Bank-specific RCM | Notfn 13/2017-CT(R) (recovery agent, BC/BF, DSA… | RCM paid on all notified services to bank/NBFC | Any unpaid | High | MANUAL |
| **L-33** | Repossessed assets & NPA security sale | s.7, Sch I | Taxability of sale of repossessed assets; invoice & tax on behalf of borrower where applicable | Any | Med | MANUAL |
| **L-34** | Restaurant/accommodation rate option | Notfn 11/2017-CT(R) entries 7(i)/(ii)/(vi); Not… | Rooms ≤ ₹7,500/unit/day: 5% without ITC; > ₹7,500: 18% with ITC (from 22.09.2025). Restaurant at 'specified premises' (any unit > ₹7,500 in preceding… | ITC under 5% | High | AUTO |
| **L-35** | Liquor (non-GST) sales & common ITC | s.17(2)(3), Rule 42/43 | Liquor turnover = exempt turnover for common credit reversal | Short reversal | High | ASSISTED |
| **L-36** | ECO food delivery - s.9(5) | s.9(5); Notfn 17/2021-CT(R) | Tax on aggregator orders paid by ECO; excluded from own liability; reported correctly | Double payment / omission | Med | AUTO |
| **L-37** | Banquets, events, outdoor catering | IGST s.12(7); Notfn 11/2017-CT(R) | Correct rate & POS; composite vs mixed supply | Mis-rate | Med | MANUAL |
| **L-38** | GTA forward charge option | Notfn 11/2017-CT(R) entry 9(iii) as amended; No… | Default 5% RCM. FCM by Annexure V by 31 March of preceding FY (deemed continuing; revert via Annexure VI): 5% without ITC or 18% with ITC (12% option… | No declaration | High | AUTO |
| **L-39** | GTA ITC & consignment note | Notfn 11/2017-CT(R), 12/2017-CT(R) | ITC restriction under concessional option; consignment note issued; exempt consignments (agri etc.) | Breach | Med | MANUAL |
| **L-40** | GSTR-8 TCS vs sales | s.52 | TCS net value = declared sales via ECO | Mismatch | High | AUTO |
| **L-41** | Marketplace settlement reconciliation | s.35 | Gross sales, returns, commissions, ITC on commission invoices | Mismatch | High | ASSISTED |
| **L-42** | Warehouses / APOB in other states | s.22, s.25 | Registration in each state with stock; stock transfers invoiced | Any | Med | ASSISTED |
| **L-43** | Exemption conditions - education/health/charity | Notfn 12/2017-CT(R) entries 1, 66, 74, 80 | Exempt services meet conditions (student education, clinical establishment, charitable activity) | Non-compliant | High | ASSISTED |
| **L-44** | Taxable incidental receipts | Notfn 11/2017, 12/2017-CT(R) | Hostel accommodation ≤ ₹20,000 per person per month for ≥ 90 continuous days exempt (Notfn 4/2024-CT(R) w.e.f. 15.07.2024; Circ 228/22/2024 for past)… | Any | Med | MANUAL |
| **L-45** | Donations vs consideration | s.7; Circ 116/35/2019-GST | Name-plate/acknowledgement as gratitude → not taxable; display amounting to advertisement/promotion of donor's business → taxable | Any | Med | MANUAL |
| **L-46** | Predominantly exempt - Rule 42 reversal | s.17(2), Rule 42/43 | Common ITC reversal on high exempt ratio; registration threshold | Short reversal | High | AUTO |
---

## 9. Scoring

Two scores, computed separately, displayed side by side, **never fused**.

```
P-SCORE   as in §6 — audit selection, from the 34 parameters
F-SCORE   enforcement weight, from AUTO findings only:

per finding:
  materiality = min(1, ln(1 + tax_effect÷100_000) ÷ ln(1 + turnover÷100_000 + e))
  confidence_factor = {CERTAIN 1.0, STRONG 0.8, ADVISORY 0.4}
  recency_factor    = 0.5 ** (periods_since ÷ 12)
  points = severity_weight × materiality × confidence_factor × recency_factor × rule_weight
           severity_weight = {LOW 1.0, MEDIUM 2.5, HIGH 5.0, CRITICAL 9.0}

per dimension d ∈ {LIABILITY, CREDIT, MOVEMENT, PAYMENT, BEHAVIOUR, INTEGRITY}:
  score(d) = 100 × (1 − exp(−Σpoints(d) ÷ k_d))

F-SCORE = Σ w_d × score(d)
          default w = {LIABILITY .30, CREDIT .30, INTEGRITY .15,
                       PAYMENT .10, BEHAVIOUR .10, MOVEMENT .05}
Band: GREEN 0-20 · AMBER 21-45 · ORANGE 46-70 · RED 71-100
```

`ASSISTED` checks do **not** score. They produce a separate **open-document count** and
an **unquantified-exposure** indicator, so an officer can see how much of the picture is
still dark. A file with 3 findings and 18 open document calls is not a clean file.

**Required:** every score renders as a waterfall listing each finding's exact point
contribution, and every weight is administrator-editable with the change audited.
**Forbidden:** no machine-learning model influences either score.

## 10. Parameter governance

```
rule_or_param_id · key · value · effective_from · effective_to
                 · notification_ref · approved_by · approved_at · supersedes_id
```

Resolved **as at the tax period under scrutiny**, never as at today. Changing a
parameter never rewrites history — re-running the engine over an old snapshot with old
parameters must reproduce the original findings byte for byte. The department's law
officer signs a parameter row, not a pull request.

## 11. Module K — the case engine, not a detection family

K-01 to K-11 are consumed by the limitation and section engine:

```
input   FY · tax amount · fraud indicators (fake invoice / suppression / wilful
        misstatement) · payment stage · interest dates
output  nature (fraud / non-fraud) · section (73 / 74 / 74A) · annual-return due date
        · SCN deadline · order deadline · limitation status · penalty % and ₹
        · interest ₹ · total exposure · s.128A eligibility

FY 2017-18 → 2023-24   s.73 (3 yr from AR due date) or s.74 (5 yr)
                        COVID extensions apply to s.73 only — and are under challenge
                        (Tata Play struck down, Brunda Infra upheld, SLP pending).
                        Hold them as an effective-dated parameter with a
                        LITIGATION_UNCERTAIN flag shown on the card.
FY 2024-25 onward      s.74A only — 42 months (non-fraud) / 54 months (fraud);
                        SCN at least 12 months before the order deadline;
                        de minimis proviso under s.74A(1)
s.128A                 FY 2017-18 to 2019-20 s.73 demands: suppress from the
                        enforcement queue, show in a separate amnesty view
```

Every case carries a live countdown to SCN and to order. Time-barred demands are the
largest avoidable revenue leak in any commercial-taxes department, and a countdown on a
screen fixes more of it than any model will.

## 12. Applicability

The matrix ships a rule × industry grid and per-client flags (Exports, Imports, SEZ,
E-invoice, Multi-GSTIN). Load both as reference data:

```
applicable(rule, taxpayer) = industry_grid[rule][taxpayer.industry] == 'Y'
                             AND (rule.required_flag is null
                                  OR taxpayer.flags[rule.required_flag])
```

A rule that is not applicable is **not** `CLEAR` — it is `NOT_APPLICABLE`, rendered in
its own muted section. Industry is derived from the dominant HSN/SAC class in GSTR-1
Table 12 and confirmed by the officer; never inferred silently.

## 13. Sources

Statutory positions are cited from secondary sources — adequate for engineering a rule
engine, **not** for issuing a notice. Every threshold must be signed off against the
bare Act, the Rules and the relevant CBIC circular before production; the parameter
table exists so that sign-off is a data entry.

[GST 2.0 slabs, 22 Sep 2025](https://busy.in/gst/gst-2-0-transition-new-slab-rates/) ·
[3B hard-lock and the 3-year bar](https://cleartax.in/s/gst-return-filing-rule-changes-from-july-2025) ·
[IMS](https://cleartax.in/s/invoice-management-system-ims-under-gst) ·
[IMS changes from Oct 2025](https://a2ztaxcorp.net/major-changes-in-gst-invoice-management-system-ims-from-october-2025-tax-period/) ·
[Rule 88D / DRC-01C](https://cleartax.in/s/rule-88d-cgst-itc-mismatch-gstr-2b-vs-gstr-3b) ·
[Rules 88C and 88D in practice](https://www.taxscan.in/top-stories/rule-88c-and-rule-88d-under-gst-how-to-handle-tax-and-itc-mismatch-notices-1444927) ·
[§§73, 74, 74A](https://taxguru.in/goods-and-service-tax/section-73-74-74a-new-unified-gst-demand-regime-fy-2024-25.html) ·
[§74A time limits](https://cleartax.in/s/section-74a-of-cgst-act) ·
[Rule 37, 180 days](https://cleartax.in/s/rule-37-of-cgst-sgst-rules-itc-reversal-180-days) ·
[Rules 37A, 42, 43](https://indiataxsim.com/blog/itc-reversal-rules-gst-37a-42-43) ·
[Rules 36, 37, 42, 86A, 86B](https://tallysolutions.com/gst/cgst-itc-rules-rule-36-37-42-86a-86b-and-key-provisions/)

P01–P34 are transcribed from the department's risk-parameter document; the A–L matrix
and its legal references are transcribed from the CS scrutiny matrix, both supplied
with this brief. The X family is derived from the worked case in
`07_WORKED_SCRUTINY_CASE.md`.
