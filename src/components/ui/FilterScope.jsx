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

/* DEFAULTS drives the "filtered to" chips, and deliberately leaves the date
 * range out — it is never at "all", so listing it would put a chip on every
 * banner permanently. ALL_DEFAULTS is the full set, used only to decide
 * whether an unapplied filter is actually set and therefore worth a line. */
const ALL_DEFAULTS = { ...DEFAULTS, dateRange: 'Last 12 Months' }

/* Which filters the officer has actually narrowed to, in plain words. */
export function activeFilterLabels(filters) {
  const out = []
  Object.entries(DEFAULTS).forEach(([k, def]) => {
    if (filters[k] && filters[k] !== def) out.push(filters[k])
  })
  if (filters.search && filters.search.trim()) out.push(`"${filters.search.trim()}"`)
  return out
}

/* The header filters, by the name the officer sees on the control. Used to say
 * which one is not being applied, so the sentence names the dropdown rather
 * than the state key behind it. */
export const FILTER_LABELS = {
  dateRange: 'Date range',
  division: 'Division',
  district: 'District',
  sector: 'Sector',
  taxpayerType: 'Taxpayer type',
  riskLevel: 'Risk level'
}

/* A page that respects the filter bar says how much it is showing.
 *
 * Silence is the failure mode this exists to prevent: an officer narrows to
 * one division, the page ignores it, and every figure on screen is statewide
 * while appearing to be divisional.
 *
 * `ignores` is the partial case, and the more common one: a screen that
 * honours four of the six filters and cannot honour the other two, because the
 * records it draws on do not carry the field. It maps a filter key to the
 * reason, and the reason is stated per screen rather than centrally — the
 * cause is a property of that screen's dataset, and one shared sentence would
 * be wrong on half of them. The line appears only when the officer has
 * actually set one of those filters; telling them a filter is unavailable
 * while it sits at its default is noise. */
export function FilterScope({ shown, total, unit = 'records', ignores = null }) {
  const { filters } = useApp()
  const active = activeFilterLabels(filters)

  const unapplied = ignores
    ? Object.entries(ignores).filter(([k]) => filters[k] && filters[k] !== ALL_DEFAULTS[k])
    : []

  if (!active.length && !unapplied.length) return null

  const suppressed = total - shown
  return (
    <div className="rounded-lg border border-govt-200 bg-govt-50/60 px-4 py-2.5 mb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Filter className="w-3.5 h-3.5 text-govt-600 shrink-0" />
        <span className="text-[12px] font-semibold text-navy-900">
          {t('Showing {0} of {1} {2}', shown, total, unit)}
        </span>
        {active.length > 0 && (
          <span className="text-[11.5px] text-steel-600">
            {t('filtered to')} {active.map((a, i) => (
              <span key={i} className="inline-block rounded bg-white border border-govt-200 px-1.5 py-0.5 mx-0.5 text-[11px] text-navy-800">{a}</span>
            ))}
          </span>
        )}
        {suppressed > 0 && (
          <span className="ml-auto text-[11px] text-steel-500 tabular-nums">{t('{0} hidden by the filter', suppressed)}</span>
        )}
      </div>
      {unapplied.map(([key, reason]) => (
        <div key={key} className="flex items-start gap-2 mt-2 pt-2 border-t border-govt-200/70">
          <FilterX className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[11.5px] text-steel-700 leading-relaxed">
            <strong className="text-navy-800">{t('{0} is not applied here.', t(FILTER_LABELS[key]))}</strong>{' '}
            {t(reason)}
          </span>
        </div>
      ))}
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
