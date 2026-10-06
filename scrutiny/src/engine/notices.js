// After an ASMT-10 is drafted: where each notice stands, what needs doing next (the follow-ups the officer queue
// raises), and the DRC-01 summary drafted on escalation. Pure and dependency-free; dates are ISO strings and "today"
// is passed in, never read from the clock.
import { HEADS, addHeads } from './heads.js';

const DAY = 86400000;
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
export const NOT_ISSUED_AFTER = 7; // days a saved draft may wait before the queue asks for it to be issued
export const DUE_SOON = 7; // days before the reply deadline the queue starts reminding

const sameOfficer = (viewer, a) => (viewer?.id && a?.requestedById ? viewer.id === a.requestedById : String(viewer?.name || '').trim().toLowerCase() === String(a?.requestedBy || '').trim().toLowerCase());
const dayOf = (iso, today) => String(iso || today).slice(0, 10);

/**
 * @param {object} notice    saved notice (draft, plus approvals / issue / reminders / escalation once recorded)
 * @param {object} caseInfo  the case (status, responses)
 * @param {string} today     YYYY-MM-DD
 * @returns {{ stage: 'drafted'|'approval'|'returned'|'approved'|'awaiting'|'overdue'|'replied'|'escalation-pending'|'escalated'|'closed', days: number, reply?: object, approval?: object }}
 *   days: since drafting (drafted), since asking or deciding (approval, returned, approved), to the deadline
 *   (awaiting), past it (overdue)
 */
export function noticeStage(notice, caseInfo = {}, today) {
  if (caseInfo.status === 'Closed') return { stage: 'closed', days: 0 };
  if (notice.escalation) return { stage: 'escalated', days: 0 };
  const since = (iso) => Math.max(0, daysBetween(dayOf(iso, today), today));
  if (!notice.issue) {
    const a = notice.approvals?.issue;
    if (a?.status === 'pending') return { stage: 'approval', days: since(a.requestedAt), approval: a };
    if (a?.status === 'approved') return { stage: 'approved', days: since(a.decidedAt), approval: a };
    if (a?.status === 'returned') return { stage: 'returned', days: since(a.decidedAt), approval: a };
    return { stage: 'drafted', days: since(notice.savedAt) };
  }
  const esc = notice.approvals?.escalate;
  if (esc?.status === 'pending') return { stage: 'escalation-pending', days: since(esc.requestedAt), approval: esc };
  const reply = (caseInfo.responses || []).filter((r) => r.received >= notice.issue.issued).sort((x, y) => (x.received < y.received ? 1 : -1))[0];
  if (reply) return { stage: 'replied', days: 0, reply };
  const left = daysBetween(today, notice.issue.replyDue);
  return left < 0 ? { stage: 'overdue', days: -left } : { stage: 'awaiting', days: left };
}

export const RETURNED_SHOWN_DAYS = 14; // how long a returned escalation stays in the asking officer's queue

/**
 * What the notice workflow needs from an officer now, for the queue.
 * @param {{ viewer?: { id?: string, name?: string, canApprove?: boolean } }} o  the officer looking: requests from
 *   others that they may approve are theirs to decide; their own requests are not
 * @returns {{ kind: 'approve'|'issue'|'returned'|'due-soon'|'overdue'|'reply', priority: 'High'|'Medium'|'Low', id, gstin, name, text, ref }[]}
 */
export function followUps({ notices = {}, cases = {}, taxpayers = [], today, viewer = null }) {
  const byId = new Map(taxpayers.map((a) => [a.id, a]));
  const out = [];
  const plural = (n) => `${n} day${n === 1 ? '' : 's'}`;
  const mayDecide = (a) => !!viewer?.canApprove && !sameOfficer(viewer, a);
  for (const [id, n] of Object.entries(notices)) {
    const a = byId.get(id);
    const s = noticeStage(n, cases[id], today);
    const base = { id, gstin: a?.gstin || id, name: a?.name || id, ref: n.issue?.ref || n.ref };
    const lastReminder = (n.reminders || [])[0];
    if (s.stage === 'drafted' && s.days >= NOT_ISSUED_AFTER) out.push({ ...base, kind: 'issue', priority: 'Medium', text: `ASMT-10 drafted ${plural(s.days)} ago and not sent for approval: ask a second officer to approve its issue, or withdraw the draft` });
    if (s.stage === 'approval' && mayDecide(s.approval)) out.push({ ...base, kind: 'approve', priority: 'High', text: `Approve or return the issue of this ASMT-10 (asked by ${s.approval.requestedBy}${s.days ? `, ${plural(s.days)} ago` : ' today'})` });
    if (s.stage === 'approved') out.push({ ...base, kind: 'issue', priority: 'Medium', text: `Issue approved by ${s.approval.decidedBy}: issue the ASMT-10 and record the issue here` });
    if (s.stage === 'returned') out.push({ ...base, kind: 'returned', priority: 'Medium', text: `Returned by ${s.approval.decidedBy}: ${s.approval.decisionNote}. Revise the draft and ask again` });
    if (s.stage === 'escalation-pending' && mayDecide(s.approval)) out.push({ ...base, kind: 'approve', priority: 'High', text: `Approve or return the escalation under s.${s.approval.section} (asked by ${s.approval.requestedBy}: ${s.approval.reason})` });
    if (s.stage === 'awaiting' && s.days <= DUE_SOON) out.push({ ...base, kind: 'due-soon', priority: 'Low', text: `Reply due in ${plural(s.days)} (${n.issue.replyDue})` });
    if (s.stage === 'overdue') {
      const recent = lastReminder && daysBetween(lastReminder.sent, today) < DUE_SOON;
      out.push({ ...base, kind: 'overdue', priority: recent ? 'Medium' : 'High', text: `Reply overdue by ${plural(s.days)}${lastReminder ? ` (last reminder ${lastReminder.sent})` : ''}: send a reminder or ask for approval to escalate to DRC-01` });
    }
    if (s.stage === 'replied') out.push({ ...base, kind: 'reply', priority: 'Medium', text: `Reply received ${s.reply.received}: review it, then close the case or ask for approval to escalate` });
    const esc = n.approvals?.escalate;
    if (esc?.status === 'returned' && !n.escalation && s.stage !== 'closed' && daysBetween(dayOf(esc.decidedAt, today), today) <= RETURNED_SHOWN_DAYS) out.push({ ...base, kind: 'returned', priority: 'Low', text: `Escalation returned by ${esc.decidedBy}: ${esc.decisionNote}` });
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
    officer.name, officer.designation, officer.jurisdiction,
    ...(notice.escalation?.approvedBy ? [`Escalation approved by: ${notice.escalation.approvedBy}`] : []), '',
    'DRAFT for review by the proper officer: amounts are computed from returns data and must be verified before issue.',
  ].join('\n');
}
