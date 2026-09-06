import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { TrendLineChart, RiskBarChart } from '../components/ui/Charts.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { WhyFlaggedPanel } from '../components/ui/WhyFlagged.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS, DISTRICT_REVENUE, SECTOR_REVENUE, STATE_REVENUE_TREND, sliceTrendByDateRange } from '../data/mockData.js'
import { t } from '../i18n/index.js'
import {
  Landmark, TrendingDown, TrendingUp, MapPinOff, Factory, Eye,
  AlertOctagon, FileX2, Clock3, BarChart3
} from 'lucide-react'

const HIGH_TURNOVER_THRESHOLD = 3500000 // ₹35L monthly

function buildMonths(count) {
  const arr = []
  let y = 2024, m = 8
  for (let i = 0; i < count; i++) {
    arr.push(new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' }))
    m++
    if (m > 12) { m = 1; y++ }
  }
  return arr
}

const INDICATORS = [
  {
    key: 'suddenFall',
    label: 'Sudden Fall in Tax Payment',
    icon: TrendingDown,
    tone: 'red',
    test: t => t.revenueDropPct > 25,
    action: 'Recommend desk review of last 3 filed returns and comparison against sector trend.'
  },
  {
    key: 'turnoverGrowth',
    label: 'Turnover Growth, Tax Decline',
    icon: AlertOctagon,
    tone: 'orange',
    test: t => t.monthlyTurnover > HIGH_TURNOVER_THRESHOLD && t.revenueDropPct > 15,
    action: 'Recommend reconciliation of turnover growth against tax payment trend; verify for possible under-reporting of taxable value.'
  },
  {
    key: 'nonFiler',
    label: 'Nil-Return / Non-Filer Risk',
    icon: FileX2,
    tone: 'red',
    test: t => t.filingStatus === 'Non-Filer',
    action: 'Recommend automated reminder escalation to Division Officer; consider provisional assessment if non-filing persists beyond statutory window.'
  },
  {
    key: 'lateFiler',
    label: 'Late Filing Impact',
    icon: Clock3,
    tone: 'saffron',
    test: t => t.filingStatus === 'Late Filer',
    action: 'Recommend monitoring for chronic late-filing pattern; flag for compliance nudge and interest/late-fee computation review.'
  }
]

export default function RevenueIntelligence() {
  const { filters } = useApp()
  const [activeIndicator, setActiveIndicator] = useState(null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  // ---- Filtered datasets (respect global header filters) ----
  const filteredDistricts = useMemo(() => DISTRICT_REVENUE.filter(d => {
    if (filters.district !== 'All Districts' && d.district !== filters.district) return false
    if (filters.division !== 'All Divisions' && d.division !== filters.division) return false
    return true
  }), [filters])

  const filteredSectors = useMemo(() => SECTOR_REVENUE.filter(s => {
    if (filters.sector !== 'All Sectors' && s.sector !== filters.sector) return false
    return true
  }), [filters])

  const filteredTaxpayers = useMemo(() => TAXPAYERS.filter(t => applyGlobalFilters(t, filters)), [filters])

  const filteredTrend = useMemo(() => sliceTrendByDateRange(STATE_REVENUE_TREND, filters.dateRange), [filters.dateRange])

  // STATE_REVENUE_TREND has no per-district breakdown, so once a district or division
  // is picked, totals must come from the district-level dataset (which does carry that
  // breakdown) instead of silently staying pinned to the full-state trend figures.
  const districtScoped = filters.district !== 'All Districts' || filters.division !== 'All Divisions'

  // ---- KPI derivations ----
  const totalRevenueCr = useMemo(
    () => districtScoped ? filteredDistricts.reduce((s, d) => s + d.actualCr, 0) : filteredTrend.reduce((s, m) => s + m.actual, 0),
    [districtScoped, filteredDistricts, filteredTrend]
  )
  const totalTargetCr = useMemo(
    () => districtScoped ? filteredDistricts.reduce((s, d) => s + d.targetCr, 0) : filteredTrend.reduce((s, m) => s + m.target, 0),
    [districtScoped, filteredDistricts, filteredTrend]
  )
  const revenueGapCr = totalRevenueCr - totalTargetCr
  const revenueGapPct = totalTargetCr ? Math.round((revenueGapCr / totalTargetCr) * 1000) / 10 : 0
  const districtsInDeficit = filteredDistricts.filter(d => d.gapPct < 0).length

  const sectorDeclineCount = useMemo(() => {
    let count = 0
    filteredSectors.forEach(s => {
      const members = filteredTaxpayers.filter(t => t.sector === s.sector)
      if (members.length === 0) return
      const avgDrop = members.reduce((sum, t) => sum + t.revenueDropPct, 0) / members.length
      if (avgDrop > 15) count++
    })
    return count
  }, [filteredSectors, filteredTaxpayers])

  // ---- Leakage indicator counts ----
  const indicatorCounts = useMemo(() => {
    const out = {}
    INDICATORS.forEach(ind => { out[ind.key] = filteredTaxpayers.filter(ind.test).length })
    return out
  }, [filteredTaxpayers])

  const abnormalTaxpayers = useMemo(() => {
    if (activeIndicator) {
      const ind = INDICATORS.find(i => i.key === activeIndicator)
      return filteredTaxpayers.filter(ind.test)
    }
    return filteredTaxpayers.filter(t => INDICATORS.some(ind => ind.test(t)))
  }, [filteredTaxpayers, activeIndicator])

  const primaryIndicatorFor = t => INDICATORS.find(ind => ind.test(t))

  // ---- Forecast (illustrative) ----
  const forecastMonths = useMemo(() => buildMonths(27).slice(24), [])
  const last6 = STATE_REVENUE_TREND.slice(-6)
  const avgActualDelta = (last6.at(-1).actual - last6[0].actual) / (last6.length - 1)
  const avgTargetDelta = (last6.at(-1).target - last6[0].target) / (last6.length - 1)
  const forecastPoints = forecastMonths.map((month, i) => ({
    month: `${month} (F)`,
    forecastActual: Math.round(STATE_REVENUE_TREND.at(-1).actual + avgActualDelta * (i + 1)),
    forecastTarget: Math.round(STATE_REVENUE_TREND.at(-1).target + avgTargetDelta * (i + 1))
  }))
  const recentReal = STATE_REVENUE_TREND.slice(-9).map(d => ({ month: d.month, actual: d.actual, target: d.target }))
  const forecastChartData = [
    ...recentReal.slice(0, -1),
    { ...recentReal.at(-1), forecastActual: recentReal.at(-1).actual, forecastTarget: recentReal.at(-1).target },
    ...forecastPoints
  ]

  // ---- Table columns ----
  const columns = [
    { key: 'gstin', label: t('GSTIN') },
    { key: 'tradeName', label: t('Trade Name') },
    { key: 'district', label: t('District'), render: r => t(r.district) },
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    { key: 'monthlyTurnover', label: t('Turnover'), align: 'right', render: r => `₹${(r.monthlyTurnover / 100000).toFixed(1)}L` },
    { key: 'taxPaid', label: t('Tax Paid'), align: 'right', render: r => `₹${(r.taxPaid / 100000).toFixed(1)}L` },
    { key: 'revenueDropPct', label: t('Revenue Drop %'), align: 'right', render: r => `${r.revenueDropPct}%` },
    { key: 'risk', label: t('Risk'), align: 'right', sortValue: r => r.risk.score, render: r => <RiskBadge category={r.risk.category} score={r.risk.score} /> },
    { key: 'view', label: '', align: 'right', sortable: false, render: r => (
      <button
        onClick={e => { e.stopPropagation(); setSelectedTaxpayer(r) }}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-navy-900"
      >
        <Eye className="w-3.5 h-3.5" /> {t('View')}
      </button>
    ) }
  ]

  const sectorBarData = filteredSectors.map(s => ({ sector: s.sector, revenueLakh: s.revenueLakh }))
  const districtBarData = filteredDistricts.map(d => ({ district: d.district, actualCr: d.actualCr }))

  return (
    <div>
      <SectionHeader
        eyebrow={t('Revenue Assurance')}
        title={t('Revenue Intelligence')}
        description={t('Statewide revenue assurance engine — tracks collection performance against target, surfaces leakage indicators and forecasts near-term risk to state GST revenue.')}
        actions={<ExportBar />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Total Revenue Monitored')} value={totalRevenueCr.toLocaleString('en-IN')} unit="₹ Cr" tone="navy" icon={Landmark} />
        <KpiCard
          label={t('Revenue Gap vs Target')}
          value={`${revenueGapCr >= 0 ? '+' : ''}${revenueGapCr.toLocaleString('en-IN')}`}
          unit="₹ Cr"
          trend={revenueGapPct}
          trendLabel={t('vs cumulative target')}
          tone={revenueGapCr >= 0 ? 'green' : 'red'}
          icon={revenueGapCr >= 0 ? TrendingUp : TrendingDown}
        />
        <KpiCard label={t('Districts in Deficit')} value={districtsInDeficit} unit={t('of {0}', filteredDistricts.length)} tone="saffron" icon={MapPinOff} />
        <KpiCard label={t('Sectors with Tax Decline')} value={sectorDeclineCount} unit={t('of {0}', filteredSectors.length)} tone="steel" icon={Factory} />
      </div>

      {/* Monthly trend */}
      <Card
        title={t('Monthly Revenue Trend')}
        subtitle={districtScoped
          ? t('State GST collection — target vs actual (₹ Cr) — {0} · statewide trend, not filtered by district/division', t(filters.dateRange))
          : t('State GST collection — target vs actual (₹ Cr) — {0}', t(filters.dateRange))}
        className="mb-5"
      >
        <TrendLineChart
          data={filteredTrend}
          xKey="month"
          series={[
            { key: 'target', label: t('Target (₹ Cr)'), color: '#8791a3', dashed: true },
            { key: 'actual', label: t('Actual (₹ Cr)'), color: '#204575' }
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title={t('District-Wise Revenue Collection')} subtitle={t('Actual collection by district (₹ Cr) — respects global filters')}>
          <RiskBarChart data={districtBarData} xKey="district" barKey="actualCr" colorFn={() => '#204575'} />
        </Card>
        <Card title={t('Sector-Wise Revenue Performance')} subtitle={t('Tax collected by sector (₹ Lakh) — respects global filters')}>
          <RiskBarChart data={sectorBarData} xKey="sector" barKey="revenueLakh" colorFn={() => '#f78c0a'} />
        </Card>
      </div>

      {/* Forecast */}
      <Card
        title={t('Forecasted Revenue Risk — Next Quarter')}
        subtitle={t('Forecast (Illustrative) — naive trend-based projection for next 3 months')}
        className="mb-5"
      >
        <TrendLineChart
          data={forecastChartData}
          xKey="month"
          series={[
            { key: 'target', label: t('Target (₹ Cr)'), color: '#8791a3', dashed: true },
            { key: 'actual', label: t('Actual (₹ Cr)'), color: '#204575' },
            { key: 'forecastActual', label: t('Forecast (Illustrative)'), color: '#f78c0a', dashed: true }
          ]}
        />
        <p className="text-[11px] text-steel-500 mt-2">
          {t('Forecast values are an illustrative linear projection derived from the trailing 6-month collection trend. They are not an official revenue projection and must not be used for budgetary commitment.')}
        </p>
      </Card>

      {/* Leakage indicators */}
      <Card title={t('Revenue Leakage Indicators')} subtitle={t('Click an indicator to filter the abnormal-behaviour register below')} className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INDICATORS.map(ind => {
            const Icon = ind.icon
            const isActive = activeIndicator === ind.key
            const tone = TONE_STYLES[ind.tone] || TONE_STYLES.steel
            return (
              <button
                key={ind.key}
                onClick={() => setActiveIndicator(cur => cur === ind.key ? null : ind.key)}
                style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.accent }}
                className={`text-left rounded-xl border p-3.5 transition-all ${isActive ? 'ring-2 ring-navy-400 -translate-y-0.5 shadow-panel' : 'hover:-translate-y-0.5 hover:shadow-panel'}`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4" />
                  {isActive && <span className="text-[10px] font-bold uppercase tracking-wide">{t('Active Filter')}</span>}
                </div>
                <div className="text-2xl font-bold mt-2 tabular-nums">{indicatorCounts[ind.key]}</div>
                <div className="text-[11px] font-medium mt-0.5 leading-snug">{t(ind.label)}</div>
              </button>
            )
          })}
        </div>
        {activeIndicator && (
          <button onClick={() => setActiveIndicator(null)} className="mt-3 text-[11px] font-semibold text-navy-600 hover:text-navy-800">{t('Clear filter — show all abnormal-behaviour taxpayers')}</button>
        )}
      </Card>

      {/* Abnormal behaviour table */}
      <Card
        title={t('Taxpayers with Abnormal Revenue Behaviour')}
        subtitle={activeIndicator ? t('Filtered by: {0}', t(INDICATORS.find(i => i.key === activeIndicator).label)) : t('All revenue-leakage indicators (union)')}
        actions={<span className="inline-flex items-center gap-1 text-[11px] text-steel-500"><BarChart3 className="w-3.5 h-3.5" /> {t('{0} matched', abnormalTaxpayers.length)}</span>}
      >
        <DataTable
          columns={columns}
          rows={abnormalTaxpayers}
          onRowClick={row => setSelectedTaxpayer(row)}
          searchPlaceholder={t('Search GSTIN / trade name...')}
        />
      </Card>

      {/* Drilldown modal */}
      <Modal
        open={!!selectedTaxpayer}
        onClose={() => setSelectedTaxpayer(null)}
        size="lg"
        title={selectedTaxpayer?.tradeName}
        subtitle={selectedTaxpayer?.gstin}
      >
        {selectedTaxpayer && (
          <div className="space-y-4">
            <WhyFlaggedPanel taxpayer={selectedTaxpayer} />
            <div className="rounded-xl border border-navy-200 bg-navy-50/60 p-4">
              <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide mb-1.5">{t('Suggested Officer Action')}</div>
              <p className="text-sm text-navy-800">
                {(() => {
                  const action = (primaryIndicatorFor(selectedTaxpayer) || {}).action
                  return action ? t(action) : t('No specific leakage indicator triggered — routine monitoring recommended.')
                })()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
