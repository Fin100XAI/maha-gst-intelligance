import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

// Executive summary KPI tile. `trend` is a signed number (%).
// `tone` selects a soft Google Material–style light background + matching accent color.
export const TONE_STYLES = {
  navy: { bg: '#E8F0FE', border: '#D2E3FC', accent: '#1A73E8', iconBg: '#FFFFFFB3' },
  saffron: { bg: '#FEF7E0', border: '#FDE293', accent: '#B06000', iconBg: '#FFFFFFB3' },
  amber: { bg: '#FEF7E0', border: '#FDE293', accent: '#B06000', iconBg: '#FFFFFFB3' },
  orange: { bg: '#FEEFE3', border: '#FCD9B6', accent: '#C4530D', iconBg: '#FFFFFFB3' },
  green: { bg: '#E6F4EA', border: '#CEEAD6', accent: '#188038', iconBg: '#FFFFFFB3' },
  red: { bg: '#FCE8E6', border: '#F6C6C4', accent: '#C5221F', iconBg: '#FFFFFFB3' },
  steel: { bg: '#F1F3F4', border: '#E1E3E6', accent: '#5F6368', iconBg: '#FFFFFFB3' }
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
