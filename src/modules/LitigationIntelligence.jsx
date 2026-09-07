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
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { ComparableCases } from '../components/shared/ComparableCases.jsx'
import { StatutoryReviewBanner } from '../components/ui/StatutoryFlag.jsx'
import { LITIGATION_CASES, LITIGATION_SUMMARY, LEGAL_ISSUES, taxpayerById } from '../data/mockData.js'
import { summarizeLitigationRisk } from '../data/ai.js'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { t, getLocale } from '../i18n/index.js'
import { Scale, Lock, RotateCcw, AlertOctagon, GraduationCap, FileWarning, Landmark } from 'lucide-react'

const tooltipStyle = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #d3d7de', boxShadow: '0 4px 16px rgba(15,35,64,0.12)' },
  labelStyle: { fontWeight: 600, color: '#0f2340' }
}

const HIGH_VALUE_THRESHOLD = 5000000

/* The appeal ladder as the statute lays it out: first appeal to the Appellate
 * Authority, second to the Tribunal, then the three ways a proceeding ends.
 * These are the `stage` values the register actually carries — the order is the
 * only thing added here, and exposure is tracked along it. */
const PENDING_STAGES = ['Pending at Appellate Authority', 'Pending at Tribunal']
const CONCLUDED_STAGES = ['Order Confirmed', 'Order Reversed', 'Remanded']
const STAGE_LADDER = [...PENDING_STAGES, ...CONCLUDED_STAGES]

const crn = n => Math.round((n / 10000000) * 100) / 100
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const sumBy = (rows, f) => rows.reduce((s, r) => s + f(r), 0)

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
  // `headingText` / `bodyText` rather than `heading` / `text`: these already
  // hold localised strings, so the render site must NOT call t() on them again.
  if (pos === 'Weak — documentation gap') {
    return {
      tone: 'red',
      headingText: t('Documentation improvement required'),
      bodyText: t("Case file lacks sufficient contemporaneous evidence to support the department's position on {0}. Recommend collating GSTR-2B reconciliation statements, e-way bill trail and supplier confirmation letters before the next hearing, and formally placing them on record with a covering note.", issueLabel)
    }
  }
  if (pos === 'Weak — precedent unfavourable') {
    return {
      tone: 'red',
      headingText: t('Legal position needs strengthening'),
      bodyText: t("Existing appellate/tribunal precedent on {0} is currently unfavourable to the department's stand. Recommend consulting the Legal Cell for an alternative distinguishing argument or, where warranted, evaluating settlement/withdrawal to avoid an adverse order at a higher forum.", issueLabel)
    }
  }
  if (pos === 'Moderate') {
    return {
      tone: 'amber',
      headingText: t('Position adequate — minor reinforcement suggested'),
      bodyText: t('Department position is reasonably supported. Recommend a final review of the reply/counter-affidavit for completeness and ensuring all annexures referenced are on file prior to hearing.')
    }
  }
  return {
    tone: 'green',
    headingText: t('Position well supported'),
    bodyText: t('Documentation and legal reasoning for this case are adequately supported. No immediate corrective action required; maintain current filing discipline for the next hearing.')
  }
}

export default function LitigationIntelligence() {
  const { filters } = useApp()
  const [selectedCase, setSelectedCase] = useState(null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  const filteredCases = useMemo(
    () => LITIGATION_CASES.filter(c => matchesLitigationFilters(c, filters)),
    [filters]
  )

  /* Every figure below carries its own denominator, because a count of appeals
   * decides nothing on its own. What decides something is what share of the
   * money is still contestable, how much of it sits behind a position the
   * department has itself recorded as weak, and where in the ladder it sits. */
  const summary = useMemo(() => {
    const pending = filteredCases.filter(c => PENDING_STAGES.includes(c.stage))
    const concluded = filteredCases.filter(c => CONCLUDED_STAGES.includes(c.stage))
    const confirmed = concluded.filter(c => c.stage === 'Order Confirmed')
    const reversed = concluded.filter(c => c.stage === 'Order Reversed')
    const remanded = concluded.filter(c => c.stage === 'Remanded')
    const weak = filteredCases.filter(c => c.departmentPosition.startsWith('Weak'))
    const highValuePending = pending.filter(c => c.disputedAmount > HIGH_VALUE_THRESHOLD)
    const disputedTotal = sumBy(filteredCases, c => c.disputedAmount)
    const pendingTotal = sumBy(pending, c => c.disputedAmount)

    return {
      total: filteredCases.length,
      pendingCount: pending.length,
      concludedCount: concluded.length,
      confirmedCount: confirmed.length,
      reversedCount: reversed.length,
      remandedCount: remanded.length,
      disputedCr: crn(disputedTotal),
      pendingCr: crn(pendingTotal),
      reversedCr: crn(sumBy(reversed, c => c.disputedAmount)),
      weakCount: weak.length,
      weakCr: crn(sumBy(weak, c => c.disputedAmount)),
      weakSharePct: pct(sumBy(weak, c => c.disputedAmount), disputedTotal),
      highValueCount: highValuePending.length,
      highValueCr: crn(sumBy(highValuePending, c => c.disputedAmount)),
      highValueSharePct: pct(sumBy(highValuePending, c => c.disputedAmount), pendingTotal),
      disputedTotal
    }
  }, [filteredCases])

  /* Exposure tracked along the appeal ladder — the thing this module is for.
   * A proceeding at the Tribunal is a different institutional risk from one
   * still at the Appellate Authority, and until now both were one number. */
  const stageRows = useMemo(() => STAGE_LADDER.map(stage => {
    const rows = filteredCases.filter(c => c.stage === stage)
    const exposure = sumBy(rows, c => c.disputedAmount)
    return {
      id: stage,
      stage,
      cases: rows.length,
      exposure,
      exposureCr: crn(exposure),
      sharePct: pct(exposure, summary.disputedTotal),
      over365: rows.filter(c => c.ageingDays > 365).length,
      weak: rows.filter(c => c.departmentPosition.startsWith('Weak')).length
    }
  }), [filteredCases, summary.disputedTotal])

  /* Issues ranked by money at stake, not by how often they appear. The count
   * chart this replaces put "Penalty Proportionality" beside "ITC Eligibility"
   * as though a frequent small dispute and a rare large one were comparable. */
  const issueRows = useMemo(() => LEGAL_ISSUES.map(issue => {
    const rows = filteredCases.filter(c => c.issue === issue)
    const concluded = rows.filter(c => CONCLUDED_STAGES.includes(c.stage))
    const exposure = sumBy(rows, c => c.disputedAmount)
    return {
      id: issue,
      issue,
      cases: rows.length,
      pending: rows.filter(c => PENDING_STAGES.includes(c.stage)).length,
      concluded: concluded.length,
      confirmed: concluded.filter(c => c.stage === 'Order Confirmed').length,
      reversed: concluded.filter(c => c.stage === 'Order Reversed').length,
      remanded: concluded.filter(c => c.stage === 'Remanded').length,
      weak: rows.filter(c => c.departmentPosition.startsWith('Weak')).length,
      exposure,
      exposureCr: crn(exposure),
      sharePct: pct(exposure, summary.disputedTotal)
    }
  }).sort((a, b) => b.exposure - a.exposure), [filteredCases, summary.disputedTotal])

  /* Ageing carries the money with it. A count of old cases says nothing about
   * what is riding on them, which is the figure that decides where an officer
   * spends the week. */
  const ageingBuckets = useMemo(() => {
    const defs = [
      { bucket: '< 90 days', test: c => c.ageingDays < 90 },
      { bucket: '90 – 365 days', test: c => c.ageingDays >= 90 && c.ageingDays <= 365 },
      { bucket: '365+ days', test: c => c.ageingDays > 365 }
    ]
    return defs.map(d => {
      const rows = filteredCases.filter(d.test)
      const exposure = sumBy(rows, c => c.disputedAmount)
      return {
        bucket: d.bucket,
        count: rows.length,
        exposureCr: crn(exposure),
        sharePct: pct(exposure, summary.disputedTotal)
      }
    })
  }, [filteredCases, summary.disputedTotal])

  const trainingSignals = useMemo(() => {
    const weakCases = filteredCases.filter(c => c.departmentPosition.startsWith('Weak'))
    const docCases = weakCases.filter(c => c.departmentPosition === 'Weak — documentation gap')
    const precCases = weakCases.filter(c => c.departmentPosition === 'Weak — precedent unfavourable')
    return {
      total: weakCases.length,
      docGap: docCases.length,
      precedent: precCases.length,
      docGapPct: pct(docCases.length, weakCases.length),
      precedentPct: pct(precCases.length, weakCases.length),
      docGapCr: crn(sumBy(docCases, c => c.disputedAmount)),
      precedentCr: crn(sumBy(precCases, c => c.disputedAmount))
    }
  }, [filteredCases])

  const aiSummary = selectedCase ? summarizeLitigationRisk(selectedCase) : null
  const docRec = selectedCase ? documentationRecommendation(selectedCase) : null
  const selectedIssueRow = selectedCase ? issueRows.find(r => r.issue === selectedCase.issue) : null

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
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    { key: 'district', label: t('District'), render: r => t(r.district) },
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
        description={t('Pending proceedings, order outcomes and exposure tracked through the appeal stages — how much of the amount in dispute is still contestable, where in the ladder it sits, and how much of it rides on a position the department itself has recorded as weak.')}
        actions={<ExportBar moduleLabel="Litigation Intelligence" />}
      />

      <StatutoryReviewBanner records={filteredCases} context={t('litigation cases')} />

      <FilterScope shown={filteredCases.length} total={LITIGATION_CASES.length} unit={t('litigation proceedings')} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <KpiCard
          label={t('Still pending')}
          value={summary.pendingCount}
          unit={t('of {0} proceedings in scope — {1} concluded', summary.total, summary.concludedCount)}
          icon={Scale}
          tone="navy"
        />
        {/* Money still contestable, separated from money already decided. The
            single "Amount Under Dispute" tile summed both and read as one pot. */}
        <KpiCard
          label={t('Exposure still under appeal')}
          value={summary.pendingCr}
          unit={t('₹ Cr of ₹{0} Cr in scope · ₹{1} Cr on the register statewide', summary.disputedCr, LITIGATION_SUMMARY.recoveryLockedCr)}
          icon={Lock}
          tone="saffron"
        />
        <KpiCard
          label={t('Orders reversed at appeal')}
          value={summary.reversedCount}
          unit={t('of {0} concluded — {1} confirmed, {2} remanded · ₹{3} Cr reversed', summary.concludedCount, summary.confirmedCount, summary.remandedCount, summary.reversedCr)}
          icon={RotateCcw}
          tone="red"
        />
        {/* The department's own recorded doubt, priced. */}
        <KpiCard
          label={t('Exposure at a weak position')}
          value={summary.weakCr}
          unit={t('₹ Cr — {0}% of the amount in dispute, across {1} of {2} proceedings', summary.weakSharePct, summary.weakCount, summary.total)}
          icon={FileWarning}
          tone="red"
        />
        {/* HIGH_VALUE_THRESHOLD is 5,000,000 — ₹50 Lakh, not ₹5 Cr. The unit
            label overstated the threshold tenfold and disagreed with Reports &
            Briefing Notes, which described the same cut correctly. */}
        <KpiCard
          label={t('High-value pending')}
          value={summary.highValueCount}
          unit={t('over ₹50L — ₹{0} Cr, {1}% of the exposure still under appeal', summary.highValueCr, summary.highValueSharePct)}
          icon={AlertOctagon}
          tone="steel"
        />
      </div>

      {/* Why there is no success-rate tile here any more. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 mb-6 flex items-start gap-3">
        <Landmark className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">
            {t('No blended success rate is stated on this screen — {0} of {1} proceedings in scope have concluded and carry an outcome.', summary.concludedCount, summary.total)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">
            {t('A single percentage computed across seven different questions of law is a generalisation wearing a statistic: it reads as evidence about the case in front of the officer and is nothing of the kind. Outcomes are therefore reported as counts against their denominator. Where the department’s record is thick enough to carry a rate, it is stated per question of law — and withheld with the concluded count shown where it is not — in Precedent Intelligence, which owns that gate.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card
          title={t('Where the exposure sits in the appeal ladder')}
          subtitle={t('First appeal, second appeal, then the three ways a proceeding ends. Exposure is the amount in dispute at each rung, as a share of ₹{0} Cr in scope.', summary.disputedCr)}
        >
          <DataTable
            searchable={false}
            pageSize={STAGE_LADDER.length}
            columns={[
              { key: 'stage', label: t('Stage'), render: r => t(r.stage) },
              { key: 'cases', label: t('Cases'), align: 'right' },
              { key: 'exposureCr', label: t('Amount in dispute'), align: 'right', sortValue: r => r.exposure, render: r => `₹${r.exposureCr} Cr` },
              { key: 'sharePct', label: t('Share of exposure'), align: 'right', render: r => `${r.sharePct}%` },
              { key: 'over365', label: t('Over 365 days'), align: 'right', render: r => <span className="tabular-nums">{t('{0} of {1}', r.over365, r.cases)}</span> },
              { key: 'weak', label: t('Weak position'), align: 'right', render: r => <span className="tabular-nums">{t('{0} of {1}', r.weak, r.cases)}</span> }
            ]}
            rows={stageRows}
          />
        </Card>

        <Card
          title={t('Case ageing against the money it holds')}
          subtitle={t('Bars are the amount in dispute, not the number of cases — an old case decides nothing until you know what is riding on it.')}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ageingBuckets} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="bucket" tickFormatter={t} tick={{ fontSize: 10.5, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} labelFormatter={t} />
              <Bar dataKey="exposureCr" name={t('Amount in dispute (₹ Cr)')} radius={[4, 4, 0, 0]}>
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
                <div className="text-sm font-bold text-navy-900 tabular-nums">{t('{0} of {1}', b.count, summary.total)}</div>
                <div className="text-[10.5px] text-steel-600 tabular-nums">{t('₹{0} Cr · {1}%', b.exposureCr, b.sharePct)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title={t('Legal issues, by amount at stake and how they have ended')}
        subtitle={t('Ranked by the money in dispute rather than by how often the issue appears. Outcomes are counts against the concluded total; no rate is computed here.')}
        className="mb-6"
      >
        <DataTable
          searchable={false}
          pageSize={LEGAL_ISSUES.length}
          columns={[
            { key: 'issue', label: t('Legal issue'), render: r => t(r.issue) },
            { key: 'exposureCr', label: t('Amount in dispute'), align: 'right', sortValue: r => r.exposure, render: r => `₹${r.exposureCr} Cr` },
            { key: 'sharePct', label: t('Share of exposure'), align: 'right', render: r => `${r.sharePct}%` },
            { key: 'pending', label: t('Pending'), align: 'right', render: r => <span className="tabular-nums">{t('{0} of {1}', r.pending, r.cases)}</span> },
            { key: 'concluded', label: t('Concluded'), align: 'right', render: r => <span className="tabular-nums">{t('{0} of {1}', r.concluded, r.cases)}</span> },
            { key: 'confirmed', label: t('Confirmed'), align: 'right' },
            { key: 'reversed', label: t('Reversed'), align: 'right' },
            { key: 'remanded', label: t('Remanded'), align: 'right' },
            { key: 'weak', label: t('Weak position'), align: 'right', render: r => <span className="tabular-nums">{t('{0} of {1}', r.weak, r.cases)}</span> }
          ]}
          rows={issueRows}
        />
      </Card>

      <Card
        title={t('Where weak positions cluster, and what they cost')}
        subtitle={t('Positions recorded on the case file at assessment, weighted by the amount in dispute behind them')}
        className="mb-6"
      >
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-navy-50 border border-navy-100 shrink-0"><GraduationCap className="w-4 h-4 text-navy-700" /></span>
          <div className="space-y-2 text-xs text-navy-800">
            {trainingSignals.total === 0 ? (
              <p className="text-steel-500">{t('No weak-position cases identified in the current litigation register.')}</p>
            ) : (
              <>
                <p>
                  {t('{0} of {1} proceedings in scope carry a position the department itself recorded as weak, and ₹{2} Cr — {3}% of the amount in dispute — sits behind them.',
                    summary.weakCount, summary.total, summary.weakCr, summary.weakSharePct)}
                </p>
                <p>
                  {t('{0} of {1} weak positions ({2}%) are documentation gaps, holding ₹{3} Cr. Recommend a refresher on evidence collection and case-file discipline for audit and assessment officers — this is the half the department can fix by itself, before a hearing rather than after one.',
                    trainingSignals.docGap, trainingSignals.total, trainingSignals.docGapPct, trainingSignals.docGapCr)}
                </p>
                <p>
                  {t('{0} of {1} weak positions ({2}%) are unfavourable precedent, holding ₹{3} Cr. Training does not move these: route them through the Legal Cell early for a distinguishing argument, or evaluate withdrawal where the authority is binding and against the department.',
                    trainingSignals.precedent, trainingSignals.total, trainingSignals.precedentPct, trainingSignals.precedentCr)}
                </p>
              </>
            )}
            <div className="pt-1"><HumanReviewBadge label={t('Advisory signal — training plan requires Commissioner approval')} /></div>
          </div>
        </div>
      </Card>

      <Card title={t('Litigation Case Register')} subtitle={t('Respects global district / division / sector / risk / date filters')}>
        <DataTable columns={columns} rows={filteredCases} onRowClick={c => setSelectedCase(c)} searchPlaceholder={t('Search case, GSTIN, trade name...')} />
      </Card>

      <Modal
        open={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        size="xl"
        title={selectedCase ? `${selectedCase.id} — ${selectedCase.tradeName}` : ''}
        subtitle={selectedCase ? `${selectedCase.gstin} · ${t(selectedCase.sector)} · ${t(selectedCase.district)}` : ''}
      >
        {selectedCase && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Stat label={t('Legal Issue')} value={t(selectedCase.issue)} />
              <Stat label={t('Stage')} value={t(selectedCase.stage)} />
              <Stat label={t('Disputed Amount')} value={`₹${(selectedCase.disputedAmount / 100000).toFixed(1)}L`} />
              {selectedIssueRow && (
                <Stat
                  label={t('Share of this issue’s exposure')}
                  value={t('{0}% of ₹{1} Cr', pct(selectedCase.disputedAmount, selectedIssueRow.exposure), selectedIssueRow.exposureCr)}
                />
              )}
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
              // NOT `t` — a local named `t` here shadows the translator and every
              // t() call inside this block becomes a call on a style object.
              const tone = TONE_STYLES[docRec.tone] || TONE_STYLES.steel
              return (
                <div className="rounded-xl border p-4" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileWarning className="w-4 h-4" style={{ color: tone.accent }} />
                    <span className="text-sm font-bold text-navy-900">{docRec.headingText}</span>
                  </div>
                  <p className="text-xs text-navy-800">{docRec.bodyText}</p>
                </div>
              )
            })()}

            {/* What actually happened in comparable concluded proceedings —
                from the similarity engine, which owns comparability and applies
                its own sample gate before any rate is stated. */}
            <ComparableCases gstin={selectedCase.gstin} />

            <div className="flex items-center justify-between pt-2 border-t border-steel-100">
              <button
                onClick={() => setSelectedTaxpayer(taxpayerById(selectedCase.taxpayerId))}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 bg-white text-navy-700 hover:bg-navy-50"
              >{t('View Taxpayer 360')}</button>
              <ExportBar moduleLabel="Litigation Intelligence" caseId={selectedCase.id} />
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
