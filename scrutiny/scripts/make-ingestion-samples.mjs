// Sample ingestion pack: one file of every kind the platform ingests, in the exact format it reads, plus a guide
// workbook that describes every file, sheet and column. For teams building a pipeline that feeds the platform.
// Everything is invented: names end in [SAMPLE] and every PAN starts with "ZZ". Deterministic.
//   node scripts/make-ingestion-samples.mjs      -> public/samples/ingestion/ (served, so the Upload data page links to it;
//                                                   OUT_DIR overrides, for tests)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { r2, serial, gstin, makeRng, dayIn, heads } from './synth/lib.mjs';
import { H, writeReturns } from './synth/workbook.mjs';
import { pdf } from './synth/docs.mjs';
import { REGISTERS } from '../src/engine/registers.js';
import { parseMatrixExtras } from '../src/engine/parse.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(root, 'public', 'samples', 'ingestion');
const CREATED = new Date('2026-09-27T10:30:00Z'); // fixed, so regenerating writes identical files

// ------------------------------------------------------------------ the sample taxpayer and its trading partners
const FY = 2025, STATE = 27, PAN = 'ZZXCS0001S';
const NAME = 'SAMPLE TRADERS PRIVATE LIMITED [SAMPLE]';
const GSTIN = gstin(STATE, PAN);
const ISD = gstin(STATE, PAN, '2'); // the same company's head-office registration, acting as Input Service Distributor
const g = makeRng(4711);
const party = (name, state) => ({ name, state: String(state).padStart(2, '0'), gstin: gstin(state, g.pan('C')) });
const customers = [party('SAMPLE RETAIL LLP [SAMPLE]', 27), party('SAMPLE SYSTEMS INTEGRATORS [SAMPLE]', 27), party('SAMPLE BANGALORE TECH [SAMPLE]', 29)];
const suppliers = [party('SAMPLE COMPONENTS PVT LTD [SAMPLE]', 27), party('SAMPLE LOGISTICS [SAMPLE]', 27), party('SAMPLE GUJARAT ELECTRONICS [SAMPLE]', 24)];
const HSN = [['8471', 'Computers and parts', 'NOS-NUMBERS', 42000], ['8504', 'Power supplies and converters', 'NOS-NUMBERS', 6500]];
const own = String(STATE);

// ------------------------------------------------------------------ 1. returns workbook (the 29 generated sheets)
function returnsWorkbook() {
  const sales = [];
  let seq = 0;
  for (let m = 0; m < 12; m++) for (let k = 0; k < 3; k++) {
    const c = customers[(m + k) % customers.length];
    const taxable = r2(g.logU(40000, 400000));
    seq++;
    sales.push({ m, c, no: `SMP/25-26/${String(seq).padStart(4, '0')}`, seq, date: dayIn(g, FY, m), rate: 18, taxable, ...heads(taxable, 18, c.state === own), hsn: HSN[k % 2] });
  }
  const cn = sales[18];
  const cdns = [{ m: 6, c: cn.c, no: 'SMP/CN/25-26/001', date: dayIn(g, FY, 6), origNo: cn.no, origDate: cn.date, rate: 18, taxable: 10000, ...heads(10000, 18, cn.c.state === own), hsn: cn.hsn }];
  const purchases = [];
  for (let m = 0; m < 12; m++) for (let k = 0; k < 2; k++) {
    const s = suppliers[(m + k) % suppliers.length];
    const taxable = r2(g.logU(30000, 250000));
    purchases.push({ m, s, no: `${s.name.slice(7, 10).toUpperCase()}${400 + m * 2 + k}`, date: dayIn(g, FY, m, { sundays: true }), rate: 18, taxable, ...heads(taxable, 18, s.state === own), rc: false, filed3B: true });
  }
  const supplierCdns = [{ m: 8, s: suppliers[0], no: 'SCN-0091', date: dayIn(g, FY, 8), rate: 18, taxable: 8000, ...heads(8000, 18, true) }];
  const { wb } = writeReturns({ name: NAME, gstin: GSTIN, state: STATE, fy: FY, filing: 'monthly', irn: true, extractDate: '2026-09-26', sales, cdns, purchases, supplierCdns },
    { filingLead: () => g.ri(2, 5) });
  return { wb, sales, purchases };
}

// ------------------------------------------------------------------ the 8 sheet types the generator does not write
// Exact headers of the real export (read from real workbooks; header rows only).
const EXTRA_H = {
  GSTR3B_DOC: ['Sr. #', 'Month', 'Details', 'Place of Supply (State/UT)', 'Total Taxable Value', 'Amount of Integrated Tax'],
  GSTR1_B2CL: ['Sr. #', 'Month', 'Party Name', 'Place of Supply', 'Invoice No', 'Invoice Date', 'Invoice Value', 'Rate', 'Taxable Value', 'IGST Amount', 'Cess Amount', 'GSTIN of E-commerce Operator'],
  GSTR1_B2CS: ['Sr. #', 'Month', 'Supply Type', 'Place of Supply', 'Rate of Tax', 'Total Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'Cess Amount', 'GSTIN of E-commerce Operator', 'Name of E-Commerce Operator'],
  GSTR1_NilRated: ['Sr. #', 'Month', 'Description', 'Nil Rated Supply', 'Exempted', 'Non GST Supplies'],
  'GSTR1_B2B Amendment': ['Sr. #', 'Month', 'GSTIN/UIN', 'Party Name', 'Original Supplier Invoice No', 'Original Supplier Invoice Date', 'Revised Invoice No', 'Revised Invoice Date', 'Invoice Type', 'Place of supply', 'Reverse Charge', 'Differential Percentage', 'Invoice Value', 'Rate', 'Taxable value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount', 'E-Commerce GSTIN'],
  GSTR2A_CDNA: ['Sr. #', 'Month', 'GSTIN/UIN of Recipient', 'Party Name', 'Type of note (Debit/ Credit)', 'Debit Note/ credit note/ Refund voucher No.', 'Debit Note/ credit note/ Refund voucher Date', 'Original Invoice No', 'Original Invoice Date', 'Invoice No', 'Invoice Date', 'Pre GST Regime Dr./ Cr. Notes', 'Differential Percentage', 'Note/Refund Voucher Value', 'Rate', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount', 'GSTR-1/5 Filing Status', 'GSTR-1/5 Filing Date', 'GSTR-1/5 Filing Period', 'GSTR-3B Filing Status', 'Submitted'],
  GSTR6A_B2B: ['Sr. #', 'GSTIN/UIN', 'Name of Party', 'Invoice No.', 'Invoice Date', 'Place of supply (Name of State)', 'Invoice Value', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/ UT Tax Amount', 'Cess Tax Amount', 'Submitted', 'Month'],
  GSTR6A_CDN: ['Sr. #', 'GSTIN/UIN', 'Party Name', 'Credit/Debit Note No', 'Credit/Debit Note Date', 'Original Invoice No', 'Original Invoice Date', 'Note Type', 'Reason for Issuing Note', 'Pre GST Regime', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount', 'Submitted', 'Month'],
};
const HEADERS = { ...H, ...EXTRA_H };
const NO_BANNER = new Set(['GSTR6A_B2B', 'GSTR6A_CDN']); // the real export writes these two without the banner rows

// Sheet order of the real export, with the sheets seen only in some workbooks slotted beside their family.
const ORDER = ['GSTR3B_Supplies', 'GSTR3B_DOC', 'GSTR3B_ITC', 'GSTR3B_Nil', 'GSTR3B_PaymentofTax', 'GSTR3B_InterestLateFees',
  'GSTR1_B2B', 'GSTR1_B2CL', 'GSTR1_B2CS', 'GSTR1_CDN', 'GSTR1_HSNSummary', 'GSTR1_DocIssued', 'GSTR1_NilRated', 'GSTR1_B2B Amendment',
  'GSTR2B_B2B', 'GSTR2B_B2BA', 'GSTR2B_CDNR', 'GSTR2B_CDNRA', 'GSTR2B_ISD', 'GSTR2B_ISDA', 'GSTR2B_IMPG', 'GSTR2B_IMPGSEZ',
  'GSTR2A_B2B', 'GSTR2A_B2BA', 'GSTR2A_CDN', 'GSTR2A_CDNA', 'GSTR2A_TDS', 'GSTR2A_IMPGOS', 'GSTR6A_B2B', 'GSTR6A_CDN',
  'LiabilityLedger', 'CashLedger', 'CreditLedger', 'Challan', 'GSTR-7 TDS', 'GSTR-7 TCS', 'GSTR-7 TDSA'];

// A row from { header: value }; a repeated header is addressed as "Header#2".
const rowOf = (header, obj) => { const seen = {}; return header.map((h) => { seen[h] = (seen[h] || 0) + 1; return obj[seen[h] > 1 ? `${h}#${seen[h]}` : h] ?? null; }); };
const d = (iso) => serial(iso);

/** Illustrative rows for every sheet the generator leaves empty: they show the format, not a reconciled position. */
function illustrative(sales, purchases) {
  const s0 = suppliers[0], s2 = suppliers[2], c2 = customers[2];
  const p = purchases[14], sale = sales[9];
  const sez = gstin(27, 'ZZSEZ4411K'), deductor = gstin(27, 'ZZGDT0001D'), ecom = gstin(27, 'ZZEOC7788M');
  const amend = { no: `${p.no}-R`, date: '2025-11-20' };
  return {
    GSTR3B_DOC: [{ 'Sr. #': 1, Month: 'May', Details: 'Supplies made to Unregistered Persons', 'Place of Supply (State/UT)': 'Karnataka', 'Total Taxable Value': 240000, 'Amount of Integrated Tax': 43200 }],
    GSTR1_B2CL: [{ 'Sr. #': 1, Month: 'May', 'Place of Supply': 'Karnataka', 'Invoice No': 'SMP/25-26/B001', 'Invoice Date': d('2025-05-19'), 'Invoice Value': 283200, Rate: 18, 'Taxable Value': 240000, 'IGST Amount': 43200, 'Cess Amount': 0 }],
    GSTR1_B2CS: [{ 'Sr. #': 1, Month: 'April', 'Supply Type': 'Intra-State', 'Place of Supply': 'Maharashtra', 'Rate of Tax': 18, 'Total Taxable Value': 42000, 'CGST Amount': 3780, 'SGST Amount': 3780 },
      { 'Sr. #': 2, Month: 'August', 'Supply Type': 'Inter-State', 'Place of Supply': 'Goa', 'Rate of Tax': 18, 'Total Taxable Value': 18500, 'IGST Amount': 3330, 'GSTIN of E-commerce Operator': ecom, 'Name of E-Commerce Operator': 'SAMPLE MARKETPLACE [SAMPLE]' }],
    GSTR1_NilRated: [{ 'Sr. #': 1, Month: 'April', Description: 'Intra-State supplies to registered persons', 'Nil Rated Supply': 0, Exempted: 15000, 'Non GST Supplies': 0 }],
    'GSTR1_B2B Amendment': [{ 'Sr. #': 1, Month: 'July', 'GSTIN/UIN': sale.c.gstin, 'Party Name': sale.c.name, 'Original Supplier Invoice No': sale.no, 'Original Supplier Invoice Date': d(sale.date), 'Revised Invoice No': sale.no, 'Revised Invoice Date': d(sale.date),
      'Invoice Type': 'Regular', 'Place of supply': 'Maharashtra', 'Reverse Charge': 'N', 'Invoice Value': r2(sale.taxable * 1.18 - 1180), Rate: 18, 'Taxable value': r2(sale.taxable - 1000), 'IGST Amount': 0, 'CGST Amount': r2((sale.taxable - 1000) * 0.09), 'SGST Amount': r2((sale.taxable - 1000) * 0.09), 'CESS Amount': 0 }],
    GSTR2B_B2BA: [{ Month: 'November', 'Invoice number': p.no, 'Invoice Date': d(p.date), 'GSTIN of supplier': p.s.gstin, 'Trade/Legal name': p.s.name, 'Invoice number#2': amend.no, 'Invoice type': 'Regular', 'Invoice date': d(amend.date),
      'Invoice Value': r2(p.taxable * 1.18), 'Place of supply': 'Maharashtra', 'Supply Attract Reverse Charge': 'No', Rate: 18, 'Taxable Value': p.taxable, 'Integrated Tax': p.igst, 'Central Tax': p.cgst, 'State/UT Tax': p.sgst, Cess: 0, 'GSTR-1/5 Period': '112025', 'GSTR-1/5 Filing Date': d('2025-12-11'), 'ITC Availability': 'Yes' }],
    GSTR2B_CDNRA: [{ Month: 'December', 'Original Details Note type': 'Credit Note', 'Original Details Note number': 'SCN-0091', 'Original Details Note date': d('2025-12-04'), 'GSTIN of supplier': s0.gstin, 'Trade/Legal name': s0.name,
      'Credit note/Debit note details Note number': 'SCN-0091A', 'Credit note/Debit note details Note type': 'Credit Note', 'Credit note/Debit note details Note Supply type': 'Regular', 'Credit note/Debit note details Note date': d('2025-12-18'),
      'Credit note/Debit note details Note Value': 9440, 'Place of supply': 'Maharashtra', 'Supply Attract Reverse Charge': 'No', Rate: 18, 'Taxable Value': 8000, 'Integrated Tax': 0, 'Central Tax': 720, 'State/UT Tax': 720, Cess: 0, 'GSTR-1/5 Period': '122025', 'GSTR-1/5 Filing Date': d('2026-01-11'), 'ITC Availability': 'Yes' }],
    GSTR2B_ISD: [{ Month: 'August', 'GSTIN of ISD': ISD, 'Trade/Legal name': 'SAMPLE TRADERS HEAD OFFICE (ISD) [SAMPLE]', 'ISD Document type': 'Invoice', 'ISD Document number': 'ISD/25-26/0007', 'ISD Document date': d('2025-08-30'),
      'Integrated Tax': 0, 'Central Tax': 4500, 'State/UT Tax': 4500, Cess: 0, 'ISD GSTR-6 Period': '082025', 'ISD GSTR-6 Filing Date': d('2025-09-13'), 'Eligibility of ITC': 'Yes' }],
    GSTR2B_ISDA: [{ Month: 'October', 'ISD Document type': 'Invoice', 'Document Number': 'ISD/25-26/0007', 'Document date': d('2025-08-30'), 'GSTIN of ISD': ISD, 'Trade/Legal name': 'SAMPLE TRADERS HEAD OFFICE (ISD) [SAMPLE]',
      'ISD Document type#2': 'Invoice', 'ISD Document number': 'ISD/25-26/0007A', 'ISD Document date': d('2025-10-06'), 'Integrated Tax': 0, 'Central Tax': 4200, 'State/UT Tax': 4200, Cess: 0, 'ISD GSTR-6 Period': '102025', 'ISD GSTR-6 Filing Date': d('2025-11-13'), 'Eligibility of ITC': 'Yes' }],
    GSTR2B_IMPG: [{ Month: 'November', 'Icegate Reference Date': d('2025-11-07'), 'Port Code': 'INNSA1', Number: '4567890', Date: d('2025-11-03'), 'Taxable Value': 350000, 'Integrated Tax': 63000, Cess: 0, 'Amended (Yes)': 'No' }],
    GSTR2B_IMPGSEZ: [{ Month: 'January', 'GSTIN of supplier': sez, 'Trade/Legal name': 'SAMPLE SEZ UNIT [SAMPLE]', 'Icegate Reference Date': d('2026-01-12'), 'Port Code': 'INPNQ6', Number: '1239876', Date: d('2026-01-09'), 'Taxable Value': 120000, 'Integrated Tax': 21600, Cess: 0, 'Amended (Yes)': 'No' }],
    GSTR2A_B2BA: [{ 'Sr. #': 1, Month: 'November', 'GSTIN of supplier': p.s.gstin, 'Name of Party': p.s.name, 'Original Invoice Number': p.no, 'Original Invoice Date': d(p.date), 'Invoice Type': 'Regular', 'Invoice Number': amend.no, 'Invoice Date': d(amend.date),
      'Place Of Supply': 'Maharashtra', 'Supply attract Reverse Charge': 'No', 'Total Invoice Value': r2(p.taxable * 1.18), Rate: 18, 'Total Taxable Value': p.taxable, 'Integrated Tax': p.igst, 'Central Tax': p.cgst, 'State/UT Tax': p.sgst, CESS: 0,
      'GSTR-1/5 Filing Status': 'Y', 'GSTR-1/5 Filing Date': d('2025-12-11'), 'GSTR-1/5 Filing Period': '112025', 'GSTR-3B Filing Status': 'Y' }],
    GSTR2A_CDN: [{ 'Sr. #': 1, Month: 'December', 'GSTIN/UIN of Recipient': s0.gstin, 'Party Name': s0.name, 'Type of note (Debit/ Credit)': 'Credit Note', 'Debit Note/ credit note/ Refund voucher No.': 'SCN-0091', 'Debit Note/ credit note/ Refund voucher Date': d('2025-12-04'),
      'Original Invoice No': purchases[16].no, 'Place of supply': 'Maharashtra', 'Supply Type': 'Intra-State', 'Supply type reverse charge': 'N', 'Pre GST Regime Dr./ Cr. Notes': 'N', 'Reason for issuing note Dr./ Cr. Notes': 'Rate difference', 'Note/Refund Voucher Value': 9440,
      'Original Invoice Date': d(purchases[16].date), Rate: 18, 'Taxable Value': 8000, 'IGST Amount': 0, 'CGST Amount': 720, 'SGST Amount': 720, 'CESS Amount': 0, 'GSTR-1/5 Filing Status': 'Y', 'GSTR-1/5 Filing Date': d('2026-01-11'), 'GSTR-1/5 Filing Period': '122025', 'GSTR-3B Filing Status': 'Y', Submitted: 'Y' }],
    GSTR2A_CDNA: [{ 'Sr. #': 1, Month: 'December', 'GSTIN/UIN of Recipient': s0.gstin, 'Party Name': s0.name, 'Type of note (Debit/ Credit)': 'Credit Note', 'Debit Note/ credit note/ Refund voucher No.': 'SCN-0091A', 'Debit Note/ credit note/ Refund voucher Date': d('2025-12-18'),
      'Original Invoice No': 'SCN-0091', 'Original Invoice Date': d('2025-12-04'), 'Pre GST Regime Dr./ Cr. Notes': 'N', 'Note/Refund Voucher Value': 9440, Rate: 18, 'Taxable Value': 8000, 'IGST Amount': 0, 'CGST Amount': 720, 'SGST Amount': 720, 'CESS Amount': 0,
      'GSTR-1/5 Filing Status': 'Y', 'GSTR-1/5 Filing Date': d('2026-01-11'), 'GSTR-1/5 Filing Period': '122025', 'GSTR-3B Filing Status': 'Y', Submitted: 'Y' }],
    GSTR2A_TDS: [{ 'Sr. #': 1, Month: 'September', 'GSTIN of Debuctor': deductor, 'Amount paid to deductee on which tax is deducted': 500000, 'Integrated Tax': 0, 'Central Tax': 5000, 'State/UT Tax': 5000, Submitted: 'Y' }],
    GSTR2A_IMPGOS: [{ 'Sr. #': 1, 'Reference Date': d('2025-11-07'), 'Port Code': 'INNSA1', Number: '4567890', Date: d('2025-11-03'), 'Taxable Value': 350000, IGST: 63000, CESS: 0, Month: 'November' }],
    GSTR6A_B2B: [{ 'Sr. #': 1, 'GSTIN/UIN': s2.gstin, 'Name of Party': s2.name, 'Invoice No.': 'GJE/771', 'Invoice Date': d('2025-07-15'), 'Place of supply (Name of State)': 'Maharashtra', 'Invoice Value': 59000, 'Taxable Value': 50000,
      'Integrated Tax Amount': 9000, 'Central Tax Amount': 0, 'State/ UT Tax Amount': 0, 'Cess Tax Amount': 0, Submitted: 'Y', Month: 'July' }],
    GSTR6A_CDN: [{ 'Sr. #': 1, 'GSTIN/UIN': s2.gstin, 'Party Name': s2.name, 'Credit/Debit Note No': 'GJE/CN/12', 'Credit/Debit Note Date': d('2025-08-02'), 'Original Invoice No': 'GJE/771', 'Original Invoice Date': d('2025-07-15'), 'Note Type': 'Credit Note',
      'Reason for Issuing Note': 'Post-sale discount', 'Pre GST Regime': 'N', 'Taxable Value': 2000, 'IGST Amount': 360, 'CGST Amount': 0, 'SGST Amount': 0, 'CESS Amount': 0, Submitted: 'Y', Month: 'August' }],
    'GSTR-7 TDS': [{ 'Sr. #': 1, 'GSTIN of Deductee': c2.gstin, 'Party Name of Deductee': c2.name, 'Amount Paid To Deductee on Which Tax is Deducted': 300000, IGST: 6000, CGST: 0, SGST: 0, Month: 'October' }],
    'GSTR-7 TCS': [{ 'Sr. #': 1, Month: 'August', 'GSTIN of Collector': ecom, 'Name of Collector': 'SAMPLE MARKETPLACE [SAMPLE]', 'Tax period of GSTR-8': '082025', 'Gross value': 20000, 'Supplies returned': 1500, 'Net value': 18500, 'Integrated Tax': 92.5, 'Central Tax': 0, 'State/UT Tax': 0, Action: 'Accepted' }],
    'GSTR-7 TDSA': [{ 'Sr. #': 1, Month: 'November', 'GSTIN of Deductee': c2.gstin, 'Party Name of Deductee': c2.name, 'Amount Paid To Deductee on Which Tax is Deducted': 280000, IGST: 5600, CGST: 0, SGST: 0 }],
    Challan: [{ 'Sr. #': 1, Month: 'April', CPIN: '25042700012345', 'Created On': d('2025-05-18'), Amount: 25000, Mode: 'E-Payment', 'Expiry Date': d('2025-06-02'), 'Deposit Date': d('2025-05-18'), 'Deposit Status': 'PAID' }],
    GSTR3B_InterestLateFees: [{ Description: 'Interest', Month: 'April', 'Integrated Tax': 0, 'Centarl Tax': 0, 'State/UT Tax': 0, Cess: 0 }],
  };
}

const bannerOf = (name) => [[null, 'Company Name : ', NAME], [null, 'Company GSTN : ', GSTIN], [null, 'Return Period : ', `${FY} - ${FY + 1}`, 'http://www.microvistatech.com'], [null, 'Report Name : ', name.replace(/_/g, '-')], []];
const isDateHeader = (h) => /date|created on/i.test(h) && !/filing status/i.test(h);

/** Dates are Excel serial numbers (as in the real export); show them as DD-MM-YYYY so the sample reads easily. */
function formatDates(ws, headerRow, header) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  header.forEach((h, c) => {
    if (!h || !isDateHeader(h)) return;
    for (let r = headerRow + 1; r <= range.e.r; r++) { const cell = ws[XLSX.utils.encode_cell({ r, c })]; if (cell && cell.t === 'n') cell.z = 'dd-mm-yyyy'; }
  });
  ws['!cols'] = header.map((h) => ({ wch: Math.min(34, Math.max(9, String(h ?? '').length + 2)) }));
}

function buildReturns() {
  const { wb: gen, sales, purchases } = returnsWorkbook();
  const extra = illustrative(sales, purchases);
  const wb = XLSX.utils.book_new();
  for (const name of ORDER) {
    const header = HEADERS[name];
    let rows = [];
    if (gen.Sheets[name]) {
      const grid = XLSX.utils.sheet_to_json(gen.Sheets[name], { header: 1, raw: true, defval: null, blankrows: false });
      const h = grid.findIndex((r) => r.includes('Month') && r.filter((c) => c !== null).length > 3);
      rows = grid.slice(h + 1);
    }
    if (!rows.length && extra[name]) rows = extra[name].map((o) => rowOf(header, o));
    const top = NO_BANNER.has(name) ? [] : bannerOf(name);
    const ws = XLSX.utils.aoa_to_sheet([...top, header, ...rows]);
    formatDates(ws, top.length, header);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  wb.Props = { Title: 'SAMPLE DATA - invented to show the format, not a real taxpayer', Author: 'GST Intelligence sample generator', CreatedDate: CREATED };
  return wb;
}

// ------------------------------------------------------------------ 2. registers: upload-ready, one file each
const JUR = 'SAMPLE-WARD-01';
const dt = (s) => { const [dd, mm, yy] = s.split('-'); return serial(`${yy}-${mm}-${dd}`); }; // DD-MM-YYYY -> Excel date
function registerRows() {
  const [c0, c1] = customers, s2 = suppliers[2];
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return {
    master: [
      { gstin: GSTIN, legal_name: NAME, jurisdiction: JUR, range: 'Range 1', officer: 'Officer A [SAMPLE]', sector: 'Computer hardware trading', registration_date: dt('01-07-2017'), status: 'Active' },
      { gstin: c0.gstin, legal_name: c0.name, jurisdiction: JUR, range: 'Range 1', officer: 'Officer A [SAMPLE]', sector: 'Retail', registration_date: dt('14-03-2019'), status: 'Active' },
      { gstin: c1.gstin, legal_name: c1.name, jurisdiction: JUR, range: 'Range 2', officer: 'Officer B [SAMPLE]', sector: 'IT services', registration_date: dt('02-11-2020'), status: 'Suspended', status_date: dt('10-02-2026') },
      { gstin: s2.gstin, legal_name: s2.name, jurisdiction: 'SAMPLE-WARD-GJ', registration_date: dt('21-08-2018'), status: 'Cancelled', status_date: dt('30-11-2025') },
    ],
    eiu: [
      { signal_id: 'EIU-SAMPLE-0001', gstin: GSTIN, risk_parameter: 'ITC availed in excess of GSTR-2B', rule_id: 'B-01', fy: '2025-26', amount: 125000, signal_date: dt('15-08-2026'), priority: 'High', source: 'EIU monthly risk run' },
      { signal_id: 'EIU-SAMPLE-0002', gstin: c0.gstin, risk_parameter: 'Outward tax in GSTR-1 not declared in GSTR-3B', rule_id: 'A-01', fy: '2025-26', amount: 48000, signal_date: dt('15-08-2026'), priority: 'Medium', source: 'EIU monthly risk run', remarks: 'Two periods' },
    ],
    targets: months.map((m, i) => ({ jurisdiction: JUR, fy: '2025-26', month: m, target_amount: [42, 40, 44, 46, 45, 48, 52, 50, 49, 51, 55, 68][i] * 1e6, version: 'v1', approved_on: dt('01-04-2025'), basis: 'Prior-year collection + 10%' })),
    demands: [
      { demand_id: 'DRC07-SAMPLE-0001', gstin: GSTIN, case_ref: 'ASMT-10/SAMPLE/0001', fy: '2023-24', section: '73', order_date: dt('20-01-2026'), demand_tax: 540000, demand_interest: 48600, demand_penalty: 54000, paid_to_date: 200000, last_payment_date: dt('15-03-2026'), stage: 'Recovery', blocker: 'Bank account attachment pending' },
      { demand_id: 'DRC07-SAMPLE-0002', gstin: c0.gstin, case_ref: 'ASMT-10/SAMPLE/0002', fy: '2022-23', section: '74', order_date: dt('05-12-2025'), demand_tax: 910000, demand_interest: 155000, demand_penalty: 910000, stage: 'Under appeal' },
    ],
    caselog: [
      ['SCR-SAMPLE-001', GSTIN, 'selected', '20-08-2026', { source: 'EIU', signal_id: 'EIU-SAMPLE-0001', risk_type: 'ITC mismatch (B-01)', amount: 125000 }],
      ['SCR-SAMPLE-001', GSTIN, 'assigned', '21-08-2026', {}],
      ['SCR-SAMPLE-001', GSTIN, 'notice', '28-08-2026', { amount: 125000, ref: 'ASMT-10/SAMPLE/0003' }],
      ['SCR-SAMPLE-001', GSTIN, 'reply', '12-09-2026', { note: 'Taxpayer reply received; letter attached in the platform' }],
      ['SCR-SAMPLE-001', GSTIN, 'payment', '19-09-2026', { amount: 60000, ref: 'DRC-03/SAMPLE/0001' }],
      ['SCR-SAMPLE-001', GSTIN, 'closed', '22-09-2026', { amount: 60000, outcome: 'paid-voluntary', reason: 'Part accepted and paid; balance explained by credit notes' }],
      ['SCR-SAMPLE-002', c0.gstin, 'selected', '20-08-2026', { source: 'EIU', signal_id: 'EIU-SAMPLE-0002', risk_type: 'Outward tax short-declared (A-01)', amount: 48000 }],
      ['SCR-SAMPLE-002', c0.gstin, 'notice', '29-08-2026', { amount: 48000, ref: 'ASMT-10/SAMPLE/0004' }],
      ['SCR-SAMPLE-002', c0.gstin, 'reply', '15-09-2026', {}],
      ['SCR-SAMPLE-002', c0.gstin, 'closed', '24-09-2026', { outcome: 'explained', reason: 'declared in a later return' }],
    ].map(([case_id, gst, event, date, o]) => ({ case_id, gstin: gst, fy: '2025-26', event, date: dt(date), officer: 'Officer A [SAMPLE]', ...o })),
    extensions: [
      { fy: '2025-26', month: 'Dec', filing: 'All', states: 'All', due_date: dt('22-01-2026'), notification: 'Notification No. 01/2026-Central Tax [SAMPLE]' },
      { fy: '2025-26', month: 'Sep', filing: 'QRMP', states: '27, 30', due_date: dt('29-10-2025'), notification: 'Notification No. 12/2025-Central Tax [SAMPLE]' },
    ],
  };
}

function registerBook(type, rows) {
  const labels = REGISTERS[type].columns.map((c) => c.label);
  const ws = XLSX.utils.aoa_to_sheet([labels, ...rows.map((o) => labels.map((l) => o[l] ?? null))]);
  const dateCols = labels.map((l, i) => (/date|approved_on/.test(l) ? i : -1)).filter((i) => i >= 0);
  for (let r = 1; r <= rows.length; r++) for (const c of dateCols) { const cell = ws[XLSX.utils.encode_cell({ r, c })]; if (cell) cell.z = 'dd-mm-yyyy'; }
  ws['!cols'] = labels.map((l) => ({ wch: Math.max(12, l.length + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type);
  wb.Props = { Title: `SAMPLE ${REGISTERS[type].title} - invented`, Author: 'GST Intelligence sample generator', CreatedDate: CREATED };
  return wb;
}

// ------------------------------------------------------------------ 3. a reply letter (free-form document)
const letter = () => pdf([
  'SAMPLE TRADERS PRIVATE LIMITED [SAMPLE]',
  `GSTIN ${GSTIN}`,
  '',
  'To: The Proper Officer, SAMPLE-WARD-01',
  'Date: 12-09-2026',
  '',
  'Subject: Reply to notice ASMT-10/SAMPLE/0003 regarding signal EIU-SAMPLE-0001 (FY 2025-26)',
  '',
  'Sir/Madam,',
  '',
  'With reference to the above notice pointing out input tax credit of Rs. 1,25,000 availed in excess of GSTR-2B,',
  'we submit as follows:',
  '1. Credit of Rs. 65,000 relates to invoices of SAMPLE COMPONENTS PVT LTD reported by the supplier in the following',
  '   month; the invoices now appear in our GSTR-2B for November 2025.',
  '2. The balance of Rs. 60,000 has been reversed and paid through DRC-03 on 19-09-2026 with applicable interest.',
  '',
  'We request that the proceedings be dropped. Copies of the invoices and the DRC-03 acknowledgement are enclosed.',
  '',
  'For SAMPLE TRADERS PRIVATE LIMITED [SAMPLE]',
  'Authorised signatory',
  '',
  'THIS IS A SAMPLE LETTER WITH INVENTED CONTENT, TO SHOW THE KIND OF DOCUMENT THE PLATFORM ACCEPTS.',
]);

// ------------------------------------------------------------------ 4. the guide workbook
const returnsFile = `Get Download All Report_${GSTIN}_${FY} - ${FY + 1}_SAMPLE Traders.xlsx`;
const SHEET_INFO = {
  GSTR3B_Supplies: ['GSTR-3B Table 3.1: outward supplies and reverse-charge inward supplies, by nature of supply, per period.', 'Core'],
  GSTR3B_DOC: ['GSTR-3B Table 3.2: inter-state supplies to unregistered persons, composition dealers and UIN holders.', 'Not read yet'],
  GSTR3B_ITC: ['GSTR-3B Table 4: input tax credit available, reversed, net and ineligible.', 'Core'],
  GSTR3B_Nil: ['GSTR-3B Table 5: exempt, nil-rated and non-GST inward supplies.', 'Not read yet'],
  GSTR3B_PaymentofTax: ['GSTR-3B Table 6.1: tax payable and how it was paid (credit, cash), interest and late fee.', 'Core'],
  GSTR3B_InterestLateFees: ['GSTR-3B Table 5.1: interest and late fee.', 'Read when present'],
  GSTR1_B2B: ['GSTR-1: invoice-level sales to registered buyers.', 'Core'],
  GSTR1_B2CL: ['GSTR-1: large inter-state invoices to unregistered buyers.', 'Read when present'],
  GSTR1_B2CS: ['GSTR-1: summary of other sales to unregistered buyers, by rate and place of supply.', 'Read when present'],
  GSTR1_CDN: ['GSTR-1: credit and debit notes issued to registered buyers.', 'Read when present'],
  GSTR1_HSNSummary: ['GSTR-1: HSN-wise summary of outward supplies.', 'Read when present'],
  GSTR1_DocIssued: ['GSTR-1: serial ranges of documents issued, with cancellations.', 'Read when present'],
  GSTR1_NilRated: ['GSTR-1: nil-rated, exempt and non-GST outward supplies.', 'Read when present'],
  'GSTR1_B2B Amendment': ['GSTR-1: amendments to sales invoices reported in earlier periods.', 'Read when present'],
  GSTR2B_B2B: ['GSTR-2B: purchase invoices from registered suppliers as fixed in the monthly ITC statement.', 'Core'],
  GSTR2B_B2BA: ['GSTR-2B: amended supplier invoices.', 'Read when present'],
  GSTR2B_CDNR: ['GSTR-2B: credit and debit notes from suppliers.', 'Read when present'],
  GSTR2B_CDNRA: ['GSTR-2B: amended supplier credit and debit notes.', 'Not read yet'],
  GSTR2B_ISD: ['GSTR-2B: credit distributed by an Input Service Distributor.', 'Read when present'],
  GSTR2B_ISDA: ['GSTR-2B: amended ISD credit.', 'Not read yet'],
  GSTR2B_IMPG: ['GSTR-2B: imports of goods from overseas (bills of entry from ICEGATE).', 'Read when present'],
  GSTR2B_IMPGSEZ: ['GSTR-2B: imports of goods from SEZ units.', 'Read when present'],
  GSTR2A_B2B: ['GSTR-2A: purchase invoices as uploaded by suppliers, with the supplier\'s filing status.', 'Core'],
  GSTR2A_B2BA: ['GSTR-2A: amended supplier invoices.', 'Not read yet'],
  GSTR2A_CDN: ['GSTR-2A: credit and debit notes from suppliers.', 'Read when present'],
  GSTR2A_CDNA: ['GSTR-2A: amended supplier credit and debit notes.', 'Not read yet'],
  GSTR2A_TDS: ['GSTR-2A: TDS credit received from deductors (GSTR-7).', 'Read when present'],
  GSTR2A_IMPGOS: ['GSTR-2A: imports of goods.', 'Read when present'],
  GSTR6A_B2B: ['GSTR-6A: invoices received by an ISD registration. Written WITHOUT banner rows in the real export.', 'Read when present'],
  GSTR6A_CDN: ['GSTR-6A: notes received by an ISD registration. Written WITHOUT banner rows in the real export.', 'Not read yet'],
  LiabilityLedger: ['Electronic liability ledger: tax debited on filing and how it was discharged.', 'Core'],
  CashLedger: ['Electronic cash ledger: deposits and cash payments.', 'Core'],
  CreditLedger: ['Electronic credit ledger: ITC credited and used.', 'Core'],
  Challan: ['Payment challans (CPIN): amount, mode, deposit date and status.', 'Read when present'],
  'GSTR-7 TDS': ['GSTR-7: TDS deducted by this taxpayer as a deductor.', 'Not read yet'],
  'GSTR-7 TCS': ['TCS collected by e-commerce operators on this taxpayer\'s sales (GSTR-8).', 'Read when present'],
  'GSTR-7 TDSA': ['GSTR-7: amendments to TDS.', 'Not read yet'],
};
const TYPOS = { 'Centarl Tax': 'Central Tax', 'GSTIN of Debuctor': 'GSTIN of Deductor', 'Tax Preiod if Applicable': 'Tax Period if Applicable', 'Repoting Date (by bank)': 'Reporting Date (by bank)' };

/** Column names the parser reads: every quoted string and every r.<name> in src/engine/parse.js. */
function parserColumns() {
  const src = fs.readFileSync(path.join(root, 'src', 'engine', 'parse.js'), 'utf8');
  const sheets = new Set([...src.matchAll(/readSheet\(wb, '([^']+)'\)/g)].map((m) => m[1]));
  const cols = new Set([...src.matchAll(/'([^'\n]+)'/g)].map((m) => m[1]));
  for (const m of src.matchAll(/\br\.([A-Za-z]+)\b/g)) cols.add(m[1]);
  return { sheets, cols };
}

const REG_MEANING = {
  master: { gstin: 'Taxpayer GSTIN', legal_name: 'Legal name as registered', jurisdiction: 'Ward / range / circle code the taxpayer belongs to', range: 'Range within the jurisdiction', officer: 'Officer in charge', sector: 'Business sector, in your own classification', registration_date: 'Date of GST registration', status: 'Registration status today', status_date: 'Date the status last changed (for Suspended / Cancelled)' },
  eiu: { signal_id: 'Unique ID of the signal as issued by EIU', gstin: 'Taxpayer GSTIN', risk_parameter: 'Risk parameter, in EIU\'s words', rule_id: 'Matching platform rule, if known', fy: 'Financial year the signal is about', amount: 'Amount at risk stated in the signal (Rs.)', signal_date: 'Date EIU issued the signal', priority: 'Priority given by EIU', source: 'Which EIU run or report it came from', remarks: 'Any remarks' },
  targets: { jurisdiction: 'Ward / range / circle code', fy: 'Financial year', month: 'Month (leave blank for a whole-year target)', target_amount: 'Approved collection target (Rs.)', version: 'Version label; a revised target gets a new version', approved_on: 'Approval date', basis: 'How the target was set' },
  demands: { demand_id: 'Demand / order number (e.g. DRC-07 number)', gstin: 'Taxpayer GSTIN', case_ref: 'Case or notice reference', fy: 'Financial year of the demand', section: 'Section of the CGST Act under which it was raised', order_date: 'Date of the order', demand_tax: 'Tax demanded (Rs.)', demand_interest: 'Interest demanded (Rs.)', demand_penalty: 'Penalty demanded (Rs.)', paid_to_date: 'Total paid or recovered so far (Rs.)', last_payment_date: 'Date of the latest payment', stage: 'Current stage of the demand', blocker: 'What is holding up recovery, if anything' },
  extensions: { fy: 'Financial year of the tax period', month: 'Last month of the tax period (for QRMP filers, the last month of the quarter)', filing: 'Which filers the extension covers: All, Monthly or QRMP', states: '"All", or the State codes covered, separated by commas (e.g. 27, 24)', due_date: 'The extended due date', notification: 'Notification that extended it' },
  caselog: { case_id: 'Case number in the case-management system', gstin: 'Taxpayer GSTIN', fy: 'Financial year under examination', source: 'What started the case', risk_type: 'Issue under examination', signal_id: 'EIU signal ID, if the case came from one', event: 'What happened (one row per step)', date: 'Date of the step', amount: 'Amount involved in this step (Rs.)', officer: 'Officer who took the step', ref: 'Document reference (notice, order, DRC-03 ...)', outcome: 'Closure outcome, on the "closed" row only', reason: 'Why the case closed that way', note: 'Free text' },
};
const REG_FILE = { master: 'Taxpayer master', eiu: 'EIU risk signals', targets: 'Revenue targets', demands: 'Demands and recoveries', caselog: 'Case action register', extensions: 'Due-date extensions' };

function formatOf(col) {
  try { col.type('__probe__'); return 'Text'; } catch (e) {
    if (/GSTIN/.test(e.message)) return 'GSTIN: 15 characters with a correct check digit';
    return e.message.replace(/^must be (a |an )?/, '').replace(/^./, (c) => c.toUpperCase());
  }
}

// How much of each rule-matrix data source the returns workbook already supplies.
const COVERAGE = [
  [/^GSTR-1/, 'Covered by the returns workbook'],
  [/^GSTR-3B/, 'Covered by the returns workbook'],
  [/IMS/, 'Partly: GSTR-2A and 2B are in the workbook; IMS accept / reject actions are not'],
  [/GSTR-6/, 'Partly: TDS, TCS and ISD credits received are in the workbook; the GSTR-6 / 7 / 8 returns themselves are not'],
  [/Electronic ledgers/, 'Partly: the three ledgers are in the workbook; DRC-03 payment records are not'],
  [/ICEGATE/, 'Partly: bills of entry that reach GSTR-2B (import sheets) are in the workbook; ICEGATE itself is not'],
  [/GSTIN master/, 'Partly: the Taxpayer master register carries status and registration date; there is no live API lookup'],
];
const coverageOf = (source) => COVERAGE.find(([re]) => re.test(source))?.[1] ?? 'Not ingested yet';

function guideBook(matrixSources) {
  const wb = XLSX.utils.book_new();
  const add = (name, aoa, widths) => { const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = widths.map((wch) => ({ wch })); XLSX.utils.book_append_sheet(wb, ws, name); };

  add('Start here', [
    ['GST Intelligence: sample input files and format guide'],
    ['Every value in this pack is invented. Names end in [SAMPLE] and every PAN starts with ZZ. No real taxpayer is represented.'],
    [],
    ['What the platform takes in'],
    ['#', 'File', 'How many', 'Sample in this pack', 'Where it is uploaded today', 'Needed?'],
    [1, 'Returns workbook ("Get Download All Report")', 'One per taxpayer per financial year', `1 Returns/${returnsFile}`, 'Data sources > Upload return (several at once)', 'Yes: everything is built from it'],
    [2, 'Taxpayer master', 'One file for the whole jurisdiction', '2 Registers/master.xlsx', 'Data sources > Registers > Taxpayer master', 'Recommended: sector, officer and registration status'],
    [3, 'EIU risk signals', 'One file for the whole jurisdiction', '2 Registers/eiu.xlsx', 'Data sources > Registers > EIU risk signals', 'For the EIU signals page'],
    [4, 'Revenue targets', 'One file for the whole jurisdiction', '2 Registers/targets.xlsx', 'Data sources > Registers > Revenue targets', 'For the Targets and Collections pages'],
    [5, 'Demands and recoveries', 'One file for the whole jurisdiction', '2 Registers/demands.xlsx', 'Data sources > Registers > Demands and recoveries', 'For the Recovery page'],
    [6, 'Case action register', 'One file for the whole jurisdiction', '2 Registers/caselog.xlsx', 'Data sources > Registers > Case action register', 'For the Actions and Learning pages'],
    [7, 'Due-date extensions', 'One file, updated when an extension is notified', '2 Registers/extensions.xlsx', 'Data sources > Registers > Due-date extensions', 'When a GSTR-3B due date is extended; otherwise the statutory dates apply'],
    [8, 'Reply letter', 'One per taxpayer reply', '3 Reply letters/EIU-SAMPLE-0001 reply.pdf', 'EIU signals > open the signal > Record reply > attach', 'Optional: free-form PDF, Word (.docx) or text'],
    [9, 'Rule matrix', 'One, set up once', '(not included: already on the platform)', 'Placed in the data folder by the administrator', 'Already in place'],
    [],
    ['How to read this guide'],
    ['Sheet', 'What it covers'],
    ['Returns - sheets', 'Every sheet of the returns workbook: what it holds and whether the platform reads it'],
    ['Returns - columns', 'Every column of every returns sheet, exactly as spelled in the export, and whether the platform reads it'],
    ['Registers - columns', 'Every column of the six registers: required or not, the accepted format, an example and the meaning'],
    ['Rules', 'The rules a file must follow to be accepted. A pipeline should check these before delivering a file'],
    ['Other sources', 'Data the rule matrix needs that no current file provides (for planning, not required now)'],
    [],
    ['Note on the returns workbook'],
    ['The banner of the real workbooks links to microvistatech.com, so these files appear to be exported by a GST software tool, not downloaded directly from the GST portal. Confirm the source before automating it.'],
  ], [4, 44, 36, 58, 50, 50]);

  add('Returns - sheets', [
    ['Sheet name (exact)', 'What it holds', 'Platform reads it?', 'Banner rows?', 'Rows in the sample'],
    ...ORDER.map((n) => [n, SHEET_INFO[n][0], SHEET_INFO[n][1], NO_BANNER.has(n) ? 'No: header in row 1' : 'Yes: 4 banner rows, a blank row, then the header', n in H ? 'Generated, consistent with GSTR-3B' : 'Illustrative']),
    [],
    ['Core = the main checks cannot run without it. Read when present = used if the export has it; the export leaves a sheet out when there is nothing to report. Not read yet = in the export but not used today; deliver it anyway.'],
    ['Illustrative rows show the format only and are not reconciled with the rest of the return. Loaded into the platform, the sample therefore shows GSTR-1 vs GSTR-3B and HSN differences (checks G-01, G-02, G-10, G-12), because the illustrative B2C sales are not carried into GSTR-3B, the HSN summary or the document summary. That is expected.'],
  ], [26, 80, 20, 44, 36]);

  const { sheets, cols } = parserColumns();
  const colRows = [];
  for (const n of ORDER) {
    const seen = {};
    HEADERS[n].forEach((h, i) => {
      seen[h] = (seen[h] || 0) + 1;
      const read = sheets.has(n) && seen[h] === 1 && h !== 'Sr. #' && cols.has(h);
      let note = TYPOS[h] ? `Export's own spelling (means "${TYPOS[h]}"). Keep it exactly.` : '';
      if (seen[h] > 1) note = 'Repeated header: the second one holds the revised / current value';
      if (h === 'Month') note = 'Full English month name: April ... March. Rows with any other value are skipped.';
      if (n === 'GSTR1_B2B Amendment' && h === 'Taxable value') note = 'Lower-case "v" in the export; the platform looks for "Taxable Value", so it is not read yet (the amendment sheet is not used by any check today).';
      colRows.push([n, i + 1, h, read ? 'Yes' : 'No', note]);
    });
  }
  add('Returns - columns', [['Sheet', 'Column #', 'Header (exact text)', 'Platform reads it?', 'Notes'], ...colRows], [26, 9, 48, 18, 90]);

  const regRows = [];
  for (const [type, def] of Object.entries(REGISTERS)) {
    for (const c of def.columns) regRows.push([REG_FILE[type], `${type}.xlsx`, c.label, c.required ? 'Yes' : 'No', formatOf(c), c.example || '', REG_MEANING[type][c.label] || '']);
  }
  add('Registers - columns', [['Register', 'Sample file', 'Column name (row 1)', 'Required?', 'Format', 'Example', 'Meaning'], ...regRows], [24, 14, 20, 10, 60, 32, 56]);

  add('Rules', [
    ['#', 'Applies to', 'Rule', 'What happens if it is broken'],
    [1, 'Returns workbook', 'One file per taxpayer (GSTIN) per financial year. Do not combine taxpayers or split a year.', 'Two files for the same GSTIN and year: the newer replaces the older (the older is kept aside, not deleted).'],
    [2, 'Returns workbook', `File name: Get Download All Report_<GSTIN>_<YYYY> - <YYYY>_<Short name>.xlsx, e.g. ${returnsFile}`, 'Name is only a help: if it lacks the GSTIN or year, they are read from the banner.'],
    [3, 'Returns workbook', 'Keep the export layout: exact sheet names; on each sheet the 4 banner rows (Company Name, Company GSTN, Return Period, Report Name), a blank row, then the header row. GSTR6A sheets have no banner.', 'A sheet with a different name is ignored.'],
    [4, 'Returns workbook', 'The first GSTR-3B sheet must carry "Company GSTN : <GSTIN>" and "Return Period : <YYYY> - <YYYY>" in its banner.', 'No GSTIN in the banner: the whole file is skipped.'],
    [5, 'Returns workbook', 'Header text exactly as in the export, including its misspellings (see Returns - columns). Do not rename, reorder into new names or translate columns.', 'A renamed column is not read; its values count as zero.'],
    [6, 'Returns workbook', 'Month column: full English month name, April to March.', 'Rows with "Apr", "04", "Apr-2025" etc. are skipped silently. Check this in the pipeline.'],
    [7, 'Returns workbook', 'Amounts: plain numbers in rupees, no currency symbol. Dates: Excel dates, or text DD-MM-YYYY / DD/MM/YYYY / YYYY-MM-DD.', 'A non-numeric amount counts as zero; an unreadable date is blank.'],
    [8, 'Returns workbook', 'Deliver every sheet the export produces, including the "Not read yet" ones. A missing sheet means "nothing to report".', 'Missing sheets are treated as empty.'],
    [9, 'Returns workbook', 'Size: up to 40 MB per file through the upload screen.', 'Larger files are refused.'],
    [10, 'Registers', 'CSV or Excel (.xlsx). Only the first sheet is read. Row 1 holds the column names exactly as listed; order does not matter.', 'Missing required columns: the file is rejected with the list.'],
    [11, 'Registers', 'Every row is checked. One bad row rejects the whole file, and every problem is listed at once so it can be fixed in one pass.', 'Nothing is saved until the whole file is valid.'],
    [12, 'Registers', 'GSTIN: 15 characters with a valid check digit. Financial year: 2025-26. Month: Apr to Mar. Dates: DD-MM-YYYY, YYYY-MM-DD or an Excel date. Amounts: rupees, not negative.', 'Row-level error naming the row and column.'],
    [13, 'Registers', 'No duplicates: the key column (signal_id, demand_id, gstin ...) must be unique; the case register rejects the same case, event, date, reference and amount twice.', 'Row-level error.'],
    [14, 'Registers', 'Each upload adds to the register: new rows are added, a row with the same key (GSTIN, signal_id, demand_id ...) is updated, and every row already saved stays. Send only new or changed rows if you like. The previous version and the original file are kept.', 'A row cannot be removed by leaving it out of a new upload.'],
    [15, 'Registers', 'Size: up to 10 MB per file.', 'Larger files are refused.'],
    [16, 'Reply letters', 'PDF, Word (.docx) or plain text, up to 15 MB. Attached to one EIU signal. Scanned images without a text layer can be stored but not read.', 'Other formats are refused.'],
    [17, 'All', 'GSTINs must match across files: a register row should refer to a taxpayer whose returns workbook is loaded (the master may also list counterparties).', 'Rows for unknown taxpayers are kept but cannot be linked to returns.'],
  ], [4, 18, 110, 70]);

  add('Other sources', [
    ['Data source', 'Fields the rules need', 'Rule modules that use it', 'Status'],
    ...matrixSources.map((s) => [s.source, s.fields, s.modules, coverageOf(s.source)]),
    [],
    ['From the rule matrix\'s Data Sources sheet. Rules that need sources marked "Not ingested yet" show as "Needs books" in the platform.'],
  ], [34, 70, 24, 30]);

  wb.Props = { Title: 'GST Intelligence - input file format guide (sample data)', Author: 'GST Intelligence sample generator', CreatedDate: CREATED };
  return wb;
}

// ------------------------------------------------------------------ write
const write = (rel, wb) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true })); return f; };
const matrixWb = XLSX.read(fs.readFileSync(path.join(root, 'data', 'GST_Scrutiny_Rule_Matrix.xlsx')), { type: 'buffer' });

fs.mkdirSync(OUT, { recursive: true });
write(`1 Returns/${returnsFile}`, buildReturns());
const regs = registerRows();
for (const type of Object.keys(REGISTERS)) write(`2 Registers/${type}.xlsx`, registerBook(type, regs[type]));
fs.mkdirSync(path.join(OUT, '3 Reply letters'), { recursive: true });
fs.writeFileSync(path.join(OUT, '3 Reply letters', 'EIU-SAMPLE-0001 reply.pdf'), letter());
write('00 READ ME - Format guide.xlsx', guideBook(parseMatrixExtras(matrixWb).dataSources));
console.log(`Wrote the sample pack to ${path.relative(root, OUT) || OUT}`);
