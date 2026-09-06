/* ---------------------------------------------------------------------------
 * CASE SIMILARITY — COMPARABILITY, NOT RESEMBLANCE
 *
 * The generic version of this is a cosine distance over a feature vector,
 * printing "87% similar". It is unfalsifiable, it cannot be argued with, and
 * an earlier version of exactly that was deleted from this codebase for
 * matching on sector alone and calling the result "similar risk patterns".
 *
 * WHAT ACTUALLY MAKES TWO TAX CASES COMPARABLE
 *
 * Not overall resemblance — resemblance on the dimensions that decide the
 * outcome. Two businesses in the same sector with the same turnover but
 * different questions of law are not comparable at all. Two businesses in
 * unrelated sectors turning on the same question of law are highly comparable.
 *
 * So every dimension below is classified by whether it can actually move an
 * outcome, and weighted accordingly:
 *
 *   DETERMINATIVE — the question of law, the provision engaged, the strength of
 *   the department's evidential position. These decide cases.
 *
 *   CONTEXTUAL — the risk pattern, ITC behaviour, network involvement. These
 *   shape how a case is argued without deciding it.
 *
 *   DESCRIPTIVE — sector, district, turnover band. These decide nothing.
 *
 * The last class is the important one, and it is why this file exists. Sector
 * is the dimension that looks most obviously relevant and is the least
 * predictive of outcome, which is precisely the trap the deleted version fell
 * into. It is retained at a deliberately small weight so an officer can see it
 * was considered and discounted, rather than silently dropped.
 *
 * WHAT DIFFERS MATTERS AS MUCH AS WHAT MATCHES
 *
 * A comparable case that differs on a material fact is a trap, not a guide.
 * Distinguishing factors are how lawyers actually reason about precedent, so
 * every comparison states them explicitly alongside the matches.
 *
 * OUTCOMES ARE SHOWN, NEVER AGGREGATED BELOW THRESHOLD
 *
 * Ten proceedings in this dataset have concluded and carry a real outcome.
 * Showing an officer four of them and what happened in each is honest and
 * useful. Turning three of them into "70% success rate" is not — that is a
 * generalisation the sample cannot support. This module does the first and
 * refuses the second, and says which it is doing.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS, LITIGATION_CASES } from './mockData.js'

const CONCLUDED = ['Order Confirmed', 'Order Reversed', 'Remanded']
const MIN_FOR_RATE = 5    // below this, individual outcomes only — never a rate
const MIN_SCORE = 0.25    // below this the cases are not comparable at all

export const OUTCOMES = {
  'Order Confirmed': { label: 'Order confirmed', favours: 'department', tone: 'green' },
  'Order Reversed': { label: 'Order reversed', favours: 'assessee', tone: 'red' },
  Remanded: { label: 'Remanded', favours: 'neither', tone: 'amber' }
}

const byGstin = new Map(TAXPAYERS.map(t => [t.gstin, t]))
const litByGstin = new Map(LITIGATION_CASES.map(l => [l.gstin, l]))

const ratio = (a, b) => (b > 0 ? a / b : null)
const ruleSet = t => new Set((t.risk.triggeredRules || []).map(r => r.label))
const jaccard = (a, b) => {
  if (!a.size && !b.size) return null // neither has rules — uninformative, not a match
  const inter = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union ? inter / union : 0
}
const bandOf = v => (v == null ? null : Math.floor(Math.log10(Math.max(v, 1))))

/* Each dimension returns a score in [0,1], or null when it cannot be assessed.
 * A null is carried through as "not assessable" rather than silently scored 0,
 * because those are different statements. */
export const DIMENSIONS = [
  {
    id: 'issue',
    label: 'Question of law',
    weight: 0.40,
    klass: 'determinative',
    why: 'The single strongest determinant. Two cases turning on the same question are comparable however different the businesses are.',
    score: (a, b) => (a.lit && b.lit ? (a.lit.issue === b.lit.issue ? 1 : 0) : null),
    describe: (a, b) => (a.lit && b.lit && a.lit.issue === b.lit.issue ? `Both turn on ${a.lit.issue}` : null),
    differ: (a, b) => (a.lit && b.lit && a.lit.issue !== b.lit.issue ? `Different questions of law — ${a.lit.issue} against ${b.lit.issue}` : null)
  },
  {
    id: 'position',
    label: 'Department’s evidential position',
    weight: 0.20,
    klass: 'determinative',
    why: 'Recorded on the file at assessment. A case argued from a documentation gap behaves differently from one argued from a strong record, whatever the legal issue.',
    score: (a, b) => (a.lit && b.lit ? (a.lit.departmentPosition === b.lit.departmentPosition ? 1 : 0.3) : null),
    describe: (a, b) => (a.lit && b.lit && a.lit.departmentPosition === b.lit.departmentPosition ? `Department position on both recorded as "${a.lit.departmentPosition}"` : null),
    differ: (a, b) => (a.lit && b.lit && a.lit.departmentPosition !== b.lit.departmentPosition
      ? `Department position differs — "${a.lit.departmentPosition}" against "${b.lit.departmentPosition}"` : null)
  },
  {
    id: 'rules',
    label: 'Risk pattern',
    weight: 0.15,
    klass: 'contextual',
    why: 'Overlap of the encoded rules that fired, measured as a Jaccard index. Shapes how a case is evidenced without deciding it.',
    score: (a, b) => jaccard(ruleSet(a.tp), ruleSet(b.tp)),
    describe: (a, b) => {
      const shared = [...ruleSet(a.tp)].filter(x => ruleSet(b.tp).has(x))
      return shared.length ? `Shared risk rules: ${shared.join('; ')}` : null
    },
    differ: (a, b) => {
      const only = [...ruleSet(b.tp)].filter(x => !ruleSet(a.tp).has(x))
      return only.length ? `The comparison case also triggered: ${only.join('; ')}` : null
    }
  },
  {
    id: 'itc',
    label: 'ITC behaviour',
    weight: 0.12,
    klass: 'contextual',
    why: 'Input credit claimed per rupee of turnover. Two cases with similar credit behaviour tend to raise similar evidential questions.',
    score: (a, b) => {
      const x = ratio(a.tp.itcClaimed, a.tp.monthlyTurnover)
      const y = ratio(b.tp.itcClaimed, b.tp.monthlyTurnover)
      if (x == null || y == null) return null
      return Math.max(0, 1 - Math.abs(x - y) / Math.max(x, y, 0.0001))
    },
    describe: (a, b) => {
      const x = ratio(a.tp.itcClaimed, a.tp.monthlyTurnover)
      const y = ratio(b.tp.itcClaimed, b.tp.monthlyTurnover)
      return x != null && y != null && Math.abs(x - y) < 0.08
        ? `Comparable ITC intensity — ${(x * 100).toFixed(0)}% against ${(y * 100).toFixed(0)}% of turnover` : null
    },
    differ: (a, b) => {
      const x = ratio(a.tp.itcClaimed, a.tp.monthlyTurnover)
      const y = ratio(b.tp.itcClaimed, b.tp.monthlyTurnover)
      return x != null && y != null && Math.abs(x - y) >= 0.2
        ? `ITC intensity differs materially — ${(x * 100).toFixed(0)}% against ${(y * 100).toFixed(0)}%` : null
    }
  },
  {
    id: 'scale',
    label: 'Scale of the demand',
    weight: 0.08,
    klass: 'contextual',
    why: 'Order of magnitude of the amount in dispute. Affects the forum and the effort a taxpayer will spend defending, not the merits.',
    score: (a, b) => {
      const x = bandOf(a.lit ? a.lit.disputedAmount : a.tp.estimatedRevenueExposure)
      const y = bandOf(b.lit ? b.lit.disputedAmount : b.tp.estimatedRevenueExposure)
      if (x == null || y == null) return null
      return Math.max(0, 1 - Math.abs(x - y) / 3)
    },
    describe: () => null,
    differ: (a, b) => {
      const x = bandOf(a.lit ? a.lit.disputedAmount : a.tp.estimatedRevenueExposure)
      const y = bandOf(b.lit ? b.lit.disputedAmount : b.tp.estimatedRevenueExposure)
      return x != null && y != null && Math.abs(x - y) >= 2 ? 'Demands differ by more than two orders of magnitude' : null
    }
  },
  {
    id: 'sector',
    label: 'Sector',
    weight: 0.05,
    klass: 'descriptive',
    why: 'Deliberately weighted low. Sector is the dimension that looks most relevant and predicts outcome least — it was the sole basis of an earlier version of this feature, which is why that version was removed. Kept visible so it can be seen to have been considered and discounted.',
    score: (a, b) => (a.tp.sector === b.tp.sector ? 1 : 0),
    describe: (a, b) => (a.tp.sector === b.tp.sector ? `Both in ${a.tp.sector} — noted, but sector does not decide outcomes` : null),
    differ: () => null
  }
]

const ctxOf = gstin => {
  const tp = byGstin.get(gstin)
  if (!tp) return null
  return { gstin, tp, lit: litByGstin.get(gstin) || null }
}

/* The pool: proceedings that have actually concluded, so a real outcome can be
 * attached. A pending case teaches nothing about what happened. */
export const OUTCOME_POOL = LITIGATION_CASES
  .filter(l => CONCLUDED.includes(l.stage))
  .map(l => ctxOf(l.gstin))
  .filter(Boolean)

export function findComparables(gstin, limit = 5) {
  const subject = ctxOf(gstin)
  if (!subject) return null

  const scored = OUTCOME_POOL
    .filter(c => c.gstin !== gstin)
    .map(c => {
      const parts = DIMENSIONS.map(d => {
        const s = d.score(subject, c)
        return {
          id: d.id, label: d.label, weight: d.weight, klass: d.klass, why: d.why,
          score: s,
          assessable: s != null,
          contribution: s == null ? 0 : s * d.weight,
          matched: s != null ? d.describe(subject, c) : null,
          differs: s != null ? d.differ(subject, c) : null
        }
      })
      // Renormalise over assessable dimensions only, so an unassessable
      // dimension neither counts against nor silently props up the score.
      const usable = parts.filter(p => p.assessable)
      const totalWeight = usable.reduce((s, p) => s + p.weight, 0)
      const score = totalWeight ? usable.reduce((s, p) => s + p.contribution, 0) / totalWeight : 0
      return {
        gstin: c.gstin,
        tradeName: c.tp.tradeName,
        sector: c.tp.sector,
        division: c.tp.division,
        issue: c.lit ? c.lit.issue : null,
        outcome: c.lit ? c.lit.stage : null,
        outcomeMeta: c.lit ? OUTCOMES[c.lit.stage] : null,
        departmentPosition: c.lit ? c.lit.departmentPosition : null,
        disputedAmount: c.lit ? c.lit.disputedAmount : null,
        ageingDays: c.lit ? c.lit.ageingDays : null,
        score: Math.round(score * 100) / 100,
        assessedOn: usable.length,
        ofDimensions: DIMENSIONS.length,
        matches: parts.filter(p => p.matched).map(p => ({ label: p.label, klass: p.klass, text: p.matched })),
        distinguishers: parts.filter(p => p.differs).map(p => ({ label: p.label, klass: p.klass, text: p.differs })),
        parts
      }
    })
    // A case whose ONLY match is sector is not comparable — that was the whole
    // defect in the version this replaces, and a score threshold alone does not
    // exclude it. At least one determinative or contextual match is required.
    .filter(c => c.score >= MIN_SCORE && c.matches.some(m => m.klass !== 'descriptive'))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  // The rate, if stated at all, may only be computed over cases comparable on
  // the dimension that decides outcomes. "4 of 5 confirmed" across five
  // different questions of law is a generalisation wearing a statistic — it
  // reads as evidence about this case and is nothing of the kind.
  const sameQuestion = scored.filter(c => c.issue && c.issue === subject.lit?.issue)
  const confirmed = sameQuestion.filter(c => c.outcome === 'Order Confirmed').length

  return {
    subject: { gstin, tradeName: subject.tp.tradeName, issue: subject.lit ? subject.lit.issue : null },
    comparables: scored,
    poolSize: OUTCOME_POOL.length,
    // The gate. Individual outcomes are shown; the generalisation is refused.
    rateStated: sameQuestion.length >= MIN_FOR_RATE,
    confirmed,
    sameQuestionCount: sameQuestion.length,
    rateNote: sameQuestion.length >= MIN_FOR_RATE
      ? `${confirmed} of ${sameQuestion.length} concluded proceedings on the same question of law were confirmed in the department's favour.`
      : `${scored.length} comparable proceeding${scored.length === 1 ? '' : 's'} found, of which ${sameQuestion.length} turn${sameQuestion.length === 1 ? 's' : ''} on the same question of law. Each outcome is shown individually and no rate is stated: a rate may only be computed across cases sharing the question that decides them, and ${MIN_FOR_RATE} are needed before it means anything. A figure drawn from cases turning on different questions would read as evidence about this case and would not be.`,
    none: scored.length === 0,
    noneReason: 'No concluded proceeding in the department’s record is comparable to this case on the dimensions that decide outcomes. Cases sharing only a sector are not comparable and are not offered as though they were.'
  }
}

export const SIMILARITY_NOTE =
  'Comparability is scored on the dimensions that can actually move an outcome, not on overall resemblance. The question of law and the department’s evidential position carry most of the weight; risk pattern, ITC behaviour and scale shape how a case is argued without deciding it; sector is kept at a deliberately small weight because it is the dimension that looks most relevant and predicts least. Every dimension’s contribution is shown, so the score can be disagreed with rather than merely trusted.'

export const OUTCOME_NOTE =
  'These are what happened in prior proceedings, not a prediction about this one. Facts differ between cases sharing a question of law, and the distinguishing factors listed against each comparison are the reason the outcome there may not be the outcome here. Where too few comparable proceedings exist to support a rate, the individual outcomes are shown and no rate is given.'
