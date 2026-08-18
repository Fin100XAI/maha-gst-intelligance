/* ---------------------------------------------------------------------------
 * THE LANGUAGE SEAM
 *
 * The platform is bilingual: English and Marathi, the official language of
 * Maharashtra. Every word an officer can read — navigation, headings, table
 * columns, KPI labels, filter options, empty states — passes through `t()`
 * in this module.
 *
 * Two decisions here are load-bearing (ported from the same pattern used in
 * the BMC Intelligence sister project):
 *
 *   1. MESSAGES ARE KEYED BY THEIR ENGLISH SOURCE, not an invented key.
 *      `t('District')` reads as what it renders, and a missing translation
 *      degrades to correct English rather than a raw key on screen.
 *
 *   2. IN ENGLISH, `t()` IS THE IDENTITY FUNCTION. The English platform is
 *      never touched by translation work.
 *
 * `t` is a plain module function rather than a hook so it can be called from
 * data-derivation code, not only JSX. React re-renders on locale change via
 * `locale`/`setLocale` held in AppContext, which call `setActiveLocale` below
 * and then update a piece of real React state.
 * ------------------------------------------------------------------------- */

export const LOCALES = ['en', 'mr']

export const LOCALE_INFO = {
  en: { id: 'en', nativeName: 'English', englishName: 'English', htmlLang: 'en-IN', abbreviation: 'ENG' },
  mr: { id: 'mr', nativeName: 'मराठी', englishName: 'Marathi', htmlLang: 'mr-IN', abbreviation: 'मरा' }
}

export const DEFAULT_LOCALE = 'en'
export const LOCALE_STORAGE_KEY = 'maha-gst.locale'

function isLocale(value) {
  return value === 'en' || value === 'mr'
}

function readInitialLocale() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_LOCALE
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(raw) ? raw : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

let activeLocale = readInitialLocale()

export function getLocale() {
  return activeLocale
}

export function getLocaleInfo() {
  return LOCALE_INFO[activeLocale]
}

export function isTranslated() {
  return activeLocale !== 'en'
}

/** Low-level seam — changes what `t()` returns. Persists the choice. */
export function setActiveLocale(locale) {
  activeLocale = locale
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage unavailable — locale still switches for this session.
  }
}

/* ---------------------------------------------------------------------------
 * Message catalogue
 * ------------------------------------------------------------------------- */

const catalogues = { en: new Map(), mr: new Map() }

/** Registers a block of translations. Later registrations win. */
export function registerMessages(locale, entries) {
  const target = catalogues[locale]
  for (const key of Object.keys(entries)) {
    const value = entries[key]
    if (typeof value === 'string' && value.length > 0) target.set(key, value)
  }
}

export function catalogueSize(locale) {
  return catalogues[locale].size
}

export function hasMessage(locale, message) {
  return catalogues[locale].has(message)
}

/* ---------------------------------------------------------------------------
 * Untranslated-string reporting — surfaced in AI Governance & Security so
 * translation gaps are visible rather than silently discovered on screen.
 * ------------------------------------------------------------------------- */

const MISS_LIMIT = 4000
const misses = new Map()

function recordMiss(message) {
  if (misses.size >= MISS_LIMIT && !misses.has(message)) return
  misses.set(message, (misses.get(message) || 0) + 1)
}

export function untranslatedMessages() {
  return [...misses.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count || a.message.localeCompare(b.message))
}

export function clearUntranslatedMessages() {
  misses.clear()
}

/* ---------------------------------------------------------------------------
 * Composition fallback — registered by ./compose.js
 * ------------------------------------------------------------------------- */

let composer = null

export function registerComposer(fn) {
  composer = fn
}

/* ---------------------------------------------------------------------------
 * Interpolation
 * ------------------------------------------------------------------------- */

const PLACEHOLDER = /\{(\d+)\}/g

function interpolate(template, args) {
  if (args.length === 0) return template
  return template.replace(PLACEHOLDER, (match, index) => {
    const position = Number(index)
    if (position >= args.length) return match
    const value = args[position]
    return value === undefined || value === null ? '' : String(value)
  })
}

/* ---------------------------------------------------------------------------
 * t()
 *
 * Resolution order: exact catalogue entry, then term-by-term composition,
 * then the English source unchanged — accurate English beats confident
 * Marathi nonsense.
 * ------------------------------------------------------------------------- */

export function t(message, ...args) {
  if (activeLocale === 'en') return interpolate(message, args)
  if (typeof message !== 'string' || message.length === 0) return message

  const exact = catalogues[activeLocale].get(message)
  if (exact !== undefined) return interpolate(exact, args)

  const trimmed = message.trim()
  if (trimmed !== message) {
    const inner = catalogues[activeLocale].get(trimmed)
    if (inner !== undefined) {
      const lead = message.slice(0, message.indexOf(trimmed[0] || ''))
      const tail = message.slice(lead.length + trimmed.length)
      return interpolate(lead + inner + tail, args)
    }
  }

  const composed = composer ? composer(message, activeLocale) : null
  if (composed !== null) return interpolate(composed, args)

  recordMiss(message)
  return interpolate(message, args)
}

/** Count-sensitive translation — a chooser, not a full plural-rule engine. */
export function tn(count, one, other) {
  return t(count === 1 ? one : other, count)
}

/** Joins a list into a readable series: "A, B and C" / "A, B आणि C". */
export function tList(items) {
  const parts = items.filter(item => item.length > 0)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts.slice(0, -1).join(', ')} ${t('and')} ${last}`
}
