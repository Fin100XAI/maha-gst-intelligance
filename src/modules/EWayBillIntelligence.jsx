import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill, HumanReviewBadge, RiskBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { TrendAreaChart, RiskBarChart } from '../components/ui/Charts.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { EWAY_RECORDS, taxpayerById, isWithinDateRange } from '../data/mockData.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { Truck, AlertTriangle, Ban, Users, Eye, Info } from 'lucide-react'

const pctOf = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0)
const round1 = n => Math.round(n * 10) / 10

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

/* Bucket e-way records by generatedOn date into ~6 periods. The series plotted
 * is the value NOT matched to a filed return, not total movement: total
 * movement rises and falls with trade and decides nothing, while unmatched
 * movement is the quantity an officer is being asked to act on. The total is
 * kept alongside so the unmatched figure always has its denominator. */
function buildPeriods(records) {
  if (records.length === 0) return []
  const dates = records.map(r => new Date(r.generatedOn).getTime())
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const bucketCount = 6
  const span = Math.max(1, max - min)
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    start: min + (span * i) / bucketCount,
    end: min + (span * (i + 1)) / bucketCount,
    valueLakh: 0,
    unmatchedLakh: 0,
    count: 0
  }))
  records.forEach(r => {
    // Never name this `t` — that shadows the translator for the whole function.
    const ts = new Date(r.generatedOn).getTime()
    let idx = buckets.findIndex((b, i) => ts >= b.start && (i === bucketCount - 1 ? ts <= b.end : ts < b.end))
    if (idx === -1) idx = bucketCount - 1
    buckets[idx].valueLakh += r.valueLakh
    if (!r.matchedToReturn) buckets[idx].unmatchedLakh += r.valueLakh
    buckets[idx].count += 1
  })
  const fmt = ms => new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return buckets.map((b, i) => ({
    period: t('Period {0} ({1} – {2})', i + 1, fmt(b.start), fmt(b.end)),
    shortLabel: `P${i + 1}`,
    valueLakh: round1(b.valueLakh),
    unmatchedLakh: round1(b.unmatchedLakh),
    unmatchedPct: pctOf(b.unmatchedLakh, b.valueLakh),
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

  /* Every figure carries the population it came from, and where the platform
   * holds a statewide equivalent it is shown next to the filtered one — a
   * district anomaly rate means nothing until it is set against the state. */
  const kpis = useMemo(() => {
    const totalValueLakh = filteredRecords.reduce((s, r) => s + r.valueLakh, 0)
    const unmatched = filteredRecords.filter(r => !r.matchedToReturn)
    const unmatchedValueLakh = unmatched.reduce((s, r) => s + r.valueLakh, 0)
    const cancelled = filteredRecords.filter(r => r.cancelled)
    const anomalies = filteredRecords.filter(r => r.anomalyFlag)
    return {
      totalValueLakh: round1(totalValueLakh),
      unmatchedValueLakh: round1(unmatchedValueLakh),
      unmatchedValuePct: pctOf(unmatchedValueLakh, totalValueLakh),
      unmatchedCount: unmatched.length,
      recordCount: filteredRecords.length,
      anomalyCount: anomalies.length,
      anomalyPct: pctOf(anomalies.length, filteredRecords.length),
      cancelledCount: cancelled.length,
      cancellationRatePct: pctOf(cancelled.length, filteredRecords.length),
      cancelledValueLakh: round1(cancelled.reduce((s, r) => s + r.valueLakh, 0)),
      taxpayersInScope: new Set(filteredRecords.map(r => r.taxpayerId)).size,
      taxpayersUnmatched: new Set(unmatched.map(r => r.taxpayerId)).size,
      // Statewide comparators, computed over the whole feed rather than the
      // filtered slice, so they do not move when the officer narrows.
      stateUnmatchedPct: pctOf(EWAY_RECORDS.filter(r => !r.matchedToReturn).length, EWAY_RECORDS.length),
      stateAnomalyPct: pctOf(EWAY_RECORDS.filter(r => r.anomalyFlag).length, EWAY_RECORDS.length),
      stateCancellationPct: pctOf(EWAY_RECORDS.filter(r => r.cancelled).length, EWAY_RECORDS.length)
    }
  }, [filteredRecords])

  const periods = useMemo(() => buildPeriods(filteredRecords), [filteredRecords])

  const districtRisk = useMemo(() => {
    const map = new Map()
    filteredRecords.forEach(r => {
      const entry = map.get(r.district) || { district: r.district, records: 0, anomalyCount: 0, unmatched: 0, valueLakh: 0, unmatchedLakh: 0 }
      entry.records += 1
      if (r.anomalyFlag) entry.anomalyCount += 1
      if (!r.matchedToReturn) { entry.unmatched += 1; entry.unmatchedLakh += r.valueLakh }
      entry.valueLakh += r.valueLakh
      map.set(r.district, entry)
    })
    return [...map.values()]
      .map(d => ({
        ...d,
        valueLakh: round1(d.valueLakh),
        unmatchedLakh: round1(d.unmatchedLakh),
        unmatchedPct: pctOf(d.unmatched, d.records)
      }))
      .sort((a, b) => b.unmatchedPct - a.unmatchedPct || b.unmatchedLakh - a.unmatchedLakh)
  }, [filteredRecords])

  /* The officer's unit of action is a taxpayer, not a consignment. A register
   * of 90 individual movements cannot be worked; the same movements rolled up
   * to the entity behind them, ranked by unmatched value and set against that
   * entity's filing behaviour, can be. */
  const taxpayerRollup = useMemo(() => {
    const map = new Map()
    filteredRecords.forEach(r => {
      const entry = map.get(r.taxpayerId) || {
        id: r.taxpayerId, taxpayerId: r.taxpayerId, gstin: r.gstin, tradeName: r.tradeName,
        district: r.district, sector: r.sector,
        records: 0, unmatched: 0, cancelled: 0, anomalies: 0, valueLakh: 0, unmatchedLakh: 0
      }
      entry.records += 1
      entry.valueLakh += r.valueLakh
      if (!r.matchedToReturn) { entry.unmatched += 1; entry.unmatchedLakh += r.valueLakh }
      if (r.cancelled) entry.cancelled += 1
      if (r.anomalyFlag) entry.anomalies += 1
      map.set(r.taxpayerId, entry)
    })
    return [...map.values()]
      .map(e => {
        const tp = taxpayerById(e.taxpayerId)
        return {
          ...e,
          valueLakh: round1(e.valueLakh),
          unmatchedLakh: round1(e.unmatchedLakh),
          unmatchedSharePct: pctOf(e.unmatchedLakh, e.valueLakh),
          filingStatus: tp ? tp.filingStatus : null,
          riskScore: tp ? tp.risk.score : null,
          riskCategory: tp ? tp.risk.category : null,
          // Declared movement against declared turnover, both from the taxpayer's
          // own return record — the only like-for-like ratio the platform holds.
          declaredMovementRatio: tp && tp.monthlyTurnover > 0
            ? Math.round((tp.ewayBillValue / tp.monthlyTurnover) * 100) / 100
            : null
        }
      })
      .filter(e => e.unmatched > 0 || e.anomalies > 0 || e.cancelled > 0)
      .sort((a, b) => b.unmatchedLakh - a.unmatchedLakh)
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
    const unmatchedValue = relatedRecords.filter(r => !r.matchedToReturn).reduce((s, r) => s + r.valueLakh, 0)
    return {
      title: t('AI-Generated Movement Mismatch Summary — {0}', topAnomalyRecord.tradeName),
      confidence: unmatchedCount >= 2 ? t('High') : t('Moderate'),
      summary: [
        t('{0} ({1}) generated e-way bills valued at ₹{2} L across {3} movement record(s) in the {4} district, of which {5} ({6}% of the value, ₹{7} L) were not matched to filed returns. The unmatched share across the whole feed is {8}%.',
          topAnomalyRecord.tradeName, topAnomalyRecord.gstin, totalValue.toFixed(1), relatedRecords.length,
          topAnomalyRecord.district, unmatchedCount, pctOf(unmatchedValue, totalValue), unmatchedValue.toFixed(1), kpis.stateUnmatchedPct),
        t('The highest-value flagged movement (₹{0} L, {1}, {2} km, vehicle {3}) shows a pattern inconsistent with declared outward supply, suggesting possible under-reporting of turnover or fictitious movement.',
          topAnomalyRecord.valueLakh.toFixed(1), t(topAnomalyRecord.routeType), topAnomalyRecord.distanceKm, topAnomalyRecord.vehicleNo),
        tp
          ? t('Current taxpayer risk rating: {0} ({1}/100). Sector: {2}. Filing behaviour: {3}. Declared movement stands at {4}× declared turnover on the return record.',
            t(tp.risk.category), tp.risk.score, t(tp.sector), t(tp.filingStatus),
            tp.monthlyTurnover > 0 ? (Math.round((tp.ewayBillValue / tp.monthlyTurnover) * 100) / 100) : '—')
          : t('Taxpayer risk profile unavailable for this record.')
      ],
      evidenceUsed: [t('E-Way Bill generation log'), t('Return filing match status'), t('Route and distance pattern'), t('Vehicle movement records')],
      humanReviewRequired: true,
      limitationNote: t('This narrative is a system-generated pattern observation based on e-way bill and return-matching data. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.')
    }
  }, [topAnomalyRecord, filteredRecords, kpis.stateUnmatchedPct])

  const openTaxpayer = taxpayerId => {
    const tp = taxpayerById(taxpayerId)
    if (tp) setSelectedTaxpayer(tp)
  }

  const rollupColumns = [
    {
      key: 'trade',
      label: t('Taxpayer'),
      sortValue: r => r.tradeName,
      render: r => (
        <div>
          <div className="font-semibold text-navy-900">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.gstin} · {t(r.district)}</div>
        </div>
      )
    },
    {
      key: 'unmatchedLakh',
      label: t('Movement not matched to a return'),
      align: 'right',
      sortValue: r => r.unmatchedLakh,
      render: r => (
        <div className="tabular-nums">
          <div className="font-semibold text-navy-900">{t('₹{0} L', r.unmatchedLakh.toFixed(1))}</div>
          <div className="text-[11px] text-steel-500">{t('{0}% of their ₹{1} L moved', r.unmatchedSharePct, r.valueLakh.toFixed(1))}</div>
        </div>
      )
    },
    {
      key: 'records',
      label: t('Consignments'),
      align: 'right',
      sortValue: r => r.records,
      render: r => (
        <div className="tabular-nums">
          <div className="text-navy-900">{t('{0} unmatched of {1}', r.unmatched, r.records)}</div>
          <div className="text-[11px] text-steel-500">{t('{0} cancelled · {1} flagged', r.cancelled, r.anomalies)}</div>
        </div>
      )
    },
    {
      key: 'filingStatus',
      label: t('Filing behaviour'),
      sortValue: r => r.filingStatus || '',
      render: r => r.filingStatus
        ? <Pill tone={r.filingStatus === 'Non-Filer' ? 'red' : r.filingStatus === 'Late Filer' ? 'amber' : 'green'}>{t(r.filingStatus)}</Pill>
        : <span className="text-[11px] text-steel-400">{t('not on record')}</span>
    },
    {
      key: 'declaredMovementRatio',
      label: t('Declared movement / turnover'),
      align: 'right',
      sortValue: r => r.declaredMovementRatio ?? 0,
      render: r => r.declaredMovementRatio == null
        ? <span className="text-steel-400">—</span>
        : (
          <span className={`tabular-nums ${r.declaredMovementRatio > 1 ? 'font-semibold text-[#C5221F]' : 'text-steel-600'}`}>
            {t('{0}×', r.declaredMovementRatio)}
          </span>
        )
    },
    {
      key: 'riskScore',
      label: t('Risk'),
      align: 'center',
      sortValue: r => r.riskScore ?? 0,
      render: r => r.riskCategory
        ? <RiskBadge category={r.riskCategory} score={r.riskScore} size="sm" />
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
        description={<MethodNote short={t('Declared movement with no filed return behind it, and whose it is.')} full={t('Transit records checked against filings. The question this screen answers is how much declared goods movement has no filed return behind it, whose movement that is, and how that compares with the rest of the state.')} />}
        actions={<ExportBar />}
      />

      <FilterScope shown={filteredRecords.length} total={EWAY_RECORDS.length} unit={t('transit records')} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Movement with no matching return')}
          value={kpis.unmatchedValueLakh.toFixed(1)}
          unit={t('₹ Lakh of ₹{0} L moved in scope — {1}% of the value, against {2}% of records statewide', kpis.totalValueLakh.toFixed(1), kpis.unmatchedValuePct, kpis.stateUnmatchedPct)}
          tone="red"
          icon={Truck}
        />
        <KpiCard
          label={t('Taxpayers behind the unmatched movement')}
          value={kpis.taxpayersUnmatched}
          unit={t('of {0} with movement in scope — this, not the consignment, is the unit of action', kpis.taxpayersInScope)}
          tone="navy"
          icon={Users}
        />
        <KpiCard
          label={t('Records carrying an anomaly flag')}
          value={kpis.anomalyCount}
          unit={t('of {0} records ({1}%) — the statewide rate is {2}%', kpis.recordCount, kpis.anomalyPct, kpis.stateAnomalyPct)}
          tone="saffron"
          icon={AlertTriangle}
        />
        <KpiCard
          label={t('Cancellation rate')}
          value={kpis.cancellationRatePct}
          unit={t('% — {0} of {1} records, ₹{2} L cancelled; statewide {3}%', kpis.cancelledCount, kpis.recordCount, kpis.cancelledValueLakh.toFixed(1), kpis.stateCancellationPct)}
          tone="steel"
          icon={Ban}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card tone="red"
          title={t('Unmatched movement value by period')}
          subtitle={<MethodNote short={t('Total movement follows trade; the unmatched share is what to act on.')} full={t('Value with no matching filed return, against a total of ₹{0} L moved in scope. Total movement rises and falls with trade; the unmatched share is what an officer is being asked to act on.', kpis.totalValueLakh.toFixed(1))} />}
        >
          {periods.length > 0 ? (
            <>
              <TrendAreaChart data={periods} xKey="shortLabel" dataKey="unmatchedLakh" color="#c41e3a" />
              <div className="text-[11px] text-steel-500 mt-2 leading-relaxed">
                {periods.map(p => t('{0}: ₹{1} L unmatched of ₹{2} L ({3}%)', p.shortLabel, p.unmatchedLakh.toFixed(1), p.valueLakh.toFixed(1), p.unmatchedPct)).join(' · ')}
              </div>
            </>
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No e-way bill records match the current filters.')}</div>
          )}
        </Card>
        <Card tone="yellow"
          title={t('District-wise unmatched rate')}
          subtitle={<MethodNote short={t('A district below the statewide rate is not a priority, whatever its volume.')} full={t('Share of each district’s consignments with no matching return. The statewide rate is {0}% — a district below it is not a priority however many records it carries.', kpis.stateUnmatchedPct)} />}
        >
          {districtRisk.length > 0 ? (
            <>
              <RiskBarChart
                data={districtRisk}
                xKey="district"
                barKey="unmatchedPct"
                colorFn={d => (d.unmatchedPct > kpis.stateUnmatchedPct ? '#c41e3a' : '#7e9cc6')}
              />
              <MethodNote className="text-[11px] text-steel-500 mt-2 leading-relaxed" short={t('Districts with very few records swing to 0% or 100% for reasons that are not risk.')} full={t('Bars above {0}% are above the statewide unmatched rate. Districts with very few records will sit at 0% or 100% for reasons that are not risk — read the record count alongside.', kpis.stateUnmatchedPct)} />
            </>
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No district data available for the current filters.')}</div>
          )}
        </Card>
      </div>

      <Card tone="green"
        title={t('Taxpayers ranked by unmatched movement')}
        subtitle={t('{0} taxpayers with at least one unmatched, cancelled or flagged consignment, ranked by the value with no return behind it.', taxpayerRollup.length)}
        className="mb-6"
        actions={<HumanReviewBadge label={t('Officer Review Required')} />}
      >
        <DataTable
          columns={rollupColumns}
          rows={taxpayerRollup}
          searchPlaceholder={t('Search by GSTIN or trade name...')}
          emptyLabel={t('No taxpayer in the current filters carries an unmatched, cancelled or flagged consignment.')}
          pageSize={10}
        />
        <div className="mt-3 rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <MethodNote className="text-[12px] text-steel-700 leading-relaxed" short={t('Not available: a period reconciliation against declared outward supply.')} full={t('Not available on this platform: a period reconciliation of consignment value against declared outward supply. The e-way feed here carries individual consignments dated across a rolling window, while the return record carries a single monthly turnover figure per taxpayer — summing one against the other would compare two different periods and produce a mismatch out of arithmetic rather than behaviour. The match status shown is the one the e-way feed itself carries. A true reconciliation needs GSTR-1 outward supply at invoice level for the same tax period, which this platform does not hold. The "declared movement / turnover" column is the one like-for-like ratio available, and it comes from the taxpayer’s own return record rather than from these consignments.')} />
        </div>
      </Card>

      <Card tone="blue"
        title={t('Consignment register')}
        subtitle={<MethodNote short={t('Use this to check one movement; use the ranking above to decide who to open.')} full={t('{0} of {1} records in scope carry an anomaly flag, a cancellation, or no matching return. Use this to check a specific movement; use the ranking above to decide who to open.', suspiciousRecords.length, kpis.recordCount)} />}
        className="mb-6"
      >
        <DataTable
          columns={columns}
          rows={suspiciousRecords}
          searchPlaceholder={t('Search by GSTIN or trade name...')}
          emptyLabel={t('No suspicious e-way bill patterns match the current filters.')}
        />
      </Card>

      <Card tone="red" title={t('AI-Generated Movement Mismatch Summary')} subtitle={t('Synthesized narrative for the highest-anomaly taxpayer in the current filter set')}>
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
