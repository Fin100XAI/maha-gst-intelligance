import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, CircleHelp, Download, MinusCircle } from 'lucide-react'
import type { JSX } from 'react'
import { Fragment, useState } from 'react'
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

function Cell({
  column,
  row,
  onShowSource,
}: {
  column: string
  row: ReportRow
  onShowSource: () => void
}): JSX.Element {
  const raw = row.cells[column] ?? ''
  if (raw === '') return <span className="text-ink-muted">-</span>
  if (looksLikeMoney(column) && /^-?\d+(\.\d+)?$/.test(raw)) {
    /*
      A report figure's provenance is the rows it was summed from - that is
      what `<Money drill>` is for. Without it every cell wore a warning
      triangle, which `<Money>` is right to do and which teaches officers to
      ignore the triangle on the screens where it means a real bug.
    */
    return (
      <Money
        value={raw}
        symbol={false}
        {...(row.evidence_ids.length === 0 ? {} : { drill: onShowSource })}
      />
    )
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
  const [sourceFor, setSourceFor] = useState<number | null>(null)
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
    <article className="max-w-[68rem]">
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
          <p className="mb-8 max-w-[46rem] text-[1.0625rem] leading-[1.7] text-ink">{data.headline}</p>

          {/* Band two: the picture. */}
          <div className="mb-8 grid gap-6">
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
            {/*
              The working scrolls inside a fixed frame rather than running down
              the page. The supplier report has 462 rows: rendered flat it made
              the page 18,575 pixels tall, which is not a screen an officer
              reads - it is a screen they scroll past to find the export button.
              Everything is still here, and all of it is still in the export.
            */}
            <div className="max-h-[32rem] overflow-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-sunken text-left shadow-[0_1px_0_0_var(--border)]">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                      Status
                    </th>
                    {data.columns.map((column: string) => (
                      <th key={column} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row: ReportRow, index: number) => {
                    const flag = row.flag === null ? null : FLAG[row.flag]
                    return (
                      <Fragment key={index}>
                        <tr className="border-t border-line odd:bg-raised/40">
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
                          <td key={column} className="whitespace-nowrap px-3 py-2 tabular">
                            <Cell
                              column={column}
                              row={row}
                              onShowSource={() => {
                                setSourceFor(sourceFor === index ? null : index)
                              }}
                            />
                          </td>
                        ))}
                        </tr>
                        {sourceFor === index && (
                          <tr className="border-t border-line bg-sunken">
                            <td colSpan={data.columns.length + 1} className="px-3 py-3">
                              <p className="text-xs font-medium text-ink">
                                This figure was computed from {row.evidence_ids.length} source
                                {row.evidence_ids.length === 1 ? ' row' : ' rows'} in the uploaded
                                workbook.
                              </p>
                              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                {row.evidence_ids.slice(0, 12).map((id) => (
                                  <li key={id} className="text-xs text-ink-muted tabular">
                                    {id}
                                  </li>
                                ))}
                                {row.evidence_ids.length > 12 && (
                                  <li className="text-xs text-ink-muted">
                                    and {row.evidence_ids.length - 12} more - all of them are in the
                                    export
                                  </li>
                                )}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
