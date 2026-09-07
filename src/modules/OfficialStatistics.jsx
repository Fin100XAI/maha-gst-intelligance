import { useMemo } from 'react'
import { BadgeCheck, ExternalLink, Scale, FlaskConical, AlertTriangle, CalendarClock, ShieldCheck, Ban } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { MethodNote } from '../components/ui/MethodNote.jsx'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { KpiCard, TONE_STYLES } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { TAXPAYERS, DISTRICTS } from '../data/mockData.js'
import {
  OFFICIAL_FIGURES, DATASET_POINTERS, OFFICIAL_RETRIEVED_ON, scaleContext
} from '../data/official.js'
import { t } from '../i18n/index.js'

// This is the one screen in the platform whose figures are NOT generated. The
// visual language is deliberately inverted from everywhere else: green
// "official source" marks instead of the amber "illustrative data" badge, and
// every figure carries a live link to the publication it came from.
export default function OfficialStatistics() {
  const scale = scaleContext(TAXPAYERS.length, DISTRICTS.length)
  const green = TONE_STYLES.green
  const amber = TONE_STYLES.amber

  /* Counts of the published set itself — how many figures, from how many
   * publishers, over how many scopes, and how many named sources are carried
   * with nothing read from them. All checkable against official.js. */
  const D = useMemo(() => ({
    publishers: [...new Set(OFFICIAL_FIGURES.map(f => f.source.publisher))],
    scopes: [...new Set(OFFICIAL_FIGURES.map(f => f.scope))],
    withSource: OFFICIAL_FIGURES.filter(f => f.source?.url).length
  }), [])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Data Provenance')}
        title={t('Official Statistics')}
        description={<MethodNote short={t('Published figures, with their source, period and the date they were read.')} full={t('Published government figures, carried here with their source, their period and the date they were read. These are the only real numbers in the platform — every other figure on every other screen is generated demonstration data.')} />}
        actions={<ExportBar moduleLabel="Official Statistics" />}
      />

      <FilterNotApplicable reason={t('The figures here are published statewide totals from CBIC, PIB and mahagst.gov.in, and cannot be narrowed to a division or sector without misrepresenting them.')} />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label={t('Published figures')}
          value={OFFICIAL_FIGURES.length}
          unit={t('from {0} publishers, {1} with a source link', D.publishers.length, D.withSource)}
          tone="green"
          icon={BadgeCheck}
        />
        <KpiCard
          label={t('Read on')}
          value={OFFICIAL_RETRIEVED_ON}
          unit={t('point-in-time capture, not a live feed')}
          tone="steel"
          icon={CalendarClock}
        />
        <KpiCard
          label={t('Named but not read')}
          value={DATASET_POINTERS.length}
          unit={t('carried with no figures attached')}
          tone="amber"
          icon={AlertTriangle}
        />
        <KpiCard
          label={t('Demonstration scale')}
          value={t('1 : {0}', scale.taxpayerRatio.toLocaleString('en-IN'))}
          unit={t('modelled taxpayer to registered dealer')}
          tone="steel"
          icon={Scale}
        />
      </div>

      {/* Scale context — the reality check the rest of the demo needs. */}
      <div className="mb-6 rounded-xl border p-5" style={{ backgroundColor: amber.bg, borderColor: amber.border }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Scale className="w-4 h-4" style={{ color: amber.accent }} />
          <h2 className="text-base font-bold" style={{ color: amber.accent }}>{t('What this demonstration is, to scale')}</h2>
        </div>
        <MethodNote className="text-sm text-steel-700 leading-relaxed max-w-4xl" short={t('The modelled scale, set against the published one.')} full={t('This platform models {0} taxpayers across {1} districts. Maharashtra has {2} registered SGST dealers across {3} districts. The demonstration is roughly one taxpayer for every {4} real ones — it is built to show how the workflow behaves, not to represent the state’s book.',
            scale.modelledTaxpayers, scale.modelledDistricts, scale.officialDealersDisplay, scale.officialDistricts, scale.taxpayerRatio.toLocaleString('en-IN'))} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <ScaleFigure label={t('Taxpayers modelled')} value={scale.modelledTaxpayers.toLocaleString('en-IN')} kind="simulated" />
          <ScaleFigure label={t('Registered SGST dealers')} value={scale.officialDealersDisplay} kind="official" sub={t('as at {0}', scale.asAt)} />
          <ScaleFigure label={t('Districts modelled')} value={scale.modelledDistricts} kind="simulated" />
          <ScaleFigure label={t('Districts in Maharashtra')} value={scale.officialDistricts} kind="official" />
        </div>
      </div>

      {/* The rule this screen exists to enforce, stated where it applies. */}
      <div className="mb-6 rounded-xl border border-navy-200 bg-navy-50/60 px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-navy-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('These {0} figures are never mixed into a computed total', OFFICIAL_FIGURES.length)}</div>
          <MethodNote className="text-[12.5px] text-navy-800 leading-relaxed" short={t('No published figure is ever mixed with a modelled one.')} full={t('No figure on this page is combined with a modelled one, and no modelled record is presented anywhere as an observation. Nothing here is fetched at run time: each figure was read by hand from the publication it links to on {0}, and only an edit to the source file can change it.', OFFICIAL_RETRIEVED_ON)} />
        </div>
      </div>

      <Card
        className="mb-6"
        title={t('Published figures')}
        subtitle={t('{0} figures over {1} scopes, read on {2}. Each links to the publication that states it and carries the exact date it speaks to.', OFFICIAL_FIGURES.length, D.scopes.length, OFFICIAL_RETRIEVED_ON)}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {OFFICIAL_FIGURES.map(f => (
            <div key={f.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="lg:w-64 shrink-0">
                <div className="text-2xl font-bold tabular-nums" style={{ color: green.accent }}>{t(f.display)}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: green.accent }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: green.accent }}>{t('Official source')}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-navy-900">{t(f.label)}</div>
                <div className="text-[11.5px] text-steel-500 mt-0.5">{t(f.period)}</div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Pill tone={f.scope === 'Maharashtra' ? 'navy' : 'steel'}>{t(f.scope)}</Pill>
                  <span className="text-[11px] text-steel-500 tabular-nums">{t('speaks to {0}', f.asAt)}</span>
                  <a
                    href={f.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-govt-600 hover:text-govt-700 hover:underline"
                  >
                    {t(f.source.publisher)} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={t('Sources not yet transcribed')}
        subtitle={t('{0} sources named as authoritative but not read into the platform. Listed with no figures attached — an unread source gets a link, never an estimate.', DATASET_POINTERS.length)}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {DATASET_POINTERS.map(d => (
            <div key={d.id} className="px-5 py-3.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-saffron-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-navy-900">{t(d.label)}</div>
                  <div className="text-[11.5px] text-steel-500 mt-0.5">{t(d.status)}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Pill tone="amber">{t('No values held')}</Pill>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-govt-600 hover:underline"
                    >
                      {t(d.publisher)} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 mt-4 flex items-start gap-2.5">
        <Ban className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <MethodNote className="text-[11.5px] text-steel-600 leading-relaxed" short={t('A figure with no publication behind it does not belong on this page.')} full={t('A figure with no publication that states it does not belong on this page. A figure republished for a period other than the one it was issued for does not either — the period and the as-at date are what tell an officer whether a number is still the current one.')} />
      </div>
    </div>
  )
}

function ScaleFigure({ label, value, kind, sub }) {
  const official = kind === 'official'
  const tone = official ? TONE_STYLES.green : TONE_STYLES.steel
  const Icon = official ? BadgeCheck : FlaskConical
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 shrink-0" style={{ color: tone.accent }} />
        <span className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: tone.accent }}>
          {official ? t('Official') : t('Simulated')}
        </span>
      </div>
      <div className="text-lg font-bold tabular-nums text-navy-900">{value}</div>
      <div className="text-[10.5px] text-steel-600 leading-snug">{label}</div>
      {sub && <div className="text-[9.5px] text-steel-400 mt-0.5">{sub}</div>}
    </div>
  )
}
