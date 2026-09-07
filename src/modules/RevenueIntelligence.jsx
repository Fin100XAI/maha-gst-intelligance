import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { TrendLineChart, RiskBarChart } from '../components/ui/Charts.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { WhyFlaggedPanel } from '../components/ui/WhyFlagged.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS, DISTRICT_REVENUE, SECTOR_REVENUE, STATE_REVENUE_TREND, sliceTrendByDateRange } from '../data/mockData.js'
import { t } from '../i18n/index.js'
import {
  TrendingDown, TrendingUp, MapPinOff, Factory, Eye,
  AlertOctagon, FileX2, Clock3, BarChart3, Target, Database, Scale
} from 'lucide-react'

const HIGH_TURNOVER_THRESHOLD = 3500000 // ₹35L monthly

// Share of the total shortfall the concentration figure is measured at. Eighty
// per cent is the conventional Pareto cut and is stated on screen rather than
// left implicit, because the count means nothing without it.
const CONCENTRATION_SHARE = 80

const inr = n => Math.round(n).toLocaleString('en-IN')
const crore = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)}L`

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

/* Leakage indicators.
 *
 * The callback parameter is deliberately `tp`, never `t` — `t` is the
 * translator imported above, and a callback named `t` shadows it silently.
 */
const INDICATORS = [
  {
    key: 'suddenFall',
    label: 'Sudden Fall in Tax Payment',
    icon: TrendingDown,
    tone: 'red',
    test: tp => tp.revenueDropPct > 25,
    action: 'Recommend desk review of last 3 filed returns and comparison against sector trend.'
  },
  {
    key: 'turnoverGrowth',
    label: 'Turnover Growth, Tax Decline',
    icon: AlertOctagon,
    tone: 'orange',
    test: tp => tp.monthlyTurnover > HIGH_TURNOVER_THRESHOLD && tp.revenueDropPct > 15,
    action: 'Recommend reconciliation of turnover growth against tax payment trend; verify for possible under-reporting of taxable value.'
  },
  {
    key: 'nonFiler',
    label: 'Nil-Return / Non-Filer Risk',
    icon: FileX2,
    tone: 'red',
    test: tp => tp.filingStatus === 'Non-Filer',
    action: 'Recommend automated reminder escalation to Division Officer; consider provisional assessment if non-filing persists beyond statutory window.'
  },
  {
    key: 'lateFiler',
    label: 'Late Filing Impact',
    icon: Clock3,
    tone: 'saffron',
    test: tp => tp.filingStatus === 'Late Filer',
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

  const filteredTaxpayers = useMemo(() => TAXPAYERS.filter(tp => applyGlobalFilters(tp, filters)), [filters])

  const filteredTrend = useMemo(() => sliceTrendByDateRange(STATE_REVENUE_TREND, filters.dateRange), [filters.dateRange])

  // STATE_REVENUE_TREND has no per-district breakdown, so once a district or division
  // is picked, totals must come from the district-level dataset (which does carry that
  // breakdown) instead of silently staying pinned to the full-state trend figures.
  const districtScoped = filters.district !== 'All Districts' || filters.division !== 'All Divisions'

  // ---- Collection against target ----
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
  const achievementPct = totalTargetCr ? Math.round((totalRevenueCr / totalTargetCr) * 1000) / 10 : 0

  // The two totals above are measured on different bases, so the basis has to
  // travel with the figure. A cumulative 12-month trend total and a
  // current-period district ledger are not the same denominator and must never
  // read as though they were.
  const basisNote = districtScoped
    ? t('₹{0} Cr of ₹{1} Cr — district ledger, current collection period', inr(totalRevenueCr), inr(totalTargetCr))
    : t('₹{0} Cr of ₹{1} Cr over {2} months', inr(totalRevenueCr), inr(totalTargetCr), filteredTrend.length)

  /* ---- Shortfall attribution -------------------------------------------
   * A statewide gap is not a decision. Which districts carry it, and how few
   * of them carry most of it, is. Cumulative share is what turns the ledger
   * into a deployment answer.
   * -------------------------------------------------------------------- */
  const shortfall = useMemo(() => {
    const deficits = filteredDistricts
      .filter(d => d.actualCr < d.targetCr)
      .map(d => ({ ...d, id: d.district, shortfallCr: d.targetCr - d.actualCr }))
      .sort((a, b) => b.shortfallCr - a.shortfallCr)
    const total = deficits.reduce((s, d) => s + d.shortfallCr, 0)
    let cum = 0
    const rows = deficits.map(d => {
      cum += d.shortfallCr
      return {
        ...d,
        sharePct: total ? Math.round((d.shortfallCr / total) * 1000) / 10 : 0,
        cumPct: total ? Math.round((cum / total) * 100) : 0,
        // Audit recovery booked in the district, against the gap it has to close.
        recoveryCoverPct: d.targetCr - d.actualCr > 0
          ? Math.round((d.auditRecoveryCr / (d.targetCr - d.actualCr)) * 100)
          : 0
      }
    })
    const idx = rows.findIndex(r => r.cumPct >= CONCENTRATION_SHARE)
    return {
      rows,
      totalShortfallCr: total,
      concentrationCount: idx >= 0 ? idx + 1 : rows.length,
      recoveryCr: rows.reduce((s, d) => s + d.auditRecoveryCr, 0)
    }
  }, [filteredDistricts])

  /* ---- Sector collection against its own benchmark ----------------------
   * Absolute revenue by sector says only which sectors are large. The figure
   * that decides anything is the tax-to-turnover ratio actually realised by
   * the taxpayers in view against the sector's own reference ratio.
   * -------------------------------------------------------------------- */
  const sectorPerformance = useMemo(() => filteredSectors.map(s => {
    const members = filteredTaxpayers.filter(tp => tp.sector === s.sector)
    const turnover = members.reduce((sum, tp) => sum + tp.monthlyTurnover, 0)
    const tax = members.reduce((sum, tp) => sum + tp.taxPaid, 0)
    const realisedRatio = turnover ? tax / turnover : null
    return {
      id: s.sector,
      sector: s.sector,
      memberCount: members.length,
      turnover,
      tax,
      benchmarkRatio: s.avgTaxRatio,
      realisedRatio,
      deviationPct: realisedRatio === null ? null : Math.round(((realisedRatio - s.avgTaxRatio) / s.avgTaxRatio) * 1000) / 10,
      // Arithmetic gap only — the shortfall against the reference ratio at the
      // turnover the taxpayers themselves declared. Not an assessed liability.
      benchmarkGapRupees: realisedRatio === null ? 0 : Math.max(0, Math.round((s.avgTaxRatio - realisedRatio) * turnover)),
      avgDropPct: members.length ? Math.round(members.reduce((sum, tp) => sum + tp.revenueDropPct, 0) / members.length) : null,
      highRiskCount: members.filter(tp => tp.risk.category === 'High' || tp.risk.category === 'Critical').length
    }
  }).sort((a, b) => b.benchmarkGapRupees - a.benchmarkGapRupees), [filteredSectors, filteredTaxpayers])

  const sectorsBelowBenchmark = sectorPerformance.filter(s => s.realisedRatio !== null && s.realisedRatio < s.benchmarkRatio).length
  const sectorsWithMembers = sectorPerformance.filter(s => s.memberCount > 0).length

  // ---- Leakage indicators: a count is not actionable without its value ----
  const indicatorStats = useMemo(() => {
    const out = {}
    const exposureAll = filteredTaxpayers.reduce((s, tp) => s + tp.estimatedRevenueExposure, 0)
    INDICATORS.forEach(ind => {
      const matched = filteredTaxpayers.filter(ind.test)
      const exposure = matched.reduce((s, tp) => s + tp.estimatedRevenueExposure, 0)
      out[ind.key] = {
        count: matched.length,
        exposure,
        sharePct: filteredTaxpayers.length ? Math.round((matched.length / filteredTaxpayers.length) * 100) : 0,
        exposureSharePct: exposureAll ? Math.round((exposure / exposureAll) * 100) : 0
      }
    })
    return out
  }, [filteredTaxpayers])

  const abnormalTaxpayers = useMemo(() => {
    if (activeIndicator) {
      const ind = INDICATORS.find(i => i.key === activeIndicator)
      return filteredTaxpayers.filter(ind.test)
    }
    return filteredTaxpayers.filter(tp => INDICATORS.some(ind => ind.test(tp)))
  }, [filteredTaxpayers, activeIndicator])

  const abnormalExposure = useMemo(
    () => abnormalTaxpayers.reduce((s, tp) => s + tp.estimatedRevenueExposure, 0),
    [abnormalTaxpayers]
  )

  const primaryIndicatorFor = tp => INDICATORS.find(ind => ind.test(tp))

  // ---- Forecast (illustrative, statewide) ----
  const forecast = useMemo(() => {
    const forecastMonths = buildMonths(27).slice(24)
    const last6 = STATE_REVENUE_TREND.slice(-6)
    const avgActualDelta = (last6.at(-1).actual - last6[0].actual) / (last6.length - 1)
    const avgTargetDelta = (last6.at(-1).target - last6[0].target) / (last6.length - 1)
    const points = forecastMonths.map((month, i) => ({
      /* The (F) marks a forecast point on the axis; it is a label an officer
         reads, so it goes through the translator like any other. */
      month: t('{0} (F)', month),
      forecastActual: Math.round(STATE_REVENUE_TREND.at(-1).actual + avgActualDelta * (i + 1)),
      forecastTarget: Math.round(STATE_REVENUE_TREND.at(-1).target + avgTargetDelta * (i + 1))
    }))
    const recentReal = STATE_REVENUE_TREND.slice(-9).map(d => ({ month: d.month, actual: d.actual, target: d.target }))
    return {
      chartData: [
        ...recentReal.slice(0, -1),
        { ...recentReal.at(-1), forecastActual: recentReal.at(-1).actual, forecastTarget: recentReal.at(-1).target },
        ...points
      ],
      // The one number the forecast exists to produce: the cumulative gap it
      // projects over the quarter, on the same trend the department is on now.
      projectedGapCr: Math.round(points.reduce((s, p) => s + (p.forecastActual - p.forecastTarget), 0)),
      monthCount: points.length
    }
  }, [])

  // ---- Table columns ----
  const columns = [
    {
      key: 'tradeName',
      label: t('Taxpayer'),
      render: r => (
        <div>
          <div className="font-semibold text-navy-800">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.gstin} · {t(r.district)}</div>
        </div>
      )
    },
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    {
      key: 'indicator',
      label: t('Leading Indicator'),
      sortValue: r => (primaryIndicatorFor(r) || {}).label || '',
      render: r => {
        const ind = primaryIndicatorFor(r)
        return <span className="text-[11px] text-steel-600">{ind ? t(ind.label) : '—'}</span>
      }
    },
    { key: 'monthlyTurnover', label: t('Turnover'), align: 'right', render: r => lakh(r.monthlyTurnover) },
    { key: 'taxPaid', label: t('Tax Paid'), align: 'right', render: r => lakh(r.taxPaid) },
    { key: 'revenueDropPct', label: t('Revenue Drop %'), align: 'right', render: r => `${r.revenueDropPct}%` },
    {
      key: 'estimatedRevenueExposure',
      label: t('Revenue Exposed'),
      align: 'right',
      sortValue: r => r.estimatedRevenueExposure,
      render: r => <span className="font-semibold tabular-nums text-navy-800">{lakh(r.estimatedRevenueExposure)}</span>
    },
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

  const shortfallColumns = [
    { key: 'district', label: t('District'), render: r => (
      <div>
        <div className="font-semibold text-navy-800">{t(r.district)}</div>
        <div className="text-[11px] text-steel-500">{t(r.division)}</div>
      </div>
    ) },
    { key: 'targetCr', label: t('Target'), align: 'right', render: r => `₹${inr(r.targetCr)}` },
    { key: 'actualCr', label: t('Actual'), align: 'right', render: r => `₹${inr(r.actualCr)}` },
    {
      key: 'shortfallCr',
      label: t('Shortfall (₹ Cr)'),
      align: 'right',
      sortValue: r => r.shortfallCr,
      render: r => <span className="font-bold tabular-nums text-maharisk-critical">−₹{inr(r.shortfallCr)}</span>
    },
    { key: 'gapPct', label: t('Gap %'), align: 'right', sortValue: r => r.gapPct, render: r => <span className="tabular-nums text-maharisk-critical">{r.gapPct}%</span> },
    { key: 'sharePct', label: t('Share of Shortfall'), align: 'right', sortValue: r => r.sharePct, render: r => `${r.sharePct}%` },
    { key: 'cumPct', label: t('Cumulative'), align: 'right', sortValue: r => r.cumPct, render: r => <span className="tabular-nums text-steel-600">{r.cumPct}%</span> },
    {
      key: 'auditRecoveryCr',
      label: t('Audit Recovery'),
      align: 'right',
      sortValue: r => r.auditRecoveryCr,
      render: r => (
        <div className="text-right">
          <div className="font-semibold tabular-nums text-maharisk-low">₹{inr(r.auditRecoveryCr)}</div>
          <div className="text-[10.5px] text-steel-500">{t('covers {0}% of the gap', r.recoveryCoverPct)}</div>
        </div>
      )
    }
  ]

  const sectorColumns = [
    { key: 'sector', label: t('Sector'), render: r => (
      <div>
        <div className="font-semibold text-navy-800">{t(r.sector)}</div>
        <div className="text-[11px] text-steel-500">{t('{0} taxpayers in view', r.memberCount)}</div>
      </div>
    ) },
    {
      key: 'realisedRatio',
      label: t('Realised Tax Ratio'),
      align: 'right',
      sortValue: r => r.realisedRatio ?? -1,
      render: r => r.realisedRatio === null
        ? <span className="text-steel-400">{t('No taxpayers in view')}</span>
        : <span className="font-semibold tabular-nums text-navy-800">{(r.realisedRatio * 100).toFixed(2)}%</span>
    },
    { key: 'benchmarkRatio', label: t('Sector Benchmark'), align: 'right', sortValue: r => r.benchmarkRatio, render: r => <span className="tabular-nums text-steel-600">{(r.benchmarkRatio * 100).toFixed(1)}%</span> },
    {
      key: 'deviationPct',
      label: t('Deviation'),
      align: 'right',
      sortValue: r => r.deviationPct ?? 0,
      render: r => r.deviationPct === null
        ? '—'
        : <span className={`font-bold tabular-nums ${r.deviationPct < 0 ? 'text-maharisk-critical' : 'text-maharisk-low'}`}>{r.deviationPct > 0 ? '+' : ''}{r.deviationPct}%</span>
    },
    {
      key: 'benchmarkGapRupees',
      label: t('Monthly Gap to Benchmark'),
      align: 'right',
      sortValue: r => r.benchmarkGapRupees,
      render: r => r.benchmarkGapRupees > 0
        ? <span className="font-semibold tabular-nums text-maharisk-high">{crore(r.benchmarkGapRupees)}</span>
        : <span className="text-steel-400">—</span>
    },
    { key: 'avgDropPct', label: t('Avg Revenue Drop'), align: 'right', sortValue: r => r.avgDropPct ?? 0, render: r => r.avgDropPct === null ? '—' : `${r.avgDropPct}%` },
    { key: 'highRiskCount', label: t('High / Critical'), align: 'right', sortValue: r => r.highRiskCount, render: r => <span className="tabular-nums">{r.highRiskCount}</span> }
  ]

  const districtVarianceData = filteredDistricts.map(d => ({ district: d.district, gapPct: d.gapPct }))

  const briefingText = () => [
    t('REVENUE INTELLIGENCE — COLLECTION AGAINST TARGET'),
    t('Scope: {0} · {1} · {2} · {3}', t(filters.district), t(filters.division), t(filters.sector), t(filters.dateRange)),
    t('Collection: {0} ({1}% of target).', basisNote, achievementPct),
    t('Gap against target: ₹{0} Cr ({1}%).', inr(revenueGapCr), revenueGapPct),
    t('Current-period district ledger: ₹{0} Cr of shortfall across {1} districts; {2} of them carry {3}% of it. Audit recovery booked in those districts: ₹{4} Cr.',
      inr(shortfall.totalShortfallCr), shortfall.rows.length, shortfall.concentrationCount, CONCENTRATION_SHARE, inr(shortfall.recoveryCr)),
    t('{0} of {1} sectors in view are collecting below their own tax-to-turnover benchmark.', sectorsBelowBenchmark, sectorsWithMembers),
    t('{0} taxpayers carry a revenue-leakage indicator, with {1} of estimated revenue exposed.', abnormalTaxpayers.length, crore(abnormalExposure)),
    t('Collection is not split by tax head — CGST, SGST, IGST and Cess are not held in this platform.')
  ].join('\n')

  return (
    <div>
      <SectionHeader
        eyebrow={t('Revenue Assurance')}
        title={t('Revenue Intelligence')}
        description={<MethodNote short={t('Collection against target, leakage indicators, and near-term risk.')} full={t('Statewide revenue assurance engine — tracks collection performance against target, surfaces leakage indicators and forecasts near-term risk to state GST revenue.')} />}
        actions={<ExportBar moduleLabel="Revenue Intelligence" getBriefingText={briefingText} />}
      />

      {/* The gap, stated once, with whose it is. */}
      <div className="mb-6 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('What this screen decides')}</div>
        <h2 className="text-lg sm:text-xl font-bold text-navy-900 max-w-4xl leading-snug">
          {t('A shortfall is only actionable once you know whose it is.')}
        </h2>
        <p className="text-sm text-steel-600 mt-2 max-w-4xl leading-relaxed">
          {revenueGapCr < 0
            ? t('Collection in view stands at {0}% of target — a shortfall of ₹{1} Cr. On the current-period district ledger, {2} of the {3} districts in deficit carry {4}% of that gap, and {5} of {6} sectors in view are collecting below their own tax-to-turnover benchmark. Those are the two places a recovery effort changes the number.',
              achievementPct, inr(Math.abs(revenueGapCr)), shortfall.concentrationCount, shortfall.rows.length, CONCENTRATION_SHARE, sectorsBelowBenchmark, sectorsWithMembers)
            : t('Collection in view stands at {0}% of target — ahead by ₹{1} Cr. {2} districts are nonetheless in deficit on the current-period ledger and {3} of {4} sectors in view are collecting below their own tax-to-turnover benchmark; a headline surplus does not clear either.',
              achievementPct, inr(revenueGapCr), shortfall.rows.length, sectorsBelowBenchmark, sectorsWithMembers)}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          <Pill tone={achievementPct >= 100 ? 'green' : 'red'}>{basisNote}</Pill>
          <Pill tone="amber">{t('₹{0} Cr shortfall across {1} districts · current period', inr(shortfall.totalShortfallCr), shortfall.rows.length)}</Pill>
          <Pill tone="navy">{t('{0} of {1} taxpayers in view', filteredTaxpayers.length, TAXPAYERS.length)}</Pill>
        </div>
      </div>

      {/* KPI row — every figure with its denominator and its comparator. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Collection Against Target')}
          value={`${achievementPct}%`}
          unit={basisNote}
          tone={achievementPct >= 100 ? 'green' : 'red'}
          icon={Target}
        />
        <KpiCard
          label={t('Revenue Gap vs Target')}
          value={`${revenueGapCr >= 0 ? '+' : ''}${inr(revenueGapCr)}`}
          unit="₹ Cr"
          trend={revenueGapPct}
          trendLabel={t('vs cumulative target')}
          tone={revenueGapCr >= 0 ? 'green' : 'red'}
          icon={revenueGapCr >= 0 ? TrendingUp : TrendingDown}
        />
        <KpiCard
          label={t('Districts Carrying {0}% of the Shortfall', CONCENTRATION_SHARE)}
          value={shortfall.concentrationCount}
          unit={t('of {0} in deficit, {1} in view', shortfall.rows.length, filteredDistricts.length)}
          tone="saffron"
          icon={MapPinOff}
        />
        <KpiCard
          label={t('Sectors Below Their Tax Benchmark')}
          value={sectorsBelowBenchmark}
          unit={t('of {0} sectors with taxpayers in view', sectorsWithMembers)}
          tone="steel"
          icon={Factory}
        />
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

      {/* Variance, not volume — the bar that decides where to send people. */}
      <Card
        title={t('Variance From Target by District')}
        subtitle={<MethodNote short={t('Each district against its own target. Zero is on target.')} full={t('Collection against the district’s own target (%). Zero is on target; bars below the line are the districts a recovery effort has to reach. Absolute collection is in the shortfall ledger below.')} />}
        className="mb-5"
      >
        <RiskBarChart
          data={districtVarianceData}
          xKey="district"
          barKey="gapPct"
          colorFn={d => d.gapPct < 0 ? '#c41e3a' : '#1f8a4c'}
        />
      </Card>

      {/* An explicit unavailable state rather than a silent omission. */}
      <div className="mb-5 rounded-xl border border-dashed border-steel-300 bg-steel-50 px-4 py-3.5 flex items-start gap-2.5">
        <Database className="w-4 h-4 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[12.5px] font-bold text-navy-800">{t('Collection by tax head is not available')}</div>
          <MethodNote className="text-[12px] text-steel-600 mt-1 leading-relaxed max-w-4xl" short={t('Combined tax totals. No split by CGST, SGST, IGST or Cess is held.')} full={t('Every collection figure on this screen is a combined tax total. Splitting it into CGST, SGST, IGST and Cess needs the period return extract (returns_period.csv, GSTN returns), which carries output_tax broken down by head alongside the cash-versus-credit split. Until that feed is connected, the State’s own share of a shortfall cannot be separated from the IGST settlement, and nothing here should be read as an SGST-only figure.')} />
        </div>
      </div>

      {/* Shortfall attribution */}
      <Card
        className="mb-5"
        title={t('Shortfall Attribution — Current-Period District Ledger')}
        subtitle={<MethodNote short={t('Ranked by rupees of shortfall, on the current-period district ledger.')} full={t('Ranked by rupees of shortfall, with the running cumulative share. Targets and actuals are the district ledger for the current collection period, not the cumulative trend above — the two are different denominators and are not added together anywhere on this screen.')} />}
        actions={
          <span className="inline-flex items-center gap-1 text-[11px] text-steel-500">
            <Scale className="w-3.5 h-3.5" /> {t('₹{0} Cr total shortfall', inr(shortfall.totalShortfallCr))}
          </span>
        }
      >
        {shortfall.rows.length === 0 ? (
          <div className="text-xs text-steel-500 px-1 py-6 text-center">{t('No district in view is below its target for the current period.')}</div>
        ) : (
          <>
            <DataTable
              columns={shortfallColumns}
              rows={shortfall.rows}
              searchable={false}
              pageSize={12}
            />
            <MethodNote className="text-[11px] text-steel-500 mt-2.5 leading-relaxed" short={t('Audit recovery already booked against the gap.')} full={t('Audit recovery is what the district has already booked against its gap. Where it covers a small share, the shortfall is a collection problem rather than an enforcement one, and the response differs accordingly.')} />
          </>
        )}
      </Card>

      {/* Sector against its own benchmark */}
      <Card
        className="mb-5"
        title={t('Sector Collection Against Its Own Benchmark Ratio')}
        subtitle={<MethodNote short={t('What taxpayers actually realised, against their sector\'s own ratio.')} full={t('Tax-to-turnover ratio actually realised by the taxpayers in view, against the reference ratio held for that sector. Absolute sector revenue only says which sectors are large; the deviation says which are underpaying relative to what they themselves declared.')} />}
      >
        <DataTable
          columns={sectorColumns}
          rows={sectorPerformance}
          searchPlaceholder={t('Search sectors...')}
          pageSize={14}
        />
        <MethodNote className="text-[11px] text-steel-500 mt-2.5 leading-relaxed" short={t('Arithmetic, not an assessed liability. It says where to look.')} full={t('The monthly gap to benchmark is arithmetic: the difference between the sector’s reference tax-to-turnover ratio and the ratio realised by the taxpayers in view, applied to the monthly turnover they declared. It indicates where to look. It is not an assessed liability, and a legitimate rate, exemption or export mix will explain part of it in every sector.')} />
      </Card>

      {/* Forecast */}
      <Card
        title={t('Forecasted Revenue Risk — Next Quarter')}
        subtitle={t('Forecast (Illustrative) — naive trend-based projection for the next 3 months. Statewide: this projection is not narrowed by the header filters.')}
        className="mb-5"
        actions={
          <span className={`text-[11px] font-semibold tabular-nums ${forecast.projectedGapCr < 0 ? 'text-maharisk-critical' : 'text-maharisk-low'}`}>
            {t('Projected {0}-month gap: ₹{1} Cr', forecast.monthCount, inr(forecast.projectedGapCr))}
          </span>
        }
      >
        <TrendLineChart
          data={forecast.chartData}
          xKey="month"
          series={[
            { key: 'target', label: t('Target (₹ Cr)'), color: '#8791a3', dashed: true },
            { key: 'actual', label: t('Actual (₹ Cr)'), color: '#204575' },
            { key: 'forecastActual', label: t('Forecast (Illustrative)'), color: '#f78c0a', dashed: true }
          ]}
        />
        <MethodNote className="text-[11px] text-steel-500 mt-2" short={t('An illustrative linear projection, not an official revenue forecast.')} full={t('Forecast values are an illustrative linear projection derived from the trailing 6-month collection trend. They are not an official revenue projection and must not be used for budgetary commitment.')} />
      </Card>

      {/* Leakage indicators — count, share and the rupees attached */}
      <Card
        title={t('Revenue Leakage Indicators')}
        subtitle={<MethodNote short={t('Click an indicator to filter the register below.')} full={t('Each tile carries the number of taxpayers, their share of the population in view, and the estimated revenue exposed. Click an indicator to filter the register below.')} />}
        className="mb-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INDICATORS.map(ind => {
            const Icon = ind.icon
            const isActive = activeIndicator === ind.key
            const tone = TONE_STYLES[ind.tone] || TONE_STYLES.steel
            const stat = indicatorStats[ind.key]
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
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-bold tabular-nums">{stat.count}</span>
                  <span className="text-[11px] opacity-80 tabular-nums">{t('of {0} · {1}%', filteredTaxpayers.length, stat.sharePct)}</span>
                </div>
                <div className="text-[11px] font-medium mt-0.5 leading-snug">{t(ind.label)}</div>
                <div className="text-[11px] font-semibold mt-1.5 tabular-nums">
                  {t('{0} exposed · {1}% of exposure in view', crore(stat.exposure), stat.exposureSharePct)}
                </div>
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
        actions={
          <span className="inline-flex items-center gap-1 text-[11px] text-steel-500">
            <BarChart3 className="w-3.5 h-3.5" /> {t('{0} of {1} taxpayers · {2} exposed', abnormalTaxpayers.length, filteredTaxpayers.length, crore(abnormalExposure))}
          </span>
        }
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniFact label={t('Monthly turnover')} value={lakh(selectedTaxpayer.monthlyTurnover)} />
              <MiniFact label={t('Tax paid')} value={lakh(selectedTaxpayer.taxPaid)} />
              <MiniFact
                label={t('Realised tax ratio')}
                value={`${((selectedTaxpayer.taxPaid / Math.max(1, selectedTaxpayer.monthlyTurnover)) * 100).toFixed(2)}%`}
                note={t('sector benchmark {0}%', ((SECTOR_REVENUE.find(s => s.sector === selectedTaxpayer.sector)?.avgTaxRatio ?? 0) * 100).toFixed(1))}
              />
              <MiniFact label={t('Revenue exposed')} value={lakh(selectedTaxpayer.estimatedRevenueExposure)} tone="red" />
            </div>
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

function MiniFact({ label, value, note, tone = 'navy' }) {
  const color = tone === 'red' ? 'text-maharisk-critical' : 'text-navy-800'
  return (
    <div className="rounded-lg border border-steel-200 bg-steel-50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-steel-400">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${color}`}>{value}</div>
      {note && <div className="text-[10.5px] text-steel-500 mt-0.5">{note}</div>}
    </div>
  )
}
