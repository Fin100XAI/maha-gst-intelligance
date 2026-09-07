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
  /* A bare number, date or version — not a sentence that opens with one. The
     rule used to be /^\d/, which silently dropped every finding written as
     "8 proceedings past their deadline…" and every evidence line in the engine
     registry, because they begin with a figure. */
  /^\d[\d.\-/:]*$/,
  /^[a-z_]+$/,                            // single lowercase token — object keys, ids
  /^[A-Z_]+$/,                            // SCREAMING_CASE constants
  /^(?:en|mr|hi)$/,                        // locale ids
  /<[a-zA-Z/]/,                           // JSX fragments
  /\$\{/,                                 // template-literal interpolation
  /\b(?:radial-gradient|linear-gradient|translate|rgba?)\s*\(/, // CSS values
  /^\s*$/,

  /* Identifiers that must stay in Latin because they are quoted, not read.
     Each is a claim that translating the string would break something real. */
  /^AUTH-\d+$/,                            // authority record keys
  /^M\/s .+ v\. /,                         // case names, cited as published
  /^[A-Z]{5}\d{4}[A-Z](?:;|$)/,            // sample PAN values in the extract spec
  /^Shivneri Textiles/,                    // the extract spec's example trade name
  /^(?:DRC|ASMT|ADT|RFD|REG|GSTR)-\d/,     // form numbers an officer quotes
  /^char\(\d+\)/,                          // column type tokens in the extract spec
  /^(?:React|Vite|Recharts|Tailwind CSS|PostCSS \+ Autoprefixer)$/, // package names
  /^Asia\/Kolkata$/,                       // IANA timezone id, passed to Intl
  /^noopener noreferrer$/,                 // the rel attribute on external links
  /^(?:Enter|Escape)$/,                    // KeyboardEvent.key values
  /^Maha@2027$/,                           // the demonstration access code itself
  /must be used within/                    // developer errors, never rendered
]

/* A Tailwind utility class: lowercase, and carrying punctuation that plain
   English words in a sentence do not — a colon, dash, slash, bracket, hash or
   percent. "shrink-0" and "text-[#C5221F]" qualify; "risk" does not. */
const UTILITY = /^[a-zA-Z0-9:.\/[\]#%,()_-]+$/
const PUNCTUATED = /[:\/[\]#%-]/

/* Sentence punctuation a utility class never carries outside an arbitrary
   value: a comma, or a full stop that is not inside brackets. A long sentence
   whose only punctuation is a colon ("Counted whether live or expired: …")
   otherwise passes the utility test token by token and is silently dropped —
   which is how that string reached an officer in English on a Marathi screen. */
const SENTENCE_PUNCT = /,|\.(?:\s|$)/

/* A Tailwind class is lowercase. Uppercase appears only inside an arbitrary
   value — text-[#C5221F] — so a capitalised word outside brackets is a word,
   not a utility. Without this, "High/Critical taxpayers" and "Non-filers" read
   as class lists on the slash and the hyphen, and were dropped in silence. */
const CAPITALISED_WORD = /(?:^|\s|\/)[A-Z][a-z]/

function looksLikeClassNames(s) {
  const outsideBrackets = s.replace(/\[[^\]]*\]/g, '')
  if (SENTENCE_PUNCT.test(outsideBrackets)) return false
  if (CAPITALISED_WORD.test(outsideBrackets)) return false
  const tokens = s.trim().split(/\s+/)
  /* Every token is a plausible utility, and at least one is punctuated. A
     single token qualifies too: className={cond ? 'shrink-0' : 'text-white'}
     produces one-token strings that are still class lists. Uppercase is
     allowed because an arbitrary value carries one: text-[#C5221F]. */
  return tokens.every(tk => UTILITY.test(tk)) && tokens.some(tk => PUNCTUATED.test(tk))
}

/* Comments never render, and an apostrophe inside one ("isn't enough per the
   spec") otherwise reads as an opening quote and yields a fragment that looks
   like prose. Block comments are stripped whole because a JSX comment spans
   lines and its continuation lines carry no marker of their own; line comments
   are then skipped as they are met. */
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g
const LINE_COMMENT = /^\s*\/\//

/* Prose an officer reads: contains a letter, and either has a space or is a
   capitalised word. Single lowercase words are almost always identifiers. */
function looksLikeProse(s) {
  if (s.length < 3 || s.length > 4000) return false
  /* A {0} placeholder is part of a translatable template, not a JSX brace, so
     it is removed before the brace test rather than disqualifying the string. */
  if (/[{}]/.test(s.replace(/\{\d+\}/g, ''))) return false
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
  const src = fs.readFileSync(file, 'utf8').replace(BLOCK_COMMENT, '')

  /* Strings already written as t('…') are coverage.mjs's job, not this one. */
  const direct = new Set()
  for (const m of src.matchAll(T_CALL)) for (const raw of m.slice(1)) if (raw) direct.add(un(raw))

  for (const line of src.split('\n')) {
    if (PROPER_NOUNS.test(line) || LINE_COMMENT.test(line)) continue
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
