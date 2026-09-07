import { t } from './index.js'

/**
 * Renders one comparability reason from the similarity engine.
 *
 * The engine returns a {0} template and its arguments rather than a finished
 * sentence, because a sentence assembled in the data layer can never match a
 * catalogue key — it would reach an officer in English on a Marathi or Hindi
 * screen, and no static check would see it.
 *
 * An argument that is itself an array is a list of closed-vocabulary values
 * (the risk rules that fired). Each is translated on its own and the list is
 * joined here, so the separator is the one the language uses rather than one
 * baked into the data.
 */
export function similarityText(part) {
  return t(part.text, ...translateArgs(part.textArgs))
}

/**
 * Translates the arguments of a {0} template.
 *
 * An argument is often itself a catalogue value — a department position, an
 * officer role, a case stage — and interpolating it raw leaves an English
 * fragment inside an otherwise translated sentence. t() returns anything it
 * does not hold unchanged, so names, GSTINs and numbers pass through untouched.
 * An argument that is an array is a list of such values, joined here so the
 * separator belongs to the language rather than to the data.
 */
export function translateArgs(args) {
  return (args || []).map(a => {
    if (Array.isArray(a)) return a.map(v => t(v)).join(t('; '))
    return typeof a === 'string' ? t(a) : a
  })
}
