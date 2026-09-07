import { t } from '../../i18n/index.js'

// Horizontal pill-tab switcher — the pattern MahaGST's own public Statistics page
// uses to flip between data tables. Reused here for the same "one card, many views" idea.
//
// The map callback is `tab`, not `t`. It was `t` until the tab labels started
// going through the translator, at which point `{t(t.label)}` called the tab
// object as a function — a crash the bundler compiles happily. scripts/audit.mjs
// now fails on any file that binds `t` while importing the translator.
export function PillTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none" role="tablist">
      {tabs.map(tab => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-ink-700 border-ink-700 text-white shadow-sm'
                : 'bg-white border-steel-200 text-steel-600 hover:border-navy-300 hover:text-navy-700'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {t(tab.label)}
          </button>
        )
      })}
    </div>
  )
}
