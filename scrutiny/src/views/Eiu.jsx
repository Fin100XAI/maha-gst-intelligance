import { api } from '../lib/api.js';
// EIU risk-to-revenue workbench: signals as received, revalidated on the latest returns, the taxpayer's reply as
// tested claims, the officer's challenge (exclusions and assumptions, recalculated live) and the exposure ledger.
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Kpi, PageHead, InfoTip } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { eiuContext, revalidate, testClaims, whatChanges, exposureLedger, mapSignal, STATUS } from '../engine/eiu.js';
import { EIU_REVIEW } from '../lib/caseEvents.js';
import { inr, int } from '../lib/format.js';
import { shortName } from '../components/RevenueChange.jsx';

export const STATUS_CHIP = { resolved: 'good', explained: 'good', reduced: 'warn', unchanged: 'bad', increased: 'bad', insufficient: '' };
const CLASS = {
  resolved: ['good', 'Resolved'],
  explained: ['good', 'Explained'],
  unresolved: ['bad', 'Unresolved'],
  insufficient: ['warn', 'Insufficient data'],
};
const RESULT = { supported: 'good', partial: 'warn', contradicted: 'bad', unverifiable: '' };
const today = () => new Date().toISOString().slice(0, 10);

export default function Eiu({ data, registers, cases, dispatch, selected, setSelected, openTaxpayer, toast }) {
  const eiu = registers?.eiu;
  const signals = eiu?.records || [];
  const ctx = useMemo(() => eiuContext({ baselines: data.baselines || {}, network: data.network, master: registers?.master?.records || [], taxpayers: data.taxpayers }), [data, registers]);
  const saved = (s) => cases[s.gstin]?.eiu?.[s.signalId] || {};
  const results = useMemo(() => signals.map((s) => revalidate(s, ctx, saved(s).challenge || {})), [signals, ctx, cases]); // eslint-disable-line react-hooks/exhaustive-deps
  const ledger = useMemo(() => exposureLedger(results), [results]);
  const sel = signals.find((s) => s.signalId === selected) || null;

  if (!eiu) {
    return (
      <div className="page">
        <PageHead title="EIU signals" />
        <div className="card note">No EIU signal register is loaded. Upload one in Upload data (step 2, EIU risk signals); each signal is kept exactly as received and revalidated here.</div>
      </div>
    );
  }
  const count = (st) => results.filter((r) => r.status === st).length;
  const t = ledger.totals;
  return (
    <div className="page">
      <PageHead title="EIU signals" path={`${signals.length} signals`} />
      <div className="note">
        <b>As received:</b> {eiu.meta.file} · uploaded {eiu.meta.uploadedAt?.slice(0, 10)} · {eiu.meta.rows} rows · SHA-256 <span className="mono">{eiu.meta.sha256?.slice(0, 16)}…</span>. The original file is stored unchanged; revalidation never edits a signal.
      </div>

      <Card className="mt" tour="eiu-ledger" title="Exposure ledger" sub="What the signals said, what the latest returns support, and what is still open. Not a liability: the analytical amount that deserves an officer's attention."
        actions={<InfoTip title="How the ledger is built">Each signal is recomputed as components. Resolved and explained components are reconciled; unresolved and data-insufficient ones stay open, separately. An officer's exclusion is shown, never silently dropped. The tax on one flow in one month counts once across signals: a later signal that repeats it shows it as shared.</InfoTip>}>
        <div className="ledger">
          {[['Signalled', t.original, 'as received from EIU'], ['Recomputed now', t.recomputed, 'same definitions, latest returns'], ['Reconciled', t.reconciled, 'resolved or explained by the returns'],
            ['Unresolved', t.unresolved, 'evidence-supported, open'], ['Insufficient data', t.insufficient, 'cannot be tested from the returns'], ['Excluded by officers', t.excluded, 'with a recorded reason']].map(([k, v, n]) => (
            <div key={k} className={`ledger-cell ${k === 'Unresolved' ? 'key' : ''}`}><span className="eyebrow">{k}</span><b>{inr(v)}</b><span className="muted small">{n}</span></div>
          ))}
        </div>
        {t.shared > 0 && <div className="note mt">{inr(t.shared)} appears in more than one signal and is counted once.</div>}
      </Card>

      <div className="grid g-4 mt">
        <Kpi label="Resolved or explained" value={count('resolved') + count('explained')} sub="the risk is gone, or has a legitimate cause" />
        <Kpi label="Still open" value={count('unchanged') + count('reduced')} sub="unchanged or reduced" />
        <Kpi label="Increased" value={count('increased')} sub="larger now than when signalled" dot={count('increased') ? '#b02222' : undefined} />
        <Kpi label="Data insufficient" value={count('insufficient')} sub="load the year, or map the parameter" />
      </div>

      <Card className="mt" title="Signals" sub="Largest open amount first. Select a signal to see the revalidation, test the reply and challenge the result.">
        <div className="tbl-wrap" style={{ maxHeight: 460 }}>
          <table className="tbl click">
            <thead><tr><th>Signal</th><th>Taxpayer</th><th>Risk parameter (as received)</th><th>FY</th><th className="num">Signalled</th><th>Now</th><th className="num">Open</th><th>Reply · review</th></tr></thead>
            <tbody>
              {[...results].sort((a, b) => b.totals.open - a.totals.open).map((r) => {
                const s = r.signal, e = saved(s);
                return (
                  <tr key={s.signalId} className={selected === s.signalId ? 'sel' : ''} onClick={() => setSelected(s.signalId)} tabIndex={0} onKeyDown={(ev) => ev.key === 'Enter' && setSelected(s.signalId)}>
                    <td className="mono">{s.signalId}<div className="muted small">{s.signalDate} · {s.priority || '-'}</div></td>
                    <td>{shortName(ctx.g?.nodes[s.gstin]?.name || s.gstin, 30)}<div className="mono muted small">{s.gstin}</div></td>
                    <td>{s.parameter}<div className="muted small">{r.typeLabel} · mapped by {r.mappedBy}</div></td>
                    <td className="mono">{s.fy}</td>
                    <td className="num">{inr(s.amount)}</td>
                    <td><span className={`chip ${STATUS_CHIP[r.status]}`}>{r.statusLabel}</span></td>
                    <td className="num">{r.countBased ? '-' : inr(r.totals.open)}</td>
                    <td className="small">{e.replies?.length ? `${e.replies.length} repl${e.replies.length > 1 ? 'ies' : 'y'}` : 'no reply'}{e.review ? ` · ${e.review.verdict === 'agree' ? 'agreed' : 'disagreed'}${e.review.status && e.review.status !== r.statusLabel ? ' (outdated)' : ''}` : ''}{e.challenge && (e.challenge.excluded.length || Object.keys(e.challenge.assumptions).length) ? ' · challenged' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {sel && <Workbench key={sel.signalId} sig={sel} ctx={ctx} saved={saved(sel)} dispatch={dispatch} openTaxpayer={openTaxpayer} toast={toast} loaded={data.taxpayers.some((x) => x.gstin === sel.gstin)} />}
      <div className="prelim mt" role="note"><div><b>Preliminary.</b> Revalidation uses only the loaded returns. Amounts are analytical, not a determination of tax, interest or penalty; the officer decides.</div></div>
    </div>
  );
}

// ------------------------------------------------------------------ one signal
function Workbench({ sig, ctx, saved, dispatch, openTaxpayer, toast, loaded }) {
  const savedCh = saved.challenge || { excluded: [], assumptions: {} };
  const [draft, setDraft] = useState({ excluded: savedCh.excluded || [], assumptions: savedCh.assumptions || {} });
  useEffect(() => setDraft({ excluded: savedCh.excluded || [], assumptions: savedCh.assumptions || {} }), [saved.challenge]); // eslint-disable-line react-hooks/exhaustive-deps
  const base = useMemo(() => revalidate(sig, ctx), [sig, ctx]);
  const r = useMemo(() => revalidate(sig, ctx, draft), [sig, ctx, draft]);
  const flips = useMemo(() => whatChanges(sig, ctx, draft), [sig, ctx, draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify({ excluded: savedCh.excluded || [], assumptions: savedCh.assumptions || {} });
  const [reason, setReason] = useState('');
  const toggle = (id) => setDraft((d) => ({ ...d, excluded: d.excluded.includes(id) ? d.excluded.filter((x) => x !== id) : [...d.excluded, id] }));
  const setAssumption = (key, value, def) => setDraft((d) => { const a = { ...d.assumptions }; if (value === def) delete a[key]; else a[key] = value; return { ...d, assumptions: a }; });
  const saveChallenge = () => {
    dispatch({ type: 'eiu-challenge', caseId: sig.gstin, signalId: sig.signalId, excluded: draft.excluded, assumptions: draft.assumptions, reason: reason.trim() });
    setReason(''); toast(`${sig.signalId}: challenge recorded`);
  };
  const m = mapSignal(sig);
  const ref = React.useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, []);
  return (
    <div className="mt eiu-bench" ref={ref}>
      <div className="grid g-12">
        <Card title={`${sig.signalId} as received`} sub="Kept exactly as the EIU sent it" actions={loaded && <button className="btn small" onClick={() => openTaxpayer(sig.gstin)}>Taxpayer 360°</button>}>
          <dl className="kv">
            {[['GSTIN', sig.gstin], ['Risk parameter', sig.parameter], ['Rule', sig.ruleId || '-'], ['FY', sig.fy], ['Amount', inr(sig.amount)], ['Signal date', sig.signalDate], ['Priority', sig.priority || '-'], ['Source', sig.source || '-'], ['Remarks', sig.remarks || '-'],
              ['Mapped to', `${r.typeLabel} (${m.mappedBy})`], ['Age at data date', r.ageDays !== null ? `${int(r.ageDays)} days (returns as of ${r.asOf})` : '-']].map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
          </dl>
        </Card>
        <Card title="Revalidation on the latest returns" sub={r.asOf ? `Returns as of ${r.asOf}${r.fresh === false ? ': not newer than the signal' : ''}` : 'No returns for this year'}>
          <div className={`verdict ${STATUS_CHIP[r.status] || ''}`} role="status">
            <Icon name={['resolved', 'explained'].includes(r.status) ? 'check' : 'alert'} size={18} />
            <div>
              <b>{r.statusLabel}.</b> {r.why}
              {dirty && base.status !== r.status && <div className="verdict-sub">Before your unsaved challenge: {base.statusLabel}, open {inr(base.totals.open)}.</div>}
            </div>
          </div>
          <div className="eiu-flow">
            <div><span className="eyebrow">Signalled</span><b>{inr(r.original)}</b></div><span className="path-arrow">→</span>
            <div><span className="eyebrow">Validated open now</span><b>{r.countBased ? r.comps[0]?.label : inr(r.totals.open)}</b></div>
            {r.totals.reconciled > 0 && <div><span className="eyebrow">Reconciled</span><b>{inr(r.totals.reconciled)}</b></div>}
            {r.totals.excluded > 0 && <div><span className="eyebrow">Excluded</span><b>{inr(r.totals.excluded)}</b></div>}
          </div>
          {r.notes?.length > 0 && <ul className="hyp-out">{r.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
          {r.questions?.length > 0 && <><div className="eyebrow mt">Remaining questions</div><ul className="hyp-out">{r.questions.map((q) => <li key={q}>{q}</li>)}</ul></>}
        </Card>
      </div>

      <Card className="mt" tour="eiu-challenge" title="Components and challenge" sub="Tick a component to exclude it, or change an assumption: the result recalculates at once. Saving records the change and your reason in the case history."
        actions={<InfoTip title="Challenging the result">Exclude a component the evidence answers (for example a supplier verified on site), or change an assumption (for example refuse to net a later return against an earlier shortfall). The platform shows which single change would move the conclusion, so the decision is visible and reversible.</InfoTip>}>
        {r.comps.length ? (
          <div className="tbl-wrap" style={{ maxHeight: 420 }}>
            <table className="tbl">
              <thead><tr><th>Exclude</th><th>Component</th><th>Class</th><th className="num">Amount</th><th>Why and evidence</th></tr></thead>
              <tbody>
                {r.comps.map((c) => (
                  <tr key={c.id} className={c.excluded ? 'struck' : ''}>
                    <td><input type="checkbox" checked={c.excluded} onChange={() => toggle(c.id)} aria-label={`Exclude ${c.label}`} /></td>
                    <td>{c.label}</td>
                    <td><span className={`chip ${CLASS[c.class][0]}`}>{CLASS[c.class][1]}</span></td>
                    <td className="num">{c.countBased || c.count !== undefined ? int(c.count) : inr(c.amount)}</td>
                    <td className="small">{c.why}{c.evidence?.length ? <div className="muted">{c.evidence.slice(0, 3).join(' · ')}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="note">{r.why}</div>}
        {r.assumptions.length > 0 && (
          <div className="assumptions">
            {r.assumptions.map((a) => {
              const def = !a.changed ? a.value : !a.value;
              return <label key={a.key} className="check"><input type="checkbox" checked={a.value} onChange={(e) => setAssumption(a.key, e.target.checked, def)} /> {a.label}{a.changed ? <span className="chip warn">changed</span> : null}</label>;
            })}
          </div>
        )}
        {flips.length > 0 && (
          <div className="mt"><div className="eyebrow">What would change the conclusion</div>
            <ul className="hyp-out">{flips.map((f) => <li key={f.kind + f.id}>{f.kind === 'exclude' ? `Excluding ${f.label}` : f.label}: {STATUS[f.from].label} → <b>{STATUS[f.to].label}</b>{f.open !== undefined ? ` (open ${inr(f.open)})` : ''}</li>)}</ul>
          </div>
        )}
        {dirty && (
          <div className="challenge-save">
            <input className="input" placeholder="Reason for this change (required, kept in the case history)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="btn primary small" disabled={!reason.trim()} onClick={saveChallenge}>Save challenge</button>
            <button className="btn small" onClick={() => setDraft({ excluded: savedCh.excluded || [], assumptions: savedCh.assumptions || {} })}>Discard</button>
          </div>
        )}
        {saved.challenges?.length > 0 && (
          <details className="mt"><summary className="muted">Challenge history ({saved.challenges.length})</summary>
            <ul className="hyp-out">{saved.challenges.map((c) => <li key={c.at + c.reason}>{c.at} · {c.by}: {c.excluded.length} excluded, {Object.keys(c.assumptions).length} assumption(s) changed. {c.reason}</li>)}</ul>
          </details>
        )}
      </Card>

      <Replies sig={sig} r={r} ctx={ctx} saved={saved} dispatch={dispatch} toast={toast} />
      <Review sig={sig} r={r} saved={saved} dispatch={dispatch} toast={toast} />
    </div>
  );
}

// ------------------------------------------------------------------ capability 18: the reply as tested claims
function Replies({ sig, r, ctx, saved, dispatch, toast }) {
  const replies = saved.replies || [];
  const [pick, setPick] = useState(0);
  const reply = replies[Math.min(pick, replies.length - 1)];
  const claims = useMemo(() => (reply ? testClaims(reply.text, r, ctx) : []), [reply, r, ctx]);
  const counts = Object.fromEntries(Object.keys(RESULT).map((k) => [k, claims.filter((c) => c.result === k).length]));
  return (
    <Card className="mt" tour="eiu-claims" title="Taxpayer / CA reply, claim by claim" sub={reply ? `Reply from ${reply.from} received ${reply.received}${reply.ref ? ` (${reply.ref})` : ''} · supported ${counts.supported} · partly supported ${counts.partial} · contradicted ${counts.contradicted} · not testable from returns ${counts.unverifiable}` : 'Paste the reply: each statement becomes a claim tested against the returns'}
      actions={replies.length > 1 && <select value={pick} onChange={(e) => setPick(Number(e.target.value))}>{replies.map((x, i) => <option key={x.at + i} value={i}>{x.received} · {x.from}</option>)}</select>}>
      {reply?.doc && <div className="doc-ref"><Icon name="notice" size={15} /><span>Read from <a href={api(`/__docs/${reply.doc.sha256}`)} download={reply.doc.name}>{reply.doc.name}</a> · {Math.round(reply.doc.size / 1024)} KB · SHA-256 <span className="mono">{reply.doc.sha256.slice(0, 12)}…</span> (the original is kept as received)</span></div>}
      {reply && <blockquote className="reply-text">{reply.text}</blockquote>}
      {claims.length > 0 && (
        <div className="tbl-wrap" style={{ maxHeight: 460 }}>
          <table className="tbl">
            <thead><tr><th>Claim</th><th>Result</th><th className="num">Supported</th><th>Record relied on</th><th>Contradiction</th><th>Missing proof</th><th className="num">Residual</th></tr></thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id}>
                  <td className="small">{c.text}<div className="muted">{c.type.replace(/-/g, ' ')}</div></td>
                  <td><span className={`chip ${RESULT[c.result]}`}>{c.result}</span></td>
                  <td className="num">{c.supported !== null ? inr(c.supported) : '-'}</td>
                  <td className="small">{c.record || '-'}</td>
                  <td className="small">{c.contradiction || '-'}</td>
                  <td className="small">{c.missing || '-'}</td>
                  <td className="num">{c.residual !== null ? inr(c.residual) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className="mt" open={!replies.length}>
        <summary className="muted">Record a reply</summary>
        <ReplyForm sig={sig} dispatch={dispatch} toast={toast} onRecorded={() => setPick(0)} />
      </details>
    </Card>
  );
}

// ------------------------------------------------------------------ recording one reply (also used on the Upload data page)
/** The reply form: attach the letter (stored as received, text read for checking) or paste it, then record it. */
export function ReplyForm({ sig, dispatch, toast, onRecorded }) {
  const blank = { received: today(), from: 'CA', ref: '', text: '', doc: null, method: '', warnings: [] };
  const [form, setForm] = useState(blank);
  const [reading, setReading] = useState(false);
  const [round, setRound] = useState(0); // clears the file picker after a reply is recorded
  // A reply document is stored as received (hash kept) and its text read for the officer to check before testing.
  const attach = async (file) => {
    if (!file) return;
    setReading(true);
    try {
      const res = await fetch(api(`/__docs/upload?name=${encodeURIComponent(file.name)}`), { method: 'POST', body: file, headers: { 'content-type': 'application/octet-stream' } });
      const out = await res.json().catch(() => ({ ok: false, error: `Upload failed (${res.status})` }));
      if (!out.ok) {
        toast(out.error || 'The document could not be stored');
        // Without the server a text file can still be read here; it is then recorded without a stored original.
        if (/\.txt$/i.test(file.name)) { const t = await file.text(); setForm((f) => ({ ...f, text: t, doc: null, method: 'plain text (this browser)', warnings: [] })); }
        return;
      }
      setForm((f) => ({ ...f, text: out.text, doc: out.doc, method: out.method, warnings: out.warnings || [] }));
      // A scan or a photo: read it with OCR on the server (approximate; the officer checks the text)
      if (!out.text && out.ocr?.pages) {
        setReading(`Reading ${out.ocr.pages} scanned page${out.ocr.pages === 1 ? '' : 's'} with OCR…`);
        const o = await fetch(api(`/__docs/${out.doc.sha256}/ocr`), { method: 'POST' }).then((r) => r.json()).catch(() => ({ ok: false, error: 'OCR could not be reached' }));
        if (o.ok) setForm((f) => ({ ...f, text: o.text, method: o.method, warnings: o.warnings || [] }));
        else setForm((f) => ({ ...f, warnings: [o.error || 'OCR failed: paste the text instead', ...(out.ocr.skipped || []).map((x) => `Not read: ${x}.`)] }));
      } else if (!out.text && out.ocr?.skipped?.length) setForm((f) => ({ ...f, warnings: [...f.warnings, ...out.ocr.skipped.map((x) => `Not read: ${x}. Paste the text instead.`)] }));
    } catch {
      toast('Documents need the local server; paste the text instead');
    } finally { setReading(false); }
  };
  const add = () => {
    dispatch({ type: 'eiu-reply', caseId: sig.gstin, signalId: sig.signalId, received: form.received, from: form.from, ref: form.ref, text: form.text.trim(), ...(form.doc ? { doc: form.doc } : {}) });
    setForm(blank); setRound((n) => n + 1); onRecorded?.(); toast(`${sig.signalId}: reply recorded and tested`);
  };
  return (
    <div className="reply-form">
      <label className="field"><span>Received</span><input type="date" value={form.received} onChange={(e) => setForm({ ...form, received: e.target.value })} /></label>
      <label className="field"><span>From</span><select value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}>{['CA', 'Taxpayer', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <label className="field"><span>Reference</span><input value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} placeholder="Letter or ARN" /></label>
      <label className="field wide"><span>Reply document (PDF, Word, text, or a scan or photo of the letter), or paste below</span>
        <input key={round} type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png" onChange={(e) => attach(e.target.files?.[0])} disabled={reading} />
      </label>
      {(reading || form.doc || form.warnings.length > 0) && (
        <div className="wide doc-read">
          {reading ? (typeof reading === 'string' ? reading : 'Reading the document…') : form.doc ? <>Read <b>{form.doc.name}</b> ({form.method}). Check the text below: it is what will be tested.</> : null}
          {form.warnings.map((w) => <div key={w} className="demo-warn">{w}</div>)}
        </div>
      )}
      <label className="field wide"><span>Reply text</span><textarea rows={form.doc ? 10 : 4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Paste the explanation as received" /></label>
      <button className="btn primary small" disabled={form.text.trim().length < 5} onClick={add}>Record and test</button>
    </div>
  );
}

function Review({ sig, r, saved, dispatch, toast }) {
  const [note, setNote] = useState('');
  const review = saved.review;
  const send = (verdict) => { dispatch({ type: 'eiu-review', caseId: sig.gstin, signalId: sig.signalId, verdict, status: r.statusLabel, ...(note.trim() ? { note: note.trim() } : {}) }); setNote(''); toast(`${sig.signalId}: ${EIU_REVIEW[verdict].toLowerCase()}`); };
  return (
    <Card className="mt" title="Officer review" sub="Record whether you agree with the revalidation. Disagreeing needs a reason; both are kept in the case history.">
      {review && <div className={`verdict ${review.verdict === 'agree' ? 'good' : 'warn'}`}><Icon name="check" size={18} /><div><b>{EIU_REVIEW[review.verdict]}</b>{review.status ? ` (${review.status})` : ''} · {review.by}, {review.at}{review.note ? `: ${review.note}` : ''}
        {review.status && review.status !== r.statusLabel && <div className="verdict-sub">The result has changed since this review (now {r.statusLabel}): review it again.</div>}</div></div>}
      <div className="challenge-save mt">
        <input className="input" placeholder="Note (required to disagree)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn small" onClick={() => send('agree')}>Agree</button>
        <button className="btn small" disabled={!note.trim()} onClick={() => send('disagree')}>Disagree</button>
      </div>
    </Card>
  );
}
