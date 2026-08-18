import { RISK_COLORS } from '../../data/risk.js'
import { AlertTriangle } from 'lucide-react'
import { t } from '../../i18n/index.js'

export function RiskBadge({ category, score, size = 'md' }) {
  const c = RISK_COLORS[category] || RISK_COLORS.Low
  const sizeCls = size === 'sm' ? 'text-[11px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5'
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${c.bg} ${c.border} ${c.text} ${sizeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {t(category)}{typeof score === 'number' ? ` · ${score}` : ''}
    </span>
  )
}

export function HumanReviewBadge({ label = 'Human Review Required' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron-300 bg-saffron-50 text-saffron-800 text-[11px] font-semibold px-2 py-1">
      <AlertTriangle className="w-3 h-3" />
      {t(label)}
    </span>
  )
}

export function Pill({ children, tone = 'steel' }) {
  const toneMap = {
    steel: 'bg-steel-100 text-steel-700 border-steel-200',
    navy: 'bg-navy-50 text-navy-700 border-navy-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  }
  return <span className={`inline-flex items-center rounded-md border text-[11px] font-medium px-2 py-0.5 ${toneMap[tone]}`}>{children}</span>
}
