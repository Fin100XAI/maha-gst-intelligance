// The one-line verdict and first actions on the Taxpayer 360 page (#6): short, right, and in the right order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verdict, TOP_ACTIONS } from '../src/engine/verdict.js';

const cat = {
  'B-01': { check: 'ITC vs GSTR-2B', action: 'Reverse excess ITC; issue DRC-01A', severity: 'High' },
  'A-02': { check: 'Returns filed', action: 'Ask for the missing returns', severity: 'Med' },
  'C-01': { check: 'Output tax vs GSTR-1', action: 'Recover short payment', severity: 'High' },
  'D-02': { check: 'RCM', action: 'Verify RCM liability', severity: 'Low' },
  'K-02': { check: 'Meta', action: 'n/a', severity: 'Low' },
};
const a = (results, o = {}) => ({ band: 'High', score: 64, exposure: { confirmed: results.filter((r) => r.status === 'Fail').reduce((s, r) => s + (r.exposure || 0), 0) }, results, ...o });

test('a clean taxpayer gets a short, positive verdict and no actions', () => {
  const v = verdict(a([{ id: 'B-01', status: 'Pass' }], { band: 'Low', score: 4 }), cat);
  assert.equal(v.tone, 'good');
  assert.equal(v.line, 'Low risk, score 4: no check failed or needs review.');
  assert.deepEqual(v.actions, []);
});

test('the verdict names the counts, the computed amount as preliminary, and the largest issue', () => {
  const v = verdict(a([
    { id: 'A-02', status: 'Fail', exposure: 0 },
    { id: 'B-01', status: 'Fail', exposure: 2.5e7 },
    { id: 'D-02', status: 'Review', exposure: 1e5 },
    { id: 'K-02', status: 'Fail', exposure: 0 },
  ]), cat);
  assert.equal(v.tone, 'bad');
  assert.equal(v.line, 'High risk, score 64: 2 checks failed with ₹2.5 Cr computed (preliminary), 1 to review. Largest: ITC vs GSTR-2B (₹2.5 Cr).');
  assert.deepEqual(v.actions.map((x) => x.ruleId), ['B-01', 'A-02', 'D-02'], 'failed before review, larger amounts first, informational K checks left out');
  assert.equal(v.actions[0].todo, 'Reverse excess ITC', 'the first step of the catalogue action');
});

test('at most three actions, and checks with an outcome drop out', () => {
  const results = ['B-01', 'A-02', 'C-01', 'D-02'].map((id, i) => ({ id, status: 'Fail', exposure: (4 - i) * 1000 }));
  assert.equal(verdict(a(results), cat).actions.length, TOP_ACTIONS);
  const v = verdict(a(results), cat, { status: 'In review', dispositions: { 'B-01': { code: 'confirmed' } } });
  assert.deepEqual(v.actions.map((x) => x.ruleId), ['A-02', 'C-01', 'D-02']);
  assert.equal(v.next, '3 checks still need an outcome.');
});

test('the next step follows the case', () => {
  const results = [{ id: 'B-01', status: 'Fail', exposure: 10 }];
  assert.match(verdict(a(results), cat, {}).next, /^Start a review/);
  assert.equal(verdict(a(results), cat, { status: 'In review', dispositions: { 'B-01': { code: 'confirmed' } } }).next, 'Outcomes recorded: draft the ASMT-10.');
  assert.match(verdict(a(results), cat, { status: 'In review', dispositions: { 'B-01': { code: 'dropped' } } }).next, /none confirmed/);
  assert.equal(verdict(a(results), cat, { status: 'Notice issued' }).next, 'Follow the notice on the Notices page.');
  assert.equal(verdict(a(results), cat, { status: 'Closed' }).next, 'Case closed.');
});
