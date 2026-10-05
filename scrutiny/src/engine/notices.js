// After an ASMT-10 is drafted: where each notice stands, what needs doing next (the follow-ups the officer queue
// raises), and the DRC-01 summary drafted on escalation. Pure and dependency-free; dates are ISO strings and "today"
// is passed in, never read from the clock.
import { HEADS, addHeads } from './heads.js';

const DAY = 86400000;
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
export const NOT_ISSUED_AFTER = 7; // days a saved draft may wait before the queue asks for it to be issued
export const DUE_SOON = 7; // days before the reply deadline the queue starts reminding

/**
 * @param {object} notice    saved notice (draft, plus issue / reminders / escalation once recorded)
 * @param {object} caseInfo  the case (status, responses)
 * @param {string} today     YYYY-MM-DD
 * @returns {{ stage: 'drafted'|'awaiting'|'overdue'|'replied'|'escalated'|'closed', days: number, reply?: object }}
 *   days: since drafting (drafted), to the deadline (awaiting), past it (overdue)
 */
export function noticeStage(notice, caseInfo = {}, today) {
  if (caseInfo.status === 'Closed') return { stage: 'closed', days: 0 };
  if (notice.escalation) return { stage: 'escalated', days: 0 };
  if (!notice.issue) return { stage: 'drafted', days: Math.max(0, daysBetween(String(notice.savedAt || today).slice(0, 10), today)) };
  const reply = (caseInfo.responses || []).filter((r) => r.received >= notice.issue.issued).sort((x, y) => (x.received < y.received ? 1 : -1))[0];
  if (reply) return { stage: 'replied', days: 0, reply };
  const left = daysBetween(today, notice.issue.replyDue);
  return left < 0 ? { stage: 'overdue', days: -left } : { stage: 'awaiting', days: left };
}

/**
 * What the notice workflow needs from an officer now, for the queue.
 * @returns {{ kind: 'issue'|'due-soon'|'overdue'|'reply', priority: 'High'|'Medium'|'Low', id, gstin, name, text, ref }[]}
 */
export function followUps({ notices = {}, cases = {}, taxpayers = [], today }) {
  const byId = new Map(taxpayers.map((a) => [a.id, a]));
  const out = [];
  for (const [id, n] of Object.entries(notices)) {
    const a = byId.get(id);
    const s = noticeStage(n, cases[id], today);
    const base = { id, gstin: a?.gstin || id, name: a?.name || id, ref: n.issue?.ref || n.ref };
    const lastReminder = (n.reminders || [])[0];
    if (s.stage === 'drafted' && s.days >= NOT_ISSUED_AFTER) out.push({ ...base, kind: 'issue', priority: 'Medium', text: `ASMT-10 drafted ${s.days} days ago and not recorded as issued: issue it, or withdraw the draft` });
    if (s.stage === 'awaiting' && s.days <= DUE_SOON) out.push({ ...base, kind: 'due-soon', priority: 'Low', text: `Reply due in ${s.days} day${s.days === 1 ? '' : 's'} (${n.issue.replyDue})` });
    if (s.stage === 'overdue') {
      const recent = lastReminder && daysBetween(lastReminder.sent, today) < DUE_SOON;
      out.push({ ...base, kind: 'overdue', priority: recent ? 'Medium' : 'High', text: `Reply overdue by ${s.days} day${s.days === 1 ? '' : 's'}${lastReminder ? ` (last reminder ${lastReminder.sent})` : ''}: send a reminder or escalate to DRC-01` });
    }
    if (s.stage === 'replied') out.push({ ...base, kind: 'reply', priority: 'Medium', text: `Reply received ${s.reply.received}: review it, then close the case or escalate` });
  }
  const rank = { High: 0, Medium: 1, Low: 2 };
  return out.sort((x, y) => rank[x.priority] - rank[y.priority] || x.name.localeCompare(y.name));
}

const SECTION_NOTE = {
  73: 'Demand under s.73 (no fraud, wilful misstatement or suppression alleged). Penalty: 10% of tax or ₹10,000, whichever is higher; nil if tax and interest are paid within 30 days of this notice.',
  74: 'Demand under s.74 (fraud, wilful misstatement or suppression of facts alleged). Penalty equal to the tax; reduced to 15% / 25% / 50% if paid at the stages the section allows.',
  '74A': 'Demand under s.74A (tax periods from FY 2024-25). Penalty: 10% of tax or ₹10,000, whichever is higher, where no fraud or suppression is alleged; equal to the tax where it is, reduced if paid within 60 days of this notice.',
};
const rs = (v) => Math.round(v || 0).toLocaleString('en-IN');

/**
 * Text of the DRC-01 summary drafted on escalation: the confirmed discrepancies of the ASMT-10, head by head.
 * @param {{ a: object, notice: object, items: object[], cat: object, section: string, reason: string, officer: { name, designation, jurisdiction }, today: string }} p
 */
// Amounts that are not tax: interest (J-01) and late fee (J-03) are demanded separately from tax.
const KIND = { 'J-01': 'interest', 'J-03': 'late fee' };
export const amountKind = (ruleId) => KIND[ruleId] || 'tax';

export function drc01Text({ a, notice, items, cat, section, reason, officer, today }) {
  const taxItems = items.filter((r) => amountKind(r.id) === 'tax');
  const heads = addHeads(...taxItems.map((r) => r.heads));
  const total = taxItems.reduce((s, r) => s + (r.exposure || 0), 0);
  const interest = items.filter((r) => amountKind(r.id) === 'interest').reduce((s, r) => s + (r.exposure || 0), 0);
  const lateFee = items.filter((r) => amountKind(r.id) === 'late fee').reduce((s, r) => s + (r.exposure || 0), 0);
  const line = (h) => HEADS.map((k) => `${k.toUpperCase()} ₹${rs(h?.[k])}`).join(' · ');
  return [
    'FORM GST DRC-01', '[See rule 142(1)(a)]', 'Summary of Show Cause Notice', '',
    `Date: ${today.split('-').reverse().join('-')}`,
    `GSTIN: ${a.gstin}`, `Name: ${a.name}`, `Tax period: FY ${a.fy}`, `Section: ${section}`,
    `Reference: ASMT-10 ${notice.issue?.ref || notice.ref}${notice.issue ? ` issued ${notice.issue.issued.split('-').reverse().join('-')}` : ''}`, '',
    'Brief facts of the case:', reason, '',
    'Grounds and quantification:',
    ...items.map((r, i) => `${i + 1}. [${r.id}] ${cat[r.id]?.check || ''} (${cat[r.id]?.legal || ''}): ${r.finding} ${amountKind(r.id) === 'tax' ? 'Tax' : amountKind(r.id) === 'interest' ? 'Interest' : 'Late fee'}: ₹${rs(r.exposure)} (${line(r.heads)}).`),
    '', `Tax demanded (indicative): ₹${rs(total)}  (${line(heads)})`,
    `Interest: under s.50 on the tax demanded, computed to the date of payment${interest ? `; plus ₹${rs(interest)} not paid on returns filed late` : ''}.`,
    ...(lateFee ? [`Late fee: ₹${rs(lateFee)} (under the CGST and SGST Acts, half each).`] : []),
    `Penalty: ${SECTION_NOTE[section]}`, '',
    officer.name, officer.designation, officer.jurisdiction, '',
    'DRAFT for review by the proper officer: amounts are computed from returns data and must be verified before issue.',
  ].join('\n');
}
