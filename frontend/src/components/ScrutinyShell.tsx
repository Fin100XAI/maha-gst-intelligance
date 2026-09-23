import clsx from 'clsx'
import { FileSearch, FolderCog } from 'lucide-react'
import type { JSX } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Masthead } from './layout/Masthead'

/**
 * The rail holds two words.
 *
 * `docs/08`: twenty-eight routed screens is more than anyone scans, and an
 * officer being shown the platform for the first time does not need to learn
 * an information architecture. They need one forward path - who needs
 * attention, what is wrong with them, show me the working - and everything
 * else reached by clicking a number.
 *
 * The old screens are not deleted. They are still routed and still work; they
 * are simply not in the rail, because a rail is for navigating and this one
 * navigates to two places.
 */
const SECTIONS = [
  {
    to: '/setup',
    label: 'Setup & Reference',
    hint: 'What was read, and where the rules come from',
    icon: FolderCog,
  },
  {
    to: '/scrutiny',
    label: 'Scrutiny',
    hint: 'Who needs attention, and what is wrong',
    icon: FileSearch,
  },
] as const

export function ScrutinyShell(): JSX.Element {
  return (
    <div className="min-h-screen bg-page text-ink">
      {/* The rail is always visible here, so the masthead's nav button has
          nothing to open - two destinations do not need a drawer. */}
      <Masthead onOpenNav={() => undefined}>{null}</Masthead>
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <nav aria-label="Sections" className="w-56 shrink-0">
          <ul className="space-y-2">
            {SECTIONS.map((section) => (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={({ isActive }) =>
                    clsx(
                      'block rounded-lg border p-3 transition',
                      isActive
                        ? 'border-line-strong bg-raised'
                        : 'border-line bg-raised/50 hover:bg-raised',
                    )
                  }
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <section.icon aria-hidden className="h-4 w-4" />
                    {section.label}
                  </span>
                  {/*
                    The hint is the screen's job description in plain words.
                    An officer who has not been trained on this should be able
                    to pick the right side from the rail alone.
                  */}
                  <span className="mt-1 block text-xs text-ink-muted">{section.hint}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
