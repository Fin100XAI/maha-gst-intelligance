import { Filter, FilterX, Info } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'

const DEFAULTS = {
  district: 'All Districts',
  division: 'All Divisions',
  sector: 'All Sectors',
  taxpayerType: 'All Types',
  riskLevel: 'All Risk Levels'
}

/* Which filters the officer has actually narrowed to, in plain words. */
export function activeFilterLabels(filters) {
  const out = []
  Object.entries(DEFAULTS).forEach(([k, def]) => {
    if (filters[k] && filters[k] !== def) out.push(filters[k])
  })
  if (filters.search && filters.search.trim()) out.push(`"${filters.search.trim()}"`)
  return out
}

/* A page that respects the filter bar says how much it is showing.
 *
 * Silence is the failure mode this exists to prevent: an officer narrows to
 * one division, the page ignores it, and every figure on screen is statewide
 * while appearing to be divisional. */
export function FilterScope({ shown, total, unit = 'records' }) {
  const { filters } = useApp()
  const active = activeFilterLabels(filters)
  if (!active.length) return null

  const suppressed = total - shown
  return (
    <div className="rounded-lg border border-govt-200 bg-govt-50/60 px-4 py-2.5 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Filter className="w-3.5 h-3.5 text-govt-600 shrink-0" />
      <span className="text-[12px] font-semibold text-navy-900">
        {t('Showing {0} of {1} {2}', shown, total, unit)}
      </span>
      <span className="text-[11.5px] text-steel-600">
        {t('filtered to')} {active.map((a, i) => (
          <span key={i} className="inline-block rounded bg-white border border-govt-200 px-1.5 py-0.5 mx-0.5 text-[11px] text-navy-800">{a}</span>
        ))}
      </span>
      {suppressed > 0 && (
        <span className="ml-auto text-[11px] text-steel-500 tabular-nums">{t('{0} hidden by the filter', suppressed)}</span>
      )}
    </div>
  )
}

/* A page that cannot be filtered says so, rather than showing statewide
 * figures under an active divisional filter without comment. */
export function FilterNotApplicable({ reason }) {
  const { filters } = useApp()
  const active = activeFilterLabels(filters)
  if (!active.length) return null

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/60 px-4 py-2.5 mb-4 flex items-start gap-2.5">
      <FilterX className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-[12px] text-navy-800 leading-relaxed">
        <strong>{t('The filter bar does not apply to this page.')}</strong>{' '}
        {reason} {t('The filter is currently set to')} {active.map((a, i) => (
          <span key={i} className="inline-block rounded bg-white border border-amber-200 px-1.5 py-0.5 mx-0.5 text-[11px] text-navy-800">{a}</span>
        ))} — {t('nothing on this page is narrowed by it.')}
      </p>
    </div>
  )
}
