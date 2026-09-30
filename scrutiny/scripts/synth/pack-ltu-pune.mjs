// Builds the LTU-PUNE upload pack: the files an officer uploads through GST Scrutiny's Upload data and E-way bills
// screens to add the unit live (the build does not load it). Every file is checked with the platform's own parsers.
//
//   node scripts/synth/pack-ltu-pune.mjs [out-dir]     default: upload-pack/ (git-ignored)
//
//   1 Returns       every LTU-PUNE workbook, all years, generated fresh from the fixed seed
//   2 Registers     the LTU-PUNE rows of the taxpayer master, EIU signals and targets (an upload adds rows to a
//                   register and keeps every row already saved)
//   3 E-way bills   portal-layout exports for the two taxpayers whose e-way bill problems are planted (optional: the
//                   simulated e-way bill system produces the same bills once their returns are uploaded)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../../src/engine/parse.js';
import { REGISTERS, parseRegister } from '../../src/engine/registers.js';
import { EWB_COLUMNS, ewbToRow, parseEwbRows } from '../../src/engine/ewb.js';
import { simulate, loadPlan } from './ewb.mjs';
import { GROUPS, FYS, VERSION, expectedFiles, registerRows } from './ltu-pune.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'upload-pack'));
const issues = [];
const t0 = Date.now();
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ['1 Returns', '2 Registers', '3 E-way bills']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

// 1 Returns: generated into a scratch folder (never into data/, which the build reads)
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ltu-pune-'));
const gen = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'synth', 'ltu-pune.mjs')], { env: { ...process.env, OUT_DIR: work }, encoding: 'utf8' });
if (gen.status !== 0) throw new Error(`generator failed: ${gen.stderr}`);
const parsed = new Map();
let bytes = 0;
for (const f of expectedFiles()) {
  const buf = fs.readFileSync(path.join(work, f));
  const tp = parseWorkbook(XLSX.read(buf, { type: 'buffer' }), f);
  if (!tp.gstin || !tp.periods.length) issues.push(`returns ${f}: not a returns export`);
  if (buf.length > 40 * 1024 * 1024) issues.push(`returns ${f}: over the 40 MB upload limit`);
  parsed.set(f, tp);
  bytes += buf.length;
  fs.writeFileSync(path.join(OUT, '1 Returns', f), buf);
}
fs.rmSync(work, { recursive: true, force: true });

// 2 Registers: the unit's rows, written in the upload layout and read back through the validator
const dmy = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v).split('-').reverse().join('-') : v);
const unitRows = registerRows();
const regCounts = {};
for (const type of Object.keys(REGISTERS)) {
  if (!unitRows[type]) continue;
  const [header, ...rows] = unitRows[type];
  const p = parseRegister(type, rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]]))));
  if (p.errors.length) issues.push(`register ${type}: ${p.errors[0]}`);
  const records = p.records;
  const cols = REGISTERS[type].columns;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cols.map((c) => c.label), ...records.map((r) => cols.map((c) => (r[c.key] ?? '') === '' ? '' : dmy(r[c.key])))]), REGISTERS[type].title.slice(0, 31));
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  fs.writeFileSync(path.join(OUT, '2 Registers', `${type}.xlsx`), buf);
  const back = XLSX.read(buf, { type: 'buffer' });
  const round = parseRegister(type, XLSX.utils.sheet_to_json(back.Sheets[back.SheetNames[0]], { defval: '', raw: false }));
  if (round.errors.length) issues.push(`register ${type}: ${round.errors.slice(0, 3).join('; ')}`);
  else if (JSON.stringify(round.records) !== JSON.stringify(records)) issues.push(`register ${type}: does not read back as written`);
  regCounts[type] = records.length;
}

// 3 E-way bills: what the simulated e-way bill system returns for the two taxpayers, in the portal's export layout
const plan = loadPlan(ROOT);
const EWB = { G37A: 'Torna Commodity Traders', G38A: 'Purandar Metals and Alloys' };
const ewbCounts = {};
for (const [key, label] of Object.entries(EWB)) {
  const e = GROUPS.flatMap((g) => g.entities).find((x) => x.key === key);
  const bills = [];
  for (const [f, tp] of parsed) if (tp.gstin === e.gstin) { const s = simulate(tp, plan); bills.push(...s.outward, ...s.inward); }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([EWB_COLUMNS, ...bills.map(ewbToRow)]), 'EWB');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', compression: true });
  const name = `E-way bills_${e.gstin}_${label}.xlsx`;
  fs.writeFileSync(path.join(OUT, '3 E-way bills', name), buf);
  const back = XLSX.read(buf, { type: 'buffer' });
  const read = parseEwbRows(XLSX.utils.sheet_to_json(back.Sheets[back.SheetNames[0]], { defval: '' }));
  if (read.errors.length) issues.push(`e-way bills ${key}: ${read.errors.slice(0, 3).join('; ')}`);
  if (read.bills.length !== bills.length) issues.push(`e-way bills ${key}: ${read.bills.length} of ${bills.length} read back`);
  ewbCounts[e.gstin] = bills.length;
}

// READ ME
const main = (k) => GROUPS.find((g) => g.key === k).entities[0].gstin;
fs.writeFileSync(path.join(OUT, '00 READ ME.txt'), `GST SCRUTINY - UPLOAD PACK: LARGE TAXPAYER UNIT "LTU-PUNE"   (${VERSION})
==========================================================

Fictional test data. Every name, GSTIN (PAN starting "ZZ") and figure is invented.
${GROUPS.length} corporate groups, ${GROUPS.reduce((s, g) => s + g.entities.length, 0)} registrations, ${FYS.length} financial years (FY ${FYS[0]}-${String(FYS[0] + 1).slice(2)} to ${FYS[FYS.length - 1]}-${String(FYS[FYS.length - 1] + 1).slice(2)}).
The platform does not load this unit by itself: uploading it is the demo. Uploading adds to the
data already on the platform; nothing there is removed or overwritten.


WHAT IS IN THE PACK
-------------------
1 Returns        ${expectedFiles().length} returns workbooks ("Get Download All Report" layout), one per GSTIN and year.
2 Registers      master, eiu, targets: the LTU-PUNE rows only (${Object.entries(regCounts).map(([k, v]) => `${k} ${v}`).join(', ')}).
                 An upload adds its rows to the register; every row already saved stays.
3 E-way bills    Optional. Portal-layout e-way bill exports for Torna (${main('G37')}) and
                 Purandar (${main('G38')}). The platform produces the same bills by itself once
                 the returns are in; upload these only to show the e-way bill upload.


LIVE DEMO (GST Scrutiny > Configure > Upload data)
--------------------------------------------------
1. Returns files: "Choose files", select everything in "1 Returns", keep the page open.
   The screen shows "Saving files" then "Analysing returns" with a progress bar; when it
   finishes it opens the first uploaded taxpayer.
2. Registers: "Add rows" on each register with its file in "2 Registers" (master -> Taxpayer
   master, eiu -> EIU risk signals, targets -> Revenue targets). Instant; the screen says how
   many rows were added and that the rows already saved were kept.
3. Show: Dashboard (the new unit in the risk ranking), Taxpayer 360 for the companies below,
   Network, Revenue (three years), EIU signals, E-way bills (Sync e-way bills).

To run the demo again, take the unit out on the server:  npm --prefix scrutiny run demo:reset


WHAT YOU SHOULD SEE (FY 2025-26)
--------------------------------
Torna Commodity Traders       ${main('G37')}  Critical. Invalid customer GSTIN (A-01), duplicate
                                               invoices in GSTR-2B (B-08), tax short-charged (G-10), invoices
                                               without IRN (G-03), goods with no e-way bill (B-03), suppliers
                                               not filing GSTR-3B (B-04); round figures. Network: invoices from
                                               a supplier after its retrospective cancellation.
Purandar Metals and Alloys    ${main('G38')}  High. GSTR-3B for Feb and Mar 2026 not filed (A-02),
                                               e-way bills with no invoice in GSTR-1 (G-05), invoices split
                                               under Rs 50,000, same vehicle in two places, Sunday invoices.
Rajgad Steel Re-Rollers       ${main('G36')}  ITC above GSTR-2B (B-01): supplier credit notes not netted
                                               (H-06); reverse charge under-paid, full RCM credit (C-01, C-02).
Shivneri E-Retail             ${main('G33')}  Marketplace TCS exceeds the turnover declared (G-14).
Sinhagad Consumer             ${main('G35')}  Credit notes after 30 November (H-01), with no invoice
                                               reference (H-02); March credit-note spike.
Chandrabhaga Edible Oils      ${main('G32')}  Import ITC above ICEGATE bills of entry (B-09).
Lenyadri Infra Projects       ${main('G34')}  Prior-year ITC claimed after 30 November (B-07); government
                                               TDS within turnover. Network: Rajgad's sales to it differ
                                               from its GSTR-2B.
Indrayani Home Appliances     ${main('G31')}  Low. Goa hotel ITC blocked by place of supply (D-02 review).
Krishnai Sugar                ${main('G39')}  Low. Seasonal; the distillery loses a major buyer.
`.replace(/\n/g, '\r\n'));

console.log(JSON.stringify({ out: OUT, returns: expectedFiles().length, returnsMB: +(bytes / 1048576).toFixed(1), registers: regCounts, ewbBills: ewbCounts, issues, seconds: Math.round((Date.now() - t0) / 1000) }, null, 1));
process.exitCode = issues.length ? 1 : 0;
