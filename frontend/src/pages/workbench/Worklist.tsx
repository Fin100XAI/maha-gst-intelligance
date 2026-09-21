import { useState } from 'react'
import type { JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Money } from '../../components/Money'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { WorklistRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * W1 - Worklist.
 *
 * What this officer should look at next, ordered by what can be acted on
 * rather than by what is most alarming. An ADVISORY finding cannot support a
 * notice however severe it is, so it sits below everything that can be taken
 * forward today - and says so on its face.
 *
 * Every disposition needs a reason. Not because a form demands it, but
 * because M-Q01 rule precision is computed from these notes next cycle, and
 * an officer who rejected a finding six months ago cannot reconstruct why.
 */
export default function Worklist(): JSX.Element {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [includeAdvisory, setIncludeAdvisory] = useState(true)
  const [undisposedOnly, setUndisposedOnly] = useState(true)
  const [open, setOpen] = useState<string | null>(null)

  const query = new URLSearchParams({
    size: '50',
    include_advisory: includeAdvisory ? 'true' : 'false',
    undisposed_only: undisposedOnly ? 'true' : 'false',
  })

  const worklist = useQuery({
    queryKey: ['worklist', query.toString()],
    queryFn: () => api.worklist(`?${query.toString()}`),
  })

  const refresh = (): void => {
    void client.invalidateQueries({ queryKey: ['worklist'] })
    setOpen(null)
  }

  if (worklist.isError) {
    return (
      <p className="text-status-critical">
        The worklist could not be loaded. There may be no engine run yet.
      </p>
    )
  }
  const data = worklist.data

  return (
    <div className="w-full">
      <ScreenHeader
        code="W1"
        title="My work"
        lead="Everything waiting on you, with the items you can actually act on first. Something
          running out of time outranks something merely serious, because once the deadline
          passes the money is gone whatever the evidence shows."
        meta={data === undefined ? 'Loading…' : `${String(data.total)} open · ${data.scope}`}
      />

      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeAdvisory}
            onChange={(event) => {
              setIncludeAdvisory(event.target.checked)
            }}
          />
          Include advisory
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={undisposedOnly}
            onChange={(event) => {
              setUndisposedOnly(event.target.checked)
            }}
          />
          Undecided only
        </label>
      </div>

      {data !== undefined && data.items.length === 0 && (
        <p className="text-ink-secondary">
          Nothing is waiting on you. That is a result, not an empty screen: every
          triggered finding in your jurisdiction has been disposed of.
        </p>
      )}

      <ul className="space-y-2">
        {(data?.items ?? []).map((row) => (
          <Card
            key={row.finding_id}
            row={row}
            isOpen={open === row.finding_id}
            onToggle={() => {
              setOpen((current) => (current === row.finding_id ? null : row.finding_id))
            }}
            onOpenTaxpayer={() => {
              navigate(row.href)
            }}
            onDone={refresh}
          />
        ))}
      </ul>

      <p className="mt-4 text-xs text-ink-muted">{data?.note}</p>
    </div>
  )
}

function Card({
  row,
  isOpen,
  onToggle,
  onOpenTaxpayer,
  onDone,
}: {
  row: WorklistRow
  isOpen: boolean
  onToggle: () => void
  onOpenTaxpayer: () => void
  onDone: () => void
}): JSX.Element {
  return (
    <li
      className={`rounded border p-3 ${
        row.may_populate_notice ? 'border-line' : 'border-line bg-sunken/40'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs text-ink-muted tabular">{row.rule_id}</span>
          <span className="font-medium">{row.title}</span>
          {row.period !== null && (
            <span className="text-xs text-ink-muted tabular">{row.period}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusChip level={severityLevel(row.severity)} label={row.severity} />
          <StatusChip
            level={row.may_populate_notice ? 'good' : 'unknown'}
            label={row.confidence}
            title={
              row.may_populate_notice
                ? 'May populate a notice.'
                : 'Advisory: a worklist item. It may never populate a notice without being promoted expressly.'
            }
          />
        </div>
      </div>

      <button
        type="button"
        className="mt-1 text-sm underline decoration-dotted underline-offset-2"
        onClick={onOpenTaxpayer}
      >
        {row.legal_name}
      </button>
      <span className="ml-2 text-xs text-ink-muted tabular">{row.gstin}</span>

      {row.legal_basis !== null && (
        <p className="mt-1 text-sm text-ink-secondary">{row.legal_basis}</p>
      )}

      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm sm:grid-cols-4">
        {(['igst', 'cgst', 'sgst', 'cess'] as const).map((head) => (
          <div key={head} className="contents">
            <dt className="text-ink-muted uppercase">{head}</dt>
            <dd>
              <Money value={row.delta[head]} calcId={row.calc_id} symbol={false} />
            </dd>
          </div>
        ))}
      </dl>

      {row.disposition !== null && (
        <p className="mt-2 text-sm">
          <span className="text-ink-muted">Disposed: </span>
          {row.disposition}
        </p>
      )}

      <button
        type="button"
        className="mt-2 rounded border border-line px-2 py-1 text-sm text-ink-secondary hover:text-ink"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {isOpen ? 'Close' : 'Decide'}
      </button>

      {isOpen && <DecisionForm row={row} onDone={onDone} />}
    </li>
  )
}

const CHOICES = ['ACCEPTED', 'REJECTED', 'DEFERRED', 'NEEDS_INFO'] as const

function DecisionForm({ row, onDone }: { row: WorklistRow; onDone: () => void }): JSX.Element {
  const [choice, setChoice] = useState<string>('ACCEPTED')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const dispose = useMutation({
    mutationFn: () => api.dispose(row.finding_id, { disposition: choice, note }),
    onSuccess: onDone,
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const promote = useMutation({
    mutationFn: () => api.promote(row.finding_id, { disposition: 'PROMOTED', note }),
    onSuccess: onDone,
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const tooShort = note.trim().length < 10

  return (
    <div className="mt-3 rounded border border-line p-3">
      <div className="flex flex-wrap gap-3">
        {CHOICES.map((value) => (
          <label key={value} className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name={`choice-${row.finding_id}`}
              value={value}
              checked={choice === value}
              onChange={() => {
                setChoice(value)
              }}
            />
            {value.replace('_', ' ').toLowerCase()}
          </label>
        ))}
      </div>

      <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
        Reason - required, and read next cycle when rule precision is computed
        <textarea
          value={note}
          rows={2}
          onChange={(event) => {
            setNote(event.target.value)
          }}
          className="rounded border border-line bg-raised p-2 text-sm text-ink"
          placeholder="What did you check, and what did you conclude?"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={tooShort || dispose.isPending}
          onClick={() => {
            setError(null)
            dispose.mutate()
          }}
          className="rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
        >
          Record decision
        </button>

        {!row.may_populate_notice && (
          <button
            type="button"
            disabled={tooShort || promote.isPending}
            onClick={() => {
              setError(null)
              promote.mutate()
            }}
            className="rounded border border-status-warning px-3 py-1 text-sm text-status-warning disabled:opacity-40"
            title="Makes this advisory finding usable in a notice. Audited, with your name and this reason."
          >
            Promote to enforceable
          </button>
        )}

        {tooShort && (
          <span className="text-xs text-ink-muted">A reason of ten characters or more.</span>
        )}
      </div>

      {!row.may_populate_notice && (
        <p className="mt-2 text-xs text-ink-secondary">
          Promotion is recorded in the audit chain with your name, the date and this
          reason. An advisory signal is a reason to look; turning it into evidence is a
          decision you are making.
        </p>
      )}

      {error !== null && <p className="mt-2 text-sm text-status-critical">{error}</p>}
    </div>
  )
}

function severityLevel(severity: string): 'good' | 'warning' | 'serious' | 'critical' {
  if (severity === 'CRITICAL') return 'critical'
  if (severity === 'HIGH') return 'serious'
  if (severity === 'MEDIUM') return 'warning'
  return 'good'
}
