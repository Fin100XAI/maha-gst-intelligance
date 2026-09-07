import { useMemo, useState } from 'react'
import { Search, Clock, Database, Users, Info, AlertTriangle, GitCompare } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import {
  COUNTERFACTUALS, COUNTERFACTUAL_SUMMARY, COUNTERFACTUAL_NOTE,
  LAG_OWNERSHIP_NOTE, buildCounterfactual
} from '../data/retrospective.js'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`

/* One case, four worlds — the same action taken on four different days. Never a
 * different action, because that is a causal claim this platform cannot make. */
export default function CounterfactualIntelligence() {
  const S = COUNTERFACTUAL_SUMMARY
  const [query, setQuery] = useState('')
  const [gstin, setGstin] = useState(COUNTERFACTUALS[0]?.gstin || null)

  const { filters } = useApp()
  const scoped = useMemo(() => COUNTERFACTUALS.filter(c => applyScopeFilters(c, filters)), [filters])
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped.filter(c => !q || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(q)).slice(0, 60)
  }, [query, scoped])

  const cf = useMemo(() => (gstin ? buildCounterfactual(gstin) : null), [gstin])
  const queuePct = Math.round((S.lostToQueueCr / (S.lostToQueueCr + S.lostToDetectionCr || 1)) * 100)

  return (
    <div>
      <SectionHeader
        eyebrow={t('Missed Revenue · Counterfactual')}
        title={t('Counterfactual Case Intelligence')}
        description={t('What the same action, taken earlier, would have been worth on a given case — with comparable concluded proceedings shown as the evidence behind the comparison. Timing only: what a different escalation route would have produced is a causal claim this platform does not make, and the screen says so.')}
        actions={<ExportBar moduleLabel="Counterfactual Case Intelligence" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Lost to queue dwell')} value={S.lostToQueueCr} unit={t('₹ Cr — controllable')} tone="red" icon={Users} />
        <KpiCard label={t('Lost to detection latency')} value={S.lostToDetectionCr} unit={t('₹ Cr — data-feed')} tone="amber" icon={Database} />
        <KpiCard label={t('Median queue wait')} value={`${S.medianQueueDays}d`} unit={t('signal visible to worked')} tone="orange" icon={Clock} />
        <KpiCard label={t('Still recoverable')} value={S.stillRecoverableCr} unit={t('₹ Cr today')} tone="green" icon={Clock} />
      </div>

      {/* Portfolio split — two owners, two fixes. */}
      <Card title={t('Where the lag sits across the portfolio')} className="mb-4">
        <div className="flex h-10 rounded-lg overflow-hidden border border-steel-200 mb-2">
          <div className="bg-[#C5221F] flex items-center px-3" style={{ width: `${queuePct}%` }}>
            <span className="text-[11.5px] font-bold text-white tabular-nums truncate">{t('Queue dwell')} ₹{S.lostToQueueCr} Cr</span>
          </div>
          <div className="bg-amber-500 flex items-center justify-end px-3 flex-1">
            <span className="text-[11.5px] font-bold text-white tabular-nums truncate">{t('Detection')} ₹{S.lostToDetectionCr} Cr</span>
          </div>
        </div>
        <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(LAG_OWNERSHIP_NOTE)}</p>
      </Card>

      <FilterScope shown={scoped.length} total={COUNTERFACTUALS.length} unit={t('cases')} />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
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
          <div className="max-h-[560px] overflow-y-auto divide-y divide-steel-100">
            {list.map(c => (
              <button
                key={c.gstin}
                onClick={() => setGstin(c.gstin)}
                className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                  c.gstin === gstin ? 'bg-navy-50 border-l-2 border-ink-700' : 'hover:bg-steel-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-navy-900 truncate flex-1">{c.tradeName}</span>
                  <span className="text-[11px] font-bold text-[#C5221F] tabular-nums">{lakh(c.lostToQueue)}</span>
                </div>
                <div className="text-[10.5px] text-steel-500 truncate">{c.division} · {t('queue')} {c.queueDwellDays}d</div>
              </button>
            ))}
          </div>
        </Card>

        {cf && <CaseCounterfactual cf={cf} />}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CaseCounterfactual({ cf }) {
  const max = Math.max(...cf.scenarios.map(s => s.value), 1)

  return (
    <div className="min-w-0 space-y-3">
      <div className="rounded-xl border border-steel-200 bg-white shadow-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-base font-bold text-navy-900">{cf.tradeName}</span>
          <Pill tone="steel">{cf.leadRule?.label || t('signal')}</Pill>
          <span className="ml-auto text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-steel-400">{t('Forgone by waiting')}</span>
            <span className="block text-[17px] font-bold text-[#C5221F] tabular-nums">{lakh(cf.forgoneVsFeasible)}</span>
          </span>
        </div>
        <div className="text-[11.5px] text-steel-500">
          {cf.gstin} · {cf.division} · {t('signal first visible')} {cf.signalFirstSeenOn}
        </div>
      </div>

      {/* Four worlds, same action. */}
      <Card
        title={t('The same action, taken on four different days')}
        subtitle={t('Each bar is the recovery curve evaluated at that day. None of them models a different action.')}
      >
        <div className="space-y-3">
          {cf.scenarios.map(s => (
            <div key={s.id}>
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <span className={`text-[12.5px] ${s.actual ? 'font-bold text-navy-900' : 'font-medium text-steel-700'}`}>{t(s.label)}</span>
                {s.actual && <Pill tone="red">{t('what happened')}</Pill>}
                {!s.feasible && <Pill tone="steel">{t('ceiling — not achievable')}</Pill>}
                <span className="ml-auto text-[13px] font-bold text-navy-900 tabular-nums">{lakh(s.value)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-14 shrink-0 text-[10.5px] text-steel-500 tabular-nums text-right">{t('day')} {s.day}</div>
                <div className="flex-1 h-6 rounded bg-steel-100 overflow-hidden">
                  <div
                    className={`h-full ${s.actual ? 'bg-[#C5221F]' : !s.feasible ? 'bg-steel-300' : 'bg-emerald-600/80'}`}
                    style={{ width: `${Math.max((s.value / max) * 100, 2)}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-steel-500 leading-relaxed mt-0.5 ml-16">{t(s.note)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-3 mt-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('The gap that was controllable')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">
            {t('Acting when the signal first became visible would have preserved {0}. The case was worked {1} days later and {2} remained. The difference, {3}, was lost to queue dwell rather than to anything about the taxpayer.',
              lakh(cf.scenarios.find(s => s.id === 'floor').value),
              cf.queueDwellDays,
              lakh(cf.atNow),
              lakh(cf.forgoneVsFeasible))}
          </p>
        </div>
      </Card>

      {/* The evidence behind the comparison. */}
      <Card
        title={t('Comparable concluded proceedings')}
        subtitle={t('The evidence driving the comparison — concluded cases comparable on the dimensions that decide outcomes, with what actually happened in each.')}
      >
        <div className={`rounded-lg border px-3.5 py-2.5 mb-3 ${cf.comparables.rateStated ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <p className="text-[12px] text-navy-800 leading-relaxed">{cf.comparables.rateNote}</p>
        </div>
        {cf.comparables.none ? (
          <p className="text-[12.5px] text-steel-600 leading-relaxed">{cf.comparables.noneReason}</p>
        ) : (
          <div className="space-y-2">
            {cf.comparables.comparables.map(c => (
              <div key={c.gstin} className="rounded-lg border border-steel-200 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <GitCompare className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                  <span className="text-[12.5px] font-semibold text-navy-900">{c.tradeName}</span>
                  {c.outcomeMeta && (
                    <Pill tone={c.outcomeMeta.tone === 'green' ? 'green' : c.outcomeMeta.tone === 'red' ? 'red' : 'amber'}>
                      {c.outcomeMeta.label}
                    </Pill>
                  )}
                  <span className="ml-auto text-[11px] text-steel-500">{t('comparability')} <strong className="text-navy-900 tabular-nums">{c.score}</strong></span>
                </div>
                {c.matches.length > 0 && <p className="text-[11.5px] text-emerald-800 leading-relaxed">+ {c.matches.map(m => m.text).join(' · ')}</p>}
                {c.distinguishers.length > 0 && <p className="text-[11.5px] text-[#C5221F] leading-relaxed">− {c.distinguishers.map(d => d.text).join(' · ')}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* The boundary of the claim, on every case. */}
      <div className="rounded-xl border border-steel-300 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('Timing only — not a different decision')}</div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{cf.boundary}</p>
          <p className="text-[12px] text-steel-600 leading-relaxed mt-2">{t(COUNTERFACTUAL_NOTE)}</p>
        </div>
      </div>
    </div>
  )
}
