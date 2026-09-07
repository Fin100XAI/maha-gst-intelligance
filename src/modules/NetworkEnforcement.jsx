import { useMemo, useState } from 'react'
import { Network, Scissors, MapPin, AlertTriangle, ShieldAlert, Info, CheckCircle2, XCircle, Share2 } from 'lucide-react'
import { SectionHeader, Card } from '../components/ui/Card.jsx'
import { KpiCard } from '../components/ui/KpiCard.jsx'
import { Pill } from '../components/ui/RiskBadge.jsx'
import { PillTabs } from '../components/ui/PillTabs.jsx'
import { DataTable } from '../components/ui/DataTable.jsx'
import { ExportBar } from '../components/ui/ExportBar.jsx'
import {
  NETWORK_PLANS, NETWORK_ACTION_SUMMARY, LEAD_INDICATORS,
  CUT_METHOD_NOTE, COORDINATION_NOTE, EVIDENCE_CAVEAT
} from '../data/networkAction.js'
import { FilterNotApplicable } from '../components/ui/FilterScope.jsx'
import { ClusterDetection } from '../components/shared/ClusterDetection.jsx'
import { t } from '../i18n/index.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`
const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0)

/* Total invoice value on a chain's edges — the denominator for "how much of
 * this chain does acting here actually touch". Derived from the plan's own
 * edges rather than restated, so it cannot drift from the node figures the
 * sequencing engine computed. */
const chainEdgeValue = plan => plan.edges.reduce((s, e) => s + (e.valueLakh || 0), 0) * 100000

/* The margin between the recommended cut and the next effective one. A
 * recommendation that beats its alternative by 3% is a coin toss dressed as an
 * instruction; one that beats it by 60% is a decision. The officer needs to
 * know which they are looking at before spending the element of surprise. */
function cutMargin(plan) {
  const ranked = [...plan.effectiveCuts].sort((a, b) => b.cutScore - a.cutScore)
  if (ranked.length < 2 || !ranked[0].cutScore) return null
  return {
    runnerUp: ranked[1],
    marginPct: Math.round(((ranked[0].cutScore - ranked[1].cutScore) / ranked[0].cutScore) * 1000) / 10
  }
}

const TABS = [
  { key: 'detect', label: 'Detected chains', icon: Share2 },
  { key: 'where', label: 'Where to act', icon: Scissors },
  { key: 'can', label: 'Whether we can act', icon: MapPin },
  { key: 'method', label: 'Method and limits', icon: Info }
]

/* Detection is already solved by the Fake Invoice Network module. This answers
 * what comes after, and what a graph view structurally cannot: where to cut,
 * whether the department can execute it, and what coordination failure costs. */
export default function NetworkEnforcement() {
  const [tab, setTab] = useState('detect')
  const S = NETWORK_ACTION_SUMMARY

  /* Denominators for the tiles. Every count below is meaningless without the
   * population it came out of — 12 decoy nodes reads very differently against
   * 20 entities than against 200. */
  const scale = useMemo(() => {
    const entityTotal = NETWORK_PLANS.reduce((s, p) => s + p.entityCount, 0)
    const flowRupees = NETWORK_PLANS.reduce((s, p) => s + p.flowRupees, 0)
    const blockable = S.blockableCr * 10000000
    const utilised = S.utilisedCr * 10000000
    return {
      entityTotal,
      flowRupees,
      blockableSharePct: pct(blockable, blockable + utilised),
      // The chain whose blockable value is largest and which can still be
      // closed as a unit — the one an officer can act on this week.
      firstFeasible: NETWORK_PLANS.find(p => p.simultaneousFeasible) || null
    }
  }, [S.blockableCr, S.utilisedCr])

  return (
    <div>
      <SectionHeader
        eyebrow={t('Fraud & Risk · Enforcement Sequencing')}
        title={t('Network Intelligence')}
        description={t('Circular invoice chains, from detection through to action. The graph shows what was found; the tabs after it work out which entity actually stops the circulation, whether officers exist in every division the chain crosses, and what is lost when they cannot move on the same day.')}
        actions={<ExportBar moduleLabel="Network Intelligence" />}
      />

      {tab !== 'detect' && <FilterNotApplicable reason={t('A chain is one economic unit spanning several divisions, and every cluster here crosses at least one boundary. Filtering to a single division would truncate the chains at that boundary and make them appear to end — the same failure the pilot extract specification warns against — so chains are always shown whole.')} />}

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
        <KpiCard
          label={t('Chains under analysis')}
          value={S.clusterCount}
          unit={t('{0} entities · {1} chains span more than one division, up to {2}', scale.entityTotal, S.multiDivisionClusters, S.maxDivisionSpan)}
          tone="navy"
          icon={Network}
        />
        <KpiCard
          label={t('Still blockable')}
          value={S.blockableCr}
          unit={t('₹ Cr — {0}% of the credit in these chains; the other {1}% is already utilised', scale.blockableSharePct, Math.round((100 - scale.blockableSharePct) * 10) / 10)}
          tone="green"
          icon={ShieldAlert}
        />
        <KpiCard
          label={t('Nodes that would not stop the chain')}
          value={S.decoyNodeCount}
          unit={t('of {0} entities ({1}%), across {2} of {3} chains — acting on one changes nothing', scale.entityTotal, pct(S.decoyNodeCount, scale.entityTotal), S.clustersWithDecoys, S.clusterCount)}
          tone="orange"
          icon={Scissors}
        />
        <KpiCard
          label={t('Chains that cannot be closed at once')}
          value={S.infeasibleClusters}
          unit={t('of {0} chains — {1} Cr blockable behind a division with no investigation officer', S.clusterCount, S.infeasibleBlockableCr)}
          tone="red"
          icon={MapPin}
        />
      </div>

      {/* The one line an officer can act on this week, stated before the tabs
          rather than left to be assembled from three of them. */}
      {scale.firstFeasible && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-[12.5px] text-navy-900">
            {t('Act first on {0}: it carries the largest blockable value of any chain that every division in its span can close on one date — {1} across {2} divisions, {3} days old.',
              scale.firstFeasible.id, cr(scale.firstFeasible.blockableRupees), scale.firstFeasible.divisionCount, scale.firstFeasible.ageDays)}
          </span>
          {scale.firstFeasible.recommended && (
            <Pill tone="green">{t('Cut point: {0}', scale.firstFeasible.recommended.label)}</Pill>
          )}
        </div>
      )}

      <div className="mb-4">
        <PillTabs tabs={TABS.map(x => ({ ...x, label: t(x.label) }))} active={tab} onChange={setTab} />
      </div>

      {tab === 'detect' && <ClusterDetection />}
      {tab === 'where' && <WhereView />}
      {tab === 'can' && <CanView S={S} />}
      {tab === 'method' && <MethodView />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function WhereView() {
  const [open, setOpen] = useState(NETWORK_PLANS[0]?.id || null)

  /* One row per chain, carrying the four things that decide which chain an
   * officer opens first: how much is still blockable, whether the cut point is
   * in a division that can act, how much better it is than the alternative,
   * and how old the signal already is. */
  const triage = useMemo(() => NETWORK_PLANS.map(p => {
    const edgeValue = chainEdgeValue(p)
    const margin = cutMargin(p)
    const cutDivision = p.recommended?.division || null
    return {
      id: p.id,
      entityCount: p.entityCount,
      divisionCount: p.divisionCount,
      blockableRupees: p.blockableRupees,
      blockableSharePct: pct(p.blockableRupees, p.blockableRupees + p.utilisedRupees),
      decoyCount: p.ineffectiveCuts.length,
      effectiveCount: p.effectiveCuts.length,
      ageDays: p.ageDays,
      simultaneousFeasible: p.simultaneousFeasible,
      recommendedLabel: p.recommended ? p.recommended.label : null,
      cutSharePct: p.recommended ? pct(p.recommended.incidentRupees, edgeValue) : 0,
      cutDivision,
      cutInUncoveredDivision: !!(cutDivision && p.uncovered.includes(cutDivision)),
      marginPct: margin ? margin.marginPct : null
    }
  }), [])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-steel-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-steel-700 leading-relaxed">{t(CUT_METHOD_NOTE)}</p>
      </div>

      <Card
        title={t('Which chain first')}
        subtitle={t('Ranked by blockable value. A chain is only workable this week if its cut point sits in a division with an officer who may act — the last two columns decide that, and they override the first.')}
      >
        <DataTable
          columns={[
            {
              key: 'id', label: t('Chain'),
              render: row => (
                <div>
                  <div className="font-semibold text-navy-900">{row.id}</div>
                  <div className="text-[11px] text-steel-500">{t('{0} entities · {1} divisions', row.entityCount, row.divisionCount)}</div>
                </div>
              )
            },
            {
              key: 'blockableRupees', label: t('Still blockable'), align: 'right',
              sortValue: row => row.blockableRupees,
              render: row => (
                <div className="tabular-nums">
                  <div className="font-semibold text-navy-900">{cr(row.blockableRupees)}</div>
                  <div className="text-[11px] text-steel-500">{t('{0}% of this chain’s credit', row.blockableSharePct)}</div>
                </div>
              )
            },
            {
              key: 'recommendedLabel', label: t('Where the cut works'),
              render: row => row.recommendedLabel
                ? (
                  <div>
                    <div className="text-navy-900">{t(row.recommendedLabel)}</div>
                    <div className="text-[11px] text-steel-500">
                      {t('{0}% of chain invoice value sits on its edges', row.cutSharePct)}
                      {row.cutDivision ? ` · ${t(row.cutDivision)}` : ''}
                    </div>
                  </div>
                )
                : <span className="text-[11px] text-[#C5221F]">{t('No single cut works — group action only')}</span>
            },
            {
              key: 'marginPct', label: t('Margin over the next option'), align: 'right',
              sortValue: row => (row.marginPct == null ? -1 : row.marginPct),
              render: row => row.marginPct == null
                ? <span className="text-[11px] text-steel-500">{t('only one effective cut')}</span>
                : (
                  <span className="tabular-nums text-navy-900">
                    {t('{0}% better', row.marginPct)}
                  </span>
                )
            },
            {
              key: 'decoyCount', label: t('Entities that would not stop it'), align: 'right',
              sortValue: row => row.decoyCount,
              render: row => (
                <span className="tabular-nums text-steel-700">
                  {t('{0} of {1}', row.decoyCount, row.entityCount)}
                </span>
              )
            },
            {
              key: 'ageDays', label: t('Signal age'), align: 'right',
              sortValue: row => row.ageDays,
              render: row => <span className="tabular-nums text-steel-700">{t('{0} days', row.ageDays)}</span>
            },
            {
              key: 'simultaneousFeasible', label: t('Workable now?'), align: 'center',
              sortValue: row => (row.simultaneousFeasible ? 1 : 0),
              render: row => row.cutInUncoveredDivision
                ? <Pill tone="red">{t('Cut point has no officer')}</Pill>
                : row.simultaneousFeasible
                  ? <Pill tone="green">{t('Yes')}</Pill>
                  : <Pill tone="amber">{t('Cut is covered, span is not')}</Pill>
            }
          ]}
          rows={triage}
          searchable={false}
          pageSize={10}
        />
        <p className="text-[12px] text-steel-600 leading-relaxed mt-3">
          {t('The margin column is the one most easily missed. Where it is small, the ranking between the recommended entity and the next is inside the noise of the lead-strength weights, and the choice should be made on evidence an officer holds rather than on this ordering.')}
        </p>
      </Card>

      {NETWORK_PLANS.map(p => (
        <Card
          key={p.id}
          title={t('{0} — {1} entities', p.id, p.entityCount)}
          subtitle={t('{0} still blockable ({1}% of this chain’s credit; {2} already utilised) of {3} that moved through the chain · signal age {4} days · {5} divisions',
            cr(p.blockableRupees), pct(p.blockableRupees, p.blockableRupees + p.utilisedRupees), cr(p.utilisedRupees), cr(p.flowRupees), p.ageDays, p.divisionCount)}
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
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Pill tone="green">{t('Stops circulation')}</Pill>
                  <Pill tone="steel">{t('Lead strength {0} of a possible 0.95', p.recommended.leadStrength)}</Pill>
                  {p.recommended.division && p.uncovered.includes(p.recommended.division) && (
                    <Pill tone="red">{t('No investigation officer in this division')}</Pill>
                  )}
                </div>
                <div className="text-[11.5px] text-steel-600 mt-2">
                  {t('{0} of invoice value sits on the edges this entity is party to — {1}% of the {2} moving through the chain.',
                    lakh(p.recommended.incidentRupees), pct(p.recommended.incidentRupees, chainEdgeValue(p)), lakh(chainEdgeValue(p)))}
                </div>
                {/* Which indicators actually produced the lead, so the officer
                    can argue with the score rather than inherit it. */}
                {p.recommended.leadApplied?.length > 0 && (
                  <div className="text-[11.5px] text-steel-600 mt-1.5">
                    {t('Lead built from')}: {p.recommended.leadApplied.map(ind => t(ind.label)).join('; ')}
                  </div>
                )}
                {(() => {
                  const margin = cutMargin(p)
                  return (
                    <div className="text-[11.5px] text-steel-600 mt-1.5">
                      {margin
                        ? t('Scores {0}% above the next effective cut, {1}. Below roughly 10% that ordering is inside the noise of the lead weights and should not decide the target on its own.', margin.marginPct, t(margin.runnerUp.label))
                        : t('The only entity in this chain whose removal stops the circulation — there is no second option to weigh it against.')}
                    </div>
                  )
                })()}
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
                    <span className="font-medium">{t(n.label)}</span>
                    <span className="text-steel-500">· {t(n.role)}</span>
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
                    <th className="px-3 py-2">{t('Division — officer available?')}</th>
                    <th className="px-3 py-2 text-right">{t('Value on its edges')}</th>
                    <th className="px-3 py-2 text-right">{t('Share of chain value')}</th>
                    <th className="px-3 py-2 text-right">{t('Lead strength')}</th>
                    <th className="px-3 py-2">{t('Removal stops chain?')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-100">
                  {[...p.nodes].sort((a, b) => b.cutScore - a.cutScore).map(n => (
                    <tr key={n.id} className={n.id === p.recommended?.id ? 'bg-emerald-50/50' : ''}>
                      <td className="px-3 py-2 font-medium text-navy-900">{t(n.label)}</td>
                      <td className="px-3 py-2 text-steel-600">{t(n.role)}</td>
                      <td className="px-3 py-2 text-steel-600">
                        {n.division
                          ? (p.uncovered.includes(n.division)
                            ? <span className="inline-flex items-center gap-1 text-[#C5221F]"><XCircle className="w-3 h-3" />{t(n.division)}</span>
                            : <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3 h-3" />{t(n.division)}</span>)
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{lakh(n.incidentRupees)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-steel-600">{t('{0}%', pct(n.incidentRupees, chainEdgeValue(p)))}</td>
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
        <p className="text-[12px] text-steel-700 leading-relaxed">{t(COORDINATION_NOTE)}</p>
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
                  {t('No investigation officer is posted in {0} — {1} of the {2} divisions this chain crosses. This chain cannot be closed as a unit until one is: a deployment decision, not a scheduling one.', p.uncovered.map(d => t(d)).join(', '), p.uncovered.length, p.divisionCount)}
                </p>
              )}

              {/* Whether the gap falls on the entity that actually matters is a
                  different question from whether the span is covered, and it is
                  the one that decides if the chain is workable at all. */}
              {p.recommended?.division && p.uncovered.includes(p.recommended.division) && (
                <p className="text-[12px] text-[#C5221F] leading-relaxed mt-1">
                  {t('The gap falls on the cut point itself: {0}, the only entity ranked worth acting against here, sits in {1}. Posting an officer there is what unlocks {2}, not better scheduling.', t(p.recommended.label), t(p.recommended.division), cr(p.blockableRupees))}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-2 pt-2 border-t border-steel-100 text-[11.5px]">
                <span className="text-steel-600">
                  {t('Sequential lag')}: <span className="font-semibold text-navy-900 tabular-nums">{t('{0} days — one division per week across {1}', p.lagDays, p.divisionCount)}</span>
                </span>
                <span className="text-steel-600">
                  {t('Value lost to that lag')}: <span className="font-semibold text-navy-900 tabular-nums">{t('{0} — {1}% of what is still blockable', lakh(p.leakageRupees), pct(p.leakageRupees, p.blockableRupees))}</span>
                </span>
                <span className="text-steel-500">{t('signal age {0}d · {1} already utilised', p.ageDays, cr(p.utilisedRupees))}</span>
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
            <p className="text-[11px] text-steel-600 leading-relaxed mt-1">
              {t('If each chain were worked one division per week rather than on a single date — {0}% of the {1} Cr still blockable.', pct(S.totalLeakageCr, S.blockableCr), S.blockableCr)}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">{t('Already lost before detection')}</div>
            <div className="text-lg font-bold text-navy-900 tabular-nums">{S.utilisedCr} {t('Cr')}</div>
            <p className="text-[11px] text-steel-600 leading-relaxed mt-1">
              {t('Utilised downstream and no longer blockable by any action — {0}% of the {1} Cr of credit these chains carried, and {2}× everything coordination could still save.', pct(S.utilisedCr, S.utilisedCr + S.blockableCr), Math.round((S.utilisedCr + S.blockableCr) * 100) / 100, S.totalLeakageCr > 0 ? Math.round((S.utilisedCr / S.totalLeakageCr) * 10) / 10 : '—')}
            </p>
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
        <p className="text-[12.5px] text-steel-700 leading-relaxed mb-3">{t(CUT_METHOD_NOTE)}</p>
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
                <div className="text-[12.5px] font-medium text-navy-800">{t(i.label)}</div>
                <p className="text-[11.5px] text-steel-600 leading-relaxed">{t(i.note)}</p>
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
          <p className="text-[12.5px] text-navy-800 leading-relaxed">{t(EVIDENCE_CAVEAT)}</p>
        </div>
      </div>
    </div>
  )
}
