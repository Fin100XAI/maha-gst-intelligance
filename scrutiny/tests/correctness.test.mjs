// Feedback fixes that change what the engine concludes: a missing ledger is "cannot tell", never "compliant" (#12);
// due dates follow the filer type, the State's category and notified extensions (#13); every amount is stated head by
// head (#9).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { parseWorkbook } from '../src/engine/parse.js';
import { analyze } from '../src/engine/analyze.js';
import { allocate, headsOf } from '../src/engine/heads.js';
import { returnDueDate, statutoryDay } from '../src/engine/dueDates.js';
import { parseRegister } from '../src/engine/registers.js';
import { readWorkbook, testWorkbook, severity, statusOf } from './helpers.mjs';

const parsed = (needle) => { const f = testWorkbook(needle); return parseWorkbook(readWorkbook(f), path.basename(f)); };
const sumHeads = (h) => h.igst + h.cgst + h.sgst;

test('a missing liability ledger makes filing, interest and late fee "needs review", not a clean pass', () => {
  const clean = analyze(parsed('Sahyadri'), { severity: severity() });
  for (const id of ['A-02', 'J-01', 'J-03']) assert.equal(statusOf(clean, id), 'Pass', `${id} passes with the ledger`);

  const tp = parsed('Sahyadri');
  tp.liability = []; // the sheet that dates each GSTR-3B is missing
  const a = analyze(tp, { severity: severity() });
  for (const id of ['A-02', 'J-01', 'J-03']) {
    const r = a.results.find((x) => x.id === id);
    assert.equal(r.status, 'Review', `${id} must not pass without filing dates`);
    assert.match(r.finding, /not in the liability ledger/);
  }
});

test('GSTR-3B due dates: 20th monthly, QRMP 22nd (Category I) or 24th (Category II)', () => {
  assert.equal(statutoryDay({ quarterly: false, stateCode: '07' }), 20);
  assert.equal(statutoryDay({ quarterly: true, stateCode: '27' }), 22); // Maharashtra
  assert.equal(statutoryDay({ quarterly: true, stateCode: '07' }), 24); // Delhi
  assert.equal(statutoryDay({ quarterly: true, stateCode: 9 }), 24); // Uttar Pradesh, numeric code
  assert.equal(returnDueDate({ year: 2025, month: 12, quarterly: false, stateCode: '27' }).due, '2026-01-20');
  assert.equal(returnDueDate({ year: 2025, month: 6, quarterly: true, stateCode: '19' }).due, '2025-07-24');
});

test('a notified extension moves the due date for the filers and States it covers, never earlier', () => {
  const ext = [
    { fy: '2025-26', month: 'Dec', filing: 'All', states: 'All', dueDate: '2026-01-22', notification: 'N1' },
    { fy: '2025-26', month: 'Dec', filing: 'All', states: '27', dueDate: '2026-01-25', notification: 'N2' },
    { fy: '2025-26', month: 'Sep', filing: 'QRMP', states: 'All', dueDate: '2025-10-30', notification: 'N3' },
    { fy: '2025-26', month: 'Aug', filing: 'All', states: 'All', dueDate: '2025-09-10', notification: 'earlier than statute' },
  ];
  assert.deepEqual(returnDueDate({ year: 2025, month: 12, quarterly: false, stateCode: '27', extensions: ext }).extension.notification, 'N2', 'the latest applicable date wins');
  assert.equal(returnDueDate({ year: 2025, month: 12, quarterly: false, stateCode: '24', extensions: ext }).due, '2026-01-22');
  assert.equal(returnDueDate({ year: 2025, month: 9, quarterly: false, stateCode: '27', extensions: ext }).due, '2025-10-20', 'a QRMP extension does not cover monthly filers');
  assert.equal(returnDueDate({ year: 2025, month: 8, quarterly: false, stateCode: '27', extensions: ext }).extension, null);
});

test('the analysis judges delay against an extended due date', () => {
  const tp = parsed('Konkan');
  const base = analyze(tp, { severity: severity() });
  const late = base.periodRecon.find((r) => r.delay > 0);
  assert.ok(late, 'the fixture has a late period');
  const [y, mo] = late.dueOn.split('-').map(Number); // due month = period month + 1
  const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
  const fyStart = pm >= 4 ? py : py - 1;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][pm - 1];
  const extensions = [{ fy: `${fyStart}-${String(fyStart + 1).slice(2)}`, month, filing: 'All', states: 'All', dueDate: late.filedOn, notification: 'test' }];
  const a = analyze(parsed('Konkan'), { severity: severity(), extensions });
  const r = a.periodRecon.find((x) => x.p === late.p);
  assert.equal(r.dueOn, late.filedOn);
  assert.equal(r.delay, 0);
  assert.equal(r.dueExtended, 'test');
});

test('the extensions register validates States and filing type', () => {
  const ok = parseRegister('extensions', [{ fy: '2025-26', month: 'Dec', filing: 'qrmp', states: '27, 7', due_date: '22-01-2026' }]);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.records[0].states, '07,27');
  assert.equal(ok.records[0].filing, 'QRMP');
  const bad = parseRegister('extensions', [{ fy: '2025-26', month: 'Dec', filing: 'Weekly', states: 'Maharashtra', due_date: '22-01-2026' }]);
  assert.equal(bad.errors.length, 2);
});

test('allocate splits a rupee amount over the heads exactly', () => {
  assert.deepEqual(allocate(100, { cgst: 1, sgst: 1 }), { igst: 0, cgst: 50, sgst: 50 });
  assert.deepEqual(allocate(101, { cgst: 1, sgst: 1 }), { igst: 0, cgst: 51, sgst: 50 });
  assert.equal(sumHeads(allocate(1234567, { igst: 3, cgst: 7, sgst: 7 })), 1234567);
  assert.deepEqual(allocate(10, { igst: -5, cgst: 0 }), null, 'no positive weight: no split');
  assert.deepEqual(headsOf([{ igst: 1, cgst: 2, sgst: 2 }, { igst: 1 }], (x) => (x.cgst ? 1 : -1)), { igst: 0, cgst: 2, sgst: 2 });
});

test('every finding with an amount states its IGST, CGST and SGST, adding up to the amount', () => {
  for (const needle of ['Konkan', 'Deccan', 'Narmada']) {
    const a = analyze(parsed(needle), { severity: severity() });
    const withAmount = a.results.filter((r) => r.exposure > 0);
    assert.ok(withAmount.length, `${needle} has findings with amounts`);
    for (const r of withAmount) {
      assert.ok(r.heads, `${needle} ${r.id} has heads`);
      assert.equal(sumHeads(r.heads), r.exposure, `${needle} ${r.id} heads add up`);
      assert.ok(['documents', 'law', 'apportioned'].includes(r.headsBasis), `${needle} ${r.id} says how`);
    }
  }
  const konkan = analyze(parsed('Konkan'), { severity: severity() });
  const b01 = konkan.results.find((r) => r.id === 'B-01');
  if (b01.exposure > 0) assert.equal(b01.headsBasis, 'documents', 'excess ITC is split from the 3B and 2B heads');
  const j03 = konkan.results.find((r) => r.id === 'J-03');
  if (j03.exposure > 0) assert.equal(j03.heads.igst, 0, 'late fee is CGST and SGST only');
});
