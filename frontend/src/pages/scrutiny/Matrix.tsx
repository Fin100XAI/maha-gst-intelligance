import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, CircleSlash, MinusCircle, Wrench } from 'lucide-react'
import type { JSX } from 'react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import type { MatrixRow } from '../../lib/reports'

/**
 * One taxpayer against the department's own 141 checks.
 *
 * Five outcomes, and the two that look alike are the ones worth separating.
 * *Could not check* means the platform has the check and not the data. *Not
 * built* means the platform does not have the check. They are fixed by
 * different people - one by whoever sends the data, one by whoever writes the
 * software - and a screen that merged them would tell an officer nothing
 * actionable about either.
 *
 * Grouped by the department's own module letters, so a reader holding their
 * spreadsheet can find any row.
 */

const STATE: Record<string, { icon: JSX.Element; label: string; text: string; row: string }> = {
  FAIL: {
    icon: <AlertTriangle aria-hidden className="h-4 w-4" />,
    label: 'Failed',
    text: 'text-status-critical',
    row: 'bg-status-critical/[0.06]',
  },
  PASS: {
    icon: <CheckCircle2 aria-hidden className="h-4 w-4" />,
    label: 'Passed',
    text: 'text-status-good',
    row: '',
  },
  NOT_EVALUATED: {
    icon: <MinusCircle aria-hidden className="h-4 w-4" />,
    label: 'Could not check',
    text: 'text-status-warning',
    row: '',
  },
  NOT_BUILT: {
    icon: <Wrench aria-hidden className="h-4 w-4" />,
    label: 'Not built',
    text: 'text-ink-muted',
    row: '',
  },
  NOT_APPLICABLE: {
    icon: <CircleSlash aria-hidden className="h-4 w-4" />,
    label: 'Does not apply',
    text: 'text-ink-muted',
    row: '',
  },
}

const ORDER = ['FAIL', 'NOT_EVALUATED', 'PASS', 'NOT_BUILT', 'NOT_APPLICABLE'] as const

function Row({ row }: { row: MatrixRow }): JSX.Element {
  const state = STATE[row.status] ?? STATE['NOT_BUILT']
  return (
    <li className={`px-4 py-3 ${state?.row ?? ''}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${state?.text ?? ''}`}>
          {state?.icon}
          {state?.label}
        </span>
        <span className="text-xs text-ink-muted tabular">{row.id}</span>
        <span className="flex-1 font-medium text-ink">{row.check}</span>
        {row.status === 'FAIL' && (
          <span className="tabular font-semibold text-status-critical">
            <Money value={row.exposure_total} symbol={false} calcId={row.calc_ids[0]} />
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{row.legal_reference}</p>
      {row.reason !== '' && (
        <p className="mt-1 text-xs text-ink-secondary">
          {row.status === 'NOT_BUILT' ? 'Would need: ' : 'Waiting on: '}
          {row.reason}
        </p>
      )}
      {row.answered_by.length > 0 && (
        <p className="mt-1 text-xs text-ink-muted">Answered by {row.answered_by.join(', ')}</p>
      )}
    </li>
  )
}

export default function Matrix(): JSX.Element {
  const [params] = useSearchParams()
  const gstin = params.get('gstin') ?? ''
  const snapshot = params.get('snapshot') ?? ''
  const [only, setOnly] = useState<string | null>('FAIL')

  const { data, isPending, error } = useQuery({
    queryKey: ['matrix', gstin, snapshot],
    queryFn: () => api.matrix(gstin, snapshot),
    enabled: gstin !== '' && snapshot !== '',
  })

  if (gstin === '' || snapshot === '')
    return <p className="text-ink-secondary">No taxpayer selected.</p>
  if (isPending) return <p className="text-ink-secondary">Running 141 checks...</p>
  if (error) return <p className="text-status-critical">{error.message}</p>

  const shown = only === null ? data.rows : data.rows.filter((r) => r.status === only)
  const byModule = new Map<string, MatrixRow[]>()
  for (const row of shown) {
    const bucket = byModule.get(row.module) ?? []
    bucket.push(row)
    byModule.set(row.module, bucket)
  }

  return (
    <article className="max-w-[68rem]">
      <header className="mb-5">
        <p className="text-sm text-ink-muted tabular">
          {data.gstin} · {data.fy}
        </p>
        <h1 className="text-xl font-semibold text-ink">{data.legal_name ?? data.gstin}</h1>
        <p className="mt-2 max-w-[46rem] text-[1.0625rem] leading-[1.7] text-ink">
          {data.counts.FAIL ?? 0} of the department&apos;s {data.rows.length} checks failed, worth{' '}
          <strong className="tabular">
            {/* The failed rows below are what this was summed from. */}
            <Money
              value={data.exposure_total}
              drill={() => {
                setOnly('FAIL')
              }}
            />
          </strong>
          .
        </p>
        <p className="mt-2 max-w-[46rem] text-sm text-ink-secondary">{data.coverage_note}</p>
      </header>

      {/* One filter, and it starts on what matters. */}
      <div className="mb-5 flex flex-wrap gap-2">
        {ORDER.map((status) => {
          const count = data.counts[status] ?? 0
          const state = STATE[status]
          const active = only === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => {
                setOnly(active ? null : status)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                active
                  ? 'border-line-strong bg-raised font-semibold'
                  : 'border-line text-ink-secondary hover:bg-raised'
              }`}
            >
              <span className={state?.text ?? ''}>{state?.icon}</span>
              {state?.label}
              <span className="tabular text-ink-muted">{count}</span>
            </button>
          )
        })}
        {only !== null && (
          <button
            type="button"
            onClick={() => {
              setOnly(null)
            }}
            className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-secondary hover:bg-raised"
          >
            Show all {data.rows.length}
          </button>
        )}
      </div>

      {[...byModule.entries()].map(([module, rows]) => (
        <section key={module} className="mb-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {module} <span className="font-normal normal-case">({rows.length})</span>
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
            {rows.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </ul>
        </section>
      ))}

      {shown.length === 0 && (
        <p className="rounded-xl border border-dashed border-line bg-sunken p-6 text-ink-secondary">
          Nothing in this state for this taxpayer.
        </p>
      )}
    </article>
  )
}
