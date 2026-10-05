// End-to-end upload pack: a new ward (PUNE-WARD-02) with everything an officer uploads, in the order they upload it,
// so the whole upload route can be checked on a live installation: registers, returns, files that must be refused,
// and a reply letter. A last folder holds what only the next release reads (scanned replies, other layouts).
//
//   node scripts/synth/e2e-pack.mjs [out-dir]     default: upload-pack/e2e/ (git-ignored)
//
// Every name, GSTIN (PAN starting "ZZ") and figure is invented. Deterministic (seed 8128).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { gstin } from './lib.mjs';
import { P } from './products.mjs';
import { pdf } from './docs.mjs';
import { writeTaxpayers, CR } from './sample-upload.mjs';
import { parseWorkbook } from '../../src/engine/parse.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const WARD = 'PUNE-WARD-02';
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// officer: who the master assigns; fys: years exported; story: what it shows. Expected results are in EXPECT below.
export const TAXPAYERS = [
  { key: 'E1', word: 'Auto', clean: true, name: 'HADAPSAR AUTO COMPONENTS PRIVATE LIMITED', pan: 'ZZHCH8201A', turnover: 120, sell: [P.forging, P.casting], buy: [P.hrc, P.scrap], buyRatio: 0.6,
    fys: [2024, 2025], officer: 'Rohan K.', range: 'Range 1', sector: 'Auto components manufacturing', registered: '01-07-2017', plan: {},
    story: 'Clean: the returns agree with each other and were filed on time, both years.' },
  { key: 'E2', word: 'Metals', name: 'YERAWADA METAL TRADERS', pan: 'ZZYFY8202B', type: 'F', turnover: 260, sell: [P.hrc, P.tmt], buy: [P.hrc, P.tmt], buyRatio: 0.97,
    fys: [2024, 2025], officer: 'Rohan K.', range: 'Range 1', sector: 'Steel trading', registered: '15-09-2018',
    plan: { 2025: { excessItc: { 3: 0.9 * CR, 5: 1.3 * CR, 7: 1.1 * CR, 9: 1.5 * CR }, underDeclare: { 8: { taxable: 5 * CR, tax: 0.9 * CR } }, filedOn: { 2: '2025-08-28', 6: '2025-12-09' } } },
    story: 'ITC claimed in GSTR-3B above GSTR-2B in four months (B-01), tax declared in GSTR-1 not paid in GSTR-3B (G-02), two late returns. Has an EIU signal, a CA\'s reply, a demand from FY 2024-25 and its case history.' },
  { key: 'E3', word: 'Packaging', name: 'KHARADI PACKAGING LLP', pan: 'ZZKFK8203C', type: 'F', turnover: 85, sell: [P.polymer, P.pp], buy: [P.polymer, P.pp], buyRatio: 0.95,
    fys: [2025], officer: 'Sneha P.', range: 'Range 2', sector: 'Plastic packaging', registered: '10-01-2019', plan: {}, shellShare: 0.35, round: true,
    story: 'About a third of its ITC comes from suppliers that did not file GSTR-3B (B-04 and the non-filer indicator); purchase invoices in round lakhs. Has an EIU signal.' },
  { key: 'E4', word: 'Foods', name: 'WAGHOLI AGRO FOODS PRIVATE LIMITED', pan: 'ZZWCW8204D', turnover: 70, sell: [P.biscuits, P.pulses], buy: [P.oil, P.carton], buyRatio: 0.65,
    fys: [2025], officer: 'Sneha P.', range: 'Range 2', sector: 'Food processing', registered: '05-03-2020',
    plan: { 2025: { filedOn: { 1: '2025-07-24', 4: '2025-11-03', 5: '2025-12-19', 8: '2026-03-06' }, interestPaid: { 1: 0, 4: 0, 5: 0, 8: 0 } } },
    story: 'Four GSTR-3B returns filed one to two months late and no interest paid on the tax paid late (J-01); the portal\'s late fee was paid.' },
  { key: 'E5', word: 'Lifestyle', name: 'MAGARPATTA LIFESTYLE PRIVATE LIMITED', pan: 'ZZMCM8205E', turnover: 150, sell: [P.apparel, P.footwear], buy: [P.apparel, P.fabric], buyRatio: 0.7, eco: 0.8,
    fys: [2025], officer: 'Rohan K.', range: 'Range 1', sector: 'Apparel, online marketplaces', registered: '20-11-2019', plan: {},
    story: 'Sells through online marketplaces: from July their TCS statements show more sales than the turnover it declared (G-14).' },
];
// A returns export with the liability ledger missing: uploaded, but filing dates are unknown
export const INCOMPLETE = { key: 'E6', word: 'Textiles', name: 'VIMAN NAGAR TEXTILES PRIVATE LIMITED', pan: 'ZZVCV8206F', turnover: 60, sell: [P.garment, P.fabric], buy: [P.yarn, P.fabric], buyRatio: 0.7,
  fys: [2025], noLedger: true, officer: 'Sneha P.', range: 'Range 2', sector: 'Textiles', registered: '01-08-2021', plan: {},
  story: 'The export has no liability ledger sheet, so the dates the returns were filed are unknown.' };
for (const t of [...TAXPAYERS, INCOMPLETE]) t.gstin = gstin(27, t.pan);

const csv = (rows) => `${rows.map((r) => r.map((v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\r\n')}\r\n`;
const dmy = (iso) => iso.split('-').reverse().join('-');
const lakh = (v) => Math.round(v).toLocaleString('en-IN');
const rupees = (v) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // 1,23,456.78

export function build(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  const dir = (name) => { const d = path.join(outDir, name); fs.mkdirSync(d, { recursive: true }); return d; };
  const D = { reg: dir('1 Registers'), ret: dir('2 Returns'), bad: dir('3 Files that must be refused'), rep: dir('4 Reply letter'), next: dir('5 After the next update') };
  const title = 'SYNTHETIC END-TO-END TEST - not a real taxpayer';

  // ---- returns (the incomplete one with them: it is accepted, with a warning)
  const written = writeTaxpayers([...TAXPAYERS, INCOMPLETE], { seed: 8128, outDir: D.ret, title });
  const parsed = written.map((w) => ({ ...w, tp: parseWorkbook(w.wb, w.file) }));
  const tpOf = (key, fy) => parsed.find((p) => p.t.key === key && p.fy === fy).tp;

  // ---- registers
  const all = [...TAXPAYERS, INCOMPLETE];
  fs.writeFileSync(path.join(D.reg, '1 master - taxpayer master.csv'), csv([
    ['gstin', 'legal_name', 'jurisdiction', 'range', 'officer', 'sector', 'registration_date', 'status'],
    ...all.map((t) => [t.gstin, t.name, WARD, t.range, t.officer, t.sector, t.registered, 'Active']),
  ]));
  // targets: this year's output tax of the ward, month by month, plus 8% (so the ward runs a little behind)
  const outTax = (tp, m) => { const d = tp.g3b[m]; return d ? d.out.igst + d.out.cgst + d.out.sgst : 0; };
  fs.writeFileSync(path.join(D.reg, '2 targets - revenue targets.csv'), csv([
    ['jurisdiction', 'fy', 'month', 'target_amount', 'version', 'approved_on', 'basis'],
    ...MONTHS.map((mon, m) => [WARD, '2025-26', mon, Math.round(all.reduce((s, t) => s + outTax(tpOf(t.key, 2025), m), 0) * 1.08 / 1e5) * 1e5, 'v1', '01-04-2025', 'Ward plan: expected output tax + 8%']),
  ]));
  const e2 = tpOf('E2', 2025), e3 = tpOf('E3', 2025);
  // GSTR-2A carries each supplier's GSTR-3B filing status (2B does not)
  const shellItc = e3.g2a.filter((r) => r.supplier3B === false).reduce((s, r) => s + r.tax, 0);
  if (!shellItc) throw new Error('E3: no ITC from non-filing suppliers found in GSTR-2A');
  fs.writeFileSync(path.join(D.reg, '3 eiu - EIU risk signals.csv'), csv([
    ['signal_id', 'gstin', 'risk_parameter', 'rule_id', 'fy', 'amount', 'signal_date', 'priority', 'source', 'remarks'],
    ['EIU-PW2-0001', TAXPAYERS[1].gstin, 'ITC availed in excess of GSTR-2B', 'B-01', '2025-26', 4.8 * CR, '20-08-2026', 'High', 'EIU monthly risk run', 'Excess in July, September, November and January'],
    ['EIU-PW2-0002', TAXPAYERS[2].gstin, 'ITC from suppliers who have not filed GSTR-3B', 'B-04', '2025-26', Math.round(shellItc / 1000) * 1000, '20-08-2026', 'Medium', 'EIU network analytics', 'Two suppliers in the network with no GSTR-3B'],
  ]));
  fs.writeFileSync(path.join(D.reg, '4 demands - demands and recoveries.csv'), csv([
    ['demand_id', 'gstin', 'case_ref', 'fy', 'section', 'order_date', 'demand_tax', 'demand_interest', 'demand_penalty', 'paid_to_date', 'last_payment_date', 'stage', 'blocker'],
    ['DRC07-PW2-2026-0001', TAXPAYERS[1].gstin, 'ASMT-10/PW2/ZZYFY/20250625', '2024-25', '73', '20-01-2026', 1840000, 296000, 184000, 500000, '10-03-2026', 'Recovery', 'Bank account attachment pending'],
  ]));
  const caseRef = 'ASMT-10/PW2/ZZYFY/20250625';
  fs.writeFileSync(path.join(D.reg, '5 caselog - case action register.csv'), csv([
    ['case_id', 'gstin', 'fy', 'source', 'risk_type', 'signal_id', 'event', 'date', 'amount', 'officer', 'ref', 'outcome', 'reason', 'note'],
    ...[['selected', '10-06-2025', '', '', ''], ['notice', '25-06-2025', 1840000, caseRef, ''], ['reply', '20-07-2025', '', '', ''], ['scn', '15-10-2025', 1840000, 'DRC-01/PW2/2025/014', ''],
      ['order', '20-01-2026', 2320000, 'DRC-07/PW2/2026/0001', 'demand-confirmed'], ['payment', '10-03-2026', 500000, '', ''], ['recovery', '01-06-2026', 1820000, '', '']]
      .map(([event, date, amount, ref, outcome]) => ['SCR-PW2-2025-001', TAXPAYERS[1].gstin, '2024-25', 'Scrutiny', 'ITC mismatch (B-01)', '', event, date, amount, 'Rohan K.', ref, outcome, outcome ? 'ITC not supported by GSTR-2B' : '', '']),
  ]));

  // ---- files that must be refused, each for a stated reason
  const sheet = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(sheet, XLSX.utils.aoa_to_sheet([['Supplier', 'Invoice', 'Date', 'Amount'], ['Alpha Traders', 'A-1', '05-04-2025', 100000]]), 'Purchases');
  fs.writeFileSync(path.join(D.bad, 'A - Purchase register (not a returns export).xlsx'), XLSX.write(sheet, { bookType: 'xlsx', type: 'buffer' }));
  const good = fs.readFileSync(path.join(D.ret, parsed[0].file));
  fs.writeFileSync(path.join(D.bad, 'B - Get Download All Report (damaged file).xlsx'), good.subarray(0, Math.floor(good.length / 3)));
  fs.writeFileSync(path.join(D.reg, '6 master - WITH ERRORS (must be refused).csv'), csv([
    ['gstin', 'legal_name', 'jurisdiction', 'range', 'officer', 'sector', 'registration_date', 'status'],
    ['27ZZAAA0000A1Z0', 'CHECK DIGIT WRONG TRADERS', WARD, 'Range 1', 'Rohan K.', 'Trading', '01-07-2017', 'Active'],
    [TAXPAYERS[0].gstin, TAXPAYERS[0].name, '', 'Range 1', 'Rohan K.', 'Auto components manufacturing', '31-02-2017', 'Active'],
    [TAXPAYERS[1].gstin, TAXPAYERS[1].name, WARD, 'Range 1', 'Rohan K.', 'Steel trading', '15-09-2018', 'Dormant'],
  ]));

  // ---- the CA's reply to EIU-PW2-0001: claims the analysis tests against the returns
  const reply = [
    'SHAH & KULKARNI, CHARTERED ACCOUNTANTS',
    'Synthetic document for testing - not a real firm or taxpayer.',
    '',
    'To,',
    'The State Tax Officer, PUNE-WARD-02, Range 1',
    `Subject: Reply to EIU signal EIU-PW2-0001 - ${TAXPAYERS[1].name} (${TAXPAYERS[1].gstin}) - FY 2025-26`,
    '',
    'Dear Sir / Madam,',
    '',
    'On behalf of our client we submit the following in reply to the signal on excess input tax credit.',
    `The excess ITC of Rs. ${lakh(4.8 * CR)} pointed out in the signal was reversed in GSTR-3B for March 2026.`,
    'All our client\'s suppliers are registered and have filed their GSTR-3B returns for the months in which they invoiced.',
    'Interest on the returns filed late in June and October 2025 has been paid in cash.',
    'The goods were received at the client\'s Yerawada godown and e-way bills are available for every purchase.',
    'We request that the signal be closed on the basis of the above.',
    '',
    'Yours faithfully,',
    'For Shah & Kulkarni, Chartered Accountants',
    'Partner (synthetic)',
  ];
  fs.writeFileSync(path.join(D.rep, 'EIU-PW2-0001 - reply from CA.pdf'), pdf(reply));

  // ---- next release only: a purchase register in another layout (E1's GSTR-2B, as accounting software exports it)
  const e1 = tpOf('E1', 2025);
  fs.writeFileSync(path.join(D.next, 'Purchase register - Hadapsar Auto FY 2025-26 (other layout).csv'), csv([
    ['Supplier GSTIN', 'Supplier Name', 'Bill No', 'Bill Date', 'Bill Amount', 'Taxable Amount', 'IGST', 'CGST', 'SGST', 'ITC Eligible'],
    ...e1.g2b.map((r) => [r.gstin, r.party, r.no, r.date.split('-').reverse().join('/'), rupees(r.value), rupees(r.taxable), r.igst ? rupees(r.igst) : '', r.cgst ? rupees(r.cgst) : '', r.sgst ? rupees(r.sgst) : '', r.itcAvail ? 'Y' : 'N']),
  ]));
  // A scanned reply to EIU-PW2-0002: one JPEG page, no text layer, read only by OCR. Made once in a browser from the
  // letter below and kept in assets/ (a canvas is not available here):
  //   KHARADI PACKAGING LLP / Reply to EIU signal EIU-PW2-0002 - FY 2025-26 / All our suppliers are registered and
  //   genuine, and they have filed their returns. Payment for every purchase was made through banking channels.
  //   The goods were delivered to our Kharadi unit and e-way bills are available.
  fs.copyFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'e2e-scanned-reply.pdf'), path.join(D.next, 'EIU-PW2-0002 - reply from taxpayer (scanned).pdf'));

  fs.writeFileSync(path.join(outDir, '00 READ ME FIRST.txt'), readme().join('\r\n'));
  return { files: written.map((w) => w.file), parsed };
}

// What each step should show. Measured by uploading this pack, through the same requests the browser makes, to the
// code the live site runs (main 353520f) and to the next release; the results were the same except where noted.
const EXPECT = [
  ['YERAWADA METAL TRADERS', 'High 49', 'B-01, G-01, G-02, J-01', 'about Rs 5.70 Cr computed; EIU signal, CA reply, demand and case history'],
  ['KHARADI PACKAGING LLP', 'Moderate 27', 'J-01', 'B-04 to review; risk indicators: non-filing suppliers, round invoices'],
  ['MAGARPATTA LIFESTYLE PRIVATE LIMITED', 'Low 12', 'G-14, J-01', 'marketplace TCS above declared turnover'],
  ['WAGHOLI AGRO FOODS PRIVATE LIMITED', 'Low 7', 'J-01', 'about Rs 5.06 L interest not paid on late returns'],
  ['HADAPSAR AUTO COMPONENTS PRIVATE LIMITED', 'Low 3', 'none', 'clean, two years'],
  ['VIMAN NAGAR TEXTILES PRIVATE LIMITED', 'Low 3 (6 after the update)', 'none', 'no ledger: after the update A-02, J-01, J-03 are marked Review'],
];

function readme() {
  const row = ([n, r, f, w]) => `  ${n.padEnd(42)}${r.padEnd(28)}${f.padEnd(24)}${w}`;
  return [
    'GST SCRUTINY - END-TO-END UPLOAD TEST (PUNE-WARD-02)',
    '===================================================',
    '',
    'Fictional test data: every name, GSTIN (PAN starting "ZZ") and figure is invented.',
    'It adds one new ward, PUNE-WARD-02, with 6 taxpayers. None of them is on the live site today.',
    'Uploading the same files again is safe: they replace themselves and the results do not change.',
    '',
    'Everything happens in GST Scrutiny > Configure > Upload data, in this order.',
    '',
    'STEP 1 - REGISTERS (folder "1 Registers"), section 2 "Registers" of the page',
    '  Upload each file on its own row, with that row\'s Upload / Add rows button:',
    '    Taxpayer master        <- 1 master - taxpayer master.csv         expect: 6 rows added',
    '    Revenue targets        <- 2 targets - revenue targets.csv        expect: 12 rows added',
    '    EIU risk signals       <- 3 eiu - EIU risk signals.csv           expect: 2 rows added',
    '    Demands and recoveries <- 4 demands - demands and recoveries.csv expect: 1 row added',
    '    Case action register   <- 5 caselog - case action register.csv   expect: 7 rows added',
    '  (uploading a register a second time shows its rows as updated instead of added)',
    '  Then, on the Taxpayer master row, upload "6 master - WITH ERRORS (must be refused).csv":',
    '    expect: "File not loaded: 4 problem(s). Nothing was saved." with each problem listed',
    '    (a GSTIN with a wrong check digit, a missing jurisdiction, 31-02-2017, status "Dormant").',
    '',
    'STEP 2 - RETURNS (folders "2 Returns" and "3 Files that must be refused"), section 1 of the page',
    '  "Choose files" and select all 10 files of both folders at once.',
    '  Expect, within a minute, in the "Latest upload" report:',
    '    1 Received: 10 files   2 Checked and saved: 8 accepted, 2 not accepted   3 Analysed',
    '    A - Purchase register: not a returns export',
    '    B - damaged file: not a readable .xlsx workbook',
    '  and one row per taxpayer:',
    row(['TAXPAYER', 'RISK', 'FAILED CHECKS', 'WHAT IT SHOWS']),
    ...EXPECT.map(row),
    '',
    'STEP 3 - REPLY LETTER (folder "4 Reply letter")',
    '  Risk > EIU signals > EIU-PW2-0001 (Yerawada Metal Traders) > Record a reply:',
    '  From "CA", any received date, attach "EIU-PW2-0001 - reply from CA.pdf", then "Record and test".',
    '  Expect the letter\'s text to be read, and claim by claim: 2 supported, 2 contradicted,',
    '  1 not testable from returns (the ITC was not reversed in March 2026; four months stay open).',
    '',
    'STEP 4 - WHERE IT SHOWS',
    '  Dashboard: the 6 taxpayers in the risk ranking (Yerawada Metal Traders High).',
    '  Taxpayer 360 > Yerawada Metal Traders: the B-01 months July, September, November, January.',
    '  Leadership > Overview / Targets: choose jurisdiction PUNE-WARD-02 (targets about 8% above its tax).',
    '  Leadership > Recovery: demand DRC07-PW2-2026-0001, Rs 18.4 L tax, in recovery.',
    '  Leadership > Actions: case SCR-PW2-2025-001 from selection to recovery.',
    '  EIU signals: EIU-PW2-0002 (Kharadi Packaging) shows "Data insufficient" until the suppliers\'',
    '  deadline for FY 2025-26 (30 November 2026) has passed: that is correct, not an error.',
    '',
    'FOLDER 5 - AFTER THE NEXT UPDATE (not on the live site yet; these need the new release)',
    '  "Purchase register - Hadapsar Auto ... (other layout).csv": Upload data > Returns files >',
    '    "Data in another layout?": the file holds "GSTR-2B: invoices from suppliers", taxpayer',
    '    Hadapsar Auto Components, FY 2025-2026. Expect every column matched, 168 rows converted, no',
    '    problems. Replacing the sheet gives exactly the same result (it is the same data).',
    '  "EIU-PW2-0002 - reply from taxpayer (scanned).pdf": a scan with no text. Record it as the reply',
    '    to EIU-PW2-0002: it is read by OCR (about 94% confidence). Expect: suppliers\' claim',
    '    contradicted (two suppliers named), e-way bills supported, bank payments not testable.',
    '  After the update, Viman Nagar Textiles shows its missing ledger as "Review" on three checks.',
    '',
    'To take this test data off a server again, the 8 workbooks with these GSTINs are moved out of',
    'the server\'s data folder and the analysis rebuilt; the register rows stay unless removed there.',
    '',
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(ROOT, 'upload-pack', 'e2e'));
  const { files } = build(out);
  console.log(`Wrote the end-to-end pack (${files.length} returns workbooks) to ${out}`);
}
