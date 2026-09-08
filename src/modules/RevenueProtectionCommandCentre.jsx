import { ShieldCheck, Calculator, Ban, Lock, Info, AlertTriangle, Clock, Scale, MapPin, TrendingDown, Users, CalendarClock, UserPlus, Gauge } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TimeHorizonChart } from '../components/ui/Charts.jsx'
import {
  COMMAND_SUMMARY, BY_MECHANISM, TOP_ACTIONS, TOP_ACTIONS_NOTE,
  PENDING_CAPABILITIES, HEADLINE_METHOD_NOTE,
  HORIZON_PROFILE, HORIZON_NOTE, PROTECTION_FUNNEL, FUNNEL_NOTE,
  BY_DIVISION, LEGAL_REVIEW
} from '../data/commandCentre.js'
import { useMemo } from 'react'
import { FilterScope, activeFilterLabels } from '../components/ui/FilterScope.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import { AT_RISK } from '../data/commandCentre.js'
/* Read from the engines that own these questions, never recomputed here:
 * the statutory ladder is statutory.js, the establishment and the residual are
 * capacity.js, and the officer-day cost of a case is priority.js. */
import { LIMITATION_SUMMARY } from '../data/statutory.js'
import { CAPACITY_RESULT, RESIDUAL_REASONS } from '../data/capacity.js'
import { PRIORITY_CASES } from '../data/priority.js'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => Math.round(n / 100000)
const HORIZON_TICKS = HORIZON_PROFILE.map(h => h.day)
const HORIZON_TILES = HORIZON_PROFILE.filter(h => h.day > 0)

/* The statutory ladder. Cumulative by construction — the 90-day band contains
 * the 30-day one — which is stated on screen rather than left to be inferred
 * from bars that would otherwise look like they add up. */
const LADDER = [
  {
    id: 'barred', tone: 'red',
    label: 'Already past the binding date',
    count: LIMITATION_SUMMARY.barredCount, valueCr: LIMITATION_SUMMARY.barredCr,
    note: 'Extinguished by operation of law. Excluded from the opportunity above, whatever the merits.'
  },
  {
    id: 'd30', tone: 'orange',
    label: 'Binding date within 30 days',
    count: LIMITATION_SUMMARY.within30Count, valueCr: LIMITATION_SUMMARY.within30Cr,
    note: 'A notice has to issue inside this window. Nothing else on this screen outranks it.'
  },
  {
    id: 'd90', tone: 'amber',
    label: 'Within 90 days',
    count: LIMITATION_SUMMARY.within90Count, valueCr: LIMITATION_SUMMARY.within90Cr,
    note: 'Cumulative — contains the 30-day band above. Still schedulable, not yet urgent.'
  },
  {
    id: 'd180', tone: 'steel',
    label: 'Within 180 days',
    count: LIMITATION_SUMMARY.within180Count, valueCr: LIMITATION_SUMMARY.within180Cr,
    note: 'Cumulative. This is the planning horizon, not the acting one.'
  },
  {
    id: 'contested', tone: 'navy',
    label: 'Deadline rests on a contested notification',
    count: LIMITATION_SUMMARY.contestedCount, valueCr: LIMITATION_SUMMARY.contestedCr,
    note: 'Counted whether live or expired: if the notification falls, orders already passed under it were void when made.'
  }
]
const LADDER_MAX = Math.max(...LADDER.map(l => l.valueCr), 1)

/* The flagship. Its hard part is arithmetic, not layout: the same rupee is
 * counted by four engines, and a command centre that adds up its own modules
 * prints a headline several times larger than the money at stake. */
export default function RevenueProtectionCommandCentre() {
  const S = COMMAND_SUMMARY
  const { filters } = useApp()
  // The headline is recomputed over the filtered union rather than left
  // statewide above filtered rows — a divisional filter with a statewide
  // headline is the specific inconsistency this screen exists to avoid.
  const scoped = useMemo(() => AT_RISK.filter(r => applyScopeFilters(r, filters)), [filters])
  const scopedValue = useMemo(() => scoped.reduce((a, r) => a + r.value, 0), [scoped])
  const unreachableActions = TOP_ACTIONS.filter(a => !a.reachable).length
  // Which cards below the hero are statewide by construction. Said on screen
  // only while a filter is actually set, so it reads as a caveat rather than
  // as furniture.
  const filterActive = activeFilterLabels(filters).length > 0
  const statewidePill = filterActive ? <Pill tone="steel">{t('Statewide — not narrowed by the filter bar')}</Pill> : null

  /* ---- What the week's ranked actions actually cost, against what the week
   * has. A list of ten correct actions is not a plan until somebody says
   * whether the establishment can absorb it. The officer-day price of a case is
   * the priority engine's; the establishment is the capacity engine's; the
   * protected total is the funnel's last step. Nothing here is a second
   * estimate of any of them. */
  const weekPlan = useMemo(() => {
    const effortByGstin = new Map(PRIORITY_CASES.map(c => [c.gstin, c.effortDays]))
    let days = 0
    let priced = 0
    TOP_ACTIONS.forEach(a => {
      const e = effortByGstin.get(a.gstin)
      if (e == null) return
      days += e
      priced += 1
    })
    const protectedStep = PROTECTION_FUNNEL.find(s => s.id === 'protected')
    return {
      effortByGstin,
      officerDays: Math.round(days * 10) / 10,
      priced,
      unpriced: TOP_ACTIONS.length - priced,
      supplyDays: CAPACITY_RESULT.totalSupplyDays,
      sharePct: CAPACITY_RESULT.totalSupplyDays ? Math.round((days / CAPACITY_RESULT.totalSupplyDays) * 100) : null,
      protectedValue: protectedStep ? protectedStep.value : 0,
      blockedValue: TOP_ACTIONS.filter(a => !a.reachable).reduce((s, a) => s + a.protects, 0)
    }
  }, [])

  /* The deployment answer, read from the capacity engine's pool analysis: the
   * marginal value of one more officer-week is computed from the cases actually
   * left unreachable in that pool, best density first. */
  const deployment = useMemo(() => ({
    residual: [
      { key: 'no_eligible_officer', count: CAPACITY_RESULT.noEligibleOfficer },
      { key: 'no_capacity', count: CAPACITY_RESULT.noCapacity },
      { key: 'exceeds_weekly_capacity', count: CAPACITY_RESULT.exceedsWeek }
    ].filter(r => r.count > 0),
    pools: CAPACITY_RESULT.bindingPools.slice(0, 5),
    unworkableValue: CAPACITY_RESULT.unworkableValue,
    unworkableCount: CAPACITY_RESULT.unworkableCount,
    mandatoryUnworkable: CAPACITY_RESULT.mandatoryUnworkable.length
  }), [])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Revenue Protection')}
        title={t('Revenue Protection Command Centre')}
        description={<MethodNote short={t('What is about to be lost, what can still be protected, and what to do.')} full={t('What the department is about to lose, what can still be protected, and which actions this week protect the most. Every figure is computed by the engine that owns it — nothing on this screen is illustrative.')} />}
        actions={<ExportBar moduleLabel="Revenue Protection Command Centre" />}
      />

      <FilterScope shown={scoped.length} total={AT_RISK.length} unit={t('at-risk cases')}
        ignores={{
          dateRange: 'The window this screen measures runs forward from today, so a past date range would not change what it shows.',
          taxpayerType: 'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.'
        }}
      />

      {/* ---------- HERO ---------- */}
      <div className="rounded-2xl border border-navy-200 bg-gradient-to-br from-navy-50 via-white to-steel-50 shadow-card overflow-hidden mb-4">
        <div className="px-6 pt-6 pb-5 flex flex-wrap items-end gap-x-10 gap-y-5">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-govt-600 mb-2">{t('Revenue Protection Opportunity')}</div>
            <div className="text-[52px] font-bold text-navy-900 tabular-nums leading-[0.95]">{cr(scoped.length === AT_RISK.length ? S.protectableValue : scopedValue)}</div>
            <div className="text-[12.5px] text-steel-600 mt-2">
              {t('across {0} cases · each counted once, however many mechanisms flag it', scoped.length)}
            </div>
            <div className="text-[11.5px] text-steel-500 mt-1">
              {t('{0}% of the ₹{1} Cr assessed exposure is still recoverable at all — the rest went to detection lag before this week began.',
                Math.round((PROTECTION_FUNNEL[1].value / PROTECTION_FUNNEL[0].value) * 100),
                Math.round(PROTECTION_FUNNEL[0].value / 10000000).toLocaleString('en-IN'))}
            </div>
          </div>
          <div className="ml-auto grid grid-cols-2 sm:grid-cols-4 gap-x-7 gap-y-4">
            <Stat icon={Clock} label={t('Within 30 days')} value={`₹${S.within30Cr} Cr`} sub={t('{0} cases', S.within30Count)} tone="red" />
            <Stat icon={TrendingDown} label={t('Decays this week')} value={`₹${S.decayNextWeekCr} Cr`} sub={t('if untouched')} tone="amber" />
            <Stat icon={Users} label={t('Unreachable')} value={S.unreachableCases} sub={t('no officer available')} tone="amber" />
            <Stat icon={Scale} label={t('Legal review')} value={LEGAL_REVIEW.count} sub={cr(LEGAL_REVIEW.value)} tone="navy" />
          </div>
        </div>

        {filterActive && (
          <MethodNote className="bg-steel-50 border-t border-steel-200 px-6 py-2.5 text-[11.5px] text-steel-600 leading-relaxed" short={t('The headline follows the filter; the four figures beside it do not.')} full={t('The headline follows the filter. The four figures beside it do not: limitation, decay and capacity are computed across the whole establishment, and narrowing them here would mean re-running engines this screen does not own.')} />
        )}

        {/* Loss strip — attached to the hero, because the two numbers only mean
            anything beside one another. */}
        <div className="bg-red-50/80 border-t border-red-200 px-6 py-3.5 flex items-start gap-3">
          <Ban className="w-4.5 h-4.5 text-[#C5221F] shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-navy-800 leading-relaxed">
            <strong className="text-[#C5221F]">
              {t('{0} across {1} cases is already beyond its limitation date.', cr(S.forfeitedValue), S.forfeitedCases)}
            </strong>
            <MethodNote
              short={t('Excluded from the figure above, and stated beside it.')}
              full={t('Excluded from the figure above, and stated beside it. Money that is gone cannot be counted as an opportunity to protect it — and the size of this number, not the size of the opportunity, is the argument for acting earlier.')}
            />
          </div>
        </div>
      </div>

      {/* ---------- FUNNEL ---------- */}
      <Card tone="yellow"
        title={t('Where the money goes between owed and protected')}
        subtitle={<MethodNote short={t('Four steps, three causes, three owners — not netted into one rate.')} full={t('Four steps, three different causes, three different owners. They are not netted into one recovery rate because they call for three different decisions.')} />}
        className="mb-4"
        actions={statewidePill}
      >
        <div className="space-y-1">
          {PROTECTION_FUNNEL.map((step, i) => {
            const width = Math.max(step.pctOfStart, 1.2)
            const tone = i === 0 ? 'bg-navy-700' : i === 1 ? 'bg-govt-500' : i === 2 ? 'bg-amber-500' : 'bg-emerald-600'
            return (
              <div key={step.id}>
                {i > 0 && (
                  <div className="flex items-center gap-2 pl-1 py-1.5">
                    <span className="text-[11px] font-bold text-[#C5221F] tabular-nums shrink-0">−{cr(step.dropFromPrev)}</span>
                    <Pill tone="red">{t(step.owner)}</Pill>
                    <span className="text-[11px] text-steel-600 leading-snug">{t(step.lossReason)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-56 shrink-0 text-[12.5px] font-medium text-navy-800">{t(step.label)}</div>
                  <div className="flex-1 h-9 rounded-md bg-steel-100 overflow-hidden relative">
                    <div className={`h-full ${tone} flex items-center justify-end pr-2.5 transition-all`} style={{ width: `${width}%` }}>
                      {width > 16 && <span className="text-[11.5px] font-bold text-white tabular-nums">{cr(step.value)}</span>}
                    </div>
                    {width <= 16 && (
                      <span className="absolute inset-y-0 flex items-center text-[11.5px] font-bold text-navy-900 tabular-nums" style={{ left: `calc(${width}% + 8px)` }}>
                        {cr(step.value)}
                      </span>
                    )}
                  </div>
                  <div className="w-14 shrink-0 text-right text-[11.5px] font-semibold text-steel-500 tabular-nums">{step.pctOfStart}%</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-4 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{t(FUNNEL_NOTE)}</p>
        </div>
      </Card>

      {/* ---------- HORIZON ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card tone="green"
          title={t('Revenue at risk over time')}
          subtitle={t('What survives, and what is gone, if nothing is done.')}
          className="lg:col-span-2"
          actions={statewidePill}
        >
          <TimeHorizonChart
            data={HORIZON_PROFILE}
            height={240}
            ticks={HORIZON_TICKS}
            remainingKey="remainingCr"
            lostKey="lostCr"
            remainingLabel={t('Still recoverable')}
            lostLabel={t('Lost — cumulative')}
          />
          <div className="grid grid-cols-5 gap-2 mt-2">
            {HORIZON_TILES.map(h => (
              <div key={h.day} className="rounded-lg border border-steel-200 bg-white px-2 py-2 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{t(h.label)}</div>
                <div className="text-[13px] font-bold text-[#C5221F] tabular-nums mt-0.5">−{h.lostCr}</div>
                <div className="text-[10px] text-steel-500 tabular-nums">{t('{0} left', h.remainingCr)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card tone="blue" title={t('Two clocks, two responses')} subtitle={t('Split of the 180-day loss.')}>
          {(() => {
            const h = HORIZON_PROFILE.find(x => x.day === 180) || HORIZON_PROFILE[0]
            const total = h.lostToLimitationCr + h.lostToDecayCr || 1
            return (
              <div className="space-y-3">
                <ClockSplit
                  label={t('Cliff — limitation expiry')}
                  value={h.lostToLimitationCr}
                  pct={Math.round((h.lostToLimitationCr / total) * 100)}
                  tone="bg-[#c41e3a]"
                  note={t('Worth full value the day before, nothing the day after. Needs a notice issued.')}
                />
                <ClockSplit
                  label={t('Slope — downstream utilisation')}
                  value={h.lostToDecayCr}
                  pct={Math.round((h.lostToDecayCr / total) * 100)}
                  tone="bg-[#f78c0a]"
                  note={t('Erodes continuously while the case waits. Needs the case opened sooner.')}
                />
                <p className="text-[11.5px] text-steel-600 leading-relaxed pt-1 border-t border-steel-100">{t(HORIZON_NOTE)}</p>
              </div>
            )
          })()}
        </Card>
      </div>

      {/* ---------- STATUTORY LADDER ----------
          The horizon chart says how much is left at day N. It does not say how
          many proceedings reach their binding date in that time, which is the
          figure a Commissioner is answerable for and the one that decides how
          many notices have to be signed this month. */}
      <Card tone="red"
        title={t('When the statutory clock runs out')}
        subtitle={<MethodNote short={t('Counted against the binding date, not the order deadline.')} full={t('Counted against the BINDING date — the notice date where no notice has issued, which falls months before the order deadline and is the one most often missed.')} />}
        className="mb-4"
        actions={statewidePill}
      >
        <div className="space-y-2">
          {LADDER.map(l => (
            <div key={l.id} className="flex items-center gap-3">
              <div className="w-64 shrink-0">
                <div className="text-[12px] font-medium text-navy-800">{t(l.label)}</div>
                <div className="text-[10.5px] text-steel-500 leading-snug">{t(l.note)}</div>
              </div>
              <div className="flex-1 h-5 rounded bg-steel-100 overflow-hidden">
                <div
                  className={`h-full ${l.tone === 'red' ? 'bg-[#C5221F]' : l.tone === 'orange' ? 'bg-orange-500' : l.tone === 'amber' ? 'bg-amber-500' : l.tone === 'navy' ? 'bg-navy-600' : 'bg-steel-400'}`}
                  style={{ width: `${(l.valueCr / LADDER_MAX) * 100}%` }}
                />
              </div>
              <div className="w-24 shrink-0 text-right text-[12px] font-semibold text-navy-900 tabular-nums">{t('₹{0} Cr', l.valueCr)}</div>
              <div className="w-24 shrink-0 text-right text-[11px] text-steel-500 tabular-nums">{t('{0} of {1}', l.count, LIMITATION_SUMMARY.totalCases)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 mt-4 flex items-start gap-2.5">
          <CalendarClock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <MethodNote className="text-[12px] text-navy-800 leading-relaxed" short={t('Assessed exposure against the deadline — not the recoverable headline.')} full={t('These are ASSESSED EXPOSURE against the deadline, not the recoverable value in the headline above. The two answer different questions — what a period is worth if the demand stands, against what is realistically collectable after decay — and adding them together, or comparing them directly, would be wrong. The bands are cumulative, so they do not sum either.')} />
        </div>
      </Card>

      {/* ---------- ARITHMETIC ---------- */}
      <Card tone="yellow"
        title={t('Why this is not the sum of the modules')}
        subtitle={t('The same rupee is flagged by more than one engine. Adding the mechanism totals would overstate the position by {0}.', cr(S.doubleCountAvoided))}
        className="mb-4"
        actions={statewidePill}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <BoundBox tone="steel" label={t('Sum of the mechanisms')} value={cr(S.naiveSum)} strike note={t('What a dashboard adding its own tiles would print.')} />
          <BoundBox tone="green" label={t('Deduplicated union')} value={cr(S.protectableValue)} note={t('Each taxpayer once, whatever flags it.')} />
          <BoundBox tone="amber" label={t('Double-count avoided')} value={cr(S.doubleCountAvoided)} note={t('{0}× overlap · {1} of {2} cases carry more than one mechanism', S.overlapFactor, S.multiMechanismCases, S.protectableCases)} />
        </div>
        <div className="space-y-2">
          {BY_MECHANISM.map(m => {
            const max = Math.max(...BY_MECHANISM.map(x => x.value), 1)
            return (
              <div key={m.id} className="flex items-center gap-3" title={t(m.note)}>
                <div className="w-60 shrink-0">
                  <div className="text-[12px] font-medium text-navy-800">{t(m.label)}</div>
                  <div className="text-[10.5px] text-steel-500">
                    {t('{0} cases · {1}% of the union', m.count, S.protectableCases ? Math.round((m.count / S.protectableCases) * 100) : 0)}
                  </div>
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
          <p className="text-[12px] text-steel-700 leading-relaxed">{t(HEADLINE_METHOD_NOTE)}</p>
        </div>
      </Card>

      {/* ---------- CONCENTRATION ---------- */}
      <Card tone="green"
        title={t('Where it is concentrated')}
        subtitle={<MethodNote short={t('Value at risk by division, and the share no officer can reach.')} full={t('Value at risk by division, with the share no eligible officer can reach. The second bar is the deployment decision.')} />}
        className="mb-4"
        actions={statewidePill}
      >
        <div className="space-y-2.5">
          {BY_DIVISION.map(d => {
            const max = Math.max(...BY_DIVISION.map(x => x.value), 1)
            return (
              <div key={d.division} className="flex items-center gap-3">
                <div className="w-44 shrink-0 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                  <span className="text-[12px] font-medium text-navy-800 truncate">{t(d.division)}</span>
                </div>
                <div className="flex-1 h-7 rounded bg-steel-100 overflow-hidden relative">
                  <div className="h-full bg-govt-600/80" style={{ width: `${(d.value / max) * 100}%` }} />
                  {/* The unreachable share, overlaid rather than shown apart —
                      it is a portion of this bar, not a separate quantity. */}
                  <div
                    className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(45deg,rgba(196,30,58,0.55)_0_5px,transparent_5px_10px)]"
                    style={{ width: `${(d.value / max) * (d.unreachablePct / 100) * 100}%` }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-[12px] font-semibold text-navy-900 tabular-nums">{cr(d.value)}</div>
                <div className="w-32 shrink-0 text-right text-[11px] text-steel-500">
                  {t('{0} cases · {1}% unreachable', d.cases, d.unreachablePct)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-steel-100 text-[11px] text-steel-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-govt-600/80" />{t('Value at risk')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[repeating-linear-gradient(45deg,rgba(196,30,58,0.55)_0_3px,transparent_3px_6px)] border border-steel-200" />{t('Share no eligible officer can reach')}</span>
        </div>
      </Card>

      {/* ---------- DEPLOYMENT ----------
          The concentration bars show where value cannot be reached. This says
          what would fix it, and what the fix is worth — which is the difference
          between a finding and a decision. */}
      <Card tone="blue"
        title={t('What unblocks the unreachable share')}
        subtitle={<MethodNote short={t('Three reasons, three different remedies — they are not conflated.')} full={t('{0} cases worth {1} cannot be worked this week. They land there for three distinct reasons calling for three different remedies, and conflating them produces the wrong decision.', deployment.unworkableCount, cr(deployment.unworkableValue))} />}
        className="mb-4"
        actions={statewidePill}
      >
        {deployment.mandatoryUnworkable > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50/70 px-4 py-3 mb-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-[#C5221F] shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-navy-800 leading-relaxed">
              <strong>{t('{0} of them are inside the 30-day statutory window.', deployment.mandatoryUnworkable)}</strong>{' '}
              {t('If nothing changes the period expires and the demand is extinguished by operation of law. Second an officer from an adjacent division, or accept the loss explicitly — those are the only two outcomes available.')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          {deployment.residual.map(r => (
            <div key={r.key} className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[12px] font-bold text-navy-900">{t(RESIDUAL_REASONS[r.key].label)}</span>
                <span className="text-[13px] font-bold text-navy-900 tabular-nums shrink-0">{r.count}</span>
              </div>
              <p className="text-[11px] text-steel-600 leading-relaxed">{t(RESIDUAL_REASONS[r.key].remedy, ...(RESIDUAL_REASONS[r.key].remedyArgs || []))}</p>
            </div>
          ))}
          {deployment.residual.length === 0 && (
            <div className="lg:col-span-3 text-[12px] text-steel-500 py-3 text-center">
              {t('Every case in this week’s demand was placed with an eligible officer.')}
            </div>
          )}
        </div>

        <div className="text-[11px] font-bold uppercase tracking-wider text-steel-400 mb-2">{t('Where the next officer-week protects most')}</div>
        {deployment.pools.length > 0 ? (
          <div className="space-y-2">
            {deployment.pools.map(p => (
              <div key={p.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-2.5">
                <UserPlus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[12px] font-semibold text-navy-900">{t(p.division)}</span>
                <Pill tone="amber">{t(p.typeLabel)}</Pill>
                <span className="text-[11px] text-steel-600">
                  {t('{0}× oversubscribed · {1} of {2} officer-days demanded', p.subscription, p.demandDays, p.supplyDays)}
                </span>
                <span className="ml-auto text-[12px] font-bold text-navy-900 tabular-nums">
                  {t('₹{0} L across {1} cases', lakh(p.marginalOfficerWeekValue).toLocaleString('en-IN'), p.marginalOfficerWeekCases)}
                </span>
              </div>
            ))}
            <MethodNote className="text-[11.5px] text-steel-600 leading-relaxed pt-1" short={t('Computed best-density-first on the cases actually left, not an average.')} full={t('The marginal figure is computed from the cases actually left unreachable in that pool, taken best-density-first up to one officer-week — not an average, and not asserted. Capacity is pooled by division and case type because that is the granularity at which an officer-week can actually be moved: aggregate slack is meaningless if it sits in the wrong pool.')} />
          </div>
        ) : (
          <div className="text-[12px] text-steel-500 py-3 text-center">{t('No division-and-case-type pool is oversubscribed this week.')}</div>
        )}
      </Card>

      {/* ---------- LEGAL ---------- */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 mb-4 flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('{0} cases worth {1} require a legal view before any order issues', LEGAL_REVIEW.count, cr(LEGAL_REVIEW.value))}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(LEGAL_REVIEW.reason)}</p>
        </div>
      </div>

      {/* ---------- ACTIONS ---------- */}
      <Card tone="red"
        title={t('Top actions this week, by revenue protected')}
        subtitle={t('Ranked by what the action protects over the next seven days — not by the size of the case.')}
        className="mb-4"
        actions={statewidePill}
      >
        {/* A ranked list is not yet a plan. These three figures say whether the
            week can absorb it, what taking it protects, and what is blocked. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <PlanStat
            icon={Gauge}
            label={t('Officer-days this list costs')}
            value={weekPlan.officerDays.toLocaleString('en-IN')}
            note={weekPlan.sharePct != null
              ? t('{0}% of the {1} net officer-days the state has this week — but capacity is pooled by division, so a statewide share is a floor on the difficulty, not a plan.', weekPlan.sharePct, weekPlan.supplyDays)
              : t('The establishment reports no net officer-days this week, so no share can be stated.')}
          />
          <PlanStat
            icon={ShieldCheck}
            label={t('Protected by taking them')}
            value={cr(weekPlan.protectedValue)}
            note={t('The reachable actions only, and only what they protect within seven days. This is the funnel’s last step, not a separate estimate.')}
          />
          <PlanStat
            icon={AlertTriangle}
            label={t('Blocked for want of an officer')}
            value={cr(weekPlan.blockedValue)}
            tone="red"
            note={t('Correctly ranked, and unworkable. This is a deployment decision, not a scheduling one.')}
          />
        </div>

        {weekPlan.unpriced > 0 && (
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 mb-3 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
            <MethodNote className="text-[12px] text-steel-700 leading-relaxed" short={t('Effort is priced only where a rule fired and exposure is non-zero.')} full={t('{0} of these {1} actions carry no officer-day estimate. The priority engine prices effort only for taxpayers with a triggered rule and non-zero exposure, so the cost of those cases is left unstated rather than filled with an average — the officer-day total above is therefore a lower bound.', weekPlan.unpriced, TOP_ACTIONS.length)} />
          </div>
        )}

        {unreachableActions > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50/70 px-4 py-3 mb-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-[#C5221F] shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-navy-800 leading-relaxed">
              <strong>{t('{0} of these {1} actions cannot be taken this week.', unreachableActions, TOP_ACTIONS.length)}</strong>{' '}
              {t('No eligible officer in that division has capacity, or none is posted. The ranking is still correct; what is missing is somebody to act on it, which is a deployment decision rather than a scheduling one.')}
            </p>
          </div>
        )}
        <div className="divide-y divide-steel-100">
          {TOP_ACTIONS.map((a, i) => {
            const effortDays = weekPlan.effortByGstin.get(a.gstin)
            const sharePct = a.value > 0 ? Math.round((a.protects / a.value) * 100) : null
            return (
              <div key={a.gstin} className={`py-3 flex items-start gap-3 ${!a.reachable ? 'opacity-95' : ''}`}>
                <span className={`shrink-0 w-7 h-7 rounded-lg text-[12px] font-bold flex items-center justify-center tabular-nums mt-0.5 ${
                  i === 0 ? 'bg-[#C5221F] text-white' : 'bg-navy-100 text-navy-700'
                }`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-navy-900">{a.tradeName}</span>
                    <span className="text-[11.5px] text-steel-500">{t(a.division)}</span>
                    {!a.reachable && <Pill tone="red">{t('No officer available')}</Pill>}
                    {a.mechanisms.includes('limitation') && a.detail.daysRemaining != null && (
                      <Pill tone="amber">{t('{0} days to deadline', a.detail.daysRemaining)}</Pill>
                    )}
                    {effortDays != null
                      ? <span className="text-[11px] text-steel-500">{t('{0} officer-days', effortDays)}</span>
                      : <span className="text-[11px] text-steel-400">{t('Effort not priced')}</span>}
                  </div>
                  <div className="text-[12.5px] text-navy-800 mt-0.5">{t(a.action, ...(a.actionArgs || []))}</div>
                  <p className="text-[11.5px] text-steel-600 leading-relaxed mt-0.5">{t(a.because, ...(a.becauseArgs || []))}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{t('Protects')}</div>
                  <div className="text-[14px] font-bold text-navy-900 tabular-nums">{cr(a.protects)}</div>
                  <div className="text-[10.5px] text-steel-500 tabular-nums">
                    {sharePct != null
                      ? t('{0}% of the {1} case', sharePct, cr(a.value))
                      : t('case value not stated')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{t(TOP_ACTIONS_NOTE)}</p>
        </div>
      </Card>

      {/* ---------- PENDING ---------- */}
      <Card tone="yellow"
        title={t('Not yet computable')}
        subtitle={<MethodNote short={t('Left visibly empty rather than filled with plausible figures.')} full={t('Capabilities this screen would normally carry, left visibly empty rather than filled with plausible figures. Each names the input that unblocks it.')} />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {PENDING_CAPABILITIES.map(c => (
            <div key={c.id} className="rounded-lg border border-steel-200 bg-steel-50/60 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                <span className="text-[12.5px] font-bold text-navy-900">{t(c.label)}</span>
                <Pill tone="steel">{t('Pending data')}</Pill>
              </div>
              <p className="text-[11.5px] text-steel-600 leading-relaxed mb-2">{t(c.wanted)}</p>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400 mb-0.5">{t('Blocked by')}</div>
              <p className="text-[11.5px] text-navy-800 leading-relaxed">{t(c.blockedBy)}</p>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400 mt-2 mb-0.5">{t('Evidence')}</div>
              <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(c.evidence)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Stat({ icon: Icon, label, value, sub, tone }) {
  const color = tone === 'red' ? 'text-[#C5221F]' : tone === 'amber' ? 'text-amber-700' : 'text-navy-900'
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-steel-400 shrink-0" />
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{label}</span>
      </div>
      <div className={`text-[22px] font-bold tabular-nums leading-none ${color}`}>{value}</div>
      <div className="text-[11px] text-steel-500 mt-1">{sub}</div>
    </div>
  )
}

/* A figure for the week's plan: the number, and the sentence that says what it
 * is measured against. Without the second line the first is decoration. */
function PlanStat({ icon: Icon, label, value, note, tone }) {
  const cls = tone === 'red' ? 'border-red-200 bg-red-50/60' : 'border-steel-200 bg-steel-50'
  const color = tone === 'red' ? 'text-[#C5221F]' : 'text-navy-900'
  return (
    <div className={`rounded-lg border px-3.5 py-3 ${cls}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-steel-400 shrink-0" />
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-steel-500">{label}</span>
      </div>
      <div className={`text-[19px] font-bold tabular-nums leading-none ${color}`}>{value}</div>
      <p className="text-[11px] text-steel-600 leading-relaxed mt-1.5">{note}</p>
    </div>
  )
}

function BoundBox({ tone, label, value, note, strike }) {
  const cls = tone === 'green' ? 'border-emerald-200 bg-emerald-50/60'
    : tone === 'amber' ? 'border-amber-200 bg-amber-50/60'
      : 'border-steel-200 bg-steel-50'
  return (
    <div className={`rounded-lg border px-3.5 py-3 ${cls}`}>
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-500 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${strike ? 'text-steel-500 line-through' : 'text-navy-900'}`}>{value}</div>
      <p className="text-[11px] text-steel-600 leading-relaxed mt-1">{note}</p>
    </div>
  )
}

function ClockSplit({ label, value, pct, tone, note }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12px] font-semibold text-navy-800">{label}</span>
        <span className="text-[13px] font-bold text-navy-900 tabular-nums">₹{value} Cr</span>
      </div>
      <div className="h-2.5 rounded-full bg-steel-100 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <p className="text-[11px] text-steel-600 leading-relaxed mt-1">{note}</p>
    </div>
  )
}
