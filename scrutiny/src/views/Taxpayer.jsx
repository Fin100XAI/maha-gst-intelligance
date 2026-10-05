import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, LineChart, Line, ComposedChart,
  ScatterChart, Scatter, Treemap, ReferenceLine, LabelList,
} from 'recharts';
import { Card, Kpi, Band, BandChip, CaseStatus, PageHead, SearchBox, Tip, Legend, Tabs, StatusPill, Sev, Seg, DataTable, axisProps, gridProps, xLab, yLab, Rag, InfoTip, TestTag } from '../components/ui.jsx';
import { isTestData } from '../engine/names.js';
import { verifyStep, routeIfConfirmed, raisedIndicators, reviewPrompts, isIssue, confirmBlocked, DISPOSITIONS, DISPOSITION_LABEL, CLOSURE_LABEL } from '../engine/verify.js';
import { buildEvidencePack, downloadFile } from '../lib/evidencePack.js';
import { nowStamp, usePersistent } from '../lib/store.js';
import { verdict } from '../engine/verdict.js';
import Icon from '../components/Icon.jsx';
import { CASE_STATUS, WORKFLOW_STATUSES } from '../lib/store.js';
import Insights from '../components/Insights.jsx';
import Measures from '../components/Measures.jsx';
import BenfordCard from '../components/BenfordCard.jsx';
import RevenueChange from '../components/RevenueChange.jsx';
import { CounterpartyTab } from '../components/Network.jsx';
import { CorrelationMatrix, Gauge, RiskRadar } from '../components/special.jsx';
import { SERIES, STATUS, BAND, RULE_STATUS } from '../lib/colors.js';
import { inr, axisInr, pct, int } from '../lib/format.js';
import EwbTab from '../components/EwbTab.jsx';

const [C1, C2, C3, C4] = SERIES;
const cut = (s, k = 24) => (s && s.length > k ? `${s.slice(0, k - 1)}…` : s || '-');

export default function Taxpayer({ a, initialTab, baselines, network, master, openTaxpayerTab, catalog, taxpayers, onSelect, caseInfo, setCaseStatus, addNote, openNotice, openReport, aiProps, setDisposition, addResponse, logEvent, user, dataGeneratedAt, cfg, severity, ewbSync }) {
  const [tab, setTab] = useState(initialTab || 'recon');
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  // Other screens (e.g. the close-case dialog) can ask for a tab.
  useEffect(() => { const h = (e) => setTab(e.detail); window.addEventListener('gst:tab', h); return () => window.removeEventListener('gst:tab', h); }, []);
  const cat = useMemo(() => Object.fromEntries(catalog.map((r) => [r.id, r])), [catalog]);
  const fails = a.results.filter((r) => r.status === 'Fail').length;
  const reviews = a.results.filter((r) => r.status === 'Review').length;
  const flags = raisedIndicators(a).length;
  const prompts = reviewPrompts(a).length;
  const p = a.profile;
  const v = useMemo(() => verdict(a, cat, caseInfo), [a, cat, caseInfo]);
  // A check picked from the verdict opens on the Rule findings tab; the profile and charts fold away (remembered)
  const [focusRule, setFocusRule] = useState(null);
  const [showDetail, setShowDetail] = usePersistent('gst.tpDetail', false);
  const openRule = (id) => { setFocusRule({ id, at: Date.now() }); setTab('rules'); setTimeout(() => document.querySelector('.tabs-row')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };

  return (
    <div className="page">
      <PageHead title={isTestData(a.gstin, a.fileName) ? <>{a.name} <TestTag /></> : a.name} path={`${a.gstin} · ${a.state} · ${a.filing.toLowerCase()} · FY ${a.fy}`}>
        <SearchBox taxpayers={taxpayers} onPick={onSelect} placeholder="Jump to taxpayer or GSTIN" />
        <button className="btn" onClick={openReport}><Icon name="print" size={16} /> Generate report</button>
        <button className="btn" onClick={openNotice} title="Create scrutiny note: verification pending">Scrutiny note</button>
        {caseInfo.status === 'New' && <button className="btn primary" onClick={() => setCaseStatus(a.id, 'In review')}>Start review</button>}
        {['In review', 'Notice drafted', 'Notice issued', 'Escalated'].includes(caseInfo.status) && <button className="btn primary" onClick={() => setCaseStatus(a.id, 'Closed')}>Close case</button>}
        {caseInfo.status === 'Closed' && <button className="btn primary" onClick={() => setCaseStatus(a.id, 'In review')}>Reopen case</button>}
      </PageHead>

      <section className={`card tp-verdict ${v.tone}`} aria-label="Verdict">
        <div className="tpv-line"><span className="tpv-dot" /><b>{v.line}</b> <span className="muted">{v.next}</span></div>
        {v.actions.length > 0 && (
          <ol className="tpv-actions">
            {v.actions.map((x) => (
              <li key={x.ruleId}><button className="link-btn" onClick={() => openRule(x.ruleId)}><span className="mono">{x.ruleId}</span> {x.check}</button><span className="muted"> · {x.todo}{x.amount ? ` · ${inr(x.amount)}` : ''}</span></li>
            ))}
          </ol>
        )}
      </section>

      <details className="tp-detail" open={showDetail} onToggle={(e) => setShowDetail(e.currentTarget.open)}>
        <summary>Profile, risk score and measures</summary>
      <div className="tp-top">
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="tag">{a.gstin}</span>
            <CaseStatus status={caseInfo.status} />
            {caseInfo.assignee && <span className="chip">assignee: {caseInfo.assignee}</span>}
          </div>
          <div className="facts">
            <div className="f"><div className="l">Turnover · 3B</div><div className="v">{inr(p.turnover)}</div></div>
            <div className="f"><div className="l">Output tax</div><div className="v">{inr(p.outputTax)}</div></div>
            <div className="f"><div className="l">ITC claimed</div><div className="v">{inr(p.itcClaimed)}</div></div>
            <div className="f"><div className="l">Paid in cash</div><div className="v">{inr(p.cashPaid)} <span className="muted" style={{ fontSize: 12.5, fontWeight: 500 }}>{pct(p.cashPct)}</span></div></div>
            <div className="f"><div className="l">Customers · suppliers</div><div className="v">{int(p.customers)} / {int(p.suppliers)}</div></div>
            <div className="f"><div className="l">Returns filed late</div><div className="v">{p.latePeriods} of {p.periodsFiled}</div></div>
          </div>
          <div className="tp-src" title={a.fileName}>Source: {a.fileName}</div>
        </section>
        <section className="card tp-risk">
          <div style={{ display: 'flex', alignItems: 'center' }}><div className="eyebrow">Risk score</div><button className="link-btn" style={{ marginLeft: 'auto', marginRight: 6 }} onClick={() => { setTab('fraud'); setTimeout(() => document.querySelector('.tabs-row')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} title="Opens the Risk indicators tab below: each forensic test (circular trading, non-filing suppliers, Benford, e-way-bill splitting and others) with its measured value. Leads for enquiry, not proof.">{flags} of {a.fraud.filter((f) => !f.prompt).length} risk indicators raised{prompts ? ` · ${prompts} review prompt${prompts > 1 ? 's' : ''}` : ''} →</button>
            <InfoTip title="Risk score">
              <p><b>Gauge:</b> the review-priority score (0 to 100) with the band thresholds from your Risk scoring settings. The needle and colour show the band. It sets the order of review, not whether action is justified.</p>
              <p><b>Radar:</b> risk by area, each 0 to 100: the average over that area's checks, counting a failed check as 1 and a review check as 0.4 (e.g. 2 failed and 1 review out of 6 checks = 40). "Risk indicators" is the share of forensic indicators raised, scaled by 1.8 and capped at 100. Points further out mean more issues in that area.</p>
              <p><b>Risk indicators link:</b> how many of the forensic tests fired (circular trading, non-filing suppliers, Benford, e-way-bill splitting and others). They are leads for enquiry, not proof. Review prompts such as a turnover spike are shown but not scored.</p>
            </InfoTip></div>
          <div className="tp-risk-body">
            <div className="tp-gauge"><Gauge score={a.score} band={a.band} bands={cfg?.bands} /><BandChip band={a.band} />
              <div className="tp-bands">{[['Low', 0, cfg?.bands.Moderate], ['Moderate', cfg?.bands.Moderate, cfg?.bands.High], ['High', cfg?.bands.High, cfg?.bands.Critical], ['Critical', cfg?.bands.Critical, 100]].map(([k, lo, hi]) => <span key={k}><i style={{ background: BAND[k].color }} />{k} {k === 'Low' ? `<${hi}` : k === 'Critical' ? `${lo}+` : `${lo}–${hi - 1}`}</span>)}</div></div>
            <div className="tp-radar">
              <RiskRadar data={a.charts.radar} color={C1} />
            </div>
          </div>
        </section>
      </div>

      <Measures a={a} caseInfo={caseInfo} taxpayers={taxpayers} cfg={cfg} severity={severity} />
      </details>

      <div className="grid g-kpi mt">
        <Kpi label="Computed exposure" value={inr(a.exposure.confirmed)} dot={a.exposure.confirmed ? '#b02222' : '#0c6a4a'} sub={`${fails} checks with exceptions · unverified`} />
        <Kpi label="Under review" value={inr(a.exposure.potential)} sub={`${reviews} checks flagged · unverified`} />
        <Kpi label="GSTR-1 vs 3B gap" value={inr(a.periodRecon.reduce((s, r) => s + r.taxGap, 0))} sub="+ve = short-paid in 3B" />
        <Kpi label="ITC over 2B" value={inr(a.periodRecon.reduce((s, r) => s + r.itcGap, 0))} sub="+ve = claimed beyond 2B" />
      </div>

      {!aiProps?.hidden && <div className="mt"><Insights scope="taxpayer" a={a} data={{ catalog, taxpayers }} compact {...aiProps} /></div>}

      <div className="tabs-row">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'recon', label: 'Reconciliation' },
          { id: 'trade', label: 'Trade patterns' },
          { id: 'revenue', label: 'Revenue change' },
          { id: 'network', label: 'Counterparties' },
          { id: 'ewb', label: 'E-way bills', count: a.ewb ? (a.ewb.outward.unmatched.count + a.ewb.inward.unsupported.count + a.ewb.shipTo.wrongHead.count + a.ewb.vehicles.clashes) || undefined : undefined },
          { id: 'fraud', label: 'Risk indicators', count: flags },
          { id: 'rules', label: 'Rule findings', count: a.results.filter(isIssue).filter((r) => !caseInfo.dispositions?.[r.id]).length || undefined },
          { id: 'case', label: 'Case file', count: (caseInfo.notes || []).length },
        ]} />
        {aiProps?.hidden && <button className="btn small" onClick={() => aiProps.setHidden(false)}><Icon name="rules" size={14} /> Show key insights</button>}
      </div>

      {tab === 'recon' && <Recon a={a} />}
      {tab === 'trade' && <Trade a={a} />}
      {tab === 'revenue' && <RevenueChange baselines={baselines} />}
      {tab === 'network' && <CounterpartyTab g={network} master={master} gstin={a.gstin} fy={a.fy} open={(x) => openTaxpayerTab(x, 'network')} />}
      {tab === 'ewb' && <EwbTab a={a} reload={ewbSync?.reload} toast={ewbSync?.toast} />}
      {tab === 'fraud' && <Fraud a={a} />}
      {tab === 'rules' && <Findings a={a} focus={focusRule} cat={cat} caseInfo={caseInfo} setDisposition={setDisposition} logEvent={logEvent} user={user} dataGeneratedAt={dataGeneratedAt} />}
      {tab === 'case' && <CaseFile a={a} caseInfo={caseInfo} setCaseStatus={setCaseStatus} addNote={addNote} addResponse={addResponse} openNotice={openNotice} />}
    </div>
  );
}

/* ================================================================ Reconciliation */
function Recon({ a }) {
  const R = a.periodRecon;
  const gapFill = (v) => (v > 0 ? STATUS.critical : '#8fb3e0');
  return (
    <>
      <div className="grid g-2">
        <Card title="Outward tax: GSTR-1 vs GSTR-3B" sub="Tax on outward supplies per 3B period (GSTR-1 includes B2B, B2C, credit/debit notes)"
          table={{ columns: ['Period', 'GSTR-1 tax', 'GSTR-3B tax', 'Gap'], rows: R.map((r) => [r.label, r.g1Tax, r.g3bTax, r.taxGap]) }}
          actions={<Legend items={[{ label: 'GSTR-1', color: C1 }, { label: 'GSTR-3B', color: C2 }]} />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={R} margin={{ left: 4, right: 8 }} barGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} height={40} label={xLab('Return period')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Tax (₹)')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="g1Tax" name="GSTR-1" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="g3bTax" name="GSTR-3B" fill={C2} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={132}>
            <BarChart data={R} margin={{ left: 4, right: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={false} axisLine={false} height={22} label={xLab('Return period')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Gap (₹)')} />
              <ReferenceLine y={0} stroke="#c3c2b7" />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="taxGap" name="Gap (1 − 3B)" radius={[3, 3, 3, 3]} maxBarSize={26}>{R.map((r) => <Cell key={r.p} fill={gapFill(r.taxGap)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="card-foot">Lower panel: red = short payment in 3B, blue = 3B higher than GSTR-1.</div>
        </Card>

        <Card title="ITC: GSTR-3B claim vs GSTR-2B vs GSTR-2A" sub="3B claim = 4A(4)+4A(5) − 4B(2); 2B eligible = B2B available + ISD ± supplier notes"
          table={{ columns: ['Period', '3B claimed', '2B eligible', '2A', 'Excess over 2B'], rows: R.map((r) => [r.label, r.itcClaim, r.itc2b, r.itc2a, r.itcGap]) }}
          actions={<Legend items={[{ label: '3B claimed', color: C1 }, { label: '2B eligible', color: C3 }, { label: '2A', color: C4 }]} />}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={R} margin={{ left: 4, right: 8 }} barGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} height={40} label={xLab('Return period')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('ITC (₹)')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="itcClaim" name="3B claimed" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="itc2b" name="2B eligible" fill={C3} radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="itc2a" name="2A" fill={C4} radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={132}>
            <BarChart data={R} margin={{ left: 4, right: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={false} axisLine={false} height={22} label={xLab('Return period')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Excess (₹)')} />
              <ReferenceLine y={0} stroke="#c3c2b7" />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="itcGap" name="Excess over 2B" radius={[3, 3, 3, 3]} maxBarSize={26}>{R.map((r) => <Cell key={r.p} fill={gapFill(r.itcGap)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="card-foot">Lower panel: red = ITC claimed beyond 2B (s.16(2)(aa)); blue = 2B credit not yet availed.</div>
        </Card>
      </div>

      <div className="grid g-2 mt">
        <Card title="How liability was discharged" sub="Output tax per period paid through ITC vs cash (Rule 86B needs ≥1% cash above ₹50 L/month)"
          table={{ columns: ['Period', 'Liability', 'Via ITC', 'Cash'], rows: R.map((r) => [r.label, r.liability, r.itcUsed, r.cash]) }}
          actions={<Legend items={[{ label: 'Via ITC', color: C1 }, { label: 'Cash', color: C3 }]} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={R} margin={{ left: 4, right: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} height={40} label={xLab('Return period')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Tax paid (₹)')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="itcUsed" name="Via ITC" stackId="d" fill={C1} stroke="#fff" strokeWidth={1} maxBarSize={34} />
              <Bar dataKey="cash" name="Cash" stackId="d" fill={C3} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Filing timeliness" sub="GSTR-3B filing date (from liability ledger) vs statutory due date"
          table={{ columns: ['Period', 'Due', 'Filed', 'Delay (days)', 'Interest paid', 'Late fee paid'], rows: R.map((r) => [r.label, r.dueOn, r.filedOn || '-', r.delay ?? '-', r.interestPaid, r.lateFeePaid]) }}
          actions={<Legend items={[{ label: 'On time', color: STATUS.good }, { label: 'Late', color: STATUS.serious }]} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={R.map((r) => ({ ...r, d: r.delay ?? 0, show: Math.max(r.delay ?? 0, 0.25) }))} margin={{ left: 4, right: 8, top: 18 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} height={40} label={xLab('Return period')} />
              <YAxis {...axisProps} allowDecimals={false} width={52} label={yLab('Days late')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={({ active, payload }) => active && payload?.length ? (
                <div className="tt"><div className="h">{payload[0].payload.label}</div>
                  <div className="r">Due<b>{payload[0].payload.dueOn}</b></div><div className="r">Filed<b>{payload[0].payload.filedOn || '-'}</b></div>
                  <div className="r">Delay<b>{payload[0].payload.d} days</b></div></div>) : null} />
              <Bar dataKey="show" name="Delay" radius={[4, 4, 0, 0]} maxBarSize={30}>
                {R.map((r) => <Cell key={r.p} fill={r.delay > 0 ? STATUS.serious : STATUS.good} />)}
                <LabelList dataKey="d" position="top" style={{ fontSize: 11, fill: '#52514e' }} formatter={(v) => (v ? `${v}d` : '')} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="mt" title="Period reconciliation sheet" sub="All figures in ₹. Periods follow the taxpayer's GSTR-3B frequency.">
        <DataTable columns={['Period', 'G1 taxable', '3B taxable', 'G1 tax', '3B tax', 'Tax gap', '3B ITC', '2B ITC', 'ITC excess', 'RCM tax', 'Cash', 'Filed', 'Delay']}
          rows={R.map((r) => [r.label, r.g1Taxable, r.g3bTaxable, r.g1Tax, r.g3bTax, r.taxGap, r.itcClaim, r.itc2b, r.itcGap, r.rcmTax, r.cash, r.filedOn || '-', r.delay ?? '-'])} />
      </Card>
    </>
  );
}

/* ================================================================ Trade patterns */
function Trade({ a }) {
  const c = a.charts;
  const M = a.monthly;
  const scatter = M.filter((m) => m.outTaxable || m.inTaxable);
  const rCell = a.correlation.cells.find((x) => x.a === 'outTaxable' && x.b === 'inTaxable');
  const mixTotal = c.outwardMix.reduce((s, x) => s + x.value, 0);
  const itcTotal = c.itcComposition.reduce((s, x) => s + x.value, 0);
  const supData = c.topSuppliers.list.map((s) => ({ ...s, label: cut(s.name, 26) }));
  const cusData = c.topCustomers.list.map((s) => ({ ...s, label: cut(s.name, 26) }));
  return (
    <>
      <div className="grid g-21">
        <Card title="Monthly outward vs inward value" sub="Outward = GSTR-1 (B2B + B2C) by month · Inward = GSTR-2A by supplier filing month"
          table={{ columns: ['Month', 'Outward taxable', 'Inward taxable', 'Credit notes'], rows: M.map((m) => [m.label, m.outTaxable, m.inTaxable, m.cnValue]) }}
          actions={<Legend items={[{ label: 'Outward', color: C1, line: true }, { label: 'Inward (2A)', color: C2, line: true }]} />}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={M} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} height={40} label={xLab('Month')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Taxable value (₹)')} />
              <Tooltip content={<Tip fmt={(v) => inr(v)} />} cursor={{ stroke: '#c3c2b7' }} />
              <Line type="monotone" dataKey="outTaxable" name="Outward" stroke={C1} strokeWidth={2} dot={{ r: 3.5, fill: C1, stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="inTaxable" name="Inward (2A)" stroke={C2} strokeWidth={2} dot={{ r: 3.5, fill: C2, stroke: '#fff', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Purchases ↔ sales correlation" sub={`Each dot is a month. r = ${rCell?.r == null ? 'n/a' : rCell.r.toFixed(2)}: traders & manufacturers normally show a strong positive link.`}
          table={{ columns: ['Month', 'Inward', 'Outward'], rows: scatter.map((m) => [m.label, m.inTaxable, m.outTaxable]) }}>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e7ebf3" />
              <XAxis type="number" dataKey="inTaxable" name="Inward" tickFormatter={axisInr} {...axisProps} height={40} label={xLab('Inward taxable, GSTR-2A (₹)')} />
              <YAxis type="number" dataKey="outTaxable" name="Outward" tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Outward taxable (₹)')} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="tt"><div className="h">{payload[0].payload.label}</div><div className="r">Inward<b>{inr(payload[0].payload.inTaxable)}</b></div><div className="r">Outward<b>{inr(payload[0].payload.outTaxable)}</b></div></div>) : null} />
              <Scatter data={scatter} fill={C1} stroke="#fff" strokeWidth={2} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid g-3 mt">
        <Card title="Outward supply mix" sub="Taxable value by supply type" table={{ columns: ['Type', 'Taxable'], rows: c.outwardMix.map((x) => [x.name, x.value]) }}>
          <Donut data={c.outwardMix} total={mixTotal} />
        </Card>
        <Card title="ITC composition (3B Table 4A)" table={{ columns: ['Source', 'ITC'], rows: c.itcComposition.map((x) => [x.name, x.value]) }}>
          {c.itcComposition.length ? <Donut data={c.itcComposition} total={itcTotal} /> : <div className="empty">No ITC claimed</div>}
        </Card>
        <Card title="Sales by tax rate" sub="Taxable value by GST rate slab" table={{ columns: ['Rate', 'Taxable'], rows: c.rateMix.map((x) => [x.name, x.value]) }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={c.rateMix} margin={{ left: 0, right: 8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} height={40} label={xLab('GST rate')} />
              <YAxis tickFormatter={axisInr} {...axisProps} width={70} label={yLab('Taxable value (₹)')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="value" name="Taxable" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid g-2 mt">
        <Card title="Top suppliers (GSTR-2B)" sub={`${c.topSuppliers.count} suppliers · top 10 = ${pct(c.topSuppliers.list.reduce((s, x) => s + x.share, 0), 0)} of purchases`}
          table={{ columns: ['Supplier', 'GSTIN', 'Taxable', 'ITC', 'Share', '3B filed?'], rows: c.topSuppliers.list.map((s) => [s.name, s.key, s.value, s.tax, pct(s.share), s.nonFiler ? 'NO' : 'Yes']) }}
          actions={<Legend items={[{ label: 'Supplier', color: C1 }, { label: '3B not filed', color: STATUS.critical }]} />}>
          <HBar data={supData} colorOf={(d) => (d.nonFiler ? STATUS.critical : C1)} yTitle="Supplier" />
        </Card>
        <Card title="Top customers (GSTR-1 B2B)" sub={`${c.topCustomers.count} customers · top 10 = ${pct(c.topCustomers.list.reduce((s, x) => s + x.share, 0), 0)} of B2B sales`}
          table={{ columns: ['Customer', 'GSTIN', 'Taxable', 'Tax', 'Share', 'Invoices'], rows: c.topCustomers.list.map((s) => [s.name, s.key, s.value, s.tax, pct(s.share), s.invoices]) }}>
          <HBar data={cusData} colorOf={() => C1} yTitle="Customer" />
        </Card>
      </div>

      <div className="grid g-21 mt">
        <Card title="HSN mix (GSTR-1 Table 12)" sub="Area = taxable value per HSN" table={{ columns: ['HSN', 'Taxable'], rows: c.hsnTop.map((h) => [h.name, h.value]) }}>
          {c.hsnTop.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <Treemap data={c.hsnTop.map((h, i) => ({ ...h, fill: SERIES[i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 6] }))} dataKey="value" nameKey="name" stroke="#fff" isAnimationActive={false}
                content={<TreeCell />}>
                <Tooltip content={<Tip title={(pl) => pl.name} fmt={(v) => inr(v)} />} />
              </Treemap>
            </ResponsiveContainer>
          ) : <div className="empty">No HSN summary filed</div>}
        </Card>
        <Card title="Place of supply" sub="Outward taxable value by destination state" table={{ columns: ['State', 'Taxable'], rows: c.posStates.map((s) => [s.name, s.value]) }}>
          <HBar data={c.posStates.map((s) => ({ ...s, label: cut(s.name, 20) }))} colorOf={() => C3} height={280} width={130} yTitle="Place of supply (state)" />
        </Card>
      </div>
    </>
  );
}

function Donut({ data, total }) {
  return (
    <>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={data.length > 1 ? 1.5 : 0} stroke="#fff" strokeWidth={2}>
              {data.map((d, i) => <Cell key={d.name} fill={SERIES[i]} />)}
            </Pie>
            <Tooltip content={<Tip title={(pl) => pl.name} fmt={(v) => `${inr(v)} · ${pct(v / total, 1)}`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{inr(total)}</div>
        </div>
      </div>
      <Legend items={data.map((d, i) => ({ label: `${d.name} · ${pct(d.value / total, 0)}`, color: SERIES[i] }))} />
    </>
  );
}

function HBar({ data, colorOf, height, width = 170, xTitle = 'Taxable value (₹)', yTitle = '' }) {
  return (
    <ResponsiveContainer width="100%" height={(height || Math.max(200, data.length * 28 + 30)) + 16}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 48 }} barCategoryGap={5}>
        <CartesianGrid {...gridProps} horizontal={false} vertical />
        <XAxis type="number" tickFormatter={axisInr} {...axisProps} height={40} label={xLab(xTitle)} />
        <YAxis type="category" dataKey="label" width={width + 32} {...axisProps} tick={{ fill: '#54607a', fontSize: 11.5 }} label={yLab(yTitle)} />
        <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip title={(pl) => pl.name} fmt={(v, pl) => `${inr(v)}${pl.payload.share ? ` · ${pct(pl.payload.share)}` : ''}`} />} />
        <Bar dataKey="value" name="Taxable" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((d) => <Cell key={d.key} fill={colorOf(d)} />)}
          <LabelList dataKey="share" position="right" formatter={(v) => (v ? pct(v, 0) : '')} style={{ fontSize: 11, fill: '#52514e' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TreeCell(props) {
  const { x, y, width, height, name, value, fill } = props;
  if (width < 2 || height < 2) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} fillOpacity={0.88} stroke="#fff" strokeWidth={2} />
      {width > 80 && height > 34 && (
        <>
          <text x={x + 8} y={y + 18} fill="#fff" style={{ fontSize: 11.5, fontWeight: 600 }}>{String(name).slice(0, Math.floor(width / 7))}</text>
          <text x={x + 8} y={y + 33} fill="#ffffffd0" style={{ fontSize: 11 }}>{inr(value)}</text>
        </>
      )}
    </g>
  );
}

/* ================================================================ Risk indicators (engine key: fraud) */
function Fraud({ a }) {
  const c = a.charts;
  const d = a.fraudDetail;
  const [bSide, setBSide] = useState('out');
  const bf = bSide === 'out' ? d.benfordOut : d.benfordIn;
  return (
    <>
      <div className="callout info mb"><Icon name="alert" size={18} style={{ flexShrink: 0, marginTop: 2 }} /><div><b>Risk indicators: verification required.</b> These are statistical and pattern-based leads for enquiry, not proof of evasion, suppression or intent. Corroborate with transaction, movement, banking, e-way bill, e-invoice, stock or service-delivery and counterparty evidence before relying on any of them.</div></div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
        {a.fraud.map((f) => (
          <div key={f.key} className={`ind ${f.flagged && !f.prompt ? 'on' : ''}`}>
            <div className="ic" style={{ background: f.flagged ? (f.prompt ? STATUS.warning : STATUS.critical) : STATUS.good }}>{f.flagged ? (f.prompt ? '?' : '!') : '✓'}</div>
            <div>
              <div className="t">{f.label}{f.prompt && <span className="chip" style={{ marginLeft: 6 }}>{f.flagged ? 'review prompt · not scored' : 'prompt · not scored'}</span>}</div>
              <div className="v">{f.value}</div>
              <div className="w">{f.why}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid g-2 mt">
        <BenfordCard bf={bf} side={bSide} setSide={setBSide} />

        <Card title="Invoice value distribution" sub="Count of invoices by value band: watch for pile-ups just under ₹50K (e-way bill threshold)"
          table={{ columns: ['Band', 'Sales invoices', 'Purchase invoices'], rows: c.valueHist.map((h) => [h.bucket, h.sales, h.purchases]) }}
          actions={<Legend items={[{ label: 'Sales', color: C1 }, { label: 'Purchases', color: C2 }]} />}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={c.valueHist} margin={{ left: 0, right: 8 }} barGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" {...axisProps} interval={0} tick={{ fill: '#898781', fontSize: 10.5 }} height={40} label={xLab('Invoice value band (₹)')} />
              <YAxis {...axisProps} width={56} allowDecimals={false} label={yLab('Number of invoices')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip />} />
              <Bar dataKey="sales" name="Sales" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="purchases" name="Purchases" fill={C2} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid g-2 mt">
        <Card title="Circular trading check" sub={`Parties that are both customer and supplier (${d.mirror.length} shown). Similar values both ways = possible round-tripping.`}
          table={{ columns: ['Party', 'GSTIN', 'Sold to', 'Bought from'], rows: d.mirror.map((m) => [m.party, m.g, m.sold, m.bought]) }}
          actions={<Legend items={[{ label: 'Sold to', color: C1 }, { label: 'Bought from', color: C2 }]} />}>
          {d.mirror.length ? (
            <ResponsiveContainer width="100%" height={Math.max(200, d.mirror.length * 34 + 30)}>
              <BarChart data={d.mirror.map((m) => ({ ...m, label: cut(m.party, 24) }))} layout="vertical" margin={{ left: 4, right: 16 }} barGap={1} barCategoryGap={6}>
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" tickFormatter={axisInr} {...axisProps} scale="sqrt" height={40} label={xLab('Taxable value (₹, square-root scale)')} />
                <YAxis type="category" dataKey="label" width={190} {...axisProps} tick={{ fill: '#54607a', fontSize: 11.5 }} label={yLab('Party')} />
                <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip title={(pl) => pl.party} fmt={(v) => inr(v)} />} />
                <Bar dataKey="sold" name="Sold to" fill={C1} radius={[0, 3, 3, 0]} maxBarSize={12} />
                <Bar dataKey="bought" name="Bought from" fill={C2} radius={[0, 3, 3, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty">No party appears on both sides.</div>}
          <div className="card-foot">Square-root scale so small parties stay visible.</div>
        </Card>

        <Card title="Invoice day-of-week" sub="Sunday / holiday clusters in B2B trade can point to back-dated paper invoices"
          table={{ columns: ['Day', 'Sales', 'Purchases'], rows: c.weekday.map((w) => [w.day, w.sales, w.purchases]) }}
          actions={<Legend items={[{ label: 'Sales', color: C1 }, { label: 'Purchases', color: C2 }]} />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={c.weekday} margin={{ left: 0, right: 8 }} barGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="day" {...axisProps} height={40} label={xLab('Day of week (invoice date)')} />
              <YAxis {...axisProps} width={56} allowDecimals={false} label={yLab('Number of invoices')} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip />} />
              <Bar dataKey="sales" name="Sales" fill={C1} radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="purchases" name="Purchases" fill={C2} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid g-2 mt">
        <Card title="Monthly correlation matrix" sub={`Pearson r across ${a.correlation.n} active months. Weak purchase ↔ sale links, or suppliers moving independently of sales, merit a look.`}>
          <CorrelationMatrix keys={a.correlation.keys} cells={a.correlation.cells} labelWidth={140} />
        </Card>
        <div className="grid" style={{ alignContent: 'start' }}>
          <Card title="In GSTR-2A but not in GSTR-2B" sub={`${int(c.in2aNot2b.count)} invoices · ITC ${inr(c.in2aNot2b.tax)}: supplier filed after the 2B cut-off; claim must wait for the next 2B.`}>
            <DataTable columns={['Supplier', 'Invoice', 'Date', '2A month', 'Supplier G1 filed', 'Tax']} rows={c.in2aNot2b.rows} max={220} total={c.in2aNot2b.count} />
          </Card>
          <Card title="Payment challans" sub="Expired / failed challans indicate abandoned payment attempts">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, c.challanStats.length)}, minmax(0,1fr))`, gap: 10 }}>
              {c.challanStats.map((s) => (
                <div key={s.name} className="note" style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: s.name === 'PAID' ? '#006300' : s.name === 'FAILED' ? STATUS.critical : '#8a5a00' }}>{s.count}</div>
                  <div style={{ fontSize: 11.5 }}>{s.name}</div><div className="muted" style={{ fontSize: 11 }}>{inr(s.amount)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ================================================================ Rule findings */
function Findings({ a, focus, cat, caseInfo, setDisposition, logEvent, user, dataGeneratedAt }) {
  const disp = caseInfo.dispositions || {};
  const pack = async (r) => {
    const p = await buildEvidencePack({ a, rule: cat[r.id], result: r, caseInfo, user, generatedAt: nowStamp(), dataGeneratedAt });
    downloadFile(p.fileName, p.html);
    logEvent(a.id, `Evidence pack downloaded: ${r.id} · SHA-256 ${p.hash.slice(0, 16)}…`);
  };
  const [filter, setFilter] = useState('issues');
  const [open, setOpen] = useState(focus?.id || null);
  useEffect(() => { if (focus) { setFilter('issues'); setOpen(focus.id); } }, [focus]);
  const order = { Fail: 0, Review: 1, Info: 2, Pass: 3, NA: 4 };
  const sevRank = { High: 0, Med: 1, Low: 2 };
  const rows = a.results
    .filter((r) => (filter === 'issues' ? r.status === 'Fail' || r.status === 'Review' : filter === 'all' ? true : r.status === filter))
    .sort((x, y) => order[x.status] - order[y.status] || sevRank[cat[x.id]?.severity] - sevRank[cat[y.id]?.severity] || y.exposure - x.exposure);
  return (
    <Card title="Automated rule findings" sub="Preliminary computational exceptions. Click a row for the evidence, legal reference and the verification needed before any action."
      actions={<Seg value={filter} onChange={setFilter} options={[{ value: 'issues', label: 'Issues' }, { value: 'Fail', label: 'Fail' }, { value: 'Review', label: 'Review' }, { value: 'Pass', label: 'Pass' }, { value: 'all', label: 'All' }]} />}>
      <div className="tbl-wrap" style={{ maxHeight: 'none' }}>
        <table className="tbl">
          <thead><tr><th>Rule</th><th>Check</th><th>Severity</th><th>Status</th><th>Metric</th><th className="num">Computed</th><th>Officer outcome</th><th style={{ width: '38%' }}>Finding</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const c = cat[r.id] || {};
              const isOpen = open === r.id;
              return (
                <React.Fragment key={r.id}>
                  <tr className={`click rule-row ${isOpen ? 'sel' : ''}`} onClick={() => setOpen(isOpen ? null : r.id)}>
                    <td>{r.id}</td>
                    <td><div style={{ fontWeight: 600 }}>{c.check}</div><div className="muted" style={{ fontSize: 11 }}>{c.module}</div></td>
                    <td><Sev s={c.severity || 'Med'} /></td>
                    <td><StatusPill status={r.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.rag ? <Rag rag={r.rag} /> : r.metric || '-'}</td>
                    <td className="num" style={{ fontWeight: r.exposure ? 600 : 400 }}>{r.exposure ? inr(r.exposure) : '-'}</td>
                    <td>{isIssue(r) ? <span className={`disp ${disp[r.id]?.code || 'pending'}`}>{disp[r.id] ? DISPOSITION_LABEL[disp[r.id].code] : 'Pending'}</span> : <span className="muted">-</span>}</td>
                    <td style={{ lineHeight: 1.45 }}><span className={isOpen ? '' : 'clamp-2'} title={isOpen ? undefined : r.finding}>{r.finding}</span></td>
                  </tr>
                  {isOpen && (
                    <tr><td colSpan={8} className="evidence">
                      {isIssue(r) && <OutcomeForm key={`${r.id}-${disp[r.id]?.at || 'new'}`} r={r} current={disp[r.id]} onSave={(code, note) => setDisposition(a.id, r.id, code, note)} />}
                      <div className="grid g-3" style={{ marginBottom: 10, gap: 10 }}>
                        <div className="note"><b>Legal reference</b><br />{c.legal || '-'}</div>
                        <div className="note"><b>Test (matrix)</b><br />{c.logic || '-'} <span className="muted">Threshold: {c.threshold || '-'}</span></div>
                        <div className="note verify-note"><b>Verify before any action: {verifyStep(r.id)[0]}</b><br />{verifyStep(r.id)[1]}<br /><span className="muted">Route only if confirmed: {routeIfConfirmed(r, c.action)} · Exposure basis: {c.basis || '-'}</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 8px', flexWrap: 'wrap' }}>
                        <button className="btn small" onClick={() => pack(r)}><Icon name="download" size={14} /> Evidence pack</button>
                        <span className="muted" style={{ fontSize: 12 }}>Self-contained HTML with the rule, source data, exception rows and officer record, fingerprinted with SHA-256. Each download is logged.</span>
                      </div>
                      {r.evidence ? <DataTable columns={r.evidence.columns} rows={r.evidence.rows} total={r.evidence.total} max={1000} /> : <div className="muted">No line-level evidence for this check.</div>}
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {!rows.length && <tr><td colSpan={8} className="empty">Nothing in this filter.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card-foot" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(RULE_STATUS).filter(([k]) => k !== 'NT').map(([k, v]) => <span key={k}><StatusPill status={k} /></span>)}
        <span style={{ marginLeft: 'auto' }}>Exposure is a system computation (₹) from returns data, not a confirmed liability; it excludes interest and penalty unless stated.</span>
      </div>
    </Card>
  );
}

/* ================================================================ Case file */
function CaseFile({ a, caseInfo, setCaseStatus, addNote, addResponse, openNotice }) {
  const [text, setText] = useState('');
  const [resp, setResp] = useState({ received: new Date().toLocaleDateString('en-CA'), ref: '', text: '' });
  const responses = caseInfo.responses || [];
  const notes = caseInfo.notes || [];
  const history = caseInfo.history || [];
  const post = () => { if (text.trim()) { addNote(a.id, text.trim()); setText(''); } };
  return (
    <div className="grid g-main-side">
      <section className="card">
        <div className="card-head"><div><h3>Officer notes</h3><p>Working notes for this scrutiny file: replies received, documents called for, personal-hearing outcomes.</p></div></div>
        <div className="field">
          <textarea rows={3} placeholder="e.g. Taxpayer says excess ITC in Aug-25 relates to a supplier's late GSTR-1; asked for vendor ledger." value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) post(); }} aria-label="New note" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>Ctrl + Enter to add</span>
            <button className="btn primary small" style={{ marginLeft: 'auto' }} onClick={post} disabled={!text.trim()}>Add note</button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
          {notes.length === 0 && <div className="empty">No notes yet.</div>}
          {notes.map((n, i) => (
            <div key={i} className="panel">
              <div className="mono muted" style={{ fontSize: 11.5 }}>{n.at} · {n.by}</div>
              <div style={{ marginTop: 6, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{n.text}</div>
            </div>
          ))}
        </div>
      </section>
      <div className="stack">
        <section className="card">
          <div className="eyebrow">Taxpayer responses</div>
          <div className="field" style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input type="date" aria-label="Date received" value={resp.received} onChange={(e) => setResp((x) => ({ ...x, received: e.target.value }))} />
              <input aria-label="Reference" placeholder="Reference (e.g. ASMT-11 ARN)" value={resp.ref} onChange={(e) => setResp((x) => ({ ...x, ref: e.target.value }))} />
            </div>
            <textarea rows={2} aria-label="Response summary" placeholder="Summary of the reply and documents received" value={resp.text} onChange={(e) => setResp((x) => ({ ...x, text: e.target.value }))} />
            <button className="btn small" disabled={!resp.text.trim() || !resp.received} onClick={() => { addResponse(a.id, { ...resp, text: resp.text.trim() }); setResp((x) => ({ ...x, ref: '', text: '' })); }}>Record response</button>
          </div>
          {responses.map((x, i) => (
            <div key={i} className="panel" style={{ marginTop: 8 }}>
              <div className="mono muted" style={{ fontSize: 11.5 }}>received {x.received}{x.ref ? ` · ${x.ref}` : ''} · recorded {x.at} by {x.by}</div>
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{x.text}</div>
            </div>
          ))}
        </section>
        <section className="card">
          <div className="eyebrow">Case status</div>
          <select style={{ marginTop: 12 }} value={caseInfo.status} onChange={(e) => setCaseStatus(a.id, e.target.value)} aria-label="Case status">
            {Object.entries(CASE_STATUS).map(([k, v]) => <option key={k} value={k} disabled={WORKFLOW_STATUSES.includes(k) && caseInfo.status !== k} title={WORKFLOW_STATUSES.includes(k) ? 'Set by the notice workflow (saving the draft, recording the issue, escalating)' : undefined}>{v.label}</option>)}
          </select>
          {caseInfo.closure && caseInfo.status === 'Closed' && <div className="note" style={{ marginTop: 10 }}><b>{CLOSURE_LABEL[caseInfo.closure.code]}</b><br />{caseInfo.closure.reason}<div className="mono muted" style={{ fontSize: 11 }}>{caseInfo.closure.at} · {caseInfo.closure.by}</div></div>}
          <button className="btn soft" style={{ width: '100%', marginTop: 12 }} onClick={openNotice}><Icon name="notice" size={16} /> Scrutiny note &amp; notice readiness</button>
        </section>
        <section className="card">
          <div className="eyebrow">History</div>
          <div className="timeline" style={{ marginTop: 14 }}>
            {history.length === 0 && <div className="muted">No activity yet.</div>}
            {history.map((h, i) => (
              <div key={i} className="ev"><span className="d" /><div><div className="t">{h.text}</div><div className="m">{h.at} · {h.by}</div></div></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================================================================ Officer outcome for one alert */
function OutcomeForm({ r, current, onSave }) {
  const [code, setCode] = useState(current?.code || '');
  const [note, setNote] = useState(current?.note || '');
  const blocked = confirmBlocked(r, new Date().toLocaleDateString('en-CA'));
  const changed = code !== (current?.code || '') || note !== (current?.note || '');
  return (
    <div className="panel" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <b>Officer outcome</b>
        {current ? <span className={`disp ${current.code}`}>{DISPOSITION_LABEL[current.code]}</span> : <span className="disp pending">Pending</span>}
        {current && <span className="mono muted" style={{ fontSize: 11 }}>{current.at} · {current.by}</span>}
        <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>Only a confirmed discrepancy can enter tax, interest, reversal or notice workflows.</span>
      </div>
      <div className="outcome-form">
        <select aria-label={`Outcome for ${r.id}`} value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">Choose an outcome…</option>
          {DISPOSITIONS.map(([k, l]) => <option key={k} value={k} disabled={k === 'confirmed' && !!blocked}>{l}</option>)}
        </select>
        <textarea rows={2} aria-label={`Reasons for ${r.id}`} placeholder="What was verified and on what evidence (required)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn small primary" disabled={!code || !note.trim() || !changed} onClick={() => onSave(code, note.trim())}>{current ? 'Update' : 'Record'}</button>
          {current && <button className="btn small" onClick={() => onSave(null)}>Withdraw</button>}
        </div>
      </div>
      {code && <div className="muted" style={{ fontSize: 12 }}>{DISPOSITIONS.find(([k]) => k === code)?.[2]}</div>}
      {blocked && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{blocked}</div>}
    </div>
  );
}
