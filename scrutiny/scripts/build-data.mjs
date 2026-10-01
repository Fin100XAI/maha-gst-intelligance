// Reads every GST return workbook in ./data plus the rule matrix, runs the scrutiny engine,
// and writes ./public/data.json for the dashboard (see scripts/lib/dataset.mjs).
//   DATA_DIR  input folder (default ./data)      OUT_FILE  output file (default ./public/data.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDataset } from './lib/dataset.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
const outFile = process.env.OUT_FILE ? path.resolve(process.env.OUT_FILE) : path.join(root, 'public', 'data.json');

// PROGRESS=1: one "progress <done>/<total>" line per workbook instead of the per-taxpayer log (for the upload job).
const quiet = process.env.PROGRESS === '1';
const { dataset, errors, stats } = buildDataset({ dataDir, log: quiet ? () => {} : (m) => console.log(m), warn: (m) => console.warn(m), progress: quiet ? (i, n) => console.log(`progress ${i}/${n}`) : () => {} });
for (const e of errors) console.error(`FAILED ${e}`);
// A workbook that cannot be read fails the command-line build; the upload job reports it and carries on.
if (errors.length && !quiet) process.exitCode = 1;

// Written to a temporary file and moved into place, so the screens never read a half-written file.
try {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const tmp = `${outFile}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dataset));
  fs.renameSync(tmp, outFile);
} catch (e) {
  console.error(`Error: could not save the analysis to ${outFile}: ${e.message}`);
  process.exit(1);
}
const years = Object.values(dataset.baselines).reduce((s, b) => s + b.length, 0);
console.log(`\nWrote ${path.relative(root, outFile)}: ${dataset.taxpayers.length} taxpayers (${years} taxpayer-years), ${dataset.catalog.length} rules. ${stats.analysed} workbooks analysed, ${stats.cached} from the cache.`);
