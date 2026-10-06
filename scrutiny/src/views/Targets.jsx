// Targets, sectors and concentration (capabilities 2, 3 and 4): the jurisdiction target shared out by range, officer,
// sector or taxpayer with a stated method, where each unit stands to date and who makes up the gap; sector movement
// with peer context; and how concentrated the collection is.
import React, { useMemo, useState } from 'react';
import { DataNeeds } from '../components/DataNeeds.jsx';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, LabelList } from 'recharts';
import { Card, Kpi, PageHead, Legend, Seg, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import { useEvidence, JurisdictionPicker, jurisdictionsOf, ALL, pctOf, shortFy } from '../components/leadership.jsx';
import { targetPosition, sectorMovement, concentration, METHODS, UNITS } from '../engine/targets.js';
import { MONTHS } from '../engine/collections.js';
import { shortName } from '../components/RevenueChange.jsx';
import { SERIES, BRAND, GOLD, INK, STATUS } from '../lib/colors.js';
import { inr, axisInr } from '../lib/format.js';

const GROW = '#1c5cab', FALL = '#c23a3a';
const gapText = (g) => (g > 0 ? `${inr(g)} short` : g < 0 ? `${inr(-g)} ahead` : 'on target');

export default function Targets({ data, registers, cases, jurisdiction, setJurisdiction, go }) {
  const jur = jurisdiction || jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });
  const base = eb.base;
  const master = registers?.master?.records || [];
  const targets = useMemo(() => (registers?.targets?.records || []).filter((t) => jur === ALL || t.jurisdiction === jur), [registers, jur]);
  const years = base.years.slice(1);
  const [fyPick, setFy] = useState(null);
  const fy = fyPick && years.includes(fyPick) ? fyPick : years[years.length - 1];
  const complete = Math.max(1, ...base.months.filter((c) => c.fy === fy && c.regular + c.itc > 0).map((c) => c.m + 1));
  const [asOfPick, setAsOf] = useState(null);
  const asOf = Math.min(asOfPick ?? Math.min(6, complete), complete);
  const [by, setBy] = useState('range');
  const [method, setMethod] = useState('priorShare');
  const pos = useMemo(() => (fy ? targetPosition({ base, master, targets, fy, asOf, by, method }) : null), [base, master, targets, fy, asOf, by, method]);
  const sectors = useMemo(() => (fy ? sectorMovement({ base, master, fy }) : null), [base, master, fy]);
  const conc = useMemo(() => (fy ? concentration({ base, fy }) : null), [base, fy]);

  if (!targets.length) return <div className="page"><PageHead title="Targets" /><DataNeeds page="targets" registers={registers} go={go} /><div className="card note">No targets register for this jurisdiction. Upload one in Upload data (step 2, Revenue targets).</div></div>;
  const rows = (pos?.rows || []).map((r) => ({ ...r, name: shortName(r.label, 24) }));
  const top = by === 'taxpayer' ? rows.slice(0, 12) : rows;
  return (
    <div className="page">
      <PageHead title="Targets" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · FY ${fy}`}>
        <JurisdictionPicker data={data} registers={registers} value={jur} onChange={setJurisdiction} />
        <label className="field inline"><span>Year</span><select value={fy} onChange={(e) => { setFy(e.target.value); setAsOf(null); }}>{years.map((y) => <option key={y} value={y}>FY {y}</option>)}</select></label>
      </PageHead>
      <DataNeeds page="targets" registers={registers} go={go} />
      <div className="section-controls">
        <label className="field inline slider"><span>Position at end of <b>{MONTHS[asOf - 1]}</b></span><input type="range" min={1} max={complete} value={asOf} onChange={(e) => setAsOf(Number(e.target.value))} aria-label="Position as at month" /></label>
        <Seg value={by} onChange={setBy} options={Object.entries(UNITS).map(([value, label]) => ({ value, label: `By ${label.toLowerCase()}` }))} />
        <Seg value={method} onChange={setMethod} options={[{ value: 'priorShare', label: 'Last year’s share' }, { value: 'avg3', label: '3-year share' }]} />
      </div>
      {pos && (
        <>
          <div className="grid g-4 mt">
            <Kpi label={`Target, FY ${shortFy(fy)}`} value={inr(pos.target)} sub={`to ${pos.asOfLabel}: ${inr(pos.targetToDate)}`} />
            <Kpi label={`Actual to ${pos.asOfLabel}`} value={inr(pos.actualToDate)} sub={`${pctOf(pos.targetToDate ? pos.actualToDate / pos.targetToDate : null, 1)} of target to date`} />
            <Kpi label="Expected year" value={inr(pos.expected)} sub={`range ${inr(pos.range[0])} – ${inr(pos.range[1])}`} />
            <Kpi label="Gap to target" value={gapText(pos.gap)} sub={pos.reconciles ? `allocation adds back to the target ✓` : 'allocation does not reconcile'} dot={pos.gap > 0 ? STATUS.critical : undefined} />
          </div>
          <div className="grid g-2 mt">
            <Card title={`Target to date against actual, by ${UNITS[by].toLowerCase()}`} sub={`To the end of ${pos.asOfLabel}; label = share of target to date achieved${by === 'taxpayer' ? '; largest 12 gaps' : ''}`}
              table={{ columns: [UNITS[by], 'Share', 'Target to date', 'Actual to date', 'Achieved', 'Target (year)', 'Expected (year)', 'Gap'], rows: rows.map((r) => [r.label, pctOf(r.share, 1), Math.round(r.targetToDate), Math.round(r.actualToDate), pctOf(r.attainmentToDate, 0), Math.round(r.target), Math.round(r.expected), Math.round(r.gap)]) }}>
              <ResponsiveContainer width="100%" height={top.length * 46 + 40}>
                <BarChart data={top} layout="vertical" margin={{ left: 4, right: 52, top: 4, bottom: 4 }} barGap={1}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={170} interval={0} />
                  <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.label}</div><div className="r"><i style={{ background: GOLD }} />Target to date<b>{inr(payload[0].payload.targetToDate)}</b></div><div className="r"><i style={{ background: BRAND }} />Actual<b>{inr(payload[0].payload.actualToDate)}</b></div><div className="r">Achieved<b>{pctOf(payload[0].payload.attainmentToDate, 0)}</b></div>{payload[0].payload.noBasis && <div className="r">No last-year collection: no share</div>}</div> : null)} />
                  <Bar dataKey="targetToDate" name="Target to date" fill={GOLD} fillOpacity={0.55} barSize={10} radius={[0, 3, 3, 0]} isAnimationActive={false} />
                  <Bar dataKey="actualToDate" name="Actual to date" fill={BRAND} barSize={10} radius={[0, 3, 3, 0]} isAnimationActive={false}>
                    <LabelList dataKey="attainmentToDate" position="right" formatter={(v) => (v === null ? 'new' : pctOf(v, 0))} fill={INK.secondary} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Legend items={[{ label: 'Target to date', color: GOLD }, { label: 'Actual to date', color: BRAND }]} />
            </Card>
            <Card title="Who makes up the gap for the year" sub="Each unit's target less its expected year; red falls short, blue is ahead. Units add up to the jurisdiction gap.">
              <ResponsiveContainer width="100%" height={top.length * 34 + 40}>
                <BarChart data={top} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={170} interval={0} />
                  <ReferenceLine x={0} stroke={INK.secondary} />
                  <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.label}</div><div className="r">Target<b>{inr(payload[0].payload.target)}</b></div><div className="r">Expected<b>{inr(payload[0].payload.expected)}</b></div><div className="r">Gap<b>{gapText(payload[0].payload.gap)}</b></div><div className="r">Share of the jurisdiction gap<b>{pctOf(payload[0].payload.gapShare, 0)}</b></div></div> : null)} />
                  <Bar dataKey="gap" radius={3} isAnimationActive={false}>{top.map((r) => <Cell key={r.unit} fill={r.gap > 0 ? FALL : GROW} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <Legend items={[{ label: 'Falls short of its share', color: FALL }, { label: 'Ahead of its share', color: GROW }]} />
            </Card>
          </div>
          <Card className="mt" title="Method and assumptions" sub="Stated so the position can be checked; targets are administrative goals, never a taxpayer's liability"
            actions={<InfoTip title="Allocation methods">{Object.entries(METHODS).map(([k, v]) => <div key={k}><b>{v}</b></div>)}<div className="mt">The department's approved allocation replaces these when it is loaded.</div></InfoTip>}>
            <ul className="hyp-out">{pos.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
          </Card>
        </>
      )}

      {sectors && (
        <div className="grid g-2 mt">
          <Card title={`Movement by sector, FY ${shortFy(sectors.prev)} → ${shortFy(fy)}`} sub="Change in liability discharged; the sector's median taxpayer growth in the tooltip"
            table={{ columns: ['Sector', 'Taxpayers', 'Prior', 'Current', 'Change', 'Growth', 'Median taxpayer growth'], rows: sectors.rows.map((r) => [r.sector, r.taxpayers, Math.round(r.prior), Math.round(r.current), Math.round(r.change), pctOf(r.growth, 1), pctOf(r.medianGrowth, 1)]) }}>
            <ResponsiveContainer width="100%" height={sectors.rows.length * 30 + 40}>
              <BarChart data={sectors.rows.map((r) => ({ ...r, name: shortName(r.sector, 26) }))} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
                <YAxis type="category" dataKey="name" {...axisProps} width={180} interval={0} />
                <ReferenceLine x={0} stroke={INK.secondary} />
                <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.sector} · {payload[0].payload.taxpayers} taxpayers</div><div className="r">Change<b>{inr(payload[0].payload.change)}</b></div><div className="r">Growth<b>{pctOf(payload[0].payload.growth, 1)}</b></div><div className="r">Median taxpayer<b>{pctOf(payload[0].payload.medianGrowth, 1)}</b></div></div> : null)} />
                <Bar dataKey="change" radius={3} isAnimationActive={false}>{sectors.rows.map((r) => <Cell key={r.sector} fill={r.change < 0 ? FALL : GROW} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Taxpayers against their sector" sub="Growth compared with the median taxpayer in the same sector (sectors of one are not compared)">
            <div className="tbl-wrap" style={{ maxHeight: 420 }}>
              <table className="tbl">
                <thead><tr><th>Taxpayer</th><th>Sector</th><th className="num">Change</th><th className="num">Growth</th><th className="num">Against peers</th></tr></thead>
                <tbody>{sectors.taxpayers.map((t) => (
                  <tr key={t.gstin}><td>{shortName(t.name, 28)}</td><td className="small">{t.sector}</td><td className={`num ${t.change < 0 ? 'neg' : ''}`}>{inr(t.change)}</td><td className="num">{pctOf(t.growth, 1)}</td>
                    <td className="num">{t.vsPeers === null ? '-' : <span className={t.vsPeers < -0.1 ? 'neg' : ''}>{t.vsPeers >= 0 ? '+' : ''}{(t.vsPeers * 100).toFixed(1)} pts</span>}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {conc && (
        <div className="grid g-12 mt">
          <Card title="How concentrated is collection?" sub={`FY ${shortFy(fy)}, liability discharged`}>
            <div className="conc-kpis">
              <div><span className="eyebrow">Top 5 taxpayers</span><b>{pctOf(conc.top5)}</b></div>
              <div><span className="eyebrow">Top 10</span><b>{pctOf(conc.top10)}</b></div>
              <div><span className="eyebrow">Make up 80%</span><b>{conc.to80} of {conc.taxpayers}</b></div>
              <div><span className="eyebrow">HHI</span><b>{conc.hhi.toLocaleString('en-IN')}</b><span className="muted small">{conc.hhi >= 2500 ? 'highly concentrated' : conc.hhi >= 1500 ? 'moderately concentrated' : 'not concentrated'}</span></div>
            </div>
            <div className="muted small mt">A few large taxpayers carrying the collection means their movement alone can decide the target: watch them first.</div>
          </Card>
          <Card title="Cumulative share of collection, largest taxpayer first" sub="Where the curve crosses 80% is how few taxpayers carry most of the collection"
            table={{ columns: ['Rank', 'Taxpayer', 'Collection', 'Share', 'Cumulative'], rows: conc.curve.map((x) => [x.rank, x.name, Math.round(x.value), pctOf(x.share, 1), pctOf(x.cumulative, 1)]) }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={conc.curve} margin={{ left: 4, right: 12, top: 8, bottom: 16 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="rank" {...axisProps} label={{ value: 'taxpayers, largest first', position: 'insideBottom', offset: -8, fill: INK.secondary, fontSize: 11 }} />
                <YAxis {...axisProps} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} width={44} />
                <ReferenceLine y={0.8} stroke={GOLD} strokeDasharray="5 4" label={{ value: '80%', position: 'insideTopLeft', fill: INK.secondary, fontSize: 11 }} />
                <ReferenceLine x={conc.to80} stroke={INK.muted} strokeDasharray="3 3" />
                <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">#{payload[0].payload.rank} {shortName(payload[0].payload.name, 30)}</div><div className="r">Share<b>{pctOf(payload[0].payload.share, 1)}</b></div><div className="r">Cumulative<b>{pctOf(payload[0].payload.cumulative, 1)}</b></div></div> : null)} />
                <Area dataKey="cumulative" stroke={SERIES[0]} strokeWidth={2} fill={SERIES[0]} fillOpacity={0.15} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
      <div className="prelim mt" role="note"><div><b>Administrative goals.</b> A target share is never a demand on a taxpayer; it shows where the jurisdiction's movement comes from.</div></div>
    </div>
  );
}
