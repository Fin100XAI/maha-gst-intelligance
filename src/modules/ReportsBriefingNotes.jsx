import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { translateBriefing } from '../data/ai.js'
import { t } from '../i18n/index.js'
import {
  REPORT_TYPES, KPI_SUMMARY, STATE_REVENUE_TREND, DISTRICT_REVENUE, SECTOR_REVENUE,
  TAXPAYERS, AUDIT_CASES, REFUND_CASES, LITIGATION_SUMMARY, COMPLIANCE_ALERTS,
  AI_GOVERNANCE_METRICS
} from '../data/mockData.js'
import {
  FileBarChart2, Eye, Download, Languages, ShieldAlert, FileStack,
  TrendingUp, ClipboardCheck
} from 'lucide-react'

const GENERATED_ON = '2026-08-17'
const REPORTS_GENERATED_MTD = 128
const MOST_REQUESTED_ID = 'commissioner-daily'

function buildPreview(id) {
  const lastMonth = STATE_REVENUE_TREND.at(-1)
  switch (id) {
    case 'commissioner-daily': {
      const topRisk = [...DISTRICT_REVENUE].sort((a, b) => b.riskTaxpayers - a.riskTaxpayers).slice(0, 3)
      return [
        `State GST revenue monitored: ₹${KPI_SUMMARY.revenueMonitoredCr.toLocaleString('en-IN')} Cr across ${KPI_SUMMARY.totalTaxpayers} tracked taxpayers.`,
        `Estimated high-risk revenue exposure: ₹${KPI_SUMMARY.highRiskExposureCr} Cr (${KPI_SUMMARY.criticalRisk} Critical, ${KPI_SUMMARY.highRisk} High risk entities).`,
        `Highest risk-taxpayer concentration: ${topRisk.map(d => `${d.district} (${d.riskTaxpayers})`).join(', ')}.`,
        `${KPI_SUMMARY.complianceAlerts} compliance early-warning alerts remain open as of today.`,
        `Audit recovery pipeline: ₹${KPI_SUMMARY.auditRecoveryPipelineCr} Cr across active cases; ${KPI_SUMMARY.nonFilers} non-filers currently on record.`
      ]
    }
    case 'monthly-revenue-risk': {
      const gapCr = lastMonth.actual - lastMonth.target
      return [
        `Latest month (${lastMonth.month}) collection: ₹${lastMonth.actual.toLocaleString('en-IN')} Cr against a target of ₹${lastMonth.target.toLocaleString('en-IN')} Cr (${gapCr >= 0 ? '+' : ''}${gapCr} Cr variance).`,
        `Estimated high-risk revenue exposure across the taxpayer base: ₹${KPI_SUMMARY.highRiskExposureCr} Cr.`,
        `${KPI_SUMMARY.itcRiskCases} taxpayers currently flagged for elevated ITC risk indicators.`,
        `${KPI_SUMMARY.refundCasesUnderReview} refund cases remain under active risk review this period.`,
        `24-month trend shows a cumulative monitored collection of ₹${KPI_SUMMARY.revenueMonitoredCr.toLocaleString('en-IN')} Cr.`
      ]
    }
    case 'district-performance': {
      const sorted = [...DISTRICT_REVENUE].sort((a, b) => a.gapPct - b.gapPct)
      const worst = sorted[0]
      const best = sorted.at(-1)
      const highWorkload = [...DISTRICT_REVENUE].sort((a, b) => b.officerWorkload - a.officerWorkload)[0]
      return [
        `${DISTRICT_REVENUE.length} districts assessed against monthly revenue targets.`,
        `Largest shortfall: ${worst.district} at ${worst.gapPct}% gap (target ₹${worst.targetCr} Cr vs actual ₹${worst.actualCr} Cr).`,
        `Strongest performance: ${best.district} at ${best.gapPct >= 0 ? '+' : ''}${best.gapPct}% against target.`,
        `Highest officer workload: ${highWorkload.district} at ${highWorkload.officerWorkload} cases per officer (avg. case ageing ${highWorkload.caseAgeingDays} days).`,
        `Combined risk-taxpayer count across all districts: ${DISTRICT_REVENUE.reduce((s, d) => s + d.riskTaxpayers, 0)}.`
      ]
    }
    case 'sector-risk': {
      const sorted = [...SECTOR_REVENUE].sort((a, b) => b.highRiskCount - a.highRiskCount)
      const top = sorted.slice(0, 3)
      return [
        `${SECTOR_REVENUE.length} sectors benchmarked for tax ratio, ITC ratio and refund ratio deviation.`,
        `Highest concentration of high/critical-risk taxpayers: ${top.map(s => `${s.sector} (${s.highRiskCount})`).join(', ')}.`,
        `Sector-wide taxpayer count under monitoring: ${SECTOR_REVENUE.reduce((s, x) => s + x.taxpayerCount, 0)}.`,
        `Aggregate declared revenue across sectors: ₹${SECTOR_REVENUE.reduce((s, x) => s + x.revenueLakh, 0).toLocaleString('en-IN')} Lakh.`
      ]
    }
    case 'itc-exposure': {
      const spikeCount = TAXPAYERS.filter(t => t.signals.itc_spike).length
      const circularCount = TAXPAYERS.filter(t => t.signals.circular_signal).length
      const topExposure = [...TAXPAYERS].sort((a, b) => b.estimatedRevenueExposure - a.estimatedRevenueExposure).slice(0, 3)
      return [
        `${KPI_SUMMARY.itcRiskCases} taxpayers flagged for ITC-related risk indicators (abnormal spike and/or circular trading signal).`,
        `Abnormal ITC spike detected in ${spikeCount} taxpayer records; circular trading signal in ${circularCount} records.`,
        `Top estimated revenue exposure: ${topExposure.map(t => `${t.tradeName} (₹${(t.estimatedRevenueExposure / 100000).toFixed(1)}L)`).join(', ')}.`,
        `All figures represent statistical risk signals for officer-led verification, not confirmed evasion.`
      ]
    }
    case 'refund-risk': {
      const needsReview = REFUND_CASES.filter(r => r.status !== 'Low Risk').length
      const escalate = REFUND_CASES.filter(r => r.status === 'Escalate for Scrutiny').length
      const totalClaimedLakh = Math.round(REFUND_CASES.reduce((s, r) => s + r.claimedAmount, 0) / 100000)
      return [
        `${REFUND_CASES.length} refund cases in the current risk-ranked pipeline.`,
        `${needsReview} cases require officer review; ${escalate} recommended for escalated scrutiny.`,
        `Total claimed refund value under review: ₹${totalClaimedLakh.toLocaleString('en-IN')} Lakh.`,
        `Export-linked claims: ${REFUND_CASES.filter(r => r.exportLinked).length} of ${REFUND_CASES.length} cases.`
      ]
    }
    case 'audit-prioritisation': {
      const critical = AUDIT_CASES.filter(c => c.riskCategory === 'Critical').length
      const high = AUDIT_CASES.filter(c => c.riskCategory === 'High').length
      const totalExposureCr = Math.round(AUDIT_CASES.reduce((s, c) => s + c.estimatedExposure, 0) / 10000000)
      return [
        `${AUDIT_CASES.length} cases in the current risk-ranked audit pipeline.`,
        `${critical} Critical-risk and ${high} High-risk cases recommended for priority scoping.`,
        `Combined estimated revenue exposure across pipeline: ₹${totalExposureCr} Cr.`,
        `Cases span ${new Set(AUDIT_CASES.map(c => c.district)).size} districts and ${new Set(AUDIT_CASES.map(c => c.sector)).size} sectors.`
      ]
    }
    case 'litigation-risk': {
      return [
        `${LITIGATION_SUMMARY.totalAppeals} active appeals/litigation cases on record.`,
        `Department success rate on resolved matters: ${LITIGATION_SUMMARY.departmentSuccessRatePct}%.`,
        `${LITIGATION_SUMMARY.reversedOrders} orders reversed to date; ${LITIGATION_SUMMARY.pendingHighValue} pending cases exceed ₹50 Lakh in disputed value.`,
        `Estimated recovery locked in litigation: ₹${LITIGATION_SUMMARY.recoveryLockedCr} Cr.`
      ]
    }
    case 'compliance-early-warning': {
      const open = COMPLIANCE_ALERTS.filter(a => a.status === 'Open').length
      const byType = Object.entries(COMPLIANCE_ALERTS.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc }, {}))
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
      return [
        `${COMPLIANCE_ALERTS.length} compliance early-warning alerts on record; ${open} currently open.`,
        `Leading alert types: ${byType.map(([t, c]) => `${t} (${c})`).join(', ')}.`,
        `Recommended actions range from automated reminders to officer review queue escalation.`,
        `Early-warning outreach is informational only and does not constitute a formal notice.`
      ]
    }
    case 'ai-governance': {
      const approvalPct = Math.round((AI_GOVERNANCE_METRICS.officerApproved / AI_GOVERNANCE_METRICS.recommendationsGenerated) * 1000) / 10
      return [
        `${AI_GOVERNANCE_METRICS.recommendationsGenerated.toLocaleString('en-IN')} AI recommendations generated to date; ${approvalPct}% officer-approved.`,
        `${AI_GOVERNANCE_METRICS.rejectedSuggestions.toLocaleString('en-IN')} suggestions rejected by officers; ${AI_GOVERNANCE_METRICS.pendingGovernanceReview} pending governance review.`,
        `False-positive confirmation rate: ${AI_GOVERNANCE_METRICS.falsePositiveConfirmed} of ${AI_GOVERNANCE_METRICS.falsePositiveReviewed} reviewed flags.`,
        `Model drift status: ${AI_GOVERNANCE_METRICS.driftStatus}.`,
        `Last red-team test: ${AI_GOVERNANCE_METRICS.lastRedTeamTest}. VAPT status: ${AI_GOVERNANCE_METRICS.vaptStatus}.`
      ]
    }
    default:
      return ['No preview data available for this report type.']
  }
}

export default function ReportsBriefingNotes() {
  const { filters, logAction } = useApp()
  const [activeReport, setActiveReport] = useState(null)
  const [showMarathi, setShowMarathi] = useState(false)
  const [translated, setTranslated] = useState(null)

  const mostRequested = useMemo(() => REPORT_TYPES.find(r => r.id === MOST_REQUESTED_ID), [])

  const visibleReports = useMemo(() => {
    const q = filters.search?.trim().toLowerCase()
    if (!q) return REPORT_TYPES
    return REPORT_TYPES.filter(r => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q))
  }, [filters.search])

  function openReport(report) {
    setActiveReport(report)
    setShowMarathi(false)
    setTranslated(null)
    logAction(`Previewed Report: ${report.name}`, 'Reports & Briefing Notes', report.id)
  }

  function closeReport() {
    setActiveReport(null)
    setShowMarathi(false)
    setTranslated(null)
  }

  function toggleMarathi() {
    if (!activeReport) return
    if (!showMarathi) {
      const previewText = buildPreview(activeReport.id).join(' ')
      setTranslated(translateBriefing(previewText, 'mr'))
    }
    setShowMarathi(s => !s)
  }

  const bullets = activeReport ? buildPreview(activeReport.id) : []

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Report Generation Center')}
        title={t('Reports & Briefing Notes')}
        description={t('Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated draft assembled from current platform data for demonstration purposes and requires officer sign-off before formal circulation.')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('Report Types Available')} value={REPORT_TYPES.length} tone="navy" icon={FileStack} />
        <KpiCard label={t('Reports Generated (This Month)')} value={REPORTS_GENERATED_MTD} tone="green" icon={TrendingUp} />
        <KpiCard label={t('Most-Requested Report')} value={mostRequested ? t(mostRequested.name) : mostRequested?.name} tone="saffron" icon={FileBarChart2} />
        <KpiCard label={t('Pending Governance-Reviewed Reports')} value={AI_GOVERNANCE_METRICS.pendingGovernanceReview} tone="red" icon={ClipboardCheck} />
      </div>

      {visibleReports.length === 0 ? (
        <div className="text-sm text-steel-500 py-10 text-center border border-dashed border-steel-200 rounded-xl">
          {t('No reports match your search.')}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleReports.map(report => (
          <Card key={report.id} className="flex flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-navy-50 border border-navy-100">
                  <FileBarChart2 className="w-3.5 h-3.5 text-navy-700" />
                </span>
                <span className="text-sm font-bold text-navy-900">{t(report.name)}</span>
              </div>
              <p className="text-xs text-steel-500 leading-relaxed">{t(report.desc)}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-steel-100">
              <button
                onClick={() => openReport(report)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-steel-200 hover:bg-steel-50 text-navy-700"
              >
                <Eye className="w-3.5 h-3.5" /> {t('Preview')}
              </button>
              <button
                onClick={() => openReport(report)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-navy-700 hover:bg-navy-800 text-white"
              >
                <Download className="w-3.5 h-3.5" /> {t('Generate')}
              </button>
            </div>
          </Card>
        ))}
      </div>
      )}

      <Modal
        open={!!activeReport}
        onClose={closeReport}
        size="lg"
        title={activeReport ? t(activeReport.name) : undefined}
        subtitle={activeReport ? t(activeReport.desc) : undefined}
      >
        {activeReport && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Pill tone="navy">{t('Draft report preview')}</Pill>
              <Pill tone="amber">{t('Simulated output for demonstration')}</Pill>
              <span className="text-steel-400">{t('Generated on {0}', GENERATED_ON)}</span>
            </div>

            <div className="rounded-xl border border-steel-200 bg-steel-50/60 p-4">
              <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide mb-2">{t('Summary — English')}</div>
              <ul className="space-y-2">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-navy-800">
                    <span className="text-navy-400 font-semibold shrink-0">{i + 1}.</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <button
                onClick={toggleMarathi}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-steel-200 hover:bg-steel-50 text-navy-700"
              >
                <Languages className="w-3.5 h-3.5" /> {showMarathi ? 'Hide Marathi Summary' : 'Marathi Summary'}
              </button>
            </div>

            {showMarathi && translated && (
              <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-saffron-200 bg-saffron-50">
                  <Languages className="w-3.5 h-3.5 text-saffron-700" />
                  <span className="text-sm font-semibold text-saffron-900">{translated.prefix}</span>
                </div>
                <div className="px-4 py-3 text-sm text-navy-800 whitespace-pre-wrap">{translated.body}</div>
                <div className="px-4 py-2.5 border-t border-saffron-200 text-[11px] text-saffron-900 bg-saffron-50/80">{translated.note}</div>
              </div>
            )}

            <div className="pt-3 border-t border-steel-100">
              <ExportBar
                moduleLabel="Reports & Briefing Notes"
                caseId={activeReport.id}
                getBriefingText={() => `${activeReport.name} — ${bullets.join(' ')}`}
              />
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-steel-500 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
              <span>{t('This report preview is a simulated, AI-assisted draft generated from platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing.')}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
