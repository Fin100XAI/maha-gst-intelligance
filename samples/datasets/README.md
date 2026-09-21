# Ten sample filing sets

**These are synthetic.** Filed GST returns are confidential under section 158 of
the CGST Act, so there is no public corpus to download and anybody offering one
is offering something they should not have. These were built instead: ten
businesses, twelve months each, GSTR-1, GSTR-3B and GSTR-2B, with arithmetic
that holds together and discrepancies that are there on purpose.

What makes them useful is that **no two are shaped alike**. A department
receives the portal's own export, a Tally dump, a consultant's working file with
rupee signs typed into the cells, a CSV somebody made by saving a sheet, and a
file whose headings are in Marathi. Each set below is one of those shapes.

Upload all three. The gap between the GSTR-1 and the GSTR-3B is the outward
finding; the gap between the GSTR-3B and the GSTR-2B is the credit finding.
They are independent - a business can declare its sales honestly and still
over-claim credit.

| Shape | Business | GSTIN | Division | What is wrong with it |
|---|---|---|---|---|
| GST portal export | Shivneri Engineering | `27AAGCS4521P1ZX` | Pune-II | GSTR-3B under-declares outward tax against the GSTR-1 |
| Tally Prime export | Konkan Distributors | `27AABCT2345L1Z7` | Pune-I | Sustained under-declaration across most of the year |
| ClearTax export | Deccan Motors | `27AACCB2894G1ZL` | Pune-I | Clean filer. Nothing should fire; this is the control. |
| Busy accounting export | Nashik Agro | `27AAACN1234M1ZI` | Nashik | One large month under-declared, the rest clean |
| Marathi headings | Vidarbha Textiles | `27AAFCV8765R1Z5` | Nagpur | Small, persistent shortfall -- below most thresholds by design |
| Hindi headings | Kolhapur Foundry | `27AAGCK5678T1ZD` | Kolhapur | Under-declared in the last quarter only |
| Flat CSV | Aurangabad Auto | `27AAJCA3456N1Z8` | Aurangabad | Clean filer |
| Merged headings, awkward order | Jalgaon Pulses | `27AAHCJ9012W1ZN` | Jalgaon | Under-declared in the first two months, then corrected |
| Consultant's working file | Mumbai Marine | `27AABFM7890K1ZQ` | Pune-II | Large single-month shortfall, over the DRC-01B threshold |
| Mandatory columns only | Satara Solar | `27AAECS2468H1Z6` | Kolhapur | Alternating months under-declared |

`MANIFEST.json` states the expected shortfall per business, so these double as
an acceptance fixture: if ingestion regresses, the numbers stop matching.
