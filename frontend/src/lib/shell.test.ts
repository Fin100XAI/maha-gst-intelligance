import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_NAV,
  NAV_GROUPS,
  SHARED_NAV,
  WORKBENCH_NAV,
  navFor,
  screenAt,
  surfaceOf,
} from './navigation'
import { ROLES, landingPath, landingSurface } from './rbac'

// Read from the project root: the jsdom environment does not give this file
// a file:// import.meta.url.
const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf-8')

describe('role-based landing (docs/03 section 0)', () => {
  it('lands decision makers on the dashboard and officers on the workbench', () => {
    expect(landingSurface('COMMISSIONER')).toBe('dashboard')
    expect(landingSurface('ADDL_COMMISSIONER')).toBe('dashboard')
    expect(landingSurface('JOINT_COMMISSIONER')).toBe('dashboard')
    expect(landingSurface('STO')).toBe('workbench')
    expect(landingSurface('INSPECTOR')).toBe('workbench')
    expect(landingSurface('AUDITOR')).toBe('workbench')
    // docs/03 section 0 puts the Assistant Commissioner in the Workbench
    // column; section 2's "AC and above" reads AC as Addl. Commissioner.
    expect(landingSurface('ASST_COMMISSIONER')).toBe('workbench')
  })

  it('gives every role a landing path', () => {
    for (const role of ROLES) {
      expect(['/dashboard', '/workbench']).toContain(landingPath(role))
    }
  })
})

describe('information architecture (docs/03 section 2)', () => {
  it('carries all nine dashboard screens and all seven workbench screens', () => {
    expect(DASHBOARD_NAV.map((item) => item.code)).toEqual([
      'D1',
      'D2',
      'D3',
      'D4',
      'D5',
      'D6',
      'D7',
      'D8',
      'D9',
    ])
    // W8 Filings was added when the department asked to work a single
    // return through the rules rather than only a whole taxpayer. W9 Shape
    // of the year followed from the first real filed workbooks: the flags
    // and the rules both answer questions about compliance, and neither
    // answers "what does this business actually look like" -- which is the
    // question an officer asks first.
    expect(WORKBENCH_NAV.map((item) => item.code)).toEqual([
      'W1',
      'W8',
      'W9',
      'W2',
      'W3',
      'W4',
      'W5',
      'W6',
      'W7',
    ])
    // S0 How this works and S5 Check against the circular were added after
    // the department asked for a guide and for the 34-flag reconciliation.
    expect(SHARED_NAV.map((item) => item.code)).toEqual(['S0', 'S1', 'S2', 'S5', 'S3', 'S4'])
  })

  it('groups every destination, so none is reachable only by typing a URL', () => {
    const grouped = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.path))
    const all = [...DASHBOARD_NAV, ...WORKBENCH_NAV, ...SHARED_NAV].map((item) => item.path)
    expect(new Set(grouped)).toEqual(new Set(all))
  })

  it('has no duplicate routes', () => {
    const paths = [...DASHBOARD_NAV, ...WORKBENCH_NAV, ...SHARED_NAV].map((item) => item.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('resolves a pathname to its surface', () => {
    expect(surfaceOf('/dashboard/parameters')).toBe('dashboard')
    expect(surfaceOf('/workbench/cases')).toBe('workbench')
    expect(surfaceOf('/ingestion')).toBe('shared')
    expect(navFor('dashboard')).toBe(DASHBOARD_NAV)
  })
})

describe('design tokens (docs/03 section 1)', () => {
  it('declares dark values twice, so the toggle beats the OS both ways', () => {
    expect(tokens).toContain('@media (prefers-color-scheme: dark)')
    expect(tokens).toContain(':root:where(:not([data-theme="light"]))')
    expect(tokens).toContain(':root[data-theme="dark"]')
  })

  it('uses the validated categorical palette in fixed order', () => {
    expect(tokens).toContain('--cat-1: #2a78d6')
    expect(tokens).toContain('--cat-2: #eb6834')
    expect(tokens).toContain('--cat-3: #1baf7a')
    expect(tokens).toContain('--cat-4: #eda100')
    expect(tokens).toContain('--cat-1: #3987e5') // dark
  })

  it('reserves the status palette and never reuses it as a series colour', () => {
    for (const hex of ['#0ca30c', '#fab219', '#ec835a', '#d03b3b']) {
      expect(tokens).toContain(hex)
      // A status colour must not also appear as a categorical slot.
      expect(tokens).not.toContain(`--cat-1: ${hex}`)
      expect(tokens).not.toContain(`--cat-2: ${hex}`)
      expect(tokens).not.toContain(`--cat-3: ${hex}`)
      expect(tokens).not.toContain(`--cat-4: ${hex}`)
    }
  })

  it('uses a grey midpoint on the diverging ramp, never a hue', () => {
    expect(tokens).toContain('--diverge-mid: #f0efec')
    expect(tokens).toContain('--diverge-mid: #383835')
  })

  // The surfaces moved to the InQAI palette -- sovereign navy, gold and
  // saffron -- at the department's request. What this test protects is not
  // the particular hexes but that light and dark are each stated whole, so a
  // half-applied theme cannot ship.
  it('keeps the specified surfaces and ink', () => {
    expect(tokens).toContain('--surface-page: #f7f9fd')
    expect(tokens).toContain('--surface-chart: #ffffff')
    expect(tokens).toContain('--surface-page: #0d0d0d')
    expect(tokens).toContain('--surface-chart: #13234c')
    expect(tokens).toContain('--ink-muted: #8792a8')
  })

  it('carries the InQAI brand colours, and keeps them out of the data palette', () => {
    for (const hex of ['#1a2e5e', '#c9a028', '#e07b2a']) {
      expect(tokens).toContain(hex)
      // A brand colour must never become a status or a categorical slot: a
      // reader cannot be asked to work out whether this gold means "brand"
      // or "serious".
      expect(tokens).not.toContain(`--status-good: ${hex}`)
      expect(tokens).not.toContain(`--status-warning: ${hex}`)
      expect(tokens).not.toContain(`--status-serious: ${hex}`)
      expect(tokens).not.toContain(`--status-critical: ${hex}`)
      for (const slot of [1, 2, 3, 4]) {
        expect(tokens).not.toContain(`--cat-${String(slot)}: ${hex}`)
      }
    }
  })

  it('declares glass as chrome, with a fallback when backdrop-filter is absent', () => {
    expect(tokens).toContain('--glass-bg')
    expect(tokens).toContain('--glass-blur')
  })

  it('keeps the reserved status meanings legible on the navy dark surface', () => {
    // Same hues, lifted in lightness. A red at #d03b3b on #13234c is the
    // kind of contrast that passes a glance and fails a reading.
    expect(tokens).toContain('--status-critical: #ff6b6b')
    expect(tokens).toContain('--status-good: #3ecf3e')
  })
})

describe('where the reader is standing (the breadcrumb)', () => {
  it('names the screen, not the first path that happens to prefix it', () => {
    // The regression. `/workbench/filings` begins with `/workbench`, and W1
    // My Queue is declared first, so a first-match search told the reader
    // they were on My Queue while they stood on Filings.
    const found = screenAt('/workbench/filings')
    expect(found?.item.code).toBe('W8')
    expect(found?.group.id).toBe('workbench')
  })

  it('resolves a nested route to the screen that owns it', () => {
    expect(screenAt('/workbench/filings/27AAHCR8533P1ZL/042025')?.item.code).toBe('W8')
    expect(screenAt('/workbench/insights/27AAHCR8533P1ZL')?.item.code).toBe('W9')
  })

  it('still resolves the index route of a surface', () => {
    expect(screenAt('/workbench')?.item.code).toBe('W1')
    expect(screenAt('/dashboard')?.item.code).toBe('D1')
  })

  it('resolves every declared screen to itself', () => {
    // Not a sample: one wrong row here is one screen that mislabels itself
    // for as long as nobody happens to look at it.
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        expect(screenAt(item.path)?.item.code, item.path).toBe(item.code)
      }
    }
  })

  it('returns nothing for a path no screen owns', () => {
    expect(screenAt('/welcome')).toBeNull()
    expect(screenAt('/sign-in')).toBeNull()
    expect(screenAt('/nonsense')).toBeNull()
  })
})
