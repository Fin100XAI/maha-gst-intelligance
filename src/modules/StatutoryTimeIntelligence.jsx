import { useMemo, useState } from 'react'
import { Gavel, AlertOctagon, Timer, Landmark, ExternalLink, ScrollText, ShieldAlert } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { useApp, applyCaseFilters } from '../context/AppContext.jsx'
import { LIMITATION_REGISTER, LIMITATION_SUMMARY, LIMITATION_BY_DIVISION, STATUTORY_SOURCES } from '../data/statutory.js'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const SECTION_LABEL = { s73: 'Section 73', s74: 'Section 74', s74A: 'Section 74A' }

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
    const sum = f => rows.reduce((s, r) => s + f(r), 0)
    const cr = n => Math.round((n / 10000000) * 100) / 100
    const live = rows.filter(r => r.daysRemaining >= 0)
    const barred = rows.filter(r => r.daysRemaining < 0)
    const within = n => live.filter(r => r.daysRemaining <= n)
    return {
      barredCount: barred.length,
      barredCr: cr(barred.reduce((s, r) => s + r.exposure, 0)),
      within30Count: within(30).length,
      within30Cr: cr(within(30).reduce((s, r) => s + r.exposure, 0)),
      within90Count: within(90).length,
      within90Cr: cr(within(90).reduce((s, r) => s + r.exposure, 0)),
      liveCr: cr(live.reduce((s, r) => s + r.exposure, 0)),
      contested: rows.filter(r => r.contested)
    }
  }, [rows])

  const columns = [
    {
      key: 'tradeName',
      label: t('Taxpayer'),
      render: r => (
        <div>
          <div className="font-semibold text-navy-800">{r.tradeName}</div>
          <div className="text-[11px] text-steel-500">{r.gstin} · {r.district}</div>
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
              {r.daysRemaining < 0 ? t('Expired') : `${r.daysRemaining}d`}
            </div>
            <div className="text-[10.5px]" style={{ color: tone.accent }}>{t(r.urgency.label)}</div>
          </div>
        )
      }
    },
    {
      key: 'exposure',
      label: t('Revenue exposed'),
      align: 'right',
      sortValue: r => r.exposure,
      render: r => <span className="font-semibold tabular-nums text-navy-800">{lakh(r.exposure)}</span>
    },
    { key: 'officer', label: t('Responsible officer') },
    { key: 'division', label: t('Formation') },
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

  return (
    <div>
      <SectionHeader
        eyebrow={t('Leadership · Statutory Risk')}
        title={t('Statutory Time Intelligence')}
        description={t('Every open proceeding against its own limitation clock. When a deadline passes the demand is extinguished by operation of law — this is the one exposure on the platform that is not a model but a consequence of statute.')}
        actions={<ExportBar moduleLabel="Statutory Time Intelligence" />}
      />

      <div className="mb-6 rounded-xl border border-navy-200 bg-gradient-to-br from-navy-50/70 to-surface p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-govt-600 mb-2">{t('Why this leads')}</div>
        <h2 className="text-lg sm:text-xl font-bold text-navy-900 max-w-4xl leading-snug">
          {t('A risk score can be argued with. A limitation date cannot.')}
        </h2>
        <p className="text-sm text-steel-600 mt-2 max-w-4xl leading-relaxed">
          {t('Revenue lost to limitation is irreversible, unarguable, and attributable to a named officer and date. Of the proceedings in view, ₹{0} Cr has already passed its deadline and ₹{1} Cr expires within thirty days.',
            scoped.barredCr, scoped.within30Cr)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={t('Already time-barred')} value={scoped.barredCr} unit={t('₹ Cr')} icon={AlertOctagon} tone="red" />
        <KpiCard label={t('Expiring within 30 days')} value={scoped.within30Cr} unit={t('₹ Cr')} icon={Timer} tone="orange" />
        <KpiCard label={t('Expiring within 90 days')} value={scoped.within90Cr} unit={t('₹ Cr')} icon={Gavel} tone="amber" />
        <KpiCard label={t('Live exposure in time')} value={scoped.liveCr} unit={t('₹ Cr')} icon={Landmark} tone="green" />
      </div>

      {scoped.contested.length > 0 && (
        <div className="mb-6 rounded-xl border border-saffron-300 bg-saffron-50 px-4 py-3 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-saffron-700 shrink-0 mt-0.5" />
          <div className="text-[12.5px] text-saffron-900 leading-relaxed">
            <strong>{t('{0} proceeding(s) rest on a contested extension.', scoped.contested.length)}</strong>{' '}
            {t('Their deadline depends on Notification 56/2023-CT, which the Gauhati High Court has held ultra vires Section 168A. A demand relying on it carries live litigation risk and should be reviewed with the Legal Cell before action.')}
          </div>
        </div>
      )}

      <Card
        className="mb-6"
        title={t('Limitation register')}
        subtitle={t('Ranked by how soon the binding deadline falls. Where no notice has issued the notice deadline binds — it falls months before the order deadline and is the one most often missed.')}
      >
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder={t('Search the register...')}
          pageSize={12}
        />
        <HumanReviewBadge label={t('Computed from statute — verify against the case record before acting')} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title={t('Formation exposure')}
          subtitle={t('Which divisions carry the nearest deadlines')}
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
                    {v.nearestDays === null ? '—' : `${v.nearestDays}d`}
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
                  <div className="text-sm font-semibold text-navy-900">{src.label}</div>
                  {src.contested && <Pill tone="red">{t('Contested')}</Pill>}
                </div>
                <p className="text-[12px] text-steel-600 mt-1 leading-relaxed">{src.note}</p>
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
            </dl>
            <div className="rounded-lg border border-steel-200 bg-steel-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('How this date is computed')}</div>
              <p className="text-[12.5px] text-steel-700 leading-relaxed">{selected.basis}</p>
            </div>
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
                    <span>{STATUTORY_SOURCES[k].label}</span>
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
