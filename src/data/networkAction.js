/* ---------------------------------------------------------------------------
 * NETWORK ENFORCEMENT SEQUENCING
 *
 * Detection is already solved — the Fake Invoice Network module draws the
 * chain and scores it. This module answers the question that comes after, and
 * that a graph view structurally cannot: having found the chain, WHERE do you
 * act, CAN you, and what does it cost if you get it wrong?
 *
 * The generic version of "network intelligence" stops at the picture. Three
 * things it never shows, each of which decides whether enforcement works:
 *
 *   1. CUTTING THE WRONG NODE LEAVES THE CHAIN RUNNING. A closed circular
 *      chain breaks wherever it is cut — but these chains are not always pure
 *      cycles. Where a chord bypasses a node, removing that node leaves the
 *      circulation intact and the department has spent its one element of
 *      surprise on an entity whose removal changes nothing. This is computed
 *      here by actually re-running cycle detection on the residual graph after
 *      removing each node, not estimated from a centrality score.
 *
 *   2. THE CHAIN IS THE UNIT OF ENFORCEMENT, BUT JURISDICTION IS TERRITORIAL.
 *      A cluster spanning four divisions needs four officers acting on one
 *      date. Nothing in the department's structure provides that coordination,
 *      and no graph view reveals the need for it.
 *
 *   3. ACTING SEQUENTIALLY WARNS THE REST. The moment the first node is
 *      touched, the others know. Value that was blockable on the day of the
 *      first action is not blockable by the time the last division moves, and
 *      the loss is computable from the same decay curve the recovery module
 *      already uses.
 *
 * WHAT IS AND IS NOT CLAIMED
 *
 * The lead-strength score below is a prioritisation aid built from linkage
 * indicators the platform actually holds. It is NOT evidence, and it is not a
 * finding of fraud. Circular flow has innocent explanations, and a chain of
 * this shape is a reason to investigate rather than a conclusion to act on.
 * Every consumer of this module is told so.
 * ------------------------------------------------------------------------- */

import { NETWORK_CLUSTERS, TAXPAYERS, OFFICERS } from './mockData.js'
import { CHAIN_EXPOSURE, recoverabilityFor } from './recovery.js'

const INVESTIGATION_ROLE = 'Investigation Officer'
const COORDINATION_LAG_DAYS = 7 // one division per week if not simultaneous

/* --- Lead strength. A stated rule set, not a learned score, so an officer can
 * see exactly which indicator contributed and argue with it. Each of these is
 * a linkage fact the platform holds, not an inference about intent. --- */
export const LEAD_INDICATORS = [
  { id: 'hub', label: 'Acts as the hub of the chain', weight: 0.30, note: 'Sits at the centre of the invoice flow rather than at its edge.' },
  { id: 'shared_address', label: 'Registered address shared across the cluster', weight: 0.20, note: 'Common premises across supposedly independent entities.' },
  { id: 'shared_contact', label: 'Contact details shared across the cluster', weight: 0.15, note: 'Common telephone or email across the cluster.' },
  { id: 'dormant', label: 'Dormant while invoicing', weight: 0.20, note: 'No filing activity in a period during which invoices were issued.' },
  { id: 'passthrough', label: 'Pass-through pattern — credit in, credit out, no value added', weight: 0.15, note: 'Inward and outward supply match closely with negligible tax paid in cash.' }
]
const LEAD_BASE = 0.20
const LEAD_CAP = 0.95

function leadStrength(node, cluster) {
  const applied = []
  let score = LEAD_BASE
  const add = id => {
    const ind = LEAD_INDICATORS.find(i => i.id === id)
    score += ind.weight
    applied.push(ind)
  }
  if (node.role === 'Hub Entity') add('hub')
  if (cluster.sharedAddress) add('shared_address')
  if (cluster.sharedContact) add('shared_contact')
  if (node.dormant) add('dormant')
  if (node.role === 'Pass-Through') add('passthrough')
  return { value: Math.min(LEAD_CAP, Math.round(score * 100) / 100), applied }
}

/* --- Does a directed cycle survive if this node is removed? ---
 *
 * The whole point. Standard three-colour DFS on the residual graph: a back
 * edge to a node still on the stack means circulation persists, and removing
 * that node therefore does not stop the chain. */
function hasCycle(nodeIds, edges) {
  const adj = new Map(nodeIds.map(id => [id, []]))
  edges.forEach(e => { if (adj.has(e.from) && adj.has(e.to)) adj.get(e.from).push(e.to) })
  const state = new Map(nodeIds.map(id => [id, 0])) // 0 unvisited, 1 on stack, 2 done
  let found = false
  const visit = id => {
    if (found) return
    state.set(id, 1)
    for (const next of adj.get(id) || []) {
      if (state.get(next) === 1) { found = true; return }
      if (state.get(next) === 0) visit(next)
      if (found) return
    }
    state.set(id, 2)
  }
  nodeIds.forEach(id => { if (state.get(id) === 0 && !found) visit(id) })
  return found
}

const divisionOfGstin = gstin => {
  const tp = TAXPAYERS.find(t => t.gstin === gstin)
  return tp ? tp.division : null
}

const investigationDivisions = new Set(
  OFFICERS.filter(o => o.role === INVESTIGATION_ROLE).map(o => o.division)
)

export const NETWORK_PLANS = NETWORK_CLUSTERS.map(cluster => {
  const chain = CHAIN_EXPOSURE.find(c => c.id === cluster.id)
  const nodeIds = cluster.nodes.map(n => n.id)
  const edges = cluster.edges || []
  const flowRupees = chain ? chain.flowRupees : 0
  const blockable = chain ? chain.blockableRupees : 0
  const ageDays = chain ? chain.ageDays : 0

  const nodes = cluster.nodes.map(n => {
    // Re-run cycle detection on the graph with this node removed. If a cycle
    // survives, acting here does not stop the circulation.
    const remainingIds = nodeIds.filter(id => id !== n.id)
    const remainingEdges = edges.filter(e => e.from !== n.id && e.to !== n.id)
    const cycleSurvives = hasCycle(remainingIds, remainingEdges)

    // Value on the edges this node sits on — what its removal directly disrupts.
    const incident = edges
      .filter(e => e.from === n.id || e.to === n.id)
      .reduce((s, e) => s + (e.valueLakh || 0), 0) * 100000

    const lead = leadStrength(n, cluster)
    const division = divisionOfGstin(n.gstin)

    return {
      ...n,
      division,
      incidentRupees: incident,
      breaksChain: !cycleSurvives,
      cycleSurvives,
      leadStrength: lead.value,
      leadApplied: lead.applied,
      // Only nodes whose removal actually stops circulation are ranked; among
      // those, the ordering is value at stake weighted by how strong the lead
      // is, because a strong lead on a small node is a better opening than a
      // weak one on a large node that will not survive appeal.
      cutScore: cycleSurvives ? 0 : Math.round(incident * lead.value)
    }
  })

  const effectiveCuts = nodes.filter(n => n.breaksChain)
  const ineffectiveCuts = nodes.filter(n => !n.breaksChain)
  const recommended = effectiveCuts.length
    ? effectiveCuts.reduce((a, b) => (b.cutScore > a.cutScore ? b : a))
    : null

  // Jurisdictional reality.
  const divisions = [...new Set(nodes.map(n => n.division).filter(Boolean))]
  const coverable = divisions.filter(d => investigationDivisions.has(d))
  const uncovered = divisions.filter(d => !investigationDivisions.has(d))

  // Cost of not moving simultaneously: one division per week means the last
  // action lands this many days after the first, and the chain keeps moving.
  const lagDays = Math.max(0, divisions.length - 1) * COORDINATION_LAG_DAYS
  const retainedShare = ageDays > 0 ? recoverabilityFor(ageDays + lagDays) / recoverabilityFor(ageDays) : 1
  const leakageRupees = Math.round(blockable * (1 - retainedShare))

  return {
    id: cluster.id,
    entityCount: cluster.nodes.length,
    flowRupees,
    blockableRupees: blockable,
    utilisedRupees: chain ? chain.utilisedRupees : 0,
    ageDays,
    nodes,
    edges,
    effectiveCuts,
    ineffectiveCuts,
    recommended,
    divisions,
    divisionCount: divisions.length,
    coverable,
    uncovered,
    // A cluster is actionable as a unit only if every division it touches has
    // an officer who may act. One gap and the chain cannot be closed at once.
    simultaneousFeasible: uncovered.length === 0,
    lagDays,
    leakageRupees,
    sharedAddress: cluster.sharedAddress,
    sharedContact: cluster.sharedContact
  }
}).sort((a, b) => b.blockableRupees - a.blockableRupees)

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)

export const NETWORK_ACTION_SUMMARY = {
  clusterCount: NETWORK_PLANS.length,
  blockableCr: Math.round((sum(NETWORK_PLANS, p => p.blockableRupees) / 10000000) * 100) / 100,
  utilisedCr: Math.round((sum(NETWORK_PLANS, p => p.utilisedRupees) / 10000000) * 100) / 100,

  // The headline finding: clusters where at least one node looks like an
  // obvious target but would leave the chain running.
  clustersWithDecoys: NETWORK_PLANS.filter(p => p.ineffectiveCuts.length > 0).length,
  decoyNodeCount: sum(NETWORK_PLANS, p => p.ineffectiveCuts.length),

  // The structural finding: chains cross divisions, enforcement does not.
  multiDivisionClusters: NETWORK_PLANS.filter(p => p.divisionCount > 1).length,
  maxDivisionSpan: NETWORK_PLANS.reduce((m, p) => Math.max(m, p.divisionCount), 0),
  infeasibleClusters: NETWORK_PLANS.filter(p => !p.simultaneousFeasible).length,
  infeasibleBlockableCr:
    Math.round((sum(NETWORK_PLANS.filter(p => !p.simultaneousFeasible), p => p.blockableRupees) / 10000000) * 100) / 100,

  // The cost of coordination failure, if every cluster were worked one
  // division per week instead of simultaneously.
  totalLeakageCr: Math.round((sum(NETWORK_PLANS, p => p.leakageRupees) / 10000000) * 100) / 100,
  coordinationLagDays: COORDINATION_LAG_DAYS
}

export const CUT_METHOD_NOTE =
  'Whether a node is worth acting against is decided by re-running directed cycle detection on the chain with that node removed — not by a centrality score. Where a chord bypasses a node, the circulation survives its removal, so acting there spends the department’s one element of surprise on an entity whose absence changes nothing. Among the nodes whose removal does stop the chain, the ordering weights the value on their incident edges by lead strength, because a strong lead on a smaller node is a better opening than a weak one on a larger node that will not survive appeal.'

export const COORDINATION_NOTE =
  'A chain is one economic unit and several jurisdictional ones. Every division a cluster touches needs an officer empowered to act, on the same date, because the first action warns the rest. Where a division in the span has no investigation officer posted, the cluster cannot be closed simultaneously at all — that is a deployment fact, not a scheduling one, and it is reported separately from the clusters that are merely hard to arrange.'

export const EVIDENCE_CAVEAT =
  'Lead strength is a prioritisation aid built from linkage indicators this platform holds — shared premises, shared contact details, dormancy, position in the flow. It is not evidence and it is not a finding of fraud. Circular flow has innocent explanations, including genuine reciprocal trading between related businesses. Every entry here is a reason to investigate and must be substantiated independently before any action issues.'
