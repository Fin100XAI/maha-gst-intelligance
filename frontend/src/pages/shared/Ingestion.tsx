import { useRef, useState } from 'react'
import type { JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Explain } from '../../components/Explain'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SheetViewer } from '../../components/SheetViewer'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { QuarantinedRowView, UploadCounts, UploadResult } from '../../lib/api'

/**
 * S1 - Ingestion.
 *
 * The screen that decides whether the platform survives contact with a real
 * portal export. Its central claim is arithmetic and is checked in front of
 * the officer: **rows in = parsed + quarantined + duplicates**. If those do
 * not balance the server refuses to write anything at all, because a row that
 * cannot be accounted for becomes a wrong figure in a notice six screens
 * later.
 *
 * A quarantined row is shown with its reason and its original cells, never
 * discarded. The dry run exists so an officer can see what a workbook would
 * do before it does it.
 */
export default function Ingestion(): JSX.Element {
  const client = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [gstin, setGstin] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  const uploads = useQuery({ queryKey: ['uploads'], queryFn: () => api.uploads() })

  const send = useMutation({
    mutationFn: (commit: boolean) => {
      if (file === null) throw new Error('Choose a workbook first.')
      return api.upload(file, { commit, gstin })
    },
    onSuccess: (data) => {
      setResult(data)
      setError(null)
      if (data.committed) {
        void client.invalidateQueries({ queryKey: ['uploads'] })
        setFile(null)
        if (input.current !== null) input.current.value = ''
      }
    },
    onError: (err: Error) => {
      setResult(null)
      setError(err.message)
    },
  })

  return (
    <div className="w-full">
      <ScreenHeader
        code="S1"
        title="Upload returns"
        lead={
          <>
            Upload the portal&rsquo;s own export, unedited. Every row is accounted for on screen
            before anything is saved: rows in the file = rows read + rows held + duplicates. If
            those do not balance, nothing is written at all.
          </>
        }
      />

      <section className="mb-6 rounded border border-line p-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Workbook (.xlsx or .xlsm)
          <input
            ref={input}
            type="file"
            accept=".xlsx,.xlsm,.xls,.csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setResult(null)
              setError(null)
            }}
            className="text-sm text-ink"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
          Filer&rsquo;s GSTIN - optional; read from the workbook&rsquo;s title block when absent
          <input
            type="text"
            value={gstin}
            onChange={(event) => {
              setGstin(event.target.value.toUpperCase())
            }}
            placeholder="27AABCT2345L1Z7"
            className="w-64 rounded border border-line bg-raised px-2 py-1 text-sm text-ink tabular"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={file === null || send.isPending}
            onClick={() => {
              send.mutate(false)
            }}
            className="rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
          >
            Dry run
          </button>
          <button
            type="button"
            disabled={file === null || send.isPending}
            onClick={() => {
              send.mutate(true)
            }}
            className="rounded border border-line bg-raised px-3 py-1 text-sm font-medium disabled:opacity-40"
          >
            Ingest
          </button>
          {send.isPending && <span className="text-sm text-ink-secondary">Reading…</span>}
        </div>

        <p className="mt-2 text-xs text-ink-muted">
          A dry run parses and reports without writing anything.
        </p>
      </section>

      {error !== null && (
        <section className="mb-6 rounded border border-status-critical/50 bg-sunken p-4">
          <h2 className="mb-1 text-base font-semibold text-status-critical">Refused</h2>
          <p className="text-sm">{error}</p>
        </section>
      )}

      {result !== null && <Report result={result} />}

      {result !== null && result.upload_id !== undefined && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">The workbook as you sent it</h2>
          <SheetViewer uploadId={result.upload_id} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">Ingested workbooks</h2>
        {uploads.data === undefined || uploads.data.count === 0 ? (
          <p className="text-sm text-ink-secondary">Nothing has been ingested yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                <th className="py-1 text-left">File</th>
                <th className="py-1 text-left">By</th>
                <th className="py-1 text-right">In</th>
                <th className="py-1 text-right">Parsed</th>
                <th className="py-1 text-right">Held</th>
                <th className="py-1 text-right">Dup</th>
                <th className="py-1 text-left">Balances</th>
                <th className="py-1 text-right">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {uploads.data.items.map((row) => (
                <tr key={row.upload_id} className="border-b border-line">
                  <td className="py-1">
                    {row.filename}
                    <div className="text-xs text-ink-muted tabular">
                      {row.sha256.slice(0, 12)}…
                    </div>
                  </td>
                  <td className="py-1 text-ink-secondary">{row.uploaded_by}</td>
                  <td className="py-1 text-right tabular">{row.rows_in}</td>
                  <td className="py-1 text-right tabular">{row.rows_parsed}</td>
                  <td className="py-1 text-right tabular">{row.rows_quarantined}</td>
                  <td className="py-1 text-right tabular">{row.rows_duplicate}</td>
                  <td className="py-1">
                    <StatusChip
                      level={row.reconciles ? 'good' : 'critical'}
                      label={row.reconciles ? 'Balances' : 'Does not balance'}
                    />
                  </td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setViewing((current) =>
                          current === row.upload_id ? null : row.upload_id,
                        )
                      }}
                      className="rounded border border-line px-2 py-0.5 text-xs"
                    >
                      {viewing === row.upload_id ? 'Hide sheet' : 'View sheet'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {viewing !== null && (
          <div className="mt-4">
            <SheetViewer uploadId={viewing} />
          </div>
        )}
      </section>
    </div>
  )
}

function Report({ result }: { result: UploadResult }): JSX.Element {
  return (
    <section className="mb-6 rounded border border-line p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">
          {result.committed ? 'Ingested' : 'Dry run - nothing was written'}
        </h2>
        <StatusChip
          level={result.counts.reconciles === false ? 'critical' : 'good'}
          label={result.counts.reconciles === false ? 'Does not balance' : 'Balances'}
        />
      </div>

      <Reconciliation counts={result.counts} />

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <dt className="inline text-ink-muted">Filer: </dt>
          <dd className="inline tabular">{result.owner_gstin ?? 'not identified'}</dd>
        </div>
        {result.owner_gstin_source !== null && (
          <div>
            <dt className="inline text-ink-muted">Read from: </dt>
            <dd className="inline">{result.owner_gstin_source}</dd>
          </div>
        )}
        {result.stored_as !== undefined && (
          <div>
            <dt className="inline text-ink-muted">Stored as: </dt>
            <dd className="inline tabular">{result.stored_as}</dd>
          </div>
        )}
      </dl>

      {result.hint !== null && (
        <div className="mt-3 rounded border border-status-warning/50 bg-sunken p-3">
          <h3 className="text-sm font-semibold">{result.hint.message}</h3>
          <p className="mt-1 text-sm text-ink-secondary">{result.hint.remedy}</p>
        </div>
      )}

      <h3 className="mt-4 text-sm font-semibold">Sheets</h3>
      <table className="mt-1 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-muted">
            <th className="py-1 text-left">Sheet</th>
            <th className="py-1 text-left">Detected as</th>
            <th className="py-1 text-right">Header row</th>
            <th className="py-1 text-right">In</th>
            <th className="py-1 text-right">Parsed</th>
            <th className="py-1 text-right">Held</th>
          </tr>
        </thead>
        <tbody>
          {result.sheets.map((sheet) => (
            <tr key={sheet.sheet_name} className="border-b border-line">
              <td className="py-1 tabular">{sheet.sheet_name}</td>
              <td className="py-1">
                {sheet.detected_type ?? <span className="text-ink-muted">unclassified</span>}
              </td>
              <td className="py-1 text-right tabular">{sheet.header_row_index ?? '-'}</td>
              <td className="py-1 text-right tabular">{sheet.counts.rows_in}</td>
              <td className="py-1 text-right tabular">{sheet.counts.parsed}</td>
              <td className="py-1 text-right tabular">{sheet.counts.quarantined}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {result.quarantine.length > 0 && (
        <>
          <h3 className="mt-4 text-sm font-semibold">
            Held rows ({result.quarantine.length})
          </h3>
          <p className="mb-2 text-xs text-ink-secondary">
            Held with a reason, never discarded &mdash; the original cells are kept and shown
            below. Fix the file or the column heading and upload again.
          </p>
          <ul className="space-y-2">
            {result.quarantine.slice(0, 25).map((held, index) => (
              <Held key={`${held.sheet_name}-${String(held.row_index)}-${String(index)}`} held={held} />
            ))}
          </ul>
          {result.quarantine.length > 25 && (
            <p className="mt-2 text-xs text-ink-muted tabular">
              …and {result.quarantine.length - 25} more.
            </p>
          )}
        </>
      )}
    </section>
  )
}

/** The arithmetic, shown as arithmetic. */
function Reconciliation({ counts }: { counts: UploadCounts }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-line bg-sunken p-3 text-sm">
      <Explain term="reconciles" label="how the rows are accounted for" />
      <Count label="rows in" value={counts.rows_in} />
      <span className="text-ink-muted">=</span>
      <Count label="parsed" value={counts.parsed} />
      <span className="text-ink-muted">+</span>
      <Count label="held" value={counts.quarantined} />
      <span className="text-ink-muted">+</span>
      <Count label="duplicates" value={counts.duplicates} />
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-lg font-semibold tabular">{value}</span>
      <span className="text-xs text-ink-muted">{label}</span>
    </span>
  )
}

function Held({ held }: { held: QuarantinedRowView }): JSX.Element {
  const cells = Object.entries(held.original_cells ?? {}).filter(
    ([, value]) => value !== null && value !== '',
  )
  return (
    <li className="rounded border border-line p-2 text-sm">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="tabular text-ink-muted">
          {held.sheet_name} row {held.row_index}
        </span>
        <StatusChip level="warning" label={held.reason_code ?? 'HELD'} />
        <span className="text-ink-secondary">{held.reason}</span>
      </div>
      {cells.length > 0 && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          {cells.slice(0, 8).map(([column, value]) => (
            <div key={column} className="contents">
              <dt className="text-ink-muted">{column}</dt>
              <dd className="tabular">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}
