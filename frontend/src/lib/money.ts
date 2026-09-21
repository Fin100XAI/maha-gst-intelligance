/**
 * Money on the client.
 *
 * Every monetary value crosses the API as a **string** and stays a string here.
 * `Number` is never used on a rupee value: JavaScript's number type is the same
 * binary float that Law 1 forbids on the server, and a demand that is off by a
 * paisa is a demand competent counsel uses to attack the whole order.
 *
 * Arithmetic is deliberately absent.  The client does not add up rupees -- if a
 * total is needed, the server computes it and attaches a `calc_id` to it.  That
 * is not a limitation, it is the point: a figure without provenance is a bug.
 */

/** A head-wise amount exactly as the API sends it. */
export interface TaxVectorWire {
  readonly igst: string
  readonly cgst: string
  readonly sgst: string
  readonly cess: string
}

export const HEADS = ['igst', 'cgst', 'sgst', 'cess'] as const
export type Head = (typeof HEADS)[number]

const AMOUNT = /^-?\d+(\.\d+)?$/

export class MoneyFormatError extends Error {
  constructor(readonly raw: string) {
    super(`not a wire money value: ${JSON.stringify(raw)}`)
    this.name = 'MoneyFormatError'
  }
}

/**
 * An immutable rupee amount, carried as the decimal string the server sent.
 */
export class Money {
  private constructor(private readonly value: string) {}

  static of(raw: string): Money {
    if (!AMOUNT.test(raw)) throw new MoneyFormatError(raw)
    return new Money(raw)
  }

  /** Parse without throwing, for a field that is legitimately absent. */
  static maybe(raw: string | null | undefined): Money | null {
    if (raw === null || raw === undefined || raw === '') return null
    return AMOUNT.test(raw) ? new Money(raw) : null
  }

  get isNegative(): boolean {
    return this.value.startsWith('-')
  }

  get isZero(): boolean {
    return /^-?0(\.0+)?$/.test(this.value)
  }

  /** The untouched wire string, for round-tripping back to the API. */
  toWire(): string {
    return this.value
  }

  /** Indian numbering: 12,34,567.89 */
  format(options: { symbol?: boolean; paise?: boolean } = {}): string {
    const { symbol = true, paise = true } = options
    const negative = this.isNegative
    const digits = negative ? this.value.slice(1) : this.value
    const [wholeRaw = '0', fracRaw = ''] = digits.split('.')

    let whole = wholeRaw
    if (whole.length > 3) {
      const tail = whole.slice(-3)
      let head = whole.slice(0, -3)
      const groups: string[] = []
      while (head.length > 2) {
        groups.unshift(head.slice(-2))
        head = head.slice(0, -2)
      }
      if (head.length > 0) groups.unshift(head)
      whole = [...groups, tail].join(',')
    }

    const frac = paise ? `.${(fracRaw + '00').slice(0, 2)}` : ''
    const body = symbol ? `₹ ${whole}${frac}` : `${whole}${frac}`
    return negative ? `-${body}` : body
  }

  toString(): string {
    return this.format()
  }
}

/** The four heads of a wire vector, ready to render. */
export function heads(vector: TaxVectorWire): ReadonlyArray<readonly [Head, Money]> {
  return HEADS.map((head) => [head, Money.of(vector[head])] as const)
}

/** Only the heads that carry an amount -- what the head-wise split shows. */
export function nonZeroHeads(vector: TaxVectorWire): ReadonlyArray<readonly [Head, Money]> {
  return heads(vector).filter(([, amount]) => !amount.isZero)
}

export const HEAD_LABEL: Record<Head, string> = {
  igst: 'IGST',
  cgst: 'CGST',
  sgst: 'SGST',
  cess: 'Cess',
}
