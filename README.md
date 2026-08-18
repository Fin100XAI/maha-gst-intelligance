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
