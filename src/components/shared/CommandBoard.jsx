import { AlertOctagon, AlertTriangle, Eye, ChevronRight, Info, Gavel } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { CONDITIONS, SEVERITY, BOARD_SUMMARY, BOARD_NOTE } from '../../data/commandBoard.js'
import { t } from '../../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

const STYLE = {
  critical: { bar: 'bg-[#C5221F]', chip: 'bg-[#C5221F] text-white', border: 'border-red-300', head: 'bg-red-50', bg: 'bg-white', Icon: AlertOctagon, icon: 'text-[#C5221F]', text: 'text-[#C5221F]' },
  high: { bar: 'bg-orange-500', chip: 'bg-orange-500 text-white', border: 'border-orange-200', head: 'bg-orange-50', bg: 'bg-white', Icon: AlertTriangle, icon: 'text-orange-600', text: 'text-orange-700' },
  watch: { bar: 'bg-amber-400', chip: 'bg-amber-400 text-navy-900', border: 'border-amber-200', head: 'bg-amber-50', bg: 'bg-white', Icon: Eye, icon: 'text-amber-600', text: 'text-amber-700' }
}
const ORDER = ['critical', 'high', 'watch']
const maxValue = Math.max(...CONDITIONS.map(c => c.value), 1)

/* A triage board, not a list. Three columns by irreversibility, each condition
 * a card carrying the decision it demands and who takes it — a line with no
 * decision attached is a statistic, and statistics belong on the analytics
 * screens. */
export function CommandBoard({ onOpen }) {
  const B = BOARD_SUMMARY
  const total = B.irreversibleValue + B.atRiskValue || 1
  const lostPct = (B.irreversibleValue / total) * 100

  return (
    <Card tone="blue"
      title={t('Active conditions')}
      subtitle={t('Grouped by irreversibility, not by value. {0} of the {1} need a decision at Commissioner level.', B.commissionerDecisions, CONDITIONS.length)}
    >
      {/* One bar, two facts: how much is already gone against how much is still
          in play. The proportion is the point, not either figure alone. */}
      <div className="mb-4">
        <div className="flex h-11 rounded-lg overflow-hidden border border-steel-200">
          <div className="bg-[#C5221F] flex items-center px-3 min-w-0" style={{ width: `${lostPct}%` }}>
            <span className="text-[11.5px] font-bold text-white tabular-nums truncate">{cr(B.irreversibleValue)}</span>
          </div>
          <div className="bg-navy-700 flex items-center justify-end px-3 min-w-0 flex-1">
            <span className="text-[11.5px] font-bold text-white tabular-nums truncate">{cr(B.atRiskValue)}</span>
          </div>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#C5221F]">
            {t('Irreversible — {0}% of the total', Math.round(lostPct))}
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-navy-700">{t('Still in play')}</span>
        </div>
      </div>

      {/* Triage columns. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {ORDER.map(sev => {
          const st = STYLE[sev]
          const items = CONDITIONS.filter(c => c.severity === sev)
          const Icon = st.Icon
          const groupValue = items.reduce((s, c) => s + c.value, 0)
          return (
            <div key={sev} className={`rounded-xl border overflow-hidden ${st.border}`}>
              <div className={`px-3.5 py-2.5 ${st.head} border-b ${st.border}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 shrink-0 ${st.icon}`} />
                  <span className="text-[12px] font-bold text-navy-900">{t(SEVERITY[sev].label)}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${st.chip}`}>{items.length}</span>
                  <span className="ml-auto text-[12px] font-bold text-navy-900 tabular-nums">{cr(groupValue)}</span>
                </div>
                <p className="text-[10.5px] text-steel-600 leading-snug mt-1">{t(SEVERITY[sev].meaning)}</p>
              </div>

              <div className="divide-y divide-steel-100">
                {items.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onOpen(c.target)}
                    title={t(c.detail, ...(c.detailArgs || []))}
                    className="w-full text-left px-3.5 py-3 hover:bg-navy-50/50 transition-colors block"
                  >
                    <span className="flex items-start gap-1.5 mb-1.5">
                      <span className="text-[12.5px] font-bold text-navy-900 leading-snug flex-1">{t(c.condition, ...(c.conditionArgs || []))}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-steel-300 shrink-0 mt-0.5" />
                    </span>

                    {/* Value, and the same value as a bar against the largest
                        condition on the board — so scale reads without arithmetic. */}
                    <span className="flex items-center gap-2 mb-2">
                      <span className={`text-[13px] font-bold tabular-nums ${st.text}`}>{cr(c.value)}</span>
                      <span className="text-[10px] text-steel-500 truncate">{t(c.valueLabel)}</span>
                    </span>
                    <span className="block h-1.5 rounded-full bg-steel-100 overflow-hidden mb-2.5">
                      <span className={`block h-full ${st.bar}`} style={{ width: `${Math.max((c.value / maxValue) * 100, 2)}%` }} />
                    </span>

                    <span className="block rounded-md bg-steel-50 border border-steel-200 px-2.5 py-2">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-steel-400 mb-0.5">{t('Decision')}</span>
                      <span className="block text-[11.5px] text-navy-800 leading-relaxed">{t(c.decision)}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 mt-2">
                      <Gavel className="w-3 h-3 text-steel-400 shrink-0" />
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${c.owner === 'Commissioner' ? 'text-navy-800' : 'text-steel-500'}`}>
                        {t(c.owner)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3 mt-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(BOARD_NOTE)}</p>
      </div>
    </Card>
  )
}
