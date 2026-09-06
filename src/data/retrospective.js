/* ---------------------------------------------------------------------------
 * RETROSPECTIVE INTELLIGENCE — what was missed, and what earlier action was worth
 *
 * Two capabilities that look alike and are not. One is fully computable from
 * what the department already holds; the other is blocked by a label count of
 * one, which is shown rather than argued.
 *
 * ── 1. THE TIMING COUNTERFACTUAL — computable, and it is arithmetic ──
 *
 * "What if this case had been handled differently" splits into two questions
 * that must not be run together:
 *
 *   TIMING: what would the same action, taken earlier, have recovered? This is
 *   the decay curve evaluated at a different day. It is arithmetic on a stated
 *   curve, it makes no claim about anybody's decisions, and it is answerable
 *   now.
 *
 *   STRATEGY: what would a DIFFERENT action — escalation to Section 74, a
 *   provisional attachment, a different forum — have recovered? That is a
 *   causal claim about a decision never taken, and answering it requires
 *   outcome histories across comparable cases where each route was actually
 *   followed. It is not answerable here and is not attempted.
 *
 * The lag decomposes into two parts with different owners, which is the useful
 * part. Detection latency is how long before the signal could first be seen at
 * all — a data-feed constraint. Queue dwell is how long it then sat unworked —
 * a capacity and prioritisation constraint, and the part controllable today.
 * Reporting one number for "lag" hides which of the two to fix.
 *
 * ── 2. MISSED REVENUE DISCOVERY — blocked, and here is the count ──
 *
 * The capability asks for cases treated under Section 73 whose evidence
 * resembles cases the department treated as fraud under Section 74. The label
 * needed is the section treatment, and the register contains ONE Section 74
 * case. A resemblance model trained on a single positive example is not weak,
 * it is undefined — and reclassification to Section 74 carries a longer
 * limitation period and a heavier penalty, so a wrong one is not a minor error.
 *
 * What IS computable without that label is narrower and still useful: cases the
 * department closed or never actioned which still carry unresolved risk signals
 * and an unexpired limitation period. That is not "resembles fraud". It is
 * "this was put down while something was still live in it", and it is offered
 * as exactly that.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS, AUDIT_CASES, NOTICES } from './mockData.js'
import { RECOVERY_CASES, recoverabilityFor } from './recovery.js'
import { LIMITATION_REGISTER } from './statutory.js'

const byGstin = new Map(TAXPAYERS.map(t => [t.gstin, t]))
const limByGstin = new Map(LIMITATION_REGISTER.map(r => [r.gstin, r]))

/* ---------------------------------------------------------------------------
 * 1. TIMING COUNTERFACTUAL
 * ------------------------------------------------------------------------- */
export const COUNTERFACTUALS = RECOVERY_CASES.map(c => {
  const floor = c.detectionFloorDays          // earliest the signal could exist
  const dwell = c.queueDwellDays              // how long it then waited
  const now = c.daysSinceSignal

  const rFloor = recoverabilityFor(floor)
  const rNow = recoverabilityFor(now)
  const rIdeal = recoverabilityFor(0)

  // Three worlds, same case.
  const atIdeal = Math.round(c.exposure * rIdeal)
  const atFloor = Math.round(c.exposure * rFloor)
  const atNow = Math.round(c.exposure * rNow)

  return {
    gstin: c.gstin,
    tradeName: c.tradeName,
    division: c.division,
    sector: c.sector,
    leadRule: c.leadRule,
    exposure: c.exposure,
    signalFirstSeenOn: c.signalFirstSeenOn,

    detectionFloorDays: floor,
    queueDwellDays: dwell,
    totalLagDays: now,

    atIdeal,
    atFloor,
    atNow,

    // The two losses, separately owned.
    lostToDetection: atIdeal - atFloor,
    lostToQueue: atFloor - atNow,
    lostTotal: atIdeal - atNow,

    // Only the second is recoverable by a decision the department can take now.
    controllableShare: (atIdeal - atNow) > 0 ? Math.round(((atFloor - atNow) / (atIdeal - atNow)) * 100) : 0
  }
}).sort((a, b) => b.lostToQueue - a.lostToQueue)

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)

export const COUNTERFACTUAL_SUMMARY = {
  caseCount: COUNTERFACTUALS.length,
  lostToDetectionCr: Math.round((sum(COUNTERFACTUALS, c => c.lostToDetection) / 10000000) * 100) / 100,
  lostToQueueCr: Math.round((sum(COUNTERFACTUALS, c => c.lostToQueue) / 10000000) * 100) / 100,
  lostTotalCr: Math.round((sum(COUNTERFACTUALS, c => c.lostTotal) / 10000000) * 100) / 100,
  stillRecoverableCr: Math.round((sum(COUNTERFACTUALS, c => c.atNow) / 10000000) * 100) / 100,
  medianDetectionDays: (() => {
    const d = COUNTERFACTUALS.map(c => c.detectionFloorDays).sort((a, b) => a - b)
    return d.length ? d[Math.floor(d.length / 2)] : 0
  })(),
  medianQueueDays: (() => {
    const d = COUNTERFACTUALS.map(c => c.queueDwellDays).sort((a, b) => a - b)
    return d.length ? d[Math.floor(d.length / 2)] : 0
  })()
}

export const COUNTERFACTUAL_NOTE =
  'This is the recovery curve evaluated at a different day, not a judgement about anybody’s decisions. It says what the same action taken earlier would have been worth, which is arithmetic. It does not say what a different action would have been worth — escalation to a different section, a provisional attachment, a different forum — because that is a causal claim about a route never taken, and answering it needs outcome histories across comparable cases where each route was actually followed.'

export const LAG_OWNERSHIP_NOTE =
  'The lag is reported in two parts because they have different owners and different fixes. Detection latency is how long before the signal could first be seen at all, and it is a data-feed problem — no amount of prioritisation shortens it. Queue dwell is how long the case then sat unworked, and it is a capacity and prioritisation problem, which is the part controllable this quarter. A single blended "average lag" figure hides which of the two to spend money on.'

/* ---------------------------------------------------------------------------
 * 2a. MISSED REVENUE — the part that IS computable
 *
 * Cases put down while something in them was still live. No claim about fraud.
 * ------------------------------------------------------------------------- */
const closedAuditGstins = new Set(AUDIT_CASES.filter(a => a.stage === 'Closed').map(a => a.gstin))
const noticedGstins = new Set(NOTICES.map(n => n.gstin))

export const REVISIT_CANDIDATES = TAXPAYERS
  .map(t => {
    const rules = t.risk.triggeredRules || []
    if (!rules.length) return null

    const lim = limByGstin.get(t.gstin)
    // A period already time-barred cannot be revisited — revisiting it recovers
    // nothing and would waste the officer-day this screen exists to save.
    if (lim && lim.daysRemaining != null && lim.daysRemaining < 0) return null

    const closedWithSignal = closedAuditGstins.has(t.gstin)
    const neverActioned = !noticedGstins.has(t.gstin) && t.noticesIssued === 0

    if (!closedWithSignal && !neverActioned) return null

    return {
      gstin: t.gstin,
      tradeName: t.tradeName,
      division: t.division,
      sector: t.sector,
      exposure: t.estimatedRevenueExposure,
      riskScore: t.risk.score,
      riskCategory: t.risk.category,
      rules: rules.map(r => r.label),
      ruleCount: rules.length,
      daysRemaining: lim ? lim.daysRemaining : null,
      bindingDate: lim ? lim.bindingDate : null,
      basis: closedWithSignal ? 'closed_with_signal' : 'never_actioned',
      basisLabel: closedWithSignal
        ? 'Audit closed while risk rules were still firing'
        : 'No notice ever issued despite risk rules firing'
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.exposure - a.exposure)

export const REVISIT_SUMMARY = {
  count: REVISIT_CANDIDATES.length,
  exposure: REVISIT_CANDIDATES.reduce((s, c) => s + c.exposure, 0),
  closedWithSignal: REVISIT_CANDIDATES.filter(c => c.basis === 'closed_with_signal').length,
  neverActioned: REVISIT_CANDIDATES.filter(c => c.basis === 'never_actioned').length,
  withLiveClock: REVISIT_CANDIDATES.filter(c => c.daysRemaining != null && c.daysRemaining >= 0).length
}

export const REVISIT_NOTE =
  'These are cases put down while something in them was still live — an audit closed with risk rules still firing, or a taxpayer against whom no notice ever issued despite them. It is not an allegation and not a finding that anything was done wrongly: rules fire on behaviour that frequently has an innocent explanation, and an officer who closed one of these may well have had a reason that is not on the system. Time-barred periods are excluded, because revisiting them recovers nothing.'

/* ---------------------------------------------------------------------------
 * 2b. MISSED REVENUE — the part that is NOT computable, with the count
 * ------------------------------------------------------------------------- */
const bySection = LIMITATION_REGISTER.reduce((acc, r) => {
  acc[r.section] = (acc[r.section] || 0) + 1
  return acc
}, {})

export const FRAUD_LABEL_STATE = {
  sectionCounts: bySection,
  s74Count: bySection.s74 || 0,
  s73Count: bySection.s73 || 0,
  // The whole argument in one boolean.
  trainable: (bySection.s74 || 0) >= 5,
  minimumNeeded: 5,
  reason: `Identifying Section 73 cases that resemble Section 74 cases requires Section 74 cases to resemble. The register contains ${bySection.s74 || 0}. A resemblance model built on a single positive example is not weak — it is undefined, because there is no variation from which to learn what the pattern is.`,
  stakes: 'Reclassification under Section 74 carries a longer limitation period and a substantially heavier penalty, and must be sustained on evidence of suppression or wilful misstatement. A model proposing it has to be defensible in appeal. On one example it would not survive the first hearing.',
  whatWouldUnlockIt: [
    'At least five concluded Section 74 proceedings, and ideally several times that, so the pattern has variation to learn from rather than a single case to memorise.',
    'The adjudication outcome on each, so the model learns from cases that were SUSTAINED as fraud rather than merely alleged as fraud — those are different populations and conflating them would train it to reproduce the department’s charging habits rather than its wins.',
    'The evidence actually relied on in each order, not just the section quoted, so resemblance is measured on what proved the case rather than on how it was labelled.'
  ],
  honestPosition: 'This is the capability most worth having and the one furthest from being possible. It is left unbuilt rather than approximated, because an approximate version would produce confident Section 74 review candidates from noise, and an officer would act on them.'
}
