/**
 * Short forms for axes and chips, where a full figure will not fit.
 *
 * An axis tick is not a figure an officer reads off - it is a ruler. The exact
 * number always lives beside the chart, in a `<Money>` that carries its
 * provenance. So a tick may be abbreviated where a figure may never be.
 *
 * **Why this exists at all.** With full grouping, the twelve ticks on a crore-
 * scale axis measured 64 pixels of *overlap* between neighbours - they were
 * drawn on top of each other and read as one smear of digits. `₹4.2 Cr` is
 * six characters where `4,19,18,644.44` is fourteen.
 *
 * Indian units, because the reader is: thousand, lakh, crore. `12,93,25,891`
 * is twelve crore, and a reader who has to count digit groups to discover
 * that has stopped reading.
 */

const CRORE = 10_000_000
const LAKH = 100_000
const THOUSAND = 1_000

/**
 * A magnitude for an axis tick. Never for a figure in prose or a table.
 *
 * Takes a number because an axis scale is already a number - this is the only
 * kind of value that legitimately is one. Rupee *figures* stay strings from
 * the server all the way to `<Money>`.
 */
export function shortRupees(value: number): string {
  const sign = value < 0 ? '-' : ''
  const size = Math.abs(value)
  if (size === 0) return '0'
  if (size >= CRORE) return `${sign}${trim(size / CRORE)} Cr`
  if (size >= LAKH) return `${sign}${trim(size / LAKH)} L`
  if (size >= THOUSAND) return `${sign}${trim(size / THOUSAND)} K`
  return `${sign}${String(Math.round(size))}`
}

/** One decimal place, and none when it would be `.0`. */
function trim(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/**
 * A GSTIN shortened so twenty of them fit down one axis without colliding.
 *
 * `27ABQCS3690E1ZW` becomes `27 · QCS3690E`: the State code, which tells an
 * officer something, and the distinguishing middle, which is what they scan
 * for. The full GSTIN is always in the row beside it and in the tooltip -
 * this is a handle, not an identifier.
 */
export function shortGstin(gstin: string): string {
  if (gstin.length < 15) return gstin
  return `${gstin.slice(0, 2)} · ${gstin.slice(4, 12)}`
}

/** A label short enough for an axis, whatever it started as. */
export function axisLabel(label: string): string {
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]/.test(label)) return shortGstin(label)
  if (label.length <= 18) return label
  return `${label.slice(0, 17)}…`
}
