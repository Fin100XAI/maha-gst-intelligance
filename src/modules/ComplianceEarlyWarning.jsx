import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { COMPLIANCE_ALERTS, EARLY_WARNING_TYPES, taxpayerById, REFERENCE_DATE } from '../data/mockData.js'
import { riskCategoryFromScore } from '../data/risk.js'
import { generateComplianceNudge } from '../data/ai.js'
import { t } from '../i18n/index.js'
import {
  Bell, UserCheck, CheckCircle2, Clock, Eye, Users2,
  ClipboardList, Sparkles, Layers
} from 'lucide-react'

const STATUS_OPTIONS = ['All Statuses', 'Open', 'Outreach Sent', 'Officer Reviewing', 'Resolved']
const TYPE_OPTIONS = ['All Alert Types', ...EARLY_WARNING_TYPES.map(w => w.type)]

const DAY_MS = 1000 * 60 * 60 * 24
const pctOf = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0)
const cr = n => Math.round((n / 10000000) * 100) / 100
const ageOf = alert => Math.max(0, Math.floor((REFERENCE_DATE - new Date(alert.raisedOn)) / DAY_MS))
const exposureOf = alert => taxpayerById(alert.taxpayerId)?.estimatedRevenueExposure ?? 0
const turnoverOf = alert => taxpayerById(alert.taxpayerId)?.monthlyTurnover ?? 0

/* Exposure summed over ALERTS would double-count every taxpayer carrying more
 * than one signal, and most of them do. It is summed over distinct taxpayers
 * instead, which is what the department is actually exposed to. */
function exposureOfDistinct(alerts) {
  const seen = new Set()
  let total = 0
  alerts.forEach(a => {
    if (seen.has(a.taxpayerId)) return
    seen.add(a.taxpayerId)
    total += exposureOf(a)
  })
  return { taxpayers: seen.size, exposure: total }
}

function medianAge(alerts) {
  if (!alerts.length) return 0
  const ages = alerts.map(ageOf).sort((a, b) => a - b)
  const m = Math.floor(ages.length / 2)
  return ages.length % 2 ? ages[m] : Math.round((ages[m - 1] + ages[m]) / 2)
}

/* An early warning has a shelf life. These bands exist because the same alert
 * means a different thing at 20 days and at 120: one is a nudge, the other is
 * evidence the nudge was never sent. */
const AGE_BANDS = [
  { id: '0-30', label: 'Raised within 30 days', min: 0, max: 30, meaning: 'Still early. Automated outreach resolves most of these without any officer time.' },
  { id: '31-60', label: '31 to 60 days', min: 31, max: 60, meaning: 'Outreach has had time to work. Where it has not, this is where officer review belongs.' },
  { id: '61-90', label: '61 to 90 days', min: 61, max: 90, meaning: 'No longer early. A quarter of filing periods has passed and the shortfall has compounded through each of them.' },
  { id: '90+', label: 'Older than 90 days', min: 91, max: Infinity, meaning: 'Early warning has failed on these. They belong in the enforcement pipeline rather than in an outreach queue.' }
]

function buildWeeklyBuckets(alerts) {
  const today = REFERENCE_DATE
  const bucketCount = 6
  const bucketSize = 8 // days per bucket, ~48 day window
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const end = new Date(today); end.setDate(end.getDate() - i * bucketSize)
    const start = new Date(end); start.setDate(start.getDate() - (bucketSize - 1))
    return { start, end, count: 0 }
  }).reverse() // oldest first
  alerts.forEach(a => {
    const d = new Date(a.raisedOn)
    const daysAgo = Math.floor((today - d) / DAY_MS)
    const idxFromToday = Math.min(bucketCount - 1, Math.max(0, Math.floor(daysAgo / bucketSize)))
    const idx = bucketCount - 1 - idxFromToday
    if (buckets[idx]) buckets[idx].count++
  })
  const fmt = d => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  return buckets.map(b => ({ period: `${fmt(b.start)}–${fmt(b.end)}`, count: b.count }))
}

export default function ComplianceEarlyWarning() {
  const { filters } = useApp()
  const [typeFilter, setTypeFilter] = useState('All Alert Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [drilldownTaxpayer, setDrilldownTaxpayer] = useState(null)
  const [statusOverrides, setStatusOverrides] = useState({})

  const effectiveStatus = alert => statusOverrides[alert.id] || alert.status

  // Alerts are not taxpayer-shaped, so they go through the shared case filter.
  // This previously ignored division, and ignored the date range even though
  // every alert carries a `raisedOn` date — so narrowing to "Last 3 Months"
  // changed nothing on this screen.
  const matchesGlobalFilters = a => applyCaseFilters(a, filters, 'raisedOn')

  const globallyFiltered = useMemo(() => COMPLIANCE_ALERTS.filter(matchesGlobalFilters), [filters])

  const locallyFiltered = useMemo(() => globallyFiltered.filter(a => {
    if (typeFilter !== 'All Alert Types' && a.type !== typeFilter) return false
    if (statusFilter !== 'All Statuses' && effectiveStatus(a) !== statusFilter) return false
    return true
  }), [globallyFiltered, typeFilter, statusFilter, statusOverrides])

  /* The headline figures. A count of open alerts says how much work is queued;
   * it says nothing about what is at stake if the queue is not worked, which is
   * the only reason to prioritise this screen over any other. Both are here. */
  const kpis = useMemo(() => {
    const open = globallyFiltered.filter(a => effectiveStatus(a) !== 'Resolved')
    const openDistinct = exposureOfDistinct(open)
    const nonFilerOpen = open.filter(a => a.type === 'Non-Filer Alert')
    const nonFilerDistinct = exposureOfDistinct(nonFilerOpen)
    const nonFilerTurnover = (() => {
      const seen = new Set()
      let total = 0
      nonFilerOpen.forEach(a => {
        if (seen.has(a.taxpayerId)) return
        seen.add(a.taxpayerId)
        total += turnoverOf(a)
      })
      return total
    })()
    const stale = open.filter(a => ageOf(a) > 60)
    const resolved = globallyFiltered.filter(a => effectiveStatus(a) === 'Resolved')
    const stateResolved = COMPLIANCE_ALERTS.filter(a => effectiveStatus(a) === 'Resolved').length
    return {
      total: globallyFiltered.length,
      openCount: open.length,
      openSharePct: pctOf(open.length, globallyFiltered.length),
      openTaxpayers: openDistinct.taxpayers,
      openExposureCr: cr(openDistinct.exposure),
      nonFilerCount: nonFilerOpen.length,
      nonFilerTaxpayers: nonFilerDistinct.taxpayers,
      nonFilerTurnoverCr: cr(nonFilerTurnover),
      staleCount: stale.length,
      staleSharePct: pctOf(stale.length, open.length),
      staleExposureCr: cr(exposureOfDistinct(stale).exposure),
      medianOpenAge: medianAge(open),
      resolvedCount: resolved.length,
      resolvedRatePct: pctOf(resolved.length, globallyFiltered.length),
      stateResolvedRatePct: pctOf(stateResolved, COMPLIANCE_ALERTS.length)
    }
  }, [globallyFiltered, statusOverrides])

  /* Ageing of the unresolved queue. This is the parameter the previous version
   * of this screen was missing entirely: it reported how many alerts were open,
   * never how long they had been open, which is the whole difference between an
   * early warning and a record of one that was ignored. */
  const ageing = useMemo(() => {
    const open = globallyFiltered.filter(a => effectiveStatus(a) !== 'Resolved')
    return AGE_BANDS.map(band => {
      const members = open.filter(a => {
        const age = ageOf(a)
        return age >= band.min && age <= band.max
      })
      const distinct = exposureOfDistinct(members)
      return {
        id: band.id,
        label: band.label,
        meaning: band.meaning,
        count: members.length,
        sharePct: pctOf(members.length, open.length),
        taxpayers: distinct.taxpayers,
        exposureCr: cr(distinct.exposure)
      }
    })
  }, [globallyFiltered, statusOverrides])

  /* Alert types with the two things a bar chart of counts cannot carry: what
   * each type is worth, and what an officer does about it. */
  const typeBreakdown = useMemo(() => {
    return EARLY_WARNING_TYPES.map(w => {
      const members = globallyFiltered.filter(a => a.type === w.type)
      const open = members.filter(a => effectiveStatus(a) !== 'Resolved')
      const distinct = exposureOfDistinct(members)
      return {
        id: w.key,
        type: w.type,
        count: members.length,
        sharePct: pctOf(members.length, globallyFiltered.length),
        openCount: open.length,
        taxpayers: distinct.taxpayers,
        exposureCr: cr(distinct.exposure),
        medianAge: medianAge(open),
        recommendedAction: w.recommendedAction
      }
    }).filter(row => row.count > 0).sort((a, b) => b.exposureCr - a.exposureCr)
  }, [globallyFiltered, statusOverrides])

  const typeChartData = useMemo(
    () => typeBreakdown.map(row => ({ type: row.type, count: row.count })),
    [typeBreakdown]
  )

  /* Compliance slipping on several fronts at once. One signal is a lapse; three
   * distinct signals on the same taxpayer in the same window is a trajectory,
   * and it is the population this screen exists to catch before it compounds. */
  const compounding = useMemo(() => {
    const byTaxpayer = new Map()
    globallyFiltered.forEach(a => {
      const entry = byTaxpayer.get(a.taxpayerId) || { id: a.taxpayerId, taxpayerId: a.taxpayerId, tradeName: a.tradeName, gstin: a.gstin, district: a.district, sector: a.sector, riskScore: a.riskScore, types: new Set(), oldest: 0, open: 0 }
      entry.types.add(a.type)
      entry.oldest = Math.max(entry.oldest, ageOf(a))
      if (effectiveStatus(a) !== 'Resolved') entry.open += 1
      byTaxpayer.set(a.taxpayerId, entry)
    })
    const rows = [...byTaxpayer.values()]
      .map(e => ({
        ...e,
        typeCount: e.types.size,
        typeList: [...e.types],
        exposure: taxpayerById(e.taxpayerId)?.estimatedRevenueExposure ?? 0,
        filingStatus: taxpayerById(e.taxpayerId)?.filingStatus ?? null
      }))
      .filter(e => e.typeCount >= 3)
      .sort((a, b) => b.typeCount - a.typeCount || b.exposure - a.exposure)
    return {
      rows,
      totalTaxpayers: byTaxpayer.size,
      exposureCr: cr(rows.reduce((s, e) => s + e.exposure, 0))
    }
  }, [globallyFiltered, statusOverrides])

  const weeklyTrend = useMemo(() => buildWeeklyBuckets(globallyFiltered), [globallyFiltered])

  const reviewQueue = useMemo(
    () => globallyFiltered.filter(a => effectiveStatus(a) === 'Officer Reviewing'),
    [globallyFiltered, statusOverrides]
  )

  const columns = [
    { key: 'type', label: t('Alert Type'), render: r => t(r.type) },
    { key: 'tradeName', label: t('Taxpayer'), render: r => (
      <div>
        <div className="font-semibold text-navy-900">{r.tradeName}</div>
        <div className="text-[11px] text-steel-500">{r.gstin}</div>
      </div>
    ) },
    { key: 'district', label: t('District'), render: r => t(r.district) },
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    { key: 'riskScore', label: t('Risk Score'), align: 'right', render: r => <RiskBadge category={riskCategoryFromScore(r.riskScore)} score={r.riskScore} size="sm" /> },
    {
      key: 'exposure', label: t('Exposure'), align: 'right',
      sortValue: r => exposureOf(r),
      render: r => <span className="tabular-nums">{t('₹{0} L', (exposureOf(r) / 100000).toFixed(1))}</span>
    },
    { key: 'status', label: t('Status'), render: r => <StatusPill status={effectiveStatus(r)} /> },
    {
      key: 'raisedOn', label: t('Age'), align: 'right',
      sortValue: r => ageOf(r),
      render: r => (
        <div className="tabular-nums">
          <div className={ageOf(r) > 60 ? 'font-semibold text-[#C5221F]' : 'text-navy-900'}>{t('{0} days', ageOf(r))}</div>
          <div className="text-[11px] text-steel-500">{r.raisedOn}</div>
        </div>
      )
    },
    { key: 'view', label: '', sortable: false, align: 'right', render: r => (
      <button
        onClick={e => { e.stopPropagation(); setSelectedAlert(r) }}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-navy-900"
      >
        <Eye className="w-3.5 h-3.5" /> {t('View')}
      </button>
    ) }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Proactive Monitoring')}
        title={t('Compliance Early Warning')}
        description={<MethodNote short={t('Slipping compliance, surfaced before the shortfall compounds.')} full={t('Non-filers and slipping compliance, surfaced before the shortfall compounds. Every alert below carries how long it has been open and what is at stake behind it, because an early warning that has sat unworked for a quarter is no longer early.')} />}
        actions={<ExportBar />}
      />

      <FilterScope shown={globallyFiltered.length} total={COMPLIANCE_ALERTS.length} unit={t('alerts')}
        ignores={{
          taxpayerType: 'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.'
        }}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Unresolved alerts')}
          value={kpis.openCount}
          unit={t('of {0} in scope ({1}%) — ₹{2} Cr of exposure across {3} taxpayers', kpis.total, kpis.openSharePct, kpis.openExposureCr, kpis.openTaxpayers)}
          tone="red"
          icon={Bell}
        />
        <KpiCard
          label={t('Open non-filer alerts')}
          value={kpis.nonFilerCount}
          unit={t('{0} taxpayers carrying ₹{1} Cr of monthly turnover with no return filed — the base the shortfall compounds on', kpis.nonFilerTaxpayers, kpis.nonFilerTurnoverCr)}
          tone="saffron"
          icon={UserCheck}
        />
        <KpiCard
          label={t('Open longer than 60 days')}
          value={kpis.staleCount}
          unit={t('of {0} unresolved ({1}%) — ₹{2} Cr behind them; the median unresolved alert is {3} days old', kpis.openCount, kpis.staleSharePct, kpis.staleExposureCr, kpis.medianOpenAge)}
          tone="orange"
          icon={Clock}
        />
        <KpiCard
          label={t('Resolved')}
          value={kpis.resolvedCount}
          unit={t('{0}% of alerts in scope — the statewide resolution rate is {1}%', kpis.resolvedRatePct, kpis.stateResolvedRatePct)}
          tone="green"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card tone="red"
          title={t('How long the unresolved queue has been waiting')}
          subtitle={t('{0} unresolved alerts, banded by age. The band an alert falls into decides what should happen to it, not the alert type.', kpis.openCount)}
        >
          <DataTable
            columns={[
              { key: 'label', label: t('Age band'), render: row => t(row.label) },
              {
                key: 'count', label: t('Alerts'), align: 'right',
                sortValue: row => row.count,
                render: row => (
                  <div className="tabular-nums">
                    <div className={row.id === '90+' && row.count > 0 ? 'font-semibold text-[#C5221F]' : 'text-navy-900'}>{row.count}</div>
                    <div className="text-[11px] text-steel-500">{t('{0}% of unresolved', row.sharePct)}</div>
                  </div>
                )
              },
              { key: 'taxpayers', label: t('Taxpayers'), align: 'right', sortValue: row => row.taxpayers },
              {
                key: 'exposureCr', label: t('Exposure'), align: 'right',
                sortValue: row => row.exposureCr,
                render: row => <span className="tabular-nums">{t('₹{0} Cr', row.exposureCr)}</span>
              },
              { key: 'meaning', label: t('What it means'), sortable: false, render: row => <span className="text-[11px] text-steel-600 leading-relaxed">{t(row.meaning)}</span> }
            ]}
            rows={ageing}
            searchable={false}
            pageSize={4}
          />
          <MethodNote className="text-[11.5px] text-steel-500 leading-relaxed mt-3" short={t('Summed over taxpayers, not alerts — most carry more than one signal.')} full={t('Exposure is summed over distinct taxpayers, not over alerts — most taxpayers here carry more than one signal, and summing per alert would count the same entity several times.')} />
        </Card>
        <Card tone="yellow"
          title={t('Alert inflow')}
          subtitle={<MethodNote short={t('A rising inflow against a static resolution rate is a staffing signal.')} full={t('Alerts raised per 8-day period over the last ~48 days, out of {0} in scope. A rising inflow against a static resolution rate is a staffing signal, not a risk one.', kpis.total)} />}
        >
          <RiskBarChart data={weeklyTrend} xKey="period" barKey="count" colorFn={() => '#f78c0a'} />
          <div className="mt-4">
            <RiskBarChart data={typeChartData} xKey="type" barKey="count" colorFn={() => '#204575'} height={200} />
            <div className="text-[11px] text-steel-500 mt-2">{t('Alerts by type — the value and recommended action for each are in the table below.')}</div>
          </div>
        </Card>
      </div>

      <Card tone="green"
        title={t('Alert types — what each is worth and what to do about it')}
        subtitle={t('{0} of the {1} signal types are firing in the current scope, ranked by the exposure behind them rather than by count.', typeBreakdown.length, EARLY_WARNING_TYPES.length)}
        className="mb-5"
      >
        <DataTable
          columns={[
            { key: 'type', label: t('Signal'), render: row => t(row.type) },
            {
              key: 'count', label: t('Alerts'), align: 'right',
              sortValue: row => row.count,
              render: row => (
                <div className="tabular-nums">
                  <div className="text-navy-900">{t('{0} open of {1}', row.openCount, row.count)}</div>
                  <div className="text-[11px] text-steel-500">{t('{0}% of all alerts in scope', row.sharePct)}</div>
                </div>
              )
            },
            { key: 'taxpayers', label: t('Taxpayers'), align: 'right', sortValue: row => row.taxpayers },
            {
              key: 'exposureCr', label: t('Exposure'), align: 'right',
              sortValue: row => row.exposureCr,
              render: row => <span className="tabular-nums font-semibold text-navy-900">{t('₹{0} Cr', row.exposureCr)}</span>
            },
            {
              key: 'medianAge', label: t('Median age, open'), align: 'right',
              sortValue: row => row.medianAge,
              render: row => <span className={`tabular-nums ${row.medianAge > 60 ? 'text-[#C5221F] font-semibold' : 'text-steel-600'}`}>{t('{0} days', row.medianAge)}</span>
            },
            {
              key: 'recommendedAction', label: t('Recommended action'), sortable: false,
              render: row => <span className="text-[11px] text-steel-600 leading-relaxed">{t(row.recommendedAction)}</span>
            }
          ]}
          rows={typeBreakdown}
          searchable={false}
          pageSize={9}
        />
      </Card>

      {compounding.rows.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 mb-5 flex items-start gap-3">
          <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-navy-900 mb-1">
              {t('{0} of {1} taxpayers in scope are firing three or more distinct signals at once, carrying ₹{2} Cr.', compounding.rows.length, compounding.totalTaxpayers, compounding.exposureCr)}
            </div>
            <MethodNote className="text-[12.5px] text-steel-700 leading-relaxed mb-2" short={t('One signal is a lapse; three at once is a trajectory.')} full={t('One signal is a lapse. Three at once, in the same window, is a trajectory — and it is the population this screen exists to reach before the shortfall compounds. These should be worked ahead of any single-signal alert of the same age, whatever their individual risk scores say.')} />
            <div className="flex flex-wrap gap-1.5">
              {compounding.rows.slice(0, 8).map(row => (
                <span key={row.id} className="text-[11px] px-2 py-0.5 rounded-md border border-amber-200 bg-white text-navy-800">
                  {row.tradeName} · {t('{0} signals', row.typeCount)} · {t('oldest {0} days', row.oldest)}
                  {row.filingStatus ? ` · ${t(row.filingStatus)}` : ''}
                </span>
              ))}
              {compounding.rows.length > 8 && (
                <span className="text-[11px] text-steel-600">{t('and {0} more', compounding.rows.length - 8)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert feed */}
      <Card tone="blue"
        title={t('Early Warning Alert Feed')}
        subtitle={t('Showing {0} of {1} alerts in scope. Sort by age to find the ones the outreach never reached.', locallyFiltered.length, globallyFiltered.length)}
        className="mb-5"
        actions={
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-xs px-2.5 py-1.5 rounded-lg border border-steel-200 bg-white text-steel-700">
              {TYPE_OPTIONS.map(o => <option key={o} value={o}>{t(o)}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs px-2.5 py-1.5 rounded-lg border border-steel-200 bg-white text-steel-700">
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{t(o)}</option>)}
            </select>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={locallyFiltered}
          onRowClick={row => setSelectedAlert(row)}
          searchPlaceholder={t('Search GSTIN / trade name...')}
        />
      </Card>

      {/* Officer review queue */}
      <Card tone="red"
        title={t('Officer Review Queue')}
        subtitle={t('Alerts currently under officer review — status updates are local to this session')}
        actions={<span className="inline-flex items-center gap-1 text-[11px] text-steel-500"><Users2 className="w-3.5 h-3.5" /> {t('{0} in queue', reviewQueue.length)}</span>}
      >
        {reviewQueue.length === 0 ? (
          <div className="text-xs text-steel-500 py-6 text-center">{t('No alerts currently in the officer review queue.')}</div>
        ) : (
          <div className="space-y-2">
            {reviewQueue.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-steel-200 bg-steel-50/60">
                <div className="min-w-0 flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-navy-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-navy-900 truncate">{t(a.type)} — {a.tradeName}</div>
                    <div className="text-[11px] text-steel-500 truncate">
                      {a.gstin} · {t(a.district)} · {t(a.sector)} · {t('{0} days old', ageOf(a))} · {t('₹{0} L exposure', (exposureOf(a) / 100000).toFixed(1))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RiskBadge category={riskCategoryFromScore(a.riskScore)} score={a.riskScore} size="sm" />
                  <button
                    onClick={() => setStatusOverrides(prev => ({ ...prev, [a.id]: 'Resolved' }))}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {t('Mark Resolved')}
                  </button>
                  <button
                    onClick={() => setSelectedAlert(a)}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-steel-200 text-navy-700 hover:bg-steel-50"
                  >
                    {t('View')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Alert detail / nudge modal */}
      <Modal
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        size="lg"
        title={selectedAlert ? t(selectedAlert.type) : undefined}
        subtitle={selectedAlert ? `${selectedAlert.tradeName} · ${selectedAlert.gstin}` : ''}
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="navy">{t(selectedAlert.district)}</Pill>
              <Pill tone="steel">{t(selectedAlert.sector)}</Pill>
              <Pill tone="amber">{t('Status')}: {t(effectiveStatus(selectedAlert))}</Pill>
              <Pill tone={ageOf(selectedAlert) > 60 ? 'red' : 'steel'}>{t('Open {0} days, raised {1}', ageOf(selectedAlert), selectedAlert.raisedOn)}</Pill>
              <RiskBadge category={riskCategoryFromScore(selectedAlert.riskScore)} score={selectedAlert.riskScore} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <AlertStat label={t('Exposure carried')} value={t('₹{0} L', (exposureOf(selectedAlert) / 100000).toFixed(1))} />
              <AlertStat label={t('Monthly turnover')} value={t('₹{0} L', (turnoverOf(selectedAlert) / 100000).toFixed(1))} />
              <AlertStat
                label={t('Other signals on this taxpayer')}
                value={t('{0} of {1} types', new Set(globallyFiltered.filter(a => a.taxpayerId === selectedAlert.taxpayerId).map(a => a.type)).size, EARLY_WARNING_TYPES.length)}
              />
            </div>
            <div className="rounded-xl border border-steel-200 bg-steel-50 p-3.5 text-xs text-navy-800">
              <div className="font-semibold text-navy-900 mb-1">{t('Recommended Action (System)')}</div>
              {t(selectedAlert.recommendedAction)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-steel-500 mb-2"><Sparkles className="w-3.5 h-3.5" /> {t('AI-Generated Taxpayer Outreach')}</div>
              <AIOutputPanel output={generateComplianceNudge(selectedAlert)} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-steel-100">
              <button
                onClick={() => {
                  const tp = taxpayerById(selectedAlert.taxpayerId)
                  if (tp) setDrilldownTaxpayer(tp)
                }}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800"
              >
                {t('View Taxpayer 360')}
              </button>
              {effectiveStatus(selectedAlert) !== 'Resolved' && (
                <button
                  onClick={() => { setStatusOverrides(prev => ({ ...prev, [selectedAlert.id]: 'Resolved' })); setSelectedAlert(null) }}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {t('Mark Resolved')}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <TaxpayerDrilldownModal taxpayer={drilldownTaxpayer} open={!!drilldownTaxpayer} onClose={() => setDrilldownTaxpayer(null)} />
    </div>
  )
}

function AlertStat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
    </div>
  )
}

function StatusPill({ status }) {
  const toneMap = {
    'Open': 'red',
    'Outreach Sent': 'amber',
    'Officer Reviewing': 'navy',
    'Resolved': 'green'
  }
  return <Pill tone={toneMap[status] || 'steel'}>{t(status)}</Pill>
}
