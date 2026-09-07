import { useMemo, useState } from 'react'
import {
  Layers, Gavel, Banknote, Network as NetworkIcon, FileText, Database,
  CircleCheck, CircleAlert, ArrowRight, Search
} from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { RiskBadge, Pill, HumanReviewBadge } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { useApp, applyGlobalFilters } from '../context/AppContext.jsx'
import { TAXPAYERS } from '../data/mockData.js'
import { buildCaseTwin, TWIN_INDEX, SOURCE_SYSTEMS } from '../data/caseTwin.js'
import { ComparableCases } from '../components/shared/ComparableCases.jsx'
import { t } from '../i18n/index.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const SECTION_LABEL = { s73: 'Section 73', s74: 'Section 74', s74A: 'Section 74A' }

const ACTION_TONE = { critical: 'red', barred: 'steel', urgent: 'orange', routine: 'navy', clear: 'green' }

// Each event on the chronology is typed so the timeline can weight it — a
// statutory deadline should not read like a page view.
const KIND_TONE = {
  deadline: 'red', notice: 'orange', proceeding: 'navy', litigation: 'navy',
  refund: 'amber', signal: 'amber', officer: 'steel', registration: 'green'
}

export default function CaseDigitalTwin() {
  const { filters } = useApp()
  const [query, setQuery] = useState('')
  const [selectedGstin, setSelectedGstin] = useState(null)

  // Only taxpayers the header filters allow, ranked by urgency of next action.
  const index = useMemo(() => {
    const allowed = new Set(TAXPAYERS.filter(x => applyGlobalFilters(x, filters)).map(x => x.gstin))
    const q = query.trim().toLowerCase()
    return TWIN_INDEX
      .filter(r => allowed.has(r.gstin))
      .filter(r => !q || `${r.gstin} ${r.tradeName}`.toLowerCase().includes(q))
      .slice(0, 60)
  }, [filters, query])

  const active = selectedGstin || index[0]?.gstin
  const twin = useMemo(() => (active ? buildCaseTwin(active) : null), [active])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Revenue · Unified Case Record')}
        title={t('Case Digital Twin')}
        description={t('One taxpayer, one chronology, one exposure, one legal position, one recommended next action — assembled from every system that holds a piece of them. Every fact states the system it came from.')}
        actions={<ExportBar moduleLabel="Case Digital Twin" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* ---- Index rail ---- */}
        <Card padded={false} className="h-fit">
          <div className="p-3 border-b border-steel-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-steel-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('Search GSTIN or trade name')}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-steel-200 bg-steel-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-govt-300"
              />
            </div>
            <div className="text-[10.5px] text-steel-500 mt-2">
              {t('{0} case(s) — ordered by how soon action is required', index.length)}
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-steel-100">
            {index.map(r => {
              const isActive = r.gstin === active
              const overdue = r.daysRemaining !== null && r.daysRemaining < 0
              const near = r.daysRemaining !== null && r.daysRemaining >= 0 && r.daysRemaining <= 30
              return (
                <button
                  key={r.gstin}
                  onClick={() => setSelectedGstin(r.gstin)}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                    isActive ? 'bg-navy-50 border-l-2 border-ink-700' : 'hover:bg-steel-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="text-xs font-semibold text-navy-900 truncate">{r.tradeName}</div>
                  <div className="text-[10.5px] text-steel-500 truncate">{r.gstin}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {r.daysRemaining !== null && (
                      <Pill tone={overdue ? 'steel' : near ? 'red' : 'amber'}>
                        {overdue ? t('Expired') : `${r.daysRemaining}d`}
                      </Pill>
                    )}
                    <span className="text-[10.5px] text-steel-500 tabular-nums ml-auto">{lakh(r.exposure)}</span>
                  </div>
                </button>
              )
            })}
            {index.length === 0 && (
              <div className="px-4 py-6 text-xs text-steel-500">{t('No cases match the current filters.')}</div>
            )}
          </div>
        </Card>

        {/* ---- The twin ---- */}
        {twin ? (
          <div className="min-w-0 space-y-4">
            {/* Identity + the single recommended action */}
            <div className="rounded-xl border border-steel-200 bg-white shadow-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-navy-900">{twin.identity.tradeName.value}</h2>
                  <div className="text-[12px] text-steel-500 mt-0.5">
                    {twin.identity.legalName.value} · {twin.gstin}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Pill tone="navy">{t(twin.identity.district.value)}</Pill>
                    <Pill tone="steel">{t(twin.identity.sector.value)}</Pill>
                    <Pill tone="steel">{t(twin.identity.filingStatus.value)}</Pill>
                    <RiskBadge category={twin.position.riskCategory.value} score={twin.position.riskScore.value} size="sm" />
                  </div>
                </div>
              </div>

              <NextAction next={twin.nextAction} />
            </div>

            {/* One exposure, one legal position — side by side, because an officer
                weighs them together and today has to open two systems to do it. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title={t('Position')} subtitle={t('What is at stake and what remains recoverable')}>
                <div className="grid grid-cols-2 gap-3">
                  <Figure label={t('Estimated exposure')} value={lakh(twin.position.exposure.value)} source={twin.position.exposure.source} tone="steel" />
                  {twin.position.recoverableNow && (
                    <Figure label={t('Recoverable now')} value={lakh(twin.position.recoverableNow.value)} source={twin.position.recoverableNow.source} tone="green" />
                  )}
                  {twin.position.decayNextWeek && (
                    <Figure label={t('Decays in 7 days')} value={`−${lakh(twin.position.decayNextWeek.value)}`} source={twin.position.decayNextWeek.source} tone="red" />
                  )}
                  {twin.position.signalAgeDays && (
                    <Figure label={t('Signal age')} value={`${twin.position.signalAgeDays.value}d`} source={twin.position.signalAgeDays.source} tone="orange" />
                  )}
                </div>
                {twin.position.triggeredRules.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-steel-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1.5">{t('Why flagged')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {twin.position.triggeredRules.map(r => (
                        <span key={r.id} className="text-[10.5px] px-1.5 py-0.5 rounded bg-steel-100 text-steel-700">
                          {t(r.label)} <span className="tabular-nums font-semibold">+{r.weight}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card title={t('Legal position')} subtitle={t('The statutory clock on this proceeding')}>
                {twin.legal ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums" style={{ color: TONE_STYLES[twin.legal.urgency.tone].accent }}>
                        {twin.legal.daysRemaining < 0 ? t('Expired') : `${twin.legal.daysRemaining}d`}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: TONE_STYLES[twin.legal.urgency.tone].accent }}>
                        {t(twin.legal.urgency.label)}
                      </span>
                    </div>
                    <div className="text-[12px] text-steel-600 mt-1">
                      {t(twin.legal.bindingLabel)} {t('deadline')} <strong className="text-navy-800 tabular-nums">{twin.legal.bindingDate}</strong>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <Pill tone="navy">{twin.legal.fy}</Pill>
                      <Pill tone="steel">{t(SECTION_LABEL[twin.legal.section])}</Pill>
                      {twin.legal.contested && <Pill tone="red">{t('Contested extension')}</Pill>}
                    </div>
                    <div className="mt-3 rounded-lg bg-steel-50 border border-steel-200 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400 mb-1">{t('How this date is computed')}</div>
                      <p className="text-[11.5px] text-steel-700 leading-relaxed">{twin.legal.basis}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-steel-500">{t('No proceeding is currently running against a statutory clock for this taxpayer.')}</p>
                )}
              </Card>
            </div>

            {/* The chronology — the thing an officer today rebuilds by hand. */}
            <Card
              title={t('Unified chronology')}
              subtitle={t('{0} events merged across systems. Today this is reconstructed by hand from each system in turn.', twin.chronology.length)}
              padded={false}
            >
              <div className="divide-y divide-steel-100 max-h-[420px] overflow-y-auto">
                {twin.chronology.map((e, i) => {
                  const tone = TONE_STYLES[KIND_TONE[e.kind] || 'steel']
                  return (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <div className="w-24 shrink-0 text-[11px] tabular-nums text-steel-500 pt-0.5">{e.date}</div>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ backgroundColor: tone.accent }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-navy-900">{t(e.title)}</div>
                        {e.detail && <div className="text-[11.5px] text-steel-600 mt-0.5 leading-relaxed">{t(e.detail)}</div>}
                      </div>
                      <span className="shrink-0 text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-steel-100 text-steel-600">
                        {SOURCE_SYSTEMS[e.source]?.owner || e.source}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title={t('Proceedings on record')} padded={false}>
                <div className="divide-y divide-steel-100">
                  <CountRow icon={FileText} label={t('Notices issued')} n={twin.proceedings.notices.length} />
                  <CountRow icon={Gavel} label={t('Audit cases')} n={twin.proceedings.audit.length} />
                  <CountRow icon={Banknote} label={t('Refund claims')} n={twin.proceedings.refunds.length} />
                  <CountRow icon={Layers} label={t('Appeals')} n={twin.proceedings.litigation.length} />
                  <CountRow icon={CircleAlert} label={t('Open compliance alerts')} n={twin.proceedings.alerts.length} />
                  <div className="px-5 py-3 flex items-center gap-2.5">
                    <NetworkIcon className="w-4 h-4 text-steel-400 shrink-0" />
                    <span className="text-[13px] text-steel-700 flex-1">{t('Network cluster')}</span>
                    <span className="text-[12px] font-semibold text-navy-800">
                      {twin.network ? `${twin.network.clusterId} · ${t(twin.network.role)}` : t('Not linked')}
                    </span>
                  </div>
                </div>
              </Card>

              {/* The other half of the twin: not just what this case IS, but
                  what happened in the concluded proceedings most like it. */}
              <ComparableCases gstin={active} />

              {/* Coverage is stated honestly — a section that is empty because a
                  feed is absent must not read as a section that is empty because
                  the taxpayer has no record. */}
              <Card title={t('Source coverage')} subtitle={t('Which systems contributed to this twin')} padded={false}>
                <div className="divide-y divide-steel-100">
                  {twin.coverage.map(c => (
                    <div key={c.key} className="px-5 py-2.5 flex items-center gap-2.5">
                      {c.contributed
                        ? <CircleCheck className="w-3.5 h-3.5 shrink-0" style={{ color: TONE_STYLES.green.accent }} />
                        : <CircleAlert className="w-3.5 h-3.5 text-steel-300 shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-navy-800 truncate">{t(c.label)}</div>
                        <div className="text-[10.5px] text-steel-500">{t(c.owner)}</div>
                      </div>
                      <Pill tone={c.connected ? 'green' : 'amber'}>
                        {c.connected ? t('Live') : t('Not integrated')}
                      </Pill>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-steel-100">
                  <p className="text-[11px] text-steel-500 leading-relaxed">
                    {t('In this demonstration no external system is connected — the twin is assembled from generated records shaped like each source. A production deployment reads these feeds directly.')}
                  </p>
                </div>
              </Card>
            </div>

            <HumanReviewBadge label={t('A unified view is decision support — verify against the source record before acting')} />
          </div>
        ) : (
          <Card><p className="text-sm text-steel-500">{t('No cases match the current filters.')}</p></Card>
        )}
      </div>
    </div>
  )
}

function NextAction({ next }) {
  const tone = TONE_STYLES[ACTION_TONE[next.urgency] || 'navy']
  const basisLabel = { statute: 'Required by statute', model: 'Model recommendation', record: 'From the case record' }[next.basis]
  return (
    <div className="mt-4 rounded-xl border p-4" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
      <div className="flex items-center gap-2 mb-1.5">
        <ArrowRight className="w-3.5 h-3.5" style={{ color: tone.accent }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tone.accent }}>
          {t('Recommended next action')}
        </span>
        <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: tone.iconBg, color: tone.accent }}>
          {t(basisLabel)}
        </span>
      </div>
      <div className="text-[15px] font-bold text-navy-900">{t(next.action)}</div>
      <p className="text-[12.5px] text-steel-700 mt-1 leading-relaxed">{next.because}</p>
    </div>
  )
}

function Figure({ label, value, source, tone }) {
  const c = TONE_STYLES[tone]
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-steel-400">{label}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color: c.accent }}>{value}</div>
      <div className="text-[9.5px] text-steel-400 mt-0.5">{SOURCE_SYSTEMS[source]?.owner || source}</div>
    </div>
  )
}

function CountRow({ icon: Icon, label, n }) {
  return (
    <div className="px-5 py-3 flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-steel-400 shrink-0" />
      <span className="text-[13px] text-steel-700 flex-1">{label}</span>
      <span className="text-[13px] font-bold tabular-nums text-navy-800">{n}</span>
    </div>
  )
}
