import { useMemo, useState } from 'react'
import { Search, Quote, ShieldAlert, FileSearch, CircleSlash, Sparkles } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS } from '../data/mockData.js'
import { TWIN_INDEX, SOURCE_SYSTEMS } from '../data/caseTwin.js'
import { QUESTIONS, answerQuestion, COPILOT_NOTE } from '../data/copilot.js'
import { ActionBrief } from '../components/shared/ActionBrief.jsx'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`

// The case list is capped for rendering. The cap is surfaced rather than
// applied silently, so a missing case reads as truncation, not as absence.
const LIST_LIMIT = 40

/* Rebuilt as a retrieval surface over the Case Digital Twin.
 *
 * The previous version generated: it invented a taxpayer's reply for any
 * taxpayer, cited corpora that do not exist, and derived its confidence from
 * the risk score it was explaining. All of that is gone. This version either
 * cites a record the platform holds, or declines and names the feed that would
 * be needed — which is the more useful answer, because it tells the department
 * which integration unlocks the capability. */
export default function OfficerAICopilot() {
  const { filters, logAction } = useApp()
  const [query, setQuery] = useState('')
  const [gstin, setGstin] = useState(null)
  const [asked, setAsked] = useState([])

  /* Two separate narrowings, kept apart so each can be reported honestly: the
   * global filter bar decides which cases exist for this officer, and the box
   * above the list searches within them. */
  const scoped = useMemo(() => {
    const allowed = new Set(TAXPAYERS.filter(x => applyGlobalFilters(x, filters)).map(x => x.gstin))
    return TWIN_INDEX.filter(r => allowed.has(r.gstin))
  }, [filters])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? scoped.filter(r => `${r.gstin} ${r.tradeName}`.toLowerCase().includes(q)) : scoped
  }, [scoped, query])

  // The list is capped, and says so: a search that silently drops the case an
  // officer is looking for is worse than one that admits it was truncated.
  const index = useMemo(() => matches.slice(0, LIST_LIMIT), [matches])

  /* What this surface can answer at all, stated before a question is asked.
   * The denominator is the point: a copilot that only declines on click looks
   * broken, one that states its coverage up front is reporting a fact about
   * the department's integrations. */
  const coverage = useMemo(() => {
    const systems = Object.values(SOURCE_SYSTEMS)
    return {
      grounded: QUESTIONS.filter(q => q.grounded).length,
      questions: QUESTIONS.length,
      liveFeeds: systems.filter(s => s.connected).length,
      totalFeeds: systems.length
    }
  }, [])

  const active = gstin || index[0]?.gstin
  const activeRow = index.find(r => r.gstin === active) || null

  const ask = qid => {
    if (!active) return
    const result = answerQuestion(qid, active)
    if (!result) return
    logAction(`Copilot query: ${result.question}`, 'Officer AI Copilot', active)
    setAsked(prev => [{ ...result, key: `${qid}-${Date.now()}` }, ...prev].slice(0, 6))
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t('Enforcement · Case Retrieval')}
        title={t('Officer Copilot')}
        description={<MethodNote short={t('Answers drawn from the record, not generated. Every statement cites its source.')} full={t('Answers drawn from the case record, not generated. Every statement cites the record and the system it came from; a question that cannot be grounded is declined, naming the feed that would be needed to answer it.')} />}
        actions={<ExportBar moduleLabel="Officer Copilot" />}
      />

      <FilterScope shown={scoped.length} total={TWIN_INDEX.length} unit={t('case records')}
        ignores={{
          dateRange: 'This screen reads a current-state register rather than a stream of dated events, so there is no date on the records to narrow against.'
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Case selection */}
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
          </div>
          {/* The list has always been ordered by the statutory clock. Saying so
              — and showing the clock — is the difference between an ordering an
              officer can rely on and one they cannot see. */}
          <div className="px-3.5 py-2 border-b border-steel-100 bg-steel-50/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500">{t('Nearest statutory deadline first')}</div>
            <div className="text-[10.5px] text-steel-500 mt-0.5">
              {matches.length > LIST_LIMIT
                ? t('Showing {0} of {1} matching cases — narrow the search to reach the rest.', index.length, matches.length)
                : t('{0} matching cases', matches.length)}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-steel-100">
            {index.map(r => (
              <button
                key={r.gstin}
                onClick={() => { setGstin(r.gstin); setAsked([]) }}
                className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                  r.gstin === active ? 'bg-navy-50 border-l-2 border-ink-700' : 'hover:bg-steel-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-navy-900 truncate">{r.tradeName}</div>
                    <div className="text-[10.5px] text-steel-500 truncate">{r.gstin}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[10.5px] font-bold tabular-nums ${
                      r.daysRemaining == null ? 'text-steel-300' : r.daysRemaining < 0 ? 'text-steel-400' : r.daysRemaining <= 30 ? 'text-maharisk-critical' : 'text-navy-700'
                    }`}>
                      {r.daysRemaining == null
                        ? t('no clock')
                        : r.daysRemaining < 0 ? t('{0}d over', Math.abs(r.daysRemaining)) : t('{0}d', r.daysRemaining)}
                    </div>
                    <div className="text-[10px] text-steel-400 tabular-nums">{lakh(r.exposure)}</div>
                  </div>
                </div>
              </button>
            ))}
            {index.length === 0 && <div className="px-4 py-6 text-xs text-steel-500">{t('No cases match the current filters.')}</div>}
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          {activeRow && (
            <div className="rounded-xl border border-steel-200 bg-white shadow-card px-5 py-4 flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <div className="text-base font-bold text-navy-900 truncate">{activeRow.tradeName}</div>
                <div className="text-[11.5px] text-steel-500">{activeRow.gstin} · {t(activeRow.district)}</div>
              </div>
              {/* Exposure on its own is the figure before the decay curve and
                  before limitation. Both correctives sit beside it. */}
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <RiskBadge category={activeRow.riskCategory} score={activeRow.riskScore} size="sm" />
                <Pill tone="steel">{t('{0} exposure', lakh(activeRow.exposure))}</Pill>
                {activeRow.recoverableNow != null
                  ? <Pill tone="green">{t('{0} recoverable', lakh(activeRow.recoverableNow))}</Pill>
                  : <Pill tone="steel">{t('No recovery record')}</Pill>}
                {activeRow.daysRemaining == null
                  ? <Pill tone="steel">{t('No limitation record')}</Pill>
                  : activeRow.daysRemaining < 0
                    ? <Pill tone="red">{t('{0} days past the deadline', Math.abs(activeRow.daysRemaining))}</Pill>
                    : <Pill tone={activeRow.daysRemaining <= 30 ? 'amber' : 'navy'}>{t('{0} days remain', activeRow.daysRemaining)}</Pill>}
              </div>
            </div>
          )}

          {/* The seven elements an officer needs before acting, assembled in
              one place rather than scattered across seven screens. */}
          {active && <ActionBrief gstin={active} />}

          <Card
            title={t('Ask about this case')}
            subtitle={<MethodNote short={t('The rest are declined, naming the feed that would answer them.')} full={t('{0} of {1} questions can be answered from the record as the platform is connected today; {2} of {3} source systems are live in this environment. The rest are declined, and the refusal names the feed that would answer them.', coverage.grounded, coverage.questions, coverage.liveFeeds, coverage.totalFeeds)} />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUESTIONS.map(q => (
                <button
                  key={q.id}
                  onClick={() => ask(q.id)}
                  disabled={!active}
                  className={`text-left text-[12.5px] px-3 py-2.5 rounded-lg border transition-colors disabled:opacity-40 ${
                    q.grounded
                      ? 'border-steel-200 hover:border-navy-300 hover:bg-navy-50 text-navy-800'
                      : 'border-saffron-300 bg-saffron-50/60 hover:bg-saffron-50 text-saffron-900'
                  }`}
                >
                  <span className="flex items-start gap-2">
                    {q.grounded
                      ? <FileSearch className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
                      : <CircleSlash className="w-3.5 h-3.5 shrink-0 mt-0.5 text-saffron-600" />}
                    <span>{t(q.label)}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {asked.length === 0 && (
            <Card>
              <div className="flex items-start gap-2.5 text-[12.5px] text-steel-600 leading-relaxed">
                <Sparkles className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
                <span>{t('Select a question above. Answers are assembled from the case record — nothing here is generated, and nothing is asserted without a citation.')}</span>
              </div>
            </Card>
          )}

          {asked.map(a => (a.grounded ? <GroundedAnswer key={a.key} a={a} /> : <DeclinedAnswer key={a.key} a={a} />))}

          {asked.length > 0 && (
            <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(COPILOT_NOTE)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GroundedAnswer({ a }) {
  // How much of this answer rests on a live feed, rather than on a record the
  // platform derived for itself. An officer defending the answer needs that
  // split before they quote it.
  const cited = [...new Set(a.statements.map(s => s.cite.source))]
  const live = cited.filter(s => SOURCE_SYSTEMS[s] && SOURCE_SYSTEMS[s].connected)

  return (
    <Card
      title={t(a.question)}
      subtitle={t('{0} statement(s) citing {1} system(s), of which {2} are live feeds in this environment — the rest are demonstration records.', a.statements.length, cited.length, live.length)}
      padded={false}
    >
      <div className="divide-y divide-steel-100">
        {a.statements.map((s, i) => (
          <div key={i} className="px-5 py-3.5">
            <div className="flex items-start gap-2.5">
              <Quote className="w-3 h-3 text-steel-300 shrink-0 mt-1" />
              <p className="text-[13px] text-navy-800 leading-relaxed flex-1">{t(s.text)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-5.5">
              <span className="text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-steel-100 text-steel-600">
                {SOURCE_SYSTEMS[s.cite.source]?.owner || s.cite.source}
              </span>
              <span className="text-[10.5px] text-steel-500">{s.cite.record}</span>
              <span className="text-[10.5px] text-steel-400 tabular-nums ml-auto">{t('as at')} {s.cite.asOf}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-2.5 border-t border-steel-100">
        <HumanReviewBadge label={t('Retrieved from the case record — verify against the source system before acting')} />
      </div>
    </Card>
  )
}

// The refusal is the feature. It names the specific feed rather than failing
// vaguely, so the gap becomes an integration decision rather than a mystery.
function DeclinedAnswer({ a }) {
  const tone = TONE_STYLES.amber
  return (
    <div className="rounded-xl border shadow-card overflow-hidden" style={{ borderColor: tone.border }}>
      <div className="px-5 py-3 border-b" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
        <div className="flex items-center gap-2">
          <CircleSlash className="w-4 h-4 shrink-0" style={{ color: tone.accent }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tone.accent }}>
            {t('Cannot be answered from the record')}
          </span>
        </div>
        <div className="text-sm font-bold text-navy-900 mt-1">{t(a.question)}</div>
      </div>
      <div className="bg-white px-5 py-4 space-y-3">
        <p className="text-[13px] text-navy-800 leading-relaxed">{t(a.declined.reason)}</p>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('What would be required')}</div>
          <p className="text-[12px] text-steel-700 leading-relaxed">{t(a.declined.wouldNeed)}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Pill tone="amber">{a.declined.connected ? t('Connected') : t('Not integrated')}</Pill>
            <span className="text-[11px] text-steel-600">{t(a.declined.feedLabel)} · {t(a.declined.feedOwner)}</span>
          </div>
          <MethodNote className="text-[11px] text-steel-500 leading-relaxed mt-2" short={t('Until that feed is connected, no answer here can be grounded.')} full={t('This is the integration decision the question turns into: until that feed is connected, no answer here can be grounded, and the platform will keep declining rather than approximating one.')} />
        </div>
      </div>
    </div>
  )
}
