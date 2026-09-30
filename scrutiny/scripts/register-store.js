// Server plugin: the registers the returns download does not contain (EIU signals, targets, demands/recoveries).
//   GET  /__registers                              { eiu, targets, demands } (each { meta, records } or null)
//   POST /__registers/upload?type=eiu&name=f.csv   raw CSV/XLSX body; saved only if every row is valid
// Local only (like other writes) unless GST_ALLOW_REMOTE=1.
import path from 'node:path';
import { saveRegister, loadRegisters } from './lib/registerStore.mjs';

const MAX_BYTES = 10 * 1024 * 1024;

export default function registerStore() {
  return {
    name: 'register-store',
    configureServer(server) {
      const dir = process.env.REGISTER_DIR ? path.resolve(process.env.REGISTER_DIR) : path.join(server.config.root, 'data', 'registers');
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };

      server.middlewares.use('/__registers/upload', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, errors: ['POST only'] });
        if (!local(req)) return json(res, 403, { ok: false, errors: ['Uploading is allowed from this computer only'] });
        const chunks = [];
        let size = 0;
        req.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { json(res, 413, { ok: false, errors: ['File is larger than 10 MB'] }); req.destroy(); } else chunks.push(c); });
        req.on('end', () => {
          if (res.writableEnded) return;
          const q = new URL(req.url || '/', 'http://x').searchParams;
          const result = saveRegister({ dir, type: q.get('type'), name: q.get('name'), buf: Buffer.concat(chunks), mode: q.get('mode') === 'replace' ? 'replace' : 'merge' });
          json(res, result.ok ? 200 : 400, result.ok ? { ok: true, meta: result.meta, replaced: result.replaced } : { ok: false, errors: result.errors.slice(0, 100), more: Math.max(0, result.errors.length - 100) });
        });
      });
      server.middlewares.use('/__registers', (req, res, next) => {
        if (req.method !== 'GET' || (req.url && req.url !== '/' && !req.url.startsWith('/?'))) return next();
        json(res, 200, loadRegisters(dir));
      });
    },
  };
}
