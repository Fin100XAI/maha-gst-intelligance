import type { JSX } from 'react'
import { StatusChip } from './StatusChip'

/**
 * What a screen shows when a number could not be computed.
 *
 * Law 5: a metric that cannot run reports `NOT_EVALUATED` naming the dataset
 * it needed — never "no issue found", never a default of zero. This component
 * is the one place that renders that state, so it cannot drift into looking
 * like an empty result.
 *
 * It is deliberately prominent rather than a grey footnote. The gap is the
 * business case for the next integration, and a Commissioner who cannot see
 * what the platform is blind to cannot fund fixing it.
 */
export interface NotEvaluatedBlock {
  status: string
  value: null
  missing_inputs: string[]
  note: string
  detail?: string | undefined
}

export function NotEvaluated({
  title,
  block,
}: {
  title: string
  block: NotEvaluatedBlock
}): JSX.Element {
  return (
    <section className="rounded border border-status-unknown/40 bg-sunken p-4">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <StatusChip
          level="unknown"
          label="Not evaluated"
          title="This was not computed. It is not zero."
        />
      </header>

      <p className="text-sm text-ink-secondary">{block.note}</p>

      {block.detail !== undefined && (
        <p className="mt-2 text-sm text-ink-secondary">{block.detail}</p>
      )}

      {block.missing_inputs.length > 0 && (
        <>
          <h4 className="mt-3 text-xs uppercase tracking-wide text-ink-muted">
            Waiting on
          </h4>
          <ul className="mt-1 list-inside list-disc text-sm">
            {block.missing_inputs.map((input) => (
              <li key={input}>{input}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** The inline form, for a single cell in a table. */
export function NotEvaluatedCell({ title }: { title?: string | undefined }): JSX.Element {
  return (
    <span
      className="text-ink-muted"
      title={title ?? 'Not evaluated: the dataset behind this figure was not supplied.'}
    >
      ○ not evaluated
    </span>
  )
}
