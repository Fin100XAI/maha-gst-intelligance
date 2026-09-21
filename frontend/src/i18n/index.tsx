import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { LANGUAGES, STRINGS } from './strings'
import type { Language, StringKey } from './strings'

const STORAGE_KEY = 'drishti.language'

interface I18nValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: StringKey, vars?: Record<string, string>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function readStored(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored !== null && (LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language
    }
  } catch {
    // Private browsing or blocked site data: fall through to the default.
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguageState] = useState<Language>(readStored)

  useEffect(() => {
    // Drives the Devanagari font stack declared in tokens.css.
    document.documentElement.setAttribute('lang', language)
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // A preference we cannot persist is still a preference for this session.
    }
  }, [])

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string>): string => {
      const template = STRINGS[language][key]
      if (vars === undefined) return template
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, value),
        template,
      )
    },
    [language],
  )

  const value = useMemo<I18nValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (value === null) throw new Error('useI18n must be used inside an I18nProvider')
  return value
}

export type { Language, StringKey }
