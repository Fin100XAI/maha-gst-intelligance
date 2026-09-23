import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, CircleHelp, Download, MinusCircle } from 'lucide-react'
import type { JSX } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ReportChart } from '../../components/charts/ReportChart'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import type { Report as ReportPayload, ReportRow, ReportSeries } from '../../lib/reports'
import { toCsv } from '../../lib/reports'

/**
 * One report: the answer, the picture, the working.
 *
 * The three bands are the screen contract in `docs/08`, and their order is the
 * argument. An officer reads the sentence, looks at the chart to see whether
 * it is one period or all of them, and only then opens the rows. A screen that
 * led with the table would make them do the summarising.
 */

/** Status never travels as colour alone - an icon and a word, always. */
const FLAG: Record<string, { icon: JSX.Element; label: string; className: string }> = {
  PASS: {
    icon: <CheckCircle2 aria-hidden className="h-4 w-4" />,
    label: 'Agrees',
    className: 'text-status-good',
  },
  FAIL: {
    icon: <AlertTriangle aria-hidden className="h-4 w-4" />,
    label: 'Differs',
    className: 'text-status-critical',
  },
  ASK: {
    icon: <CircleHelp aria-hidden className="h-4 w-4" />,
    label: 'Question',
    className: 'text-status-warning',
  },
  NOT_EVALUATED: {
    icon: <MinusCircle aria-hidden className="h-4 w-4" />,
    label: 'Could not check',
    className: 'text-ink-muted',
  },
}

function looksLikeMoney(column: string): boolean {
  return /value|credit|tax|difference|excess|declared|paid|risk|position/i.test(column)
}

function Cell({ column, row }: { column: string; row: ReportRow }): JSX.Element {
  const raw = row.cells[column] ?? ''
  if (raw === '') return <span className="text-ink-muted">-</span>
  if (looksLikeMoney(column) && /^-?\d+(\.\d+)?$/.test(raw)) {
    return <Money value={raw} symbol={false} />
  }
  return <span>{raw}</span>
}

function Dark({ report }: { report: ReportPayload }): JSX.Element {
  return (
    <section className="rounded-lg border border-dashed border-line bg-sunken p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <MinusCircle aria-hidden className="h-5 w-5" />
        Could not check
      </h2>
      <p className="mt-2 max-w-2xl text-ink-secondary">{report.headline}</p>
      <dl className="mt-4">
        <dt className="text-sm font-medium text-ink">What would answer this</dt>
        <dd className="mt-1 text-sm text-ink-secondary">
          <ul className="list-disc pl-5">
            {report.missing_inputs.map((need: string) => (
              <li key={need}>{need}</li>
            ))}
          </ul>
        </dd>
      </dl>
      {/*
        Deliberately no empty table below this. An empty table reads as
        "nothing to see", which is the one thing absence must never mean.
      */}
    </section>
  )
}

export default function Report(): JSX.Element {
  const { reportId = '' } = useParams()
  const [params] = useSearchParams()
  const gstin = params.get('gstin') ?? ''
  const snapshotId = params.get('snapshot') ?? ''

  const { data, isPending, error } = useQuery({
    queryKey: ['report', reportId, gstin, snapshotId],
    queryFn: () => api.report(reportId, gstin, snapshotId),
    enabled: gstin !== '' && snapshotId !== '',
  })

  if (gstin === '' || snapshotId === '') {
    return (
      <p className="text-ink-secondary">
        Open a report from a taxpayer, so it knows whose figures to show.
      </p>
    )
  }
  if (isPending) return <p className="text-ink-secondary">Working through the returns...</p>
  if (error) return <p className="text-status-critical">{error.message}</p>

  function download(): void {
    if (data === undefined) return
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${data.id}-${data.gstin}-${data.fy}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <article className="max-w-6xl">
      <header className="mb-4">
        <p className="text-sm text-ink-muted tabular">
          {data.gstin} · {data.fy}
        </p>
        <h1 className="text-xl font-semibold text-ink">{data.title}</h1>
      </header>

      {!data.evaluated ? (
        <Dark report={data} />
      ) : (
        <>
          {/* Band one: the answer, in a sentence. */}
          <p className="mb-6 max-w-3xl text-lg leading-relaxed text-ink">{data.headline}</p>

          {/* Band two: the picture. */}
          <div className="mb-6 grid gap-4">
            {data.series.map((series: ReportSeries) => (
              <ReportChart key={series.id} series={series} />
            ))}
          </div>

          {/* Band three: the working. */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">
                The working <span className="text-ink-muted">({data.rows.length} rows)</span>
              </h2>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded border border-line px-3 py-1.5 text-sm hover:bg-sunken"
              >
                <Download aria-hidden className="h-4 w-4" />
                Export to Excel
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-sunken text-left">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Status
                    </th>
                    {data.columns.map((column: string) => (
                      <th key={column} scope="col" className="px-3 py-2 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row: ReportRow, index: number) => {
                    const flag = row.flag === null ? null : FLAG[row.flag]
                    return (
                      <tr key={index} className="border-t border-line">
                        <td className="px-3 py-2">
                          {flag === null || flag === undefined ? (
                            <span className="text-ink-muted">-</span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 ${flag.className}`}>
                              {flag.icon}
                              {flag.label}
                            </span>
                          )}
                        </td>
                        {data.columns.map((column: string) => (
                          <td key={column} className="px-3 py-2 tabular">
                            <Cell column={column} row={row} />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {data.caveat !== null && (
            <footer className="mt-4 max-w-3xl rounded border-l-2 border-line bg-sunken p-3 text-sm text-ink-secondary">
              <strong className="font-medium text-ink">What this is not. </strong>
              {data.caveat}
            </footer>
          )}
        </>
      )}
    </article>
  )
}
