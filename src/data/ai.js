// Simulated AI helper layer. All functions are deterministic mock generators —
// no external model calls are made. Every output is advisory only.

import { explainRiskScore } from './risk.js'
import { REFERENCE_DATE_ISO } from './mockData.js'

const STANDARD_LIMITATION = 'AI-generated output is a decision-support draft based on available filing and transaction data. It does not constitute a legal finding, penalty, or enforcement action. Authorised officer verification and approval is mandatory before any action is taken.'

export function generateExecutiveBrief(kpi, districtRevenue, alerts) {
  const topDistricts = [...districtRevenue].sort((a, b) => b.riskTaxpayers - a.riskTaxpayers).slice(0, 3)
  return {
    title: 'Commissioner Daily Brief — AI-Generated Draft',
    generatedOn: REFERENCE_DATE_ISO,
    // The brief is deliberately a whole-book statement and does NOT follow the
    // header filters — but it renders directly beneath KPI cards that DO. Saying
    // so in the first line is what stops the two from reading as a contradiction.
    summary: [
      `Scope: whole modelled book, as at the reporting date. These figures are not narrowed by the header filters applied to the cards above.`,
      `GST revenue modelled over the 24-month trend totals ₹${kpi.revenueMonitoredCr.toLocaleString('en-IN')} Cr across ${kpi.totalTaxpayers} modelled taxpayers, with an estimated high-risk revenue exposure of ₹${kpi.highRiskExposureCr} Cr.`,
      `${kpi.nonFilers} taxpayers are currently non-filers; ${kpi.criticalRisk} entities are rated Critical risk and ${kpi.highRisk} High risk, warranting prioritised officer attention.`,
      `Highest risk-taxpayer concentration is observed in ${topDistricts.map(d => d.district).join(', ')}. Audit recovery pipeline stands at ₹${kpi.auditRecoveryPipelineCr} Cr across active cases.`,
      `${alerts} compliance early-warning alerts remain open and unresolved as at the reporting date, primarily linked to non-filing and sudden revenue decline patterns.`
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
    checklist: base,
    evidenceUsed: ['Case risk profile', 'Triggered risk rules for this taxpayer'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

// The statutory period here is NOT invented and must not be edited casually.
// ASMT-10 is the scrutiny notice under Section 61 of the CGST Act; Rule 99(2)
// of the CGST Rules gives the registered person THIRTY days from service of the
// notice (or such further period as the proper officer permits) to reply in
// FORM GST ASMT-11. This draft previously said fifteen days, which would have
// understated a taxpayer's statutory entitlement by half.
// Ref: https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter11/rule99_v1.00.html
export function draftNotice(caseItem, noticeType = 'ASMT-10 Scrutiny Notice') {
  return {
    title: `AI-Drafted ${noticeType} — ${caseItem.tradeName}`,
    draft: `To,\n${caseItem.tradeName}\nGSTIN: ${caseItem.gstin}\n\nSubject: ${noticeType} — Discrepancy observed in filed returns\n\nOn scrutiny of returns filed for the relevant tax period(s), the following discrepancies/risk indicators have been observed: ${(caseItem.risk?.triggeredRules || []).map(r => r.label).join('; ') || 'refer to case risk summary'}.\n\nYou are hereby requested to furnish an explanation in FORM GST ASMT-11, along with supporting documents, within thirty days of service of this notice (or such further period as may be permitted), as provided under Rule 99 of the CGST/MGST Rules read with Section 61 of the CGST/MGST Act. Failing this, proceedings under Section 73 or 74, or action under Sections 65, 66 or 67, may be initiated.\n\n[DRAFT — Requires Officer Review, Edit and Digital Signature]`,
    evidenceUsed: ['Case risk explanation', 'Statutory time computation for this tax period'],
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
    checklist: items,
    evidenceUsed: ['Refund-to-turnover ratio', 'Sector refund benchmark', 'Supplier risk profile'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION + ' The system does not auto-reject or auto-sanction any refund claim.'
  }
}

export function summarizeLitigationRisk(litCase) {
  return {
    title: `AI Litigation Risk Summary — ${litCase.tradeName}`,
    summary: [
      `Case relates to ${litCase.issue}, currently at stage: ${litCase.stage}.`,
      `Disputed amount: ₹${(litCase.disputedAmount / 100000).toFixed(1)} Lakh. Case ageing: ${litCase.ageingDays} days.`,
      `Department position assessed as: ${litCase.departmentPosition}. Adverse outcome risk: ${litCase.adverseOutcomeRisk}.`,
      litCase.departmentPosition.startsWith('Weak')
        ? 'Recommend strengthening documentary evidence and legal reasoning before next hearing.'
        : 'Current documentation and legal position appear adequately supported.'
    ],
    evidenceUsed: ['Case filing record', 'Stage and disputed amount on this appeal'],
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
    similarCases: similar.map(c => ({ id: c.id, tradeName: c.tradeName, riskScore: c.riskScore ?? c.risk?.score, stage: c.stage ?? c.status })),
    observation: similar.length > 0
      ? `${similar.length} other open case(s) in the same sector. Matched on sector only — not on risk pattern, facts or outcome, and not restricted to concluded cases. Comparable precedent requires the departmental order archive, which is not connected.`
      : 'No closely comparable cases found in the current dataset.',
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}

export function suggestHearingQuestions(caseItem) {
  return {
    title: `AI-Suggested Hearing Questions — ${caseItem.tradeName}`,
    questions: [
      'Please explain the basis for the input tax credit claimed in excess of the sector-typical range.',
      'Provide a reconciliation of e-way bill movement value against declared outward supply for the period in question.',
      'Clarify the relationship, if any, with counterparty entities flagged under linked-risk review.',
      'Explain the reason for the variance between turnover growth and corresponding tax payment trend.'
    ],
    evidenceUsed: ['Case risk explanation'],
    humanReviewRequired: true,
    limitationNote: STANDARD_LIMITATION
  }
}
