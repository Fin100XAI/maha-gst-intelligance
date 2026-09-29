// Risk ranking that stays the same size however many taxpayers are loaded: the whole population as a score
// distribution (stacked by band), band filters with counts, and a paged, searchable ranked list.
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, Legend, axisProps, gridProps } from './ui.jsx';
import TaxpayerList, { listRows } from './TaxpayerList.jsx';
import { BAND } from '../lib/colors.js';
import { int } from '../lib/format.js';

export const ORDER = ['Critical', 'High', 'Moderate', 'Low'];
const BIN = 5;

export default function RiskRanking({ taxpayers, openTaxpayer }) {
  const [bands, setBands] = useState(() => new Set(['Critical', 'High']));
  const ranked = useMemo(() => listRows(taxpayers), [taxpayers]);
  const counts = useMemo(() => Object.fromEntries(ORDER.map((b) => [b, ranked.filter((r) => r.band === b).length])), [ranked]);
  // The whole population, 0-100 in bins of 5, stacked by band (bands are configurable, so a bin can hold two).
  const hist = useMemo(() => Array.from({ length: 100 / BIN }, (_, i) => {
    const lo = i * BIN, hi = lo + BIN;
    const inBin = ranked.filter((r) => r.score >= lo && (r.score < hi || (hi === 100 && r.score === 100)));
    return { bin: `${lo}–${hi}`, lo, ...Object.fromEntries(ORDER.map((b) => [b, inBin.filter((r) => r.band === b).length])), total: inBin.length };
  }), [ranked]);
  const shown = useMemo(() => ranked.filter((r) => !bands.size || bands.has(r.band)), [ranked, bands]);
  const toggle = (b) => setBands((s) => { const n = new Set(s); if (n.has(b)) n.delete(b); else n.add(b); return n; });

  return (
    <Card tour="risk-ranking" title="Risk ranking" sub="Review-priority score 0–100 from failed and review checks weighted by severity, risk indicators and exposure ÷ turnover. It decides what to review first, never what action to take."
      table={{ columns: ['Rank', 'Taxpayer', 'GSTIN', 'Score', 'Band', 'Failed checks', 'Risk indicators', 'Exposure'], rows: ranked.map((r) => [r.rank, r.name, r.gstin, r.score, r.band, r.fails, r.flags, Math.round(r.exposure)]) }}>
      <div className="rr-dist">
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={hist} margin={{ left: 0, right: 4, top: 6, bottom: 0 }} barCategoryGap={1}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="lo" {...axisProps} tickFormatter={(v) => (v % 25 === 0 ? v : '')} interval={0} />
            <YAxis {...axisProps} allowDecimals={false} width={40} tickFormatter={(v) => int(v)} />
            <Tooltip cursor={{ fill: '#eef1f8' }} content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">Score {payload[0].payload.bin}</div>{ORDER.filter((b) => payload[0].payload[b]).map((b) => <div className="r" key={b}><i style={{ background: BAND[b].color }} />{b}<b>{int(payload[0].payload[b])}</b></div>)}{!payload[0].payload.total && <div className="r">No taxpayers</div>}</div> : null)} />
            {[...ORDER].reverse().map((b) => <Bar key={b} dataKey={b} stackId="s" fill={BAND[b].color} isAnimationActive={false} />)}
          </BarChart>
        </ResponsiveContainer>
        <div className="muted small">How all {int(ranked.length)} taxpayers are spread by score; the list below ranks them.</div>
      </div>
      <div className="rr-controls">
        <div className="rr-bands" role="group" aria-label="Filter by band">
          {ORDER.map((b) => (
            <button key={b} className={`rr-band ${bands.has(b) ? 'on' : ''}`} aria-pressed={bands.has(b)} onClick={() => toggle(b)} style={{ '--band': BAND[b].color }}>
              <i />{b}<b>{int(counts[b])}</b>
            </button>
          ))}
        </div>
      </div>
      <TaxpayerList rows={shown} openTaxpayer={openTaxpayer} resetKey={[...bands].join()} />
      <Legend items={ORDER.map((b) => ({ label: b, color: BAND[b].color }))} />
    </Card>
  );
}
