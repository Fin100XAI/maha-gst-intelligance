import { useState } from 'react'
import type { JSX } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import type { FlagRow, TaxpayerFile as TaxpayerFileData } from '../../lib/api'
import { Figure, Money } from '../../components/Money'
import { Money as MoneyValue } from '../../lib/money'
import { StatusChip, levelForFlag } from '../../components/StatusChip'
import { Reconciliation } from '../../components/Reconciliation'
import { useProvenance } from '../../lib/provenance'
import { Explain } from '../../components/Explain'
import { ScoreMeter } from '../../components/ScoreMeter'

/**
 * W4 - the Taxpayer File.
 *
 * The screen an officer works a case from. Three things are deliberate:
 *
 * 1. **All 34 parameters are always shown.** A parameter that could not be
 *    evaluated is greyed, labelled with the feed it waits on, and stated as
 *    excluded from the score - never hidden, and never drawn as Flag 0.
 * 2. **Why a rule did *not* fire is as prominent as why it did.** The findings
 *    list shows CLEAR and NOT_EVALUATED alongside TRIGGERED.
 * 3. **Every figure opens the provenance drawer**, because a figure an officer
 *    cannot trace is a figure they cannot put in a notice.
 */
export default function TaxpayerFile(): JSX.Element {
  const params = useParams<{ gstin?: string }>()
  const [search] = useSearchParams()
  const gstin = params.gstin ?? search.get('gstin') ?? ''

  if (gstin === '') return <PickOne />

  return <FileFor gstin={gstin} />
}

function PickOne(): JSX.Element {
  return (
    <section className="max-w-2xl">
      <h1 className="mb-2 text-xl font-semibold">One business in full</h1>
      <p className="text-ink-secondary">
        Everything the platform knows about a single business: both scores, all 34 risk
        flags, every finding with the money behind it, and the rules that did not fire and
        why. Open one from a chart, from the search screen, or add its GSTIN to the address.
      </p>
    </section>
  )
}

function FileFor({ gstin }: { gstin: string }): JSX.Element {
  const query = useQuery({
    queryKey: ['taxpayer', gstin],
    queryFn: () => api.taxpayerFile(gstin),
  })

  if (query.isLoading) return <p className="text-ink-secondary">Loading the file…</p>
  if (query.isError) {
    return (
      <section className="max-w-2xl">
        <h1 className="mb-2 text-xl font-semibold">Not available</h1>
        <p className="text-status-critical">
          No such taxpayer in your jurisdiction, or no engine run has been recorded yet.
        </p>
      </section>
    )
  }
  const data = query.data as TaxpayerFileData

  return (
    <div className="max-w-6xl space-y-8">
      <Header data={data} />
      <Scores data={data} />
      <FlagLadder rows={data.flag_ladder} />
      <Reconciliation gstin={data.taxpayer.gstin} />
      <Findings data={data} />
    </div>
  )
}

function Header({ data }: { data: TaxpayerFileData }): JSX.Element {
  const { taxpayer } = data
  return (
    <header className="border-b border-line pb-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold">{taxpayer.legal_name}</h1>
        {taxpayer.trade_name !== null && taxpayer.trade_name !== taxpayer.legal_name && (
          <span className="text-ink-secondary">trading as {taxpayer.trade_name}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-secondary tabular">
        {taxpayer.gstin}
        {taxpayer.division !== null && <> · {taxpayer.division}</>}
        {taxpayer.officer_id !== null && <> · {taxpayer.officer_id}</>}
        {taxpayer.aato !== null && (
          <>
            {' · AATO '}
            {MoneyValue.maybe(taxpayer.aato)?.format({ symbol: true }) ?? taxpayer.aato}
            <span className="text-ink-muted"> as registered</span>
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Engine run {data.engine_run_id.slice(0, 12)}… · your scope: {data.scope}
      </p>
    </header>
  )
}

function Scores({ data }: { data: TaxpayerFileData }): JSX.Element {
  const { open } = useProvenance()
  const scores = data.scores
  if (scores === null) {
    return (
      <section>
        <p className="text-ink-secondary">
          No score was recorded for this taxpayer in this run.
        </p>
      </section>
    )
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <ScoreMeter
        kind="P"
        score={scores.p_score}
        evaluated={scores.p_evaluated ?? 0}
        total={scores.p_of}
        calcId={scores.p_calc_id}
        onOpenCalc={open}
      />
      <ScoreMeter
        kind="F"
        score={scores.f_score}
        calcId={scores.f_calc_id}
        onOpenCalc={open}
      />
      <p className="text-xs text-ink-muted sm:col-span-2">{scores.note}</p>
    </section>
  )
}

/** Flag 0 to 4, or an explicit "not evaluated" that is not a zero. */
function FlagLadder({ rows }: { rows: readonly FlagRow[] }): JSX.Element {
  const [showAll, setShowAll] = useState(false)
  const dark = rows.filter((row) => row.flag === null).length
  const visible = showAll ? rows : rows.filter((row) => row.flag !== null && row.flag > 0)

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Risk profile - all 34 parameters</h2>
        <button
          type="button"
          className="rounded border border-line px-2 py-1 text-sm text-ink-secondary hover:text-ink"
          onClick={() => {
            setShowAll((previous) => !previous)
          }}
        >
          {showAll ? 'Show flagged only' : `Show all 34 (${String(dark)} not evaluated)`}
        </button>
      </div>

      {visible.length === 0 && (
        <p className="text-ink-secondary">
          No parameter is flagged above 0 in this run. That is a result, not an absence:{' '}
          <span className="tabular">{String(dark)}</span> parameters could not be evaluated
          and are listed under “Show all”.
        </p>
      )}

      <ul className="space-y-2">
        {visible.map((row) => (
          <LadderRow key={row.param_id} row={row} />
        ))}
      </ul>
    </section>
  )
}

function LadderRow({ row }: { row: FlagRow }): JSX.Element {
  const { open } = useProvenance()
  const notEvaluated = row.flag === null

  return (
    <li
      className={`rounded border p-3 ${
        notEvaluated ? 'border-line bg-sunken/40 opacity-70' : 'border-line'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-ink-muted tabular">{row.param_id}</span>
          <span className="font-medium">{row.title}</span>
        </div>
        {notEvaluated ? (
          <StatusChip
            level="unknown"
            label="Not evaluated"
            title="This parameter could not be tested. It is not a zero."
          />
        ) : (
          <Ladder flag={row.flag ?? 0} />
        )}
      </div>

      {notEvaluated ? (
        <p className="mt-2 text-sm text-ink-secondary">
          Awaiting {row.external_feed ?? (row.missing_inputs.join(', ') || 'an unnamed dataset')}
          {row.roadmap_ref !== null && <> · {row.roadmap_ref}</>}
          {row.excluded_from_score && (
            <>
              {' · '}
              <span className="inline-flex items-baseline">
                excluded from both sides of the P-Score, not scored as zero
                <Explain term="notEvaluated" />
              </span>
            </>
          )}
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            <span className="text-ink-muted">Value </span>
            <Figure value={row.value ?? '-'} calcId={row.calc_id} />
            {row.cohort.n !== null && (
              <span className="ml-2 text-ink-muted tabular">
                cohort p50 {row.cohort.p50 ?? '-'} · p90 {row.cohort.p90 ?? '-'} · n{' '}
                {row.cohort.n}
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">{row.action_point}</p>
          {row.related_rules.length > 0 && (
            <p className="mt-1 text-xs text-ink-muted">
              Related rules: {row.related_rules.join(', ')}
            </p>
          )}
          {row.calc_id !== null && (
            <button
              type="button"
              className="mt-1 text-xs underline"
              onClick={() => {
                open(row.calc_id as string)
              }}
            >
              Where this came from
            </button>
          )}
        </>
      )}
    </li>
  )
}

/** Severity maps onto the reserved palette; nothing invents a sixth colour. */
function levelForSeverity(severity: string): 'good' | 'warning' | 'serious' | 'critical' {
  if (severity === 'CRITICAL') return 'critical'
  if (severity === 'HIGH') return 'serious'
  if (severity === 'MEDIUM') return 'warning'
  return 'good'
}

function Ladder({ flag }: { flag: number }): JSX.Element {
  return (
    <span className="flex items-center gap-1" aria-label={`Flag ${String(flag)} of 4`}>
      {[0, 1, 2, 3, 4].map((step) => (
        <span
          key={step}
          className={`h-3 w-5 rounded-sm border border-line ${
            step <= flag ? 'bg-ink-muted' : 'bg-transparent'
          }`}
        />
      ))}
      <StatusChip level={levelForFlag(flag)} label={`Flag ${String(flag)}`} />
    </span>
  )
}

function Findings({ data }: { data: TaxpayerFileData }): JSX.Element {
  const triggered = data.findings.filter((f) => f.status === 'TRIGGERED')
  const notEvaluated = data.findings.filter((f) => f.status === 'NOT_EVALUATED')
  const clear = data.findings.filter(
    (f) => f.status !== 'TRIGGERED' && f.status !== 'NOT_EVALUATED',
  )

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Findings</h2>

      <ul className="space-y-3">
        {triggered.map((finding) => (
          <li key={finding.id} className="panel p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-ink-muted tabular">{finding.rule_id}</span>
                <span className="font-medium">{finding.title}</span>
                {finding.period !== null && (
                  <span className="text-xs text-ink-muted tabular">{finding.period}</span>
                )}
              </div>
              <StatusChip
                level={levelForSeverity(finding.severity)}
                label={`${finding.severity} · ${finding.confidence}`}
              />
            </div>
            <p className="mt-1 text-sm text-ink-secondary">{finding.legal_basis}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              {(['igst', 'cgst', 'sgst', 'cess'] as const).map((head) => (
                <div key={head} className="contents">
                  <dt className="text-ink-muted uppercase">{head}</dt>
                  <dd>
                    <Money value={finding.delta[head]} calcId={finding.calc_id} symbol={false} />
                  </dd>
                </div>
              ))}
            </dl>
            {finding.suppressed_by !== null && (
              <p className="mt-2 text-sm text-status-warning">
                Suppressed: {finding.suppressed_by}. Visible and labelled, never deleted.
              </p>
            )}
            {finding.suggested_form !== null && finding.suppressed_by === null && (
              <p className="mt-2 text-sm">Suggested action: {finding.suggested_form}</p>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Why these rules did not fire
      </h3>
      <p className="mb-2 text-sm text-ink-secondary">
        As prominent as why one did. A rule that could not run is not a rule that found
        nothing.
      </p>
      <ul className="space-y-1 text-sm">
        {notEvaluated.map((finding) => (
          <li key={finding.id} className="flex flex-wrap items-baseline gap-2">
            <span className="tabular text-ink-muted">{finding.rule_id}</span>
            <StatusChip level="unknown" label="Not evaluated" />
            <span className="text-ink-secondary">
              needs {finding.missing_inputs.join(', ') || 'an unnamed dataset'}
            </span>
          </li>
        ))}
        {clear.map((finding) => (
          <li key={finding.id} className="flex flex-wrap items-baseline gap-2">
            <span className="tabular text-ink-muted">{finding.rule_id}</span>
            <StatusChip level="good" label="Clear" />
            <span className="text-ink-secondary">ran, found nothing to report</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
