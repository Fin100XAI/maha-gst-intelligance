// Revenue intelligence for a jurisdiction: who moved cash paid year on year, by how much, and whether the returns
// explain it. Jurisdictions come from the taxpayer master register; without one, every loaded GSTIN is shown.
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Card, Kpi, PageHead, Legend, axisProps, gridProps, InfoTip } from '../components/ui.jsx';
import { explainRevenueChange, portfolioMovement } from '../engine/revenue.js';
import { VERDICT, CLASS_STYLE, short, shortName } from '../components/RevenueChange.jsx';
import { INK } from '../lib/colors.js';
import { inr, axisInr, pct } from '../lib/format.js';

// Diverging poles: growth and decline in cash paid (a neutral midpoint at zero).
const GROW = '#1c5cab', FALL = '#c23a3a';
const ALL = '__all';

export default function Revenue({ data, registers, openRevenue }) {
  const master = registers?.master?.records || [];
  const jurisdictions = useMemo(() => [...new Set(master.map((r) => r.jurisdiction))].sort(), [master]);
  const baselines = data.baselines || {};
  // Default: the jurisdiction with the most loaded GSTINs (registers load after the first render, so this is derived).
  const busiest = useMemo(() => {
    const n = (j) => master.filter((r) => r.jurisdiction === j && baselines[r.gstin]).length;
    return [...jurisdictions].sort((x, y) => n(y) - n(x))[0];
  }, [jurisdictions, master, baselines]);
  const [jurPick, setJur] = useState(null);
  const jur = jurPick ?? (busiest || ALL);

  const gstins = useMemo(() => {
    const loaded = Object.keys(baselines);
    if (jur === ALL) return loaded;
    const inJur = new Set(master.filter((r) => r.jurisdiction === jur).map((r) => r.gstin));
    return loaded.filter((g) => inJur.has(g));
  }, [jur, baselines, master]);

  const move = useMemo(() => portfolioMovement(baselines, gstins), [baselines, gstins]);
  const rows = useMemo(() => move.rows.map((r) => {
    const b = baselines[r.gstin];
    const x = b.length > 1 ? explainRevenueChange(b[b.length - 2], b[b.length - 1]) : null;
    return { ...r, x, unresolved: x ? -(x.byClass.unresolved + x.byClass.insufficient) : 0 };
  }), [move, baselines]);

  if (!Object.keys(baselines).length) {
    return <div className="page"><PageHead title="Revenue" /><div className="card note">No year-on-year baselines in this dataset. Rebuild the data (npm run build:data) or upload returns in Upload data.</div></div>;
  }
  const declines = rows.filter((r) => r.status === 'decline');
  const examine = rows.filter((r) => r.x && ['examine', 'itc-watch', 'tax-fell'].includes(r.x.verdict.code));
  const explained = rows.filter((r) => r.x && ['de-escalate'].includes(r.x.verdict.code));
  const years = [...new Set(rows.filter((r) => r.priorFy).map((r) => `FY ${short(r.priorFy)} → ${short(r.fy)}`))];
  const firstYear = rows.filter((r) => !r.priorFy).length;
  const chartRows = rows.filter((r) => r.change !== 0);

  return (
    <div className="page">
      <PageHead title="Revenue" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · ${rows.length} taxpayers`}>
        <label className="field inline">
          <span>Jurisdiction</span>
          <select value={jur} onChange={(e) => setJur(e.target.value)}>
            {jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
            <option value={ALL}>All loaded GSTINs</option>
          </select>
        </label>
      </PageHead>
      {!master.length && <div className="note">No taxpayer master register loaded, so every loaded GSTIN is shown. Upload one in Upload data to see jurisdictions.</div>}

      <div className="grid g-4 mt">
        <Kpi label="Cash paid, latest year" value={inr(move.total.current)} sub={`was ${inr(move.total.prior)} · ${move.total.change >= 0 ? '+' : ''}${inr(move.total.change)} (${pct(move.total.prior ? move.total.change / move.total.prior : null)})`} />
        <Kpi label="Taxpayers paying less" value={declines.length} sub={`${declines.filter((r) => r.explanationRequired).length} fell by ₹10 L or more`} />
        <Kpi label="Need examination" value={examine.length} sub="unresolved drivers, credit replacing cash, or output tax fell" dot={examine.length ? '#b02222' : undefined} />
        <Kpi label="Decline explained" value={explained.length} sub="named, legitimate causes in the returns: verify, then close" />
      </div>

      <Card className="mt" tour="rev-contributors" title="Who moved the jurisdiction's cash collection" sub={`Change in GSTR-3B cash paid, latest year on the one before (${years.join(', ')}${firstYear ? `; ${firstYear} first-year registration${firstYear > 1 ? 's' : ''}` : ''}). Contributions add up to the total change of ${inr(move.total.change)}.`}
        actions={<InfoTip title="How to read this">Each bar is one taxpayer's change in tax paid in cash. Red bars paid less, blue bars paid more. A first-year registration counts its whole payment as growth. Click a bar or a row to see why that taxpayer's cash moved.</InfoTip>}
        table={{ columns: ['Taxpayer', 'GSTIN', 'Prior', 'Current', 'Change', 'Share of total change'], rows: rows.map((r) => [r.name, r.gstin, r.prior, r.current, r.change, pct(r.share)]) }}>
        <ResponsiveContainer width="100%" height={Math.max(220, chartRows.length * 26 + 40)}>
          <BarChart data={chartRows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barCategoryGap={3}>
            <CartesianGrid {...gridProps} horizontal={false} vertical />
            <XAxis type="number" {...axisProps} tickFormatter={axisInr} />
            <YAxis type="category" dataKey="name" {...axisProps} width={210} interval={0} tickFormatter={(s) => shortName(s, 30)} />
            <Tooltip cursor={{ fill: 'rgba(26,46,94,0.05)' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const r = payload[0].payload;
              return <div className="tt"><div className="h">{r.name}</div><div className="r">Change<b>{r.change >= 0 ? '+' : ''}{inr(r.change)}</b></div><div className="r">{r.priorFy || 'no prior year'}<b>{inr(r.prior)}</b></div><div className="r">{r.fy}<b>{inr(r.current)}</b></div>{r.x && <div className="r">Verdict<b>{VERDICT[r.x.verdict.code].title}</b></div>}</div>;
            }} />
            <ReferenceLine x={0} stroke={INK.secondary} />
            <Bar dataKey="change" radius={4} isAnimationActive={false} onClick={(r) => openRevenue(r.gstin)} style={{ cursor: 'pointer' }}>
              {chartRows.map((r) => <Cell key={r.gstin} fill={r.change < 0 ? FALL : GROW} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Legend items={[{ label: 'Paid less than last year', color: FALL }, { label: 'Paid more (or newly registered)', color: GROW }]} />
      </Card>

      <Card className="mt" tour="rev-status" title="Explanation status by taxpayer" sub="Largest fall first. Unresolved = drivers the returns cannot explain (for example credit from new or non-filing suppliers, or sales with no GSTR-3B).">
        <div className="tbl-wrap" style={{ maxHeight: 560 }}>
          <table className="tbl click">
            <thead><tr><th>Taxpayer</th><th>Years</th><th className="num">Prior</th><th className="num">Current</th><th className="num">Change</th><th>Verdict</th><th className="num">Unresolved</th><th>Main driver</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const main = r.x ? [...r.x.drivers].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0] : null;
                const v = r.x ? VERDICT[r.x.verdict.code] : null;
                return (
                  <tr key={r.gstin} onClick={() => openRevenue(r.gstin)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openRevenue(r.gstin)}>
                    <td><b>{r.name}</b><div className="mono muted">{r.gstin}</div></td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{r.priorFy ? `${short(r.priorFy)} → ${short(r.fy)}` : `${short(r.fy)} (first)`}</td>
                    <td className="num">{inr(r.prior)}</td>
                    <td className="num">{inr(r.current)}</td>
                    <td className={`num ${r.change < 0 ? 'neg' : ''}`}>{r.change >= 0 ? '+' : ''}{inr(r.change)}<div className="muted">{pct(r.pct)}</div></td>
                    <td>{v ? <span className={`chip ${v.tone}`}>{v.title}</span> : <span className="chip">New</span>}</td>
                    <td className="num">{r.unresolved > 0 ? inr(r.unresolved) : '-'}</td>
                    <td>{main ? <><span>{main.label}</span> <span className="muted">({main.amount >= 0 ? '+' : ''}{inr(main.amount)}, {CLASS_STYLE[main.class].label.toLowerCase()})</span></> : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="prelim mt" role="note"><div><b>Preliminary.</b> Figures come from the loaded returns only. Explanations are leads for the officer to verify, not findings of liability.</div></div>
    </div>
  );
}
