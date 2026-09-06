/* ---------------------------------------------------------------------------
 * STATUTORY TIME ENGINE
 *
 * The one part of this platform that is LAW, not a model.
 *
 * Every other score here is an estimate that a reviewer may argue with. A
 * limitation date is not: it is computable from the tax period and the section
 * invoked, and when it passes the demand is extinguished by operation of law.
 * Revenue lost to limitation is irreversible, unarguable, and attributable to a
 * named officer and date — which is why this engine leads the platform.
 *
 * That also means an error here is far worse than an error anywhere else. Every
 * rule below carries its statutory basis in `cite`, and nothing is encoded from
 * memory. Where a deadline rests on a notification currently under judicial
 * challenge, the engine says so rather than presenting it as settled.
 *
 * THE RULES ENCODED
 *
 *   s.73 (non-fraud)   order within 3 years of the due date for the annual
 *                      return for that FY; SCN at least 3 months before that.
 *   s.74 (fraud etc.)  order within 5 years of the same date; SCN at least
 *                      6 months before.
 *   s.74A (FY 2024-25  a single regime replacing the 73/74 split: SCN within
 *   onwards)           42 months of the annual-return due date; order within
 *                      12 months of the SCN, extendable by up to 6 months.
 *
 * VERIFY BEFORE RELYING ON THIS IN PRODUCTION. Limitation is amended by
 * notification more often than any other part of GST law, and the extension
 * table below is a point-in-time capture read on 2026-09-06.
 * ------------------------------------------------------------------------- */

import { REFERENCE_DATE } from './mockData.js'

/* All limitation arithmetic runs in UTC, deliberately.
 *
 * Constructing these dates in local time and serialising with toISOString()
 * shifts every one of them back a day in IST (local midnight is 18:30 UTC the
 * previous day), which silently turned a 31 December deadline into 30 December.
 * A limitation engine that is a day out is worse than none at all, so dates are
 * parsed, advanced and formatted entirely on the UTC calendar. */
const DAY_MS = 86400000
const parse = s => Date.parse(s + 'T00:00:00Z')
const fmt = ms => new Date(ms).toISOString().slice(0, 10)

// A local Date (REFERENCE_DATE) rebased onto the UTC calendar by its Y/M/D.
const asUtcDay = dt => Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())

const addYearsUtc = (ms, n) => {
  const x = new Date(ms)
  x.setUTCFullYear(x.getUTCFullYear() + n)
  return x.getTime()
}
/* Month arithmetic clamped to the end of the target month.
 *
 * Naive setUTCMonth() overflows: 31 December minus three months resolves to a
 * non-existent 31 September and rolls FORWARD to 1 October — a day later than
 * the statute allows. In a limitation engine that error runs in the dangerous
 * direction, telling an officer they have a day they do not. Clamping gives the
 * correct 30 September. */
const addMonthsUtc = (ms, n) => {
  const x = new Date(ms)
  const day = x.getUTCDate()
  x.setUTCDate(1)
  x.setUTCMonth(x.getUTCMonth() + n)
  const lastOfMonth = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate()
  x.setUTCDate(Math.min(day, lastOfMonth))
  return x.getTime()
}
const daysBetween = (fromMs, toMs) => Math.round((toMs - fromMs) / DAY_MS)

export const STATUTORY_SOURCES = {
  s73: {
    label: 'Section 73, CGST/MGST Act',
    note: 'Tax not paid, short paid, or ITC wrongly availed — other than by fraud, wilful misstatement or suppression.',
    url: 'https://taxinformation.cbic.gov.in/'
  },
  s74: {
    label: 'Section 74, CGST/MGST Act',
    note: 'Tax not paid, short paid, or ITC wrongly availed by reason of fraud, wilful misstatement or suppression of facts.',
    url: 'https://taxinformation.cbic.gov.in/'
  },
  s74A: {
    label: 'Section 74A, CGST/MGST Act',
    note: 'Inserted by the Finance (No. 2) Act, 2024. Applies from FY 2024-25 and removes the fraud / non-fraud split for time limits.',
    url: 'https://taxinformation.cbic.gov.in/'
  },
  n09_2023: {
    label: 'Notification 09/2023-Central Tax, 31 March 2023',
    note: 'Extended the s.73(10) order deadline for FY 2017-18, 2018-19 and 2019-20.',
    url: 'https://taxinformation.cbic.gov.in/'
  },
  n56_2023: {
    label: 'Notification 56/2023-Central Tax, 28 December 2023',
    note: 'Further extended the s.73(10) order deadline for FY 2018-19 and 2019-20. HELD ULTRA VIRES s.168A by the Gauhati High Court and challenged elsewhere — a demand resting on this extension carries live litigation risk.',
    url: 'https://taxinformation.cbic.gov.in/',
    contested: true
  }
}

/* The due date for the annual return (GSTR-9) is the anchor every limitation
 * period runs from — 31 December following the end of the financial year,
 * subject to extension in the early years. */
export const ANNUAL_RETURN_DUE = {
  '2017-18': '2019-02-05',
  '2018-19': '2019-12-31',
  '2019-20': '2020-12-31',
  '2020-21': '2021-12-31',
  '2021-22': '2022-12-31',
  '2022-23': '2023-12-31',
  '2023-24': '2024-12-31',
  '2024-25': '2025-12-31'
}

/* Where a notification has moved the s.73 order deadline away from the base
 * three-year computation, the override is recorded here with its source. */
const S73_ORDER_OVERRIDE = {
  '2017-18': { date: '2023-12-31', source: 'n09_2023', contested: false },
  '2018-19': { date: '2024-04-30', source: 'n56_2023', contested: true },
  '2019-20': { date: '2024-08-31', source: 'n56_2023', contested: true }
}

/* ---------------------------------------------------------------------------
 * The computation. Returns the two dates that matter — the last day a notice
 * may issue, and the last day an order may be passed — plus the basis for each
 * so an officer can check the arithmetic rather than trust it.
 * ------------------------------------------------------------------------- */
export function computeLimitation(fy, section) {
  const arDue = ANNUAL_RETURN_DUE[fy]
  if (!arDue) return null

  if (section === 's74A') {
    // SCN within 42 months of the annual-return due date; order within 12
    // months of the notice. Modelled at the statutory outer edge.
    const noticeDeadline = addMonthsUtc(parse(arDue), 42)
    return {
      section: 's74A',
      fy,
      annualReturnDue: arDue,
      noticeDeadline: fmt(noticeDeadline),
      orderDeadline: fmt(addMonthsUtc(noticeDeadline, 12)),
      basis: '42 months from the annual-return due date for the notice; 12 months from the notice for the order (extendable by 6 months on approval).',
      sources: ['s74A'],
      contested: false
    }
  }

  const years = section === 's74' ? 5 : 3
  const noticeLeadMonths = section === 's74' ? 6 : 3

  let orderDeadline = addYearsUtc(parse(arDue), years)
  let sources = [section]
  let contested = false
  let basis = `${years} years from the annual-return due date for ${fy} (${arDue}).`

  const override = section === 's73' ? S73_ORDER_OVERRIDE[fy] : null
  if (override) {
    orderDeadline = parse(override.date)
    sources = [section, override.source]
    contested = override.contested
    basis = `Extended to ${override.date} by notification, in place of the base ${years}-year computation.`
  }

  return {
    section,
    fy,
    annualReturnDue: arDue,
    noticeDeadline: fmt(addMonthsUtc(orderDeadline, -noticeLeadMonths)),
    orderDeadline: fmt(orderDeadline),
    basis: `${basis} Notice must issue at least ${noticeLeadMonths} months before the order deadline.`,
    sources,
    contested
  }
}

/* ---------------------------------------------------------------------------
 * Case status against its own clock.
 *
 * `stage` decides which deadline binds: a case with no notice yet is running
 * against the NOTICE deadline, which falls months earlier than the order
 * deadline and is the one most often missed.
 * ------------------------------------------------------------------------- */
export const URGENCY = [
  { id: 'barred', label: 'Time-barred', maxDays: -1, tone: 'red' },
  { id: 'critical', label: 'Critical', maxDays: 30, tone: 'red' },
  { id: 'urgent', label: 'Urgent', maxDays: 90, tone: 'orange' },
  { id: 'watch', label: 'Watch', maxDays: 180, tone: 'amber' },
  { id: 'clear', label: 'In time', maxDays: Infinity, tone: 'green' }
]

export function urgencyFor(daysRemaining) {
  if (daysRemaining < 0) return URGENCY[0]
  return URGENCY.find(u => u.id !== 'barred' && daysRemaining <= u.maxDays) || URGENCY.at(-1)
}

export function assessCase({ fy, section, noticeIssued, asOf = REFERENCE_DATE }) {
  const lim = computeLimitation(fy, section)
  if (!lim) return null
  // Before a notice issues, the notice deadline binds. After, the order deadline does.
  const bindingLabel = noticeIssued ? 'Order' : 'Notice'
  const bindingDate = noticeIssued ? lim.orderDeadline : lim.noticeDeadline
  const daysRemaining = daysBetween(asUtcDay(asOf), parse(bindingDate))
  return {
    ...lim,
    noticeIssued,
    bindingLabel,
    bindingDate,
    daysRemaining,
    urgency: urgencyFor(daysRemaining)
  }
}

/* ---------------------------------------------------------------------------
 * THE LIMITATION REGISTER
 *
 * Not a dashboard — a worklist. Every open proceeding, ranked by how soon its
 * binding deadline falls and how much revenue is attached, with the responsible
 * formation named and the basis for the date stated so an officer can check it.
 *
 * Tax period and section are derived deterministically from the case's own
 * GSTIN so the register is stable between renders, and s.74 is reserved for
 * cases carrying a Critical rating — that section requires fraud, wilful
 * misstatement or suppression, and should not be applied for convenience.
 * ------------------------------------------------------------------------- */

import { AUDIT_CASES } from './mockData.js'

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) / 4294967296
}

// Weighted toward recent years, as a live caseload would be.
const FY_POOL = ['2021-22', '2022-23', '2022-23', '2022-23', '2023-24', '2023-24', '2023-24', '2024-25']
const NOTICE_ISSUED_STAGES = ['Notice Drafted', 'Hearing', 'Recovery', 'Closed']

export const LIMITATION_REGISTER = AUDIT_CASES.map(c => {
  const fy = FY_POOL[Math.floor(hash(c.gstin + 'fy') * FY_POOL.length)]
  // s.74A governs FY 2024-25 onwards regardless of fraud; before that the
  // fraud/non-fraud split decides, and s.74 needs a Critical rating.
  const section = fy === '2024-25' ? 's74A' : (c.riskCategory === 'Critical' ? 's74' : 's73')
  const noticeIssued = NOTICE_ISSUED_STAGES.includes(c.stage)
  const a = assessCase({ fy, section, noticeIssued })
  return {
    id: c.id,
    gstin: c.gstin,
    tradeName: c.tradeName,
    district: c.district,
    division: c.division,
    sector: c.sector,
    stage: c.stage,
    officer: c.assignedOfficer,
    exposure: c.estimatedExposure,
    riskCategory: c.riskCategory,
    ...a
  }
}).sort((x, y) => x.daysRemaining - y.daysRemaining)

const sum = (arr, f) => arr.reduce((s, v) => s + f(v), 0)
const toCr = n => Math.round((n / 10000000) * 100) / 100

// The figures a Commissioner is answerable for. Exposure is counted against the
// binding deadline — the notice date where no notice has issued, which is the
// one most often missed because it falls months before the order deadline.
export const LIMITATION_SUMMARY = (() => {
  const live = LIMITATION_REGISTER.filter(r => r.daysRemaining >= 0)
  const barred = LIMITATION_REGISTER.filter(r => r.daysRemaining < 0)
  const within = n => live.filter(r => r.daysRemaining <= n)
  const contested = LIMITATION_REGISTER.filter(r => r.contested)
  return {
    totalCases: LIMITATION_REGISTER.length,
    barredCount: barred.length,
    barredCr: toCr(sum(barred, r => r.exposure)),
    within30Count: within(30).length,
    within30Cr: toCr(sum(within(30), r => r.exposure)),
    within90Count: within(90).length,
    within90Cr: toCr(sum(within(90), r => r.exposure)),
    within180Count: within(180).length,
    within180Cr: toCr(sum(within(180), r => r.exposure)),
    liveCr: toCr(sum(live, r => r.exposure)),
    contestedCount: contested.length,
    contestedCr: toCr(sum(contested, r => r.exposure))
  }
})()

// Formation-level roll-up: which divisions carry the nearest deadlines.
export const LIMITATION_BY_DIVISION = Object.values(
  LIMITATION_REGISTER.reduce((acc, r) => {
    const k = r.division || 'Unassigned'
    acc[k] = acc[k] || { division: k, cases: 0, exposureCr: 0, nearestDays: Infinity, criticalCount: 0 }
    acc[k].cases++
    acc[k].exposureCr += r.exposure / 10000000
    if (r.daysRemaining >= 0) acc[k].nearestDays = Math.min(acc[k].nearestDays, r.daysRemaining)
    if (r.daysRemaining >= 0 && r.daysRemaining <= 30) acc[k].criticalCount++
    return acc
  }, {})
).map(v => ({ ...v, exposureCr: Math.round(v.exposureCr * 100) / 100, nearestDays: v.nearestDays === Infinity ? null : v.nearestDays }))
  .sort((a, b) => (a.nearestDays ?? 9999) - (b.nearestDays ?? 9999))
