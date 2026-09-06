import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { WhyFlaggedPanel } from '../components/ui/WhyFlagged.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { REFUND_CASES, taxpayerById, isWithinDateRange } from '../data/mockData.js'
import { generateRefundChecklist } from '../data/ai.js'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { IndianRupee, ShieldAlert, Percent, Repeat, Sparkles, User2, ShieldCheck, UserCheck, Globe, CheckCircle2 } from 'lucide-react'

const STATUS_TONE = {
  'Low Risk': 'green',
  'Needs Officer Review': 'amber',
  'Escalate for Scrutiny': 'red'
}

const REPEAT_CLAIM_THRESHOLD = 1000000 // ₹10 Lakh — proxy threshold for high-value / repeat-pattern claims

// Delegates to the shared case filter so this module cannot drift out of
// step with the others again — division in particular was missing here.
const matchesGlobalFilters = (rec, filters) => applyCaseFilters(rec, filters, 'filedOn')

function bucketRatio(pct) {
  if (pct < 5) return '0–5%'
  if (pct < 10) return '5–10%'
  if (pct < 15) return '10–15%'
  if (pct < 20) return '15–20%'
  return '20%+'
}

export default function RefundRiskIntelligence() {
  const { filters, role, officerName, logAction } = useApp()
  const [statusOverrides, setStatusOverrides] = useState({})
  const [reviewCase, setReviewCase] = useState(null)
  const [checklistOutput, setChecklistOutput] = useState(null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(false)

  const effectiveStatus = c => statusOverrides[c.id] || c.status

  // Case-level RBAC: a Refund Officer is scoped to cases assigned to them by default.
  const isFieldOfficer = role === 'Refund Officer'
  const [showAllCases, setShowAllCases] = useState(false)
  const scopedToMe = isFieldOfficer && !showAllCases

  const filteredCases = useMemo(() => {
    const base = scopedToMe ? REFUND_CASES.filter(c => c.assignedOfficer === officerName) : REFUND_CASES
    return base.filter(c => matchesGlobalFilters(c, filters))
  }, [filters, scopedToMe, officerName])

  const kpis = useMemo(() => {
    const totalClaimedLakh = filteredCases.reduce((s, c) => s + c.claimedAmount, 0) / 100000
    const highRiskCount = filteredCases.filter(c => c.riskCategory === 'High' || c.riskCategory === 'Critical').length
    const avgRatio = filteredCases.length
      ? filteredCases.reduce((s, c) => s + c.refundToTurnoverPct, 0) / filteredCases.length
      : 0
    const repeatProxyCount = filteredCases.filter(c => c.claimedAmount > REPEAT_CLAIM_THRESHOLD).length
    return { totalClaimedLakh, highRiskCount, avgRatio, repeatProxyCount }
  }, [filteredCases])

  const sectorChartData = useMemo(() => {
    const map = new Map()
    filteredCases.forEach(c => {
      const entry = map.get(c.sector) || { sector: c.sector, claimedLakh: 0 }
      entry.claimedLakh += c.claimedAmount / 100000
      map.set(c.sector, entry)
    })
    return [...map.values()]
      .map(d => ({ ...d, claimedLakh: Math.round(d.claimedLakh * 10) / 10 }))
      .sort((a, b) => b.claimedLakh - a.claimedLakh)
  }, [filteredCases])

  const ratioDistribution = useMemo(() => {
    const order = ['0–5%', '5–10%', '10–15%', '15–20%', '20%+']
    const map = new Map(order.map(k => [k, 0]))
    filteredCases.forEach(c => {
      const b = bucketRatio(c.refundToTurnoverPct)
      map.set(b, (map.get(b) || 0) + 1)
    })
    return order.map(k => ({ band: k, count: map.get(k) }))
  }, [filteredCases])

  const openReview = c => {
    setReviewCase(c)
    setChecklistOutput(null)
    setPendingStatus(null)
    setConfirmStatus(false)
  }

  const setStatus = (caseId, status) => {
    setStatusOverrides(prev => ({ ...prev, [caseId]: status }))
  }

  const applyPendingStatus = () => {
    if (!reviewCase || !pendingStatus || !confirmStatus) return
    setStatus(reviewCase.id, pendingStatus)
    logAction(`Updated Refund Status → ${pendingStatus}`, 'Refund Risk Intelligence', reviewCase.gstin)
    setPendingStatus(null)
    setConfirmStatus(false)
  }

  const columns = [
    { key: 'id', label: t('Refund ID') },
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
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    { key: 'claimedAmount', label: t('Claimed Amount'), align: 'right', render: r => `₹${(r.claimedAmount / 100000).toFixed(1)} L` },
    { key: 'refundToTurnoverPct', label: t('Refund/Turnover %'), align: 'right', render: r => `${r.refundToTurnoverPct.toFixed(1)}%` },
    {
      key: 'exportLinked',
      label: t('Export Linked?'),
      align: 'center',
      sortValue: r => (r.exportLinked ? 1 : 0),
      render: r => r.exportLinked ? <Pill tone="navy">{t('Export-Linked')}</Pill> : <Pill tone="steel">{t('Domestic')}</Pill>
    },
    {
      key: 'riskScore',
      label: t('Risk'),
      sortValue: r => r.riskScore,
      render: r => <RiskBadge category={r.riskCategory} score={r.riskScore} />
    },
    {
      key: 'status',
      label: t('Status'),
      sortValue: r => effectiveStatus(r),
      render: r => <Pill tone={STATUS_TONE[effectiveStatus(r)] || 'steel'}>{t(effectiveStatus(r))}</Pill>
    },
    { key: 'assignedOfficer', label: t('Assigned Officer') },
    {
      key: 'action',
      label: t('Action'),
      sortable: false,
      align: 'center',
      render: r => (
        <button
          onClick={() => openReview(r)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-ink-700 text-white hover:bg-ink-800"
        >
          {t('Review')}
        </button>
      )
    }
  ]

  const reviewTaxpayer = reviewCase ? taxpayerById(reviewCase.taxpayerId) : null

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Refund Scrutiny')}
        title={t('Refund Risk Intelligence')}
        description={t('Risk-ranked refund claim scrutiny — combining refund-to-turnover intensity, export linkage and taxpayer risk profile to prioritise officer review before sanction.')}
        actions={<ExportBar moduleLabel="Refund Risk Intelligence" />}
      />

      {isFieldOfficer && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/60">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800">
            {scopedToMe ? <UserCheck className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {/* Same correction as the Audit module: these counts describe the
                filtered register below, not the raw dataset. */}
            {scopedToMe
              ? <>{t('Showing cases assigned to you —')} <strong>{officerName}</strong> {t('({0} of your {1} cases match the current filters)', filteredCases.length, REFUND_CASES.filter(c => c.assignedOfficer === officerName).length)}</>
              : <>{t('Your role can access every refund case — showing {0} of {1} that match the current filters', filteredCases.length, REFUND_CASES.length)}</>}
          </span>
          <button
            onClick={() => setShowAllCases(v => !v)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-navy-300 text-navy-700 bg-white hover:bg-navy-50"
          >
            {scopedToMe ? t('View all statewide cases') : t('Back to my assigned cases')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Total Refund Claims Value')} value={kpis.totalClaimedLakh.toFixed(1)} unit={t('₹ Lakh')} tone="navy" icon={IndianRupee} />
        <KpiCard label={t('High-Risk Refunds')} value={kpis.highRiskCount} unit={t('High / Critical')} tone="red" icon={ShieldAlert} />
        <KpiCard label={t('Avg. Refund-to-Turnover')} value={kpis.avgRatio.toFixed(1)} unit="%" tone="saffron" icon={Percent} />
        <KpiCard label={t('High-Value Claim Pattern')} value={kpis.repeatProxyCount} unit={t('claims > ₹10L (proxy)')} tone="steel" icon={Repeat} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card title={t('Refund Claims by Sector')} subtitle={t('Total claimed amount (₹ Lakh) grouped by sector')}>
          {sectorChartData.length > 0 ? (
            <RiskBarChart data={sectorChartData} xKey="sector" barKey="claimedLakh" />
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No refund cases match the current filters.')}</div>
          )}
        </Card>
        <Card title={t('Refund-to-Turnover Ratio Distribution')} subtitle={t('Number of claims by refund-to-turnover band')}>
          {filteredCases.length > 0 ? (
            <RiskBarChart data={ratioDistribution} xKey="band" barKey="count" colorFn={d => d.band === '20%+' ? '#c41e3a' : d.band === '15–20%' ? '#d9631c' : '#204575'} />
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No refund cases match the current filters.')}</div>
          )}
        </Card>
      </div>

      <Card title={t('Refund Case Register')} subtitle={t('Filterable via global district / sector / risk filters and free-text search')} actions={<HumanReviewBadge label={t('Officer Review Required')} />}>
        <DataTable
          columns={columns}
          rows={filteredCases}
          searchPlaceholder={t('Search by GSTIN or trade name...')}
          emptyLabel={t('No refund cases match the current filters.')}
        />
      </Card>

      <Modal
        open={!!reviewCase}
        onClose={() => setReviewCase(null)}
        size="xl"
        title={reviewCase ? t('Refund Case Review — {0}', reviewCase.tradeName) : ''}
        subtitle={reviewCase ? `${reviewCase.id} · ${reviewCase.gstin}` : ''}
      >
        {reviewCase && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge category={reviewCase.riskCategory} score={reviewCase.riskScore} />
              <Pill tone={STATUS_TONE[effectiveStatus(reviewCase)] || 'steel'}>{t(effectiveStatus(reviewCase))}</Pill>
              {reviewCase.exportLinked && <Pill tone="navy">{t('Export-Linked')}</Pill>}
              <Pill tone="steel">{t(reviewCase.sector)}</Pill>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{t('Claim Details')}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label={t('Claimed Amount')} value={`₹${(reviewCase.claimedAmount / 100000).toFixed(1)} L`} />
                  <Stat label={t('Refund / Turnover')} value={`${reviewCase.refundToTurnoverPct.toFixed(1)}%`} />
                  <Stat label={t('Filed On')} value={reviewCase.filedOn} />
                  <Stat label={t('Assigned Officer')} value={reviewCase.assignedOfficer} />
                  <Stat label={t('District')} value={reviewCase.district} />
                  <Stat label={t('Export Linked')} value={reviewCase.exportLinked ? t('Yes') : t('No')} />
                </div>
                <button
                  onClick={() => reviewTaxpayer && setSelectedTaxpayer(reviewTaxpayer)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50"
                >
                  <User2 className="w-3.5 h-3.5" /> {t('View Taxpayer 360')}
                </button>
              </div>
              {reviewTaxpayer ? <WhyFlaggedPanel taxpayer={reviewTaxpayer} /> : (
                <div className="text-xs text-steel-500">{t('Taxpayer profile unavailable for risk indicators.')}</div>
              )}
            </div>

            <div>
              <button
                onClick={() => setChecklistOutput(generateRefundChecklist(reviewCase))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800 mb-3"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t('Generate Refund Verification Checklist')}
              </button>
              {checklistOutput && <AIOutputPanel output={checklistOutput} />}
            </div>

            <div className="pt-4 border-t border-steel-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{t('Workflow Action')}</div>
                <HumanReviewBadge />
              </div>
              <p className="text-[11px] text-steel-500 mb-2">{t('Select a status, then confirm review to apply it — this mirrors the same maker-checker step used in Audit & Scrutiny.')}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setPendingStatus('Low Risk')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${pendingStatus === 'Low Risk' ? 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-200' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                >
                  {t('Mark Low Risk')}
                </button>
                <button
                  onClick={() => setPendingStatus('Needs Officer Review')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${pendingStatus === 'Needs Officer Review' ? 'border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                >
                  {t('Needs Officer Review')}
                </button>
                <button
                  onClick={() => setPendingStatus('Escalate for Scrutiny')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${pendingStatus === 'Escalate for Scrutiny' ? 'border-red-500 bg-red-100 text-red-900 ring-2 ring-red-200' : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'}`}
                >
                  {t('Escalate for Scrutiny')}
                </button>
              </div>

              {pendingStatus && (
                <div className="rounded-lg border border-steel-200 bg-steel-50 p-3 mb-3">
                  <label className="flex items-start gap-2 text-xs text-navy-800 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmStatus}
                      onChange={e => setConfirmStatus(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>{t('I confirm officer review is complete — risk indicators and supporting data for this refund case have been examined, and I am setting status to')} <strong>{t(pendingStatus)}</strong>.</span>
                  </label>
                  <button
                    disabled={!confirmStatus}
                    onClick={applyPendingStatus}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('Apply Status Change')}
                  </button>
                </div>
              )}

              <div className="flex items-start gap-1.5 text-[11px] text-steel-500">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
                <span>{t('By design, this system provides no auto-reject action. Refund claims can only be routed for officer review, escalated for scrutiny, or marked low risk — final sanction or rejection decisions remain exclusively with the authorised Refund Officer under statutory process.')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
