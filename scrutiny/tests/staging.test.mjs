// Upload staging (#1): the parser says what it understood, and each file gets a status before anything is analysed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../src/engine/parse.js';
import { assess, foundText } from '../src/lib/staging.js';
import { testWorkbook } from './helpers.mjs';

const wbOf = (needle) => XLSX.read(fs.readFileSync(testWorkbook(needle)), { type: 'buffer' });
const read = (wb, name = 'x.xlsx', correction) => { const tp = parseWorkbook(wb, name, correction); return { ok: true, summary: { gstin: tp.gstin, name: tp.name, fy: tp.fy, intake: tp.intake } }; };

test('a standard export is understood and ready', () => {
  const r = read(wbOf('Sahyadri'));
  const { intake } = r.summary;
  assert.deepEqual(intake.banner, { name: true, gstin: true, fy: true });
  assert.ok(intake.returns.gstr3b > 0 && intake.returns.gstr1 > 0 && intake.returns.gstr2b > 0);
  assert.deepEqual(intake.errors, []);
  assert.equal(assess(r).status, 'ready');
  assert.match(foundText(intake), /^GSTR-3B \d+ periods · GSTR-1/);
});

test('rows with an unreadable month are counted and reported, not dropped silently', () => {
  const wb = wbOf('Sahyadri');
  const ws = wb.Sheets.GSTR1_B2B;
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const h = grid.findIndex((row) => row && row.includes('Month'));
  const col = grid[h].indexOf('Month');
  grid[h + 1][col] = 'Apr-2025'; grid[h + 2][col] = '04'; // two rows in a format the parser does not accept
  wb.Sheets.GSTR1_B2B = XLSX.utils.aoa_to_sheet(grid);
  const r = read(wb);
  assert.equal(r.summary.intake.skipped.GSTR1_B2B, 2);
  assert.ok(r.summary.intake.warnings.some((w) => /2 row\(s\) skipped/.test(w) && /Apr-2025/.test(w)));
  assert.equal(assess(r).status, 'check');
});

test('a banner without GSTIN blocks the file until the officer enters a valid one', () => {
  const wb = wbOf('Sahyadri');
  for (const n of wb.SheetNames) { const ws = wb.Sheets[n]; for (const ref of Object.keys(ws)) if (ws[ref]?.v && /^Company GSTN/.test(String(ws[ref].v))) { const next = XLSX.utils.encode_cell({ ...XLSX.utils.decode_cell(ref), c: XLSX.utils.decode_cell(ref).c + 1 }); delete ws[next]; } }
  const r = read(wb);
  assert.equal(r.summary.intake.banner.gstin, false);
  assert.equal(assess(r).status, 'blocked');
  assert.equal(assess(r, { gstin: '27ZZXXX0000X1Z0' }).status, 'blocked', 'an invalid GSTIN is refused');
  const good = '27ZZKPK7730D1ZM';
  const fixed = assess(r, { gstin: good });
  assert.equal(fixed.status, 'check');
  assert.equal(fixed.gstin, good);
  const reparsed = read(wb, 'x.xlsx', { gstin: good });
  assert.equal(reparsed.summary.gstin, good, 'the parser applies the correction');
  assert.equal(reparsed.summary.intake.corrected, true);
});

test('duplicates in the batch and years already loaded are pointed out', () => {
  const r = read(wbOf('Sahyadri'));
  const a = assess(r, {}, { duplicateOf: 'other.xlsx', loadedYears: [r.summary.fy] });
  assert.equal(a.status, 'check');
  assert.ok(a.notes.some((n) => /later file replaces/.test(n.text)));
  assert.ok(a.notes.some((n) => /already on the platform/.test(n.text)));
});

test('something that is not a workbook is blocked with a reason', () => {
  assert.equal(assess({ ok: false, error: 'Not a readable Excel workbook (bad zip)' }).status, 'blocked');
  const blank = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(blank, XLSX.utils.aoa_to_sheet([['hello']]), 'Sheet1');
  const r = read(blank);
  const a = assess(r, { gstin: '27ZZKPK7730D1ZM' });
  assert.equal(a.status, 'blocked');
  assert.equal(a.notes.length, 1, 'one clear reason, not a list of every missing part');
  assert.match(a.notes[0].text, /Not a returns export/);
});
