import { useMemo, useState } from 'react'
import { Search, RotateCcw, AlertTriangle, Lock, Info, CheckSquare, Gavel, ShieldAlert } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import {
  REVISIT_CANDIDATES, REVISIT_SUMMARY, REVISIT_NOTE,
  buildRevisitBrief, FRAUD_LABEL_STATE, SEPARATION_TEST
} from '../data/retrospective.js'
import { OUTCOMES } from '../data/similarity.js'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const TABS = [
  { key: 'candidates', label: 'Review candidates', icon: RotateCcw },
  { key: 'why', label: 'Why no Section 74 classification', icon: Lock }
]

/* Retrospective review of cases the department put down. Produces explainable
 * review candidates and refuses to classify — the two halves are separated so
 * neither can be mistaken for the other. */
export default function MissedRevenueDiscovery() {
  const [tab, setTab] = useState('candidates')
  const R = REVISIT_SUMMARY

  return (
    <div>
      <SectionHeader
        eyebrow={t('Missed Revenue · Retrospective')}
        title={t('Missed Revenue Discovery')}
        description={t('Closed audits and no-action cases re-examined against the signals that were live at the time. Produces explainable review candidates for an officer to judge — never an automatic Section 74 classification, and the screen shows why that refusal is a measurement rather than a caution.')}
        actions={<ExportBar moduleLabel="Missed Revenue Discovery" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Review candidates')} value={R.count} unit={cr(R.exposure)} tone="orange" icon={RotateCcw} />
        <KpiCard label={t('Closed with signals live')} value={R.closedWithSignal} unit={t('audit closed anyway')} tone="red" icon={AlertTriangle} />
        <KpiCard label={t('Never actioned')} value={R.neverActioned} unit={t('no notice ever issued')} tone="amber" icon={ShieldAlert} />
        <KpiCard label={t('Clock confirmed live')} value={R.withLiveClock} unit={t('of {0} — see caveat', R.count)} tone="steel" icon={CheckSquare} />
      </div>

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
  const [gstin, setGstin] = useState(REVISIT_CANDIDATES[0]?.gstin || null)

  const { filters } = useApp()
  const scoped = useMemo(() => REVISIT_CANDIDATES.filter(c => applyScopeFilters(c, filters)), [filters])
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped.filter(c => !q || `${c.gstin} ${c.tradeName}`.toLowerCase().includes(q)).slice(0, 60)
  }, [query, scoped])

  const brief = useMemo(() => (gstin ? buildRevisitBrief(gstin) : null), [gstin])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">
            {t('{0} of these {1} carry a confirmed live limitation clock.', REVISIT_SUMMARY.withLiveClock, REVISIT_SUMMARY.count)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{REVISIT_NOTE}</p>
        </div>
      </div>

      <FilterScope shown={scoped.length} total={REVISIT_CANDIDATES.length} unit={t('review candidates')} />

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
                  <span className="text-[11px] font-bold text-navy-900 tabular-nums">{lakh(c.exposure)}</span>
                </div>
                <div className="text-[10.5px] text-steel-500 truncate">{c.division} · {c.ruleCount} {t('rules')}</div>
              </button>
            ))}
          </div>
        </Card>

        {brief && <CandidateBrief b={brief} />}
      </div>
    </div>
  )
}

function CandidateBrief({ b }) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="rounded-xl border border-steel-200 bg-white shadow-card px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-base font-bold text-navy-900">{b.tradeName}</span>
          <Pill tone={b.basis === 'closed_with_signal' ? 'red' : 'amber'}>{b.basisLabel}</Pill>
          <span className="ml-auto text-[15px] font-bold text-navy-900 tabular-nums">{lakh(b.exposure)}</span>
        </div>
        <div className="text-[11.5px] text-steel-500">{b.gstin} · {t(b.division)} · {t(b.sector)}</div>
      </div>

      {/* 1 — what fired */}
      <Card title={t('Signals live at the time')} subtitle={t('The encoded rules that were firing when this case was put down.')}>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {b.signals.map(s => (
            <span key={s.label} className="inline-flex items-center gap-1 text-[11.5px] px-2 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-900">
              {s.label}<span className="text-amber-600 tabular-nums font-semibold">+{s.weight}</span>
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('What the department did')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{b.departmentAction}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-steel-100 text-[11.5px]">
          <span className="text-steel-600">{t('Risk score')}: <strong className="text-navy-900 tabular-nums">{b.riskScore}</strong></span>
          <span className="text-steel-600">{t('Proceedings on record')}: <strong className="text-navy-900 tabular-nums">{b.proceedings}</strong></span>
          <span className="text-steel-600">
            {t('Limitation')}: {b.daysRemaining == null
              ? <em className="text-steel-500">{t('not established')}</em>
              : <strong className="text-navy-900 tabular-nums">{b.daysRemaining} {t('days')}</strong>}
          </span>
        </div>
      </Card>

      {/* 2 — the historical comparison, drawn from concluded proceedings */}
      <Card
        title={t('Comparable concluded proceedings')}
        subtitle={t('What happened in cases comparable on the dimensions that decide outcomes. Evidence for a judgement, not a prediction.')}
      >
        <div className={`rounded-lg border px-3.5 py-2.5 mb-3 ${b.comparables.rateStated ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
          <p className="text-[12px] text-navy-800 leading-relaxed">{b.comparables.rateNote}</p>
        </div>
        {b.comparables.none ? (
          <p className="text-[12.5px] text-steel-600 leading-relaxed">{b.comparables.noneReason}</p>
        ) : (
          <div className="space-y-2">
            {b.comparables.comparables.map(c => (
              <div key={c.gstin} className="rounded-lg border border-steel-200 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[12.5px] font-semibold text-navy-900">{c.tradeName}</span>
                  {c.outcomeMeta && (
                    <Pill tone={c.outcomeMeta.tone === 'green' ? 'green' : c.outcomeMeta.tone === 'red' ? 'red' : 'amber'}>
                      {c.outcomeMeta.label}
                    </Pill>
                  )}
                  <span className="ml-auto text-[11px] text-steel-500">{t('comparability')} <strong className="text-navy-900 tabular-nums">{c.score}</strong></span>
                </div>
                {c.matches.length > 0 && (
                  <p className="text-[11.5px] text-emerald-800 leading-relaxed">+ {c.matches.map(m => m.text).join(' · ')}</p>
                )}
                {c.distinguishers.length > 0 && (
                  <p className="text-[11.5px] text-[#C5221F] leading-relaxed">− {c.distinguishers.map(d => d.text).join(' · ')}</p>
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
                <div className="text-[12.5px] font-medium text-navy-800">{c.label}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed">{c.why}</p>
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
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{b.notAClassification}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function RefusalView({ F, S }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('No automatic Section 74 classification — and not because the sample is small.')}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{S.verdict}</p>
        </div>
      </div>

      <Card
        title={t('The separation test')}
        subtitle={t('Before a resemblance model is built, the cases it learns from must differ from the cases it will screen. Measured per feature, reported whatever it says.')}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
          <Fig label={t('Positive class')} value={S.positiveN} sub={t('sustained on appeal')} />
          <Fig label={t('Contrast class')} value={S.contrastN} sub={t('reversed or remanded')} tone="red" />
          <Fig label={t('Baseline')} value={S.baselineN} sub={t('all litigation')} />
          <Fig label={t('Features that separate')} value={`${S.separatingCount} / ${S.features.length}`} sub={t('none reach 0.5')} tone="red" />
        </div>
        <DataTable
          columns={[
            { key: 'label', label: t('Feature') },
            { key: 'sustainedMean', label: t('Cases we won'), align: 'right' },
            { key: 'baselineMean', label: t('All cases'), align: 'right' },
            { key: 'effectSize', label: t('Effect size'), align: 'right', render: r => <span className={`tabular-nums font-semibold ${r.separates ? 'text-emerald-700' : 'text-steel-500'}`}>{r.effectSize}</span> },
            { key: 'separates', label: t('Usable signal?'), render: r => r.separates ? <Pill tone="green">{t('Yes')}</Pill> : <Pill tone="steel">{t('No')}</Pill> }
          ]}
          rows={S.features}
          searchable={false}
          pageSize={6}
        />
      </Card>

      <Card title={t('Why more cases would not fix this')}>
        <p className="text-[12.5px] text-navy-800 leading-relaxed mb-3">{S.whyMoreRowsWontHelp}</p>
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('And the contrast class is empty in practice')}</div>
          <p className="text-[12px] text-navy-800 leading-relaxed">{S.contrastWarning}</p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('What is actually needed')}</div>
        <ul className="space-y-2">
          {S.whatIsActuallyNeeded.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-navy-800 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{F.stakes}</p>
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
