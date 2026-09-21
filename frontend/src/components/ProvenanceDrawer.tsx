import { useEffect } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CalcTrace } from '../lib/api'

/**
 * The provenance drawer.
 *
 * Rule or parameter, legal basis, the formula as written, the formula as
 * executed, every intermediate term, every parameter with its effective date
 * and notification reference, and the source rows with their original cell
 * values.
 *
 * **This drawer is the product. Everything else is navigation to it.**
 *
 * Every value rendered here is escaped by React. Nothing from a trace is ever
 * interpolated as markup: an uploaded spreadsheet is adversarial input.
 */
export function ProvenanceDrawer({
  calcId,
  onClose,
}: {
  calcId: string | null
  onClose: () => void
}): JSX.Element | null {
  const query = useQuery({
    queryKey: ['calc', calcId],
    queryFn: () => api.calc(calcId as string),
    enabled: calcId !== null,
  })

  useEffect(() => {
    if (calcId === null) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [calcId, onClose])

  if (calcId === null) return null

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/30"
      role="presentation"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Provenance"
        className="h-full w-full max-w-2xl overflow-y-auto border-l border-line bg-raised p-6 shadow-xl"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">Where this figure came from</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-2 py-1 text-sm text-ink-secondary hover:text-ink"
          >
            Close
          </button>
        </div>

        {query.isLoading && <p className="text-sm text-ink-secondary">Resolving…</p>}
        {query.isError && (
          <p className="text-sm text-status-critical">
            That calc_id does not resolve. A figure without provenance is a bug — please
            report it.
          </p>
        )}
        {query.data && <TraceBody trace={query.data} />}
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <>
      <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mb-3 text-sm">{children}</dd>
    </>
  )
}

function TraceBody({ trace }: { trace: CalcTrace }): JSX.Element {
  return (
    <div>
      <div className="mb-4 border-b border-line pb-3 text-xs text-ink-muted tabular">
        {trace.subject_id} · calc_id {trace.calc_id.slice(0, 12)}… · engine{' '}
        {trace.engine_version} · params {trace.params_version}
      </div>

      <dl>
        {trace.legal_basis !== null && <Row label="Legal basis">{trace.legal_basis}</Row>}
        {trace.formula_template !== null && (
          <Row label="Formula">
            <code className="block whitespace-pre-wrap rounded bg-sunken p-2 text-xs">
              {trace.formula_template}
            </code>
          </Row>
        )}
        {trace.formula_rendered !== null && (
          <Row label="As executed">
            <code className="block whitespace-pre-wrap rounded bg-sunken p-2 text-xs tabular">
              {trace.formula_rendered}
            </code>
          </Row>
        )}
      </dl>

      {trace.steps.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Steps</h3>
          <ol className="space-y-2">
            {trace.steps.map((step, index) => (
              <li key={`${step.label}-${String(index)}`} className="rounded border border-line p-2">
                <div className="text-sm font-medium">
                  <span className="mr-2 text-ink-muted tabular">{index + 1}</span>
                  {step.label}
                </div>
                <div className="mt-0.5 text-xs text-ink-secondary">{step.expression}</div>
                <div className="mt-1 text-sm tabular">{renderValue(step.result)}</div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {trace.parameters.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">
            Parameters in force
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-muted">
                <th className="py-1">Parameter</th>
                <th>Value</th>
                <th>Effective from</th>
                <th>Notification</th>
              </tr>
            </thead>
            <tbody>
              {trace.parameters.map((parameter) => (
                <tr
                  key={`${parameter.parameter_id}.${parameter.key}`}
                  className="border-b border-line"
                >
                  <td className="py-1">
                    {parameter.parameter_id}.{parameter.key}
                  </td>
                  <td className="tabular">{parameter.value}</td>
                  <td className="tabular">{parameter.effective_from ?? '—'}</td>
                  <td className="text-ink-secondary">
                    {parameter.notification_ref ?? (
                      <span className="text-status-warning">
                        ◯ provisional — awaiting the law officer
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Sources</h3>
        {trace.sources.length === 0 && (
          <p className="text-sm text-ink-muted">
            This computation reads no transaction rows directly.
          </p>
        )}
        <ul className="space-y-2">
          {trace.sources.slice(0, 20).map((source) => (
            <li key={source.id} className="rounded border border-line p-2 text-sm">
              {source.resolved ? (
                <>
                  <div className="font-medium">
                    {source.file_name} → &ldquo;{source.sheet_name}&rdquo; → row{' '}
                    <span className="tabular">{String(source.row_index)}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted tabular">
                    sha256 {source.file_sha256?.slice(0, 16)}…
                  </div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
                    {Object.entries(source.original_cells ?? {})
                      .filter(([, value]) => value !== null && value !== '')
                      .slice(0, 10)
                      .map(([column, value]) => (
                        <div key={column} className="contents">
                          <dt className="text-ink-muted">{column}</dt>
                          <dd className="tabular">{value}</dd>
                        </div>
                      ))}
                  </dl>
                </>
              ) : (
                <span className="text-ink-muted">
                  {source.id.slice(0, 16)}… — {source.reason ?? 'not resolvable here'}
                </span>
              )}
            </li>
          ))}
        </ul>
        {trace.sources.length > 20 && (
          <p className="mt-2 text-xs text-ink-muted tabular">
            …and {trace.sources.length - 20} more rows.
          </p>
        )}
      </section>
    </div>
  )
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== '0.00' && v !== 0)
      .map(([k, v]) => `${k.toUpperCase()} ${stringify(v)}`)
    return entries.length > 0 ? entries.join(' · ') : 'nil'
  }
  return stringify(value)
}

/** A trace value is untrusted JSON; render it without ever producing
 *  "[object Object]" on an officer's screen. */
function stringify(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}
