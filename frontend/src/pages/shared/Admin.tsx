import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScreenHeader } from '../../components/ScreenHeader'
import { StatusChip } from '../../components/StatusChip'
import { ThresholdRegister } from '../../components/ThresholdRegister'
import { api } from '../../lib/api'

/**
 * S3 — Admin: what the platform knows it does not know.
 *
 * Three lists, and the department should be uncomfortable about all of them:
 *
 * 1. **Unconfigured statutory values** — a due date, rate or form number the
 *    spec does not state. The platform raises rather than guessing, so a rule
 *    that needs one cannot run at all.
 * 2. **Provisional thresholds** — a working value with no notification behind
 *    it. Findings computed from one are correct arithmetic on an assumption.
 * 3. **Dark parameters** — excluded from both sides of the P-Score because the
 *    feed does not exist yet. The count is the business case for building it.
 *
 * This screen exists so that "the platform does not know" is a fact someone
 * owns, rather than something discovered in an appellate forum.
 */
export default function Admin(): JSX.Element {
  const query = useQuery({ queryKey: ['gaps'], queryFn: () => api.gaps() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading…</p>
  if (query.isError || !query.data) {
    return <p className="text-status-critical">The gap register could not be loaded.</p>
  }
  const data = query.data

  return (
    <div className="w-full">
      <ScreenHeader
        code="S3"
        title="Settings and thresholds"
        lead={
          <>
            The numbers the rules run on, and everything the platform knows it does not know.
            A value nobody has adopted, a statutory figure that is not in the department&rsquo;s
            material, and a risk flag waiting on a data feed are three different problems, and
            they are kept apart here rather than averaged into a single health score.
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tile
          label="Unconfigured statutory values"
          count={data.unconfigured_statutory.count}
          level="critical"
        />
        <Tile
          label="Thresholds awaiting adoption"
          count={data.provisional_thresholds.count}
          level="warning"
        />
        <Tile label="Parameters awaiting a feed" count={data.dark_parameters.count} level="unknown" />
      </div>

      <section className="mb-8">
        <h2 className="mb-1 text-base font-semibold">Unconfigured statutory values</h2>
        <p className="mb-3 text-sm text-ink-secondary">{data.unconfigured_statutory.note}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted">
              <th className="py-1 text-left">Parameter</th>
              <th className="py-1 text-left">What is missing</th>
              <th className="py-1 text-left">Reference</th>
            </tr>
          </thead>
          <tbody>
            {data.unconfigured_statutory.items.map((row) => (
              <tr key={row.parameter_id} className="border-b border-line">
                <td className="py-1 tabular">{row.parameter_id}</td>
                <td className="py-1">{row.missing}</td>
                <td className="py-1 tabular text-ink-muted">{row.todo_ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <ThresholdRegister />
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">Parameters awaiting a feed</h2>
        <p className="mb-3 text-sm text-ink-secondary">{data.dark_parameters.note}</p>
        <ul className="space-y-2">
          {data.dark_parameters.items.map((row) => (
            <li key={row.param_id} className="panel p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-ink-muted tabular">{row.param_id}</span>
                  <span className="font-medium">{row.title}</span>
                </div>
                <span className="text-sm text-ink-secondary">
                  {row.external_feed ?? 'feed not named'}
                  {row.roadmap_ref !== null && ` · ${row.roadmap_ref}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Tile({
  label,
  count,
  level,
}: {
  label: string
  count: number
  level: 'critical' | 'warning' | 'unknown'
}): JSX.Element {
  return (
    <article className="panel p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-xs uppercase tracking-wide text-ink-muted">{label}</h3>
        <StatusChip level={level} label={level === 'unknown' ? 'Dark' : 'Open'} />
      </div>
      <p className="text-3xl font-semibold tabular">{count}</p>
    </article>
  )
}
