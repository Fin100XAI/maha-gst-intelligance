// Simulated AI helper layer. All functions are deterministic mock generators —
// no external model calls are made. Every output is advisory only.

import { explainRiskScore } from './risk.js'

const STANDARD_LIMITATION = 'AI-generated output is a decision-support draft based on available filing and transaction data. It does not constitute a legal finding, penalty, or enforcement action. Authorised officer verification and approval is mandatory before any action is taken.'

function confidenceFromScore(score) {
  if (score >= 81) return 'Very High'
  if (score >= 61) return 'High'
  if (score >= 31) return 'Moderate'
  return 'Low'
}

export function generateExecutiveBrief(kpi, districtRevenue, alerts) {
  const topDistricts = [...districtRevenue].sort((a, b) => b.riskTaxpayers - a.riskTaxpayers).slice(0, 3)
  return {
    title: 'Commissioner Daily Brief — AI-Generated Draft',
    generatedOn: '2026-08-17',
    confidence: 'High',
    summary: [
      `State GST revenue monitored stands at ₹${kpi.revenueMonitoredCr.toLocaleString('en-IN')} Cr across ${kpi.totalTaxpayers} tracked taxpayers, with an estimated high-risk revenue exposure of ₹${kpi.highRiskExposureCr} Cr.`,
      `${kpi.nonFilers} taxpayers are currently non-filers; ${kpi.criticalRisk} entities are rated Critical risk and ${kpi.highRisk} High risk, warranting prioritised officer attention.`,
      `Highest risk-taxpayer concentration is observed in ${topDistricts.map(d => d.district).join(', ')}. Audit recovery pipeline currently stands at ₹${kpi.auditRecoveryPipelineCr} Cr across active cases.`,
      `${alerts} compliance early-warning alerts remain open and unresolved as of today, primarily linked to non-filing and sudden revenue decline patterns.`
    ],
    evidenceUsed: ['State revenue trend (24 months)', 'Taxpayer risk register', 'District-wise audit recovery pipeline', 'Compliance early-warning feed'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function summarizeTaxpayer(taxpayer) {
  const explain = explainRiskScore(taxpayer)
  return {
    title: `AI Case Summary — ${taxpayer.tradeName}`,
    confidence: confidenceFromScore(taxpayer.risk.score),
    summary: [
      `${taxpayer.tradeName} (${taxpayer.gstin}) operates in the ${taxpayer.sector} sector in ${taxpayer.district} district, registered on ${taxpayer.registrationDate}.`,
      `Filing status: ${taxpayer.filingStatus}. Compliance history: ${taxpayer.complianceHistory}. Current risk rating: ${taxpayer.risk.category} (${taxpayer.risk.score}/100).`,
      explain.narrative,
      `Estimated revenue exposure under review: ₹${(taxpayer.estimatedRevenueExposure / 100000).toFixed(1)} Lakh. Supplier risk: ${taxpayer.supplierRisk}, Buyer risk: ${taxpayer.buyerRisk}.`
    ],
    evidenceUsed: explain.evidence.map(e => e.rule),
    humanReviewRequired: explain.humanReviewRequired,
    limitationNote: STANDARD_LIMITATION
  }
}

export function generateAuditChecklist(caseItem) {
  const base = [
    'Verify GSTR-1 vs GSTR-3B reconciliation for the disputed period(s)',
    'Cross-check ITC claimed against supplier GSTR-2B / GSTR-2A',
    'Review e-way bill movement against declared outward supply value',
    'Examine bank statements for payment trail consistency',
    'Confirm principal place of business through field/desk verification'
  ]
  if (caseItem.riskCategory === 'Critical' || caseItem.riskCategory === 'High') {
    base.push('Trace top 5 counterparties for common ownership, address or contact indicators')
    base.push('Request stock/inventory register where applicable to validate supply chain')
  }
  return {
    title: `AI-Generated Audit Checklist — ${caseItem.tradeName}`,
    confidence: confidenceFromScore(caseItem.riskScore),
    checklist: base,
    evidenceUsed: ['Case risk profile', 'Historical audit pattern for similar risk category'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function draftNotice(caseItem, noticeType = 'ASMT-10 Scrutiny Notice') {
  return {
    title: `AI-Drafted ${noticeType} — ${caseItem.tradeName}`,
    confidence: 'Moderate',
    draft: `To,\n${caseItem.tradeName}\nGSTIN: ${caseItem.gstin}\n\nSubject: ${noticeType} — Discrepancy observed in filed returns\n\nOn scrutiny of returns filed for the relevant tax period(s), the following discrepancies/risk indicators have been observed: ${(caseItem.risk?.triggeredRules || []).map(r => r.label).join('; ') || 'refer to case risk summary'}.\n\nYou are hereby requested to furnish an explanation, along with supporting documents, within 15 days of receipt of this notice, failing which further proceedings under the applicable provisions of the MGST/CGST Act may be initiated.\n\n[DRAFT — Requires Officer Review, Edit and Digital Signature]`,
    evidenceUsed: ['Case risk explanation', 'Standard notice template library'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function summarizeReply(taxpayerName) {
  return {
    title: `AI Summary — Taxpayer Reply (${taxpayerName})`,
    confidence: 'Moderate',
    summary: [
      `Taxpayer has submitted a reply contesting the discrepancy on grounds of reconciliation timing differences.`,
      `Supporting documents referenced: purchase register, GSTR-2B extract, bank statement for the disputed period.`,
      `Key contention: ITC variance attributed to invoices received in a subsequent period but pertaining to the disputed period.`
    ],
    evidenceUsed: ['Uploaded reply document (simulated)', 'Case correspondence history'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function generateRefundChecklist(refundCase) {
  const items = [
    'Verify refund application (RFD-01) against GSTR-1/3B filed for the claim period',
    'Reconcile ITC accumulation with eligible input tax credit ledger',
    'Cross-verify export/zero-rated supply documentation where applicable',
    'Check supplier-chain risk rating for top ITC-contributing counterparties',
    'Validate bank account and previous refund disbursal history'
  ]
  if (refundCase.riskCategory === 'High' || refundCase.riskCategory === 'Critical') {
    items.push('Refer for pre-refund physical/desk verification prior to sanction')
  }
  return {
    title: `AI-Generated Refund Verification Checklist — ${refundCase.tradeName}`,
    confidence: confidenceFromScore(refundCase.riskScore),
    checklist: items,
    evidenceUsed: ['Refund-to-turnover ratio', 'Sector refund benchmark', 'Supplier risk profile'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION + ' The system does not auto-reject or auto-sanction any refund claim.'
  }
}

export function summarizeLitigationRisk(litCase) {
  return {
    title: `AI Litigation Risk Summary — ${litCase.tradeName}`,
    confidence: litCase.adverseOutcomeRisk === 'High' ? 'High' : 'Moderate',
    summary: [
      `Case relates to ${litCase.issue}, currently at stage: ${litCase.stage}.`,
      `Disputed amount: ₹${(litCase.disputedAmount / 100000).toFixed(1)} Lakh. Case ageing: ${litCase.ageingDays} days.`,
      `Department position assessed as: ${litCase.departmentPosition}. Adverse outcome risk: ${litCase.adverseOutcomeRisk}.`,
      litCase.departmentPosition.startsWith('Weak')
        ? 'Recommend strengthening documentary evidence and legal reasoning before next hearing.'
        : 'Current documentation and legal position appear adequately supported.'
    ],
    evidenceUsed: ['Case filing record', 'Historical department success rate for similar issue category'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function translateBriefing(text, lang = 'mr') {
  const dict = {
    mr: {
      prefix: '[मराठी सारांश — AI द्वारे व्युत्पन्न, अधिकाऱ्याची पडताळणी आवश्यक]',
      note: 'हा सारांश केवळ माहितीच्या उद्देशाने आहे. अंतिम कारवाईपूर्वी अधिकृत अधिकाऱ्याची मान्यता आवश्यक आहे.'
    },
    hi: {
      prefix: '[हिंदी सारांश — AI द्वारा जनरेट किया गया, अधिकारी सत्यापन आवश्यक]',
      note: 'यह सारांश केवल सूचना हेतु है। अंतिम कार्रवाई से पूर्व अधिकृत अधिकारी की स्वीकृति आवश्यक है।'
    },
    en: { prefix: '[English Summary]', note: STANDARD_LIMITATION }
  }
  const d = dict[lang] || dict.en
  return { prefix: d.prefix, body: text, note: d.note, humanReviewRequired: true }
}

export function generateComplianceNudge(alert) {
  return {
    title: `AI-Generated Taxpayer Outreach — ${alert.tradeName}`,
    confidence: 'Moderate',
    message: `Dear Taxpayer (${alert.gstin}), our records indicate ${alert.type.toLowerCase()} for a recent return period. To avoid interest, late fee or further scrutiny, please review and file/correct your returns at the earliest. This is a system-generated compliance reminder and not a notice or demand.`,
    recommendedChannel: 'SMS + Email',
    evidenceUsed: ['Compliance early-warning signal'],
    humanReviewRequired: false,
    limitationNote: 'Automated nudges are informational only. They do not constitute a legal notice and do not trigger any adverse action.'
  }
}

export function compareSimilarCases(caseItem, allCases) {
  const similar = allCases
    .filter(c => c.sector === caseItem.sector && c.id !== caseItem.id)
    .slice(0, 3)
  return {
    title: `AI Similar Case Comparison — ${caseItem.tradeName}`,
    confidence: 'Moderate',
    similarCases: similar.map(c => ({ id: c.id, tradeName: c.tradeName, riskScore: c.riskScore ?? c.risk?.score, stage: c.stage ?? c.status })),
    observation: similar.length > 0
      ? `${similar.length} comparable cases identified in the same sector with similar risk patterns. Historical resolution approach may inform current case scoping.`
      : 'No closely comparable cases found in the current dataset.',
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function suggestHearingQuestions(caseItem) {
  return {
    title: `AI-Suggested Hearing Questions — ${caseItem.tradeName}`,
    confidence: 'Moderate',
    questions: [
      'Please explain the basis for the input tax credit claimed in excess of the sector-typical range.',
      'Provide a reconciliation of e-way bill movement value against declared outward supply for the period in question.',
      'Clarify the relationship, if any, with counterparty entities flagged under linked-risk review.',
      'Explain the reason for the variance between turnover growth and corresponding tax payment trend.'
    ],
    evidenceUsed: ['Case risk explanation', 'Standard hearing question bank'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}
