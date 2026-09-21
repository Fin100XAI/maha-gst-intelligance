import type { JSX } from 'react'
import { Explain } from './Explain'
import { StatusChip } from './StatusChip'
import { cn } from '../lib/utils'

/**
 * A score, said in words before it is said as a number.
 *
 * "P-Score 0.6470588235" is not information. It is a number an officer has to
 * be trained to read, and the training is the thing nobody has time for. Three
 * changes make it legible:
 *
 * 1. **The plain sentence comes first**, in the size that gets read: "Worth a
 *    closer look". The figure sits underneath, smaller, where somebody who
 *    wants it can find it.
 * 2. **The figure is rounded to two places for display.** Ten decimal places
 *    implies a precision the underlying data does not have, and a reader who
 *    sees ten will assume the tenth means something.
 * 3. **The coverage is inseparable from the P-Score.** It is not a footnote or
 *    a second tile: it is in the same component, because "0.65 over 3 of 34
 *    flags" and "0.65 over 34 of 34" are different claims and an officer must
 *    not have to remember to go and check which one they are reading.
 *
 * The scores are never combined and never shown on one axis. They answer
 * different questions: one is who to examine, the other is what can be
 * demanded.
 */
export type ScoreKind = 'P' | 'F'

/** What a P-Score band means, in words an officer can act on. */
const P_MEANING: { at: number; label: string; level: Level; what: string }[] = [
  { at: 0.75, label: 'Examine first', level: 'critical', what: 'Several flags are seriously adverse.' },
  { at: 0.5, label: 'Worth a closer look', level: 'serious', what: 'Enough flags are adverse to justify an audit.' },
  { at: 0.25, label: 'Some concerns', level: 'warning', what: 'A few flags are out of line with comparable businesses.' },
  { at: 0, label: 'Nothing adverse found', level: 'good', what: 'The flags that could be tested came back clear.' },
]

/** What an F-Score band means. This side is money, so it says money. */
const F_MEANING: { at: number; label: string; level: Level; what: string }[] = [
  { at: 0.75, label: 'Large amounts at stake', level: 'critical', what: 'The returns themselves show a substantial shortfall.' },
  { at: 0.5, label: 'Substantial', level: 'serious', what: 'A material difference between what was declared and what was paid.' },
  { at: 0.25, label: 'Small amounts', level: 'warning', what: 'A difference worth raising, but a modest one.' },
  { at: 0, label: 'Nothing found', level: 'good', what: 'No rule found a difference in the returns held.' },
]

type Level = 'good' | 'warning' | 'serious' | 'critical'

export function ScoreMeter({
  kind,
  score,
  evaluated,
  total,
  calcId,
  onOpenCalc,
  className,
}: {
  kind: ScoreKind
  /** The wire string. `null` when no score was recorded. */
  score: string | null
  /** P only: how many of the 34 flags could be tested. */
  evaluated?: number | undefined
  total?: number | undefined
  calcId?: string | null | undefined
  onOpenCalc?: ((calcId: string) => void) | undefined
  className?: string | undefined
}): JSX.Element {
  const question = kind === 'P' ? 'Should we examine this business?' : 'What could we demand?'
  const name = kind === 'P' ? 'P-Score' : 'F-Score'
  const term = kind === 'P' ? 'pScore' : 'fScore'

  if (score === null) {
    return (
      <div className={cn('panel p-4', className)}>
        <Header question={question} name={name} term={term} />
        <p className="mt-2 text-sm text-ink-secondary">
          No score was recorded for this business in this run.
        </p>
      </div>
    )
  }

  // The scores arrive on a 0-100 scale in some responses and 0-1 in others;
  // normalise for the band lookup rather than guessing at the call site.
  const raw = Number(score)
  const fraction = Number.isFinite(raw) ? (raw > 1 ? raw / 100 : raw) : 0
  const bands = kind === 'P' ? P_MEANING : F_MEANING
  const band = bands.find((entry) => fraction >= entry.at) ?? bands[bands.length - 1]
  const percent = Math.round(fraction * 100)
  const thin = kind === 'P' && evaluated !== undefined && total !== undefined && evaluated < total

  return (
    <div className={cn('panel p-4', className)}>
      <Header question={question} name={name} term={term} />

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-display text-2xl font-semibold leading-tight">{band?.label}</p>
        <StatusChip level={band?.level ?? 'unknown'} label={`${String(percent)} of 100`} />
      </div>
      <p className="mt-1 text-sm text-ink-secondary">{band?.what}</p>

      {/* The bar is the band, not a precision claim: four segments, the one
          this score falls in filled. A continuous bar invites a reader to
          compare two scores by eye that are not that comparable. */}
      <div className="mt-3 flex gap-1" role="img" aria-label={`${band?.label ?? ''}, ${String(percent)} of 100`}>
        {bands
          .slice()
          .reverse()
          .map((entry) => (
            <span
              key={entry.label}
              className={cn(
                'h-1.5 flex-1 rounded-sm',
                fraction >= entry.at ? LEVEL_BG[entry.level] : 'bg-sunken',
              )}
            />
          ))}
      </div>

      {kind === 'P' && evaluated !== undefined && total !== undefined && (
        <p
          className={cn(
            'mt-3 rounded p-2 text-xs',
            thin ? 'bg-sunken text-ink-secondary' : 'text-ink-muted',
          )}
        >
          <strong className="tabular">
            {evaluated} of {total}
          </strong>{' '}
          risk flags could be tested.
          {thin && (
            <>
              {' '}
              The rest are left out of the score entirely rather than counted as clear, so read
              this as a judgement on {evaluated} tests, not on 34.
            </>
          )}
        </p>
      )}

      <p className="mt-2 text-xs text-ink-muted">
        Exact value{' '}
        {calcId !== undefined && calcId !== null && onOpenCalc !== undefined ? (
          <button
            type="button"
            onClick={() => {
              onOpenCalc(calcId)
            }}
            className="tabular underline decoration-dotted underline-offset-2"
          >
            {score}
          </button>
        ) : (
          <span className="tabular">{score}</span>
        )}
      </p>
    </div>
  )
}

function Header({
  question,
  name,
  term,
}: {
  question: string
  name: string
  term: 'pScore' | 'fScore'
}): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h3 className="flex items-baseline text-sm font-semibold">
        {question}
        <Explain term={term} />
      </h3>
      <span className="eyebrow text-[10px]">{name}</span>
    </div>
  )
}

const LEVEL_BG: Record<Level, string> = {
  good: 'bg-status-good',
  warning: 'bg-status-warning',
  serious: 'bg-status-serious',
  critical: 'bg-status-critical',
}

/**
 * The flag ladder for one of the 34 risk parameters, as a small chip.
 *
 * A bare "3" means nothing. "Flag 3 of 4" with its colour and its word is
 * readable without training, which is the entire point.
 */
export function FlagChip({ flag }: { flag: number | null }): JSX.Element {
  if (flag === null) {
    return <StatusChip level="unknown" label="Not evaluated" />
  }
  const level: Level = flag === 0 ? 'good' : flag <= 2 ? 'warning' : flag === 3 ? 'serious' : 'critical'
  const word =
    flag === 0
      ? 'Clear'
      : flag === 1
        ? 'Slight'
        : flag === 2
          ? 'Clear concern'
          : flag === 3
            ? 'Serious'
            : 'Severe'
  return <StatusChip level={level} label={`Flag ${String(flag)} · ${word}`} />
}
