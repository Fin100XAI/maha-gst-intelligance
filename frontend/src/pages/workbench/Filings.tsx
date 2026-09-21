import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { Explain } from '../../components/Explain'
import { Money } from '../../components/Money'
import { ScreenHeader } from '../../components/ScreenHeader'
import { StatusChip } from '../../components/StatusChip'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { api } from '../../lib/api'
import { DISPOSITION_LABEL, dispositionLevel, severityLevel } from '../../lib/findings'
import { cn } from '../../lib/utils'
import type { FilingRow } from '../../lib/api'

/**
 * W8 - Filings: the risk profile of every return, one row each.
 *
 * The unit an officer works is a filing: this business, this month, this
 * return. The platform had a screen for the year (the taxpayer file) and a
 * screen for the portfolio (the dashboard), and nothing for the thing actually
 * on the desk - so there was nowhere to stand and ask "what about July?",
 * which is the question, because a notice is issued for a period.
 *
 * Ordered worst first and largest first, so the list is worked from the top.
 * An officer should never have to sort a queue before starting on it.
 */
type Only = '' | 'triggered' | 'clean' | 'reviewed'

export default function Filings(): JSX.Element {
  const [only, setOnly] = useState<Only>('triggered')
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['filings', only],
    queryFn: () => api.filings(only === '' ? {} : { only }),
  })

  const rows = (query.data?.items ?? []).filter((row) => {
    if (search.trim() === '') return true
    const needle = search.trim().toLowerCase()
    return (
      row.gstin.toLowerCase().includes(needle) ||
      (row.legal_name ?? '').toLowerCase().includes(needle) ||
      row.period_label.toLowerCase().includes(needle)
    )
  })

  return (
    <div className="w-full">
      <ScreenHeader
        code="W8"
        title="Filings"
        lead={
          <>
            Every return the platform holds, one row per business per period, with what the
            rules found in it. Worst first &mdash; work down the list. Open one to see every
            rule that fired, every rule that did not and why, and to record what you decided.
          </>
        }
        meta={
          query.data === undefined
            ? 'Loading…'
            : `${String(query.data.count)} filings · ${query.data.scope}`
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ['triggered', 'Something was found'],
              ['clean', 'Nothing found'],
              ['reviewed', 'Already reviewed'],
              ['', 'All filings'],
            ] as [Only, string][]
          ).map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={only === value ? 'default' : 'ghost'}
              aria-pressed={only === value}
              onClick={() => {
                setOnly(value)
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-muted">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Search filings</span>
          <input
            type="search"
            value={search}
            placeholder="GSTIN, name or period"
            onChange={(event) => {
              setSearch(event.target.value)
            }}
            className="w-64 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          />
        </label>
      </div>

      {query.isLoading && <p className="text-sm text-ink-secondary">Loading…</p>}

      {query.data !== undefined && rows.length === 0 && (
        <Card className="text-sm text-ink-secondary">
          No filing matches that filter.
          {only === 'triggered' && ' Nothing was found in any return in your jurisdiction.'}
        </Card>
      )}

      {rows.length > 0 && (
        <Card flush className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Filings, worst first</caption>
              <thead>
                <tr className="border-b border-line bg-sunken text-xs text-ink-muted">
                  <th className="px-3 py-2 text-left">Business</th>
                  <th className="px-3 py-2 text-left">Period</th>
                  <th className="px-3 py-2 text-left">Returns held</th>
                  <th className="px-3 py-2 text-left">
                    <span className="inline-flex items-baseline">
                      Worst finding
                      <Explain title="What this column shows">
                        The most serious rule that fired on this return. It is the severity of
                        the finding, not of the business: a serious finding on an otherwise
                        clean filer is still serious.
                      </Explain>
                    </span>
                  </th>
                  <th className="px-3 py-2 text-right">Found</th>
                  <th className="px-3 py-2 text-right">
                    <span className="inline-flex items-baseline">
                      Not evaluated
                      <Explain term="notEvaluated" />
                    </span>
                  </th>
                  <th className="px-3 py-2 text-right">At stake</th>
                  <th className="px-3 py-2 text-left">Decision</th>
                  <th className="px-3 py-2 text-right">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Row key={`${row.gstin}-${row.period}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {query.data !== undefined && (
        <p className="mt-3 text-xs text-ink-muted">{query.data.note}</p>
      )}
    </div>
  )
}

function Row({ row }: { row: FilingRow }): JSX.Element {
  const navigate = useNavigate()
  const to = `/workbench/filings/${encodeURIComponent(row.gstin)}/${encodeURIComponent(row.period)}`
  return (
    <tr className="border-b border-line transition-colors last:border-0 hover:bg-sunken">
      <td className="px-3 py-2">
        <span className="block max-w-[22rem] truncate font-medium">
          {row.legal_name ?? 'Not in the register'}
        </span>
        <span className="block text-xs tabular text-ink-muted">
          {row.gstin}
          {row.division !== null && ` · ${row.division}`}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap tabular">{row.period_label}</td>
      <td className="px-3 py-2">
        {row.returns_held.length === 0 ? (
          <span className="text-xs text-ink-muted">none loaded</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {row.returns_held.map((held) => (
              <span
                key={held}
                className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] tabular"
              >
                {held}
              </span>
            ))}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        {row.worst_severity === null ? (
          <span className="text-xs text-ink-muted">nothing found</span>
        ) : (
          <StatusChip level={severityLevel(row.worst_severity)} label={row.worst_severity} />
        )}
      </td>
      <td className="px-3 py-2 text-right tabular">{row.triggered}</td>
      <td
        className={cn(
          'px-3 py-2 text-right tabular',
          row.not_evaluated > 0 ? 'text-status-unknown' : 'text-ink-muted',
        )}
      >
        {row.not_evaluated}
      </td>
      <td className="px-3 py-2 text-right">
        {row.at_stake === '0.00' ? (
          <span className="text-ink-muted">-</span>
        ) : (
          // An aggregate of this filing's findings, so its provenance is the
          // drill into them -- each one carries its own calc_id there. Passing
          // neither would render the no-provenance warning, correctly.
          <Money
            value={row.at_stake}
            calcId={null}
            drill={() => {
              navigate(to)
            }}
            label="Open this filing to see the findings this was summed from"
          />
        )}
      </td>
      <td className="px-3 py-2">
        {row.disposition === null ? (
          <span className="text-xs text-ink-muted">not reviewed</span>
        ) : (
          <span className="flex flex-col gap-0.5">
            <StatusChip
              level={dispositionLevel(row.disposition)}
              label={DISPOSITION_LABEL[row.disposition] ?? row.disposition}
            />
            <span className="text-[11px] text-ink-muted">{row.reviewed_by}</span>
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <Button asChild size="sm" variant="ghost">
          <Link to={to}>
            Open
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </td>
    </tr>
  )
}
