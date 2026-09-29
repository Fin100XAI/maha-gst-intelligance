import React from 'react';
import Icon from '../components/Icon.jsx';
import { StatusPill } from '../components/ui.jsx';
import { AUTOMATION, FRAUD_DOCS } from '../lib/docs.js';
import { int } from '../lib/format.js';

const FEATURES = [
  { icon: 'data', title: 'Reads the whole returns pack', text: 'One “All Report” workbook per GSTIN: GSTR-1, 3B, 2A, 2B, electronic ledgers, challans, TDS/TCS.', bullets: ['30+ sheets parsed', 'Monthly and QRMP filers', 'Drop a new file: analysed in ~1 s'], go: 'data' },
  { icon: 'rules', title: 'Three-way reconciliation', text: 'Every month is mapped to the 3B period that covers it, then GSTR-1 ↔ 3B ↔ 2B ↔ 2A ↔ ledgers are compared.', bullets: ['Outward tax gap by period', 'ITC claimed vs 2B eligible', 'Cash vs credit discharge'], go: 'guide' },
  { icon: 'check', title: '141-rule scrutiny matrix', text: 'Each check carries its legal reference, threshold, severity, exposure basis and recommended action.', bullets: ['28 checks automated from returns', 'Line-level evidence per finding', 'Books-dependent checks clearly marked'], go: 'catalog' },
  { icon: 'alert', title: 'Risk indicators', text: 'Thirteen forensic indicators, from circular trading to Benford’s law, each with its measured value: leads for enquiry, not proof.', bullets: ['Supplier non-filing (Rule 37A)', 'E-way-bill threshold splitting', 'Year-end credit-note reversal'], go: 'guide' },
  { icon: 'taxpayer', title: 'Taxpayer 360°', text: 'One file per GSTIN: profile, risk gauge, reconciliation, trade patterns, risk indicators, findings and case file.', bullets: ['Top suppliers & customers', 'HSN mix and place of supply', 'Purchases ↔ sales correlation'], go: 'taxpayer' },
  { icon: 'cases', title: 'Case management', text: 'A queue of cases per GSTIN moving from New to In review, ASMT-10 drafted and Closed.', bullets: ['Assignee on first pick-up', 'Time-stamped notes & history', 'Watchlist in the sidebar'], go: 'cases' },
  { icon: 'notice', title: 'ASMT-10 composer', text: 'Turn confirmed findings into a draft Form GST ASMT-10 under s.61 / Rule 99 in a minute.', bullets: ['Pick discrepancies to include', 'Reply date set automatically', 'Print, copy or download'], go: 'notices' },
  { icon: 'sliders', title: 'Tunable risk scoring', text: 'Weights, bands and exclusions are yours to set; the live preview shows who moves before you save.', bullets: ['Validation on every input', 'Re-ranks the whole console', 'One-click reset'], go: 'scoring' },
  { icon: 'lock', title: 'Local-first', text: 'Workbooks are parsed in the browser. Case notes, notices and settings stay on this device.', bullets: ['No taxpayer data leaves the machine', 'Password never stored', 'Works offline once loaded'], go: 'guide' },
];

const PIPE = [
  ['Load', 'Returns workbook per GSTIN, plus the rule matrix.'],
  ['Reconcile', 'Periods aligned to 3B; GSTR-1, 2A/2B and ledgers compared.'],
  ['Score', 'Checks → preliminary findings with evidence; risk indicators; review-priority score.'],
  ['Act', 'Case queue, officer notes, draft ASMT-10.'],
];

export default function Features({ data, go, user }) {
  const invoices = data.taxpayers.reduce((s, a) => s + a.profile.salesInvoices + a.profile.purchaseInvoices, 0);
  return (
    <div className="site-main" style={user ? { padding: '28px 32px 64px 20px' } : undefined}>
      <div className="hero">
        <div>
          <span className="chip brand">GST Intelligence · FY {data.taxpayers[0]?.fy}</span>
          <h1>Scrutiny that <em>reconciles itself</em>, then shows its working.</h1>
          <p className="lead">Load a taxpayer’s returns and get period-by-period reconciliation, 141 matrix checks with line-level evidence, risk indicators and a verification-first path to ASMT-10: without leaving the browser.</p>
          <div className="cta">
            <button className="btn primary" onClick={() => go(user ? 'dashboard' : 'login')}>{user ? 'Open dashboard' : 'Sign in'} <Icon name="arrow" size={16} stroke={2.4} /></button>
            <button className="btn" onClick={() => go('howto')}>How to use it</button>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat accent"><div className="n">{data.catalog.length}</div><div className="l">Rules in the matrix</div></div>
          <div className="stat"><div className="n">{Object.keys(AUTOMATION).length}</div><div className="l">Automated checks</div></div>
          <div className="stat"><div className="n">{FRAUD_DOCS.length}</div><div className="l">Risk indicators</div></div>
          <div className="stat"><div className="n">{int(invoices)}</div><div className="l">Invoices analysed</div></div>
        </div>
      </div>

      <div className="section">
        <span className="eyebrow">How it works</span>
        <h2>From workbook to notice in four steps</h2>
        <p className="lead">Every number traces back to a sheet and a formula: see the Guide for the exact definitions.</p>
        <div className="pipeline">
          {PIPE.map(([t, d], i) => (
            <div className="step" key={t}>
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <h4>{t}</h4><p>{d}</p>
              {i < PIPE.length - 1 && <span className="arrow"><Icon name="arrow" size={13} stroke={2.6} /></span>}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <span className="eyebrow">Features</span>
        <h2>Everything a scrutiny desk needs</h2>
        <p className="lead">Built around the officer’s workflow: triage the portfolio, investigate one GSTIN, record what you find, act on it.</p>
        <div className="fgrid">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="fi"><Icon name={f.icon} size={22} /></div>
              <h4>{f.title}</h4>
              <p>{f.text}</p>
              <ul>{f.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <div className="more"><button className="btn ghost small" onClick={() => go(f.go)}>Learn more <Icon name="arrow" size={14} /></button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <span className="eyebrow">Honest by design</span>
        <h2>Every finding says how sure it is</h2>
        <p className="lead">A check that cannot be proven from returns data is never shown as a pass.</p>
        <div className="grid g-2">
          <div className="card">
            <div style={{ display: 'grid', gap: 12 }}>
              <div><StatusPill status="Fail" /> <span className="muted" style={{ marginLeft: 8 }}>Threshold breached; an amount is computed for verification.</span></div>
              <div><StatusPill status="Review" /> <span className="muted" style={{ marginLeft: 8 }}>Needs officer judgement: timing, exemptions, defences.</span></div>
              <div><StatusPill status="Pass" /> <span className="muted" style={{ marginLeft: 8 }}>Tested and within threshold.</span></div>
              <div><StatusPill status="NA" /> <span className="muted" style={{ marginLeft: 8 }}>Not applicable: e.g. no imports.</span></div>
              <div><StatusPill status="NT" /> <span className="muted" style={{ marginLeft: 8 }}>Needs books or external data: not tested.</span></div>
            </div>
          </div>
          <div className="callout info" style={{ alignItems: 'flex-start' }}>
            <Icon name="alert" size={18} style={{ flexShrink: 0, marginTop: 3 }} />
            <div>
              <b>What it does not do.</b> It does not check GSTIN active/cancelled status, e-way bills, books of account or GSTR-9/9C. Exposure is indicative tax for prioritising work, not a demand. Risk indicators are grounds for enquiry: intent must still be pleaded and proved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
