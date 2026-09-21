import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { StatusChip } from '../../components/StatusChip'
import { api } from '../../lib/api'
import type { CaseRow } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * W5 — Cases.
 *
 * Sorted by how little time is left, not by how much money is in them. A case
 * worth ten lakh that becomes time-barred next month outranks a case worth a
 * crore with three years to run, because only one of them stops being
 * recoverable while you read this screen.
 */
export default function Cases(): JSX.Element {
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['cases'], queryFn: () => api.cases() })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading cases…</p>
  if (query.isError || !query.data) {
    return <p className="text-status-critical">Cases could not be loaded.</p>
  }
  const data = query.data

  const ordered = [...data.items].sort((a, b) => {
    const left = a.days_to_limitation ?? Number.MAX_SAFE_INTEGER
    const right = b.days_to_limitation ?? Number.MAX_SAFE_INTEGER
    return left - right
  })

  return (
    <div className="w-full">
      <ScreenHeader
        code="W5"
        title="Cases"
        lead="A case gathers the findings you accept for one business and adds them into a
          demand, head by head. Nothing reaches a notice that is not in a case first."
        meta={`${String(data.count)} in scope · ${data.scope}`}
      />

      <p className="mb-4 text-sm text-ink-secondary">{data.note}</p>

      {ordered.length === 0 ? (
        <p className="text-ink-secondary">
          No case has been opened in your jurisdiction. Open one from a taxpayer file.
        </p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((row) => (
            <Card
              key={row.case_id}
              row={row}
              onOpen={() => {
                navigate(`/workbench/taxpayer/${row.gstin}`)
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function Card({ row, onOpen }: { row: CaseRow; onOpen: () => void }): JSX.Element {
  const clock = limitationState(row.days_to_limitation)

  return (
    <li className="panel p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <button
            type="button"
            className="font-medium underline decoration-dotted underline-offset-2"
            onClick={onOpen}
          >
            {row.legal_name ?? row.gstin}
          </button>
          <span className="text-xs text-ink-muted tabular">{row.gstin}</span>
          {row.division !== null && (
            <span className="text-xs text-ink-muted">{row.division}</span>
          )}
        </div>
        <StatusChip level={clock.level} label={clock.label} title={clock.title} />
      </div>

      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Pair label="FY" value={row.fy} />
        <Pair label="Type" value={row.type} />
        <Pair label="Status" value={row.status} />
        <Pair label="Findings" value={String(row.finding_count)} />
        <Pair label="Section" value={row.section_applied ?? '—'} />
        <Pair label="SCN by" value={row.scn_deadline ?? '—'} />
        <Pair label="Order by" value={row.order_deadline ?? '—'} />
      </dl>

      {row.notices.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs uppercase tracking-wide text-ink-muted">Notices</h4>
          <ul className="mt-1 flex flex-wrap gap-2 text-xs">
            {row.notices.map((notice) => (
              <li key={notice.notice_id} className="rounded border border-line px-2 py-0.5">
                {notice.form} · {notice.status}
                {notice.din !== null && <span className="ml-1 tabular">{notice.din}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

function Pair({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <dt className="inline text-ink-muted">{label}: </dt>
      <dd className="inline tabular">{value}</dd>
    </div>
  )
}

/** The limitation clock, as a status rather than a number to interpret. */
function limitationState(days: number | null): {
  level: 'good' | 'warning' | 'serious' | 'critical' | 'unknown'
  label: string
  title: string
} {
  if (days === null) {
    return {
      level: 'unknown',
      label: 'Clock not computed',
      title: 'The limitation clock has not been computed for this case.',
    }
  }
  if (days < 0) {
    return {
      level: 'critical',
      label: 'Time-barred',
      title: 'The order deadline has passed. This can no longer be adjudicated.',
    }
  }
  if (days <= 90) {
    return {
      level: 'critical',
      label: `${String(days)} days left`,
      title: 'Under 90 days to the order deadline.',
    }
  }
  if (days <= 180) {
    return {
      level: 'serious',
      label: `${String(days)} days left`,
      title: 'Under 180 days to the order deadline.',
    }
  }
  return { level: 'good', label: `${String(days)} days left`, title: 'Within time.' }
}
