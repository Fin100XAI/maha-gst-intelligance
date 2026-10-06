import React, { useState } from 'react';
import { Kpi, PageHead, SearchBox, BandChip, CaseStatus } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { CASE_STATUS } from '../lib/store.js';
import { BAND } from '../lib/colors.js';
import { inr } from '../lib/format.js';
import { effectiveness, DISPOSITIONS, CLOSURE } from '../engine/verify.js';

const FILTERS = ['All', 'New', 'In review', 'Notice drafted', 'Notice issued', 'Escalated', 'Closed'];

export default function Cases({ data, cases, setCaseStatus, openTaxpayer, openNotice, go }) {
  const [filter, setFilter] = useState('All');
  const [band, setBand] = useState('all');
  const list = data.taxpayers.map((a) => ({ a, c: cases[a.id] || { status: 'New' } }));
  const count = (s) => list.filter((x) => x.c.status === s).length;
  const shown = list.filter((x) => (filter === 'All' || x.c.status === filter) && (band === 'all' || x.a.band === band));
  const hi = list.filter((x) => x.a.band === 'High' || x.a.band === 'Critical').length;
  const openExposure = list.filter((x) => x.c.status !== 'Closed').reduce((s, x) => s + x.a.exposure.confirmed, 0);
  const eff = effectiveness(data.taxpayers, cases);
  const pc = (v) => (v == null ? '-' : `${Math.round(v * 100)}%`);

  return (
    <div className="page">
      <PageHead title="Cases" path={`FY ${data.taxpayers[0]?.fy} · one case per GSTIN`}>
        <SearchBox taxpayers={data.taxpayers} onPick={openTaxpayer} />
        <button className="btn primary" onClick={() => go('data')}><Icon name="plus" size={16} stroke={2.4} /> Add return</button>
      </PageHead>

      <div className="grid g-kpi">
        <Kpi label="High / critical risk" value={hi} dot={hi ? '#b02222' : '#0c6a4a'} sub="Needs officer attention" />
        <Kpi label="Open cases" value={list.length - count('Closed')} sub={`${count('New')} not yet picked up`} />
        <Kpi label="ASMT-10 drafted" value={count('Notice drafted')} sub="Awaiting taxpayer reply" />
        <Kpi label="Open exposure" value={inr(openExposure)} dot={openExposure ? '#b02222' : '#0c6a4a'} sub="Computed, unverified · excl. closed" />
      </div>

      <div className="mt" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="fpills" data-tour="case-filters">
          {FILTERS.map((f) => (
            <button key={f} className={`fpill ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {CASE_STATUS[f]?.label || f}<span className="n">{f === 'All' ? list.length : count(f)}</span>
            </button>
          ))}
        </div>
        <select value={band} onChange={(e) => setBand(e.target.value)} style={{ width: 180, borderRadius: 999, padding: '9px 38px 9px 16px' }} aria-label="Risk band">
          <option value="all">Any risk band</option>
          {Object.keys(BAND).map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <span className="muted" style={{ marginLeft: 'auto' }}>Showing {shown.length} of {list.length}</span>
      </div>

      <div className="tbl-card" data-tour="cases-table">
        <table className="tbl big">
          <thead>
            <tr><th>Taxpayer</th><th>State</th><th>Filing</th><th>Risk</th><th className="num">Exposure</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {shown.sort((x, y) => y.a.score - x.a.score).map(({ a, c }) => (
              <tr key={a.id}>
                <td className="click" style={{ cursor: 'pointer' }} onClick={() => openTaxpayer(a.id)}>
                  <div className="who">{a.name}</div>
                  <div className="sub">{a.gstin}{c.assignee ? ` · ${c.assignee}` : ''}</div>
                </td>
                <td>{a.state}</td>
                <td><span className="mono" style={{ color: 'var(--ink-2)' }}>{a.filing.startsWith('Monthly') ? 'monthly' : a.filing.startsWith('Quarterly') ? 'qrmp' : 'mixed'}</span></td>
                <td><BandChip band={a.band} score={a.score} /></td>
                <td className="num">
                  <div style={{ fontWeight: 600 }}>{inr(a.exposure.confirmed)}</div>
                  {a.exposure.potential > 0 && <div className="muted" style={{ fontSize: 11.5 }}>+{inr(a.exposure.potential)} review</div>}
                </td>
                <td><CaseStatus status={c.status} /></td>
                <td>
                  <div className="row-actions">
                    <button className="btn small" onClick={() => openTaxpayer(a.id)}>Open file</button>
                    {c.status === 'New' && <button className="btn small soft" onClick={() => setCaseStatus(a.id, 'In review')}>Start review</button>}
                    {c.status === 'In review' && <button className="btn small primary" onClick={() => openNotice(a.id)} title="Create scrutiny note: verification pending">Scrutiny note</button>}
                    {['Notice drafted', 'Notice issued', 'Escalated'].includes(c.status) && <button className="btn small primary" onClick={() => openNotice(a.id)}>View notice</button>}
                    {c.status !== 'Closed'
                      ? <button className="btn small danger" onClick={() => setCaseStatus(a.id, 'Closed')}>Close</button>
                      : <button className="btn small" onClick={() => setCaseStatus(a.id, 'In review')}>Reopen</button>}
                  </div>
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="empty">No cases in this view.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card-foot" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
        {Object.keys(CASE_STATUS).map((s) => <CaseStatus key={s} status={s} />)}
        <span style={{ marginLeft: 'auto' }}>Case status and notes are kept in this browser.</span>
      </div>

      <section className="card mt">
        <div className="card-head"><div><h3>Review outcomes</h3><p>How alerts are resolving after officer verification. The console is judged on accuracy and defensibility, not on the number of alerts it raises.</p></div></div>
        {eff.decided === 0 ? <div className="muted">No outcomes recorded yet. Record one per alert under Taxpayer 360° → Rule findings.</div> : (
          <>
            <div className="grid g-kpi">
              <Kpi label="Outcomes recorded" value={eff.decided} sub={DISPOSITIONS.map(([k, l]) => `${l.split(' ')[0].toLowerCase()} ${eff.byCode[k]}`).join(' · ')} />
              <Kpi label="Confirmed rate" value={pc(eff.confirmedRate)} sub="confirmed ÷ outcomes" />
              <Kpi label="False-positive rate" value={pc(eff.falsePositiveRate)} sub="dropped ÷ outcomes" />
              <Kpi label="Value sustained" value={pc(eff.sustainedShare)} sub={`${inr(eff.sustained)} of ${inr(eff.computedDecided)} computed`} />
            </div>
            <div className="grid g-2 mt">
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>By rule (highest false-positive rate first)</div>
                <table className="tbl"><thead><tr><th>Rule</th><th className="num">Outcomes</th><th className="num">Confirmed</th><th className="num">Dropped</th></tr></thead>
                  <tbody>{eff.perRule.slice(0, 8).map((r) => <tr key={r.id}><td className="mono">{r.id}</td><td className="num">{r.n}</td><td className="num">{r.confirmed}</td><td className="num">{r.dropped}</td></tr>)}</tbody></table>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Closures ({eff.closed}; {eff.closedNoDemand} without demand)</div>
                <table className="tbl"><tbody>{CLOSURE.map(([k, l]) => <tr key={k}><td>{l}</td><td className="num">{eff.closureBy[k]}</td></tr>)}</tbody></table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
