// Characterisation tests: pin the engine's current findings on the four synthetic workbooks in test-data/
// (see test-data/README.md). A change that alters any of these must be deliberate and explained.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyseFile, testWorkbook, issues, raised, statusOf } from './helpers.mjs';

const cache = {};
const load = (name) => (cache[name] ||= analyseFile(testWorkbook(name)));

test('Sahyadri Agro (clean control) raises nothing', () => {
  const a = load('Sahyadri');
  assert.equal(a.score, 0);
  assert.equal(a.band, 'Low');
  assert.deepEqual(issues(a), []);
  assert.deepEqual(raised(a), []);
});

test('Konkan Steel: planted ITC, Rule 37A, duplicate, liability and late-filing issues', () => {
  const a = load('Konkan');
  assert.deepEqual(issues(a), ['B-01:Fail', 'B-04:Review', 'B-08:Fail', 'C-01:Review', 'F-06:Review', 'G-01:Fail', 'G-02:Fail', 'J-01:Fail', 'J-03:Fail', 'K-02:Review']);
  assert.equal(a.results.find((r) => r.id === 'B-04').rag, 'red', 'FY 2024-25 extract dated after 30-09-2025 must be Red');
  assert.deepEqual(raised(a), ['dup', 'nonfiler']);
  assert.equal(a.score, 65);
  const late = a.periodRecon.filter((r) => r.delay > 0).map((r) => `${r.label}+${r.delay}`);
  assert.deepEqual(late, ['Oct-24+25', 'Jan-25+1']);
});

test('Deccan Freight: reverse charge, wrong tax head, credit notes, circular trading', () => {
  const a = load('Deccan');
  assert.equal(a.filing, 'Quarterly (QRMP)');
  for (const [id, st] of [['C-01', 'Fail'], ['D-01', 'Fail'], ['H-02', 'Review'], ['H-08', 'Review']]) assert.equal(statusOf(a, id), st, id);
  assert.deepEqual(raised(a), ['circular', 'cn']);
  assert.equal(a.score, 39);
});

test('Narmada Synthetics: invalid GSTINs, short-charged tax, gaps, splitting, inverted duty', () => {
  const a = load('Narmada');
  for (const [id, st] of [['A-01', 'Fail'], ['G-10', 'Fail'], ['G-12', 'Review'], ['F-06', 'Review']]) assert.equal(statusOf(a, id), st, id);
  assert.deepEqual(raised(a), ['accum', 'ewb', 'round', 'spike(prompt)', 'valueadd']);
  assert.equal(a.score, 55);
});

test('the engine is deterministic', () => {
  const f = testWorkbook('Konkan');
  assert.equal(JSON.stringify(analyseFile(f)), JSON.stringify(analyseFile(f)));
});

test('extract date comes from the workbook, never the clock', () => {
  assert.equal(load('Sahyadri').asOf, '2026-09-26');
  assert.equal(load('Sahyadri').asOfSource, 'workbook created');
});
