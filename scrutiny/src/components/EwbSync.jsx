// E-way bill sync: starts a sync on the server (scripts/ewb-store.js) and follows its progress until the refreshed
// findings are loaded. Shared by the E-way bills page and the Taxpayer 360° tab.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { api } from '../lib/api.js';
import { int } from '../lib/format.js';

const RUNNING = new Set(['request', 'fetch', 'finalise']);

export function useEwbSync({ reload, toast }) {
  const [job, setJob] = useState(null);
  const timer = useRef(null);
  const following = useRef(null); // id of the sync this screen started or picked up while it was running
  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  const poll = useCallback(async () => {
    const j = await fetch(api('/__ewb/progress'), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!j) return;
    setJob(j);
    if (RUNNING.has(j.stage)) { following.current = j.id; if (!timer.current) timer.current = setInterval(poll, 700); return; }
    stop();
    if (following.current && following.current === j.id) {
      following.current = null;
      if (j.stage === 'done') { await reload?.(); toast?.(`E-way bills synced${j.gstin ? ` for ${j.gstin}` : ''}: ${int(j.total)} returns matched`); }
      else if (j.stage === 'error') toast?.(`E-way bill sync failed: ${j.error}`);
    }
  }, [reload, toast]);
  useEffect(() => { poll(); return stop; }, [poll]); // pick up a sync already running
  const start = useCallback(async (gstin) => {
    const r = await fetch(api(`/__ewb/fetch${gstin ? `?gstin=${encodeURIComponent(gstin)}` : ''}`), { method: 'POST' }).catch(() => null);
    const body = r ? await r.json().catch(() => ({})) : {};
    if (!r || (!r.ok && r.status !== 409)) { toast?.(body.error || 'Could not start the e-way bill sync'); return; }
    following.current = body.job?.id ?? null;
    setJob(body.job);
    if (!timer.current) timer.current = setInterval(poll, 700);
  }, [poll, toast]);
  return { job, start, running: !!job && RUNNING.has(job.stage) };
}

/** The progress line and bar for a running sync; the time of the last one otherwise. */
export function SyncProgress({ job, lastSynced }) {
  if (job && RUNNING.has(job.stage)) {
    const share = job.stage === 'fetch' && job.total ? job.done / job.total : job.stage === 'finalise' ? 1 : 0.02;
    const text = job.stage === 'request' ? 'Requesting e-way bills…'
      : job.stage === 'fetch' ? `Fetching and matching e-way bills · ${int(job.done)} of ${int(job.total)} returns`
        : 'Updating findings…';
    return (
      <div style={{ minWidth: 260, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}><Icon name="truck" size={16} />{text}</div>
        <div className="kpi" style={{ padding: 0, marginTop: 6 }}><div className="bar" style={{ marginTop: 0 }}><i style={{ width: `${Math.max(2, share * 100)}%`, background: 'var(--brand)', transition: 'width .5s' }} /></div></div>
      </div>
    );
  }
  return <span className="muted" style={{ fontSize: 13 }}>Last synced {lastSynced ? new Date(lastSynced).toLocaleString('en-IN') : '-'}</span>;
}
