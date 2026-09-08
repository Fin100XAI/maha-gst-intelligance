import { useState, useMemo } from 'react'
import { Layers, GitBranch, ClipboardList, Info, CheckCircle2, AlertTriangle, XCircle, Bot, FileSpreadsheet, Cpu } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
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
import { FILES } from '../data/extractSpec.js'
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

/* Which requested columns name which engine.
 *
 * The extract specification already states, field by field, the engines a
 * column serves. Indexing it the other way round is what turns a verdict into
 * something a data owner can act on: an engine marked blocked stops being an
 * opinion and becomes "these columns, in these files". Nothing is asserted here
 * that is not written in extractSpec.js — only re-indexed. */
function buildFieldIndex() {
  const index = {}
  FILES.forEach(f => {
    f.fields.forEach(fld => {
      const named = String(fld.unlocks || '').match(/\d+/g) || []
      named.forEach(n => {
        if (!index[n]) index[n] = { columns: 0, files: new Set() }
        index[n].columns += 1
        index[n].files.add(f.file)
      })
    })
  })
  return index
}

/* Fifteen engines against the fields that actually exist. The verdicts are
 * evidenced rather than asserted, because the purpose is to separate what can
 * be validated in the pilot from what would be a promise. */
export default function EngineStack() {
  const [tab, setTab] = useState('engines')
  const S = STACK_SUMMARY

  const derived = useMemo(() => {
    const fieldIndex = buildFieldIndex()
    const named = ENGINES.filter(e => fieldIndex[e.n])
    const techniqueCounts = Object.keys(TECHNIQUES).map(key => ({
      key,
      count: ENGINES.filter(e => e.technique.includes(key)).length
    })).filter(x => x.count > 0)
    return {
      fieldIndex,
      namedCount: named.length,
      techniqueCounts,
      requestedColumns: FILES.reduce((n, f) => n + f.fields.length, 0)
    }
  }, [])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Delivery')}
        title={t('Engine Stack & Data Readiness')}
        description={<MethodNote short={t('Fifteen engines against the fields the department can supply today.')} full={t('Fifteen intelligence engines mapped against the fields the department can supply today, each classified by technique and given a verdict backed by something checkable. The purpose is to separate what can be built and validated from what would be a promise.')} />}
        actions={<ExportBar moduleLabel="Engine Stack & Data Readiness" />}
      />

      <FilterNotApplicable reason={t('It reports on the platform’s engines and the fields available to them, which are properties of the data as a whole rather than of any district or sector.')} />

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
        <KpiCard label={t('Built')} value={S.built} unit={t('of {0} engines', S.total)} tone="green" icon={CheckCircle2} />
        <KpiCard label={t('Partial')} value={S.partial} unit={t('the supported half is built')} tone="amber" icon={AlertTriangle} />
        <KpiCard label={t('Blocked')} value={S.blocked} unit={t('missing input, not effort')} tone="red" icon={XCircle} />
        <KpiCard label={t('Graph hops absent')} value={S.graphHopsAbsent} unit={t('of {0} in the spine', S.totalHops)} tone="red" icon={GitBranch} />
        <KpiCard
          label={t('Named by the extract')}
          value={derived.namedCount}
          unit={t('of {0}, across {1} requested columns', S.total, derived.requestedColumns)}
          tone="navy"
          icon={FileSpreadsheet}
        />
      </div>

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'engines' && <EnginesView derived={derived} />}
      {tab === 'graph' && <GraphView />}
      {tab === 'pilot' && <PilotView derived={derived} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function EnginesView({ derived }) {
  const { setActiveModule } = useApp()
  const order = ['built', 'partial', 'blocked']

  return (
    <div className="space-y-4">
      {/* The technique labels are chips on every engine below; this is where
        * they say what they mean and what each one needs to work. */}
      <Card tone="green"
        title={t('What the technique labels mean')}
        subtitle={t('Every engine below carries one or more of these. The label is not decoration — it states what the engine needs before it can run.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {derived.techniqueCounts.map(tc => (
            <div key={tc.key} className="px-5 py-2.5 flex flex-wrap items-start gap-2">
              <Cpu className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
              <Pill tone="navy">{t(TECHNIQUES[tc.key].label)}</Pill>
              <span className="text-[11px] text-steel-500 shrink-0">{t('{0} engines', tc.count)}</span>
              <p className="text-[11.5px] text-steel-700 leading-relaxed flex-1 min-w-[220px]">{t(TECHNIQUES[tc.key].note)}</p>
            </div>
          ))}
        </div>
      </Card>

      {order.map(st => {
        const items = ENGINES.filter(e => e.status === st)
        const meta = STATUS[st]
        const tone = TONE[meta.tone]
        return (
          <Card tone="blue" key={st} title={t('{0} — {1} engines', t(meta.label), items.length)} subtitle={t(meta.note)} padded={false}>
            <div className="divide-y divide-steel-100">
              {items.map(e => {
                const cols = derived.fieldIndex[e.n]
                return (
                  <div key={e.n} className={`px-5 py-4 ${tone.bg}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="shrink-0 w-6 h-6 rounded-md bg-navy-800 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">{e.n}</span>
                      <span className="text-[13.5px] font-bold text-navy-900">{t(e.name)}</span>
                      {e.technique.map(tk => <Pill key={tk} tone="navy">{t(TECHNIQUES[tk].label)}</Pill>)}
                      <span className={`ml-auto text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tone.chip}`}>{t(meta.label)}</span>
                    </div>
                    <p className="text-[12px] text-steel-600 italic leading-relaxed mb-2.5">{t(e.answers)}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('What exists')}</div>
                        <p className="text-[11.5px] text-navy-800 leading-relaxed">{t(e.have)}</p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50/40 px-3 py-2.5">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('What is missing')}</div>
                        <p className="text-[11.5px] text-navy-800 leading-relaxed">{t(e.missing)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-2 mt-2.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-steel-400 shrink-0 mt-0.5">{t('Evidence')}</span>
                      <span className="text-[11.5px] text-steel-700 leading-relaxed flex-1 min-w-0">{t(e.evidence)}</span>
                      {e.where && (
                        <button
                          onClick={() => setActiveModule(e.where)}
                          className="shrink-0 text-[11px] font-semibold text-govt-700 hover:underline"
                        >
                          {t('Open screen')} →
                        </button>
                      )}
                    </div>

                    {/* What the pilot extract would put in front of this engine. */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-steel-200/70">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                      <span className="text-[11px] text-steel-600">
                        {cols
                          ? t('{0} requested columns name this engine, in {1} of the {2} extract files', cols.columns, cols.files.size, FILES.length)
                          : t('No requested column in the extract names this engine')}
                      </span>
                      {cols && [...cols.files].map(fname => (
                        <code key={fname} className="text-[10.5px] text-steel-600 bg-steel-100 px-1.5 py-0.5 rounded">{fname}</code>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      <div className="rounded-xl border border-steel-300 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <Bot className="w-4.5 h-4.5 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('On generative AI')}</div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(GENAI_NOTE)}</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label={t('Hops present')} value={S.graphHopsPresent} unit={t('of {0}', S.totalHops)} tone="green" icon={CheckCircle2} />
        <KpiCard label={t('Hops partial')} value={S.graphHopsPartial} unit={t('held at the wrong grain')} tone="amber" icon={AlertTriangle} />
        <KpiCard label={t('Hops absent')} value={S.graphHopsAbsent} unit={t('every cross-entity capability fails here')} tone="red" icon={XCircle} />
      </div>

      <Card tone="red"
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
                  <p className="text-[11.5px] text-steel-600 leading-relaxed mt-0.5">{t(h.note)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card tone="yellow" title={t('On the architecture')}>
        <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(ARCHITECTURE_NOTE)}</p>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function PilotView({ derived }) {
  const { setActiveModule } = useApp()
  const notBuilt = ENGINES.filter(e => e.status !== 'built')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-navy-200 bg-navy-50/60 px-5 py-4 flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-navy-600 shrink-0 mt-0.5" />
        <MethodNote className="text-[12.5px] text-navy-800 leading-relaxed" short={t('Four additions to the extract, in the order that unlocks most.')} full={t('Four additions to the 500-case extract, in the order that unlocks most. The first is five columns and unblocks four engines; the modelling for all of them already exists and is waiting on the fields.')} />
      </div>

      {PILOT_REQUIREMENTS.map(r => (
        <Card tone="green" key={r.id} title={t('{0}. {1}', r.priority, t(r.field))}>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <Pill tone={r.priority === 1 ? 'red' : r.priority === 2 ? 'amber' : 'steel'}>{t('Priority {0} of {1}', r.priority, PILOT_REQUIREMENTS.length)}</Pill>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5 mb-2.5">
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('Unlocks')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(r.unlocks)}</p>
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(r.why)}</p>
        </Card>
      ))}

      {/* The join between this page and the column list. An engine that is not
        * built is here with the files that would supply it, so the pilot
        * request can be checked against the verdicts rather than trusted. */}
      <Card tone="blue"
        title={t('Every engine not yet built, and the extract files that would supply it')}
        subtitle={t('{0} of {1} engines are partial or blocked. Column counts are read from the extract specification, which states engine by engine what each field is for.', notBuilt.length, ENGINES.length)}
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead className="bg-steel-50 border-b border-steel-200">
              <tr className="text-left text-[9.5px] font-bold uppercase tracking-wider text-steel-500">
                <th className="px-4 py-2">{t('Engine')}</th>
                <th className="px-3 py-2">{t('Verdict')}</th>
                <th className="px-3 py-2 text-right">{t('Columns requested')}</th>
                <th className="px-4 py-2">{t('Extract files')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {notBuilt.map(e => {
                const cols = derived.fieldIndex[e.n]
                const meta = STATUS[e.status]
                return (
                  <tr key={e.n} className={e.status === 'blocked' ? 'bg-red-50/40' : ''}>
                    <td className="px-4 py-2 align-top">
                      <span className="text-steel-400 tabular-nums mr-1.5">{e.n}</span>
                      <span className="font-semibold text-navy-900">{t(e.name)}</span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Pill tone={meta.tone === 'red' ? 'red' : 'amber'}>{t(meta.label)}</Pill>
                    </td>
                    <td className="px-3 py-2 align-top text-right tabular-nums text-navy-900">{cols ? cols.columns : 0}</td>
                    <td className="px-4 py-2 align-top text-steel-600">
                      {cols
                        ? [...cols.files].map(fname => (
                            <code key={fname} className="inline-block text-[10.5px] text-steel-600 bg-steel-100 px-1.5 py-0.5 rounded mr-1 mb-1">{fname}</code>
                          ))
                        : <span className="text-steel-400">{t('None')}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-steel-100">
          <button
            onClick={() => setActiveModule('extract-spec')}
            className="text-[11.5px] font-semibold text-govt-700 hover:underline"
          >
            {t('Open the field-level extract specification')} →
          </button>
        </div>
      </Card>
    </div>
  )
}
