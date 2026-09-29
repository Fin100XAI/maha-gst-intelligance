// EIU revalidation (src/engine/eiu.js) against the synthetic ward: the seven signals in registers/eiu.csv, the
// expected outcome of each (answer-key.json eiuExpectations) and the taxpayer / CA replies (replies.json,
// replyExpectations).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { ROOT, analyseFile } from './helpers.mjs';
import { baselineOf } from '../src/engine/baseline.js';
import { parseWorkbook } from '../src/engine/parse.js';
import { tradeOf, graphOf } from '../src/engine/network.js';
import { parseRegister } from '../src/engine/registers.js';
import { readRows } from '../scripts/lib/registerStore.mjs';
import { mapSignal, eiuContext, revalidate, testClaims, extractClaims, parseAmounts, parseMonths, whatChanges, exposureLedger } from '../src/engine/eiu.js';

const WARD = path.join(ROOT, 'test-data', 'ward');
const KEY = JSON.parse(fs.readFileSync(path.join(WARD, 'answer-key.json'), 'utf8'));
const REPLIES = JSON.parse(fs.readFileSync(path.join(WARD, 'replies.json'), 'utf8'));
const register = (t) => { const f = fs.readdirSync(path.join(WARD, 'registers')).find((x) => x.startsWith(t)); return parseRegister(t, readRows(fs.readFileSync(path.join(WARD, 'registers', f)), f)).records; };
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

let ctx, signals;
const sig = (id) => signals.find((s) => s.signalId === id);

before(() => {
  const baselines = {};
  const trades = [];
  for (const w of KEY.workbooks) {
    const file = path.join(WARD, w.file);
    const a = analyseFile(file);
    (baselines[a.gstin] ||= []).push(baselineOf(a));
    trades.push(tradeOf(parseWorkbook(XLSX.read(fs.readFileSync(file), { type: 'buffer' }), w.file)));
  }
  for (const k of Object.keys(baselines)) baselines[k].sort((x, y) => x.fyStart - y.fyStart);
  ctx = eiuContext({ baselines, network: graphOf(trades), master: register('master') });
  signals = register('eiu');
});

test('every ward signal maps to a canonical type; an unknown parameter is kept and marked', () => {
  const types = Object.fromEntries(signals.map((s) => [s.signalId, mapSignal(s).type]));
  assert.deepEqual(types, {
    'EIU-2025-0107': 'riskyItc', 'EIU-2025-0112': 'g1vs3b', 'EIU-2026-0115': 'nonFiling', 'EIU-2025-0121': 'revenueDecline',
    'EIU-2025-0126': 'lowValueAdd', 'EIU-2024-0098': 'itcExcess', 'EIU-2025-0131': 'einvoice',
  });
  const odd = { ...signals[0], signalId: 'EIU-X', parameter: 'Unusual pattern in director changes', ruleId: undefined };
  assert.equal(mapSignal(odd).type, 'unmapped');
  assert.equal(revalidate(odd, ctx).status, 'insufficient');
});

test('revalidation status matches the answer key for all seven signals, and the signal is never altered', () => {
  const expected = { 'EIU-2025-0107': ['unchanged', 'increased'], 'EIU-2025-0112': ['resolved'], 'EIU-2026-0115': ['increased'], 'EIU-2025-0121': ['explained'], 'EIU-2025-0126': ['unchanged'], 'EIU-2024-0098': ['resolved'], 'EIU-2025-0131': ['resolved'] };
  for (const s of signals) {
    const before = JSON.stringify(s);
    const r = revalidate(s, ctx);
    assert.ok(expected[s.signalId].includes(r.status), `${s.signalId}: ${r.status} (key: ${KEY.eiuExpectations[s.signalId]})`);
    assert.equal(JSON.stringify(s), before, `${s.signalId} unchanged`);
    assert.equal(r.original, s.amount);
    assert.ok(r.fresh, `${s.signalId}: the returns are newer than the signal`);
    const t = r.totals;
    near(t.recomputed, t.resolved + t.explained + t.unresolved + t.insufficient, 1, `${s.signalId} classes add up`);
  }
});

test('G-02 (E13): the July shortfall is made good in September; refusing the netting reopens it', () => {
  const r = revalidate(sig('EIU-2025-0112'), ctx);
  assert.deepEqual(r.comps.map((c) => [c.label, c.amount, c.class]), [['Jul-24 shortfall made good in Sep-24', 756000, 'resolved']]);
  assert.ok(r.questions.some((q) => /Interest of about/.test(q)), 'indicative interest is raised as a question, not added to the amount');
  const strict = revalidate(sig('EIU-2025-0112'), ctx, { assumptions: { netLater: false } });
  assert.equal(strict.status, 'unchanged');
  assert.equal(strict.totals.open, 756000);
  assert.ok(whatChanges(sig('EIU-2025-0112'), ctx).some((f) => f.kind === 'assumption' && f.id === 'netLater' && f.to === 'unchanged'));
});

test('B-01 (E15): the Q3 excess is reversed in Q4', () => {
  const r = revalidate(sig('EIU-2024-0098'), ctx);
  assert.equal(r.totals.open, 0);
  near(r.totals.resolved, 64000, 1, 'reversed');
});

test('non-filing (E09): the signal window was Oct-Dec; the latest data shows Oct-Mar', () => {
  const r = revalidate(sig('EIU-2026-0115'), ctx);
  assert.deepEqual(r.comps.map((c) => c.id), ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']);
  assert.ok(r.notes.some((n) => /Jan, Feb, Mar also went unfiled/.test(n)));
  const windowOnly = revalidate(sig('EIU-2026-0115'), ctx, { assumptions: { signalWindowOnly: true } });
  near(windowOnly.totals.open, sig('EIU-2026-0115').amount, 5, 'the original window reproduces the signal amount');
  assert.equal(windowOnly.status, 'unchanged');
  for (const c of r.comps) near(c.parts.reduce((s, p) => s + p.amount, 0), c.amount, 2, `${c.id}: parts add up`);
});

test('risky ITC (E07): the credit from E08 and E16 is open; excluding one supplier changes the conclusion', () => {
  const r = revalidate(sig('EIU-2025-0107'), ctx);
  near(r.totals.open, KEY.revenueDrivers.E07.itcFromE08E16[1], 1000, 'open = ITC from E08 and E16');
  assert.deepEqual(r.comps.map((c) => c.class), ['unresolved', 'unresolved']);
  const vista = r.comps.find((c) => /VISTA/.test(c.label));
  const without = revalidate(sig('EIU-2025-0107'), ctx, { excluded: [vista.id] });
  assert.ok(without.comps.find((c) => c.id === vista.id).excluded);
  near(without.totals.excluded, vista.amount, 1, 'the exclusion is shown, not silently dropped');
  assert.equal(without.status, 'reduced');
  assert.ok(whatChanges(sig('EIU-2025-0107'), ctx).some((f) => f.kind === 'exclude' && f.id === vista.id));
});

test('revenue decline (E05): explained by the branch shift, recomputed on the full-year output tax', () => {
  const r = revalidate(sig('EIU-2025-0121'), ctx);
  const [t0, t1] = KEY.revenueDrivers.E05.outputTax;
  near(r.totals.recomputed, t0 - t1, 10, 'recomputed decline = fall in output tax');
  assert.equal(r.totals.unresolved, 0);
});

test('each reply claim gets the result the answer key expects', () => {
  for (const rep of REPLIES) {
    const r = revalidate(sig(rep.signalId), ctx);
    const claims = testClaims(rep.text, r, ctx);
    for (const [type, result] of KEY.replyExpectations[rep.signalId]) {
      const c = claims.find((x) => x.type === type);
      assert.ok(c, `${rep.signalId}: a ${type} claim is extracted`);
      assert.equal(c.result, result, `${rep.signalId} ${type}: ${c.contradiction || c.record || c.missing}`);
    }
  }
  const e13 = testClaims(REPLIES.find((x) => x.signalId === 'EIU-2025-0112').text, revalidate(sig('EIU-2025-0112'), ctx), ctx);
  const later = e13.find((c) => c.type === 'declared-later');
  assert.equal(later.supported, 756000);
  assert.equal(later.residual, 0);
  const e08 = testClaims(REPLIES.find((x) => x.signalId === 'EIU-2025-0126').text, revalidate(sig('EIU-2025-0126'), ctx), ctx);
  assert.match(e08.find((c) => c.type === 'margin').contradiction, /10\.9% below/);
});

test('amount and month parsing', () => {
  assert.deepEqual(parseAmounts('₹7,56,000 and Rs. 64,000; 7.56 lakh; 1.2 crore'), [756000, 64000, 756000, 12e6]);
  assert.deepEqual(parseMonths('for October to December 2025'), [6, 7, 8]);
  assert.deepEqual(parseMonths('Oct-Dec 2025 unfiled'), [6, 7, 8]);
  assert.deepEqual(parseMonths('in the September 2024 return'), [5]);
  assert.deepEqual(extractClaims('Excess ITC of Rs. 64,000 taken in Q3 was reversed in the Q4 return.').map((c) => [c.type, c.amounts[0]]), [['reversed', 64000]]);
});

test('the exposure ledger adds up and counts shared tax once', () => {
  const results = signals.map((s) => revalidate(s, ctx));
  const l = exposureLedger(results);
  assert.equal(l.totals.unresolved, l.rows.reduce((s, r) => s + r.counted.unresolved, 0));
  assert.equal(l.totals.shared, 0, 'the ward signals do not overlap');
  const twin = revalidate({ ...sig('EIU-2026-0115'), signalId: 'EIU-DUP' }, ctx);
  const l2 = exposureLedger([...results, twin]);
  assert.equal(l2.totals.unresolved, l.totals.unresolved, 'a second signal on the same tax adds nothing');
  near(l2.rows.find((r) => r.signalId === 'EIU-DUP').sharedAmount, twin.totals.unresolved, 5, 'and shows it as shared');
});

test('a signal for a year that is not loaded is data-insufficient', () => {
  const r = revalidate({ ...sig('EIU-2025-0112'), fy: '2021-22' }, ctx);
  assert.equal(r.status, 'insufficient');
  assert.match(r.why, /No FY 2021-2022 return/);
});
