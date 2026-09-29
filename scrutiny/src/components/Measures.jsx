import React from 'react';
import { SERIES, BAND, INK, BRAND } from '../lib/colors.js';
import { inr, int } from '../lib/format.js';
import { scoreParts } from '../engine/score.js';
import { enforcementReadiness, isIssue, DISPOSITIONS, READINESS } from '../engine/verify.js';
import { InfoTip } from './ui.jsx';

// Three measures, each with a plot of the quantities behind it:
//   Data confidence       records per source per month (coverage heatmap)
//   Review priority       point contributions (stacked bar) + position among all taxpayers
//   Enforcement readiness alert funnel (raised → decided → confirmed) + outcome mix + checklist
const MONTHS = ['A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M'];
const MONTH_NAMES = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const RAMP = ['#dfe6f5', '#b8c8ec', '#8aa4dd', '#5c80cc', '#3b62c0']; // one hue, light → dark
const PART_COLOR = { High: SERIES[4], Med: SERIES[1], Low: SERIES[3], review: SERIES[2], indicators: SERIES[6], exposure: SERIES[0] };
const OUTCOME_COLOR = { confirmed: SERIES[4], explained: SERIES[5], timing: SERIES[2], source: SERIES[3], dropped: SERIES[7] };
const tone = (v) => (v == null ? INK.muted : v >= 80 ? '#0c6a4a' : v >= 40 ? '#9c630d' : '#b02222');
const dmy = (iso) => (iso ? iso.split('-').reverse().join('-') : null);

function Head({ label, value, of = '/ 100', note, color, question, info }) {
  return (
    <>
      <div className="m-head"><div className="eyebrow">{label}</div>{info}</div>
      <div className="m-top"><span className="m-v" style={{ color }}>{value}</span><span className="muted">{of}</span>{note && <span className="m-chip">{note}</span>}</div>
      <div className="m-q">{question}</div>
    </>
  );
}

function Stat({ v, l }) { return <div className="m-stat"><b>{v}</b><span>{l}</span></div>; }

/* ------------------------------------------------ data confidence: coverage heatmap */
function Coverage({ rows }) {
  return (
    <div className="m-heat" role="img" aria-label={`Records per month: ${rows.map((r) => `${r.label} ${r.total}`).join(', ')}`}>
      {rows.map((r) => {
        const max = Math.max(1, ...r.counts);
        return (
          <React.Fragment key={r.key}>
            <span className="m-heat-l">{r.label}</span>
            {r.counts.map((c, i) => {
              const step = r.key === '3b' ? RAMP.length - 1 : Math.max(0, Math.min(RAMP.length - 1, Math.ceil((c / max) * RAMP.length) - 1));
              return <span key={i} className={`m-cell ${c ? '' : 'nodata'}`} style={c ? { background: RAMP[step] } : undefined}
                title={`${r.label} · ${MONTH_NAMES[i]}: ${r.key === '3b' ? (c ? 'covered by a return' : 'no return') : `${int(c)} ${r.unit}`}`} />;
            })}
            <span className="m-heat-t">{int(r.total)}</span>
          </React.Fragment>
        );
      })}
      <span />{MONTHS.map((m, i) => <span key={i} className="m-heat-x">{m}</span>)}<span className="m-heat-x">total</span>
    </div>
  );
}

export function DataConfidence({ a }) {
  const c = a.confidence;
  const f = c.facts;
  const inward = c.coverage?.find((r) => r.key === '2b')?.total;
  const info = (
    <InfoTip title="Data confidence">
      <p>How complete the downloaded returns data is for this GSTIN. Low confidence means a finding may come from missing data rather than the taxpayer's conduct: record such alerts as <b>Source-data issue</b>.</p>
      <p>The score is the average of these checks:</p>
      <table><tbody>{c.parts.map((p) => <tr key={p.label}><td>{p.label}</td><td>{p.v}%</td></tr>)}</tbody></table>
      <p><b>Heatmap:</b> records per month (April to March) for each source. Darker means more records relative to that source's busiest month; a hatched cell means no records.</p>
      <p>Books, e-invoice, e-way bill, bank and stock data are never in the returns download and are not scored.</p>
    </InfoTip>
  );
  return (
    <section className="card measure">
      <Head label="Data confidence" value={c.score} color={tone(c.score)} note={f ? `${f.monthsCovered} of 12 months` : null} question="Is the returns data complete and reliable?" info={info} />
      {c.coverage ? (
        <>
          <div className="m-sub">Records per month, by source</div>
          <Coverage rows={c.coverage} />
          <div className="m-legend"><span>fewer</span>{RAMP.map((x) => <i key={x} style={{ background: x }} />)}<span>more</span><i className="nodata" /><span>none</span></div>
        </>
      ) : (
        <ul className="m-keys one">{c.parts.map((p) => <li key={p.label}>{p.label}<b>{p.v}%</b></li>)}</ul>
      )}
      {f && (
        <div className="m-stats">
          <Stat v={`${f.filedDates}/${f.periods}`} l="3B filing dates found" />
          <Stat v={f.g2aRows ? `${Math.round((f.supplierStatusKnown / f.g2aRows) * 100)}%` : 'n/a'} l="supplier status known" />
          <Stat v={int(inward || 0)} l="inward documents (2B)" />
        </div>
      )}
      <div className="m-foot">{f?.extractDate ? `Extract of ${dmy(f.extractDate)} (${f.extractSource}).` : 'Reload the page to load the latest data details.'} Not in the extract: books, e-invoice / e-way bill, bank and stock records.</div>
    </section>
  );
}

/* ------------------------------------------------ review priority: contributions + portfolio position */
// Spread dots that would overlap into rows above and below the axis (a small beeswarm).
function swarm(items, x, gap = 11) {
  const placed = [];
  return items.map((it) => {
    const px = x(it.score);
    for (const lvl of [0, -1, 1, -2, 2, -3, 3]) {
      if (!placed.some((p) => p.lvl === lvl && Math.abs(p.px - px) < gap)) { placed.push({ px, lvl }); return { ...it, px, lvl }; }
    }
    return { ...it, px, lvl: 0 };
  });
}

export function ReviewPriority({ a, taxpayers, cfg, severity }) {
  const sp = scoreParts(a, cfg, severity);
  const shown = sp.parts.filter((p) => p.points > 0.05);
  const scale = Math.max(100, sp.raw);
  const ranked = [...taxpayers].sort((x, y) => y.score - x.score);
  const rank = ranked.findIndex((t) => t.id === a.id) + 1;
  const b = cfg.bands;
  const zones = [['Low', 0, b.Moderate], ['Moderate', b.Moderate, b.High], ['High', b.High, b.Critical], ['Critical', b.Critical, 100]];
  const fails = a.results.filter((r) => r.status === 'Fail').length, reviews = a.results.filter((r) => r.status === 'Review').length;
  const W = 320, x = (v) => 10 + (v / 100) * (W - 20), mid = 38;
  const dots = swarm([...ranked].reverse().map((t) => ({ id: t.id, name: t.name, score: t.score })), x);
  const me = dots.find((d) => d.id === a.id);
  const info = (
    <InfoTip title="Review priority">
      <p>Decides which taxpayer to examine first. It is the same risk score as the gauge above, broken into points. It sets priority only: it is never a basis for statutory action.</p>
      <table><tbody>
        <tr><td>Each failed check (high / medium / low)</td><td>{cfg.fail.High} / {cfg.fail.Med} / {cfg.fail.Low}</td></tr>
        <tr><td>Each review check</td><td>{Math.round(cfg.reviewFactor * 100)}% of that</td></tr>
        <tr><td>Each raised risk indicator</td><td>{cfg.fraudWeight} × weight</td></tr>
        <tr><td>Computed exposure ÷ turnover (%)</td><td>× {cfg.exposureMultiplier}, max {cfg.exposureCap}</td></tr>
      </tbody></table>
      <p>Capped at 100. Bands: Low below {b.Moderate}, Moderate {b.Moderate}–{b.High - 1}, High {b.High}–{b.Critical - 1}, Critical {b.Critical}+. Weights are set on the Risk scoring page. Review prompts (turnover spike, Sunday invoicing) are not scored.</p>
      <p><b>Position strip:</b> every taxpayer's score on the same scale; the dark dot is this taxpayer, grey dots are the others (hover for names).</p>
    </InfoTip>
  );
  return (
    <section className="card measure">
      <Head label="Review priority" value={a.score} color={INK.primary} note={`${a.band} · rank ${rank} of ${taxpayers.length}`} question="Which cases should an officer examine first?" info={info} />
      <div className="m-sub">Where the {sp.score} points come from{sp.raw > 100 ? ` (${Math.round(sp.raw)} before the cap)` : ''}</div>
      <div className="m-stack" role="img" aria-label={shown.map((p) => `${p.label} ${p.points.toFixed(1)} points`).join(', ')}>
        {shown.map((p) => <span key={p.key} style={{ width: `${(p.points / scale) * 100}%`, background: PART_COLOR[p.key] }} title={`${p.label}: ${p.points.toFixed(1)} points`} />)}
      </div>
      <div className="m-scale"><span>0</span><span>50</span><span>100</span></div>
      <ul className="m-keys">
        {shown.map((p) => <li key={p.key}><i style={{ background: PART_COLOR[p.key] }} />{p.label}<b>{p.points.toFixed(1)}</b></li>)}
        {!shown.length && <li className="muted">No scored checks or indicators.</li>}
      </ul>
      <div className="m-sub" style={{ marginTop: 12 }}>Position among {taxpayers.length} taxpayers</div>
      <svg viewBox={`0 0 ${W} 92`} className="m-strip" role="img" aria-label={`Scores of all taxpayers; this taxpayer ${a.score}, rank ${rank} of ${taxpayers.length}`}>
        {zones.map(([k, lo, hi]) => <rect key={k} x={x(lo)} y={8} width={Math.max(0, x(hi) - x(lo))} height={60} fill={BAND[k].color} opacity={0.1} />)}
        {zones.map(([k, lo, hi]) => <text key={`t${k}`} x={(x(lo) + x(hi)) / 2} y={63} textAnchor="middle" style={{ fontSize: 8.5, fill: INK.secondary, letterSpacing: '0.04em' }}>{k.toUpperCase()}</text>)}
        <line x1={x(0)} x2={x(100)} y1={mid} y2={mid} stroke="#d6dce8" />
        {[0, b.Moderate, b.High, b.Critical, 100].map((v) => (
          <g key={v}><line x1={x(v)} x2={x(v)} y1={68} y2={73} stroke="#8d98ae" /><text x={x(v)} y={84} textAnchor="middle" style={{ fontSize: 9, fill: INK.muted, fontFamily: 'var(--mono)' }}>{v}</text></g>
        ))}
        {dots.filter((d) => d.id !== a.id).map((d) => <circle key={d.id} cx={d.px} cy={mid + d.lvl * 9} r={4.2} fill="#9aa4b8" stroke="#fff" strokeWidth={1.5}><title>{`${d.name}: ${d.score}`}</title></circle>)}
        {me && (
          <g>
            <circle cx={me.px} cy={mid + me.lvl * 9} r={7} fill={BRAND} stroke="#fff" strokeWidth={2}><title>{`${a.name}: ${a.score}`}</title></circle>
            <text x={me.px} y={mid + me.lvl * 9 + (me.lvl > 0 ? 18 : -11)} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: BRAND }}>{a.score}</text>
          </g>
        )}
      </svg>
      <div className="m-stats">
        <Stat v={fails} l="failed checks" />
        <Stat v={reviews} l="review checks" />
        <Stat v={a.fraud.filter((f) => f.flagged && !f.prompt).length} l="risk indicators scored" />
      </div>
      <div className="m-foot">Sets review priority only; never a basis for statutory action.</div>
    </section>
  );
}

/* ------------------------------------------------ enforcement readiness: funnel + outcome mix + checklist */
export function EnforcementReadiness({ a, caseInfo }) {
  const er = enforcementReadiness(a, caseInfo);
  const disp = caseInfo.dispositions || {};
  const issues = a.results.filter(isIssue);
  const amt = (list) => list.reduce((s, r) => s + (r.exposure || 0), 0);
  const decided = issues.filter((r) => disp[r.id]);
  const confirmed = issues.filter((r) => disp[r.id]?.code === 'confirmed');
  const funnel = [
    ['Alerts raised', issues.length, amt(issues), '#8d98ae'],
    ['Outcome recorded', decided.length, amt(decided), '#5c80cc'],
    ['Confirmed', confirmed.length, amt(confirmed), SERIES[4]],
  ];
  const mix = [...DISPOSITIONS.map(([k, l]) => [k, l, issues.filter((r) => disp[r.id]?.code === k).length]), ['pending', 'Outcome pending', issues.length - decided.length]].filter(([, , n]) => n > 0);
  const done = READINESS.filter(([k]) => caseInfo.readiness?.[k]).length;
  const info = (
    <InfoTip title="Enforcement readiness">
      <p>Whether there is <b>verified</b> evidence to support legal action. It stays low until the officer has recorded outcomes and confirmed discrepancies; a high value alone does not justify a notice.</p>
      <table><tbody>
        {er.parts.map((p) => <tr key={p.label}><td>{p.label} ({p.note})</td><td>{Math.round(p.v * p.w)} / {p.w}</td></tr>)}
        <tr><td><b>Total</b></td><td><b>{er.score ?? 'n/a'} / 100</b></td></tr>
      </tbody></table>
      <p><b>Funnel:</b> alerts raised, then those with an officer outcome, then those confirmed, with the computed ₹ at each stage.</p>
      <p><b>Outcome mix:</b> how the alerts were resolved: confirmed, explained by taxpayer, timing difference, source-data issue, dropped, or still pending. Only confirmed discrepancies can enter a notice.</p>
      <p><b>Checklist:</b> the 10 notice readiness steps on the Notices page.</p>
    </InfoTip>
  );
  if (!issues.length) {
    return (
      <section className="card measure">
        <Head label="Enforcement readiness" value="n/a" of="" color={INK.muted} question="Is there verified evidence for legal action?" info={info} />
        <p className="muted" style={{ fontSize: 12.5 }}>No alerts raised: nothing to enforce.</p>
      </section>
    );
  }
  return (
    <section className="card measure">
      <Head label="Enforcement readiness" value={er.score} color={tone(er.score)} note={confirmed.length ? `${inr(amt(confirmed))} confirmed` : 'nothing confirmed yet'} question="Is there verified evidence for legal action?" info={info} />
      <div className="m-sub">From alert to confirmed discrepancy</div>
      <div className="m-funnel">
        {funnel.map(([l, n, v, col]) => (
          <React.Fragment key={l}>
            <span className="m-fl">{l}</span>
            <span className="m-fbar">{n > 0 && <i style={{ width: `${(n / issues.length) * 100}%`, background: col }} title={`${l}: ${n} alerts, ${inr(v)} computed`} />}</span>
            <span className="m-fn">{n}</span>
            <span className="m-fv">{inr(v)}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="m-sub" style={{ marginTop: 12 }}>Outcome mix</div>
      <div className="m-stack thin" role="img" aria-label={mix.map(([, l, n]) => `${l} ${n}`).join(', ')}>
        {mix.map(([k, l, n]) => <span key={k} className={k === 'pending' ? 'pending' : ''} style={{ width: `${(n / issues.length) * 100}%`, background: OUTCOME_COLOR[k] }} title={`${l}: ${n}`} />)}
      </div>
      <ul className="m-keys">{mix.map(([k, l, n]) => <li key={k}><i className={k === 'pending' ? 'pending' : ''} style={{ background: OUTCOME_COLOR[k] }} />{l}<b>{n}</b></li>)}</ul>
      <div className="m-sub" style={{ marginTop: 12 }}>Notice readiness checklist · {done} of {READINESS.length}</div>
      <div className="m-pips" role="img" aria-label={`${done} of ${READINESS.length} checklist steps recorded`}>
        {READINESS.map(([k, l], i) => <i key={k} className={caseInfo.readiness?.[k] ? 'on' : ''} title={`${i + 1}. ${l}${caseInfo.readiness?.[k] ? ' (recorded)' : ''}`}>{i + 1}</i>)}
      </div>
      <div className="m-foot">{er.decided} of {er.issues} alerts decided · {er.confirmed} confirmed · {done} of {READINESS.length} checklist steps.</div>
    </section>
  );
}

export default function Measures({ a, caseInfo, taxpayers, cfg, severity }) {
  return (
    <div className="measures mt">
      <DataConfidence a={a} />
      <ReviewPriority a={a} taxpayers={taxpayers} cfg={cfg} severity={severity} />
      <EnforcementReadiness a={a} caseInfo={caseInfo} />
    </div>
  );
}
