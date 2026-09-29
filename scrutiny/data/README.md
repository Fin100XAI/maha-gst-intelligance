# data/

Input folder for GST Intelligence. **Contains confidential taxpayer return data: keep this repository private.**

| File | Purpose |
|---|---|
| `GST_Scrutiny_Rule_Matrix.xlsx` | The 141-rule scrutiny matrix: checks, legal references, thresholds, severity, actions, industry applicability |
| `*All Report*.xlsx` (one per GSTIN: 9 real, plus 4 synthetic `[TEST]` workbooks uploaded from `test-data/`) | Taxpayer return downloads (GSTR-1, 3B, 2A/2B, ledgers, challans) |

Add or replace taxpayer workbooks here, then run `npm run build:data` (or `npm run dev`, which runs it first).
Workbooks uploaded from *Data sources* in the console are saved here too and the data is rebuilt automatically;
when a GSTIN is uploaded again, the earlier workbook moves to `superseded/`.
The build writes `public/data.json`. Saved scrutiny reports (HTML + PDF) live in `public/reports/`.
