import { BarChart } from '@mui/x-charts/BarChart'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Money } from '../Money'
import type { ReportSeries } from '../../lib/reports'
import { magnitude } from '../../lib/reports'

/**
 * A backend `Series`, drawn - with the same three constraints `<ChartCard>`
 * holds itself to.
 *
 * * **One y-axis, ever.** A grouped bar puts two values on one scale because
 *   they are the same kind of thing. Two scales make unrelated numbers look
 *   correlated, and the reader cannot tell which one they are reading.
 * * **Status colour is reserved**, and never carries meaning alone. These
 *   charts use the ordinal ramp; a status lives in the table's flag column
 *   with its icon and its word.
 * * **Values do not animate.** A demand figure that counts up looks like a
 *   game, and this one ends in a statutory notice.
 *
 * **Drilling is required, and enforced by the server.** Every point the
 * backend emits carries either a `drill` or a `note`; a test in the Python
 * suite fails the build if one carries neither. Here, a point with a drill is
 * clickable and says so; a point without one is a legend entry describing the
 * report you are already on.
 */
export function ReportChart({ series }: { series: ReportSeries }): JSX.Element {
  const navigate = useNavigate()
  const grouped = series.points.some((point) => point.compare !== null)
  const horizontal = series.kind === 'horizontal_bar'

  const labels = series.points.map((point) => point.label)
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

  function onPoint(index: number): void {
    const target = series.points[index]?.drill
    if (target !== null && target !== undefined && target !== '') navigate(target)
  }

  return (
    <figure className="rounded-lg border border-line bg-raised p-4">
      <figcaption className="mb-1 text-sm font-semibold text-ink">{series.title}</figcaption>
      <p className="mb-3 text-xs text-ink-muted">
        {/* The axis says what it measures, in words, not just a unit glyph. */}
        Vertical axis: {series.unit}. One scale only.
      </p>
      <BarChart
        height={320}
        layout={horizontal ? 'horizontal' : 'vertical'}
        series={bars.map((bar) => ({ ...bar, valueFormatter: () => '' }))}
        {...(horizontal
          ? { yAxis: [{ scaleType: 'band' as const, data: labels }] }
          : { xAxis: [{ scaleType: 'band' as const, data: labels }] })}
        skipAnimation
        onItemClick={(_event, item) => {
          onPoint(item.dataIndex)
        }}
        margin={{ left: horizontal ? 140 : 72, right: 16, top: 8, bottom: 56 }}
      />
      {/*
        The figures themselves, as strings, through `<Money>` - because the
        chart draws lengths and a reader who needs the number needs it exact.
        This is also the keyboard path: a bar is not focusable, a button is.
      */}
      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {series.points.map((point, index) => (
          <li key={point.label} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-ink-secondary" title={point.label}>
              {point.drill === null ? (
                point.label
              ) : (
                <button
                  type="button"
                  className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
                  onClick={() => {
                    onPoint(index)
                  }}
                >
                  {point.label}
                </button>
              )}
            </span>
            <span className="shrink-0 tabular">
              {/*
                `drill` on `<Money>` is the callback that opens the figure's
                provenance, not a path - an aggregate's provenance is the rows
                it was summed from, and here that is the drill route.
              */}
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
                  {' / '}
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
        <p className="mt-2 text-xs text-ink-muted">
          Shown as {series.value_label} / {series.compare_label}.
        </p>
      )}
    </figure>
  )
}
