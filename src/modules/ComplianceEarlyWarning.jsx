import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
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
  Bell, UserCheck, CheckCircle2, ListFilter, Eye, Users2,
  ClipboardList, Sparkles
} from 'lucide-react'

const STATUS_OPTIONS = ['All Statuses', 'Open', 'Outreach Sent', 'Officer Reviewing', 'Resolved']
const TYPE_OPTIONS = ['All Alert Types', ...EARLY_WARNING_TYPES.map(w => w.type)]

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
    const daysAgo = Math.floor((today - d) / (1000 * 60 * 60 * 24))
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

  // ---- KPIs ----
  const totalOpen = globallyFiltered.filter(a => effectiveStatus(a) === 'Open').length
  const reviewQueueSize = globallyFiltered.filter(a => effectiveStatus(a) === 'Officer Reviewing').length
  const resolvedThisMonth = globallyFiltered.filter(a => effectiveStatus(a) === 'Resolved').length
  const activeTypeCount = new Set(globallyFiltered.map(a => a.type)).size

  const typeBreakdown = useMemo(() => {
    const counts = {}
    EARLY_WARNING_TYPES.forEach(w => { counts[w.type] = 0 })
    globallyFiltered.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1 })
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  }, [globallyFiltered])

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
    { key: 'status', label: t('Status'), render: r => <StatusPill status={effectiveStatus(r)} /> },
    { key: 'raisedOn', label: t('Raised On') },
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
        description={t('Proactive detection of filing, payment and behavioural anomalies — enabling outreach and officer review before escalation to formal enforcement action.')}
        actions={<ExportBar />}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Total Open Alerts')} value={totalOpen} tone="red" icon={Bell} />
        <KpiCard label={t('Officer Review Queue')} value={reviewQueueSize} tone="saffron" icon={UserCheck} />
        <KpiCard label={t('Resolved')} value={resolvedThisMonth} tone="green" icon={CheckCircle2} />
        <KpiCard label={t('Alert Types Active')} value={activeTypeCount} unit={t('of {0}', EARLY_WARNING_TYPES.length)} tone="steel" icon={ListFilter} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title={t('Alerts by Type')} subtitle={t('Breakdown of early-warning signals — respects global filters')}>
          <RiskBarChart data={typeBreakdown} xKey="type" barKey="count" colorFn={() => '#204575'} />
        </Card>
        <Card title={t('Alert Volume Trend')} subtitle={t('Alerts raised, bucketed over the last ~48 days')}>
          <RiskBarChart data={weeklyTrend} xKey="period" barKey="count" colorFn={() => '#f78c0a'} />
        </Card>
      </div>

      {/* Alert feed */}
      <Card
        title={t('Early Warning Alert Feed')}
        subtitle={t('Searchable, filterable register of active compliance signals')}
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
      <Card
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
                    <div className="text-[11px] text-steel-500 truncate">{a.gstin} · {a.district} · {a.sector} · {t('Raised')} {a.raisedOn}</div>
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
              <RiskBadge category={riskCategoryFromScore(selectedAlert.riskScore)} score={selectedAlert.riskScore} />
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

function StatusPill({ status }) {
  const toneMap = {
    'Open': 'red',
    'Outreach Sent': 'amber',
    'Officer Reviewing': 'navy',
    'Resolved': 'green'
  }
  return <Pill tone={toneMap[status] || 'steel'}>{t(status)}</Pill>
}
