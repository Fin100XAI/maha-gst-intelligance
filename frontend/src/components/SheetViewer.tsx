import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatusChip } from './StatusChip'
import { api } from '../lib/api'
import type { SheetCellRow } from '../lib/api'

/**
 * The uploaded workbook, on screen, as the officer's own file has it.
 *
 * This is the far end of the provenance chain. The drawer can say "row 8 of
 * sheet B2B_072025" and be believed; showing that row, in the grid it came
 * from, is what makes the claim checkable rather than trusted. It is the last
 * step of the ninety-second test - dashboard figure to spreadsheet cell - and
 * without it the chain ends in a sentence rather than in evidence.
 *
 * The cells are read back from the stored file, never rebuilt from the
 * canonical rows. A reconstruction would show what the platform *understood*,
 * which is exactly the thing an officer is checking.
 *
 * Three things are marked on the grid: the header row the platform detected,
 * the rows it held and why, and the mapping it derived. An officer disputing a
 * figure needs all three in one view.
 */
const PAGE = 100

export function SheetViewer({
  uploadId,
  sheetIndex = 0,
  highlightRow,
}: {
  uploadId: string
  sheetIndex?: number
  highlightRow?: number | undefined
}): JSX.Element {
  const [index, setIndex] = useState(sheetIndex)
  const [start, setStart] = useState(
    highlightRow === undefined ? 0 : Math.max(0, highlightRow - 5),
  )
  const [showMapping, setShowMapping] = useState(false)

  const sheets = useQuery({
    queryKey: ['upload-sheets', uploadId],
    queryFn: () => api.uploadSheets(uploadId),
  })
  const view = useQuery({
    queryKey: ['sheet-cells', uploadId, index, start],
    queryFn: () => api.sheetCells(uploadId, index, start, PAGE),
  })

  if (view.isLoading) return <p className="text-sm text-ink-secondary">Opening the workbook…</p>
  if (view.isError || view.data === undefined) {
    return (
      <section className="rounded border border-status-warning/50 bg-sunken p-4">
        <h3 className="text-base font-semibold">The workbook cannot be shown</h3>
        <p className="mt-1 text-sm text-ink-secondary">
          The stored file may have passed its retention period. The canonical rows and
          their provenance record remain - only the original bytes are gone.
        </p>
      </section>
    )
  }
  const data = view.data
  const pages = Math.max(1, Math.ceil(data.total_rows / PAGE))
  const page = Math.floor(start / PAGE) + 1

  return (
    <section className="rounded border border-line">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
        <div>
          <h3 className="text-base font-semibold">{data.filename}</h3>
          <p className="text-xs text-ink-muted tabular">
            {data.total_rows} rows
            {data.detected_type !== null && <> · read as {data.detected_type}</>}
            {data.header_row_index !== null && (
              <> · header on row {data.header_row_index}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(sheets.data?.items ?? []).length > 1 && (
            <select
              value={index}
              onChange={(event) => {
                setIndex(Number(event.target.value))
                setStart(0)
              }}
              className="rounded border border-line bg-raised px-2 py-1 text-sm"
              aria-label="Sheet"
            >
              {(sheets.data?.items ?? []).map((sheet) => (
                <option key={sheet.sheet_index} value={sheet.sheet_index}>
                  {sheet.sheet_name}
                </option>
              ))}
            </select>
          )}
          {data.mapping !== null && (
            <button
              type="button"
              onClick={() => {
                setShowMapping((current) => !current)
              }}
              className="rounded border border-line px-2 py-1 text-xs text-ink-secondary hover:text-ink"
              aria-pressed={showMapping}
            >
              {showMapping ? 'Hide mapping' : 'Show mapping'}
            </button>
          )}
        </div>
      </header>

      {showMapping && data.mapping !== null && (
        <div className="border-b border-line bg-sunken p-3">
          <h4 className="mb-1 text-xs uppercase tracking-wide text-ink-muted">
            How each column was read
          </h4>
          <dl className="grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
            {Object.entries(data.mapping).map(([header, field]) => (
              <div key={header} className="contents">
                <dt className="truncate text-ink-secondary">{header}</dt>
                <dd className="tabular">{field}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <caption className="sr-only">
            {data.sheet_name}, rows {data.start} to {data.start + data.rows.length}
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-r border-line bg-base px-2 py-1 text-right text-ink-muted">
                #
              </th>
              {Array.from({ length: data.width }, (_, column) => (
                <th
                  key={column}
                  className="border-b border-line bg-base px-2 py-1 text-left font-normal text-ink-muted"
                >
                  {columnName(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <Row
                key={row.index}
                row={row}
                isHeader={row.index === data.header_row_index}
                isHighlighted={row.index === highlightRow}
                width={data.width}
              />
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-line p-3 text-sm">
        <button
          type="button"
          disabled={start === 0}
          onClick={() => {
            setStart((current) => Math.max(0, current - PAGE))
          }}
          className="rounded border border-line px-2 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="tabular text-ink-secondary">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          disabled={start + PAGE >= data.total_rows}
          onClick={() => {
            setStart((current) => current + PAGE)
          }}
          className="rounded border border-line px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
        <span className="ml-auto text-xs text-ink-muted">{data.note}</span>
      </footer>
    </section>
  )
}

function Row({
  row,
  isHeader,
  isHighlighted,
  width,
}: {
  row: SheetCellRow
  isHeader: boolean
  isHighlighted: boolean
  width: number
}): JSX.Element {
  const held = row.held !== null
  const tone = isHighlighted
    ? 'bg-raised outline outline-1 outline-ink'
    : held
      ? 'bg-sunken'
      : isHeader
        ? 'bg-chart font-medium'
        : ''

  return (
    <tr className={tone}>
      <th
        scope="row"
        className="sticky left-0 z-10 border-b border-r border-line bg-base px-2 py-1 text-right font-normal tabular text-ink-muted"
      >
        {row.index}
        {held && (
          <span className="ml-1 text-status-warning" title={row.held?.reason}>
            ▲
          </span>
        )}
      </th>
      {Array.from({ length: width }, (_, column) => (
        <td
          key={column}
          className="max-w-[16rem] truncate border-b border-line px-2 py-1"
          title={row.cells[column] ?? undefined}
        >
          {row.cells[column] ?? ''}
        </td>
      ))}
    </tr>
  )
}

/** Spreadsheet column letters, so the grid reads like the file it came from. */
function columnName(index: number): string {
  let name = ''
  let value = index
  do {
    name = String.fromCharCode(65 + (value % 26)) + name
    value = Math.floor(value / 26) - 1
  } while (value >= 0)
  return name
}

/** The held-row legend, for screens that show the grid beside a report. */
export function SheetLegend(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-5 rounded-sm bg-chart" /> header row
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-5 rounded-sm bg-sunken" /> held
      </span>
      <StatusChip level="warning" label="▲ reason on hover" />
    </div>
  )
}
