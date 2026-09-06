import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useChartPalette } from '../components/ui/Charts.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { SECTOR_REVENUE, TAXPAYERS } from '../data/mockData.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { Layers, AlertTriangle, TrendingUp, Gauge } from 'lucide-react'
import { t } from '../i18n/index.js'

const tooltipStyle = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #d3d7de', boxShadow: '0 4px 16px rgba(15,35,64,0.12)' },
  labelStyle: { fontWeight: 600, color: '#0f2340' }
}

export default function SectorIntelligence() {
  const { filters } = useApp()
  const CHART_COLORS = useChartPalette()
  const [selectedSector, setSelectedSector] = useState(
    filters.sector !== 'All Sectors' ? filters.sector : SECTOR_REVENUE[0].sector
  )
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  // Revenue/headcount/risk figures are recomputed from the currently filtered taxpayer pool
  // (sector itself excluded — this page compares across sectors); the three benchmark ratios
  // (avgTaxRatio/avgItcRatio/avgRefundRatio) are department-set targets, not filter-scoped.
  const globallyFilteredTaxpayers = useMemo(
    () => TAXPAYERS.filter(t => applyGlobalFilters(t, { ...filters, sector: 'All Sectors' })),
    [filters]
  )

  const sectorStats = useMemo(() => SECTOR_REVENUE.map(s => {
    const members = globallyFilteredTaxpayers.filter(t => t.sector === s.sector)
    const revenue = members.reduce((sum, t) => sum + t.taxPaid, 0)
    return {
      ...s,
      revenueLakh: Math.round(revenue / 100000),
      taxpayerCount: members.length,
      highRiskCount: members.filter(t => t.risk.category === 'High' || t.risk.category === 'Critical').length
    }
  }), [globallyFilteredTaxpayers])

  const avgItcAcrossSectors = useMemo(
    () => SECTOR_REVENUE.reduce((s, r) => s + r.avgItcRatio, 0) / SECTOR_REVENUE.length,
    []
  )

  const kpis = useMemo(() => {
    const highestRiskSector = [...sectorStats].sort((a, b) => b.highRiskCount - a.highRiskCount)[0]
    const highestRevenueSector = [...sectorStats].sort((a, b) => b.revenueLakh - a.revenueLakh)[0]
    const widestItcDeviation = [...sectorStats].sort(
      (a, b) => Math.abs(b.avgItcRatio - avgItcAcrossSectors) - Math.abs(a.avgItcRatio - avgItcAcrossSectors)
    )[0]
    return { highestRiskSector, highestRevenueSector, widestItcDeviation }
  }, [sectorStats, avgItcAcrossSectors])

  const revenueBarData = useMemo(
    () => [...sectorStats].sort((a, b) => b.revenueLakh - a.revenueLakh).map(s => ({ sector: s.sector, revenueLakh: s.revenueLakh, highRiskCount: s.highRiskCount })),
    [sectorStats]
  )

  const ratioCompareData = useMemo(
    () => sectorStats.map(s => ({
      sector: s.sector,
      'Tax Ratio %': Math.round(s.avgTaxRatio * 1000) / 10,
      'ITC Ratio %': Math.round(s.avgItcRatio * 1000) / 10,
      'Refund Ratio %': Math.round(s.avgRefundRatio * 1000) / 10
    })),
    [sectorStats]
  )

  const sectorRecord = useMemo(() => sectorStats.find(s => s.sector === selectedSector), [sectorStats, selectedSector])
  const sectorTaxpayersAll = useMemo(() => globallyFilteredTaxpayers.filter(t => t.sector === selectedSector), [globallyFilteredTaxpayers, selectedSector])

  const filingCompliancePct = useMemo(() => {
    if (sectorTaxpayersAll.length === 0) return 0
    const regular = sectorTaxpayersAll.filter(t => t.filingStatus === 'Regular Filer').length
    return Math.round((regular / sectorTaxpayersAll.length) * 1000) / 10
  }, [sectorTaxpayersAll])

  const topRiskIndicators = useMemo(() => {
    const counts = {}
    sectorTaxpayersAll.forEach(t => {
      (t.risk.triggeredRules || []).forEach(r => {
        counts[r.label] = (counts[r.label] || 0) + 1
      })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }))
  }, [sectorTaxpayersAll])

  const filteredSectorTaxpayers = useMemo(
    () => [...sectorTaxpayersAll].sort((a, b) => b.risk.score - a.risk.score),
    [sectorTaxpayersAll]
  )

  const topTaxpayersBySectorRisk = filteredSectorTaxpayers.slice(0, 8)

  const itcDeviationPct = sectorRecord
    ? Math.round(((sectorRecord.avgItcRatio - avgItcAcrossSectors) / avgItcAcrossSectors) * 1000) / 10
    : 0

  const columns = [
    {
      key: 'tradeName', label: t('Taxpayer'), render: row => (
        <div>
          <div className="font-semibold text-navy-800">{row.tradeName}</div>
          <div className="text-[11px] text-steel-500">{row.gstin}</div>
        </div>
      )
    },
    { key: 'district', label: t('District'), render: r => t(r.district) },
    { key: 'filingStatus', label: t('Filing Status'), render: row => t(row.filingStatus) },
    {
      key: 'risk', label: t('Risk'), align: 'right', sortValue: row => row.risk.score,
      render: row => <RiskBadge category={row.risk.category} score={row.risk.score} size="sm" />
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Benchmarking')}
        title={t('Sector Intelligence')}
        description={t("Cross-sector revenue, ITC and risk benchmarking across Maharashtra's priority industry sectors, with taxpayer-level drill-down.")}
        actions={<ExportBar />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Sectors Tracked')} value={sectorStats.length} icon={Layers} tone="navy" />
        <KpiCard
          label={t('Highest-Risk Sector')}
          value={t(kpis.highestRiskSector.sector)}
          unit={t('{0} high-risk', kpis.highestRiskSector.highRiskCount)}
          icon={AlertTriangle}
          tone="red"
          onClick={() => setSelectedSector(kpis.highestRiskSector.sector)}
        />
        <KpiCard
          label={t('Highest Revenue Sector')}
          value={t(kpis.highestRevenueSector.sector)}
          unit={`₹${kpis.highestRevenueSector.revenueLakh.toLocaleString('en-IN')}L`}
          icon={TrendingUp}
          tone="saffron"
          onClick={() => setSelectedSector(kpis.highestRevenueSector.sector)}
        />
        <KpiCard
          label={t('Widest ITC Deviation')}
          value={t(kpis.widestItcDeviation.sector)}
          unit={t('vs cross-sector average')}
          icon={Gauge}
          tone="steel"
          onClick={() => setSelectedSector(kpis.widestItcDeviation.sector)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title={t('Tax Revenue Collected by Sector')} subtitle={t('Sum of tax paid by taxpayers in each sector (₹ Lakh)')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueBarData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="sector" tick={{ fontSize: 9.5, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="revenueLakh" name={t('Revenue (₹L)')} radius={[4, 4, 0, 0]}>
                {revenueBarData.map((d, i) => (
                  <Cell key={i} fill={d.sector === selectedSector ? CHART_COLORS[1] : CHART_COLORS[0]} cursor="pointer" onClick={() => setSelectedSector(d.sector)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('Tax vs ITC vs Refund Ratio by Sector')} subtitle={t('Reference benchmark ratios as % of turnover — fixed reference values, not recomputed from the filtered taxpayer pool')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratioCompareData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="sector" tick={{ fontSize: 9.5, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Tax Ratio %" name={t('Tax Ratio %')} fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="ITC Ratio %" name={t('ITC Ratio %')} fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Refund Ratio %" name={t('Refund Ratio %')} fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title={t('Sector Picker')} subtitle={t('Select a sector for a detailed intelligence panel')} className="mb-6">
        <div className="flex flex-wrap gap-2">
          {sectorStats.map(s => (
            <button
              key={s.sector}
              onClick={() => setSelectedSector(s.sector)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                selectedSector === s.sector
                  ? 'bg-ink-700 text-white border-ink-700'
                  : 'bg-white text-navy-700 border-steel-200 hover:bg-steel-50'
              }`}
            >
              {t(s.sector)}
              {s.highRiskCount > 0 && (
                <span className={`ml-1.5 ${selectedSector === s.sector ? 'text-saffron-300' : 'text-maharisk-high'}`}>
                  · {s.highRiskCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {sectorRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card title={t('{0} — Sector Profile', sectorRecord.sector)} className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Stat label={t('Revenue Contribution')} value={`₹${sectorRecord.revenueLakh.toLocaleString('en-IN')}L`} />
              <Stat label={t('Taxpayers in Sector')} value={sectorRecord.taxpayerCount} />
              <Stat label={t('Tax-to-Turnover Benchmark')} value={`${(sectorRecord.avgTaxRatio * 100).toFixed(1)}%`} />
              <Stat label={t('ITC Benchmark')} value={`${(sectorRecord.avgItcRatio * 100).toFixed(1)}%`} />
              <Stat label={t('Refund Benchmark')} value={`${(sectorRecord.avgRefundRatio * 100).toFixed(1)}%`} />
              <Stat label={t('Filing Compliance')} value={`${filingCompliancePct}%`} />
            </div>
            <div
              className="mt-4 rounded-lg border p-3 text-xs"
              style={Math.abs(itcDeviationPct) > 20 ? { backgroundColor: TONE_STYLES.orange.bg, borderColor: TONE_STYLES.orange.border } : { backgroundColor: TONE_STYLES.steel.bg, borderColor: TONE_STYLES.steel.border }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-navy-800 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: Math.abs(itcDeviationPct) > 20 ? TONE_STYLES.orange.accent : TONE_STYLES.steel.accent }} />
                {t('Sector Anomaly Alert')}
              </div>
              <p className="text-steel-600">
                {t('{0} ITC ratio ({1}%) deviates', sectorRecord.sector, (sectorRecord.avgItcRatio * 100).toFixed(1))}{' '}
                <strong className={itcDeviationPct >= 0 ? 'text-maharisk-high' : 'text-maharisk-low'}>
                  {itcDeviationPct >= 0 ? '+' : ''}{itcDeviationPct}%
                </strong>{' '}
                {t('from the cross-sector average ({0}%). {1} taxpayers in this sector currently carry a High or Critical risk rating.', (avgItcAcrossSectors * 100).toFixed(1), sectorRecord.highRiskCount)}
              </p>
              <div className="mt-2"><HumanReviewBadge label={t('Recommend sector-level scrutiny review')} /></div>
            </div>
          </Card>

          <Card title={t('Top Triggered Risk Indicators')} subtitle={t('Aggregated across {0} taxpayers in sector', sectorTaxpayersAll.length)} className="lg:col-span-1">
            {topRiskIndicators.length === 0 ? (
              <p className="text-xs text-steel-500">{t('No risk rules triggered among taxpayers in this sector.')}</p>
            ) : (
              <div className="space-y-2.5">
                {topRiskIndicators.map(r => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium text-navy-800">{t(r.label)}</span>
                      <span className="text-steel-500">{r.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-steel-100 overflow-hidden">
                      <div
                        className="h-full bg-ink-600"
                        style={{ width: `${Math.min(100, (r.count / (topRiskIndicators[0].count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title={t('Top Taxpayers by Risk')}
            subtitle={t('Respecting global district / risk filters')}
            className="lg:col-span-1"
          >
            {topTaxpayersBySectorRisk.length === 0 ? (
              <p className="text-xs text-steel-500">{t('No taxpayers match the current global filters within this sector.')}</p>
            ) : (
              <div className="space-y-1.5">
                {topTaxpayersBySectorRisk.map(tp => (
                  <button
                    key={tp.id}
                    onClick={() => setSelectedTaxpayer(tp)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-steel-200 hover:bg-navy-50/60 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-navy-800 truncate">{tp.tradeName}</div>
                      <div className="text-[11px] text-steel-500 truncate">{t(tp.district)}</div>
                    </div>
                    <RiskBadge category={tp.risk.category} score={tp.risk.score} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Card title={t('{0} — Taxpayer Register', selectedSector)} subtitle={t('Searchable list of taxpayers in this sector (respects global filters)')}>
        <DataTable columns={columns} rows={filteredSectorTaxpayers} onRowClick={row => setSelectedTaxpayer(row)} searchPlaceholder={t('Search taxpayer / GSTIN...')} />
      </Card>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
    </div>
  )
}
