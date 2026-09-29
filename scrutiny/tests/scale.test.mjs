// The dashboard is built for thousands of taxpayers; ?scale=N clones the loaded ones in the browser to test that.
import test from 'node:test';
import assert from 'node:assert/strict';
import { scaleUp } from '../src/lib/scaleTest.js';
import { inr } from '../src/lib/format.js';

const bands = { Moderate: 25, High: 45, Critical: 70 };
const base = [
  { id: 'A', name: 'Alpha', score: 80, band: 'Critical', profile: { turnover: 5e8, itcToOutput: 0.9 }, exposure: { confirmed: 1e6, potential: 2e5 } },
  { id: 'B', name: 'Beta', score: 20, band: 'Low', profile: { turnover: 2e7, itcToOutput: 0.5 }, exposure: { confirmed: 0, potential: 1e4 } },
];

test('scaleUp adds clones up to N, keeps originals, and is deterministic', () => {
  const a = scaleUp(base, 500, bands), b = scaleUp(base, 500, bands);
  assert.equal(a.length, 500);
  assert.deepEqual(a.map((x) => x.uid || x.id), b.map((x) => x.uid || x.id));
  assert.ok(a.some((x) => x === base[0]) && a.some((x) => x === base[1]));
  assert.equal(new Set(a.map((x) => x.uid || x.id)).size, 500, 'every row has a unique key');
});

test('clones keep the original id (so drill-through opens a real file) and a band that matches their score', () => {
  for (const x of scaleUp(base, 300, bands)) {
    assert.ok(['A', 'B'].includes(x.id));
    const want = x.score >= 70 ? 'Critical' : x.score >= 45 ? 'High' : x.score >= 25 ? 'Moderate' : 'Low';
    assert.equal(x.band, want);
    assert.ok(x.score >= 0 && x.score <= 100);
  }
});

test('scaleUp is a no-op without a target, or with a target below the loaded count', () => {
  assert.equal(scaleUp(base, 0, bands), base);
  assert.equal(scaleUp(base, 1, bands), base);
});

test('jurisdiction-sized amounts stay short', () => {
  assert.equal(inr(2.5e7), '₹2.5 Cr');
  assert.equal(inr(3.64e10), '₹3,640 Cr');
  assert.equal(inr(9.46e12), '₹9.46 lakh Cr');
});
