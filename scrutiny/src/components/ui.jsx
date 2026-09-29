import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon.jsx';
import { CASE_STATUS } from '../lib/store.js';
import { RULE_STATUS, BAND, INK, BRAND } from '../lib/colors.js';
import { cell } from '../lib/format.js';

export function Card({ title, sub, children, table, actions, foot, style, className = '', tour }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`card ${className}`} style={style} data-tour={tour}>
      {(title || table || actions) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {sub && <p>{sub}</p>}
          </div>
          <div className="actions">
            {actions}
            {table && (
              <button className="btn ghost small" onClick={() => setAsTable((v) => !v)} title="Toggle table view">
                {asTable ? 'Chart' : 'Table'}
              </button>
            )}
          </div>
        </div>
      )}
      {asTable && table ? <DataTable columns={table.columns} rows={table.rows} /> : children}
      {foot && <div className="card-foot">{foot}</div>}
    </section>
  );
}

export function DataTable({ columns, rows, max = 420, total }) {
  if (!rows?.length) return <div className="empty">No rows</div>;
  const isNum = columns.map((_, i) => rows.every((r) => typeof r[i] === 'number' || r[i] === '-' || r[i] === null));
  return (
    <>
      <div className="tbl-wrap" style={{ maxHeight: max }}>
        <table className="tbl">
          <thead><tr>{columns.map((c, i) => <th key={c} className={isNum[i] ? 'num' : ''}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((v, j) => <td key={j} className={isNum[j] ? 'num' : ''}>{cell(v)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > rows.length && <div className="card-foot">Showing {rows.length} of {total} rows.</div>}
    </>
  );
}

export function Kpi({ label, value, sub, accent, fill, dot }) {
  return (
    <div className="card kpi">
      <div className="label">{label}</div>
      <div className="value">{value}{dot && <span className="dot" style={{ background: dot }} />}</div>
      {sub && <div className="sub">{sub}</div>}
      {fill !== undefined && <div className="bar"><i style={{ width: `${Math.min(100, Math.max(2, fill * 100))}%`, background: accent || BRAND }} /></div>}
    </div>
  );
}

export function PageHead({ title, path, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {path && <div className="path">{path}</div>}
      </div>
      <div className="right">{children}</div>
    </div>
  );
}

export function BandChip({ band, score }) {
  const b = BAND[band] || BAND.Low;
  return <span className="band-chip" style={{ background: `${b.color}1f`, color: '#1a2233' }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: b.color }} />{band}{score !== undefined && <span className="mono" style={{ opacity: 0.6, fontWeight: 500 }}>{score}</span>}</span>;
}

export function CaseStatus({ status }) {
  const s = CASE_STATUS[status] || CASE_STATUS.New;
  return <span className="status-text" style={{ color: s.color }}><span className="dot" style={{ background: s.color }} />{s.label}</span>;
}

// Global taxpayer / GSTIN finder
export function SearchBox({ taxpayers, onPick, placeholder = 'Taxpayer, GSTIN, state' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const hits = q.trim() ? taxpayers.filter((a) => `${a.name} ${a.gstin} ${a.state}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  return (
    <div className="search" ref={ref}>
      <Icon name="search" />
      <input type="search" value={q} placeholder={placeholder} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { onPick(hits[0].id); setQ(''); setOpen(false); } }} aria-label="Search taxpayers" />
      {open && hits.length > 0 && (
        <div className="search-pop">
          {hits.map((a) => (
            <button key={a.id} onClick={() => { onPick(a.id); setQ(''); setOpen(false); }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: BAND[a.band].color, flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div className="mono muted" style={{ fontSize: 11.5 }}>{a.gstin} · {a.state}</div></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatusPill({ status }) {
  const s = RULE_STATUS[status] || RULE_STATUS.NT;
  return (
    <span className="pill" style={{ background: `${s.color}1c`, color: INK.primary }}>
      <span className="g" style={{ background: s.color }}>{s.glyph}</span>{s.label}
    </span>
  );
}

export function Band({ band, score }) {
  const b = BAND[band] || BAND.Low;
  return <span className="band"><i style={{ background: b.color }} />{band}{score !== undefined && <span className="muted mono" style={{ fontWeight: 500 }}>{score}</span>}</span>;
}

export function Sev({ s }) { return <span className={`sev ${s}`}>{s}</span>; }

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}{t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it) => <span key={it.label}><i className={it.line ? 'line' : ''} style={{ background: it.color }} />{it.label}</span>)}
    </div>
  );
}

// Recharts tooltip body
export function Tip({ active, payload, label, fmt = (v) => v, title }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt">
      <div className="h">{title ? title(payload[0].payload, label) : label}</div>
      {payload.filter((p) => p.value !== undefined && p.value !== null).map((p) => (
        <div className="r" key={p.dataKey + p.name}>
          <i style={{ background: p.color || p.fill || p.payload?.fill }} />{p.name}<b>{fmt(p.value, p)}</b>
        </div>
      ))}
    </div>
  );
}

export const axisProps = { tick: { fill: INK.muted, fontSize: 11 }, axisLine: { stroke: INK.axis }, tickLine: false };
export const gridProps = { stroke: '#e7ebf3', vertical: false };
// Axis titles (secondary ink, never the series colour)
export const xLab = (value) => ({ value, position: 'insideBottom', offset: 4, fill: '#54607a', fontSize: 11, fontWeight: 600 });
export const yLab = (value) => ({ value, angle: -90, position: 'insideLeft', offset: 10, fill: '#54607a', fontSize: 11, fontWeight: 600, style: { textAnchor: 'middle' } });

// Rule 37A status: label always shown, never colour alone.
const RAG = { green: ['Green', 'supplier compliant'], amber: ['Amber', 'awaiting validation'], red: ['Red', 'reversal conditions met'] };
export function Rag({ rag }) {
  if (!RAG[rag]) return null;
  return <span className={`rag rag-${rag}`}><i />{RAG[rag][0]}: {RAG[rag][1]}</span>;
}

// Small ⓘ button with an explanation popover. Closes on Esc, outside click or the button again.
export function InfoTip({ title, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const out = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span className="info" ref={ref}>
      <button type="button" className="info-btn" aria-label={`What is ${title}?`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>i</button>
      {open && <div className={`info-pop ${align}`} role="dialog" aria-label={title}><div className="info-h">{title}</div>{children}</div>}
    </span>
  );
}
