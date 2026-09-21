import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartCard, moneyDatum, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { NotEvaluated, NotEvaluatedCell } from '../../components/NotEvaluated'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import type { RevenuePeriodRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D3 - Revenue & Liability.
 *
 * Turnover and liability are two charts, never two axes on one chart. A second
 * y-axis invites a comparison of two series whose units have nothing to do
 * with each other, and the reader draws a conclusion the data does not carry.
 *
 * The 22 September 2025 rate revision is marked on the time axis: a series
 * crossing it is not comparing like with like, and an officer reading a dip
 * there deserves to know why it is there.
 */
export default function Revenue(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['revenue'], queryFn: () => api.revenue() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading revenue…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const evaluated = data.periods.filter((row) => row.evaluated)

  const series = (
    key: 'turnover' | 'liability' | 'cash_paid' | 'itc_utilised',
  ): ChartDatum[] =>
    evaluated.map((row) => ({
      label: row.period,
      ...moneyDatum(row[key] ?? '0.00'),
      drill: row.drill,
      note: row.period === data.boundary.period ? data.boundary.label : undefined,
    }))

  return (
    <div className="w-full">
      <ScreenHeader
        code="D3"
        title="Money at stake"
        lead="What the returns say is owed, where it came from, and how firmly the evidence supports it. This is what the returns show - not what has been demanded, and not what has been recovered."
        meta={`run ${data.engine_run_id.slice(0, 8)}`}
      />

      <section className="mb-6 rounded border border-line bg-chart p-4">
        <h3 className="text-sm font-semibold">{data.boundary.label}</h3>
        <p className="mt-1 text-sm text-ink-secondary">{data.boundary.note}</p>
      </section>

      {data.series !== null && (
        <div className="mb-6">
          <NotEvaluated title="Turnover, liability, cash and ITC" block={data.series} />
        </div>
      )}

      {evaluated.length > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Declared turnover"
            subtitle="M-R01, by period"
            data={series('turnover')}
            unit="₹"
            onDrill={(href) => {
              drill(href)
            }}
          />
          <ChartCard
            title="Gross liability"
            subtitle="M-R02, by period. A separate chart, deliberately."
            data={series('liability')}
            unit="₹"
            onDrill={(href) => {
              drill(href)
            }}
          />
          <ChartCard
            title="Cash paid"
            subtitle="M-R03 numerator"
            data={series('cash_paid')}
            unit="₹"
            onDrill={(href) => {
              drill(href)
            }}
          />
          <ChartCard
            title="ITC utilised"
            subtitle="M-R04 numerator"
            data={series('itc_utilised')}
            unit="₹"
            onDrill={(href) => {
              drill(href)
            }}
          />
        </div>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">By period</h2>
        <p className="mb-2 text-sm text-ink-secondary">{data.note}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="py-1 text-left">Period</th>
              <th className="py-1 text-right">Turnover</th>
              <th className="py-1 text-right">Liability</th>
              <th className="py-1 text-right">Cash ratio</th>
              <th className="py-1 text-right">ITC ratio</th>
              <th className="py-1 text-right">Effective rate</th>
            </tr>
          </thead>
          <tbody>
            {data.periods.map((row) => (
              <Row key={row.period} row={row} onDrill={drill} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Row({
  row,
  onDrill,
}: {
  row: RevenuePeriodRow
  onDrill: (href: string) => void
}): JSX.Element {
  if (!row.evaluated) {
    return (
      <tr className="border-b border-line">
        <td className="py-1 tabular">{row.period}</td>
        <td className="py-1 text-right" colSpan={5}>
          <NotEvaluatedCell />
        </td>
      </tr>
    )
  }
  return (
    <tr className="border-b border-line">
      <td className="py-1 tabular">{row.period}</td>
      <td className="py-1 text-right">
        <Money
          value={row.turnover ?? '0.00'}
          calcId={null}
          symbol={false}
          drill={() => {
            onDrill(row.drill)
          }}
        />
      </td>
      <td className="py-1 text-right">
        <Money
          value={row.liability ?? '0.00'}
          calcId={null}
          symbol={false}
          drill={() => {
            onDrill(row.drill)
          }}
        />
      </td>
      <td className="py-1 text-right tabular">{row.cash_ratio ?? '-'}</td>
      <td className="py-1 text-right tabular">{row.itc_ratio ?? '-'}</td>
      <td className="py-1 text-right tabular">{row.effective_rate ?? '-'}</td>
    </tr>
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
