# GST Intelligence

GST return scrutiny console (proof of concept). It reads the "Get Download All Report" returns workbook for each
GSTIN and financial year (the files seen so far are exported by a GST software tool rather than downloaded directly
from the GST portal), reconciles GSTR-1, GSTR-3B, GSTR-2A/2B and the electronic ledgers period by period, tests the returns
against the 141-rule **GST Scrutiny Rule Matrix**, raises risk indicators, ranks taxpayers by review priority and helps the
officer verify before acting: case queue, notes, scrutiny notes, a notice readiness checklist before any ASMT-10 draft,
printable reports and key-insight briefings (deterministic or AI).

> **Verification first.** Every rule result is a *preliminary system finding*: not a determination of tax liability,
> ITC ineligibility, fraud, suppression or intent. Next steps are verification steps only (no "pay via DRC-03",
> "reverse" or "draft ASMT-10" from unverified alerts). Rule 37A (B-04) is judged Green / Amber / Red as at the date
> of the data extract against the 30 September supplier and 30 November reversal deadlines. ASMT-10 drafting unlocks
> only after the notice readiness checklist; the console never sends, signs or finalises a notice.
>
> **Evidence workflow.** Each alert takes one of five officer outcomes (confirmed, explained, timing, source-data
> issue, dropped) with written reasons; only confirmed discrepancies can enter a notice. Rule 37A has an invoice-wise
> table, duplicate ITC a matching hierarchy (exact / probable / amendment- or credit-note-linked / recurring / not a
> duplicate), interest a full per-period working. Taxpayer 360° shows data confidence, review priority and enforcement
> readiness separately. Every rule offers a SHA-256-fingerprinted evidence pack; cases close only with a closure code
> and reasons, and the Cases page reports confirmed and false-positive rates and value sustained.

> Figures are indicative tax from returns data only, for prioritising scrutiny. They are not a demand
> computation. Verify against books and current law before any notice.
>
> **This repository contains confidential taxpayer data** (return workbooks in `data/`, generated
> `public/data.json` and saved reports in `public/reports/`). Keep it private and limit access.
>
> `data/` also holds **synthetic data** for demonstration: the ward PUNE-WARD-01 (`[SYN]`), four `[TEST]` workbooks and
> made-up registers, all with `ZZ` PANs. Remove it from any installation officers rely on (DEPLOYMENT.md, section 1)
> and never present it as departmental results.

---

## Quick start (local)

Requirements: **Node.js 20+** (22 recommended). Microsoft Edge or Google Chrome for PDF export.

```bash
npm install
npm run dev            # builds public/data.json from ./data, then serves http://localhost:5180
```

Open http://localhost:5180 → **Enter scrutiny workspace** → sign in with your official email and the workspace
password (ask your administrator).

To switch on AI briefings, create `.env.local` in the project folder (see `.env.local.example`):

```
AI_API_KEY=your-key-here
```

and restart `npm run dev`. The sidebar shows a green **live** light next to *AI assistant* when the key works.

## Production

```bash
npm run build          # data + optimised web app into ./dist
npm start              # node server.mjs  →  http://127.0.0.1:8080
```

or with Docker: `docker compose up -d --build`. Full instructions, security notes and configuration are in
**[DEPLOYMENT.md](DEPLOYMENT.md)**.

There is no automatic deployment: merging to `main` changes nothing that is running. To put a new version live, pull
and rebuild on the machine that serves the app (DEPLOYMENT.md, section 4, which also covers keeping existing data).

---

## What it does

| Area | Screens |
|---|---|
| Public | Landing page, Features, Guide, How to, Rules catalogue (all 141 rules, CSV export) |
| Operate | **Dashboard** (portfolio risk, exposure, which checks drive risk, key insights; built for thousands of taxpayers) · **Revenue** (who moved the jurisdiction's cash collection year on year, and whether the returns explain it) · **Network** (from all trade to unresolved exposure, anomalies with their paths, same-PAN entities and a review queue) · **EIU signals** (each signal as received, revalidated on the latest returns, the reply tested claim by claim, the officer's challenge, and the exposure ledger) · **Cases** (queue by status) · **Taxpayer 360°** (reconciliation, trade patterns, revenue change, counterparties, risk indicators, rule findings with evidence and verification steps, case file) · **Notices** (scrutiny note, notice readiness checklist, then the ASMT-10 composer) · **Reports** (printable scrutiny report, HTML/PDF library) |
| Leadership | **Overview** (field officer, supervisor and commissioner views of one evidence base) · **Collections** (collection base by class, trajectory with range, gap to target, drivers, what-if and backtest) · **Targets** (target by range, officer, sector or taxpayer with a stated method; sector movement; concentration) · **Actions** (case funnel, action yield, effort and outcome, revenue after action) · **Recovery** (ranked worklist of established demands) · **Learning** (what closed cases teach) |
| Configure | **Governance** (decision status of findings, hash-chained audit trail, data freshness, code fingerprints, human-authority gates, capability register) · **Rule register** · **Risk scoring** (weights, bands, exclusions with live preview) · **AI assistant** (key, model, masking, test) · **Upload data** (every input file in three steps: returns files, registers, reply letters; with instructions, sample files and a format guide) |

### Key insights: deterministic or AI

Every *Key insights* panel has a **Deterministic | AI** switch and a close (×) button.

- **Deterministic**: rule-based briefing from the checks and risk indicators (`src/engine/insights.js`).
  Same input, same output; no network.
- **AI**: a large language model writes the briefing from the same facts (`src/lib/ai.js`, via the server proxy
  `scripts/ai-proxy.js`). Safeguards:
  - only a compact fact sheet is sent, never invoices or workbooks; names and GSTINs are masked by default
    (`T01`, `S02` …) and restored locally;
  - money is sent pre-formatted and every ₹ figure in the reply is checked against the source data; mismatches are
    marked ⚠;
  - rule references not present in the facts are removed; model, time and token use are shown; results are cached.

### Revenue change: why did cash paid move?

`src/engine/revenue.js`, shown in **Revenue** and the Taxpayer 360° **Revenue change** tab; needs two financial years
of returns for a GSTIN.

- **Exact bridge.** Cash paid = output tax − ITC used + other, and output tax = turnover × effective rate, so the
  year-on-year change splits into drivers that add up to the rupee: sales to continuing, lost and new customers;
  transfers to other registrations of the same PAN; credit notes; GSTR-1 sales in months without a filed GSTR-3B;
  the remaining 3B-vs-GSTR-1 gap; rate changes on the same HSN; product mix; credit used instead of cash; liability
  above declared tax; reverse charge and rounding. Each driver shows its formula, inputs and the parties behind it.
- **Classes.** Every driver is *explained* (a legitimate, named cause is visible), *partially explained*,
  *unresolved* (for example credit mostly from new or non-filing suppliers) or *data insufficient*.
- **Competing explanations.** Rate change, branch shift, lost customer, credit notes, seasonality or timing,
  genuine decline, credit replacing cash and non-filing are each tested, with evidence for and against, evidence
  still needed and questions for the taxpayer. A decline is de-escalated only when legitimate causes explain it.
- **Month by month.** Each month against the same month last year, with a sustained-step (level shift) split,
  a noise-based band, a materiality floor and a reason code (seasonal shift, late filing, credit notes, unexplained).

This explains movement from the returns only. It is not a finding of liability. `tests/revenue.test.mjs` checks it
against every revenue story planted in the synthetic ward.

### Counterparties and the network

`src/engine/network.js`, shown in **Network** and the Taxpayer 360° **Counterparties** tab.

- **One graph from all loaded returns.** At build time each workbook is reduced to per-counterparty monthly values
  on both sides, the months GSTR-3B was filed, and a FIFO flow model (days from purchase to sale, mark-up, which
  supplier's goods went to which customer). Where both parties' returns are loaded, an edge keeps the seller's
  GSTR-1 and the buyer's GSTR-2B side by side. It ships in `data.json` as `network`; invoices stay on the server.
- **Entities.** GSTINs sharing a PAN are linked automatically (one legal person, each GSTIN kept). Same or similar
  names under different PANs, one GSTIN reported under unrelated names, and invalid GSTINs go to a review queue.
  Nothing is merged on a guess.
- **Paths.** Suppliers of suppliers (or buyers of buyers) several levels deep, pruned to material links, with the
  pruned links counted and loops marked.
- **Anomalies**, each with its exact path, window, reason and a baseline from the same data:
  - circular trade and rapid pass-through
  - suppliers invoicing without GSTR-3B, and invoices after cancellation or suspension (from the taxpayer master)
  - abrupt network formation, seller and buyer records that differ, and invalid GSTINs
  - two-way trade next to a cycle
  - context items: dependence on one supplier, and same-PAN trade
- **Exposure funnel.** All trade → material → anomalous → unresolved exposure (credit claimed on anomalous
  edges, plus tax charged in months without GSTR-3B), each edge counted once.
- **Counterparty cards.** Consistent, contradictory and missing evidence, with questions to resolve, ending in an
  evidence state (*requires verification*, *insufficient evidence* or *consistent*), never "fake".

`tests/network.test.mjs` checks every network story in the synthetic ward. Limits: only loaded returns are
visible, so a counterparty whose returns are not loaded is seen from one side, and invoices missing from GSTR-2B
(the ward's cancelled supplier) are left to the rule engine (B-01). Synchronised activity across unrelated parties
is not yet detected.

### EIU signals: is the risk still there?

`src/engine/eiu.js`, shown in **EIU signals**; signals come from the EIU register (Upload data, step 2).

- **As received.** The uploaded file is stored unchanged with its SHA-256, and no signal is ever edited. Each
  signal is mapped to a canonical type: by rule id first, then by its wording; unmapped parameters are marked.
- **Revalidation.** The same definition is recomputed on the latest loaded returns, as components classed
  *resolved*, *explained*, *unresolved* or *data insufficient*. Each signal is then *resolved*, *reduced*,
  *unchanged*, *increased*, *explained* or *data insufficient*, with the reason and remaining questions.
  Interest is raised as an indicative question, never added to the amount.
- **Replies.** A taxpayer or CA reply is split into claims (made good later, reversed, filed, suppliers
  compliant, branch shift, margin, e-invoices and so on). Each is tested against the returns and comes out
  *supported*, *partial*, *contradicted* or *not testable from returns*, with the amount supported, the record,
  the contradiction, the missing proof and the residual.
- **Challenge.** An officer can exclude components or change stated assumptions (for example refuse to net a
  later return). The result recalculates at once, the platform lists which single change would move the
  conclusion, and saving needs a reason. Replies, challenges and the officer's review are case events in the
  same append-only log; a review given against an earlier result is marked outdated.
- **Exposure ledger.** Signalled → recomputed → reconciled, unresolved, data insufficient and officer-excluded.
  The tax on one flow in one month counts once across signals.

`tests/eiu.test.mjs` checks the seven ward signals and the replies in `test-data/ward/replies.json` against the
answer key.

### Leadership: collections, action, recovery and learning

`src/engine/collections.js`, `actions.js`, `recovery.js` and `roles.js`. The screens are under **Leadership**, and all
of them read one evidence base (`evidenceBase()`), so no two screens can disagree on a figure.

- **Collections.** Cash collected by month and taxpayer in four defined classes: regular GSTR-3B cash, interest
  and fees, payments after departmental action, and ITC set-off shown beside (not a collection). The exceptions
  are listed: unfiled months, whole liability set off with ITC, and quarterly attribution.
- **Trajectory.** Each taxpayer is forecast from the same month last year and its growth so far. It switches to
  the recent level on a step change (stopped filing, a rate change). The about-80% range is calibrated on last
  year's error. The page shows the gap to the targets register, the taxpayers driving the change, what-if sliders
  for the largest contributors, and, for a past date, how the forecast actually did and whom it missed.
- **Actions.** One case list from the case action register (new register type) and this platform's own cases:
  - the stages reached, where open cases sit and for how long, and the bottleneck (the departmental stage holding
    the most money past its limit)
  - action yield by cohort: selected → unresolved → established → realised, with every numerator, denominator
    and definition shown
  - effort against yield by case type (never by officer), with process suggestions
  - revenue after action as direct, probable or unattributed; appeal pre-deposits kept apart
- **Recovery.** Established demands, split into recoverable now, not yet (appeal period, appeal, stay) and
  settled. They are ranked by a published points rule, and each has a suggested next step for the officer;
  nothing starts automatically.
- **Learning.** Outcome mix and conversion by risk type and source, recurring explanations, evidence combinations,
  and effort that produced no outcome. Outcome prediction (capability 27) is deliberately not offered.

`tests/leadership.test.mjs` checks these against the synthetic ward's case history (`registers/caselog.csv`,
generated by `scripts/synth/cases.mjs`) and its planted stories.

### Commissioner demo, reply documents and governance

- **Commissioner demo** (Help). This is the document's 20-minute demonstration as a printable script with
  readiness checks. A presenter panel sits beside the screen and never blocks it: it opens each screen, rings
  what to point at, lists what to say, and keeps a clock against each part's slot. Page Down and Page Up work
  with a presentation clicker.
- **Reply documents.** On an EIU signal, or in step 3 of *Upload data*, a taxpayer's or CA's letter can be attached
  as PDF, Word or text. The
  original is stored once under its SHA-256 (`store/docs`) and its text is read (`scripts/lib/docText.mjs`, no
  new dependency; scanned PDFs need the text pasted). Letter furniture is skipped, and the claims are tested as
  before. `test-data/ward/replies/` holds synthetic letters.
- **Governance** (Configure). It shows:
  - where every finding stands with the officer (decided or awaiting)
  - the case log as a tamper-evident audit trail: each event carries a hash chained to the one before, and an
    edited, removed or reordered line is reported
  - the freshness of every input
  - SHA-256 fingerprints of the code that produced the numbers
  - the human-authority gates, and where the code enforces each
  - the 31-capability register (`src/lib/capabilities.js`), with gaps stated
  Login, access control, encryption and retention are deferred to production and listed there.

### What is automated

28 of the 141 matrix rules are evaluated from returns data (A-01/02, B-01/04/07/08/09, C-01/02, D-01/02, F-06,
G-01/02/03/10/12/14, H-01/02/06/08, J-01/03, K-01/02/04/07) plus 13 risk indicators. The rest need books, GL,
e-way bill, GSTIN-master or annual-return data and are labelled **Needs books**; they are never shown as passed.

---

## Adding data

Everything is uploaded on one page, **Upload data**, in three steps. Each file is checked before it is saved, and a
file that fails never replaces what is already loaded.

| Step | File | How many | Notes |
|---|---|---|---|
| 1 | Returns workbook (`.xlsx`, up to 40 MB) | One per taxpayer per financial year | Saved into `data/`; `public/data.json` is rebuilt on the server. A second file for the same GSTIN and year moves the earlier one to `data/superseded/` |
| 2 | Registers (`.csv` or `.xlsx`): taxpayer master, EIU signals, revenue targets, demands and recoveries, case action register | One each, for the whole jurisdiction | Template on each row. Every row is validated; one bad row rejects the file with the full list of problems. A new upload replaces the previous one (kept in `superseded/`) |
| 3 | Reply letter (PDF, `.docx` or text, up to 15 MB) | One per reply | Choose the EIU signal, attach, check the text read from the letter, record |

Saving is allowed from the server's own machine unless `GST_ALLOW_REMOTE=1`. When the server cannot save a returns
file, it is analysed in this browser only and the page says so.

Without the console: copy workbooks into `data/` and run `npm run build:data` (or restart `npm run dev`). The rule
matrix `GST_Scrutiny_Rule_Matrix.xlsx` also lives in `data/`.

The exact format of every file is in the sample pack below and in its format guide.

## Test data

`test-data/` holds four **synthetic** returns workbooks (names end in `[TEST]`, every PAN starts with `ZZ`) in the
exact export layout, each planting known issues: a clean control, a steel trader with excess ITC, non-filing
suppliers (Rule 37A Red), a duplicate purchase and late returns, a QRMP logistics firm with reverse-charge and
place-of-supply errors, and an inverted-duty textile maker with invalid supplier GSTINs and invoice splitting.
`test-data/README.md` lists the findings each one should produce. Regenerate with `node scripts/make-test-data.mjs`;
upload from *Upload data*. They are loaded on this platform and their scrutiny reports are in the library.

`test-data/ward/` is a larger **synthetic ward, PUNE-WARD-01**: 16 interlinked taxpayers over three financial years
(46 workbooks) with planted revenue-change drivers, network patterns (cycle, pass-through, non-filer, new registrant,
cancelled supplier), five registers in `test-data/ward/registers/` (taxpayer master, EIU signals, targets, demands,
case action register) and synthetic reply letters in `test-data/ward/replies/`. `test-data/ward/answer-key.json`
records every planted fact measured from the data; `tests/ward.test.mjs` checks the engine against it. Regenerate with
`node scripts/synth/ward.mjs`. The ward is loaded on this platform: its workbooks are in `data/` and its registers in
`data/registers/`. All names end in `[SYN]`; never present these figures as departmental results.

### Testing at jurisdiction size

The dashboard is built for a ward or range of 5,000–10,000 taxpayers. No tile draws one mark per taxpayer:
- the risk ranking is a score distribution plus a paged, searchable list
- checks are one row each, with the share of each risk band that has an issue
- turnover against credit dependence is a 6 × 6 grid of counts
- checks-with-issues per taxpayer is binned
- the register pages 25 rows at a time

Clicking a bar, row or cell opens the matching taxpayers as a paged list. Portfolio insights name the first five
taxpayers and count the rest, and the AI briefing receives the top 25 in full plus counts.

To see it at size, open the app with `?scale=8000` (for example `http://localhost:5180/?scale=8000#/dashboard`). The
loaded taxpayers are cloned in the browser with deterministic variation in score, turnover and credit use, up to 20,000.
A banner says so, nothing is saved, and opening a clone shows its original's file. Remove `?scale=` to leave.

## Sample input files (for pipeline teams)

`public/samples/ingestion/` (linked from the *Upload data* page) holds one file of every kind the platform takes in, in the exact format it reads, all invented
(names end in `[SAMPLE]`, PANs start with `ZZ`):

- `00 READ ME - Format guide.xlsx`: every file, sheet and column, whether the platform reads it, the rules a file must
  follow, and the data sources not ingested yet.
- `1 Returns/`: a returns workbook with all 37 sheet types of the export, each with rows.
- `2 Registers/`: the five registers, upload-ready.
- `3 Reply letters/`: a reply letter.

Regenerate with `node scripts/make-ingestion-samples.mjs`; `tests/samples.ingestion.test.mjs` checks the files are
reproduced exactly and pass the platform's own parsers.

## Tests

```bash
npm test        # node:test, no extra dependencies
```

110 tests in `tests/`, offline, no API keys needed. They cover:
- **Characterisation:** the engine's findings on the test data (`engine`, `verify`).
- **The synthetic ward against its answer key:** `ward`, `revenue`, `network`, `eiu`, `leadership`.
- **Records:** case events and the hash-chained log (`cases`), registers, reply documents (`docs`).
- **Data pipeline:** dataset building and upload coalescing (`dataset`, `coalesce`).
- **Scale:** the scale-test helper (`scale`).
- **Generators:** they must reproduce the committed test data and sample pack byte for byte (`generator`,
  `samples.ingestion`).

## Where things are stored

| What | Where |
|---|---|
| Taxpayer returns (input) | `data/*.xlsx` (uploads included; Docker: the `workbooks` volume) → built into `public/data.json` |
| Saved reports (HTML + PDF) | `public/reports/` (Docker: the `reports` volume) · browse at `/reports/` |
| Case record: status, notes, outcomes, checklist, responses, notices, closures, EIU replies, challenges and reviews | `store/events.jsonl` on the server: an append-only, hash-chained event log shared by every browser (Docker: the `cases` volume). Without a server, this browser's storage |
| Registers: taxpayer master, EIU signals, revenue targets, demands and recoveries, case action register | `data/registers/<type>.json`, uploaded from *Upload data* (CSV or XLSX, template provided); each upload validated in full, previous versions in `superseded/`, originals in `originals/` (Docker: the `workbooks` volume) |
| Reply letters | `store/docs/<sha256>.<ext>` with the text read from them, stored once as received (Docker: the `cases` volume) |
| Sample input files and format guide | `public/samples/ingestion/`, served to the *Upload data* page |
| Scoring weights, AI settings, cached AI briefings | this browser's local storage |
| AI key | `.env.local` (server only, never bundled) or AI assistant page (this browser only) |

## Project layout

| Path | Role |
|---|---|
| `src/engine/parse.js` | Workbook → normalised taxpayer (3B, GSTR-1, 2A/2B, ledgers, challans) |
| `src/engine/analyze.js` | Period reconciliation, 28 rule checks, risk indicators, chart data |
| `src/engine/verify.js` | Verification steps per rule, preliminary-finding text, Rule 37A deadlines, readiness checklist, outcomes, closure codes, enforcement readiness, effectiveness |
| `src/lib/evidencePack.js` | Evidence pack builder (HTML + embedded JSON + SHA-256 fingerprint and in-file Verify) |
| `src/engine/score.js` · `insights.js` | Risk score and bands · deterministic key insights |
| `src/engine/baseline.js` · `revenue.js` | Year-on-year baseline per GSTIN · revenue-change explanation |
| `src/engine/network.js` · `gstin.js` | Buyer-seller graph, entities, paths, anomalies, exposure funnel · GSTIN validation |
| `src/engine/eiu.js` | EIU signal revalidation, reply claims, challenge, exposure ledger |
| `src/engine/collections.js` · `targets.js` · `actions.js` · `recovery.js` · `roles.js` | Leadership: collections and trajectory, targets, case funnel and yield, recovery, role views |
| `src/engine/registers.js` | The five register definitions and their validation |
| `src/lib/capabilities.js` · `caseEvents.js` | Capability register · case event types |
| `src/lib/scaleTest.js` · `samples.js` | `?scale=N` test clones · sample-file links |
| `src/lib/ai.js` | AI fact sheet, masking, prompt, reply validation and figure check |
| `src/views/*` | Screens (Landing, Login, Dashboard, Cases, Taxpayer 360°, Notices, Report, …) |
| `scripts/build-data.mjs` | Runs the engine over `data/` → `public/data.json` |
| `scripts/ai-proxy.js` · `report-library.js` | Server middleware: AI proxy, report library + PDF export |
| `scripts/data-store.js` · `register-store.js` · `doc-store.js` · `case-store.js` · `governance.js` | Server middleware: returns uploads, registers, reply documents, case log, governance |
| `scripts/lib/*` | Dataset building, upload coalescing, register storage, document text reading, the hash-chained case log |
| `scripts/synth/*` · `make-test-data.mjs` · `make-ingestion-samples.mjs` | Synthetic data generators: workbooks, the ward, case history, letters, the sample pack |
| `tests/*` | node:test suites (`npm test`) |
| `server.mjs` | Production server (static app + the same middleware) |
| `Dockerfile` · `docker-compose.yml` | Container build and run |

## Security notes

- The sign-in page checks the workspace password against a SHA-256 hash in `src/views/Login.jsx`, with a lockout
  after 5 wrong attempts. It is a **client-side gate** for a proof of concept, not server authentication. For any
  shared deployment turn on `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` (see DEPLOYMENT.md) or put the app behind your
  SSO / VPN.
- AI mode sends masked findings to an external AI service. Confirm this is permitted before use on live cases.
- Never commit `.env.local` (it is in `.gitignore` and `.dockerignore`).
