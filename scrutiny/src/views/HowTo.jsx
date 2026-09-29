import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { HOWTOS } from '../lib/docs.js';

const LABEL = { dashboard: 'Dashboard', data: 'Upload data', cases: 'Cases', taxpayer: 'Taxpayer 360°', notices: 'Notices', scoring: 'Risk scoring', catalog: 'Rules catalogue', report: 'Reports' };
const PUBLIC = new Set(['catalog']);

export default function HowTo({ go, user }) {
  const [q, setQ] = useState('');
  const [area, setArea] = useState('All');
  const areas = ['All', ...new Set(HOWTOS.map((h) => h.area))];
  const list = HOWTOS.filter((h) => (area === 'All' || h.area === area)
    && (!q.trim() || `${h.title} ${h.steps.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())));

  return (
    <div className="site-main" style={user ? { padding: '28px 32px 64px 20px', maxWidth: 1440 } : undefined}>
      <div className="page-head">
        <div>
          <h1>How to</h1>
          <div className="path">{HOWTOS.length} step-by-step tasks</div>
        </div>
        <div className="right">
          <div className="search">
            <Icon name="search" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, e.g. notice, upload" aria-label="Search how-to" />
          </div>
        </div>
      </div>

      <div className="fpills" style={{ marginBottom: 18 }}>
        {areas.map((a) => (
          <button key={a} className={`fpill ${area === a ? 'on' : ''}`} onClick={() => setArea(a)}>
            {a}<span className="n">{a === 'All' ? HOWTOS.length : HOWTOS.filter((h) => h.area === a).length}</span>
          </button>
        ))}
      </div>

      <div className="howto-grid">
        {list.map((h) => (
          <article className="howto" key={h.id} id={`h-${h.id}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="chip">{h.area.toLowerCase()}</span>
              <span className="mono muted" style={{ marginLeft: 'auto', fontSize: 11.5 }}>{h.steps.length} steps</span>
            </div>
            <h4 style={{ marginTop: 12 }}>{h.title}</h4>
            <ol className="steps">{h.steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
            {h.go && (
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <button className="btn soft small" onClick={() => go(user || PUBLIC.has(h.go) ? h.go : 'login')}>
                  {user || PUBLIC.has(h.go) ? `Open ${LABEL[h.go]}` : `Sign in to open ${LABEL[h.go]}`} <Icon name="arrow" size={14} />
                </button>
              </div>
            )}
          </article>
        ))}
        {!list.length && <div className="card empty">No task matches “{q}”.</div>}
      </div>
    </div>
  );
}
