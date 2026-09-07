import { useState, useMemo } from 'react'
import {
  Library, Scale, Gavel, Globe, Sigma, Package, ExternalLink, CircleCheck, CircleAlert,
  CalendarClock, FlaskConical, ShieldAlert, Ban
} from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import {
  LEGAL_SOURCES, JUDICIAL_SOURCES, OFFICIAL_SOURCES, METHODS, SOFTWARE,
  SIMULATION_DECLARATION, RESOURCE_SUMMARY, DATASET_POINTER_LIST
} from '../data/projectResources.js'
import { STATUTORY_SOURCES } from '../data/statutory.js'
import { AUTHORITIES, FORUMS, STATUS as PRECEDENT_STATUS, questionStatus, LEGAL_QUESTIONS } from '../data/precedent.js'
import { OFFICIAL_FIGURES, OFFICIAL_RETRIEVED_ON, scaleContext } from '../data/official.js'
import { TAXPAYERS, DISTRICTS } from '../data/mockData.js'
import { t } from '../i18n/index.js'

const TABS = [
  { key: 'provenance', label: 'What is real, what is simulated', icon: CircleCheck },
  { key: 'legal', label: 'Law & judicial authority', icon: Scale },
  { key: 'data', label: 'Official data sources', icon: Globe },
  { key: 'method', label: 'Methods', icon: Sigma },
  { key: 'software', label: 'Software', icon: Package }
]

/* precedent.js carries an `orange` standing tone that the Pill does not; it is
 * mapped rather than passed through, because an unmapped tone renders a chip
 * with no class at all. */
const STANDING_TONE = { green: 'green', amber: 'amber', orange: 'amber', red: 'red' }

/* Everything the platform is built on, in one place. A platform that asks a
 * Commissioner to act on its figures should be able to show where each one
 * comes from — including the ones that come from nowhere real. */
export default function ProjectResources() {
  const [tab, setTab] = useState('provenance')
  const S = RESOURCE_SUMMARY

  /* Page-local derivations over the exports above. Nothing here restates a
   * figure with different arithmetic — the counts are of the source lists
   * themselves, which is what makes them checkable by opening the data file. */
  const D = useMemo(() => {
    const sourced = [...LEGAL_SOURCES, ...JUDICIAL_SOURCES, ...OFFICIAL_SOURCES]
    return {
      scale: scaleContext(TAXPAYERS.length, DISTRICTS.length),
      linked: sourced.filter(s => s.url).length,
      sourcedTotal: sourced.length,
      methodsWithFailure: METHODS.filter(m => m.failure && m.failure.trim()).length,
      licences: [...new Set(SOFTWARE.map(s => s.licence))],
      figureCount: OFFICIAL_FIGURES.length,
      publisherCount: new Set(OFFICIAL_FIGURES.map(f => f.source.publisher)).size,
      /* Counted rather than asserted: a pointer that ever acquired a value
       * would raise this off zero and contradict the card it sits on. */
      inferredFromPointers: DATASET_POINTER_LIST.filter(d => d.value !== undefined).length,
      question: LEGAL_QUESTIONS[0]
    }
  }, [])

  const verdict = questionStatus(D.question.id)

  return (
    <div>
      <SectionHeader
        eyebrow={t('Data Resources · Provenance')}
        title={t('Project Resources')}
        description={<MethodNote short={t('The law, judgments, published figures and methods this platform relies on.')} full={t('The law this platform encodes, the judgments it relies on, the published figures it cites, the statistical methods it applies and the software it runs on — with a plain statement of which records are simulated and which are real.')} />}
        actions={<ExportBar moduleLabel="Project Resources" />}
      />

      <FilterNotApplicable reason={t('It lists the sources, methods and software the platform is built on.')} />

      {/* The three facts a reviewer needs before reading anything below: how
        * stale the sources are, that nothing is fetched live, and the scale the
        * simulated side of the platform is built at. */}
      <div className="rounded-xl border border-steel-200 bg-steel-50 px-5 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-steel-700">
          <CalendarClock className="w-3.5 h-3.5 text-steel-400 shrink-0" />
          {t('Published sources read on {0}', OFFICIAL_RETRIEVED_ON)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-steel-700">
          <Ban className="w-3.5 h-3.5 text-steel-400 shrink-0" />
          {t('Point-in-time capture. The platform makes no network call for a figure, a model or a map.')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-steel-700">
          <FlaskConical className="w-3.5 h-3.5 text-steel-400 shrink-0" />
          {t('Simulated at 1 modelled taxpayer per {0} registered dealers — no total here is a statewide figure.', D.scale.taxpayerRatio.toLocaleString('en-IN'))}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-steel-700">
          <ExternalLink className="w-3.5 h-3.5 text-steel-400 shrink-0" />
          {t('{0} of {1} statutory, judicial and official sources carry a link to the publication that states them.', D.linked, D.sourcedTotal)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
        <KpiCard label={t('Statutory sources')} value={S.legal} unit={t('encoded, not summarised')} tone="navy" icon={Scale} />
        <KpiCard label={t('Judicial authorities')} value={S.judicial} unit={t('{0} binding in Maharashtra', verdict.bindingCount)} tone="amber" icon={Gavel} />
        <KpiCard label={t('Official data sources')} value={S.official} unit={t('{0} pointers held with no values', S.datasetPointers)} tone="green" icon={Globe} />
        <KpiCard label={t('Methods')} value={S.methods} unit={t('{0} state a failure mode', D.methodsWithFailure)} tone="steel" icon={Sigma} />
        <KpiCard label={t('Software packages')} value={S.software} unit={t('{0} licences, all open-source', D.licences.length)} tone="steel" icon={Package} />
      </div>

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'provenance' && <ProvenanceView derived={D} />}
      {tab === 'legal' && <LegalView derived={D} verdict={verdict} />}
      {tab === 'data' && <DataView derived={D} />}
      {tab === 'method' && <MethodView derived={D} />}
      {tab === 'software' && <SoftwareView derived={D} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ProvenanceView({ derived }) {
  const D = SIMULATION_DECLARATION
  const { setActiveModule } = useApp()
  const scale = derived.scale

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title={t('Simulated')}
          subtitle={t('{0} classes of record, every one generated from a fixed seed. None of it describes a real taxpayer.', D.simulated.length)}
        >
          <ul className="space-y-2">
            {D.simulated.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-navy-800 leading-relaxed">
                <CircleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>{t(s)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={t('Real')}
          subtitle={t('{0} classes of fact, each verified against a published source read on {1}.', D.real.length, D.retrievedOn)}
        >
          <ul className="space-y-2">
            {D.real.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-navy-800 leading-relaxed">
                <CircleCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t(s)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* The ratio, computed by the owner of the scale context rather than
        * restated here, so the two screens that show it cannot diverge. */}
      <Card
        title={t('The scale the simulated side is built at')}
        subtitle={t('Modelled counts set against the published ones, so the gap is explicit rather than assumed away.')}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ScaleStat label={t('Taxpayers modelled')} value={scale.modelledTaxpayers.toLocaleString('en-IN')} official={false} />
          <ScaleStat label={t('Registered SGST dealers')} value={scale.officialDealersDisplay} official sub={t('as at {0}', scale.asAt)} />
          <ScaleStat label={t('Districts modelled')} value={scale.modelledDistricts} official={false} />
          <ScaleStat label={t('Districts in Maharashtra')} value={scale.officialDistricts} official />
        </div>
        <MethodNote className="text-[12px] text-steel-600 leading-relaxed mt-3" short={t('Read every aggregate on every other screen at this scale.')} full={t('One modelled taxpayer stands for roughly {0} real registered dealers. Every aggregate on every other screen is drawn from the modelled population and must be read at that scale.', scale.taxpayerRatio.toLocaleString('en-IN'))} />
      </Card>

      <div className="rounded-xl border border-navy-200 bg-navy-50/60 px-5 py-4 flex items-start gap-3">
        <Library className="w-5 h-5 text-navy-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('The division is absolute')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(D.note)}</p>
          <button
            onClick={() => setActiveModule('official-statistics')}
            className="mt-2 text-[11.5px] font-semibold text-govt-700 hover:underline"
          >
            {t('The {0} published figures are held in Official Statistics', derived.figureCount)} →
          </button>
        </div>
      </div>
    </div>
  )
}

function ScaleStat({ label, value, official, sub }) {
  const Icon = official ? CircleCheck : FlaskConical
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${official ? 'border-emerald-200 bg-emerald-50/50' : 'border-steel-200 bg-steel-50'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 shrink-0 ${official ? 'text-emerald-600' : 'text-steel-400'}`} />
        <span className={`text-[9.5px] font-bold uppercase tracking-wider ${official ? 'text-emerald-700' : 'text-steel-500'}`}>
          {official ? t('Official') : t('Simulated')}
        </span>
      </div>
      <div className="text-lg font-bold tabular-nums text-navy-900">{value}</div>
      <div className="text-[10.5px] text-steel-600 leading-snug">{label}</div>
      {sub && <div className="text-[9.5px] text-steel-400 mt-0.5">{sub}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function LegalView({ derived, verdict }) {
  const q = derived.question
  const authorityById = useMemo(() => Object.fromEntries(AUTHORITIES.map(a => [a.id, a])), [])

  return (
    <div className="space-y-4">
      <Card
        title={t('Statute and subordinate legislation')}
        subtitle={t('Encoded as computation rather than summarised. The limitation engine computes from these, which is why its output can go into a notice.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {LEGAL_SOURCES.map(s => (
            <SourceRow key={s.id} s={s} icon={Scale} contested={STATUTORY_SOURCES[s.id]?.contested === true} />
          ))}
        </div>
      </Card>

      {/* What the four authorities actually decide, and what they are worth to
        * an officer in this state. The verdict is the precedent engine's, read
        * rather than recomputed. */}
      <Card
        title={t('The question these authorities bear on')}
        subtitle={t('{0} authorities, {1} of them decided and binding on a Maharashtra authority.', JUDICIAL_SOURCES.length, verdict.bindingCount)}
      >
        <p className="text-[12.5px] font-semibold text-navy-900 leading-relaxed">{t(q.label)}</p>
        <p className="text-[12px] text-steel-700 leading-relaxed mt-1.5">{t(q.affects)}</p>
        <div className="rounded-lg border border-red-200 bg-red-50/40 px-3.5 py-2.5 mt-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C5221F] shrink-0" />
            <span className="text-[12px] font-bold text-navy-900">{t(verdict.verdict)}</span>
            <Pill tone="steel">{t('{0} favour the department, {1} the assessee', verdict.forDept, verdict.forAssessee)}</Pill>
          </div>
          <p className="text-[11.5px] text-navy-800 leading-relaxed">{t(verdict.text)}</p>
        </div>
        <p className="text-[11.5px] text-steel-600 leading-relaxed mt-2.5">{t(q.whyItMatters)}</p>
      </Card>

      <Card
        title={t('Judicial authority')}
        subtitle={<MethodNote short={t('Verified against published reports. An unconfirmed case name is left blank.')} full={t('Verified against published reports. Where only a holding could be confirmed, the case name is left blank rather than invented, and each row states the forum, whether it binds here and whether it still stands.')} />}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {JUDICIAL_SOURCES.map(s => {
            const a = authorityById[s.id]
            const forum = a ? FORUMS[a.forum] : null
            const standing = a ? PRECEDENT_STATUS[a.status] : null
            return (
              <div key={s.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <Gavel className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
                  <span className="text-[12.5px] font-semibold text-navy-900 flex-1">{s.name}</span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-govt-700 hover:underline inline-flex items-center gap-1 text-[11px]">
                      {t('Source')}<ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {a && (
                  <div className="flex flex-wrap items-center gap-1.5 ml-5.5 mb-1.5">
                    <Pill tone="navy">{t(forum.label)}</Pill>
                    <Pill tone={forum.bindingInMaharashtra ? 'green' : 'steel'}>
                      {forum.bindingInMaharashtra ? t('Binding in Maharashtra') : t('Persuasive only')}
                    </Pill>
                    <Pill tone={STANDING_TONE[standing.tone] || 'steel'}>{t(standing.label)}</Pill>
                    <span className="text-[11px] text-steel-500">
                      {a.decidedOn ? t('Decided {0}', a.decidedOn) : t('Decision date not established')}
                    </span>
                  </div>
                )}
                <p className="text-[12px] text-steel-700 leading-relaxed ml-5.5">{t(s.detail)}</p>
                <p className="text-[11px] text-steel-500 italic leading-relaxed ml-5.5 mt-1">{t(s.verified)}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function DataView({ derived }) {
  const { setActiveModule } = useApp()

  return (
    <div className="space-y-4">
      <Card
        title={t('Official published sources')}
        subtitle={<MethodNote short={t('The figures themselves are held in Official Statistics, nowhere else.')} full={t('{0} sources, from which {1} figures published by {2} publishers have been transcribed. The figures themselves are held in Official Statistics and appear nowhere else.', OFFICIAL_SOURCES.length, derived.figureCount, derived.publisherCount)} />}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {OFFICIAL_SOURCES.map(s => <SourceRow key={s.id} s={s} icon={Globe} />)}
        </div>
        <div className="px-5 py-3 border-t border-steel-100">
          <button
            onClick={() => setActiveModule('official-statistics')}
            className="text-[11.5px] font-semibold text-govt-700 hover:underline"
          >
            {t('Open Official Statistics')} →
          </button>
        </div>
      </Card>

      {DATASET_POINTER_LIST.length > 0 && (
        <Card
          title={t('Dataset pointers held without values')}
          subtitle={<MethodNote short={t('The endpoints returned HTTP 403, so no figure was inferred from them.')} full={t('{0} pointers, {1} figures inferred from them. The endpoints returned HTTP 403 when fetched, and guessing at their contents would have been worse than leaving them empty.', DATASET_POINTER_LIST.length, derived.inferredFromPointers)} />}
        >
          <div className="space-y-2">
            {DATASET_POINTER_LIST.map((d, i) => (
              <div key={i} className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-2.5">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="text-[12px] font-semibold text-navy-900 flex-1">{t(d.label)}</span>
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-govt-700 hover:underline inline-flex items-center gap-1 text-[11px]">
                      {t('Dataset')}<ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="text-[11px] text-steel-500 mt-0.5">{t(d.publisher)}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed mt-1">{t(d.status)}</p>
                <span className="inline-block mt-1.5"><Pill tone="amber">{t('No values held')}</Pill></span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function MethodView({ derived }) {
  return (
    <Card
      title={t('Statistical and algorithmic methods')}
      subtitle={<MethodNote short={t('A method whose failure mode is not stated is one nobody can audit.')} full={t('{0} of {1} state the way they fail. A method whose failure mode is not stated is a method nobody can audit — and each names the screen that spends it, so a disputed figure can be traced to the method behind it.', derived.methodsWithFailure, METHODS.length)} />}
      padded={false}
    >
      <div className="divide-y divide-steel-100">
        {METHODS.map(m => (
          <div key={m.id} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Sigma className="w-3.5 h-3.5 text-steel-400 shrink-0" />
              <span className="text-[13px] font-bold text-navy-900">{t(m.name)}</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-steel-500">
                {t('Used by')} <Pill tone="navy">{t(m.usedBy)}</Pill>
              </span>
            </div>
            <p className="text-[12px] text-steel-700 leading-relaxed mb-2 ml-5.5">{t(m.detail)}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-5.5">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">{t('Why this one')}</div>
                <p className="text-[11.5px] text-navy-800 leading-relaxed">{t(m.why)}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/40 px-3 py-2">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#C5221F] mb-0.5">{t('How it fails')}</div>
                <p className="text-[11.5px] text-navy-800 leading-relaxed">{t(m.failure)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */

function SoftwareView({ derived }) {
  return (
    <div className="space-y-4">
      <Card
        title={t('Software')}
        subtitle={<MethodNote short={t('Every version pinned. No call to the open internet at run time.')} full={t('{0} packages under {1} licences, every version pinned. The platform makes no call to the open internet for its figures, models or maps, and runs entirely within the department’s own infrastructure.', SOFTWARE.length, derived.licences.length)} />}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {SOFTWARE.map(s => (
            <div key={s.id} className="px-5 py-3 flex flex-wrap items-center gap-2">
              <Package className="w-3.5 h-3.5 text-steel-400 shrink-0" />
              <span className="text-[12.5px] font-semibold text-navy-900">{s.name}</span>
              <code className="text-[11px] text-steel-600 bg-steel-100 px-1.5 py-0.5 rounded tabular-nums">{s.version}</code>
              <span className="text-[11.5px] text-steel-600">{t(s.role)}</span>
              <span className="ml-auto"><Pill tone="steel">{s.licence}</Pill></span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function SourceRow({ s, icon: Icon, contested }) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex flex-wrap items-start gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-steel-400 shrink-0 mt-0.5" />
        <span className="text-[12.5px] font-semibold text-navy-900 flex-1">{t(s.name)}</span>
        {contested && <Pill tone="red">{t('Under judicial challenge')}</Pill>}
        {s.usedBy && <span className="text-[11px] text-steel-500">{t(s.usedBy)}</span>}
        {s.url && (
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-govt-700 hover:underline inline-flex items-center gap-1 text-[11px]">
            {t('Source')}<ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <p className="text-[12px] text-steel-700 leading-relaxed ml-5.5">{t(s.detail)}</p>
    </div>
  )
}
