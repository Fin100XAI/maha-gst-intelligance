/* ---------------------------------------------------------------------------
 * npm run audit
 *
 * Four checks, each written because the failure it catches already happened in
 * this codebase and the build did not notice:
 *
 *   1. QUESTION OWNERSHIP — two engines answered "what can a week of officer
 *      work buy" independently and gave different officer counts.
 *   2. OWNED CONSTANTS — a canonical figure recomputed outside its owner is how
 *      that contradiction arrived.
 *   3. MODULE REGISTRATION — a missing MODULE_ICONS entry rendered <undefined/>
 *      and blanked the landing page. A missing description failed silently.
 *   4. UNDEFINED JSX COMPONENTS — <Foo /> that is neither imported nor defined
 *      renders as <undefined/> and blanks the page, and the bundler does not
 *      notice. Scoped to JSX only: a regex cannot do scope analysis on
 *      JavaScript, and a checker that fires on "return" gets ignored.
 * ------------------------------------------------------------------------- */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const DATA = path.join(ROOT, 'src/data')
const MODULES_DIR = path.join(ROOT, 'src/modules')

const failures = []
const warnings = []
const fail = (check, msg) => failures.push(`${check}: ${msg}`)
const warn = (check, msg) => warnings.push(`${check}: ${msg}`)

/* Registry is plain data, so it can be parsed without importing JSX. */
const regSrc = read('src/data/engineRegistry.js')
const entries = [...regSrc.matchAll(/\{\s*id: '([^']+)',\s*file: '([^']+)',\s*owns: '([^']+)',\s*canonical: \[([^\]]*)\]/g)]
  .map(m => ({ id: m[1], file: m[2], owns: m[3], canonical: m[4].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean) }))

// ---- 1. One owner per question -------------------------------------------
const byQuestion = new Map()
entries.forEach(e => {
  const key = e.owns.toLowerCase().replace(/[^a-z ]/g, '').trim()
  if (byQuestion.has(key)) fail('question-ownership', `"${e.owns}" is claimed by both ${byQuestion.get(key)} and ${e.file}`)
  else byQuestion.set(key, e.file)
})

// ---- 2. Owners export what they claim, and nobody else defines it ---------
const sanctioned = (() => {
  const block = regSrc.slice(regSrc.indexOf('SANCTIONED_CONSUMERS'))
  const out = {}
  for (const m of block.matchAll(/^\s{2}([A-Za-z_][\w]*): \[([^\]]*)\]/gm)) {
    out[m[1]] = m[2].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean)
  }
  return out
})()

const dataFiles = fs.readdirSync(DATA).filter(f => f.endsWith('.js'))
entries.forEach(e => {
  if (!dataFiles.includes(e.file)) { fail('registry', `${e.file} is registered but does not exist`); return }
  const src = read(`src/data/${e.file}`)
  e.canonical.forEach(sym => {
    const exported = new RegExp(`export (?:const|function|let) ${sym}\\b`).test(src)
    if (!exported) fail('owned-constant', `${e.file} claims to own ${sym} but does not export it`)
    // Anyone else DEFINING it is the contradiction pattern.
    dataFiles.filter(f => f !== e.file).forEach(other => {
      if (new RegExp(`export (?:const|function|let) ${sym}\\b`).test(read(`src/data/${other}`))) {
        fail('owned-constant', `${sym} is owned by ${e.file} but also defined in ${other}`)
      }
    })
    // Importing it is fine only where sanctioned.
    const allowed = sanctioned[sym]
    if (allowed) {
      dataFiles.filter(f => f !== e.file).forEach(other => {
        const os = read(`src/data/${other}`)
        const imports = new RegExp(`import \\{[^}]*\\b${sym}\\b[^}]*\\} from '\\./`).test(os)
        if (imports && !allowed.includes(other)) {
          warn('owned-constant', `${other} imports ${sym} (owned by ${e.file}) without being a sanctioned consumer — add it to SANCTIONED_CONSUMERS if intended`)
        }
      })
    }
  })
})

// ---- 3. Every module registered in all four places -----------------------
const ctx = read('src/context/AppContext.jsx')
const app = read('src/App.jsx')
const meta = read('src/components/layout/moduleMeta.js')
const land = read('src/components/layout/LandingPage.jsx')
const mods = [...ctx.matchAll(/\{ id: '([a-z0-9-]+)', label: '([^']+)', group: '([^']+)'([^}]*)\}/g)]
  .map(m => ({ id: m[1], label: m[2], group: m[3], hidden: /hidden: true/.test(m[4]) }))

mods.forEach(m => {
  // Keys appear both quoted ('case-twin') and bare (capacity) — accept either.
  const q = s => new RegExp(`(?:'${m.id}'|(?<![\\w-])${m.id})\\s*:`).test(s)
  if (!q(app)) fail('registration', `${m.id} has no route in App.jsx`)
  if (!q(meta)) fail('registration', `${m.id} has no MODULE_ICONS entry — this renders <undefined/> and blanks the page`)
  if (!m.hidden && !q(land)) fail('registration', `${m.id} has no landing description`)
})

// Groups must exist in the nav and carry a tone.
const groups = [...new Set(mods.map(m => m.group))]
groups.forEach(g => {
  if (!meta.includes(`'${g}'`)) fail('registration', `group "${g}" is not in NAV_GROUPS`)
  if (!land.includes(`'${g}'`)) fail('registration', `group "${g}" has no GROUP_TONE`)
})

/* Role access is declared by section name. Renaming or retiring a section
 * silently revokes access for every role still naming the old one, because the
 * section gate runs before the module gate — the role simply stops seeing
 * screens, with no error anywhere. This has nearly happened twice. */
const roleBlock = ctx.slice(ctx.indexOf('ROLE_SECTIONS = {'), ctx.indexOf('}', ctx.indexOf('ROLE_SECTIONS = {')))
for (const m of roleBlock.matchAll(/'([^']+)':\s*\[([^\]]*)\]/g)) {
  m[2].split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean).forEach(sec => {
    if (!groups.includes(sec)) {
      fail('role-access', `role "${m[1]}" grants section "${sec}", which no module belongs to — that role silently loses those screens`)
    }
  })
}
// And every live section should be reachable by somebody.
const granted = new Set([...roleBlock.matchAll(/'([^']+)'/g)].map(x => x[1]))
groups.forEach(g => {
  if (!granted.has(g) && !/'all'/.test(roleBlock)) fail('role-access', `section "${g}" is granted to no role`)
})

// ---- 4. Undeclared identifiers in modules --------------------------------
const BUILTINS = new Set(['console','window','document','Math','Object','Array','String','Number','Boolean','JSON','Date','Set','Map','Intl','isFinite','isNaN','parseInt','parseFloat','React','require','process','structuredClone'])
fs.readdirSync(MODULES_DIR).filter(f => f.endsWith('.jsx')).forEach(f => {
  const raw = read(`src/modules/${f}`)
  // Blank out comments and every kind of string literal before scanning, so
  // prose inside t('...') is never mistaken for code.
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  const declared = new Set(BUILTINS)
  for (const m of raw.matchAll(/import\s+\{([^}]+)\}\s+from/g)) m[1].split(',').forEach(x => declared.add(x.trim().split(/\s+as\s+/).pop().trim()))
  for (const m of raw.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) declared.add(m[1])
  for (const m of src.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1])
  for (const m of src.matchAll(/\b(?:const|let)\s*\{([^}]+)\}/g)) m[1].split(',').forEach(x => declared.add(x.trim().split(':').pop().trim()))
  for (const m of src.matchAll(/\(\s*\{([^}]*)\}\s*\)\s*=>/g)) m[1].split(',').forEach(x => declared.add(x.trim().split(/[:=]/)[0].trim()))
  for (const m of src.matchAll(/\(([A-Za-z_$][\w$]*)(?:,\s*([A-Za-z_$][\w$]*))?\)\s*=>/g)) { declared.add(m[1]); if (m[2]) declared.add(m[2]) }
  for (const m of src.matchAll(/\.map\(\(?([A-Za-z_$][\w$]*)/g)) declared.add(m[1])
  // const [a, setA] = useState() — the single biggest source of false alarms.
  for (const m of src.matchAll(/\b(?:const|let)\s*\[([^\]]+)\]/g)) m[1].split(',').forEach(x => declared.add(x.trim()))
  // Any arrow parameter, in any position.
  for (const m of src.matchAll(/(?:\(|,|^|\s)([A-Za-z_$][\w$]*)\s*=>/gm)) declared.add(m[1])
  // Destructured function parameters — function Row({ icon: Icon }) — which is
  // how every icon in this codebase reaches its JSX tag.
  for (const m of src.matchAll(/function\s+[A-Za-z_$][\w$]*\s*\(\s*\{([^}]*)\}/g)) {
    m[1].split(',').forEach(x => declared.add(x.trim().split(/[:=]/).pop().trim()))
  }

  /* Only JSX component positions are checked. A regex cannot do scope analysis
   * on JavaScript, and a checker that reports "return" and "const" as
   * undeclared teaches people to ignore it — which then hides the real ones.
   * A <Component /> that is neither imported nor defined is unambiguous, and it
   * is exactly the failure that has blanked this page: a missing Logo import,
   * and a PlatformMap left referenced after deletion. */
  const used = new Set([...src.matchAll(/<([A-Z][\w$]*)/g)].map(m => m[1]))
  const missing = [...used].filter(u => !declared.has(u))
  missing.forEach(u => fail('undefined-component', `${f} renders <${u}/> which is neither imported nor defined — this compiles and blanks the page`))
})

// ---- report ---------------------------------------------------------------
console.log(`\nengines registered: ${entries.length}   modules: ${mods.length}   groups: ${groups.length}\n`)
if (warnings.length) {
  console.log('WARNINGS')
  warnings.forEach(w => console.log('  ! ' + w))
  console.log('')
}
if (failures.length) {
  console.log('FAILURES')
  failures.forEach(f => console.log('  x ' + f))
  console.log(`\n${failures.length} failure(s).\n`)
  process.exit(1)
}
console.log('All checks passed.\n')
