// OCR for scanned replies (#10): page images come out of a PDF exactly, unreadable ones are named rather than
// guessed, and a scanned letter is read on this machine with its confidence stated.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { scannedImages, unpredict, toPnm, ocrStatus, ocrShutdown } from '../scripts/lib/ocr.mjs';
import { storeDoc, ocrDoc } from '../scripts/doc-store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(here, 'fixtures', 'synthetic-scanned-reply.pdf'); // a made-up letter, scanned as one JPEG page
after(() => ocrShutdown());

/** A one-page PDF around one image stream. */
function pdfWith(dict, data) {
  const parts = ['%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n'];
  return Buffer.concat([Buffer.from(`${parts[0]}4 0 obj\n<< /Type /XObject /Subtype /Image ${dict} /Length ${data.length} >>\nstream\n`), data, Buffer.from('\nendstream\nendobj\n%%EOF\n')]);
}

test('PNG predictors are undone row by row', () => {
  // 2 pixels wide, grey 8-bit, 3 rows: Sub, Up, Paeth
  const want = Buffer.from([10, 30, 15, 40, 20, 45]);
  const rows = Buffer.from([1, 10, 20, 2, 5, 10, 4, 5, 5]);
  assert.deepEqual(unpredict(rows, { columns: 2, colors: 1, bpc: 8 }), want);
});

test('raw bitmaps become PNM images the OCR engine reads; 1-bit black follows the PDF convention', () => {
  const grey = toPnm({ width: 2, height: 1, colors: 1, bpc: 8, pixels: Buffer.from([0, 255]) });
  assert.equal(grey.toString('latin1', 0, 11), 'P5\n2 1\n255\n');
  const bits = toPnm({ width: 8, height: 1, colors: 1, bpc: 1, pixels: Buffer.from([0b00001111]) });
  assert.equal(bits.toString('latin1', 0, 7), 'P4\n8 1\n');
  assert.equal(bits[7], 0b11110000, 'PDF 0 = black becomes PBM 1 = black');
  assert.equal(toPnm({ width: 1, height: 1, colors: 1, bpc: 16, pixels: Buffer.alloc(2) }), null, 'what it cannot represent, it does not guess');
});

test('page images come out of a PDF: JPEG as is, Flate bitmaps with their predictor, logos and fax pages named', () => {
  const scan = scannedImages(fs.readFileSync(FIXTURE), 'reply.pdf');
  assert.deepEqual(scan.images.map((i) => [i.kind, i.width, i.height]), [['jpeg', 1240, 900]]);
  assert.equal(scan.images[0].data.subarray(0, 2).toString('hex'), 'ffd8', 'a JPEG');

  const w = 400, h = 300;
  const pixels = Buffer.alloc(w * h, 200);
  const predicted = Buffer.concat(Array.from({ length: h }, (_, r) => Buffer.concat([Buffer.from([0]), pixels.subarray(r * w, (r + 1) * w)])));
  const flate = scannedImages(pdfWith(`/Width ${w} /Height ${h} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /DecodeParms << /Predictor 15 /Columns ${w} >>`, zlib.deflateSync(predicted)), 'x.pdf');
  assert.equal(flate.images[0].kind, 'pnm');
  assert.equal(flate.images[0].data.length, `P5\n${w} ${h}\n255\n`.length + w * h);

  assert.equal(scannedImages(pdfWith('/Width 120 /Height 40 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode', Buffer.from('ffd8', 'hex')), 'x.pdf').images.length, 0, 'a logo is not a page');
  const fax = scannedImages(pdfWith('/Width 2480 /Height 3508 /ColorSpace /DeviceGray /BitsPerComponent 1 /Filter /CCITTFaxDecode', Buffer.alloc(10)), 'x.pdf');
  assert.equal(fax.images.length, 0);
  assert.match(fax.skipped[0], /CCITTFax/);
  assert.deepEqual(scannedImages(Buffer.from('jpegbytes'), 'photo.JPG').images.map((i) => i.kind), ['jpeg'], 'a photo is its own page');
});

test('a scanned letter is read by OCR on this machine, with its confidence, and the result is kept', async (t) => {
  const status = await ocrStatus();
  if (!status.ok) return t.skip(status.reason); // optional dependency not installed
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-'));
  const stored = storeDoc({ dir, name: 'synthetic-scanned-reply.pdf', buf: fs.readFileSync(FIXTURE) });
  assert.equal(stored.text, '', 'no text layer');
  assert.deepEqual(stored.ocr, { pages: 1, skipped: [] }, 'the upload says it is a scan');
  const r = await ocrDoc({ dir, sha256: stored.doc.sha256 });
  assert.equal(r.ok, true);
  assert.match(r.text, /reversed in GSTR-3B for March 2026/);
  assert.match(r.text, /4,52,300/);
  assert.ok(r.confidence >= 80, `confidence ${r.confidence}`);
  assert.match(r.method, /^OCR \(eng, hin, mar\) of 1 page, confidence \d+%$/);
  assert.match(r.warnings[0], /compare the text with the letter/);
  assert.ok(fs.existsSync(path.join(dir, `${stored.doc.sha256}.ocr.json`)), 'read once, kept beside the document');
});
