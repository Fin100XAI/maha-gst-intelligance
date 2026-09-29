// Network intelligence for a jurisdiction: the reduction from every trade to the unresolved exposure, the anomalies
// behind it with their exact paths, and the entity layer (same-PAN links and the review queue).
import React, { useMemo, useState } from 'react';
import { Card, Kpi, PageHead, Tabs, InfoTip } from '../components/ui.jsx';
import { AnomalyCard, SEV } from '../components/Network.jsx';
import { detectAnomalies, exposureFunnel, resolveEntities, ANOMALY } from '../engine/network.js';
import { shortName } from '../components/RevenueChange.jsx';
import { inr, pct, int } from '../lib/format.js';

const ALL = '__all';

export default function Network({ data, registers, openTaxpayer }) {
  const g = data.network;
  const master = registers?.master?.records || [];
  const jurisdictions = useMemo(() => [...new Set(master.map((r) => r.jurisdiction))].sort(), [master]);
  const busiest = useMemo(() => {
    const n = (j) => master.filter((r) => r.jurisdiction === j && g?.nodes[r.gstin]?.loaded.length).length;
    return [...jurisdictions].sort((x, y) => n(y) - n(x))[0];
  }, [jurisdictions, master, g]);
  const [jurPick, setJur] = useState(null);
  const jur = jurPick ?? (busiest || ALL);
  const [fyPick, setFy] = useState(null);
  const fy = fyPick ?? g?.years[g.years.length - 1];
  const [tab, setTab] = useState('anomalies');
  const [types, setTypes] = useState(null); // null = all
  const [showContext, setShowContext] = useState(false);

  const scope = useMemo(() => (jur === ALL ? null : new Set(master.filter((r) => r.jurisdiction === jur).map((r) => r.gstin))), [jur, master]);
  const all = useMemo(() => (g && fy ? detectAnomalies(g, { fy, master }) : []), [g, fy, master]);
  const inScope = useMemo(() => all.filter((a) => !scope || a.path.some((x) => scope.has(x))), [all, scope]);
  const funnel = useMemo(() => (g && fy ? exposureFunnel(g, inScope, { fy, scope }) : null), [g, fy, inScope, scope]);
  const entities = useMemo(() => (g ? resolveEntities(g, master) : null), [g, master]);
  const open = (gstin) => openTaxpayer(gstin, 'network');

  if (!g) {
    return <div className="page"><PageHead title="Network" /><div className="card note">This dataset has no network graph. Rebuild the data (npm run build:data) to add it.</div></div>;
  }
  const visible = inScope.filter((a) => (showContext || a.severity !== 'low') && (!types || types.has(a.type)));
  const typeCounts = Object.keys(ANOMALY).map((t) => [t, inScope.filter((a) => a.type === t && (showContext || a.severity !== 'low')).length]).filter(([, n]) => n);
  const toggleType = (t) => setTypes((cur) => { const s = new Set(cur || typeCounts.map(([k]) => k)); if (s.has(t)) s.delete(t); else s.add(t); return s.size === typeCounts.length ? null : s; });
  const high = inScope.filter((a) => a.severity === 'high').length, medium = inScope.filter((a) => a.severity === 'medium').length;

  return (
    <div className="page">
      <PageHead title="Network" path={`${jur === ALL ? 'all loaded GSTINs' : jur} · FY ${fy}`}>
        <label className="field inline"><span>Jurisdiction</span>
          <select value={jur} onChange={(e) => setJur(e.target.value)}>
            {jurisdictions.map((j) => <option key={j} value={j}>{j}</option>)}
            <option value={ALL}>All loaded GSTINs</option>
          </select>
        </label>
        <label className="field inline"><span>Year</span>
          <select value={fy} onChange={(e) => setFy(e.target.value)}>{g.years.map((y) => <option key={y} value={y}>FY {y}</option>)}</select>
        </label>
      </PageHead>
      {!master.length && <div className="note">No taxpayer master register loaded: every loaded GSTIN is in scope, and registration dates and statuses are unknown. Upload one in Upload data.</div>}

      <Funnel f={funnel} />

      <div className="grid g-4 mt">
        <Kpi label="High-severity anomalies" value={high} sub="cycles, pass-through, non-filing, invoices after cancellation" dot={high ? '#b02222' : undefined} />
        <Kpi label="Medium" value={medium} sub="abrupt formation, record mismatch, invalid GSTIN, two-way trade next to a cycle" />
        <Kpi label="Counterparties outside scope" value={funnel.connected.length} sub="on anomalous edges: candidates for the worklist" />
        <Kpi label="Entities" value={int(entities.stats.entities)} sub={`${int(entities.stats.gstins)} GSTINs · ${entities.stats.linked} same-PAN groups · ${entities.stats.review} to review`} />
      </div>

      <div className="tabs-row mt">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'anomalies', label: 'Anomalies', count: visible.length },
          { id: 'exposure', label: 'Connected counterparties', count: funnel.connected.length },
          { id: 'entities', label: 'Entities', count: entities.stats.review || undefined },
        ]} />
      </div>

      {tab === 'anomalies' && (
        <Card title="Network anomalies" sub="Every anomaly shows the exact path, its value and window, why it is unusual, and the baseline it is compared with. Click a loaded taxpayer to trace it."
          actions={<label className="check"><input type="checkbox" checked={showContext} onChange={(e) => setShowContext(e.target.checked)} /> Show context items</label>}>
          <div className="chip-row">
            {typeCounts.map(([t, n]) => (
              <button key={t} className={`chip toggle ${!types || types.has(t) ? '' : 'off'}`} onClick={() => toggleType(t)} aria-pressed={!types || types.has(t)}>{ANOMALY[t].label} · {n}</button>
            ))}
          </div>
          <div className="anomaly-list">
            {visible.map((a) => <AnomalyCard key={a.id} g={g} a={a} open={open} fy={fy} />)}
            {!visible.length && <div className="note">No anomalies of the selected kinds.</div>}
          </div>
        </Card>
      )}

      {tab === 'exposure' && (
        <Card title="Counterparties outside the jurisdiction on anomalous trade" sub="Ranked by unresolved exposure: credit claimed from them by taxpayers in scope, or tax they charged in months without GSTR-3B">
          <div className="tbl-wrap" style={{ maxHeight: 520 }}>
            <table className="tbl">
              <thead><tr><th>Counterparty</th><th>Anomalies</th><th className="num">Trade on flagged edges</th><th className="num">Unresolved exposure</th></tr></thead>
              <tbody>
                {funnel.connected.map((c) => (
                  <tr key={c.gstin}>
                    <td><b>{shortName(c.name, 40)}</b><div className="mono muted">{c.gstin}</div></td>
                    <td>{c.types.map((t) => <span key={t} className={`chip ${SEV[ANOMALY[t].severity].chip}`}>{ANOMALY[t].label}</span>)}</td>
                    <td className="num">{inr(c.taxable)}</td>
                    <td className="num">{c.exposure ? inr(c.exposure) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!funnel.connected.length && <div className="note">No counterparty outside the scope sits on an anomalous edge.</div>}
          </div>
        </Card>
      )}

      {tab === 'entities' && <Entities r={entities} open={open} g={g} fy={fy} />}

      <div className="prelim mt" role="note"><div><b>Preliminary.</b> Built from the loaded returns only. Anomalies and evidence states are leads for the officer to verify; none is a finding that an entity is fake or that credit is inadmissible.</div></div>
    </div>
  );
}

// ------------------------------------------------------------------ capability 14: the reduction
function Funnel({ f }) {
  const stages = [
    ['All trade', f.universe, 'Every buyer-seller relationship touching the scope this year'],
    ['Material', f.material, 'At least ₹10 L a year, or 5% of either party’s side'],
    ['Anomalous', f.anomalous, 'Material and on a high or medium anomaly (each edge counted once)'],
  ];
  const max = f.universe.taxable || 1;
  return (
    <Card className="mt" tour="funnel" title="From all trade to what needs attention" sub={`${pct(f.reduction)} of relationships need a look; the rest can be left alone.`}
      actions={<InfoTip title="How the reduction works">All trade: every relationship in the returns that touches a taxpayer in scope. Material: big enough to matter. Anomalous: material and on a path with a high or medium anomaly. Unresolved exposure: the credit claimed by taxpayers in scope on those edges (only the late invoices for a cancelled supplier), or tax charged by a taxpayer in scope in months it filed no GSTR-3B; when both apply to the same invoices, only the larger counts. An edge on several anomalies is counted once.</InfoTip>}>
      <div className="funnel">
        {stages.map(([label, s, note]) => (
          <div key={label} className="funnel-row">
            <div className="funnel-label"><b>{label}</b><span className="muted small">{note}</span></div>
            <div className="funnel-bar"><i style={{ width: `${Math.max(1.5, (s.taxable / max) * 100)}%` }} /></div>
            <div className="funnel-num"><b>{inr(s.taxable)}</b><span className="muted small">{int(s.edges)} relationships · {int(s.counterparties)} outside parties · ITC {inr(s.itc)}</span></div>
          </div>
        ))}
        <div className="funnel-row final">
          <div className="funnel-label"><b>Unresolved exposure</b><span className="muted small">Evidence-supported, needs verification</span></div>
          <div className="funnel-bar"><i style={{ width: `${Math.max(1.5, (f.unresolved.total / max) * 100)}%` }} /></div>
          <div className="funnel-num"><b>{inr(f.unresolved.total)}</b><span className="muted small">ITC {inr(f.unresolved.itc)} · undeclared tax {inr(f.unresolved.unpaidTax)}{f.unresolved.overlap > 0 ? ` · less ${inr(f.unresolved.overlap)} counted in both` : ''} · {f.unresolved.edges} relationships</span></div>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ capability 10: entities
function Entities({ r, open, g, fy }) {
  const linked = r.entities.filter((e) => e.link).sort((a, b) => b.gstins.filter((x) => x.loaded).length - a.gstins.filter((x) => x.loaded).length || b.gstins.length - a.gstins.length);
  return (
    <div className="grid g-2">
      <Card title="Review queue" sub="Possible links the platform will not make on its own. Nothing here is merged."
        actions={<InfoTip title="Why a queue?">Registrations that share a PAN are one legal person: that link is certain and made automatically. Similar names under different PANs, one GSTIN reported under unrelated names, or a GSTIN that fails its check digit are only possibilities, so an officer decides.</InfoTip>}>
        {r.review.length ? (
          <ul className="review-list">
            {r.review.map((x, i) => (
              <li key={i}>
                <div className="review-head"><span className={`chip ${x.type === 'invalid-gstin' ? 'bad' : 'warn'}`}>{{ 'invalid-gstin': 'Invalid GSTIN', 'same-name': 'Same name, different PAN', 'similar-names': 'Similar names', 'name-variants': 'Name variants' }[x.type]}</span><span className="muted small">confidence {pct(x.confidence, 0)}</span></div>
                <div><b>{x.names.slice(0, 3).join(' · ')}</b></div>
                <div className="mono muted small">{x.gstins.slice(0, 6).join(', ')}{x.gstins.length > 6 ? ` +${x.gstins.length - 6}` : ''}</div>
                <div className="small">{x.reason}</div>
              </li>
            ))}
          </ul>
        ) : <div className="note">Nothing to review.</div>}
      </Card>
      <Card title="Linked registrations (same PAN)" sub={`${r.stats.linked} legal persons with more than one GSTIN; each GSTIN stays a separate taxable person`}>
        <div className="tbl-wrap" style={{ maxHeight: 560 }}>
          <table className="tbl">
            <thead><tr><th>Entity</th><th>GSTINs</th></tr></thead>
            <tbody>
              {linked.map((e) => (
                <tr key={e.id}>
                  <td><b>{shortName(e.name, 34)}</b><div className="mono muted">PAN {e.pan}</div></td>
                  <td>{e.gstins.map((x) => (
                    <div key={x.gstin} className="mono small">
                      {x.loaded && g.nodes[x.gstin]?.loaded.includes(fy) ? <button className="link-btn" onClick={() => open(x.gstin)}>{x.gstin}</button> : x.gstin}
                      {x.status && x.status !== 'Active' ? <span className="chip bad">{x.status}</span> : null}{x.jurisdiction ? <span className="muted"> · {x.jurisdiction}</span> : null}
                    </div>
                  ))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
