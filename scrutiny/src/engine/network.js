// Counterparty and network intelligence (capabilities 10-15). Pure: no I/O, no clock.
//
//   tradeOf(tp)              one parsed workbook -> compact trade record (run at build time; invoices stay on the server)
//   graphOf(trades)          all trade records -> the buyer-seller graph kept in data.json
//   resolveEntities(g, m)    GSTINs -> entities (same PAN), name variants, review queue           (capability 10)
//   paths(g, root, opts)     material multi-hop paths from a taxpayer, up- or downstream          (capability 12)
//   detectAnomalies(g, ...)  cycles, reciprocity, pass-through, abrupt formation, status, ...     (capability 13)
//   exposureFunnel(...)      universe -> material -> anomalous -> unresolved, no double counting   (capability 14)
//   counterpartyCard(...)    authenticity checks and a two-sided evidence matrix                  (capabilities 11, 15)
//
// Nothing here labels an entity fake. Outputs are evidence states for an officer to verify.
import { gstinValid } from './gstin.js';

// Lower-case a label's first letter for use mid-sentence, keeping acronyms (GSTR-3B, GSTIN) intact.
const lowerFirst = (t) => String(t).split(' ').map((w) => (/^[A-Z][a-z]/.test(w) ? w.toLowerCase() : w)).join(' ');
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const r0 = (v) => Math.round(v);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const DAY = 864e5;

/** Materiality: a relationship matters when it is at least ₹10 lakh a year or 5% of the taxpayer's side. */
export const MATERIAL = { value: 1e6, share: 0.05 };

// ------------------------------------------------------------------ build time: one workbook -> trade record
/**
 * Compact trade record for one GSTIN and year: per-counterparty monthly values on each side, invoice timing on the
 * purchase side (for status-at-transaction-time checks), the months GSTR-3B was filed, and a FIFO flow model of how
 * fast purchases leave as sales (pass-through).
 * @param {object} tp  output of parseWorkbook()
 */
export function tradeOf(tp) {
  const start = Date.UTC(tp.fyStart, 3, 1);
  const day = (iso) => (iso ? Math.round((Date.parse(iso) - start) / DAY) : null);
  const blank = (name) => ({ name: String(name || '').trim(), months: new Array(12).fill(0), taxable: 0, tax: 0, invoices: 0 });
  const sales = {}, purchases = {};

  for (const x of tp.b2b) {
    if (!x.gstin) continue;
    const c = (sales[x.gstin] ||= { ...blank(x.party), irn: 0 });
    c.months[x.m] += x.taxable; c.taxable += x.taxable; c.tax += x.tax; c.invoices += 1; if (x.irn) c.irn += 1;
  }
  for (const x of tp.cdn) {
    if (!x.gstin) continue;
    const s = x.noteType === 'C' ? -1 : 1;
    const c = (sales[x.gstin] ||= { ...blank(x.party), irn: 0 });
    c.months[x.m] += s * x.taxable; c.taxable += s * x.taxable; c.tax += s * x.tax;
  }
  // Purchases as the buyer's GSTR-2B shows them; whether the supplier filed GSTR-3B comes from GSTR-2A.
  const filed3B = new Map(tp.g2a.map((x) => [`${x.gstin}|${x.no}`, x.supplier3B]));
  for (const x of tp.g2b) {
    const c = (purchases[x.gstin] ||= { ...blank(x.party), itc: 0, notFiled: { invoices: 0, tax: 0, months: [] }, inv: [] });
    c.months[x.m] += x.taxable; c.taxable += x.taxable; c.tax += x.tax; c.invoices += 1;
    if (x.itcAvail && !x.rc) c.itc += x.tax;
    if (filed3B.get(`${x.gstin}|${x.no}`) === false) { c.notFiled.invoices += 1; c.notFiled.tax += x.tax; if (!c.notFiled.months.includes(x.m)) c.notFiled.months.push(x.m); }
    c.inv.push([day(x.date), r0(x.taxable), r0(x.tax)]);
  }
  for (const x of tp.g2bCdn) {
    const c = purchases[x.gstin]; if (!c) continue;
    const s = x.noteType === 'C' ? -1 : 1;
    c.months[x.m] += s * x.taxable; c.taxable += s * x.taxable; c.tax += s * x.tax; if (x.itcAvail && !x.rc) c.itc += s * x.tax;
  }
  const round = (o) => { for (const c of Object.values(o)) { c.months = c.months.map(r0); c.taxable = r0(c.taxable); c.tax = r0(c.tax); if (c.itc !== undefined) c.itc = r0(c.itc); if (c.notFiled) c.notFiled.tax = r0(c.notFiled.tax); if (c.inv) c.inv.sort((a, b) => a[0] - b[0]); } return o; };

  // GSTR-3B periods are month indices; a quarterly (QRMP) filer's periods all end a quarter and cover three months.
  const quarterly = tp.periods.length > 0 && tp.periods.every((p) => p % 3 === 2) && tp.periods.length <= 4;
  const filedMonths = [...new Set(tp.periods.flatMap((p) => (quarterly ? [p - 2, p - 1, p] : [p])))].sort((a, b) => a - b);
  return {
    gstin: tp.gstin, name: tp.name, fy: tp.fy, fyStart: tp.fyStart, asOf: tp.created || null,
    filedMonths, g1Months: [...new Set(tp.b2b.map((x) => x.m))].sort((a, b) => a - b),
    sales: round(sales), purchases: round(purchases), flow: fifoFlow(tp, day),
  };
}

/**
 * FIFO stock model in value terms: every sale draws down the oldest purchases still in stock, scaled by the year's
 * sales-to-purchases ratio so a manufacturer's value addition does not look like fast turnover. Gives the typical
 * days between buying and selling, and which supplier's goods went to which customer.
 */
function fifoFlow(tp, day) {
  const buys = tp.g2b.filter((x) => !x.rc && x.date && x.taxable > 0).map((x) => ({ d: day(x.date), v: x.taxable, from: x.gstin })).sort((a, b) => a.d - b.d);
  const sells = tp.b2b.filter((x) => !x.rc && x.date && x.taxable > 0 && x.gstin).map((x) => ({ d: day(x.date), v: x.taxable, to: x.gstin })).sort((a, b) => a.d - b.d);
  const inV = sum(buys, (x) => x.v), outV = sum(sells, (x) => x.v);
  if (!inV || !outV) return { purchases: r0(inV), sales: r0(outV), ratio: null, lagMedian: null, lagP75: null, pairs: [] };
  const ratio = outV / inV;
  const queue = buys.map((b) => ({ ...b, left: b.v }));
  let qi = 0;
  const lags = []; // [lag days, value]
  const pairs = new Map();
  let unmatched = 0;
  for (const s of sells) {
    let need = s.v / ratio;
    // only stock already bought can be sold: a sale before any purchase in stock stays unmatched
    while (need > 1e-6 && qi < queue.length && queue[qi].d <= s.d) {
      const b = queue[qi];
      const take = Math.min(need, b.left);
      const lag = s.d - b.d;
      lags.push([lag, take]);
      const k = `${b.from}>${s.to}`;
      const p = pairs.get(k) || pairs.set(k, { from: b.from, to: s.to, value: 0, lagSum: 0 }).get(k);
      p.value += take; p.lagSum += take * lag;
      b.left -= take; need -= take;
      if (b.left <= 1e-6) qi += 1;
    }
    unmatched += need;
  }
  const wq = (q) => { const s = [...lags].sort((a, b) => a[0] - b[0]); const tot = sum(s, (x) => x[1]); let acc = 0; for (const [l, v] of s) { acc += v; if (acc >= q * tot) return l; } return null; };
  return {
    purchases: r0(inV), sales: r0(outV), ratio, matchedShare: 1 - unmatched / (outV / ratio),
    lagMedian: wq(0.5), lagP75: wq(0.75),
    pairs: [...pairs.values()].filter((p) => p.value >= 0.01 * inV).map((p) => ({ from: p.from, to: p.to, value: r0(p.value), lag: +(p.lagSum / p.value).toFixed(1) })).sort((a, b) => b.value - a.value),
  };
}

// ------------------------------------------------------------------ the graph
/**
 * Merge trade records into one graph per financial year. An edge (seller -> buyer) keeps both sides where both
 * returns are loaded: what the seller reported in GSTR-1 and what the buyer's GSTR-2B shows.
 * @param {object[]} trades  tradeOf() output for every loaded GSTIN-year
 * @returns {{ years: string[], nodes: object, edges: object[], trades: object }}
 */
export function graphOf(trades) {
  const nodes = {};
  const node = (g, name) => (nodes[g] ||= { gstin: g, pan: g.slice(2, 12), state: g.slice(0, 2), names: {}, loaded: [], valid: gstinValid(g) });
  const edges = new Map();
  const edge = (from, to, fy) => {
    const k = `${from}>${to}|${fy}`;
    return edges.get(k) || edges.set(k, { id: k, from, to, fy, seller: null, buyer: null }).get(k);
  };
  const byGstinYear = {};
  for (const t of trades) {
    const n = node(t.gstin); n.names[t.name] = (n.names[t.name] || 0) + 1000; // the taxpayer's own banner name wins
    n.loaded.push(t.fy);
    byGstinYear[`${t.gstin}|${t.fy}`] = { filedMonths: t.filedMonths, g1Months: t.g1Months, asOf: t.asOf, flow: t.flow, fyStart: t.fyStart };
    for (const [to, c] of Object.entries(t.sales)) {
      node(to).names[c.name] = (node(to).names[c.name] || 0) + 1;
      edge(t.gstin, to, t.fy).seller = { months: c.months, taxable: c.taxable, tax: c.tax, invoices: c.invoices, irn: c.irn };
    }
    for (const [from, c] of Object.entries(t.purchases)) {
      node(from).names[c.name] = (node(from).names[c.name] || 0) + 1;
      edge(from, t.gstin, t.fy).buyer = { months: c.months, taxable: c.taxable, tax: c.tax, itc: c.itc, invoices: c.invoices, notFiled: c.notFiled, inv: c.inv };
    }
  }
  for (const n of Object.values(nodes)) {
    n.name = Object.entries(n.names).sort((a, b) => b[1] - a[1])[0]?.[0] || n.gstin;
    n.variants = Object.keys(n.names).filter((x) => x && x !== n.name);
    delete n.names;
    n.loaded.sort();
  }
  const list = [...edges.values()].map((e) => ({ ...e, taxable: Math.max(e.seller?.taxable ?? -Infinity, e.buyer?.taxable ?? -Infinity), tax: Math.max(e.seller?.tax ?? -Infinity, e.buyer?.tax ?? -Infinity) }));
  const years = [...new Set(list.map((e) => e.fy))].sort();
  return { years, nodes, edges: list, trades: byGstinYear };
}

// ------------------------------------------------------------------ one year of the graph
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const L = (v) => {
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)} L`;
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`;
};
const pct = (v) => `${(v * 100).toFixed(0)}%`;
const nameOf = (g, x) => g.nodes[x]?.name || x;
const monthsOf = (e) => (e.buyer || e.seller).months;

/** Edges of one financial year, indexed by seller and buyer, with each node's yearly totals. */
export function yearView(g, fy) {
  const edges = g.edges.filter((e) => e.fy === fy);
  const out = new Map(), inn = new Map(), totals = new Map();
  const tot = (x) => totals.get(x) || totals.set(x, { sales: 0, purchases: 0 }).get(x);
  for (const e of edges) {
    (out.get(e.from) || out.set(e.from, []).get(e.from)).push(e);
    (inn.get(e.to) || inn.set(e.to, []).get(e.to)).push(e);
    tot(e.from).sales += e.taxable; tot(e.to).purchases += e.taxable;
  }
  return { fy, edges, out, in: inn, totals, byId: new Map(edges.map((e) => [e.id, e])) };
}
export const isMaterial = (e, v) => e.taxable >= MATERIAL.value
  || e.taxable >= MATERIAL.share * Math.max(1, v.totals.get(e.from)?.sales || 0)
  || e.taxable >= MATERIAL.share * Math.max(1, v.totals.get(e.to)?.purchases || 0);

// ------------------------------------------------------------------ capability 10: entity resolution
const SUFFIX = /\b(PRIVATE|PVT|LIMITED|LTD|LLP|CO|COMPANY|AND|THE|MS)\b/g;
const tokens = (name) => new Set(String(name).toUpperCase().replace(/\[[^\]]*\]/g, ' ').replace(/[^A-Z0-9 ]+/g, ' ').replace(SUFFIX, ' ').split(/\s+/).filter((t) => t.length > 1));
const jaccard = (a, b) => { if (!a.size || !b.size) return 0; let n = 0; for (const t of a) if (b.has(t)) n += 1; return n / (a.size + b.size - n); };

/**
 * GSTINs -> entities. Deterministic first: registrations sharing a PAN are one legal person (linked, each GSTIN kept).
 * Probabilistic matches (similar names under different PANs, one GSTIN reported under dissimilar names, an invalid
 * GSTIN) are never merged: they go to a review queue with their evidence and a confidence.
 * @param {object} g        graphOf() output
 * @param {object[]} master taxpayer master register records (optional)
 */
export function resolveEntities(g, master = []) {
  const reg = new Map(master.map((r) => [r.gstin, r]));
  const byPan = new Map();
  for (const n of Object.values(g.nodes)) {
    const key = PAN_RE.test(n.pan) ? n.pan : `?${n.gstin}`;
    (byPan.get(key) || byPan.set(key, []).get(key)).push(n);
  }
  const entities = [...byPan.entries()].map(([pan, list]) => ({
    id: pan.startsWith('?') ? list[0].gstin : pan,
    pan: pan.startsWith('?') ? null : pan,
    name: (list.find((n) => n.loaded.length) || list[0]).name,
    gstins: list.map((n) => ({ gstin: n.gstin, state: n.state, name: n.name, loaded: n.loaded.length > 0, status: reg.get(n.gstin)?.status || null, jurisdiction: reg.get(n.gstin)?.jurisdiction || null })).sort((a, b) => a.gstin.localeCompare(b.gstin)),
    names: [...new Set(list.flatMap((n) => [n.name, ...n.variants, reg.get(n.gstin)?.legalName].filter(Boolean)))],
    link: list.length > 1 ? { method: 'same PAN', confidence: 'deterministic', evidence: `Characters 3–12 of each GSTIN are the PAN ${pan}: one legal person registered ${new Set(list.map((n) => n.state)).size > 1 ? 'in more than one state' : 'more than once in one state'}. Each GSTIN stays a separate taxable person (distinct-person supplies).` } : null,
  }));
  const review = [];
  // Same or similar names under different PANs. Token rarity decides: a name made only of common words ("OM",
  // "ENTERPRISES", "TRADERS") is no evidence of a link, so such matches are dropped rather than queued.
  const heads = entities.filter((e) => e.pan).map((e) => ({ e, t: tokens(e.name) })).filter((x) => x.t.size >= 2);
  const df = new Map();
  for (const x of heads) for (const t of x.t) df.set(t, (df.get(t) || 0) + 1);
  const rare = (t) => (df.get(t) || 0) <= 3;
  const exact = new Map();
  for (const x of heads) { const k = [...x.t].sort().join(' '); (exact.get(k) || exact.set(k, []).get(k)).push(x); }
  for (const list of exact.values()) {
    if (list.length < 2 || ![...list[0].t].some((t) => (df.get(t) || 0) <= list.length + 1)) continue;
    review.push({ type: 'same-name', confidence: 0.8, gstins: list.flatMap((x) => x.e.gstins.map((y) => y.gstin)), names: list.map((x) => x.e.name), reason: `${list.length} different PANs trade under the same name (${list[0].e.name}): related businesses, or a name reused by unrelated parties. Not merged.` });
  }
  const block = new Map();
  for (const x of heads) for (const t of x.t) if (rare(t)) (block.get(t) || block.set(t, []).get(t)).push(x);
  const seen = new Set();
  for (const list of block.values()) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const k = [a.e.id, b.e.id].sort().join('|');
      if (seen.has(k) || [...a.t].sort().join(' ') === [...b.t].sort().join(' ')) continue;
      seen.add(k);
      const s = jaccard(a.t, b.t);
      if (s >= 0.6) review.push({ type: 'similar-names', confidence: +s.toFixed(2), gstins: [...a.e.gstins, ...b.e.gstins].map((x) => x.gstin), names: [a.e.name, b.e.name], reason: `Names are ${pct(s)} alike (sharing an uncommon word) but the PANs differ (${a.e.pan}, ${b.e.pan}): possibly related, possibly unrelated. Not merged.` });
    }
  }
  for (const n of Object.values(g.nodes)) {
    const far = n.variants.filter((x) => tokens(x).size && jaccard(tokens(x), tokens(n.name)) < 0.3);
    if (far.length) review.push({ type: 'name-variants', confidence: 0.5, gstins: [n.gstin], names: [n.name, ...far], reason: `Counterparties report this GSTIN under names that do not match (${far.slice(0, 3).join('; ')}): the GSTIN may have been keyed against the wrong party.` });
    if (n.valid === false) review.push({ type: 'invalid-gstin', confidence: 1, gstins: [n.gstin], names: [n.name], reason: 'The GSTIN fails its check digit, so it cannot be a real registration. Transactions reported against it need the correct GSTIN.' });
  }
  review.sort((a, b) => b.confidence - a.confidence);
  return { entities, review, stats: { gstins: Object.keys(g.nodes).length, entities: entities.length, linked: entities.filter((e) => e.link).length, review: review.length } };
}

// ------------------------------------------------------------------ capability 12: multi-hop paths
const edgeSummary = (e) => ({ id: e.id, from: e.from, to: e.to, taxable: e.taxable, tax: e.tax, itc: e.buyer?.itc ?? null, months: monthsOf(e), sides: [e.seller && 'seller GSTR-1', e.buyer && 'buyer GSTR-2B'].filter(Boolean) });

/**
 * Material paths from a taxpayer, several levels deep. Downstream follows buyers, upstream follows suppliers. At each
 * level only material edges (≥ minValue, or ≥ minShare of that node's flow) are expanded, at most maxBranch per node;
 * what is left out is counted, so nothing disappears silently. A path that returns to a node already on it stops
 * there and is marked.
 */
export function paths(g, root, { fy, direction = 'up', depth = 3, minValue = MATERIAL.value, minShare = MATERIAL.share, maxBranch = 8 } = {}) {
  const v = yearView(g, fy);
  const next = (x) => (direction === 'down' ? v.out.get(x) || [] : v.in.get(x) || []);
  const other = (e) => (direction === 'down' ? e.to : e.from);
  const expand = (x, level, onPath) => {
    const all = next(x).filter((e) => e.taxable > 0).sort((a, b) => b.taxable - a.taxable);
    const flow = sum(all, (e) => e.taxable);
    const keep = all.filter((e) => e.taxable >= minValue || e.taxable >= minShare * flow).slice(0, maxBranch);
    const left = all.filter((e) => !keep.includes(e));
    return {
      flow,
      pruned: { count: left.length, value: sum(left, (e) => e.taxable) },
      children: keep.map((e) => {
        const y = other(e);
        const loop = onPath.includes(y);
        const node = { gstin: y, name: nameOf(g, y), level, edge: edgeSummary(e), share: flow ? e.taxable / flow : 0, loopsTo: loop ? y : null, loaded: g.nodes[y]?.loaded.includes(fy) || false, children: [], pruned: { count: 0, value: 0 } };
        if (!loop && level < depth) Object.assign(node, expand(y, level + 1, [...onPath, y]));
        return node;
      }),
    };
  };
  return { root, name: nameOf(g, root), fy, direction, depth, ...expand(root, 1, [root]) };
}

// ------------------------------------------------------------------ capability 13: network anomalies
export const ANOMALY = {
  cycle: { label: 'Circular trade', severity: 'high' },
  passThrough: { label: 'Rapid pass-through', severity: 'high' },
  nonFiler: { label: 'Supplier invoicing without filing GSTR-3B', severity: 'high' },
  afterCancellation: { label: 'Invoices after cancellation or suspension', severity: 'high' },
  invalidGstin: { label: 'Invalid GSTIN', severity: 'medium' },
  reciprocal: { label: 'Reciprocal trade', severity: 'medium' },
  abrupt: { label: 'Abrupt network formation', severity: 'medium' },
  mismatch: { label: 'Seller and buyer records differ', severity: 'medium' },
  concentration: { label: 'Concentrated dependence', severity: 'low' },
  samePan: { label: 'Trade between registrations of one PAN', severity: 'low' },
};
const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

/**
 * Structures single-taxpayer ratios cannot show. Every anomaly carries the exact path, value, time window, the edges
 * behind it, why it is unusual and the baseline it is compared with (taken from the same data where possible).
 * Low-severity items are context (dependence, same-PAN trade), not suspicion on their own.
 * @param {object} g  graphOf() output
 * @param {{ fy: string, master?: object[] }} opts
 */
export function detectAnomalies(g, { fy, master = [] }) {
  const v = yearView(g, fy);
  const reg = new Map(master.map((r) => [r.gstin, r]));
  const trade = (x) => g.trades[`${x}|${fy}`];
  const fyStart = Number(String(fy).slice(0, 4));
  const found = [];
  // shape 'chain': path is a walk (a -> b -> c); 'star': path[0] is a hub and the rest are its counterparties.
  const add = (type, a) => found.push({ id: `${type}:${a.path.join('>')}`, type, ...ANOMALY[type], itc: 0, window: null, shape: 'chain', ...a });
  const material = v.edges.filter((e) => e.taxable > 0 && isMaterial(e, v));
  const mOut = new Map();
  for (const e of material) (mOut.get(e.from) || mOut.set(e.from, []).get(e.from)).push(e);
  const windowOf = (es) => { const act = MONTHS.map((_, m) => es.some((e) => monthsOf(e)[m] > 0)); const a = act.indexOf(true), b = act.lastIndexOf(true); return a < 0 ? null : { from: MONTHS[a], to: MONTHS[b] }; };
  const pairCount = new Set(material.map((x) => [x.from, x.to].sort().join('|'))).size;

  // Cycles of three or four parties among material edges; each found once, starting at its smallest GSTIN.
  const cycles = [];
  for (const s of [...mOut.keys()].sort()) {
    const walk = (x, pathE) => {
      for (const e of mOut.get(x) || []) {
        if (e.to === s && pathE.length >= 2) cycles.push([...pathE, e]);
        else if (e.to > s && pathE.length < 3 && !pathE.some((p) => p.from === e.to)) walk(e.to, [...pathE, e]);
      }
    };
    walk(s, []);
  }
  const onCycle = new Set(cycles.flat().map((e) => e.id));
  for (const c of cycles) {
    const vals = c.map((e) => e.taxable);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    add('cycle', {
      path: [...c.map((e) => e.from), c[0].from], edges: c.map((e) => e.id), value: lo, tax: sum(c, (e) => e.tax), itc: sum(c, (e) => e.buyer?.itc || 0), window: windowOf(c),
      why: `Goods and credit return to where they started within the year. The smallest leg is ${pct(lo / hi)} of the largest${lo / hi > 0.4 ? ': values of the same order go round the loop' : ''}.`,
      baseline: `${onCycle.size} of ${material.length} material relationships in ${fy} sit on a cycle.`,
      evidence: c.map((e) => `${nameOf(g, e.from)} → ${nameOf(g, e.to)}: ${L(e.taxable)} taxable, tax ${L(e.tax)}, reported by ${[e.seller && 'the seller', e.buyer && 'the buyer'].filter(Boolean).join(' and ')}`),
    });
  }

  // Reciprocal pairs: each sells to the other, both legs material.
  const recips = [];
  const done = new Set();
  for (const e of material) {
    const k = [e.from, e.to].sort().join('|');
    const back = material.find((f) => f.from === e.to && f.to === e.from);
    if (!back || done.has(k)) continue;
    done.add(k); recips.push([e, back]);
  }
  // Two-way trade is ordinary in services (freight, shipping, job work): it stays medium only when a party is also on
  // a cycle or a pass-through, otherwise it is context (set at the end, once those are known).
  for (const [e, back] of recips) {
    add('reciprocal', {
      path: [e.from, e.to, e.from], edges: [e.id, back.id], value: Math.min(e.taxable, back.taxable), tax: e.tax + back.tax, window: windowOf([e, back]),
      why: `Each sells to the other: ${L(e.taxable)} one way, ${L(back.taxable)} the other. Buying back from your own customer is uncommon outside job work or returns.`,
      baseline: `${recips.length} of ${pairCount} material trading pairs in ${fy} trade both ways.`,
      evidence: [`${nameOf(g, e.from)} → ${nameOf(g, e.to)}: ${L(e.taxable)}`, `${nameOf(g, back.from)} → ${nameOf(g, back.to)}: ${L(back.taxable)}`],
    });
  }

  // Rapid pass-through: loaded taxpayers whose purchases leave as sales within days at almost no mark-up.
  const flows = Object.entries(g.trades).filter(([k, t]) => k.endsWith(`|${fy}`) && t.flow?.ratio && t.flow.purchases >= 1e7).map(([k, t]) => [k.split('|')[0], t.flow]);
  const lagBase = median(flows.map(([, f]) => f.lagMedian).filter((x) => x !== null));
  const addBase = median(flows.map(([, f]) => f.ratio - 1));
  for (const [x, f] of flows) {
    // Half the goods gone within three days, sold at no more than 5% above cost.
    if (!(f.ratio <= 1.05 && f.lagMedian !== null && f.lagMedian <= 3)) continue;
    const top = f.pairs.slice(0, 4);
    const ids = [...new Set(top.flatMap((p) => [`${p.from}>${x}|${fy}`, `${x}>${p.to}|${fy}`]))].filter((id) => v.byId.has(id));
    const inEdges = ids.map((id) => v.byId.get(id)).filter((e) => e.to === x);
    add('passThrough', {
      path: [top[0]?.from || x, x, top[0]?.to || x], via: x, edges: ids, value: f.purchases, tax: sum(inEdges, (e) => e.tax), itc: sum(inEdges, (e) => e.buyer?.itc || 0), window: windowOf(v.in.get(x) || []),
      why: `${nameOf(g, x)} sells what it buys within ${f.lagMedian} day${f.lagMedian === 1 ? '' : 's'} (three quarters within ${f.lagP75}) at ${f.ratio >= 1 ? `${((f.ratio - 1) * 100).toFixed(1)}% above` : `${((1 - f.ratio) * 100).toFixed(1)}% below`} cost.`,
      baseline: `Across ${flows.length} loaded taxpayers in ${fy}, goods typically stay ${lagBase} days and sell ${(addBase * 100).toFixed(0)}% above cost.`,
      evidence: top.map((p) => `${nameOf(g, p.from)} → ${nameOf(g, x)} → ${nameOf(g, p.to)}: ${L(p.value)} of goods, ${p.lag} days on average`),
    });
  }

  // Suppliers invoicing in months with no GSTR-3B: their own returns when loaded, otherwise their buyers' GSTR-2A.
  for (const x of v.out.keys()) {
    const t = trade(x);
    const unfiled = t ? t.g1Months.filter((m) => !t.filedMonths.includes(m)) : [];
    const months = unfiled.length ? unfiled : [...new Set((v.out.get(x) || []).flatMap((e) => e.buyer?.notFiled?.months || []))].sort((a, b) => a - b);
    if (!months.length) continue;
    const sold = (v.out.get(x) || []).filter((e) => months.some((m) => monthsOf(e)[m] > 0));
    const inMonths = (e) => sum(months, (m) => monthsOf(e)[m]);
    const taxOf = (e) => { const side = e.seller || e.buyer; return side.taxable ? (inMonths(e) / side.taxable) * side.tax : 0; };
    const unpaid = sum(sold, taxOf);
    if (unpaid < 1e5) continue;
    add('nonFiler', {
      path: [x, ...sold.map((e) => e.to)], via: x, shape: 'star', spokes: 'buyers', edges: sold.map((e) => e.id), value: sum(sold, inMonths), tax: r0(unpaid), itc: r0(sum(sold, (e) => (e.buyer ? taxOf(e) : 0))), window: { from: MONTHS[months[0]], to: MONTHS[months[months.length - 1]] }, months,
      why: `${nameOf(g, x)} issued invoices for ${months.map((m) => MONTHS[m]).join(', ')} but filed no GSTR-3B for ${months.length > 1 ? 'those months' : 'that month'}: tax of ${L(unpaid)} charged to ${sold.length} buyer${sold.length > 1 ? 's' : ''} has not been declared.`,
      baseline: t ? `Its own returns: GSTR-1 for ${t.g1Months.length} months, GSTR-3B for ${t.filedMonths.length}.` : 'Seen through the buyers’ GSTR-2A filing status.',
      evidence: sold.map((e) => `${nameOf(g, e.to)} (${e.to}) bought ${L(inMonths(e))} in those months${e.buyer?.notFiled?.invoices ? `; its GSTR-2A marks ${e.buyer.notFiled.invoices} invoices (tax ${L(e.buyer.notFiled.tax)}) as supplier GSTR-3B not filed` : ''}`),
    });
  }

  // Invoices dated after the supplier's cancellation or suspension (taxpayer master register).
  for (const e of v.edges) {
    const r = reg.get(e.from);
    if (!r || !['Cancelled', 'Suspended'].includes(r.status) || !r.statusDate || !e.buyer?.inv) continue;
    const cut = Math.round((Date.parse(r.statusDate) - Date.UTC(fyStart, 3, 1)) / DAY);
    const late = e.buyer.inv.filter(([d]) => d !== null && d > cut);
    if (!late.length) continue;
    add('afterCancellation', {
      path: [e.from, e.to], edges: [e.id], value: sum(late, (x) => x[1]), tax: sum(late, (x) => x[2]), itc: sum(late, (x) => x[2]), window: windowOf([e]),
      why: `${nameOf(g, e.from)} was ${r.status.toLowerCase()} on ${r.statusDate}, yet ${late.length} invoice${late.length > 1 ? 's' : ''} to ${nameOf(g, e.to)} carry later dates.`,
      baseline: 'A cancelled or suspended registration cannot issue tax invoices, so credit on them is not admissible.',
      evidence: [`Taxpayer master: ${r.status} from ${r.statusDate}`, `${late.length} invoices after that date, taxable ${L(sum(late, (x) => x[1]))}, tax ${L(sum(late, (x) => x[2]))}`],
    });
  }

  // Abrupt network formation: a registration new this year that trades near its peak from its first month.
  for (const x of new Set(v.edges.flatMap((e) => [e.from, e.to]))) {
    const r = reg.get(x);
    const regDay = r?.registrationDate ? Date.parse(r.registrationDate) : null;
    const es = [...(v.out.get(x) || []), ...(v.in.get(x) || [])];
    // Without a registration date, "new" needs proof of absence: a trading partner whose earlier-year returns are
    // loaded and do not show this GSTIN. A partner loaded for one year only proves nothing.
    const partnerHadEarlierYear = es.some((e) => { const p = e.from === x ? e.to : e.from; return g.nodes[p]?.loaded.some((y) => y < fy); });
    const newThisYear = regDay !== null ? regDay >= Date.UTC(fyStart, 3, 1) && regDay < Date.UTC(fyStart + 1, 3, 1)
      : partnerHadEarlierYear && !g.edges.some((e) => e.fy < fy && (e.from === x || e.to === x));
    if (!newThisYear) continue;
    const monthly = MONTHS.map((_, m) => sum(es, (e) => monthsOf(e)[m]));
    const first = monthly.findIndex((y) => y > 0);
    if (first < 0) continue;
    const peak = Math.max(...monthly);
    if (monthly[first] < 0.5 * peak || monthly[first] < 2.5e6) continue;
    const parties = [...new Set(es.map((e) => (e.from === x ? e.to : e.from)))];
    const last = monthly.length - 1 - [...monthly].reverse().findIndex((y) => y > 0);
    add('abrupt', {
      path: [x, ...parties], via: x, shape: 'star', spokes: 'counterparties', edges: es.map((e) => e.id), value: sum(v.in.get(x) || [], (e) => e.taxable), tax: sum(v.in.get(x) || [], (e) => e.tax), itc: sum(v.in.get(x) || [], (e) => e.buyer?.itc || 0), window: { from: MONTHS[first], to: MONTHS[last] },
      why: `${nameOf(g, x)}${r?.registrationDate ? ` registered on ${r.registrationDate} and` : ' first appears this year and'} traded ${L(monthly[first])} in its first month, ${pct(monthly[first] / peak)} of its busiest month, with ${parties.length} counterparties.`,
      baseline: 'New businesses usually build volume over several months; full-scale trading from the first month is uncommon.',
      evidence: es.map((e) => `${nameOf(g, e.from)} → ${nameOf(g, e.to)}: ${L(e.taxable)} from ${MONTHS[monthsOf(e).findIndex((y) => y > 0)]}`),
    });
  }

  // Seller and buyer both loaded, and their records of the same trade differ.
  for (const e of v.edges) {
    if (!e.seller || !e.buyer) continue;
    const d = e.seller.taxable - e.buyer.taxable;
    if (Math.abs(d) <= Math.max(1e5, 0.05 * Math.max(e.seller.taxable, e.buyer.taxable))) continue;
    add('mismatch', {
      path: [e.from, e.to], edges: [e.id], value: Math.abs(d), tax: Math.abs(e.seller.tax - e.buyer.tax),
      why: `${nameOf(g, e.from)} reported ${L(e.seller.taxable)} of sales to ${nameOf(g, e.to)}, whose GSTR-2B shows ${L(e.buyer.taxable)}.`,
      baseline: 'Both returns describe the same invoices, so they should agree apart from timing and amendments.',
      evidence: [`Seller GSTR-1: ${e.seller.invoices} invoices, ${L(e.seller.taxable)}`, `Buyer GSTR-2B: ${e.buyer.invoices} invoices, ${L(e.buyer.taxable)}`],
    });
  }

  // Counterparties with an invalid GSTIN.
  for (const e of v.edges) {
    if (g.nodes[e.from]?.valid !== false || e.taxable < 1e5) continue;
    add('invalidGstin', { path: [e.from, e.to], edges: [e.id], value: e.taxable, tax: e.tax, itc: e.buyer?.itc || 0, why: `${e.from} fails its GSTIN check digit, yet ${nameOf(g, e.to)} records ${L(e.taxable)} of purchases from it.`, baseline: 'A valid GSTIN always passes its check digit.', evidence: [`${e.buyer?.invoices || e.seller?.invoices} invoices`] });
  }

  // Context: dependence on one supplier, and trade between registrations of one PAN.
  const topShares = [];
  for (const [x, es] of v.in) {
    const tot = sum(es, (e) => e.taxable);
    if (!g.nodes[x]?.loaded.includes(fy) || tot < 1e7) continue;
    const top = [...es].sort((a, b) => b.taxable - a.taxable)[0];
    topShares.push([x, top, top.taxable / tot, tot]);
  }
  const shareBase = median(topShares.map((t) => t[2]));
  for (const [x, top, s, tot] of topShares) {
    if (s < 0.6) continue;
    add('concentration', { path: [top.from, x], edges: [top.id], value: top.taxable, tax: top.tax, why: `${pct(s)} of ${nameOf(g, x)}'s purchases come from ${nameOf(g, top.from)}.`, baseline: `The typical loaded taxpayer's largest supplier gives ${pct(shareBase)} of its purchases.`, evidence: [`${L(top.taxable)} of ${L(tot)}`] });
  }
  for (const e of v.edges) {
    if (e.from.slice(2, 12) !== e.to.slice(2, 12) || e.taxable < 1e5) continue;
    add('samePan', { path: [e.from, e.to], edges: [e.id], value: e.taxable, tax: e.tax, why: `${e.from} and ${e.to} share the PAN ${e.from.slice(2, 12)}: supplies between them are between distinct persons of one business.`, baseline: 'Legitimate between branches, but valued under Rule 28, and a usual route for moving turnover between states.', evidence: [`${L(e.taxable)} in ${fy}`] });
  }

  const onHigh = new Set(found.filter((a) => a.severity === 'high' && a.type !== 'nonFiler').flatMap((a) => a.path));
  for (const a of found) if (a.type === 'reciprocal' && !a.path.some((x) => onHigh.has(x))) a.severity = 'low';
  return found.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.value - a.value);
}

// ------------------------------------------------------------------ capability 14: exposure reduction
/**
 * universe -> material network -> anomalous subset -> evidence-supported unresolved exposure, for the taxpayers in
 * scope (null = everyone loaded). Each edge is counted once however many anomalies it sits on; gross value, tax and
 * ITC stay separate.
 *   Unresolved exposure, per edge = the larger of: ITC claimed by an in-scope buyer on it (only the late invoices when
 *   the anomaly is invoicing after cancellation), and tax charged on it by an in-scope supplier in months it filed no
 *   GSTR-3B. Both can be the tax on the same invoices (denied to the buyer or recovered from the seller), so an edge
 *   never counts twice; the overlap is reported.
 */
export function exposureFunnel(g, anomalies, { fy, scope = null }) {
  const v = yearView(g, fy);
  const inScope = (x) => !scope || scope.has(x);
  const stage = (edges) => ({ edges: edges.length, counterparties: new Set(edges.flatMap((e) => [e.from, e.to]).filter((x) => !scope || !scope.has(x))).size, taxable: sum(edges, (e) => e.taxable), tax: sum(edges, (e) => e.tax), itc: sum(edges, (e) => e.buyer?.itc || 0) });
  const universe = v.edges.filter((e) => (inScope(e.from) || inScope(e.to)) && e.taxable > 0);
  const material = universe.filter((e) => isMaterial(e, v));
  const flagged = new Map();
  for (const a of anomalies) {
    if (a.severity === 'low') continue;
    for (const id of a.edges) (flagged.get(id) || flagged.set(id, []).get(id)).push(a);
  }
  const anomalous = material.filter((e) => flagged.has(e.id));
  const rows = anomalous.map((e) => {
    const as = flagged.get(e.id);
    const late = as.find((a) => a.type === 'afterCancellation');
    const itc = inScope(e.to) && e.buyer ? (late ? late.itc : e.buyer.itc) : 0;
    const nf = as.find((a) => a.type === 'nonFiler');
    const unpaid = nf && inScope(e.from) && e.seller && e.seller.taxable ? (sum(nf.months, (m) => e.seller.months[m]) / e.seller.taxable) * e.seller.tax : 0;
    return { edge: e.id, from: e.from, to: e.to, taxable: e.taxable, itc: r0(itc), unpaid: r0(unpaid), exposure: r0(Math.max(itc, unpaid)), types: [...new Set(as.map((a) => a.type))] };
  });
  const unresolved = { edges: rows.filter((r) => r.exposure).length, itc: sum(rows, (r) => r.itc), unpaidTax: sum(rows, (r) => r.unpaid), total: sum(rows, (r) => r.exposure) };
  unresolved.overlap = unresolved.itc + unresolved.unpaidTax - unresolved.total;
  const byCounterparty = new Map();
  for (const r of rows) for (const x of [r.from, r.to]) {
    if (scope && scope.has(x)) continue;
    const c = byCounterparty.get(x) || byCounterparty.set(x, { gstin: x, name: nameOf(g, x), exposure: 0, taxable: 0, edges: 0, types: new Set() }).get(x);
    c.exposure += r.exposure; c.taxable += r.taxable; c.edges += 1; r.types.forEach((t) => c.types.add(t));
  }
  return {
    fy, universe: stage(universe), material: stage(material), anomalous: stage(anomalous), unresolved, rows,
    reduction: universe.length ? anomalous.length / universe.length : 0,
    connected: [...byCounterparty.values()].map((c) => ({ ...c, types: [...c.types] })).sort((a, b) => b.exposure - a.exposure || b.taxable - a.taxable),
  };
}

// ------------------------------------------------------------------ capabilities 11 and 15: counterparty evidence
export const STATES = {
  verify: { label: 'Requires verification', note: 'At least one material contradiction in the returns' },
  insufficient: { label: 'Insufficient evidence', note: 'Nothing contradicts it, but too little is visible to say more' },
  consistent: { label: 'Consistent', note: 'The returns on both sides support the relationship' },
};

/**
 * Authenticity card for one counterparty of a taxpayer: material value, status timeline, consistency checks and a
 * two-sided evidence matrix (consistent | contradictory | missing, plus questions), ending in an evidence state.
 * Never a "fake / genuine" label.
 */
export function counterpartyCard(g, anomalies, { fy, taxpayer, counterparty, master = [] }) {
  const v = yearView(g, fy);
  const x = counterparty;
  const n = g.nodes[x] || { gstin: x, name: x, loaded: [], variants: [], valid: gstinValid(x) };
  const r = master.find((m) => m.gstin === x) || null;
  const t = g.trades[`${x}|${fy}`];
  const bought = v.byId.get(`${x}>${taxpayer}|${fy}`) || null; // the counterparty as supplier
  const sold = v.byId.get(`${taxpayer}>${x}|${fy}`) || null;   // the counterparty as customer
  const history = g.years.filter((y) => y < fy && g.edges.some((e) => e.fy === y && ((e.from === x && e.to === taxpayer) || (e.from === taxpayer && e.to === x))));
  const mine = anomalies.filter((a) => a.path.includes(x) && a.severity !== 'low');
  const context = anomalies.filter((a) => a.path.includes(x) && a.path.includes(taxpayer) && a.severity === 'low');
  const consistent = [], contradictory = [], missing = [], questions = [];

  for (const e of [bought, sold].filter(Boolean)) {
    const what = e === bought ? `${nameOf(g, x)}'s sales to ${nameOf(g, taxpayer)}` : `${nameOf(g, taxpayer)}'s sales to ${nameOf(g, x)}`;
    if (e.seller && e.buyer) {
      const ok = Math.abs(e.seller.taxable - e.buyer.taxable) <= Math.max(1e5, 0.05 * e.taxable);
      (ok ? consistent : contradictory).push(`Seller's GSTR-1 (${L(e.seller.taxable)}) and buyer's GSTR-2B (${L(e.buyer.taxable)}) ${ok ? 'agree' : 'differ'} on ${what}.`);
    } else if (!t) missing.push(`${nameOf(g, x)}'s own returns are not loaded: only one side of ${what} is visible.`);
  }
  if (bought) {
    if (t) {
      const unfiled = t.g1Months.filter((m) => !t.filedMonths.includes(m));
      if (unfiled.length) contradictory.push(`It filed no GSTR-3B for ${unfiled.map((m) => MONTHS[m]).join(', ')} while still invoicing.`);
      else consistent.push(`It filed GSTR-3B for every month it invoiced (${t.filedMonths.length} months).`);
    } else if (bought.buyer?.notFiled?.invoices) contradictory.push(`GSTR-2A marks ${bought.buyer.notFiled.invoices} of its invoices (tax ${L(bought.buyer.notFiled.tax)}) as "supplier GSTR-3B not filed".`);
    else if (bought.buyer) consistent.push('GSTR-2A shows it filed GSTR-3B for the periods of these invoices.');
    if (bought.seller?.irn) consistent.push(`${bought.seller.irn} of ${bought.seller.invoices} invoices carry an e-invoice reference (IRN).`);
  }
  if (r) {
    if (['Cancelled', 'Suspended'].includes(r.status)) {
      const late = mine.find((a) => a.type === 'afterCancellation');
      (late ? contradictory : consistent).push(`Registration ${r.status.toLowerCase()} on ${r.statusDate}${late ? `; ${late.evidence[1]}` : ': no invoices after that date'}.`);
    } else consistent.push(`Registration active${r.registrationDate ? ` since ${r.registrationDate}` : ''} (taxpayer master).`);
  } else missing.push('Not in the taxpayer master register: registration date and status unknown.');
  if (n.valid === false) contradictory.push('The GSTIN fails its check digit.');
  if (history.length) consistent.push(`They also traded in ${history.join(', ')}.`);
  else missing.push('No trade between them in earlier loaded years: a new relationship.');
  if (t?.flow?.ratio && !mine.some((a) => a.type === 'passThrough')) consistent.push(`It adds value: sells ${((t.flow.ratio - 1) * 100).toFixed(0)}% above cost, goods stay about ${t.flow.lagMedian} days.`);
  // An anomaly centred elsewhere (a supplier's supplier not filing, a pass-through the goods went through) still
  // bears on this relationship, but it is said where it sits.
  const own = (a) => !a.via || a.via === x;
  for (const a of mine) contradictory.push(own(a) ? `${a.label}: ${a.why}` : `Linked, at ${nameOf(g, a.via)} (${lowerFirst(a.label)}): ${a.why}`);
  for (const a of context) consistent.push(`Context (${lowerFirst(a.label)}): ${a.why}`);
  missing.push('E-way bills and transport records for the goods', 'Bank payment trail for the invoices', 'Stock or production records showing receipt and use');

  if (mine.some((a) => own(a) && (a.type === 'passThrough' || a.type === 'abrupt'))) questions.push(`Where were the goods from ${nameOf(g, x)} delivered, and who transported them?`);
  if (mine.some((a) => a.type === 'cycle' || a.type === 'reciprocal')) questions.push('Why do goods travel back to an earlier party in the chain?');
  if (mine.some((a) => own(a) && (a.type === 'nonFiler' || a.type === 'afterCancellation'))) questions.push(`Has ${nameOf(g, x)} paid the tax on these invoices? Ask for its GSTR-3B or payment proof.`);
  for (const a of mine.filter((y) => !own(y) && y.type === 'nonFiler')) questions.push(`Did ${nameOf(g, x)} rely on credit from ${nameOf(g, a.via)}, which filed no GSTR-3B for ${a.window.from}–${a.window.to}?`);
  if (mine.some((a) => a.type === 'mismatch')) questions.push('Explain the difference between the seller’s and the buyer’s record of this trade.');

  const bothSides = [bought, sold].filter(Boolean).every((e) => e.seller && e.buyer);
  const state = contradictory.length ? 'verify' : bothSides && consistent.length >= 3 ? 'consistent' : 'insufficient';
  const fy0 = Number(String(fy).slice(0, 4));
  const monthDate = (m) => `${m < 9 ? fy0 : fy0 + 1}-${String(((m + 3) % 12) + 1).padStart(2, '0')}-01`;
  const timeline = [
    r?.registrationDate && { date: r.registrationDate, text: 'Registered', tone: '' },
    ...history.map((y) => ({ date: `${y.slice(0, 4)}-04-01`, text: `Trading with ${nameOf(g, taxpayer)} in ${y}`, tone: '' })),
    ...[bought, sold].filter(Boolean).map((e) => { const m = monthsOf(e).findIndex((y) => y !== 0); return m < 0 ? null : { date: monthDate(m), text: `${e === bought ? 'First supply to' : 'First purchase from'} ${nameOf(g, taxpayer)} in ${fy}`, tone: '' }; }).filter(Boolean),
    ...(t ? t.g1Months.filter((m) => !t.filedMonths.includes(m)).map((m) => ({ date: monthDate(m), text: `${MONTHS[m]}: invoiced, no GSTR-3B`, tone: 'bad' })) : []),
    r?.statusDate && { date: r.statusDate, text: r.status, tone: r.status === 'Active' ? '' : 'bad' },
  ].filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
  return {
    gstin: x, name: n.name, variants: n.variants || [], loaded: !!t, status: r?.status || null, jurisdiction: r?.jurisdiction || null,
    roles: [bought && 'supplier', sold && 'customer'].filter(Boolean), value: (bought?.taxable || 0) + (sold?.taxable || 0),
    itc: bought?.buyer?.itc || 0, bought: bought && edgeSummary(bought), sold: sold && edgeSummary(sold),
    network: { buyers: (v.out.get(x) || []).length, suppliers: (v.in.get(x) || []).length },
    anomalies: mine, state, stateLabel: STATES[state].label,
    matrix: { consistent, contradictory, missing, questions },
    rationale: state === 'verify' ? `${contradictory.length} contradiction${contradictory.length > 1 ? 's' : ''} in the returns: verify before relying on this relationship.`
      : state === 'consistent' ? 'Both sides’ returns support the relationship; routine checks only.'
        : 'Nothing contradicts the relationship, but little of the counterparty is visible: rely on the missing evidence listed.',
    timeline,
  };
}

/** Material counterparties of a taxpayer (both directions) with their evidence state: the worklist order. */
export function counterpartiesOf(g, anomalies, { fy, taxpayer, master = [] }) {
  const v = yearView(g, fy);
  const es = [...(v.in.get(taxpayer) || []), ...(v.out.get(taxpayer) || [])].filter((e) => e.taxable > 0 && isMaterial(e, v));
  const order = { verify: 0, insufficient: 1, consistent: 2 };
  return [...new Set(es.map((e) => (e.from === taxpayer ? e.to : e.from)))]
    .map((x) => counterpartyCard(g, anomalies, { fy, taxpayer, counterparty: x, master }))
    .sort((a, b) => order[a.state] - order[b.state] || b.value - a.value);
}
