import { useRef, useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { MODULES, canAccessModule, useApp } from '../../context/AppContext.jsx'
import { MODULE_ICONS, useSidebarBadges, NAV_GROUPS } from './moduleMeta.js'
import { t } from '../../i18n/index.js'

const OPEN_DELAY_MS = 90
const CLOSE_DELAY_MS = 200

// Primary navigation as a horizontal menu bar — every group is named on the
// bar, none hidden behind an overflow control. A group's modules open on
// hover (or click, so it works without a pointer and on touch). Badge counts
// are visible at both levels: the group carries the sum of its modules', so
// an officer never has to open a menu to learn something needs attention.
export function TopNav() {
  const { activeModule, setActiveModule, role } = useApp()
  const badges = useSidebarBadges()
  const [openId, setOpenId] = useState(null)
  const openTimer = useRef(null)
  const closeTimer = useRef(null)

  const activeGroupId = MODULES.find(m => m.id === activeModule)?.group

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }
  const scheduleOpen = id => {
    clearTimers()
    if (openId !== null) { setOpenId(id); return }
    openTimer.current = setTimeout(() => setOpenId(id), OPEN_DELAY_MS)
  }
  const scheduleClose = () => {
    clearTimers()
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }
  const closeNow = () => { clearTimers(); setOpenId(null) }
  const select = id => { setActiveModule(id); closeNow() }

  return (
    <nav aria-label="Primary navigation" className="relative z-30 hidden lg:block border-b border-white/10 bg-govt-900">
      <div className="px-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-0.5 py-1.5">
            {NAV_GROUPS.map(group => {
              const items = MODULES.filter(m => m.group === group.id)
              if (items.length === 0) return null
              const isActive = group.id === activeGroupId
              const isOpen = openId === group.id
              const badgeSum = items.reduce((s, m) => s + (badges[m.id]?.count || 0), 0)
              const urgent = items.some(m => badges[m.id]?.urgent && badges[m.id]?.count > 0)

              return (
                <div key={group.id} className="relative" onMouseEnter={() => scheduleOpen(group.id)} onMouseLeave={scheduleClose}>
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => (isOpen ? closeNow() : setOpenId(group.id))}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors duration-150 ${
                      isActive || isOpen ? 'bg-white/15 font-semibold text-white' : 'font-medium text-govt-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{t(group.label)}</span>
                    {badgeSum > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-px rounded-full tabular-nums ${urgent ? 'bg-maharisk-critical text-white' : 'bg-white/20 text-white ring-1 ring-white/25'}`}>
                        {badgeSum > 99 ? '99+' : badgeSum}
                      </span>
                    )}
                    <ChevronDown className={`w-3 h-3 text-govt-300 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                    <span
                      aria-hidden
                      className={`absolute inset-x-1.5 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-gold-400 to-gold-600 origin-center transition-transform duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      onMouseEnter={clearTimers}
                      onMouseLeave={scheduleClose}
                      className={`absolute top-full left-0 z-40 rounded-b-xl border border-t-0 border-steel-200 bg-white shadow-panel p-2 ${
                        items.length > 5 ? 'w-[38rem] grid grid-cols-2 gap-0.5' : 'w-[19rem] grid grid-cols-1 gap-0.5'
                      }`}
                    >
                      <p className="col-span-full px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-wider text-govt-700 uppercase">{t(group.label)}</p>
                      {items.map(m => {
                        const Icon = MODULE_ICONS[m.id]
                        const allowed = canAccessModule(role, m.id)
                        const active = activeModule === m.id
                        const badge = badges[m.id]
                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={!allowed}
                            title={!allowed ? `${t('Restricted for your role')} (${t(role)})` : undefined}
                            onClick={() => allowed && select(m.id)}
                            className={`w-full flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                              !allowed ? 'cursor-not-allowed opacity-50' : active ? 'bg-govt-50 ring-1 ring-govt-200/60' : 'hover:bg-steel-50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-govt-700' : 'text-steel-400'}`} />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className={`truncate text-[13px] ${active ? 'font-semibold text-navy-900' : 'font-medium text-navy-800'}`}>{t(m.label)}</span>
                                {!allowed && <Lock className="w-3 h-3 text-steel-400 shrink-0" />}
                                {allowed && badge?.count > 0 && (
                                  <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${badge.urgent ? 'bg-maharisk-critical text-white' : 'bg-gold-100 text-gold-700 ring-1 ring-gold-200'}`}>
                                    {badge.count}
                                  </span>
                                )}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </nav>
  )
}
