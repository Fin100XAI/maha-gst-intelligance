/* ---------------------------------------------------------------------------
 * ENGINE STACK — feasibility against the data that actually exists
 *
 * Fifteen engines mapped to the fields the department can supply today, each
 * classified by technique and given a verdict backed by something checkable
 * rather than an opinion. The point is to separate what can be built and
 * validated in the pilot from what would be a promise.
 *
 * THREE ABSENCES DECIDE MOST OF IT
 *
 *   1. NO ENTITY-LINKAGE FIELDS. There is no PAN, director, proprietor, bank
 *      account or authorised signatory on a registration. That is the spine of
 *      the intelligence graph — GSTIN to PAN to director to address — and
 *      without it no engine can traverse between registrations. Every "which
 *      connected entities inherit this exposure" capability fails here, and it
 *      fails for want of five columns rather than for want of modelling.
 *
 *   2. NO INVOICE-LEVEL DATA. Returns are held as period aggregates. Network
 *      edges carry a from, a to and a value, with no invoice identity, date,
 *      HSN or tax split. Propagation can therefore be modelled between
 *      clusters but not traced between GSTIN layers.
 *
 *   3. NO MULTI-PERIOD HISTORY. Each taxpayer is a single snapshot. Anything
 *      asking "is this deteriorating" needs a trajectory, and a trajectory
 *      needs periods.
 *
 * ON GENERATIVE AI: none of the fifteen should use it, and none does. The
 * copilot is retrieval-only by deliberate design — it cites a held record or
 * declines. Generation belongs nowhere near a statutory determination.
 * ------------------------------------------------------------------------- */

export const TECHNIQUES = {
  rule: { id: 'rule', label: 'Rule Engine', note: 'Deterministic, auditable, defensible in appeal. The default where the law or a policy already states the logic.' },
  legal: { id: 'legal', label: 'Legal Engine', note: 'Statute and notifications encoded as computation. Not a model — arithmetic on legal rules, which is why it can be relied on.' },
  graph: { id: 'graph', label: 'Graph AI', note: 'Traversal, cycle detection and centrality over an entity network. Needs edges that exist.' },
  ml: { id: 'ml', label: 'ML', note: 'Supervised learning from labelled outcomes. Needs labels, and enough of them to separate.' },
  unsup: { id: 'unsup', label: 'Unsupervised', note: 'Anomaly and structure discovery without labels. Needs features the rulebook does not already encode.' },
  hybrid: { id: 'hybrid', label: 'Hybrid', note: 'Rule or legal core with a model or graph component layered on it.' }
}

export const STATUS = {
  built: { id: 'built', label: 'Built', tone: 'green', note: 'Running in this platform against the current data.' },
  partial: { id: 'partial', label: 'Partial', tone: 'amber', note: 'The part the data supports is built; the rest is named and blocked.' },
  blocked: { id: 'blocked', label: 'Blocked', tone: 'red', note: 'Cannot be built on the data available. The missing input is stated, not the modelling effort.' }
}

/* The graph the stack should sit on. Each hop marked for whether the field
 * that makes it traversable exists today. */
export const GRAPH_SPINE = [
  { hop: 'GSTIN', have: true, note: 'Present on every record and the join key throughout.' },
  { hop: 'PAN', have: false, note: 'Absent. Without it registrations cannot be grouped to a common holder.' },
  { hop: 'Registration', have: true, note: 'Date, status and district present.' },
  { hop: 'Director / Proprietor', have: false, note: 'Absent. This is the single most valuable missing hop — it is how shell networks are actually identified.' },
  { hop: 'Address', have: true, note: 'Present, but synthesised per taxpayer here so collisions are not meaningful in this build.' },
  { hop: 'Bank / account signals', have: false, note: 'Absent, and lawfully constrained. Should be scoped explicitly rather than assumed.' },
  { hop: 'Invoice', have: false, note: 'Absent. Only period aggregates are held.' },
  { hop: 'ITC', have: 'partial', note: 'Claimed amount per period, not per invoice or counterparty.' },
  { hop: 'Supplier / Recipient', have: 'partial', note: 'Cluster edges only, with a value and no invoice identity.' },
  { hop: 'E-way Bill', have: true, note: 'Present with value, distance, route and a return-match flag.' },
  { hop: 'Return', have: 'partial', note: 'Filing status and period aggregates; no line items.' },
  { hop: 'Notice', have: true, note: 'Type, issue date, due date and status.' },
  { hop: 'Case', have: true, note: 'Audit and litigation cases with stage and exposure.' },
  { hop: 'Evidence', have: false, note: 'Absent. No document or transaction artefacts are held against a case.' },
  { hop: 'Order', have: 'partial', note: 'Outcome stage only — no order text, ground of decision, or evidence relied on.' },
  { hop: 'Appeal', have: true, note: 'Stage and ageing present.' },
  { hop: 'Recovery', have: 'partial', note: 'Modelled from a stated decay curve, not observed.' },
  { hop: 'Outcome', have: 'partial', note: '10 concluded proceedings. Enough to retrieve comparables, nowhere near enough to learn from.' }
]

export const ENGINES = [
  {
    n: 1,
    name: 'ITC-Network Risk Engine',
    answers: 'Where is suspicious ITC originating, propagating and ultimately being consumed across multiple GSTIN layers?',
    technique: ['graph'],
    status: 'partial',
    have: 'Cluster edges with a rupee value, supplier and buyer risk scalars, and a hop-utilisation model that estimates how much credit has already been consumed downstream.',
    missing: 'Invoice-level GSTR-2A/2B flow. Propagation is modelled between clusters, not traced between GSTIN layers, so "which layer consumed it" cannot be answered.',
    evidence: 'Chain exposure runs over 3 clusters and 10 entities; edges carry from, to and value only.',
    where: 'network-enforcement'
  },
  {
    n: 2,
    name: 'Circular-Trading Indicator Engine',
    answers: 'Are invoices moving through an entity network in circular patterns without economic substance?',
    technique: ['graph', 'rule'],
    status: 'partial',
    have: 'Directed cycle detection, run per node to test whether removing it actually stops the circulation — which is how the decoy nodes were found.',
    missing: 'Economic substance indicators. Nothing in the data speaks to assets, employees, power consumption or transport capacity, so circularity is detected but substance cannot be tested against it.',
    evidence: 'Cycle detection is implemented and found 1 node whose removal leaves the chain running.',
    where: 'network-enforcement'
  },
  {
    n: 3,
    name: 'Registration-Risk Engine',
    answers: 'Which registrations show shell indicators, and which connected registrations inherit that exposure?',
    technique: ['rule', 'graph'],
    status: 'partial',
    have: 'Day-0 registration indicators as a stated rule set, checkable at registration rather than reconstructed a year later.',
    missing: 'The inheritance half entirely. Without PAN, director or proprietor there is no edge along which exposure can be inherited between registrations.',
    evidence: 'Tested: contact details here are synthesised per taxpayer, so apparent shared-email groups are a trade-name artefact rather than a linkage signal.',
    where: 'recovery-window'
  },
  {
    n: 4,
    name: 'Revenue-Risk Engine',
    answers: 'Where is revenue exposed, how much is at risk, and what drives the estimate?',
    technique: ['rule', 'hybrid'],
    status: 'built',
    have: 'Exposure deduplicated across five mechanisms so the same rupee is counted once, a decay curve over 0–365 days, and a limitation cliff applied on top of it.',
    missing: 'Nothing blocking. The decay curve is a stated assumption rather than an observed rate — see engine 13.',
    evidence: 'Rs 43.16 Cr protectable against a naive mechanism sum of Rs 59.61 Cr; the Rs 16.45 Cr gap is the double-count avoided.',
    where: 'revenue-protection'
  },
  {
    n: 5,
    name: 'Compliance Deterioration Engine',
    answers: 'Which currently compliant taxpayers are starting to deteriorate, before a threshold is breached?',
    technique: ['ml'],
    status: 'blocked',
    have: 'Threshold-based early warning — non-filing, sharp revenue drop, sector deviation. That is the conventional version, which fires after the line is crossed.',
    missing: 'Multi-period behavioural history. Deterioration is a trajectory, and each taxpayer here is a single snapshot, so there is no slope to measure.',
    evidence: 'No per-taxpayer time series exists in the data; revenueDropPct is a single scalar, not a series.',
    where: 'early-warning'
  },
  {
    n: 6,
    name: 'Network Anomaly Engine',
    answers: 'What unusual relationships exist that the predefined rules are not looking for?',
    technique: ['unsup', 'graph'],
    status: 'partial',
    have: 'Peer-relative anomaly detection over behavioural ratios, using median and MAD so the outliers being hunted do not inflate the spread they are measured against.',
    missing: 'The graph half. Structural anomaly needs the linkage edges that are absent.',
    evidence: 'Runs and returns nothing, provably: three of the nine encoded rules are computed from the same ratios, so no unflagged taxpayer reaches the outlier threshold on any of them.',
    where: 'unknown-risk'
  },
  {
    n: 7,
    name: 'Case-Priority Engine',
    answers: 'Which cases should officers examine first, on evidence, exposure, urgency, recoverability and capacity?',
    technique: ['rule', 'hybrid'],
    status: 'built',
    have: 'Six-factor ranking by recoverable value per officer-day, with capacity modelled as a constrained assignment under hard territorial and role eligibility.',
    missing: 'Nothing blocking.',
    evidence: '58% of departmental capacity is used while 51 cases worth Rs 18.78 Cr cannot be reached — the finding aggregate utilisation hides.',
    where: 'case-priority'
  },
  {
    n: 8,
    name: 'Investigation Evidence Engine',
    answers: 'What transactions, counterparties, timelines and anomalies support the officer’s hypothesis?',
    technique: ['hybrid'],
    status: 'partial',
    have: 'A seven-element evidence-to-action brief per case: signals with weights, provision engaged, precedent, exposure, decomposed confidence, limitation and next step — each naming the system it came from.',
    missing: 'Documents and transactions. No artefact is held against a case, so the brief assembles metadata about evidence rather than the evidence.',
    evidence: 'The Evidence hop of the graph spine is absent entirely.',
    where: 'officer-copilot'
  },
  {
    n: 9,
    name: 'Historical Case Outcome Engine',
    answers: 'What happened to historically similar cases?',
    technique: ['ml', 'graph'],
    status: 'partial',
    have: 'Comparability scored on the dimensions that decide outcomes — question of law and evidential position carry 60% of the weight, sector deliberately 5% — with individual outcomes shown and distinguishers beside every match.',
    missing: 'Five to ten years of history. Ten concluded proceedings support retrieval of comparables; they do not support a rate, and the module refuses to state one where fewer than five share the question of law.',
    evidence: '10 concluded outcomes across 7 questions of law — no question reaches 5.',
    where: 'case-twin'
  },
  {
    n: 10,
    name: 'Missed Revenue Discovery Engine',
    answers: 'What revenue exposure was never surfaced or escalated by the existing workflow?',
    technique: ['rule', 'hybrid'],
    status: 'built',
    have: 'Cases put down while signals were still live — audits closed with rules firing, taxpayers never noticed despite them — each with the signals, what the department did, comparable concluded proceedings, and the checks required before reopening.',
    missing: 'Nothing blocking, but only 4 of 56 carry a confirmed live limitation clock, so the figure is what they represent rather than what is recoverable.',
    evidence: '56 candidates, 2 closed with signals live and 54 never actioned.',
    where: 'missed-revenue'
  },
  {
    n: 11,
    name: 'Fraud / Suppression Review Intelligence',
    answers: 'Which cases resemble historically established suppression, for officer and legal review?',
    technique: ['ml'],
    status: 'blocked',
    have: 'The refusal, measured. And the review-candidate half, which does not depend on the label.',
    missing: 'A positive class that separates. Section 74 gives one example; substituting "sustained on appeal" gives eight, and those eight are statistically indistinguishable from litigation in general.',
    evidence: 'Separation test: 0 of 5 features reach an effect size of 0.5. Risk rules firing come out at exactly 0.00 — cases the department won fire the same number of rules as cases in general.',
    where: 'missed-revenue'
  },
  {
    n: 12,
    name: 'Limitation & Time-Barring Engine',
    answers: 'What is the case-specific statutory deadline, and what exposure is approaching it?',
    technique: ['legal'],
    status: 'built',
    have: 'Sections 73, 74 and 74A computed per case in UTC from the annual return due date, with Notifications 09/2023 and 56/2023 applied and flagged as contested.',
    missing: 'Nothing. This is arithmetic on statute, not a model, which is why it can be relied on in a notice.',
    evidence: '8 proceedings past their deadline at Rs 10.84 Cr; the verdict now propagates into the audit queue, where 7 open cases sat on dead periods.',
    where: 'statutory-time'
  },
  {
    n: 13,
    name: 'Revenue Recovery Probability Engine',
    answers: 'What is likely to be recovered, rather than what was demanded?',
    technique: ['ml', 'hybrid'],
    status: 'partial',
    have: 'A continuous decay curve with interpolation between anchors, plus transparent recovery proxies — still filing, non-filer, in appeal — applied as stated adjustments.',
    missing: 'The curve is asserted, not learned. Turning it into a probability model needs observed recovery against demand across closed cases, which the data does not carry.',
    evidence: 'Recovery is modelled from stated anchors; the Recovery hop of the graph spine is modelled rather than observed.',
    where: 'recovery-window'
  },
  {
    n: 14,
    name: 'Case Outcome Prediction Engine',
    answers: 'What is the likely adjudication and recovery outcome, with the evidence behind it?',
    technique: ['ml'],
    status: 'blocked',
    have: 'The comparables and their real outcomes, shown individually — which is retrieval, not prediction.',
    missing: 'Features that predict. The same separation test that blocks engine 11 blocks this: the features available describe a taxpayer, not why a demand held up.',
    evidence: 'Contrast class is 2 proceedings. A model trained on wins alone learns what cases look like, not what winning looks like.',
    where: 'case-twin'
  },
  {
    n: 15,
    name: 'Unknown-Risk Discovery Engine',
    answers: 'What emerging structures exist that today’s risk parameters do not contain?',
    technique: ['unsup', 'graph'],
    status: 'built',
    have: 'Screens only the 66 taxpayers no encoded rule touches, peer-relative and robust, with the rulebook-overlap proof of why it is silent.',
    missing: 'Features the rulebook does not already encode — which in practice means the linkage fields.',
    evidence: 'Highest deviation among unflagged taxpayers is 3.47 against a 3.5 threshold; flagged taxpayers reach 6.85.',
    where: 'unknown-risk'
  }
]

const by = s => ENGINES.filter(e => e.status === s).length

export const STACK_SUMMARY = {
  total: ENGINES.length,
  built: by('built'),
  partial: by('partial'),
  blocked: by('blocked'),
  graphHopsPresent: GRAPH_SPINE.filter(h => h.have === true).length,
  graphHopsPartial: GRAPH_SPINE.filter(h => h.have === 'partial').length,
  graphHopsAbsent: GRAPH_SPINE.filter(h => h.have === false).length,
  totalHops: GRAPH_SPINE.length
}

/* What the 500-case extract must carry, in the order that unlocks most. */
export const PILOT_REQUIREMENTS = [
  {
    id: 'linkage',
    field: 'PAN, director/proprietor, authorised signatory per registration',
    unlocks: 'Engines 1, 3, 6 and 15 — every "connected entity" capability in the stack',
    why: 'The rulebook detects circular trading from invoice flow. It does not detect shared identity, which is how shell networks are actually found. This is five columns, not a modelling programme.',
    priority: 1
  },
  {
    id: 'outcomes',
    field: 'Adjudication outcome per closed case, with the ground of decision and the evidence relied on',
    unlocks: 'Engines 9, 11, 13 and 14 — the entire outcome-learning tier',
    why: 'Outcomes must distinguish fraud sustained from fraud alleged, and merits decisions from limitation and procedural ones. Without the ground of decision a model trains on two different questions at once.',
    priority: 2
  },
  {
    id: 'periods',
    field: 'Multi-period returns per taxpayer, not a single snapshot',
    unlocks: 'Engine 5, and materially improves 4 and 13',
    why: 'Deterioration is a trajectory. A snapshot cannot show one, so today the platform can only fire after a threshold is crossed.',
    priority: 3
  },
  {
    id: 'invoice',
    field: 'Invoice-level GSTR-1 / 2B rather than period aggregates',
    unlocks: 'Engines 1, 2 and 8',
    why: 'Propagation between GSTIN layers, economic-substance testing, and evidence that names a transaction rather than a period.',
    priority: 4
  }
]

export const ARCHITECTURE_NOTE =
  'The stack is not fifteen dashboards here, and should not become them. Limitation, recovery, capacity, similarity and the case object are each computed once and consumed by every screen that needs them — which is why the command centre can deduplicate exposure across five mechanisms rather than adding five module totals together, and why a statutory verdict computed in one place now appears in the audit queue. What does not yet exist is the entity graph beneath that: the case object is assembled per taxpayer, not traversed between them, and it cannot be traversed while the linkage hops are missing.'

export const GENAI_NOTE =
  'None of the fifteen uses generative AI, and none should. The copilot is retrieval-only by deliberate design: it cites a record the platform holds or it declines and names the feed that would answer. Generation belongs nowhere near a statutory determination, and an earlier version of that copilot which invented a taxpayer reply is the reason this is stated as a rule rather than a preference.'
