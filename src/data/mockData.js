// Deterministic mock GST data generator for Maharashtra.
// All figures are simulated for demonstration purposes only.

import { computeRiskScore } from './risk.js'

// ---------- Seeded PRNG (mulberry32) for reproducible demo data ----------
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260817)
const rf = (min, max) => min + rand() * (max - min)
const ri = (min, max) => Math.floor(rf(min, max + 1))
const pick = arr => arr[ri(0, arr.length - 1)]
const chance = p => rand() < p
const pad = (n, len) => String(n).padStart(len, '0')

// ---------- Reference data ----------
export const DISTRICTS = [
  { name: 'Mumbai', division: 'Mumbai Division', code: 'MUM' },
  { name: 'Thane', division: 'Thane Division', code: 'THN' },
  { name: 'Pune', division: 'Pune Division', code: 'PUN' },
  { name: 'Nagpur', division: 'Nagpur Division', code: 'NAG' },
  { name: 'Nashik', division: 'Nashik Division', code: 'NSK' },
  { name: 'Chhatrapati Sambhajinagar', division: 'Aurangabad Division', code: 'CSN' },
  { name: 'Kolhapur', division: 'Kolhapur Division', code: 'KOP' },
  { name: 'Solapur', division: 'Pune Division', code: 'SOL' },
  { name: 'Amravati', division: 'Amravati Division', code: 'AMT' },
  { name: 'Jalgaon', division: 'Nashik Division', code: 'JLG' },
  { name: 'Satara', division: 'Pune Division', code: 'SAT' },
  { name: 'Raigad', division: 'Thane Division', code: 'RAI' }
]
export const DIVISIONS = [...new Set(DISTRICTS.map(d => d.division))]

export const SECTORS = [
  { name: 'Real Estate', benchmarkTaxRatio: 0.062, benchmarkItcRatio: 0.41, benchmarkRefundRatio: 0.04 },
  { name: 'Construction', benchmarkTaxRatio: 0.058, benchmarkItcRatio: 0.44, benchmarkRefundRatio: 0.03 },
  { name: 'Pharma', benchmarkTaxRatio: 0.09, benchmarkItcRatio: 0.36, benchmarkRefundRatio: 0.12 },
  { name: 'Logistics', benchmarkTaxRatio: 0.07, benchmarkItcRatio: 0.39, benchmarkRefundRatio: 0.05 },
  { name: 'Textiles', benchmarkTaxRatio: 0.05, benchmarkItcRatio: 0.47, benchmarkRefundRatio: 0.08 },
  { name: 'Gems & Jewellery', benchmarkTaxRatio: 0.04, benchmarkItcRatio: 0.5, benchmarkRefundRatio: 0.03 },
  { name: 'Auto Components', benchmarkTaxRatio: 0.083, benchmarkItcRatio: 0.42, benchmarkRefundRatio: 0.06 },
  { name: 'Restaurants', benchmarkTaxRatio: 0.045, benchmarkItcRatio: 0.18, benchmarkRefundRatio: 0.01 },
  { name: 'Electronics', benchmarkTaxRatio: 0.088, benchmarkItcRatio: 0.46, benchmarkRefundRatio: 0.07 },
  { name: 'Steel', benchmarkTaxRatio: 0.095, benchmarkItcRatio: 0.4, benchmarkRefundRatio: 0.04 },
  { name: 'Cement', benchmarkTaxRatio: 0.098, benchmarkItcRatio: 0.37, benchmarkRefundRatio: 0.03 },
  { name: 'E-commerce Sellers', benchmarkTaxRatio: 0.06, benchmarkItcRatio: 0.43, benchmarkRefundRatio: 0.09 },
  { name: 'Professional Services', benchmarkTaxRatio: 0.11, benchmarkItcRatio: 0.15, benchmarkRefundRatio: 0.01 },
  { name: 'Import/Export', benchmarkTaxRatio: 0.052, benchmarkItcRatio: 0.48, benchmarkRefundRatio: 0.21 }
]

export const OFFICER_ROLES = [
  'Commissioner',
  'Joint Commissioner',
  'Division Officer',
  'Audit Officer',
  'Refund Officer',
  'Investigation Officer',
  'AI Governance Officer',
  'Read-only Policy Viewer'
]

const FIRST_NAMES = ['Rohan', 'Sanjay', 'Priya', 'Anita', 'Vikram', 'Meera', 'Suresh', 'Kavita', 'Amit', 'Neha', 'Rajesh', 'Deepa', 'Manoj', 'Sunita', 'Arvind', 'Pooja']
const LAST_NAMES = ['Deshmukh', 'Patil', 'Kulkarni', 'Joshi', 'Shinde', 'Bhosale', 'Kale', 'Chavan', 'More', 'Pawar', 'Gaikwad', 'Jadhav']
const LEGAL_SUFFIX = ['Private Limited', 'Enterprises', 'Industries Ltd', 'Trading Co.', 'Infrastructure LLP', 'Overseas Pvt Ltd', 'Retail Pvt Ltd', 'Exports Ltd', 'Agro Industries', 'Textiles Mills', 'Steel Corporation', 'Realty Ltd']
const NAME_ROOTS = ['Shivneri', 'Sahyadri', 'Konkan', 'Deccan', 'Vidarbha', 'Marathwada', 'Godavari', 'Bhima', 'Panchganga', 'Girna', 'Ajanta', 'Ellora', 'Raigad', 'Sinhagad', 'Pratapgad', 'Malabar', 'Suvarna', 'Ratnagiri', 'Kanhoji', 'Jijau']

function genGSTIN(stateCode, idx) {
  const pan = `AA${String.fromCharCode(65 + (idx % 26))}PZ${pad(1000 + idx, 4)}`
  return `${stateCode}${pan}${1 + (idx % 9)}Z${idx % 2 === 0 ? 'A' : 'B'}`
}

function randomDateWithin(daysBack) {
  const d = new Date(2026, 7, 17)
  d.setDate(d.getDate() - ri(0, daysBack))
  return d.toISOString().slice(0, 10)
}

// Single "as-of" reference point every dated record and filter is measured against.
export const REFERENCE_DATE = new Date(2026, 7, 17)

const DATE_RANGE_WINDOW_DAYS = { 'Last 3 Months': 90, 'Last 6 Months': 180, 'Last 12 Months': 365 }

// Applies the global header's dateRange filter to any record with a YYYY-MM-DD date field.
export function isWithinDateRange(dateStr, dateRange) {
  if (!dateStr || !dateRange || dateRange === 'All') return true
  const d = new Date(dateStr)
  if (dateRange === 'Financial Year 2025-26') {
    return d >= new Date(2025, 3, 1) && d <= new Date(2026, 2, 31)
  }
  const windowDays = DATE_RANGE_WINDOW_DAYS[dateRange]
  if (!windowDays) return true
  const cutoff = new Date(REFERENCE_DATE)
  cutoff.setDate(cutoff.getDate() - windowDays)
  return d >= cutoff
}

const FILING_STATUSES = ['Regular Filer', 'Late Filer', 'Non-Filer']
const AUDIT_STATUSES = ['Not Selected', 'Under Scrutiny', 'Audit In Progress', 'Notice Issued', 'Closed']
const COMPLIANCE_HISTORIES = ['Consistently Compliant', 'Minor Irregularities', 'Repeated Defaults', 'Under Investigation']

// ---------- Taxpayer generation ----------
const TAXPAYER_COUNT = 156
export const TAXPAYERS = []

for (let i = 0; i < TAXPAYER_COUNT; i++) {
  const district = DISTRICTS[i % DISTRICTS.length]
  const sector = SECTORS[(i * 3 + ri(0, 2)) % SECTORS.length]
  const name = `${pick(NAME_ROOTS)} ${pick(LEGAL_SUFFIX)}`
  const tradeName = name.split(' ').slice(0, 2).join(' ')
  const registrationDate = randomDateWithin(ri(90, 3650))
  const monthsSinceReg = Math.max(1, Math.round((new Date(2026, 7, 17) - new Date(registrationDate)) / (1000 * 60 * 60 * 24 * 30)))
  const isNew = monthsSinceReg <= 12

  // Flagged pool: ~28% of taxpayers draw from elevated-probability signal generation
  const flaggedPool = chance(0.28)
  const p = flaggedPool ? 0.42 : 0.07

  const filingStatus = chance(flaggedPool ? 0.22 : 0.03)
    ? 'Non-Filer'
    : chance(flaggedPool ? 0.35 : 0.12)
      ? 'Late Filer'
      : 'Regular Filer'

  const monthlyTurnover = Math.round(rf(8, 950) * 100000)
  const taxRatioNoise = rf(-0.55, 0.55)
  const taxPaid = Math.round(monthlyTurnover * Math.max(0.01, sector.benchmarkTaxRatio * (1 + taxRatioNoise)))
  const itcRatioNoise = rf(-0.3, flaggedPool ? 0.9 : 0.35)
  const itcClaimed = Math.round(monthlyTurnover * Math.max(0.02, sector.benchmarkItcRatio * (1 + itcRatioNoise)))
  const refundRatio = Math.max(0, sector.benchmarkRefundRatio * (1 + rf(-0.5, flaggedPool ? 2.5 : 0.6)))
  const refundClaimed = Math.round(monthlyTurnover * refundRatio)
  const ewayBillValue = Math.round(monthlyTurnover * rf(0.55, 1.35))
  const noticesIssued = flaggedPool ? ri(0, 4) : chance(0.08) ? 1 : 0
  const supplierRiskRoll = rand()
  const supplierRisk = supplierRiskRoll < (flaggedPool ? 0.3 : 0.05) ? 'High' : supplierRiskRoll < (flaggedPool ? 0.55 : 0.25) ? 'Medium' : 'Low'
  const buyerRiskRoll = rand()
  const buyerRisk = buyerRiskRoll < (flaggedPool ? 0.28 : 0.05) ? 'High' : buyerRiskRoll < (flaggedPool ? 0.5 : 0.22) ? 'Medium' : 'Low'

  const revenueDropPct = Math.round(rf(flaggedPool ? -5 : -5, flaggedPool ? 60 : 22))
  const sectorDevPct = Math.abs((taxPaid / monthlyTurnover - sector.benchmarkTaxRatio) / sector.benchmarkTaxRatio) * 100

  const signals = {
    itc_spike: itcClaimed / monthlyTurnover > sector.benchmarkItcRatio * 1.45,
    revenue_drop: revenueDropPct > 25,
    eway_mismatch: chance(p * 0.9),
    refund_ratio: refundClaimed / Math.max(1, monthlyTurnover) > sector.benchmarkRefundRatio * 2,
    non_filing: filingStatus === 'Non-Filer',
    late_filing: filingStatus === 'Late Filer' && chance(0.6),
    supplier_risk: supplierRisk === 'High',
    sector_deviation: sectorDevPct > 55,
    new_high_txn: isNew && monthlyTurnover > 3500000,
    circular_signal: flaggedPool && chance(0.32)
  }

  const risk = computeRiskScore(signals)
  const estimatedRevenueExposure = Math.round((itcClaimed * 0.4 + refundClaimed * 0.6 + (risk.score / 100) * taxPaid * 1.8))

  const appealStatus = chance(0.14) ? pick(['Pending at Appellate Authority', 'Pending at Tribunal', 'Order Confirmed', 'Order Reversed', 'Remanded']) : 'No Active Litigation'

  // Additional early-warning signals — distinct from the risk-scoring rule set above.
  const nilReturnRisk = filingStatus !== 'Non-Filer' && (taxPaid / monthlyTurnover) < 0.004
  const dormantToActiveFlag = !isNew && monthsSinceReg > 24 && chance(flaggedPool ? 0.22 : 0.03)
  const hasRecentAmendment = chance(flaggedPool ? 0.3 : 0.08)
  const highTurnoverLowPayment = monthlyTurnover > 2000000 && (taxPaid / monthlyTurnover) < sector.benchmarkTaxRatio * 0.55

  TAXPAYERS.push({
    id: `TP-${pad(i + 1, 5)}`,
    gstin: genGSTIN('27', i),
    legalName: name,
    tradeName,
    district: district.name,
    division: district.division,
    sector: sector.name,
    registrationDate,
    isNewRegistration: isNew,
    filingStatus,
    monthlyTurnover,
    taxPaid,
    itcClaimed,
    refundClaimed,
    ewayBillValue,
    noticesIssued,
    auditStatus: risk.score > 60 ? pick(AUDIT_STATUSES) : pick(['Not Selected', 'Not Selected', 'Not Selected', 'Closed']),
    complianceHistory: risk.score > 70 ? pick(['Repeated Defaults', 'Under Investigation']) : risk.score > 40 ? pick(['Minor Irregularities', 'Consistently Compliant']) : 'Consistently Compliant',
    estimatedRevenueExposure,
    supplierRisk,
    buyerRisk,
    appealStatus,
    revenueDropPct,
    sectorDeviationPct: Math.round(sectorDevPct),
    signals,
    nilReturnRisk,
    dormantToActiveFlag,
    hasRecentAmendment,
    highTurnoverLowPayment,
    risk,
    contactPhone: `98${ri(10000000, 99999999)}`,
    contactEmail: `accounts@${tradeName.toLowerCase().replace(/\s+/g, '')}.co.in`,
    address: `${ri(1, 400)}, ${pick(['MIDC', 'Industrial Estate', 'Commercial Complex', 'Business Park'])}, ${district.name}, Maharashtra`
  })
}

export const taxpayerById = id => TAXPAYERS.find(t => t.id === id)
export const taxpayerByGstin = g => TAXPAYERS.find(t => t.gstin === g)

// ---------- Officers ----------
export const OFFICERS = []
let officerIdx = 0
OFFICER_ROLES.forEach(role => {
  const count = role === 'Commissioner' ? 1 : role === 'Joint Commissioner' ? 3 : ri(6, 10)
  for (let i = 0; i < count; i++) {
    officerIdx++
    const district = pick(DISTRICTS)
    OFFICERS.push({
      id: `OFF-${pad(officerIdx, 4)}`,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      role,
      district: district.name,
      division: district.division,
      assignedCases: role === 'Audit Officer' || role === 'Refund Officer' || role === 'Investigation Officer' ? ri(4, 22) : ri(0, 6),
      casesClosedMTD: ri(2, 18),
      avgResolutionDays: ri(9, 45)
    })
  }
})

export const officerByRole = role => OFFICERS.filter(o => o.role === role)

// ---------- Revenue trend (24 months) ----------
const MONTH_DATES = (() => {
  const arr = []
  let y = 2024, m = 8
  for (let i = 0; i < 24; i++) {
    arr.push(new Date(y, m - 1, 1))
    m++
    if (m > 12) { m = 1; y++ }
  }
  return arr
})()

export const MONTHS = MONTH_DATES.map(d => d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }))

const baseRevenue = 3400
export const STATE_REVENUE_TREND = MONTHS.map((m, i) => {
  const seasonal = Math.sin(i / 2) * 120
  const growth = i * 18
  const target = baseRevenue + growth + 150
  const actual = Math.round(baseRevenue + growth + seasonal + rf(-90, 90))
  return { month: m, date: MONTH_DATES[i].toISOString().slice(0, 10), target: Math.round(target), actual, collectionCr: actual }
})

// Slices the 24-month trend to the trailing window implied by the global dateRange filter.
export function sliceTrendByDateRange(trend, dateRange) {
  if (dateRange === 'Financial Year 2025-26') {
    return trend.filter(m => new Date(m.date) >= new Date(2025, 3, 1) && new Date(m.date) <= new Date(2026, 2, 31))
  }
  const windowMonths = { 'Last 3 Months': 3, 'Last 6 Months': 6, 'Last 12 Months': 12 }[dateRange]
  return windowMonths ? trend.slice(-windowMonths) : trend
}

export const DISTRICT_REVENUE = DISTRICTS.map(d => {
  const share = rf(0.04, 0.22)
  const target = Math.round(STATE_REVENUE_TREND.at(-1).target * share)
  const varDelta = rf(-0.16, 0.1)
  const actual = Math.round(target * (1 + varDelta))
  return {
    district: d.name,
    division: d.division,
    targetCr: target,
    actualCr: actual,
    gapPct: Math.round(((actual - target) / target) * 1000) / 10,
    nonFilers: ri(30, 420),
    riskTaxpayers: TAXPAYERS.filter(t => t.district === d.name && (t.risk.category === 'High' || t.risk.category === 'Critical')).length,
    auditRecoveryCr: Math.round(rf(4, 60)),
    officerWorkload: ri(55, 98),
    caseAgeingDays: ri(20, 130)
  }
})

export const SECTOR_REVENUE = SECTORS.map(s => {
  const sectorTaxpayers = TAXPAYERS.filter(t => t.sector === s.name)
  const revenue = sectorTaxpayers.reduce((sum, t) => sum + t.taxPaid, 0)
  return {
    sector: s.name,
    revenueLakh: Math.round(revenue / 100000),
    taxpayerCount: sectorTaxpayers.length,
    avgTaxRatio: s.benchmarkTaxRatio,
    avgItcRatio: s.benchmarkItcRatio,
    avgRefundRatio: s.benchmarkRefundRatio,
    highRiskCount: sectorTaxpayers.filter(t => t.risk.category === 'High' || t.risk.category === 'Critical').length
  }
})

// ---------- Notices ----------
export const NOTICE_TYPES = ['ASMT-10 Scrutiny Notice', 'DRC-01 Show Cause Notice', 'GSTR-3A Non-Filer Notice', 'REG-17 Registration Cancellation Notice', 'RFD-08 Refund Rejection Notice']
export const NOTICES = TAXPAYERS.filter(t => t.noticesIssued > 0).flatMap(t =>
  Array.from({ length: t.noticesIssued }, (_, k) => ({
    id: `NTC-${t.id}-${k + 1}`,
    taxpayerId: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    type: pick(NOTICE_TYPES),
    issuedOn: randomDateWithin(400),
    dueOn: randomDateWithin(-30),
    status: pick(['Reply Awaited', 'Reply Received', 'Hearing Scheduled', 'Order Issued', 'Escalated'])
  }))
)

// ---------- Audit & Scrutiny pipeline ----------
export const AUDIT_STAGES = ['New', 'Under Review', 'Notice Drafted', 'Hearing', 'Recovery', 'Closed']
export const AUDIT_CASES = TAXPAYERS
  .filter(t => t.risk.score > 45)
  .slice(0, 62)
  .map((t, i) => ({
    id: `AUD-${pad(i + 1, 4)}`,
    taxpayerId: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    district: t.district,
    sector: t.sector,
    stage: pick(AUDIT_STAGES),
    riskScore: t.risk.score,
    riskCategory: t.risk.category,
    estimatedExposure: t.estimatedRevenueExposure,
    assignedOfficer: pick(officerByRole('Audit Officer')).name,
    openedOn: randomDateWithin(300),
    lastActionOn: randomDateWithin(30),
    suggestedScope: t.signals.circular_signal
      ? 'Full-scope investigation: ITC chain verification, counterparty cross-check, e-way bill reconciliation'
      : t.signals.itc_spike
        ? 'Focused ITC verification: supplier GSTR-2B reconciliation, invoice sampling'
        : 'Standard desk scrutiny: return consistency and payment trend review'
  }))

// ---------- Refund cases ----------
export const REFUND_CASES = TAXPAYERS
  .filter(t => t.refundClaimed > 0)
  .sort((a, b) => b.refundClaimed - a.refundClaimed)
  .slice(0, 70)
  .map((t, i) => ({
    id: `RFD-${pad(i + 1, 4)}`,
    taxpayerId: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    sector: t.sector,
    district: t.district,
    claimedAmount: t.refundClaimed,
    refundToTurnoverPct: Math.round((t.refundClaimed / t.monthlyTurnover) * 1000) / 10,
    filedOn: randomDateWithin(200),
    riskScore: t.risk.score,
    riskCategory: t.risk.category,
    exportLinked: chance(0.4),
    status: t.risk.score > 65 ? pick(['Needs Officer Review', 'Escalate for Scrutiny']) : pick(['Low Risk', 'Needs Officer Review', 'Low Risk']),
    assignedOfficer: pick(officerByRole('Refund Officer')).name
  }))

// ---------- E-way bill records ----------
export const EWAY_RECORDS = Array.from({ length: 90 }, (_, i) => {
  const t = TAXPAYERS[ri(0, TAXPAYERS.length - 1)]
  const distance = ri(15, 1400)
  return {
    id: `EWB-${pad(i + 1, 5)}`,
    taxpayerId: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    district: t.district,
    sector: t.sector,
    generatedOn: randomDateWithin(120),
    valueLakh: Math.round(rf(1, 85) * 10) / 10,
    distanceKm: distance,
    vehicleNo: `MH-${ri(1, 48)}-${pick(['AB', 'CD', 'EF', 'GH', 'KL'])}-${ri(1000, 9999)}`,
    routeType: distance > 700 ? 'Inter-State Long Haul' : distance > 250 ? 'Inter-State' : 'Intra-State',
    cancelled: chance(0.09),
    matchedToReturn: t.signals.eway_mismatch ? chance(0.25) : chance(0.92),
    anomalyFlag: t.signals.eway_mismatch && chance(0.5)
  }
})

// ---------- Litigation ----------
export const LEGAL_ISSUES = ['ITC Eligibility Dispute', 'Classification Dispute', 'Valuation Dispute', 'Place of Supply Dispute', 'Refund Rejection Challenge', 'Penalty Proportionality', 'Limitation Period Dispute']
export const LITIGATION_CASES = TAXPAYERS
  .filter(t => t.appealStatus !== 'No Active Litigation')
  .map((t, i) => ({
    id: `LIT-${pad(i + 1, 4)}`,
    taxpayerId: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    sector: t.sector,
    district: t.district,
    issue: pick(LEGAL_ISSUES),
    stage: t.appealStatus,
    disputedAmount: Math.round(t.estimatedRevenueExposure * rf(0.5, 1.4)),
    filedOn: randomDateWithin(700),
    ageingDays: ri(30, 900),
    adverseOutcomeRisk: pick(['Low', 'Medium', 'High']),
    departmentPosition: pick(['Strong', 'Moderate', 'Weak — documentation gap', 'Weak — precedent unfavourable'])
  }))

export const LITIGATION_SUMMARY = {
  totalAppeals: LITIGATION_CASES.length,
  departmentSuccessRatePct: 61,
  reversedOrders: LITIGATION_CASES.filter(c => c.stage === 'Order Reversed').length,
  pendingHighValue: LITIGATION_CASES.filter(c => c.disputedAmount > 5000000).length,
  recoveryLockedCr: Math.round(LITIGATION_CASES.reduce((s, c) => s + c.disputedAmount, 0) / 10000000)
}

// ---------- Compliance early warning ----------
// All 9 signal types called for in the compliance brief — each backed by its own
// derived field or risk-rule flag, not a reused/relabeled proxy.
export const EARLY_WARNING_TYPES = [
  {
    key: 'non_filer',
    type: 'Non-Filer Alert',
    test: t => t.filingStatus === 'Non-Filer',
    recommendedAction: 'Send automated reminder; escalate to Division Officer if unresolved within 7 days'
  },
  {
    key: 'late_filer',
    type: 'Late Filing Pattern',
    test: t => t.filingStatus === 'Late Filer',
    recommendedAction: 'Monitor for chronic late-filing pattern; issue compliance nudge and review interest/late-fee computation'
  },
  {
    key: 'nil_return',
    type: 'Nil-Return Risk',
    test: t => t.nilReturnRisk,
    recommendedAction: 'Verify return filed reflects actual business activity; cross-check against e-way bill and turnover trend'
  },
  {
    key: 'sudden_drop',
    type: 'Sudden Tax Payment Drop',
    test: t => t.signals.revenue_drop,
    recommendedAction: 'Desk review of last 3 return periods; compare against sector trend'
  },
  {
    key: 'dormant_active',
    type: 'Dormant-to-Active Spike',
    test: t => t.dormantToActiveFlag,
    recommendedAction: 'Verify reactivation is genuine business resumption; check for shell-entity reuse indicators'
  },
  {
    key: 'amendment_risk',
    type: 'Registration Amendment Risk',
    test: t => t.hasRecentAmendment,
    recommendedAction: 'Review amended registration fields (address/authorised signatory/bank) for consistency with filing history'
  },
  {
    key: 'new_high_txn',
    type: 'New Taxpayer High Transaction Risk',
    test: t => t.signals.new_high_txn,
    recommendedAction: 'Field verification of newly registered entity given disproportionately high early transaction volume'
  },
  {
    key: 'high_turnover_low_payment',
    type: 'High Turnover, Low Payment',
    test: t => t.highTurnoverLowPayment,
    recommendedAction: 'Reconcile declared turnover against tax paid; verify for under-reporting of taxable value'
  },
  {
    key: 'return_mismatch',
    type: 'Return Mismatch',
    test: t => t.signals.eway_mismatch,
    recommendedAction: 'Flag for officer review queue — e-way bill movement value inconsistent with filed returns'
  }
]
export const COMPLIANCE_ALERTS = TAXPAYERS
  .flatMap(t => EARLY_WARNING_TYPES.filter(w => w.test(t)).map(w => ({
    id: `EW-${t.id}-${w.key}`,
    taxpayerId: t.id,
    gstin: t.gstin,
    tradeName: t.tradeName,
    district: t.district,
    sector: t.sector,
    type: w.type,
    raisedOn: randomDateWithin(45),
    riskScore: t.risk.score,
    recommendedAction: w.recommendedAction,
    status: pick(['Open', 'Outreach Sent', 'Officer Reviewing', 'Resolved'])
  })))
  .slice(0, 140)

// ---------- Fake invoice network clusters ----------
const circularTaxpayers = TAXPAYERS.filter(t => t.signals.circular_signal)
export const NETWORK_CLUSTERS = []
let ci = 0
while (ci < circularTaxpayers.length) {
  const size = Math.min(ri(3, 6), circularTaxpayers.length - ci)
  const members = circularTaxpayers.slice(ci, ci + size)
  if (members.length >= 3) {
    const clusterId = `CLU-${pad(NETWORK_CLUSTERS.length + 1, 3)}`
    const nodes = members.map((t, idx) => ({
      id: t.id,
      gstin: t.gstin,
      label: t.tradeName,
      risk: t.risk.category,
      role: idx === 0 ? 'Hub Entity' : chance(0.5) ? 'Pass-Through' : 'Counterparty',
      dormant: chance(0.15)
    }))
    const edges = []
    for (let k = 0; k < nodes.length; k++) {
      edges.push({ from: nodes[k].id, to: nodes[(k + 1) % nodes.length].id, valueLakh: Math.round(rf(8, 120)) })
    }
    if (nodes.length > 3 && chance(0.5)) {
      edges.push({ from: nodes[0].id, to: nodes[2].id, valueLakh: Math.round(rf(5, 60)) })
    }
    NETWORK_CLUSTERS.push({
      id: clusterId,
      nodes,
      edges,
      sharedAddress: chance(0.5),
      sharedContact: chance(0.4),
      shortLifeEntities: nodes.filter(n => circularTaxpayers.find(t => t.id === n.id)?.isNewRegistration).length,
      explanation: 'Possible circular transaction chain detected based on invoice flow, ITC pass-through, low tax payment, and linked counterparty risk.'
    })
  }
  ci += size
}

// ---------- Audit log (security/governance) ----------
const ACTIONS = ['Viewed Taxpayer 360 Profile', 'Generated AI Risk Explanation', 'Approved Audit Assignment', 'Drafted Notice (AI-assisted)', 'Exported Report', 'Overrode AI Risk Flag', 'Reviewed Refund Case', 'Marked False Positive', 'Login', 'Updated Case Status']
export const AUDIT_LOG = Array.from({ length: 60 }, (_, i) => {
  const officer = pick(OFFICERS)
  return {
    id: `LOG-${pad(i + 1, 5)}`,
    user: officer.name,
    role: officer.role,
    action: pick(ACTIONS),
    module: pick(['Taxpayer 360', 'ITC Risk Intelligence', 'Audit & Scrutiny', 'Refund Risk', 'Officer AI Copilot', 'Reports']),
    caseId: chance(0.6) ? pick(AUDIT_CASES)?.id ?? '—' : '—',
    timestamp: `2026-08-${pad(ri(1, 17), 2)} ${pad(ri(8, 19), 2)}:${pad(ri(0, 59), 2)}`,
    ip: `10.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`,
    device: pick(['Desktop / Chrome (MahaGST Intranet)', 'Desktop / Edge (MahaGST Intranet)', 'Tablet / Secure App']),
    status: chance(0.94) ? 'Success' : 'Denied — Insufficient Role Permission'
  }
})

// ---------- AI Governance metrics ----------
export const AI_GOVERNANCE_METRICS = {
  recommendationsGenerated: 4820,
  officerApproved: 3312,
  rejectedSuggestions: 641,
  falsePositiveReviewed: 214,
  falsePositiveConfirmed: 58,
  pendingGovernanceReview: 37,
  modelConfidenceDistribution: [
    { band: 'Very High', pct: 22 },
    { band: 'High', pct: 34 },
    { band: 'Moderate', pct: 29 },
    { band: 'Low', pct: 15 }
  ],
  driftStatus: 'Stable — within control band (last checked 2026-08-15)',
  lastRedTeamTest: '2026-07-22',
  vaptStatus: 'Compliant — last VAPT cycle 2026-06-30, next due 2026-12-30',
  encryptionStatus: 'AES-256 at rest, TLS 1.3 in transit',
  dataMinimisation: 'Enabled — PII masked in AI Copilot prompts by default'
}

export const REPORT_TYPES = [
  { id: 'commissioner-daily', name: 'Commissioner Daily Brief', desc: 'Daily executive summary of revenue, risk and priority alerts.' },
  { id: 'monthly-revenue-risk', name: 'Monthly Revenue Risk Report', desc: 'Consolidated revenue performance and risk exposure for the month.' },
  { id: 'district-performance', name: 'District Performance Report', desc: 'Target vs actual, risk concentration and workload by district.' },
  { id: 'sector-risk', name: 'Sector Risk Report', desc: 'Sector-wise benchmark deviation and anomaly summary.' },
  { id: 'itc-exposure', name: 'ITC Exposure Report', desc: 'High-risk ITC claims and estimated exposure.' },
  { id: 'refund-risk', name: 'Refund Risk Report', desc: 'Refund scrutiny pipeline and risk-ranked cases.' },
  { id: 'audit-prioritisation', name: 'Audit Prioritisation Report', desc: 'Risk-ranked taxpayer list for audit planning.' },
  { id: 'litigation-risk', name: 'Litigation Risk Report', desc: 'Appeal pipeline, adverse outcome risk and recovery locked.' },
  { id: 'compliance-early-warning', name: 'Compliance Early Warning Report', desc: 'Proactive signals and recommended taxpayer outreach.' },
  { id: 'ai-governance', name: 'AI Governance Report', desc: 'Model usage, human override rate and audit trail summary.' }
]

// ---------- Aggregate KPIs ----------
export const KPI_SUMMARY = {
  revenueMonitoredCr: STATE_REVENUE_TREND.reduce((s, m) => s + m.actual, 0),
  highRiskExposureCr: Math.round(TAXPAYERS.filter(t => t.risk.category === 'High' || t.risk.category === 'Critical').reduce((s, t) => s + t.estimatedRevenueExposure, 0) / 10000000),
  itcRiskCases: TAXPAYERS.filter(t => t.signals.itc_spike || t.signals.circular_signal).length,
  refundCasesUnderReview: REFUND_CASES.filter(r => r.status !== 'Low Risk').length,
  auditRecoveryPipelineCr: DISTRICT_REVENUE.reduce((s, d) => s + d.auditRecoveryCr, 0),
  complianceAlerts: COMPLIANCE_ALERTS.filter(a => a.status === 'Open').length,
  totalTaxpayers: TAXPAYERS.length,
  nonFilers: TAXPAYERS.filter(t => t.filingStatus === 'Non-Filer').length,
  criticalRisk: TAXPAYERS.filter(t => t.risk.category === 'Critical').length,
  highRisk: TAXPAYERS.filter(t => t.risk.category === 'High').length
}
