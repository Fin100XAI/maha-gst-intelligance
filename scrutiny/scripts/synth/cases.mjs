// Synthetic case action register for the ward: the department's own case lifecycle log (selection, notice, reply,
// hearing, show cause, order, payment, appeal, recovery, closure), as a case-management export would give it.
// Story cases tie to the ward's EIU signals, replies and DRC-07 demands; the rest are generated with planted
// patterns so the action-yield, effort and learning views have something true to find:
//   - credit-note / revenue-decline cases: many reply rounds and hearings, mostly closed as explained (low yield)
//   - non-filing cases: short, mostly closed by voluntary payment (high conversion)
//   - risky-ITC-network cases: long, heavy, end in demands that go to appeal (established but not realised)
// Deterministic: its own random stream (seed 4242), so the returns workbooks are unaffected.
import { makeRng, addDays } from './lib.mjs';

export const AS_OF = '2026-09-26';
const RISK = {
  itc: { label: 'ITC mismatch (B-01)', rule: 'B-01', source: 'Scrutiny', amount: [1e5, 1.5e6], outcomes: [['paid-voluntary', 0.55], ['explained', 0.25], ['demand-confirmed', 0.2]], replies: [1, 2], hearings: [0, 1], reason: 'documents produced' },
  liability: { label: 'Liability mismatch (G-02)', rule: 'G-02', source: 'Scrutiny', amount: [1e5, 1.2e6], outcomes: [['explained', 0.5], ['paid-voluntary', 0.4], ['no-issue', 0.1]], replies: [1, 1], hearings: [0, 0], reason: 'declared in a later return' },
  nonFiling: { label: 'Non-filing (A-02)', rule: 'A-02', source: 'Return risk', amount: [2e5, 2.5e6], outcomes: [['paid-voluntary', 0.7], ['demand-confirmed', 0.3]], replies: [0, 1], hearings: [0, 0], reason: 'returns filed after notice' },
  decline: { label: 'Credit notes / revenue decline', rule: null, source: 'Return risk', amount: [5e5, 4e6], outcomes: [['explained', 0.8], ['no-issue', 0.2]], replies: [3, 4], hearings: [2, 3], reason: 'genuine business reason' },
  rcm: { label: 'Reverse charge (C-01)', rule: 'C-01', source: 'Scrutiny', amount: [2e4, 3e5], outcomes: [['paid-voluntary', 0.6], ['explained', 0.4]], replies: [1, 1], hearings: [0, 0], reason: 'RCM paid in a later month' },
  einvoice: { label: 'E-invoice (G-03)', rule: 'G-03', source: 'Return risk', amount: [0, 0], outcomes: [['no-issue', 0.7], ['procedural', 0.3]], replies: [0, 1], hearings: [0, 0], reason: 'IRN found on the portal' },
  network: { label: 'Risky ITC network', rule: null, source: 'EIU', amount: [4e6, 1.5e7], outcomes: [['demand-confirmed', 0.5], ['referred', 0.5]], replies: [2, 3], hearings: [3, 4], reason: null },
};
const EXPLAIN_REASONS = { decline: ['credit notes for returns', 'branch transfer', 'lost customer', 'rate change', 'seasonal timing'] };

/**
 * @param {{ E: object, W: object[], eiu: any[][], dmy: (d: string) => string }} ward
 * @returns {{ rows: any[][], demands: any[][], expect: object }}
 */
export function buildCaseLog({ E, W }) {
  const g = makeRng(4242);
  const rows = [];
  const demands = [];
  const cases = [];
  const ev = (c, event, date, extra = {}) => rows.push({ caseId: c.id, gstin: c.gstin, fy: c.fy, source: c.source, riskType: c.riskType, signalId: c.signalId || '', event, date, amount: extra.amount ?? '', officer: extra.officer ?? c.officer, ref: extra.ref || '', outcome: extra.outcome || '', reason: extra.reason || '', note: extra.note || '' });
  const open = (id, key, fy, source, riskType, selected, date, extra = {}) => { const c = { id, gstin: E[key].gstin, key, fy, source, riskType, officer: E[key].officer, signalId: extra.signalId, selected }; cases.push(c); ev(c, 'selected', date, { amount: selected }); return c; };
  const demand = (id, c, section, orderDate, tax, interest, penalty, paid, lastPay, stage, blocker, caseRef) => demands.push([id, c.gstin, caseRef || '', c.fy, section, dmyOf(orderDate), tax, interest, penalty, paid, lastPay ? dmyOf(lastPay) : '', stage, blocker]);

  // ---------------------------------------------------------------- story cases (the ward's DRC-07 demands)
  let c = open('SCR-2023-001', 'E06', '2022-23', 'Scrutiny', RISK.itc.label, 1000000, '2023-06-10');
  ev(c, 'assigned', '2023-06-12'); ev(c, 'notice', '2023-07-05', { ref: 'ASMT-10/PUNE-WARD-01/ZZWFW/20230705' }); ev(c, 'reply', '2023-08-02'); ev(c, 'hearing', '2023-09-12');
  ev(c, 'scn', '2023-11-20', { amount: 850000, ref: 'DRC-01/2023/0441' }); ev(c, 'order', '2024-03-14', { amount: 1055000, ref: 'DRC07-2024-0011', note: 'tax 8,50,000 + interest 1,20,000 + penalty 85,000' });
  ev(c, 'payment', '2024-06-28', { amount: 1055000, ref: 'DRC07-2024-0011', note: 'paid against the order' }); ev(c, 'closed', '2024-07-15', { outcome: 'demand-confirmed' });
  demand('DRC07-2024-0011', c, '73', '2024-03-14', 850000, 120000, 85000, 1055000, '2024-06-28', 'Paid', '');

  c = open('SCR-2024-004', 'E13', '2023-24', 'Scrutiny', RISK.liability.label, 2400000, '2024-10-01');
  ev(c, 'assigned', '2024-10-03'); ev(c, 'notice', '2024-11-20', { ref: 'ASMT-10/PUNE-WARD-01/ZZDFD/20241120' }); ev(c, 'reply', '2024-12-18'); ev(c, 'reply', '2025-01-20', { note: 'second reply after hearing notice' }); ev(c, 'hearing', '2025-02-11');
  ev(c, 'scn', '2025-02-28', { amount: 2100000, ref: 'DRC-01/2025/0112' }); ev(c, 'order', '2025-04-22', { amount: 2620000, ref: 'DRC07-2025-0019', note: 'tax 21,00,000 + interest 3,10,000 + penalty 2,10,000' });
  for (const d of ['2025-04-30', '2025-05-15', '2025-06-15', '2025-07-15', '2025-08-15']) ev(c, 'payment', d, { amount: 200000, ref: 'DRC07-2025-0019', note: 'instalment' });
  demand('DRC07-2025-0019', c, '73', '2025-04-22', 2100000, 310000, 210000, 1000000, '2025-08-15', 'Instalments', 'Monthly instalments of ₹2 L approved', 'ASMT-10/PUNE-WARD-01/ZZDFD/20241120');

  c = open('SCR-2024-007', 'E08', '2023-24', 'EIU', RISK.network.label, 12000000, '2024-08-01');
  ev(c, 'assigned', '2024-08-05'); ev(c, 'notice', '2025-01-10', { ref: 'ASMT-10/PUNE-WARD-01/ZZSFS/20250110' }); ev(c, 'reply', '2025-02-05'); ev(c, 'hearing', '2025-02-25'); ev(c, 'hearing', '2025-03-18');
  ev(c, 'scn', '2025-03-28', { amount: 9600000, ref: 'DRC-01/2025/0140' }); ev(c, 'order', '2025-05-30', { amount: 20650000, ref: 'DRC07-2025-0027', note: 'tax 96,00,000 + interest 14,50,000 + penalty 96,00,000 (s.74)' });
  ev(c, 'appeal', '2025-08-20', { amount: 960000, ref: 'APL-01/2025/0077', note: '10% pre-deposit (a deposit, not realised revenue)' });
  demand('DRC07-2025-0027', c, '74', '2025-05-30', 9600000, 1450000, 9600000, 0, '', 'Under appeal', 'Appeal filed before the Appellate Authority; 10% pre-deposit made', 'ASMT-10/PUNE-WARD-01/ZZSFS/20250110');

  c = open('SCR-2024-009', 'E09', '2023-24', 'Scrutiny', RISK.network.label, 6400000, '2024-09-10');
  ev(c, 'assigned', '2024-09-12'); ev(c, 'notice', '2024-10-15', { ref: 'ASMT-10/PUNE-WARD-01/ZZSPS/20241015' }); ev(c, 'hearing', '2024-12-05', { note: 'no appearance' });
  ev(c, 'scn', '2025-01-20', { amount: 6400000, ref: 'DRC-01/2025/0031' }); ev(c, 'order', '2025-06-12', { amount: 13780000, ref: 'DRC07-2025-0033', note: 'tax 64,00,000 + interest 9,80,000 + penalty 64,00,000 (s.74)' });
  ev(c, 'recovery', '2025-09-01', { ref: 'DRC-13/2025/0009', note: 'bank account attachment initiated' });
  demand('DRC07-2025-0033', c, '74', '2025-06-12', 6400000, 980000, 6400000, 0, '', 'Recovery', 'Bank account attachment pending; proprietor not traceable at principal place of business');

  c = open('SCR-2025-012', 'E12', '2024-25', 'Return risk', 'Late filing interest', 90000, '2025-10-10');
  ev(c, 'assigned', '2025-10-11'); ev(c, 'notice', '2025-11-12', { ref: 'ASMT-10/PUNE-WARD-01/ZZSPS/20251112' }); ev(c, 'reply', '2025-12-01', { note: 'accepts the interest' });
  ev(c, 'order', '2026-02-18', { amount: 90000, ref: 'DRC07-2026-0004' }); ev(c, 'payment', '2026-03-10', { amount: 90000, ref: 'DRC07-2026-0004' }); ev(c, 'closed', '2026-03-20', { outcome: 'demand-confirmed' });
  demand('DRC07-2026-0004', c, '73', '2026-02-18', 0, 90000, 0, 90000, '2026-03-10', 'Paid', 'Interest on the late Q4 FY 2024-25 return');

  c = open('SCR-2025-015', 'E14', '2024-25', 'Scrutiny', RISK.itc.label, 600000, '2025-11-05');
  ev(c, 'assigned', '2025-11-06'); ev(c, 'notice', '2025-12-10', { ref: 'ASMT-10/PUNE-WARD-01/ZZMFM/20251210' }); ev(c, 'reply', '2026-01-15'); ev(c, 'hearing', '2026-02-20');
  ev(c, 'scn', '2026-03-25', { amount: 500000, ref: 'DRC-01/2026/0058' }); ev(c, 'order', '2026-06-25', { amount: 595000, ref: 'DRC07-2026-0008', note: 'tax 5,00,000 + interest 45,000 + penalty 50,000' });
  demand('DRC07-2026-0008', c, '73', '2026-06-25', 500000, 45000, 50000, 0, '', 'Appeal period', '');

  // ---------------------------------------------------------------- story cases (the ward's EIU signals)
  c = open('EIU-C-0107', 'E07', '2025-26', 'EIU', RISK.network.label, 16588341, '2025-11-20', { signalId: 'EIU-2025-0107' });
  ev(c, 'assigned', '2025-11-28'); ev(c, 'notice', '2025-12-05', { ref: 'ASMT-10/PUNE-WARD-01/ZZTCT/20251205' }); ev(c, 'reply', '2025-12-20', { ref: 'RJA/TIP/2025/77' }); ev(c, 'hearing', '2026-02-10');
  c = open('EIU-C-0112', 'E13', '2024-25', 'EIU', RISK.liability.label, 756000, '2024-09-10', { signalId: 'EIU-2025-0112' });
  ev(c, 'assigned', '2024-09-12'); ev(c, 'notice', '2024-10-01', { ref: 'ASMT-10/PUNE-WARD-01/ZZDFD/20241001' }); ev(c, 'reply', '2025-12-10', { ref: 'SKA/GST/2025/118' });
  ev(c, 'payment', '2026-01-05', { amount: 23000, ref: 'DRC-03/2026/0004', note: 'interest on the late July 2024 tax, paid voluntarily' }); ev(c, 'closed', '2026-01-12', { outcome: 'paid-voluntary', reason: 'declared in a later return' });
  c = open('EIU-C-0115', 'E09', '2025-26', 'EIU', RISK.nonFiling.label, 13409796, '2026-01-15', { signalId: 'EIU-2026-0115' });
  ev(c, 'assigned', '2026-01-16'); ev(c, 'notice', '2026-01-25', { ref: 'ASMT-10/PUNE-WARD-01/ZZSPS/20260125' }); ev(c, 'reply', '2026-03-02', { ref: 'SBE/2026/02' }); ev(c, 'scn', '2026-05-15', { amount: 26850723, ref: 'DRC-01/2026/0091' });
  c = open('EIU-C-0121', 'E05', '2025-26', 'EIU', RISK.decline.label, 8581832, '2025-10-25', { signalId: 'EIU-2025-0121' });
  ev(c, 'assigned', '2025-10-27'); ev(c, 'notice', '2025-11-05', { ref: 'ASMT-10/PUNE-WARD-01/ZZKCK/20251105' }); ev(c, 'reply', '2025-11-18', { ref: 'MPC/KED/2025/41' }); ev(c, 'closed', '2025-12-05', { outcome: 'explained', reason: 'branch transfer' });
  c = open('EIU-C-0126', 'E08', '2024-25', 'EIU', RISK.network.label, 18360000, '2025-06-25', { signalId: 'EIU-2025-0126' });
  ev(c, 'assigned', '2025-06-26'); ev(c, 'notice', '2025-07-02', { ref: 'ASMT-10/PUNE-WARD-01/ZZSFS/20250702' }); ev(c, 'reply', '2025-07-15'); ev(c, 'hearing', '2025-08-12'); ev(c, 'hearing', '2025-09-09');
  ev(c, 'scn', '2025-11-28', { amount: 18360000, ref: 'DRC-01/2025/0203' });
  c = open('EIU-C-0098', 'E15', '2023-24', 'EIU', RISK.itc.label, 64000, '2024-02-15', { signalId: 'EIU-2024-0098' });
  ev(c, 'assigned', '2024-02-16'); ev(c, 'reply', '2024-03-05'); ev(c, 'closed', '2024-03-20', { outcome: 'explained', reason: 'reversed in a later return' });
  c = open('EIU-C-0131', 'E01', '2025-26', 'EIU', RISK.einvoice.label, 0, '2025-12-05', { signalId: 'EIU-2025-0131' });
  ev(c, 'assigned', '2025-12-06'); ev(c, 'reply', '2025-12-15'); ev(c, 'closed', '2025-12-20', { outcome: 'no-issue', reason: 'IRN found on the portal' });

  // ---------------------------------------------------------------- generated cases
  const keys = W.filter((e) => e.key !== 'E16').map((e) => e.key);
  const plan = [['itc', 8], ['liability', 6], ['nonFiling', 6], ['decline', 6], ['rcm', 4], ['einvoice', 3], ['network', 3]];
  const pickOutcome = (outs) => { let u = g.rnd(); for (const [o, p] of outs) { if ((u -= p) <= 0) return o; } return outs[outs.length - 1][0]; };
  const round = (v, to = 1000) => Math.round(v / to) * to;
  let seq = 20, dseq = 40;
  for (const [type, n] of plan) {
    const R = RISK[type];
    for (let i = 0; i < n; i++) {
      const key = type === 'network' ? g.pick(['E07', 'E10', 'E02']) : type === 'decline' ? g.pick(['E04', 'E06', 'E13', 'E14', 'E05', 'E11']) : g.pick(keys);
      const fyStart = g.pick([2023, 2023, 2024, 2024, 2025]);
      const fy = `${fyStart}-${String(fyStart + 1).slice(2)}`;
      const start = addDays(`${fyStart + 1}-06-01`, g.ri(0, 200));
      if (start > AS_OF) continue;
      const amount = R.amount[1] ? round(g.logU(R.amount[0], R.amount[1])) : 0;
      c = open(`SCR-${start.slice(0, 4)}-${String(++seq).padStart(3, '0')}`, key, fy, R.source, R.label, amount, start);
      let d = addDays(start, g.ri(1, 6));
      const step = (lo, hi) => { d = addDays(d, g.ri(lo, hi)); return d; };
      ev(c, 'assigned', d);
      const events = [];
      if (type !== 'einvoice' || g.rnd() < 0.5) events.push(['notice', step(10, 35), { ref: `ASMT-10/PUNE-WARD-01/${E[key].pan.slice(2, 7)}/${d.replace(/-/g, '')}` }]);
      const nReplies = g.ri(...R.replies), nHearings = g.ri(...R.hearings);
      for (let k = 0; k < Math.max(nReplies, nHearings); k++) {
        if (k < nReplies) events.push(['reply', step(15, 40), { note: k ? `reply round ${k + 1}` : '' }]);
        if (k < nHearings) events.push(['hearing', step(14, 35), {}]);
      }
      const outcome = pickOutcome(R.outcomes);
      // Cases opened late may still be open at the extract date.
      const openCase = start > '2026-03-31' && g.rnd() < 0.7;
      for (const [name, date, x] of events) if (date <= AS_OF) ev(c, name, date, x);
      if (openCase || d > AS_OF) continue;
      if (outcome === 'paid-voluntary') {
        const paid = round(amount * (0.7 + 0.3 * g.rnd()), 100);
        ev(c, 'payment', step(7, 30), { amount: paid, ref: `DRC-03/${d.slice(0, 4)}/${String(g.ri(100, 999))}`, note: 'paid voluntarily after notice' });
        ev(c, 'closed', step(5, 20), { outcome, reason: type === 'nonFiling' ? 'returns filed after notice' : 'accepted and paid' });
      } else if (outcome === 'demand-confirmed') {
        const tax = round(amount * (0.6 + 0.4 * g.rnd()));
        const interest = round(tax * 0.12), penalty = type === 'network' ? tax : round(tax * 0.1);
        ev(c, 'scn', step(20, 60), { amount: tax, ref: `DRC-01/${d.slice(0, 4)}/${String(g.ri(100, 999))}` });
        const orderDate = step(60, 120);
        if (orderDate > AS_OF) continue;
        const id = `DRC07-${orderDate.slice(0, 4)}-${String(++dseq).padStart(4, '0')}`;
        ev(c, 'order', orderDate, { amount: tax + interest + penalty, ref: id, note: `tax ${tax} + interest ${interest} + penalty ${penalty}` });
        if (type === 'network') {
          ev(c, 'appeal', step(40, 85), { amount: round(tax * 0.1), ref: `APL-01/${d.slice(0, 4)}/${String(g.ri(100, 999))}`, note: '10% pre-deposit (a deposit, not realised revenue)' });
          demand(id, c, '74', orderDate, tax, interest, penalty, 0, '', 'Under appeal', 'Appeal pending', '');
        } else {
          const full = g.rnd() < 0.6;
          const paid = full ? tax + interest + penalty : round((tax + interest + penalty) * 0.4);
          const payDate = step(20, 90);
          if (payDate <= AS_OF) {
            ev(c, 'payment', payDate, { amount: paid, ref: id, note: full ? 'paid against the order' : 'part payment' });
            if (full) ev(c, 'closed', step(5, 20), { outcome });
            demand(id, c, '73', orderDate, tax, interest, penalty, paid, payDate, full ? 'Paid' : 'Recovery', full ? '' : 'Balance not paid; reminder issued');
          } else demand(id, c, '73', orderDate, tax, interest, penalty, 0, '', 'Appeal period', '');
        }
      } else if (outcome === 'referred') {
        ev(c, 'closed', step(10, 40), { outcome, reason: 'referred to the anti-evasion wing', note: 'network extends beyond the ward' });
      } else {
        const reason = type === 'decline' ? g.pick(EXPLAIN_REASONS.decline) : R.reason;
        ev(c, 'closed', step(7, 30), { outcome, reason });
        if (type === 'decline' && g.rnd() < 0.2) { ev(c, 'reopened', step(60, 120), { note: 'new returns show the decline continuing' }); ev(c, 'closed', step(20, 45), { outcome: 'explained', reason }); }
      }
    }
  }
  rows.sort((a, b) => (a.caseId === b.caseId ? 0 : a.caseId < b.caseId ? -1 : 1) || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const header = ['case_id', 'gstin', 'fy', 'source', 'risk_type', 'signal_id', 'event', 'date', 'amount', 'officer', 'ref', 'outcome', 'reason', 'note'];
  const out = rows.map((r) => [r.caseId, r.gstin, r.fy, r.source, r.riskType, r.signalId, r.event, dmyOf(r.date), r.amount, r.officer, r.ref, r.outcome, r.reason, r.note]);

  // Measured from what was generated (not from the plan), for the answer key.
  const byCase = new Map();
  for (const r of rows) (byCase.get(r.caseId) || byCase.set(r.caseId, []).get(r.caseId)).push(r);
  const closed = [...byCase.values()].filter((es) => es.at(-1).event === 'closed');
  const byRisk = {};
  for (const es of byCase.values()) {
    const k = es[0].riskType;
    const b = (byRisk[k] ||= { cases: 0, closed: 0, confirmed: 0, selected: 0, realised: 0, interactions: 0 });
    b.cases += 1; b.selected += Number(es[0].amount) || 0;
    b.realised += es.filter((e) => e.event === 'payment').reduce((s, e) => s + Number(e.amount), 0);
    b.interactions += es.filter((e) => ['notice', 'reply', 'hearing'].includes(e.event)).length;
    const last = es.filter((e) => e.event === 'closed').at(-1);
    if (es.at(-1).event === 'closed') { b.closed += 1; if (['paid-voluntary', 'demand-confirmed'].includes(last.outcome)) b.confirmed += 1; }
  }
  return {
    header, rows: out, demands,
    expect: {
      asOf: AS_OF, cases: byCase.size, events: rows.length, closed: closed.length, open: byCase.size - closed.length,
      reopened: [...byCase.values()].filter((es) => es.some((e) => e.event === 'reopened')).length,
      byRisk,
      stories: {
        stalledInstalments: { demand: 'DRC07-2025-0019', lastPayment: '2025-08-15' },
        blockedRecovery: { demand: 'DRC07-2025-0033', blocker: 'proprietor not traceable' },
        appealWindowOver: { demand: 'DRC07-2026-0008', orderDate: '2026-06-25', note: 'three months to appeal ended 2026-09-25, a day before the extract' },
        stuckAtShowCause: { caseId: 'EIU-C-0126', since: '2025-11-28' },
        highEffortLowYield: [RISK.decline.label],
        establishedNotRealised: [RISK.network.label],
        fastestConversion: RISK.nonFiling.label,
      },
    },
  };
}
const dmyOf = (d) => d.split('-').reverse().join('-');
