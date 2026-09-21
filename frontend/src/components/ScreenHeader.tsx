import type { JSX, ReactNode } from 'react'

/**
 * The top of every screen, in the same shape each time.
 *
 * A title alone is a label for something you have already been told about.
 * "Enforcement Funnel" means nothing to a reader on their first morning, and
 * the people who most need to know what a screen is for are exactly the ones
 * who will not ask. So every screen states, in one plain sentence, what it
 * shows and what it is for - and offers the longer answer behind a disclosure
 * for anyone who wants it.
 *
 * `meta` keeps the technical provenance line - which run, which date - which
 * matters and belongs on screen, just not as the first thing read.
 */
export function ScreenHeader({
  code,
  title,
  lead,
  meta,
  children,
}: {
  /** The screen's reference, e.g. "D2". Small, and never the first thing read. */
  code: string
  title: string
  /** One sentence: what this screen shows, and what to do with it. */
  lead: ReactNode
  /** Run id, date, scope - the provenance line. */
  meta?: ReactNode
  /** Anything the header itself should carry, such as a status chip. */
  children?: ReactNode
}): JSX.Element {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium tracking-wide text-ink-muted tabular">
            {code}
          </span>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {children}
        </div>
        {meta !== undefined && (
          <p className="text-xs text-ink-muted tabular">{meta}</p>
        )}
      </div>
      <p className="mt-1 max-w-3xl text-sm text-ink-secondary">{lead}</p>
    </header>
  )
}
