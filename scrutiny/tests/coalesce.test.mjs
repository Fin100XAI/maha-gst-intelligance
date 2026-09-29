// Rebuild coalescing: bursts share runs, and no request is answered by a run that started before it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coalesce } from '../scripts/lib/coalesce.mjs';

const deferred = () => { let resolve; const p = new Promise((r) => { resolve = r; }); return { p, resolve }; };

test('a burst during a run shares one follow-up run', async () => {
  const gates = [];
  let runs = 0;
  const rebuild = coalesce(() => { runs++; const d = deferred(); gates.push(d); return d.p; });
  const first = rebuild();                    // starts run 1
  const burst = [rebuild(), rebuild(), rebuild()]; // all wait for run 2
  assert.equal(runs, 1);
  gates[0].resolve('one');
  assert.equal(await first, 'one');
  await new Promise((r) => setImmediate(r));
  assert.equal(runs, 2, 'exactly one follow-up run for the whole burst');
  gates[1].resolve('two');
  assert.deepEqual(await Promise.all(burst), ['two', 'two', 'two']);
  const later = rebuild();                    // idle again: starts run 3 immediately
  assert.equal(runs, 3);
  gates[2].resolve('three');
  assert.equal(await later, 'three');
});

test('a failed run rejects its callers but does not block the next one', async () => {
  let n = 0;
  const rebuild = coalesce(async () => { n++; if (n === 1) throw new Error('boom'); return 'ok'; });
  await assert.rejects(rebuild(), /boom/);
  assert.equal(await rebuild(), 'ok');
});
