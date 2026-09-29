// Register storage: validates an uploaded CSV/XLSX against its declaration (src/engine/registers.js) and, only if
// every row is valid, saves the normalised records as data/registers/<type>.json. The previous version moves to
// data/registers/superseded/ and the original upload is kept in data/registers/originals/, so nothing is lost.
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
 * @param {{ dir: string, type: string, name: string, buf: Buffer, now?: Date }} opts  dir = data/registers
 * @returns {{ ok: true, meta: object } | { ok: false, errors: string[] }}
 */
export function saveRegister({ dir, type, name, buf, now = new Date() }) {
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
  if (replaced) fs.renameSync(file, path.join(dir, 'superseded', `${stamp}_${type}.json`));
  const original = `${stamp}_${safeName(name)}`;
  fs.writeFileSync(path.join(dir, 'originals', original), buf);
  const meta = { type, title: REGISTERS[type].title, file: safeName(name), original, sha256: crypto.createHash('sha256').update(buf).digest('hex'), uploadedAt: now.toISOString(), rows: records.length };
  fs.writeFileSync(file, JSON.stringify({ meta, records }, null, 1));
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
