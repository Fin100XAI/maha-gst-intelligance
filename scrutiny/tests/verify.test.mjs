// Unit tests for the pure scoring and verification helpers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gstinValid } from '../src/engine/analyze.js';
import { scoreOf, scoreParts, DEFAULT_SCORING } from '../src/engine/score.js';
import { rule37A, CONCLUSIVE, enforcementReadiness, effectiveness, confirmBlocked, isIssue, READINESS } from '../src/engine/verify.js';
import { analyseFile, testWorkbook, severity } from './helpers.mjs';

test('GSTIN check digit', () => {
  assert.equal(gstinValid('27ZZBFB2202L1ZR'), true);
  assert.equal(gstinValid('27AAPCS8928R1Z2'), false);
  assert.equal(gstinValid('27AAPCS8928R1ZZ'), false);
  assert.equal(gstinValid('0799UNO0000X1ZN'), null, 'non-regular formats are skipped, not failed');
});

test('Rule 37A status follows the extract date against the 30 September deadline', () => {
  assert.deepEqual(rule37A(2025, '2026-09-26'), { supplierBy: '2026-09-30', reverseBy: '2026-11-30', rag: 'amber' });
  assert.equal(rule37A(2024, '2026-09-26').rag, 'red');
  assert.equal(rule37A(2025, '2026-09-30').rag, 'amber', 'on the deadline day the supplier can still file');
  assert.equal(rule37A(2025, null).rag, 'amber', 'unknown extract date is never Red');
});

test('Rule 37A cannot be confirmed before the supplier deadline', () => {
  const r = { id: 'B-04', deadlines: { supplierBy: '2026-09-30' } };
  assert.ok(confirmBlocked(r, '2026-09-27'));
  assert.equal(confirmBlocked(r, '2026-10-01'), null);
  assert.equal(confirmBlocked({ id: 'B-01' }, '2026-09-27'), null);
});

test('conclusive instructions are blocked, verification steps are kept', () => {
  for (const s of ['Pay interest of ₹330 via DRC-03.', 'Reverse ITC of ₹26,919 by 30 Nov.', 'Issue ASMT-10 to T01.', 'Draft a notice for T02.']) assert.ok(CONCLUSIVE.test(s), s);
  for (const s of ['Verify the interest computation against the cash ledger.', 'Obtain supplier GSTR-3B status on the portal.', 'Check whether ITC reversal was already made.']) assert.ok(!CONCLUSIVE.test(s), s);
});

test('score parts reproduce the score exactly for every test taxpayer', () => {
  for (const name of ['Sahyadri', 'Konkan', 'Deccan', 'Narmada']) {
    const a = analyseFile(testWorkbook(name));
    assert.equal(scoreParts(a, DEFAULT_SCORING, severity()).score, scoreOf(a, DEFAULT_SCORING, severity()).score, name);
  }
});

test('enforcement readiness: 40 for outcomes, 30 for a confirmation, 30 for the checklist', () => {
  const a = { results: [{ id: 'B-01', status: 'Fail', exposure: 100 }, { id: 'J-01', status: 'Review', exposure: 50 }, { id: 'K-02', status: 'Fail', exposure: 0 }] };
  assert.equal(enforcementReadiness(a, {}).score, 0);
  assert.equal(enforcementReadiness(a, { dispositions: { 'B-01': { code: 'dropped' } } }).score, 20);
  const all = Object.fromEntries(READINESS.map(([k]) => [k, { at: 'x' }]));
  assert.equal(enforcementReadiness(a, { dispositions: { 'B-01': { code: 'confirmed' }, 'J-01': { code: 'timing' } }, readiness: all }).score, 100);
  assert.equal(enforcementReadiness({ results: [{ id: 'K-02', status: 'Fail' }] }, {}).score, null, 'K-series never counts as an issue');
  assert.equal(isIssue({ id: 'K-02', status: 'Fail' }), false);
});

test('effectiveness rates are computed from recorded outcomes only', () => {
  const tps = [{ id: 'A', results: [{ id: 'B-01', status: 'Fail', exposure: 100 }, { id: 'G-02', status: 'Fail', exposure: 300 }] }];
  const e = effectiveness(tps, { A: { status: 'Closed', closure: { code: 'voluntary' }, dispositions: { 'B-01': { code: 'confirmed' }, 'G-02': { code: 'dropped' } } } });
  assert.equal(e.decided, 2);
  assert.equal(e.confirmedRate, 0.5);
  assert.equal(e.falsePositiveRate, 0.5);
  assert.equal(e.sustainedShare, 0.25);
  assert.equal(e.closed, 1);
  assert.equal(e.closedNoDemand, 0);
});
