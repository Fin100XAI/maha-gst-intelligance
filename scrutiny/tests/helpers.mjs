// Shared test helpers: load a workbook from disk and run it through the real parser and engine.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { parseWorkbook, parseRuleMatrix } from '../src/engine/parse.js';
import { analyze } from '../src/engine/analyze.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEST_DATA = path.join(ROOT, 'test-data');

let catalogCache = null;
export function catalog() {
  catalogCache ||= parseRuleMatrix(XLSX.read(fs.readFileSync(path.join(ROOT, 'data', 'GST_Scrutiny_Rule_Matrix.xlsx')), { type: 'buffer' }));
  return catalogCache;
}
export const severity = () => Object.fromEntries(catalog().map((r) => [r.id, r.severity]));

export function readWorkbook(file) {
  return XLSX.read(fs.readFileSync(file), { type: 'buffer' });
}

export function analyseFile(file) {
  const tp = parseWorkbook(readWorkbook(file), path.basename(file));
  return analyze(tp, { severity: severity() });
}

// The first test-data workbook whose file name contains `needle`.
export function testWorkbook(needle) {
  const f = fs.readdirSync(TEST_DATA).find((x) => x.endsWith('.xlsx') && x.includes(needle));
  if (!f) throw new Error(`no test workbook matching ${needle}`);
  return path.join(TEST_DATA, f);
}

export const statusOf = (a, id) => a.results.find((r) => r.id === id)?.status;
export const issues = (a) => a.results.filter((r) => r.status === 'Fail' || r.status === 'Review').map((r) => `${r.id}:${r.status}`).sort();
export const raised = (a) => a.fraud.filter((f) => f.flagged).map((f) => (f.prompt ? `${f.key}(prompt)` : f.key)).sort();
