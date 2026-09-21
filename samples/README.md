# Sample workbooks

Two files for the same filer — **27AAGCS4521P1ZX, Shivneri Engineering Works,
July 2025**. They are built to be awkward on purpose: a clean file proves
nothing about a platform that has to survive a real portal export.

Upload the GSTR-1 first, then the GSTR-3B. The order matters only in that the
discrepancy needs both.

## GSTR1_Shivneri_Jul2025.xlsx

Four sheets:

| Sheet | What is in it |
|---|---|
| `B2B_072025` | 11 B2B invoices, 17 columns |
| `CDNR_072025` | one credit note, CN/25-26/009, shown in brackets as the portal does |
| `B2B_082025_मराठी` | an August sheet with Marathi headers |
| `Notes` | a free-text sheet with no table in it at all |

Deliberately in there, and each one visible on the ingestion screen:

* a four-line title block above the header, which is where the filer's GSTIN is
  read from — no GSTIN is typed into the upload form
* three date formats in one column: `2025-07-04`, `05-07-2025`, and the raw
  Excel serial `45845`
* a spacer column and a trailing totals row
* one GSTIN with a valid-looking format and a **wrong check digit**
* a credit note, which must reduce the liability, not add to it
* tax columns headed in Marathi

Expect the reconciliation to read **rows in = parsed + held + duplicates**, with
the totals row and the bad-checksum row held and named. Held is not discarded:
open **View sheet** to see them flagged ▲ in the grid with the reason on hover.

## GSTR3B_Shivneri_Jul2025.xlsx

The summary return for the same month, as a transposed table — one row per line
of the return, one column per tax head. Table 3.1(a) declares **₹6,16,000 IGST /
₹1,21,000 CGST / ₹1,21,000 SGST**, which is short of what the GSTR-1 above adds
up to.

That gap is the finding.

## What should happen

1. **S1 Ingestion** — upload both. Dry run first if you want to see what a file
   would do before it does it.
2. **S3 Admin** — the 106 thresholds arrive *provisional*. Adopt them, or the
   engine is running on numbers nobody has signed. Adoption does not change any
   figure; it records who owns them.
3. **Run the engine** over the snapshot.
4. **OUT-01 fires for July only** — IGST ₹2,00,000, CGST ₹50,000, SGST ₹50,000.
   Over the 20% threshold but under ₹25 lakh, so it routes to **ASMT-10**, not
   DRC-01B.
5. Open a case, build the demand: **₹3,00,000 under s.74A**, head-wise.
6. Draft the notice. It will be **refused** — the taxpayer is known only from a
   return, and a notice addressed to a GSTIN rather than to a person is
   defective on its face. Load the registration, then draft.
7. Approving your own draft is **refused 403**. A second officer approves it and
   a DIN is minted.
8. **S3 → audit chain** verifies from genesis.

Every figure on the way through drills. The end of that path is the spreadsheet
cell it came from — that is the test this platform is built to pass.
