import { LayoutGrid, ChevronRight, Info } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { PLATFORM_MAP, PLATFORM_HEADLINES, PLATFORM_MAP_NOTE, MODULE_COUNT } from '../../data/platformMap.js'
import { MODULE_ICONS } from '../layout/moduleMeta.js'
import { t } from '../../i18n/index.js'

const TONE = {
  red: { dot: 'bg-[#C5221F]', text: 'text-[#C5221F]' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-700' },
  steel: { dot: 'bg-steel-300', text: 'text-steel-600' }
}

/* The whole platform on one screen, each row carrying the figure its own engine
 * produces — read from that engine rather than restated here, so the map and
 * the page it points at cannot drift apart. */
export function PlatformMap({ onOpen }) {
  return (
    <div className="mb-4 space-y-4">
      {/* The four figures a Commissioner would want before anything else. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORM_HEADLINES.map(h => {
          const tone = TONE[h.tone] || TONE.steel
          return (
            <button
              key={h.id}
              onClick={() => onOpen(h.id)}
              className="text-left rounded-xl border border-steel-200 bg-white px-4 py-3.5 hover:border-navy-300 hover:shadow-panel transition-all"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400">{t(h.label)}</span>
              </div>
              <div className={`text-[22px] font-bold tabular-nums leading-none ${tone.text}`}>{h.value}</div>
              <div className="text-[11px] text-steel-500 mt-1">{h.sub}</div>
            </button>
          )
        })}
      </div>

      <Card
        title={t('The platform on one screen')}
        subtitle={t('{0} screens, grouped by the question each answers. Select any row to open it.', MODULE_COUNT)}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {PLATFORM_MAP.map(g => (
            <div key={g.group} className="px-5 py-3.5">
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="text-[12px] font-bold text-navy-900">{t(g.group)}</span>
                <span className="text-[11.5px] text-steel-500 italic">{g.question}</span>
                <span className="ml-auto text-[10.5px] text-steel-400 tabular-nums">{t('{0} screens', g.modules.length)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                {g.modules.map(m => {
                  const Icon = MODULE_ICONS[m.id]
                  const tone = TONE[m.tone] || TONE.steel
                  return (
                    <button
                      key={m.id}
                      onClick={() => onOpen(m.id)}
                      className="group text-left rounded-lg border border-steel-200 bg-white hover:border-navy-300 hover:bg-navy-50/40 transition-colors px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {Icon && <Icon className="w-3.5 h-3.5 text-steel-400 shrink-0" />}
                        <span className="text-[12px] font-semibold text-navy-900 truncate">{t(m.label)}</span>
                        <ChevronRight className="w-3 h-3 text-steel-300 shrink-0 ml-auto group-hover:text-navy-500" />
                      </div>
                      <p className="text-[11px] text-steel-600 leading-snug mb-1.5">{m.answers}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`} />
                        <span className={`text-[11.5px] font-semibold tabular-nums ${tone.text}`}>{m.metric}</span>
                        {m.extra && <span className="text-[10.5px] text-steel-500 ml-auto">{m.extra}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-steel-100 bg-steel-50/60 flex items-start gap-2.5">
          <Info className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-steel-600 leading-relaxed">{PLATFORM_MAP_NOTE}</p>
        </div>
      </Card>
    </div>
  )
}
