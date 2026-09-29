// Shared pieces for the Leadership screens: one evidence base per jurisdiction (src/engine/roles.js), the
// jurisdiction picker, and the colour assignments every chart uses (fixed order, never by rank).
import React, { useMemo } from 'react';
import { evidenceBase } from '../engine/roles.js';
import { SERIES, BRAND, INK } from '../lib/colors.js';

export const ALL = '__all';

/** The evidence base every Leadership screen reads, recomputed only when its inputs change. */
export function useEvidence({ data, registers, cases, jurisdiction, fy, asOfMonth }) {
  return useMemo(() => evidenceBase({ data, registers: registers || {}, platformCases: cases || {}, jurisdiction: jurisdiction === ALL ? null : jurisdiction, fy, asOfMonth }),
    [data, registers, cases, jurisdiction, fy, asOfMonth]);
}

export function jurisdictionsOf(data, registers) {
  const master = registers?.master?.records || [];
  const count = (j) => master.filter((r) => r.jurisdiction === j && data.baselines?.[r.gstin]).length;
  return [...new Set(master.map((r) => r.jurisdiction))].filter((j) => count(j) > 0).sort((a, b) => count(b) - count(a));
}

export function JurisdictionPicker({ data, registers, value, onChange }) {
  const list = jurisdictionsOf(data, registers);
  return (
    <label className="field inline"><span>Jurisdiction</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {list.map((j) => <option key={j} value={j}>{j}</option>)}
        <option value={ALL}>All loaded GSTINs</option>
      </select>
    </label>
  );
}

// Collection classes, in a fixed order.
export const CLASS_COLOR = { regular: SERIES[0], interestFees: SERIES[3], intervention: SERIES[1], itc: INK.muted };
// Case outcomes: confirmed outcomes in the two strongest hues, then the rest.
export const OUTCOME_COLOR = { 'paid-voluntary': SERIES[0], 'demand-confirmed': BRAND, explained: SERIES[2], 'no-issue': INK.muted, 'data-insufficient': SERIES[3], referred: SERIES[1], procedural: '#b9b8b0' };
// Money at each step of a case: selected -> unresolved -> established -> realised.
export const STEP_COLOR = { selected: '#b9c5e1', unresolved: SERIES[1], established: BRAND, realised: SERIES[5] };
export const CONF_COLOR = { direct: SERIES[5], probable: SERIES[3], unattributed: INK.muted };

export const pctOf = (v, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? '-' : `${(v * 100).toFixed(d)}%`);
export const shortFy = (fy) => String(fy).replace(/^20(\d\d)-(?:20)?(\d\d)$/, '$1-$2');
