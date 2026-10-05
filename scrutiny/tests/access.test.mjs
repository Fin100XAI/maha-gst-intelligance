// Accounts, jurisdiction filtering and maker-checker (#4, #9): officers sign in with their own accounts, are sent
// only their jurisdictions' taxpayers, and a notice is issued or escalated only with a second officer's approval.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { hashPassword, verifyPassword, issueToken, readToken, throttle, temporaryPassword, openAccounts } from '../scripts/lib/accounts.mjs';
import { scopeFor, scopeDataset, scopeRegisters } from '../scripts/lib/scope.mjs';
import { createStack } from '../scripts/lib/middleware.mjs';
import { mayGrant } from '../scripts/auth.js';
import { validateAccount, passwordProblem, can, userFromAccount } from '../src/lib/access.js';
import { applyEvent, emptyState, validateEvent, guardEvent, replay } from '../src/lib/caseEvents.js';
import { noticeStage, followUps } from '../src/engine/notices.js';

const SECRET = 'x'.repeat(48);

test('passwords are stored as salted scrypt hashes and checked in constant time', () => {
  const h = hashPassword('correct horse 42');
  assert.match(h, /^scrypt:16384:8:1:/);
  assert.notEqual(h, hashPassword('correct horse 42'), 'a fresh salt each time');
  assert.equal(verifyPassword('correct horse 42', h), true);
  assert.equal(verifyPassword('correct horse 43', h), false);
  assert.equal(verifyPassword('anything', 'not-a-hash'), false);
  assert.match(temporaryPassword(), /^[a-zA-Z2-9]{5}-[a-zA-Z2-9]{5}-[a-zA-Z2-9]{5}$/);
  assert.equal(passwordProblem('short'), 'use at least 10 characters');
  assert.match(passwordProblem('priya.m-2026!', { email: 'priya.m@x.gov.in' }), /email name/);
  assert.equal(passwordProblem('Pune ward one 2026'), null);
});

test('a session token is signed, expires, and dies with the account\'s token version', () => {
  const acc = { id: 'a1', tokenVersion: 3 };
  const t = issueToken(acc, SECRET, 1000, 1);
  assert.deepEqual(readToken(t, SECRET, 2000), { sub: 'a1', v: 3, exp: 1000 + 3600000 });
  assert.equal(readToken(t, SECRET, 1000 + 3600001), null, 'expired');
  assert.equal(readToken(t, 'y'.repeat(48), 2000), null, 'another key');
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'admin', v: 3, exp: 9e15 })).toString('base64url');
  assert.equal(readToken(`${forged}.${sig}`, SECRET, 2000), null, 'a changed body fails the signature');
  assert.equal(readToken(`${body}`, SECRET, 2000), null);
});

test('sign-in throttling locks an email after five failures', () => {
  const t = throttle({ max: 5, lockMs: 60000 });
  for (let i = 0; i < 4; i += 1) t.fail('e:a', 0);
  assert.equal(t.lockedFor('e:a', 0), 0);
  t.fail('e:a', 0);
  assert.equal(t.lockedFor('e:a', 1000), 59000);
  assert.equal(t.lockedFor('e:a', 61000), 0);
});

test('account details are validated; roles carry permissions', () => {
  assert.deepEqual(validateAccount({ email: 'a@b.in', name: 'A', role: 'officer', jurisdictions: ['W1'] }), []);
  assert.equal(validateAccount({ email: 'nope', name: '', role: 'king', jurisdictions: [] }).length, 4);
  const officer = userFromAccount({ id: '1', email: 'a@b.in', name: 'A', role: 'officer', jurisdictions: ['W1'] });
  assert.equal(can(officer, 'work'), true);
  assert.equal(can(officer, 'approve'), false);
  assert.equal(can({ name: 'typed name' }, 'approve'), true, 'open mode: no permission list, nothing restricted');
  assert.equal(mayGrant({ jurisdictions: ['W1'] }, { jurisdictions: ['W1'] }), null);
  assert.match(mayGrant({ jurisdictions: ['W1'] }, { jurisdictions: ['W2'] }), /outside your own/);
  assert.match(mayGrant({ jurisdictions: ['W1'] }, { jurisdictions: ['*'] }), /all jurisdictions/);
});

test('the account file: create, change, reset, own password change; the log keeps no secrets', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-'));
  const s = openAccounts(dir);
  const { account, password } = s.create({ email: 'A@Dept.in', name: 'A', role: 'officer', jurisdictions: ['W1', 'W1'] }, { by: 'test' });
  assert.equal(account.email, 'a@dept.in');
  assert.deepEqual(account.jurisdictions, ['W1']);
  assert.equal(account.mustChange, true);
  assert.throws(() => s.create({ email: 'a@dept.in', name: 'B', role: 'officer', jurisdictions: ['W1'] }), /already exists/);
  const moved = s.update(account.id, { jurisdictions: ['W2'] }).account;
  assert.equal(moved.name, 'A', 'fields not given stay as they were');
  assert.equal(moved.tokenVersion, 1, 'a change of jurisdiction ends open sessions');
  assert.throws(() => s.changePassword(account.id, 'wrong', 'Pune ward one 2026'), /not correct/);
  const changed = s.changePassword(account.id, password, 'Pune ward one 2026');
  assert.equal(changed.mustChange, false);
  const log = fs.readFileSync(path.join(dir, 'access-log.jsonl'), 'utf8');
  assert.ok(!log.includes(password) && !log.includes('Pune ward one 2026') && !log.includes('scrypt'), 'no password or hash in the log');
  assert.ok(!JSON.parse(fs.readFileSync(path.join(dir, 'accounts.json'), 'utf8')).accounts[0].password, 'only the hash is stored');
});

// ------------------------------------------------------------------ jurisdiction filtering
const master = [{ gstin: 'G1', jurisdiction: 'W1' }, { gstin: 'G2', jurisdiction: 'W2' }];
const dataset = {
  generatedAt: '2026-10-01T00:00:00Z', catalog: [],
  taxpayers: [{ id: 'G1', gstin: 'G1' }, { id: 'G2', gstin: 'G2' }, { id: 'G3', gstin: 'G3' }],
  baselines: { G1: [], G2: [], G3: [] },
  network: { years: ['2025-2026'], nodes: { G1: { gstin: 'G1' }, G2: { gstin: 'G2' }, S9: { gstin: 'S9' } }, edges: [{ from: 'S9', to: 'G1' }, { from: 'G2', to: 'S9' }], trades: { 'G1|2025-2026': {}, 'G2|2025-2026': {} } },
  portfolio: { rows: [{ id: 'G1' }, { id: 'G2' }, { id: 'G3' }], n: 3, cells: [] },
};

test('an officer is sent only the taxpayers the master assigns to their jurisdictions', () => {
  const w1 = scopeFor({ jurisdictions: ['W1'] }, master);
  const d = scopeDataset(dataset, w1);
  assert.deepEqual(d.taxpayers.map((t) => t.gstin), ['G1']);
  assert.deepEqual(Object.keys(d.baselines), ['G1']);
  assert.deepEqual(d.network.edges, [{ from: 'S9', to: 'G1' }], 'a link between two others is not this officer\'s');
  assert.deepEqual(Object.keys(d.network.nodes).sort(), ['G1', 'S9'], 'nodes stay keyed by GSTIN, as the analysis writes them');
  assert.deepEqual(Object.keys(d.network.trades), ['G1|2025-2026']);
  assert.deepEqual(d.portfolio.rows.map((r) => r.id), ['G1']);
  assert.equal(scopeDataset(dataset, scopeFor({ jurisdictions: ['*'] }, master)), dataset, 'all jurisdictions: unchanged');
  assert.ok(!scopeDataset(dataset, w1).taxpayers.some((t) => t.gstin === 'G3'), 'unassigned is not everyone\'s');
  const regs = scopeRegisters({ demands: { meta: { rows: 2 }, records: [{ gstin: 'G1' }, { gstin: 'G2' }] }, targets: { meta: {}, records: [{ jurisdiction: 'W1' }, { jurisdiction: 'W2' }] }, extensions: { meta: {}, records: [{ fy: '2025-2026' }] }, eiu: null }, w1);
  assert.deepEqual(regs.demands.records, [{ gstin: 'G1' }]);
  assert.equal(regs.demands.meta.rows, 1);
  assert.deepEqual(regs.targets.records, [{ jurisdiction: 'W1' }]);
  assert.equal(regs.extensions.records.length, 1, 'rows about no taxpayer or jurisdiction are for everyone');
  assert.equal(regs.eiu, null);
});

// ------------------------------------------------------------------ maker-checker
const at = '2026-10-01T10:00:00Z';
function run(steps) {
  let s = emptyState();
  for (const e of steps) {
    const ev = { at, caseId: 'G1', ...e };
    const bad = validateEvent(ev) || guardEvent(s, ev);
    if (bad) return { s, refused: bad, at: e };
    s = applyEvent(s, ev);
  }
  return { s, refused: null };
}
const draft = { type: 'notice', by: 'Maker', byId: 'm', notice: { ref: 'ASMT-10/1', due: '2026-10-31', items: ['B-01'], savedAt: at } };
const askIssue = { type: 'approval-request', stage: 'issue', by: 'Maker', byId: 'm' };
const issue = { type: 'notice-issue', by: 'Maker', byId: 'm', ref: 'ASMT-10/1', issued: '2026-10-02', replyDue: '2026-11-01', mode: 'GST portal' };

test('an ASMT-10 is issued only after a second officer approves it', () => {
  assert.match(run([draft, issue]).refused, /approval first/);
  assert.match(run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Maker', byId: 'm' }]).refused, /cannot decide it/);
  assert.match(run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Renamed', byId: 'm' }]).refused, /cannot decide it/, 'the account, not the name, decides who asked');
  assert.match(run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'return', by: 'Checker', byId: 'c' }]).refused, /written reason/);
  const ok = run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Checker', byId: 'c' }, issue]);
  assert.equal(ok.refused, null);
  assert.equal(ok.s.cases.G1.status, 'Notice issued');
  assert.equal(ok.s.notices.G1.approvals.issue.decidedBy, 'Checker');
  assert.match(run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Checker', byId: 'c' }, issue, draft]).refused, /can no longer change/);
});

test('a changed draft needs approval again; a returned one can be asked again', () => {
  const approvedThenEdited = run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Checker', byId: 'c' }, draft, issue]);
  assert.match(approvedThenEdited.refused, /approval first/);
  const returned = run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'return', note: 'Add the B-03 evidence', by: 'Checker', byId: 'c' }]);
  assert.equal(noticeStage(returned.s.notices.G1, returned.s.cases.G1, '2026-10-03').stage, 'returned');
  assert.equal(run([draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'return', note: 'x', by: 'Checker', byId: 'c' }, askIssue]).refused, null);
  assert.match(run([draft, askIssue, askIssue]).refused, /already been asked/);
});

test('escalation to DRC-01 happens on approval, with the approver recorded', () => {
  const issued = [draft, askIssue, { type: 'approval-decide', stage: 'issue', decision: 'approve', by: 'Checker', byId: 'c' }, issue];
  assert.match(run([...issued, { type: 'notice-escalate', by: 'Maker', section: '73', reason: 'x' }]).refused, /approval: ask for it/);
  const asked = run([...issued, { type: 'approval-request', stage: 'escalate', section: '74A', reason: 'No reply after a reminder', by: 'Maker', byId: 'm' }]);
  assert.equal(noticeStage(asked.s.notices.G1, asked.s.cases.G1, '2026-11-10').stage, 'escalation-pending');
  const done = run([...issued, { type: 'approval-request', stage: 'escalate', section: '74A', reason: 'No reply after a reminder', by: 'Maker', byId: 'm' }, { type: 'approval-decide', stage: 'escalate', decision: 'approve', by: 'Checker', byId: 'c' }]);
  assert.deepEqual(done.s.notices.G1.escalation, { section: '74A', reason: 'No reply after a reminder', at, by: 'Maker', approvedBy: 'Checker' });
  assert.equal(done.s.cases.G1.status, 'Escalated');
});

test('logs written before maker-checker still replay', () => {
  const old = replay([{ ...draft, at, caseId: 'G1' }, { ...issue, at, caseId: 'G1' }, { type: 'notice-escalate', at, caseId: 'G1', by: 'Maker', section: '73', reason: 'old' }]);
  assert.equal(old.cases.G1.status, 'Escalated');
  assert.equal(old.notices.G1.escalation.section, '73');
});

test('the queue asks a checker to decide others\' requests, never their own', () => {
  const { s } = run([draft, askIssue]);
  const taxpayers = [{ id: 'G1', gstin: 'G1', name: 'ONE' }];
  const f = (viewer) => followUps({ notices: s.notices, cases: s.cases, taxpayers, today: '2026-10-02', viewer }).map((x) => x.kind);
  assert.deepEqual(f({ id: 'c', name: 'Checker', canApprove: true }), ['approve']);
  assert.deepEqual(f({ id: 'm', name: 'Maker', canApprove: true }), [], 'not your own request');
  assert.deepEqual(f({ id: 'o', name: 'Other', canApprove: false }), [], 'not without the approve permission');
});

// ------------------------------------------------------------------ over HTTP, through the real plugins
test('over HTTP: sign-in, scoped data and cases, stamped events, maker-checker by account', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-http-'));
  const env = { AUTH_MODE: 'accounts', STORE_DIR: path.join(tmp, 'store'), REGISTER_DIR: path.join(tmp, 'registers'), OUT_FILE: path.join(tmp, 'data.json'), DATA_DIR: path.join(tmp, 'data'), GST_ALLOW_REMOTE: '1', SESSION_SECRET: SECRET };
  const saved = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  t.after(() => { for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
  fs.mkdirSync(env.REGISTER_DIR, { recursive: true });
  fs.mkdirSync(env.DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(env.REGISTER_DIR, 'master.json'), JSON.stringify({ meta: {}, records: master }));
  fs.writeFileSync(env.OUT_FILE, JSON.stringify(dataset));

  const accounts = openAccounts(env.STORE_DIR);
  const pw = 'Pune ward one 2026';
  accounts.create({ email: 'maker@x.in', name: 'Maker', role: 'officer', jurisdictions: ['W1'], password: pw });
  accounts.create({ email: 'checker@x.in', name: 'Checker', role: 'supervisor', jurisdictions: ['W1'], password: pw });
  accounts.create({ email: 'other@x.in', name: 'Other', role: 'officer', jurisdictions: ['W2'], password: pw });

  const stack = createStack();
  const fake = { middlewares: stack.middlewares, config: { root: tmp } };
  for (const mod of ['../scripts/auth.js', '../scripts/data-store.js', '../scripts/case-store.js', '../scripts/register-store.js', '../scripts/alert-store.js']) (await import(mod)).default().configureServer(fake);
  const server = http.createServer((req, res) => stack.handle(req, res, req.url, (_, r) => { r.statusCode = 404; r.end('static'); }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (p, { method = 'GET', body, cookie } = {}) => {
    const r = await fetch(base + p, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body && JSON.stringify(body) });
    return { status: r.status, body: await r.json().catch(() => null), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  };
  const signIn = async (email) => (await call('/__auth/login', { method: 'POST', body: { email, password: pw } })).cookie;

  assert.equal((await call('/data.json')).status, 401, 'no session, no data');
  assert.equal((await call('/__cases')).status, 401);
  assert.equal((await call('/__auth/me')).body.mode, 'accounts');
  assert.equal((await call('/__auth/login', { method: 'POST', body: { email: 'maker@x.in', password: 'wrong password!' } })).status, 401);
  const maker = await signIn('maker@x.in');
  assert.match(maker, /^gst_session=/);
  assert.equal((await call('/__auth/me', { cookie: maker })).body.account.email, 'maker@x.in');
  assert.deepEqual((await call('/data.json', { cookie: maker })).body.taxpayers.map((x) => x.gstin), ['G1']);

  const post = (cookie, ev) => call('/__cases/events', { method: 'POST', cookie, body: { events: [{ at, ...ev }] } });
  assert.equal((await post(maker, { ...draft, caseId: 'G2' })).status, 403, 'another jurisdiction\'s case');
  assert.equal((await post(maker, { ...draft, caseId: 'G1', by: 'Somebody Else' })).status, 200);
  assert.equal((await post(maker, { ...askIssue, caseId: 'G1', by: 'Checker', byId: 'forged' })).status, 200);
  const state = (await call('/__cases', { cookie: maker })).body;
  assert.equal(state.notices.G1.approvals.issue.requestedBy, 'Maker', 'the server records the account, not what the browser claims');
  assert.equal((await post(maker, { type: 'approval-decide', stage: 'issue', decision: 'approve', caseId: 'G1' })).status, 403, 'an officer cannot approve');
  const checker = await signIn('checker@x.in');
  assert.equal((await post(checker, { type: 'approval-decide', stage: 'issue', decision: 'approve', caseId: 'G1' })).status, 200);
  assert.equal((await post(maker, { ...issue, caseId: 'G1' })).status, 200);

  const other = await signIn('other@x.in');
  assert.deepEqual(Object.keys((await call('/__cases', { cookie: other })).body.notices), [], 'W2 does not see W1\'s notices');
  assert.deepEqual((await call('/__registers', { cookie: other })).body.master.records.map((r) => r.gstin), ['G2']);
  assert.equal((await call('/__auth/accounts', { cookie: maker })).status, 403, 'managing accounts needs the permission');

  await call('/__auth/logout', { method: 'POST', cookie: maker });
  accounts.update(accounts.byEmail('checker@x.in').id, { active: false });
  assert.equal((await call('/data.json', { cookie: checker })).status, 401, 'a disabled account\'s session ends at once');
});
