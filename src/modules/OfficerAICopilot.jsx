import { useMemo, useState } from 'react'
import { Search, Quote, ShieldAlert, FileSearch, CircleSlash, Sparkles } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS } from '../data/mockData.js'
import { TWIN_INDEX, SOURCE_SYSTEMS } from '../data/caseTwin.js'
import { QUESTIONS, answerQuestion, COPILOT_NOTE } from '../data/copilot.js'
import { ActionBrief } from '../components/shared/ActionBrief.jsx'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`

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

  const index = useMemo(() => {
    const allowed = new Set(TAXPAYERS.filter(x => applyGlobalFilters(x, filters)).map(x => x.gstin))
    const q = query.trim().toLowerCase()
    return TWIN_INDEX
      .filter(r => allowed.has(r.gstin))
      .filter(r => !q || `${r.gstin} ${r.tradeName}`.toLowerCase().includes(q))
      .slice(0, 40)
  }, [filters, query])

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
        description={t('Answers drawn from the case record, not generated. Every statement cites the record and the system it came from; a question that cannot be grounded is declined, naming the feed that would be needed to answer it.')}
        actions={<ExportBar moduleLabel="Officer Copilot" />}
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
          <div className="max-h-[420px] overflow-y-auto divide-y divide-steel-100">
            {index.map(r => (
              <button
                key={r.gstin}
                onClick={() => { setGstin(r.gstin); setAsked([]) }}
                className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                  r.gstin === active ? 'bg-navy-50 border-l-2 border-ink-700' : 'hover:bg-steel-50 border-l-2 border-transparent'
                }`}
              >
                <div className="text-xs font-semibold text-navy-900 truncate">{r.tradeName}</div>
                <div className="text-[10.5px] text-steel-500 truncate">{r.gstin}</div>
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
              <div className="flex items-center gap-2 ml-auto">
                <RiskBadge category={activeRow.riskCategory} score={activeRow.riskScore} size="sm" />
                <Pill tone="steel">{lakh(activeRow.exposure)}</Pill>
              </div>
            </div>
          )}

          {/* The seven elements an officer needs before acting, assembled in
              one place rather than scattered across seven screens. */}
          {active && <ActionBrief gstin={active} />}

          <Card title={t('Ask about this case')} subtitle={t('Grounded questions return cited statements. The three marked below cannot be grounded on the feeds currently connected.')}>
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
              <p className="text-[11.5px] text-steel-600 leading-relaxed">{COPILOT_NOTE}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GroundedAnswer({ a }) {
  return (
    <Card title={a.question} subtitle={t('{0} statement(s), each cited to the record behind it', a.statements.length)} padded={false}>
      <div className="divide-y divide-steel-100">
        {a.statements.map((s, i) => (
          <div key={i} className="px-5 py-3.5">
            <div className="flex items-start gap-2.5">
              <Quote className="w-3 h-3 text-steel-300 shrink-0 mt-1" />
              <p className="text-[13px] text-navy-800 leading-relaxed flex-1">{s.text}</p>
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
        <div className="text-sm font-bold text-navy-900 mt-1">{a.question}</div>
      </div>
      <div className="bg-white px-5 py-4 space-y-3">
        <p className="text-[13px] text-navy-800 leading-relaxed">{a.declined.reason}</p>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('What would be required')}</div>
          <p className="text-[12px] text-steel-700 leading-relaxed">{a.declined.wouldNeed}</p>
          <div className="flex items-center gap-2 mt-2">
            <Pill tone="amber">{a.declined.connected ? t('Connected') : t('Not integrated')}</Pill>
            <span className="text-[11px] text-steel-600">{a.declined.feedLabel} · {a.declined.feedOwner}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
