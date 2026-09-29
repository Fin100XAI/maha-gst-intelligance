// Parses a "Get Download All Report" GST workbook (SheetJS workbook object) into a
// normalised taxpayer object. Pure: works in Node (build script) and in the browser (upload).
import * as XLSX from 'xlsx';
import { cleanName } from './names.js';

export const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const MONTH_IDX = Object.fromEntries(MONTHS.map((m, i) => [m, i]));

export const STATE_CODES = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand',
  '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya',
  '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory', '96': 'Foreign Country',
};

const normState = (s) => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '').replace('and', '');
const STATE_BY_NAME = Object.fromEntries(Object.entries(STATE_CODES).map(([c, n]) => [normState(n), c]));
export const stateCodeOf = (name) => {
  if (!name) return null;
  const m = String(name).match(/^(\d{2})/);
  if (m) return m[1];
  const k = normState(name);
  if (STATE_BY_NAME[k]) return STATE_BY_NAME[k];
  if (k.includes('daman') || k.includes('dadra')) return '26';
  if (k.includes('andaman')) return '35';
  if (k.includes('jammu')) return '01';
  return null;
};

export const num = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// Excel serial or "dd-mm-yyyy" / "dd/mm/yyyy" string -> "YYYY-MM-DD" (UTC, no timezone drift)
export const toISO = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    if (v < 20000 || v > 80000) return null; // not a plausible date serial
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000));
    return d.toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const m = String(v).trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const m2 = String(v).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m2 ? m2[0] : null;
};

// Read a report sheet: skip the 4-line banner, find the header row, return keyed objects.
function readSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  const hIdx = grid.findIndex((r) => r && r.some((c) => c === 'Month') && r.filter((c) => c !== null).length > 3);
  if (hIdx < 0) return [];
  const seen = {};
  const header = grid[hIdx].map((h) => {
    if (h === null) return null;
    const k = String(h).trim();
    seen[k] = (seen[k] || 0) + 1;
    return seen[k] > 1 ? `${k}#${seen[k]}` : k;
  });
  const out = [];
  for (const r of grid.slice(hIdx + 1)) {
    const o = {};
    header.forEach((h, i) => { if (h) o[h] = r[i]; });
    if (!(o.Month in MONTH_IDX)) continue; // drops totals / blank trailer rows
    o._m = MONTH_IDX[o.Month];
    out.push(o);
  }
  return out;
}

const pick = (o, ...keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return null; };
const tax = (o) => ({
  igst: num(pick(o, 'IGST Amount', 'Integrated Tax', 'Integrated Tax Amount', 'IGST')),
  cgst: num(pick(o, 'CGST Amount', 'Central Tax', 'Central Tax Amount')),
  sgst: num(pick(o, 'SGST Amount', 'State/UT Tax', 'State/ UT Tax Amount')),
  cess: num(pick(o, 'CESS Amount', 'Cess Amount', 'Cess', 'Cess Tax Amount')),
});
const tt = (t) => t.igst + t.cgst + t.sgst + t.cess;
const yes = (v) => /^y/i.test(String(v ?? ''));

function meta(wb) {
  const first = wb.Sheets[wb.SheetNames.find((n) => n.startsWith('GSTR3B')) || wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(first, { header: 1, raw: true, defval: null }).slice(0, 5);
  const find = (label) => {
    for (const r of grid) {
      const i = r.findIndex((c) => typeof c === 'string' && c.startsWith(label));
      if (i >= 0) return r[i + 1];
    }
    return null;
  };
  return { name: String(find('Company Name') ?? '').trim(), gstin: String(find('Company GSTN') ?? '').trim(), fy: String(find('Return Period') ?? '').replace(/\s/g, '') };
}

export function parseWorkbook(wb, fileName = '') {
  const m = meta(wb);
  const fyStart = parseInt(m.fy.slice(0, 4), 10) || 2025;
  // ---------- GSTR-3B ----------
  const supRows = readSheet(wb, 'GSTR3B_Supplies');
  const periods = [...new Set(supRows.map((r) => r._m))].sort((a, b) => a - b);
  const g3b = {};
  const blank = () => ({ taxable: 0, igst: 0, cgst: 0, sgst: 0, cess: 0 });
  for (const p of periods) {
    g3b[p] = { out: blank(), zero: blank(), nil: 0, rcm: blank(), nonGst: 0, itc: {}, pay: { liability: 0, cash: 0, itcUsed: 0, rcmLiability: 0, rcmCash: 0, interest: 0, lateFee: 0 }, interest: 0, lateFee: 0 };
  }
  for (const r of supRows) {
    const d = g3b[r._m]; const n = String(r['Nature of Supplies'] || '');
    const v = { taxable: num(r['Total Taxable Value']), ...tax(r) };
    const add = (dst) => { for (const k in v) dst[k] += v[k]; };
    if (n.startsWith('(a)')) add(d.out); else if (n.startsWith('(b)')) add(d.zero);
    else if (n.startsWith('(c)')) d.nil += v.taxable; else if (n.startsWith('(d)')) add(d.rcm);
    else if (n.startsWith('(e)')) d.nonGst += v.taxable;
  }
  const itcKey = (s) => {
    s = String(s || '');
    const sec = /\(1\) Import of goods/.test(s) ? 'A1' : /\(2\) Import of Services/.test(s) ? 'A2' : /\(3\) Inward Supplies liable/.test(s) ? 'A3'
      : /\(4\) Inward supplies from ISD/.test(s) ? 'A4' : /\(5\) All other ITC/.test(s) ? 'A5' : /rules 38,42/.test(s) ? 'B1'
      : /Others ITC Reversed/.test(s) ? 'B2' : /^\(C\) Net ITC/.test(s.trim()) ? 'C' : /ITC reclaimed/.test(s) ? 'D1' : /Ineligible ITC under section 16\(4\)/.test(s) ? 'D2' : null;
    return sec;
  };
  for (const r of readSheet(wb, 'GSTR3B_ITC')) {
    const k = itcKey(r.Details);
    if (!k || !g3b[r._m]) continue;
    g3b[r._m].itc[k] = tt(tax(r));
  }
  for (const r of readSheet(wb, 'GSTR3B_PaymentofTax')) {
    const d = g3b[r._m]; if (!d) continue;
    d.pay.liability += num(r['Other than reverse charge Tax payable']);
    d.pay.itcUsed += num(r['Integrated Tax']) + num(r['Centarl Tax']) + num(r['State/UT Tax']) + num(r.Cess);
    d.pay.cash += num(r['Other than reverse charge Tax to be paid in Cash']);
    d.pay.rcmLiability += num(r['Reverse charge Tax payable']);
    d.pay.rcmCash += num(r['Reverse charge Tax to be paid in Cash']);
    d.pay.interest += num(r['Interest to be paid in cash']);
    d.pay.lateFee += num(r['Late Fee to be paid in cash']);
  }
  for (const r of readSheet(wb, 'GSTR3B_InterestLateFees')) {
    const d = g3b[r._m]; if (!d) continue;
    const v = num(r['Integrated Tax']) + num(r['Centarl Tax']) + num(r['State/UT Tax']) + num(r.Cess);
    if (/interest/i.test(r.Description)) d.interest += v; else d.lateFee += v;
  }

  // ---------- GSTR-1 ----------
  const inv = (r, kind) => {
    const t = tax(r);
    return {
      m: r._m, kind, gstin: String(pick(r, 'GSTIN/UIN', 'GSTIN/UIN of Recipient') || '').trim().toUpperCase(), party: cleanName(pick(r, 'Party Name')),
      no: String(pick(r, 'Invoice No', 'Debit Note/ credit note/ Refund voucher No.') ?? '').trim(), date: toISO(pick(r, 'Invoice Date', 'Debit Note/ credit note/ Refund voucher Date')),
      value: num(pick(r, 'Invoice Value', 'Note/Refund Voucher Value')), rate: num(pick(r, 'Rate', 'Rate of Tax')),
      taxable: num(pick(r, 'Total Taxable Value', 'Taxable Value')), ...t, tax: tt(t), pos: pick(r, 'Place Of Supply', 'Place of Supply', 'Place of supply') || '',
      rc: yes(r['Reverse Charge']), irn: !!pick(r, 'IRN No'),
    };
  };
  const b2b = readSheet(wb, 'GSTR1_B2B').map((r) => inv(r, 'B2B'));
  const b2cl = readSheet(wb, 'GSTR1_B2CL').map((r) => inv(r, 'B2CL'));
  const b2cs = readSheet(wb, 'GSTR1_B2CS').map((r) => ({ ...inv(r, 'B2CS'), supplyType: r['Supply Type'] }));
  const cdn = readSheet(wb, 'GSTR1_CDN').map((r) => ({ ...inv(r, 'CDN'), noteType: /debit/i.test(r['Type of note (Debit/ Credit)']) ? 'D' : 'C', origNo: String(r['Original Invoice No'] ?? '').trim(), origDate: toISO(r['Original Invoice Date']) }));
  const b2ba = readSheet(wb, 'GSTR1_B2B Amendment').map((r) => ({ ...inv(r, 'B2BA'), no: String(r['Revised Invoice No'] ?? ''), origNo: String(r['Original Supplier Invoice No'] ?? ''), date: toISO(r['Revised Invoice Date']) }));
  const hsn = readSheet(wb, 'GSTR1_HSNSummary').map((r) => ({ m: r._m, hsn: String(r.HSN ?? ''), desc: String(r.Description ?? '').trim(), qty: num(r['Total Quantity']), taxable: num(r['Total Taxable Value']), rate: num(r.Rate), ...tax(r) }));
  const docs = readSheet(wb, 'GSTR1_DocIssued').map((r) => ({ m: r._m, nature: r['Nature of Document'], from: r['Sr. No. From'], to: r['Sr. No. To'], total: num(r['Total Number']), cancelled: num(r.Cancelled), net: num(r['Net Issued']) }));
  const nilRated = readSheet(wb, 'GSTR1_NilRated').reduce((s, r) => s + num(r['Nil Rated Supply']) + num(r.Exempted) + num(r['Non GST Supplies']), 0);

  // ---------- GSTR-2B / 2A ----------
  const inward = (r, src) => {
    const t = tax(r);
    return {
      m: r._m, src, gstin: String(pick(r, 'GSTIN of supplier') || '').trim().toUpperCase(), party: cleanName(pick(r, 'Trade/Legal name', 'Name of Party')),
      no: String(pick(r, 'Invoice number', 'Invoice No.', 'Note number') ?? '').trim(), date: toISO(pick(r, 'Invoice Date', 'Note date')),
      value: num(pick(r, 'Invoice Value', 'Note Value')), rate: num(r.Rate), taxable: num(r['Taxable Value']), ...t, tax: tt(t),
      pos: pick(r, 'Place of supply', 'Place of supply (Name of State)') || '', rc: yes(pick(r, 'Supply Attract Reverse Charge', 'Reverse Charge')),
      itcAvail: r['ITC Availability'] === undefined ? true : yes(r['ITC Availability']), reason: r.Reason ?? null,
      g1FiledOn: toISO(r['GSTR-1/5 Filing Date']), supplier3B: r['GSTR-3B Filing Status'] === undefined ? null : yes(r['GSTR-3B Filing Status']),
      noteType: /debit/i.test(String(pick(r, 'Note type', 'Type of note (Debit/ Credit)') ?? '')) ? 'D' : 'C',
      docType: String(pick(r, 'Invoice type', 'Note type') ?? '').trim(),
    };
  };
  const g2b = readSheet(wb, 'GSTR2B_B2B').map((r) => inward(r, '2B')).filter((r) => r.gstin);
  const g2bCdn = readSheet(wb, 'GSTR2B_CDNR').map((r) => inward(r, '2B-CDN')).filter((r) => r.gstin);
  // 2B amendments: the first 'Invoice number' / 'Invoice Date' columns are the original, the second the revised
  const g2bAmend = readSheet(wb, 'GSTR2B_B2BA').map((r) => ({ m: r._m, gstin: String(r['GSTIN of supplier'] || '').trim().toUpperCase(), origNo: String(r['Invoice number'] ?? '').trim(),
    origDate: toISO(r['Invoice Date']), no: String(r['Invoice number#2'] ?? '').trim(), date: toISO(r['Invoice date']), taxable: num(r['Taxable Value']) })).filter((r) => r.gstin);
  const g2bIsd = readSheet(wb, 'GSTR2B_ISD').map((r) => ({ m: r._m, tax: tt(tax(r)) }));
  // Bills of entry: 2B IMPG/IMPGSEZ plus 2A ICEGATE feed, de-duplicated on BoE number
  const boeMap = new Map();
  for (const r of [...readSheet(wb, 'GSTR2B_IMPG'), ...readSheet(wb, 'GSTR2B_IMPGSEZ'), ...readSheet(wb, 'GSTR2A_IMPGOS')]) {
    const boe = String(r.Number ?? '').trim();
    if (!boe || boeMap.has(boe)) continue;
    boeMap.set(boe, { m: r._m, taxable: num(r['Taxable Value']), igst: num(pick(r, 'Integrated Tax', 'IGST')) + num(pick(r, 'Cess', 'CESS')), boe, date: toISO(r.Date) });
  }
  const g2bImpg = [...boeMap.values()];
  const g2a = readSheet(wb, 'GSTR2A_B2B').map((r) => inward(r, '2A')).filter((r) => r.gstin);
  const g2aCdn = readSheet(wb, 'GSTR2A_CDN').map((r) => ({ ...inward(r, '2A-CDN'), gstin: String(r['GSTIN/UIN of Recipient'] || '').toUpperCase(), party: r['Party Name'] || '', no: String(r['Debit Note/ credit note/ Refund voucher No.'] ?? '') })).filter((r) => r.gstin);
  const tdsCredits = readSheet(wb, 'GSTR2A_TDS').map((r) => ({ m: r._m, deductor: String(r['GSTIN of Debuctor'] || '').toUpperCase(), base: num(r['Amount paid to deductee on which tax is deducted']), tax: tt(tax(r)) }));
  const tcsCredits = readSheet(wb, 'GSTR-7 TCS').map((r) => ({ m: r._m, collector: r['Name of Collector'], gross: num(r['Gross value']), returned: num(r['Supplies returned']), net: num(r['Net value']), tax: tt(tax(r)) }));
  const isd6a = readSheet(wb, 'GSTR6A_B2B').map((r) => ({ m: r._m, tax: tt(tax(r)), taxable: num(r['Taxable Value']) }));

  // ---------- Ledgers & challans ----------
  const amt = (r) => num(r['Amount (Dr/Cr) Integrated Tax']) + num(r['Amount (Dr/Cr) Central Tax']) + num(r['Amount (Dr/Cr) State Tax']) + num(r['Amount (Dr/Cr) Cess']);
  const liability = readSheet(wb, 'LiabilityLedger').map((r) => ({ m: r._m, date: toISO(r.Date), desc: r.Description, type: r['Transaction Type (Debit/Credit)'], amount: amt(r), usedFrom: r['Larger Used For discharging liability'] }));
  const cashLedger = readSheet(wb, 'CashLedger').map((r) => ({ m: r._m, date: toISO(r['Date of Deposit/Debit']), desc: r.Description, type: r['Transaction Type (Debit/Credit)'], amount: amt(r) }));
  const creditLedger = readSheet(wb, 'CreditLedger').map((r) => ({ m: r._m, date: toISO(r['Date of Deposit/Debit']), desc: r.Description, type: r['Transaction Type (Debit/Credit)'], amount: amt(r) }));
  const challans = readSheet(wb, 'Challan').map((r) => ({ m: r._m, cpin: String(r.CPIN ?? ''), created: toISO(r['Created On']), amount: num(r.Amount), mode: r.Mode, status: String(r['Deposit Status'] ?? '').toUpperCase(), deposited: toISO(r['Deposit Date']) }));

  const nameFromFile = fileName.replace(/\.xlsx?$/i, '').replace(/get download|all report/gi, '').replace(m.gstin, '').replace(/\d{4}\s*-\s*\d{4}/, '').replace(/[_]+/g, ' ').trim()
    .replace(/^(?:SYN|TEST)\s+/i, ''); // file-name marker for generated workbooks, not part of the name
  const name = cleanName(m.name || nameFromFile || m.gstin);
  return {
    id: m.gstin || fileName, fileName, name, nameFromBanner: !!m.name, gstin: m.gstin, fy: m.fy, fyStart, stateCode: m.gstin.slice(0, 2), pan: m.gstin.slice(2, 12),
    periods, g3b, b2b, b2cl, b2cs, cdn, b2ba, hsn, docs, nilRated, g2b, g2bCdn, g2bAmend, g2bIsd, g2bImpg, g2a, g2aCdn, tdsCredits, tcsCredits, isd6a,
    liability, cashLedger, creditLedger, challans, sheets: wb.SheetNames,
    created: toISO(wb.Props?.CreatedDate ?? null), // workbook creation date: when the extract was downloaded
  };
}

// Rule matrix workbook -> industry applicability, client flags and the data-source register
export function parseMatrixExtras(wb) {
  const grid = (name) => (wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null }) : []);
  const [ah, ...arows] = grid('Applicability');
  const industries = (ah || []).slice(4).filter(Boolean);
  const applicability = {};
  for (const r of arows) {
    if (!r[0] || !/^[A-L]-\d+/.test(r[0])) continue;
    applicability[r[0]] = { flag: r[3] || null, industries: industries.filter((_, i) => String(r[4 + i] ?? '').toUpperCase() === 'Y') };
  }
  const [, ...drows] = grid('Data Sources');
  const dataSources = drows.filter((r) => r[0]).map((r) => ({ source: noEmDash(r[0]), fields: noEmDash(r[1]), modules: noEmDash(r[2]) }));
  return { industries, applicability, dataSources };
}

// Visible text never shows em dashes: " — " becomes ": ", a lone dash placeholder becomes "-".
export const noEmDash = (v) => (typeof v === 'string' ? v.replace(/\s+\u2014\s+/g, ': ').replace(/\u2014/g, '-') : v);

// Rule matrix workbook -> catalog array
export function parseRuleMatrix(wb) {
  const ws = wb.Sheets['Rule Matrix'];
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const [h, ...rows] = grid;
  const idx = (k) => h.indexOf(k);
  return rows.filter((r) => r[0] && /^[A-L]-\d+/.test(r[0])).map((r) => ({
    id: r[0], module: noEmDash(r[idx('Module')]), check: noEmDash(r[idx('Check')]), legal: noEmDash(r[idx('Legal Reference')]), sources: noEmDash(r[idx('Data Sources')]),
    logic: noEmDash(r[idx('Logic / Test')]), threshold: noEmDash(r[idx('Threshold')]), severity: r[idx('Severity')], basis: noEmDash(r[idx('Exposure Basis')]), action: noEmDash(r[idx('Action')]),
  }));
}
