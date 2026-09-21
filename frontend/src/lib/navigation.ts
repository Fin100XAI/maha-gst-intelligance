import type { StringKey } from '../i18n/strings'
import type { Surface } from './rbac'

/**
 * The information architecture -- docs/03 section 2.
 *
 * Two surfaces off one engine. They are not two products: a Commissioner
 * clicks a bar and lands in the officer's world; an officer clicks up and sees
 * where their case sits in the portfolio. Both navs are always reachable.
 *
 * **On the wording.** These labels went through a round of plain English --
 * "From flag to recovery" for the enforcement funnel -- and came back. The
 * department is right: an officer who works here every day needs the standard
 * term, because that is what the circular says, what the training says and
 * what a colleague will say on the phone. The plain-language explanation
 * belongs beside the screen's own heading and behind its ⓘ, where a reader can
 * find it once and then never need it again. A sidebar is for navigating, not
 * for teaching.
 *
 * **On the length.** Twenty-two destinations is too many to scan. They are
 * grouped, and a group collapses; only the group you are working in is open.
 * Nothing was removed -- every screen the platform has is still one click from
 * here, which is the point of collapsing rather than cutting.
 */
export interface NavItem {
  readonly code: string
  readonly path: string
  readonly labelKey: StringKey
}

export interface NavGroup {
  readonly id: Surface | 'shared'
  readonly headingKey: StringKey
  readonly items: readonly NavItem[]
  /** Matched with `end` so the index route does not stay lit everywhere. */
  readonly end?: string
}

export const DASHBOARD_NAV: readonly NavItem[] = [
  { code: 'D1', path: '/dashboard', labelKey: 'nav.d1' },
  { code: 'D2', path: '/dashboard/filing', labelKey: 'nav.d2' },
  { code: 'D3', path: '/dashboard/revenue', labelKey: 'nav.d3' },
  { code: 'D4', path: '/dashboard/risk', labelKey: 'nav.d4' },
  { code: 'D5', path: '/dashboard/parameters', labelKey: 'nav.d5' },
  { code: 'D6', path: '/dashboard/funnel', labelKey: 'nav.d6' },
  { code: 'D7', path: '/dashboard/jurisdictions', labelKey: 'nav.d7' },
  { code: 'D8', path: '/dashboard/officers', labelKey: 'nav.d8' },
  { code: 'D9', path: '/dashboard/sectors', labelKey: 'nav.d9' },
]

export const WORKBENCH_NAV: readonly NavItem[] = [
  { code: 'W1', path: '/workbench', labelKey: 'nav.w1' },
  { code: 'W8', path: '/workbench/filings', labelKey: 'nav.w8' },
  { code: 'W9', path: '/workbench/insights', labelKey: 'nav.w9' },
  { code: 'W2', path: '/workbench/planner', labelKey: 'nav.w2' },
  { code: 'W3', path: '/workbench/registry', labelKey: 'nav.w3' },
  { code: 'W4', path: '/workbench/taxpayer', labelKey: 'nav.w4' },
  { code: 'W5', path: '/workbench/cases', labelKey: 'nav.w5' },
  { code: 'W6', path: '/workbench/notices', labelKey: 'nav.w6' },
  { code: 'W7', path: '/workbench/copilot', labelKey: 'nav.w7' },
]

export const SHARED_NAV: readonly NavItem[] = [
  { code: 'S0', path: '/guide', labelKey: 'nav.guide' },
  { code: 'S1', path: '/ingestion', labelKey: 'nav.ingestion' },
  { code: 'S2', path: '/library', labelKey: 'nav.library' },
  { code: 'S5', path: '/alignment', labelKey: 'nav.alignment' },
  { code: 'S3', path: '/admin', labelKey: 'nav.admin' },
  { code: 'S4', path: '/roadmap', labelKey: 'nav.roadmap' },
]

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'dashboard',
    headingKey: 'surface.dashboard',
    items: DASHBOARD_NAV,
    end: '/dashboard',
  },
  {
    id: 'workbench',
    headingKey: 'surface.workbench',
    items: WORKBENCH_NAV,
    end: '/workbench',
  },
  { id: 'shared', headingKey: 'nav.shared', items: SHARED_NAV },
]

export function navFor(surface: Surface): readonly NavItem[] {
  return surface === 'dashboard' ? DASHBOARD_NAV : WORKBENCH_NAV
}

export function surfaceOf(pathname: string): Surface | 'shared' {
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/workbench')) return 'workbench'
  return 'shared'
}

/**
 * Which screen a path is standing on, and the group it belongs to.
 *
 * **Longest match wins, and that is the whole point.** `/workbench/filings`
 * begins with `/workbench`, so a first-match search names the wrong screen:
 * the breadcrumb read "My Queue" while the reader was standing on Filings.
 * A breadcrumb that is wrong is worse than no breadcrumb - it is a confident
 * statement about where you are, and the reader has no reason to doubt it.
 */
export function screenAt(pathname: string): { group: NavGroup; item: NavItem } | null {
  const matches = NAV_GROUPS.flatMap((group) =>
    group.items
      .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
      .map((item) => ({ group, item })),
  ).sort((a, b) => b.item.path.length - a.item.path.length)
  return matches[0] ?? null
}
