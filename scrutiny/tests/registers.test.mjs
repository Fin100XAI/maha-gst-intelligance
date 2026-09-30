// Registers: declaration-driven validation, CSV/XLSX reading and versioned storage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { parseRegister, registerTemplate, REGISTERS } from '../src/engine/registers.js';
import { saveRegister, loadRegisters, readRows } from '../scripts/lib/registerStore.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gst-reg-'));
const csv = (text) => Buffer.from(text, 'utf8');
const eiuRow = (over = {}) => ({ signal_id: 'EIU-1', gstin: '27ZZKPK7730D1ZM', risk_parameter: 'ITC over 2B', rule_id: 'b-01', fy: '2024-25', amount: '6,40,000', signal_date: '15-08-2025', priority: 'high', ...over });

test('valid rows are normalised: GSTIN, rule ID, FY, Indian-format amounts, dates, enums', () => {
  const { records, errors } = parseRegister('eiu', [eiuRow()]);
  assert.deepEqual(errors, []);
  assert.deepEqual(records[0], { signalId: 'EIU-1', gstin: '27ZZKPK7730D1ZM', parameter: 'ITC over 2B', ruleId: 'B-01', fy: '2024-25', amount: 640000, signalDate: '2025-08-15', priority: 'High' });
});

test('every problem in a file is reported at once, and nothing is returned', () => {
  const { records, errors } = parseRegister('eiu', [
    eiuRow(),
    eiuRow({ signal_id: 'EIU-2', gstin: '27ZZKPK7730D1ZX', amount: '-5', fy: '2024-26' }),
    eiuRow({ signal_id: 'EIU-1', signal_date: '31/02/2025x' }),
    { signal_id: '', gstin: '', risk_parameter: '', fy: '', amount: '', signal_date: '' },
    eiuRow({ signal_id: 'EIU-3', rule_id: 'Z9', priority: 'urgent' }),
  ]);
  assert.deepEqual(records, []);
  assert.deepEqual(errors, [
    'Row 3: gstin "27ZZKPK7730D1ZX" is not a valid GSTIN (format or check digit)',
    'Row 3: fy "2024-26" must be a financial year like 2025-26',
    'Row 3: amount "-5" must be a non-negative amount',
    'Row 4: signal_date "31/02/2025x" must be a date (DD-MM-YYYY or YYYY-MM-DD)',
    'Row 4: duplicate of row 2 (signal_id)',
    'Row 6: rule_id "Z9" must be a rule ID like B-01',
    'Row 6: priority "urgent" must be one of: High, Medium, Low',
  ], 'the blank row 5 is skipped, not reported');
});

test('impossible calendar dates are rejected, valid ones in either format accepted', () => {
  const dates = (d) => parseRegister('eiu', [eiuRow({ signal_date: d })]);
  assert.match(dates('31-02-2025').errors[0], /must be a date/);
  assert.match(dates('2025-13-01').errors[0], /must be a date/);
  assert.equal(dates('29-02-2024').records[0].signalDate, '2024-02-29');
  assert.equal(dates('2025-08-15').records[0].signalDate, '2025-08-15');
  assert.equal(dates('5.8.2025').records[0].signalDate, '2025-08-05');
});

test('missing required columns are named, with a pointer to the template', () => {
  const { errors } = parseRegister('demands', [{ demand_id: 'D1', gstin: '27ZZKPK7730D1ZM' }]);
  assert.match(errors[0], /^Missing column\(s\): fy, section, order_date, demand_tax, stage\. Download the template/);
});

test('demands: payments cannot exceed the demand; targets: duplicates by jurisdiction, year, month, version', () => {
  const d = parseRegister('demands', [{ demand_id: 'D1', gstin: '27ZZKPK7730D1ZM', fy: '2024-25', section: '73', order_date: '2026-01-20', demand_tax: '100', demand_interest: '10', paid_to_date: '500', stage: 'recovery' }]);
  assert.deepEqual(d.errors, ['Row 2: paid_to_date exceeds the total demand']);
  const t = parseRegister('targets', [
    { jurisdiction: 'ward-27', fy: '2025-26', month: 'April', target_amount: '1000', version: 'v1' },
    { jurisdiction: 'ward-27', fy: '2025-26', month: 'apr', target_amount: '2000', version: 'v1' },
    { jurisdiction: 'ward-27', fy: '2025-26', month: 'Apr', target_amount: '2000', version: 'v2' },
  ]);
  assert.deepEqual(t.errors, ['Row 3: duplicate of row 2 (same jurisdiction, year, month and version)']);
});

test('each template parses back as a valid one-row register', () => {
  for (const type of Object.keys(REGISTERS)) {
    const { errors, records } = parseRegister(type, readRows(csv(registerTemplate(type)), 't.csv'));
    assert.deepEqual(errors, [], type);
    assert.equal(records.length, 1, type);
  }
});

test('XLSX uploads work too, including Excel date serials', () => {
  const ws = XLSX.utils.aoa_to_sheet([['signal_id', 'gstin', 'risk_parameter', 'fy', 'amount', 'signal_date'], ['E1', '27ZZKPK7730D1ZM', 'ITC over 2B', '2024-25', 640000, 45884]]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const { records, errors } = parseRegister('eiu', readRows(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }), 'x.xlsx'));
  assert.deepEqual(errors, []);
  assert.equal(records[0].signalDate, '2025-08-15');
});

test('storage: invalid files save nothing; valid files replace the previous version, which is kept', () => {
  const dir = tmp();
  try {
    const bad = saveRegister({ dir, type: 'eiu', name: 'bad.csv', buf: csv('signal_id,gstin\nE1,NOTAGSTIN\n') });
    assert.equal(bad.ok, false);
    assert.equal(fs.existsSync(path.join(dir, 'eiu.json')), false);
    const now = new Date('2026-09-27T06:00:00Z');
    const v1 = saveRegister({ dir, type: 'eiu', name: 'v1.csv', buf: csv(registerTemplate('eiu')), now });
    assert.equal(v1.ok, true);
    assert.equal(v1.replaced, false);
    assert.equal(v1.meta.rows, 1);
    assert.match(v1.meta.sha256, /^[0-9a-f]{64}$/);
    const v2 = saveRegister({ dir, type: 'eiu', name: 'v2.csv', buf: csv(registerTemplate('eiu')), now: new Date('2026-09-27T07:00:00Z') });
    assert.equal(v2.ok, true);
    assert.equal(v2.replaced, true);
    assert.equal(fs.readdirSync(path.join(dir, 'superseded')).length, 1);
    assert.equal(fs.readdirSync(path.join(dir, 'originals')).length, 2);
    const all = loadRegisters(dir);
    assert.equal(all.eiu.meta.file, 'v2.csv');
    assert.equal(all.targets, null);
    assert.deepEqual(saveRegister({ dir, type: 'eiu', name: 'x.txt', buf: csv('a') }).errors, ['Upload a .csv or .xlsx file']);
    assert.deepEqual(saveRegister({ dir, type: 'nope', name: 'x.csv', buf: csv('a') }).errors, ['Unknown register type: nope']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('storage: an upload adds rows and updates matching ones; every other saved row stays (replace only on request)', () => {
  const dir = tmp();
  const head = 'gstin,legal_name,jurisdiction,registration_date,status\n';
  try {
    saveRegister({ dir, type: 'master', name: 'a.csv', buf: csv(`${head}27ZZKPK7730D1ZM,KONKAN STEEL TRADERS,PUNE-WARD-01,01-07-2017,Active\n29ZZDFD5512Q1ZY,DECCAN FOODS,PUNE-WARD-01,01-07-2017,Active\n`) });
    const up = saveRegister({ dir, type: 'master', name: 'b.csv', buf: csv(`${head}29ZZDFD5512Q1ZY,DECCAN FOODS,PUNE-WARD-01,01-07-2017,Cancelled\n27ZZTCT5737H1ZK,TORNA COMMODITY TRADERS,LTU-PUNE,10-01-2023,Active\n`) });
    assert.equal(up.ok, true);
    assert.deepEqual([up.meta.mode, up.meta.added, up.meta.updated, up.meta.kept, up.meta.rows], ['merge', 1, 1, 1, 3]);
    const rows = loadRegisters(dir).master.records;
    assert.deepEqual(rows.map((r) => r.gstin), ['27ZZKPK7730D1ZM', '29ZZDFD5512Q1ZY', '27ZZTCT5737H1ZK'], 'existing order kept, new rows after');
    assert.equal(rows[1].status, 'Cancelled', 'a row for the same GSTIN is updated');
    const rep = saveRegister({ dir, type: 'master', name: 'c.csv', buf: csv(`${head}27ZZTCT5737H1ZK,TORNA COMMODITY TRADERS,LTU-PUNE,10-01-2023,Active\n`), mode: 'replace' });
    assert.deepEqual([rep.meta.mode, rep.meta.rows], ['replace', 1]);
    assert.equal(fs.readdirSync(path.join(dir, 'superseded')).length, 2, 'every earlier version is kept');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
