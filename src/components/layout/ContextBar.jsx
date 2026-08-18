import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  useApp, MODULES, DISTRICT_OPTIONS, DIVISION_OPTIONS, SECTOR_OPTIONS,
  RISK_OPTIONS, TAXPAYER_TYPE_OPTIONS, DATE_RANGE_OPTIONS
} from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none text-xs font-medium bg-white border border-steel-200 rounded-lg pl-2.5 pr-6 py-1.5 text-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-300 hover:bg-steel-50"
      >
        {options.map(o => <option key={o} value={o}>{t(o)}</option>)}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-steel-400 pointer-events-none" />
    </div>
  )
}

// Secondary bar under the nav — where the operator is in the platform
// hierarchy, which role they're acting as, and the scope every module below
// reads from. Breadcrumb first (identity), scope controls second (state).
export function ContextBar() {
  const { role, activeModule, filters, setFilter } = useApp()
  const current = MODULES.find(m => m.id === activeModule)

  return (
    <div className="border-b border-steel-200 bg-gradient-to-r from-steel-50 via-white to-steel-50">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-2 text-xs overflow-x-auto scrollbar-none">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-steel-400">{t('Context')}</span>
        <span className="h-3 w-px bg-steel-300 shrink-0" />
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-steel-100 text-steel-600 border border-steel-200 font-medium">{t('Maha GST Intelligence')}</span>
        <ChevronRight className="w-3 h-3 text-steel-300 shrink-0" />
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 border border-navy-200 font-medium">{t(current?.group)}</span>
        <ChevronRight className="w-3 h-3 text-steel-300 shrink-0" />
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-saffron-50 text-saffron-800 border border-saffron-200 font-semibold">{t(current?.label)}</span>
        <div className="flex-1" />
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-steel-100 text-steel-600 border border-steel-200 font-medium whitespace-nowrap">{t('Acting as {0}', t(role))}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 pb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mr-1 shrink-0">{t('Filters')}</span>
        <Select value={filters.dateRange} onChange={v => setFilter('dateRange', v)} options={DATE_RANGE_OPTIONS} />
        <Select value={filters.division} onChange={v => setFilter('division', v)} options={DIVISION_OPTIONS} />
        <Select value={filters.district} onChange={v => setFilter('district', v)} options={DISTRICT_OPTIONS} />
        <Select value={filters.sector} onChange={v => setFilter('sector', v)} options={SECTOR_OPTIONS} />
        <Select value={filters.taxpayerType} onChange={v => setFilter('taxpayerType', v)} options={TAXPAYER_TYPE_OPTIONS} />
        <Select value={filters.riskLevel} onChange={v => setFilter('riskLevel', v)} options={RISK_OPTIONS} />
      </div>
    </div>
  )
}
