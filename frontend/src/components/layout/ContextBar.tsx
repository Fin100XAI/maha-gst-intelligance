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
    <div className="border-b border-line bg-gradient-to-r from-sunken via-raised to-sunken">
      <div className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 py-2 text-xs sm:px-5">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          Where you are
        </span>
        <span className="h-3 w-px shrink-0 bg-line-strong" aria-hidden="true" />
        <span className="shrink-0 rounded-full border border-line bg-sunken px-2 py-0.5 font-medium text-ink-secondary">
          GST DRISHTI
        </span>
        <ChevronRight className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden="true" />
        <span className="shrink-0 rounded-full border border-govt-200 bg-govt-50 px-2 py-0.5 font-medium text-govt-700">
          {t(group.headingKey)}
        </span>
        <ChevronRight className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden="true" />
        <span className="shrink-0 rounded-full border border-govtgold-200 bg-govtgold-50 px-2 py-0.5 font-semibold text-govtgold-700">
          {t(item.labelKey)}
        </span>

        <div className="flex-1" />

        <span className="shrink-0 whitespace-nowrap rounded-full border border-line bg-sunken px-2 py-0.5 font-medium text-ink-secondary">
          Acting as {person.name} ·{' '}
          {person.divisions.length === 0 ? 'Whole State' : person.divisions.join(', ')}
        </span>
      </div>
    </div>
  )
}
