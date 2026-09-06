/* ---------------------------------------------------------------------------
 * COMMAND BOARD — operational conditions, not a directory
 *
 * A command centre does not list what exists. It states what is happening, how
 * serious it is, and what decision it needs — the way an operations room reads,
 * where every line is a condition somebody has to act on or consciously accept.
 *
 * Each condition below is derived from the engine that owns it and carries four
 * things: the severity, the value at stake, the decision it demands, and who
 * has to take it. A line with no decision attached is a statistic, and
 * statistics belong on the analytics screens rather than here.
 *
 * SEVERITY MEANS IRREVERSIBILITY, NOT SIZE
 *
 * Critical is reserved for loss that is happening now and cannot be undone —
 * a period that has expired, or one about to expire with nobody able to act.
 * A larger sum that can still be recovered next month is High, not Critical.
 * Ranking by rupee value would put the recoverable above the irrecoverable and
 * teach exactly the wrong reflex.
 * ------------------------------------------------------------------------- */

import { LIMITATION_SUMMARY } from './statutory.js'
import { RECOVERY_PORTFOLIO } from './recovery.js'
import { COMMAND_SUMMARY } from './commandCentre.js'
import { CAPACITY_RESULT } from './capacity.js'
import { NETWORK_ACTION_SUMMARY } from './networkAction.js'
import { COUNTERFACTUAL_SUMMARY, REVISIT_SUMMARY } from './retrospective.js'
import { questionStatus } from './precedent.js'
import { AUDIT_CASES } from './mockData.js'
import { statutoryReviewOf } from './caseTwin.js'

export const SEVERITY = {
  critical: { id: 'critical', label: 'Critical', rank: 0, tone: 'red', meaning: 'Loss is happening now and cannot be undone.' },
  high: { id: 'high', label: 'High', rank: 1, tone: 'orange', meaning: 'Significant value at risk from a cause the department controls.' },
  watch: { id: 'watch', label: 'Watch', rank: 2, tone: 'amber', meaning: 'Needs monitoring, or turns on something outside the department’s control.' }
}

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const auditReview = statutoryReviewOf(AUDIT_CASES.filter(c => c.stage !== 'Closed'))
const q168a = questionStatus('q_168a')

/* Conditions. Ordered by severity, then by value within it. */
export const CONDITIONS = [
  {
    id: 'barred',
    severity: 'critical',
    condition: `${LIMITATION_SUMMARY.barredCount} proceedings are past their limitation date`,
    detail: 'The statutory period has expired. No demand can now be raised for these periods however the case is worked, and the amount is not recoverable by any action available to the department.',
    value: LIMITATION_SUMMARY.barredCr * 10000000,
    valueLabel: 'unrecoverable',
    decision: 'Close them formally and record why each was missed, so the same failure is visible next quarter rather than repeated.',
    owner: 'Divisional Joint Commissioner',
    target: 'statutory-time'
  },
  {
    id: 'barred_in_queue',
    severity: 'critical',
    condition: auditReview ? `${auditReview.barred.length} of the open audit queue sit on periods already time-barred` : 'Audit queue clear of time-barred periods',
    detail: 'Officers are assigned to cases where no recoverable demand can be raised. Every day spent on these is a day not spent on a case that is still live.',
    value: auditReview ? auditReview.barredExposure : 0,
    valueLabel: 'committed to dead cases',
    decision: 'Withdraw them from the queue this week and reassign the capacity.',
    owner: 'Divisional Joint Commissioner',
    target: 'audit-scrutiny',
    suppressIf: () => !auditReview || auditReview.barred.length === 0
  },
  {
    id: 'critical_unreachable',
    severity: 'critical',
    condition: `${CAPACITY_RESULT.mandatoryUnworkable.length} case${CAPACITY_RESULT.mandatoryUnworkable.length === 1 ? '' : 's'} inside the 30-day statutory window ${CAPACITY_RESULT.mandatoryUnworkable.length === 1 ? 'has' : 'have'} no officer available`,
    detail: 'The deadline falls within thirty days and no eligible officer in that division has capacity. If nothing changes the period expires and the demand is extinguished by operation of law.',
    value: CAPACITY_RESULT.mandatoryUnworkable.reduce((s, u) => s + (u.exposure || 0), 0),
    valueLabel: 'expires within 30 days',
    decision: 'Second an officer from an adjacent division, or accept the loss explicitly.',
    owner: 'Commissioner',
    target: 'capacity',
    suppressIf: () => CAPACITY_RESULT.mandatoryUnworkable.length === 0
  },
  {
    id: 'unreachable',
    severity: 'high',
    condition: `${CAPACITY_RESULT.unworkableCount} cases cannot be reached by any eligible officer this week`,
    detail: `Departmental capacity is only ${Math.round((CAPACITY_RESULT.usedDays / CAPACITY_RESULT.totalSupplyDays) * 100)}% used, but an unused officer-day in one division cannot be spent in another and an audit officer cannot take an investigation case. ${CAPACITY_RESULT.noEligibleOfficer} of them have no eligible officer posted at all.`,
    value: CAPACITY_RESULT.unworkableValue,
    valueLabel: 'not workable this week',
    decision: 'A posting decision for the divisions with no eligible officer; a prioritisation decision for the rest.',
    owner: 'Commissioner',
    target: 'capacity'
  },
  {
    id: 'queue_dwell',
    severity: 'high',
    condition: `Cases wait a median ${COUNTERFACTUAL_SUMMARY.medianQueueDays} days between a signal appearing and being worked`,
    detail: `Value decays continuously while a case sits unworked. This is the controllable half of the lag — the other ${COUNTERFACTUAL_SUMMARY.lostToDetectionCr} Cr is detection latency, which no amount of prioritisation shortens.`,
    value: COUNTERFACTUAL_SUMMARY.lostToQueueCr * 10000000,
    valueLabel: 'already lost to queue dwell',
    decision: 'Set a maximum queue age for high-value signals, and staff to it.',
    owner: 'Commissioner',
    target: 'retrospective'
  },
  {
    id: 'decay',
    severity: 'high',
    condition: `₹${RECOVERY_PORTFOLIO.decayNextWeekCr} Cr of recoverable value decays if untouched for seven days`,
    detail: 'Credit continues to move downstream while cases wait. This is the amount that stops being blockable between now and next Monday.',
    value: RECOVERY_PORTFOLIO.decayNextWeekCr * 10000000,
    valueLabel: 'decays within 7 days',
    decision: 'Work the top of the priority queue before the week closes.',
    owner: 'Divisional Joint Commissioner',
    target: 'recovery-window'
  },
  {
    id: 'network_infeasible',
    severity: 'high',
    condition: `${NETWORK_ACTION_SUMMARY.infeasibleClusters} chain${NETWORK_ACTION_SUMMARY.infeasibleClusters === 1 ? '' : 's'} cannot be closed simultaneously across the divisions ${NETWORK_ACTION_SUMMARY.infeasibleClusters === 1 ? 'it crosses' : 'they cross'}`,
    detail: 'A chain is one economic unit and several jurisdictional ones. Where a division in its span has no investigation officer posted, the chain cannot be closed as a unit and acting on part of it warns the rest.',
    value: NETWORK_ACTION_SUMMARY.infeasibleBlockableCr * 10000000,
    valueLabel: 'blockable but unreachable',
    decision: 'Post an investigation officer to the uncovered division, or run the action from headquarters.',
    owner: 'Commissioner',
    target: 'network-enforcement',
    suppressIf: () => NETWORK_ACTION_SUMMARY.infeasibleClusters === 0
  },
  {
    id: 'contested',
    severity: 'watch',
    condition: `${LIMITATION_SUMMARY.contestedCount} proceedings rest on notifications whose validity is before the Supreme Court`,
    detail: `${q168a.verdict}. If the notifications fall, the extended deadline never existed and any order passed under it was void when made — including demand already collected.`,
    value: LIMITATION_SUMMARY.contestedCr * 10000000,
    valueLabel: 'turns on a question of law',
    decision: 'Take a legal view before any further order issues on these periods, and identify collected demand that would be refundable.',
    owner: 'Legal Branch',
    target: 'precedent'
  },
  {
    id: 'revisit',
    severity: 'watch',
    condition: `${REVISIT_SUMMARY.count} cases were put down while risk signals were still firing`,
    detail: `${REVISIT_SUMMARY.closedWithSignal} audits were closed with rules still live and ${REVISIT_SUMMARY.neverActioned} taxpayers never received a notice despite them. Only ${REVISIT_SUMMARY.withLiveClock} carry a confirmed live limitation clock, so this is a review list rather than a recovery figure.`,
    value: REVISIT_SUMMARY.exposure,
    valueLabel: 'represented, not recoverable',
    decision: 'Establish the period and applicable section on the highest-value few before deciding whether to reopen.',
    owner: 'Divisional Joint Commissioner',
    target: 'retrospective'
  }
]
  .filter(c => !c.suppressIf || !c.suppressIf())
  .sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank || b.value - a.value)

export const BOARD_SUMMARY = {
  critical: CONDITIONS.filter(c => c.severity === 'critical').length,
  high: CONDITIONS.filter(c => c.severity === 'high').length,
  watch: CONDITIONS.filter(c => c.severity === 'watch').length,
  // Irreversible loss, stated apart from everything still in play.
  irreversibleValue: CONDITIONS.filter(c => c.severity === 'critical').reduce((s, c) => s + c.value, 0),
  atRiskValue: COMMAND_SUMMARY.protectableValue,
  commissionerDecisions: CONDITIONS.filter(c => c.owner === 'Commissioner').length
}

export const BOARD_NOTE =
  'Severity here means irreversibility, not size. Critical is reserved for loss that is happening now and cannot be undone — an expired period, or one about to expire with nobody able to act. A larger sum still recoverable next month ranks High. Ordering by rupee value would put the recoverable above the irrecoverable and train exactly the wrong reflex.'
