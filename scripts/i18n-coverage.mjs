/* Reports how much of the app's translatable text each locale actually covers.
 * Run: node scripts/i18n-coverage.mjs */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const appFiles = []
const walkApp = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name)
  if (e.isDirectory()) { if (!/i18n|node_modules/.test(p)) walkApp(p) }
  else if (/\.jsx?$/.test(e.name)) appFiles.push(p)
})
walkApp(path.join(ROOT, 'src'))

/* Every literal handed to t(). Template literals are skipped deliberately —
 * they are interpolated at runtime and cannot be catalogue keys. */
const strings = new Set()
for (const f of appFiles) {
  const s = fs.readFileSync(f, 'utf8')
  for (const m of s.matchAll(/\bt\(\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g)) strings.add(m[1])
  for (const m of s.matchAll(/\bt\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)) strings.add(m[1])
}

function catalogueKeys(locale) {
  const dir = path.join(ROOT, 'src/i18n', locale)
  if (!fs.existsSync(dir)) return null
  const files = []
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p); else if (/\.js$/.test(e.name)) files.push(p)
  })
  walk(dir)
  const keys = new Set()
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8')
    for (const m of s.matchAll(/^\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/gm)) keys.add(m[1])
    for (const m of s.matchAll(/^\s*([A-Za-z][\w]*)\s*:/gm)) keys.add(m[1])
  }
  return keys
}

console.log(`\ntranslatable strings in app code: ${strings.size}\n`)
for (const loc of ['mr', 'hi']) {
  const keys = catalogueKeys(loc)
  if (!keys) { console.log(`${loc}: no catalogue`); continue }
  const missing = [...strings].filter(s => !keys.has(s))
  const pct = Math.round((1 - missing.length / strings.size) * 100)
  const short = missing.filter(m => m.length < 40).length
  console.log(`${loc}: ${keys.size} keys | ${missing.length} app strings missing | ${pct}% coverage`)
  console.log(`    of the gap: ${short} short labels, ${missing.length - short} sentences or longer`)
}
console.log('')
