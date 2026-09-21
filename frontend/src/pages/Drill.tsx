import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Figure } from '../components/Money'
import { StatusChip } from '../components/StatusChip'
import type { StatusLevel } from '../components/StatusChip'
import { api } from '../lib/api'
import type { DrillRow } from '../lib/api'

/**
 * The taxpayer list behind a chart element.
 *
 * Every visual element on every dashboard resolves here. No exceptions, no
 * dead ends - and from a row here, the taxpayer's own file is one more click.
 */
export default function Drill(): JSX.Element {
  const [params] = useSearchParams()
  const target = params.get('target') ?? ''

  const query = useQuery({
    queryKey: ['drill', target],
    queryFn: () => api.drill(target),
    enabled: target !== '',
  })

  if (target === '') {
    return <p className="text-sm text-ink-secondary">No chart element was selected.</p>
  }
  if (query.isLoading) return <p className="text-sm text-ink-secondary">Resolving…</p>
  if (query.isError || !query.data) {
    return (
      <section className="max-w-2xl">
        <h1 className="mb-2 text-xl font-semibold">Drill</h1>
        <StatusChip level="critical" label="This element did not resolve" />
        <p className="mt-3 text-sm text-ink-secondary">
          A bar a Commissioner cannot click is a bar a Commissioner cannot act on. This is a
          bug - please report it with the address below.
        </p>
        <p className="mt-2 break-all rounded bg-sunken p-2 text-xs tabular">{target}</p>
      </section>
    )
  }

  const data = query.data

  return (
    <div className="w-full">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">{data.metric.title}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          <span className="tabular">{data.metric.id}</span> · bucket{' '}
          <span className="tabular">{data.bucket}</span> ·{' '}
          <span className="tabular">{data.total}</span> taxpayer(s)
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {data.metric.formula} - grain: {data.metric.grain}
        </p>
        {data.metric.note !== null && (
          <p className="mt-1 text-xs text-ink-muted">{data.metric.note}</p>
        )}
      </header>

      {data.items.length === 0 ? (
        <p className="text-sm text-ink-secondary">
          No taxpayer sits behind this element. The figure is nil, not missing.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-line bg-chart">
          <table className="w-full text-sm">
            <caption className="sr-only">Taxpayers behind {data.metric.title}</caption>
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                <th className="p-2 text-left">GSTIN</th>
                <th className="p-2 text-left">Trade name</th>
                <th className="p-2 text-left">Division</th>
                <th className="p-2 text-right">P-Score</th>
                <th className="p-2 text-right">Coverage</th>
                <th className="p-2 text-right">F-Score</th>
                <th className="p-2 text-left">Officer</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <Row key={row.gstin} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Row({ row }: { row: DrillRow }): JSX.Element {
  return (
    <tr className="border-b border-line hover:bg-sunken">
      <td className="p-2 tabular">{row.gstin}</td>
      <td className="p-2">{row.trade_name ?? row.legal_name ?? '-'}</td>
      <td className="p-2">{row.division ?? '-'}</td>
      <td className="p-2 text-right">
        {row.p_score === null ? (
          '-'
        ) : (
          <span className="inline-flex items-center gap-2">
            <Figure value={row.p_score} calcId={row.p_calc_id} />
            {row.p_band !== null && <BandChip band={row.p_band} kind="P" />}
          </span>
        )}
      </td>
      {/* Coverage sits beside the score, at the same weight, always. */}
      <td className="p-2 text-right tabular text-ink-secondary">
        {row.p_coverage ?? '-'}
      </td>
      <td className="p-2 text-right">
        {row.f_score === null ? (
          '-'
        ) : (
          <span className="inline-flex items-center gap-2">
            <Figure value={row.f_score} calcId={row.f_calc_id} />
            {row.f_band !== null && <BandChip band={row.f_band} kind="F" />}
          </span>
        )}
      </td>
      <td className="p-2 text-ink-secondary">{row.officer_id ?? '-'}</td>
    </tr>
  )
}

const P_LEVEL = { LOW: 'good', MODERATE: 'warning', HIGH: 'serious', SEVERE: 'critical' } as const
const F_LEVEL = { GREEN: 'good', AMBER: 'warning', ORANGE: 'serious', RED: 'critical' } as const

function BandChip({ band, kind }: { band: string; kind: 'P' | 'F' }): JSX.Element {
  const level =
    kind === 'P'
      ? ((P_LEVEL as Record<string, StatusLevel | undefined>)[band] ?? 'unknown')
      : ((F_LEVEL as Record<string, StatusLevel | undefined>)[band] ?? 'unknown')
  return <StatusChip level={level} label={band} />
}
