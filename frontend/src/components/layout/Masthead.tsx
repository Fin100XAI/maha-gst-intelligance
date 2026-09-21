import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Logo } from '../brand/Logo'
import { api } from '../../lib/api'

/**
 * The identity band, above everything.
 *
 * Ported from maha-gst-intelligance, including the correction recorded in its
 * own comment: the right-hand figure must name the moment the **figures**
 * describe, not the wall clock. A live ticking timestamp above a dataset
 * computed last week tells an officer the numbers are current to the second
 * when they are not.
 *
 * So this band shows the engine run the screens below are reading - its id and
 * its as-at date - and nothing else. If no run has been recorded it says that
 * plainly rather than showing today's date, because "as at today" over an
 * empty database is the most misleading thing this strip could say.
 *
 * It scrolls away with the page. The navigation beneath it is what stays
 * pinned, because that is what an officer reaches for mid-task.
 */
export function Masthead(): JSX.Element {
  const runs = useQuery({
    queryKey: ['engine-runs', 'masthead'],
    queryFn: () => api.engineRuns(),
    retry: false,
    staleTime: 60_000,
  })
  const latest = runs.data?.items[0]

  return (
    <div className="shrink-0">
      <div className="relative flex flex-wrap items-center gap-3 overflow-hidden bg-govt-900 px-4 py-2.5 sm:px-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <Link to="/welcome" className="relative shrink-0" aria-label="About this platform">
          <Logo size="lg" className="ring-1 ring-white/25" />
        </Link>
        <div className="relative min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-white">
            GST DRISHTI
          </h1>
          <p className="mt-0.5 line-clamp-1 max-w-3xl text-[11px] leading-snug text-white/65">
            Scrutiny, reconciliation and demand · Commercial Taxes Department
          </p>
        </div>

        <div className="relative shrink-0 text-right">
          {latest === undefined ? (
            <>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">
                Engine run
              </p>
              <p className="mt-0.5 text-xs font-semibold text-white">None recorded</p>
              <p className="mt-0.5 text-[10px] text-white/60">
                Upload returns, then run the checks
              </p>
            </>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/60">
                Figures as at
              </p>
              <p className="tabular mt-0.5 text-xs font-semibold text-white">{latest.as_of}</p>
              <p className="tabular mt-0.5 hidden text-[10px] text-white/60 sm:block">
                Run {latest.engine_run_id.slice(0, 8)}
                {latest.fy === null ? '' : ` · FY ${latest.fy}`} ·{' '}
                {latest.finding_count.toLocaleString('en-IN')} findings
              </p>
            </>
          )}
        </div>
      </div>
      {/* The one piece of ornament in the shell: where the department's
          identity ends and the working surfaces begin. */}
      <div
        aria-hidden="true"
        className="h-[3px] bg-gradient-to-r from-govtgold-500 via-govtgold-400 to-govtgold-600"
      />
    </div>
  )
}
