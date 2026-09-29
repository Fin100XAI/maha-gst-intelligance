// GSTIN check digit (mod-36 Luhn variant used by GSTN). Dependency-free so any screen can use it.
const CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** @returns {true|false|null}  null when the value is not a regular-taxpayer GSTIN format (TDS, UIN, ...) */
export function gstinValid(g) {
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return null;
  let s = 0;
  for (let i = 0; i < 14; i++) { const p = CH.indexOf(g[i]) * (i % 2 ? 2 : 1); s += Math.floor(p / 36) + (p % 36); }
  return CH[(36 - (s % 36)) % 36] === g[14];
}
