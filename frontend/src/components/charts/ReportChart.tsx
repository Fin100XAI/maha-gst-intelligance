import { BarChart } from '@mui/x-charts/BarChart'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { axisLabel, shortRupees } from '../../lib/format'
import { Money } from '../Money'
import type { ReportSeries } from '../../lib/reports'
import { magnitude } from '../../lib/reports'

/**
 * A backend `Series`, drawn so that nothing lands on top of anything else.
 *
 * The first version overlapped, measurably: twenty GSTINs down one axis
 * collided with each other nineteen times, and the crore-scale ticks ran 64
 * pixels *into* their neighbours. Both were invisible to a reader who was not
 * looking for them - the chart simply looked dense.
 *
 * Four rules, each a consequence of that measurement:
 *
 * 1. **Height comes from the data, not from a constant.** A horizontal bar
 *    gets its own row, so twenty bars is twenty rows tall. A chart is allowed
 *    to be long; it is not allowed to be illegible.
 * 2. **Axis labels are shortened, and the exact value sits beside the chart.**
 *    A tick is a ruler, not a figure. `4.2 Cr` fits where `4,19,18,644.44`
 *    does not, and drawing the long one anyway is how the smear happened.
 * 3. **The legend sits above the plot**, never floating inside it, so it
 *    cannot come to rest on a bar.
 * 4. **One y-axis, ever**, stated in words above the chart. Two scales make
 *    unrelated numbers look correlated.
 *
 * Status colour is reserved and never carries meaning alone: these charts use
 * the ordinal ramp, and a status lives in the table with its icon and word.
 * Values do not animate - a demand figure that counts up looks like a game,
 * and this one ends in a statutory notice.
 */

/** Room for one horizontal bar and its label, without crowding its neighbour. */
const ROW_HEIGHT = 30
const VERTICAL_HEIGHT = 300
const CHROME = 90
/** Above this many categories, vertical bars cannot label themselves. */
const TOO_MANY_FOR_VERTICAL = 8

export function ReportChart({ series }: { series: ReportSeries }): JSX.Element {
  const navigate = useNavigate()
  const grouped = series.points.some((point) => point.compare !== null)
  const horizontal =
    series.kind === 'horizontal_bar' || series.points.length > TOO_MANY_FOR_VERTICAL

  const labels = series.points.map((point) => axisLabel(point.label))
  const primary = series.points.map((point) => magnitude(point.value))
  const secondary = series.points.map((point) =>
    point.compare === null ? 0 : magnitude(point.compare),
  )

  const bars = grouped
    ? [
        { data: primary, label: series.value_label, id: 'primary' },
        { data: secondary, label: series.compare_label ?? 'compared', id: 'compare' },
      ]
    : [{ data: primary, label: series.value_label, id: 'primary' }]

  const height = horizontal
    ? Math.max(200, series.points.length * ROW_HEIGHT * (grouped ? 2 : 1) + CHROME)
    : VERTICAL_HEIGHT

  function onPoint(index: number): void {
    const target = series.points[index]?.drill
    if (target !== null && target !== undefined && target !== '') navigate(target)
  }

  const valueAxis = { valueFormatter: (value: number | null) => shortRupees(value ?? 0) }
  const bandAxis = { scaleType: 'band' as const, data: labels }

  return (
    <figure className="rounded-xl border border-line bg-raised p-5">
      <figcaption className="text-[0.9375rem] font-semibold text-ink">{series.title}</figcaption>
      <p className="mt-0.5 text-xs text-ink-muted">{series.unit} · one scale</p>

      <div className="mt-4">
        <BarChart
          height={height}
          layout={horizontal ? 'horizontal' : 'vertical'}
          series={bars}
          {...(horizontal
            ? { yAxis: [bandAxis], xAxis: [valueAxis] }
            : { xAxis: [bandAxis], yAxis: [valueAxis] })}
          skipAnimation
          borderRadius={3}
          onItemClick={(_event, item) => {
            onPoint(item.dataIndex)
          }}
          slotProps={{
            legend: grouped
              ? { direction: 'row', position: { vertical: 'top', horizontal: 'left' } }
              : { hidden: true },
          }}
          margin={{
            left: horizontal ? 118 : 64,
            right: 24,
            top: grouped ? 44 : 12,
            bottom: horizontal ? 36 : 64,
          }}
        />
      </div>

      {/*
        The exact figures, as strings, through `<Money>`. The chart draws
        lengths; a reader who needs the number needs it to the paisa. This is
        also the keyboard path - an SVG bar is not focusable, a button is.
      */}
      <ul className="mt-4 divide-y divide-line border-t border-line">
        {series.points.map((point, index) => (
          <li key={point.label} className="flex items-baseline justify-between gap-4 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink-secondary" title={point.label}>
              {point.drill === null ? (
                point.label
              ) : (
                <button
                  type="button"
                  className="truncate underline decoration-dotted underline-offset-4 hover:decoration-solid"
                  onClick={() => {
                    onPoint(index)
                  }}
                >
                  {point.label}
                </button>
              )}
              {point.note !== null && (
                <span className="ml-2 text-xs text-ink-muted">{point.note}</span>
              )}
            </span>
            <span className="shrink-0 whitespace-nowrap tabular">
              <Money
                value={point.value}
                symbol={false}
                {...(point.drill === null
                  ? {}
                  : {
                      drill: () => {
                        onPoint(index)
                      },
                    })}
              />
              {point.compare !== null && (
                <>
                  <span className="mx-1.5 text-ink-muted">/</span>
                  <Money
                    value={point.compare}
                    symbol={false}
                    {...(point.drill === null
                      ? {}
                      : {
                          drill: () => {
                            onPoint(index)
                          },
                        })}
                  />
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      {series.compare_label !== null && (
        <p className="mt-3 text-xs text-ink-muted">
          Read as {series.value_label} / {series.compare_label}.
        </p>
      )}
    </figure>
  )
}
