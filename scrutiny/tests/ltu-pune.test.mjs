// The LTU-PUNE generator (scripts/synth/ltu-pune.mjs): identities, structure, registers and planted expectations.
// Generating the workbooks is left to the build; scripts/synth/validate.mjs checks them end to end once built.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, FYS, JURISDICTION, ECOS, EXPECT, expectedFiles, registerRows } from '../scripts/synth/ltu-pune.mjs';
import { GROUPS as MUMBAI } from '../scripts/synth/corporates.mjs';
import { gstinValid } from '../src/engine/gstin.js';
import { parseRegister } from '../src/engine/registers.js';

const regs = GROUPS.flatMap((g) => g.entities);

test('ltu-pune: three years, every kind of group, thousands of crores', () => {
  assert.deepEqual(FYS, [2023, 2024, 2025]);
  for (const kind of ['clean', 'risky', 'tricky']) assert.ok(GROUPS.some((g) => g.kind === kind), `no ${kind} group`);
  const fy25 = GROUPS.reduce((s, g) => s + g.turnover * g.growth[2], 0);
  assert.ok(fy25 >= 30000, `FY 2025-26 turnover ₹${Math.round(fy25)} crore`);
  assert.ok(GROUPS.filter((g) => g.turnover * g.growth[2] >= 1000).length >= 8, 'most groups turn over more than ₹1,000 crore');
});

test('ltu-pune: GSTINs valid, generated (ZZ), unique, and distinct from LTU-MUMBAI', () => {
  const mumbai = new Set(MUMBAI.flatMap((g) => g.entities.map((e) => e.gstin)));
  const seen = new Set();
  for (const e of regs) {
    assert.equal(gstinValid(e.gstin), true, `${e.key} ${e.gstin}`);
    assert.equal(e.gstin.slice(2, 4), 'ZZ', `${e.key} is not marked generated`);
    assert.ok(!seen.has(e.gstin) && !mumbai.has(e.gstin), `duplicate ${e.gstin}`);
    seen.add(e.gstin);
  }
  for (const eco of ECOS) assert.equal(eco.pan.slice(0, 2), 'ZZ');
});

test('ltu-pune: one workbook per registration and year it was registered in', () => {
  const files = expectedFiles();
  const years = regs.reduce((s, e) => s + FYS.filter((fy) => !e.from || fy >= e.from.fy).length, 0);
  assert.equal(files.length, years);
  assert.ok(files.every((f) => /_GEN .+\.xlsx$/.test(f)), 'generated workbooks carry the _GEN marker (kept out of git)');
});

test('ltu-pune: register rows pass the register validation', () => {
  for (const [type, rows] of Object.entries(registerRows())) {
    const [header, ...data] = rows;
    const { errors, records } = parseRegister(type, data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]]))));
    assert.deepEqual(errors, [], type);
    assert.equal(records.length, data.length, type);
  }
  const { master, targets } = registerRows();
  assert.ok(master.slice(1).filter((r) => r[2] === JURISDICTION).length >= 10, 'the LTU holds the Maharashtra registrations');
  assert.equal(targets.length - 1, 36, 'monthly targets for three years');
  assert.ok(master.some((r) => r[7] === 'Cancelled'), 'a cancelled supplier for the after-cancellation check');
});

test('ltu-pune: every group is planted with something the validator checks', () => {
  const planted = new Set(EXPECT.map((x) => x.key.slice(0, 3)));
  for (const g of GROUPS.filter((x) => x.kind !== 'clean' || x.key === 'G31')) assert.ok(planted.has(g.key), `${g.key} has no expectation`);
  for (const x of EXPECT) assert.ok(regs.some((e) => e.key === x.key) && FYS.includes(x.fy), `${x.key} ${x.fy}`);
});
