/* ---------------------------------------------------------------------------
 * CASE PRIORITY ENGINE
 *
 * Ranking by risk score answers "how wrong is this?". It does not answer "what
 * deserves an officer's Tuesday?" — which needs six things at once:
 *
 *     severity x exposure x recoverability x time-sensitivity
 *     x network propagation x probability of recovery
 *     -------------------------------------------------------
 *                      officer-days required
 *
 * TWO HONEST LIMITS, STATED HERE AND ON SCREEN
 *
 * 1. PROBABILITY OF RECOVERY IS A PROXY, NOT A LEARNED ESTIMATE.
 *    A learned probability requires completed cases with known outcomes, and
 *    this platform has none — the outcome-learning loop cannot start until the
 *    department's own recoveries flow back in. Everything below is therefore a
 *    transparent rule over observable facts (is the entity still filing? is the
 *    turnover large enough to leave traceable assets? is the demand already
 *    locked in appeal?). Presenting this as a model-derived probability would be
 *    the single fastest way to discredit the platform.
 *
 * 2. THE WEIGHTS ARE CHOSEN, NOT FITTED. They encode a defensible argument
 *    about what matters, and they are visible so the argument can be had. They
 *    are not evidence.
 *
 * What is NOT a proxy is time-sensitivity: that comes from the statutory engine
 * and is law. It is deliberately the factor with the widest range, because a
 * case that can no longer be actioned is worth very little regardless of how
 * large or how wrong it is.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS, LITIGATION_CASES, NETWORK_CLUSTERS } from './mockData.js'
import { RECOVERY_CASES } from './recovery.js'
import { LIMITATION_REGISTER } from './statutory.js'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/* ---------------------------------------------------------------------------
 * FACTOR 1 — Time sensitivity. From statute, not judgement.
 *
 * A time-barred case scores near zero because no demand can be raised on it at
 * all: officer-days spent there buy nothing. This is the factor that most often
 * overturns a score-based ranking, and the only one a reviewer cannot dispute.
 * ------------------------------------------------------------------------- */
export function timeSensitivity(daysRemaining) {
  if (daysRemaining === null || daysRemaining === undefined) return 0.30
  if (daysRemaining < 0) return 0.05
  if (daysRemaining <= 30) return 1.00
  if (daysRemaining <= 90) return 0.80
  if (daysRemaining <= 180) return 0.60
  if (daysRemaining <= 365) return 0.40
  return 0.25
}

/* ---------------------------------------------------------------------------
 * FACTOR 2 — Probability of recovery. PROXY. See the header.
 *
 * Each contribution is returned alongside the score so the screen can show an
 * officer exactly which observable fact moved it, rather than a bare number.
 * ------------------------------------------------------------------------- */
export const RECOVERY_PROXIES = [
  {
    id: 'still_filing',
    label: 'Entity still filing returns',
    weight: +0.20,
    why: 'A taxpayer still filing is contactable, usually still trading, and has an operative bank account.',
    test: t => t.filingStatus === 'Regular Filer'
  },
  {
    id: 'non_filer',
    label: 'Non-filer — may no longer be operating',
    weight: -0.25,
    why: 'Non-filing is the strongest available signal that an entity has ceased to operate at its declared premises.',
    test: t => t.filingStatus === 'Non-Filer'
  },
  {
    id: 'traceable_scale',
    label: 'Turnover scale suggests traceable assets',
    weight: +0.12,
    why: 'Larger declared turnover correlates with attachable assets and identifiable banking.',
    test: t => t.monthlyTurnover > 5000000
  },
  {
    id: 'in_appeal',
    label: 'Demand already contested in appeal',
    weight: -0.15,
    why: 'A demand under appeal is locked until the appellate stage concludes; near-term realisation is unlikely.',
    test: t => LITIGATION_CASES.some(l => l.gstin === t.gstin)
  },
  {
    id: 'fresh_signal',
    label: 'Signal is recent',
    weight: +0.10,
    why: 'A fresh signal usually means credit has not yet dispersed beyond the first hop.',
    test: t => {
      const r = RECOVERY_CASES.find(x => x.gstin === t.gstin)
      return r ? r.daysSinceSignal <= 90 : false
    }
  }
]

export function recoveryProbability(t) {
  const applied = RECOVERY_PROXIES.filter(p => p.test(t))
  const raw = 0.50 + applied.reduce((s, p) => s + p.weight, 0)
  return { value: clamp(raw, 0.05, 0.95), applied }
}

/* ---------------------------------------------------------------------------
 * FACTOR 3 — Officer effort, in officer-days.
 *
 * The denominator. Without it the engine simply ranks big cases first, which is
 * what a spreadsheet already does. Effort is what makes this a portfolio choice.
 * ------------------------------------------------------------------------- */
export const EFFORT_DRIVERS = [
  { id: 'base', label: 'Baseline desk review', days: +1.5, test: () => true },
  { id: 'complexity', label: 'Multiple risk rules to substantiate', days: +0.4, test: t => (t.risk.triggeredRules || []).length > 2, perRule: true },
  { id: 'network', label: 'Counterparty chain to trace', days: +1.5, test: t => NETWORK_CLUSTERS.some(c => c.nodes.some(n => n.gstin === t.gstin)) },
  { id: 'appeal', label: 'Appeal record to review', days: +1.0, test: t => LITIGATION_CASES.some(l => l.gstin === t.gstin) },
  { id: 'notice_done', label: 'Notice already issued — setup complete', days: -0.5, test: t => t.noticesIssued > 0 }
]

export function officerEffort(t) {
  const applied = []
  let days = 0
  for (const d of EFFORT_DRIVERS) {
    if (!d.test(t)) continue
    const rules = (t.risk.triggeredRules || []).length
    const add = d.perRule ? d.days * Math.max(0, rules - 2) : d.days
    if (add === 0) continue
    days += add
    applied.push({ ...d, applied: Math.round(add * 10) / 10 })
  }
  return { days: Math.round(clamp(days, 0.5, 8) * 10) / 10, applied }
}

/* ---------------------------------------------------------------------------
 * The composite.
 * ------------------------------------------------------------------------- */
const EXPOSURE_REFERENCE = 5000000 // ₹50 L — normalises exposure to ~1.0

export const PRIORITY_CASES = TAXPAYERS
  .filter(t => (t.risk.triggeredRules || []).length > 0 && t.estimatedRevenueExposure > 0)
  .map(t => {
    const lim = LIMITATION_REGISTER.find(r => r.gstin === t.gstin) || null
    const rec = RECOVERY_CASES.find(r => r.gstin === t.gstin) || null
    const inCluster = NETWORK_CLUSTERS.some(c => c.nodes.some(n => n.gstin === t.gstin))

    const severity = t.risk.score / 100
    const exposureScore = Math.min(3, t.estimatedRevenueExposure / EXPOSURE_REFERENCE)
    const recoverability = rec ? rec.recoverability : 0.4
    const time = timeSensitivity(lim ? lim.daysRemaining : null)
    const network = inCluster ? 1.4 : 1.0
    const prob = recoveryProbability(t)
    const effort = officerEffort(t)

    const raw = (severity * exposureScore * recoverability * time * network * prob.value) / effort.days

    return {
      gstin: t.gstin,
      tradeName: t.tradeName,
      district: t.district,
      division: t.division,
      sector: t.sector,
      riskScore: t.risk.score,
      riskCategory: t.risk.category,
      exposure: t.estimatedRevenueExposure,
      recoverableNow: rec ? rec.recoverableNow : null,
      daysRemaining: lim ? lim.daysRemaining : null,
      bindingDate: lim ? lim.bindingDate : null,
      section: lim ? lim.section : null,
      factors: {
        severity: Math.round(severity * 100) / 100,
        exposureScore: Math.round(exposureScore * 100) / 100,
        recoverability: Math.round(recoverability * 100) / 100,
        time: Math.round(time * 100) / 100,
        network,
        probability: Math.round(prob.value * 100) / 100
      },
      probabilityDetail: prob.applied,
      effortDays: effort.days,
      effortDetail: effort.applied,
      raw
    }
  })

// Normalise to a readable 0-100 and rank both ways.
const maxRaw = Math.max(...PRIORITY_CASES.map(c => c.raw), 0.0001)
PRIORITY_CASES.forEach(c => { c.priorityScore = Math.round((c.raw / maxRaw) * 1000) / 10 })

const byPriority = [...PRIORITY_CASES].sort((a, b) => b.priorityScore - a.priorityScore || a.gstin.localeCompare(b.gstin))
const byRisk = [...PRIORITY_CASES].sort((a, b) => b.riskScore - a.riskScore || a.gstin.localeCompare(b.gstin))
const priRank = Object.fromEntries(byPriority.map((c, i) => [c.gstin, i + 1]))
const riskRank = Object.fromEntries(byRisk.map((c, i) => [c.gstin, i + 1]))

export const PRIORITY_QUEUE = byPriority.map(c => ({
  ...c,
  priorityRank: priRank[c.gstin],
  riskRank: riskRank[c.gstin],
  movement: riskRank[c.gstin] - priRank[c.gstin]
}))

/* Why a case moved. Written as an officer would need to justify it in a file
 * note — the dominant reasons first, in plain language, never a factor dump. */
export function explainMovement(c) {
  const direction = c.movement > 0 ? 'up' : c.movement < 0 ? 'down' : 'unchanged'

  /* Each reason declares which direction it supports. An earlier version pooled
   * them, which produced explanations that argued against themselves — a case
   * that fell was told it fell "because downstream credit may still be
   * blockable", which is a reason to rise. An officer reading that rightly
   * stops trusting the engine, so only reasons consistent with the movement
   * are offered. */
  const pool = [
    c.daysRemaining !== null && c.daysRemaining >= 0 && c.daysRemaining <= 90 &&
      ['up', `only ${c.daysRemaining} days remain to the statutory deadline of ${c.bindingDate}`],
    c.daysRemaining !== null && c.daysRemaining < 0 &&
      ['down', 'the statutory period has expired, so no demand can now be raised'],
    c.daysRemaining !== null && c.daysRemaining > 365 &&
      ['down', 'the statutory deadline is still distant, so the case can wait without loss'],
    c.recoverableNow && c.recoverableNow > 2000000 &&
      ['up', `₹${(c.recoverableNow / 100000).toFixed(1)} L remains realistically recoverable`],
    c.factors.recoverability <= 0.25 &&
      ['down', 'little of the exposure is still realistically recoverable at this signal age'],
    c.factors.network > 1 &&
      ['up', 'downstream credit in a linked cluster may still be blockable'],
    c.effortDays <= 2 &&
      ['up', `estimated effort is only ${c.effortDays} officer-days`],
    c.effortDays >= 5 &&
      ['down', `it would take an estimated ${c.effortDays} officer-days`],
    c.factors.probability >= 0.7 &&
      ['up', 'the entity is still filing and assets look traceable'],
    c.factors.probability <= 0.35 &&
      ['down', 'recovery prospects are weak on the available indicators']
  ].filter(Boolean)

  if (direction === 'unchanged') {
    return {
      direction,
      text: 'Priority {0} — unchanged from its risk-score rank.',
      textArgs: [c.priorityRank]
    }
  }
  const reasons = pool.filter(([d]) => d === direction).map(([, text]) => text)
  if (!reasons.length) {
    return {
      direction,
      text:
        'Moved {0} from risk rank {1} to priority {2} on the combined weighting of exposure, recoverability and effort.',
      textArgs: [direction, c.riskRank, c.priorityRank]
    }
  }
  return {
    direction,
    /* The reasons stay as separate strings rather than a joined sentence: each
       has its own catalogue entry, and the render site translates and joins
       them. Joining here would produce a key no catalogue can hold. */
    text: 'Moved {0} from risk rank {1} to priority {2} because {3}.',
    textArgs: [direction, c.riskRank, c.priorityRank],
    textReasons: reasons.slice(0, 3)
  }
}

/* ---------------------------------------------------------------------------
 * EQUITY MONITORING
 *
 * A prioritisation engine that quietly concentrates enforcement on a sector or
 * a district is challengeable, and in a tax context challengeable means
 * litigated. This compares the composition of the working queue against the
 * population it was drawn from and surfaces over-representation. It ships as a
 * feature, not as a later addition, because the Commissioner has to be able to
 * answer the question before it is asked.
 * ------------------------------------------------------------------------- */
function distribution(rows, key) {
  const counts = {}
  rows.forEach(r => { counts[r[key]] = (counts[r[key]] || 0) + 1 })
  return counts
}

export function equityCheck(queueSize = 40) {
  const worked = PRIORITY_QUEUE.slice(0, queueSize)
  const build = key => {
    const base = distribution(PRIORITY_CASES, key)
    const sel = distribution(worked, key)
    return Object.keys(base).map(k => {
      const basePct = (base[k] / PRIORITY_CASES.length) * 100
      const selPct = ((sel[k] || 0) / worked.length) * 100
      return {
        name: k,
        basePct: Math.round(basePct * 10) / 10,
        selectedPct: Math.round(selPct * 10) / 10,
        // Over 2.0 means a group is selected at more than twice its share of
        // the population — the threshold at which a pattern becomes arguable.
        ratio: basePct > 0 ? Math.round((selPct / basePct) * 100) / 100 : 0,
        selected: sel[k] || 0
      }
    }).sort((a, b) => b.ratio - a.ratio)
  }
  const sector = build('sector')
  const district = build('district')
  const flagged = [...sector, ...district].filter(r => r.ratio >= 2 && r.selected >= 3)
  return { queueSize: worked.length, sector, district, flagged }
}

/* ---------------------------------------------------------------------------
 * CONTROLLED COMPARISON — the pilot's proof mechanism
 *
 * Without a control arm, a pilot that shows improved recovery cannot separate
 * the platform from officer skill, case mix, or the effect of being observed. A
 * Commissioner cannot defend that to the AG, and a successor cannot renew it.
 *
 * Cases are stratified by exposure decile and risk band, then split
 * deterministically within each stratum so the two arms are comparable on the
 * things that would otherwise explain the difference.
 * ------------------------------------------------------------------------- */
function strataKey(c) {
  const decile = Math.min(9, Math.floor((c.exposure / 20000000) * 10))
  return `${c.riskCategory}|${decile}`
}

export function buildTrial(seed = 7) {
  const strata = {}
  PRIORITY_CASES.forEach(c => {
    const k = strataKey(c)
    ;(strata[k] = strata[k] || []).push(c)
  })
  const treatment = []
  const control = []
  // The starting arm alternates per stratum. Assigning every stratum from the
  // same side sent all singleton strata to one arm, which is how the first
  // version produced 36 against 54 with a 4x difference in Critical/High share.
  Object.keys(strata).sort().forEach((k, sIdx) => {
    const ordered = [...strata[k]].sort((a, b) => a.gstin.localeCompare(b.gstin))
    ordered.forEach((c, i) => ((i + sIdx + seed) % 2 === 0 ? treatment : control).push(c))
  })
  const mean = (arr, f) => (arr.length ? arr.reduce((s, x) => s + f(x), 0) / arr.length : 0)
  const balance = [
    { metric: 'Cases', a: treatment.length, b: control.length },
    { metric: 'Mean exposure (₹ L)', a: Math.round(mean(treatment, c => c.exposure) / 100000), b: Math.round(mean(control, c => c.exposure) / 100000) },
    { metric: 'Mean risk score', a: Math.round(mean(treatment, c => c.riskScore)), b: Math.round(mean(control, c => c.riskScore)) },
    { metric: 'Mean officer-days', a: Math.round(mean(treatment, c => c.effortDays) * 10) / 10, b: Math.round(mean(control, c => c.effortDays) * 10) / 10 },
    { metric: 'Critical / High share (%)', a: Math.round((treatment.filter(c => ['Critical', 'High'].includes(c.riskCategory)).length / Math.max(1, treatment.length)) * 100), b: Math.round((control.filter(c => ['Critical', 'High'].includes(c.riskCategory)).length / Math.max(1, control.length)) * 100) }
  ]
  return { treatment, control, balance, strataCount: Object.keys(strata).length }
}

export const TRIAL_ENDPOINTS = [
  {
    metric: 'Revenue recovered per officer-day',
    why: 'The primary endpoint. Capacity is the binding constraint, so the platform must be judged on what the same officer-days produce.'
  },
  {
    metric: 'Cases reaching limitation without action',
    why: 'The cleanest counterfactual available. A time-bar is unambiguous, dated, and cannot be attributed to officer judgement.'
  },
  {
    metric: 'Median signal-age at first action',
    why: 'Tests the mechanism directly — the platform claims to compress time-to-action, so this should move before recovery does.'
  },
  {
    metric: 'Selection concentration by sector and district',
    why: 'A guardrail, not a success measure. The treatment arm must not concentrate enforcement more than the control arm.'
  }
]

export const TRIAL_NOTE =
  'Arms are stratified by exposure decile and risk band so the comparison is not confounded by case mix. Officers in both arms work their normal capacity; only the ordering differs. The trial must run a full statutory cycle for the limitation endpoint to be meaningful, and the platform arm must not be given additional staff — that would measure resourcing rather than prioritisation.'
