import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, HumanReviewBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useChartPalette } from '../components/ui/Charts.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { SECTOR_REVENUE, TAXPAYERS } from '../data/mockData.js'
import { LIMITATION_REGISTER } from '../data/statutory.js'
import { PEER_COVERAGE, DISCOVERY_SUMMARY } from '../data/discovery.js'
import { DIMENSIONS } from '../data/similarity.js'
import { useApp, applyGlobalFilters, applyScopeFilters } from '../context/AppContext.jsx'
import { Layers, AlertTriangle, TrendingUp, Gauge, Scale } from 'lucide-react'
import { t } from '../i18n/index.js'

const tooltipStyle = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #d3d7de', boxShadow: '0 4px 16px rgba(15,35,64,0.12)' },
  labelStyle: { fontWeight: 600, color: '#0f2340' }
}

/* Median rather than mean throughout, for the reason the discovery engine gives
 * for the same choice: a handful of extreme entities drag a sector mean until
 * the sector no longer looks unusual, which is the failure mode this page
 * exists to avoid. The method itself is owned by src/data/discovery.js. */
const median = xs => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const r1 = n => (n == null ? null : Math.round(n * 10) / 10)
const sharePct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)
const deviation = (observed, benchmark) =>
  observed == null || !benchmark ? null : Math.round(((observed - benchmark) / benchmark) * 1000) / 10

const RATIO_MODES = [
  { id: 'tax', label: 'Tax to turnover', benchKey: 'avgTaxRatio', obsKey: 'obsTax', devKey: 'devTax' },
  { id: 'itc', label: 'ITC to turnover', benchKey: 'avgItcRatio', obsKey: 'obsItc', devKey: 'devItc' },
  { id: 'refund', label: 'Refund to turnover', benchKey: 'avgRefundRatio', obsKey: 'obsRefund', devKey: 'devRefund' }
]

// Sector's weight in the comparability engine — read from that engine rather
// than asserted here, so the caveat below cannot drift away from the code.
const SECTOR_DIMENSION = DIMENSIONS.find(d => d.id === 'sector')

export default function SectorIntelligence() {
  const { filters } = useApp()
  const CHART_COLORS = useChartPalette()
  const [selectedSector, setSelectedSector] = useState(
    filters.sector !== 'All Sectors' ? filters.sector : SECTOR_REVENUE[0].sector
  )
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)
  const [ratioMode, setRatioMode] = useState('itc')

  // Revenue/headcount/risk figures are recomputed from the currently filtered taxpayer pool
  // (sector itself excluded — this page compares across sectors); the three benchmark ratios
  // (avgTaxRatio/avgItcRatio/avgRefundRatio) are department-set targets, not filter-scoped.
  const globallyFilteredTaxpayers = useMemo(
    () => TAXPAYERS.filter(tp => applyGlobalFilters(tp, { ...filters, sector: 'All Sectors' })),
    [filters]
  )

  // Open proceedings and their binding deadlines, rolled up by sector. The
  // deadlines themselves are computed by the statutory engine; this only groups
  // its register, and drops the sector filter for the same reason as above.
  const limitationBySector = useMemo(() => {
    const out = {}
    LIMITATION_REGISTER
      .filter(r => applyScopeFilters(r, { ...filters, sector: 'All Sectors' }))
      .forEach(r => {
        const k = r.sector || 'Unassigned'
        if (!out[k]) out[k] = { cases: 0, exposureCr: 0, nearestDays: null, criticalCount: 0, barredCount: 0 }
        const g = out[k]
        g.cases += 1
        g.exposureCr += r.exposure / 10000000
        if (r.daysRemaining >= 0 && (g.nearestDays == null || r.daysRemaining < g.nearestDays)) g.nearestDays = r.daysRemaining
        if (r.daysRemaining >= 0 && r.daysRemaining <= 30) g.criticalCount += 1
        if (r.daysRemaining < 0) g.barredCount += 1
      })
    Object.values(out).forEach(g => { g.exposureCr = Math.round(g.exposureCr * 100) / 100 })
    return out
  }, [filters])

  const pooled = useMemo(() => ({
    taxpayers: globallyFilteredTaxpayers.length,
    revenue: globallyFilteredTaxpayers.reduce((s, tp) => s + tp.taxPaid, 0),
    highRisk: globallyFilteredTaxpayers.filter(tp => tp.risk.category === 'High' || tp.risk.category === 'Critical').length
  }), [globallyFilteredTaxpayers])

  const sectorStats = useMemo(() => SECTOR_REVENUE.map(s => {
    const members = globallyFilteredTaxpayers.filter(tp => tp.sector === s.sector)
    const withTurnover = members.filter(tp => tp.monthlyTurnover > 0)
    const revenue = members.reduce((sum, tp) => sum + tp.taxPaid, 0)
    const highRiskCount = members.filter(tp => tp.risk.category === 'High' || tp.risk.category === 'Critical').length
    const regular = members.filter(tp => tp.filingStatus === 'Regular Filer').length

    const obsTax = median(withTurnover.map(tp => tp.taxPaid / tp.monthlyTurnover))
    const obsItc = median(withTurnover.map(tp => tp.itcClaimed / tp.monthlyTurnover))
    const obsRefund = median(withTurnover.map(tp => tp.refundClaimed / tp.monthlyTurnover))

    const populationSharePct = sharePct(members.length, pooled.taxpayers)
    const highRiskSharePct = sharePct(highRiskCount, pooled.highRisk)
    const lim = limitationBySector[s.sector] || null

    return {
      ...s,
      id: s.sector,
      members,
      revenueLakh: Math.round(revenue / 100000),
      revenueSharePct: sharePct(revenue, pooled.revenue),
      taxpayerCount: members.length,
      populationSharePct,
      highRiskCount,
      highRiskSharePct,
      // Concentration: does this sector hold more of the high-risk population
      // than its size alone would produce? A ratio, so it has a denominator.
      riskConcentration: populationSharePct > 0 && highRiskSharePct != null
        ? Math.round((highRiskSharePct / populationSharePct) * 100) / 100
        : null,
      filingCompliancePct: members.length ? Math.round((regular / members.length) * 1000) / 10 : null,
      obsTax, obsItc, obsRefund,
      devTax: deviation(obsTax, s.avgTaxRatio),
      devItc: deviation(obsItc, s.avgItcRatio),
      devRefund: deviation(obsRefund, s.avgRefundRatio),
      // Counts of rules that ALREADY fired for these taxpayers — read from the
      // risk engine's stored signals, never recomputed here.
      itcSpikeFlags: members.filter(tp => tp.signals.itc_spike).length,
      refundFlags: members.filter(tp => tp.signals.refund_ratio).length,
      sectorDeviationFlags: members.filter(tp => tp.signals.sector_deviation).length,
      nonFilingFlags: members.filter(tp => tp.signals.non_filing).length,
      // Whether a peer norm can be computed for this sector at all.
      peerNormed: !PEER_COVERAGE.unNormedSectors.includes(s.sector),
      limCases: lim ? lim.cases : null,
      limExposureCr: lim ? lim.exposureCr : null,
      limNearestDays: lim ? lim.nearestDays : null,
      limCriticalCount: lim ? lim.criticalCount : null
    }
  }), [globallyFilteredTaxpayers, pooled, limitationBySector])

  const observedSectors = useMemo(() => sectorStats.filter(s => s.taxpayerCount > 0), [sectorStats])

  const medianFilingCompliance = useMemo(
    () => r1(median(observedSectors.map(s => s.filingCompliancePct).filter(v => v != null))),
    [observedSectors]
  )

  const kpis = useMemo(() => {
    const withTax = observedSectors.filter(s => s.devTax != null)
    const belowBenchmark = withTax.filter(s => s.devTax < 0)
    const widestItc = [...observedSectors]
      .filter(s => s.devItc != null)
      .sort((a, b) => Math.abs(b.devItc) - Math.abs(a.devItc))[0] || null
    // A concentration ratio computed on three taxpayers is noise; the guard is
    // the same minimum peer-group size the discovery engine applies.
    const concentrated = [...observedSectors]
      .filter(s => s.riskConcentration != null && s.taxpayerCount >= PEER_COVERAGE.minGroupSize)
      .sort((a, b) => b.riskConcentration - a.riskConcentration)[0] || null
    const topRevenue = [...observedSectors].sort((a, b) => b.revenueLakh - a.revenueLakh)[0] || null
    return { withTaxCount: withTax.length, belowBenchmarkCount: belowBenchmark.length, widestItc, concentrated, topRevenue }
  }, [observedSectors])

  const revenueBarData = useMemo(
    () => [...observedSectors]
      .sort((a, b) => b.revenueLakh - a.revenueLakh)
      .map(s => ({ sector: s.sector, revenueLakh: s.revenueLakh, revenueSharePct: s.revenueSharePct })),
    [observedSectors]
  )

  const activeMode = RATIO_MODES.find(m => m.id === ratioMode) || RATIO_MODES[1]

  const ratioCompareData = useMemo(
    () => sectorStats.map(s => ({
      sector: s.sector,
      observed: s[activeMode.obsKey] == null ? null : Math.round(s[activeMode.obsKey] * 1000) / 10,
      benchmark: Math.round(s[activeMode.benchKey] * 1000) / 10
    })),
    [sectorStats, activeMode]
  )

  const sectorRecord = useMemo(() => sectorStats.find(s => s.sector === selectedSector), [sectorStats, selectedSector])
  const sectorTaxpayersAll = useMemo(() => (sectorRecord ? sectorRecord.members : []), [sectorRecord])

  const topRiskIndicators = useMemo(() => {
    const counts = {}
    sectorTaxpayersAll.forEach(tp => {
      (tp.risk.triggeredRules || []).forEach(r => {
        counts[r.label] = (counts[r.label] || 0) + 1
      })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }))
  }, [sectorTaxpayersAll])

  const filteredSectorTaxpayers = useMemo(
    () => [...sectorTaxpayersAll].sort((a, b) => b.risk.score - a.risk.score),
    [sectorTaxpayersAll]
  )

  const topTaxpayersBySectorRisk = filteredSectorTaxpayers.slice(0, 8)

  const briefingText = () => {
    const s = sectorRecord
    return [
      t('Sector Intelligence — cross-sector benchmarking summary'),
      t('{0} of {1} sectors with observations sit below their own tax-to-turnover benchmark.', kpis.belowBenchmarkCount, kpis.withTaxCount),
      kpis.widestItc
        ? t('Widest observed gap to an own benchmark: {0}, ITC at {1}% of turnover against a {2}% benchmark ({3}%).', kpis.widestItc.sector, r1(kpis.widestItc.obsItc * 100), r1(kpis.widestItc.avgItcRatio * 100), kpis.widestItc.devItc)
        : t('No sector in scope has enough observations to compare against its ITC benchmark.'),
      kpis.concentrated
        ? t('Highest risk concentration: {0} holds {1}% of taxpayers in scope and {2}% of the High/Critical ratings, {3}x its population share.', kpis.concentrated.sector, kpis.concentrated.populationSharePct, kpis.concentrated.highRiskSharePct, kpis.concentrated.riskConcentration)
        : t('No sector in scope meets the minimum group size for a risk-concentration figure.'),
      s ? t('Selected sector {0}: {1} taxpayers, {2}% of pooled tax paid, filing compliance {3}% against a cross-sector median of {4}%.', s.sector, s.taxpayerCount, s.revenueSharePct == null ? 0 : s.revenueSharePct, s.filingCompliancePct == null ? 0 : s.filingCompliancePct, medianFilingCompliance == null ? 0 : medianFilingCompliance) : '',
      t('Sector is a descriptive dimension carrying {0}% weight in the comparability engine. Nothing on this page is evidence about an individual taxpayer.', Math.round(SECTOR_DIMENSION.weight * 100))
    ].filter(Boolean).join('\n')
  }

  const registerColumns = [
    {
      key: 'tradeName', label: 'Taxpayer', render: row => (
        <div>
          <div className="font-semibold text-navy-800">{row.tradeName}</div>
          <div className="text-[11px] text-steel-500">{row.gstin}</div>
        </div>
      )
    },
    { key: 'district', label: 'District', render: r => t(r.district) },
    { key: 'filingStatus', label: 'Filing Status', render: row => t(row.filingStatus) },
    {
      key: 'itc', label: 'ITC vs sector benchmark', align: 'right',
      sortValue: row => (row.monthlyTurnover > 0 ? row.itcClaimed / row.monthlyTurnover : 0),
      render: row => {
        if (!sectorRecord || row.monthlyTurnover <= 0) return '—'
        const ratio = row.itcClaimed / row.monthlyTurnover
        const dev = deviation(ratio, sectorRecord.avgItcRatio)
        return (
          <div>
            <div className="font-semibold text-navy-800">{r1(ratio * 100)}%</div>
            <div className="text-[10.5px] text-steel-500">{dev > 0 ? `+${dev}%` : `${dev}%`}</div>
          </div>
        )
      }
    },
    {
      key: 'risk', label: 'Risk', align: 'right', sortValue: row => row.risk.score,
      render: row => <RiskBadge category={row.risk.category} score={row.risk.score} size="sm" />
    }
  ]

  const benchmarkColumns = [
    {
      key: 'sector', label: 'Sector',
      render: s => (
        <button onClick={() => setSelectedSector(s.sector)} className="text-left">
          <div className="font-semibold text-navy-800">{t(s.sector)}</div>
          {!s.peerNormed && <div className="text-[10.5px] text-steel-500">{t('below peer-norm size')}</div>}
        </button>
      )
    },
    {
      key: 'taxpayerCount', label: 'Taxpayers', align: 'right', sortValue: s => s.taxpayerCount,
      render: s => (
        <div>
          <div className="font-semibold text-navy-800">{s.taxpayerCount}</div>
          <div className="text-[10.5px] text-steel-500">{t('{0}% of pool', s.populationSharePct == null ? 0 : s.populationSharePct)}</div>
        </div>
      )
    },
    {
      key: 'devTax', label: 'Tax ratio vs own benchmark', align: 'right',
      sortValue: s => (s.devTax == null ? -9999 : s.devTax),
      render: s => s.devTax == null
        ? <span className="text-steel-400">{t('no observations')}</span>
        : (
          <div>
            <div className="font-semibold text-navy-800">{t('{0}% vs {1}%', r1(s.obsTax * 100), r1(s.avgTaxRatio * 100))}</div>
            <div className={`text-[10.5px] ${s.devTax < 0 ? 'text-maharisk-critical' : 'text-emerald-700'}`}>{s.devTax > 0 ? `+${s.devTax}%` : `${s.devTax}%`}</div>
          </div>
        )
    },
    {
      key: 'devItc', label: 'ITC ratio vs own benchmark', align: 'right',
      sortValue: s => (s.devItc == null ? -9999 : s.devItc),
      render: s => s.devItc == null
        ? <span className="text-steel-400">{t('no observations')}</span>
        : (
          <div>
            <div className="font-semibold text-navy-800">{t('{0}% vs {1}%', r1(s.obsItc * 100), r1(s.avgItcRatio * 100))}</div>
            <div className={`text-[10.5px] ${s.devItc > 0 ? 'text-maharisk-high' : 'text-steel-500'}`}>{s.devItc > 0 ? `+${s.devItc}%` : `${s.devItc}%`}</div>
          </div>
        )
    },
    {
      key: 'filingCompliancePct', label: 'Filing compliance', align: 'right',
      sortValue: s => (s.filingCompliancePct == null ? -1 : s.filingCompliancePct),
      render: s => s.filingCompliancePct == null
        ? <span className="text-steel-400">{t('no observations')}</span>
        : (
          <div>
            <div className="font-semibold text-navy-800">{s.filingCompliancePct}%</div>
            <div className="text-[10.5px] text-steel-500">{t('median {0}%', medianFilingCompliance == null ? 0 : medianFilingCompliance)}</div>
          </div>
        )
    },
    {
      key: 'riskConcentration', label: 'High/Critical concentration', align: 'right',
      sortValue: s => (s.riskConcentration == null ? -1 : s.riskConcentration),
      render: s => s.riskConcentration == null
        ? <span className="text-steel-400">{t('no observations')}</span>
        : (
          <div>
            <Pill tone={s.riskConcentration >= 1.5 ? 'red' : s.riskConcentration >= 1 ? 'amber' : 'green'}>{t('{0}x share', s.riskConcentration)}</Pill>
            <div className="text-[10.5px] text-steel-500 mt-0.5">{t('{0} of {1} flagged', s.highRiskCount, s.taxpayerCount)}</div>
          </div>
        )
    },
    {
      key: 'limNearestDays', label: 'Nearest statutory deadline', align: 'right',
      sortValue: s => (s.limNearestDays == null ? 99999 : s.limNearestDays),
      render: s => s.limCases == null
        ? <span className="text-steel-400">{t('No open proceeding')}</span>
        : (
          <div>
            <Pill tone={s.limNearestDays != null && s.limNearestDays <= 30 ? 'red' : s.limNearestDays != null && s.limNearestDays <= 90 ? 'amber' : 'green'}>
              {s.limNearestDays == null ? t('all past deadline') : t('{0} days', s.limNearestDays)}
            </Pill>
            <div className="text-[10.5px] text-steel-500 mt-0.5">{t('{0} cases · ₹{1} Cr', s.limCases, s.limExposureCr)}</div>
          </div>
        )
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Sector Benchmarking')}
        title={t('Sector Intelligence')}
        description={<MethodNote short={t('Each sector against its own benchmark, not against another sector\'s.')} full={t("Each sector measured against its own benchmark, its share of the population and its statutory clock — what behaviour actually looks like inside a sector, not what the reference table says it should.")} />}
        actions={<ExportBar moduleLabel="Sector Intelligence" getBriefingText={briefingText} />}
      />

      <FilterScope shown={globallyFilteredTaxpayers.length} total={TAXPAYERS.length} unit={t('taxpayers')}
        ignores={{
          sector: 'Dropped on purpose: this screen exists to compare sectors against one another, and narrowing to a single sector would leave nothing to compare it with. Pick a sector in the selector below instead.',
          dateRange: 'This screen reads a current-state register rather than a stream of dated events, so there is no date on the records to narrow against.'
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Sectors Below Own Tax Benchmark')}
          value={kpis.belowBenchmarkCount}
          unit={t('of {0} with observations', kpis.withTaxCount)}
          icon={Gauge}
          tone={kpis.belowBenchmarkCount > 0 ? 'red' : 'green'}
        />
        <KpiCard
          label={t('Widest Gap to Own ITC Benchmark')}
          value={kpis.widestItc ? t(kpis.widestItc.sector) : t('None observed')}
          unit={kpis.widestItc
            ? t('observed {0}% vs benchmark {1}%', r1(kpis.widestItc.obsItc * 100), r1(kpis.widestItc.avgItcRatio * 100))
            : t('no sector has observations in scope')}
          icon={Scale}
          tone="orange"
          onClick={kpis.widestItc ? () => setSelectedSector(kpis.widestItc.sector) : undefined}
        />
        <KpiCard
          label={t('Highest Risk Concentration')}
          value={kpis.concentrated ? t(kpis.concentrated.sector) : t('None observed')}
          unit={kpis.concentrated
            ? t('{0}x its share of the population', kpis.concentrated.riskConcentration)
            : t('no sector meets the minimum group size')}
          icon={AlertTriangle}
          tone="red"
          onClick={kpis.concentrated ? () => setSelectedSector(kpis.concentrated.sector) : undefined}
        />
        <KpiCard
          label={t('Largest Revenue Share')}
          value={kpis.topRevenue ? t(kpis.topRevenue.sector) : t('None observed')}
          unit={kpis.topRevenue
            ? t('{0}% of ₹{1}L pooled tax paid', kpis.topRevenue.revenueSharePct, Math.round(pooled.revenue / 100000).toLocaleString('en-IN'))
            : t('no taxpayers in scope')}
          icon={TrendingUp}
          tone="saffron"
          onClick={kpis.topRevenue ? () => setSelectedSector(kpis.topRevenue.sector) : undefined}
        />
      </div>

      <Card tone="yellow" className="mb-6">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-lg bg-steel-100 text-steel-600 shrink-0"><Layers className="w-4 h-4" /></span>
          <div className="text-xs text-steel-600 space-y-1.5">
            <div className="text-xs font-semibold text-navy-800">{t('What a sector comparison can and cannot support')}</div>
            <MethodNote short={t('A statement about a population, never about one taxpayer.')} full={t('Sector is a descriptive attribute. The comparability engine weights it at {0}% — the lowest weight of any dimension it carries — because it is the dimension that looks most relevant and predicts outcomes least. Everything on this page is therefore a statement about a POPULATION: where a sector as a whole sits against its own benchmark, and where the department should look first.', Math.round(SECTOR_DIMENSION.weight * 100))} />
            <MethodNote className="font-medium text-navy-800" short={t('Sector membership is never grounds for a notice or an adverse inference.')} full={t('It is never evidence about an individual taxpayer. A taxpayer does not become suspect by belonging to a deviating sector, and no notice, scrutiny selection or adverse inference may rest on sector membership. Individual risk is scored separately, per taxpayer, from the rules that actually fired against that taxpayer.')} />
            <p>
              {t('Sector is also taken from the registration record. A misclassified taxpayer is measured against the wrong peers and will appear anomalous for that reason alone.')}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card tone="green"
          title={t('Tax Revenue Collected by Sector')}
          subtitle={t('Tax paid by the {0} taxpayers in scope, ₹{1}L pooled — bar height is absolute, the share of the pool is in the tooltip', pooled.taxpayers, Math.round(pooled.revenue / 100000).toLocaleString('en-IN'))}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueBarData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="sector" tickFormatter={t} tick={{ fontSize: 9.5, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} />
              <Tooltip
                {...tooltipStyle}
                formatter={(value, name, entry) => [
                  t('₹{0}L · {1}% of pooled tax paid', value.toLocaleString('en-IN'), entry.payload.revenueSharePct == null ? 0 : entry.payload.revenueSharePct),
                  t('Revenue')
                ]}
              />
              <Bar dataKey="revenueLakh" name={t('Revenue (₹L)')} radius={[4, 4, 0, 0]}>
                {revenueBarData.map((d, i) => (
                  <Cell key={i} fill={d.sector === selectedSector ? CHART_COLORS[1] : CHART_COLORS[0]} cursor="pointer" onClick={() => setSelectedSector(d.sector)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card tone="blue"
          title={t('Observed Behaviour Against the Department Benchmark')}
          subtitle={<MethodNote short={t('The median taxpayer in each sector, against that sector\'s benchmark.')} full={t('Median observed ratio in each sector against the reference benchmark set for that sector — the benchmark alone says nothing until something is measured against it')} />}
          actions={
            <div className="flex items-center gap-1 text-xs">
              {RATIO_MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setRatioMode(m.id)}
                  className={`px-2.5 py-1 rounded-md border font-medium ${ratioMode === m.id ? 'bg-ink-700 text-white border-ink-700' : 'bg-white border-steel-200 text-steel-600'}`}
                >{t(m.label)}</button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratioCompareData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaee" vertical={false} />
              <XAxis dataKey="sector" tickFormatter={t} tick={{ fontSize: 9.5, fill: '#8791a3' }} axisLine={{ stroke: '#d3d7de' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 10, fill: '#8791a3' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="observed" name={t('Observed median (%)')} fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="benchmark" name={t('Department benchmark (%)')} fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <MethodNote className="text-[11px] text-steel-500 mt-2" short={t('The median, not the mean — a mean is dragged by the outliers sought.')} full={t('Observed is the MEDIAN taxpayer in the sector, not the mean: a mean would be dragged by the same outliers the department is looking for. A sector with no bar has no taxpayers in the current filter scope, which is not the same as a sector at zero.')} />
        </Card>
      </div>

      <Card tone="red" title={t('Sector Picker')} subtitle={t('Select a sector for a detailed intelligence panel')} className="mb-6">
        <div className="flex flex-wrap gap-2">
          {sectorStats.map(s => (
            <button
              key={s.sector}
              onClick={() => setSelectedSector(s.sector)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                selectedSector === s.sector
                  ? 'bg-ink-700 text-white border-ink-700'
                  : 'bg-white text-navy-700 border-steel-200 hover:bg-steel-50'
              }`}
            >
              {t(s.sector)}
              {s.highRiskCount > 0 && (
                <span className={`ml-1.5 ${selectedSector === s.sector ? 'text-saffron-300' : 'text-maharisk-high'}`}>
                  · {s.highRiskCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {sectorRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card tone="yellow" title={t('{0} — Sector Profile', sectorRecord.sector)} className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Stat
                label={t('Tax to Turnover')}
                value={sectorRecord.obsTax == null ? t('n/a') : t('{0}%', r1(sectorRecord.obsTax * 100))}
                compare={t('benchmark {0}%', r1(sectorRecord.avgTaxRatio * 100))}
                delta={sectorRecord.devTax}
                deltaGoodWhen="high"
              />
              <Stat
                label={t('ITC to Turnover')}
                value={sectorRecord.obsItc == null ? t('n/a') : t('{0}%', r1(sectorRecord.obsItc * 100))}
                compare={t('benchmark {0}%', r1(sectorRecord.avgItcRatio * 100))}
                delta={sectorRecord.devItc}
                deltaGoodWhen="low"
              />
              <Stat
                label={t('Refund to Turnover')}
                value={sectorRecord.obsRefund == null ? t('n/a') : t('{0}%', r1(sectorRecord.obsRefund * 100))}
                compare={t('benchmark {0}%', r1(sectorRecord.avgRefundRatio * 100))}
                delta={sectorRecord.devRefund}
                deltaGoodWhen="low"
              />
              <Stat
                label={t('Filing Compliance')}
                value={sectorRecord.filingCompliancePct == null ? t('n/a') : t('{0}%', sectorRecord.filingCompliancePct)}
                compare={t('cross-sector median {0}%', medianFilingCompliance == null ? 0 : medianFilingCompliance)}
              />
              <Stat
                label={t('Taxpayers in Sector')}
                value={sectorRecord.taxpayerCount}
                compare={t('{0}% of the {1} in scope', sectorRecord.populationSharePct == null ? 0 : sectorRecord.populationSharePct, pooled.taxpayers)}
              />
              <Stat
                label={t('Revenue Contribution')}
                value={t('₹{0}L', sectorRecord.revenueLakh.toLocaleString('en-IN'))}
                compare={t('{0}% of pooled tax paid', sectorRecord.revenueSharePct == null ? 0 : sectorRecord.revenueSharePct)}
              />
              <Stat
                label={t('High / Critical')}
                value={sectorRecord.highRiskCount}
                compare={sectorRecord.riskConcentration == null
                  ? t('no taxpayers in scope')
                  : t('{0}x its population share', sectorRecord.riskConcentration)}
              />
              <Stat
                label={t('Open Proceedings')}
                value={sectorRecord.limCases == null ? t('none') : sectorRecord.limCases}
                compare={sectorRecord.limCases == null
                  ? t('not in the limitation register')
                  : t('₹{0} Cr · nearest {1}d', sectorRecord.limExposureCr, sectorRecord.limNearestDays == null ? 0 : sectorRecord.limNearestDays)}
              />
            </div>

            {!sectorRecord.peerNormed && (
              <div className="mt-3 rounded-lg border border-steel-200 bg-steel-50 p-3 text-[11px] text-steel-600">
                {t('This sector holds fewer than {0} taxpayers, the minimum the platform requires before a peer norm is worth computing. Its taxpayers are UNASSESSED against a peer median, which is not the same as being clear of one.', PEER_COVERAGE.minGroupSize)}
              </div>
            )}

            <div
              className="mt-4 rounded-lg border p-3 text-xs"
              style={sectorRecord.devItc != null && Math.abs(sectorRecord.devItc) > 20
                ? { backgroundColor: TONE_STYLES.orange.bg, borderColor: TONE_STYLES.orange.border }
                : { backgroundColor: TONE_STYLES.steel.bg, borderColor: TONE_STYLES.steel.border }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-navy-800 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: sectorRecord.devItc != null && Math.abs(sectorRecord.devItc) > 20 ? TONE_STYLES.orange.accent : TONE_STYLES.steel.accent }} />
                {t('Sector Benchmark Variance')}
              </div>
              {sectorRecord.devItc == null ? (
                <p className="text-steel-600">{t('No taxpayer in this sector falls inside the current filter scope, so no observed ratio can be stated. This is an absence of data, not a clean result.')}</p>
              ) : (
                <p className="text-steel-600">
                  {t('The median taxpayer in {0} claims ITC at {1}% of turnover against the {2}% benchmark set for this sector', sectorRecord.sector, r1(sectorRecord.obsItc * 100), r1(sectorRecord.avgItcRatio * 100))}{' '}
                  <strong className={sectorRecord.devItc >= 0 ? 'text-maharisk-high' : 'text-maharisk-low'}>
                    {sectorRecord.devItc >= 0 ? '+' : ''}{sectorRecord.devItc}%
                  </strong>{' '}
                  {t('Within this sector the encoded rules have already fired on {0} taxpayers for an ITC spike, {1} for refund ratio and {2} for deviation from the sector benchmark, out of {3} in scope. Those are the taxpayers with an individual case to answer; the sector figure is not.', sectorRecord.itcSpikeFlags, sectorRecord.refundFlags, sectorRecord.sectorDeviationFlags, sectorRecord.taxpayerCount)}
                </p>
              )}
              <div className="mt-2"><HumanReviewBadge label={t('Sector-level finding — verify per taxpayer before any action')} /></div>
            </div>
          </Card>

          <Card tone="green"
            title={t('Top Triggered Risk Indicators')}
            subtitle={t('Share of the {0} taxpayers in this sector on which each rule fired', sectorTaxpayersAll.length)}
            className="lg:col-span-1"
          >
            {topRiskIndicators.length === 0 ? (
              <p className="text-xs text-steel-500">{t('No risk rules triggered among taxpayers in this sector.')}</p>
            ) : (
              <div className="space-y-2.5">
                {topRiskIndicators.map(r => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-medium text-navy-800">{t(r.label)}</span>
                      <span className="text-steel-500">
                        {t('{0} of {1} · {2}%', r.count, sectorTaxpayersAll.length, sharePct(r.count, sectorTaxpayersAll.length))}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-steel-100 overflow-hidden">
                      <div
                        className="h-full bg-ink-600"
                        style={{ width: `${Math.min(100, (r.count / (sectorTaxpayersAll.length || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <MethodNote className="text-[11px] text-steel-500 pt-1" short={t('Scaled against the whole sector, so a third of the sector is a third of the bar.')} full={t('Bars are scaled against the whole sector population, so a rule firing on a third of the sector reads as a third of the bar. The rules are the department’s own encoded indicators; a count here is a count of taxpayers who each independently triggered it.')} />
              </div>
            )}
          </Card>

          <Card tone="blue"
            title={t('Top Taxpayers by Risk')}
            subtitle={t('Ranked by their own risk score, respecting global district / risk filters')}
            className="lg:col-span-1"
          >
            {topTaxpayersBySectorRisk.length === 0 ? (
              <p className="text-xs text-steel-500">{t('No taxpayers match the current global filters within this sector.')}</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  {topTaxpayersBySectorRisk.map(tp => (
                    <button
                      key={tp.id}
                      onClick={() => setSelectedTaxpayer(tp)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-steel-200 hover:bg-navy-50/60 text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-navy-800 truncate">{tp.tradeName}</div>
                        <div className="text-[11px] text-steel-500 truncate">
                          {t(tp.district)} · {t('{0} rule(s) fired', (tp.risk.triggeredRules || []).length)}
                        </div>
                      </div>
                      <RiskBadge category={tp.risk.category} score={tp.risk.score} size="sm" />
                    </button>
                  ))}
                </div>
                <MethodNote className="text-[11px] text-steel-500 mt-2.5" short={t('Scored per taxpayer. The sector contributed nothing to the score.')} full={t('These scores come from the rules that fired against each taxpayer individually. Their sector contributed nothing to the score, and appearing in a deviating sector is not itself an indicator.')} />
              </>
            )}
          </Card>
        </div>
      )}

      <Card tone="red"
        title={t('Cross-Sector Benchmark Table')}
        subtitle={t('Every sector against its own benchmark, its share of the population and its nearest statutory deadline')}
        className="mb-6"
      >
        <DataTable
          columns={benchmarkColumns}
          rows={sectorStats}
          searchable={false}
          pageSize={SECTOR_REVENUE.length}
          emptyLabel="No sectors match the current global filters."
        />
        <div className="mt-3 space-y-1.5">
          <MethodNote className="text-[11px] text-steel-500" short={t('Each sector against its own benchmark — ratios are not comparable across sectors.')} full={t('Each sector is compared to ITS OWN benchmark, never to another sector’s: an ITC ratio that is ordinary in wholesale trading is extraordinary in professional services, so a single cross-sector line would mostly rediscover which sectors exist.')} />
          <MethodNote className="text-[11px] text-steel-500" short={t('Concentration is the flagged share divided by the population share.')} full={t('Concentration is a sector’s share of the High/Critical population divided by its share of the taxpayer population — 1.0x means exactly as many flagged taxpayers as its size predicts. Sectors below the {0}-taxpayer minimum are marked, because a ratio drawn from three businesses is not a norm. Deadlines and exposure are the limitation engine’s own figures, grouped by sector here and computed nowhere but there.', PEER_COVERAGE.minGroupSize)} />
        </div>
      </Card>

      <Card tone="yellow"
        title={t('{0} — Taxpayer Register', selectedSector)}
        subtitle={t('Every taxpayer in this sector with their own ITC ratio against the sector benchmark (respects global filters)')}
      >
        <DataTable
          columns={registerColumns}
          rows={filteredSectorTaxpayers}
          onRowClick={row => setSelectedTaxpayer(row)}
          searchPlaceholder="Search taxpayer / GSTIN..."
        />
        <MethodNote className="text-[11px] text-steel-500 mt-3" short={t('Above the benchmark is a question, not a finding. No threshold applies here.')} full={t('A taxpayer above the sector benchmark is a question, not a finding. Peer-relative outlier detection across the unflagged population is a separate screen with a stated threshold (modified z of {0}); this column is a plain ratio against the reference benchmark and carries no threshold at all.', DISCOVERY_SUMMARY.zThreshold)} />
      </Card>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function Stat({ label, value, compare, delta, deltaGoodWhen }) {
  const deltaTone = delta == null
    ? 'text-steel-500'
    : (deltaGoodWhen === 'low' ? delta > 0 : delta < 0)
      ? 'text-maharisk-high'
      : 'text-emerald-700'
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className="text-sm font-bold text-navy-900 mt-0.5">{value}</div>
      {compare && <div className="text-[10px] text-steel-500 mt-0.5">{compare}</div>}
      {delta != null && (
        <div className={`text-[10px] font-semibold mt-0.5 ${deltaTone}`}>{delta > 0 ? `+${delta}%` : `${delta}%`}</div>
      )}
    </div>
  )
}
