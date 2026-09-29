import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Guided walkthrough shown after sign-in. Each step can switch screen (view/id), spotlights an element
// (first matching selector) and explains it. Steps without a target show a centred card.
export const TOUR_STEPS = (topId) => [
  { title: 'Welcome to GST Intelligence', body: 'A quick tour of the main sections and tiles, about two minutes. Use Next and Back, or Skip to close it at any time. You can replay it from Help → Guided tour.', view: 'dashboard' },
  { view: 'dashboard', target: '[data-tour="sidebar"]', place: 'right', title: 'Navigation', body: 'Operate is for daily work: Dashboard, Revenue, Network, EIU signals, Cases, Taxpayer 360°, Notices and Reports. Leadership rolls it up: Overview by role, Collections, Actions, Recovery and Learning. Configure holds rules, scoring, AI and data sources. Help has the guide, the Commissioner demo and this tour.' },
  { view: 'dashboard', target: '[data-tour="kpis"]', title: 'Headline figures', body: 'Taxpayers rated high or critical, total turnover, exposure computed from failed checks, amounts still under review, and risk indicators raised across the jurisdiction. All are preliminary system figures until verified.' },
  { view: 'dashboard', target: '[data-tour="insights"]', title: 'Key insights', body: 'A short briefing of what matters most. Switch between Deterministic (rule-based, same result every time) and AI. The green dot means the AI connection is live; × closes the panel.' },
  { view: 'dashboard', target: '[data-tour="risk-ranking"]', title: 'Risk ranking', body: 'Every taxpayer scored 0 to 100 from failed checks, risk indicators and exposure. The score decides what to review first, never what action to take. Click a bar to open that taxpayer.' },
  { view: 'dashboard', target: '[data-tour="heatmap"]', title: 'Rule heat map', body: 'One row per taxpayer, one column per automated check. A column of red points to a pattern across the jurisdiction. Switch to Risk indicators for the forensic leads.' },
  { view: 'dashboard', target: '.page-head .search', title: 'Search', body: 'Jump to any taxpayer by name, GSTIN or state from the top of most screens.' },
  { view: 'cases', target: '[data-tour="case-filters"]', title: 'Case queue', body: 'Filter cases by status (New, In review, ASMT-10 drafted, Closed) or by risk band. The count on each pill updates as cases move.' },
  { view: 'cases', target: '[data-tour="cases-table"]', title: 'Case actions', body: 'Each row shows risk and computed exposure. Open the file, start a review, open the scrutiny note or close the case from here.' },
  { view: 'taxpayer', id: topId, target: '.tp-top', title: 'Taxpayer 360°', body: 'Profile figures on the left. The risk gauge and radar on the right show the overall score and which areas drive it.' },
  { view: 'taxpayer', id: topId, target: '.tabs-row', title: 'Analysis tabs', body: 'Reconciliation compares GSTR-1, 3B and 2B by period. Trade patterns shows suppliers and customers. Revenue change explains why cash paid moved, driver by driver. Counterparties weighs each material buyer and supplier and traces the network. Risk indicators runs forensic tests (leads, not proof). Rule findings lists every check with evidence, where you record an outcome and download a fingerprinted evidence pack. Case file holds notes, taxpayer responses and history.' },
  { view: 'revenue', target: '[data-tour="rev-contributors"]', title: 'Revenue', body: 'Who moved the jurisdiction\u2019s collection, and whether the returns explain it. Each taxpayer opens to an exact driver-by-driver explanation, with legitimate causes tested before anything is escalated.' },
  { view: 'network', target: '[data-tour="funnel"]', title: 'Network', body: 'All trade reduced to what needs attention: material relationships, anomalies with their exact paths (cycles, pass-through, non-filers) and the unresolved exposure, each relationship counted once.' },
  { view: 'eiu', target: '[data-tour="eiu-ledger"]', title: 'EIU signals', body: 'Signals kept exactly as received, revalidated on the latest returns, the taxpayer\u2019s reply tested claim by claim, and a challenge you can recalculate live. The ledger keeps reconciled, unresolved and untestable amounts apart.' },
  { view: 'overview', target: '[data-tour="role-bar"]', title: 'Leadership', body: 'One evidence base viewed by role: a field officer\u2019s taxpayers and why each needs attention; a supervisor\u2019s gap, exposure and bottlenecks; the Commissioner\u2019s trajectory, action yield, recovery and learning.' },
  { view: 'notices', id: topId, target: '[data-tour="notice-form"]', title: 'Notice readiness', body: 'Record each verification step here. Until all are done you work from a scrutiny note that lists what to verify; ASMT-10 drafting unlocks only after the checklist, and the console never issues a notice itself.' },
  { view: 'report', id: topId, target: '.rp-nav', title: 'Scrutiny report', body: 'A printable report per taxpayer. Use this bar to jump between sections, Prev and Next to move between taxpayers, and Save to library for HTML and PDF copies.' },
  { view: 'report', id: topId, target: '[data-tour="nav-scoring"]', place: 'right', title: 'Risk scoring', body: 'Change the weights and risk bands behind every score, with a live preview of who moves before you save.' },
  { view: 'report', id: topId, target: '[data-tour="nav-ai"]', place: 'right', title: 'AI assistant', body: 'Connect and test AI, choose the model and keep identities masked. The green live light shows the connection works.' },
  { view: 'report', id: topId, target: '[data-tour="nav-data"]', place: 'right', title: 'Upload data', body: 'Every file the platform reads is uploaded here, in three steps: returns files, registers and reply letters. Each file is checked before it is saved, and sample files show the exact format.' },
  { view: 'report', id: topId, target: '[data-tour="nav-demo"]', place: 'right', title: 'Commissioner demo', body: 'A scripted 20-minute demonstration with a presenter panel: what to open, what to point at and what to say, with a clock against each part.' },
  { view: 'report', id: topId, target: '[data-tour="watchlist"]', place: 'right', title: 'Watchlist', body: 'The highest-risk open cases, one click away from any screen.' },
  { view: 'report', id: topId, target: '[data-tour="user"]', place: 'right', title: 'Your account', body: 'The signed-in officer and jurisdiction. The arrow signs you out.' },
  { title: "You're all set", body: 'Start with the Dashboard and the highest-risk taxpayers. Replay this tour any time from Help → Guided tour.', view: 'dashboard' },
];

const PAD = 8;
const CARD_W = 360;

export default function Tour({ steps, go, currentView, currentId, onClose }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const cardRef = useRef(null);
  const nextRef = useRef(null);
  const step = steps[i];
  const last = i === steps.length - 1;

  // Move to the step's screen, wait for its target, scroll it into view and measure it.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    if (step.view && (step.view !== currentView || (step.id && step.id !== currentId))) go(step.view, step.id);
    const find = async () => {
      if (!step.target) { if (!cancelled) { setRect(null); setReady(true); } return; }
      const t0 = Date.now();
      let el = null;
      while (!cancelled && Date.now() - t0 < 3000) {
        el = document.querySelector(step.target);
        if (el && el.getBoundingClientRect().height > 0) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;
      if (!el) { setRect(null); setReady(true); return; } // target missing: show the explanation centred
      // Tall targets (insights, tables, forms) are aligned to their top so the heading stays visible.
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.5;
      el.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'nearest' });
      if (tall && !el.closest('.sidebar')) window.scrollBy(0, -24);
      await new Promise((r) => setTimeout(r, 60));
      if (!cancelled) { setRect(el.getBoundingClientRect()); setReady(true); }
    };
    find();
    return () => { cancelled = true; };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the spotlight on the element when the page scrolls or resizes.
  useEffect(() => {
    if (!step.target) return undefined;
    const update = () => { const el = document.querySelector(step.target); if (el) setRect(el.getBoundingClientRect()); };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [step.target]);

  const finish = useCallback((completed) => onClose(completed), [onClose]);
  const next = useCallback(() => (last ? finish(true) : setI((n) => n + 1)), [last, finish]);
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back, finish]);
  useEffect(() => { if (ready) nextRef.current?.focus({ preventScroll: true }); }, [ready, i]);

  // Card placement: beside tall/narrow targets (sidebar), otherwise below or above; clamped to the viewport.
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const ch = cardRef.current?.offsetHeight || 220;
    const w = Math.min(CARD_W, vw - 24);
    if (!rect) { setPos({ left: (vw - w) / 2, top: Math.max(16, (vh - ch) / 2) }); return; }
    let left, top;
    if (step.place === 'right' && rect.right + 16 + w < vw) { left = rect.right + 16; top = rect.top + rect.height / 2 - ch / 2; }
    else if (rect.bottom + PAD + 12 + ch < vh) { left = rect.left; top = rect.bottom + PAD + 12; }
    else if (rect.top - PAD - 12 - ch > 0) { left = rect.left; top = rect.top - PAD - 12 - ch; }
    else { left = vw - w - 16; top = vh - ch - 16; }
    setPos({ left: Math.max(12, Math.min(left, vw - w - 12)), top: Math.max(12, Math.min(top, vh - ch - 12)) });
  }, [rect, ready, i, step.place]);

  // Spotlight clipped to the viewport so its ring stays visible around oversized targets.
  const spot = rect && (() => {
    const l = Math.max(4, rect.left - PAD), t = Math.max(4, rect.top - PAD);
    const r = Math.min(window.innerWidth - 4, rect.right + PAD), b = Math.min(window.innerHeight - 4, rect.bottom + PAD);
    return { left: l, top: t, width: Math.max(0, r - l), height: Math.max(0, b - t) };
  })();

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {spot ? <div className="tour-spot" style={spot} /> : <div className="tour-dim" />}
      <div className="tour-card" ref={cardRef} style={{ left: pos.left, top: pos.top, width: Math.min(CARD_W, window.innerWidth - 24), opacity: ready ? 1 : 0 }}>
        <div className="tour-top">
          <span className="tour-step">Step {i + 1} of {steps.length}</span>
          <button className="tour-skip" onClick={() => finish(false)}>Skip tour</button>
        </div>
        <h3 id="tour-title">{step.title}</h3>
        <p id="tour-body" aria-live="polite">{step.body}</p>
        <div className="tour-dots" aria-hidden="true">{steps.map((_, k) => <i key={k} className={k === i ? 'on' : k < i ? 'done' : ''} />)}</div>
        <div className="tour-actions">
          <button className="btn small" onClick={back} disabled={i === 0}>Back</button>
          <button className="btn small primary" ref={nextRef} onClick={next}>{last ? 'Finish' : i === 0 ? 'Start tour' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
