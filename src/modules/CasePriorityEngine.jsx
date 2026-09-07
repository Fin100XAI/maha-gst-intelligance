import { useMemo, useState } from 'react'
import {
  ArrowUp, ArrowDown, Minus, Scale, FlaskConical, Users, AlertTriangle,
  Calculator, ShieldCheck
} from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS } from '../data/mockData.js'
import {
  PRIORITY_QUEUE, explainMovement, equityCheck, buildTrial,
  TRIAL_ENDPOINTS, TRIAL_NOTE
} from '../data/priority.js'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`

export default function CasePriorityEngine() {
  const { filters } = useApp()
  const [tab, setTab] = useState('queue')
  const [selected, setSelected] = useState(null)

  const rows = useMemo(() => {
    const allowed = new Set(TAXPAYERS.filter(x => applyGlobalFilters(x, filters)).map(x => x.gstin))
    return PRIORITY_QUEUE.filter(c => allowed.has(c.gstin))
  }, [filters])

  const stats = useMemo(() => {
    const moved = rows.filter(c => Math.abs(c.movement) >= 10)
    const barredHigh = rows.filter(c => c.daysRemaining !== null && c.daysRemaining < 0 && c.riskScore >= 60)
    const capacity = rows.slice(0, 40)
    return {
      scored: rows.length,
      movedCount: moved.length,
      barredHigh: barredHigh.length,
      weekEffort: Math.round(capacity.reduce((s, c) => s + c.effortDays, 0)),
      weekRecoverable: Math.round(capacity.reduce((s, c) => s + (c.recoverableNow || 0), 0) / 10000000 * 100) / 100
    }
  }, [rows])

  const equity = useMemo(() => equityCheck(40), [])
  const trial = useMemo(() => buildTrial(), [])

  const columns = [
    {
      key: 'priorityRank',
      label: t('Priority'),
      align: 'center',
      sortValue: r => r.priorityRank,
      render: r => (
        <div className="text-center">
          <div className="text-base font-bold tabular-nums text-navy-900">#{r.priorityRank}</div>
          <Movement m={r.movement} />
        </div>
      )
    },
    {
      key: 'tradeName',
      label: t('Taxpayer'),
      render: r => (
        <div>
          <div className="font-semibold text-navy-800">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.gstin} · {t(r.district)}</div>
        </div>
      )
    },
    {
      key: 'riskRank',
      label: t('Risk rank'),
      align: 'center',
      sortValue: r => r.riskRank,
      render: r => (
        <div className="text-center">
          <div className="text-[12px] tabular-nums text-steel-500">#{r.riskRank}</div>
          <RiskBadge category={r.riskCategory} score={r.riskScore} size="sm" />
        </div>
      )
    },
    {
      key: 'daysRemaining',
      label: t('Statutory clock'),
      align: 'right',
      sortValue: r => (r.daysRemaining === null ? 99999 : r.daysRemaining),
      render: r => r.daysRemaining === null
        ? <span className="text-[11px] text-steel-400">—</span>
        : <span className={`text-[12px] font-semibold tabular-nums ${r.daysRemaining < 0 ? 'text-steel-400' : r.daysRemaining <= 30 ? 'text-maharisk-critical' : 'text-navy-800'}`}>
            {r.daysRemaining < 0 ? t('Expired') : `${r.daysRemaining}d`}
          </span>
    },
    {
      key: 'recoverableNow',
      label: t('Recoverable'),
      align: 'right',
      sortValue: r => r.recoverableNow || 0,
      render: r => <span className="tabular-nums text-navy-800 font-medium">{r.recoverableNow ? lakh(r.recoverableNow) : '—'}</span>
    },
    {
      key: 'effortDays',
      label: t('Officer-days'),
      align: 'right',
      sortValue: r => r.effortDays,
      render: r => <span className="tabular-nums text-steel-700">{r.effortDays}d</span>
    },
    {
      key: 'priorityScore',
      label: t('Score'),
      align: 'right',
      sortValue: r => r.priorityScore,
      render: r => <span className="tabular-nums font-bold text-navy-900">{r.priorityScore}</span>
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Enforcement · Case Selection')}
        title={t('Case Priority Engine')}
        description={t('Six factors, divided by the officer-days a case would take. Risk score answers how wrong something is; this answers what deserves an officer’s week.')}
        actions={<ExportBar moduleLabel="Case Priority Engine" />}
      />

      {/* The formula, stated openly. A ranking an officer cannot interrogate is
          a ranking they will not follow. */}
      <div className="mb-6 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Calculator className="w-4 h-4 text-govt-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-govt-600">{t('How a case is ranked')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] font-medium text-navy-800">
          <Factor>{t('Risk severity')}</Factor><X />
          <Factor>{t('Revenue exposure')}</Factor><X />
          <Factor>{t('Recoverability')}</Factor><X />
          <Factor tone="red">{t('Time to statutory deadline')}</Factor><X />
          <Factor>{t('Network propagation')}</Factor><X />
          <Factor tone="amber">{t('Probability of recovery')}</Factor>
          <span className="text-steel-400 mx-1">÷</span>
          <Factor tone="steel">{t('Officer-days required')}</Factor>
        </div>
        <p className="text-[12.5px] text-steel-600 mt-3 leading-relaxed max-w-4xl">
          {t('Only one factor is not a judgement: the statutory clock comes from law, and carries the widest range — a case that can no longer be actioned is worth little regardless of how large it is. Probability of recovery is a transparent proxy over observable facts, not a learned estimate; the platform has no completed outcomes to learn from yet, and saying otherwise would be the fastest way to discredit it.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Cases scored')} value={stats.scored} icon={Scale} tone="navy" />
        <KpiCard label={t('Moved 10+ places')} value={stats.movedCount} unit={t('vs risk rank')} icon={ArrowUp} tone="green" />
        <KpiCard label={t('High-risk but time-barred')} value={stats.barredHigh} unit={t('deprioritised')} icon={AlertTriangle} tone="red" />
        <KpiCard label={t('Recoverable in top 40')} value={stats.weekRecoverable} unit={t('₹ Cr')} icon={ShieldCheck} tone="amber" />
      </div>

      <div className="mb-4">
        <PillTabs
          tabs={[
            { key: 'queue', label: t('Priority queue') },
            { key: 'equity', label: t('Equity monitor') },
            { key: 'trial', label: t('Controlled comparison') }
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'queue' && (
        <Card
          title={t('Ranked working queue')}
          subtitle={t('{0} officer-days across the top 40 — click any row for the full factor breakdown and why it moved.', stats.weekEffort)}
        >
          <DataTable
            columns={columns}
            rows={rows}
            searchPlaceholder={t('Search the queue...')}
            onRowClick={r => setSelected(r)}
            pageSize={12}
          />
          <HumanReviewBadge label={t('Ranking is advisory — case allocation remains an officer decision')} />
        </Card>
      )}

      {tab === 'equity' && <EquityPanel equity={equity} />}

      {tab === 'trial' && <TrialPanel trial={trial} />}

      {selected && (
        <Modal open size="lg" title={t('Why this case sits at #{0}', selected.priorityRank)} onClose={() => setSelected(null)}>
          <FactorBreakdown c={selected} />
        </Modal>
      )}
    </div>
  )
}

function Factor({ children, tone = 'navy' }) {
  const c = TONE_STYLES[tone]
  return (
    <span className="px-2 py-0.5 rounded-md border text-[12px]" style={{ backgroundColor: c.bg, borderColor: c.border, color: c.accent }}>
      {children}
    </span>
  )
}
const X = () => <span className="text-steel-400">×</span>

function Movement({ m }) {
  if (m === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] text-steel-400"><Minus className="w-2.5 h-2.5" /></span>
  const up = m > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-maharisk-low' : 'text-maharisk-high'}`}>
      {up ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}{Math.abs(m)}
    </span>
  )
}

function FactorBreakdown({ c }) {
  const exp = explainMovement(c)
  return (
    <div className="space-y-4">
      <div>
        <div className="text-base font-bold text-navy-900">{c.tradeName}</div>
        <div className="text-[11.5px] text-steel-500">{c.gstin} · {t(c.district)} · {t(c.sector)}</div>
      </div>

      <div className="rounded-lg border border-navy-200 bg-navy-50/60 px-3.5 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-govt-600 mb-1">{t('In plain terms')}</div>
        <p className="text-[13px] text-navy-800 leading-relaxed">{t(exp.text)}</p>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-2">{t('Factor contributions')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Cell label={t('Risk severity')} v={c.factors.severity} />
          <Cell label={t('Exposure')} v={c.factors.exposureScore} />
          <Cell label={t('Recoverability')} v={c.factors.recoverability} />
          <Cell label={t('Time sensitivity')} v={c.factors.time} tone="red" note={c.daysRemaining === null ? t('no clock') : c.daysRemaining < 0 ? t('expired') : `${c.daysRemaining}d`} />
          <Cell label={t('Network')} v={c.factors.network} />
          <Cell label={t('P(recovery)')} v={c.factors.probability} tone="amber" note={t('proxy')} />
        </div>
        <div className="mt-2 text-[11px] text-steel-500 tabular-nums">
          {t('Divided by {0} officer-days → priority score {1}', c.effortDays, c.priorityScore)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-steel-200 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('Recovery proxies applied')}</div>
          {c.probabilityDetail.length === 0 && <div className="text-[11.5px] text-steel-500">{t('None — baseline 0.50 applied.')}</div>}
          {c.probabilityDetail.map(p => (
            <div key={p.id} className="mb-2 last:mb-0">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-[11px] font-bold tabular-nums ${p.weight > 0 ? 'text-maharisk-low' : 'text-maharisk-critical'}`}>
                  {p.weight > 0 ? '+' : ''}{p.weight.toFixed(2)}
                </span>
                <span className="text-[11.5px] font-medium text-navy-800">{t(p.label)}</span>
              </div>
              <p className="text-[10.5px] text-steel-500 leading-snug mt-0.5">{t(p.why)}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-steel-200 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('Effort estimate')}</div>
          {c.effortDetail.map(d => (
            <div key={d.id} className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[11px] font-bold tabular-nums text-steel-700">{d.applied > 0 ? '+' : ''}{d.applied}d</span>
              <span className="text-[11.5px] text-navy-800">{t(d.label)}</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-steel-100 text-[12px] font-bold text-navy-900 tabular-nums">
            {t('Total')}: {c.effortDays} {t('officer-days')}
          </div>
        </div>
      </div>
    </div>
  )
}

function Cell({ label, v, tone = 'navy', note }) {
  const c = TONE_STYLES[tone]
  return (
    <div className="rounded-lg border px-2.5 py-2" style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{label}</div>
      <div className="text-base font-bold tabular-nums" style={{ color: c.accent }}>{v}</div>
      {note && <div className="text-[9.5px] text-steel-500">{note}</div>}
    </div>
  )
}

/* Equity monitoring ships as a feature because a prioritisation engine that
 * concentrates enforcement on a sector or district is challengeable — and in a
 * tax context, challengeable means litigated. */
function EquityPanel({ equity }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-xl border px-4 py-3 flex items-start gap-2.5 ${equity.flagged.length ? 'border-saffron-300 bg-saffron-50' : 'border-emerald-300 bg-emerald-50'}`}>
        <Users className={`w-4 h-4 shrink-0 mt-0.5 ${equity.flagged.length ? 'text-saffron-700' : 'text-emerald-700'}`} />
        <div className="text-[12.5px] leading-relaxed">
          {equity.flagged.length ? (
            <><strong className="text-saffron-900">{t('{0} group(s) selected at more than twice their share of the population.', equity.flagged.length)}</strong>{' '}
            <span className="text-saffron-900">{t('This is not necessarily wrong — risk may genuinely concentrate — but it must be explainable if challenged. Review before the queue is worked.')}</span></>
          ) : (
            <span className="text-emerald-900">{t('No sector or district is selected at more than twice its share of the case population. The working queue does not concentrate enforcement beyond the underlying risk distribution.')}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistTable title={t('By sector')} rows={equity.sector} />
        <DistTable title={t('By district')} rows={equity.district} />
      </div>
    </div>
  )
}

function DistTable({ title, rows }) {
  return (
    <Card title={title} subtitle={t('Share of the top-40 working queue against share of all scored cases')} padded={false}>
      <div className="divide-y divide-steel-100 max-h-[420px] overflow-y-auto">
        {rows.map(r => {
          const hot = r.ratio >= 2 && r.selected >= 3
          return (
            <div key={r.name} className="px-5 py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0 text-[12.5px] text-navy-800 truncate">{t(r.name)}</div>
              <div className="w-28 shrink-0">
                <div className="h-1.5 rounded-full bg-steel-100 overflow-hidden flex">
                  <div className="h-full bg-steel-300" style={{ width: `${Math.min(100, r.basePct * 2)}%` }} />
                </div>
                <div className="h-1.5 rounded-full bg-steel-100 overflow-hidden flex mt-0.5">
                  <div className="h-full" style={{ width: `${Math.min(100, r.selectedPct * 2)}%`, backgroundColor: hot ? TONE_STYLES.red.accent : TONE_STYLES.navy.accent }} />
                </div>
              </div>
              <div className="w-20 text-right text-[11px] tabular-nums text-steel-500">
                {r.basePct}% → {r.selectedPct}%
              </div>
              <div className="w-12 text-right">
                <span className={`text-[12px] font-bold tabular-nums ${hot ? 'text-maharisk-critical' : 'text-steel-600'}`}>{r.ratio}×</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* The proof mechanism. Without a control arm, a pilot that shows improved
 * recovery cannot separate the platform from officer skill or case mix. */
function TrialPanel({ trial }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface p-5">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="w-4 h-4 text-govt-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-govt-600">{t('Pilot design')}</span>
        </div>
        <h3 className="text-lg font-bold text-navy-900 max-w-3xl leading-snug">
          {t('A demonstration proves the screen works. Only a comparison proves the ranking does.')}
        </h3>
        <p className="text-[13px] text-steel-600 mt-2 max-w-4xl leading-relaxed">
          {t('If cases are re-ordered and recovery improves, that gain cannot be attributed to the platform without a control arm — officer skill, case mix and the effect of being observed all explain it equally well. Both arms are worked at normal capacity; only the ordering differs.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t('Arm balance')} subtitle={t('Stratified across {0} strata by exposure decile and risk band', trial.strataCount)} padded={false}>
          <div className="divide-y divide-steel-100">
            <div className="px-5 py-2 grid grid-cols-[1fr_auto_auto] gap-4 text-[10px] font-bold uppercase tracking-wider text-steel-400">
              <span>{t('Metric')}</span><span className="w-20 text-right">{t('Platform')}</span><span className="w-20 text-right">{t('Control')}</span>
            </div>
            {trial.balance.map(b => (
              <div key={b.metric} className="px-5 py-2.5 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                <span className="text-[12.5px] text-navy-800">{t(b.metric)}</span>
                <span className="w-20 text-right text-[13px] font-semibold tabular-nums text-navy-900">{b.a}</span>
                <span className="w-20 text-right text-[13px] font-semibold tabular-nums text-steel-600">{b.b}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('What gets measured')} subtitle={t('Endpoints fixed before the trial runs')} padded={false}>
          <div className="divide-y divide-steel-100">
            {TRIAL_ENDPOINTS.map((e, i) => (
              <div key={e.metric} className="px-5 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-govt-600 tabular-nums">{i === 0 ? t('Primary') : t('Secondary')}</span>
                  <span className="text-[13px] font-semibold text-navy-900">{t(e.metric)}</span>
                </div>
                <p className="text-[11.5px] text-steel-600 mt-1 leading-relaxed">{t(e.why)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="rounded-lg border border-saffron-300 bg-saffron-50 px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-saffron-800 mb-1">{t('Conditions')}</div>
        <p className="text-[12px] text-saffron-900 leading-relaxed">{t(TRIAL_NOTE)}</p>
      </div>
    </div>
  )
}
