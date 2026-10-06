// Server plugin: reply documents (a taxpayer's or CA's letter) kept as received and read into text.
//   POST /__docs/upload?name=<file>   raw PDF / .docx / .txt body -> stored as store/docs/<sha256>.<ext> (never
//                                     overwritten) with its metadata; returns the document reference and its text
//                                     for the officer to review before the claims are tested
//   POST /__docs/<sha256>/ocr         read a scanned PDF or a photo with OCR on this server (scripts/lib/ocr.mjs);
//                                     the result is kept beside the document, so it is read once
//   GET  /__docs/<sha256>             the original file, as a download
// Local only (like the case record) unless GST_ALLOW_REMOTE=1.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { extractText, DOC_TYPES } from './lib/docText.mjs';
import { scannedImages, ocrImages, ocrStatus, LOW_CONFIDENCE } from './lib/ocr.mjs';
import { accessOf, forbid } from './lib/request-access.mjs';
// With accounts: storing a document needs case work; a document is fetched by its SHA-256, which only the cases
// that recorded it carry, and only by a signed-in officer.

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
  // No text, but page images (a scan) or a photo: say so, so the browser can ask for OCR.
  const scan = text ? null : scannedImages(buf, clean);
  const ocr = scan && (scan.images.length || scan.skipped.length) ? { pages: scan.images.length, skipped: scan.skipped } : null;
  return { ok: true, doc: { name: clean, sha256, size: buf.length, type: DOC_TYPES[ext] }, text, method, warnings: ocr ? warnings.filter((w) => !w.startsWith('No text was found')) : warnings, ...(ocr ? { ocr } : {}) };
}

/** OCR a stored document once; the result is kept as <sha256>.ocr.json beside it. */
export async function ocrDoc({ dir, sha256 }) {
  const metaFile = path.join(dir, `${sha256}.json`);
  if (!fs.existsSync(metaFile)) return { ok: false, status: 404, error: 'No such document' };
  const cached = path.join(dir, `${sha256}.ocr.json`);
  if (fs.existsSync(cached)) return JSON.parse(fs.readFileSync(cached, 'utf8'));
  const status = await ocrStatus();
  if (!status.ok) return { ok: false, status: 501, error: `${status.reason}. Paste the text instead.` };
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const { images, skipped } = scannedImages(fs.readFileSync(path.join(dir, `${sha256}${meta.ext}`)), meta.name);
  if (!images.length) return { ok: false, status: 422, error: `No page images this OCR can read${skipped.length ? `: ${skipped[0]}` : ''}. Paste the text instead.` };
  const r = await ocrImages(images);
  const low = r.pages.map((p, i) => (p.confidence < LOW_CONFIDENCE ? i + 1 : null)).filter(Boolean);
  const out = {
    ok: true, text: r.text, confidence: r.confidence, pages: r.pages.map((p) => ({ confidence: p.confidence, words: p.text.split(/\s+/).filter(Boolean).length })),
    method: `OCR (${status.langs.join(', ')}) of ${images.length} page${images.length === 1 ? '' : 's'}, confidence ${r.confidence}%`,
    warnings: [
      'Read by OCR from a scan: compare the text with the letter before testing it, especially amounts, dates and GSTINs.',
      ...(low.length ? [`Low confidence on page${low.length === 1 ? '' : 's'} ${low.join(', ')}: check ${low.length === 1 ? 'it' : 'them'} closely or type the text.`] : []),
      ...skipped.map((x) => `Not read: ${x}.`),
    ],
  };
  if (!r.text.trim()) out.warnings.push('OCR found no text: paste it instead.');
  fs.writeFileSync(cached, JSON.stringify(out));
  return out;
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
        if (!accessOf(req).can('work')) return forbid(res, 'Your role does not include case work');
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
      server.middlewares.use('/__docs', async (req, res, next) => {
        const ocrMatch = (req.url || '').split('?')[0].match(/^\/([0-9a-f]{64})\/ocr$/);
        if (ocrMatch && req.method === 'POST') {
          if (!local(req)) return json(res, 403, { ok: false, error: 'OCR is available from this computer only' });
          if (!accessOf(req).can('work')) return forbid(res, 'Your role does not include case work');
          try { const r = await ocrDoc({ dir, sha256: ocrMatch[1] }); return json(res, r.ok ? 200 : r.status || 400, r); } catch (e) { return json(res, 500, { ok: false, error: `OCR failed: ${e.message}` }); }
        }
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
