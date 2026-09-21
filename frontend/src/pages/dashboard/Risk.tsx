import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartCard, moneyDatum, useDrillNavigation } from '../../components/ChartCard'
import type { ChartDatum } from '../../components/ChartCard'
import { Money } from '../../components/Money'
import { api } from '../../lib/api'
import type { RiskBandRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * D4 - Risk Landscape.
 *
 * The two distributions sit side by side and are never fused. P-Score answers
 * *who should we audit*; F-Score answers *what can we demand, and on what
 * evidence*. They carry different evidentiary weight, so a single blended
 * "risk number" would be a worse answer to both questions than either is
 * alone.
 *
 * Revenue at risk is split by confidence for the same reason: a Commissioner
 * reading one total needs to know how much of it survives a reply.
 */
export default function Risk(): JSX.Element {
  const drill = useDrillNavigation()
  const query = useQuery({ queryKey: ['risk'], queryFn: () => api.risk() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading risk…</p>
  if (query.isError || !query.data) return <NoRun />
  const data = query.data

  const toData = (rows: RiskBandRow[], status: (band: string) => ChartDatum['status']) =>
    rows.map((row) => ({
      label: row.band,
      value: `${String(row.taxpayer_count)} taxpayers`,
      magnitude: row.taxpayer_count,
      drill: row.drill,
      status: status(row.band),
    }))

  const confidence: ChartDatum[] = data.revenue_at_risk_by_confidence.map((row) => ({
    label: row.confidence,
    ...moneyDatum(row.value),
    drill: row.drill,
    note: row.note,
  }))

  return (
    <div className="w-full">
      <ScreenHeader
        code="D4"
        title="Where the risk is"
        lead="How the businesses in view spread across the risk bands, and which of the 34 flags are driving it. Both scores are shown side by side, because one says who to look at and the other says what can be demanded."
        meta={`run ${data.engine_run_id.slice(0, 8)}`}
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Who should we look at?"
          subtitle="P-Score - how many businesses fall in each risk band"
          data={toData(data.p_bands, pBandStatus)}
          unit="taxpayers"
          onDrill={(href) => {
            drill(href)
          }}
          footer={<BandTable rows={data.p_bands} kind="P" onDrill={drill} />}
        />
        <ChartCard
          title="What can we actually demand?"
          subtitle="F-Score - the same businesses, by how much the findings are worth"
          data={toData(data.f_bands, fBandStatus)}
          unit="taxpayers"
          onDrill={(href) => {
            drill(href)
          }}
          footer={<BandTable rows={data.f_bands} kind="F" onDrill={drill} />}
        />
      </div>

      <p className="mb-6 text-sm text-ink-secondary">{data.note}</p>

      <ChartCard
        title="Revenue at risk, by confidence"
        subtitle="How much of the total survives a reply."
        data={confidence}
        unit="₹"
        onDrill={(href) => {
          drill(href)
        }}
        footer={
          <ul className="space-y-1 text-xs text-ink-muted">
            {data.revenue_at_risk_by_confidence.map((row) => (
              <li key={row.confidence}>
                <span className="font-medium">{row.confidence}</span> - {row.note}
              </li>
            ))}
          </ul>
        }
      />
    </div>
  )
}

function BandTable({
  rows,
  kind,
  onDrill,
}: {
  rows: RiskBandRow[]
  kind: 'P' | 'F'
  onDrill: (href: string) => void
}): JSX.Element {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-line text-ink-muted">
          <th className="py-1 text-left">Band</th>
          <th className="py-1 text-right">Taxpayers</th>
          <th className="py-1 text-right">Mean score</th>
          {kind === 'P' && <th className="py-1 text-right">Mean coverage</th>}
          <th className="py-1 text-right">At risk</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.band} className="border-b border-line">
            <td className="py-1">{row.band}</td>
            <td className="py-1 text-right tabular">{row.taxpayer_count}</td>
            <td className="py-1 text-right tabular">
              {(kind === 'P' ? row.p_score_mean : row.f_score_mean) ?? '-'}
            </td>
            {kind === 'P' && (
              <td className="py-1 text-right tabular">{row.p_coverage_mean ?? '-'}</td>
            )}
            <td className="py-1 text-right">
              <Money
                value={row.revenue_at_risk}
                calcId={null}
                symbol={false}
                drill={() => {
                  onDrill(row.drill)
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function pBandStatus(band: string): ChartDatum['status'] {
  if (band === 'SEVERE') return 'critical'
  if (band === 'HIGH') return 'serious'
  if (band === 'MEDIUM') return 'warning'
  if (band === 'LOW') return 'good'
  return 'unknown'
}

function fBandStatus(band: string): ChartDatum['status'] {
  if (band === 'RED') return 'critical'
  if (band === 'AMBER') return 'warning'
  if (band === 'GREEN') return 'good'
  return 'unknown'
}

function NoRun(): JSX.Element {
  return (
    <section className="max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold">No engine run yet</h1>
      <p className="text-ink-secondary">
        Nothing has been ingested and scored. Run <code className="text-sm">make demo</code>.
      </p>
    </section>
  )
}
