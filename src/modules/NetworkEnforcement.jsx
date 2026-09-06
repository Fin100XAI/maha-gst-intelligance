import { useState } from 'react'
import { Network, Scissors, MapPin, AlertTriangle, ShieldAlert, Info, CheckCircle2, XCircle } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import {
  NETWORK_PLANS, NETWORK_ACTION_SUMMARY, LEAD_INDICATORS,
  CUT_METHOD_NOTE, COORDINATION_NOTE, EVIDENCE_CAVEAT
} from '../data/networkAction.js'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

const TABS = [
  { key: 'where', label: 'Where to act', icon: Scissors },
  { key: 'can', label: 'Whether we can act', icon: MapPin },
  { key: 'method', label: 'Method and limits', icon: Info }
]

/* Detection is already solved by the Fake Invoice Network module. This answers
 * what comes after, and what a graph view structurally cannot: where to cut,
 * whether the department can execute it, and what coordination failure costs. */
export default function NetworkEnforcement() {
  const [tab, setTab] = useState('where')
  const S = NETWORK_ACTION_SUMMARY

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Enforcement Sequencing')}
        title={t('Network Enforcement')}
        description={t('A detected chain is not yet an enforceable case. This works out which node actually stops the circulation, whether officers exist in every division the chain touches, and what is lost when they cannot move on the same day.')}
        actions={<ExportBar moduleLabel="Network Enforcement" />}
      />

      {/* The loss that already happened, stated before anything the department
          can still influence. Ordering it first is the honest ordering. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/60 px-5 py-4 mb-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-[13.5px] font-bold text-navy-900 mb-1">
            {t('{0} of credit in these chains has already been utilised and can no longer be blocked. {1} remains.', cr(S.utilisedCr * 10000000), cr(S.blockableCr * 10000000))}
          </div>
          <p className="text-[12.5px] text-steel-700 leading-relaxed">
            {t('That share was lost before detection, not through any decision taken since. It is stated first because it sets the scale of everything below: the sequencing decisions on this screen govern the remainder, and no amount of coordination recovers what has already moved through the chain. The largest available gain in network enforcement is earlier detection, not better choreography.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label={t('Chains under analysis')} value={S.clusterCount} unit={t('{0} span more than one division', S.multiDivisionClusters)} tone="navy" icon={Network} />
        <KpiCard label={t('Still blockable')} value={S.blockableCr} unit={t('₹ Cr across all chains')} tone="green" icon={ShieldAlert} />
        <KpiCard label={t('Nodes that would not stop the chain')} value={S.decoyNodeCount} unit={t('across {0} chains', S.clustersWithDecoys)} tone="orange" icon={Scissors} />
        <KpiCard label={t('Chains that cannot be closed at once')} value={S.infeasibleClusters} unit={t('{0} Cr blockable, no officer in one division', S.infeasibleBlockableCr)} tone="red" icon={MapPin} />
      </div>

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'where' && <WhereView />}
      {tab === 'can' && <CanView S={S} />}
      {tab === 'method' && <MethodView />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function WhereView() {
  const [open, setOpen] = useState(NETWORK_PLANS[0]?.id || null)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-steel-700 leading-relaxed">{CUT_METHOD_NOTE}</p>
      </div>

      {NETWORK_PLANS.map(p => (
        <Card
          key={p.id}
          title={t('{0} — {1} entities', p.id, p.entityCount)}
          subtitle={t('{0} still blockable of {1} that moved through the chain · signal age {2} days', cr(p.blockableRupees), cr(p.flowRupees), p.ageDays)}
          actions={
            <button
              onClick={() => setOpen(open === p.id ? null : p.id)}
              className="text-[11.5px] font-semibold text-govt-700 hover:underline"
            >
              {open === p.id ? t('Hide entities') : t('Show entities')}
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {p.recommended ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">{t('Act here first')}</div>
                <div className="text-[13.5px] font-bold text-navy-900">{p.recommended.label}</div>
                <div className="text-[11.5px] text-steel-600 mt-0.5">
                  {p.recommended.role} · {p.recommended.division || t('division not on record')}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Pill tone="green">{t('Stops circulation')}</Pill>
                  <Pill tone="steel">{t('Lead strength {0}', p.recommended.leadStrength)}</Pill>
                </div>
                <div className="text-[11.5px] text-steel-600 mt-2">
                  {t('{0} of invoice value sits on the edges this entity is party to.', lakh(p.recommended.incidentRupees))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50/60 px-3.5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5221F] mb-1">{t('No single effective cut')}</div>
                <p className="text-[12.5px] text-navy-800 leading-relaxed">
                  {t('No single entity in this chain stops the circulation when removed. It has to be acted on as a group, or not at all.')}
                </p>
              </div>
            )}

            {/* The finding a graph view cannot produce. */}
            {p.ineffectiveCuts.length > 0 ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50/60 px-3.5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-700 mb-1">
                  {t('{0} entity would NOT stop the chain', p.ineffectiveCuts.length)}
                </div>
                <p className="text-[12px] text-navy-800 leading-relaxed mb-2">
                  {t('A route bypasses these entities, so the circulation continues without them. Acting here spends the element of surprise and changes nothing.')}
                </p>
                {p.ineffectiveCuts.map(n => (
                  <div key={n.id} className="flex items-center gap-2 text-[12px] text-navy-800">
                    <XCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="font-medium">{n.label}</span>
                    <span className="text-steel-500">· {n.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{t('No bypass routes')}</div>
                <p className="text-[12px] text-steel-700 leading-relaxed">
                  {t('This chain is a closed loop with no chord. Removing any one entity breaks the circulation, so topology does not distinguish the targets — lead strength and value at stake decide.')}
                </p>
              </div>
            )}
          </div>

          {open === p.id && (
            <div className="rounded-lg border border-steel-200 overflow-hidden">
              <table className="w-full text-[12px]">
                <thead className="bg-steel-50">
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-steel-500">
                    <th className="px-3 py-2">{t('Entity')}</th>
                    <th className="px-3 py-2">{t('Role in chain')}</th>
                    <th className="px-3 py-2">{t('Division')}</th>
                    <th className="px-3 py-2 text-right">{t('Value on its edges')}</th>
                    <th className="px-3 py-2 text-right">{t('Lead strength')}</th>
                    <th className="px-3 py-2">{t('Removal stops chain?')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {[...p.nodes].sort((a, b) => b.cutScore - a.cutScore).map(n => (
                    <tr key={n.id} className={n.id === p.recommended?.id ? 'bg-emerald-50/50' : ''}>
                      <td className="px-3 py-2 font-medium text-navy-900">{n.label}</td>
                      <td className="px-3 py-2 text-steel-600">{n.role}</td>
                      <td className="px-3 py-2 text-steel-600">{n.division || '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{lakh(n.incidentRupees)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{n.leadStrength}</td>
                      <td className="px-3 py-2">
                        {n.breaksChain
                          ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />{t('Yes')}</span>
                          : <span className="inline-flex items-center gap-1 text-orange-700"><XCircle className="w-3.5 h-3.5" />{t('No — bypassed')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CanView({ S }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-steel-700 leading-relaxed">{COORDINATION_NOTE}</p>
      </div>

      <Card
        title={t('Jurisdictional span of each chain')}
        subtitle={t('Every one of these chains crosses a division boundary. The chain is one economic unit and several jurisdictional ones, and the department is organised along the second.')}
      >
        <div className="space-y-3">
          {NETWORK_PLANS.map(p => (
            <div key={p.id} className={`rounded-lg border px-4 py-3 ${p.simultaneousFeasible ? 'border-steel-200 bg-white' : 'border-red-200 bg-red-50/50'}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[13px] font-bold text-navy-900">{p.id}</span>
                <Pill tone="steel">{t('{0} entities', p.entityCount)}</Pill>
                <Pill tone={p.divisionCount > 1 ? 'amber' : 'steel'}>{t('{0} divisions', p.divisionCount)}</Pill>
                {p.simultaneousFeasible
                  ? <Pill tone="green">{t('Can be closed simultaneously')}</Pill>
                  : <Pill tone="red">{t('Cannot be closed simultaneously')}</Pill>}
                <span className="ml-auto text-[12px] font-semibold text-navy-900 tabular-nums">{cr(p.blockableRupees)} {t('blockable')}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {p.divisions.map(d => (
                  <span
                    key={d}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${
                      p.uncovered.includes(d)
                        ? 'bg-red-50 text-[#C5221F] border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {p.uncovered.includes(d) ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {d}
                  </span>
                ))}
              </div>

              {p.uncovered.length > 0 && (
                <p className="text-[12px] text-[#C5221F] leading-relaxed">
                  {t('No investigation officer is posted in {0}. This chain cannot be closed as a unit until one is — a deployment decision, not a scheduling one.', p.uncovered.join(', '))}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-2 pt-2 border-t border-steel-100 text-[11.5px]">
                <span className="text-steel-600">
                  {t('Sequential lag')}: <span className="font-semibold text-navy-900 tabular-nums">{p.lagDays} {t('days')}</span>
                </span>
                <span className="text-steel-600">
                  {t('Value lost to that lag')}: <span className="font-semibold text-navy-900 tabular-nums">{lakh(p.leakageRupees)}</span>
                </span>
                <span className="text-steel-500">{t('signal age {0}d', p.ageDays)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* An honest negative. The coordination cost is small here, and the
          reason it is small is itself the finding. */}
      <Card title={t('What coordination failure actually costs')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1">{t('Lost to sequential action')}</div>
            <div className="text-lg font-bold text-navy-900 tabular-nums">{S.totalLeakageCr} {t('Cr')}</div>
            <p className="text-[11px] text-steel-600 leading-relaxed mt-1">{t('If each chain were worked one division per week rather than on a single date.')}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Already lost before detection')}</div>
            <div className="text-lg font-bold text-navy-900 tabular-nums">{S.utilisedCr} {t('Cr')}</div>
            <p className="text-[11px] text-steel-600 leading-relaxed mt-1">{t('Utilised downstream and no longer blockable by any action.')}</p>
          </div>
        </div>
        <p className="text-[12.5px] text-steel-700 leading-relaxed">
          {t('The coordination loss is small, and it would be dishonest to present it as the headline. It is small for a specific reason: these chains are already {0} to {1} days old, and by that point the decay curve has flattened — most of what could move has moved, so a further week costs comparatively little. Simultaneity matters enormously on a chain detected in its first month and barely at all on one detected in its second year. The finding is therefore not "coordinate better" but "detect earlier", and the registration screen is where that is won.',
            Math.min(...NETWORK_PLANS.map(p => p.ageDays)), Math.max(...NETWORK_PLANS.map(p => p.ageDays)))}
        </p>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function MethodView() {
  return (
    <div className="space-y-4">
      <Card title={t('How the cut point is decided')}>
        <p className="text-[12.5px] text-steel-700 leading-relaxed mb-3">{CUT_METHOD_NOTE}</p>
        <div className="rounded-lg border border-steel-200 bg-steel-50 px-3.5 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-steel-500 mb-1.5">{t('Why not a centrality score')}</div>
          <p className="text-[12px] text-steel-700 leading-relaxed">
            {t('Centrality measures how important a node looks. It does not answer whether the circulation survives without it, and on a chain with a bypass route those two things point at different entities. The test used here is the direct one: remove the node and check whether a directed cycle still exists.')}
          </p>
        </div>
      </Card>

      <Card
        title={t('Lead strength indicators')}
        subtitle={t('A stated rule set, not a learned score. Each contribution is visible on the entity it applies to.')}
      >
        <div className="divide-y divide-steel-100">
          {LEAD_INDICATORS.map(i => (
            <div key={i.id} className="py-2.5 flex items-start gap-3">
              <span className="shrink-0 w-14 text-[12.5px] font-bold text-navy-900 tabular-nums">+{i.weight.toFixed(2)}</span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-navy-800">{i.label}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed">{i.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-steel-500 mt-3">
          {t('Base 0.20, capped at 0.95. No entity reaches certainty, because no combination of these indicators establishes one.')}
        </p>
      </Card>

      {/* The line that must never be crossed. */}
      <div className="rounded-xl border border-red-300 bg-red-50/60 px-5 py-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#C5221F] shrink-0 mt-0.5" />
        <div>
          <div className="text-[13px] font-bold text-navy-900 mb-1">{t('This is a lead, not a finding')}</div>
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{EVIDENCE_CAVEAT}</p>
        </div>
      </div>
    </div>
  )
}
