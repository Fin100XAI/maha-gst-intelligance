// Server plugin: keeps uploaded return workbooks so they survive reloads and restarts.
//   POST /__data/upload?name=<file.xlsx>   raw .xlsx body → saved in data/, then public/data.json is rebuilt
//                                          with scripts/build-data.mjs (the same engine run as `npm run build:data`).
//                                          One workbook per GSTIN and financial year: an earlier upload for the same GSTIN
//                                          and year moves to data/superseded/; other years stay as history.
//   GET  /data.json                        served from public/data.json without caching, so rebuilds show at once.
// Local only (like report saving) unless GST_ALLOW_REMOTE=1.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFile } from 'node:child_process';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../src/engine/parse.js';
import { storeWorkbook } from './lib/dataset.mjs';
import { coalesce } from './lib/coalesce.mjs';

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
          (err, stdout, stderr) => (err ? reject(new Error((stderr || err.message).trim().split('\n').pop())) : resolve(stdout)));
      }));

      // data.json runs to megabytes; compressed once per rebuild, it is about a tenth of that on the wire.
      let gz = null; // { mtimeMs, buf }
      server.middlewares.use('/data.json', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        if (!fs.existsSync(outFile)) return next();
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
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
        const chunks = [];
        let size = 0;
        req.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { json(res, 413, { ok: false, error: 'Workbook is larger than 40 MB' }); req.destroy(); } else chunks.push(c); });
        req.on('end', async () => {
          if (res.writableEnded) return;
          try {
            const buf = Buffer.concat(chunks);
            const name = cleanName(new URL(req.url || '/', 'http://x').searchParams.get('name'));
            let tp;
            try { tp = parseWorkbook(XLSX.read(buf, { type: 'buffer' }), name); } catch (e) { return json(res, 400, { ok: false, error: `Not a readable .xlsx workbook (${e.message})` }); }
            if (!tp.gstin || !tp.periods.length) return json(res, 400, { ok: false, error: 'Not a returns export: no GSTIN banner or GSTR-3B periods found' });

            const { file: target, replaced } = storeWorkbook({ dataDir, name, buf, tp });
            await rebuild();
            json(res, 200, { ok: true, gstin: tp.gstin, fy: tp.fy, file: target, replaced: replaced.length });
          } catch (e) {
            json(res, 500, { ok: false, error: e.message });
          }
        });
      });
    },
  };
}
