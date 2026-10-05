// A paged, searchable list of taxpayers, ranked by risk: the one way the dashboard shows "who", at any scale.
// Used by the risk ranking and by every drill-down (a rule, an issue count, a turnover / credit cell).
import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { raisedIndicators } from '../engine/verify.js';
import { isTestData } from '../engine/names.js';
import { TestTag } from './ui.jsx';
import { BAND } from '../lib/colors.js';
import { inr, int } from '../lib/format.js';

const clean = (s) => s.replace(/\b(PRIVATE|PVT\.?|LIMITED|LTD\.?)\b/gi, '').replace(/\s+/g, ' ').trim();

/** Rows for a list: rank by score, with the reasons shown on each row. */
export const listRows = (taxpayers) => [...taxpayers].sort((a, b) => b.score - a.score).map((a, i) => ({
  uid: a.uid || a.id, id: a.id, rank: i + 1, name: a.name, gstin: a.gstin, score: a.score, band: a.band,
  fails: a.results.filter((r) => r.status === 'Fail').length, flags: raisedIndicators(a).length, exposure: a.exposure.confirmed + a.exposure.potential,
  test: isTestData(a.gstin, a.fileName),
}));

export default function TaxpayerList({ rows, openTaxpayer, pageSize = 10, search = true, resetKey }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); setQ(''); }, [resetKey]);
  const shown = q ? rows.filter((r) => `${r.name} ${r.gstin}`.toLowerCase().includes(q.toLowerCase())) : rows;
  const pages = Math.max(1, Math.ceil(shown.length / pageSize));
  const at = Math.min(page, pages - 1);
  const view = shown.slice(at * pageSize, at * pageSize + pageSize);
  return (
    <div className="tl">
      {search && rows.length > pageSize && (
        <label className="rr-search tl-search"><Icon name="search" size={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name or GSTIN" aria-label="Search this list" /></label>
      )}
      <ol className="rr-list">
        {view.map((r) => (
          <li key={r.uid}>
            <button className="rr-row" onClick={() => openTaxpayer(r.id)} title={`Open ${r.name}`}>
              <span className="rr-rank">{r.rank}</span>
              <span className="rr-name"><b>{clean(r.name)}</b>{r.test && <> <TestTag /></>}<span className="mono muted">{r.gstin}</span></span>
              <span className="rr-bar" aria-hidden="true"><i style={{ width: `${Math.max(2, r.score)}%`, background: BAND[r.band].color }} /></span>
              <span className="rr-score">{r.score}</span>
              <span className="rr-why muted small">{r.fails} failed · {r.flags} indicator{r.flags === 1 ? '' : 's'}{r.exposure ? ` · ${inr(r.exposure)}` : ''}</span>
            </button>
          </li>
        ))}
        {!view.length && <li className="note">No taxpayer matches{q ? ` "${q}"` : ''}.</li>}
      </ol>
      {shown.length > pageSize && (
        <div className="rr-foot">
          <span className="muted small">{at * pageSize + 1}–{Math.min(shown.length, at * pageSize + pageSize)} of {int(shown.length)}</span>
          <div className="rr-pager">
            <button className="btn small" onClick={() => setPage(at - 1)} disabled={at === 0}>Previous</button>
            <span className="muted small">Page {at + 1} of {int(pages)}</span>
            <button className="btn small" onClick={() => setPage(at + 1)} disabled={at >= pages - 1}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A drill-down panel under a chart: what was clicked, how many, the list, and a way to close it. */
export function Drill({ title, rows, openTaxpayer, onClose }) {
  return (
    <div className="drill">
      <div className="drill-head"><b>{title}</b><span className="muted small">{int(rows.length)} taxpayer{rows.length === 1 ? '' : 's'}</span><button className="link-btn small" onClick={onClose}>Close</button></div>
      <TaxpayerList rows={rows} openTaxpayer={openTaxpayer} pageSize={8} resetKey={title} />
    </div>
  );
}
