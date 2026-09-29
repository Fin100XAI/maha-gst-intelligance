// Departmental action intelligence (capabilities 22-25 and 29). Pure: no I/O, no clock (asOf is passed in).
//
//   buildCases(...)         case action register + the platform's own case record -> one case list
//   actionFunnel(...)       stages reached, where open cases sit and for how long, transitions, data gaps     (23)
//   interventionRevenue()   payments linked to cases, with attribution confidence, never inferred           (22)
//   actionYield(...)        selected -> unresolved -> established -> realised, by cohort, definitions shown    (24)
//   effortOutcome(...)      effort proxies against outcomes by case type, not by officer                      (25)
//   outcomeLearning(...)    what converts, which explanations recur, which evidence matters                   (29)
//
// Exposure, demand and recovery stay separate numbers throughout: a demand is not revenue until it is paid, and an
// appeal pre-deposit is a deposit, not realised revenue.
import { CLOSURE_LABEL } from './verify.js';

const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

export const STAGES = [
  ['selected', 'Selected'], ['assigned', 'Examination'], ['notice', 'Notice (ASMT-10)'], ['reply', 'Reply received'], ['hearing', 'Hearing'],
  ['scn', 'Show cause (DRC-01)'], ['order', 'Order (DRC-07)'], ['appeal', 'Appeal'], ['recovery', 'Recovery action'], ['payment', 'Payment received'], ['closed', 'Closed'],
];
const RANK = Object.fromEntries(STAGES.map(([k], i) => [k, i]));
export const STAGE_LABEL = Object.fromEntries(STAGES);
// Where an open case sits, in words (a case whose last milestone is a payment still has a balance).
export const OPEN_STAGE_LABEL = { ...STAGE_LABEL, payment: 'Part paid, balance pending' };
// Stages the department controls; an appeal waits on the appellate authority, so it is never 'the bottleneck'.
const DEPARTMENTAL = new Set(STAGES.map(([k]) => k).filter((k) => !['appeal', 'closed'].includes(k)));
export const OUTCOMES = {
  'paid-voluntary': { label: 'Paid voluntarily', confirmed: true },
  'demand-confirmed': { label: 'Demand confirmed', confirmed: true },
  explained: { label: 'Explanation accepted', confirmed: false },
  'no-issue': { label: 'No issue found', confirmed: false },
  'data-insufficient': { label: 'Data insufficient', confirmed: false },
  referred: { label: 'Referred onward', confirmed: false },
  procedural: { label: 'Procedural closure', confirmed: false },
};
// Platform closure codes (src/engine/verify.js) mapped onto the same taxonomy.
const PLATFORM_OUTCOME = { 'no-discrepancy': 'no-issue', explained: 'explained', voluntary: 'paid-voluntary', referred: 'referred', proceedings: 'referred' };
// How long a case may sit at a stage before it counts as stuck (days).
export const STUCK_AFTER = { selected: 30, assigned: 45, notice: 30, reply: 45, hearing: 45, scn: 90, order: 90, appeal: 365, recovery: 90, payment: 60 };

/**
 * One case list from the case action register and the platform's case record.
 * @param {{ caselog?: object[], platformCases?: object, taxpayers?: object[], asOf: string }} o
 */
export function buildCases({ caselog = [], platformCases = {}, taxpayers = [], asOf }) {
  const byId = new Map();
  for (const r of caselog) (byId.get(r.caseId) || byId.set(r.caseId, []).get(r.caseId)).push(r);
  const cases = [...byId.entries()].map(([id, rows]) => caseOf(id, rows.sort((a, b) => a.date.localeCompare(b.date) || RANK[a.event] - RANK[b.event]), asOf, 'register'));
  // The platform's own case record: its history gives dates; its closure gives the outcome.
  for (const [gstin, c] of Object.entries(platformCases)) {
    const hist = [...(c.history || [])].reverse();
    if (!hist.length) continue;
    const a = taxpayers.find((t) => t.id === gstin || t.gstin === gstin);
    const d = (h) => String(h.at).slice(0, 10);
    const rows = [{ event: 'selected', date: d(hist[0]), amount: a ? Math.round(a.exposure || 0) : 0 }];
    for (const h of hist) {
      if (/^Status → In review/.test(h.text)) rows.push({ event: 'assigned', date: d(h), officer: h.by });
      else if (/^ASMT-10 drafted/.test(h.text)) rows.push({ event: 'notice', date: d(h), officer: h.by });
      else if (/^Taxpayer response recorded|reply from/.test(h.text)) rows.push({ event: 'reply', date: d(h) });
    }
    if (c.closure) rows.push({ event: 'closed', date: String(c.closure.at).slice(0, 10), outcome: PLATFORM_OUTCOME[c.closure.code] || 'procedural', reason: CLOSURE_LABEL[c.closure.code] });
    const base = { gstin: a?.gstin || gstin, fy: a?.fy || '', source: 'Platform', riskType: 'Platform scrutiny', signalId: '' };
    cases.push(caseOf(`PLT-${gstin}`, rows.map((r) => ({ ...base, ...r })).sort((x, y) => x.date.localeCompare(y.date)), asOf, 'platform'));
  }
  return cases;
}

function caseOf(id, rows, asOf, origin) {
  const first = rows[0];
  const pay = rows.filter((r) => r.event === 'payment');
  const orders = rows.filter((r) => r.event === 'order');
  const closedAt = [...rows].reverse().find((r) => r.event === 'closed');
  const reopened = rows.filter((r) => r.event === 'reopened').length;
  const isClosed = rows[rows.length - 1].event === 'closed';
  const reached = new Set(rows.map((r) => r.event));
  // Current stage: the furthest milestone reached (payments and hearings are steps within a stage).
  const stage = isClosed ? 'closed' : [...rows].filter((r) => r.event !== 'reopened').sort((a, b) => RANK[b.event] - RANK[a.event])[0].event;
  const stageSince = [...rows].reverse().find((r) => r.event === stage)?.date || first.date;
  const gaps = [];
  if (reached.has('order') && !reached.has('scn')) gaps.push('order without a show cause notice');
  if (isClosed && !closedAt.outcome) gaps.push('closed without an outcome');
  if (reached.has('scn') && !reached.has('notice') && first.source !== 'EIU') gaps.push('show cause without a scrutiny notice');
  return {
    id, origin, gstin: first.gstin, fy: first.fy || '', source: first.source || 'Other', riskType: first.riskType || 'Unspecified', signalId: first.signalId || '',
    officer: rows.find((r) => r.officer)?.officer || '', opened: first.date, selected: Number(rows.find((r) => r.event === 'selected')?.amount) || 0,
    events: rows, stage, stageSince, age: days(stageSince, asOf), open: !isClosed, closedOn: isClosed ? closedAt.date : null,
    outcome: isClosed ? closedAt.outcome || null : null, reason: isClosed ? closedAt.reason || '' : '',
    established: sum(orders, (r) => Number(r.amount) || 0), realised: sum(pay, (r) => Number(r.amount) || 0),
    deposits: sum(rows.filter((r) => r.event === 'appeal'), (r) => Number(r.amount) || 0),
    interactions: rows.filter((r) => ['notice', 'reply', 'hearing'].includes(r.event)).length,
    replies: rows.filter((r) => r.event === 'reply').length, hearings: rows.filter((r) => r.event === 'hearing').length,
    elapsed: days(first.date, isClosed ? closedAt.date : asOf), reopened, gaps,
  };
}

// ------------------------------------------------------------------ capability 23: the action funnel
export function actionFunnel(cases) {
  const stages = STAGES.map(([k, label]) => {
    const reached = cases.filter((c) => c.events.some((e) => e.event === k));
    const here = cases.filter((c) => c.open && c.stage === k);
    const stuck = here.filter((c) => c.age > (STUCK_AFTER[k] ?? 90));
    return {
      key: k, label, openLabel: OPEN_STAGE_LABEL[k], reached: reached.length, amountReached: sum(reached, (c) => c.selected), openHere: here.length, amountHere: sum(here, (c) => c.selected), amountStuck: sum(stuck, (c) => c.selected),
      medianAge: median(here.map((c) => c.age)), stuck: stuck.length, stuckAfter: STUCK_AFTER[k] ?? null,
      exits: Object.fromEntries(Object.keys(OUTCOMES).map((o) => [o, cases.filter((c) => !c.open && c.outcome === o && lastMilestone(c) === k).length]).filter(([, n]) => n)),
    };
  });
  const transitions = {};
  for (const c of cases) {
    const ms = c.events.filter((e) => !['payment', 'hearing', 'reopened'].includes(e.event)).map((e) => e.event);
    for (let i = 1; i < ms.length; i++) if (ms[i] !== ms[i - 1]) transitions[`${ms[i - 1]}>${ms[i]}`] = (transitions[`${ms[i - 1]}>${ms[i]}`] || 0) + 1;
  }
  const open = cases.filter((c) => c.open);
  // The bottleneck: the departmental stage holding the most money in cases past their time there.
  const bottleneck = [...stages].filter((s) => s.stuck && DEPARTMENTAL.has(s.key)).sort((a, b) => b.amountStuck - a.amountStuck || b.stuck - a.stuck)[0] || null;
  return {
    cases: cases.length, open: open.length, closed: cases.length - open.length, reopened: cases.filter((c) => c.reopened).length,
    stages, transitions, bottleneck,
    stuck: open.filter((c) => c.age > (STUCK_AFTER[c.stage] ?? 90)).sort((a, b) => b.age - a.age),
    ageing: ['0-90', '91-180', '181-365', '>365'].map((b, i) => ({ bucket: b, cases: open.filter((c) => [c.age <= 90, c.age > 90 && c.age <= 180, c.age > 180 && c.age <= 365, c.age > 365][i]).length })),
    dataGaps: cases.filter((c) => c.gaps.length).map((c) => ({ id: c.id, gaps: c.gaps })),
    missingEventRate: cases.length ? cases.filter((c) => c.gaps.length).length / cases.length : 0,
  };
}
const lastMilestone = (c) => { const ms = c.events.filter((e) => !['closed', 'payment', 'reopened', 'hearing'].includes(e.event)); return ms.length ? ms[ms.length - 1].event : 'selected'; };

// ------------------------------------------------------------------ capability 22: intervention revenue
/**
 * Payments associated with departmental action.
 *   direct: a payment recorded in a case (DRC-03 after a notice, or against the case's DRC-07 order)
 *   probable: tax made good in a later return filed after the signal date (from EIU revalidation); association,
 *             not proof that the action caused it
 *   unattributed: paid against a demand the case register does not link to any case
 * Appeal pre-deposits are listed apart: deposits, not realised revenue.
 */
export function interventionRevenue({ cases, demands = [], eiuResults = [] }) {
  const rows = [];
  for (const c of cases) for (const e of c.events.filter((x) => x.event === 'payment')) {
    const before = [...c.events].filter((x) => x.date <= e.date && ['notice', 'scn', 'order', 'recovery'].includes(x.event)).pop();
    rows.push({ confidence: 'direct', caseId: c.id, gstin: c.gstin, riskType: c.riskType, date: e.date, amount: Number(e.amount) || 0, action: before ? STAGE_LABEL[before.event] : 'Selected', ref: e.ref || '', why: e.note || 'payment recorded in the case' });
  }
  // Only a return filed after the signal can be associated with it.
  for (const r of eiuResults) for (const comp of r.comps.filter((x) => x.class === 'resolved' && x.catchUp && x.catchUpFiled && x.catchUpFiled >= r.signal.signalDate)) {
    const c = cases.find((x) => x.signalId === r.signal.signalId);
    rows.push({ confidence: 'probable', caseId: c?.id || '', gstin: r.signal.gstin, riskType: r.typeLabel, date: r.signal.signalDate, amount: comp.amount, action: 'EIU signal', ref: r.signal.signalId, why: `${comp.label}: made good in a later return. Association, not proof that the action caused it.` });
  }
  const linked = new Set(cases.flatMap((c) => c.events.filter((e) => e.event === 'order' || e.event === 'payment').map((e) => e.ref)).filter(Boolean));
  for (const d of demands) {
    if (!d.paid || linked.has(d.demandId)) continue;
    rows.push({ confidence: 'unattributed', caseId: '', gstin: d.gstin, riskType: '', date: d.lastPaymentDate || d.orderDate, amount: d.paid, action: 'Demand (no case link)', ref: d.demandId, why: 'Paid against a demand that no case in the register links to.' });
  }
  const deposits = cases.flatMap((c) => c.events.filter((e) => e.event === 'appeal' && e.amount).map((e) => ({ caseId: c.id, gstin: c.gstin, date: e.date, amount: Number(e.amount), ref: e.ref })));
  const by = (k) => sum(rows.filter((r) => r.confidence === k), (r) => r.amount);
  return { rows: rows.sort((a, b) => b.amount - a.amount), totals: { direct: by('direct'), probable: by('probable'), unattributed: by('unattributed'), deposits: sum(deposits, (d) => d.amount) }, deposits };
}

// ------------------------------------------------------------------ capability 24: action yield
export const YIELD_DEFS = {
  selected: 'Selected: the amount at risk when each case was selected (as recorded in the case register).',
  unresolved: 'Unresolved exposure: the selected amount of cases not closed as explained, no issue or data insufficient; for a case from an EIU signal, the amount the platform still finds open.',
  established: 'Established: amounts confirmed by a DRC-07 order (tax, interest and penalty), plus voluntary payments in cases closed as paid.',
  realised: 'Realised: payments received in the case. Appeal pre-deposits are excluded.',
  yield: 'Action yield = realised ÷ selected, for cases selected in the cohort.',
};
/**
 * @param {object[]} cases
 * @param {{ by?: 'riskType'|'source'|'fy'|'yearOpened', eiuOpen?: object }} o  eiuOpen: signalId -> open amount now
 */
export function actionYield(cases, { by = 'riskType', eiuOpen = {} } = {}) {
  const keyOf = (c) => (by === 'yearOpened' ? fyLabelOf(c.opened) : c[by] || 'Unspecified');
  const groups = new Map();
  for (const c of cases) (groups.get(keyOf(c)) || groups.set(keyOf(c), []).get(keyOf(c))).push(c);
  const row = (cohort, cs) => {
    const unresolved = sum(cs, (c) => (c.signalId && eiuOpen[c.signalId] !== undefined ? eiuOpen[c.signalId] : (!c.open && !OUTCOMES[c.outcome]?.confirmed ? 0 : c.selected)));
    const established = sum(cs, (c) => c.established + (c.outcome === 'paid-voluntary' ? c.realised : 0));
    const realised = sum(cs, (c) => c.realised);
    const selected = sum(cs, (c) => c.selected);
    const closed = cs.filter((c) => !c.open);
    return {
      cohort, cases: cs.length, closed: closed.length, selected, unresolved, established, realised,
      establishedRate: selected ? established / selected : null, realisedRate: established ? realised / established : null, yield: selected ? realised / selected : null,
      conversion: closed.length ? closed.filter((c) => OUTCOMES[c.outcome]?.confirmed).length / closed.length : null,
    };
  };
  const rows = [...groups.entries()].map(([k, cs]) => row(k, cs)).sort((a, b) => b.selected - a.selected);
  return { by, rows, total: row('All cases', cases), definitions: YIELD_DEFS };
}
export const fyLabelOf = (iso) => { const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)); return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`; };

// ------------------------------------------------------------------ capability 25: effort to outcome
export const EFFORT_DEF = 'Effort proxy: interactions (notices, replies and hearings) and days open. Case types are compared, never individual officers.';
export function effortOutcome(cases) {
  const all = cases.filter((c) => c.selected > 0 || c.realised > 0 || !c.open);
  const overall = { interactions: median(all.map((c) => c.interactions)) || 1, yield: sum(all, (c) => c.selected) ? sum(all, (c) => c.realised) / sum(all, (c) => c.selected) : 0 };
  const groups = new Map();
  for (const c of all) (groups.get(c.riskType) || groups.set(c.riskType, []).get(c.riskType)).push(c);
  const rows = [...groups.entries()].map(([k, cs]) => {
    const selected = sum(cs, (c) => c.selected), realised = sum(cs, (c) => c.realised);
    const inter = median(cs.map((c) => c.interactions));
    const effortIndex = inter / overall.interactions;
    const yieldIndex = overall.yield ? (selected ? realised / selected : 0) / overall.yield : 0;
    return {
      riskType: k, cases: cs.length, medianInteractions: inter, medianDays: median(cs.map((c) => c.elapsed)), totalInteractions: sum(cs, (c) => c.interactions),
      realised, selected, realisedPerInteraction: sum(cs, (c) => c.interactions) ? realised / sum(cs, (c) => c.interactions) : 0,
      effortIndex, yieldIndex, highEffortLowYield: effortIndex >= 1.2 && yieldIndex <= 0.5,
      repeatRounds: cs.filter((c) => c.replies >= 3).length,
    };
  }).sort((a, b) => b.effortIndex - a.effortIndex);
  const suggestions = [];
  for (const r of rows) {
    const cs = groups.get(r.riskType);
    const laterReturn = cs.filter((c) => /later return/.test(c.reason)).length;
    if (laterReturn >= 2 && laterReturn / cs.length >= 0.3) suggestions.push({ riskType: r.riskType, text: `${laterReturn} of ${cs.length} cases closed because a later return had already made good the amount: revalidate against the latest returns before issuing a notice (EIU signals screen).` });
    if (r.highEffortLowYield && /decline|credit note/i.test(r.riskType)) suggestions.push({ riskType: r.riskType, text: 'Most close as explained after many rounds: run the revenue-change explanation first and send only the unresolved drivers to the taxpayer.' });
    const noIssue = cs.filter((c) => c.outcome === 'no-issue').length;
    if (noIssue >= 2 && noIssue / cs.length >= 0.5) suggestions.push({ riskType: r.riskType, text: `${noIssue} of ${cs.length} cases found no issue: check the source (portal or returns) automatically before opening a case.` });
    if (r.repeatRounds >= 2) suggestions.push({ riskType: r.riskType, text: `${r.repeatRounds} cases needed three or more reply rounds: send a complete, claim-by-claim question list in the first notice.` });
  }
  return { rows, overall, suggestions, definition: EFFORT_DEF };
}

// ------------------------------------------------------------------ capability 29: outcome learning
/**
 * @param {object[]} cases
 * @param {{ features?: (c: object) => string[] }} o  optional evidence features per case (e.g. from the network)
 */
export function outcomeLearning(cases, { features = () => [] } = {}) {
  const closed = cases.filter((c) => !c.open);
  const types = [...new Set(closed.map((c) => c.riskType))];
  const mix = types.map((t) => {
    const cs = closed.filter((c) => c.riskType === t);
    return { riskType: t, closed: cs.length, ...Object.fromEntries(Object.keys(OUTCOMES).map((o) => [o, cs.filter((c) => c.outcome === o).length])), conversion: cs.filter((c) => OUTCOMES[c.outcome]?.confirmed).length / cs.length };
  }).sort((a, b) => b.conversion - a.conversion || b.closed - a.closed);
  const bySource = [...new Set(closed.map((c) => c.source))].map((s) => { const cs = closed.filter((c) => c.source === s); return { source: s, closed: cs.length, conversion: cs.filter((c) => OUTCOMES[c.outcome]?.confirmed).length / cs.length }; });
  const reasons = {};
  for (const c of closed.filter((x) => x.reason && !OUTCOMES[x.outcome]?.confirmed)) {
    const k = `${c.riskType}|${c.reason}`;
    reasons[k] = (reasons[k] || 0) + 1;
  }
  const recurring = Object.entries(reasons).map(([k, n]) => { const [riskType, reason] = k.split('|'); return { riskType, reason, cases: n }; }).filter((x) => x.cases >= 2).sort((a, b) => b.cases - a.cases);
  const combos = {};
  for (const c of cases) {
    const f = features(c);
    const k = f.length ? f.sort().join(' + ') : 'No platform signal';
    const b = (combos[k] ||= { evidence: k, cases: 0, closed: 0, confirmed: 0, open: 0, established: 0 });
    b.cases += 1; if (c.open) b.open += 1; else { b.closed += 1; if (OUTCOMES[c.outcome]?.confirmed) b.confirmed += 1; }
    b.established += c.established;
  }
  const effortNoOutcome = closed.filter((c) => c.interactions >= 4 && ['explained', 'no-issue'].includes(c.outcome)).sort((a, b) => b.interactions - a.interactions);
  return {
    closed: closed.length, mix, bySource, recurring,
    evidence: Object.values(combos).map((b) => ({ ...b, conversion: b.closed ? b.confirmed / b.closed : null })).sort((a, b) => b.cases - a.cases),
    effortNoOutcome,
    completeness: { withOutcome: closed.filter((c) => c.outcome).length / Math.max(1, closed.length), withReason: closed.filter((c) => c.reason || OUTCOMES[c.outcome]?.confirmed).length / Math.max(1, closed.length) },
  };
}
