// Register storage: validates an uploaded CSV/XLSX against its declaration (src/engine/registers.js) and, only if
// every row is valid, saves the normalised records as data/registers/<type>.json. An upload ADDS to the register:
// its rows are added, a row with the same key (the register's own key, e.g. GSTIN or signal ID) is updated, and every
// other row already saved is kept. mode 'replace' swaps the whole register instead. Either way the previous version
// moves to data/registers/superseded/ and the original upload is kept in data/registers/originals/: nothing is lost.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import { REGISTERS, parseRegister } from '../../src/engine/registers.js';

const safeName = (n) => path.basename(String(n || 'upload')).replace(/[^\w .()&,-]+/g, '_').slice(0, 120);

/** Read the first sheet of a CSV or XLSX buffer into row objects. CSV cells stay text; XLSX cells keep their type. */
export function readRows(buf, name = '') {
  const csv = /\.csv$/i.test(name);
  const wb = XLSX.read(buf, { type: 'buffer', raw: csv, cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return ws ? XLSX.utils.sheet_to_json(ws, { defval: null, raw: true }) : [];
}

/**
 * @param {{ dir: string, type: string, name: string, buf: Buffer, now?: Date, mode?: 'merge' | 'replace' }} opts  dir = data/registers
 * @returns {{ ok: true, meta: object, replaced: boolean } | { ok: false, errors: string[] }}
 *   meta.rows: rows saved in all; meta.added / updated / kept: what the upload did to the rows already there
 */
export function saveRegister({ dir, type, name, buf, now = new Date(), mode = 'merge' }) {
  if (!REGISTERS[type]) return { ok: false, errors: [`Unknown register type: ${type}`] };
  if (!/\.(csv|xlsx)$/i.test(name)) return { ok: false, errors: ['Upload a .csv or .xlsx file'] };
  let rows;
  try { rows = readRows(buf, name); } catch (e) { return { ok: false, errors: [`Could not read the file: ${e.message}`] }; }
  const { records, errors } = parseRegister(type, rows);
  if (errors.length) return { ok: false, errors };

  fs.mkdirSync(path.join(dir, 'superseded'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'originals'), { recursive: true });
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `${type}.json`);
  const replaced = fs.existsSync(file);
  // Merge into what is saved: same key -> the uploaded row, new key -> added, everything else kept in place.
  const def = REGISTERS[type];
  const keyOf = (r) => (typeof def.key === 'function' ? def.key(r) : r[def.key]);
  let saved = records, counts = { added: records.length, updated: 0, kept: 0 };
  if (replaced && mode !== 'replace') {
    let prev = [];
    try { prev = JSON.parse(fs.readFileSync(file, 'utf8')).records || []; } catch { prev = []; }
    const incoming = new Map(records.map((r) => [keyOf(r), r]));
    const before = new Set(prev.map(keyOf));
    counts = { added: 0, updated: 0, kept: 0 };
    saved = prev.map((r) => (incoming.has(keyOf(r)) ? (counts.updated++, incoming.get(keyOf(r))) : (counts.kept++, r)));
    for (const r of records) if (!before.has(keyOf(r))) { saved.push(r); counts.added++; }
  }
  if (replaced) fs.renameSync(file, path.join(dir, 'superseded', `${stamp}_${type}.json`));
  const original = `${stamp}_${safeName(name)}`;
  fs.writeFileSync(path.join(dir, 'originals', original), buf);
  const meta = { type, title: REGISTERS[type].title, file: safeName(name), original, sha256: crypto.createHash('sha256').update(buf).digest('hex'), uploadedAt: now.toISOString(), rows: saved.length,
    mode: replaced && mode !== 'replace' ? 'merge' : 'replace', uploadRows: records.length, ...counts };
  fs.writeFileSync(file, JSON.stringify({ meta, records: saved }, null, 1));
  return { ok: true, meta, replaced };
}

/** Every saved register: { eiu: { meta, records } | null, targets: ..., demands: ... } */
export function loadRegisters(dir) {
  return Object.fromEntries(Object.keys(REGISTERS).map((type) => {
    const file = path.join(dir, `${type}.json`);
    if (!fs.existsSync(file)) return [type, null];
    try { return [type, JSON.parse(fs.readFileSync(file, 'utf8'))]; } catch { return [type, null]; }
  }));
}
