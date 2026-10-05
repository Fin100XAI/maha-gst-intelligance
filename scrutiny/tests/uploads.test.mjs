// Upload log (scripts/lib/uploadLog.mjs) and the build-error reading of the upload job (scripts/data-store.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readLog, recordFile, recordAnalysis, cleanBatchId } from '../scripts/lib/uploadLog.mjs';
import { errorLine } from '../scripts/data-store.js';

test('upload log: files and analysis are recorded per batch, newest batch first', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-up-'));
  try {
    assert.deepEqual(readLog(dir), { batches: [] });
    recordFile(dir, 'b1', { name: 'a.xlsx', stored: 'a.xlsx', gstin: '27ZZKCK7101A1ZU', fy: '2025-2026', replaced: 0 });
    recordFile(dir, 'b1', { name: 'junk.xlsx', error: 'Not a returns export' });
    recordAnalysis(dir, ['b1'], { stage: 'running' });
    recordFile(dir, 'b2', { name: 'b.xlsx', stored: 'b.xlsx', gstin: '27ZZVFV7102B1ZZ', fy: '2025-2026', replaced: 1 });
    recordAnalysis(dir, ['b1', 'b2'], { stage: 'done', finishedAt: '2026-10-01T10:00:00Z' });
    const { batches } = readLog(dir);
    assert.deepEqual(batches.map((b) => b.id), ['b2', 'b1']);
    assert.deepEqual(batches[1].files.map((f) => f.ok), [true, false]);
    assert.equal(batches[1].analysis.stage, 'done');
    assert.equal(cleanBatchId('b123'), 'b123');
    assert.equal(cleanBatchId('../etc'), null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a failed build reports its error line, not Node\'s closing version line', () => {
  const stderr = "node:fs:562\n  return binding.open(\n Error: EACCES: permission denied, open '/srv/app/public/data.json'\n    at Object.openSync (node:fs:562:18)\n\nNode.js v20.19.5\n";
  assert.equal(errorLine(stderr), "Error: EACCES: permission denied, open '/srv/app/public/data.json'");
  assert.equal(errorLine('FAILED x.xlsx: bad file\n'), 'FAILED x.xlsx: bad file');
});

test('the upload report says what changed for each taxpayer since the last run', async () => {
  const { changeText } = await import('../src/lib/uploads.js');
  const was = { fy: '2025-2026', score: 24, band: 'Low', fails: ['J-01'] };
  assert.equal(changeText({ gstin: 'x', before: null, after: was }), 'New taxpayer');
  assert.equal(changeText({ gstin: 'x', before: was, after: was }), 'No change');
  assert.equal(changeText({ gstin: 'x', before: was, after: { ...was, score: 48, band: 'High', fails: ['B-01', 'J-01'] } }), 'score 24 → 48 (Low → High) · new failed: B-01');
  assert.equal(changeText({ gstin: 'x', before: was, after: { ...was, score: 3, fails: [] } }), 'score 24 → 3 · no longer failing: J-01');
});
