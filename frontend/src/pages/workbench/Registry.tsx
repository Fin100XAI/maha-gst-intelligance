import { useState } from 'react'
import type { JSX } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Figure, Money } from '../../components/Money'
import { NotEvaluatedCell } from '../../components/NotEvaluated'
import { StatusChip } from '../../components/StatusChip'
import type { StatusLevel } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { RegistryRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * W3 - Taxpayer Registry.
 *
 * Every filter, the sort and the paging happen in the database. The table is
 * specified to hold fifty thousand rows, and filtering that in the browser is
 * a screen that stops responding in front of a Commissioner.
 *
 * Coverage sits beside the P-Score in its own column rather than in a
 * tooltip. Sorting a population by a score computed over three of
 * thirty-four parameters, with no sight of that fact, is how a registry
 * becomes a ranking nobody should trust.
 */
const PAGE_SIZE = 25

export default function Registry(): JSX.Element {
  const navigate = useNavigate()
  const [division, setDivision] = useState('')
  const [pBand, setPBand] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('p_score')
  const [descending, setDescending] = useState(true)
  const [page, setPage] = useState(1)

  const facets = useQuery({ queryKey: ['registry-facets'], queryFn: () => api.registryFacets() })

  const query = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE),
    sort,
    descending: descending ? 'true' : 'false',
  })
  if (division !== '') query.set('division', division)
  if (pBand !== '') query.set('p_band', pBand)
  if (search.trim() !== '') query.set('search', search.trim())

  const registry = useQuery({
    queryKey: ['registry', query.toString()],
    queryFn: () => api.registry(`?${query.toString()}`),
    placeholderData: keepPreviousData,
  })

  const reset = (): void => {
    setPage(1)
  }

  if (registry.isError) {
    return (
      <p className="text-status-critical">
        The registry could not be loaded. There may be no engine run yet.
      </p>
    )
  }

  const data = registry.data
  const pages = data === undefined ? 1 : Math.max(1, Math.ceil(data.total / data.size))

  return (
    <div className="w-full">
      <ScreenHeader
        code="W3"
        title="Find a business"
        lead="Search by GSTIN, name or trade. Only the businesses in your jurisdiction appear -
          one outside it reads as not found rather than as refused, because refusing would
          confirm that the registration exists."
        meta={data === undefined ? 'Loading…' : `${String(data.total)} in scope · ${data.scope}`}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Search
          <input
            type="search"
            value={search}
            placeholder="GSTIN or name"
            onChange={(event) => {
              setSearch(event.target.value)
              reset()
            }}
            className="w-56 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Division
          <select
            value={division}
            onChange={(event) => {
              setDivision(event.target.value)
              reset()
            }}
            className="rounded border border-line bg-raised px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {(facets.data?.divisions ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          P-band
          <select
            value={pBand}
            onChange={(event) => {
              setPBand(event.target.value)
              reset()
            }}
            className="rounded border border-line bg-raised px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {(facets.data?.p_bands ?? []).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Sort by
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value)
              reset()
            }}
            className="rounded border border-line bg-raised px-2 py-1 text-sm"
          >
            {(facets.data?.sortable ?? ['p_score']).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            setDescending((current) => !current)
            reset()
          }}
          className="rounded border border-line px-2 py-1 text-sm text-ink-secondary hover:text-ink"
        >
          {descending ? 'Highest first' : 'Lowest first'}
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-muted">
            <th className="py-1 text-left">Taxpayer</th>
            <th className="py-1 text-left">Division</th>
            <th className="py-1 text-right">AATO</th>
            <th className="py-1 text-right">P-Score</th>
            <th className="py-1 text-right">Coverage</th>
            <th className="py-1 text-left">P-band</th>
            <th className="py-1 text-right">F-Score</th>
            <th className="py-1 text-left">F-band</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <Row
              key={row.gstin}
              row={row}
              onOpen={() => {
                navigate(row.href)
              }}
            />
          ))}
        </tbody>
      </table>

      {data !== undefined && data.items.length === 0 && (
        <p className="mt-4 text-ink-secondary">
          No taxpayer matches these filters in your jurisdiction.
        </p>
      )}

      <nav className="mt-4 flex items-center gap-3 text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => {
            setPage((current) => Math.max(1, current - 1))
          }}
          className="rounded border border-line px-2 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="tabular text-ink-secondary">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => {
            setPage((current) => current + 1)
          }}
          className="rounded border border-line px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
        {registry.isFetching && <span className="text-xs text-ink-muted">updating…</span>}
      </nav>

      <p className="mt-3 text-xs text-ink-muted">{data?.note}</p>
    </div>
  )
}

function Row({ row, onOpen }: { row: RegistryRow; onOpen: () => void }): JSX.Element {
  return (
    <tr className="border-b border-line">
      <td className="py-1">
        <button
          type="button"
          className="underline decoration-dotted underline-offset-2"
          onClick={onOpen}
        >
          {row.legal_name}
        </button>
        <div className="text-xs text-ink-muted tabular">{row.gstin}</div>
      </td>
      <td className="py-1 text-ink-secondary">{row.division ?? '-'}</td>
      <td className="py-1 text-right">
        {row.aato === null ? (
          <span className="text-ink-muted">-</span>
        ) : (
          <Money value={row.aato} calcId={null} symbol={false} drill={onOpen} />
        )}
      </td>
      <td className="py-1 text-right">
        {row.p_score === null ? (
          <NotEvaluatedCell title="No score was recorded for this taxpayer in this run." />
        ) : (
          <Figure value={row.p_score} calcId={row.p_calc_id} />
        )}
      </td>
      <td className="py-1 text-right tabular text-ink-secondary">
        {row.p_evaluated === null ? '-' : `${String(row.p_evaluated)}/34`}
      </td>
      <td className="py-1">
        {row.p_band === null ? (
          <span className="text-ink-muted">-</span>
        ) : (
          <StatusChip level={bandLevel(row.p_band)} label={row.p_band} />
        )}
      </td>
      <td className="py-1 text-right">
        {row.f_score === null ? (
          <span className="text-ink-muted">-</span>
        ) : (
          <Figure value={row.f_score} calcId={row.f_calc_id} />
        )}
      </td>
      <td className="py-1">
        {row.f_band === null ? (
          <span className="text-ink-muted">-</span>
        ) : (
          <StatusChip level={fBandLevel(row.f_band)} label={row.f_band} />
        )}
      </td>
    </tr>
  )
}

function bandLevel(band: string): StatusLevel {
  if (band === 'SEVERE') return 'critical'
  if (band === 'HIGH') return 'serious'
  if (band === 'MODERATE' || band === 'MEDIUM') return 'warning'
  if (band === 'LOW') return 'good'
  return 'unknown'
}

function fBandLevel(band: string): StatusLevel {
  if (band === 'RED') return 'critical'
  if (band === 'AMBER') return 'warning'
  if (band === 'GREEN') return 'good'
  return 'unknown'
}
