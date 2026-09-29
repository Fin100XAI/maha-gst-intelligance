import { api } from './lib/api.js';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Portfolio from './views/Portfolio.jsx';
import Taxpayer from './views/Taxpayer.jsx';
import Revenue from './views/Revenue.jsx';
import Network from './views/Network.jsx';
import Eiu from './views/Eiu.jsx';
import Overview from './views/Overview.jsx';
import Collections from './views/Collections.jsx';
import Actions from './views/Actions.jsx';
import Recovery from './views/Recovery.jsx';
import Learning from './views/Learning.jsx';
import Targets from './views/Targets.jsx';
import Governance from './views/Governance.jsx';
import DemoScript from './views/DemoScript.jsx';
import DemoGuide from './components/DemoGuide.jsx';
import { DEMO_STEPS, WARD } from './lib/demo.js';
import { scaleTarget, scaleUp } from './lib/scaleTest.js';
import RuleRegister from './views/RuleRegister.jsx';
import DataMethod from './views/DataMethod.jsx';
import Cases from './views/Cases.jsx';
import Notices from './views/Notices.jsx';
import Report, { saveReport } from './views/Report.jsx';
import Scoring from './views/Scoring.jsx';
import Login from './views/Login.jsx';
import Landing from './views/Landing.jsx';
import AISettings from './views/AISettings.jsx';
import Features from './views/Features.jsx';
import Guide from './views/Guide.jsx';
import HowTo from './views/HowTo.jsx';
import RulesCatalog from './views/RulesCatalog.jsx';
import { SiteShell } from './components/SiteHeader.jsx';
import Icon from './components/Icon.jsx';
import { PageHead } from './components/ui.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Tour, { TOUR_STEPS } from './components/Tour.jsx';
import CloseCase from './components/CloseCase.jsx';
import { session, usePersistent, nowStamp } from './lib/store.js';
import { useCaseStore } from './lib/useCaseStore.js';
import { ADMINS, withDesignation } from './lib/officer.js';
import { DEFAULT_SCORING, scoreOf, portfolio } from './engine/score.js';
import { BAND } from './lib/colors.js';
import { AI_DEFAULTS, aiStatus } from './lib/ai.js';
import { embedRequested, fromTrustedParent, HANDSHAKE_MS, applyShellTheme } from './lib/embed.js';

const NAV = [
  { section: 'Operate' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'revenue', label: 'Revenue', icon: 'trend' },
  { id: 'network', label: 'Network', icon: 'network' },
  { id: 'eiu', label: 'EIU signals', icon: 'alert' },
  { id: 'cases', label: 'Cases', icon: 'cases', badge: true },
  { id: 'taxpayer', label: 'Taxpayer 360°', icon: 'taxpayer' },
  { id: 'notices', label: 'Notices', icon: 'notice' },
  { id: 'report', label: 'Reports', icon: 'print' },
  { section: 'Leadership' },
  { id: 'overview', label: 'Overview', icon: 'layers' },
  { id: 'collections', label: 'Collections', icon: 'coins' },
  { id: 'targets', label: 'Targets', icon: 'target' },
  { id: 'actions', label: 'Actions', icon: 'cases' },
  { id: 'recovery', label: 'Recovery', icon: 'rupee' },
  { id: 'learning', label: 'Learning', icon: 'bulb' },
  { section: 'Configure' },
  { id: 'rules', label: 'Rule register', icon: 'rules' },
  { id: 'scoring', label: 'Risk scoring', icon: 'sliders' },
  { id: 'ai', label: 'AI assistant', icon: 'wave' },
  { id: 'data', label: 'Upload data', icon: 'upload' },
  { id: 'governance', label: 'Governance', icon: 'lock' },
  { section: 'Help' },
  { id: 'guide', label: 'Guide', icon: 'notice' },
  { id: 'howto', label: 'How to', icon: 'check' },
  { id: 'features', label: 'Features', icon: 'dashboard' },
  { id: 'catalog', label: 'Rules catalogue', icon: 'rules' },
  { id: 'demo', label: 'Commissioner demo', icon: 'layers' },
  { id: 'tour', label: 'Guided tour', icon: 'arrow', action: true },
];
const PUBLIC = new Set(['home', 'features', 'guide', 'howto', 'catalog']);
const VIEWS = new Set([...NAV.filter((n) => n.id && !n.action).map((n) => n.id), 'login', 'home']);

// #/view, #/view/ID or #/view/ID/tab
const readHash = () => {
  const [, v, id, tab] = window.location.hash.split('/');
  if (!v) return { view: embedRequested ? 'dashboard' : 'home', id: null }; // bare URL → landing (signed-in users are redirected to the dashboard); embedded → dashboard
  return { view: VIEWS.has(v) ? v : 'dashboard', id: id || null, tab: tab || null };
};

export default function App() {
  const [raw, setRaw] = useState(null);
  // Registers (EIU signals, targets, demands): null when no server store is available.
  const [registers, setRegisters] = useState(null);
  const loadRegisters = useCallback(() => fetch(api('/__registers'), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((v) => setRegisters(v && typeof v === 'object' ? v : null)).catch(() => setRegisters(null)), []);
  useEffect(() => { loadRegisters(); }, [loadRegisters]);
  const uploadRegister = useCallback(async (type, file) => {
    try {
      const r = await fetch(api(`/__registers/upload?type=${encodeURIComponent(type)}&name=${encodeURIComponent(file.name)}`), { method: 'POST', body: file, headers: { 'content-type': 'application/octet-stream' } });
      const body = await r.json();
      if (body.ok) { await loadRegisters(); setToast(`${body.meta.title}: ${body.meta.rows} rows loaded`); }
      return body;
    } catch (e) {
      return { ok: false, errors: [`Upload failed: ${e.message}`] };
    }
  }, [loadRegisters]);
  const [error, setError] = useState(null);
  // Embedded: the shell signs the officer in, so no session is read or saved here.
  const [embedded, setEmbedded] = useState(embedRequested);
  const [parentOrigin, setParentOrigin] = useState(null);
  const [user, setUser] = useState(() => (embedRequested ? null : withDesignation(session.get())));
  const [route, setRoute] = useState(readHash);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingAll, setSavingAll] = useState(null);
  const [cfg, setCfg] = usePersistent('gst.scoring', DEFAULT_SCORING);
  // Case record: server-side event log when available, this browser's storage otherwise (src/lib/useCaseStore.js).
  const { cases, notices, dispatch, mode: caseMode, error: caseError } = useCaseStore(user);
  // Jurisdiction shared by the Leadership screens (remembered in this browser)
  const [jurisdiction, setJurisdiction] = usePersistent('gst.jurisdiction', null);
  const [aiStored, setAi] = usePersistent('gst.ai', AI_DEFAULTS);
  const ai = { ...AI_DEFAULTS, ...aiStored };
  const [aiCache, setAiCache] = usePersistent('gst.aiCache', {});
  const [insightsHidden, setInsightsHidden] = usePersistent('gst.insightsHidden', {});
  const [aiServer, setAiServer] = useState(null);
  useEffect(() => { aiStatus().then(setAiServer); }, [user]);
  const aiLive = !!(aiServer && (aiServer.envKey || ai.key));
  // Walkthrough: starts once after the first sign-in, replayable from Help → Guided tour.
  const [tourState, setTourState] = usePersistent('gst.tour', { done: false });
  const [touring, setTouring] = useState(false);
  const [demoOn, setDemoOn] = useState(false); // presenter panel for the Commissioner demo
  useEffect(() => { if (user && raw?.taxpayers.length && !tourState.done && !embedded) setTouring(true); }, [user, raw, tourState.done, embedded]);
  const hideProps = (scope) => ({ hidden: !!insightsHidden[scope], setHidden: (v) => setInsightsHidden((h) => ({ ...h, [scope]: v })) });

  useEffect(() => {
    fetch(api('/data.json'), { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(`data.json: HTTP ${r.status}`); return r.json(); })
      .then(setRaw).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { const h = () => setRoute(readHash()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), Math.min(12000, 4200 + toast.length * 25)); return () => clearTimeout(t); }, [toast]);

  const go = useCallback((view, id, tab) => {
    window.location.hash = `/${view}${id ? `/${id}` : ''}${id && tab ? `/${tab}` : ''}`;
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => { if (user && (route.view === 'login' || route.view === 'home')) go('dashboard'); }, [user, route.view, go]);

  // Re-score with the officer's saved weights; everything downstream reads this.
  const severity = useMemo(() => Object.fromEntries((raw?.catalog || []).map((r) => [r.id, r.severity])), [raw]);
  const data = useMemo(() => {
    if (!raw) return null;
    const scored = raw.taxpayers.map((a) => ({ ...a, ...scoreOf(a, cfg, severity) })).sort((x, y) => y.score - x.score);
    const taxpayers = scaleUp(scored, scaleTarget(), cfg.bands); // ?scale=N: in-browser clones for testing at size
    return { ...raw, taxpayers, portfolio: portfolio(taxpayers), scaled: taxpayers.length > scored.length ? taxpayers.length - scored.length : 0 };
  }, [raw, cfg, severity]);

  // Embedded: take the officer and page changes from the shell; tell it where we are.
  React.useLayoutEffect(() => applyShellTheme(embedded), [embedded]);
  const routeRef = React.useRef(route);
  routeRef.current = route;
  const parentOriginRef = React.useRef(parentOrigin);
  parentOriginRef.current = parentOrigin;
  useEffect(() => {
    if (!embedded) return undefined;
    const onMessage = (e) => {
      if (!fromTrustedParent(e)) return;
      const msg = e.data || {};
      if (msg.type === 'scrutiny:officer') {
        setParentOrigin(e.origin);
        setUser(withDesignation({ name: String(msg.officer?.name || 'Officer'), email: '', admin: 'state', workspace: 'ward-27', since: new Date().toISOString() }));
      } else if (msg.type === 'scrutiny:go' && VIEWS.has(msg.view)) {
        // Keep the open taxpayer when moving between the screens that show one, as the sidebar did.
        const keep = ['taxpayer', 'notices', 'report'].includes(msg.view) && ['taxpayer', 'notices', 'report'].includes(routeRef.current.view);
        go(msg.view, keep ? routeRef.current.id : null);
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'scrutiny:ready' }, '*'); // carries nothing; the reply is origin-checked
    const fallback = setTimeout(() => setEmbedded((on) => (on && !parentOriginRef.current ? false : on)), HANDSHAKE_MS);
    return () => { window.removeEventListener('message', onMessage); clearTimeout(fallback); };
  }, [embedded, go]);
  const openCases = data ? data.taxpayers.filter((a) => (cases[a.id]?.status || 'New') !== 'Closed').length : 0;
  useEffect(() => {
    if (embedded && parentOrigin) window.parent.postMessage({ type: 'scrutiny:route', view: route.view, openCases }, parentOrigin);
  }, [embedded, parentOrigin, route.view, openCases]);

  // Every case change is an event (src/lib/caseEvents.js); the store applies it and, with the server, logs it.
  const setCaseStatus = useCallback((id, status) => { dispatch({ type: 'status', caseId: id, status }); setToast(`Case moved to ${status}`); }, [dispatch]);
  const addNote = useCallback((id, text) => dispatch({ type: 'note', caseId: id, text }), [dispatch]);
  // Notice readiness checklist: each step is stamped and logged; unticking is logged too.
  const setReadiness = useCallback((id, key, done, label, note) => dispatch({ type: 'readiness', caseId: id, key, done, label, ...(note ? { note } : {}) }), [dispatch]);
  // Officer outcome per alert (one of five), with a required note; every change is logged.
  const setDisposition = useCallback((id, ruleId, code, note) => dispatch({ type: 'disposition', caseId: id, ruleId, code: code || null, ...(note ? { note } : {}) }), [dispatch]);
  const addResponse = useCallback((id, resp) => dispatch({ type: 'response', caseId: id, received: resp.received, ref: resp.ref || '', text: resp.text }), [dispatch]);
  const logEvent = useCallback((id, text) => dispatch({ type: 'log', caseId: id, text }), [dispatch]);
  // Closing needs a reasoned closure code (CloseCase dialog); other status changes go straight through.
  const [closing, setClosing] = useState(null);
  const changeStatus = useCallback((id, status) => (status === 'Closed' ? setClosing(id) : setCaseStatus(id, status)), [setCaseStatus]);
  const closeCase = useCallback((id, code, reason) => {
    dispatch({ type: 'close', caseId: id, code, reason });
    setClosing(null);
    setToast('Case closed with reasons recorded');
  }, [dispatch]);
  const saveNotice = useCallback((id, n) => dispatch({ type: 'notice', caseId: id, notice: n }), [dispatch]);
  useEffect(() => { if (caseError) setToast(caseError); }, [caseError]);

  // Uploads are saved on the server (data/ + rebuilt data.json) so they survive reloads and restarts.
  // If the server cannot save (static hosting, remote browser), the workbook is analysed in this browser only.
  const onFiles = useCallback(async (files) => {
    if (!files.length || !raw) return;
    setBusy(true);
    try {
      const saved = [], browserOnly = [], problems = [];
      const uploadOne = async (f) => {
        if (!/\.xlsx$/i.test(f.name) || f.size > 40 * 1024 * 1024) { problems.push(`${f.name}: .xlsx under 40 MB only`); return; }
        let r = null;
        try { r = await fetch(api(`/__data/upload?name=${encodeURIComponent(f.name)}`), { method: 'POST', body: f, headers: { 'content-type': 'application/octet-stream' } }); } catch { r = null; }
        const body = r ? await r.json().catch(() => null) : null;
        if (r?.ok && body?.ok) saved.push(body);
        else if (r && (r.status === 400 || r.status === 413)) problems.push(`${f.name}: ${body?.error || 'not a returns export'}`);
        else browserOnly.push({ f, why: body?.error || (r ? `HTTP ${r.status}` : 'server not reachable') });
      };
      // A few uploads at a time: the server merges their rebuilds, so a bulk upload stays quick.
      const queue = [...files];
      await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => { while (queue.length) await uploadOne(queue.shift()); }));

      let next = raw;
      if (saved.length) {
        const fresh = await fetch(api('/data.json'), { cache: 'no-store' });
        if (fresh.ok) next = await fresh.json();
      }
      const added = [];
      if (browserOnly.length) {
        const [XLSX, { parseWorkbook }, { analyze }] = await Promise.all([import('xlsx'), import('./engine/parse.js'), import('./engine/analyze.js')]);
        for (const { f } of browserOnly) {
          const tp = parseWorkbook(XLSX.read(await f.arrayBuffer(), { type: 'array' }), f.name);
          if (!tp.gstin || !tp.periods.length) { problems.push(`${f.name}: not a returns export (no GSTIN / GSTR-3B)`); continue; }
          // Workbook banner has no company name: keep the name we already know for this GSTIN rather than the file name
          const known = next.taxpayers.find((t) => t.gstin === tp.gstin);
          // An earlier year must not replace the current one; history of other years needs the server store.
          if (known && parseInt(known.fy, 10) > tp.fyStart) { problems.push(`${f.name}: FY ${tp.fy} is older than the loaded FY ${known.fy}; save it on the server to keep it as history`); continue; }
          if (!tp.nameFromBanner && known) tp.name = known.name;
          added.push(analyze(tp, { severity }));
        }
        if (added.length) {
          const map = new Map(next.taxpayers.map((a) => [a.id, a]));
          for (const a of added) map.set(a.id, a);
          next = { ...next, taxpayers: [...map.values()] };
        }
      }
      if (next !== raw) setRaw(next);

      const nameOf = (gstin) => next.taxpayers.find((t) => t.gstin === gstin)?.name || gstin;
      const msgs = [];
      if (saved.length) {
        // One line however many files: "Saved 46 workbooks for 16 taxpayers: A, B, C and 13 more".
        const names = [...new Set(saved.map((s) => nameOf(s.gstin)))];
        const list = names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', ');
        msgs.push(`Saved ${saved.length} workbook${saved.length > 1 ? 's' : ''} for ${names.length} taxpayer${names.length > 1 ? 's' : ''}: ${list}${saved.some((s) => s.replaced) ? ' (earlier workbooks for the same year kept in data/superseded)' : ''}`);
      }
      if (added.length) msgs.push(`Analysed ${added.map((a) => a.name).join(', ')} in this browser only: not saved (${browserOnly[0].why})`);
      if (problems.length) msgs.push(`Skipped ${problems.join('; ')}`);
      if (msgs.length) setToast(msgs.join('. '));
      const first = saved[0]?.gstin || added[0]?.gstin;
      const firstId = first && next.taxpayers.find((t) => t.gstin === first)?.id;
      if (firstId) go('taxpayer', firstId);
    } catch (e) {
      setToast(`Could not read file: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }, [raw, severity, go]);

  // Render each taxpayer's report in turn and save it (HTML + PDF) to the dev-server library.
  const saveAllReports = useCallback(async () => {
    if (!data || !user) return;
    const back = window.location.hash;
    const list = data.taxpayers;
    let done = 0, pdfs = 0;
    for (const [i, t] of list.entries()) {
      setSavingAll(`${i + 1}/${list.length}`);
      go('report', t.id);
      const t0 = Date.now();
      while (Date.now() - t0 < 8000 && document.querySelector('.report .rp-cover .tag')?.textContent !== t.gstin) await new Promise((r) => setTimeout(r, 150));
      await new Promise((r) => setTimeout(r, 700)); // let charts lay out
      const node = document.querySelector('.report');
      if (!node) continue;
      const r = await saveReport(node, t, user);
      if (r.ok) { done++; if (r.pdf) pdfs++; }
    }
    setSavingAll(null);
    window.location.hash = back;
    setToast(`Saved ${done} of ${list.length} reports (${pdfs} PDFs) to the library`);
  }, [data, user, go]);

  const stats = { rules: raw?.catalog.length || 141, taxpayers: raw?.taxpayers.length || 0, fy: raw?.taxpayers[0]?.fy || '' };
  const renderPublic = (view, u) => {
    if (!data) return <div className="site-main"><div className="empty">Loading…</div></div>;
    if (view === 'home') return <Landing data={data} go={go} />;
    if (view === 'features') return <Features data={data} go={go} user={u} />;
    if (view === 'guide') return <Guide data={data} cfg={cfg} user={u} />;
    if (view === 'howto') return <HowTo go={go} user={u} />;
    return <RulesCatalog data={data} go={go} user={u} />;
  };
  if (!user) {
    if (embedded) return <div className="page"><div className="empty">Loading scrutiny data…</div></div>; // the shell is handing over the officer
    if (PUBLIC.has(route.view)) return <SiteShell view={route.view} go={go}>{renderPublic(route.view)}</SiteShell>;
    return <Login stats={stats} go={go} onLogin={(u) => { const v = withDesignation(u); session.set(v); setUser(v); go('dashboard'); }} />;
  }
  if (route.view === 'login' || route.view === 'home') return null; // redirected by the effect above
  if (error) return <div className="page"><div className="card"><h3>Could not load data</h3><p className="muted">{error}. Run <code>npm run build:data</code> first.</p></div></div>;
  if (!data) return <div className="page"><div className="empty">Loading scrutiny data…</div></div>;

  // Fresh install without taxpayer workbooks: screens that need a taxpayer show a setup message instead.
  const NEEDS_TAXPAYER = new Set(['dashboard', 'cases', 'taxpayer', 'notices', 'report', 'ai']);
  const noData = data.taxpayers.length === 0 && NEEDS_TAXPAYER.has(route.view);
  const selectedId = route.id && data.taxpayers.some((a) => a.id === route.id) ? route.id : data.taxpayers[0]?.id;
  const current = data.taxpayers.find((a) => a.id === selectedId);
  const openCount = data.taxpayers.filter((a) => (cases[a.id]?.status || 'New') !== 'Closed').length;
  const watch = data.taxpayers.filter((a) => (cases[a.id]?.status || 'New') !== 'Closed').slice(0, 5);
  const initials = user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const openTaxpayer = (id) => go('taxpayer', id);
  const openTaxpayerTab = (gstin, tab) => { const t = data.taxpayers.find((a) => a.gstin === gstin); if (t) go('taxpayer', t.id, tab); };
  const openRevenue = (gstin) => openTaxpayerTab(gstin, 'revenue');
  const hasData = data.taxpayers.length > 0;

  return (
    <div className={`shell${embedded ? ' embedded' : ''}`}>
      {/* Embedded: the shell's menu replaces this sidebar, and the shell owns sign-out. */}
      {!embedded && (
      <aside className="sidebar no-print" data-tour="sidebar">
        <div className="logo-row"><span className="logo-mark"><Icon name="wave" size={14} stroke={2.4} /></span>GST Intelligence</div>
        {NAV.map((n) => (n.section
          ? <div key={n.section} className="nav-label">{n.section}</div>
          : (
            <button key={n.id} data-tour={`nav-${n.id}`} className={`nav-item ${route.view === n.id ? 'on' : ''}`} onClick={() => (n.action ? setTouring(true) : go(n.id, n.id === 'taxpayer' || n.id === 'notices' || n.id === 'report' ? selectedId : null))} disabled={n.action && !hasData}>
              <Icon name={n.icon} size={18} />{n.label}{n.badge && <span className="badge">{openCount}</span>}{n.id === 'ai' && <span className={`live ${aiLive ? '' : 'off'}`} title={aiLive ? 'AI connection is live' : 'AI not connected'}><i />{aiLive ? 'live' : 'off'}</span>}
            </button>
          )))}

        <div className="side-box" data-tour="watchlist">
          <div className="eyebrow" style={{ padding: '2px 4px 10px' }}>Watchlist</div>
          {watch.map((a) => (
            <button key={a.uid || a.id} className={`item ${route.view === 'taxpayer' && a.id === selectedId ? 'on' : ''}`} onClick={() => openTaxpayer(a.id)} title={a.name}>
              <span className="dot" style={{ background: BAND[a.band].color }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name.toLowerCase().replace(/\b(private|limited|pvt|ltd)\b/g, '').trim().slice(0, 16)}</span>
              <span className="sc">{a.score}</span>
            </button>
          ))}
          <button className="dashed" onClick={() => go('data')}>Add return</button>
        </div>

        <div className="user-card" data-tour="user">
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="n">{user.name}</div>
            <div className="r" title={`${user.role} · ${ADMINS[user.admin].label} · ${user.workspace}`}>{user.role} · {user.workspace}</div>
          </div>
          <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={() => { session.set(null); setUser(null); }}><Icon name="logout" size={17} /></button>
        </div>
      </aside>
      )}

      {touring && hasData && (
        <Tour steps={TOUR_STEPS(data.taxpayers[0].id)} go={go} currentView={route.view} currentId={route.id}
          onClose={() => { setTouring(false); setTourState({ done: true, at: nowStamp() }); go('dashboard'); }} />
      )}

      <main className="main">
        {data.scaled > 0 && <div className="scale-banner" role="status">Scale test: {data.scaled.toLocaleString('en-IN')} in-browser copies added to the {(data.taxpayers.length - data.scaled).toLocaleString('en-IN')} loaded taxpayers. Nothing is saved; opening a copy shows its original. Remove <code>?scale=</code> from the address to leave.</div>}
        <ErrorBoundary resetKey={`${route.view}/${route.id}`}>
        {noData ? (
          <div className="page">
            <PageHead title="No returns loaded yet" path="0 taxpayers" />
            <div className="card" style={{ maxWidth: 720 }}>
              <p style={{ marginTop: 0 }}>Add taxpayer returns to start scrutiny:</p>
              <ol style={{ lineHeight: 1.8, color: 'var(--ink-2)' }}>
                <li>Copy each GSTIN's “Get Download All Report” <code>.xlsx</code> into the project's <code>data/</code> folder and run <code>npm run build:data</code> (or restart <code>npm run dev</code>), or</li>
                <li>upload a workbook now to analyse it in this browser.</li>
              </ol>
              <button className="btn primary" onClick={() => go('data')}>Go to Upload data</button>
            </div>
          </div>
        ) : (<>
        {route.view === 'dashboard' && <Portfolio data={data} openTaxpayer={openTaxpayer} go={go} aiProps={{ ai, setAi, cache: aiCache, setCache: setAiCache, go, ...hideProps('portfolio') }} />}
        {route.view === 'demo' && <DemoScript data={data} registers={registers} cases={cases} go={(v, id, tab) => (v === 'taxpayer' ? openTaxpayerTab(id, tab || null) : go(v, id))} onStart={() => { setJurisdiction(WARD.jurisdiction); setTouring(false); setDemoOn(true); }} />}
        {route.view === 'overview' && <Overview data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} user={user} roleHint={route.id} go={(v, id, tab) => (v === 'taxpayer' ? openTaxpayerTab(id, tab || null) : go(v, id))} />}
        {route.view === 'collections' && <Collections data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />}
        {route.view === 'actions' && <Actions data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} selected={route.id} />}
        {route.view === 'recovery' && <Recovery data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} openTaxpayer={(g) => openTaxpayerTab(g, null)} />}
        {route.view === 'governance' && <Governance data={data} registers={registers} cases={cases} go={(v, id, tab) => (v === 'taxpayer' ? openTaxpayerTab(id, tab || null) : go(v, id))} />}
        {route.view === 'targets' && <Targets data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />}
        {route.view === 'learning' && <Learning data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />}
        {route.view === 'eiu' && <Eiu data={data} registers={registers} cases={cases} dispatch={dispatch} selected={route.id} setSelected={(id) => { window.location.hash = `/eiu/${id}`; }} openTaxpayer={(g) => openTaxpayerTab(g, null)} toast={setToast} />}
        {route.view === 'network' && <Network data={data} registers={registers} openTaxpayer={openTaxpayerTab} />}
        {route.view === 'revenue' && <Revenue data={data} registers={registers} openRevenue={openRevenue} />}
        {route.view === 'cases' && <Cases data={data} cases={cases} setCaseStatus={changeStatus} openTaxpayer={openTaxpayer} openNotice={(id) => go('notices', id)} go={go} />}
        {route.view === 'taxpayer' && current && (
          <Taxpayer key={current.id} a={current} initialTab={route.tab} baselines={data.baselines?.[current.gstin]} network={data.network} master={registers?.master?.records} openTaxpayerTab={openTaxpayerTab} catalog={data.catalog} taxpayers={data.taxpayers} onSelect={openTaxpayer}
            caseInfo={cases[current.id] || { status: 'New' }} setCaseStatus={changeStatus} addNote={addNote} setDisposition={setDisposition} addResponse={addResponse} logEvent={logEvent} user={user} dataGeneratedAt={data.generatedAt} cfg={cfg} severity={severity} openNotice={() => go('notices', current.id)} openReport={() => go('report', current.id)} aiProps={{ ai, setAi, cache: aiCache, setCache: setAiCache, go, ...hideProps('taxpayer') }} />
        )}
        {route.view === 'report' && current && (
          <Report key={current.id} data={data} a={current} caseInfo={cases[current.id] || { status: 'New' }} notice={notices[current.id]} user={user} setSelected={(id) => go('report', id)} toast={setToast} saveAll={saveAllReports} savingAll={savingAll} ai={ai} aiCache={aiCache} openTaxpayer={openTaxpayer} />
        )}
        {route.view === 'notices' && <Notices data={data} cases={cases} notices={notices} saveNotice={saveNotice} setReadiness={setReadiness} selected={selectedId} setSelected={(id) => go('notices', id)} user={user} toast={setToast} />}
        {route.view === 'rules' && <RuleRegister data={data} openTaxpayer={openTaxpayer} />}
        {route.view === 'ai' && <AISettings data={data} ai={ai} setAi={setAi} toast={setToast} />}
        {route.view === 'scoring' && <Scoring data={data} baseTaxpayers={raw.taxpayers} cfg={cfg} onSave={setCfg} toast={setToast} />}
        {PUBLIC.has(route.view) && renderPublic(route.view, user)}
        {route.view === 'data' && <DataMethod data={data} onFiles={onFiles} busy={busy} openTaxpayer={openTaxpayer} openReport={(id) => go('report', id)} cfg={cfg} registers={registers} onRegisterUpload={uploadRegister} cases={cases} dispatch={dispatch} toast={setToast} go={go} />}
        </>)}
        </ErrorBoundary>
      </main>
      {closing && data.taxpayers.find((t) => t.id === closing) && (
        <CloseCase a={data.taxpayers.find((t) => t.id === closing)} caseInfo={cases[closing] || { status: 'New' }} onCancel={() => setClosing(null)}
          onClose={(code, reason) => closeCase(closing, code, reason)} openFindings={() => { const id = closing; setClosing(null); go('taxpayer', id); setTimeout(() => window.dispatchEvent(new CustomEvent('gst:tab', { detail: 'rules' })), 150); }} />
      )}
      {demoOn && hasData && <DemoGuide steps={DEMO_STEPS} go={go} route={route} loaded={(g) => data.taxpayers.some((t) => t.gstin === g)} onClose={() => setDemoOn(false)} />}
      {toast && <div className="toast"><Icon name="check" size={16} stroke={2.6} />{toast}</div>}
    </div>
  );
}
