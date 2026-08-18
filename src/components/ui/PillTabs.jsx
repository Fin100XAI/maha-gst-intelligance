// Horizontal pill-tab switcher — the pattern MahaGST's own public Statistics page
// uses to flip between data tables. Reused here for the same "one card, many views" idea.
export function PillTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none" role="tablist">
      {tabs.map(t => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-navy-700 border-navy-700 text-white shadow-sm'
                : 'bg-white border-steel-200 text-steel-600 hover:border-navy-300 hover:text-navy-700'
            }`}
          >
            {t.icon && <t.icon className="w-3.5 h-3.5" />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
