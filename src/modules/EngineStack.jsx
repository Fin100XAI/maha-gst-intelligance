import { useState } from 'react'
import { Layers, GitBranch, ClipboardList, Info, CheckCircle2, AlertTriangle, XCircle, Bot } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import {
  ENGINES, TECHNIQUES, STATUS, GRAPH_SPINE, STACK_SUMMARY,
  PILOT_REQUIREMENTS, ARCHITECTURE_NOTE, GENAI_NOTE
} from '../data/engineStack.js'
import { t } from '../i18n/index.js'

const TABS = [
  { key: 'engines', label: 'Engine feasibility', icon: Layers },
  { key: 'graph', label: 'Intelligence graph', icon: GitBranch },
  { key: 'pilot', label: 'What the pilot extract must carry', icon: ClipboardList }
]

const TONE = {
  green: { chip: 'bg-emerald-600 text-white', border: 'border-emerald-200', bg: 'bg-emerald-50/50', Icon: CheckCircle2, icon: 'text-emerald-600' },
  amber: { chip: 'bg-amber-500 text-white', border: 'border-amber-200', bg: 'bg-amber-50/40', Icon: AlertTriangle, icon: 'text-amber-600' },
  red: { chip: 'bg-[#C5221F] text-white', border: 'border-red-200', bg: 'bg-red-50/40', Icon: XCircle, icon: 'text-[#C5221F]' }
}

/* Fifteen engines against the fields that actually exist. The verdicts are
 * evidenced rather than asserted, because the purpose is to separate what can
 * be validated in the pilot from what would be a promise. */
export default function EngineStack() {
  const [tab, setTab] = useState('engines')
  const S = STACK_SUMMARY

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Delivery')}
        title={t('Engine Stack & Data Readiness')}
        description={t('Fifteen intelligence engines mapped against the fields the department can supply today, each classified by technique and given a verdict backed by something checkable. The purpose is to separate what can be built and validated from what would be a promise.')}
        actions={<ExportBar moduleLabel="Engine Stack & Data Readiness" />}
      />

      <FilterNotApplicable reason={t('It reports on the platform’s engines and the fields available to them, which are properties of the data as a whole rather than of any district or sector.')} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Built')} value={S.built} unit={t('of {0} engines', S.total)} tone="green" icon={CheckCircle2} />
        <KpiCard label={t('Partial')} value={S.partial} unit={t('the supported half is built')} tone="amber" icon={AlertTriangle} />
        <KpiCard label={t('Blocked')} value={S.blocked} unit={t('missing input, not effort')} tone="red" icon={XCircle} />
        <KpiCard label={t('Graph hops absent')} value={S.graphHopsAbsent} unit={t('of {0} in the spine', S.totalHops)} tone="red" icon={GitBranch} />
      </div>

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'engines' && <EnginesView />}
      {tab === 'graph' && <GraphView />}
      {tab === 'pilot' && <PilotView />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function EnginesView() {
  const { setActiveModule } = useApp()
  const order = ['built', 'partial', 'blocked']

  return (
    <div className="space-y-4">
      {order.map(st => {
        const items = ENGINES.filter(e => e.status === st)
        const meta = STATUS[st]
        const tone = TONE[meta.tone]
        return (
          <Card key={st} title={t('{0} — {1} engines', meta.label, items.length)} subtitle={meta.note} padded={false}>
            <div className="divide-y divide-steel-100">
              {items.map(e => (
                <div key={e.n} className={`px-5 py-4 ${tone.bg}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="shrink-0 w-6 h-6 rounded-md bg-navy-800 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">{e.n}</span>
                    <span className="text-[13.5px] font-bold text-navy-900">{e.name}</span>
                    {e.technique.map(tk => <Pill key={tk} tone="navy">{TECHNIQUES[tk].label}</Pill>)}
                    <span className={`ml-auto text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tone.chip}`}>{meta.label}</span>
                  </div>
                  <p className="text-[12px] text-steel-600 italic leading-relaxed mb-2.5">{e.answers}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('What exists')}</div>
                      <p className="text-[11.5px] text-navy-800 leading-relaxed">{e.have}</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50/40 px-3 py-2.5">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('What is missing')}</div>
                      <p className="text-[11.5px] text-navy-800 leading-relaxed">{e.missing}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2 mt-2.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400 shrink-0 mt-0.5">{t('Evidence')}</span>
                    <span className="text-[11.5px] text-steel-700 leading-relaxed flex-1 min-w-0">{e.evidence}</span>
                    {e.where && (
                      <button
                        onClick={() => setActiveModule(e.where)}
                        className="shrink-0 text-[11px] font-semibold text-govt-700 hover:underline"
                      >
                        {t('Open screen')} →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <div className="rounded-xl border border-steel-300 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <Bot className="w-4.5 h-4.5 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('On generative AI')}</div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{GENAI_NOTE}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function GraphView() {
  const S = STACK_SUMMARY
  return (
    <div className="space-y-4">
      <Card
        title={t('The intelligence graph, hop by hop')}
        subtitle={t('{0} of {1} hops are present, {2} partial and {3} absent. The absent ones are where every cross-entity capability fails.', S.graphHopsPresent, S.totalHops, S.graphHopsPartial, S.graphHopsAbsent)}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {GRAPH_SPINE.map((h, i) => {
            const state = h.have === true ? 'green' : h.have === 'partial' ? 'amber' : 'red'
            const tone = TONE[state]
            const Icon = tone.Icon
            return (
              <div key={h.hop} className={`px-5 py-2.5 flex items-start gap-3 ${state === 'red' ? 'bg-red-50/40' : ''}`}>
                <span className="shrink-0 w-6 text-[10.5px] text-steel-400 tabular-nums pt-0.5">{i + 1}</span>
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${tone.icon}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[12.5px] font-semibold ${state === 'red' ? 'text-[#C5221F]' : 'text-navy-900'}`}>{h.hop}</span>
                    <Pill tone={state === 'green' ? 'green' : state === 'amber' ? 'amber' : 'red'}>
                      {h.have === true ? t('Present') : h.have === 'partial' ? t('Partial') : t('Absent')}
                    </Pill>
                  </div>
                  <p className="text-[11.5px] text-steel-600 leading-relaxed mt-0.5">{h.note}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title={t('On the architecture')}>
        <p className="text-[12.5px] text-navy-800 leading-relaxed">{ARCHITECTURE_NOTE}</p>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function PilotView() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy-200 bg-navy-50/60 px-5 py-4 flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-navy-600 shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-navy-800 leading-relaxed">
          {t('Four additions to the 500-case extract, in the order that unlocks most. The first is five columns and unblocks four engines; the modelling for all of them already exists and is waiting on the fields.')}
        </p>
      </div>

      {PILOT_REQUIREMENTS.map(r => (
        <Card key={r.id} title={`${r.priority}. ${r.field}`}>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5 mb-2.5">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('Unlocks')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">{r.unlocks}</p>
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{r.why}</p>
        </Card>
      ))}
    </div>
  )
}
