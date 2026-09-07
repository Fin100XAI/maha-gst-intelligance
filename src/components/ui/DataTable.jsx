import { useMemo, useState } from 'react'
import { ArrowUpDown, ChevronUp, ChevronDown, Search } from 'lucide-react'
import { t } from '../../i18n/index.js'

// Generic sortable, searchable, clickable-row data table.
// columns: [{ key, label, render?: (row) => node, sortValue?: (row) => number|string, align?: 'left'|'right'|'center' }]
export function DataTable({ columns, rows, searchable = true, searchPlaceholder = 'Search...', onRowClick, pageSize = 10, emptyLabel = 'No records match the current filters.' }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(q))
  }, [rows, query])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find(c => c.key === sortKey)
    const getVal = col?.sortValue || (r => r[sortKey])
    return [...filtered].sort((a, b) => {
      const va = getVal(a), vb = getVal(b)
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }, [filtered, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize)

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  return (
    <div>
      {searchable && (
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-steel-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(0) }}
              placeholder={t(searchPlaceholder)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-steel-200 bg-steel-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>
          <span className="text-xs text-steel-400">{t('{0} of {1} records', sorted.length, rows.length)}</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-steel-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-steel-50 border-b border-steel-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  className={`px-3 py-2.5 font-semibold text-steel-600 uppercase tracking-wide text-[10.5px] whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.sortable !== false ? 'cursor-pointer select-none hover:text-navy-700' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {t(col.label)}
                    {col.sortable !== false && (sortKey === col.key ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-steel-400">{t(emptyLabel)}</td></tr>
            )}
            {pageRows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-steel-100 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-navy-50/60' : ''} ${i % 2 === 1 ? 'bg-steel-50/40' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-3 py-2.5 text-navy-800 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                    {col.render
                      ? col.render(row)
                      /* A column with no render used to print the raw value, so
                         any text cell — an officer role, a stage, a behavioural
                         ratio — reached an officer in English however complete
                         the catalogues were. String values now go through the
                         translator; t() returns anything it does not hold
                         unchanged, so ids and reference numbers are unaffected. */
                      : typeof row[col.key] === 'string' ? t(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-steel-500">
          <span>{t('Page {0} of {1}', page + 1, totalPages)}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2.5 py-1 rounded-md border border-steel-200 disabled:opacity-40 hover:bg-steel-50">{t('Prev')}</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2.5 py-1 rounded-md border border-steel-200 disabled:opacity-40 hover:bg-steel-50">{t('Next')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
