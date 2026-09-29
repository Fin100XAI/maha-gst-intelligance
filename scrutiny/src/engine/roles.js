// Role-specific intelligence (capability 30). One evidence base, three views over it:
//   field officer   who needs attention today, and why (only their taxpayers)
//   supervisor      target gap, unresolved exposure, where cases are stuck, action yield (DC / JC)
//   commissioner    trajectory, target gap, action yield, recovery and what the department is learning
// Every figure in every view comes from the same computed base, so roles can never disagree on a number.
// Access control is not enforced here: in production the role comes from the login (RBAC), not a switch.
import { explainRevenueChange } from './revenue.js';
import { detectAnomalies, exposureFunnel } from './network.js';
import { eiuContext, revalidate, exposureLedger } from './eiu.js';
import { collectionBase, trajectory } from './collections.js';
import { buildCases, actionFunnel, interventionRevenue, actionYield, effortOutcome, outcomeLearning, OPEN_STAGE_LABEL } from './actions.js';
import { recoveryWorklist } from './recovery.js';
const lowerFirst = (t) => String(t).replace(/^[A-Z](?=[a-z])/, (ch) => ch.toLowerCase()); // keeps acronyms such as DRC-01

const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);

/**
 * @param {{ data: object, registers: object, platformCases?: object, jurisdiction?: string|null, fy?: string, asOfMonth?: number }} o
 */
export function evidenceBase({ data, registers = {}, platformCases = {}, jurisdiction = null, fy = null, asOfMonth = null }) {
  const master = registers.master?.records || [];
  const baselines = data.baselines || {};
  const inJur = jurisdiction ? new Set(master.filter((r) => r.jurisdiction === jurisdiction).map((r) => r.gstin)) : null;
  const gstins = Object.keys(baselines).filter((g) => !inJur || inJur.has(g));
  const scope = new Set(gstins);
  const asOf = [...gstins.flatMap((g) => baselines[g].map((b) => b.asOf))].filter(Boolean).sort().pop() || new Date(0).toISOString().slice(0, 10);
  const caselog = (registers.caselog?.records || []).filter((r) => scope.has(r.gstin));
  const base = collectionBase({ baselines, gstins, caselog });
  const year = fy || base.years[base.years.length - 1];
  const monthsWithData = Math.max(...base.months.filter((c) => c.fy === year && c.regular + c.itc > 0).map((c) => c.m + 1), 1);
  const traj = base.years.includes(year) ? trajectory({ base, fy: year, asOf: asOfMonth ?? monthsWithData, targets: (registers.targets?.records || []).filter((t) => !jurisdiction || t.jurisdiction === jurisdiction) }) : null;
  const ctx = eiuContext({ baselines, network: data.network, master, taxpayers: data.taxpayers });
  const eiu = (registers.eiu?.records || []).filter((s) => scope.has(s.gstin)).map((s) => revalidate(s, ctx, platformCases[s.gstin]?.eiu?.[s.signalId]?.challenge || {}));
  const ledger = exposureLedger(eiu);
  const netYear = data.network?.years.includes(year) ? year : data.network?.years.at(-1);
  const anomalies = netYear ? ctx.anomalies(netYear) : [];
  const network = netYear ? exposureFunnel(data.network, anomalies.filter((a) => a.path.some((x) => scope.has(x))), { fy: netYear, scope }) : null;
  const cases = buildCases({ caselog, platformCases: Object.fromEntries(Object.entries(platformCases).filter(([g]) => scope.has(g))), taxpayers: data.taxpayers, asOf });
  const eiuOpen = Object.fromEntries(eiu.map((r) => [r.signal.signalId, r.totals.open]));
  const netFlags = new Set(anomalies.filter((a) => a.severity === 'high').map((a) => a.via || a.path[0]));
  const demands = (registers.demands?.records || []).filter((d) => scope.has(d.gstin));
  return {
    jurisdiction, gstins, asOf, fy: year, master, base, trajectory: traj, eiu, ledger, anomalies, networkYear: netYear, network, cases,
    funnel: actionFunnel(cases),
    intervention: interventionRevenue({ cases, demands, eiuResults: eiu }),
    yieldByRisk: actionYield(cases, { by: 'riskType', eiuOpen }),
    yieldBySource: actionYield(cases, { by: 'source', eiuOpen }),
    yieldByYear: actionYield(cases, { by: 'yearOpened', eiuOpen }),
    effort: effortOutcome(cases),
    learning: outcomeLearning(cases, { features: (c) => [netFlags.has(c.gstin) && 'network anomaly', c.signalId && 'EIU signal'].filter(Boolean) }),
    recovery: recoveryWorklist({ demands, cases, master, asOf }),
    revenue: (g) => { const b = baselines[g]; return b && b.length > 1 ? explainRevenueChange(b[b.length - 2], b[b.length - 1]) : null; },
    nameOf: (g) => master.find((m) => m.gstin === g)?.legalName || data.taxpayers.find((t) => t.gstin === g)?.name || g,
  };
}

// ------------------------------------------------------------------ the three views
/** Field officer: their taxpayers, each with the reasons it needs attention, most urgent first. */
export function fieldView(eb, officer) {
  const mine = new Set(eb.master.filter((m) => m.officer === officer).map((m) => m.gstin).filter((g) => eb.gstins.includes(g)));
  const items = [];
  const add = (gstin, kind, severity, text, amount, link) => { if (mine.has(gstin)) items.push({ gstin, name: eb.nameOf(gstin), kind, severity, text, amount, link }); };
  for (const r of eb.eiu) if (['increased', 'unchanged', 'reduced'].includes(r.status)) add(r.signal.gstin, 'EIU signal', r.status === 'increased' ? 3 : 2, `${r.signal.signalId} ${r.statusLabel.toLowerCase()}: ${r.typeLabel.toLowerCase()}, open ${fmt(r.totals.open)}`, r.totals.open, { view: 'eiu', id: r.signal.signalId });
  for (const g of mine) {
    const x = eb.revenue(g);
    if (x && ['examine', 'itc-watch', 'tax-fell'].includes(x.verdict.code)) add(g, 'Revenue change', x.verdict.code === 'examine' ? 3 : 2, x.verdict.text, Math.max(0, -x.byClass.unresolved), { view: 'taxpayer', id: g, tab: 'revenue' });
  }
  for (const a of eb.anomalies.filter((y) => y.severity === 'high')) { const g = a.via || a.path[0]; add(g, 'Network', 3, `${a.label}: ${a.why}`, a.itc || a.tax || 0, { view: 'taxpayer', id: g, tab: 'network' }); }
  for (const r of eb.recovery.rows.filter((y) => y.segment === 'now')) add(r.gstin, 'Recovery', r.priority >= 5 ? 3 : 2, `${r.demandId}: ${fmt(r.outstanding)} outstanding. ${r.next}`, r.outstanding, { view: 'recovery', id: r.demandId });
  for (const c of eb.funnel.stuck) add(c.gstin, 'Case', 2, `${c.id}: ${lowerFirst(OPEN_STAGE_LABEL[c.stage])} for ${c.age} days`, c.selected, { view: 'actions', id: c.id });
  for (const e of eb.base.exceptions.filter((y) => y.kind === 'unfiled' && y.fy === eb.fy)) add(e.gstin, 'Returns', 3, e.text, 0, { view: 'taxpayer', id: e.gstin });
  const byTp = new Map();
  for (const i of items) (byTp.get(i.gstin) || byTp.set(i.gstin, { gstin: i.gstin, name: i.name, items: [] }).get(i.gstin)).items.push(i);
  const list = [...byTp.values()].map((t) => ({ ...t, score: sum(t.items, (i) => i.severity), amount: sum(t.items, (i) => i.amount) })).sort((a, b) => b.score - a.score || b.amount - a.amount);
  return { officer, taxpayers: mine.size, needAttention: list.length, list, clear: [...mine].filter((g) => !byTp.has(g)).map((g) => ({ gstin: g, name: eb.nameOf(g) })) };
}

/** Supervisor (DC / JC): the gap, what is unresolved, where cases are stuck, and what action yields. */
export function supervisorView(eb) {
  return {
    targetGap: eb.trajectory && { target: eb.trajectory.target, expected: eb.trajectory.expected, gap: eb.trajectory.gap, gapRange: eb.trajectory.gapRange, asOf: eb.trajectory.asOfLabel, fy: eb.fy },
    unresolved: { eiu: eb.ledger.totals.unresolved, eiuInsufficient: eb.ledger.totals.insufficient, network: eb.network?.unresolved.total ?? 0, networkYear: eb.networkYear, note: 'EIU and network exposure overlap in part (the same suppliers can appear in both), so they are shown side by side, not added.' },
    bottleneck: eb.funnel.bottleneck, stuck: eb.funnel.stuck.slice(0, 8), funnel: eb.funnel,
    yield: eb.yieldByRisk.total, yieldByRisk: eb.yieldByRisk.rows,
    recovery: eb.recovery.totals, highEffortLowYield: eb.effort.rows.filter((r) => r.highEffortLowYield).map((r) => r.riskType),
  };
}

/** Commissioner: trajectory and target gap, action yield by cohort, recovery, and institutional learning. */
export function commissionerView(eb) {
  return {
    trajectory: eb.trajectory, yield: eb.yieldByRisk.total, yieldBySource: eb.yieldBySource.rows, yieldByYear: eb.yieldByYear.rows,
    intervention: eb.intervention.totals, recovery: eb.recovery.totals,
    learning: { best: eb.learning.mix[0], recurring: eb.learning.recurring.slice(0, 3), highEffortLowYield: eb.effort.rows.filter((r) => r.highEffortLowYield).map((r) => r.riskType), suggestions: eb.effort.suggestions.slice(0, 3) },
  };
}

const fmt = (v) => { const a = Math.abs(v); return a >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : a >= 1e5 ? `₹${(v / 1e5).toFixed(2)} L` : `₹${Math.round(v).toLocaleString('en-IN')}`; };
