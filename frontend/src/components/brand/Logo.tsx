import type { JSX } from 'react'
import { Landmark } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * The departmental mark — one definition.
 *
 * Ported from Fin100XAI/maha-gst-intelligance, where the note beside it is
 * worth keeping: the mark had previously existed as four hand-copied
 * gradients, and four copies is four chances to recolour three of them and
 * miss one. It exists once here for the same reason.
 *
 * Gold on the civic blue is the institutional pairing, and it matches the
 * gold rule under the masthead so the two read as one system.
 *
 *   ground : govtgold-300 → govtgold-600   #d6ba5f → #c2a01e
 *   icon   : rail-900                      #070d1c
 */
const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-4 w-4' },
  md: { box: 'h-9 w-9 rounded-lg', icon: 'h-5 w-5' },
  lg: { box: 'h-10 w-10 rounded-lg', icon: 'h-5 w-5' },
  xl: { box: 'h-11 w-11 rounded-2xl', icon: 'h-6 w-6' },
} as const

export type LogoSize = keyof typeof SIZES

export function Logo({
  size = 'md',
  className,
}: {
  size?: LogoSize
  className?: string
}): JSX.Element {
  const s = SIZES[size]
  return (
    <div
      aria-hidden="true"
      className={cn(
        s.box,
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-govtgold-300 to-govtgold-600',
        className,
      )}
    >
      <Landmark className={cn(s.icon, 'text-rail-900')} />
    </div>
  )
}
