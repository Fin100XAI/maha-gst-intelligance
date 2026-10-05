// Upload data: every file the platform reads, in one place, as three numbered steps (returns files, registers,
// reply letters), each with a few lines of instructions, plus the sample files and format guide.
import React, { useMemo, useRef, useState } from 'react';
import { Card, Band, PageHead, TestTag } from '../components/ui.jsx';
import { isTestData } from '../engine/names.js';
import { changeText } from '../lib/uploads.js';
import Icon from '../components/Icon.jsx';
import { RegisterList } from '../components/RegistersCard.jsx';
import Staging from '../components/Staging.jsx';
import { ReplyForm } from './Eiu.jsx';
import { REGISTERS } from '../engine/registers.js';
import { sampleUrl, SAMPLE_GUIDE, SAMPLE_RETURNS, SAMPLE_REGISTER, SAMPLE_LETTER } from '../lib/samples.js';
import { inr, int } from '../lib/format.js';

function Step({ n, title, lead, points, status, children, tour }) {
  return (
    <section className="card up-step" data-tour={tour} aria-labelledby={`up-step-${n}`}>
      <div className="up-num" aria-hidden="true">{n}</div>
      <div className="up-body">
        <div className="up-head"><h3 id={`up-step-${n}`}>{title}</h3>{status}</div>
        <p className="up-lead">{lead}</p>
        <ul className="up-points">{points.map((p) => <li key={p}>{p}</li>)}</ul>
        {children}
      </div>
    </section>
  );
}

export default function DataMethod({ data, onFiles, busy, uploadProgress, uploads, retryAnalysis, openTaxpayer, openReport, cfg, registers, onRegisterUpload, cases, dispatch, toast, go }) {
  const years = Object.values(data.baselines || {}).reduce((s, b) => s + b.length, 0) || data.taxpayers.length;
  const regLoaded = registers ? Object.keys(REGISTERS).filter((t) => registers[t]).length : 0;
  // Files chosen but not yet confirmed: the staging step shows what was understood before anything is analysed
  const [staged, setStaged] = useState(null);
  return (
    <div className="page">
      <PageHead title="Upload data" path={`${int(data.taxpayers.length)} taxpayers · ${int(years)} returns files · ${regLoaded} of ${Object.keys(REGISTERS).length} registers loaded`} />

      <div className="note">Three kinds of file feed the platform. Each file is checked before it is saved, and uploads add to what is already loaded: nothing already saved is removed, and a file that fails changes nothing.</div>

      <Step n={1} tour="upload-returns" title="Returns files"
        lead="The “Get Download All Report” Excel export: one file per taxpayer per financial year."
        points={['Upload the file as exported. Do not rename its sheets or columns.', 'Choose several files at once if you like. A second file for the same taxpayer and year replaces the first, which is kept.', 'Excel (.xlsx), up to 40 MB each.']}
        status={<span className="chip good">{int(data.taxpayers.length)} taxpayers loaded</span>}>
        {staged
          ? <Staging files={staged} data={data} onCancel={() => setStaged(null)} onConfirm={(items) => { setStaged(null); onFiles(items); }} />
          : <ReturnsDrop onFiles={(files) => files.length && setStaged(files)} busy={busy} progress={uploadProgress} />}
        <UploadReport batch={uploads?.batches?.[0]} data={data} busy={busy} onRetry={retryAnalysis} openTaxpayer={openTaxpayer} />
        <details className="up-more">
          <summary>Show loaded taxpayers</summary>
          <Loaded data={data} openTaxpayer={openTaxpayer} openReport={openReport} />
        </details>
      </Step>

      <Step n={2} tour="upload-registers" title="Registers"
        lead="Five lists covering the whole jurisdiction. Upload each one on its own row."
        points={['Start from the template: column names in row 1. CSV or Excel.', 'An upload adds its rows: new rows are added, a row for the same GSTIN or ID is updated, and every row already saved stays. The previous version is also kept.', 'Every row is checked. If anything is wrong, nothing is saved and every problem is listed.']}
        status={<span className={`chip ${regLoaded === Object.keys(REGISTERS).length ? 'good' : ''}`}>{regLoaded} of {Object.keys(REGISTERS).length} loaded</span>}>
        <div className="up-registers"><RegisterList registers={registers} onUpload={onRegisterUpload} /></div>
      </Step>

      <Step n={3} tour="upload-replies" title="Reply letters"
        lead="The taxpayer’s or CA’s written reply to an EIU signal. Optional."
        points={['Choose the signal, then attach the letter: PDF, Word (.docx) or text, up to 15 MB.', 'Check the text read from the letter, correct it if needed, then record it.', 'Each statement in it is tested against the returns. See the result under EIU signals.']}
        status={<RepliesStatus registers={registers} cases={cases} />}>
        <ReplyUpload registers={registers} cases={cases} dispatch={dispatch} toast={toast} go={go} />
      </Step>

      <Card className="mt" title="Sample files and format guide" sub="Invented examples of every file, in the exact format, with a guide to every sheet and column. Share them with whoever prepares the files.">
        <ul className="up-samples">
          <li><a href={sampleUrl(SAMPLE_GUIDE)} download><Icon name="download" size={14} /> Format guide</a><span className="muted small">what each file, sheet and column must contain</span></li>
          <li><a href={sampleUrl(SAMPLE_RETURNS)} download><Icon name="download" size={14} /> Returns file</a><span className="muted small">one taxpayer, one year, all 37 sheets</span></li>
          {Object.keys(REGISTERS).map((t) => <li key={t}><a href={sampleUrl(SAMPLE_REGISTER(t))} download><Icon name="download" size={14} /> {REGISTERS[t].title}</a><span className="muted small">register, ready to upload</span></li>)}
          <li><a href={sampleUrl(SAMPLE_LETTER)} download><Icon name="download" size={14} /> Reply letter</a><span className="muted small">PDF</span></li>
        </ul>
      </Card>

      <details className="card mt up-method">
        <summary><b>How the data is analysed</b><span className="muted small"> · reconciliation logic, risk indicators, score and limits</span></summary>
        <Method data={data} cfg={cfg} />
      </details>
    </div>
  );
}

// progress: { stage: 'upload' | 'analyse', done, total } while a batch is being saved and then analysed
function ReturnsDrop({ onFiles, busy, progress }) {
  const [hot, setHot] = useState(false);
  const input = useRef(null);
  const drop = (e) => { e.preventDefault(); setHot(false); onFiles([...e.dataTransfer.files]); };
  const text = !busy ? 'Drop returns files here'
    : progress?.stage === 'upload' ? `Saving files · ${int(progress.done)} of ${int(progress.total)}`
      : progress?.stage === 'analyse' ? (progress.total ? `Analysing returns · ${int(progress.done)} of ${int(progress.total)}` : 'Analysing returns…')
        : 'Saving and analysing…';
  const share = progress?.total ? progress.done / progress.total : 0;
  return (
    <div className={`drop ${hot ? 'hot' : ''}`} onDragOver={(e) => { e.preventDefault(); setHot(true); }} onDragLeave={() => setHot(false)} onDrop={drop}>
      <Icon name="upload" size={26} />
      <div style={{ fontWeight: 600, marginTop: 4 }}>{text}</div>
      {busy && progress && (
        <div className="kpi" style={{ padding: 0, margin: '8px auto 0', maxWidth: 360 }}><div className="bar" style={{ marginTop: 0 }}><i style={{ width: `${Math.max(2, share * 100)}%`, background: 'var(--brand)', transition: 'width .5s' }} /></div></div>
      )}
      <div className="muted" style={{ margin: '4px 0 12px' }}>or</div>
      <button className="btn primary" onClick={() => input.current?.click()} disabled={busy}>Choose files</button>
      <input ref={input} type="file" accept=".xlsx" multiple hidden onChange={(e) => { onFiles([...e.target.files]); e.target.value = ''; }} />
    </div>
  );
}

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const fyShort = (fy) => String(fy || '').replace(/^(\d{4})-\d{2}(\d{2})$/, '$1-$2');


// The latest upload, as the platform saw it: files received, files accepted, analysis finished, and what the
// analysis found for each taxpayer in it. Kept on the server (upload log), so it is still here after a reload.
export function UploadReport({ batch, data, busy, onRetry, openTaxpayer }) {
  if (!batch?.files?.length) return null;
  const accepted = batch.files.filter((f) => f.ok), rejected = batch.files.filter((f) => !f.ok);
  const a = batch.analysis || {};
  const done = a.stage === 'done', failed = a.stage === 'error', running = !done && !failed && accepted.length > 0;
  const inProgress = running && (busy || a.stage === 'running');
  const cat = Object.fromEntries((data.catalog || []).map((r) => [r.id, r]));
  const groups = [...accepted.reduce((m, f) => { const g = m.get(f.gstin) || { gstin: f.gstin, name: f.taxpayer, fys: [], replaced: 0 }; g.fys.push(f.fy); g.replaced += f.replaced || 0; return m.set(f.gstin, g); }, new Map()).values()];
  const step = (ok, label, text) => (
    <div className={`upr-step ${ok === true ? 'ok' : ok === false ? 'bad' : 'wait'}`}>
      <span className="upr-dot" aria-hidden="true">{ok === true ? '✓' : ok === false ? '!' : '…'}</span>
      <div><b>{label}</b><div className="muted small">{text}</div></div>
    </div>
  );
  return (
    <div className="upr card mt" aria-live="polite">
      <div className="upr-head">
        <b>Latest upload</b>
        <span className="muted small">{when(batch.startedAt)} · {batch.files.length} file{batch.files.length === 1 ? '' : 's'}</span>
      </div>
      <div className="upr-steps">
        {step(true, '1 · Received', `${batch.files.length} file${batch.files.length === 1 ? '' : 's'} reached the server`)}
        {step(rejected.length ? (accepted.length ? null : false) : true, '2 · Checked and saved', `${accepted.length} accepted${rejected.length ? `, ${rejected.length} not accepted` : ''}${groups.some((g) => g.replaced) ? ' · earlier copies of the same years kept aside' : ''}`)}
        {step(done ? true : failed ? false : null, '3 · Analysed', done ? `finished ${when(a.finishedAt)} · the dashboard includes this upload` : failed ? 'did not finish: the files are saved; try again' : running ? (inProgress ? 'in progress… (progress bar above)' : 'waiting to run') : 'nothing to analyse')}
      </div>
      {failed && (
        <div className="upr-error" role="alert">
          <b>The analysis stopped:</b> {a.error || 'no reason given'}
          {a.detail && <details><summary>Details for the administrator</summary><pre>{a.detail}</pre></details>}
          <div><button className="btn small primary" disabled={busy} onClick={() => onRetry(batch.id)}>Try the analysis again</button></div>
        </div>
      )}
      {!inProgress && running && <div className="upr-note">The analysis has not finished yet. <button className="btn small" onClick={() => onRetry(batch.id)}>Run the analysis now</button></div>}
      {rejected.length > 0 && (
        <ul className="upr-rejected">{rejected.map((f, i) => <li key={i}><b>{f.name}</b>: {f.error}</li>)}</ul>
      )}
      {a.failed?.length > 0 && (
        <ul className="upr-rejected">{a.failed.map((f, i) => <li key={i}><b>{f.file || 'A workbook'}</b> could not be analysed: {f.error}</li>)}</ul>
      )}
      {groups.length > 0 && (
        <div className="tbl-wrap" style={{ maxHeight: 420 }}>
          <table className="tbl">
            <thead><tr><th>Taxpayer</th><th>Years uploaded</th><th>Risk (latest year)</th><th>Failed checks</th><th>Main findings</th><th>Since the last run</th><th /></tr></thead>
            <tbody>
              {groups.map((g) => {
                const t = done ? data.taxpayers.find((x) => x.gstin === g.gstin) : null;
                const fails = t ? t.results.filter((r) => r.status === 'Fail').sort((x, y) => y.exposure - x.exposure) : [];
                // what to look at first: failed checks by amount, then raised risk indicators
                const findings = t ? [...fails.map((r) => `${r.id} ${cat[r.id]?.check || ''}`.trim()), ...t.fraud.filter((f) => f.flagged && !f.prompt).sort((x, y) => y.weight - x.weight).map((f) => f.label)].slice(0, 3) : [];
                return (
                  <tr key={g.gstin} className={t ? 'click' : ''} onClick={() => t && openTaxpayer(t.id)}>
                    <td><b>{t?.name || g.name || g.gstin}</b>{isTestData(g.gstin, t?.fileName) && <> <TestTag /></>}<div className="muted" style={{ fontSize: 11 }}>{g.gstin}</div></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{[...new Set(g.fys)].sort().map((fy) => `FY ${fyShort(fy)}`).join(', ')}</td>
                    <td>{t ? <><Band band={t.band} score={t.score} /><div className="muted" style={{ fontSize: 11 }}>FY {fyShort(t.fy)}</div></> : <span className="muted small">{failed ? 'not analysed' : 'analysing…'}</span>}</td>
                    <td>{t ? int(fails.length) : ''}</td>
                    <td style={{ fontSize: 12 }}>{t ? (findings.length ? findings.join(' · ') : 'no failed checks or risk indicators') : ''}</td>
                    <td style={{ fontSize: 12 }}>{done ? changeText(a.changes?.find((c) => c.gstin === g.gstin)) : ''}</td>
                    <td>{t && <button className="btn small soft" onClick={(e) => { e.stopPropagation(); openTaxpayer(t.id); }}>Open</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Loaded({ data, openTaxpayer, openReport }) {
  return (
    <div className="tbl-wrap" style={{ maxHeight: 320 }}>
      <table className="tbl">
        <thead><tr><th>Taxpayer</th><th>Source file</th><th>Years</th><th>Periods</th><th>Risk</th><th /></tr></thead>
        <tbody>
          {data.taxpayers.map((a) => (
            <tr key={a.uid || a.id} className="click" onClick={() => openTaxpayer(a.id)}>
              <td><b>{a.name}</b>{isTestData(a.gstin, a.fileName) && <> <TestTag /></>}<div className="muted" style={{ fontSize: 11 }}>{a.gstin}</div></td>
              <td style={{ fontSize: 11.5, wordBreak: 'break-all' }}>{a.fileName}</td>
              <td style={{ whiteSpace: 'nowrap' }} title="Financial years loaded for this GSTIN (the latest drives the screens)">{(data.baselines?.[a.gstin] || [{ fy: a.fy }]).map((b) => `FY ${String(b.fy).replace(/^(\d{4})-\d{2}(\d{2})$/, '$1-$2')}`).join(', ')}</td>
              <td>{a.profile.periodsFiled} · {a.filing.split(' ')[0]}</td>
              <td><Band band={a.band} score={a.score} /></td>
              <td><button className="btn small soft" onClick={(e) => { e.stopPropagation(); openReport(a.id); }}>Report</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const repliesOf = (cases, s) => cases?.[s.gstin]?.eiu?.[s.signalId]?.replies?.length || 0;

function RepliesStatus({ registers, cases }) {
  const signals = registers?.eiu?.records || [];
  if (!signals.length) return <span className="chip">no signals loaded</span>;
  const n = signals.filter((s) => repliesOf(cases, s)).length;
  return <span className={`chip ${n ? 'good' : ''}`}>{n} of {signals.length} signals have a reply</span>;
}

function ReplyUpload({ registers, cases, dispatch, toast, go }) {
  const signals = useMemo(() => [...(registers?.eiu?.records || [])].sort((a, b) => repliesOf(cases, a) - repliesOf(cases, b) || a.signalId.localeCompare(b.signalId)), [registers, cases]);
  const [id, setId] = useState('');
  const sig = signals.find((s) => s.signalId === id) || null;
  if (!signals.length) return <div className="note">Load the EIU risk signals register in step 2 first. Each reply belongs to one signal.</div>;
  return (
    <div className="up-reply">
      <label className="field up-signal"><span>Signal</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Choose the signal this reply answers…</option>
          {signals.map((s) => <option key={s.signalId} value={s.signalId}>{s.signalId} · {s.gstin} · {s.parameter}{repliesOf(cases, s) ? ` (${repliesOf(cases, s)} recorded)` : ''}</option>)}
        </select>
      </label>
      {sig && (
        <>
          <div className="muted small up-sig">FY {sig.fy} · {inr(sig.amount)} signalled on {sig.signalDate} · <button className="link-btn small" onClick={() => go('eiu', sig.signalId)}>Open in EIU signals</button></div>
          <ReplyForm key={sig.signalId} sig={sig} dispatch={dispatch} toast={toast} />
        </>
      )}
    </div>
  );
}

function Method({ data, cfg }) {
  return (
    <div className="grid g-3 mt">
      <div className="panel">
        <b>Reconciliation logic</b>
        <ul className="up-method-list">
          <li>Every GSTR-1 / 2A / 2B month is mapped to the GSTR-3B period that covers it, so monthly and QRMP filers reconcile on the same basis.</li>
          <li><b>GSTR-1 tax</b> = B2B (excl. reverse-charge tax) + B2CL + B2CS + debit notes − credit notes.</li>
          <li><b>3B ITC claim</b> = 4A(4) + 4A(5) − 4B(2); <b>2B eligible</b> = B2B lines with ITC available and no RCM + ISD ± supplier CDNR.</li>
          <li><b>Filing date</b> = first liability-ledger debit for the period; due date 20th (monthly) / 22nd (QRMP, Category-I states).</li>
          <li>Interest @18% p.a. on cash-discharged tax × delay days; late fee ₹50/day (₹20 nil), capped.</li>
        </ul>
      </div>
      <div className="panel">
        <b>Risk indicators</b>
        <ul className="up-method-list">
          <li><b>Circular trading</b>: same GSTIN as customer and supplier; flag when mirrored value &gt; 5% of sales.</li>
          <li><b>Benford</b>: first-digit MAD (Nigrini 2012), flag &gt; 0.015 with n ≥ 300.</li>
          <li><b>Supplier non-filing</b>: 2A lines where the supplier's 3B is not filed; flag &gt; 5% of ITC.</li>
          <li>Round figures, e-way-bill threshold splitting, turnover spikes, ITC accumulation, year-end credit notes, duplicate invoices, tax arithmetic, Sunday invoicing.</li>
          <li>Indicators are <b>signals for enquiry</b>, not proof of intent (s.74A requires fraud/suppression to be established).</li>
        </ul>
      </div>
      <div className="panel">
        <b>Risk score &amp; limits</b>
        <ul className="up-method-list">
          <li>Score = Σ failed checks (High {cfg.fail.High} · Med {cfg.fail.Med} · Low {cfg.fail.Low}) + {Math.round(cfg.reviewFactor * 100)}% of that for review items + {cfg.fraudWeight} per risk indicator (weighted) + up to {cfg.exposureCap} for exposure ÷ turnover. Capped at 100. Adjust on the Risk scoring page.</li>
          <li>Bands: <Band band="Low" /> &lt;{cfg.bands.Moderate} · <Band band="Moderate" /> {cfg.bands.Moderate}–{cfg.bands.High - 1} · <Band band="High" /> {cfg.bands.High}–{cfg.bands.Critical - 1} · <Band band="Critical" /> ≥{cfg.bands.Critical}.</li>
          <li>AATO for e-invoicing uses current-year turnover as a proxy.</li>
          <li>GSTIN active/cancelled status, books and GSTR-9/9C are not in the extract: those matrix rules show “Needs books”. E-way bills come from the <b>E-way bills</b> page (sync or uploaded export) and feed rules G-05, B-03 and D-05.</li>
          <li>Total exposure across portfolio: {inr(data.taxpayers.reduce((s, a) => s + a.exposure.confirmed, 0))} computed (unverified).</li>
        </ul>
      </div>
    </div>
  );
}
