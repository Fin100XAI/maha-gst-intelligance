// The Commissioner demonstration as a printable script: readiness checks, then every step with where to go and what
// to say. "Start the live demo" opens the presenter panel on the first step.
import React from 'react';
import { Card, PageHead } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { CHAPTERS, DEMO_STEPS, WARD } from '../lib/demo.js';

const SCREEN = { revenue: 'Revenue', taxpayer: 'Taxpayer 360°', network: 'Network', eiu: 'EIU signals', recovery: 'Recovery', actions: 'Actions', collections: 'Collections', overview: 'Overview' };
const TAB = { revenue: 'Revenue change', network: 'Counterparties' };

export default function DemoScript({ data, registers, cases, onStart, go }) {
  const has = (g) => data.taxpayers.some((t) => t.gstin === g);
  const checks = [
    ['Ward SYN-PUNE-01 loaded (Talegaon Infra, Hinjewadi Foods)', has(WARD.talegaon) && has(WARD.hinjewadi), 'Upload the workbooks in test-data/ward through Upload data.'],
    ['Taxpayer master register', !!registers?.master, 'Upload data → step 2 → Taxpayer master (test-data/ward/registers/master.csv).'],
    ['EIU signals register', !!registers?.eiu?.records?.some((s) => s.signalId === WARD.signal), 'Registers → EIU risk signals (eiu.csv).'],
    ['Targets, demands and case action registers', !!(registers?.targets && registers?.demands && registers?.caselog), 'Registers → targets.csv, demands.csv, caselog.csv.'],
    ['A CA reply recorded on the Talegaon signal', !!cases?.[WARD.talegaon]?.eiu?.[WARD.signal]?.replies?.length, 'Optional: attach the letter test-data/ward/replies/EIU-2025-0107.pdf on the EIU signals screen (Record a reply), or do it live.'],
  ];
  const ready = checks.slice(0, 4).every((c) => c[1]);
  return (
    <div className="page">
      <PageHead title="Commissioner demo" path="20 minutes · 6 parts · ward SYN-PUNE-01">
        <button className="btn no-print" onClick={() => window.print()}><Icon name="print" size={15} /> Print script</button>
        <button className="btn primary no-print" onClick={onStart} disabled={!ready}>Start the live demo</button>
      </PageHead>
      <div className="grid g-12">
        <Card title="Before you start" sub={ready ? 'Everything the demo needs is loaded.' : 'Load what is missing, then start.'}>
          <ul className="demo-checks">{checks.map(([t, ok, how]) => <li key={t} className={ok ? 'ok' : ''}><Icon name={ok ? 'check' : 'alert'} size={15} /><div><b>{t}</b>{!ok && <div className="muted small">{how}</div>}</div></li>)}</ul>
        </Card>
        <Card title="How to run it" sub="The presenter panel sits beside the screen and never blocks it">
          <ul className="hyp-out">
            <li>Each step opens the right screen and rings what to point at. The bullet points are what to say.</li>
            <li>Next and Back, or a presentation clicker (Page Down / Page Up), or the arrow keys.</li>
            <li>The clock shows elapsed time against each part's slot (for example 2–7 min); it turns red when over.</li>
            <li>Click, tick and scroll freely while it runs: the challenge step expects you to exclude a supplier live.</li>
            <li>Say it plainly: all figures are synthetic, planted for the demonstration; none is a real departmental outcome.</li>
          </ul>
        </Card>
      </div>
      {CHAPTERS.map((c, k) => (
        <Card key={c.key} className="mt demo-script" title={`${k + 1}. ${c.title}`} sub={`Minute ${c.from} to ${c.to}`}>
          <ol className="demo-steps">
            {DEMO_STEPS.map((s, n) => ({ s, n })).filter(({ s }) => s.chapter === c.key).map(({ s, n }) => (
              <li key={n}>
                <div className="demo-step-head"><b>{s.title}</b>
                  <button className="link-btn small no-print" onClick={() => go(s.view, s.id, s.tab)}>{SCREEN[s.view]}{s.tab ? ` → ${TAB[s.tab]}` : ''}{s.id && s.view === 'taxpayer' ? ` (${data.taxpayers.find((t) => t.gstin === s.id)?.name || s.id})` : s.id ? ` (${s.id})` : ''} →</button>
                </div>
                <ul>{s.say.map((t) => <li key={t}>{t}</li>)}</ul>
              </li>
            ))}
          </ol>
        </Card>
      ))}
    </div>
  );
}
