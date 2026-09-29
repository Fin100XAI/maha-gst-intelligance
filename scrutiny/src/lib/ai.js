import { api } from './api.js';
// AI summariser (Together AI via the local dev-server proxy).
// Sends a compact, optionally masked fact sheet — never raw invoices — and validates the reply
// into the same shape as the deterministic engine: { headline, items[], actions[] }.
import { CONCLUSIVE, raisedIndicators } from '../engine/verify.js';

export const AI_MODELS = [
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo', note: 'balanced · structured output' },
  { id: 'deepseek-ai/DeepSeek-V4-Flash-0731', label: 'DeepSeek V4 Flash', note: 'low cost · structured output' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', note: 'low cost · structured output' },
  { id: 'Qwen/Qwen3.5-9B', label: 'Qwen 3.5 9B', note: 'fastest · structured output' },
  { id: 'zai-org/GLM-5.3-Flash', label: 'GLM-5.3 Flash', note: 'low cost · structured output' },
];
export const AI_DEFAULTS = { mode: 'deterministic', model: AI_MODELS[0].id, temperature: 0.2, maxTokens: 1400, mask: true, key: '' };

const SEVERITIES = new Set(['critical', 'warning', 'info', 'good']);
const L = (v) => { const a = Math.abs(v || 0); return a >= 1e7 ? `₹${(a / 1e7).toFixed(2)} Cr` : a >= 1e5 ? `₹${(a / 1e5).toFixed(2)} L` : `₹${Math.round(a).toLocaleString('en-IN')}`; };

// ---------------------------------------------------------------- masking
const PREFIX = { Taxpayer: 'T', Supplier: 'S', Customer: 'C', GSTIN: 'G' };
function makeMasker(enabled) {
  const map = new Map(); // real -> alias
  const counters = {};
  const alias = (real, kind) => {
    if (!enabled || !real) return real;
    const k = `${kind}|${real}`;
    if (!map.has(k)) { counters[kind] = (counters[kind] || 0) + 1; map.set(k, `${PREFIX[kind] || 'X'}${String(counters[kind]).padStart(2, '0')}`); }
    return map.get(k);
  };
  const unmask = (text) => {
    if (!enabled || typeof text !== 'string') return text;
    let t = text;
    // longest aliases first so "Supplier 12" is not hit by "Supplier 1"
    for (const [k, v] of map.entries()) t = t.replace(new RegExp(`\\b(?:Taxpayer |Supplier |Customer |GSTIN )?${v}\\b`, 'g'), k.split('|').slice(1).join('|'));
    return t;
  };
  return { alias, unmask, size: () => map.size };
}

// ---------------------------------------------------------------- fact sheets
export function taxpayerFacts(a, catalog, mask = true) {
  const m = makeMasker(mask);
  const cat = Object.fromEntries(catalog.map((r) => [r.id, r]));
  const name = m.alias(a.name, 'Taxpayer');
  const gstin = m.alias(a.gstin, 'GSTIN');
  const row = (r) => ({ id: r.id, check: cat[r.id]?.check, severity: cat[r.id]?.severity, legal: cat[r.id]?.legal, finding: mask ? r.finding.split(a.name).join(name).split(a.gstin).join(gstin) : r.finding, exposure: r.exposure ? L(r.exposure) : null });
  const late = a.periodRecon.filter((p) => p.delay > 0);
  const facts = {
    taxpayer: { name, gstin, state: a.state, filing: a.filing, fy: a.fy },
    risk: { score: a.score, band: a.band },
    profile: { turnover: L(a.profile.turnover), output_tax: L(a.profile.outputTax), itc_claimed: L(a.profile.itcClaimed), cash_paid: L(a.profile.cashPaid), cash_share: `${(a.profile.cashPct * 100).toFixed(1)}%`, customers: a.profile.customers, suppliers: a.profile.suppliers },
    exposure: { quantified: L(a.exposure.confirmed), potential: L(a.exposure.potential) },
    failed_checks: a.results.filter((r) => r.status === 'Fail').map(row),
    review_checks: a.results.filter((r) => r.status === 'Review').map(row),
    passed_check_ids: a.results.filter((r) => r.status === 'Pass').map((r) => r.id),
    fraud_signals_raised: raisedIndicators(a).map((f) => ({ ref: `FR:${f.key}`, signal: f.label, measured: f.value, meaning: f.why })),
    reconciliation: {
      periods: a.periodRecon.length,
      gstr1_minus_3b_tax: L(a.periodRecon.reduce((s, r) => s + r.taxGap, 0)),
      itc_claimed_minus_2b: L(a.periodRecon.reduce((s, r) => s + r.itcGap, 0)),
      periods_with_short_payment: a.periodRecon.filter((r) => r.taxGap > 1000).map((r) => r.label),
      periods_with_excess_itc: a.periodRecon.filter((r) => r.itcGap > 1000).map((r) => r.label),
      late_returns: late.map((r) => ({ period: r.label, days: r.delay })),
    },
    top_suppliers: a.charts.topSuppliers.list.slice(0, 5).map((s) => ({ name: m.alias(s.name, 'Supplier'), share: `${(s.share * 100).toFixed(1)}%`, taxable: L(s.value), filed_3b: !s.nonFiler })),
    top_customers: a.charts.topCustomers.list.slice(0, 5).map((s) => ({ name: m.alias(s.name, 'Customer'), share: `${(s.share * 100).toFixed(1)}%`, taxable: L(s.value) })),
    purchases_sales_correlation: a.correlation.cells.find((c) => c.a === 'outTaxable' && c.b === 'inTaxable')?.r ?? null,
  };
  const refs = new Set([...a.results.map((r) => r.id), ...a.fraud.map((f) => `FR:${f.key}`)]);
  return { facts, refs, masker: m };
}

export function portfolioFacts(data, mask = true) {
  const m = makeMasker(mask);
  const cat = Object.fromEntries(data.catalog.map((r) => [r.id, r]));
  const ids = [...new Set(data.taxpayers.flatMap((a) => a.results.map((r) => r.id)))];
  // Above 50 taxpayers the model gets the 25 highest-risk in full and the rest as counts: a fact sheet listing
  // thousands of taxpayers would exceed what the model can read and cost far more than it adds.
  const LIST = 25;
  const big = data.taxpayers.length > 50;
  const listed = big ? [...data.taxpayers].sort((x, y) => y.score - x.score).slice(0, LIST) : data.taxpayers;
  const facts = {
    population: { taxpayers: data.taxpayers.length, listed_in_full: listed.length, ...(big ? { note: `Only the ${LIST} highest-risk taxpayers are listed; groups give counts and at most 10 names.` } : {}) },
    taxpayers: listed.map((a) => ({
      name: m.alias(a.name, 'Taxpayer'), state: a.state, filing: a.filing, risk_score: a.score, band: a.band,
      turnover: L(a.profile.turnover), quantified: L(a.exposure.confirmed), potential: L(a.exposure.potential),
      failed: a.results.filter((r) => r.status === 'Fail').map((r) => r.id), review: a.results.filter((r) => r.status === 'Review').map((r) => r.id),
      fraud_signals: raisedIndicators(a).map((f) => f.label), late_returns: a.periodRecon.filter((p) => p.delay > 0).length,
    })),
    rule_names: Object.fromEntries(ids.map((id) => [id, cat[id]?.check])),
  };
  // Pre-computed groupings: models are unreliable at building membership lists themselves.
  const nm0 = (a) => m.alias(a.name, 'Taxpayer');
  // A group is its members, or for a large portfolio its size and first ten members.
  const group = (list) => (big ? { count: list.length, first: list.slice(0, 10).map(nm0) } : list.map(nm0));
  facts.groups = {
    by_band: Object.fromEntries(['Critical', 'High', 'Moderate', 'Low'].map((b) => [b, group(data.taxpayers.filter((a) => a.band === b))])),
    fraud_signal_members: Object.fromEntries(data.taxpayers[0].fraud.map((f) => [f.label, data.taxpayers.filter((a) => a.fraud.find((x) => x.key === f.key && x.flagged))]).filter(([, v]) => v.length).map(([k, v]) => [k, group(v)])),
    with_failed_checks: group(data.taxpayers.filter((a) => a.results.some((r) => r.status === 'Fail' && !r.id.startsWith('K-')))),
    without_failed_checks: group(data.taxpayers.filter((a) => !a.results.some((r) => r.status === 'Fail' && !r.id.startsWith('K-')))),
    late_filers: group(data.taxpayers.filter((a) => a.periodRecon.some((p) => p.delay > 0))),
    without_fraud_signals: group(data.taxpayers.filter((a) => !raisedIndicators(a).length)),
  };
  const refs = new Set([...ids, ...data.taxpayers[0].fraud.map((f) => `FR:${f.key}`)]);
  return { facts, refs, masker: m };
}

// ---------------------------------------------------------------- prompt
// Bump when the prompt changes so cached briefings written under the old rules are not reused.
const PROMPT_VERSION = 'p2';
const SYSTEM = `You assist a GST scrutiny officer in India. Summarise the most important insights from the JSON facts you are given.
Rules:
- Use ONLY the facts provided. Never invent numbers, taxpayers, suppliers, laws, dates or rule IDs.
- Every insight must cite the rule IDs or risk-indicator refs (e.g. "B-01", "FR:circular") it is based on in "refs"; use [] only for purely descriptive profile points.
- Money values are already formatted strings (e.g. "₹17,391", "₹1.80 L", "₹3.31 Cr"). Copy them EXACTLY; never convert units, round, add or recompute amounts.
- Names may be alias codes (T01 = a taxpayer, S01 = a supplier, C01 = a customer, G01 = a GSTIN). Always write the full code (e.g. "T01, T02 and T05"), never shorten to letters or numbers.
- Every finding is a preliminary system exception, not a determination of liability, ITC ineligibility, fraud, suppression or intent. Say "computed" or "flagged", never "owed", "evaded" or "fraud".
- Risk indicators (refs starting "FR:") are leads for enquiry only. A statistical indicator on its own (Benford, round figures, Sunday invoicing, turnover spike, weak purchase-sales correlation) is "warning", not "critical".
- Prioritise: computed tax exposure, then risk indicators, then compliance and patterns. Mention up to two things that reconcile cleanly (a zero GSTR-1 vs 3B gap is a positive result).
- When "groups" are provided, take every list of taxpayers from them exactly: do not add or drop members. Only call a taxpayer clean if it appears in both "without_failed_checks" and "without_fraud_signals" (or its band is Low).
- One item per distinct issue; do not repeat the same taxpayer and issue in two items.
- Be concise and specific; no generic advice.
Reply with JSON only, exactly this shape:
{"headline": string (one sentence), "items": [{"severity": "critical"|"warning"|"info"|"good", "title": string (≤ 90 chars), "detail": string (≤ 280 chars), "refs": [string]}] (max 8), "actions": [string] (max 4, verification steps only: what to verify, reconcile or obtain as evidence. Never instruct payment, DRC-03, reversal of ITC, or issuing / drafting a notice)}`;

export function buildMessages(scope, facts) {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Scope: ${scope === 'portfolio' ? 'portfolio of taxpayers in one jurisdiction' : 'one taxpayer'}.\nFacts (JSON):\n${JSON.stringify(facts)}` },
  ];
}

// ---------------------------------------------------------------- figure grounding
const toRupees = (txt) => {
  const m = String(txt).match(/₹\s?([\d,]+(?:\.\d+)?)\s*(cr|crore|l|lakh|lakhs|k)?\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  const u = (m[2] || '').toLowerCase();
  return n * (u.startsWith('c') ? 1e7 : u.startsWith('l') ? 1e5 : u === 'k' ? 1e3 : 1);
};
export function sourceAmounts(facts) {
  const out = [];
  JSON.stringify(facts).replace(/₹\s?[\d,]+(?:\.\d+)?\s*(?:Cr|L)?/g, (x) => { const v = toRupees(x); if (v !== null) out.push(v); return x; });
  return out;
}
export function ungroundedAmounts(text, allowed) {
  const bad = [];
  String(text).replace(/₹\s?[\d,]+(?:\.\d+)?\s*(?:crore|cr|lakhs?|l|k)?\b/gi, (x) => {
    const v = toRupees(x);
    if (v !== null && !allowed.some((a) => (a === 0 ? v === 0 : Math.abs(v - a) / Math.abs(a) <= 0.015))) bad.push(x.trim());
    return x;
  });
  return bad;
}

// ---------------------------------------------------------------- parse + validate
export function parseInsights(content, refsAllowed, masker, allowedAmounts = null) {
  let text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('The model did not return JSON.');
  let obj;
  try { obj = JSON.parse(text.slice(start, end + 1)); } catch { throw new Error('The model returned malformed JSON.'); }
  const un = (s) => masker.unmask(String(s ?? '').slice(0, 600)).replace(/\s*\u2014\s*/g, ': ');
  let dropped = 0;
  const items = (Array.isArray(obj.items) ? obj.items : []).slice(0, 10).map((it) => {
    const refs = (Array.isArray(it.refs) ? it.refs : []).map(String).filter((r) => { const ok = refsAllowed.has(r); if (!ok) dropped++; return ok; });
    const out = { severity: SEVERITIES.has(String(it.severity).toLowerCase()) ? String(it.severity).toLowerCase() : 'info', title: un(it.title), detail: un(it.detail), refs };
    if (allowedAmounts) out.unverified = ungroundedAmounts(`${out.title} ${out.detail}`, allowedAmounts);
    return out;
  }).filter((it) => it.title);
  if (!items.length) throw new Error('The model returned no insights.');
  const headline = un(obj.headline) || 'Summary';
  // Verification-first: drop any action that instructs payment, reversal or a notice from unverified data.
  const rawActions = (Array.isArray(obj.actions) ? obj.actions : []).slice(0, 5).map(un).filter(Boolean);
  const actions = rawActions.filter((x) => !CONCLUSIVE.test(x));
  const droppedActions = rawActions.length - actions.length;
  const unverified = allowedAmounts ? [...ungroundedAmounts(headline, allowedAmounts), ...actions.flatMap((x) => ungroundedAmounts(x, allowedAmounts)), ...items.flatMap((i) => i.unverified || [])] : [];
  return { headline, items, actions, droppedRefs: dropped, droppedActions, unverifiedFigures: unverified };
}

// ---------------------------------------------------------------- call
export async function aiSummarise({ scope, facts, refs, masker, settings }) {
  const headers = { 'content-type': 'application/json' };
  if (settings.key) headers['x-together-key'] = settings.key;
  const r = await fetch(api('/__ai/chat'), {
    method: 'POST', headers,
    body: JSON.stringify({ model: settings.model, messages: buildMessages(scope, facts), temperature: settings.temperature, max_tokens: settings.maxTokens, json: true }),
  });
  const body = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  const parsed = parseInsights(body.content, refs, masker, sourceAmounts(facts));
  return { ...parsed, meta: { model: body.model, ms: body.ms, usage: body.usage, at: new Date().toISOString(), masked: settings.mask } };
}

export async function aiStatus() {
  try { const r = await fetch(api('/__ai/status')); if (!r.ok || !r.headers.get('content-type')?.includes('json')) return null; return await r.json(); } catch { return null; }
}

export function insightCacheKey(scope, id, facts, settings) {
  return `${PROMPT_VERSION}:${scope}:${id}:${settings.model}:${settings.mask ? 'm' : 'u'}:${factsHash(facts)}`;
}

export const factsHash = (o) => { const s = JSON.stringify(o); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
export { L as fmtInr };
