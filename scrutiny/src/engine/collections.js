// Collection base and revenue trajectory (capabilities 21 and 28). Pure: no I/O, no clock.
//
//   collectionBase(...)  what a jurisdiction collected, month by month and taxpayer by taxpayer, split into
//                        classes with a stated definition and source, plus the exceptions a reader must know about
//   trajectory(...)      from the months so far, the expected rest of the year with a range, the gap to target,
//                        the taxpayers driving it, what-if scenarios, and (for a past date) how the forecast did
//
// Classes (definitions shown on screen):
//   regular      tax paid in cash through GSTR-3B (including reverse charge), by return period
//   itc          liability discharged with input tax credit: not a collection, shown beside it
//   interestFees interest and late fee paid through GSTR-3B
//   intervention payments recorded against cases (DRC-03 after a notice, payments against a DRC-07 order), by
//                payment date; linked by the case action register, never inferred
// A quarterly return's tax is attributed to the quarter's last month, as paid.

export const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const r0 = (v) => Math.round(v);
export const fyOfDate = (iso) => { const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)); return m >= 4 ? `${y}-${y + 1}` : `${y - 1}-${y}`; };
export const monthOfDate = (iso) => (Number(iso.slice(5, 7)) + 8) % 12; // Apr -> 0
const shortFy = (fy) => `${fy.slice(2, 4)}-${fy.slice(7, 9)}`;

export const CLASS_DEFS = {
  regular: { label: 'Regular (GSTR-3B cash)', def: 'Tax paid in cash through GSTR-3B, including reverse charge, attributed to the return period.', source: 'GSTR-3B payment table' },
  interestFees: { label: 'Interest and late fee', def: 'Interest and late fee paid through GSTR-3B.', source: 'GSTR-3B payment table' },
  intervention: { label: 'After departmental action', def: 'Payments recorded against a case: DRC-03 after a notice or payments against a DRC-07 order, by payment date.', source: 'Case action register' },
  itc: { label: 'Discharged by ITC (not collected)', def: 'Liability set off with input tax credit. Not a collection; shown so the total liability is visible.', source: 'GSTR-3B payment table' },
};

/**
 * @param {{ baselines: object, gstins: string[], caselog?: object[], names?: object }} input
 * @returns {{ years: string[], months: object[], byTaxpayer: object[], totals: object, exceptions: object[] }}
 */
export function collectionBase({ baselines, gstins, caselog = [] }) {
  const cells = new Map(); // `${fy}|${m}` -> totals
  const cell = (fy, m) => { const k = `${fy}|${m}`; return cells.get(k) || cells.set(k, { fy, m, label: `${MONTHS[m]} ${shortFy(fy)}`, regular: 0, interestFees: 0, intervention: 0, itc: 0, byTp: {} }).get(k); };
  const exceptions = [];
  const tpTotals = {};
  for (const g of gstins) {
    for (const b of baselines[g] || []) {
      const t = (tpTotals[`${g}|${b.fy}`] = { gstin: g, name: b.name, fy: b.fy, regular: 0, interestFees: 0, intervention: 0, itc: 0 });
      const filed = new Set();
      for (const p of b.periods) {
        const c = cell(b.fy, p.p);
        const regular = (p.cash || 0) - 0, fees = (p.interestPaid || 0) + (p.lateFeePaid || 0), itc = p.itcUsed || 0;
        c.regular += regular; c.interestFees += fees; c.itc += itc;
        const tp = (c.byTp[g] ||= { regular: 0, itc: 0, interestFees: 0, intervention: 0 });
        tp.regular += regular; tp.itc += itc; tp.interestFees += fees;
        t.regular += regular; t.interestFees += fees; t.itc += itc;
        for (let i = 0; i < p.months; i++) filed.add(p.p - i);
      }
      const allItc = b.periods.filter((p) => (p.liability || 0) > 1e5 && (p.cash || 0) === 0);
      if (allItc.length) exceptions.push({ kind: 'all-itc', gstin: g, name: b.name, fy: b.fy, text: `${allItc.length} of ${b.periods.length} returns set off the whole liability (₹${r0(sum(allItc, (p) => p.liability)).toLocaleString('en-IN')}) with ITC: nothing collected in cash for those periods.` });
      const missing = b.months.filter((mm) => !filed.has(mm.m) && mm.outTax > 0);
      if (missing.length) exceptions.push({ kind: 'unfiled', gstin: g, name: b.name, fy: b.fy, text: `No GSTR-3B for ${missing.map((mm) => MONTHS[mm.m]).join(', ')} although GSTR-1 shows tax of ₹${r0(sum(missing, (mm) => mm.outTax)).toLocaleString('en-IN')}: not collected, so absent from the base.` });
      if (b.periods.some((p) => p.months > 1)) exceptions.push({ kind: 'quarterly', gstin: g, name: b.name, fy: b.fy, text: 'Quarterly (QRMP) returns: each quarter’s tax is shown in its last month.' });
    }
  }
  const scope = new Set(gstins);
  for (const r of caselog) {
    if (r.event !== 'payment' || !scope.has(r.gstin) || !r.amount) continue;
    const fy = fyOfDate(r.date), m = monthOfDate(r.date);
    const c = cell(fy, m);
    c.intervention += r.amount;
    (c.byTp[r.gstin] ||= { regular: 0, itc: 0, interestFees: 0, intervention: 0 }).intervention += r.amount;
    const t = (tpTotals[`${r.gstin}|${fy}`] ||= { gstin: r.gstin, name: r.gstin, fy, regular: 0, interestFees: 0, intervention: 0, itc: 0 });
    t.intervention += r.amount;
  }
  const months = [...cells.values()].sort((a, b) => a.fy.localeCompare(b.fy) || a.m - b.m).map((c) => ({ ...c, collected: c.regular + c.interestFees + c.intervention, discharged: c.regular + c.itc }));
  const years = [...new Set(months.map((c) => c.fy))];
  const totals = Object.fromEntries(years.map((fy) => { const ms = months.filter((c) => c.fy === fy); return [fy, { regular: sum(ms, (c) => c.regular), interestFees: sum(ms, (c) => c.interestFees), intervention: sum(ms, (c) => c.intervention), itc: sum(ms, (c) => c.itc), collected: sum(ms, (c) => c.collected), discharged: sum(ms, (c) => c.discharged) }]; }));
  return { years, months, byTaxpayer: Object.values(tpTotals), totals, exceptions };
}

// ------------------------------------------------------------------ capability 28: trajectory
/**
 * Forecast the rest of a financial year from the months up to asOf (1..12), taxpayer by taxpayer:
 *   forecast(t, m) = same month last year × t's growth ratio × scenario multiplier
 * where the growth ratio is the year-to-date one, or the last three months' when they break from it by more than
 * 25% (a step change: stopped filing, a rate change, business moved). A taxpayer with no last year is carried at its
 * average month so far. Measures: 'discharged' (cash + ITC, the basis of targets set on output tax) or 'cash'.
 * Range (about 80%): the larger of ±1.28 sd of the jurisdiction's monthly log growth so far, the error the same
 * method made a year earlier at the same month, and 3%; applied to all remaining months together.
 * @param {{ base: object, fy: string, asOf: number, measure?: 'discharged'|'cash', targets?: object[], scenario?: object }} o
 */
export function trajectory({ base, fy, asOf, measure = 'discharged', targets = [], scenario = {}, _inner = false }) {
  const prevFy = `${Number(fy.slice(0, 4)) - 1}-${fy.slice(0, 4)}`;
  const val = (c, g) => { const t = c?.byTp[g]; if (!t) return 0; return measure === 'cash' ? t.regular : t.regular + t.itc; };
  const monthsOf = (y) => MONTHS.map((_, m) => base.months.find((c) => c.fy === y && c.m === m));
  const cur = monthsOf(fy), prev = monthsOf(prevFy);
  const gstins = [...new Set(base.months.filter((c) => c.fy === fy || c.fy === prevFy).flatMap((c) => Object.keys(c.byTp)))];
  const jur = (arr, m) => sum(gstins, (g) => val(arr[m], g));
  // Jurisdiction ratio so far (the fallback for a taxpayer whose own ratio cannot be formed)
  const ytdA = sum(MONTHS.slice(0, asOf), (_, m) => jur(cur, m)), ytdL = sum(MONTHS.slice(0, asOf), (_, m) => jur(prev, m));
  const jRatio = ytdL ? ytdA / ytdL : 1;
  const per = gstins.map((g) => {
    const A = MONTHS.map((_, m) => val(cur[m], g)), P = MONTHS.map((_, m) => val(prev[m], g));
    const a = sum(A.slice(0, asOf)), p = sum(P.slice(0, asOf));
    const active = A.slice(0, asOf).filter((x) => x > 0);
    let method = p > 0 && a >= 0 ? 'growth so far' : sum(P) > 0 ? 'jurisdiction growth' : active.length ? 'average so far' : 'none';
    let ratio = method === 'growth so far' ? a / p : jRatio;
    if (method === 'growth so far' && asOf >= 4) {
      const a3 = sum(A.slice(asOf - 3, asOf)), p3 = sum(P.slice(asOf - 3, asOf));
      const r3 = p3 > 0 ? a3 / p3 : null;
      if (r3 !== null && (r3 === 0 || Math.abs(Math.log(r3 / Math.max(ratio, 1e-9))) > Math.log(1.25))) { method = r3 === 0 ? 'stopped (last 3 months nil)' : 'recent level (step change)'; ratio = r3; }
    }
    const k = scenario[g] ?? 1;
    const F = MONTHS.map((_, m) => (m < asOf ? null : method === 'average so far' ? (sum(active) / active.length) * k : P[m] * ratio * k));
    return { gstin: g, name: nameOf(base, g), method, ratio, A, P, F, ytd: a, lastYear: sum(P), forecastRest: sum(F.filter((x) => x !== null)), actualRest: sum(A.slice(asOf)), scenario: k };
  });
  // Range from the dispersion of monthly ratios so far
  const logs = MONTHS.slice(0, asOf).map((_, m) => { const a = jur(cur, m), p = jur(prev, m); return a > 0 && p > 0 ? Math.log(a / p) : null; }).filter((x) => x !== null);
  const mean = logs.length ? sum(logs) / logs.length : 0;
  const sd = logs.length > 1 ? Math.sqrt(sum(logs, (x) => (x - mean) ** 2) / (logs.length - 1)) : 0.1;
  // The same method one year earlier, at the same month, scored against what then happened.
  const prior = asOf < 12 && !_inner && base.years.includes(`${Number(prevFy.slice(0, 4)) - 1}-${prevFy.slice(0, 4)}`)
    ? trajectory({ base, fy: prevFy, asOf, measure, _inner: true }).backtest : null;
  const width = Math.max(1.28 * sd, prior ? Math.abs(prior.error) : 0, 0.03);
  const z = 1, sdW = width; // band = forecast × e^(±width)
  const monthly = MONTHS.map((label, m) => {
    const f = m < asOf ? null : sum(per, (t) => t.F[m]);
    return { m, label, actual: m < asOf ? jur(cur, m) : null, actualLater: m >= asOf && cur[m] ? jur(cur, m) : null, lastYear: jur(prev, m), forecast: f, low: f === null ? null : f * Math.exp(-z * sdW), high: f === null ? null : f * Math.exp(z * sdW) };
  });
  const tg = latestTargets(targets, fy);
  monthly.forEach((x) => { x.target = tg[x.m] ?? null; });
  let run = 0, runT = 0;
  monthly.forEach((x) => { run += x.actual ?? x.forecast ?? 0; runT += x.target ?? 0; x.cumulative = run; x.cumulativeTarget = tg.length ? runT : null; });
  const ytd = sum(monthly.filter((x) => x.m < asOf), (x) => x.actual);
  const rest = sum(monthly.filter((x) => x.m >= asOf), (x) => x.forecast);
  const expected = ytd + rest;
  const range = [ytd + rest * Math.exp(-z * sdW), ytd + rest * Math.exp(z * sdW)];
  const target = tg.length ? sum(tg) : null;
  const lastYearTotal = sum(monthly, (x) => x.lastYear);
  // Drivers: each taxpayer's expected change on last year; the largest movers named, the rest pooled.
  const moves = per.map((t) => ({ gstin: t.gstin, name: t.name, lastYear: t.lastYear, expected: t.ytd + t.forecastRest, change: t.ytd + t.forecastRest - t.lastYear, method: t.method, ratio: t.ratio })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const top = moves.slice(0, 6), others = moves.slice(6);
  const drivers = [...top, ...(others.length ? [{ gstin: null, name: `${others.length} others`, change: sum(others, (x) => x.change), lastYear: sum(others, (x) => x.lastYear), expected: sum(others, (x) => x.expected) }] : [])];
  // Sensitivity: what ±10% on each of the five largest expected contributors does to the year
  const sensitivity = [...moves].sort((a, b) => b.expected - a.expected).slice(0, 5).map((t) => { const restT = per.find((p) => p.gstin === t.gstin).forecastRest; return { gstin: t.gstin, name: t.name, share: expected ? t.expected / expected : 0, plus10: restT * 0.1, minus10: -restT * 0.1 }; });
  // Backtest: when the rest of the year is already in the data, how did the forecast do?
  const known = monthly.filter((x) => x.m >= asOf && x.actualLater !== null);
  const backtest = known.length === 12 - asOf && asOf < 12 ? {
    actualRest: sum(known, (x) => x.actualLater), forecastRest: rest,
    error: rest ? (sum(known, (x) => x.actualLater) - rest) / rest : null,
    coverage: known.filter((x) => x.actualLater >= x.low && x.actualLater <= x.high).length / known.length,
    withinRange: sum(known, (x) => x.actualLater) + ytd >= range[0] && sum(known, (x) => x.actualLater) + ytd <= range[1],
    worst: [...per].map((t) => ({ name: t.name, gstin: t.gstin, miss: t.actualRest - t.forecastRest })).sort((a, b) => Math.abs(b.miss) - Math.abs(a.miss)).slice(0, 4),
  } : null;
  return {
    fy, prevFy, asOf, asOfLabel: asOf ? MONTHS[asOf - 1] : '-', measure, method: `Same month last year × each taxpayer's growth so far (${asOf} month${asOf === 1 ? '' : 's'})`,
    monthly, ytd, rest, expected, range, sd, width, priorError: prior ? prior.error : null, lastYearTotal, target, gap: target === null ? null : target - expected, gapRange: target === null ? null : [target - range[1], target - range[0]],
    drivers, sensitivity, backtest, perTaxpayer: per.map(({ A, P, F, ...t }) => t),
  };
}
const nameOf = (base, g) => base.byTaxpayer.find((t) => t.gstin === g)?.name || g;

/** Monthly targets for a year: the highest version for each month; an annual row is spread evenly when no months are given. */
export function latestTargets(targets, fy) {
  const rows = targets.filter((t) => fyKey(t.fy) === fy);
  if (!rows.length) return [];
  const best = (list) => list.sort((a, b) => String(b.version).localeCompare(String(a.version), undefined, { numeric: true }))[0];
  const monthly = MONTHS.map((mn) => { const r = rows.filter((t) => t.month === mn); return r.length ? best(r).target : null; });
  if (monthly.every((x) => x !== null)) return monthly;
  const annual = rows.filter((t) => !t.month);
  return annual.length ? MONTHS.map(() => best(annual).target / 12) : monthly.map((x) => x ?? 0);
}
const fyKey = (s) => { const y = Number(String(s).slice(0, 4)); return `${y}-${y + 1}`; };
