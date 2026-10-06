// Server-side jurisdiction filtering (AUTH_MODE=accounts): what an officer is sent is limited to the taxpayers of
// their jurisdictions, as the taxpayer master register assigns them. A taxpayer the master does not assign is seen
// only by accounts covering all jurisdictions: unassigned means "not yours", never "everyone's".
// Pure: the master records and the dataset are passed in.
import { coversAll } from '../../src/lib/access.js';

/**
 * @param {{ jurisdictions: string[] }} account
 * @param {{ gstin: string, jurisdiction: string }[]} master
 * @returns {{ all: true } | { all: false, jurisdictions: Set<string>, gstins: Set<string> }}
 */
export function scopeFor(account, master = []) {
  if (coversAll(account.jurisdictions)) return { all: true };
  const jurisdictions = new Set(account.jurisdictions);
  return { all: false, jurisdictions, gstins: new Set(master.filter((m) => jurisdictions.has(m.jurisdiction)).map((m) => m.gstin)) };
}

export const inScope = (scope, gstin) => !scope || scope.all || scope.gstins.has(gstin);

/**
 * The analysis as one officer may see it. Taxpayers, their baselines and portfolio rows are kept only in scope.
 * The trade network keeps a link only when one end is in scope: a link between two other taxpayers comes from their
 * returns, not this officer's, so multi-hop paths run through in-scope taxpayers only.
 */
export function scopeDataset(d, scope) {
  if (!scope || scope.all) return d;
  const keep = (g) => scope.gstins.has(g);
  const network = d.network && (() => {
    const edges = (d.network.edges || []).filter((e) => keep(e.from) || keep(e.to));
    const seen = new Set(edges.flatMap((e) => [e.from, e.to]));
    return {
      ...d.network,
      edges,
      nodes: Object.fromEntries(Object.entries(d.network.nodes || {}).filter(([g]) => seen.has(g) || keep(g))), // keyed by GSTIN
      trades: Object.fromEntries(Object.entries(d.network.trades || {}).filter(([k]) => keep(k.split('|')[0]))),
    };
  })();
  return {
    ...d,
    taxpayers: (d.taxpayers || []).filter((t) => keep(t.gstin)),
    baselines: Object.fromEntries(Object.entries(d.baselines || {}).filter(([g]) => keep(g))),
    ...(network ? { network } : {}),
    ...(d.portfolio ? { portfolio: { ...d.portfolio, rows: (d.portfolio.rows || []).filter((r) => keep(r.id)), n: (d.portfolio.rows || []).filter((r) => keep(r.id)).length } } : {}),
    scope: { jurisdictions: [...scope.jurisdictions].sort() },
  };
}

/** Registers as one officer may see them: rows about a taxpayer only in scope, targets only for their jurisdictions. */
export function scopeRegisters(regs, scope) {
  if (!scope || scope.all) return regs;
  const out = {};
  for (const [type, reg] of Object.entries(regs || {})) {
    if (!reg || !Array.isArray(reg.records)) { out[type] = reg; continue; }
    const records = reg.records.filter((r) => (r.gstin ? scope.gstins.has(r.gstin) : r.jurisdiction ? scope.jurisdictions.has(r.jurisdiction) : true));
    out[type] = { ...reg, records, meta: reg.meta && { ...reg.meta, rows: records.length, scoped: true } };
  }
  return out;
}
