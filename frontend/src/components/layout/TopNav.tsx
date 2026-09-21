import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '../../i18n'
import { NAV_GROUPS } from '../../lib/navigation'
import type { NavGroup } from '../../lib/navigation'
import { cn } from '../../lib/utils'

/**
 * Primary navigation as a horizontal menu bar.
 *
 * Ported from maha-gst-intelligance, and it answers the department's own
 * note on the earlier build — that everything sat down the left and the width
 * of the screen went unused. Every group is named on the bar; none is hidden
 * behind an overflow control. A group's screens open on hover *and* on click,
 * so it works from a keyboard and on a touchscreen, not only under a mouse.
 *
 * The left rail is not gone. It survives as the drawer below `lg`, where
 * eleven group names across one line is unusable.
 */
const OPEN_DELAY_MS = 90
const CLOSE_DELAY_MS = 200

interface Anchor {
  left: number
  top: number
}

export function TopNav({
  coverage,
}: {
  /** Screen code → the dataset it is waiting for. Absent means supported. */
  coverage: ReadonlyMap<string, string>
}): JSX.Element {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [openId, setOpenId] = useState<string | null>(null)
  // The row scrolls horizontally, which clips anything absolutely positioned
  // inside it, so the panel is fixed and anchored to its trigger's rect.
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)

  const clearTimers = (): void => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current)
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }

  // A route change means the reader got where they were going. Leaving the
  // panel open over the new screen is the menu arguing with the navigation.
  useEffect(() => {
    clearTimers()
    setOpenId(null)
  }, [pathname])

  useEffect(() => clearTimers, [])

  const activeGroup = NAV_GROUPS.find((group) =>
    group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
  )

  const place = (id: string, element: HTMLElement): void => {
    const rect = element.getBoundingClientRect()
    setAnchor({ left: rect.left, top: rect.bottom })
    setOpenId(id)
  }

  const scheduleOpen = (id: string, element: HTMLElement): void => {
    clearTimers()
    if (openId !== null) {
      place(id, element)
      return
    }
    openTimer.current = window.setTimeout(() => {
      place(id, element)
    }, OPEN_DELAY_MS)
  }

  const scheduleClose = (): void => {
    clearTimers()
    closeTimer.current = window.setTimeout(() => {
      setOpenId(null)
    }, CLOSE_DELAY_MS)
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="relative z-30 hidden border-b border-white/10 bg-govt-900 lg:block"
    >
      <div className="px-4 sm:px-5">
        <div className="scrollbar-none flex flex-nowrap items-center gap-0.5 overflow-x-auto py-1.5">
          {NAV_GROUPS.map((group) => (
            <GroupButton
              key={group.id}
              group={group}
              label={t(group.headingKey)}
              active={activeGroup?.id === group.id}
              open={openId === group.id}
              anchor={anchor}
              coverage={coverage}
              onOpen={scheduleOpen}
              onClose={scheduleClose}
              onHold={clearTimers}
              onToggle={(element) => {
                if (openId === group.id) {
                  clearTimers()
                  setOpenId(null)
                } else {
                  place(group.id, element)
                }
              }}
              labelFor={t}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

function GroupButton({
  group,
  label,
  active,
  open,
  anchor,
  coverage,
  onOpen,
  onClose,
  onHold,
  onToggle,
  labelFor,
}: {
  group: NavGroup
  label: string
  active: boolean
  open: boolean
  anchor: Anchor | null
  coverage: ReadonlyMap<string, string>
  onOpen: (id: string, element: HTMLElement) => void
  onClose: () => void
  onHold: () => void
  onToggle: (element: HTMLElement) => void
  labelFor: (key: NavGroup['items'][number]['labelKey']) => string
}): JSX.Element {
  const wide = group.items.length > 5
  const width = wide ? 620 : 320

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={(event) => {
        onOpen(group.id, event.currentTarget)
      }}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(event) => {
          const holder = event.currentTarget.parentElement
          if (holder !== null) onToggle(holder)
        }}
        className={cn(
          'relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors duration-150',
          active || open
            ? 'bg-white/15 font-semibold text-white'
            : 'font-medium text-govt-200 hover:bg-white/10 hover:text-white',
        )}
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-govt-300 transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-1.5 bottom-0 h-[2px] origin-center rounded-full bg-gradient-to-r from-govtgold-400 to-govtgold-600 transition-transform duration-200',
            active ? 'scale-x-100' : 'scale-x-0',
          )}
        />
      </button>

      {open && (
        <div
          onMouseEnter={onHold}
          onMouseLeave={onClose}
          style={
            anchor === null
              ? undefined
              : { left: Math.min(anchor.left, window.innerWidth - width), top: anchor.top }
          }
          className={cn(
            'fixed z-40 gap-0.5 rounded-b-xl border border-t-0 border-line bg-raised p-2 shadow-lg',
            wide ? 'grid w-[38rem] grid-cols-2' : 'grid w-[19rem] grid-cols-1',
          )}
        >
          <p className="col-span-full px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-govt-accent">
            {label}
          </p>
          {group.items.map((item) => {
            const waiting = coverage.get(item.code)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === group.end}
                title={waiting === undefined ? undefined : `No data in this upload — needs ${waiting}`}
                className={({ isActive }) =>
                  cn(
                    'flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors',
                    isActive ? 'bg-sunken ring-1 ring-govt-400' : 'hover:bg-sunken',
                  )
                }
              >
                <span className="tabular mt-0.5 w-5 shrink-0 text-[10px] font-bold text-ink-muted">
                  {item.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">
                      {labelFor(item.labelKey)}
                    </span>
                    {waiting !== undefined && (
                      <span className="shrink-0 rounded bg-sunken px-1 text-[9px] uppercase tracking-wide text-ink-muted">
                        no data
                      </span>
                    )}
                  </span>
                </span>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
