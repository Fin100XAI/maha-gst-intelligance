// Dataset building: file identity, multi-year grouping, baselines and the one-workbook-per-GSTIN-and-year store.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { ROOT, TEST_DATA, testWorkbook } from './helpers.mjs';
import { identityOfFile, buildDataset, storeWorkbook } from '../scripts/lib/dataset.mjs';
import { yearOnYear } from '../src/engine/baseline.js';
import { parseWorkbook } from '../src/engine/parse.js';
import { writeReturns } from '../scripts/synth/workbook.mjs';
import { gstin, heads } from '../scripts/synth/lib.mjs';

const GSTIN = gstin(27, 'ZZTCT1234A');
const HSN = ['8471', 'Computers', 'NOS-NUMBERS', 50000];

// A small, internally consistent taxpayer-year: `scale` multiplies every sale so years differ in a known way.
function yearWorkbook(fy, scale, { name = 'TEST TRADERS [TEST]' } = {}) {
  const c = { gstin: gstin(27, 'ZZBCB5678B'), name: 'Buyer Co', state: '27' };
  const s = { gstin: gstin(27, 'ZZSCS9012C'), name: 'Seller Co', state: '27' };
  const sales = [], purchases = [];
  let seq = 0;
  for (let m = 0; m < 12; m++) {
    for (let k = 0; k < 3; k++) {
      const taxable = 100000 * scale;
      sales.push({ m, c, no: `TT/${++seq}`, seq, date: `${m <= 8 ? fy : fy + 1}-${String(((m + 3) % 12) + 1).padStart(2, '0')}-1${k}`, rate: 18, taxable, ...heads(taxable, 18, true), hsn: HSN });
    }
    const t = 150000;
    purchases.push({ m, s, no: `SC${m}`, date: `${m <= 8 ? fy : fy + 1}-${String(((m + 3) % 12) + 1).padStart(2, '0')}-05`, rate: 18, taxable: t, ...heads(t, 18, true), rc: false, filed3B: true });
  }
  return writeReturns({ name, gstin: GSTIN, state: 27, fy, filing: 'monthly', irn: false, extractDate: '2026-09-26', sales, purchases }, { filingLead: () => 2 }).wb;
}
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gst-ds-'));
const writeXlsx = (dir, file, wb) => fs.writeFileSync(path.join(dir, file), XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));

test('identity comes from the file name when present', () => {
  assert.deepEqual(identityOfFile(testWorkbook('Konkan')), { gstin: '27ZZKPK7730D1ZM', fyStart: 2024 });
});

test('identity falls back to the workbook banner', () => {
  const dir = tmp();
  try {
    fs.copyFileSync(testWorkbook('Konkan'), path.join(dir, 'upload.xlsx'));
    assert.deepEqual(identityOfFile(path.join(dir, 'upload.xlsx')), { gstin: '27ZZKPK7730D1ZM', fyStart: 2024 });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('several years of one GSTIN: the latest drives the screens, every year becomes a baseline', () => {
  const dir = tmp();
  try {
    fs.copyFileSync(path.join(ROOT, 'data', 'GST_Scrutiny_Rule_Matrix.xlsx'), path.join(dir, 'GST_Scrutiny_Rule_Matrix.xlsx'));
    writeXlsx(dir, `Report_${GSTIN}_2024 - 2025.xlsx`, yearWorkbook(2024, 1));
    writeXlsx(dir, `Report_${GSTIN}_2025 - 2026.xlsx`, yearWorkbook(2025, 0.8));
    const { dataset, errors } = buildDataset({ dataDir: dir, now: new Date('2026-09-27T00:00:00Z') });
    assert.deepEqual(errors, []);
    assert.equal(dataset.taxpayers.length, 1);
    assert.equal(dataset.taxpayers[0].fy, '2025-2026');
    assert.deepEqual(dataset.baselines[GSTIN].map((b) => b.fyStart), [2024, 2025]);
    const yoy = yearOnYear(dataset.baselines[GSTIN]);
    assert.equal(yoy.turnover.prior, 3600000);
    assert.equal(yoy.turnover.current, 2880000);
    assert.ok(Math.abs(yoy.turnover.pct + 0.2) < 1e-9, 'turnover fell 20%');
    assert.equal(dataset.generatedAt, '2026-09-27T00:00:00.000Z');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the upload store keeps one workbook per GSTIN and year, and other years as history', () => {
  const dir = tmp();
  try {
    const put = (fy, name) => {
      const wb = yearWorkbook(fy, 1);
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      return storeWorkbook({ dataDir: dir, name, buf, tp: parseWorkbook(XLSX.read(buf, { type: 'buffer' }), name), now: new Date('2026-09-27T00:00:00Z') });
    };
    assert.deepEqual(put(2024, `a_${GSTIN}_2024 - 2025.xlsx`).replaced, []);
    assert.deepEqual(put(2025, `a_${GSTIN}_2025 - 2026.xlsx`).replaced, [], 'another year is history, not a replacement');
    const again = put(2025, `b_${GSTIN}_2025 - 2026.xlsx`);
    assert.deepEqual(again.replaced, [`a_${GSTIN}_2025 - 2026.xlsx`]);
    assert.deepEqual(fs.readdirSync(dir).filter((f) => f.endsWith('.xlsx')).sort(), [`a_${GSTIN}_2024 - 2025.xlsx`, `b_${GSTIN}_2025 - 2026.xlsx`]);
    assert.equal(fs.readdirSync(path.join(dir, 'superseded')).length, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the committed test data builds cleanly', () => {
  const dir = tmp();
  try {
    fs.copyFileSync(path.join(ROOT, 'data', 'GST_Scrutiny_Rule_Matrix.xlsx'), path.join(dir, 'GST_Scrutiny_Rule_Matrix.xlsx'));
    for (const f of fs.readdirSync(TEST_DATA).filter((x) => x.endsWith('.xlsx'))) fs.copyFileSync(path.join(TEST_DATA, f), path.join(dir, f));
    const { dataset, errors } = buildDataset({ dataDir: dir });
    assert.deepEqual(errors, []);
    assert.equal(dataset.taxpayers.length, 4);
    assert.equal(Object.keys(dataset.baselines).length, 4);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
