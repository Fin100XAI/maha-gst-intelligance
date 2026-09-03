import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

// Executive summary KPI tile. `trend` is a signed number (%).
// `tone` selects a soft Google Material–style background + matching accent color.
//
// The values are CSS variables rather than literal hex because this object is
// imported as a plain object by six modules — including a module-level helper
// in DistrictDivisionPerformance that runs outside any component — so it can't
// become a hook. Handing `var(...)` to an inline `style` lets the browser
// resolve the colour against the active theme on every paint, which means a
// theme flip recolours every tile with no re-render at all. The light and dark
// values for each token live in index.css.
export const TONE_STYLES = {
  navy: { bg: 'var(--tone-navy-bg)', border: 'var(--tone-navy-border)', accent: 'var(--tone-navy-accent)', iconBg: 'var(--tone-icon-bg)' },
  saffron: { bg: 'var(--tone-amber-bg)', border: 'var(--tone-amber-border)', accent: 'var(--tone-amber-accent)', iconBg: 'var(--tone-icon-bg)' },
  amber: { bg: 'var(--tone-amber-bg)', border: 'var(--tone-amber-border)', accent: 'var(--tone-amber-accent)', iconBg: 'var(--tone-icon-bg)' },
  orange: { bg: 'var(--tone-orange-bg)', border: 'var(--tone-orange-border)', accent: 'var(--tone-orange-accent)', iconBg: 'var(--tone-icon-bg)' },
  green: { bg: 'var(--tone-green-bg)', border: 'var(--tone-green-border)', accent: 'var(--tone-green-accent)', iconBg: 'var(--tone-icon-bg)' },
  red: { bg: 'var(--tone-red-bg)', border: 'var(--tone-red-border)', accent: 'var(--tone-red-accent)', iconBg: 'var(--tone-icon-bg)' },
  steel: { bg: 'var(--tone-steel-bg)', border: 'var(--tone-steel-border)', accent: 'var(--tone-steel-accent)', iconBg: 'var(--tone-icon-bg)' }
}

// Convenience accessor for call sites that read the map inside a component.
// It returns the same variable-backed map — the hook shape exists so those
// call sites don't have to care whether the tones are static or theme-driven.
export function useToneStyles() {
  return TONE_STYLES
}

export function KpiCard({ label, value, unit, trend, trendLabel, tone = 'navy', icon: Icon, onClick }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.navy
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus
  const trendColor = trend > 0 ? 'text-emerald-700' : trend < 0 ? 'text-[#C5221F]' : 'text-steel-400'

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: t.bg, borderColor: t.border }}
      className={`relative w-full text-left rounded-xl border p-4 overflow-hidden ${onClick ? 'hover:shadow-panel hover:-translate-y-0.5 transition-all cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div className="kv-label" style={{ color: t.accent }}>{label}</div>
        {Icon && (
          <span style={{ backgroundColor: t.iconBg, color: t.accent }} className="p-1.5 rounded-lg shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: t.accent }}>{value}</span>
        {unit && <span className="text-xs font-medium text-steel-500">{unit}</span>}
      </div>
      {(trend !== undefined && trend !== null) && (
        <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-steel-500 font-normal">{trendLabel}</span>}
        </div>
      )}
    </button>
  )
}
