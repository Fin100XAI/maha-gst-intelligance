import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDrillNavigation } from '../../components/ChartCard'
import { StatusChip, levelForFlag } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { ParameterRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Explain } from '../../components/Explain'

/**
 * D5 - Parameter Explorer. The screen that makes the department's own risk
 * framework legible at scale.
 *
 * The NOT_EVALUATED column is **not an embarrassment to hide**: it is the
 * roadmap, priced. It renders at the same visual weight as the rest, and it
 * drills like every other cell.
 */
export default function ParameterExplorer(): JSX.Element {
  const drill = useDrillNavigation()
  const [selected, setSelected] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['parameters'], queryFn: () => api.parameters() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading…</p>
  if (query.isError || !query.data) {
    return (
      <section className="max-w-2xl">
        <h1 className="mb-2 text-xl font-semibold">Parameter Explorer</h1>
        <StatusChip level="unknown" label="No engine run yet" />
        <p className="mt-3 text-sm text-ink-secondary">
          Nothing has been scored yet. No illustrative figures are shown.
        </p>
      </section>
    )
  }

  const rows = query.data.items
  const detail = rows.find((row) => row.param_id === selected) ?? null

  return (
    <div className="w-full">
      <ScreenHeader
        code="D5"
        title="The 34 risk flags"
        lead={
          <>
            Every one of the department&rsquo;s risk flags, and how many businesses landed on
            each rung of the 0-to-4 ladder. A flag with nothing but &ldquo;not evaluated&rdquo;
            against it is not a clean result &mdash; it is one the platform could not test.
          </>
        }
      />

      <div className="overflow-x-auto rounded border border-line bg-chart">
        <table className="w-full text-sm">
          <caption className="sr-only">Parameter flag incidence</caption>
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="p-2 text-left">Parameter</th>
              {[0, 1, 2, 3, 4].map((flag) => (
                <th key={flag} className="p-2 text-right">
                  Flag {flag}
                </th>
              ))}
              <th className="p-2 text-right">
                <span className="inline-flex items-baseline">
                  Not evaluated
                  <Explain term="notEvaluated" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.param_id}
                className={`border-b border-line hover:bg-sunken ${
                  selected === row.param_id ? 'bg-sunken' : ''
                }`}
              >
                <td className="p-2">
                  <button
                    type="button"
                    className="text-left underline decoration-dotted underline-offset-2"
                    onClick={() => {
                      setSelected(row.param_id)
                    }}
                  >
                    <span className="tabular">{row.param_id}</span>{' '}
                    <span className="text-ink-secondary">{row.title}</span>
                  </button>
                </td>
                {[0, 1, 2, 3, 4].map((flag) => (
                  <td key={flag} className="p-2 text-right tabular">
                    <Cell
                      count={row.flags[String(flag)] ?? 0}
                      flag={flag}
                      onDrill={() => {
                        drill(row.drill[`flag${String(flag)}`] ?? '')
                      }}
                    />
                  </td>
                ))}
                <td className="p-2 text-right tabular">
                  <Cell
                    count={row.not_evaluated}
                    flag={null}
                    label={row.external_feed ?? undefined}
                    onDrill={() => {
                      drill(row.drill['not_evaluated'] ?? '')
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm text-ink-muted">
        {query.data.note}
      </p>

      {detail !== null && <Detail row={detail} />}
    </div>
  )
}

function Cell({
  count,
  flag,
  label,
  onDrill,
}: {
  count: number
  flag: number | null
  label?: string | undefined
  onDrill: () => void
}): JSX.Element {
  if (count === 0) return <span className="text-ink-muted">-</span>
  const level = levelForFlag(flag)
  return (
    <button
      type="button"
      onClick={onDrill}
      className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
      title={
        label !== undefined
          ? `${String(count)} taxpayer(s) - awaits ${label}`
          : `${String(count)} taxpayer(s) at flag ${String(flag)}`
      }
    >
      <span className={level === 'unknown' ? 'text-status-unknown' : ''}>{count}</span>
    </button>
  )
}

function Detail({ row }: { row: ParameterRow }): JSX.Element {
  return (
    <section className="mt-5 rounded border border-line bg-chart p-4">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold">
          <span className="tabular">{row.param_id}</span> {row.title}
        </h2>
        <StatusChip
          level={row.external_feed !== null ? 'unknown' : 'good'}
          label={row.external_feed !== null ? `Awaits ${row.external_feed}` : row.banding}
        />
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_1fr]">
        <dt className="text-xs uppercase tracking-wide text-ink-muted">Metric</dt>
        <dd className="text-sm">{row.metric}</dd>

        <dt className="text-xs uppercase tracking-wide text-ink-muted">Banding</dt>
        <dd className="text-sm">
          {row.banding} · {row.direction} · weight <span className="tabular">{row.weight}</span>
        </dd>

        <dt className="text-xs uppercase tracking-wide text-ink-muted">Auditor action</dt>
        <dd className="text-sm">{row.action_point}</dd>

        {row.related_rules.length > 0 && (
          <>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Related findings</dt>
            <dd className="flex flex-wrap gap-1.5">
              {row.related_rules.map((rule) => (
                <span
                  key={rule}
                  className="rounded border border-line-strong px-1.5 py-0.5 text-xs tabular"
                >
                  {rule}
                </span>
              ))}
            </dd>
          </>
        )}

        {row.roadmap_ref !== null && (
          <>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Roadmap</dt>
            <dd className="text-sm tabular">{row.roadmap_ref}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
