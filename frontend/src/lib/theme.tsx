import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'

/**
 * Theme selection -- docs/03 section 1.
 *
 * Dark mode is selected, not auto-inverted.  `system` removes the attribute so
 * the media query in tokens.css applies; `light` and `dark` set the attribute,
 * which outranks the media query because that rule is guarded with :where().
 * The user's toggle therefore beats the OS setting in both directions.
 */
export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

const STORAGE_KEY = 'drishti.theme'

interface ThemeValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function readStored(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null && (THEMES as readonly string[]).includes(stored)) return stored as Theme
  } catch {
    // Blocked site data: the default is still correct.
  }
  return 'system'
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(readStored)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not persisting a preference is survivable; losing it silently is not a
      // correctness problem, only an inconvenience.
    }
  }, [])

  const value = useMemo<ThemeValue>(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (value === null) throw new Error('useTheme must be used inside a ThemeProvider')
  return value
}
