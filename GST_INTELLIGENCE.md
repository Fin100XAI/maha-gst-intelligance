# GST Intelligence

A GST compliance intelligence platform for a State Commercial Taxes Department.
One engine, two surfaces: a **Dashboard** for decision makers at portfolio scale
and a **Workbench** for officers at case scale.

Output from this codebase is used to issue statutory notices that create legal
liability. The five laws in [`CLAUDE.md`](CLAUDE.md) are not style preferences.

## Where things are

| Path | What it is |
|---|---|
| `CLAUDE.md` | The repo constitution - the five laws, the hard rules |
| `docs/00`–`docs/04` | The spec pack. It is the contract |
| `docs/DECISIONS.md` | Every ambiguity resolved, with reasoning |
| `docs/VERIFICATION.md` | What was verified by running it, and what was not |
| `backend/app/money.py` | `Decimal` + `TaxVector`. Read this first |
| `backend/app/canonical.py` | Enums, `Period`, GSTIN validation, statutory dates |
| `backend/tools/lint_no_float.py` | Gate G1, build-breaking, no suppression |
| `frontend/src/styles/tokens.css` | The design system, docs/03 §1 |

## Running it

```bash
make install     # backend venv + npm install
make test        # the full suite, offline, no credentials needed
make lint        # ruff + mypy + tsc + eslint
make gates       # G1, G2, G11 individually
make demo        # twelve synthetic taxpayers: generate, ingest, run the engine
```

SQLite is the supported database and the one everything has been run against:
the default `DRISHTI_DATABASE_URL` is `sqlite:///./drishti.db`, with foreign
keys, WAL and a busy timeout set on every connection. PostgreSQL is a URL
change, and is untested - see below.

Then serve what `make demo` built:

```bash
cd backend && DRISHTI_DATABASE_URL=sqlite:///./demo.db .venv/Scripts/python -m uvicorn app.main:app --port 8000
```

```bash
cd frontend && npm run dev
```

The API is at `http://localhost:8000/api/v1`, the web app at
`http://localhost:5173`.

There is no identity provider in this build, so outside `development` the API
returns 401 and refuses to guess. In development the caller is read from
`X-Officer-Id` and `X-Officer-Role` headers, which the web app sends from the
role selector in the shell. A field role with no division assigned sees
nothing - that is the safe failure, not a bug.

## Build status - honest

Phases are in [`docs/04_BUILD_PHASES.md`](docs/04_BUILD_PHASES.md) and are built
in order.

| Phase | State |
|---|---|
| 0 Foundation | **Done** - money, canonical, schema, audit chain, G1/G2/G11, CI, frontend shell |
| 1 Ingestion | **Done** - synonym lexicon, header detection, coercion, quarantine ledger, provenance to the cell |
| 2 Canonical layer, identities, provenance | **Done** - 11 identities, calc traces, effective-dated parameters |
| 3 The 34 parameters and the 57 rules | **Done** - P01–P34 and 57 rules, P-Score with coverage, F-Score, peer cohorts, invoice graph |
| 4 Aggregation and the Dashboard | **Done** - 41 metrics, fact tables, and all nine Dashboard screens D1–D9 |
| 5 Workbench, cases, limitation | **Done** - limitation engine, demand build-up, suppressions, all seven Workbench screens, and the Reconciliation Workbench (the 12 × 11 identity matrix, head-wise, with its three states) |
| 6 Notices, agents, hardening | **Partial** - ASMT-10 (en/mr), DRC-01A, DRC-01B, DIN, maker-checker, slot locking, RBAC with the 404 rule, the six agents behind one provider, numeric-fidelity middleware, pseudonymisation, upload hardening and the synthetic dataset are built; DRC-01C, DRC-01, ADT-01, REG-17, RFD-08, OIDC, PDF rendering, field-level encryption and the load test are not |

### The road from a file to a notice

An uploaded return now reaches the engine. Before the end-to-end evaluation it
did not: ingestion wrote canonical rows, the engine ran only from the demo
seeder's in-memory records, and nothing joined them. The path is now

```
POST /ingestion/upload   ->  canonical rows + provenance + a filer registration
POST /engine/run         ->  rules, parameters, identities, the two scores
POST /cases              ->  a case over the findings
GET  /cases/{id}/demand  ->  head-wise demand, one calc_id
POST /notices/draft      ->  the figures slotted, the narrative editable
POST /notices/{id}/approve  ->  a second officer, a DIN, the hash in the chain
```

### Screens

**Every routed screen is built.** There are no placeholders left.

| Surface | Screens |
|---|---|
| Dashboard | D1 Overview · D2 Filing · D3 Revenue · D4 Risk · D5 Parameters · D6 Funnel · D7 Jurisdictions · D8 Officers · D9 Sectors |
| Workbench | W1 Worklist · W2 Audit Planner · W3 Registry · W4 Taxpayer File (with Reconciliation) · W5 Cases · W6 Notices · W7 Copilot |
| Shared | S1 Ingestion · S2 Library · S3 Admin · Drill |

Global gates (docs/04): **G1** enforced across every tree that computes a
figure, and proven to fail on violation. **G2** enforced against both the models
and the migration. **G4**, **G5**, **G8**, **G9** and **G11** enforced. G3 is
enforced by convention and tested at the endpoints rather than over the whole
OpenAPI document. G6, G7 and G10 are not yet enforced.

Every routed screen is served from real computation. Nothing in this repository
fabricates a number.

**The thresholds are editable.** The 106 statutory values the platform ships
with arrive marked *provisional* - working values nobody has signed. The
threshold register on S3 lets the department adopt them (recording who and
when), or set one with the notification that backs it. An edit writes a new
effective-dated row rather than overwriting, because the engine resolves a
threshold as at the tax period under scrutiny: re-running FY 2019-20 must apply
the FY 2019-20 value whatever has been decided since. A notice may quote a
notified value; a departmental value is defensible as policy, not as a citation,
and the register keeps the difference visible (docs/DECISIONS.md D-0037).

**It reads ten different shapes of the same return.** A department does not
receive one format. `samples/datasets/` holds ten complete filing sets -- ten
businesses, twelve months each, GSTR-1 and GSTR-3B -- in ten deliberately
different shapes: the portal's own export, Tally, ClearTax, Busy, Marathi
headings, Hindi headings, a flat CSV, a merged two-row header with the columns
in an unhelpful order, a consultant's file with `₹ 1,23,456.00` typed into the
cells, and one carrying only the mandatory columns. All ten read completely,
and `tests/ingestion/test_dialects.py` holds them to it. Generate them with
`python -m app.seed --out ../samples/datasets`.

They are synthetic, and they have to be: filed GST returns are confidential
under section 158 of the CGST Act, so there is no public corpus, and anybody
offering one is offering something they should not have.

**The workbook is viewable.** An uploaded file is rendered back as a grid -
column letters, the detected header row marked, held rows flagged with their
reason, the derived mapping available as an overlay - read from the stored
bytes, never rebuilt from the canonical rows. That is the last step of the
ninety-second test: a figure on the Commissioner's dashboard through to the cell
it came from.

## The assistant

Six agents sit over the computed results -- narrator, notice drafter, legal
research, reply triage, column mapper and copilot. They are optional: the
platform is fully usable with no model at all, and an unconfigured deployment
gets an agent layer that refuses rather than one that guesses.

Any OpenAI-compatible endpoint works through four environment variables; no
adapter code is needed. Verified live against Together AI running Llama 3.3
70B: a plain-language summary of one business's filings, with every quoted
figure carrying a provenance handle that opens the rule, the formula and the
source rows.

What holds it in place: no agent has a tool that performs arithmetic; every
completion is scanned and a number that did not come back from a tool fails the
whole response; and the prompt carries a pseudonymous reference, never a GSTIN,
PAN or trade name -- checked, not assumed. The stored prompt for that live call
contained neither the registration nor the business name; the name on the
officer's screen was restored afterwards.

For a State deployment the endpoint should be a model inside the State network.
The code path is identical -- only the base URL changes.

## Verified by execution, versus read only

Stated per the working agreement, because "it is implemented" and "I watched it
work" are different claims.

**Exercised end to end, on data the platform itself generated and ingested:**
workbook generation → ingestion with reconciliation → the engine over 12
taxpayers → 857 findings → aggregation → the dashboard → drill → the provenance
drawer → the W4 taxpayer file → opening a case → the demand build-up → drafting
a DRC-01A → refused self-approval → approval by a second officer with a minted
DIN → service with the reply clock → the audit chain verifying from genesis.

**Also exercised end to end through the running web app:** uploading a real
portal-shaped workbook on the ingestion screen and watching it reconcile
(5 rows in = 4 parsed + 1 held), the registry with its filters and facets,
the worklist (disposing of a finding and watching the queue drop from 28 to 27,
with the entry landing in the audit chain), the audit planner (selecting a
taxpayer with a rationale and seeing it recorded), the Copilot refusing with
501 because no model is configured, and the reconciliation matrix - 12 periods
× 11 identities, clicking a breached cell through to its head-wise split and on
into the provenance drawer.

**Exercised by test only:** the Marathi ASMT-10 template, the s.128A and
limitation refusals, the agent layer in all six shapes (the model is a scripted
provider - no live model has been called), the RBAC 404 rule, slot locking,
finding disposition and the promotion of an ADVISORY finding.

**Also walked end to end, in the browser, on a deliberately messy workbook built
for the purpose:** a GSTR-1 with three date formats, a credit note, an
invalid-checksum GSTIN and a Marathi-headed sheet, plus a GSTR-3B declaring less
outward tax than the GSTR-1 - upload, engine run, OUT-01 firing for July only,
routing to ASMT-10 rather than DRC-01B, a ₹3,00,000 demand under s.74A, a draft
refused until the registration was loaded, self-approval refused, and approval by
a second officer minting a DIN. That walk found seven defects, two of which
would have demanded money that was not owed; all seven are fixed, each with a
regression test and a recorded decision (docs/VERIFICATION.md).

**Not exercised at all:** PostgreSQL (everything runs on SQLite; the Alembic
migrations are written but have not been applied to a live PostgreSQL), OIDC,
PDF rendering, field-level encryption, the 50k × 12 load test, and the
accessibility audit.

**Datasets the synthetic generator does not yet produce**, so the rules that
need them report `NOT_EVALUATED` naming the dataset rather than firing: GSTR-2B,
the e-way bill register, the cash and credit ledgers, and supplier filing
status. `tests/integration/test_demo_dataset.py` pins that honestly rather than
hiding it.
