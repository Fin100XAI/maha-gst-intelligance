import { AlertOctagon, AlertTriangle, Eye, ChevronRight, Info } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { CONDITIONS, SEVERITY, BOARD_SUMMARY, BOARD_NOTE } from '../../data/commandBoard.js'
import { t } from '../../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

const STYLE = {
  critical: { bar: 'bg-[#C5221F]', chip: 'bg-[#C5221F] text-white', border: 'border-red-300', bg: 'bg-red-50/50', Icon: AlertOctagon, icon: 'text-[#C5221F]' },
  high: { bar: 'bg-orange-500', chip: 'bg-orange-500 text-white', border: 'border-orange-200', bg: 'bg-orange-50/40', Icon: AlertTriangle, icon: 'text-orange-600' },
  watch: { bar: 'bg-amber-400', chip: 'bg-amber-400 text-navy-900', border: 'border-amber-200', bg: 'bg-amber-50/40', Icon: Eye, icon: 'text-amber-600' }
}

/* An operations board, not a directory. Every line is a condition somebody has
 * to act on or consciously accept, carrying the decision it demands and who
 * takes it — a line with no decision attached is a statistic, and statistics
 * belong on the analytics screens. */
export function CommandBoard({ onOpen }) {
  const B = BOARD_SUMMARY
  return (
    <div className="mb-4 space-y-3">
      {/* Status strip. Irreversible loss stated apart from what is still in play. */}
      <div className="rounded-xl border border-steel-200 bg-white shadow-card overflow-hidden">
        <div className="flex flex-wrap items-stretch">
          <div className="flex-1 min-w-[200px] px-5 py-3.5 border-r border-steel-100">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('Irreversible — already lost')}</div>
            <div className="text-[26px] font-bold text-[#C5221F] tabular-nums leading-none">{cr(B.irreversibleValue)}</div>
            <div className="text-[11px] text-steel-500 mt-1">{t('no action recovers this')}</div>
          </div>
          <div className="flex-1 min-w-[200px] px-5 py-3.5 border-r border-steel-100">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('Still in play')}</div>
            <div className="text-[26px] font-bold text-navy-900 tabular-nums leading-none">{cr(B.atRiskValue)}</div>
            <div className="text-[11px] text-steel-500 mt-1">{t('protectable if acted on')}</div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3.5">
            <Sev n={B.critical} label={t('Critical')} k="critical" />
            <Sev n={B.high} label={t('High')} k="high" />
            <Sev n={B.watch} label={t('Watch')} k="watch" />
          </div>
          <div className="px-5 py-3.5 border-l border-steel-100 flex flex-col justify-center min-w-[150px]">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{t('Need your decision')}</div>
            <div className="text-[22px] font-bold text-navy-900 tabular-nums leading-none mt-0.5">{B.commissionerDecisions}</div>
          </div>
        </div>
      </div>

      <Card
        title={t('Active conditions')}
        subtitle={t('Ordered by irreversibility, not by value. Each line carries the decision it needs and who takes it.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {CONDITIONS.map(c => {
            const st = STYLE[c.severity]
            const Icon = st.Icon
            return (
              <button
                key={c.id}
                onClick={() => onOpen(c.target)}
                className={`w-full text-left flex items-stretch hover:bg-navy-50/40 transition-colors ${st.bg}`}
              >
                <span className={`w-1 shrink-0 ${st.bar}`} />
                <span className="flex-1 min-w-0 px-4 py-3.5 block">
                  <span className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${st.chip}`}>
                      {SEVERITY[c.severity].label}
                    </span>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${st.icon}`} />
                    <span className="text-[13px] font-bold text-navy-900">{c.condition}</span>
                  </span>
                  <span className="block text-[12px] text-steel-700 leading-relaxed mb-2">{c.detail}</span>
                  <span className="block text-[11.5px] text-navy-800 leading-relaxed">
                    <strong>{t('Decision')}:</strong> {c.decision}
                  </span>
                  <span className="inline-flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-steel-100 text-steel-600">{c.owner}</span>
                  </span>
                </span>
                <span className="shrink-0 w-[150px] px-4 py-3.5 flex flex-col justify-center items-end border-l border-steel-100/70">
                  <span className="text-[15px] font-bold text-navy-900 tabular-nums">{cr(c.value)}</span>
                  <span className="text-[10.5px] text-steel-500 text-right leading-snug">{c.valueLabel}</span>
                  <ChevronRight className="w-4 h-4 text-steel-300 mt-1" />
                </span>
              </button>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t border-steel-100 bg-steel-50/60 flex items-start gap-2.5">
          <Info className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-steel-600 leading-relaxed">{BOARD_NOTE}</p>
        </div>
      </Card>
    </div>
  )
}

function Sev({ n, label, k }) {
  const st = STYLE[k]
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-center min-w-[56px] ${st.border} ${st.bg}`}>
      <div className="text-[18px] font-bold text-navy-900 tabular-nums leading-none">{n}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-steel-500 mt-0.5">{label}</div>
    </div>
  )
}
