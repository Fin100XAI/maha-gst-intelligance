// "Why did revenue move?" for one taxpayer: the exact driver waterfall, what is explained and what is not, competing
// explanations with their evidence, and the month-by-month check. All numbers come from src/engine/revenue.js.
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Card, Kpi, Legend, Seg, DataTable, axisProps, gridProps, InfoTip } from './ui.jsx';
import Icon from './Icon.jsx';
import { explainRevenueChange } from '../engine/revenue.js';
import { STATUS, SERIES, INK, BRAND } from '../lib/colors.js';
import { inr, axisInr, pct } from '../lib/format.js';

// Class is a state, so it wears the reserved status colours, always with its label.
export const CLASS_STYLE = {
  explained: { color: '#0c6a4a', chip: 'good', label: 'Explained' },
  partial: { color: STATUS.warning, chip: 'warn', label: 'Partially explained' },
  unresolved: { color: STATUS.critical, chip: 'bad', label: 'Unresolved' },
  insufficient: { color: STATUS.neutral, chip: '', label: 'Data insufficient' },
};
const HYP = {
  supported: { chip: 'good', label: 'Supported' },
  partial: { chip: 'warn', label: 'Partly supported' },
  concern: { chip: 'bad', label: 'Concern' },
  'not supported': { chip: '', label: 'Not supported' },
  'not applicable': { chip: '', label: 'Not applicable' },
};
export const VERDICT = {
  examine: { tone: 'bad', icon: 'alert', title: 'Examine' },
  'itc-watch': { tone: 'warn', icon: 'alert', title: 'Watch credit use' },
  'tax-fell': { tone: 'warn', icon: 'alert', title: 'Output tax fell' },
  'de-escalate': { tone: 'good', icon: 'check', title: 'Explained' },
  'no-decline': { tone: 'good', icon: 'check', title: 'No decline' },
  stable: { tone: '', icon: 'check', title: 'Stable' },
};
const fy = (s) => `FY ${s}`;
export const short = (s) => String(s).replace(/^20(\d\d)-(?:20)?(\d\d)$/, '$1-$2'); // 2024-2025 or 2024-25 -> 24-25
// Chart labels: drop the company-form suffixes so names fit on one line
export const shortName = (s, k = 30) => { const t = String(s).replace(/\b(PRIVATE|PVT\.?)\s+(LIMITED|LTD\.?)|\bLIMITED\b|\bLTD\b\.?/gi, '').replace(/\s+/g, ' ').trim(); return t.length > k ? `${t.slice(0, k - 1)}…` : t; };

export function ClassChip({ cls }) {
  const s = CLASS_STYLE[cls];
  return <span className={`chip ${s.chip}`}><i className="cls-dot" style={{ background: s.color }} />{s.label}</span>;
}

export default function RevenueChange({ baselines }) {
  const pairs = (baselines || []).slice(1).map((cur, i) => [baselines[i], cur]);
  const [pick, setPick] = useState(pairs.length - 1);
  const pair = pairs[Math.min(pick, pairs.length - 1)];
  const x = useMemo(() => (pair ? explainRevenueChange(pair[0], pair[1]) : null), [pair]);

  if (!x) {
    return (
      <Card title="Revenue change" sub="Needs two financial years of returns for this GSTIN">
        <div className="note">Only {baselines?.length ? fy(baselines[0].fy) : 'one year'} is loaded. Upload the earlier year's “Get Download All Report” workbook in Upload data to see what changed and why.</div>
      </Card>
    );
  }
  const v = VERDICT[x.verdict.code];
  return (
    <div className="revenue">
      <div className={`verdict ${v.tone}`} role="status">
        <Icon name={v.icon} size={18} />
        <div>
          <b>{v.title}.</b> {x.verdict.text}
          <div className="verdict-sub">{fy(x.prior.fy)} → {fy(x.current.fy)} · measure: {x.measure}</div>
        </div>
        {pairs.length > 1 && (
          <div className="verdict-seg"><Seg value={pick} onChange={setPick} options={pairs.map(([a, b], i) => ({ value: i, label: `${short(a.fy)} → ${short(b.fy)}` }))} /></div>
        )}
      </div>

      <div className="grid g-4 mt">
        <Kpi label={`Cash paid ${short(x.current.fy)}`} value={inr(x.current.cash)} sub={`${x.change >= 0 ? '+' : ''}${inr(x.change)} (${pct(x.prior.cash ? x.change / x.prior.cash : null)}) on ${short(x.prior.fy)}`} />
        <Kpi label="Output tax" value={inr(x.current.outputTax)} sub={`was ${inr(x.prior.outputTax)} · ${pct(x.prior.outputTax ? x.current.outputTax / x.prior.outputTax - 1 : null)}`} />
        <Kpi label="Turnover (3B)" value={inr(x.current.turnover)} sub={`was ${inr(x.prior.turnover)} · ${pct(x.prior.turnover ? x.current.turnover / x.prior.turnover - 1 : null)}`} />
        <Kpi label="ITC used" value={inr(x.current.itcUsed)} sub={`was ${inr(x.prior.itcUsed)} · ${pct(x.prior.itcUsed ? x.current.itcUsed / x.prior.itcUsed - 1 : null)}`} />
      </div>

      <div className="grid g-21 mt">
        <Waterfall x={x} />
        <ClassSplit x={x} />
      </div>

      <Drivers x={x} />
      <Hypotheses x={x} />
      <MonthlyCheck x={x} />

      <div className="prelim mt" role="note">
        <Icon name="alert" size={16} />
        <div><b>What this is.</b> An explanation of movement built only from the returns. “Explained” means a named cause is visible in the returns, not that it has been verified; nothing here is a finding of liability. Verify the listed evidence before acting or closing.</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ waterfall
function Waterfall({ x }) {
  const scale = Math.max(Math.abs(x.prior.cash), Math.abs(x.current.cash), ...x.drivers.map((d) => Math.abs(d.amount)));
  const shown = x.drivers.filter((d) => Math.abs(d.amount) >= 0.005 * scale);
  const rest = x.drivers.filter((d) => !shown.includes(d));
  const restSum = rest.reduce((s, d) => s + d.amount, 0);
  // Drivers under 0.5% of the scale are one bar (or none, when they net to nothing visible)
  const steps = [...shown.map((d) => ({ name: d.label, amount: d.amount, cls: d.class })), ...(Math.abs(restSum) >= 0.005 * scale ? [{ name: `${rest.length} other drivers`, amount: restSum, cls: 'insufficient' }] : [])];
  let run = x.prior.cash;
  const rows = [{ name: `Cash paid ${short(x.prior.fy)}`, range: [0, x.prior.cash], amount: x.prior.cash, kind: 'total' }];
  for (const s of steps) { const lo = Math.min(run, run + s.amount), hi = Math.max(run, run + s.amount); rows.push({ ...s, range: [lo, hi] }); run += s.amount; }
  rows.push({ name: `Cash paid ${short(x.current.fy)}`, range: [0, x.current.cash], amount: x.current.cash, kind: 'total' });
  const tick = (s) => shortName(s, 26);
  return (
    <Card tour="waterfall" title="From last year's cash to this year's, driver by driver" sub={`Each bar is one driver's effect on cash paid; together they add up exactly (${x.reconciled ? 'reconciled to the rupee' : 'NOT reconciled'})`}
      actions={<InfoTip title="How the bridge is built">Cash paid = output tax − ITC used + other. Output tax = turnover × effective rate. So the change splits exactly into volume (last year's rate × change in sales, by customer group), rate (on the same HSN) and mix, credit used instead of cash, and the rest. Open any driver below to see its formula and inputs.</InfoTip>}
      table={{ columns: ['Step', 'Effect on cash (₹)', 'Class'], rows: rows.map((r) => [r.name, Math.round(r.amount), r.kind === 'total' ? '-' : CLASS_STYLE[r.cls].label]) }}>
      <ResponsiveContainer width="100%" height={Math.max(260, rows.length * 34 + 40)}>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={4}>
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
          <YAxis type="category" dataKey="name" {...axisProps} width={190} tickFormatter={tick} interval={0} />
          <Tooltip cursor={{ fill: 'rgba(26,46,94,0.05)' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const r = payload[0].payload;
            return <div className="tt"><div className="h">{r.name}</div><div className="r">{r.kind === 'total' ? 'Cash paid' : 'Effect on cash'}<b>{r.kind === 'total' ? inr(r.amount) : `${r.amount >= 0 ? '+' : ''}${inr(r.amount)}`}</b></div>{r.kind !== 'total' && <div className="r">Class<b>{CLASS_STYLE[r.cls].label}</b></div>}</div>;
          }} />
          <ReferenceLine x={0} stroke={INK.axis} />
          <Bar dataKey="range" radius={4} isAnimationActive={false} stroke="#fff" strokeWidth={2}>
            {rows.map((r) => <Cell key={r.name} fill={r.kind === 'total' ? BRAND : CLASS_STYLE[r.cls].color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Legend items={[{ label: 'Cash paid (year totals)', color: BRAND }, ...Object.values(CLASS_STYLE).map((c) => ({ label: c.label, color: c.color }))]} />
    </Card>
  );
}

function ClassSplit({ x }) {
  const total = Object.values(x.byClass).reduce((s, v) => s + Math.abs(v), 0) || 1;
  return (
    <Card title="Explained vs not" sub="Net effect on cash of the drivers in each class">
      <div className="cls-list">
        {Object.entries(CLASS_STYLE).map(([k, c]) => (
          <div key={k} className="cls-row">
            <div className="cls-head"><ClassChip cls={k} /><b className={x.byClass[k] < 0 ? 'neg' : ''}>{x.byClass[k] >= 0 ? '+' : ''}{inr(x.byClass[k])}</b></div>
            <div className="cls-bar"><i style={{ width: `${Math.max(x.byClass[k] ? 2 : 0, (Math.abs(x.byClass[k]) / total) * 100)}%`, background: c.color }} /></div>
            <div className="muted small">{x.classes[k].note}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ drivers with drill-down
function Drivers({ x }) {
  const [open, setOpen] = useState(null);
  const sorted = [...x.drivers].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  const floor = Math.max(1000, 0.001 * Math.max(Math.abs(x.prior.cash), Math.abs(x.current.cash)));
  const rows = sorted.filter((d) => Math.abs(d.amount) >= floor);
  const quiet = sorted.filter((d) => !rows.includes(d));
  return (
    <Card className="mt" tour="drivers" title="Drivers, their formulas and evidence" sub="Largest first. Open a driver to see how it was calculated and which customers, suppliers, HSN codes or months are behind it.">
      <div className="drv-list">
        {rows.map((d) => (
          <div key={d.key} className={`drv ${open === d.key ? 'open' : ''}`}>
            <button className="drv-head" onClick={() => setOpen(open === d.key ? null : d.key)} aria-expanded={open === d.key}>
              <span className="drv-name">{d.label}</span>
              <ClassChip cls={d.class} />
              <b className={`drv-amt ${d.amount < 0 ? 'neg' : ''}`}>{d.amount >= 0 ? '+' : ''}{inr(d.amount)}</b>
              <Icon name="arrow" size={14} />
            </button>
            {open === d.key && (
              <div className="drv-body">
                <div className="drv-formula"><span className="eyebrow">Formula</span><code>{d.formula}</code></div>
                {d.inputs?.length > 0 && <div className="drv-inputs">{d.inputs.map(([k, v]) => <span key={k} className="tag">{k}: {v}</span>)}</div>}
                {d.detail?.length > 0 && <DetailTable d={d} />}
              </div>
            )}
          </div>
        ))}
      </div>
      {quiet.length > 0 && <div className="muted small mt">No material effect ({'<'} {inr(floor)} each): {quiet.map((d) => d.label.toLowerCase()).join('; ')}.</div>}
    </Card>
  );
}

function DetailTable({ d }) {
  if (d.key === 'rate') {
    return <DataTable max={260} columns={['HSN', 'Description', 'Taxable this year', 'Rate before', 'Rate now', 'Effect on tax']} rows={d.detail.map((r) => [r.hsn, r.desc, r.taxable, pct(r.ratePrior), pct(r.rateCurrent), Math.round(r.effect)])} />;
  }
  if (d.key === 'itc') {
    return <DataTable max={260} columns={['Supplier', 'GSTIN', 'ITC last year', 'ITC this year', 'Change', 'Flags']} rows={d.detail.map((r) => [r.name, r.key, r.prior, r.current, r.change, [r.isNew && 'new supplier', r.notFiled && 'not filed 3B', r.invalidGstin && 'invalid GSTIN'].filter(Boolean).join(', ') || '-'])} />;
  }
  const unit = d.key === 'unfiled' ? ['Month', 'Month', 'Before', 'GSTR-1 sales', 'Sales without 3B'] : d.key === 'negative' ? ['Period', 'Period', 'Tax declared', 'Liability', 'Difference'] : ['GSTIN', 'Name', 'Last year', 'This year', 'Change'];
  return <DataTable max={260} columns={unit} rows={d.detail.map((r) => [r.key, r.name, r.prior, r.current, r.change])} />;
}

// ------------------------------------------------------------------ competing explanations
function Hypotheses({ x }) {
  const live = x.hypotheses.filter((h) => ['supported', 'partial', 'concern'].includes(h.status));
  const out = x.hypotheses.filter((h) => !live.includes(h));
  return (
    <Card className="mt" tour="hypotheses" title="Competing explanations" sub="Each possible cause is tested against the returns: what supports it, what argues against it, and what the officer still needs"
      actions={<InfoTip title="Why test alternatives?">A fall in tax is not by itself evasion. Before escalating, the platform checks the usual legitimate causes (rate change, seasonality, a branch taking over sales, a lost customer, returns and discounts, a real fall in business) and the usual concerns (credit replacing cash, returns not filed). A case is de-escalated only when legitimate causes explain the change.</InfoTip>}>
      {live.length === 0 && <div className="note">No explanation is supported by the returns data.</div>}
      <div className="hyp-grid">
        {live.map((h) => (
          <div key={h.key} className={`hyp ${HYP[h.status].chip}`}>
            <div className="hyp-head"><b>{h.label}</b><span className={`chip ${HYP[h.status].chip}`}>{HYP[h.status].label}</span></div>
            {h.effect ? <div className="muted small">Linked drivers: {h.effect >= 0 ? '+' : ''}{inr(h.effect)} on cash</div> : null}
            {h.evidenceFor.length > 0 && <List title="Evidence for" items={h.evidenceFor} />}
            {h.evidenceAgainst.length > 0 && <List title="Evidence against" items={h.evidenceAgainst} />}
            {h.missing.length > 0 && <List title="Evidence still needed" items={h.missing} />}
            {h.questions.length > 0 && <List title="Ask the taxpayer" items={h.questions} />}
          </div>
        ))}
      </div>
      {out.length > 0 && (
        <details className="mt">
          <summary className="muted">Ruled out or not applicable ({out.length})</summary>
          <ul className="hyp-out">{out.map((h) => <li key={h.key}><b>{h.label}</b>: {h.evidenceAgainst.join('; ') || HYP[h.status].label}</li>)}</ul>
        </details>
      )}
    </Card>
  );
}
const List = ({ title, items }) => <div className="hyp-list"><div className="eyebrow">{title}</div><ul>{items.map((t) => <li key={t}>{t}</li>)}</ul></div>;

// ------------------------------------------------------------------ month-by-month (capability 5)
function MonthlyCheck({ x }) {
  const d = x.deviation;
  const rows = d.months.map((m) => ({ ...m, band: [m.low, m.high] }));
  const barColor = (m) => (!m.flagged ? SERIES[0] : m.reason.code === 'unexplained' ? STATUS.critical : STATUS.warning);
  return (
    <Card className="mt" tour="monthly" title="Month by month against last year" sub={`Expected = same month last year × this year's growth in the other months${d.levelShift ? ' (on each side of the step)' : ''}; band ±${pct(d.tolerance, 0)}. Flagged only when outside the band and at least ${inr(d.material)}.`}
      table={{ columns: ['Month', 'Last year', 'Expected', 'Actual', 'Deviation', 'Flag', 'Reason'], rows: d.months.map((m) => [m.label, Math.round(m.prior), Math.round(m.expected), Math.round(m.actual), Math.round(m.deviation), m.flagged ? m.direction : '-', m.reason?.text || '-']) }}>
      {d.levelShift && <div className="note" style={{ marginBottom: 10 }}><b>Sustained change from {d.levelShift.label}.</b> {d.levelShift.text}.</div>}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={rows} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={axisInr} width={56} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const m = payload[0].payload;
            return <div className="tt"><div className="h">{m.label}</div><div className="r">Output tax<b>{inr(m.actual)}</b></div><div className="r">Expected<b>{inr(m.expected)}</b></div><div className="r">Last year<b>{inr(m.prior)}</b></div>{m.flagged && <div className="r">{m.reason.code === 'unexplained' ? 'Unexplained' : 'Explained'}<b>{m.reason.text}</b></div>}</div>;
          }} />
          <Area dataKey="band" stroke="none" fill={INK.grid} fillOpacity={0.9} isAnimationActive={false} name="Expected band" />
          <Bar dataKey="actual" name="Output tax" barSize={18} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((m) => <Cell key={m.m} fill={barColor(m)} />)}
          </Bar>
          <Line dataKey="expected" name="Expected" stroke={INK.secondary} strokeDasharray="4 3" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="prior" name="Last year" stroke={INK.muted} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          {d.levelShift && <ReferenceLine x={d.levelShift.label} stroke={INK.secondary} strokeDasharray="2 2" label={{ value: 'step', position: 'top', fill: INK.secondary, fontSize: 11 }} />}
        </ComposedChart>
      </ResponsiveContainer>
      <Legend items={[{ label: 'Output tax (GSTR-1)', color: SERIES[0] }, { label: 'Flagged, explained', color: STATUS.warning }, { label: 'Flagged, unexplained', color: STATUS.critical }, { label: 'Expected', color: INK.secondary, line: true }, { label: 'Last year', color: INK.muted, line: true }, { label: 'Expected band', color: INK.grid }]} />
      {d.flagged.length > 0 && (
        <ul className="hyp-out">{d.flagged.map((m) => <li key={m.m}><b>{m.label}</b>: {m.direction} expected by {inr(Math.abs(m.deviation))}; {m.reason.text}.</li>)}</ul>
      )}
    </Card>
  );
}
