import { useMemo, useState } from 'react'
import {
  Timer, TrendingDown, Banknote, AlertOctagon, ArrowUpRight, ArrowRight, ShieldCheck
} from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { RecoveryCurveChart } from '../components/ui/Charts.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS, taxpayerById } from '../data/mockData.js'
import {
  RECOVERY_CASES, RECOVERY_BANDS, RECOVERY_PORTFOLIO, QUEUE_COMPARISON,
  OFFICER_YIELD, CHAIN_EXPOSURE, CHAIN_SUMMARY, REGISTRATION_SCREEN, REGISTRATION_SUMMARY,
  REGISTRATION_INDICATORS, LAG_ROOT_CAUSES, RECOVERY_MODEL_NOTE, recoverabilityFor
} from '../data/recovery.js'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)}L`
const crore = n => `₹${(n / 10000000).toFixed(2)} Cr`

const BAND_TONE = { '0-30': 'green', '31-90': 'green', '91-180': 'amber', '181-365': 'orange', '365+': 'red' }

// The curve is sampled at these points; the bars show where exposure actually
// sits, which is the whole argument of the page.
const CURVE_SAMPLES = [0, 30, 60, 90, 120, 180, 270, 365, 540, 730]

export default function RevenueRecoveryWindow() {
  const { filters, setDrilldownTaxpayer, drilldownTaxpayer } = useApp()
  const [queueMode, setQueueMode] = useState('decay')

  // Scope every figure to the header filters, the way the rest of the platform does.
  const scopedIds = useMemo(() => {
    const ids = new Set(TAXPAYERS.filter(tp => applyGlobalFilters(tp, filters)).map(tp => tp.id))
    return ids
  }, [filters])

  const cases = useMemo(() => RECOVERY_CASES.filter(c => scopedIds.has(c.id)), [scopedIds])
  const isFiltered = cases.length !== RECOVERY_CASES.length

  const portfolio = useMemo(() => {
    if (!isFiltered) return RECOVERY_PORTFOLIO
    const sum = f => cases.reduce((s, c) => s + f(c), 0)
    const lags = cases.map(c => c.daysSinceSignal).sort((a, b) => a - b)
    const exposure = sum(c => c.exposure)
    return {
      caseCount: cases.length,
      exposureCr: Math.round(exposure / 10000000),
      recoverableNowCr: Math.round(sum(c => c.recoverableNow) / 10000000),
      lostToLagCr: Math.round(sum(c => c.lostToLag) / 10000000),
      decayNextWeekCr: Math.round((sum(c => c.decayNextWeek) / 10000000) * 100) / 100,
      medianLagDays: lags.length ? lags[Math.floor(lags.length / 2)] : 0,
      pastBlockablePct: exposure
        ? Math.round((cases.filter(c => c.daysSinceSignal > 90).reduce((s, c) => s + c.exposure, 0) / exposure) * 100)
        : 0,
      fastestPossibleDetectionDays: RECOVERY_PORTFOLIO.fastestPossibleDetectionDays
    }
  }, [cases, isFiltered])

  const curveData = useMemo(() => CURVE_SAMPLES.map((day, i) => {
    const next = CURVE_SAMPLES[i + 1] ?? Infinity
    const inWindow = cases.filter(c => c.daysSinceSignal >= day && c.daysSinceSignal < next)
    return {
      label: day >= 730 ? '730+' : `${day}d`,
      day,
      recoverabilityPct: Math.round(recoverabilityFor(day) * 100),
      exposureCr: Math.round((inWindow.reduce((s, c) => s + c.exposure, 0) / 10000000) * 10) / 10
    }
  }), [cases])

  const bandRows = useMemo(() => RECOVERY_BANDS.map(b => {
    const inBand = cases.filter(c => c.bandId === b.id)
    const exposure = inBand.reduce((s, c) => s + c.exposure, 0)
    const recoverable = inBand.reduce((s, c) => s + c.recoverableNow, 0)
    return { ...b, caseCount: inBand.length, exposure, recoverable, lost: exposure - recoverable }
  }), [cases])

  const queue = useMemo(() => {
    const scoped = QUEUE_COMPARISON.filter(c => scopedIds.has(c.id))
    return queueMode === 'decay'
      ? [...scoped].sort((a, b) => b.decayNextWeek - a.decayNextWeek)
      : [...scoped].sort((a, b) => b.riskScore - a.riskScore)
  }, [scopedIds, queueMode])

  // The cases a score-ordered queue leaves behind — the operational payoff.
  const strandedByScore = useMemo(
    () => QUEUE_COMPARISON.filter(c => scopedIds.has(c.id) && c.queueDelta > 20).slice(0, 6),
    [scopedIds]
  )

  const queueColumns = [
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
      key: 'leadRule',
      label: t('Lead Signal'),
      sortValue: r => r.leadRule?.label || '',
      render: r => <span className="text-[11px] text-steel-600">{r.leadRule ? t(r.leadRule.label) : '—'}</span>
    },
    {
      key: 'daysSinceSignal',
      label: t('Signal Age'),
      align: 'right',
      render: r => (
        <div className="text-right">
          <div className="font-semibold tabular-nums text-navy-800">{r.daysSinceSignal}d</div>
          <div className="text-[10.5px] text-steel-500">{Math.round(r.recoverability * 100)}% {t('recoverable')}</div>
        </div>
      )
    },
    {
      key: 'riskScore',
      label: t('Risk'),
      align: 'right',
      sortValue: r => r.riskScore,
      render: r => <RiskBadge category={r.riskCategory} score={r.riskScore} size="sm" />
    },
    {
      key: 'recoverableNow',
      label: t('Recoverable Now'),
      align: 'right',
      sortValue: r => r.recoverableNow,
      render: r => <span className="font-semibold tabular-nums text-navy-800">{lakh(r.recoverableNow)}</span>
    },
    {
      key: 'decayNextWeek',
      label: t('Lost If Untouched 7d'),
      align: 'right',
      sortValue: r => r.decayNextWeek,
      render: r => <span className="font-bold tabular-nums text-maharisk-critical">−{lakh(r.decayNextWeek)}</span>
    }
  ]

  const yieldDelta = OFFICER_YIELD.byDecayAdjusted.recoveredCr - OFFICER_YIELD.byRiskScore.recoveredCr

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Root Cause')}
        title={t('Revenue Recovery Window')}
        description={t('Every flagged rupee has a recovery half-life. This page measures the platform against the one variable that decides how much of it survives — the time between a signal firing and an officer acting on it.')}
        actions={<ExportBar moduleLabel="Revenue Recovery Window" />}
      />

      {/* The thesis, stated once, in the department's own numbers. */}
      <div className="mb-6 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('The Root Cause')}</div>
        <h2 className="text-lg sm:text-xl font-bold text-navy-900 max-w-4xl leading-snug">
          {t('Detection is not the constraint. Time-to-action is.')}
        </h2>
        <p className="text-sm text-steel-600 mt-2 max-w-4xl leading-relaxed">
          {t('The department already produces the signals. By the time a case is worked, the credit has moved downstream, been utilised, and the entity has often stopped trading. Of ₹{0} Cr currently flagged, ₹{1} Cr is still realistically recoverable — the remaining ₹{2} Cr has decayed while the case waited.',
            portfolio.exposureCr, portfolio.recoverableNowCr, portfolio.lostToLagCr)}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          <Pill tone="red">{t('Median signal age: {0} days', portfolio.medianLagDays)}</Pill>
          <Pill tone="amber">{t('{0}% of exposure past the blockable window', portfolio.pastBlockablePct)}</Pill>
          <Pill tone="navy">{t('Fastest any signal can fire: {0} days', portfolio.fastestPossibleDetectionDays)}</Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Flagged Exposure')} value={portfolio.exposureCr.toLocaleString('en-IN')} unit={t('₹ Cr')} icon={AlertOctagon} tone="steel" />
        <KpiCard label={t('Recoverable Today')} value={portfolio.recoverableNowCr.toLocaleString('en-IN')} unit={t('₹ Cr')} icon={Banknote} tone="green" />
        <KpiCard label={t('Already Lost To Lag')} value={portfolio.lostToLagCr.toLocaleString('en-IN')} unit={t('₹ Cr')} icon={TrendingDown} tone="red" />
        <KpiCard label={t('Cost Of One More Week')} value={portfolio.decayNextWeekCr.toFixed(2)} unit={t('₹ Cr')} icon={Timer} tone="orange" />
      </div>

      <Card
        className="mb-6"
        title={t('The Recovery Curve')}
        subtitle={t('Recoverability falls with signal age (line). Bars show where the department’s exposure is actually sitting.')}
      >
        <RecoveryCurveChart data={curveData} />
        {curveData[0]?.exposureCr === 0 && (
          <div className="mt-3 rounded-lg border border-saffron-300 bg-saffron-50 px-3 py-2.5 text-[12px] leading-relaxed text-saffron-900">
            <strong>{t('The first band is empty, and that is the finding.')}</strong>{' '}
            {t('No case sits in the 0–30 day window because no signal in the current rule set can fire that fast — every one of them waits on a return being filed. The floor is {0} days before an officer can see anything at all. That is not a backlog problem; it is a design property of return-cycle-bound detection.',
              portfolio.fastestPossibleDetectionDays)}
          </div>
        )}
      </Card>

      <Card
        className="mb-6"
        title={t('Where The Exposure Sits')}
        subtitle={t('Each band states why recovery falls off across it — the percentages are a calibration of that reasoning, not a measurement.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {bandRows.map(b => (
            <div key={b.id} className="px-5 py-3.5 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="lg:w-52 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-navy-900">{t(b.label)}</span>
                  <Pill tone={BAND_TONE[b.id]}>{t(b.stance)}</Pill>
                </div>
                <div className="text-[11px] text-steel-500 mt-0.5 tabular-nums">
                  {t('{0} cases · {1}% recoverable', b.caseCount, Math.round(b.recoverability * 100))}
                </div>
              </div>
              <p className="flex-1 text-[12px] text-steel-600 leading-relaxed">{t(b.reason)}</p>
              <div className="lg:w-56 shrink-0 grid grid-cols-2 gap-2 text-right">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-steel-400 font-semibold">{t('Exposure')}</div>
                  <div className="text-sm font-bold tabular-nums text-navy-800">{crore(b.exposure)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-steel-400 font-semibold">{t('Recoverable')}</div>
                  <div className="text-sm font-bold tabular-nums text-maharisk-low">{crore(b.recoverable)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ---- The operational payoff: same officers, different ordering ---- */}
      <Card
        className="mb-6"
        title={t('Ordering — what the same week buys')}
        subtitle={t('A like-for-like comparison of two orderings over one week of work — the only variable changed is the order cases are worked in. Establishment and eligibility are modelled properly in Officer Capacity & Deployment; this screen isolates the effect of ordering alone and should not be read as a capacity plan.')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <YieldPanel
            title={t('Ranked by risk score')}
            subtitle={t('What the platform did before')}
            data={OFFICER_YIELD.byRiskScore}
            tone="steel"
          />
          <YieldPanel
            title={t('Ranked by value at risk this week')}
            subtitle={t('Decay-adjusted ordering')}
            data={OFFICER_YIELD.byDecayAdjusted}
            tone="green"
            highlight
          />
        </div>
        <p className="mt-4 text-[12px] text-steel-600 leading-relaxed">
          {t('Same headcount, same hours, ₹{0} Cr difference in what is recovered — because a score-ordered queue keeps sending officers to high-score cases whose value has already gone flat, while steeply-decaying ones age past the window. Risk score answers "how wrong is this?". It does not answer "what is still left to save?".', yieldDelta)}
        </p>
        <HumanReviewBadge label={t('Queue ordering is advisory — case allocation remains an officer decision')} />
      </Card>

      {strandedByScore.length > 0 && (
        <Card
          className="mb-6"
          title={t('Cases A Score-Ranked Queue Leaves Behind')}
          subtitle={t('Largest positions gained when the queue is re-ordered by value at risk')}
          padded={false}
        >
          <div className="divide-y divide-steel-100">
            {strandedByScore.map(c => (
              <button
                key={c.id}
                onClick={() => setDrilldownTaxpayer(taxpayerById(c.id))}
                className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-steel-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy-900 truncate">{c.tradeName}</div>
                  <div className="text-[11px] text-steel-500">{c.gstin} · {c.daysSinceSignal}d {t('old')} · {t('risk')} {c.riskScore}</div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-steel-500 shrink-0 tabular-nums">
                  <span>#{c.scoreRank}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-maharisk-low">#{c.decayRank}</span>
                </div>
                <div className="w-24 text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-wider text-steel-400 font-semibold">{t('Decays/wk')}</div>
                  <div className="text-sm font-bold tabular-nums text-maharisk-critical">−{lakh(c.decayNextWeek)}</div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-steel-400 shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card
        className="mb-6"
        title={t('Case Queue')}
        subtitle={isFiltered ? t('Respects the header filters — {0} of {1} cases', cases.length, RECOVERY_CASES.length) : t('All {0} flagged cases in the recovery window', cases.length)}
        actions={
          <div className="flex items-center gap-0.5 rounded-lg border border-steel-200 bg-steel-50 p-0.5">
            {[['decay', t('By value at risk')], ['score', t('By risk score')]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setQueueMode(id)}
                aria-pressed={queueMode === id}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  queueMode === id ? 'bg-white text-navy-800 shadow-xs ring-1 ring-navy-200' : 'text-steel-500 hover:text-navy-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          columns={queueColumns}
          rows={queue}
          searchPlaceholder={t('Search the recovery queue...')}
          onRowClick={r => setDrilldownTaxpayer(taxpayerById(r.id))}
        />
      </Card>

      {/* ---- Why the curve falls: the chain keeps moving while the case waits ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card
          title={t('Why The Curve Falls — Chain Propagation')}
          subtitle={t('Exposure is never one taxpayer. Credit moves downstream and is utilised hop by hop; once utilised it can no longer be blocked, only recovered.')}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniFigure label={t('Total chain flow')} value={`₹${CHAIN_SUMMARY.totalFlowCr} Cr`} tone="navy" />
            <MiniFigure label={t('Already utilised')} value={`₹${CHAIN_SUMMARY.utilisedCr} Cr`} tone="red" />
            <MiniFigure label={t('Still blockable')} value={`₹${CHAIN_SUMMARY.blockableCr} Cr`} tone="green" />
          </div>
          <div className="space-y-2.5">
            {CHAIN_EXPOSURE.map(c => (
              <div key={c.id} className="rounded-lg border border-steel-200 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-navy-800">{c.id}</span>
                  <span className="text-[11px] text-steel-500 tabular-nums">
                    {t('{0} entities · {1}d old · {2} hop(s) reached', c.entityCount, c.ageDays, c.hopsReached)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-steel-100 overflow-hidden flex">
                  <div className="h-full bg-maharisk-critical" style={{ width: `${100 - c.blockablePct}%` }} />
                  <div className="h-full bg-maharisk-low" style={{ width: `${c.blockablePct}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[10.5px] text-steel-500 tabular-nums">
                  <span>{t('utilised')} {100 - c.blockablePct}%</span>
                  <span>{t('blockable')} {c.blockablePct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title={t('The Left Edge — Registration Screening')}
          subtitle={t('The cheapest point on the curve. These indicators are checkable on the day of application rather than reconstructed from invoice flow a year later.')}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniFigure label={t('New registrations')} value={REGISTRATION_SUMMARY.newRegistrations} tone="navy" />
            <MiniFigure label={t('2+ indicators')} value={REGISTRATION_SUMMARY.withTwoOrMore} tone="orange" />
            <MiniFigure label={t('Exposure at stake')} value={`₹${REGISTRATION_SUMMARY.exposureAtStakeCr} Cr`} tone="red" />
          </div>
          <div className="space-y-1.5 mb-4">
            {REGISTRATION_INDICATORS.map(ind => (
              <div key={ind.id} className="flex items-start gap-2 text-[11.5px]">
                <ShieldCheck className="w-3.5 h-3.5 text-govt-600 shrink-0 mt-0.5" />
                <span className="flex-1 text-steel-600">{t(ind.label)}</span>
                <Pill tone={ind.checkableAt === 'Registration' ? 'green' : 'amber'}>{t(ind.checkableAt)}</Pill>
              </div>
            ))}
          </div>
          <div className="border-t border-steel-100 pt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-steel-400 mb-2">{t('Highest-indicator registrations')}</div>
            <div className="space-y-1.5">
              {REGISTRATION_SCREEN.filter(r => r.flagCount >= 2).slice(0, 5).map(r => (
                <button
                  key={r.id}
                  onClick={() => setDrilldownTaxpayer(taxpayerById(r.id))}
                  className="w-full flex items-center gap-2 text-left rounded-md px-2 py-1.5 hover:bg-steel-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-navy-800 truncate">{r.tradeName}</div>
                    <div className="text-[10.5px] text-steel-500">{t('Registered')} {r.registrationDate}</div>
                  </div>
                  <Pill tone="red">{t('{0} indicators', r.flagCount)}</Pill>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card
        title={t('Why The Lag Exists')}
        subtitle={t('Each of these is structural — a property of how the return cycle and the case workflow are built, not a failure of effort or of detection.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {LAG_ROOT_CAUSES.map((rc, i) => (
            <div key={rc.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-bold text-govt-600 tabular-nums shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-navy-900">{t(rc.cause)}</h3>
                  <p className="text-[12px] text-steel-600 mt-1 leading-relaxed">{t(rc.why)}</p>
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-maharisk-critical mb-0.5">{t('Consequence')}</div>
                      <div className="text-[11.5px] text-steel-700 leading-relaxed">{t(rc.consequence)}</div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-maharisk-low mb-0.5">{t('What changes it')}</div>
                      <div className="text-[11.5px] text-steel-700 leading-relaxed">{t(rc.intervention)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {drilldownTaxpayer && (
        <TaxpayerDrilldownModal taxpayer={drilldownTaxpayer} onClose={() => setDrilldownTaxpayer(null)} />
      )}
    </div>
  )
}

function YieldPanel({ title, subtitle, data, tone, highlight = false }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-emerald-300 bg-emerald-50' : 'border-steel-200 bg-steel-50'}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="text-sm font-bold text-navy-900">{title}</h3>
        {highlight && <Pill tone="green">{t('Proposed')}</Pill>}
      </div>
      <div className="text-[11px] text-steel-500 mb-3">{subtitle}</div>
      <div className="grid grid-cols-2 gap-3">
        <MiniFigure label={t('Recovered')} value={`₹${data.recoveredCr} Cr`} tone={tone} />
        <MiniFigure label={t('Per officer-day')} value={`₹${data.perOfficerDayLakh}L`} tone={tone} />
        <MiniFigure label={t('Loss avoided')} value={`₹${data.lossAvoidedLakh}L`} tone="green" />
        <MiniFigure label={t('Forfeited to lag')} value={`₹${data.forfeitedLakh}L`} tone="red" />
      </div>
    </div>
  )
}

function MiniFigure({ label, value, tone = 'navy' }) {
  const color = {
    navy: 'text-navy-800', green: 'text-maharisk-low', red: 'text-maharisk-critical',
    orange: 'text-maharisk-high', steel: 'text-steel-700'
  }[tone] || 'text-navy-800'
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-steel-400">{label}</div>
      <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  )
}
