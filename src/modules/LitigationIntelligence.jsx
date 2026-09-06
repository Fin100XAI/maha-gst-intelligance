import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useChartPalette } from '../components/ui/Charts.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { StatutoryReviewBanner } from '../components/ui/StatutoryFlag.jsx'
import { LITIGATION_CASES, LEGAL_ISSUES, taxpayerById, isWithinDateRange } from '../data/mockData.js'
import { summarizeLitigationRisk } from '../data/ai.js'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { t, getLocale } from '../i18n/index.js'
import { Scale, TrendingUp, RotateCcw, Lock, AlertOctagon, GraduationCap, FileWarning } from 'lucide-react'

const tooltipStyle = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #d3d7de', boxShadow: '0 4px 16px rgba(15,35,64,0.12)' },
  labelStyle: { fontWeight: 600, color: '#0f2340' }
}

const HIGH_VALUE_THRESHOLD = 5000000

function adverseTone(risk) {
  return risk === 'High' ? 'red' : risk === 'Medium' ? 'amber' : 'green'
}

// Was missing both division and risk level — a Commissioner filtering to
// "Pune Division" or "Critical" saw the full litigation pipeline regardless.
const matchesLitigationFilters = (lit, filters) => applyCaseFilters(lit, filters, 'filedOn')

function documentationRecommendation(litCase) {
  const pos = litCase.departmentPosition
  // Marathi has no letter-casing, so the lower-cased mid-sentence issue reference only
  // applies to the English reading; the Marathi reading uses the catalogue's issue label as-is.
  const issueLabel = getLocale() === 'mr' ? t(litCase.issue) : litCase.issue.toLowerCase()
  if (pos === 'Weak — documentation gap') {
    return {
      tone: 'red',
      heading: t('Documentation improvement required'),
      text: t("Case file lacks sufficient contemporaneous evidence to support the department's position on {0}. Recommend collating GSTR-2B reconciliation statements, e-way bill trail and supplier confirmation letters before the next hearing, and formally placing them on record with a covering note.", issueLabel)
    }
  }
  if (pos === 'Weak — precedent unfavourable') {
    return {
      tone: 'red',
      heading: t('Legal position needs strengthening'),
      text: t("Existing appellate/tribunal precedent on {0} is currently unfavourable to the department's stand. Recommend consulting the Legal Cell for an alternative distinguishing argument or, where warranted, evaluating settlement/withdrawal to avoid an adverse order at a higher forum.", issueLabel)
    }
  }
  if (pos === 'Moderate') {
    return {
      tone: 'amber',
      heading: t('Position adequate — minor reinforcement suggested'),
      text: t('Department position is reasonably supported. Recommend a final review of the reply/counter-affidavit for completeness and ensuring all annexures referenced are on file prior to hearing.')
    }
  }
  return {
    tone: 'green',
    heading: t('Position well supported'),
    text: t('Documentation and legal reasoning for this case are adequately supported. No immediate corrective action required; maintain current filing discipline for the next hearing.')
  }
}

export default function LitigationIntelligence() {
  const { filters } = useApp()
  const chartColors = useChartPalette()
  const [selectedCase, setSelectedCase] = useState(null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  const filteredCases = useMemo(
    () => LITIGATION_CASES.filter(c => matchesLitigationFilters(c, filters)),
    [filters]
  )

  const summary = useMemo(() => {
    const resolved = filteredCases.filter(c => c.stage === 'Order Confirmed' || c.stage === 'Order Reversed')
    const confirmed = resolved.filter(c => c.stage === 'Order Confirmed').length
    const reversedOrders = resolved.length - confirmed
    return {
      totalAppeals: filteredCases.length,
      departmentSuccessRatePct: resolved.length ? Math.round((confirmed / resolved.length) * 100) : 0,
      reversedOrders,
      recoveryLockedCr: Math.round(filteredCases.reduce((s, c) => s + c.disputedAmount, 0) / 10000000)
    }
  }, [filteredCases])

  const highValuePending = useMemo(
    () => filteredCases.filter(
      c => c.disputedAmount > HIGH_VALUE_THRESHOLD && c.stage !== 'Order Confirmed' && c.stage !== 'Order Reversed'
    ).length,
    [filteredCases]
  )

  const issueChartData = useMemo(() => {
    const counts = {}
    LEGAL_ISSUES.forEach(issue => { counts[issue] = 0 })
    filteredCases.forEach(c => { counts[c.issue] = (counts[c.issue] || 0) + 1 })
    return Object.entries(counts).map(([issue, count]) => ({ issue, count })).sort((a, b) => b.count - a.count)
  }, [filteredCases])

  const ageingBuckets = useMemo(() => {
    const buckets = { '< 90 days': 0, '90 – 365 days': 0, '365+ days': 0 }
    filteredCases.forEach(c => {
      if (c.ageingDays < 90) buckets['< 90 days']++
      else if (c.ageingDays <= 365) buckets['90 – 365 days']++
      else buckets['365+ days']++
    })
    return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }))
  }, [filteredCases])

  const trainingSignals = useMemo(() => {
    const weakCases = filteredCases.filter(c => c.departmentPosition.startsWith('Weak'))
    const docGap = weakCases.filter(c => c.departmentPosition === 'Weak — documentation gap').length
    const precedent = weakCases.filter(c => c.departmentPosition === 'Weak — precedent unfavourable').length
    const total = weakCases.length
    const docGapPct = total ? Math.round((docGap / total) * 100) : 0
    const precedentPct = total ? Math.round((precedent / total) * 100) : 0
    return { total, docGap, precedent, docGapPct, precedentPct }
  }, [filteredCases])

  const aiSummary = selectedCase ? summarizeLitigationRisk(selectedCase) : null
  const docRec = selectedCase ? documentationRecommendation(selectedCase) : null

  const columns = [
    { key: 'id', label: t('Case ID') },
    {
      key: 'tradeName', label: t('GSTIN / Trade Name'), render: c => (
        <div>
          <div className="font-semibold text-navy-800">{c.tradeName}</div>
          <div className="text-[11px] text-steel-500">{c.gstin}</div>
        </div>
      )
    },
    { key: 'sector', label: t('Sector') },
    { key: 'district', label: t('District') },
    { key: 'issue', label: t('Legal Issue'), render: c => <Pill tone="navy">{t(c.issue)}</Pill> },
    { key: 'stage', label: t('Stage'), render: c => t(c.stage) },
    {
      key: 'disputedAmount', label: t('Disputed Amount'), align: 'right', sortValue: c => c.disputedAmount,
      render: c => `₹${(c.disputedAmount / 100000).toFixed(1)}L`
    },
    { key: 'ageingDays', label: t('Ageing (days)'), align: 'right' },
    {
      key: 'adverseOutcomeRisk', label: t('Adverse Outcome Risk'), align: 'center',
      render: c => <Pill tone={adverseTone(c.adverseOutcomeRisk)}>{t(c.adverseOutcomeRisk)}</Pill>
    },
    { key: 'departmentPosition', label: t('Department Position'), render: c => t(c.departmentPosition) },
    {
      key: 'action', label: '', sortable: false, render: c => (
        <button
          onClick={e => { e.stopPropagation(); setSelectedCase(c) }}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-ink-700 text-white hover:bg-ink-800"
        >{t('View')}</button>
      )
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Enforcement')}
        title={t('Litigation Intelligence')}
        description={t("Appeal and order intelligence across the department's litigation pipeline — legal issue trends, ageing, adverse outcome risk and AI-assisted case review.")}
        actions={<ExportBar />}
      />

      <StatutoryReviewBanner records={filteredCases} context={t('litigation cases')} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label={t('Total Appeals')} value={summary.totalAppeals} icon={Scale} tone="navy" />
        <KpiCard label={t('Dept. Success Rate')} value={summary.departmentSuccessRatePct} unit="%" icon={TrendingUp} tone="green" />
        <KpiCard label={t('Orders Reversed')} value={summary.reversedOrders} icon={RotateCcw} tone="red" />
        {/* This sums `disputedAmount` — money under appeal, not money recovered.
            "Recovery Locked" read as revenue already secured. */}
        <KpiCard label={t('Amount Under Dispute')} value={summary.recoveryLockedCr.toLocaleString('en-IN')} unit={t('Cr')} icon={Lock} tone="saffron" />
        {/* HIGH_VALUE_THRESHOLD is 5,000,000 — ₹50 Lakh, not ₹5 Cr. The unit
            label overstated the threshold tenfold and disagreed with Reports &
            Briefing Notes, which described the same cut correctly. */}
        <KpiCard label={t('High-Value Pending')} value={highValuePending} unit={t('> ₹50L')} icon={AlertOctagon} tone="steel" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title={t('Common Issues Under Dispute')} subtitle={t('Litigation cases by legal issue category')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={issueChartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="issue" tickFormatter={t} tick={{ fontSize: 9, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={90} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} labelFormatter={t} />
              <Bar dataKey="count" name={t('Cases')} fill={chartColors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('Case Ageing Distribution')} subtitle={t('Days since appeal filed')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ageingBuckets} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="bucket" tickFormatter={t} tick={{ fontSize: 10.5, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} labelFormatter={t} />
              <Bar dataKey="count" name={t('Cases')} radius={[4, 4, 0, 0]}>
                {ageingBuckets.map((b, i) => (
                  <Cell key={i} fill={i === 0 ? '#1f8a4c' : i === 1 ? '#d99a15' : '#c41e3a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {ageingBuckets.map(b => (
              <div key={b.bucket} className="px-2 py-2 rounded-lg bg-steel-50 border border-steel-100 text-center">
                <div className="text-[10px] text-steel-500">{t(b.bucket)}</div>
                <div className="text-sm font-bold text-navy-900">{b.count}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title={t('Officer Training Signals')} subtitle={t('Pattern analysis of weak department positions across litigation cases')} className="mb-6">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-navy-50 border border-navy-100 shrink-0"><GraduationCap className="w-4 h-4 text-navy-700" /></span>
          <div className="space-y-2 text-xs text-navy-800">
            {trainingSignals.total === 0 ? (
              <p className="text-steel-500">{t('No weak-position cases identified in the current litigation register.')}</p>
            ) : (
              <>
                <p>
                  <strong>{trainingSignals.docGapPct}%</strong> {t('of weak-position cases')} {t('({0} of {1})', trainingSignals.docGap, trainingSignals.total)} {t('relate to')}
                  <strong> {t('documentation gaps')}</strong> — {t('recommend a refresher training on evidence collection and case-file discipline for audit and assessment officers.')}
                </p>
                <p>
                  <strong>{trainingSignals.precedentPct}%</strong> {t('of weak-position cases')} {t('({0} of {1})', trainingSignals.precedent, trainingSignals.total)} {t('relate to')} <strong>{t('unfavourable precedent')}</strong> — {t('recommend routing these categories through the Legal Cell early, and briefing field officers on current appellate/tribunal trends for the affected issue categories.')}
                </p>
              </>
            )}
            <div className="pt-1"><HumanReviewBadge label={t('Advisory signal — training plan requires Commissioner approval')} /></div>
          </div>
        </div>
      </Card>

      <Card title={t('Litigation Case Register')} subtitle={t('Respects global district / sector / search filters')}>
        <DataTable columns={columns} rows={filteredCases} onRowClick={c => setSelectedCase(c)} searchPlaceholder={t('Search case, GSTIN, trade name...')} />
      </Card>

      <Modal
        open={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        size="xl"
        title={selectedCase ? `${selectedCase.id} — ${selectedCase.tradeName}` : ''}
        subtitle={selectedCase ? `${selectedCase.gstin} · ${selectedCase.sector} · ${selectedCase.district}` : ''}
      >
        {selectedCase && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Stat label={t('Legal Issue')} value={t(selectedCase.issue)} />
              <Stat label={t('Stage')} value={t(selectedCase.stage)} />
              <Stat label={t('Disputed Amount')} value={`₹${(selectedCase.disputedAmount / 100000).toFixed(1)}L`} />
              <Stat label={t('Filed On')} value={selectedCase.filedOn} />
              <Stat label={t('Ageing')} value={t('{0} days', selectedCase.ageingDays)} />
              <Stat label={t('Adverse Outcome Risk')} value={t(selectedCase.adverseOutcomeRisk)} tone={selectedCase.adverseOutcomeRisk === 'High' ? 'bad' : selectedCase.adverseOutcomeRisk === 'Medium' ? 'warn' : 'good'} />
              <Stat label={t('Department Position')} value={t(selectedCase.departmentPosition)} />
            </div>

            <div>
              <div className="text-xs font-semibold text-navy-800 mb-2">{t('AI Litigation Risk Summary')}</div>
              <AIOutputPanel output={aiSummary} />
            </div>

            {docRec && (() => {
              const t = TONE_STYLES[docRec.tone] || TONE_STYLES.steel
              return (
                <div className="rounded-xl border p-4" style={{ backgroundColor: t.bg, borderColor: t.border }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileWarning className="w-4 h-4" style={{ color: t.accent }} />
                    <span className="text-sm font-bold text-navy-900">{docRec.heading}</span>
                  </div>
                  <p className="text-xs text-navy-800">{docRec.text}</p>
                </div>
              )
            })()}

            <div className="flex items-center justify-between pt-2 border-t border-steel-100">
              <button
                onClick={() => setSelectedTaxpayer(taxpayerById(selectedCase.taxpayerId))}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 bg-white text-navy-700 hover:bg-navy-50"
              >{t('View Taxpayer 360')}</button>
              <ExportBar />
            </div>
          </div>
        )}
      </Modal>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function Stat({ label, value, tone }) {
  const toneCls = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-maharisk-critical' : tone === 'warn' ? 'text-maharisk-medium' : 'text-navy-900'
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${toneCls}`}>{value}</div>
    </div>
  )
}
