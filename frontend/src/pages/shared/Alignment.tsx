import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Explain } from '../../components/Explain'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { AlignmentRow, AlignmentView } from '../../lib/api'

/**
 * S5 - Check against the circular.
 *
 * The department's circular sets out 34 risk flags. This platform implements
 * 34 audit risk parameters. Those two numbers matching proves nothing, so this
 * screen puts them side by side and lets a reader check the match themselves:
 * the circular's own words on the left, what the platform actually computes on
 * the right, and - when a run is chosen - how many businesses each flag was
 * really evaluated for.
 *
 * That last column is the part nobody can argue with. A parameter that is
 * implemented, documented, and never evaluated is doing no work, and only a
 * count will say so. On the demonstration data it says so loudly, which is the
 * screen behaving correctly rather than the screen being broken.
 */
type Filter = 'all' | 'computed' | 'awaiting' | 'idle'

export default function Alignment(): JSX.Element {
  const [runId, setRunId] = useState<string>('')
  const [filter, setFilter] = useState<Filter>('all')
  const [openFlag, setOpenFlag] = useState<string | null>(null)

  const runs = useQuery({ queryKey: ['engine-runs'], queryFn: () => api.engineRuns() })
  const query = useQuery({
    queryKey: ['alignment', runId],
    queryFn: () => api.alignment(runId === '' ? undefined : runId),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading…</p>
  if (query.isError || query.data === undefined) {
    return <p className="text-status-critical">The comparison could not be loaded.</p>
  }
  const data = query.data
  const rows = data.items.filter((row) => matches(row, filter))

  return (
    <div className="w-full">
      <header className="mb-4">
        <div className="mb-1 text-xs font-medium tracking-wide text-ink-muted tabular">S5</div>
        <h1 className="text-2xl font-semibold">Check against the circular</h1>
        <p className="mt-2 text-base text-ink-secondary">
          The department&rsquo;s {data.source.flag_count} risk flags, in its own words, beside
          what this platform actually does about each one. Read them against each other - that is
          what the screen is for.
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Source: <em>{data.source.title}</em>
        </p>
      </header>

      <Summary data={data} />

      <section className="mb-5 rounded border border-line bg-sunken p-3">
        <h2 className="text-sm font-semibold">What is stopping the rest</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Ten of the {data.source.flag_count} flags need data the State does not receive today.
          Four connections would switch all ten on - that is the whole business case, and it is
          countable:
        </p>
        <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
          {data.feeds.map((feed) => (
            <li key={feed.feed} className="flex items-baseline gap-2">
              <span className="font-medium">{feed.feed}</span>
              <span className="text-ink-muted tabular">
                {feed.flags.join(', ')}
                {feed.roadmap_ref !== null && ` · ${feed.roadmap_ref}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------- controls */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Count against a run
          <select
            value={runId}
            onChange={(event) => {
              setRunId(event.target.value)
            }}
            className="w-72 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          >
            <option value="">Do not count - just compare the definitions</option>
            {(runs.data?.items ?? []).map((run) => (
              <option key={run.engine_run_id} value={run.engine_run_id}>
                {run.started_at.slice(0, 16).replace('T', ' ')} · {run.fy ?? 'all years'} ·{' '}
                {run.gstin_count} businesses
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-1">
          {(
            [
              ['all', `All ${String(data.items.length)}`],
              ['computed', `Runs on our returns (${String(data.summary.computed_from_returns)})`],
              ['awaiting', `Waiting on a feed (${String(data.summary.awaiting_feed)})`],
              ...(runId === ''
                ? []
                : ([['idle', 'Never actually evaluated']] as [Filter, string][])),
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFilter(value)
              }}
              aria-pressed={filter === value}
              className={
                filter === value
                  ? 'rounded border border-ink-secondary bg-sunken px-2 py-1 text-xs font-medium'
                  : 'rounded border border-line px-2 py-1 text-xs text-ink-secondary hover:text-ink'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {runId !== '' && <RunNote data={data} />}

      {/* ---------------------------------------------------------- rows */}
      <ul className="space-y-2">
        {rows.map((row) => (
          <FlagRow
            key={row.param_id}
            row={row}
            open={openFlag === row.param_id}
            onToggle={() => {
              setOpenFlag((current) => (current === row.param_id ? null : row.param_id))
            }}
          />
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="rounded border border-line p-4 text-sm text-ink-secondary">
          No flag matches that filter - which, for &ldquo;never actually evaluated&rdquo;, is the
          answer you want.
        </p>
      )}

      <p className="mt-6 border-t border-line pt-3 text-sm text-ink-muted">{data.note}</p>
    </div>
  )
}

/* -------------------------------------------------------------- pieces */

function Summary({ data }: { data: AlignmentView }): JSX.Element {
  const complete = data.summary.implemented === data.summary.in_circular
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <article className="panel p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-xs uppercase tracking-wide text-ink-muted">
            Flags in the circular
          </h2>
          <StatusChip
            level={complete ? 'good' : 'critical'}
            label={complete ? 'All present' : 'Gap'}
          />
        </div>
        <p className="text-3xl font-semibold tabular">
          {data.summary.implemented} / {data.summary.in_circular}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {complete
            ? 'Every flag has a parameter, and no parameter exists that the circular does not ask for.'
            : `Missing: ${data.summary.missing.join(', ')}`}
        </p>
      </article>

      <article className="panel p-4">
        <h2 className="mb-1 text-xs uppercase tracking-wide text-ink-muted">
          Run on the returns we hold
        </h2>
        <p className="text-3xl font-semibold tabular">{data.summary.computed_from_returns}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Computable today from GSTR-1, GSTR-3B and GSTR-2B.
        </p>
      </article>

      <article className="panel p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-xs uppercase tracking-wide text-ink-muted">Waiting on a feed</h2>
          <StatusChip level="unknown" label="Dark" />
        </div>
        <p className="text-3xl font-semibold tabular">{data.summary.awaiting_feed}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Reported as not evaluated, never as clear.
        </p>
      </article>
    </div>
  )
}

function RunNote({ data }: { data: AlignmentView }): JSX.Element {
  const evaluated = data.summary.evaluated_in_run ?? 0
  const total = data.summary.in_circular
  const thin = evaluated < data.summary.computed_from_returns
  return (
    <div
      className={
        thin
          ? 'mb-4 rounded border border-status-warning/50 bg-sunken p-3'
          : 'mb-4 rounded border border-line bg-sunken p-3'
      }
    >
      <h2 className="flex items-baseline text-sm font-semibold">
        {evaluated} of {total} flags actually produced a result in this run
        <Explain title="Why this number matters">
          A flag can be implemented, documented, and still never run - because the return it
          needs was not uploaded, or because there were too few similar businesses to compare
          against. Counting is the only way to tell the difference between a platform that
          covers the circular and one that merely claims to.
        </Explain>
      </h2>
      <p className="mt-1 text-sm text-ink-secondary">
        {data.summary.run_taxpayers} businesses, {data.summary.run_fy ?? 'all years'}.
        {thin && ' Open a flag below to see exactly what was missing.'}
      </p>
    </div>
  )
}

function FlagRow({
  row,
  open,
  onToggle,
}: {
  row: AlignmentRow
  open: boolean
  onToggle: () => void
}): JSX.Element {
  const awaiting = row.availability.state === 'AWAITING_FEED'
  const idle = row.run !== null && row.run.evaluated === 0
  return (
    <li className="rounded border border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-baseline gap-3 p-3 text-left hover:bg-sunken"
      >
        <span aria-hidden="true" className="w-3 shrink-0 text-xs text-ink-muted">
          {open ? '−' : '+'}
        </span>
        <span className="w-12 shrink-0 text-sm font-semibold tabular">{row.label}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{row.platform.title}</span>
          <span className="mt-0.5 block text-sm text-ink-secondary">{row.plain}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {awaiting ? (
            <StatusChip level="unknown" label="Waiting on a feed" />
          ) : (
            <StatusChip level="good" label="Runs on our returns" />
          )}
          {row.run !== null && (
            <span className="text-xs text-ink-muted tabular">
              {row.run.evaluated > 0
                ? `${String(row.run.evaluated)} evaluated · ${String(row.run.flagged)} flagged`
                : 'not evaluated'}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-line p-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                What the circular says
              </h3>
              <blockquote className="border-l-2 border-line pl-3 text-sm text-ink-secondary">
                {row.source_text}
              </blockquote>
              <p className="mt-2 text-xs text-ink-muted">
                Stored word for word. Nothing on this side has been edited or summarised.
              </p>
            </div>

            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                What this platform does
              </h3>
              <dl className="space-y-2 text-sm">
                <Row label="Computes">
                  <span className="tabular">{row.platform.computes}</span>
                </Row>
                <Row label="Reads from">{row.platform.data_sources.join(', ')}</Row>
                <Row label="How the flag is set">{row.platform.how_flagged}</Row>
                {row.platform.compares_year_on_year && (
                  <Row label="Also compares">
                    The change against the previous year, as the circular asks.
                  </Row>
                )}
                <Row label="What the auditor should do">{row.platform.action_point}</Row>
                {row.platform.related_rules.length > 0 && (
                  <Row label="Money rules that test the same ground">
                    <span className="tabular">{row.platform.related_rules.join(', ')}</span>
                  </Row>
                )}
                {awaiting && (
                  <Row label="Waiting on">
                    {row.availability.feed}
                    {row.availability.roadmap_ref !== null && (
                      <span className="text-ink-muted"> · {row.availability.roadmap_ref}</span>
                    )}
                  </Row>
                )}
              </dl>
            </div>
          </div>

          {row.run !== null && (
            <div className="mt-4 border-t border-line pt-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                In the selected run
              </h3>
              <p className="text-sm">
                <span className="tabular">{row.run.evaluated}</span> evaluated ·{' '}
                <span className="tabular">{row.run.not_evaluated}</span> not evaluated ·{' '}
                <span className="tabular">{row.run.flagged}</span> flagged above zero
              </p>
              {idle && row.run.missing_inputs.length > 0 && (
                <div className="mt-2 rounded bg-sunken p-2">
                  <p className="text-xs font-medium">Why it could not run</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-ink-secondary">
                    {row.run.missing_inputs.map((reason) => (
                      <li key={reason}>· {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-ink-secondary">{children}</dd>
    </div>
  )
}

function matches(row: AlignmentRow, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'computed') return row.availability.state === 'COMPUTED'
  if (filter === 'awaiting') return row.availability.state === 'AWAITING_FEED'
  return row.run !== null && row.run.evaluated === 0
}
