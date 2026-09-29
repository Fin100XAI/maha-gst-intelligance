// Evidence, governance and human authority (capability 31), for the POC: where every finding stands with the
// officer, the audit trail and its integrity, how fresh each input is, exactly which code produced the numbers,
// the gates that keep decisions with officers, and the capability register.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { Card, Kpi, PageHead, Legend, Seg, InfoTip, axisProps, gridProps } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { useEvidence, jurisdictionsOf, ALL } from '../components/leadership.jsx';
import { isIssue } from '../engine/verify.js';
import { CAPABILITIES, STATUS as CAP_STATUS, GATES, DEFERRED } from '../lib/capabilities.js';
import { SERIES, INK, STATUS } from '../lib/colors.js';

const days = (iso, now = Date.now()) => (iso ? Math.floor((now - Date.parse(iso)) / 864e5) : null);
const fresh = (d) => (d === null ? ['', 'unknown'] : d <= 45 ? ['good', 'fresh'] : d <= 120 ? ['warn', 'ageing'] : ['bad', 'stale']);
const CAP_CHIP = { built: 'good', partial: 'warn', deferred: '', excluded: '' };
const summary = (e) => {
  switch (e.type) {
    case 'status': return `Status → ${e.status}`;
    case 'note': return `Note: ${String(e.text).slice(0, 80)}`;
    case 'readiness': return `Readiness ${e.done ? 'recorded' : 'withdrawn'}: ${e.label}`;
    case 'disposition': return `${e.ruleId}: ${e.code || 'withdrawn'}${e.note ? ` (${String(e.note).slice(0, 60)})` : ''}`;
    case 'response': return `Taxpayer response received ${e.received}`;
    case 'close': return `Closed (${e.code}): ${String(e.reason).slice(0, 60)}`;
    case 'notice': return `ASMT-10 drafted, ${e.notice?.items?.length ?? 0} items`;
    case 'eiu-reply': return `${e.signalId}: reply from ${e.from}${e.doc ? ` (${e.doc.name})` : ''}`;
    case 'eiu-challenge': return `${e.signalId}: challenge, ${e.excluded?.length ?? 0} excluded: ${String(e.reason).slice(0, 60)}`;
    case 'eiu-review': return `${e.signalId}: ${e.verdict} (${e.status || '-'})`;
    case 'log': return String(e.text).slice(0, 90);
    case 'import': return 'Browser records imported';
    default: return e.type;
  }
};

export default function Governance({ data, registers, cases, go }) {
  const [gov, setGov] = useState(null);
  const [log, setLog] = useState(null);
  const [err, setErr] = useState('');
  const [type, setType] = useState('all');
  const load = useCallback(() => {
    Promise.all([fetch('/__governance', { cache: 'no-store' }).then((r) => r.json()), fetch('/__cases/log?limit=1000', { cache: 'no-store' }).then((r) => r.json())])
      .then(([g, l]) => { setGov(g.ok ? g : null); setLog(l.ok ? l : null); setErr(g.ok && l.ok ? '' : 'The local server did not answer; governance details need it.'); })
      .catch(() => setErr('The local server is not running: audit log and fingerprints need it.'));
  }, []);
  useEffect(load, [load]);
  const jur = jurisdictionsOf(data, registers)[0] || ALL;
  const eb = useEvidence({ data, registers, cases, jurisdiction: jur });

  // Where findings stand with the officer: decided (outcome, review or closure recorded) or awaiting a decision.
  const decisions = useMemo(() => {
    const rule = { kind: 'Rule findings', decided: 0, pending: 0, note: 'an outcome recorded with reasons' };
    for (const a of data.taxpayers) for (const r of a.results.filter(isIssue)) (cases[a.id]?.dispositions?.[r.id] ? rule.decided++ : rule.pending++);
    const eiu = { kind: 'EIU signals', decided: 0, pending: 0, note: 'officer review of the revalidation, still current' };
    for (const r of eb.eiu) { const rv = cases[r.signal.gstin]?.eiu?.[r.signal.signalId]?.review; (rv && rv.status === r.statusLabel ? eiu.decided++ : eiu.pending++); }
    const net = { kind: 'Network anomalies (high)', decided: 0, pending: eb.anomalies.filter((a) => a.severity === 'high').length, note: 'decided through the case of the taxpayer concerned' };
    const openCases = eb.cases.filter((c) => c.origin === 'platform');
    const plat = { kind: 'Platform cases', decided: openCases.filter((c) => !c.open).length, pending: openCases.filter((c) => c.open).length, note: 'closed with a closure code and reasons' };
    const reg = { kind: 'Register cases', decided: eb.cases.filter((c) => c.origin === 'register' && !c.open).length, pending: eb.cases.filter((c) => c.origin === 'register' && c.open).length, note: 'closed in the case action register' };
    return [rule, eiu, net, plat, reg].map((d) => ({ ...d, total: d.decided + d.pending }));
  }, [data, cases, eb]);

  const now = Date.now();
  const extracts = data.taxpayers.map((t) => t.asOf).filter(Boolean).sort();
  const sources = [
    { name: 'Returns (latest extract across taxpayers)', when: extracts.at(-1), detail: `${data.taxpayers.length} taxpayers; oldest extract ${extracts[0] || '-'}` },
    { name: 'Dataset build (data.json)', when: gov?.dataset?.built || data.generatedAt, detail: gov?.dataset ? `SHA-256 ${gov.dataset.sha256.slice(0, 12)}… · ${(gov.dataset.bytes / 1e6).toFixed(1)} MB` : '' },
    ...(gov?.registers || []).map((m) => ({ name: `Register: ${m.title}`, when: m.uploadedAt, detail: `${m.file} · ${m.rows} rows · SHA-256 ${m.sha256.slice(0, 12)}…` })),
    { name: 'Reply documents stored', when: null, detail: gov ? `${gov.docs} document${gov.docs === 1 ? '' : 's'}, kept as received` : '' },
  ];
  const events = (log?.events || []).filter((e) => type === 'all' || e.type === type);
  const types = [...new Set((log?.events || []).map((e) => e.type))];
  const pending = decisions.reduce((s, d) => s + d.pending, 0);
  const built = CAPABILITIES.filter((c) => c.status === 'built').length, partial = CAPABILITIES.filter((c) => c.status === 'partial').length;

  return (
    <div className="page">
      <PageHead title="Governance" path="Evidence, governance and human authority · POC">
        <button className="btn small" onClick={load}><Icon name="check" size={14} /> Refresh</button>
      </PageHead>
      {err && <div className="note">{err}</div>}
      <div className="grid g-4">
        <Kpi label="Audit trail" value={log ? `${log.chain.events} events` : '-'} sub={log ? (log.chain.verified ? `hash chain intact${log.chain.unchained ? ` · ${log.chain.unchained} earlier events predate it` : ''}` : `chain broken at event ${log.chain.brokenAt}`) : 'needs the local server'} dot={log && !log.chain.verified ? STATUS.critical : undefined} />
        <Kpi label="Awaiting an officer's decision" value={pending} sub="findings with no recorded decision yet" />
        <Kpi label="Code fingerprinted" value={gov ? gov.code.length : '-'} sub="analytical modules and the rule matrix, hashed now" />
        <Kpi label="Capabilities" value={`${built + partial} of 31`} sub={`${built} built, ${partial} with a stated gap, ${31 - built - partial} deferred or excluded`} />
      </div>

      <div className="grid g-21 mt">
        <Card title="Where findings stand with the officer" sub="Every finding is preliminary until an officer records a decision; the system never decides"
          table={{ columns: ['Finding', 'Decided', 'Awaiting decision', 'Decided means'], rows: decisions.map((d) => [d.kind, d.decided, d.pending, d.note]) }}>
          <ResponsiveContainer width="100%" height={decisions.length * 40 + 40}>
            <BarChart data={decisions} layout="vertical" margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} vertical />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="kind" {...axisProps} width={170} interval={0} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div className="h">{payload[0].payload.kind}</div><div className="r"><i style={{ background: SERIES[5] }} />Decided<b>{payload[0].payload.decided}</b></div><div className="r"><i style={{ background: SERIES[3] }} />Awaiting<b>{payload[0].payload.pending}</b></div><div className="r">{payload[0].payload.note}</div></div> : null)} />
              <Bar dataKey="decided" name="Decided" stackId="d" fill={SERIES[5]} isAnimationActive={false} />
              <Bar dataKey="pending" name="Awaiting decision" stackId="d" fill={SERIES[3]} radius={[0, 3, 3, 0]} isAnimationActive={false}><LabelList dataKey="total" position="right" fill={INK.secondary} fontSize={11} /></Bar>
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[{ label: 'Decided by an officer', color: SERIES[5] }, { label: 'Awaiting a decision', color: SERIES[3] }]} />
        </Card>
        <Card title="Human authority, enforced in code" sub="Decisions stay with officers; these gates are checked by the platform, not left to habit">
          <ul className="gates">{GATES.map(([g, where]) => <li key={g}><Icon name="lock" size={14} /><div>{g}<div className="mono muted small">{where}</div></div></li>)}</ul>
        </Card>
      </div>

      <Card className="mt" title="Data freshness" sub="How old each input is; a figure is only as current as what it was computed from">
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Source</th><th>Last updated</th><th className="num">Age</th><th>State</th><th>Detail</th></tr></thead>
          <tbody>{sources.map((s) => { const d = days(s.when, now); const [chip, label] = fresh(d); return <tr key={s.name}><td>{s.name}</td><td className="mono small">{s.when ? String(s.when).slice(0, 10) : '-'}</td><td className="num">{d === null ? '-' : `${d} d`}</td><td>{s.when ? <span className={`chip ${chip}`}>{label}</span> : '-'}</td><td className="small">{s.detail}</td></tr>; })}</tbody>
        </table></div>
      </Card>

      <Card className="mt" title="Audit trail" sub={log ? `Every case action as stored (newest first). ${log.chain.verified ? 'Hash chain intact' : `Hash chain broken at event ${log.chain.brokenAt}`}.` : 'Needs the local server'}
        actions={<><InfoTip title="Tamper evidence">Each event stores the hash of the one before it together with its own content. Editing, removing or reordering any line of the log changes the hashes after it, and the check on start-up reports where. Events recorded before the chain was introduced are kept and counted separately.</InfoTip>
          {types.length > 1 && <select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All events</option>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select>}</>}>
        <div className="tbl-wrap" style={{ maxHeight: 420 }}><table className="tbl">
          <thead><tr><th className="num">#</th><th>Recorded</th><th>By</th><th>Case</th><th>What</th><th>Hash</th></tr></thead>
          <tbody>{events.slice(0, 300).map((e) => (
            <tr key={e.seq}><td className="num">{e.seq}</td><td className="mono small">{String(e.receivedAt || e.at).replace('T', ' ').slice(0, 16)}</td><td className="small">{e.by || '-'}</td>
              <td className="mono small">{e.caseId ? <button className="link-btn" onClick={() => go('taxpayer', e.caseId)}>{e.caseId}</button> : '-'}</td><td className="small">{summary(e)}</td>
              <td className="mono small">{e.hash ? `${e.hash.slice(0, 10)}…` : <span className="muted">before chain</span>}</td></tr>
          ))}</tbody>
        </table></div>
        {!events.length && <div className="note">No case actions recorded yet.</div>}
      </Card>

      <div className="grid g-2 mt">
        <Card title="The code that produced these numbers" sub={gov ? `SHA-256 of each analytical module and the rule matrix, taken ${gov.at.replace('T', ' ').slice(0, 16)} UTC` : 'Needs the local server'}>
          <div className="tbl-wrap" style={{ maxHeight: 360 }}><table className="tbl">
            <thead><tr><th>File</th><th>SHA-256</th><th className="num">Size</th><th>Changed</th></tr></thead>
            <tbody>{(gov?.code || []).map((c) => <tr key={c.file}><td className="mono small">{c.file}</td><td className="mono small" title={c.sha256}>{c.sha256.slice(0, 16)}…</td><td className="num">{(c.bytes / 1024).toFixed(1)} KB</td><td className="mono small">{c.modified.slice(0, 10)}</td></tr>)}</tbody>
          </table></div>
          <div className="muted small mt">Record these with any result that leaves the platform: the same inputs and the same fingerprints give the same figures.</div>
        </Card>
        <Card title="Not in this POC" sub="Left for production and stated, not implied">
          <ul className="hyp-out">{DEFERRED.map((d) => <li key={d}>{d}</li>)}</ul>
        </Card>
      </div>

      <Card className="mt" title="Capability register" sub="The 31 capabilities of the InQAI document: where each lives, how it is tested, and what is left out">
        <div className="tbl-wrap" style={{ maxHeight: 620 }}><table className="tbl cap-table">
          <thead><tr><th className="num">#</th><th>Capability</th><th>Status</th><th>Screen</th><th>Engine</th><th>Tests</th><th>Gap or note</th></tr></thead>
          <tbody>{CAPABILITIES.map((c) => (
            <tr key={c.n}><td className="num">{c.n}</td><td><b>{c.name}</b><div className="muted small">Layer {c.layer}</div></td><td><span className={`chip ${CAP_CHIP[c.status]}`}>{CAP_STATUS[c.status]}</span></td>
              <td>{c.status !== 'excluded' ? <button className="link-btn small" onClick={() => go(c.view)}>{c.view}</button> : '-'}</td><td className="mono small">{c.engine}</td><td className="mono small">{c.tests}</td><td className="small">{c.note || '-'}</td></tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
