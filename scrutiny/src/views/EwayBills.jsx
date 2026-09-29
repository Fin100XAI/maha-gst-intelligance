// E-way bills: the connection to the e-way bill system (simulated until NIC/GSP credentials are available), and what
// the bills show against the returns across every loaded taxpayer: goods moved with no invoice (G-05), credit taken on
// goods with no movement behind them (B-03), bill-to-ship-to movements under the wrong tax head (D-05), and vehicles
// recorded in two places at once.
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Kpi, PageHead, Band } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { inr, int, pct } from '../lib/format.js';

const NIC_LABEL = { EWB_GSP_BASE_URL: 'GSP API address', EWB_GSP_CLIENT_ID: 'GSP client ID', EWB_GSP_CLIENT_SECRET: 'GSP client secret', EWB_USERNAME: 'e-way bill username', EWB_PASSWORD: 'e-way bill password' };

export default function EwayBills({ data, openTaxpayer, toast, reload }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null); // 'fetch' | 'upload'
  const [upGstin, setUpGstin] = useState('');
  const loadStatus = () => fetch(api('/__ewb/status'), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then(setStatus).catch(() => setStatus(null));
  useEffect(() => { loadStatus(); }, []);

  const withEwb = data.taxpayers.filter((t) => t.ewb);
  const t = useMemo(() => {
    const s = (f) => withEwb.reduce((a, x) => a + f(x.ewb), 0);
    const needing = s((e) => e.outward.needing), covered = s((e) => e.outward.covered);
    return {
      bills: s((e) => e.outward.bills), value: s((e) => e.outward.value), inBills: s((e) => e.inward.bills), needing, covered,
      unmatched: s((e) => e.outward.unmatched.count), unmatchedValue: s((e) => e.outward.unmatched.value), unmatchedTax: s((e) => e.outward.unmatched.tax), g05: withEwb.filter((x) => x.ewb.outward.unmatched.count).length,
      unsupported: s((e) => e.inward.unsupported.count), unsupportedItc: s((e) => e.inward.unsupported.itc), b03: withEwb.filter((x) => x.ewb.inward.unsupported.count).length,
      wrongHead: s((e) => e.shipTo.wrongHead.count), moves: s((e) => e.shipTo.moves), clashes: s((e) => e.vehicles.clashes),
    };
  }, [data]);
  const rows = withEwb.map((x) => ({ x, e: x.ewb, exposure: x.ewb.outward.unmatched.tax + x.ewb.inward.unsupported.itc + x.ewb.shipTo.wrongHead.tax }))
    .filter((r) => r.exposure > 0 || r.e.vehicles.clashes > 0).sort((a, b) => b.exposure - a.exposure || b.e.vehicles.clashes - a.e.vehicles.clashes);
  const simulated = withEwb.some((x) => x.ewb.source === 'simulated');

  const fetchAll = async () => {
    setBusy('fetch');
    try {
      const r = await fetch(api('/__ewb/fetch'), { method: 'POST' });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.ok) toast(body.error || `Fetch failed (HTTP ${r.status})`);
      else { toast(`E-way bills fetched again from the simulated system for ${body.refreshed} taxpayer-years in ${body.seconds} s`); await reload(); }
    } catch (e) { toast(`Fetch failed: ${e.message}`); }
    setBusy(null); loadStatus();
  };
  const upload = async (file) => {
    if (!file || !upGstin) return;
    setBusy('upload');
    try {
      const r = await fetch(api(`/__ewb/upload?gstin=${encodeURIComponent(upGstin)}&name=${encodeURIComponent(file.name)}`), { method: 'POST', body: file, headers: { 'content-type': 'application/octet-stream' } });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.ok) toast(body.error || `Upload failed (HTTP ${r.status})`);
      else { toast(`${int(body.bills)} e-way bills stored for ${upGstin} (FY ${body.years.join(', ')})`); await reload(); }
    } catch (e) { toast(`Upload failed: ${e.message}`); }
    setBusy(null); loadStatus();
  };

  return (
    <div className="page">
      <PageHead title="E-way bills" path={`${withEwb.length} of ${data.taxpayers.length} taxpayers · ${int(t.bills)} bills generated · ${int(t.inBills)} received${simulated ? ' · simulated e-way bill system' : ''}`} />

      <Card title="Connection to the e-way bill system" sub="Where the bills come from. The returns do not carry them.">
        <div className="grid g-3" style={{ alignItems: 'start' }}>
          <div>
            <div className="eyebrow">Source in use</div>
            <p style={{ margin: '6px 0' }}><b>{status?.mode === 'nic' ? 'NIC e-way bill API' : 'Simulated e-way bill system'}</b></p>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {status?.mode === 'nic' ? 'NIC credentials are set. The live client is not part of this build yet.'
                : 'Bills are derived from each taxpayer\'s invoices under rule 138 (value limits, exempt goods, services) with realistic places, vehicles and distances, plus the planted problems of the high-risk taxpayers. Every figure is simulated.'}
            </p>
          </div>
          <div>
            <div className="eyebrow">NIC e-way bill API</div>
            <p style={{ margin: '6px 0' }}><b>{status?.nic?.configured ? 'Configured' : 'Not connected'}</b></p>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {status?.nic?.configured ? 'All credentials are present.' : <>Needs registration with a GST Suvidha Provider and, on the server: {(status?.nic?.missing || Object.keys(NIC_LABEL)).map((k) => NIC_LABEL[k] || k).join(', ')}. The server's IP must be whitelisted by the GSP.</>}
            </p>
          </div>
          <div>
            <div className="eyebrow">Stored</div>
            <p style={{ margin: '6px 0' }}><b>{status ? `${int(status.files)} taxpayer-years` : '-'}</b>{status?.uploaded ? ` (${status.uploaded} uploaded)` : ''}</p>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Last fetched {status?.lastFetch ? new Date(status.lastFetch).toLocaleString('en-IN') : '-'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
          <button className="btn primary" onClick={fetchAll} disabled={!!busy} title="Fetch every taxpayer's e-way bills again and re-run the checks">
            <Icon name="truck" size={16} />{busy === 'fetch' ? 'Fetching… (about a minute)' : 'Fetch e-way bills'}
          </button>
          <span className="muted" style={{ fontSize: 13 }}>or upload the portal's e-way bill export for</span>
          <select value={upGstin} onChange={(e) => setUpGstin(e.target.value)} aria-label="GSTIN for the upload">
            <option value="">choose a GSTIN…</option>
            {data.taxpayers.slice().sort((a, b) => a.name.localeCompare(b.name)).map((x) => <option key={x.gstin} value={x.gstin}>{x.name} · {x.gstin}</option>)}
          </select>
          <label className={`btn ${!upGstin || busy ? 'disabled' : ''}`} style={{ pointerEvents: !upGstin || busy ? 'none' : 'auto', opacity: !upGstin || busy ? 0.5 : 1 }}>
            <Icon name="upload" size={16} />{busy === 'upload' ? 'Uploading…' : 'Upload .xlsx'}
            <input type="file" accept=".xlsx" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      </Card>

      <div className="grid g-4" style={{ marginTop: 12 }}>
        <Kpi label="Bills generated" value={int(t.bills)} sub={`${inr(t.value)} of goods moved`} />
        <Kpi label="Invoices covered" value={pct(t.needing ? t.covered / t.needing : null)} sub={`${int(t.covered)} of ${int(t.needing)} invoices above the limit`} fill={t.needing ? t.covered / t.needing : 0} />
        <Kpi label="Goods moved, no invoice (G-05)" value={inr(t.unmatchedValue)} sub={`${int(t.unmatched)} bills · ${t.g05} taxpayers · tax ${inr(t.unmatchedTax)}`} dot={t.unmatched ? '#b02222' : undefined} />
        <Kpi label="ITC with no movement (B-03)" value={inr(t.unsupportedItc)} sub={`${int(t.unsupported)} purchase invoices · ${t.b03} taxpayers`} dot={t.unsupported ? '#b02222' : undefined} />
      </div>

      <Card title="Taxpayers the e-way bills raise questions about" sub={`${rows.length} of ${withEwb.length} taxpayers. Ordered by tax at stake. Click a row for its bills.`} style={{ marginTop: 12 }}>
        {rows.length ? (
          <div className="tbl-wrap" style={{ maxHeight: 520 }}>
            <table className="tbl">
              <thead><tr><th>Taxpayer</th><th>Risk</th><th className="num">Bills</th><th className="num">Bills with no invoice</th><th className="num">ITC with no movement</th><th className="num">Wrong tax head (ship-to)</th><th className="num">Impossible journeys</th><th className="num">Tax at stake</th></tr></thead>
              <tbody>
                {rows.map(({ x, e, exposure }) => (
                  <tr key={x.gstin} className="clickable" onClick={() => openTaxpayer(x.gstin)} style={{ cursor: 'pointer' }} title="Open this taxpayer's e-way bills">
                    <td><b>{x.name}</b><div className="mono muted" style={{ fontSize: 11.5 }}>{x.gstin}</div></td>
                    <td><Band band={x.band} score={x.score} /></td>
                    <td className="num">{int(e.outward.bills)}</td>
                    <td className="num">{e.outward.unmatched.count ? <>{int(e.outward.unmatched.count)} · {inr(e.outward.unmatched.value)}</> : '-'}</td>
                    <td className="num">{e.inward.unsupported.count ? <>{int(e.inward.unsupported.count)} · {inr(e.inward.unsupported.itc)}</> : '-'}</td>
                    <td className="num">{e.shipTo.wrongHead.count ? `${e.shipTo.wrongHead.count} of ${e.shipTo.moves}` : '-'}</td>
                    <td className="num">{e.vehicles.clashes || '-'}</td>
                    <td className="num"><b>{inr(exposure)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">The e-way bills agree with the returns for every taxpayer.</div>}
      </Card>

      <Card title="How the checks read the bills" style={{ marginTop: 12 }}>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          <li><b>When a bill is needed (rule 138):</b> goods worth more than ₹50,000 moving between states; within Maharashtra, Tamil Nadu, Delhi and West Bengal the limit is ₹1 lakh. Services never move on one, and gold, jewellery and precious stones (Chapter 71) are exempt.</li>
          <li><b>G-05, goods moved with no invoice:</b> a bill the taxpayer generated whose document is not in its GSTR-1. The goods left, the sale was not reported.</li>
          <li><b>B-03, ITC with no movement:</b> a goods purchase above the limit with no bill from the supplier. Credit needs the goods to have been received (s.16(2)(b)).</li>
          <li><b>D-05, bill-to-ship-to:</b> goods delivered to one state but billed to a party in another. The place of supply is the bill-to party's state (IGST Act s.10(1)(b)), so the tax head follows it.</li>
          <li><b>Impossible journeys:</b> one vehicle starting two journeys hundreds of kilometres apart within a few hours. A lead: at least one of the bills records a movement that did not happen.</li>
        </ul>
      </Card>

      {!withEwb.length && <Card style={{ marginTop: 12 }}><div className="empty">No e-way bill data is loaded. Use <b>Fetch e-way bills</b> above.</div></Card>}
    </div>
  );
}
