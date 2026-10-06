// Alerts: the officer's queue. It fills by itself after every analysis, from alert rules the department sets, and
// from the notice workflow (drafts not issued, replies due or overdue, replies to review). Detection becomes action:
// acknowledge, dismiss with a reason, or open the taxpayer.
import React, { useMemo, useState } from 'react';
import { PageHead, Tabs, TestTag } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { WHEN_TYPES, PRIORITIES, validateRule, evaluateAlerts } from '../engine/alerts.js';
import { followUps } from '../engine/notices.js';
import { isTestData } from '../engine/names.js';
import { inr, int } from '../lib/format.js';

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const today = () => new Date().toISOString().slice(0, 10);
const PRIORITY_TONE = { High: 'bad', Medium: 'warn', Low: '' };
const STATUS_LABEL = { open: 'Open', acknowledged: 'Acknowledged', dismissed: 'Dismissed', resolved: 'Resolved' };

export default function Alerts({ data, queue, lastSeen, cases, notices, master, onAction, onSaveRules, viewer = null, canConfigure = true, canAct = true, openTaxpayer, openNotice }) {
  const [tab, setTab] = useState('queue');
  const [show, setShow] = useState('open');
  const follow = useMemo(() => followUps({ notices, cases, taxpayers: data.taxpayers, today: today(), viewer }), [notices, cases, data.taxpayers, viewer]);
  if (!queue) return <div className="page"><PageHead title="Alerts" /><div className="card note">Alerts need the server store (dev server or server.mjs).</div></div>;
  const isNew = (a) => !lastSeen || a.firstSeen > lastSeen;
  const open = queue.alerts.filter((a) => a.status === 'open');
  const listed = queue.alerts.filter((a) => show === 'all' || a.status === show);
  return (
    <div className="page">
      <PageHead title="Alerts" path={`${int(open.length)} open · ${int(queue.alerts.filter((a) => a.status === 'open' && isNew(a)).length)} new since you last looked · ${int(follow.length)} notice follow-up${follow.length === 1 ? '' : 's'}`} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'queue', label: 'Queue', count: open.length + follow.length }, { id: 'rules', label: 'Alert rules', count: queue.rules.filter((r) => r.enabled).length }, { id: 'resolved', label: 'Resolved', count: queue.resolved.length }]} />

      {tab === 'queue' && (<>
        <section className="card mt">
          <div className="card-head"><div><h3>Notices to follow up</h3><div className="sub">From the notice workflow: approvals waiting for you, drafts not issued, replies due or overdue, replies to review.</div></div></div>
          {!follow.length && <div className="muted">Nothing due.</div>}
          {follow.length > 0 && (
            <table className="tbl">
              <thead><tr><th>Priority</th><th>Taxpayer</th><th>Notice</th><th>What to do</th><th /></tr></thead>
              <tbody>{follow.map((f) => (
                <tr key={`${f.id}-${f.kind}`}>
                  <td><span className={`chip ${PRIORITY_TONE[f.priority]}`}>{f.priority}</span></td>
                  <td><b>{f.name}</b>{isTestData(f.gstin) && <> <TestTag /></>}<div className="mono muted" style={{ fontSize: 11 }}>{f.gstin}</div></td>
                  <td className="mono" style={{ fontSize: 12 }}>{f.ref}</td>
                  <td>{f.text}</td>
                  <td><button className="btn small primary" onClick={() => openNotice(f.id)}>{f.kind === 'approve' ? 'Review and decide' : 'Open notice'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </section>

        <section className="card mt">
          <div className="card-head">
            <div><h3>Taxpayers meeting an alert rule</h3><div className="sub">Refreshed by every analysis. An alert stays until it is dealt with, or until the taxpayer no longer meets the rule.</div></div>
            <label className="field inline"><span>Show</span>
              <select value={show} onChange={(e) => setShow(e.target.value)}>
                {['open', 'acknowledged', 'dismissed', 'all'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All' : STATUS_LABEL[s]} ({int(s === 'all' ? queue.alerts.length : queue.alerts.filter((a) => a.status === s).length)})</option>)}
              </select>
            </label>
          </div>
          {!listed.length && <div className="muted">No alerts here.</div>}
          {listed.length > 0 && (
            <div className="tbl-wrap" style={{ maxHeight: 560 }}>
              <table className="tbl">
                <thead><tr><th>Priority</th><th>Taxpayer</th><th>Alert</th><th className="num">At stake</th><th>Since</th><th>Status</th><th /></tr></thead>
                <tbody>{listed.map((a) => (
                  <tr key={a.key}>
                    <td><span className={`chip ${PRIORITY_TONE[a.priority]}`}>{a.priority}</span>{a.status === 'open' && isNew(a) && <span className="chip brand" style={{ marginLeft: 4 }}>New</span>}</td>
                    <td><b>{a.name}</b>{isTestData(a.gstin) && <> <TestTag /></>}<div className="mono muted" style={{ fontSize: 11 }}>{a.gstin} · FY {a.fy}{a.officer ? ` · ${a.officer}` : ''}</div></td>
                    <td><b style={{ fontWeight: 600 }}>{a.rule}</b><div className="muted" style={{ fontSize: 12 }}>{a.reason}</div></td>
                    <td className="num">{a.amount ? inr(a.amount) : '-'}</td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{when(a.firstSeen)}</td>
                    <td style={{ fontSize: 12 }}>{STATUS_LABEL[a.status]}{a.by ? <div className="muted">{a.by}{a.note ? `: ${a.note}` : ''}</div> : null}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn small soft" onClick={() => openTaxpayer(a.id)}>Open</button>{' '}
                      {canAct && a.status === 'open' && <button className="btn small" onClick={() => onAction(a.key, 'acknowledge')}>Acknowledge</button>}{' '}
                      {canAct && a.status === 'open' && <button className="btn small" onClick={() => { const note = window.prompt('Why is this alert being dismissed? (recorded with your name)'); if (note && note.trim()) onAction(a.key, 'dismiss', note.trim()); }}>Dismiss</button>}
                      {canAct && a.status !== 'open' && <button className="btn small" onClick={() => onAction(a.key, 'reopen')}>Reopen</button>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </>)}

      {tab === 'rules' && <RuleEditor rules={queue.rules} data={data} master={master} onSave={onSaveRules} readOnly={!canConfigure} />}

      {tab === 'resolved' && (
        <section className="card mt">
          <div className="card-head"><div><h3>Resolved by a later analysis</h3><div className="sub">The taxpayer no longer meets the rule (for example, after a corrected return was uploaded).</div></div></div>
          {!queue.resolved.length ? <div className="muted">None yet.</div> : (
            <table className="tbl"><thead><tr><th>Alert</th><th>First seen</th><th>Resolved</th></tr></thead>
              <tbody>{queue.resolved.map((r) => <tr key={r.key}><td className="mono" style={{ fontSize: 12 }}>{r.key}</td><td>{when(r.firstSeen)}</td><td>{when(r.resolvedAt)}</td></tr>)}</tbody></table>
          )}
        </section>
      )}
    </div>
  );
}

const blankRule = () => ({ id: `rule-${Date.now().toString(36)}`, name: '', enabled: true, priority: 'Medium', when: { type: 'band', band: 'High' } });

// The department's alert rules, with a live preview of how many taxpayers each would raise today.
function RuleEditor({ rules, data, master, onSave, readOnly }) {
  const [draft, setDraft] = useState(() => rules.map((r) => ({ ...r, when: { ...r.when } })));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (i, patch) => setDraft((d) => d.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setWhen = (i, patch) => setDraft((d) => d.map((r, j) => (j === i ? { ...r, when: { ...r.when, ...patch } } : r)));
  const preview = (r) => (validateRule(r).length ? null : evaluateAlerts([{ ...r, enabled: true }], data.taxpayers, { master }).length);
  const save = async () => {
    const errs = draft.flatMap((r, i) => validateRule(r).map((e) => `Rule ${i + 1}${r.name ? ` (${r.name})` : ''}: ${e}`));
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    const res = await onSave(draft);
    setSaving(false);
    setErrors(res?.ok ? [] : res?.errors || [res?.error || 'Could not save']);
  };
  return (
    <section className="card mt">
      <div className="card-head">
        <div><h3>Alert rules</h3><div className="sub">What deserves an officer's attention. Each rule is checked against every analysis; the count shows how many taxpayers it would raise today.</div></div>
        {readOnly ? <span className="chip">A supervisor or Commissioner changes the rules</span> : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setDraft((d) => [...d, blankRule()])}><Icon name="plus" size={15} /> Add rule</button>
          <button className="btn primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save rules'}</button>
        </div>)}
      </div>
      {errors.length > 0 && <div className="upr-error" role="alert">{errors.map((e) => <div key={e}>{e}</div>)}</div>}
      <fieldset disabled={readOnly} className="plain-fieldset"><table className="tbl">
        <thead><tr><th>On</th><th>Name</th><th>When</th><th>Priority</th><th>Jurisdiction</th><th className="num">Today</th><th /></tr></thead>
        <tbody>{draft.map((r, i) => (
          <tr key={r.id}>
            <td><input type="checkbox" checked={r.enabled} onChange={(e) => set(i, { enabled: e.target.checked })} aria-label="Rule on" /></td>
            <td><input value={r.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="Name" style={{ minWidth: 220 }} /></td>
            <td>
              <select value={r.when.type} onChange={(e) => setWhen(i, { type: e.target.value })}>{Object.entries(WHEN_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{' '}
              {r.when.type === 'band' && <select value={r.when.band || 'High'} onChange={(e) => setWhen(i, { band: e.target.value })}>{['Moderate', 'High', 'Critical'].map((b) => <option key={b}>{b}</option>)}</select>}
              {r.when.type === 'rule' && <input value={r.when.ruleId || ''} onChange={(e) => setWhen(i, { ruleId: e.target.value.toUpperCase() })} placeholder="Check ID, e.g. B-01" style={{ width: 120 }} />}
              {r.when.type === 'indicator' && <select value={r.when.indicator || ''} onChange={(e) => setWhen(i, { indicator: e.target.value })}><option value="">choose…</option>{(data.taxpayers[0]?.fraud || []).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select>}
              {['score', 'exposure', 'rule'].includes(r.when.type) && <> <input type="number" min="0" value={r.when.min ?? ''} onChange={(e) => setWhen(i, { min: e.target.value === '' ? '' : Number(e.target.value) })} placeholder={r.when.type === 'score' ? 'score' : 'rupees'} style={{ width: 120 }} /></>}
            </td>
            <td><select value={r.priority} onChange={(e) => set(i, { priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></td>
            <td><input value={r.jurisdiction || ''} onChange={(e) => set(i, { jurisdiction: e.target.value })} placeholder="All" style={{ width: 120 }} /></td>
            <td className="num">{preview(r) ?? '-'}</td>
            <td><button className="btn small soft" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))} aria-label={`Delete ${r.name}`}>Delete</button></td>
          </tr>
        ))}</tbody>
      </table></fieldset>
    </section>
  );
}
