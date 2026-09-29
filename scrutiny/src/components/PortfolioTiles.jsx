// Dashboard tiles built for thousands of taxpayers: each summarises the whole population at a fixed size, and any
// row, bar or cell drills down to a paged list of the taxpayers behind it.
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, Legend, Seg, InfoTip, axisProps, gridProps } from './ui.jsx';
import { Drill, listRows } from './TaxpayerList.jsx';
import { ORDER } from './RiskRanking.jsx';
import { isIssue } from '../engine/verify.js';
import { BAND, RULE_STATUS, SERIES, INK, STATUS } from '../lib/colors.js';
import { inr, int, pct } from '../lib/format.js';

const rate = (a, b) => (b ? a / b : 0);
// Shade for a share 0..1: white to rose (issues), with readable text on darker cells.
const heat = (r) => `rgba(208, 59, 59, ${r === 0 ? 0 : 0.08 + 0.72 * Math.min(1, r)})`;

// ------------------------------------------------------------------ rule x risk band
/**
 * Rules (or risk indicators) as rows; for each, the share of all taxpayers with a failed / review outcome and, per
 * risk band, the share of that band's taxpayers with an issue. It answers "which checks drive high risk" without a
 * row per taxpayer. Click a rule to list the taxpayers behind it.
 */
export function RuleMatrix({ taxpayers, catalog, openTaxpayer }) {
  const [mode, setMode] = useState('rules');
  const [all, setAll] = useState(false);
  const [pick, setPick] = useState(null);
  const cat = useMemo(() => Object.fromEntries(catalog.map((r) => [r.id, r])), [catalog]);
  const bandSize = useMemo(() => Object.fromEntries(ORDER.map((b) => [b, taxpayers.filter((a) => a.band === b).length])), [taxpayers]);
  const rows = useMemo(() => {
    const m = new Map();
    const row = (id, title) => m.get(id) || m.set(id, { id, title, fail: 0, review: 0, pass: 0, na: 0, band: Object.fromEntries(ORDER.map((b) => [b, 0])), who: [] }).get(id);
    for (const a of taxpayers) {
      if (mode === 'rules') {
        for (const r of a.results) {
          if (r.id.startsWith('K-')) continue;
          const x = row(r.id, cat[r.id]?.check || r.id);
          if (r.status === 'Fail') x.fail++; else if (r.status === 'Review') x.review++; else if (r.status === 'Pass') x.pass++; else x.na++;
          if (isIssue(r)) { x.band[a.band]++; x.who.push(a); }
        }
      } else {
        for (const f of a.fraud) {
          const x = row(f.key, f.label);
          if (f.flagged && !f.prompt) x.fail++; else if (f.flagged) x.review++; else x.pass++;
          if (f.flagged) { x.band[a.band]++; x.who.push(a); }
        }
      }
    }
    return [...m.values()].map((x) => ({ ...x, total: x.fail + x.review + x.pass + x.na })).sort((a, b) => b.fail * 2 + b.review - (a.fail * 2 + a.review) || a.id.localeCompare(b.id));
  }, [taxpayers, mode, cat]);
  const shown = all ? rows : rows.slice(0, 10);
  const picked = rows.find((r) => r.id === pick);
  return (
    <Card tour="heatmap" title={mode === 'rules' ? 'Which checks drive risk' : 'Which risk indicators drive risk'}
      sub={`One row per ${mode === 'rules' ? 'automated check' : 'risk indicator'}, not per taxpayer: the bar shows outcomes across all ${int(taxpayers.length)} taxpayers; each band column shows the share of that band's taxpayers with an issue. Click a row to see who.`}
      actions={<><Seg value={mode} onChange={(v) => { setMode(v); setPick(null); }} options={[{ value: 'rules', label: 'Checks' }, { value: 'fraud', label: 'Risk indicators' }]} />
        <InfoTip title="Reading the grid">A dark cell under High or Critical and a pale one under Low means the check separates risky taxpayers from the rest. A check that is red everywhere is common, not discriminating. Counts on the right are failed and review outcomes.</InfoTip></>}
      table={{ columns: [mode === 'rules' ? 'Check' : 'Indicator', 'Title', 'Fail', 'Review', 'Pass', 'N/A', ...ORDER.map((b) => `${b} (% with issue)`)], rows: rows.map((r) => [r.id, r.title, r.fail, r.review, r.pass, r.na, ...ORDER.map((b) => pct(rate(r.band[b], bandSize[b]), 0))]) }}>
      <div className="rm">
        <div className="rm-row rm-headrow">
          <span>{mode === 'rules' ? 'Check' : 'Indicator'}</span>
          <span>Outcome across all taxpayers</span>
          {ORDER.map((b) => <span key={b} className="rm-bandhead" title={`${int(bandSize[b])} taxpayers`}><i style={{ background: BAND[b].color }} />{b}<em>{int(bandSize[b])}</em></span>)}
          <span className="num">Issues</span>
        </div>
        {shown.map((r) => (
          <button key={r.id} className={`rm-row ${pick === r.id ? 'on' : ''}`} onClick={() => setPick(pick === r.id ? null : r.id)} aria-pressed={pick === r.id}>
            <span className="rm-name"><b className="mono">{mode === 'rules' ? r.id : ''}</b>{mode === 'rules' ? ' ' : ''}{r.title}</span>
            <span className="rm-bar" title={`Fail ${r.fail} · Review ${r.review} · Pass ${r.pass} · N/A ${r.na}`}>
              {[['fail', 'Fail'], ['review', 'Review'], ['pass', 'Pass'], ['na', 'NA']].map(([k, s]) => (r[k] ? <i key={k} style={{ flex: r[k], background: RULE_STATUS[s].color, opacity: k === 'pass' || k === 'na' ? 0.35 : 1 }} /> : null))}
            </span>
            {ORDER.map((b) => { const v = rate(r.band[b], bandSize[b]); return <span key={b} className="rm-cell" style={{ background: heat(v), color: v > 0.55 ? '#fff' : INK.primary }} title={`${b}: ${r.band[b]} of ${bandSize[b]} with an issue`}>{bandSize[b] ? pct(v, 0) : '–'}</span>; })}
            <span className="num rm-count">{int(r.fail + r.review)}</span>
          </button>
        ))}
      </div>
      {rows.length > 10 && <button className="link-btn small mt" onClick={() => setAll(!all)}>{all ? 'Show the top 10' : `Show all ${rows.length}`}</button>}
      <div className="mt"><Legend items={[{ label: 'Fail', color: RULE_STATUS.Fail.color }, { label: 'Review', color: RULE_STATUS.Review.color }, { label: 'Pass / N/A', color: '#b8d9b8' }, { label: 'Share of the band with an issue (darker = more)', color: heat(0.6) }]} /></div>
      {picked && <Drill title={`${mode === 'rules' ? picked.id : picked.title}: taxpayers with an issue`} rows={listRows(picked.who)} openTaxpayer={openTaxpayer} onClose={() => setPick(null)} />}
    </Card>
  );
}

// ------------------------------------------------------------------ findings by module
export function ModuleBars({ taxpayers, catalog }) {
  const cat = useMemo(() => Object.fromEntries(catalog.map((r) => [r.id, r])), [catalog]);
  const mods = useMemo(() => {
    const m = new Map();
    for (const a of taxpayers) {
      const hit = new Set();
      for (const r of a.results) {
        if (!isIssue(r)) continue;
        const name = cat[r.id]?.module || r.id[0];
        const x = m.get(name) || m.set(name, { name, label: name.replace(/^[A-Z]\.\s*/, ''), Fail: 0, Review: 0, taxpayers: 0 }).get(name);
        x[r.status === 'Fail' ? 'Fail' : 'Review']++;
        hit.add(name);
      }
      for (const n of hit) m.get(n).taxpayers++;
    }
    return [...m.values()].sort((a, b) => b.Fail + b.Review - (a.Fail + a.Review));
  }, [taxpayers, cat]);
  const total = mods.reduce((s, x) => s + x.Fail + x.Review, 0);
  return (
    <Card title="Findings by rule module" sub={`${int(total)} failed and review findings. The number at the end of each bar is how many taxpayers have at least one`}
      className="card-fill" table={{ columns: ['Module', 'Fail', 'Review', 'Taxpayers affected'], rows: mods.map((m) => [m.name, m.Fail, m.Review, m.taxpayers]) }}>
      {/* The chart takes whatever height the tile has next to the risk ranking: no empty band under it. */}
      <div className="fill-chart" style={{ minHeight: Math.max(240, mods.length * 34 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mods} layout="vertical" margin={{ left: 4, right: 70, top: 4, bottom: 4 }} barCategoryGap={8}>
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis type="number" {...axisProps} allowDecimals={false} tickFormatter={(v) => int(v)} />
          <YAxis type="category" dataKey="label" {...axisProps} width={150} interval={0} />
          <Tooltip cursor={{ fill: '#eef1f8' }} content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.name}</div><div className="r"><i style={{ background: RULE_STATUS.Fail.color }} />Fail<b>{int(payload[0].payload.Fail)}</b></div><div className="r"><i style={{ background: RULE_STATUS.Review.color }} />Review<b>{int(payload[0].payload.Review)}</b></div><div className="r">Taxpayers affected<b>{int(payload[0].payload.taxpayers)}</b></div></div> : null)} />
          <Bar dataKey="Fail" stackId="m" fill={RULE_STATUS.Fail.color} isAnimationActive={false} />
          <Bar dataKey="Review" stackId="m" fill={RULE_STATUS.Review.color} radius={[0, 3, 3, 0]} isAnimationActive={false}>
            <LabelList dataKey="taxpayers" position="right" formatter={(v) => int(v)} fill={INK.secondary} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
      <Legend items={[{ label: 'Fail', color: RULE_STATUS.Fail.color }, { label: 'Review', color: RULE_STATUS.Review.color }]} />
    </Card>
  );
}

// ------------------------------------------------------------------ issues per taxpayer
const ISSUE_BINS = [[0, 0, '0'], [1, 1, '1'], [2, 2, '2'], [3, 3, '3'], [4, 4, '4'], [5, 5, '5'], [6, 7, '6–7'], [8, 10, '8–10'], [11, Infinity, '11+']];
export function IssueHistogram({ taxpayers, openTaxpayer }) {
  const [pick, setPick] = useState(null);
  const data = useMemo(() => {
    const withN = taxpayers.map((a) => [a, a.results.filter(isIssue).length]);
    return ISSUE_BINS.map(([lo, hi, label]) => {
      const inBin = withN.filter(([, n]) => n >= lo && n <= hi).map(([a]) => a);
      return { label, who: inBin, total: inBin.length, ...Object.fromEntries(ORDER.map((b) => [b, inBin.filter((a) => a.band === b).length])) };
    });
  }, [taxpayers]);
  const picked = data.find((d) => d.label === pick);
  return (
    <Card title="Checks with issues per taxpayer" sub="How many failed or review checks each taxpayer has, stacked by risk band. Click a bar to see who."
      className="card-fill" table={{ columns: ['Checks with issues', 'Taxpayers', ...ORDER], rows: data.map((d) => [d.label, d.total, ...ORDER.map((b) => d[b])]) }}>
      <div className="fill-chart" style={{ minHeight: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 16, bottom: 16 }} onClick={(e) => e?.activeLabel && setPick(e.activeLabel === pick ? null : e.activeLabel)}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} label={{ value: 'failed or review checks', position: 'insideBottom', offset: -8, fill: INK.secondary, fontSize: 11 }} />
          <YAxis {...axisProps} allowDecimals={false} width={44} tickFormatter={(v) => int(v)} />
          <Tooltip cursor={{ fill: '#eef1f8' }} content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.label} failed or review check{payload[0].payload.label === '1' ? '' : 's'} · {int(payload[0].payload.total)} taxpayers</div>{ORDER.filter((b) => payload[0].payload[b]).map((b) => <div className="r" key={b}><i style={{ background: BAND[b].color }} />{b}<b>{int(payload[0].payload[b])}</b></div>)}</div> : null)} />
          {[...ORDER].reverse().map((b, i) => <Bar key={b} dataKey={b} stackId="s" fill={BAND[b].color} radius={i === ORDER.length - 1 ? [3, 3, 0, 0] : 0} style={{ cursor: 'pointer' }} isAnimationActive={false}>{i === ORDER.length - 1 && <LabelList dataKey="total" position="top" formatter={(v) => (v ? int(v) : '')} fill={INK.secondary} fontSize={11} />}</Bar>)}
        </BarChart>
      </ResponsiveContainer>
      </div>
      <Legend items={ORDER.map((b) => ({ label: b, color: BAND[b].color }))} />
      {picked && <Drill title={`Taxpayers with ${picked.label} failed or review check${picked.label === '1' ? '' : 's'}`} rows={listRows(picked.who)} openTaxpayer={openTaxpayer} onClose={() => setPick(null)} />}
    </Card>
  );
}

// ------------------------------------------------------------------ turnover x credit dependence
const TURNOVER = [[0, 1e7, '< ₹1 Cr'], [1e7, 5e7, '₹1–5 Cr'], [5e7, 25e7, '₹5–25 Cr'], [25e7, 100e7, '₹25–100 Cr'], [100e7, 500e7, '₹100–500 Cr'], [500e7, Infinity, '≥ ₹500 Cr']];
const CREDIT = [[1.1, Infinity, 'over 110%'], [1, 1.1, '100–110%'], [0.9, 1, '90–100%'], [0.75, 0.9, '75–90%'], [0.5, 0.75, '50–75%'], [-Infinity, 0.5, 'under 50%']];
export function CreditGrid({ taxpayers, openTaxpayer }) {
  const [pick, setPick] = useState(null);
  const cells = useMemo(() => CREDIT.map(([ylo, yhi, ylabel]) => TURNOVER.map(([xlo, xhi, xlabel]) => {
    const who = taxpayers.filter((a) => { const t = a.profile.turnover, c = a.profile.itcToOutput ?? 0; return t >= xlo && t < xhi && c >= ylo && c < yhi; });
    return { key: `${ylabel}|${xlabel}`, xlabel, ylabel, who, n: who.length, risky: who.filter((a) => a.band === 'High' || a.band === 'Critical').length, exposure: who.reduce((s, a) => s + a.exposure.confirmed + a.exposure.potential, 0) };
  })), [taxpayers]);
  const max = Math.max(1, ...cells.flat().map((c) => c.n));
  const shade = (n) => (n ? `rgba(59, 98, 192, ${0.1 + 0.7 * Math.log1p(n) / Math.log1p(max)})` : 'var(--line-2)');
  const picked = cells.flat().find((c) => c.key === pick);
  return (
    <Card title="Turnover against credit dependence" sub="Taxpayers counted by size and by ITC claimed as a share of output tax. Top-right: large businesses running on credit. The red badge counts high and critical risk. Click a cell to see who."
      table={{ columns: ['ITC ÷ output tax', ...TURNOVER.map((t) => t[2])], rows: cells.map((row) => [row[0].ylabel, ...row.map((c) => (c.risky ? `${c.n} (${c.risky} high/critical)` : c.n))]) }}>
      <div className="cg" style={{ gridTemplateColumns: `92px repeat(${TURNOVER.length}, minmax(0, 1fr))` }}>
        {cells.map((row) => (
          <React.Fragment key={row[0].ylabel}>
            <span className="cg-y">{row[0].ylabel}</span>
            {row.map((c) => (
              <button key={c.key} className={`cg-cell ${pick === c.key ? 'on' : ''}`} style={{ background: shade(c.n), color: c.n / max > 0.45 ? '#fff' : INK.primary }} disabled={!c.n}
                onClick={() => setPick(pick === c.key ? null : c.key)} title={`${c.xlabel} · ITC ${c.ylabel} of output tax: ${c.n} taxpayers, ${c.risky} high or critical, exposure ${inr(c.exposure)}`}>
                {c.n ? int(c.n) : ''}{c.risky ? <em className="cg-risk">{int(c.risky)}</em> : null}
              </button>
            ))}
          </React.Fragment>
        ))}
        <span />
        {TURNOVER.map((t) => <span key={t[2]} className="cg-x">{t[2]}</span>)}
      </div>
      <div className="cg-axis muted small"><span>↑ ITC as a share of output tax</span><span>turnover (GSTR-3B) →</span></div>
      <Legend items={[{ label: 'Fewer taxpayers', color: 'rgba(59, 98, 192, 0.15)' }, { label: 'More taxpayers', color: 'rgba(59, 98, 192, 0.8)' }, { label: 'High or critical risk (count)', color: STATUS.critical }]} />
      {picked && <Drill title={`${picked.xlabel} turnover, ITC ${picked.ylabel} of output tax`} rows={listRows(picked.who)} openTaxpayer={openTaxpayer} onClose={() => setPick(null)} />}
    </Card>
  );
}
