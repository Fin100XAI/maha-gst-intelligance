import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Every screen accounts for every header filter.
 *
 * The failure this exists to catch is silent: an officer narrows to one
 * division, the screen ignores it, and every figure stays statewide while
 * looking divisional. Nothing about that is visible in a build, a type check
 * or a render — the page is simply wrong, quietly, for whoever set the filter.
 *
 * So each of the six filters must be one of two things on each screen:
 *
 *   applied   — the screen reads `filters.<key>`, or routes its records
 *               through a shared helper that reads it
 *   declared  — the screen names it in `ignores={{ ... }}` with the reason,
 *               which the officer sees whenever that filter is actually set
 *
 * A screen that carries <FilterNotApplicable> opts out of all six at once and
 * says so on its face. Anything else is a gap and fails the build.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MODULES = path.join(ROOT, 'src/modules')

const KEYS = ['dateRange', 'division', 'district', 'sector', 'taxpayerType', 'riskLevel']

/* What each shared helper covers, mirroring AppContext.jsx. applyCaseFilters
 * is the subtle one: it narrows by date ONLY when handed a date field, so
 * crediting it with dateRange unconditionally would pass screens that never
 * narrow by date at all. That mistake hid three gaps when this check was
 * first written against a plain grep. */
const HELPERS = {
  applyGlobalFilters: () => ['division', 'district', 'sector', 'taxpayerType', 'riskLevel'],
  applyScopeFilters: () => ['division', 'district', 'sector', 'riskLevel'],
  applyCaseFilters: call => {
    const base = ['division', 'district', 'sector', 'riskLevel']
    /* A third argument is the date field. `applyCaseFilters(r, filters)` has
       none, so no date narrowing happens. */
    return /applyCaseFilters\s*\([^)]*,[^)]*,[^)]*\)/.test(call) ? [...base, 'dateRange'] : base
  },
  isWithinDateRange: () => ['dateRange'],
  sliceTrendByDateRange: () => ['dateRange']
}

const gaps = []
const rows = []

for (const f of fs.readdirSync(MODULES).filter(x => x.endsWith('.jsx')).sort()) {
  const src = fs.readFileSync(path.join(MODULES, f), 'utf8')
  const name = f.replace('.jsx', '')

  /* Only a screen that opts out of the filter bar entirely is exempt. Several
     screens carry BOTH — a scope banner at the top, and a FilterNotApplicable
     against one card further down that is statewide by construction. Those
     still have to account for all six, so the exemption requires the absence
     of a scope banner, not merely the presence of an opt-out. */
  if (src.includes('<FilterNotApplicable') && !src.includes('<FilterScope')) {
    rows.push({ name, state: 'not applicable' })
    continue
  }

  const applied = new Set()
  for (const k of KEYS) if (src.includes(`filters.${k}`)) applied.add(k)
  for (const [h, covers] of Object.entries(HELPERS)) {
    const re = new RegExp(`\\b${h}\\s*\\([^)]*\\)`, 'g')
    for (const m of src.match(re) || []) covers(m).forEach(k => applied.add(k))
  }

  const tag = src.match(/<FilterScope[\s\S]*?\/>/)
  if (!tag) {
    gaps.push(`${name}: filters are read but the screen declares no scope banner, so the officer cannot see what is hidden`)
    rows.push({ name, state: 'UNDECLARED' })
    continue
  }

  const declared = new Set()
  const ig = tag[0].match(/ignores=\{\{([\s\S]*?)\}\}/)
  if (ig) {
    /* Strip the reason strings before looking for keys. The reasons are prose
       and contain colons of their own — "Dropped on purpose: …" parsed as a
       filter named `purpose` the first time this ran. */
    const keysOnly = ig[1].replace(/'(?:[^'\\]|\\.)*'/g, "''")
    for (const m of keysOnly.matchAll(/(?:^|[{,])\s*(\w+)\s*:/g)) declared.add(m[1])
  }

  const missing = KEYS.filter(k => !applied.has(k) && !declared.has(k))
  for (const k of missing) {
    gaps.push(`${name}: '${k}' is neither applied nor declared in ignores={{ }}`)
  }
  for (const k of declared) {
    if (!KEYS.includes(k)) gaps.push(`${name}: ignores lists '${k}', which is not a header filter`)
  }

  rows.push({ name, state: missing.length ? 'GAP' : `${applied.size} applied · ${declared.size} declared` })
}

console.log(`\n${rows.length} screens checked against ${KEYS.length} header filters\n`)
for (const r of rows) console.log(`  ${r.name.padEnd(32)} ${r.state}`)

if (gaps.length) {
  console.log(`\n${gaps.length} filters unaccounted for:\n`)
  for (const g of gaps) console.log(`  ${g}`)
  console.log('\nEither narrow the screen by that filter, or name it in ignores={{ }}')
  console.log('with the reason the officer should see.\n')
  process.exit(1)
}

console.log('\n  every screen accounts for every header filter\n')
