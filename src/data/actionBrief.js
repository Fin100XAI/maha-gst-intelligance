/* ---------------------------------------------------------------------------
 * EVIDENCE-TO-ACTION BRIEF
 *
 * Seven things an officer needs before acting on an alert, assembled in one
 * place: the evidence, the section it engages, the precedent that bears on it,
 * the exposure, the confidence, the limitation position, and the next step.
 *
 * Most of these already existed somewhere in the platform. The problem was that
 * they existed in seven different screens, so an officer acting on an alert saw
 * the risk score and none of the rest. Precedent Intelligence in particular was
 * computed and never reached the point of decision — the same failure already
 * fixed for the statutory verdict.
 *
 * CONFIDENCE IS DECOMPOSED, AND THAT IS THE WHOLE POINT
 *
 * A single "87% confidence" on an alert is the most dangerous number a system
 * like this can print. Confidence in WHAT? The exposure arithmetic, the legal
 * position, the risk signal and the eventual outcome are four different
 * questions with four different answers, and on most cases here they are not
 * even close to each other:
 *
 *   - Exposure arithmetic: high. It is computed from records the platform holds.
 *   - Limitation position: high, UNLESS the deadline rests on a notification
 *     whose validity is reserved before the Supreme Court — in which case it is
 *     genuinely uncertain and saying otherwise is misleading.
 *   - Risk signal: moderate and explainable. Rules fired; rules are not proof.
 *   - Outcome on appeal: NOT STATED. The department does not yet have enough
 *     concluded proceedings on any question of law to support a number, and an
 *     invented one would be acted on.
 *
 * Collapsing those into one figure destroys exactly the information the officer
 * needs, because the right action differs. A case that is certain on arithmetic
 * and unsettled on law needs a legal view before it needs an officer-day.
 * ------------------------------------------------------------------------- */

import { LITIGATION_CASES } from './mockData.js'
import { buildCaseTwin, statutoryPositionFor, SOURCE_SYSTEMS } from './caseTwin.js'
import { questionStatus, DEPARTMENTAL_PRECEDENT, LEGAL_QUESTIONS, FORUMS } from './precedent.js'

const SECTION_LABEL = { s73: 'Section 73', s74: 'Section 74', s74A: 'Section 74A' }
const lakh = n => `₹${(n / 100000).toFixed(1)} L`

export const CONFIDENCE_LEVELS = {
  high: { label: 'High', tone: 'green', order: 3 },
  moderate: { label: 'Moderate', tone: 'amber', order: 2 },
  low: { label: 'Low', tone: 'red', order: 1 },
  unstated: { label: 'Not stated', tone: 'steel', order: 0 }
}

/* The four dimensions. Each carries WHY it is at that level — an unexplained
 * confidence rating is only marginally better than none. */
function confidenceOf(twin, statutory, precedent) {
  const dims = []

  dims.push({
    id: 'exposure',
    question: 'Is the exposure figure right?',
    level: 'high',
    because: 'Computed from returns and payment records the platform holds, not estimated. The recoverable share applies a published decay curve to the age of the signal.',
    caveat: 'It is an assessment of what is owed, not an assessed demand. A hearing may change it.'
  })

  if (!statutory) {
    dims.push({
      id: 'limitation',
      question: 'Is the limitation position right?',
      level: 'unstated',
      because: 'No limitation record exists for this taxpayer, so no statutory deadline has been computed.',
      caveat: 'Absence of a record is not the same as absence of a deadline.'
    })
  } else if (statutory.contested) {
    dims.push({
      id: 'limitation',
      question: 'Is the limitation position right?',
      level: 'low',
      because: 'The deadline depends on Notification 09/2023 or 56/2023. High Courts have divided on their validity and the Supreme Court has reserved judgment, so the applicable date is genuinely unsettled.',
      caveat: 'If the notifications fall, the extended deadline never existed and an order passed under it was void when made.'
    })
  } else {
    dims.push({
      id: 'limitation',
      question: 'Is the limitation position right?',
      level: 'high',
      because:
        'Computed from the statute and the annual return due date for {0} under {1}. Date arithmetic, not a model.',
      becauseArgs: [statutory.fy, statutory.sectionLabel],
      caveat: 'Assumes the financial year on record is the correct period for the demand.'
    })
  }

  const ruleCount = (twin.position.triggeredRules || []).length
  dims.push({
    id: 'signal',
    question: 'Is the risk signal sound?',
    level: ruleCount >= 3 ? 'moderate' : ruleCount > 0 ? 'low' : 'unstated',
    because: ruleCount
      ? `${ruleCount} encoded rule${ruleCount > 1 ? 's' : ''} fired, each traceable to a specific behaviour. Rules corroborate one another; ${ruleCount >= 3 ? 'three or more is a pattern rather than a coincidence' : 'fewer than three is suggestive rather than corroborated'}.`
      : 'No encoded rule fired for this taxpayer.',
    caveat: 'A rule firing is a reason to look, never a finding. Every one of them has innocent explanations.'
  })

  dims.push({
    id: 'outcome',
    question: 'Will this survive appeal and be recovered?',
    level: 'unstated',
    because: precedent.departmental && precedent.departmental.sampleAdequate
      ? `Departmental history on this question exists: ${precedent.departmental.concludedCount} concluded proceedings, ${precedent.departmental.successRatePct}% confirmed.`
      : 'The department does not yet hold enough concluded proceedings on any question of law to state an outcome rate. No number is offered rather than an unreliable one.',
    caveat: 'This is the dimension a commercial product would fabricate. It is left empty deliberately, and it is the gap the pilot should close by capturing outcomes from case one.'
  })

  return dims
}

/* Precedent that actually bears on THIS case — authority where the case turns
 * on a live question of law, departmental history where the department has
 * enough of it, and an explicit nothing where it has neither. */
function precedentFor(gstin, statutory) {
  const lit = LITIGATION_CASES.find(l => l.gstin === gstin) || null
  const departmental = lit
    ? DEPARTMENTAL_PRECEDENT.find(d => d.issue === lit.issue) || null
    : null

  let authority = null
  if (statutory && statutory.contested) {
    const q = LEGAL_QUESTIONS.find(x => x.id === 'q_168a')
    const status = questionStatus('q_168a')
    authority = {
      question: q.label,
      verdict: status.verdict,
      tone: status.tone,
      text: status.text,
      // Ordered by binding weight, because that is the only order that helps.
      authorities: [...status.authorities]
        .sort((a, b) => FORUMS[a.forum].rank - FORUMS[b.forum].rank)
        .map(a => ({
          court: a.court,
          caseName: a.caseName,
          holding: a.holding,
          favours: a.favours,
          binding: FORUMS[a.forum].bindingInMaharashtra,
          source: a.source
        }))
    }
  }

  return {
    authority,
    departmental,
    issue: lit ? lit.issue : null,
    // The honest default. Saying "no comparable precedent" is more useful than
    // presenting sector-matched cases as though they were authority.
    none: !authority && !(departmental && departmental.sampleAdequate),
    noneReason: 'No binding authority bears on this case, and the department has too few concluded proceedings on the question to state a departmental record. The order archive is not connected, so no citable precedent can be retrieved.'
  }
}

export function buildActionBrief(gstin) {
  const twin = buildCaseTwin(gstin)
  if (!twin) return null
  const statutory = statutoryPositionFor(gstin)
  const precedent = precedentFor(gstin, statutory)

  const openNotices = twin.proceedings.notices.filter(n => n.status !== 'Order Issued')
  const openAudit = twin.proceedings.audit.filter(c => c.stage !== 'Closed')

  return {
    gstin,
    tradeName: twin.identity.tradeName.value,
    division: twin.identity.division.value,
    district: twin.identity.district.value,

    // 1 — the evidence, with the system each fact came from
    evidence: {
      rules: (twin.position.triggeredRules || []).map(r => ({
        label: r.label,
        weight: r.weight,
        source: SOURCE_SYSTEMS.platform.owner
      })),
      proceedings: [
        ...openAudit.map(c => ({ kind: 'Audit case', ref: c.id, detail: `stage ${c.stage}`, source: SOURCE_SYSTEMS.bo.owner })),
        ...openNotices.map(n => ({ kind: n.type, ref: n.id, detail: n.status, source: SOURCE_SYSTEMS.bo.owner })),
        ...twin.proceedings.alerts.map(a => ({ kind: 'Alert', ref: a.id, detail: a.type, source: SOURCE_SYSTEMS.platform.owner }))
      ],
      filingStatus: twin.identity.filingStatus.value,
      complianceHistory: twin.identity.complianceHistory.value
    },

    // 2 — the provision engaged
    legal: statutory
      ? {
        section: statutory.section,
        sectionLabel: SECTION_LABEL[statutory.section] || statutory.sectionLabel,
        fy: statutory.fy,
        basis: twin.legal ? twin.legal.basis : null,
        contested: statutory.contested
      }
      : null,

    // 3 — precedent bearing on it
    precedent,

    // 4 — what is at stake
    exposure: {
      assessed: twin.position.exposure.value,
      recoverableNow: twin.position.recoverableNow ? twin.position.recoverableNow.value : null,
      decayNextWeek: twin.position.decayNextWeek ? twin.position.decayNextWeek.value : null,
      display: lakh(twin.position.exposure.value)
    },

    // 5 — confidence, decomposed
    confidence: confidenceOf(twin, statutory, precedent),

    // 6 — the statutory clock
    limitation: statutory,

    // 7 — what to do
    nextStep: twin.nextAction
  }
}

export const BRIEF_NOTE =
  'Everything above is assembled from records this platform holds, and each element names the system it came from. Nothing is generated. Where an element cannot be grounded it is shown as unavailable with the reason, rather than filled in — an alert that looks complete but contains one invented element is more dangerous than one that visibly has a gap.'

export const CONFIDENCE_NOTE =
  'Confidence is reported against four separate questions rather than as one number, because they have four different answers and they imply different actions. A case that is certain on the arithmetic and unsettled on the law needs a legal view before it needs an officer-day, and a single blended figure would hide exactly that. The outcome dimension is deliberately left unstated: the department does not yet hold enough concluded proceedings to support a figure, and this is the dimension a system under commercial pressure would invent.'
