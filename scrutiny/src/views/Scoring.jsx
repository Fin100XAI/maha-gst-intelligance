import React, { useMemo, useState } from 'react';
import { PageHead, BandChip } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { DEFAULT_SCORING, scoreOf } from '../engine/score.js';
import { BAND } from '../lib/colors.js';

const clone = (x) => JSON.parse(JSON.stringify(x));

function Weight({ label, value, onChange, max, step = 0.5 }) {
  return (
    <div className="weight-row">
      <div className="name">{label}</div>
      <div className="track"><i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>
      <input type="number" step={step} min="0" value={value} onChange={(e) => onChange(Number.isFinite(+e.target.value) ? +e.target.value : 0)} aria-label={label} />
    </div>
  );
}

export default function Scoring({ data, baseTaxpayers, cfg, onSave, toast }) {
  const [d, setD] = useState(() => clone(cfg));
  const severity = useMemo(() => Object.fromEntries(data.catalog.map((r) => [r.id, r.severity])), [data.catalog]);
  const cat = useMemo(() => Object.fromEntries(data.catalog.map((r) => [r.id, r])), [data.catalog]);
  const ruleIds = useMemo(() => [...new Set(baseTaxpayers.flatMap((a) => a.results.map((r) => r.id)))].sort(), [baseTaxpayers]);
  const fraudKeys = baseTaxpayers[0]?.fraud || [];
  const ex = new Set(d.excluded);
  const toggle = (id) => setD((x) => ({ ...x, excluded: ex.has(id) ? x.excluded.filter((y) => y !== id) : [...x.excluded, id] }));
  const num = (v) => (Number.isFinite(+v) ? +v : 0);

  const bandsOk = d.bands.Moderate > 0 && d.bands.Moderate < d.bands.High && d.bands.High < d.bands.Critical && d.bands.Critical <= 100;
  const weightsOk = [d.fail.High, d.fail.Med, d.fail.Low, d.fraudWeight, d.exposureCap].every((v) => v >= 0) && d.fail.High >= d.fail.Med && d.fail.Med >= d.fail.Low;
  const valid = bandsOk && weightsOk && d.reviewFactor >= 0 && d.reviewFactor <= 1;
  const dirty = JSON.stringify(d) !== JSON.stringify(cfg);

  const preview = baseTaxpayers.map((a) => {
    const before = scoreOf(a, cfg, severity), after = valid ? scoreOf(a, d, severity) : before;
    return { a, before, after };
  }).sort((x, y) => y.after.score - x.after.score);

  return (
    <div className="page">
      <PageHead title="Risk scoring" path="PUT /api/scoring · applies to every taxpayer in this browser">
        <button className="btn" onClick={() => setD(clone(DEFAULT_SCORING))}>Reset defaults</button>
        <button className="btn primary" disabled={!valid || !dirty} onClick={() => { onSave(d); toast('Scoring saved: rankings updated'); }}>Save scoring</button>
      </PageHead>

      <div className="grid g-main-side">
        <div className="stack">
          <section className="card">
            <div className="card-head"><div><h3>Check weights</h3><p>Points added per failed check, by the severity in the rule matrix. A check flagged for review scores a fraction of the fail weight.</p></div></div>
            <div className="panel">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div><div className="lbl">fail_weight<span style={{ color: 'var(--live)' }}>*</span></div><div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>Must satisfy High ≥ Med ≥ Low</div></div>
                <span className={`chip ${weightsOk ? 'good' : 'bad'}`} style={{ marginLeft: 'auto' }}>{weightsOk ? <><Icon name="check" size={13} stroke={2.6} /> valid</> : 'invalid order'}</span>
              </div>
              <Weight label="high" value={d.fail.High} max={15} onChange={(v) => setD((x) => ({ ...x, fail: { ...x.fail, High: v } }))} />
              <Weight label="med" value={d.fail.Med} max={15} onChange={(v) => setD((x) => ({ ...x, fail: { ...x.fail, Med: v } }))} />
              <Weight label="low" value={d.fail.Low} max={15} onChange={(v) => setD((x) => ({ ...x, fail: { ...x.fail, Low: v } }))} />
              <Weight label="review_factor" value={d.reviewFactor} max={1} step={0.05} onChange={(v) => setD((x) => ({ ...x, reviewFactor: v }))} />
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><h3>Risk indicators &amp; exposure</h3><p>Each raised risk indicator adds its weight × this value. Exposure adds (quantified ÷ turnover %) × multiplier, capped.</p></div></div>
            <div className="form-grid">
              <div className="field"><label>risk_indicator_weight</label><input type="number" step="0.5" min="0" className="mono-in" value={d.fraudWeight} onChange={(e) => setD((x) => ({ ...x, fraudWeight: num(e.target.value) }))} /></div>
              <div className="field"><label>exposure_multiplier</label><input type="number" step="0.5" min="0" className="mono-in" value={d.exposureMultiplier} onChange={(e) => setD((x) => ({ ...x, exposureMultiplier: num(e.target.value) }))} /></div>
              <div className="field"><label>exposure_cap</label><input type="number" step="1" min="0" max="100" className="mono-in" value={d.exposureCap} onChange={(e) => setD((x) => ({ ...x, exposureCap: num(e.target.value) }))} /></div>
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><h3>Risk bands</h3><p>Score thresholds (0–100). Must increase: Moderate &lt; High &lt; Critical.</p></div>
              <div className="actions"><span className={`chip ${bandsOk ? 'good' : 'bad'}`}>{bandsOk ? <><Icon name="check" size={13} stroke={2.6} /> ascending</> : 'not ascending'}</span></div></div>
            <div className="form-grid">
              {['Moderate', 'High', 'Critical'].map((b) => (
                <div className="field" key={b}>
                  <label><i style={{ width: 9, height: 9, borderRadius: '50%', background: BAND[b].color, display: 'inline-block' }} />{b.toLowerCase()}_from</label>
                  <input type="number" min="1" max="100" className="mono-in" value={d.bands[b]} onChange={(e) => setD((x) => ({ ...x, bands: { ...x.bands, [b]: num(e.target.value) } }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', height: 10, borderRadius: 10, overflow: 'hidden', marginTop: 18, gap: 2 }}>
              {[['Low', 0, d.bands.Moderate], ['Moderate', d.bands.Moderate, d.bands.High], ['High', d.bands.High, d.bands.Critical], ['Critical', d.bands.Critical, 100]].map(([b, lo, hi]) => (
                <div key={b} title={`${b}: ${lo}–${hi}`} style={{ flex: Math.max(0.5, hi - lo), background: BAND[b].color }} />
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><div><h3>Included in score</h3><p>Click to exclude a check or risk indicator from the score: for example a check your office handles through a separate audit. Excluded items still appear in findings.</p></div>
              <div className="actions"><span className="chip brand">{d.excluded.length} excluded</span></div></div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Automated checks</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ruleIds.map((id) => <button key={id} className={`chip toggle brand ${ex.has(id) ? 'off' : ''}`} title={cat[id]?.check} onClick={() => toggle(id)}>{id}</button>)}
            </div>
            <div className="eyebrow" style={{ margin: '18px 0 10px' }}>Risk indicators</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {fraudKeys.map((f) => <button key={f.key} className={`chip toggle brand ${ex.has(`FR:${f.key}`) ? 'off' : ''}`} title={f.why} onClick={() => toggle(`FR:${f.key}`)}>{f.key}</button>)}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center' }}><div className="eyebrow">Live ranking</div><span className="mono muted" style={{ marginLeft: 'auto', fontSize: 11.5 }}>{dirty ? 'unsaved' : 'current'}</span></div>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {preview.map(({ a, before, after }, i) => {
                const delta = after.score - before.score;
                return (
                  <div key={a.id} className="panel" style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '18px minmax(0,1fr) auto', gap: 10, alignItems: 'center' }}>
                    <span className="mono muted" style={{ fontSize: 11.5 }}>{i + 1}</span>
                    <span style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                      <div className="mono" style={{ fontSize: 11, color: delta > 0 ? 'var(--live)' : delta < 0 ? 'var(--good)' : 'var(--ink-3)', marginTop: 2 }}>{before.score} → {after.score}{delta ? ` (${delta > 0 ? '+' : ''}${delta})` : ''}</div>
                    </span>
                    <BandChip band={after.band} />
                  </div>
                );
              })}
            </div>
          </section>
          <div className="callout">
            <Icon name="alert" size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>Changing weights re-ranks taxpayers but does not re-run reconciliation. Check thresholds (e.g. ₹1,000 / 1% for ITC vs 2B) stay as defined in the rule matrix, and drafted notices keep the findings they were drafted with.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
