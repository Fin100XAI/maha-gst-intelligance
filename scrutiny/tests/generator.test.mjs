// The synthetic-data generator must be deterministic: regenerating writes the committed workbooks byte for byte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, TEST_DATA } from './helpers.mjs';

test('make-test-data.mjs reproduces test-data/*.xlsx exactly', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-synth-'));
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'make-test-data.mjs')], { env: { ...process.env, OUT_DIR: out }, stdio: 'pipe' });
    const committed = fs.readdirSync(TEST_DATA).filter((f) => f.endsWith('.xlsx')).sort();
    assert.deepEqual(fs.readdirSync(out).sort(), committed);
    for (const f of committed) assert.ok(fs.readFileSync(path.join(out, f)).equals(fs.readFileSync(path.join(TEST_DATA, f))), `${f} differs`);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
