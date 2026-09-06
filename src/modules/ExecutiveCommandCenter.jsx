import { useMemo, useRef, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, HumanReviewBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { RiskDonutChart, HealthRadarChart } from '../components/ui/Charts.jsx'
import { ScoreGauge } from '../components/ui/ScoreGauge.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { CommandBoard } from '../components/shared/CommandBoard.jsx'
import {
  KPI_SUMMARY, STATE_REVENUE_TREND, DISTRICT_REVENUE,
  TAXPAYERS, DISTRICTS, COMPLIANCE_ALERTS, REFUND_CASES, AUDIT_CASES, LITIGATION_CASES, LITIGATION_SUMMARY,
  isWithinDateRange, sliceTrendByDateRange, REFERENCE_DATE
} from '../data/mockData.js'
import { RISK_COLORS, riskCategoryFromScore } from '../data/risk.js'
import { generateExecutiveBrief } from '../data/ai.js'
import { scaleContext } from '../data/official.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import {
  ShieldAlert, Sparkles, Landmark, TrendingDown, TrendingUp,
  MapPin, Bell, Users, FileWarning, Gauge,
  Activity, ClipboardCheck, BadgeCheck
} from 'lucide-react'

const caseAgeDays = openedOn => Math.max(0, Math.round((REFERENCE_DATE - new Date(openedOn)) / (1000 * 60 * 60 * 24)))

export default function ExecutiveCommandCenter() {
  const { filters, setActiveModule } = useApp()
  const officialScale = scaleContext(TAXPAYERS.length, DISTRICTS.length)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [briefGenerated, setBriefGenerated] = useState(false)
  const briefRef = useRef(null)

  const lastMonth = STATE_REVENUE_TREND.at(-1)

  const isFilteredView = filters.district !== 'All Districts' || filters.division !== 'All Divisions'
    || filters.sector !== 'All Sectors' || filters.riskLevel !== 'All Risk Levels'
    || filters.taxpayerType !== 'All Types' || filters.dateRange !== 'Last 12 Months' || !!filters.search

  const filteredTaxpayers = useMemo(
    () => TAXPAYERS.filter(t => applyGlobalFilters(t, filters)),
    [filters]
  )

  const filteredDistrictRevenue = useMemo(
    () => DISTRICT_REVENUE.filter(d =>
      (filters.district === 'All Districts' || d.district === filters.district)
      && (filters.division === 'All Divisions' || d.division === filters.division)
    ),
    [filters.district, filters.division]
  )

  const filteredTrend = useMemo(() => sliceTrendByDateRange(STATE_REVENUE_TREND, filters.dateRange), [filters.dateRange])

  // STATE_REVENUE_TREND has no per-district breakdown, so once a district or division is
  // selected, the revenue-monitored KPI must come from the district-level dataset (which
  // does carry that breakdown) instead of staying pinned to the full-state trend figure —
  // mirrors the fix applied to the same class of bug in Revenue Intelligence.
  const districtScoped = filters.district !== 'All Districts' || filters.division !== 'All Divisions'

  // Case-level datasets (audit/refund/litigation) carry their own district/sector/risk/date
  // fields, so they're filtered directly rather than through the taxpayer-shaped applyGlobalFilters.
  const filteredAuditCasesFull = useMemo(() => AUDIT_CASES.filter(c =>
    (filters.district === 'All Districts' || c.district === filters.district) &&
    (filters.sector === 'All Sectors' || c.sector === filters.sector) &&
    (filters.riskLevel === 'All Risk Levels' || c.riskCategory === filters.riskLevel) &&
    isWithinDateRange(c.openedOn, filters.dateRange) &&
    (!filters.search?.trim() || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(filters.search.toLowerCase()))
  ), [filters])

  const filteredRefundCasesFull = useMemo(() => REFUND_CASES.filter(c =>
    (filters.district === 'All Districts' || c.district === filters.district) &&
    (filters.sector === 'All Sectors' || c.sector === filters.sector) &&
    (filters.riskLevel === 'All Risk Levels' || c.riskCategory === filters.riskLevel) &&
    isWithinDateRange(c.filedOn, filters.dateRange) &&
    (!filters.search?.trim() || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(filters.search.toLowerCase()))
  ), [filters])

  const filteredLitigationCases = useMemo(() => LITIGATION_CASES.filter(c =>
    (filters.district === 'All Districts' || c.district === filters.district) &&
    (filters.sector === 'All Sectors' || c.sector === filters.sector) &&
    isWithinDateRange(c.filedOn, filters.dateRange) &&
    (!filters.search?.trim() || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(filters.search.toLowerCase()))
  ), [filters])

  const riskDistribution = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 }
    filteredTaxpayers.forEach(t => { counts[t.risk.category] = (counts[t.risk.category] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredTaxpayers])


  const topRiskTaxpayers = useMemo(
    () => [...filteredTaxpayers].sort((a, b) => b.risk.score - a.risk.score).slice(0, 10),
    [filteredTaxpayers]
  )

  const filteredOpenAlerts = useMemo(
    () => [...COMPLIANCE_ALERTS]
      .filter(a => a.status === 'Open')
      .filter(a => filters.district === 'All Districts' || a.district === filters.district)
      .filter(a => filters.sector === 'All Sectors' || a.sector === filters.sector)
      .filter(a => filters.riskLevel === 'All Risk Levels' || riskCategoryFromScore(a.riskScore) === filters.riskLevel)
      .filter(a => {
        if (!filters.search || !filters.search.trim()) return true
        const q = filters.search.toLowerCase()
        const hay = `${a.gstin} ${a.tradeName}`.toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => b.riskScore - a.riskScore),
    [filters]
  )
  const priorityAlerts = useMemo(() => filteredOpenAlerts.slice(0, 8), [filteredOpenAlerts])

  const kpis = useMemo(() => {
    const highRiskExposureCr = Math.round(
      filteredTaxpayers.filter(t => t.risk.category === 'High' || t.risk.category === 'Critical')
        .reduce((s, t) => s + t.estimatedRevenueExposure, 0) / 10000000
    )
    const itcRiskCases = filteredTaxpayers.filter(t => t.signals.itc_spike || t.signals.circular_signal).length
    const refundCasesUnderReview = filteredRefundCasesFull.filter(r => r.status !== 'Low Risk').length
    const auditRecoveryPipelineCr = filteredDistrictRevenue.reduce((s, d) => s + d.auditRecoveryCr, 0)
    return { highRiskExposureCr, itcRiskCases, refundCasesUnderReview, auditRecoveryPipelineCr }
  }, [filteredTaxpayers, filteredRefundCasesFull, filteredDistrictRevenue])

  const revenueMonitoredCr = useMemo(
    () => districtScoped ? filteredDistrictRevenue.reduce((s, d) => s + d.actualCr, 0) : filteredTrend.reduce((s, m) => s + m.actual, 0),
    [districtScoped, filteredDistrictRevenue, filteredTrend]
  )

  const lateFilerCount = filteredTaxpayers.filter(t => t.filingStatus === 'Late Filer').length
  const nonFilerCount = filteredTaxpayers.filter(t => t.filingStatus === 'Non-Filer').length
  const criticalRiskCount = filteredTaxpayers.filter(t => t.risk.category === 'Critical').length
  const highRiskCount = filteredTaxpayers.filter(t => t.risk.category === 'High').length

  const districtMax = Math.max(...filteredDistrictRevenue.map(d => d.riskTaxpayers), 1)

  const brief = useMemo(
    () => generateExecutiveBrief(KPI_SUMMARY, DISTRICT_REVENUE, KPI_SUMMARY.complianceAlerts),
    []
  )

  // ---- Revenue & Compliance Health Index — a single weighted composite, the way
  // a state-level command center reduces many indicators to one number leadership
  // can track quarter to quarter, with the components disclosed rather than hidden. ----
  const healthIndex = useMemo(() => {
    const totalTP = filteredTaxpayers.length || 1
    const filingCompliance = Math.round((filteredTaxpayers.filter(t => t.filingStatus === 'Regular Filer').length / totalTP) * 100)
    const revenueRealisation = Math.min(100, Math.round((lastMonth.actual / lastMonth.target) * 100))
    const itcRiskCasesCount = filteredTaxpayers.filter(t => t.signals.itc_spike || t.signals.circular_signal).length
    const itcContainment = Math.max(0, 100 - Math.round((itcRiskCasesCount / totalTP) * 100))
    const highRiskRefunds = filteredRefundCasesFull.filter(r => r.riskCategory === 'High' || r.riskCategory === 'Critical').length
    const refundContainment = filteredRefundCasesFull.length ? Math.max(0, 100 - Math.round((highRiskRefunds / filteredRefundCasesFull.length) * 100)) : 100
    const closedAudits = filteredAuditCasesFull.filter(c => c.stage === 'Closed').length
    const auditClosure = filteredAuditCasesFull.length ? Math.round((closedAudits / filteredAuditCasesFull.length) * 100) : 0
    const resolvedLit = filteredLitigationCases.filter(c => c.stage === 'Order Confirmed' || c.stage === 'Order Reversed')
    const confirmedLit = resolvedLit.filter(c => c.stage === 'Order Confirmed').length
    const litigationPosition = resolvedLit.length ? Math.round((confirmedLit / resolvedLit.length) * 100) : LITIGATION_SUMMARY.departmentSuccessRatePct

    const components = [
      { axis: 'Filing Compliance', weight: 25, score: filingCompliance },
      { axis: 'Revenue Realisation', weight: 20, score: revenueRealisation },
      { axis: 'ITC Risk Containment', weight: 15, score: itcContainment },
      { axis: 'Refund Risk Containment', weight: 15, score: refundContainment },
      { axis: 'Audit Closure Rate', weight: 15, score: auditClosure },
      { axis: 'Litigation Position', weight: 10, score: litigationPosition }
    ]
    const composite = Math.round(components.reduce((s, c) => s + (c.score * c.weight) / 100, 0))
    return { composite, components }
  }, [filteredTaxpayers, filteredRefundCasesFull, filteredAuditCasesFull, filteredLitigationCases, lastMonth])

  // ---- Revenue & Finance ----
  const nonFilerExposureCr = useMemo(
    () => Math.round(filteredTaxpayers.filter(t => t.filingStatus === 'Non-Filer').reduce((s, t) => s + t.estimatedRevenueExposure, 0) / 10000000),
    [filteredTaxpayers]
  )
  const revenueRealisationPct = Math.min(100, Math.round((lastMonth.actual / lastMonth.target) * 100))

  // ---- Audit & Enforcement Pipeline ----
  const auditPipeline = useMemo(() => {
    const sanctionedExposureCr = Math.round(filteredAuditCasesFull.reduce((s, c) => s + c.estimatedExposure, 0) / 10000000)
    const atRiskCount = filteredAuditCasesFull.filter(c => c.riskCategory === 'Critical').length
    const delayedCount = filteredAuditCasesFull.filter(c => c.stage !== 'Closed' && caseAgeDays(c.openedOn) > 180).length
    const highestRisk = [...filteredAuditCasesFull].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
    return { sanctionedExposureCr, atRiskCount, delayedCount, highestRisk }
  }, [filteredAuditCasesFull])

  // ---- Statewide Statistics (horizontal pill-tab pattern, mirrors mahagst.gov.in's public Statistics page) ----





  const tileTone = riskTaxpayers => {
    const ratio = riskTaxpayers / districtMax
    if (ratio > 0.75) return RISK_COLORS.Critical
    if (ratio > 0.5) return RISK_COLORS.High
    if (ratio > 0.25) return RISK_COLORS.Medium
    return RISK_COLORS.Low
  }

  const riskTableColumns = [
    { key: 'tradeName', label: t('Taxpayer'), render: r => (
      <div>
        <div className="font-semibold text-navy-900">{r.tradeName}</div>
        <div className="text-[11px] text-steel-500">{r.gstin}</div>
      </div>
    ) },
    { key: 'district', label: t('District'), render: r => t(r.district) },
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    { key: 'estimatedRevenueExposure', label: t('Exposure'), align: 'right', render: r => `₹${(r.estimatedRevenueExposure / 100000).toFixed(1)}L` },
    { key: 'risk', label: t('Risk'), align: 'right', sortValue: r => r.risk.score, render: r => <RiskBadge category={r.risk.category} score={r.risk.score} /> }
  ]



  return (
    <div>
      {/* Home hero */}
      <div className="mb-6 rounded-2xl border border-steel-200 bg-white px-6 py-7 sm:px-8 sm:py-9 shadow-panel relative overflow-hidden">
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">{t('Maha GST Intelligence')}</h1>
            <p className="text-sm text-steel-600 mt-1.5 max-w-2xl">{t('Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setBriefGenerated(true); briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-lg bg-govt-900 hover:bg-govt-800 text-white shadow-panel"
            >
              <Sparkles className="w-4 h-4" /> {t('Generate Commissioner Brief')}
            </button>
          </div>
        </div>
      </div>

      <SectionHeader
        eyebrow={t('Executive Command Center')}
        title={t('Statewide Revenue & Risk Overview')}
        description={t('Consolidated view of revenue performance, fraud risk exposure and compliance posture across Maharashtra for the Commissioner and senior leadership.')}
        actions={<ExportBar moduleLabel="Executive Command Center" />}
      />


      {/* Official published context, immediately above the simulated KPI row.
          The cards below look exactly like real departmental figures; setting
          the actual published scale next to them is what stops a reader taking
          them for the state's book. */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 shrink-0">
          <BadgeCheck className="w-3.5 h-3.5" /> {t('Official figures')}
        </span>
        <span className="text-[12px] text-steel-700 leading-relaxed flex-1">
          {t('Maharashtra has {0} registered SGST dealers (as at 1 April 2025). This demonstration models {1}. The cards below are generated data, not departmental collection figures.',
            officialScale.officialDealersDisplay, officialScale.modelledTaxpayers.toLocaleString('en-IN'))}
        </span>
        <button
          onClick={() => setActiveModule('official-statistics')}
          className="text-[11px] font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
        >
          {t('View sources')} →
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label={t('GST Revenue Monitored')} value={revenueMonitoredCr.toLocaleString('en-IN')} unit={t('₹ Cr')} tone="navy" icon={Landmark} />
        <KpiCard label={t('High-Risk Exposure')} value={kpis.highRiskExposureCr.toLocaleString('en-IN')} unit={t('₹ Cr')} tone="red" icon={ShieldAlert} />
        <KpiCard label={t('ITC Risk Cases')} value={kpis.itcRiskCases} tone="saffron" icon={FileWarning} />
        <KpiCard label={t('Refund Cases Under Review')} value={kpis.refundCasesUnderReview} tone="steel" icon={Gauge} />
        <KpiCard label={t('Audit Recovery Pipeline')} value={kpis.auditRecoveryPipelineCr.toLocaleString('en-IN')} unit={t('₹ Cr')} tone="green" icon={TrendingUp} />
        <KpiCard label={t('Compliance Alerts (Open)')} value={filteredOpenAlerts.length} tone="red" icon={Bell} />
      </div>

      {/* Revenue & Compliance Health Index — weighted composite, disclosed not hidden */}
      <Card
        className="mb-5"
        title={t('Revenue & Compliance Health Index')}
        subtitle={t('Weighted composite across six indicators — the single number leadership tracks period to period')}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex items-center justify-center lg:border-r lg:border-steel-100 lg:pr-6">
            <ScoreGauge score={healthIndex.composite} label={t('Composite score')} />
          </div>
          <div className="lg:col-span-1">
            <HealthRadarChart data={healthIndex.components} height={230} />
          </div>
          <div className="lg:col-span-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-steel-200">
                  <th className="text-left py-1.5 font-semibold text-steel-500 uppercase text-[10px] tracking-wide">{t('Component')}</th>
                  <th className="text-right py-1.5 font-semibold text-steel-500 uppercase text-[10px] tracking-wide">{t('Wt')}</th>
                  <th className="text-right py-1.5 font-semibold text-steel-500 uppercase text-[10px] tracking-wide">{t('Score')}</th>
                  <th className="text-right py-1.5 font-semibold text-steel-500 uppercase text-[10px] tracking-wide">{t('Contrib.')}</th>
                </tr>
              </thead>
              <tbody>
                {healthIndex.components.map(c => (
                  <tr key={c.axis} className="border-b border-steel-100 last:border-0">
                    <td className="py-1.5 text-navy-800">{t(c.axis)}</td>
                    <td className="py-1.5 text-right text-steel-500">{c.weight}%</td>
                    <td className="py-1.5 text-right font-semibold text-navy-900 tabular-nums">{c.score}</td>
                    <td className="py-1.5 text-right text-steel-500 tabular-nums">{((c.score * c.weight) / 100).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Risk distribution */}
        <Card title={t('Taxpayer Risk Distribution')} subtitle={isFilteredView ? t('{0} taxpayers matching current filters', filteredTaxpayers.length) : t('{0} taxpayers monitored statewide', filteredTaxpayers.length)}>
          <RiskDonutChart
            data={riskDistribution}
            colors={{ Low: RISK_COLORS.Low.solid, Medium: RISK_COLORS.Medium.solid, High: RISK_COLORS.High.solid, Critical: RISK_COLORS.Critical.solid }}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* District heatmap */}
        <Card
          className="lg:col-span-2"
          title={t('District Risk Heatmap')}
          subtitle={t('Shaded by count of High/Critical-risk taxpayers — click a district for detail')}
          actions={isFilteredView ? <Pill tone="navy">{t('Filtered view active')}</Pill> : null}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredDistrictRevenue.map(d => {
              const c = tileTone(d.riskTaxpayers)
              return (
                <button
                  key={d.district}
                  onClick={() => setSelectedDistrict(d)}
                  className={`text-left rounded-lg border ${c.border} ${c.bg} p-3 hover:-translate-y-0.5 hover:shadow-panel transition-all`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-navy-900 truncate">{t(d.district)}</span>
                    <MapPin className={`w-3 h-3 ${c.text} shrink-0`} />
                  </div>
                  <div className={`text-lg font-bold mt-1 ${c.text}`}>{d.riskTaxpayers}</div>
                  <div className="text-[10px] text-steel-500">{t('high/critical taxpayers')}</div>
                  <div className="text-[10px] text-steel-500 mt-1">{t('Gap:')} {d.gapPct >= 0 ? '+' : ''}{d.gapPct}%</div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Supporting stats */}
        <Card title={t('Filing Behaviour Snapshot')} subtitle={isFilteredView ? t('Filer status — matching current filters') : t('Statewide filer status')}>
          <div className="space-y-3">
            <StatRow icon={FileWarning} tone="red" label={t('Non-Filers')} value={nonFilerCount} sub={t('{0}% of taxpayer base', filteredTaxpayers.length ? ((nonFilerCount / filteredTaxpayers.length) * 100).toFixed(1) : '0.0')} />
            <StatRow icon={TrendingDown} tone="amber" label={t('Late Filers')} value={lateFilerCount} sub={t('{0}% of taxpayer base', filteredTaxpayers.length ? ((lateFilerCount / filteredTaxpayers.length) * 100).toFixed(1) : '0.0')} />
            <StatRow icon={Users} tone="navy" label={t('Critical Risk Entities')} value={criticalRiskCount} sub={t('Requires immediate officer attention')} />
            <StatRow icon={ShieldAlert} tone="orange" label={t('High Risk Entities')} value={highRiskCount} sub={t('Prioritised for scrutiny / audit')} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Matters requiring attention */}
        <Card className="lg:col-span-2" title={t('Matters Requiring Attention')} subtitle={t('{0} open', priorityAlerts.length)}>
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {priorityAlerts.map(a => {
              const category = riskCategoryFromScore(a.riskScore)
              const sev = category === 'Critical' ? { tone: 'red', label: t('Critical') } : { tone: 'saffron', label: t('High') }
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedTaxpayer(TAXPAYERS.find(t => t.id === a.taxpayerId))}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-steel-200 hover:border-navy-300 hover:bg-navy-50/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Pill tone={sev.tone}>{sev.label}</Pill>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-steel-400">{t(a.type)}</span>
                  </div>
                  <div className="text-xs font-semibold text-navy-900">{a.tradeName} · {t(a.district)}</div>
                  <p className="text-[11px] text-steel-500 mt-0.5 leading-snug">{a.recommendedAction}</p>
                </button>
              )
            })}
            {priorityAlerts.length === 0 && <div className="text-xs text-steel-500 py-4 text-center">{t('No open high-risk alerts.')}</div>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue & Finance */}
        <Card title={t('Revenue & Finance')} subtitle={t('Collection realisation against target, and exposure locked in non-filing')}>
          <div className="mb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-steel-500 uppercase tracking-wide">{t('Revenue Realisation')}</span>
              <span className={`text-2xl font-bold tabular-nums ${revenueRealisationPct >= 90 ? 'text-maharisk-low' : revenueRealisationPct >= 75 ? 'text-maharisk-medium' : 'text-maharisk-critical'}`}>{revenueRealisationPct}%</span>
            </div>
            <div className="text-[11px] text-steel-500 mb-1.5">{t('₹{0} Cr collected of ₹{1} Cr target ({2})', lastMonth.actual.toLocaleString('en-IN'), lastMonth.target.toLocaleString('en-IN'), lastMonth.month)}</div>
            <div className="h-2.5 rounded-full bg-steel-100 border border-steel-200 overflow-hidden">
              <div className={`h-full ${revenueRealisationPct >= 90 ? 'bg-maharisk-low' : revenueRealisationPct >= 75 ? 'bg-maharisk-medium' : 'bg-maharisk-critical'}`} style={{ width: `${revenueRealisationPct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={t('Est. Exposure — Non-Filers')} value={`₹${nonFilerExposureCr} Cr`} />
            <MiniStat label={t('Audit Recovery Pipeline')} value={`₹${kpis.auditRecoveryPipelineCr} Cr`} />
          </div>
        </Card>

        {/* Audit & Enforcement Pipeline */}
        <Card
          title={t('Audit & Enforcement Pipeline')}
          subtitle={isFilteredView ? t('{0} cases matching filters', filteredAuditCasesFull.length) : t('{0} cases statewide', filteredAuditCasesFull.length)}
          actions={<span className="inline-flex items-center gap-1 text-[11px] font-medium text-steel-400"><Activity className="w-3.5 h-3.5" /> {t('live')}</span>}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat label={t('Sanctioned Exposure')} value={`₹${auditPipeline.sanctionedExposureCr} Cr`} />
            <MiniStat label={t('Critical Risk')} value={auditPipeline.atRiskCount} />
            <MiniStat label={t('Delayed (>180d)')} value={auditPipeline.delayedCount} />
          </div>
          <div className="text-[11px] font-semibold text-steel-500 uppercase tracking-wide mb-1.5">{t('Highest-Risk Cases')}</div>
          <div className="space-y-2">
            {auditPipeline.highestRisk.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="text-[11px] text-navy-700 w-32 truncate shrink-0">{c.tradeName}</span>
                <div className="flex-1 h-1.5 rounded-full bg-steel-100 overflow-hidden">
                  <div className="h-full bg-ink-600" style={{ width: `${c.riskScore}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-navy-900 w-6 text-right shrink-0">{c.riskScore}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top risk clusters table */}
      <Card
        title={t('Top 10 Highest-Risk Taxpayers')}
        subtitle={isFilteredView
          ? t('Risk ranking within the current filtered view — click a row for the full Taxpayer 360 profile')
          : t('Statewide risk ranking — click a row for the full Taxpayer 360 profile')}
        className="mb-5"
        actions={topRiskTaxpayers.some(t => t.risk.category === 'High' || t.risk.category === 'Critical') ? <HumanReviewBadge /> : null}
      >
        <DataTable
          columns={riskTableColumns}
          rows={topRiskTaxpayers}
          onRowClick={row => setSelectedTaxpayer(row)}
          searchable={false}
          pageSize={10}
        />
      </Card>

      {/* Executive brief — governed AI layer, generated inline rather than in a modal */}
      <div ref={briefRef}>
        <Card
          className="mb-5"
          title={t('Commissioner Daily Brief')}
          subtitle={t('Governed AI layer — advisory only. Every finding below states its evidence and confidence.')}
          actions={
            <button
              onClick={() => setBriefGenerated(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink-700 text-white hover:bg-ink-800"
            >
              <Sparkles className="w-3.5 h-3.5" /> {t('Generate')}
            </button>
          }
        >
          {briefGenerated ? (
            <AIOutputPanel output={brief} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-navy-300" />
              <div className="text-sm font-semibold text-navy-800">{t('No brief generated yet')}</div>
              <div className="text-xs text-steel-500 max-w-md">
                {t("Generate an executive brief to synthesise the state's current revenue and risk position, with evidence and confidence stated for every finding.")}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* District detail modal */}
      {/* Closing the screen: the conditions that need a decision, after the
          performance picture that explains them. */}
      <CommandBoard onOpen={setActiveModule} />

      <Modal
        open={!!selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
        size="md"
        title={t(selectedDistrict?.district)}
        subtitle={t(selectedDistrict?.division)}
      >
        {selectedDistrict && (
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={t('Target Collection')} value={`₹${selectedDistrict.targetCr.toLocaleString('en-IN')} Cr`} />
            <MiniStat label={t('Actual Collection')} value={`₹${selectedDistrict.actualCr.toLocaleString('en-IN')} Cr`} />
            <MiniStat label={t('Collection Gap')} value={`${selectedDistrict.gapPct >= 0 ? '+' : ''}${selectedDistrict.gapPct}%`} />
            <MiniStat label={t('High/Critical Risk Taxpayers')} value={selectedDistrict.riskTaxpayers} />
            <MiniStat label={t('Non-Filers')} value={selectedDistrict.nonFilers} />
            <MiniStat label={t('Audit Recovery')} value={`₹${selectedDistrict.auditRecoveryCr} Cr`} />
            <MiniStat label={t('Officer Workload Index')} value={selectedDistrict.officerWorkload} />
            <MiniStat label={t('Avg. Case Ageing')} value={t('{0} days', selectedDistrict.caseAgeingDays)} />
          </div>
        )}
      </Modal>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function StatRow({ icon: Icon, tone, label, value, sub }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.steel
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ backgroundColor: t.bg, borderColor: t.border }}>
      <span className="p-2 rounded-lg shrink-0" style={{ backgroundColor: t.iconBg, color: t.accent }}><Icon className="w-4 h-4" /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium" style={{ color: t.accent }}>{label}</span>
          <span className="text-base font-bold tabular-nums" style={{ color: t.accent }}>{value}</span>
        </div>
        <div className="text-[10.5px] text-steel-500">{sub}</div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-steel-50">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
    </div>
  )
}
