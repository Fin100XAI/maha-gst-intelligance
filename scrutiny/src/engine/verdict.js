// Where a taxpayer stands, in one line, and the few checks to look at first: the top of the Taxpayer 360 page, so an
// officer can act without reading every chart. Pure: the analysis, the rule catalogue and the case are passed in.
// Amounts are computed from returns and stay preliminary until an officer records an outcome.
import { isIssue } from './verify.js';
import { inr } from '../lib/format.js';

export const TOP_ACTIONS = 3;
const STATUS_RANK = { Fail: 0, Review: 1 };
const SEV_RANK = { High: 0, Med: 1, Low: 2 };
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// The catalogue's action reads "Reverse ITC; obtain vendor clarification": the first step is enough here.
const firstStep = (action) => String(action || '').split(/[;.]/)[0].trim();

/** What the officer should do next, from where the case stands. */
function nextStep(caseInfo, issues, disp) {
  const status = caseInfo.status || 'New';
  if (status === 'Closed') return 'Case closed.';
  if (['Notice drafted', 'Notice issued', 'Escalated'].includes(status)) return 'Follow the notice on the Notices page.';
  if (!issues.length) return 'Nothing to act on from the returns.';
  const open = issues.filter((r) => !disp[r.id]).length;
  if (status === 'New') return 'Start a review: check the evidence and record an outcome for each check.';
  if (open) return `${plural(open, 'check')} still need${open === 1 ? 's' : ''} an outcome.`;
  return issues.some((r) => disp[r.id]?.code === 'confirmed') ? 'Outcomes recorded: draft the ASMT-10.' : 'Outcomes recorded, none confirmed: consider closing the case.';
}

/**
 * @param {object} a         the taxpayer's analysis (results, exposure, band, score)
 * @param {object} cat       rule catalogue by id ({ check, action, severity })
 * @param {object} caseInfo  the case (status, dispositions)
 * @returns {{ tone: 'good'|'warn'|'bad', line: string, next: string, actions: { ruleId: string, check: string, todo: string, amount: number, status: string }[] }}
 */
export function verdict(a, cat = {}, caseInfo = {}) {
  const disp = caseInfo.dispositions || {};
  const issues = a.results.filter(isIssue);
  const fails = issues.filter((r) => r.status === 'Fail');
  const reviews = issues.filter((r) => r.status === 'Review');
  const ranked = [...issues].sort((x, y) => STATUS_RANK[x.status] - STATUS_RANK[y.status] || (y.exposure || 0) - (x.exposure || 0) || (SEV_RANK[cat[x.id]?.severity] ?? 1) - (SEV_RANK[cat[y.id]?.severity] ?? 1));
  const head = `${a.band} risk, score ${a.score}`;
  const next = nextStep(caseInfo, issues, disp);
  if (!issues.length) return { tone: 'good', line: `${head}: no check failed or needs review.`, next, actions: [] };
  const top = ranked[0];
  const computed = a.exposure?.confirmed || 0;
  const line = [
    `${head}: ${fails.length ? plural(fails.length, 'check') + ' failed' : 'no check failed'}`,
    computed ? ` with ${inr(computed)} computed (preliminary)` : '',
    reviews.length ? `, ${reviews.length} to review` : '',
    `. Largest: ${cat[top.id]?.check || top.id}${top.exposure ? ` (${inr(top.exposure)})` : ''}.`,
  ].join('');
  const actions = ranked.filter((r) => !disp[r.id]).slice(0, TOP_ACTIONS)
    .map((r) => ({ ruleId: r.id, check: cat[r.id]?.check || r.id, todo: firstStep(cat[r.id]?.action) || 'Verify the evidence', amount: r.exposure || 0, status: r.status }));
  return { tone: fails.length ? 'bad' : 'warn', line, next, actions };
}
