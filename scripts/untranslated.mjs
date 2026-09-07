/* ---------------------------------------------------------------------------
 * UNTRANSLATED RENDER SITES
 *
 * The third and last blind spot. coverage.mjs asks whether a string HAS a
 * catalogue entry; vocabulary.mjs asks the same of the closed vocabularies;
 * prose.mjs asks it of prose declared as a constant. All three ask about the
 * catalogue. None of them asks the other question:
 *
 *     does the render site actually call t() on it?
 *
 * It does not have to. `{step.label}` and `{FUNNEL_NOTE}` render the raw
 * English while the catalogue holds a perfect translation of both, and every
 * report says 100%. That is exactly what the Revenue Protection Command Centre
 * was doing — 52 English lines on a screen three scans called complete.
 *
 * This scans JSX interpolations that put a value on screen and reports the ones
 * with no t() around them. It is a review list: an interpolation may legitimately
 * render a number, a date, a trade name or an element. The FIELDS and CONSTANTS
 * below name what is known to carry translatable text.
 *
 * Run: npm run untranslated
 * ------------------------------------------------------------------------- */

import fs from 'node:fs'

/* Record fields and object properties that carry a translatable string. */
const FIELDS = [
  'label', 'lossReason', 'owner', 'note', 'title', 'text', 'desc', 'description',
  'summary', 'reason', 'detail', 'why', 'what', 'action', 'recommendation',
  'caption', 'heading', 'subtitle', 'blurb', 'statement', 'verdict', 'holding',
  'question', 'answer', 'meaning', 'basis', 'consequence', 'remedy', 'scope',
  'failureMode', 'rationale', 'plain', 'name', 'stage', 'position', 'status',
  'axis', 'recommendedAction', 'suggestedScope', 'lossReason', 'usedBy', 'licence',
  'condition', 'valueLabel', 'headline', 'meaning', 'decision', 'sublabel', 'hint',
  'unit', 'band', 'tier', 'outcome', 'finding', 'implication', 'nextStep', 'evidence'
]

/* Module-level constants whose value is a translatable sentence. */
const CONSTANTS = /^[A-Z][A-Z0-9_]*(?:_NOTE|_CAVEAT|_TEXT|_SUMMARY|_BLURB|_LEAD|_INTRO)$/

/* The receiver may be indexed — SEVERITY[sev].meaning, KLASS[m.klass].label —
   which an identifier-only pattern walks straight past. */
const RECEIVER = '[a-zA-Z_$][\\w$]*(?:\\[[^\\]]+\\])?'
const FIELD_RE = new RegExp(`\\{\\s*(${RECEIVER})\\??\\.(${FIELDS.join('|')})\\b\\s*\\}`)
const CONST_RE = /\{\s*([A-Z][A-Z0-9_]*)\s*\}/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory()) { if (e.name !== 'i18n') walk(p, out) }
    else if (/\.jsx$/.test(e.name)) out.push(p)
  }
  return out
}

/* Sites that render something other than a sentence. Each entry is a claim
   that calling t() here would be wrong, not merely unnecessary. */
const NOT_TEXT = [
  [/CommandBoard\.jsx$/, /\{st\.text\}/, 'a CSS class from the severity map'],
  [/RiskBadge\.jsx$/, /\{c\.text\}/, 'a CSS class from the risk-colour map'],
  [/DistrictDivisionPerformance\.jsx$/, /\{shade\.text\}/, 'a CSS class from the shading map'],
  [/ExecutiveCommandCenter\.jsx$/, /\{c\.text\}/, 'a CSS class from the shading map'],
  [/AIGovernanceSecurity\.jsx$/, /\{r\.action\}/, 'inside a search filter, not rendered'],
  [/OfficerAICopilot\.jsx$/, /\{result\.question\}/, 'inside an audit-log template'],
  [/ReportsBriefingNotes\.jsx$/, /\{(?:scope\.label|report\.name|activeReport\.name)\}/, 'export/clipboard text, not screen text'],
  [/CasePriorityEngine\.jsx$/, /\{r\.name\}/, "an officer's name"],
  [/DistrictDivisionPerformance\.jsx$/, /\{o\.name\}/, "an officer's name"],
  [/ExtractSpecification\.jsx$/, /\{fld\.name\}/, 'a column identifier in the data request'],
  [/ProjectResources\.jsx$/, /flex-1">\{s\.name\}/, 'a case citation, quoted as published'],
  [/ProjectResources\.jsx$/, /navy-900">\{s\.name\}<\/span>\s*$/, 'a package name — React, Vite, Recharts'],
  [/LandingPage\.jsx$/, /key=\{d\.name\}/, 'a React key; the rendered copy already calls t()'],
  [/ExecutiveCommandCenter\.jsx$/, /key=\{c\.axis\}/, 'a React key; the cell beside it calls t()'],
  [/ProjectResources\.jsx$/, /\{s\.licence\}/, 'a licence identifier — MIT, Apache-2.0']
]

const hits = []
for (const file of walk('src')) {
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/\bt\(/.test(line)) return          // already translated on this line
    if (/^\s*(?:\/\/|\*)/.test(line)) return // comment
    if (/^\s*import\s/.test(line)) return   // a named import is not a render site
    if (/key=\{/.test(line) && !/>\s*\{/.test(line)) return // a React key is never displayed
    if (NOT_TEXT.some(([f, w]) => f.test(file) && w.test(line))) return

    const field = line.match(FIELD_RE)
    const konst = line.match(CONST_RE)
    if (!field && !konst) return
    if (konst && !CONSTANTS.test(konst[1])) return

    hits.push({
      where: `${file.replace('src/', '')}:${i + 1}`,
      what: (field ? field[0] : konst[0]),
      line: line.trim().slice(0, 96)
    })
  })
}

console.log(`\n${hits.length} render sites put a value on screen without t()\n`)
for (const h of hits) {
  console.log(`  ${h.where}  ${h.what}`)
  console.log(`      ${h.line}`)
}
console.log('')
if (hits.length) {
  console.log('Each is either a string that needs wrapping in t(), or a value that')
  console.log('is not text — a number, a date, a trade name, an element.\n')
  process.exit(1)
}
