import { t } from '../../i18n/index.js'

// Circular composite-score ring — score/100 with a status label underneath,
// the same "single number that tells you how the state is doing" idea as a
// weighted health-index gauge, coloured by band rather than a flat accent.
const BANDS = [
  { min: 80, label: 'Healthy', color: '#1f8a4c', bg: '#e6f4ea' },
  { min: 60, label: 'Degraded', color: '#d99a15', bg: '#fdf1de' },
  { min: 0, label: 'Critical', color: '#c41e3a', bg: '#fbe9e7' }
]

function bandFor(score) {
  return BANDS.find(b => score >= b.min) || BANDS.at(-1)
}

export function ScoreGauge({ score, size = 140, strokeWidth = 12, label = 'Composite score' }) {
  const band = bandFor(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e8eaee" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={band.color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color: band.color }}>{score}</span>
          <span className="text-[10px] text-steel-500">{t('of 100')}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[11px] text-steel-500">{t(label)}</div>
        <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: band.bg, color: band.color }}>
          {t(band.label)}
        </span>
      </div>
    </div>
  )
}
