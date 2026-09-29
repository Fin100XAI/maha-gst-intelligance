// Departmental action (capabilities 22-25): where cases are and for how long, what action yields from selection to
// realised revenue, which kinds of case take effort without outcome, and which payments followed departmental action.
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, LabelList } from 'recharts';
import { Card, Kpi, PageHead, Legend, Seg, Tabs, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import { useEvidence, JurisdictionPicker, jurisdictionsOf, ALL, STEP_COLOR, CONF_COLOR, pctOf } from '../components/leadership.jsx';
import { OUTCOMES, OPEN_STAGE_LABEL, STAGE_LABEL } from '../engine/actions.js';
import { shortName } from '../components/RevenueChange.jsx';
import { SERIES, BRAND, INK, STATUS } from '../lib/colors.js';
import { inr, axisInr, int } from '../lib/format.js';
const lowerFirst = (t) => String(t).replace(/^[A-Z](?=[a-z])/, (ch) => ch.toLowerCase()); // keeps acronyms such as DRC-01

export default function Actions({ data, registers, cases, jurisdiction, setJurisdiction, selected }) {
  const jur = jurisdiction || jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });
  const TABS = ['funnel', 'yield', 'effort', 'revenue'];
  const [tab, setTab] = useState(TABS.includes(selected) ? selected : 'funnel');
  useEffect(() => { if (TABS.includes(selected)) setTab(selected); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const y = eb.yieldByRisk.total;
  if (!registers?.caselog) return <div className="page"><PageHead title="Actions" /><div className="card note">No case action register is loaded. Upload one in Upload data (step 2, Case action register). Cases recorded on this platform are included either way.</div></div>;
  return (
    <div className="page">
      <PageHead title="Actions" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · ${eb.cases.length} cases`}>
        <JurisdictionPicker data={data} registers={registers} value={jur} onChange={setJurisdiction} />
      </PageHead>
      <div className="grid g-4">
        <Kpi label="Cases" value={int(eb.funnel.cases)} sub={`${eb.funnel.open} open · ${eb.funnel.closed} closed · ${eb.funnel.reopened} reopened`} />
        <Kpi label="Selected → realised" value={pctOf(y.yield, 1)} sub={`${inr(y.realised)} realised of ${inr(y.selected)} selected`} />
        <Kpi label="Established, not yet realised" value={inr(y.established - y.realised)} sub={`${inr(y.established)} established in orders and payments`} />
        <Kpi label="Stuck cases" value={eb.funnel.stuck.length} sub={eb.funnel.bottleneck ? `bottleneck: ${lowerFirst(eb.funnel.bottleneck.openLabel)}` : 'none past their time'} dot={eb.funnel.stuck.length ? STATUS.critical : undefined} />
      </div>
      <div className="tabs-row mt">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'funnel', label: 'Case funnel' }, { id: 'yield', label: 'Action yield' }, { id: 'effort', label: 'Effort and outcome' }, { id: 'revenue', label: 'Revenue after action' }]} />
      </div>
      {tab === 'funnel' && <Funnel eb={eb} selected={selected} />}
      {tab === 'yield' && <Yield eb={eb} />}
      {tab === 'effort' && <Effort eb={eb} />}
      {tab === 'revenue' && <Intervention eb={eb} />}
      <div className="prelim mt" role="note"><div><b>Institutional measures, not officer scores.</b> Exposure, demand and realised revenue are kept apart; a demand is not revenue until paid, and a pre-deposit is not realised. Case types are compared, never individual officers.</div></div>
    </div>
  );
}

// ------------------------------------------------------------------ capability 23
function Funnel({ eb, selected }) {
  const f = eb.funnel;
  const rows = f.stages.filter((s) => s.reached).map((s) => ({ ...s, passed: s.reached - s.openHere, name: s.label }));
  const pick = eb.cases.find((c) => c.id === selected); // a case id in the route highlights that case
  return (
    <>
      <div className="grid g-21">
        <Card title="How far cases get" sub="Cases that reached each stage; the orange part is still sitting there. Early closures (explained, no issue) leave before later stages."
          table={{ columns: ['Stage', 'Reached', 'Open here', 'Stuck', 'Median days here', 'Selected amount open here'], rows: f.stages.map((s) => [s.label, s.reached, s.openHere, s.stuck, s.medianAge ?? '-', Math.round(s.amountHere)]) }}>
          <ResponsiveContainer width="100%" height={rows.length * 34 + 40}>
            <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }} barCategoryGap={6}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="name" {...axisProps} width={150} interval={0} />
              <Tooltip cursor={{ fill: 'rgba(26,46,94,0.05)' }} content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.label}</div><div className="r">Reached<b>{payload[0].payload.reached}</b></div><div className="r">Open here<b>{payload[0].payload.openHere}</b></div>{payload[0].payload.stuck > 0 && <div className="r">Past {payload[0].payload.stuckAfter} days<b>{payload[0].payload.stuck}</b></div>}{payload[0].payload.medianAge !== null && <div className="r">Median days here<b>{payload[0].payload.medianAge}</b></div>}</div> : null)} />
              <Bar dataKey="passed" name="Moved on or closed" stackId="f" fill={BRAND} isAnimationActive={false} />
              <Bar dataKey="openHere" name="Open at this stage" stackId="f" fill={SERIES[1]} radius={[0, 3, 3, 0]} isAnimationActive={false}>
                <LabelList dataKey="reached" position="right" fill={INK.secondary} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Moved on or closed', color: BRAND }, { label: 'Open at this stage', color: SERIES[1] }]} />
        </Card>
        <Card title="How long open cases have waited" sub="Days since each open case entered its current stage">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={f.ageing} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="bucket" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} width={30} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.bucket} days</div><div className="r">Open cases<b>{payload[0].value}</b></div></div> : null)} />
              <Bar dataKey="cases" radius={[4, 4, 0, 0]} isAnimationActive={false}>{f.ageing.map((b, i) => <Cell key={b.bucket} fill={['#b9c5e1', '#7f97cf', SERIES[0], BRAND][i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          {f.bottleneck && <div className="note mt"><b>Bottleneck: {lowerFirst(f.bottleneck.openLabel)}.</b> {f.bottleneck.stuck} case{f.bottleneck.stuck > 1 ? 's' : ''} past {f.bottleneck.stuckAfter} days, holding {inr(f.bottleneck.amountStuck)} of selected amount.</div>}
          {f.dataGaps.length > 0 && <div className="muted small mt">Record gaps in {f.dataGaps.length} case{f.dataGaps.length > 1 ? 's' : ''} ({pctOf(f.missingEventRate)}): {f.dataGaps.map((g) => `${g.id}: ${g.gaps.join(', ')}`).join('; ')}.</div>}
        </Card>
      </div>
      <Card className="mt" title="Cases past their time at a stage" sub="Oldest first. Each stage has a stated limit (for example 90 days from show cause to order).">
        <div className="tbl-wrap" style={{ maxHeight: 420 }}>
          <table className="tbl">
            <thead><tr><th>Case</th><th>Taxpayer</th><th>Risk</th><th>Now</th><th className="num">Days there</th><th className="num">Selected</th><th className="num">Established</th><th className="num">Realised</th></tr></thead>
            <tbody>{f.stuck.map((c) => (
              <tr key={c.id} className={pick?.id === c.id ? 'sel' : ''}>
                <td className="mono">{c.id}{c.signalId ? <div className="muted small">{c.signalId}</div> : null}</td>
                <td>{shortName(eb.nameOf(c.gstin), 28)}</td><td className="small">{c.riskType}</td>
                <td><span className="chip warn">{OPEN_STAGE_LABEL[c.stage]}</span><div className="muted small">since {c.stageSince}</div></td>
                <td className="num">{c.age}</td><td className="num">{inr(c.selected)}</td><td className="num">{c.established ? inr(c.established) : '-'}</td><td className="num">{c.realised ? inr(c.realised) : '-'}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>
      {pick && <CaseTimeline c={pick} eb={eb} />}
    </>
  );
}

function CaseTimeline({ c, eb }) {
  return (
    <Card className="mt" title={`${c.id} · ${shortName(eb.nameOf(c.gstin), 36)}`} sub={`${c.riskType} · ${c.source} · FY ${c.fy} · ${c.open ? `open, ${lowerFirst(OPEN_STAGE_LABEL[c.stage])} for ${c.age} days` : `closed: ${OUTCOMES[c.outcome]?.label}`}`}>
      <ol className="case-steps">{c.events.map((e, i) => <li key={i}><span className="mono">{e.date}</span> <b>{STAGE_LABEL[e.event] || e.event}</b>{e.amount ? ` · ${inr(Number(e.amount))}` : ''}{e.ref ? <span className="muted"> · {e.ref}</span> : ''}{e.outcome ? ` · ${OUTCOMES[e.outcome]?.label}` : ''}{e.reason ? ` (${e.reason})` : ''}{e.note ? <span className="muted"> · {e.note}</span> : ''}</li>)}</ol>
    </Card>
  );
}

// ------------------------------------------------------------------ capability 24
function Yield({ eb }) {
  const [by, setBy] = useState('riskType');
  const y = by === 'riskType' ? eb.yieldByRisk : by === 'source' ? eb.yieldBySource : eb.yieldByYear;
  const rows = y.rows.map((r) => ({ ...r, label: shortName(r.cohort, 26) }));
  return (
    <>
      <Card tour="yield" title="From selection to realised revenue" sub="For each cohort of cases: the amount selected, what is still unresolved, what was established (orders, voluntary payments) and what was realised"
        actions={<Seg value={by} onChange={setBy} options={[{ value: 'riskType', label: 'By risk type' }, { value: 'source', label: 'By source' }, { value: 'yearOpened', label: 'By year opened' }]} />}
        table={{ columns: ['Cohort', 'Cases', 'Selected', 'Unresolved', 'Established', 'Realised', 'Yield', 'Conversion'], rows: y.rows.map((r) => [r.cohort, r.cases, Math.round(r.selected), Math.round(r.unresolved), Math.round(r.established), Math.round(r.realised), pctOf(r.yield, 1), pctOf(r.conversion)]) }}>
        <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 58 + 40)}>
          <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 80, top: 4, bottom: 4 }} barCategoryGap={10} barGap={1}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
            <YAxis type="category" dataKey="label" {...axisProps} width={180} interval={0} />
            <Tooltip cursor={{ fill: 'rgba(26,46,94,0.05)' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload;
              return <div className="tt"><div className="h">{r.cohort} · {r.cases} cases</div>{['selected', 'unresolved', 'established', 'realised'].map((k) => <div className="r" key={k}><i style={{ background: STEP_COLOR[k] }} />{k[0].toUpperCase() + k.slice(1)}<b>{inr(r[k])}</b></div>)}<div className="r">Yield<b>{pctOf(r.yield, 1)}</b></div></div>;
            }} />
            {['selected', 'unresolved', 'established', 'realised'].map((k) => <Bar key={k} dataKey={k} name={k} fill={STEP_COLOR[k]} barSize={9} radius={[0, 3, 3, 0]} isAnimationActive={false}>{k === 'realised' && <LabelList dataKey="yield" position="right" formatter={(v) => (v === null ? '' : `yield ${pctOf(v, 1)}`)} fill={INK.secondary} fontSize={11} />}</Bar>)}
          </BarChart>
        </ResponsiveContainer>
        <Legend items={['selected', 'unresolved', 'established', 'realised'].map((k) => ({ label: k[0].toUpperCase() + k.slice(1), color: STEP_COLOR[k] }))} />
      </Card>
      <div className="grid g-2 mt">
        <Card title="The ratios, with what they divide" sub="Numerator and denominator always shown">
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Cohort</th><th className="num">Established ÷ selected</th><th className="num">Realised ÷ established</th><th className="num">Yield: realised ÷ selected</th><th className="num">Closed as confirmed</th></tr></thead>
            <tbody>{[...y.rows, y.total].map((r) => (
              <tr key={r.cohort} className={r === y.total ? 'total' : ''}>
                <td>{r.cohort}</td>
                <td className="num">{pctOf(r.establishedRate, 0)}<div className="muted small">{inr(r.established)} ÷ {inr(r.selected)}</div></td>
                <td className="num">{pctOf(r.realisedRate, 0)}<div className="muted small">{inr(r.realised)} ÷ {inr(r.established)}</div></td>
                <td className="num"><b>{pctOf(r.yield, 1)}</b></td>
                <td className="num">{pctOf(r.conversion, 0)}<div className="muted small">of {r.closed} closed</div></td>
              </tr>))}</tbody>
          </table></div>
        </Card>
        <Card title="Definitions" sub="Transparent, and the same on every screen">
          <dl className="kv">{Object.entries(y.definitions).map(([k, v]) => <React.Fragment key={k}><dt style={{ textTransform: 'capitalize' }}>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
        </Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ capability 25
function Effort({ eb }) {
  const e = eb.effort;
  const points = e.rows.filter((r) => r.selected > 0).sort((a, b) => b.totalInteractions / b.cases - a.totalInteractions / a.cases).map((r) => ({ ...r, x: +(r.totalInteractions / r.cases).toFixed(2), y: r.selected ? r.realised / r.selected : 0, z: r.cases, label: shortName(r.riskType, 24) }));
  const avgAll = e.rows.reduce((s, r) => s + r.totalInteractions, 0) / Math.max(1, e.rows.reduce((s, r) => s + r.cases, 0));
  const effortTip = ({ active, payload }) => { if (!active || !payload?.length) return null; const r = payload[0].payload; return <div className="tt"><div className="h">{r.riskType}</div><div className="r">Cases<b>{r.cases}</b></div><div className="r">Interactions per case<b>{r.x}</b></div><div className="r">Median days<b>{r.medianDays}</b></div><div className="r">Realised ÷ selected<b>{pctOf(r.y, 1)}</b></div></div>; };
  return (
    <>
      <div className="grid g-21">
        <Card title="Effort against yield, by case type" sub="Each case type's effort (left) beside its yield (right). Red: high effort, low yield. Dashed lines: the average across all cases."
          actions={<InfoTip title="The effort proxy">{e.definition} A case type is flagged when its median interactions are at least 1.2× the overall median and its yield at most half the overall yield.</InfoTip>}
          table={{ columns: ['Case type', 'Cases', 'Median interactions', 'Median days', 'Realised', 'Selected', 'Yield', 'High effort, low yield'], rows: e.rows.map((r) => [r.riskType, r.cases, r.medianInteractions, r.medianDays, Math.round(r.realised), Math.round(r.selected), pctOf(r.selected ? r.realised / r.selected : null, 1), r.highEffortLowYield ? 'yes' : '-']) }}>
          <div className="twin">
            <div>
              <div className="eyebrow">Interactions per case</div>
              <ResponsiveContainer width="100%" height={points.length * 34 + 30}>
                <BarChart data={points} layout="vertical" margin={{ left: 4, right: 36, top: 4, bottom: 4 }}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" {...axisProps} />
                  <YAxis type="category" dataKey="label" {...axisProps} width={170} interval={0} />
                  <ReferenceLine x={avgAll} stroke={INK.secondary} strokeDasharray="4 4" />
                  <Tooltip content={effortTip} />
                  <Bar dataKey="x" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                    {points.map((p) => <Cell key={p.riskType} fill={p.highEffortLowYield ? STATUS.critical : SERIES[0]} />)}
                    <LabelList dataKey="x" position="right" fill={INK.secondary} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="eyebrow">Yield: realised ÷ selected</div>
              <ResponsiveContainer width="100%" height={points.length * 34 + 30}>
                <BarChart data={points} layout="vertical" margin={{ left: 4, right: 44, top: 4, bottom: 4 }}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" {...axisProps} domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <YAxis type="category" dataKey="label" hide />
                  <ReferenceLine x={e.overall.yield} stroke={INK.secondary} strokeDasharray="4 4" />
                  <Tooltip content={effortTip} />
                  <Bar dataKey="y" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                    {points.map((p) => <Cell key={p.riskType} fill={p.highEffortLowYield ? STATUS.critical : SERIES[0]} />)}
                    <LabelList dataKey="y" position="right" formatter={(v) => pctOf(v)} fill={INK.secondary} fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <Legend items={[{ label: 'High effort, low yield', color: STATUS.critical }, { label: 'Other case types', color: SERIES[0] }]} />
        </Card>
        <Card title="Where to change the process" sub="Patterns in the case record, not judgements of people">
          {e.suggestions.length ? <ul className="hyp-out">{e.suggestions.map((s, i) => <li key={i}><b>{s.riskType}:</b> {s.text}</li>)}</ul> : <div className="note">No pattern stands out.</div>}
        </Card>
      </div>
      <Card className="mt" title="Days to close, by case type" sub="Median days from selection to closure (or to today, for open cases)">
        <ResponsiveContainer width="100%" height={e.rows.length * 30 + 40}>
          <BarChart data={e.rows.map((r) => ({ ...r, label: shortName(r.riskType, 26) }))} layout="vertical" margin={{ left: 4, right: 30, top: 4, bottom: 4 }}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="label" {...axisProps} width={180} interval={0} />
            <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.riskType}</div><div className="r">Median days<b>{payload[0].value}</b></div></div> : null)} />
            <Bar dataKey="medianDays" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {e.rows.map((r) => <Cell key={r.riskType} fill={r.highEffortLowYield ? STATUS.critical : SERIES[0]} />)}
              <LabelList dataKey="medianDays" position="right" fill={INK.secondary} fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ capability 22
function Intervention({ eb }) {
  const r = eb.intervention;
  const byYear = useMemo(() => {
    const m = new Map();
    for (const x of r.rows) { const y = fyOf(x.date); const o = m.get(y) || m.set(y, { fy: y, direct: 0, probable: 0, unattributed: 0 }).get(y); o[x.confidence] += x.amount; }
    return [...m.values()].sort((a, b) => a.fy.localeCompare(b.fy));
  }, [r]);
  return (
    <>
      <div className="grid g-4">
        <Kpi label="Direct" value={inr(r.totals.direct)} sub="paid in a case: DRC-03 after notice, or against its order" />
        <Kpi label="Probable" value={inr(r.totals.probable)} sub="made good in a return filed after the signal: association, not proof" />
        <Kpi label="Unattributed" value={inr(r.totals.unattributed)} sub="paid against a demand no case links to" />
        <Kpi label="Appeal pre-deposits" value={inr(r.totals.deposits)} sub="deposits, not realised revenue" />
      </div>
      <div className="grid g-12 mt">
        <Card title="Revenue after action, by year and confidence" sub="Causation is never inferred: each rupee carries how sure the link is">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byYear} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="fy" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">FY {payload[0].payload.fy}</div>{payload.map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.fill }} />{x.name}<b>{inr(x.value)}</b></div>)}</div> : null)} />
              {['direct', 'probable', 'unattributed'].map((k, i) => <Bar key={k} dataKey={k} name={k[0].toUpperCase() + k.slice(1)} stackId="c" fill={CONF_COLOR[k]} radius={i === 2 ? [3, 3, 0, 0] : 0} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
          <Legend items={['direct', 'probable', 'unattributed'].map((k) => ({ label: k[0].toUpperCase() + k.slice(1), color: CONF_COLOR[k] }))} />
        </Card>
        <Card title="Each payment and how it links to action">
          <div className="tbl-wrap" style={{ maxHeight: 320 }}>
            <table className="tbl">
              <thead><tr><th>Confidence</th><th>Case</th><th>Taxpayer</th><th>After</th><th>Date</th><th className="num">Amount</th><th>Basis</th></tr></thead>
              <tbody>{r.rows.map((x, i) => (
                <tr key={i}><td><span className="chip" style={{ borderColor: CONF_COLOR[x.confidence] }}>{x.confidence}</span></td><td className="mono small">{x.caseId || '-'}</td><td>{shortName(eb.nameOf(x.gstin), 24)}</td><td className="small">{x.action}</td><td className="mono small">{x.date}</td><td className="num">{inr(x.amount)}</td><td className="small">{x.why}{x.ref ? <span className="muted"> · {x.ref}</span> : ''}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
const fyOf = (d) => { const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7)); return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`; };
