import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, StatusPill, Sev, Seg, Tip, Legend, PageHead, axisProps, gridProps, xLab, yLab } from '../components/ui.jsx';
import { SERIES, RULE_STATUS } from '../lib/colors.js';
import { inr } from '../lib/format.js';

export default function RuleRegister({ data, openTaxpayer }) {
  const { catalog, taxpayers } = data;
  const [tp, setTp] = useState('all');
  const [mod, setMod] = useState('all');
  const [cov, setCov] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  const automated = useMemo(() => new Set(taxpayers.flatMap((a) => a.results.map((r) => r.id))), [taxpayers]);
  const modules = [...new Set(catalog.map((r) => r.module))];
  const coverage = modules.map((m) => {
    const rs = catalog.filter((r) => r.module === m);
    const auto = rs.filter((r) => automated.has(r.id)).length;
    return { module: m.replace(/^([A-L])\.\s*/, '$1 · ').slice(0, 30), Automated: auto, 'Needs books / external': rs.length - auto };
  });
  const sel = taxpayers.find((a) => a.id === tp);

  const rows = catalog.filter((r) => (mod === 'all' || r.module === mod)
    && (cov === 'all' || (cov === 'auto' ? automated.has(r.id) : !automated.has(r.id)))
    && (!q || `${r.id} ${r.check} ${r.logic} ${r.legal}`.toLowerCase().includes(q.toLowerCase())));

  const statusFor = (id) => {
    if (sel) return sel.results.find((r) => r.id === id);
    const all = taxpayers.map((a) => a.results.find((r) => r.id === id)).filter(Boolean);
    if (!all.length) return null;
    return { summary: true, fail: all.filter((r) => r.status === 'Fail').length, review: all.filter((r) => r.status === 'Review').length, exposure: all.reduce((s, r) => s + (r.status !== 'Pass' ? r.exposure : 0), 0) };
  };

  return (
    <div className="page">
      <PageHead title="Rule register" path={`${catalog.length} checks · ${automated.size} automated from returns data`}>
        <input type="search" placeholder="Search rule, law, logic…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300, borderRadius: 999 }} aria-label="Search rules" />
      </PageHead>

      <Card title="Automation coverage by module" sub="Rules evaluable from the portal returns extract vs those needing the taxpayer's books or third-party data"
        table={{ columns: ['Module', 'Automated', 'Needs books / external'], rows: coverage.map((c) => [c.module, c.Automated, c['Needs books / external']]) }}
        actions={<Legend items={[{ label: 'Automated', color: SERIES[0] }, { label: 'Needs books / external', color: '#dce3f1' }]} />}>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={coverage} margin={{ left: 0, right: 8, bottom: 4 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="module" {...axisProps} interval={0} angle={-25} textAnchor="end" height={104} tick={{ fill: '#8d98ae', fontSize: 10.5 }} label={xLab('Rule module')} />
            <YAxis {...axisProps} allowDecimals={false} width={56} label={yLab('Number of rules')} />
            <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip />} />
            <Bar dataKey="Automated" stackId="c" fill={SERIES[0]} stroke="#fff" maxBarSize={40} />
            <Bar dataKey="Needs books / external" stackId="c" fill="#dce3f1" stroke="#fff" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="fpills mt" style={{ marginBottom: 14 }}>
        <select value={tp} onChange={(e) => setTp(e.target.value)} aria-label="Taxpayer" style={{ width: 280, borderRadius: 999, padding: '10px 40px 10px 18px' }}>
          <option value="all">All taxpayers (summary)</option>
          {taxpayers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={mod} onChange={(e) => setMod(e.target.value)} aria-label="Module" style={{ width: 280, borderRadius: 999, padding: '10px 40px 10px 18px' }}>
          <option value="all">All modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <Seg value={cov} onChange={setCov} options={[{ value: 'all', label: 'All' }, { value: 'auto', label: 'Automated' }, { value: 'manual', label: 'Needs books' }]} />
        <span className="muted" style={{ marginLeft: 'auto' }}>{rows.length} rules</span>
      </div>

      <div className="tbl-card">
        <div className="tbl-wrap" style={{ maxHeight: 'none', border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr><th>ID</th><th>Check</th><th>Legal ref.</th><th>Severity</th><th>Threshold</th><th>{sel ? 'Status' : 'Portfolio result'}</th><th className="num">Exposure</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = statusFor(r.id);
                const isOpen = open === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className={`click rule-row ${isOpen ? 'sel' : ''}`} onClick={() => setOpen(isOpen ? null : r.id)}>
                      <td>{r.id}</td>
                      <td><div style={{ fontWeight: 600 }}>{r.check}</div><div className="muted" style={{ fontSize: 11 }}>{r.module}</div></td>
                      <td style={{ fontSize: 12 }}>{r.legal}</td>
                      <td><Sev s={r.severity} /></td>
                      <td style={{ fontSize: 12 }}>{r.threshold}</td>
                      <td>
                        {!s ? <StatusPill status="NT" />
                          : s.summary ? (
                            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                              {s.fail > 0 && <span className="pill" style={{ background: `${RULE_STATUS.Fail.color}1c` }}><span className="g" style={{ background: RULE_STATUS.Fail.color }}>✕</span>{s.fail} fail</span>}
                              {s.review > 0 && <span className="pill" style={{ background: `${RULE_STATUS.Review.color}1c` }}><span className="g" style={{ background: RULE_STATUS.Review.color }}>!</span>{s.review} review</span>}
                              {!s.fail && !s.review && <StatusPill status="Pass" />}
                            </span>
                          ) : <StatusPill status={s.status} />}
                      </td>
                      <td className="num">{s && s.exposure ? inr(s.exposure) : '-'}</td>
                    </tr>
                    {isOpen && (
                      <tr><td colSpan={7} className="evidence">
                        <div className="grid g-3" style={{ gap: 10 }}>
                          <div className="note"><b>Logic / test</b><br />{r.logic}</div>
                          <div className="note"><b>Data sources</b><br />{r.sources}<br /><span className="muted">Exposure basis: {r.basis}</span></div>
                          <div className="note"><b>Route only if confirmed after verification</b><br />{r.action}</div>
                        </div>
                        {sel && s?.finding && <div className="note" style={{ marginTop: 10, background: '#fff' }}><b>Finding for {sel.name}:</b> {s.finding}</div>}
                        {!sel && automated.has(r.id) && (
                          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {taxpayers.map((a) => { const x = a.results.find((y) => y.id === r.id); return x && (
                              <button key={a.id} className="btn small" onClick={() => openTaxpayer(a.id)} title={x.finding}>
                                <span style={{ color: RULE_STATUS[x.status].color, fontWeight: 800 }}>{RULE_STATUS[x.status].glyph}</span>{a.name.slice(0, 26)}
                              </button>); })}
                          </div>
                        )}
                        {!automated.has(r.id) && <div className="muted" style={{ marginTop: 8 }}>Not evaluable from the returns extract: requires: {r.sources}.</div>}
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
