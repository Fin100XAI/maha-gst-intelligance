// Risk scoring + portfolio statistics. No xlsx dependency, so the UI can re-score live
// when an officer changes weights on the Scoring page.

export const DEFAULT_SCORING = {
  fail: { High: 8, Med: 4, Low: 1.5 },
  reviewFactor: 0.35,
  fraudWeight: 6,
  exposureCap: 20,
  exposureMultiplier: 4,
  bands: { Moderate: 25, High: 45, Critical: 70 },
  excluded: [],
};

const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);

export function scoreOf(a, cfg = DEFAULT_SCORING, severity = {}) {
  const ex = new Set(cfg.excluded || []);
  let score = 0;
  for (const r of a.results) {
    if (ex.has(r.id)) continue;
    const w = cfg.fail[severity[r.id] || 'Med'] ?? 4;
    if (r.status === 'Fail') score += w; else if (r.status === 'Review') score += w * cfg.reviewFactor;
  }
  // Review prompts (turnover spike, Sunday invoicing) are shown but never scored.
  score += sum(a.fraud.filter((f) => f.flagged && !f.prompt && !ex.has(`FR:${f.key}`)), (f) => cfg.fraudWeight * f.weight);
  const t = a.profile.turnover;
  score += Math.min(cfg.exposureCap, (t ? (a.exposure.confirmed / t) * 100 : 0) * cfg.exposureMultiplier);
  score = Math.min(100, Math.round(score));
  const b = cfg.bands;
  const band = score >= b.Critical ? 'Critical' : score >= b.High ? 'High' : score >= b.Moderate ? 'Moderate' : 'Low';
  return { score, band };
}

// Point contributions behind scoreOf, same arithmetic, for explaining a score. score = min(100, round(raw)).
export function scoreParts(a, cfg = DEFAULT_SCORING, severity = {}) {
  const ex = new Set(cfg.excluded || []);
  const pts = { High: 0, Med: 0, Low: 0, review: 0, indicators: 0, exposure: 0 };
  for (const r of a.results) {
    if (ex.has(r.id)) continue;
    const sev = severity[r.id] || 'Med';
    const w = cfg.fail[sev] ?? 4;
    if (r.status === 'Fail') pts[sev in pts ? sev : 'Med'] += w; else if (r.status === 'Review') pts.review += w * cfg.reviewFactor;
  }
  pts.indicators = sum(a.fraud.filter((f) => f.flagged && !f.prompt && !ex.has(`FR:${f.key}`)), (f) => cfg.fraudWeight * f.weight);
  const t = a.profile.turnover;
  pts.exposure = Math.min(cfg.exposureCap, (t ? (a.exposure.confirmed / t) * 100 : 0) * cfg.exposureMultiplier);
  const raw = pts.High + pts.Med + pts.Low + pts.review + pts.indicators + pts.exposure;
  return {
    raw, score: Math.min(100, Math.round(raw)),
    parts: [
      { key: 'High', label: 'Failed · high severity', points: pts.High },
      { key: 'Med', label: 'Failed · medium', points: pts.Med },
      { key: 'Low', label: 'Failed · low', points: pts.Low },
      { key: 'review', label: 'Review checks', points: pts.review },
      { key: 'indicators', label: 'Risk indicators', points: pts.indicators },
      { key: 'exposure', label: 'Exposure ÷ turnover', points: pts.exposure },
    ],
  };
}

export function pearson(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const mx = sum(x) / n, my = sum(y) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

// Portfolio-level metrics (one row per taxpayer) + cross-taxpayer correlation
export function portfolio(list) {
  const metrics = [
    ['turnover', 'Turnover'], ['itcToOutput', 'ITC / output tax'], ['cashPct', 'Cash share of liability'], ['suppliers', 'Suppliers'], ['customers', 'Customers'],
    ['supplierHHI', 'Supplier concentration'], ['itcGapPct', 'ITC excess over 2B %'], ['taxGapPct', 'GSTR-1 vs 3B gap %'], ['score', 'Risk score'],
  ];
  const rows = list.map((a) => ({
    id: a.id, name: a.name, turnover: a.profile.turnover, itcToOutput: a.profile.itcToOutput, cashPct: a.profile.cashPct, suppliers: a.profile.suppliers, customers: a.profile.customers,
    supplierHHI: a.profile.supplierHHI, score: a.score,
    itcGapPct: (() => { const c = sum(a.periodRecon, (r) => r.itcClaim), b = sum(a.periodRecon, (r) => r.itc2b); return b ? ((c - b) / b) * 100 : 0; })(),
    taxGapPct: (() => { const g1 = sum(a.periodRecon, (r) => r.g1Tax), g3 = sum(a.periodRecon, (r) => r.g3bTax); return g3 ? ((g1 - g3) / g3) * 100 : 0; })(),
  }));
  const cells = [];
  for (const [a] of metrics) for (const [b] of metrics) cells.push({ a, b, r: pearson(rows.map((x) => x[a]), rows.map((x) => x[b])) });
  return { metrics: metrics.map(([k, l]) => ({ k, l })), rows, cells, n: rows.length };
}
