import { ShieldCheck, TrendingDown, Calculator, ListChecks, Ban, Lock, Info, AlertTriangle } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import {
  COMMAND_SUMMARY, BY_MECHANISM, TOP_ACTIONS, TOP_ACTIONS_NOTE,
  PENDING_CAPABILITIES, HEADLINE_METHOD_NOTE
} from '../data/commandCentre.js'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

/* The flagship screen. Its hard part is arithmetic, not layout: the same rupee
 * is counted by four different engines, and a command centre that adds up its
 * own modules produces a headline several times larger than the money actually
 * at stake. */
export default function RevenueProtectionCommandCentre() {
  const S = COMMAND_SUMMARY

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Revenue Protection')}
        title={t('Revenue Protection Command Centre')}
        description={t('What the department is about to lose, what can still be protected, and which actions this week protect the most. Every figure is computed from the engines behind it — nothing on this screen is illustrative.')}
        actions={<ExportBar moduleLabel="Revenue Protection Command Centre" />}
      />

      {/* Loss first. It is the more important number, and it is the argument. */}
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 mb-4 flex items-start gap-3">
        <Ban className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('{0} across {1} cases has already passed its limitation date and cannot be recovered by any action.', cr(S.forfeitedValue), S.forfeitedCases)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">
            {t('This is stated above the opportunity below, and deliberately excluded from it. Money that is gone cannot be counted as an opportunity to protect it — and the size of this figure, not the size of the opportunity, is the case for acting earlier.')}
          </p>
        </div>
      </div>

      {/* The headline. */}
      <div className="rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50 to-white shadow-card px-6 py-6 mb-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-govt-600 mb-1.5">{t('Revenue Protection Opportunity')}</div>
            <div className="text-4xl font-bold text-navy-900 tabular-nums leading-none">{cr(S.protectableValue)}</div>
            <div className="text-[12px] text-steel-600 mt-1.5">{t('across {0} cases, each counted once', S.protectableCases)}</div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 ml-auto">
            <Stat label={t('Within 30 days')} value={`₹${S.within30Cr} Cr`} sub={t('{0} cases', S.within30Count)} tone="red" />
            <Stat label={t('Decaying this week')} value={`₹${S.decayNextWeekCr} Cr`} sub={t('if untouched')} tone="amber" />
            <Stat label={t('Unreachable')} value={S.unreachableCases} sub={t('no officer available')} tone="amber" />
            <Stat label={t('Contested deadline')} value={`₹${S.contestedCr} Cr`} sub={t('{0} cases before SC', S.contestedCount)} tone="steel" />
          </div>
        </div>
      </div>

      {/* The arithmetic check — the thing that makes the headline defensible. */}
      <Card
        title={t('Why this is not the sum of the modules')}
        subtitle={t('The same rupee is flagged by more than one engine. Adding the mechanism totals would overstate the position by {0}.', cr(S.doubleCountAvoided))}
        className="mb-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{t('Sum of the mechanisms')}</div>
            <div className="text-lg font-bold text-steel-500 tabular-nums line-through">{cr(S.naiveSum)}</div>
            <p className="text-[11px] text-steel-600 mt-1">{t('What a dashboard adding its own tiles would print.')}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('Deduplicated union')}</div>
            <div className="text-lg font-bold text-navy-900 tabular-nums">{cr(S.protectableValue)}</div>
            <p className="text-[11px] text-steel-600 mt-1">{t('Each taxpayer once, whatever flags it.')}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Double-count avoided')}</div>
            <div className="text-lg font-bold text-navy-900 tabular-nums">{cr(S.doubleCountAvoided)}</div>
            <p className="text-[11px] text-steel-600 mt-1">{t('{0}× overlap · {1} of {2} cases carry more than one mechanism', S.overlapFactor, S.multiMechanismCases, S.protectableCases)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {BY_MECHANISM.map(m => {
            const max = Math.max(...BY_MECHANISM.map(x => x.value), 1)
            return (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-64 shrink-0">
                  <div className="text-[12px] font-medium text-navy-800">{m.label}</div>
                  <div className="text-[10.5px] text-steel-500">{t('{0} cases', m.count)}</div>
                </div>
                <div className="flex-1 h-5 rounded bg-steel-100 overflow-hidden">
                  <div className="h-full bg-govt-500/70" style={{ width: `${(m.value / max) * 100}%` }} />
                </div>
                <div className="w-24 shrink-0 text-right text-[12px] font-semibold text-navy-900 tabular-nums">{cr(m.value)}</div>
              </div>
            )
          })}
        </div>

        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-4 flex items-start gap-2.5">
          <Calculator className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{HEADLINE_METHOD_NOTE}</p>
        </div>
      </Card>

      {/* The week's work. */}
      <Card
        title={t('Top actions this week, by revenue protected')}
        subtitle={t('Ranked by what the action protects over the next seven days — not by the size of the case.')}
        className="mb-4"
      >
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mb-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{TOP_ACTIONS_NOTE}</p>
        </div>
        <div className="divide-y divide-steel-100">
          {TOP_ACTIONS.map((a, i) => (
            <div key={a.gstin} className="py-3 flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-navy-100 text-navy-700 text-[11px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-navy-900">{a.tradeName}</span>
                  <span className="text-[11.5px] text-steel-500">{a.division}</span>
                  {!a.reachable && <Pill tone="red">{t('No officer available')}</Pill>}
                  {a.horizon <= 30 && a.mechanisms.includes('limitation') && <Pill tone="amber">{t('{0} days to deadline', a.horizon)}</Pill>}
                </div>
                <div className="text-[12.5px] text-navy-800 mt-0.5">{a.action}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed mt-0.5">{a.because}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{t('Protects')}</div>
                <div className="text-[13px] font-bold text-navy-900 tabular-nums">{cr(a.protects)}</div>
              </div>
            </div>
          ))}
        </div>
        {TOP_ACTIONS.some(a => !a.reachable) && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#C5221F] shrink-0 mt-0.5" />
            <p className="text-[12px] text-navy-800 leading-relaxed">
              {t('{0} of these {1} actions cannot be taken this week — no eligible officer in that division has capacity, or none is posted. The ranking is still correct; what is missing is somebody to act on it, which is a deployment decision rather than a scheduling one.',
                TOP_ACTIONS.filter(a => !a.reachable).length, TOP_ACTIONS.length)}
            </p>
          </div>
        )}
      </Card>

      {/* What cannot be computed, named rather than approximated. */}
      <Card
        title={t('Not yet computable')}
        subtitle={t('Capabilities a screen like this would normally carry, left empty rather than filled with plausible figures. Each names the specific input that unblocks it.')}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PENDING_CAPABILITIES.map(c => (
            <div key={c.id} className="rounded-lg border border-steel-200 bg-steel-50/60 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                <span className="text-[12.5px] font-bold text-navy-900">{c.label}</span>
              </div>
              <p className="text-[11.5px] text-steel-600 leading-relaxed mb-2">{c.wanted}</p>
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-0.5">{t('Blocked by')}</div>
              <p className="text-[11.5px] text-navy-800 leading-relaxed">{c.blockedBy}</p>
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mt-2 mb-0.5">{t('Evidence')}</div>
              <p className="text-[11.5px] text-steel-600 leading-relaxed">{c.evidence}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Stat({ label, value, sub, tone }) {
  const color = tone === 'red' ? 'text-[#C5221F]' : tone === 'amber' ? 'text-amber-700' : 'text-navy-900'
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-0.5">{label}</div>
      <div className={`text-xl font-bold tabular-nums leading-none ${color}`}>{value}</div>
      <div className="text-[11px] text-steel-500 mt-1">{sub}</div>
    </div>
  )
}
