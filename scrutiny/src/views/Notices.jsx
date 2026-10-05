import React, { useEffect, useMemo, useState } from 'react';
import { PageHead, CaseStatus, Sev } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { inr } from '../lib/format.js';
import { Readiness, ScrutinyNote, readinessState } from './NoticeGate.jsx';
import { isIssue, DISPOSITION_LABEL } from '../engine/verify.js';
import { HEADS, BASIS, addHeads } from '../engine/heads.js';
import { noticeStage, drc01Text, amountKind } from '../engine/notices.js';
import { ISSUE_MODES, SCN_SECTIONS } from '../lib/caseEvents.js';

const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);
const dmy = (iso) => (iso ? iso.split('-').reverse().join('-') : '-');
const rs = (v) => Math.round(v || 0).toLocaleString('en-IN');
const HEAD_LABEL = { igst: 'IGST', cgst: 'CGST', sgst: 'SGST' };
// IGST, CGST and SGST are separate levies owed to different governments: a notice states each.
const headsText = (h) => HEADS.filter((k) => h?.[k]).map((k) => `${HEAD_LABEL[k]} ${inr(h[k], { compact: false })}`).join(', ');

export default function Notices({ data, cases, notices, saveNotice, issueNotice, remindNotice, requestApproval, decideApproval, viewer, setReadiness, selected, setSelected, user, toast }) {
  const cat = useMemo(() => Object.fromEntries(data.catalog.map((r) => [r.id, r])), [data.catalog]);
  const a = data.taxpayers.find((t) => t.id === selected) || data.taxpayers[0];
  const saved = notices[a.id];
  // Only discrepancies the officer has confirmed after verification can go into a notice (K-series meta checks never can).
  const disp = cases[a.id]?.dispositions || {};
  const candidates = a.results.filter((r) => isIssue(r) && disp[r.id]?.code === 'confirmed');
  const pending = a.results.filter((r) => r.status === 'Fail' || r.status === 'Review').sort((x, y) => (x.status === 'Fail' ? 0 : 1) - (y.status === 'Fail' ? 0 : 1) || y.exposure - x.exposure);
  const clean = ['G-01', 'G-02', 'B-01', 'B-07', 'B-08', 'D-01'].map((id) => a.results.find((r) => r.id === id && r.status === 'Pass')).filter(Boolean);
  const readiness = cases[a.id]?.readiness || {};
  const gate = readinessState(readiness);
  const setItem = (k, on, label, note) => setReadiness(a.id, k, on, label, note);

  const defaults = () => ({
    ref: `ASMT-10/${(user.workspace || 'ward').toUpperCase()}/${a.gstin.slice(2, 7)}/${today().replace(/-/g, '')}`,
    issued: today(), replyDays: 30, designation: user.role, items: candidates.map((r) => r.id), extra: '',
  });
  const [f, setF] = useState(saved || defaults());
  useEffect(() => { setF(notices[a.id] || defaults()); }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const due = addDays(f.issued || today(), Number(f.replyDays) || 30);
  const items = candidates.filter((r) => f.items.includes(r.id));
  const total = items.reduce((s, r) => s + r.exposure, 0);
  // Interest (J-01) and late fee (J-03) are not tax: they are totalled apart from it
  const taxItems = items.filter((r) => amountKind(r.id) === 'tax');
  const taxTotal = taxItems.reduce((s, r) => s + r.exposure, 0);
  const totalHeads = addHeads(...taxItems.map((r) => r.heads));
  const otherTotals = ['interest', 'late fee'].map((k) => [k, items.filter((r) => amountKind(r.id) === k).reduce((s, r) => s + r.exposure, 0)]).filter(([, v]) => v > 0);
  const amountLabel = (r) => ({ tax: 'Tax involved', interest: 'Interest involved', 'late fee': 'Late fee involved' }[amountKind(r.id)]);
  const bases = [...new Set(items.filter((r) => r.exposure > 0 && r.headsBasis).map((r) => r.headsBasis))];
  const basisNote = (basis) => `${items.filter((r) => r.exposure > 0 && r.headsBasis === basis).map((r) => r.id).join(', ')}: heads ${BASIS[basis]}.`;

  const text = [
    'FORM GST ASMT-10', '[See rule 99(1)]', '', `Reference No.: ${f.ref}`, `Date: ${dmy(f.issued)}`, '',
    `To: ${a.name}`, `GSTIN: ${a.gstin}`, `State: ${a.state}`, `Tax period: FY ${a.fy}`, '',
    'Sub.: Notice for intimating discrepancies in the return after scrutiny', '',
    `This is to inform you that during scrutiny of the returns filed by you for the tax period FY ${a.fy}, the following discrepancies have been noticed:`, '',
    ...items.map((r, i) => `${i + 1}. [${r.id}] ${cat[r.id]?.check} (${cat[r.id]?.legal}): ${r.finding}${r.exposure ? ` ${amountLabel(r)}: ${inr(r.exposure, { compact: false })}${r.heads ? ` (${headsText(r.heads)})` : ''}.` : ''}`),
    '', `Total tax involved (indicative): ${inr(taxTotal, { compact: false })}${taxTotal ? ` (${headsText(totalHeads)})` : ''}`,
    ...otherTotals.map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)} (indicative): ${inr(v, { compact: false })}`),
    ...(bases.length ? ['', ...bases.map(basisNote)] : []),
    ...(f.extra ? ['', f.extra] : []), '',
    `You are hereby directed to explain the reasons for the aforesaid discrepancies by ${dmy(due)}. If no explanation is received by the aforesaid date, it will be presumed that you have nothing to say in the matter and proceedings in accordance with law may be initiated against you without making any further reference to you in this regard.`,
    '', user.name, f.designation, `Jurisdiction: ${user.workspace}`, '', 'DRAFT: generated for review by the proper officer.',
  ].join('\n');

  const copy = async () => { try { await navigator.clipboard.writeText(text); toast('Notice text copied'); } catch { toast('Clipboard blocked: use Download instead'); } };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const el = document.createElement('a'); el.href = url; el.download = `ASMT-10_${a.gstin}_${f.issued}.txt`; el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const save = () => { if (!gate.finalReady) return; const refused = saveNotice(a.id, { ...f, due, total, heads: totalHeads, savedAt: new Date().toISOString() }); if (!refused) toast(`ASMT-10 draft saved for ${a.name}${saved?.approvals?.issue ? ': ask again for approval to issue' : ''}`); };
  const drafted = data.taxpayers.filter((t) => notices[t.id]);

  return (
    <div className="page">
      <PageHead title="Scrutiny note & ASMT-10" path={`POST /cases/${a.gstin}/notice · s.61 read with rule 99 · FY ${a.fy} · readiness ${gate.done}/${gate.total}`}>
        {!gate.draftReady && <button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> Print scrutiny note</button>}
        {gate.draftReady && (() => {
          const why = gate.finalReady ? undefined : 'Complete checklist item 10 (draft reviewed and fact-checked) first';
          return (<>
            <button className="btn" onClick={() => window.print()} disabled={!gate.finalReady} title={why}><Icon name="print" size={16} /> Print</button>
            <button className="btn" onClick={copy} disabled={!gate.finalReady} title={why}><Icon name="copy" size={16} /> Copy</button>
            <button className="btn" onClick={download} disabled={!gate.finalReady} title={why}><Icon name="download" size={16} /> .txt</button>
            <button className="btn primary" onClick={save} disabled={!items.length || !gate.finalReady} title={why}>{saved ? 'Update draft' : 'Save draft'}</button>
          </>);
        })()}
      </PageHead>


      <div className="grid g-main-side">
        <div className="stack">
          <Readiness key={a.id} readiness={readiness} setItem={setItem} />

          {!gate.draftReady && (
            <>
              <section className="card no-print gate">
                <Icon name="lock" size={22} />
                <h3>ASMT-10 drafting is locked: verification pending</h3>
                <p className="muted" style={{ margin: '0 auto', maxWidth: 560 }}>{gate.done} of {gate.total} readiness steps recorded. Until they are complete, work from the scrutiny note below: it lists each exception with the verification and evidence it needs. No notice, demand or reversal is proposed at this stage.</p>
              </section>
              <ScrutinyNote a={a} cat={cat} user={user} items={pending} clean={clean} disp={disp} />
            </>
          )}

          {gate.draftReady && (<>
          <section className="card no-print">
            <div className="card-head"><div><h3>Notice details</h3></div></div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="n-tp">Taxpayer<span className="req">*</span></label>
                <select id="n-tp" value={a.id} onChange={(e) => setSelected(e.target.value)}>
                  {data.taxpayers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="n-ref">reference_no</label>
                <input id="n-ref" className="mono-in" value={f.ref} onChange={(e) => set('ref', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="n-date">issue_date</label>
                <input id="n-date" type="date" value={f.issued} onChange={(e) => set('issued', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="n-days">reply_within_days</label>
                <input id="n-days" type="number" min="15" max="60" className="mono-in" value={f.replyDays} onChange={(e) => set('replyDays', e.target.value)} />
                <span className="help">Reply due {dmy(due)} (rule 99(2): 30 days, extendable)</span>
              </div>
              <div className="field">
                <label htmlFor="n-des">designation</label>
                <input id="n-des" value={f.designation} onChange={(e) => set('designation', e.target.value)} />
              </div>
            </div>

            <div className="panel mt">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div className="lbl">discrepancies<span className="req" style={{ color: 'var(--live)' }}>*</span></div>
                <span className="muted" style={{ fontSize: 12.5 }}>Discrepancies the officer has confirmed after verification</span>
                <span className={`chip ${items.length ? 'good' : 'bad'}`} style={{ marginLeft: 'auto' }}>{items.length ? <Icon name="check" size={13} stroke={2.6} /> : null}{items.length} · {inr(total)}</span>
              </div>
              {candidates.length === 0 && <div className="muted" style={{ padding: '10px 0' }}>No confirmed discrepancy on record: a notice is not indicated. Record outcomes under Taxpayer 360° → Rule findings.</div>}
            {a.results.some((r) => isIssue(r) && disp[r.id] && disp[r.id].code !== 'confirmed') && <div className="muted" style={{ fontSize: 12.5, padding: '6px 0 0' }}>Not eligible: {a.results.filter((r) => isIssue(r) && disp[r.id] && disp[r.id].code !== 'confirmed').map((r) => `${r.id} (${DISPOSITION_LABEL[disp[r.id].code].toLowerCase()})`).join(', ')}.</div>}
              {candidates.map((r) => {
                const on = f.items.includes(r.id);
                return (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '38px 72px minmax(0,1fr) 120px', gap: 12, alignItems: 'center', background: '#fff', borderRadius: 14, padding: '10px 14px', marginTop: 8, opacity: on ? 1 : 0.55 }}>
                    <button className={`switch ${on ? 'on' : ''}`} aria-pressed={on} aria-label={`Include ${r.id}`} onClick={() => set('items', on ? f.items.filter((x) => x !== r.id) : [...f.items, r.id])} />
                    <span className="mono" style={{ color: 'var(--brand-ink)' }}>{r.id}</span>
                    <span style={{ minWidth: 0 }}><b style={{ fontWeight: 600 }}>{cat[r.id]?.check}</b> <Sev s={cat[r.id]?.severity || 'Med'} /><div className="muted" style={{ fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.finding}</div></span>
                    <span className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>{r.exposure ? inr(r.exposure) : '-'}</span>
                  </div>
                );
              })}
            </div>

            <div className="field mt">
              <label htmlFor="n-extra">additional_remarks</label>
              <textarea id="n-extra" rows={3} placeholder="e.g. Please furnish the purchase register and reconciliation with GSTR-2B for the periods listed." value={f.extra} onChange={(e) => set('extra', e.target.value)} />
            </div>
          </section>

          <article className="doc">
            <span className="draft">DRAFT</span>
            <div className="form-id">FORM GST ASMT-10</div>
            <div className="form-sub">[See rule 99(1)]</div>
            <div className="meta">
              <div><b>Reference No.:</b> <span className="mono">{f.ref}</span></div><div style={{ textAlign: 'right' }}><b>Date:</b> {dmy(f.issued)}</div>
              <div><b>To:</b> {a.name}</div><div style={{ textAlign: 'right' }}><b>GSTIN:</b> <span className="mono">{a.gstin}</span></div>
              <div><b>State:</b> {a.state}</div><div style={{ textAlign: 'right' }}><b>Tax period:</b> FY {a.fy}</div>
            </div>
            <p><b>Sub.: Notice for intimating discrepancies in the return after scrutiny</b></p>
            <p>This is to inform you that during scrutiny of the returns filed by you for the tax period FY {a.fy}, the following discrepancies have been noticed:</p>
            <table>
              <thead><tr><th>#</th><th>Discrepancy</th><th>Provision</th><th>Details</th>{HEADS.map((k) => <th key={k} className="num">{HEAD_LABEL[k]} (₹)</th>)}<th className="num">Total (₹)</th></tr></thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id}><td>{i + 1}</td><td><b>{cat[r.id]?.check}</b><div className="mono" style={{ fontSize: 11, color: '#54607a' }}>{r.id}</div></td><td>{cat[r.id]?.legal}</td><td>{r.finding}</td>
                    {HEADS.map((k) => <td key={k} className="num">{r.exposure ? rs(r.heads?.[k]) : '-'}</td>)}<td className="num">{r.exposure ? rs(r.exposure) : '-'}</td></tr>
                ))}
                <tr><td colSpan={4} style={{ textAlign: 'right' }}><b>Tax (indicative)</b></td>{HEADS.map((k) => <td key={k} className="num"><b>{rs(totalHeads[k])}</b></td>)}<td className="num"><b>{rs(taxTotal)}</b></td></tr>
                {otherTotals.map(([k, v]) => <tr key={k}><td colSpan={7} style={{ textAlign: 'right' }}>{k[0].toUpperCase()}{k.slice(1)} (indicative, not tax)</td><td className="num">{rs(v)}</td></tr>)}
              </tbody>
            </table>
            {bases.length > 0 && <p style={{ fontSize: 11.5, color: '#54607a' }}>{bases.map(basisNote).join(' ')}</p>}
            {f.extra && <p>{f.extra}</p>}
            <p>You are hereby directed to explain the reasons for the aforesaid discrepancies by <b>{dmy(due)}</b>. If no explanation is received by the aforesaid date, it will be presumed that you have nothing to say in the matter and proceedings in accordance with law may be initiated against you without making any further reference to you in this regard.</p>
            <div className="sig"><div>Signature ____________________</div><div style={{ marginTop: 6 }}><b>{user.name}</b></div><div>{f.designation}</div><div className="mono" style={{ fontSize: 12 }}>{user.workspace}</div></div>
          </article>
          </>)}
        </div>

        <div className="stack no-print">
          {saved && <NoticeTracking a={a} notice={saved} caseInfo={cases[a.id] || {}} items={candidates.filter((r) => saved.items.includes(r.id))} cat={cat} user={user}
            viewer={viewer} onIssue={(x) => issueNotice(a.id, x)} onRemind={(x) => remindNotice(a.id, x)} onAsk={(stage, x) => requestApproval(a.id, stage, x)} onDecide={(stage, d, n) => decideApproval(a.id, stage, d, n)} toast={toast} />}
          <section className="card">
            <div className="eyebrow">Case</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginTop: 10 }}>{a.name}</div>
            <div className="mono muted" style={{ fontSize: 12, marginTop: 3 }}>{a.gstin}</div>
            <div style={{ marginTop: 12 }}><CaseStatus status={cases[a.id]?.status || 'New'} /></div>
            <div className="note" style={{ marginTop: 14 }}>The draft can be saved only after all {gate.total + 1} readiness steps. Saving moves the case to <b>ASMT-10 drafted</b> and logs it in the case history. The console never sends, signs or finalises a notice.</div>
          </section>
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}><div className="eyebrow">Drafted notices</div><span className="mono muted" style={{ marginLeft: 'auto', fontSize: 11.5 }}>{drafted.length} saved</span></div>
            {drafted.length === 0 && <div className="muted" style={{ marginTop: 12 }}>None yet.</div>}
            {drafted.map((t) => (
              <button key={t.id} className="panel" onClick={() => setSelected(t.id)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, marginTop: 10, outline: t.id === a.id ? '2px solid var(--brand)' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className="chip brand">{notices[t.id].items.length} items</span><b style={{ fontWeight: 600 }}>{t.name.slice(0, 22)}</b></div>
                <div className="mono muted" style={{ fontSize: 11.5, marginTop: 8 }}>reply_due: {dmy(notices[t.id].due)} · {inr(notices[t.id].total)}</div>
              </button>
            ))}
          </section>
          <div className="callout">
            <Icon name="alert" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>Amounts are system computations from returns data only, not confirmed liabilities. Verify each item against books and the taxpayer's explanation before issue. If the reply is found acceptable, close with ASMT-12; otherwise proceed under s.73 / 74 / 74A.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGE_LABEL = {
  drafted: 'Drafted: not yet sent for approval', approval: 'Awaiting a second officer\'s approval to issue', returned: 'Returned for changes', approved: 'Approved for issue',
  awaiting: 'Issued: awaiting reply', overdue: 'Reply overdue', replied: 'Reply received', 'escalation-pending': 'Escalation awaiting approval', escalated: 'Escalated to DRC-01', closed: 'Case closed',
};
const isRequester = (viewer, a) => (viewer?.id && a?.requestedById ? viewer.id === a.requestedById : String(viewer?.name || '').trim().toLowerCase() === String(a?.requestedBy || '').trim().toLowerCase());

// The checker's side of a pending request: approve, or return with a reason. Never offered to the officer who asked.
function Decide({ request, viewer, onDecide, what, toast }) {
  const [note, setNote] = useState('');
  if (isRequester(viewer, request)) return <div className="muted small" style={{ marginTop: 6 }}>You asked for this approval: another officer with approval rights decides it.</div>;
  if (!viewer?.canApprove) return <div className="muted small" style={{ marginTop: 6 }}>A supervisor or Commissioner decides it.</div>;
  const decide = (decision) => {
    if (decision === 'return' && !note.trim()) return toast('Returning needs a reason for the officer');
    const refused = onDecide(decision, note.trim());
    if (!refused) toast(decision === 'approve' ? `${what} approved` : 'Returned to the officer with your reason');
    return undefined;
  };
  return (
    <div className="track-form">
      <b>Your decision (maker-checker)</b>
      <label>Note to the officer<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Required to return; optional to approve" /></label>
      <div style={{ display: 'flex', gap: 6 }}><button type="button" className="btn small primary" onClick={() => decide('approve')}>Approve</button><button type="button" className="btn small" onClick={() => decide('return')}>Return</button></div>
    </div>
  );
}

// After the draft: approval to issue (maker-checker), the issue itself (made outside this platform, recorded here),
// reminders, and escalation to a DRC-01 summary, again only with a second officer's approval. Each step is a case
// event: logged with the officer's name, checked against the case as it stands (guardEvent), and feeding the queue.
function NoticeTracking({ a, notice, caseInfo, items, cat, user, viewer, onIssue, onRemind, onAsk, onDecide, toast }) {
  const st = noticeStage(notice, caseInfo, today());
  const [issue, setIssue] = useState({ ref: notice.ref, issued: today(), mode: ISSUE_MODES[0], replyDue: notice.due });
  const [rem, setRem] = useState({ sent: today(), mode: ISSUE_MODES[1], note: '' });
  const [esc, setEsc] = useState({ section: Number(String(a.fy).slice(0, 4)) >= 2024 ? '74A' : '73', reason: '' });
  const [askNote, setAskNote] = useState('');
  const approvals = notice.approvals || {};
  const drc = notice.escalation ? drc01Text({ a, notice, items, cat, section: notice.escalation.section, reason: notice.escalation.reason, officer: { name: user.name, designation: user.role, jurisdiction: user.workspace }, today: notice.escalation.at.slice(0, 10) }) : null;
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('DRC-01 text copied'); } catch { toast('Clipboard blocked: use Download'); } };
  const download = (t) => { const url = URL.createObjectURL(new Blob([t], { type: 'text/plain;charset=utf-8' })); const el = document.createElement('a'); el.href = url; el.download = `DRC-01_${a.gstin}.txt`; el.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const done = (refused, ok) => { if (!refused) toast(ok); };
  const trail = (x, label) => x && (
    <div className="muted small">{label}: asked by {x.requestedBy} {dmy(x.requestedAt.slice(0, 10))}{x.note ? ` (${x.note})` : ''}{x.decidedBy ? ` · ${x.status === 'approved' ? 'approved' : 'returned'} by ${x.decidedBy} ${dmy(x.decidedAt.slice(0, 10))}${x.decisionNote ? `: ${x.decisionNote}` : ''}` : ''}</div>
  );
  return (
    <section className="card">
      <div className="eyebrow">Notice tracking</div>
      <div style={{ fontWeight: 600, marginTop: 8 }}>{STAGE_LABEL[st.stage]}{st.stage === 'awaiting' ? ` · ${st.days} day${st.days === 1 ? '' : 's'} left` : st.stage === 'overdue' ? ` · ${st.days} day${st.days === 1 ? '' : 's'} late` : ''}</div>
      {trail(approvals.issue, 'Issue')}
      {notice.issue && <div className="muted small" style={{ marginTop: 4 }}>{notice.issue.ref} · {notice.issue.mode} · issued {dmy(notice.issue.issued)} · reply due {dmy(notice.issue.replyDue)}</div>}
      {(notice.reminders || []).map((r, i) => <div key={i} className="muted small">Reminder {dmy(r.sent)} · {r.mode}{r.note ? `: ${r.note}` : ''}</div>)}
      {trail(approvals.escalate, `Escalation under s.${approvals.escalate?.section}`)}
      {st.stage === 'replied' && <div className="small" style={{ marginTop: 6 }}>Reply received {dmy(st.reply.received)}{st.reply.ref ? ` (${st.reply.ref})` : ''}: review it, then close the case or ask to escalate.</div>}

      {(st.stage === 'drafted' || st.stage === 'returned') && (
        <form className="track-form" onSubmit={(e) => { e.preventDefault(); done(onAsk('issue', askNote.trim() ? { note: askNote.trim() } : {}), 'Sent for approval: a second officer approves or returns it'); setAskNote(''); }}>
          <b>{st.stage === 'returned' ? 'Ask again for approval to issue' : 'Ask for approval to issue'}</b>
          <div className="small muted">A second officer with approval rights checks the draft before it is issued. Changing the draft afterwards needs a fresh approval.</div>
          <label>Note for the approving officer<input value={askNote} onChange={(e) => setAskNote(e.target.value)} placeholder="optional" /></label>
          <button className="btn small primary">Send for approval</button>
        </form>
      )}
      {st.stage === 'approval' && <Decide request={st.approval} viewer={viewer} what="Issue" toast={toast} onDecide={(d, n) => onDecide('issue', d, n)} />}
      {st.stage === 'approved' && (
        <form className="track-form" onSubmit={(e) => { e.preventDefault(); done(onIssue(issue), 'Issue recorded: the reply deadline is now tracked'); }}>
          <b>Record the issue</b>
          <label>Reference as issued<input value={issue.ref} onChange={(e) => setIssue({ ...issue, ref: e.target.value })} required /></label>
          <label>Issued on<input type="date" value={issue.issued} onChange={(e) => setIssue({ ...issue, issued: e.target.value })} required /></label>
          <label>How<select value={issue.mode} onChange={(e) => setIssue({ ...issue, mode: e.target.value })}>{ISSUE_MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label>Reply due<input type="date" value={issue.replyDue} onChange={(e) => setIssue({ ...issue, replyDue: e.target.value })} required /></label>
          <button className="btn small primary">Record issue</button>
        </form>
      )}
      {notice.issue && !notice.escalation && st.stage !== 'closed' && (
        <form className="track-form" onSubmit={(e) => { e.preventDefault(); done(onRemind(rem), 'Reminder recorded'); setRem({ ...rem, note: '' }); }}>
          <b>Record a reminder</b>
          <label>Sent on<input type="date" value={rem.sent} onChange={(e) => setRem({ ...rem, sent: e.target.value })} required /></label>
          <label>How<select value={rem.mode} onChange={(e) => setRem({ ...rem, mode: e.target.value })}>{ISSUE_MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label>Note<input value={rem.note} onChange={(e) => setRem({ ...rem, note: e.target.value })} placeholder="optional" /></label>
          <button className="btn small">Record reminder</button>
        </form>
      )}
      {st.stage === 'escalation-pending' && <Decide request={st.approval} viewer={viewer} what="Escalation" toast={toast} onDecide={(d, n) => onDecide('escalate', d, n)} />}
      {notice.issue && !notice.escalation && !['closed', 'escalation-pending'].includes(st.stage) && (
        <form className="track-form" onSubmit={(e) => { e.preventDefault(); if (!esc.reason.trim()) return; done(onAsk('escalate', { section: esc.section, reason: esc.reason.trim() }), 'Escalation sent for approval'); }}>
          <b>Ask to escalate to a show cause notice</b>
          <label>Section<select value={esc.section} onChange={(e) => setEsc({ ...esc, section: e.target.value })}>{SCN_SECTIONS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>Reason<textarea rows={2} value={esc.reason} onChange={(e) => setEsc({ ...esc, reason: e.target.value })} placeholder="e.g. No reply by the due date despite a reminder" required /></label>
          <button className="btn small">Send for approval</button>
        </form>
      )}
      {drc && (
        <div className="track-form">
          <b>DRC-01 summary (draft)</b>
          <pre className="drc-text">{drc}</pre>
          <div style={{ display: 'flex', gap: 6 }}><button className="btn small" onClick={() => copy(drc)}>Copy</button><button className="btn small" onClick={() => download(drc)}>Download .txt</button></div>
        </div>
      )}
    </section>
  );
}
