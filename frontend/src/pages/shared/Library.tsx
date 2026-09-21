import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * S2 — Rule & Parameter Library.
 *
 * The law officer's screen. For every rule: what it tests, under which
 * provision, and which of its thresholds are **provisional** — a working value
 * that nobody has signed.
 *
 * The provisional column is the point of the screen. Every finding computed
 * from an unsigned threshold is valid arithmetic on an assumption, and the
 * department needs a list of those assumptions before it relies on them in a
 * notice, not after.
 */
type Tab = 'rules' | 'parameters' | 'thresholds'

export default function Library(): JSX.Element {
  const [tab, setTab] = useState<Tab>('rules')

  return (
    <div className="w-full">
      <ScreenHeader
        code="S2"
        title="Rules and risk flags"
        lead="Every test the platform runs: what it compares, under which provision, and which
          number it compares against. If you want to know why something was flagged, the answer
          is here in full."
      />

      <nav className="mb-4 flex gap-1 border-b border-line">
        {(['rules', 'parameters', 'thresholds'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key)
            }}
            aria-current={tab === key ? 'page' : undefined}
            className={`border-b-2 px-3 py-2 text-sm capitalize ${
              tab === key
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-ink-secondary hover:text-ink'
            }`}
          >
            {key}
          </button>
        ))}
      </nav>

      {tab === 'rules' && <Rules />}
      {tab === 'parameters' && <Parameters />}
      {tab === 'thresholds' && <Thresholds />}
    </div>
  )
}

function Rules(): JSX.Element {
  const query = useQuery({ queryKey: ['library', 'rules'], queryFn: () => api.libraryRules() })
  const [family, setFamily] = useState<string>('')

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading rules…</p>
  if (query.isError || !query.data) return <Unavailable />
  const data = query.data
  const rows = family === '' ? data.items : data.items.filter((row) => row.family === family)

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm text-ink-secondary tabular">{data.count} rules</p>
        <select
          className="rounded border border-line bg-raised px-2 py-1 text-sm"
          value={family}
          onChange={(event) => {
            setFamily(event.target.value)
          }}
          aria-label="Filter by family"
        >
          <option value="">All families</option>
          {data.families.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {rows.map((rule) => (
          <li key={rule.rule_id} className="panel p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-ink-muted tabular">{rule.rule_id}</span>
                <span className="font-medium">{rule.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">{rule.dimension}</span>
                <StatusChip level={severityLevel(rule.severity)} label={rule.severity} />
              </div>
            </div>

            <p className="mt-1 text-sm text-ink-secondary">{rule.legal_basis}</p>

            {rule.threshold_note !== null && (
              <p className="mt-1 text-sm">
                <span className="text-ink-muted">Threshold: </span>
                {rule.threshold_note}
              </p>
            )}

            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
              {rule.requires.length > 0 && (
                <div>
                  <dt className="inline">Needs: </dt>
                  <dd className="inline">{rule.requires.join(', ')}</dd>
                </div>
              )}
              {rule.parameters.length > 0 && (
                <div>
                  <dt className="inline">Parameters: </dt>
                  <dd className="inline">{rule.parameters.join(', ')}</dd>
                </div>
              )}
              {rule.suggested_form !== null && (
                <div>
                  <dt className="inline">Action: </dt>
                  <dd className="inline">{rule.suggested_form}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Parameters(): JSX.Element {
  const query = useQuery({
    queryKey: ['library', 'parameters'],
    queryFn: () => api.libraryParameters(),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading parameters…</p>
  if (query.isError || !query.data) return <Unavailable />
  const data = query.data

  return (
    <section>
      <p className="mb-3 text-sm text-ink-secondary">{data.note}</p>
      <ul className="space-y-2">
        {data.items.map((param) => (
          <li
            key={param.param_id}
            className={`rounded border p-3 ${
              param.excluded_from_score ? 'border-line bg-sunken/40' : 'border-line'
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-ink-muted tabular">{param.param_id}</span>
                <span className="font-medium">{param.title}</span>
              </div>
              {param.excluded_from_score && (
                <StatusChip
                  level="unknown"
                  label="Awaiting a feed"
                  title="Excluded from both sides of the P-Score."
                />
              )}
            </div>

            <p className="mt-1 text-sm text-ink-secondary">{param.metric_description}</p>
            <p className="mt-1 text-sm">
              <span className="text-ink-muted">Action point: </span>
              {param.action_point}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {param.banding} · {param.direction} · weight {param.weight}
              {param.external_feed !== null && <> · needs {param.external_feed}</>}
              {param.roadmap_ref !== null && <> · {param.roadmap_ref}</>}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Thresholds(): JSX.Element {
  const query = useQuery({
    queryKey: ['library', 'thresholds'],
    queryFn: () => api.libraryThresholds(),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading thresholds…</p>
  if (query.isError || !query.data) return <Unavailable />
  const data = query.data

  return (
    <section>
      <div className="mb-3 rounded border border-status-warning/40 bg-sunken p-3">
        <p className="text-sm">{data.note}</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-muted">
            <th className="py-1 text-left">Owner</th>
            <th className="py-1 text-left">Key</th>
            <th className="py-1 text-right">Value</th>
            <th className="py-1 text-left">Effective from</th>
            <th className="py-1 text-left">Notification</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((row) => (
            <tr key={`${row.owner}.${row.key}`} className="border-b border-line">
              <td className="py-1 tabular">{row.owner}</td>
              <td className="py-1">{row.key}</td>
              <td className="py-1 text-right tabular">
                {row.value}
                {row.unit !== null && <span className="ml-1 text-ink-muted">{row.unit}</span>}
              </td>
              <td className="py-1 tabular">{row.effective_from ?? '—'}</td>
              <td className="py-1">
                {row.notification_ref ?? (
                  <StatusChip
                    level="warning"
                    label="Provisional"
                    title={row.note ?? 'Awaiting the law officer.'}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function severityLevel(severity: string): 'good' | 'warning' | 'serious' | 'critical' {
  if (severity === 'CRITICAL') return 'critical'
  if (severity === 'HIGH') return 'serious'
  if (severity === 'MEDIUM') return 'warning'
  return 'good'
}

function Unavailable(): JSX.Element {
  return <p className="text-status-critical">The library could not be loaded.</p>
}
