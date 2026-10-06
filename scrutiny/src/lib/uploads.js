// Upload report helpers (pure, so they can be tested without a browser).
const fyShort = (fy) => String(fy || '').replace(/^(\d{4})-\d{2}(\d{2})$/, '$1-$2');

/** What an upload changed for one taxpayer, compared with the analysis before it. */
export function changeText(c) {
  if (!c) return '';
  if (!c.before) return 'New taxpayer';
  if (!c.after) return 'Not in the results';
  const parts = [];
  if (c.before.fy !== c.after.fy) parts.push(`latest year now FY ${fyShort(c.after.fy)}`);
  if (c.before.score !== c.after.score) parts.push(`score ${c.before.score} → ${c.after.score}${c.before.band !== c.after.band ? ` (${c.before.band} → ${c.after.band})` : ''}`);
  const added = c.after.fails.filter((id) => !c.before.fails.includes(id)), gone = c.before.fails.filter((id) => !c.after.fails.includes(id));
  if (added.length) parts.push(`new failed: ${added.join(', ')}`);
  if (gone.length) parts.push(`no longer failing: ${gone.join(', ')}`);
  return parts.length ? parts.join(' · ') : 'No change';
}
