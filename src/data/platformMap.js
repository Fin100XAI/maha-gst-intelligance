/* ---------------------------------------------------------------------------
 * PLATFORM MAP
 *
 * Every screen in the platform, with the one figure that says whether it needs
 * attention today, sourced from the engine that owns it rather than restated
 * here. A map that quotes its own numbers would drift from the pages it points
 * at within a week.
 *
 * Grouped by the question each screen answers, in the same order as the menu,
 * so the command centre and the navigation tell the same story.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS, AUDIT_CASES, LITIGATION_CASES, NETWORK_CLUSTERS, COMPLIANCE_ALERTS, REFUND_CASES, EWAY_RECORDS, DISTRICTS } from './mockData.js'
import { LIMITATION_SUMMARY } from './statutory.js'
import { RECOVERY_PORTFOLIO } from './recovery.js'
import { COMMAND_SUMMARY } from './commandCentre.js'
import { CAPACITY_RESULT } from './capacity.js'
import { NETWORK_ACTION_SUMMARY } from './networkAction.js'
import { DISCOVERY_SUMMARY } from './discovery.js'
import { COUNTERFACTUAL_SUMMARY, REVISIT_SUMMARY } from './retrospective.js'
import { questionStatus } from './precedent.js'
import { PRIORITY_QUEUE } from './priority.js'
import { OUTCOME_POOL } from './similarity.js'

const cr = n => `₹${(n / 10000000).toFixed(2)} Cr`

/* tone: what the figure means, not what the module is about. red = something is
 * being lost, amber = something needs a decision, steel = reference. */
export const PLATFORM_MAP = [
  {
    group: 'Revenue at Risk',
    question: 'What are we about to lose?',
    modules: [
      { id: 'command-center', label: 'Executive Command Center', answers: 'The whole state on one screen, and the map you are reading now.', metric: `${DISTRICTS.length} districts`, tone: 'steel' },
      { id: 'revenue-protection', label: 'Revenue Protection Command Centre', answers: 'Protectable value, deduplicated across every mechanism that flags it.', metric: cr(COMMAND_SUMMARY.protectableValue), tone: 'amber' },
      { id: 'statutory-time', label: 'Statutory Time Intelligence', answers: 'Every proceeding against its limitation clock.', metric: `${LIMITATION_SUMMARY.barredCount} barred · ₹${LIMITATION_SUMMARY.barredCr} Cr`, tone: 'red' },
      { id: 'recovery-window', label: 'Revenue at Risk & Recovery', answers: 'How much of a demand is still collectable, and how fast that falls.', metric: `₹${RECOVERY_PORTFOLIO.decayNextWeekCr} Cr decays this week`, tone: 'red' }
    ]
  },
  {
    group: 'Act This Week',
    question: 'What do we do with the capacity we have?',
    modules: [
      { id: 'case-priority', label: 'Case Priority Engine', answers: 'Cases ranked by recoverable value per officer-day.', metric: `${PRIORITY_QUEUE.length} in queue`, tone: 'steel' },
      { id: 'capacity', label: 'Officer Capacity & Deployment', answers: 'A week of capacity against binding territorial and role eligibility.', metric: `${CAPACITY_RESULT.unworkableCount} unreachable`, tone: 'red' },
      { id: 'audit-scrutiny', label: 'Audit & Scrutiny Engine', answers: 'The audit pipeline, with the statutory verdict on every row.', metric: `${AUDIT_CASES.filter(c => c.stage !== 'Closed').length} open cases`, tone: 'amber' }
    ]
  },
  {
    group: 'Risk Discovery',
    question: 'What don’t we know yet?',
    modules: [
      { id: 'unknown-risk', label: 'Unknown Risk Discovery', answers: 'Screens only the taxpayers no encoded rule touches.', metric: `${DISCOVERY_SUMMARY.discoveredCount} found of ${DISCOVERY_SUMMARY.unflaggedTotal} screened`, tone: 'steel' },
      { id: 'fake-invoice', label: 'Fake Invoice Network', answers: 'Circular trading and pass-through chains, as a graph.', metric: `${NETWORK_CLUSTERS.length} clusters`, tone: 'amber' },
      { id: 'network-enforcement', label: 'Network Enforcement', answers: 'Which entity actually stops a chain, and whether we can act.', metric: `₹${NETWORK_ACTION_SUMMARY.blockableCr} Cr still blockable`, tone: 'amber' },
      { id: 'itc-risk', label: 'ITC Risk Intelligence', answers: 'Input credit scored against filing and payment behaviour.', metric: `${TAXPAYERS.filter(t => t.risk.category === 'Critical' || t.risk.category === 'High').length} high-risk`, tone: 'amber' },
      { id: 'eway-bill', label: 'E-Way Bill Intelligence', answers: 'Transit records checked against filings.', metric: `${EWAY_RECORDS.length} records`, tone: 'steel' },
      { id: 'early-warning', label: 'Compliance Early Warning', answers: 'Non-filers and slipping compliance before the shortfall compounds.', metric: `${COMPLIANCE_ALERTS.length} alerts`, tone: 'amber' },
      { id: 'refund-risk', label: 'Refund Risk Intelligence', answers: 'Refund claims ranked by risk before sanction.', metric: `${REFUND_CASES.length} claims`, tone: 'steel' }
    ]
  },
  {
    group: 'Missed Revenue',
    question: 'What did we already lose?',
    modules: [
      { id: 'retrospective', label: 'Retrospective Intelligence', answers: 'What earlier action was worth, and cases put down while still live.', metric: `₹${COUNTERFACTUAL_SUMMARY.lostToQueueCr} Cr lost to queue dwell`, tone: 'red', extra: `${REVISIT_SUMMARY.count} revisit candidates` }
    ]
  },
  {
    group: 'Legal Standing',
    question: 'Will it hold up?',
    modules: [
      { id: 'precedent', label: 'Precedent Intelligence', answers: 'Prior decisions weighted by forum and whether they still stand.', metric: questionStatus('q_168a').verdict, tone: 'red' },
      { id: 'litigation', label: 'Litigation Intelligence', answers: 'Appeals and orders through the pipeline.', metric: `${LITIGATION_CASES.length} cases`, tone: 'steel' }
    ]
  },
  {
    group: 'Case Evidence',
    question: 'What is the case file?',
    modules: [
      { id: 'case-twin', label: 'Case Digital Twin', answers: 'One assembled view per taxpayer, with comparable concluded proceedings.', metric: `${OUTCOME_POOL.length} concluded outcomes`, tone: 'steel' },
      { id: 'taxpayer-360', label: 'Taxpayer 360', answers: 'Filings, payments, ITC and risk in one profile.', metric: `${TAXPAYERS.length} taxpayers`, tone: 'steel' }
    ]
  },
  {
    group: 'Analytics & Benchmarking',
    question: 'How is the department performing?',
    modules: [
      { id: 'revenue-intelligence', label: 'Revenue Intelligence', answers: 'Collection against target by district, sector and tax head.', metric: 'Statewide', tone: 'steel' },
      { id: 'district-performance', label: 'District & Division Performance', answers: 'Every district scored on collection, compliance and enforcement.', metric: `${DISTRICTS.length} districts`, tone: 'steel' },
      { id: 'sector-intelligence', label: 'Sector Intelligence', answers: 'Compliance and revenue patterns across industry sectors.', metric: `${new Set(TAXPAYERS.map(t => t.sector)).size} sectors`, tone: 'steel' }
    ]
  },
  {
    group: 'Governance & Assurance',
    question: 'Can what we did be defended?',
    modules: [
      { id: 'ai-governance', label: 'AI Governance & Security', answers: 'Model logs, override history and the guardrails on every recommendation.', metric: 'Audit trail', tone: 'steel' },
      { id: 'reports', label: 'Reports & Briefing Notes', answers: 'Exportable briefing notes for every review cycle.', metric: 'Export', tone: 'steel' },
      { id: 'official-statistics', label: 'Official Statistics', answers: 'Published CBIC, PIB and mahagst.gov.in figures, kept apart from simulated records.', metric: 'Sourced', tone: 'steel' }
    ]
  }
]

/* The handful of figures a Commissioner would want above the map itself —
 * each the single most consequential number its engine produces. */
export const PLATFORM_HEADLINES = [
  { id: 'statutory-time', label: 'Already time-barred', value: `₹${LIMITATION_SUMMARY.barredCr} Cr`, sub: `${LIMITATION_SUMMARY.barredCount} proceedings, unrecoverable`, tone: 'red' },
  { id: 'revenue-protection', label: 'Still protectable', value: cr(COMMAND_SUMMARY.protectableValue), sub: `${COMMAND_SUMMARY.protectableCases} cases, counted once`, tone: 'amber' },
  { id: 'capacity', label: 'Nobody can reach', value: `${CAPACITY_RESULT.unworkableCount}`, sub: `cases, ${cr(CAPACITY_RESULT.unworkableValue)} at stake`, tone: 'red' },
  { id: 'retrospective', label: 'Lost to queue dwell', value: `₹${COUNTERFACTUAL_SUMMARY.lostToQueueCr} Cr`, sub: 'controllable this quarter', tone: 'amber' }
]

export const PLATFORM_MAP_NOTE =
  'Every figure on this map is read from the engine that owns the screen it points at, not restated here, so the map and the page can never disagree. Selecting any row opens that page.'

export const MODULE_COUNT = PLATFORM_MAP.reduce((s, g) => s + g.modules.length, 0)
