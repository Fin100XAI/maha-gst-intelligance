// Presenter panel for the Commissioner demonstration. Unlike the guided tour it does not block the page: the
// presenter clicks, ticks and scrolls freely while the panel shows the chapter, the clock against the time budget,
// what to point at (a ring around it) and what to say. PageDown / PageUp (presentation clickers) or the arrow keys
// move between steps.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '../lib/demo.js';
import Icon from './Icon.jsx';

const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const typing = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

export default function DemoGuide({ steps, go, route, loaded, onClose }) {
  const [i, setI] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [side, setSide] = useState('right');
  const [small, setSmall] = useState(false);
  const [missing, setMissing] = useState(false);
  const ringRef = useRef(null);
  const step = steps[i];
  const chapter = CHAPTERS.find((c) => c.key === step.chapter);
  const chapterIndex = CHAPTERS.indexOf(chapter);
  const needsData = step.requires && !loaded(step.requires);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  // Open the step's screen, then ring its target and bring it into view.
  useEffect(() => {
    let cancelled = false;
    setMissing(false);
    if (step.view && (route.view !== step.view || (step.id || null) !== (route.id || null) || (step.tab || null) !== (route.tab || null))) go(step.view, step.id, step.tab);
    const clear = () => { ringRef.current?.classList.remove('demo-ring'); ringRef.current = null; };
    clear();
    if (!step.target) return () => { cancelled = true; };
    (async () => {
      const t0 = Date.now();
      let el = null;
      while (!cancelled && Date.now() - t0 < 4000) {
        el = document.querySelector(step.target);
        if (el && el.getBoundingClientRect().height > 0) break;
        el = null;
        await new Promise((r) => setTimeout(r, 120));
      }
      if (cancelled) return;
      if (!el) { setMissing(true); return; }
      el.classList.add('demo-ring');
      ringRef.current = el;
      const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
      el.scrollIntoView({ behavior: 'smooth', block: tall ? 'start' : 'center' });
    })();
    return () => { cancelled = true; clear(); };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => setI((n) => Math.min(steps.length - 1, n + 1)), [steps.length]);
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);
  useEffect(() => {
    const onKey = (e) => {
      if (typing(document.activeElement)) return;
      if (e.key === 'PageDown' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'PageUp' || e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'Escape') setSmall(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back]);

  const elapsed = now - startedAt;
  const over = elapsed > chapter.to * 60000;
  if (small) {
    return (
      <button className={`demo-pill ${side}`} onClick={() => setSmall(false)} aria-label="Show the presenter panel">
        <Icon name="arrow" size={14} /> Demo {i + 1}/{steps.length} · {mmss(elapsed)}
      </button>
    );
  }
  return (
    <aside className={`demo-panel ${side}`} aria-label="Presenter panel" role="complementary">
      <div className="demo-top">
        <span className="demo-chapter">{chapterIndex + 1}. {chapter.title}</span>
        <span className={`demo-clock ${over ? 'over' : ''}`} title={`This part: minute ${chapter.from} to ${chapter.to}`}>{mmss(elapsed)} <span className="muted">/ {chapter.from}–{chapter.to} min</span></span>
      </div>
      <div className="demo-chapters" aria-hidden="true">{CHAPTERS.map((c, k) => <i key={c.key} className={k < chapterIndex ? 'done' : k === chapterIndex ? 'on' : ''} style={{ flex: c.to - c.from }} />)}</div>
      <h3>{step.title}</h3>
      {needsData && <div className="demo-warn">This step uses ward PUNE-WARD-01. Load it in Upload data to show it.</div>}
      {missing && !needsData && <div className="demo-warn">The item to point at is not on screen yet; scroll to it, or check the data is loaded.</div>}
      <ul className="demo-say">{step.say.map((t) => <li key={t}>{t}</li>)}</ul>
      <div className="demo-actions">
        <button className="btn small" onClick={back} disabled={i === 0}>Back</button>
        <span className="demo-count">{i + 1} / {steps.length}</span>
        {i < steps.length - 1 ? <button className="btn small primary" onClick={next}>Next</button> : <button className="btn small primary" onClick={onClose}>Finish</button>}
      </div>
      <div className="demo-tools">
        <button className="link-btn small" onClick={() => setSide(side === 'right' ? 'left' : 'right')}>Move to the {side === 'right' ? 'left' : 'right'}</button>
        <button className="link-btn small" onClick={() => setSmall(true)}>Minimise</button>
        <button className="link-btn small" onClick={onClose}>End demo</button>
      </div>
    </aside>
  );
}
