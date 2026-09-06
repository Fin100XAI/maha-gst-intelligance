import { useMemo, useState } from 'react'
import { Scale, Gavel, Landmark, Library, AlertTriangle, ArrowUpRight, MinusCircle, ExternalLink } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import {
  FORUMS, STATUS, LEGAL_QUESTIONS,
  questionStatus, casesTurningOn, DEPARTMENTAL_PRECEDENT, CORPUS_STATE
} from '../data/precedent.js'
import { FilterScope, FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { t } from '../i18n/index.js'

// Pill has no orange; conflicting authority reads as amber in the badge set.
const pillTone = s => (s === 'orange' ? 'amber' : s)
const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

const TABS = [
  { key: 'questions', label: 'Questions of law', icon: Scale },
  { key: 'departmental', label: 'Departmental record', icon: Library },
  { key: 'model', label: 'How authority is weighted', icon: Gavel }
]

/* Precedent as authority, not similarity.
 *
 * The version this replaces matched cases on sector and called the result
 * "comparable" and "historical". Neither was true. What an officer needs to know
 * about a prior decision is which forum gave it, whether it binds Maharashtra,
 * and whether it still stands — none of which similarity can tell them. */
export default function PrecedentIntelligence() {
  const { logAction } = useApp()
  const [tab, setTab] = useState('questions')

  return (
    <div>
      <SectionHeader
        eyebrow={t('Enforcement · Legal Authority')}
        title={t('Precedent Intelligence')}
        description={t('Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look. A judgment from another State’s High Court does not bind a Maharashtra authority, and a judgment under appeal is a liability rather than support.')}
        actions={<ExportBar moduleLabel="Precedent Intelligence" />}
      />

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'questions' && <QuestionsView logAction={logAction} />}
      {tab === 'departmental' && <DepartmentalView />}
      {tab === 'model' && <ModelView />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function QuestionsView({ logAction }) {
  const { filters } = useApp()
  const q = LEGAL_QUESTIONS[0]
  const status = useMemo(() => questionStatus(q.id), [q.id])
  const all = useMemo(() => casesTurningOn(q.id), [q.id])
  // The authorities are law and do not narrow. Only the caseload does.
  const affected = useMemo(() => {
    const rows = all.filter(r => applyScopeFilters(r, filters))
    return Object.assign(rows, {
      exposureCr: Math.round((rows.reduce((s, r) => s + r.exposure, 0) / 10000000) * 100) / 100,
      ifStruckDown: all.ifStruckDown,
      ifUpheld: all.ifUpheld
    })
  }, [all, filters])
  const tone = TONE_STYLES[status.tone] || TONE_STYLES.amber

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label={t('Status of the question')} value={status.bindingCount ? t('Settled') : t('Unsettled')} tone={status.tone} icon={Scale} />
        <KpiCard label={t('Authorities on record')} value={status.authorities.length} unit={t('({0} for dept, {1} for assessee)', status.forDept, status.forAssessee)} tone="steel" icon={Gavel} />
        <KpiCard label={t('Binding in Maharashtra')} value={status.bindingCount} unit={t('of {0}', status.authorities.length)} tone={status.bindingCount ? 'green' : 'red'} icon={Landmark} />
        <KpiCard label={t('Departmental exposure')} value={affected.exposureCr} unit={t('₹ Cr across {0} proceedings', affected.length)} tone="orange" icon={AlertTriangle} />
      </div>

      {/* The question itself, and the platform's verdict on whether it is settled. */}
      <div className="rounded-xl border shadow-card overflow-hidden" style={{ borderColor: tone.border }}>
        <div className="px-5 py-3.5 border-b" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: tone.accent }}>{t('Question of law')}</div>
          <div className="text-[15px] font-bold text-navy-900 leading-snug">{q.label}</div>
        </div>
        <div className="bg-white px-5 py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={pillTone(status.tone)}>{status.verdict}</Pill>
            <span className="text-[11.5px] text-steel-500">{q.affects}</span>
          </div>
          <p className="text-[13px] text-navy-800 leading-relaxed">{status.text}</p>
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('Why it matters')}</div>
            <p className="text-[12.5px] text-steel-700 leading-relaxed">{q.whyItMatters}</p>
          </div>
        </div>
      </div>

      {/* Authority ladder — ordered by binding weight, which is the only order
          that helps an officer decide what to rely on. */}
      <Card
        title={t('Authorities, ranked by binding weight')}
        subtitle={t('Ordered by the forum, not by date or similarity. Where a case name could not be established from a published source it is left blank rather than invented.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {[...status.authorities]
            .sort((a, b) => FORUMS[a.forum].rank - FORUMS[b.forum].rank)
            .map(a => <AuthorityRow key={a.id} a={a} onOpen={() => logAction(`Opened authority ${a.id}`, 'Precedent Intelligence')} />)}
        </div>
      </Card>

      <FilterScope shown={affected.length} total={all.length} unit={t('affected proceedings')} />

      {/* The link from the legal question to the actual caseload. */}
      <Card
        title={t('Proceedings that turn on this question')}
        subtitle={t('{0} proceedings totalling {1} have a limitation date that rests on the contested notifications.', affected.length, cr(affected.exposureCr * 10000000))}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-red-200 bg-red-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('If the notifications are struck down')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">{affected.ifStruckDown}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('If they are upheld')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">{affected.ifUpheld}</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'tradeName', label: t('Taxpayer') },
            { key: 'fy', label: t('Financial year') },
            { key: 'division', label: t('Division'), render: r => t(r.division) },
            { key: 'bindingDate', label: t('Deadline relied on'), align: 'right' },
            { key: 'exposure', label: t('Exposure'), align: 'right', render: r => `₹${(r.exposure / 100000).toFixed(1)} L` }
          ]}
          rows={affected}
        />
      </Card>
    </div>
  )
}

function AuthorityRow({ a, onOpen }) {
  const forum = FORUMS[a.forum]
  const st = STATUS[a.status]
  const favour = a.favours === 'department'
    ? { label: 'Favours the department', tone: 'green', Icon: ArrowUpRight }
    : a.favours === 'assessee'
      ? { label: 'Favours the assessee', tone: 'red', Icon: AlertTriangle }
      : { label: 'Undecided', tone: 'steel', Icon: MinusCircle }

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-2 mb-1.5">
        <span className="text-[13.5px] font-bold text-navy-900">{a.court}</span>
        {/* The single most important fact on this row. */}
        <Pill tone={forum.bindingInMaharashtra ? 'green' : 'steel'}>
          {forum.bindingInMaharashtra ? t('Binding in Maharashtra') : t('Persuasive only')}
        </Pill>
        <Pill tone={pillTone(st.tone)}>{st.label}</Pill>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-steel-500">
          <favour.Icon className="w-3 h-3" />{t(favour.label)}
        </span>
      </div>

      {a.caseName
        ? <div className="text-[12.5px] text-navy-700 italic mb-1">{a.caseName}{a.decidedOn ? ` — ${a.decidedOn}` : ''}</div>
        : <div className="text-[12px] text-steel-400 mb-1">{t('Case name not established from a published source, and deliberately not stated.')}</div>}

      <p className="text-[12.5px] text-steel-700 leading-relaxed">{a.holding}</p>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="text-[10.5px] text-steel-500">{a.verified}</span>
        <a
          href={a.source} target="_blank" rel="noopener noreferrer" onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-govt-700 hover:underline"
        >
          {t('Source')}<ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function DepartmentalView() {
  const rows = DEPARTMENTAL_PRECEDENT
  const withRate = rows.filter(r => r.successRatePct !== null).length

  return (
    <div className="space-y-4">
      {/* This is a finding, not a caveat. A department that cannot state a
          success rate on any question of law has just learned something
          actionable about its own record-keeping. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">
            {withRate === 0
              ? t('No question of law yet carries enough concluded proceedings to state a success rate')
              : t('{0} of {1} questions carry enough concluded proceedings to state a success rate', withRate, rows.length)}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">
            {t('A success rate computed on two or three concluded cases is not a weak signal — it is a misleading one, and an officer who relies on it has been misled by arithmetic. Below the five-case threshold this module reports the count and withholds the rate. That the threshold is rarely met is itself the finding: departmental outcome history is too thin to guide case strategy, and building it is a data-capture problem before it is an analytics one.')}
          </p>
        </div>
      </div>

      <Card
        title={t('Departmental outcomes by question of law')}
        subtitle={t('This department’s own concluded proceedings, grouped by the legal question rather than by sector. Institutional memory — not judicial authority, and not citable as precedent.')}
      >
        <DataTable
          columns={[
            { key: 'issue', label: t('Question of law'), render: r => t(r.issue) },
            { key: 'totalCases', label: t('Total'), align: 'right' },
            { key: 'concludedCount', label: t('Concluded'), align: 'right' },
            { key: 'confirmed', label: t('Confirmed'), align: 'right' },
            { key: 'reversed', label: t('Reversed'), align: 'right' },
            { key: 'remanded', label: t('Remanded'), align: 'right' },
            {
              key: 'successRatePct',
              label: t('Success rate'),
              align: 'right',
              render: r => r.successRatePct === null
                ? <span className="text-[11px] text-steel-400 italic">{t('withheld — n={0}', r.concludedCount)}</span>
                : <span className="font-semibold tabular-nums">{r.successRatePct}%</span>
            },
            { key: 'disputedCr', label: t('Disputed'), align: 'right', render: r => `₹${r.disputedCr} Cr` }
          ]}
          rows={rows}
        />
      </Card>

      <Card
        title={t('Where the department’s position is already weak')}
        subtitle={t('Recorded on the case file at the time of assessment, not inferred by a model.')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.filter(r => r.weakDocs || r.weakPrecedent).map(r => (
            <div key={r.issue} className="rounded-lg border border-steel-200 bg-white px-3.5 py-3">
              <div className="text-[12.5px] font-semibold text-navy-900 mb-2">{t(r.issue)}</div>
              <div className="space-y-1">
                {r.weakDocs > 0 && (
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-steel-600">{t('Documentation gap')}</span>
                    <span className="font-semibold text-[#C5221F] tabular-nums">{r.weakDocs}</span>
                  </div>
                )}
                {r.weakPrecedent > 0 && (
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-steel-600">{t('Precedent unfavourable')}</span>
                    <span className="font-semibold text-amber-700 tabular-nums">{r.weakPrecedent}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11.5px] pt-1 border-t border-steel-100">
                  <span className="text-steel-500">{t('Median age')}</span>
                  <span className="tabular-nums text-steel-600">{r.medianAgeingDays} {t('days')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function ModelView() {
  return (
    <div className="space-y-4">
      <Card
        title={t('Forum hierarchy, from the position of a Maharashtra authority')}
        subtitle={t('Binding weight is relative to the deciding authority. The same judgment carries different weight for an officer in another State, which is why jurisdiction is modelled rather than assumed.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {Object.entries(FORUMS).map(([key, f]) => (
            <div key={key} className="px-5 py-3.5 flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-steel-100 text-steel-600 text-[11px] font-bold flex items-center justify-center tabular-nums">{f.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-navy-900">{f.label}</span>
                  <Pill tone={f.bindingInMaharashtra ? 'green' : 'steel'}>
                    {f.bindingInMaharashtra ? t('Binding') : t('Not binding')}
                  </Pill>
                </div>
                <p className="text-[12px] text-steel-600 leading-relaxed mt-0.5">{f.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('Status classifications')} subtitle={t('A precedent under challenge is worse than none — relying on it creates exposure the officer did not know they had.')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} className="rounded-lg border border-steel-200 bg-white px-3.5 py-3">
              <Pill tone={pillTone(s.tone)}>{s.label}</Pill>
              <p className="text-[12px] text-steel-600 leading-relaxed mt-2">{s.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Same discipline as the Case Digital Twin and the Copilot: name what is
          missing rather than approximate it. */}
      <div className="rounded-xl border border-steel-200 bg-steel-50 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Library className="w-4 h-4 text-steel-400" />
          <span className="text-[13px] font-bold text-navy-900">{CORPUS_STATE.label}</span>
          <Pill tone="amber">{CORPUS_STATE.connected ? t('Connected') : t('Not integrated')}</Pill>
        </div>
        <p className="text-[12.5px] text-steel-700 leading-relaxed">{CORPUS_STATE.note}</p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#C5221F] shrink-0 mt-0.5" />
        <p className="text-[12px] text-navy-800 leading-relaxed">
          {t('No case citation on this screen is generated. Where a holding was confirmed but the case name was not, the name is left blank. A fabricated citation inside an issued notice makes the notice defective and the platform indefensible, so the model is not permitted to supply one.')}
        </p>
      </div>
    </div>
  )
}
