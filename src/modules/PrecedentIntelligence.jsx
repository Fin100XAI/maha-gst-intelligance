import { useMemo, useState } from 'react'
import { Scale, Gavel, Landmark, Library, AlertTriangle, ArrowUpRight, MinusCircle, ExternalLink, Clock, FileWarning } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
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
import { STATUTORY_SOURCES } from '../data/statutory.js'
import { FilterScope, FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { t } from '../i18n/index.js'

// Pill has no orange; conflicting authority reads as amber in the badge set.
const pillTone = s => (s === 'orange' ? 'amber' : s)
const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const crn = n => Math.round((n / 10000000) * 100) / 100
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const FORUM_COUNT = Object.keys(FORUMS).length

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
        description={<MethodNote short={t('Weighted by the forum that gave the decision, not by how similar the facts look.')} full={t('Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look. A judgment from another State’s High Court does not bind a Maharashtra authority, and a judgment under appeal is a liability rather than support.')} />}
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

  /* How the authorities divide, in the only two terms that decide what an
   * officer may do with them: does it bind here, and does it still stand. */
  const authority = useMemo(() => {
    const auths = status.authorities
    const persuasive = auths.filter(a => !FORUMS[a.forum].bindingInMaharashtra).length
    const undecided = auths.length - status.forDept - status.forAssessee
    const counts = {}
    auths.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    const postures = Object.keys(STATUS)
      .filter(k => counts[k])
      .map(k => ({ key: k, count: counts[k], meta: STATUS[k] }))
    return { total: auths.length, persuasive, undecided, postures }
  }, [status])

  /* The caseload the question actually reaches. The authorities above are law
   * and do not narrow with the filter bar; only these proceedings do. */
  const affected = useMemo(() => {
    const rows = all.filter(r => applyScopeFilters(r, filters))
    const sum = rs => rs.reduce((s, r) => s + r.exposure, 0)
    const live = rows.filter(r => r.daysRemaining >= 0)
    const noticed = rows.filter(r => r.noticeIssued)
    const awaitingNotice = rows.filter(r => !r.noticeIssued)
    const within90 = live.filter(r => r.daysRemaining <= 90)
    const barred = rows.filter(r => r.daysRemaining < 0)

    // Which contested notification each deadline actually rests on. The label
    // and the caveat come from the limitation engine, which owns them.
    const byNotification = Object.values(rows.reduce((acc, r) => {
      const key = (r.sources || []).find(s => STATUTORY_SOURCES[s] && STATUTORY_SOURCES[s].contested) || 'unattributed'
      acc[key] = acc[key] || { id: key, key, cases: 0, exposure: 0 }
      acc[key].cases++
      acc[key].exposure += r.exposure
      return acc
    }, {})).sort((a, b) => b.exposure - a.exposure)

    return {
      rows,
      total: sum(rows),
      totalCr: crn(sum(rows)),
      noticedCount: noticed.length,
      noticedCr: crn(sum(noticed)),
      awaitingCount: awaitingNotice.length,
      awaitingCr: crn(sum(awaitingNotice)),
      barredCount: barred.length,
      barredCr: crn(sum(barred)),
      within90: within90.length,
      nearestDays: live.length ? Math.min(...live.map(r => r.daysRemaining)) : null,
      byNotification,
      ifStruckDown: all.ifStruckDown,
      ifUpheld: all.ifUpheld
    }
  }, [all, filters])

  const tone = TONE_STYLES[status.tone] || TONE_STYLES.amber

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* The first fact about any authority: does it bind the officer reading it. */}
        <KpiCard
          label={t('Binding in Maharashtra')}
          value={status.bindingCount}
          unit={t('of {0} authorities on record — {1} persuasive only', authority.total, authority.persuasive)}
          tone={status.bindingCount ? 'green' : 'red'}
          icon={Landmark}
        />
        <KpiCard
          label={t('Authorities favouring the department')}
          value={status.forDept}
          unit={t('of {0} — {1} favour the assessee, {2} undecided', authority.total, status.forAssessee, authority.undecided)}
          tone="steel"
          icon={Gavel}
        />
        <KpiCard
          label={t('Exposure riding on the question')}
          value={affected.totalCr}
          unit={t('₹ Cr across {0} of {1} contested proceedings', affected.rows.length, all.length)}
          tone="orange"
          icon={AlertTriangle}
        />
        {/* What has to be decided before the question is answered for them. */}
        <KpiCard
          label={t('Nearest deadline among them')}
          value={affected.nearestDays === null ? t('None live') : affected.nearestDays}
          unit={affected.nearestDays === null
            ? t('every affected proceeding is already time-barred')
            : t('days · {0} of {1} fall due within 90 days', affected.within90, affected.rows.length)}
          tone={affected.nearestDays !== null && affected.nearestDays <= 90 ? 'red' : 'amber'}
          icon={Clock}
        />
      </div>

      {/* The question itself, and the platform's verdict on whether it is settled. */}
      <div className="rounded-xl border shadow-card overflow-hidden" style={{ borderColor: tone.border }}>
        <div className="px-5 py-3.5 border-b" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: tone.accent }}>{t('Question of law')}</div>
          <div className="text-[15px] font-bold text-navy-900 leading-snug">{t(q.label)}</div>
        </div>
        <div className="bg-white px-5 py-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={pillTone(status.tone)}>{t(status.verdict)}</Pill>
            <span className="text-[11.5px] text-steel-500">{t(q.affects)}</span>
          </div>
          <p className="text-[13px] text-navy-800 leading-relaxed">{t(status.text, ...(status.textArgs || []))}</p>
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('Why it matters')}</div>
            <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(q.whyItMatters)}</p>
          </div>
        </div>
      </div>

      {/* Posture, counted. Every authority on the question is in exactly one of
          these states, and the state decides what an officer may do with it —
          which is a different question from which way it went. */}
      <Card
        title={t('What may be done with each authority today')}
        subtitle={t('Every authority on this question sits in exactly one posture. The posture, not the outcome, decides whether it can be relied on in a notice.')}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {authority.postures.map(p => (
            <div key={p.key} className="px-5 py-3 flex flex-wrap items-start gap-x-3 gap-y-1.5">
              <Pill tone={pillTone(p.meta.tone)}>{t(p.meta.label)}</Pill>
              <span className="text-[12px] font-semibold text-navy-900 tabular-nums shrink-0">
                {t('{0} of {1} authorities', p.count, authority.total)}
              </span>
              <p className="text-[12px] text-steel-600 leading-relaxed flex-1 min-w-[16rem]">{t(p.meta.note)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Authority ladder — ordered by binding weight, which is the only order
          that helps an officer decide what to rely on. */}
      <Card
        title={t('Authorities, ranked by binding weight')}
        subtitle={<MethodNote short={t('Ordered by forum. Authority is law and does not narrow with the filters.')} full={t('Ordered by the forum, not by date or similarity. Authority is law and does not narrow with the filter bar — only the caseload below it does. Where a case name could not be established from a published source it is left blank rather than invented.')} />}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {[...status.authorities]
            .sort((a, b) => FORUMS[a.forum].rank - FORUMS[b.forum].rank)
            .map(a => <AuthorityRow key={a.id} a={a} onOpen={() => logAction(`Opened authority ${a.id}`, 'Precedent Intelligence')} />)}
        </div>
      </Card>

      <FilterScope shown={affected.rows.length} total={all.length} unit={t('affected proceedings')}
        ignores={{
          dateRange: 'This screen reads a current-state register rather than a stream of dated events, so there is no date on the records to narrow against.',
          taxpayerType: 'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.'
        }}
      />

      {/* The link from the legal question to the actual caseload, with the two
          sides of the exposure counted rather than described. */}
      <Card
        title={t('Proceedings that turn on this question')}
        subtitle={t('{0} proceedings totalling {1} have a limitation date that rests on the contested notifications.', affected.rows.length, cr(affected.total))}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-red-200 bg-red-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('If the notifications are struck down')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(affected.ifStruckDown)}</p>
            <div className="mt-2 pt-2 border-t border-red-200/70 space-y-1">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-steel-600">{t('Notice already issued — the order clock rests on the extension')}</span>
                <span className="font-semibold text-navy-900 tabular-nums shrink-0 ml-2">
                  {t('{0} · ₹{1} Cr', affected.noticedCount, affected.noticedCr)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-steel-600">{t('No notice yet — the window to issue at all rests on it')}</span>
                <span className="font-semibold text-navy-900 tabular-nums shrink-0 ml-2">
                  {t('{0} · ₹{1} Cr', affected.awaitingCount, affected.awaitingCr)}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('If they are upheld')}</div>
            <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(affected.ifUpheld)}</p>
            <div className="mt-2 pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[11.5px]">
              <span className="text-steel-600">{t('Already past the binding date on the extended clock')}</span>
              <span className="font-semibold text-navy-900 tabular-nums shrink-0 ml-2">
                {t('{0} · ₹{1} Cr', affected.barredCount, affected.barredCr)}
              </span>
            </div>
          </div>
        </div>

        {/* Which notification the exposure actually rests on. The authorities
            above are addressed to specific notifications, so this is what
            connects a judgment to a proceeding. */}
        <div className="rounded-lg border border-steel-200 bg-steel-50/70 px-3.5 py-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <FileWarning className="w-3.5 h-3.5 text-steel-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-steel-500">{t('The notification each deadline rests on')}</span>
          </div>
          <div className="space-y-2">
            {affected.byNotification.map(n => (
              <div key={n.key} className="rounded-md border border-steel-200 bg-white px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-semibold text-navy-900">
                    {STATUTORY_SOURCES[n.key] ? t(STATUTORY_SOURCES[n.key].label) : t('Not attributed to a contested notification')}
                  </span>
                  <span className="ml-auto text-[11.5px] font-semibold text-navy-900 tabular-nums">
                    {t('{0} of {1} proceedings · ₹{2} Cr', n.cases, affected.rows.length, crn(n.exposure))}
                  </span>
                </div>
                {STATUTORY_SOURCES[n.key] && (
                  <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(STATUTORY_SOURCES[n.key].note)}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <DataTable
          columns={[
            { key: 'tradeName', label: t('Taxpayer') },
            { key: 'fy', label: t('Financial year') },
            { key: 'division', label: t('Division'), render: r => t(r.division) },
            { key: 'bindingLabel', label: t('Deadline that binds'), render: r => t(r.bindingLabel) },
            { key: 'bindingDate', label: t('Deadline relied on'), align: 'right' },
            {
              key: 'daysRemaining',
              label: t('Days left'),
              align: 'right',
              sortValue: r => r.daysRemaining,
              render: r => (
                <span className="inline-flex items-center gap-1.5">
                  <span className="tabular-nums">{r.daysRemaining}</span>
                  <Pill tone={pillTone(r.urgency.tone)}>{t(r.urgency.label)}</Pill>
                </span>
              )
            },
            { key: 'exposure', label: t('Exposure'), align: 'right', sortValue: r => r.exposure, render: r => `₹${(r.exposure / 100000).toFixed(1)} L` }
          ]}
          rows={affected.rows}
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
        <Pill tone={pillTone(st.tone)}>{t(st.label)}</Pill>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-steel-500">
          <favour.Icon className="w-3 h-3" />{t(favour.label)}
        </span>
      </div>

      {a.caseName
        ? <div className="text-[12.5px] text-navy-700 italic mb-1">{a.caseName}{a.decidedOn ? ` — ${a.decidedOn}` : ''}</div>
        : <div className="text-[12px] text-steel-400 mb-1">{t('Case name not established from a published source, and deliberately not stated.')}</div>}

      <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(a.holding)}</p>

      {/* Where this sits on the ladder, and what its posture costs an officer
          who relies on it. Both sentences are the engine's own. */}
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-md border border-steel-200 bg-steel-50/70 px-3 py-2">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-500 mb-0.5">
            {t('Forum — rank {0} of {1}', forum.rank, FORUM_COUNT)}
          </div>
          <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(forum.note)}</p>
        </div>
        <div className="rounded-md border border-steel-200 bg-steel-50/70 px-3 py-2">
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-steel-500 mb-0.5">{t('Whether it still stands')}</div>
          <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(st.note)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className="text-[10.5px] text-steel-500">{t(a.verified)}</span>
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
  const roll = useMemo(() => {
    const withRate = rows.filter(r => r.successRatePct !== null).length
    const totalCases = rows.reduce((s, r) => s + r.totalCases, 0)
    const concluded = rows.reduce((s, r) => s + r.concludedCount, 0)
    const confirmed = rows.reduce((s, r) => s + r.confirmed, 0)
    const reversed = rows.reduce((s, r) => s + r.reversed, 0)
    const remanded = rows.reduce((s, r) => s + r.remanded, 0)
    return { withRate, totalCases, concluded, confirmed, reversed, remanded, concludedPct: pct(concluded, totalCases) }
  }, [rows])

  return (
    <div className="space-y-4">
      {/* Nothing on this tab narrows: DEPARTMENTAL_PRECEDENT is computed over
          the whole register by the precedent engine, and re-deriving a filtered
          version here would be a second engine answering the same question. */}
      <FilterNotApplicable reason={t('Departmental outcome history is computed once over the whole register by the precedent engine; a division-level version would be a second computation of the same figure, and the two would eventually disagree.')} />

      {/* This is a finding, not a caveat. A department that cannot state a
          success rate on any question of law has just learned something
          actionable about its own record-keeping. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">
            {roll.withRate === 0
              ? t('No question of law yet carries enough concluded proceedings to state a success rate')
              : t('{0} of {1} questions carry enough concluded proceedings to state a success rate', roll.withRate, rows.length)}
          </div>
          <MethodNote className="text-[12.5px] text-steel-700 leading-relaxed" short={t('A rate drawn from two or three cases misleads rather than informs.')} full={t('A success rate computed on two or three concluded cases is not a weak signal — it is a misleading one, and an officer who relies on it has been misled by arithmetic. Below the five-case threshold this module reports the count and withholds the rate. That the threshold is rarely met is itself the finding: departmental outcome history is too thin to guide case strategy, and building it is a data-capture problem before it is an analytics one.')} />
          {/* The gap, sized. This is the number that turns the caveat into work. */}
          <MethodNote className="text-[12.5px] text-navy-800 leading-relaxed mt-2" short={t('Only concluded proceedings carry an outcome. Pending ones contribute nothing.')} full={t('{0} of {1} proceedings on the register have concluded and carry an outcome — {2}%. Of those, {3} were confirmed, {4} reversed and {5} remanded. Every proceeding still pending contributes nothing to this record until it concludes.',
              roll.concluded, roll.totalCases, roll.concludedPct, roll.confirmed, roll.reversed, roll.remanded)} />
        </div>
      </div>

      <Card
        title={t('Departmental outcomes by question of law')}
        subtitle={<MethodNote short={t('This department\'s own record, grouped by the legal question.')} full={t('This department’s own concluded proceedings, grouped by the legal question rather than by sector. Institutional memory — not judicial authority, and not citable as precedent.')} />}
      >
        <DataTable
          columns={[
            { key: 'issue', label: t('Question of law'), render: r => t(r.issue) },
            { key: 'totalCases', label: t('Total'), align: 'right' },
            { key: 'pendingCount', label: t('Still pending'), align: 'right' },
            {
              key: 'concludedCount',
              label: t('Concluded'),
              align: 'right',
              sortValue: r => r.concludedCount,
              render: r => <span className="tabular-nums">{t('{0} of {1}', r.concludedCount, r.totalCases)}</span>
            },
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
        <MethodNote className="text-[11.5px] text-steel-600 leading-relaxed mt-3" short={t('The withheld cells are the point — each shows how far short the record falls.')} full={t('The withheld cells are the point. Each states the concluded count that produced it, so an officer can see exactly how far short of the threshold the record falls rather than being handed a rate that the sample cannot carry.')} />
      </Card>

      {/* A limitation worth naming: the department's own outcome record is
          keyed to its case-file issue categories, and the questions of law on
          the first tab are not. Nothing in the data joins them. */}
      <div className="rounded-xl border border-steel-200 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <Library className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <MethodNote className="text-[12.5px] text-steel-700 leading-relaxed" short={t('Grouped by the issue on the case file, which is not the question of law.')} full={t('These rows are grouped by the issue category recorded on the case file. The questions of law on the first tab are held separately and nothing in the record joins the two, so this module cannot say how the department has fared on the Section 168A question specifically. That is a data-capture gap — outcomes are not captured against the question that decided them — and it is stated rather than bridged with an assumed mapping.')} />
      </div>

      <Card
        title={t('Where the department’s position is already weak')}
        subtitle={<MethodNote short={t('Recorded at assessment, not inferred — shown against its own denominator.')} full={t('Recorded on the case file at the time of assessment, not inferred by a model. Each count is shown against the proceedings on that issue, because three weak files out of four is a different problem from three out of forty.')} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.filter(r => r.weakDocs || r.weakPrecedent).map(r => (
            <div key={r.issue} className="rounded-lg border border-steel-200 bg-white px-3.5 py-3">
              <div className="text-[12.5px] font-semibold text-navy-900 mb-2">{t(r.issue)}</div>
              <div className="space-y-1">
                {r.weakDocs > 0 && (
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-steel-600">{t('Documentation gap')}</span>
                    <span className="font-semibold text-[#C5221F] tabular-nums">{t('{0} of {1}', r.weakDocs, r.totalCases)}</span>
                  </div>
                )}
                {r.weakPrecedent > 0 && (
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-steel-600">{t('Precedent unfavourable')}</span>
                    <span className="font-semibold text-amber-700 tabular-nums">{t('{0} of {1}', r.weakPrecedent, r.totalCases)}</span>
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
      <FilterNotApplicable reason={t('This tab states the rules by which authority is weighted. They are law, and they are the same in every division and for every sector.')} />

      <Card
        title={t('Forum hierarchy, from the position of a Maharashtra authority')}
        subtitle={<MethodNote short={t('Binding weight depends on the deciding authority, not on the wording.')} full={t('Binding weight is relative to the deciding authority. The same judgment carries different weight for an officer in another State, which is why jurisdiction is modelled rather than assumed.')} />}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {Object.entries(FORUMS).map(([key, f]) => (
            <div key={key} className="px-5 py-3.5 flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-steel-100 text-steel-600 text-[11px] font-bold flex items-center justify-center tabular-nums">{f.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-navy-900">{t(f.label)}</span>
                  <Pill tone={f.bindingInMaharashtra ? 'green' : 'steel'}>
                    {f.bindingInMaharashtra ? t('Binding') : t('Not binding')}
                  </Pill>
                  <span className="ml-auto text-[10.5px] text-steel-400 tabular-nums">{t('Rank {0} of {1}', f.rank, FORUM_COUNT)}</span>
                </div>
                <p className="text-[12px] text-steel-600 leading-relaxed mt-0.5">{t(f.note)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('Status classifications')} subtitle={t('A precedent under challenge is worse than none — relying on it creates exposure the officer did not know they had.')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} className="rounded-lg border border-steel-200 bg-white px-3.5 py-3">
              <Pill tone={pillTone(s.tone)}>{t(s.label)}</Pill>
              <p className="text-[12px] text-steel-600 leading-relaxed mt-2">{t(s.note)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Same discipline as the Case Digital Twin and the Copilot: name what is
          missing rather than approximate it. */}
      <div className="rounded-xl border border-steel-200 bg-steel-50 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Library className="w-4 h-4 text-steel-400" />
          <span className="text-[13px] font-bold text-navy-900">{t(CORPUS_STATE.label)}</span>
          <Pill tone="amber">{CORPUS_STATE.connected ? t('Connected') : t('Not integrated')}</Pill>
        </div>
        <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(CORPUS_STATE.note)}</p>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#C5221F] shrink-0 mt-0.5" />
        <MethodNote className="text-[12px] text-navy-800 leading-relaxed" short={t('No citation here is generated. An unconfirmed case name is left blank.')} full={t('No case citation on this screen is generated. Where a holding was confirmed but the case name was not, the name is left blank. A fabricated citation inside an issued notice makes the notice defective and the platform indefensible, so the model is not permitted to supply one.')} />
      </div>
    </div>
  )
}
