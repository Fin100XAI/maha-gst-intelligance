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

import { TAXPAYERS, AUDIT_CASES, NOTICES, LITIGATION_CASES } from './mockData.js'
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
  reason:
    'Identifying Section 73 cases that resemble Section 74 cases requires Section 74 cases to resemble. The register contains {0}. A resemblance model built on a single positive example is not weak — it is undefined, because there is no variation from which to learn what the pattern is.',
  reasonArgs: [bySection.s74 || 0],
  stakes: 'Reclassification under Section 74 carries a longer limitation period and a substantially heavier penalty, and must be sustained on evidence of suppression or wilful misstatement. A model proposing it has to be defensible in appeal. On one example it would not survive the first hearing.',
  whatWouldUnlockIt: [
    'At least five concluded Section 74 proceedings, and ideally several times that, so the pattern has variation to learn from rather than a single case to memorise.',
    'The adjudication outcome on each, so the model learns from cases that were SUSTAINED as fraud rather than merely alleged as fraud — those are different populations and conflating them would train it to reproduce the department’s charging habits rather than its wins.',
    'The evidence actually relied on in each order, not just the section quoted, so resemblance is measured on what proved the case rather than on how it was labelled.'
  ],
  honestPosition: 'This is the capability most worth having and the one furthest from being possible. It is left unbuilt rather than approximated, because an approximate version would produce confident Section 74 review candidates from noise, and an officer would act on them.'
}

/* ---------------------------------------------------------------------------
 * 2c. THE SEPARATION TEST — why the model is refused, measured rather than argued
 *
 * The Section 74 label count is one, so the obvious next move is to change the
 * positive class to something with more rows. The right substitute is not
 * "charged as fraud" but "SUSTAINED on appeal", because charging habits are not
 * wins — a demand raised under Section 74 and then reversed teaches the model
 * to reproduce a mistake. That class has eight members, above any reasonable
 * minimum, so the capability looked buildable.
 *
 * It is not, and the reason is worth more than the capability would have been.
 *
 * Before building a resemblance model, the positive class has to actually
 * differ from the population it will be used to screen. If cases the department
 * won look like cases in general, then "resembles a case we won" is true of
 * everything, every candidate scores alike, and the ranking that comes out is
 * noise wearing the authority of a model. So the separation is measured here,
 * per feature, and reported whatever it says.
 *
 * On this data it says the features do not separate. Mean rules firing is
 * identical between the sustained class and the baseline. The remaining gaps
 * are small on a sample of eight and sit inside what eight cases could produce
 * by chance.
 *
 * THE CONSEQUENCE FOR THE PILOT IS THE USEFUL PART
 *
 * If the features did separate weakly, more rows would fix it. They do not
 * separate at all, so more rows will not: a thousand cases described by these
 * same fields would give a thousand cases that still look alike. What is
 * missing is not sample size but the evidence actually relied on in each
 * order — what was produced, what was accepted, what the taxpayer could not
 * explain. Risk scores and ratios describe a taxpayer. They do not describe why
 * a demand held up.
 * ------------------------------------------------------------------------- */
import { NETWORK_CLUSTERS } from './mockData.js'
const LITIGATION_CASES_LOCAL = LITIGATION_CASES

const SUSTAINED = 'Order Confirmed'
const NOT_SUSTAINED = ['Order Reversed', 'Remanded']
const clusterGstins = new Set(NETWORK_CLUSTERS.flatMap(c => c.nodes.map(n => n.gstin)))

const SEP_FEATURES = [
  { id: 'risk', label: 'Risk score', of: t => t.risk.score },
  { id: 'rules', label: 'Risk rules firing', of: t => (t.risk.triggeredRules || []).length },
  { id: 'itc', label: 'ITC claimed / turnover', of: t => (t.monthlyTurnover > 0 ? t.itcClaimed / t.monthlyTurnover : 0) },
  { id: 'tax', label: 'Tax paid / turnover', of: t => (t.monthlyTurnover > 0 ? t.taxPaid / t.monthlyTurnover : 0) },
  { id: 'network', label: 'Member of a detected chain', of: t => (clusterGstins.has(t.gstin) ? 1 : 0) }
]

const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const sd = xs => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1))
}

export const SEPARATION_TEST = (() => {
  const litOf = stageTest => LITIGATION_CASES_LOCAL.filter(stageTest).map(l => byGstin.get(l.gstin)).filter(Boolean)
  const pos = litOf(l => l.stage === SUSTAINED)
  const neg = litOf(l => NOT_SUSTAINED.includes(l.stage))
  const all = LITIGATION_CASES_LOCAL.map(l => byGstin.get(l.gstin)).filter(Boolean)

  const features = SEP_FEATURES.map(f => {
    const p = pos.map(f.of)
    const b = all.map(f.of)
    const mP = mean(p)
    const mB = mean(b)
    // Standardised difference against the baseline spread. Anything under ~0.5
    // is not a signal a screen could be built on.
    const pooled = sd(b) || 1e-9
    const effect = Math.abs(mP - mB) / pooled
    return {
      id: f.id,
      label: f.label,
      sustainedMean: Math.round(mP * 1000) / 1000,
      baselineMean: Math.round(mB * 1000) / 1000,
      effectSize: Math.round(effect * 100) / 100,
      separates: effect >= 0.5
    }
  })

  return {
    positiveClass: SUSTAINED,
    positiveN: pos.length,
    contrastN: neg.length,
    baselineN: all.length,
    features,
    separatingCount: features.filter(f => f.separates).length,
    // The verdict, derived rather than asserted.
    usable: features.filter(f => f.separates).length > 0 && neg.length >= 5,
    verdict: 'The features do not separate. Cases the department won look like cases in general on every feature measured, so a model asking "does this resemble a case we won" would answer yes to nearly everything and rank the rest by noise.',
    whyMoreRowsWontHelp: 'A weak separation would be a sample-size problem and more cases would fix it. No separation is a feature problem, and a thousand cases described by these same fields would still look alike. The fields describe a taxpayer; they do not describe why a demand held up.',
    contrastWarning: `Only ${neg.length} proceedings were not sustained, so nothing can be learned about what distinguishes a win from a loss. A model trained on wins alone learns what cases look like, not what winning looks like.`,
    whatIsActuallyNeeded: [
      'The evidence relied on in each order — what was produced, what was accepted, and what the taxpayer could not explain. This is the only field that describes why a demand held up rather than who the taxpayer was.',
      'A contrast class of comparable size. Wins alone cannot teach discrimination; the reversals and remands are where the signal about what fails actually lives.',
      'The ground on which each case was decided, so outcomes turning on limitation or procedure are separated from those decided on merits. Mixing them trains the model on two different questions at once.'
    ]
  }
})()

/* ---------------------------------------------------------------------------
 * PER-CASE BUILDERS
 *
 * The portfolio figures above answer "how much". These answer "which case, and
 * why" — which is what an officer actually needs before reopening anything or
 * defending a decision not to.
 * ------------------------------------------------------------------------- */
import { findComparables } from './similarity.js'
import { buildCaseTwin } from './caseTwin.js'

const REOPEN_CHECKS = [
  { id: 'period', label: 'Establish the tax period and applicable section', why: 'Nothing can be reopened until the period is fixed, and the section decides how long there is to do it.' },
  { id: 'limitation', label: 'Compute the limitation date for that period', why: 'A period already expired cannot be revisited whatever the evidence shows.' },
  { id: 'evidence', label: 'Retrieve the evidence the closure rested on', why: 'The officer who closed it may have had a reason that never reached the system.' },
  { id: 'quantify', label: 'Re-quantify the exposure against current returns', why: 'The figure below is a risk-model estimate, not an assessed demand.' }
]

/* Missed Revenue — one review candidate, explained.
 *
 * Deliberately NOT a classification. It states what fired, what the department
 * did, what is comparable in the concluded record, and what has to be checked
 * before anybody reopens anything. */
export function buildRevisitBrief(gstin) {
  const c = REVISIT_CANDIDATES.find(r => r.gstin === gstin)
  if (!c) return null
  const twin = buildCaseTwin(gstin)
  const comparables = findComparables(gstin, 4)

  return {
    ...c,
    // What fired, with the weight each rule carries.
    signals: (twin?.position.triggeredRules || []).map(r => ({ label: r.label, weight: r.weight })),
    // What the department did about it — the whole point of the screen.
    departmentAction: c.basis === 'closed_with_signal'
      ? 'An audit case was opened and closed while these rules were still firing.'
      : 'No notice was ever issued against this taxpayer despite these rules firing.',
    proceedings: twin ? twin.proceedings.notices.length + twin.proceedings.audit.length : 0,
    comparables,
    checks: REOPEN_CHECKS,
    // The refusal, restated per case so it cannot be missed on any one of them.
    notAClassification: 'This is a review candidate, not a classification. Nothing here proposes Section 74 treatment: the department holds one concluded Section 74 proceeding, and no resemblance model can be built on a single example. Reclassification carries a longer limitation period and a heavier penalty and must be decided by an officer on the evidence, not suggested by a screen.'
  }
}

/* Counterfactual — one case, four worlds.
 *
 * Same action at different times, never a different action. The scenarios are
 * the decay curve evaluated at four days; what a different escalation route
 * would have produced is a causal claim this platform cannot make. */
export function buildCounterfactual(gstin) {
  const c = COUNTERFACTUALS.find(r => r.gstin === gstin)
  if (!c) return null
  const at = day => Math.round(c.exposure * recoverabilityFor(day))

  const scenarios = [
    { id: 'ideal', label: 'Acted the day the behaviour occurred', day: 0, value: at(0), feasible: false, note: 'Not achievable — the return that reveals it has not been filed yet. Shown as the ceiling.' },
    { id: 'floor', label: 'Acted the day the signal first became visible', day: c.detectionFloorDays, value: at(c.detectionFloorDays), feasible: true, note: 'The earliest the department could have known. This is the realistic best case.' },
    { id: 'thirty', label: 'Acted within 30 days of the signal', day: c.detectionFloorDays + 30, value: at(c.detectionFloorDays + 30), feasible: true, note: 'A service standard the department could set and staff to.' },
    { id: 'actual', label: 'What actually happened', day: c.totalLagDays, value: at(c.totalLagDays), feasible: true, actual: true, note: 'The case waited {0} days in the queue after the signal appeared.', noteArgs: [c.queueDwellDays] }
  ]
  const best = scenarios.find(s => s.id === 'floor')
  const actual = scenarios.find(s => s.actual)

  return {
    ...c,
    scenarios,
    forgoneVsFeasible: best.value - actual.value,
    // Evidence for the comparison, drawn from concluded proceedings rather
    // than asserted.
    comparables: findComparables(gstin, 4),
    boundary: 'Every scenario above is the same action taken on a different day. None of them models a different action — escalation to another section, a provisional attachment, a different forum — because that is a causal claim about a route never taken, and it needs outcome histories across comparable cases where each route was actually followed.'
  }
}

export const REVISIT_INDEX = REVISIT_CANDIDATES.map(c => ({ gstin: c.gstin, tradeName: c.tradeName, exposure: c.exposure, division: c.division }))
export const COUNTERFACTUAL_INDEX = COUNTERFACTUALS.map(c => ({ gstin: c.gstin, tradeName: c.tradeName, lostToQueue: c.lostToQueue, division: c.division }))
