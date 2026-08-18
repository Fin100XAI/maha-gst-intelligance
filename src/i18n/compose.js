import { registerComposer } from './locale.js'
import { MR_LEXICON, MR_LEXICON_MAX_WORDS } from './mr/lexicon.js'

/* ---------------------------------------------------------------------------
 * COMPOSITIONAL FALLBACK
 *
 * The catalogue files in `src/i18n/mr/` carry a hand-written Marathi reading
 * of every message authored in the source. This module covers text ASSEMBLED
 * AT RUNTIME — a taxpayer name spliced into an alert title, a district
 * stitched onto a KPI label — where no catalogue entry can exist because the
 * string didn't exist until it was built.
 *
 * It works term by term against the shared lexicon, longest phrase first, and
 * is deliberately CONSERVATIVE: unless it recognises most of the words in a
 * message it returns nothing and the officer is shown accurate English. A
 * screen that mixes languages honestly is recoverable; one that states
 * something confidently wrong in Marathi is not.
 *
 * Proper nouns (taxpayer trade names, GSTINs, officer names) are left in
 * their source script on purpose — they are looked up from translated
 * registers where one exists, never composed.
 * ------------------------------------------------------------------------- */

const CONFIDENCE_FLOOR = 0.55

const PASSTHROUGH = /^[\s\d.,;:!?%₹()[\]{}<>/\\|"'`~@#$^&*_+=-]+$/

const UNITS = new Set([
  'cr', 'l', 'k', 'm', 'b', 'kg', 'km', 'pp', 'sqm', 'sqft', 'gis', 'api', 'ai', 'ml', 'sla',
  'id', 'gb', 'tb', 'ms', 'utc', 'ist', 'inr', 'usd', 'no', 'na', 'nil', 'gst', 'gstin', 'itc',
  'pan', 'tin', 'cst', 'vat', 'pt', 'ptrc', 'ptec', 'tds', 'tcs', 'irn', 'gstr', 'hsn', 'drc'
])

const SHAPES = [
  // "Cases by district" -> "जिल्ह्यानुसार प्रकरणे"
  { pattern: /^(.+?) by (.+)$/i, build: ([a, b]) => `${b}नुसार ${a}` },
  // "Revenue per district" -> "प्रति जिल्हा महसूल"
  { pattern: /^(.+?) per (.+)$/i, build: ([a, b]) => `प्रति ${b} ${a}` },
  // "Head of department" -> "विभाग प्रमुख"
  { pattern: /^(.+?) of (.+)$/i, build: ([a, b]) => `${b} ${a}` }
]

function tokenise(input) {
  return input.split(/([A-Za-zऀ-ॿ]+(?:['’][A-Za-z]+)?)/).filter(part => part.length > 0)
}

function lookup(phrase) {
  return MR_LEXICON[phrase.toLowerCase()]
}

function substitute(input) {
  const tokens = tokenise(input)
  const out = []
  let words = 0
  let resolved = 0

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]

    if (PASSTHROUGH.test(token)) {
      out.push(token)
      continue
    }

    let matched = false
    for (let span = MR_LEXICON_MAX_WORDS; span >= 1 && !matched; span -= 1) {
      const slice = []
      let cursor = i
      let taken = 0
      while (taken < span && cursor < tokens.length) {
        const piece = tokens[cursor]
        if (/^[A-Za-zऀ-ॿ]/.test(piece)) {
          slice.push(piece)
          taken += 1
          cursor += 1
        } else if (piece === ' ' && taken > 0 && taken < span) {
          slice.push(piece)
          cursor += 1
        } else break
      }
      if (taken !== span) continue

      const phrase = slice.join('')
      const hit = lookup(phrase)
      if (hit !== undefined) {
        out.push(hit)
        words += span
        resolved += span
        i = cursor - 1
        matched = true
      }
    }
    if (matched) continue

    words += 1
    const direct = lookup(token)
    if (direct !== undefined) {
      out.push(direct)
      resolved += 1
      continue
    }

    const bare = token.replace(/['’]s$/i, '')
    const singular =
      lookup(bare) ??
      (bare.length > 3 && /ies$/i.test(bare) ? lookup(`${bare.slice(0, -3)}y`) : undefined) ??
      (bare.length > 3 && /(ses|xes|zes|ches|shes)$/i.test(bare) ? lookup(bare.slice(0, -2)) : undefined) ??
      (bare.length > 3 && /s$/i.test(bare) ? lookup(bare.slice(0, -1)) : undefined)
    if (singular !== undefined) {
      out.push(singular)
      resolved += 1
      continue
    }

    if (UNITS.has(token.toLowerCase())) {
      out.push(token)
      resolved += 1
      continue
    }

    out.push(token)
  }

  return { text: out.join(''), words, resolved }
}

function compose(message, locale) {
  if (locale !== 'mr') return null
  if (!/[A-Za-z]/.test(message)) return null
  if (/[ऀ-ॿ]/.test(message) && !/[A-Za-z]{3}/.test(message)) return null

  for (const shape of SHAPES) {
    const match = shape.pattern.exec(message)
    if (!match) continue
    const left = substitute(match[1])
    const right = substitute(match[2])
    const words = left.words + right.words
    const resolved = left.resolved + right.resolved
    if (words > 0 && resolved / words >= CONFIDENCE_FLOOR) {
      return shape.build([left.text.trim(), right.text.trim()])
    }
  }

  const attempt = substitute(message)
  if (attempt.words === 0) return null
  if (attempt.resolved / attempt.words < CONFIDENCE_FLOOR) return null
  return attempt.text
}

registerComposer(compose)

/** Exposed for the AI Governance untranslated-strings panel. */
export function composeForAudit(message) {
  return substitute(message)
}
