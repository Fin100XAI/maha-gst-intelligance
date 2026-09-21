import clsx from 'clsx'
import type { JSX } from 'react'

/**
 * Status is never carried by hue alone -- docs/03 section 1.
 *
 * `warning` and `serious` sit below 3:1 on the light surface by design, so
 * every status mark ships with an icon **and** a label.  A Commissioner should
 * not have to squint at a shade to know whether something is serious, and a
 * colour-blind officer must read the same meaning as everyone else.
 */
export type StatusLevel = 'good' | 'warning' | 'serious' | 'critical' | 'unknown'

const GLYPH: Record<StatusLevel, string> = {
  good: '●', // filled circle
  warning: '▲', // triangle
  serious: '◆', // diamond
  critical: '■', // square
  unknown: '○', // hollow circle -- never reads as "good"
}

const TINT: Record<StatusLevel, string> = {
  good: 'text-status-good border-status-good',
  warning: 'text-status-warning border-status-warning',
  serious: 'text-status-serious border-status-serious',
  critical: 'text-status-critical border-status-critical',
  unknown: 'text-status-unknown border-status-unknown',
}

/** Flag 0-4 maps onto the reserved status palette; null is NOT_EVALUATED. */
export function levelForFlag(flag: number | null): StatusLevel {
  if (flag === null) return 'unknown'
  if (flag === 0) return 'good'
  if (flag <= 2) return 'warning'
  if (flag === 3) return 'serious'
  return 'critical'
}

export function StatusChip({
  level,
  label,
  title,
  className,
}: {
  level: StatusLevel
  label: string
  title?: string | undefined
  className?: string | undefined
}): JSX.Element {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium',
        TINT[level],
        className,
      )}
      {...(title === undefined ? {} : { title })}
    >
      <span aria-hidden="true">{GLYPH[level]}</span>
      <span>{label}</span>
    </span>
  )
}
