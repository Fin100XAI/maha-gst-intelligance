import { describe, expect, it } from 'vitest'
import { HEADS, Money, MoneyFormatError, nonZeroHeads } from './money'

describe('Money is a string, never a JavaScript number', () => {
  it('keeps the exact wire value', () => {
    expect(Money.of('1234567.89').toWire()).toBe('1234567.89')
    // The float trap the server-side Decimal exists to avoid; the client must
    // not reintroduce it by parsing on the way in.
    expect(Money.of('0.1').toWire()).toBe('0.1')
    expect(Money.of('38421100.00').toWire()).toBe('38421100.00')
  })

  it('refuses anything that is not a decimal literal', () => {
    for (const bad of ['', '1,234', '₹ 100', '1e5', 'NaN', 'abc', '12.5%']) {
      expect(() => Money.of(bad)).toThrow(MoneyFormatError)
    }
  })

  it('maybe() returns null instead of throwing for an absent field', () => {
    expect(Money.maybe(null)).toBeNull()
    expect(Money.maybe(undefined)).toBeNull()
    expect(Money.maybe('')).toBeNull()
    expect(Money.maybe('not money')).toBeNull()
    expect(Money.maybe('100.00')?.toWire()).toBe('100.00')
  })
})

describe('Indian numbering', () => {
  it.each([
    ['1234567.89', '₹ 12,34,567.89'],
    ['100000', '₹ 1,00,000.00'],
    ['-100000.00', '-₹ 1,00,000.00'],
    ['999', '₹ 999.00'],
    ['1000', '₹ 1,000.00'],
    ['10000000', '₹ 1,00,00,000.00'],
    ['0.00', '₹ 0.00'],
    ['3842110.00', '₹ 38,42,110.00'],
  ])('formats %s as %s', (raw, expected) => {
    expect(Money.of(raw).format()).toBe(expected)
  })

  it('can drop the symbol and the paise', () => {
    expect(Money.of('1234567.89').format({ symbol: false })).toBe('12,34,567.89')
    expect(Money.of('1234567.89').format({ symbol: false, paise: false })).toBe('12,34,567')
  })
})

describe('head-wise rendering', () => {
  const vector = { igst: '2210000.00', cgst: '816055.00', sgst: '816055.00', cess: '0.00' }

  it('keeps the four heads in canonical order', () => {
    expect(HEADS).toEqual(['igst', 'cgst', 'sgst', 'cess'])
  })

  it('shows only the heads that carry an amount', () => {
    expect(nonZeroHeads(vector).map(([head]) => head)).toEqual(['igst', 'cgst', 'sgst'])
  })

  it('never sums the heads into one scalar', () => {
    // There is deliberately no add() on Money: a total is computed on the
    // server and arrives with a calc_id attached to it.
    expect('add' in Money.of('1.00')).toBe(false)
  })
})
