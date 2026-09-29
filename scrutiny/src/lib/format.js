// Indian-style money formatting: ₹ with lakh / crore compaction.
export const inr = (v, { compact = true, digits = 2 } = {}) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  // Jurisdiction totals run to lakhs of crores: say "lakh Cr" rather than print a seven-digit crore figure.
  if (compact && a >= 1e12) return `${s}₹${(a / 1e12).toLocaleString('en-IN', { maximumFractionDigits: digits })} lakh Cr`;
  if (compact && a >= 1e10) return `${s}₹${Math.round(a / 1e7).toLocaleString('en-IN')} Cr`;
  if (compact && a >= 1e7) return `${s}₹${(a / 1e7).toLocaleString('en-IN', { maximumFractionDigits: digits })} Cr`;
  if (compact && a >= 1e5) return `${s}₹${(a / 1e5).toLocaleString('en-IN', { maximumFractionDigits: digits })} L`;
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`;
};
export const axisInr = (v) => {
  const a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e7) return `${s}${+(a / 1e7).toFixed(1)}Cr`;
  if (a >= 1e5) return `${s}${+(a / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${s}${+(a / 1e3).toFixed(0)}K`;
  return `${s}${Math.round(a)}`;
};
export const pct = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '-' : `${(v * 100).toFixed(d)}%`);
export const int = (v) => (v ?? 0).toLocaleString('en-IN');
export const cell = (v) => (typeof v === 'number' ? (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-IN') : String(Math.round(v * 100) / 100)) : v ?? '-');
