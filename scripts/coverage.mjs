/* ---------------------------------------------------------------------------
 * PER-PAGE TRANSLATION COVERAGE
 *
 * Answers, for every screen and every language: what share of the strings that
 * screen renders resolve to an exact catalogue entry?
 *
 * Method: extract every t('…') / t("…") literal from a screen's own source and
 * from the shared components it renders, then ask the catalogue whether each
 * has an exact entry. Exact only. A composed answer is counted as a miss,
 * because composition on a short label returns a half-English mongrel, and a
 * screen that scores well on composed strings still reads as broken.
 *
 * What this measures and what it does not:
 *
 *   It measures the strings a screen asks to translate. It cannot see a string
 *   that was never wrapped in t() — that is what the raw-render scan in
 *   audit.mjs looks for — nor a value the data layer supplies, which
 *   vocabulary.mjs checks separately. The three together cover the page; none
 *   of them alone does.
 *
 * Run: npm run coverage        (add a locale to list that locale's misses:
 *                               npm run coverage -- hi)
 * ------------------------------------------------------------------------- */

import fs from 'node:fs'
import path from 'node:path'
import { hasMessage, LOCALES } from '../src/i18n/locale.js'
import '../src/i18n/mr/index.js'
import '../src/i18n/hi/index.js'

const TRANSLATED = LOCALES.filter(l => l !== 'en')
const SRC = 'src'
const detail = process.argv[2]

/* t('…') and tn(count, '…', '…'). Both forms are matched, and both quote
   styles, so neither a stray double-quoted call nor a plural chooser is missed.
   tn() was overlooked at first — the landing ticker's plural line stayed
   English on a screen the report scored at 100%. Escaped quotes are handled.

   Only tn's FIRST literal is captured by one pass; the global regex then finds
   the second on its next match, because both sit after the same `tn(`. */
const CALL = /\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")|\btn\([^,]+,\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g

function unescape(s) {
  return s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
}

function literalsIn(file) {
  const out = new Set()
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(CALL)) {
    /* Six groups: t()'s single- and double-quoted forms, then tn()'s two
       literals in each quote style. Every one that matched is a message. */
    for (const raw of m.slice(1)) {
      if (raw && raw.length) out.add(unescape(raw))
    }
  }
  return out
}

/* A screen renders its own file plus whatever it imports from components/ and
   the strings its data file supplies. Resolve one level of local import, which
   is where the shared panels (ActionBrief, ComparableCases, drilldowns) live. */
function localImports(file) {
  const src = fs.readFileSync(file, 'utf8')
  const out = []
  for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) {
    const resolved = path.join(path.dirname(file), m[1]).replace(/\\/g, '/')
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) out.push(resolved)
  }
  return out
}

const screens = fs.readdirSync(`${SRC}/modules`)
  .filter(f => f.endsWith('.jsx'))
  .sort()

const rows = []
const missesByLocale = Object.fromEntries(TRANSLATED.map(l => [l, new Map()]))

for (const screen of screens) {
  const file = `${SRC}/modules/${screen}`
  const strings = literalsIn(file)
  for (const dep of localImports(file)) {
    if (dep.includes('/components/') || dep.includes('/data/')) {
      for (const s of literalsIn(dep)) strings.add(s)
    }
  }

  const row = { screen: screen.replace('.jsx', ''), total: strings.size }
  for (const locale of TRANSLATED) {
    let hit = 0
    for (const s of strings) {
      if (hasMessage(locale, s)) hit++
      else {
        const m = missesByLocale[locale]
        m.set(s, (m.get(s) || 0) + 1)
      }
    }
    row[locale] = strings.size === 0 ? 100 : Math.round((hit / strings.size) * 100)
  }
  rows.push(row)
}

/* The shell — navigation, context bar, login, layout — is read on every screen,
   so it is reported as its own line rather than folded into any one screen. */
const shellFiles = []
for (const dir of [`${SRC}/components/layout`, `${SRC}/components/ui`, `${SRC}/context`]) {
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir)) {
    if (/\.jsx?$/.test(f)) shellFiles.push(`${dir}/${f}`)
  }
}
const shellStrings = new Set()
for (const f of shellFiles) for (const s of literalsIn(f)) shellStrings.add(s)
const shellRow = { screen: '· shell (every screen)', total: shellStrings.size }
for (const locale of TRANSLATED) {
  let hit = 0
  for (const s of shellStrings) {
    if (hasMessage(locale, s)) hit++
    else {
      const m = missesByLocale[locale]
      m.set(s, (m.get(s) || 0) + 1)
    }
  }
  shellRow[locale] = shellStrings.size === 0 ? 100 : Math.round((hit / shellStrings.size) * 100)
}

function bar(pct) {
  const filled = Math.round(pct / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

const width = Math.max(...rows.map(r => r.screen.length), shellRow.screen.length)
const header = `${'SCREEN'.padEnd(width)}  ${'STRINGS'.padStart(7)}   ${TRANSLATED.map(l => `${l.toUpperCase()}`.padEnd(18)).join('')}`
console.log('\n' + header)
console.log('─'.repeat(header.length))

function line(r) {
  const cells = TRANSLATED.map(l => `${bar(r[l])} ${String(r[l]).padStart(3)}%`.padEnd(18)).join('')
  console.log(`${r.screen.padEnd(width)}  ${String(r.total).padStart(7)}   ${cells}`)
}

line(shellRow)
console.log('─'.repeat(header.length))
/* Worst first — that is the reading order for deciding what to translate next. */
rows.sort((a, b) => (a[TRANSLATED[0]] + a[TRANSLATED[1] ?? TRANSLATED[0]]) - (b[TRANSLATED[0]] + b[TRANSLATED[1] ?? TRANSLATED[0]]))
rows.forEach(line)

const allStrings = new Set([...shellStrings])
for (const screen of screens) for (const s of literalsIn(`${SRC}/modules/${screen}`)) allStrings.add(s)
console.log('─'.repeat(header.length))
for (const locale of TRANSLATED) {
  let hit = 0
  for (const s of allStrings) if (hasMessage(locale, s)) hit++
  const pct = Math.round((hit / allStrings.size) * 100)
  console.log(`${locale}: ${hit} of ${allStrings.size} distinct strings translated (${pct}%)`)
}

if (detail && TRANSLATED.includes(detail)) {
  const missing = [...missesByLocale[detail].entries()].sort((a, b) => b[1] - a[1])
  console.log(`\n${missing.length} strings missing in ${detail}, most-rendered first:\n`)
  for (const [s, count] of missing) {
    console.log(`  [${String(count).padStart(2)} screens] ${s.length > 110 ? s.slice(0, 107) + '…' : s}`)
  }
}
console.log('')
