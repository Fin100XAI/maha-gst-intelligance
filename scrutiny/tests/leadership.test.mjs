// Leadership intelligence (capabilities 21-26, 28-30): collection base, trajectory, action funnel, intervention
// revenue, action yield, effort, outcome learning, recovery and role views, against the synthetic ward's case
// action register (registers/caselog.csv) and the stories in answer-key.json (caseLog).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { ROOT, analyseFile } from './helpers.mjs';
import { baselineOf } from '../src/engine/baseline.js';
import { parseWorkbook } from '../src/engine/parse.js';
import { tradeOf, graphOf } from '../src/engine/network.js';
import { parseRegister } from '../src/engine/registers.js';
import { readRows } from '../scripts/lib/registerStore.mjs';
import { collectionBase, trajectory, latestTargets } from '../src/engine/collections.js';
import { buildCases, actionFunnel, actionYield } from '../src/engine/actions.js';
import { recoveryWorklist } from '../src/engine/recovery.js';
import { evidenceBase, fieldView, supervisorView, commissionerView } from '../src/engine/roles.js';

const WARD = path.join(ROOT, 'test-data', 'ward');
const KEY = JSON.parse(fs.readFileSync(path.join(WARD, 'answer-key.json'), 'utf8'));
const CL = KEY.caseLog;
const G = Object.fromEntries(KEY.taxpayers.map((t) => [t.key, t.gstin]));
const register = (t) => parseRegister(t, readRows(fs.readFileSync(path.join(WARD, 'registers', `${t}.csv`)), `${t}.csv`)).records;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

let baselines, registers, eb;
before(() => {
  baselines = {};
  const trades = [];
  for (const w of KEY.workbooks) {
    const file = path.join(WARD, w.file);
    const a = analyseFile(file);
    (baselines[a.gstin] ||= []).push(baselineOf(a));
    trades.push(tradeOf(parseWorkbook(XLSX.read(fs.readFileSync(file), { type: 'buffer' }), w.file)));
  }
  for (const k of Object.keys(baselines)) baselines[k].sort((x, y) => x.fyStart - y.fyStart);
  registers = Object.fromEntries(['master', 'eiu', 'targets', 'demands', 'caselog'].map((t) => [t, { records: register(t) }]));
  eb = evidenceBase({ data: { baselines, network: graphOf(trades), taxpayers: [] }, registers, jurisdiction: KEY.jurisdiction });
});

test('collection base: classes add up, and the exceptions a reader must know are listed', () => {
  const b = eb.base;
  assert.deepEqual(b.years, ['2023-2024', '2024-2025', '2025-2026']);
  for (const fy of b.years) {
    const t = b.totals[fy];
    near(t.collected, t.regular + t.interestFees + t.intervention, 1, `${fy} collected`);
    near(t.regular, b.byTaxpayer.filter((x) => x.fy === fy).reduce((s, x) => s + x.regular, 0), 1, `${fy} taxpayers add up to the jurisdiction`);
    near(t.regular, Object.values(baselines).flat().filter((x) => x.fy === fy).reduce((s, x) => s + x.totals.cashPaid, 0), 1, `${fy} regular = GSTR-3B cash paid`);
  }
  const payments = registers.caselog.records.filter((r) => r.event === 'payment').reduce((s, r) => s + r.amount, 0);
  near(b.years.reduce((s, fy) => s + b.totals[fy].intervention, 0), payments, 1, 'every case payment is counted once');
  assert.ok(b.exceptions.some((e) => e.kind === 'unfiled' && e.gstin === G.E09 && e.fy === '2025-2026'), 'E09 unfiled months are an exception');
  assert.ok(b.exceptions.some((e) => e.kind === 'quarterly' && e.gstin === G.E12));
});

test('trajectory: a complete year forecasts itself; targets come from the register', () => {
  const targets = registers.targets.records;
  const t = trajectory({ base: eb.base, fy: '2025-2026', asOf: 12, targets });
  near(t.expected, eb.base.totals['2025-2026'].discharged, 1, 'full year = actual');
  near(t.target, latestTargets(targets, '2025-2026').reduce((s, x) => s + x, 0), 1, 'target = register');
  assert.ok(t.gap > 0, 'FY 2025-26 fell short of its target');
});

test('trajectory: a normal year forecasts well; the shock year is caught once the step changes show', () => {
  for (const asOf of [3, 6, 9]) {
    const normal = trajectory({ base: eb.base, fy: '2024-2025', asOf });
    assert.ok(Math.abs(normal.backtest.error) < 0.02 && normal.backtest.withinRange, `FY 2024-25 from ${asOf} months: error ${normal.backtest.error}`);
  }
  const early = trajectory({ base: eb.base, fy: '2025-2026', asOf: 6 });
  assert.ok(early.backtest.error < -0.05, 'from September the later shocks could not be seen');
  assert.ok(early.backtest.worst.some((w) => w.gstin === G.E09), 'and the miss names Shree Balaji');
  const late = trajectory({ base: eb.base, fy: '2025-2026', asOf: 9 });
  assert.ok(late.backtest.withinRange, 'from December the year lands inside the range');
  assert.equal(late.perTaxpayer.find((p) => p.gstin === G.E09).method, 'stopped (last 3 months nil)');
  const s = trajectory({ base: eb.base, fy: '2025-2026', asOf: 9, scenario: { [G.E01]: 1.1 } });
  near(s.expected - late.expected, late.perTaxpayer.find((p) => p.gstin === G.E01).forecastRest * 0.1, 1, 'a scenario moves only its taxpayer');
});

test('action funnel: every case is counted, open cases are aged, and the bottleneck is adjudication', () => {
  const f = eb.funnel;
  assert.equal(f.cases, CL.cases);
  assert.equal(f.open, CL.open);
  assert.equal(f.reopened, CL.reopened);
  assert.equal(f.stages[0].reached, CL.cases, 'every case was selected');
  assert.equal(f.bottleneck.key, 'scn', 'show cause notices waiting for orders hold the most money');
  const shown = f.stuck.find((c) => c.id === CL.stories.stuckAtShowCause.caseId);
  assert.ok(shown && shown.stage === 'scn' && shown.stageSince === CL.stories.stuckAtShowCause.since);
  assert.equal(f.ageing.reduce((s, b) => s + b.cases, 0), f.open);
});

test('intervention revenue: direct payments, probable associations and deposits stay separate', () => {
  const r = eb.intervention;
  const pays = registers.caselog.records.filter((x) => x.event === 'payment').reduce((s, x) => s + x.amount, 0);
  near(r.totals.direct, pays, 1, 'direct = payments in cases');
  assert.deepEqual(r.rows.filter((x) => x.confidence === 'probable').map((x) => x.ref).sort(), ['EIU-2024-0098', 'EIU-2025-0112']);
  near(r.totals.deposits, registers.caselog.records.filter((x) => x.event === 'appeal').reduce((s, x) => s + x.amount, 0), 1, 'pre-deposits are not realised');
});

test('action yield: each cohort shows its numbers, and the planted patterns are found', () => {
  const y = eb.yieldByRisk;
  for (const [risk, b] of Object.entries(CL.byRisk)) {
    const row = y.rows.find((x) => x.cohort === risk);
    assert.equal(row.cases, b.cases, risk);
    near(row.selected, b.selected, 1, `${risk} selected`);
    near(row.realised, b.realised, 1, `${risk} realised`);
  }
  const net = y.rows.find((x) => x.cohort === CL.stories.establishedNotRealised[0]);
  assert.ok(net.established > 0 && net.realised === 0, 'network cases: established in orders, nothing realised (appeals)');
  const best = eb.learning.mix.filter((m) => m.closed >= 3)[0];
  assert.equal(best.riskType, CL.stories.fastestConversion);
  assert.equal(y.total.realised, y.rows.reduce((s, r) => s + r.realised, 0));
  assert.ok(Object.keys(y.definitions).length >= 5, 'every figure has a definition');
  const bySource = actionYield(eb.cases, { by: 'source' });
  near(bySource.total.realised, y.total.realised, 1, 'cohorting never changes the totals');
});

test('effort to outcome: high effort and low yield by case type, with suggestions', () => {
  const flagged = eb.effort.rows.filter((r) => r.highEffortLowYield).map((r) => r.riskType);
  for (const t of CL.stories.highEffortLowYield) assert.ok(flagged.includes(t), `${t} flagged`);
  assert.ok(!flagged.includes(CL.stories.fastestConversion));
  assert.ok(eb.effort.suggestions.some((s) => /revalidate against the latest returns/.test(s.text)), 'later-return closures suggest revalidating first');
  assert.ok(eb.effort.rows.every((r) => !('officer' in r)), 'no individual officer ranking');
});

test('recovery: stalled, blocked and appeal-window stories come out on top', () => {
  const w = eb.recovery;
  const row = (id) => w.rows.find((r) => r.demandId === id);
  assert.ok(row(CL.stories.stalledInstalments.demand).stalled);
  const blocked = row(CL.stories.blockedRecovery.demand);
  assert.ok(blocked.flight && blocked.stalled && blocked.segment === 'now');
  assert.equal(w.rows[0].demandId, CL.stories.blockedRecovery.demand, 'the untraceable proprietor ranks first');
  const win = row(CL.stories.appealWindowOver.demand);
  assert.ok(win.windowOver && win.segment === 'now', 'appeal window over: recoverable, stage to be updated');
  assert.ok(w.rows.filter((r) => r.stage === 'Under appeal').every((r) => r.segment === 'blocked'));
  near(w.totals.outstanding, w.totals.now + w.totals.blocked, 1, 'outstanding = recoverable now + not yet');
  assert.ok(w.rows.every((r) => r.next), 'every row has an officer-controlled next step');
});

test('role views read the same numbers', () => {
  const s = supervisorView(eb), c = commissionerView(eb);
  assert.equal(s.yield.realised, c.yield.realised);
  assert.equal(s.recovery.outstanding, c.recovery.outstanding);
  assert.equal(s.targetGap.gap, c.trajectory.gap);
  const anita = fieldView(eb, 'Anita S.');
  const names = anita.list.map((t) => t.gstin);
  assert.ok(names.includes(G.E09) && names.includes(G.E08), 'Anita sees her non-filer and pass-through');
  assert.ok(names.every((g) => registers.master.records.find((m) => m.gstin === g).officer === 'Anita S.'), 'only her taxpayers');
  assert.ok(anita.list[0].items.length >= 3);
});

test('platform case records join the case register', () => {
  const platform = { [G.E07]: { status: 'Closed', history: [
    { at: '2026-09-27 12:00', by: 'Priya M.', text: 'Closed: Explanation accepted (ASMT-12) (verified)' },
    { at: '2026-09-20 10:00', by: 'Priya M.', text: 'Taxpayer response recorded (received 2026-09-19)' },
    { at: '2026-09-01 10:00', by: 'Priya M.', text: 'Status → In review' },
  ], closure: { code: 'explained', at: '2026-09-27 12:00' } } };
  const cs = buildCases({ caselog: registers.caselog.records, platformCases: platform, asOf: '2026-09-27' });
  const p = cs.find((c) => c.id === `PLT-${G.E07}`);
  assert.deepEqual(p.events.map((e) => e.event), ['selected', 'assigned', 'reply', 'closed']);
  assert.equal(p.outcome, 'explained');
  assert.equal(actionFunnel(cs).cases, CL.cases + 1);
});

test('targets below the jurisdiction: allocations add back to the target, by every unit and method', async () => {
  const { targetPosition } = await import('../src/engine/targets.js');
  for (const by of ['range', 'officer', 'sector', 'taxpayer']) {
    for (const method of ['priorShare', 'avg3']) {
      const p = targetPosition({ base: eb.base, master: registers.master.records, targets: registers.targets.records, fy: '2025-2026', asOf: 6, by, method });
      assert.ok(p.reconciles, `${by} / ${method} adds up`);
      near(p.rows.reduce((s, r) => s + r.targetToDate, 0), p.targetToDate, 1, `${by} target to date`);
      near(p.rows.reduce((s, r) => s + r.actualToDate, 0), p.actualToDate, 1, `${by} actual to date`);
      near(p.rows.reduce((s, r) => s + r.gap, 0), p.gap, 1, `${by} gaps add to the jurisdiction gap`);
    }
  }
  const byTp = targetPosition({ base: eb.base, master: registers.master.records, targets: registers.targets.records, fy: '2025-2026', asOf: 6, by: 'taxpayer' });
  assert.ok(byTp.rows.find((r) => r.unit === G.E16).noBasis, 'a new registrant has no basis for a share, and is marked');
  assert.ok(byTp.assumptions.some((a) => /Not a department-approved allocation/.test(a)));
});

test('sector movement and concentration add up to the jurisdiction', async () => {
  const { sectorMovement, concentration } = await import('../src/engine/targets.js');
  const s = sectorMovement({ base: eb.base, master: registers.master.records, fy: '2025-2026' });
  const t = eb.base.totals;
  near(s.rows.reduce((a, r) => a + r.change, 0), t['2025-2026'].discharged - t['2024-2025'].discharged, 1, 'sector changes add to the jurisdiction change');
  const scrap = s.rows.find((r) => r.sector === 'Scrap trading');
  assert.ok(scrap && scrap.taxpayers === 3);
  const c = concentration({ base: eb.base, fy: '2025-2026' });
  near(c.curve.at(-1).cumulative, 1, 1e-9, 'the curve ends at 100%');
  assert.ok(c.top5 >= c.curve[0].share && c.top5 <= c.top10 && c.top10 <= 1);
  assert.ok(c.hhi > 0 && c.hhi <= 10000 && c.to80 >= 1 && c.to80 <= c.taxpayers);
});
