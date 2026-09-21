import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Money } from './Money'
import { StatusChip } from './StatusChip'
import { useProvenance } from '../lib/provenance'
import { api } from '../lib/api'
import type { ReconCell } from '../lib/api'

/**
 * The Reconciliation Workbench - the eleven identities across every period.
 *
 * Three states, three different cells:
 *
 * * **Holds** - the identity balanced.
 * * **Breached** - by a stated, head-wise amount.
 * * **Not evaluated** - a dataset was absent, and the cell names it.
 *
 * A blank where the third should be is exactly the failure this screen exists
 * to prevent. An officer reading a matrix of ticks and gaps will read the gaps
 * as ticks, and the reconciliation they sign will be over data that was never
 * tested.
 *
 * The head-wise split is the default, not an option. An identity breached by
 * +1,00,000 IGST and −1,00,000 CGST nets to zero; a net view would report a
 * clean reconciliation over two real errors.
 */
export function Reconciliation({ gstin }: { gstin: string }): JSX.Element {
  const [selected, setSelected] = useState<ReconCell | null>(null)
  const query = useQuery({
    queryKey: ['reconciliation', gstin],
    queryFn: () => api.reconciliation(gstin),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Reconciling…</p>
  if (query.isError || query.data === undefined) {
    return <p className="text-status-critical">The matrix could not be loaded.</p>
  }
  const data = query.data
  const lookup = new Map(data.cells.map((cell) => [`${cell.period}.${cell.identity_id}`, cell]))

  if (data.periods.length === 0) {
    return (
      <section className="rounded border border-status-unknown/40 bg-sunken p-4">
        <h3 className="mb-1 text-base font-semibold">No identity was evaluated</h3>
        <p className="text-sm text-ink-secondary">{data.note}</p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Reconciliation</h2>
        <StatusChip level="good" label={`${String(data.counts.HOLDS ?? 0)} hold`} />
        <StatusChip
          level="critical"
          label={`${String(data.counts.BREACHED ?? 0)} breached`}
        />
        <StatusChip
          level="unknown"
          label={`${String(data.counts.NOT_EVALUATED ?? 0)} not evaluated`}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <caption className="sr-only">
            Reconciliation identities by period. Each cell is a link to the computation
            behind it.
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-line bg-base py-1 pr-2 text-left">
                Identity
              </th>
              {data.periods.map((period) => (
                <th key={period} className="border-b border-line px-1 py-1 tabular">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.identities.map((identity) => (
              <tr key={identity.identity_id}>
                <th
                  scope="row"
                  className="sticky left-0 border-b border-line bg-base py-1 pr-2 text-left font-normal"
                  title={identity.title}
                >
                  <span className="tabular text-ink-muted">{identity.identity_id}</span>{' '}
                  <span className="text-ink-secondary">
                    {identity.title.length > 34
                      ? `${identity.title.slice(0, 34)}…`
                      : identity.title}
                  </span>
                </th>
                {data.periods.map((period) => {
                  const cell = lookup.get(`${period}.${identity.identity_id}`)
                  return (
                    <td key={period} className="border-b border-line p-0.5 text-center">
                      <Cell
                        cell={cell}
                        onOpen={() => {
                          if (cell !== undefined) setSelected(cell)
                        }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-ink-muted">{data.note}</p>

      {selected !== null && (
        <Detail
          cell={selected}
          title={
            data.identities.find((row) => row.identity_id === selected.identity_id)?.title ??
            selected.identity_id
          }
          onClose={() => {
            setSelected(null)
          }}
        />
      )}
    </section>
  )
}

/** One cell. Never blank: absence of data is itself a state. */
function Cell({
  cell,
  onOpen,
}: {
  cell: ReconCell | undefined
  onOpen: () => void
}): JSX.Element {
  if (cell === undefined) {
    return (
      <span
        className="text-ink-muted"
        title="This identity was not computed for this period."
      >
        ·
      </span>
    )
  }

  const glyph =
    cell.status === 'HOLDS' ? '●' : cell.status === 'BREACHED' ? '■' : '○'
  const tone =
    cell.status === 'HOLDS'
      ? 'text-status-good'
      : cell.status === 'BREACHED'
        ? 'text-status-critical'
        : 'text-status-unknown'
  const label =
    cell.status === 'HOLDS'
      ? 'Holds'
      : cell.status === 'BREACHED'
        ? `Breached by ${cell.delta_total}`
        : `Not evaluated - needs ${cell.missing_inputs.join(', ') || 'an unnamed dataset'}`

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`h-6 w-6 rounded hover:bg-raised ${tone}`}
      title={label}
      aria-label={`${cell.identity_id} ${cell.period}: ${label}`}
    >
      {glyph}
    </button>
  )
}

function Detail({
  cell,
  title,
  onClose,
}: {
  cell: ReconCell
  title: string
  onClose: () => void
}): JSX.Element {
  const { open } = useProvenance()

  return (
    <aside className="mt-4 rounded border border-line bg-raised p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            <span className="tabular text-ink-muted">{cell.identity_id}</span> {title}
          </h3>
          <p className="text-sm text-ink-secondary tabular">Period {cell.period}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-line px-2 py-1 text-sm text-ink-secondary hover:text-ink"
        >
          Close
        </button>
      </div>

      {cell.status === 'NOT_EVALUATED' ? (
        <>
          <StatusChip level="unknown" label="Not evaluated" />
          <p className="mt-2 text-sm text-ink-secondary">
            This identity could not be tested. It is not a reconciliation that passed.
          </p>
          <h4 className="mt-3 text-xs uppercase tracking-wide text-ink-muted">Waiting on</h4>
          <ul className="mt-1 list-inside list-disc text-sm">
            {(cell.missing_inputs.length > 0
              ? cell.missing_inputs
              : ['an unnamed dataset']
            ).map((input) => (
              <li key={input}>{input}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <StatusChip
            level={cell.status === 'HOLDS' ? 'good' : 'critical'}
            label={cell.status === 'HOLDS' ? 'Holds' : 'Breached'}
          />
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            {(['igst', 'cgst', 'sgst', 'cess'] as const).map((head) => (
              <div key={head} className="contents">
                <dt className="text-ink-muted uppercase">{head}</dt>
                <dd>
                  <Money value={cell.delta[head]} calcId={cell.calc_id} symbol={false} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-ink-muted">
            Head-wise. These four are shown separately because they are four different
            liabilities, and a net of them is not a reconciliation.
          </p>
        </>
      )}

      {cell.consequence !== null && (
        <p className="mt-3 text-sm">
          <span className="text-ink-muted">Consequence: </span>
          {cell.consequence}
        </p>
      )}

      <button
        type="button"
        className="mt-3 text-sm underline"
        onClick={() => {
          open(cell.calc_id)
        }}
      >
        Where this came from
      </button>
    </aside>
  )
}
