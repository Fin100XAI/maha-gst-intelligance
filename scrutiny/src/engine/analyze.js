// Scrutiny engine: turns a parsed taxpayer into reconciliations, rule results (keyed to the
// GST Scrutiny Rule Matrix IDs), fraud indicators, a risk score and chart-ready series.
import { MONTHS, STATE_CODES, stateCodeOf } from './parse.js';
import { pearson, scoreOf, DEFAULT_SCORING } from './score.js';
import { rule37A } from './verify.js';
import { gstinValid } from './gstin.js';
import { reconcileEwb } from './ewb.js';
import { headsOf, addHeads, subHeads, allocate } from './heads.js';
import { returnDueDate } from './dueDates.js';

export { pearson, portfolio } from './score.js';

const SHORT = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const r0 = (v) => Math.round(v);
const groupBy = (a, k) => a.reduce((m, x) => { const key = typeof k === 'function' ? k(x) : x[k]; (m[key] ||= []).push(x); return m; }, {});
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const fmtL = (v) => {
  const a = Math.abs(v), s = v <= -0.5 ? '−' : ''; // amounts that round to ₹0 carry no sign
  if (a >= 1e7) return `${s}₹${(a / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`;
};

// GSTIN check digit lives in ./gstin.js (dependency-free); re-exported here for existing callers.
export { gstinValid };

const BENFORD = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => Math.log10(1 + 1 / d));
function benford(values) {
  const v = values.filter((x) => x >= 10);
  const counts = Array(9).fill(0);
  for (const x of v) counts[parseInt(String(Math.floor(x))[0], 10) - 1]++;
  const n = v.length;
  const rows = counts.map((c, i) => ({ digit: String(i + 1), observed: n ? c / n : 0, expected: BENFORD[i], count: c }));
  const mad = n ? sum(rows, (r) => Math.abs(r.observed - r.expected)) / 9 : null;
  // Nigrini (2012) first-digit MAD bands
  const verdict = n < 100 ? 'Insufficient sample' : mad < 0.006 ? 'Close conformity' : mad < 0.012 ? 'Acceptable' : mad < 0.015 ? 'Marginal' : 'Nonconformity';
  return { rows, mad, n, verdict };
}

export function analyze(tp, opts = {}) {
  const fy = tp.fyStart;
  const P = tp.periods;
  const periodOf = (m) => { for (const p of P) if (p >= m) return p; return null; };
  const spanOf = (p) => { const i = P.indexOf(p); const start = i > 0 ? P[i - 1] + 1 : 0; return [start, p]; };
  const periodLabel = (p) => { const [a, b] = spanOf(p); return a === b ? `${SHORT[p]}-${String(p <= 8 ? fy : fy + 1).slice(2)}` : `${SHORT[a]}–${SHORT[b]} ${String(b <= 8 ? fy : fy + 1).slice(2)}`; };
  const quarterlyCount = P.filter((p) => spanOf(p)[1] - spanOf(p)[0] >= 2).length;
  const filing = quarterlyCount === 0 ? 'Monthly' : quarterlyCount === P.length ? 'Quarterly (QRMP)' : 'Mixed (Monthly → QRMP)';
  const addMonth = (iso, n = 1) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
  const days = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
  const pri = { High: 3, Med: 2, Low: 1 };

  // ------------------------------------------------------------------ outward (GSTR-1)
  // Reverse-charge outward invoices: value counts in turnover, but the tax is the recipient's.
  const b2bTaxed = tp.b2b.filter((i) => !i.rc);
  const outward = [...tp.b2b, ...tp.b2cl, ...tp.b2cs];
  const supplierTax = (x) => (x.rc ? 0 : x.tax);
  const cnSigned = tp.cdn.map((c) => ({ ...c, sign: c.noteType === 'D' ? 1 : -1 }));

  // ------------------------------------------------------------------ period reconciliation
  const periodRecon = P.map((p) => {
    const g = tp.g3b[p];
    const inP = (x) => periodOf(x.m) === p;
    const g1Taxable = sum(outward.filter(inP), (x) => x.taxable) + sum(cnSigned.filter(inP), (x) => x.sign * x.taxable);
    const g1Tax = sum(outward.filter(inP), supplierTax) + sum(cnSigned.filter(inP), (x) => x.sign * x.tax);
    const g3bTaxable = g.out.taxable + g.zero.taxable;
    const g3bTax = g.out.igst + g.out.cgst + g.out.sgst + g.out.cess + g.zero.igst + g.zero.cess;
    const itc = g.itc;
    const itcClaim = (itc.A4 || 0) + (itc.A5 || 0) - (itc.B2 || 0);
    const b2bElig = sum(tp.g2b.filter((x) => inP(x) && x.itcAvail && !x.rc), (x) => x.tax);
    const cdnElig = sum(tp.g2bCdn.filter((x) => inP(x) && x.itcAvail && !x.rc), (x) => (x.noteType === 'D' ? 1 : -1) * x.tax);
    const isd = sum(tp.g2bIsd.filter(inP), (x) => x.tax);
    const itc2b = b2bElig + cdnElig + isd;
    const itc2a = sum(tp.g2a.filter((x) => inP(x) && !x.rc), (x) => x.tax) - sum(tp.g2aCdn.filter((x) => inP(x) && x.noteType === 'C'), (x) => x.tax);
    const filedRows = tp.liability.filter((l) => l.m === p && l.date && /debit/i.test(l.type || '') && /other than reverse/i.test(l.desc || ''));
    const filedOn = filedRows.length ? filedRows.map((l) => l.date).sort()[0] : null;
    const [a, b] = spanOf(p);
    const quarterly = b - a >= 2;
    const due = returnDueDate({ year: p <= 8 ? fy : fy + 1, month: ((p + 3) % 12) + 1, quarterly, stateCode: tp.stateCode, extensions: opts.extensions });
    const dueOn = due.due;
    const delay = filedOn ? Math.max(0, days(dueOn, filedOn)) : null;
    const nil = g3bTax === 0 && g.rcm.igst + g.rcm.cgst + g.rcm.sgst === 0;
    return {
      p, label: periodLabel(p), months: b - a + 1, quarterly, g1Taxable: r0(g1Taxable), g3bTaxable: r0(g3bTaxable), g1Tax: r0(g1Tax), g3bTax: r0(g3bTax),
      taxGap: r0(g1Tax - g3bTax), taxableGap: r0(g1Taxable - g3bTaxable), itcClaim: r0(itcClaim), itc2b: r0(itc2b), itc2a: r0(itc2a), itcGap: r0(itcClaim - itc2b),
      itcGross: r0((itc.A1 || 0) + (itc.A2 || 0) + (itc.A3 || 0) + (itc.A4 || 0) + (itc.A5 || 0)), itcImport: r0(itc.A1 || 0), itcRcm: r0((itc.A2 || 0) + (itc.A3 || 0)),
      reversed: r0((itc.B1 || 0) + (itc.B2 || 0)), ineligible: r0((itc.D1 || 0) + (itc.D2 || 0)),
      rcmTax: r0(g.rcm.igst + g.rcm.cgst + g.rcm.sgst + g.rcm.cess), liability: r0(g.pay.liability), cash: r0(g.pay.cash + g.pay.rcmCash), cashFwd: r0(g.pay.cash), itcUsed: r0(g.pay.itcUsed),
      interestPaid: r0(g.pay.interest || g.interest), lateFeePaid: r0(g.pay.lateFee || g.lateFee), filedOn, dueOn, dueExtended: due.extension ? (due.extension.notification || 'extension notified') : null, delay, nil,
    };
  });

  // ------------------------------------------------------------------ monthly series (for trend & correlation)
  const monthly = MONTHS.map((_, m) => {
    const o = outward.filter((x) => x.m === m);
    const c = tp.cdn.filter((x) => x.m === m);
    const i2a = tp.g2a.filter((x) => x.m === m);
    return {
      m, label: SHORT[m], outTaxable: r0(sum(o, (x) => x.taxable)), outTax: r0(sum(o, supplierTax)), outInvoices: tp.b2b.filter((x) => x.m === m).length,
      inTaxable: r0(sum(i2a, (x) => x.taxable)), inTax: r0(sum(i2a, (x) => x.tax)), inInvoices: i2a.length, suppliers: new Set(i2a.map((x) => x.gstin)).size,
      cnValue: r0(sum(c.filter((x) => x.noteType === 'C'), (x) => x.taxable)), customers: new Set(tp.b2b.filter((x) => x.m === m).map((x) => x.gstin)).size,
    };
  });
  const corrKeys = [['outTaxable', 'Outward taxable'], ['inTaxable', 'Inward taxable (2A)'], ['outInvoices', 'Sales invoices'], ['inInvoices', 'Purchase invoices'], ['suppliers', 'Active suppliers'], ['customers', 'Active customers'], ['cnValue', 'Credit notes']];
  const activeMonths = monthly.filter((r) => r.outTaxable || r.inTaxable);
  const correlation = { keys: corrKeys.map(([k, l]) => ({ k, l })), n: activeMonths.length, cells: [] };
  for (const [a] of corrKeys) for (const [b] of corrKeys) correlation.cells.push({ a, b, r: pearson(activeMonths.map((x) => x[a]), activeMonths.map((x) => x[b])) });

  // ------------------------------------------------------------------ headline profile
  const turnover = sum(periodRecon, (r) => r.g3bTaxable) + sum(P, (p) => tp.g3b[p].nil + tp.g3b[p].nonGst);
  const outputTax = sum(periodRecon, (r) => r.g3bTax);
  const itcClaimed = sum(periodRecon, (r) => r.itcGross);
  const cashPaid = sum(periodRecon, (r) => r.cash);
  const liabilityTotal = sum(periodRecon, (r) => r.liability) + sum(P, (p) => tp.g3b[p].pay.rcmLiability);
  const customers = new Set(tp.b2b.map((x) => x.gstin));
  const suppliers = new Set(tp.g2b.map((x) => x.gstin));

  // ------------------------------------------------------------------ rule evaluations
  const results = [];
  // Extract date: the later of the workbook creation date and the latest date inside the data (a template's
  // creation date can be older than the data it holds). Deterministic: never today's clock.
  const latestInData = [...periodRecon.map((r) => r.filedOn), ...tp.g2a.map((x) => x.g1FiledOn), ...tp.cashLedger.map((x) => x.date), ...tp.liability.map((x) => x.date)]
    .filter(Boolean).sort().pop() || null;
  const asOf = opts.asOf || [tp.created, latestInData].filter(Boolean).sort().pop() || null;
  const asOfSource = opts.asOf ? 'given' : asOf && asOf === tp.created ? 'workbook created' : 'latest date in data';
  // Tax heads of an amount (a notice must state IGST, CGST and SGST separately): from the lines behind the finding
  // where it names them (extra.heads), otherwise in the ratio of the taxpayer's own output (or, failing that, ITC) heads.
  const outMix = headsOf(outward.filter((x) => !x.rc));
  const itcMix = headsOf(tp.g2b.filter((x) => x.itcAvail && !x.rc));
  const headsFor = (exposure, extra) => {
    if (!(exposure > 0)) return {};
    const own = extra.heads ? allocate(exposure, extra.heads) : null;
    if (own) return { heads: own, headsBasis: extra.headsBasis || 'documents' };
    const mixed = allocate(exposure, outMix) || allocate(exposure, itcMix);
    return mixed ? { heads: mixed, headsBasis: 'apportioned' } : {};
  };
  const add = (id, status, finding, extra = {}) => { const exposure = r0(extra.exposure || 0); results.push({ id, status, finding, exposure, ...headsFor(exposure, extra), metric: extra.metric ?? null, evidence: extra.evidence || null, ...(extra.rag ? { rag: extra.rag, deadlines: extra.deadlines } : {}), ...(extra.summary ? { summary: extra.summary } : {}) }); };
  // GSTR-3B periods whose filing date is not in the liability ledger: delays, interest and late fee cannot be judged.
  const undated = periodRecon.filter((r) => !r.filedOn);
  const undatedNote = undated.length ? ` The filing date of ${undated.length} period(s) (${undated.map((r) => r.label).join(', ')}) is not in the liability ledger, so whether they were late cannot be checked: obtain the filing dates (portal ARN / filing history).` : '';
  const ev = (columns, rows, limit = 60) => ({ columns, rows: rows.slice(0, limit), total: rows.length });

  // A-01 GSTIN structural validity
  {
    const cps = [...new Set([...customers, ...suppliers, ...tp.cdn.map((c) => c.gstin)])].filter(Boolean);
    const bad = cps.filter((g) => gstinValid(g) === false);
    const nonStd = cps.filter((g) => gstinValid(g) === null);
    const badTax = sum(tp.g2b.filter((x) => bad.includes(x.gstin)), (x) => x.tax);
    add('A-01', bad.length ? 'Fail' : 'Pass',
      bad.length ? `${bad.length} counterparty GSTIN(s) fail the check-digit test` : `All ${cps.length} counterparty GSTINs pass the check-digit test${nonStd.length ? ` (${nonStd.length} non-standard UIN/TDS formats skipped)` : ''}. Active/cancelled status needs the GSTIN master API.`,
      { exposure: badTax, heads: headsOf(tp.g2b.filter((x) => bad.includes(x.gstin))), metric: `${bad.length}/${cps.length} invalid`, evidence: bad.length ? ev(['GSTIN', 'Side'], bad.map((g) => [g, customers.has(g) ? 'Customer' : 'Supplier'])) : null });
  }

  // A-02 filing completeness
  {
    const covered = new Set(P.flatMap((p) => { const [a, b] = spanOf(p); return Array.from({ length: b - a + 1 }, (_, i) => a + i); }));
    const lastActivity = Math.max(-1, ...tp.b2b.map((x) => x.m), ...tp.g2b.map((x) => x.m));
    const missing = MONTHS.map((_, m) => m).filter((m) => !covered.has(m) && m <= Math.max(lastActivity, 11));
    const late = periodRecon.filter((r) => r.delay > 0);
    // Supplies reported in GSTR-1 for months with no GSTR-3B: tax declared to buyers but not returned or paid.
    const uncovered = missing.map((m) => {
      const inM = (x) => x.m === m;
      return { m, taxable: sum(outward.filter(inM), (x) => x.taxable) + sum(cnSigned.filter(inM), (x) => x.sign * x.taxable), tax: sum(outward.filter(inM), supplierTax) + sum(cnSigned.filter(inM), (x) => x.sign * x.tax) };
    }).filter((u) => Math.abs(u.taxable) > 0);
    const unpaid = sum(uncovered, (u) => u.tax);
    const inMissing = (x) => missing.includes(x.m);
    add('A-02', missing.length ? 'Fail' : undated.length ? 'Review' : 'Pass',
      missing.length ? `GSTR-3B not found for ${missing.map((m) => SHORT[m]).join(', ')}.${uncovered.length ? ` GSTR-1 reports supplies in ${uncovered.length} of those month(s) carrying tax ${fmtL(unpaid)} that has not been returned in GSTR-3B.` : ''}${undatedNote}`
        : undated.length ? `GSTR-3B is on record for all ${P.length} periods (${filing}).${undatedNote}${late.length ? ` Of the dated periods, ${late.length} were filed after the due date (max ${Math.max(0, ...late.map((r) => r.delay))} days).` : ''}`
          : `All ${P.length} GSTR-3B periods filed (${filing}). ${late.length} filed after due date, max delay ${Math.max(0, ...late.map((r) => r.delay))} days.`,
      { exposure: Math.max(0, unpaid), heads: headsOf([...outward.filter((x) => !x.rc && inMissing(x)), ...cnSigned.filter(inMissing)], (x) => x.sign ?? 1), metric: undated.length && !missing.length ? `${undated.length} undated` : `${late.length} late`, evidence: uncovered.length
        ? ev(['Month', 'GSTR-1 taxable', 'GSTR-1 tax', 'GSTR-3B'], uncovered.map((u) => [MONTHS[u.m], r0(u.taxable), r0(u.tax), 'not filed']))
        : ev(['Period', 'Due', 'Filed (ledger)', 'Delay (days)'], periodRecon.map((r) => [r.label, r.dueExtended ? `${r.dueOn} (extended)` : r.dueOn, r.filedOn || 'not in ledger', r.delay ?? '-'])) });
  }

  // B-01 ITC claimed vs GSTR-2B
  {
    const tol = (base) => Math.max(1000, 0.01 * Math.abs(base));
    const bad = periodRecon.filter((r) => r.itcGap > tol(r.itc2b));
    const annualGap = sum(periodRecon, (r) => r.itcGap);
    const totClaim = sum(periodRecon, (r) => r.itcClaim);
    const fail = annualGap > tol(sum(periodRecon, (r) => r.itc2b));
    const excessHeads = addHeads(...P.map((p) => {
      const inP = (x) => periodOf(x.m) === p, h = tp.g3b[p].itcH || {};
      const claimed = subHeads(addHeads(h.A4, h.A5), h.B2);
      const elig = addHeads(headsOf(tp.g2b.filter((x) => inP(x) && x.itcAvail && !x.rc)), headsOf(tp.g2bCdn.filter((x) => inP(x) && x.itcAvail && !x.rc), (x) => (x.noteType === 'D' ? 1 : -1)), headsOf(tp.g2bIsd.filter(inP)));
      return subHeads(claimed, elig);
    }));
    add('B-01', fail ? 'Fail' : bad.length ? 'Review' : 'Pass',
      fail ? `ITC claimed in 3B (4A(4)+4A(5)−4B(2)) exceeds GSTR-2B eligible ITC by ${fmtL(annualGap)} for the year; ${bad.length} period(s) breach threshold.`
        : bad.length ? `Annual ITC within 2B, but ${bad.length} period(s) show excess: timing difference; interest u/s 50(3) may apply if utilised.` : `ITC claimed ≤ GSTR-2B eligible ITC in every period (claimed ${fmtL(totClaim)}).`,
      { exposure: fail ? annualGap : 0, heads: excessHeads, metric: `${annualGap >= 0 ? '+' : ''}${fmtL(annualGap)}`, evidence: ev(['Period', '3B ITC claimed', '2B eligible', 'Excess'], periodRecon.map((r) => [r.label, r.itcClaim, r.itc2b, r.itcGap])) });
  }

  // B-04 supplier 3B not filed (Rule 37A): judged as at the extract date, per the statutory deadlines
  {
    const rows = tp.g2a.filter((x) => x.supplier3B === false);
    const t = sum(rows, (x) => x.tax);
    const bySup = Object.values(groupBy(rows, 'gstin')).map((g) => [g[0].gstin, g[0].party, g.length, r0(sum(g, (x) => x.tax))]).sort((a, b) => b[3] - a[3]);
    const r37 = rule37A(fy, asOf);
    const d = (iso) => (iso ? iso.split('-').reverse().join('-') : 'an unknown date');
    const filedOk = tp.g2a.filter((x) => x.supplier3B === true).length;
    add('B-04', rows.length ? 'Review' : 'Pass',
      rows.length
        ? r37.rag === 'amber'
          ? `Amber, awaiting validation: as per the extract of ${d(asOf)}, ${bySup.length} supplier(s) had not filed GSTR-3B for ${rows.length} invoices carrying ITC ${fmtL(t)}. Suppliers have until ${d(r37.supplierBy)} to file; Rule 37A reversal arises only for invoices still unfiled then (due by ${d(r37.reverseBy)}), with re-availment once the supplier pays. Confirm current supplier status on the portal.`
          : `Red, reversal computation conditions met as per the extract of ${d(asOf)}: ${bySup.length} supplier(s) had not filed GSTR-3B by ${d(r37.supplierBy)} for ${rows.length} invoices carrying ITC ${fmtL(t)}. Under Rule 37A the ITC is reversible by ${d(r37.reverseBy)}, with re-availment once the supplier pays. Verify supplier status and any reversal already made before concluding.`
        : `Green: all suppliers in GSTR-2A had filed GSTR-3B as per the extract of ${d(asOf)} (${filedOk} invoices).`,
      { exposure: t, heads: headsOf(rows), metric: rows.length ? `${bySup.length} suppliers · ${r37.rag}` : 'green', rag: rows.length ? r37.rag : 'green', deadlines: r37,
        // Invoice-wise monitor. The recipient's availment month is not reported per invoice: the 3B period covering the 2A month is shown.
        evidence: ev(['Supplier GSTIN', 'Name', 'Invoice', 'Date', 'Taxable', 'IGST', 'CGST', 'SGST', '2A month', '3B period', 'Supplier GSTR-1 filed', 'Supplier 3B (extract)', 'Status'],
          [...rows].sort((x, y) => x.gstin.localeCompare(y.gstin) || String(x.date).localeCompare(String(y.date))).map((x) => [x.gstin, x.party, x.no, x.date, r0(x.taxable), r0(x.igst), r0(x.cgst), r0(x.sgst),
            MONTHS[x.m], periodLabel(periodOf(x.m) ?? P[P.length - 1]), x.g1FiledOn || '-', 'Not filed', r37.rag === 'amber' ? 'Amber: awaiting validation' : 'Red: reversal conditions met']), 1000),
        summary: { bySupplier: bySup, reversed4B2: r0(sum(periodRecon, (r) => r.reversed)) } });
  }

  // B-07 time limit s.16(4)
  {
    const fyStartIso = `${fy}-04-01`;
    const prior = tp.g2b.filter((x) => x.date && x.date < fyStartIso);
    const late = prior.filter((x) => x.m >= 8); // 2B period Dec or later => claimed after 30-Nov
    const t = sum(late, (x) => x.tax);
    add('B-07', late.length ? 'Fail' : 'Pass',
      late.length ? `${late.length} prior-FY invoice(s) appear in 2B after November: ITC ${fmtL(t)} time-barred u/s 16(4) unless reported in 4D(2).` : `${prior.length} prior-FY invoice(s) found, all within the 30-Nov window.`,
      { exposure: Math.max(0, t - sum(periodRecon, (r) => r.ineligible)), heads: headsOf(late), metric: `${late.length} invoices`, evidence: ev(['Supplier', 'Invoice', 'Date', '2B month', 'Tax'], late.map((x) => [x.party, x.no, x.date, MONTHS[x.m], r0(x.tax)])) });
  }

  // B-08 duplicate ITC: matching hierarchy. Supplier GSTIN, document type and normalised invoice number group the
  // rows; then invoice date, rate, taxable value and each tax head decide the outcome. Amendments (2B B2BA) and
  // same-value credit notes from the same supplier are linked, not duplicates. Invoice-level 3B claims are not in the
  // returns, so even an exact duplicate is "in 2B, claim to verify" against the purchase register.
  let dupCount = 0;
  {
    const norm = (no) => String(no || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^0+(?=\d)/, '');
    const key = (x) => `${x.gstin}|${x.docType || 'R'}|${norm(x.no)}`;
    const amended = new Set(tp.g2bAmend.flatMap((a) => [`${a.gstin}|${norm(a.origNo)}`, `${a.gstin}|${norm(a.no)}`]));
    const cnVals = new Set(tp.g2bCdn.filter((c) => c.noteType === 'C').map((c) => `${c.gstin}|${Math.round(c.taxable)}`));
    const same = (g, f) => new Set(g.map(f)).size === 1;
    const outcomeOf = (g) => {
      if (amended.has(`${g[0].gstin}|${norm(g[0].no)}`)) return 'amendment';
      if (!same(g, (x) => x.rate)) return 'not'; // one invoice with several rate lines
      if (g.some((x) => cnVals.has(`${x.gstin}|${Math.round(x.taxable)}`))) return 'credit-note';
      if (same(g, (x) => x.date) && same(g, (x) => Math.round(x.taxable)) && same(g, (x) => Math.round(x.igst)) && same(g, (x) => Math.round(x.cgst)) && same(g, (x) => Math.round(x.sgst))) return 'exact';
      if (same(g, (x) => x.date) || same(g, (x) => Math.round(x.taxable))) return 'probable';
      return 'not';
    };
    const LABEL = { exact: 'Exact duplicate in 2B: verify 3B claim', probable: 'Probable duplicate: officer check', amendment: 'Amendment-linked', 'credit-note': 'Credit-note-linked', recurring: 'Recurring billing (sequential numbers): not a duplicate', not: 'Not a duplicate' };
    const groups = Object.values(groupBy(tp.g2b, key)).filter((g) => g.length > 1).map((g) => ({ g, outcome: outcomeOf(g) }));
    // Same supplier, date and value under different numbers: a probable duplicate for the officer to check, unless the
    // numbers run in sequence under one series (recurring fixed-rate billing, e.g. per-container or per-trip charges).
    const sequential = (g) => {
      const parts = g.map((x) => String(x.no).toUpperCase().match(/^(.*?)(\d+)\s*$/));
      if (parts.some((m) => !m) || new Set(parts.map((m) => m[1])).size > 1) return false;
      const n = parts.map((m) => Number(m[2]));
      return Math.max(...n) - Math.min(...n) < 2 * g.length;
    };
    const soft = Object.values(groupBy(tp.g2b.filter((x) => x.value >= 10000), (x) => `${x.gstin}|${x.date}|${x.value}`))
      .filter((g) => g.length > 1 && new Set(g.map(key)).size > 1).map((g) => ({ g, outcome: sequential(g) ? 'recurring' : 'probable' }));
    const all = [...groups, ...soft];
    const ORDER = ['exact', 'probable', 'credit-note', 'amendment', 'recurring', 'not'];
    const exact = all.filter((x) => x.outcome === 'exact');
    const probable = all.filter((x) => x.outcome === 'probable');
    const extra = exact.flatMap((x) => x.g.slice(1));
    const count = (o) => all.filter((x) => x.outcome === o).length;
    dupCount = extra.length;
    add('B-08', exact.length ? 'Fail' : probable.length ? 'Review' : 'Pass',
      exact.length
        ? `${exact.length} exact duplicate group(s) in GSTR-2B (same supplier, document type, invoice number, date, rate, value and tax heads) carrying ${fmtL(sum(extra, (x) => x.tax))} in the extra copies. A repeated 2B row is not proof that ITC was claimed twice in GSTR-3B: verify against the purchase register.${probable.length ? ` ${probable.length} further group(s) are probable duplicates for officer check.` : ''}`
        : probable.length ? `No exact duplicates. ${probable.length} probable duplicate group(s) for officer check${count('amendment') + count('credit-note') ? `; ${count('amendment') + count('credit-note')} linked to an amendment or credit note` : ''}${count('recurring') ? `; ${count('recurring')} recurring-billing group(s) with sequential numbers set aside` : ''}.`
          : `No duplicate invoices found in GSTR-2B${all.length ? ` (${all.length} group(s) explained by recurring sequential billing, amendments, credit notes or multi-rate lines)` : ''}.`,
      { exposure: sum(extra, (x) => x.tax), heads: headsOf(extra), metric: `${exact.length} exact / ${probable.length} probable`,
        evidence: ev(['Supplier GSTIN', 'Name', 'Invoice no(s)', 'Date(s)', 'Rate', 'Taxable', 'IGST', 'CGST', 'SGST', '2B period(s)', 'Copies', 'Outcome'],
          all.sort((a, b) => ORDER.indexOf(a.outcome) - ORDER.indexOf(b.outcome))
            .map(({ g, outcome }) => [g[0].gstin, g[0].party, [...new Set(g.map((x) => x.no))].join(' / '), [...new Set(g.map((x) => x.date))].join(' / '), [...new Set(g.map((x) => x.rate))].join(' / '),
              r0(g[0].taxable), r0(g[0].igst), r0(g[0].cgst), r0(g[0].sgst), [...new Set(g.map((x) => MONTHS[x.m]))].join(' / '), g.length, LABEL[outcome]]), 500) });
  }

  // B-09 Import IGST
  {
    const boe = sum(tp.g2bImpg, (x) => x.igst);
    const claimed = sum(periodRecon, (r) => r.itcImport);
    if (!boe && !claimed) add('B-09', 'NA', 'No imports of goods in GSTR-2B or 3B 4A(1).');
    else {
      const gap = claimed - boe;
      add('B-09', gap > 1000 ? 'Fail' : 'Pass', `3B 4A(1) import ITC ${fmtL(claimed)} vs ICEGATE BoE IGST in 2B ${fmtL(boe)} (${gap >= 0 ? 'excess' : 'short-claimed'} ${fmtL(Math.abs(gap))}).`,
        { exposure: Math.max(0, gap), heads: { igst: 1 }, headsBasis: 'law', metric: fmtL(gap), evidence: ev(['BoE', 'Date', '2B month', 'Taxable', 'IGST'], tp.g2bImpg.map((x) => [x.boe, x.date, MONTHS[x.m], r0(x.taxable), r0(x.igst)])) });
    }
  }

  // C-01 RCM liability vs RCM inward in 2B;  C-02 RCM ITC <= RCM paid
  {
    const rcmIn = sum(tp.g2b.filter((x) => x.rc), (x) => x.tax);
    const rcmPaid = sum(periodRecon, (r) => r.rcmTax);
    const rcmPaidHeads = addHeads(...P.map((p) => tp.g3b[p].rcm));
    if (!rcmIn && !rcmPaid) add('C-01', 'Review', 'No RCM inward supplies in 2B and nil 3.1(d). RCM on GL heads (legal, GTA, URP rent, import of services) needs books.');
    else add('C-01', rcmIn - rcmPaid > 1000 ? 'Fail' : 'Pass', `RCM supplies in 2B carry tax ${fmtL(rcmIn)}; RCM liability declared in 3.1(d) ${fmtL(rcmPaid)}.`,
      { exposure: Math.max(0, rcmIn - rcmPaid), heads: subHeads(headsOf(tp.g2b.filter((x) => x.rc)), rcmPaidHeads), metric: fmtL(rcmIn - rcmPaid), evidence: ev(['Supplier', 'Invoice', 'Date', 'Tax'], tp.g2b.filter((x) => x.rc).map((x) => [x.party, x.no, x.date, r0(x.tax)])) });
    let cum = 0; const rows = [];
    for (const r of periodRecon) { cum += r.itcRcm - r.rcmTax; rows.push([r.label, r.rcmTax, r.itcRcm, r0(cum)]); }
    const excess = sum(periodRecon, (r) => r.itcRcm) - rcmPaid;
    if (!rcmPaid && !sum(periodRecon, (r) => r.itcRcm)) add('C-02', 'NA', 'No RCM liability or RCM ITC in 3B.');
    else add('C-02', excess > 1000 ? 'Fail' : 'Pass', `RCM ITC (4A(2)+4A(3)) ${fmtL(sum(periodRecon, (r) => r.itcRcm))} vs RCM tax paid ${fmtL(rcmPaid)}.`,
      { exposure: Math.max(0, excess), heads: subHeads(addHeads(...P.map((p) => addHeads(tp.g3b[p].itcH?.A2, tp.g3b[p].itcH?.A3))), rcmPaidHeads), metric: fmtL(excess), evidence: ev(['Period', 'RCM paid 3.1(d)', 'RCM ITC', 'Cumulative excess'], rows) });
  }

  // D-01 tax head vs place of supply
  {
    const own = tp.stateCode;
    const chk = (x, supplierState) => {
      const pc = stateCodeOf(x.pos); if (!pc || pc === '96' || pc === '97') return null;
      const intra = pc === supplierState;
      if (intra && x.igst > 1) return 'IGST on intra-state';
      if (!intra && x.cgst + x.sgst > 1) return 'CGST/SGST on inter-state';
      return null;
    };
    const out = [...tp.b2b, ...tp.b2cl, ...tp.b2cs].map((x) => ({ x, why: chk(x, own) })).filter((o) => o.why);
    const inn = tp.g2b.map((x) => ({ x, why: chk(x, x.gstin.slice(0, 2)) })).filter((o) => o.why);
    add('D-01', out.length ? 'Fail' : inn.length ? 'Review' : 'Pass',
      out.length ? `${out.length} outward line(s) charge the wrong tax head for the place of supply (tax ${fmtL(sum(out, (o) => o.x.tax))}): tax paid under wrong head is not a valid discharge (s.77 / s.19 IGST).`
        : inn.length ? `Outward heads correct. ${inn.length} inward line(s) from suppliers show a head/POS mismatch (ITC ${fmtL(sum(inn, (o) => o.x.tax))}).` : 'Tax head matches place of supply on all outward and inward lines.',
      { exposure: sum(out, (o) => o.x.tax), heads: addHeads(...out.map((o) => (o.why === 'IGST on intra-state' ? { cgst: o.x.tax / 2, sgst: o.x.tax / 2 } : { igst: o.x.tax }))), headsBasis: 'law', metric: `${out.length} out / ${inn.length} in`, evidence: ev(['Side', 'Party', 'Invoice', 'POS', 'Issue', 'Tax'], [...out.map((o) => ['Outward', o.x.party || o.x.kind, o.x.no || '-', o.x.pos, o.why, r0(o.x.tax)]), ...inn.map((o) => ['Inward', o.x.party, o.x.no, o.x.pos, o.why, r0(o.x.tax)])]) });
  }

  // D-02 / D-03 ITC blocked by POS (2B reason P) vs 4D(2) disclosure
  {
    const rows = tp.g2b.filter((x) => !x.itcAvail);
    const t = sum(rows, (x) => x.tax);
    const disclosed = sum(periodRecon, (r) => r.ineligible);
    if (!rows.length) add('D-02', 'Pass', 'No GSTR-2B lines marked ITC-unavailable on place-of-supply grounds.');
    else add('D-02', t - disclosed > 1000 ? 'Review' : 'Pass', `${rows.length} 2B line(s) marked ITC not available (reason P – POS in supplier's state) worth ${fmtL(t)}; 3B 4D(2) discloses ${fmtL(disclosed)}. Confirm none of it is inside 4A(5).`,
      { exposure: Math.max(0, t - disclosed), heads: headsOf(rows), metric: fmtL(t), evidence: ev(['Supplier', 'Invoice', 'Date', 'POS', 'Tax'], rows.map((x) => [x.party, x.no, x.date, x.pos, r0(x.tax)])) });
  }

  // F-06 Rule 86B
  {
    const rows = periodRecon.map((r) => ({ ...r, monthly: r.g3bTaxable / r.months, pct: r.liability ? r.cashFwd / r.liability : 1 }));
    const breach = rows.filter((r) => r.monthly > 5e6 && r.pct < 0.01);
    add('F-06', breach.length ? 'Review' : 'Pass',
      breach.length ? `${breach.length} period(s) with taxable value > ₹50 L/month paid < 1% of output tax in cash. Check Rule 86B exemptions (income-tax > ₹1 L, refunds, etc.).` : 'No Rule 86B breach: cash share ≥ 1% wherever monthly taxable value exceeded ₹50 L.',
      { exposure: sum(breach, (r) => Math.max(0, 0.01 * r.liability - r.cashFwd)), heads: addHeads(...breach.map((r) => tp.g3b[r.p].out)), metric: `${breach.length} periods`, evidence: ev(['Period', 'Taxable / month', 'Output tax', 'Cash paid', 'Cash %'], rows.map((r) => [r.label, r0(r.monthly), r.liability, r.cashFwd, `${(r.pct * 100).toFixed(2)}%`])) });
  }

  // G-01 turnover reconciliation (GSTR-1 vs 3B vs HSN)
  const g1TaxableTot = sum(periodRecon, (r) => r.g1Taxable);
  const g3bTaxableTot = sum(periodRecon, (r) => r.g3bTaxable);
  const hsnTaxable = sum(tp.hsn, (h) => h.taxable);
  {
    const d = g1TaxableTot - g3bTaxableTot;
    const fail = Math.abs(d) > 10000 && Math.abs(d) > 0.001 * g3bTaxableTot;
    add('G-01', fail ? 'Fail' : 'Pass', `GSTR-1 taxable ${fmtL(g1TaxableTot)} vs GSTR-3B ${fmtL(g3bTaxableTot)} (diff ${fmtL(d)}); HSN summary ${fmtL(hsnTaxable)}. Books & GSTR-9 legs need annual return / TB.`,
      { metric: fmtL(d), evidence: ev(['Period', 'GSTR-1 taxable', 'GSTR-3B taxable', 'Diff'], periodRecon.map((r) => [r.label, r.g1Taxable, r.g3bTaxable, r.taxableGap])) });
  }

  // G-02 GSTR-1 vs 3B liability
  {
    const tol = (b) => Math.max(1000, 0.005 * b);
    const bad = periodRecon.filter((r) => r.taxGap > tol(r.g3bTax));
    const net = sum(periodRecon, (r) => r.taxGap);
    const fail = net > tol(sum(periodRecon, (r) => r.g3bTax));
    const gapHeads = addHeads(...P.map((p) => {
      const inP = (x) => periodOf(x.m) === p, g = tp.g3b[p];
      return subHeads(addHeads(headsOf(outward.filter((x) => inP(x) && !x.rc)), headsOf(cnSigned.filter(inP), (x) => x.sign)), addHeads(g.out, { igst: g.zero.igst }));
    }));
    add('G-02', fail ? 'Fail' : bad.length ? 'Review' : 'Pass',
      fail ? `Tax declared in GSTR-1 exceeds tax paid in GSTR-3B by ${fmtL(net)} for the year: short payment (DRC-01B trigger, Rule 88C).`
        : bad.length ? `Annual liability matches, but ${bad.length} period(s) under-declared in 3B: interest on delayed payment applies.` : 'GSTR-3B liability ≥ GSTR-1 in every period.',
      { exposure: fail ? net : 0, heads: gapHeads, metric: fmtL(net), evidence: ev(['Period', 'GSTR-1 tax', 'GSTR-3B tax', 'Gap'], periodRecon.map((r) => [r.label, r.g1Tax, r.g3bTax, r.taxGap])) });
  }

  // G-03 e-invoice coverage (AATO proxy = current-year turnover)
  {
    const noIrn = tp.b2b.filter((x) => !x.irn);
    if (turnover <= 5e7) add('G-03', 'NA', `Turnover ${fmtL(turnover)} ≤ ₹5 Cr: e-invoicing likely not mandatory (confirm with prior-year AATO).`);
    else if (noIrn.length === tp.b2b.length) add('G-03', 'Review', `Turnover ${fmtL(turnover)} > ₹5 Cr (current-year proxy for AATO) but none of ${tp.b2b.length} B2B invoices carry an IRN in this extract. Confirm on the IRP: invoices without IRN are invalid and attract s.122 penalty; recipients' ITC is at risk.`, { metric: `${noIrn.length} without IRN` });
    else add('G-03', noIrn.length ? 'Fail' : 'Pass', `${noIrn.length} of ${tp.b2b.length} B2B invoices lack an IRN (value ${fmtL(sum(noIrn, (x) => x.value))}). Penalty-based exposure (s.122), not tax: not added to demand.`,
      { metric: `${noIrn.length} without IRN`, evidence: ev(['Customer', 'Invoice', 'Date', 'Value'], noIrn.map((x) => [x.party, x.no, x.date, r0(x.value)])) });
  }

  // G-10 rate & HSN validation
  let arithBad = [];
  {
    const valid = new Set([0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28, 40]);
    arithBad = [...tp.b2b, ...tp.b2cl].filter((x) => x.rate > 0 && x.taxable > 0).map((x) => ({ x, exp: (x.taxable * x.rate) / 100 - x.cess, diff: (x.taxable * x.rate) / 100 - (x.tax - x.cess) }))
      .filter((o) => Math.abs(o.diff) > Math.max(1, 0.005 * o.exp));
    const badRate = [...tp.b2b, ...tp.hsn].filter((x) => x.rate && !valid.has(x.rate));
    // The HSN summary is part of GSTR-1, so compare it with all of GSTR-1 (not only months covered by a filed 3B).
    const g1AllTaxable = sum(outward, (x) => x.taxable) + sum(cnSigned, (x) => x.sign * x.taxable);
    const hsnDiff = hsnTaxable - g1AllTaxable;
    const hsnFail = tp.hsn.length && Math.abs(hsnDiff) > 0.01 * g1AllTaxable && Math.abs(hsnDiff) > 10000;
    const short = sum(arithBad.filter((o) => o.diff > 0 && !o.x.rc), (o) => o.diff);
    add('G-10', hsnFail || short > 1000 || badRate.length ? 'Fail' : arithBad.length ? 'Review' : 'Pass',
      `${arithBad.length} invoice(s) where tax ≠ taxable × rate (short-charged ${fmtL(short)}); ${badRate.length} non-notified rate(s); HSN summary vs GSTR-1 taxable diff ${fmtL(hsnDiff)}.`,
      { exposure: short, heads: headsOf(arithBad.filter((o) => o.diff > 0 && !o.x.rc).map((o) => o.x)), metric: `${arithBad.length} mismatches`, evidence: ev(['Customer', 'Invoice', 'Rate', 'Taxable', 'Tax charged', 'Tax expected'], arithBad.map((o) => [o.x.party, o.x.no, o.x.rate, r0(o.x.taxable), r0(o.x.tax), r0(o.exp + o.x.cess)])) });
  }

  // G-12 invoice series / document summary
  {
    const invDocs = tp.docs.filter((d) => /invoice for outward/i.test(d.nature || ''));
    const net = sum(invDocs, (d) => d.net), cancelled = sum(invDocs, (d) => d.cancelled), total = sum(invDocs, (d) => d.total);
    const reported = tp.b2b.length + tp.b2cl.length;
    // numeric gaps inside each B2B prefix series
    const series = groupBy(tp.b2b.map((x) => { const mm = x.no.match(/^(.*?)(\d+)\s*$/); return mm ? { pre: mm[1], n: parseInt(mm[2], 10) } : null; }).filter(Boolean), 'pre');
    let gaps = 0;
    for (const s of Object.values(series)) { if (s.length < 10) continue; const ns = [...new Set(s.map((x) => x.n))].sort((a, b) => a - b); for (let i = 1; i < ns.length; i++) { const g = ns[i] - ns[i - 1] - 1; if (g > 0 && g < 500) gaps += g; } }
    const over = invDocs.length && reported > net;
    add('G-12', over ? 'Review' : cancelled / Math.max(1, total) > 0.05 || (gaps && !tp.b2cs.length) ? 'Review' : 'Pass',
      `Document summary: ${total} issued, ${cancelled} cancelled (${((cancelled / Math.max(1, total)) * 100).toFixed(1)}%), ${net} net vs ${reported} B2B/B2CL invoices reported. ${gaps} number(s) missing inside B2B series${tp.b2cs.length ? ' (B2C sales may explain gaps)' : ''}.`,
      { metric: `${gaps} gaps`, evidence: ev(['Month', 'Document', 'From', 'To', 'Total', 'Cancelled', 'Net'], tp.docs.map((d) => [MONTHS[d.m], d.nature, d.from, d.to, d.total, d.cancelled, d.net])) });
  }

  // G-14 TDS / TCS credits vs declared turnover
  {
    const tdsBase = sum(tp.tdsCredits, (x) => x.base), tcsNet = sum(tp.tcsCredits, (x) => x.net);
    if (!tdsBase && !tcsNet) add('G-14', 'NA', 'No GSTR-7 TDS or GSTR-8 TCS credits in this extract.');
    else {
      const declared = turnover;
      const fail = tdsBase + tcsNet > declared * 1.001;
      add('G-14', fail ? 'Fail' : 'Pass', `TDS base ${fmtL(tdsBase)} + TCS net ${fmtL(tcsNet)} vs declared turnover ${fmtL(declared)}.`,
        { exposure: fail ? (tdsBase + tcsNet - declared) * 0.18 : 0, metric: fmtL(tdsBase + tcsNet), evidence: ev(['Month', 'Deductor/Collector', 'Base / Net value', 'Tax'], [...tp.tdsCredits.map((x) => [MONTHS[x.m], x.deductor, r0(x.base), r0(x.tax)]), ...tp.tcsCredits.map((x) => [MONTHS[x.m], x.collector, r0(x.net), r0(x.tax)])]) });
    }
  }

  // H-01 CN time limit, H-02 CN linkage, H-08 unusual CN pattern
  {
    const cns = tp.cdn.filter((c) => c.noteType === 'C');
    if (!cns.length) { add('H-01', 'NA', 'No credit notes issued.'); add('H-02', 'NA', 'No credit notes issued.'); add('H-08', 'NA', 'No credit notes issued.'); }
    else {
      const late = cns.filter((c) => c.origDate && c.origDate < `${fy}-04-01` && c.date && c.date > `${fy}-11-30`);
      add('H-01', late.length ? 'Fail' : 'Pass', late.length ? `${late.length} credit note(s) against prior-FY invoices issued after 30-Nov: output tax reduction not allowed u/s 34(2).` : `All ${cns.length} credit notes within the s.34(2) window (where original date available).`,
        { exposure: sum(late, (c) => c.tax), heads: headsOf(late), metric: `${late.length} late`, evidence: ev(['Customer', 'Note', 'Date', 'Orig. invoice date', 'Tax'], late.map((c) => [c.party, c.no, c.date, c.origDate, r0(c.tax)])) });
      const invNos = new Set(tp.b2b.map((x) => x.no));
      const unlinked = cns.filter((c) => !c.origNo);
      const orphan = cns.filter((c) => c.origNo && !invNos.has(c.origNo));
      add('H-02', unlinked.length || orphan.length ? 'Review' : 'Pass', `${unlinked.length} of ${cns.length} credit notes carry no original invoice reference; ${orphan.length} reference an invoice not in this year's GSTR-1.`,
        { metric: `${unlinked.length} unlinked`, evidence: ev(['Customer', 'Note', 'Date', 'Orig. invoice', 'Taxable', 'Tax'], [...unlinked, ...orphan].map((c) => [c.party, c.no, c.date, c.origNo || '-', r0(c.taxable), r0(c.tax)])) });
      const sales = groupBy(tp.b2b, 'gstin'); const cnBy = groupBy(cns, 'gstin');
      const rows = Object.entries(cnBy).map(([g, cs]) => { const s = sum(sales[g] || [], (x) => x.taxable); const c = sum(cs, (x) => x.taxable); return { g, party: cs[0].party, s, c, pct: s ? c / s : Infinity, tax: sum(cs, (x) => x.tax) }; }).filter((r) => r.pct > 0.1).sort((a, b) => b.c - a.c);
      const yearEnd = sum(cns.filter((c) => c.m >= 11), (c) => c.taxable) / Math.max(1, sum(cns, (c) => c.taxable));
      add('H-08', rows.length ? 'Review' : 'Pass', `${rows.length} customer(s) with credit notes > 10% of their invoiced value; ${(yearEnd * 100).toFixed(0)}% of CN value issued in March.`,
        { exposure: sum(rows, (r) => r.tax), heads: headsOf(cns.filter((c) => rows.some((r) => r.g === c.gstin))), metric: `${rows.length} parties`, evidence: ev(['Customer', 'GSTIN', 'Sales taxable', 'CN taxable', 'CN %'], rows.map((r) => [r.party, r.g, r0(r.s), r0(r.c), Number.isFinite(r.pct) ? `${(r.pct * 100).toFixed(1)}%` : 'no sales'])) });
    }
    const cn2b = sum(tp.g2bCdn.filter((x) => x.noteType === 'C'), (x) => x.tax);
    const itcOk = results.find((r) => r.id === 'B-01').status !== 'Fail';
    add('H-06', !cn2b ? 'Pass' : itcOk ? 'Pass' : 'Fail', `Supplier credit notes in 2B reduce ITC by ${fmtL(cn2b)}; ${itcOk ? 'net 3B claim stays within 2B after netting.' : 'net 3B claim exceeds 2B after netting: see B-01 (exposure counted there).'}`, { metric: fmtL(cn2b) });
  }

  // J-01 interest, J-03 late fee. Interest u/s 50(1) proviso: 18% p.a. on the tax discharged in cash, for the days
  // the return was late. The working is shown in full; a one-day delay is flagged for validation of the filing time.
  {
    const drc03 = tp.cashLedger.filter((l) => /DRC[\s-]?0?3/i.test(l.desc || '') && /debit/i.test(l.type || ''));
    const due = periodRecon.map((r) => ({ ...r, intDue: r.delay ? (0.18 * r.cash * r.delay) / 365 : 0, feeDue: r.delay ? Math.min(r.delay * (r.nil ? 20 : 50), r.nil ? 1000 : 10000) : 0 }));
    const intDue = sum(due, (r) => r.intDue), intPaid = sum(due, (r) => r.interestPaid);
    const feeDue = sum(due, (r) => r.feeDue), feePaid = sum(due, (r) => r.lateFeePaid);
    const drcPaid = sum(drc03, (l) => l.amount);
    const oneDay = due.filter((r) => r.delay === 1 && r.intDue - r.interestPaid > 0);
    const state = (r) => (!r.delay ? 'No delay' : r.delay === 1 ? 'Pending validation: one-day delay' : r.intDue - r.interestPaid > 1 ? `Difference ${fmtL(r.intDue - r.interestPaid)} to verify` : 'Interest paid');
    add('J-01', intDue - intPaid > 100 ? 'Fail' : undated.length ? 'Review' : 'Pass',
      `Interest computed @18% p.a. (s.50(1) proviso) on tax paid in cash for delayed periods: ${fmtL(intDue)} vs interest paid in 3B ${fmtL(intPaid)}${drcPaid ? ` and ${fmtL(drcPaid)} of DRC-03 debits in the cash ledger` : ''}.${oneDay.length ? ` ${oneDay.length} period(s) are one day late: interest calculation pending validation of the filing timestamp and any due-date extension.` : ''}${undatedNote}`,
      { exposure: Math.max(0, intDue - intPaid), heads: addHeads(...due.filter((r) => r.delay).map((r) => tp.g3b[r.p].out)), headsBasis: 'apportioned', metric: fmtL(intDue - intPaid),
        evidence: ev(['Period', 'Due date', 'Filed (ledger)', 'Delay (days)', 'Tax paid in cash', 'Tax paid via ITC', 'Rate', 'Working', 'Interest computed', 'Interest paid (3B)', 'Status'],
          due.map((r) => [r.label, r.dueOn, r.filedOn || '-', r.delay ?? '-', r.cash, r.itcUsed, '18% p.a.', r.delay ? `${r.cash} × 18% × ${r.delay} / 365` : '-', r0(r.intDue), r.interestPaid, state(r)])),
        summary: { drc03: drc03.map((l) => [l.date, l.desc, r0(l.amount)]), drcPaid: r0(drcPaid), provision: 's.50(1) proviso: interest on the portion of tax paid in cash' } });
    add('J-03', feeDue - feePaid > 50 ? 'Fail' : undated.length ? 'Review' : 'Pass', `GSTR-3B late fee computed ${fmtL(feeDue)} (₹50/day, ₹20 nil; capped) vs paid ${fmtL(feePaid)}. GSTR-1 filing dates are not in the extract.${undatedNote}`,
      { exposure: Math.max(0, feeDue - feePaid), heads: { cgst: 1, sgst: 1 }, headsBasis: 'law', metric: fmtL(feeDue - feePaid), evidence: ev(['Period', 'Due date', 'Filed (ledger)', 'Delay (days)', 'Fee due', 'Fee paid'], due.map((r) => [r.label, r.dueOn, r.filedOn || '-', r.delay ?? '-', r0(r.feeDue), r.lateFeePaid])) });
  }

  // ------------------------------------------------------------------ fraud / risk indicators
  const fraud = [];
  // prompt = a review prompt only (natural in many sectors): shown to the officer but never counted in any score.
  const flag = (key, label, value, flagged, why, weight = 1, prompt = false) => fraud.push({ key, label, value, flagged: !!flagged, why, weight, ...(prompt ? { prompt: true } : {}) });
  {
    const salesBy = groupBy(tp.b2b, 'gstin'), buyBy = groupBy(tp.g2b, 'gstin');
    const mirror = Object.keys(salesBy).filter((g) => buyBy[g]).map((g) => ({ g, party: salesBy[g][0].party || buyBy[g][0].party, sold: sum(salesBy[g], (x) => x.taxable), bought: sum(buyBy[g], (x) => x.taxable) }))
      .sort((a, b) => Math.min(b.sold, b.bought) - Math.min(a.sold, a.bought));
    const mirrorVal = sum(mirror, (m) => Math.min(m.sold, m.bought));
    const share = g1TaxableTot ? mirrorVal / g1TaxableTot : 0;
    flag('circular', 'Circular trading (same party buys & sells)', `${mirror.length} parties · ${(share * 100).toFixed(1)}% of sales`, share > 0.05, 'Counterparties that are both customer and supplier; the overlapping value can indicate round-tripping of ITC.', 1.5);
    const samePan = [...new Set([...customers, ...suppliers])].filter((g) => g.slice(2, 12) === tp.pan && g !== tp.gstin);
    flag('distinct', 'Distinct-person / same-PAN transactions', `${samePan.length} GSTIN(s)`, samePan.length > 0, 'Supplies to/from other registrations of the same PAN require open-market valuation (Rule 28) and cross-charge review.', 0.5);
    const cashPct = liabilityTotal ? cashPaid / liabilityTotal : 1;
    flag('valueadd', 'Low cash payment (ITC-funded liability)', `${(cashPct * 100).toFixed(1)}% paid in cash`, liabilityTotal > 1e6 && cashPct < 0.03, 'Almost all output tax discharged through ITC: typical of low value-addition or credit-passing entities.', 1);
    const nf = sum(tp.g2a.filter((x) => x.supplier3B === false), (x) => x.tax);
    const nfPct = itcClaimed ? nf / itcClaimed : 0;
    flag('nonfiler', 'ITC from suppliers who did not file 3B', `${(nfPct * 100).toFixed(1)}% of ITC`, nfPct > 0.05, 'Credit sourced from non-paying suppliers is the core pattern of fake-invoice rings.', 1.5);
    const bIn = benford(tp.g2b.map((x) => x.value)), bOut = benford(tp.b2b.map((x) => x.value));
    flag('benford', "Unnatural invoice amounts (Benford's law)", `Sales ${bOut.verdict.toLowerCase()} (MAD ${bOut.mad?.toFixed(4) ?? '-'}) · Purchases ${bIn.verdict.toLowerCase()} (MAD ${bIn.mad?.toFixed(4) ?? '-'})`, (bOut.n >= 300 && bOut.mad > 0.015) || (bIn.n >= 300 && bIn.mad > 0.015), 'In genuine data about 30 in 100 amounts start with 1 and fewer than 5 with 9. Amounts far from that curve can be made up, or simply come from fixed price lists: sample the invoices before concluding.', 1);
    const allVals = [...tp.b2b.map((x) => x.taxable), ...tp.g2b.map((x) => x.taxable)].filter((v) => v >= 10000);
    const round = allVals.filter((v) => v % 1000 === 0).length / Math.max(1, allVals.length);
    flag('round', 'Round-figure invoices', `${(round * 100).toFixed(1)}% multiples of ₹1,000`, allVals.length >= 30 && round > 0.2, 'Genuine commercial invoices rarely land on round thousands; accommodation bills often do.', 1);
    const vals = [...tp.b2b, ...tp.g2b].map((x) => x.value);
    const below = vals.filter((v) => v >= 45000 && v < 50000).length, above = vals.filter((v) => v >= 50000 && v < 55000).length;
    flag('ewb', 'Invoice splitting below ₹50,000 e-way bill limit', `${below} just below vs ${above} just above`, below >= 10 && below > 2 * Math.max(1, above), 'A pile-up just under the e-way bill threshold suggests splitting to avoid movement tracking.', 1);
    const mv = monthly.map((m) => m.outTaxable).filter((v) => v > 0);
    const med = median(mv), mx = Math.max(0, ...mv);
    flag('spike', 'Turnover spike', med ? `peak ${(mx / med).toFixed(1)}× median month` : '-', med && mx > 3 * med && mx > 1e6, 'Review prompt only: a month far above the norm can reflect project milestones, seasonality or large contracts. Compare with prior-year seasonality, contract values and e-invoice / e-way bill timestamps before drawing any inference.', 0.75, true);
    const zero = sum(P, (p) => tp.g3b[p].zero.taxable);
    flag('accum', 'ITC accumulation vs output tax', `ITC ${(outputTax ? (itcClaimed / outputTax) * 100 : 0).toFixed(0)}% of output tax`, !zero && outputTax > 0 && itcClaimed > 1.1 * outputTax, 'ITC persistently above output tax without exports/inverted duty is a red flag for credit build-up.', 1);
    const cnTot = sum(tp.cdn.filter((c) => c.noteType === 'C'), (c) => c.taxable);
    const cnMar = sum(tp.cdn.filter((c) => c.noteType === 'C' && c.m >= 11), (c) => c.taxable);
    flag('cn', 'Year-end credit-note reversal', `${(g1TaxableTot ? (cnTot / (g1TaxableTot + cnTot)) * 100 : 0).toFixed(1)}% of sales · ${(cnTot ? (cnMar / cnTot) * 100 : 0).toFixed(0)}% in March`, cnTot > 0.05 * (g1TaxableTot + cnTot) && cnMar > 0.5 * cnTot, 'Heavy March credit notes can reverse sales booked earlier to shift liability.', 0.75);
    flag('dup', 'Duplicate purchase invoices', `${dupCount} duplicates`, dupCount > 0, 'Exact duplicate rows in GSTR-2B (same supplier, number, date, rate, value and tax): verify the GSTR-3B claim.', 1);
    const arithPct = arithBad.length / Math.max(1, tp.b2b.length);
    flag('arith', 'Tax arithmetic errors on invoices', `${arithBad.length} invoices (${(arithPct * 100).toFixed(1)}%)`, arithPct > 0.05, 'Tax not equal to taxable × rate on many invoices suggests manipulated values.', 0.5);
    const sundays = tp.b2b.filter((x) => x.date && new Date(`${x.date}T00:00:00Z`).getUTCDay() === 0).length;
    flag('sunday', 'Invoices dated on Sundays', `${sundays} (${((sundays / Math.max(1, tp.b2b.length)) * 100).toFixed(1)}%)`, tp.b2b.length >= 50 && sundays / tp.b2b.length > 0.15, 'Review prompt only: compare with the working-day pattern of the industry and with e-invoice / e-way bill timestamps; many businesses operate on Sundays.', 0.5, true);

    var fraudDetail = { mirror: mirror.slice(0, 12).map((m) => ({ ...m, sold: r0(m.sold), bought: r0(m.bought) })), samePan, benfordIn: bIn, benfordOut: bOut };
  }

  // ------------------------------------------------------------------ e-way bills (only when the e-way bill data is present)
  // Without it these rules stay "Needs books": the returns alone cannot show movement of goods.
  const ewbRec = tp.ewb ? reconcileEwb(tp, tp.ewb, stateCodeOf) : null;
  if (ewbRec) {
    const o = ewbRec.outward, i = ewbRec.inward, s = ewbRec.shipTo;
    // G-05: goods moved on an e-way bill with no invoice in GSTR-1: sales kept off the returns
    add('G-05', o.unmatched.count ? 'Fail' : 'Pass',
      o.unmatched.count ? `${o.unmatched.count} e-way bill(s) worth ${fmtL(o.unmatched.value)} generated by the taxpayer have no invoice in GSTR-1: goods moved, sale not reported. Tax ${fmtL(o.unmatched.tax)}.`
        : `All ${o.bills} e-way bills generated by the taxpayer match an invoice in GSTR-1.`,
      { exposure: o.unmatched.tax, heads: o.unmatched.heads, metric: `${o.unmatched.count} of ${o.bills} bills`, evidence: o.unmatched.count ? ev(['E-way bill', 'Date', 'Document', 'To', 'Value', 'Vehicle'], o.unmatched.rows.map((b) => [b.no, b.at.replace('T', ' '), b.docNo, b.toName || b.to, r0(b.total), b.vehicle || '-'])) : null });
    // B-03: ITC on goods with no e-way bill behind them (proof of receipt, s.16(2)(b))
    const bad = i.unsupported.itc, material = bad >= Math.max(100000, 0.005 * ewbRec.goodsItc);
    add('B-03', !i.unsupported.count ? 'Pass' : material ? 'Fail' : 'Review',
      i.unsupported.count ? `${i.unsupported.count} of ${i.needing} goods invoices above the e-way bill limit have no e-way bill: ITC ${fmtL(bad)} with no record that the goods moved. Obtain proof of receipt (GRN, lorry receipt, e-way bill).`
        : `Every goods invoice above the e-way bill limit (${i.needing}) has an e-way bill behind it.`,
      { exposure: material ? bad : 0, heads: i.unsupported.heads, metric: `${i.unsupported.count}/${i.needing} unsupported`, evidence: i.unsupported.count ? ev(['Supplier', 'GSTIN', 'Invoice', 'Date', 'Value', 'ITC'], i.unsupported.rows.map((x) => [x.party, x.from, x.no, x.date, r0(x.value), r0(x.itc)])) : null });
    // D-05: bill-to-ship-to movements: the place of supply is the bill-to party's state, so is the tax head
    add('D-05', s.wrongHead.count ? 'Fail' : 'Pass',
      s.wrongHead.count ? `${s.wrongHead.count} of ${s.moves} bill-to-ship-to movements charged the wrong tax head: goods delivered in the supplier's own state but billed to a party in another state are inter-state (IGST Act s.10(1)(b)). Tax ${fmtL(s.wrongHead.tax)} under the wrong head.`
        : s.moves ? `${s.moves} bill-to-ship-to movement(s): place of supply and tax head follow the bill-to party, correctly.` : 'No bill-to-ship-to movements in the e-way bill data.',
      { exposure: s.wrongHead.tax, heads: { igst: 1 }, headsBasis: 'law', metric: `${s.wrongHead.count}/${s.moves}`, evidence: s.wrongHead.count ? ev(['E-way bill', 'Invoice', 'Bill-to state', 'Ship-to state', 'IGST', 'CGST', 'SGST'], s.wrongHead.rows.map((x) => [x.no, x.docNo, x.billTo, x.shipTo, r0(x.igst), r0(x.cgst), r0(x.sgst)])) : null });
    fraud.push({ key: 'vehicle', label: 'Same vehicle in two places at once (e-way bills)', value: `${ewbRec.vehicles.clashes} impossible journey(s)`, flagged: ewbRec.vehicles.clashes > 0,
      why: 'One vehicle cannot start journeys hundreds of kilometres apart within a few hours: at least one of the e-way bills records movement that did not happen.', weight: 1.5 });
    const cancelRate = o.bills ? o.cancelled / (o.bills + o.cancelled) : 0;
    fraud.push({ key: 'ewbcancel', label: 'E-way bills cancelled after generation', value: `${o.cancelled} (${(cancelRate * 100).toFixed(1)}%)`, flagged: o.bills >= 50 && cancelRate > 0.04,
      why: 'Review prompt only: cancellation is routine, but a high rate can mean bills generated to cover a movement and cancelled once it was over.', weight: 0.5, prompt: true });
  }
  const fraudFlags = fraud.filter((f) => f.flagged && !f.prompt);

  // K-series (demand & limitation)
  {
    const arDue = `${fy + 1}-12-31`;
    const scn = addMonth(arDue, 42);
    add('K-01', 'Info', `FY ${fy}-${String(fy + 1).slice(2)} ⇒ proceedings under s.74A (in force from 01-11-2024). Annual return due ${arDue}; SCN by ${scn}; order within 12 months of SCN (extendable 6).`, { metric: 's.74A' });
    const strong = fraudFlags.filter((f) => f.weight >= 1).length;
    add('K-02', strong >= 3 ? 'Fail' : fraudFlags.length ? 'Review' : 'Pass', `${fraudFlags.length} risk indicator(s) raised: ${fraudFlags.map((f) => f.label).join('; ') || 'none'}. Leads for enquiry only; intent must be pleaded and proved on evidence (Uniworth, Pushpam).`, { metric: `${fraudFlags.length} indicators` });
  }

  // ------------------------------------------------------------------ totals & score
  const confirmed = sum(results.filter((r) => r.status === 'Fail'), (r) => r.exposure);
  const potential = sum(results.filter((r) => r.status === 'Review'), (r) => r.exposure);
  {
    const fraudish = fraudFlags.filter((f) => f.weight >= 1).length >= 3;
    const pen = fraudish ? confirmed : Math.max(0.1 * confirmed, confirmed > 0 ? 10000 : 0);
    add('K-04', confirmed < 1000 ? 'Pass' : 'Info', confirmed < 1000 ? 'Quantified tax exposure below ₹1,000: no SCN u/s 74A (de minimis).' : `Quantified exposure ${fmtL(confirmed)} exceeds the ₹1,000 de-minimis: SCN possible u/s 74A.`, { metric: fmtL(confirmed) });
    add('K-07', 'Info', `Indicative penalty if unpaid after SCN: ${fraudish ? '100% (fraud limb, s.74A(5)(ii))' : '10% or ₹10,000, whichever higher (non-fraud, s.74A(5)(i))'} ≈ ${fmtL(pen)}; nil/reduced if paid within 60 days of SCN.`, { metric: fmtL(pen) });
  }
  const { score, band } = scoreOf({ results, fraud, exposure: { confirmed }, profile: { turnover } }, opts.scoring || DEFAULT_SCORING, opts.severity || {});

  // ------------------------------------------------------------------ chart datasets
  const topN = (rows, n, keyF, valF, labelF, extra = () => ({})) => {
    const g = groupBy(rows, keyF);
    const list = Object.entries(g).map(([k, a]) => ({ key: k, name: labelF(a[0]) || k, value: r0(sum(a, valF)), ...extra(a) })).sort((a, b) => b.value - a.value);
    const tot = sum(list, (x) => x.value);
    return { list: list.slice(0, n).map((x) => ({ ...x, share: tot ? x.value / tot : 0 })), total: tot, count: list.length, otherValue: sum(list.slice(n), (x) => x.value) };
  };
  const topSuppliers = topN(tp.g2b, 10, 'gstin', (x) => x.taxable, (x) => x.party, (a) => ({ tax: r0(sum(a, (x) => x.tax)), nonFiler: tp.g2a.some((z) => z.gstin === a[0].gstin && z.supplier3B === false), invoices: a.length }));
  const topCustomers = topN(tp.b2b, 10, 'gstin', (x) => x.taxable, (x) => x.party, (a) => ({ tax: r0(sum(a, (x) => x.tax)), invoices: a.length }));
  const hhi = (l) => sum(l, (x) => (x.share * 100) ** 2);
  const outwardMix = [
    { name: 'B2B invoices', value: r0(sum(b2bTaxed, (x) => x.taxable)) },
    { name: 'B2C (small)', value: r0(sum(tp.b2cs, (x) => x.taxable)) },
    { name: 'B2C (large)', value: r0(sum(tp.b2cl, (x) => x.taxable)) },
    { name: 'Zero-rated', value: r0(sum(P, (p) => tp.g3b[p].zero.taxable)) },
    { name: 'Nil / exempt / non-GST', value: r0(sum(P, (p) => tp.g3b[p].nil + tp.g3b[p].nonGst)) },
  ].filter((x) => x.value > 0);
  const rateMix = Object.entries(groupBy([...b2bTaxed, ...tp.b2cl, ...tp.b2cs], (x) => x.rate)).map(([k, a]) => ({ name: `${k}%`, rate: +k, value: r0(sum(a, (x) => x.taxable)) })).filter((x) => x.value > 0).sort((a, b) => a.rate - b.rate);
  const hsnTop = topN(tp.hsn, 12, 'hsn', (x) => x.taxable, (x) => `${x.hsn} · ${x.desc.slice(0, 28)}`).list;
  const posStates = topN([...tp.b2b, ...tp.b2cl, ...tp.b2cs], 8, (x) => stateCodeOf(x.pos) || 'NA', (x) => x.taxable, (x) => STATE_CODES[stateCodeOf(x.pos)] || x.pos || 'Unknown').list;
  const inStates = topN(tp.g2b, 8, (x) => x.gstin.slice(0, 2), (x) => x.taxable, (x) => STATE_CODES[x.gstin.slice(0, 2)] || x.gstin.slice(0, 2)).list;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => ({ day: d, sales: 0, purchases: 0 }));
  for (const x of tp.b2b) if (x.date) wd[new Date(`${x.date}T00:00:00Z`).getUTCDay()].sales++;
  for (const x of tp.g2b) if (x.date) wd[new Date(`${x.date}T00:00:00Z`).getUTCDay()].purchases++;
  const bins = [0, 1e3, 1e4, 5e4, 1e5, 5e5, 1e6, 5e6, 1e7, Infinity];
  const binLabel = ['<1K', '1K–10K', '10K–50K', '50K–1L', '1L–5L', '5L–10L', '10L–50L', '50L–1Cr', '>1Cr'];
  const valueHist = binLabel.map((l, i) => ({ bucket: l, sales: tp.b2b.filter((x) => x.value >= bins[i] && x.value < bins[i + 1]).length, purchases: tp.g2b.filter((x) => x.value >= bins[i] && x.value < bins[i + 1]).length }));
  const itcComposition = [
    { name: 'Import of goods', value: sum(periodRecon, (r) => r.itcImport) },
    { name: 'RCM (incl. import of services)', value: sum(periodRecon, (r) => r.itcRcm) },
    { name: 'ISD', value: r0(sum(P, (p) => tp.g3b[p].itc.A4 || 0)) },
    { name: 'All other ITC', value: r0(sum(P, (p) => tp.g3b[p].itc.A5 || 0)) },
  ].filter((x) => x.value > 0);
  const in2aNot2b = (() => {
    const k = (x) => `${x.gstin}|${x.no.toUpperCase().replace(/\s+/g, '')}`;
    const s2b = new Set(tp.g2b.map(k));
    const rows = tp.g2a.filter((x) => !x.rc && !s2b.has(k(x)));
    return { count: rows.length, tax: r0(sum(rows, (x) => x.tax)), rows: rows.slice(0, 40).map((x) => [x.party, x.no, x.date, MONTHS[x.m], x.g1FiledOn || '-', r0(x.tax)]) };
  })();
  const challanStats = Object.entries(groupBy(tp.challans, 'status')).map(([k, a]) => ({ name: k || 'UNKNOWN', count: a.length, amount: r0(sum(a, (x) => x.amount)) }));

  // Data confidence (0-100): is the returns extract complete enough to rely on? Mean of the parts below.
  // Books, e-invoice and e-way bill data are never in the extract: listed as missing, not scored.
  const confidence = (() => {
    const covered = P.length ? spanOf(P[P.length - 1])[1] + 1 : 0;
    const share = (n, d) => (d ? n / d : 0);
    const parts = [
      ['GSTR-3B periods cover the year', Math.min(1, covered / 12)],
      ['GSTR-1 outward data present', outward.length || !sum(P, (p) => tp.g3b[p].out.taxable) ? 1 : 0],
      ['GSTR-2B inward data present', tp.g2b.length || !sum(periodRecon, (r) => r.itcClaim) ? 1 : 0],
      ['Supplier filing status in GSTR-2A', tp.g2a.length ? share(tp.g2a.filter((x) => x.supplier3B !== null).length, tp.g2a.length) : tp.g2b.length ? 0 : 1],
      ['Liability, cash and credit ledgers present', [tp.liability, tp.cashLedger, tp.creditLedger].filter((l) => l.length).length / 3],
      ['3B filing dates found in the ledger', share(periodRecon.filter((r) => r.filedOn).length, periodRecon.length)],
      ['Extract date known', asOfSource === 'workbook created' ? 1 : asOf ? 0.5 : 0],
    ].map(([label, v]) => ({ label, v: Math.round(v * 100) }));
    // Records per source per month (Apr..Mar) for the coverage heatmap; GSTR-3B = 1 when a return covers the month.
    const perMonth = (rows) => { const c = Array(12).fill(0); for (const x of rows) if (x.m >= 0 && x.m < 12) c[x.m]++; return c; };
    const coverage = [
      { key: '3b', label: 'GSTR-3B', unit: 'return', counts: Array.from({ length: 12 }, (_, m) => (periodOf(m) !== null ? 1 : 0)) },
      { key: 'g1', label: 'GSTR-1', unit: 'invoices and notes', counts: perMonth([...outward, ...tp.cdn]) },
      { key: '2b', label: 'GSTR-2B', unit: 'inward documents', counts: perMonth([...tp.g2b, ...tp.g2bCdn]) },
      { key: '2a', label: 'GSTR-2A', unit: 'inward documents', counts: perMonth([...tp.g2a, ...tp.g2aCdn]) },
      { key: 'led', label: 'Ledgers', unit: 'ledger entries', counts: perMonth([...tp.liability, ...tp.cashLedger, ...tp.creditLedger]) },
    ].map((r) => ({ ...r, total: sum(r.counts) }));
    const facts = {
      monthsCovered: Math.min(12, covered), periods: periodRecon.length, filedDates: periodRecon.filter((r) => r.filedOn).length,
      supplierStatusKnown: tp.g2a.filter((x) => x.supplier3B !== null).length, g2aRows: tp.g2a.length, extractDate: asOf, extractSource: asOfSource,
    };
    return { score: Math.round(sum(parts, (x) => x.v) / parts.length), parts, coverage, facts, missing: ['Purchase and sales registers (books)', ewbRec ? 'e-invoice data' : 'e-invoice and e-way bill data', 'Bank and stock records'] };
  })();

  // Risk radar (0-100 per dimension)
  const modScore = (prefixes) => {
    const rs = results.filter((r) => prefixes.some((p) => r.id.startsWith(p)));
    if (!rs.length) return 0;
    return Math.min(100, Math.round((sum(rs, (r) => (r.status === 'Fail' ? 1 : r.status === 'Review' ? 0.4 : 0)) / rs.length) * 100));
  };
  const radar = [
    { dim: 'Filing & payment', v: modScore(['A-02', 'J-']) },
    { dim: 'ITC eligibility', v: modScore(['B-']) },
    { dim: 'Outward liability', v: modScore(['G-']) },
    { dim: 'RCM & POS', v: modScore(['C-', 'D-']) },
    { dim: 'Credit notes', v: modScore(['H-']) },
    { dim: 'Risk indicators', v: Math.min(100, Math.round((fraudFlags.length / fraud.length) * 180)) },
  ];

  // Mix snapshot for year-on-year explanation (src/engine/revenue.js): what was sold (HSN, with tax), to whom
  // (customers, flagging other registrations of the same PAN) and whose credit was used (suppliers, flagging non-filers).
  const mix = (() => {
    const TOP = 60;
    const topWithOther = (rows, keep) => {
      const sorted = [...rows].sort((x, y) => y.value - x.value);
      const head = sorted.slice(0, TOP);
      const rest = sorted.slice(TOP);
      return rest.length ? [...head, { key: 'OTHER', name: `${rest.length} others`, value: r0(sum(rest, (x) => x.value)), ...keep(rest) }] : head;
    };
    const byHsn = Object.values(groupBy(tp.hsn.filter((h) => h.hsn), 'hsn')).map((g) => ({ hsn: g[0].hsn, desc: g[0].desc, taxable: r0(sum(g, (h) => h.taxable)), tax: r0(sum(g, (h) => h.igst + h.cgst + h.sgst + h.cess)) }));
    const sold = [...tp.b2b, ...tp.b2cl].filter((x) => !x.rc);
    const byCustomer = topWithOther([
      ...Object.values(groupBy(sold, 'gstin')).map((g) => ({ key: g[0].gstin, name: g[0].party || g[0].gstin, value: r0(sum(g, (x) => x.taxable)), samePan: g[0].gstin.slice(2, 12) === tp.pan })),
      ...(tp.b2cs.length ? [{ key: 'B2C', name: 'Unregistered buyers (B2C)', value: r0(sum(tp.b2cs, (x) => x.taxable)), samePan: false }] : []),
    ], () => ({ samePan: false }));
    const notFiled = new Set(tp.g2a.filter((x) => x.supplier3B === false).map((x) => x.gstin));
    const bySupplier = topWithOther(Object.values(groupBy(tp.g2b.filter((x) => x.itcAvail && !x.rc), 'gstin')).map((g) => ({
      key: g[0].gstin, name: g[0].party || g[0].gstin, value: r0(sum(g, (x) => x.taxable)), tax: r0(sum(g, (x) => x.tax)), notFiled: notFiled.has(g[0].gstin), invalidGstin: gstinValid(g[0].gstin) === false,
    })), (rest) => ({ tax: r0(sum(rest, (x) => x.tax)), notFiled: false, invalidGstin: false }));
    const cns = tp.cdn.filter((c) => c.noteType === 'C');
    const invNos = new Set(tp.b2b.map((x) => x.no));
    return {
      byHsn, byCustomer, bySupplier,
      creditNotes: { taxable: r0(sum(cns, (c) => c.taxable)), tax: r0(sum(cns, (c) => c.tax)), count: cns.length, linkedShare: cns.length ? cns.filter((c) => c.origNo && invNos.has(c.origNo)).length / cns.length : null },
      itcUsed: r0(sum(periodRecon, (r) => r.itcUsed)),
    };
  })();

  return {
    id: tp.id, name: tp.name, gstin: tp.gstin, fy: tp.fy, state: STATE_CODES[tp.stateCode] || tp.stateCode, fileName: tp.fileName, filing, asOf, mix,
    profile: {
      turnover: r0(turnover), outputTax: r0(outputTax), itcClaimed: r0(itcClaimed), cashPaid: r0(cashPaid), liability: r0(liabilityTotal),
      cashPct: liabilityTotal ? cashPaid / liabilityTotal : 0, customers: customers.size, suppliers: suppliers.size, salesInvoices: tp.b2b.length + tp.b2cl.length, purchaseInvoices: tp.g2b.length,
      itcToOutput: outputTax ? itcClaimed / outputTax : 0, g1Taxable: r0(g1TaxableTot), g3bTaxable: r0(g3bTaxableTot), hsnTaxable: r0(hsnTaxable),
      supplierHHI: r0(hhi(topSuppliers.list)), customerHHI: r0(hhi(topCustomers.list)), creditNotes: r0(sum(tp.cdn.filter((c) => c.noteType === 'C'), (c) => c.taxable)),
      periodsFiled: P.length, latePeriods: periodRecon.filter((r) => r.delay > 0).length,
    },
    score, band, confidence, exposure: { confirmed: r0(confirmed), potential: r0(potential) },
    asOfSource, periodRecon, monthly, correlation, results, fraud, fraudDetail, ewb: ewbRec,
    charts: { topSuppliers, topCustomers, outwardMix, rateMix, hsnTop, posStates, inStates, weekday: wd, valueHist, itcComposition, in2aNot2b, challanStats, radar },
  };
}
