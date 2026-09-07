/* ---------------------------------------------------------------------------
 * INDIRECT PROSE CHECK
 *
 * coverage.mjs finds every string written as t('…') at the render site. It
 * cannot see the other half: English prose declared as a constant and rendered
 * through t(variable) later.
 *
 *   const ASSURANCES = ['Role-based access control', 'Full audit trail', …]
 *   …
 *   {ASSURANCES.map(a => <li>{t(a)}</li>)}
 *
 * Every one of those reaches t(), so coverage.mjs reports the screen at 100%
 * while the page renders half in English — and worse, the composer turns the
 * ones it can partly match into mongrels like "भूमिका-based प्रवेश नियंत्रण",
 * which reads as broken rather than as untranslated. That is exactly how the
 * landing page's assurance list was missed.
 *
 * This scans every string literal outside the i18n tree that is NOT already a
 * t() argument, keeps the ones that look like English prose an officer would
 * read, and reports those with no exact catalogue entry.
 *
 * It is a review list, not a verdict: a Tailwind class, an icon name or an
 * object key can look like prose. Anything genuinely not user-facing belongs in
 * IGNORE below, with the reason — an ignore entry is a claim that the string
 * never reaches a screen, and should be readable as one.
 *
 * Run: npm run prose
 * ------------------------------------------------------------------------- */

import fs from 'node:fs'
import { hasMessage, LOCALES } from '../src/i18n/locale.js'
import '../src/i18n/mr/index.js'
import '../src/i18n/hi/index.js'

const TRANSLATED = LOCALES.filter(l => l !== 'en')

/* Strings that look like prose but never reach a screen. */
const IGNORE = [
  /^(?:https?:)?\/\//,                    // URLs
  /^[a-z0-9-]+\.(?:js|jsx|css|json|mjs)$/, // filenames
  /^#[0-9a-fA-F]{3,8}$/,                  // colours
  /^\d/,                                  // starts with a digit — ids, dates, versions
  /^[a-z_]+$/,                            // single lowercase token — object keys, ids
  /^[A-Z_]+$/,                            // SCREAMING_CASE constants
  /^(?:en|mr|hi)$/,                        // locale ids
  /[{}<>]/,                               // JSX/template fragments
  /\b(?:radial-gradient|linear-gradient|translate|rgba?)\s*\(/, // CSS values
  /^\s*$/
]

/* Tailwind and CSS class strings: multiple space-separated tokens that are
   overwhelmingly lowercase-with-dashes, slashes or bracket notation. */
function looksLikeClassNames(s) {
  const tokens = s.trim().split(/\s+/)
  if (tokens.length < 2) return false
  /* Every token is a plausible utility class, and at least one carries the
     punctuation — a colon, dash, slash or bracket — that plain English words in
     a sentence do not. "hidden sm:inline" qualifies; "risk score" does not. */
  const allClassish = tokens.every(tk => /^[a-z0-9:.\/[\]#%-]+$/.test(tk))
  const anyPunctuated = tokens.some(tk => /[:\/[\]#%-]/.test(tk))
  return allClassish && anyPunctuated
}

/* Prose an officer reads: contains a letter, and either has a space or is a
   capitalised word. Single lowercase words are almost always identifiers. */
function looksLikeProse(s) {
  if (s.length < 3 || s.length > 4000) return false
  if (IGNORE.some(re => re.test(s))) return false
  if (looksLikeClassNames(s)) return false
  if (!/[A-Za-z]{3}/.test(s)) return false
  return /\s/.test(s) || /^[A-Z]/.test(s)
}

const STRING = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g
const T_CALL = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g
const un = s => s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')

/* Declarations that hold proper nouns — the fragments the generator assembles
   trade names, officer names and addresses from. A name is transliterated at
   most, never translated, so these lines are skipped wholesale rather than
   listed as translation work. */
const PROPER_NOUNS = /^\s*(?:export\s+)?const\s+(?:FIRST_NAMES|LAST_NAMES|NAME_ROOTS|LEGAL_SUFFIX|BUSINESS_SUFFIXES|SUFFIXES|STREETS|LOCALITIES|AREAS)\b/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) {
      if (e.name === 'i18n') continue
      walk(p, out)
    } else if (/\.jsx?$/.test(e.name)) out.push(p)
  }
  return out
}

const findings = new Map()
for (const file of walk('src')) {
  const src = fs.readFileSync(file, 'utf8')

  /* Strings already written as t('…') are coverage.mjs's job, not this one. */
  const direct = new Set()
  for (const m of src.matchAll(T_CALL)) direct.add(un(m[1] ?? m[2] ?? ''))

  for (const line of src.split('\n')) {
    if (PROPER_NOUNS.test(line)) continue
    for (const m of line.matchAll(STRING)) {
    const s = un(m[1] ?? m[2] ?? '')
    if (direct.has(s) || !looksLikeProse(s)) continue
    const missing = TRANSLATED.filter(l => !hasMessage(l, s))
    if (missing.length === 0) continue
    if (!findings.has(s)) findings.set(s, { locales: missing, files: new Set() })
    findings.get(s).files.add(file.replace('src/', ''))
    }
  }
}

const rows = [...findings.entries()].sort((a, b) => a[0].localeCompare(b[0]))
console.log(`\n${rows.length} indirect strings with no exact entry in at least one locale\n`)
for (const [s, { locales, files }] of rows) {
  const where = [...files].join(', ')
  const text = s.length > 100 ? s.slice(0, 97) + '…' : s
  console.log(`  [${locales.join(',')}] ${where}`)
  console.log(`        ${text}`)
}
console.log('')
if (rows.length) {
  console.log('Each is either prose that needs a catalogue entry, or a string that')
  console.log('never reaches a screen and belongs in IGNORE with its reason.\n')
  process.exit(1)
}
