import { useState } from 'react'
import { ChevronDown, Lock, X } from 'lucide-react'
import { MODULES, NAV_MODULES, canAccessModule, useApp } from '../../context/AppContext.jsx'
import { MODULE_ICONS, useSidebarBadges, NAV_GROUPS } from './moduleMeta.js'
import { t } from '../../i18n/index.js'
import { Logo } from './Logo.jsx'

// Only shown below `lg` — primary navigation on wide screens is the
// horizontal TopNav bar. A vertical rail behind a hamburger is still the
// right shape on a phone, where sixteen names across one line is unusable.
const DEFAULT_EXPANDED = ['Revenue at Risk']

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { activeModule, setActiveModule, role } = useApp()
  const badges = useSidebarBadges()
  const [expandedGroups, setExpandedGroups] = useState(DEFAULT_EXPANDED)

  const activeGroupId = MODULES.find(m => m.id === activeModule)?.group
  const toggleGroup = id => setExpandedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  if (!mobileOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-govt-900/50 backdrop-blur-[2px]" onClick={onCloseMobile} aria-hidden />
      <aside className="relative flex h-full w-72 flex-col bg-govt-900 text-white shadow-panel">
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-white/10 shrink-0">
          <Logo size="md" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-sm font-bold tracking-wide">MAHA GST</div>
            <div className="text-[10px] text-govt-200 tracking-wider">INTELLIGENCE</div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-white/10" onClick={onCloseMobile} aria-label="Close navigation">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_GROUPS.map(group => {
            const items = NAV_MODULES.filter(m => m.group === group.id && canAccessModule(role, m.id))
            if (items.length === 0) return null
            const isActiveGroup = group.id === activeGroupId
            const isExpanded = expandedGroups.includes(group.id) || isActiveGroup

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isActiveGroup ? 'text-gold-300' : 'text-govt-400'} ${!isExpanded ? '-rotate-90' : ''}`} />
                  <span className={`flex-1 text-left text-[10px] font-bold uppercase tracking-widest ${isActiveGroup ? 'text-gold-300' : 'text-govt-300'}`}>
                    {t(group.label)}
                  </span>
                  {!isExpanded && items.some(m => badges[m.id]?.count > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <ul className="space-y-0.5 mt-0.5">
                    {items.map(m => {
                      const Icon = MODULE_ICONS[m.id]
                      const allowed = canAccessModule(role, m.id)
                      const active = activeModule === m.id
                      const badge = badges[m.id]
                      return (
                        <li key={m.id}>
                          <button
                            disabled={!allowed}
                            title={!allowed ? `${t('Restricted for your role')} (${t(role)})` : undefined}
                            onClick={() => { if (!allowed) return; setActiveModule(m.id); onCloseMobile?.() }}
                            className={`group relative w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                              !allowed ? 'cursor-not-allowed opacity-50' : active ? 'bg-white text-navy-900 font-semibold' : 'text-govt-100 hover:bg-white/10'
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`absolute top-1/2 -left-1 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-gold-400 to-gold-600 origin-center transition-transform duration-200 ${active ? 'scale-y-100' : 'scale-y-0'}`}
                            />
                            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-govt-700' : 'text-govt-300 group-hover:text-white'}`} />
                            <span className="flex-1 text-left truncate">{t(m.label)}</span>
                            {!allowed && <Lock className="w-3 h-3 text-govt-400 shrink-0" />}
                            {allowed && badge?.count > 0 && (
                              <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${badge.urgent ? 'bg-maharisk-critical text-white' : 'bg-gold-500/90 text-rail-900'}`}>
                                {badge.count > 99 ? '99+' : badge.count}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 text-[10px] text-govt-300 leading-relaxed shrink-0">
          {t('Government of Maharashtra · State GST Department')}<br />{t('Revenue Assurance & Compliance Intelligence Infrastructure')}
        </div>
      </aside>
    </div>
  )
}
