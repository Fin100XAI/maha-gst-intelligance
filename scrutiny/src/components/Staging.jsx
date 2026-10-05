// Upload staging: between "files chosen" and "analysed". Each file is read with the same parser the server uses (in a
// worker, so the page stays responsive); the officer sees who, which year, what was found and what could not be read,
// corrects a missing GSTIN or year, removes what should not go in, then sends the rest for analysis.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { TestTag } from './ui.jsx';
import { assess, foundText } from '../lib/staging.js';
import { isTestData } from '../engine/names.js';
import { int } from '../lib/format.js';

const STATUS = { ready: ['good', 'Ready'], check: ['warn', 'Check'], blocked: ['bad', 'Cannot use'], reading: ['', 'Reading…'] };

export default function Staging({ files, data, onConfirm, onCancel }) {
  const [reads, setReads] = useState({}); // file index -> worker answer
  const [fixes, setFixes] = useState({}); // file index -> { gstin, fy }
  const [removed, setRemoved] = useState(() => new Set());
  const worker = useRef(null);

  // read every file once, one after another, off the main thread
  useEffect(() => {
    const w = new Worker(new URL('../workers/intake.worker.js', import.meta.url), { type: 'module' });
    worker.current = w;
    let i = 0;
    const next = async () => {
      if (i >= files.length) return;
      const id = i++;
      w.postMessage({ id, name: files[id].name, buf: await files[id].arrayBuffer() });
    };
    w.onmessage = ({ data: msg }) => { setReads((r) => ({ ...r, [msg.id]: msg })); next(); };
    w.onerror = (e) => { setReads((r) => ({ ...r, [i - 1]: { ok: false, error: e.message || 'Could not read the file' } })); next(); };
    next();
    return () => w.terminate();
  }, [files]);

  const rows = useMemo(() => {
    const seen = new Map();
    return files.map((f, i) => {
      if (!reads[i]) return { i, f, status: 'reading', notes: [] };
      const prelim = assess(reads[i], fixes[i]);
      const key = `${prelim.gstin}|${prelim.fy}`;
      const duplicateOf = !removed.has(i) && prelim.gstin && seen.has(key) ? files[seen.get(key)].name : null;
      if (!removed.has(i) && prelim.gstin) seen.set(key, i);
      const loadedYears = (data.baselines?.[prelim.gstin] || []).map((b) => b.fy);
      return { i, f, read: reads[i], ...assess(reads[i], fixes[i], { duplicateOf, loadedYears }) };
    });
  }, [files, reads, fixes, removed, data.baselines]);

  const done = Object.keys(reads).length;
  const going = rows.filter((r) => !removed.has(r.i) && r.status !== 'blocked' && r.status !== 'reading');
  const blocked = rows.filter((r) => !removed.has(r.i) && r.status === 'blocked').length;
  const fix = (i, k, v) => setFixes((x) => ({ ...x, [i]: { ...x[i], [k]: v } }));
  const confirm = () => onConfirm(going.map((r) => ({ file: r.f, correction: { ...(r.needs.gstin ? { gstin: r.gstin } : {}), ...(r.needs.fy && r.fy ? { fy: r.fy } : {}) } })));

  return (
    <div className="stg card mt" aria-live="polite">
      <div className="stg-head">
        <b>Check before analysis</b>
        <span className="muted small">{done < files.length ? `Reading ${int(done)} of ${int(files.length)} files…` : `${int(files.length)} file${files.length === 1 ? '' : 's'} read: here is what the platform understood`}</span>
      </div>
      {done < files.length && <div className="kpi" style={{ padding: 0, margin: '0 0 10px' }}><div className="bar" style={{ marginTop: 0 }}><i style={{ width: `${Math.max(2, (done / files.length) * 100)}%`, background: 'var(--brand)', transition: 'width .3s' }} /></div></div>}
      <div className="tbl-wrap" style={{ maxHeight: 460 }}>
        <table className="tbl stg-tbl">
          <thead><tr><th>File</th><th>Taxpayer and year</th><th>What was found</th><th>Notes</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => {
              const off = removed.has(r.i);
              const [tone, label] = off ? ['', 'Removed'] : STATUS[r.status];
              const s = r.read?.ok ? r.read.summary : null;
              return (
                <tr key={r.i} className={off ? 'stg-off' : ''}>
                  <td className="stg-file" title={r.f.name}>{r.f.name}<div className="muted">{(r.f.size / 1048576).toFixed(1)} MB</div></td>
                  <td>
                    {s ? <><b>{s.name || '(no name)'}</b>{isTestData(r.gstin, r.f.name) && <> <TestTag /></>}<div className="mono muted" style={{ fontSize: 11 }}>{r.gstin || 'GSTIN missing'} · FY {r.fy || '?'}</div></> : <span className="muted">-</span>}
                    {!off && r.needs?.gstin && <input className="mono-in stg-in" placeholder="Enter GSTIN" value={fixes[r.i]?.gstin || ''} onChange={(e) => fix(r.i, 'gstin', e.target.value)} aria-label={`GSTIN for ${r.f.name}`} />}
                    {!off && r.needs?.fy && <input className="mono-in stg-in" placeholder="Financial year, e.g. 2025-2026" value={fixes[r.i]?.fy || ''} onChange={(e) => fix(r.i, 'fy', e.target.value)} aria-label={`Financial year for ${r.f.name}`} />}
                  </td>
                  <td style={{ fontSize: 12 }}>{s ? foundText(s.intake) : ''}{s?.intake.unreadSheets.length ? <div className="muted" style={{ fontSize: 11 }}>{s.intake.unreadSheets.length} sheet(s) not used: {s.intake.unreadSheets.slice(0, 4).join(', ')}{s.intake.unreadSheets.length > 4 ? '…' : ''}</div> : null}</td>
                  <td style={{ fontSize: 12 }}>{(r.notes || []).map((n, k) => <div key={k} className={`stg-note ${n.level}`}>{n.text}</div>)}</td>
                  <td><span className={`chip ${tone}`}>{label}</span></td>
                  <td>{r.status !== 'reading' && <button className="btn small soft" onClick={() => setRemoved((x) => { const n = new Set(x); if (n.has(r.i)) n.delete(r.i); else n.add(r.i); return n; })}>{off ? 'Put back' : 'Remove'}</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="stg-foot">
        <span className="muted small">{blocked ? `${blocked} file${blocked === 1 ? '' : 's'} cannot be used as they are and will be left out. ` : ''}Nothing is saved until you choose to analyse.</span>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={done < files.length || !going.length} onClick={confirm}><Icon name="upload" size={15} /> Analyse {int(going.length)} file{going.length === 1 ? '' : 's'}</button>
      </div>
    </div>
  );
}
