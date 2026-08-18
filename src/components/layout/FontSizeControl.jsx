import { useApp, FONT_SCALES } from '../../context/AppContext.jsx'
import { t } from '../../i18n/index.js'

const STEPS = ['sm', 'base', 'lg']
const STEP_LABEL = { sm: 'A-', base: 'A', lg: 'A+' }

// Text-size control — scales the root font-size so every rem-based Tailwind
// class in the app resizes with it. Shown at every breakpoint alongside the
// language switcher: for a screen an officer may be reading off a shared
// desk monitor, this isn't a settings-page preference, it's a per-visit need.
export function FontSizeControl({ className = '' }) {
  const { fontScale, setFontScale } = useApp()

  return (
    <div
      role="group"
      aria-label={t('Text size')}
      className={`flex h-8 items-center gap-0.5 rounded-lg border border-steel-200 bg-steel-50 p-0.5 shrink-0 ${className}`}
    >
      {STEPS.map(step => {
        const isActive = step === fontScale
        return (
          <button
            key={step}
            type="button"
            aria-pressed={isActive}
            aria-label={t('Text size: {0}', STEP_LABEL[step])}
            onClick={() => setFontScale(step)}
            className={`rounded-md px-2 py-1 text-[11px] font-bold leading-none transition-colors ${
              isActive ? 'bg-white text-navy-800 shadow-xs ring-1 ring-navy-200' : 'text-steel-500 hover:bg-white/70 hover:text-navy-700'
            }`}
            style={{ fontSize: FONT_SCALES[step] === '100%' ? '11px' : step === 'sm' ? '10px' : '12.5px' }}
          >
            {STEP_LABEL[step]}
          </button>
        )
      })}
    </div>
  )
}
