import React from 'react';
import Icon from '../components/Icon.jsx';
import { AUTOMATION, FRAUD_DOCS } from '../lib/docs.js';

const SOURCES = ['GSTR-1', 'GSTR-3B', 'GSTR-2A', 'GSTR-2B', 'Ledgers', 'Challans'];
const OUTPUTS = ['Mismatches', 'Risk indicators', 'Risk scores', 'Key insights', 'ASMT-10 drafts', 'Reports'];
const PILLARS = [
  { n: '01', t: 'Reconcile', lead: 'Turn separately filed returns into one reconciled picture.', chips: ['GSTR-1 ↔ 3B', '3B ↔ 2B', '2A vs 2B', 'Ledgers', 'Filing dates', 'QRMP periods'], tech: 'Period mapping · Three-way matching · Ledger analytics' },
  { n: '02', t: 'Detect', lead: 'Continuously test every return against the scrutiny matrix.', chips: ['ITC excess', 'Short payment', 'RCM', 'Place of supply', 'Credit notes', 'Risk indicators'], tech: 'Rule engine · Benford analysis · Network checks · Anomaly detection' },
  { n: '03', t: 'Act', lead: 'Move from finding to notice with evidence attached.', chips: ['Case queue', 'Officer notes', 'ASMT-10', 'Reports', 'Risk scoring', 'AI briefings'], tech: 'Case workflow · Evidence trail · Deterministic & AI summaries' },
];
const CAPS = [
  ['Return reconciliation', 'GSTR-1, 3B, 2A and 2B aligned period by period, monthly or QRMP.'],
  ['Scrutiny rule matrix', '141 checks with legal reference, threshold, severity and action.'],
  ['Risk indicators', 'Circular trading, non-filing suppliers, Benford, e-way-bill splitting: leads, not proof.'],
  ['Taxpayer 360°', 'One file per GSTIN: profile, reconciliation, trade patterns, findings.'],
  ['Key insights', 'Deterministic or AI-written briefings: the officer chooses.'],
  ['Case management', 'Queue, assignee, notes and history for every GSTIN.'],
  ['ASMT-10 composer', 'Draft s.61 notices from confirmed discrepancies.'],
  ['Scrutiny reports', 'Printable, saved HTML and PDF reports per taxpayer.'],
  ['Evidence & provenance', 'Every finding traces back to the return rows behind it.'],
];
const STEPS = [
  ['Load', ['Returns workbook', 'Rule matrix', 'Ledgers']],
  ['Reconcile', ['Periods', 'Outward tax', 'ITC', 'Payments']],
  ['Test', ['28 automated checks', 'Risk indicators', 'Thresholds']],
  ['Score', ['Risk bands', 'Exposure', 'Ranking']],
  ['Act', ['Insights', 'Cases', 'ASMT-10', 'Reports']],
];

export default function Landing({ data, go }) {
  return (
    <div className="landing">
      {/* ------------------------------------------------ hero */}
      <section className="lp-hero">
        <div className="lp-brand"><span className="logo-mark big"><Icon name="wave" size={18} stroke={2.6} /></span>GST Intelligence</div>
        <div className="lp-eyebrow">Goods &amp; Services Tax · Return scrutiny · Compliance</div>
        <h1>Know which returns don’t reconcile. Understand why. <em>Act with evidence.</em></h1>
        <p className="lp-lead">Built for scrutiny officers who need to move from a pile of returns to a defensible notice. Reconcile GSTR-1, 3B, 2A/2B and ledgers for every GSTIN, test them against a {data?.catalog.length || 141}-rule scrutiny matrix, surface risk indicators, and verify before acting: with every finding traced back to the return rows behind it.</p>
        <div className="lp-trio"><span>Reconcile</span><i /><span>Detect</span><i /><span>Act</span></div>
        <div className="lp-cta">
          <button className="btn primary lp-btn" onClick={() => go('login')}>Enter scrutiny workspace <Icon name="arrow" size={16} stroke={2.4} /></button>
          <button className="btn lp-btn outline" onClick={() => go('features')}><Icon name="notice" size={16} /> Explore capabilities</button>
        </div>
        <div className="lp-flow">
          <div className="lp-chips">{SOURCES.map((s) => <span key={s}>{s}</span>)}</div>
          <span className="lp-arrow"><Icon name="arrow" size={16} stroke={2.4} /></span>
          <div className="lp-chips out">{OUTPUTS.map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </section>

      {/* ------------------------------------------------ reality */}
      <section className="lp-sec">
        <div className="lp-eyebrow left">The scrutiny reality</div>
        <h2>Returns are filed separately. Scrutiny should not be.</h2>
        <p className="lp-sub">Outward supplies sit in GSTR-1, tax is paid in GSTR-3B, credit is claimed against a 2B statement, and payments move through ledgers. The discrepancies that matter live in the gaps between them: and in patterns no single return shows.</p>
        <div className="lp-merge">
          <div className="lp-chips wrap">{['GSTR-1 B2B / B2C', 'GSTR-3B', 'GSTR-2A', 'GSTR-2B', 'HSN summary', 'Credit notes', 'Liability ledger', 'Cash ledger', 'Credit ledger', 'Challans', 'TDS / TCS', 'Rule matrix'].map((s) => <span key={s}>{s}</span>)}</div>
          <div className="lp-core"><div className="lp-eyebrow" style={{ color: '#e9c84a' }}>Scrutiny engine</div><b>One reconciled picture</b><span>per GSTIN · per period · per rule</span></div>
        </div>
      </section>

      {/* ------------------------------------------------ what it does */}
      <section className="lp-sec">
        <div className="lp-eyebrow left">What it does</div>
        <h2>Reconcile. Detect. Act.</h2>
        <div className="lp-pillars">
          {PILLARS.map((p) => (
            <div className="lp-tile" key={p.n}>
              <h3><span>{p.n}</span> {p.t.toUpperCase()}</h3>
              <p>{p.lead}</p>
              <div className="lp-chips wrap small">{p.chips.map((c) => <span key={c}>{c}</span>)}</div>
              <div className="lp-tech">{p.tech}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ capabilities */}
      <section className="lp-sec">
        <div className="lp-eyebrow left">One console, many capabilities</div>
        <h2>From reconciliation to notice, in one place.</h2>
        <div className="lp-caps">{CAPS.map(([t, d]) => <div className="lp-tile" key={t}><h4>{t}</h4><p>{d}</p></div>)}</div>
      </section>

      {/* ------------------------------------------------ how it works */}
      <section className="lp-sec">
        <div className="lp-eyebrow left">How it works</div>
        <h2>From return data to scrutiny decisions.</h2>
        <div className="lp-steps">
          {STEPS.map(([t, chips], i) => (
            <div className="lp-tile" key={t}><div className="lp-num">{String(i + 1).padStart(2, '0')}</div><h4>{t}</h4><div className="lp-chips wrap small">{chips.map((c) => <span key={c}>{c}</span>)}</div></div>
          ))}
        </div>
        <div className="lp-under">Local processing · Evidence · Audit trail · Officer control: underneath every stage</div>
      </section>

      {/* ------------------------------------------------ AI */}
      <section className="lp-sec">
        <div className="lp-eyebrow left">Insights, your way</div>
        <h2>Deterministic by default. AI when you choose it.</h2>
        <div className="lp-pillars two">
          <div className="lp-tile"><h3><span>A</span> DETERMINISTIC</h3><p>Rule-based briefings computed locally from {Object.keys(AUTOMATION).length} automated checks and {FRAUD_DOCS.length} risk indicators. Same input, same output. No data leaves the machine.</p></div>
          <div className="lp-tile"><h3><span>B</span> AI</h3><p>A large language model writes the briefing in plain language from the same facts: identities masked by default, rule references checked, model and time recorded.</p></div>
        </div>
      </section>

      <section className="lp-final">
        <h2>Ready to review your jurisdiction?</h2>
        <button className="btn primary lp-btn" onClick={() => go('login')}>Enter scrutiny workspace <Icon name="arrow" size={16} stroke={2.4} /></button>
      </section>
    </div>
  );
}
