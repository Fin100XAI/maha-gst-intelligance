import { forwardRef } from 'react'
import type { HTMLAttributes, JSX } from 'react'
import { cn } from '../../lib/utils'

/**
 * Card — shadcn/ui, bound to this platform's tokens.
 *
 * shadcn/ui is copy-in rather than a dependency, which is why it suits this
 * codebase: the components live here and read `--surface-chart`, `--border`
 * and the rest, so `tokens.css` stays the single source of colour truth
 * (docs/03 section 1) instead of a second palette arriving with a library.
 *
 * `interactive` adds the 1px lift. It is 1px on purpose: enough to feel under
 * the pointer, not enough to shift a row of figures while somebody is reading
 * down a column.
 */
export const Card = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { interactive?: boolean; flush?: boolean }
>(function Card({ className, interactive = false, flush = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'panel',
        interactive && 'panel-interactive',
        !flush && 'p-4',
        className,
      )}
      {...props}
    />
  )
})

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-3 pb-3', className)}
        {...props}
      />
    )
  },
)

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn('font-display text-base font-semibold leading-tight', className)}
        {...props}
      />
    )
  },
)

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('mt-0.5 text-sm text-ink-secondary', className)} {...props} />
})

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn(className)} {...props} />
  },
)

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('mt-3 border-t border-line pt-2 text-xs text-ink-muted', className)}
        {...props}
      />
    )
  },
)

/**
 * The eyebrow above a card title: small, letter-spaced, mono.
 *
 * It carries the screen or metric reference — D1, M-K05 — which matters for
 * traceability and is exactly the thing that should not be the first words a
 * reader meets.
 */
export function CardEyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>): JSX.Element {
  return <span className={cn('eyebrow block', className)} {...props} />
}
