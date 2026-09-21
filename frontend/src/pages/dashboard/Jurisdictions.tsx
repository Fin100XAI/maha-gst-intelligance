import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChartCard, moneyDatum, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { Money } from '../../components/Money'
import { NotEvaluatedCell } from '../../components/NotEvaluated'
import { api } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D7 - Jurisdictions.
 *
 * Ranked on revenue at risk, not on a mean score. A division of two hundred
 * small taxpayers and a division of twenty large ones do not compare on a mean
 * anything, and an ordering that implied they did would be used to move people
 * and budgets.
 */
export default function Jurisdictions(): JSX.Element {
  const drill = useDrillNavigation()
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['jurisdictions'], queryFn: () => api.jurisdictions() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading divisions…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const chart: ChartDatum[] = data.items.map((row) => ({
    label: row.jurisdiction,
    ...moneyDatum(row.revenue_at_risk),
    drill: row.drill,
    note: `${String(row.taxpayers)} taxpayers`,
  }))

  return (
    <div className="w-full">
      <ScreenHeader
        code="D7"
        title="By office"
        lead="The same figures, broken down by commissionerate and division - so a difference between two offices can be seen rather than assumed."
        meta={`run ${data.engine_run_id.slice(0, 8)}`}
      />

      <div className="mb-6">
        <ChartCard
          title="Revenue at risk, by division"
          subtitle={data.note}
          data={chart}
          unit="₹"
          onDrill={(href) => {
            drill(href)
          }}
        />
      </div>

      <section>
        <h2 className="mb-2 text-base font-semibold">All divisions</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="py-1 text-left">Division</th>
              <th className="py-1 text-right">Taxpayers</th>
              <th className="py-1 text-right">Revenue at risk</th>
              <th className="py-1 text-right">Compliance</th>
              <th className="py-1 text-right">Barred periods</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row) => (
              <tr key={row.jurisdiction} className="border-b border-line">
                <td className="py-1">
                  <button
                    type="button"
                    className="underline decoration-dotted underline-offset-2"
                    onClick={() => {
                      navigate(row.href)
                    }}
                  >
                    {row.jurisdiction}
                  </button>
                </td>
                <td className="py-1 text-right tabular">{row.taxpayers}</td>
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
                <td className="py-1 text-right">
                  {row.compliance_rate === null ? (
                    <NotEvaluatedCell />
                  ) : (
                    <span className="tabular">{row.compliance_rate}</span>
                  )}
                </td>
                <td className="py-1 text-right tabular">{row.barred_periods}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
