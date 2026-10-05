// Column mapping (#1): data in another layout is converted into the template, and what cannot be converted is
// counted and named rather than guessed. The converted sheet is read by the same parser as an exported workbook.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { TARGETS, suggestMapping, convertRows, templateAoa, parseDate, parseMonth, parseAmount, findHeaderRow, signature } from '../src/engine/mapping.js';
import { parseWorkbook } from '../src/engine/parse.js';

test('dates, periods and amounts in the forms Indian statements use', () => {
  assert.deepEqual(parseDate('05/04/2025'), { y: 2025, m: 4, d: 5 }, 'day first');
  assert.deepEqual(parseDate('2025-04-05'), { y: 2025, m: 4, d: 5 });
  assert.deepEqual(parseDate('5-Apr-25'), { y: 2025, m: 4, d: 5 });
  assert.deepEqual(parseDate(45772), { y: 2025, m: 4, d: 25 }, 'Excel serial');
  assert.equal(parseDate('31/31/2025'), null);
  assert.deepEqual(parseMonth('042025'), { month: 'April', y: 2025 });
  assert.deepEqual(parseMonth(42025), { month: 'April', y: 2025 }, 'a period typed as a number');
  assert.deepEqual(parseMonth(45772), { month: 'April', y: 2025 }, 'a date serial is not a period');
  assert.deepEqual(parseMonth('Jan-26'), { month: 'January', y: 2026 });
  assert.deepEqual(parseMonth('march'), { month: 'March' });
  assert.deepEqual(parseMonth('2026-02'), { month: 'February', y: 2026 });
  assert.equal(parseMonth('Q1'), null);
  assert.deepEqual(parseAmount('₹ 1,23,456.50'), { ok: true, value: 123456.5 });
  assert.deepEqual(parseAmount('(2,000)'), { ok: true, value: -2000 });
  assert.deepEqual(parseAmount('-'), { ok: true, value: null });
  assert.deepEqual(parseAmount('12 lakh'), { ok: false });
});

const csv = [
  ['Purchase register export'],
  ['Supplier GSTIN', 'Supplier Name', 'Inv No', 'Inv Date', 'Taxable Amount', 'IGST', 'CGST', 'SGST', 'Eligible for ITC'],
  ['27AAPFU0939F1ZV', 'Alpha Traders', 'A-1', '05/04/2025', '1,00,000', '0', '9,000', '9,000', 'Y'],
  ['27aapfu0939f1zv', 'Alpha Traders', 'A-2', '12-Jan-26', '50000', '', '4500', '4500', 'N'],
  ['29ZZZZZ0000Z1Z0', 'Bad GSTIN Co', 'B-1', '10/05/2025', '2000', '360', '', '', 'Y'],
  ['27AAPFU0939F1ZV', 'Alpha Traders', 'A-3', '10/04/2024', '700', '', '63', '63', 'Y'],
  ['27AAPFU0939F1ZV', 'Alpha Traders', '', '11/04/2025', '700', '', '63', '63', 'Y'],
  ['27AAPFU0939F1ZV', 'Alpha Traders', 'A-4', '11/06/2025', 'n/a', '', '63', '63', 'Y'],
  [],
];

test('columns are suggested from their names, each used once', () => {
  const hr = findHeaderRow(csv);
  assert.equal(hr, 1);
  const m = suggestMapping(TARGETS.GSTR2B_B2B, csv[hr]);
  assert.equal(m['GSTIN of supplier'], 0);
  assert.equal(m['Trade/Legal name'], 1);
  assert.equal(m['Invoice number'], 2);
  assert.equal(m['Invoice Date'], 3);
  assert.equal(m['Taxable Value'], 4);
  assert.equal(m['Integrated Tax'], 5);
  assert.equal(m['ITC Availability'], 8);
  assert.equal(m.Month, null, 'no month column: it comes from the invoice date');
  assert.equal(new Set(Object.values(m).filter((v) => v !== null)).size, Object.values(m).filter((v) => v !== null).length);
  assert.equal(signature(csv[hr]), signature(csv[hr].map((h) => ` ${h.toUpperCase()} `)), 'same layout, same signature');
});

test('rows are converted, and every row left out or value not read is counted', () => {
  const t = TARGETS.GSTR2B_B2B;
  const c = convertRows(t, csv, { headerRow: 1, mapping: suggestMapping(t, csv[1]), fyStart: 2025 });
  assert.equal(c.read, 3, 'A-1, A-2 and B-1');
  assert.deepEqual(c.months, { April: 1, January: 1, May: 1 });
  const first = Object.fromEntries(c.header.map((k, i) => [k, c.rows[0][i]]));
  assert.deepEqual([first.Month, first['GSTIN of supplier'], first['Invoice Date'], first['Taxable Value'], first['Central Tax'], first['ITC Availability']], ['April', '27AAPFU0939F1ZV', '05-04-2025', 100000, 9000, 'Yes']);
  assert.equal(c.rows[1][c.header.indexOf('GSTIN of supplier')], '27AAPFU0939F1ZV', 'GSTINs upper-cased');
  assert.deepEqual(c.excluded, { empty: 1, required: 2, outsideYear: 1, noMonth: 0 });
  assert.ok(c.problems.some((p) => /2 row\(s\) left out: a required value/.test(p)), 'the empty invoice number and the unreadable taxable value');
  assert.ok(c.problems.some((p) => /another year than FY 2025-26/.test(p)));
  assert.ok(c.problems.some((p) => /29ZZZZZ0000Z1Z0/.test(p)), 'a GSTIN failing its check digit is named');
});

test('nothing is converted until every required column is chosen; the ledger needs its return period', () => {
  const c = convertRows(TARGETS.GSTR2B_B2B, csv, { headerRow: 1, mapping: { ...suggestMapping(TARGETS.GSTR2B_B2B, csv[1]), 'Taxable Value': null }, fyStart: 2025 });
  assert.equal(c.read, 0);
  assert.match(c.problems[0], /Choose a column for: Taxable value/);
  const ledger = [['Date', 'Description', 'Type', 'IGST'], ['20/05/2025', 'GSTR-3B', 'Debit', '100']];
  const l = convertRows(TARGETS.LiabilityLedger, ledger, { headerRow: 0, mapping: suggestMapping(TARGETS.LiabilityLedger, ledger[0]), fyStart: 2025 });
  assert.match(l.problems[0], /Return period/, 'the posting date is not the return period');
});

test('the converted sheet is read by the parser exactly like an exported one', () => {
  const t = TARGETS.GSTR2B_B2B;
  const c = convertRows(t, csv, { headerRow: 1, mapping: suggestMapping(t, csv[1]), fyStart: 2025 });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Company Name : ', 'X'], ['Company GSTN : ', '27AAPFU0939F1ZV'], ['Return Period : ', '2025 - 2026'], [], [], ['Sr. #', 'Month', 'Nature of Supplies', 'Total Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'], [1, 'April', '(a) Outward Taxable Supplies', 1000, 0, 90, 90, 0]]), 'GSTR3B_Supplies');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(templateAoa(t, c, { gstin: '27AAPFU0939F1ZV', fyStart: 2025, name: 'X' })), 'GSTR2B_B2B');
  const tp = parseWorkbook(XLSX.read(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })), 'x.xlsx');
  assert.equal(tp.g2b.length, 3);
  const a1 = tp.g2b.find((r) => r.no === 'A-1');
  assert.deepEqual([a1.m, a1.gstin, a1.date, a1.taxable, a1.cgst, a1.itcAvail], [0, '27AAPFU0939F1ZV', '2025-04-05', 100000, 9000, true]);
  assert.equal(tp.g2b.find((r) => r.no === 'A-2').itcAvail, false);
  assert.equal(tp.intake.read.GSTR2B_B2B, 3);
});

test('a converted sheet is added to the stored workbook; the previous version is kept; a broken result changes nothing', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { supplementWorkbook } = await import('../scripts/lib/dataset.mjs');
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'supp-'));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Company Name : ', 'X'], ['Company GSTN : ', '27AAPFU0939F1ZV'], ['Return Period : ', '2025 - 2026'], [], [], ['Sr. #', 'Month', 'Nature of Supplies', 'Total Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'], [1, 'April', '(a) Outward Taxable Supplies', 1000, 0, 90, 90, 0]]), 'GSTR3B_Supplies');
  const file = 'Get Download All Report_27AAPFU0939F1ZV_2025 - 2026_TEST X.xlsx';
  fs.writeFileSync(path.join(dataDir, file), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  const t = TARGETS.GSTR2B_B2B;
  const aoa = templateAoa(t, convertRows(t, csv, { headerRow: 1, mapping: suggestMapping(t, csv[1]), fyStart: 2025 }), { gstin: '27AAPFU0939F1ZV', fyStart: 2025 });
  const r = supplementWorkbook({ dataDir, gstin: '27AAPFU0939F1ZV', fyStart: 2025, sheet: 'GSTR2B_B2B', aoa });
  assert.deepEqual([r.file, r.replacedSheet, r.rows, r.superseded], [file, false, 3, [file]]);
  assert.equal(fs.readdirSync(path.join(dataDir, 'superseded')).length, 1, 'the previous workbook is kept');
  const stored = parseWorkbook(XLSX.read(fs.readFileSync(path.join(dataDir, file))), file);
  assert.equal(stored.g2b.length, 3);
  assert.equal(stored.periods.length, 1, 'the rest of the workbook is unchanged');
  assert.throws(() => supplementWorkbook({ dataDir, gstin: '27AAPFU0939F1ZV', fyStart: 2024, sheet: 'GSTR2B_B2B', aoa }), /No returns are stored/);
});
