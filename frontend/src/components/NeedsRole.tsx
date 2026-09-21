import type { JSX } from 'react'
import { CAPABILITY_LABEL, whoCan } from '../lib/people'
import type { Person } from '../lib/people'
import { useSession } from '../lib/session'

/**
 * "You cannot do this. Here is who can."
 *
 * The alternative - hiding the control - teaches the reader that the feature
 * does not exist, and leaves them with no idea who to take the work to. That
 * is a worse answer than a plain sentence, and it is a particularly bad answer
 * here, because the reason an officer cannot approve their own draft is not an
 * accident of configuration: maker and checker being different people is what
 * keeps a notice defensible.
 *
 * So the control stays on screen, disabled, with the rule stated and the
 * person named. In this demonstration build the switch is one click; in a real
 * deployment it is a conversation, which is exactly as it should be.
 */
export function NeedsRole({
  capability,
  what,
}: {
  capability: keyof Person['can']
  /** What the reader was trying to do, e.g. "change a threshold". */
  what?: string | undefined
}): JSX.Element | null {
  const { person, setPerson } = useSession()
  if (person.can[capability]) return null

  const other = whoCan(capability, person)
  return (
    <div className="mb-3 rounded border border-line bg-sunken p-3">
      <p className="text-sm">
        <strong>{person.name}</strong> ({person.designation}) cannot{' '}
        {what ?? CAPABILITY_LABEL[capability]}.
      </p>
      {other === null ? (
        <p className="mt-1 text-sm text-ink-secondary">
          Nobody signed in to this demonstration can either.
        </p>
      ) : (
        <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm text-ink-secondary">
          <span>
            {other.name}, {other.designation}, can.
          </span>
          <button
            type="button"
            onClick={() => {
              setPerson(other.id)
            }}
            className="rounded border border-line bg-raised px-2 py-0.5 text-xs"
          >
            Sign in as {other.name}
          </button>
        </p>
      )}
    </div>
  )
}
