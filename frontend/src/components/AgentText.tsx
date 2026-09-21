import type { JSX } from 'react'
import { CHIP_PATTERN } from '../lib/agentText'
import { useProvenance } from '../lib/provenance'

/**
 * An agent's answer, with its calc chips made clickable.
 *
 * Every figure the agent is allowed to quote arrives wrapped as
 * ``[[calc:<hash>]] 1,98,000.00``. That marker is the whole safety mechanism:
 * the fidelity middleware rejects a response containing any number that did
 * not come back from a tool, so a figure without a chip beside it never
 * reaches this component at all.
 *
 * Rendered raw, the marker is 64 characters of hexadecimal noise in the middle
 * of a sentence. Rendered as a handle, it is the same guarantee the rest of
 * the platform makes - click the number, see where it came from - which is
 * exactly the claim that makes an AI-drafted paragraph usable by an officer
 * who has to sign it.
 */
export function AgentText({ text }: { text: string }): JSX.Element {
  const { open } = useProvenance()
  const parts: JSX.Element[] = []

  let cursor = 0
  let match: RegExpExecArray | null
  const CHIP = new RegExp(CHIP_PATTERN, 'g')

  while ((match = CHIP.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(<span key={`t${String(cursor)}`}>{text.slice(cursor, match.index)}</span>)
    }
    const calcId = match[1] ?? ''
    parts.push(
      <button
        key={`c${String(match.index)}`}
        type="button"
        onClick={() => {
          open(calcId)
        }}
        title={`Where did this come from? calc ${calcId.slice(0, 12)}…`}
        className="mr-0.5 inline-flex items-center rounded-sm border border-gold/40 px-1 text-[0.7em] leading-normal text-gold transition-colors hover:bg-gold/10"
      >
        ◉ <span className="sr-only">provenance for the figure that follows</span>
      </button>,
    )
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    parts.push(<span key={`t${String(cursor)}`}>{text.slice(cursor)}</span>)
  }

  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{parts}</p>
}
