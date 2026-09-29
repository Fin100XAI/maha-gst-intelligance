// The large-taxpayer generator (scripts/synth/corporates.mjs): identities, structure and registers.
// Generating the workbooks themselves is left to the build (it writes ~100 MB); this checks what they are built from.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUPS, FYS, JURISDICTION, expectedFiles, registerRows } from '../scripts/synth/corporates.mjs';
import { gstinValid } from '../src/engine/gstin.js';
import { parseRegister } from '../src/engine/registers.js';

const regs = GROUPS.flatMap((g) => g.entities);

test('corporates: 20-30 groups, every kind represented', () => {
  assert.ok(GROUPS.length >= 20 && GROUPS.length <= 30, `${GROUPS.length} groups`);
  for (const kind of ['clean', 'risky', 'tricky']) assert.ok(GROUPS.some((g) => g.kind === kind), `no ${kind} group`);
  assert.ok(GROUPS.every((g) => g.turnover >= 800), 'every group turns over hundreds of crores or more');
  assert.ok(GROUPS.some((g) => g.turnover >= 40000), 'at least one very large group');
});

test('corporates: GSTINs are valid, generated (ZZ) and unique', () => {
  const seen = new Set();
  for (const e of regs) {
    assert.equal(gstinValid(e.gstin), true, `${e.key} ${e.gstin}`);
    assert.equal(e.gstin.slice(2, 4), 'ZZ', `${e.key} is not marked generated`);
    assert.ok(!seen.has(e.gstin), `duplicate ${e.gstin}`);
    seen.add(e.gstin);
  }
});

test('corporates: subsidiaries (own PAN) and same-PAN branches in other states', () => {
  const subsidiaries = GROUPS.filter((g) => new Set(g.entities.map((e) => e.pan)).size > 1);
  const branches = GROUPS.filter((g) => g.entities.some((e, i) => g.entities.some((f, j) => j !== i && f.pan === e.pan && f.state !== e.state)));
  assert.ok(subsidiaries.length >= 5, `${subsidiaries.length} groups with subsidiaries`);
  assert.ok(branches.length >= 5, `${branches.length} groups with same-PAN branches`);
});

test('corporates: one workbook per registration and year', () => {
  const files = expectedFiles();
  assert.equal(files.length, regs.length * FYS.length);
  assert.ok(files.every((f) => /_GEN .+\.xlsx$/.test(f)), 'generated workbooks carry the _GEN marker (kept out of git)');
});

test('corporates: register rows pass the register validation', () => {
  for (const [type, rows] of Object.entries(registerRows())) {
    const [header, ...data] = rows;
    const { errors, records } = parseRegister(type, data.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]]))));
    assert.deepEqual(errors, [], type);
    assert.equal(records.length, data.length, type);
  }
  const master = registerRows().master;
  assert.ok(master.slice(1).filter((r) => r[2] === JURISDICTION).length >= 30, 'the LTU holds the Maharashtra registrations');
});
