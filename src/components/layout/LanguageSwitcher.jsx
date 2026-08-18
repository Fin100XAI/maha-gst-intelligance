import { Languages } from 'lucide-react'
import { LOCALES, LOCALE_INFO } from '../../i18n/index.js'
import { useApp } from '../../context/AppContext.jsx'

// The interface language control. A segmented control rather than a menu,
// and shown at every breakpoint — for a bilingual state the language is not
// a setting an officer goes looking for, it's a property of the screen
// they're standing in front of. Each option is labelled in ITS OWN language
// so a reader who can't read the current one can still find their own.
export function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale } = useApp()

  return (
    <div
      role="group"
      aria-label="Interface language"
      className={`flex h-8 items-center gap-0.5 rounded-lg border border-steel-200 bg-steel-50 p-0.5 shrink-0 ${className}`}
    >
      <Languages className="ml-1 hidden w-3.5 h-3.5 shrink-0 text-steel-400 sm:block" aria-hidden />
      {LOCALES.map(id => {
        const info = LOCALE_INFO[id]
        const isActive = id === locale
        return (
          <button
            key={id}
            type="button"
            lang={info.htmlLang}
            aria-pressed={isActive}
            aria-label={`${info.nativeName} — ${info.englishName}`}
            onClick={() => setLocale(id)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold leading-none transition-colors ${
              isActive ? 'bg-white text-navy-800 shadow-xs ring-1 ring-navy-200' : 'text-steel-500 hover:bg-white/70 hover:text-navy-700'
            }`}
          >
            {info.nativeName}
          </button>
        )
      })}
    </div>
  )
}
