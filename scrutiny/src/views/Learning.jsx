// Outcome learning (capability 29): what closed cases teach. Which signals convert, which explanations recur, which
// evidence combinations matter, and which cases consumed effort without an outcome.
import React from 'react';
import { DataNeeds } from '../components/DataNeeds.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, Kpi, PageHead, Legend, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import { useEvidence, JurisdictionPicker, jurisdictionsOf, ALL, OUTCOME_COLOR, pctOf } from '../components/leadership.jsx';
import { OUTCOMES } from '../engine/actions.js';
import { shortName } from '../components/RevenueChange.jsx';
import { SERIES, INK } from '../lib/colors.js';

export default function Learning({ data, registers, cases, jurisdiction, setJurisdiction, go }) {
  const jur = jurisdiction || jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });
  const l = eb.learning;
  const keys = Object.keys(OUTCOMES).filter((k) => l.mix.some((m) => m[k]));
  const mix = l.mix.map((m) => ({ ...m, label: shortName(m.riskType, 26) }));
  return (
    <div className="page">
      <PageHead title="Learning" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · ${l.closed} closed cases`}>
        <JurisdictionPicker data={data} registers={registers} value={jur} onChange={setJurisdiction} />
      </PageHead>
      <DataNeeds page="learning" registers={registers} go={go} />
      <div className="grid g-4">
        <Kpi label="Closed cases" value={l.closed} sub="the base for everything on this page" />
        <Kpi label="Closed as confirmed" value={pctOf(eb.yieldByRisk.total.conversion)} sub="paid voluntarily or demand confirmed" />
        <Kpi label="Outcome recorded" value={pctOf(l.completeness.withOutcome)} sub={`reason recorded for ${pctOf(l.completeness.withReason)}`} />
        <Kpi label="Effort, no outcome" value={l.effortNoOutcome.length} sub="four or more interactions, closed as explained or no issue" />
      </div>
      <Card className="mt" title="How cases end, by risk type" sub="Share of closed cases by outcome; blue and navy are confirmed issues. Sorted by conversion."
        actions={<InfoTip title="Outcome taxonomy">{Object.entries(OUTCOMES).map(([k, o]) => <div key={k}><b>{o.label}</b>{o.confirmed ? ' (confirmed issue)' : ''}</div>)}</InfoTip>}
        table={{ columns: ['Risk type', 'Closed', ...keys.map((k) => OUTCOMES[k].label), 'Conversion'], rows: l.mix.map((m) => [m.riskType, m.closed, ...keys.map((k) => m[k]), pctOf(m.conversion)]) }}>
        <ResponsiveContainer width="100%" height={mix.length * 36 + 40}>
          <BarChart data={mix} layout="vertical" stackOffset="expand" margin={{ left: 4, right: 60, top: 4, bottom: 4 }} barCategoryGap={6}>
            <XAxis type="number" {...axisProps} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
            <YAxis type="category" dataKey="label" {...axisProps} width={180} interval={0} />
            <Tooltip cursor={{ fill: 'rgba(26,46,94,0.05)' }} content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.riskType} · {payload[0].payload.closed} closed</div>{payload.filter((x) => x.value).map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.fill }} />{x.name}<b>{x.value}</b></div>)}<div className="r">Conversion<b>{pctOf(payload[0].payload.conversion)}</b></div></div> : null)} />
            {keys.map((k, i) => <Bar key={k} dataKey={k} name={OUTCOMES[k].label} stackId="o" fill={OUTCOME_COLOR[k]} isAnimationActive={false}>{i === keys.length - 1 && <LabelList dataKey="conversion" position="right" formatter={(v) => pctOf(v)} fill={INK.secondary} fontSize={11} />}</Bar>)}
          </BarChart>
        </ResponsiveContainer>
        <Legend items={keys.map((k) => ({ label: OUTCOMES[k].label, color: OUTCOME_COLOR[k] }))} />
      </Card>
      <div className="grid g-2 mt">
        <Card title="Conversion by where the case came from" sub="Share of closed cases that confirmed an issue">
          <ResponsiveContainer width="100%" height={l.bySource.length * 40 + 40}>
            <BarChart data={l.bySource} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <YAxis type="category" dataKey="source" {...axisProps} width={100} interval={0} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.source}</div><div className="r">Conversion<b>{pctOf(payload[0].value)}</b></div><div className="r">Closed<b>{payload[0].payload.closed}</b></div></div> : null)} />
              <Bar dataKey="conversion" fill={SERIES[0]} radius={[0, 3, 3, 0]} isAnimationActive={false}><LabelList dataKey="closed" position="right" formatter={(v) => `${v} closed`} fill={INK.secondary} fontSize={11} /></Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Explanations that recur" sub="Reasons given for closing without a confirmed issue, seen twice or more">
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Risk type</th><th>Reason</th><th className="num">Cases</th></tr></thead>
            <tbody>{l.recurring.map((r) => <tr key={r.riskType + r.reason}><td>{r.riskType}</td><td>{r.reason}</td><td className="num">{r.cases}</td></tr>)}</tbody>
          </table></div>
          <div className="muted small mt">A reason that keeps recurring is a check to automate before a notice goes out.</div>
        </Card>
      </div>
      <div className="grid g-2 mt">
        <Card title="Does platform evidence predict the outcome?" sub="Cases grouped by what the platform saw for the taxpayer (network anomaly, EIU signal). Small groups: read with care.">
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Evidence present</th><th className="num">Cases</th><th className="num">Open</th><th className="num">Closed as confirmed</th><th className="num">Established</th></tr></thead>
            <tbody>{l.evidence.map((e) => <tr key={e.evidence}><td>{e.evidence}</td><td className="num">{e.cases}</td><td className="num">{e.open}</td><td className="num">{e.closed ? `${pctOf(e.conversion)} of ${e.closed}` : '-'}</td><td className="num">{e.established ? `₹${(e.established / 1e5).toFixed(1)} L` : '-'}</td></tr>)}</tbody>
          </table></div>
        </Card>
        <Card title="Effort that produced no outcome" sub="Closed as explained or no issue after four or more interactions">
          {l.effortNoOutcome.length ? <ul className="hyp-out">{l.effortNoOutcome.map((c) => <li key={c.id}><b>{c.id}</b> {shortName(eb.nameOf(c.gstin), 26)}: {c.riskType}, {c.interactions} interactions over {c.elapsed} days, closed as {OUTCOMES[c.outcome].label.toLowerCase()}{c.reason ? ` (${c.reason})` : ''}.</li>)}</ul> : <div className="note">None.</div>}
        </Card>
      </div>
      <div className="prelim mt" role="note"><div><b>Learning, not prediction.</b> These are counts over closed cases. Outcome prediction (capability 27) needs a validated history far larger than this and is not offered.</div></div>
    </div>
  );
}
