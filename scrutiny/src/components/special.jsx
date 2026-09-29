import React, { useState } from 'react';
import { diverging, RULE_STATUS, BAND } from '../lib/colors.js';

// Pearson correlation matrix, diverging blue (−1) · gray (0) · red (+1)
export function CorrelationMatrix({ keys, cells, labelWidth = 150 }) {
  const [hover, setHover] = useState(null);
  const get = (a, b) => cells.find((c) => c.a === a && c.b === b)?.r ?? null;
  const n = keys.length;
  return (
    <div>
      <div className="corr-scroll">
      <div className="hgrid" style={{ gridTemplateColumns: `${labelWidth}px repeat(${n}, minmax(34px, 1fr))`, minWidth: labelWidth + n * 37 }}>
        <div />
        {keys.map((k) => <div key={k.k} className="cl" title={k.l}>{k.l.length > 14 ? `${k.l.slice(0, 13)}…` : k.l}</div>)}
        {keys.map((row) => (
          <React.Fragment key={row.k}>
            <div className="rl" title={row.l}>{row.l}</div>
            {keys.map((col) => {
              const r = get(row.k, col.k);
              const strong = r !== null && Math.abs(r) > 0.55;
              return (
                <div key={col.k} className="hc" style={{ background: diverging(r), color: strong ? '#fff' : '#3a3a38' }}
                  onMouseEnter={() => setHover({ a: row.l, b: col.l, r })} onMouseLeave={() => setHover(null)}
                  title={`${row.l} × ${col.l}: r = ${r === null ? 'n/a' : r.toFixed(2)}`}>
                  {r === null ? '·' : r.toFixed(2).replace('0.', '.').replace('-.', '−.')}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 11.5, color: '#52514e', flexWrap: 'wrap' }}>
        <span>−1</span>
        <div style={{ flex: '0 0 160px', height: 8, borderRadius: 4, background: 'linear-gradient(90deg,#1c5cab,#f0efec,#c23a3a)' }} />
        <span>+1</span>
        <span style={{ marginLeft: 'auto' }}>{hover ? <>{hover.a} × {hover.b}: <b>r = {hover.r === null ? 'n/a' : hover.r.toFixed(2)}</b></> : 'Hover a cell for detail'}</span>
      </div>
    </div>
  );
}

// Taxpayers × rules status grid
export function StatusGrid({ rows, cols, get, onRow, labelWidth = 170 }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="hgrid" style={{ gridTemplateColumns: `${labelWidth}px repeat(${cols.length}, minmax(24px, 1fr))`, minWidth: labelWidth + cols.length * 26 }}>
        <div />
        {cols.map((c) => <div key={c.id} className="cl rot" title={c.title}>{c.id}</div>)}
        {rows.map((r) => (
          <React.Fragment key={r.id}>
            <div className="rl" style={{ cursor: onRow ? 'pointer' : 'default' }} onClick={() => onRow?.(r.id)} title={r.name}>{r.name}</div>
            {cols.map((c) => {
              const v = get(r, c);
              const s = RULE_STATUS[v?.status] || RULE_STATUS.NT;
              return (
                <div key={c.id} className="hc" style={{ background: v ? `${s.color}${v.status === 'Pass' ? '30' : v.status === 'NA' || v.status === 'Info' ? '40' : 'dd'}` : '#f3f2ee', color: v?.status === 'Fail' ? '#fff' : '#3a3a38' }}
                  title={`${r.name}\n${c.id} ${c.title}\n${s.label}${v?.finding ? `\n${v.finding}` : ''}`}>
                  {s.glyph}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Semi-circle risk gauge (SVG)
export function Gauge({ score, band, bands: B = { Moderate: 25, High: 45, Critical: 70 } }) {
  const b = BAND[band] || BAND.Low;
  const R = 84, cx = 110, cy = 100;
  const ang = (v) => Math.PI * (1 - v / 100);
  const pt = (v, r = R) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const arc = (a, z, r = R) => { const [x1, y1] = pt(a, r), [x2, y2] = pt(z, r); return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`; };
  const zones = [[0, B.Moderate, BAND.Low.color, 'Low'], [B.Moderate, B.High, BAND.Moderate.color, 'Moderate'], [B.High, B.Critical, BAND.High.color, 'High'], [B.Critical, 100, BAND.Critical.color, 'Critical']];
  const [nx, ny] = pt(score, R - 22);
  return (
    <svg viewBox="-16 -14 252 158" width="100%" role="img" aria-label={`Risk score ${score} of 100, ${band}`}>
      {zones.map(([a, z, c]) => <path key={a} d={arc(a + 0.6, z - 0.6)} stroke={c} strokeOpacity={score >= a ? 1 : 0.22} strokeWidth="18" fill="none" />)}
      {[0, B.Moderate, B.High, B.Critical, 100].map((v) => {
        const [x1, y1] = pt(v, R + 11), [x2, y2] = pt(v, R + 17);
        const [tx, ty] = pt(v, R + 26);
        return (
          <g key={v}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8d98ae" strokeWidth="1.2" />
            <text x={tx} y={ty + 3} textAnchor="middle" style={{ fontSize: 10, fill: '#54607a', fontFamily: 'var(--mono)' }}>{v}</text>
          </g>
        );
      })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1a2233" strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'all .6s' }} />
      <circle cx={cx} cy={cy} r="7" fill="#1a2233" /><circle cx={cx} cy={cy} r="2.5" fill="#fff" />
      <text x={cx} y={cy + 38} textAnchor="middle" style={{ fontSize: 34, fontWeight: 700, fill: '#1a2233', fontFamily: 'var(--serif)' }}>{score}</text>
      <title>{`${band} review priority: ${score} of 100`}</title>
      <desc>{b.glyph}</desc>
    </svg>
  );
}

// Risk profile radar: shaded rings at 25/50/75/100, one axis per dimension, each labelled with its value.
export function RiskRadar({ data, color = '#3b62c0' }) {
  const W = 440, H = 250, cx = W / 2, cy = H / 2 + 4, R = 86;
  const n = data.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const at = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const ring = (f) => data.map((_, i) => at(i, R * f).join(',')).join(' ');
  const poly = data.map((d, i) => at(i, (R * Math.max(0, Math.min(100, d.v))) / 100).join(',')).join(' ');
  const tone = (v) => (v >= 70 ? '#b02222' : v >= 40 ? '#9c630d' : '#54607a');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={`Risk profile: ${data.map((d) => `${d.dim} ${d.v}`).join(', ')}`}>
      {[1, 0.75, 0.5, 0.25].map((f, k) => <polygon key={f} points={ring(f)} fill={k % 2 ? '#ffffff' : '#f5f7fb'} stroke="#e1e6ef" strokeWidth="1" />)}
      {data.map((_, i) => { const [x, y] = at(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e1e6ef" strokeWidth="1" />; })}
      {[25, 50, 75, 100].map((v) => <text key={v} x={cx + 3} y={cy - (R * v) / 100 + 3} style={{ fontSize: 8.5, fill: '#8d98ae', fontFamily: 'var(--mono)' }}>{v}</text>)}
      <polygon points={poly} fill={color} fillOpacity="0.16" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => { const [x, y] = at(i, (R * Math.max(0, Math.min(100, d.v))) / 100); return <circle key={i} cx={x} cy={y} r="4.5" fill={color} stroke="#fff" strokeWidth="2"><title>{`${d.dim}: ${d.v} / 100`}</title></circle>; })}
      {data.map((d, i) => {
        const [x, y] = at(i, R + 16);
        const c = Math.cos(ang(i));
        const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
        const dy = Math.sin(ang(i)) < -0.5 ? -8 : Math.sin(ang(i)) > 0.5 ? 10 : 0;
        return (
          <text key={d.dim} x={x} y={y + dy} textAnchor={anchor} style={{ fontSize: 11.5, fill: '#54607a' }}>
            {d.dim} <tspan style={{ fontWeight: 700, fill: tone(d.v), fontFamily: 'var(--mono)' }}>{d.v}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
