/* ---------------------------------------------------------------------------
 * REVENUE PROTECTION COMMAND CENTRE
 *
 * THE ARITHMETIC IS THE HARD PART, NOT THE LAYOUT
 *
 * A command centre assembled by adding up its own modules is wrong, and wrong
 * in the direction that flatters it. The same rupee of exposure is counted by
 * the limitation engine (a deadline approaches), the recovery model (value is
 * decaying), the capacity allocation (nobody can work it this week) and the
 * network module (credit is still blockable in a chain). Summing those four
 * totals produces a headline several times larger than the money actually at
 * stake — the first figure a Commissioner will test, and the one that ends the
 * conversation when it fails.
 *
 * So the headline here is a UNION over taxpayers, not a sum over modules. Each
 * taxpayer contributes its value once, however many mechanisms flag it, and the
 * double-count that was avoided is reported as a figure in its own right rather
 * than quietly handled.
 *
 * PROTECTABLE IS NOT THE SAME AS AT RISK
 *
 * Value whose limitation period has already expired is not an opportunity. It
 * is a loss, and putting it inside a "protection opportunity" headline would
 * mean claiming credit for money that cannot be collected by any action. It is
 * reported separately, above the opportunity, because it is the more important
 * number and because its size is the argument for the platform.
 *
 * WHAT IS NOT HERE
 *
 * Several tiles a screen like this would normally carry cannot be computed on
 * the data the department currently holds — missed-fraud review candidates,
 * Section 73 cases exhibiting Section 74 patterns, counterfactual outcomes.
 * All of them require a labelled corpus of confirmed historical outcomes, and
 * no question of law in this dataset yet has five concluded proceedings. Those
 * tiles are listed as pending with the specific input that unblocks them,
 * rather than filled with plausible figures.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS } from './mockData.js'
import { LIMITATION_REGISTER, LIMITATION_SUMMARY } from './statutory.js'
import { RECOVERY_CASES, RECOVERY_PORTFOLIO, recoverabilityFor } from './recovery.js'
import { CAPACITY_RESULT } from './capacity.js'
import { NETWORK_PLANS, NETWORK_ACTION_SUMMARY } from './networkAction.js'

const DEFAULT_RECOVERABILITY = 0.40 // shared with the capacity engine

const byGstin = new Map(TAXPAYERS.map(t => [t.gstin, t]))
const recByGstin = new Map(RECOVERY_CASES.map(r => [r.gstin, r]))
const networkGstins = new Map()
NETWORK_PLANS.forEach(p => p.nodes.forEach(n => networkGstins.set(n.gstin, p)))

/* One value per taxpayer, used by every mechanism, so the mechanisms cannot
 * disagree about what a case is worth. */
const valueOf = gstin => {
  const rec = recByGstin.get(gstin)
  if (rec) return rec.recoverableNow
  const tp = byGstin.get(gstin)
  return tp ? tp.estimatedRevenueExposure * DEFAULT_RECOVERABILITY : 0
}

export const MECHANISMS = {
  limitation: {
    id: 'limitation',
    label: 'Approaching limitation',
    note: 'A statutory deadline falls within 90 days. If it passes the demand is extinguished by operation of law, whatever the merits.'
  },
  decay: {
    id: 'decay',
    label: 'Decaying while unworked',
    note: 'Recoverable value is falling week on week because credit continues to move downstream while the case waits.'
  },
  capacity: {
    id: 'capacity',
    label: 'No officer can reach it',
    note: 'No eligible officer in the division has capacity this week, or none is posted at all.'
  },
  network: {
    id: 'network',
    label: 'Blockable credit in a chain',
    note: 'Sits in a detected chain where credit remains blockable if action is taken before it is utilised.'
  },
  contested: {
    id: 'contested',
    label: 'Deadline rests on a contested notification',
    note: 'The limitation date depends on Notification 09/2023 or 56/2023, whose validity is reserved before the Supreme Court.'
  }
}

/* Every taxpayer with something at stake, and every mechanism that flags it. */
export const AT_RISK = (() => {
  const rows = new Map()
  const touch = gstin => {
    if (!rows.has(gstin)) {
      const tp = byGstin.get(gstin)
      if (!tp) return null
      rows.set(gstin, {
        gstin,
        tradeName: tp.tradeName,
        division: tp.division,
        district: tp.district,
        sector: tp.sector,
        value: valueOf(gstin),
        mechanisms: [],
        detail: {}
      })
    }
    return rows.get(gstin)
  }

  // Limitation — live deadlines only. An expired one is not an opportunity.
  LIMITATION_REGISTER.forEach(r => {
    if (r.daysRemaining == null || r.daysRemaining < 0) return
    if (r.daysRemaining > 90) return
    const row = touch(r.gstin)
    if (!row) return
    row.mechanisms.push('limitation')
    row.detail.daysRemaining = r.daysRemaining
    row.detail.bindingDate = r.bindingDate
    row.detail.section = r.section
  })

  // Contested notification — applies whether live or expired, because if the
  // notification falls, orders already passed under it were void when made.
  LIMITATION_REGISTER.filter(r => r.contested).forEach(r => {
    const row = touch(r.gstin)
    if (!row) return
    row.mechanisms.push('contested')
  })

  RECOVERY_CASES.filter(r => r.decayNextWeek > 200000).forEach(r => {
    const row = touch(r.gstin)
    if (!row) return
    row.mechanisms.push('decay')
    row.detail.decayNextWeek = r.decayNextWeek
  })

  CAPACITY_RESULT.unworkable.forEach(u => {
    const row = touch(u.gstin)
    if (!row) return
    row.mechanisms.push('capacity')
    row.detail.capacityReason = u.reason
  })

  networkGstins.forEach((plan, gstin) => {
    if (plan.blockableRupees <= 0) return
    const row = touch(gstin)
    if (!row) return
    row.mechanisms.push('network')
    row.detail.cluster = plan.id
  })

  return [...rows.values()]
    .map(r => ({ ...r, mechanisms: [...new Set(r.mechanisms)] }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value)
})()

/* Per-mechanism totals. These deliberately overlap — the overlap is the point,
 * and it is quantified below rather than hidden. */
export const BY_MECHANISM = Object.values(MECHANISMS).map(m => {
  const members = AT_RISK.filter(r => r.mechanisms.includes(m.id))
  return {
    ...m,
    count: members.length,
    value: members.reduce((s, r) => s + r.value, 0)
  }
}).sort((a, b) => b.value - a.value)

const unionValue = AT_RISK.reduce((s, r) => s + r.value, 0)
const sumOfMechanisms = BY_MECHANISM.reduce((s, m) => s + m.value, 0)

/* Already lost. Reported above the opportunity, never inside it. */
const barred = LIMITATION_REGISTER.filter(r => r.daysRemaining != null && r.daysRemaining < 0)

export const COMMAND_SUMMARY = {
  // The headline. Each taxpayer counted once.
  protectableValue: unionValue,
  protectableCases: AT_RISK.length,

  // What summing the modules would have produced, and the gap.
  naiveSum: sumOfMechanisms,
  doubleCountAvoided: sumOfMechanisms - unionValue,
  overlapFactor: unionValue > 0 ? Math.round((sumOfMechanisms / unionValue) * 100) / 100 : null,
  multiMechanismCases: AT_RISK.filter(r => r.mechanisms.length > 1).length,

  // Already forfeited — not part of the opportunity.
  forfeitedValue: barred.reduce((s, r) => s + r.exposure, 0),
  forfeitedCases: barred.length,

  // Supporting figures, each from the engine that owns it.
  within30Cr: LIMITATION_SUMMARY.within30Cr,
  within30Count: LIMITATION_SUMMARY.within30Count,
  contestedCr: LIMITATION_SUMMARY.contestedCr,
  contestedCount: LIMITATION_SUMMARY.contestedCount,
  decayNextWeekCr: RECOVERY_PORTFOLIO.decayNextWeekCr,
  unreachableCases: CAPACITY_RESULT.unworkableCount,
  mandatoryUnreachable: CAPACITY_RESULT.mandatoryUnworkable.length,
  networkBlockableCr: NETWORK_ACTION_SUMMARY.blockableCr,
  networkAlreadyUtilisedCr: NETWORK_ACTION_SUMMARY.utilisedCr
}

/* The week's actions, ranked by value actually protected by doing them —
 * which is not the same as the value of the case. Working a case whose
 * deadline is 80 days away protects nothing this week; working one at 12 days
 * protects all of it. */
export const TOP_ACTIONS = AT_RISK
  .map(r => {
    let protects = 0
    let action = null
    let actionArgs = []
    let because = null
    let becauseArgs = []
    let horizon = null

    if (r.mechanisms.includes('limitation') && r.detail.daysRemaining <= 30) {
      protects = r.value
      action = 'Issue notice before {0}'
      actionArgs = [r.detail.bindingDate]
      because =
        '{0} days remain under {1}. After that the demand is extinguished by operation of law and the full amount is lost.'
      becauseArgs = [r.detail.daysRemaining, r.detail.section.replace('s', 'Section ')]
      horizon = r.detail.daysRemaining
    } else if (r.detail.decayNextWeek > 0) {
      protects = r.detail.decayNextWeek
      action = 'Open and progress this week'
      because =
        'This is the value forecast to become unrecoverable if the case is untouched for a further seven days. The rest of the exposure is not at risk this week.'
      horizon = 7
    } else if (r.mechanisms.includes('network')) {
      // Only the value the chain loses in a week, on the same decay curve the
      // recovery model uses. Counting the whole case here would claim a chain
      // loses everything in seven days, which would rank network work above
      // genuinely urgent limitation work on an arithmetic artefact.
      const plan = networkGstins.get(r.gstin)
      const age = plan ? plan.ageDays : 0
      const retained = age > 0 ? recoverabilityFor(age + 7) / recoverabilityFor(age) : 1
      protects = Math.round(r.value * (1 - retained))
      action = 'Act on chain {0}'
      actionArgs = [r.detail.cluster]
      because =
        'Credit in this chain remains blockable, and this is the share of it forecast to be utilised over the next seven days. The chain is {0} days old, so the curve here is flatter than it would be on a fresh signal.'
      becauseArgs = [age]
      horizon = 7
    } else if (r.mechanisms.includes('limitation')) {
      protects = 0
      action = 'Schedule before {0}'
      actionArgs = [r.detail.bindingDate]
      because =
        '{0} days remain, so nothing is lost by not working it this week — but it must not slip past the window.'
      becauseArgs = [r.detail.daysRemaining]
      horizon = r.detail.daysRemaining
    }
    if (!action) return null
    return {
      ...r,
      protects,
      action,
      actionArgs,
      because,
      becauseArgs,
      horizon,
      reachable: !r.mechanisms.includes('capacity')
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.protects - a.protects)
  .slice(0, 10)

export const TOP_ACTIONS_NOTE =
  'Ranked by the value these actions protect THIS WEEK, which is deliberately not the same as the value of the case. A large case whose deadline is eighty days away loses nothing by waiting, and ranking it above a smaller one that decays on Friday would spend the week badly. Where an action is marked unreachable, no eligible officer in that division has capacity — the action is still correct, but it cannot be taken without a deployment decision.'

/* Capabilities that cannot be computed from what the department holds today.
 * Listed rather than approximated, each with the specific input that unblocks
 * it, so the gap is a procurement decision rather than a mystery. */
export const PENDING_CAPABILITIES = [
  {
    id: 'missed_fraud',
    label: 'Missed-revenue review candidates',
    wanted: 'Closed and no-action cases whose evidence resembles historically confirmed suppression.',
    blockedBy: 'A labelled corpus of confirmed outcomes. Resemblance to confirmed fraud cannot be computed without confirmed fraud to resemble.',
    evidence: 'No question of law in this dataset has five concluded proceedings, so every departmental success rate is currently withheld as statistically meaningless.'
  },
  {
    id: 's73_s74',
    label: 'Section 73 cases showing Section 74 patterns',
    wanted: 'Cases treated as non-fraud whose evidence profile matches historically confirmed fraud cases.',
    blockedBy: 'The same labelled corpus, plus the adjudication outcome on each closed case.',
    evidence: 'Reclassification carries a materially longer limitation period and a higher penalty, so a model proposing it must be defensible in appeal. On the current sample it would not be.'
  },
  {
    id: 'counterfactual',
    label: 'Counterfactual case outcomes',
    wanted: 'What revenue might have resulted had a case been escalated differently.',
    blockedBy: 'Outcome histories across comparable cases, and enough of them to support a comparison rather than an anecdote.',
    evidence: 'A counterfactual drawn from three concluded cases is a guess wearing a number.'
  },
  {
    id: 'emerging_network',
    label: 'Previously low-risk taxpayers showing emerging network anomalies',
    wanted: 'Entities not currently flagged that are becoming linked to flagged ones.',
    blockedBy: 'Registration-identity linkage — shared premises, telephone, bank account, authorised signatory, PAN. The rulebook detects circular trading from invoice flow; it does not detect shared identity.',
    evidence: 'Tested against this dataset and not demonstrable: contact details here are synthesised per taxpayer, so apparent shared-email groups are a trade-name artifact rather than a signal.'
  }
]

export const HEADLINE_METHOD_NOTE =
  'The headline counts each taxpayer once, however many mechanisms flag it. Adding the mechanism totals instead would give a figure that is larger, and wrong by exactly the amount shown as double-count avoided. Value whose limitation period has already expired is excluded from the opportunity entirely and reported separately, because no action can recover it and including it would claim credit for money that is gone.'

/* ---------------------------------------------------------------------------
 * HORIZON PROFILE — "revenue at risk of becoming unrecoverable by day N"
 *
 * Two mechanisms destroy value on different clocks, and a forecast that models
 * only one of them is wrong in both directions.
 *
 *   Limitation is a CLIFF. The day after the deadline the demand is worth
 *   nothing, whatever its merits and whatever the recovery model says.
 *   Decay is a SLOPE. Credit moves downstream continuously while a case waits.
 *
 * Value at day N is therefore the decayed value, floored to zero once the
 * statutory deadline has passed. Cumulative loss is what is gone by then.
 * ------------------------------------------------------------------------- */
export const HORIZONS = [0, 30, 60, 90, 180, 365]

const ageOf = gstin => {
  const rec = recByGstin.get(gstin)
  return rec ? rec.daysSinceSignal : null
}

function valueAtDay(row, day) {
  const lim = LIMITATION_REGISTER.find(r => r.gstin === row.gstin)
  // The cliff. Nothing survives it.
  if (lim && lim.daysRemaining != null && lim.daysRemaining >= 0 && lim.daysRemaining <= day) return 0
  // The slope.
  const age = ageOf(row.gstin)
  if (age == null) return row.value
  const now = recoverabilityFor(age)
  if (!now) return 0
  return row.value * (recoverabilityFor(age + day) / now)
}

export const HORIZON_PROFILE = HORIZONS.map(day => {
  let remaining = 0
  let lostToLimitation = 0
  let lostToDecay = 0
  AT_RISK.forEach(row => {
    const lim = LIMITATION_REGISTER.find(r => r.gstin === row.gstin)
    const expires = lim && lim.daysRemaining != null && lim.daysRemaining >= 0 && lim.daysRemaining <= day
    const decayed = (() => {
      const age = ageOf(row.gstin)
      if (age == null) return row.value
      const now = recoverabilityFor(age)
      return now ? row.value * (recoverabilityFor(age + day) / now) : 0
    })()
    if (expires) {
      // Attribute to the cliff only what the slope had not already taken.
      lostToDecay += row.value - decayed
      lostToLimitation += decayed
    } else {
      lostToDecay += row.value - decayed
      remaining += decayed
    }
  })
  return {
    day,
    label: day === 0 ? 'today' : `${day}d`,
    remainingCr: Math.round((remaining / 10000000) * 100) / 100,
    lostCr: Math.round(((lostToLimitation + lostToDecay) / 10000000) * 100) / 100,
    lostToLimitationCr: Math.round((lostToLimitation / 10000000) * 100) / 100,
    lostToDecayCr: Math.round((lostToDecay / 10000000) * 100) / 100
  }
})

/* ---------------------------------------------------------------------------
 * THE PROTECTION FUNNEL
 *
 * Where value leaks out between "owed" and "actually protected this week".
 * Each step is a different kind of loss with a different owner, which is why
 * they are separated rather than netted into one recovery rate.
 * ------------------------------------------------------------------------- */
const grossExposure = TAXPAYERS.reduce((s, t) => s + t.estimatedRevenueExposure, 0)
const reachable = AT_RISK.filter(r => !r.mechanisms.includes('capacity'))
const actionedValue = TOP_ACTIONS.filter(a => a.reachable).reduce((s, a) => s + a.protects, 0)

export const PROTECTION_FUNNEL = [
  {
    id: 'exposure',
    label: 'Assessed revenue exposure',
    value: grossExposure,
    note: 'Everything the risk engine believes is owed across the modelled population.'
  },
  {
    id: 'recoverable',
    label: 'Still recoverable today',
    value: AT_RISK.reduce((s, r) => s + r.value, 0),
    lossReason: 'Lost to detection lag and downstream utilisation before this week began.',
    owner: 'Detection speed'
  },
  {
    id: 'reachable',
    label: 'An eligible officer could work it',
    value: reachable.reduce((s, r) => s + r.value, 0),
    lossReason: 'No eligible officer in that division has capacity, or none is posted at all.',
    owner: 'Deployment'
  },
  {
    id: 'protected',
    label: 'Protected by acting this week',
    value: actionedValue,
    lossReason: 'The remainder is not lost — it is simply not at risk within seven days, and will surface in a later week.',
    owner: 'Scheduling'
  }
].map((step, i, arr) => ({
  ...step,
  pctOfStart: grossExposure ? Math.round((step.value / grossExposure) * 1000) / 10 : 0,
  dropFromPrev: i === 0 ? 0 : arr[i - 1].value - step.value
}))

/* Concentration — where a Commissioner would send attention first. */
export const BY_DIVISION = (() => {
  const g = new Map()
  AT_RISK.forEach(r => {
    if (!g.has(r.division)) g.set(r.division, { division: r.division, value: 0, cases: 0, unreachable: 0 })
    const d = g.get(r.division)
    d.value += r.value
    d.cases += 1
    if (r.mechanisms.includes('capacity')) d.unreachable += 1
  })
  return [...g.values()]
    .map(d => ({ ...d, unreachablePct: d.cases ? Math.round((d.unreachable / d.cases) * 100) : 0 }))
    .sort((a, b) => b.value - a.value)
})()

/* Cases where a question of law, not a question of fact, decides the outcome. */
export const LEGAL_REVIEW = {
  count: AT_RISK.filter(r => r.mechanisms.includes('contested')).length,
  value: AT_RISK.filter(r => r.mechanisms.includes('contested')).reduce((s, r) => s + r.value, 0),
  reason: 'The limitation date depends on Notification 09/2023 or 56/2023. High Courts have divided on their validity and the Supreme Court has reserved judgment, so these turn on a question of law rather than of fact and need a legal view before any order issues.'
}

export const HORIZON_NOTE =
  'Two clocks run at once and they behave differently. Limitation is a cliff — the day after the deadline the demand is worth nothing however strong it is. Decay is a slope — credit keeps moving downstream while the case waits. A forecast modelling only decay would miss the cliff entirely; one modelling only deadlines would show value as safe while it quietly erodes. Both are applied here, and the split between them is shown because they call for different responses: the cliff needs a notice issued, the slope needs the case opened sooner.'

export const FUNNEL_NOTE =
  'Each step loses value to a different cause with a different owner, which is why they are not netted into a single recovery rate. Detection speed governs the first drop, deployment the second, scheduling the third. Only the first two are losses in any real sense — the final step is small because most value is simply not at risk within seven days, not because it has gone.'
