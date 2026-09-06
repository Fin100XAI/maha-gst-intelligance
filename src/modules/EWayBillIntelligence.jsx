import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { TrendAreaChart, RiskBarChart } from '../components/ui/Charts.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { EWAY_RECORDS, taxpayerById, isWithinDateRange } from '../data/mockData.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { Truck, AlertTriangle, Ban, Route, Eye } from 'lucide-react'

// Records only carry district/sector/gstin/tradeName directly — resolve the full taxpayer
// record to also honour division/taxpayerType/riskLevel, same pattern as the cluster detection view.
function matchesGlobalFilters(rec, filters) {
  if (!isWithinDateRange(rec.generatedOn, filters.dateRange)) return false
  const taxpayer = taxpayerById(rec.taxpayerId)
  if (taxpayer) return applyGlobalFilters(taxpayer, filters)
  if (filters.district !== 'All Districts' && rec.district !== filters.district) return false
  if (filters.sector !== 'All Sectors' && rec.sector !== filters.sector) return false
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase()
    const hay = `${rec.gstin} ${rec.tradeName}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

// Bucket e-way records by generatedOn date into ~6 periods for a trend view.
function buildPeriods(records) {
  if (records.length === 0) return []
  const dates = records.map(r => new Date(r.generatedOn).getTime())
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const bucketCount = 6
  const span = Math.max(1, max - min)
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    label: `P${i + 1}`,
    start: min + (span * i) / bucketCount,
    end: min + (span * (i + 1)) / bucketCount,
    valueLakh: 0,
    count: 0
  }))
  records.forEach(r => {
    const t = new Date(r.generatedOn).getTime()
    let idx = buckets.findIndex((b, i) => t >= b.start && (i === bucketCount - 1 ? t <= b.end : t < b.end))
    if (idx === -1) idx = bucketCount - 1
    buckets[idx].valueLakh += r.valueLakh
    buckets[idx].count += 1
  })
  return buckets.map((b, i) => ({
    period: `Period ${i + 1} (${new Date(b.start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date(b.end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`,
    shortLabel: `P${i + 1}`,
    valueLakh: Math.round(b.valueLakh * 10) / 10,
    count: b.count
  }))
}

export default function EWayBillIntelligence() {
  const { filters } = useApp()
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  const filteredRecords = useMemo(
    () => EWAY_RECORDS.filter(r => matchesGlobalFilters(r, filters)),
    [filters]
  )

  const kpis = useMemo(() => {
    const totalValueLakh = filteredRecords.reduce((s, r) => s + r.valueLakh, 0)
    const anomalyCount = filteredRecords.filter(r => r.anomalyFlag).length
    const cancelledCount = filteredRecords.filter(r => r.cancelled).length
    const cancellationRatePct = filteredRecords.length ? Math.round((cancelledCount / filteredRecords.length) * 1000) / 10 : 0
    const longHaulCount = filteredRecords.filter(r => r.routeType === 'Inter-State Long Haul').length
    return { totalValueLakh, anomalyCount, cancellationRatePct, longHaulCount }
  }, [filteredRecords])

  const periods = useMemo(() => buildPeriods(filteredRecords), [filteredRecords])

  const districtRisk = useMemo(() => {
    const map = new Map()
    filteredRecords.forEach(r => {
      const entry = map.get(r.district) || { district: r.district, anomalyCount: 0, valueLakh: 0 }
      if (r.anomalyFlag) entry.anomalyCount += 1
      entry.valueLakh += r.valueLakh
      map.set(r.district, entry)
    })
    return [...map.values()]
      .sort((a, b) => b.anomalyCount - a.anomalyCount)
      .map(d => ({ ...d, valueLakh: Math.round(d.valueLakh * 10) / 10 }))
  }, [filteredRecords])

  const suspiciousRecords = useMemo(
    () => filteredRecords.filter(r => r.anomalyFlag || r.cancelled || !r.matchedToReturn),
    [filteredRecords]
  )

  const topAnomalyRecord = useMemo(() => {
    const anomalies = filteredRecords.filter(r => r.anomalyFlag)
    if (anomalies.length === 0) return null
    return [...anomalies].sort((a, b) => b.valueLakh - a.valueLakh)[0]
  }, [filteredRecords])

  const movementMismatchSummary = useMemo(() => {
    if (!topAnomalyRecord) return null
    const tp = taxpayerById(topAnomalyRecord.taxpayerId)
    const relatedRecords = filteredRecords.filter(r => r.taxpayerId === topAnomalyRecord.taxpayerId)
    const totalValue = relatedRecords.reduce((s, r) => s + r.valueLakh, 0)
    const unmatchedCount = relatedRecords.filter(r => !r.matchedToReturn).length
    return {
      title: t('AI-Generated Movement Mismatch Summary — {0}', topAnomalyRecord.tradeName),
      confidence: unmatchedCount >= 2 ? t('High') : t('Moderate'),
      summary: [
        t('{0} ({1}) generated e-way bills valued at ₹{2} L across {3} movement record(s) in the {4} district, of which {5} were not matched to filed returns.',
          topAnomalyRecord.tradeName, topAnomalyRecord.gstin, totalValue.toFixed(1), relatedRecords.length, topAnomalyRecord.district, unmatchedCount),
        t('The highest-value flagged movement (₹{0} L, {1}, {2} km, vehicle {3}) shows a pattern inconsistent with declared outward supply, suggesting possible under-reporting of turnover or fictitious movement.',
          topAnomalyRecord.valueLakh.toFixed(1), t(topAnomalyRecord.routeType), topAnomalyRecord.distanceKm, topAnomalyRecord.vehicleNo),
        tp ? t('Current taxpayer risk rating: {0} ({1}/100). Sector: {2}.', t(tp.risk.category), tp.risk.score, tp.sector) : t('Taxpayer risk profile unavailable for this record.')
      ],
      evidenceUsed: [t('E-Way Bill generation log'), t('Return filing match status'), t('Route and distance pattern'), t('Vehicle movement records')],
      humanReviewRequired: true,
      limitationNote: t('This narrative is a system-generated pattern observation based on e-way bill and return-matching data. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.')
    }
  }, [topAnomalyRecord, filteredRecords])

  const openTaxpayer = taxpayerId => {
    const tp = taxpayerById(taxpayerId)
    if (tp) setSelectedTaxpayer(tp)
  }

  const columns = [
    { key: 'id', label: t('E-Way ID') },
    {
      key: 'trade',
      label: t('GSTIN / Trade Name'),
      sortValue: r => r.tradeName,
      render: r => (
        <div>
          <div className="font-semibold text-navy-900">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.gstin}</div>
        </div>
      )
    },
    { key: 'district', label: t('District'), render: r => t(r.district) },
    { key: 'routeType', label: t('Route Type'), render: r => t(r.routeType) },
    { key: 'distanceKm', label: t('Distance (km)'), align: 'right' },
    { key: 'valueLakh', label: t('Value (₹L)'), align: 'right', render: r => r.valueLakh.toFixed(1) },
    {
      key: 'cancelled',
      label: t('Cancelled?'),
      align: 'center',
      sortValue: r => (r.cancelled ? 1 : 0),
      render: r => r.cancelled ? <Pill tone="red">{t('Cancelled')}</Pill> : <Pill tone="green">{t('Active')}</Pill>
    },
    {
      key: 'matchedToReturn',
      label: t('Matched to Return?'),
      align: 'center',
      sortValue: r => (r.matchedToReturn ? 1 : 0),
      render: r => r.matchedToReturn ? <Pill tone="green">{t('Matched')}</Pill> : <Pill tone="amber">{t('Unmatched')}</Pill>
    },
    {
      key: 'anomalyFlag',
      label: t('Anomaly Flag'),
      align: 'center',
      sortValue: r => (r.anomalyFlag ? 1 : 0),
      render: r => r.anomalyFlag
        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-maharisk-critical"><AlertTriangle className="w-3 h-3" /> {t('Flagged')}</span>
        : <span className="text-[11px] text-steel-400">—</span>
    },
    {
      key: 'action',
      label: t('Action'),
      sortable: false,
      align: 'center',
      render: r => (
        <button
          onClick={() => openTaxpayer(r.taxpayerId)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50"
        >
          <Eye className="w-3 h-3" /> {t('View Taxpayer')}
        </button>
      )
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Logistics Intelligence')}
        title={t('E-Way Bill Intelligence')}
        description={t('Movement-vs-filing intelligence: correlating declared e-way bill movement value against filed returns to surface logistics-linked under-reporting risk across Maharashtra.')}
        actions={<ExportBar />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Total E-Way Bill Value')} value={kpis.totalValueLakh.toFixed(1)} unit={t('₹ Lakh')} tone="navy" icon={Truck} />
        <KpiCard label={t('High Movement, Low Filing')} value={kpis.anomalyCount} unit={t('records flagged')} tone="red" icon={AlertTriangle} />
        <KpiCard label={t('Cancellation Rate')} value={kpis.cancellationRatePct} unit="%" tone="saffron" icon={Ban} />
        <KpiCard label={t('Inter-State Long Haul')} value={kpis.longHaulCount} unit={t('movements')} tone="steel" icon={Route} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card title={t('E-Way Bill Value Trend')} subtitle={t('Total declared movement value across recent periods')}>
          {periods.length > 0 ? (
            <TrendAreaChart data={periods} xKey="shortLabel" dataKey="valueLakh" color="#204575" />
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No e-way bill records match the current filters.')}</div>
          )}
        </Card>
        <Card title={t('District-Wise Logistics Risk')} subtitle={t('Anomaly-flagged movements by district')}>
          {districtRisk.length > 0 ? (
            <RiskBarChart data={districtRisk} xKey="district" barKey="anomalyCount" colorFn={d => d.anomalyCount > 0 ? '#c41e3a' : '#7e9cc6'} />
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No district data available for the current filters.')}</div>
          )}
        </Card>
      </div>

      <Card
        title={t('Suspicious E-Way Bill Patterns')}
        subtitle={t('Records with anomaly flags, cancellations, or no matching filed return')}
        className="mb-6"
        actions={<HumanReviewBadge label={t('Officer Review Required')} />}
      >
        <DataTable
          columns={columns}
          rows={suspiciousRecords}
          searchPlaceholder={t('Search by GSTIN or trade name...')}
          emptyLabel={t('No suspicious e-way bill patterns match the current filters.')}
        />
      </Card>

      <Card title={t('AI-Generated Movement Mismatch Summary')} subtitle={t('Synthesized narrative for the highest-anomaly taxpayer in the current filter set')}>
        {movementMismatchSummary ? (
          <AIOutputPanel output={movementMismatchSummary} />
        ) : (
          <div className="text-xs text-steel-500 py-6 text-center">{t('No anomaly-flagged e-way bill records available to summarise for the current filters.')}</div>
        )}
      </Card>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}
