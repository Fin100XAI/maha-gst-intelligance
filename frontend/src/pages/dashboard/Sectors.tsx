import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartCard, moneyDatum, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { Money } from '../../components/Money'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D9 — Sectors.
 *
 * A sector below the minimum cohort size is shown, and marked unusable as a
 * cohort. A percentile over four taxpayers is not a percentile, and banding
 * one against it would produce a comparison the data cannot support — which
 * would then be quoted in a notice.
 */
export default function Sectors(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['sectors'], queryFn: () => api.sectors() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading sectors…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const usable = data.items.filter((row) => row.cohort_usable)
  const chart: ChartDatum[] = usable.map((row) => ({
    label: row.sector,
    ...moneyDatum(row.revenue_at_risk),
    drill: row.drill,
    note: `${String(row.taxpayers)} taxpayers`,
  }))

  return (
    <div className="w-full">
      <ScreenHeader
        code="D9"
        title="By trade"
        lead="The same figures by line of business. A pattern that is normal for one trade can be a serious outlier in another, which is why several flags compare a business with its peers rather than against a fixed number."
        meta={`run ${data.engine_run_id.slice(0, 8)}`}
      />

      {usable.length > 0 ? (
        <div className="mb-6">
          <ChartCard
            title="Revenue at risk, by sector"
            subtitle={`Cohorts of at least ${String(data.min_cohort)} taxpayers only.`}
            data={chart}
            unit="₹"
            onDrill={(href) => {
              drill(href)
            }}
          />
        </div>
      ) : (
        <section className="mb-6 rounded border border-status-unknown/40 bg-sunken p-4">
          <h2 className="text-sm font-semibold">No sector reaches the minimum cohort</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Every sector in this run has fewer than {data.min_cohort} taxpayers, so no
            sector chart is drawn. The table below lists them with their counts, so the
            gap is visible rather than implied.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">All sectors</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="py-1 text-left">Sector</th>
              <th className="py-1 text-right">Taxpayers</th>
              <th className="py-1 text-right">Mean P-Score</th>
              <th className="py-1 text-right">Mean F-Score</th>
              <th className="py-1 text-right">Revenue at risk</th>
              <th className="py-1 text-left">Cohort</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.sector} className="border-b border-line">
                <td className="py-1 tabular">{row.sector}</td>
                <td className="py-1 text-right tabular">{row.taxpayers}</td>
                <td className="py-1 text-right tabular">{row.p_score_mean ?? '—'}</td>
                <td className="py-1 text-right tabular">{row.f_score_mean ?? '—'}</td>
                <td className="py-1 text-right">
                  <Money
                    value={row.revenue_at_risk}
                    calcId={null}
                    symbol={false}
                    drill={() => {
                      drill(row.drill)
                    }}
                  />
                </td>
                <td className="py-1">
                  {row.cohort_usable ? (
                    <StatusChip level="good" label="Usable" />
                  ) : (
                    <StatusChip
                      level="unknown"
                      label={`Below ${String(data.min_cohort)}`}
                      title="Too few taxpayers to band a percentile against."
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-ink-secondary">{data.note}</p>
      </section>
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
