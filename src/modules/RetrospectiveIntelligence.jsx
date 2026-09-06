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
  REVISIT_CANDIDATES, REVISIT_SUMMARY, REVISIT_NOTE, FRAUD_LABEL_STATE
} from '../data/retrospective.js'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const TABS = [
  { key: 'timing', label: 'What earlier action was worth', icon: Clock },
  { key: 'revisit', label: 'Put down while still live', icon: RotateCcw },
  { key: 'fraud', label: 'Fraud resemblance — not built', icon: Lock }
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

/* A capability deliberately not built, with the count that blocks it. */
function FraudView() {
  const F = FRAUD_LABEL_STATE
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('Not built. The register contains {0} Section 74 case.', F.s74Count)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{F.reason}</p>
        </div>
      </div>

      <Card title={t('The label count, which is the whole argument')}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(F.sectionCounts).map(([sec, n]) => (
            <div key={sec} className={`rounded-lg border px-3.5 py-3 ${sec === 's74' ? 'border-red-300 bg-red-50/60' : 'border-steel-200 bg-steel-50'}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{sec.replace('s', 'Section ')}</div>
              <div className="text-2xl font-bold text-navy-900 tabular-nums">{n}</div>
              <p className="text-[11px] text-steel-600 mt-1">
                {sec === 's74' ? t('The positive class. {0} needed at minimum.', F.minimumNeeded) : t('The population to be screened.')}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Why the stakes forbid an approximation')}</div>
          <p className="text-[12px] text-navy-800 leading-relaxed">{F.stakes}</p>
        </div>
      </Card>

      <Card title={t('What would unlock it')} subtitle={t('Not simply “more data” — these three specifically.')}>
        <ul className="space-y-2.5">
          {F.whatWouldUnlockIt.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-navy-800 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{F.honestPosition}</p>
        </div>
      </Card>
    </div>
  )
}
