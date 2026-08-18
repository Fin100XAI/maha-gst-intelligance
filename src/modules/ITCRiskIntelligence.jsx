import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, HumanReviewBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { TAXPAYERS, SECTOR_REVENUE } from '../data/mockData.js'
import { explainRiskScore, RISK_COLORS } from '../data/risk.js'
import { generateAuditChecklist } from '../data/ai.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { TrendingUp, ShieldAlert, Percent, Zap, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'itc_spike',
    label: 'Abnormal ITC Spike',
    description: 'Input tax credit claimed materially exceeds trailing average / sector norm.',
    match: t => t.signals.itc_spike
  },
  {
    id: 'supplier_mismatch',
    label: 'Supplier Mismatch',
    description: 'Upstream supplier independently carries a High risk rating, or a supplier-risk signal is triggered.',
    match: t => t.signals.supplier_risk || t.supplierRisk === 'High'
  },
  {
    id: 'circular_signal',
    label: 'Circular ITC Suspicion',
    description: 'Invoice flow pattern consistent with circular trading among linked counterparties.',
    match: t => t.signals.circular_signal
  },
  {
    id: 'eway_mismatch',
    label: 'ITC Without Corresponding Supply Pattern',
    description: 'E-way bill movement value is inconsistent with declared outward supply — credit claimed without matching movement.',
    match: t => t.signals.eway_mismatch
  },
  {
    id: 'sector_deviation',
    label: 'Sector Deviation',
    description: 'Tax-to-turnover ratio deviates materially from the peer sector benchmark.',
    match: t => t.signals.sector_deviation
  }
]

const PAGE_STEP = 6

export default function ITCRiskIntelligence() {
  const { filters } = useApp()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  const pool = useMemo(() => TAXPAYERS.filter(t => applyGlobalFilters(t, filters)), [filters])

  const kpis = useMemo(() => {
    const totalItcExposure = pool.reduce((s, t) => s + t.itcClaimed, 0)
    const highRiskItc = pool.filter(t => t.signals.itc_spike || t.signals.circular_signal).length
    const avgRatio = pool.length
      ? pool.reduce((s, t) => s + t.itcClaimed / Math.max(1, t.monthlyTurnover), 0) / pool.length
      : 0
    const spikeAlerts = pool.filter(t => t.signals.itc_spike).length
    return { totalItcExposure, highRiskItc, avgRatio, spikeAlerts }
  }, [pool])

  // avgItcRatio is a department benchmark (not derived per-taxpayer), so it stays fixed;
  // highRiskCount is recomputed from the currently filtered pool so the chart responds to
  // district/riskLevel/taxpayerType/search, and the sector list itself narrows on the sector filter.
  const sectorChartData = useMemo(
    () => SECTOR_REVENUE
      .filter(s => filters.sector === 'All Sectors' || s.sector === filters.sector)
      .map(s => ({
        sector: s.sector,
        ratioPct: Math.round(s.avgItcRatio * 1000) / 10,
        highRiskCount: pool.filter(t => t.sector === s.sector && (t.risk.category === 'High' || t.risk.category === 'Critical')).length
      }))
      .sort((a, b) => b.ratioPct - a.ratioPct),
    [pool, filters.sector]
  )

  const categoryMatches = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory)
    return pool.filter(cat.match).sort((a, b) => b.risk.score - a.risk.score)
  }, [pool, activeCategory])

  const visibleMatches = categoryMatches.slice(0, visibleCount)
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)

  const handleCategoryChange = id => {
    setActiveCategory(id)
    setVisibleCount(PAGE_STEP)
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · ITC Intelligence')}
        title={t('ITC Risk Intelligence')}
        description={t('Anomaly detection across input tax credit behaviour — abnormal spikes, high-risk supplier linkage, circular trading suspicion, e-way bill mismatch and sector deviation.')}
        actions={<ExportBar />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Total ITC Exposure (filtered)')}
          value={`₹${(kpis.totalItcExposure / 10000000).toFixed(2)}`}
          unit={t('Cr')}
          tone="navy"
          icon={TrendingUp}
        />
        <KpiCard
          label={t('High-Risk ITC Claims')}
          value={kpis.highRiskItc.toLocaleString('en-IN')}
          tone="red"
          icon={ShieldAlert}
        />
        <KpiCard
          label={t('Avg. ITC-to-Turnover Ratio')}
          value={`${(kpis.avgRatio * 100).toFixed(1)}%`}
          tone="saffron"
          icon={Percent}
        />
        <KpiCard
          label={t('ITC Spike Alerts')}
          value={kpis.spikeAlerts.toLocaleString('en-IN')}
          tone="steel"
          icon={Zap}
        />
      </div>

      <Card
        title={t('Average ITC-to-Turnover Ratio by Sector')}
        subtitle={t('Sector benchmark ratios with associated high-risk taxpayer counts.')}
        className="mb-6"
      >
        <RiskBarChart
          data={sectorChartData}
          xKey="sector"
          barKey="ratioPct"
          height={280}
          colorFn={d => (d.highRiskCount > 8 ? RISK_COLORS.Critical.solid : d.highRiskCount > 4 ? RISK_COLORS.High.solid : d.highRiskCount > 1 ? RISK_COLORS.Medium.solid : RISK_COLORS.Low.solid)}
        />
        <div className="text-[11px] text-steel-500 mt-2">{t('Bar height = average ITC-to-turnover ratio (%). Colour intensity = concentration of High/Critical risk taxpayers in that sector.')}</div>
      </Card>

      <Card
        title={t('ITC Anomaly Categories')}
        subtitle={t('Select a category to view matching taxpayer cases under the current global filters.')}
        padded={false}
      >
        <div className="flex flex-wrap gap-2 px-5 pt-4 pb-2 border-b border-steel-100">
          {CATEGORIES.map(c => {
            const count = pool.filter(c.match).length
            const active = c.id === activeCategory
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-navy-700 border-navy-700 text-white'
                    : 'bg-white border-steel-200 text-steel-600 hover:border-navy-300 hover:text-navy-700'
                }`}
              >
                {t(c.label)}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-steel-100'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="px-5 pt-4 pb-1">
          <div className="text-xs text-steel-600">{t(activeCat.description)}</div>
        </div>

        <div className="p-5">
          {visibleMatches.length === 0 ? (
            <div className="text-sm text-steel-500 py-8 text-center">{t('No taxpayers currently match this category under the active global filters.')}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleMatches.map(t => (
                  <ItcRiskCard key={t.id} taxpayer={t} onOpen={() => setSelectedTaxpayer(t)} />
                ))}
              </div>
              {visibleCount < categoryMatches.length && (
                <div className="flex justify-center mt-5">
                  <button
                    onClick={() => setVisibleCount(v => v + PAGE_STEP)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-steel-200 bg-white hover:bg-steel-50 text-navy-700"
                  >
                    {t('Show More')} <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="text-[11px] text-steel-400 mt-3 text-center">
                {t('Showing {0} of {1} matching cases', visibleMatches.length, categoryMatches.length)}
              </div>
            </>
          )}
        </div>
      </Card>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function ItcRiskCard({ taxpayer, onOpen }) {
  const explain = explainRiskScore(taxpayer)
  const checklist = generateAuditChecklist({
    tradeName: taxpayer.tradeName,
    riskCategory: taxpayer.risk.category,
    riskScore: taxpayer.risk.score
  })
  const [showChecklist, setShowChecklist] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-steel-200 hover:shadow-panel transition-shadow p-4 flex flex-col">
      <button onClick={onOpen} className="text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-navy-900">{taxpayer.tradeName}</div>
            <div className="text-[11px] text-steel-500 mt-0.5">{taxpayer.gstin}</div>
          </div>
          <RiskBadge category={taxpayer.risk.category} score={taxpayer.risk.score} size="sm" />
        </div>
        <div className="mt-2 text-[11px] text-steel-500">
          {taxpayer.sector} · {taxpayer.district}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <div>
            <span className="text-steel-500">{t('Est. Exposure')} </span>
            <span className="font-semibold text-navy-800">₹{(taxpayer.estimatedRevenueExposure / 100000).toFixed(1)} L</span>
          </div>
        </div>
      </button>

      <div className="mt-3">
        <div className="text-[10.5px] font-semibold text-steel-500 uppercase tracking-wide mb-1">{t('Evidence')}</div>
        <ul className="space-y-1">
          {explain.evidence.slice(0, 3).map((e, i) => (
            <li key={i} className="text-[11px] text-navy-700 flex gap-1.5">
              <span className="text-navy-400">•</span>
              <span>{t(e.rule)}</span>
            </li>
          ))}
          {explain.evidence.length === 0 && (
            <li className="text-[11px] text-steel-400">{t('No individual rule detail available.')}</li>
          )}
        </ul>
      </div>

      <div className="mt-3 pt-3 border-t border-steel-100 flex items-center justify-between">
        {explain.humanReviewRequired ? <HumanReviewBadge label={t('Review Required')} /> : <Pill tone="steel">{t('Routine')}</Pill>}
        <button
          onClick={() => setShowChecklist(v => !v)}
          className="text-[11px] font-semibold text-navy-700 hover:text-navy-900"
        >
          {showChecklist ? t('Hide checklist') : t('Verification checklist')}
        </button>
      </div>

      {showChecklist && (
        <div className="mt-3">
          <AIOutputPanel output={checklist} />
        </div>
      )}
    </div>
  )
}
