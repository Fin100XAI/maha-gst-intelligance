# test-data/

**Synthetic workbooks for end-to-end testing. Not real taxpayers.** Every company name ends in `[TEST]` and every
PAN starts with `ZZ`, so no GSTIN here belongs to a real business. The files follow the exact layout of the
"Get Download All Report" export (same 29 sheets, banners and column headers) and are written by
`node scripts/make-test-data.mjs` (deterministic: the same seed always gives the same files).
Extract date (workbook creation date): 26-09-2026.

Upload them from **Data sources → Upload return**; they are saved into `data/` like any other return.

| Workbook | Profile | Planted issues | Expected result |
|---|---|---|---|
| `…27ZZSCS4821K1ZO…Sahyadri Agro.xlsx` | Food processor, Maharashtra, monthly, FY 2025-26, ~₹15 Cr, e-invoicing | None: control case. GTA services on reverse charge declared in 3.1(d) and paid in cash | Low risk (score ≈ 0). No failed or review checks, no risk indicators |
| `…27ZZKPK7730D1ZM…Konkan Steel.xlsx` | Steel trader, Maharashtra, monthly, **FY 2024-25**, ~₹19 Cr | ITC in 3B above 2B in Jul-Sep (₹6.4 L); two suppliers never filed GSTR-3B; one supplier invoice repeated in next month's 2B; ₹30 L of Nov GSTR-1 sales left out of 3B; Oct return filed 25 days late, Jan 1 day late, no interest or late fee paid | High risk. B-01 Fail, **B-04 Red** (FY 2024-25: 30-09-2025 deadline has passed), B-08 Fail (exact duplicate), G-01 and G-02 Fail, J-01 Fail with the Jan period "pending validation: one-day delay", J-03 Fail; indicators: non-filer ITC, duplicate purchases |
| `…29ZZDFD5512Q1ZY…Deccan Freight.xlsx` | Logistics LLP, Karnataka, **QRMP**, FY 2025-26, ~₹3 Cr (no e-invoicing) | Only 20% of reverse-charge tax (legal services, GTA) declared; 6 invoices to a Tamil Nadu customer charged CGST + SGST; heavy March credit notes to one customer, some without original invoice; a transporter that is both customer and supplier | Moderate risk. C-01 Fail, D-01 Fail, H-02 and H-08 Review; indicators: circular trading, year-end credit notes |
| `…24ZZNCN3309H1ZE…Narmada Synthetics.xlsx` | Synthetic fabric maker, Gujarat, monthly, FY 2025-26, ~₹16 Cr, inverted duty (yarn 12-18%, fabric 5%) | Two suppliers with GSTINs that fail the check digit; 15 invoices charged 2.5% instead of 5%; invoice numbers skipped in October; ~48 invoices kept just under ₹50,000; many round-figure values; March sales ~3.6× a normal month | High risk. A-01 Fail, G-10 Fail, G-12 Review, F-06 Review (no cash paid); indicators: low cash payment, ITC accumulation, round figures, e-way-bill splitting; turnover spike as an unscored review prompt |

Side effects that are expected and correct: Konkan also shows F-06 Review (in some months carried-forward credit
leaves < 1% paid in cash), and C-01 shows Review wherever no reverse-charge purchases exist (the engine asks the
officer to confirm RCM on book heads).
