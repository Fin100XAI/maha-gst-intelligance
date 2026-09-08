import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, HumanReviewBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { RiskBarChart } from '../components/ui/Charts.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { AIOutputPanel } from '../components/ui/AIOutputPanel.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { TAXPAYERS, SECTOR_REVENUE } from '../data/mockData.js'
import { explainRiskScore, RISK_COLORS, RISK_RULES } from '../data/risk.js'
import { generateAuditChecklist } from '../data/ai.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { TrendingUp, ShieldAlert, Percent, Layers, ChevronDown } from 'lucide-react'

/* The sector benchmark row for a taxpayer. A lookup, not a computation — the
 * benchmark ratios are the sector definitions the whole platform scores
 * against, and nothing here recomputes them. */
const benchmarkFor = sector => SECTOR_REVENUE.find(s => s.sector === sector)

/* Every callback below takes `tp`, never `t`. A parameter named `t` shadows the
 * translator, and `{t(t.label)}` compiles cleanly and then throws at runtime. */
const CATEGORIES = [
  {
    id: 'itc_spike',
    label: 'Abnormal ITC Spike',
    description: 'Input tax credit claimed materially exceeds trailing average / sector norm.',
    action: 'Reconcile the claimed credit against GSTR-2B for the trailing six periods before any further set-off is allowed.',
    match: tp => tp.signals.itc_spike
  },
  {
    id: 'supplier_mismatch',
    label: 'Supplier Mismatch',
    description: 'Upstream supplier independently carries a High risk rating, or a supplier-risk signal is triggered.',
    action: 'Verify the upstream supplier’s own filing status before treating the credit as available — a credit is only as good as the return behind it.',
    match: tp => tp.signals.supplier_risk || tp.supplierRisk === 'High'
  },
  {
    id: 'circular_signal',
    label: 'Circular ITC Suspicion',
    description: 'Invoice flow pattern consistent with circular trading among linked counterparties.',
    action: 'Route to Network Intelligence rather than acting alone — a chain is broken at one entity, and which one is a question that screen answers.',
    match: tp => tp.signals.circular_signal
  },
  {
    id: 'eway_mismatch',
    label: 'ITC Without Corresponding Supply Pattern',
    description: 'E-way bill movement value is inconsistent with declared outward supply — credit claimed without matching movement.',
    action: 'Cross-check the consignment record against the filed return for the same period before scrutiny is opened.',
    match: tp => tp.signals.eway_mismatch
  },
  {
    id: 'sector_deviation',
    label: 'Sector Deviation',
    description: 'Tax-to-turnover ratio deviates materially from the peer sector benchmark.',
    action: 'Confirm the registered sector is correct first — a misclassified taxpayer deviates from the wrong benchmark and is not a case.',
    match: tp => tp.signals.sector_deviation
  }
]

/* An ITC-category signal of any kind. Used for the headline figures so that
 * "ITC risk" on the tiles means the same thing as the categories underneath. */
const hasItcSignal = tp =>
  tp.signals.itc_spike || tp.signals.circular_signal || tp.signals.eway_mismatch ||
  tp.signals.supplier_risk || tp.signals.sector_deviation

const PAGE_STEP = 6
const pctOf = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0)

export default function ITCRiskIntelligence() {
  const { filters } = useApp()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP)
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  const pool = useMemo(() => TAXPAYERS.filter(tp => applyGlobalFilters(tp, filters)), [filters])

  /* Each headline figure carries its own denominator and its comparator. A
   * total ITC exposure on its own says only how large the taxpayer base is;
   * the share of that credit sitting behind a risk signal is the figure that
   * decides whether an officer opens this screen at all. */
  const kpis = useMemo(() => {
    const totalItc = pool.reduce((s, tp) => s + tp.itcClaimed, 0)
    const flagged = pool.filter(hasItcSignal)
    const flaggedItc = flagged.reduce((s, tp) => s + tp.itcClaimed, 0)
    const avgRatio = pool.length
      ? pool.reduce((s, tp) => s + tp.itcClaimed / Math.max(1, tp.monthlyTurnover), 0) / pool.length
      : 0
    // The benchmark for this mix of sectors, not a single national figure —
    // an ITC ratio is only high or low relative to the trade being carried on.
    const avgBenchmark = pool.length
      ? pool.reduce((s, tp) => s + (benchmarkFor(tp.sector)?.avgItcRatio ?? 0), 0) / pool.length
      : 0
    const topTen = [...flagged].sort((a, b) => b.itcClaimed - a.itcClaimed).slice(0, 10)
    const topTenItc = topTen.reduce((s, tp) => s + tp.itcClaimed, 0)
    return {
      totalItc,
      flaggedCount: flagged.length,
      flaggedItc,
      flaggedSharePct: pctOf(flaggedItc, totalItc),
      flaggedRatePct: pctOf(flagged.length, pool.length),
      stateRatePct: pctOf(TAXPAYERS.filter(hasItcSignal).length, TAXPAYERS.length),
      avgRatioPct: Math.round(avgRatio * 1000) / 10,
      benchmarkPct: Math.round(avgBenchmark * 1000) / 10,
      gapPp: Math.round((avgRatio - avgBenchmark) * 1000) / 10,
      topTenCount: topTen.length,
      topTenSharePct: pctOf(topTenItc, flaggedItc)
    }
  }, [pool])

  /* Sector view. The bar is now the gap against the sector's own benchmark
   * rather than the benchmark itself — a benchmark is not a finding, and
   * plotting it produced a chart where the tallest bar was simply the trade
   * that carries the most input credit by nature. */
  const sectorAnalysis = useMemo(
    () => SECTOR_REVENUE
      .filter(s => filters.sector === 'All Sectors' || s.sector === filters.sector)
      .map(s => {
        const members = pool.filter(tp => tp.sector === s.sector)
        const itcTotal = members.reduce((sum, tp) => sum + tp.itcClaimed, 0)
        const actual = members.length
          ? members.reduce((sum, tp) => sum + tp.itcClaimed / Math.max(1, tp.monthlyTurnover), 0) / members.length
          : 0
        return {
          id: s.sector,
          sector: s.sector,
          taxpayers: members.length,
          actualPct: Math.round(actual * 1000) / 10,
          benchmarkPct: Math.round(s.avgItcRatio * 1000) / 10,
          gapPp: Math.round((actual - s.avgItcRatio) * 1000) / 10,
          highRiskCount: members.filter(tp => tp.risk.category === 'High' || tp.risk.category === 'Critical').length,
          itcCr: Math.round((itcTotal / 10000000) * 100) / 100
        }
      })
      .filter(row => row.taxpayers > 0)
      .sort((a, b) => b.gapPp - a.gapPp),
    [pool, filters.sector]
  )

  /* The module's actual thesis, and the thing the previous version of this
   * screen never showed: credit intensity set against the filing and payment
   * behaviour of the entity claiming it. A high ITC ratio in a regular filer
   * paying tax at the sector rate is a business model. The same ratio in a
   * non-filer is the case. */
  const behaviour = useMemo(() => {
    const totalItc = pool.reduce((s, tp) => s + tp.itcClaimed, 0)
    return ['Regular Filer', 'Late Filer', 'Non-Filer']
      .map(status => {
        const members = pool.filter(tp => tp.filingStatus === status)
        const n = members.length
        const avg = fn => (n ? members.reduce((s, tp) => s + fn(tp), 0) / n : 0)
        const itcTotal = members.reduce((s, tp) => s + tp.itcClaimed, 0)
        const headcountSharePct = pctOf(n, pool.length)
        const itcSharePct = pctOf(itcTotal, totalItc)
        return {
          id: status,
          status,
          count: n,
          headcountSharePct,
          itcRatioPct: Math.round(avg(tp => tp.itcClaimed / Math.max(1, tp.monthlyTurnover)) * 1000) / 10,
          itcBenchmarkPct: Math.round(avg(tp => benchmarkFor(tp.sector)?.avgItcRatio ?? 0) * 1000) / 10,
          taxRatioPct: Math.round(avg(tp => tp.taxPaid / Math.max(1, tp.monthlyTurnover)) * 1000) / 10,
          taxBenchmarkPct: Math.round(avg(tp => benchmarkFor(tp.sector)?.avgTaxRatio ?? 0) * 1000) / 10,
          itcCr: Math.round((itcTotal / 10000000) * 100) / 100,
          itcSharePct,
          // Above 1.0 this filing class holds more credit than its share of the
          // headcount — which is where officer time belongs.
          concentration: headcountSharePct > 0 ? Math.round((itcSharePct / headcountSharePct) * 100) / 100 : null
        }
      })
      .filter(row => row.count > 0)
  }, [pool])

  const categoryMatches = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory)
    return pool.filter(cat.match).sort((a, b) => b.risk.score - a.risk.score)
  }, [pool, activeCategory])

  const visibleMatches = categoryMatches.slice(0, visibleCount)
  const activeCat = CATEGORIES.find(c => c.id === activeCategory)
  const categoryItcCr = useMemo(
    () => Math.round((categoryMatches.reduce((s, tp) => s + tp.itcClaimed, 0) / 10000000) * 100) / 100,
    [categoryMatches]
  )

  const handleCategoryChange = id => {
    setActiveCategory(id)
    setVisibleCount(PAGE_STEP)
  }

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · ITC Intelligence')}
        title={t('ITC Risk Intelligence')}
        description={<MethodNote short={t('Credit scored against the filing and payment behaviour behind it.')} full={t('Input tax credit scored against the filing and payment behaviour of the entity claiming it. Every ratio here is set against the benchmark for that taxpayer’s own sector, because credit intensity is a property of the trade before it is a property of the taxpayer.')} />}
        actions={<ExportBar />}
      />

      <FilterScope shown={pool.length} total={TAXPAYERS.length} unit={t('taxpayers')}
        ignores={{
          dateRange: 'ITC ratios describe a taxpayer as they stand today, computed from the whole filing history rather than from returns inside a window.'
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('ITC behind a risk signal')}
          value={`₹${(kpis.flaggedItc / 10000000).toFixed(2)}`}
          unit={t('Cr of ₹{0} Cr claimed in scope — {1}% of the credit', (kpis.totalItc / 10000000).toFixed(2), kpis.flaggedSharePct)}
          tone="red"
          icon={ShieldAlert}
        />
        <KpiCard
          label={t('Taxpayers carrying an ITC signal')}
          value={kpis.flaggedCount.toLocaleString('en-IN')}
          unit={t('of {0} in scope ({1}%) — the statewide rate is {2}%', pool.length, kpis.flaggedRatePct, kpis.stateRatePct)}
          tone="navy"
          icon={TrendingUp}
        />
        <KpiCard
          label={t('ITC-to-turnover against sector benchmark')}
          value={`${kpis.avgRatioPct}%`}
          unit={kpis.gapPp >= 0
            ? t('against a {0}% benchmark for this mix of sectors — {1} pp above', kpis.benchmarkPct, Math.abs(kpis.gapPp))
            : t('against a {0}% benchmark for this mix of sectors — {1} pp below', kpis.benchmarkPct, Math.abs(kpis.gapPp))}
          tone="saffron"
          icon={Percent}
        />
        <KpiCard
          label={t('Concentration of flagged credit')}
          value={`${kpis.topTenSharePct}%`}
          unit={t('of flagged ITC sits with the {0} largest claimants — where officer time returns most', kpis.topTenCount)}
          tone="steel"
          icon={Layers}
        />
      </div>

      <Card
        title={t('Credit intensity against filing and payment behaviour')}
        subtitle={<MethodNote short={t('Credit taken now, by an entity whose behaviour does not support it.')} full={t('The combination this module exists to surface: credit taken now, by an entity whose return and payment behaviour does not support it. Read the last column first.')} />}
        className="mb-6"
      >
        <DataTable
          columns={[
            { key: 'status', label: t('Filing behaviour'), render: row => <Pill tone={row.status === 'Non-Filer' ? 'red' : row.status === 'Late Filer' ? 'amber' : 'green'}>{t(row.status)}</Pill> },
            {
              key: 'count', label: t('Taxpayers'), align: 'right',
              sortValue: row => row.count,
              render: row => (
                <div className="tabular-nums">
                  <div className="font-semibold text-navy-900">{row.count}</div>
                  <div className="text-[11px] text-steel-500">{t('{0}% of those in scope', row.headcountSharePct)}</div>
                </div>
              )
            },
            {
              key: 'itcRatioPct', label: t('ITC / turnover vs benchmark'), align: 'right',
              sortValue: row => row.itcRatioPct - row.itcBenchmarkPct,
              render: row => (
                <div className="tabular-nums">
                  <div className="text-navy-900">{t('{0}%', row.itcRatioPct)}</div>
                  <div className="text-[11px] text-steel-500">{t('benchmark {0}%', row.itcBenchmarkPct)}</div>
                </div>
              )
            },
            {
              key: 'taxRatioPct', label: t('Tax paid / turnover vs benchmark'), align: 'right',
              sortValue: row => row.taxRatioPct - row.taxBenchmarkPct,
              render: row => (
                <div className="tabular-nums">
                  <div className="text-navy-900">{t('{0}%', row.taxRatioPct)}</div>
                  <div className="text-[11px] text-steel-500">{t('benchmark {0}%', row.taxBenchmarkPct)}</div>
                </div>
              )
            },
            {
              key: 'itcCr', label: t('ITC claimed'), align: 'right',
              sortValue: row => row.itcCr,
              render: row => (
                <div className="tabular-nums">
                  <div className="text-navy-900">{t('₹{0} Cr', row.itcCr)}</div>
                  <div className="text-[11px] text-steel-500">{t('{0}% of credit in scope', row.itcSharePct)}</div>
                </div>
              )
            },
            {
              key: 'concentration', label: t('Credit held against headcount'), align: 'right',
              sortValue: row => row.concentration ?? 0,
              render: row => row.concentration == null
                ? <span className="text-steel-400">—</span>
                : (
                  <span className={`tabular-nums font-semibold ${row.concentration > 1 ? 'text-[#C5221F]' : 'text-steel-600'}`}>
                    {t('{0}×', row.concentration)}
                  </span>
                )
            }
          ]}
          rows={behaviour}
          searchable={false}
          pageSize={5}
        />
        <MethodNote className="text-[12px] text-steel-600 leading-relaxed mt-3" short={t('Above 1.0 means credit is concentrating where it is least substantiated.')} full={t('A value above 1.0 in the last column means that filing class holds more of the credit than its share of the taxpayers — credit concentrating in the group least able to substantiate it. Below 1.0 it is the opposite, and the class is not where scrutiny belongs. The comparison is only valid inside the current filters: narrow to a district and the benchmark column moves with the sector mix of that district.')} />
      </Card>

      <Card
        title={t('ITC-to-turnover deviation by sector')}
        subtitle={<MethodNote short={t('The gap between what was claimed and that sector\'s own benchmark.')} full={t('Bar height is the gap in percentage points between the ratio actually claimed in scope and that sector’s benchmark. Colour is the concentration of High / Critical taxpayers in the sector.')} />}
        className="mb-6"
      >
        {sectorAnalysis.length > 0 ? (
          <>
            <RiskBarChart
              data={sectorAnalysis}
              xKey="sector"
              barKey="gapPp"
              height={280}
              colorFn={d => (d.highRiskCount > 8 ? RISK_COLORS.Critical.solid : d.highRiskCount > 4 ? RISK_COLORS.High.solid : d.highRiskCount > 1 ? RISK_COLORS.Medium.solid : RISK_COLORS.Low.solid)}
            />
            <div className="mt-4">
              <DataTable
                columns={[
                  { key: 'sector', label: t('Sector'), render: row => t(row.sector) },
                  { key: 'taxpayers', label: t('Taxpayers in scope'), align: 'right', sortValue: row => row.taxpayers },
                  { key: 'actualPct', label: t('ITC / turnover claimed'), align: 'right', sortValue: row => row.actualPct, render: row => t('{0}%', row.actualPct) },
                  { key: 'benchmarkPct', label: t('Sector benchmark'), align: 'right', sortValue: row => row.benchmarkPct, render: row => t('{0}%', row.benchmarkPct) },
                  {
                    key: 'gapPp', label: t('Gap'), align: 'right',
                    sortValue: row => row.gapPp,
                    render: row => (
                      <span className={`tabular-nums font-semibold ${row.gapPp > 0 ? 'text-[#C5221F]' : 'text-steel-600'}`}>
                        {row.gapPp >= 0 ? t('+{0} pp', row.gapPp) : t('{0} pp', row.gapPp)}
                      </span>
                    )
                  },
                  { key: 'highRiskCount', label: t('High / Critical'), align: 'right', sortValue: row => row.highRiskCount },
                  { key: 'itcCr', label: t('ITC claimed'), align: 'right', sortValue: row => row.itcCr, render: row => t('₹{0} Cr', row.itcCr) }
                ]}
                rows={sectorAnalysis}
                searchable={false}
                pageSize={8}
              />
            </div>
            <MethodNote className="text-[11.5px] text-steel-500 mt-3 leading-relaxed" short={t('A positive gap on few taxpayers is variance, not a finding.')} full={t('A positive gap is worth an analyst’s attention only where the taxpayer count behind it is large enough to mean something — a sector carrying three taxpayers in scope will swing several percentage points on one claim, and that is variance rather than a finding.')} />
          </>
        ) : (
          <div className="text-xs text-steel-500 py-10 text-center">{t('No taxpayers match the current filters, so no sector comparison can be drawn.')}</div>
        )}
      </Card>

      <Card
        title={t('ITC Anomaly Categories')}
        subtitle={t('Select a category to view matching taxpayer cases under the current global filters.')}
        padded={false}
      >
        <div className="flex flex-wrap gap-2 px-5 pt-4 pb-2 border-b border-steel-100">
          {CATEGORIES.map(c => {
            const count = pool.filter(c.match).length
            const active = c.id === activeCategory
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-ink-700 border-ink-700 text-white'
                    : 'bg-white border-steel-200 text-steel-600 hover:border-navy-300 hover:text-navy-700'
                }`}
              >
                {t(c.label)}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-steel-100'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="px-5 pt-4 pb-1">
          <div className="text-xs text-steel-600">{t(activeCat.description)}</div>
          <div className="text-[11.5px] text-steel-500 mt-1">
            {t('{0} of {1} taxpayers in scope ({2}%), carrying ₹{3} Cr of claimed credit.', categoryMatches.length, pool.length, pctOf(categoryMatches.length, pool.length), categoryItcCr)}
          </div>
          <div className="mt-2 rounded-lg border border-navy-200 bg-navy-50/60 px-3 py-2 text-[11.5px] text-navy-800 leading-relaxed">
            <span className="font-semibold">{t('What to do')}: </span>{t(activeCat.action)}
          </div>
        </div>

        <div className="p-5">
          {visibleMatches.length === 0 ? (
            <div className="text-sm text-steel-500 py-8 text-center">{t('No taxpayers currently match this category under the active global filters.')}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleMatches.map(tp => (
                  <ItcRiskCard key={tp.id} taxpayer={tp} onOpen={() => setSelectedTaxpayer(tp)} />
                ))}
              </div>
              {visibleCount < categoryMatches.length && (
                <div className="flex justify-center mt-5">
                  <button
                    onClick={() => setVisibleCount(v => v + PAGE_STEP)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-steel-200 bg-white hover:bg-steel-50 text-navy-700"
                  >
                    {t('Show More')} <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="text-[11px] text-steel-400 mt-3 text-center">
                {t('Showing {0} of {1} matching cases', visibleMatches.length, categoryMatches.length)}
              </div>
            </>
          )}
        </div>
      </Card>

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}

function ItcRiskCard({ taxpayer, onOpen }) {
  const explain = explainRiskScore(taxpayer)
  const checklist = generateAuditChecklist({
    tradeName: taxpayer.tradeName,
    riskCategory: taxpayer.risk.category,
    riskScore: taxpayer.risk.score
  })
  const [showChecklist, setShowChecklist] = useState(false)

  const bench = benchmarkFor(taxpayer.sector)
  const itcRatioPct = Math.round((taxpayer.itcClaimed / Math.max(1, taxpayer.monthlyTurnover)) * 1000) / 10
  const itcBenchPct = bench ? Math.round(bench.avgItcRatio * 1000) / 10 : null
  const itcTimes = itcBenchPct ? Math.round((itcRatioPct / itcBenchPct) * 100) / 100 : null
  const taxRatioPct = Math.round((taxpayer.taxPaid / Math.max(1, taxpayer.monthlyTurnover)) * 1000) / 10
  const taxBenchPct = bench ? Math.round(bench.avgTaxRatio * 1000) / 10 : null

  return (
    <div className="bg-white rounded-xl border border-steel-200 hover:shadow-panel transition-shadow p-4 flex flex-col">
      <button onClick={onOpen} className="text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-navy-900">{taxpayer.tradeName}</div>
            <div className="text-[11px] text-steel-500 mt-0.5">{taxpayer.gstin}</div>
          </div>
          <RiskBadge category={taxpayer.risk.category} score={taxpayer.risk.score} size="sm" />
        </div>
        <div className="mt-2 text-[11px] text-steel-500">
          {t(taxpayer.sector)} · {t(taxpayer.district)}
        </div>
      </button>

      {/* The three parameters that decide whether this is a case: how much
          credit against turnover, how that compares with the sector, and
          whether the returns and payments behind it stand up. */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{t('ITC / turnover')}</div>
          <div className="text-[13px] font-bold text-navy-900 tabular-nums">{t('{0}%', itcRatioPct)}</div>
          <div className="text-[10.5px] text-steel-500 tabular-nums">
            {itcBenchPct == null
              ? t('no sector benchmark on record')
              : t('{0}% benchmark · {1}× it', itcBenchPct, itcTimes)}
          </div>
        </div>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{t('Tax paid / turnover')}</div>
          <div className="text-[13px] font-bold text-navy-900 tabular-nums">{t('{0}%', taxRatioPct)}</div>
          <div className="text-[10.5px] text-steel-500 tabular-nums">
            {taxBenchPct == null ? t('no sector benchmark on record') : t('{0}% benchmark', taxBenchPct)}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone={taxpayer.filingStatus === 'Non-Filer' ? 'red' : taxpayer.filingStatus === 'Late Filer' ? 'amber' : 'green'}>
          {t(taxpayer.filingStatus)}
        </Pill>
        <Pill tone={taxpayer.supplierRisk === 'High' ? 'red' : taxpayer.supplierRisk === 'Medium' ? 'amber' : 'steel'}>
          {t('Supplier risk: {0}', t(taxpayer.supplierRisk))}
        </Pill>
        <Pill tone="steel">{t('Exposure ₹{0} L', (taxpayer.estimatedRevenueExposure / 100000).toFixed(1))}</Pill>
      </div>

      <div className="mt-3">
        <div className="text-[10.5px] font-semibold text-steel-500 uppercase tracking-wide mb-1">
          {t('Evidence — {0} of the {1} encoded rules triggered', explain.evidence.length, RISK_RULES.length)}
        </div>
        <ul className="space-y-1">
          {explain.evidence.slice(0, 3).map((e, i) => (
            <li key={i} className="text-[11px] text-navy-700 flex gap-1.5">
              <span className="text-navy-400">•</span>
              <span>{t(e.rule)} <span className="text-steel-500 tabular-nums">{t('(+{0} of {1} points)', e.weightContribution, taxpayer.risk.score)}</span></span>
            </li>
          ))}
          {explain.evidence.length === 0 && (
            <li className="text-[11px] text-steel-400">{t('No individual rule detail available.')}</li>
          )}
        </ul>
      </div>

      <div className="mt-3 pt-3 border-t border-steel-100 flex items-center justify-between">
        {explain.humanReviewRequired ? <HumanReviewBadge label={t('Review Required')} /> : <Pill tone="steel">{t('Routine')}</Pill>}
        <button
          onClick={() => setShowChecklist(v => !v)}
          className="text-[11px] font-semibold text-navy-700 hover:text-navy-900"
        >
          {showChecklist ? t('Hide checklist') : t('Verification checklist')}
        </button>
      </div>

      {showChecklist && (
        <div className="mt-3">
          <AIOutputPanel output={checklist} />
        </div>
      )}
    </div>
  )
}
