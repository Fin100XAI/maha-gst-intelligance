import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { Explain } from '../../components/Explain'
import { Money } from '../../components/Money'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'
import { api } from '../../lib/api'
import type { InsightItem, InsightPanel } from '../../lib/api'

/**
 * W9 — what this taxpayer's year looks like.
 *
 * The parameters answer *who should we audit*, the rules answer *what can we
 * demand*. This screen answers the question the filed data can answer on its
 * own and neither of those two asks: what shape is this business in?
 *
 * **It is not a findings screen, and it says so.** A concentration of
 * purchases in one supplier is not an offence; ten counterparties who are
 * both customer and supplier is not circular trading. Each panel carries its
 * own reading, in the officer's words, stating what the figure is and what it
 * does not mean — because a descriptive number placed next to a demand screen
 * will be read as a finding unless the screen refuses that reading out loud.
 *
 * **Every bar still reaches the spreadsheet.** A rule-backed figure drills
 * through its `calc_id`; a descriptive figure drills to the rows it was
 * summed from, each carrying its provenance id. That is the ninety-second
 * path, unchanged: figure → rows → file, sheet, row, original cells.
 */
export default function Insights(): JSX.Element {
  const { gstin = '' } = useParams()
  const [drill, setDrill] = useState<{ panel: string; bucket: string; title: string } | null>(null)

  const query = useQuery({
    queryKey: ['insights', gstin],
    queryFn: () => api.insights(gstin),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Reading the returns…</p>
  if (query.isError || query.data === undefined) {
    return (
      <Card className="max-w-2xl">
        <CardTitle>Not available</CardTitle>
        <p className="mt-2 text-sm text-ink-secondary">
          No such taxpayer in your jurisdiction, or nothing has been ingested for them.
        </p>
        <Button asChild className="mt-3">
          <Link to="/workbench/filings">Back to filings</Link>
        </Button>
      </Card>
    )
  }
  const data = query.data

  return (
    <div className="w-full">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/workbench/filings">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All returns
        </Link>
      </Button>

      <ScreenHeader
        code="W9"
        title="Shape of the year"
        lead={
          <>
            Six descriptive views of everything this taxpayer filed, drawn from the returns
            themselves. <strong>None of this is a finding.</strong> It is what an officer would
            want to see before deciding whether a case is worth opening.
          </>
        }
        meta={
          <>
            {data.legal_name} &middot; {gstin}
          </>
        }
      >
        <Explain title="Why this is separate from the flags and the rules">
          <p>
            The 34 risk flags compare a filing against a rule and produce a score. The 57 rules
            compare a filing against the law and produce a demand. Both carry a calculation id
            that resolves to the rule behind them.
          </p>
          <p className="mt-2">
            Nothing on this screen does that, because nothing on this screen is measured against
            anything. These are sums of the rows as filed — who the purchases came from, what
            rates were declared, when credit notes were issued. They carry no threshold, because
            the department has published none for these shapes.
          </p>
          <p className="mt-2">
            They still drill. Click any figure and you get the rows it was summed from, and from
            a row you reach the file, the sheet and the original cells.
          </p>
        </Explain>
      </ScreenHeader>

      {/* Two columns on a wide screen: the reader works left to right through
          six panels rather than scrolling one narrow column past all of them. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {data.panels.map((panel) => (
          <PanelCard
            key={panel.id}
            panel={panel}
            onDrill={(bucket, title) => {
              setDrill({ panel: panel.id, bucket, title })
            }}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-muted">{data.note}</p>

      {drill !== null && (
        <DrillPanel
          gstin={gstin}
          panel={drill.panel}
          bucket={drill.bucket}
          title={drill.title}
          onClose={() => {
            setDrill(null)
          }}
        />
      )}
    </div>
  )
}

function PanelCard({
  panel,
  onDrill,
}: {
  panel: InsightPanel
  onDrill: (bucket: string, title: string) => void
}): JSX.Element {
  const widest = panel.items.reduce((most, item) => {
    const value = Number(item.value ?? item.invoices ?? item.bought_from ?? '0')
    return Number.isFinite(value) && value > most ? value : most
  }, 0)

  return (
    <Card>
      <CardTitle>{panel.title}</CardTitle>
      <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{panel.reading}</p>

      {panel.items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">
          Nothing filed under this heading. Not zero — nothing to sum.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {panel.items.map((item) => (
            <PanelRow key={item.label} item={item} widest={widest} onDrill={onDrill} />
          ))}
        </ul>
      )}

      {panel.counterparties !== undefined && (
        <p className="mt-2 text-xs text-ink-muted">
          {panel.counterparties} counterparties in all.
        </p>
      )}
      {panel.count !== undefined && (
        <p className="mt-2 text-xs text-ink-muted">
          {panel.count} counterparties appear on both sides.
        </p>
      )}
    </Card>
  )
}

function PanelRow({
  item,
  widest,
  onDrill,
}: {
  item: InsightItem
  widest: number
  onDrill: (bucket: string, title: string) => void
}): JSX.Element {
  // A two-sided row (sold to / bought from) and a one-sided row are different
  // shapes; rendering them through one code path would give one of them a
  // misleading bar.
  const twoSided = item.sold_to !== undefined
  const primary = item.value ?? item.invoices ?? item.bought_from ?? '0'
  const width = widest > 0 ? Math.max((Number(primary) / widest) * 100, 0.5) : 0
  const target = item.drill
  const drill =
    target === null
      ? undefined
      : () => {
          onDrill(target.bucket, item.label)
        }

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-secondary">
          {item.label}
        </span>
        {twoSided ? (
          <span className="shrink-0 tabular text-xs">
            <Money value={item.bought_from ?? '0'} symbol={false} label="bought from" /> in &middot;{' '}
            <Money value={item.sold_to ?? '0'} symbol={false} label="sold to" /> out
          </span>
        ) : (
          <Money
            value={primary}
            className="shrink-0 tabular"
            {...(drill === undefined ? {} : { drill })}
          />
        )}
        {item.share !== undefined && item.share !== null && (
          <span className="w-12 shrink-0 text-right text-xs text-ink-muted tabular">
            {(Number(item.share) * 100).toFixed(1)}%
          </span>
        )}
      </div>
      {/* The bar is decoration over a number that is already on screen, so it
          carries no label of its own and is hidden from a screen reader. */}
      <div className="mt-0.5 h-1 w-full rounded bg-sunken" aria-hidden="true">
        <div className="h-1 rounded bg-accent/60" style={{ width: `${String(width)}%` }} />
      </div>
      {item.lines !== undefined && (
        <p className="mt-0.5 text-[10px] text-ink-muted">
          {item.lines} {item.lines === 1 ? 'line' : 'lines'}
          {drill !== undefined && (
            <button
              type="button"
              className="ml-2 underline decoration-dotted hover:text-ink"
              onClick={drill}
            >
              see the rows
            </button>
          )}
        </p>
      )}
    </li>
  )
}

/**
 * The drill: the rows behind one figure.
 *
 * A side sheet rather than a new route, because the reader is comparing this
 * against the panel they clicked and should not lose it.
 */
function DrillPanel({
  gstin,
  panel,
  bucket,
  title,
  onClose,
}: {
  gstin: string
  panel: string
  bucket: string
  title: string
  onClose: () => void
}): JSX.Element {
  const query = useQuery({
    queryKey: ['insight-rows', gstin, panel, bucket],
    queryFn: () => api.insightRows({ gstin, panel, bucket }),
  })

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-3xl flex-col border-l border-line bg-raised shadow-xl">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          <p className="text-xs text-ink-muted">
            {query.data === undefined
              ? 'Loading…'
              : `${String(query.data.total)} rows, as ingested`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
        {query.isLoading && <p className="text-sm text-ink-secondary">Loading rows…</p>}
        {query.data !== undefined && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-raised text-left text-ink-muted">
              <tr>
                <th className="py-1 pr-3 font-medium">Period</th>
                <th className="py-1 pr-3 font-medium">Document</th>
                <th className="py-1 pr-3 font-medium">Date</th>
                <th className="py-1 pr-3 font-medium">Counterparty</th>
                <th className="py-1 pr-3 text-right font-medium">Taxable</th>
                <th className="py-1 pr-3 text-right font-medium">IGST</th>
                <th className="py-1 pr-3 text-right font-medium">CGST</th>
                <th className="py-1 text-right font-medium">SGST</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((row) => (
                <tr key={row.id} className="border-t border-line/60">
                  <td className="py-1 pr-3 tabular">{row.period}</td>
                  <td className="py-1 pr-3">
                    <span className="font-mono">{row.doc_no}</span>
                    {row.doc_type !== 'INVOICE' && (
                      <span className="ml-1 text-ink-muted">
                        {row.doc_type === 'CREDIT_NOTE' ? 'CN' : 'DN'}
                      </span>
                    )}
                  </td>
                  <td className="py-1 pr-3 tabular">{row.doc_date ?? '—'}</td>
                  <td className="py-1 pr-3 font-mono">{row.counterparty ?? '—'}</td>
                  <td className="py-1 pr-3 text-right tabular">
                    <Money value={row.taxable_value} symbol={false} />
                  </td>
                  <td className="py-1 pr-3 text-right tabular">
                    <Money value={row.igst} symbol={false} />
                  </td>
                  <td className="py-1 pr-3 text-right tabular">
                    <Money value={row.cgst} symbol={false} />
                  </td>
                  <td className="py-1 text-right tabular">
                    <Money value={row.sgst} symbol={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {query.data !== undefined && query.data.total > query.data.items.length && (
          <p className="mt-3 text-xs text-ink-muted">
            Showing the first {query.data.items.length} of {query.data.total}.
          </p>
        )}
      </div>
    </div>
  )
}
