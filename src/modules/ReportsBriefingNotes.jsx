import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp, applyGlobalFilters, applyCaseFilters } from '../context/AppContext.jsx'
import { translateBriefing } from '../data/ai.js'
import { t } from '../i18n/index.js'
import {
  REPORT_TYPES, STATE_REVENUE_TREND, DISTRICT_REVENUE, SECTOR_REVENUE,
  TAXPAYERS, AUDIT_CASES, REFUND_CASES, LITIGATION_CASES, COMPLIANCE_ALERTS,
  AI_GOVERNANCE_METRICS, REFERENCE_DATE_ISO
} from '../data/mockData.js'
import {
  FileBarChart2, Eye, Download, Languages, ShieldAlert, FileStack,
  ClipboardCheck, Filter, UserCheck, AlertTriangle
} from 'lucide-react'

const GENERATED_ON = REFERENCE_DATE_ISO

/* ---------------------------------------------------------------------------
 * WHAT EACH REPORT COVERS
 *
 * A briefing note that does not say what it covers is the one an officer will
 * misread, so every report declares its scope basis on the card, in the draft,
 * and on anything copied out of it. `basis` describes how buildPreview() below
 * actually behaves — it is checkable by reading that function, not a claim.
 *
 *   filtered — every figure narrows with the header filters
 *   mixed    — some series are statewide by nature and say so in the draft
 *   platform — describes the AI layer itself; taxpayer filters do not apply
 *
 * Every label below is written as a t('…') literal inside a thunk rather than
 * as a bare constant string: a constant still reaches the translator at the
 * render site, but it is invisible to `npm run prose`, and a half-matched
 * sentence renders as a mongrel rather than as honest untranslated English.
 * Keep new prose in this shape.
 * ------------------------------------------------------------------------- */
const SCOPE_BASIS = {
  filtered: { label: () => t('Follows the header filters'), tone: 'green' },
  mixed: { label: () => t('Partly statewide — stated in the draft'), tone: 'amber' },
  platform: { label: () => t('Platform-wide — taxpayer filters do not apply'), tone: 'navy' }
}

const REPORT_SCOPE = {
  'commissioner-daily': { basis: 'filtered', unit: () => t('taxpayers'), sources: () => t('Taxpayer register, district revenue, compliance alerts') },
  'monthly-revenue-risk': { basis: 'mixed', unit: () => t('taxpayers'), sources: () => t('Statewide monthly revenue trend, taxpayer register, refund pipeline') },
  'district-performance': { basis: 'filtered', unit: () => t('districts'), sources: () => t('District revenue, targets and officer workload') },
  'sector-risk': { basis: 'mixed', unit: () => t('sectors'), sources: () => t('Fixed sector benchmarks and the taxpayer register') },
  'itc-exposure': { basis: 'filtered', unit: () => t('taxpayers'), sources: () => t('Taxpayer register — ITC spike and circular-trading signals') },
  'refund-risk': { basis: 'filtered', unit: () => t('refund cases'), sources: () => t('Refund case pipeline') },
  'audit-prioritisation': { basis: 'filtered', unit: () => t('audit cases'), sources: () => t('Audit case pipeline') },
  'litigation-risk': { basis: 'filtered', unit: () => t('litigation cases'), sources: () => t('Litigation and appeal register') },
  'compliance-early-warning': { basis: 'filtered', unit: () => t('alerts'), sources: () => t('Compliance early-warning alerts') },
  'ai-governance': { basis: 'platform', unit: null, sources: () => t('AI governance metrics (illustrative placeholders)') }
}

// Signed number formatting — a numeral, not a sentence, so it carries no
// translatable text of its own.
const signed = n => (n >= 0 ? `+${n}` : String(n))

// A "name (count)" series, assembled from translated fragments rather than a
// template literal so the whole line can be translated.
const namedCounts = pairs => pairs.map(([name, count]) => t('{0} ({1})', name, count)).join(', ')

function scopeCount(id, scope) {
  switch (id) {
    case 'commissioner-daily':
    case 'monthly-revenue-risk':
    case 'itc-exposure':
      return scope.taxpayers.length
    case 'district-performance': return scope.districts.length
    case 'sector-risk': return scope.sectors.length
    case 'refund-risk': return scope.refundCases.length
    case 'audit-prioritisation': return scope.auditCases.length
    case 'litigation-risk': return scope.litigationCases.length
    case 'compliance-early-warning': return scope.alerts.length
    default: return null
  }
}

/* Every branch below works off `scope`, a pre-filtered view built from the
 * header filters, and every report opens by stating the scope it actually
 * covers. Each line is a t() template with {0} placeholders — a briefing note
 * assembled with template literals can never be read in Marathi or Hindi. */
function buildPreview(id, scope) {
  const lastMonth = STATE_REVENUE_TREND.at(-1)
  const head = [t('Scope: {0}.', scope.label)]
  switch (id) {
    case 'commissioner-daily': {
      const topRisk = [...scope.districts].sort((a, b) => b.riskTaxpayers - a.riskTaxpayers).slice(0, 3)
      return head.concat([
        t('GST revenue modelled: ₹{0} Cr across {1} taxpayers in scope.', scope.kpi.revenueMonitoredCr.toLocaleString('en-IN'), scope.kpi.totalTaxpayers),
        t('Estimated high-risk revenue exposure: ₹{0} Cr ({1} Critical, {2} High risk entities).', scope.kpi.highRiskExposureCr, scope.kpi.criticalRisk, scope.kpi.highRisk),
        topRisk.length
          ? t('Highest risk-taxpayer concentration: {0}.', namedCounts(topRisk.map(d => [d.district, d.riskTaxpayers])))
          : t('No districts in scope.'),
        t('{0} compliance early-warning alerts in scope; {1} currently open.', scope.alerts.length, scope.alerts.filter(a => a.status === 'Open').length),
        t('Audit recovery pipeline: ₹{0} Cr; {1} non-filers in scope.', scope.kpi.auditRecoveryPipelineCr, scope.kpi.nonFilers)
      ])
    }
    case 'monthly-revenue-risk': {
      const gapCr = lastMonth.actual - lastMonth.target
      return head.concat([
        t('Latest month ({0}) statewide collection: ₹{1} Cr against a target of ₹{2} Cr ({3} Cr variance). The monthly trend series is statewide and is not narrowed by district or sector filters.', lastMonth.month, lastMonth.actual.toLocaleString('en-IN'), lastMonth.target.toLocaleString('en-IN'), signed(gapCr)),
        t('Estimated high-risk revenue exposure in scope: ₹{0} Cr.', scope.kpi.highRiskExposureCr),
        t('{0} taxpayers in scope flagged for elevated ITC risk indicators.', scope.kpi.itcRiskCases),
        t('{0} refund cases in scope remain under active risk review.', scope.refundCases.filter(r => r.status !== 'Low Risk').length)
      ])
    }
    case 'district-performance': {
      if (!scope.districts.length) return head.concat([t('No districts match the current filters.')])
      const sorted = [...scope.districts].sort((a, b) => a.gapPct - b.gapPct)
      const worst = sorted[0]
      const best = sorted.at(-1)
      const highWorkload = [...scope.districts].sort((a, b) => b.officerWorkload - a.officerWorkload)[0]
      return head.concat([
        t('{0} district(s) assessed against monthly revenue targets.', scope.districts.length),
        t('Largest shortfall: {0} at {1}% gap (target ₹{2} Cr vs actual ₹{3} Cr).', worst.district, worst.gapPct, worst.targetCr, worst.actualCr),
        t('Strongest performance: {0} at {1}% against target.', best.district, signed(best.gapPct)),
        t('Highest officer workload: {0} at {1}% officer utilisation (average case ageing {2} days).', highWorkload.district, highWorkload.officerWorkload, highWorkload.caseAgeingDays),
        t('Combined risk-taxpayer count across districts in scope: {0}.', scope.districts.reduce((s, d) => s + d.riskTaxpayers, 0))
      ])
    }
    case 'sector-risk': {
      const sorted = [...scope.sectors].sort((a, b) => b.highRiskCount - a.highRiskCount)
      const top = sorted.filter(x => x.taxpayerCount > 0).slice(0, 3)
      return head.concat([
        t('{0} sector(s) benchmarked for tax ratio, ITC ratio and refund ratio deviation.', scope.sectors.length),
        top.length
          ? t('Highest concentration of high/critical-risk taxpayers: {0}.', namedCounts(top.map(x => [t(x.sector), x.highRiskCount])))
          : t('No sector in scope currently carries a high or critical-risk taxpayer.'),
        t('Taxpayer count in scope: {0}.', scope.sectors.reduce((s, x) => s + x.taxpayerCount, 0)),
        t('Benchmark ratios are fixed departmental reference values and do not vary with the header filters.')
      ])
    }
    case 'itc-exposure': {
      const spikeCount = scope.taxpayers.filter(x => x.signals.itc_spike).length
      const circularCount = scope.taxpayers.filter(x => x.signals.circular_signal).length
      const topExposure = [...scope.taxpayers].sort((a, b) => b.estimatedRevenueExposure - a.estimatedRevenueExposure).slice(0, 3)
      return head.concat([
        t('{0} taxpayers in scope flagged for ITC-related risk indicators (abnormal spike and/or circular trading signal).', scope.kpi.itcRiskCases),
        t('Abnormal ITC spike signal present in {0} records; circular trading signal in {1} records.', spikeCount, circularCount),
        topExposure.length
          ? t('Top estimated revenue exposure: {0}.', topExposure.map(x => t('{0} (₹{1}L)', x.tradeName, (x.estimatedRevenueExposure / 100000).toFixed(1))).join(', '))
          : t('No taxpayers in scope.'),
        t('All figures represent statistical risk signals for officer-led verification, not confirmed evasion.')
      ])
    }
    case 'refund-risk': {
      const rc = scope.refundCases
      const needsReview = rc.filter(r => r.status !== 'Low Risk').length
      const escalate = rc.filter(r => r.status === 'Escalate for Scrutiny').length
      const totalClaimedLakh = Math.round(rc.reduce((s, r) => s + r.claimedAmount, 0) / 100000)
      return head.concat([
        t('{0} refund case(s) in scope in the risk-ranked pipeline.', rc.length),
        t('{0} require officer review; {1} recommended for escalated scrutiny.', needsReview, escalate),
        t('Total claimed refund value in scope: ₹{0} Lakh.', totalClaimedLakh.toLocaleString('en-IN')),
        t('Export-linked claims: {0} of {1}.', rc.filter(r => r.exportLinked).length, rc.length)
      ])
    }
    case 'audit-prioritisation': {
      const ac = scope.auditCases
      const critical = ac.filter(c => c.riskCategory === 'Critical').length
      const high = ac.filter(c => c.riskCategory === 'High').length
      const totalExposureCr = Math.round(ac.reduce((s, c) => s + c.estimatedExposure, 0) / 10000000)
      return head.concat([
        t('{0} case(s) in scope in the risk-ranked audit pipeline.', ac.length),
        t('{0} Critical-risk and {1} High-risk cases recommended for priority scoping.', critical, high),
        t('Combined estimated revenue exposure in scope: ₹{0} Cr.', totalExposureCr),
        t('Cases span {0} district(s) and {1} sector(s).', new Set(ac.map(c => c.district)).size, new Set(ac.map(c => c.sector)).size)
      ])
    }
    case 'litigation-risk': {
      const lc = scope.litigationCases
      const decided = lc.filter(c => ['Order Confirmed', 'Order Reversed', 'Remanded'].includes(c.stage))
      const confirmed = decided.filter(c => c.stage === 'Order Confirmed').length
      return head.concat([
        t('{0} active appeal/litigation case(s) in scope.', lc.length),
        decided.length
          ? t('Department success rate on decided matters in scope: {0}% ({1} of {2} decided).', Math.round((confirmed / decided.length) * 100), confirmed, decided.length)
          : t('No decided matters in scope.'),
        t('{0} orders reversed; {1} cases exceed ₹50 Lakh in disputed value.', lc.filter(c => c.stage === 'Order Reversed').length, lc.filter(c => c.disputedAmount > 5000000).length),
        t('Total amount under dispute in scope: ₹{0} Cr. This is value under appeal, not value recovered.', Math.round(lc.reduce((s, c) => s + c.disputedAmount, 0) / 10000000))
      ])
    }
    case 'compliance-early-warning': {
      const al = scope.alerts
      const open = al.filter(a => a.status === 'Open').length
      const byType = Object.entries(al.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc }, {}))
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
      return head.concat([
        t('{0} compliance early-warning alert(s) in scope; {1} currently open.', al.length, open),
        byType.length
          ? t('Leading alert types: {0}.', namedCounts(byType.map(([type, count]) => [t(type), count])))
          : t('No alerts in scope.'),
        t('Recommended actions range from automated reminders to officer review queue escalation.'),
        t('Early-warning outreach is informational only and does not constitute a formal notice.')
      ])
    }
    case 'ai-governance': {
      const gm = AI_GOVERNANCE_METRICS
      const approvalPct = Math.round((gm.officerApproved / gm.recommendationsGenerated) * 1000) / 10
      return [
        t('Scope: platform-wide. Governance metrics describe the AI layer itself and are not narrowed by taxpayer filters.'),
        t('Every figure in this report is an illustrative placeholder. There is no model, no gateway and no scheduled audit behind them, and no value below has been measured.'),
        t('{0} AI recommendations generated to date; {1}% officer-approved.', gm.recommendationsGenerated.toLocaleString('en-IN'), approvalPct),
        t('{0} suggestions rejected by officers; {1} pending governance review.', gm.rejectedSuggestions.toLocaleString('en-IN'), gm.pendingGovernanceReview),
        t('False-positive confirmation rate: {0} of {1} reviewed flags.', gm.falsePositiveConfirmed, gm.falsePositiveReviewed),
        t('Model drift monitoring: {0}', t(gm.driftStatus)),
        t('Red-team testing: {0}', t(gm.lastRedTeamTest)),
        t('CERT-In / VAPT readiness: {0}', t(gm.vaptStatus)),
        t('Maker-checker remains absolute: the AI system only ever occupies the maker / draft role and cannot independently execute an enforcement action.')
      ]
    }
    default:
      return [t('No preview data available for this report type.')]
  }
}

export default function ReportsBriefingNotes() {
  const { filters, logAction, auditLog, officerName, role } = useApp()
  const [activeReport, setActiveReport] = useState(null)
  const [showTranslated, setShowTranslated] = useState(false)
  const [translated, setTranslated] = useState(null)

  // One pre-filtered view of every dataset a report can draw on, built from the
  // header filters, so nothing a report prints is wider than what the officer
  // has selected above it.
  const scope = useMemo(() => {
    const taxpayers = TAXPAYERS.filter(x => applyGlobalFilters(x, filters))
    const districts = DISTRICT_REVENUE.filter(d =>
      (filters.district === 'All Districts' || d.district === filters.district)
      && (filters.division === 'All Divisions' || d.division === filters.division))
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
    if (filters.district !== 'All Districts') parts.push(t(filters.district))
    if (filters.division !== 'All Divisions') parts.push(t(filters.division))
    if (filters.sector !== 'All Sectors') parts.push(t(filters.sector))
    if (filters.taxpayerType !== 'All Types') parts.push(t(filters.taxpayerType))
    if (filters.riskLevel !== 'All Risk Levels') parts.push(t('{0} risk', t(filters.riskLevel)))
    parts.push(t(filters.dateRange))
    if (filters.search?.trim()) parts.push(t('search "{0}"', filters.search.trim()))

    return {
      label: parts.length === 1 ? t('whole modelled book, {0}', t(filters.dateRange)) : parts.join(' · '),
      narrowed: parts.length > 1,
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

  /* How many report types actually narrow with the filter bar. A count the
   * reader can check against the cards below, rather than an assurance that
   * "reports respect the filters". */
  const filterResponsive = useMemo(
    () => REPORT_TYPES.filter(r => REPORT_SCOPE[r.id]?.basis === 'filtered').length,
    []
  )

  /* Report handling this session, counted off the audit trail rather than
   * asserted. Every action this page logs carries the report id in `caseId`,
   * so this counts previews, export requests and clipboard copies — which is
   * what the label says it counts. A month-to-date total and a "most
   * requested" report used to sit here as invented constants; no generation
   * history is tracked anywhere, so neither could be checked. */
  const sessionActivity = useMemo(() => {
    const ids = new Set(REPORT_TYPES.map(r => r.id))
    const rows = auditLog.filter(r => r.module === 'Reports & Briefing Notes' && ids.has(r.caseId))
    const counts = new Map()
    rows.forEach(r => counts.set(r.caseId, (counts.get(r.caseId) || 0) + 1))
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const topId = ranked.length ? ranked[0][0] : null
    return {
      total: rows.length,
      topReport: topId ? REPORT_TYPES.find(r => r.id === topId) : null,
      topCount: ranked.length ? ranked[0][1] : 0
    }
  }, [auditLog])

  const visibleReports = useMemo(() => {
    const q = filters.search?.trim().toLowerCase()
    if (!q) return REPORT_TYPES
    return REPORT_TYPES.filter(r =>
      r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
      || t(r.name).toLowerCase().includes(q) || t(r.desc).toLowerCase().includes(q))
  }, [filters.search])

  function openReport(report) {
    setActiveReport(report)
    setShowTranslated(false)
    setTranslated(null)
    logAction(t('Previewed report: {0}', t(report.name)), 'Reports & Briefing Notes', report.id)
  }

  function closeReport() {
    setActiveReport(null)
    setShowTranslated(false)
    setTranslated(null)
  }

  function toggleTranslation() {
    if (!activeReport) return
    if (!showTranslated) {
      setTranslated(translateBriefing(buildPreview(activeReport.id, scope).join(' '), 'mr'))
    }
    setShowTranslated(s => !s)
  }

  const bullets = activeReport ? buildPreview(activeReport.id, scope) : []
  const activeScope = activeReport ? REPORT_SCOPE[activeReport.id] : null
  const activeBasis = activeScope ? SCOPE_BASIS[activeScope.basis] : null
  const activeCount = activeReport ? scopeCount(activeReport.id, scope) : null
  const preparedBy = officerName || t('Guest Officer')
  const preparedRole = role ? t(role) : t('Unauthenticated')

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Report Generation Center')}
        title={t('Reports & Briefing Notes')}
        description={<MethodNote short={t('Structured briefing notes for the Commissioner and senior officers.')} full={t('Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated AI-assisted draft assembled from current platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing. Each report states its own scope: most narrow with the header filters, and the ones that do not say so on the card and again in the draft.')} />}
      />

      <FilterScope shown={scope.taxpayers.length} total={TAXPAYERS.length} unit={t('taxpayers')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t('Report Types Available')} value={REPORT_TYPES.length} tone="navy" icon={FileStack} />
        <KpiCard
          label={t('Filter-Responsive Report Types')}
          value={t('{0} of {1}', filterResponsive, REPORT_TYPES.length)}
          unit={t('rest state their own scope')}
          tone="green"
          icon={Filter}
        />
        <KpiCard
          label={t('Report Actions Logged This Session')}
          value={sessionActivity.total}
          unit={t('previews, export requests and copies')}
          tone="saffron"
          icon={FileBarChart2}
        />
        <KpiCard
          label={t('Records in Current Scope')}
          value={scope.kpi.totalTaxpayers}
          unit={scope.narrowed ? t('taxpayers, filters applied') : t('taxpayers, whole modelled book')}
          tone="navy"
          icon={ClipboardCheck}
        />
      </div>

      <div className="rounded-xl border border-steel-200 bg-steel-50/70 px-5 py-4 mb-5 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <MethodNote className="text-xs text-navy-800 leading-relaxed max-w-4xl" short={t('Nothing here is a departmental record until an officer signs it.')} full={t('Nothing on this page is a departmental record. Every draft below is assembled from demonstration data and is unsigned until an authorised officer reviews and signs it. The session figures above are counted from the audit trail on the AI Governance & Security screen; no report-generation history is kept beyond this session, and this page does not claim one. Most-handled report this session: {0}.', sessionActivity.topReport ? t('{0} ({1} actions)', t(sessionActivity.topReport.name), sessionActivity.topCount) : t('none yet'))} />
      </div>

      {visibleReports.length === 0 ? (
        <div className="text-sm text-steel-500 py-10 text-center border border-dashed border-steel-200 rounded-xl">
          {t('No reports match your search.')}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleReports.map(report => {
          const meta = REPORT_SCOPE[report.id]
          const basis = meta ? SCOPE_BASIS[meta.basis] : null
          const count = scopeCount(report.id, scope)
          return (
            <Card tone="green" key={report.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-navy-50 border border-navy-100">
                    <FileBarChart2 className="w-3.5 h-3.5 text-navy-700" />
                  </span>
                  <span className="text-sm font-bold text-navy-900">{t(report.name)}</span>
                </div>
                <p className="text-xs text-steel-500 leading-relaxed">{t(report.desc)}</p>
                {basis && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <Pill tone={basis.tone}>{basis.label()}</Pill>
                    {count === null
                      ? <Pill tone="steel">{t('Not scoped by taxpayer')}</Pill>
                      : count === 0
                        ? <Pill tone="red">{t('0 {0} in scope', meta.unit())}</Pill>
                        : <Pill tone="steel">{t('{0} {1} in scope', count, meta.unit())}</Pill>}
                  </div>
                )}
                {meta && (
                  <p className="text-[11px] text-steel-400 mt-2">{t('Drawn from: {0}', meta.sources())}</p>
                )}
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
          )
        })}
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
              <Pill tone="navy">{t('Draft — unsigned')}</Pill>
              <Pill tone="amber">{t('Simulated output for demonstration')}</Pill>
              {activeBasis && <Pill tone={activeBasis.tone}>{activeBasis.label()}</Pill>}
            </div>

            {/* The provenance an oversight reader needs on any draft: when it
                was assembled, from what, over what scope, and by whom. */}
            <div className="rounded-xl border border-steel-200 bg-white overflow-hidden">
              <dl className="divide-y divide-steel-100 text-xs">
                <ProvenanceRow label={t('Generated on')} value={GENERATED_ON} />
                <ProvenanceRow label={t('Scope covered')} value={scope.label} />
                <ProvenanceRow label={t('Drawn from')} value={activeScope ? activeScope.sources() : '—'} />
                <ProvenanceRow
                  label={t('Records in scope')}
                  value={activeCount === null
                    ? t('Not scoped by taxpayer — describes the AI layer itself')
                    : t('{0} {1}', activeCount, activeScope.unit())}
                />
                <ProvenanceRow label={t('Prepared by (this session)')} value={t('{0} · {1}', preparedBy, preparedRole)} />
                <ProvenanceRow label={t('Officer sign-off')} value={t('Not signed — required before circulation or filing')} />
              </dl>
            </div>

            {activeCount === 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <MethodNote className="text-xs text-navy-800" short={t('Nothing selected, not nothing found — widen the filters before circulating.')} full={t('No records fall inside the current filters, so this draft has nothing to report on. Widen the header filters before circulating it — an empty brief reads as "nothing found" rather than "nothing selected".')} />
              </div>
            )}

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
                onClick={toggleTranslation}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-steel-200 hover:bg-steel-50 text-navy-700"
              >
                <Languages className="w-3.5 h-3.5" />
                {showTranslated ? t('Hide official-language summary') : t('Official-language summary')}
              </button>
            </div>

            {showTranslated && translated && (
              <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-saffron-200 bg-saffron-50">
                  <Languages className="w-3.5 h-3.5 text-saffron-700" />
                  <span className="text-sm font-semibold text-saffron-900">{translated.prefix}</span>
                </div>
                <div className="px-4 py-3 text-sm text-navy-800 whitespace-pre-wrap">{translated.body}</div>
                <div className="px-4 py-2.5 border-t border-saffron-200 text-[11px] text-saffron-900 bg-saffron-50/80">{t(translated.note)}</div>
                <div className="px-4 py-2.5 border-t border-saffron-200 text-[11px] text-steel-600">
                  {t('The body above is the draft as rendered in the language currently selected in the masthead. Any sentence with no entry in that language catalogue stays in English and is counted in the untranslated-string report on the AI Governance & Security screen.')}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-steel-100">
              <ExportBar
                moduleLabel="Reports & Briefing Notes"
                caseId={activeReport.id}
                getBriefingText={() => [
                  t('{0} — {1}', t(activeReport.name), bullets.join(' ')),
                  t('Prepared by (this session): {0} · {1}. Officer sign-off: not signed.', preparedBy, preparedRole)
                ].join(' ')}
              />
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-steel-500 pt-1">
              <UserCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
              <MethodNote short={t('A simulated draft. Requires officer review and sign-off before use.')} full={t('This report preview is a simulated, AI-assisted draft generated from platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing. Nothing in it has been actioned, and no figure in it may be treated as a finding.')} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ProvenanceRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 px-4 py-2.5">
      <dt className="text-[11px] uppercase font-semibold tracking-wide text-steel-500 sm:w-56 shrink-0">{label}</dt>
      <dd className="text-navy-800">{value}</dd>
    </div>
  )
}
