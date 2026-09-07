import { useMemo, useState } from 'react'
import { Search, RotateCcw, AlertTriangle, Lock, Info, Gavel, ShieldAlert, Hourglass, Scale } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import {
  REVISIT_CANDIDATES, REVISIT_NOTE,
  buildRevisitBrief, FRAUD_LABEL_STATE, SEPARATION_TEST
} from '../data/retrospective.js'
import { TAXPAYERS } from '../data/mockData.js'
import { FilterScope, FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const TABS = [
  { key: 'candidates', label: 'Review candidates', icon: RotateCcw },
  { key: 'why', label: 'Why no Section 74 classification', icon: Lock }
]

/* Time buckets, because "how much exposure" and "how long is left on it" are
 * different questions and only the second decides what an officer opens first.
 * A candidate whose clock has 14 days left outranks one worth four times as
 * much with two years to run. */
const CLOCK_BANDS = [
  { id: 'd30', tone: 'red', test: d => d !== null && d >= 0 && d <= 30 },
  { id: 'd90', tone: 'orange', test: d => d !== null && d > 30 && d <= 90 },
  { id: 'd180', tone: 'amber', test: d => d !== null && d > 90 && d <= 180 },
  { id: 'd181', tone: 'green', test: d => d !== null && d > 180 },
  { id: 'none', tone: 'steel', test: d => d === null }
]

/* Band labels are resolved at render rather than declared as constants, so the
 * translator sees them as literals and they follow a locale change. */
function bandLabel(id) {
  if (id === 'd30') return t('Within 30 days')
  if (id === 'd90') return t('31 to 90 days')
  if (id === 'd180') return t('91 to 180 days')
  if (id === 'd181') return t('Over 180 days')
  return t('No clock established')
}

/* Retrospective review of cases the department put down. Produces explainable
 * review candidates and refuses to classify — the two halves are separated so
 * neither can be mistaken for the other. */
export default function MissedRevenueDiscovery() {
  const [tab, setTab] = useState('candidates')

  return (
    <div>
      <SectionHeader
        eyebrow={t('Missed Revenue · Retrospective')}
        title={t('Missed Revenue Discovery')}
        description={t('Closed audits and no-action cases re-examined against the signals that were live at the time. Produces explainable review candidates for an officer to judge — never an automatic Section 74 classification, and the screen shows why that refusal is a measurement rather than a caution.')}
        actions={<ExportBar moduleLabel="Missed Revenue Discovery" />}
      />

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'candidates' ? <CandidatesView /> : <RefusalView F={FRAUD_LABEL_STATE} S={SEPARATION_TEST} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CandidatesView() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('clock')
  const [gstin, setGstin] = useState(REVISIT_CANDIDATES[0]?.gstin || null)

  const { filters } = useApp()
  const scoped = useMemo(() => REVISIT_CANDIDATES.filter(c => applyScopeFilters(c, filters)), [filters])

  /* The denominator the count is meaningless without: how many taxpayers in
   * this same scope carry a live risk rule at all. "38 review candidates" is a
   * different statement depending on whether the pool is 60 or 600.
   *
   * Narrowed on exactly the dimensions a candidate record carries, so the
   * denominator can never come out smaller than the numerator when a filter the
   * candidate rows do not hold is applied. */
  const pool = useMemo(
    () => TAXPAYERS.filter(x =>
      (x.risk.triggeredRules || []).length > 0 &&
      applyScopeFilters(
        { gstin: x.gstin, tradeName: x.tradeName, division: x.division, sector: x.sector, riskCategory: x.risk.category },
        filters
      )
    ).length,
    [filters]
  )

  /* Portfolio figures over the SCOPED set, so a divisional filter narrows the
   * headline and not only the list beneath it. Statewide totals are carried
   * alongside as the denominator rather than being silently replaced. */
  const S = useMemo(() => {
    const live = scoped.filter(c => c.daysRemaining !== null && c.daysRemaining >= 0)
    const within30 = live.filter(c => c.daysRemaining <= 30)
    const sum = arr => arr.reduce((s, c) => s + c.exposure, 0)
    const bands = CLOCK_BANDS.map(b => {
      const rows = scoped.filter(c => b.test(c.daysRemaining))
      return { id: b.id, tone: b.tone, count: rows.length, exposure: sum(rows) }
    })
    return {
      count: scoped.length,
      exposure: sum(scoped),
      closedWithSignal: scoped.filter(c => c.basis === 'closed_with_signal').length,
      neverActioned: scoped.filter(c => c.basis === 'never_actioned').length,
      liveCount: live.length,
      liveExposure: sum(live),
      within30Count: within30.length,
      nearest: live.length ? Math.min(...live.map(c => c.daysRemaining)) : null,
      bands,
      rank: new Map([...scoped].sort((a, b) => b.exposure - a.exposure).map((c, i) => [c.gstin, i + 1]))
    }
  }, [scoped])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = scoped.filter(c => !q || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(q))
    const ordered = sort === 'exposure'
      ? [...rows].sort((a, b) => b.exposure - a.exposure)
      : [...rows].sort((a, b) => {
          const ax = a.daysRemaining === null ? 99999 : a.daysRemaining
          const bx = b.daysRemaining === null ? 99999 : b.daysRemaining
          return ax - bx || b.exposure - a.exposure
        })
    return ordered.slice(0, 60)
  }, [query, scoped, sort])

  /* A candidate the filter has excluded must not stay on screen beside figures
   * that no longer include it. */
  const activeGstin = useMemo(() => {
    if (gstin && scoped.some(c => c.gstin === gstin)) return gstin
    return list[0]?.gstin || null
  }, [gstin, scoped, list])

  const brief = useMemo(() => (activeGstin ? buildRevisitBrief(activeGstin) : null), [activeGstin])

  return (
    <div className="space-y-4">
      {/* Stated before the figures, not after them: every number below is
          computed over the narrowed set. */}
      <FilterScope shown={scoped.length} total={REVISIT_CANDIDATES.length} unit={t('review candidates')} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <KpiCard
          label={t('Review candidates')}
          value={S.count}
          unit={t('of {0} with rules firing', pool)}
          tone="orange"
          icon={RotateCcw}
        />
        <KpiCard
          label={t('Exposure still inside limitation')}
          value={cr(S.liveExposure)}
          unit={t('of {0} on all candidates', cr(S.exposure))}
          tone="red"
          icon={Hourglass}
        />
        <KpiCard
          label={t('Soonest deadline')}
          value={S.nearest === null ? t('None established') : t('{0}d', S.nearest)}
          unit={t('only {0} of {1} candidates have an established clock at all; {2} expire within 30 days', S.liveCount, S.count, S.within30Count)}
          tone="amber"
          icon={AlertTriangle}
        />
        <KpiCard
          label={t('Closed while signals were live')}
          value={S.closedWithSignal}
          unit={t('plus {0} against whom no notice ever issued', S.neverActioned)}
          tone="steel"
          icon={ShieldAlert}
        />
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">
            {t('{0} of these {1} carry a confirmed live limitation clock — {2} do not, and nothing here can be worked until a period is fixed on them.',
              S.liveCount, S.count, S.count - S.liveCount)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(REVISIT_NOTE)}</p>
        </div>
      </div>

      {/* Where the deadline pressure sits. This is the ordering argument: the
          exposure with the least time left is worked first, not the largest. */}
      <Card
        title={t('Where the time actually is')}
        subtitle={t('Review candidates banded by what remains on the statutory clock. The band, not the amount, decides the order of work.')}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {S.bands.map(b => (
            <div key={b.id} className="rounded-lg border border-steel-200 px-3 py-2.5">
              <Pill tone={b.tone}>{bandLabel(b.id)}</Pill>
              <div className="text-[19px] font-bold tabular-nums text-navy-900 leading-none mt-1.5">{b.count}</div>
              <div className="text-[11px] text-steel-500 tabular-nums mt-1">{cr(b.exposure)}</div>
              <div className="text-[10px] text-steel-400 mt-0.5">
                {t('{0}% of candidates', S.count ? Math.round((b.count / S.count) * 100) : 0)}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-steel-600 leading-relaxed mt-3">
          {t('A candidate whose period expires this month outranks a larger one with two years to run, because only one of them can still be converted into a demand. Candidates already time-barred are excluded upstream and never appear here.')}
        </p>
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
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={() => setSort('clock')}
                className={`text-[10.5px] px-2 py-1 rounded-md border transition-colors ${
                  sort === 'clock' ? 'border-ink-700 bg-navy-50 text-navy-900 font-semibold' : 'border-steel-200 text-steel-600 hover:bg-steel-50'
                }`}
              >
                {t('Soonest deadline first')}
              </button>
              <button
                onClick={() => setSort('exposure')}
                className={`text-[10.5px] px-2 py-1 rounded-md border transition-colors ${
                  sort === 'exposure' ? 'border-ink-700 bg-navy-50 text-navy-900 font-semibold' : 'border-steel-200 text-steel-600 hover:bg-steel-50'
                }`}
              >
                {t('Largest exposure first')}
              </button>
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
                  <span className="text-[11px] font-bold text-navy-900 tabular-nums">{lakh(c.exposure)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Pill tone={c.daysRemaining === null ? 'steel' : c.daysRemaining <= 30 ? 'red' : c.daysRemaining <= 90 ? 'orange' : 'amber'}>
                    {c.daysRemaining === null ? t('No clock') : t('{0}d left', c.daysRemaining)}
                  </Pill>
                  <span className="text-[10.5px] text-steel-500 truncate">
                    {t('{0} · {1} rules', t(c.division), c.ruleCount)}
                  </span>
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <div className="px-4 py-6 text-xs text-steel-500">{t('No review candidates match the current filters.')}</div>
            )}
          </div>
        </Card>

        {brief && <CandidateBrief b={brief} rank={S.rank.get(brief.gstin) || 0} total={S.count} cohortExposure={S.exposure} />}
      </div>
    </div>
  )
}

function CandidateBrief({ b, rank, total, cohortExposure }) {
  const signalWeight = b.signals.reduce((s, x) => s + x.weight, 0)

  return (
    <div className="min-w-0 space-y-3">
      <div className="rounded-xl border border-steel-200 bg-white shadow-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-base font-bold text-navy-900">{b.tradeName}</span>
          <Pill tone={b.basis === 'closed_with_signal' ? 'red' : 'amber'}>{t(b.basisLabel)}</Pill>
          <span className="ml-auto text-[15px] font-bold text-navy-900 tabular-nums">{lakh(b.exposure)}</span>
        </div>
        <div className="text-[11.5px] text-steel-500">{b.gstin} · {t(b.division)} · {t(b.sector)}</div>
        {rank > 0 && (
          <div className="text-[11px] text-steel-500 mt-1.5">
            {t('Rank {0} of {1} by exposure among the candidates in view, out of {2} in scope.', rank, total, cr(cohortExposure))}
          </div>
        )}
      </div>

      {/* 0 — the clock, first, because it decides whether any of the rest matters */}
      <Card title={t('What is left on the clock')} subtitle={t('Nothing below can be converted into a demand after this date.')}>
        {b.daysRemaining == null ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Not established — an absent input')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">
              {t('The limitation register is built from audit cases, and no audit case exists against this taxpayer. No tax period has been fixed, so no deadline can be computed. Step 1 below is what establishes it — until then this candidate cannot be prioritised against the others, and the absence must not be read as time in hand.')}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{t('Days remaining')}</div>
              <div className={`text-[26px] font-bold tabular-nums leading-none ${b.daysRemaining <= 30 ? 'text-[#C5221F]' : 'text-navy-900'}`}>
                {b.daysRemaining}
              </div>
            </div>
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{t('Binding date')}</div>
              <div className="text-[15px] font-semibold tabular-nums text-navy-900">{b.bindingDate}</div>
            </div>
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{t('Exposure at stake')}</div>
              <div className="text-[15px] font-semibold tabular-nums text-navy-900">{lakh(b.exposure)}</div>
            </div>
            <p className="text-[11.5px] text-steel-600 leading-relaxed flex-1 min-w-[220px]">
              {b.daysRemaining <= 30
                ? t('Inside 30 days. If a period is to be reopened at all, the checks below have to be completed and a notice issued before this date — after it the exposure is extinguished by operation of law.')
                : t('After this date no demand can be raised for the period, whatever the evidence later shows. The checks below take time; count backwards from it rather than forwards from today.')}
            </p>
          </div>
        )}
      </Card>

      {/* 1 — what fired */}
      <Card
        title={t('Signals live at the time')}
        subtitle={t('{0} encoded rules were firing when this case was put down, contributing {1} points of the risk score {2}.', b.signals.length, signalWeight, b.riskScore)}
      >
        <div className="flex flex-wrap gap-1.5 mb-3">
          {b.signals.map(s => (
            <span key={t(s.label)} className="inline-flex items-center gap-1 text-[11.5px] px-2 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-900">
              {t(s.label)}<span className="text-amber-600 tabular-nums font-semibold">+{s.weight}</span>
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('What the department did')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(b.departmentAction)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-steel-100 text-[11.5px]">
          <span className="text-steel-600">{t('Risk score')}: <strong className="text-navy-900 tabular-nums">{b.riskScore}</strong></span>
          <span className="text-steel-600">{t('Proceedings on record')}: <strong className="text-navy-900 tabular-nums">{b.proceedings}</strong></span>
          <span className="text-steel-600">{t('Basis for revisiting')}: <strong className="text-navy-900">{t(b.basisLabel)}</strong></span>
        </div>
      </Card>

      {/* 2 — the historical comparison, drawn from concluded proceedings */}
      <Card
        title={t('Comparable concluded proceedings')}
        subtitle={t('What happened in cases comparable on the dimensions that decide outcomes. Evidence for a judgement, not a prediction.')}
      >
        <div className={`rounded-lg border px-3.5 py-2.5 mb-3 ${b.comparables.rateStated ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <p className="text-[12px] text-navy-800 leading-relaxed">{t(b.comparables.rateNote)}</p>
        </div>
        {b.comparables.none ? (
          <p className="text-[12.5px] text-steel-600 leading-relaxed">{t(b.comparables.noneReason)}</p>
        ) : (
          <div className="space-y-2">
            {b.comparables.comparables.map(c => (
              <div key={c.gstin} className="rounded-lg border border-steel-200 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2 mb-1">
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
                {c.matches.length > 0 && (
                  <p className="text-[11.5px] text-emerald-800 leading-relaxed">+ {c.matches.map(m => t(m.text)).join(' · ')}</p>
                )}
                {c.distinguishers.length > 0 && (
                  <p className="text-[11.5px] text-[#C5221F] leading-relaxed">− {c.distinguishers.map(d => t(d.text)).join(' · ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3 — what has to happen before anything reopens */}
      <Card title={t('Before this is reopened')} subtitle={t('In order. None of it is done by this screen.')}>
        <ol className="space-y-2">
          {b.checks.map((c, i) => (
            <li key={c.id} className="flex items-start gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <div>
                <div className="text-[12.5px] font-medium text-navy-800">{t(c.label)}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(c.why)}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* The refusal, restated on every case so it cannot be missed on any one. */}
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 flex items-start gap-3">
        <Gavel className="w-4.5 h-4.5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('A review candidate, not a classification')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(b.notAClassification)}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function RefusalView({ F, S }) {
  // The refusal is a measurement, so the measurement is put on screen with its
  // threshold beside it rather than described in prose.
  const M = useMemo(() => {
    const strongest = S.features.reduce((a, f) => (f.effectSize > a.effectSize ? f : a), S.features[0])
    const registerTotal = Object.values(F.sectionCounts).reduce((a, n) => a + n, 0)
    return { strongest, registerTotal }
  }, [F, S])

  return (
    <div className="space-y-4">
      <FilterNotApplicable
        reason={t('The separation test is a single measurement over the department’s whole concluded litigation record; it cannot be recomputed per division without falling below the sample it already fails on.')}
      />

      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('No automatic Section 74 classification — and not because the sample is small.')}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(S.verdict)}</p>
        </div>
      </div>

      {/* Reason one: there is almost no Section 74 label to learn from. */}
      <Card
        title={t('The label that does not exist')}
        subtitle={t('Identifying Section 73 cases that resemble Section 74 cases needs Section 74 cases to resemble.')}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
          <Fig
            label={t('Section 74 proceedings')}
            value={F.s74Count}
            sub={t('of {0} in the limitation register', M.registerTotal)}
            tone="red"
          />
          <Fig
            label={t('Section 73 proceedings')}
            value={F.s73Count}
            sub={t('the population that would be screened')}
          />
          <Fig
            label={t('Minimum before a model has anything to learn')}
            value={F.minimumNeeded}
            sub={F.trainable ? t('threshold met') : t('threshold not met — the capability is left unbuilt')}
            tone={F.trainable ? undefined : 'red'}
          />
        </div>
        <p className="text-[12.5px] text-navy-800 leading-relaxed mb-3">{t(F.reason)}</p>
        <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('What would unlock it')}</div>
        <ul className="space-y-2 mb-3">
          {F.whatWouldUnlockIt.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-navy-800 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <span>{t(w)}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 flex items-start gap-2.5">
          <Scale className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{t(F.honestPosition)}</p>
        </div>
      </Card>

      {/* Reason two, and the stronger one: even with a substitute label, the
          features do not separate. */}
      <Card
        title={t('The separation test')}
        subtitle={t('Before a resemblance model is built, the cases it learns from must differ from the cases it will screen. Measured per feature, reported whatever it says.')}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
          <Fig label={t('Positive class')} value={S.positiveN} sub={t('sustained on appeal')} />
          <Fig label={t('Contrast class')} value={S.contrastN} sub={t('reversed or remanded')} tone="red" />
          <Fig label={t('Baseline')} value={S.baselineN} sub={t('all litigation')} />
          <Fig
            label={t('Features that separate')}
            value={t('{0} of {1}', S.separatingCount, S.features.length)}
            sub={t('a screen needs an effect size of about 0.5')}
            tone="red"
          />
          <Fig
            label={t('Largest effect measured')}
            value={M.strongest.effectSize}
            sub={t('on {0} — still short of 0.5', t(M.strongest.label))}
            tone="red"
          />
        </div>
        <DataTable
          columns={[
            { key: 'label', label: t('Feature'), render: r => t(r.label) },
            { key: 'sustainedMean', label: t('Cases we won'), align: 'right' },
            { key: 'baselineMean', label: t('All cases'), align: 'right' },
            {
              key: 'effectSize',
              label: t('Effect size'),
              align: 'right',
              render: r => <span className={`tabular-nums font-semibold ${r.separates ? 'text-emerald-700' : 'text-steel-500'}`}>{r.effectSize}</span>
            },
            { key: 'separates', label: t('Usable signal?'), render: r => (r.separates ? <Pill tone="green">{t('Yes')}</Pill> : <Pill tone="steel">{t('No')}</Pill>) }
          ]}
          rows={S.features}
          searchable={false}
          pageSize={6}
        />
        <p className="text-[11.5px] text-steel-600 leading-relaxed mt-3">
          {t('Read the two mean columns against each other. Where they are the same number, a case the department won and a case drawn at random are indistinguishable on that feature — which is what "does not separate" means in practice.')}
        </p>
      </Card>

      <Card title={t('Why more cases would not fix this')}>
        <p className="text-[12.5px] text-navy-800 leading-relaxed mb-3">{t(S.whyMoreRowsWontHelp)}</p>
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('And the contrast class is empty in practice')}</div>
          <p className="text-[12px] text-navy-800 leading-relaxed">{t(S.contrastWarning)}</p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('What is actually needed')}</div>
        <ul className="space-y-2">
          {S.whatIsActuallyNeeded.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-navy-800 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <span>{t(w)}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{t(F.stakes)}</p>
        </div>
      </Card>
    </div>
  )
}

function Fig({ label, value, sub, tone }) {
  return (
    <div>
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{label}</div>
      <div className={`text-[20px] font-bold tabular-nums leading-none ${tone === 'red' ? 'text-[#C5221F]' : 'text-navy-900'}`}>{value}</div>
      <div className="text-[11px] text-steel-500 mt-1">{sub}</div>
    </div>
  )
}
