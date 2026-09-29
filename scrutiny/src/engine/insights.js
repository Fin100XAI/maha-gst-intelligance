// Deterministic insight engine: turns engine output into ranked, evidence-linked insights.
// Same shape as the AI summariser so the UI renders both identically:
// { headline, items: [{ severity: 'critical'|'warning'|'info'|'good', title, detail, refs: [ruleId|'FR:key'] }], actions: [string] }
const L = (v) => {
  const a = Math.abs(v || 0), s = v < 0 ? '−' : '';
  if (a >= 1e12) return `${s}₹${(a / 1e12).toFixed(2)} lakh Cr`;
  if (a >= 1e10) return `${s}₹${Math.round(a / 1e7).toLocaleString('en-IN')} Cr`;
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)} L`;
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`;
};
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const RANK = { critical: 0, warning: 1, info: 2, good: 3 };
// Next steps are verification steps only: never pay / reverse / notice instructions from unverified alerts.
import { verifyStep, DESK_REVIEW, raisedIndicators, reviewPrompts } from './verify.js';

const N = (x) => x.toLocaleString('en-IN'); // counts in portfolio text run to thousands

export function taxpayerInsights(a, catalog) {
  const cat = Object.fromEntries(catalog.map((r) => [r.id, r]));
  const items = [];
  const fails = a.results.filter((r) => r.status === 'Fail').sort((x, y) => y.exposure - x.exposure);
  const reviews = a.results.filter((r) => r.status === 'Review').sort((x, y) => y.exposure - x.exposure);
  const flags = raisedIndicators(a).sort((x, y) => y.weight - x.weight);
  const prompts = reviewPrompts(a);

  // 1. Failed checks carrying money, then the rest of the failures
  for (const r of fails.slice(0, 4)) {
    items.push({ severity: r.exposure > 0 || cat[r.id]?.severity === 'High' ? 'critical' : 'warning', title: `${cat[r.id]?.check || r.id}${r.exposure ? `: ${L(r.exposure)} computed` : ''}`, detail: r.finding, refs: [r.id] });
  }
  // 2. Largest review items with an amount
  for (const r of reviews.filter((x) => x.exposure > 0).slice(0, 2)) {
    items.push({ severity: 'warning', title: `${cat[r.id]?.check || r.id}: ${L(r.exposure)} at risk`, detail: r.finding, refs: [r.id] });
  }
  // 3. Risk indicators, grouped (leads for enquiry, never conclusions)
  if (flags.length) {
    items.push({ severity: flags.some((f) => f.weight >= 1.5) || flags.length >= 3 ? 'critical' : 'warning', title: `${flags.length} risk indicator${flags.length > 1 ? 's' : ''} raised: verification required`,
      detail: flags.map((f) => `${f.label} (${f.value})`).join('; ') + '. Grounds for enquiry, not proof of evasion, suppression or intent.', refs: flags.map((f) => `FR:${f.key}`) });
  }
  if (prompts.length) {
    items.push({ severity: 'info', title: `${prompts.length} review prompt${prompts.length > 1 ? 's' : ''} (not scored)`, refs: prompts.map((f) => `FR:${f.key}`),
      detail: prompts.map((f) => `${f.label} (${f.value})`).join('; ') + '. Natural in many sectors: compare with prior-year seasonality, contracts and e-invoice / e-way bill timestamps.' });
  }
  // 4. Timing differences (period gaps that net out over the year)
  const taxPeriods = a.periodRecon.filter((r) => r.taxGap > 1000), itcPeriods = a.periodRecon.filter((r) => r.itcGap > 1000);
  if ((taxPeriods.length || itcPeriods.length) && !fails.some((r) => r.id === 'B-01' || r.id === 'G-02')) {
    items.push({ severity: 'info', title: 'Timing differences between returns', refs: ['B-01', 'G-02'],
      detail: `${taxPeriods.length} period(s) where GSTR-1 tax exceeded 3B and ${itcPeriods.length} where 3B ITC exceeded 2B; they net out over the year, but interest u/s 50 may apply for the intervening period.` });
  }
  // 5. Dependence on ITC / cash share
  if (a.profile.liability > 1e6 && a.profile.cashPct < 0.1) {
    items.push({ severity: 'warning', title: `Only ${pct(a.profile.cashPct)} of liability paid in cash`, refs: ['F-06', 'FR:valueadd'],
      detail: `Output tax of ${L(a.profile.outputTax)} is almost entirely discharged through ITC of ${L(a.profile.itcClaimed)}: verify the quality of inward credit.` });
  }
  // 6. Supplier concentration and non-filers
  const top = a.charts.topSuppliers.list[0];
  if (top && top.share > 0.35) {
    items.push({ severity: top.nonFiler ? 'critical' : 'info', title: `One supplier provides ${pct(top.share)} of purchases`, refs: top.nonFiler ? ['B-04'] : [],
      detail: `${top.name} (${top.key}): ${L(top.value)} taxable${top.nonFiler ? ', and has not filed GSTR-3B for some invoices' : ''}.` });
  }
  // 7. Purchases vs sales correlation
  const r = a.correlation.cells.find((c) => c.a === 'outTaxable' && c.b === 'inTaxable')?.r;
  if (r !== null && r !== undefined && a.correlation.n >= 6 && r < 0.3) {
    items.push({ severity: 'info', title: `Purchases and sales move independently (r = ${r.toFixed(2)})`, refs: [],
      detail: `Across ${a.correlation.n} active months monthly inward and outward values are weakly correlated. This can arise naturally from project cycles, advance procurement, subcontracting or work in progress: treat it as a review prompt only, alongside other indicators.` });
  }
  // 8. Filing discipline
  const late = a.periodRecon.filter((p) => p.delay > 0);
  if (late.length) {
    items.push({ severity: 'info', title: `${late.length} of ${a.periodRecon.length} GSTR-3B returns filed late`, refs: ['A-02', 'J-01', 'J-03'],
      detail: `Maximum delay ${Math.max(...late.map((p) => p.delay))} days. Interest and late fee are checked in J-01 / J-03.` });
  }
  // 9. What is clean (at most two)
  const clean = ['G-02', 'B-01', 'D-01', 'B-08'].map((id) => a.results.find((x) => x.id === id)).filter((x) => x && x.status === 'Pass').slice(0, 2);
  for (const c of clean) items.push({ severity: 'good', title: `${cat[c.id]?.check}: clean`, detail: c.finding, refs: [c.id] });

  items.sort((x, y) => RANK[x.severity] - RANK[y.severity]);
  const headline = fails.length || flags.length
    ? `${a.name}: ${fails.length} check${fails.length === 1 ? '' : 's'} with exceptions, ${L(a.exposure.confirmed)} computed (unverified)${a.exposure.potential ? ` plus ${L(a.exposure.potential)} under review` : ''}${flags.length ? `, ${flags.length} risk indicator${flags.length > 1 ? 's' : ''}` : ''}: ${a.band.toLowerCase()} review priority (${a.score}/100).`
    : `${a.name}: returns reconcile within tolerance; ${reviews.length} item(s) need officer review: ${a.band.toLowerCase()} risk (${a.score}/100).`;
  const actions = [];
  for (const f of fails.slice(0, 3)) actions.push(`${f.id}: ${verifyStep(f.id)[0]}. Evidence: ${verifyStep(f.id)[1]}`);
  const b04 = reviews.find((x) => x.id === 'B-04');
  if (b04) actions.push(`B-04: ${verifyStep('B-04')[0]}${b04.deadlines ? `; supplier deadline ${b04.deadlines.supplierBy.split('-').reverse().join('-')}` : ''}.`);
  if (flags.length >= 3) actions.push('Corroborate the risk indicators with transaction, movement, banking and counterparty evidence before drawing any conclusion.');
  if (fails.length || reviews.length) actions.push(DESK_REVIEW);
  return { headline, items: items.slice(0, 9), actions: actions.slice(0, 5) };
}

export function portfolioInsights(data) {
  const { taxpayers, catalog } = data;
  const cat = Object.fromEntries(catalog.map((r) => [r.id, r]));
  const items = [];
  const total = taxpayers.reduce((s, a) => s + a.exposure.confirmed, 0);
  const potential = taxpayers.reduce((s, a) => s + a.exposure.potential, 0);
  const byExp = [...taxpayers].sort((x, y) => y.exposure.confirmed + y.exposure.potential - (x.exposure.confirmed + x.exposure.potential));
  const hi = taxpayers.filter((a) => a.band === 'High' || a.band === 'Critical').sort((x, y) => y.score - x.score);
  // At thousands of taxpayers a briefing names a few and counts the rest; the lists live in the tiles.
  const some = (names, k = 5) => (names.length > k ? `${names.slice(0, k).join('; ')} and ${(names.length - k).toLocaleString('en-IN')} more` : names.join('; '));

  if (hi.length) items.push({ severity: 'critical', title: `${N(hi.length)} taxpayer${hi.length > 1 ? 's' : ''} rated high or critical risk`, refs: [], detail: some(hi.map((a) => `${a.name} (${a.score})`)) + '.' });
  const top = byExp[0];
  const topShare = (top.exposure.confirmed + top.exposure.potential) / Math.max(1, total + potential);
  if (topShare > 0.4) items.push({ severity: 'warning', title: `${pct(topShare)} of all exposure sits with one taxpayer`, refs: [], detail: `${top.name}: ${L(top.exposure.confirmed)} computed + ${L(top.exposure.potential)} under review, before verification.` });

  // systemic rules: failing or in review for at least half the portfolio
  const ids = [...new Set(taxpayers.flatMap((a) => a.results.map((r) => r.id)))];
  const systemic = ids.map((id) => ({ id, n: taxpayers.filter((a) => a.results.find((r) => r.id === id && (r.status === 'Fail' || r.status === 'Review'))).length }))
    .filter((x) => x.n >= Math.ceil(taxpayers.length / 2) && !x.id.startsWith('K-')).sort((a, b) => b.n - a.n).slice(0, 3);
  for (const s of systemic) items.push({ severity: 'warning', title: `${cat[s.id]?.check} flagged for ${N(s.n)} of ${N(taxpayers.length)} taxpayers`, refs: [s.id], detail: `A pattern across the jurisdiction rather than one taxpayer: a candidate for a trade circular or a common scrutiny drive. Verification: ${verifyStep(s.id)[0].toLowerCase()}.` });

  const fr = {};
  for (const a of taxpayers) for (const f of raisedIndicators(a)) (fr[f.key] ||= { label: f.label, n: [] }).n.push(a.name);
  const common = Object.entries(fr).sort((a, b) => b[1].n.length - a[1].n.length)[0];
  if (common) items.push({ severity: common[1].n.length >= 3 ? 'warning' : 'info', title: `Most common risk indicator: ${common[1].label} (${N(common[1].n.length)} taxpayers)`, refs: [`FR:${common[0]}`], detail: some(common[1].n) + '.' });

  const late = taxpayers.filter((a) => a.periodRecon.some((p) => p.delay > 0));
  if (late.length) items.push({ severity: 'info', title: `${N(late.length)} taxpayers filed at least one GSTR-3B late`, refs: ['A-02', 'J-01'], detail: some(late.map((a) => a.name)) + '.' });
  const clean = taxpayers.filter((a) => a.band === 'Low');
  if (clean.length) items.push({ severity: 'good', title: `${N(clean.length)} taxpayer${clean.length > 1 ? 's' : ''} low risk`, refs: [], detail: some(clean.map((a) => a.name)) + ': deprioritise for this cycle.' });

  items.sort((x, y) => RANK[x.severity] - RANK[y.severity]);
  return {
    headline: `${N(taxpayers.length)} taxpayers scrutinised: ${L(total)} computed and ${L(potential)} under review (preliminary, unverified); ${N(hi.length)} need priority review.`,
    items: items.slice(0, 8),
    actions: [
      hi[0] && `Open ${hi[0].name} first: highest risk score (${hi[0].score}).`,
      systemic[0] && `Address ${cat[systemic[0].id]?.check} (${systemic[0].id}) across the jurisdiction.`,
      'Prepare scrutiny notes only after each item is verified against books and the notice readiness checklist is complete.',
    ].filter(Boolean),
  };
}
