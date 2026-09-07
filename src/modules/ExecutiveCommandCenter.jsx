import { useMemo, useRef, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, HumanReviewBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { RiskDonutChart, HealthRadarChart } from '../components/ui/Charts.jsx'
import { ScoreGauge } from '../components/ui/ScoreGauge.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
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
/* Every figure below that is not a page-local roll-up of the mock datasets is
 * read from the engine that owns the question — never recomputed here. The
 * limitation clock is statutory.js, decay is recovery.js, the establishment is
 * capacity.js, the deduplicated exposure is commandCentre.js, and the standing
 * conditions are commandBoard.js. */
import { LIMITATION_SUMMARY, LIMITATION_REGISTER } from '../data/statutory.js'
import { RECOVERY_PORTFOLIO, RECOVERY_CASES } from '../data/recovery.js'
import { CAPACITY_RESULT } from '../data/capacity.js'
import { COMMAND_SUMMARY } from '../data/commandCentre.js'
import { BOARD_SUMMARY } from '../data/commandBoard.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import {
  ShieldAlert, Sparkles, Landmark, TrendingDown, TrendingUp,
  MapPin, Bell, Users, FileWarning, Gauge,
  Activity, ClipboardCheck, BadgeCheck, Ban, Clock, UserX, ArrowRight
} from 'lucide-react'

const caseAgeDays = openedOn => Math.max(0, Math.round((REFERENCE_DATE - new Date(openedOn)) / (1000 * 60 * 60 * 24)))
const toCr = rupees => Math.round(rupees / 10000000)
const toLakh = rupees => Math.round(rupees / 100000)

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
    () => TAXPAYERS.filter(tp => applyGlobalFilters(tp, filters)),
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
    filteredTaxpayers.forEach(tp => { counts[tp.risk.category] = (counts[tp.risk.category] || 0) + 1 })
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

  /* An alert count on its own is a workload figure, not a revenue figure. The
   * denominator that matters is how many DISTINCT taxpayers those alerts
   * represent — one entity can trip four rules — and what those entities carry
   * in exposure. Counted once per taxpayer, the same discipline the command
   * centre applies to its own headline. */
  const alertBasis = useMemo(() => {
    const ids = new Set(filteredOpenAlerts.map(a => a.taxpayerId))
    const exposure = filteredTaxpayers.filter(tp => ids.has(tp.id)).reduce((s, tp) => s + tp.estimatedRevenueExposure, 0)
    const totalInScope = COMPLIANCE_ALERTS.filter(a =>
      (filters.district === 'All Districts' || a.district === filters.district) &&
      (filters.sector === 'All Sectors' || a.sector === filters.sector)
    ).length
    return { taxpayers: ids.size, exposureCr: toCr(exposure), totalInScope }
  }, [filteredOpenAlerts, filteredTaxpayers, filters.district, filters.sector])

  const kpis = useMemo(() => {
    const highRiskEntities = filteredTaxpayers.filter(tp => tp.risk.category === 'High' || tp.risk.category === 'Critical')
    const totalExposure = filteredTaxpayers.reduce((s, tp) => s + tp.estimatedRevenueExposure, 0)
    const highRiskExposure = highRiskEntities.reduce((s, tp) => s + tp.estimatedRevenueExposure, 0)
    const itcRiskCases = filteredTaxpayers.filter(tp => tp.signals.itc_spike || tp.signals.circular_signal).length
    const refundCasesUnderReview = filteredRefundCasesFull.filter(r => r.status !== 'Low Risk').length
    const refundClaimedCr = toCr(filteredRefundCasesFull.reduce((s, r) => s + r.claimedAmount, 0))
    const auditRecoveryPipelineCr = filteredDistrictRevenue.reduce((s, d) => s + d.auditRecoveryCr, 0)
    return {
      highRiskExposureCr: toCr(highRiskExposure),
      highRiskEntityCount: highRiskEntities.length,
      totalExposureCr: toCr(totalExposure),
      highRiskSharePct: totalExposure ? Math.round((highRiskExposure / totalExposure) * 100) : 0,
      itcRiskCases,
      itcSharePct: filteredTaxpayers.length ? Math.round((itcRiskCases / filteredTaxpayers.length) * 100) : 0,
      refundCasesUnderReview,
      refundTotal: filteredRefundCasesFull.length,
      refundClaimedCr,
      auditRecoveryPipelineCr,
      recoveryCoveragePct: highRiskExposure ? Math.round((auditRecoveryPipelineCr * 10000000 / highRiskExposure) * 100) : null
    }
  }, [filteredTaxpayers, filteredRefundCasesFull, filteredDistrictRevenue])

  const revenueMonitoredCr = useMemo(
    () => districtScoped ? filteredDistrictRevenue.reduce((s, d) => s + d.actualCr, 0) : filteredTrend.reduce((s, m) => s + m.actual, 0),
    [districtScoped, filteredDistrictRevenue, filteredTrend]
  )

  /* A collection figure with no comparator changes nothing. The 24-month series
   * carries the same month a year earlier, which is the comparison a
   * Commissioner actually makes — month on month is dominated by the seasonal
   * term. There is no per-district monthly series, so under a district or
   * division filter this is stated as unavailable rather than silently shown
   * against a statewide comparator. */
  const revenueComparator = useMemo(() => {
    const n = STATE_REVENUE_TREND.length
    const latest = STATE_REVENUE_TREND[n - 1]
    const yearAgo = n > 12 ? STATE_REVENUE_TREND[n - 13] : null
    if (!yearAgo || !yearAgo.actual) return null
    return {
      pct: Math.round(((latest.actual - yearAgo.actual) / yearAgo.actual) * 1000) / 10,
      againstMonth: yearAgo.month
    }
  }, [])

  /* The district book: target against actual for the latest month, rolled up
   * across whatever the filter has selected. The heatmap shows each district's
   * gap; a Commissioner needs the roll-up and the worst formation. */
  const collectionGap = useMemo(() => {
    const target = filteredDistrictRevenue.reduce((s, d) => s + d.targetCr, 0)
    const actual = filteredDistrictRevenue.reduce((s, d) => s + d.actualCr, 0)
    const inDeficit = filteredDistrictRevenue.filter(d => d.gapPct < 0)
    const worst = [...filteredDistrictRevenue].sort((a, b) => a.gapPct - b.gapPct)[0] || null
    return {
      targetCr: target,
      actualCr: actual,
      gapCr: actual - target,
      gapPct: target ? Math.round(((actual - target) / target) * 1000) / 10 : 0,
      deficitCount: inDeficit.length,
      districtCount: filteredDistrictRevenue.length,
      worst
    }
  }, [filteredDistrictRevenue])

  const lateFilerCount = filteredTaxpayers.filter(tp => tp.filingStatus === 'Late Filer').length
  const nonFilerCount = filteredTaxpayers.filter(tp => tp.filingStatus === 'Non-Filer').length
  const criticalRiskCount = filteredTaxpayers.filter(tp => tp.risk.category === 'Critical').length
  const highRiskCount = filteredTaxpayers.filter(tp => tp.risk.category === 'High').length

  const districtMax = Math.max(...filteredDistrictRevenue.map(d => d.riskTaxpayers), 1)

  const brief = useMemo(
    () => generateExecutiveBrief(KPI_SUMMARY, DISTRICT_REVENUE, KPI_SUMMARY.complianceAlerts),
    []
  )

  /* ---- The five figures that decide today ------------------------------
   * Each is read from the engine that owns it, carries the denominator it is
   * measured against, and states the decision it demands. All five are
   * statewide: limitation, decay, capacity and the deduplicated union are
   * computed over the whole establishment and cannot be narrowed by the
   * header filter without recomputing engines this screen does not own. That
   * is said on screen rather than left for the reader to assume. */
  const decisionTiles = useMemo(() => ([
    {
      id: 'barred',
      label: t('Already time-barred'),
      value: LIMITATION_SUMMARY.barredCr.toLocaleString('en-IN'),
      unit: t('₹ Cr'),
      tone: 'red',
      icon: Ban,
      module: 'statutory-time',
      basis: t('{0} of {1} proceedings on the limitation register. No action available to the department recovers this.', LIMITATION_SUMMARY.barredCount, LIMITATION_SUMMARY.totalCases),
      decision: t('Close them formally and record why each was missed.')
    },
    {
      id: 'within30',
      label: t('Expires within 30 days'),
      value: LIMITATION_SUMMARY.within30Cr.toLocaleString('en-IN'),
      unit: t('₹ Cr'),
      tone: 'orange',
      icon: Clock,
      module: 'statutory-time',
      basis: t('{0} proceedings, of which {1} have no eligible officer available this week.', LIMITATION_SUMMARY.within30Count, CAPACITY_RESULT.mandatoryUnworkable.length),
      decision: t('Issue the notice, or second an officer from an adjacent division.')
    },
    {
      id: 'protectable',
      label: t('Still protectable'),
      value: toCr(COMMAND_SUMMARY.protectableValue).toLocaleString('en-IN'),
      unit: t('₹ Cr'),
      tone: 'navy',
      icon: ShieldAlert,
      module: 'revenue-protection',
      basis: t('{0} cases, each counted once however many mechanisms flag it — {1}× overlap removed.', COMMAND_SUMMARY.protectableCases, COMMAND_SUMMARY.overlapFactor),
      decision: t('Rank the week by what an action protects, not by the size of the case.')
    },
    {
      id: 'decay',
      label: t('Decays this week'),
      value: RECOVERY_PORTFOLIO.decayNextWeekCr.toLocaleString('en-IN'),
      unit: t('₹ Cr'),
      tone: 'amber',
      icon: TrendingDown,
      module: 'recovery-window',
      basis: t('Of ₹{0} Cr still recoverable today. This stops being blockable by next Monday.', RECOVERY_PORTFOLIO.recoverableNowCr.toLocaleString('en-IN')),
      decision: t('Work the top of the priority queue before the week closes.')
    },
    {
      id: 'unreachable',
      label: t('No officer can reach it'),
      value: CAPACITY_RESULT.unworkableCount.toLocaleString('en-IN'),
      unit: t('cases'),
      tone: 'red',
      icon: UserX,
      module: 'capacity',
      basis: t('₹{0} Cr not workable this week · {1} have no eligible officer posted at all.', toCr(CAPACITY_RESULT.unworkableValue).toLocaleString('en-IN'), CAPACITY_RESULT.noEligibleOfficer),
      decision: t('A posting decision where nobody is eligible; a prioritisation decision for the rest.')
    }
  ]), [])

  const conditionCount = BOARD_SUMMARY.critical + BOARD_SUMMARY.high + BOARD_SUMMARY.watch

  /* ---- Can the department act on what it has found? ----
   * The allocation and the establishment both belong to the capacity engine —
   * read, never restated. Aggregate utilisation is the figure to distrust,
   * which is why the residual is broken out by the remedy it needs. */
  const capacity = useMemo(() => ({
    officerCount: CAPACITY_RESULT.officerCount,
    supplyDays: CAPACITY_RESULT.totalSupplyDays,
    usedDays: CAPACITY_RESULT.usedDays,
    utilisationPct: CAPACITY_RESULT.totalSupplyDays ? Math.round((CAPACITY_RESULT.usedDays / CAPACITY_RESULT.totalSupplyDays) * 100) : 0,
    assignedCount: CAPACITY_RESULT.assignedCount,
    unworkableCount: CAPACITY_RESULT.unworkableCount,
    unworkableCr: toCr(CAPACITY_RESULT.unworkableValue),
    mandatoryUnworkable: CAPACITY_RESULT.mandatoryUnworkable.length,
    captureShare: CAPACITY_RESULT.captureShare,
    noEligibleOfficer: CAPACITY_RESULT.noEligibleOfficer,
    noCapacity: CAPACITY_RESULT.noCapacity,
    exceedsWeek: CAPACITY_RESULT.exceedsWeek,
    bindingPoolCount: CAPACITY_RESULT.bindingPools.length
  }), [])

  // ---- Revenue & Compliance Health Index — a single weighted composite, the way
  // a state-level command center reduces many indicators to one number leadership
  // can track quarter to quarter, with the components disclosed rather than hidden. ----
  const healthIndex = useMemo(() => {
    const totalTP = filteredTaxpayers.length || 1
    const filingCompliance = Math.round((filteredTaxpayers.filter(tp => tp.filingStatus === 'Regular Filer').length / totalTP) * 100)
    const revenueRealisation = Math.min(100, Math.round((lastMonth.actual / lastMonth.target) * 100))
    const itcRiskCasesCount = filteredTaxpayers.filter(tp => tp.signals.itc_spike || tp.signals.circular_signal).length
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
    /* A composite with no attribution tells leadership the number moved but not
     * what moved it. The largest drag is the points the composite loses to one
     * component — weight × shortfall — which is where a corrective effort buys
     * the most, and is not the same as the lowest-scoring component. */
    const drag = components
      .map(c => ({ axis: c.axis, lost: Math.round(((100 - c.score) * c.weight) / 100 * 10) / 10, score: c.score }))
      .sort((a, b) => b.lost - a.lost)[0]
    return { composite, components, drag }
  }, [filteredTaxpayers, filteredRefundCasesFull, filteredAuditCasesFull, filteredLitigationCases, lastMonth])

  // ---- Revenue & Finance ----
  const nonFilerExposureCr = useMemo(
    () => toCr(filteredTaxpayers.filter(tp => tp.filingStatus === 'Non-Filer').reduce((s, tp) => s + tp.estimatedRevenueExposure, 0)),
    [filteredTaxpayers]
  )
  const revenueRealisationPct = Math.min(100, Math.round((lastMonth.actual / lastMonth.target) * 100))

  // ---- Audit & Enforcement Pipeline ----
  const auditPipeline = useMemo(() => {
    const sanctionedExposureCr = toCr(filteredAuditCasesFull.reduce((s, c) => s + c.estimatedExposure, 0))
    const atRiskCount = filteredAuditCasesFull.filter(c => c.riskCategory === 'Critical').length
    const delayedCount = filteredAuditCasesFull.filter(c => c.stage !== 'Closed' && caseAgeDays(c.openedOn) > 180).length
    const highestRisk = [...filteredAuditCasesFull].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
    return { sanctionedExposureCr, atRiskCount, delayedCount, highestRisk }
  }, [filteredAuditCasesFull])

  /* The two facts that turn a risk ranking into a work order: how long the
   * statutory clock has left, and what the case loses by waiting a week. Both
   * are looked up, never recomputed — the limitation register is built from the
   * audit caseload and the recovery window from taxpayers carrying a triggered
   * rule, so a taxpayer absent from either is shown as such rather than
   * defaulted to a number that would read as a real one. */
  const limitationByGstin = useMemo(() => new Map(LIMITATION_REGISTER.map(r => [r.gstin, r])), [])
  const recoveryByGstin = useMemo(() => new Map(RECOVERY_CASES.map(r => [r.gstin, r])), [])

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
    { key: 'estimatedRevenueExposure', label: t('Exposure'), align: 'right', render: r => `₹${(r.estimatedRevenueExposure / 100000).toFixed(1)}L` },
    {
      key: 'deadline',
      label: t('Statutory clock'),
      align: 'right',
      sortValue: r => limitationByGstin.get(r.gstin)?.daysRemaining ?? 99999,
      render: r => {
        const lim = limitationByGstin.get(r.gstin)
        if (!lim) return <span className="text-[11px] text-steel-400">{t('No proceeding on record')}</span>
        if (lim.daysRemaining < 0) return <Pill tone="red">{t('Time-barred')}</Pill>
        if (lim.daysRemaining <= 30) return <Pill tone="red">{t('{0} days', lim.daysRemaining)}</Pill>
        if (lim.daysRemaining <= 90) return <Pill tone="amber">{t('{0} days', lim.daysRemaining)}</Pill>
        return <span className="text-[11px] text-steel-600 tabular-nums">{t('{0} days', lim.daysRemaining)}</span>
      }
    },
    {
      key: 'decay',
      label: t('Lost if untouched 7 days'),
      align: 'right',
      sortValue: r => recoveryByGstin.get(r.gstin)?.decayNextWeek ?? -1,
      render: r => {
        const rec = recoveryByGstin.get(r.gstin)
        if (!rec) return <span className="text-[11px] text-steel-400">{t('Not in the recovery window')}</span>
        return <span className="tabular-nums font-semibold text-navy-900">{t('₹{0} L', toLakh(rec.decayNextWeek))}</span>
      }
    },
    { key: 'risk', label: t('Risk'), align: 'right', sortValue: r => r.risk.score, render: r => <RiskBadge category={r.risk.category} score={r.risk.score} /> }
  ]

  const statewidePill = <Pill tone="steel">{t('Statewide — not narrowed by the filter bar')}</Pill>

  return (
    <div>
      {/* Home hero */}
      <div className="mb-6 rounded-2xl border border-steel-200 bg-white px-6 py-7 sm:px-8 sm:py-9 shadow-panel relative overflow-hidden">
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">{t('Maha GST Intelligence')}</h1>
            <p className="text-sm text-steel-600 mt-1.5 max-w-2xl">{t('Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for GST')}</p>
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
        description={<MethodNote short={t('Ordered by what needs a decision today, not by what displays easily.')} full={t('Ordered by what needs a decision today, not by what is easiest to display. The irreversible position comes first, then whether the department can act on it, then the performance picture that explains how it arose.')} />}
        actions={<ExportBar moduleLabel="Executive Command Center" />}
      />

      {/* A page that respects the filter bar says how much of the base it is
          showing. Without this the officer narrows to one division and reads
          statewide figures as divisional ones. */}
      <FilterScope shown={filteredTaxpayers.length} total={TAXPAYERS.length} unit={t('taxpayers')} />

      {/* Official published context, immediately above the simulated KPI row.
          The cards below look exactly like real departmental figures; setting
          the actual published scale next to them is what stops a reader taking
          them for the state's book. */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 shrink-0">
          <BadgeCheck className="w-3.5 h-3.5" /> {t('Official figures')}
        </span>
        <MethodNote className="text-[12px] text-steel-700 leading-relaxed flex-1" short={t('Official dealer figures, against what this demonstration models.')} full={t('Maharashtra has {0} registered SGST dealers (as at 1 April 2025). This demonstration models {1}. The cards below are generated data, not departmental collection figures.',
            officialScale.officialDealersDisplay, officialScale.modelledTaxpayers.toLocaleString('en-IN'))} />
        <button
          onClick={() => setActiveModule('official-statistics')}
          className="text-[11px] font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0"
        >
          {t('View sources')} →
        </button>
      </div>

      {/* ---------- WHAT NEEDS A DECISION TODAY ----------
          Irreversible loss first, then what is still in play. Ordering these by
          rupee value would put the recoverable above the irrecoverable. */}
      <Card
        className="mb-5"
        title={t('What needs a decision today')}
        subtitle={<MethodNote short={t('Each figure is read from the engine that owns the question.')} full={t('{0} of {1} active conditions need a decision at Commissioner level. Each figure below is read from the engine that owns the question, carries the base it is measured against, and states the decision it demands.', BOARD_SUMMARY.commissionerDecisions, conditionCount)} />}
        actions={statewidePill}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {decisionTiles.map(d => (
            <div key={d.id} className="flex flex-col">
              <KpiCard
                label={t(d.label)}
                value={d.value}
                unit={d.unit ? t(d.unit) : undefined}
                tone={d.tone}
                icon={d.icon}
                onClick={() => setActiveModule(d.module)}
              />
              <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">{t(d.basis)}</p>
              <p className="text-[10.5px] text-navy-800 font-medium leading-snug mt-1.5 px-1 flex items-start gap-1">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-navy-400" />
                <span>{t(d.decision)}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* The standing conditions, immediately under the figures that raise them. */}
      <div className="mb-5">
        <CommandBoard onOpen={setActiveModule} />
      </div>

      {/* ---------- CAN THE DEPARTMENT ACT ON IT? ---------- */}
      <Card
        className="mb-5"
        title={t('Can the department act on what it has found?')}
        subtitle={<MethodNote short={t('Establishment, allocation and residual are read from the capacity engine.')} full={t('A finding nobody can work is not a finding. Establishment, allocation and residual are read from the capacity engine — an unused officer-day in one division cannot be spent in another, so aggregate utilisation is the figure to distrust.')} />}
        actions={
          <button
            onClick={() => setActiveModule('capacity')}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy-700 hover:underline"
          >
            {t('Open capacity & deployment')} <ArrowRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <MiniStat
            label={t('Field officers')}
            value={capacity.officerCount.toLocaleString('en-IN')}
            basis={t('{0} net officer-days this week after overhead', capacity.supplyDays)}
          />
          <MiniStat
            label={t('Week committed')}
            value={t('{0}%', capacity.utilisationPct)}
            basis={t('{0} of {1} days placed on {2} cases', capacity.usedDays, capacity.supplyDays, capacity.assignedCount)}
          />
          <MiniStat
            label={t('Not workable this week')}
            value={t('₹{0} Cr', capacity.unworkableCr.toLocaleString('en-IN'))}
            basis={t('{0} cases · {1} of them inside the 30-day statutory window', capacity.unworkableCount, capacity.mandatoryUnworkable)}
            tone="red"
          />
          <MiniStat
            label={t('Share of the achievable captured')}
            value={capacity.captureShare != null ? t('{0}%', capacity.captureShare) : t('Not computable')}
            basis={capacity.captureShare != null
              ? t('Against an upper bound that relaxes both eligibility and indivisibility, so it is unreachable by construction.')
              : t('The relaxed upper bound is zero on this week’s demand, so no share can be stated.')}
          />
        </div>

        {/* Three causes, three different remedies. The remedies themselves are
            set out where the deployment decision is actually taken — repeating
            them here would be the same paragraph on two screens. */}
        <p className="text-[12px] text-steel-700 leading-relaxed mb-4">
          {capacity.unworkableCount > 0
            ? t('Of the {0} cases nobody can work: {1} have no eligible officer posted in that division at all, which is a posting decision; {2} have eligible officers whose week is already spent, which is a volume decision; and {3} need more than one officer-week and cannot be placed inside a seven-day horizon however many officers are added.',
              capacity.unworkableCount, capacity.noEligibleOfficer, capacity.noCapacity, capacity.exceedsWeek)
            : t('Every case in this week’s demand was placed with an eligible officer.')}
        </p>

        <div className="rounded-lg border border-navy-200 bg-navy-50/50 px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[12px] text-navy-800 leading-relaxed">
            {capacity.bindingPoolCount > 0
              ? t('{0} division-and-case-type pools are oversubscribed this week. Which one the next officer-week should go to, and what it would protect, is answered on the Revenue Protection Command Centre.', capacity.bindingPoolCount)
              : t('No division-and-case-type pool is oversubscribed this week.')}
          </span>
          <button
            onClick={() => setActiveModule('revenue-protection')}
            className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy-700 hover:underline whitespace-nowrap"
          >
            {t('Open revenue protection')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Card>

      {/* KPI row — every tile carries the base it is measured against. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div>
          <KpiCard
            label={t('GST Revenue Monitored')}
            value={revenueMonitoredCr.toLocaleString('en-IN')}
            unit={t('₹ Cr')}
            tone="navy"
            icon={Landmark}
            trend={!districtScoped && revenueComparator ? revenueComparator.pct : undefined}
            trendLabel={!districtScoped && revenueComparator ? t('vs {0}', revenueComparator.againstMonth) : undefined}
            onClick={() => setActiveModule('revenue-intelligence')}
          />
          <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">
            {districtScoped
              ? t('Latest month across {0} districts in scope. No per-district monthly series exists, so the year-on-year comparator is not shown rather than borrowed from the statewide figure.', collectionGap.districtCount)
              : t('{0} months to {1}, against a {2} target.', filteredTrend.length, lastMonth.month, t('₹{0} Cr', lastMonth.target.toLocaleString('en-IN')))}
          </p>
        </div>
        <div>
          <KpiCard label={t('High-Risk Exposure')} value={kpis.highRiskExposureCr.toLocaleString('en-IN')} unit={t('₹ Cr')} tone="red" icon={ShieldAlert} onClick={() => setActiveModule('revenue-intelligence')} />
          <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">
            {t('{0}% of ₹{1} Cr assessed exposure in scope, held by {2} entities.', kpis.highRiskSharePct, kpis.totalExposureCr.toLocaleString('en-IN'), kpis.highRiskEntityCount)}
          </p>
        </div>
        <div>
          <KpiCard label={t('ITC Risk Cases')} value={kpis.itcRiskCases} tone="saffron" icon={FileWarning} onClick={() => setActiveModule('itc-risk')} />
          <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">
            {t('{0}% of the {1} taxpayers in scope carry an ITC spike or a circular-trading signal.', kpis.itcSharePct, filteredTaxpayers.length.toLocaleString('en-IN'))}
          </p>
        </div>
        <div>
          <KpiCard label={t('Refund Cases Under Review')} value={kpis.refundCasesUnderReview} tone="steel" icon={Gauge} onClick={() => setActiveModule('refund-risk')} />
          <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">
            {t('Of {0} claims in scope, together claiming ₹{1} Cr.', kpis.refundTotal, kpis.refundClaimedCr.toLocaleString('en-IN'))}
          </p>
        </div>
        <div>
          <KpiCard label={t('Audit Recovery Pipeline')} value={kpis.auditRecoveryPipelineCr.toLocaleString('en-IN')} unit={t('₹ Cr')} tone="green" icon={TrendingUp} onClick={() => setActiveModule('audit-scrutiny')} />
          <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">
            {kpis.recoveryCoveragePct != null
              ? t('Covers {0}% of the high-risk exposure alongside it.', kpis.recoveryCoveragePct)
              : t('No high-risk exposure in scope to measure this against.')}
          </p>
        </div>
        <div>
          <KpiCard label={t('Compliance Alerts (Open)')} value={filteredOpenAlerts.length} tone="red" icon={Bell} onClick={() => setActiveModule('early-warning')} />
          <p className="text-[10.5px] text-steel-500 leading-snug mt-1.5 px-1">
            {t('Of {0} raised in scope, on {1} distinct taxpayers carrying ₹{2} Cr of exposure counted once.', alertBasis.totalInScope, alertBasis.taxpayers, alertBasis.exposureCr.toLocaleString('en-IN'))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue & Finance */}
        <Card title={t('Revenue & Finance')} subtitle={t('Collection realisation against target, the district book behind it, and exposure locked in non-filing')}>
          <div className="mb-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-steel-500 uppercase tracking-wide">{t('Revenue Realisation')}</span>
              <span className={`text-2xl font-bold tabular-nums ${revenueRealisationPct >= 90 ? 'text-maharisk-low' : revenueRealisationPct >= 75 ? 'text-maharisk-medium' : 'text-maharisk-critical'}`}>{revenueRealisationPct}%</span>
            </div>
            <div className="text-[11px] text-steel-500 mb-1.5">{t('₹{0} Cr collected of ₹{1} Cr target ({2})', lastMonth.actual.toLocaleString('en-IN'), lastMonth.target.toLocaleString('en-IN'), lastMonth.month)}</div>
            <div className="h-2.5 rounded-full bg-steel-100 border border-steel-200 overflow-hidden">
              <div className={`h-full ${revenueRealisationPct >= 90 ? 'bg-maharisk-low' : revenueRealisationPct >= 75 ? 'bg-maharisk-medium' : 'bg-maharisk-critical'}`} style={{ width: `${revenueRealisationPct}%` }} />
            </div>
            <p className="text-[11px] text-steel-500 leading-relaxed mt-1.5">
              {revenueComparator
                ? t('Statewide collection is {0}% against the same month a year earlier ({1}).', revenueComparator.pct, revenueComparator.againstMonth)
                : t('The series does not yet hold a full year before this month, so no year-on-year comparator is stated.')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat
              label={t('Collection gap — latest month')}
              value={t('₹{0} Cr', collectionGap.gapCr.toLocaleString('en-IN'))}
              basis={t('{0} of {1} districts in scope are below target ({2}%).', collectionGap.deficitCount, collectionGap.districtCount, collectionGap.gapPct)}
              tone={collectionGap.gapCr < 0 ? 'red' : 'green'}
            />
            <MiniStat
              label={t('Widest district shortfall')}
              value={collectionGap.worst ? t('{0}%', collectionGap.worst.gapPct) : t('No district in scope')}
              basis={collectionGap.worst
                ? t('{0} — ₹{1} Cr against a ₹{2} Cr target.', t(collectionGap.worst.district), collectionGap.worst.actualCr.toLocaleString('en-IN'), collectionGap.worst.targetCr.toLocaleString('en-IN'))
                : t('Widen the filter to compare formations.')}
            />
            <MiniStat
              label={t('Est. Exposure — Non-Filers')}
              value={t('₹{0} Cr', nonFilerExposureCr.toLocaleString('en-IN'))}
              basis={t('{0} non-filers of {1} taxpayers in scope.', nonFilerCount, filteredTaxpayers.length.toLocaleString('en-IN'))}
            />
            <MiniStat
              label={t('Audit Recovery Pipeline')}
              value={t('₹{0} Cr', kpis.auditRecoveryPipelineCr.toLocaleString('en-IN'))}
              basis={t('Booked across {0} districts in scope.', collectionGap.districtCount)}
            />
          </div>
        </Card>

        {/* Audit & Enforcement Pipeline */}
        <Card
          title={t('Audit & Enforcement Pipeline')}
          subtitle={isFilteredView ? t('{0} cases matching filters', filteredAuditCasesFull.length) : t('{0} cases statewide', filteredAuditCasesFull.length)}
          actions={<span className="inline-flex items-center gap-1 text-[11px] font-medium text-steel-400"><Activity className="w-3.5 h-3.5" /> {t('live')}</span>}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat
              label={t('Sanctioned Exposure')}
              value={t('₹{0} Cr', auditPipeline.sanctionedExposureCr.toLocaleString('en-IN'))}
              basis={t('Across {0} cases in scope.', filteredAuditCasesFull.length)}
            />
            <MiniStat
              label={t('Critical Risk')}
              value={auditPipeline.atRiskCount}
              basis={filteredAuditCasesFull.length ? t('{0}% of the queue.', Math.round((auditPipeline.atRiskCount / filteredAuditCasesFull.length) * 100)) : t('No cases in scope.')}
            />
            <MiniStat
              label={t('Delayed (>180d)')}
              value={auditPipeline.delayedCount}
              basis={filteredAuditCasesFull.length ? t('{0}% still open past six months.', Math.round((auditPipeline.delayedCount / filteredAuditCasesFull.length) * 100)) : t('No cases in scope.')}
              tone={auditPipeline.delayedCount > 0 ? 'amber' : undefined}
            />
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
            {auditPipeline.highestRisk.length === 0 && (
              <div className="text-xs text-steel-500 py-3 text-center">{t('No audit cases match the current filters.')}</div>
            )}
          </div>
        </Card>
      </div>

      {/* Revenue & Compliance Health Index — weighted composite, disclosed not hidden */}
      <Card
        className="mb-5"
        title={t('Revenue & Compliance Health Index')}
        subtitle={<MethodNote short={t('Weighted composite across six indicators, with the largest drag named.')} full={t('Weighted composite across six indicators — the single number leadership tracks period to period, with the component carrying the largest drag named rather than left to be found.')} />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center gap-3 lg:border-r lg:border-steel-100 lg:pr-6">
            <ScoreGauge score={healthIndex.composite} label={t('Composite score')} />
            <p className="text-[11.5px] text-steel-600 leading-relaxed text-center">
              {t('Largest drag: {0}, scoring {1}. It costs the composite {2} points — more than any other component, because weight and shortfall both count.',
                t(healthIndex.drag.axis), healthIndex.drag.score, healthIndex.drag.lost)}
            </p>
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

        {/* Matters requiring attention */}
        <Card
          className="lg:col-span-2"
          title={t('Matters Requiring Attention')}
          subtitle={t('The {0} highest-scoring of {1} open alerts, each carrying the action it recommends', priorityAlerts.length, filteredOpenAlerts.length)}
        >
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {priorityAlerts.map(a => {
              const category = riskCategoryFromScore(a.riskScore)
              const sev = category === 'Critical' ? { tone: 'red', label: t('Critical') } : { tone: 'amber', label: t('High') }
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedTaxpayer(TAXPAYERS.find(tp => tp.id === a.taxpayerId))}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-steel-200 hover:border-navy-300 hover:bg-navy-50/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Pill tone={sev.tone}>{t(sev.label)}</Pill>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-steel-400">{t(a.type)}</span>
                  </div>
                  <div className="text-xs font-semibold text-navy-900">{a.tradeName} · {t(a.district)}</div>
                  <p className="text-[11px] text-steel-500 mt-0.5 leading-snug">{t(a.recommendedAction)}</p>
                </button>
              )
            })}
            {priorityAlerts.length === 0 && <div className="text-xs text-steel-500 py-4 text-center">{t('No open high-risk alerts.')}</div>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* District heatmap */}
        <Card
          className="lg:col-span-2"
          title={t('District Risk Heatmap')}
          subtitle={t('Shaded by count of High/Critical-risk taxpayers, with each district’s collection gap beneath — click a district for detail')}
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
            {filteredDistrictRevenue.length === 0 && (
              <div className="col-span-full text-xs text-steel-500 py-6 text-center">{t('No district matches the current filters.')}</div>
            )}
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

      {/* Top risk clusters table */}
      <Card
        title={t('Top 10 Highest-Risk Taxpayers')}
        subtitle={<MethodNote short={t('Risk rank is not work order — the statutory clock decides.')} full={t('Risk rank is not work order. The statutory clock and the value lost by waiting a week are shown beside the score, because a high score with eighty days on the clock can wait and a lower one expiring on Friday cannot.')} />}
        className="mb-5"
        actions={topRiskTaxpayers.some(tp => tp.risk.category === 'High' || tp.risk.category === 'Critical')
          ? <div className="flex items-center gap-2">
            <HumanReviewBadge />
            <button
              onClick={() => setActiveModule('case-priority')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy-700 hover:underline whitespace-nowrap"
            >
              {t('Open work order')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          : null}
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

      <Modal
        open={!!selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
        size="md"
        title={t(selectedDistrict?.district)}
        subtitle={t(selectedDistrict?.division)}
      >
        {selectedDistrict && (
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label={t('Target Collection')} value={t('₹{0} Cr', selectedDistrict.targetCr.toLocaleString('en-IN'))} />
            <MiniStat label={t('Actual Collection')} value={t('₹{0} Cr', selectedDistrict.actualCr.toLocaleString('en-IN'))} />
            <MiniStat label={t('Collection Gap')} value={`${selectedDistrict.gapPct >= 0 ? '+' : ''}${selectedDistrict.gapPct}%`} />
            <MiniStat label={t('High/Critical Risk Taxpayers')} value={selectedDistrict.riskTaxpayers} />
            <MiniStat label={t('Non-Filers')} value={selectedDistrict.nonFilers} />
            <MiniStat label={t('Audit Recovery')} value={t('₹{0} Cr', selectedDistrict.auditRecoveryCr)} />
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
  const st = TONE_STYLES[tone] || TONE_STYLES.steel
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ backgroundColor: st.bg, borderColor: st.border }}>
      <span className="p-2 rounded-lg shrink-0" style={{ backgroundColor: st.iconBg, color: st.accent }}><Icon className="w-4 h-4" /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium" style={{ color: st.accent }}>{label}</span>
          <span className="text-base font-bold tabular-nums" style={{ color: st.accent }}>{value}</span>
        </div>
        <div className="text-[10.5px] text-steel-500">{sub}</div>
      </div>
    </div>
  )
}

/* A figure with no base beneath it is a number, not a parameter. `basis` is
 * where the denominator, the comparator or the caveat goes — it is optional
 * only so the modal can reuse the same tile for figures that are already
 * self-describing. */
function MiniStat({ label, value, basis, tone }) {
  const st = tone ? (TONE_STYLES[tone] || TONE_STYLES.steel) : null
  return (
    <div
      className={`px-3 py-2.5 rounded-lg border ${st ? '' : 'border-steel-200 bg-steel-50'}`}
      style={st ? { backgroundColor: st.bg, borderColor: st.border } : undefined}
    >
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${st ? '' : 'text-navy-900'}`} style={st ? { color: st.accent } : undefined}>{value}</div>
      {basis && <div className="text-[10.5px] text-steel-500 leading-snug mt-1">{basis}</div>}
    </div>
  )
}
