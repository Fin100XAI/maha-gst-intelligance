import { useState } from 'react'
import type { JSX } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AgentText } from '../../components/AgentText'
import { countChips } from '../../lib/agentText'
import { StatusChip } from '../../components/StatusChip'
import { ApiError, api } from '../../lib/api'
import type { AgentAnswer } from '../../lib/api'
import { ScreenHeader } from '../../components/ScreenHeader'

/**
 * W7 — Copilot.
 *
 * A read-only conversational surface over results the engine already
 * computed. It cannot run the engine, change a parameter, open a case or
 * issue anything, and it has no tool that performs arithmetic — there is
 * nothing here to misuse.
 *
 * Two states of this screen matter more than the happy path:
 *
 * * **No model configured.** The endpoint answers 501 and this screen says so
 *   plainly. Every figure the agent would quote is already on a screen and
 *   drillable without it, so degrading into a plausible-sounding answer would
 *   be strictly worse than refusing.
 * * **The model invented a figure.** The numeric-fidelity middleware rejects
 *   the whole response, and the officer is shown that it was rejected and
 *   why — not a cleaned-up version of it.
 */
export default function Copilot(): JSX.Element {
  const [question, setQuestion] = useState('')
  const [gstin, setGstin] = useState('')
  const [answer, setAnswer] = useState<AgentAnswer | null>(null)
  const [refusal, setRefusal] = useState<{ code: string; message: string } | null>(null)

  const agents = useQuery({ queryKey: ['agents'], queryFn: () => api.agents() })

  const ask = useMutation({
    mutationFn: () =>
      api.askAgent('copilot', {
        question,
        gstins: gstin.trim() === '' ? [] : [gstin.trim()],
      }),
    onSuccess: (result) => {
      setAnswer(result)
      setRefusal(null)
    },
    onError: (error: Error) => {
      setAnswer(null)
      setRefusal(
        error instanceof ApiError
          ? { code: error.code, message: error.message }
          : { code: 'ERROR', message: error.message },
      )
    },
  })

  return (
    <div className="max-w-4xl">
      <ScreenHeader
        code="W7"
        title="Assistant"
        lead="Asks questions of results the platform has already computed, and drafts text. It
          cannot do arithmetic: every figure it shows you was produced by the rules, and a
          draft whose numbers do not match the demand exactly is refused rather than corrected."
      />

      <section className="mb-5 rounded border border-line p-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          About (GSTIN, optional)
          <input
            type="text"
            value={gstin}
            onChange={(event) => {
              setGstin(event.target.value.toUpperCase())
            }}
            placeholder="27AABCT2345L1Z7"
            className="w-64 rounded border border-line bg-raised px-2 py-1 text-sm text-ink tabular"
          />
        </label>

        <label className="mt-3 flex flex-col gap-1 text-xs text-ink-muted">
          Question
          <textarea
            value={question}
            rows={3}
            onChange={(event) => {
              setQuestion(event.target.value)
            }}
            className="rounded border border-line bg-raised p-2 text-sm text-ink"
            placeholder="What was found for this taxpayer, and which rules could not be evaluated?"
          />
        </label>

        <button
          type="button"
          disabled={question.trim().length < 3 || ask.isPending}
          onClick={() => {
            ask.mutate()
          }}
          className="mt-3 rounded border border-line px-3 py-1 text-sm disabled:opacity-40"
        >
          {ask.isPending ? 'Asking…' : 'Ask'}
        </button>
      </section>

      {refusal !== null && <Refusal refusal={refusal} />}

      {answer !== null && (
        <section className="mb-5 rounded border border-line p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <StatusChip level="warning" label={answer.badge} />
            <span className="text-xs text-ink-muted tabular">
              {answer.model} · {answer.tokens} tokens · {answer.latency_ms} ms
            </span>
          </div>

          <AgentText text={answer.text} />

          <div className="mt-3 border-t border-line pt-2 text-xs text-ink-muted">
            {countChips(answer.text)} figure(s) in this answer carry a provenance handle
            &mdash; click one to see the rule, the formula and the source rows. All{' '}
            {answer.fidelity.checked} number(s) were checked against the engine&rsquo;s own
            results
            {answer.fidelity.calc_ids.length > 0 &&
              `, carrying ${String(answer.fidelity.calc_ids.length)} calc handle(s)`}
            . A figure the model could not have been given would have failed the response.
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">What holds this in place</h2>
        {agents.data === undefined ? (
          <p className="text-sm text-ink-secondary">Loading…</p>
        ) : (
          <>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {agents.data.guarantees.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-semibold">
              What this agent is allowed to read
            </h3>
            <ul className="mt-1 space-y-1 text-sm">
              {(agents.data.items.find((item) => item.key === 'copilot')?.tools ?? []).map(
                (tool) => (
                  <li key={tool.name}>
                    <span className="tabular text-ink-muted">{tool.name}</span> —{' '}
                    {tool.description}
                  </li>
                ),
              )}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}

function Refusal({ refusal }: { refusal: { code: string; message: string } }): JSX.Element {
  if (refusal.code === 'NO_MODEL_CONFIGURED' || refusal.code === 'HTTP_501') {
    return (
      <section className="mb-5 rounded border border-status-unknown/40 bg-sunken p-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-base font-semibold">No model is configured</h2>
          <StatusChip level="unknown" label="Not available" />
        </div>
        <p className="text-sm text-ink-secondary">
          The agent layer is optional by design. Every figure this would quote is already
          computed and drillable without a model — the taxpayer file, the worklist and the
          provenance drawer all work with no model at all.
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          Answering anyway, from a model that was never asked, would be worse than saying
          nothing.
        </p>
      </section>
    )
  }

  if (refusal.code === 'NUMERIC_FIDELITY_FAILED') {
    return (
      <section className="mb-5 rounded border border-status-critical/50 bg-sunken p-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-base font-semibold text-status-critical">Response rejected</h2>
          <StatusChip level="critical" label="Invented a figure" />
        </div>
        <p className="text-sm">{refusal.message}</p>
        <p className="mt-2 text-sm text-ink-secondary">
          The attempt is in the agent log. Nothing from that answer is shown here, because
          a figure that cannot be traced is a figure nobody should read.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-5 rounded border border-status-critical/50 bg-sunken p-4">
      <h2 className="mb-1 text-base font-semibold text-status-critical">{refusal.code}</h2>
      <p className="text-sm">{refusal.message}</p>
    </section>
  )
}
