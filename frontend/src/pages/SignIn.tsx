import type { JSX } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChevronRight, ShieldCheck } from 'lucide-react'
import { Logo } from '../components/brand/Logo'
import { CAPABILITY_LABEL } from '../lib/people'
import type { Person } from '../lib/people'
import { landingPath } from '../lib/rbac'
import { useSession } from '../lib/session'
import { cn } from '../lib/utils'

/**
 * Officer sign-in, on the maha-gst-intelligance split-screen layout.
 *
 * Two things are deliberately different from the reference, and both matter.
 *
 * **No access code.** The reference gates entry behind a shared demo code.
 * A code that every reviewer types is not authentication, and putting one
 * here would suggest this screen is a security control. It is not: there is
 * no identity provider yet, authorisation is enforced on the server at the
 * query layer, and an out-of-scope GSTIN returns 404 whatever is chosen here.
 * The screen says that rather than implying otherwise.
 *
 * **Three named people, not eight role titles.** A list of role names asks the
 * reader to already know what an "Addl. Commissioner (Enforcement)" may do
 * that a "Deputy Commissioner" may not. The three people cover the whole
 * platform between them, every screen is reachable by all three, and what
 * differs is which *actions* each may take - which is shown here, before
 * signing in, rather than discovered at the moment a button is refused.
 */
export default function SignIn(): JSX.Element {
  const navigate = useNavigate()
  const people = useSession((state) => state.people)
  const setPerson = useSession((state) => state.setPerson)
  const current = useSession((state) => state.person)
  const [selected, setSelected] = useState<string>(current.id)

  const enter = (): void => {
    setPerson(selected)
    const person = people.find((p) => p.id === selected)
    navigate(landingPath(person === undefined ? current.role : person.role), { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* ------------------------------------------- left: what you enter */}
      <div className="flex shrink-0 flex-col justify-between bg-govt-900 px-6 py-8 text-white sm:px-10 lg:h-full lg:w-1/2">
        <div className="flex justify-start">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        <div className="mx-auto max-w-md py-8 lg:mx-0">
          <Logo size="xl" className="mb-4" />
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            GST Intelligence
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-govt-100">
            Scrutiny, reconciliation and demand for the Commercial Taxes Department - from the
            filed return to the source cell.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              'Access follows the role held, and every action is logged against the officer who took it.',
              'Every figure states the rule it came from and the row of the file it was read from.',
              'A rule that cannot run names the dataset it needed. It never reports “no issue found”.',
              'The officer who drafts a notice may not approve it. The platform will not let that change.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13px] text-govt-100">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-govtgold-300" />
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] leading-relaxed text-govt-200">
          This picker is not a security control. There is no identity provider yet - State SSO
          arrives with OIDC - and authorisation is enforced on the server whatever is chosen
          here.
        </p>
      </div>

      {/* ------------------------------------------------ right: identity */}
      <div className="flex flex-1 flex-col justify-center bg-page px-6 py-10 sm:px-10 lg:h-full lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-govt-accent">
            Officer sign-in
          </div>
          <h2 className="font-display text-xl font-bold">Who are you signing in as?</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">
            All three reach every screen. What differs is what each may do - shown below, so you
            know before you start rather than when a button refuses you.
          </p>

          <ul className="mt-6 space-y-3">
            {people.map((person) => (
              <PersonOption
                key={person.id}
                person={person}
                selected={selected === person.id}
                onSelect={() => {
                  setSelected(person.id)
                }}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={enter}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-govt-600 to-govt-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:from-govt-500 hover:to-govt-600"
          >
            <ShieldCheck className="h-4 w-4" /> Enter the workspace
            <ChevronRight className="h-4 w-4" />
          </button>

          <p className="mt-3 text-center text-[11px] text-ink-muted">
            You can change who you are signed in as at any time from the header.
          </p>
        </div>
      </div>
    </div>
  )
}

function PersonOption({
  person,
  selected,
  onSelect,
}: {
  person: Person
  selected: boolean
  onSelect: () => void
}): JSX.Element {
  const can = (Object.keys(CAPABILITY_LABEL) as (keyof typeof CAPABILITY_LABEL)[]).filter(
    (key) => person.can[key],
  )
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'w-full rounded-xl border p-4 text-left transition-colors',
          selected
            ? 'border-govt-500 bg-sunken ring-1 ring-govt-400'
            : 'border-line bg-raised hover:border-govt-300 hover:bg-sunken',
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-bold">{person.name}</span>
          <span className="shrink-0 text-xs text-ink-secondary">{person.designation}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{person.does}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {can.map((key) => (
            <span
              key={key}
              className="rounded-full bg-govt-100 px-2 py-0.5 text-[10px] font-semibold text-govt-700"
            >
              {CAPABILITY_LABEL[key]}
            </span>
          ))}
          <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-medium text-ink-secondary">
            {person.divisions.length === 0
              ? 'Whole State'
              : `${String(person.divisions.length)} division${person.divisions.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </button>
    </li>
  )
}
