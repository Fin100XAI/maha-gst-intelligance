// Role-specific intelligence (capability 30): one evidence base, three views. Field officer: who needs attention
// today and why. Supervisor (DC / JC): gap, unresolved exposure, bottlenecks, action yield. Commissioner: trajectory,
// target gap, action yield, recovery and learning. Every number comes from the same computation.
import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, Kpi, PageHead, Legend, Seg, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import { useEvidence, JurisdictionPicker, jurisdictionsOf, ALL, STEP_COLOR, pctOf, shortFy } from '../components/leadership.jsx';
import { fieldView, supervisorView, commissionerView } from '../engine/roles.js';
import { OPEN_STAGE_LABEL } from '../engine/actions.js';
import { shortName } from '../components/RevenueChange.jsx';
import { SERIES, BRAND, GOLD, INK, STATUS } from '../lib/colors.js';
import { inr, axisInr } from '../lib/format.js';
const lowerFirst = (t) => String(t).replace(/^[A-Z](?=[a-z])/, (ch) => ch.toLowerCase()); // keeps acronyms such as DRC-01

const ROLES = [{ value: 'field', label: 'Field officer' }, { value: 'supervisor', label: 'Supervisor (DC / JC)' }, { value: 'commissioner', label: 'Commissioner' }];
const KIND_CHIP = { 'EIU signal': 'warn', 'Revenue change': 'warn', Network: 'bad', Recovery: 'bad', Case: '', Returns: 'bad' };

export default function Overview({ data, registers, cases, jurisdiction, setJurisdiction, user, go, roleHint }) {
  const jur = jurisdiction || jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });
  const officers = useMemo(() => [...new Set((registers?.master?.records || []).filter((m) => m.officer && eb.gstins.includes(m.gstin)).map((m) => m.officer))].sort(), [registers, eb]);
  const [role, setRole] = useState(ROLES.some((r) => r.value === roleHint) ? roleHint : /superintendent|officer/i.test(user?.role || '') ? 'field' : 'supervisor');
  useEffect(() => { if (ROLES.some((r) => r.value === roleHint)) setRole(roleHint); }, [roleHint]);
  const [officerPick, setOfficer] = useState(null);
  const officer = officerPick || (officers.includes(user?.name) ? user.name : officers[0]);
  const open = (link) => (link.view === 'taxpayer' ? go('taxpayer', link.id, link.tab) : go(link.view, link.id));
  return (
    <div className="page">
      <PageHead title="Overview" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · data to ${eb.asOf}`}>
        <JurisdictionPicker data={data} registers={registers} value={jur} onChange={setJurisdiction} />
      </PageHead>
      <div className="role-bar" data-tour="role-bar">
        <Seg value={role} onChange={setRole} options={ROLES} />
        {role === 'field' && officers.length > 0 && <label className="field inline"><span>Officer</span><select value={officer} onChange={(e) => setOfficer(e.target.value)}>{officers.map((o) => <option key={o}>{o}</option>)}</select></label>}
        <InfoTip title="Views for each role">The same evidence base, arranged for each decision: a field officer's taxpayers and why each needs attention; a supervisor's gap, exposure, bottlenecks and yield; a commissioner's trajectory, yield, recovery and learning. In production the role comes from the login, not this switch.</InfoTip>
      </div>
      {role === 'field' && <Field v={fieldView(eb, officer)} open={open} />}
      {role === 'supervisor' && <Supervisor v={supervisorView(eb)} eb={eb} go={go} />}
      {role === 'commissioner' && <Commissioner v={commissionerView(eb)} eb={eb} go={go} />}
    </div>
  );
}

// ------------------------------------------------------------------ field officer
function Field({ v, open }) {
  const kinds = {};
  for (const t of v.list) for (const i of t.items) kinds[i.kind] = (kinds[i.kind] || 0) + 1;
  return (
    <>
      <div className="grid g-4 mt">
        <Kpi label="My taxpayers" value={v.taxpayers} sub={`assigned to ${v.officer} in the taxpayer master`} />
        <Kpi label="Need attention" value={v.needAttention} sub="at least one open reason below" dot={v.needAttention ? STATUS.critical : undefined} />
        <Kpi label="Clear" value={v.clear.length} sub={v.clear.map((c) => shortName(c.name, 18)).join(', ') || '-'} />
        <Kpi label="Reasons" value={Object.values(kinds).reduce((s, n) => s + n, 0)} sub={Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(' · ')} />
      </div>
      <div className="attention mt">
        {v.list.map((t) => (
          <Card key={t.gstin} title={shortName(t.name, 40)} sub={`${t.gstin} · ${t.items.length} reason${t.items.length > 1 ? 's' : ''}`}
            actions={<button className="btn small" onClick={() => open({ view: 'taxpayer', id: t.gstin })}>Taxpayer 360°</button>}>
            <ul className="attn-list">{t.items.sort((a, b) => b.severity - a.severity).map((i, k) => (
              <li key={k}><span className={`chip ${KIND_CHIP[i.kind]}`}>{i.kind}</span><span className="attn-text">{i.text}</span><button className="link-btn small" onClick={() => open(i.link)}>Open →</button></li>
            ))}</ul>
          </Card>
        ))}
        {!v.list.length && <div className="note">Nothing needs attention for {v.officer}.</div>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ supervisor
function Supervisor({ v, eb, go }) {
  const g = v.targetGap;
  const stages = v.funnel.stages.filter((s) => s.openHere).map((s) => ({ ...s, name: s.openLabel }));
  const yieldRows = v.yieldByRisk.map((r) => ({ ...r, label: shortName(r.cohort, 22) }));
  return (
    <>
      <div className="grid g-4 mt">
        <Kpi label={`Gap to target, FY ${shortFy(g?.fy || '')}`} value={g?.gap == null ? '-' : `${inr(Math.abs(g.gap))} ${g.gap > 0 ? 'short' : 'ahead'}`} sub={g ? `expected ${inr(g.expected)} against ${inr(g.target)} (data to ${g.asOf})` : 'no target register'} dot={g?.gap > 0 ? STATUS.critical : undefined} />
        <Kpi label="Unresolved: EIU signals" value={inr(v.unresolved.eiu)} sub={`${inr(v.unresolved.eiuInsufficient)} more cannot be tested`} />
        <Kpi label={`Unresolved: network, FY ${shortFy(v.unresolved.networkYear || '')}`} value={inr(v.unresolved.network)} sub="overlaps EIU in part: side by side, not added" />
        <Kpi label="Action yield" value={pctOf(v.yield.yield, 1)} sub={`${inr(v.yield.realised)} realised of ${inr(v.yield.selected)} selected`} />
      </div>
      <div className="grid g-2 mt">
        <Card title="Where open cases sit" sub={v.bottleneck ? `Bottleneck: ${lowerFirst(v.bottleneck.openLabel)} (${v.bottleneck.stuck} past ${v.bottleneck.stuckAfter} days)` : 'No stage holds cases past its limit'}
          actions={<button className="btn small" onClick={() => go('actions')}>Actions →</button>}>
          <ResponsiveContainer width="100%" height={stages.length * 34 + 40}>
            <BarChart data={stages} layout="vertical" margin={{ left: 4, right: 30, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="name" {...axisProps} width={170} interval={0} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.name}</div><div className="r">Open<b>{payload[0].payload.openHere}</b></div><div className="r">Past limit<b>{payload[0].payload.stuck}</b></div><div className="r">Median days<b>{payload[0].payload.medianAge}</b></div></div> : null)} />
              <Bar dataKey="openHere" name="Open" stackId="o" fill={SERIES[0]} isAnimationActive={false} />
              <Bar dataKey="stuck" name="of which past the limit" fill={STATUS.critical} isAnimationActive={false} barSize={6} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Open at the stage', color: SERIES[0] }, { label: 'Past the stage limit', color: STATUS.critical }]} />
        </Card>
        <Card title="Established against realised, by risk type" sub="What orders and payments established, and what was actually received" actions={<button className="btn small" onClick={() => go('actions')}>Yield →</button>}>
          <ResponsiveContainer width="100%" height={yieldRows.length * 44 + 40}>
            <BarChart data={yieldRows} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }} barGap={1}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
              <YAxis type="category" dataKey="label" {...axisProps} width={160} interval={0} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.cohort}</div>{payload.map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.fill }} />{x.name}<b>{inr(x.value)}</b></div>)}</div> : null)} />
              <Bar dataKey="established" name="Established" fill={STEP_COLOR.established} barSize={10} radius={[0, 3, 3, 0]} isAnimationActive={false} />
              <Bar dataKey="realised" name="Realised" fill={STEP_COLOR.realised} barSize={10} radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Established', color: STEP_COLOR.established }, { label: 'Realised', color: STEP_COLOR.realised }]} />
        </Card>
      </div>
      <div className="grid g-2 mt">
        <Card title="Stuck cases" sub="Past the limit for their stage, oldest first">
          <ul className="attn-list">{v.stuck.map((c) => <li key={c.id}><span className="chip warn">{OPEN_STAGE_LABEL[c.stage]}</span><span className="attn-text"><b>{c.id}</b> {shortName(eb.nameOf(c.gstin), 24)} · {c.age} days · {inr(c.selected)}</span><button className="link-btn small" onClick={() => go('actions', c.id)}>Open →</button></li>)}</ul>
        </Card>
        <Card title="Recovery and effort" sub="Money established but not in, and case types that cost effort without outcome">
          <div className="eiu-flow">
            <div><span className="eyebrow">Recoverable now</span><b>{inr(v.recovery.now)}</b></div>
            <div><span className="eyebrow">Stalled</span><b className="neg">{inr(v.recovery.stalled)}</b></div>
            <div><span className="eyebrow">Not yet recoverable</span><b>{inr(v.recovery.blocked)}</b></div>
          </div>
          <div className="muted small">High effort, low yield: {v.highEffortLowYield.join(', ') || 'none'}.</div>
          <div className="mt"><button className="btn small" onClick={() => go('recovery')}>Recovery →</button> <button className="btn small" onClick={() => go('learning')}>Learning →</button></div>
        </Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ commissioner
function Commissioner({ v, eb, go }) {
  const t = v.trajectory;
  const years = v.yieldByYear.map((r) => ({ ...r, label: `FY ${r.cohort}` }));
  return (
    <>
      <div className="grid g-4 mt">
        <Kpi label={`FY ${shortFy(t?.fy || '')} ${t?.asOf < 12 ? 'expected' : 'actual'}`} value={t ? inr(t.expected) : '-'} sub={t ? `target ${t.target === null ? '-' : inr(t.target)} · ${t.asOf < 12 ? `range ${inr(t.range[0])} – ${inr(t.range[1])}` : 'year complete'}` : ''} />
        <Kpi label="Gap to target" value={t?.gap == null ? '-' : `${inr(Math.abs(t.gap))} ${t.gap > 0 ? 'short' : 'ahead'}`} sub={t?.gap > 0 ? 'see the drivers on Collections' : ''} dot={t?.gap > 0 ? STATUS.critical : undefined} />
        <Kpi label="Action yield" value={pctOf(v.yield.yield, 1)} sub={`realised ${inr(v.yield.realised)} · established ${inr(v.yield.established)}`} />
        <Kpi label="Recoverable now" value={inr(v.recovery.now)} sub={`${inr(v.recovery.outstanding)} outstanding in all`} />
      </div>
      <div className="grid g-21 mt">
        {t && (
          <Card title={`FY ${shortFy(t.fy)}: running total against target`} sub={t.asOf < 12 ? `Actual to ${t.asOfLabel}, then forecast` : 'The full year, actual'} actions={<button className="btn small" onClick={() => go('collections')}>Collections →</button>}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={t.monthly} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval={1} />
                <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
                <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">To end of {payload[0].payload.label}</div><div className="r"><i style={{ background: SERIES[0] }} />Cumulative<b>{inr(payload[0].payload.cumulative)}</b></div>{payload[0].payload.cumulativeTarget !== null && <div className="r"><i style={{ background: GOLD }} />Target<b>{inr(payload[0].payload.cumulativeTarget)}</b></div>}</div> : null)} />
                <Area dataKey="cumulative" stroke={SERIES[0]} strokeWidth={2} fill={SERIES[0]} fillOpacity={0.12} isAnimationActive={false} />
                <Line dataKey="cumulativeTarget" stroke={GOLD} strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <Legend items={[{ label: 'Cumulative collection (liability discharged)', color: SERIES[0] }, { label: 'Cumulative target', color: GOLD, line: true }]} />
          </Card>
        )}
        <Card title="Revenue after action" sub="By how sure the link to departmental action is">
          <div className="conf-bars">
            {[['Direct', v.intervention.direct, STEP_COLOR.realised], ['Probable', v.intervention.probable, SERIES[3]], ['Unattributed', v.intervention.unattributed, INK.muted], ['Pre-deposits (not revenue)', v.intervention.deposits, '#b9c5e1']].map(([k, val, c]) => {
              const max = Math.max(v.intervention.direct, v.intervention.probable, v.intervention.unattributed, v.intervention.deposits, 1);
              return <div key={k} className="conf-row"><span>{k}</span><div className="funnel-bar"><i style={{ width: `${Math.max(1.5, (val / max) * 100)}%`, background: c }} /></div><b>{inr(val)}</b></div>;
            })}
          </div>
        </Card>
      </div>
      <div className="grid g-2 mt">
        <Card title="Action yield by year the case was opened" sub="Later cohorts have had less time to realise: compare like with like">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={years} margin={{ left: 4, right: 8, top: 16, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.label} · {payload[0].payload.cases} cases</div>{payload.map((x) => <div className="r" key={x.dataKey}><i style={{ background: x.fill }} />{x.name}<b>{inr(x.value)}</b></div>)}<div className="r">Yield<b>{pctOf(payload[0].payload.yield, 1)}</b></div></div> : null)} />
              {['selected', 'established', 'realised'].map((k) => <Bar key={k} dataKey={k} name={k[0].toUpperCase() + k.slice(1)} fill={STEP_COLOR[k]} radius={[3, 3, 0, 0]} isAnimationActive={false}>{k === 'realised' && <LabelList dataKey="yield" position="top" formatter={(x) => pctOf(x, 1)} fill={INK.secondary} fontSize={11} />}</Bar>)}
            </BarChart>
          </ResponsiveContainer>
          <Legend items={['selected', 'established', 'realised'].map((k) => ({ label: k[0].toUpperCase() + k.slice(1), color: STEP_COLOR[k] }))} />
        </Card>
        <Card title="What the department is learning" sub="From closed cases" actions={<button className="btn small" onClick={() => go('learning')}>Learning →</button>}>
          <ul className="hyp-out">
            {v.learning.best && <li><b>Converts best:</b> {v.learning.best.riskType}, {pctOf(v.learning.best.conversion)} of {v.learning.best.closed} closed cases confirmed an issue.</li>}
            {v.learning.highEffortLowYield.length > 0 && <li><b>High effort, low yield:</b> {v.learning.highEffortLowYield.join(', ')}.</li>}
            {v.learning.recurring.map((r) => <li key={r.reason + r.riskType}><b>Recurring explanation:</b> {r.riskType}: "{r.reason}" ({r.cases} cases).</li>)}
            {v.learning.suggestions.map((s, i) => <li key={i}><b>Process:</b> {s.text}</li>)}
          </ul>
        </Card>
      </div>
    </>
  );
}
