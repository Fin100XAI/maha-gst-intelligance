// Server plugin: reply documents (a taxpayer's or CA's letter) kept as received and read into text.
//   POST /__docs/upload?name=<file>   raw PDF / .docx / .txt body -> stored as store/docs/<sha256>.<ext> (never
//                                     overwritten) with its metadata; returns the document reference and its text
//                                     for the officer to review before the claims are tested
//   GET  /__docs/<sha256>             the original file, as a download
// Local only (like the case record) unless GST_ALLOW_REMOTE=1.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { extractText, DOC_TYPES } from './lib/docText.mjs';

const MAX_BYTES = 15 * 1024 * 1024;

export const cleanDocName = (name) => path.basename(String(name || 'reply')).replace(/[^\w .()&,-]+/g, '_').replace(/^[.\s]+/, '').slice(0, 150) || 'reply';

/** Store a document once (content-addressed) and read its text. */
export function storeDoc({ dir, name, buf, now = new Date() }) {
  const clean = cleanDocName(name);
  const ext = (clean.toLowerCase().match(/\.[a-z0-9]+$/) || [''])[0];
  if (!DOC_TYPES[ext]) return { ok: false, error: `Attach a PDF, Word (.docx) or text file; ${ext || 'this file'} is not accepted.` };
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${sha256}${ext}`);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, buf);
    fs.writeFileSync(path.join(dir, `${sha256}.json`), JSON.stringify({ name: clean, size: buf.length, type: DOC_TYPES[ext], ext, uploadedAt: now.toISOString() }, null, 1));
  }
  const { text, method, warnings } = extractText(buf, clean);
  return { ok: true, doc: { name: clean, sha256, size: buf.length, type: DOC_TYPES[ext] }, text, method, warnings };
}

export default function docStore() {
  return {
    name: 'doc-store',
    configureServer(server) {
      const dir = path.join(process.env.STORE_DIR ? path.resolve(process.env.STORE_DIR) : path.join(server.config.root, 'store'), 'docs');
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };

      server.middlewares.use('/__docs/upload', (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (!local(req)) return json(res, 403, { ok: false, error: 'Uploading is allowed from this computer only' });
        const chunks = [];
        let size = 0;
        req.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { json(res, 413, { ok: false, error: 'Documents are limited to 15 MB' }); req.destroy(); } else chunks.push(c); });
        req.on('end', () => {
          if (res.writableEnded) return;
          try {
            const r = storeDoc({ dir, name: new URL(req.url || '/', 'http://x').searchParams.get('name'), buf: Buffer.concat(chunks) });
            json(res, r.ok ? 200 : 400, r);
          } catch (e) { json(res, 500, { ok: false, error: e.message }); }
        });
      });
      server.middlewares.use('/__docs', (req, res, next) => {
        const sha = (req.url || '').replace(/^\//, '').split('?')[0];
        if (req.method !== 'GET' || !/^[0-9a-f]{64}$/.test(sha)) return next();
        if (!local(req)) return json(res, 403, { ok: false, error: 'Documents are available from this computer only' });
        const metaFile = path.join(dir, `${sha}.json`);
        if (!fs.existsSync(metaFile)) return json(res, 404, { ok: false, error: 'No such document' });
        const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        res.setHeader('content-type', meta.type);
        res.setHeader('content-disposition', `attachment; filename="${meta.name.replace(/"/g, '')}"`);
        fs.createReadStream(path.join(dir, `${sha}${meta.ext}`)).pipe(res);
      });
    },
  };
}
