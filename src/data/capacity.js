/* ---------------------------------------------------------------------------
 * OFFICER CAPACITY — A CONSTRAINED ASSIGNMENT PROBLEM
 *
 * The generic version of this feature ranks cases, deals the top N to each
 * officer, and draws a balanced-workload bar chart. It rests on two premises
 * that are both false in a tax administration:
 *
 *   FALSE 1 — capacity is fungible. It is not. An officer can only work a case
 *   in their own division, and role determines the case type they may take. A
 *   department can hold plenty of aggregate slack while a single division is
 *   three times oversubscribed, and the aggregate figure hides exactly the
 *   thing a Commissioner needs to see.
 *
 *   FALSE 2 — a statutory deadline is a heavy weight. It is not a weight at
 *   all, it is a constraint. A case that goes time-barred is not worth less; it
 *   is worth zero, permanently, and it is an accountability event. Weighting it
 *   allows the optimiser to trade it away against enough smaller cases, which
 *   is precisely what must never happen.
 *
 * So this models the real problem: a bipartite assignment under hard
 * eligibility edges, with limitation-critical work as a MUST-ASSIGN set that
 * consumes capacity before anything else competes for it, and effort measured
 * in officer-days rather than case counts.
 *
 * WHAT THIS DELIBERATELY DOES NOT CLAIM
 *
 * Generalised assignment is NP-hard. This is a greedy heuristic and says so.
 * Rather than assert optimality it computes an upper bound by relaxing both
 * eligibility and integrality, and reports the achieved share of that bound —
 * so the true optimum is known to lie between the two figures. An allocation
 * that claimed to be optimal without a bound would be the same kind of
 * unearned confidence as a success rate computed on two cases.
 *
 * THE OUTPUT THAT MATTERS IS THE RESIDUAL
 *
 * Demand exceeds capacity. The honest deliverable is therefore not a tidier
 * allocation — it is the set of cases nobody eligible can reach before they
 * expire, and the identification of which specific constraint binds. A
 * Commissioner can act on "three audit officers in Pune are the binding
 * constraint, and one more officer-week there is worth this much". Nobody can
 * act on a balanced workload chart.
 * ------------------------------------------------------------------------- */

import { OFFICERS, NETWORK_CLUSTERS } from './mockData.js'
import { PRIORITY_QUEUE } from './priority.js'

/* --- Stated assumptions. Every one of these is a policy input, not a
 * measurement, and each is surfaced in the UI so it can be argued with. --- */
export const CAPACITY_ASSUMPTIONS = [
  { id: 'week', label: 'Working days per officer per week', value: '5.0 days', note: 'Standard working week.' },
  { id: 'overhead', label: 'Share spent on non-case work', value: '30%', note: 'Hearings, correspondence, returns scrutiny administration and establishment work. Not available for case allocation.' },
  { id: 'net', label: 'Net case capacity per officer per week', value: '3.5 days', note: 'The figure the allocation actually spends.' },
  { id: 'critical', label: 'Limitation-critical threshold', value: '30 days or fewer', note: 'Inside this window a case is treated as mandatory, not as a high-scoring option.' },
  { id: 'fallback', label: 'Recoverability where no recovery record exists', value: '0.40', note: 'The same base rate used by the priority engine, applied so the two modules cannot disagree about the value of the same case.' }
]

const DAYS_PER_WEEK = 5
const OVERHEAD_SHARE = 0.30
export const NET_DAYS_PER_OFFICER = Math.round(DAYS_PER_WEEK * (1 - OVERHEAD_SHARE) * 10) / 10 // 3.5
const CRITICAL_DAYS = 30
const DEFAULT_RECOVERABILITY = 0.40

/* --- Eligibility. The hard constraint, and the whole point of the module. ---
 *
 * Role determines the case type an officer may take; division is territorial
 * and absolute. An edge exists only where both hold. */
export const CASE_TYPES = {
  investigation: {
    label: 'Investigation',
    roles: ['Investigation Officer'],
    note: 'A case with a counterparty chain to trace. Requires investigation powers; an audit officer cannot take it.'
  },
  audit: {
    label: 'Audit / scrutiny',
    roles: ['Audit Officer', 'Division Officer'],
    note: 'Desk review and scrutiny of a single registration. Either an audit officer or the division officer may take it.'
  }
}

// Network membership is what makes a case an investigation, and it is the same
// cluster index the priority engine charges +1.5 effort-days for.
const clusterGstins = new Set(NETWORK_CLUSTERS.flatMap(c => c.nodes.map(n => n.gstin)))
export const caseTypeOf = c => (clusterGstins.has(c.gstin) ? 'investigation' : 'audit')

export const FIELD_ROLES = ['Investigation Officer', 'Audit Officer', 'Division Officer']

export function isEligible(officer, kase) {
  if (officer.division !== kase.division) return false
  return CASE_TYPES[caseTypeOf(kase)].roles.includes(officer.role)
}

/* Value at stake if the case IS worked this week. Recoverable value, not raw
 * exposure — exposure that cannot be collected is not a reason to spend an
 * officer-day on it. */
const workableValue = c =>
  c.recoverableNow != null ? c.recoverableNow : c.exposure * DEFAULT_RECOVERABILITY

// Value per officer-day. This, not the priority score, is what capacity should
// be spent against — a case twice as valuable and three times as slow is a
// worse use of the same day.
const density = c => workableValue(c) / c.effortDays

const isCritical = c => c.daysRemaining != null && c.daysRemaining >= 0 && c.daysRemaining <= CRITICAL_DAYS
const isBarred = c => c.daysRemaining != null && c.daysRemaining < 0

/* ---------------------------------------------------------------------------
 * THE ALLOCATION
 * ------------------------------------------------------------------------- */
export function allocate() {
  const officers = OFFICERS
    .filter(o => FIELD_ROLES.includes(o.role))
    .map(o => ({ ...o, remaining: NET_DAYS_PER_OFFICER, assigned: [] }))

  // A time-barred case cannot be worked at all; spending capacity on it is the
  // error the statutory engine exists to prevent.
  const pool = PRIORITY_QUEUE.filter(c => !isBarred(c))
  const barredExcluded = PRIORITY_QUEUE.filter(isBarred)

  const assignments = []
  const unworkable = []

  // Pick the eligible officer with the most capacity left. Assigning to the
  // emptiest officer keeps the largest remaining block intact, which matters
  // because the effort distribution is lumpy — a 4-day network case fits
  // nowhere once every officer has been topped up with small ones.
  const place = (kase, phase) => {
    const eligible = officers.filter(o => isEligible(o, kase))
    if (!eligible.length) {
      unworkable.push({ ...kase, reason: 'no_eligible_officer', phase })
      return false
    }
    const best = eligible.reduce((a, b) => (b.remaining > a.remaining ? b : a))
    if (best.remaining < kase.effortDays) {
      // A case needing more days than an officer's whole week can never be
      // placed by this allocation however many officers are added — it is
      // indivisible and larger than the unit of capacity. Separating it matters
      // because the remedy is a multi-week block or a two-officer team, not
      // recruitment, and the marginal-value calculation below correctly values
      // an extra officer-week at zero for such a pool.
      const reason = kase.effortDays > NET_DAYS_PER_OFFICER ? 'exceeds_weekly_capacity' : 'no_capacity'
      unworkable.push({ ...kase, reason, phase, bestRemaining: Math.round(best.remaining * 10) / 10 })
      return false
    }
    best.remaining = Math.round((best.remaining - kase.effortDays) * 10) / 10
    const row = { ...kase, officerId: best.id, officerName: best.name, officerRole: best.role, phase }
    best.assigned.push(row)
    assignments.push(row)
    return true
  }

  // PHASE A — mandatory. Ordered by deadline, not by value: within the
  // critical window the only defensible ordering is which expires first.
  const mandatory = pool.filter(isCritical).sort((a, b) => a.daysRemaining - b.daysRemaining)
  mandatory.forEach(c => place(c, 'mandatory'))

  // PHASE B — discretionary, on whatever capacity survives Phase A.
  const discretionary = pool.filter(c => !isCritical(c)).sort((a, b) => density(b) - density(a))
  discretionary.forEach(c => place(c, 'discretionary'))

  return { officers, assignments, unworkable, mandatory, discretionary, barredExcluded }
}

/* ---------------------------------------------------------------------------
 * HOW GOOD IS THIS ALLOCATION?
 *
 * A valid upper bound on the true optimum, obtained by relaxing BOTH hard
 * constraints: eligibility (any officer may take any case) and integrality
 * (a case may be worked fractionally). Any feasible allocation of the real
 * problem is also feasible in the relaxation, so the relaxed value can never be
 * lower than the true optimum.
 *
 * That makes the reported figure a genuine floor on quality: the achieved value
 * is real, the bound is unreachable, and the optimum sits between them. It is
 * not a claim of optimality and must never be presented as one.
 * ------------------------------------------------------------------------- */
export function relaxedUpperBound(pool, totalDays) {
  const sorted = [...pool].sort((a, b) => density(b) - density(a))
  let days = totalDays
  let value = 0
  for (const c of sorted) {
    if (days <= 0) break
    const take = Math.min(c.effortDays, days)
    value += density(c) * take // fractional take — the integrality relaxation
    days -= take
  }
  return value
}

/* ---------------------------------------------------------------------------
 * WHICH CONSTRAINT BINDS
 *
 * Capacity is pooled by (division × case type), because that is the granularity
 * at which an officer-week can actually be moved. Aggregate slack is
 * meaningless if it sits in the wrong pool.
 *
 * The marginal value of an officer-week is computed, not asserted: it is the
 * value of the best cases currently unreachable in that pool, up to one week of
 * capacity. That makes it a real answer to "where should the next officer go".
 * ------------------------------------------------------------------------- */
export function poolAnalysis(result) {
  const pools = new Map()
  const key = (division, type) => `${division}||${type}`

  const touch = (division, type) => {
    const k = key(division, type)
    if (!pools.has(k)) {
      pools.set(k, {
        key: k, division, type, typeLabel: CASE_TYPES[type].label,
        officerCount: 0, supplyDays: 0, demandDays: 0,
        assignedCount: 0, assignedDays: 0,
        unworkableCount: 0, unworkableValue: 0, unworkableCritical: 0,
        unreachable: []
      })
    }
    return pools.get(k)
  }

  // Supply — an officer contributes to every case type their role can take.
  result.officers.forEach(o => {
    Object.entries(CASE_TYPES).forEach(([type, def]) => {
      if (!def.roles.includes(o.role)) return
      const p = touch(o.division, type)
      p.officerCount += 1
      p.supplyDays += NET_DAYS_PER_OFFICER
    })
  })

  // Demand, and what actually landed.
  result.assignments.forEach(a => {
    const p = touch(a.division, caseTypeOf(a))
    p.demandDays += a.effortDays
    p.assignedCount += 1
    p.assignedDays += a.effortDays
  })
  result.unworkable.forEach(u => {
    const p = touch(u.division, caseTypeOf(u))
    p.demandDays += u.effortDays
    p.unworkableCount += 1
    p.unworkableValue += workableValue(u)
    if (u.phase === 'mandatory') p.unworkableCritical += 1
    p.unreachable.push(u)
  })

  return [...pools.values()].map(p => {
    // Marginal value of adding one officer-week here — computed from the actual
    // unreachable cases, best-density first, not from an average.
    let days = NET_DAYS_PER_OFFICER
    let marginal = 0
    let marginalCases = 0
    for (const c of [...p.unreachable].sort((a, b) => density(b) - density(a))) {
      if (days < c.effortDays) continue
      days -= c.effortDays
      marginal += workableValue(c)
      marginalCases += 1
    }
    return {
      ...p,
      supplyDays: Math.round(p.supplyDays * 10) / 10,
      demandDays: Math.round(p.demandDays * 10) / 10,
      assignedDays: Math.round(p.assignedDays * 10) / 10,
      utilisation: p.supplyDays > 0 ? Math.round((p.assignedDays / p.supplyDays) * 100) : null,
      subscription: p.supplyDays > 0 ? Math.round((p.demandDays / p.supplyDays) * 100) / 100 : null,
      marginalOfficerWeekValue: Math.round(marginal),
      marginalOfficerWeekCases: marginalCases,
      unreachable: undefined // large; the caller does not need the rows
    }
  }).sort((a, b) => (b.subscription || 0) - (a.subscription || 0))
}

/* ------------------------------------------------------------------------- */

const RESULT = allocate()
const POOLS = poolAnalysis(RESULT)

const totalSupplyDays = RESULT.officers.length * NET_DAYS_PER_OFFICER
const achievedValue = RESULT.assignments.reduce((s, a) => s + workableValue(a), 0)
const boundValue = relaxedUpperBound(RESULT.mandatory.concat(RESULT.discretionary), totalSupplyDays)

export const CAPACITY_RESULT = {
  officers: RESULT.officers,
  assignments: RESULT.assignments,
  unworkable: RESULT.unworkable,
  barredExcluded: RESULT.barredExcluded,

  officerCount: RESULT.officers.length,
  totalSupplyDays: Math.round(totalSupplyDays * 10) / 10,
  usedDays: Math.round(RESULT.assignments.reduce((s, a) => s + a.effortDays, 0) * 10) / 10,

  poolCount: RESULT.mandatory.length + RESULT.discretionary.length,
  mandatoryCount: RESULT.mandatory.length,
  mandatoryUnworkable: RESULT.unworkable.filter(u => u.phase === 'mandatory'),

  assignedCount: RESULT.assignments.length,
  unworkableCount: RESULT.unworkable.length,
  unworkableValue: RESULT.unworkable.reduce((s, u) => s + workableValue(u), 0),
  noEligibleOfficer: RESULT.unworkable.filter(u => u.reason === 'no_eligible_officer').length,
  noCapacity: RESULT.unworkable.filter(u => u.reason === 'no_capacity').length,
  exceedsWeek: RESULT.unworkable.filter(u => u.reason === 'exceeds_weekly_capacity').length,

  achievedValue,
  boundValue,
  captureShare: boundValue > 0 ? Math.round((achievedValue / boundValue) * 100) : null,

  pools: POOLS,
  bindingPools: POOLS.filter(p => p.subscription != null && p.subscription > 1)
}

export const CAPACITY_METHOD_NOTE =
  'This is a greedy heuristic on a bipartite assignment problem, not a solved optimum — generalised assignment is NP-hard and no claim of optimality is made. The comparison figure is an upper bound obtained by relaxing both eligibility and integrality, so it is unreachable by construction and the true optimum lies between the achieved value and the bound. Limitation-critical work is assigned before anything else competes for capacity, and is ordered by expiry rather than by value, because inside that window the only defensible ordering is which case dies first.'

export const RESIDUAL_REASONS = {
  no_eligible_officer: {
    label: 'No eligible officer in the division',
    remedy: 'A deployment problem. No scheduling change reaches these cases — there is nobody posted who may lawfully take them. Requires a posting or a jurisdictional reassignment.'
  },
  no_capacity: {
    label: 'Eligible officers fully committed',
    remedy: 'A volume problem. Officers exist and may take the case, but the week is already spent. Responds to additional capacity in that specific pool — the marginal value of one officer-week is computed per pool below.'
  },
  exceeds_weekly_capacity: {
    label: 'Case larger than any single officer-week',
    remedy: `Neither a deployment nor a volume problem. The case needs more than ${NET_DAYS_PER_OFFICER} days and is indivisible, so it can never be placed inside a one-week horizon however many officers are added. Requires a multi-week block or a two-officer team.`
  }
}

export const CAPACITY_RESIDUAL_NOTE =
  'The residual is the finding, not a failure of the allocation. Cases land here for three distinct reasons that call for three different remedies — a posting, more capacity in one specific pool, or a longer working block — and they are reported separately because conflating them produces the wrong decision. Aggregate utilisation is the figure to distrust: the department can sit well below full utilisation while a single division runs three times oversubscribed, because an unused officer-day in one division cannot be spent in another.'
