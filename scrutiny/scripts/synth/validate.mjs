// End-to-end check of the synthetic data: every workbook in data/ is parsed and analysed for every year exactly as the
// build does (scripts/lib/dataset.mjs, with e-way bills), then checked against what the generators planted.
//
//   node scripts/synth/validate.mjs            -> report, exit code 1 when a check fails
//   node scripts/synth/validate.mjs --json F   -> also writes the full result to F
//
// Checks: (1) every workbook parses and its own GSTIN is valid; (2) each planted trigger fires on the registration and
// year it was planted in (rule status, risk indicator, review prompt, network anomaly); (3) clean groups stay clean in
// every year and each kind of group lands in its expected risk band; (4) where both sides of a trade are loaded, the
// seller's GSTR-1 and the buyer's GSTR-2B agree, except where a difference was planted; (5) coverage: which rules,
// indicators, anomalies and revenue explanations the whole dataset reaches, and that the ones added for coverage fire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { parseWorkbook, parseRuleMatrix } from '../../src/engine/parse.js';
import { parseRegister } from '../../src/engine/registers.js';
import { analyze, gstinValid } from '../../src/engine/analyze.js';
import { tradeOf, graphOf, detectAnomalies } from '../../src/engine/network.js';
import { baselineOf } from '../../src/engine/baseline.js';
import { explainRevenueChange } from '../../src/engine/revenue.js';
import { ewbFor } from './ewb.mjs';
import * as MUM from './corporates.mjs';
import * as PUN from './ltu-pune.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = path.join(ROOT, 'data');
const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const fyLabel = (fy) => `${fy}-${fy + 1}`;

// ------------------------------------------------------------------ load and analyse every workbook, every year
const t0 = Date.now();
const all = fs.readdirSync(DATA).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$'));
const matrixFile = all.find((f) => /rule_matrix/i.test(f));
// Rule severities from the rule matrix weight the score, as in the build
const severity = matrixFile ? Object.fromEntries(parseRuleMatrix(XLSX.read(fs.readFileSync(path.join(DATA, matrixFile)), { type: 'buffer' })).map((r) => [r.id, r.severity])) : {};
const files = all.filter((f) => f !== matrixFile);
const entries = [];
const problems = [];
for (const f of files) {
  try {
    const tp = parseWorkbook(XLSX.read(fs.readFileSync(path.join(DATA, f)), { type: 'buffer' }), f);
    if (!tp.gstin) { problems.push(`${f}: no GSTIN banner`); continue; }
    tp.ewb = ewbFor({ dataDir: DATA, root: ROOT, tp });
    entries.push({ f, gstin: tp.gstin, fy: tp.fyStart, a: analyze(tp, { severity }), trade: tradeOf(tp), synthetic: /_(GEN|SYN|TEST) /i.test(f) });
  } catch (e) { problems.push(`${f}: ${e.message}`); }
}
const at = new Map(entries.map((x) => [`${x.gstin}|${x.fy}`, x]));
const master = fs.existsSync(path.join(DATA, 'registers', 'master.json')) ? JSON.parse(fs.readFileSync(path.join(DATA, 'registers', 'master.json'), 'utf8')).records : [];
// LTU-PUNE is uploaded, not built in: its master rows arrive with the upload pack, so they are added here as uploaded
{
  const [header, ...rows] = PUN.registerRows().master;
  const have = new Set(master.map((r) => r.gstin));
  master.push(...parseRegister('master', rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))).records.filter((r) => !have.has(r.gstin)));
}
const graph = graphOf(entries.map((x) => x.trade));
const anomalies = Object.fromEntries(graph.years.map((fy) => [fy, detectAnomalies(graph, { fy, master })]));

const checks = [];
const check = (group, name, ok, detail = '') => checks.push({ group, name, ok: !!ok, detail });

// (1) parsing and identities
check('load', `${entries.length} workbooks parsed`, problems.length === 0, problems.slice(0, 5).join('; '));
for (const x of entries.filter((e) => e.synthetic)) if (gstinValid(x.gstin) !== true) check('load', `${x.f}: own GSTIN valid`, false, x.gstin);

// (2) planted triggers
const units = [
  { name: 'LTU-MUMBAI', mod: MUM, gstinOf: (k) => MUM.GROUPS.flatMap((g) => g.entities).find((e) => e.key === k)?.gstin },
  { name: 'LTU-PUNE', mod: PUN, gstinOf: PUN.gstinOf },
];
const flagOf = (a, key) => a.fraud.find((f) => f.key === key);
for (const u of units) {
  for (const exp of u.mod.EXPECT || []) {
    const gstin = u.gstinOf(exp.key);
    const x = at.get(`${gstin}|${exp.fy}`);
    const label = `${exp.key} FY ${fyLabel(exp.fy)}`;
    if (!x) { check(u.name, `${label}: workbook loaded`, false, gstin); continue; }
    for (const [id, want] of Object.entries(exp.rules || {})) {
      const got = x.a.results.find((r) => r.id === id)?.status;
      check(u.name, `${label}: ${id} ${want}`, got === want, `got ${got}`);
    }
    for (const k of exp.flags || []) { const fl = flagOf(x.a, k); check(u.name, `${label}: indicator "${k}" raised`, fl?.flagged && !fl.prompt, fl ? fl.value : 'absent'); }
    for (const k of exp.prompts || []) { const fl = flagOf(x.a, k); check(u.name, `${label}: review prompt "${k}" raised`, fl?.flagged, fl ? fl.value : 'absent'); }
    if (exp.band) check(u.name, `${label}: band ${exp.band.join('/')}`, exp.band.includes(x.a.band), `got ${x.a.band} (${x.a.score})`);
  }
  for (const exp of u.mod.EXPECT_NETWORK || []) {
    const g = (k) => (typeof k === 'function' ? k() : u.gstinOf(k));
    const list = anomalies[exp.fy] || [];
    const hit = exp.via ? list.find((an) => an.type === exp.type && an.via === g(exp.via)) : list.find((an) => an.type === exp.type && an.path.includes(g(exp.from)) && an.path.includes(g(exp.to)));
    check(u.name, `network ${exp.fy}: ${exp.type} ${exp.via ? `at ${typeof exp.via === 'string' ? exp.via : 'planted'}` : `${typeof exp.from === 'string' ? exp.from : 'planted'} -> ${typeof exp.to === 'string' ? exp.to : 'planted'}`}`, hit, hit ? hit.why.slice(0, 90) : 'not found');
  }
}

// (3) bands by kind, and clean groups clean in every year
const BAND_BY_KIND = { clean: ['Low'], tricky: ['Low', 'Moderate'] };
const bandTable = [];
for (const u of units) {
  for (const grp of u.mod.GROUPS) {
    for (const e of grp.entities) {
      const years = entries.filter((x) => x.gstin === e.gstin).sort((a, b) => a.fy - b.fy);
      for (const x of years) {
        const fails = x.a.results.filter((r) => r.status === 'Fail').map((r) => r.id);
        const flags = x.a.fraud.filter((f) => f.flagged && !f.prompt).map((f) => f.key);
        bandTable.push({ unit: u.name, key: e.key, kind: grp.kind, fy: fyLabel(x.fy), band: x.a.band, score: x.a.score, fails, flags });
        if (grp.kind === 'clean') {
          check(u.name, `${e.key} FY ${fyLabel(x.fy)} (clean): no failed check`, fails.length === 0, fails.join(' '));
        }
      }
      const latest = years[years.length - 1];
      // Judged on the group's main registration (a depot or branch can be quieter). Clean and complex groups by band;
      // high-risk groups by detection: at least one failed check, whatever the score makes of it.
      if (latest && e === grp.entities[0]) {
        if (grp.kind === 'risky') check(u.name, `${e.key} FY ${fyLabel(latest.fy)} (risky): planted problems detected`, latest.a.results.some((r) => r.status === 'Fail'), `band ${latest.a.band} (${latest.a.score})`);
        else check(u.name, `${e.key} FY ${fyLabel(latest.fy)} (${grp.kind}): band ${BAND_BY_KIND[grp.kind].join('/')}`, BAND_BY_KIND[grp.kind].includes(latest.a.band), `got ${latest.a.band} (${latest.a.score})`);
      }
    }
  }
}

// (4) seller GSTR-1 against buyer GSTR-2B where both are loaded
const plantedMismatch = new Set([`${PUN.gstinOf('G36A')}>${PUN.gstinOf('G34A')}|2025-2026`]);
for (const [fy, list] of Object.entries(anomalies)) {
  for (const an of list.filter((x) => x.type === 'mismatch')) {
    const k = `${an.path[0]}>${an.path[1]}|${fy}`;
    check('consistency', `seller and buyer agree: ${an.path[0]} -> ${an.path[1]} (${fy})`, plantedMismatch.has(k), an.why.slice(0, 110));
  }
}
const bothSides = graph.edges.filter((e) => e.seller && e.buyer).length;
check('consistency', `${bothSides} trades have both sides loaded`, bothSides > 100);

// (5) coverage across the whole dataset
const cover = { rules: {}, indicators: {}, prompts: {}, anomalies: {}, revenue: {} };
const bump = (o, k, who) => { (o[k] ||= new Set()).add(who); };
for (const x of entries) {
  const who = `${x.a.name} ${x.a.fy}`;
  for (const r of x.a.results) if (r.status === 'Fail' || r.status === 'Review') bump(cover.rules, `${r.id} ${r.status}`, who);
  for (const f of x.a.fraud) if (f.flagged) bump(f.prompt ? cover.prompts : cover.indicators, f.key, who);
}
for (const [fy, list] of Object.entries(anomalies)) for (const an of list) bump(cover.anomalies, an.type, `${an.id} ${fy}`);
const byGstin = new Map();
for (const x of entries) (byGstin.get(x.gstin) || byGstin.set(x.gstin, []).get(x.gstin)).push(x);
for (const list of byGstin.values()) {
  const s = list.sort((a, b) => a.fy - b.fy).map((x) => baselineOf(x.a));
  for (let i = 1; i < s.length; i++) {
    const r = explainRevenueChange(s[i - 1], s[i]);
    for (const d of r.drivers || []) if (d.class !== 'explained') bump(cover.revenue, `driver ${d.key}: ${d.class}`, s[i].gstin + s[i].fy);
    for (const h of r.hypotheses || []) if (h.status !== 'not supported' && h.status !== 'not applicable') bump(cover.revenue, `hypothesis ${h.key}: ${h.status}`, s[i].gstin + s[i].fy);
  }
}
const firesAnywhere = (id) => Object.keys(cover.rules).some((k) => k.startsWith(`${id} `));
for (const id of ['B-07', 'B-09', 'C-02', 'D-02', 'G-14', 'H-01', 'H-06']) check('coverage', `rule ${id} fires somewhere`, firesAnywhere(id));
for (const t of ['afterCancellation', 'mismatch', 'invalidGstin', 'abrupt', 'cycle', 'passThrough', 'nonFiler', 'reciprocal', 'samePan', 'concentration']) check('coverage', `network anomaly ${t} found`, cover.anomalies[t]?.size);
for (const k of ['circular', 'distinct', 'valueadd', 'nonfiler', 'benford', 'round', 'ewb', 'accum', 'cn', 'dup', 'arith', 'vehicle']) check('coverage', `indicator ${k} raised somewhere`, cover.indicators[k]?.size);
for (const k of ['spike', 'sunday', 'ewbcancel']) check('coverage', `review prompt ${k} raised somewhere`, cover.prompts[k]?.size);

// ------------------------------------------------------------------ report
const failed = checks.filter((c) => !c.ok);
const count = (o) => Object.entries(o).map(([k, v]) => [k, v.size]).sort((a, b) => a[0].localeCompare(b[0]));
console.log(`Synthetic data validation: ${entries.length} workbooks (${entries.filter((x) => x.synthetic).length} generated), ${byGstin.size} GSTINs, ${graph.years.length} years, ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
console.log('Bands (main and branch registrations, every year):');
for (const u of units) {
  console.log(`  ${u.name}`);
  for (const k of [...new Set(bandTable.filter((b) => b.unit === u.name).map((b) => b.key))]) {
    const rows = bandTable.filter((b) => b.unit === u.name && b.key === k);
    console.log(`    ${k.padEnd(5)} ${rows[0].kind.padEnd(6)} ${rows.map((b) => `${b.fy.slice(2, 4)}-${b.fy.slice(7)} ${b.band[0]}${String(b.score).padStart(3)}`).join('  ')}   ${rows[rows.length - 1].fails.join(' ')}${rows[rows.length - 1].flags.length ? ` | ${rows[rows.length - 1].flags.join(' ')}` : ''}`);
  }
}
console.log('\nCoverage (registration-years reaching each):');
console.log(`  rules      ${count(cover.rules).map(([k, n]) => `${k}:${n}`).join('  ')}`);
console.log(`  indicators ${count(cover.indicators).map(([k, n]) => `${k}:${n}`).join('  ')}`);
console.log(`  prompts    ${count(cover.prompts).map(([k, n]) => `${k}:${n}`).join('  ')}`);
console.log(`  anomalies  ${count(cover.anomalies).map(([k, n]) => `${k}:${n}`).join('  ')}`);
console.log(`  revenue    ${count(cover.revenue).map(([k, n]) => `${k}:${n}`).join('  ')}`);
console.log(`\nChecks: ${checks.length - failed.length} of ${checks.length} passed`);
for (const c of failed) console.log(`  FAIL [${c.group}] ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ checks, bands: bandTable, coverage: Object.fromEntries(Object.entries(cover).map(([k, v]) => [k, Object.fromEntries(count(v))])) }, null, 1));
process.exitCode = failed.length ? 1 : 0;
