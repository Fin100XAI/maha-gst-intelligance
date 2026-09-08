import { useMemo, useState } from 'react'
import {
  Layers, Gavel, Banknote, Network as NetworkIcon, FileText, Database,
  CircleCheck, CircleAlert, ArrowRight, Search, ShieldAlert
} from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS, REFERENCE_DATE_ISO } from '../data/mockData.js'
import { buildCaseTwin, TWIN_INDEX, SOURCE_SYSTEMS, statutoryPositionFor } from '../data/caseTwin.js'
import { RECOVERY_PORTFOLIO } from '../data/recovery.js'
import { ComparableCases } from '../components/shared/ComparableCases.jsx'
import { t } from '../i18n/index.js'
import { translateArgs } from '../i18n/similarityText.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)

const SECTION_LABEL = { s73: 'Section 73', s74: 'Section 74', s74A: 'Section 74A' }

const ACTION_TONE = { critical: 'red', barred: 'steel', urgent: 'orange', routine: 'navy', clear: 'green' }

// Each event on the chronology is typed so the timeline can weight it — a
// statutory deadline should not read like a page view.
const KIND_TONE = {
  deadline: 'red', notice: 'orange', proceeding: 'navy', litigation: 'navy',
  refund: 'amber', signal: 'amber', officer: 'steel', registration: 'green'
}

// Events that represent the DEPARTMENT acting, as against the taxpayer or the
// clock. The gap since the most recent one is dwell the department owns.
const DEPARTMENTAL_KINDS = new Set(['officer', 'notice', 'proceeding'])

export default function CaseDigitalTwin() {
  const { filters } = useApp()
  const [query, setQuery] = useState('')
  const [selectedGstin, setSelectedGstin] = useState(null)

  // The cohort the header filters allow. Held separately from the search
  // results because it is the denominator every figure on this page is read
  // against — "largest exposure" means nothing without "of how many".
  const scoped = useMemo(() => {
    const allowed = new Set(TAXPAYERS.filter(x => applyGlobalFilters(x, filters)).map(x => x.gstin))
    return TWIN_INDEX.filter(r => allowed.has(r.gstin))
  }, [filters])

  const index = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped
      .filter(r => !q || `${r.gstin} ${r.tradeName}`.toLowerCase().includes(q))
      .slice(0, 60)
  }, [scoped, query])

  const cohort = useMemo(() => {
    const rank = new Map([...scoped].sort((a, b) => b.exposure - a.exposure).map((r, i) => [r.gstin, i + 1]))
    return {
      count: scoped.length,
      exposure: scoped.reduce((s, r) => s + r.exposure, 0),
      barred: scoped.filter(r => r.daysRemaining !== null && r.daysRemaining < 0).length,
      within30: scoped.filter(r => r.daysRemaining !== null && r.daysRemaining >= 0 && r.daysRemaining <= 30).length,
      noClock: scoped.filter(r => r.daysRemaining === null).length,
      rank
    }
  }, [scoped])

  /* A taxpayer the filter has excluded must not stay on screen beside a cohort
   * that no longer contains them. */
  const active = (selectedGstin && scoped.some(r => r.gstin === selectedGstin))
    ? selectedGstin
    : index[0]?.gstin
  const twin = useMemo(() => (active ? buildCaseTwin(active) : null), [active])
  // The one judgment the twin makes that changes what an officer does today,
  // read from the statutory index rather than re-derived here.
  const statutory = useMemo(() => (active ? statutoryPositionFor(active) : null), [active])

  /* A time-barred period carrying open work is the contradiction the statutory
   * index exists to surface: capacity spent on a demand that can no longer
   * lawfully be raised, with nothing on the operational screens saying so. */
  const conflict = useMemo(() => {
    if (!twin || !statutory || !statutory.barred) return null
    const openAudit = twin.proceedings.audit.filter(c => c.stage !== 'Closed')
    const openNotices = twin.proceedings.notices.filter(n => n.status !== 'Order Issued')
    const total = openAudit.length + openNotices.length
    return total > 0 ? { total, audit: openAudit.length, notices: openNotices.length } : null
  }, [twin, statutory])

  // Counts alone say nothing. What decides the next hour is how many of each
  // are still open, and how much money sits behind them.
  const record = useMemo(() => {
    if (!twin) return null
    const p = twin.proceedings
    return {
      noticesAwaiting: p.notices.filter(n => n.status === 'Reply Awaited' || n.status === 'Hearing Scheduled').length,
      auditOpen: p.audit.filter(c => c.stage !== 'Closed').length,
      refundValue: p.refunds.reduce((s, r) => s + r.claimedAmount, 0),
      disputedValue: p.litigation.reduce((s, l) => s + l.disputedAmount, 0),
      alertsOpen: p.alerts.filter(a => a.status !== 'Resolved').length
    }
  }, [twin])

  const activity = useMemo(() => {
    if (!twin) return null
    const last = twin.chronology.find(e => DEPARTMENTAL_KINDS.has(e.kind)) || null
    const days = last ? Math.round((Date.parse(REFERENCE_DATE_ISO) - Date.parse(last.date)) / 86400000) : null
    return { last, days, systemCount: new Set(twin.chronology.map(e => e.source)).size }
  }, [twin])

  const coverage = useMemo(() => {
    if (!twin) return null
    return {
      contributed: twin.coverage.filter(c => c.contributed).length,
      total: twin.coverage.length,
      absent: twin.coverage.filter(c => !c.connected).length
    }
  }, [twin])

  const rank = active ? cohort.rank.get(active) || 0 : 0

  return (
    <div>
      <SectionHeader
        eyebrow={t('Revenue · Unified Case Record')}
        title={t('Case Digital Twin')}
        description={<MethodNote short={t('One taxpayer, assembled from every system that holds a fact about them.')} full={t('One taxpayer, one chronology, one exposure, one legal position, one recommended next action — assembled from every system that holds a piece of them. Every fact states the system it came from.')} />}
        actions={<ExportBar moduleLabel="Case Digital Twin" />}
      />

      <FilterScope shown={scoped.length} total={TWIN_INDEX.length} unit={t('taxpayers')}
        ignores={{
          dateRange: 'This screen reads a current-state register rather than a stream of dated events, so there is no date on the records to narrow against.'
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* ---- Index rail ---- */}
        <Card padded={false} className="h-fit">
          <div className="p-3 border-b border-steel-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-steel-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('Search GSTIN or trade name')}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-steel-200 bg-steel-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-300"
              />
            </div>
            <div className="text-[10.5px] text-steel-500 mt-2">
              {t('{0} of {1} taxpayers in view — ordered by how soon action is required', index.length, cohort.count)}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <Pill tone="red">{t('{0} due within 30 days', cohort.within30)}</Pill>
              <Pill tone="steel">{t('{0} already time-barred', cohort.barred)}</Pill>
              <Pill tone="amber">{t('{0} with no clock established', cohort.noClock)}</Pill>
            </div>
            <div className="text-[10px] text-steel-400 mt-1.5">
              {t('Amounts read as recoverable now of estimated exposure.')}
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-steel-100">
            {index.map(r => {
              const isActive = r.gstin === active
              const overdue = r.daysRemaining !== null && r.daysRemaining < 0
              const near = r.daysRemaining !== null && r.daysRemaining >= 0 && r.daysRemaining <= 30
              return (
                <button
                  key={r.gstin}
                  onClick={() => setSelectedGstin(r.gstin)}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                    isActive ? 'bg-navy-50 border-l-2 border-ink-700' : 'hover:bg-steel-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="text-xs font-semibold text-navy-900 truncate">{r.tradeName}</div>
                  <div className="text-[10.5px] text-steel-500 truncate">{r.gstin}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {r.daysRemaining !== null && (
                      <Pill tone={overdue ? 'steel' : near ? 'red' : 'amber'}>
                        {overdue ? t('Expired') : t('{0}d left', r.daysRemaining)}
                      </Pill>
                    )}
                    <span className="text-[10.5px] text-steel-500 tabular-nums ml-auto">
                      {r.recoverableNow !== null
                        ? t('{0} of {1}', lakh(r.recoverableNow), lakh(r.exposure))
                        : lakh(r.exposure)}
                    </span>
                  </div>
                </button>
              )
            })}
            {index.length === 0 && (
              <div className="px-4 py-6 text-xs text-steel-500">{t('No cases match the current filters.')}</div>
            )}
          </div>
        </Card>

        {/* ---- The twin ---- */}
        {twin ? (
          <div className="min-w-0 space-y-4">
            {/* Identity + the single recommended action */}
            <div className="rounded-xl border border-steel-200 bg-white shadow-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-navy-900">{twin.identity.tradeName.value}</h2>
                  <div className="text-[12px] text-steel-500 mt-0.5">
                    {twin.identity.legalName.value} · {twin.gstin}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Pill tone="navy">{t(twin.identity.district.value)}</Pill>
                    <Pill tone="steel">{t(twin.identity.sector.value)}</Pill>
                    <Pill tone="steel">{t(twin.identity.filingStatus.value)}</Pill>
                    <RiskBadge category={twin.position.riskCategory.value} score={twin.position.riskScore.value} size="sm" />
                  </div>
                  {rank > 0 && (
                    <div className="text-[11px] text-steel-500 mt-2">
                      {t('Rank {0} of {1} by estimated exposure among the taxpayers in view — {2} of the {3} in scope.',
                        rank, cohort.count, lakh(twin.position.exposure.value), cr(cohort.exposure))}
                    </div>
                  )}
                </div>
              </div>

              <NextAction
                next={twin.nextAction}
                daysRemaining={twin.legal ? twin.legal.daysRemaining : null}
                decayNextWeek={twin.position.decayNextWeek ? twin.position.decayNextWeek.value : null}
              />
            </div>

            {/* One exposure, one legal position — side by side, because an officer
                weighs them together and today has to open two systems to do it. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title={t('Position')} subtitle={t('What is at stake, what remains of it, and what the delay is costing')}>
                <div className="grid grid-cols-2 gap-3">
                  <Figure
                    label={t('Estimated exposure')}
                    value={lakh(twin.position.exposure.value)}
                    source={twin.position.exposure.source}
                    tone="steel"
                    context={t('Risk-model estimate, not an assessed demand')}
                  />
                  {twin.position.recoverableNow && (
                    <Figure
                      label={t('Recoverable now')}
                      value={lakh(twin.position.recoverableNow.value)}
                      source={twin.position.recoverableNow.source}
                      tone="green"
                      context={t('{0}% of the exposure survives at this age', pct(twin.position.recoverableNow.value, twin.position.exposure.value))}
                    />
                  )}
                  {twin.position.decayNextWeek && (
                    <Figure
                      label={t('Decays in 7 days')}
                      value={`−${lakh(twin.position.decayNextWeek.value)}`}
                      source={twin.position.decayNextWeek.source}
                      tone="red"
                      context={twin.position.recoverableNow
                        ? t('{0}% of what is left — the cost of one more week untouched', pct(twin.position.decayNextWeek.value, twin.position.recoverableNow.value))
                        : t('The cost of one more week untouched')}
                    />
                  )}
                  {twin.position.signalAgeDays && (
                    <Figure
                      label={t('Signal age')}
                      value={t('{0}d', twin.position.signalAgeDays.value)}
                      source={twin.position.signalAgeDays.source}
                      tone="orange"
                      context={t('Portfolio median is {0}d', RECOVERY_PORTFOLIO.medianLagDays)}
                    />
                  )}
                </div>
                {twin.position.triggeredRules.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-steel-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">
                      {t('Why flagged — {0} rules firing, {1} points of the risk score {2}',
                        twin.position.triggeredRules.length,
                        twin.position.triggeredRules.reduce((s, r) => s + r.weight, 0),
                        twin.position.riskScore.value)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {twin.position.triggeredRules.map(r => (
                        <span key={r.id} className="text-[10.5px] px-1.5 py-0.5 rounded bg-steel-100 text-steel-700">
                          {t(r.label)} <span className="tabular-nums font-semibold">+{r.weight}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card title={t('Legal position')} subtitle={t('The statutory clock on this proceeding')}>
                {twin.legal ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums" style={{ color: TONE_STYLES[twin.legal.urgency.tone].accent }}>
                        {twin.legal.daysRemaining < 0 ? t('Expired') : t('{0}d', twin.legal.daysRemaining)}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: TONE_STYLES[twin.legal.urgency.tone].accent }}>
                        {t(twin.legal.urgency.label)}
                      </span>
                    </div>
                    <div className="text-[12px] text-steel-600 mt-1">
                      {t(twin.legal.bindingLabel)} {t('deadline')} <strong className="text-navy-800 tabular-nums">{twin.legal.bindingDate}</strong>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <Pill tone="navy">{twin.legal.fy}</Pill>
                      <Pill tone="steel">{t(SECTION_LABEL[twin.legal.section])}</Pill>
                      {twin.legal.contested && <Pill tone="red">{t('Contested extension')}</Pill>}
                    </div>

                    {/* The verdict in the words an officer needs, taken from the
                        statutory index so every screen states it identically. */}
                    {statutory && (
                      <div className={`mt-3 rounded-lg border px-3 py-2 ${statutory.barred ? 'border-red-200 bg-red-50/50' : 'border-emerald-200 bg-emerald-50/40'}`}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{t('What this means')}</div>
                        <p className="text-[12px] text-navy-800 leading-relaxed">{t(statutory.verdictMsg.key, ...statutory.verdictMsg.args)}</p>
                      </div>
                    )}

                    {conflict && (
                      <div className="mt-2.5 rounded-lg border border-red-300 bg-red-50/60 px-3 py-2.5 flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-[#C5221F] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[11px] font-bold text-navy-900 mb-0.5">{t('Open work against an expired period')}</div>
                          <MethodNote className="text-[11.5px] text-navy-800 leading-relaxed" short={t('Officer capacity is being spent on a demand that cannot be raised.')} full={t('{0} item(s) are still live on this taxpayer — {1} audit case(s) and {2} unconcluded notice(s) — against a period that is already time-barred. Officer capacity is being spent on a demand that can no longer lawfully be raised. Close or re-scope them before any further work is booked.',
                              conflict.total, conflict.audit, conflict.notices)} />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 rounded-lg bg-steel-50 border border-steel-200 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('How this date is computed')}</div>
                      <p className="text-[11.5px] text-steel-700 leading-relaxed">{t(twin.legal.basis, ...(twin.legal.basisArgs || []))}{' '}
                        {t(twin.legal.basisSuffix, ...(twin.legal.basisSuffixArgs || []))}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-steel-500 leading-relaxed">{t('No proceeding is currently running against a statutory clock for this taxpayer.')}</p>
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Absent input, not a clear position')}</div>
                      <MethodNote className="text-[11.5px] text-navy-800 leading-relaxed" short={t('No audit case, so no period is fixed. An absence, not time in hand.')} full={t('The limitation register is built from audit cases. No audit case exists against this taxpayer, so no tax period has been fixed and no deadline can be stated. This is a gap in the record, and it must not be read as "there is time".')} />
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* The chronology — the thing an officer today rebuilds by hand. */}
            <Card
              title={t('Unified chronology')}
              subtitle={t('{0} events merged from {1} systems. Today this is reconstructed by hand from each system in turn.', twin.chronology.length, activity.systemCount)}
              padded={false}
            >
              <div className="px-5 py-2.5 border-b border-steel-100 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[11.5px] text-steel-600">
                  {t('Last departmental action')}: <strong className="text-navy-800">{activity.last ? t(activity.last.title) : t('none on record')}</strong>
                </span>
                {activity.days !== null && activity.days >= 0 && (
                  <Pill tone={activity.days > 90 ? 'red' : activity.days > 30 ? 'amber' : 'green'}>
                    {t('{0} days ago', activity.days)}
                  </Pill>
                )}
                <span className="ml-auto text-[10.5px] text-steel-500">
                  {t('Dwell since the file was last touched — the part of the lag the department owns.')}
                </span>
              </div>
              <div className="divide-y divide-steel-100 max-h-[420px] overflow-y-auto">
                {twin.chronology.map((e, i) => {
                  const tone = TONE_STYLES[KIND_TONE[e.kind] || 'steel']
                  return (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-24 shrink-0 text-[11px] tabular-nums text-steel-500 pt-0.5">{e.date}</div>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ backgroundColor: tone.accent }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-navy-900">{t(e.title, ...translateArgs(e.titleArgs))}</div>
                        {e.detail && <div className="text-[11.5px] text-steel-600 mt-0.5 leading-relaxed">{t(e.detail, ...translateArgs(e.detailArgs))}</div>}
                      </div>
                      <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-steel-100 text-steel-600">
                        {t(SOURCE_SYSTEMS[e.source]?.owner || e.source)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                title={t('Proceedings on record')}
                subtitle={t('Each count carries the part that is still live — a closed proceeding decides nothing today.')}
                padded={false}
              >
                <div className="divide-y divide-steel-100">
                  <CountRow
                    icon={FileText}
                    label={t('Notices issued')}
                    n={twin.proceedings.notices.length}
                    sub={t('{0} awaiting a reply or a hearing', record.noticesAwaiting)}
                  />
                  <CountRow
                    icon={Gavel}
                    label={t('Audit cases')}
                    n={twin.proceedings.audit.length}
                    sub={t('{0} not yet closed', record.auditOpen)}
                  />
                  <CountRow
                    icon={Banknote}
                    label={t('Refund claims')}
                    n={twin.proceedings.refunds.length}
                    sub={t('{0} claimed', lakh(record.refundValue))}
                  />
                  <CountRow
                    icon={Layers}
                    label={t('Appeals')}
                    n={twin.proceedings.litigation.length}
                    sub={t('{0} in dispute', lakh(record.disputedValue))}
                  />
                  <CountRow
                    icon={CircleAlert}
                    label={t('Compliance alerts')}
                    n={twin.proceedings.alerts.length}
                    sub={t('{0} still open', record.alertsOpen)}
                  />
                  <div className="px-5 py-3 flex items-start gap-2.5">
                    <NetworkIcon className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-steel-700">{t('Network cluster')}</span>
                      {twin.network && (
                        <div className="text-[10.5px] text-steel-500">
                          {t('{0} entities in the chain — acting alone does not stop it', twin.network.entityCount)}
                        </div>
                      )}
                    </div>
                    <span className="text-[12px] font-semibold text-navy-800 text-right">
                      {twin.network ? `${twin.network.clusterId} · ${t(twin.network.role)}` : t('Not linked')}
                    </span>
                  </div>
                </div>
              </Card>

              {/* The other half of the twin: not just what this case IS, but
                  what happened in the concluded proceedings most like it. */}
              <ComparableCases gstin={active} />

              {/* Coverage is stated honestly — a section that is empty because a
                  feed is absent must not read as a section that is empty because
                  the taxpayer has no record. */}
              <Card
                title={t('Source coverage')}
                subtitle={t('{0} of {1} systems contributed a fact to this twin — and {2} of the {1} are not integrated in this build, so what they contributed is a generated stand-in.', coverage.contributed, coverage.total, coverage.absent)}
                padded={false}
              >
                <div className="divide-y divide-steel-100">
                  {twin.coverage.map(c => (
                    <div key={c.key} className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {c.contributed
                          ? <CircleCheck className="w-3.5 h-3.5 shrink-0" style={{ color: TONE_STYLES.green.accent }} />
                          : <CircleAlert className="w-3.5 h-3.5 text-steel-300 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-medium text-navy-800 truncate">{t(c.label)}</div>
                          <div className="text-[10.5px] text-steel-500">{t(c.owner)}</div>
                        </div>
                        <Pill tone={c.connected ? 'green' : 'amber'}>
                          {c.connected ? t('Live') : t('Not integrated')}
                        </Pill>
                      </div>
                      {!c.contributed && (
                        <p className="text-[10.5px] text-steel-500 leading-relaxed mt-1 ml-6">
                          {t('{0} contributed nothing here. The fields it would carry are absent from this twin, not empty in the record.', t(c.label))}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-steel-100 flex items-start gap-2.5">
                  <Database className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
                  <MethodNote className="text-[11px] text-steel-500 leading-relaxed" short={t('No external system is connected — records are shaped like each feed.')} full={t('In this demonstration no external system is connected — the twin is assembled from generated records shaped like each source. A production deployment reads these feeds directly.')} />
                </div>
              </Card>
            </div>

            <HumanReviewBadge label={t('A unified view is decision support — verify against the source record before acting')} />
          </div>
        ) : (
          <Card><p className="text-sm text-steel-500">{t('No cases match the current filters.')}</p></Card>
        )}
      </div>
    </div>
  )
}

/* The single recommended action, carrying what deferring it costs. An action
 * with no price attached is a suggestion; with one it is a decision. */
function NextAction({ next, daysRemaining, decayNextWeek }) {
  const tone = TONE_STYLES[ACTION_TONE[next.urgency] || 'navy']
  const basisLabel = { statute: 'Required by statute', model: 'Model recommendation', record: 'From the case record' }[next.basis]
  return (
    <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
      <div className="flex items-center gap-2 mb-1.5">
        <ArrowRight className="w-3.5 h-3.5" style={{ color: tone.accent }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tone.accent }}>
          {t('Recommended next action')}
        </span>
        <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: tone.iconBg, color: tone.accent }}>
          {t(basisLabel)}
        </span>
      </div>
      <div className="text-[15px] font-bold text-navy-900">{t(next.action, ...(next.actionArgs || []))}</div>
      <p className="text-[12.5px] text-steel-700 mt-1 leading-relaxed">{t(next.because, ...(next.becauseArgs || []))}</p>
      {(decayNextWeek !== null || daysRemaining !== null) && (
        <div className="mt-2.5 pt-2.5 border-t flex flex-wrap gap-x-5 gap-y-1" style={{ borderColor: tone.border }}>
          {decayNextWeek !== null && (
            <span className="text-[11.5px] text-steel-700">
              {t('Cost of deferring seven days')}: <strong className="text-navy-900 tabular-nums">{lakh(decayNextWeek)}</strong>
            </span>
          )}
          {daysRemaining !== null && (
            <span className="text-[11.5px] text-steel-700">
              {daysRemaining < 0
                ? t('The statutory period expired {0} days ago', Math.abs(daysRemaining))
                : t('{0} days remain on the statutory clock', daysRemaining)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function Figure({ label, value, source, tone, context }) {
  const c = TONE_STYLES[tone]
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{label}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color: c.accent }}>{value}</div>
      {context && <div className="text-[10.5px] text-steel-600 leading-snug mt-0.5">{context}</div>}
      <div className="text-[9.5px] text-steel-400 mt-0.5">{t(SOURCE_SYSTEMS[source]?.owner || source)}</div>
    </div>
  )
}

function CountRow({ icon: Icon, label, n, sub }) {
  return (
    <div className="px-5 py-3 flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-steel-700">{label}</span>
        {sub && <div className="text-[10.5px] text-steel-500">{sub}</div>}
      </div>
      <span className="text-[13px] font-bold tabular-nums text-navy-800">{n}</span>
    </div>
  )
}
