/* ---------------------------------------------------------------------------
 * CLOSED-VOCABULARY TRANSLATION CHECK
 *
 * A page can have every sentence translated and still read as English, because
 * most of the words on a working screen are not written on the screen — they
 * come from the records. Division, sector, district, case stage, notice type,
 * alert type, risk rule, officer role: a hundred-odd strings that render
 * thousands of times across every table, chip, chart axis and dropdown.
 *
 * Two things have to be true for one of those words to appear translated, and
 * the two fail independently:
 *
 *   1. The catalogue holds an EXACT entry for it. Not a composed one — the
 *      composer assembles a translation from fragments, which on a two-word
 *      label produces a half-English mongrel ("Statutory वेळ इंटेलिजन्स").
 *      Half-translated reads as broken, which is worse than plainly English.
 *
 *   2. The render site passes it through t(). A translated column header above
 *      untranslated cells is the exact shape this check was written for.
 *
 * This script checks (1) directly, by resolving every value the data layer can
 * actually produce. It cannot check (2) — only a rendered page can — but the
 * companion scan in audit.mjs covers the common shapes.
 *
 * Run: npm run vocab
 * ------------------------------------------------------------------------- */

import { hasMessage, LOCALES } from '../src/i18n/locale.js'
import '../src/i18n/mr/index.js'
import '../src/i18n/hi/index.js'
import {
  DISTRICTS, DIVISIONS, SECTORS, OFFICER_ROLES, AUDIT_STAGES, LEGAL_ISSUES,
  NOTICE_TYPES, NOTICES, TAXPAYERS, AUDIT_CASES, LITIGATION_CASES,
  COMPLIANCE_ALERTS, REFUND_CASES, OFFICERS, NETWORK_CLUSTERS
} from '../src/data/mockData.js'
import { RECOVERY_BANDS } from '../src/data/recovery.js'
import { REFUND_BENCHMARK_BANDS } from '../src/data/mockData.js'

const TRANSLATED = LOCALES.filter(l => l !== 'en')

/* Each entry is a vocabulary an officer reads on screen, paired with every
   value the data layer can put in it. Declared values and generated values are
   both listed, because a constant can be exported and never used while a
   generated field quietly carries a value nobody declared. */
const VOCABULARIES = {
  'District': DISTRICTS.map(d => d.district),
  'Division': DIVISIONS,
  'Sector': SECTORS.map(s => s.sector ?? s),
  'Officer role': OFFICER_ROLES,
  'Audit stage': AUDIT_STAGES,
  'Question of law': LEGAL_ISSUES,
  'Notice type': NOTICE_TYPES,
  'Notice status': NOTICES.map(n => n.status),
  'Filing status': TAXPAYERS.map(t => t.filingStatus),
  'Compliance history': TAXPAYERS.map(t => t.complianceHistory),
  'Case stage (audit)': AUDIT_CASES.map(c => c.stage),
  'Litigation stage': LITIGATION_CASES.map(c => c.stage),
  'Litigation issue': LITIGATION_CASES.map(c => c.issue),
  'Alert type': COMPLIANCE_ALERTS.map(a => a.type),
  'Alert status': COMPLIANCE_ALERTS.map(a => a.status),
  'Refund status': REFUND_CASES.map(r => r.status),
  'Officer posting': OFFICERS.map(o => o.role),
  'Network role': NETWORK_CLUSTERS.flatMap(c => c.nodes.map(n => n.role)),
  'Signal-age band': RECOVERY_BANDS.map(b => b.label),
  'Refund benchmark band': REFUND_BENCHMARK_BANDS
}

let checked = 0
const gaps = Object.fromEntries(TRANSLATED.map(l => [l, []]))

for (const [name, raw] of Object.entries(VOCABULARIES)) {
  const values = [...new Set(raw.filter(v => typeof v === 'string' && v.length > 0))]
  for (const value of values) {
    checked++
    for (const locale of TRANSLATED) {
      if (!hasMessage(locale, value)) gaps[locale].push({ name, value })
    }
  }
}

console.log(`\n${checked} values across ${Object.keys(VOCABULARIES).length} closed vocabularies\n`)

let failed = false
for (const locale of TRANSLATED) {
  const missing = gaps[locale]
  if (missing.length === 0) {
    console.log(`  ${locale}  complete — every value has an exact entry`)
    continue
  }
  failed = true
  console.log(`  ${locale}  ${missing.length} without an exact entry:`)
  for (const { name, value } of missing) console.log(`        ${name.padEnd(20)} ${value}`)
}

console.log('')
if (failed) {
  console.log('A value with no exact entry falls to the composer, which returns a')
  console.log('half-translated label. Add the missing entries to the locale\'s')
  console.log('dataValues.js rather than leaving them to composition.\n')
  process.exit(1)
}
