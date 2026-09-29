// EIU risk-to-revenue intelligence (capabilities 16-20). Pure: no I/O, no clock.
//
//   mapSignal(sig)                      taxonomy: the EIU parameter / rule id -> a canonical signal type      (16)
//   eiuContext({ baselines, network, master, taxpayers })  what revalidation reads
//   revalidate(sig, ctx, challenge)     recompute the signal on the latest data, as components               (17, 19)
//   extractClaims(text) / testClaims()  a taxpayer / CA reply -> claims tested against the returns           (18)
//   whatChanges(sig, ctx, challenge)    which exclusion or assumption would change the conclusion            (19)
//   exposureLedger(results)             gross -> reconciled -> unresolved -> insufficient, no double count   (20)
//
// The original signal is never altered. Every recomputed amount is a set of components, each with a class
// (resolved | explained | unresolved | insufficient), the evidence behind it and a key used to avoid counting
// the same tax twice across signals. Nothing here is a liability: it is the analytical amount still open.
import { explainRevenueChange } from './revenue.js';
import { detectAnomalies } from './network.js';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const FULL = ['april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march'];
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const r0 = (v) => Math.round(v);
const L = (v) => {
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)} L`;
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`;
};
const DAY = 864e5;
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
/** "2024-25" or "2024-2025" -> "2024-2025" (the form returns and baselines use) */
export const fyKey = (s) => { const y = Number(String(s).slice(0, 4)); return `${y}-${y + 1}`; };

// ------------------------------------------------------------------ capability 16: taxonomy
export const SIGNAL_TYPES = {
  g1vs3b: { label: 'GSTR-1 tax above GSTR-3B', rule: 'G-02', words: [/gstr-?1.*(exceed|more|higher|above).*3b/i, /short.*(declar|pay).*3b/i] },
  itcExcess: { label: 'ITC claimed above GSTR-2B', rule: 'B-01', words: [/itc.*(excess|more|above).*2b/i, /excess itc/i] },
  nonFiling: { label: 'GSTR-3B not filed while GSTR-1 continues', rule: 'A-02', words: [/not filing gstr-?3b/i, /non-?fil/i, /3b.*not filed/i] },
  revenueDecline: { label: 'Decline in tax paid', rule: null, words: [/decline in tax/i, /(fall|drop|decline).*(tax|revenue|payment)/i] },
  lowValueAdd: { label: 'Low value addition (liability paid through ITC)', rule: null, words: [/value addition/i, /discharged.*(entirely|almost).*itc/i, /low cash/i] },
  riskyItc: { label: 'ITC from high-risk suppliers', rule: null, words: [/high-?risk supplier/i, /pass-?through/i, /fake invoice|bogus/i] },
  einvoice: { label: 'E-invoice (IRN) not generated', rule: 'G-03', words: [/e-?invoice|irn/i] },
};
const BY_RULE = Object.fromEntries(Object.entries(SIGNAL_TYPES).filter(([, t]) => t.rule).map(([k, t]) => [t.rule, k]));

/** The canonical type of an EIU signal: its rule id when it has one, else its parameter wording. */
export function mapSignal(sig) {
  if (sig.ruleId && BY_RULE[sig.ruleId]) return { type: BY_RULE[sig.ruleId], mappedBy: `rule ${sig.ruleId}` };
  for (const [k, t] of Object.entries(SIGNAL_TYPES)) if (t.words.some((w) => w.test(sig.parameter || ''))) return { type: k, mappedBy: 'parameter wording' };
  return { type: sig.ruleId ? 'rule' : 'unmapped', mappedBy: sig.ruleId ? `rule ${sig.ruleId} (generic check)` : 'none' };
}

/** What revalidation reads. Anomaly detection runs once per year, on first use. */
export function eiuContext({ baselines = {}, network = null, master = [], taxpayers = [] }) {
  const cache = {};
  return { baselines, g: network, master, taxpayers, anomalies: (fy) => (network?.years.includes(fy) ? (cache[fy] ||= detectAnomalies(network, { fy, master })) : []) };
}

// ------------------------------------------------------------------ helpers over baselines and the graph
const yearOf = (ctx, gstin, fy) => (ctx.baselines[gstin] || []).find((b) => b.fy === fy) || null;
const covered = (b) => new Set(b.periods.flatMap((p) => Array.from({ length: p.months }, (_, i) => p.p - i)));
const periodEnd = (b, p) => { const y = b.fyStart + (p.p >= 9 ? 1 : 0), m = ((p.p + 3) % 12) + 1; return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const inEdges = (ctx, gstin, fy) => (ctx.g ? ctx.g.edges.filter((e) => e.fy === fy && e.to === gstin && e.taxable > 0) : []);
const outEdges = (ctx, gstin, fy) => (ctx.g ? ctx.g.edges.filter((e) => e.fy === fy && e.from === gstin && e.taxable > 0) : []);
const nameOf = (ctx, x) => ctx.g?.nodes[x]?.name || (ctx.master.find((r) => r.gstin === x)?.legalName) || x;
// The tax on a supplier -> buyer flow, split by month (for keys shared across signals).
const monthParts = (e, prefix, taxOf) => {
  const side = e.buyer || e.seller, t = side.taxable ? taxOf(side) / side.taxable : 0;
  return side.months.map((v, m) => ({ key: `${prefix}:${e.from}>${e.to}|${e.fy}|${m}`, amount: r0(v * t) })).filter((p) => p.amount);
};

/**
 * A period-by-period gap (shortfall when positive) netted first-in-first-out against later negative gaps, as a
 * taxpayer making good an earlier shortfall in a later return. With net=false every shortfall stays open.
 */
function fifoNet(b, gapOf, { net, keyOf, what }) {
  const ps = [...b.periods].sort((x, y) => x.p - y.p);
  const open = []; // [{ p, left }]
  const comps = [];
  for (const p of ps) {
    const gap = gapOf(p);
    if (gap > 0) { open.push({ p, left: gap, gap }); continue; }
    if (gap < 0 && net) {
      let credit = -gap;
      for (const o of open) {
        if (credit <= 0) break;
        const take = Math.min(o.left, credit);
        if (take <= 0) continue;
        o.left -= take; credit -= take;
        const late = o.p.dueOn && p.filedOn ? Math.max(0, days(o.p.dueOn, p.filedOn)) : null;
        comps.push({ id: `${o.p.label}->${p.label}`, parts: [{ key: keyOf(o.p), amount: r0(take) }], label: `${o.p.label} ${what} made good in ${p.label}`, amount: r0(take), class: 'resolved', period: o.p.label,
          why: `${p.label} declared ${L(-gap)} more than the gap measure, which covers ${L(take)} of the ${o.p.label} shortfall.`,
          evidence: [`${o.p.label}: gap ${L(o.gap)}`, `${p.label}: gap ${L(gap)}${p.filedOn ? `, filed ${p.filedOn}` : ''}`], late, interestIndicative: late ? r0(take * 0.18 * late / 365) : 0, catchUp: p.label, catchUpFiled: p.filedOn || null });
      }
    }
  }
  for (const o of open) if (o.left > 10) comps.push({ id: o.p.label, parts: [{ key: keyOf(o.p), amount: r0(o.left) }], label: `${o.p.label} ${what} not made good`, amount: r0(o.left), class: 'unresolved', period: o.p.label, why: `No later return in the year makes it good${net ? '' : ' (later returns not netted: officer assumption)'}.`, evidence: [`${o.p.label}: gap ${L(o.gap)}`] });
  return comps;
}

// ------------------------------------------------------------------ capability 17: revalidation, one rule per type
const ASSUMPTIONS = {
  g1vs3b: [['netLater', 'Accept a later return making good an earlier shortfall', true]],
  itcExcess: [['netLater', 'Accept a later return reversing an earlier excess', true]],
  nonFiling: [['signalWindowOnly', 'Only the months in the original signal', false]],
  revenueDecline: [['acceptPartial', 'Treat partially explained drivers as explained', false]],
  riskyItc: [['includeLinked', 'Include suppliers only linked to a non-filer further up', false]],
  lowValueAdd: [],
  einvoice: [],
  rule: [],
  unmapped: [],
};

const REVALIDATE = {
  g1vs3b(sig, ctx, b, A) {
    const comps = fifoNet(b, (p) => (p.g1Tax ?? 0) - (p.g3bTax ?? 0), { net: A.netLater, keyOf: (p) => `g1vs3b:${sig.gstin}|${b.fy}|${p.label}`, what: 'shortfall' });
    const interest = sum(comps, (c) => c.interestIndicative || 0);
    const paid = sum(b.periods, (p) => p.interestPaid || 0);
    return { comps, questions: [
      ...(interest && !paid ? [`Interest of about ${L(interest)} (18% a year for the days the tax was late) is not shown as paid in any GSTR-3B of the year: ask for the DRC-03 challan.`] : []),
      ...comps.filter((c) => c.class === 'unresolved').map((c) => `Why was the ${c.period} shortfall of ${L(c.amount)} not declared later?`),
    ], facts: { interestIndicative: interest, interestPaid: paid } };
  },
  itcExcess(sig, ctx, b, A) {
    const comps = fifoNet(b, (p) => (p.itcClaim ?? 0) - (p.itc2b ?? 0), { net: A.netLater, keyOf: (p) => `itcExcess:${sig.gstin}|${b.fy}|${p.label}`, what: 'excess credit' });
    const interest = sum(comps, (c) => c.interestIndicative || 0);
    return { comps, questions: [
      ...(interest ? [`Was the excess credit used before it was reversed? If so, interest of about ${L(interest)} applies.`] : []),
      ...comps.filter((c) => c.class === 'unresolved').map((c) => `Support for ${L(c.amount)} of credit claimed in ${c.period} beyond GSTR-2B?`),
    ] };
  },
  nonFiling(sig, ctx, b, A) {
    const cov = covered(b);
    const window = parseMonths(sig.remarks || "");
    let months = b.months.filter((m) => !cov.has(m.m) && m.outTax > 0).map((m) => m.m);
    if (A.signalWindowOnly && window.length) months = months.filter((m) => window.includes(m));
    const outs = outEdges(ctx, sig.gstin, b.fy);
    const comps = months.map((m) => {
      const total = b.months[m].outTax;
      const parts = outs.map((e) => { const s = e.seller || e.buyer; return { key: `inv:${e.from}>${e.to}|${e.fy}|${m}`, amount: r0(s.taxable ? (s.months[m] / s.taxable) * s.tax : 0) }; }).filter((p) => p.amount);
      const rest = total - sum(parts, (p) => p.amount);
      if (rest > 1) parts.push({ key: `inv:${sig.gstin}>other|${b.fy}|${m}`, amount: r0(rest) });
      return { id: MONTHS[m], parts, label: `${MONTHS[m]}: GSTR-1 tax with no GSTR-3B`, amount: r0(total), class: 'unresolved', period: MONTHS[m],
        why: `GSTR-1 reports ${L(total)} of tax for ${MONTHS[m]}; no GSTR-3B covers the month as of the extract (${b.asOf || 'date unknown'}).`,
        evidence: outs.filter((e) => (e.seller || e.buyer).months[m] > 0).slice(0, 6).map((e) => `Sold to ${nameOf(ctx, e.to)}: ${L((e.seller || e.buyer).months[m])} taxable`) };
    });
    const extra = months.filter((m) => window.length && !window.includes(m));
    return { comps, notes: extra.length ? [`Since the signal, ${extra.map((m) => MONTHS[m]).join(', ')} also went unfiled.`] : [],
      questions: months.length ? ['Has GSTR-3B been filed for these months since the extract? Ask for the ARNs and payment challans.', 'Should buyers’ credit on these invoices be reviewed under Rule 37A?'] : [] };
  },
  revenueDecline(sig, ctx, b, A) {
    const prev = yearOf(ctx, sig.gstin, `${b.fyStart - 1}-${b.fyStart}`);
    if (!prev) return { insufficient: `No FY ${b.fyStart - 1}-${b.fyStart} return is loaded to compare with.` };
    const x = explainRevenueChange(prev, b);
    const volumeRate = x.drivers.filter((d) => !['itc', 'negative', 'other'].includes(d.key));
    const decline = x.prior.outputTax - x.current.outputTax;
    const cls = (c) => (c === 'explained' ? 'explained' : c === 'partial' ? (A.acceptPartial ? 'explained' : 'insufficient') : c === 'unresolved' ? 'unresolved' : 'insufficient');
    const comps = decline <= 0 ? [] : volumeRate.filter((d) => Math.abs(d.amount) >= 1).map((d) => ({
      id: d.key, parts: [{ key: `decline:${sig.gstin}|${b.fy}|${d.key}`, amount: r0(-d.amount) }], label: d.label, amount: r0(-d.amount), class: cls(d.class),
      why: `${d.amount < 0 ? 'Reduces' : 'Offsets'} output tax by ${L(Math.abs(d.amount))}: ${d.formula}.`, evidence: (d.detail || []).slice(0, 4).map((r) => `${r.name || r.hsn}: ${L(r.change ?? r.effect ?? 0)}`),
    }));
    const supported = x.hypotheses.filter((h) => h.status === 'supported').map((h) => h.label.toLowerCase());
    return { comps, notes: [`Output tax ${L(x.prior.outputTax)} → ${L(x.current.outputTax)}; cash paid ${L(x.prior.cash)} → ${L(x.current.cash)}.`, ...(supported.length ? [`Supported explanations: ${supported.join('; ')}.`] : [])],
      questions: x.hypotheses.filter((h) => ['supported', 'partial', 'concern'].includes(h.status)).flatMap((h) => h.questions).slice(0, 4), revenue: x };
  },
  lowValueAdd(sig, ctx, b) {
    const t = ctx.g?.trades[`${sig.gstin}|${b.fy}`];
    const pass = ctx.anomalies(b.fy).some((a) => a.type === 'passThrough' && a.via === sig.gstin);
    const cashPct = b.totals.cashPct;
    const persists = cashPct < 0.03 || pass;
    const comps = inEdges(ctx, sig.gstin, b.fy).filter((e) => e.buyer?.itc).map((e) => ({
      id: e.from, parts: monthParts(e, 'inv', (s) => s.itc ?? s.tax), label: `Credit from ${nameOf(ctx, e.from)}`, amount: r0(e.buyer.itc), class: persists ? 'unresolved' : 'resolved', party: e.from,
      why: persists ? 'Liability is still paid almost entirely with this credit.' : 'Cash now pays a normal share of the liability.', evidence: [`${e.buyer.invoices} invoices, taxable ${L(e.buyer.taxable)}`],
    }));
    return { comps, notes: [`Cash paid ${(cashPct * 100).toFixed(1)}% of liability in FY ${b.fy}.`, ...(t?.flow?.ratio ? [`Sells at ${((t.flow.ratio - 1) * 100).toFixed(1)}% over cost; goods stay about ${t.flow.lagMedian} days.`] : []), ...(pass ? ['The network shows it as a rapid pass-through.'] : [])],
      questions: persists ? ['Where are the goods stored, and who transports them from supplier to buyer?', 'Why is almost nothing paid in cash?'] : [] };
  },
  riskyItc(sig, ctx, b, A) {
    const an = ctx.anomalies(b.fy).filter((a) => a.severity === 'high');
    const comps = inEdges(ctx, sig.gstin, b.fy).filter((e) => e.buyer?.itc).map((e) => {
      const own = an.filter((a) => a.via === e.from || (!a.via && a.path.includes(e.from) && a.path.includes(sig.gstin)));
      const linked = an.filter((a) => a.type === 'nonFiler' && a.via !== e.from && a.path.includes(e.from));
      if (!own.length && !linked.length) return null;
      return { id: e.from, parts: monthParts(e, 'inv', (s) => s.itc ?? s.tax), label: `Credit from ${nameOf(ctx, e.from)}`, amount: r0(e.buyer.itc), party: e.from,
        class: own.length ? 'unresolved' : A.includeLinked ? 'unresolved' : 'insufficient',
        why: own.length ? own.map((a) => `${a.label}: ${a.why}`).join(' ') : `Its supplier ${nameOf(ctx, linked[0].via)} filed no GSTR-3B for ${linked[0].window.from}–${linked[0].window.to}.`,
        evidence: [`${e.buyer.invoices} invoices, taxable ${L(e.buyer.taxable)}, ITC ${L(e.buyer.itc)}`] };
    }).filter(Boolean);
    return { comps, questions: comps.length ? ['Proof of receipt of goods from these suppliers: e-way bills, transport records, stock entries.', 'Bank payments to these suppliers, and where the money went next.'] : [] };
  },
  einvoice(sig, ctx, b) {
    const outs = outEdges(ctx, sig.gstin, b.fy).filter((e) => e.seller);
    const inv = sum(outs, (e) => e.seller.invoices), irn = sum(outs, (e) => e.seller.irn || 0);
    if (!inv) return { insufficient: 'No B2B sales invoices in the loaded GSTR-1.' };
    const missing = inv - irn;
    return { comps: [{ id: 'irn', parts: [], label: `${missing} of ${inv} B2B invoices without an IRN`, amount: 0, count: missing, class: missing ? 'unresolved' : 'resolved', why: missing ? 'Invoices without IRN are not valid tax invoices; penalty exposure, not tax.' : 'Every B2B invoice in GSTR-1 carries an IRN.', evidence: [`IRN on ${irn} of ${inv} invoices`] }],
      countBased: true, questions: missing ? ['Confirm on the IRP portal whether the invoices without IRN were reported.'] : [] };
  },
  rule(sig, ctx, b) {
    const a = ctx.taxpayers.find((t) => t.gstin === sig.gstin && t.fy === b.fy);
    const r = a?.results.find((x) => x.id === sig.ruleId);
    if (!r) return { insufficient: `Rule ${sig.ruleId} is not evaluated for this year in the loaded data.` };
    const open = r.status === 'Fail' || r.status === 'Review';
    return { comps: [{ id: sig.ruleId, parts: [{ key: `rule:${sig.gstin}|${b.fy}|${sig.ruleId}`, amount: r0(r.exposure || 0) }], label: `${sig.ruleId}: ${r.status}`, amount: r0(r.exposure || 0), class: open ? (r.status === 'Fail' ? 'unresolved' : 'insufficient') : 'resolved', why: r.detail || r.text || '', evidence: [] }] };
  },
  unmapped() { return { insufficient: 'No revalidation rule matches this risk parameter: map it to a rule id, or review manually.' }; },
};

export const STATUS = {
  resolved: { label: 'Resolved', note: 'The risk no longer shows in the latest data' },
  reduced: { label: 'Reduced', note: 'Still open, but smaller than signalled' },
  unchanged: { label: 'Unchanged', note: 'Still open at about the signalled amount' },
  increased: { label: 'Increased', note: 'Larger now than when signalled' },
  explained: { label: 'Explained', note: 'The movement has a legitimate cause visible in the returns' },
  insufficient: { label: 'Data insufficient', note: 'The loaded data cannot test the signal' },
};

/**
 * Recompute one signal on the latest loaded data.
 * @param {object} sig        EIU register record (kept as received)
 * @param {object} ctx        eiuContext()
 * @param {{ excluded?: string[], assumptions?: object }} challenge  officer's exclusions and assumption changes
 */
export function revalidate(sig, ctx, challenge = {}) {
  const { type, mappedBy } = mapSignal(sig);
  const fy = fyKey(sig.fy);
  const A = Object.fromEntries((ASSUMPTIONS[type] || []).map(([k, , d]) => [k, challenge.assumptions?.[k] ?? d]));
  const excluded = new Set(challenge.excluded || []);
  const b = yearOf(ctx, sig.gstin, fy);
  const base = { signal: sig, type, typeLabel: SIGNAL_TYPES[type]?.label || (type === 'rule' ? `Rule ${sig.ruleId}` : 'Unmapped parameter'), mappedBy, fy, original: sig.amount || 0,
    assumptions: (ASSUMPTIONS[type] || []).map(([key, label, def]) => ({ key, label, value: A[key], changed: A[key] !== def })), ageDays: null };
  if (!b) return finish({ ...base, asOf: null, fresh: false, comps: [], insufficient: `No FY ${fy} return for ${sig.gstin} is loaded.` }, excluded);
  const out = REVALIDATE[type](sig, ctx, b, A);
  const asOf = b.asOf || null;
  return finish({ ...base, asOf, fresh: asOf ? asOf > sig.signalDate : null, ageDays: asOf && sig.signalDate ? days(sig.signalDate, asOf) : null, comps: out.comps || [], insufficient: out.insufficient, notes: out.notes || [], questions: out.questions || [], countBased: !!out.countBased, revenue: out.revenue, facts: out.facts || {} }, excluded);
}

function finish(r, excluded) {
  const comps = r.comps.map((c) => ({ ...c, excluded: excluded.has(c.id) }));
  const live = comps.filter((c) => !c.excluded);
  const byClass = (k) => sum(live.filter((c) => c.class === k), (c) => c.amount);
  const totals = { resolved: byClass('resolved'), explained: byClass('explained'), unresolved: Math.max(0, byClass('unresolved')), insufficient: Math.max(0, byClass('insufficient')), excluded: sum(comps.filter((c) => c.excluded), (c) => c.amount) };
  totals.reconciled = totals.resolved + totals.explained;
  totals.open = totals.unresolved + totals.insufficient;
  totals.recomputed = sum(live, (c) => c.amount);
  let status;
  if (r.insufficient) status = 'insufficient';
  else if (r.countBased) { const n = sum(live.filter((c) => c.class === 'unresolved'), (c) => c.count || 0); status = n === 0 ? 'resolved' : 'unchanged'; }
  else if (r.type === 'revenueDecline' && totals.recomputed > 0 && totals.explained >= 0.9 * totals.recomputed && totals.unresolved <= 0.05 * totals.recomputed) status = 'explained';
  else if (totals.open <= Math.max(1000, 0.05 * r.original)) status = totals.recomputed > 0 && totals.explained > totals.resolved ? 'explained' : 'resolved';
  else if (totals.unresolved === 0 && totals.insufficient > 0) status = 'insufficient';
  else if (!r.original) status = 'increased';
  else if (totals.open < 0.9 * r.original) status = 'reduced';
  else if (totals.open <= 1.1 * r.original) status = 'unchanged';
  else status = 'increased';
  const why = r.insufficient || whyOf(r, status, totals);
  return { ...r, comps, totals, status, statusLabel: STATUS[status].label, why, current: totals.open };
}

function whyOf(r, status, t) {
  const was = `Signalled ${L(r.original)}${r.signal.signalDate ? ` on ${r.signal.signalDate}` : ''}`;
  const now = r.countBased ? r.comps[0]?.label : `open now ${L(t.open)}${t.reconciled ? `, ${L(t.reconciled)} reconciled` : ''}${t.excluded ? `, ${L(t.excluded)} excluded by the officer` : ''}`;
  const data = r.asOf ? ` (returns as of ${r.asOf}${r.fresh === false ? ': no newer than the signal' : ''})` : '';
  return `${was}; ${now}${data}. ${STATUS[status].note}.`;
}

// ------------------------------------------------------------------ capability 19: what changes the conclusion
/** Each open component whose exclusion, and each assumption whose change, would move the status. */
export function whatChanges(sig, ctx, challenge = {}) {
  const now = revalidate(sig, ctx, challenge);
  const flips = [];
  for (const c of now.comps.filter((x) => !x.excluded && ['unresolved', 'insufficient'].includes(x.class))) {
    const r = revalidate(sig, ctx, { ...challenge, excluded: [...(challenge.excluded || []), c.id] });
    if (r.status !== now.status) flips.push({ kind: 'exclude', id: c.id, label: c.label, from: now.status, to: r.status, open: r.totals.open });
  }
  for (const a of now.assumptions) {
    const r = revalidate(sig, ctx, { ...challenge, assumptions: { ...(challenge.assumptions || {}), [a.key]: !a.value } });
    if (r.status !== now.status || r.totals.open !== now.totals.open) flips.push({ kind: 'assumption', id: a.key, label: `${a.value ? 'Stop' : 'Start'}: ${a.label.toLowerCase()}`, from: now.status, to: r.status, open: r.totals.open });
  }
  return flips;
}

// ------------------------------------------------------------------ capability 18: taxpayer / CA claims
const CLAIM_TYPES = [
  ['interest-paid', /interest/i, (s) => /paid|discharged|deposited/i.test(s)],
  ['suppliers-compliant', /\b(supplier|dealer|vendor)s?\b/i, (s) => /registered|filed|genuine|compliant/i.test(s)],
  ['reversed', /revers/i],
  ['filed', /\bfiled\b/i, (s) => /gstr-?3b|return/i.test(s)],
  ['declared-later', /(declared|paid|discharged|made good)/i, (s) => monthsIn(s).length > 0 || /later|subsequent/i.test(s)],
  ['branch', /branch|same pan|other state|another registration/i],
  ['customer-loss', /(lost|stopped|left).{0,40}(customer|order|client)|(customer|client).{0,40}(lost|stopped)/i],
  ['rate', /rate (cut|reduc)|reduced rate|rate change|rate rationali/i],
  ['credit-notes', /credit note|sales return|discount/i],
  ['margin', /margin|mark-?up|value addition/i],
  ['goods-moved', /e-?way bill|goods (were |are )?(received|delivered|move)|transport|delivered/i],
  ['paid-by-bank', /bank|banking channel/i],
  ['irn', /e-?invoice|\birn\b/i],
];
const monthsIn = (s) => FULL.map((m, i) => (new RegExp(`\\b${m}\\b|\\b${MONTHS[i]}\\b`, 'i').test(s) ? i : -1)).filter((i) => i >= 0);

/** Month indices (Apr = 0) named in a text, expanding "October to December". */
export function parseMonths(s) {
  const range = s.match(new RegExp(`\\b(${[...FULL, ...MONTHS].join('|')})[a-z]*\\b\\s*(?:to|-|–)\\s*\\b(${[...FULL, ...MONTHS].join('|')})`, 'i'));
  const idx = (w) => { const k = w.toLowerCase().slice(0, 3); return MONTHS.findIndex((m) => m.toLowerCase() === k); };
  if (range) { const a = idx(range[1]), b = idx(range[2]); const out = []; for (let m = a; ; m = (m + 1) % 12) { out.push(m); if (m === b || out.length > 12) break; } return out; }
  return monthsIn(s);
}
/** Rupee amounts in a text: "₹7,56,000", "Rs. 64,000", "7.56 lakh", "1.2 crore". */
export function parseAmounts(s) {
  const out = [];
  const re = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr)?|([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr)\b/gi;
  let m;
  while ((m = re.exec(s))) {
    const n = Number((m[1] || m[3]).replace(/,/g, '')), unit = (m[2] || m[4] || '').toLowerCase();
    out.push(n * (unit.startsWith('l') ? 1e5 : unit.startsWith('c') ? 1e7 : 1));
  }
  return out;
}
const percentIn = (s) => { const m = s.match(/(\d+(?:\.\d+)?)\s*%/); return m ? Number(m[1]) : null; };

// Letter furniture that is not a claim: letterhead, addressee, reference, subject, salutation, sign-off.
// Header words count only when followed by ':' ',' '.' or the end of the line ("From:", "To,"), so a sentence such as
// "From July 2025 our branch ..." is still read as a claim. Lines with no full stop and under eight words (letterhead,
// addresses, signatures) are dropped as well.
const NOT_A_CLAIM = /^(?:(?:to|from|ref|reference|subject|sub|date|dated|encl|enclosure|cc|gstin|place)(?:\s*[:,.]|$)|dear\b|respected\b|yours\b|thanking\b|with reference\b|we request\b|synthetic document\b)/i;

/** Split a reply into sentences and type each as a claim; one claim per sentence. Letter furniture is skipped. */
export function extractClaims(text) {
  const body = String(text || '').split(/\n+/).map((l) => l.trim()).filter((l) => l && !NOT_A_CLAIM.test(l) && (/[.!?]$/.test(l) || l.split(/\s+/).length >= 8)).join(' ');
  return body.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 4).map((s, i) => {
    const t = CLAIM_TYPES.find(([, re, extra]) => re.test(s) && (!extra || extra(s)));
    return { id: `c${i + 1}`, text: s, type: t ? t[0] : 'general', amounts: parseAmounts(s), months: parseMonths(s), percent: percentIn(s) };
  });
}

/**
 * Test each claim of a reply against the returns and the revalidation of the signal it answers. Results:
 * supported | partial | contradicted | unverifiable, with the amount supported, the record relied on, the
 * contradiction, the proof still missing and the residual (claimed minus supported).
 */
export function testClaims(text, rv, ctx) {
  const sig = rv.signal, fy = rv.fy, b = yearOf(ctx, sig.gstin, fy);
  return extractClaims(text).map((c) => {
    const claimed = c.amounts[0] ?? (/entire|whole|full|all/i.test(c.text) ? rv.original : null);
    const res = (result, o = {}) => ({ ...c, claimed, result, supported: o.supported ?? null, record: o.record || null, contradiction: o.contradiction || null, missing: o.missing || null, residual: claimed !== null && o.supported !== undefined ? Math.max(0, claimed - o.supported) : null });
    if (!b) return res('unverifiable', { missing: `FY ${fy} returns are not loaded.` });
    switch (c.type) {
      case 'declared-later':
      case 'reversed': {
        if (!['g1vs3b', 'itcExcess'].includes(rv.type)) break;
        const made = rv.comps.filter((x) => x.class === 'resolved' && (!c.months.length || c.months.some((m) => x.catchUp?.startsWith(MONTHS[m]))));
        const s = sum(made, (x) => x.amount);
        const want = claimed ?? rv.original;
        if (s >= 0.95 * want) return res('supported', { supported: s, record: made.map((x) => `${x.label}: ${L(x.amount)}`).join('; ') });
        if (s > 0) return res('partial', { supported: s, record: made.map((x) => x.label).join('; '), contradiction: `Only ${L(s)} of ${L(want)} is made good in the returns.` });
        return res('contradicted', { supported: 0, contradiction: `No later return in FY ${fy} makes good the amount${c.months.length ? ` in ${c.months.map((m) => MONTHS[m]).join(', ')}` : ''}.` });
      }
      case 'interest-paid': {
        const paid = sum(b.periods, (p) => p.interestPaid || 0);
        return paid > 0 ? res('supported', { supported: paid, record: `Interest of ${L(paid)} paid through GSTR-3B in FY ${fy}.` })
          : res('contradicted', { supported: 0, contradiction: `Every GSTR-3B of FY ${fy} shows ₹0 interest paid.`, missing: 'DRC-03 challan, if interest was paid outside the return' });
      }
      case 'filed': {
        const cov = covered(b);
        const months = c.months.length ? c.months.filter((m) => b.months[m]) : b.months.filter((m) => m.outTax > 0).map((m) => m.m);
        const unfiled = months.filter((m) => !cov.has(m));
        if (!unfiled.length) return res('supported', { record: `GSTR-3B covers ${months.map((m) => MONTHS[m]).join(', ')}.` });
        return res(unfiled.length < months.length ? 'partial' : 'contradicted', { contradiction: `As of ${b.asOf || 'the extract'}, no GSTR-3B covers ${unfiled.map((m) => MONTHS[m]).join(', ')}.`, missing: 'ARN and filing date of each return, with the payment challans' });
      }
      case 'suppliers-compliant': {
        const an = ctx.anomalies(fy).filter((a) => a.severity === 'high');
        const sup = inEdges(ctx, sig.gstin, fy).filter((e) => e.buyer?.itc);
        const filedIssue = sup.filter((e) => { const t = ctx.g?.trades[`${e.from}|${fy}`]; return t ? t.g1Months.some((m) => !t.filedMonths.includes(m)) : e.buyer.notFiled?.invoices > 0; });
        // Status at transaction time: a supplier cancelled or suspended only after the last invoice was valid then.
        const cut = (e) => { const r = ctx.master.find((x) => x.gstin === e.from); return r && ['Cancelled', 'Suspended'].includes(r.status) && r.statusDate ? Math.round((Date.parse(r.statusDate) - Date.UTC(b.fyStart, 3, 1)) / DAY) : null; };
        const cancelled = sup.filter((e) => { const d = cut(e); return d !== null && (e.buyer.inv || []).some(([x]) => x !== null && x > d); });
        const deeper = sup.filter((e) => an.some((a) => a.via === e.from || (a.type === 'nonFiler' && a.path.includes(e.from))));
        if (filedIssue.length || cancelled.length) return res('contradicted', { contradiction: [...filedIssue.map((e) => `${nameOf(ctx, e.from)} did not file GSTR-3B for some months it invoiced`), ...cancelled.map((e) => `${nameOf(ctx, e.from)} invoiced after its registration was ${ctx.master.find((r) => r.gstin === e.from).status.toLowerCase()}`)].join('; ') });
        if (deeper.length) return res('partial', { record: `All ${sup.length} suppliers are registered and filed GSTR-3B for the months they invoiced.`, contradiction: `But filing is not the issue: ${deeper.map((e) => nameOf(ctx, e.from)).join(', ')} ${deeper.length > 1 ? 'sit' : 'sits'} on a high-risk network pattern (${[...new Set(an.filter((a) => deeper.some((e) => a.via === e.from || a.path.includes(e.from))).map((a) => a.label.replace(/^[A-Z](?=[a-z])/, (ch) => ch.toLowerCase())))].join(', ')}).`, missing: 'Proof that goods moved: e-way bills, transport and stock records' });
        return res('supported', { record: `All ${sup.length} suppliers are registered and filed GSTR-3B for the months they invoiced.` });
      }
      case 'branch': {
        const x = rv.revenue;
        const same = x?.drivers.find((d) => d.key === 'samePan');
        if (x && same && same.amount > 0 && x.hypotheses.find((h) => h.key === 'branch')?.status === 'supported') return res('supported', { supported: same.detail.reduce((s, d) => s + d.change, 0), record: same.detail.map((d) => `Transfers to ${d.name} (${d.key}): ${L(d.prior)} → ${L(d.current)}`).join('; ') + (x.deviation.levelShift ? `. ${x.deviation.levelShift.text}.` : '') });
        return res('contradicted', { contradiction: 'The returns show no rise in supplies to another registration of the same PAN.' });
      }
      case 'customer-loss':
      case 'rate':
      case 'credit-notes': {
        const key = { 'customer-loss': 'customer-loss', rate: 'rate', 'credit-notes': 'credit-notes' }[c.type];
        const h = rv.revenue?.hypotheses.find((y) => y.key === key);
        if (!h) break;
        return h.status === 'supported' ? res('supported', { record: h.evidenceFor.join('; ') }) : h.status === 'partial' ? res('partial', { record: h.evidenceFor.join('; '), contradiction: h.evidenceAgainst.join('; ') }) : res('contradicted', { contradiction: h.evidenceAgainst.join('; ') });
      }
      case 'margin': {
        const t = ctx.g?.trades[`${sig.gstin}|${fy}`];
        if (!t?.flow?.ratio || c.percent === null) break;
        const actual = (t.flow.ratio - 1) * 100;
        return Math.abs(actual - c.percent) <= 3 ? res('supported', { record: `Sales are ${Math.abs(actual).toFixed(1)}% ${actual >= 0 ? 'above' : 'below'} purchases in FY ${fy}.` })
          : res('contradicted', { contradiction: `Sales are ${Math.abs(actual).toFixed(1)}% ${actual >= 0 ? 'above' : 'below'} purchases in FY ${fy}, not about ${c.percent}% above.` });
      }
      case 'irn': {
        const outs = outEdges(ctx, sig.gstin, fy).filter((e) => e.seller);
        const inv = sum(outs, (e) => e.seller.invoices), irn = sum(outs, (e) => e.seller.irn || 0);
        if (!inv) break;
        return irn === inv ? res('supported', { record: `IRN on all ${inv} B2B invoices in GSTR-1.` }) : res(irn ? 'partial' : 'contradicted', { contradiction: `${inv - irn} of ${inv} B2B invoices have no IRN.` });
      }
      case 'goods-moved': {
        // With e-way bill data loaded, the claim can be tested against the bills behind the taxpayer's goods purchases.
        const tpa = (ctx.taxpayers || []).find((t) => t.gstin === sig.gstin);
        const e = tpa?.ewb;
        if (!e) return res('unverifiable', { missing: 'E-way bills, lorry receipts and stock entries: not in the returns' });
        const src = e.source === 'simulated' ? ' (simulated e-way bill data)' : '';
        const need = e.inward.needing, u = e.inward.unsupported;
        if (!need) return res('unverifiable', { missing: `No goods purchases above the e-way bill limit in FY ${tpa.fy}${src}; lorry receipts and stock entries would be needed.` });
        if (!u.count) return res('supported', { record: `Every goods purchase above the e-way bill limit (${need} invoices) has an e-way bill behind it in FY ${tpa.fy}${src}.` });
        return res(u.count / need > 0.2 ? 'contradicted' : 'partial', { contradiction: `${u.count} of ${need} goods purchases above the e-way bill limit have no e-way bill: ${L(u.itc)} of ITC with no record that the goods moved (FY ${tpa.fy})${src}.` });
      }
      case 'paid-by-bank': return res('unverifiable', { missing: 'Bank statements showing the payments and where the money went next' });
      default: break;
    }
    return res('unverifiable', { missing: 'A document or record that the returns do not contain' });
  });
}

// ------------------------------------------------------------------ capability 20: the exposure ledger
/**
 * Portfolio view over revalidated signals: signalled, recomputed, reconciled, unresolved, insufficient, and what
 * the officer excluded. A part (the tax on one flow in one month, or one period gap) counts once across signals:
 * later signals show it as shared and it is left out of the totals.
 */
export function exposureLedger(results) {
  const seen = new Map();
  const rows = results.map((r) => {
    const shared = [];
    const add = { unresolved: 0, insufficient: 0 };
    for (const c of r.comps.filter((x) => !x.excluded && ['unresolved', 'insufficient'].includes(x.class))) {
      for (const p of c.parts || []) {
        if (seen.has(p.key)) { shared.push({ key: p.key, amount: p.amount, with: seen.get(p.key) }); continue; }
        seen.set(p.key, r.signal.signalId);
        add[c.class] += p.amount;
      }
    }
    return { signalId: r.signal.signalId, gstin: r.signal.gstin, type: r.type, status: r.status, original: r.original, recomputed: r.totals.recomputed, reconciled: r.totals.reconciled,
      unresolved: r.countBased ? 0 : r.totals.unresolved, insufficient: r.countBased ? 0 : r.totals.insufficient, excluded: r.totals.excluded,
      counted: { unresolved: r0(add.unresolved), insufficient: r0(add.insufficient) }, shared, sharedAmount: sum(shared, (s) => s.amount) };
  });
  const tot = (k) => sum(rows, (x) => x[k]);
  return {
    rows,
    totals: { signals: rows.length, original: tot('original'), recomputed: tot('recomputed'), reconciled: tot('reconciled'), excluded: tot('excluded'),
      unresolved: sum(rows, (x) => x.counted.unresolved), insufficient: sum(rows, (x) => x.counted.insufficient), shared: tot('sharedAmount') },
  };
}
