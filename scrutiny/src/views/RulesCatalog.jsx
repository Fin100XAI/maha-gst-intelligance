import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Sev, Seg, Tabs, StatusPill } from '../components/ui.jsx';
import { AUTOMATION, FRAUD_DOCS } from '../lib/docs.js';
import { RULE_STATUS, BRAND } from '../lib/colors.js';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function RulesCatalog({ data, user, go }) {
  const { catalog } = data;
  const matrix = data.matrix || { industries: [], applicability: {}, dataSources: [] };
  const [tab, setTab] = useState('rules');
  const [q, setQ] = useState('');
  const [mod, setMod] = useState('all');
  const [sev, setSev] = useState('all');
  const [auto, setAuto] = useState('all');
  const [ind, setInd] = useState('all');
  const [flag, setFlag] = useState('all');
  const [open, setOpen] = useState(() => new Set());

  const modules = useMemo(() => [...new Set(catalog.map((r) => r.module))], [catalog]);
  const flags = useMemo(() => [...new Set(Object.values(matrix.applicability).map((a) => a.flag).filter(Boolean))], [matrix]);
  const isAuto = (id) => !!AUTOMATION[id];
  const rows = catalog.filter((r) => {
    const ap = matrix.applicability[r.id] || { industries: [], flag: null };
    return (mod === 'all' || r.module === mod) && (sev === 'all' || r.severity === sev)
      && (auto === 'all' || (auto === 'auto' ? isAuto(r.id) : !isAuto(r.id)))
      && (ind === 'all' || ap.industries.includes(ind)) && (flag === 'all' || (flag === 'none' ? !ap.flag : ap.flag === flag))
      && (!q.trim() || `${r.id} ${r.check} ${r.legal} ${r.logic} ${r.action} ${r.sources}`.toLowerCase().includes(q.trim().toLowerCase()));
  });
  const grouped = modules.map((m) => ({ m, rs: rows.filter((r) => r.module === m) })).filter((g) => g.rs.length);
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // Portfolio outcome per rule — only after sign-in (it reveals taxpayer results)
  const outcome = (id) => {
    if (!user) return null;
    const rs = data.taxpayers.map((a) => a.results.find((x) => x.id === id)).filter(Boolean);
    return rs.length ? { fail: rs.filter((x) => x.status === 'Fail').length, review: rs.filter((x) => x.status === 'Review').length, n: rs.length } : null;
  };

  const exportCsv = () => {
    const head = ['Rule ID', 'Module', 'Check', 'Legal reference', 'Severity', 'Threshold', 'Logic / test', 'Data sources', 'Exposure basis', 'Action', 'Client flag', 'Industries', 'Automated', 'How automated'];
    const lines = [head, ...catalog.map((r) => {
      const ap = matrix.applicability[r.id] || { industries: [], flag: '' };
      return [r.id, r.module, r.check, r.legal, r.severity, r.threshold, r.logic, r.sources, r.basis, r.action, ap.flag || '', ap.industries.join('; '), isAuto(r.id) ? 'Yes' : 'No', AUTOMATION[r.id]?.test || ''];
    })].map((l) => l.map(csvCell).join(','));
    const url = URL.createObjectURL(new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gst-scrutiny-rules.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const autoCount = catalog.filter((r) => isAuto(r.id)).length;
  const bySev = (s) => catalog.filter((r) => r.severity === s).length;
  const selStyle = { width: 220, borderRadius: 999, padding: '9px 38px 9px 16px' };

  return (
    <div className="site-main" style={user ? { padding: '28px 32px 64px 20px', maxWidth: 1440 } : undefined}>
      <div className="page-head">
        <div>
          <h1>Rules catalogue</h1>
          <div className="path">{catalog.length} checks · {modules.length} modules · {autoCount} automated</div>
        </div>
        <div className="right no-print">
          <button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>
          <button className="btn primary" onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="grid g-kpi">
        <div className="card kpi"><div className="label">Checks</div><div className="value">{catalog.length}</div><div className="sub">{modules.length} modules, A → L</div></div>
        <div className="card kpi"><div className="label">Automated</div><div className="value">{autoCount}<span className="dot" style={{ background: BRAND }} /></div><div className="sub">Tested from returns data</div></div>
        <div className="card kpi"><div className="label">Severity</div><div className="value" style={{ fontSize: 22, gap: 8 }}><Sev s="High" /> {bySev('High')} <Sev s="Med" /> {bySev('Med')} <Sev s="Low" /> {bySev('Low')}</div><div className="sub">High = direct tax exposure likely</div></div>
        <div className="card kpi"><div className="label">Risk indicators</div><div className="value">{FRAUD_DOCS.length}</div><div className="sub">Forensic tests alongside the matrix</div></div>
      </div>

      <div className="no-print">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'rules', label: 'Rule matrix', count: catalog.length },
          { id: 'fraud', label: 'Risk indicators', count: FRAUD_DOCS.length },
          { id: 'appl', label: 'Industry applicability' },
          { id: 'sources', label: 'Data sources', count: matrix.dataSources.length },
        ]} />
      </div>

      {tab === 'rules' && (
        <>
          <div className="no-print" style={{ display: 'grid', gap: 12 }}>
            <div className="fpills">
              <div className="search"><Icon name="search" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search section, keyword, e.g. 16(4), RCM" aria-label="Search rules" /></div>
              <Seg value={sev} onChange={setSev} options={[{ value: 'all', label: 'Any severity' }, { value: 'High', label: 'High' }, { value: 'Med', label: 'Med' }, { value: 'Low', label: 'Low' }]} />
              <Seg value={auto} onChange={setAuto} options={[{ value: 'all', label: 'All' }, { value: 'auto', label: 'Automated' }, { value: 'manual', label: 'Needs books' }]} />
              <select value={ind} onChange={(e) => setInd(e.target.value)} style={selStyle} aria-label="Industry">
                <option value="all">Any industry</option>
                {matrix.industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={flag} onChange={(e) => setFlag(e.target.value)} style={{ ...selStyle, width: 190 }} aria-label="Client flag">
                <option value="all">Any client flag</option>
                <option value="none">No flag needed</option>
                {flags.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="mod-chips">
              <button className={`mod-chip ${mod === 'all' ? 'on' : ''}`} onClick={() => setMod('all')}>All modules <b>{catalog.length}</b></button>
              {modules.map((m) => <button key={m} className={`mod-chip ${mod === m ? 'on' : ''}`} onClick={() => setMod(m)}>{m} <b>{catalog.filter((r) => r.module === m).length}</b></button>)}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="muted">{rows.length} of {catalog.length} rules</span>
              <button className="btn ghost small" style={{ marginLeft: 'auto' }} onClick={() => setOpen(new Set(rows.map((r) => r.id)))}>Expand all</button>
              <button className="btn ghost small" onClick={() => setOpen(new Set())}>Collapse all</button>
            </div>
          </div>

          {grouped.map(({ m, rs }) => (
            <div className="mod-block" key={m}>
              <div className="mh"><h3>{m}</h3><span className="mono muted" style={{ fontSize: 12 }}>{rs.length} rules · {rs.filter((r) => isAuto(r.id)).length} automated</span></div>
              {rs.map((r) => {
                const ap = matrix.applicability[r.id] || { industries: [], flag: null };
                const au = AUTOMATION[r.id];
                const oc = outcome(r.id);
                const isOpen = open.has(r.id);
                return (
                  <div className="rule-card" key={r.id}>
                    <button onClick={() => toggle(r.id)} aria-expanded={isOpen}>
                      <span className="rid">{r.id}</span>
                      <span style={{ minWidth: 0 }}>
                        <div className="rt">{r.check}</div>
                        <div className="rs">{r.legal} · {r.logic}</div>
                      </span>
                      <span className="meta-r">
                        {ap.flag && <span className="chip warn">needs: {ap.flag}</span>}
                        {au ? <span className="chip brand">automated</span> : <span className="chip">needs books</span>}
                        <Sev s={r.severity} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="body">
                        <div className="grid g-3" style={{ gap: 10 }}>
                          <div className="note"><b>Logic / test</b><br />{r.logic}</div>
                          <div className="note"><b>Threshold</b><br />{r.threshold}<br /><b>Exposure basis</b><br />{r.basis}</div>
                          <div className="note"><b>Route only if confirmed after verification</b><br />{r.action}</div>
                        </div>
                        <div className="grid g-2" style={{ gap: 10 }}>
                          <div className="note" style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--line)' }}><b>Legal reference</b> {r.legal}<br /><b>Data sources</b> {r.sources}</div>
                          <div className="note" style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
                            <b>Applies to</b> {ap.industries.length === matrix.industries.length ? 'all industries' : ap.industries.join(', ') || '-'}
                            {ap.flag && <><br /><b>Only if client flag</b> {ap.flag} = Y</>}
                          </div>
                        </div>
                        {au ? (
                          <div className="panel">
                            <div className="eyebrow" style={{ marginBottom: 8 }}>How the console tests it</div>
                            <div className="dl" style={{ marginTop: 0, background: '#fff' }}>
                              <div>test</div><div>{au.test}</div>
                              <div>status rule</div><div>{au.fail}</div>
                              <div>exposure</div><div>{au.exposure}</div>
                              <div>not covered</div><div>{au.gap}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="panel" style={{ display: 'flex', gap: 10, alignItems: 'center' }}><StatusPill status="NT" /><span className="muted">Not testable from the returns extract: needs {r.sources}.</span></div>
                        )}
                        {oc && (
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="eyebrow">Your portfolio</span>
                            <span className="pill" style={{ background: `${RULE_STATUS.Fail.color}1c` }}><span className="g" style={{ background: RULE_STATUS.Fail.color }}>✕</span>{oc.fail} fail</span>
                            <span className="pill" style={{ background: `${RULE_STATUS.Review.color}1c` }}><span className="g" style={{ background: RULE_STATUS.Review.color }}>!</span>{oc.review} review</span>
                            <span className="muted">of {oc.n} taxpayers</span>
                            <button className="btn ghost small no-print" onClick={() => go('rules')}>Open in Rule register <Icon name="arrow" size={14} /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {!grouped.length && <div className="card empty mt">No rule matches these filters.</div>}
        </>
      )}

      {tab === 'fraud' && (
        <div className="tbl-card">
          <table className="tbl big">
            <thead><tr><th>Key</th><th>Signal</th><th>Raised when</th><th>Why it matters</th></tr></thead>
            <tbody>{FRAUD_DOCS.map((f) => <tr key={f.key}><td className="mono" style={{ color: 'var(--brand-ink)' }}>{f.key}</td><td style={{ fontWeight: 600 }}>{f.label}</td><td className="mono" style={{ fontSize: 12 }}>{f.threshold}</td><td>{f.why}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 'appl' && (
        <>
          <div className="card">
            <div className="card-head"><div><h3>Applicable rules by module and industry</h3><p>Count of matrix checks that apply to each industry (from the matrix’s Applicability sheet). Darker = more checks.</p></div></div>
            <div className="tbl-wrap" style={{ maxHeight: 'none' }}>
              <table className="tbl">
                <thead><tr><th>Module</th>{matrix.industries.map((i) => <th key={i} className="num" style={{ whiteSpace: 'normal', minWidth: 80, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>{i}</th>)}</tr></thead>
                <tbody>
                  {[...modules, 'Total'].map((m) => {
                    const rs = m === 'Total' ? catalog : catalog.filter((r) => r.module === m);
                    const max = m === 'Total' ? catalog.length : rs.length;
                    return (
                      <tr key={m}>
                        <td style={{ fontWeight: m === 'Total' ? 700 : 500, whiteSpace: 'nowrap' }}>{m}</td>
                        {matrix.industries.map((i) => {
                          const n = rs.filter((r) => matrix.applicability[r.id]?.industries.includes(i)).length;
                          const t = max ? n / max : 0;
                          return <td key={i} className="heat-cell" style={{ background: n ? `rgba(26,46,94,${0.08 + t * 0.6})` : '#f7f8fb', color: t > 0.6 ? '#fff' : 'var(--ink)' }}>{n || '·'}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card mt">
            <div className="card-head"><div><h3>Rules gated by a client flag</h3><p>These apply only when the client master marks the flag as Y.</p></div></div>
            <div className="dl">
              {catalog.filter((r) => matrix.applicability[r.id]?.flag).map((r) => <React.Fragment key={r.id}><div>{r.id} · {matrix.applicability[r.id].flag}</div><div>{r.check}</div></React.Fragment>)}
            </div>
          </div>
        </>
      )}

      {tab === 'sources' && (
        <div className="tbl-card">
          <table className="tbl big">
            <thead><tr><th>Source</th><th>Key fields</th><th>Used in modules</th><th>In the returns extract?</th></tr></thead>
            <tbody>
              {matrix.dataSources.map((s) => {
                const inExtract = /GSTR-1|GSTR-3B|2A|GSTR-6|ledgers/i.test(s.source);
                return (
                  <tr key={s.source}>
                    <td style={{ fontWeight: 600 }}>{s.source}</td><td>{s.fields}</td><td className="mono">{s.modules}</td>
                    <td>{inExtract ? <span className="chip good">yes</span> : <span className="chip">no: external</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
