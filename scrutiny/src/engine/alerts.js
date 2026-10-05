// Alerts: the department decides what deserves attention (alert rules), and every analysis fills the officers' queue
// with the taxpayers that meet them. Pure and dependency-free (server evaluates, browser edits and previews).
//
// A rule: { id, name, enabled, priority: High|Medium|Low, when: { type, ... }, jurisdiction? }
//   when.type   band       band at or above when.band (Moderate | High | Critical)
//               score      risk score at or above when.min
//               rule       check when.ruleId failed, with at least when.min rupees at stake (0 = any)
//               indicator  risk indicator when.indicator raised
//               exposure   computed exposure at or above when.min rupees
// jurisdiction (optional) limits the rule to taxpayers of that jurisdiction in the taxpayer master.

export const PRIORITIES = ['High', 'Medium', 'Low'];
const BANDS = ['Low', 'Moderate', 'High', 'Critical'];
export const WHEN_TYPES = {
  band: 'Risk band at or above',
  score: 'Risk score at or above',
  rule: 'A check fails',
  indicator: 'A risk indicator is raised',
  exposure: 'Computed exposure at or above',
};

export const DEFAULT_RULES = [
  { id: 'high-risk', name: 'High or Critical risk', enabled: true, priority: 'High', when: { type: 'band', band: 'High' } },
  { id: 'itc-excess', name: 'ITC claimed above GSTR-2B (₹10 lakh or more)', enabled: true, priority: 'High', when: { type: 'rule', ruleId: 'B-01', min: 1000000 } },
  { id: 'returns-missing', name: 'GSTR-3B not filed for a period', enabled: true, priority: 'Medium', when: { type: 'rule', ruleId: 'A-02', min: 0 } },
  { id: 'non-filers', name: 'ITC from suppliers who did not file GSTR-3B', enabled: true, priority: 'Medium', when: { type: 'indicator', indicator: 'nonfiler' } },
];

const L = (v) => (v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)} L` : `₹${Math.round(v).toLocaleString('en-IN')}`);

/** @returns {string[]} what is wrong with a rule (empty when valid) */
export function validateRule(r) {
  const e = [];
  if (!r || typeof r !== 'object') return ['not a rule'];
  if (!/^[a-z0-9-]{2,40}$/.test(String(r.id || ''))) e.push('id: 2-40 lower-case letters, digits or hyphens');
  if (!String(r.name || '').trim() || String(r.name).length > 120) e.push('name: required, up to 120 characters');
  if (!PRIORITIES.includes(r.priority)) e.push(`priority: one of ${PRIORITIES.join(', ')}`);
  const w = r.when || {};
  if (!WHEN_TYPES[w.type]) e.push(`when: one of ${Object.keys(WHEN_TYPES).join(', ')}`);
  if (w.type === 'band' && !BANDS.slice(1).includes(w.band)) e.push('band: Moderate, High or Critical');
  if (['score', 'exposure', 'rule'].includes(w.type) && !(Number(w.min) >= 0)) e.push('min: a number, 0 or more');
  if (w.type === 'score' && Number(w.min) > 100) e.push('min: a score from 0 to 100');
  if (w.type === 'rule' && !/^[A-L]-\d{2}$/.test(String(w.ruleId || ''))) e.push('ruleId: a check ID such as B-01');
  if (w.type === 'indicator' && !/^[a-z]{2,20}$/.test(String(w.indicator || ''))) e.push('indicator: an indicator key such as nonfiler');
  if (r.jurisdiction !== undefined && r.jurisdiction !== null && r.jurisdiction !== '' && String(r.jurisdiction).length > 60) e.push('jurisdiction: up to 60 characters');
  return e;
}

/** Why a taxpayer meets a rule ({ reason, amount }), or null. */
export function matchRule(rule, a) {
  const w = rule.when;
  switch (w.type) {
    case 'band': return BANDS.indexOf(a.band) >= BANDS.indexOf(w.band) ? { reason: `Risk ${a.band} (${a.score})`, amount: a.exposure.confirmed } : null;
    case 'score': return a.score >= Number(w.min) ? { reason: `Risk score ${a.score}`, amount: a.exposure.confirmed } : null;
    case 'exposure': return a.exposure.confirmed >= Number(w.min) ? { reason: `Computed exposure ${L(a.exposure.confirmed)}`, amount: a.exposure.confirmed } : null;
    case 'rule': {
      const r = a.results.find((x) => x.id === w.ruleId);
      return r && r.status === 'Fail' && (r.exposure || 0) >= Number(w.min || 0) ? { reason: `${w.ruleId} failed${r.exposure ? `: ${L(r.exposure)}` : ''}`, amount: r.exposure || 0 } : null;
    }
    case 'indicator': {
      const f = a.fraud.find((x) => x.key === w.indicator);
      return f?.flagged ? { reason: `${f.label}: ${f.value}`, amount: 0 } : null;
    }
    default: return null;
  }
}

/**
 * Every (rule, taxpayer) match: the queue's raw material. key identifies an alert across analyses, so its status and
 * first-seen date survive re-analysis.
 * @param {object[]} rules
 * @param {object[]} taxpayers  analyses (latest year per GSTIN)
 * @param {{ master?: object[] }} [opts]  taxpayer master, for jurisdiction-scoped rules and the officer in charge
 */
export function evaluateAlerts(rules, taxpayers, { master = [] } = {}) {
  const reg = new Map(master.map((m) => [m.gstin, m]));
  const out = [];
  for (const rule of rules.filter((r) => r.enabled)) {
    for (const a of taxpayers) {
      const m = reg.get(a.gstin);
      if (rule.jurisdiction && m?.jurisdiction !== rule.jurisdiction) continue;
      const hit = matchRule(rule, a);
      if (!hit) continue;
      out.push({ key: `${rule.id}|${a.gstin}|${a.fy}`, ruleId: rule.id, rule: rule.name, priority: rule.priority, id: a.id, gstin: a.gstin, name: a.name, fy: a.fy,
        jurisdiction: m?.jurisdiction || null, officer: m?.officer || null, ...hit });
    }
  }
  const rank = (p) => PRIORITIES.indexOf(p);
  return out.sort((x, y) => rank(x.priority) - rank(y.priority) || y.amount - x.amount || x.name.localeCompare(y.name));
}
