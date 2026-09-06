import { useState } from 'react'
import { History, Clock, RotateCcw, Lock, Info, AlertTriangle, Database, Users } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import {
  COUNTERFACTUALS, COUNTERFACTUAL_SUMMARY, COUNTERFACTUAL_NOTE, LAG_OWNERSHIP_NOTE,
  REVISIT_CANDIDATES, REVISIT_SUMMARY, REVISIT_NOTE, FRAUD_LABEL_STATE, SEPARATION_TEST
} from '../data/retrospective.js'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const TABS = [
  { key: 'timing', label: 'What earlier action was worth', icon: Clock },
  { key: 'revisit', label: 'Put down while still live', icon: RotateCcw },
  { key: 'fraud', label: 'Why the resemblance model is refused', icon: Lock }
]

export default function RetrospectiveIntelligence() {
  const [tab, setTab] = useState('timing')
  const S = COUNTERFACTUAL_SUMMARY

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Retrospective')}
        title={t('Retrospective Intelligence')}
        description={t('What earlier action would have been worth, and which cases were put down while something in them was still live. Looking backwards at the department’s own handling rather than at taxpayers.')}
        actions={<ExportBar moduleLabel="Retrospective Intelligence" />}
      />

      {/* The decomposition that decides where money should go. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Lost to queue dwell')} value={S.lostToQueueCr} unit={t('₹ Cr — controllable now')} tone="red" icon={Users} />
        <KpiCard label={t('Lost to detection latency')} value={S.lostToDetectionCr} unit={t('₹ Cr — data-feed constraint')} tone="amber" icon={Database} />
        <KpiCard label={t('Total lost to lag')} value={S.lostTotalCr} unit={t('₹ Cr across {0} cases', S.caseCount)} tone="steel" icon={History} />
        <KpiCard label={t('Still recoverable')} value={S.stillRecoverableCr} unit={t('₹ Cr today')} tone="green" icon={Clock} />
      </div>

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'timing' && <TimingView S={S} />}
      {tab === 'revisit' && <RevisitView />}
      {tab === 'fraud' && <FraudView />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function TimingView({ S }) {
  const total = S.lostToDetectionCr + S.lostToQueueCr || 1
  const queuePct = Math.round((S.lostToQueueCr / total) * 100)

  return (
    <div className="space-y-4">
      <Card
        title={t('Where the lag loss sits')}
        subtitle={t('Two parts, two owners, two different fixes. A single blended “average lag” figure would hide which one to spend money on.')}
      >
        <div className="flex h-12 rounded-lg overflow-hidden border border-steel-200 mb-3">
          <div className="bg-[#C5221F] flex items-center justify-center text-white text-[12px] font-bold" style={{ width: `${queuePct}%` }}>
            {queuePct > 12 && `${t('Queue dwell')} · ₹${S.lostToQueueCr} Cr`}
          </div>
          <div className="bg-amber-500 flex items-center justify-center text-white text-[12px] font-bold" style={{ width: `${100 - queuePct}%` }}>
            {100 - queuePct > 12 && `${t('Detection')} · ₹${S.lostToDetectionCr} Cr`}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-[#C5221F]" />
              <span className="text-[12px] font-bold text-navy-900">{t('Queue dwell — ₹{0} Cr', S.lostToQueueCr)}</span>
              <Pill tone="red">{t('Controllable now')}</Pill>
            </div>
            <p className="text-[11.5px] text-steel-700 leading-relaxed">
              {t('Median {0} days between a signal being visible and the case being worked. This is capacity and prioritisation — it responds to a decision the department can take this quarter.', S.medianQueueDays)}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[12px] font-bold text-navy-900">{t('Detection latency — ₹{0} Cr', S.lostToDetectionCr)}</span>
              <Pill tone="amber">{t('Needs faster feeds')}</Pill>
            </div>
            <p className="text-[11.5px] text-steel-700 leading-relaxed">
              {t('Median {0} days before the signal could be seen at all, because the return cycle has not yet produced it. No amount of prioritisation shortens this — only earlier or finer-grained data does.', S.medianDetectionDays)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{LAG_OWNERSHIP_NOTE}</p>
        </div>
      </Card>

      <Card
        title={t('Cases by controllable loss')}
        subtitle={t('Ranked by value lost to queue dwell — the part that a different scheduling decision would have saved.')}
      >
        <DataTable
          columns={[
            { key: 'tradeName', label: t('Taxpayer') },
            { key: 'division', label: t('Division') },
            { key: 'leadRule', label: t('Lead signal'), sortValue: r => r.leadRule?.label || '', render: r => r.leadRule?.label || '—' },
            { key: 'detectionFloorDays', label: t('Detection'), align: 'right', render: r => `${r.detectionFloorDays}d` },
            { key: 'queueDwellDays', label: t('Queue dwell'), align: 'right', render: r => <span className="font-semibold text-[#C5221F] tabular-nums">{r.queueDwellDays}d</span> },
            { key: 'lostToQueue', label: t('Lost to queue'), align: 'right', render: r => lakh(r.lostToQueue) },
            { key: 'atNow', label: t('Still recoverable'), align: 'right', render: r => lakh(r.atNow) }
          ]}
          rows={COUNTERFACTUALS}
          pageSize={12}
        />
      </Card>

      {/* The boundary of the claim. */}
      <div className="rounded-xl border border-steel-300 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('What this is, and what it is not')}</div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{COUNTERFACTUAL_NOTE}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function RevisitView() {
  const R = REVISIT_SUMMARY
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <KpiCard label={t('Revisit candidates')} value={R.count} unit={cr(R.exposure)} tone="orange" icon={RotateCcw} />
        <KpiCard label={t('Closed with signals live')} value={R.closedWithSignal} unit={t('audit closed anyway')} tone="red" icon={AlertTriangle} />
        <KpiCard label={t('Never actioned')} value={R.neverActioned} unit={t('no notice ever issued')} tone="amber" icon={History} />
        <KpiCard label={t('Clock confirmed live')} value={R.withLiveClock} unit={t('of {0} — see caveat', R.count)} tone="steel" icon={Clock} />
      </div>

      {/* The caveat that stops this being read as 65 Cr of recoverable money. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">
            {t('{0} of these {1} carry a confirmed live limitation clock.', R.withLiveClock, R.count)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">
            {t('The rest have no limitation record computed against them, which is not the same as having time in hand. The exposure figure above is therefore what these cases represent, not what is recoverable from them — establishing the period and the applicable section is the first step on any of them, not the last.')}
          </p>
        </div>
      </div>

      <Card title={t('Cases put down while something was still live')}>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mb-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{REVISIT_NOTE}</p>
        </div>
        <DataTable
          columns={[
            { key: 'tradeName', label: t('Taxpayer') },
            { key: 'division', label: t('Division') },
            {
              key: 'basisLabel', label: t('Why it is here'),
              render: r => <Pill tone={r.basis === 'closed_with_signal' ? 'red' : 'amber'}>{r.basisLabel}</Pill>
            },
            { key: 'ruleCount', label: t('Rules firing'), align: 'right' },
            { key: 'riskScore', label: t('Risk'), align: 'right' },
            {
              key: 'daysRemaining', label: t('Clock'), align: 'right',
              render: r => r.daysRemaining == null
                ? <span className="text-[11px] text-steel-400 italic">{t('not established')}</span>
                : <span className="tabular-nums">{r.daysRemaining}d</span>
            },
            { key: 'exposure', label: t('Exposure'), align: 'right', render: r => lakh(r.exposure) }
          ]}
          rows={REVISIT_CANDIDATES}
          pageSize={12}
        />
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

/* A capability refused, with the measurement that refuses it.
 *
 * The label count was the first argument. The separation test is the better
 * one, because it is empirical and because its conclusion is different: the
 * problem is not sample size. */
function FraudView() {
  const F = FRAUD_LABEL_STATE
  const S = SEPARATION_TEST

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('Refused — and not because the sample is small.')}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{S.verdict}</p>
        </div>
      </div>

      {/* The test, shown in full. */}
      <Card
        title={t('The separation test')}
        subtitle={t('Before a resemblance model can be built, the cases it learns from must actually differ from the cases it will screen. Measured here per feature, and reported whatever it says.')}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
          <Figure label={t('Positive class')} value={`${S.positiveN}`} sub={t('sustained on appeal')} />
          <Figure label={t('Contrast class')} value={`${S.contrastN}`} sub={t('reversed or remanded')} tone="red" />
          <Figure label={t('Baseline')} value={`${S.baselineN}`} sub={t('all litigation')} />
          <Figure label={t('Features that separate')} value={`${S.separatingCount} / ${S.features.length}`} sub={t('none reach 0.5')} tone="red" />
        </div>

        <DataTable
          columns={[
            { key: 'label', label: t('Feature') },
            { key: 'sustainedMean', label: t('Cases we won'), align: 'right' },
            { key: 'baselineMean', label: t('All cases'), align: 'right' },
            {
              key: 'effectSize', label: t('Effect size'), align: 'right',
              render: r => <span className={`tabular-nums font-semibold ${r.separates ? 'text-emerald-700' : 'text-steel-500'}`}>{r.effectSize}</span>
            },
            {
              key: 'separates', label: t('Usable signal?'),
              render: r => r.separates ? <Pill tone="green">{t('Yes')}</Pill> : <Pill tone="steel">{t('No')}</Pill>
            }
          ]}
          rows={S.features}
          searchable={false}
          pageSize={6}
        />
        <p className="text-[11.5px] text-steel-600 leading-relaxed mt-3">
          {t('Effect size is the gap between the two means measured against the spread of the population. Below roughly 0.5 there is nothing a screen could stand on. Risk rules firing come out at exactly zero — cases the department won fire the same number of rules as cases in general.')}
        </p>
      </Card>

      {/* The consequence, which is the actually useful output. */}
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
      </Card>

      {/* The original Section 74 count, kept as the secondary argument. */}
      <Card title={t('The Section 74 label count, for completeness')} subtitle={t('The first reason this was refused, before the separation test gave a better one.')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(F.sectionCounts).map(([sec, n]) => (
            <div key={sec} className={`rounded-lg border px-3.5 py-3 ${sec === 's74' ? 'border-red-300 bg-red-50/60' : 'border-steel-200 bg-steel-50'}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{sec.replace('s', 'Section ')}</div>
              <div className="text-2xl font-bold text-navy-900 tabular-nums">{n}</div>
              <p className="text-[11px] text-steel-600 mt-1">
                {sec === 's74' ? t('The positive class, if fraud charging were the label.') : t('The population to be screened.')}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Why the stakes forbid an approximation')}</div>
          <p className="text-[12px] text-navy-800 leading-relaxed">{F.stakes}</p>
        </div>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{F.honestPosition}</p>
        </div>
      </Card>
    </div>
  )
}

function Figure({ label, value, sub, tone }) {
  const color = tone === 'red' ? 'text-[#C5221F]' : 'text-navy-900'
  return (
    <div>
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{label}</div>
      <div className={`text-[20px] font-bold tabular-nums leading-none ${color}`}>{value}</div>
      <div className="text-[11px] text-steel-500 mt-1">{sub}</div>
    </div>
  )
}
