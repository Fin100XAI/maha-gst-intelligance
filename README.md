# Maha GST Intelligence

**Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST**

A government-grade intelligence platform prototype for the Maharashtra GST Department, built to support revenue protection, taxpayer compliance, fraud-risk detection, audit prioritisation, officer decision support and executive governance. This is a **demonstration build using simulated data** — no live GSTN, e-way bill or banking systems are connected.

---

## 1. Setup

**Requirements:** Node.js 18+ and npm.

```bash
npm install
npm run dev       # start local dev server (http://localhost:5173)
npm run build     # production build to /dist
npm run preview   # preview the production build locally
```

On first load you will be asked to select a **role** (Commissioner, Joint Commissioner, Division Officer, Audit Officer, Refund Officer, Investigation Officer, AI Governance Officer, or Read-only Policy Viewer). This drives role-based access control across the 15 sidebar modules — some modules are restricted to specific roles, matching real departmental access boundaries.

No backend, database or external API is required to run this build. All data is generated deterministically at load time from `src/data/mockData.js`.

---

## 2. Architecture

```
src/
  data/
    mockData.js     Deterministic mock GST dataset (taxpayers, districts, sectors,
                     officers, audits, refunds, e-way bills, litigation, alerts,
                     network clusters, audit log, AI governance metrics, reports)
    risk.js          Explainable, rule-based risk scoring engine
    ai.js            Simulated AI helper layer (no external model calls)
  context/
    AppContext.jsx   Role, global header filters, role-based access control (RBAC)
  components/
    layout/          Sidebar, Header, RoleSelector (login), RoleGate (access control)
    ui/              Shared design-system primitives (KpiCard, RiskBadge, DataTable,
                     Charts, Modal, AIOutputPanel, ExportBar, WhyFlaggedPanel...)
    shared/
      TaxpayerDrilldownModal.jsx   Reusable Taxpayer 360 profile, used across
                                   every module that needs a taxpayer drilldown
  modules/           One component per sidebar section (15 modules)
```

All 15 modules are self-contained React function components that read directly from the shared mock dataset and the global filter/role context — there is no prop-drilling between modules.

---

## 3. Data model

Every simulated taxpayer (`TAXPAYERS` in `mockData.js`) carries:

| Field | Description |
|---|---|
| `gstin`, `legalName`, `tradeName` | Identity |
| `district`, `division`, `sector` | Geography and sector classification |
| `registrationDate`, `isNewRegistration` | Registration behaviour |
| `filingStatus` | Regular Filer / Late Filer / Non-Filer |
| `monthlyTurnover`, `taxPaid`, `itcClaimed`, `refundClaimed`, `ewayBillValue` | Financial behaviour |
| `noticesIssued`, `auditStatus`, `appealStatus` | Enforcement history |
| `complianceHistory` | Narrative compliance classification |
| `supplierRisk`, `buyerRisk` | Upstream/downstream counterparty risk |
| `signals` | Boolean flags for each of the 10 risk rules (see below) |
| `risk` | `{ score, category, triggeredRules }` — computed, explainable |
| `estimatedRevenueExposure` | Modelled exposure used for prioritisation |

Twelve real Maharashtra districts (Mumbai, Thane, Pune, Nagpur, Nashik, Chhatrapati Sambhajinagar, Kolhapur, Solapur, Amravati, Jalgaon, Satara, Raigad) and fourteen priority sectors are represented. Downstream datasets — audit cases, refund cases, e-way bill records, litigation cases, compliance alerts, fake-invoice network clusters, the security audit log and AI governance metrics — are all derived from this base taxpayer population so the platform behaves consistently end-to-end (e.g. a taxpayer flagged for circular trading in the Fake Invoice Network module also appears correctly risk-scored in ITC Risk Intelligence and Taxpayer 360).

### Risk scoring (`src/data/risk.js`)

Risk is computed from **10 explicit, weighted rules** — never a black-box score:

Circular Trading Signal (22) · Non-Filing (20) · Abnormal ITC Spike (18) · E-Way Bill Mismatch (16) · High-Risk Supplier Linkage (15) · Sudden Revenue Decline (14) · High Refund-to-Turnover Ratio (12) · New Registration + High Transactions (12) · Sector Benchmark Deviation (10) · Chronic Late Filing (8).

Triggered rule weights sum to a 0–100 score, bucketed as **Low (0–30) / Medium (31–60) / High (61–80) / Critical (81–100)**. Every score shown anywhere in the UI can be expanded via a **"Why flagged?"** panel listing exactly which rules fired and why — this is the platform's core explainability guarantee.

---

## 4. AI governance notes

All "AI" behaviour in this build is produced by **deterministic mock functions** in `src/data/ai.js` (e.g. `summarizeTaxpayer`, `draftNotice`, `generateAuditChecklist`, `generateExecutiveBrief`) — no external LLM or API is called. This was a deliberate choice for a demo/prototype: outputs are reproducible, auditable, and make the human-in-the-loop contract explicit.

Every AI output object carries:
- `confidence` — Low / Moderate / High / Very High
- `evidenceUsed` — the specific data signals behind the output
- `humanReviewRequired` — whether officer sign-off is mandated
- `limitationNote` — a standard disclaimer that the output is advisory only

The platform enforces, in copy and in workflow, that:
- **AI cannot issue a penalty, block a taxpayer, or reject a refund.**
- AI only produces drafts, checklists, summaries and risk explanations — an authorised officer must review and approve before any action is taken (see the maker-checker pattern in Audit & Scrutiny Engine and Officer AI Copilot).
- The **AI Governance & Security** module tracks recommendation volume, officer approval/rejection rates, false-positive review outcomes, model confidence distribution, drift status, and a simulated audit log of every sensitive action (user, role, action, module, case, timestamp, device, status).

---

## 5. Future backend / API integration plan

This prototype is architected so the mock data layer can be swapped for live services without touching the UI layer:

1. **Replace `src/data/mockData.js` exports** with API-backed data-fetching hooks (e.g. React Query) pointing at:
   - GSTN / state backend for returns, payments, registration data
   - E-way bill portal for movement data
   - Departmental case management system for audits, notices, refunds, litigation
2. **Move risk scoring server-side** — `src/data/risk.js`'s rule structure can be ported directly into a backend rules/ML service; the frontend contract (`{score, category, triggeredRules}`) stays the same so no UI changes are required.
3. **Replace `src/data/ai.js`** with real LLM-backed endpoints (e.g. Claude via the Anthropic API) behind a governed prompt/output logging service, preserving the existing output contract (`confidence`, `evidenceUsed`, `humanReviewRequired`, `limitationNote`) so downstream components need no changes.
4. **Authentication** — replace the role-selector screen with SSO/departmental IAM (e.g. NIC/MahaIT identity provider), keeping the existing `role` string driving `AppContext.jsx`'s RBAC map.
5. **Export functions** — wire `ExportBar` to real PDF/Excel generation services and a briefing-note templating service.
6. **Audit logging** — persist the `AUDIT_LOG` shape to an append-only, tamper-evident store as required for CERT-In/VAPT compliance.

---

## 6. Security & compliance assumptions (prototype scope)

This build **simulates** the following controls in the UI to demonstrate intended behaviour; none are cryptographically enforced in a client-only demo:

- Role-based access control restricting sensitive modules (state-wide dashboard, AI governance, audit case access, refund case access) to specific roles.
- A maker-checker / human-approval step before any audit case advances stage.
- An audit trail of user actions (module, case, timestamp, device, IP, outcome).
- Data minimisation framing for the AI Copilot (PII masking assumption) and encryption-status/VAPT-readiness indicators.

In a production deployment, these controls must be enforced **server-side** (real authentication/authorization, real encryption at rest/in transit, a real immutable audit log, and periodic third-party VAPT/red-team testing), consistent with DPDP Act data-handling obligations and CERT-In empanelled security assessment requirements for government systems.

---

## 7. Disclaimer

All figures, taxpayer names, GSTINs and case data in this build are **synthetically generated** for demonstration purposes only and do not correspond to real taxpayers, real revenue figures, or real enforcement action.

---

## 8. GST Scrutiny

The **GST Scrutiny** tab (beside Command Centre) is the returns scrutiny application, kept in [`scrutiny/`](scrutiny/). It reads GSTR-1, GSTR-3B and 2A/2B workbooks, runs 141 checks per taxpayer and carries cases through to notices. It is its own app with its own server; inside the platform it opens on its dashboard, takes the officer already signed in here, and follows this platform's menu and theme.

**Develop** (two terminals):

```bash
npm run dev             # the platform, http://localhost:5174 (or 5173)
npm run dev:scrutiny    # GST Scrutiny, http://localhost:5182, shown inside the tab
```

Install GST Scrutiny's packages once with `npm --prefix scrutiny ci`; run its tests with `npm run test:scrutiny`.

**Deploy** (one image, one port): the platform is served at `/` and GST Scrutiny at `/scrutiny/` by `scrutiny/server.mjs`.

```bash
docker compose -f docker-compose.platform.yml up -d --build   # http://localhost:8080
```

Without Docker: `npm run build:all`, then run `node scrutiny/server.mjs` with `PLATFORM_DIST=../dist`.

Behind nginx (the platform as static files, GST Scrutiny as its own server): build with `npm run build:all`, start `node scrutiny/server.mjs` **without** `PLATFORM_DIST` (port 8080 by default), and forward `/scrutiny/` to it with the prefix removed. GST Scrutiny makes every request under `/scrutiny/`, so nothing else needs routing:

```nginx
location / {
    root /srv/maha-gst-intelligance/dist;
    try_files $uri /index.html;
}
location /scrutiny/ {
    proxy_pass http://127.0.0.1:8080/;   # trailing slash: /scrutiny/x arrives as /x
    client_max_body_size 50m;            # workbook uploads
}
```

**Taxpayer data.** This repository is public, and filed GST returns are confidential (s.158 CGST Act), so it carries only **synthetic** workbooks (`_SYN ` / `_TEST ` in the file name). Real returns are added on the machine that serves the app: copy them into `scrutiny/data/` (or the `workbooks` volume under Docker) or upload them through *Upload data*. `scrutiny/.gitignore` keeps them, and everything built from them (`public/data.json`, saved reports, the case log), out of git.

**Large-taxpayer data.** GST Scrutiny also carries fictional corporate groups in a *Large Taxpayer Unit* (`LTU-MUMBAI`): 25 groups, 53 registrations with subsidiaries and same-PAN branches in other states, ₹800 to ₹48,000+ crore turnover, two financial years, and clean, high-risk and complex-but-legitimate behaviour (see `scrutiny/test-data/corporates/answer-key.json`). Their 106 workbooks (~100 MB, `_GEN ` in the name) are produced by `scrutiny/scripts/synth/corporates.mjs` from a fixed seed during `npm run build:data`, so they are identical everywhere and never committed. The first build after a pull takes a few minutes longer while they are generated.

**Live upload demo (`LTU-PUNE`).** A second unit, 9 groups and 18 registrations over three financial years (FY 2023-24 to 2025-26, ₹40,000 to ₹49,000 crore a year), is **not** loaded by the build: it is the data an officer uploads live. It reaches the checks the other data does not (import ITC against bills of entry, e-commerce TCS and government TDS against turnover, time-barred ITC, credit notes after the s.34(2) deadline, supplier credit notes not netted, RCM credit above RCM paid, ITC blocked by place of supply, a retrospectively cancelled supplier, duplicate and round-figure invoices, unfiled returns); see `scrutiny/test-data/ltu-pune/answer-key.json`. `npm --prefix scrutiny run pack:ltu-pune -- <folder>` writes the upload pack (53 returns workbooks, the unit's register rows, optional e-way bill exports and a READ ME with the steps and expected findings). Upload it through *Upload data*; `npm --prefix scrutiny run demo:reset` on the server takes the unit out again for the next demo. `npm --prefix scrutiny run validate:synth` checks the generated data end to end (after `npm --prefix scrutiny run gen:ltu-pune` locally): every workbook and year analysed as the build does, each planted problem found where it was planted, clean groups clean, seller and buyer records agreeing.

**Uploads add, never remove.** A returns workbook adds a taxpayer-year (a second file for the same GSTIN and year replaces the first, which moves to `scrutiny/data/superseded/`). A register upload adds its rows: new rows are added, a row with the same key (GSTIN, signal ID, …) is updated, every other saved row stays, and the previous version is archived in `scrutiny/data/registers/superseded/`. A batch of returns is saved first and then analysed once in the background, with progress on screen, so no proxy timeout cuts it off; each workbook's analysis is cached (`scrutiny/data/.cache/`), so only new files are analysed: a rebuild after an upload takes seconds, not minutes.

**Checking an upload.** After an upload, *Upload data* shows a **Latest upload** report: 1 received, 2 checked and saved, 3 analysed (with the reason and a *Try again* button if the analysis stopped), then one row per taxpayer with its risk, failed checks and main findings, and *Open* to Taxpayer 360°. The Dashboard shows the same upload as its first line. The report is kept on the server (`scrutiny/data/uploads.json`, last 20 uploads), so it is still there after a reload. `npm --prefix scrutiny run sample:upload -- <folder>` writes a quick sample to try it: four fictional taxpayers over two years (8 workbooks), one clean and three with a clear problem each.

**Where the data is kept.** GST Scrutiny keeps everything as files on the server, not in a database: uploaded workbooks in `scrutiny/data/` (replaced ones in `data/superseded/`), the analysis the screens read in `scrutiny/public/data.json` (with a per-workbook cache in `data/.cache/`), registers in `data/registers/`, e-way bills in `data/ewb/`, the upload log in `data/uploads.json`, and case actions in `store/`. All of it survives restarts; back up those folders to keep it.

**E-way bills.** GST Scrutiny's *E-way bills* page connects to the e-way bill system and checks the bills against the returns: goods moved with no invoice in GSTR-1 (rule G-05), ITC on goods with no movement behind it (B-03), bill-to-ship-to movements under the wrong tax head (D-05), and one vehicle recorded in two places at once. The NIC e-way bill API needs a GST Suvidha Provider (GSP) registration, API credentials, the taxpayer's e-way bill login and a whitelisted server IP; until those exist the connection uses a **simulated e-way bill system** (`scrutiny/scripts/synth/ewb.mjs`) that derives bills from each taxpayer's invoices under rule 138 (value limits, exempt Chapter 71 goods, services) and plants the high-risk taxpayers' problems. Bills are stored in `scrutiny/data/ewb/` (generated, not committed); **Sync e-way bills** fetches them again with live progress (per GSTIN from Taxpayer 360°, or all at once), and an officer can also upload the portal's e-way bill export for a GSTIN. GST Scrutiny's screens present the data as it would appear from live systems, and the platform header's *Demonstration Environment · Simulated data* notice is not shown while GST Scrutiny is open. The data itself remains generated (see *Large-taxpayer data* above and the simulated e-way bill system); nothing on screen claims a live NIC connection. Setting `EWB_GSP_BASE_URL`, `EWB_GSP_CLIENT_ID`, `EWB_GSP_CLIENT_SECRET`, `EWB_USERNAME` and `EWB_PASSWORD` marks NIC as configured; the live client itself is the next step once credentials are issued.

---

## GST Intelligence - the scrutiny and demand engine

This repository also carries **GST Intelligence**, under `backend/` and
`frontend/`: a working scrutiny and demand platform that reads the returns a
taxpayer actually filed - GSTR-1, GSTR-3B, GSTR-2A, GSTR-2B and the
electronic ledgers - reconciles them, and produces a figure defensible enough
to put in a notice.

Where this application is an intelligence storefront over a seeded dataset,
GST Intelligence is the engine underneath one of its questions. It runs on real
filed data, computes every figure deterministically over `Decimal`, and makes
every number on every screen drill to the cell of the spreadsheet it came
from.

It shares this application's landing page, officer sign-in and shell so the
two read as one system.

See **[GST_INTELLIGENCE.md](GST_INTELLIGENCE.md)** to run it.
