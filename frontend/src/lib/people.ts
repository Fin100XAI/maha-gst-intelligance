import type { Role } from './rbac'

/**
 * Who you are signed in as, for the demonstration build.
 *
 * There is no identity provider yet - the State SSO arrives with OIDC - so the
 * shell lets you pick a person. It used to offer a list of nine role names,
 * which asked the reader to already know what an "Addl. Commissioner
 * (Enforcement)" may do that a "Deputy / Joint Commissioner" may not. Three
 * named people is a question anyone can answer.
 *
 * The three are chosen to cover the whole platform between them. Every screen
 * is reachable by all three; what differs is which *actions* each may take,
 * and that difference is real. GST enforcement is built on maker and checker
 * being different people: the officer who drafts a notice may not approve it,
 * and no amount of convenience should make that go away. So rather than
 * hiding an action a person cannot take, the screens show it, say who can, and
 * offer to switch.
 *
 * These are fictional officers in a demonstration dataset. Nothing here is a
 * security control: authorisation is enforced on the server at the query
 * layer, and an out-of-scope GSTIN comes back 404 whatever this file says.
 */
export interface Person {
  /** Sent as `X-Officer-Id`, and recorded in the audit chain. */
  readonly id: string
  readonly name: string
  /** The job, in words a reader outside the department would follow. */
  readonly designation: string
  readonly role: Role
  /** Divisions in scope. Empty means the whole State. */
  readonly divisions: readonly string[]
  /** What this person is here to do, in one line. */
  readonly does: string
  readonly can: {
    readonly draftNotice: boolean
    readonly approveNotice: boolean
    readonly setThresholds: boolean
    readonly seeWholeState: boolean
  }
}

export const PEOPLE: readonly Person[] = [
  {
    id: 'a.patil',
    name: 'A. Patil',
    designation: 'Tax Officer, Pune',
    role: 'STO',
    divisions: ['Pune-I', 'Pune-II'],
    does: 'Works the cases: reads the findings, opens a case, drafts the notice.',
    can: {
      draftNotice: true,
      approveNotice: false,
      setThresholds: false,
      seeWholeState: false,
    },
  },
  {
    id: 's.kulkarni',
    name: 'S. Kulkarni',
    designation: 'Deputy Commissioner, Pune',
    role: 'JOINT_COMMISSIONER',
    divisions: ['Pune-I', 'Pune-II', 'Nashik', 'Kolhapur', 'Nagpur', 'Aurangabad', 'Jalgaon'],
    does: 'Supervises: approves notices drafted by the officers, and watches the division.',
    can: {
      draftNotice: true,
      approveNotice: true,
      setThresholds: false,
      seeWholeState: false,
    },
  },
  {
    id: 'commissioner.mh',
    name: 'R. Deshpande',
    designation: 'Commissioner, Maharashtra',
    role: 'COMMISSIONER',
    divisions: [],
    does: 'Sees the whole State, approves, and decides the numbers the rules run on.',
    can: {
      draftNotice: false,
      approveNotice: true,
      setThresholds: true,
      seeWholeState: true,
    },
  },
]

export const DEFAULT_PERSON: Person = PEOPLE[0] as Person

export function personById(id: string): Person | null {
  return PEOPLE.find((person) => person.id === id) ?? null
}

/** The person who can do the thing this one cannot - for the "switch" prompt. */
export function whoCan(capability: keyof Person['can'], not: Person): Person | null {
  return PEOPLE.find((person) => person.can[capability] && person.id !== not.id) ?? null
}

/** Plain names for the capabilities, for a sentence like "only X can Y". */
export const CAPABILITY_LABEL: Record<keyof Person['can'], string> = {
  draftNotice: 'draft a notice',
  approveNotice: 'approve a notice',
  setThresholds: 'change the thresholds the rules run on',
  seeWholeState: 'see the whole State',
}
