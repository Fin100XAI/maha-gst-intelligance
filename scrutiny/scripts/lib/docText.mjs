// Text out of a reply document, so a taxpayer's or CA's letter can be tested claim by claim. Node only (uses zlib).
//   .txt           as is
//   .docx          word/document.xml, paragraph by paragraph (via the zip reader bundled with xlsx)
//   .pdf           text drawn by Tj / TJ / ' / " in the page streams (Flate-compressed or plain). Scanned PDFs are
//                  images: no text comes out here, and the result says so; scripts/lib/ocr.mjs reads them.
//   .jpg / .png    a photographed letter: no text here either; read with OCR.
// Always returns what it could read plus warnings; the officer reviews the text before it is tested.
import zlib from 'node:zlib';
import * as XLSX from 'xlsx';

export const DOC_TYPES = { '.txt': 'text/plain', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

export function extractText(buf, name = '') {
  const ext = (String(name).toLowerCase().match(/\.[a-z0-9]+$/) || [''])[0];
  try {
    if (ext === '.txt') return done(buf.toString('utf8'), 'plain text');
    if (ext === '.docx') return fromDocx(buf);
    if (ext === '.pdf') return fromPdf(buf);
    if (['.jpg', '.jpeg', '.png'].includes(ext)) return { text: '', method: 'image', warnings: [] }; // read by OCR
    return { text: '', method: 'none', warnings: [`Unsupported file type ${ext || '(none)'}: attach a PDF, Word (.docx), text file or a photo of the letter, or paste the text.`] };
  } catch (e) {
    return { text: '', method: 'none', warnings: [`The file could not be read (${e.message}). Paste the text instead.`] };
  }
}
const done = (text, method, warnings = []) => {
  const clean = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text: clean, method, warnings: clean ? warnings : [...warnings, 'No text was found in the document. If it is a scan, it is read with OCR where available; otherwise paste the text.'] };
};

const XML_ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unxml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : XML_ENT[e] ?? m));

function fromDocx(buf) {
  const zipped = XLSX.CFB.read(buf, { type: 'buffer' });
  const i = zipped.FullPaths.findIndex((p) => /word\/document\.xml$/i.test(p));
  if (i < 0) throw new Error('not a Word document (no word/document.xml)');
  const xml = Buffer.from(zipped.FileIndex[i].content).toString('utf8');
  const paras = xml.split(/<\/w:p>/).map((p) => unxml((p.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g) || [])
    .map((t) => (t === '<w:tab/>' ? '\t' : t === '<w:br/>' ? '\n' : t.replace(/<[^>]+>/g, ''))).join('')));
  return done(paras.join('\n'), 'Word document');
}

function fromPdf(buf) {
  const s = buf.toString('latin1');
  if (!s.startsWith('%PDF')) throw new Error('not a PDF');
  const texts = [];
  let hex = 0, drawn = 0;
  const re = /<<([\s\S]*?)>>\s*stream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const start = m.index + m[0].length;
    const end = s.indexOf('endstream', start);
    if (end < 0) break;
    let raw = buf.subarray(start, end);
    if (/\/FlateDecode/.test(m[1])) { try { raw = zlib.inflateSync(raw); } catch { try { raw = zlib.inflateRawSync(raw); } catch { continue; } } }
    else if (/\/Filter/.test(m[1])) continue; // images and other encodings carry no text
    const content = raw.toString('latin1');
    if (!/\bBT\b/.test(content)) continue;
    const out = [];
    const tok = /\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>|\[|\]|-?\d*\.?\d+|\/\w+|[A-Za-z'"*]+/g;
    let arr = null, last = null, line = '', t;
    const newline = () => { out.push(line); line = ''; };
    const draw = (str) => { if (str !== null) { line += str; drawn += 1; } };
    while ((t = tok.exec(content))) {
      const v = t[0];
      if (v === '[') arr = [];
      else if (v === ']') { /* the array ends; TJ follows */ }
      else if (v[0] === '(') { const str = unescapePdf(v.slice(1, -1)); if (arr) arr.push(str); else last = str; }
      else if (v[0] === '<') hex += 1;
      else if (arr && /^-?\d/.test(v)) { if (Number(v) < -200) arr.push(' '); } // a wide negative kern is a word gap
      else if (v === 'TJ') { if (arr) draw(arr.join('')); arr = null; }
      else if (v === 'Tj') { draw(last); last = null; }
      else if (v === "'" || v === '"') { newline(); draw(last); last = null; }
      else if (v === 'T*' || v === 'Td' || v === 'TD' || v === 'Tm' || v === 'ET') newline();
    }
    if (line) newline();
    texts.push(out.join('\n'));
  }
  const warnings = hex && !drawn ? ['The PDF uses embedded font encodings this reader cannot map. Paste the text instead.'] : [];
  return done(texts.join('\n'), 'PDF text', warnings);
}
const unescapePdf = (s) => s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (m, e) => ({ n: '\n', r: '', t: '\t', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }[e] ?? String.fromCharCode(parseInt(e, 8))));
