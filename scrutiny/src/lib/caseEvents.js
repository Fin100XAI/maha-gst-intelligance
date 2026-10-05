// Case events: every change to a case is an event, and case state is the result of replaying the events in order.
// Pure and shared by the browser (optimistic updates, offline fallback) and the server (the append-only log of
// record), so both always compute the same state. Event shape: { type, caseId, at, by, ...payload }; the server
// adds seq and receivedAt when it stores an event.
import { DISPOSITIONS, DISPOSITION_LABEL, CLOSURE, CLOSURE_LABEL, READINESS } from '../engine/verify.js';

export const HISTORY_LIMIT = 50;
export const EVENT_TYPES = ['status', 'note', 'readiness', 'disposition', 'response', 'log', 'close', 'notice', 'notice-issue', 'notice-reminder', 'notice-escalate', 'approval-request', 'approval-decide', 'import', 'eiu-reply', 'eiu-challenge', 'eiu-review'];
// How a notice reached the taxpayer (the portal itself has no interface for this platform: the officer records it)
export const ISSUE_MODES = ['GST portal', 'Email', 'Registered post', 'By hand'];
export const SCN_SECTIONS = ['73', '74', '74A'];
// Maker-checker: issuing an ASMT-10 and escalating to a show cause notice each need a second officer's approval
// (guardEvent below). The officer who asks can never be the one who approves.
export const APPROVAL_STAGES = { issue: 'Issue of the ASMT-10', escalate: 'Escalation to a show cause notice (DRC-01)' };
export const APPROVAL_DECISIONS = { approve: 'Approved', return: 'Returned' };
export const EIU_REVIEW = { agree: 'Agrees with the revalidation', disagree: 'Disagrees with the revalidation' };
// Statuses an officer may set directly. "Notice drafted" comes only from saving a notice, "Closed" only from a
// reasoned closure, so neither can be set by hand.
export const MANUAL_STATUSES = ['New', 'In review'];
const NOTE_REQUIRED = new Set(['reasons', 'approval']);

export const emptyState = () => ({ cases: {}, notices: {} });
const blank = () => ({ status: 'New' });
const eiuOf = (c, id) => c.eiu?.[id] || {};
const withEiu = (c, id, e) => ({ ...c, eiu: { ...(c.eiu || {}), [id]: e } });
const withLog = (c, ev, text) => ({ ...c, history: [{ at: ev.at, by: ev.by, text }, ...(c.history || [])].slice(0, HISTORY_LIMIT) });

/** Apply one event to { cases, notices } and return the new state (inputs are never mutated). */
export function applyEvent(state, ev) {
  const { cases, notices } = state;
  // A browser's pre-server records, imported once; anything already on the server wins.
  if (ev.type === 'import') return { cases: { ...ev.cases, ...cases }, notices: { ...ev.notices, ...notices } };
  const id = ev.caseId;
  const c = cases[id] || blank();
  let next;
  let nextNotices = notices;
  switch (ev.type) {
    case 'status':
      next = withLog({ ...c, status: ev.status, assignee: c.assignee || ev.by }, ev, `Status → ${ev.status}`);
      break;
    case 'note':
      next = withLog({ ...c, notes: [{ at: ev.at, by: ev.by, text: ev.text }, ...(c.notes || [])] }, ev, 'Note added');
      break;
    case 'readiness': {
      const r = { ...(c.readiness || {}) };
      if (ev.done) r[ev.key] = { at: ev.at, by: ev.by, ...(ev.note ? { note: ev.note } : {}) }; else delete r[ev.key];
      next = withLog({ ...c, readiness: r }, ev, `Readiness ${ev.done ? 'recorded' : 'withdrawn'}: ${ev.label}${ev.note ? ` (${ev.note})` : ''}`);
      break;
    }
    case 'disposition': {
      const d = { ...(c.dispositions || {}) };
      if (ev.code) d[ev.ruleId] = { code: ev.code, note: ev.note, at: ev.at, by: ev.by }; else delete d[ev.ruleId];
      next = withLog({ ...c, dispositions: d }, ev, ev.code ? `${ev.ruleId}: ${DISPOSITION_LABEL[ev.code]} (${ev.note})` : `${ev.ruleId}: outcome withdrawn`);
      break;
    }
    case 'response':
      next = withLog({ ...c, responses: [{ received: ev.received, ref: ev.ref || '', text: ev.text, at: ev.at, by: ev.by }, ...(c.responses || [])] }, ev,
        `Taxpayer response recorded (received ${ev.received}${ev.ref ? `, ${ev.ref}` : ''})`);
      break;
    case 'log':
      next = withLog(c, ev, ev.text);
      break;
    case 'close':
      next = withLog({ ...c, status: 'Closed', closure: { code: ev.code, label: CLOSURE_LABEL[ev.code], reason: ev.reason, at: ev.at, by: ev.by } }, ev, `Closed: ${CLOSURE_LABEL[ev.code]} (${ev.reason})`);
      break;
    // EIU signals (per taxpayer case, per signal id): the reply received, the officer's challenge (exclusions and
    // assumptions, always with a reason), and the officer's review of the revalidation.
    case 'eiu-reply': {
      const e = eiuOf(c, ev.signalId);
      next = withLog(withEiu(c, ev.signalId, { ...e, replies: [{ received: ev.received, from: ev.from, ref: ev.ref || '', text: ev.text, ...(ev.doc ? { doc: ev.doc } : {}), at: ev.at, by: ev.by }, ...(e.replies || [])] }), ev,
        `${ev.signalId}: reply from ${ev.from} recorded (received ${ev.received}${ev.doc ? `, document ${ev.doc.name}` : ''})`);
      break;
    }
    case 'eiu-challenge': {
      const e = eiuOf(c, ev.signalId);
      const challenge = { excluded: ev.excluded, assumptions: ev.assumptions, reason: ev.reason, at: ev.at, by: ev.by };
      next = withLog(withEiu(c, ev.signalId, { ...e, challenge, challenges: [challenge, ...(e.challenges || [])].slice(0, HISTORY_LIMIT) }), ev,
        `${ev.signalId}: challenge set (${ev.excluded.length} excluded${Object.keys(ev.assumptions).length ? `, ${Object.keys(ev.assumptions).length} assumption(s) changed` : ''}): ${ev.reason}`);
      break;
    }
    case 'eiu-review': {
      const e = eiuOf(c, ev.signalId);
      next = withLog(withEiu(c, ev.signalId, { ...e, review: { verdict: ev.verdict, note: ev.note || '', status: ev.status || null, at: ev.at, by: ev.by } }), ev,
        `${ev.signalId}: ${EIU_REVIEW[ev.verdict]}${ev.status ? ` (${ev.status})` : ''}${ev.note ? `: ${ev.note}` : ''}`);
      break;
    }
    case 'notice':
      nextNotices = { ...notices, [id]: ev.notice };
      // a changed draft is a new draft: any approval given to the earlier one no longer applies
      next = withLog({ ...c, status: 'Notice drafted', assignee: c.assignee || ev.by }, ev, `ASMT-10 drafted · ${ev.notice.items.length} items · reply by ${ev.notice.due}${notices[id]?.approvals ? ' · the earlier approval request no longer applies' : ''}`);
      break;
    // After drafting: the officer records the issue (outside this platform), any reminders, and the escalation to a
    // show cause notice when no acceptable reply comes. The draft itself is never changed by these.
    case 'notice-issue': {
      const n = notices[id] || {};
      nextNotices = { ...notices, [id]: { ...n, issue: { ref: ev.ref, issued: ev.issued, mode: ev.mode, replyDue: ev.replyDue, at: ev.at, by: ev.by } } };
      next = withLog({ ...c, status: 'Notice issued' }, ev, `ASMT-10 issued · ${ev.ref} · ${ev.mode} · ${ev.issued} · reply due ${ev.replyDue}`);
      break;
    }
    case 'notice-reminder': {
      const n = notices[id] || {};
      nextNotices = { ...notices, [id]: { ...n, reminders: [{ sent: ev.sent, mode: ev.mode, note: ev.note || '', at: ev.at, by: ev.by }, ...(n.reminders || [])] } };
      next = withLog(c, ev, `Reminder sent · ${ev.mode} · ${ev.sent}${ev.note ? ` (${ev.note})` : ''}`);
      break;
    }
    // Recorded before maker-checker; kept so that earlier logs still replay. New escalations go through approval.
    case 'notice-escalate': {
      const n = notices[id] || {};
      nextNotices = { ...notices, [id]: { ...n, escalation: { section: ev.section, reason: ev.reason, at: ev.at, by: ev.by } } };
      next = withLog({ ...c, status: 'Escalated' }, ev, `Escalated: DRC-01 drafted under s.${ev.section} (${ev.reason})`);
      break;
    }
    case 'approval-request': {
      const n = notices[id] || {};
      const request = { status: 'pending', requestedBy: ev.by, requestedById: ev.byId || null, requestedAt: ev.at, note: ev.note || '', ...(ev.stage === 'escalate' ? { section: ev.section, reason: ev.reason } : {}) };
      nextNotices = { ...notices, [id]: { ...n, approvals: { ...(n.approvals || {}), [ev.stage]: request } } };
      next = withLog(c, ev, `Approval asked: ${APPROVAL_STAGES[ev.stage]}${ev.stage === 'escalate' ? ` under s.${ev.section} (${ev.reason})` : ''}${ev.note ? ` · ${ev.note}` : ''}`);
      break;
    }
    case 'approval-decide': {
      const n = notices[id] || {};
      const a = n.approvals?.[ev.stage] || {};
      const decided = { ...a, status: ev.decision === 'approve' ? 'approved' : 'returned', decidedBy: ev.by, decidedById: ev.byId || null, decidedAt: ev.at, decisionNote: ev.note || '' };
      const approved = ev.decision === 'approve';
      // An approved escalation is the escalation: the DRC-01 summary is drafted from what was asked and approved.
      const escalation = approved && ev.stage === 'escalate' ? { escalation: { section: a.section, reason: a.reason, at: ev.at, by: a.requestedBy, approvedBy: ev.by } } : {};
      nextNotices = { ...notices, [id]: { ...n, approvals: { ...(n.approvals || {}), [ev.stage]: decided }, ...escalation } };
      const status = escalation.escalation ? { status: 'Escalated' } : {};
      next = withLog({ ...c, ...status }, ev, `${APPROVAL_DECISIONS[ev.decision]}: ${APPROVAL_STAGES[ev.stage]} (asked by ${a.requestedBy || 'unknown'})${ev.note ? ` · ${ev.note}` : ''}`);
      break;
    }
    default:
      throw new Error(`Unknown case event type: ${ev.type}`);
  }
  return { cases: { ...cases, [id]: next }, notices: nextNotices };
}

export const replay = (events, init = emptyState()) => events.reduce(applyEvent, init);

// ------------------------------------------------------------------ validation (the server rejects invalid events)
const isStr = (v, max, { required = true } = {}) => (v === undefined || v === null || v === '' ? !required : typeof v === 'string' && v.length <= max);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const DISPOSITION_CODES = new Set(DISPOSITIONS.map(([k]) => k));
const CLOSURE_CODES = new Set(CLOSURE.map(([k]) => k));
const READINESS_KEYS = new Set(READINESS.map(([k]) => k));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** @returns {string|null} why the event is invalid, or null when it is valid */
export function validateEvent(ev) {
  if (!isObj(ev)) return 'event must be an object';
  if (!EVENT_TYPES.includes(ev.type)) return `unknown type ${String(ev.type).slice(0, 40)}`;
  if (!isStr(ev.at, 40)) return 'at is required';
  if (!isStr(ev.by, 120, { required: false })) return 'by is too long';
  if (!isStr(ev.byId, 80, { required: false })) return 'byId is too long';
  if (ev.type === 'import') return isObj(ev.cases) && isObj(ev.notices) ? null : 'import needs cases and notices objects';
  if (!isStr(ev.caseId, 160) || !/^[\w .()&,-]+$/.test(ev.caseId)) return 'caseId is missing or invalid';
  switch (ev.type) {
    case 'status': return MANUAL_STATUSES.includes(ev.status) ? null : `status must be one of ${MANUAL_STATUSES.join(', ')} (closure and notices have their own steps)`;
    case 'note': return isStr(ev.text, 5000) ? null : 'note text is required (max 5000 characters)';
    case 'readiness':
      if (!READINESS_KEYS.has(ev.key)) return 'unknown readiness step';
      if (typeof ev.done !== 'boolean') return 'done must be true or false';
      if (!isStr(ev.label, 300)) return 'label is required';
      if (!isStr(ev.note, 1000, { required: false })) return 'note is too long';
      if (ev.done && NOTE_REQUIRED.has(ev.key) && !ev.note) return `step "${ev.key}" needs a written record`;
      return null;
    case 'disposition':
      if (!isStr(ev.ruleId, 12)) return 'ruleId is required';
      if (ev.code === null || ev.code === undefined) return null; // withdrawal
      if (!DISPOSITION_CODES.has(ev.code)) return 'unknown outcome code';
      return isStr(ev.note, 2000) ? null : 'an outcome needs written reasons';
    case 'response':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ev.received))) return 'received must be a date (YYYY-MM-DD)';
      if (!isStr(ev.ref, 200, { required: false })) return 'reference is too long';
      return isStr(ev.text, 5000) ? null : 'response summary is required';
    case 'log': return isStr(ev.text, 1000) ? null : 'log text is required';
    case 'close':
      if (!CLOSURE_CODES.has(ev.code)) return 'unknown closure code';
      return isStr(ev.reason, 5000) ? null : 'closure reasons are required';
    case 'eiu-reply':
      if (!isStr(ev.signalId, 60)) return 'signalId is required';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ev.received))) return 'received must be a date (YYYY-MM-DD)';
      if (!['Taxpayer', 'CA', 'Other'].includes(ev.from)) return 'from must be Taxpayer, CA or Other';
      if (!isStr(ev.ref, 200, { required: false })) return 'reference is too long';
      if (ev.doc !== undefined && !(isObj(ev.doc) && isStr(ev.doc.name, 200) && /^[0-9a-f]{64}$/.test(String(ev.doc.sha256)) && Number.isFinite(ev.doc.size) && isStr(ev.doc.type, 120))) return 'doc must name a stored document (name, sha256, size, type)';
      return isStr(ev.text, 20000) ? null : 'reply text is required (max 20000 characters)';
    case 'eiu-challenge':
      if (!isStr(ev.signalId, 60)) return 'signalId is required';
      if (!Array.isArray(ev.excluded) || ev.excluded.length > 500 || !ev.excluded.every((x) => isStr(x, 120))) return 'excluded must be a list of component ids';
      if (!isObj(ev.assumptions) || !Object.values(ev.assumptions).every((v) => typeof v === 'boolean')) return 'assumptions must map names to true or false';
      return isStr(ev.reason, 2000) ? null : 'a challenge needs a written reason';
    case 'eiu-review':
      if (!isStr(ev.signalId, 60)) return 'signalId is required';
      if (!Object.keys(EIU_REVIEW).includes(ev.verdict)) return 'verdict must be agree or disagree';
      if (!isStr(ev.status, 40, { required: false })) return 'status is too long';
      if (ev.verdict === 'disagree' && !ev.note) return 'disagreeing needs a written reason';
      return isStr(ev.note, 2000, { required: false }) ? null : 'note is too long';
    case 'notice':
      if (!isObj(ev.notice) || !Array.isArray(ev.notice.items) || !isStr(ev.notice.due, 20) || !isStr(ev.notice.ref, 200)) return 'notice needs ref, due and items';
      return null;
    case 'notice-issue':
      if (!isStr(ev.ref, 200)) return 'the notice reference (as issued) is required';
      if (!ISO_DATE.test(String(ev.issued)) || !ISO_DATE.test(String(ev.replyDue))) return 'issued and replyDue must be dates (YYYY-MM-DD)';
      if (ev.replyDue < ev.issued) return 'the reply cannot be due before the notice is issued';
      return ISSUE_MODES.includes(ev.mode) ? null : `mode must be one of ${ISSUE_MODES.join(', ')}`;
    case 'notice-reminder':
      if (!ISO_DATE.test(String(ev.sent))) return 'sent must be a date (YYYY-MM-DD)';
      if (!ISSUE_MODES.includes(ev.mode)) return `mode must be one of ${ISSUE_MODES.join(', ')}`;
      return isStr(ev.note, 1000, { required: false }) ? null : 'note is too long';
    case 'notice-escalate':
      if (!SCN_SECTIONS.includes(ev.section)) return `section must be one of ${SCN_SECTIONS.join(', ')}`;
      return isStr(ev.reason, 2000) ? null : 'escalation needs a written reason';
    case 'approval-request':
      if (!APPROVAL_STAGES[ev.stage]) return `stage must be one of ${Object.keys(APPROVAL_STAGES).join(', ')}`;
      if (!isStr(ev.note, 1000, { required: false })) return 'note is too long';
      if (ev.stage === 'escalate') {
        if (!SCN_SECTIONS.includes(ev.section)) return `section must be one of ${SCN_SECTIONS.join(', ')}`;
        if (!isStr(ev.reason, 2000)) return 'escalation needs a written reason';
      }
      return null;
    case 'approval-decide':
      if (!APPROVAL_STAGES[ev.stage]) return `stage must be one of ${Object.keys(APPROVAL_STAGES).join(', ')}`;
      if (!APPROVAL_DECISIONS[ev.decision]) return 'decision must be approve or return';
      if (ev.decision === 'return' && !ev.note) return 'returning needs a written reason';
      return isStr(ev.note, 1000, { required: false }) ? null : 'note is too long';
    default: return 'unhandled type';
  }
}

// ------------------------------------------------------------------ rules that depend on the case as it stands
const sameOfficer = (ev, a) => (ev.byId && a.requestedById ? ev.byId === a.requestedById : String(ev.by || '').trim().toLowerCase() === String(a.requestedBy || '').trim().toLowerCase());

/**
 * Checks a new event against the current state (validateEvent checks its shape). Applied to new events only, by the
 * browser and by the server; stored logs replay without it, so earlier records stay readable.
 * @returns {string|null} why the event is not allowed now, or null
 */
export function guardEvent(state, ev) {
  const n = state.notices?.[ev.caseId];
  const issue = n?.approvals?.issue;
  const esc = n?.approvals?.escalate;
  switch (ev.type) {
    case 'notice':
      return n?.issue ? 'This ASMT-10 has been issued: the draft can no longer change' : null;
    case 'approval-request':
      if (!n) return 'Save the ASMT-10 draft first';
      if (ev.stage === 'issue') {
        if (n.issue) return 'This ASMT-10 has already been issued';
        if (issue?.status === 'pending') return 'Approval to issue has already been asked';
        if (issue?.status === 'approved') return 'Issue is already approved';
        return null;
      }
      if (!n.issue) return 'Record the issue of the ASMT-10 before escalating';
      if (n.escalation) return 'This notice has already been escalated';
      return esc?.status === 'pending' ? 'Approval to escalate has already been asked' : null;
    case 'approval-decide': {
      const a = n?.approvals?.[ev.stage];
      if (a?.status !== 'pending') return 'There is no pending request to decide';
      if (!ev.by) return 'The deciding officer must be named';
      return sameOfficer(ev, a) ? 'The officer who asked for approval cannot decide it: a second officer must (maker-checker)' : null;
    }
    case 'notice-issue':
      if (!n) return 'Save the ASMT-10 draft first';
      if (n.issue) return 'The issue of this ASMT-10 is already recorded';
      return issue?.status === 'approved' ? null : 'Issue needs a second officer\'s approval first: ask for it';
    case 'notice-reminder':
      return n?.issue ? null : 'Record the issue of the ASMT-10 first';
    case 'notice-escalate':
      return 'Escalation needs a second officer\'s approval: ask for it';
    default:
      return null;
  }
}
