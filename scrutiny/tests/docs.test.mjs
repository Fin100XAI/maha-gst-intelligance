// Reply documents: text out of PDF, Word and text files (scripts/lib/docText.mjs), content-addressed storage
// (scripts/doc-store.js), and letter furniture kept out of the claims.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { extractText } from '../scripts/lib/docText.mjs';
import { storeDoc, cleanDocName } from '../scripts/doc-store.js';
import { pdf, docx } from '../scripts/synth/docs.mjs';
import { extractClaims } from '../src/engine/eiu.js';

const WARD = path.join(ROOT, 'test-data', 'ward');
const REPLIES = JSON.parse(fs.readFileSync(path.join(WARD, 'replies.json'), 'utf8'));
const norm = (s) => s.replace(/₹/g, 'Rs. ').replace(/\s+/g, ' ').trim();

test('every ward reply letter reads back to the reply text, whatever its format', () => {
  const files = fs.readdirSync(path.join(WARD, 'replies'));
  assert.deepEqual(files.map((f) => path.extname(f)).sort(), ['.docx', '.docx', '.pdf', '.pdf']);
  for (const f of files) {
    const r = extractText(fs.readFileSync(path.join(WARD, 'replies', f)), f);
    assert.deepEqual(r.warnings, [], f);
    const reply = REPLIES.find((x) => x.signalId === path.basename(f, path.extname(f)));
    assert.ok(norm(r.text).includes(norm(reply.text)), `${f} contains the whole reply`);
    assert.match(r.text, /Yours faithfully/);
  }
});

test('letter furniture is not a claim; the reply sentences are', () => {
  for (const f of fs.readdirSync(path.join(WARD, 'replies'))) {
    const text = extractText(fs.readFileSync(path.join(WARD, 'replies', f)), f).text;
    const reply = REPLIES.find((x) => x.signalId === path.basename(f, path.extname(f)));
    const fromLetter = extractClaims(text).map((c) => [c.type, norm(c.text)]);
    const fromText = extractClaims(reply.text.replace(/₹/g, 'Rs. ')).map((c) => [c.type, norm(c.text)]);
    assert.deepEqual(fromLetter, fromText, f);
  }
  assert.deepEqual(extractClaims('To,\nThe GST Officer,\nSubject: Reply to notice\nFrom July 2025 our branch billed the southern customers directly.').map((c) => c.type), ['branch']);
});

test('PDF strings keep escaped characters; unreadable and unsupported files say so', () => {
  const r = extractText(pdf(['Paid (in full) at 18% p.a. \\ interest']), 'x.pdf');
  assert.equal(r.text, 'Paid (in full) at 18% p.a. \\ interest');
  assert.match(extractText(Buffer.from('%PDF-1.4\n%%EOF'), 'scan.pdf').warnings[0], /No text was found/);
  assert.match(extractText(Buffer.from('not a zip'), 'x.docx').warnings[0], /could not be read/);
  assert.match(extractText(Buffer.from('MZ'), 'x.exe').warnings[0], /Unsupported file type/);
  assert.equal(extractText(Buffer.from('  plain reply \n'), 'r.txt').text, 'plain reply');
  assert.equal(extractText(docx(['A &amp; B <tag>']), 'x.docx').text, 'A &amp; B <tag>');
});

test('documents are stored once by content, with a safe name, and only accepted types', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gst-docs-'));
  try {
    const buf = pdf(['A reply.']);
    const a = storeDoc({ dir, name: '../../etc/letter.pdf', buf, now: new Date('2026-09-27T00:00:00Z') });
    const b = storeDoc({ dir, name: 'copy.pdf', buf });
    assert.ok(a.ok && b.ok);
    assert.equal(a.doc.sha256, b.doc.sha256);
    assert.equal(a.doc.name, 'letter.pdf', 'no path in the stored name');
    assert.deepEqual(fs.readdirSync(dir).sort(), [`${a.doc.sha256}.json`, `${a.doc.sha256}.pdf`]);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, `${a.doc.sha256}.json`), 'utf8')).name, 'letter.pdf', 'the first name is kept');
    assert.equal(storeDoc({ dir, name: 'x.exe', buf }).ok, false);
    assert.equal(cleanDocName('a<b>:c?.pdf'), 'a_b_c_.pdf');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
