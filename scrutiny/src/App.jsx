import { api } from './lib/api.js';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Portfolio from './views/Portfolio.jsx';
import Taxpayer from './views/Taxpayer.jsx';
import Revenue from './views/Revenue.jsx';
import Network from './views/Network.jsx';
import Eiu from './views/Eiu.jsx';
import EwayBills from './views/EwayBills.jsx';
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
import Alerts from './views/Alerts.jsx';
import { followUps } from './engine/notices.js';
import Report, { saveReport } from './views/Report.jsx';
import Scoring from './views/Scoring.jsx';
import Login from './views/Login.jsx';
import AccountSignIn from './views/AccountSignIn.jsx';
import Accounts from './views/Accounts.jsx';
import { authStatus, signOut } from './lib/auth.js';
import { can, userFromAccount } from './lib/access.js';
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
  { id: 'alerts', label: 'Alerts', icon: 'alert', badge: 'alerts' },
  { id: 'revenue', label: 'Revenue', icon: 'trend' },
  { id: 'network', label: 'Network', icon: 'network' },
  { id: 'eiu', label: 'EIU signals', icon: 'alert' },
  { id: 'ewb', label: 'E-way bills', icon: 'truck' },
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
  { id: 'accounts', label: 'Accounts', icon: 'taxpayer' },
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
  const [error, setError] = useState(null);
  // Embedded: the shell signs the officer in, so no session is read or saved here.
  const [embedded, setEmbedded] = useState(embedRequested);
  const [parentOrigin, setParentOrigin] = useState(null);
  const [user, setUser] = useState(() => (embedRequested ? null : withDesignation(session.get())));
  // 'loading' until the server says whether officers have accounts (scripts/auth.js); open without a server
  const [authMode, setAuthMode] = useState('loading');
  const authModeRef = React.useRef(authMode);
  authModeRef.current = authMode;
  const checkAuth = useCallback(() => authStatus().then(({ mode, account }) => {
    setAuthMode(mode);
    if (mode === 'accounts') setUser((u) => (account ? (u?.id === account.id && !account.mustChange === !u.mustChange ? u : userFromAccount(account)) : null));
  }), []);
  useEffect(() => { checkAuth(); }, [checkAuth]);
  // a session can end elsewhere (expiry, password reset, account disabled): look again when the tab comes back
  useEffect(() => { const f = () => { if (authModeRef.current === 'accounts') checkAuth(); }; window.addEventListener('focus', f); return () => window.removeEventListener('focus', f); }, [checkAuth]);
  // The analysis and the services answer only once someone may see them; with accounts, each officer gets their own cut.
  const dataKey = authMode === 'loading' ? null : authMode === 'open' ? 'open' : user && !user.mustChange ? user.id : null;
  const [route, setRoute] = useState(readHash);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingAll, setSavingAll] = useState(null);
  const [cfg, setCfg] = usePersistent('gst.scoring', DEFAULT_SCORING);
  // Case record: server-side event log when available, this browser's storage otherwise (src/lib/useCaseStore.js).
  const { cases, notices, dispatch, mode: caseMode, error: caseError } = useCaseStore(dataKey ? user : null);
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

  const reloadData = useCallback(() => fetch(api('/data.json'), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setRaw(d); }), []);
  useEffect(() => {
    if (!dataKey) return;
    setError(null);
    fetch(api('/data.json'), { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(`data.json: HTTP ${r.status}`); return r.json(); })
      .then(setRaw).catch((e) => setError(e.message));
    loadRegisters();
  }, [dataKey, loadRegisters]);
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
        if (authModeRef.current !== 'open') return; // accounts: the officer signs in to their own account
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
  // After drafting: the issue and reminders the officer records (src/lib/caseEvents.js); escalation is by approval
  const issueNotice = useCallback((id, issue) => dispatch({ type: 'notice-issue', caseId: id, ...issue }), [dispatch]);
  const remindNotice = useCallback((id, r) => dispatch({ type: 'notice-reminder', caseId: id, ...r }), [dispatch]);

  // Alert queue (server: scripts/alert-store.js). lastSeen is when this officer last opened the queue, for "New".
  const [alertQueue, setAlertQueue] = useState(undefined); // undefined = loading, null = no server store
  const [alertsSeenAt, setAlertsSeenAt] = useState(null);
  const officer = user?.name || '';
  const viewer = useMemo(() => (user ? { id: user.id, name: user.name, canApprove: can(user, 'approve') } : null), [user]);
  // Maker-checker (src/lib/caseEvents.js guardEvent): ask, then a second officer approves or returns.
  const requestApproval = useCallback((id, stage, extra = {}) => dispatch({ type: 'approval-request', caseId: id, stage, ...extra }), [dispatch]);
  const decideApproval = useCallback((id, stage, decision, note) => dispatch({ type: 'approval-decide', caseId: id, stage, decision, ...(note ? { note } : {}) }), [dispatch]);
  const endSession = useCallback(async () => {
    if (authModeRef.current === 'accounts') await signOut(); else session.set(null);
    setUser(null); setRaw(null); go('login');
  }, [go]);
  const loadAlerts = useCallback(() => fetch(api(`/__alerts?user=${encodeURIComponent(officer)}`), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null)).then((q) => { setAlertQueue(q && Array.isArray(q.alerts) ? q : null); return q; }).catch(() => setAlertQueue(null)), [officer]);
  const alertAction = useCallback(async (key, action, note) => {
    const r = await fetch(api('/__alerts/action'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, action, note, by: officer }) }).then((x) => x.json()).catch(() => null);
    if (!r?.ok) setToast(r?.error || 'Could not record that');
    else setToast(action === 'dismiss' ? 'Alert dismissed, with your reason' : action === 'acknowledge' ? 'Alert acknowledged' : 'Alert reopened');
    loadAlerts();
  }, [officer, loadAlerts]);
  const saveAlertRules = useCallback(async (rules) => {
    const r = await fetch(api('/__alerts/rules'), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rules }) }).then((x) => x.json()).catch((e) => ({ ok: false, error: e.message }));
    if (r?.ok) { setToast('Alert rules saved: the queue is refreshed'); loadAlerts(); }
    return r;
  }, [loadAlerts]);
  useEffect(() => { if (caseError) setToast(caseError); }, [caseError]);

  // Uploads are saved on the server (data/ + rebuilt data.json) so they survive reloads and restarts.
  // If the server cannot save (static hosting, remote browser), the workbook is analysed in this browser only.
  const [uploadProgress, setUploadProgress] = useState(null);
  // The upload log (server): each batch's files and the analysis that followed, newest first. null = no server store.
  const [uploads, setUploads] = useState(null);
  const loadUploads = useCallback(() => fetch(api('/__data/uploads'), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((v) => setUploads(v && Array.isArray(v.batches) ? v : null)).catch(() => setUploads(null)), []);
  useEffect(() => { if (dataKey) loadUploads(); }, [loadUploads, dataKey]);
  useEffect(() => { if (dataKey) loadAlerts(); }, [loadAlerts, raw, dataKey]); // raw changes after every analysis
  // Opening the queue: keep the previous visit's time for "New" on this visit, then record this one
  useEffect(() => {
    if (route.view !== 'alerts' || !officer) return;
    loadAlerts().then((q) => {
      setAlertsSeenAt(q?.lastSeen || null);
      fetch(api('/__alerts/seen'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: officer }) }).catch(() => {});
    });
  }, [route.view, officer, loadAlerts]);
  // Analyse on the server in the background and follow its progress. Returns the finished run (or null).
  const analyseOnServer = useCallback(async (batch) => {
    setUploadProgress({ stage: 'analyse', done: 0, total: 0 });
    const start = await fetch(api(`/__data/rebuild${batch ? `?batch=${batch}` : ''}`), { method: 'POST' }).then((r) => r.json()).catch(() => null);
    // A run already going when the batch ended is followed by one that includes it: wait for that one.
    const mine = start?.job?.id, waitNext = !!start?.queued;
    for (let tries = 0; mine && tries < 1800; tries++) {
      await new Promise((ok) => setTimeout(ok, 1000));
      const p = await fetch(api('/__data/progress'), { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      if (!p || !(waitNext ? p.id > mine : p.id === mine)) continue;
      setUploadProgress({ stage: 'analyse', done: p.done || 0, total: p.total || 0 });
      if (p.finishedAt) return p;
    }
    return null;
  }, []);
  // Analyse again (e.g. after a failed run): the files are already saved.
  const retryAnalysis = useCallback(async (batch) => {
    setBusy(true);
    try {
      const run = await analyseOnServer(batch);
      await reloadData();
      await loadUploads();
      setToast(run?.stage === 'done' ? 'Analysis finished: the dashboard shows the uploaded data' : `Analysis did not finish: ${run?.error || 'no answer from the server'}`);
    } finally { setBusy(false); setUploadProgress(null); }
  }, [analyseOnServer, reloadData, loadUploads]);
  // Registers: saved on the server. A due-date extension changes when returns count as late, so the returns are
  // analysed again (in the background, with progress) after that register is uploaded.
  const uploadRegister = useCallback(async (type, file) => {
    try {
      const r = await fetch(api(`/__registers/upload?type=${encodeURIComponent(type)}&name=${encodeURIComponent(file.name)}`), { method: 'POST', body: file, headers: { 'content-type': 'application/octet-stream' } });
      const body = await r.json();
      if (body.ok) {
        await loadRegisters();
        setToast(body.meta.mode === 'merge' ? `${body.meta.title}: ${body.meta.added} added, ${body.meta.updated} updated, ${body.meta.rows} rows in all` : `${body.meta.title}: ${body.meta.rows} rows loaded`);
        if (type === 'extensions') await retryAnalysis(null);
      }
      return body;
    } catch (e) {
      return { ok: false, errors: [`Upload failed: ${e.message}`] };
    }
  }, [loadRegisters, retryAnalysis]);
  // files: File objects, or { file, correction } from the staging step (a GSTIN or year the officer entered)
  const onFiles = useCallback(async (picked) => {
    const items = picked.map((x) => (x instanceof File ? { file: x, correction: {} } : x));
    const files = items.map((x) => x.file);
    if (!files.length || !raw) return;
    setBusy(true);
    const batch = `b${Date.now()}`;
    try {
      const saved = [], browserOnly = [], problems = [];
      const uploadOne = async ({ file: f, correction }) => {
        if (!/\.xlsx$/i.test(f.name) || f.size > 40 * 1024 * 1024) { problems.push(`${f.name}: .xlsx under 40 MB only`); return; }
        let r = null;
        // defer=1: save only; the batch is analysed once, after the last file
        const fix = `${correction?.gstin ? `&gstin=${encodeURIComponent(correction.gstin)}` : ''}${correction?.fy ? `&fy=${encodeURIComponent(correction.fy)}` : ''}`;
        try { r = await fetch(api(`/__data/upload?name=${encodeURIComponent(f.name)}&defer=1&batch=${batch}${fix}`), { method: 'POST', body: f, headers: { 'content-type': 'application/octet-stream' } }); } catch { r = null; }
        const body = r ? await r.json().catch(() => null) : null;
        if (r?.ok && body?.ok) saved.push(body);
        else if (r && (r.status === 400 || r.status === 413)) problems.push(`${f.name}: ${body?.error || 'not a returns export'}`);
        else browserOnly.push({ f, correction, why: body?.error || (r ? `HTTP ${r.status}` : 'server not reachable') });
      };
      // A few uploads at a time, then one rebuild on the server in the background, with its progress shown.
      const queue = [...items];
      let sent = 0;
      setUploadProgress({ stage: 'upload', done: 0, total: files.length });
      await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
        while (queue.length) { await uploadOne(queue.shift()); setUploadProgress({ stage: 'upload', done: ++sent, total: files.length }); }
      }));
      let run = null;
      loadUploads(); // the report switches to this upload at once: received and saved, analysis in progress
      if (saved.some((s) => s.deferred)) run = await analyseOnServer(batch);
      else if (problems.length) await fetch(api(`/__data/rebuild?batch=${batch}`), { method: 'POST' }).catch(() => null); // only rejected files: close the batch

      let next = raw;
      if (saved.length) {
        const fresh = await fetch(api('/data.json'), { cache: 'no-store' });
        if (fresh.ok) next = await fresh.json();
      }
      const added = [];
      if (browserOnly.length) {
        const [XLSX, { parseWorkbook }, { analyze }] = await Promise.all([import('xlsx'), import('./engine/parse.js'), import('./engine/analyze.js')]);
        for (const { f, correction } of browserOnly) {
          const tp = parseWorkbook(XLSX.read(await f.arrayBuffer(), { type: 'array' }), f.name, correction || {});
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
      await loadUploads(); // after the fresh data, so the report never shows a finished analysis without its results

      const nameOf = (gstin) => next.taxpayers.find((t) => t.gstin === gstin)?.name || gstin;
      const msgs = [];
      if (saved.length) {
        // The full result is the upload report on this page; the toast says it in one line.
        const names = [...new Set(saved.map((s) => nameOf(s.gstin)))];
        msgs.push(run?.stage === 'done' ? `Uploaded and analysed ${saved.length} file${saved.length > 1 ? 's' : ''} for ${names.length} taxpayer${names.length > 1 ? 's' : ''}: see the upload report below`
          : `Saved ${saved.length} file${saved.length > 1 ? 's' : ''}, but the analysis did not finish${run?.error ? ` (${run.error})` : ''}: see the upload report below`);
      }
      if (added.length) msgs.push(`Analysed ${added.map((a) => a.name).join(', ')} in this browser only: not saved (${browserOnly[0].why})`);
      if (problems.length) msgs.push(`Not accepted: ${problems.join('; ')}`);
      if (msgs.length) setToast(msgs.join('. '));
      go('data');
    } catch (e) {
      setToast(`Could not read file: ${e.message}`);
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  }, [raw, severity, go, analyseOnServer, loadUploads]);

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
  if (authMode === 'loading') return <div className="page"><div className="empty">Loading…</div></div>;
  if (authMode === 'accounts' && (!user || user.mustChange)) {
    return <AccountSignIn embedded={embedded} go={go} mustChange={user?.mustChange ? user : null} onSignedIn={(a) => { setUser(userFromAccount(a)); if (!embedded) go('dashboard'); }} />;
  }
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
  const noticeFollowUps = followUps({ notices, cases, taxpayers: data.taxpayers, today: new Date().toISOString().slice(0, 10), viewer }).length;
  const alertCount = (alertQueue?.alerts || []).filter((a) => a.status === 'open').length + noticeFollowUps;
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
              <Icon name={n.icon} size={18} />{n.label}{n.badge && <span className="badge">{n.badge === 'alerts' ? alertCount : openCount}</span>}{n.id === 'ai' && <span className={`live ${aiLive ? '' : 'off'}`} title={aiLive ? 'AI connection is live' : 'AI not connected'}><i />{aiLive ? 'live' : 'off'}</span>}
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
          <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={endSession}><Icon name="logout" size={17} /></button>
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
        {route.view === 'dashboard' && <Portfolio data={data} openTaxpayer={openTaxpayer} go={go} latestUpload={uploads?.batches?.[0] || null} aiProps={{ ai, setAi, cache: aiCache, setCache: setAiCache, go, ...hideProps('portfolio') }} />}
        {route.view === 'demo' && <DemoScript data={data} registers={registers} cases={cases} go={(v, id, tab) => (v === 'taxpayer' ? openTaxpayerTab(id, tab || null) : go(v, id))} onStart={() => { setJurisdiction(WARD.jurisdiction); setTouring(false); setDemoOn(true); }} />}
        {route.view === 'overview' && <Overview data={data} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} user={user} roleHint={route.id} go={(v, id, tab) => (v === 'taxpayer' ? openTaxpayerTab(id, tab || null) : go(v, id))} />}
        {route.view === 'collections' && <Collections data={data} go={go} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />}
        {route.view === 'actions' && <Actions data={data} go={go} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} selected={route.id} />}
        {route.view === 'recovery' && <Recovery data={data} go={go} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} openTaxpayer={(g) => openTaxpayerTab(g, null)} />}
        {route.view === 'accounts' && <Accounts mode={authMode} user={user} onSignOut={endSession} toast={setToast} />}
        {route.view === 'governance' && <Governance data={data} registers={registers} cases={cases} go={(v, id, tab) => (v === 'taxpayer' ? openTaxpayerTab(id, tab || null) : go(v, id))} />}
        {route.view === 'targets' && <Targets data={data} go={go} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />}
        {route.view === 'learning' && <Learning data={data} go={go} registers={registers} cases={cases} jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} />}
        {route.view === 'eiu' && <Eiu data={data} registers={registers} cases={cases} dispatch={dispatch} selected={route.id} setSelected={(id) => { window.location.hash = `/eiu/${id}`; }} openTaxpayer={(g) => openTaxpayerTab(g, null)} toast={setToast} />}
        {route.view === 'ewb' && <EwayBills data={data} openTaxpayer={(g) => openTaxpayerTab(g, 'ewb')} toast={setToast} reload={reloadData} />}
        {route.view === 'network' && <Network data={data} registers={registers} openTaxpayer={openTaxpayerTab} />}
        {route.view === 'revenue' && <Revenue data={data} registers={registers} openRevenue={openRevenue} />}
        {route.view === 'cases' && <Cases data={data} cases={cases} setCaseStatus={changeStatus} openTaxpayer={openTaxpayer} openNotice={(id) => go('notices', id)} go={go} />}
        {route.view === 'taxpayer' && current && (
          <Taxpayer key={current.id} a={current} ewbSync={{ reload: reloadData, toast: setToast }} initialTab={route.tab} baselines={data.baselines?.[current.gstin]} network={data.network} master={registers?.master?.records} openTaxpayerTab={openTaxpayerTab} catalog={data.catalog} taxpayers={data.taxpayers} onSelect={openTaxpayer}
            caseInfo={cases[current.id] || { status: 'New' }} setCaseStatus={changeStatus} addNote={addNote} setDisposition={setDisposition} addResponse={addResponse} logEvent={logEvent} user={user} dataGeneratedAt={data.generatedAt} cfg={cfg} severity={severity} openNotice={() => go('notices', current.id)} openReport={() => go('report', current.id)} aiProps={{ ai, setAi, cache: aiCache, setCache: setAiCache, go, ...hideProps('taxpayer') }} />
        )}
        {route.view === 'report' && current && (
          <Report key={current.id} data={data} a={current} caseInfo={cases[current.id] || { status: 'New' }} notice={notices[current.id]} user={user} setSelected={(id) => go('report', id)} toast={setToast} saveAll={saveAllReports} savingAll={savingAll} ai={ai} aiCache={aiCache} openTaxpayer={openTaxpayer} />
        )}
        {route.view === 'notices' && <Notices data={data} cases={cases} notices={notices} saveNotice={saveNotice} issueNotice={issueNotice} remindNotice={remindNotice} requestApproval={requestApproval} decideApproval={decideApproval} viewer={viewer} setReadiness={setReadiness} selected={selectedId} setSelected={(id) => go('notices', id)} user={user} toast={setToast} />}
        {route.view === 'alerts' && <Alerts data={data} queue={alertQueue} lastSeen={alertsSeenAt} cases={cases} notices={notices} master={registers?.master?.records || []} onAction={alertAction} onSaveRules={saveAlertRules} viewer={viewer} canConfigure={can(user, 'configure')} canAct={can(user, 'work')} openTaxpayer={openTaxpayer} openNotice={(id) => go('notices', id)} />}
        {route.view === 'rules' && <RuleRegister data={data} openTaxpayer={openTaxpayer} />}
        {route.view === 'ai' && <AISettings data={data} ai={ai} setAi={setAi} toast={setToast} />}
        {route.view === 'scoring' && <Scoring data={data} baseTaxpayers={raw.taxpayers} cfg={cfg} onSave={setCfg} toast={setToast} />}
        {PUBLIC.has(route.view) && renderPublic(route.view, user)}
        {route.view === 'data' && <DataMethod data={data} canUpload={can(user, 'upload')} canUploadRegisters={can(user, 'upload') && (!user.jurisdictions || user.jurisdictions.includes('*'))} onFiles={onFiles} busy={busy} uploadProgress={uploadProgress} uploads={uploads} retryAnalysis={retryAnalysis} openTaxpayer={openTaxpayer} openReport={(id) => go('report', id)} cfg={cfg} registers={registers} onRegisterUpload={uploadRegister} cases={cases} dispatch={dispatch} toast={setToast} go={go} />}
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
