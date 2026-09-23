import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Lock } from 'lucide-react'
import type { JSX } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ReportListing } from '../../lib/reports'

/**
 * The reports index: one card per report, and the absent ones say why.
 *
 * **One list, not two.** It would be tidier to hide what cannot run. It would
 * also leave an officer unable to answer the only question that matters when
 * a report is missing - *what do I have to ask the taxpayer for?* A card that
 * names the sheet it waits on turns a gap into an action.
 */
function Card({
  report,
  gstin,
  snapshot,
}: {
  report: ReportListing
  gstin: string
  snapshot: string
}): JSX.Element {
  const query = new URLSearchParams({ gstin, snapshot }).toString()
  if (!report.available) {
    return (
      <li className="rounded-lg border border-dashed border-line bg-sunken p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
          <Lock aria-hidden className="h-4 w-4" />
          {report.title}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{report.purpose}</p>
        <p className="mt-3 text-sm text-ink-secondary">
          <span className="font-medium text-ink">Waiting on: </span>
          {report.needs}
        </p>
        <p className="mt-1 text-xs text-ink-muted">{report.roadmap_ref}</p>
      </li>
    )
  }
  return (
    <li className="rounded-lg border border-line bg-raised p-4 transition hover:border-line-strong">
      <Link
        to={`/scrutiny/report/${report.id}?${query}`}
        className="flex items-start justify-between gap-3"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">{report.title}</span>
          <span className="mt-1 block text-sm text-ink-secondary">{report.purpose}</span>
        </span>
        <ArrowRight aria-hidden className="mt-1 h-4 w-4 shrink-0 text-ink-muted" />
      </Link>
    </li>
  )
}

export default function Reports(): JSX.Element {
  const [params] = useSearchParams()
  const gstin = params.get('gstin') ?? ''
  const snapshot = params.get('snapshot') ?? ''
  const { data, isPending, error } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.reports(),
  })

  if (isPending) return <p className="text-ink-secondary">Loading the report list...</p>
  if (error) return <p className="text-status-critical">{error.message}</p>

  const groups = new Map<string, ReportListing[]>()
  for (const report of data.reports) {
    const bucket = groups.get(report.group) ?? []
    bucket.push(report)
    groups.set(report.group, bucket)
  }
  const available = data.reports.filter((report) => report.available).length

  return (
    <section className="max-w-5xl">
      <h1 className="text-xl font-semibold text-ink">Reports</h1>
      <p className="mt-1 max-w-2xl text-ink-secondary">
        {available} of {data.reports.length} can be produced from what has been uploaded. The rest
        name the sheet they are waiting for, so the gap is something to ask for rather than
        something missing.
      </p>
      {[...groups.entries()].map(([group, reports]) => (
        <div key={group} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            {group}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {reports.map((report) => (
              <Card key={report.id} report={report} gstin={gstin} snapshot={snapshot} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
