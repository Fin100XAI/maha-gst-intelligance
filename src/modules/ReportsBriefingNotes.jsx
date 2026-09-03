import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp, applyGlobalFilters, applyCaseFilters } from '../context/AppContext.jsx'
import { translateBriefing } from '../data/ai.js'
import { t } from '../i18n/index.js'
import {
  REPORT_TYPES, KPI_SUMMARY, STATE_REVENUE_TREND, DISTRICT_REVENUE, SECTOR_REVENUE,
  TAXPAYERS, AUDIT_CASES, REFUND_CASES, LITIGATION_CASES, LITIGATION_SUMMARY, COMPLIANCE_ALERTS,
  AI_GOVERNANCE_METRICS
,
  REFERENCE_DATE_ISO
} from '../data/mockData.js'
import {
  FileBarChart2, Eye, Download, Languages, ShieldAlert, FileStack,
  TrendingUp, ClipboardCheck
} from 'lucide-react'

const GENERATED_ON = REFERENCE_DATE_ISO
// Illustrative placeholder — no report-generation history is tracked.
const REPORTS_GENERATED_MTD = 128
const MOST_REQUESTED_ID = 'commissioner-daily'

// Every branch below previously read the raw dataset constants, so a report
// generated with "Pune" selected still covered all twelve districts. Each now
// works off `scope`, a pre-filtered view built from the header filters, and
// every report opens by stating the scope it actually covers — a briefing note
// that does not say what it covers is the one an officer will misread.
function buildPreview(id, scope) {
  const lastMonth = STATE_REVENUE_TREND.at(-1)
  const head = [`Scope: ${scope.label}.`]
  switch (id) {
    case 'commissioner-daily': {
      const topRisk = [...scope.districts].sort((a, b) => b.riskTaxpayers - a.riskTaxpayers).slice(0, 3)
      return head.concat([
        `GST revenue modelled: ₹${scope.kpi.revenueMonitoredCr.toLocaleString('en-IN')} Cr across ${scope.kpi.totalTaxpayers} taxpayers in scope.`,
        `Estimated high-risk revenue exposure: ₹${scope.kpi.highRiskExposureCr} Cr (${scope.kpi.criticalRisk} Critical, ${scope.kpi.highRisk} High risk entities).`,
        topRisk.length ? `Highest risk-taxpayer concentration: ${topRisk.map(d => `${d.district} (${d.riskTaxpayers})`).join(', ')}.` : 'No districts in scope.',
        `${scope.alerts.length} compliance early-warning alerts in scope; ${scope.alerts.filter(a => a.status === 'Open').length} currently open.`,
        `Audit recovery pipeline: ₹${scope.kpi.auditRecoveryPipelineCr} Cr; ${scope.kpi.nonFilers} non-filers in scope.`
      ])
    }
    case 'monthly-revenue-risk': {
      const gapCr = lastMonth.actual - lastMonth.target
      return head.concat([
        `Latest month (${lastMonth.month}) statewide collection: ₹${lastMonth.actual.toLocaleString('en-IN')} Cr against a target of ₹${lastMonth.target.toLocaleString('en-IN')} Cr (${gapCr >= 0 ? '+' : ''}${gapCr} Cr variance). The monthly trend series is statewide and is not narrowed by district or sector filters.`,
        `Estimated high-risk revenue exposure in scope: ₹${scope.kpi.highRiskExposureCr} Cr.`,
        `${scope.kpi.itcRiskCases} taxpayers in scope flagged for elevated ITC risk indicators.`,
        `${scope.refundCases.filter(r => r.status !== 'Low Risk').length} refund cases in scope remain under active risk review.`
      ])
    }
    case 'district-performance': {
      if (!scope.districts.length) return head.concat(['No districts match the current filters.'])
      const sorted = [...scope.districts].sort((a, b) => a.gapPct - b.gapPct)
      const worst = sorted[0]
      const best = sorted.at(-1)
      const highWorkload = [...scope.districts].sort((a, b) => b.officerWorkload - a.officerWorkload)[0]
      return head.concat([
        `${scope.districts.length} district(s) assessed against monthly revenue targets.`,
        `Largest shortfall: ${worst.district} at ${worst.gapPct}% gap (target ₹${worst.targetCr} Cr vs actual ₹${worst.actualCr} Cr).`,
        `Strongest performance: ${best.district} at ${best.gapPct >= 0 ? '+' : ''}${best.gapPct}% against target.`,
        `Highest officer workload: ${highWorkload.district} at ${highWorkload.officerWorkload}% officer utilisation (avg. case ageing ${highWorkload.caseAgeingDays} days).`,
        `Combined risk-taxpayer count across districts in scope: ${scope.districts.reduce((s, d) => s + d.riskTaxpayers, 0)}.`
      ])
    }
    case 'sector-risk': {
      const sorted = [...scope.sectors].sort((a, b) => b.highRiskCount - a.highRiskCount)
      const top = sorted.filter(x => x.taxpayerCount > 0).slice(0, 3)
      return head.concat([
        `${scope.sectors.length} sector(s) benchmarked for tax ratio, ITC ratio and refund ratio deviation.`,
        top.length ? `Highest concentration of high/critical-risk taxpayers: ${top.map(x => `${x.sector} (${x.highRiskCount})`).join(', ')}.` : 'No sector in scope currently carries a high or critical-risk taxpayer.',
        `Taxpayer count in scope: ${scope.sectors.reduce((s, x) => s + x.taxpayerCount, 0)}.`,
        `Benchmark ratios are fixed departmental reference values and do not vary with the header filters.`
      ])
    }
    case 'itc-exposure': {
      const spikeCount = scope.taxpayers.filter(x => x.signals.itc_spike).length
      const circularCount = scope.taxpayers.filter(x => x.signals.circular_signal).length
      const topExposure = [...scope.taxpayers].sort((a, b) => b.estimatedRevenueExposure - a.estimatedRevenueExposure).slice(0, 3)
      return head.concat([
        `${scope.kpi.itcRiskCases} taxpayers in scope flagged for ITC-related risk indicators (abnormal spike and/or circular trading signal).`,
        `Abnormal ITC spike signal present in ${spikeCount} records; circular trading signal in ${circularCount} records.`,
        topExposure.length ? `Top estimated revenue exposure: ${topExposure.map(x => `${x.tradeName} (₹${(x.estimatedRevenueExposure / 100000).toFixed(1)}L)`).join(', ')}.` : 'No taxpayers in scope.',
        `All figures represent statistical risk signals for officer-led verification, not confirmed evasion.`
      ])
    }
    case 'refund-risk': {
      const rc = scope.refundCases
      const needsReview = rc.filter(r => r.status !== 'Low Risk').length
      const escalate = rc.filter(r => r.status === 'Escalate for Scrutiny').length
      const totalClaimedLakh = Math.round(rc.reduce((s, r) => s + r.claimedAmount, 0) / 100000)
      return head.concat([
        `${rc.length} refund case(s) in scope in the risk-ranked pipeline.`,
        `${needsReview} require officer review; ${escalate} recommended for escalated scrutiny.`,
        `Total claimed refund value in scope: ₹${totalClaimedLakh.toLocaleString('en-IN')} Lakh.`,
        `Export-linked claims: ${rc.filter(r => r.exportLinked).length} of ${rc.length}.`
      ])
    }
    case 'audit-prioritisation': {
      const ac = scope.auditCases
      const critical = ac.filter(c => c.riskCategory === 'Critical').length
      const high = ac.filter(c => c.riskCategory === 'High').length
      const totalExposureCr = Math.round(ac.reduce((s, c) => s + c.estimatedExposure, 0) / 10000000)
      return head.concat([
        `${ac.length} case(s) in scope in the risk-ranked audit pipeline.`,
        `${critical} Critical-risk and ${high} High-risk cases recommended for priority scoping.`,
        `Combined estimated revenue exposure in scope: ₹${totalExposureCr} Cr.`,
        `Cases span ${new Set(ac.map(c => c.district)).size} district(s) and ${new Set(ac.map(c => c.sector)).size} sector(s).`
      ])
    }
    case 'litigation-risk': {
      const lc = scope.litigationCases
      const decided = lc.filter(c => ['Order Confirmed', 'Order Reversed', 'Remanded'].includes(c.stage))
      const confirmed = decided.filter(c => c.stage === 'Order Confirmed').length
      return head.concat([
        `${lc.length} active appeal/litigation case(s) in scope.`,
        decided.length ? `Department success rate on decided matters in scope: ${Math.round((confirmed / decided.length) * 100)}% (${confirmed} of ${decided.length} decided).` : 'No decided matters in scope.',
        `${lc.filter(c => c.stage === 'Order Reversed').length} orders reversed; ${lc.filter(c => c.disputedAmount > 5000000).length} cases exceed ₹50 Lakh in disputed value.`,
        `Total amount under dispute in scope: ₹${Math.round(lc.reduce((s, c) => s + c.disputedAmount, 0) / 10000000)} Cr. This is value under appeal, not value recovered.`
      ])
    }
    case 'compliance-early-warning': {
      const al = scope.alerts
      const open = al.filter(a => a.status === 'Open').length
      const byType = Object.entries(al.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc }, {}))
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
      return head.concat([
        `${al.length} compliance early-warning alert(s) in scope; ${open} currently open.`,
        byType.length ? `Leading alert types: ${byType.map(([ty, c]) => `${ty} (${c})`).join(', ')}.` : 'No alerts in scope.',
        `Recommended actions range from automated reminders to officer review queue escalation.`,
        `Early-warning outreach is informational only and does not constitute a formal notice.`
      ])
    }
    case 'ai-governance': {
      const approvalPct = Math.round((AI_GOVERNANCE_METRICS.officerApproved / AI_GOVERNANCE_METRICS.recommendationsGenerated) * 1000) / 10
      return [
        'Scope: platform-wide. Governance metrics describe the AI layer itself and are not narrowed by taxpayer filters.',
        `${AI_GOVERNANCE_METRICS.recommendationsGenerated.toLocaleString('en-IN')} AI recommendations generated to date; ${approvalPct}% officer-approved.`,
        `${AI_GOVERNANCE_METRICS.rejectedSuggestions.toLocaleString('en-IN')} suggestions rejected by officers; ${AI_GOVERNANCE_METRICS.pendingGovernanceReview} pending governance review.`,
        `False-positive confirmation rate: ${AI_GOVERNANCE_METRICS.falsePositiveConfirmed} of ${AI_GOVERNANCE_METRICS.falsePositiveReviewed} reviewed flags.`,
        `Model drift monitoring: ${AI_GOVERNANCE_METRICS.driftStatus}`,
        `Red-team testing: ${AI_GOVERNANCE_METRICS.lastRedTeamTest}`
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

  // One pre-filtered view of every dataset a report can draw on, built from the
  // header filters. Previously each preview read the raw constants, so the
  // filters above this page had no effect on anything it produced.
  const scope = useMemo(() => {
    const taxpayers = TAXPAYERS.filter(x => applyGlobalFilters(x, filters))
    const districts = DISTRICT_REVENUE.filter(d =>
      (filters.district === 'All Districts' || d.district === filters.district)
      && (filters.division === 'All Divisions' || d.division === filters.division))
    const inScope = new Set(taxpayers.map(x => x.id))
    const sectors = SECTOR_REVENUE
      .filter(sx => filters.sector === 'All Sectors' || sx.sector === filters.sector)
      .map(sx => {
        const members = taxpayers.filter(x => x.sector === sx.sector)
        return {
          ...sx,
          taxpayerCount: members.length,
          highRiskCount: members.filter(x => x.risk.category === 'High' || x.risk.category === 'Critical').length
        }
      })
    const auditCases = AUDIT_CASES.filter(c => applyCaseFilters(c, filters, 'openedOn'))
    const refundCases = REFUND_CASES.filter(c => applyCaseFilters(c, filters, 'filedOn'))
    const litigationCases = LITIGATION_CASES.filter(c => applyCaseFilters(c, filters, 'filedOn'))
    const alerts = COMPLIANCE_ALERTS.filter(a => applyCaseFilters(a, filters, 'raisedOn'))

    const parts = []
    if (filters.district !== 'All Districts') parts.push(filters.district)
    if (filters.division !== 'All Divisions') parts.push(filters.division)
    if (filters.sector !== 'All Sectors') parts.push(filters.sector)
    if (filters.taxpayerType !== 'All Types') parts.push(filters.taxpayerType)
    if (filters.riskLevel !== 'All Risk Levels') parts.push(`${filters.riskLevel} risk`)
    parts.push(filters.dateRange)
    if (filters.search?.trim()) parts.push(`search "${filters.search.trim()}"`)

    return {
      label: parts.length === 1 ? `whole modelled book, ${filters.dateRange}` : parts.join(' · '),
      taxpayers, districts, sectors, auditCases, refundCases, litigationCases, alerts,
      kpi: {
        totalTaxpayers: taxpayers.length,
        revenueMonitoredCr: Math.round(taxpayers.reduce((s, x) => s + x.taxPaid, 0) / 10000000),
        highRiskExposureCr: Math.round(taxpayers.filter(x => x.risk.category === 'High' || x.risk.category === 'Critical')
          .reduce((s, x) => s + x.estimatedRevenueExposure, 0) / 10000000),
        itcRiskCases: taxpayers.filter(x => x.signals.itc_spike || x.signals.circular_signal).length,
        nonFilers: taxpayers.filter(x => x.filingStatus === 'Non-Filer').length,
        criticalRisk: taxpayers.filter(x => x.risk.category === 'Critical').length,
        highRisk: taxpayers.filter(x => x.risk.category === 'High').length,
        auditRecoveryPipelineCr: districts.reduce((s, d) => s + d.auditRecoveryCr, 0)
      }
    }
  }, [filters])

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
      const previewText = buildPreview(activeReport.id, scope).join(' ')
      setTranslated(translateBriefing(previewText, 'mr'))
    }
    setShowMarathi(s => !s)
  }

  const bullets = activeReport ? buildPreview(activeReport.id, scope) : []

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Report Generation Center')}
        title={t('Reports & Briefing Notes')}
        description={t('Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated draft assembled from current platform data for demonstration purposes and requires officer sign-off before formal circulation.')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('Report Types Available')} value={REPORT_TYPES.length} tone="navy" icon={FileStack} />
        <KpiCard label={t('Reports Generated (This Month, illustrative)')} value={REPORTS_GENERATED_MTD} tone="green" icon={TrendingUp} />
        <KpiCard label={t('Most-Requested Report (illustrative)')} value={mostRequested ? t(mostRequested.name) : mostRequested?.name} tone="saffron" icon={FileBarChart2} />
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-700 hover:bg-ink-800 text-white"
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
