import { useMemo, useState } from 'react'
import {
  Gavel, AlertOctagon, Timer, Landmark, ExternalLink, ScrollText, ShieldAlert,
  Users, Layers, FileWarning
} from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { LIMITATION_REGISTER, LIMITATION_SUMMARY, LIMITATION_BY_DIVISION, STATUTORY_SOURCES } from '../data/statutory.js'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const cr = n => Math.round((n / 10000000) * 100) / 100
const SECTION_LABEL = { s73: 'Section 73', s74: 'Section 74', s74A: 'Section 74A' }
const SECTION_ORDER = ['s73', 's74', 's74A']

// This screen is a worklist, not a dashboard. A Commissioner reviewing it weekly
// needs: what expires soonest, how much revenue rides on it, who is responsible,
// and — critically — the basis for the date, so the arithmetic can be checked
// rather than trusted.
export default function StatutoryTimeIntelligence() {
  const { filters } = useApp()
  const [selected, setSelected] = useState(null)

  const rows = useMemo(
    () => LIMITATION_REGISTER.filter(r => applyCaseFilters(r, filters)),
    [filters]
  )

  const scoped = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.exposure, 0)
    const live = rows.filter(r => r.daysRemaining >= 0)
    const barred = rows.filter(r => r.daysRemaining < 0)
    const within = n => live.filter(r => r.daysRemaining <= n)
    const contested = rows.filter(r => r.contested)
    const share = n => total ? Math.round((n / total) * 100) : 0
    // Where no notice has issued, the NOTICE deadline binds — months earlier
    // than the order deadline, and not curable once it passes. This split is
    // the single most decision-relevant cut on the register.
    const noNoticeLive = live.filter(r => !r.noticeIssued)
    const noNotice30 = within(30).filter(r => !r.noticeIssued)
    const sumOf = arr => arr.reduce((s, r) => s + r.exposure, 0)
    return {
      caseCount: rows.length,
      totalCr: cr(total),
      barredCount: barred.length,
      barredCr: cr(sumOf(barred)),
      barredSharePct: share(sumOf(barred)),
      within30Count: within(30).length,
      within30Cr: cr(sumOf(within(30))),
      within30SharePct: share(sumOf(within(30))),
      within90Count: within(90).length,
      within90Cr: cr(sumOf(within(90))),
      within90SharePct: share(sumOf(within(90))),
      liveCount: live.length,
      liveCr: cr(sumOf(live)),
      contested,
      contestedCr: cr(sumOf(contested)),
      contestedSharePct: share(sumOf(contested)),
      noNoticeLiveCount: noNoticeLive.length,
      noNoticeLiveCr: cr(sumOf(noNoticeLive)),
      noNotice30Count: noNotice30.length,
      noNotice30Cr: cr(sumOf(noNotice30)),
      nearestDays: live.length ? Math.min(...live.map(r => r.daysRemaining)) : null
    }
  }, [rows])

  /* Which section each proceeding runs under is not presentational. s.74
   * requires a finding of fraud, wilful misstatement or suppression and buys
   * two extra years; s.74A replaces the split from FY 2024-25. A register that
   * hides the mix hides why two cases from the same year have different dates. */
  const sectionMix = useMemo(() => SECTION_ORDER.map(key => {
    const inSection = rows.filter(r => r.section === key)
    const live = inSection.filter(r => r.daysRemaining >= 0)
    return {
      key,
      count: inSection.length,
      exposureCr: cr(inSection.reduce((s, r) => s + r.exposure, 0)),
      barredCount: inSection.filter(r => r.daysRemaining < 0).length,
      within30Count: live.filter(r => r.daysRemaining <= 30).length,
      nearestDays: live.length ? Math.min(...live.map(r => r.daysRemaining)) : null
    }
  }).filter(s => s.count > 0), [rows])

  /* Limitation is attributable to a named officer. The roll-up that matters
   * operationally is therefore not the division but the desk — who is holding
   * the nearest deadlines, and can they carry them. */
  const officerLoad = useMemo(() => {
    const map = {}
    rows.filter(r => r.daysRemaining >= 0 && r.daysRemaining <= 90).forEach(r => {
      const key = r.officer || 'Unassigned'
      map[key] = map[key] || { officer: key, cases: 0, within30: 0, exposure: 0, nearestDays: Infinity, noNotice: 0 }
      const v = map[key]
      v.cases++
      v.exposure += r.exposure
      v.nearestDays = Math.min(v.nearestDays, r.daysRemaining)
      if (r.daysRemaining <= 30) v.within30++
      if (!r.noticeIssued) v.noNotice++
    })
    return Object.values(map)
      .map(v => ({ ...v, exposureCr: cr(v.exposure) }))
      .sort((a, b) => a.nearestDays - b.nearestDays || b.exposure - a.exposure)
      .slice(0, 8)
  }, [rows])

  const columns = [
    {
      key: 'tradeName',
      label: t('Taxpayer'),
      render: r => (
        <div>
          <div className="font-semibold text-navy-800">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.gstin} · {t(r.district)}</div>
        </div>
      )
    },
    {
      key: 'fy',
      label: t('Tax period / Section'),
      render: r => (
        <div>
          <div className="font-medium text-navy-800 tabular-nums">{r.fy}</div>
          <div className="text-[11px] text-steel-500">{t(SECTION_LABEL[r.section])}</div>
        </div>
      )
    },
    {
      key: 'bindingDate',
      label: t('Binding deadline'),
      render: r => (
        <div>
          <div className="font-semibold text-navy-800 tabular-nums">{r.bindingDate}</div>
          <div className="text-[11px] text-steel-500">{t(r.bindingLabel)} {t('deadline')}</div>
        </div>
      )
    },
    {
      key: 'daysRemaining',
      label: t('Time left'),
      align: 'right',
      sortValue: r => r.daysRemaining,
      render: r => {
        const tone = TONE_STYLES[r.urgency.tone]
        return (
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: tone.accent }}>
              {r.daysRemaining < 0 ? t('Expired') : t('{0}d', r.daysRemaining)}
            </div>
            <div className="text-[10.5px]" style={{ color: tone.accent }}>{t(r.urgency.label)}</div>
          </div>
        )
      }
    },
    {
      // Where the proceeding actually stands against the clock it is running
      // on. A case still at "New" with three weeks left is a different problem
      // from one at "Hearing", and the deadline alone does not say which.
      key: 'stage',
      label: t('Stage reached'),
      render: r => (
        <div>
          <div className="text-[12px] font-medium text-navy-800">{t(r.stage)}</div>
          <div className="text-[10.5px] text-steel-500">
            {r.noticeIssued ? t('Notice issued') : t('No notice yet')}
          </div>
        </div>
      )
    },
    {
      key: 'exposure',
      label: t('Revenue exposed'),
      align: 'right',
      sortValue: r => r.exposure,
      render: r => <span className="font-semibold tabular-nums text-navy-800">{lakh(r.exposure)}</span>
    },
    { key: 'officer', label: t('Responsible officer') },
    { key: 'division', label: t('Formation'), render: r => t(r.division) },
    {
      key: 'basis',
      label: t('Basis'),
      sortable: false,
      align: 'center',
      render: r => (
        <button
          onClick={e => { e.stopPropagation(); setSelected(r) }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-steel-200 text-navy-700 hover:bg-steel-50"
        >
          <ScrollText className="w-3 h-3" /> {t('Check')}
        </button>
      )
    }
  ]

  const briefingText = () => [
    t('STATUTORY TIME INTELLIGENCE — LIMITATION EXPOSURE'),
    t('Scope: {0} · {1} · {2} · {3} proceedings of {4} on the register.',
      t(filters.district), t(filters.division), t(filters.sector), scoped.caseCount, LIMITATION_SUMMARY.totalCases),
    t('Already time-barred: ₹{0} Cr across {1} proceedings — {2}% of the exposure in view. Extinguished by operation of law; not recoverable.',
      scoped.barredCr, scoped.barredCount, scoped.barredSharePct),
    t('Expiring within 30 days: ₹{0} Cr across {1} proceedings ({2}% of exposure in view).',
      scoped.within30Cr, scoped.within30Count, scoped.within30SharePct),
    t('Expiring within 90 days: ₹{0} Cr across {1} proceedings ({2}% of exposure in view).',
      scoped.within90Cr, scoped.within90Count, scoped.within90SharePct),
    t('Of those expiring within 30 days, {0} have not yet issued a notice (₹{1} Cr). The notice deadline binds in those cases and cannot be cured once it passes.',
      scoped.noNotice30Count, scoped.noNotice30Cr),
    t('Resting on a contested extension: {0} proceedings, ₹{1} Cr ({2}% of exposure in view) — Notification 56/2023-CT, held ultra vires Section 168A by the Gauhati High Court.',
      scoped.contested.length, scoped.contestedCr, scoped.contestedSharePct),
    t('Live and in time: ₹{0} Cr across {1} proceedings. Nearest binding deadline: {2} days.',
      scoped.liveCr, scoped.liveCount, scoped.nearestDays === null ? '—' : scoped.nearestDays)
  ].join('\n')

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Statutory Risk')}
        title={t('Statutory Time Intelligence')}
        description={<MethodNote short={t('Every open proceeding against its own limitation clock.')} full={t('Every open proceeding against its own limitation clock. When a deadline passes the demand is extinguished by operation of law — this is the one exposure on the platform that is not a model but a consequence of statute.')} />}
        actions={<ExportBar moduleLabel="Statutory Time Intelligence" getBriefingText={briefingText} />}
      />

      <div className="mb-6 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('Why this leads')}</div>
        <h2 className="text-lg sm:text-xl font-bold text-navy-900 max-w-4xl leading-snug">
          {t('A risk score can be argued with. A limitation date cannot.')}
        </h2>
        <MethodNote className="text-sm text-steel-600 mt-2 max-w-4xl leading-relaxed" short={t('Revenue lost to limitation is irreversible and attributable to a date.')} full={t('Revenue lost to limitation is irreversible, unarguable, and attributable to a named officer and date. Of the ₹{0} Cr riding on the {1} proceedings in view, ₹{2} Cr has already passed its deadline — {3}% of the total — and ₹{4} Cr expires within thirty days.',
            scoped.totalCr, scoped.caseCount, scoped.barredCr, scoped.barredSharePct, scoped.within30Cr)} />
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          <Pill tone="navy">{t('{0} of {1} proceedings on the register', scoped.caseCount, LIMITATION_SUMMARY.totalCases)}</Pill>
          <Pill tone={scoped.nearestDays !== null && scoped.nearestDays <= 30 ? 'red' : 'amber'}>
            {scoped.nearestDays === null
              ? t('No proceeding in view is still in time')
              : t('Nearest binding deadline: {0} days', scoped.nearestDays)}
          </Pill>
          <Pill tone="steel">{t('{0} live proceedings await a notice — ₹{1} Cr', scoped.noNoticeLiveCount, scoped.noNoticeLiveCr)}</Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={t('Already time-barred')}
          value={scoped.barredCr}
          unit={t('₹ Cr · {0} proceedings · {1}% of exposure', scoped.barredCount, scoped.barredSharePct)}
          icon={AlertOctagon}
          tone="red"
        />
        <KpiCard
          label={t('Expiring within 30 days')}
          value={scoped.within30Cr}
          unit={t('₹ Cr · {0} proceedings · {1}% of exposure', scoped.within30Count, scoped.within30SharePct)}
          icon={Timer}
          tone="orange"
        />
        <KpiCard
          label={t('Expiring within 90 days')}
          value={scoped.within90Cr}
          unit={t('₹ Cr · {0} proceedings · {1}% of exposure', scoped.within90Count, scoped.within90SharePct)}
          icon={Gavel}
          tone="amber"
        />
        <KpiCard
          label={t('Live exposure in time')}
          value={scoped.liveCr}
          unit={t('₹ Cr · {0} proceedings still open', scoped.liveCount)}
          icon={Landmark}
          tone="green"
        />
      </div>

      {scoped.barredCount > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-maharisk-critical shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-steel-700 leading-relaxed">
            <strong className="text-maharisk-critical">{t('₹{0} Cr across {1} proceedings is already time-barred.', scoped.barredCr, scoped.barredCount)}</strong>{' '}
            {t('These cannot be revived by effort or by priority — the demand is extinguished by operation of law. The action on them is not recovery but a record of how each came to lapse, since the date and the responsible officer are both on the register.')}
          </div>
        </div>
      )}

      {scoped.noNotice30Count > 0 && (
        <div className="mb-4 rounded-xl border border-saffron-300 bg-saffron-50 px-4 py-3 flex items-start gap-2.5">
          <FileWarning className="w-4 h-4 text-saffron-700 shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-saffron-900 leading-relaxed">
            <strong>{t('{0} proceedings expiring within 30 days have not yet issued a notice — ₹{1} Cr.', scoped.noNotice30Count, scoped.noNotice30Cr)}</strong>{' '}
            {t('Where no notice has issued it is the notice deadline that binds, and it falls months before the order deadline. Once it passes the order deadline is of no use: nothing later in the proceeding can cure it. These are the cases to clear first.')}
          </div>
        </div>
      )}

      {scoped.contested.length > 0 && (
        <div className="mb-6 rounded-xl border border-saffron-300 bg-saffron-50 px-4 py-3 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-saffron-700 shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-saffron-900 leading-relaxed">
            <strong>{t('{0} proceeding(s) carrying ₹{1} Cr — {2}% of the exposure in view — rest on a contested extension.', scoped.contested.length, scoped.contestedCr, scoped.contestedSharePct)}</strong>{' '}
            {t('Their deadline depends on Notification 56/2023-CT, which the Gauhati High Court has held ultra vires Section 168A. A demand relying on it carries live litigation risk and should be reviewed with the Legal Cell before action.')}
          </div>
        </div>
      )}

      <Card
        className="mb-6"
        title={t('Limitation register')}
        subtitle={<MethodNote short={t('Where no notice has issued, the notice deadline binds — months earlier.')} full={t('Ranked by how soon the binding deadline falls. Where no notice has issued the notice deadline binds — it falls months before the order deadline and is the one most often missed.')} />}
      >
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder={t('Search the register...')}
          pageSize={12}
        />
        <HumanReviewBadge label={t('Computed from statute — verify against the case record before acting')} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card
          title={t('Desks carrying the nearest deadlines')}
          subtitle={t('Officers holding a proceeding due within 90 days, in view. Limitation attaches to a named officer, so this is the roll-up that decides a reallocation.')}
          padded={false}
        >
          {officerLoad.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-steel-400">
              {t('No proceeding in view falls due within 90 days.')}
            </div>
          ) : (
            <div className="divide-y divide-steel-100">
              {officerLoad.map(o => (
                <div key={o.officer} className="px-5 py-3 flex items-center gap-3">
                  <Users className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy-900 truncate">{o.officer}</div>
                    <div className="text-[11px] text-steel-500 tabular-nums">
                      {t('{0} due within 90 days · ₹{1} Cr · {2} awaiting a notice', o.cases, o.exposureCr, o.noNotice)}
                    </div>
                  </div>
                  {o.within30 > 0 && <Pill tone="red">{t('{0} within 30d', o.within30)}</Pill>}
                  <div className="w-16 text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-steel-400 font-semibold">{t('Nearest')}</div>
                    <div className="text-sm font-bold tabular-nums text-navy-800">{t('{0}d', o.nearestDays)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title={t('Section mix')}
          subtitle={<MethodNote short={t('The section decides the length of the clock.')} full={t('Which power each proceeding is running under. The section decides the length of the clock, and s.74 is available only on a finding of fraud, wilful misstatement or suppression.')} />}
          padded={false}
        >
          {sectionMix.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-steel-400">{t('No proceedings in view.')}</div>
          ) : (
            <div className="divide-y divide-steel-100">
              {sectionMix.map(s => (
                <div key={s.key} className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-steel-400 shrink-0" />
                    <span className="text-sm font-bold text-navy-900">{t(SECTION_LABEL[s.key])}</span>
                    {s.barredCount > 0 && <Pill tone="red">{t('{0} time-barred', s.barredCount)}</Pill>}
                    {s.within30Count > 0 && <Pill tone="amber">{t('{0} within 30d', s.within30Count)}</Pill>}
                    <span className="ml-auto text-sm font-bold tabular-nums text-navy-800">{t('₹{0} Cr', s.exposureCr)}</span>
                  </div>
                  <div className="text-[11px] text-steel-500 mt-1 tabular-nums">
                    {s.nearestDays === null
                      ? t('{0} proceedings · none still in time', s.count)
                      : t('{0} proceedings · nearest deadline {1} days', s.count, s.nearestDays)}
                  </div>
                  <p className="text-[12px] text-steel-600 mt-1.5 leading-relaxed">{t(STATUTORY_SOURCES[s.key].note)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title={t('Formation exposure')}
          subtitle={<MethodNote short={t('Statewide roll-up — this panel is not narrowed by the filters.')} full={t('Which divisions carry the nearest deadlines. Statewide roll-up from the limitation engine — this panel is not narrowed by the header filters, unlike every figure above it.')} />}
          padded={false}
        >
          <div className="divide-y divide-steel-100">
            {LIMITATION_BY_DIVISION.map(v => (
              <div key={v.division} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy-900 truncate">{t(v.division)}</div>
                  <div className="text-[11px] text-steel-500 tabular-nums">
                    {t('{0} proceedings · ₹{1} Cr exposed', v.cases, v.exposureCr)}
                  </div>
                </div>
                {v.criticalCount > 0 && <Pill tone="red">{t('{0} critical', v.criticalCount)}</Pill>}
                <div className="w-20 text-right">
                  <div className="text-[10px] uppercase tracking-wider text-steel-400 font-semibold">{t('Nearest')}</div>
                  <div className="text-sm font-bold tabular-nums text-navy-800">
                    {v.nearestDays === null ? '—' : t('{0}d', v.nearestDays)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('Statutory basis')} subtitle={t('The rules this register computes from')} padded={false}>
          <div className="divide-y divide-steel-100">
            {Object.entries(STATUTORY_SOURCES).map(([key, src]) => (
              <div key={key} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-navy-900">{t(src.label)}</div>
                  {src.contested && <Pill tone="red">{t('Contested')}</Pill>}
                </div>
                <p className="text-[12px] text-steel-600 mt-1 leading-relaxed">{t(src.note)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {selected && (
        <Modal open title={t('Basis for this deadline')} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-bold text-navy-900">{selected.tradeName}</div>
              <div className="text-[11.5px] text-steel-500">{selected.gstin} · {selected.district} · {t(selected.division)}</div>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
              <Row label={t('Tax period')} value={selected.fy} />
              <Row label={t('Section invoked')} value={t(SECTION_LABEL[selected.section])} />
              <Row label={t('Annual return due')} value={selected.annualReturnDue} />
              <Row label={t('Notice deadline')} value={selected.noticeDeadline} />
              <Row label={t('Order deadline')} value={selected.orderDeadline} />
              <Row label={t('Currently binding')} value={`${t(selected.bindingLabel)} — ${selected.bindingDate}`} />
              <Row label={t('Stage reached')} value={t(selected.stage)} />
              <Row
                label={t('Time left')}
                value={selected.daysRemaining < 0
                  ? t('Expired {0} days ago', Math.abs(selected.daysRemaining))
                  : t('{0} days — {1}', selected.daysRemaining, t(selected.urgency.label))}
              />
              <Row label={t('Revenue exposed')} value={lakh(selected.exposure)} />
              <Row label={t('Responsible officer')} value={selected.officer} />
            </dl>
            <div className="rounded-lg border border-steel-200 bg-steel-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('How this date is computed')}</div>
              <p className="text-[12.5px] text-steel-700 leading-relaxed">{t(selected.basis)}</p>
            </div>
            {!selected.noticeIssued && selected.daysRemaining >= 0 && (
              <div className="rounded-lg border border-saffron-300 bg-saffron-50 px-3 py-2.5 text-[12px] text-saffron-900 leading-relaxed">
                {t('No notice has issued, so the notice deadline of {0} is what binds here — not the order deadline of {1}. Once the notice date passes the proceeding cannot be saved by anything done later.',
                  selected.noticeDeadline, selected.orderDeadline)}
              </div>
            )}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('Authority')}</div>
              <div className="space-y-1.5">
                {selected.sources.map(k => (
                  <a
                    key={k}
                    href={STATUTORY_SOURCES[k].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-1.5 text-[12px] text-govt-600 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{t(STATUTORY_SOURCES[k].label)}</span>
                  </a>
                ))}
              </div>
            </div>
            {selected.contested && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-steel-700 leading-relaxed">
                {t('This deadline depends on a notification held ultra vires by the Gauhati High Court. Review with the Legal Cell before relying on it.')}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{label}</dt>
      <dd className="text-navy-800 font-medium tabular-nums">{value}</dd>
    </div>
  )
}
