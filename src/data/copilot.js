/* ---------------------------------------------------------------------------
 * GROUNDED CASE COPILOT
 *
 * A retrieval surface over the Case Digital Twin. It does not generate.
 *
 * WHY THIS REPLACED THE PREVIOUS COPILOT
 *
 * The version this supersedes invented a taxpayer's reply for any taxpayer
 * ("submitted a reply contesting the discrepancy on grounds of reconciliation
 * timing differences"), cited corpora that do not exist ("Historical department
 * success rate for similar issue category"), and derived its confidence rating
 * from the very risk score it was explaining. In a commercial product that is a
 * bug. In a tax administration it is disqualifying: one fabricated fact inside
 * an issued notice makes the notice defective and the platform indefensible.
 *
 * THE TWO RULES
 *
 *   1. Every statement cites a record this platform actually holds — the record
 *      id, the system it came from, and the date it was true.
 *   2. A question that cannot be grounded is DECLINED, naming the feed that
 *      would be required to answer it. It is never answered approximately.
 *
 * Rule 2 is the valuable one. An officer who is told "this needs GSTR-1 line
 * data, which is not connected" learns something true about the system. An
 * officer given a confident but invented answer learns something false, and
 * finds out at the appellate stage.
 * ------------------------------------------------------------------------- */

import { buildCaseTwin, SOURCE_SYSTEMS } from './caseTwin.js'

const lakh = n => `₹${(n / 100000).toFixed(1)} L`
const SECTION_LABEL = { s73: 'Section 73', s74: 'Section 74', s74A: 'Section 74A' }

// A statement and the record behind it. No statement ships without one.
const say = (text, record, source, asOf) => ({ text, cite: { record, source, asOf } })

export const QUESTIONS = [
  { id: 'position', label: 'What is this taxpayer’s current position?', grounded: true },
  { id: 'priority', label: 'Why is this case a priority?', grounded: true },
  { id: 'pending', label: 'What actions remain pending?', grounded: true },
  { id: 'history', label: 'What has happened on this case?', grounded: true },
  { id: 'network', label: 'Is this taxpayer linked to others?', grounded: true },
  { id: 'contradictions', label: 'What contradictions exist between GSTR-1, GSTR-3B and 2B?', grounded: false },
  { id: 'precedent', label: 'Show comparable previous orders', grounded: false },
  { id: 'reply', label: 'Summarise the taxpayer’s reply', grounded: false }
]

/* What each ungroundable question would need. Naming the specific feed — rather
 * than a generic "not available" — is what makes the refusal useful: it tells
 * the department exactly which integration would unlock the capability. */
const DECLINE = {
  contradictions: {
    reason: 'This requires return data at line-item level — outward supplies from GSTR-1, tax paid from GSTR-3B, and auto-populated credit from GSTR-2B for each tax period.',
    missingFeed: 'returns',
    wouldNeed: 'A GSTN returns feed at invoice or line-item granularity. The platform currently holds only period aggregates, which cannot evidence a specific contradiction.'
  },
  precedent: {
    reason: 'This requires the departmental archive of previous orders, appellate decisions and their outcomes.',
    missingFeed: 'bo',
    wouldNeed: 'The order and appeal corpus, indexed and retrievable with citations. Matching on sector alone — which is all the current data supports — is not comparable precedent and should not be presented as such. What can be answered without it is in Precedent Intelligence: the binding authority on the questions of law in play, and this department’s own concluded outcomes on the same question where enough of them exist to be worth stating.'
  },
  reply: {
    reason: 'No reply document is held against this case. The platform has the notice and its status, but not the taxpayer’s submission or its annexures.',
    missingFeed: 'bo',
    wouldNeed: 'Reply documents and correspondence from the Back Office case file. An earlier version of this copilot generated a plausible reply here; that output has been removed.'
  }
}

export function answerQuestion(questionId, gstin) {
  const q = QUESTIONS.find(x => x.id === questionId)
  const twin = buildCaseTwin(gstin)
  if (!q || !twin) return null

  if (!q.grounded) {
    const d = DECLINE[questionId]
    return {
      questionId,
      question: q.label,
      grounded: false,
      declined: {
        ...d,
        feedLabel: SOURCE_SYSTEMS[d.missingFeed].label,
        feedOwner: SOURCE_SYSTEMS[d.missingFeed].owner,
        connected: SOURCE_SYSTEMS[d.missingFeed].connected
      }
    }
  }

  return {
    questionId,
    question: q.label,
    grounded: true,
    statements: build[questionId](twin)
  }
}

const build = {
  position(t) {
    const out = [
      say(`${t.identity.tradeName.value} is registered in ${t.identity.district.value} (${t.identity.division.value}), sector ${t.identity.sector.value}, since ${t.identity.registeredOn.value}.`,
        `GSTIN ${t.gstin}`, 'registry', t.identity.registeredOn.asOf),
      say(`Filing status is ${t.identity.filingStatus.value}; compliance history on record is "${t.identity.complianceHistory.value}".`,
        'Filing record', 'returns', t.identity.filingStatus.asOf),
      say(`Estimated revenue exposure is ${lakh(t.position.exposure.value)}, against a risk rating of ${t.position.riskCategory.value} (${t.position.riskScore.value}/100).`,
        'Risk computation', 'platform', t.position.exposure.asOf)
    ]
    if (t.position.recoverableNow) {
      out.push(say(`Of that exposure, ${lakh(t.position.recoverableNow.value)} is assessed as still recoverable at a signal age of ${t.position.signalAgeDays.value} days.`,
        'Recovery model', 'platform', t.position.recoverableNow.asOf))
    }
    return out
  },

  priority(t) {
    const out = []
    if (t.legal) {
      out.push(say(
        t.legal.daysRemaining < 0
          ? `The ${t.legal.bindingLabel.toLowerCase()} deadline of ${t.legal.bindingDate} under ${SECTION_LABEL[t.legal.section]} has passed. No demand can now be raised for ${t.legal.fy}.`
          : `${t.legal.daysRemaining} days remain to the ${t.legal.bindingLabel.toLowerCase()} deadline of ${t.legal.bindingDate} under ${SECTION_LABEL[t.legal.section]} for ${t.legal.fy}.`,
        `Limitation computation — ${t.legal.fy}`, 'platform', t.legal.bindingDate))
      out.push(say(t.legal.basis, `${SECTION_LABEL[t.legal.section]} / notification`, 'platform', t.legal.bindingDate))
    }
    if (t.position.triggeredRules.length) {
      out.push(say(
        `${t.position.triggeredRules.length} risk rule(s) fired: ${t.position.triggeredRules.map(r => `${r.label} (+${r.weight})`).join('; ')}.`,
        'Risk rule set', 'platform', t.position.riskScore.asOf))
    } else {
      out.push(say('No risk rule currently fires for this taxpayer.', 'Risk rule set', 'platform', t.position.riskScore.asOf))
    }
    if (t.position.decayNextWeek && t.position.decayNextWeek.value > 0) {
      out.push(say(`${lakh(t.position.decayNextWeek.value)} of recoverable value is forecast to decay if the case is untouched for a further seven days.`,
        'Recovery model', 'platform', t.position.decayNextWeek.asOf))
    }
    return out
  },

  pending(t) {
    const p = t.proceedings
    const out = [
      say(`Recommended next action: ${t.nextAction.action}. ${t.nextAction.because}`,
        `Basis: ${t.nextAction.basis}`, 'platform', t.position.exposure.asOf)
    ]
    const open = p.audit.filter(c => c.stage !== 'Closed')
    if (open.length) {
      out.push(say(`${open.length} audit case(s) open: ${open.map(c => `${c.id} at stage ${c.stage}`).join('; ')}.`,
        open.map(c => c.id).join(', '), 'bo', t.identity.filingStatus.asOf))
    }
    const awaiting = p.notices.filter(n => n.status !== 'Order Issued')
    if (awaiting.length) {
      out.push(say(`${awaiting.length} notice(s) not yet concluded: ${awaiting.map(n => `${n.type} (${n.status})`).join('; ')}.`,
        awaiting.map(n => n.id).join(', '), 'bo', awaiting[0].issuedOn))
    }
    if (p.alerts.length) {
      out.push(say(`${p.alerts.length} compliance alert(s) on record: ${[...new Set(p.alerts.map(a => a.type))].join('; ')}.`,
        p.alerts.map(a => a.id).join(', '), 'platform', p.alerts[0].raisedOn))
    }
    if (out.length === 1) out.push(say('No open proceeding is recorded against this taxpayer.', 'Case record', 'bo', t.identity.filingStatus.asOf))
    return out
  },

  history(t) {
    return t.chronology.slice(0, 8).map(e =>
      say(`${e.date} — ${e.title}${e.detail ? `. ${e.detail}` : ''}`, e.title, e.source, e.date))
  },

  network(t) {
    if (!t.network) {
      return [say('This taxpayer is not a member of any flagged network cluster in the current dataset.',
        'Network cluster index', 'platform', t.position.exposure.asOf)]
    }
    return [
      say(`Member of cluster ${t.network.clusterId} (${t.network.entityCount} entities), acting as ${t.network.role}.`,
        t.network.clusterId, 'platform', t.position.exposure.asOf),
      say(`Shared registered address across the cluster: ${t.network.sharedAddress ? 'yes' : 'no'}. Shared contact details: ${t.network.sharedContact ? 'yes' : 'no'}.`,
        t.network.clusterId, 'platform', t.position.exposure.asOf),
      say('Cluster membership is a statistical signal derived from linkage indicators. It is not evidence of fraud and requires verification by the Investigation Team.',
        'Limitation note', 'platform', t.position.exposure.asOf)
    ]
  }
}

export const COPILOT_NOTE =
  'This copilot retrieves from the case record. It does not generate legal content, and every statement above cites the record and source system behind it. Questions it cannot ground are declined rather than answered approximately.'
