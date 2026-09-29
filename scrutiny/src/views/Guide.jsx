import React from 'react';
import { StatusPill, Band } from '../components/ui.jsx';
import { FRAUD_DOCS, SHEETS, GLOSSARY } from '../lib/docs.js';

const SECTIONS = [
  ['overview', 'Overview'], ['data', 'Data it reads'], ['recon', 'Reconciliation method'], ['findings', 'Reading findings'],
  ['exposure', 'Exposure'], ['score', 'Risk score & bands'], ['fraud', 'Risk indicators'], ['legal', 'Legal framing'],
  ['limits', 'Limitations'], ['glossary', 'Glossary'],
];

export default function Guide({ data, cfg, user }) {
  const jump = (id) => document.getElementById(`g-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const H = ({ id, n, children }) => <h2><span className="n">{String(n).padStart(2, '0')}</span>{children}</h2>;
  return (
    <div className="site-main" style={user ? { padding: '28px 32px 64px 20px', maxWidth: 1440 } : undefined}>
      <div className="page-head">
        <div>
          <h1>Guide</h1>
          <div className="path">concepts, method and definitions</div>
        </div>
      </div>
      <div className="doc-layout">
        <nav className="toc" aria-label="Guide contents">
          {SECTIONS.map(([id, t], i) => <a key={id} href={`#g-${id}`} onClick={(e) => { e.preventDefault(); jump(id); }}>{String(i + 1).padStart(2, '0')} · {t}</a>)}
        </nav>
        <div className="prose">
          <section id="g-overview">
            <H n={1}>Overview</H>
            <p>The console helps a GST scrutiny officer decide <b>which returns to look at, what needs verifying, and when a notice is justified</b>. It reads the returns extract for each GSTIN, reconciles the returns against each other, runs the automated part of the {data.catalog.length}-rule scrutiny matrix, raises forensic risk indicators, and ranks taxpayers by a transparent risk score.</p>
            <p>It is a triage and working-paper tool. Every finding links back to the rows that produced it, and anything that cannot be tested from returns data is labelled as such rather than passed.</p>
          </section>

          <section id="g-data">
            <H n={2}>Data it reads</H>
            <p>One workbook per GSTIN (the “Get Download All Report” export). The banner rows give the company name, GSTIN and return period; each sheet below is read from its header row.</p>
            <div className="dl">{SHEETS.map(([k, v]) => <React.Fragment key={k}><div>{k}</div><div>{v}</div></React.Fragment>)}</div>
            <h3>Rule matrix</h3>
            <p>The <code>GST_Scrutiny_Rule_Matrix.xlsx</code> supplies the {data.catalog.length} checks, their severity, thresholds and actions, the industry applicability grid ({data.matrix?.industries.length || 0} industries) and the data-source register.</p>
          </section>

          <section id="g-recon">
            <H n={3}>Reconciliation method</H>
            <p>Taxpayers file GSTR-3B monthly or quarterly (QRMP), while GSTR-1 invoices, 2A and 2B arrive monthly. Each month is therefore <b>mapped to the GSTR-3B period that covers it</b>, and all comparisons are made per 3B period and for the year.</p>
            <div className="formula">{`GSTR-1 tax   = B2B (excl. reverse-charge tax) + B2CL + B2CS + debit notes − credit notes
3B tax       = 3.1(a) + 3.1(b)
3B ITC claim = 4A(4) + 4A(5) − 4B(2)
2B eligible  = B2B lines (ITC available, not RCM) ± supplier CDNR + ISD
Filing date  = first liability-ledger debit for the period
Due date     = 20th of next month (monthly) · 22nd after the quarter (QRMP, Category-I states)
Interest     = tax paid in cash × 18% × delay days ÷ 365`}</div>
            <p>Reverse-charge outward invoices count towards turnover but not towards the supplier’s tax, because the recipient pays it. A gap that reverses in the next period is usually timing; a gap that survives the year is exposure.</p>
          </section>

          <section id="g-findings">
            <H n={4}>Reading findings</H>
            <p>Each automated check returns one status, a one-line finding, a metric and, where relevant, line-level evidence.</p>
            <div className="dl">
              <div><StatusPill status="Fail" /></div><div>A threshold in the matrix is breached and an amount is computed: a preliminary exception to verify.</div>
              <div><StatusPill status="Review" /></div><div>Something needs officer judgement: a timing difference, a possible exemption, a legal defence, or a statutory date not yet reached.</div>
              <div><StatusPill status="Pass" /></div><div>Tested and within threshold.</div>
              <div><StatusPill status="Info" /></div><div>Informational: e.g. which demand section applies.</div>
              <div><StatusPill status="NA" /></div><div>Not applicable to this taxpayer (e.g. no imports, no credit notes).</div>
              <div><StatusPill status="NT" /></div><div>The check needs books, GL, e-way bills or the GSTIN master and is not tested.</div>
            </div>
          </section>

          <section id="g-exposure">
            <H n={5}>Exposure</H>
            <p><b>Computed exposure</b> is the sum of amounts on <i>failed</i> checks. <b>Under review</b> is the sum on checks marked <i>review</i>: for example ITC from suppliers who have not filed 3B, which becomes reversible under Rule 37A only if still unfiled on 30 September after the financial year (reversal by 30 November). Both are preliminary system computations, not confirmed liabilities: only a verified, reasoned finding can support tax, interest, reversal or a notice.</p>
            <p>Checks that overlap are counted once: supplier credit notes (H-06) are netted inside B-01, and turnover differences (G-01) carry no amount because their tax effect sits in G-02. Amounts are tax only: interest and penalty are shown separately where computed.</p>
          </section>

          <section id="g-score">
            <H n={6}>Risk score &amp; bands</H>
            <p>The score is additive and capped at 100. Current weights (editable on the Risk scoring page):</p>
            <div className="formula">{`score = Σ failed checks × weight(severity)        High ${cfg.fail.High} · Med ${cfg.fail.Med} · Low ${cfg.fail.Low}
      + Σ review checks × weight × ${cfg.reviewFactor}
      + Σ raised risk indicators × ${cfg.fraudWeight} × indicator weight (0.5 – 1.5)
      + min(${cfg.exposureCap}, computed ÷ turnover % × ${cfg.exposureMultiplier})`}</div>
            <p>The score sets <b>review priority</b> only. It is never a basis for statutory action. Review prompts (turnover spike, Sunday invoicing) are shown but not scored: they are natural in many sectors.</p>
            <p>Taxpayer 360° shows three separate measures: <b>Data confidence</b> (is the returns extract complete: 3B coverage, GSTR-1, 2B, supplier status in 2A, ledgers, filing dates, extract date), <b>Review priority</b> (this score), and <b>Enforcement readiness</b> (40% for recorded outcomes on every issue, 30% once a discrepancy is confirmed, 30% for the notice readiness checklist). Readiness stays low until the officer has verified the findings.</p>
            <p>Each alert ends in one of five officer outcomes: confirmed discrepancy, explained by taxpayer, timing / reconciliation difference, source-data issue, or dropped / false positive. Only confirmed discrepancies can enter tax, interest, reversal or notice workflows, and a case closes only with a closure code and written reasons.</p>
            <p>Bands: <Band band="Low" /> below {cfg.bands.Moderate} · <Band band="Moderate" /> {cfg.bands.Moderate}–{cfg.bands.High - 1} · <Band band="High" /> {cfg.bands.High}–{cfg.bands.Critical - 1} · <Band band="Critical" /> {cfg.bands.Critical}+.</p>
            <p>The risk-profile radar in Taxpayer 360° shows, per dimension, the share of checks failing (100%) or in review (40%).</p>
          </section>

          <section id="g-fraud">
            <H n={7}>Risk indicators</H>
            <p>Indicators are statistical or pattern tests. They are grounds for enquiry, not proof of evasion, suppression or intent: corroborate them with transaction, movement, banking and counterparty evidence.</p>
            <div className="tbl-wrap" style={{ maxHeight: 'none' }}>
              <table className="tbl">
                <thead><tr><th>Indicator</th><th>Raised when</th><th>Why it matters</th></tr></thead>
                <tbody>{FRAUD_DOCS.map((f) => <tr key={f.key}><td style={{ fontWeight: 600 }}>{f.label}</td><td className="mono" style={{ fontSize: 12 }}>{f.threshold}</td><td>{f.why}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section id="g-legal">
            <H n={8}>Legal framing</H>
            <ul>
              <li><b>Before any notice:</b> the console's notice readiness checklist (verified period and data, precise discrepancy, legal route, classification, evidence, taxpayer response, written reasons, supervisory approval, fact-checked draft) must be recorded before an ASMT-10 draft can be prepared. The console never sends, signs or finalises a notice.</li>
              <li><b>Scrutiny (s.61, Rule 99):</b> discrepancies are intimated in <b>ASMT-10</b>; the taxpayer replies in ASMT-11 within 30 days (extendable). If accepted, the proceeding closes with ASMT-12.</li>
              <li><b>Demand:</b> FY 2023-24 and earlier fall under s.73 (non-fraud) / s.74 (fraud). FY 2024-25 onwards fall under <b>s.74A</b>: SCN within 42 months of the annual-return due date, order within 12 months of the SCN, no SCN where tax in the FY is below ₹1,000.</li>
              <li><b>System intimations:</b> DRC-01B (GSTR-1 vs 3B, Rule 88C) and DRC-01C (3B vs 2B ITC, Rule 88D) correspond to checks G-02 and B-01.</li>
              <li>Law as encoded in the matrix reflects its validation log (checked 21-Sep-2026). Verify current notifications and case law before issuing any notice.</li>
            </ul>
          </section>

          <section id="g-limits">
            <H n={9}>Limitations</H>
            <ul>
              <li>Only {Object.keys(data.taxpayers[0]?.results.reduce((m, r) => ({ ...m, [r.id]: 1 }), {}) || {}).length} of {data.catalog.length} matrix checks can be tested from returns data. The rest are listed in the Rules catalogue as needing books or external data.</li>
              <li>E-invoicing applicability uses current-year turnover as a proxy for AATO.</li>
              <li>QRMP due dates assume Category-I states (22nd).</li>
              <li>Correlations across a handful of taxpayers are directional, not statistically significant.</li>
              <li>Case notes, notices and scoring are stored in this browser only.</li>
            </ul>
          </section>

          <section id="g-glossary">
            <H n={10}>Glossary</H>
            <div className="dl">{GLOSSARY.map(([k, v]) => <React.Fragment key={k}><div>{k}</div><div>{v}</div></React.Fragment>)}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
