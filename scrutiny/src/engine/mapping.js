// Column mapping: returns data in another layout (a CSV from accounting software, a GSTR-2B Excel downloaded on its
// own) brought into the prescribed template, one sheet at a time. The officer says what the file holds and which of
// its columns is which; columns are suggested from their names; every value is converted to the template's form, and
// what cannot be converted is counted and named, never guessed. Pure: shared by the browser (preview) and the server.
import { MONTHS } from './parse.js';
import { gstinValid } from './gstin.js';

const F = (key, label, type, synonyms = [], required = false) => ({ key, label, type, synonyms, required });
const TAX_FIELDS = (igst, cgst, sgst, cess) => [
  F(igst, 'IGST', 'money', ['igst', 'integrated tax', 'iamt', 'igst amount', 'integrated tax amount']),
  F(cgst, 'CGST', 'money', ['cgst', 'central tax', 'camt', 'cgst amount', 'central tax amount']),
  F(sgst, 'SGST / UTGST', 'money', ['sgst', 'utgst', 'state tax', 'state/ut tax', 'samt', 'sgst amount', 'state ut tax amount']),
  F(cess, 'Cess', 'money', ['cess', 'csamt', 'cess amount']),
];
const MONTH_FIELD = (required) => F('Month', 'Return period (month)', 'month', ['month', 'return period', 'tax period', 'period', 'ret period', 'fp', 'filing period'], required);

/** What a file can hold: each is one sheet of the "Get Download All Report" template, with its exact headers. */
export const TARGETS = {
  GSTR2B_B2B: {
    label: 'GSTR-2B: invoices from suppliers (B2B)', report: 'GSTR2B B2B', monthFrom: 'Invoice Date',
    fields: [
      MONTH_FIELD(false),
      F('GSTIN of supplier', 'Supplier GSTIN', 'gstin', ['gstin of supplier', 'supplier gstin', 'ctin', 'vendor gstin', 'supplier gst no', 'gstin'], true),
      F('Trade/Legal name', 'Supplier name', 'text', ['trade/legal name', 'trade name', 'legal name', 'supplier name', 'party name', 'vendor name', 'name of party']),
      F('Invoice number', 'Invoice number', 'text', ['invoice number', 'invoice no', 'inv no', 'inum', 'document number', 'bill no'], true),
      F('Invoice type', 'Invoice type', 'text', ['invoice type', 'inv type', 'type']),
      F('Invoice Date', 'Invoice date', 'date', ['invoice date', 'inv date', 'idt', 'document date', 'bill date'], true),
      F('Invoice Value', 'Invoice value', 'money', ['invoice value', 'inv value', 'val', 'total invoice value', 'bill amount', 'bill value', 'invoice amount']),
      F('Place of supply', 'Place of supply', 'text', ['place of supply', 'pos']),
      F('Supply Attract Reverse Charge', 'Reverse charge', 'yesno', ['supply attract reverse charge', 'reverse charge', 'rcm', 'rev']),
      F('Rate', 'Tax rate (%)', 'number', ['rate', 'tax rate', 'gst rate', 'rt']),
      F('Taxable Value', 'Taxable value', 'money', ['taxable value', 'txval', 'taxable amount', 'assessable value'], true),
      ...TAX_FIELDS('Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'),
      F('GSTR-1/5 Filing Date', 'Supplier\'s GSTR-1 filing date', 'date', ['gstr-1/5 filing date', 'gstr1 filing date', 'filing date', 'supfildt']),
      F('ITC Availability', 'ITC available', 'yesno', ['itc availability', 'itc available', 'itcavl', 'eligible for itc', 'itc eligible', 'itc eligibility', 'eligible itc']),
      F('Reason', 'Reason ITC not available', 'text', ['reason', 'rsn']),
    ],
  },
  GSTR2A_B2B: {
    label: 'GSTR-2A: invoices from suppliers (B2B)', report: 'GSTR2A B2B', monthFrom: 'Invoice Date',
    fields: [
      MONTH_FIELD(false),
      F('GSTIN of supplier', 'Supplier GSTIN', 'gstin', ['gstin of supplier', 'supplier gstin', 'ctin', 'vendor gstin', 'gstin'], true),
      F('Name of Party', 'Supplier name', 'text', ['name of party', 'party name', 'supplier name', 'trade/legal name', 'trade name']),
      F('Invoice No.', 'Invoice number', 'text', ['invoice no', 'invoice number', 'inv no', 'inum', 'bill no'], true),
      F('Invoice Date', 'Invoice date', 'date', ['invoice date', 'inv date', 'idt', 'bill date'], true),
      F('Invoice Value', 'Invoice value', 'money', ['invoice value', 'inv value', 'val', 'bill amount', 'bill value', 'invoice amount']),
      F('Rate', 'Tax rate (%)', 'number', ['rate', 'tax rate', 'gst rate']),
      F('Taxable Value', 'Taxable value', 'money', ['taxable value', 'txval', 'taxable amount'], true),
      ...TAX_FIELDS('Integrated Tax Amount', 'Central Tax Amount', 'State/ UT Tax Amount', 'Cess Tax Amount'),
      F('Place of supply (Name of State)', 'Place of supply', 'text', ['place of supply', 'pos']),
      F('Reverse Charge', 'Reverse charge', 'yesno', ['reverse charge', 'rcm']),
      F('Invoice Type', 'Invoice type', 'text', ['invoice type', 'inv type']),
      F('GSTR-1/5 Filing Date', 'Supplier\'s GSTR-1 filing date', 'date', ['gstr-1/5 filing date', 'filing date']),
      F('GSTR-3B Filing Status', 'Supplier filed GSTR-3B', 'yesno', ['gstr-3b filing status', '3b filed', 'gstr3b status']),
    ],
  },
  GSTR1_B2B: {
    label: 'GSTR-1: invoices to registered buyers (B2B)', report: 'GSTR1 B2B', monthFrom: 'Invoice Date',
    fields: [
      MONTH_FIELD(false),
      F('GSTIN/UIN', 'Buyer GSTIN', 'gstin', ['gstin/uin', 'gstin of recipient', 'buyer gstin', 'customer gstin', 'recipient gstin', 'ctin', 'gstin'], true),
      F('Party Name', 'Buyer name', 'text', ['party name', 'buyer name', 'customer name', 'receiver name', 'name']),
      F('Invoice No', 'Invoice number', 'text', ['invoice no', 'invoice number', 'inv no', 'inum', 'bill no'], true),
      F('Invoice Date', 'Invoice date', 'date', ['invoice date', 'inv date', 'idt', 'bill date'], true),
      F('Invoice Value', 'Invoice value', 'money', ['invoice value', 'inv value', 'val', 'bill amount', 'bill value', 'invoice amount']),
      F('Rate', 'Tax rate (%)', 'number', ['rate', 'tax rate', 'gst rate']),
      F('Total Taxable Value', 'Taxable value', 'money', ['total taxable value', 'taxable value', 'txval', 'taxable amount'], true),
      ...TAX_FIELDS('IGST Amount', 'CGST Amount', 'SGST Amount', 'CESS Amount'),
      F('Place Of Supply', 'Place of supply', 'text', ['place of supply', 'pos']),
      F('Reverse Charge', 'Reverse charge', 'yesno', ['reverse charge', 'rcm']),
      F('Invoice Type', 'Invoice type', 'text', ['invoice type', 'inv type']),
    ],
  },
  LiabilityLedger: {
    // The ledger's Month is the return period the entry is for, not the posting date: it is never derived.
    label: 'Electronic liability ledger (filing dates)', report: 'Liability Ledger', monthFrom: null,
    fields: [
      MONTH_FIELD(true),
      F('Date', 'Date of entry', 'date', ['date', 'entry date', 'transaction date', 'posting date'], true),
      F('Reference No.', 'Reference number', 'text', ['reference no', 'reference number', 'ref no', 'arn']),
      F('Description', 'Description', 'text', ['description', 'particulars', 'narration'], true),
      F('Transaction Type (Debit/Credit)', 'Debit or credit', 'text', ['transaction type', 'debit/credit', 'dr/cr', 'type'], true),
      ...TAX_FIELDS('Amount (Dr/Cr) Integrated Tax', 'Amount (Dr/Cr) Central Tax', 'Amount (Dr/Cr) State Tax', 'Amount (Dr/Cr) Cess'),
    ],
  },
};

// ------------------------------------------------------------------ suggestions
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** The header row: the first of the first 20 rows with at least three text cells. */
export function findHeaderRow(grid) {
  const i = grid.slice(0, 20).findIndex((r) => (r || []).filter((c) => typeof c === 'string' && c.trim() && !/^\d/.test(c.trim())).length >= 3);
  return Math.max(0, i);
}

/** A stable signature of a file's headers, to remember the officer's mapping for files of the same layout. */
export function signature(headers) {
  let h = 5381;
  for (const ch of headers.map(norm).join('|')) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

/**
 * For each template field, the file column that looks like it (an exact name first, then a close one); each column
 * is used once, required fields first.
 * @returns {Record<string, number|null>} field key -> column index
 */
export function suggestMapping(target, headers) {
  const cols = headers.map(norm);
  const used = new Set();
  const out = {};
  const order = [...target.fields].sort((a, b) => Number(b.required) - Number(a.required));
  const names = (f) => [f.key, f.label, ...f.synonyms].map(norm).filter(Boolean);
  for (const pass of ['exact', 'close']) {
    for (const f of order) {
      if (out[f.key] !== undefined && out[f.key] !== null) continue;
      const i = cols.findIndex((c, j) => !used.has(j) && c && names(f).some((n) => (pass === 'exact' ? c === n : n.length >= 3 && (c.includes(n) || (c.length >= 4 && n.includes(c))))));
      out[f.key] = i >= 0 ? i : null;
      if (i >= 0) used.add(i);
    }
  }
  return out;
}

// ------------------------------------------------------------------ values
const MON3 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const CAL_TO_FY = (calMonth) => MONTHS[(calMonth + 8) % 12]; // calendar month 1..12 -> April-first month name
const pad = (n) => String(n).padStart(2, '0');

/** @returns {{ y: number, m: number, d: number } | null} */
export function parseDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    if (v < 20000 || v > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) return { y: v.getFullYear(), m: v.getMonth() + 1, d: v.getDate() };
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,9})[-/. ,]+(\d{2,4})$/);
  if (m) { const mi = MON3.indexOf(m[2].slice(0, 3).toLowerCase()); return mi < 0 ? null : valid(year(m[3]), mi + 1, +m[1]); }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) return valid(year(m[3]), +m[2], +m[1]); // day first, as written in India
  return null;
}
const year = (y) => (String(y).length === 2 ? 2000 + Number(y) : Number(y));
const valid = (y, m, d) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100 ? { y, m, d } : null);

/** A return period in any common form, as { month: 'April'..'March', y?: calendar year }. */
export function parseMonth(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    if (v >= 1 && v <= 12 && Number.isInteger(v)) return { month: CAL_TO_FY(v) };
    // 042025 read as a number: month then year (an Excel date serial of these years is 4xxxx with a "year" of 5xxx)
    if (v > 10000 && v < 130000 && Number.isInteger(v)) { const mm = Math.floor(v / 10000), yy = v % 10000; if (mm >= 1 && mm <= 12 && yy >= 2017 && yy <= 2100) return { month: CAL_TO_FY(mm), y: yy }; }
    const d = parseDate(v);
    return d ? { month: CAL_TO_FY(d.m), y: d.y } : null;
  }
  const s = String(v).trim();
  const full = MONTHS.find((x) => x.toLowerCase() === s.toLowerCase());
  if (full) return { month: full };
  let m = s.match(/^([A-Za-z]{3,9})[-/ ,'’]*(\d{2,4})?$/);
  if (m) { const mi = MON3.indexOf(m[1].slice(0, 3).toLowerCase()); if (mi >= 0) return { month: CAL_TO_FY(mi + 1), ...(m[2] ? { y: year(m[2]) } : {}) }; }
  m = s.match(/^(\d{2})(\d{4})$/) || s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m && +m[1] >= 1 && +m[1] <= 12) return { month: CAL_TO_FY(+m[1]), y: +m[2] };
  m = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { month: CAL_TO_FY(+m[2]), y: +m[1] };
  const d = parseDate(s);
  return d ? { month: CAL_TO_FY(d.m), y: d.y } : null;
}

/** Amounts as written in Indian statements: ₹ / Rs, lakh commas, (brackets) or a trailing Dr for negatives. */
export function parseAmount(v) {
  if (v === null || v === undefined || v === '') return { ok: true, value: null };
  if (typeof v === 'number') return Number.isFinite(v) ? { ok: true, value: v } : { ok: false };
  let s = String(v).trim().replace(/₹|rs\.?|inr/gi, '').replace(/[,\s]/g, '');
  let sign = 1;
  if (/^\(.*\)$/.test(s)) { sign = -1; s = s.slice(1, -1); }
  if (/^-/.test(s)) { sign = -sign; s = s.slice(1); }
  if (/^[-–]$/.test(s) || s === '') return { ok: true, value: null };
  return /^\d*\.?\d+$/.test(s) ? { ok: true, value: sign * Number(s) } : { ok: false };
}

const yesNo = (v) => { const s = String(v ?? '').trim().toLowerCase(); return ['y', 'yes', 'true', '1'].includes(s) ? 'Yes' : ['n', 'no', 'false', '0'].includes(s) ? 'No' : (v ?? null); };

// ------------------------------------------------------------------ conversion
/**
 * Convert the file's rows into the template sheet.
 * @param {object} target            one of TARGETS
 * @param {any[][]} grid             the file as rows of cells
 * @param {{ headerRow: number, mapping: Record<string, number|null>, fyStart: number }} o
 * @returns {{ header: string[], rows: any[][], read: number, excluded: Record<string, number>, problems: string[], months: Record<string, number> }}
 */
export function convertRows(target, grid, { headerRow, mapping, fyStart }) {
  // Only the columns the file has (and the month): an empty column is not the same as an absent one. The parser
  // reads a missing "ITC Availability" as available, but an empty one as not available.
  const header = target.fields.filter((f) => f.key === 'Month' || (mapping[f.key] !== null && mapping[f.key] !== undefined)).map((f) => f.key);
  const missing = target.fields.filter((f) => f.required && (mapping[f.key] === null || mapping[f.key] === undefined));
  const monthless = target.monthFrom === null ? mapping.Month == null : mapping.Month == null && mapping[target.monthFrom] == null;
  const problems = [];
  if (missing.length) problems.push(`Choose a column for: ${missing.map((f) => f.label).join(', ')}.`);
  if (monthless && !missing.some((f) => f.key === 'Month')) problems.push('Choose a column for the return period (month).');
  if (problems.length) return { header, rows: [], read: 0, excluded: {}, problems, months: {} };

  const excluded = { empty: 0, required: 0, outsideYear: 0, noMonth: 0 };
  const bad = {}; // field label -> count of values that could not be read
  const badGstin = new Set();
  const months = {};
  const rows = [];
  const inYear = (mo, y) => !y || (MONTHS.indexOf(mo) <= 8 ? y === fyStart : y === fyStart + 1); // April..December are fyStart
  for (const r of grid.slice(headerRow + 1)) {
    const cell = (f) => (mapping[f.key] === null || mapping[f.key] === undefined ? null : r?.[mapping[f.key]] ?? null);
    if (!target.fields.some((f) => { const c = cell(f); return c !== null && String(c).trim() !== ''; })) { excluded.empty += 1; continue; }
    const out = {};
    let ok = true;
    for (const f of target.fields) {
      if (f.key === 'Month') continue;
      const raw = cell(f);
      let v = raw;
      if (raw === null || String(raw).trim() === '') v = null;
      else if (f.type === 'money' || f.type === 'number') { const a = parseAmount(raw); if (!a.ok) { bad[f.label] = (bad[f.label] || 0) + 1; v = null; } else v = a.value; }
      else if (f.type === 'date') { const d = parseDate(raw); if (!d) { bad[f.label] = (bad[f.label] || 0) + 1; v = null; } else v = `${pad(d.d)}-${pad(d.m)}-${d.y}`; }
      else if (f.type === 'gstin') { v = String(raw).trim().toUpperCase(); if (gstinValid(v) !== true) badGstin.add(v); }
      else if (f.type === 'yesno') v = yesNo(raw);
      else v = String(raw).trim();
      if (f.required && (v === null || v === '')) ok = false;
      out[f.key] = v;
    }
    if (!ok) { excluded.required += 1; continue; }
    const p = mapping.Month != null ? parseMonth(cell({ key: 'Month' })) : (() => { const d = parseDate(cell(target.fields.find((f) => f.key === target.monthFrom))); return d ? { month: CAL_TO_FY(d.m), y: d.y } : null; })();
    if (!p) { excluded.noMonth += 1; continue; }
    if (!inYear(p.month, p.y)) { excluded.outsideYear += 1; continue; }
    out.Month = p.month;
    months[p.month] = (months[p.month] || 0) + 1;
    rows.push(header.map((k) => out[k] ?? null));
  }
  const fy = `${fyStart}-${String(fyStart + 1).slice(2)}`;
  if (excluded.required) problems.push(`${excluded.required} row(s) left out: a required value is missing or unreadable.`);
  if (excluded.noMonth) problems.push(`${excluded.noMonth} row(s) left out: the return period could not be read.`);
  if (excluded.outsideYear) problems.push(`${excluded.outsideYear} row(s) left out: they belong to another year than FY ${fy}.`);
  for (const [label, n] of Object.entries(bad)) problems.push(`${n} value(s) in "${label}" could not be read and are left blank.`);
  if (badGstin.size) problems.push(`${badGstin.size} GSTIN(s) fail the check digit (kept as given): ${[...badGstin].slice(0, 3).join(', ')}${badGstin.size > 3 ? '…' : ''}.`);
  return { header, rows, read: rows.length, excluded, problems, months };
}

/** The converted rows as a template sheet: the banner the parser reads, then the header and rows. */
export function templateAoa(target, converted, { gstin, fyStart, name = '' }) {
  return [
    ['Company Name : ', name], ['Company GSTN : ', gstin], ['Return Period : ', `${fyStart} - ${fyStart + 1}`], ['Report Name : ', target.report], [],
    converted.header, ...converted.rows,
  ];
}

export const MAX_ROWS = 200000;
