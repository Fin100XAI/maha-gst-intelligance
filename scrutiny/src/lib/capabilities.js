// The 31 capabilities of the InQAI master execution document, and where each lives in this POC: screen, engine
// module, tests, and what is deliberately left out. Shown on the Governance screen so the claim "what is built" can
// always be checked against the code.
export const STATUS = {
  built: 'Built',
  partial: 'Built, with a stated gap',
  deferred: 'Deferred (production)',
  excluded: 'Not built, by design',
};

const C = (n, layer, name, status, view, engine, tests, note = '') => ({ n, layer, name, status, view, engine, tests, note });

export const CAPABILITIES = [
  C(1, 'A', 'Taxpayer revenue baseline', 'built', 'taxpayer', 'baseline.js', 'dataset.test.mjs'),
  C(2, 'A', 'Revenue target intelligence', 'built', 'targets', 'targets.js, collections.js', 'leadership.test.mjs', 'Allocation below the jurisdiction uses a stated method until a department-approved allocation is loaded.'),
  C(3, 'A', 'Revenue growth / decline intelligence', 'built', 'revenue', 'revenue.js, targets.js', 'revenue.test.mjs, leadership.test.mjs'),
  C(4, 'A', 'Top / bottom contributor intelligence', 'built', 'revenue', 'revenue.js, targets.js', 'revenue.test.mjs, leadership.test.mjs'),
  C(5, 'A', 'Revenue deviation intelligence', 'built', 'taxpayer', 'revenue.js', 'revenue.test.mjs'),
  C(6, 'B', 'Revenue drop explanation engine', 'built', 'taxpayer', 'revenue.js', 'revenue.test.mjs'),
  C(7, 'B', 'Explained vs unexplained revenue gap', 'built', 'taxpayer', 'revenue.js', 'revenue.test.mjs'),
  C(8, 'B', 'Alternative-explanation intelligence', 'built', 'taxpayer', 'revenue.js', 'revenue.test.mjs'),
  C(9, 'B', 'Evidence-linked explanation', 'built', 'taxpayer', 'revenue.js', 'revenue.test.mjs'),
  C(10, 'C', 'Buyer-seller entity resolution', 'partial', 'network', 'network.js', 'network.test.mjs', 'PAN and names only: no address or other linkage data in the returns extract.'),
  C(11, 'C', 'Counterparty authenticity intelligence', 'built', 'taxpayer', 'network.js', 'network.test.mjs'),
  C(12, 'C', 'Multi-hop transaction graph', 'built', 'taxpayer', 'network.js', 'network.test.mjs', 'Runs in the browser over the loaded returns, not at state-wide scale.'),
  C(13, 'C', 'Network anomaly intelligence', 'partial', 'network', 'network.js', 'network.test.mjs', 'Synchronised activity across unrelated parties is not detected yet.'),
  C(14, 'C', 'Transaction exposure intelligence', 'built', 'network', 'network.js', 'network.test.mjs'),
  C(15, 'C', 'Genuine-vs-requires-verification evidence', 'built', 'taxpayer', 'network.js', 'network.test.mjs'),
  C(16, 'D', 'Consume existing EIU signals', 'built', 'eiu', 'eiu.js, registers.js', 'eiu.test.mjs, registers.test.mjs', 'By register upload; a live EIU connector needs approved integration.'),
  C(17, 'D', 'Risk signal revalidation', 'built', 'eiu', 'eiu.js', 'eiu.test.mjs'),
  C(18, 'D', 'Taxpayer / CA reconciliation intelligence', 'built', 'eiu', 'eiu.js, scripts/lib/docText.mjs', 'eiu.test.mjs, docs.test.mjs', 'Claims found by fixed patterns; scanned (image) PDFs need their text pasted (no OCR).'),
  C(19, 'D', 'Reconciliation challenge engine', 'built', 'eiu', 'eiu.js', 'eiu.test.mjs, cases.test.mjs'),
  C(20, 'D', 'Unresolved revenue exposure', 'built', 'eiu', 'eiu.js', 'eiu.test.mjs'),
  C(21, 'E', 'Self-assessed / regular revenue intelligence', 'partial', 'collections', 'collections.js', 'leadership.test.mjs', 'No official collection totals loaded to reconcile against.'),
  C(22, 'E', 'Departmental intervention revenue', 'built', 'actions', 'actions.js', 'leadership.test.mjs'),
  C(23, 'E', 'Complete action funnel', 'built', 'actions', 'actions.js', 'leadership.test.mjs'),
  C(24, 'E', 'Departmental action yield', 'built', 'actions', 'actions.js', 'leadership.test.mjs'),
  C(25, 'E', 'Effort-to-outcome intelligence', 'built', 'actions', 'actions.js', 'leadership.test.mjs'),
  C(26, 'F', 'Recovery intelligence', 'built', 'recovery', 'recovery.js', 'leadership.test.mjs'),
  C(27, 'F', 'Case outcome prediction', 'excluded', 'learning', '-', '-', 'Needs a large validated history of real outcomes, leakage controls and calibration (guardrail 8).'),
  C(28, 'F', 'Revenue trajectory intelligence', 'built', 'collections', 'collections.js', 'leadership.test.mjs'),
  C(29, 'F', 'Outcome learning loop', 'built', 'learning', 'actions.js', 'leadership.test.mjs', 'Counts over closed cases; no rule or model retraining pipeline.'),
  C(30, 'G', 'Role-specific intelligence', 'partial', 'overview', 'roles.js', 'leadership.test.mjs', 'The role is a switch in the POC; login-based access control is deferred.'),
  C(31, 'G', 'Evidence, governance and human authority', 'partial', 'governance', 'scripts/lib/caseLog.mjs, scripts/governance.js', 'cases.test.mjs', 'POC: hash-chained audit log, code fingerprints, data freshness, decision status, human gates. Deferred: login, RBAC, encryption, retention, security testing.'),
];

/** The human-authority gates enforced in code, and where. */
export const GATES = [
  ['A notice (ASMT-10) is drafted only after the notice readiness checklist is complete; the console never issues one.', 'src/views/Notices.jsx, src/engine/verify.js'],
  ['A case closes only with a closure code and written reasons.', 'src/lib/caseEvents.js (close)'],
  ['Readiness steps that need a written record (reasons, approval) refuse to complete without one.', 'src/lib/caseEvents.js (readiness)'],
  ['An EIU challenge (exclusions, assumptions) is saved only with a reason; disagreeing with a revalidation needs a note.', 'src/lib/caseEvents.js (eiu-challenge, eiu-review)'],
  ['Rule outcomes (confirmed, dropped, …) need written reasons.', 'src/lib/caseEvents.js (disposition)'],
  ['Recovery is ranked and a next step suggested; nothing is initiated.', 'src/engine/recovery.js'],
  ['Every rupee figure is computed deterministically; AI only writes briefings, from masked facts, and its figures are checked against the data.', 'src/engine/*, src/lib/ai.js'],
  ['Registers and reply documents are stored as received, with their SHA-256; signals are never edited.', 'scripts/lib/registerStore.mjs, scripts/doc-store.js'],
  ['Case events are append-only and hash-chained: an edited, removed or reordered line is detected.', 'scripts/lib/caseLog.mjs'],
  ['Findings are labelled preliminary; anomalies and evidence states are never called fraud or liability.', 'src/engine/verify.js (PRELIMINARY) in the scrutiny report, scrutiny note and evidence pack; short notes on Revenue, Network, EIU and Collections'],
];

/** What this POC leaves for production, stated rather than implied. */
export const DEFERRED = [
  'Login, identity and role-based access (the signed-in name is recorded, but not authenticated).',
  'Encryption at rest, retention and deletion policies, and approved hosting.',
  'Approved integrations with GSTN, the back-office and EIU systems (data arrives by file upload here).',
  'State-wide scale: server-side data store and distributed computation instead of in-browser analysis.',
  'Security testing (VAPT), model and rule change approval workflow, incident response.',
];
