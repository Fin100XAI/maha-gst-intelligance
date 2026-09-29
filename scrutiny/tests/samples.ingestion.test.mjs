// The sample ingestion pack (public/samples/ingestion/) is what pipeline teams build against, so it must stay exactly
// reproducible and must stay readable by the platform's own parsers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as XLSX from 'xlsx';
import { ROOT } from './helpers.mjs';
import { parseWorkbook } from '../src/engine/parse.js';
import { REGISTERS, parseRegister } from '../src/engine/registers.js';
import { identityOfFile } from '../scripts/lib/dataset.mjs';
import { readRows } from '../scripts/lib/registerStore.mjs';
import { extractText } from '../scripts/lib/docText.mjs';

const PACK = path.join(ROOT, 'public', 'samples', 'ingestion');
const files = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => fs.statSync(path.join(dir, f)).isFile()).map((f) => f.split(path.sep).join('/')).sort();

test('make-ingestion-samples.mjs reproduces public/samples/ingestion exactly', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-samples-'));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'make-ingestion-samples.mjs')], { env: { ...process.env, OUT_DIR: out }, stdio: 'pipe' });
    assert.deepEqual(files(out), files(PACK));
    for (const f of files(PACK)) assert.ok(fs.readFileSync(path.join(out, f)).equals(fs.readFileSync(path.join(PACK, f))), `${f} differs`);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('the sample returns workbook carries every sheet type, each with rows, and the platform reads them all', () => {
  const dir = path.join(PACK, '1 Returns');
  const [file] = fs.readdirSync(dir);
  assert.deepEqual(identityOfFile(path.join(dir, file)), { gstin: '27ZZXCS0001S1ZN', fyStart: 2025 });
  const wb = XLSX.read(fs.readFileSync(path.join(dir, file)), { type: 'buffer' });
  assert.equal(wb.SheetNames.length, 37);
  const tp = parseWorkbook(wb, file);
  assert.equal(tp.periods.length, 12);
  for (const k of ['b2b', 'b2cl', 'b2cs', 'cdn', 'b2ba', 'hsn', 'docs', 'g2b', 'g2bCdn', 'g2bAmend', 'g2bIsd', 'g2bImpg', 'g2a', 'g2aCdn', 'tdsCredits', 'tcsCredits', 'isd6a', 'liability', 'cashLedger', 'creditLedger', 'challans']) {
    assert.ok(tp[k].length > 0, `${k} parsed no rows`);
  }
  assert.ok(tp.nilRated > 0);
});

test('every sample register passes the upload validation with no errors', () => {
  for (const type of Object.keys(REGISTERS)) {
    const { records, errors } = parseRegister(type, readRows(fs.readFileSync(path.join(PACK, '2 Registers', `${type}.xlsx`)), `${type}.xlsx`));
    assert.deepEqual(errors, [], type);
    assert.ok(records.length > 0, type);
  }
});

test('the sample reply letter is readable text', () => {
  const { text } = extractText(fs.readFileSync(path.join(PACK, '3 Reply letters', 'EIU-SAMPLE-0001 reply.pdf')), 'reply.pdf');
  assert.match(text, /EIU-SAMPLE-0001/);
});

test('every sample file the Upload data page links to exists', async () => {
  const { SAMPLE_GUIDE, SAMPLE_RETURNS, SAMPLE_REGISTER, SAMPLE_LETTER, sampleUrl } = await import('../src/lib/samples.js');
  for (const rel of [SAMPLE_GUIDE, SAMPLE_RETURNS, SAMPLE_LETTER, ...Object.keys(REGISTERS).map(SAMPLE_REGISTER)]) {
    assert.ok(fs.existsSync(path.join(PACK, rel)), `${rel} is linked but missing`);
    assert.equal(decodeURIComponent(sampleUrl(rel)), `/samples/ingestion/${rel}`);
  }
});
