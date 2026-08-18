import { useEffect, useMemo, useState } from 'react'
import { Menu, Search, Sparkles, LogOut, ChevronDown, Bell } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { COMPLIANCE_ALERTS } from '../../data/mockData.js'
import { t } from '../../i18n/index.js'
import { LanguageSwitcher } from './LanguageSwitcher.jsx'
import { FontSizeControl } from './FontSizeControl.jsx'

function initialsOf(name) {
  const parts = (name || 'Guest Officer').trim().split(/\s+/)
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

// The top bar — search and status, what an officer reaches for mid-task.
// The department's identity lives one row up in the Masthead; repeating it
// here would read as duplication rather than hierarchy.
export function Header({ onOpenMobile }) {
  const { role, officerName, setRole, filters, setFilter, setActiveModule, locale } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const intlLocale = locale === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN'
  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    [intlLocale]
  )
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short' }),
    [intlLocale]
  )

  const openAlertCount = COMPLIANCE_ALERTS.filter(a => a.status === 'Open').length

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 h-14 px-4 sm:px-5 bg-white/95 backdrop-blur border-b border-steel-200">
      <button className="lg:hidden p-2 -ml-1.5 rounded-lg hover:bg-steel-100 shrink-0" onClick={onOpenMobile} aria-label="Open navigation">
        <Menu className="w-5 h-5 text-navy-700" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-steel-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          placeholder={t('Search GSTIN, trade name, legal name...')}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-steel-200 bg-steel-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-300"
        />
      </div>

      <div className="flex-1" />

      <button
        onClick={() => setActiveModule('officer-copilot')}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-navy-200 bg-gradient-to-b from-navy-50 to-white text-navy-700 text-xs font-semibold shadow-xs hover:border-navy-300 hover:shadow-sm transition-all shrink-0"
      >
        <Sparkles className="w-3.5 h-3.5" /> {t('Copilot')}
      </button>

      <div className="hidden xl:flex flex-col items-end leading-none shrink-0">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-800 tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
          {timeFmt.format(now)}
        </span>
        <span className="mt-1 text-[9px] font-semibold tracking-wider text-steel-400 uppercase">{dateFmt.format(now)} · IST</span>
      </div>

      <FontSizeControl className="hidden md:flex" />
      <LanguageSwitcher className="hidden sm:flex" />

      <button
        onClick={() => setActiveModule('early-warning')}
        className="relative hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg border border-steel-200 text-steel-600 hover:bg-steel-100 hover:text-navy-700 transition-colors shrink-0"
        aria-label={t('Notifications')}
      >
        <Bell className="w-4 h-4" />
        {openAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-maharisk-critical px-1 text-[9px] font-bold text-white tabular-nums">
            {openAlertCount > 99 ? '99+' : openAlertCount}
          </span>
        )}
      </button>

      <div className="relative shrink-0">
        <button
          onClick={() => setProfileOpen(v => !v)}
          aria-expanded={profileOpen}
          className="flex items-center gap-2 h-9 pr-1.5 pl-1 rounded-lg hover:bg-steel-100 transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
            {initialsOf(officerName)}
          </span>
          <span className="hidden sm:block text-left">
            <span className="block text-[11px] font-semibold text-navy-800 truncate max-w-[9rem]">{officerName || t('Guest Officer')}</span>
            <span className="block text-[10px] text-steel-500 truncate max-w-[9rem]">{t(role)}</span>
          </span>
          <ChevronDown className="w-3 h-3 text-steel-400 shrink-0" />
        </button>

        {profileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden />
            <div className="absolute top-full right-0 mt-1.5 z-50 w-64 rounded-lg border border-steel-200 bg-white shadow-panel p-1.5">
              <div className="px-2.5 py-2 border-b border-steel-100">
                <div className="text-[13px] font-semibold text-navy-900">{officerName || t('Guest Officer')}</div>
                <div className="text-[11px] text-steel-500 mt-0.5">{t(role)}</div>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-steel-100 sm:hidden">
                <FontSizeControl />
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => { setProfileOpen(false); setRole(null) }}
                className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 rounded-md text-[13px] text-maharisk-critical hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> {t('Switch role')}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
