import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartCard, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { NotEvaluated, NotEvaluatedCell } from '../../components/NotEvaluated'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D2 — Filing Compliance.
 *
 * The three-year bar leads, because it is the only number on this screen that
 * expires. A period not filed within three years of its due date can never be
 * filed (s.39(11)), and the revenue in it stops being recoverable through the
 * return — so it is shown first, not buried under compliance rates.
 *
 * Compliance rates appear only when the filing-status register is present.
 * The filing facts are built from periods the engine found *unfiled*; a rate
 * computed over them alone would read as 0% compliance and mean nothing of the
 * kind, so the server refuses to compute one and this screen says why.
 */
export default function Filing(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['filing'], queryFn: () => api.filing() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading filing…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const notFiled: ChartDatum[] = data.periods.map((row) => ({
    label: row.period,
    value: `${String(row.not_filed)} periods`,
    magnitude: row.not_filed,
    drill: row.drill.not_filed,
    status: row.barred > 0 ? 'critical' : row.near_bar > 0 ? 'serious' : 'warning',
    note: row.barred > 0 ? `${String(row.barred)} already barred` : undefined,
  }))

  return (
    <div className="w-full">
      <ScreenHeader
        code="D2"
        title="Who is filing"
        lead="Which businesses filed their returns, which filed late, and which have not filed at all. A return that was never filed still carries a liability — and a deadline after which it cannot be recovered."
        meta={`run ${data.engine_run_id.slice(0, 8)}${data.jurisdiction === null ? '' : ` · ${data.jurisdiction}`}`}
      />

      {/* The bar comes first: it is the number that expires. */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <BarTile
          label="Periods already barred"
          count={data.bar.barred}
          level="critical"
          onDrill={() => {
            drill(data.bar.drill.barred)
          }}
        />
        <BarTile
          label="Periods approaching the bar"
          count={data.bar.near_bar}
          level="serious"
          onDrill={() => {
            drill(data.bar.drill.near_bar)
          }}
        />
        <p className="text-sm text-ink-secondary sm:col-span-2">{data.bar.note}</p>
      </section>

      {data.compliance !== null && (
        <div className="mb-6">
          <NotEvaluated title="Compliance and on-time rates" block={data.compliance} />
        </div>
      )}

      <div className="mb-6">
        <ChartCard
          title="Return-periods not filed, by period"
          subtitle="Red where the three-year bar has already fallen."
          data={notFiled}
          unit="periods"
          onDrill={(href) => {
            drill(href)
          }}
          footer={<p className="text-xs text-ink-muted">{data.note}</p>}
        />
      </div>

      <section>
        <h2 className="mb-2 text-base font-semibold">By period</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="py-1 text-left">Period</th>
              <th className="py-1 text-left">Returns</th>
              <th className="py-1 text-right">Not filed</th>
              <th className="py-1 text-right">Barred</th>
              <th className="py-1 text-right">Near bar</th>
              <th className="py-1 text-right">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {data.periods.map((row) => (
              <tr key={row.period} className="border-b border-line">
                <td className="py-1 tabular">{row.period}</td>
                <td className="py-1 text-ink-secondary">{row.return_types.join(', ')}</td>
                <td className="py-1 text-right tabular">
                  <button
                    type="button"
                    className="underline decoration-dotted underline-offset-2"
                    onClick={() => {
                      drill(row.drill.not_filed)
                    }}
                  >
                    {row.not_filed}
                  </button>
                </td>
                <td className="py-1 text-right tabular">{row.barred}</td>
                <td className="py-1 text-right tabular">{row.near_bar}</td>
                <td className="py-1 text-right">
                  {row.rates_evaluated ? (
                    <span className="tabular">{row.compliance_rate ?? '—'}</span>
                  ) : (
                    <NotEvaluatedCell />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function BarTile({
  label,
  count,
  level,
  onDrill,
}: {
  label: string
  count: number
  level: 'critical' | 'serious'
  onDrill: () => void
}): JSX.Element {
  return (
    <article className="panel p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-xs uppercase tracking-wide text-ink-muted">{label}</h3>
        <StatusChip level={level} label={level === 'critical' ? 'Irrecoverable' : 'Expiring'} />
      </div>
      <button
        type="button"
        onClick={onDrill}
        className="text-3xl font-semibold tabular underline decoration-dotted underline-offset-4"
      >
        {count}
      </button>
    </article>
  )
}

export function NoRun(): JSX.Element {
  return (
    <section className="max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold">No engine run yet</h1>
      <p className="text-ink-secondary">
        Nothing has been ingested and scored. Run <code className="text-sm">make demo</code>, or
        upload a return through the ingestion screen.
      </p>
    </section>
  )
}
