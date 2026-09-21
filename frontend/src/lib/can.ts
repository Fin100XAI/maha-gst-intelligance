import { useSession } from './session'
import type { Person } from './people'

/**
 * Whether the signed-in person may do this.
 *
 * For disabling a control rather than removing it: see `NeedsRole`, which
 * says who can instead. Nothing here is a security control - the server
 * decides, and refuses whatever the shell allows.
 */
export function useCan(capability: keyof Person['can']): boolean {
  return useSession((state) => state.person.can[capability])
}
