/* ---------------------------------------------------------------------------
 * ENGINE REGISTRY — one owner per question
 *
 * This exists because two engines were built for the same question without
 * noticing each other. The recovery module and the capacity module both
 * answered "what can a week of officer work buy", independently, and gave
 * different establishments — 24 officers at 3 days against 25 at 3.5. A
 * Commissioner comparing the two screens would have found the platform
 * disagreeing with itself about how many officers the department has.
 *
 * Nothing in the codebase prevented that. A new engine could be written, wired
 * into a screen and shipped without anything noticing that its question was
 * already answered elsewhere. This registry is the thing that notices.
 *
 * THE RULE
 *
 * Every engine declares the question it owns and the constants that are its
 * answer. `npm run audit` fails if two engines claim the same question, if a
 * declared owner does not export what it claims, or if an owned constant is
 * recomputed in a module that does not own it.
 *
 * Adding an engine means adding an entry here first. If the question is already
 * taken, the answer is to extend the existing engine rather than build a second
 * one — which is what should have happened with capacity.
 * ------------------------------------------------------------------------- */

export const ENGINE_REGISTRY = [
  {
    id: 'statutory',
    file: 'statutory.js',
    owns: 'What is the statutory deadline for this proceeding, and what has passed it?',
    canonical: ['LIMITATION_REGISTER', 'LIMITATION_SUMMARY', 'computeLimitation'],
    note: 'Sections 73/74/74A computed in UTC from the annual return due date. The only place limitation is decided.'
  },
  {
    id: 'recovery',
    file: 'recovery.js',
    owns: 'How much of a demand is still collectable, and how fast does that fall with age?',
    canonical: ['RECOVERY_CASES', 'RECOVERY_PORTFOLIO', 'recoverabilityFor'],
    note: 'The decay curve. Anything that needs a recoverable value asks here rather than modelling its own.'
  },
  {
    id: 'capacity',
    file: 'capacity.js',
    owns: 'How much officer capacity exists, who is eligible for what, and what can a week absorb?',
    canonical: ['CAPACITY_RESULT', 'NET_DAYS_PER_OFFICER', 'CAPACITY_ASSUMPTIONS'],
    note: 'The establishment and the constrained assignment. Recovery once stated its own officer count and contradicted this; it no longer does.'
  },
  {
    id: 'priority',
    file: 'priority.js',
    owns: 'In what order should cases be worked?',
    canonical: ['PRIORITY_QUEUE', 'PRIORITY_CASES', 'officerEffort'],
    note: 'Six-factor ranking by recoverable value per officer-day, and the effort estimate every other engine spends.'
  },
  {
    id: 'caseTwin',
    file: 'caseTwin.js',
    owns: 'What does the department hold on one taxpayer, and where did each fact come from?',
    canonical: ['buildCaseTwin', 'TWIN_INDEX', 'SOURCE_SYSTEMS', 'STATUTORY_INDEX'],
    note: 'The assembled case object. Screens read it rather than re-joining the underlying arrays.'
  },
  {
    id: 'similarity',
    file: 'similarity.js',
    owns: 'Which concluded proceedings are comparable to this case, and what happened in them?',
    canonical: ['findComparables', 'OUTCOME_POOL', 'DIMENSIONS'],
    note: 'Comparability weighted by what decides outcomes. The only place a comparable is defined.'
  },
  {
    id: 'precedent',
    file: 'precedent.js',
    owns: 'What authority bears on a question of law, and does it bind here?',
    canonical: ['AUTHORITIES', 'questionStatus', 'FORUMS'],
    note: 'Forum hierarchy and still-good-law status. Not similarity — that is the similarity engine.'
  },
  {
    id: 'networkAction',
    file: 'networkAction.js',
    owns: 'Where does acting on a chain actually stop it, and can the department execute that?',
    canonical: ['NETWORK_PLANS', 'NETWORK_ACTION_SUMMARY'],
    note: 'Cut-point and coordination. Detection of the chain itself belongs to the cluster data.'
  },
  {
    id: 'discovery',
    file: 'discovery.js',
    owns: 'What is anomalous among taxpayers the encoded rules do not touch?',
    canonical: ['DISCOVERIES', 'DISCOVERY_SUMMARY', 'RULEBOOK_OVERLAP'],
    note: 'Unsupervised, peer-relative. Deliberately screens only the population the rulebook misses.'
  },
  {
    id: 'retrospective',
    file: 'retrospective.js',
    owns: 'What would earlier action have been worth, and which cases were put down while live?',
    canonical: ['COUNTERFACTUALS', 'REVISIT_CANDIDATES', 'SEPARATION_TEST'],
    note: 'Timing counterfactual and revisit candidates. Uses the recovery curve rather than restating it.'
  },
  {
    id: 'commandCentre',
    file: 'commandCentre.js',
    owns: 'What is the total protectable exposure, counted once across every mechanism?',
    canonical: ['COMMAND_SUMMARY', 'AT_RISK', 'HORIZON_PROFILE'],
    note: 'The deduplication. Exists precisely so no screen sums mechanism totals.'
  },
  {
    id: 'commandBoard',
    file: 'commandBoard.js',
    owns: 'Which conditions need a decision now, and who takes it?',
    canonical: ['CONDITIONS', 'BOARD_SUMMARY'],
    note: 'Reads every other engine. Computes no exposure of its own.'
  },
  {
    id: 'actionBrief',
    file: 'actionBrief.js',
    owns: 'What does an officer need in front of them before acting on one alert?',
    canonical: ['buildActionBrief', 'CONFIDENCE_LEVELS'],
    note: 'Assembles from the other engines. Confidence is decomposed, never blended into one number.'
  }
]

/* Modules that legitimately consume an owned constant. Anything outside this
 * list touching one is what the audit is looking for. */
export const SANCTIONED_CONSUMERS = {
  RECOVERY_PORTFOLIO: ['commandCentre.js', 'commandBoard.js', 'platformMap.js'],
  recoverabilityFor: ['commandCentre.js', 'retrospective.js', 'networkAction.js'],
  CAPACITY_RESULT: ['commandCentre.js', 'commandBoard.js', 'engineStack.js'],
  NET_DAYS_PER_OFFICER: [],
  LIMITATION_REGISTER: ['caseTwin.js', 'precedent.js', 'priority.js', 'commandCentre.js', 'retrospective.js'],
  LIMITATION_SUMMARY: ['commandCentre.js', 'commandBoard.js', 'engineStack.js'],
  PRIORITY_QUEUE: ['capacity.js', 'engineStack.js'],
  RECOVERY_CASES: ['caseTwin.js', 'priority.js', 'commandCentre.js', 'retrospective.js'],
  buildCaseTwin: ['copilot.js', 'actionBrief.js', 'retrospective.js'],
  findComparables: ['retrospective.js', 'actionBrief.js'],
  questionStatus: ['actionBrief.js', 'commandBoard.js', 'engineStack.js'],
  NETWORK_ACTION_SUMMARY: ['commandBoard.js', 'engineStack.js', 'commandCentre.js'],
  COMMAND_SUMMARY: ['commandBoard.js', 'engineStack.js'],
  AT_RISK: [],
  DISCOVERY_SUMMARY: ['engineStack.js'],
  COUNTERFACTUALS: [],
  REVISIT_CANDIDATES: [],
  SEPARATION_TEST: []
}

export const REGISTRY_RULE =
  'Before adding an engine, add its entry here. If the question is already owned, extend that engine instead of writing a second one — a second engine answering the same question will disagree with the first eventually, and the disagreement will surface in front of a Commissioner rather than in a test.'
