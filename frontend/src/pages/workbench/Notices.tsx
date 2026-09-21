import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { NoticeRow } from '../../lib/api'
import { NeedsRole } from '../../components/NeedsRole'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * W6 — Notices.
 *
 * The register of what has been drafted, approved and served, and the
 * catalogue of forms the platform can produce.
 *
 * Two things on this screen are not cosmetic. The **numeric slots** column
 * states, for each form, exactly which figures are locked — they bind to
 * finding fields and the API rejects an attempt to edit one with 422. And the
 * **preconditions** are shown beside the form rather than discovered at
 * drafting time, because a form that cannot lawfully issue should be obvious
 * before an officer writes the narrative.
 */
export default function Notices(): JSX.Element {
  const [tab, setTab] = useState<'register' | 'forms'>('register')

  return (
    <div className="w-full">
      <ScreenHeader
        code="W6"
        title="Notices"
        lead="Drafting, approval and service. Every figure in a notice is filled from the demand
          rather than typed, one officer drafts and a different officer approves, and the
          identification number is minted at approval and never before."
      />

      <NeedsRole capability="draftNotice" what="draft a notice" />
      <NeedsRole capability="approveNotice" what="approve a notice" />

      <nav className="mb-4 flex gap-1 border-b border-line">
        {(
          [
            ['register', 'Register'],
            ['forms', 'Forms'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key)
            }}
            aria-current={tab === key ? 'page' : undefined}
            className={`border-b-2 px-3 py-2 text-sm ${
              tab === key
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-ink-secondary hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'register' ? <Register /> : <Forms />}
    </div>
  )
}

function Register(): JSX.Element {
  const query = useQuery({ queryKey: ['notices'], queryFn: () => api.notices() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading notices…</p>
  if (query.isError || !query.data) {
    return <p className="text-status-critical">The register could not be loaded.</p>
  }
  const data = query.data

  if (data.items.length === 0) {
    return (
      <p className="text-ink-secondary">
        No notice has been drafted in your jurisdiction ({data.scope}). A notice is drafted
        from a case, and every figure on it comes from that case&rsquo;s demand build-up.
      </p>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-xs text-ink-muted">
          <th className="py-1 text-left">Form</th>
          <th className="py-1 text-left">Taxpayer</th>
          <th className="py-1 text-left">Status</th>
          <th className="py-1 text-left">DIN</th>
          <th className="py-1 text-left">Reply due</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((row) => (
          <tr key={row.notice_id} className="border-b border-line">
            <td className="py-1 tabular">{row.form}</td>
            <td className="py-1 tabular">{row.gstin}</td>
            <td className="py-1">
              <StatusChip level={statusLevel(row)} label={row.status} />
            </td>
            <td className="py-1 tabular">{row.din ?? '—'}</td>
            <td className="py-1 tabular">{row.reply_due ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Forms(): JSX.Element {
  const query = useQuery({
    queryKey: ['notice-templates'],
    queryFn: () => api.noticeTemplates(),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading forms…</p>
  if (query.isError || !query.data) {
    return <p className="text-status-critical">The form catalogue could not be loaded.</p>
  }
  const data = query.data

  return (
    <section>
      <p className="mb-4 rounded border border-line bg-sunken p-3 text-sm">{data.note}</p>

      <ul className="space-y-3">
        {data.items.map((template) => (
          <li
            key={`${template.form}.${template.language}`}
            className="panel p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-ink-muted tabular">{template.form}</span>
                <span className="font-medium">{template.title}</span>
                <span className="text-xs text-ink-muted uppercase">{template.language}</span>
              </div>
              <span className="text-sm text-ink-secondary tabular">
                reply in {template.reply_days} days
              </span>
            </div>

            <p className="mt-1 text-sm text-ink-secondary">{template.legal_basis}</p>

            <h4 className="mt-3 text-xs uppercase tracking-wide text-ink-muted">
              Locked numeric slots
            </h4>
            <ul className="mt-1 flex flex-wrap gap-1.5 text-xs">
              {template.slots.map((slot) => (
                <li key={slot} className="rounded border border-line px-2 py-0.5 tabular">
                  {slot}
                </li>
              ))}
            </ul>

            {template.preconditions.length > 0 && (
              <>
                <h4 className="mt-3 text-xs uppercase tracking-wide text-ink-muted">
                  Before this form may issue
                </h4>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {template.preconditions.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function statusLevel(row: NoticeRow): 'good' | 'warning' | 'serious' | 'unknown' {
  if (row.status === 'SERVED') return 'good'
  if (row.status === 'APPROVED') return 'serious'
  if (row.status === 'DRAFT') return 'warning'
  return 'unknown'
}
