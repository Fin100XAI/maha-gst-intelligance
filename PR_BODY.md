## GST Intelligence - the scrutiny and demand platform, on this design system

This adds **GST Intelligence** to the repository: a working GST compliance platform
for the Commercial Taxes Department, and adopts this repo's landing page,
officer sign-in and shell so the two read as one system.

The two codebases answer different questions and are complementary.
`maha-gst-intelligance` is an intelligence storefront over a seeded dataset -
29 modules, no backend. GST Intelligence is the engine underneath one of those
questions: **take the returns a taxpayer actually filed, reconcile them, and
produce a figure defensible enough to put in a notice.**

---

### What it does

| | |
|---|---|
| **Ingests** | Whole-year GSTR-1, GSTR-3B, GSTR-2A, GSTR-2B and the electronic ledgers, in whatever dialect the filing tool wrote them |
| **Runs** | 34 risk parameters (the department's circular, verbatim) and 57 detection rules |
| **Produces** | A **P-Score** (who to audit, with coverage beside it) and an **F-Score** (what can be demanded, with the rupees attached) - side by side, never fused |
| **Guarantees** | Every figure drills to the spreadsheet cell it came from |

Verified against **nine real filed workbooks** (FY 2025-26, 39,391 rows,
9 taxpayers): all nine read, every file's row-ledger balances, 677 findings,
320 rule outcomes correctly reported as NOT EVALUATED naming the dataset they
needed.

### The five laws it is built on

1. **Determinism** - every rupee, ratio, day-count and flag is pure Python over
   `Decimal`. No float, no clock, no randomness, no model. A lint rule fails
   the build on a float literal under `app/engine/` or `app/ingestion/`.
2. **Provenance** - every number carries a `calc_id`: a deterministic hash over
   `rule_id + snapshot_id + inputs`, never a UUID. It resolves to the rule, the
   formula as executed, the intermediate terms and the source rows.
3. **Head-wise integrity** - IGST, CGST, SGST and Cess are a `TaxVector` and
   are never summed into one scalar.
4. **The model is a scribe, never a calculator.**
5. **Nothing silently dropped** - every row lands in `PARSED`, `QUARANTINED`
   (with a reason) or `DUPLICATE`, and the counts reconcile on screen.

---

### The design adoption

Ported from this repository, deliberately and with two changes:

- **Landing page** - hero, trust strip, value props, screen index, assurance
  section, footer, on the civic-blue `govt` palette and the gold mark.
- **Officer sign-in** - the split-screen layout, left band carrying the
  assurances before entry rather than after.
- **Shell** - `Masthead` → utility bar → horizontal `TopNav` → `ContextBar` →
  full-width main, with the left rail kept as the sub-`lg` drawer.

**What was changed, and why:**

| Reference | Here | Why |
|---|---|---|
| Ticker of seeded KPI counts, labelled "Simulated" | Real row counts from `/coverage/screens`; the strip does not render if the call fails | Law 5 forbids fabricated data. A figure on the storefront must be findable again after sign-in |
| Shared demo access code | No code, and the screen says it is not a security control | A code every reviewer types is not authentication. Authorisation is enforced server-side at the query layer |
| Eight role titles | Three named officers, each showing what they *may do* | A role title asks the reader to already know what it permits |
| Six global scope filters in the context bar | Breadcrumb and acting identity only | Figures are computed against an immutable snapshot; a global filter silently narrowing every screen is how a divisional figure gets quoted as a State one |

Three defects were found and fixed during the port, each now covered:

- `bg-govt-900` rendered **transparent** - Tailwind cannot apply a slash
  opacity to an opaque `var()` colour. The families are now channel triplets
  read through `rgb(var(--x) / <alpha-value>)`.
- Fixed-light grounds under themed ink went **invisible in dark mode** - the
  selected officer's name vanished. `tokens.css` now records the pairing rule:
  fixed ground → fixed ink, themed ground → themed ink, never one of each.
- The breadcrumb read **"My Queue" while standing on Filings** - first-match
  instead of longest-match. Now `screenAt()`, pure and tested against every
  declared screen.

---

### Stack

Python 3.12 · FastAPI · SQLAlchemy 2 · Pydantic v2 · Alembic · openpyxl ·
PostgreSQL 16 (SQLite for local) · React 18 · TypeScript strict with
`exactOptionalPropertyTypes` · Vite · Tailwind · TanStack Query · Recharts

### Gate

| Check | Result |
|---|---|
| `pytest` | **898 tests, 48 files - green** |
| `vitest` | **37 tests - green** |
| `ruff check` / `ruff format --check` | clean, 149 files |
| `mypy` | clean, 85 source files |
| `tsc --noEmit` | clean |
| `eslint` (flat, `strictTypeChecked`) | clean |

Build gates enforced in CI: no float under the engine, money columns
`NUMERIC(18,2)`, `<Money>` carries a `calc_id`, every `ChartCard` has a drill
handler, the audit chain verifies.

### Notes for review

- **No taxpayer data is committed.** `.gitignore` now also excludes
  `*.db-wal` / `*.db-shm`, which carry the same pages as the database and were
  being staged while `*.db` itself was correctly ignored.
- `.gitattributes` normalises line endings so a Windows checkout does not put
  a wall of CRLF noise into every future review.
- `docs/DECISIONS.md` records all 64 resolved ambiguities with reasoning -
  the file is the contract for anything a reader thinks looks arbitrary.
- **One open question for the department**, flagged rather than worked around:
  the real cash ledger carries head-wise amount and balance columns, while the
  canonical `ledger_movement` model holds them as scalars. That collapses the
  heads and breaks Law 3. Reshaping a canonical table is not a bug fix -
  see D-0063.
