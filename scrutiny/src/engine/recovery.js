// Recovery intelligence (capability 26). Pure: no I/O, no clock (asOf is passed in).
// Established demands only (the demands register, linked to cases where the case register says so). Prioritises
// items for authorised follow-up by a published rule; it suggests, the officer decides, and nothing here initiates
// recovery.

const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const addMonths = (iso, n) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };

export const SEGMENTS = {
  now: { label: 'Recoverable now', note: 'No appeal or stay stands in the way' },
  blocked: { label: 'Not recoverable yet', note: 'Within the appeal period, under appeal, or stayed' },
  settled: { label: 'Settled', note: 'Paid or closed' },
};
/** The published priority rule: points, highest first. */
export const PRIORITY_RULE = [
  ['Outstanding ₹1 Cr or more', 3], ['Outstanding ₹10 L or more', 2], ['Any other amount outstanding', 1],
  ['Stalled: no payment for 90 days, or an instalment missed for 60', 2], ['Order more than a year old', 1],
  ['Taxpayer suspended or cancelled (flight risk)', 2], ['Appeal period over, stage not updated', 1],
];
const APPEAL_MONTHS = 3;

/**
 * @param {{ demands: object[], cases?: object[], master?: object[], asOf: string }} o
 */
export function recoveryWorklist({ demands, cases = [], master = [], asOf }) {
  const rows = demands.map((d) => {
    const total = (d.tax || 0) + (d.interest || 0) + (d.penalty || 0);
    const outstanding = Math.max(0, total - (d.paid || 0));
    const appealEnds = addMonths(d.orderDate, APPEAL_MONTHS);
    const windowOver = d.stage === 'Appeal period' && appealEnds < asOf;
    const segment = ['Paid', 'Closed'].includes(d.stage) || outstanding === 0 ? 'settled'
      : ['Recovery', 'Instalments'].includes(d.stage) || windowOver ? 'now' : 'blocked';
    const sinceOrder = days(d.orderDate, asOf);
    const sincePay = d.lastPaymentDate ? days(d.lastPaymentDate, asOf) : null;
    const stalled = segment === 'now' && ((d.stage === 'Instalments' && (sincePay ?? sinceOrder) > 60) || (sincePay ?? sinceOrder) > 90);
    const tp = master.find((m) => m.gstin === d.gstin);
    const flight = tp && ['Suspended', 'Cancelled'].includes(tp.status);
    const caseRow = cases.find((c) => c.events.some((e) => e.ref === d.demandId));
    const points = [];
    if (segment !== 'settled') {
      points.push(outstanding >= 1e7 ? PRIORITY_RULE[0] : outstanding >= 1e6 ? PRIORITY_RULE[1] : PRIORITY_RULE[2]);
      if (stalled) points.push(PRIORITY_RULE[3]);
      if (sinceOrder > 365) points.push(PRIORITY_RULE[4]);
      if (flight) points.push(PRIORITY_RULE[5]);
      if (windowOver) points.push(PRIORITY_RULE[6]);
    }
    const next = segment === 'settled' ? 'None: settled.'
      : windowOver ? `The ${APPEAL_MONTHS}-month appeal period ended on ${appealEnds} and no appeal is recorded: confirm on the portal, then update the stage to recovery.`
        : d.stage === 'Instalments' && stalled ? `Instalments stopped after ${d.lastPaymentDate}: review the instalment order and issue a reminder.`
          : d.stage === 'Recovery' && flight ? 'Registration suspended or cancelled: consider attachment of bank accounts or property (s.79), with approval.'
            : d.stage === 'Recovery' && stalled ? 'No payment since the order: issue a recovery reminder; if unanswered, consider s.79 measures.'
              : d.stage === 'Under appeal' ? 'Track the appeal; nothing to recover while it is pending beyond the pre-deposit.'
                : d.stage === 'Stayed' ? 'Stayed: monitor the stay.'
                  : d.stage === 'Appeal period' ? `Appeal period runs to ${appealEnds}.` : 'Follow up.';
    return {
      demandId: d.demandId, gstin: d.gstin, name: tp?.legalName || d.gstin, fy: d.fy, section: d.section, orderDate: d.orderDate, stage: d.stage, blocker: d.blocker || '',
      tax: d.tax || 0, interest: d.interest || 0, penalty: d.penalty || 0, total, paid: d.paid || 0, outstanding, lastPaymentDate: d.lastPaymentDate || null,
      sinceOrder, sincePay, appealEnds, windowOver, segment, stalled, flight, taxpayerStatus: tp?.status || null,
      caseId: caseRow?.id || null, caseRef: d.caseRef || '', priority: sum(points, (p) => p[1]), because: points.map((p) => p[0]), next,
    };
  }).sort((a, b) => b.priority - a.priority || b.outstanding - a.outstanding);
  const seg = (k) => rows.filter((r) => r.segment === k);
  const bucket = (r) => (r.sinceOrder <= 90 ? '0-90 days' : r.sinceOrder <= 180 ? '91-180 days' : r.sinceOrder <= 365 ? '181-365 days' : 'Over a year');
  const buckets = ['0-90 days', '91-180 days', '181-365 days', 'Over a year'];
  return {
    asOf, rows,
    totals: { demand: sum(rows, (r) => r.total), paid: sum(rows, (r) => r.paid), outstanding: sum(rows, (r) => r.outstanding), now: sum(seg('now'), (r) => r.outstanding), blocked: sum(seg('blocked'), (r) => r.outstanding), stalled: sum(rows.filter((r) => r.stalled), (r) => r.outstanding) },
    byStage: [...new Set(rows.map((r) => r.stage))].map((s) => ({ stage: s, outstanding: sum(rows.filter((r) => r.stage === s), (r) => r.outstanding), paid: sum(rows.filter((r) => r.stage === s), (r) => r.paid), count: rows.filter((r) => r.stage === s).length })),
    ageing: buckets.map((b) => ({ bucket: b, now: sum(seg('now').filter((r) => bucket(r) === b), (r) => r.outstanding), blocked: sum(seg('blocked').filter((r) => bucket(r) === b), (r) => r.outstanding) })),
  };
}
