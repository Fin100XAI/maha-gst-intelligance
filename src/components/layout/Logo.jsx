import { Landmark } from 'lucide-react'

/* ---------------------------------------------------------------------------
 * The departmental mark — ONE definition.
 *
 * It previously existed as four copies (masthead, landing top bar, sign-in,
 * mobile sidebar), each repeating the gradient and icon classes by hand. Four
 * copies is four chances to recolour three of them and miss one.
 *
 * Gold on the civic blue is the institutional pairing, and matches the gold
 * rule beneath the masthead so the two read as one system. The favicon in
 * index.html is drawn from the same geometry — the lucide `Landmark` path at
 * a 24-unit grid — and the same two colours, so the browser tab and the header
 * show the same mark rather than two that merely resemble each other.
 *
 * Keep this file and the favicon in index.html in step.
 *   ground : gold-300 -> gold-600   #d6ba5f -> #c2a01e
 *   icon   : rail-900               #070d1c
 * ------------------------------------------------------------------------- */

const SIZES = {
  sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4.5 h-4.5' },
  md: { box: 'w-9 h-9 rounded-lg', icon: 'w-5 h-5' },
  lg: { box: 'w-10 h-10 rounded-lg', icon: 'w-5 h-5' },
  xl: { box: 'w-11 h-11 rounded-2xl', icon: 'w-6 h-6' }
}

export function Logo({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md
  return (
    <div
      className={`${s.box} bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shrink-0 ${className}`}
      aria-hidden
    >
      <Landmark className={`${s.icon} text-rail-900`} />
    </div>
  )
}
