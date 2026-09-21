import { useEffect, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { GLOSSARY, glossary } from '../lib/glossary'
import type { GlossaryKey } from '../lib/glossary'

/**
 * The ⓘ button: what this word means, without leaving the screen.
 *
 * Two shapes, and the difference matters. `<Explain term="pScore" />` reads the
 * glossary, so the same explanation appears everywhere the term does and is
 * changed in one place. `<Explain title="…">…</Explain>` is for something
 * particular to one screen, which the glossary should not carry.
 *
 * It is a button, not a hover tooltip: hover explanations do not exist on a
 * touchscreen and cannot be reached from a keyboard, and the people who most
 * need the explanation are the ones least likely to discover it by accident.
 */
export function Explain({
  term,
  title,
  children,
  label,
}: {
  /** A glossary key. The explanation comes from `lib/glossary.ts`. */
  term?: GlossaryKey | undefined
  /** A heading, when the explanation is particular to this screen. */
  title?: string | undefined
  /** The explanation, when it is not coming from the glossary. */
  children?: ReactNode
  /** Accessible name, when neither a term nor a title says it well enough. */
  label?: string | undefined
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const entry = term === undefined ? null : glossary(term)
  const heading = title ?? entry?.term ?? label ?? 'What this means'

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onClick = (event: MouseEvent): void => {
      if (box.current !== null && !box.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <span ref={box} className="relative inline-flex align-baseline">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current)
        }}
        aria-expanded={open}
        aria-label={`What does ${heading} mean?`}
        className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line text-[10px] font-semibold leading-none text-ink-muted transition-colors hover:border-ink-secondary hover:text-ink"
      >
        i
      </button>

      {open && (
        <span
          role="dialog"
          aria-label={heading}
          className="glass-strong animate-rise absolute left-0 top-6 z-30 w-80 rounded-lg p-3 text-left"
        >
          <span className="mb-1 block text-sm font-semibold">{heading}</span>
          {entry !== null ? (
            <>
              <span className="block text-sm text-ink-secondary">{entry.short}</span>
              {entry.more !== undefined && (
                <span className="mt-2 block text-sm text-ink-secondary">{entry.more}</span>
              )}
              {entry.also !== undefined && entry.also.length > 0 && (
                <span className="mt-2 block text-xs text-ink-muted">
                  See also:{' '}
                  {entry.also
                    .map((key) => GLOSSARY[key as GlossaryKey].term)
                    .join(', ')}
                </span>
              )}
            </>
          ) : (
            <span className="block text-sm text-ink-secondary">{children}</span>
          )}
        </span>
      )}
    </span>
  )
}

/**
 * A term written on screen with its ⓘ attached.
 *
 * `<Term k="pScore" />` renders "P-Score ⓘ". Use it the first time a heavy word
 * appears on a screen; after that the bare word is fine, because the reader has
 * somewhere to go.
 */
export function Term({
  k,
  as,
}: {
  k: GlossaryKey
  /** Override the written form, e.g. lower-case mid-sentence. */
  as?: string | undefined
}): JSX.Element {
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      {as ?? glossary(k).term}
      <Explain term={k} />
    </span>
  )
}

/**
 * The standing explanation at the top of a screen.
 *
 * One or two sentences in ordinary language saying what the screen is for and
 * what an officer is expected to do with it. Every screen has one, because
 * "Enforcement Funnel" is a title, not an explanation.
 */
export function ScreenIntro({
  children,
  detail,
}: {
  children: ReactNode
  /** The longer version, behind a disclosure. */
  detail?: ReactNode
}): JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 rounded border border-line bg-sunken p-3">
      <p className="text-sm text-ink-secondary">{children}</p>
      {detail !== undefined && (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen((current) => !current)
            }}
            aria-expanded={open}
            className="mt-1 text-xs text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            {open ? 'Show less' : 'How this works in more detail'}
          </button>
          {open && <div className="mt-2 space-y-2 text-sm text-ink-secondary">{detail}</div>}
        </>
      )}
    </div>
  )
}
