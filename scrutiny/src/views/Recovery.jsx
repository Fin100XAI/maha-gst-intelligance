// Recovery intelligence (capability 26): established demands, what is outstanding and whether it can be recovered
// now, ranked by a published rule, with an officer-controlled next step. Nothing here initiates recovery.
import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, Kpi, PageHead, Legend, Seg, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import { useEvidence, JurisdictionPicker, jurisdictionsOf, ALL } from '../components/leadership.jsx';
import { SEGMENTS, PRIORITY_RULE } from '../engine/recovery.js';
import { shortName } from '../components/RevenueChange.jsx';
import { SERIES, BRAND, INK, STATUS } from '../lib/colors.js';
import { inr, axisInr } from '../lib/format.js';

const SEG_COLOR = { now: SERIES[1], blocked: '#b9c5e1', settled: SERIES[5] };
const SEG_CHIP = { now: 'bad', blocked: '', settled: 'good' };

export default function Recovery({ data, registers, cases, jurisdiction, setJurisdiction, openTaxpayer }) {
  const jur = jurisdiction || jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });
  const w = eb.recovery;
  const [show, setShow] = useState('open');
  if (!registers?.demands) return <div className="page"><PageHead title="Recovery" /><div className="card note">No demands register is loaded. Upload one in Upload data (step 2, Demands and recoveries).</div></div>;
  const rows = w.rows.filter((r) => show === 'all' || r.segment !== 'settled');
  const byStage = w.byStage.map((s) => ({ ...s, label: s.stage }));
  return (
    <div className="page">
      <PageHead title="Recovery" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · as of ${w.asOf}`}>
        <JurisdictionPicker data={data} registers={registers} value={jur} onChange={setJurisdiction} />
      </PageHead>
      <div className="grid g-4">
        <Kpi label="Outstanding" value={inr(w.totals.outstanding)} sub={`of ${inr(w.totals.demand)} demanded · ${inr(w.totals.paid)} paid`} />
        <Kpi label={SEGMENTS.now.label} value={inr(w.totals.now)} sub={SEGMENTS.now.note} dot={w.totals.now ? STATUS.critical : undefined} />
        <Kpi label={SEGMENTS.blocked.label} value={inr(w.totals.blocked)} sub={SEGMENTS.blocked.note} />
        <Kpi label="Stalled" value={inr(w.totals.stalled)} sub="recoverable, but no payment for too long" />
      </div>
      <div className="grid g-2 mt">
        <Card title="Paid and outstanding, by stage" sub="Where the demanded money sits"
          table={{ columns: ['Stage', 'Demands', 'Paid', 'Outstanding'], rows: w.byStage.map((s) => [s.stage, s.count, Math.round(s.paid), Math.round(s.outstanding)]) }}>
          <ResponsiveContainer width="100%" height={byStage.length * 40 + 40}>
            <BarChart data={byStage} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
              <YAxis type="category" dataKey="label" {...axisProps} width={110} interval={0} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.stage} · {payload[0].payload.count} demands</div>{payload.map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.fill }} />{x.name}<b>{inr(x.value)}</b></div>)}</div> : null)} />
              <Bar dataKey="paid" name="Paid" stackId="s" fill={SEG_COLOR.settled} isAnimationActive={false} />
              <Bar dataKey="outstanding" name="Outstanding" stackId="s" fill={BRAND} radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Paid', color: SEG_COLOR.settled }, { label: 'Outstanding', color: BRAND }]} />
        </Card>
        <Card title="Age of what is outstanding" sub="Since the order, split by whether it can be recovered now">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={w.ageing} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.bucket}</div>{payload.map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.fill }} />{x.name}<b>{inr(x.value)}</b></div>)}</div> : null)} />
              <Bar dataKey="now" name={SEGMENTS.now.label} stackId="a" fill={SEG_COLOR.now} isAnimationActive={false} />
              <Bar dataKey="blocked" name={SEGMENTS.blocked.label} stackId="a" fill={SEG_COLOR.blocked} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: SEGMENTS.now.label, color: SEG_COLOR.now }, { label: SEGMENTS.blocked.label, color: SEG_COLOR.blocked }]} />
        </Card>
      </div>
      <Card className="mt" tour="recovery-list" title="Recovery worklist" sub="Highest priority first, by the published rule. The next step is a suggestion for the officer; nothing is started automatically."
        actions={<>
          <InfoTip title="Priority rule">{PRIORITY_RULE.map(([t, p]) => <div key={t}>+{p} · {t}</div>)}<div className="mt">Only one of the first three applies. Settled demands score 0.</div></InfoTip>
          <Seg value={show} onChange={setShow} options={[{ value: 'open', label: 'Outstanding' }, { value: 'all', label: 'All demands' }]} />
        </>}>
        <div className="tbl-wrap" style={{ maxHeight: 620 }}>
          <table className="tbl rec-table">
            <thead><tr><th className="num">Priority</th><th>Demand</th><th>Taxpayer</th><th>Stage</th><th className="num">Outstanding</th><th className="num">Age</th><th>Why it ranks here</th><th>Suggested next step</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.demandId}>
                <td className="num"><span className={`prio p${Math.min(r.priority, 9)}`}>{r.priority}</span></td>
                <td className="mono small"><span style={{ whiteSpace: 'nowrap' }}>{r.demandId}</span><div className="muted">s.{r.section} · FY {r.fy}{r.caseId ? ` · ${r.caseId}` : ''}</div></td>
                <td className="rec-tp">{data.taxpayers.some((t) => t.gstin === r.gstin) ? <button className="link-btn" onClick={() => openTaxpayer(r.gstin)}>{shortName(r.name, 26)}</button> : shortName(r.name, 26)}{r.flight && <div><span className="chip bad">{r.taxpayerStatus}</span></div>}</td>
                <td><span className={`chip ${SEG_CHIP[r.segment]}`}>{r.stage}</span>{r.windowOver && <div className="small neg">appeal period over {r.appealEnds}</div>}{r.blocker && <div className="muted small">{r.blocker}</div>}</td>
                <td className="num">{inr(r.outstanding)}<div className="muted small">of {inr(r.total)}</div></td>
                <td className="num">{r.sinceOrder} d{r.lastPaymentDate ? <div className="muted small">paid {r.lastPaymentDate}</div> : null}</td>
                <td className="small">{r.because.length ? <ul className="because">{r.because.map((b) => <li key={b}>{b}</li>)}</ul> : '-'}</td>
                <td className="small">{r.next}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>
      <div className="prelim mt" role="note"><div><b>For authorised officers.</b> Recovery measures under s.78-79 need the officer's decision and approval. The platform only ranks and suggests.</div></div>
    </div>
  );
}
