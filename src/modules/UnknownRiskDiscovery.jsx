import { Radar, ShieldQuestion, Layers, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { FilterScope } from '../components/ui/FilterScope.jsx'
import { useApp, applyScopeFilters } from '../context/AppContext.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import {
  DISCOVERIES, RECURRING_PATTERNS, SINGLETON_PATTERNS, DISCOVERY_SUMMARY,
  RULEBOOK_OVERLAP, SILENCE_EXPLAINED, PEER_COVERAGE,
  DISCOVERY_METHOD_NOTE, DISCOVERY_CAVEAT, DISCOVERY_LIMITS
} from '../data/discovery.js'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

/* Everything else in this platform scores taxpayers against nine encoded
 * rules — the department's knowledge written down. By construction those rules
 * find only what someone already thought to look for. This looks exclusively at
 * the taxpayers they miss. */
export default function UnknownRiskDiscovery() {
  const S = DISCOVERY_SUMMARY
  const { filters } = useApp()
  // The screen and the null-result proof are both statewide properties of the
  // rulebook; only the candidate list is a set of taxpayers to narrow.
  const shown = useMemo(() => DISCOVERIES.filter(d => applyScopeFilters(d, filters)), [filters])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Discovery')}
        title={t('Unknown Risk Discovery')}
        description={t('The nine encoded risk rules find what the department already knows to look for. This screen looks only at the taxpayers none of those rules touch, and asks whether any of them are statistically unlike their own sector peers — searching for patterns not yet in the rulebook rather than re-scoring the ones that are.')}
        actions={<ExportBar moduleLabel="Unknown Risk Discovery" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Population screened')} value={S.unflaggedTotal} unit={t('of {0} — trigger no encoded rule', S.populationTotal)} tone="navy" icon={ShieldQuestion} />
        <KpiCard label={t('Review candidates found')} value={S.discoveredCount} unit={t('{0}% of those screened', S.screenRate)} tone={S.discoveredCount ? 'orange' : 'steel'} icon={Radar} />
        <KpiCard label={t('Recurring patterns')} value={S.recurringPatternCount} unit={t('candidate rules not yet encoded')} tone={S.recurringPatternCount ? 'orange' : 'steel'} icon={Layers} />
        <KpiCard label={t('Exposure carried')} value={(S.discoveredExposure / 10000000).toFixed(2)} unit={t('₹ Cr across candidates')} tone="steel" icon={AlertTriangle} />
      </div>

      <FilterScope shown={shown.length} total={DISCOVERIES.length} unit={t('review candidates')} />

      {SILENCE_EXPLAINED.silent ? <NullResult /> : <Findings rows={shown} />}

      <Card title={t('Method')} className="mt-4">
        <p className="text-[12.5px] text-steel-700 leading-relaxed mb-3">{DISCOVERY_METHOD_NOTE}</p>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{t('Peer coverage')}</div>
          <p className="text-[12px] text-steel-700 leading-relaxed">
            {t('Norms computed for {0} sectors at a minimum peer group of {1}.', PEER_COVERAGE.sectorsWithNorms, PEER_COVERAGE.minGroupSize)}
            {PEER_COVERAGE.unNormedSectors.length > 0 && ' ' + t('{0} are too small to norm, so taxpayers in them are unassessed rather than cleared: {1}.', PEER_COVERAGE.unNormedSectors.length, PEER_COVERAGE.unNormedSectors.join(', '))}
          </p>
        </div>
      </Card>

      <Card title={t('What this cannot do')} className="mt-4">
        <ul className="space-y-2">
          {DISCOVERY_LIMITS.map((l, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-steel-700 leading-relaxed">
              <span className="w-1 h-1 rounded-full bg-steel-400 shrink-0 mt-2" />
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

/* A null result reported as a measured finding rather than an empty state.
 * "No anomalies found" and "this data cannot contain a findable anomaly" are
 * different claims, and only the second is true here. */
function NullResult() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-steel-300 bg-steel-50 px-5 py-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-steel-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('No review candidates on this dataset — and that is a measured result, not an empty screen.')}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">{SILENCE_EXPLAINED.reason}</p>
        </div>
      </div>

      {/* The proof, computed rather than asserted. */}
      <Card title={t('Why — the rulebook has already claimed the extreme tail')} subtitle={SILENCE_EXPLAINED.proof}>
        <DataTable
          columns={[
            { key: 'label', label: t('Behavioural ratio') },
            {
              key: 'alreadyEncoded', label: t('Already an encoded rule?'),
              render: r => r.alreadyEncoded ? <Pill tone="amber">{t('Yes')}</Pill> : <Pill tone="steel">{t('No')}</Pill>
            },
            {
              key: 'unflaggedMaxZ', label: t('Highest deviation — unflagged'), align: 'right',
              render: r => <span className="tabular-nums text-steel-600">{r.unflaggedMaxZ}</span>
            },
            {
              key: 'flaggedMaxZ', label: t('Highest deviation — already flagged'), align: 'right',
              render: r => <span className="tabular-nums font-semibold text-navy-900">{r.flaggedMaxZ}</span>
            }
          ]}
          rows={RULEBOOK_OVERLAP}
          searchable={false}
          pageSize={6}
        />
        <p className="text-[12px] text-steel-600 leading-relaxed mt-3">
          {t('The outlier threshold is {0}. No unflagged taxpayer reaches it on any ratio, while flagged taxpayers pass it comfortably. Three of these four ratios are themselves the basis of an encoded rule, so any taxpayer extreme enough to appear here has already tripped that rule and left the screened population by definition.', DISCOVERY_SUMMARY.zThreshold)}
        </p>
      </Card>

      <Card
        title={t('What would make this screen productive')}
        subtitle={t('The method is implemented and calibrated. What it lacks is a feature the rulebook does not already encode.')}
      >
        <ul className="space-y-2.5">
          {SILENCE_EXPLAINED.whatWouldUnlockIt.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-navy-800 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy-100 text-navy-700 text-[10px] font-bold flex items-center justify-center tabular-nums mt-0.5">{i + 1}</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('The honest position')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{SILENCE_EXPLAINED.honestPosition}</p>
          <p className="text-[12.5px] text-steel-700 leading-relaxed mt-2">
            {t('Lowering the threshold until results appeared would have produced a populated screen out of ordinary variation — which is the precise failure this module warns about elsewhere. The threshold has been left where the statistics put it.')}
          </p>
        </div>
      </div>
    </div>
  )
}

/* Renders when the screen has something to report — on a real extract. */
function Findings({ rows = DISCOVERIES }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-navy-800 leading-relaxed">{DISCOVERY_CAVEAT}</p>
      </div>

      <Card
        title={t('Recurring patterns — candidate rules')}
        subtitle={t('The same deviation signature across several unflagged taxpayers. This, rather than any individual case, is the discovery worth acting on.')}
      >
        <div className="space-y-3">
          {RECURRING_PATTERNS.map(p => (
            <div key={p.signature} className="rounded-lg border border-amber-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Pill tone="amber">{t('{0} taxpayers', p.support)}</Pill>
                <Pill tone="steel">{cr(p.exposure)}</Pill>
                <span className="text-[11.5px] text-steel-500">{p.sectors.join(', ')}</span>
              </div>
              <p className="text-[12.5px] text-navy-800 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.members.map(mem => (
                  <span key={mem.gstin} className="text-[11px] px-2 py-0.5 rounded-md border border-steel-200 bg-steel-50 text-navy-800">
                    {mem.tradeName}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {RECURRING_PATTERNS.length === 0 && (
            <p className="text-[12.5px] text-steel-500">{t('No signature recurs across enough taxpayers to be worth encoding as a rule.')}</p>
          )}
        </div>
      </Card>

      <Card
        title={t('Individual review candidates')}
        subtitle={t('{0} taxpayers, each invisible to all nine encoded rules. {1} carry a signature seen only once, which is an anecdote rather than a pattern.', DISCOVERIES.length, SINGLETON_PATTERNS.length)}
      >
        <DataTable
          columns={[
            { key: 'tradeName', label: t('Taxpayer') },
            { key: 'sector', label: t('Sector'), render: r => t(r.sector) },
            { key: 'division', label: t('Division'), render: r => t(r.division) },
            {
              key: 'deviation', label: t('Strongest deviation'),
              render: r => {
                const d = r.deviations[0]
                return (
                  <div>
                    <div className="text-[12px] text-navy-800">{d.label} — {d.direction}</div>
                    <div className="text-[11px] text-steel-500 tabular-nums">
                      {t('{0}× the sector median (n={1})', d.timesPeer ?? '—', d.peerCount)}
                    </div>
                  </div>
                )
              }
            },
            { key: 'maxZ', label: t('Deviation'), align: 'right', render: r => <span className="tabular-nums font-semibold">{r.maxZ}</span> },
            { key: 'exposure', label: t('Exposure'), align: 'right', render: r => `₹${(r.exposure / 100000).toFixed(1)} L` }
          ]}
          rows={rows}
          pageSize={12}
        />
      </Card>
    </div>
  )
}
