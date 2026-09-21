import type { JSX } from 'react'
import { Money as MoneyValue } from '../lib/money'
import { useProvenance } from '../lib/provenance'

/**
 * `<Money>` is the ONLY way a figure is ever rendered.
 *
 * Indian formatting, tabular figures, and a calc handle that opens the
 * provenance drawer. Gate G8: every rendered figure carries a `calc_id`.
 *
 * A figure with no provenance at all renders with a visible warning rather than
 * silently looking like every other number - that is the bug surfacing, which
 * is the point.
 *
 * An **aggregate** - the sum of a division's findings, a band's revenue at risk
 * - has no single `calc_id`, because it is not one computation. Its provenance
 * is the drill: the taxpayers behind it, each of whose findings carries its own
 * `calc_id`. Pass `drill` for those, and the figure is a handle to that list
 * rather than a warning. This distinction matters: a screen where every number
 * wears a ⚠ teaches officers to ignore the ⚠ on the screens where it means a
 * real bug.
 */
export function Money({
  value,
  calcId,
  className,
  symbol = true,
  label,
  drill,
}: {
  /** The wire string. Never a JavaScript number. */
  value: string
  calcId?: string | null | undefined
  className?: string | undefined
  symbol?: boolean | undefined
  label?: string | undefined
  /**
   * For an aggregate: where clicking it lists the taxpayers it was summed
   * from. Provenance by drill rather than by `calc_id`.
   */
  drill?: (() => void) | undefined
}): JSX.Element {
  const { open } = useProvenance()
  const parsed = MoneyValue.maybe(value)

  if (parsed === null) {
    return (
      <span className="text-status-critical" title={`not a wire money value: ${value}`}>
        ✕ unreadable
      </span>
    )
  }

  const text = parsed.format({ symbol })

  if (calcId === undefined || calcId === null || calcId === '') {
    if (drill !== undefined) {
      return (
        <button
          type="button"
          onClick={drill}
          className={`tabular decoration-gold/70 decoration-dotted underline-offset-[0.28em] transition-[text-decoration-color] hover:underline hover:decoration-gold ${className ?? ''}`}
          title={label ?? 'An aggregate. Open the taxpayers it was summed from.'}
        >
          {text}
          <span className="ml-1 align-middle text-[0.5em] text-gold" aria-hidden="true">
            ▾
          </span>
        </button>
      )
    }
    return (
      <span
        className={`tabular ${className ?? ''}`}
        title="This figure carries no calc_id and no drill. That is a bug: every number must be traceable."
      >
        {text}
        <span className="ml-1 text-status-critical" aria-label="no provenance">
          ⚠
        </span>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        open(calcId)
      }}
      className={`tabular decoration-gold/70 decoration-dotted underline-offset-[0.28em] transition-[text-decoration-color] hover:underline hover:decoration-gold ${className ?? ''}`}
      title={label ?? 'Where did this come from?'}
    >
      {text}
      <span className="ml-1 align-middle text-[0.55em] text-gold" aria-hidden="true">
        ◉
      </span>
    </button>
  )
}

/** A non-money figure - a count, a score, a ratio - with the same calc handle. */
export function Figure({
  value,
  calcId,
  suffix,
  className,
}: {
  value: string
  calcId?: string | null | undefined
  suffix?: string | undefined
  className?: string | undefined
}): JSX.Element {
  const { open } = useProvenance()
  const text = suffix === undefined ? value : `${value}${suffix}`

  if (calcId === undefined || calcId === null || calcId === '') {
    return <span className={`tabular ${className ?? ''}`}>{text}</span>
  }
  return (
    <button
      type="button"
      onClick={() => {
        open(calcId)
      }}
      className={`tabular underline decoration-dotted underline-offset-2 ${className ?? ''}`}
      title="Where did this come from?"
    >
      {text}
      <span className="ml-1 text-ink-muted" aria-hidden="true">
        ◉
      </span>
    </button>
  )
}
