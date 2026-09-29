import { useEffect, useState } from 'react';

// Browser storage can be unavailable (private mode, blocked site data) — every access is guarded
// and the app keeps working in memory if it fails.
const read = (store, key, fallback) => {
  try { const v = store.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (store, key, value) => {
  try { if (value === null || value === undefined) store.removeItem(key); else store.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};
const ls = () => { try { return window.localStorage; } catch { return null; } };
const ss = () => { try { return window.sessionStorage; } catch { return null; } };

export const session = {
  get: () => (ss() ? read(ss(), 'gst.session', null) : null),
  set: (v) => ss() && write(ss(), 'gst.session', v),
};

export function usePersistent(key, initial) {
  const [value, setValue] = useState(() => (ls() ? read(ls(), key, initial) : initial));
  useEffect(() => { if (ls()) write(ls(), key, value); }, [key, value]);
  return [value, setValue];
}

export const CASE_STATUS = {
  New: { color: '#3b62c0', label: 'New' },
  'In review': { color: '#9c630d', label: 'In review' },
  'Notice drafted': { color: '#9e541a', label: 'ASMT-10 drafted' },
  Closed: { color: '#0c6a4a', label: 'Closed' },
};

// Local wall-clock time (officers read these as IST, not UTC)
export const nowStamp = () => {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
