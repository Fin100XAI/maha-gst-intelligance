import { useMemo, useState } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TaxpayerDrilldownModal } from '../components/shared/TaxpayerDrilldownModal.jsx'
import { TAXPAYERS } from '../data/mockData.js'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { t } from '../i18n/index.js'
import { Search, Users, ShieldAlert, FileWarning, UserPlus, ChevronRight } from 'lucide-react'

export default function Taxpayer360() {
  const { filters } = useApp()
  const [query, setQuery] = useState(filters.search || '')
  const [selectedTaxpayer, setSelectedTaxpayer] = useState(null)

  const globallyFiltered = useMemo(
    () => TAXPAYERS.filter(t => applyGlobalFilters(t, filters)),
    [filters]
  )

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return []
    return globallyFiltered.filter(t =>
      t.gstin.toLowerCase().includes(q) ||
      t.tradeName.toLowerCase().includes(q) ||
      t.legalName.toLowerCase().includes(q)
    )
  }, [globallyFiltered, q])

  const kpis = useMemo(() => {
    const total = globallyFiltered.length
    const highCritical = globallyFiltered.filter(t => t.risk.category === 'High' || t.risk.category === 'Critical').length
    const nonFilers = globallyFiltered.filter(t => t.filingStatus === 'Non-Filer').length
    const newRegs = globallyFiltered.filter(t => t.isNewRegistration).length
    return { total, highCritical, nonFilers, newRegs }
  }, [globallyFiltered])

  const highestRisk = useMemo(
    () => [...globallyFiltered].sort((a, b) => b.risk.score - a.risk.score).slice(0, 8),
    [globallyFiltered]
  )

  const columns = [
    { key: 'gstin', label: t('GSTIN'), sortValue: r => r.gstin },
    { key: 'tradeName', label: t('Trade Name'), sortValue: r => r.tradeName },
    { key: 'district', label: t('District'), sortValue: r => r.district },
    { key: 'sector', label: t('Sector'), sortValue: r => r.sector },
    { key: 'filingStatus', label: t('Filing Status'), sortValue: r => r.filingStatus },
    {
      key: 'risk', label: t('Risk'), align: 'center',
      sortValue: r => r.risk.score,
      render: r => <RiskBadge category={r.risk.category} score={r.risk.score} />
    },
    {
      key: 'estimatedRevenueExposure', label: t('Est. Exposure'), align: 'right',
      sortValue: r => r.estimatedRevenueExposure,
      render: r => `₹${(r.estimatedRevenueExposure / 100000).toFixed(1)} L`
    }
  ]

  return (
    <div>
      <SectionHeader
        eyebrow={t('Revenue · Taxpayer Intelligence')}
        title={t('Taxpayer 360')}
        description={t('Search any GSTIN or trade name for a complete taxpayer intelligence profile — filing behaviour, ITC pattern, refund history, e-way bill activity, network linkages and risk explainability.')}
        actions={<ExportBar />}
      />

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Pill tone="navy">{t('Risk signal only')}</Pill>
        <Pill tone="amber">{t('Officer verification required')}</Pill>
        <Pill tone="steel">{t('No automated adverse action')}</Pill>
      </div>

      <Card className="mb-6" padded>
        <div className="relative">
          <Search className="w-4 h-4 text-steel-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('Search by GSTIN, trade name or legal name — e.g. 27AAAPZ1000..., or Shivneri Enterprises')}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-steel-200 bg-steel-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-300"
          />
        </div>
        {q && (
          <div className="mt-3 text-xs text-steel-500">
            {t('{0} {1} match "{2}" under the current global filters.', results.length, results.length === 1 ? t('taxpayer') : t('taxpayers'), query)}
          </div>
        )}
      </Card>

      {q ? (
        <Card title={t('Search Results')} subtitle={t('Click any row to open the full Taxpayer 360 profile.')}>
          <DataTable columns={columns} rows={results} onRowClick={t => setSelectedTaxpayer(t)} searchable={false} pageSize={12} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={t('Total Taxpayers (filtered)')} value={kpis.total.toLocaleString('en-IN')} tone="navy" icon={Users} />
            <KpiCard label={t('High / Critical Risk')} value={kpis.highCritical.toLocaleString('en-IN')} tone="red" icon={ShieldAlert} />
            <KpiCard label={t('Non-Filers')} value={kpis.nonFilers.toLocaleString('en-IN')} tone="saffron" icon={FileWarning} />
            <KpiCard label={t('New Registrations')} value={kpis.newRegs.toLocaleString('en-IN')} tone="steel" icon={UserPlus} />
          </div>

          <Card
            title={t('Highest Risk Taxpayers')}
            subtitle={t('Top entities by computed risk score under the current global filters — a starting point when no search query is entered.')}
            actions={<HumanReviewBadge />}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-steel-500 mb-3">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              {t('Risk signal only. No automated adverse action is taken — every case listed here requires officer verification before any action.')}
            </div>
            {highestRisk.length === 0 ? (
              <div className="text-sm text-steel-500 py-6 text-center">{t('No taxpayers match the current global filters.')}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {highestRisk.map(tp => (
                  <button
                    key={tp.id}
                    onClick={() => setSelectedTaxpayer(tp)}
                    className="text-left bg-white rounded-xl border border-steel-200 hover:border-navy-300 hover:shadow-panel transition-all p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-navy-900">{tp.tradeName}</div>
                        <div className="text-[11px] text-steel-500 mt-0.5">{tp.gstin}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-steel-300 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <RiskBadge category={tp.risk.category} score={tp.risk.score} size="sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                      <div>
                        <div className="text-steel-500">{t('District')}</div>
                        <div className="font-medium text-navy-800">{tp.district}</div>
                      </div>
                      <div>
                        <div className="text-steel-500">{t('Sector')}</div>
                        <div className="font-medium text-navy-800">{tp.sector}</div>
                      </div>
                      <div>
                        <div className="text-steel-500">{t('Filing Status')}</div>
                        <div className="font-medium text-navy-800">{tp.filingStatus}</div>
                      </div>
                      <div>
                        <div className="text-steel-500">{t('Est. Exposure')}</div>
                        <div className="font-medium text-navy-800">₹{(tp.estimatedRevenueExposure / 100000).toFixed(1)} L</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <TaxpayerDrilldownModal taxpayer={selectedTaxpayer} open={!!selectedTaxpayer} onClose={() => setSelectedTaxpayer(null)} />
    </div>
  )
}
