import { useState } from 'react'
import type { JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Explain } from './Explain'
import { NeedsRole } from './NeedsRole'
import { StatusChip } from './StatusChip'
import { api } from '../lib/api'
import { useCan } from '../lib/can'
import type { RegisterRow } from '../lib/api'

/**
 * The threshold register - every number the engine runs on, editable.
 *
 * Three states, and the whole point of the screen is that they stay apart:
 *
 * * **Provisional** - a working value the platform shipped with. Nobody has
 *   adopted it. Enough to analyse with; not enough to demand on.
 * * **Department** - the department set it, and the register names who and
 *   when. Defensible as policy, not as a citation.
 * * **Notified** - a notification backs it. This is what a notice quotes.
 *
 * Editing writes a new effective-dated row and closes the old one. Nothing is
 * overwritten, because the engine resolves a threshold as at the tax period
 * under scrutiny: re-running FY 2019-20 must apply the FY 2019-20 value
 * whatever the department has decided since.
 */
export function ThresholdRegister(): JSX.Element {
  const client = useQueryClient()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<RegisterRow | null>(null)
  const [adopting, setAdopting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const mayAdminister = useCan('setThresholds')
  const register = useQuery({ queryKey: ['register'], queryFn: () => api.register() })

  const refresh = (): void => {
    void client.invalidateQueries({ queryKey: ['register'] })
    setEditing(null)
    setAdopting(false)
  }

  if (register.isLoading) return <p className="text-sm text-ink-secondary">Loading…</p>
  if (register.isError || register.data === undefined) {
    return <p className="text-status-critical">The register could not be loaded.</p>
  }
  const data = register.data
  const provisional = data.by_status.PROVISIONAL ?? 0

  const rows = data.items.filter((row) => {
    if (filter === '') return true
    if (filter === 'PROVISIONAL' || filter === 'DEPARTMENT' || filter === 'NOTIFIED') {
      return row.status === filter
    }
    const needle = filter.toLowerCase()
    return (
      row.owner.toLowerCase().includes(needle) || row.key.toLowerCase().includes(needle)
    )
  })

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="flex items-baseline text-base font-semibold">
          The numbers the rules compare against
          <Explain term="threshold" />
        </h2>
        <StatusChip level="good" label={`${String(data.by_status.NOTIFIED ?? 0)} notified`} />
        <StatusChip
          level="serious"
          label={`${String(data.by_status.DEPARTMENT ?? 0)} department`}
        />
        <StatusChip level="warning" label={`${String(provisional)} provisional`} />
      </div>

      <p className="mb-3 text-sm text-ink-secondary">{data.note}</p>

      {provisional > 0 && (
        <div className="mb-4 rounded border border-status-warning/50 bg-sunken p-3">
          <h3 className="flex items-baseline text-sm font-semibold">
            {provisional} of these are still working values nobody has signed
            <Explain term="provisional" />
          </h3>
          <p className="mt-1 text-sm text-ink-secondary">
            Every finding computed from one is correct arithmetic on a number nobody has
            signed. Adopting them records that the department owns these values - the
            figures do not change.
          </p>
          <button
            type="button"
            disabled={!mayAdminister}
            onClick={() => {
              setAdopting(true)
            }}
            className="mt-2 rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
          >
            Adopt as departmental values
          </button>
        </div>
      )}

      {adopting && (
        <AdoptForm
          count={provisional}
          onDone={(note) => {
            setMessage(note)
            refresh()
          }}
          onCancel={() => {
            setAdopting(false)
          }}
        />
      )}

      {message !== null && (
        <p className="mb-3 rounded border border-status-good/50 bg-sunken p-3 text-sm">
          {message}
        </p>
      )}

      <label className="mb-3 flex flex-col gap-1 text-xs text-ink-muted">
        Filter
        <input
          type="search"
          value={filter}
          placeholder="OUT-01, pct_threshold, or a status"
          onChange={(event) => {
            setFilter(event.target.value)
          }}
          className="w-72 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
        />
      </label>

      <NeedsRole capability="setThresholds" what="change these numbers" />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-muted">
            <th className="py-1 text-left">Rule</th>
            <th className="py-1 text-left">Key</th>
            <th className="py-1 text-right">Value</th>
            <th className="py-1 text-left">From</th>
            <th className="py-1 text-left">Authority</th>
            <th className="py-1 text-right">
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <td className="py-1 tabular">{row.owner}</td>
              <td className="py-1">{row.key}</td>
              <td className="py-1 text-right tabular">
                {row.value}
                {row.unit !== null && <span className="ml-1 text-ink-muted">{row.unit}</span>}
              </td>
              <td className="py-1 tabular">{row.effective_from}</td>
              <td className="py-1">
                <Authority row={row} />
              </td>
              <td className="py-1 text-right">
                <button
                  type="button"
                  disabled={!mayAdminister}
                  onClick={() => {
                    setEditing(row)
                  }}
                  className="rounded border border-line px-2 py-0.5 text-xs disabled:opacity-40"
                >
                  Change
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <p className="mt-3 text-sm text-ink-secondary">Nothing matches that filter.</p>
      )}

      {editing !== null && (
        <EditForm
          row={editing}
          onDone={(note) => {
            setMessage(note)
            refresh()
          }}
          onCancel={() => {
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}

function Authority({ row }: { row: RegisterRow }): JSX.Element {
  if (row.status === 'NOTIFIED') {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <StatusChip level="good" label="Notified" />
        <span className="text-xs text-ink-secondary">{row.notification_ref}</span>
      </span>
    )
  }
  if (row.status === 'DEPARTMENT') {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <StatusChip level="serious" label="Department" />
        <span className="text-xs text-ink-muted">
          {row.approved_by} · {row.approved_at?.slice(0, 10)}
        </span>
      </span>
    )
  }
  return (
    <StatusChip
      level="warning"
      label="Provisional"
      title={row.source_note ?? 'A working value. Nobody has adopted it.'}
    />
  )
}

function EditForm({
  row,
  onDone,
  onCancel,
}: {
  row: RegisterRow
  onDone: (note: string) => void
  onCancel: () => void
}): JSX.Element {
  const [value, setValue] = useState(row.value)
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState(row.notification_ref ?? '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () =>
      api.setParameter(row.owner, row.key, {
        value,
        effective_from: from,
        ...(ref.trim() === '' ? {} : { notification_ref: ref.trim() }),
        ...(note.trim() === '' ? {} : { source_note: note.trim() }),
      }),
    onSuccess: (saved) => {
      onDone(
        `${saved.owner}.${saved.key} is ${saved.value} from ${saved.effective_from}. ` +
          'Earlier periods keep the value that was in force then.',
      )
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  return (
    <aside className="mt-4 rounded border border-line bg-raised p-4">
      <h3 className="text-base font-semibold">
        <span className="tabular text-ink-muted">{row.owner}</span> · {row.key}
      </h3>
      <p className="mt-1 text-sm text-ink-secondary">
        In force now: <span className="tabular">{row.value}</span> from {row.effective_from}
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          New value
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
            }}
            className="w-40 rounded border border-line bg-base px-2 py-1 text-sm text-ink tabular"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Effective from
          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value)
            }}
            className="rounded border border-line bg-base px-2 py-1 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Notification reference - optional; makes this citable in a notice
          <input
            type="text"
            value={ref}
            placeholder="Notification 26/2022-CT dated 26.12.2022"
            onChange={(event) => {
              setRef(event.target.value)
            }}
            className="w-80 rounded border border-line bg-base px-2 py-1 text-sm text-ink"
          />
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
        Note
        <input
          type="text"
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
          }}
          className="w-full rounded border border-line bg-base px-2 py-1 text-sm text-ink"
        />
      </label>

      <p className="mt-3 text-xs text-ink-secondary">
        This writes a new row from {from}. The current value is closed the day before, so
        a re-run over an earlier period still applies it.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={value.trim() === '' || save.isPending}
          onClick={() => {
            setError(null)
            save.mutate()
          }}
          className="rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
        >
          Set from {from}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-line px-3 py-1 text-sm text-ink-secondary"
        >
          Cancel
        </button>
      </div>

      {error !== null && <p className="mt-2 text-sm text-status-critical">{error}</p>}
    </aside>
  )
}

function AdoptForm({
  count,
  onDone,
  onCancel,
}: {
  count: number
  onDone: (note: string) => void
  onCancel: () => void
}): JSX.Element {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const adopt = useMutation({
    mutationFn: () => api.adoptParameters(text),
    onSuccess: (result) => {
      onDone(result.note)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  return (
    <aside className="mb-4 rounded border border-line bg-raised p-4">
      <h3 className="text-base font-semibold">
        Adopt {count} working values as departmental values
      </h3>
      <p className="mt-1 text-sm text-ink-secondary">
        The numbers do not change. Each row will record your name and today&rsquo;s date,
        and stop describing itself as unsigned. A threshold already backed by a
        notification is left alone.
      </p>

      <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
        Acknowledgement - recorded in the audit chain
        <input
          type="text"
          value={text}
          placeholder="Adopted for the FY 2025-26 scrutiny cycle"
          onChange={(event) => {
            setText(event.target.value)
          }}
          className="w-full rounded border border-line bg-base px-2 py-1 text-sm text-ink"
        />
      </label>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={text.trim().length < 10 || adopt.isPending}
          onClick={() => {
            setError(null)
            adopt.mutate()
          }}
          className="rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
        >
          Adopt
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-line px-3 py-1 text-sm text-ink-secondary"
        >
          Cancel
        </button>
      </div>

      {error !== null && <p className="mt-2 text-sm text-status-critical">{error}</p>}
    </aside>
  )
}
