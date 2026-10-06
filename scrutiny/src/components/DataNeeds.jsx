// What a Leadership page needs that the returns do not contain. Those pages read registers uploaded by hand; when one is
// missing the page would otherwise just look thin, so it says which register is missing, what it adds, and where to
// upload it. Silent when everything the page uses is loaded.
import React from 'react';
import Icon from './Icon.jsx';
import { REGISTERS } from '../engine/registers.js';

// Registers each page reads, and what each one adds to that page
export const PAGE_NEEDS = {
  overview: { master: 'jurisdiction, range and officer of each taxpayer', eiu: 'EIU signals to act on', caselog: 'open cases and their stage', demands: 'demands awaiting recovery' },
  collections: { master: 'which taxpayers belong to the jurisdiction', targets: 'the target line and the gap to it' },
  targets: { master: 'which taxpayers belong to the jurisdiction', targets: 'the approved targets themselves' },
  actions: { caselog: 'every case step: notices, replies, orders, payments' },
  recovery: { demands: 'established demands and what has been recovered' },
  learning: { caselog: 'how cases closed, to learn which signals pay off', eiu: 'the EIU signals behind the cases' },
};

export function DataNeeds({ page, registers, go }) {
  const needs = PAGE_NEEDS[page];
  if (!needs) return null;
  if (registers === null) return <div className="data-needs">Registers need the server store (dev server or server.mjs): this page shows only what the returns contain.</div>;
  if (!registers) return null; // still loading
  const missing = Object.keys(needs).filter((t) => !registers[t]?.records?.length);
  if (!missing.length) return null;
  return (
    <div className="data-needs" role="note">
      <Icon name="alert" size={16} />
      <div className="grow">
        <b>{missing.length === Object.keys(needs).length ? 'This page has no register data yet.' : 'Part of this page is empty.'}</b>{' '}
        Missing: {missing.map((t, i) => <span key={t}>{i ? '; ' : ''}<b>{REGISTERS[t].title}</b> ({needs[t]})</span>)}.
      </div>
      {go && <button className="btn small" onClick={() => go('data')}>Upload registers</button>}
    </div>
  );
}
