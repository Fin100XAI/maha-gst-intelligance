import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * `cn` — the shadcn/ui class helper.
 *
 * `clsx` resolves conditionals; `tailwind-merge` then drops the earlier of any
 * two classes that set the same property, so a caller's `p-6` beats a
 * component's default `p-4` instead of both landing in the class list and the
 * winner being decided by stylesheet order.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
