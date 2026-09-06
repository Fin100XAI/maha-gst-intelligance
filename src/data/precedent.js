/* ---------------------------------------------------------------------------
 * PRECEDENT INTELLIGENCE
 *
 * NOT a similarity engine. The version this replaces matched on sector alone,
 * called the results "comparable" and "historical", and was removed for saying
 * two things that were untrue.
 *
 * Precedent in tax law is not similarity — it is AUTHORITY. What decides
 * whether a prior decision helps an officer is:
 *
 *   1. WHICH FORUM decided it — Supreme Court binds everyone; the jurisdictional
 *      High Court binds this state; another state's High Court is persuasive
 *      only; a departmental adjudication order is not precedent at all.
 *   2. WHETHER IT STILL STANDS — reversed, stayed, or pending before a higher
 *      forum. A precedent under challenge is worse than none, because relying
 *      on it creates exposure the officer did not know they had.
 *   3. WHETHER OTHER FORUMS DISAGREE — a question with conflicting High Courts
 *      is unsettled, and the platform must say so rather than pick a side.
 *
 * NO FABRICATED CITATIONS
 *
 * Every external authority below was verified against a published source and is
 * recorded at the level of certainty actually obtained: where a case name was
 * confirmed it is given, and where only the holding was confirmed the entry
 * says so instead of inventing a party name or a reporter citation. A fabricated
 * case citation inside a notice is the single most damaging output this platform
 * could produce, so the model refuses to hold one.
 *
 * The departmental precedent below is different in kind: it is this
 * department's own concluded proceedings, which is institutional memory rather
 * than judicial authority, and is labelled as such throughout.
 * ------------------------------------------------------------------------- */

import { LITIGATION_CASES, LEGAL_ISSUES } from './mockData.js'
import { LIMITATION_REGISTER } from './statutory.js'

/* Binding weight is relative to the forum deciding the present case. These
 * values are for a Maharashtra state tax authority — the same authority carries
 * a different weight for an officer in another state, which is why jurisdiction
 * is modelled rather than assumed. */
export const FORUMS = {
  sc: { label: 'Supreme Court of India', rank: 1, bindingInMaharashtra: true, note: 'Binds every court and authority in India under Article 141.' },
  hc_bom: { label: 'Bombay High Court', rank: 2, bindingInMaharashtra: true, note: 'The jurisdictional High Court for Maharashtra. Binding on all authorities within the state.' },
  hc_other: { label: 'High Court (other State)', rank: 3, bindingInMaharashtra: false, note: 'Persuasive only. May be relied on in argument but does not bind a Maharashtra authority.' },
  tribunal: { label: 'Appellate Tribunal', rank: 4, bindingInMaharashtra: false, note: 'Persuasive at adjudication level; binding on subordinate authorities within its own jurisdiction.' },
  appellate: { label: 'Departmental Appellate Authority', rank: 5, bindingInMaharashtra: false, note: 'Not precedent. Useful as departmental practice, not as authority.' },
  adjudication: { label: 'Adjudication order', rank: 6, bindingInMaharashtra: false, note: 'Not precedent in any sense. Records how one case was decided on its own facts.' }
}

export const STATUS = {
  good: { label: 'Stands', tone: 'green', note: 'No known challenge. May be relied on subject to the usual forum rules.' },
  pending_higher: { label: 'Under challenge', tone: 'amber', note: 'The question is before a higher forum. Relying on this creates exposure if the decision goes the other way.' },
  conflicting: { label: 'Conflicting authority', tone: 'orange', note: 'Other courts of equal rank have decided the opposite. The question is unsettled.' },
  reversed: { label: 'Reversed / set aside', tone: 'red', note: 'No longer good law. Must not be relied on.' }
}

/* ---------------------------------------------------------------------------
 * VERIFIED EXTERNAL AUTHORITIES
 *
 * Read from published sources on 2026-09-06. This is a worked example, not a
 * corpus — the departmental order archive is not connected, and the module says
 * so. What it demonstrates is the model: four authorities on one question, in
 * three different postures, none of them binding in Maharashtra.
 * ------------------------------------------------------------------------- */
export const AUTHORITIES = [
  {
    id: 'AUTH-001',
    question: 'q_168a',
    forum: 'hc_other',
    court: 'Gauhati High Court',
    caseName: 'M/s Barkataki Print and Media Services v. Union of India',
    decidedOn: '2024-09-19',
    holding: 'Notification 56/2023-CT is ultra vires Section 168A of the CGST Act, having been issued without the mandatory prior recommendation of the GST Council. Orders passed beyond the unextended limitation period were quashed.',
    favours: 'assessee',
    status: 'pending_higher',
    verified: 'Case name and holding confirmed from published reports.',
    source: 'https://taxguru.in/goods-and-service-tax/notification-56-2023-ce-dated-28-12-2023-ultra-vires-section-168a-cgst-act-2017-gauhati-hc.html'
  },
  {
    id: 'AUTH-002',
    question: 'q_168a',
    forum: 'hc_other',
    court: 'Patna High Court',
    caseName: null,
    decidedOn: null,
    holding: 'Upheld the validity of Notification 56/2023-CT, taking the opposite view to the Gauhati High Court on the same question.',
    favours: 'department',
    status: 'conflicting',
    verified: 'Holding confirmed from published reports; case name and date not established, and are deliberately not stated.',
    source: 'https://anptaxcorp.com/supreme-court-reserves-verdict-on-gst-scn/'
  },
  {
    id: 'AUTH-003',
    question: 'q_168a',
    forum: 'hc_other',
    court: 'Allahabad High Court',
    caseName: null,
    decidedOn: null,
    holding: 'Upheld the validity of Notification 09/2023-CT extending the limitation period under Section 73.',
    favours: 'department',
    status: 'conflicting',
    verified: 'Holding confirmed from published reports; case name and date not established, and are deliberately not stated.',
    source: 'https://anptaxcorp.com/supreme-court-reserves-verdict-on-gst-scn/'
  },
  {
    id: 'AUTH-004',
    question: 'q_168a',
    forum: 'sc',
    court: 'Supreme Court of India',
    caseName: 'M/s HCC-SEW-MEIL-AAG JV v. Assistant Commissioner of State Tax & Ors, SLP (C) No. 4240 of 2025',
    decidedOn: null,
    holding: 'Judgment reserved on whether the adjudication time limit under Section 73 may be extended by notification under Section 168A. Will settle the conflict between the High Courts and bind all authorities once delivered.',
    favours: 'undecided',
    status: 'pending_higher',
    verified: 'SLP number, parties and reserved status confirmed from published reports.',
    source: 'https://anptaxcorp.com/supreme-court-reserves-verdict-on-gst-scn/'
  }
]

export const LEGAL_QUESTIONS = [
  {
    id: 'q_168a',
    label: 'May the adjudication time limit under Section 73 be extended by notification under Section 168A?',
    affects: 'Every proceeding whose limitation date rests on Notification 09/2023-CT or 56/2023-CT.',
    sections: ['s73'],
    whyItMatters: 'If the notifications fall, the extended deadlines fall with them and any order passed after the unextended date is void. The exposure is not a risk of losing on merits — it is a risk of the demand never having been validly raised.'
  }
]

/* Settled-status for a question, derived from its authorities rather than
 * asserted. The rule that matters: a question with a binding decision is
 * settled; one with conflicting non-binding decisions and a reserved Supreme
 * Court judgment is not, and no amount of case-matching makes it so. */
export function questionStatus(questionId) {
  const auths = AUTHORITIES.filter(a => a.question === questionId)
  const binding = auths.filter(a => FORUMS[a.forum].bindingInMaharashtra && a.status === 'good' && a.decidedOn)
  const pendingApex = auths.some(a => a.forum === 'sc' && a.status === 'pending_higher')
  const forDept = auths.filter(a => a.favours === 'department').length
  const forAssessee = auths.filter(a => a.favours === 'assessee').length

  let verdict, tone, text
  if (binding.length) {
    verdict = 'Settled'
    tone = 'green'
    text = `Settled by ${binding[0].court}, which binds authorities in Maharashtra.`
  } else if (pendingApex) {
    verdict = 'Unsettled — before the Supreme Court'
    tone = 'red'
    text = 'No binding authority applies in Maharashtra, High Courts have taken opposite views, and the Supreme Court has reserved judgment. Proceedings that depend on this question carry live risk until it is delivered.'
  } else if (forDept && forAssessee) {
    verdict = 'Unsettled — conflicting authority'
    tone = 'orange'
    text = 'High Courts of equal rank have decided the question both ways and none of them binds Maharashtra.'
  } else {
    verdict = 'Persuasive only'
    tone = 'amber'
    text = 'Authority exists but none of it binds a Maharashtra authority.'
  }
  return { verdict, tone, text, authorities: auths, forDept, forAssessee, bindingCount: binding.length }
}

/* Which proceedings actually turn on an unsettled question — the thing that
 * makes this operational rather than a reading list.
 *
 * Note these are NOT only the live ones. If Section 168A cannot support the
 * notifications, the extended deadline never existed, and an order already
 * passed under it was void when it was made. The exposure is therefore
 * two-sided: demands not yet raised may be out of time, and demands already
 * raised and collected may have to be given back. */
export function casesTurningOn(questionId) {
  if (questionId !== 'q_168a') return []
  const rows = LIMITATION_REGISTER.filter(r => r.contested)
  const exposureCr = Math.round((rows.reduce((s, r) => s + r.exposure, 0) / 10000000) * 100) / 100
  return Object.assign(rows, {
    exposureCr,
    ifStruckDown: 'The extended deadline never existed. Any order passed after the unextended date was void when made, and demand already collected under it is liable to be refunded.',
    ifUpheld: 'The extension stands and these proceedings were validly within time.'
  })
}

/* ---------------------------------------------------------------------------
 * DEPARTMENTAL PRECEDENT — institutional memory, not judicial authority.
 *
 * Outcomes from this department's own concluded proceedings, grouped by the
 * question of law rather than by sector.
 *
 * The sample-size gate is the important part. With three concluded cases, a
 * "100% success rate" is noise presented as insight, and an officer who acts on
 * it has been misled by arithmetic. Below the threshold the module reports the
 * count and explicitly declines to state a rate.
 * ------------------------------------------------------------------------- */
const MIN_SAMPLE = 5
const CONCLUDED = ['Order Confirmed', 'Order Reversed', 'Remanded']

export const DEPARTMENTAL_PRECEDENT = LEGAL_ISSUES.map(issue => {
  const all = LITIGATION_CASES.filter(c => c.issue === issue)
  const concluded = all.filter(c => CONCLUDED.includes(c.stage))
  const confirmed = concluded.filter(c => c.stage === 'Order Confirmed').length
  const reversed = concluded.filter(c => c.stage === 'Order Reversed').length
  const remanded = concluded.filter(c => c.stage === 'Remanded').length
  const adequate = concluded.length >= MIN_SAMPLE
  const weakDocs = all.filter(c => c.departmentPosition === 'Weak — documentation gap').length
  const weakPrecedent = all.filter(c => c.departmentPosition === 'Weak — precedent unfavourable').length

  return {
    issue,
    totalCases: all.length,
    concludedCount: concluded.length,
    pendingCount: all.length - concluded.length,
    confirmed,
    reversed,
    remanded,
    disputedCr: Math.round((all.reduce((s, c) => s + c.disputedAmount, 0) / 10000000) * 100) / 100,
    medianAgeingDays: (() => {
      const d = all.map(c => c.ageingDays).sort((a, b) => a - b)
      return d.length ? d[Math.floor(d.length / 2)] : null
    })(),
    weakDocs,
    weakPrecedent,
    sampleAdequate: adequate,
    // Deliberately null below the threshold. A rate computed on two cases is
    // not a weaker signal — it is a misleading one.
    successRatePct: adequate ? Math.round((confirmed / concluded.length) * 100) : null,
    sampleNote: adequate
      ? `Based on ${concluded.length} concluded proceedings.`
      : `Only ${concluded.length} concluded proceeding(s) on this issue — below the ${MIN_SAMPLE}-case threshold, so no success rate is stated. The count is shown instead.`
  }
}).sort((a, b) => b.totalCases - a.totalCases)

/* Precedent for one live case: departmental history on the same question of
 * law, plus any external authority bearing on it, plus what would distinguish
 * the present facts. Never returns a "match score". */
export function precedentFor(litCase) {
  const dept = DEPARTMENTAL_PRECEDENT.find(d => d.issue === litCase.issue) || null
  const comparable = LITIGATION_CASES
    .filter(c => c.issue === litCase.issue && c.gstin !== litCase.gstin && CONCLUDED.includes(c.stage))
    .slice(0, 6)
  return {
    question: litCase.issue,
    departmental: dept,
    comparable,
    distinguishers: [
      'Facts differ between proceedings on the same issue; a matching legal question is not a matching case.',
      'Departmental outcomes reflect how these cases were argued and evidenced, not what a court would hold on different facts.',
      'None of the entries below is judicial authority. They are this department’s own decisions.'
    ]
  }
}

export const CORPUS_STATE = {
  connected: false,
  label: 'Departmental order and appellate archive',
  note: 'Real precedent retrieval requires the department’s order corpus — adjudication orders, appellate decisions and their subsequent history — indexed and citable to paragraph. That archive is not connected to this build. What is shown below is (a) this department’s own concluded proceedings, which is institutional memory rather than authority, and (b) a small set of externally verified judgments included to demonstrate how authority is weighted. Matching cases on sector or on text similarity is not precedent and is not offered.'
}
