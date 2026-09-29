// Verification-first language. A rule result is a preliminary computational exception, not a determination
// of liability: each rule gets a neutral verification step and the evidence needed before any conclusion.
// The matrix "Action" (pay / reverse / notice) is shown only as the route if the discrepancy is confirmed.

export const PRELIMINARY = 'Preliminary system finding: generated from return and transaction data. It is not a determination of tax liability, ineligibility of ITC, fraud, suppression or intent. The authorised officer must validate source data, applicable law, reconciliation and taxpayer evidence before any statutory action.';

// [step, evidence required before closure]
const STEPS = {
  'A-01': ['Validate supplier GSTIN status', 'GSTIN master status on the portal for the invoice dates, registration and cancellation orders, and supplier correspondence.'],
  'A-02': ['Confirm return filing position', 'Portal filing history for each period, ARN and filing dates, and any pending returns.'],
  'B-01': ['Reconcile ITC claimed with GSTR-2B', 'Period-wise 3B Table 4 claim, GSTR-2B document rows, purchase register, timing differences and any DRC-01C reply.'],
  'B-04': ['Validate supplier filing and Rule 37A applicability', 'Supplier GSTR-3B status on the portal, invoice-wise ITC, 2B appearance, recipient availment period, reversal and re-availment history, and the applicable deadline.'],
  'B-07': ['Verify the s.16(4) time limit', 'Invoice dates, the period ITC was availed, Table 4D(2) reporting and any s.16(5)/(6) relaxation.'],
  'B-08': ['Verify whether ITC was claimed twice', 'Purchase register, voucher IDs, invoice identifiers, GSTR-2B document rows, GSTR-3B claim period, amendments and past reversals.'],
  'B-09': ['Reconcile import IGST', 'Bills of entry, ICEGATE data, GSTR-2B IMPG rows and 3B Table 4A(1) claims by period.'],
  'C-01': ['Verify reverse-charge liability', 'Nature of inward supplies, notified RCM categories, supplier registration status and cash-ledger payments.'],
  'C-02': ['Verify RCM credit sequence', 'RCM tax paid in cash, the period of payment, and the period in which the related ITC was claimed.'],
  'D-01': ['Verify place of supply and tax head', 'Invoice place of supply, recipient location, and IGST vs CGST/SGST charged.'],
  'D-02': ['Verify ITC on out-of-state immovable property services', 'Invoices, place of supply of the service and ITC claimed on them.'],
  'F-06': ['Check Rule 86B applicability', 'Monthly taxable value, cash payment share, exemptions under Rule 86B and income-tax payment history.'],
  'G-01': ['Reconcile turnover across returns', 'GSTR-1, GSTR-3B and books turnover by period, amendments, credit notes and any DRC-01B reply.'],
  'G-02': ['Reconcile GSTR-1 and GSTR-3B liability', 'Period-wise tax in GSTR-1 and 3B, amendments in later periods, and any DRC-01B reply.'],
  'G-03': ['Reconcile e-invoices with GSTR-1', 'IRN data, e-invoice applicability threshold and GSTR-1 B2B rows.'],
  'G-10': ['Verify rates and HSN', 'Invoices, HSN classification, applicable rate notifications and the HSN summary.'],
  'G-12': ['Obtain an explanation for invoice-series gaps', 'Document-issued summary, cancelled invoices and series-wise registers.'],
  'G-14': ['Reconcile TDS/TCS credits with turnover', 'GSTR-7/8 credits, the deductors involved and supplies declared to them.'],
  'H-01': ['Verify credit-note time limits', 'Credit-note dates, the original invoices and the s.34(2) deadline.'],
  'H-02': ['Verify credit-note linkage', 'Original invoice references and the underlying commercial documents.'],
  'H-06': ['Verify purchase-side credit notes', 'Supplier credit notes in 2B and matching ITC reversal in 3B.'],
  'H-08': ['Review the credit-note pattern', 'Credit-note timing, parties, reasons and supporting commercial documents.'],
  'J-01': ['Verify interest computation', 'Return due date, actual filing date, tax paid in cash, day-wise calculation, interest provision (s.50), interest already paid and ledger proof.'],
  'J-03': ['Verify late-fee computation', 'Due date, filing date, nil or non-nil return, fee paid in the cash ledger and any waiver notification.'],
  'K-01': ['Record the applicable proceeding section', 'Financial year, limitation dates and only verified discrepancies.'],
  'K-02': ['Treat risk indicators as leads only', 'Corroborative transaction, movement, banking, e-way bill, e-invoice, stock or service-delivery and counterparty evidence.'],
  'K-04': ['Check the s.74A threshold', 'Verified tax amount only, after all explanations are recorded.'],
  'K-07': ['Note indicative penalty ranges only', 'Applies only after a verified, reasoned finding; not an instruction to pay.'],
};
const GENERIC = ['Verify against source records', "Source return rows, the reconciliation working, books of account and the taxpayer's explanation."];

export const verifyStep = (id) => STEPS[id] || GENERIC;

// Case-level next steps: neutral instructions only (verify, reconcile, obtain evidence, record conclusion, seek approval).
export const DESK_REVIEW = 'Open a desk-review case; prepare a scrutiny note only after the discrepancies are verified and the notice readiness checklist is complete.';

// Guard for free text (e.g. AI output): statements that instruct payment, reversal or a notice from unverified data.
export const CONCLUSIVE = /\bDRC-03\b|\bpay\b[^.]*\b(tax|interest|cash|late fee)\b|\breverse\b|\b(issue|draft|send|serve)\b[^.]*\b(ASMT-10|notice|SCN)\b/i;

// Rule 37A: a supplier has until 30 September after the financial year to file GSTR-3B; if still unfiled, the
// recipient reverses by 30 November (re-availment allowed once the supplier pays). Status is judged as at
// the date of the data extract, never from today's clock, so the analysis stays deterministic.
export function rule37A(fyStart, asOf) {
  const supplierBy = `${fyStart + 1}-09-30`;
  const reverseBy = `${fyStart + 1}-11-30`;
  const stale = !asOf || asOf <= supplierBy; // extract predates the supplier deadline: status can still change
  return { supplierBy, reverseBy, rag: stale ? 'amber' : 'red' };
}

// Notice readiness checklist: every item must be recorded before an ASMT-10 draft can be prepared.
// The last item gates finalising (save / print / download) of the draft itself.
export const READINESS = [
  ['period', 'Return period and taxpayer profile verified'],
  ['locked', 'Source data and reconciliation version locked'],
  ['precise', 'Precise discrepancy identified for each included item'],
  ['legal', 'Legal provision and procedural route selected'],
  ['classified', 'Each difference classified as tax, ITC, interest, late fee or data mismatch'],
  ['evidence', 'Books and third-party evidence reviewed'],
  ['response', "Taxpayer's response or opportunity to clarify recorded, where appropriate"],
  ['reasons', 'Reasons recorded in writing by the officer'],
  ['approval', 'Supervisory approval obtained'],
  ['factcheck', 'Draft text reviewed, edited and fact-checked before issue'],
];
export const DRAFT_GATE = READINESS.slice(0, -1).map(([k]) => k);

// The matrix action, shown only as the route if a discrepancy is confirmed. Rule 37A gets its actual dates.
export function routeIfConfirmed(r, matrixAction) {
  const d = (iso) => iso.split('-').reverse().join('-');
  if (r.id === 'B-04' && r.deadlines) return `reversal by ${d(r.deadlines.reverseBy)} only for invoices still unfiled by the supplier on ${d(r.deadlines.supplierBy)}; re-availment once the supplier pays`;
  return matrixAction || '-';
}

// ---------------------------------------------------------------- phase 2: officer outcomes and measures

// Every alert ends in one of five outcomes. Only a confirmed discrepancy can feed tax, interest, reversal,
// DRC-03, scrutiny or notice workflows.
export const DISPOSITIONS = [
  ['confirmed', 'Confirmed discrepancy', 'Verified against source records: eligible for tax, interest, reversal or notice workflows.'],
  ['explained', 'Explained by taxpayer', "The taxpayer's explanation and documents account for the difference."],
  ['timing', 'Timing / reconciliation difference', 'The difference reverses in another period or reconciles in the books.'],
  ['source', 'Source-data issue', 'The extract or return data is incomplete or wrong: not a taxpayer discrepancy.'],
  ['dropped', 'Dropped / false positive', 'The rule fired but there is no discrepancy.'],
];
export const DISPOSITION_LABEL = Object.fromEntries(DISPOSITIONS.map(([k, l]) => [k, l]));

// Reasoned closure codes. "Without demand" = closed with no confirmed liability pursued.
export const CLOSURE = [
  ['no-discrepancy', 'No discrepancy after verification', true],
  ['explained', 'Explanation accepted (ASMT-12)', true],
  ['voluntary', 'Paid or reversed voluntarily after verification', false],
  ['referred', 'Referred for audit or investigation', false],
  ['proceedings', 'Proceedings initiated (s.73 / 74 / 74A)', false],
];
export const CLOSURE_LABEL = Object.fromEntries(CLOSURE.map(([k, l]) => [k, l]));

// Risk indicators that count, and review prompts that are shown but never scored.
export const raisedIndicators = (a) => a.fraud.filter((f) => f.flagged && !f.prompt);
export const reviewPrompts = (a) => a.fraud.filter((f) => f.flagged && f.prompt);

// Items the officer must decide on (K-series are informational meta checks, not discrepancies).
export const isIssue = (r) => (r.status === 'Fail' || r.status === 'Review') && !r.id.startsWith('K-');

// Rule 37A cannot be confirmed while suppliers still have time to file (judged on the officer's date).
export function confirmBlocked(r, today) {
  if (r.id === 'B-04' && r.deadlines && today <= r.deadlines.supplierBy) return `Suppliers have until ${r.deadlines.supplierBy.split('-').reverse().join('-')} to file GSTR-3B: Rule 37A cannot be confirmed before then.`;
  return null;
}

// Enforcement readiness (0-100): is there verified evidence for legal action? It stays low until the officer has
// recorded outcomes, confirmed at least one discrepancy and worked through the notice readiness checklist.
export function enforcementReadiness(a, c = {}) {
  const issues = a.results.filter(isIssue);
  const disp = c.dispositions || {};
  const decided = issues.filter((r) => disp[r.id]);
  const confirmed = issues.filter((r) => disp[r.id]?.code === 'confirmed');
  const checklist = READINESS.filter(([k]) => c.readiness?.[k]).length;
  const parts = [
    { label: 'Issues with a recorded outcome', v: issues.length ? decided.length / issues.length : 0, w: 40, note: `${decided.length} of ${issues.length}` },
    { label: 'Confirmed discrepancy on record', v: confirmed.length ? 1 : 0, w: 30, note: `${confirmed.length} confirmed` },
    { label: 'Notice readiness checklist', v: checklist / READINESS.length, w: 30, note: `${checklist} of ${READINESS.length}` },
  ];
  const score = issues.length ? Math.round(parts.reduce((s, p) => s + p.v * p.w, 0)) : null;
  return { score, parts, issues: issues.length, decided: decided.length, confirmed: confirmed.length, confirmedAmount: confirmed.reduce((s, r) => s + (r.exposure || 0), 0) };
}

// Effectiveness across the jurisdiction: rewards accuracy and defensibility, not alert volume.
export function effectiveness(taxpayers, cases) {
  const byCode = Object.fromEntries(DISPOSITIONS.map(([k]) => [k, 0]));
  const perRule = {};
  let decided = 0, computedDecided = 0, sustained = 0;
  for (const a of taxpayers) {
    const disp = cases[a.id]?.dispositions || {};
    for (const r of a.results.filter(isIssue)) {
      const d = disp[r.id];
      if (!d) continue;
      decided++; byCode[d.code]++;
      computedDecided += r.exposure || 0;
      if (d.code === 'confirmed') sustained += r.exposure || 0;
      const p = (perRule[r.id] ||= { id: r.id, n: 0, confirmed: 0, dropped: 0 });
      p.n++; if (d.code === 'confirmed') p.confirmed++; if (d.code === 'dropped') p.dropped++;
    }
  }
  const closed = taxpayers.filter((a) => cases[a.id]?.status === 'Closed');
  const closureBy = Object.fromEntries(CLOSURE.map(([k]) => [k, closed.filter((a) => cases[a.id]?.closure?.code === k).length]));
  const noDemand = new Set(CLOSURE.filter(([, , nd]) => nd).map(([k]) => k));
  return {
    decided, byCode, computedDecided, sustained,
    confirmedRate: decided ? byCode.confirmed / decided : null,
    falsePositiveRate: decided ? byCode.dropped / decided : null,
    sustainedShare: computedDecided ? sustained / computedDecided : null,
    closed: closed.length, closedNoDemand: closed.filter((a) => noDemand.has(cases[a.id]?.closure?.code)).length, closureBy,
    perRule: Object.values(perRule).sort((x, y) => y.dropped / y.n - x.dropped / x.n || y.n - x.n),
  };
}
