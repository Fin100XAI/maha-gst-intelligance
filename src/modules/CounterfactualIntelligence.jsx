import { useMemo, useState } from 'react'
import { Search, Clock, Database, Users, AlertTriangle, GitCompare, Split } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import {
  COUNTERFACTUALS, COUNTERFACTUAL_NOTE,
  LAG_OWNERSHIP_NOTE, buildCounterfactual
} from '../data/retrospective.js'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const crFrom = n => Math.round((n / 10000000) * 100) / 100
const share = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)
const median = xs => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0)

/* One case, four worlds — the same action taken on four different days. Never a
 * different action, because that is a causal claim this platform cannot make. */
export default function CounterfactualIntelligence() {
  const [query, setQuery] = useState('')
  const [gstin, setGstin] = useState(COUNTERFACTUALS[0]?.gstin || null)

  const { filters } = useApp()
  const scoped = useMemo(() => COUNTERFACTUALS.filter(c => applyScopeFilters(c, filters)), [filters])
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped.filter(c => !q || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(q)).slice(0, 60)
  }, [query, scoped])

  /* Portfolio figures over the SCOPED set, so a divisional filter narrows the
   * headline and not only the list. Each is an aggregation of the per-case
   * values the retrospective engine produced — nothing is re-modelled here, and
   * the two halves of the lag are never added into one average. */
  const S = useMemo(() => {
    const sum = f => scoped.reduce((s, c) => s + f(c), 0)
    const lostQueue = sum(c => c.lostToQueue)
    const lostDetection = sum(c => c.lostToDetection)
    return {
      caseCount: scoped.length,
      exposureCr: crFrom(sum(c => c.exposure)),
      lostToQueueCr: crFrom(lostQueue),
      lostToDetectionCr: crFrom(lostDetection),
      lostTotalCr: crFrom(lostQueue + lostDetection),
      stillRecoverableCr: crFrom(sum(c => c.atNow)),
      recoverableShare: share(sum(c => c.atNow), sum(c => c.exposure)),
      queuePct: share(lostQueue, lostQueue + lostDetection),
      medianQueueDays: median(scoped.map(c => c.queueDwellDays)),
      medianDetectionDays: median(scoped.map(c => c.detectionFloorDays)),
      queueDominant: scoped.filter(c => c.queueDwellDays > c.detectionFloorDays).length
    }
  }, [scoped])

  /* A case the filter has excluded must not stay on screen beside figures that
   * no longer include it. */
  const activeGstin = useMemo(() => {
    if (gstin && scoped.some(c => c.gstin === gstin)) return gstin
    return list[0]?.gstin || null
  }, [gstin, scoped, list])

  const cf = useMemo(() => (activeGstin ? buildCounterfactual(activeGstin) : null), [activeGstin])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Missed Revenue · Counterfactual')}
        title={t('Counterfactual Case Intelligence')}
        description={t('What the same action, taken earlier, would have been worth on a given case — with comparable concluded proceedings shown as the evidence behind the comparison. Timing only: what a different escalation route would have produced is a causal claim this platform does not make, and the screen says so.')}
        actions={<ExportBar moduleLabel="Counterfactual Case Intelligence" />}
      />

      {/* Stated before the figures, not after them: every number below is
          computed over the narrowed set. */}
      <FilterScope shown={scoped.length} total={COUNTERFACTUALS.length} unit={t('cases')} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label={t('Lost to queue dwell')}
          value={S.lostToQueueCr}
          unit={t('₹ Cr — {0}% of all lag loss, and the department’s own', S.queuePct)}
          tone="red"
          icon={Users}
        />
        <KpiCard
          label={t('Lost to detection latency')}
          value={S.lostToDetectionCr}
          unit={t('₹ Cr — {0}%, a data-feed floor no queue can shorten', 100 - S.queuePct)}
          tone="amber"
          icon={Database}
        />
        <KpiCard
          label={t('Median lag, reported in two parts')}
          value={t('{0}d + {1}d', S.medianDetectionDays, S.medianQueueDays)}
          unit={t('detection floor, then queue dwell — never blended')}
          tone="orange"
          icon={Split}
        />
        <KpiCard
          label={t('Still recoverable today')}
          value={S.stillRecoverableCr}
          unit={t('₹ Cr — {0}% of the {1} Cr exposure on these {2} cases', S.recoverableShare, S.exposureCr, S.caseCount)}
          tone="green"
          icon={Clock}
        />
      </div>

      {/* Portfolio split — two owners, two fixes. */}
      <Card
        title={t('Where the lag sits across the portfolio')}
        subtitle={t('Two parts, kept apart, because they have different owners and different fixes.')}
        className="mb-4"
      >
        <div className="flex h-10 rounded-lg overflow-hidden border border-steel-200 mb-2">
          <div className="bg-[#C5221F] flex items-center px-3" style={{ width: `${S.queuePct}%` }}>
            <span className="text-[11.5px] font-bold text-white tabular-nums truncate">
              {t('Queue dwell')} ₹{S.lostToQueueCr} {t('Cr')}
            </span>
          </div>
          <div className="bg-amber-500 flex items-center justify-end px-3 flex-1">
            <span className="text-[11.5px] font-bold text-white tabular-nums truncate">
              {t('Detection')} ₹{S.lostToDetectionCr} {t('Cr')}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <Pill tone="red">{t('Owner: allocation and capacity')}</Pill>
            </div>
            <p className="text-[11.5px] text-navy-800 leading-relaxed">
              {t('₹{0} Cr, {1}% of the total lag loss, sat in the queue after the signal was already visible. Median dwell {2} days. This is the part a prioritisation decision changes this quarter, at the same headcount.',
                S.lostToQueueCr, S.queuePct, S.medianQueueDays)}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <Pill tone="amber">{t('Owner: data feed integration')}</Pill>
            </div>
            <p className="text-[11.5px] text-navy-800 leading-relaxed">
              {t('₹{0} Cr, {1}% of the total, was gone before the signal could physically exist. Median detection floor {2} days. No amount of prioritisation shortens this — it moves only when a faster feed replaces the return cycle.',
                S.lostToDetectionCr, 100 - S.queuePct, S.medianDetectionDays)}
            </p>
          </div>
        </div>
        <p className="text-[12px] text-navy-800 leading-relaxed mb-2">
          {t('On {0} of {1} cases in view the department’s own dwell exceeded the detection floor — on those, the delay was not the return cycle.', S.queueDominant, S.caseCount)}
        </p>
        <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(LAG_OWNERSHIP_NOTE)}</p>
      </Card>

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
            <div className="text-[10px] text-steel-400 mt-2 leading-relaxed">
              {t('Ordered by value lost to queue dwell — the controllable half.')}
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-steel-100">
            {list.map(c => (
              <button
                key={c.gstin}
                onClick={() => setGstin(c.gstin)}
                className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                  c.gstin === activeGstin ? 'bg-navy-50 border-l-2 border-ink-700' : 'hover:bg-steel-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-navy-900 truncate flex-1">{c.tradeName}</span>
                  <span className="text-[11px] font-bold text-[#C5221F] tabular-nums">{lakh(c.lostToQueue)}</span>
                </div>
                <div className="text-[10.5px] text-steel-500 truncate">
                  {t('{0} · detection {1}d, then queue {2}d', t(c.division), c.detectionFloorDays, c.queueDwellDays)}
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <div className="px-4 py-6 text-xs text-steel-500">{t('No cases match the current filters.')}</div>
            )}
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
  const floor = cf.scenarios.find(s => s.id === 'floor')

  return (
    <div className="min-w-0 space-y-3">
      <div className="rounded-xl border border-steel-200 bg-white shadow-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-base font-bold text-navy-900">{cf.tradeName}</span>
          <Pill tone="steel">{cf.leadRule ? t(cf.leadRule.label) : t('signal')}</Pill>
          <span className="ml-auto text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-steel-400">{t('Forgone by waiting')}</span>
            <span className="block text-[17px] font-bold text-[#C5221F] tabular-nums">{lakh(cf.forgoneVsFeasible)}</span>
          </span>
        </div>
        <div className="text-[11.5px] text-steel-500">
          {t('{0} · {1} · signal first visible {2}', cf.gstin, t(cf.division), cf.signalFirstSeenOn)}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-steel-100 text-[11.5px]">
          <span className="text-steel-600">
            {t('Estimated exposure')}: <strong className="text-navy-900 tabular-nums">{lakh(cf.exposure)}</strong>
          </span>
          <span className="text-steel-600">
            {t('Still recoverable today')}: <strong className="text-navy-900 tabular-nums">{lakh(cf.atNow)}</strong>
            <span className="text-steel-400"> {t('({0}% of exposure)', share(cf.atNow, cf.exposure))}</span>
          </span>
          <span className="text-steel-600">
            {t('Controllable share of the loss')}: <strong className="text-navy-900 tabular-nums">{cf.controllableShare}%</strong>
          </span>
        </div>
      </div>

      {/* The two lags, separately owned, on this one case. Blending them into a
          single "lag" figure would hide which of the two to fix. */}
      <Card
        title={t('Where this case’s lag came from')}
        subtitle={t('Reported in two parts because they have different owners. The total is {0} days from the behaviour to the day the case was worked.', cf.totalLagDays)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">{t('Detection latency')}</span>
              <Pill tone="amber">{t('Data feed')}</Pill>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-bold tabular-nums text-navy-900 leading-none">{t('{0}d', cf.detectionFloorDays)}</span>
              <span className="text-[13px] font-semibold tabular-nums text-navy-800">{lakh(cf.lostToDetection)}</span>
            </div>
            <p className="text-[11px] text-steel-600 leading-relaxed mt-1.5">
              {t('The earliest this signal could exist at all, because it waits on a return being filed. Not shortenable by prioritisation — only by a feed that arrives before the return does.')}
            </p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/40 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5221F]">{t('Queue dwell')}</span>
              <Pill tone="red">{t('Allocation')}</Pill>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-bold tabular-nums text-[#C5221F] leading-none">{t('{0}d', cf.queueDwellDays)}</span>
              <span className="text-[13px] font-semibold tabular-nums text-navy-800">{lakh(cf.lostToQueue)}</span>
            </div>
            <p className="text-[11px] text-steel-600 leading-relaxed mt-1.5">
              {t('How long the case then sat unworked after the signal was visible. This is the part a decision the department can take today would have changed.')}
            </p>
          </div>
        </div>
        <p className="text-[11.5px] text-steel-600 leading-relaxed mt-3">
          {t('{0} days of detection latency plus {1} days of queue dwell make the {2} days of total lag. They are not averaged together, because one is answered by an integration and the other by a rota.',
            cf.detectionFloorDays, cf.queueDwellDays, cf.totalLagDays)}
        </p>
      </Card>

      {/* Four worlds, same action. */}
      <Card
        title={t('The same action, taken on four different days')}
        subtitle={t('Each bar is the recovery curve evaluated at that day, against an exposure of {0}. None of them models a different action.', lakh(cf.exposure))}
      >
        <div className="space-y-3">
          {cf.scenarios.map(s => (
            <div key={s.id}>
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <span className={`text-[12.5px] ${s.actual ? 'font-bold text-navy-900' : 'font-medium text-steel-700'}`}>{t(s.label)}</span>
                {s.actual && <Pill tone="red">{t('what happened')}</Pill>}
                {!s.feasible && <Pill tone="steel">{t('ceiling — not achievable')}</Pill>}
                <span className="ml-auto text-[13px] font-bold text-navy-900 tabular-nums">
                  {lakh(s.value)}
                  <span className="text-[11px] font-normal text-steel-500"> {t('({0}% of exposure)', share(s.value, cf.exposure))}</span>
                </span>
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
              lakh(floor.value),
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
          <p className="text-[12px] text-navy-800 leading-relaxed">{t(cf.comparables.rateNote)}</p>
        </div>
        {cf.comparables.none ? (
          <p className="text-[12.5px] text-steel-600 leading-relaxed">{t(cf.comparables.noneReason)}</p>
        ) : (
          <div className="space-y-2">
            {cf.comparables.comparables.map(c => (
              <div key={c.gstin} className="rounded-lg border border-steel-200 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <GitCompare className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                  <span className="text-[12.5px] font-semibold text-navy-900">{c.tradeName}</span>
                  {c.outcomeMeta && (
                    <Pill tone={c.outcomeMeta.tone === 'green' ? 'green' : c.outcomeMeta.tone === 'red' ? 'red' : 'amber'}>
                      {t(c.outcomeMeta.label)}
                    </Pill>
                  )}
                  <span className="ml-auto text-[11px] text-steel-500">
                    {t('comparability')} <strong className="text-navy-900 tabular-nums">{c.score}</strong>
                    <span className="text-steel-400"> {t('on {0} of {1} dimensions', c.assessedOn, c.ofDimensions)}</span>
                  </span>
                </div>
                {c.matches.length > 0 && <p className="text-[11.5px] text-emerald-800 leading-relaxed">+ {c.matches.map(m => t(m.text)).join(' · ')}</p>}
                {c.distinguishers.length > 0 && <p className="text-[11.5px] text-[#C5221F] leading-relaxed">− {c.distinguishers.map(d => t(d.text)).join(' · ')}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* The boundary of the claim, on every case. */}
      <div className="rounded-xl border border-steel-300 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[13px] font-bold text-navy-900">{t('Timing only — not a different decision')}</span>
            <Pill tone="steel">{t('Arithmetic on a stated curve')}</Pill>
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(cf.boundary)}</p>
          <p className="text-[12px] text-steel-600 leading-relaxed mt-2">{t(COUNTERFACTUAL_NOTE)}</p>
        </div>
      </div>
    </div>
  )
}
