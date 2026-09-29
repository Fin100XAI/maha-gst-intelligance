import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ADMINS } from '../lib/officer.js';
import { PRELIMINARY, verifyStep, raisedIndicators, isIssue, DISPOSITION_LABEL, CLOSURE_LABEL, enforcementReadiness } from '../engine/verify.js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { PageHead, BandChip, StatusPill, Sev, CaseStatus, Legend, axisProps, gridProps, xLab, yLab } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { SERIES, STATUS, BAND } from '../lib/colors.js';
import { inr, axisInr, pct, int } from '../lib/format.js';
import { taxpayerInsights } from '../engine/insights.js';
import { taxpayerFacts, insightCacheKey, AI_MODELS } from '../lib/ai.js';

const [C1, C2, C3] = SERIES;
const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Self-contained HTML for one rendered report (styles inlined, charts are inline SVG, no scripts).
export function buildReportHtml(node, a) {
  const css = [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch { return ''; } }).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scrutiny report: ${esc(a.name)} (${a.gstin}) · GST Intelligence</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${css}\nbody{background:#f2f4f7;padding:24px}.report{max-width:1100px;margin:0 auto}@media print{body{background:#fff;padding:0}}</style></head>
<body>${node.outerHTML}</body></html>`;
}

// POST a rendered report to the dev-server library (public/reports/). Returns { ok, html, pdf } or { ok:false }.
export async function saveReport(node, a, user) {
  const meta = { name: a.name, state: a.state, fy: a.fy, band: a.band, score: a.score, confirmed: a.exposure.confirmed, potential: a.exposure.potential, by: user.name };
  try {
    const r = await fetch('/__reports/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ gstin: a.gstin, html: buildReportHtml(node, a), meta }) });
    return await r.json();
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Charts in the report render without animation so print / HTML export capture them fully.
function MiniBars({ data, keys, height = 206, yTitle = 'Amount (₹)' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 6, top: 6 }} barGap={2}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} tick={{ fill: '#8d98ae', fontSize: 10 }} height={40} label={xLab('Return period')} />
        <YAxis tickFormatter={axisInr} {...axisProps} width={64} label={yLab(yTitle)} />
        {keys.map(([k, name, color]) => <Bar key={k} dataKey={k} name={name} fill={color} radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

function GapBars({ data, k, height = 112, yTitle = 'Gap (₹)' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 6 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" tick={false} axisLine={false} height={22} label={xLab('Return period')} />
        <YAxis tickFormatter={axisInr} {...axisProps} width={64} label={yLab(yTitle)} />
        <ReferenceLine y={0} stroke="#d6dce8" />
        <Bar dataKey={k} radius={[3, 3, 3, 3]} maxBarSize={18} isAnimationActive={false}>
          {data.map((r) => <Cell key={r.p} fill={r[k] > 0 ? STATUS.critical : '#9db8e6'} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const SECTIONS = [['rp-top', 'Cover'], ['rp-s1', 'Summary'], ['rp-s2', 'Findings'], ['rp-s3', 'Reconciliation'], ['rp-s4', 'Risk indicators'], ['rp-s5', 'Counterparties'], ['rp-s6', 'Compliance'], ['rp-s7', 'Case record'], ['rp-s8', 'Coverage']];

export default function Report({ data, a, caseInfo, notice, user, setSelected, toast, saveAll, savingAll, ai, aiCache, openTaxpayer }) {
  // Navigation: previous / next taxpayer (risk order), section jump bar with active state, back to top
  const idx = data.taxpayers.findIndex((t) => t.id === a.id);
  const prev = data.taxpayers[idx - 1], next = data.taxpayers[idx + 1];
  const [active, setActive] = useState('rp-top');
  const [showTop, setShowTop] = useState(false);
  const pinned = useRef({ id: null, until: 0 }); // keep a clicked section highlighted while the page scrolls to it
  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 500);
      if (pinned.current.id && Date.now() < pinned.current.until) return;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && pinned.current.id) return; // sections near the end cannot reach the top: keep the one the officer chose
      let cur = 'rp-top';
      for (const [id] of SECTIONS) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < (atBottom ? window.innerHeight * 0.5 : 140)) cur = id; }
      pinned.current.id = null;
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [a.id]);
  const jump = (id) => { const el = document.getElementById(id); if (!el) return; pinned.current = { id, until: Date.now() + 1500 }; setActive(id); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); };
  const ref = useRef(null);
  const [library, setLibrary] = useState(null); // null = library endpoint unavailable (static build)
  const [saving, setSaving] = useState(false);
  const loadLibrary = () => fetch('/__reports/list').then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : null)).then(setLibrary).catch(() => setLibrary(null));
  useEffect(() => { loadLibrary(); }, [a.id, savingAll]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveOne = async () => {
    setSaving(true);
    const r = await saveReport(ref.current, a, user);
    setSaving(false);
    toast(r.ok ? `Saved ${r.pdf ? 'HTML + PDF' : 'HTML'} to the report library` : `Save failed: ${r.error}`);
    loadLibrary();
  };
  const savedHere = library?.[a.gstin];
  // Key insights: AI summary if AI mode is selected and one has been generated for these facts, else deterministic
  const insights = useMemo(() => {
    const det = { ...taxpayerInsights(a, data.catalog), source: 'Deterministic (rule-based)' };
    if (ai?.mode !== 'ai') return det;
    const key = insightCacheKey('taxpayer', a.id, taxpayerFacts(a, data.catalog, ai.mask).facts, ai);
    const hit = aiCache?.[key];
    if (!hit) return { ...det, source: 'Deterministic (no AI summary generated yet for this taxpayer)' };
    const label = AI_MODELS.find((m) => m.id === hit.meta.model)?.label || hit.meta.model;
    return { ...hit, source: `AI · ${label} · ${new Date(hit.meta.at).toLocaleString('en-IN')}: verify against findings` };
  }, [a, data.catalog, ai, aiCache]);
  const cat = useMemo(() => Object.fromEntries(data.catalog.map((r) => [r.id, r])), [data.catalog]);
  const R = a.periodRecon;
  const issues = a.results.filter((r) => r.status === 'Fail' || r.status === 'Review')
    .sort((x, y) => (x.status === y.status ? y.exposure - x.exposure : x.status === 'Fail' ? -1 : 1));
  const fails = issues.filter((r) => r.status === 'Fail');
  const reviews = issues.filter((r) => r.status === 'Review');
  const passed = a.results.filter((r) => r.status === 'Pass');
  const na = a.results.filter((r) => r.status === 'NA' || r.status === 'Info');
  const flags = raisedIndicators(a);
  const disp = caseInfo.dispositions || {};
  const er = enforcementReadiness(a, caseInfo);
  const sum = (k) => R.reduce((s, r) => s + r[k], 0);
  const topIssues = issues.filter((r) => r.exposure > 0).slice(0, 3);
  const rank = data.taxpayers.findIndex((t) => t.id === a.id) + 1;
  const late = R.filter((r) => r.delay > 0);
  const failedChallans = a.charts.challanStats.filter((c) => c.name !== 'PAID').reduce((s, c) => s + c.count, 0);
  const reportNo = `SR/${(user.workspace || 'ward').toUpperCase()}/${a.gstin}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  // Plain-language summary built from the findings
  const summary = [
    `${a.name} (${a.gstin}, ${a.state}) files ${a.filing.toLowerCase()} and declared a turnover of ${inr(a.profile.turnover)} for FY ${a.fy}, with output tax of ${inr(a.profile.outputTax)} of which ${pct(a.profile.cashPct)} was paid in cash.`,
    `Of ${a.results.length} automated checks, ${fails.length} failed and ${reviews.length} need officer review. The system computes ${inr(a.exposure.confirmed)} from checks with exceptions and a further ${inr(a.exposure.potential)} under review; neither is a confirmed liability until verified.`,
    topIssues.length ? `The largest items are ${topIssues.map((r) => `${cat[r.id]?.check} (${r.id}, ${inr(r.exposure)})`).join('; ')}.` : 'No check carries a quantified amount.',
    flags.length ? `${flags.length} risk indicator${flags.length > 1 ? 's were' : ' was'} raised: ${flags.map((f) => f.label.toLowerCase()).join(', ')}. These are grounds for enquiry, not proof of evasion, suppression or intent.` : 'No risk indicator was raised.',
    `Risk score ${a.score}/100 (${a.band}), ranked ${rank} of ${data.taxpayers.length} taxpayers in this jurisdiction. The score sets review priority only; it is not a basis for statutory action.`,
  ];

  const downloadHtml = () => {
    const html = buildReportHtml(ref.current, a);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const el = document.createElement('a'); el.href = url; el.download = `Scrutiny-report_${a.gstin}_FY${a.fy}.html`; el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Report downloaded as HTML');
  };

  return (
    <div className="page">
      <PageHead title="Scrutiny report" path={`${a.gstin} · FY ${a.fy} · generated ${today()}`}>
        <div className="rp-pager">
          <button className="btn small" disabled={!prev} onClick={() => setSelected(prev.id)} title={prev ? `Previous: ${prev.name}` : 'First taxpayer'} aria-label="Previous taxpayer">‹ Prev</button>
          <select value={a.id} onChange={(e) => setSelected(e.target.value)} aria-label="Taxpayer">
            {data.taxpayers.map((t, i) => <option key={t.id} value={t.id}>{i + 1}. {t.name}</option>)}
          </select>
          <button className="btn small" disabled={!next} onClick={() => setSelected(next.id)} title={next ? `Next: ${next.name}` : 'Last taxpayer'} aria-label="Next taxpayer">Next ›</button>
        </div>
        {openTaxpayer && <button className="btn" onClick={() => openTaxpayer(a.id)}><Icon name="taxpayer" size={16} /> Taxpayer 360°</button>}
        <button className="btn" onClick={downloadHtml}><Icon name="download" size={16} /> .html</button>
        <button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Print</button>
        {library && <button className="btn primary" onClick={saveOne} disabled={saving || savingAll}>{saving ? 'Saving…' : 'Save to library'}</button>}
      </PageHead>

      {library && (
        <div className="panel no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Icon name="data" size={18} style={{ color: 'var(--brand)' }} />
          <div style={{ minWidth: 0 }}>
            <b>Report library</b> <span className="muted">· {Object.keys(library).length} of {data.taxpayers.length} taxpayers saved on this computer</span>
            <div className="mono muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              {savedHere ? <>this report saved {new Date(savedHere.savedAt).toLocaleString('en-IN')} · <a href={`/reports/${savedHere.html}`} target="_blank" rel="noreferrer">view</a>{savedHere.pdf && <> · <a href={`/reports/${savedHere.pdf}`} target="_blank" rel="noreferrer">pdf</a></>}</> : 'this report is not saved yet'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn small" href="/reports/index.html" target="_blank" rel="noreferrer">Open library</a>
            <button className="btn small soft" onClick={saveAll} disabled={savingAll || saving}>{savingAll ? `Saving ${savingAll}…` : `Save all ${data.taxpayers.length} reports`}</button>
          </div>
        </div>
      )}

      <nav className="rp-nav no-print" aria-label="Report sections">
        {SECTIONS.map(([id, label], i) => (
          <button key={id} className={active === id ? 'on' : ''} onClick={() => jump(id)}>{i ? <span className="mono">{String(i).padStart(2, '0')}</span> : null}{label}</button>
        ))}
      </nav>

      <article className="report" ref={ref}>
        {/* ---------------- cover */}
        <section className="rp-cover" id="rp-top">
          <div className="rp-band">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="rp-band-eyebrow">GST Intelligence · Scrutiny report · FY {a.fy}</div>
              <h2 className="rp-title">{a.name}</h2>
              <div className="rp-meta"><span className="rp-gstin">{a.gstin}</span><span>{a.state}</span><span>·</span><span>{a.filing}</span></div>
            </div>
            <div className="rp-score">
              <div className="rp-score-n">{a.score}<small>/100</small></div>
              <div className="rp-score-band"><i style={{ background: BAND[a.band]?.color }} />{a.band} risk</div>
              <div className="rp-score-rank">rank {rank} of {data.taxpayers.length}</div>
            </div>
          </div>
          <div className="rp-kv">
            <div><span>Report no.</span>{reportNo}</div>
            <div><span>Prepared by</span>{user.name} · {user.role} · {ADMINS[user.admin]?.label || 'State GST'} · {user.workspace}</div>
            <div><span>Date</span>{today()}</div>
            <div><span>Case status</span><CaseStatus status={caseInfo.status} /></div>
            <div style={{ gridColumn: '1 / -1' }}><span>Source</span>{a.fileName}</div>
          </div>
        </section>

        {/* ---------------- 1 summary */}
        <section className="rp-sec" id="rp-s1">
          <h3><span className="n">01</span>Summary</h3>
          <div className="rp-kpis">
            {[['Turnover · 3B', inr(a.profile.turnover), ''], ['Output tax', inr(a.profile.outputTax), ''], ['ITC claimed', inr(a.profile.itcClaimed), ''], ['Paid in cash', pct(a.profile.cashPct), ''],
              ['Computed · unverified', inr(a.exposure.confirmed), a.exposure.confirmed ? 'bad' : 'ok'], ['Under review', inr(a.exposure.potential), a.exposure.potential ? 'warn' : 'ok']].map(([l, v, tone]) => (
              <div key={l} className={tone}><div className="l">{l}</div><div className="v">{v}</div></div>
            ))}
          </div>
          <p className="rp-prelim">{PRELIMINARY}</p>
          {summary.map((s, i) => <p key={i}>{s}</p>)}
          <div className="rp-insights">
            <div className="rp-ch" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>Key insights <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{insights.source}</span></div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, margin: '4px 0 8px' }}>{insights.headline}</p>
            <ul>{insights.items.slice(0, 7).map((it, i) => <li key={i}><b>{it.title}.</b> {it.detail}{it.refs?.length ? <span className="mono muted" style={{ fontSize: 11 }}> [{it.refs.join(', ')}]</span> : null}</li>)}</ul>
            {insights.actions?.length > 0 && <><div className="rp-ch" style={{ marginTop: 10 }}>Verification steps</div><ol>{insights.actions.map((x, i) => <li key={i}>{x}</li>)}</ol></>}
          </div>
        </section>

        {/* ---------------- 2 findings */}
        <section className="rp-sec" id="rp-s2">
          <h3><span className="n">02</span>Findings requiring verification <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>{fails.length} fail · {reviews.length} review</span></h3>
          {issues.length ? (
            <table className="rp-tbl">
              <thead><tr><th>Rule</th><th>Check / legal reference</th><th>Status · outcome</th><th>Finding</th><th className="num">Computed</th></tr></thead>
              <tbody>
                {issues.map((r) => (
                  <tr key={r.id} className={`st-${r.status}`}>
                    <td className="mono">{r.id}<div style={{ marginTop: 4 }}><Sev s={cat[r.id]?.severity || 'Med'} /></div></td>
                    <td><b>{cat[r.id]?.check}</b><div className="muted">{cat[r.id]?.legal}</div></td>
                    <td><StatusPill status={r.status} />{isIssue(r) && <div style={{ marginTop: 6 }}><span className={`disp ${disp[r.id]?.code || 'pending'}`}>{disp[r.id] ? DISPOSITION_LABEL[disp[r.id].code] : 'Outcome pending'}</span></div>}</td>
                    <td>{r.finding}{disp[r.id]?.note && <div style={{ marginTop: 4 }}><b>Officer:</b> {disp[r.id].note}</div>}<div className="muted" style={{ marginTop: 4 }}><b>Verify:</b> {verifyStep(r.id)[0]}. {verifyStep(r.id)[1]}</div></td>
                    <td className="num">{r.exposure ? inr(r.exposure, { compact: false }) : '-'}</td>
                  </tr>
                ))}
                <tr className="tot"><td colSpan={4}>Computed (exceptions) · under review: unverified</td><td className="num">{inr(a.exposure.confirmed, { compact: false })}<div className="muted">+ {inr(a.exposure.potential, { compact: false })}</div></td></tr>
              </tbody>
            </table>
          ) : <p>No check failed or needs review.</p>}
        </section>

        {/* ---------------- 3 reconciliation */}
        <section className="rp-sec" id="rp-s3">
          <h3><span className="n">03</span>Return reconciliation</h3>
          <div className="rp-charts">
            <div>
              <div className="rp-ch">Outward tax: GSTR-1 vs GSTR-3B</div>
              <MiniBars data={R} keys={[['g1Tax', 'GSTR-1', C1], ['g3bTax', 'GSTR-3B', C2]]} yTitle="Tax (₹)" />
              <GapBars data={R} k="taxGap" yTitle="Gap (₹)" />
              <Legend items={[{ label: 'GSTR-1', color: C1 }, { label: 'GSTR-3B', color: C2 }, { label: 'Short-paid', color: STATUS.critical }]} />
            </div>
            <div>
              <div className="rp-ch">ITC: 3B claimed vs 2B eligible</div>
              <MiniBars data={R} keys={[['itcClaim', '3B claimed', C1], ['itc2b', '2B eligible', C3]]} yTitle="ITC (₹)" />
              <GapBars data={R} k="itcGap" yTitle="Excess (₹)" />
              <Legend items={[{ label: '3B claimed', color: C1 }, { label: '2B eligible', color: C3 }, { label: 'Excess over 2B', color: STATUS.critical }]} />
            </div>
          </div>
          <table className="rp-tbl compact">
            <thead><tr><th>Period</th><th className="num">GSTR-1 tax</th><th className="num">3B tax</th><th className="num">Gap</th><th className="num">3B ITC</th><th className="num">2B ITC</th><th className="num">Excess</th><th className="num">Cash paid</th><th>Filed</th><th className="num">Delay</th></tr></thead>
            <tbody>
              {R.map((r) => (
                <tr key={r.p}>
                  <td>{r.label}</td><td className="num">{int(r.g1Tax)}</td><td className="num">{int(r.g3bTax)}</td><td className={`num ${r.taxGap > 1000 ? 'bad' : ''}`}>{int(r.taxGap)}</td>
                  <td className="num">{int(r.itcClaim)}</td><td className="num">{int(r.itc2b)}</td><td className={`num ${r.itcGap > 1000 ? 'bad' : ''}`}>{int(r.itcGap)}</td>
                  <td className="num">{int(r.cash)}</td><td className="mono">{r.filedOn || '-'}</td><td className={`num ${r.delay > 0 ? 'bad' : ''}`}>{r.delay ?? '-'}</td>
                </tr>
              ))}
              <tr className="tot"><td>Year</td><td className="num">{int(sum('g1Tax'))}</td><td className="num">{int(sum('g3bTax'))}</td><td className="num">{int(sum('taxGap'))}</td><td className="num">{int(sum('itcClaim'))}</td><td className="num">{int(sum('itc2b'))}</td><td className="num">{int(sum('itcGap'))}</td><td className="num">{int(sum('cash'))}</td><td>{late.length} late</td><td /></tr>
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: 12 }}>Amounts in ₹. Positive gap = declared in GSTR-1 but not paid in 3B; positive excess = ITC claimed beyond GSTR-2B.</p>
        </section>

        {/* ---------------- 4 fraud */}
        <section className="rp-sec" id="rp-s4">
          <h3><span className="n">04</span>Risk indicators: verification required <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>{flags.length} of {a.fraud.length} raised</span></h3>
          <table className="rp-tbl compact">
            <thead><tr><th>Signal</th><th>Measured</th><th>Result</th><th>Why it matters</th></tr></thead>
            <tbody>{[...a.fraud].sort((x, y) => y.flagged - x.flagged).map((f) => (
              <tr key={f.key}><td><b>{f.label}</b></td><td className="mono">{f.value}</td><td>{f.flagged ? <span className="chip bad">raised</span> : <span className="chip good">clear</span>}</td><td className="muted">{f.why}</td></tr>
            ))}</tbody>
          </table>
        </section>

        {/* ---------------- 5 counterparties */}
        <section className="rp-sec" id="rp-s5">
          <h3><span className="n">05</span>Counterparties</h3>
          <div className="rp-charts">
            <div>
              <div className="rp-ch">Top suppliers (GSTR-2B): {a.charts.topSuppliers.count} in total</div>
              <table className="rp-tbl compact">
                <thead><tr><th>Supplier</th><th className="num">Taxable</th><th className="num">Share</th><th>3B filed</th></tr></thead>
                <tbody>{a.charts.topSuppliers.list.slice(0, 6).map((s) => <tr key={s.key}><td>{s.name}<div className="mono muted">{s.key}</div></td><td className="num">{inr(s.value)}</td><td className="num">{pct(s.share)}</td><td>{s.nonFiler ? <span className="chip bad">no</span> : 'yes'}</td></tr>)}</tbody>
              </table>
            </div>
            <div>
              <div className="rp-ch">Top customers (GSTR-1 B2B): {a.charts.topCustomers.count} in total</div>
              <table className="rp-tbl compact">
                <thead><tr><th>Customer</th><th className="num">Taxable</th><th className="num">Share</th></tr></thead>
                <tbody>{a.charts.topCustomers.list.slice(0, 6).map((s) => <tr key={s.key}><td>{s.name}<div className="mono muted">{s.key}</div></td><td className="num">{inr(s.value)}</td><td className="num">{pct(s.share)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          {a.fraudDetail.mirror.length > 0 && (
            <>
              <div className="rp-ch" style={{ marginTop: 14 }}>Parties on both sides (possible circular trading)</div>
              <table className="rp-tbl compact">
                <thead><tr><th>Party</th><th className="num">Sold to</th><th className="num">Bought from</th></tr></thead>
                <tbody>{a.fraudDetail.mirror.slice(0, 6).map((m) => <tr key={m.g}><td>{m.party}<div className="mono muted">{m.g}</div></td><td className="num">{inr(m.sold)}</td><td className="num">{inr(m.bought)}</td></tr>)}</tbody>
              </table>
            </>
          )}
        </section>

        {/* ---------------- 6 compliance */}
        <section className="rp-sec" id="rp-s6">
          <h3><span className="n">06</span>Filing &amp; payment compliance</h3>
          <ul>
            <li>{a.profile.periodsFiled} GSTR-3B periods filed; {late.length ? `${late.length} late (max ${Math.max(...late.map((r) => r.delay))} days)` : 'all on time'}.</li>
            <li>Interest paid {inr(sum('interestPaid'))}; late fee paid {inr(sum('lateFeePaid'))}.</li>
            <li>Payment challans: {a.charts.challanStats.map((c) => `${c.count} ${c.name.toLowerCase()}`).join(', ') || 'none'}{failedChallans ? ': expired / failed challans indicate abandoned payment attempts.' : '.'}</li>
            <li>Invoices in GSTR-2A but not yet in 2B: {int(a.charts.in2aNot2b.count)} (ITC {inr(a.charts.in2aNot2b.tax)}).</li>
          </ul>
        </section>

        {/* ---------------- 7 case */}
        <section className="rp-sec" id="rp-s7">
          <h3><span className="n">07</span>Case record</h3>
          <div className="rp-kv" style={{ marginTop: 6 }}>
            <div><span>Status</span><CaseStatus status={caseInfo.status} /></div>
            <div><span>Assignee</span>{caseInfo.assignee || '-'}</div>
            <div><span>Measures</span>Data confidence {a.confidence.score} · review priority {a.score} · enforcement readiness {er.score ?? 'n/a'}</div>
            <div><span>Outcomes</span>{er.decided} of {er.issues} issues decided · {er.confirmed} confirmed</div>
            {caseInfo.closure && <div><span>Closure</span>{CLOSURE_LABEL[caseInfo.closure.code]}: {caseInfo.closure.reason}</div>}
            {(caseInfo.responses || []).length > 0 && <div><span>Taxpayer responses</span>{caseInfo.responses.map((x) => `${x.received}${x.ref ? ` (${x.ref})` : ''}: ${x.text}`).join(' · ')}</div>}
            <div><span>ASMT-10</span>{notice ? `${notice.ref} · issued ${notice.issued} · reply by ${notice.due} · ${notice.items.length} items` : 'not drafted'}</div>
          </div>
          {(caseInfo.notes || []).length > 0 && (
            <>
              <div className="rp-ch" style={{ marginTop: 14 }}>Officer notes</div>
              {(caseInfo.notes || []).map((n, i) => <p key={i} style={{ margin: '6px 0' }}><span className="mono muted" style={{ fontSize: 11.5 }}>{n.at} · {n.by}: </span>{n.text}</p>)}
            </>
          )}
        </section>

        {/* ---------------- 8 coverage */}
        <section className="rp-sec" id="rp-s8">
          <h3><span className="n">08</span>Coverage &amp; method</h3>
          <p><b>Passed ({passed.length}):</b> {passed.map((r) => `${r.id} ${cat[r.id]?.check}`).join(' · ') || '-'}</p>
          <p><b>Not applicable / informational ({na.length}):</b> {na.map((r) => r.id).join(', ') || '-'}</p>
          <p><b>Not tested ({data.catalog.length - a.results.length} of {data.catalog.length} matrix rules):</b> these need books of account, e-way bills, the GSTIN master or the annual return, and are outside this report.</p>
          <p className="muted" style={{ fontSize: 12.5 }}>Months are mapped to the GSTR-3B period that covers them. GSTR-1 tax = B2B (excl. reverse charge) + B2C ± notes; 3B ITC claim = 4A(4)+4A(5)−4B(2); 2B eligible = available non-RCM B2B ± supplier notes + ISD. Amounts are system computations from returns data only, not confirmed liabilities, excluding interest and penalty unless stated. Verify against books, taxpayer evidence and current law before any notice or order.</p>
          <div className="rp-sign">
            <div>Prepared by<br /><b>{user.name}</b><br />{user.role} · {ADMINS[user.admin]?.label || 'State GST'} · {user.workspace}</div>
            <div>Reviewed by<br /><br />____________________</div>
          </div>
        </section>
      </article>
      {showTop && <button className="rp-top-btn no-print" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" title="Back to top">↑</button>}
    </div>
  );
}
