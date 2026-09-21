import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartCard, moneyDatum, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D6 - Enforcement Funnel.
 *
 * Flagged → selected → notices → replies → appeals → sustained, with the drop
 * at each step shown as a share of the step above it *and* of the top, because
 * those two numbers answer different questions and the one you are not shown
 * is the one you would have wanted.
 *
 * A stage reading zero means nothing has reached it yet - not that the stage
 * failed. The screen says so rather than letting an empty bar imply a
 * collapse in enforcement.
 */
export default function Funnel(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['funnel'], queryFn: () => api.funnel() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading the funnel…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const steps: ChartDatum[] = data.steps.map((step) => ({
    label: step.label,
    value: String(step.count),
    magnitude: step.count,
    drill: step.drill,
    status: step.count === 0 ? 'unknown' : undefined,
    note:
      step.share_of_previous === null
        ? undefined
        : `${step.share_of_previous} of the step above`,
  }))

  const months: ChartDatum[] = data.months.map((month) => ({
    label: month.month,
    ...moneyDatum(month.demand_raised),
    drill: month.drill,
  }))

  return (
    <div className="w-full">
      <ScreenHeader
        code="D6"
        title="From flag to recovery"
        lead="What happens to a risk flag after it is raised: how many became audits, how many became notices, how many were answered, and how much money actually came in. The drop between each stage is where the department loses its work."
        meta={`run ${data.engine_run_id.slice(0, 8)}`}
      />

      <div className="mb-6">
        <ChartCard
          title="Flagged to sustained"
          subtitle="Every stage drills to the taxpayers in it."
          data={steps}
          unit="count"
          onDrill={(href) => {
            drill(href)
          }}
          footer={
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-ink-muted">
                  <th className="py-1 text-left">Stage</th>
                  <th className="py-1 text-right">Count</th>
                  <th className="py-1 text-right">Of previous</th>
                  <th className="py-1 text-right">Of flagged</th>
                </tr>
              </thead>
              <tbody>
                {data.steps.map((step) => (
                  <tr key={step.stage} className="border-b border-line">
                    <td className="py-1">{step.label}</td>
                    <td className="py-1 text-right tabular">{step.count}</td>
                    <td className="py-1 text-right tabular">
                      {step.share_of_previous ?? '-'}
                    </td>
                    <td className="py-1 text-right tabular">{step.share_of_flagged ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <MoneyTile
          label="Demand raised"
          value={data.money.demand_raised}
          onDrill={() => {
            drill(data.steps[0]?.drill ?? '')
          }}
        />
        <MoneyTile
          label="Demand confirmed"
          value={data.money.demand_confirmed}
          rate={data.money.confirmation_rate}
          rateLabel="of raised"
          onDrill={() => {
            drill(data.steps[1]?.drill ?? '')
          }}
        />
        <MoneyTile
          label="Demand collected"
          value={data.money.demand_collected}
          rate={data.money.collection_rate}
          rateLabel="of confirmed"
          onDrill={() => {
            drill(data.steps[1]?.drill ?? '')
          }}
        />
      </section>

      {data.months.length > 0 && (
        <div className="mb-4">
          <ChartCard
            title="Demand raised, by month"
            subtitle="M-E04"
            data={months}
            unit="₹"
            onDrill={(href) => {
              drill(href)
            }}
          />
        </div>
      )}

      <p className="text-sm text-ink-secondary">{data.note}</p>
    </div>
  )
}

function MoneyTile({
  label,
  value,
  rate,
  rateLabel,
  onDrill,
}: {
  label: string
  value: string
  rate?: string | null | undefined
  rateLabel?: string | undefined
  onDrill: () => void
}): JSX.Element {
  return (
    <article className="panel p-4">
      <h3 className="text-xs uppercase tracking-wide text-ink-muted">{label}</h3>
      <p className="mt-1 text-xl font-semibold">
        <Money value={value} calcId={null} drill={onDrill} />
      </p>
      {rate !== undefined && (
        <p className="mt-1 text-sm text-ink-secondary tabular">
          {rate === null ? `- ${rateLabel ?? ''}` : `${rate} ${rateLabel ?? ''}`}
        </p>
      )}
    </article>
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
