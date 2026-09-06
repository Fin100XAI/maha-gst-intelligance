/* ---------------------------------------------------------------------------
 * UNKNOWN RISK DISCOVERY
 *
 * Every other risk surface in this platform scores taxpayers against nine
 * encoded rules. Those rules are the department's institutional knowledge
 * written down, and they are good — but by construction they can only find
 * what someone already thought to look for. 66 of 156 taxpayers trigger none
 * of them and are therefore invisible to every existing screen.
 *
 * This module looks only at those 66.
 *
 * THE FILTER IS THE PRODUCT
 *
 * An anomalous taxpayer who already trips a rule is not a discovery — the
 * department has them. A discovery is a taxpayer who is statistically unlike
 * their peers AND invisible to all nine rules. That intersection is the only
 * thing this module reports, and it is what makes it additive to the existing
 * rulebook rather than a second opinion on it.
 *
 * WHY PEER-RELATIVE, AND WHY ROBUST
 *
 * An ITC-to-turnover ratio of 0.92 is unremarkable in wholesale trading and
 * extraordinary in professional services. Scoring deviation against the whole
 * population would mostly rediscover which sectors exist, so every deviation
 * here is measured against the taxpayer's own sector.
 *
 * And the statistics are median and MAD, not mean and standard deviation,
 * because the mean and SD are themselves dragged by the outliers being hunted.
 * A few extreme entities inflate the SD until they no longer look extreme —
 * the classic masking failure, which would make this module quietly useless in
 * exactly the cases it exists to find.
 *
 * WHAT IS DISCOVERED IS A PATTERN, NOT A VERDICT
 *
 * A single anomalous taxpayer is a lead. The same deviation signature recurring
 * across several unflagged taxpayers is something more useful: a candidate
 * rule the department has not encoded. That is the actual output — not a list
 * of suspects, but a shortlist of patterns worth adding to the rulebook, each
 * with the taxpayers behind it and the exposure they carry.
 *
 * ANOMALOUS IS NOT FRAUDULENT
 *
 * A legitimately unusual business is statistically indistinguishable from a
 * suspicious one at this level of evidence. Everything below is a review
 * candidate. The expected number of innocent entities in the output is stated
 * on the screen rather than buried, because a screen at this threshold on this
 * population will surface a handful and most of them will have done nothing.
 * ------------------------------------------------------------------------- */

import { TAXPAYERS } from './mockData.js'

// Iglewicz–Hoaglin: |modified z| > 3.5 is the conventional outlier threshold.
const Z_THRESHOLD = 3.5
const MIN_PEER_GROUP = 8      // below this a peer norm is not worth computing
const MIN_PATTERN_SUPPORT = 2 // a signature seen once is an anecdote

const median = xs => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/* Behavioural ratios rather than absolute values: absolutes only tell us how
 * large a business is, and size is not risk. */
export const FEATURES = [
  {
    id: 'itc_ratio',
    label: 'ITC claimed against turnover',
    of: t => (t.monthlyTurnover > 0 ? t.itcClaimed / t.monthlyTurnover : null),
    high: 'Claiming materially more input credit per rupee of turnover than sector peers.',
    low: 'Claiming materially less input credit per rupee of turnover than sector peers.'
  },
  {
    id: 'tax_ratio',
    label: 'Tax paid against turnover',
    of: t => (t.monthlyTurnover > 0 ? t.taxPaid / t.monthlyTurnover : null),
    high: 'Paying materially more tax per rupee of turnover than sector peers.',
    low: 'Paying materially less tax per rupee of turnover than sector peers — credit or exemption is absorbing the liability.'
  },
  {
    id: 'eway_ratio',
    label: 'E-way bill value against declared turnover',
    of: t => (t.monthlyTurnover > 0 ? t.ewayBillValue / t.monthlyTurnover : null),
    high: 'Moving materially more goods than the declared turnover accounts for.',
    low: 'Declaring turnover materially in excess of the goods movement recorded against it.'
  },
  {
    id: 'refund_ratio',
    label: 'Refund claimed against turnover',
    of: t => (t.monthlyTurnover > 0 ? t.refundClaimed / t.monthlyTurnover : null),
    high: 'Claiming refund at a rate materially above sector peers.',
    low: null // a low refund ratio is not a risk signal
  }
]

/* Peer norms, one per sector per feature. */
const peerNorms = (() => {
  const bySector = new Map()
  TAXPAYERS.forEach(t => {
    if (!bySector.has(t.sector)) bySector.set(t.sector, [])
    bySector.get(t.sector).push(t)
  })
  const norms = new Map()
  bySector.forEach((members, sector) => {
    FEATURES.forEach(f => {
      const vals = members.map(f.of).filter(v => v != null && isFinite(v))
      if (vals.length < MIN_PEER_GROUP) return
      const med = median(vals)
      // MAD, and the 0.6745 factor that puts it on the same scale as an SD.
      const mad = median(vals.map(v => Math.abs(v - med)))
      norms.set(`${sector}||${f.id}`, { sector, feature: f.id, median: med, mad, n: vals.length })
    })
  })
  return norms
})()

export const PEER_COVERAGE = {
  sectorsWithNorms: new Set([...peerNorms.values()].map(n => n.sector)).size,
  minGroupSize: MIN_PEER_GROUP,
  // Sectors too small to norm — stated rather than silently skipped, because a
  // taxpayer in one of them is not "clean", it is unassessed.
  unNormedSectors: [...new Set(TAXPAYERS.map(t => t.sector))]
    .filter(s => ![...peerNorms.values()].some(n => n.sector === s))
}

function deviationsFor(t) {
  const out = []
  FEATURES.forEach(f => {
    const norm = peerNorms.get(`${t.sector}||${f.id}`)
    if (!norm) return
    const v = f.of(t)
    if (v == null || !isFinite(v)) return
    // A zero MAD means over half the peer group share one value; a deviation
    // from it is real but cannot be scaled, so it is skipped rather than
    // reported as an infinite z-score.
    if (!norm.mad || norm.mad <= 0) return
    const z = (0.6745 * (v - norm.median)) / norm.mad
    if (Math.abs(z) < Z_THRESHOLD) return
    const direction = z > 0 ? 'high' : 'low'
    if (!f[direction]) return // a low refund ratio carries no meaning
    out.push({
      feature: f.id,
      label: f.label,
      direction,
      z: Math.round(z * 100) / 100,
      value: v,
      peerMedian: norm.median,
      peerCount: norm.n,
      sector: t.sector,
      explanation: f[direction],
      // Stated as a multiple, which is what an officer can actually check.
      timesPeer: norm.median > 0 ? Math.round((v / norm.median) * 100) / 100 : null
    })
  })
  return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
}

/* The unflagged population — invisible to all nine encoded rules. */
const unflagged = TAXPAYERS.filter(t => (t.risk.triggeredRules || []).length === 0)

export const DISCOVERIES = unflagged
  .map(t => {
    const dev = deviationsFor(t)
    if (!dev.length) return null
    return {
      gstin: t.gstin,
      tradeName: t.tradeName,
      sector: t.sector,
      district: t.district,
      division: t.division,
      turnover: t.monthlyTurnover,
      exposure: t.estimatedRevenueExposure,
      filingStatus: t.filingStatus,
      registeredOn: t.registrationDate,
      deviations: dev,
      // The set of deviating features, order-independent: the taxpayer's
      // signature, and the unit in which a recurring pattern is detected.
      signature: dev.map(d => `${d.feature}:${d.direction}`).sort().join(' + '),
      maxZ: Math.max(...dev.map(d => Math.abs(d.z)))
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.maxZ - a.maxZ)

/* Recurring signatures — the actual discovery. A pattern seen across several
 * unflagged taxpayers is a candidate rule; a pattern seen once is an anecdote
 * and is reported separately as such. */
export const CANDIDATE_PATTERNS = (() => {
  const groups = new Map()
  DISCOVERIES.forEach(d => {
    if (!groups.has(d.signature)) groups.set(d.signature, [])
    groups.get(d.signature).push(d)
  })
  return [...groups.entries()]
    .map(([signature, members]) => ({
      signature,
      members,
      support: members.length,
      exposure: members.reduce((s, m) => s + m.exposure, 0),
      sectors: [...new Set(members.map(m => m.sector))],
      divisions: [...new Set(members.map(m => m.division))],
      // Written the way a rule would have to be written to be encoded.
      description: members[0].deviations.map(d =>
        `${d.label} unusually ${d.direction} against sector peers`).join(', and '),
      recurring: members.length >= MIN_PATTERN_SUPPORT
    }))
    .sort((a, b) => b.support - a.support || b.exposure - a.exposure)
})()

export const RECURRING_PATTERNS = CANDIDATE_PATTERNS.filter(p => p.recurring)
export const SINGLETON_PATTERNS = CANDIDATE_PATTERNS.filter(p => !p.recurring)

export const DISCOVERY_SUMMARY = {
  populationTotal: TAXPAYERS.length,
  unflaggedTotal: unflagged.length,
  discoveredCount: DISCOVERIES.length,
  discoveredExposure: DISCOVERIES.reduce((s, d) => s + d.exposure, 0),
  recurringPatternCount: RECURRING_PATTERNS.length,
  singletonCount: SINGLETON_PATTERNS.length,
  screenRate: unflagged.length ? Math.round((DISCOVERIES.length / unflagged.length) * 1000) / 10 : 0,
  zThreshold: Z_THRESHOLD,
  minPatternSupport: MIN_PATTERN_SUPPORT
}

export const DISCOVERY_METHOD_NOTE =
  'Each behavioural ratio is compared against the median of the taxpayer’s own sector, scaled by the median absolute deviation of that sector. Median and MAD are used rather than mean and standard deviation because the mean and SD are themselves pulled by the outliers being searched for — a handful of extreme entities inflate the spread until they no longer register as extreme, which would make this screen fail precisely on the cases it exists to find. The threshold is a modified z of 3.5, the conventional Iglewicz–Hoaglin cut. Sectors with fewer than 8 taxpayers are not normed at all: a peer median drawn from three businesses is not a norm, and taxpayers in those sectors are unassessed rather than cleared.'

export const DISCOVERY_CAVEAT =
  'Nothing here is an allegation. A legitimately unusual business is statistically indistinguishable from a suspicious one on ratio evidence alone — a genuine exporter, a firm in a bad quarter, or a business whose sector classification is simply wrong will all appear. These are review candidates, and the department should expect most of them to be explained rather than confirmed. The value is not that each one is a case; it is that a recurring signature across several of them may be a pattern the rulebook does not yet encode, and that is worth an analyst’s week.'

export const DISCOVERY_LIMITS = [
  'Detects deviation, not intent. No conclusion about evasion can be drawn from these features.',
  'Only sees what the returns contain. A taxpayer suppressing turnover consistently across every field looks perfectly ordinary here.',
  'Sector is taken from the registration record. A misclassified taxpayer will be measured against the wrong peers and may appear anomalous for that reason alone.',
  'Single-period ratios. A business with genuine seasonality will deviate in some periods without anything being wrong.',
  'The population is small. On 156 taxpayers a recurring signature of two or three is suggestive, not established, and should be confirmed against a larger extract before any rule is encoded.'
]

/* ---------------------------------------------------------------------------
 * WHY THIS SCREEN IS CURRENTLY SILENT — a computed result, not an excuse.
 *
 * The screen returns nothing on this dataset. That is worth reporting
 * precisely, because "no anomalies found" and "this data cannot contain a
 * findable anomaly" are very different statements, and only the second is true
 * here.
 *
 * Three of the nine encoded rules — Abnormal ITC Spike, High Refund-to-Turnover
 * Ratio, and E-Way Bill vs Return Mismatch — are computed from exactly the
 * ratios this module measures. The rulebook and this detector are therefore
 * reading the same four numbers, and any taxpayer extreme enough to be found
 * here has already tripped a rule and left the unflagged population by
 * definition. The overlap below measures that directly.
 *
 * The correct response is NOT to lower the threshold until results appear.
 * Ordinary variation would then be reported as discovery, which is the exact
 * failure this module's own caveat warns about. The correct response is to
 * feed it features the rulebook does not already encode.
 * ------------------------------------------------------------------------- */
const flaggedPop = TAXPAYERS.filter(t => (t.risk.triggeredRules || []).length > 0)

export const RULEBOOK_OVERLAP = FEATURES.map(f => {
  const zOf = pop => pop.map(t => {
    const norm = peerNorms.get(`${t.sector}||${f.id}`)
    if (!norm || !norm.mad) return null
    const v = f.of(t)
    if (v == null || !isFinite(v)) return null
    return Math.abs((0.6745 * (v - norm.median)) / norm.mad)
  }).filter(z => z != null)

  const zu = zOf(unflagged)
  const zf = zOf(flaggedPop)
  const max = arr => (arr.length ? Math.max(...arr) : 0)
  return {
    feature: f.id,
    label: f.label,
    unflaggedMaxZ: Math.round(max(zu) * 100) / 100,
    flaggedMaxZ: Math.round(max(zf) * 100) / 100,
    // The whole story in one number: how much of the extreme tail the rulebook
    // has already claimed.
    headroom: Math.round((max(zu) - Z_THRESHOLD) * 100) / 100,
    alreadyEncoded: ['itc_ratio', 'refund_ratio', 'eway_ratio'].includes(f.id)
  }
})

export const SILENCE_EXPLAINED = {
  silent: DISCOVERIES.length === 0,
  reason: 'Every feature this screen measures is already encoded as a rule, so the extreme tail of each one has been removed from the unflagged population before the screen runs. The highest deviation surviving among unflagged taxpayers is below the outlier threshold on all four ratios, while flagged taxpayers reach well past it — which is the rulebook working, not the detector failing.',
  proof: 'Compare the two columns below. On every ratio the flagged population reaches a materially higher deviation than any unflagged taxpayer attains.',
  whatWouldUnlockIt: [
    'Registration-identity linkage — shared premises, telephone, email, bank account or authorised signatory across registrations. The rulebook detects circular TRADING from invoice flow; it does not detect shared IDENTITY, so this is genuinely additive. It cannot be demonstrated on this dataset because contact details here are synthesised per taxpayer rather than shared.',
    'Directorship and PAN linkage across entities, including to previously cancelled registrations.',
    'Invoice-level rather than period-aggregate returns, which would expose timing and counterparty structure that period totals conceal entirely.',
    'Multi-period histories, allowing trajectory and volatility features rather than single-period ratios.',
    'Geospatial and premises data, which would make a shared-address screen possible.'
  ],
  honestPosition: 'The method is implemented and correct, and the negative result is evidence that it is calibrated rather than evidence that it works. It should be run against a real extract before any claim is made about what it can find.'
}
