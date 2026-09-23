/**
 * The reports API, typed.
 *
 * Every figure arrives as a string and stays one. Nothing in this file calls
 * `Number()` on a rupee: the only place a magnitude becomes a JS number is a
 * bar's *length*, and that value is never displayed.
 */

/** One point on one chart. `drill` is where clicking it goes. */
export interface ReportPoint {
  readonly label: string
  /** The wire string. Never a JavaScript number. */
  readonly value: string
  readonly heads: Readonly<Record<string, string>>
  /** The second bar of a grouped pair - the same scale, never a second axis. */
  readonly compare: string | null
  readonly drill: string | null
  readonly note: string | null
}

export interface ReportSeries {
  readonly id: string
  readonly title: string
  readonly kind: string
  /** What the y-axis measures, in an officer's words. */
  readonly unit: string
  readonly value_label: string
  readonly compare_label: string | null
  readonly points: readonly ReportPoint[]
}

export interface ReportRow {
  readonly cells: Readonly<Record<string, string>>
  readonly evidence_ids: readonly string[]
  /** PASS, FAIL, ASK, NOT_EVALUATED - or null for an ordinary row. */
  readonly flag: string | null
}

export interface Report {
  readonly id: string
  readonly title: string
  readonly gstin: string
  readonly fy: string
  readonly evaluated: boolean
  /** The sentence, written for someone who is not in finance. */
  readonly headline: string
  readonly missing_inputs: readonly string[]
  readonly caveat: string | null
  readonly columns: readonly string[]
  readonly series: readonly ReportSeries[]
  readonly rows: readonly ReportRow[]
  readonly total: Readonly<Record<string, string>> | null
}

export interface ReportListing {
  readonly id: string
  readonly title: string
  readonly group: string
  readonly purpose: string
  readonly available: boolean
  /** Present only when `available` is false: the dataset it waits on. */
  readonly needs?: string
  readonly roadmap_ref?: string
}

/**
 * A bar's length, and nothing else.
 *
 * This is the one place a rupee string becomes a JavaScript number, and the
 * result is only ever passed to a chart as a magnitude. It is never rendered:
 * the label beside the bar comes from the string, through `<Money>`.
 */
export function magnitude(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Download a report's rows as the CSV an officer sends to the taxpayer. */
export function toCsv(report: Report): string {
  const escape = (cell: string): string =>
    /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell
  const header = report.columns.map(escape).join(',')
  const lines = report.rows.map((row) =>
    report.columns.map((column) => escape(row.cells[column] ?? '')).join(','),
  )
  return [header, ...lines].join('\n')
}
