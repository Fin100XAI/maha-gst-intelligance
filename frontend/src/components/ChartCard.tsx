import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Money as MoneyValue } from '../lib/money'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

/**
 * `<ChartCard>` — a real chart, a table view, and a **mandatory drill handler**.
 *
 * `onDrill` is required, not optional. A ChartCard without a drill handler
 * fails code review, so the type system refuses to build one: a bar a
 * Commissioner cannot click is a bar a Commissioner cannot act on, and it will
 * be the first thing they try.
 *
 * Drawn with Recharts, which was already the declared charting library. Three
 * constraints hold whatever the library does:
 *
 * * **One y-axis, ever.** A second scale makes two unrelated series look
 *   comparable, and the reader cannot tell which axis they are reading.
 * * **Status colour is reserved.** A bar carrying a risk band wears the status
 *   hue and the label says which band it is; a bar with no status wears the
 *   ordinal blue ramp. Meaning is never in the hue alone.
 * * **Values do not animate.** `isAnimationActive` is off: a demand figure
 *   that counts up looks like a game, and this one ends in a statutory notice.
 *   The bar's *length* settles; the number beside it does not move.
 */
export interface ChartDatum {
  /** What the axis shows. */
  label: string
  /** The value, as a string: money and ratios never become JS numbers. */
  value: string
  /** A numeric magnitude for the bar length only — never displayed. */
  magnitude: number
  /** Where clicking this element goes. */
  drill: string
  /** The reserved status colour, when this element carries a status. */
  status?: 'good' | 'warning' | 'serious' | 'critical' | 'unknown' | undefined
  note?: string | undefined
}

/**
 * A money string as a chart datum value.
 *
 * Indian grouping, so a bar's label reads the way the rest of the platform
 * reads. A raw `13455030.05` on a chart is a number an officer has to count
 * digits on, and they will count them wrong.
 */
export function moneyDatum(value: string): { value: string; magnitude: number } {
  const parsed = MoneyValue.maybe(value)
  return {
    value: parsed === null ? value : parsed.format({ symbol: true }),
    magnitude: Number(value.replace(/[^0-9.]/g, '')) || 0,
  }
}

const STATUS_FILL: Record<string, string> = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
  unknown: 'var(--status-unknown)',
}

/** The ordinal blue ramp, used when an element carries no status. */
const ORDINAL = ['var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)', 'var(--seq-6)']

function fillFor(datum: ChartDatum, index: number): string {
  return datum.status !== undefined
    ? (STATUS_FILL[datum.status] ?? ORDINAL[0] ?? '')
    : (ORDINAL[index % ORDINAL.length] ?? '')
}

/** Height per bar, so a two-bar chart is not as tall as a nine-bar one. */
const ROW_HEIGHT = 34
const MIN_HEIGHT = 96

export function ChartCard({
  title,
  subtitle,
  data,
  onDrill,
  footer,
  unit,
  className,
}: {
  title: string
  subtitle?: string | undefined
  data: ChartDatum[]
  /** Mandatory. */
  onDrill: (drill: string, datum: ChartDatum) => void
  footer?: ReactNode | undefined
  unit?: string | undefined
  className?: string | undefined
}): JSX.Element {
  const [asTable, setAsTable] = useState(false)
  const height = Math.max(MIN_HEIGHT, data.length * ROW_HEIGHT)

  return (
    <Card className={className} interactive>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {subtitle !== undefined && <CardDescription>{subtitle}</CardDescription>}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setAsTable((current) => !current)
          }}
          aria-pressed={asTable}
          className="shrink-0"
        >
          {asTable ? 'Chart' : 'Table'}
        </Button>
      </CardHeader>

      <CardContent>
        {asTable ? (
          <table className="w-full text-sm">
            <caption className="sr-only">{title}, as a table</caption>
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                <th className="py-1 text-left">Category</th>
                <th className="py-1 text-right">{unit ?? 'Value'}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((datum) => (
                <tr key={datum.label} className="border-b border-line">
                  <td className="py-1">
                    <button
                      type="button"
                      className="underline decoration-dotted underline-offset-2"
                      onClick={() => {
                        onDrill(datum.drill, datum)
                      }}
                    >
                      {datum.label}
                    </button>
                  </td>
                  <td className="py-1 text-right tabular">{datum.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                barCategoryGap="22%"
              >
                {/* One scale. There is no second y-axis and never will be.
                    The domain is stated rather than inferred: in a vertical
                    layout Recharts builds the numeric axis before it has seen
                    the bars, and an implicit domain leaves it with nothing to
                    generate ticks from. */}
                <XAxis type="number" domain={[0, 'dataMax']} hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={132}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--ink-secondary)', fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: 'var(--surface-sunken)' }} content={DatumTooltip} />
                <Bar
                  dataKey="magnitude"
                  radius={[3, 3, 3, 3]}
                  isAnimationActive={false}
                  onClick={(entry: unknown) => {
                    const datum = entry as ChartDatum | undefined
                    if (datum?.drill !== undefined) onDrill(datum.drill, datum)
                  }}
                  className="cursor-pointer"
                >
                  {data.map((datum, index) => (
                    <Cell key={datum.label} fill={fillFor(datum, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* The figures, beside the chart rather than on it: a value printed
            inside a bar is unreadable on a short bar and clipped on a long
            one. These are also the keyboard path to the drill. */}
        {!asTable && (
          <ul className="mt-2 space-y-0.5">
            {data.map((datum, index) => (
              <li key={datum.label}>
                <button
                  type="button"
                  onClick={() => {
                    onDrill(datum.drill, datum)
                  }}
                  title={datum.note ?? `Show the businesses behind ${datum.label}`}
                  className="flex w-full items-baseline gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-sunken"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ background: fillFor(datum, index) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink-secondary">
                    {datum.label}
                  </span>
                  <span className="shrink-0 tabular">{datum.value}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {footer !== undefined && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

/** The hover card: the real value, not the magnitude the bar was drawn from. */
function DatumTooltip(props: unknown): JSX.Element | null {
  const { active, payload } = props as {
    active?: boolean
    payload?: { payload: ChartDatum }[]
  }
  const datum = payload?.[0]?.payload
  if (active !== true || datum === undefined) return null
  return (
    <div className="glass-strong rounded px-2 py-1 text-xs">
      <div className="font-medium">{datum.label}</div>
      <div className="tabular text-ink-secondary">{datum.value}</div>
      {datum.note !== undefined && <div className="mt-0.5 text-ink-muted">{datum.note}</div>}
    </div>
  )
}

/** Navigate to the drill results page for a drill href the API supplied. */
export function useDrillNavigation(): (drill: string) => void {
  const navigate = useNavigate()
  return (drill: string) => {
    navigate(`/drill?target=${encodeURIComponent(drill)}`)
  }
}
