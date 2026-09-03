import { Sun, Moon } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'

const STEPS = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' }
]

// Colour-scheme control — the third of the three controls an officer can reach
// on every screen, next to text size and language. A segmented control rather
// than a single toggle for the same reason as the language switcher: which
// state you are currently in should be readable at a glance, not inferred from
// which icon the button happens to be showing.
export function ThemeSwitcher({ className = '' }) {
  const { theme, setTheme } = useApp()

  return (
    <div
      role="group"
      aria-label={t('Colour theme')}
      className={`flex h-8 items-center gap-0.5 rounded-lg border border-steel-200 bg-steel-50 p-0.5 shrink-0 ${className}`}
    >
      {STEPS.map(({ id, icon: Icon, label }) => {
        const isActive = id === theme
        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            aria-label={t('Colour theme: {0}', t(label))}
            title={t(label)}
            onClick={() => setTheme(id)}
            className={`inline-flex items-center justify-center rounded-md px-2 py-1 leading-none transition-colors ${
              isActive ? 'bg-white text-navy-800 shadow-xs ring-1 ring-navy-200' : 'text-steel-500 hover:bg-white/70 hover:text-navy-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
