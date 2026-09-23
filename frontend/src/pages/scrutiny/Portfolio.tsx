import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import type { JSX } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import type { MatrixPortfolioRow } from '../../lib/reports'

/**
 * Every taxpayer scanned, against the department's own 141 checks.
 *
 * One sentence, then one table. An officer should be able to read this screen
 * in ten seconds and know which file to open - so it is sorted by money, and
 * the only other column that earns its place is how many of the 141 checks
 * actually failed.
 *
 * **The coverage line is not an apology, it is the point.** 29 of 141 can be
 * answered from GST returns alone. Saying so on the first screen is what makes
 * the rest of the numbers believable, and it turns "the tool only does a fifth
 * of the matrix" from a criticism into a procurement decision with a price on
 * it.
 */

function Bar({ row, worst }: { row: MatrixPortfolioRow; worst: number }): JSX.Element {
  const value = Number.parseFloat(row.exposure_total)
  const width = worst <= 0 ? 0 : Math.max(2, (value / worst) * 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
      <div className="h-full bg-status-critical/70" style={{ width: `${String(width)}%` }} />
    </div>
  )
}

export default function Portfolio(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const snapshot = params.get('snapshot') ?? ''

  const { data, isPending, error } = useQuery({
    queryKey: ['matrixPortfolio', snapshot],
    queryFn: () => api.matrixPortfolio(snapshot),
    enabled: snapshot !== '',
  })

  if (snapshot === '') return <p className="text-ink-secondary">No scan selected.</p>
  if (isPending)
    return <p className="text-ink-secondary">Running 141 checks against every taxpayer...</p>
  if (error) return <p className="text-status-critical">{error.message}</p>

  const withFindings = data.taxpayers.filter((t) => Number.parseFloat(t.exposure_total) > 0)
  const total = data.taxpayers.reduce((sum, t) => sum + Number.parseFloat(t.exposure_total), 0)
  const worst = Math.max(...data.taxpayers.map((t) => Number.parseFloat(t.exposure_total)), 0)

  return (
    <article className="max-w-[68rem]">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Portfolio</h1>
        <p className="mt-2 max-w-[46rem] text-[1.0625rem] leading-[1.7] text-ink">
          <strong className="tabular">{data.taxpayers.length}</strong> taxpayers scanned against the
          department&apos;s <strong className="tabular">{data.matrix_size}</strong> checks.
          Something to answer for on <strong className="tabular">{withFindings.length}</strong> of
          them, worth{' '}
          <strong className="tabular">
            {/*
              An aggregate has no single calc_id - its provenance is the rows
              it was summed from, and those are the table immediately below.
              `<Money>` takes that as its drill rather than marking the figure
              untraceable.
            */}
            <Money
              value={total.toFixed(2)}
              drill={() => {
                document.getElementById('portfolio-table')?.scrollIntoView({ block: 'start' })
              }}
            />
          </strong>{' '}
          in total.
        </p>
        <p className="mt-3 max-w-[46rem] text-sm text-ink-secondary">{data.coverage_note}</p>
      </header>

      <div id="portfolio-table" className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-sunken text-left">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Taxpayer
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
                Checks failed
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
                Exposure
              </th>
              <th scope="col" className="w-40 px-4 py-2.5 font-medium">
                <span className="sr-only">Relative size</span>
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.taxpayers.map((row) => (
              <tr key={row.gstin} className="border-t border-line odd:bg-raised/40">
                <td className="px-4 py-3">
                  <span className="block font-medium text-ink">{row.legal_name ?? row.gstin}</span>
                  <span className="block text-xs text-ink-muted tabular">{row.gstin}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular">
                  {row.failed.length === 0 ? (
                    <span className="text-ink-muted">none</span>
                  ) : (
                    <span className="text-status-critical">
                      {row.failed.length} of {data.matrix_size}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular">
                  <Money
                    value={row.exposure_total}
                    symbol={false}
                    drill={() => {
                      navigate(`/scrutiny/matrix?gstin=${row.gstin}&snapshot=${snapshot}`)
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <Bar row={row} worst={worst} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/scrutiny/matrix?gstin=${row.gstin}&snapshot=${snapshot}`}
                    className="inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4 hover:decoration-solid"
                  >
                    Open
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-ink">
          Which departmental checks are failing, and how widely
        </h2>
        <ul className="space-y-2">
          {[
            ...data.taxpayers
              .flatMap((t) => t.failed)
              .reduce((map, check) => {
                const seen = map.get(check.id)
                map.set(check.id, {
                  id: check.id,
                  check: check.check,
                  count: (seen?.count ?? 0) + 1,
                })
                return map
              }, new Map<string, { id: string; check: string; count: number }>())
              .values(),
          ]
            .sort((a, b) => b.count - a.count)
            .map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-3 rounded-lg border border-line bg-raised px-4 py-2.5 text-sm"
              >
                <span className="text-xs text-ink-muted tabular">{entry.id}</span>
                <span className="flex-1 text-ink">{entry.check}</span>
                <span className="tabular text-ink-secondary">
                  {entry.count} of {data.taxpayers.length} taxpayers
                </span>
              </li>
            ))}
        </ul>
      </section>
    </article>
  )
}
