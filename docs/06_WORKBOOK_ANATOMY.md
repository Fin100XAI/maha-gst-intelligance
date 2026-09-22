# 06 — REAL WORKBOOK ANATOMY
### A dissected GSP export: 29 sheets, what each one is, and what the ingestion layer must survive

**Specimen:** `Get Download All Report_27AAPCS8928R1Z1_2025-2026_SSR Marine.xlsx`
**Taxpayer:** SSR Marine Services Private Limited · GSTIN `27AAPCS8928R1Z1`
(Maharashtra, state code 27 — **checksum verified valid**)
**Period:** FY 2025-26, all twelve months, April 2025 through March 2026
**Producer:** Microvista Tech (a GSP/ASP consolidation tool) — **not** a raw GSTN
portal download. It is a multi-return, multi-month roll-up of portal data.

This is the shape of file an officer will actually upload. Every design decision in
`02_INGESTION_AND_MATCHING.md` is answered by something in this workbook.

---

## 1. The 29 sheets

### GSTR-3B — the taxpayer's own summary return (5 sheets, 336 rows)

| Sheet | Rows | What it is |
|---|---|---|
| `GSTR3B_Supplies` | 60 | **Table 3.1** — outward supplies and inward supplies liable to reverse charge, one row per sub-clause per month (5 × 12). Carries (a) outward taxable, (b) zero-rated, (c) nil/exempt, (d) inward RCM, (e) non-GST, each with taxable value and IGST/CGST/SGST/Cess. **This is the left-hand side of identity R1** and the source of P03, P04, P05, P09, P10. |
| `GSTR3B_ITC` | 180 | **Table 4** — the full ITC ladder, 15 rows per month: 4(A)(1) import of goods, (2) import of services, (3) inward RCM, (4) ISD, (5) all other ITC; 4(B)(1) Rule 42/43 reversal, (2) other reversals; 4(C) net ITC; 4(D)(1) reclaimed, (2) ineligible u/s 17(5). **The right-hand side of R2 and R3**, and the source of P07, P14, P17, P18, P19. |
| `GSTR3B_Nil` | 24 | **Table 5** — inward supplies from composition dealers, and exempt/nil-rated/non-GST inward supplies, split inter-State and intra-State. Feeds the purchase-turnover term in P01. |
| `GSTR3B_PaymentofTax` | 48 | **Table 6.1** — the payment split: tax payable, paid through ITC, paid in cash, separately for forward charge and reverse charge, plus interest and late fee. **This is where P07 and P08 come from**, and it is the single most diagnostic sheet in the file. |
| `GSTR3B_InterestLateFees` | 24 | **Table 5.1** — interest and late fee declared, head-wise. Compared against the system-computed figure under Rule 88B (rules PAY-02, PAY-04). |

### GSTR-1 — outward supplies as declared (4 sheets, 2,705 rows)

| Sheet | Rows | What it is |
|---|---|---|
| `GSTR1_B2B` | 2,044 | **Table 4** — invoice-level B2B outward supplies. Counterparty GSTIN, invoice number and date, value, rate, head-wise tax, place of supply, reverse-charge flag, invoice type, e-commerce GSTIN, **and IRN number and date**. The e-invoice columns make identity R5 computable without a separate IRP extract. |
| `GSTR1_CDN` | 212 | **Table 9B** — credit and debit notes issued to registered recipients, with the original invoice reference. **Must sign negative at the identity layer, never at the row layer.** Source of P31 and P32, and of rules OUT-08 and OUT-09. |
| `GSTR1_HSNSummary` | 421 | **Table 12** — HSN-wise outward summary: HSN, description, UQC, quantity, value, rate, head-wise tax. Drives the effective-rate check (OUT-07) against the HSN rate master, and the sector cohort assignment used by every `RATIO_PEER` flag. |
| `GSTR1_DocIssued` | 28 | **Table 13** — document series issued: nature of document, serial from/to, total issued, cancelled, net issued. Feeds the cancellation-rate and series-gap check (OUT-16). |

### GSTR-2B — the static, evidentiary ITC statement (8 sheets, 4,678 rows)

Generated on the 14th and never changed afterwards. That immutability is precisely
what makes it evidence rather than a working figure.

| Sheet | Rows | What it is |
|---|---|---|
| `GSTR2B_B2B` | 4,538 | Invoice-level inward supplies eligible for credit. Critically carries **`ITC Availability`**, **`Reason`** (why a credit is blocked — POS rule, §16(4) time bar), and the **supplier's GSTR-1/5 period and filing date**. This is the right-hand side of R2 and the backbone of ITC-01, ITC-03 and ITC-17. |
| `GSTR2B_B2BA` | 7 | Amendments to earlier B2B records (August, October, February). Original and revised details sit side by side. |
| `GSTR2B_CDNR` | 132 | Credit and debit notes issued by suppliers, reducing available credit. |
| `GSTR2B_CDNRA` | **0** | Amendments to supplier credit/debit notes — **empty this year**. |
| `GSTR2B_ISD` | **0** | Credit distributed by an Input Service Distributor — **empty**. |
| `GSTR2B_ISDA` | **0** | ISD amendments — **empty**. |
| `GSTR2B_IMPG` | 1 | Import of goods: one Bill of Entry, May 2025, port INBOM4, taxable ₹1,08,544.99, IGST ₹21,150. Feeds 3B Table 4(A)(1) and parameter P15. |
| `GSTR2B_IMPGSEZ` | **0** | Imports from SEZ units — **empty**. |

### GSTR-2A — the dynamic counterparty view (5 sheets, 4,797 rows)

Continuously updated as suppliers file, so it always eventually holds *more* than 2B.
Both are present here, and the platform needs both for different reasons.

| Sheet | Rows | What it is |
|---|---|---|
| `GSTR2A_B2B` | 4,642 | The same inward invoices, but with **`GSTR-1/5 Filing Status`, `GSTR-1/5 Filing Period`, and — decisively — `GSTR-3B Filing Status` for each supplier.** |
| `GSTR2A_CDN` | 135 | Supplier credit/debit notes, with a `Reason for issuing note` field 2B does not carry. |
| `GSTR2A_B2BA` | 11 | Supplier amendments (August, September, October, February, March). |
| `GSTR2A_TDS` | 7 | TDS deducted by government deductees under §51 — ₹29,84,000 of payments in the first row, CGST and SGST ₹29,840 each (1% + 1%). Third-party corroboration of declared turnover. |
| `GSTR2A_IMPGOS` | 2 | Import of services, reverse charge. Feeds 3B Table 4(A)(2) and parameter P06. |

> **`GSTR2A_B2B` carrying the supplier's GSTR-3B filing status is the most valuable
> column in this workbook.** It makes **Rule 37A / rule ITC-02** computable from this
> single file — supplier filed GSTR-1 but not GSTR-3B ⇒ the recipient must reverse.
> Nothing else is needed: no taxpayer submission, no external feed. If you demo one
> thing from a real file, demo this.

### Ledgers and payments (4 sheets, 212 rows)

| Sheet | Rows | What it is |
|---|---|---|
| `LiabilityLedger` | 69 | Every liability raised and discharged: date, ARN reference, which ledger discharged it, debit/credit, head-wise amounts, running balance. |
| `CashLedger` | 65 | Cash deposits and utilisations with deposit date, bank reporting date, reference, description, head-wise movement and running balance. **The denominator of P08 and the Rule 86B cash test.** |
| `CreditLedger` | 48 | Credit ledger movements and balances, head-wise. Identity **R8** runs here; **R9** (§49 utilisation order) is checked against the liability ledger's "ledger used for discharging liability" column. |
| `Challan` | 30 | CPIN-level challan register: created, amount, mode, expiry, deposit date, status. Reconciles the cash ledger to actual bank remittance. |

### TDS / TCS (3 sheets, all empty)

| Sheet | Rows | What it is |
|---|---|---|
| `GSTR-7 TDS` | **0** | Tax deducted at source by this taxpayer as a deductor (§51). Empty — SSR Marine is not a notified deductor. |
| `GSTR-7 TCS` | **0** | ⚠️ **Mislabelled by the producing tool.** The columns are `GSTIN of Collector`, `Tax period of GSTR-8`, `Gross value`, `Supplies returned`, `Net value` — this is **GSTR-8 TCS collected by e-commerce operators**, not GSTR-7. Map it by its columns, not by its sheet name. |
| `GSTR-7 TDSA` | **0** | Amendments to TDS entries, original vs revised. |

---

## 2. Nine things this file teaches the ingestion layer

**1 — The header row is not row 1, and it is not constant.**
Rows 1–4 are a metadata block (company name, GSTIN, return period, report name, plus
a vendor URL sitting in a stray column). Row 5 is blank. **The header is row 6 on 21
sheets and row 7 on all eight `GSTR2B_*` sheets.** A fixed `skiprows` is wrong on a
quarter of the file. This is precisely the `argmax(non_null × token_match ×
type_consistency)` detector in the spec, and this workbook is its first test case.

**2 — The metadata block is a gift.** Rows 1–3 give GSTIN, legal name and FY without
a single user input. Parse them, validate the GSTIN checksum, and bind the whole
workbook to a taxpayer automatically. A user who uploads a file and is immediately
shown *"SSR Marine Services Pvt Ltd · 27AAPCS8928R1Z1 · FY 2025-26 · 29 sheets, 12
months"* has already been told the tool works.

**3 — The period is a month name, not MMYYYY.** Every sheet has a `Month` column
holding `April`, `May`, … The financial year comes only from row 3. So
`Period = (month_name, FY from the metadata block)`, with the April–March boundary
applied: `January`–`March` belong to calendar year **2026**, not 2025. Get this wrong
and every limitation clock and every §16(4) test is off by a year.

**4 — Header text is typo-ridden.** `Centarl Tax` (twice), `Repoting Date (by bank)`,
`Tax Preiod if Applicable`, `GSTIN of Debuctor`, `Larger Used For discharging
liability` (meaning *Ledger*). An exact-match column mapper fails on this file. The
synonym lexicon must be fuzzy, and every one of these belongs in it as a literal
entry — because this producer will emit the same typos next month.

**5 — Duplicate column names inside one sheet.** `GSTR2B_B2BA` has `Invoice number`
at both position 2 and position 6, and `Invoice Date` / `Invoice date` at 3 and 8 —
original details then revised details. A name-keyed mapper silently collapses them.
**Disambiguate positionally**, and carry an `original_*` / `revised_*` prefix into the
canonical record.

**6 — Empty sheets are not clean sheets.** Six sheets are present but hold zero rows:
`GSTR2B_CDNRA`, `GSTR2B_ISD`, `GSTR2B_ISDA`, `GSTR2B_IMPGSEZ`, and all three TDS/TCS
sheets. ISD credit genuinely is nil here — but the engine must record *"ISD: present,
zero records"* rather than *"ISD: not supplied"*, because ITC-12 can then run and
return CLEAR instead of NOT_EVALUATED. **Distinguish absent from empty.** It is the
difference between a rule that answers and a rule that abstains.

**7 — 2A and 2B disagree, and the gap is the point.** `GSTR2A_B2B` has 4,642 rows;
`GSTR2B_B2B` has 4,538. A **104-record gap**, almost certainly suppliers who filed
after the 2B cut-off. Ingest both, keep them separate, and never reconcile 3B against
2A — 2B is the statutory gate under §16(2)(aa). 2A is for *supplier behaviour*
(filing status, Rule 37A); 2B is for *entitlement*. Conflating them is a defect that
will be found on reply.

**8 — GSTR-1 here is incomplete, and the platform must say so.** Only B2B, CDN, HSN
and DocIssued are present. **No B2CL, no B2CS, no exports (6A), no SEZ (6B), no deemed
exports (6C), no nil-rated (Table 8), no advances (Table 11).** So identity **R1
cannot be fully computed from this file alone** — and parameters **P20, P21, P22**
(export, SEZ and deemed-export ratios, all sourced from GSTR-1 Tables 6A/6B/6C) are
`NOT_EVALUATED` here on top of the ten that already need external feeds.

> Do not let R1 run on partial data and report a false shortfall. Detect that the
> outward-supply sections are incomplete, mark R1 `NOT_EVALUATED` naming the missing
> tables, and show the officer exactly which sheets would make it computable. A
> platform that invents a ₹2 crore mismatch because the export table was missing
> loses the room permanently.

**9 — Coverage, computed from this actual file.** Of the 34 audit risk parameters:

| | Count | Which |
|---|---|---|
| **Computable now** | ~21 | P01, P03–P05, P07–P14, P16–P19, P24, P29, P31, P32 |
| **Dark — external feed needed** | 10 | P02, P15, P20*, P23 (ICEGATE) · P25–P27 (refunds) · P28 (DGARM) · P33, P34 (ITD) |
| **Dark — GSTR-1 sections missing** | 3 | P20, P21, P22 (Tables 6A/6B/6C) |
| **Dark — no prior-cycle record** | 1 | P30 |

**P-coverage ≈ 21/34 = 62%.** That number belongs on screen next to the P-Score, at
the same visual weight — and it is also the integration business case, stated as a
fact about a real taxpayer rather than a projection.

---

## 3. What to do with this file

Make it **ingestion fixture #1**. The synthetic dataset in `05_BUILD_PHASES.md` will
pass on day one because the generator and the engine share assumptions; this file will
not, and that is its value.

```
tests/fixtures/real/ssr_marine_fy2025-26.xlsx   (anonymise the GSTIN and trade names)
tests/test_ingest_real_gsp_export.py
    asserts: 29 sheets classified, 0 rejected
             header row 6 detected on 21 sheets, row 7 on 8
             12 periods resolved with Jan–Mar mapped to CY2026
             all 5 typo'd headers mapped via the synonym lexicon
             GSTR2B_B2BA duplicate columns disambiguated positionally
             6 empty sheets recorded as PRESENT_EMPTY, not ABSENT
             "GSTR-7 TCS" classified as GSTR-8 by columns, not by sheet name
             rows_in == parsed + quarantined + duplicates on every sheet
             R1 returns NOT_EVALUATED naming the missing GSTR-1 tables
             P-coverage reports 21/34 with each dark parameter's reason
```

Add the vendor as a named ingestion profile — `microvista_all_report_v1` — with its
header offsets and synonym overrides. The second file from this GSP then ingests with
no mapping step at all, and the officer sees it work rather than being asked to
configure it.

Then get two more workbooks from different producers. Three real files from three
tools is the point at which the ingestion layer stops being a demo and starts being
infrastructure.
