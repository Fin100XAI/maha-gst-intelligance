/* ---------------------------------------------------------------------------
 * CASE DIGITAL TWIN
 *
 * One intelligence object per taxpayer, assembled from every system that holds
 * a piece of them. The promise it has to keep:
 *
 *   one taxpayer -> one chronology -> one exposure -> one legal position
 *                -> one priority -> one recommended next action
 *
 * WHAT MAKES THIS A TWIN RATHER THAN A PROFILE PAGE
 *
 * Every fact carries the system it came from and the date it was true. A
 * profile page shows a turnover figure; a twin shows that the figure came from
 * GSTN Returns as at a stated date, which is what lets an officer defend a
 * decision built on it — and what lets a reviewer find the error when there is
 * one. `fact()` below is therefore not ceremony; it is the whole point.
 *
 * HONESTY ABOUT COVERAGE
 *
 * A real deployment joins GSTN, the e-way bill system, SAP and e-Office. This
 * build has none of those connections, so `sourceCoverage` states per system
 * whether it is connected, and every twin reports which parts of itself are
 * therefore missing. A twin that quietly renders an empty section looks
 * complete; one that names the absent feed can be trusted.
 * ------------------------------------------------------------------------- */

import {
  TAXPAYERS, NOTICES, AUDIT_CASES, REFUND_CASES, LITIGATION_CASES,
  COMPLIANCE_ALERTS, NETWORK_CLUSTERS, AUDIT_LOG, REFERENCE_DATE_ISO
} from './mockData.js'
import { LIMITATION_REGISTER } from './statutory.js'
import { RECOVERY_CASES } from './recovery.js'

/* The systems a production deployment would draw on. `connected` is the truth
 * about THIS build — nothing here is integrated, and the UI says so rather than
 * implying an empty section means an empty record. */
export const SOURCE_SYSTEMS = {
  registry: { label: 'GST Registration', owner: 'GSTN', connected: false },
  returns: { label: 'GSTN Returns (GSTR-1 / 3B / 2B)', owner: 'GSTN', connected: false },
  eway: { label: 'e-Way Bill', owner: 'NIC', connected: false },
  bo: { label: 'GSTN Back Office — notices & orders', owner: 'GSTN', connected: false },
  sap: { label: 'Departmental ERP', owner: 'SAP', connected: false },
  eoffice: { label: 'File movement & approvals', owner: 'NIC e-Office', connected: false },
  platform: { label: 'Derived by this platform', owner: 'Maha GST Intelligence', connected: true }
}

// A value that knows where it came from and when it was true.
const fact = (value, source, asOf = REFERENCE_DATE_ISO) => ({ value, source, asOf })

const byGstin = new Map(TAXPAYERS.map(t => [t.gstin, t]))

/* ---------------------------------------------------------------------------
 * The chronology — the single most useful thing the twin produces.
 *
 * An officer today reconstructs this by hand across five systems. Merging the
 * events into one ordered list, each stamped with its source, is what removes
 * that work. Events are typed so the UI can weight them: a statutory deadline
 * is not the same kind of thing as a page view.
 * ------------------------------------------------------------------------- */
function buildChronology(tp, ctx) {
  const events = []
  /* An event's title and detail are {0} templates with their arguments
     alongside, never assembled sentences: a string built here can never match
     a catalogue key and would reach an officer in English on a Marathi or
     Hindi timeline. */
  const push = (date, kind, title, detail, source, titleArgs = [], detailArgs = []) => {
    if (date) events.push({ date, kind, title, titleArgs, detail, detailArgs, source })
  }

  push(tp.registrationDate, 'registration', 'GST registration granted',
    '{0} registered in {1}', 'registry', [], [tp.legalName, tp.district])

  ctx.notices.forEach(n => {
    push(n.issuedOn, 'notice', '{0} issued', 'Status: {0}', 'bo', [n.type], [n.status])
  })

  ctx.audit.forEach(c => {
    push(c.openedOn, 'proceeding', 'Audit case opened', '{0} — stage {1}', 'bo', [], [c.id, c.stage])
  })

  ctx.refunds.forEach(r => {
    push(r.filedOn, 'refund', 'Refund claim filed', '{0} — ₹{1} L, {2}', 'returns', [],
      [r.id, (r.claimedAmount / 100000).toFixed(1), r.status])
  })

  ctx.litigation.forEach(l => {
    push(l.filedOn, 'litigation', 'Appeal filed', '{0} — {1}', 'bo', [], [l.issue, l.stage])
  })

  ctx.alerts.forEach(a => {
    push(a.raisedOn, 'signal', 'Compliance alert raised', a.type, 'platform')
  })

  // Officer activity on this taxpayer's cases, from the audit trail.
  ctx.officerActions.forEach(l => {
    push(l.timestamp.slice(0, 10), 'officer', l.action, '{0} — {1}', 'eoffice', [], [l.user, l.role])
  })

  // The statutory clock is an event in its own right, and usually the one that
  // matters most on the timeline.
  if (ctx.limitation) {
    push(ctx.limitation.bindingDate, 'deadline',
      '{0} deadline — {1}', ctx.limitation.basis, 'platform',
      [ctx.limitation.bindingLabel, ctx.limitation.section.replace('s', 'Section ')],
      ctx.limitation.basisArgs || [])
  }

  return events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/* ---------------------------------------------------------------------------
 * The recommended next action.
 *
 * Deliberately one action, with the reason that produced it. A twin that offers
 * five options has handed the prioritisation problem back to the officer, which
 * is the problem it exists to solve. Statute outranks everything: a deadline is
 * the only input here that is not a judgement.
 * ------------------------------------------------------------------------- */
function nextAction(tp, ctx) {
  const lim = ctx.limitation
  if (lim && lim.daysRemaining >= 0 && lim.daysRemaining <= 30) {
    return {
      action: 'Issue {0} before {1}',
      actionArgs: [lim.bindingLabel.toLowerCase(), lim.bindingDate],
      urgency: 'critical',
      because:
        '{0} days remain on the {1} clock. After that the demand is extinguished by operation of law.',
      becauseArgs: [lim.daysRemaining, lim.section.replace('s', 'Section ')],
      basis: 'statute'
    }
  }
  if (lim && lim.daysRemaining < 0) {
    return {
      action: 'Review for closure — statutory period has expired',
      urgency: 'barred',
      because:
        'The {0} deadline of {1} has passed. No demand can now be raised for this period.',
      becauseArgs: [lim.bindingLabel.toLowerCase(), lim.bindingDate],
      basis: 'statute'
    }
  }
  const rec = ctx.recovery
  if (rec && rec.decayNextWeek > 200000) {
    return {
      action: 'Prioritise for officer review this week',
      urgency: 'urgent',
      because:
        '₹{0} L of recoverable value is forecast to decay if this case is untouched for another seven days.',
      becauseArgs: [(rec.decayNextWeek / 100000).toFixed(1)],
      basis: 'model'
    }
  }
  if (ctx.audit.some(c => c.stage !== 'Closed')) {
    return {
      action: 'Continue existing audit proceeding',
      urgency: 'routine',
      because: 'An audit case is already open and within its statutory window.',
      basis: 'record'
    }
  }
  return {
    action: 'No action required this cycle',
    urgency: 'clear',
    because: 'No statutory deadline is near and no signal currently exceeds the review threshold.',
    basis: 'record'
  }
}

/* ---------------------------------------------------------------------------
 * Assemble one twin.
 * ------------------------------------------------------------------------- */
export function buildCaseTwin(gstin) {
  const tp = byGstin.get(gstin)
  if (!tp) return null

  const notices = NOTICES.filter(n => n.gstin === gstin)
  const audit = AUDIT_CASES.filter(c => c.gstin === gstin)
  const refunds = REFUND_CASES.filter(r => r.gstin === gstin)
  const litigation = LITIGATION_CASES.filter(l => l.gstin === gstin)
  const alerts = COMPLIANCE_ALERTS.filter(a => a.gstin === gstin)
  const limitation = LIMITATION_REGISTER.find(r => r.gstin === gstin) || null
  const recovery = RECOVERY_CASES.find(r => r.gstin === gstin) || null
  const auditCaseIds = new Set(audit.map(c => c.id))
  const officerActions = AUDIT_LOG.filter(l => auditCaseIds.has(l.caseId))
  const cluster = NETWORK_CLUSTERS.find(c => c.nodes.some(n => n.gstin === gstin)) || null

  const ctx = { notices, audit, refunds, litigation, alerts, limitation, recovery, officerActions }

  return {
    gstin,
    identity: {
      legalName: fact(tp.legalName, 'registry'),
      tradeName: fact(tp.tradeName, 'registry'),
      registeredOn: fact(tp.registrationDate, 'registry'),
      district: fact(tp.district, 'registry'),
      division: fact(tp.division, 'registry'),
      sector: fact(tp.sector, 'registry'),
      address: fact(tp.address, 'registry'),
      filingStatus: fact(tp.filingStatus, 'returns'),
      complianceHistory: fact(tp.complianceHistory, 'bo')
    },
    financial: {
      monthlyTurnover: fact(tp.monthlyTurnover, 'returns'),
      taxPaid: fact(tp.taxPaid, 'returns'),
      itcClaimed: fact(tp.itcClaimed, 'returns'),
      refundClaimed: fact(tp.refundClaimed, 'returns'),
      ewayBillValue: fact(tp.ewayBillValue, 'eway')
    },
    // One exposure figure, and what is still realistically behind it.
    position: {
      exposure: fact(tp.estimatedRevenueExposure, 'platform'),
      recoverableNow: recovery ? fact(recovery.recoverableNow, 'platform') : null,
      decayNextWeek: recovery ? fact(recovery.decayNextWeek, 'platform') : null,
      signalAgeDays: recovery ? fact(recovery.daysSinceSignal, 'platform') : null,
      riskScore: fact(tp.risk.score, 'platform'),
      riskCategory: fact(tp.risk.category, 'platform'),
      triggeredRules: tp.risk.triggeredRules || []
    },
    // The legal position, which is the part a reviewer will test hardest.
    legal: limitation
      ? {
          fy: limitation.fy,
          section: limitation.section,
          bindingLabel: limitation.bindingLabel,
          bindingDate: limitation.bindingDate,
          daysRemaining: limitation.daysRemaining,
          urgency: limitation.urgency,
          basis: limitation.basis,
          sources: limitation.sources,
          contested: limitation.contested
        }
      : null,
    proceedings: { notices, audit, refunds, litigation, alerts },
    network: cluster
      ? {
          clusterId: cluster.id,
          entityCount: cluster.nodes.length,
          role: cluster.nodes.find(n => n.gstin === gstin)?.role || 'Counterparty',
          sharedAddress: cluster.sharedAddress,
          sharedContact: cluster.sharedContact
        }
      : null,
    chronology: buildChronology(tp, ctx),
    nextAction: nextAction(tp, ctx),
    // Which systems actually contributed to this twin, and which did not.
    coverage: Object.entries(SOURCE_SYSTEMS).map(([key, sys]) => ({
      key,
      ...sys,
      contributed: key === 'platform'
        ? true
        : key === 'eoffice'
          ? officerActions.length > 0
          : key === 'bo'
            ? notices.length + audit.length + litigation.length > 0
            : key === 'sap'
              ? false
              : true
    }))
  }
}

// Browsable list — the taxpayers that actually have something to look at,
// ordered by how urgent their next action is.
const URGENCY_ORDER = { critical: 0, barred: 1, urgent: 2, routine: 3, clear: 4 }

export const TWIN_INDEX = TAXPAYERS
  .map(t => {
    const lim = LIMITATION_REGISTER.find(r => r.gstin === t.gstin)
    const rec = RECOVERY_CASES.find(r => r.gstin === t.gstin)
    return {
      gstin: t.gstin,
      tradeName: t.tradeName,
      district: t.district,
      division: t.division,
      sector: t.sector,
      riskCategory: t.risk.category,
      riskScore: t.risk.score,
      exposure: t.estimatedRevenueExposure,
      daysRemaining: lim ? lim.daysRemaining : null,
      recoverableNow: rec ? rec.recoverableNow : null,
      systemsHolding: [
        NOTICES.some(n => n.gstin === t.gstin) && 'bo',
        AUDIT_CASES.some(c => c.gstin === t.gstin) && 'bo',
        REFUND_CASES.some(r => r.gstin === t.gstin) && 'returns',
        LITIGATION_CASES.some(l => l.gstin === t.gstin) && 'bo',
        COMPLIANCE_ALERTS.some(a => a.gstin === t.gstin) && 'platform'
      ].filter(Boolean).length
    }
  })
  .sort((a, b) => {
    const ax = a.daysRemaining === null ? 9999 : a.daysRemaining
    const bx = b.daysRemaining === null ? 9999 : b.daysRemaining
    if (ax !== bx) return ax - bx
    return b.exposure - a.exposure
  })

/* ---------------------------------------------------------------------------
 * STATUTORY POSITION INDEX
 *
 * The twin's single most consequential judgment, made available to every screen
 * that lists a proceeding — without building a whole twin per table row, which
 * is why this is a Map rather than a call.
 *
 * WHY THIS EXISTS
 *
 * The twin and the operational screens read the same underlying records, so
 * their raw fields cannot disagree. What they disagreed about was the verdict:
 * 7 of the 8 taxpayers whose limitation period has expired still carry open
 * audit cases and unconcluded notices. The twin says "review for closure — the
 * statutory period has expired"; the audit queue showed the same case as live
 * work with an officer assigned and a next stage to advance to.
 *
 * That is not a cosmetic inconsistency. An officer working one of those cases
 * is spending capacity on a demand that can no longer lawfully be raised, and
 * nothing on the screen told them so. Propagating this one verdict is worth
 * more than routing every field through the twin, because it is the only
 * judgment that changes what an officer does today.
 * ------------------------------------------------------------------------- */
export const STATUTORY_INDEX = new Map(
  LIMITATION_REGISTER.map(r => [r.gstin, {
    gstin: r.gstin,
    fy: r.fy,
    section: r.section,
    sectionLabel: r.section.replace('s', 'Section '),
    bindingDate: r.bindingDate,
    bindingLabel: r.bindingLabel,
    daysRemaining: r.daysRemaining,
    daysOverdue: r.daysRemaining < 0 ? Math.abs(r.daysRemaining) : 0,
    barred: r.daysRemaining < 0,
    critical: r.daysRemaining >= 0 && r.daysRemaining <= 30,
    urgency: r.urgency,
    contested: !!r.contested,
    exposure: r.exposure,
    // Written as the officer needs to read it, not as a status code.
    verdictMsg: r.daysRemaining < 0
      ? {
          key: 'The {0} deadline of {1} for {2} under {3} passed {4} days ago. No demand can now be raised for this period.',
          args: [r.bindingLabel.toLowerCase(), r.bindingDate, r.fy, r.section.replace('s', 'Section '), Math.abs(r.daysRemaining)]
        }
      : {
          key: '{0} days remain to the {1} deadline of {2} for {3} under {4}.',
          args: [r.daysRemaining, r.bindingLabel.toLowerCase(), r.bindingDate, r.fy, r.section.replace('s', 'Section ')]
        }
  }])
)

export const statutoryPositionFor = gstin => STATUTORY_INDEX.get(gstin) || null

/* Summarise a list of open proceedings against the statutory clock. Returns
 * null when there is nothing to warn about, so a caller can render nothing
 * rather than an all-clear banner nobody needs. */
export function statutoryReviewOf(records, gstinOf = r => r.gstin) {
  const seen = new Set()
  const barred = []
  const critical = []
  records.forEach(rec => {
    const g = gstinOf(rec)
    const pos = STATUTORY_INDEX.get(g)
    if (!pos || seen.has(g)) return
    seen.add(g)
    if (pos.barred) barred.push({ ...pos, record: rec })
    else if (pos.critical) critical.push({ ...pos, record: rec })
  })
  if (!barred.length && !critical.length) return null
  return {
    barred,
    critical,
    barredExposure: barred.reduce((s, b) => s + b.exposure, 0),
    criticalExposure: critical.reduce((s, c) => s + c.exposure, 0)
  }
}
