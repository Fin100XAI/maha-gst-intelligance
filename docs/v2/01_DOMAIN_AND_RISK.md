# 01 - DOMAIN, RISK PARAMETERS AND RULES

Statutory position as at **September 2026**. Every threshold, rate and date below is
a **configurable parameter with an effective-from date**, never a constant in code.
Indian GST changes by notification, sometimes retrospectively; a platform that
hard-codes `0.20` for the Rule 88C threshold is obsolete the day the Council meets.

---

# PART A - THE DOMAIN

## A1. The levy, in one table

| Supply | Tax | Accrues to |
|---|---|---|
| Intra-State (supplier State = place of supply) | CGST + SGST | Centre + that State |
| Inter-State | IGST | Centre, settled to the destination State |
| Import of goods | IGST + BCD + Cess at customs | Centre, settled to destination |
| Demerit goods | + Compensation Cess | Centre |

The head under which tax is paid decides **which government gets the money**. A
supply mischaracterised as intra-State has diverted revenue between the Centre and a
State. That is why Law 3 forbids collapsing the heads, and why place-of-supply
(§§10–14 IGST Act) is a rule family rather than an edge case.

**Rates since GST 2.0 (22 September 2025):** 0%, 5%, 18%, 40% (demerit), plus special
rates (bullion 3%, rough diamonds 0.25%) and cess on specified goods. A FY 2025-26
scrutiny straddles the boundary, so the HSN→rate master must be **effective-dated**:
28% on an invoice dated 20-Sep-2025 is correct; on 23-Sep-2025 it is not.

**GSTIN:** `SS PPPPPPPPPP E Z C` - State code, PAN, entity code, literal Z, checksum
(Luhn mod-36 over the first 14). Validate structure **and** checksum on ingestion. A
structurally valid GSTIN failing checksum is the classic fabricated-supplier
signature, and it is a five-line function.

## A2. The monthly cycle

```
 SUPPLIER                                              RECIPIENT
 invoice (§31) → IRN if AATO ≥ ₹5 cr (Rule 48(4))
               → e-way bill if consignment > ₹50,000 (Rule 138)
        │ 11th of M+1
 GSTR-1 (§37)  ──┬──────────────────────────────► IMS  accept / reject / pending
        │ 13th   │                                 (live Oct-2024, expanded Oct-2025)
 GSTR-1A ────────┘                                      │ 14th
                                                   GSTR-2B (static, §16, Rule 60(7))
        │ 20th of M+1                                   │
 GSTR-3B ── Table 3 auto-populated and HARD-LOCKED (non-editable, from Jul-2025)
            Table 4 auto-populated from 2B / IMS
            payment: cash + credit ledger, §49 utilisation order
        │ 31 Dec of the following FY
 GSTR-9 (AATO > ₹2 cr) · GSTR-9C (AATO > ₹5 cr)
```

### Three regime changes that shape every rule

**GSTR-3B hard-locking, from the July 2025 period.** Table 3 is auto-populated from
GSTR-1/1A/IFF and cannot be edited; corrections go upstream through GSTR-1A. So a
GSTR-1↔3B liability mismatch should now be structurally near-zero - which makes any
residual mismatch in a post-lock period a **far stronger signal** than the same
mismatch before it. Carry a `regime` flag on every period in `RuleContext` and weight
findings differently on either side. Retrofitting this is painful; do it in Phase 2.

**IMS, live Oct-2024, expanded from the Oct-2025 period.** Every inbound document
lands in the recipient's dashboard: accept (flows to 2B), reject (excluded), pending
(deferred within a window), no action (deemed accepted). The Oct-2025 expansion added
pending-with-remarks, partial action on credit notes, and an explicit declaration of
ITC already reversed. **IMS action is now evidence, not metadata** - a recipient who
left a record pending and claimed the credit anyway made a timestamped, deliberate
choice. Ingest it wherever present; mark the dependent rules NOT_EVALUATED when absent.

**Three-year time bar, enforced from July 2025.** Under §37(5), §39(11), §44(2) and
§52(15), a return cannot be filed more than three years after its due date, with no
condonation on the portal. Once barred, the only route is §62 best-judgement
assessment or §63. This changes the *nature* of a non-filer case, and it makes a
limitation countdown the most valuable widget on either persona's home screen.

## A3. Input tax credit - the conditions in the order they bite

| Provision | Condition |
|---|---|
| §16(2)(a) | Possession of a tax invoice or debit note |
| §16(2)(aa) | The document appears in the recipient's **GSTR-2B** - the hard gate |
| §16(2)(b) | Goods or services actually received |
| §16(2)(ba) | Not restricted in the §38 communicated statement |
| §16(2)(c) | Tax actually paid to the government by the supplier |
| §16(2)(d) | The recipient has filed their §39 return |
| §16(4) | Claimed by 30 November of the following FY, or the annual-return date, whichever is earlier |
| 2nd proviso §16(2) / Rule 37 | Supplier paid within 180 days, else reverse with interest |
| **Rule 37A** | Supplier filed GSTR-1 but **not GSTR-3B by 30 Sep of the following FY** ⇒ recipient must reverse by **30 Nov**, else recoverable with interest |

**Rule 37A is the highest-yield rule in this document.** Both sides of the join are
departmental data - it needs nothing from the taxpayer, and it is arithmetically
unarguable. Implement it first and demo it second.

**§17(5) blocked credit** - motor vehicles ≤13 seats and related services; food and
beverages, outdoor catering, beauty and health services; club and gym membership;
rent-a-cab and non-obligatory insurance; travel benefits; works contract and
own-account construction of immovable property (except plant and machinery); CSR;
goods lost, stolen, written off or gifted; tax under §§74/129/130. Treat these as
**candidates only** (`ITC-10`, always ADVISORY). Never auto-demand on §17(5) - the
exceptions are fact-intensive, automated demands get quashed, and one quashed order
destroys departmental confidence in the platform.

**Rule 42 (per period):**
```
C1 = T − (T1 + T2 + T3)          T  = total input tax
C2 = C1 − T4                     T1 = non-business exclusive
D1 = C2 × E ÷ F                  T2 = exempt exclusive
D2 = C2 × 5%                     T3 = §17(5) blocked
reverse D1 + D2 in 3B Table 4(B)(1)   T4 = taxable/zero-rated exclusive
                                 E  = exempt turnover, F = total turnover
```
**Rule 43 (capital goods):** common credit over 60 months; `Te = (E÷F) × (Tc÷60)`
reversed monthly.

**Rule 86B:** where monthly taxable turnover (excluding exempt and zero-rated)
exceeds ₹50 lakh, at least 1% of output liability must be paid in cash. Exemptions
exist (income tax > ₹1 lakh in each of two preceding FYs by the proprietor/directors;
refund > ₹1 lakh in the preceding FY; cumulative 1% already paid in the FY; government
bodies) and are only partly checkable from GST data - so raise it ADVISORY with an
officer confirmation prompt, never as an automatic demand.

## A4. The eleven reconciliation identities

Each is a named, head-wise identity a finding can cite.

| ID | Identity | Consequence on breach |
|---|---|---|
| **R1** | Σ GSTR-1 tax (B2B+B2CL+B2CS+EXP-WP+SEZ-WP+CDN net+9(5), net of amendments) ≡ 3B `3.1(a)+3.1(b)+3.1.1(i)` | >20% **and** >₹25 L ⇒ Rule 88C ⇒ **DRC-01B** |
| **R2** | GSTR-2B available ITC (post-IMS, net of CNs) ≡ 3B `4(A)(5)` | >20% **and** >₹25 L ⇒ Rule 88D ⇒ **DRC-01C** |
| **R3** | 3B `4(C)` ≡ `4(A)` − `4(B)` | Internal identity. Must hold exactly - if it doesn't, the return is malformed and every downstream figure is suspect |
| **R4** | Σ e-way bills (outward, active, Part-B filled) ≈ Σ GSTR-1 value above the EWB threshold | ±2% band (EWB value includes tax) |
| **R5** | Σ active IRNs ≡ Σ GSTR-1 B2B/export documents | Manual intervention above the e-invoice threshold |
| **R6** | 3B `3.1(d)` RCM liability ⟷ 3B `4(A)(3)` RCM credit [+ RCM Liability/ITC Statement] | Credit without discharge |
| **R7** | GSTR-9 T4/5 ≡ Σ12 GSTR-1 · T6 ≡ Σ12 3B `4(A)` · `8A−8B−8C = 8D` must be explained | Annual |
| **R8** | Ledger: `closing ≡ opening + credited − debited`, per head, per period | Cheapest possible data-quality check |
| **R9** | §49(5)/49A/49B, Rule 88A: IGST exhausted first; **CGST never against SGST** | Data error or portal bypass |
| **R10** | Interest, Rule 88B: 18% on net cash liability for late 3B; 18% on ITC wrongly availed **and utilised**, from the date of utilisation, on a **daily running balance** | Period-end snapshots are wrong and will be challenged |
| **R11** | Late fee §47: ₹50/day (₹20 nil), turnover-graded caps | Grid held as effective-dated reference data |

## A5. Enforcement path and limitation

```
Rule 88C  → DRC-01B → Part-B in 7 days → no reply: next GSTR-1 blocked, §79 recovery
Rule 88D  → DRC-01C → Part-B in 7 days → no reply: same
§61 scrutiny (Rule 99) → ASMT-10 (30 days) → ASMT-11 reply → ASMT-12 close
                                            or → §65 audit / §67 inspection / §73/74A
§62 non-filers → ASMT-13 (withdrawn if a valid return is filed in 60 days)
§65 audit → ADT-01 → ADT-02        §66 special audit → ADT-03 → ADT-04
Demand → DRC-01A (pre-SCN) → DRC-01 (SCN) → DRC-06 (reply) → DRC-07 (order)
         DRC-03 voluntary payment at any stage
```

| FY | Section | SCN deadline | Order deadline |
|---|---|---|---|
| 2017-18 → 2023-24, non-fraud | §73 | 3 months before order | 3 years from annual-return due date |
| 2017-18 → 2023-24, fraud | §74 | 6 months before order | 5 years |
| **2024-25 onward, all cases** | **§74A** | **≥12 months before order** | **42 months** (non-fraud) / **54 months** (fraud) |

§74A unified the regimes - fraud is characterised in adjudication, not at notice
stage. Voluntary payment window: 60 days.

**§128A amnesty** waives interest and penalty for §73 demands for FY 2017-18 to
2019-20 on full payment of tax (SPL-01/SPL-02). Eligible periods must be **suppressed
from the enforcement queue and shown in a separate amnesty view**. Issuing a notice
for a waived period is a credibility-destroying error and is trivially avoidable.

**Every case carries a computed limitation clock** - days to SCN, days to order,
derived from the FY, the applicable section and the annual-return due date. Time-
barred demands are the largest avoidable revenue leak in any commercial-taxes
department, and a countdown on a screen fixes more of it than any model will.

---

# PART B - THE 34 AUDIT RISK PARAMETERS (P01–P34)

Source: the department's **Risk Flags and Action Points for Decision Support** (the
CBIC/DGARM audit-selection parameter set). Each parameter carries **Flag 1–4**, where
a higher numeral means higher risk and a correspondingly more intense audit.

## B1. The flag model

The source document defines flags 1–4 as increasing risk but **does not prescribe
numeric cut-offs**. So the platform implements cut-offs as **configurable,
effective-dated parameters, defaulted to peer-cohort percentiles**, to be approved by
the department before any production selection. Say this on screen; do not present
defaults as departmental policy.

```
for each parameter P:
    value    = deterministic metric (Decimal)   # never null; absent data ⇒ NOT_EVALUATED
    flag     = 0..4 via the parameter's banding strategy
    evidence = the source rows / table cells behind value

BANDING STRATEGIES
  RATIO_PEER   percentile within {sector(HSN) × turnover cohort × jurisdiction}
               p60→1  p75→2  p90→3  p97→4
               direction: HIGH_IS_RISK | LOW_IS_RISK
  RATIO_ABS    fixed cut-offs (used where a ratio has an intrinsic meaning, e.g. <1)
  DELTA_YOY    change vs the prior FY in percentage points; bands 5/10/20/35 pp
  COUNT        integer bands
  BINARY       0, or a fixed flag level when the condition holds
  EXTERNAL     requires a non-GST dataset → NOT_EVALUATED until that feed exists

P-SCORE  = 100 × Σ(flag_i × weight_i) ÷ Σ(4 × weight_i)      over EVALUATED params
COVERAGE = evaluated_params ÷ 34        ← always displayed next to the score
BAND     = LOW 0–25 · MODERATE 26–50 · HIGH 51–75 · SEVERE 76–100
```

**Coverage is not cosmetic.** A P-Score of 62 computed over 21 of 34 parameters is a
different statement from 62 over all 34, and an auditor must never be shown the
former as if it were the latter. Render coverage adjacent to the score, everywhere,
at the same visual weight.

**YoY comparisons.** The source is written as "18-19 vis-à-vis 17-18". Generalise to
`current FY vs immediately preceding FY`, and mark the parameter NOT_EVALUATED where
the prior year is absent rather than defaulting the comparison to zero.

**GSTR-2A → GSTR-2B.** The source predates GSTR-2B and IMS. Implement against
**GSTR-2B** as the primary (it is static and therefore evidentiary), keep GSTR-2A as
a fallback for legacy periods, and record which was used in the calc trace.

## B2. The parameters

Legend - **Data**: `3B` GSTR-3B · `R1` GSTR-1 · `2B` GSTR-2B/2A · `CUS` customs/
ICEGATE · `ITD` income tax · `DG` DGARM reports · `REG` registration master ·
`I04` ITC-04 · `RFD` refund. **Band**: the strategy above.

### Turnover and supply structure

| ID | Metric (deterministic) | Data | Band | Dir | Auditor action |
|---|---|---|---|---|---|
| **P01** | `sales_TO = 3B 3.1(a)+(b)+(c)` vs `purchase_TO = 3B T5 + 3B 3.1(d) + 2B taxable value + import of goods`; flag when `sales_TO < purchase_TO`, and on the YoY change in `sales_TO ÷ purchase_TO` | 3B, 2B, CUS | RATIO_ABS + DELTA_YOY | LOW_IS_RISK | Establish why purchases exceed sales. Test-check high-value purchase and sales invoices for correct accounting. |
| **P03** | `3.1(c) ÷ (3.1(a)+(b)+(c))` + YoY | 3B | RATIO_PEER + DELTA_YOY | HIGH | Verify the exemption conditions are met, including ITC non-availment or reversal. Sample contracts and supply orders. |
| **P04** | `3.1(b) ÷ (3.1(a)+(b)+(c))` | 3B | RATIO_PEER | HIGH | Verify zero-rated conditions, including due exportation of goods/services. |
| **P09** | Average monthly taxable turnover `3.1(a)+(b)+(c)`, current FY vs prior FY; flag on decline | 3B | DELTA_YOY | LOW | Establish the reason for the decline. |
| **P10** | `3.1(e) ÷ (3.1(a)+(b)+(c)+(e))` + YoY | 3B | RATIO_PEER + DELTA_YOY | HIGH | Verify non-GST supplies are genuinely outside GST and that no related ITC is taken. |
| **P31** | `Σ credit notes (R1 T9) ÷ (3B 3.1(a)+(b)+(c))` | R1, 3B | RATIO_PEER | HIGH | Sample credit notes; verify the genuineness of the underlying transactions. |
| **P32** | `Σ debit notes (R1 T9) ÷ (3B 3.1(a)+(b)+(c))` | R1, 3B | RATIO_PEER | HIGH | Sample debit notes; verify genuineness. |

### Reverse charge and imports

| ID | Metric | Data | Band | Dir | Auditor action |
|---|---|---|---|---|---|
| **P02** | `IGST paid at import (CUS) − ITC availed in 4(A)(1)+(2)`; flag on positive difference | 3B, CUS | RATIO_ABS | HIGH | Ascertain the difference, including verification of transport documents. Where goods/services were supplied in the course of business, confirm an invoice was issued and tax paid. |
| **P05** | `3.1(d) ÷ (3.1(a)+(b)+(c))` + YoY | 3B | RATIO_PEER + DELTA_YOY | HIGH | Verify total inward supplies liable to reverse charge. Sample high-value invoices, contracts and supply orders. |
| **P06** | `RCM liability per 2A T4 − [3B 3.1(d) tax − ITC on import of services 4(A)(2)]`; flag positive | 2B, 3B | RATIO_ABS | HIGH | Verify high-value import invoices and the correctness of ITC taken against RCM liability. |
| **P15** | `ITC on import of goods 4(A)(1) − IGST paid to Customs`; flag positive | 3B, CUS | RATIO_ABS | HIGH | Ensure wrong credit is reversed; rule out credit on a bill of entry in another person's name, and credit of BCD. |
| **P16** | `Σ 3.1(d) tax ÷ Σ 4(A)(2)+4(A)(3) ITC`; flag when **< 1** | 3B | RATIO_ABS | LOW | Establish why RCM tax paid is low relative to RCM credit taken. Sample high-value invoices. |

### Input tax credit

| ID | Metric | Data | Band | Dir | Auditor action |
|---|---|---|---|---|---|
| **P07** | `tax paid through ITC (6.1 cols 3–6) ÷ total tax payable (6.1 col 2)` | 3B | RATIO_PEER | HIGH | Verify ITC availment. Sample high-value and recurring supplies, sister-concern and dealer purchases. Check no ITC on exempt goods. Cross-check e-way bills, payment particulars, input-output ratio to rule out fake invoices. **Where the entire liability is discharged through ITC, escalate scrutiny.** |
| **P08** | `cash paid (6.1 col 8) ÷ total liability (6.1 col 2)` | 3B | RATIO_PEER | LOW | Establish the reason for an adverse cash-to-liability ratio. |
| **P14** | `3B 4(A)(5) − 2B available ITC`; flag positive | 3B, 2B | RATIO_ABS | HIGH | Ascertain the mismatch to check wrong availment and credit on fake invoices. E-way bill verification assists. Sample high-value invoices. |
| **P17** | `4(A)(4) ISD ÷ total 4(A)` + YoY | 3B | RATIO_PEER + DELTA_YOY | HIGH | Check the 2–3 year trend for ineligible ITC routed through ISD; whether credit unusable at another unit was diverted here; admissibility of ITC to the ISD itself. |
| **P18** | `4(B) ÷ 4(A)` + YoY | 3B | RATIO_PEER + DELTA_YOY | HIGH | Verify that reversals are supported by proper documents and are legally correct, and that exempt-supply reversal has been made. Sample high-value invoices. |
| **P19** | Compare `exempt ratio [3.1(c)÷(3.1(a)+(b)+(c))]` against `reversal ratio [4(B)(1)÷4(A)]`; flag when the exempt ratio materially exceeds the reversal ratio | 3B | RATIO_ABS | HIGH | Verify that proper ITC reversal or non-availment has been made for nil/exempt supplies. |

### Exports, SEZ, deemed exports and refunds

| ID | Metric | Data | Band | Dir | Auditor action |
|---|---|---|---|---|---|
| **P20** | Taxable value of export of goods, `R1 T6(A)` vs IGST/FOB value in shipping-bill data | R1, CUS | EXTERNAL | HIGH | Sample high-value shipping bills; verify accounting and the value of export goods. |
| **P21** | `R1 T6(B) SEZ supplies ÷ total GST turnover` + YoY | R1, 3B | RATIO_PEER + DELTA_YOY | HIGH | Where adverse, verify accounting and supply documents; confirm there is no diversion of goods cleared to SEZ. |
| **P22** | `R1 T6(C) deemed exports ÷ total GST turnover` + YoY | R1, 3B | RATIO_PEER + DELTA_YOY | HIGH | Where adverse, verify all related accounting and sample deemed-export documents. |
| **P23** | `[3B 3.1(b) − export value per customs] ÷ [3.1(a)+(b)]` + YoY | 3B, CUS | RATIO_PEER + DELTA_YOY | HIGH | Where adverse, verify accounting and sample zero-rated supply documents. |
| **P25** | Amount of IGST refund claimed (risky-exporter context) | RFD | RATIO_PEER | HIGH | Sample high-value transactions; verify the correctness of the refund. |
| **P26** | Amount of LUT export refund claimed | RFD | RATIO_PEER | HIGH | Sample high-value transactions; verify correctness. |
| **P27** | Amount of refund claimed on inverted duty structure | RFD | RATIO_PEER | HIGH | Sample high-value transactions; verify correctness. |

### Registration, behaviour and external intelligence

| ID | Metric | Data | Band | Dir | Auditor action |
|---|---|---|---|---|---|
| **P11** | Count of returns filed late in the FY; flag when **> 6** | REG, 3B | COUNT | HIGH | Verify late-filing penalty and interest on delayed payment. |
| **P12** | Count of returns **not filed** in the FY *(source phrasing is ambiguous; implemented as a count-band on unfiled returns - log this in DECISIONS.md and confirm with the department)* | REG | COUNT | HIGH | Arrive at and recover the correct liability for unfiled periods with interest and penalty. Cross-verify against the taxpayer's e-way bills and 2A/2B. |
| **P13** | Taxpayer holds **both SEZ and non-SEZ registrations on the same PAN in the same State** | REG | BINARY | - | Verify input-output ratios separately for both to detect diversion of duty-free inputs to DTA; confirm SEZ-manufactured goods are not shown cleared from the DTA unit; check wrong ITC in DTA on SEZ procurements. |
| **P24** | Count and aggregate risk of other GSTINs on the same PAN | REG | COUNT | HIGH | Examine supply, purchase and other transactions with those linked GSTINs. |
| **P28** | Appears in **DGARM Red Flag Reports 2, 3, 4 or 5** | DG | EXTERNAL / BINARY | - | Verify the details specified in each red flag. **Highest default weight in the P-Score.** |
| **P29** | `ITC-04 T4 taxable turnover ÷ total taxable turnover (3B)` | I04, 3B | RATIO_PEER | HIGH | Sample documents; verify correct recording in ITC-04 and GSTR-3B. |
| **P30** | Selected on risk criteria in the **previous** audit cycle | internal | BINARY | - | Re-verify the earlier risk criteria against the current audit period. |
| **P33** | `3B turnover − ITR turnover` for the same period; flag on substantial difference | 3B, ITD | EXTERNAL | HIGH | Sample transactions; establish the reason for the discrepancy. |
| **P34** | Income tax paid is negligible while 3B turnover is substantial | ITD | EXTERNAL | HIGH | Sample transactions; establish the reason. |

## B3. External-data parameters - be honest about them

**P02, P15, P20, P23** (customs/ICEGATE) · **P25–P27** (refund module) · **P28**
(DGARM) · **P33, P34** (income tax) require feeds the POC will not have.

These are **NOT_EVALUATED** until the feed exists. They appear on screen greyed, with
the named dependency and its roadmap reference, and they are **excluded from both the
numerator and the denominator of the P-Score** - so coverage drops instead of the
score being silently understated. Implement each one's formula anyway, with its
golden tests running against fixture data, so that connecting the feed is a
configuration change rather than a development project.

This is also the honest business case for the integration roadmap: *"eight of your
thirty-four parameters are dark until ICEGATE and ITD are connected."* That sentence,
with a number attached to it, moves procurement.

---

# PART C - DETECTION RULES (57)

P01–P34 decide **who to look at**. These rules decide **what to demand and on what
evidence**. They produce head-wise quantified findings with a statutory form attached.

## C1. Rule contract

```python
@rule(id="ITC-02", family=Family.ITC, dimension=RiskDimension.CREDIT,
      legal_basis="Rule 37A CGST Rules, 2017; s.16(2)(c) CGST Act",
      severity=Severity.HIGH, requires=["gstr2b", "supplier_filing_status"],
      params={"supplier_3b_cutoff": "30-09", "reversal_cutoff": "30-11"},
      relates_to=["P14"])
def itc_02(ctx: RuleContext) -> list[Finding]: ...
```

Every `Finding` carries: `status` (TRIGGERED / CLEAR / NOT_EVALUATED / SUPPRESSED) ·
`missing_inputs` (required on NOT_EVALUATED) · `observed`/`expected`/`delta` as
TaxVectors · `taxable_value_effect` · `calc_id` · `formula_rendered` (the formula with
actual values substituted) · `evidence` (source rows) · `confidence` · `suggested_form`
· `suppressed_by`.

**Rules are pure** - no I/O, no clock (`as_of` is injected), no randomness, no
mutation. That is what makes the engine replayable.

**Confidence drives workflow.** `CERTAIN` (arithmetic identity) and `STRONG`
(statutory test on complete data) may populate a draft notice. `ADVISORY` may only
populate a worklist. An ADVISORY finding must never reach a notice template without
an explicit human promotion step - that single constraint is what keeps the platform
defensible.

## C2. The rules

### OUT - outward supply and liability (10)

| ID | Rule | Basis | Test | Threshold | Sev | Form | ↔P |
|---|---|---|---|---|---|---|---|
| OUT-01 | GSTR-1 vs 3B liability mismatch | Rule 88C | `Σ R1 tax(head) − 3B[3.1(a)+(b)+3.1.1(i)](head)` | >20% & >₹25 L | CRITICAL | DRC-01B | - |
| OUT-02 | Amendments not carried into 3B | §37(3) | Net of R1 T9A/9B/9C vs the 3B delta | >₹1 L | HIGH | ASMT-10 | - |
| OUT-04 | Zero-rated in 3B, no export/SEZ invoices | §16 IGST | `3.1(b)>0` and `Σ R1 6A+6B+6C = 0` | any | HIGH | ASMT-10 | P04 |
| OUT-07 | Effective rate below the notified HSN rate | rate notifications | `tax ÷ taxable` vs `rate_master[hsn, doc_date]` | >0.5pp, >₹50 K | HIGH | ASMT-10 | - |
| OUT-08 | Abnormal credit-note ratio | §34 | `Σ CN ÷ Σ outward` | >15% or >p95 | MEDIUM | ASMT-10 | P31 |
| OUT-09 | Credit note beyond the §34(2) limit | §34(2) | `CN_date > min(30-Nov next FY, annual return)` with tax adjusted | any | HIGH | DRC-01A | P31 |
| OUT-11 | Wrong tax head for the place of supply | §§7–14 IGST | `is_intrastate(supplier_state, pos)` vs head charged | >₹10 K | HIGH | ASMT-10 | - |
| OUT-12 | B2B supply reported as B2CS | §37, Rule 59 | Counterparty GSTIN present in EWB/IRN, line sits in B2CS | any | HIGH | ASMT-10 | - |
| OUT-14 | GSTR-1 turnover below the IRN aggregate | Rule 48(4) | `Σ active IRN value > Σ R1 B2B+export` | >₹1 L | HIGH | ASMT-10 | - |
| OUT-19 | Year-end turnover spike | analytical | March ÷ mean of the other 11 months | >3× | MEDIUM | ASMT-10 | P09 |

### ITC - input tax credit (13)

| ID | Rule | Basis | Test | Threshold | Sev | Form | ↔P |
|---|---|---|---|---|---|---|---|
| ITC-01 | ITC availed in excess of 2B | Rule 88D | `3B[4A(5)](head) − 2B_available(head)` | >20% & >₹25 L | CRITICAL | DRC-01C | P14 |
| ITC-02 | Supplier did not file GSTR-3B | Rule 37A, §16(2)(c) | Supplier filed R1, not 3B by 30-Sep; no reversal by 30-Nov | >₹10 K | HIGH | DRC-01A | P14 |
| ITC-03 | ITC on 2B lines flagged not-available | §17(5), POS, §16(4) | Join 2B `itc_available='N'` to the claim | material | HIGH | ASMT-10 | P14 |
| ITC-04 | Time-barred credit | §16(4) | `claim_period > min(Oct next FY, annual return)` | any | HIGH | DRC-01A | - |
| ITC-05 | ITC from a cancelled registration | §29, §16(2) | `invoice_date > supplier.cancellation_date` | any | CRITICAL | DRC-01A | - |
| ITC-06 | ITC from a non-existent supplier | §16(2)(a),(b), §122 | Checksum failure, or never filed, or no EWB and no IRN ever | any | CRITICAL | DRC-01 | P14 |
| ITC-07 | Rule 42/43 reversal short | Rules 42, 43 | Recompute `D1 = C2×E/F`, `D2 = C2×5%` vs `4B(1)` | >₹25 K | HIGH | ASMT-10 | P18, P19 |
| ITC-10 | Blocked-credit indicators | §17(5) | HSN/SAC + description vs the blocked map | >₹25 K | MEDIUM | ASMT-10 | P07 |
| ITC-13 | RCM credit exceeds RCM tax discharged | §9(3),(4), §16 | `4A(3) > 3.1(d)` cumulative | >₹10 K | HIGH | ASMT-10 | P16 |
| ITC-16 | Circular trading | §16(2)(b), §122(1)(vii) | Directed cycles, length 2–5, in the invoice graph | cycle >₹10 L | CRITICAL | DRC-01 | P24 |
| ITC-17 | ITC claimed where 2B is nil | §16(2)(aa) | `2B_available = 0` and `4A(5) > 0` | >₹10 K | CRITICAL | DRC-01C | P14 |
| ITC-20 | IMS record pending beyond the window, still claimed | Rule 60, IMS | `ims_action = PENDING` past the window, claimed in 3B | any | HIGH | DRC-01C | - |
| ITC-21 | Credit note accepted, ITC not reversed | §34(2), IMS | IMS `ACCEPTED` CN with no matching `4B(2)` movement | >₹10 K | HIGH | ASMT-10 | P18 |

### PAY - payment, ledgers, interest, fee (7)

| ID | Rule | Basis | Test | Threshold | Sev | Form | ↔P |
|---|---|---|---|---|---|---|---|
| PAY-01 | Rule 86B 1% cash rule | Rule 86B | Monthly taxable TO >₹50 L and `cash ÷ liability < 1%` | any | HIGH | ASMT-10 | P07, P08 |
| PAY-02 | Short interest on delayed 3B | §50(1), Rule 88B(1) | `net_cash × 18% × days ÷ 365` vs `3B[5.1]` | >₹1 K | MEDIUM | DRC-01A | P11 |
| PAY-03 | Interest on ITC wrongly availed **and utilised** | §50(3), Rule 88B(3) | Daily running balance; interest from the date the balance fell below the wrong availment | >₹1 K | HIGH | DRC-01A | - |
| PAY-04 | Late fee short-paid | §47 | Day-count × grid, capped by turnover slab | >₹500 | LOW | DRC-01A | P11 |
| PAY-05 | Credit-ledger identity broken | §49, Rule 86 | `closing ≠ opening + credited − debited` per head | >₹1 | HIGH | ASMT-10 | - |
| PAY-06 | Utilisation order violated | §49(5), 49A/B, Rule 88A | CGST set off against SGST, or IGST unexhausted | any | HIGH | ASMT-10 | - |
| PAY-10 | Liability discharged wholly through ITC | analytical | Cash component = 0 for ≥12 consecutive periods | pattern | MEDIUM | ASMT-10 | P07, P08 |

### EWB - movement (7)

| ID | Rule | Basis | Test | Threshold | Sev | Form |
|---|---|---|---|---|---|---|
| EWB-01 | EWB with no corresponding GSTR-1 invoice | Rule 138, §37 | Left-anti-join on `(doc_no, doc_date, counterparty)` | >₹50 K | CRITICAL | ASMT-10 |
| EWB-02 | Invoice above the threshold with no EWB | Rule 138(1) | Right-anti-join, goods HSN only | > State threshold | HIGH | ASMT-10 |
| EWB-03 | EWB value vs invoice value variance | Rule 138A | `\|EWB − (taxable+tax)\| ÷ invoice value` | >2% & >₹25 K | MEDIUM | ASMT-10 |
| EWB-04 | Part-B never filled | Rule 138(3) | `part_b_filled = false` and `distance > 50 km` | any | HIGH | ASMT-10 |
| EWB-05 | Physically impossible movement | Rule 138(10) | `distance ÷ elapsed_hours > 90 km/h`, or delivery before generation | any | HIGH | ASMT-10 |
| EWB-06 | One vehicle, overlapping consignments | Rule 138A | Same vehicle, overlapping validity, different corridors | ≥2 | HIGH | ASMT-10 |
| EWB-08 | High EWB cancellation rate | Rule 138(9) | `cancelled ÷ generated`, rolling 6 months | >10% | MEDIUM | ASMT-10 |

### EIN - e-invoicing (3) · REG - registration (5) · BEH - behaviour (6) · NET - network (3) · SEC - sector (3)

| ID | Rule | Basis / test | Threshold | Sev | Form | ↔P |
|---|---|---|---|---|---|---|
| EIN-01 | Above the e-invoice threshold, no IRNs - `AATO ≥ ₹5 cr` and `IRN count = 0` | Rule 48(4) | any | HIGH | ASMT-10 | - |
| EIN-02 | IRN reported beyond 30 days - `ack_date − doc_date > 30`, `AATO ≥ ₹10 cr` | Rule 48(4) proviso | any | HIGH | ASMT-10 | - |
| EIN-04 | Mandated B2B invoice with no IRN - not a valid document | Rule 48(5) | any | HIGH | ASMT-10 | - |
| REG-02 | New registration, immediate high ITC - within 90 days, `ITC ÷ turnover > 0.9` | §29(2), Rule 21A | ITC >₹25 L | CRITICAL | REG-17 | P24 |
| REG-03 | Shared principal place of business - ≥5 active GSTINs at one normalised address | Rule 25 | ≥5 | HIGH | ADVISORY | P24 |
| REG-04 | Shared contact or bank account across distinct PANs | Rule 10A | ≥2 PANs | HIGH | ADVISORY | P24 |
| REG-06 | Activity after cancellation - R1, EWB or IRN after `cancellation_date` | §29(3) | any | CRITICAL | DRC-01 | - |
| REG-07 | Returns barred - `today > due_date + 3 years`, unfiled | §37(5), 39(11), 44(2) | any | HIGH | ASMT-13 | P12 |
| BEH-01 | Chronic late filing - mean days late, rolling 12 months | §47 | >15 days | MEDIUM | ASMT-10 | P11 |
| BEH-02 | GSTR-1 blocked under Rule 59(6) - prior 3B unfiled, later R1 exists | Rule 59(6) | any | HIGH | ASMT-10 | P12 |
| BEH-03 | Nil 3B against a non-nil GSTR-1 | §39 | >₹10 K | CRITICAL | DRC-01B | P12 |
| BEH-05 | ≥2 DRC-01B/01C intimations with no Part-B reply | Rule 88C(3), 88D | any | HIGH | DRC-01 | P30 |
| BEH-06 | ASMT-10 issued, no ASMT-11 reply after 30 days | §61(2) | any | HIGH | DRC-01A | P30 |
| BEH-08 | GSTR-9/9C not filed where mandatory | §44, Rule 80 | any | HIGH | ASMT-10 | P12 |
| NET-02 | Circular trading - directed cycles length 2–5, value circulating back within a quarter | §122(1)(vii) | cycle >₹10 L | CRITICAL | DRC-01 | P24 |
| NET-03 | Supply chain terminating in a non-filer within 2 hops | §16(2)(c) | exposure >₹5 L | HIGH | ASMT-10 | P14 |
| NET-05 | Pure pass-through trader - `(output − input tax) ÷ output tax < 1%` over 6 periods | analytical | <1% | HIGH | ASMT-10 | P07 |
| SEC-01 | Real estate / works contract - 80%-from-registered condition breached, shortfall RCM at 18% unpaid | Notif. 03/2019-CTR | - | HIGH | ASMT-10 | P05 |
| SEC-04 | Exporter - LUT expired while zero-rated supplies continued without IGST | Rule 96A | any | HIGH | ASMT-10 | P04, P26 |
| SEC-05 | E-commerce operator - GSTR-8 TCS vs supplier-declared turnover through that ECO | §52 | >₹1 L | HIGH | ASMT-10 | - |

## C3. Worked specifications - implement these six exactly

### OUT-01 - GSTR-1 vs 3B liability mismatch (Rule 88C)
```
g1 = Σ signed_tax over {B2B, B2CL, B2CS, EXPWP, SEZWP, CDNR, CDNUR, ECOM_9_5}
     including amendments; credit notes negative, debit notes positive
b3 = 3B.t31a_tax + 3B.t31b_tax + 3B.t311i_tax
delta(head) = g1(head) − b3(head)          # head-wise, never collapsed
shortfall   = delta.positive_part()
pct         = shortfall.total ÷ max(g1.total, 1) × 100
TRIGGER  pct > 20 AND shortfall.total > 25_00_000
SEVERITY escalate one level when regime == POST_HARD_LOCK
GOTCHA   EXCLUDE 3.1(d) inward RCM from b3. It is a liability but not an
         outward-supply liability. Including it is the commonest false positive here.
```

### ITC-01 - Excess ITC over GSTR-2B (Rule 88D)
```
avail(head) = Σ 2B lines where itc_available='Y'
              and ims_action ∈ {ACCEPTED, NO_ACTION} and section='B2B', minus CNs
excess      = (3B.t4a5_others − avail).positive_part()
TRIGGER  excess.total ÷ max(avail.total,1) × 100 > 20 AND excess.total > 25_00_000
GOTCHA   Compare ONLY against 4A(5). IMPG, IMPS, ISD and RCM credit sit in
         4A(1)–(4) and are not part of the 2B "all other ITC" bucket. Comparing
         gross 4A against 2B is wrong and collapses on reply.
```

### ITC-02 - Rule 37A supplier default
```
for each 2B line L with itc_available='Y':
    s = supplier_filing_status[L.supplier_gstin][L.supplier_return_period]
    if s.gstr1_filed and not s.gstr3b_filed_by(30-Sep of FY+1):
        required += L.tax
shortfall = required − (4B(2) reversal attributable to 37A, up to 30-Nov of FY+1)
TRIGGER  shortfall.total > 10_000 ;  interest §50(1) from 1-Dec of FY+1
CONFIDENCE CERTAIN - both sides of the join are departmental data
```

### PAY-03 - Interest on ITC wrongly availed **and utilised**
```
maintain a DAILY credit-ledger balance per head
utilisation_date = first date on which balance(head) < wrong_availment(head)
if no such date  →  availed but never utilised  →  reversal only, NO interest
                    (this distinction is litigated constantly; get it right)
interest = utilised × rate ÷ 100 × (reversal_date − utilisation_date).days ÷ 365
rate     = effective_dated_param("s50_3_rate", on=utilisation_date)
```

### NET-02 - Circular trading
```
G(V=GSTINs, E=Σ invoice value, window=1 quarter); prune edges < ₹1 L
Johnson's algorithm, elementary cycles length 2..5
cycle_value = min edge value over the cycle
TRIGGER  cycle_value > 10_00_000 AND cycle_value ÷ mean(node turnover) > 0.3
CONFIDENCE ADVISORY - a cycle is evidence of a pattern, never of an offence.
           Label the card exactly that way on screen.
```

### REG-07 - Three-year bar
```
for every expected (return_type, period) not filed:
    bar_date  = due_date + 3 years
    days_left = (bar_date − as_of).days
STATUS  BARRED (<0) · CRITICAL (<90) · WARNING (<180) · OK
BARRED  → route to §62 (ASMT-13) or §63. The return can never be filed.
```

## C4. The F-Score - deterministic, explainable, no model

```
per finding:
  materiality = min(1, ln(1 + tax_effect÷100_000) ÷ ln(1 + turnover÷100_000 + e))
  confidence_factor = {CERTAIN: 1.0, STRONG: 0.8, ADVISORY: 0.4}
  recency_factor    = 0.5 ** (periods_since ÷ 12)
  points = severity_weight × materiality × confidence_factor × recency_factor × rule_weight
          severity_weight = {LOW 1.0, MEDIUM 2.5, HIGH 5.0, CRITICAL 9.0}

per dimension d ∈ {LIABILITY, CREDIT, MOVEMENT, PAYMENT, BEHAVIOUR, NETWORK}:
  score(d) = 100 × (1 − exp(−Σpoints(d) ÷ k_d))

F-Score = Σ w_d × score(d),  default w = {LIABILITY .25, CREDIT .25, MOVEMENT .15,
                                          PAYMENT .10, BEHAVIOUR .10, NETWORK .15}
Band: GREEN 0–20 · AMBER 21–45 · ORANGE 46–70 · RED 71–100
```

**Required:** every score renders with a waterfall showing each finding's exact point
contribution; every weight is administrator-editable with the change audited. A score
an officer cannot decompose is a score an officer will not act on.

**Forbidden:** no machine-learning model influences the P-Score or the F-Score in v1.
ML output lives in a separate "Analytical signals" panel, labelled non-statutory, and
never feeds a notice.

## C5. Parameter governance

Every threshold in this document - statutory or flag cut-off - lives in a table:

```
rule_or_param_id · key · value · effective_from · effective_to
                 · notification_ref · approved_by · approved_at · supersedes_id
```

The engine resolves parameters **as at the tax period under scrutiny**, never as at
today: scrutinising FY 2019-20 applies FY 2019-20 thresholds. Changing a parameter
never rewrites history - re-running the engine over an old snapshot with old
parameters must reproduce the original findings byte for byte.

The department's law officer signs a **parameter row**, not a pull request. Build the
admin screen for it in Phase 5 and the approval workflow in Phase 7.

## Sources

[GST 2.0 slabs, 22 Sep 2025](https://busy.in/gst/gst-2-0-transition-new-slab-rates/) ·
[3B hard-lock and the 3-year bar](https://cleartax.in/s/gst-return-filing-rule-changes-from-july-2025) ·
[GSTN advisory, 3-year bar](https://www.taxmann.com/post/blog/gstn-advisory-on-filing-pending-gst-returns-before-three-year-expiry) ·
[IMS](https://cleartax.in/s/invoice-management-system-ims-under-gst) ·
[IMS changes from Oct 2025](https://a2ztaxcorp.net/major-changes-in-gst-invoice-management-system-ims-from-october-2025-tax-period/) ·
[Rule 88D / DRC-01C](https://cleartax.in/s/rule-88d-cgst-itc-mismatch-gstr-2b-vs-gstr-3b) ·
[Rules 88C and 88D in practice](https://www.taxscan.in/top-stories/rule-88c-and-rule-88d-under-gst-how-to-handle-tax-and-itc-mismatch-notices-1444927) ·
[§§73, 74, 74A](https://taxguru.in/goods-and-service-tax/section-73-74-74a-new-unified-gst-demand-regime-fy-2024-25.html) ·
[§74A time limits](https://cleartax.in/s/section-74a-of-cgst-act) ·
[Rule 37, 180 days](https://cleartax.in/s/rule-37-of-cgst-sgst-rules-itc-reversal-180-days) ·
[Rules 37A, 42, 43](https://indiataxsim.com/blog/itc-reversal-rules-gst-37a-42-43) ·
[Rules 36, 37, 42, 86A, 86B](https://tallysolutions.com/gst/cgst-itc-rules-rule-36-37-42-86a-86b-and-key-provisions/)

P01–P34 are transcribed from the department's own risk-parameter document supplied
with this brief. The statutory citations above are secondary sources - adequate for
engineering a rule engine, **not** for issuing a notice. Every threshold must be
signed off against the bare Act, the Rules and the relevant CBIC circular before
production. The parameter table exists so that sign-off is a data entry.
