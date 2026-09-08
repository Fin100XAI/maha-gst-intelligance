import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { WhyFlaggedPanel } from '../components/ui/WhyFlagged.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { StatutoryFlag, StatutoryReviewBanner, StatutoryVerdict } from '../components/ui/StatutoryFlag.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { AUDIT_CASES, AUDIT_STAGES, taxpayerById, REFERENCE_DATE } from '../data/mockData.js'
import { generateAuditChecklist, compareSimilarCases, summarizeTaxpayer, draftNotice } from '../data/ai.js'
import { statutoryPositionFor } from '../data/caseTwin.js'
import { RECOVERY_CASES } from '../data/recovery.js'
import { PRIORITY_QUEUE } from '../data/priority.js'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { Briefcase, Clock, Hourglass, ChevronLeft, ChevronRight, User2, FolderOpen, Sparkles, FileText, CheckCircle2, UserCheck, Globe, Coins } from 'lucide-react'


// Delegates to the shared case filter so this module cannot drift out of
// step with the others again — division in particular was missing here.
const matchesGlobalFilters = (rec, filters) => applyCaseFilters(rec, filters, 'openedOn')

function caseAgeDays(openedOn) {
  return Math.max(0, Math.round((REFERENCE_DATE - new Date(openedOn)) / (1000 * 60 * 60 * 24)))
}

/* A display threshold, not a measurement: the point at which an open case with
 * no recorded action is worth asking about. Stated on screen rather than
 * embedded so it can be argued with. */
const IDLE_THRESHOLD_DAYS = 14

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

export default function AuditScrutinyEngine() {
  const { filters, role, officerName, logAction } = useApp()
  const [cases, setCases] = useState(() => AUDIT_CASES.map(c => ({ ...c })))
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [checklistOutput, setChecklistOutput] = useState(null)
  const [compareOutput, setCompareOutput] = useState(null)
  const [noticeOutput, setNoticeOutput] = useState(null)
  const [confirmReview, setConfirmReview] = useState(false)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  // Case-level RBAC: an Audit Officer is scoped to cases assigned to them by default —
  // module access alone (RESTRICTED map) isn't enough per the spec's "assigned cases" requirement.
  const isFieldOfficer = role === 'Audit Officer'
  const [showAllCases, setShowAllCases] = useState(false)
  const scopedToMe = isFieldOfficer && !showAllCases

  // The base the filter bar narrows — the officer's own caseload when scoped,
  // the statewide list otherwise. Quoting the wrong denominator here is how a
  // screen tells an officer they are seeing every case in the state.
  const baseCases = useMemo(
    () => (scopedToMe ? cases.filter(c => c.assignedOfficer === officerName) : cases),
    [cases, scopedToMe, officerName]
  )

  const filteredCases = useMemo(
    () => baseCases.filter(c => matchesGlobalFilters(c, filters)),
    [baseCases, filters]
  )

  /* Two figures every audit queue needs and this one did not carry: how much of
   * the exposure is still collectable, and how long the department has left to
   * raise it. Both are read from the engines that own them — the recovery decay
   * curve and the limitation register — rather than estimated here. */
  const recovery = useMemo(() => new Map(RECOVERY_CASES.map(r => [r.gstin, r])), [])
  const priority = useMemo(() => new Map(PRIORITY_QUEUE.map(p => [p.gstin, p])), [])

  const kpis = useMemo(() => {
    const openCases = filteredCases.filter(c => c.stage !== 'Closed')
    const exposure = filteredCases.reduce((s, c) => s + c.estimatedExposure, 0)

    let recoverable = 0
    let recoveryMatched = 0
    filteredCases.forEach(c => {
      const r = recovery.get(c.gstin)
      if (!r) return
      recoveryMatched += 1
      recoverable += r.recoverableNow
    })

    // Time-barred open cases are reported by the banner above the queue, which
    // names them; this counts the ones still savable.
    let criticalCount = 0
    let criticalExposure = 0
    openCases.forEach(c => {
      const pos = statutoryPositionFor(c.gstin)
      if (pos && pos.critical) { criticalCount += 1; criticalExposure += pos.exposure }
    })

    const idle = openCases.map(c => caseAgeDays(c.lastActionOn)).sort((a, b) => a - b)
    return {
      openCount: openCases.length,
      closedCount: filteredCases.length - openCases.length,
      totalCount: filteredCases.length,
      exposure,
      recoverable,
      recoveryMatched,
      recoverablePct: exposure > 0 ? Math.round((recoverable / exposure) * 100) : 0,
      criticalCount,
      criticalExposure,
      stalledCount: idle.filter(d => d >= IDLE_THRESHOLD_DAYS).length,
      medianIdle: idle.length ? idle[Math.floor(idle.length / 2)] : 0
    }
  }, [filteredCases, recovery])

  /* The pipeline board answers "where is the work" only if each column also
   * says what is in it and what the clock is doing to it. */
  const stageStats = useMemo(() => {
    const out = {}
    AUDIT_STAGES.forEach(s => { out[s] = { count: 0, exposure: 0, barred: 0, critical: 0 } })
    filteredCases.forEach(c => {
      const bucket = out[c.stage]
      if (!bucket) return
      bucket.count += 1
      bucket.exposure += c.estimatedExposure
      const pos = statutoryPositionFor(c.gstin)
      if (!pos) return
      if (pos.barred) bucket.barred += 1
      else if (pos.critical) bucket.critical += 1
    })
    return out
  }, [filteredCases])

  const rankedCases = useMemo(
    () => [...filteredCases].sort((a, b) => b.riskScore - a.riskScore),
    [filteredCases]
  )

  const openCase = id => {
    setSelectedCaseId(id)
    setChecklistOutput(null)
    setCompareOutput(null)
    setNoticeOutput(null)
    setConfirmReview(false)
  }

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null
  const selectedTaxpayerFull = selectedCase ? taxpayerById(selectedCase.taxpayerId) : null

  // `lastActionOn` was stamped with the literal '2026-08-17' — the dataset's
  // as-of date — so a stage change the officer made in this session was
  // back-dated to the seed date on screen. It now records when the action
  // actually happened.
  const todayIso = () => new Date().toISOString().slice(0, 10)

  const moveStage = (caseId, direction) => {
    setCases(prev => prev.map(c => {
      if (c.id !== caseId) return c
      const idx = AUDIT_STAGES.indexOf(c.stage)
      const nextIdx = Math.min(AUDIT_STAGES.length - 1, Math.max(0, idx + direction))
      return { ...c, stage: AUDIT_STAGES[nextIdx], lastActionOn: todayIso() }
    }))
  }

  // Moving a case BACK a stage is a correction, not an approval — it needs no
  // review gate, but it is still a change to a case record and so must reach
  // the audit log like every other one. It previously did not.
  const revertStage = caseRecord => {
    if (!caseRecord) return
    const priorStage = AUDIT_STAGES[Math.max(0, AUDIT_STAGES.indexOf(caseRecord.stage) - 1)]
    moveStage(caseRecord.id, -1)
    logAction(`Reverted Audit Stage → ${priorStage}`, 'Audit & Scrutiny Engine', caseRecord.gstin)
  }

  const approveNextStage = () => {
    if (!selectedCase || !confirmReview) return
    const nextStage = AUDIT_STAGES[Math.min(AUDIT_STAGES.length - 1, AUDIT_STAGES.indexOf(selectedCase.stage) + 1)]
    moveStage(selectedCase.id, 1)
    logAction(`Approved Audit Stage Advance → ${nextStage}`, 'Audit & Scrutiny Engine', selectedCase.gstin)
    setConfirmReview(false)
  }

  const columns = [
    { key: 'id', label: t('Case ID') },
    {
      key: 'trade',
      label: t('GSTIN / Trade Name'),
      sortValue: r => r.tradeName,
      render: r => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-navy-900">{r.tradeName}</span>
            <StatutoryFlag gstin={r.gstin} />
          </div>
          <div className="text-[11px] text-steel-500">{r.gstin}</div>
        </div>
      )
    },
    { key: 'district', label: t('District'), render: r => t(r.district) },
    {
      key: 'riskScore',
      label: t('Risk'),
      sortValue: r => r.riskScore,
      render: r => <RiskBadge category={r.riskCategory} score={r.riskScore} />
    },
    {
      // Exposure alone decides nothing: it is the figure before the decay curve
      // and before limitation. The recoverable figure underneath is what an
      // officer-day spent on this case can still bring in.
      key: 'estimatedExposure',
      label: t('Exposure / recoverable'),
      align: 'right',
      sortValue: r => r.estimatedExposure,
      render: r => {
        const rec = recovery.get(r.gstin)
        return (
          <div className="text-right">
            <div className="tabular-nums text-navy-800 font-medium">{lakh(r.estimatedExposure)}</div>
            {rec
              ? <div className="text-[10px] tabular-nums text-emerald-700">{t('{0} recoverable', lakh(rec.recoverableNow))}</div>
              : <div className="text-[10px] text-steel-400">{t('no recovery record')}</div>}
          </div>
        )
      }
    },
    {
      // The clock, on the row. Without it this queue shows a time-barred case as
      // live work with a next stage to advance to.
      key: 'deadline',
      label: t('Statutory clock'),
      align: 'right',
      sortValue: r => {
        const pos = statutoryPositionFor(r.gstin)
        return pos ? pos.daysRemaining : 99999
      },
      render: r => {
        const pos = statutoryPositionFor(r.gstin)
        if (!pos) return <span className="text-[11px] text-steel-400">{t('No limitation record')}</span>
        return (
          <div className="text-right" title={t(pos.verdictMsg.key, ...pos.verdictMsg.args)}>
            <div className={`text-[12px] font-semibold tabular-nums ${pos.barred ? 'text-steel-400' : pos.critical ? 'text-maharisk-critical' : 'text-navy-800'}`}>
              {pos.barred ? t('{0}d overdue', pos.daysOverdue) : t('{0}d left', pos.daysRemaining)}
            </div>
            <div className="text-[10px] text-steel-400 tabular-nums">{pos.sectionLabel} · {pos.bindingDate}</div>
          </div>
        )
      }
    },
    {
      key: 'lastActionOn',
      label: t('Days idle'),
      align: 'right',
      sortValue: r => caseAgeDays(r.lastActionOn),
      render: r => {
        const idle = caseAgeDays(r.lastActionOn)
        return (
          <div className="text-right">
            <div className={`text-[12px] font-semibold tabular-nums ${idle >= IDLE_THRESHOLD_DAYS && r.stage !== 'Closed' ? 'text-amber-700' : 'text-steel-600'}`}>{idle}</div>
            <div className="text-[10px] text-steel-400 tabular-nums">{t('open {0}d', caseAgeDays(r.openedOn))}</div>
          </div>
        )
      }
    },
    { key: 'stage', label: t('Stage'), render: r => <Pill tone="navy">{t(r.stage)}</Pill> },
    { key: 'assignedOfficer', label: t('Assigned Officer') },
    {
      key: 'action',
      label: t('Action'),
      sortable: false,
      align: 'center',
      render: r => (
        <button
          onClick={() => openCase(r.id)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-ink-700 text-white hover:bg-ink-800"
        >
          <FolderOpen className="w-3 h-3" /> {t('Open Case')}
        </button>
      )
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Enforcement · Risk-Based Prioritisation')}
        title={t('Audit & Scrutiny Engine')}
        description={<MethodNote short={t('Audit cases ranked by risk, from identification through to recovery.')} full={t('Risk-ranked audit case prioritisation and pipeline management — from case identification through hearing and recovery, with AI-assisted checklists, notices and mandatory officer approval at every stage transition.')} />}
        actions={<ExportBar moduleLabel={t('Audit & Scrutiny Engine')} />}
      />

      {/* The Case Digital Twin's statutory verdict, propagated to the queue.
          Without it this screen shows a time-barred case as live work with an
          officer assigned and a next stage to advance to. */}
      <StatutoryReviewBanner
        records={filteredCases.filter(c => c.stage !== 'Closed')}
        context={t('open audit cases')}
      />

      {isFieldOfficer && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/60">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800">
            {scopedToMe ? <UserCheck className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {/* Counts must describe the table below, which is filtered. Quoting the
                raw dataset total here and calling it "all … statewide" told the
                officer they were looking at every case in the state while the
                header filters were silently narrowing the list. */}
            {scopedToMe
              ? <>{t('Showing cases assigned to you —')} <strong>{officerName}</strong> ({t('{0} of your {1} cases match the current filters', filteredCases.length, baseCases.length)})</>
              : <>{t('Your role can access every case — showing {0} of {1} that match the current filters', filteredCases.length, cases.length)}</>}
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
        <KpiCard
          label={t('Open cases')}
          value={kpis.openCount}
          unit={t('of {0} in view · {1} closed', kpis.totalCount, kpis.closedCount)}
          tone="navy"
          icon={Briefcase}
        />
        <KpiCard
          label={t('Still recoverable')}
          value={(kpis.recoverable / 10000000).toFixed(2)}
          unit={t('₹ Cr of {0} exposure — {1}%', cr(kpis.exposure), kpis.recoverablePct)}
          tone="green"
          icon={Coins}
        />
        <KpiCard
          label={t('Inside 30 days of the deadline')}
          value={kpis.criticalCount}
          unit={t('open cases · {0} extinguished if the notice is late', cr(kpis.criticalExposure))}
          tone="red"
          icon={Clock}
        />
        <KpiCard
          label={t('No action for {0}+ days', IDLE_THRESHOLD_DAYS)}
          value={kpis.stalledCount}
          unit={t('of {0} open · median {1} days idle', kpis.openCount, kpis.medianIdle)}
          tone="saffron"
          icon={Hourglass}
        />
      </div>

      {kpis.recoveryMatched < kpis.totalCount && (
        <MethodNote className="mb-4 rounded-lg border border-steel-200 bg-steel-50 px-4 py-2.5 text-[12px] text-steel-700 leading-relaxed" short={t('The rest are shown at exposure only — the decay curve is not extrapolated.')} full={t('The recoverable figure covers the {0} of {1} cases in view that carry a record in the recovery engine. The remainder are shown at exposure only — the decay curve is not extrapolated over cases it does not hold.', kpis.recoveryMatched, kpis.totalCount)} />
      )}

      <FilterScope shown={filteredCases.length} total={baseCases.length} unit={t('audit cases')}
        ignores={{
          taxpayerType: 'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.'
        }}
      />

      <Card
        title={t('Risk-Ranked Case List')}
        subtitle={<MethodNote short={t('Risk decides the order; the statutory clock decides whether it is worth working.')} full={t('Sorted by risk score, descending. Risk decides the order; the statutory clock decides whether the order is worth working — sort on it to see which cases the calendar is about to close.')} />}
        className="mb-6"
        actions={<HumanReviewBadge label={t('Officer Verification Required')} />}
      >
        <DataTable
          columns={columns}
          rows={rankedCases}
          searchPlaceholder={t('Search by GSTIN or trade name...')}
          emptyLabel={t('No audit cases match the current filters.')}
        />
      </Card>

      <Card
        title={t('Audit Workflow Pipeline')}
        subtitle={<MethodNote short={t('A stage is a bottleneck when value and expiring cases pile up in it.')} full={t('Stage tracking with what each stage is holding. A column is a bottleneck when value and expiring cases accumulate in it — a case count on its own cannot show that.')} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {AUDIT_STAGES.map(stage => {
            const stageCases = filteredCases.filter(c => c.stage === stage)
            const st = stageStats[stage]
            return (
              <div key={stage} className="bg-steel-50 rounded-xl border border-steel-200 flex flex-col min-h-[140px]">
                <div className="px-3 py-2 border-b border-steel-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-navy-800">{t(stage)}</span>
                    <span className="text-[11px] font-semibold text-steel-500">{stageCases.length}</span>
                  </div>
                  <div className="text-[10.5px] text-steel-500 tabular-nums mt-0.5">{cr(st.exposure)}</div>
                  {(st.critical > 0 || st.barred > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {st.critical > 0 && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800">{t('{0} within 30d', st.critical)}</span>}
                      {st.barred > 0 && <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-red-300 bg-red-50 text-[#C5221F]">{t('{0} time-barred', st.barred)}</span>}
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {stageCases.length === 0 && (
                    <div className="text-[11px] text-steel-400 text-center py-4">{t('No cases')}</div>
                  )}
                  {stageCases.map(c => {
                    const idx = AUDIT_STAGES.indexOf(c.stage)
                    return (
                      <div key={c.id} className="bg-white rounded-lg border border-steel-200 p-2.5 shadow-sm">
                        <button onClick={() => openCase(c.id)} className="text-left w-full">
                          <div className="text-xs font-semibold text-navy-900 truncate">{c.tradeName}</div>
                          <div className="text-[10px] text-steel-500 mb-1.5">{c.id}</div>
                          <div className="flex items-center justify-between gap-1">
                            <RiskBadge category={c.riskCategory} size="sm" />
                            <span className="text-[10.5px] font-semibold text-navy-700">₹{(c.estimatedExposure / 100000).toFixed(1)}L</span>
                          </div>
                        </button>
                        {/* "Next" used to advance the case straight from the board,
                            bypassing the approval checkbox this module's own
                            description calls mandatory, and writing nothing to the
                            audit log. It now opens the case so the officer passes
                            through the same maker-checker gate as everywhere else. */}
                        <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-steel-100">
                          <button
                            disabled={idx === 0}
                            onClick={() => revertStage(c)}
                            title={t('Move this case back one stage')}
                            className="flex-1 inline-flex items-center justify-center gap-0.5 text-[10px] font-semibold px-1.5 py-1 rounded-md border border-steel-200 text-steel-600 hover:bg-steel-50 disabled:opacity-30"
                          >
                            <ChevronLeft className="w-3 h-3" /> {t('Back')}
                          </button>
                          <button
                            disabled={idx === AUDIT_STAGES.length - 1}
                            onClick={() => openCase(c.id)}
                            title={t('Advancing a case requires officer approval — opens the case for review')}
                            className="flex-1 inline-flex items-center justify-center gap-0.5 text-[10px] font-semibold px-1.5 py-1 rounded-md border border-navy-200 text-navy-700 hover:bg-navy-50 disabled:opacity-30"
                          >
                            {t('Review')} <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Modal
        open={!!selectedCase}
        onClose={() => setSelectedCaseId(null)}
        size="xl"
        title={selectedCase ? t('Case {0} — {1}', selectedCase.id, selectedCase.tradeName) : ''}
        subtitle={selectedCase ? `${selectedCase.gstin} · ${t(selectedCase.sector)} · ${t(selectedCase.district)}` : ''}
      >
        {selectedCase && (
          <div className="space-y-5">
            {/* Placed above the stage controls deliberately: this is the moment
                an officer decides to advance the case. */}
            <StatutoryVerdict gstin={selectedCase.gstin} />
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge category={selectedCase.riskCategory} score={selectedCase.riskScore} />
              <Pill tone="navy">{t(selectedCase.stage)}</Pill>
              <Pill tone="steel">{t('Opened {0}', selectedCase.openedOn)}</Pill>
              <Pill tone="steel">{t('Last Action {0}', selectedCase.lastActionOn)}</Pill>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{t('Case Summary')}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label={t('Estimated Exposure')} value={lakh(selectedCase.estimatedExposure)} />
                  {/* What the exposure is actually worth today, and what a week
                      of inaction costs — read from the recovery engine, blank
                      rather than guessed where it holds no record. */}
                  <Stat
                    label={t('Still Recoverable')}
                    value={recovery.get(selectedCase.gstin) ? lakh(recovery.get(selectedCase.gstin).recoverableNow) : t('No recovery record')}
                    note={recovery.get(selectedCase.gstin)
                      ? t('signal age {0} days', recovery.get(selectedCase.gstin).daysSinceSignal)
                      : t('the decay curve holds no entry for this GSTIN')}
                  />
                  <Stat
                    label={t('Decays in 7 Days')}
                    value={recovery.get(selectedCase.gstin) ? lakh(recovery.get(selectedCase.gstin).decayNextWeek) : '—'}
                    note={t('cost of leaving this case another week')}
                  />
                  <Stat
                    label={t('Officer-Days Estimated')}
                    value={priority.get(selectedCase.gstin) ? t('{0} days', priority.get(selectedCase.gstin).effortDays) : t('Not ranked')}
                    note={priority.get(selectedCase.gstin)
                      ? t('priority #{0} of {1} ranked cases', priority.get(selectedCase.gstin).priorityRank, PRIORITY_QUEUE.length)
                      : t('no entry in the priority queue')}
                  />
                  <Stat label={t('Assigned Officer')} value={selectedCase.assignedOfficer} note={t(selectedCase.division)} />
                  <Stat
                    label={t('Case Age')}
                    value={t('{0} days', caseAgeDays(selectedCase.openedOn))}
                    note={t('{0} days since the last recorded action', caseAgeDays(selectedCase.lastActionOn))}
                  />
                </div>
                <div className="text-xs bg-steel-50 border border-steel-200 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold mb-1">{t('Suggested Scope')}</div>
                  {t(selectedCase.suggestedScope)}
                </div>
                <button
                  onClick={() => selectedTaxpayerFull && setSelectedTaxpayer(selectedTaxpayerFull)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50"
                >
                  <User2 className="w-3.5 h-3.5" /> {t('View Taxpayer 360')}
                </button>
              </div>
              {selectedTaxpayerFull ? <WhyFlaggedPanel taxpayer={selectedTaxpayerFull} /> : (
                <div className="text-xs text-steel-500">{t('Taxpayer profile unavailable for risk indicators.')}</div>
              )}
            </div>

            {selectedTaxpayerFull && (
              <div>
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide mb-2">{t('AI-Generated Audit Note')}</div>
                <AIOutputPanel output={summarizeTaxpayer(selectedTaxpayerFull)} />
              </div>
            )}

            <div>
              <button
                onClick={() => setChecklistOutput(generateAuditChecklist(selectedCase))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800 mb-3 mr-2"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t('Generate Required Documents Checklist')}
              </button>
              <button
                onClick={() => setCompareOutput(compareSimilarCases(selectedCase, cases))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50 mb-3"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t('Compare Similar Historical Cases')}
              </button>
              <div className="grid md:grid-cols-2 gap-3">
                {checklistOutput && <AIOutputPanel output={checklistOutput} />}
                {compareOutput && <AIOutputPanel output={compareOutput} />}
              </div>
            </div>

            <div>
              <button
                onClick={() => setNoticeOutput(draftNotice(selectedCase))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50 mb-3"
              >
                <FileText className="w-3.5 h-3.5" /> {t('Preview Notice Draft')}
              </button>
              {noticeOutput && <AIOutputPanel output={noticeOutput} />}
            </div>

            <div className="pt-4 border-t border-steel-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{t('Human Approval')}</div>
                <HumanReviewBadge />
              </div>
              <label className="flex items-start gap-2 text-xs text-navy-800 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmReview}
                  onChange={e => setConfirmReview(e.target.checked)}
                  className="mt-0.5"
                />
                <span>{t('I confirm officer review is complete — risk indicators, checklist and supporting evidence for this case have been examined and verified.')}</span>
              </label>
              <button
                disabled={!confirmReview || selectedCase.stage === 'Closed'}
                onClick={approveNextStage}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedCase.stage === 'Closed' ? t('Case Closed') : t('Approve for Next Stage ({0})', t(AUDIT_STAGES[Math.min(AUDIT_STAGES.length - 1, AUDIT_STAGES.indexOf(selectedCase.stage) + 1)]))}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function Stat({ label, value, note }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
      {note && <div className="text-[10px] text-steel-500 leading-snug mt-0.5">{note}</div>}
    </div>
  )
}
