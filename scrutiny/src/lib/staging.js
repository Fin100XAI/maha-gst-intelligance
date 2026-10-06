// Upload staging: what to tell the officer about each file before it is analysed, and whether it can go ahead.
// Pure, so the rules are tested without a browser.
import { gstinValid } from '../engine/gstin.js';

export const FY_RE = /^(20\d{2})-(20\d{2})$/;
export const validFy = (fy) => { const m = String(fy || '').match(FY_RE); return !!m && Number(m[2]) === Number(m[1]) + 1; };

/**
 * @param {{ ok: boolean, error?: string, summary?: { gstin, name, fy, intake } }} read  the worker's answer
 * @param {{ gstin?: string, fy?: string }} correction  what the officer typed
 * @param {{ loadedYears?: string[], duplicateOf?: string|null }} context  years already on the platform for this GSTIN;
 *   another file in this batch for the same GSTIN and year
 * @returns {{ status: 'blocked'|'check'|'ready', gstin: string, fy: string, needs: { gstin: boolean, fy: boolean },
 *   notes: { level: 'error'|'warn'|'info', text: string }[] }}
 */
export function assess(read, correction = {}, context = {}) {
  if (!read?.ok) return { status: 'blocked', gstin: '', fy: '', needs: { gstin: false, fy: false }, notes: [{ level: 'error', text: read?.error || 'Could not read the file' }] };
  const { summary } = read;
  const intake = summary.intake;
  // nothing a returns export carries: say that once, rather than listing every missing part
  const r = intake.returns;
  if (!r.gstr3b && !r.gstr1 && !r.gstr2b && !r.gstr2a) {
    return { status: 'blocked', gstin: '', fy: '', needs: { gstin: false, fy: false }, notes: [{ level: 'error', text: 'Not a returns export: no GSTR-3B, GSTR-1, GSTR-2A or GSTR-2B data. Registers are uploaded under step 2.' }] };
  }
  const needs = { gstin: !intake.banner.gstin, fy: !intake.banner.fy };
  const notes = [];
  const gstin = needs.gstin ? String(correction.gstin || '').trim().toUpperCase() : summary.gstin;
  const fy = needs.fy ? String(correction.fy || '').trim() : summary.fy;
  if (needs.gstin) notes.push(gstin ? (gstinValid(gstin) === true ? { level: 'info', text: `GSTIN entered by you: ${gstin}` } : { level: 'error', text: `"${gstin}" is not a valid GSTIN` }) : { level: 'error', text: 'No GSTIN in the file: enter it to continue.' });
  if (needs.fy) notes.push(fy ? (validFy(fy) ? { level: 'info', text: `Financial year entered by you: ${fy}` } : { level: 'error', text: `"${fy}" is not a financial year like 2025-2026` }) : { level: 'warn', text: 'No return period in the file: enter the financial year (2025-2026 is assumed otherwise).' });
  for (const e of intake.errors.filter((x) => !/GSTIN/.test(x))) notes.push({ level: 'error', text: e });
  for (const w of intake.warnings.filter((x) => !/return period/.test(x))) notes.push({ level: 'warn', text: w });
  if (context.duplicateOf) notes.push({ level: 'warn', text: `Same taxpayer and year as ${context.duplicateOf}: the later file replaces the earlier.` });
  if (context.loadedYears?.includes(fy)) notes.push({ level: 'info', text: `Replaces the FY ${fy} file already on the platform (that one is kept aside).` });
  const status = notes.some((n) => n.level === 'error') ? 'blocked' : notes.some((n) => n.level === 'warn') || needs.gstin || needs.fy ? 'check' : 'ready';
  return { status, gstin, fy, needs, notes };
}

/** One line of what was found, e.g. "GSTR-3B 12 periods · GSTR-1 1,234 · GSTR-2B 2,345 · GSTR-2A 2,400 · ledgers 180". */
export function foundText(intake) {
  const n = (v) => Number(v || 0).toLocaleString('en-IN');
  const r = intake.returns;
  return [`GSTR-3B ${n(r.gstr3b)} period${r.gstr3b === 1 ? '' : 's'}`, `GSTR-1 ${n(r.gstr1)}`, `GSTR-2B ${n(r.gstr2b)}`, `GSTR-2A ${n(r.gstr2a)}`, `ledgers ${n(r.ledgers)}`].join(' · ');
}
