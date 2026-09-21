import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Card, CardTitle } from '../../components/ui/card'
import { api } from '../../lib/api'

/**
 * W9 index — pick a taxpayer to look at.
 *
 * The insight panels are per taxpayer by construction: a supplier
 * concentration averaged across a portfolio describes nobody. So this screen
 * does not aggregate anything. It lists who has been ingested and gets out of
 * the way.
 */
export default function InsightsIndex(): JSX.Element {
  const query = useQuery({
    queryKey: ['registry', 'insights-index'],
    queryFn: () => api.registry('?size=200&sort=legal_name&descending=false'),
  })

  return (
    <div className="w-full">
      <ScreenHeader
        code="W9"
        title="Shape of the year"
        lead={
          <>
            Six descriptive views of a taxpayer&apos;s filed year — where the purchases come from,
            what rates were declared, when credit notes were issued. Pick a taxpayer to open them.
          </>
        }
        meta={query.data === undefined ? undefined : `${String(query.data.total)} in your scope`}
      />

      {query.isLoading && <p className="text-sm text-ink-secondary">Loading…</p>}
      {query.isError && (
        <Card className="max-w-2xl">
          <CardTitle>Not available</CardTitle>
          <p className="mt-2 text-sm text-ink-secondary">
            Nothing has been ingested yet, or no engine run has been recorded.
          </p>
        </Card>
      )}

      {query.data !== undefined && (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {query.data.items.map((row) => (
            <li key={row.gstin}>
              <Link
                to={`/workbench/insights/${row.gstin}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-line bg-raised px-4 py-3 transition-colors hover:border-accent/50 hover:bg-sunken"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.legal_name}</span>
                  <span className="block truncate font-mono text-xs text-ink-muted">
                    {row.gstin}
                  </span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
