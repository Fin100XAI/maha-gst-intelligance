// The case event log of record: an append-only JSON-lines file (one event per line). State is rebuilt by replaying
// the file at start-up and kept in memory; new events are validated, stamped with a sequence number and the server
// time, appended, then applied. Lines are never rewritten or deleted, so the file is the audit trail.
// Tamper evidence: each new event carries prevHash (the previous event's hash) and hash (SHA-256 of prevHash and its
// own content), so editing, removing or reordering a line breaks the chain there. Events written before the chain
// existed are kept, and counted as unchained.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { applyEvent, emptyState, validateEvent, guardEvent } from '../../src/lib/caseEvents.js';

export const hashEvent = (prevHash, ev) => {
  const { hash, ...rest } = ev; // eslint-disable-line no-unused-vars
  return crypto.createHash('sha256').update(`${prevHash}|${JSON.stringify(rest)}`).digest('hex');
};

/**
 * @param {string} dir  folder holding events.jsonl (created if missing)
 * @returns {{ state: object, seq: number, problems: string[], chain: object,
 *             append: (events: object[], now?: Date) => { seq: number }, events: (o?: { limit?: number }) => object[] }}
 */
export function openCaseLog(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'events.jsonl');
  let state = emptyState();
  let seq = 0;
  let lastHash = '';
  const problems = [];
  const chain = { events: 0, unchained: 0, verified: true, brokenAt: null };
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!line.trim()) return;
      try {
        const ev = JSON.parse(line);
        state = applyEvent(state, ev);
        seq = Math.max(seq, ev.seq || 0);
        chain.events += 1;
        if (!ev.hash) { chain.unchained += 1; return; }
        if (chain.verified && (ev.prevHash !== lastHash || hashEvent(ev.prevHash, ev) !== ev.hash)) {
          chain.verified = false;
          chain.brokenAt = ev.seq ?? i + 1;
          problems.push(`events.jsonl line ${i + 1}: hash chain broken (a line was edited, removed or reordered)`);
        }
        lastHash = ev.hash;
      } catch (e) {
        problems.push(`events.jsonl line ${i + 1}: ${e.message}`); // kept in the file, skipped in the state
      }
    });
  }
  return {
    get state() { return state; },
    get seq() { return seq; },
    problems,
    chain,
    /** Validate every event first (its shape, then the rules on the case as it stands), so a batch is stored whole or not at all. */
    append(events, now = new Date()) {
      if (!Array.isArray(events) || !events.length) throw Object.assign(new Error('no events'), { status: 400 });
      let trial = state;
      events.forEach((ev, i) => {
        const why = validateEvent(ev);
        if (why) throw Object.assign(new Error(`event ${i + 1}: ${why}`), { status: 400 });
        const not = guardEvent(trial, ev);
        if (not) throw Object.assign(new Error(not), { status: 409 });
        trial = applyEvent(trial, ev);
      });
      let prev = lastHash;
      const stamped = events.map((ev) => {
        const e = { ...ev, seq: seq + 1, receivedAt: now.toISOString(), prevHash: prev };
        e.hash = hashEvent(prev, e);
        prev = e.hash;
        seq += 1;
        return e;
      });
      let next = state;
      for (const ev of stamped) next = applyEvent(next, ev);
      fs.appendFileSync(file, stamped.map((ev) => JSON.stringify(ev)).join('\n') + '\n');
      state = next;
      lastHash = prev;
      chain.events += stamped.length;
      return { seq };
    },
    /** The stored events, newest first: the audit trail as written. */
    events({ limit = 500 } = {}) {
      if (!fs.existsSync(file)) return [];
      return fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim())
        .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).reverse().slice(0, limit);
    },
  };
}
