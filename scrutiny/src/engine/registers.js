// Registers the returns download does not contain: EIU risk signals, revenue targets, demands and recoveries.
// Each register is declared once (columns, types, rules); parseRegister() validates a whole upload and reports every
// problem at once, so an officer can fix a file in one pass. Pure and dependency-free (runs in browser and server).
import { gstinValid } from './gstin.js';
import { cleanName } from './names.js';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// ------------------------------------------------------------------ value types: parse(raw) -> value, or throw a reason
const blank = (v) => v === null || v === undefined || String(v).trim() === '';
const TYPES = {
  text: (v) => String(v).trim(),
  name: (v) => cleanName(v),
  gstin: (v) => {
    const g = String(v).trim().toUpperCase();
    if (gstinValid(g) !== true) throw new Error('is not a valid GSTIN (format or check digit)');
    return g;
  },
  fy: (v) => {
    const m = String(v).trim().match(/^(20\d{2})\s*-\s*(?:20)?(\d{2})$/);
    if (!m || (Number(m[1]) + 1) % 100 !== Number(m[2])) throw new Error('must be a financial year like 2025-26');
    return `${m[1]}-${m[2]}`;
  },
  month: (v) => {
    const t = String(v).trim().slice(0, 3).toLowerCase();
    const i = MONTHS.findIndex((m) => m.toLowerCase() === t);
    if (i < 0) throw new Error('must be a month (Apr to Mar)');
    return MONTHS[i];
  },
  amount: (v) => {
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[₹,\s]/g, ''));
    if (!Number.isFinite(n) || n < 0) throw new Error('must be a non-negative amount');
    return Math.round(n * 100) / 100;
  },
  date: (v) => {
    if (typeof v === 'number' && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000)).toISOString().slice(0, 10);
    const s = String(v).trim();
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    const iso = ymd ? s : dmy ? `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}` : null;
    // Reject impossible calendar dates such as 31-02-2025 (Date would silently roll them over) and month 13.
    const d = iso ? new Date(`${iso}T00:00:00Z`) : null;
    if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) throw new Error('must be a date (DD-MM-YYYY or YYYY-MM-DD)');
    return iso;
  },
  ruleId: (v) => {
    const s = String(v).trim().toUpperCase();
    if (!/^[A-K]-\d{2}$/.test(s)) throw new Error('must be a rule ID like B-01');
    return s;
  },
};
const oneOf = (values) => (v) => {
  const s = String(v).trim();
  const hit = values.find((x) => x.toLowerCase() === s.toLowerCase());
  if (!hit) throw new Error(`must be one of: ${values.join(', ')}`);
  return hit;
};

// ------------------------------------------------------------------ the registers
// col(key, label, type, { required, example })
const col = (key, label, type, opts = {}) => ({ key, label, type, required: opts.required !== false, example: opts.example ?? '' });

// Case action register vocabulary: the lifecycle events and the closure outcomes.
export const CASE_EVENTS = ['selected', 'assigned', 'notice', 'reply', 'hearing', 'scn', 'order', 'payment', 'appeal', 'recovery', 'closed', 'reopened'];
export const CASE_OUTCOMES = ['paid-voluntary', 'demand-confirmed', 'explained', 'no-issue', 'data-insufficient', 'referred', 'procedural'];

export const REGISTERS = {
  master: {
    title: 'Taxpayer master',
    purpose: 'GSTIN master: jurisdiction, officer, sector, registration date and status. Drives jurisdiction views and registration-status checks on counterparties.',
    key: 'gstin',
    columns: [
      col('gstin', 'gstin', TYPES.gstin, { example: '27ZZKPK7730D1ZM' }),
      col('legalName', 'legal_name', TYPES.name, { example: 'KONKAN STEEL TRADERS' }),
      col('jurisdiction', 'jurisdiction', TYPES.text, { example: 'SYN-PUNE-01' }),
      col('range', 'range', TYPES.text, { required: false, example: 'Range 2' }),
      col('officer', 'officer', TYPES.text, { required: false, example: 'Priya M.' }),
      col('sector', 'sector', TYPES.text, { required: false, example: 'Steel trading' }),
      col('registrationDate', 'registration_date', TYPES.date, { example: '01-07-2017' }),
      col('status', 'status', oneOf(['Active', 'Suspended', 'Cancelled']), { example: 'Active' }),
      col('statusDate', 'status_date', TYPES.date, { required: false }),
    ],
  },
  eiu: {
    title: 'EIU risk signals',
    purpose: 'Risk signals received from the Enforcement / Intelligence Unit, kept exactly as received and revalidated against the latest returns.',
    key: 'signalId',
    columns: [
      col('signalId', 'signal_id', TYPES.text, { example: 'EIU-2025-0142' }),
      col('gstin', 'gstin', TYPES.gstin, { example: '27ZZKPK7730D1ZM' }),
      col('parameter', 'risk_parameter', TYPES.text, { example: 'ITC availed in excess of GSTR-2B' }),
      col('ruleId', 'rule_id', TYPES.ruleId, { required: false, example: 'B-01' }),
      col('fy', 'fy', TYPES.fy, { example: '2024-25' }),
      col('amount', 'amount', TYPES.amount, { example: '640000' }),
      col('signalDate', 'signal_date', TYPES.date, { example: '15-08-2025' }),
      col('priority', 'priority', oneOf(['High', 'Medium', 'Low']), { required: false, example: 'High' }),
      col('source', 'source', TYPES.text, { required: false, example: 'EIU monthly risk run' }),
      col('remarks', 'remarks', TYPES.text, { required: false }),
    ],
  },
  targets: {
    title: 'Revenue targets',
    purpose: 'Department-approved collection targets by jurisdiction, versioned. Targets are administrative goals, never a taxpayer liability.',
    key: (r) => `${r.jurisdiction}|${r.fy}|${r.month || 'FY'}|${r.version}`,
    keyLabel: 'same jurisdiction, year, month and version',
    columns: [
      col('jurisdiction', 'jurisdiction', TYPES.text, { example: 'ward-27' }),
      col('fy', 'fy', TYPES.fy, { example: '2025-26' }),
      col('month', 'month', TYPES.month, { required: false, example: 'Apr' }),
      col('target', 'target_amount', TYPES.amount, { example: '125000000' }),
      col('version', 'version', TYPES.text, { example: 'v1' }),
      col('approvedOn', 'approved_on', TYPES.date, { required: false, example: '01-04-2025' }),
      col('basis', 'basis', TYPES.text, { required: false, example: 'Prior-year collection + 12%' }),
    ],
  },
  demands: {
    title: 'Demands and recoveries',
    purpose: 'Established demands and what has been paid or recovered, by stage. Kept separate from computed exposure.',
    key: 'demandId',
    columns: [
      col('demandId', 'demand_id', TYPES.text, { example: 'DRC07-2025-0031' }),
      col('gstin', 'gstin', TYPES.gstin, { example: '27ZZKPK7730D1ZM' }),
      col('caseRef', 'case_ref', TYPES.text, { required: false, example: 'ASMT-10/WARD-27/ZZKPK/20251015' }),
      col('fy', 'fy', TYPES.fy, { example: '2024-25' }),
      col('section', 'section', oneOf(['73', '74', '74A', '76', '122', 'Other']), { example: '73' }),
      col('orderDate', 'order_date', TYPES.date, { example: '20-01-2026' }),
      col('tax', 'demand_tax', TYPES.amount, { example: '540000' }),
      col('interest', 'demand_interest', TYPES.amount, { required: false, example: '48600' }),
      col('penalty', 'demand_penalty', TYPES.amount, { required: false, example: '54000' }),
      col('paid', 'paid_to_date', TYPES.amount, { required: false, example: '200000' }),
      col('lastPaymentDate', 'last_payment_date', TYPES.date, { required: false, example: '15-03-2026' }),
      col('stage', 'stage', oneOf(['Appeal period', 'Under appeal', 'Stayed', 'Recovery', 'Instalments', 'Paid', 'Closed']), { example: 'Recovery' }),
      col('blocker', 'blocker', TYPES.text, { required: false, example: 'Bank account attachment pending' }),
    ],
  },
  caselog: {
    title: 'Case action register',
    purpose: 'Every step of every case as the case-management system records it (selection, notice, reply, hearing, show cause, order, payment, appeal, recovery, closure). Drives the action funnel, action yield, effort and outcome learning.',
    key: (r) => `${r.caseId}|${r.event}|${r.date}|${r.ref || ''}|${r.amount ?? ''}`,
    keyLabel: 'same case, event, date, reference and amount',
    columns: [
      col('caseId', 'case_id', TYPES.text, { example: 'SCR-2025-021' }),
      col('gstin', 'gstin', TYPES.gstin, { example: '27ZZKPK7730D1ZM' }),
      col('fy', 'fy', TYPES.fy, { required: false, example: '2024-25' }),
      col('source', 'source', oneOf(['EIU', 'Scrutiny', 'Audit', 'Return risk', 'Platform', 'Other']), { required: false, example: 'Scrutiny' }),
      col('riskType', 'risk_type', TYPES.text, { required: false, example: 'ITC mismatch (B-01)' }),
      col('signalId', 'signal_id', TYPES.text, { required: false, example: 'EIU-2025-0142' }),
      col('event', 'event', oneOf(CASE_EVENTS), { example: 'notice' }),
      col('date', 'date', TYPES.date, { example: '15-10-2025' }),
      col('amount', 'amount', TYPES.amount, { required: false, example: '540000' }),
      col('officer', 'officer', TYPES.text, { required: false, example: 'Priya M.' }),
      col('ref', 'ref', TYPES.text, { required: false, example: 'ASMT-10/WARD-27/ZZKPK/20251015' }),
      col('outcome', 'outcome', oneOf(CASE_OUTCOMES), { required: false, example: 'paid-voluntary' }),
      col('reason', 'reason', TYPES.text, { required: false, example: 'declared in a later return' }),
      col('note', 'note', TYPES.text, { required: false }),
    ],
  },
};

const normHeader = (h) => String(h ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/**
 * Validate an uploaded register.
 * @param {keyof REGISTERS} type
 * @param {object[]} rows  one object per data row, keyed by the file's header text
 * @returns {{ records: object[], errors: string[] }}  records only when there are no errors
 */
export function parseRegister(type, rows) {
  const def = REGISTERS[type];
  if (!def) return { records: [], errors: [`Unknown register type: ${type}`] };
  const errors = [];
  if (!rows.length) return { records: [], errors: ['The file has no data rows'] };
  const present = new Set(Object.keys(rows[0]).map(normHeader));
  const missing = def.columns.filter((c) => c.required && !present.has(c.label)).map((c) => c.label);
  if (missing.length) return { records: [], errors: [`Missing column(s): ${missing.join(', ')}. Download the template for the expected layout.`] };

  const records = [];
  const seen = new Map();
  rows.forEach((raw, i) => {
    const row = Object.fromEntries(Object.entries(raw).map(([k, v]) => [normHeader(k), v]));
    if (Object.values(row).every(blank)) return; // skip empty lines
    const line = i + 2; // header is line 1
    const rec = {};
    for (const c of def.columns) {
      const v = row[c.label];
      if (blank(v)) { if (c.required) errors.push(`Row ${line}: ${c.label} is required`); continue; }
      try { rec[c.key] = c.type(v); } catch (e) { errors.push(`Row ${line}: ${c.label} "${String(v).slice(0, 40)}" ${e.message}`); }
    }
    const key = typeof def.key === 'function' ? def.key(rec) : rec[def.key];
    if (key && seen.has(key)) errors.push(`Row ${line}: duplicate of row ${seen.get(key)} (${typeof def.key === 'string' ? def.columns.find((c) => c.key === def.key).label : def.keyLabel})`);
    else if (key) seen.set(key, line);
    records.push(rec);
  });
  if (type === 'caselog') {
    records.forEach((r, i) => { if (r.event === 'closed' && !r.outcome) errors.push(`Row ${i + 2}: a closed event needs an outcome`); });
  }
  if (type === 'demands') {
    records.forEach((r, i) => {
      const total = (r.tax || 0) + (r.interest || 0) + (r.penalty || 0);
      if ((r.paid || 0) > total + 1) errors.push(`Row ${i + 2}: paid_to_date exceeds the total demand`);
    });
  }
  return errors.length ? { records: [], errors } : { records, errors: [] };
}

/** A CSV template with the header and one example row, for officers to fill in. */
export function registerTemplate(type) {
  const cols = REGISTERS[type].columns;
  const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return `${cols.map((c) => c.label).join(',')}\n${cols.map((c) => esc(String(c.example))).join(',')}\n`;
}
