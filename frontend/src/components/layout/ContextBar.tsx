import type { JSX } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '../../i18n'
import { screenAt } from '../../lib/navigation'
import { useSession } from '../../lib/session'

/**
 * The secondary bar under the navigation: where you are, and who you are.
 *
 * Ported from maha-gst-intelligance, with its filter row left out
 * deliberately. The reference carries six global scope selects here -
 * date range, division, district, sector, taxpayer type, risk level - because
 * its modules read a shared filter object.
 *
 * This platform does not work that way, and should not be made to. Its
 * figures are computed server-side against an **immutable snapshot**, and a
 * global filter silently narrowing every screen is how a reader ends up
 * quoting a divisional figure as a State one. Scope here is the officer's
 * jurisdiction, which is enforced on the server and is not theirs to change
 * from a dropdown; per-screen filters live on the screens that own them, next
 * to the figures they change.
 *
 * So this bar states the breadcrumb and the acting identity, and nothing that
 * alters a number.
 */
export function ContextBar(): JSX.Element | null {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const person = useSession((state) => state.person)

  const found = screenAt(pathname)
  if (found === null) return null
  const { group, item } = found

  return (
    <div className="border-b border-line bg-sunken">
      <nav
        aria-label="Breadcrumb"
        className="scrollbar-none flex items-center gap-1.5 overflow-x-auto px-4 py-1.5 text-xs sm:px-5"
      >
        {/* Plain text, not pills. A pill reads as a control, and these are
            not controls -- the rail on the left is where you navigate. Three
            rows of pill-shaped chrome all saying "Dashboard" was the reader
            being told the same thing three times in three different shapes,
            two of which could not be clicked. */}
        <span className="shrink-0 text-ink-muted">GST DRISHTI</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden="true" />
        <span className="shrink-0 text-ink-secondary">{t(group.headingKey)}</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden="true" />
        <span aria-current="page" className="shrink-0 font-semibold text-ink">
          {t(item.labelKey)}
        </span>

        <div className="flex-1" />

        <span className="shrink-0 whitespace-nowrap text-ink-muted">
          Acting as <span className="font-medium text-ink-secondary">{person.name}</span> ·{' '}
          {person.divisions.length === 0 ? 'Whole State' : person.divisions.join(', ')}
        </span>
      </nav>
    </div>
  )
}
