/**
 * Template-literal prose check.
 *
 * A sentence built with `${...}` interpolation can never match a catalogue key,
 * because the key is computed at run time and the catalogue is keyed on source
 * text. Such a string reaches an officer in English on a screen set to Marathi
 * or Hindi, and it does so silently: coverage.mjs sees no t() call to score,
 * prose.mjs sees no constant to look up, and untranslated.mjs sees a value that
 * did pass through t() at the render site.
 *
 * Only the browser catches these, which is why they are worth a check of their
 * own. The fix is always the same shape: replace the interpolation with a {0}
 * placeholder and pass the value as an argument —
 *
 *   `Issue notice before ${date}`   →   t('Issue notice before {0}', date)
 *
 * PROSE_FIELDS lists the object keys whose values reach a screen as sentences.
 * A template literal assigned to any other key (an id, a className, a URL, a
 * chart accessor) is not officer-facing and is not reported.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/* Names whose value is rendered to an officer as prose — as an object key
   (`because: \`…\``) or as a local the object is later built from
   (`because = \`…\``). Both forms reach the same screen. */
const PROSE_FIELDS = [
  'action', 'advice', 'basis', 'because', 'body', 'caption', 'condition',
  'consequence', 'context', 'decision', 'description', 'detail', 'explanation',
  'finding', 'headline', 'heading', 'help', 'hint', 'implication', 'insight',
  'interpretation', 'label', 'meaning', 'message', 'note', 'reason',
  'recommendation', 'remedy', 'requirement', 'rationale', 'statement',
  'subtitle', 'summary', 'text', 'title', 'tooltip', 'valueLabel', 'verdict',
  'what', 'why'
]

/* A template literal that is only a value, not a sentence: no run of letters. */
const NO_PROSE = /^[^A-Za-z]*$/

const FIELD_RE = new RegExp(
  `\\b(${PROSE_FIELDS.join('|')})\\s*[:=]\\s*\`([^\`]*\\$\\{[^\`]*)\``,
  'g'
)

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, out)
    else if (/\.jsx?$/.test(e.name)) out.push(full)
  }
  return out
}

const files = walk(path.join(ROOT, 'src')).filter(f => !f.includes(`${path.sep}i18n${path.sep}`))
const findings = []

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  for (const m of src.matchAll(FIELD_RE)) {
    const literal = m[2]
    /* Strip the interpolations and see whether English prose remains. */
    const bare = literal.replace(/\$\{[^}]*\}/g, ' ').trim()
    if (NO_PROSE.test(bare)) continue
    if (bare.replace(/[^A-Za-z]/g, '').length < 8) continue
    const line = src.slice(0, m.index).split('\n').length
    findings.push({ rel, line, field: m[1], text: literal.replace(/\s+/g, ' ').slice(0, 120) })
  }
}

/* ---------------------------------------------------------------------------
 * The other half: a template that IS held correctly, and rendered wrong.
 *
 * Where a sentence needs its arguments kept apart, the data layer returns a
 * { key, args } pair and the render site has to spread it:
 *
 *   t(pos.verdict.key, ...pos.verdict.args)
 *
 * Passing the object instead renders nothing and takes the whole screen down —
 * "Objects are not valid as a React child (found: object with keys {key, args})".
 * The bundler compiles it, every catalogue check passes, and only the browser
 * shows the blank page. That is exactly what happened when these fields were
 * converted, on six render sites the conversion missed.
 *
 * The field names are read out of the data layer rather than listed here, so a
 * new one is covered the day it is written.
 * ------------------------------------------------------------------------- */
/* A field holding a template pair is named with a Msg suffix — `verdictMsg`,
   `rateNoteMsg`. The convention is what makes this checkable: `verdict` alone
   is a plain string on three other screens, so a check keyed on the bare name
   could only guess. Any `.somethingMsg` that is not immediately followed by
   `.key` or `.args` is being rendered as an object. */
const MSG_FIELD = /\.(\w+Msg)\b(?!\s*\.\s*(?:key|args))/g

const objectRenders = []
for (const file of files) {
  if (!/\.jsx$/.test(file)) continue
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return
    /* Only a render position matters: a JSX child, or an argument to t(). */
    if (!/[{(]/.test(line)) return
    for (const m of line.matchAll(MSG_FIELD)) objectRenders.push({ rel, line: i + 1, field: m[1] })
  })
}

console.log(`\n${findings.length} interpolated sentences that can never match a catalogue key\n`)
for (const f of findings) {
  console.log(`  ${f.rel}:${f.line}  (${f.field})`)
  console.log(`        ${f.text}`)
}
if (findings.length) {
  console.log('\nReplace each interpolation with a {0} placeholder and pass the')
  console.log('value to t() as an argument.\n')
}

console.log(`${objectRenders.length} render sites pass a { key, args } pair where React expects a string\n`)
for (const o of objectRenders) {
  console.log(`  ${o.rel}:${o.line}`)
  console.log(`        .${o.field} — spread it: t(x.${o.field}.key, ...x.${o.field}.args)`)
}
if (objectRenders.length) {
  console.log('\nEach of these renders an object as a React child and blanks the screen.\n')
}

if (findings.length || objectRenders.length) process.exit(1)
console.log('  no interpolated prose, and every template pair is spread at its render site\n')
