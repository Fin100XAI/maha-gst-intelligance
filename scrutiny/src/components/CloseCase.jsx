import React, { useEffect, useRef, useState } from 'react';
import { CLOSURE, DISPOSITION_LABEL, isIssue } from '../engine/verify.js';

// Reasoned closure: a closure code and written reasons are required, and every issue needs a recorded outcome first.
export default function CloseCase({ a, caseInfo, onClose, onCancel, openFindings }) {
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');
  const first = useRef(null);
  const disp = caseInfo.dispositions || {};
  const pending = a.results.filter(isIssue).filter((r) => !disp[r.id]);
  const confirmed = a.results.filter(isIssue).filter((r) => disp[r.id]?.code === 'confirmed');
  useEffect(() => { first.current?.focus(); const k = (e) => e.key === 'Escape' && onCancel(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onCancel]);
  return (
    <div className="modal-bg" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cc-title">
        <h3 id="cc-title">Close case: {a.name}</h3>
        {pending.length > 0 ? (
          <>
            <p className="muted">Record an outcome for every issue before closing. {pending.length} still pending:</p>
            <ul className="modal-list">{pending.map((r) => <li key={r.id}><b>{r.id}</b> {r.finding.slice(0, 110)}{r.finding.length > 110 ? '…' : ''}</li>)}</ul>
            <div className="modal-actions">
              <button className="btn" ref={first} onClick={onCancel}>Cancel</button>
              <button className="btn primary" onClick={openFindings}>Open rule findings</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 0 }}>{confirmed.length ? `${confirmed.length} confirmed discrepanc${confirmed.length === 1 ? 'y' : 'ies'}: ${confirmed.map((r) => r.id).join(', ')}.` : 'No confirmed discrepancy on record.'} Outcomes: {Object.values(disp).map((d) => DISPOSITION_LABEL[d.code]).filter(Boolean).length} recorded.</p>
            <div className="field">
              <label htmlFor="cc-code">Closure code</label>
              <select id="cc-code" ref={first} value={code} onChange={(e) => setCode(e.target.value)}>
                <option value="">Choose…</option>
                {CLOSURE.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="cc-reason">Reasons for closure</label>
              <textarea id="cc-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What was verified, what the taxpayer showed, and why the case can close." />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={onCancel}>Cancel</button>
              <button className="btn primary" disabled={!code || !reason.trim()} onClick={() => onClose(code, reason.trim())}>Close case</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
