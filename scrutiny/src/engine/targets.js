// Revenue targets below the jurisdiction, sector movement and concentration (capabilities 2, 3 and 4). Pure.
//
// Targets are administrative goals, never a taxpayer's liability. The department approves how a jurisdiction target
// is shared out; until an approved allocation is loaded, this offers transparent, stated methods:
//   priorShare  each unit's share of last year's collection
//   avg3        each unit's share of the average of up to three earlier years
// A unit is a range, an officer, a sector or a taxpayer (from the taxpayer master). Allocations always add back to
// the jurisdiction target; taxpayers missing from the master fall in "Unassigned".
import { trajectory, latestTargets, MONTHS } from './collections.js';

const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
export const METHODS = {
  priorShare: 'Share of last year’s collection',
  avg3: 'Share of the average of up to three earlier years',
};
export const UNITS = { range: 'Range', officer: 'Officer', sector: 'Sector', taxpayer: 'Taxpayer' };

const valueOf = (c, g) => { const t = c?.byTp[g]; return t ? t.regular + t.itc : 0; };
const yearTotal = (base, fy, g) => sum(base.months.filter((c) => c.fy === fy), (c) => valueOf(c, g));

/**
 * @param {{ base: object, master: object[], targets: object[], fy: string, asOf: number, by?: string, method?: string }} o
 */
export function targetPosition({ base, master, targets, fy, asOf, by = 'range', method = 'priorShare' }) {
  const monthly = latestTargets(targets, fy);
  if (!monthly.length) return null;
  const target = sum(monthly);
  const targetToDateJur = sum(monthly.slice(0, asOf));
  const tr = trajectory({ base, fy, asOf, targets });
  const gstins = tr.perTaxpayer.map((t) => t.gstin);
  const reg = new Map(master.map((m) => [m.gstin, m]));
  const unitOf = (g) => (by === 'taxpayer' ? g : reg.get(g)?.[by] || 'Unassigned');
  const y0 = Number(fy.slice(0, 4));
  const earlier = [1, 2, 3].map((k) => `${y0 - k}-${y0 - k + 1}`).filter((y) => base.years.includes(y));
  const basis = (g) => (method === 'avg3' && earlier.length ? sum(earlier, (y) => yearTotal(base, y, g)) / earlier.length : earlier.length ? yearTotal(base, earlier[0], g) : 0);
  const basisTotal = sum(gstins, basis);
  const units = new Map();
  for (const t of tr.perTaxpayer) {
    const u = unitOf(t.gstin);
    const row = units.get(u) || units.set(u, { unit: u, label: by === 'taxpayer' ? t.name : u, members: [], basis: 0, actualToDate: 0, expected: 0, lastYear: 0 }).get(u);
    row.members.push({ gstin: t.gstin, name: t.name });
    row.basis += basis(t.gstin);
    row.actualToDate += t.ytd;
    row.expected += t.ytd + t.forecastRest;
    row.lastYear += t.lastYear;
  }
  // New registrants have no basis; a unit made only of them gets no allocation, and says so.
  const rows = [...units.values()].map((r) => {
    const share = basisTotal ? r.basis / basisTotal : 0;
    const tgt = target * share, tgtToDate = targetToDateJur * share;
    return { ...r, share, target: tgt, targetToDate: tgtToDate, gapToDate: tgtToDate - r.actualToDate, gap: tgt - r.expected, attainmentToDate: tgtToDate ? r.actualToDate / tgtToDate : null, noBasis: r.basis === 0 };
  });
  const gapTotal = sum(rows, (r) => r.gap);
  for (const r of rows) r.gapShare = gapTotal ? r.gap / gapTotal : 0;
  rows.sort((a, b) => b.gap - a.gap);
  return {
    fy, asOf, asOfLabel: MONTHS[asOf - 1], by, method, methodLabel: METHODS[method], basisYears: method === 'avg3' ? earlier : earlier.slice(0, 1),
    target, targetToDate: targetToDateJur, actualToDate: tr.ytd, expected: tr.expected, gap: tr.gap, range: tr.range,
    rows, reconciles: Math.abs(sum(rows, (r) => r.target) - target) < 1,
    assumptions: [
      `Allocation: ${METHODS[method]}${earlier.length ? ` (FY ${(method === 'avg3' ? earlier : earlier.slice(0, 1)).join(', FY ')})` : ''}. Not a department-approved allocation.`,
      'Target to date follows the jurisdiction’s monthly target profile, scaled by each unit’s share.',
      'Expected year: actual to date plus each taxpayer’s forecast (the Collections method).',
      'Collection measured as liability discharged (cash + ITC), the basis the targets register states.',
    ],
  };
}

/** Year-on-year movement by sector, with each taxpayer's growth against its sector's median (peer context). */
export function sectorMovement({ base, master, fy }) {
  const prev = `${Number(fy.slice(0, 4)) - 1}-${fy.slice(0, 4)}`;
  const reg = new Map(master.map((m) => [m.gstin, m]));
  const gstins = [...new Set(base.months.filter((c) => c.fy === fy || c.fy === prev).flatMap((c) => Object.keys(c.byTp)))];
  const tps = gstins.map((g) => {
    const cur = yearTotal(base, fy, g), was = yearTotal(base, prev, g);
    return { gstin: g, name: base.byTaxpayer.find((t) => t.gstin === g)?.name || g, sector: reg.get(g)?.sector || 'Not in master', current: cur, prior: was, change: cur - was, growth: was > 0 ? cur / was - 1 : null };
  });
  const sectors = new Map();
  for (const t of tps) (sectors.get(t.sector) || sectors.set(t.sector, []).get(t.sector)).push(t);
  const rows = [...sectors.entries()].map(([sector, ts]) => {
    const prior = sum(ts, (t) => t.prior), current = sum(ts, (t) => t.current);
    return { sector, taxpayers: ts.length, prior, current, change: current - prior, growth: prior > 0 ? current / prior - 1 : null, medianGrowth: median(ts.map((t) => t.growth).filter((x) => x !== null)) };
  }).sort((a, b) => a.change - b.change);
  for (const t of tps) {
    const s = rows.find((r) => r.sector === t.sector);
    t.vsPeers = t.growth !== null && s.medianGrowth !== null && s.taxpayers > 1 ? t.growth - s.medianGrowth : null;
  }
  return { fy, prev, rows, taxpayers: tps.sort((a, b) => a.change - b.change) };
}

/**
 * How concentrated the collection is: top-5 and top-10 shares, how many taxpayers make 80%, the Herfindahl-Hirschman
 * index (0-10,000) and the cumulative (Pareto) curve.
 */
export function concentration({ base, fy }) {
  const gstins = [...new Set(base.months.filter((c) => c.fy === fy).flatMap((c) => Object.keys(c.byTp)))];
  const vals = gstins.map((g) => ({ gstin: g, name: base.byTaxpayer.find((t) => t.gstin === g)?.name || g, value: yearTotal(base, fy, g) })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  const total = sum(vals, (x) => x.value);
  let run = 0;
  const curve = vals.map((x, i) => { run += x.value; return { rank: i + 1, name: x.name, gstin: x.gstin, value: x.value, share: x.value / total, cumulative: run / total }; });
  return {
    fy, taxpayers: vals.length, total,
    top5: sum(curve.slice(0, 5), (x) => x.share), top10: sum(curve.slice(0, 10), (x) => x.share),
    to80: (curve.findIndex((x) => x.cumulative >= 0.8) + 1) || vals.length,
    hhi: Math.round(sum(curve, (x) => (x.share * 100) ** 2)), curve,
  };
}
