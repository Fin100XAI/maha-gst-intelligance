// OCR for scanned replies: a taxpayer's letter that arrives as a scan (a PDF of page images) or a photo (.jpg/.png).
// Node only. Runs on this server with tesseract.js and the language data installed from npm (optional
// dependencies): nothing is sent anywhere. If they are not installed, ocrStatus() says so and the officer pastes the
// text, as before.
//
//   scannedImages(buf, name)  the page images inside a PDF (JPEG, or 1-bit / 8-bit grey / RGB bitmaps, with or
//                             without PNG predictors) or the photo itself; what cannot be read is listed, not guessed
//   ocrImages(images)         text per page with Tesseract's confidence, one page at a time on one reused worker
//
// OCR text is approximate. The result always says it was read by OCR, with the confidence, and the officer checks it
// against the letter before any claim is tested.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const OCR_LANGS = (process.env.OCR_LANGS || 'eng+hin+mar').split('+').filter(Boolean);
export const MAX_PAGES = 20;
const MIN_SIDE = 300; // smaller images are logos and stamps, not pages
const MAX_PIXELS = 60e6;
export const LOW_CONFIDENCE = 60;

// ------------------------------------------------------------------ page images out of a PDF
/** The stream objects of a PDF: each with its dictionary text and raw bytes. */
function pdfStreams(buf) {
  const s = buf.toString('latin1');
  const out = [];
  const re = /\bstream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const head = s.slice(Math.max(0, m.index - 4000), m.index);
    const objAt = [...head.matchAll(/\d+\s+\d+\s+obj\b/g)].pop();
    if (!objAt) continue;
    const dict = head.slice(objAt.index + objAt[0].length);
    const start = m.index + m[0].length;
    let len = Number((dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/) || [])[1]);
    const ref = dict.match(/\/Length\s+(\d+)\s+(\d+)\s+R/);
    if (!len && ref) len = Number((s.match(new RegExp(`\\b${ref[1]}\\s+${ref[2]}\\s+obj\\s*(\\d+)\\s*endobj`)) || [])[1]);
    const end = len && s.slice(start + len, start + len + 20).includes('endstream') ? start + len : s.indexOf('endstream', start);
    if (end < 0) break;
    out.push({ dict, data: buf.subarray(start, end) });
    re.lastIndex = end;
  }
  return out;
}

const num = (dict, key) => Number((dict.match(new RegExp(`/${key}\\s+(\\d+)`)) || [])[1]) || 0;

/** Undo PNG row predictors (Predictor 10-15), which many scanners' PDF writers apply before Flate. */
export function unpredict(data, { columns, colors, bpc }) {
  const bpp = Math.max(1, Math.ceil((colors * bpc) / 8));
  const rowLen = Math.ceil((columns * colors * bpc) / 8);
  const rows = Math.floor(data.length / (rowLen + 1));
  const out = Buffer.alloc(rows * rowLen);
  for (let r = 0; r < rows; r += 1) {
    const type = data[r * (rowLen + 1)];
    const src = r * (rowLen + 1) + 1;
    const dst = r * rowLen;
    for (let i = 0; i < rowLen; i += 1) {
      const x = data[src + i];
      const left = i >= bpp ? out[dst + i - bpp] : 0;
      const up = r ? out[dst - rowLen + i] : 0;
      const ul = r && i >= bpp ? out[dst - rowLen + i - bpp] : 0;
      let v;
      if (type === 1) v = x + left;
      else if (type === 2) v = x + up;
      else if (type === 3) v = x + ((left + up) >> 1);
      else if (type === 4) { const p = left + up - ul, pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - ul); v = x + (pa <= pb && pa <= pc ? left : pb <= pc ? up : ul); } else v = x;
      out[dst + i] = v & 255;
    }
  }
  return out;
}

/** A raw bitmap as a PNM image (P4 1-bit, P5 grey, P6 RGB), which the OCR engine reads directly. */
export function toPnm({ width, height, colors, bpc, pixels, blackIs1 = false }) {
  if (bpc === 1 && colors === 1) {
    // PDF DeviceGray 1-bit: 0 is black. PBM: 1 is black. Invert unless the image says otherwise.
    const rowLen = Math.ceil(width / 8);
    const body = Buffer.from(pixels.subarray(0, rowLen * height));
    if (!blackIs1) for (let i = 0; i < body.length; i += 1) body[i] = ~body[i] & 255;
    return Buffer.concat([Buffer.from(`P4\n${width} ${height}\n`), body]);
  }
  if (bpc !== 8 || (colors !== 1 && colors !== 3)) return null;
  return Buffer.concat([Buffer.from(`${colors === 1 ? 'P5' : 'P6'}\n${width} ${height}\n255\n`), pixels.subarray(0, width * height * colors)]);
}

const IMAGE_EXT = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png' };

/**
 * @returns {{ images: { data: Buffer, kind: string, width: number, height: number }[], skipped: string[] }}
 */
export function scannedImages(buf, name = '') {
  const ext = (String(name).toLowerCase().match(/\.[a-z0-9]+$/) || [''])[0];
  if (IMAGE_EXT[ext]) return { images: [{ data: buf, kind: IMAGE_EXT[ext], width: 0, height: 0 }], skipped: [] };
  if (ext !== '.pdf') return { images: [], skipped: [] };
  const images = [], skipped = [];
  for (const { dict, data } of pdfStreams(buf)) {
    if (!/\/Subtype\s*\/Image/.test(dict)) continue;
    const width = num(dict, 'Width'), height = num(dict, 'Height');
    if (Math.min(width, height) < MIN_SIDE) continue;
    if (width * height > MAX_PIXELS) { skipped.push(`an image of ${width}×${height} pixels is too large to read`); continue; }
    if (images.length >= MAX_PAGES) { skipped.push(`only the first ${MAX_PAGES} pages are read`); break; }
    const filters = (dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/) || [])[1] || '';
    if (/DCTDecode/.test(filters) && !/FlateDecode/.test(filters)) { images.push({ data: Buffer.from(data), kind: 'jpeg', width, height }); continue; }
    if (/CCITTFax|JBIG2|JPX/.test(filters)) { skipped.push(`a page stored as ${filters.match(/CCITTFax|JBIG2|JPX/)[0]} (fax or JPEG 2000 compression), which this OCR cannot read`); continue; }
    if (/^\/FlateDecode$|^\[\s*\/FlateDecode\s*\]$/.test(filters.trim()) || !filters) {
      let pixels;
      try { pixels = filters ? zlib.inflateSync(data) : data; } catch { skipped.push('a page image that could not be decompressed'); continue; }
      const bpc = num(dict, 'BitsPerComponent') || 8;
      const colors = /DeviceRGB/.test(dict) ? 3 : /DeviceGray|CalGray/.test(dict) || /\/ImageMask\s+true/.test(dict) ? 1 : 0;
      if (!colors) { skipped.push('a page image in a colour space this OCR cannot read (indexed or CMYK)'); continue; }
      const predictor = num(dict, 'Predictor');
      if (predictor >= 10) pixels = unpredict(pixels, { columns: num(dict, 'Columns') || width, colors, bpc });
      const pnm = toPnm({ width, height, colors, bpc, pixels, blackIs1: /\/Decode\s*\[\s*1\s+0\s*\]/.test(dict) });
      if (pnm) images.push({ data: pnm, kind: 'pnm', width, height }); else skipped.push(`a page image with ${bpc}-bit colour, which this OCR cannot read`);
      continue;
    }
    skipped.push(`a page image compressed as ${filters}, which this OCR cannot read`);
  }
  return { images, skipped };
}

// ------------------------------------------------------------------ the OCR engine (optional dependency)
let engine = null; // Promise<{ createWorker, cachePath, langPath }> or a rejected one
function loadEngine() {
  engine ||= (async () => {
    const { createWorker } = await import('tesseract.js');
    // The language data ships gzipped in npm packages; the engine reads it uncompressed from one folder.
    const cachePath = path.join(os.tmpdir(), 'gst-ocr-4.0.0');
    fs.mkdirSync(cachePath, { recursive: true });
    for (const lang of OCR_LANGS) {
      const file = path.join(cachePath, `${lang}.traineddata`);
      if (fs.existsSync(file)) continue;
      const src = path.join(require(`@tesseract.js-data/${lang}`).langPath, `${lang}.traineddata.gz`);
      fs.writeFileSync(`${file}.tmp`, zlib.gunzipSync(fs.readFileSync(src)));
      fs.renameSync(`${file}.tmp`, file);
    }
    return { createWorker, cachePath, langPath: cachePath };
  })();
  return engine;
}

/** @returns {Promise<{ ok: boolean, langs: string[], reason?: string }>} */
export async function ocrStatus() {
  try { await loadEngine(); return { ok: true, langs: OCR_LANGS }; } catch (e) {
    engine = null;
    return { ok: false, langs: OCR_LANGS, reason: /Cannot find (module|package)/.test(e.message) ? 'OCR is not installed on this server (run npm install in the scrutiny folder)' : `OCR could not start (${e.message})` };
  }
}

// One worker, reused, one document at a time; it stops after a minute without work.
let worker = null, idle = null, queue = Promise.resolve();
async function getWorker() {
  clearTimeout(idle);
  if (!worker) {
    const { createWorker, cachePath, langPath } = await loadEngine();
    // cacheMethod readOnly + a local langPath: the data is read from disk, never fetched or written
    worker = createWorker(OCR_LANGS.join('+'), 1, { cachePath, langPath, cacheMethod: 'readOnly', gzip: false, logger: () => {}, errorHandler: () => {} });
  }
  return worker;
}
/** Stop the worker now (tests, shutdown); the next OCR starts a new one. */
export async function ocrShutdown() { clearTimeout(idle); const w = worker; worker = null; if (w) await (await w).terminate().catch(() => {}); }
const release = () => { clearTimeout(idle); idle = setTimeout(async () => { const w = worker; worker = null; if (w) (await w).terminate().catch(() => {}); }, 60000); idle.unref?.(); };

/**
 * @param {{ data: Buffer }[]} images
 * @returns {Promise<{ pages: { text: string, confidence: number }[], text: string, confidence: number }>}
 */
export function ocrImages(images, { onPage = () => {} } = {}) {
  const run = queue.then(async () => {
    let w;
    try { w = await getWorker(); } catch (e) { worker = null; throw e; } // a worker that failed to start is not kept
    const pages = [];
    try {
      for (const [i, img] of images.entries()) {
        const { data } = await w.recognize(img.data);
        pages.push({ text: String(data.text || '').trim(), confidence: Math.round(data.confidence || 0) });
        onPage(i + 1, images.length);
      }
    } finally { release(); }
    const words = pages.reduce((s, p) => s + (p.text.split(/\s+/).filter(Boolean).length), 0);
    const confidence = words ? Math.round(pages.reduce((s, p) => s + p.confidence * p.text.split(/\s+/).filter(Boolean).length, 0) / words) : 0;
    return { pages, text: pages.map((p, i) => (pages.length > 1 ? `[Page ${i + 1}]\n${p.text}` : p.text)).join('\n\n'), confidence };
  });
  queue = run.catch(() => {});
  return run;
}
