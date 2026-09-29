// Counterparty and network screens: anomaly cards with their exact path, the multi-hop path explorer, and the
// counterparty evidence card. All numbers come from src/engine/network.js.
import React, { useMemo, useState } from 'react';
import { Card, Seg, InfoTip } from './ui.jsx';
import Icon from './Icon.jsx';
import { paths, counterpartiesOf, detectAnomalies, STATES } from '../engine/network.js';
import { inr, pct } from '../lib/format.js';
import { shortName } from './RevenueChange.jsx';

export const SEV = {
  high: { chip: 'bad', label: 'High' },
  medium: { chip: 'warn', label: 'Medium' },
  low: { chip: '', label: 'Context' },
};
export const STATE_CHIP = { verify: 'bad', insufficient: 'warn', consistent: 'good' };
const nameOf = (g, x) => g.nodes[x]?.name || x;

/** A path as a row of named steps; loaded taxpayers are links. */
export function PathChips({ g, path, open, fy, shape = 'chain', spokes }) {
  const step = (x) => (g.nodes[x]?.loaded.includes(fy) && open
    ? <button className="path-node loaded" onClick={() => open(x)} title={`${x} · open Taxpayer 360°`}>{shortName(nameOf(g, x), 36)}</button>
    : <span className="path-node" title={x}>{shortName(nameOf(g, x), 36)}</span>);
  if (shape === 'star') {
    return (
      <div className="path-chips">
        {step(path[0])}<span className="path-arrow" aria-hidden="true">→</span><span className="muted small">{path.length - 1} {spokes}:</span>
        {path.slice(1).map((x) => <React.Fragment key={x}>{step(x)}</React.Fragment>)}
      </div>
    );
  }
  return (
    <div className="path-chips">
      {path.map((x, i) => (
        <React.Fragment key={`${x}-${i}`}>
          {i > 0 && <span className="path-arrow" aria-hidden="true">→</span>}
          {step(x)}
        </React.Fragment>
      ))}
    </div>
  );
}

export function AnomalyCard({ g, a, open, fy }) {
  const [more, setMore] = useState(false);
  return (
    <div className={`anomaly sev-${a.severity}`}>
      <div className="anomaly-head">
        <span className={`chip ${SEV[a.severity].chip}`}>{SEV[a.severity].label}</span>
        <b>{a.label}</b>
        <span className="anomaly-val">{inr(a.value)}{a.itc ? <span className="muted"> · ITC {inr(a.itc)}</span> : null}</span>
      </div>
      <PathChips g={g} path={a.path} open={open} fy={fy} shape={a.shape} spokes={a.spokes} />
      <p className="anomaly-why">{a.why}</p>
      <div className="anomaly-base"><span className="eyebrow">Baseline</span> {a.baseline}{a.window && <span className="muted"> · active {a.window.from}{a.window.to !== a.window.from ? `–${a.window.to}` : ''}</span>}</div>
      {a.evidence?.length > 0 && (
        <>
          <button className="link-btn small" onClick={() => setMore((v) => !v)} aria-expanded={more}>{more ? 'Hide' : 'Show'} source evidence ({a.evidence.length})</button>
          {more && <ul className="hyp-out">{a.evidence.map((t) => <li key={t}>{t}</li>)}</ul>}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Taxpayer 360°: counterparties
export function CounterpartyTab({ g, master = [], gstin, fy, open }) {
  const anomalies = useMemo(() => (g?.years.includes(fy) ? detectAnomalies(g, { fy, master }) : []), [g, fy, master]);
  const list = useMemo(() => (g ? counterpartiesOf(g, anomalies, { fy, taxpayer: gstin, master }) : []), [g, anomalies, fy, gstin, master]);
  const [pick, setPick] = useState(null);
  const card = list.find((c) => c.gstin === pick) || list[0];
  if (!g || !g.years.includes(fy)) return <Card title="Counterparties"><div className="note">No network data for FY {fy}. Rebuild the data (npm run build:data) after loading returns.</div></Card>;
  const counts = Object.fromEntries(Object.keys(STATES).map((k) => [k, list.filter((c) => c.state === k).length]));
  const mine = anomalies.filter((a) => a.path.includes(gstin) && a.severity !== 'low');
  return (
    <div className="network-tab">
      <div className="grid g-12">
        <Card tour="counterparties" title="Material counterparties" sub={`FY ${fy}: buyers and suppliers worth at least ₹10 L or 5% of a side · requires verification ${counts.verify} · insufficient evidence ${counts.insufficient} · consistent ${counts.consistent}`}
          actions={<InfoTip title="Evidence states, not verdicts">Nothing here says a counterparty is fake. Each relationship gets an evidence state from the returns on both sides: <b>Requires verification</b> when something in the returns contradicts it, <b>Insufficient evidence</b> when nothing contradicts it but little is visible, <b>Consistent</b> when both sides support it.</InfoTip>}>
          <div className="cp-list" role="listbox" aria-label="Counterparties">
            {list.map((c) => (
              <button key={c.gstin} role="option" aria-selected={card?.gstin === c.gstin} className={`cp-row ${card?.gstin === c.gstin ? 'on' : ''}`} onClick={() => setPick(c.gstin)}>
                <span className="cp-name"><b>{shortName(c.name, 34)}</b><span className="mono muted">{c.gstin} · {c.roles.join(' and ')}</span></span>
                <span className="cp-val">{inr(c.value)}</span>
                <span className={`chip ${STATE_CHIP[c.state]}`}>{c.stateLabel}</span>
              </button>
            ))}
            {!list.length && <div className="note">No material counterparties this year.</div>}
          </div>
        </Card>
        {card && <CounterpartyCard g={g} c={card} open={open} fy={fy} />}
      </div>
      {mine.length > 0 && (
        <Card className="mt" title="Network anomalies involving this taxpayer" sub="Structures a single taxpayer's ratios cannot show, each with its exact path and the baseline it is compared with">
          <div className="anomaly-list">{mine.map((a) => <AnomalyCard key={a.id} g={g} a={a} open={open} fy={fy} />)}</div>
        </Card>
      )}
      <PathExplorer g={g} root={gstin} fy={fy} anomalies={anomalies} open={open} />
    </div>
  );
}

function CounterpartyCard({ g, c, open, fy }) {
  const cols = [
    ['Consistent evidence', c.matrix.consistent, 'good'],
    ['Contradictory evidence', c.matrix.contradictory, 'bad'],
    ['Missing evidence', c.matrix.missing, 'warn'],
    ['Questions to resolve', c.matrix.questions, ''],
  ];
  return (
    <Card title={shortName(c.name, 44)} sub={`${c.gstin} · ${c.roles.join(' and ')} · ${inr(c.value)} this year${c.itc ? ` · ITC ${inr(c.itc)}` : ''}`}
      actions={g.nodes[c.gstin]?.loaded.includes(fy) && <button className="btn small" onClick={() => open(c.gstin)}>Open its Taxpayer 360°</button>}>
      <div className={`verdict ${STATE_CHIP[c.state]}`} role="status">
        <Icon name={c.state === 'consistent' ? 'check' : 'alert'} size={18} />
        <div><b>{c.stateLabel}.</b> {c.rationale}</div>
      </div>
      <div className="cp-facts">
        <span className="tag">{c.loaded ? 'Returns loaded' : 'Returns not loaded'}</span>
        <span className="tag">Status: {c.status || 'not in master'}</span>
        {c.jurisdiction && <span className="tag">{c.jurisdiction}</span>}
        <span className="tag">Sells to {c.network.buyers} · buys from {c.network.suppliers} in the data</span>
        {c.variants.length > 0 && <span className="tag" title={c.variants.join('; ')}>{c.variants.length} name variant{c.variants.length > 1 ? 's' : ''}</span>}
      </div>
      <div className="matrix">
        {cols.map(([title, items, tone]) => (
          <div key={title} className={`matrix-col ${tone}`}>
            <div className="eyebrow">{title} ({items.length})</div>
            {items.length ? <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul> : <div className="muted small">None</div>}
          </div>
        ))}
      </div>
      {c.timeline.length > 0 && (
        <div className="cp-timeline">
          <div className="eyebrow">Status timeline</div>
          <ol>{c.timeline.map((t) => <li key={t.date + t.text} className={t.tone}><span className="mono">{t.date}</span> {t.text}</li>)}</ol>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ capability 12: path explorer
export function PathExplorer({ g, root, fy, anomalies, open }) {
  const [direction, setDirection] = useState('up');
  const [depth, setDepth] = useState(3);
  const [minValue, setMinValue] = useState(1e6);
  const tree = useMemo(() => paths(g, root, { fy, direction, depth, minValue }), [g, root, fy, direction, depth, minValue]);
  const flagged = useMemo(() => {
    const m = new Map();
    // An anomaly with a centre (pass-through, non-filer, abrupt) marks only that node; a cycle or pair marks every member.
    for (const a of anomalies) if (a.severity !== 'low') for (const x of a.via ? [a.via] : a.path) (m.get(x) || m.set(x, new Set()).get(x)).add(a.label);
    return m;
  }, [anomalies]);
  return (
    <Card className="mt" tour="paths" title="Trace the network" sub={`Material ${direction === 'up' ? 'suppliers, their suppliers and so on' : 'buyers, their buyers and so on'}, ${depth} levels deep. Smaller links are counted, not dropped.`}
      actions={<>
        <Seg value={direction} onChange={setDirection} options={[{ value: 'up', label: 'Suppliers ↑' }, { value: 'down', label: 'Buyers ↓' }]} />
        <Seg value={depth} onChange={setDepth} options={[2, 3, 4].map((d) => ({ value: d, label: `${d} levels` }))} />
        <Seg value={minValue} onChange={setMinValue} options={[{ value: 1e5, label: '≥ ₹1 L' }, { value: 1e6, label: '≥ ₹10 L' }, { value: 1e7, label: '≥ ₹1 Cr' }]} />
      </>}>
      <div className="tree" role="tree" aria-label="Network paths">
        <div className="tree-root"><b>{shortName(tree.name, 40)}</b> <span className="muted">{direction === 'up' ? 'buys' : 'sells'} {inr(tree.flow)} in FY {fy}</span></div>
        <TreeLevel g={g} nodes={tree.children} pruned={tree.pruned} direction={direction} flagged={flagged} open={open} fy={fy} level={1} />
      </div>
    </Card>
  );
}

function TreeLevel({ g, nodes, pruned, direction, flagged, open, fy, level }) {
  return (
    <ul className="tree-level" role="group">
      {nodes.map((n) => <TreeNode key={n.gstin + n.edge.id} g={g} n={n} direction={direction} flagged={flagged} open={open} fy={fy} level={level} />)}
      {pruned?.count > 0 && <li className="tree-pruned muted small">+ {pruned.count} smaller link{pruned.count > 1 ? 's' : ''} ({inr(pruned.value)}) below the threshold</li>}
    </ul>
  );
}

function TreeNode({ g, n, direction, flagged, open, fy, level }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasKids = n.children.length > 0 || n.pruned.count > 0;
  const flags = flagged.get(n.gstin);
  return (
    <li role="treeitem" aria-expanded={hasKids ? expanded : undefined}>
      <div className="tree-row">
        <button className="tree-toggle" onClick={() => setExpanded((v) => !v)} disabled={!hasKids} aria-label={expanded ? 'Collapse' : 'Expand'}>{hasKids ? (expanded ? '▾' : '▸') : '·'}</button>
        <span className="tree-level-tag">L{level}</span>
        {n.loaded && open ? <button className="link-btn tree-name" onClick={() => open(n.gstin)} title={n.gstin}>{shortName(n.name, 34)}</button> : <span className="tree-name" title={n.gstin}>{shortName(n.name, 34)}</span>}
        <span className="tree-val">{inr(n.edge.taxable)} <span className="muted">({pct(n.share, 0)})</span></span>
        <span className="tree-sides muted small" title="Which returns record this trade">{n.edge.sides.join(' + ')}</span>
        {n.loopsTo && <span className="chip bad">returns to {shortName(g.nodes[n.loopsTo]?.name || n.loopsTo, 18)}</span>}
        {flags && [...flags].map((f) => <span key={f} className="chip warn">{f}</span>)}
      </div>
      {expanded && hasKids && <TreeLevel g={g} nodes={n.children} pruned={n.pruned} direction={direction} flagged={flagged} open={open} fy={fy} level={level + 1} />}
    </li>
  );
}
