import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { JSX } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'
import { api } from '../lib/api'
import { ContextBar } from './layout/ContextBar'
import { Masthead } from './layout/Masthead'
import { TopNav } from './layout/TopNav'
import { LANGUAGES, LANGUAGE_LABEL } from '../i18n/strings'
import { NAV_GROUPS, surfaceOf } from '../lib/navigation'
import type { NavItem } from '../lib/navigation'
import { CAPABILITY_LABEL } from '../lib/people'
import type { Person } from '../lib/people'
import { useSession } from '../lib/session'
import { THEMES, useTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'
import type { StringKey } from '../i18n/strings'

const THEME_LABEL: Record<Theme, StringKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
}

/**
 * One group of the sidebar, collapsible.
 *
 * Twenty-two destinations is more than anyone scans. Only the group you are
 * working in is open; the others are one click away. Nothing is removed --
 * every screen the platform has is still reachable from here, which is the
 * whole reason for collapsing rather than cutting.
 *
 * A group containing the current route is always open and cannot be closed
 * into invisibility: losing sight of where you are is worse than a long list.
 */
function NavSection({
  heading,
  items,
  end,
  open,
  onToggle,
  count,
  coverage,
}: {
  heading: string
  items: readonly NavItem[]
  end?: string
  open: boolean
  onToggle: () => void
  count: number
  /** Screen code to the dataset it is waiting for; absent means supported. */
  coverage: ReadonlyMap<string, string>
}): JSX.Element {
  const { t } = useI18n()
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted transition-colors hover:bg-sunken hover:text-ink-secondary"
      >
        <ChevronRight
          className={clsx(
            'h-3 w-3 shrink-0 transition-transform duration-[--motion-fast]',
            open && 'rotate-90',
          )}
          aria-hidden="true"
        />
        <span className="flex-1">{heading}</span>
        {!open && <span className="tabular text-[10px] font-normal">{count}</span>}
      </button>

      {open && (
        <ul className="animate-fade mt-0.5">
          {items.map((item) => {
            const waiting = coverage.get(item.code)
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === end}
                  title={
                    waiting === undefined
                      ? undefined
                      : `No data in this upload — needs ${waiting}`
                  }
                  className={({ isActive }) =>
                    clsx(
                      'flex items-baseline gap-2 rounded py-1.5 pl-6 pr-3 text-sm transition-colors',
                      isActive
                        ? 'bg-sunken font-medium text-ink shadow-sm'
                        : waiting === undefined
                          ? 'text-ink-secondary hover:bg-sunken hover:text-ink'
                          : 'text-ink-muted hover:bg-sunken hover:text-ink-secondary',
                    )
                  }
                >
                  <span className="w-5 shrink-0 text-[10px] text-ink-muted tabular">
                    {item.code}
                  </span>
                  <span className="min-w-0 truncate">{t(item.labelKey)}</span>
                  {waiting !== undefined && (
                    <span
                      aria-label="no data in this upload"
                      className="ml-auto shrink-0 rounded bg-sunken px-1 text-[9px] uppercase tracking-wide text-ink-muted"
                    >
                      no data
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}


/**
 * Who you are signed in as.
 *
 * Three named people rather than nine role names. A reader who does not
 * already work here can answer "which of these am I?"; nobody outside the
 * department can answer "am I an Addl. Commissioner (Enforcement)?".
 *
 * The panel states plainly what the selected person may and may not do,
 * because the difference between them is real and load-bearing — it is the
 * maker-and-checker rule that keeps a notice defensible.
 */
function PersonPicker(): JSX.Element {
  const { t } = useI18n()
  const { person, people, setPerson } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current)
        }}
        aria-expanded={open}
        className="flex items-center gap-2 rounded border border-line px-2 py-1 text-left transition-colors hover:bg-sunken"
      >
        <span>
          <span className="block text-xs font-medium leading-tight">{person.name}</span>
          <span className="block text-xs leading-tight text-ink-muted">
            {person.designation}
          </span>
        </span>
        <span aria-hidden="true" className="text-xs text-ink-muted">
          ▾
        </span>
      </button>

      {open && (
        <div className="glass-strong animate-rise absolute right-0 top-11 z-30 w-96 rounded-lg p-3">
          <h2 className="mb-1 text-sm font-semibold">{t('role.viewingAs')}</h2>
          <p className="mb-3 text-xs text-ink-secondary">{t('role.demoNote')}</p>
          <ul className="space-y-1.5">
            {people.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPerson(candidate.id)
                    setOpen(false)
                  }}
                  aria-current={candidate.id === person.id}
                  className={clsx(
                    'w-full rounded border p-2 text-left transition-colors',
                    candidate.id === person.id
                      ? 'border-ink-secondary bg-sunken'
                      : 'border-line hover:bg-sunken',
                  )}
                >
                  <span className="block text-sm font-medium">
                    {candidate.name}
                    {candidate.id === person.id && (
                      <span className="ml-2 text-xs font-normal text-ink-muted">
                        signed in
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-ink-muted">{candidate.designation}</span>
                  <span className="mt-0.5 block text-xs text-ink-secondary">
                    {candidate.does}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Capabilities person={person} />
        </div>
      )}
    </div>
  )
}

function Capabilities({ person }: { person: Person }): JSX.Element {
  const { t } = useI18n()
  const entries = Object.entries(person.can) as [keyof Person['can'], boolean][]
  return (
    <div className="mt-3 border-t border-line pt-2">
      <h3 className="mb-1 text-xs font-semibold">{t('role.canDo')}</h3>
      <ul className="space-y-0.5 text-xs">
        {entries.map(([capability, allowed]) => (
          <li key={capability} className={allowed ? 'text-ink-secondary' : 'text-ink-muted'}>
            <span aria-hidden="true" className="mr-1.5">
              {allowed ? '✓' : '–'}
            </span>
            {allowed ? 'Can ' : 'Cannot '}
            {CAPABILITY_LABEL[capability]}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">
        Every screen is open to all three. Only the actions differ.
      </p>
    </div>
  )
}

export function AppShell(): JSX.Element {
  const { t, language, setLanguage } = useI18n()
  const { theme, setTheme } = useTheme()
  const { person } = useSession()
  const { pathname } = useLocation()
  const surface = surfaceOf(pathname)

  // The group holding the current route is open; the rest start closed and
  // the reader may open any of them. Keyed off the pathname so navigating
  // into a different surface opens that surface rather than leaving the
  // reader looking at a list they have just left.
  const [manual, setManual] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Which destinations the data in front of this officer can actually answer.
  // A screen with no data is marked, never removed: the department needs to
  // see the platform's own scope in order to ask for the next extract. If the
  // call fails the map is empty and nothing is marked -- a sidebar must not
  // start greying itself out because one request timed out.
  const coverage = useQuery({
    queryKey: ['coverage'],
    queryFn: () => api.coverage(),
    staleTime: 60_000,
  })
  const waitingFor = new Map<string, string>(
    (coverage.data?.screens ?? [])
      .filter((row) => !row.available)
      .map((row) => [row.code, row.dataset] as const),
  )
  const openGroups = NAV_GROUPS.filter((group) => manual[group.id] ?? group.id === surface).map(
    (group) => group.id,
  )
  const toggleGroup = (id: string): void => {
    setManual((current) => ({
      ...current,
      [id]: !(current[id] ?? id === surface),
    }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <a className="skip-link" href="#main">
        {t('app.skipToContent')}
      </a>

      {/* The department's identity band, then the gold rule that marks where
          it ends and the working surfaces begin. */}
      <Masthead />

      {/* The utility bar: who you are, and how the page is displayed. It is
          deliberately not navigation -- navigation is the band below it. */}
      <header className="sticky top-0 z-20 border-b border-line bg-raised/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-1.5 sm:px-5">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            onClick={() => {
              setDrawerOpen(true)
            }}
            className="rounded-lg border border-line p-1.5 text-ink-secondary transition-colors hover:bg-sunken hover:text-ink lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Both surfaces stay one click apart. Who you are decides where you
              land, never what you are allowed to understand. */}
          <nav aria-label="Surface" className="flex gap-1 rounded border border-line p-0.5">
            {(
              [
                ['/dashboard', 'surface.dashboard', 'dashboard'],
                ['/workbench', 'surface.workbench', 'workbench'],
              ] as const
            ).map(([path, key, name]) => (
              <NavLink
                key={path}
                to={path}
                className={clsx(
                  'rounded px-3 py-1 text-sm transition-colors',
                  surface === name
                    ? 'bg-sunken font-medium text-ink'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                {t(key)}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/guide"
            className="rounded border border-line px-2 py-1 text-xs text-ink-secondary transition-colors hover:bg-sunken hover:text-ink"
          >
            {t('nav.guide')}
          </NavLink>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <PersonPicker />

            <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="sr-only">{t('language.toggle')}</span>
              <select
                className="rounded border border-line bg-raised px-2 py-1 text-xs text-ink"
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value as typeof language)
                }}
              >
                {LANGUAGES.map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABEL[code]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <span className="sr-only">{t('theme.toggle')}</span>
              <select
                className="rounded border border-line bg-raised px-2 py-1 text-xs text-ink"
                value={theme}
                onChange={(event) => {
                  setTheme(event.target.value as Theme)
                }}
              >
                {THEMES.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {t(THEME_LABEL[candidate])}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <TopNav coverage={waitingFor} />
      <ContextBar />

      {/* Below `lg` the groups become a drawer: eleven group names across one
          line is unusable on a phone, and a rail behind a control is still the
          right shape there. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-govt-900/50 backdrop-blur-[2px]"
            onClick={() => {
              setDrawerOpen(false)
            }}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 flex-col bg-raised shadow-xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="text-sm font-bold">Sections</span>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                }}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-ink-secondary hover:bg-sunken"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto px-1.5 py-3"
              onClick={() => {
                setDrawerOpen(false)
              }}
            >
              {NAV_GROUPS.map((group) => (
                <NavSection
                  key={group.id}
                  heading={t(group.headingKey)}
                  items={group.items}
                  count={group.items.length}
                  coverage={waitingFor}
                  open={openGroups.includes(group.id)}
                  onToggle={() => {
                    toggleGroup(group.id)
                  }}
                  {...(group.end === undefined ? {} : { end: group.end })}
                />
              ))}
            </div>
            <p className="shrink-0 border-t border-line px-4 py-3 text-xs text-ink-muted">
              {person.name} &middot; {person.designation}
            </p>
          </aside>
        </div>
      )}

      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
