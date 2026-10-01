import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, Kpi, BandChip, Tip, Legend, axisProps, gridProps, PageHead, SearchBox, xLab } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import Insights from '../components/Insights.jsx';
import RiskRanking from '../components/RiskRanking.jsx';
import { RuleMatrix, ModuleBars, IssueHistogram, CreditGrid } from '../components/PortfolioTiles.jsx';
import { raisedIndicators } from '../engine/verify.js';
import { CorrelationMatrix } from '../components/special.jsx';
import { STATUS } from '../lib/colors.js';
import { inr, axisInr, pct, int } from '../lib/format.js';

const short = (n, k = 22) => (n.length > k ? `${n.slice(0, k - 1)}…` : n);
const title = (s) => s.replace(/\b(PRIVATE|PVT\.?|LIMITED|LTD\.?)\b/gi, '').replace(/\s+/g, ' ').trim();

export default function Portfolio({ data, openTaxpayer, go, aiProps, latestUpload }) {
  const { taxpayers, catalog, portfolio } = data;
  // Taxpayers can be on different latest years: say so, and date the view by the newest extract.
  const fys = [...new Set(taxpayers.map((a) => a.fy))].sort();
  const newest = taxpayers.map((a) => a.asOf).filter(Boolean).sort().pop();
  const headline = `${int(taxpayers.length)} taxpayers · ${fys.length > 1 ? `latest FY per taxpayer (${fys[0]} to ${fys[fys.length - 1]})` : `FY ${fys[0]}`}${newest ? ` · data to ${newest}` : ''}`;

  const totals = useMemo(() => {
    const t = { turnover: 0, confirmed: 0, potential: 0, fails: 0, reviews: 0, flags: 0, highRisk: 0, itc: 0 };
    for (const a of taxpayers) {
      t.turnover += a.profile.turnover; t.itc += a.profile.itcClaimed; t.confirmed += a.exposure.confirmed; t.potential += a.exposure.potential;
      t.fails += a.results.filter((r) => r.status === 'Fail').length; t.reviews += a.results.filter((r) => r.status === 'Review').length;
      t.flags += raisedIndicators(a).length; if (a.band === 'High' || a.band === 'Critical') t.highRisk++;
    }
    return t;
  }, [taxpayers]);

  const exposure = taxpayers.map((a) => ({ id: a.id, name: short(title(a.name), 22), confirmed: a.exposure.confirmed, potential: a.exposure.potential })).sort((a, b) => b.confirmed + b.potential - (a.confirmed + a.potential));

  return (
    <div className="page">
      <PageHead title="Dashboard" path={headline}>
        <SearchBox taxpayers={taxpayers} onPick={openTaxpayer} />
        {aiProps?.hidden && <button className="btn" data-tour="insights" onClick={() => aiProps.setHidden(false)}><Icon name="rules" size={15} /> Show key insights</button>}
        <button className="btn primary" onClick={() => go('cases')}>Open cases <Icon name="arrow" size={16} stroke={2.4} /></button>
      </PageHead>
      <UploadBanner batch={latestUpload} go={go} />

      <div className="grid g-kpi" data-tour="kpis">
        <Kpi label="High · critical risk" value={int(totals.highRisk)} dot={totals.highRisk ? '#b02222' : '#0c6a4a'} sub={`of ${int(taxpayers.length)} taxpayers scrutinised`} />
        <Kpi label="Turnover · 3B" value={inr(totals.turnover)} sub={`ITC claimed ${inr(totals.itc)}`} />
        <Kpi label="Computed exposure" value={inr(totals.confirmed)} sub={`${int(totals.fails)} checks with exceptions · unverified`} fill={totals.confirmed / Math.max(1, totals.confirmed + totals.potential)} accent="#b02222" />
        <Kpi label="Under review" value={inr(totals.potential)} sub={`${int(totals.reviews)} checks need officer review`} fill={totals.potential / Math.max(1, totals.confirmed + totals.potential)} accent="#fab219" />
        <Kpi label="Risk indicators" value={int(totals.flags)} dot={totals.flags ? '#b02222' : '#0c6a4a'} sub={`across ${int(taxpayers.filter((a) => raisedIndicators(a).length).length)} taxpayers`} />
      </div>

      {!aiProps?.hidden && <div className="mt" data-tour="insights"><Insights scope="portfolio" data={data} {...aiProps} /></div>}

      <div className="grid g-21 mt">
        <RiskRanking taxpayers={taxpayers} openTaxpayer={openTaxpayer} />
        <ModuleBars taxpayers={taxpayers} catalog={catalog} />
      </div>

      <div className="grid g-2 mt">
        <Card title="Exposure by taxpayer" sub={`Largest ${Math.min(15, exposure.length)} of ${int(exposure.length)}: computed from checks with exceptions vs under review (e.g. Rule 37A items awaiting validation). Unverified system figures, not confirmed liabilities. The table lists everyone.`}
          table={{ columns: ['Taxpayer', 'Computed', 'Under review'], rows: exposure.map((e) => [e.name, e.confirmed, e.potential]) }}
          actions={<Legend items={[{ label: 'Computed', color: STATUS.critical }, { label: 'Under review', color: STATUS.warning }]} />}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={exposure.slice(0, 15)} layout="vertical" margin={{ left: 8, right: 20 }} barCategoryGap={6}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" tickFormatter={axisInr} {...axisProps} height={40} label={xLab('Exposure (₹)')} />
              <YAxis type="category" dataKey="name" width={190} {...axisProps} tick={{ fill: '#54607a', fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#eef1f8' }} content={<Tip fmt={(v) => inr(v)} />} />
              <Bar dataKey="confirmed" name="Computed" stackId="e" fill={STATUS.critical} maxBarSize={20} onClick={(d) => openTaxpayer(d.id)} />
              <Bar dataKey="potential" name="Under review" stackId="e" fill={STATUS.warning} radius={[0, 4, 4, 0]} maxBarSize={20} onClick={(d) => openTaxpayer(d.id)} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <CreditGrid taxpayers={taxpayers} openTaxpayer={openTaxpayer} />
      </div>

      <div className="grid mt">
        <RuleMatrix taxpayers={taxpayers} catalog={catalog} openTaxpayer={openTaxpayer} />
      </div>

      <div className="grid g-12 mt">
        <IssueHistogram taxpayers={taxpayers} openTaxpayer={openTaxpayer} />
        <Card title="Cross-taxpayer correlation" sub={`Pearson r between scrutiny metrics across n = ${int(portfolio.n)} taxpayers.${portfolio.n < 50 ? ' With so few taxpayers, treat as directional, not significant.' : ''}`}>
          <CorrelationMatrix keys={portfolio.metrics} cells={portfolio.cells} labelWidth={170} />
        </Card>
      </div>

      <div className="grid mt">
        <Register taxpayers={taxpayers} openTaxpayer={openTaxpayer} />
      </div>
    </div>
  );
}

// The full register, 25 rows a page with search: never thousands of rows in the page at once.
function Register({ taxpayers, openTaxpayer }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const all = useMemo(() => [...taxpayers].sort((a, b) => b.score - a.score), [taxpayers]);
  const shown = q ? all.filter((a) => `${a.name} ${a.gstin} ${a.state}`.toLowerCase().includes(q.toLowerCase())) : all;
  const size = 25, pages = Math.max(1, Math.ceil(shown.length / size)), at = Math.min(page, pages - 1);
  return (
    <Card title="Taxpayer register" sub="Every taxpayer, highest risk first. Click a row to open the scrutiny file."
      actions={<label className="rr-search"><Icon name="search" size={14} /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name, GSTIN or state" aria-label="Search the register" /></label>}>
      <div className="tbl-wrap" style={{ maxHeight: 'none' }}>
        <table className="tbl">
          <thead><tr><th>Taxpayer</th><th>Filing</th><th className="num">Turnover</th><th className="num">Cash %</th><th className="num">Exposure</th><th>Risk</th></tr></thead>
          <tbody>
            {shown.slice(at * size, at * size + size).map((a, i) => (
              <tr key={`${a.uid || a.id}-${i}`} className="click" onClick={() => openTaxpayer(a.id)}>
                <td><div className="who" style={{ fontSize: 13.5 }}>{title(a.name)}</div><div className="sub">{a.gstin} · {a.state}</div></td>
                <td>{a.filing.replace(' (QRMP)', '')}</td>
                <td className="num">{inr(a.profile.turnover)}</td>
                <td className="num">{pct(a.profile.cashPct)}</td>
                <td className="num">{inr(a.exposure.confirmed + a.exposure.potential)}</td>
                <td><BandChip band={a.band} score={a.score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rr-foot">
        <span className="muted small">{shown.length ? `${at * size + 1}–${Math.min(shown.length, at * size + size)} of ${int(shown.length)}` : 'No match'} · {int(taxpayers.reduce((s, a) => s + a.profile.salesInvoices + a.profile.purchaseInvoices, 0))} invoices analysed</span>
        <div className="rr-pager">
          <button className="btn small" onClick={() => setPage(at - 1)} disabled={at === 0}>Previous</button>
          <span className="muted small">Page {at + 1} of {int(pages)}</span>
          <button className="btn small" onClick={() => setPage(at + 1)} disabled={at >= pages - 1}>Next</button>
        </div>
      </div>
    </Card>
  );
}

// The most recent upload, one line above everything else: when, how much, and whether its analysis is in these figures.
function UploadBanner({ batch, go }) {
  if (!batch?.files?.length) return null;
  const ok = batch.files.filter((f) => f.ok);
  const a = batch.analysis || {};
  const taxpayers = new Set(ok.map((f) => f.gstin)).size;
  const when = new Date(batch.startedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const state = a.stage === 'done' ? 'analysed: included in the figures below' : a.stage === 'error' ? 'analysis did not finish' : 'analysis in progress';
  return (
    <div className={`upload-banner ${a.stage === 'error' ? 'bad' : ''}`}>
      <Icon name="upload" size={16} />
      <span className="grow"><b>Latest upload</b> · {when} · {ok.length} file{ok.length === 1 ? '' : 's'} for {taxpayers} taxpayer{taxpayers === 1 ? '' : 's'} · {state}</span>
      <button className="btn small" onClick={() => go('data')}>View upload report</button>
    </div>
  );
}
