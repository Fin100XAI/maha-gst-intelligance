// The synthetic ward (test-data/ward): reproducible, internally consistent, and its planted facts are what the
// engine sees. These tests are the ground truth later capabilities (revenue-drop explanation, network, EIU
// revalidation) are validated against.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as XLSX from 'xlsx';
import { ROOT, analyseFile, statusOf } from './helpers.mjs';
import { buildDataset } from '../scripts/lib/dataset.mjs';
import { parseWorkbook } from '../src/engine/parse.js';
import { parseRegister } from '../src/engine/registers.js';
import { readRows } from '../scripts/lib/registerStore.mjs';

const WARD = path.join(ROOT, 'test-data', 'ward');
const KEY = JSON.parse(fs.readFileSync(path.join(WARD, 'answer-key.json'), 'utf8'));
const gstinOf = (k) => KEY.taxpayers.find((t) => t.key === k).gstin;
const book = (k, fy) => path.join(WARD, KEY.workbooks.find((w) => w.key === k && w.fy === fy).file);
const cache = {};
const year = (k, fy) => (cache[`${k}|${fy}`] ||= analyseFile(book(k, fy)));

let dataset;
before(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-ward-'));
  try {
    fs.copyFileSync(path.join(ROOT, 'data', 'GST_Scrutiny_Rule_Matrix.xlsx'), path.join(dir, 'GST_Scrutiny_Rule_Matrix.xlsx'));
    for (const w of KEY.workbooks) fs.copyFileSync(path.join(WARD, w.file), path.join(dir, w.file));
    ({ dataset } = buildDataset({ dataDir: dir }));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the ward generator reproduces every file byte for byte', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-ward-gen-'));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'synth', 'ward.mjs')], { env: { ...process.env, OUT_DIR: out }, stdio: 'pipe' });
    const list = (d) => fs.readdirSync(d, { recursive: true }).filter((f) => fs.statSync(path.join(d, f)).isFile()).sort();
    const committed = list(WARD).filter((f) => f !== 'README.md');
    assert.deepEqual(list(out), committed);
    for (const f of committed) assert.ok(fs.readFileSync(path.join(out, f)).equals(fs.readFileSync(path.join(WARD, f))), `${f} differs`);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('46 taxpayer-years build cleanly into 16 taxpayers with their history', () => {
  assert.equal(dataset.taxpayers.length, 16);
  assert.equal(Object.values(dataset.baselines).reduce((s, b) => s + b.length, 0), 46);
  assert.equal(dataset.baselines[gstinOf('E16')].length, 1, 'registered in July 2025: one year only');
});

test('every invoice between ward taxpayers appears in the seller GSTR-1 and the buyer GSTR-2B', () => {
  const ward = new Set(KEY.taxpayers.map((t) => t.gstin));
  const parsed = KEY.workbooks.filter((w) => w.fy === '2025-26').map((w) => parseWorkbook(XLSX.read(fs.readFileSync(path.join(WARD, w.file)), { type: 'buffer' }), w.file));
  const byGstin = Object.fromEntries(parsed.map((tp) => [tp.gstin, tp]));
  let checked = 0;
  for (const tp of parsed) {
    for (const inv of tp.b2b.filter((x) => ward.has(x.gstin))) {
      const buyer = byGstin[inv.gstin];
      const hit = buyer.g2b.find((x) => x.gstin === tp.gstin && x.no === inv.no);
      assert.ok(hit, `${inv.no} from ${tp.gstin} missing in ${inv.gstin} 2B`);
      assert.ok(Math.abs(hit.taxable - inv.taxable) < 0.01 && Math.abs(hit.tax - inv.tax) < 0.01, `${inv.no} values differ`);
      checked++;
    }
  }
  assert.ok(checked > 500, `checked ${checked} cross-ward invoices`);
});

test('non-filer E09: GSTR-3B missing Oct-Mar, with the unreturned GSTR-1 tax quantified', () => {
  const a = year('E09', '2025-26');
  const r = a.results.find((x) => x.id === 'A-02');
  assert.equal(r.status, 'Fail');
  assert.ok(r.exposure > 0);
  assert.deepEqual(r.evidence.rows.map((row) => row[0]), ['October', 'November', 'December', 'January', 'February', 'March']);
  assert.notEqual(statusOf(a, 'G-10'), 'Fail', 'HSN summary is compared with all of GSTR-1');
});

test('buyers of the non-filer show Rule 37A Amber (extract before the 30-09-2026 deadline)', () => {
  for (const k of ['E08', 'E16']) {
    const r = year(k, '2025-26').results.find((x) => x.id === 'B-04');
    assert.equal(r.rag, 'amber', k);
  }
});

test('network patterns are visible to the single-taxpayer indicators', () => {
  const flagged = (k) => year(k, '2025-26').fraud.filter((f) => f.flagged).map((f) => f.key);
  assert.ok(flagged('E08').includes('circular'), 'E08 trades both ways with E10');
  assert.ok(flagged('E08').includes('valueadd'), 'E08 pays almost nothing in cash');
  assert.ok(flagged('E05').includes('distinct'), 'E05 transfers to its same-PAN branch');
});

test('planted defects in earlier years are found in the right year', () => {
  assert.equal(statusOf(year('E02', '2024-25'), 'B-01'), 'Fail', 'ITC on invoices from a cancelled supplier');
  assert.equal(statusOf(year('E13', '2024-25'), 'G-02'), 'Review', 'July shortfall caught up in September');
  assert.equal(statusOf(year('E15', '2023-24'), 'B-01'), 'Review', 'Q3 excess reversed in Q4');
  assert.equal(statusOf(year('E06', '2025-26'), 'J-01'), 'Fail', 'Nov 2025 filed 16 days late, no interest');
  assert.ok(year('E12', '2024-25').periodRecon.some((p) => p.delay >= 38), 'Q4 FY 2024-25 filed 38 days late');
});

test('the clean majority stays clean', () => {
  for (const k of ['E01', 'E03', 'E11', 'E14']) {
    const a = year(k, '2025-26');
    assert.deepEqual(a.results.filter((r) => r.status === 'Fail').map((r) => r.id), [], k);
    assert.equal(a.band, 'Low', k);
  }
});

test('answer-key revenue figures agree with the engine baselines', () => {
  for (const k of ['E01', 'E05', 'E06', 'E07', 'E13', 'E14']) {
    const b = dataset.baselines[gstinOf(k)];
    const [prior, cur] = b.slice(-2);
    const want = KEY.revenueDrivers[k];
    assert.ok(Math.abs(prior.totals.turnover - want.turnover[0]) < 10, `${k} prior turnover`); // ₹10: per-invoice paise rounding
    assert.ok(Math.abs(cur.totals.turnover - want.turnover[1]) < 10, `${k} current turnover`);
  }
  const e04 = dataset.baselines[gstinOf('E04')].slice(-2);
  assert.ok(e04[1].totals.turnover > e04[0].totals.turnover && e04[1].totals.outputTax < e04[0].totals.outputTax, 'E04: turnover up, tax down');
});

test('the ward registers pass the platform validator', () => {
  const counts = {};
  for (const t of ['master', 'eiu', 'targets', 'demands', 'caselog']) {
    const { records, errors } = parseRegister(t, readRows(fs.readFileSync(path.join(WARD, 'registers', `${t}.csv`)), `${t}.csv`));
    assert.deepEqual(errors, [], t);
    counts[t] = records.length;
  }
  assert.deepEqual(counts, { master: 18, eiu: 7, targets: 36, demands: 11, caselog: KEY.caseLog.events });
});
