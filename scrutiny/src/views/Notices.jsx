import React, { useEffect, useMemo, useState } from 'react';
import { PageHead, CaseStatus, Sev } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { inr } from '../lib/format.js';
import { Readiness, ScrutinyNote, readinessState } from './NoticeGate.jsx';
import { isIssue, DISPOSITION_LABEL } from '../engine/verify.js';

const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const today = () => new Date().toISOString().slice(0, 10);
const dmy = (iso) => (iso ? iso.split('-').reverse().join('-') : '-');

export default function Notices({ data, cases, notices, saveNotice, setReadiness, selected, setSelected, user, toast }) {
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

  const text = [
    'FORM GST ASMT-10', '[See rule 99(1)]', '', `Reference No.: ${f.ref}`, `Date: ${dmy(f.issued)}`, '',
    `To: ${a.name}`, `GSTIN: ${a.gstin}`, `State: ${a.state}`, `Tax period: FY ${a.fy}`, '',
    'Sub.: Notice for intimating discrepancies in the return after scrutiny', '',
    `This is to inform you that during scrutiny of the returns filed by you for the tax period FY ${a.fy}, the following discrepancies have been noticed:`, '',
    ...items.map((r, i) => `${i + 1}. [${r.id}] ${cat[r.id]?.check} (${cat[r.id]?.legal}): ${r.finding}${r.exposure ? ` Tax involved: ${inr(r.exposure, { compact: false })}.` : ''}`),
    '', `Total tax involved (indicative): ${inr(total, { compact: false })}`,
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
  const save = () => { if (!gate.finalReady) return; saveNotice(a.id, { ...f, due, total, savedAt: new Date().toISOString() }); toast(`ASMT-10 draft saved for ${a.name}`); };
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
              <thead><tr><th>#</th><th>Discrepancy</th><th>Provision</th><th>Details</th><th className="num">Tax involved (₹)</th></tr></thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id}><td>{i + 1}</td><td><b>{cat[r.id]?.check}</b><div className="mono" style={{ fontSize: 11, color: '#54607a' }}>{r.id}</div></td><td>{cat[r.id]?.legal}</td><td>{r.finding}</td><td className="num">{r.exposure ? Math.round(r.exposure).toLocaleString('en-IN') : '-'}</td></tr>
                ))}
                <tr><td colSpan={4} style={{ textAlign: 'right' }}><b>Total (indicative)</b></td><td className="num"><b>{Math.round(total).toLocaleString('en-IN')}</b></td></tr>
              </tbody>
            </table>
            {f.extra && <p>{f.extra}</p>}
            <p>You are hereby directed to explain the reasons for the aforesaid discrepancies by <b>{dmy(due)}</b>. If no explanation is received by the aforesaid date, it will be presumed that you have nothing to say in the matter and proceedings in accordance with law may be initiated against you without making any further reference to you in this regard.</p>
            <div className="sig"><div>Signature ____________________</div><div style={{ marginTop: 6 }}><b>{user.name}</b></div><div>{f.designation}</div><div className="mono" style={{ fontSize: 12 }}>{user.workspace}</div></div>
          </article>
          </>)}
        </div>

        <div className="stack no-print">
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
