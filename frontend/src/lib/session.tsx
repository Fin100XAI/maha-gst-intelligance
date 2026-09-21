import { create } from 'zustand'
import { DEFAULT_PERSON, PEOPLE, personById } from './people'
import type { Person } from './people'
import type { Role } from './rbac'

/**
 * Who is signed in, for the shell.
 *
 * There is no authentication yet: OIDC against the State SSO arrives with
 * Phase 6, and authorisation is enforced at the query layer on the server
 * whatever this store says. The picker exists so the platform can be reviewed
 * now; it grants nothing.
 *
 * The API client reads these three keys straight out of `localStorage`, so
 * they are written there rather than held only in memory.
 */
const KEY_OFFICER = 'drishti.officer'
const KEY_ROLE = 'drishti.role'
const KEY_DIVISIONS = 'drishti.divisions'

interface SessionState {
  person: Person
  people: readonly Person[]
  /** The signed-in person's role. Kept for the screens that branch on it. */
  role: Role
  setPerson: (id: string) => void
}

function persist(person: Person): void {
  try {
    window.localStorage.setItem(KEY_OFFICER, person.id)
    window.localStorage.setItem(KEY_ROLE, person.role)
    window.localStorage.setItem(KEY_DIVISIONS, person.divisions.join(','))
  } catch {
    // Blocked site data. The selection simply will not survive a reload.
  }
}

function readStored(): Person {
  try {
    const stored = window.localStorage.getItem(KEY_OFFICER)
    const found = stored === null ? null : personById(stored)
    if (found !== null) return found
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_PERSON
}

const initial = readStored()
persist(initial)

export const useSession = create<SessionState>((set) => ({
  person: initial,
  people: PEOPLE,
  role: initial.role,
  setPerson: (id: string) => {
    const person = personById(id)
    if (person === null) return
    persist(person)
    set({ person, role: person.role })
  },
}))
