import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { DISTRICT_REVENUE, DIVISIONS, OFFICERS, TAXPAYERS } from '../data/mockData.js'
import { LIMITATION_BY_DIVISION } from '../data/statutory.js'
import { CAPACITY_RESULT, CAPACITY_RESIDUAL_NOTE } from '../data/capacity.js'
import { DISCOVERY_SUMMARY, PEER_COVERAGE } from '../data/discovery.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import {
  Building2, UserX, IndianRupee, ChevronRight, Gauge, Clock, Users,
  AlertTriangle, TrendingDown
} from 'lucide-react'

function gapTone(gapPct) {
  return gapPct >= 0 ? TONE_STYLES.green : TONE_STYLES.red
}

// District-level severity shading (not taxpayer risk) — threshold-based on the
// district's own figure, cut at percentiles of the full 12-district population.
function severityShade(value, thresholds, labels) {
  if (value >= thresholds[2]) return { bg: 'bg-maharisk-critical', text: 'text-white', label: labels[3] }
  if (value >= thresholds[1]) return { bg: 'bg-maharisk-high', text: 'text-white', label: labels[2] }
  if (value >= thresholds[0]) return { bg: 'bg-amber-300', text: 'text-navy-900', label: labels[1] }
  return { bg: 'bg-emerald-200', text: 'text-navy-900', label: labels[0] }
}

/* ---------------------------------------------------------------------------
 * PEER-RELATIVE COMPARISON — method borrowed, not reinvented.
 *
 * Median and MAD with the 0.6745 scaling and the 3.5 modified-z cut are the
 * method src/data/discovery.js owns and documents; the threshold itself is read
 * from DISCOVERY_SUMMARY rather than restated here. What differs is only the
 * population: discovery norms a taxpayer against their sector, this page norms
 * a district against the other districts. Mean and standard deviation are not
 * used for the same reason discovery does not use them — on twelve districts a
 * single extreme value drags the spread until it stops looking extreme.
 * ------------------------------------------------------------------------- */
const median = xs => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const r1 = n => Math.round(n * 10) / 10
const percentile = (vals, p) => {
  const s = [...vals].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(s.length * p))]
}

// worseWhen says which tail is the adverse one, so a district that is unusually
// GOOD is never reported as a problem.
const PEER_METRICS = [
  { id: 'gapPct', label: 'Collection gap to target', of: d => d.gapPct, worseWhen: 'low', fmt: v => `${v > 0 ? '+' : ''}${v}%` },
  { id: 'riskTaxpayers', label: 'High/Critical taxpayers', of: d => d.riskTaxpayers, worseWhen: 'high', fmt: v => v.toLocaleString('en-IN') },
  { id: 'nonFilers', label: 'Non-filers', of: d => d.nonFilers, worseWhen: 'high', fmt: v => v.toLocaleString('en-IN') },
  { id: 'officerWorkload', label: 'Officer workload', of: d => d.officerWorkload, worseWhen: 'high', fmt: v => `${v}%` },
  { id: 'caseAgeingDays', label: 'Case ageing', of: d => d.caseAgeingDays, worseWhen: 'high', fmt: v => `${v}d` },
  { id: 'auditRecoveryCr', label: 'Audit recovery', of: d => d.auditRecoveryCr, worseWhen: 'low', fmt: v => `₹${v} Cr` }
]

const shortfallCrOf = d => Math.max(0, d.targetCr - d.actualCr)

export default function DistrictDivisionPerformance() {
  const { filters } = useApp()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)
  const [heatmapMetric, setHeatmapMetric] = useState('riskTaxpayers')

  const filteredDistricts = useMemo(() => {
    return DISTRICT_REVENUE.filter(d => {
      if (filters.district !== 'All Districts' && d.district !== filters.district) return false
      if (filters.division !== 'All Divisions' && d.division !== filters.division) return false
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase()
        const hay = `${d.district} ${d.division}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [filters.district, filters.division, filters.search])

  // When sector/risk-level/search are narrowing the view, the "Risk Taxpayers" figure shown on each
  // district card should reflect that narrower scope — but the heatmap/severity shading below keeps
  // using the real, unscoped d.riskTaxpayers/d.gapPct fields (geographic governance data, not to be
  // pastel-recolored by an incidental sector/search filter). The peer medians and modified-z figures
  // are computed on the same unscoped population, for the same reason: a benchmark that moves when a
  // filter moves is not a benchmark.
  const isNarrowingActive = filters.sector !== 'All Sectors' || filters.riskLevel !== 'All Risk Levels'
    || (!!filters.search && !!filters.search.trim())

  const scopedRiskCounts = useMemo(() => {
    if (!isNarrowingActive) return null
    const map = {}
    DISTRICT_REVENUE.forEach(d => {
      map[d.district] = TAXPAYERS.filter(tp => tp.district === d.district && applyGlobalFilters(tp, filters)).length
    })
    return map
  }, [filters, isNarrowingActive])

  /* ---- Peer norms over ALL districts, never the filtered subset ---------- */
  const peerNorms = useMemo(() => {
    const out = {}
    PEER_METRICS.forEach(m => {
      const vals = DISTRICT_REVENUE.map(m.of).filter(v => v != null && isFinite(v))
      const med = median(vals)
      const mad = median(vals.map(v => Math.abs(v - med)))
      out[m.id] = { median: med, mad, n: vals.length }
    })
    return out
  }, [])

  const districtDeviations = useMemo(() => {
    const zCut = DISCOVERY_SUMMARY.zThreshold
    const out = {}
    DISTRICT_REVENUE.forEach(d => {
      out[d.district] = PEER_METRICS.map(m => {
        const norm = peerNorms[m.id]
        const value = m.of(d)
        // A zero MAD means over half the districts share one value; a deviation
        // from it is real but cannot be scaled, so it is left unscored rather
        // than reported as an infinite z.
        const z = norm && norm.mad > 0 ? (0.6745 * (value - norm.median)) / norm.mad : null
        const adverse = z != null && (m.worseWhen === 'high' ? z >= zCut : z <= -zCut)
        return { ...m, value, peerMedian: norm ? norm.median : null, z: z == null ? null : Math.round(z * 100) / 100, adverse }
      })
    })
    return out
  }, [peerNorms])

  const adverseDistricts = useMemo(
    () => filteredDistricts.filter(d => (districtDeviations[d.district] || []).some(x => x.adverse)),
    [filteredDistricts, districtDeviations]
  )

  /* ---- Statutory limitation, by division (owned by statutory.js) --------- */
  const divisionsInScope = useMemo(
    () => [...new Set(filteredDistricts.map(d => d.division))],
    [filteredDistricts]
  )
  const limitationRows = useMemo(
    () => LIMITATION_BY_DIVISION.filter(r => divisionsInScope.includes(r.division)),
    [divisionsInScope]
  )
  const limitationSummary = useMemo(() => {
    const critical = limitationRows.filter(r => r.criticalCount > 0)
    return {
      divisionsWithCritical: critical.length,
      divisionsCovered: limitationRows.length,
      criticalCases: limitationRows.reduce((s, r) => s + r.criticalCount, 0),
      criticalExposureCr: Math.round(critical.reduce((s, r) => s + r.exposureCr, 0) * 10) / 10,
      nearestDays: limitationRows.reduce(
        (best, r) => (r.nearestDays != null && (best == null || r.nearestDays < best) ? r.nearestDays : best),
        null
      )
    }
  }, [limitationRows])

  const limitationByDivision = useMemo(
    () => Object.fromEntries(limitationRows.map(r => [r.division, r])),
    [limitationRows]
  )

  /* ---- Capacity: the worst-subscribed pool per division -----------------
   * Deliberately the worst pool rather than a division average. capacity.js
   * states the reason itself: an unused officer-day in one pool cannot be spent
   * in another, so an averaged division figure hides the binding constraint. */
  const capacityByDivision = useMemo(() => {
    const out = {}
    CAPACITY_RESULT.pools.forEach(p => {
      if (p.subscription == null) return
      const cur = out[p.division]
      if (!cur || p.subscription > cur.subscription) out[p.division] = p
    })
    return out
  }, [])

  const kpis = useMemo(() => {
    const totalDistricts = filteredDistricts.length
    const inDeficit = filteredDistricts.filter(d => d.gapPct < 0).length
    const totalTargetCr = filteredDistricts.reduce((s, d) => s + d.targetCr, 0)
    const shortfallCr = filteredDistricts.reduce((s, d) => s + shortfallCrOf(d), 0)
    const totalAuditRecovery = filteredDistricts.reduce((s, d) => s + d.auditRecoveryCr, 0)
    const totalNonFilers = filteredDistricts.reduce((s, d) => s + d.nonFilers, 0)
    const gaps = filteredDistricts.map(d => d.gapPct)
    return {
      totalDistricts,
      inDeficit,
      totalTargetCr,
      shortfallCr,
      shortfallPct: totalTargetCr > 0 ? r1((shortfallCr / totalTargetCr) * 100) : 0,
      totalAuditRecovery,
      coverPct: shortfallCr > 0 ? Math.round((totalAuditRecovery / shortfallCr) * 100) : null,
      totalNonFilers,
      medianGapPct: gaps.length ? r1(median(gaps)) : 0
    }
  }, [filteredDistricts])

  const heatThresholds = useMemo(() => {
    const risk = DISTRICT_REVENUE.map(d => d.riskTaxpayers)
    const ageing = DISTRICT_REVENUE.map(d => d.caseAgeingDays)
    return {
      riskTaxpayers: [percentile(risk, 0.4), percentile(risk, 0.7), percentile(risk, 0.9)],
      caseAgeingDays: [percentile(ageing, 0.4), percentile(ageing, 0.7), percentile(ageing, 0.9)],
      gapPct: [-3, -8, -15]
    }
  }, [])

  function heatCell(d) {
    if (heatmapMetric === 'riskTaxpayers') {
      return severityShade(d.riskTaxpayers, heatThresholds.riskTaxpayers, ['Stable', 'Moderate', 'Elevated', 'Severe'])
    }
    if (heatmapMetric === 'caseAgeingDays') {
      return severityShade(d.caseAgeingDays, heatThresholds.caseAgeingDays, ['Stable', 'Moderate', 'Elevated', 'Severe'])
    }
    const g = d.gapPct
    if (g <= heatThresholds.gapPct[2]) return { bg: 'bg-maharisk-critical', text: 'text-white', label: 'Severe deficit' }
    if (g <= heatThresholds.gapPct[1]) return { bg: 'bg-maharisk-high', text: 'text-white', label: 'High deficit' }
    if (g <= heatThresholds.gapPct[0]) return { bg: 'bg-amber-300', text: 'text-navy-900', label: 'Mild deficit' }
    return { bg: 'bg-emerald-200', text: 'text-navy-900', label: 'On/above target' }
  }

  function heatValue(d) {
    if (heatmapMetric === 'riskTaxpayers') return d.riskTaxpayers
    if (heatmapMetric === 'caseAgeingDays') return `${d.caseAgeingDays}d`
    return `${d.gapPct > 0 ? '+' : ''}${d.gapPct}%`
  }

  const heatLegend = () => {
    if (heatmapMetric === 'gapPct') {
      return t('Cuts: mild deficit at {0}%, high at {1}%, severe at {2}% against target.',
        heatThresholds.gapPct[0], heatThresholds.gapPct[1], heatThresholds.gapPct[2])
    }
    const th = heatThresholds[heatmapMetric]
    return t('Cuts at the 40th / 70th / 90th percentile of all {0} districts: {1}, {2}, {3}.',
      DISTRICT_REVENUE.length, th[0], th[1], th[2])
  }

  const divisionRanking = useMemo(() => {
    const groups = {}
    filteredDistricts.forEach(d => {
      if (!groups[d.division]) groups[d.division] = { division: d.division, targetCr: 0, actualCr: 0, auditRecoveryCr: 0, shortfallCr: 0, workloadSum: 0, count: 0, riskTaxpayers: 0, nonFilers: 0 }
      const g = groups[d.division]
      g.targetCr += d.targetCr
      g.actualCr += d.actualCr
      g.auditRecoveryCr += d.auditRecoveryCr
      g.shortfallCr += shortfallCrOf(d)
      g.workloadSum += d.officerWorkload
      g.riskTaxpayers += scopedRiskCounts ? scopedRiskCounts[d.district] : d.riskTaxpayers
      g.nonFilers += d.nonFilers
      g.count += 1
    })
    return Object.values(groups)
      .map(g => ({
        ...g,
        avgWorkload: Math.round(g.workloadSum / g.count),
        performanceRatio: r1((g.actualCr / g.targetCr) * 100),
        coverPct: g.shortfallCr > 0 ? Math.round((g.auditRecoveryCr / g.shortfallCr) * 100) : null
      }))
      .sort((a, b) => b.performanceRatio - a.performanceRatio)
  }, [filteredDistricts, scopedRiskCounts])

  const divisionMedianPerformance = useMemo(
    () => (divisionRanking.length ? r1(median(divisionRanking.map(g => g.performanceRatio))) : null),
    [divisionRanking]
  )

  // The readiness view: deadlines and capacity are what turn a ranking into a
  // decision about where the next officer-week goes.
  const divisionReadiness = useMemo(
    () => divisionsInScope.map(division => {
      const lim = limitationByDivision[division] || null
      const cap = capacityByDivision[division] || null
      return {
        id: division,
        division,
        cases: lim ? lim.cases : null,
        exposureCr: lim ? lim.exposureCr : null,
        nearestDays: lim ? lim.nearestDays : null,
        criticalCount: lim ? lim.criticalCount : null,
        subscription: cap ? cap.subscription : null,
        poolLabel: cap ? cap.typeLabel : null,
        officerCount: cap ? cap.officerCount : null,
        marginalValue: cap ? cap.marginalOfficerWeekValue : null,
        marginalCases: cap ? cap.marginalOfficerWeekCases : null
      }
    }),
    [divisionsInScope, limitationByDivision, capacityByDivision]
  )

  const districtOfficers = useMemo(
    () => selectedDistrict ? OFFICERS.filter(o => o.district === selectedDistrict.district) : [],
    [selectedDistrict]
  )
  const districtOfficerTotals = useMemo(() => ({
    count: districtOfficers.length,
    assigned: districtOfficers.reduce((s, o) => s + o.assignedCases, 0),
    closed: districtOfficers.reduce((s, o) => s + o.casesClosedMTD, 0)
  }), [districtOfficers])

  const districtTopRisk = useMemo(
    () => selectedDistrict
      ? TAXPAYERS.filter(tp => tp.district === selectedDistrict.district && applyGlobalFilters(tp, filters))
        .sort((a, b) => b.risk.score - a.risk.score).slice(0, 5)
      : [],
    [selectedDistrict, filters]
  )

  const briefingText = () => [
    t('District & Division Performance — benchmarking summary'),
    t('{0} of {1} districts in scope are below their collection target; the median district sits at {2}% against target.', kpis.inDeficit, kpis.totalDistricts, kpis.medianGapPct),
    t('Combined shortfall is ₹{0} Cr, {1}% of the ₹{2} Cr combined target.', kpis.shortfallCr.toLocaleString('en-IN'), kpis.shortfallPct, kpis.totalTargetCr.toLocaleString('en-IN')),
    kpis.coverPct == null
      ? t('No district in scope is below target, so there is no shortfall for audit recovery to cover.')
      : t('Audit recovery of ₹{0} Cr covers {1}% of that shortfall.', kpis.totalAuditRecovery.toLocaleString('en-IN'), kpis.coverPct),
    limitationSummary.divisionsWithCritical > 0
      ? t('{0} of {1} divisions carry a proceeding within 30 days of its binding statutory deadline, against ₹{2} Cr of exposure.', limitationSummary.divisionsWithCritical, limitationSummary.divisionsCovered, limitationSummary.criticalExposureCr)
      : t('No division in scope carries a proceeding within 30 days of its binding statutory deadline.'),
    adverseDistricts.length > 0
      ? t('{0} district(s) deviate beyond the peer threshold on at least one measure.', adverseDistricts.length)
      : t('No district in scope deviates beyond the peer outlier threshold on any measure.'),
    t('Severity shading and every peer median are computed on all {0} districts, unfiltered.', DISTRICT_REVENUE.length)
  ].join('\n')

  // DataTable translates column labels itself (t(col.label)), so these are
  // passed as raw source strings rather than pre-translated.
  const readinessColumns = [
    { key: 'division', label: 'Division', render: r => <span className="font-medium text-navy-800">{t(r.division)}</span> },
    {
      key: 'nearestDays', label: 'Nearest deadline', align: 'right',
      sortValue: r => (r.nearestDays == null ? 99999 : r.nearestDays),
      render: r => r.nearestDays == null
        ? <span className="text-steel-400">{t('No open proceeding')}</span>
        : <Pill tone={r.nearestDays <= 30 ? 'red' : r.nearestDays <= 90 ? 'amber' : 'green'}>{t('{0} days', r.nearestDays)}</Pill>
    },
    {
      key: 'criticalCount', label: 'Within 30 days', align: 'right',
      sortValue: r => r.criticalCount || 0,
      render: r => r.criticalCount == null ? '—' : <span className={r.criticalCount > 0 ? 'font-bold text-maharisk-critical' : ''}>{r.criticalCount}</span>
    },
    {
      key: 'exposureCr', label: 'Exposure (Cr)', align: 'right',
      sortValue: r => r.exposureCr || 0,
      render: r => r.exposureCr == null ? '—' : r.exposureCr.toLocaleString('en-IN')
    },
    { key: 'cases', label: 'Open proceedings', align: 'right', sortValue: r => r.cases || 0, render: r => r.cases == null ? '—' : r.cases },
    {
      key: 'subscription', label: 'Worst pool demand / supply', align: 'right',
      sortValue: r => r.subscription || 0,
      render: r => r.subscription == null
        ? <span className="text-steel-400">{t('No field pool')}</span>
        : (
          <div>
            <Pill tone={r.subscription > 1 ? 'red' : 'green'}>{t('{0}x', r.subscription)}</Pill>
            <div className="text-[10.5px] text-steel-500 mt-0.5">{t('{0} · {1} officers', t(r.poolLabel), r.officerCount)}</div>
          </div>
        )
    },
    {
      key: 'marginalValue', label: 'Next officer-week buys', align: 'right',
      sortValue: r => r.marginalValue || 0,
      render: r => r.marginalValue == null || r.marginalValue === 0
        ? <span className="text-steel-400">{t('Nothing reachable')}</span>
        : (
          <div>
            <div className="font-semibold text-navy-800">{t('₹{0} L', Math.round(r.marginalValue / 100000).toLocaleString('en-IN'))}</div>
            <div className="text-[10.5px] text-steel-500">{t('{0} case(s)', r.marginalCases)}</div>
          </div>
        )
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Benchmarking')}
        title={t('District & Division Performance')}
        description={t("Every district and division measured against its target, its peers and its statutory clock — collection, compliance, enforcement and the capacity available to act.")}
        actions={<ExportBar moduleLabel="District & Division Performance" getBriefingText={briefingText} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Districts Below Target')}
          value={kpis.inDeficit}
          unit={t('of {0}', kpis.totalDistricts)}
          trend={kpis.medianGapPct}
          trendLabel={t('median district gap to target')}
          icon={Gauge}
          tone="red"
        />
        <KpiCard
          label={t('Collection Shortfall')}
          value={t('₹{0} Cr', kpis.shortfallCr.toLocaleString('en-IN'))}
          unit={t('{0}% of ₹{1} Cr target', kpis.shortfallPct, kpis.totalTargetCr.toLocaleString('en-IN'))}
          icon={TrendingDown}
          tone="saffron"
        />
        <KpiCard
          label={t('Audit Recovery Against Shortfall')}
          value={kpis.coverPct == null ? t('No shortfall') : t('{0}%', kpis.coverPct)}
          unit={t('₹{0} Cr recovered', kpis.totalAuditRecovery.toLocaleString('en-IN'))}
          icon={IndianRupee}
          tone={kpis.coverPct != null && kpis.coverPct < 50 ? 'red' : 'green'}
        />
        <KpiCard
          label={t('Divisions Inside 30-Day Limitation')}
          value={limitationSummary.divisionsWithCritical}
          unit={limitationSummary.divisionsCovered > 0
            ? t('of {0} · ₹{1} Cr exposure', limitationSummary.divisionsCovered, limitationSummary.criticalExposureCr)
            : t('no register coverage in scope')}
          icon={Clock}
          tone={limitationSummary.divisionsWithCritical > 0 ? 'red' : 'green'}
        />
      </div>

      <Card
        title={t('District Severity Heatmap')}
        subtitle={t('Threshold-based shading — not a taxpayer risk score')}
        className="mb-6"
        actions={
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setHeatmapMetric('riskTaxpayers')}
              className={`px-2.5 py-1 rounded-md border font-medium ${heatmapMetric === 'riskTaxpayers' ? 'bg-ink-700 text-white border-ink-700' : 'bg-white border-steel-200 text-steel-600'}`}
            >{t('Risk Taxpayers')}</button>
            <button
              onClick={() => setHeatmapMetric('gapPct')}
              className={`px-2.5 py-1 rounded-md border font-medium ${heatmapMetric === 'gapPct' ? 'bg-ink-700 text-white border-ink-700' : 'bg-white border-steel-200 text-steel-600'}`}
            >{t('Target Gap %')}</button>
            <button
              onClick={() => setHeatmapMetric('caseAgeingDays')}
              className={`px-2.5 py-1 rounded-md border font-medium ${heatmapMetric === 'caseAgeingDays' ? 'bg-ink-700 text-white border-ink-700' : 'bg-white border-steel-200 text-steel-600'}`}
            >{t('Case Ageing')}</button>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {filteredDistricts.map(d => {
            const shade = heatCell(d)
            return (
              <button
                key={d.district}
                onClick={() => setSelectedDistrict(d)}
                className={`rounded-lg p-3 text-left ${shade.bg} ${shade.text} hover:opacity-90 transition-opacity`}
              >
                <div className="text-xs font-bold truncate">{t(d.district)}</div>
                <div className="text-[10px] opacity-90 mt-0.5">{t(shade.label)}</div>
                <div className="text-sm font-bold mt-1.5">{heatValue(d)}</div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 rounded-lg border border-steel-200 bg-steel-50 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-navy-800">
            <AlertTriangle className="w-3.5 h-3.5 text-steel-500" />
            {t('What this shading is, and what it is not')}
          </div>
          <p className="text-[11px] text-steel-600">{heatLegend()}</p>
          <p className="text-[11px] text-steel-600">
            {t('A band is a cut on a district-level figure — a governance signal about a place. It is not a risk rating of any taxpayer inside that place: taxpayer risk is scored individually by the risk engine from the rules that actually fired, and a taxpayer in a red district is not thereby high-risk.')}
          </p>
          <p className="text-[11px] text-steel-600">
            {t('Shading and every peer median on this page are computed on all {0} districts, unfiltered. Sector, risk-level and search filters narrow the per-district risk-taxpayer count on the cards below, but never the shading or the benchmark — an incidental filter must not silently recolour a governance map or move the line a district is being measured against.', DISTRICT_REVENUE.length)}
          </p>
          {isNarrowingActive && (
            <div className="pt-1">
              <Pill tone="amber">{t('Narrowing filter active — card risk counts are scoped, shading and medians are not')}</Pill>
            </div>
          )}
        </div>
      </Card>

      <Card
        title={t('Peer-Relative Deviation')}
        subtitle={t('Each district against the median of all {0} districts, scaled by median absolute deviation', DISTRICT_REVENUE.length)}
        className="mb-6"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
          {PEER_METRICS.map(m => (
            <div key={m.id} className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
              <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{t(m.label)}</div>
              <div className="text-sm font-bold text-navy-900 mt-0.5">
                {peerNorms[m.id] && peerNorms[m.id].median != null ? m.fmt(r1(peerNorms[m.id].median)) : '—'}
              </div>
              <div className="text-[10.5px] text-steel-500">{t('peer median')}</div>
            </div>
          ))}
        </div>

        {adverseDistricts.length === 0 ? (
          <p className="text-xs text-steel-600">
            {t('No district in scope deviates beyond a modified z of {0} on any measure. That is the expected result on a peer group of {1}: the threshold is the conventional outlier cut, and on twelve districts an ordinary spread will not reach it. It is reported rather than lowered — a threshold moved until it produces results reports ordinary variation as an outlier. Read the medians above as the comparator instead.', DISCOVERY_SUMMARY.zThreshold, DISTRICT_REVENUE.length)}
          </p>
        ) : (
          <div className="space-y-1.5">
            {adverseDistricts.map(d => (
              <div key={d.district} className="flex items-start justify-between gap-2 px-3 py-2 rounded-lg border border-steel-200">
                <div className="text-xs font-semibold text-navy-800">{t(d.district)}</div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {districtDeviations[d.district].filter(x => x.adverse).map(x => (
                    <Pill key={x.id} tone="red">
                      {t('{0}: {1} vs {2} median', t(x.label), x.fmt(x.value), x.fmt(r1(x.peerMedian)))}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-steel-500 mt-3">
          {t('Method: median and median absolute deviation, cut at a modified z of {0} — the platform-wide peer method owned by the discovery engine, applied here across districts rather than across a taxpayer’s sector. Mean and standard deviation are not used because a single extreme district would inflate the spread until it stopped registering as extreme. The peer group is {1} districts, above the {2}-district minimum the method requires before a norm is worth computing. Only the adverse tail is reported: a district unusually better than its peers is not a finding.', DISCOVERY_SUMMARY.zThreshold, DISTRICT_REVENUE.length, PEER_COVERAGE.minGroupSize)}
        </p>
      </Card>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">{t('District Performance Cards')}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredDistricts.map(d => {
          const tone = gapTone(d.gapPct)
          const pct = Math.min(100, Math.round((d.actualCr / d.targetCr) * 100))
          const shortfall = shortfallCrOf(d)
          const cover = shortfall > 0 ? Math.round((d.auditRecoveryCr / shortfall) * 100) : null
          const devs = districtDeviations[d.district] || []
          const adverse = devs.filter(x => x.adverse)
          const lim = limitationByDivision[d.division]
          const norm = id => {
            const n = peerNorms[id]
            const m = PEER_METRICS.find(x => x.id === id)
            return n && n.median != null ? m.fmt(r1(n.median)) : '—'
          }
          return (
            <Card key={d.district} padded={false} className="overflow-hidden">
              <button onClick={() => setSelectedDistrict(d)} className="w-full text-left p-4 hover:bg-steel-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold text-navy-900">{t(d.district)}</div>
                    <div className="text-[11px] text-steel-500">{t(d.division)}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border" style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.accent }}>
                    {d.gapPct > 0 ? '+' : ''}{d.gapPct}%
                  </span>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-[11px] text-steel-500 mb-1">
                    <span>{t('Actual')} {t('₹{0} Cr', d.actualCr.toLocaleString('en-IN'))}</span>
                    <span>{t('Target')} {t('₹{0} Cr', d.targetCr.toLocaleString('en-IN'))}</span>
                  </div>
                  <div className="h-2 rounded-full bg-steel-100 overflow-hidden">
                    <div className={`h-full ${d.gapPct >= 0 ? 'bg-emerald-500' : 'bg-maharisk-critical'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10.5px] text-steel-500 mt-1">
                    {t('Peer median gap {0}% · shortfall {1}', r1(peerNorms.gapPct.median), shortfall > 0 ? t('₹{0} Cr', shortfall.toLocaleString('en-IN')) : t('none'))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <MiniStat
                    label={t('Risk Taxpayers')}
                    value={scopedRiskCounts ? scopedRiskCounts[d.district] : d.riskTaxpayers}
                    compare={scopedRiskCounts ? t('current filter scope') : t('peer median {0}', norm('riskTaxpayers'))}
                  />
                  <MiniStat label={t('Non-Filers')} value={d.nonFilers.toLocaleString('en-IN')} compare={t('peer median {0}', norm('nonFilers'))} />
                  <MiniStat label={t('Officer Workload')} value={`${d.officerWorkload}%`} compare={t('peer median {0}', norm('officerWorkload'))} />
                  <MiniStat label={t('Case Ageing')} value={`${d.caseAgeingDays}d`} compare={t('peer median {0}', norm('caseAgeingDays'))} />
                  <MiniStat
                    label={t('Recovery vs Shortfall')}
                    value={cover == null ? t('n/a') : `${cover}%`}
                    compare={cover == null ? t('at or above target') : t('₹{0} Cr recovered', d.auditRecoveryCr.toLocaleString('en-IN'))}
                  />
                  <MiniStat
                    label={t('Division Deadline')}
                    value={lim && lim.nearestDays != null ? t('{0}d', lim.nearestDays) : t('none')}
                    compare={lim ? t('{0} within 30 days', lim.criticalCount) : t('not in register')}
                  />
                </div>

                {adverse.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {adverse.map(x => <Pill key={x.id} tone="red">{t('Peer outlier: {0}', t(x.label))}</Pill>)}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 mt-3 text-[11px] font-semibold text-navy-700">
                  {t('District drilldown')} <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </Card>
          )
        })}
        {filteredDistricts.length === 0 && (
          <div className="col-span-full text-center text-sm text-steel-500 py-10">{t('No districts match the current global filters.')}</div>
        )}
      </div>

      <Card
        title={t('Non-Filer Compliance Rate')}
        subtitle={t('A parameter this platform cannot currently answer')}
        className="mb-6"
      >
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-steel-100 text-steel-600 shrink-0"><UserX className="w-4 h-4" /></span>
          <div className="text-xs text-steel-600 space-y-1.5">
            <p>
              {t('{0} non-filers are counted across the districts in scope, but a non-filer count without its denominator is not a compliance rate and is not comparable between a metropolitan district and a rural one.', kpis.totalNonFilers.toLocaleString('en-IN'))}
            </p>
            <p>
              {t('The denominator needed is the count of ACTIVE registrations per district from the registration register, which this platform does not hold. The {0} taxpayers in the demonstration extract are a sample, not the register, and dividing by them would produce a rate that looks precise and is wrong by orders of magnitude.', TAXPAYERS.length)}
            </p>
            <p className="font-medium text-navy-800">
              {t('Feed required: active GST registrations per district, as at the reference date. Until it is connected, non-filers are shown as a raw count against the peer median only.')}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title={t('Division Collection Ranking')}
        subtitle={t('Target, actual and the share of each shortfall that enforcement recovered')}
        className="mb-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-steel-50 border-b border-steel-200 text-left">
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Rank')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Division')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Target (Cr)')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Actual (Cr)')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Performance')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('vs Division Median')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Shortfall (Cr)')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Recovery Covers')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Risk Taxpayers')}</th>
              </tr>
            </thead>
            <tbody>
              {divisionRanking.map((g, i) => {
                const delta = divisionMedianPerformance == null ? null : r1(g.performanceRatio - divisionMedianPerformance)
                return (
                  <tr key={g.division} className={`border-b border-steel-100 last:border-0 ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}>
                    <td className="px-3 py-2.5 font-bold text-navy-800">#{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-navy-800">{t(g.division)}</td>
                    <td className="px-3 py-2.5 text-right text-navy-800">{g.targetCr.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right text-navy-800">{g.actualCr.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Pill tone={g.performanceRatio >= 100 ? 'green' : g.performanceRatio >= 90 ? 'amber' : 'red'}>{g.performanceRatio}%</Pill>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-medium ${delta != null && delta < 0 ? 'text-maharisk-critical' : 'text-emerald-700'}`}>
                      {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta} pp`}
                    </td>
                    <td className="px-3 py-2.5 text-right text-navy-800">{g.shortfallCr > 0 ? g.shortfallCr.toLocaleString('en-IN') : '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      {g.coverPct == null
                        ? <span className="text-steel-400">{t('n/a')}</span>
                        : <Pill tone={g.coverPct >= 100 ? 'green' : g.coverPct >= 50 ? 'amber' : 'red'}>{g.coverPct}%</Pill>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-navy-800">{g.riskTaxpayers}</td>
                  </tr>
                )
              })}
              {divisionRanking.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-steel-400">{t('No divisions match the current global filters.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-steel-500 mt-3">
          {t('{0} divisions covering {1} districts across Maharashtra. "Recovery covers" is audit recovery as a share of that division’s own collection shortfall — a division above target has no shortfall to cover and is shown as n/a rather than as a perfect score. The risk-taxpayer column follows the current filter scope; every other column does not.', DIVISIONS.length, DISTRICT_REVENUE.length)}
        </p>
      </Card>

      <Card
        title={t('Division Deadlines & Capacity to Act')}
        subtitle={t('What is about to expire in each division, and what one more officer-week there would actually buy')}
        className="mb-6"
      >
        <DataTable
          columns={readinessColumns}
          rows={divisionReadiness}
          searchable={false}
          pageSize={12}
          emptyLabel="No divisions match the current global filters."
        />
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] text-steel-500">
            {t('Deadlines are the binding statutory dates from the limitation engine — the notice date where no notice has issued, which falls months before the order date and is the one most often missed. A division with no open proceeding in the register is shown as such, not as zero risk.')}
          </p>
          <p className="text-[11px] text-steel-500">
            {t('Demand / supply is the single worst-subscribed officer pool in that division, taken from the capacity engine rather than averaged across the division. The engine states the reason: {0}', t(CAPACITY_RESIDUAL_NOTE))}
          </p>
        </div>
      </Card>

      <Modal
        open={!!selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
        size="lg"
        title={t(selectedDistrict?.district)}
        subtitle={t(selectedDistrict?.division)}
      >
        {selectedDistrict && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Stat label={t('Target')} value={t('₹{0} Cr', selectedDistrict.targetCr.toLocaleString('en-IN'))} />
              <Stat label={t('Actual')} value={t('₹{0} Cr', selectedDistrict.actualCr.toLocaleString('en-IN'))} />
              <Stat
                label={t('Target Gap')}
                value={`${selectedDistrict.gapPct > 0 ? '+' : ''}${selectedDistrict.gapPct}%`}
                tone={selectedDistrict.gapPct >= 0 ? 'good' : 'bad'}
                compare={t('peer median {0}%', r1(peerNorms.gapPct.median))}
              />
              <Stat
                label={t('Shortfall')}
                value={shortfallCrOf(selectedDistrict) > 0 ? t('₹{0} Cr', shortfallCrOf(selectedDistrict).toLocaleString('en-IN')) : t('none')}
                compare={shortfallCrOf(selectedDistrict) > 0
                  ? t('recovery covers {0}%', Math.round((selectedDistrict.auditRecoveryCr / shortfallCrOf(selectedDistrict)) * 100))
                  : t('at or above target')}
              />
              <Stat
                label={t('Audit Recovery')}
                value={t('₹{0} Cr', selectedDistrict.auditRecoveryCr.toLocaleString('en-IN'))}
                compare={t('peer median ₹{0} Cr', r1(peerNorms.auditRecoveryCr.median))}
              />
              <Stat
                label={t('Risk Taxpayers')}
                value={scopedRiskCounts ? scopedRiskCounts[selectedDistrict.district] : selectedDistrict.riskTaxpayers}
                compare={scopedRiskCounts ? t('current filter scope') : t('peer median {0}', r1(peerNorms.riskTaxpayers.median))}
              />
              <Stat
                label={t('Non-Filers')}
                value={selectedDistrict.nonFilers.toLocaleString('en-IN')}
                compare={t('peer median {0}', r1(peerNorms.nonFilers.median))}
              />
              <Stat
                label={t('Officer Workload')}
                value={`${selectedDistrict.officerWorkload}%`}
                compare={t('peer median {0}%', r1(peerNorms.officerWorkload.median))}
              />
              <Stat
                label={t('Case Ageing')}
                value={t('{0} days', selectedDistrict.caseAgeingDays)}
                compare={t('peer median {0} days', r1(peerNorms.caseAgeingDays.median))}
              />
            </div>

            {(() => {
              const lim = limitationByDivision[selectedDistrict.division]
              const cap = capacityByDivision[selectedDistrict.division]
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-steel-200 p-3">
                    <div className="text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t('Statutory clock in {0}', t(selectedDistrict.division))}</div>
                    {!lim ? (
                      <p className="text-[11px] text-steel-500">{t('This division carries no open proceeding in the limitation register.')}</p>
                    ) : (
                      <p className="text-[11px] text-steel-600">
                        {t('{0} open proceedings carrying ₹{1} Cr. Nearest binding deadline in {2} days; {3} within 30 days.', lim.cases, lim.exposureCr, lim.nearestDays == null ? 0 : lim.nearestDays, lim.criticalCount)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-steel-200 p-3">
                    <div className="text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {t('Capacity in {0}', t(selectedDistrict.division))}</div>
                    {!cap ? (
                      <p className="text-[11px] text-steel-500">{t('No field officer pool is modelled for this division.')}</p>
                    ) : (
                      <p className="text-[11px] text-steel-600">
                        {t('Worst-subscribed pool: {0}, demanding {1}x the {2} officers available. One more officer-week there would reach {3} further case(s), worth ₹{4} L.', t(cap.typeLabel), cap.subscription, cap.officerCount, cap.marginalOfficerWeekCases, Math.round(cap.marginalOfficerWeekValue / 100000).toLocaleString('en-IN'))}
                      </p>
                    )}
                  </div>
                </div>
              )
            })()}

            <div>
              <div className="text-xs font-semibold text-navy-800 mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {t('Officer Workload in {0}', selectedDistrict.district)}</div>
              {districtOfficers.length === 0 ? (
                <p className="text-xs text-steel-500">{t('No officers directly assigned to this district in the current dataset.')}</p>
              ) : (
                <>
                  <p className="text-[11px] text-steel-500 mb-2">
                    {t('{0} officers · {1} cases assigned · {2} closed month to date', districtOfficerTotals.count, districtOfficerTotals.assigned, districtOfficerTotals.closed)}
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {districtOfficers.map(o => (
                      <div key={o.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-steel-200 text-xs">
                        <div>
                          <div className="font-semibold text-navy-800">{o.name}</div>
                          <div className="text-[11px] text-steel-500">{t(o.role)}</div>
                        </div>
                        <div className="text-right text-[11px] text-steel-500">
                          <div>{t('{0} assigned · {1} closed MTD', o.assignedCases, o.casesClosedMTD)}</div>
                          <div>{t('Avg resolution: {0}d', o.avgResolutionDays)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-navy-800 mb-2">{t('Top Risk Taxpayers in this District')}</div>
              <p className="text-[11px] text-steel-500 mb-2">
                {t('Ranked by each taxpayer’s own rule-based risk score. District shading played no part in these ratings.')}
              </p>
              {districtTopRisk.length === 0 && (
                <p className="text-xs text-steel-500">{t('No taxpayers in this district match the current global filters.')}</p>
              )}
              <div className="space-y-1.5">
                {districtTopRisk.map(tp => (
                  <button
                    key={tp.id}
                    onClick={() => { setSelectedTaxpayer(tp) }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-steel-200 hover:bg-navy-50/60 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-navy-800 truncate">{tp.tradeName}</div>
                      <div className="text-[11px] text-steel-500 truncate">{t(tp.sector)} · {tp.gstin}</div>
                    </div>
                    <RiskBadge category={tp.risk.category} score={tp.risk.score} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function MiniStat({ label, value, compare }) {
  return (
    <div className="px-2 py-1.5 rounded-md bg-steel-50 border border-steel-100">
      <div className="text-steel-500">{label}</div>
      <div className="font-bold text-navy-900">{value}</div>
      {compare && <div className="text-[10px] text-steel-500 mt-0.5 truncate">{compare}</div>}
    </div>
  )
}

function Stat({ label, value, tone, compare }) {
  const toneCls = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-maharisk-critical' : 'text-navy-900'
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${toneCls}`}>{value}</div>
      {compare && <div className="text-[10px] text-steel-500 mt-0.5">{compare}</div>}
    </div>
  )
}
