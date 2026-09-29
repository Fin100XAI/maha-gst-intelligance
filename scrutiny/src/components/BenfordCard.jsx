import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Card, Seg, Legend, InfoTip, axisProps, gridProps, xLab, yLab } from './ui.jsx';
import { SERIES } from '../lib/colors.js';
import { int } from '../lib/format.js';

// Benford's law explained for non-specialists: a plain verdict, a "distance from natural" scale, bars counted
// out of every 100 invoices, and the biggest differences in words. Thresholds are Nigrini's first-digit MAD bands.
const ZONES = [
  { to: 0.006, label: 'Close', color: '#1e8e3e' },
  { to: 0.012, label: 'Acceptable', color: '#7cb342' },
  { to: 0.015, label: 'Marginal', color: '#d99a00' },
  { to: 0.03, label: 'Unusual', color: '#c62828' },
];
const VERDICT = {
  'Insufficient sample': { tone: 'muted', head: 'Too few invoices to judge', text: 'The pattern only becomes reliable with a few hundred invoices.' },
  'Close conformity': { tone: 'good', head: 'Looks natural', text: 'The amounts follow the pattern expected of genuine business data.' },
  Acceptable: { tone: 'good', head: 'Looks natural', text: 'Small differences from the expected pattern, well within what genuine data shows.' },
  Marginal: { tone: 'warn', head: 'Slightly unusual', text: 'A little further from the expected pattern than usual. Worth a glance, not a concern on its own.' },
  Nonconformity: { tone: 'bad', head: 'Unusual pattern', text: 'The amounts do not follow the pattern expected of genuine business data. Sample the invoices behind the highlighted digits.' },
};
const per100 = (v) => Math.round(v * 1000) / 10;

function ratioWords(obs, exp) {
  const r = obs / exp;
  if (r >= 1.8) return `about ${r.toFixed(1)} times as many as expected`;
  if (r >= 1.2) return `${Math.round((r - 1) * 100)}% more than expected`;
  if (r < 0.4) return 'less than half as many as expected';
  if (r <= 0.6) return 'about half as many as expected';
  if (r <= 0.8) return `${Math.round((1 - r) * 100)}% fewer than expected`;
  return 'close to expected';
}

export default function BenfordCard({ bf, side, setSide }) {
  const v = VERDICT[bf.verdict] || VERDICT['Insufficient sample'];
  const judged = bf.n >= 100 && bf.mad != null;
  const worst = [...bf.rows].map((r) => ({ ...r, gap: r.observed - r.expected })).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  const notable = judged ? worst.filter((r) => Math.abs(r.gap) >= 0.02).slice(0, 2) : [];
  const hi = new Set(bf.verdict === 'Marginal' || bf.verdict === 'Nonconformity' ? notable.map((r) => r.digit) : []);
  const data = bf.rows.map((r) => ({ digit: r.digit, actual: per100(r.observed), expected: per100(r.expected), count: r.count }));
  const scaleMax = ZONES[ZONES.length - 1].to;
  const marker = judged ? Math.min(bf.mad, scaleMax) / scaleMax : null;
  const what = side === 'out' ? 'sales invoices' : 'purchase invoices';

  const info = (
    <InfoTip title="Benford's law">
      <p>In real-world amounts, the first digit is far more often 1 than 9: about 30 in every 100 genuine invoice values start with 1, and fewer than 5 start with 9. Invented or manipulated amounts tend to spread the first digits more evenly, so they drift away from this curve.</p>
      <p><b>Distance from natural</b> is the average gap between the actual and expected shares across the nine digits (Nigrini's mean absolute deviation, MAD): below 0.006 close, 0.006 to 0.012 acceptable, 0.012 to 0.015 marginal, above 0.015 unusual.</p>
      <p>The risk indicator is raised only when the distance is above 0.015 and there are at least 300 invoices. Fixed price lists, a few repeating products or rate-based billing can also bend the pattern, so treat it as a reason to sample invoices, never as proof.</p>
    </InfoTip>
  );

  return (
    <Card title="Do the invoice amounts look natural?" sub={`Benford's law check on the first digit of ${int(bf.n)} ${what}`}
      actions={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Seg value={side} onChange={setSide} options={[{ value: 'out', label: 'Sales' }, { value: 'in', label: 'Purchases' }]} />{info}</div>}
      table={{ columns: ['First digit', 'Actual per 100', 'Expected per 100', 'Invoices'], rows: data.map((r) => [r.digit, r.actual, r.expected, r.count]) }}>
      <div className={`bf-verdict ${v.tone}`}>
        <b>{v.head}.</b> {v.text}
        {judged && bf.n < 300 && <div className="bf-small">Based on only {int(bf.n)} invoices: the risk indicator needs at least 300 to be reliable, so this is shown for context and not scored.</div>}
      </div>

      {judged && (
        <div className="bf-scale" aria-label={`Distance from natural pattern: ${bf.mad.toFixed(4)}, ${bf.verdict}`}>
          <div className="bf-scale-l">Distance from the natural pattern</div>
          <div className="bf-track">
            {ZONES.map((z, i) => <span key={z.label} style={{ flex: (z.to - (ZONES[i - 1]?.to || 0)) / scaleMax, background: z.color }} title={`${z.label}: up to ${z.to}`} />)}
            <i style={{ left: `${marker * 100}%` }} title={`MAD ${bf.mad.toFixed(4)}`} />
          </div>
          <div className="bf-zones">{ZONES.map((z, i) => <span key={z.label} style={{ flex: (z.to - (ZONES[i - 1]?.to || 0)) / scaleMax }}>{z.label}</span>)}</div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="digit" {...axisProps} height={40} label={xLab('First digit of the invoice amount')} />
          <YAxis {...axisProps} width={56} label={yLab('Invoices out of every 100')} />
          <Tooltip cursor={{ fill: '#eef1f8' }} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const r = payload[0].payload;
            return (
              <div className="tt bf-tt">
                <div className="h">Amounts starting with {r.digit}</div>
                <div>Here: <b>{r.actual}</b> in every 100 invoices ({int(r.count)} invoices)</div>
                <div>Natural pattern: about <b>{r.expected}</b> in 100</div>
                <div className="muted">{ratioWords(r.actual, r.expected)}</div>
              </div>
            );
          }} />
          <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]} maxBarSize={34}>
            {data.map((r) => <Cell key={r.digit} fill={hi.has(r.digit) ? SERIES[4] : SERIES[0]} />)}
          </Bar>
          <Line dataKey="expected" name="Natural pattern" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 3.5, fill: SERIES[1], stroke: '#fff', strokeWidth: 1.5 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend items={[{ label: 'Actual invoices', color: SERIES[0] }, ...(hi.size ? [{ label: 'Furthest from natural', color: SERIES[4] }] : []), { label: 'Natural pattern (expected)', color: SERIES[1], line: true }]} />

      {notable.length > 0 && (
        <ul className="bf-notes">
          {notable.map((r) => (
            <li key={r.digit}>Amounts starting with <b>{r.digit}</b>: {per100(r.observed)} in every 100 invoices, against about {per100(r.expected)} expected ({ratioWords(r.observed, r.expected)}).</li>
          ))}
        </ul>
      )}
      <div className="bf-foot">A lead, not proof: price lists, fixed rates or a few repeating products can also bend this pattern. Use it to choose which invoices to sample.</div>
    </Card>
  );
}
