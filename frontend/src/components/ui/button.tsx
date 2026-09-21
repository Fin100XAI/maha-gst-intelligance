import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'
import type { VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/**
 * Button — shadcn/ui, on this platform's tokens.
 *
 * Note what is missing: there is no `destructive` variant in the reserved
 * status red. Status colour carries a Flag level, a risk band or a finding
 * severity and nothing else, so a red button would put a fifth meaning on a
 * hue that already has four (docs/03 section 1). An irreversible action is
 * marked by its words and its confirmation step, not by its colour.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium ' +
    'transition-all duration-[--motion] ease-out disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:
          'border border-line bg-raised text-ink shadow-sm hover:border-line-strong hover:shadow',
        primary:
          'border border-navy/20 bg-navy text-white shadow hover:shadow-lg ' +
          'dark:border-gold/30 dark:bg-gold/15 dark:text-gold-soft',
        ghost: 'text-ink-secondary hover:bg-sunken hover:text-ink',
        link: 'text-ink underline decoration-dotted underline-offset-2 hover:decoration-solid',
      },
      size: {
        sm: 'h-7 px-2 text-xs',
        default: 'h-8 px-3 text-sm',
        lg: 'h-10 px-4 text-base',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element, for a link that should look like a button. */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      ref={ref}
      // An unset `type` inside a form submits it, which is never what a
      // control on these screens means.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

