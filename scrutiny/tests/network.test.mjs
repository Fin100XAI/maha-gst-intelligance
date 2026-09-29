// Counterparty and network intelligence (src/engine/network.js) against the synthetic ward's planted network
// (test-data/ward/answer-key.json: cycle, pass-through, reciprocal pair, non-filer, new registrant, same PAN).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { ROOT } from './helpers.mjs';
import { parseWorkbook } from '../src/engine/parse.js';
import { parseRegister } from '../src/engine/registers.js';
import { readRows } from '../scripts/lib/registerStore.mjs';
import { tradeOf, graphOf, detectAnomalies, exposureFunnel, resolveEntities, paths, counterpartyCard, counterpartiesOf } from '../src/engine/network.js';

const WARD = path.join(ROOT, 'test-data', 'ward');
const KEY = JSON.parse(fs.readFileSync(path.join(WARD, 'answer-key.json'), 'utf8'));
const G = Object.fromEntries(KEY.taxpayers.map((t) => [t.key, t.gstin]));
const FY = { '2023-24': '2023-2024', '2024-25': '2024-2025', '2025-26': '2025-2026' };
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

let g, master, trades;
const found = {};
const anomalies = (fy) => (found[fy] ||= detectAnomalies(g, { fy, master }));
const of = (fy, type) => anomalies(fy).filter((a) => a.type === type);

before(() => {
  trades = KEY.workbooks.map((w) => tradeOf(parseWorkbook(XLSX.read(fs.readFileSync(path.join(WARD, w.file)), { type: 'buffer' }), w.file)));
  g = graphOf(trades);
  const file = fs.readdirSync(path.join(WARD, 'registers')).find((f) => f.startsWith('master'));
  master = parseRegister('master', readRows(fs.readFileSync(path.join(WARD, 'registers', file)), file)).records;
});

test('both returns of an in-ward trade agree, and the cycle legs match the answer key', () => {
  for (const [label, legs] of Object.entries(KEY.network.cycle.valueByYear)) {
    for (const [leg, value] of legs) {
      const [a, b] = leg.split('>');
      const e = g.edges.find((x) => x.from === G[a] && x.to === G[b] && x.fy === FY[label]);
      assert.ok(e?.seller && e?.buyer, `${leg} ${label} seen from both sides`);
      near(e.seller.taxable, e.buyer.taxable, 1, `${leg} seller vs buyer`);
      assert.ok(e.taxable >= value - 1, `${leg} ${label}: edge ${e.taxable} covers the cycle flow ${value}`);
    }
  }
});

test('the three-party cycle is found every year, and only that cycle', () => {
  for (const fy of Object.values(FY)) {
    const cycles = of(fy, 'cycle');
    assert.equal(cycles.length, 1, fy);
    assert.deepEqual(new Set(cycles[0].path), new Set(KEY.network.cycle.members.map((k) => G[k])));
    assert.equal(cycles[0].path[0], cycles[0].path[cycles[0].path.length - 1], 'the path closes');
    assert.ok(cycles[0].baseline && cycles[0].evidence.length === 3);
  }
});

test('rapid pass-through: E08 every year, E16 from its first year; nobody else in the ward', () => {
  const wardKeys = new Set(Object.values(G));
  for (const fy of Object.values(FY)) {
    const via = of(fy, 'passThrough').map((a) => a.via).filter((x) => wardKeys.has(x)).sort();
    assert.deepEqual(via, [G.E08, ...(fy === '2025-2026' ? [G.E16] : [])].sort(), fy);
  }
  const e08 = of('2025-2026', 'passThrough').find((a) => a.via === G.E08);
  assert.equal(e08.path[0], G.E09, 'buys from E09');
  assert.ok(KEY.network.passThrough.sellsTo.map((k) => G[k]).includes(e08.path[2]), 'sells to E07 or E10');
  const flow = g.trades[`${G.E08}|2025-2026`].flow;
  assert.ok(flow.lagMedian >= 1 && flow.lagMedian <= 3, `lag ${flow.lagMedian} days`);
  assert.ok(g.trades[`${G.E01}|2025-2026`].flow.lagMedian > 5, 'a manufacturer holds stock longer');
});

test('the reciprocal pair E08/E10 is found and stays medium because both sit on the cycle', () => {
  const r = of('2025-2026', 'reciprocal').find((a) => new Set(a.path).has(G.E08) && new Set(a.path).has(G.E10));
  assert.ok(r);
  assert.equal(r.severity, 'medium');
});

test('E09 invoices Oct-Mar without GSTR-3B; E08 and E16 are among the affected buyers', () => {
  const nf = of('2025-2026', 'nonFiler').find((a) => a.via === G.E09);
  assert.ok(nf);
  assert.deepEqual(nf.window, { from: 'Oct', to: 'Mar' });
  for (const k of KEY.network.nonFiler.affectedBuyers) assert.ok(nf.path.includes(G[k]), `${k} affected`);
  assert.ok(!of('2024-2025', 'nonFiler').some((a) => a.via === G.E09), 'E09 filed every month the year before');
});

test('abrupt network formation: E16 only, dated from the taxpayer master', () => {
  const ab = of('2025-2026', 'abrupt');
  assert.deepEqual(ab.map((a) => a.via), [G.E16]);
  assert.match(ab[0].why, /registered on 2025-07-01/);
  assert.equal(ab[0].window.from, 'Jul');
  for (const fy of ['2023-2024', '2024-2025']) assert.equal(of(fy, 'abrupt').length, 0, fy);
});

test('invoices after cancellation: only the late invoices count, and their credit is the exposure', () => {
  const S = '27ZZNPN4040B1ZV', B = G.E02, fy = '2024-2025';
  const mini = graphOf([{ gstin: B, name: 'BUYER', fy, fyStart: 2024, filedMonths: [], g1Months: [], sales: {}, flow: {},
    purchases: { [S]: { name: 'SUPPLIER', months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5e5, 5e5, 5e5], taxable: 15e5, tax: 27e4, itc: 27e4, invoices: 3, notFiled: { invoices: 0, tax: 0, months: [] },
      inv: [[280, 5e5, 9e4], [310, 5e5, 9e4], [340, 5e5, 9e4]] } } }]); // 06-01, 05-02 and 07-03-2025
  const reg = [{ gstin: S, status: 'Cancelled', statusDate: '2025-01-31', registrationDate: '2019-07-01' }];
  const a = detectAnomalies(mini, { fy, master: reg }).find((x) => x.type === 'afterCancellation');
  assert.ok(a);
  assert.equal(a.itc, 18e4, 'two invoices after 31-01-2025');
  const f = exposureFunnel(mini, [a], { fy, scope: new Set([B]) });
  assert.equal(f.unresolved.itc, 18e4);
  assert.equal(counterpartyCard(mini, [a], { fy, taxpayer: B, counterparty: S, master: reg }).state, 'verify');
});

test('entity resolution links same-PAN registrations deterministically and never merges different PANs', () => {
  const r = resolveEntities(g, master);
  const e05 = r.entities.find((e) => e.gstins.some((x) => x.gstin === G.E05));
  assert.deepEqual(e05.gstins.map((x) => x.gstin).sort(), [...KEY.network.samePan.gstins].sort());
  assert.equal(e05.link.method, 'same PAN');
  assert.equal(e05.link.confidence, 'deterministic');
  for (const e of r.entities) assert.equal(new Set(e.gstins.map((x) => x.gstin.slice(2, 12))).size, 1, `${e.id} holds one PAN`);
  assert.equal(r.entities.reduce((s, e) => s + e.gstins.length, 0), r.stats.gstins, 'every GSTIN in exactly one entity');
  const bad = graphOf([{ gstin: G.E01, name: 'A', fy: '2025-2026', fyStart: 2025, filedMonths: [], g1Months: [], sales: {}, flow: {},
    purchases: { '27ZZXPX0000X1Z0': { name: 'BAD', months: new Array(12).fill(0), taxable: 1, tax: 0, itc: 0, invoices: 1, notFiled: { invoices: 0, tax: 0, months: [] }, inv: [] } } }]);
  assert.ok(resolveEntities(bad).review.some((x) => x.type === 'invalid-gstin'), 'an invalid GSTIN is queued for review');
});

test('multi-hop paths: upstream of E07 reaches E09 through both intermediaries, and loops are marked', () => {
  const p = paths(g, G.E07, { fy: '2025-2026', direction: 'up', depth: 3 });
  const l1 = (x) => p.children.find((c) => c.gstin === G[x]);
  assert.ok(l1('E16').children.some((c) => c.gstin === G.E09), 'E07 ← E16 ← E09');
  const e09 = l1('E08').children.find((c) => c.gstin === G.E09);
  assert.ok(e09, 'E07 ← E08 ← E09');
  const e10 = e09.children.find((c) => c.gstin === G.E10);
  assert.ok(e10, 'E07 ← E08 ← E09 ← E10');
  assert.equal(e10.children.length, 0, 'depth 3 stops there');
  const deep = paths(g, G.E07, { fy: '2025-2026', direction: 'up', depth: 4 });
  const loop = deep.children.find((c) => c.gstin === G.E08).children.find((c) => c.gstin === G.E09).children.find((c) => c.gstin === G.E10).children.find((c) => c.gstin === G.E08);
  assert.equal(loop?.loopsTo, G.E08, 'the path back to E08 is marked as a loop');
  for (const c of p.children) assert.ok(c.edge.taxable > 0 && c.edge.sides.length > 0);
  assert.ok(p.pruned.count >= 0 && typeof p.pruned.value === 'number');
});

test('exposure funnel narrows at each stage and counts every edge once', () => {
  const scope = new Set(master.filter((r) => r.jurisdiction === KEY.jurisdiction).map((r) => r.gstin));
  const an = anomalies('2025-2026');
  const f = exposureFunnel(g, an, { fy: '2025-2026', scope });
  assert.ok(f.universe.edges >= f.material.edges && f.material.edges >= f.anomalous.edges && f.anomalous.edges > 0);
  assert.equal(new Set(f.rows.map((r) => r.edge)).size, f.rows.length, 'no edge twice');
  near(f.anomalous.taxable, f.rows.reduce((s, r) => s + r.taxable, 0), 1, 'anomalous value = its unique edges');
  const nf = an.find((a) => a.type === 'nonFiler' && a.via === G.E09);
  near(f.unresolved.unpaidTax, nf.tax, 2, 'unpaid tax = E09 tax in its unfiled months');
  near(f.unresolved.total, f.rows.reduce((s, r) => s + Math.max(r.itc, r.unpaid), 0), 1, 'per edge, credit and unpaid tax on the same invoices count once');
  assert.ok(f.unresolved.overlap > 0 && f.unresolved.total < f.unresolved.itc + f.unresolved.unpaidTax, 'the E09 -> buyer edges carry both, and the overlap is reported');
  const itcE07 = f.rows.filter((r) => r.to === G.E07).reduce((s, r) => s + r.itc, 0);
  near(itcE07, KEY.revenueDrivers.E07.itcFromE08E16[1], 1000, 'E07 credit from E08 and E16 is unresolved');
});

test('counterparty evidence: E16 requires verification for E07; an established in-ward supplier is consistent', () => {
  const fy = '2025-2026', an = anomalies(fy);
  const c16 = counterpartyCard(g, an, { fy, taxpayer: G.E07, counterparty: G.E16, master });
  assert.equal(c16.state, 'verify');
  assert.ok(c16.matrix.contradictory.some((t) => /pass-through/i.test(t)) && c16.matrix.contradictory.some((t) => /Abrupt/.test(t)));
  assert.ok(c16.matrix.missing.length && c16.matrix.questions.length);
  assert.ok(c16.matrix.contradictory.some((t) => t.startsWith('Linked, at SHREE BALAJI')), 'the upstream non-filer is attributed to E09, not to E16');
  assert.ok(!c16.matrix.questions.some((t) => /Has VISTA/.test(t)), 'E16 is not asked about tax E09 did not pay');
  const c15 = counterpartyCard(g, an, { fy, taxpayer: G.E07, counterparty: G.E15, master });
  assert.equal(c15.state, 'consistent', c15.matrix.contradictory.join(' | '));
  assert.ok(c15.matrix.consistent.some((t) => /also traded/.test(t)));
  const list = counterpartiesOf(g, an, { fy, taxpayer: G.E07, master });
  assert.equal(list[0].state, 'verify', 'the worklist starts with what needs verification');
  assert.ok(list.some((c) => c.gstin === G.E08 && c.state === 'verify'));
});

test('clean ward taxpayers carry no high or medium anomaly', () => {
  for (const k of ['E01', 'E03', 'E04', 'E06', 'E11', 'E12', 'E13', 'E14']) {
    for (const fy of Object.values(FY)) {
      const hits = anomalies(fy).filter((a) => a.severity !== 'low' && a.path.includes(G[k]) && !(a.type === 'nonFiler' && a.via !== G[k]));
      assert.deepEqual(hits.map((a) => a.type), [], `${k} ${fy}`);
    }
  }
});
