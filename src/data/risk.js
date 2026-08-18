// Explainable, rule-based risk scoring engine.
// Every score is fully attributable to a discrete set of weighted rules — no black-box output.

export const RISK_RULES = [
  {
    id: 'circular_signal',
    label: 'Circular Trading / Network Signal',
    weight: 22,
    category: 'Network Intelligence',
    description: 'Invoice flow pattern consistent with circular trading among linked counterparties.'
  },
  {
    id: 'non_filing',
    label: 'Non-Filing of Returns',
    weight: 20,
    category: 'Filing Behaviour',
    description: 'One or more return periods not filed within the statutory window.'
  },
  {
    id: 'itc_spike',
    label: 'Abnormal ITC Spike',
    weight: 18,
    category: 'ITC Behaviour',
    description: 'Input tax credit claimed materially exceeds trailing 6-month average.'
  },
  {
    id: 'eway_mismatch',
    label: 'E-Way Bill vs Return Mismatch',
    weight: 16,
    category: 'Logistics Intelligence',
    description: 'Declared e-way bill movement value is inconsistent with reported outward supply.'
  },
  {
    id: 'supplier_risk',
    label: 'High-Risk Supplier Linkage',
    weight: 15,
    category: 'Network Intelligence',
    description: 'One or more upstream suppliers independently carry a High or Critical risk rating.'
  },
  {
    id: 'revenue_drop',
    label: 'Sudden Decline in Tax Payment',
    weight: 14,
    category: 'Revenue Behaviour',
    description: 'Tax payment has fallen sharply despite stable or rising turnover.'
  },
  {
    id: 'refund_ratio',
    label: 'High Refund-to-Turnover Ratio',
    weight: 12,
    category: 'Refund Behaviour',
    description: 'Refund claimed as a proportion of turnover exceeds the sector benchmark band.'
  },
  {
    id: 'new_high_txn',
    label: 'New Registration, High Transaction Volume',
    weight: 12,
    category: 'Registration Behaviour',
    description: 'Entity registered within the last 12 months already transacting at high value.'
  },
  {
    id: 'sector_deviation',
    label: 'Deviation from Sector Benchmark',
    weight: 10,
    category: 'Sector Behaviour',
    description: 'Tax-to-turnover ratio deviates materially from peer sector median.'
  },
  {
    id: 'late_filing',
    label: 'Chronic Late Filing',
    weight: 8,
    category: 'Filing Behaviour',
    description: 'Pattern of returns filed after due date across multiple periods.'
  }
]

const RULES_BY_ID = Object.fromEntries(RISK_RULES.map(r => [r.id, r]))

export function riskCategoryFromScore(score) {
  if (score >= 81) return 'Critical'
  if (score >= 61) return 'High'
  if (score >= 31) return 'Medium'
  return 'Low'
}

export const RISK_COLORS = {
  Low: { text: 'text-maharisk-low', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-maharisk-low', solid: '#1f8a4c' },
  Medium: { text: 'text-maharisk-medium', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-maharisk-medium', solid: '#d99a15' },
  High: { text: 'text-maharisk-high', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-maharisk-high', solid: '#d9631c' },
  Critical: { text: 'text-maharisk-critical', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-maharisk-critical', solid: '#c41e3a' }
}

// Computes a 0-100 risk score from a taxpayer's boolean signal flags.
export function computeRiskScore(signals) {
  let raw = 0
  const triggered = []
  for (const rule of RISK_RULES) {
    if (signals[rule.id]) {
      raw += rule.weight
      triggered.push(rule)
    }
  }
  const score = Math.min(100, raw)
  return { score, category: riskCategoryFromScore(score), triggeredRules: triggered }
}

// Produces the "Why flagged?" explainability payload for a taxpayer/case.
export function explainRiskScore(taxpayer) {
  const { score, category, triggeredRules } = taxpayer.risk
  const evidence = triggeredRules.map(r => ({
    rule: r.label,
    category: r.category,
    weightContribution: r.weight,
    description: r.description
  }))
  const confidence = triggeredRules.length === 0
    ? 'Low'
    : triggeredRules.length <= 2
      ? 'Moderate'
      : triggeredRules.length <= 4
        ? 'High'
        : 'Very High'

  return {
    gstin: taxpayer.gstin,
    score,
    category,
    confidence,
    evidence,
    narrative: triggeredRules.length === 0
      ? `No risk rules triggered for ${taxpayer.tradeName}. Current filing, ITC and payment behaviour is within expected parameters.`
      : `${taxpayer.tradeName} (${taxpayer.gstin}) is flagged ${category} risk (score ${score}/100) based on ${triggeredRules.length} triggered indicator${triggeredRules.length > 1 ? 's' : ''}: ${triggeredRules.map(r => r.label).join(', ')}.`,
    humanReviewRequired: category === 'High' || category === 'Critical',
    limitationNote: 'This score is a statistical risk signal derived from filing, payment and network patterns. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.'
  }
}

export function ruleById(id) {
  return RULES_BY_ID[id]
}
