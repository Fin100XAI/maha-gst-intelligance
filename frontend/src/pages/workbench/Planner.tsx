import { useState } from 'react'
import type { JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Figure } from '../../components/Money'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { CandidateRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * W2 - Audit Planner.
 *
 * Select from the P-Score, filter on an individual parameter flag, and state
 * why. The rationale is required by the API, not merely requested here: P30
 * measures whether last cycle's selections found anything, and it is computed
 * next cycle from exactly these records. A selection with no stated reason
 * makes that parameter permanently unevaluable.
 *
 * Coverage is shown on every candidate and can be used as a filter. A P-Score
 * of 60 computed over thirty parameters and one of 60 computed over three are
 * not the same signal, and selecting on the second without seeing that is how
 * an audit plan ends up built on the parameters that happen to be lit.
 */
const PARAMS = Array.from({ length: 34 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`)

export default function Planner(): JSX.Element {
  const client = useQueryClient()
  const [paramId, setParamId] = useState('')
  const [minFlag, setMinFlag] = useState('1')
  const [minCoverage, setMinCoverage] = useState('')
  const [minScore, setMinScore] = useState('')
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [rationale, setRationale] = useState('')
  const [basis, setBasis] = useState('P_SCORE')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const query = new URLSearchParams({ size: '50' })
  if (paramId !== '') {
    query.set('param_id', paramId)
    query.set('min_flag', minFlag)
  }
  if (minCoverage !== '') query.set('min_coverage', minCoverage)
  if (minScore !== '') query.set('min_p_score', minScore)

  const candidates = useQuery({
    queryKey: ['candidates', query.toString()],
    queryFn: () => api.candidates(`?${query.toString()}`),
  })
  const selections = useQuery({ queryKey: ['selections'], queryFn: () => api.selections() })

  const select = useMutation({
    mutationFn: () =>
      api.select({ gstins: [...chosen], fy: '2025-26', basis, rationale }),
    onSuccess: (result) => {
      setDone(`Recorded ${String(result.count)} selection(s).`)
      setChosen(new Set())
      setRationale('')
      void client.invalidateQueries({ queryKey: ['selections'] })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const toggle = (gstin: string): void => {
    setChosen((current) => {
      const next = new Set(current)
      if (next.has(gstin)) next.delete(gstin)
      else next.add(gstin)
      return next
    })
  }

  const data = candidates.data
  const tooShort = rationale.trim().length < 10

  return (
    <div className="w-full">
      <ScreenHeader
        code="W2"
        title="Who to audit"
        lead="Choosing the year&rsquo;s audits. Sort by risk, by size or by what the flags found,
          and record why each business was picked - the reason is kept with the selection, so
          the choice can be explained a year later."
        meta={data === undefined ? 'Loading…' : `${String(data.total)} candidates`}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Parameter
          <select
            value={paramId}
            onChange={(event) => {
              setParamId(event.target.value)
            }}
            className="rounded border border-line bg-raised px-2 py-1 text-sm"
          >
            <option value="">Any</option>
            {PARAMS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Flag at least
          <select
            value={minFlag}
            disabled={paramId === ''}
            onChange={(event) => {
              setMinFlag(event.target.value)
            }}
            className="rounded border border-line bg-raised px-2 py-1 text-sm disabled:opacity-40"
          >
            {['0', '1', '2', '3', '4'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Coverage at least
          <input
            type="text"
            inputMode="decimal"
            value={minCoverage}
            placeholder="e.g. 0.5"
            onChange={(event) => {
              setMinCoverage(event.target.value)
            }}
            className="w-28 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          P-Score at least
          <input
            type="text"
            inputMode="decimal"
            value={minScore}
            placeholder="e.g. 25"
            onChange={(event) => {
              setMinScore(event.target.value)
            }}
            className="w-28 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          />
        </label>
      </div>

      {paramId !== '' && (
        <p className="mb-3 rounded border border-line bg-sunken p-2 text-xs text-ink-secondary">
          A taxpayer whose {paramId} could not be evaluated is excluded from this filter
          entirely - not read as flag 0. A parameter shown as zero when it was never
          tested is what turns a risk score into a lie.
        </p>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-muted">
            <th className="py-1 text-left">
              <span className="sr-only">Select</span>
            </th>
            <th className="py-1 text-left">Taxpayer</th>
            <th className="py-1 text-left">Division</th>
            <th className="py-1 text-right">P-Score</th>
            <th className="py-1 text-right">Coverage</th>
            <th className="py-1 text-left">Band</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items ?? []).map((row) => (
            <Candidate
              key={row.gstin}
              row={row}
              checked={chosen.has(row.gstin)}
              onToggle={() => {
                toggle(row.gstin)
              }}
            />
          ))}
        </tbody>
      </table>

      {data !== undefined && data.items.length === 0 && (
        <p className="mt-4 text-ink-secondary">
          No taxpayer matches. If you filtered on a parameter, it may be one that could
          not be evaluated for anyone in this run.
        </p>
      )}

      <p className="mt-3 text-xs text-ink-muted">{data?.note}</p>

      <section className="mt-6 rounded border border-line p-4">
        <h2 className="text-base font-semibold">
          Select {chosen.size > 0 ? `${String(chosen.size)} taxpayer(s)` : ''} for audit
        </h2>

        <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
          Basis
          <input
            type="text"
            value={basis}
            onChange={(event) => {
              setBasis(event.target.value)
            }}
            className="w-64 rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
          Rationale - required, and read next cycle when P30 is computed
          <textarea
            value={rationale}
            rows={2}
            onChange={(event) => {
              setRationale(event.target.value)
            }}
            className="rounded border border-line bg-raised p-2 text-sm text-ink"
            placeholder="Why these taxpayers, on what signal?"
          />
        </label>

        <button
          type="button"
          disabled={chosen.size === 0 || tooShort || select.isPending}
          onClick={() => {
            setError(null)
            setDone(null)
            select.mutate()
          }}
          className="mt-3 rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
        >
          Record selection
        </button>

        {error !== null && <p className="mt-2 text-sm text-status-critical">{error}</p>}
        {done !== null && <p className="mt-2 text-sm text-status-good">{done}</p>}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-semibold">Selections made</h2>
        {selections.data === undefined || selections.data.count === 0 ? (
          <p className="text-sm text-ink-secondary">
            None yet. Each one recorded here is what makes P30 computable next cycle.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {selections.data.items.map((row) => (
              <li key={row.selection_id} className="panel p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="tabular text-ink-muted">{row.at.slice(0, 16)}</span>
                  <span className="text-xs text-ink-muted">
                    {row.by} · {row.basis ?? 'no basis'} · {row.count} taxpayer(s)
                  </span>
                </div>
                <p className="mt-1">{row.rationale}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink-muted">{selections.data?.note}</p>
      </section>
    </div>
  )
}

function Candidate({
  row,
  checked,
  onToggle,
}: {
  row: CandidateRow
  checked: boolean
  onToggle: () => void
}): JSX.Element {
  const thin = row.p_evaluated !== null && row.p_evaluated < 10

  return (
    <tr className="border-b border-line">
      <td className="py-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${row.legal_name}`}
        />
      </td>
      <td className="py-1">
        <a className="underline decoration-dotted underline-offset-2" href={row.href}>
          {row.legal_name}
        </a>
        <div className="text-xs text-ink-muted tabular">{row.gstin}</div>
      </td>
      <td className="py-1 text-ink-secondary">{row.division ?? '-'}</td>
      <td className="py-1 text-right">
        {row.p_score === null ? '-' : <Figure value={row.p_score} calcId={row.p_calc_id} />}
      </td>
      <td className="py-1 text-right">
        <span className={thin ? 'tabular text-status-warning' : 'tabular'}>
          {row.p_evaluated === null ? '-' : `${String(row.p_evaluated)}/${String(row.p_of)}`}
        </span>
      </td>
      <td className="py-1">
        {row.p_band === null ? (
          <span className="text-ink-muted">-</span>
        ) : (
          <StatusChip
            level={row.p_band === 'HIGH' ? 'serious' : row.p_band === 'LOW' ? 'good' : 'warning'}
            label={row.p_band}
          />
        )}
      </td>
    </tr>
  )
}
