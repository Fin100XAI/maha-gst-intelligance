// Collections and trajectory (capabilities 21 and 28): what the jurisdiction collected and how, and where the year
// is heading against its target, with the range, the taxpayers driving it and what-if scenarios.
import React, { useMemo, useState } from 'react';
import { DataNeeds } from '../components/DataNeeds.jsx';
import { ResponsiveContainer, BarChart, Bar, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Card, Kpi, PageHead, Legend, Seg, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import { useEvidence, JurisdictionPicker, jurisdictionsOf, ALL, CLASS_COLOR, pctOf, shortFy } from '../components/leadership.jsx';
import { trajectory, CLASS_DEFS, MONTHS } from '../engine/collections.js';
import { shortName } from '../components/RevenueChange.jsx';
import { SERIES, BRAND, GOLD, INK } from '../lib/colors.js';
import { inr, axisInr } from '../lib/format.js';

const GROW = '#1c5cab', FALL = '#c23a3a';
const gapText = (g) => (g > 0 ? `${inr(g)} short` : g < 0 ? `${inr(-g)} ahead` : 'on target');

export default function Collections({ data, registers, cases, jurisdiction, setJurisdiction, go }) {
  const jur = jurisdiction || jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });
  const base = eb.base;
  const [fyPick, setFy] = useState(null);
  const fy = fyPick && base.years.includes(fyPick) ? fyPick : base.years[base.years.length - 1];
  const t = base.totals[fy] || {};
  const prevFy = base.years[base.years.indexOf(fy) - 1];
  const p = prevFy ? base.totals[prevFy] : null;
  const months = base.months.map((c) => ({ ...c, label: c.label }));
  const liability = t.regular + t.itc;

  return (
    <div className="page">
      <PageHead title="Collections" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · ${eb.gstins.length} taxpayers`}>
        <JurisdictionPicker data={data} registers={registers} value={jur} onChange={setJurisdiction} />
        <label className="field inline"><span>Year</span><select value={fy} onChange={(e) => setFy(e.target.value)}>{base.years.map((y) => <option key={y} value={y}>FY {y}</option>)}</select></label>
      </PageHead>
      <DataNeeds page="collections" registers={registers} go={go} />

      <div className="grid g-4">
        <Kpi label={`Collected in cash, FY ${shortFy(fy)}`} value={inr(t.collected)} sub={p ? `${t.collected >= p.collected ? '+' : ''}${inr(t.collected - p.collected)} (${pctOf(p.collected ? t.collected / p.collected - 1 : null, 1)}) on FY ${shortFy(prevFy)}` : 'first year loaded'} />
        <Kpi label="Regular GSTR-3B cash" value={inr(t.regular)} sub={`${pctOf(t.collected ? t.regular / t.collected : null)} of cash collected`} />
        <Kpi label="After departmental action" value={inr(t.intervention)} sub={`interest and fees ${inr(t.interestFees)}`} />
        <Kpi label="Liability paid in cash" value={pctOf(liability ? t.regular / liability : null, 1)} sub={`${inr(t.itc)} set off with ITC (not collected)`} />
      </div>

      <div className="grid g-21 mt">
        <Card title="Cash collected each month, by class" sub="Stacked: regular GSTR-3B cash, interest and late fees, and payments after departmental action"
          table={{ columns: ['Month', 'Regular', 'Interest & fees', 'After action', 'Total cash', 'ITC set-off'], rows: months.map((c) => [c.label, Math.round(c.regular), Math.round(c.interestFees), Math.round(c.intervention), Math.round(c.collected), Math.round(c.itc)]) }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={months} margin={{ left: 4, right: 8, top: 8, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} interval={2} />
              <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
              <Tooltip cursor={{ fill: 'rgba(26,46,94,0.05)' }} content={<MoneyTip />} />
              {months.some((c) => c.fy === fy) && <ReferenceLine x={months.find((c) => c.fy === fy).label} stroke={INK.secondary} strokeDasharray="3 3" label={{ value: `FY ${shortFy(fy)}`, position: 'insideTopLeft', fill: INK.secondary, fontSize: 11 }} />}
              <Bar dataKey="regular" name="Regular GSTR-3B cash" stackId="c" fill={CLASS_COLOR.regular} isAnimationActive={false} />
              <Bar dataKey="interestFees" name="Interest & late fees" stackId="c" fill={CLASS_COLOR.interestFees} isAnimationActive={false} />
              <Bar dataKey="intervention" name="After departmental action" stackId="c" fill={CLASS_COLOR.intervention} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Regular GSTR-3B cash', color: CLASS_COLOR.regular }, { label: 'Interest & late fees', color: CLASS_COLOR.interestFees }, { label: 'After departmental action', color: CLASS_COLOR.intervention }]} />
        </Card>
        <Card title="How the liability was paid" sub="Cash against input tax credit, each year">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={base.years.map((y) => ({ fy: `FY ${shortFy(y)}`, cash: base.totals[y].regular, itc: base.totals[y].itc }))} layout="vertical" margin={{ left: 4, right: 16, top: 4, bottom: 4 }} stackOffset="expand">
              <XAxis type="number" {...axisProps} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
              <YAxis type="category" dataKey="fy" {...axisProps} width={70} />
              <Tooltip content={<MoneyTip />} />
              <Bar dataKey="cash" name="Paid in cash" stackId="l" fill={CLASS_COLOR.regular} isAnimationActive={false} />
              <Bar dataKey="itc" name="Set off with ITC" stackId="l" fill={CLASS_COLOR.itc} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Paid in cash', color: CLASS_COLOR.regular }, { label: 'Set off with ITC', color: CLASS_COLOR.itc }]} />
        </Card>
      </div>

      <Trajectory eb={eb} base={base} registers={registers} jur={jur} />

      <div className="grid g-2 mt">
        <Card title="What each class means" sub="Definitions and sources, so every figure can be traced">
          <dl className="kv">{Object.values(CLASS_DEFS).map((c) => <React.Fragment key={c.label}><dt>{c.label}</dt><dd>{c.def} <span className="muted">Source: {c.source}.</span></dd></React.Fragment>)}</dl>
          <div className="note mt">No official collection figure is loaded to reconcile against; the jurisdiction total is the sum of its taxpayers, month by month.</div>
        </Card>
        <Card title="Exceptions" sub={`${base.exceptions.length} things a reader of these numbers should know`}>
          <ul className="hyp-out">{base.exceptions.map((e, i) => <li key={i}><b>{shortName(e.name, 30)}</b> (FY {shortFy(e.fy)}): {e.text}</li>)}</ul>
        </Card>
      </div>
      <div className="prelim mt" role="note"><div><b>Preliminary.</b> Collections are read from the loaded returns and the case register; a forecast is an expectation with a range, never a liability.</div></div>
    </div>
  );
}

function MoneyTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="tt"><div className="h">{payload[0].payload.label || payload[0].payload.fy || label}</div>{payload.filter((x) => x.value !== null && x.value !== undefined && !Array.isArray(x.value)).map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.color || x.fill }} />{x.name}<b>{inr(x.value)}</b></div>)}</div>;
}

// ------------------------------------------------------------------ capability 28
function Trajectory({ eb, base, registers, jur }) {
  const years = base.years.slice(1);
  const [fyPick, setFy] = useState(null);
  const fy = fyPick && years.includes(fyPick) ? fyPick : years[years.length - 1];
  const [asOf, setAsOf] = useState(null);
  const [measure, setMeasure] = useState('discharged');
  const [scenario, setScenario] = useState({});
  const complete = Math.max(1, ...base.months.filter((c) => c.fy === fy && c.regular + c.itc > 0).map((c) => c.m + 1));
  const at = asOf ?? Math.min(6, complete);
  const targets = useMemo(() => (registers?.targets?.records || []).filter((x) => jur === ALL || x.jurisdiction === jur), [registers, jur]);
  const tr = useMemo(() => trajectory({ base, fy, asOf: at, measure, targets: measure === 'discharged' ? targets : [], scenario }), [base, fy, at, measure, targets, scenario]);
  const plain = useMemo(() => (Object.keys(scenario).length ? trajectory({ base, fy, asOf: at, measure, targets: measure === 'discharged' ? targets : [] }) : tr), [base, fy, at, measure, targets, scenario, tr]);
  const rows = tr.monthly.map((x) => ({ ...x, band: x.low !== null ? [x.low, x.high] : null }));
  const drivers = tr.drivers.map((d) => ({ ...d, label: shortName(d.name, 22) }));

  return (
    <>
      <div className="section-head mt">
        <h2>Where the year is heading</h2>
        <div className="section-controls">
          <label className="field inline"><span>Year</span><select value={fy} onChange={(e) => { setFy(e.target.value); setAsOf(null); setScenario({}); }}>{years.map((y) => <option key={y} value={y}>FY {y}</option>)}</select></label>
          <label className="field inline slider"><span>Forecast from end of <b>{MONTHS[at - 1]}</b></span><input type="range" min={1} max={complete} value={at} onChange={(e) => { setAsOf(Number(e.target.value)); setScenario({}); }} aria-label="Forecast as at month" /></label>
          <Seg value={measure} onChange={setMeasure} options={[{ value: 'discharged', label: 'Liability discharged' }, { value: 'cash', label: 'Cash only' }]} />
        </div>
      </div>
      <div className="grid g-4">
        <Kpi label={`Actual, Apr–${MONTHS[at - 1]}`} value={inr(tr.ytd)} sub={`last year, same months: ${inr(tr.monthly.slice(0, at).reduce((s, x) => s + x.lastYear, 0))}`} />
        <Kpi label={`Expected FY ${shortFy(fy)}`} value={inr(tr.expected)} sub={`range ${inr(tr.range[0])} – ${inr(tr.range[1])}`} />
        <Kpi label="Target" value={tr.target === null ? '-' : inr(tr.target)} sub={tr.target === null ? (measure === 'cash' ? 'targets are set on liability discharged' : 'no target register loaded') : 'from the targets register (latest version)'} />
        <Kpi label="Gap to target" value={tr.gap === null ? '-' : gapText(tr.gap)} sub={tr.gapRange && tr.gapRange[0] !== tr.gapRange[1] ? `between ${gapText(tr.gapRange[0])} and ${gapText(tr.gapRange[1])}` : tr.gap !== null ? 'the year is complete' : ''} dot={tr.gap > 0 ? '#b02222' : undefined} />
      </div>

      <div className="grid g-21 mt">
        <Card tour="trajectory" title={`Month by month, FY ${shortFy(fy)}`} sub={`Actual to the end of ${MONTHS[at - 1]}, then the forecast with its range. ${tr.method}.`}
          actions={<InfoTip title="How the forecast works">Each taxpayer is forecast on its own: the same month last year × its growth so far. When its last three months break from that by more than 25% (it stopped filing, a rate changed, business moved), the recent level is used instead. A taxpayer new this year is carried at its average month. The range (about 80%) is the larger of the month-to-month spread so far, the error this method made a year earlier at the same month, and 3%.</InfoTip>}
          table={{ columns: ['Month', 'Actual', 'Forecast', 'Low', 'High', 'Target', 'Last year', 'Actual (later)'], rows: rows.map((x) => [x.label, x.actual ?? '-', x.forecast === null ? '-' : Math.round(x.forecast), x.low === null ? '-' : Math.round(x.low), x.high === null ? '-' : Math.round(x.high), x.target ?? '-', Math.round(x.lastYear), x.actualLater ?? '-']) }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const x = payload[0].payload;
                return <div className="tt"><div className="h">{x.label}</div>
                  {x.actual !== null && <div className="r"><i style={{ background: BRAND }} />Actual<b>{inr(x.actual)}</b></div>}
                  {x.forecast !== null && <div className="r"><i style={{ background: SERIES[0] }} />Forecast<b>{inr(x.forecast)}</b></div>}
                  {x.low !== null && <div className="r">Range<b>{inr(x.low)} – {inr(x.high)}</b></div>}
                  {x.actualLater !== null && <div className="r">What then happened<b>{inr(x.actualLater)}</b></div>}
                  {x.target !== null && <div className="r"><i style={{ background: GOLD }} />Target<b>{inr(x.target)}</b></div>}
                  <div className="r"><i style={{ background: INK.muted }} />Last year<b>{inr(x.lastYear)}</b></div></div>;
              }} />
              <Area dataKey="band" name="Forecast range" stroke="none" fill={SERIES[0]} fillOpacity={0.14} isAnimationActive={false} />
              <Bar dataKey="actual" name="Actual" fill={BRAND} barSize={16} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Line dataKey="forecast" name="Forecast" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} connectNulls={false} />
              <Line dataKey="actualLater" name="What then happened" stroke={BRAND} strokeWidth={2} strokeDasharray="2 3" dot={{ r: 4, fill: '#fff', stroke: BRAND, strokeWidth: 2 }} isAnimationActive={false} />
              <Line dataKey="target" name="Target" stroke={GOLD} strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="lastYear" name="Last year" stroke={INK.muted} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Actual', color: BRAND }, { label: 'Forecast', color: SERIES[0], line: true }, { label: 'Forecast range', color: 'rgba(59,98,192,0.25)' }, { label: 'What then happened (known later)', color: BRAND, line: true }, { label: 'Target', color: GOLD, line: true }, { label: 'Last year', color: INK.muted, line: true }]} />
        </Card>
        <Card title="Running total against target" sub="Cumulative actual, then forecast, against the cumulative target">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} interval={1} />
              <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">To end of {payload[0].payload.label}</div><div className="r"><i style={{ background: SERIES[0] }} />Cumulative<b>{inr(payload[0].payload.cumulative)}</b></div>{payload[0].payload.cumulativeTarget !== null && <div className="r"><i style={{ background: GOLD }} />Target<b>{inr(payload[0].payload.cumulativeTarget)}</b></div>}</div> : null)} />
              <ReferenceLine x={MONTHS[at - 1]} stroke={INK.secondary} strokeDasharray="3 3" label={{ value: 'forecast from here', position: 'insideTopRight', fill: INK.secondary, fontSize: 11 }} />
              <Area dataKey="cumulative" name="Cumulative" stroke={SERIES[0]} strokeWidth={2} fill={SERIES[0]} fillOpacity={0.12} isAnimationActive={false} />
              <Line dataKey="cumulativeTarget" name="Target" stroke={GOLD} strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Cumulative (actual, then forecast)', color: SERIES[0] }, { label: 'Cumulative target', color: GOLD, line: true }]} />
        </Card>
      </div>

      {tr.backtest && (
        <div className={`verdict ${tr.backtest.withinRange ? 'good' : 'warn'} mt`} role="status">
          <div>
            <b>How this forecast did.</b> Made at the end of {MONTHS[at - 1]}, it expected {inr(tr.backtest.forecastRest)} for the rest of the year; {inr(tr.backtest.actualRest)} came in ({tr.backtest.error >= 0 ? '+' : ''}{pctOf(tr.backtest.error, 1)}), {tr.backtest.withinRange ? 'inside' : 'outside'} its range; {Math.round(tr.backtest.coverage * (12 - at))} of {12 - at} months fell inside the monthly range.
            {' '}Biggest misses: {tr.backtest.worst.map((w) => `${shortName(w.name, 22)} ${w.miss >= 0 ? '+' : ''}${inr(w.miss)}`).join(', ')}.
            {!tr.backtest.withinRange && ' Changes that had not yet started when the forecast was made cannot be foreseen; move the slider later to see the forecast pick them up.'}
          </div>
        </div>
      )}

      <div className="grid g-2 mt">
        <Card title="Who drives the change on last year" sub={`Expected FY ${shortFy(fy)} against FY ${shortFy(tr.prevFy)}, by taxpayer; the largest movers named`}
          table={{ columns: ['Taxpayer', 'Last year', 'Expected', 'Change', 'Method'], rows: tr.drivers.map((d) => [d.name, Math.round(d.lastYear), Math.round(d.expected), Math.round(d.change), d.method || '-']) }}>
          <ResponsiveContainer width="100%" height={Math.max(200, drivers.length * 32 + 30)}>
            <BarChart data={drivers} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
              <YAxis type="category" dataKey="label" {...axisProps} width={200} interval={0} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.name}</div><div className="r">Change<b>{payload[0].payload.change >= 0 ? '+' : ''}{inr(payload[0].payload.change)}</b></div>{payload[0].payload.method && <div className="r">Forecast by<b>{payload[0].payload.method}</b></div>}</div> : null)} />
              <ReferenceLine x={0} stroke={INK.secondary} />
              <Bar dataKey="change" radius={3} isAnimationActive={false}>{drivers.map((d) => <Cell key={d.name} fill={d.change < 0 ? FALL : GROW} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Adds on last year', color: GROW }, { label: 'Falls short of last year', color: FALL }]} />
        </Card>
        <Card title="What if?" sub="Move a major contributor's rest-of-year forecast and see the year and the gap change"
          actions={Object.keys(scenario).length > 0 && <button className="btn small" onClick={() => setScenario({})}>Reset</button>}>
          <div className="scenario">
            {tr.sensitivity.map((sn) => {
              const k = scenario[sn.gstin] ?? 1;
              return (
                <label key={sn.gstin} className="scenario-row">
                  <span className="scenario-name">{shortName(sn.name, 28)}<span className="muted small"> · {pctOf(sn.share)} of the year</span></span>
                  <input type="range" min={0.5} max={1.5} step={0.05} value={k} onChange={(e) => setScenario((s) => ({ ...s, [sn.gstin]: Number(e.target.value) }))} aria-label={`Scenario for ${sn.name}`} />
                  <b className={k < 1 ? 'neg' : ''}>{k === 1 ? 'as forecast' : `${k > 1 ? '+' : ''}${Math.round((k - 1) * 100)}%`}</b>
                </label>
              );
            })}
          </div>
          <div className="eiu-flow">
            <div><span className="eyebrow">Expected, as forecast</span><b>{inr(plain.expected)}</b></div><span className="path-arrow">→</span>
            <div><span className="eyebrow">With your scenario</span><b>{inr(tr.expected)}</b></div>
            {tr.gap !== null && <div><span className="eyebrow">Gap to target</span><b className={tr.gap > 0 ? 'neg' : ''}>{gapText(tr.gap)}</b></div>}
          </div>
          <div className="muted small">±10% on each: {tr.sensitivity.map((sn) => `${shortName(sn.name, 18)} ${inr(sn.plus10)}`).join(' · ')}</div>
        </Card>
      </div>
    </>
  );
}
