// E-way bill connection (dev-server plugin, also mounted by server.mjs):
//   GET  /__ewb/status                       which source is in use, whether NIC credentials are set, what is stored
//   POST /__ewb/fetch[?gstin=]               start a sync: fetch e-way bills again (simulated: regenerate), rebuild data.json
//   GET  /__ewb/progress                     the running (or last) sync: stage, returns processed of total
//   POST /__ewb/upload?gstin=&name=<.xlsx>   store the portal's e-way bill export for a GSTIN and rebuild
//
// The NIC e-way bill API is reached through a GST Suvidha Provider (GSP) with API client credentials, the taxpayer's
// e-way bill username and password, and a whitelisted server IP. None are available to this build, so fetches use
// the simulated e-way bill system (scripts/synth/ewb.mjs); setting the EWB_* variables below switches the status to
// "NIC configured", and the fetch then says plainly that the live client is not built yet rather than pretending.
import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import * as XLSX from 'xlsx';
import { parseEwbRows } from '../src/engine/ewb.js';
import { writeEwb, ewbFile } from './synth/ewb.mjs';
import { coalesce } from './lib/coalesce.mjs';

const MAX_BYTES = 40 * 1024 * 1024;
export const NIC_ENV = ['EWB_GSP_BASE_URL', 'EWB_GSP_CLIENT_ID', 'EWB_GSP_CLIENT_SECRET', 'EWB_USERNAME', 'EWB_PASSWORD'];
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

// The export's dates arrive as Excel serials, DD-MM-YYYY or ISO; stored as ISO (date, or date and time for EWB Date).
const isoOf = (v) => {
  if (typeof v === 'number') { const d = new Date(Math.round((v - 25569) * 86400000)); return d.toISOString().slice(0, 16).replace(/T00:00$/, ''); }
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}${m[4] ? `T${m[4].padStart(2, '0')}:${m[5]}` : ''}`;
  return s.replace(' ', 'T').slice(0, 16);
};
const fyOf = (iso) => { const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7)); return m >= 4 ? y : y - 1; };

export default function ewbStore() {
  return {
    name: 'ewb-store',
    configureServer(server) {
      const root = server.config.root;
      const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, 'data');
      const outFile = process.env.OUT_FILE ? path.resolve(process.env.OUT_FILE) : path.join(root, 'public', 'data.json');
      const dir = path.join(dataDir, 'ewb');
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)); };
      const rebuild = coalesce(() => new Promise((resolve, reject) => {
        execFile(process.execPath, [path.join(root, 'scripts', 'build-data.mjs')], { env: { ...process.env, DATA_DIR: dataDir, OUT_FILE: outFile }, timeout: 600000, maxBuffer: 16 * 1024 * 1024 },
          (err, stdout, stderr) => (err ? reject(new Error((stderr || err.message).trim().split('\n').pop())) : resolve(stdout)));
      }));
      // Only the head of each file is read: the meta block comes first.
      const stored = () => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : []).map((f) => {
        const fd = fs.openSync(path.join(dir, f), 'r'); const buf = Buffer.alloc(600); fs.readSync(fd, buf, 0, 600, 0); fs.closeSync(fd);
        const head = buf.toString('utf8');
        return { file: f, source: head.match(/"source":"(\w+)"/)?.[1] || 'unknown', fetchedAt: head.match(/"fetchedAt":"([^"]+)"/)?.[1] || null };
      });
      const nic = () => ({ configured: NIC_ENV.every((k) => process.env[k]), missing: NIC_ENV.filter((k) => !process.env[k]) });

      server.middlewares.use('/__ewb/status', (req, res) => {
        const files = stored();
        const count = (s) => files.filter((f) => f.source === s).length;
        json(res, 200, { mode: nic().configured ? 'nic' : 'simulated', nic: nic(), files: files.length, simulated: count('simulated'), uploaded: count('upload'),
          lastFetch: files.map((f) => f.fetchedAt).filter(Boolean).sort().pop() || null });
      });

      // A sync runs in the background; /__ewb/progress reports how far it has got (one step per return processed,
      // read from the rebuild's own log), so the screen shows real progress rather than a spinner.
      let job = null; // { id, gstin, stage: request|fetch|finalise|done|error, done, total, refreshed, startedAt, finishedAt, error }
      const countReturns = () => fs.readdirSync(dataDir).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$') && !/rule_matrix/i.test(f)).length;
      server.middlewares.use('/__ewb/progress', (req, res) => json(res, 200, job || { stage: 'idle' }));

      server.middlewares.use('/__ewb/fetch', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Syncing is allowed from this computer only' });
        if (nic().configured) return json(res, 501, { ok: false, error: 'NIC credentials are set, but the live NIC e-way bill client is not part of this build yet. Unset the EWB_* variables to use the simulated system.' });
        const gstin = new URL(req.url || '/', 'http://x').searchParams.get('gstin');
        if (gstin && !GSTIN_RE.test(gstin)) return json(res, 400, { ok: false, error: 'Not a GSTIN' });
        if (job && !job.finishedAt) return json(res, 409, { ok: false, error: 'A sync is already running', job });
        job = { id: Date.now(), gstin: gstin || null, stage: 'request', done: 0, total: countReturns(), refreshed: 0, startedAt: new Date().toISOString(), finishedAt: null, error: null };
        const current = job;
        try {
          // Simulated source: drop the stored simulated copies (uploaded exports are kept); the rebuild fetches them again.
          const drop = stored().filter((f) => f.source === 'simulated' && (!gstin || f.file.startsWith(`${gstin}_`)));
          for (const f of drop) fs.rmSync(path.join(dir, f.file));
          current.refreshed = drop.length;
        } catch (e) { Object.assign(current, { stage: 'error', error: e.message, finishedAt: new Date().toISOString() }); return json(res, 500, { ok: false, error: e.message }); }
        current.stage = 'fetch';
        const child = spawn(process.execPath, [path.join(root, 'scripts', 'build-data.mjs')], { env: { ...process.env, DATA_DIR: dataDir, OUT_FILE: outFile } });
        const kill = setTimeout(() => child.kill(), 15 * 60000);
        let buf = '', err = '';
        child.stdout.on('data', (d) => {
          buf += d;
          for (let i = buf.indexOf('\n'); i >= 0; i = buf.indexOf('\n')) {
            const line = buf.slice(0, i); buf = buf.slice(i + 1);
            if (/ FY \d{4}-\d{4}\s+score/.test(line)) current.done = Math.min(current.total, current.done + 1);
          }
          if (current.done >= current.total) current.stage = 'finalise';
        });
        child.stderr.on('data', (d) => { err += d; });
        child.on('close', (code) => {
          clearTimeout(kill);
          current.finishedAt = new Date().toISOString();
          if (code === 0) current.stage = 'done';
          else Object.assign(current, { stage: 'error', error: err.trim().split('\n').pop() || `stopped (code ${code})` });
        });
        json(res, 202, { ok: true, job: current });
      });

      server.middlewares.use('/__ewb/upload', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Uploading is allowed from this computer only' });
        const q = new URL(req.url || '/', 'http://x').searchParams;
        const gstin = String(q.get('gstin') || '').toUpperCase();
        if (!GSTIN_RE.test(gstin)) return json(res, 400, { ok: false, error: 'Choose the GSTIN the e-way bill export belongs to' });
        const chunks = []; let size = 0;
        req.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { json(res, 413, { ok: false, error: 'File is larger than 40 MB' }); req.destroy(); } else chunks.push(c); });
        req.on('end', async () => {
          if (res.writableEnded) return;
          try {
            let rows;
            try { const wb = XLSX.read(Buffer.concat(chunks), { type: 'buffer' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); } catch (e) { return json(res, 400, { ok: false, error: `Not a readable .xlsx file (${e.message})` }); }
            const { bills, errors } = parseEwbRows(rows);
            if (errors.length) return json(res, 400, { ok: false, error: errors.slice(0, 5).join('; ') });
            if (!bills.length) return json(res, 400, { ok: false, error: 'No e-way bills found. Upload the e-way bill export from the portal (with EWB No, Document No and From GSTIN columns).' });
            const mine = bills.map((b) => ({ ...b, docDate: isoOf(b.docDate), at: isoOf(b.at), validUpto: isoOf(b.validUpto) })).filter((b) => b.from === gstin || b.to === gstin);
            if (!mine.length) return json(res, 400, { ok: false, error: `No e-way bill in the file is from or to ${gstin}` });
            const byFy = new Map();
            for (const b of mine) { const fy = fyOf(b.docDate); (byFy.get(fy) || byFy.set(fy, []).get(fy)).push(b); }
            const name = path.basename(String(q.get('name') || 'ewb.xlsx')).slice(0, 150);
            for (const [fy, list] of byFy) {
              writeEwb(ewbFile(dataDir, gstin, fy), { meta: { gstin, fy, source: 'upload', file: name, fetchedAt: new Date().toISOString() }, outward: list.filter((b) => b.from === gstin), inward: list.filter((b) => b.to === gstin) });
            }
            await rebuild();
            json(res, 200, { ok: true, gstin, bills: mine.length, years: [...byFy.keys()].sort() });
          } catch (e) { json(res, 500, { ok: false, error: e.message }); }
        });
      });
    },
  };
}
