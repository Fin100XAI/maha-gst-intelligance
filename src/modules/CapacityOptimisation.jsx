import { useMemo, useState } from 'react'
import { Users, AlertTriangle, Gauge, Scale, MapPin, Clock, TrendingUp, Info } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import {
  CAPACITY_RESULT, CAPACITY_ASSUMPTIONS, CAPACITY_METHOD_NOTE,
  CAPACITY_RESIDUAL_NOTE, RESIDUAL_REASONS, CASE_TYPES, NET_DAYS_PER_OFFICER
} from '../data/capacity.js'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const TABS = [
  { key: 'allocation', label: 'This week’s allocation', icon: Users },
  { key: 'residual', label: 'What cannot be worked', icon: AlertTriangle },
  { key: 'binding', label: 'Where the constraint binds', icon: Gauge }
]

/* Capacity as a constrained assignment problem.
 *
 * The generic version deals ranked cases out to officers and draws a balanced
 * workload chart. It assumes capacity is fungible (it is not — division and
 * role are hard eligibility edges) and that a statutory deadline is a heavy
 * weight (it is not — it is a constraint, and weighting it lets the optimiser
 * trade a time-barred case away against enough small ones). */
export default function CapacityOptimisation() {
  const [tab, setTab] = useState('allocation')
  const R = CAPACITY_RESULT

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Deployment')}
        title={t('Officer Capacity & Deployment')}
        description={t('A week of officer capacity allocated against eligibility that is territorially and functionally binding, with limitation-critical work assigned before anything else competes for it. The finding is the residual — what nobody eligible can reach, and which specific constraint is responsible.')}
        actions={<ExportBar moduleLabel="Officer Capacity & Deployment" />}
      />

      <FilterNotApplicable reason={t('The allocation is a single statewide optimisation under territorial and role eligibility. Narrowing its input would re-run it on a subset and change every figure — a different answer presented as the same one — so it is computed across all divisions and the division breakdown below is where a single division is read.')} />

      {/* The single most important thing on the screen: aggregate utilisation
          says there is room, and aggregate utilisation is wrong. */}
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 mb-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('{0}% of departmental capacity is used, and {1} cases worth {2} still cannot be worked this week.',
              Math.round((R.usedDays / R.totalSupplyDays) * 100), R.unworkableCount, cr(R.unworkableValue))}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">
            {t('These two facts are not in tension — they are the same fact. An unused officer-day in one division cannot be spent in another, and an audit officer cannot take an investigation case. Aggregate utilisation is the figure to distrust; the pools below are where the decision actually sits.')}
            {R.mandatoryUnworkable.length > 0 && ' '}
            {R.mandatoryUnworkable.length > 0 && (
              <strong className="text-[#C5221F]">
                {t('{0} of them are inside the statutory window and will be time-barred if not reached.', R.mandatoryUnworkable.length)}
              </strong>
            )}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'allocation' && <AllocationView R={R} />}
      {tab === 'residual' && <ResidualView R={R} />}
      {tab === 'binding' && <BindingView R={R} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function AllocationView({ R }) {
  const rows = useMemo(() => R.assignments, [R])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label={t('Field officers')} value={R.officerCount} unit={t('{0} case-days available', R.totalSupplyDays)} tone="navy" icon={Users} />
        <KpiCard label={t('Cases placed')} value={R.assignedCount} unit={t('of {0} workable', R.poolCount)} tone="green" icon={TrendingUp} />
        <KpiCard label={t('Capacity spent')} value={R.usedDays} unit={t('of {0} days', R.totalSupplyDays)} tone="steel" icon={Clock} />
        <KpiCard label={t('Recoverable value placed')} value={(R.achievedValue / 10000000).toFixed(2)} unit={t('₹ Cr this week')} tone="green" icon={Scale} />
      </div>

      {/* Quality of the allocation, stated as a bound rather than a claim. */}
      <Card
        title={t('How good is this allocation?')}
        subtitle={t('Generalised assignment is NP-hard. This is a greedy heuristic, and rather than assert optimality it is measured against a bound that is unreachable by construction.')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <BoundStat label={t('Achieved — this allocation')} value={cr(R.achievedValue)} note={t('Real. Every case respects division, role and effort.')} tone="green" />
          <BoundStat label={t('Relaxed upper bound')} value={cr(R.boundValue)} note={t('Unreachable. Ignores eligibility and allows cases to be split.')} tone="steel" />
          <BoundStat label={t('Share of the bound captured')} value={`${R.captureShare}%`} note={t('The true optimum lies between the two figures.')} tone="navy" />
        </div>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[12px] text-steel-700 leading-relaxed">{CAPACITY_METHOD_NOTE}</p>
        </div>
      </Card>

      <Card
        title={t('Allocation for the coming week')}
        subtitle={t('Limitation-critical cases were placed first and ordered by expiry date, not by value. Everything else competed for the capacity that survived, ranked by recoverable value per officer-day.')}
      >
        <DataTable
          columns={[
            { key: 'tradeName', label: t('Taxpayer') },
            { key: 'division', label: t('Division') },
            { key: 'officerName', label: t('Assigned to') },
            { key: 'officerRole', label: t('Role') },
            {
              key: 'phase', label: t('Basis'),
              render: r => r.phase === 'mandatory'
                ? <Pill tone="red">{t('Statutory — {0}d', r.daysRemaining)}</Pill>
                : <Pill tone="steel">{t('Value per day')}</Pill>
            },
            { key: 'effortDays', label: t('Days'), align: 'right', render: r => r.effortDays.toFixed(1) },
            { key: 'recoverableNow', label: t('Recoverable'), align: 'right', render: r => lakh(r.recoverableNow != null ? r.recoverableNow : r.exposure * 0.4) }
          ]}
          rows={rows}
          pageSize={12}
        />
      </Card>
    </div>
  )
}

function BoundStat({ label, value, note, tone }) {
  const border = tone === 'green' ? 'border-emerald-200 bg-emerald-50/50' : tone === 'navy' ? 'border-navy-200 bg-navy-50/60' : 'border-steel-200 bg-steel-50'
  return (
    <div className={`rounded-lg border px-3.5 py-3 ${border}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-navy-900 tabular-nums">{value}</div>
      <p className="text-[11px] text-steel-600 leading-relaxed mt-1">{note}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ResidualView({ R }) {
  const byReason = useMemo(() => {
    const groups = {}
    R.unworkable.forEach(u => {
      if (!groups[u.reason]) groups[u.reason] = { reason: u.reason, cases: [], value: 0, critical: 0 }
      groups[u.reason].cases.push(u)
      groups[u.reason].value += u.recoverableNow != null ? u.recoverableNow : u.exposure * 0.4
      if (u.phase === 'mandatory') groups[u.reason].critical += 1
    })
    return Object.values(groups).sort((a, b) => b.value - a.value)
  }, [R])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-steel-200 bg-steel-50 px-5 py-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-steel-700 leading-relaxed">{CAPACITY_RESIDUAL_NOTE}</p>
      </div>

      {/* Three reasons, three different remedies. Conflating them is what
          produces a request for staff when the problem is a posting. */}
      {byReason.map(g => {
        const meta = RESIDUAL_REASONS[g.reason]
        return (
          <Card key={g.reason} title={t(meta.label)} subtitle={t('{0} cases · {1} of recoverable value at stake', g.cases.length, cr(g.value))}>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3 mb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('What would actually fix this')}</div>
              <p className="text-[12.5px] text-navy-800 leading-relaxed">{meta.remedy}</p>
            </div>
            {g.critical > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#C5221F]" />
                <span className="text-[12.5px] font-semibold text-[#C5221F]">
                  {t('{0} of these are inside the statutory window and cannot be recovered once it closes.', g.critical)}
                </span>
              </div>
            )}
            <DataTable
              columns={[
                { key: 'tradeName', label: t('Taxpayer') },
                { key: 'division', label: t('Division') },
                { key: 'effortDays', label: t('Days needed'), align: 'right', render: r => r.effortDays.toFixed(1) },
                { key: 'daysRemaining', label: t('Days to deadline'), align: 'right', render: r => r.daysRemaining == null ? '—' : r.daysRemaining },
                { key: 'value', label: t('Recoverable'), align: 'right', render: r => lakh(r.recoverableNow != null ? r.recoverableNow : r.exposure * 0.4) }
              ]}
              rows={g.cases}
              pageSize={8}
            />
          </Card>
        )
      })}

      {R.barredExcluded.length > 0 && (
        <Card
          title={t('Excluded before allocation — already time-barred')}
          subtitle={t('{0} cases. Not a capacity problem and deliberately not competing for officer days: no demand can lawfully be raised, so an officer-day spent here returns nothing.', R.barredExcluded.length)}
        >
          <DataTable
            columns={[
              { key: 'tradeName', label: t('Taxpayer') },
              { key: 'division', label: t('Division') },
              { key: 'bindingDate', label: t('Deadline passed'), align: 'right' },
              { key: 'daysRemaining', label: t('Days overdue'), align: 'right', render: r => Math.abs(r.daysRemaining) },
              { key: 'exposure', label: t('Exposure forgone'), align: 'right', render: r => lakh(r.exposure) }
            ]}
            rows={R.barredExcluded}
            pageSize={8}
          />
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function BindingView({ R }) {
  const gaps = R.pools.filter(p => p.officerCount === 0 && p.unworkableCount > 0)

  return (
    <div className="space-y-4">
      {/* A pool with no eligible officer at all is the strongest finding here:
          no amount of scheduling reaches it. */}
      {gaps.length > 0 && (
        <Card
          title={t('Deployment gaps — no eligible officer posted at all')}
          subtitle={t('{0} division-and-case-type pools have caseload but nobody who may lawfully take it. Scheduling cannot reach these; only a posting or a jurisdictional reassignment can.', gaps.length)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gaps.map(p => (
              <div key={p.key} className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5221F]" />
                  <span className="text-[12.5px] font-bold text-navy-900">{p.division}</span>
                </div>
                <Pill tone="red">{p.typeLabel}</Pill>
                <div className="flex items-center justify-between text-[12px] mt-2.5 pt-2 border-t border-red-200/70">
                  <span className="text-steel-600">{t('Cases unreachable')}</span>
                  <span className="font-bold text-navy-900 tabular-nums">{p.unworkableCount}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-steel-600">{t('Value at stake')}</span>
                  <span className="font-bold text-[#C5221F] tabular-nums">{cr(p.unworkableValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title={t('Capacity pools, most oversubscribed first')}
        subtitle={t('Pooled by division and case type, because that is the granularity at which an officer-week can actually be moved. Subscription is demand-days divided by supply-days — above 1.00 the pool cannot clear its caseload however well it is scheduled.')}
      >
        <DataTable
          columns={[
            { key: 'division', label: t('Division') },
            { key: 'typeLabel', label: t('Case type') },
            { key: 'officerCount', label: t('Officers'), align: 'right' },
            { key: 'supplyDays', label: t('Supply (days)'), align: 'right', render: r => r.supplyDays.toFixed(1) },
            { key: 'demandDays', label: t('Demand (days)'), align: 'right', render: r => r.demandDays.toFixed(1) },
            {
              key: 'subscription', label: t('Subscription'), align: 'right',
              render: r => r.subscription == null
                ? <Pill tone="red">{t('no officer')}</Pill>
                : <span className={`font-bold tabular-nums ${r.subscription > 1 ? 'text-[#C5221F]' : 'text-emerald-700'}`}>{r.subscription.toFixed(2)}×</span>
            },
            { key: 'utilisation', label: t('Utilisation'), align: 'right', render: r => r.utilisation == null ? '—' : `${r.utilisation}%` },
            {
              key: 'marginalOfficerWeekValue', label: t('+1 officer-week unlocks'), align: 'right',
              render: r => r.marginalOfficerWeekValue > 0
                ? <span className="font-semibold text-emerald-700 tabular-nums">{cr(r.marginalOfficerWeekValue)}</span>
                : <span className="text-steel-400">—</span>
            }
          ]}
          rows={R.pools}
          pageSize={16}
        />
      </Card>

      <Card
        title={t('Marginal value of the next officer-week')}
        subtitle={t('Computed from the specific cases that would become reachable, best value-per-day first — not from a pool average. This is the figure that answers where the next posting should go.')}
      >
        <div className="space-y-2">
          {R.pools.filter(p => p.marginalOfficerWeekValue > 0).slice(0, 8).map(p => {
            const max = Math.max(...R.pools.map(x => x.marginalOfficerWeekValue), 1)
            return (
              <div key={p.key} className="flex items-center gap-3">
                <div className="w-52 shrink-0 text-[12px] text-navy-800 truncate">
                  {p.division} <span className="text-steel-400">·</span> {p.typeLabel}
                </div>
                <div className="flex-1 h-6 rounded bg-steel-100 overflow-hidden relative">
                  <div className="h-full bg-emerald-500/80" style={{ width: `${(p.marginalOfficerWeekValue / max) * 100}%` }} />
                </div>
                <div className="w-40 shrink-0 text-right text-[12px]">
                  <span className="font-bold text-navy-900 tabular-nums">{cr(p.marginalOfficerWeekValue)}</span>
                  <span className="text-steel-500"> · {t('{0} cases', p.marginalOfficerWeekCases)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Every input is a policy choice, exposed so it can be argued with
          rather than buried in the model. */}
      <Card title={t('Assumptions behind this allocation')} subtitle={t('Policy inputs, not measurements. Each one changes the answer, so each is stated rather than embedded.')}>
        <div className="divide-y divide-steel-100">
          {CAPACITY_ASSUMPTIONS.map(a => (
            <div key={a.id} className="py-2.5 flex items-start gap-3">
              <div className="w-64 shrink-0 text-[12.5px] font-medium text-navy-800">{t(a.label)}</div>
              <div className="w-24 shrink-0 text-[12.5px] font-bold text-navy-900 tabular-nums">{a.value}</div>
              <p className="text-[11.5px] text-steel-600 leading-relaxed flex-1">{a.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('Eligibility rules')} subtitle={t('The hard constraint. Division is territorial and absolute; role determines the case type an officer may take.')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(CASE_TYPES).map(([key, def]) => (
            <div key={key} className="rounded-lg border border-steel-200 bg-white px-3.5 py-3">
              <div className="text-[12.5px] font-bold text-navy-900 mb-1.5">{def.label}</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {def.roles.map(r => <Pill key={r} tone="navy">{r}</Pill>)}
              </div>
              <p className="text-[11.5px] text-steel-600 leading-relaxed">{def.note}</p>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-steel-500 leading-relaxed mt-3">
          {t('An officer-week is {0} case-days after non-case work is removed. A case needing more than that is indivisible and cannot be placed inside a one-week horizon at all, however many officers are added.', NET_DAYS_PER_OFFICER)}
        </p>
      </Card>
    </div>
  )
}
