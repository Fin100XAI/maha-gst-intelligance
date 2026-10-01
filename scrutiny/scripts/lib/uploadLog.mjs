// Upload log: what each batch of returns uploads did, so the Upload data screen can show it after the fact (and after
// a reload): the files received, whether each was accepted, and whether the analysis that followed finished.
//   <dataDir>/uploads.json  { batches: [{ id, startedAt, files: [{ name, stored, gstin, fy, replaced, ok, error }],
//                                         analysis: { stage: pending|running|done|error, startedAt, finishedAt, error } }] }
// Newest batch first; the last 20 are kept.
import fs from 'node:fs';
import path from 'node:path';

const KEEP = 20;
export const cleanBatchId = (v) => (/^[\w-]{1,40}$/.test(String(v || '')) ? String(v) : null);
const fileOf = (dataDir) => path.join(dataDir, 'uploads.json');

export function readLog(dataDir) {
  try { const j = JSON.parse(fs.readFileSync(fileOf(dataDir), 'utf8')); return Array.isArray(j.batches) ? j : { batches: [] }; } catch { return { batches: [] }; }
}
function update(dataDir, id, fn, now = new Date()) {
  const log = readLog(dataDir);
  let b = log.batches.find((x) => x.id === id);
  if (!b) { b = { id, startedAt: now.toISOString(), files: [], analysis: { stage: 'pending' } }; log.batches.unshift(b); }
  fn(b);
  log.batches = log.batches.slice(0, KEEP);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(fileOf(dataDir), JSON.stringify(log, null, 1));
  return b;
}
/** One file of a batch: accepted ({ stored, gstin, fy, replaced }) or rejected ({ error }). */
export const recordFile = (dataDir, id, entry, now) => update(dataDir, id, (b) => { b.files.push({ ok: !entry.error, ...entry }); b.analysis = { stage: 'pending' }; }, now);
/** The analysis of one or more batches: running, then done or error. */
export const recordAnalysis = (dataDir, ids, analysis) => { for (const id of ids) update(dataDir, id, (b) => { b.analysis = { ...b.analysis, ...analysis }; }); };
