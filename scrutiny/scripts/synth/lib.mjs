// Shared primitives for the synthetic-data generators: calendar, GSTIN check digit, deterministic RNG, tax heads.
// FY month index m: 0 = April ... 11 = March.
export const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
export const STATES = { 24: 'Gujarat', 27: 'Maharashtra', 29: 'Karnataka', 33: 'Tamil Nadu', 36: 'Telangana', '07': 'Delhi', 30: 'Goa', 23: 'Madhya Pradesh' };
export const CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const r2 = (v) => Math.round(v * 100) / 100;
export const serial = (iso) => { const [y, m, d] = iso.split('-').map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000; };
export const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
export const addDays = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const checkDigit = (g14) => { let s = 0; for (let i = 0; i < 14; i++) { const p = CH.indexOf(g14[i]) * (i % 2 ? 2 : 1); s += Math.floor(p / 36) + (p % 36); } return CH[(36 - (s % 36)) % 36]; };
export const gstin = (state, pan, entity = '1', valid = true) => { const b = `${String(state).padStart(2, '0')}${pan}${entity}Z`; const c = checkDigit(b); return b + (valid ? c : CH[(CH.indexOf(c) + 7) % 36]); };

export function makeRng(seed) {
  const rnd = mulberry(seed);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const logU = (lo, hi) => Math.exp(Math.log(lo) + rnd() * (Math.log(hi) - Math.log(lo)));
  const L = () => String.fromCharCode(65 + ri(0, 25));
  const pan = (type) => `ZZ${L()}${type}${L()}${ri(1000, 9999)}${L()}`;
  return { rnd, ri, pick, logU, pan };
}

// Calendar helpers for FY month index m (0 = April)
export const calOf = (fy, m) => ({ y: m <= 8 ? fy : fy + 1, cm: ((m + 3) % 12) + 1 });
export const daysIn = (y, cm) => new Date(Date.UTC(y, cm, 0)).getUTCDate();
export function dayIn(g, fy, m, { sundays = false } = {}) {
  const { y, cm } = calOf(fy, m);
  for (;;) { const d = g.ri(1, daysIn(y, cm)); const s = iso(y, cm, d); if (sundays || new Date(`${s}T00:00:00Z`).getUTCDay() !== 0) return s; }
}
export const nextMonthDay = (fy, m, day) => { const { y, cm } = calOf(fy, m); const ny = cm === 12 ? y + 1 : y, nm = cm === 12 ? 1 : cm + 1; return iso(ny, nm, day); };

// Tax heads for a line: intra-state -> CGST + SGST, inter-state -> IGST
export const heads = (taxable, rate, intra) => (intra ? { igst: 0, cgst: r2((taxable * rate) / 200), sgst: r2((taxable * rate) / 200) } : { igst: r2((taxable * rate) / 100), cgst: 0, sgst: 0 });
export const taxOf = (h) => h.igst + h.cgst + h.sgst;
