// Builds the dashboard dataset from a folder of return workbooks. Shared by the build script, the upload store and
// the tests, so there is one way a folder becomes data.json.
//   - Every workbook is analysed with the same engine.
//   - Workbooks are grouped by GSTIN; the latest financial year drives the scrutiny screens (taxpayers[]),
//     and every year is kept as a baseline (baselines[gstin], oldest first) for year-on-year intelligence.
//   - Every GSTIN-year also contributes its trade (per-counterparty values, filing months, flow timing) to one
//     buyer-seller graph (network), so counterparty intelligence never needs the workbooks in the browser.
//   - Two workbooks for the same GSTIN and year: the most recently modified wins, the other is reported.
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { parseWorkbook, parseRuleMatrix, parseMatrixExtras } from '../../src/engine/parse.js';
import { analyze, portfolio } from '../../src/engine/analyze.js';
import { baselineOf } from '../../src/engine/baseline.js';
import { tradeOf, graphOf } from '../../src/engine/network.js';
import { ewbFor } from '../synth/ewb.mjs';

// Lookarounds rather than \b: file names join parts with "_", which counts as a word character.
export const GSTIN_RE = /(?<![0-9A-Z])\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z](?![0-9A-Z])/;
const FY_RE = /(?<!\d)(20\d{2})\s*-\s*(?:20)?(\d{2})(?!\d)/;

const isWorkbook = (f) => /\.xlsx$/i.test(f) && !f.startsWith('~$');
export const isRuleMatrix = (f) => /rule_matrix/i.test(f);

/**
 * GSTIN and financial-year start of a workbook, from its file name when it carries them, otherwise from the
 * banner rows ("Company GSTN", "Return Period"). Reads only the first rows of each sheet.
 * @returns {{ gstin: string|null, fyStart: number|null }}
 */
export function identityOfFile(file) {
  const base = path.basename(file).toUpperCase();
  let gstin = base.match(GSTIN_RE)?.[0] ?? null;
  let fyStart = base.match(FY_RE) ? Number(base.match(FY_RE)[1]) : null;
  if (gstin && fyStart) return { gstin, fyStart };
  try {
    const wb = XLSX.read(fs.readFileSync(file), { type: 'buffer', sheetRows: 12 });
    for (const name of wb.SheetNames) {
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]).toUpperCase();
      gstin ||= csv.match(GSTIN_RE)?.[0] ?? null;
      const fy = csv.match(/RETURN PERIOD[^\n]*?(20\d{2})\s*-\s*(20\d{2})/);
      if (!fyStart && fy) fyStart = Number(fy[1]);
      if (gstin && fyStart) break;
    }
  } catch { /* unreadable workbook: identity unknown */ }
  return { gstin, fyStart };
}

/**
 * @param {{ dataDir: string, now?: Date, log?: (msg: string) => void, warn?: (msg: string) => void }} opts
 * @returns {{ dataset: object, errors: string[] }}
 */
export function buildDataset({ dataDir, now = new Date(), log = () => {}, warn = () => {} }) {
  const files = fs.readdirSync(dataDir).filter(isWorkbook);
  const matrixFile = files.find(isRuleMatrix);
  const matrixWb = matrixFile ? XLSX.read(fs.readFileSync(path.join(dataDir, matrixFile)), { type: 'buffer' }) : null;
  const catalog = matrixWb ? parseRuleMatrix(matrixWb) : [];
  const matrix = matrixWb ? parseMatrixExtras(matrixWb) : { industries: [], applicability: {}, dataSources: [] };
  const severity = Object.fromEntries(catalog.map((r) => [r.id, r.severity]));

  const errors = [];
  const byGstin = new Map();
  for (const f of files.filter((x) => x !== matrixFile)) {
    const file = path.join(dataDir, f);
    const t0 = Date.now();
    try {
      const tp = parseWorkbook(XLSX.read(fs.readFileSync(file), { type: 'buffer' }), f);
      if (!tp.gstin) { warn(`skip ${f}: no GSTIN banner`); continue; }
      // E-way bills: the stored copy (fetched or uploaded), else a simulated fetch (scripts/synth/ewb.mjs)
      tp.ewb = ewbFor({ dataDir, root: path.resolve(dataDir, '..'), tp });
      const a = analyze(tp, { severity });
      const entry = { file: f, mtime: fs.statSync(file).mtimeMs, fyStart: tp.fyStart, a, trade: tradeOf(tp) };
      const years = byGstin.get(tp.gstin) || new Map();
      const dup = years.get(tp.fyStart);
      if (dup) {
        const [keep, drop] = entry.mtime >= dup.mtime ? [entry, dup] : [dup, entry];
        warn(`${tp.gstin} FY ${tp.fyStart}: two workbooks; using ${keep.file}, ignoring ${drop.file}`);
        years.set(tp.fyStart, keep);
      } else years.set(tp.fyStart, entry);
      byGstin.set(tp.gstin, years);
      log(`${a.name.padEnd(40)} FY ${a.fy}  score ${String(a.score).padStart(3)} ${a.band.padEnd(8)} fails ${a.results.filter((r) => r.status === 'Fail').length}  (${Date.now() - t0} ms)`);
    } catch (e) {
      errors.push(`${f}: ${e.message}`);
    }
  }

  const taxpayers = [];
  const baselines = {};
  for (const [gstin, years] of byGstin) {
    const ordered = [...years.values()].sort((x, y) => x.fyStart - y.fyStart);
    taxpayers.push(ordered[ordered.length - 1].a);
    baselines[gstin] = ordered.map((e) => baselineOf(e.a));
  }
  const network = graphOf([...byGstin.values()].flatMap((years) => [...years.values()].map((e) => e.trade)));
  taxpayers.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return { dataset: { generatedAt: now.toISOString(), catalog, matrix, taxpayers, baselines, network, portfolio: portfolio(taxpayers) }, errors };
}

/**
 * Save an uploaded workbook into dataDir, keeping one workbook per GSTIN and financial year. An earlier workbook for
 * the same GSTIN and year moves to dataDir/superseded/ (never deleted); other years of the same GSTIN are kept as
 * history. When the new workbook's banner has no company name, it takes the earlier file's name, which is where the
 * known name comes from.
 * @param {{ dataDir: string, name: string, buf: Buffer, tp: { gstin: string, fyStart: number, nameFromBanner: boolean }, now?: Date }} opts
 * @returns {{ file: string, replaced: string[] }}
 */
export function storeWorkbook({ dataDir, name, buf, tp, now = new Date() }) {
  fs.mkdirSync(dataDir, { recursive: true });
  const same = fs.readdirSync(dataDir).filter((f) => isWorkbook(f) && !isRuleMatrix(f)).filter((f) => {
    const id = identityOfFile(path.join(dataDir, f));
    return id.gstin === tp.gstin && id.fyStart === tp.fyStart;
  });
  let file = name;
  if (same.length) {
    const aside = path.join(dataDir, 'superseded');
    fs.mkdirSync(aside, { recursive: true });
    const stamp = now.toISOString().replace(/[:.]/g, '-');
    if (!tp.nameFromBanner) file = same[0];
    for (const f of same) fs.renameSync(path.join(dataDir, f), path.join(aside, `${stamp}_${f}`));
  }
  fs.writeFileSync(path.join(dataDir, file), buf);
  return { file, replaced: same };
}
