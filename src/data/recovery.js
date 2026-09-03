/* ---------------------------------------------------------------------------
 * RECOVERY WINDOW MODEL
 *
 * The platform's central thesis: revenue leakage is a function of detection
 * LAG, not detection capability. A signal is worth what it is still possible
 * to recover on the day an officer acts on it, and that value decays.
 *
 * This module supplies the four things the rest of the app had no model for —
 * only labels:
 *
 *   1. LAG          when a signal first fired, and how stale it is now
 *   2. CHAIN        why value decays: ITC moves downstream and is utilised
 *   3. QUEUE        decay-adjusted ranking, and the yield it buys per officer-day
 *   4. REGISTRATION the left edge of the curve — day-0 prevention
 *
 * ALL FIGURES ARE ILLUSTRATIVE. The decay curve below is a modelled assumption
 * chosen to be defensible in shape, not an empirical finding from departmental
 * recovery data. It is stated openly on the screen that renders it, and every
 * band carries the reasoning behind its rate so the assumption can be argued
 * with rather than taken on trust.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS, NETWORK_CLUSTERS, OFFICERS, REFERENCE_DATE } from './mockData.js'

// Deterministic per-record jitter derived from the GSTIN, so this module never
// consumes from mockData's shared PRNG — adding a field here must not shift
// every existing figure in the platform.
function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

const DAY_MS = 1000 * 60 * 60 * 24
const isoDaysBefore = (date, days) => new Date(date.getTime() - days * DAY_MS).toISOString().slice(0, 10)

/* ---------------------------------------------------------------------------
 * 1. THE DECAY CURVE
 *
 * Each band states WHY recovery falls off across it. The reasons are the
 * argument; the percentages are an illustrative calibration of that argument.
 * ------------------------------------------------------------------------- */
export const RECOVERY_BANDS = [
  {
    id: '0-30',
    label: '0–30 days',
    maxDays: 30,
    recoverability: 0.85,
    stance: 'Preventable',
    reason: 'Entity is still trading and bank accounts are operative. Credit passed downstream has usually not yet been utilised, so it can be blocked rather than recovered.'
  },
  {
    id: '31-90',
    label: '31–90 days',
    maxDays: 90,
    recoverability: 0.62,
    stance: 'Recoverable',
    reason: 'Most of the credit has been utilised at the first hop. Provisional attachment is still effective and directors remain contactable.'
  },
  {
    id: '91-180',
    label: '91–180 days',
    maxDays: 180,
    recoverability: 0.38,
    stance: 'Contested',
    reason: 'Assets are dissipating and the chain has typically reached a second hop. Recovery shifts from blocking credit to pursuing the entity.'
  },
  {
    id: '181-365',
    label: '181–365 days',
    maxDays: 365,
    recoverability: 0.17,
    stance: 'Eroded',
    reason: 'The entity is commonly non-operational at its declared premises. Recovery depends on tracing directors and attaching third-party assets.'
  },
  {
    id: '365+',
    label: 'Over 365 days',
    maxDays: Infinity,
    recoverability: 0.05,
    stance: 'Largely written down',
    reason: 'Realisation is via prosecution and appellate process. The credit is long utilised and the exposure is effectively a book entry.'
  }
]

export function bandForDays(days) {
  return RECOVERY_BANDS.find(b => days <= b.maxDays) || RECOVERY_BANDS.at(-1)
}

// The bands above are how the curve is EXPLAINED; this is how it is COMPUTED.
// Treating the bands themselves as the function makes recoverability a step
// function, which would mean a case loses nothing at all until the day it
// crosses a boundary and then loses 20 points at once. Value does not behave
// that way, and a queue built on it would be ordered almost entirely by which
// cases happen to sit near a boundary this week. Interpolating between the
// band anchors gives every case a real, continuous weekly decay.
const CURVE_ANCHORS = [
  [0, 0.90], [30, 0.85], [90, 0.62], [180, 0.38], [365, 0.17], [540, 0.09], [730, 0.05]
]

export function recoverabilityFor(days) {
  const d = Math.max(0, days)
  if (d >= CURVE_ANCHORS.at(-1)[0]) return CURVE_ANCHORS.at(-1)[1]
  for (let i = 0; i < CURVE_ANCHORS.length - 1; i++) {
    const [x0, y0] = CURVE_ANCHORS[i]
    const [x1, y1] = CURVE_ANCHORS[i + 1]
    if (d <= x1) return y0 + ((d - x0) / (x1 - x0)) * (y1 - y0)
  }
  return CURVE_ANCHORS.at(-1)[1]
}

/* ---------------------------------------------------------------------------
 * 2. SIGNAL AGE
 *
 * The lag a case carries is not random: the signals that fire late are the
 * ones the return cycle hides. A non-filer is invisible until a due date
 * passes; a circular-trading pattern needs several periods of invoices before
 * it resolves into a shape. Cases therefore inherit the lag floor of their
 * slowest triggering rule, plus dwell time in the officer queue.
 * ------------------------------------------------------------------------- */
const RULE_DETECTION_FLOOR = {
  non_filing: 45,
  late_filing: 40,
  itc_spike: 60,
  refund_ratio: 55,
  eway_mismatch: 35,
  revenue_drop: 70,
  supplier_risk: 90,
  circular_signal: 150,
  sector_deviation: 120,
  new_reg_high_txn: 25
}

function detectionFloorFor(taxpayer) {
  const floors = (taxpayer.risk.triggeredRules || []).map(r => RULE_DETECTION_FLOOR[r.id] ?? 60)
  return floors.length ? Math.max(...floors) : 30
}

// Every taxpayer carrying at least one triggered rule is a case in the window.
export const RECOVERY_CASES = TAXPAYERS
  .filter(t => (t.risk.triggeredRules || []).length > 0 && t.estimatedRevenueExposure > 0)
  .map(t => {
    const floor = detectionFloorFor(t)
    // Queue dwell — time the case has sat after the signal became detectable.
    // Squared so the distribution is front-loaded: most cases are caught in the
    // first weeks and a long tail goes stale, which is the shape a real queue
    // has. A flat draw put nothing at all in the 0–30 day band.
    const dwell = Math.round(Math.pow(hashSeed(t.gstin + 'dwell'), 2.4) * 430)
    const daysSinceSignal = floor + dwell
    const band = bandForDays(daysSinceSignal)
    const recoverability = recoverabilityFor(daysSinceSignal)
    const recoverableNow = Math.round(t.estimatedRevenueExposure * recoverability)
    const decayNextWeek = Math.round(
      t.estimatedRevenueExposure * (recoverability - recoverabilityFor(daysSinceSignal + 7))
    )

    return {
      id: t.id,
      gstin: t.gstin,
      tradeName: t.tradeName,
      district: t.district,
      division: t.division,
      sector: t.sector,
      riskScore: t.risk.score,
      riskCategory: t.risk.category,
      filingStatus: t.filingStatus,
      leadRule: (t.risk.triggeredRules || []).slice().sort((a, b) => b.weight - a.weight)[0] || null,
      exposure: t.estimatedRevenueExposure,
      signalFirstSeenOn: isoDaysBefore(REFERENCE_DATE, daysSinceSignal),
      detectionFloorDays: floor,
      queueDwellDays: dwell,
      daysSinceSignal,
      bandId: band.id,
      recoverability,
      recoverableNow,
      lostToLag: t.estimatedRevenueExposure - recoverableNow,
      // What this case costs if it is not touched for another week. This is the
      // number that should order an officer's day, and does not correlate with
      // the risk score — which is the whole argument.
      decayNextWeek
    }
  })

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)
const toCr = n => Math.round(n / 10000000)

export const RECOVERY_PORTFOLIO = {
  caseCount: RECOVERY_CASES.length,
  exposureCr: toCr(sum(RECOVERY_CASES, c => c.exposure)),
  recoverableNowCr: toCr(sum(RECOVERY_CASES, c => c.recoverableNow)),
  lostToLagCr: toCr(sum(RECOVERY_CASES, c => c.lostToLag)),
  decayNextWeekCr: Math.round((sum(RECOVERY_CASES, c => c.decayNextWeek) / 10000000) * 100) / 100,
  medianLagDays: (() => {
    const d = RECOVERY_CASES.map(c => c.daysSinceSignal).sort((a, b) => a - b)
    return d.length ? d[Math.floor(d.length / 2)] : 0
  })(),
  // The share of exposure already past the point where blocking credit works.
  pastBlockablePct: RECOVERY_CASES.length
    ? Math.round((sum(RECOVERY_CASES.filter(c => c.daysSinceSignal > 90), c => c.exposure) / sum(RECOVERY_CASES, c => c.exposure)) * 100)
    : 0,
  // The fastest any signal in the current rule set can physically fire, given
  // that each one waits on a return being filed. This is why the first band of
  // the curve is empty: not because nothing is caught quickly, but because
  // nothing CAN be. It is root cause #1 stated as a number.
  fastestPossibleDetectionDays: Math.min(...Object.values(RULE_DETECTION_FLOOR))
}

export const BAND_SUMMARY = RECOVERY_BANDS.map(b => {
  const inBand = RECOVERY_CASES.filter(c => c.bandId === b.id)
  return {
    ...b,
    caseCount: inBand.length,
    exposureCr: toCr(sum(inBand, c => c.exposure)),
    recoverableCr: toCr(sum(inBand, c => c.recoverableNow)),
    lostCr: toCr(sum(inBand, c => c.lostToLag))
  }
})

/* ---------------------------------------------------------------------------
 * 3. THE QUEUE ARGUMENT
 *
 * Ranking by risk score and ranking by decay-adjusted value produce different
 * work. `queueDelta` is how far a case moves between the two orderings — the
 * cases with the largest positive delta are the ones a score-ranked queue
 * leaves to expire.
 * ------------------------------------------------------------------------- */
const byScore = [...RECOVERY_CASES].sort((a, b) => b.riskScore - a.riskScore || a.gstin.localeCompare(b.gstin))
const byDecay = [...RECOVERY_CASES].sort((a, b) => b.decayNextWeek - a.decayNextWeek || a.gstin.localeCompare(b.gstin))
const scoreRank = Object.fromEntries(byScore.map((c, i) => [c.id, i + 1]))
const decayRank = Object.fromEntries(byDecay.map((c, i) => [c.id, i + 1]))

export const QUEUE_COMPARISON = byDecay.map(c => ({
  ...c,
  scoreRank: scoreRank[c.id],
  decayRank: decayRank[c.id],
  queueDelta: scoreRank[c.id] - decayRank[c.id]
}))

// Yield comparison: what the same officer-days buy under each ordering.
// Capacity is the real constraint — this expresses it in recovered rupees
// rather than the utilisation percentage the platform showed before.
const OFFICER_DAYS_PER_CASE = 3
const fieldOfficerCount = OFFICERS.filter(o =>
  o.role === 'Audit Officer' || o.role === 'Refund Officer' || o.role === 'Investigation Officer').length
const weeklyCaseCapacity = Math.max(1, Math.round((fieldOfficerCount * 5) / OFFICER_DAYS_PER_CASE))

// Two orderings, measured on BOTH objectives — because they optimise for
// different things and presenting only the one that favours decay-ranking
// would be rigging the comparison. Working a case captures what is recoverable
// today; leaving it another week forfeits what decays in the meantime. A
// score-ordered queue wins on immediate capture (high-score cases carry the
// biggest exposure) and loses on preservation (it keeps re-working cases whose
// value has already gone flat, while steeply-decaying ones age out).
function yieldOf(ordered) {
  const worked = ordered.slice(0, weeklyCaseCapacity)
  const unworked = ordered.slice(weeklyCaseCapacity)
  const recovered = sum(worked, c => c.recoverableNow)
  return {
    casesWorked: worked.length,
    recoveredCr: toCr(recovered),
    // Value that stops evaporating because these cases were touched this week.
    lossAvoidedLakh: Math.round(sum(worked, c => c.decayNextWeek) / 100000),
    // Value that will have gone by next Monday because they were not.
    forfeitedLakh: Math.round(sum(unworked, c => c.decayNextWeek) / 100000),
    perOfficerDayLakh: Math.round((recovered / (worked.length * OFFICER_DAYS_PER_CASE)) / 100000)
  }
}

export const OFFICER_YIELD = {
  fieldOfficerCount,
  weeklyCaseCapacity,
  officerDaysPerCase: OFFICER_DAYS_PER_CASE,
  byRiskScore: yieldOf(byScore),
  byDecayAdjusted: yieldOf(byDecay)
}

/* ---------------------------------------------------------------------------
 * 4. CHAIN PROPAGATION — why the curve falls
 *
 * Exposure is never one taxpayer. Credit issued by a hub entity moves
 * downstream; at each hop a share of it is utilised and stops being
 * blockable. The further a cluster has aged, the more of its value has
 * crossed that line. This is the mechanism the decay curve describes.
 * ------------------------------------------------------------------------- */
const HOP_UTILISATION = [0.35, 0.6, 0.8] // share utilised by hop 1, 2, 3

export const CHAIN_EXPOSURE = NETWORK_CLUSTERS.map(cluster => {
  // Flow lives on the edges, not on the cluster — summing it here is what makes
  // the chain the unit of exposure rather than the individual taxpayer.
  const flowRupees = (cluster.edges || []).reduce((s, e) => s + (e.valueLakh || 0), 0) * 100000
  const ageDays = 60 + Math.round(hashSeed(cluster.id + 'age') * 420)
  // Hops reached grows with age — the chain keeps moving while the case waits.
  const hopsReached = ageDays > 300 ? 3 : ageDays > 150 ? 2 : 1
  const utilisedShare = HOP_UTILISATION[hopsReached - 1]
  const utilised = Math.round(flowRupees * utilisedShare)
  const blockable = flowRupees - utilised
  return {
    id: cluster.id,
    entityCount: cluster.nodes?.length || 0,
    flowRupees,
    ageDays,
    hopsReached,
    utilisedRupees: utilised,
    blockableRupees: blockable,
    blockablePct: flowRupees ? Math.round((blockable / flowRupees) * 100) : 0
  }
})

export const CHAIN_SUMMARY = {
  clusterCount: CHAIN_EXPOSURE.length,
  totalFlowCr: Math.round((sum(CHAIN_EXPOSURE, c => c.flowRupees) / 10000000) * 100) / 100,
  utilisedCr: Math.round((sum(CHAIN_EXPOSURE, c => c.utilisedRupees) / 10000000) * 100) / 100,
  blockableCr: Math.round((sum(CHAIN_EXPOSURE, c => c.blockableRupees) / 10000000) * 100) / 100
}

/* ---------------------------------------------------------------------------
 * 5. REGISTRATION SCREEN — the left edge, where the cost to stop is zero
 *
 * A shell entity is cheapest to stop before it has issued its first invoice.
 * These are the day-0 indicators that are checkable at registration rather
 * than reconstructed a year later from invoice flow.
 * ------------------------------------------------------------------------- */
export const REGISTRATION_INDICATORS = [
  { id: 'shared_premises', label: 'Registered address shared with an already-flagged entity', checkableAt: 'Registration' },
  { id: 'shared_contact', label: 'Contact number or email shared across multiple registrations', checkableAt: 'Registration' },
  { id: 'pan_cluster', label: 'PAN linked to a proprietor of a previously cancelled registration', checkableAt: 'Registration' },
  { id: 'immediate_high_value', label: 'High-value outward supply within the first filing period', checkableAt: 'First return' },
  { id: 'no_premises_proof', label: 'Premises verification not completed or returned negative', checkableAt: 'Registration' }
]

const newRegistrations = TAXPAYERS.filter(t => t.isNewRegistration)

export const REGISTRATION_SCREEN = newRegistrations.map(t => {
  const s = k => hashSeed(t.gstin + k)
  // Thresholds are set so a minority of new registrations raise an indicator.
  // A screen that flags almost every applicant is not a screen — it hands the
  // officer back the same undifferentiated queue it was meant to triage.
  const flags = [
    s('prem') > 0.86 && 'shared_premises',
    s('cont') > 0.88 && 'shared_contact',
    s('pan') > 0.93 && 'pan_cluster',
    t.monthlyTurnover > 15000000 && 'immediate_high_value',
    s('proof') > 0.9 && 'no_premises_proof'
  ].filter(Boolean)
  return {
    id: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    district: t.district,
    sector: t.sector,
    registrationDate: t.registrationDate,
    monthlyTurnover: t.monthlyTurnover,
    exposure: t.estimatedRevenueExposure,
    flags,
    flagCount: flags.length
  }
}).sort((a, b) => b.flagCount - a.flagCount || b.exposure - a.exposure)

export const REGISTRATION_SUMMARY = {
  newRegistrations: newRegistrations.length,
  withAnyIndicator: REGISTRATION_SCREEN.filter(r => r.flagCount > 0).length,
  withTwoOrMore: REGISTRATION_SCREEN.filter(r => r.flagCount >= 2).length,
  exposureAtStakeCr: Math.round((sum(REGISTRATION_SCREEN.filter(r => r.flagCount >= 2), r => r.exposure) / 10000000) * 100) / 100
}

/* ---------------------------------------------------------------------------
 * 6. THE ROOT CAUSES OF LAG
 *
 * Each is structural — a property of how the return cycle and the case
 * workflow are built, not a failure of effort or of detection.
 * ------------------------------------------------------------------------- */
export const LAG_ROOT_CAUSES = [
  {
    id: 'return-cycle-bound',
    cause: 'Detection is bound to the return cycle',
    why: 'A signal cannot fire until the return that reveals it is filed. That puts a floor of one filing cycle under every indicator before an officer can see anything at all, and scrutiny selection then runs annually.',
    consequence: 'The fastest possible detection is already 25–45 days late; the typical one is a year.',
    intervention: 'Score behaviour continuously against e-way bill and e-invoice flow, which arrive before the return does.'
  },
  {
    id: 'credit-before-verification',
    cause: 'Credit is claimed before it is verified',
    why: 'The buyer claims ITC in the same period the supplier declares it, while the check that the supplier actually paid happens later. Section 16(2)(c) makes the credit conditional on payment the department cannot yet confirm.',
    consequence: 'By the time the mismatch resolves, the credit has been utilised and often passed on again.',
    intervention: 'Flag the buyer at the point the supplier’s liability goes unpaid, not at annual reconciliation.'
  },
  {
    id: 'queue-ranked-by-score',
    cause: 'Queues are ranked by risk score, not by decay',
    why: 'A 92-score case that is 400 days old is worth less than a 71-score case that is 20 days old, but a score-ordered queue puts the 92 first every time.',
    consequence: 'Officer-days are spent on cases whose value has already gone, while recoverable ones age past the window.',
    intervention: 'Order the queue by value at risk this week. Same headcount, materially different yield.'
  },
  {
    id: 'registration-after-the-fact',
    cause: 'Registration risk is assessed after the fact',
    why: 'Shared premises, shared contacts and PAN linkage to cancelled registrations are all checkable on the day of application. They are instead reconstructed from invoice flow months later.',
    consequence: 'A shell entity trades for a full cycle before the first signal exists to catch it.',
    intervention: 'Screen at registration, where the cost of stopping the entity is effectively zero.'
  },
  {
    id: 'dwell-inside-department',
    cause: 'Cases dwell inside the department after detection',
    why: 'Detection is only the first clock. A case then waits through allocation, notice, hearing and recovery stages while the entity continues to dissipate assets.',
    consequence: 'Internal dwell frequently exceeds the detection lag that preceded it.',
    intervention: 'Track stage ageing against the recovery curve, not against an internal service standard.'
  }
]

export const RECOVERY_MODEL_NOTE =
  'The recovery curve is an illustrative model, not a measurement. The percentages are a calibration of the stated reasoning for each band — they are not derived from departmental recovery outcomes. Every case figure on this screen is generated demonstration data. The curve is shown so the assumption behind it can be examined and argued with; it must be re-based on the department’s own realisation history before it informs any operational decision.'
