import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { WhyFlaggedPanel } from '../components/ui/WhyFlagged.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { REFUND_CASES, REFUND_BENCHMARK_BANDS, SECTOR_REVENUE, taxpayerById, REFERENCE_DATE } from '../data/mockData.js'
import { generateRefundChecklist } from '../data/ai.js'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { IndianRupee, ShieldAlert, Percent, Scale, Sparkles, User2, ShieldCheck, UserCheck, Globe, CheckCircle2, Info } from 'lucide-react'

const STATUS_TONE = {
  'Low Risk': 'green',
  'Needs Officer Review': 'amber',
  'Escalate for Scrutiny': 'red'
}

/* The encoded rule for refund intensity — RISK_RULES.refund_ratio — fires where
 * the refund-to-turnover ratio exceeds twice the sector benchmark. The same
 * multiple is used here so this screen and the risk score cannot disagree about
 * what "above the band" means. */
const BAND_MULTIPLE = 2

const DAY_MS = 1000 * 60 * 60 * 24
const pctOf = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0)
const benchmarkFor = sector => SECTOR_REVENUE.find(s => s.sector === sector)
const benchmarkPctFor = sector => {
  const bench = benchmarkFor(sector)
  return bench ? Math.round(bench.avgRefundRatio * 1000) / 10 : null
}
const timesBenchmark = c => {
  const bench = benchmarkPctFor(c.sector)
  return bench && bench > 0 ? Math.round((c.refundToTurnoverPct / bench) * 100) / 100 : null
}
const daysPending = c => Math.max(0, Math.floor((REFERENCE_DATE - new Date(c.filedOn)) / DAY_MS))

// Delegates to the shared case filter so this module cannot drift out of
// step with the others again — division in particular was missing here.
const matchesGlobalFilters = (rec, filters) => applyCaseFilters(rec, filters, 'filedOn')

/* Bands are relative to the claimant's own sector, not absolute. An absolute
 * band is meaningless across this population: the benchmark refund ratio runs
 * from 1% in professional services to 21% in import/export, so a flat "15–20%"
 * bucket mixes an ordinary exporter with an extreme restaurant claim. */
const BAND_ORDER = REFUND_BENCHMARK_BANDS
function bandFor(c) {
  const times = timesBenchmark(c)
  if (times == null) return BAND_ORDER[4]
  if (times < 1) return BAND_ORDER[0]
  if (times < BAND_MULTIPLE) return BAND_ORDER[1]
  if (times < 3) return BAND_ORDER[2]
  return BAND_ORDER[3]
}

export default function RefundRiskIntelligence() {
  const { filters, role, officerName, logAction } = useApp()
  const [statusOverrides, setStatusOverrides] = useState({})
  const [reviewCase, setReviewCase] = useState(null)
  const [checklistOutput, setChecklistOutput] = useState(null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(false)

  const effectiveStatus = c => statusOverrides[c.id] || c.status

  // Case-level RBAC: a Refund Officer is scoped to cases assigned to them by default.
  const isFieldOfficer = role === 'Refund Officer'
  const [showAllCases, setShowAllCases] = useState(false)
  const scopedToMe = isFieldOfficer && !showAllCases

  const filteredCases = useMemo(() => {
    const base = scopedToMe ? REFUND_CASES.filter(c => c.assignedOfficer === officerName) : REFUND_CASES
    return base.filter(c => matchesGlobalFilters(c, filters))
  }, [filters, scopedToMe, officerName])

  /* What is actually at stake before sanction, and where officer time returns
   * most. A total claimed value on its own is a measure of how much refund
   * activity there is, which decides nothing. */
  const kpis = useMemo(() => {
    const totalClaimed = filteredCases.reduce((s, c) => s + c.claimedAmount, 0)
    const undecided = filteredCases.filter(c => effectiveStatus(c) !== 'Low Risk')
    const undecidedValue = undecided.reduce((s, c) => s + c.claimedAmount, 0)
    const highRisk = filteredCases.filter(c => c.riskCategory === 'High' || c.riskCategory === 'Critical')
    const highRiskValue = highRisk.reduce((s, c) => s + c.claimedAmount, 0)
    const avgRatio = filteredCases.length
      ? filteredCases.reduce((s, c) => s + c.refundToTurnoverPct, 0) / filteredCases.length
      : 0
    const avgBenchmark = filteredCases.length
      ? filteredCases.reduce((s, c) => s + (benchmarkPctFor(c.sector) ?? 0), 0) / filteredCases.length
      : 0
    const aboveBand = filteredCases.filter(c => {
      const times = timesBenchmark(c)
      return times != null && times >= BAND_MULTIPLE
    })
    const ages = filteredCases.map(daysPending).sort((a, b) => a - b)
    return {
      totalClaimedLakh: totalClaimed / 100000,
      undecidedCount: undecided.length,
      undecidedLakh: undecidedValue / 100000,
      undecidedSharePct: pctOf(undecidedValue, totalClaimed),
      highRiskCount: highRisk.length,
      highRiskRatePct: pctOf(highRisk.length, filteredCases.length),
      highRiskValueSharePct: pctOf(highRiskValue, totalClaimed),
      avgRatio,
      avgBenchmark: Math.round(avgBenchmark * 10) / 10,
      gapPp: Math.round((avgRatio - avgBenchmark) * 10) / 10,
      aboveBandCount: aboveBand.length,
      aboveBandLakh: aboveBand.reduce((s, c) => s + c.claimedAmount, 0) / 100000,
      aboveBandRatePct: pctOf(aboveBand.length, filteredCases.length),
      medianDaysPending: ages.length ? (ages.length % 2 ? ages[Math.floor(ages.length / 2)] : Math.round((ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2)) : 0,
      oldestDaysPending: ages.length ? ages[ages.length - 1] : 0
    }
  }, [filteredCases, statusOverrides])

  /* Sector view against the sector's own benchmark. The previous chart plotted
   * total claimed value per sector, which ranked sectors by how much refund
   * they legitimately generate and told an officer nothing about risk. */
  const sectorAnalysis = useMemo(() => {
    const map = new Map()
    filteredCases.forEach(c => {
      const entry = map.get(c.sector) || { id: c.sector, sector: c.sector, claims: 0, claimedLakh: 0, ratioSum: 0, aboveBand: 0 }
      entry.claims += 1
      entry.claimedLakh += c.claimedAmount / 100000
      entry.ratioSum += c.refundToTurnoverPct
      const times = timesBenchmark(c)
      if (times != null && times >= BAND_MULTIPLE) entry.aboveBand += 1
      map.set(c.sector, entry)
    })
    return [...map.values()]
      .map(e => {
        const actual = Math.round((e.ratioSum / e.claims) * 10) / 10
        const bench = benchmarkPctFor(e.sector)
        return {
          ...e,
          claimedLakh: Math.round(e.claimedLakh * 10) / 10,
          actualPct: actual,
          benchmarkPct: bench,
          gapPp: bench == null ? 0 : Math.round((actual - bench) * 10) / 10,
          times: bench && bench > 0 ? Math.round((actual / bench) * 100) / 100 : null
        }
      })
      .sort((a, b) => b.gapPp - a.gapPp)
  }, [filteredCases])

  const bandDistribution = useMemo(() => {
    const map = new Map(BAND_ORDER.map(k => [k, { band: k, count: 0, claimedLakh: 0 }]))
    filteredCases.forEach(c => {
      const entry = map.get(bandFor(c))
      entry.count += 1
      entry.claimedLakh += c.claimedAmount / 100000
    })
    return BAND_ORDER
      .map(k => ({ ...map.get(k), claimedLakh: Math.round(map.get(k).claimedLakh * 10) / 10 }))
      .filter(row => row.count > 0)
  }, [filteredCases])

  const openReview = c => {
    setReviewCase(c)
    setChecklistOutput(null)
    setPendingStatus(null)
    setConfirmStatus(false)
  }

  const setStatus = (caseId, status) => {
    setStatusOverrides(prev => ({ ...prev, [caseId]: status }))
  }

  const applyPendingStatus = () => {
    if (!reviewCase || !pendingStatus || !confirmStatus) return
    setStatus(reviewCase.id, pendingStatus)
    logAction(`Updated Refund Status → ${pendingStatus}`, 'Refund Risk Intelligence', reviewCase.gstin)
    setPendingStatus(null)
    setConfirmStatus(false)
  }

  const columns = [
    {
      key: 'trade',
      label: t('GSTIN / Trade Name'),
      sortValue: r => r.tradeName,
      render: r => (
        <div>
          <div className="font-semibold text-navy-900">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.id} · {r.gstin}</div>
        </div>
      )
    },
    { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
    { key: 'claimedAmount', label: t('Claimed'), align: 'right', render: r => `₹${(r.claimedAmount / 100000).toFixed(1)} L` },
    {
      key: 'refundToTurnoverPct',
      label: t('Refund / turnover vs sector benchmark'),
      align: 'right',
      sortValue: r => timesBenchmark(r) ?? 0,
      render: r => {
        const bench = benchmarkPctFor(r.sector)
        const times = timesBenchmark(r)
        return (
          <div className="tabular-nums">
            <div className={times != null && times >= BAND_MULTIPLE ? 'font-semibold text-[#C5221F]' : 'text-navy-900'}>
              {t('{0}%', r.refundToTurnoverPct.toFixed(1))}
            </div>
            <div className="text-[11px] text-steel-500">
              {bench == null
                ? t('no sector benchmark on record')
                : t('benchmark {0}% · {1}× it', bench, times)}
            </div>
          </div>
        )
      }
    },
    {
      key: 'daysPending',
      label: t('Days since filing'),
      align: 'right',
      sortValue: r => daysPending(r),
      render: r => <span className="tabular-nums text-steel-700">{t('{0} days', daysPending(r))}</span>
    },
    {
      key: 'filingStatus',
      label: t('Claimant filing behaviour'),
      sortValue: r => taxpayerById(r.taxpayerId)?.filingStatus || '',
      render: r => {
        const tp = taxpayerById(r.taxpayerId)
        if (!tp) return <span className="text-[11px] text-steel-400">{t('not on record')}</span>
        return <Pill tone={tp.filingStatus === 'Non-Filer' ? 'red' : tp.filingStatus === 'Late Filer' ? 'amber' : 'green'}>{t(tp.filingStatus)}</Pill>
      }
    },
    {
      key: 'exportLinked',
      label: t('Export Linked?'),
      align: 'center',
      sortValue: r => (r.exportLinked ? 1 : 0),
      render: r => r.exportLinked ? <Pill tone="navy">{t('Export-Linked')}</Pill> : <Pill tone="steel">{t('Domestic')}</Pill>
    },
    {
      key: 'riskScore',
      label: t('Risk'),
      sortValue: r => r.riskScore,
      render: r => <RiskBadge category={r.riskCategory} score={r.riskScore} />
    },
    {
      key: 'status',
      label: t('Status'),
      sortValue: r => effectiveStatus(r),
      render: r => <Pill tone={STATUS_TONE[effectiveStatus(r)] || 'steel'}>{t(effectiveStatus(r))}</Pill>
    },
    { key: 'assignedOfficer', label: t('Assigned Officer') },
    {
      key: 'action',
      label: t('Action'),
      sortable: false,
      align: 'center',
      render: r => (
        <button
          onClick={() => openReview(r)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-ink-700 text-white hover:bg-ink-800"
        >
          {t('Review')}
        </button>
      )
    }
  ]

  const reviewTaxpayer = reviewCase ? taxpayerById(reviewCase.taxpayerId) : null
  const reviewBenchmark = reviewCase ? benchmarkPctFor(reviewCase.sector) : null
  const reviewTimes = reviewCase ? timesBenchmark(reviewCase) : null

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Refund Scrutiny')}
        title={t('Refund Risk Intelligence')}
        description={<MethodNote short={t('Refund intensity against the claimant\'s own sector, not as a flat percentage.')} full={t('Refund claims ranked by risk before sanction. Refund intensity is read against the benchmark for the claimant’s own sector rather than as an absolute percentage — a 15% refund ratio is ordinary in import/export and extreme in professional services.')} />}
        actions={<ExportBar moduleLabel="Refund Risk Intelligence" />}
      />

      <FilterScope shown={filteredCases.length} total={REFUND_CASES.length} unit={t('refund claims')}
        ignores={{
          taxpayerType: 'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.'
        }}
      />

      {isFieldOfficer && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/60">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800">
            {scopedToMe ? <UserCheck className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {/* Same correction as the Audit module: these counts describe the
                filtered register below, not the raw dataset. */}
            {scopedToMe
              ? <>{t('Showing cases assigned to you —')} <strong>{officerName}</strong> {t('({0} of your {1} cases match the current filters)', filteredCases.length, REFUND_CASES.filter(c => c.assignedOfficer === officerName).length)}</>
              : <>{t('Your role can access every refund case — showing {0} of {1} that match the current filters', filteredCases.length, REFUND_CASES.length)}</>}
          </span>
          <button
            onClick={() => setShowAllCases(v => !v)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-navy-300 text-navy-700 bg-white hover:bg-navy-50"
          >
            {scopedToMe ? t('View all statewide cases') : t('Back to my assigned cases')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Value awaiting a decision')}
          value={kpis.undecidedLakh.toFixed(1)}
          unit={t('₹ Lakh across {0} claims — {1}% of the ₹{2} L claimed in scope', kpis.undecidedCount, kpis.undecidedSharePct, kpis.totalClaimedLakh.toFixed(1))}
          tone="navy"
          icon={IndianRupee}
        />
        <KpiCard
          label={t('High-risk claims')}
          value={kpis.highRiskCount}
          unit={t('of {0} claims ({1}%), holding {2}% of the claimed value', filteredCases.length, kpis.highRiskRatePct, kpis.highRiskValueSharePct)}
          tone="red"
          icon={ShieldAlert}
        />
        <KpiCard
          label={t('Refund-to-turnover against sector benchmark')}
          value={`${kpis.avgRatio.toFixed(1)}%`}
          unit={kpis.gapPp >= 0
            ? t('against a {0}% benchmark for this mix of sectors — {1} pp above', kpis.avgBenchmark, Math.abs(kpis.gapPp))
            : t('against a {0}% benchmark for this mix of sectors — {1} pp below', kpis.avgBenchmark, Math.abs(kpis.gapPp))}
          tone="saffron"
          icon={Percent}
        />
        <KpiCard
          label={t('Claims above the sector band')}
          value={kpis.aboveBandCount}
          unit={t('at {0}× benchmark or more — {1}% of claims, ₹{2} L; this is the threshold the encoded refund rule uses', BAND_MULTIPLE, kpis.aboveBandRatePct, kpis.aboveBandLakh.toFixed(1))}
          tone="orange"
          icon={Scale}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card
          title={t('Refund intensity by sector, against that sector’s benchmark')}
          subtitle={<MethodNote short={t('A positive gap on few claims is variance — read the claim count with it.')} full={t('Bar height is the gap in percentage points between the ratio claimed and the sector benchmark. A positive gap on a sector carrying few claims is variance, not a finding — read the claim count alongside it.')} />}
        >
          {sectorAnalysis.length > 0 ? (
            <>
              <RiskBarChart
                data={sectorAnalysis}
                xKey="sector"
                barKey="gapPp"
                colorFn={d => (d.aboveBand > 0 ? '#c41e3a' : d.gapPp > 0 ? '#d9631c' : '#204575')}
              />
              <div className="mt-4">
                <DataTable
                  columns={[
                    { key: 'sector', label: t('Sector'), render: row => t(row.sector) },
                    { key: 'claims', label: t('Claims'), align: 'right', sortValue: row => row.claims },
                    { key: 'claimedLakh', label: t('Claimed'), align: 'right', sortValue: row => row.claimedLakh, render: row => t('₹{0} L', row.claimedLakh.toFixed(1)) },
                    { key: 'actualPct', label: t('Refund / turnover'), align: 'right', sortValue: row => row.actualPct, render: row => t('{0}%', row.actualPct) },
                    { key: 'benchmarkPct', label: t('Sector benchmark'), align: 'right', sortValue: row => row.benchmarkPct ?? 0, render: row => row.benchmarkPct == null ? '—' : t('{0}%', row.benchmarkPct) },
                    {
                      key: 'times', label: t('Multiple of benchmark'), align: 'right',
                      sortValue: row => row.times ?? 0,
                      render: row => row.times == null
                        ? <span className="text-steel-400">—</span>
                        : <span className={`tabular-nums font-semibold ${row.times >= BAND_MULTIPLE ? 'text-[#C5221F]' : 'text-steel-600'}`}>{t('{0}×', row.times)}</span>
                    },
                    { key: 'aboveBand', label: t('Claims above band'), align: 'right', sortValue: row => row.aboveBand }
                  ]}
                  rows={sectorAnalysis}
                  searchable={false}
                  pageSize={8}
                />
              </div>
            </>
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No refund cases match the current filters.')}</div>
          )}
        </Card>
        <Card
          title={t('Claims by multiple of the sector benchmark')}
          subtitle={<MethodNote short={t('Bands are relative to each sector, which runs from 1% to 21%.')} full={t('Bands are relative to the claimant’s own sector, not absolute. The benchmark refund ratio runs from 1% to 21% across these sectors, so a flat percentage band would put an ordinary exporter and an extreme domestic claim in the same bucket.')} />}
        >
          {bandDistribution.length > 0 ? (
            <>
              <RiskBarChart
                data={bandDistribution}
                xKey="band"
                barKey="count"
                colorFn={d => (d.band === BAND_ORDER[3] ? '#c41e3a' : d.band === BAND_ORDER[2] ? '#d9631c' : d.band === BAND_ORDER[4] ? '#697289' : '#204575')}
              />
              <div className="mt-3 space-y-1.5">
                {bandDistribution.map(row => (
                  <div key={row.band} className="flex items-center justify-between text-[11.5px] text-steel-700">
                    <span>{t(row.band)}</span>
                    <span className="tabular-nums">{t('{0} claims · ₹{1} L · {2}% of claims in scope', row.count, row.claimedLakh.toFixed(1), pctOf(row.count, filteredCases.length))}</span>
                  </div>
                ))}
              </div>
              <MethodNote className="text-[11.5px] text-steel-500 leading-relaxed mt-3" short={t('Already counted in the Risk column — not a second, independent signal.')} full={t('At {0}× and above, the encoded refund rule fires and contributes to the taxpayer’s risk score — so those claims are already reflected in the Risk column of the register and should not be counted as a second, independent signal.', BAND_MULTIPLE)} />
            </>
          ) : (
            <div className="text-xs text-steel-500 py-10 text-center">{t('No refund cases match the current filters.')}</div>
          )}
        </Card>
      </div>

      <Card
        title={t('Refund Case Register')}
        subtitle={t('{0} claims in scope. Median claim has been pending {1} days since filing; the oldest, {2} days.', filteredCases.length, kpis.medianDaysPending, kpis.oldestDaysPending)}
        actions={<HumanReviewBadge label={t('Officer Review Required')} />}
      >
        <DataTable
          columns={columns}
          rows={filteredCases}
          searchPlaceholder={t('Search by GSTIN or trade name...')}
          emptyLabel={t('No refund cases match the current filters.')}
        />
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
            <MethodNote className="text-[12px] text-steel-700 leading-relaxed" short={t('No statutory refund clock is encoded, so nothing here is overdue.')} full={t('Days since filing is stated without a deadline against it. This platform does not encode the statutory refund timeline — the limitation engine covers assessment proceedings under sections 73, 74 and 74A only — so no claim here is described as overdue, and the ageing column is a workload signal rather than a statutory one.')} />
          </div>
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
            <MethodNote className="text-[12px] text-steel-700 leading-relaxed" short={t('Not available: repeat-claim detection needs a history keyed by period.')} full={t('Not available on this platform: repeat-claim detection. Identifying a taxpayer claiming refund period after period requires a refund history keyed by GSTIN and period, and this dataset holds one claim per taxpayer. A high-value threshold was previously shown in this position as a proxy for it; a large single claim is not a repeat pattern, so the figure has been removed rather than relabelled.')} />
          </div>
        </div>
      </Card>

      <Modal
        open={!!reviewCase}
        onClose={() => setReviewCase(null)}
        size="xl"
        title={reviewCase ? t('Refund Case Review — {0}', reviewCase.tradeName) : ''}
        subtitle={reviewCase ? `${reviewCase.id} · ${reviewCase.gstin}` : ''}
      >
        {reviewCase && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge category={reviewCase.riskCategory} score={reviewCase.riskScore} />
              <Pill tone={STATUS_TONE[effectiveStatus(reviewCase)] || 'steel'}>{t(effectiveStatus(reviewCase))}</Pill>
              {reviewCase.exportLinked && <Pill tone="navy">{t('Export-Linked')}</Pill>}
              <Pill tone="steel">{t(reviewCase.sector)}</Pill>
              {reviewTimes != null && (
                <Pill tone={reviewTimes >= BAND_MULTIPLE ? 'red' : 'steel'}>{t('{0}× the sector benchmark', reviewTimes)}</Pill>
              )}
              {reviewTaxpayer && (
                <Pill tone={reviewTaxpayer.filingStatus === 'Non-Filer' ? 'red' : reviewTaxpayer.filingStatus === 'Late Filer' ? 'amber' : 'green'}>
                  {t(reviewTaxpayer.filingStatus)}
                </Pill>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{t('Claim Details')}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat label={t('Claimed Amount')} value={`₹${(reviewCase.claimedAmount / 100000).toFixed(1)} L`} />
                  <Stat
                    label={t('Refund / Turnover')}
                    value={reviewBenchmark == null
                      ? t('{0}% — no sector benchmark', reviewCase.refundToTurnoverPct.toFixed(1))
                      : t('{0}% against {1}% benchmark', reviewCase.refundToTurnoverPct.toFixed(1), reviewBenchmark)}
                  />
                  <Stat label={t('Filed On')} value={t('{0} — {1} days ago', reviewCase.filedOn, daysPending(reviewCase))} />
                  <Stat label={t('Assigned Officer')} value={reviewCase.assignedOfficer} />
                  <Stat label={t('District')} value={t(reviewCase.district)} />
                  <Stat label={t('Export Linked')} value={reviewCase.exportLinked ? t('Yes') : t('No')} />
                  {reviewTaxpayer && (
                    <>
                      <Stat label={t('Monthly turnover')} value={`₹${(reviewTaxpayer.monthlyTurnover / 100000).toFixed(1)} L`} />
                      <Stat label={t('Tax paid / turnover')} value={t('{0}%', (Math.round((reviewTaxpayer.taxPaid / Math.max(1, reviewTaxpayer.monthlyTurnover)) * 1000) / 10))} />
                    </>
                  )}
                </div>
                <button
                  onClick={() => reviewTaxpayer && setSelectedTaxpayer(reviewTaxpayer)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-navy-200 text-navy-700 hover:bg-navy-50"
                >
                  <User2 className="w-3.5 h-3.5" /> {t('View Taxpayer 360')}
                </button>
              </div>
              {reviewTaxpayer ? <WhyFlaggedPanel taxpayer={reviewTaxpayer} /> : (
                <div className="text-xs text-steel-500">{t('Taxpayer profile unavailable for risk indicators.')}</div>
              )}
            </div>

            <div>
              <button
                onClick={() => setChecklistOutput(generateRefundChecklist(reviewCase))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800 mb-3"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t('Generate Refund Verification Checklist')}
              </button>
              {checklistOutput && <AIOutputPanel output={checklistOutput} />}
            </div>

            <div className="pt-4 border-t border-steel-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-semibold text-navy-800 uppercase tracking-wide">{t('Workflow Action')}</div>
                <HumanReviewBadge />
              </div>
              <p className="text-[11px] text-steel-500 mb-2">{t('Select a status, then confirm review to apply it — this mirrors the same maker-checker step used in Audit & Scrutiny.')}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setPendingStatus('Low Risk')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${pendingStatus === 'Low Risk' ? 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-200' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                >
                  {t('Mark Low Risk')}
                </button>
                <button
                  onClick={() => setPendingStatus('Needs Officer Review')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${pendingStatus === 'Needs Officer Review' ? 'border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                >
                  {t('Needs Officer Review')}
                </button>
                <button
                  onClick={() => setPendingStatus('Escalate for Scrutiny')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${pendingStatus === 'Escalate for Scrutiny' ? 'border-red-500 bg-red-100 text-red-900 ring-2 ring-red-200' : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'}`}
                >
                  {t('Escalate for Scrutiny')}
                </button>
              </div>

              {pendingStatus && (
                <div className="rounded-lg border border-steel-200 bg-steel-50 p-3 mb-3">
                  <label className="flex items-start gap-2 text-xs text-navy-800 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmStatus}
                      onChange={e => setConfirmStatus(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>{t('I confirm officer review is complete — risk indicators and supporting data for this refund case have been examined, and I am setting status to')} <strong>{t(pendingStatus)}</strong>.</span>
                  </label>
                  <button
                    disabled={!confirmStatus}
                    onClick={applyPendingStatus}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-ink-700 text-white hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('Apply Status Change')}
                  </button>
                </div>
              )}

              <div className="flex items-start gap-1.5 text-[11px] text-steel-500">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-steel-400" />
                <MethodNote short={t('No auto-reject. Claims can only be routed to an officer.')} full={t('By design, this system provides no auto-reject action. Refund claims can only be routed for officer review, escalated for scrutiny, or marked low risk — final sanction or rejection decisions remain exclusively with the authorised Refund Officer under statutory process.')} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
    </div>
  )
}
