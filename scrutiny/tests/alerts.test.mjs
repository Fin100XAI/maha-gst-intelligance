// Alerts and notice follow-up (#8, #9): configurable rules fill an officer queue; a drafted notice is issued,
// reminded and escalated, and the queue says what is due.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RULES, validateRule, matchRule, evaluateAlerts } from '../src/engine/alerts.js';
import { buildQueue } from '../scripts/alert-store.js';
import { noticeStage, followUps, drc01Text } from '../src/engine/notices.js';
import { applyEvent, emptyState, validateEvent, guardEvent } from '../src/lib/caseEvents.js';

const tp = (o) => ({ id: o.gstin, gstin: o.gstin, name: o.name || o.gstin, fy: '2025-2026', band: 'Low', score: 5, exposure: { confirmed: 0, potential: 0 }, results: [], fraud: [], ...o });
const risky = tp({ gstin: '27AAAAA0000A1Z5', name: 'RISKY', band: 'High', score: 60, exposure: { confirmed: 2.5e6, potential: 0 }, results: [{ id: 'B-01', status: 'Fail', exposure: 2.5e6 }], fraud: [{ key: 'nonfiler', label: 'ITC from suppliers who did not file 3B', value: '12%', flagged: true }] });
const clean = tp({ gstin: '27BBBBB0000B1Z5', name: 'CLEAN' });

test('alert rules are validated before they are saved', () => {
  for (const r of DEFAULT_RULES) assert.deepEqual(validateRule(r), [], r.id);
  assert.ok(validateRule({ id: 'X Y', name: '', priority: 'Urgent', when: { type: 'nope' } }).length >= 4);
  assert.ok(validateRule({ id: 'sc', name: 'Score', priority: 'Low', when: { type: 'score', min: 150 } }).some((e) => /0 to 100/.test(e)));
});

test('rules match what they say, and only that', () => {
  assert.match(matchRule(DEFAULT_RULES[0], risky).reason, /Risk High/);
  assert.equal(matchRule(DEFAULT_RULES[0], clean), null);
  assert.equal(matchRule({ ...DEFAULT_RULES[1], when: { type: 'rule', ruleId: 'B-01', min: 3e6 } }, risky), null, 'below the amount threshold');
  assert.equal(evaluateAlerts(DEFAULT_RULES, [risky, clean]).filter((a) => a.gstin === clean.gstin).length, 0);
  const alerts = evaluateAlerts(DEFAULT_RULES, [risky, clean]);
  assert.deepEqual(alerts.map((a) => a.ruleId).sort(), ['high-risk', 'itc-excess', 'non-filers']);
  assert.equal(alerts[0].priority, 'High');
  const scoped = evaluateAlerts([{ ...DEFAULT_RULES[0], jurisdiction: 'WARD-9' }], [risky], { master: [{ gstin: risky.gstin, jurisdiction: 'WARD-1' }] });
  assert.equal(scoped.length, 0, 'a jurisdiction rule ignores other jurisdictions');
});

test('the queue remembers: first seen, officer actions, and resolution when the condition goes away', () => {
  const day1 = { generatedAt: '2026-10-01T00:00:00Z', taxpayers: [risky, clean] };
  let q = buildQueue({ rules: DEFAULT_RULES, state: {}, seen: {} }, day1, []);
  assert.equal(q.alerts.length, 3);
  assert.ok(q.alerts.every((a) => a.status === 'open' && a.firstSeen === day1.generatedAt));
  const key = q.alerts.find((a) => a.ruleId === 'high-risk').key;
  q.store.state[key] = { ...q.store.state[key], status: 'acknowledged' };
  const day2 = { generatedAt: '2026-10-02T00:00:00Z', taxpayers: [risky, clean] };
  q = buildQueue(q.store, day2, []);
  assert.equal(q.alerts.find((a) => a.key === key).status, 'acknowledged', 'status survives re-analysis');
  assert.equal(q.alerts.find((a) => a.key === key).firstSeen, day1.generatedAt, 'first seen survives re-analysis');
  const fixed = { ...risky, band: 'Low', score: 10, results: [], fraud: [] };
  q = buildQueue(q.store, { generatedAt: '2026-10-03T00:00:00Z', taxpayers: [fixed, clean] }, []);
  assert.equal(q.alerts.length, 0);
  assert.equal(q.resolved.length, 3);
  assert.equal(q.store.state[key].resolvedAt, '2026-10-03T00:00:00Z');
});

test('a notice moves from drafted to approved, issued, reminded and escalated, each step validated and recorded', () => {
  const at = '2026-10-01T10:00:00Z', by = 'Officer A';
  let s = emptyState();
  const ev = (o) => { const e = { at, by, caseId: 'G1', ...o }; assert.equal(validateEvent(e) || guardEvent(s, e), null, JSON.stringify(o)); s = applyEvent(s, e); };
  ev({ type: 'notice', notice: { ref: 'ASMT-10/1', due: '2026-10-31', items: ['B-01'], savedAt: '2026-09-20T00:00:00Z' } });
  assert.equal(noticeStage(s.notices.G1, s.cases.G1, '2026-10-01').stage, 'drafted');
  assert.equal(validateEvent({ type: 'notice-issue', at, by, caseId: 'G1', ref: 'X', issued: '2026-10-02', replyDue: '2026-10-01', mode: 'Email' }), 'the reply cannot be due before the notice is issued');
  ev({ type: 'approval-request', stage: 'issue' });
  assert.equal(noticeStage(s.notices.G1, s.cases.G1, '2026-10-01').stage, 'approval');
  ev({ type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Officer B' });
  ev({ type: 'notice-issue', ref: 'ASMT-10/1/ISSUED', issued: '2026-10-02', replyDue: '2026-11-01', mode: 'GST portal' });
  assert.equal(s.cases.G1.status, 'Notice issued');
  assert.deepEqual(noticeStage(s.notices.G1, s.cases.G1, '2026-10-28'), { stage: 'awaiting', days: 4 });
  assert.deepEqual(noticeStage(s.notices.G1, s.cases.G1, '2026-11-06'), { stage: 'overdue', days: 5 });
  ev({ type: 'notice-reminder', sent: '2026-11-06', mode: 'Email', note: 'First reminder' });
  assert.equal(validateEvent({ type: 'approval-request', stage: 'escalate', at, by, caseId: 'G1', section: '74A', reason: '' }), 'escalation needs a written reason');
  ev({ type: 'approval-request', stage: 'escalate', section: '74A', reason: 'No reply after reminder' });
  ev({ type: 'approval-decide', stage: 'escalate', decision: 'approve', by: 'Officer B' });
  assert.equal(s.cases.G1.status, 'Escalated');
  assert.equal(noticeStage(s.notices.G1, s.cases.G1, '2026-11-20').stage, 'escalated');
  assert.equal(s.notices.G1.ref, 'ASMT-10/1', 'the draft itself is untouched');
});

test('follow-ups: unissued drafts, replies due and overdue, replies to review', () => {
  const taxpayers = [{ id: 'G1', gstin: 'G1', name: 'ONE' }, { id: 'G2', gstin: 'G2', name: 'TWO' }, { id: 'G3', gstin: 'G3', name: 'THREE' }];
  const notices = {
    G1: { ref: 'R1', savedAt: '2026-09-01T00:00:00Z' },
    G2: { ref: 'R2', issue: { ref: 'R2', issued: '2026-09-01', replyDue: '2026-10-01' } },
    G3: { ref: 'R3', issue: { ref: 'R3', issued: '2026-09-01', replyDue: '2026-10-20' } },
  };
  const cases = { G3: { status: 'Notice issued', responses: [{ received: '2026-10-05', text: 'reply' }] } };
  const f = followUps({ notices, cases, taxpayers, today: '2026-10-10' });
  assert.deepEqual(f.map((x) => `${x.id}:${x.kind}`).sort(), ['G1:issue', 'G2:overdue', 'G3:reply']);
  assert.equal(f[0].kind, 'overdue', 'overdue replies come first');
});

test('the DRC-01 draft states the demand head by head', () => {
  const items = [{ id: 'B-01', finding: 'Excess ITC.', exposure: 1000, heads: { igst: 0, cgst: 500, sgst: 500 } }];
  const t = drc01Text({ a: { gstin: 'G1', name: 'ONE', fy: '2025-2026' }, notice: { ref: 'R1', issue: { ref: 'R1', issued: '2026-10-02' } }, items, cat: { 'B-01': { check: 'ITC vs 2B', legal: 's.16' } }, section: '73', reason: 'No reply.', officer: { name: 'A', designation: 'GSTO', jurisdiction: 'W1' }, today: '2026-11-10' });
  assert.match(t, /FORM GST DRC-01/);
  assert.match(t, /Tax demanded \(indicative\): ₹1,000 {2}\(IGST ₹0 · CGST ₹500 · SGST ₹500\)/);
  assert.match(t, /Penalty: Demand under s\.73/);
});

test('the DRC-01 keeps interest and late fee out of the tax demanded', () => {
  const items = [
    { id: 'B-01', finding: 'Excess ITC.', exposure: 1000, heads: { igst: 0, cgst: 500, sgst: 500 } },
    { id: 'J-01', finding: 'Interest not paid.', exposure: 90, heads: { igst: 30, cgst: 30, sgst: 30 } },
    { id: 'J-03', finding: 'Late fee not paid.', exposure: 40, heads: { igst: 0, cgst: 20, sgst: 20 } },
  ];
  const t = drc01Text({ a: { gstin: 'G1', name: 'ONE', fy: '2025-2026' }, notice: { ref: 'R1' }, items, cat: {}, section: '73', reason: 'x', officer: { name: 'A', designation: 'B', jurisdiction: 'C' }, today: '2026-11-10' });
  assert.match(t, /Tax demanded \(indicative\): ₹1,000 /);
  assert.match(t, /plus ₹90 not paid on returns filed late/);
  assert.match(t, /Late fee: ₹40/);
  assert.match(t, /\[J-01\][^\n]*Interest: ₹90/);
});
