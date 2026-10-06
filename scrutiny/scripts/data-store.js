// Server plugin: keeps uploaded return workbooks so they survive reloads and restarts.
//   POST /__data/upload?name=<file.xlsx>   raw .xlsx body → saved in data/, then public/data.json is rebuilt
//                                          with scripts/build-data.mjs (the same engine run as `npm run build:data`).
//        …&defer=1                          saved only: a batch upload asks for one rebuild at the end instead
//   POST /__data/rebuild                   rebuild in the background (one job; a request during a run queues one more)
//   GET  /__data/progress                  { stage: idle|running|done|error, done, total, startedAt, finishedAt, error, detail }
//   GET  /__data/uploads                   the upload log (scripts/lib/uploadLog.mjs): recent batches, newest first
//   POST /__data/supplement?gstin=&fy=&sheet=&name=   { rows }  one template sheet converted by column mapping, added
//                                          to (or replacing that sheet of) the stored workbook for that GSTIN and year;
//                                          analysed with the next rebuild, like a deferred upload
//        …&batch=<id> on upload and rebuild records the files and the analysis against that batch
//                                          One workbook per GSTIN and financial year: an earlier upload for the same GSTIN
//                                          and year moves to data/superseded/; other years stay as history.
//   GET  /data.json                        served from public/data.json without caching, so rebuilds show at once.
// Local only (like report saving) unless GST_ALLOW_REMOTE=1.
// With accounts (AUTH_MODE=accounts): data.json and the upload log carry only the officer's jurisdictions
// (scripts/lib/scope.mjs); uploading needs the upload permission and a GSTIN within the officer's jurisdictions.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFile, spawn } from 'node:child_process';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../src/engine/parse.js';
import { storeWorkbook, saveCorrection, supplementWorkbook } from './lib/dataset.mjs';
import { TARGETS, MAX_ROWS } from '../src/engine/mapping.js';
import { gstinValid } from '../src/engine/gstin.js';
import { coalesce } from './lib/coalesce.mjs';
import { readLog, recordFile, recordAnalysis, cleanBatchId } from './lib/uploadLog.mjs';
import { accessOf, forbid } from './lib/request-access.mjs';
import { scopeDataset } from './lib/scope.mjs';

/** The upload log limited to the officer's taxpayers: other files, and batches left empty, are left out. */
export function scopeUploadLog(log, inScope) {
  const batches = (log.batches || []).map((b) => ({
    ...b,
    files: (b.files || []).filter((f) => f.gstin && inScope(f.gstin)),
    ...(b.analysis ? { analysis: { ...b.analysis, changes: (b.analysis.changes || []).filter((c) => inScope(c.gstin)) } } : {}),
  })).filter((b) => b.files.length);
  return { ...log, batches };
}

// What a failed build said: the line naming the error (not Node's closing "Node.js v20…" line), and the last lines.
const outputLines = (text) => String(text || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^Node\.js v\d/.test(l));
/**
 * Why a parsed workbook cannot be stored, or null. A file with no GSTR-3B periods is not a returns export at all, so
 * that is said first (asking for its GSTIN would mislead); a returns export without a GSTIN needs it entered.
 */
export function refusalOf(tp) {
  if (!tp.periods.length) return 'Not a returns export: no GSTR-3B periods found. Upload the "Get Download All Report" Excel export, or use "Data in another layout?"';
  if (!tp.gstin) return tp.intake?.errors?.[0] || 'No GSTIN in the banner: enter it in the check before upload';
  return null;
}
export const errorLine = (text) => { const lines = outputLines(text).filter((l) => !/^at\s/.test(l)); return lines.find((l) => /\b(\w*Error|FAILED)\b/.test(l)) || lines.pop() || ''; };
const errorDetail = (text) => outputLines(text).slice(-15).join('\n');

const MAX_BYTES = 40 * 1024 * 1024;

const cleanName = (name) => {
  const base = path.basename(String(name || 'upload.xlsx')).replace(/[^\w .()&,-]+/g, '_').replace(/^[.\s]+/, '').slice(0, 150);
  return /\.xlsx$/i.test(base) ? base : `${base || 'upload'}.xlsx`;
};

export default function dataStore() {
  return {
    name: 'data-store',
    configureServer(server) {
      const root = server.config.root;
      const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
      const outFile = process.env.OUT_FILE ? path.resolve(process.env.OUT_FILE) : path.join(root, 'public', 'data.json');
      const buildScript = path.join(root, 'scripts', 'build-data.mjs');
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); };

      // Uploads arriving together share rebuilds (scripts/lib/coalesce.mjs): a bulk upload costs a few rebuilds, not one each.
      const rebuild = coalesce(() => new Promise((resolve, reject) => {
        execFile(process.execPath, [buildScript], { env: { ...process.env, DATA_DIR: dataDir, OUT_FILE: outFile }, timeout: 300000, maxBuffer: 16 * 1024 * 1024 },
          (err, stdout, stderr) => (err ? reject(new Error(errorLine(stderr) || err.message)) : resolve(stdout)));
      }));

      // data.json runs to megabytes; compressed once per rebuild, it is about a tenth of that on the wire.
      let gz = null; // { mtimeMs, buf }
      // An officer limited to some jurisdictions gets their own cut, kept per jurisdiction set until the next rebuild.
      let scoped = { mtimeMs: -1, full: null, cuts: new Map() };
      const scopedBody = (scope) => {
        const { mtimeMs } = fs.statSync(outFile);
        if (scoped.mtimeMs !== mtimeMs) scoped = { mtimeMs, full: null, cuts: new Map() };
        const key = [...scope.jurisdictions].sort().join('|');
        if (!scoped.cuts.has(key)) {
          scoped.full ||= JSON.parse(fs.readFileSync(outFile, 'utf8'));
          if (scoped.cuts.size >= 20) scoped.cuts.delete(scoped.cuts.keys().next().value);
          const body = Buffer.from(JSON.stringify(scopeDataset(scoped.full, scope)));
          scoped.cuts.set(key, { body, gz: zlib.gzipSync(body) });
        }
        return scoped.cuts.get(key);
      };
      server.middlewares.use('/data.json', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        if (!fs.existsSync(outFile)) return next();
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        const acc = accessOf(req);
        if (!acc.all) {
          const cut = scopedBody(acc.scope);
          const zip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
          if (zip) { res.setHeader('content-encoding', 'gzip'); res.setHeader('vary', 'accept-encoding'); }
          return res.end(req.method === 'HEAD' ? undefined : zip ? cut.gz : cut.body);
        }
        if (/\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
          const { mtimeMs } = fs.statSync(outFile);
          if (!gz || gz.mtimeMs !== mtimeMs) gz = { mtimeMs, buf: zlib.gzipSync(fs.readFileSync(outFile)) };
          res.setHeader('content-encoding', 'gzip');
          res.setHeader('vary', 'accept-encoding');
          return res.end(req.method === 'HEAD' ? undefined : gz.buf);
        }
        fs.createReadStream(outFile).pipe(res);
      });

      server.middlewares.use('/__data/upload', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Uploading is allowed from this computer only' });
        const acc = accessOf(req);
        if (!acc.can('upload')) return forbid(res, 'Uploading returns needs the upload permission (supervisor or above)');
        const chunks = [];
        let size = 0;
        req.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { json(res, 413, { ok: false, error: 'Workbook is larger than 40 MB' }); req.destroy(); } else chunks.push(c); });
        req.on('end', async () => {
          if (res.writableEnded) return;
          const q = new URL(req.url || '/', 'http://x').searchParams;
          const batch = cleanBatchId(q.get('batch'));
          const name = cleanName(q.get('name'));
          const reject = (error) => { if (batch) recordFile(dataDir, batch, { name, error }); return json(res, 400, { ok: false, error }); };
          // the officer's correction from the staging step, for a banner without GSTIN or return period
          const correction = {};
          if (q.get('gstin')) { if (gstinValid(q.get('gstin').toUpperCase()) !== true) return reject('The GSTIN entered is not valid'); correction.gstin = q.get('gstin').toUpperCase(); }
          if (q.get('fy')) { if (!/^(20\d{2})-(20\d{2})$/.test(q.get('fy')) || Number(q.get('fy').slice(5)) !== Number(q.get('fy').slice(0, 4)) + 1) return reject('The financial year entered must look like 2025-2026'); correction.fy = q.get('fy'); }
          try {
            const buf = Buffer.concat(chunks);
            let tp;
            try { tp = parseWorkbook(XLSX.read(buf, { type: 'buffer' }), name, correction); } catch (e) { return reject(`Not a readable .xlsx workbook (${e.message})`); }
            const refused = refusalOf(tp);
            if (refused) return reject(refused);
            if (!acc.inScope(tp.gstin)) return reject(`${tp.gstin} is not in your jurisdiction (taxpayer master register): ask an officer covering it, or all jurisdictions`);

            const { file: target, replaced } = storeWorkbook({ dataDir, name, buf, tp });
            saveCorrection(dataDir, target, tp.intake.banner.gstin && tp.intake.banner.fy ? null : correction);
            if (batch) recordFile(dataDir, batch, { name, stored: target, gstin: tp.gstin, fy: tp.fy, taxpayer: tp.name, periods: tp.periods.length, replaced: replaced.length });
            if (q.get('defer') === '1') return json(res, 200, { ok: true, gstin: tp.gstin, fy: tp.fy, file: target, replaced: replaced.length, deferred: true });
            await rebuild();
            json(res, 200, { ok: true, gstin: tp.gstin, fy: tp.fy, file: target, replaced: replaced.length });
          } catch (e) {
            json(res, 500, { ok: false, error: e.message });
          }
        });
      });

      // Column mapping: one converted sheet into a stored workbook. Saved only; the browser then asks for the rebuild.
      server.middlewares.use('/__data/supplement', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Uploading is allowed from this computer only' });
        const acc = accessOf(req);
        if (!acc.can('upload')) return forbid(res, 'Adding returns data needs the upload permission (supervisor or above)');
        const q = new URL(req.url || '/', 'http://x').searchParams;
        const gstin = String(q.get('gstin') || '').toUpperCase();
        const fy = String(q.get('fy') || '');
        const sheet = String(q.get('sheet') || '');
        const batch = cleanBatchId(q.get('batch'));
        const name = String(q.get('name') || 'mapped file').replace(/[^\w .()&,-]+/g, '_').slice(0, 120);
        if (gstinValid(gstin) !== true) return json(res, 400, { ok: false, error: 'Choose a valid GSTIN' });
        if (!/^(20\d{2})-(20\d{2})$/.test(fy) || Number(fy.slice(5)) !== Number(fy.slice(0, 4)) + 1) return json(res, 400, { ok: false, error: 'The financial year must look like 2025-2026' });
        if (!TARGETS[sheet]) return json(res, 400, { ok: false, error: `sheet must be one of ${Object.keys(TARGETS).join(', ')}` });
        if (!acc.inScope(gstin)) return forbid(res, `${gstin} is not in your jurisdiction`);
        const chunks = [];
        let size = 0;
        req.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { json(res, 413, { ok: false, error: 'Converted data is larger than 40 MB' }); req.destroy(); } else chunks.push(c); });
        req.on('end', () => {
          if (res.writableEnded) return undefined;
          try {
            const { rows } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            const cellOk = (c) => c === null || typeof c === 'number' || (typeof c === 'string' && c.length <= 500);
            if (!Array.isArray(rows) || !rows.length || rows.length > MAX_ROWS + 10 || !rows.every((r) => Array.isArray(r) && r.length <= 60 && r.every(cellOk))) return json(res, 400, { ok: false, error: 'rows must be the converted sheet: a list of rows of plain values' });
            const r = supplementWorkbook({ dataDir, gstin, fyStart: Number(fy.slice(0, 4)), sheet, aoa: rows });
            if (batch) recordFile(dataDir, batch, { name: `${name} → ${sheet}`, stored: r.file, gstin, fy, taxpayer: r.taxpayer, periods: r.periods, replaced: r.superseded.length });
            return json(res, 200, { ok: true, ...r, deferred: true });
          } catch (e) {
            if (batch) recordFile(dataDir, batch, { name: `${name} → ${sheet}`, error: e.message });
            return json(res, e.status || 500, { ok: false, error: e.message });
          }
        });
        return undefined;
      });

      // Background rebuild after a batch upload: answers at once, so no proxy timeout can cut it off, and reports its
      // progress (one step per workbook, from the build's own output) for the screen to show.
      let job = null; // { id, stage, done, total, startedAt, finishedAt, error, detail, again, batches }
      let waiting = new Set(); // upload batches whose analysis is the next run
      // Each taxpayer's result in the dashboard data, to say what an upload changed: score, band, failed checks.
      const snapshot = () => {
        try {
          const d = JSON.parse(fs.readFileSync(outFile, 'utf8'));
          return Object.fromEntries((d.taxpayers || []).map((t) => [t.gstin, { fy: t.fy, score: t.score, band: t.band, fails: t.results.filter((r) => r.status === 'Fail').map((r) => r.id) }]));
        } catch { return {}; }
      };
      const changesFor = (batchId, before, after) => {
        const batch = readLog(dataDir).batches.find((b) => b.id === batchId);
        const gstins = [...new Set((batch?.files || []).filter((f) => f.ok).map((f) => f.gstin))];
        return gstins.map((g) => ({ gstin: g, before: before[g] || null, after: after[g] || null }));
      };
      const startJob = () => {
        job = { id: Date.now(), stage: 'running', done: 0, total: 0, startedAt: new Date().toISOString(), finishedAt: null, error: null, detail: null, again: false, batches: [...waiting] };
        waiting = new Set();
        const current = job;
        const before = current.batches.length ? snapshot() : {};
        recordAnalysis(dataDir, current.batches, { stage: 'running', startedAt: current.startedAt, finishedAt: null, error: null, detail: null });
        const child = spawn(process.execPath, [buildScript], { env: { ...process.env, DATA_DIR: dataDir, OUT_FILE: outFile, PROGRESS: '1' } });
        const kill = setTimeout(() => child.kill(), 15 * 60000);
        let out = '', err = '';
        child.stdout.on('data', (d) => {
          out += d;
          for (let i = out.indexOf('\n'); i >= 0; i = out.indexOf('\n')) {
            const m = out.slice(0, i).match(/^progress (\d+)\/(\d+)/);
            out = out.slice(i + 1);
            if (m) { current.done = Number(m[1]); current.total = Number(m[2]); }
          }
        });
        child.stderr.on('data', (d) => { err += d; });
        child.on('close', (code) => {
          clearTimeout(kill);
          current.finishedAt = new Date().toISOString();
          // workbooks the analysis could not read ("FAILED <file>: <reason>"): the rest is analysed and saved regardless
          current.failed = outputLines(err).filter((l) => l.startsWith('FAILED ')).map((l) => { const m = l.slice(7).match(/^(.*?\.xlsx): (.*)$/i); return m ? { file: m[1], error: m[2] } : { file: '', error: l.slice(7) }; });
          if (code === 0) current.stage = 'done';
          else Object.assign(current, { stage: 'error', error: errorLine(err) || `stopped (code ${code})`, detail: errorDetail(err) });
          const after = current.stage === 'done' && current.batches.length ? snapshot() : null;
          for (const id of current.batches) {
            recordAnalysis(dataDir, [id], { stage: current.stage, finishedAt: current.finishedAt, error: current.error, detail: current.detail, failed: current.failed, ...(after ? { changes: changesFor(id, before, after) } : {}) });
          }
          if (current.again) startJob(); // uploads that arrived during this run
        });
      };
      server.middlewares.use('/__data/progress', (req, res) => json(res, 200, job ? { ...job, again: undefined } : { stage: 'idle' }));
      server.middlewares.use('/__data/uploads', (req, res) => {
        res.setHeader('cache-control', 'no-store');
        const acc = accessOf(req);
        const log = readLog(dataDir);
        json(res, 200, { ...(acc.all ? log : scopeUploadLog(log, acc.inScope)), job: job ? { ...job, again: undefined, ...(acc.all ? {} : { failed: undefined, detail: undefined }) } : null });
      });
      server.middlewares.use('/__data/rebuild', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Uploading is allowed from this computer only' });
        if (!accessOf(req).can('upload')) return forbid(res, 'Re-running the analysis needs the upload permission');
        const batch = cleanBatchId(new URL(req.url || '/', 'http://x').searchParams.get('batch'));
        if (batch) waiting.add(batch);
        if (job && !job.finishedAt) { job.again = true; return json(res, 202, { ok: true, queued: true, job: { ...job, again: undefined } }); }
        startJob();
        json(res, 202, { ok: true, job: { ...job, again: undefined } });
      });
    },
  };
}
