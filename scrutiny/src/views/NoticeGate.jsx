import React, { useState } from 'react';
import { Rag } from '../components/ui.jsx';
import { inr } from '../lib/format.js';
import { READINESS, DRAFT_GATE, PRELIMINARY, verifyStep, DISPOSITION_LABEL } from '../engine/verify.js';

// Items that need a written record before they can be ticked.
const NOTE_REQUIRED = { reasons: 'Reasons in writing (saved to the case history)', approval: 'Approved by: name and designation' };
const dmy = (iso) => (iso ? iso.split('-').reverse().join('-') : '-');

export function readinessState(readiness = {}) {
  const done = DRAFT_GATE.filter((k) => readiness[k]).length;
  const draftReady = done === DRAFT_GATE.length;
  return { done, total: DRAFT_GATE.length, draftReady, finalReady: draftReady && !!readiness.factcheck };
}

// Notice readiness checklist: items 1-9 unlock ASMT-10 drafting; item 10 unlocks saving / printing the draft.
export function Readiness({ readiness = {}, setItem }) {
  const [notes, setNotes] = useState({});
  const { done, total, draftReady } = readinessState(readiness);
  return (
    <section className="card no-print" data-tour="notice-form">
      <div className="card-head">
        <div><h3>Notice readiness checklist</h3><p>Record each step before any notice. ASMT-10 drafting unlocks when items 1 to {total} are complete; the last item unlocks saving, printing and download of the draft.</p></div>
        <span className={`chip ${draftReady ? 'good' : ''}`} style={{ flexShrink: 0 }}>{done} / {total}</span>
      </div>
      <div className="checklist">
        {READINESS.map(([k, label], i) => {
          const r = readiness[k];
          const need = NOTE_REQUIRED[k];
          const note = notes[k] ?? '';
          const locked = k === 'factcheck' && !draftReady;
          return (
            <div key={k}>
              <label className={r ? 'done' : ''}>
                <input type="checkbox" checked={!!r} disabled={locked || (!r && need && !note.trim())}
                  onChange={(e) => { setItem(k, e.target.checked, label, need ? note.trim() : undefined); if (!e.target.checked) setNotes((n) => ({ ...n, [k]: r?.note || '' })); }} />
                <span>{i + 1}. {label}
                  {r && <span className="who">{r.at} · {r.by}{r.note ? ` · ${r.note}` : ''}</span>}
                  {locked && <span className="who">Available once the draft has been prepared.</span>}
                </span>
              </label>
              {need && !r && (k === 'reasons'
                ? <textarea rows={2} style={{ marginTop: 6 }} placeholder={need} aria-label={need} value={note} onChange={(e) => setNotes((n) => ({ ...n, [k]: e.target.value }))} />
                : <input style={{ marginTop: 6 }} placeholder={need} aria-label={need} value={note} onChange={(e) => setNotes((n) => ({ ...n, [k]: e.target.value }))} />)}
            </div>
          );
        })}
      </div>
      <div className="card-foot">Recorded in this browser and logged in the case history. Supervisory approval here is a recorded statement by the officer; a system-enforced maker-checker needs the multi-user backend.</div>
    </section>
  );
}

// Internal working note shown until the checklist is complete: lists the exceptions to verify, never a demand.
export function ScrutinyNote({ a, cat, user, items, clean, disp = {} }) {
  const total = items.reduce((s, r) => s + (r.exposure || 0), 0);
  return (
    <article className="doc scrutiny-note">
      <span className="draft">VERIFICATION PENDING</span>
      <div className="form-id">SCRUTINY NOTE</div>
      <div className="form-sub">Internal working note · not for issue to the taxpayer</div>
      <div className="meta">
        <div><b>Taxpayer:</b> {a.name}</div><div style={{ textAlign: 'right' }}><b>GSTIN:</b> <span className="mono">{a.gstin}</span></div>
        <div><b>Tax period:</b> FY {a.fy}</div><div style={{ textAlign: 'right' }}><b>Data extract of:</b> {dmy(a.asOf)}</div>
      </div>
      <p style={{ fontSize: 12.5, color: '#54607a' }}>{PRELIMINARY}</p>
      <p><b>Exceptions to verify ({items.length})</b></p>
      <table>
        <thead><tr><th>#</th><th>Rule</th><th>Preliminary finding</th><th className="num">Computed (₹)</th><th>Verify, with evidence</th></tr></thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td><b>{cat[r.id]?.check}</b><div className="mono" style={{ fontSize: 11, color: '#54607a' }}>{r.id} · {r.status === 'Fail' ? 'exception' : 'review'} · {disp[r.id] ? DISPOSITION_LABEL[disp[r.id].code].toLowerCase() : 'outcome pending'}</div>{r.rag && <div style={{ marginTop: 4 }}><Rag rag={r.rag} /></div>}</td>
              <td>{r.finding}</td>
              <td className="num">{r.exposure ? Math.round(r.exposure).toLocaleString('en-IN') : '-'}</td>
              <td><b>{verifyStep(r.id)[0]}.</b> {verifyStep(r.id)[1]}</td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#54607a' }}>No exceptions raised by the automated checks.</td></tr>}
          <tr><td colSpan={3} style={{ textAlign: 'right' }}><b>Total computed (unverified)</b></td><td className="num"><b>{Math.round(total).toLocaleString('en-IN')}</b></td><td /></tr>
        </tbody>
      </table>
      {clean.length > 0 && (
        <>
          <p><b>Reconciled without exception</b></p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.6 }}>
            {clean.map((r) => <li key={r.id}><b>{cat[r.id]?.check}</b> ({r.id}): {r.finding}</li>)}
          </ul>
        </>
      )}
      <p><b>Conclusion:</b> pending verification. No liability, reversal, payment or notice is proposed at this stage. Total computed {inr(total, { compact: false })} is a system calculation, not a confirmed amount.</p>
      <div className="sig"><div>Prepared by</div><div style={{ marginTop: 6 }}><b>{user.name}</b></div><div>{user.role}</div><div className="mono" style={{ fontSize: 12 }}>{user.workspace}</div></div>
    </article>
  );
}
