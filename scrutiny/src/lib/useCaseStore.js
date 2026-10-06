import { api } from './api.js';
// Case record for the app. With the server store (dev server or server.mjs), every change is an event appended to
// the server log and shared by every browser; the change shows immediately and is rolled back to the server's state
// if the server rejects it. Without a server (static hosting) the same events are applied to this browser's storage.
import { useCallback, useEffect, useRef, useState } from 'react';
import { applyEvent, emptyState, validateEvent, guardEvent } from './caseEvents.js';
import { nowStamp } from './store.js';

const LS = { cases: 'gst.cases', notices: 'gst.notices', migrated: 'gst.casesMigrated' };
const readLocal = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const writeLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

async function fetchServer() {
  const r = await fetch(api('/__cases'), { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const body = await r.json();
  if (!body || typeof body.cases !== 'object') throw new Error('not a case store');
  return body;
}
async function postEvents(events) {
  const r = await fetch(api('/__cases/events'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events }) });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || !body.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return body;
}

/**
 * @param {{ name?: string, id?: string } | null} user  the signed-in officer (recorded as "by" on every event; with
 *   accounts the server records the account itself). null: nothing is loaded yet.
 * @returns {{ cases: object, notices: object, dispatch: (ev: object) => string|null, mode: 'loading'|'server'|'browser', error: string|null }}
 *   dispatch returns why the event was refused, or null when it was applied
 */
export function useCaseStore(user) {
  const [state, setState] = useState(emptyState);
  const [mode, setMode] = useState('loading');
  const [error, setError] = useState(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const stateRef = useRef(state);
  stateRef.current = state;

  const load = useCallback(async () => {
    if (!user) { setState(emptyState()); setMode('loading'); return; }
    try {
      const server = await fetchServer();
      // One-time import of records kept in this browser before the server store existed.
      const local = { cases: readLocal(LS.cases, {}), notices: readLocal(LS.notices, {}) };
      let current = server;
      if (!readLocal(LS.migrated, false) && (Object.keys(local.cases).length || Object.keys(local.notices).length)) {
        try {
          await postEvents([{ type: 'import', at: nowStamp(), by: user?.name, ...local }]);
          writeLocal(LS.migrated, true);
          current = await fetchServer();
        } catch { /* not accepted here (officer accounts): the records stay in this browser, the server's are used */ }
      }
      setState({ cases: current.cases, notices: current.notices });
      setMode('server');
    } catch {
      setState({ cases: readLocal(LS.cases, {}), notices: readLocal(LS.notices, {}) });
      setMode('browser');
    }
  }, [user?.name, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  // Other tabs or officers may have changed cases: refresh when this tab regains focus.
  useEffect(() => {
    const onFocus = () => { if (modeRef.current === 'server') fetchServer().then((s) => setState({ cases: s.cases, notices: s.notices })).catch(() => {}); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  // Browser mode: persist locally, as before the server store.
  useEffect(() => { if (mode === 'browser') { writeLocal(LS.cases, state.cases); writeLocal(LS.notices, state.notices); } }, [mode, state]);

  const dispatch = useCallback((partial) => {
    const ev = { ...partial, at: nowStamp(), by: user?.name, ...(user?.id ? { byId: user.id } : {}) };
    const why = validateEvent(ev) || guardEvent(stateRef.current, ev);
    if (why) { setError(why); return why; }
    setError(null);
    stateRef.current = applyEvent(stateRef.current, ev);
    setState(stateRef.current);
    if (modeRef.current === 'server') {
      postEvents([ev]).then(() => setError(null)).catch((e) => {
        setError(`Not saved: ${e.message}`);
        fetchServer().then((s) => setState({ cases: s.cases, notices: s.notices })).catch(() => {});
      });
    }
    return null;
  }, [user?.name, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { cases: state.cases, notices: state.notices, dispatch, mode, error };
}
