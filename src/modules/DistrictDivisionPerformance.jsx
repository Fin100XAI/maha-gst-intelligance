import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill } from '../components/ui/RiskBadge.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { DISTRICT_REVENUE, DIVISIONS, OFFICERS, TAXPAYERS } from '../data/mockData.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import {
  MapPin, Building2, UserX, IndianRupee, ChevronRight, Gauge
} from 'lucide-react'

function gapTone(gapPct) {
  return gapPct >= 0 ? TONE_STYLES.green : TONE_STYLES.red
}

// District-level severity shading (not taxpayer risk) — threshold-based on riskTaxpayers count.
function severityShade(value, thresholds) {
  if (value >= thresholds[2]) return { bg: 'bg-maharisk-critical', text: 'text-white', label: 'Severe' }
  if (value >= thresholds[1]) return { bg: 'bg-maharisk-high', text: 'text-white', label: 'Elevated' }
  if (value >= thresholds[0]) return { bg: 'bg-amber-300', text: 'text-navy-900', label: 'Moderate' }
  return { bg: 'bg-emerald-200', text: 'text-navy-900', label: 'Stable' }
}

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
  // pastel-recolored by an incidental sector/search filter).
  const isNarrowingActive = filters.sector !== 'All Sectors' || filters.riskLevel !== 'All Risk Levels'
    || (!!filters.search && !!filters.search.trim())

  const scopedRiskCounts = useMemo(() => {
    if (!isNarrowingActive) return null
    const map = {}
    DISTRICT_REVENUE.forEach(d => {
      map[d.district] = TAXPAYERS.filter(t => t.district === d.district && applyGlobalFilters(t, filters)).length
    })
    return map
  }, [filters, isNarrowingActive])

  const kpis = useMemo(() => {
    const totalDistricts = filteredDistricts.length
    const inDeficit = filteredDistricts.filter(d => d.gapPct < 0).length
    const totalNonFilers = filteredDistricts.reduce((s, d) => s + d.nonFilers, 0)
    const totalAuditRecovery = filteredDistricts.reduce((s, d) => s + d.auditRecoveryCr, 0)
    return { totalDistricts, inDeficit, totalNonFilers, totalAuditRecovery }
  }, [filteredDistricts])

  const riskThresholds = useMemo(() => {
    const vals = DISTRICT_REVENUE.map(d => d.riskTaxpayers).sort((a, b) => a - b)
    return [vals[Math.floor(vals.length * 0.4)], vals[Math.floor(vals.length * 0.7)], vals[Math.floor(vals.length * 0.9)]]
  }, [])

  const gapThresholds = [-15, -8, -3] // more negative = more severe (ascending severity thresholds handled specially)

  function heatCell(d) {
    if (heatmapMetric === 'riskTaxpayers') {
      return severityShade(d.riskTaxpayers, riskThresholds)
    }
    // gapPct: severity increases as gapPct becomes more negative
    const g = d.gapPct
    if (g <= gapThresholds[2]) return { bg: 'bg-maharisk-critical', text: 'text-white', label: 'Severe deficit' }
    if (g <= gapThresholds[1]) return { bg: 'bg-maharisk-high', text: 'text-white', label: 'High deficit' }
    if (g <= gapThresholds[0]) return { bg: 'bg-amber-300', text: 'text-navy-900', label: 'Mild deficit' }
    return { bg: 'bg-emerald-200', text: 'text-navy-900', label: 'On/above target' }
  }

  const divisionRanking = useMemo(() => {
    const groups = {}
    filteredDistricts.forEach(d => {
      if (!groups[d.division]) groups[d.division] = { division: d.division, targetCr: 0, actualCr: 0, auditRecoveryCr: 0, workloadSum: 0, count: 0, riskTaxpayers: 0, nonFilers: 0 }
      const g = groups[d.division]
      g.targetCr += d.targetCr
      g.actualCr += d.actualCr
      g.auditRecoveryCr += d.auditRecoveryCr
      g.workloadSum += d.officerWorkload
      g.riskTaxpayers += scopedRiskCounts ? scopedRiskCounts[d.district] : d.riskTaxpayers
      g.nonFilers += d.nonFilers
      g.count += 1
    })
    return Object.values(groups)
      .map(g => ({ ...g, avgWorkload: Math.round(g.workloadSum / g.count), performanceRatio: Math.round((g.actualCr / g.targetCr) * 1000) / 10 }))
      .sort((a, b) => b.performanceRatio - a.performanceRatio)
  }, [filteredDistricts, scopedRiskCounts])

  const districtOfficers = useMemo(
    () => selectedDistrict ? OFFICERS.filter(o => o.district === selectedDistrict.district) : [],
    [selectedDistrict]
  )
  const districtTopRisk = useMemo(
    () => selectedDistrict
      ? TAXPAYERS.filter(t => t.district === selectedDistrict.district && applyGlobalFilters(t, filters))
        .sort((a, b) => b.risk.score - a.risk.score).slice(0, 5)
      : [],
    [selectedDistrict, filters]
  )

  return (
    <div>
      <SectionHeader
        eyebrow={t('Benchmarking')}
        title={t('District & Division Performance')}
        description={t("Geographic governance view of revenue targets, risk concentration, officer workload and case ageing across Maharashtra's districts and divisions.")}
        actions={<ExportBar moduleLabel="District & Division Performance" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Total Districts')} value={kpis.totalDistricts} icon={MapPin} tone="navy" />
        <KpiCard label={t('Districts in Deficit')} value={kpis.inDeficit} unit={t('of {0}', kpis.totalDistricts)} icon={Gauge} tone="red" />
        <KpiCard label={t('Total Non-Filers')} value={kpis.totalNonFilers.toLocaleString('en-IN')} icon={UserX} tone="saffron" />
        <KpiCard label={t('Total Audit Recovery')} value={`₹${kpis.totalAuditRecovery.toLocaleString('en-IN')}`} unit={t('Cr')} icon={IndianRupee} tone="green" />
      </div>

      <Card
        title={t('District Severity Heatmap')}
        subtitle={t('Threshold-based shading — not a taxpayer risk score')}
        className="mb-6"
        actions={
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setHeatmapMetric('riskTaxpayers')}
              className={`px-2.5 py-1 rounded-md border font-medium ${heatmapMetric === 'riskTaxpayers' ? 'bg-navy-700 text-white border-navy-700' : 'bg-white border-steel-200 text-steel-600'}`}
            >{t('Risk Taxpayers')}</button>
            <button
              onClick={() => setHeatmapMetric('gapPct')}
              className={`px-2.5 py-1 rounded-md border font-medium ${heatmapMetric === 'gapPct' ? 'bg-navy-700 text-white border-navy-700' : 'bg-white border-steel-200 text-steel-600'}`}
            >{t('Target Gap %')}</button>
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
                <div className="text-xs font-bold truncate">{d.district}</div>
                <div className="text-[10px] opacity-90 mt-0.5">{t(shade.label)}</div>
                <div className="text-sm font-bold mt-1.5">
                  {heatmapMetric === 'riskTaxpayers' ? d.riskTaxpayers : `${d.gapPct > 0 ? '+' : ''}${d.gapPct}%`}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">{t('District Performance Cards')}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filteredDistricts.map(d => {
          const tone = gapTone(d.gapPct)
          const pct = Math.min(100, Math.round((d.actualCr / d.targetCr) * 100))
          return (
            <Card key={d.district} padded={false} className="overflow-hidden">
              <button onClick={() => setSelectedDistrict(d)} className="w-full text-left p-4 hover:bg-steel-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold text-navy-900">{d.district}</div>
                    <div className="text-[11px] text-steel-500">{d.division}</div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border" style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.accent }}>
                    {d.gapPct > 0 ? '+' : ''}{d.gapPct}%
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] text-steel-500 mb-1">
                    <span>{t('Actual')} ₹{d.actualCr.toLocaleString('en-IN')} {t('Cr')}</span>
                    <span>{t('Target')} ₹{d.targetCr.toLocaleString('en-IN')} {t('Cr')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-steel-100 overflow-hidden">
                    <div className={`h-full ${d.gapPct >= 0 ? 'bg-emerald-500' : 'bg-maharisk-critical'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <MiniStat label={t('Risk Taxpayers')} value={scopedRiskCounts ? scopedRiskCounts[d.district] : d.riskTaxpayers} />
                  <MiniStat label={t('Non-Filers')} value={d.nonFilers} />
                  <MiniStat label={t('Officer Workload')} value={`${d.officerWorkload}%`} />
                  <MiniStat label={t('Case Ageing')} value={`${d.caseAgeingDays}d`} />
                </div>

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

      <Card title={t('Division Performance Ranking')} subtitle={t('Aggregated target vs actual, audit recovery and workload by division')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-steel-50 border-b border-steel-200 text-left">
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Rank')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px]">{t('Division')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Target (Cr)')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Actual (Cr)')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Performance')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Audit Recovery (Cr)')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Avg Workload')}</th>
                <th className="px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] text-right">{t('Risk Taxpayers')}</th>
              </tr>
            </thead>
            <tbody>
              {divisionRanking.map((g, i) => (
                <tr key={g.division} className={`border-b border-steel-100 last:border-0 ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}>
                  <td className="px-3 py-2.5 font-bold text-navy-800">#{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-navy-800">{g.division}</td>
                  <td className="px-3 py-2.5 text-right text-navy-800">{g.targetCr.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right text-navy-800">{g.actualCr.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Pill tone={g.performanceRatio >= 100 ? 'green' : g.performanceRatio >= 90 ? 'amber' : 'red'}>{g.performanceRatio}%</Pill>
                  </td>
                  <td className="px-3 py-2.5 text-right text-navy-800">{g.auditRecoveryCr.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right text-navy-800">{g.avgWorkload}%</td>
                  <td className="px-3 py-2.5 text-right text-navy-800">{g.riskTaxpayers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-steel-500 mt-3">{t('{0} divisions covering {1} districts across Maharashtra.', DIVISIONS.length, DISTRICT_REVENUE.length)}</p>
      </Card>

      <Modal
        open={!!selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
        size="lg"
        title={selectedDistrict?.district}
        subtitle={selectedDistrict?.division}
      >
        {selectedDistrict && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Stat label={t('Target')} value={`₹${selectedDistrict.targetCr.toLocaleString('en-IN')} ${t('Cr')}`} />
              <Stat label={t('Actual')} value={`₹${selectedDistrict.actualCr.toLocaleString('en-IN')} ${t('Cr')}`} />
              <Stat label={t('Target Gap')} value={`${selectedDistrict.gapPct > 0 ? '+' : ''}${selectedDistrict.gapPct}%`} tone={selectedDistrict.gapPct >= 0 ? 'good' : 'bad'} />
              <Stat label={t('Audit Recovery')} value={`₹${selectedDistrict.auditRecoveryCr} ${t('Cr')}`} />
              <Stat label={t('Risk Taxpayers')} value={scopedRiskCounts ? scopedRiskCounts[selectedDistrict.district] : selectedDistrict.riskTaxpayers} />
              <Stat label={t('Non-Filers')} value={selectedDistrict.nonFilers} />
              <Stat label={t('Officer Workload')} value={`${selectedDistrict.officerWorkload}%`} />
              <Stat label={t('Case Ageing')} value={`${selectedDistrict.caseAgeingDays} ${t('days')}`} />
            </div>

            <div>
              <div className="text-xs font-semibold text-navy-800 mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {t('Officer Workload in {0}', selectedDistrict.district)}</div>
              {districtOfficers.length === 0 ? (
                <p className="text-xs text-steel-500">{t('No officers directly assigned to this district in the current dataset.')}</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {districtOfficers.map(o => (
                    <div key={o.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-steel-200 text-xs">
                      <div>
                        <div className="font-semibold text-navy-800">{o.name}</div>
                        <div className="text-[11px] text-steel-500">{o.role}</div>
                      </div>
                      <div className="text-right text-[11px] text-steel-500">
                        <div>{t('{0} assigned · {1} closed MTD', o.assignedCases, o.casesClosedMTD)}</div>
                        <div>{t('Avg resolution: {0}d', o.avgResolutionDays)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-navy-800 mb-2">{t('Top Risk Taxpayers in this District')}</div>
              {districtTopRisk.length === 0 && (
                <p className="text-xs text-steel-500">{t('No taxpayers in this district match the current global filters.')}</p>
              )}
              <div className="space-y-1.5">
                {districtTopRisk.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTaxpayer(t) }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-steel-200 hover:bg-navy-50/60 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-navy-800 truncate">{t.tradeName}</div>
                      <div className="text-[11px] text-steel-500 truncate">{t.sector} · {t.gstin}</div>
                    </div>
                    <RiskBadge category={t.risk.category} score={t.risk.score} size="sm" />
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

function MiniStat({ label, value }) {
  return (
    <div className="px-2 py-1.5 rounded-md bg-steel-50 border border-steel-100">
      <div className="text-steel-500">{label}</div>
      <div className="font-bold text-navy-900">{value}</div>
    </div>
  )
}

function Stat({ label, value, tone }) {
  const toneCls = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-maharisk-critical' : 'text-navy-900'
  return (
    <div className="px-3 py-2.5 rounded-lg border border-steel-200 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-steel-500 font-semibold">{label}</div>
      <div className={`text-sm font-bold mt-0.5 ${toneCls}`}>{value}</div>
    </div>
  )
}
