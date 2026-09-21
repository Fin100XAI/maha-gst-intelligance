import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDrillNavigation } from '../../components/ChartCard'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D8 - Officers.
 *
 * Capacity and case mix. **Not** a league table, and deliberately not
 * sortable into one.
 *
 * Ten ITC-fraud cases do not compare with fifty late-fee cases. A screen that
 * ranked officers on closures would be read as a performance ranking within a
 * week of being shipped, and would be used to make decisions about people that
 * the underlying number cannot support. So the case mix travels beside every
 * throughput figure, there is no single ranking column, and the rows are in
 * alphabetical order.
 */
export default function Officers(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['officers'], queryFn: () => api.officers() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading officers…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  return (
    <div className="w-full">
      <ScreenHeader
        code="D8"
        title="By officer"
        lead="Workload and outcomes per officer. Read it as a question about capacity and allocation, not as a ranking: an officer with hard cases will look slower than one with easy ones."
        meta={`run ${data.engine_run_id.slice(0, 8)}`}
      />

      <section className="mb-5 rounded border border-line bg-sunken p-4">
        <h2 className="text-sm font-semibold">This is not a ranking</h2>
        <p className="mt-1 text-sm text-ink-secondary">{data.note}</p>
      </section>

      {data.items.length === 0 && (
        <p className="text-ink-secondary">
          No officer facts were recorded in this run. That is not a throughput of zero - no
          case activity was supplied.
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {data.items.map((officer) => (
          <article key={officer.officer_id} className="panel p-4">
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium tabular">{officer.officer_id}</h3>
              <span className="text-sm text-ink-secondary">
                {officer.jurisdiction ?? 'no division recorded'}
              </span>
            </header>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              <Cell label="Open" value={String(officer.cases_open)} />
              <Cell label="Closed" value={String(officer.cases_closed)} />
              <Cell label="Awaiting approval" value={String(officer.notices_pending_approval)} />
              <Cell label="Mean age" value={officer.mean_age_days ?? '-'} suffix=" days" />
            </dl>

            <div className="mt-3">
              <h4 className="text-xs uppercase tracking-wide text-ink-muted">Case mix</h4>
              {Object.keys(officer.case_mix).length === 0 ? (
                <p className="mt-1 text-sm text-ink-muted">
                  No mix recorded. Throughput without it is not interpretable, so no
                  comparison is offered.
                </p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-2 text-xs">
                  {Object.entries(officer.case_mix).map(([family, count]) => (
                    <li key={family} className="rounded border border-line px-2 py-0.5 tabular">
                      {family} · {count}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 text-sm">
              <div className="contents">
                <dt className="text-ink-muted">Raised</dt>
                <dd className="text-right">
                  <Money
                    value={officer.demand_raised}
                    calcId={null}
                    symbol={false}
                    drill={() => {
                      drill(officer.drill)
                    }}
                  />
                </dd>
                <dt className="text-ink-muted">Collected</dt>
                <dd className="text-right">
                  <Money
                    value={officer.demand_collected}
                    calcId={null}
                    symbol={false}
                    drill={() => {
                      drill(officer.drill)
                    }}
                  />
                </dd>
              </div>
            </dl>

            <button
              type="button"
              className="mt-3 text-xs underline"
              onClick={() => {
                drill(officer.drill)
              }}
            >
              Their taxpayers
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

function Cell({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string | undefined
}): JSX.Element {
  return (
    <div className="contents">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular">
        {value}
        {suffix ?? ''}
      </dd>
    </div>
  )
}

function NoRun(): JSX.Element {
  return (
    <section className="max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold">No engine run yet</h1>
      <p className="text-ink-secondary">
        Nothing has been ingested and scored. Run <code className="text-sm">make demo</code>.
      </p>
    </section>
  )
}
