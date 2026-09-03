import { BadgeCheck, ExternalLink, Scale, FlaskConical, AlertTriangle } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { TONE_STYLES } from '../components/ui/KpiCard.jsx'
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

  return (
    <div>
      <SectionHeader
        eyebrow={t('Governance · Data Provenance')}
        title={t('Official Statistics')}
        description={t('Published government figures, carried here with their source, their period and the date they were read. These are the only real numbers in the platform — every other figure on every other screen is generated demonstration data.')}
      />

      {/* Scale context — the reality check the rest of the demo needs. */}
      <div className="mb-6 rounded-xl border p-5" style={{ backgroundColor: amber.bg, borderColor: amber.border }}>
        <div className="flex items-center gap-2 mb-2.5">
          <Scale className="w-4 h-4" style={{ color: amber.accent }} />
          <h2 className="text-base font-bold" style={{ color: amber.accent }}>{t('What this demonstration is, to scale')}</h2>
        </div>
        <p className="text-sm text-steel-700 leading-relaxed max-w-4xl">
          {t('This platform models {0} taxpayers across {1} districts. Maharashtra has {2} registered SGST dealers across {3} districts. The demonstration is roughly one taxpayer for every {4} real ones — it is built to show how the workflow behaves, not to represent the state’s book.',
            scale.modelledTaxpayers, scale.modelledDistricts, scale.officialDealersDisplay, scale.officialDistricts, scale.taxpayerRatio.toLocaleString('en-IN'))}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <ScaleFigure label={t('Taxpayers modelled')} value={scale.modelledTaxpayers.toLocaleString('en-IN')} kind="simulated" />
          <ScaleFigure label={t('Registered SGST dealers')} value={scale.officialDealersDisplay} kind="official" sub={t('as at {0}', scale.asAt)} />
          <ScaleFigure label={t('Districts modelled')} value={scale.modelledDistricts} kind="simulated" />
          <ScaleFigure label={t('Districts in Maharashtra')} value={scale.officialDistricts} kind="official" />
        </div>
      </div>

      <Card
        className="mb-6"
        title={t('Published figures')}
        subtitle={t('Read on {0}. Each figure links to the publication that states it.', OFFICIAL_RETRIEVED_ON)}
        padded={false}
      >
        <div className="divide-y divide-steel-100">
          {OFFICIAL_FIGURES.map(f => (
            <div key={f.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="lg:w-64 shrink-0">
                <div className="text-2xl font-bold tabular-nums" style={{ color: green.accent }}>{f.display}</div>
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
                  <a
                    href={f.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-govt-600 hover:text-govt-700 hover:underline"
                  >
                    {f.source.publisher} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={t('Sources not yet transcribed')}
        subtitle={t('Named as authoritative but not read into the platform. Listed with no figures attached — an unread source gets a link, never an estimate.')}
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
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-govt-600 hover:underline mt-1.5"
                  >
                    {d.publisher} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
