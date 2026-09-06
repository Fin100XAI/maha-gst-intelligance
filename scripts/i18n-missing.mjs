/* Dumps the strings a locale is missing, grouped by the file they come from,
 * so translation can proceed module by module instead of as one flat list.
 * Run: node scripts/i18n-missing.mjs <locale> [fileFilter] */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const locale = process.argv[2] || 'hi'
const filter = process.argv[3] || ''

const appFiles = []
const walkApp = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name)
  if (e.isDirectory()) { if (!/i18n|node_modules/.test(p)) walkApp(p) }
  else if (/\.jsx?$/.test(e.name)) appFiles.push(p)
})
walkApp(path.join(ROOT, 'src'))

const keys = new Set()
const dir = path.join(ROOT, 'src/i18n', locale)
if (fs.existsSync(dir)) {
  const cat = []
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p); else if (/\.js$/.test(e.name)) cat.push(p)
  })
  walk(dir)
  for (const f of cat) {
    const s = fs.readFileSync(f, 'utf8')
    for (const m of s.matchAll(/^\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/gm)) keys.add(m[1])
    for (const m of s.matchAll(/^\s*([A-Za-z][\w]*)\s*:/gm)) keys.add(m[1])
  }
}

const byFile = new Map()
for (const f of appFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/')
  if (filter && !rel.includes(filter)) continue
  const s = fs.readFileSync(f, 'utf8')
  const found = new Set()
  for (const m of s.matchAll(/\bt\(\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g)) found.add(m[1])
  for (const m of s.matchAll(/\bt\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)) found.add(m[1])
  const missing = [...found].filter(x => !keys.has(x))
  if (missing.length) byFile.set(rel, missing)
}

const total = [...byFile.values()].reduce((a, b) => a + b.length, 0)
console.log(`locale ${locale}: ${total} missing across ${byFile.size} files\n`)
for (const [f, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`--- ${f}  (${list.length}) ---`)
  list.forEach(x => console.log(JSON.stringify(x)))
  console.log('')
}
