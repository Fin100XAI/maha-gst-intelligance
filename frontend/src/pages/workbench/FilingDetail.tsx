import { useState } from 'react'
import type { JSX } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, MessageSquare } from 'lucide-react'
import { Explain } from '../../components/Explain'
import { Money } from '../../components/Money'
import { Money as MoneyValue } from '../../lib/money'
import { FlagChip } from '../../components/ScoreMeter'
import { StatusChip } from '../../components/StatusChip'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardTitle } from '../../components/ui/card'
import { api } from '../../lib/api'
import { useProvenance } from '../../lib/provenance'
import { cn } from '../../lib/utils'
import { DISPOSITION_LABEL, dispositionLevel, severityLevel } from '../../lib/findings'
import type { FilingFlag, FilingRule } from '../../lib/api'

/**
 * W8 detail - one filing, against everything the platform knows.
 *
 * Four sections, and the third is the one usually missing from a screen like
 * this: the rules that did **not** fire, and why. An officer asked two years
 * later to justify not pursuing something needs exactly the same evidence as
 * one asked to justify pursuing it, and the second is the harder question.
 *
 * The risk flags sit at the bottom, and the screen says plainly that they are
 * computed over the financial year rather than this month. A flag is not
 * evidence about July; it is a reason to open July.
 */
export default function FilingDetail(): JSX.Element {
  const { gstin = '', period = '' } = useParams()
  const client = useQueryClient()
  const { open } = useProvenance()

  const query = useQuery({
    queryKey: ['filing', gstin, period],
    queryFn: () => api.filingAnalysis(gstin, period),
  })

  if (query.isLoading) return <p className="text-sm text-ink-secondary">Loading…</p>
  if (query.isError || query.data === undefined) {
    return (
      <Card className="max-w-2xl">
        <CardTitle>Not available</CardTitle>
        <p className="mt-2 text-sm text-ink-secondary">
          No such filing in your jurisdiction, or no engine run has been recorded yet.
        </p>
        <Button asChild className="mt-3">
          <Link to="/workbench/filings">Back to filings</Link>
        </Button>
      </Card>
    )
  }
  const data = query.data
  const s = data.summary

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/workbench/filings">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All filings
          </Link>
        </Button>
        {/* This month against the year it sits in. A single period read on
            its own is how a seasonal business gets a notice. */}
        <Button asChild variant="ghost" size="sm">
          <Link to={`/workbench/insights/${gstin}`}>Shape of the year</Link>
        </Button>
      </div>

      <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <span className="eyebrow">
            W8 &middot; {data.gstin} &middot; {data.division ?? 'no division'}
          </span>
          <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight">
            {data.legal_name}
          </h1>
          <p className="text-sm text-ink-secondary">
            Return for <strong>{data.period_label}</strong>
          </p>
        </div>
        <p className="text-xs text-ink-muted tabular">
          {data.run_id === null ? 'no run' : `run ${data.run_id.slice(0, 8)}`}
          {data.as_of !== null && ` · checked ${data.as_of}`}
        </p>
      </header>

      {/* ------------------------------------------------- the summary strip */}
      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary label="Rules run on this return" value={String(s.rules_run)} />
        <Summary
          label="Something found"
          value={String(s.triggered)}
          tone={s.triggered > 0 ? 'critical' : 'good'}
        />
        <Summary label="Tested, nothing found" value={String(s.cleared)} tone="good" />
        <Summary
          label="Could not be tested"
          value={String(s.not_evaluated)}
          tone={s.not_evaluated > 0 ? 'unknown' : 'good'}
          explain="notEvaluated"
        />
        <Card className="p-3">
          <span className="eyebrow text-[10px]">At stake on this return</span>
          <span className="mt-1 block font-display text-2xl font-semibold leading-none tabular">
            {MoneyValue.maybe(s.at_stake)?.format({ symbol: true }) ?? s.at_stake}
          </span>
          <span className="mt-1 block text-xs text-ink-muted">
            the findings below, added up. Each carries its own working; this total does not,
            which is why it is not rendered as a figure you can drill.
          </span>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {/* --------------------------------------- what the return declared */}
          {data.declared !== null && (
            <Card>
              <CardTitle>What the return itself declares</CardTitle>
              <p className="mt-0.5 text-sm text-ink-secondary">
                GSTR-3B Table 3.1(a), before any rule looks at it.
              </p>
              <CardContent className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-ink-muted">
                      <th className="py-1 text-left">Taxable value</th>
                      <th className="py-1 text-right">IGST</th>
                      <th className="py-1 text-right">CGST</th>
                      <th className="py-1 text-right">SGST</th>
                      <th className="py-1 text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1.5 tabular">{data.declared.t31a.taxable}</td>
                      <td className="py-1.5 text-right tabular">{data.declared.t31a.igst}</td>
                      <td className="py-1.5 text-right tabular">{data.declared.t31a.cgst}</td>
                      <td className="py-1.5 text-right tabular">{data.declared.t31a.sgst}</td>
                      <td className="py-1.5 text-right tabular">{data.declared.t31a.cess}</td>
                    </tr>
                  </tbody>
                </table>
                {data.declared.filing_date !== null && (
                  <p className="mt-2 text-xs text-ink-muted">
                    Filed {data.declared.filing_date}
                    {data.declared.arn !== null && ` · ARN ${data.declared.arn}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ---------------------------------------------- what was found */}
          <RuleList
            title="What the rules found"
            subtitle="Each one compares a declared figure with another. Click a figure for its working."
            rules={data.triggered}
            empty="No rule found a difference in this return."
            onOpenCalc={open}
          />

          {/* ------------------------------------ what could not be tested */}
          {data.not_evaluated.length > 0 && (
            <RuleList
              title="What could not be tested"
              subtitle="Not the same as nothing found. Each names the data it needed."
              rules={data.not_evaluated}
              empty=""
              onOpenCalc={open}
              muted
            />
          )}

          {/* ---------------------------------------- what came back clear */}
          <RuleList
            title="Tested, nothing found"
            subtitle="The evidence for not pursuing something, which is the harder question to answer later."
            rules={data.cleared}
            empty="No rule ran clear on this return."
            onOpenCalc={open}
            muted
            collapsed
          />
        </div>

        {/* ------------------------------------------------------ the aside */}
        <div className="space-y-4">
          <ReviewPanel
            gstin={gstin}
            period={period}
            reviews={data.reviews}
            onSaved={() => {
              void client.invalidateQueries({ queryKey: ['filing', gstin, period] })
              void client.invalidateQueries({ queryKey: ['filings'] })
            }}
          />

          <Card>
            <CardTitle className="flex items-baseline">
              <FileText className="mr-1.5 h-4 w-4 self-center" aria-hidden="true" />
              Raise a notice
            </CardTitle>
            <CardContent className="mt-2">
              <p className="text-sm text-ink-secondary">
                A notice is issued from a case, not from this screen. That is deliberate: the
                figures in a notice are filled from a case&rsquo;s demand build-up, so that no
                number in a statutory document was ever typed by hand.
              </p>
              <ol className="mt-2 space-y-1 text-sm text-ink-secondary">
                <li>1. Open a case for this business.</li>
                <li>2. Accept the findings you are pursuing; the demand adds up head-wise.</li>
                <li>3. Draft the notice. A second officer approves it and the DIN is minted.</li>
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="primary" size="sm">
                  <Link to={`/workbench/cases?gstin=${encodeURIComponent(gstin)}`}>
                    Open a case
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to={`/workbench/taxpayer/${encodeURIComponent(gstin)}`}>
                    Whole-year file
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <FlagPanel flags={data.flags} onOpenCalc={open} />
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">{data.note}</p>
    </div>
  )
}

/* --------------------------------------------------------------- pieces */

function Summary({
  label,
  value,
  tone,
  explain,
}: {
  label: string
  value: string
  tone?: 'good' | 'critical' | 'unknown'
  explain?: 'notEvaluated'
}): JSX.Element {
  return (
    <Card className="p-3">
      <span className="eyebrow flex items-baseline text-[10px]">
        {label}
        {explain !== undefined && <Explain term={explain} />}
      </span>
      <span
        className={cn(
          'mt-1 block font-display text-2xl font-semibold leading-none tabular',
          tone === 'critical' && value !== '0' && 'text-status-critical',
          tone === 'unknown' && value !== '0' && 'text-status-unknown',
        )}
      >
        {value}
      </span>
    </Card>
  )
}

function RuleList({
  title,
  subtitle,
  rules,
  empty,
  onOpenCalc,
  muted = false,
  collapsed = false,
}: {
  title: string
  subtitle: string
  rules: FilingRule[]
  empty: string
  onOpenCalc: (calcId: string) => void
  muted?: boolean
  collapsed?: boolean
}): JSX.Element {
  const [open, setOpen] = useState(!collapsed)
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className={cn(muted && 'text-ink-secondary')}>
            {title} <span className="tabular text-ink-muted">({rules.length})</span>
          </CardTitle>
          <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>
        </div>
        {collapsed && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setOpen((current) => !current)
            }}
            aria-expanded={open}
          >
            {open ? 'Hide' : 'Show'}
          </Button>
        )}
      </div>

      {open && (
        <CardContent className="mt-3">
          {rules.length === 0 ? (
            <p className="text-sm text-ink-secondary">{empty}</p>
          ) : (
            <ul className="space-y-2">
              {rules.map((rule) => (
                <li key={rule.rule_id} className="rounded border border-line p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-xs tabular text-ink-muted">{rule.rule_id}</span>
                      <span className="text-sm font-medium">{rule.title}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {rule.status === 'NOT_EVALUATED' ? (
                        <StatusChip level="unknown" label="Not evaluated" />
                      ) : (
                        <>
                          <StatusChip
                            level={severityLevel(rule.severity)}
                            label={rule.severity}
                          />
                          <span className="text-[11px] text-ink-muted">{rule.confidence}</span>
                        </>
                      )}
                    </span>
                  </div>

                  {rule.legal_basis !== null && (
                    <p className="mt-1 text-xs text-ink-muted">{rule.legal_basis}</p>
                  )}

                  {rule.status === 'NOT_EVALUATED' ? (
                    rule.missing_inputs.length > 0 && (
                      <p className="mt-2 rounded bg-sunken p-2 text-sm text-ink-secondary">
                        Needed: {rule.missing_inputs.join(', ')}
                      </p>
                    )
                  ) : (
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      {(['igst', 'cgst', 'sgst', 'cess'] as const).map((head) => (
                        <div key={head} className="flex items-baseline gap-1.5">
                          <dt className="text-xs uppercase text-ink-muted">{head}</dt>
                          <dd>
                            <Money
                              value={rule.heads[head]}
                              calcId={rule.calc_id}
                              symbol={false}
                            />
                          </dd>
                        </div>
                      ))}
                      <div className="flex items-baseline gap-1.5">
                        <dt className="text-xs uppercase text-ink-muted">total</dt>
                        <dd className="font-medium">
                          <Money value={rule.total} calcId={rule.calc_id} />
                        </dd>
                      </div>
                    </dl>
                  )}

                  {rule.status !== 'NOT_EVALUATED' && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenCalc(rule.calc_id)
                      }}
                      className="mt-2 text-xs text-ink-secondary underline decoration-dotted underline-offset-2 hover:text-ink"
                    >
                      Show the working
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  )
}

/**
 * The 34 risk flags, with the caveat that makes them readable.
 *
 * They are computed over the financial year. Shown on a monthly filing without
 * saying so, a reader would take Flag 4 as a statement about this return.
 */
function FlagPanel({
  flags,
  onOpenCalc,
}: {
  flags: FilingFlag[]
  onOpenCalc: (calcId: string) => void
}): JSX.Element {
  const [showAll, setShowAll] = useState(false)
  const evaluated = flags.filter((flag) => flag.flag !== null)
  const shown = showAll ? flags : evaluated

  return (
    <Card>
      <CardTitle className="flex items-baseline">
        The 34 risk flags
        <Explain term="coverage" />
      </CardTitle>
      <p className="mt-0.5 text-sm text-ink-secondary">
        For the financial year, not this month. They say whether the business is worth
        examining &mdash; not what this return shows.
      </p>
      <p className="mt-1 text-xs text-ink-muted tabular">
        {evaluated.length} of {flags.length} could be tested
      </p>

      <CardContent className="mt-3">
        <ul className="space-y-1">
          {shown.map((flag) => (
            <li
              key={flag.param_id}
              className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-sunken"
            >
              <button
                type="button"
                onClick={() => {
                  onOpenCalc(flag.calc_id)
                }}
                className="text-xs tabular underline decoration-dotted underline-offset-2"
              >
                {flag.param_id}
              </button>
              <FlagChip flag={flag.flag} />
            </li>
          ))}
        </ul>
        {evaluated.length !== flags.length && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 px-0"
            onClick={() => {
              setShowAll((current) => !current)
            }}
          >
            {showAll
              ? 'Hide the ones that could not be tested'
              : `Show all ${String(flags.length)}, including the untested`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * What the officer concluded.
 *
 * "Nothing to do" is a first-class outcome here. A platform that records only
 * the cases somebody opened cannot answer the question an officer is actually
 * asked later, which is why they did not open one.
 */
function ReviewPanel({
  gstin,
  period,
  reviews,
  onSaved,
}: {
  gstin: string
  period: string
  reviews: { id: string; at: string; officer_id: string; comment: string; disposition: string }[]
  onSaved: () => void
}): JSX.Element {
  const [comment, setComment] = useState('')
  const [disposition, setDisposition] = useState('OPEN')
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => api.reviewFiling(gstin, period, { comment, disposition }),
    onSuccess: () => {
      setComment('')
      setError(null)
      onSaved()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  return (
    <Card>
      <CardTitle className="flex items-baseline">
        <MessageSquare className="mr-1.5 h-4 w-4 self-center" aria-hidden="true" />
        What did you decide?
      </CardTitle>
      <p className="mt-0.5 text-sm text-ink-secondary">
        Recorded against this return and this run, and entered in the audit chain.
      </p>

      <CardContent className="mt-3">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Decision
          <select
            value={disposition}
            onChange={(event) => {
              setDisposition(event.target.value)
            }}
            className="rounded border border-line bg-raised px-2 py-1 text-sm text-ink"
          >
            {Object.entries(DISPOSITION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-2 flex flex-col gap-1 text-xs text-ink-muted">
          Note
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
            }}
            placeholder="What you checked, and what you concluded."
            className="rounded border border-line bg-raised p-2 text-sm text-ink"
          />
        </label>

        <Button
          variant="primary"
          size="sm"
          className="mt-2"
          disabled={comment.trim().length < 3 || save.isPending}
          onClick={() => {
            save.mutate()
          }}
        >
          {save.isPending ? 'Saving…' : 'Record it'}
        </Button>

        {error !== null && <p className="mt-2 text-sm text-status-critical">{error}</p>}

        {reviews.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-line pt-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <StatusChip
                    level={dispositionLevel(review.disposition)}
                    label={DISPOSITION_LABEL[review.disposition] ?? review.disposition}
                  />
                  <span className="text-xs text-ink-muted">
                    {review.officer_id} &middot; {review.at.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-secondary">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
