// Taxpayer revenue baseline: a compact, per-financial-year snapshot of one GSTIN, derived from the engine's own
// analysis so every later capability (year-on-year change, revenue-drop explanation, contributors, trajectory)
// reads the same figures the scrutiny screens show. Pure: no I/O, no clock.

const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));

/**
 * @param {object} a  output of analyze() for one GSTIN and one financial year
 * @returns {object}  baseline for that year
 */
export function baselineOf(a) {
  const fyStart = parseInt(String(a.fy).slice(0, 4), 10);
  return {
    gstin: a.gstin,
    name: a.name,
    fy: a.fy,
    fyStart,
    filing: a.filing,
    asOf: a.asOf,
    fileName: a.fileName,
    totals: pick(a.profile, ['turnover', 'outputTax', 'itcClaimed', 'cashPaid', 'liability', 'cashPct', 'g1Taxable', 'g3bTaxable', 'creditNotes', 'periodsFiled', 'latePeriods', 'customers', 'suppliers']),
    months: a.monthly.map((m) => pick(m, ['m', 'outTaxable', 'outTax', 'inTaxable', 'inTax', 'cnValue', 'outInvoices', 'inInvoices'])),
    periods: a.periodRecon.map((r) => pick(r, ['p', 'label', 'months', 'g1Taxable', 'g3bTaxable', 'g1Tax', 'g3bTax', 'liability', 'cash', 'itcUsed', 'itcClaim', 'itc2b', 'reversed', 'interestPaid', 'lateFeePaid', 'filedOn', 'dueOn', 'delay'])),
    rateMix: a.charts.rateMix.map((r) => ({ rate: r.rate, value: r.value })),
    hsnMix: a.charts.hsnTop.map((h) => ({ key: h.key, value: h.value })),
    customers: a.charts.topCustomers.list.map((c) => ({ key: c.key, name: c.name, value: c.value })),
    suppliers: a.charts.topSuppliers.list.map((s) => ({ key: s.key, name: s.name, value: s.value })),
    mix: a.mix, // by HSN (with tax), customer and supplier; credit notes; ITC used (for revenue-change explanation)
  };
}

/** Year-on-year view of one GSTIN's baselines (oldest first). Null when there is no earlier year. */
export function yearOnYear(baselines = []) {
  if (baselines.length < 2) return null;
  const [prev, cur] = baselines.slice(-2);
  const delta = (k) => ({ prior: prev.totals[k], current: cur.totals[k], change: cur.totals[k] - prev.totals[k], pct: prev.totals[k] ? (cur.totals[k] - prev.totals[k]) / prev.totals[k] : null });
  return { prior: prev.fy, current: cur.fy, turnover: delta('turnover'), outputTax: delta('outputTax'), cashPaid: delta('cashPaid'), itcClaimed: delta('itcClaimed') };
}
