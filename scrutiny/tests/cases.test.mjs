// Case events (pure reducer + validation) and the append-only case log.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyEvent, replay, emptyState, validateEvent, HISTORY_LIMIT } from '../src/lib/caseEvents.js';
import { openCaseLog } from '../scripts/lib/caseLog.mjs';

const ID = '27ZZKPK7730D1ZM';
const ev = (type, extra = {}) => ({ type, caseId: ID, at: '2026-09-27 10:00', by: 'Priya M.', ...extra });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'gst-cases-'));

test('every event type produces the expected case state and history text', () => {
  const events = [
    ev('status', { status: 'In review' }),
    ev('note', { text: 'Called for purchase register' }),
    ev('disposition', { ruleId: 'B-08', code: 'confirmed', note: 'Duplicate booked twice' }),
    ev('response', { received: '2026-09-27', ref: 'ARN 1', text: 'Accepts the duplicate' }),
    ev('readiness', { key: 'approval', done: true, label: 'Supervisory approval obtained', note: 'A. Kulkarni, AC' }),
    ev('log', { text: 'Evidence pack downloaded: B-08' }),
    ev('notice', { notice: { ref: 'ASMT-10/1', due: '2026-10-27', items: ['B-08'] } }),
    ev('close', { code: 'voluntary', reason: 'Paid via DRC-03 after verification' }),
  ];
  const s = replay(events);
  const c = s.cases[ID];
  assert.equal(c.status, 'Closed');
  assert.equal(c.assignee, 'Priya M.');
  assert.equal(c.notes[0].text, 'Called for purchase register');
  assert.deepEqual(c.dispositions['B-08'], { code: 'confirmed', note: 'Duplicate booked twice', at: '2026-09-27 10:00', by: 'Priya M.' });
  assert.equal(c.responses[0].ref, 'ARN 1');
  assert.equal(c.readiness.approval.note, 'A. Kulkarni, AC');
  assert.equal(c.closure.label, 'Paid or reversed voluntarily after verification');
  assert.equal(s.notices[ID].ref, 'ASMT-10/1');
  assert.deepEqual(c.history.map((h) => h.text), [
    'Closed: Paid or reversed voluntarily after verification (Paid via DRC-03 after verification)',
    'ASMT-10 drafted · 1 items · reply by 2026-10-27',
    'Evidence pack downloaded: B-08',
    'Readiness recorded: Supervisory approval obtained (A. Kulkarni, AC)',
    'Taxpayer response recorded (received 2026-09-27, ARN 1)',
    'B-08: Confirmed discrepancy (Duplicate booked twice)',
    'Note added',
    'Status → In review',
  ]);
});

test('withdrawals remove the outcome or checklist step and are logged', () => {
  const s = replay([
    ev('disposition', { ruleId: 'B-01', code: 'timing', note: 'Reverses in next period' }),
    ev('disposition', { ruleId: 'B-01', code: null }),
    ev('readiness', { key: 'period', done: true, label: 'Return period verified' }),
    ev('readiness', { key: 'period', done: false, label: 'Return period verified' }),
  ]);
  assert.deepEqual(s.cases[ID].dispositions, {});
  assert.deepEqual(s.cases[ID].readiness, {});
  assert.equal(s.cases[ID].history[0].text, 'Readiness withdrawn: Return period verified');
  assert.equal(s.cases[ID].history[2].text, 'B-01: outcome withdrawn');
});

test('applyEvent never mutates its input, history is capped, import never overwrites', () => {
  const s0 = emptyState();
  const s1 = applyEvent(s0, ev('note', { text: 'x' }));
  assert.deepEqual(s0, emptyState());
  let s = s1;
  for (let i = 0; i < HISTORY_LIMIT + 10; i++) s = applyEvent(s, ev('log', { text: `e${i}` }));
  assert.equal(s.cases[ID].history.length, HISTORY_LIMIT);
  const imported = applyEvent(s, { type: 'import', at: 'x', cases: { [ID]: { status: 'Closed' }, OTHER: { status: 'In review' } }, notices: {} });
  assert.equal(imported.cases[ID].status, s.cases[ID].status, 'the server record wins over an import');
  assert.equal(imported.cases.OTHER.status, 'In review');
});

test('validation enforces the workflow rules', () => {
  assert.equal(validateEvent(ev('status', { status: 'In review' })), null);
  assert.match(validateEvent(ev('status', { status: 'Closed' })), /closure and notices have their own steps/);
  assert.match(validateEvent(ev('status', { status: 'Notice drafted' })), /status must be/);
  assert.match(validateEvent(ev('close', { code: 'voluntary', reason: '' })), /reasons are required/);
  assert.match(validateEvent(ev('close', { code: 'made-up', reason: 'x' })), /unknown closure code/);
  assert.match(validateEvent(ev('disposition', { ruleId: 'B-01', code: 'confirmed' })), /written reasons/);
  assert.equal(validateEvent(ev('disposition', { ruleId: 'B-01', code: null })), null);
  assert.match(validateEvent(ev('readiness', { key: 'approval', done: true, label: 'x' })), /written record/);
  assert.match(validateEvent(ev('response', { received: '27/09/2026', text: 'x' })), /date/);
  assert.match(validateEvent(ev('note', { text: 'x'.repeat(5001) })), /max 5000/);
  assert.match(validateEvent({ ...ev('note', { text: 'x' }), caseId: '../../etc' }), /caseId/);
  assert.match(validateEvent({ type: 'drop-table', at: 'x' }), /unknown type/);
});

test('the case log appends, replays and survives a restart', () => {
  const dir = tmp();
  try {
    const log = openCaseLog(dir);
    log.append([ev('status', { status: 'In review' }), ev('note', { text: 'first' })], new Date('2026-09-27T05:00:00Z'));
    assert.equal(log.seq, 2);
    const lines = fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.deepEqual(lines.map((l) => [l.seq, l.type, l.receivedAt]), [[1, 'status', '2026-09-27T05:00:00.000Z'], [2, 'note', '2026-09-27T05:00:00.000Z']]);
    const reopened = openCaseLog(dir);
    assert.equal(reopened.seq, 2);
    assert.deepEqual(reopened.state, log.state);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a batch with one invalid event is stored whole or not at all', () => {
  const dir = tmp();
  try {
    const log = openCaseLog(dir);
    assert.throws(() => log.append([ev('note', { text: 'ok' }), ev('status', { status: 'Closed' })]), /event 2/);
    assert.equal(log.seq, 0);
    assert.equal(fs.existsSync(path.join(dir, 'events.jsonl')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a corrupted line is reported and skipped, never silently dropped from the file', () => {
  const dir = tmp();
  try {
    openCaseLog(dir).append([ev('note', { text: 'kept' })]);
    fs.appendFileSync(path.join(dir, 'events.jsonl'), '{not json\n');
    const log = openCaseLog(dir);
    assert.equal(log.problems.length, 1);
    assert.equal(log.state.cases[ID].notes[0].text, 'kept');
    assert.match(fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8'), /\{not json/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('EIU events keep the reply, the challenge history and the officer review per signal', () => {
  const S = 'EIU-2025-0107';
  const s = replay([
    ev('eiu-reply', { signalId: S, received: '2025-12-20', from: 'CA', ref: 'RJA/77', text: 'All suppliers filed GSTR-3B.' }),
    ev('eiu-challenge', { signalId: S, excluded: ['27ZZVFV1616A1Z2'], assumptions: {}, reason: 'Vista verified on site' }),
    ev('eiu-challenge', { signalId: S, excluded: [], assumptions: { includeLinked: true }, reason: 'Include the upstream non-filer' }),
    ev('eiu-review', { signalId: S, verdict: 'agree', status: 'Increased' }),
  ]);
  const e = s.cases[ID].eiu[S];
  assert.equal(e.replies[0].from, 'CA');
  assert.deepEqual(e.challenge.assumptions, { includeLinked: true }, 'the latest challenge applies');
  assert.equal(e.challenges.length, 2, 'earlier challenges stay in the history');
  assert.equal(e.review.verdict, 'agree');
  assert.deepEqual(s.cases[ID].history.map((h) => h.text).reverse(), [
    `${S}: reply from CA recorded (received 2025-12-20)`,
    `${S}: challenge set (1 excluded): Vista verified on site`,
    `${S}: challenge set (0 excluded, 1 assumption(s) changed): Include the upstream non-filer`,
    `${S}: Agrees with the revalidation (Increased)`,
  ]);
});

test('EIU events are validated: challenges need reasons, disagreement needs a note', () => {
  const S = { signalId: 'EIU-1' };
  assert.equal(validateEvent(ev('eiu-challenge', { ...S, excluded: ['x'], assumptions: {} })), 'a challenge needs a written reason');
  assert.equal(validateEvent(ev('eiu-challenge', { ...S, excluded: 'x', assumptions: {}, reason: 'r' })), 'excluded must be a list of component ids');
  assert.equal(validateEvent(ev('eiu-challenge', { ...S, excluded: [], assumptions: { a: 'yes' }, reason: 'r' })), 'assumptions must map names to true or false');
  assert.equal(validateEvent(ev('eiu-review', { ...S, verdict: 'disagree' })), 'disagreeing needs a written reason');
  assert.equal(validateEvent(ev('eiu-reply', { ...S, received: '2025-12-20', from: 'Someone', text: 't' })), 'from must be Taxpayer, CA or Other');
  assert.equal(validateEvent(ev('eiu-review', { ...S, verdict: 'agree' })), null);
});

test('an EIU reply can name the stored document it was read from', () => {
  const doc = { name: 'reply.pdf', sha256: 'a'.repeat(64), size: 1234, type: 'application/pdf' };
  const e = ev('eiu-reply', { signalId: 'EIU-1', received: '2025-12-20', from: 'CA', text: 'All suppliers filed GSTR-3B.', doc });
  assert.equal(validateEvent(e), null);
  const s = replay([e]);
  assert.deepEqual(s.cases[ID].eiu['EIU-1'].replies[0].doc, doc);
  assert.match(s.cases[ID].history[0].text, /document reply\.pdf/);
  assert.equal(validateEvent({ ...e, doc: { ...doc, sha256: 'not-a-hash' } }), 'doc must name a stored document (name, sha256, size, type)');
});

test('the case log is hash-chained: an edited or removed line is detected on reopening', () => {
  const dir = tmp();
  try {
    const log = openCaseLog(dir);
    log.append([ev('note', { text: 'one' }), ev('note', { text: 'two' })]);
    log.append([ev('note', { text: 'three' })]);
    assert.deepEqual({ ...openCaseLog(dir).chain }, { events: 3, unchained: 0, verified: true, brokenAt: null });
    assert.deepEqual(openCaseLog(dir).events({ limit: 2 }).map((e) => e.text), ['three', 'two'], 'newest first');
    const file = path.join(dir, 'events.jsonl');
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
    fs.writeFileSync(file, [lines[0], lines[1].replace('"two"', '"TWO"'), lines[2]].join('\n') + '\n');
    const edited = openCaseLog(dir);
    assert.equal(edited.chain.verified, false);
    assert.equal(edited.chain.brokenAt, 2);
    fs.writeFileSync(file, [lines[0], lines[2]].join('\n') + '\n');
    assert.equal(openCaseLog(dir).chain.verified, false, 'a removed line breaks the chain too');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('events written before the hash chain are kept and counted as unchained', () => {
  const dir = tmp();
  try {
    fs.writeFileSync(path.join(dir, 'events.jsonl'), `${JSON.stringify({ ...ev('note', { text: 'old' }), seq: 1, receivedAt: '2026-01-01T00:00:00Z' })}\n`);
    const log = openCaseLog(dir);
    log.append([ev('note', { text: 'new' })]);
    const again = openCaseLog(dir);
    assert.deepEqual({ ...again.chain }, { events: 2, unchained: 1, verified: true, brokenAt: null });
    assert.equal(again.state.cases[ID].notes.length, 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
