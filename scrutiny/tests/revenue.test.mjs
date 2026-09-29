// Revenue-change explanation (src/engine/revenue.js) against the synthetic ward's planted stories
// (test-data/ward/answer-key.json). Each planted driver must surface as the right driver, class and hypothesis,
// and every decomposition must reconcile to the rupee.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, analyseFile } from './helpers.mjs';
import { baselineOf } from '../src/engine/baseline.js';
import { explainRevenueChange, monthlyDeviation, portfolioMovement } from '../src/engine/revenue.js';

const WARD = path.join(ROOT, 'test-data', 'ward');
const KEY = JSON.parse(fs.readFileSync(path.join(WARD, 'answer-key.json'), 'utf8'));
const cache = {};
const base = (k, fy) => (cache[`${k}|${fy}`] ||= baselineOf(analyseFile(path.join(WARD, KEY.workbooks.find((w) => w.key === k && w.fy === fy).file))));
const explain = (k) => explainRevenueChange(base(k, '2024-25'), base(k, '2025-26'));
const driver = (x, key) => x.drivers.find((d) => d.key === key);
const hyp = (x, key) => x.hypotheses.find((h) => h.key === key);
const near = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} vs ${expected} (±${tol})`);

test('every decomposition reconciles to the change in cash paid, to the rupee', () => {
  for (const k of ['E01', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E13', 'E14']) {
    const x = explain(k);
    assert.ok(x.reconciled, k);
    near(x.drivers.reduce((s, d) => s + d.amount, 0), x.change, 1, `${k} sum of drivers`);
    near(Object.values(x.byClass).reduce((s, v) => s + v, 0), x.change, 1, `${k} sum of classes`);
    assert.ok(x.drivers.every((d) => d.class && d.formula), `${k}: every driver has a class and a formula`);
  }
});

test('E04: the rate cut is found on the right HSN codes and explains the decline', () => {
  const x = explain('E04');
  near(driver(x, 'rate').amount, KEY.revenueDrivers.E04.rateEffectOnOutputTax, 50000, 'rate effect');
  assert.equal(driver(x, 'rate').class, 'explained');
  assert.ok(driver(x, 'rate').detail.every((r) => r.rateCurrent < r.ratePrior));
  assert.equal(hyp(x, 'rate').status, 'supported');
  assert.equal(x.verdict.code, 'de-escalate');
  assert.ok(['Sep', 'Oct'].includes(x.deviation.levelShift?.label), 'monthly tax steps down around the 22 Sep rate change');
});

test('E05: sales moved to the same-PAN branch in Karnataka', () => {
  const x = explain('E05'), k = KEY.revenueDrivers.E05;
  const same = driver(x, 'samePan');
  assert.deepEqual(same.detail.map((d) => d.key), [k.branchGstin]);
  near(same.detail[0].change, k.stockTransfersToBranch, 0.02 * k.stockTransfersToBranch, 'transfers to the branch');
  assert.ok(driver(x, 'continuing').amount < 0, 'sales to other customers fell');
  assert.equal(hyp(x, 'branch').status, 'supported');
  assert.equal(hyp(x, 'genuine-decline').status, 'not supported', 'a branch shift is not a business decline');
  assert.equal(x.verdict.code, 'tax-fell'); // cash held up because less credit was used; output tax fell 24%
  assert.equal(x.deviation.levelShift?.label, 'Jul');
});

test('E06: the lost customer is named, and the decline is explained', () => {
  const x = explain('E06'), k = KEY.revenueDrivers.E06;
  const lost = driver(x, 'lost');
  assert.equal(lost.detail[0].key, k.lostCustomer);
  // lost from August: the fall is at least three quarters of what the customer bought from August last year
  assert.ok(-lost.detail[0].change >= 0.75 * k.priorYearSalesToLostCustomerAugMar, `fall ${-lost.detail[0].change}`);
  assert.equal(hyp(x, 'customer-loss').status, 'supported');
  assert.equal(x.verdict.code, 'de-escalate');
  assert.equal(x.deviation.levelShift?.label, 'Aug');
});

test('E07: credit replacing cash is unresolved, traced to the pass-through and the new registrant', () => {
  const x = explain('E07'), [before, after] = KEY.revenueDrivers.E07.itcFromE08E16;
  const itc = driver(x, 'itc');
  assert.equal(itc.class, 'unresolved');
  const e08 = KEY.taxpayers.find((t) => t.key === 'E08').gstin, e16 = KEY.taxpayers.find((t) => t.key === 'E16').gstin;
  const from = itc.detail.filter((r) => r.key === e08 || r.key === e16);
  near(from.reduce((s, r) => s + r.current, 0), after, 1000, 'ITC from E08 and E16 this year');
  near(from.reduce((s, r) => s + r.prior, 0), before, 1000, 'ITC from E08 and E16 last year');
  assert.ok(itc.detail.find((r) => r.key === e16).isNew, 'E16 is a new supplier');
  assert.equal(hyp(x, 'itc-substitution').status, 'concern');
  assert.equal(x.verdict.code, 'examine');
});

test('E09: sales reported in GSTR-1 for months without GSTR-3B are unresolved, not a timing gap', () => {
  const x = explain('E09');
  const un = driver(x, 'unfiled');
  assert.equal(un.class, 'unresolved');
  assert.deepEqual(un.detail.map((d) => d.key), ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']);
  assert.equal(hyp(x, 'non-filing').status, 'concern');
  assert.match(x.verdict.text, /GSTR-3B not filed/);
});

test('E13: credit notes explain the decline, and they are linked to invoices', () => {
  const x = explain('E13'), cn = KEY.revenueDrivers.E13.creditNotes;
  const d = driver(x, 'creditNotes');
  near(d.amount, -cn.tax, 0.01 * cn.tax, 'credit-note effect on tax');
  assert.equal(d.class, 'explained');
  assert.equal(base('E13', '2025-26').mix.creditNotes.count, cn.count);
  assert.ok(base('E13', '2025-26').mix.creditNotes.linkedShare >= 0.9, 'notes cite their original invoices');
  assert.equal(hyp(x, 'credit-notes').status, 'supported');
  assert.equal(x.verdict.code, 'de-escalate');
});

test('clean and steady taxpayers raise no revenue-drop concern', () => {
  for (const k of ['E01', 'E03', 'E11', 'E14']) {
    const x = explain(k);
    assert.ok(['no-decline', 'stable'].includes(x.verdict.code), `${k}: ${x.verdict.code}`);
    assert.equal(x.byClass.unresolved, 0, `${k} has nothing unresolved`);
    assert.equal(x.deviation.levelShift, null, `${k} has no level shift`);
    assert.equal(x.deviation.unexplained.length, 0, `${k} has no unexplained month`);
  }
});

test('the jeweller\'s festive peak moving between months is a seasonal shift, not an anomaly', () => {
  const x = explain('E14');
  assert.ok(x.deviation.flagged.length > 0);
  assert.ok(x.deviation.flagged.every((m) => m.reason.code === 'seasonal-shift'));
});

test('monthly deviation: a single unexplained drop is flagged; small noise is not', () => {
  const months = (vals) => vals.map((v, m) => ({ m, outTax: v, cnValue: 0 }));
  const periods = Array.from({ length: 12 }, (_, p) => ({ p, months: 1, delay: 0 }));
  const prev = { months: months([100, 102, 98, 101, 99, 100, 103, 97, 100, 101, 99, 100].map((v) => v * 1e5)), periods };
  const flat = { months: months([105, 107, 103, 106, 104, 105, 108, 102, 105, 106, 104, 105].map((v) => v * 1e5)), periods };
  assert.equal(monthlyDeviation(prev, flat).flagged.length, 0);
  const dip = { months: months([105, 107, 103, 106, 50, 105, 108, 102, 105, 106, 104, 105].map((v) => v * 1e5)), periods };
  const r = monthlyDeviation(prev, dip);
  assert.deepEqual(r.flagged.map((m) => [m.label, m.reason.code]), [['Aug', 'unexplained']]);
  assert.equal(r.levelShift, null, 'one month is not a sustained change');
});

test('portfolio movement reconciles to the total and treats a first year as new', () => {
  const baselines = {};
  for (const k of ['E04', 'E07', 'E16']) {
    const g = KEY.taxpayers.find((t) => t.key === k).gstin;
    baselines[g] = KEY.workbooks.filter((w) => w.key === k).map((w) => base(k, w.fy));
  }
  const p = portfolioMovement(baselines, Object.keys(baselines));
  near(p.rows.reduce((s, r) => s + r.change, 0), p.total.change, 1, 'rows add up');
  assert.equal(p.rows[0].name, base('E07', '2025-26').name, 'the largest fall first');
  assert.equal(p.rows.find((r) => r.gstin === KEY.taxpayers.find((t) => t.key === 'E16').gstin).status, 'new');
});
