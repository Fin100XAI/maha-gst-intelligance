/**
 * Roles and landing surfaces -- docs/02 section 10, docs/03 section 0.
 *
 * This module decides which surface a role *lands on*, not what it is allowed
 * to see.  Authorisation is enforced at the query layer on the server, with a
 * mandatory jurisdiction predicate; an out-of-scope GSTIN returns 404 rather
 * than 403, because 403 leaks existence.  Nothing here is a security control.
 */

export const ROLES = [
  'INSPECTOR',
  'STO',
  'ASST_COMMISSIONER',
  'JOINT_COMMISSIONER',
  'ADDL_COMMISSIONER',
  'COMMISSIONER',
  'SYSTEMS_ADMIN',
  'AUDITOR',
  'ANALYTICS',
] as const

export type Role = (typeof ROLES)[number]
export type Surface = 'dashboard' | 'workbench'

export const ROLE_LABEL: Record<Role, string> = {
  INSPECTOR: 'Inspector',
  STO: 'State Tax Officer',
  ASST_COMMISSIONER: 'Assistant Commissioner',
  JOINT_COMMISSIONER: 'Deputy / Joint Commissioner',
  ADDL_COMMISSIONER: 'Addl. Commissioner (Enforcement)',
  COMMISSIONER: 'Commissioner',
  SYSTEMS_ADMIN: 'Systems Administrator',
  AUDITOR: 'Auditor (read-only)',
  ANALYTICS: 'Analytics (de-identified)',
}

/**
 * Where a role lands at login.
 *
 * docs/03 section 0 is authoritative on the Assistant Commissioner: the
 * Workbench column names "STO, Asst. Commissioner, auditor", so an AC lands on
 * the case workbench.  Section 2's "DC/JC/AC and above" reads AC as *Addl.*
 * Commissioner.  Resolved in docs/DECISIONS.md D-0004.
 *
 * The role decides which surface you land on, not what you are allowed to
 * understand: every user can navigate to either surface.
 */
const LANDING: Record<Role, Surface> = {
  INSPECTOR: 'workbench',
  STO: 'workbench',
  ASST_COMMISSIONER: 'workbench',
  AUDITOR: 'workbench',
  JOINT_COMMISSIONER: 'dashboard',
  ADDL_COMMISSIONER: 'dashboard',
  COMMISSIONER: 'dashboard',
  SYSTEMS_ADMIN: 'dashboard',
  ANALYTICS: 'dashboard',
}

export function landingSurface(role: Role): Surface {
  return LANDING[role]
}

export function landingPath(role: Role): string {
  return landingSurface(role) === 'dashboard' ? '/dashboard' : '/workbench'
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value)
}
