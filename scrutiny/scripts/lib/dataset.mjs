// Builds the dashboard dataset from a folder of return workbooks. Shared by the build script, the upload store and
// the tests, so there is one way a folder becomes data.json.
//   - Every workbook is analysed with the same engine.
//   - Workbooks are grouped by GSTIN; the latest financial year drives the scrutiny screens (taxpayers[]),
//     and every year is kept as a baseline (baselines[gstin], oldest first) for year-on-year intelligence.
//   - Every GSTIN-year also contributes its trade (per-counterparty values, filing months, flow timing) to one
//     buyer-seller graph (network), so counterparty intelligence never needs the workbooks in the browser.
//   - Two workbooks for the same GSTIN and year: the most recently modified wins, the other is reported.
//   - Each workbook's analysis is cached in <dataDir>/.cache, keyed by the file's contents, the engine's code and
//     inputs (rule severities, e-way bill simulation plan) and the stored e-way bills for that GSTIN-year, so a rebuild
//     after an upload only analyses what changed (seconds instead of minutes). DATA_CACHE=0 turns it off.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { parseWorkbook, parseRuleMatrix, parseMatrixExtras } from '../../src/engine/parse.js';
import { analyze, portfolio } from '../../src/engine/analyze.js';
import { baselineOf } from '../../src/engine/baseline.js';
import { tradeOf, graphOf } from '../../src/engine/network.js';
import { ewbFor, ewbFile, loadPlan } from '../synth/ewb.mjs';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const sha = (x) => crypto.createHash('sha256').update(x).digest('hex');
// Everything besides the workbook that shapes its analysis: the engine and the code around it.
const ENGINE_FILES = () => [
  ...fs.readdirSync(path.join(APP_ROOT, 'src', 'engine')).filter((f) => /\.js$/.test(f)).sort().map((f) => path.join(APP_ROOT, 'src', 'engine', f)),
  path.join(APP_ROOT, 'scripts', 'synth', 'ewb.mjs'), fileURLToPath(import.meta.url),
];
const statOf = (file) => { try { const st = fs.statSync(file); return `${st.size}:${Math.round(st.mtimeMs)}`; } catch { return 'none'; } };

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
 * @param {{ dataDir: string, now?: Date, log?: (msg: string) => void, warn?: (msg: string) => void,
 *   progress?: (done: number, total: number, file: string) => void, cache?: boolean }} opts
 * @returns {{ dataset: object, errors: string[], stats: { analysed: number, cached: number } }}
 */
export function buildDataset({ dataDir, now = new Date(), log = () => {}, warn = () => {}, progress = () => {}, cache = process.env.DATA_CACHE !== '0' }) {
  const files = fs.readdirSync(dataDir).filter(isWorkbook);
  const matrixFile = files.find(isRuleMatrix);
  const matrixWb = matrixFile ? XLSX.read(fs.readFileSync(path.join(dataDir, matrixFile)), { type: 'buffer' }) : null;
  const catalog = matrixWb ? parseRuleMatrix(matrixWb) : [];
  const matrix = matrixWb ? parseMatrixExtras(matrixWb) : { industries: [], applicability: {}, dataSources: [] };
  const severity = Object.fromEntries(catalog.map((r) => [r.id, r.severity]));

  const errors = [];
  const byGstin = new Map();
  const root = path.resolve(dataDir, '..');
  const cacheDir = path.join(dataDir, '.cache');
  const simulate = process.env.EWB_SIMULATE !== '0';
  const engine = cache ? sha(JSON.stringify([ENGINE_FILES().map((f) => sha(fs.readFileSync(f))), severity, simulate ? loadPlan(root).hash : 'no-sim'])) : null;
  // The cache only saves time: if it cannot be written (e.g. folder permissions), the build carries on without it.
  const noCache = (e) => { if (cache) warn(`analysis cache off: ${e.message}`); cache = false; };
  if (cache) { try { fs.mkdirSync(cacheDir, { recursive: true }); fs.accessSync(cacheDir, fs.constants.W_OK); } catch (e) { noCache(e); } }
  const used = new Set();
  const stats = { analysed: 0, cached: 0 };
  const list = files.filter((x) => x !== matrixFile);
  list.forEach((f, i) => {
    const file = path.join(dataDir, f);
    const t0 = Date.now();
    try {
      const buf = fs.readFileSync(file);
      const cacheFile = cache ? path.join(cacheDir, `${sha(buf)}.json`) : null;
      let hit = null;
      if (cache && fs.existsSync(cacheFile)) {
        try {
          const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          if (c.engine === engine && c.ewb === statOf(ewbFile(dataDir, c.gstin, c.fyStart)) && c.file === f) hit = c;
        } catch { /* unreadable cache entry: analyse again */ }
      }
      let gstin, fyStart, a, trade;
      if (hit) ({ gstin, fyStart, a, trade } = hit);
      else {
        const tp = parseWorkbook(XLSX.read(buf, { type: 'buffer' }), f);
        if (!tp.gstin) { warn(`skip ${f}: no GSTIN banner`); return; }
        // E-way bills: the stored copy (fetched or uploaded), else a simulated fetch (scripts/synth/ewb.mjs)
        tp.ewb = ewbFor({ dataDir, root, tp });
        ({ gstin, fyStart } = tp);
        a = analyze(tp, { severity });
        trade = tradeOf(tp);
        if (cache) { try { fs.writeFileSync(cacheFile, JSON.stringify({ engine, file: f, gstin, fyStart, ewb: statOf(ewbFile(dataDir, gstin, fyStart)), a, trade })); } catch (e) { noCache(e); } }
      }
      stats[hit ? 'cached' : 'analysed']++;
      if (cache) used.add(path.basename(cacheFile));
      const entry = { file: f, mtime: fs.statSync(file).mtimeMs, fyStart, a, trade };
      const tp = { gstin, fyStart };
      const years = byGstin.get(tp.gstin) || new Map();
      const dup = years.get(tp.fyStart);
      if (dup) {
        const [keep, drop] = entry.mtime >= dup.mtime ? [entry, dup] : [dup, entry];
        warn(`${tp.gstin} FY ${tp.fyStart}: two workbooks; using ${keep.file}, ignoring ${drop.file}`);
        years.set(tp.fyStart, keep);
      } else years.set(tp.fyStart, entry);
      byGstin.set(tp.gstin, years);
      log(`${a.name.padEnd(40)} FY ${a.fy}  score ${String(a.score).padStart(3)} ${a.band.padEnd(8)} fails ${a.results.filter((r) => r.status === 'Fail').length}  (${hit ? 'cached' : `${Date.now() - t0} ms`})`);
    } catch (e) {
      errors.push(`${f}: ${e.message}`);
    } finally {
      progress(i + 1, list.length, f);
    }
  });
  if (cache) { try { for (const f of fs.readdirSync(cacheDir)) if (!used.has(f)) fs.rmSync(path.join(cacheDir, f), { force: true }); } catch (e) { warn(`analysis cache not tidied: ${e.message}`); } } // workbooks removed or replaced

  const taxpayers = [];
  const baselines = {};
  for (const [gstin, years] of byGstin) {
    const ordered = [...years.values()].sort((x, y) => x.fyStart - y.fyStart);
    taxpayers.push(ordered[ordered.length - 1].a);
    baselines[gstin] = ordered.map((e) => baselineOf(e.a));
  }
  const network = graphOf([...byGstin.values()].flatMap((years) => [...years.values()].map((e) => e.trade)));
  taxpayers.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return { dataset: { generatedAt: now.toISOString(), catalog, matrix, taxpayers, baselines, network, portfolio: portfolio(taxpayers) }, errors, stats };
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
