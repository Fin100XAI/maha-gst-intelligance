/* The four Google brand hues, in the order they are cycled through. Each entry
 * is variable-backed rather than literal hex so a theme flip recolours every
 * card on the next paint with no re-render — the same reason KpiCard's tones
 * are written this way. */
export const CARD_TONES = {
  blue: { rail: 'var(--card-blue-rail)', ink: 'var(--card-blue-ink)', wash: 'var(--card-blue-wash)' },
  red: { rail: 'var(--card-red-rail)', ink: 'var(--card-red-ink)', wash: 'var(--card-red-wash)' },
  yellow: { rail: 'var(--card-yellow-rail)', ink: 'var(--card-yellow-ink)', wash: 'var(--card-yellow-wash)' },
  green: { rail: 'var(--card-green-rail)', ink: 'var(--card-green-ink)', wash: 'var(--card-green-wash)' }
}
const TONE_ORDER = ['blue', 'red', 'yellow', 'green']

/* The fallback for a card whose call site names no tone. Every Card in the
 * platform names one — they are assigned in source order so the cycle runs
 * blue, red, yellow, green down each screen and no two neighbours match — so
 * this only catches a newly added card someone forgot to tone.
 *
 * It hashes the title rather than counting, because a counter incremented
 * during render is not stable: cards mount conditionally, and the colour would
 * shift on every state change. Hashing the title does mean a language switch
 * can move a fallback card's hue, which is one more reason to pass `tone`
 * explicitly rather than lean on this. */
function toneFromTitle(title) {
  const s = typeof title === 'string' ? title : ''
  if (!s) return 'blue'
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return TONE_ORDER[h % TONE_ORDER.length]
}

/* `tone` names one of the four explicitly; `plain` opts a card out entirely,
 * for the few places where a coloured rail would compete with the content it
 * sits above. */
export function Card({ title, subtitle, actions, className = '', children, padded = true, tone, plain = false }) {
  const key = plain ? null : (tone && CARD_TONES[tone] ? tone : toneFromTitle(title))
  const c = key ? CARD_TONES[key] : null

  return (
    <div className={`bg-white rounded-xl border border-steel-200 shadow-card overflow-hidden ${className}`}>
      {c && <div className="h-[3px] w-full" style={{ backgroundColor: c.rail }} aria-hidden />}
      {(title || actions) && (
        <div
          className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-steel-100"
          style={c ? { backgroundColor: c.wash } : undefined}
        >
          <div>
            {title && <h3 className="text-sm font-semibold" style={c ? { color: c.ink } : undefined}>{title}</h3>}
            {/* A div for the same reason as the header description below: the
                subtitle is often a <MethodNote>, and a block inside a <p> is
                invalid markup. */}
            {subtitle && <div className="text-xs text-steel-500 mt-0.5">{subtitle}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  )
}

// The per-module provenance block — an "Illustrative data" badge, the as-of
// date, and an optional longer `note` — used to sit here and therefore appeared
// on all 17 module headers. Removed: repeated on every screen it was visual
// noise directly under the filter bar, and it pushed the actual content of each
// module below the fold.
//
// Provenance is NOT lost. The masthead carries "Demonstration Environment ·
// Simulated data" alongside the as-of date on every screen, permanently; AI
// outputs still carry their own limitation notes; and exported briefings still
// append their provenance line. This removed the repetition, not the disclosure.
export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5 bg-white rounded-xl border border-steel-200 shadow-card px-5 py-4">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-wider text-saffron-600 mb-1">{eyebrow}</div>}
        <h1 className="text-xl font-bold text-navy-900">{title}</h1>
        {/* A div, not a p: the description is often a <MethodNote>, which puts
            the one-line summary and the reasoning behind it in the same slot,
            and a block element inside a <p> is invalid markup. */}
        {description && <div className="text-sm text-steel-500 mt-1 max-w-3xl">{description}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
