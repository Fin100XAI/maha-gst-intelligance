import type { JSX, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import { Logo } from '../brand/Logo'
import { api } from '../../lib/api'

/**
 * The band. One of them.
 *
 * This used to be three stacked strips: a blue identity band, a separate
 * utility bar for the display controls, and a breadcrumb line under that.
 * Three borders, three background colours and three rows of chrome before an
 * officer reached the first figure - on a laptop that is most of the fold
 * spent telling the reader where they already knew they were.
 *
 * Everything now sits on one govt-blue band: the mark and the department on
 * the left, the run the screens are reading and the officer's own controls on
 * the right. The breadcrumb is gone rather than folded in, because the rail
 * already highlights the screen you are on and the screen already names
 * itself in its own header - it was the third statement of one fact.
 *
 * The one thing kept from the reference's own note: the right-hand figure
 * names the moment the FIGURES describe, not the wall clock. A live ticking
 * timestamp over a dataset computed last week tells an officer the numbers
 * are current to the second when they are not. When no run has been recorded
 * it says so, rather than showing today's date over an empty database.
 */
export function Masthead({
  onOpenNav,
  children,
}: {
  /** Opens the rail below `lg`, where the rail is a drawer. */
  onOpenNav: () => void
  /** The officer's own controls: who you are, language, theme. */
  children: ReactNode
}): JSX.Element {
  const runs = useQuery({
    queryKey: ['engine-runs', 'masthead'],
    queryFn: () => api.engineRuns(),
    retry: false,
    staleTime: 60_000,
  })
  const latest = runs.data?.items[0]

  return (
    <div className="shrink-0">
      {/* No `overflow-hidden` here, however tempting. The band holds the
          officer picker, whose panel opens downward out of it -- clipping
          the band clipped the panel, and the control reported itself open
          while showing nothing. The dot pattern below is `inset-0` and
          cannot overflow on its own. */}
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 bg-govt-900 px-4 py-2 sm:px-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenNav}
          className="relative rounded-lg border border-white/20 bg-white/10 p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Link to="/welcome" className="relative shrink-0" aria-label="About this platform">
          <Logo size="lg" className="ring-1 ring-white/25" />
        </Link>

        <div className="relative min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-white">
            GST Intelligence
          </h1>
          <p className="mt-0.5 line-clamp-1 max-w-3xl text-[11px] leading-snug text-white/65">
            Scrutiny, reconciliation and demand · Commercial Taxes Department
          </p>
        </div>

        {/* Which run the screens below are reading. It belongs beside the
            controls rather than on a strip of its own: it is the same class
            of fact as who is signed in. */}
        <div className="relative shrink-0 text-right">
          {latest === undefined ? (
            <>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/55">
                Engine run
              </p>
              <p className="text-xs font-semibold text-white">None recorded</p>
            </>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/55">
                Figures as at
              </p>
              <p className="tabular text-xs font-semibold text-white">{latest.as_of}</p>
              <p className="tabular hidden text-[10px] text-white/55 xl:block">
                Run {latest.engine_run_id.slice(0, 8)}
                {latest.fy === null ? '' : ` · FY ${latest.fy}`} ·{' '}
                {latest.finding_count.toLocaleString('en-IN')} findings
              </p>
            </>
          )}
        </div>

        <div className="relative flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      </div>

      {/* The only ornament in the shell: where the department's identity ends
          and the working surfaces begin. */}
      <div
        aria-hidden="true"
        className="h-[3px] bg-gradient-to-r from-govtgold-500 via-govtgold-400 to-govtgold-600"
      />
    </div>
  )
}
