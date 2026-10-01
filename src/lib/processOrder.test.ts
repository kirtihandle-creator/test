import { describe, expect, it } from 'vitest'
import { processOrder, type OrderItem, type User } from './processOrder'

const user = (overrides: Partial<User> = {}): User => ({
  id: 'u1',
  name: 'Test User',
  isPremium: false,
  country: 'USA',
  ...overrides,
})

const item = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'i1',
  name: 'Widget',
  price: 100,
  quantity: 2,
  category: 'general',
  ...overrides,
})

describe('processOrder', () => {
  it('rejects a missing/invalid user', () => {
    const result = processOrder(null as unknown as User, [item()])
    expect(result.success).toBe(false)
  })

  it('rejects missing or empty items', () => {
    expect(processOrder(user(), null as unknown as OrderItem[]).success).toBe(false)
    expect(processOrder(user(), []).success).toBe(false)
  })

  it('rejects an item with a negative price', () => {
    const result = processOrder(user(), [item({ price: -10 })])
    expect(result.success).toBe(false)
  })

  it('rejects an item with zero or negative quantity', () => {
    const result = processOrder(user(), [item({ quantity: 0 })])
    expect(result.success).toBe(false)
  })

  it('computes subtotal as price * quantity, summed across items', () => {
    const result = processOrder(user(), [
      item({ price: 100, quantity: 2 }),
      item({ price: 50, quantity: 3 }),
    ])
    expect(result.subtotal).toBe(350)
  })

  it('does not double-charge electronics', () => {
    const result = processOrder(user(), [item({ price: 100, quantity: 1, category: 'electronics' })])
    expect(result.subtotal).toBe(100)
  })

  it('applies a premium discount that reduces the subtotal', () => {
    const result = processOrder(user({ isPremium: true }), [item({ price: 100, quantity: 1 })])
    expect(result.subtotal).toBe(90)
    expect(result.discount).toBe(10)
  })

  it('applies a flat coupon (SAVE10)', () => {
    const result = processOrder(user(), [item({ price: 100, quantity: 1 })], 'SAVE10')
    expect(result.subtotal).toBe(90)
  })

  it('applies a percentage coupon (SAVE50)', () => {
    const result = processOrder(user(), [item({ price: 100, quantity: 1 })], 'SAVE50')
    expect(result.subtotal).toBe(50)
  })

  it('rejects an unknown coupon code', () => {
    const result = processOrder(user(), [item()], 'NOT_REAL')
    expect(result.success).toBe(false)
  })

  it('never lets subtotal go negative after a coupon', () => {
    const result = processOrder(user(), [item({ price: 5, quantity: 1 })], 'SAVE10')
    expect(result.subtotal).toBe(0)
  })

  it('applies country-specific tax and shipping', () => {
    const result = processOrder(user(), [item({ price: 100, quantity: 1 })], undefined, 'INDIA')
    expect(result.tax).toBeCloseTo(18, 5)
    expect(result.shipping).toBe(5)
  })

  it('falls back to default tax/shipping for an unlisted country', () => {
    const result = processOrder(user({ country: 'FRANCE' }), [item({ price: 100, quantity: 1 })])
    expect(result.tax).toBeCloseTo(5, 5)
    expect(result.shipping).toBe(25)
  })

  it('sums total quantity across items', () => {
    const result = processOrder(user(), [item({ quantity: 2 }), item({ quantity: 3 })])
    expect(result.quantity).toBe(5)
  })

  it('total is subtotal + tax + shipping, not inflated by quantity or user id', () => {
    const result = processOrder(user({ id: 'longuserid123' }), [item({ price: 100, quantity: 1 })], undefined, 'USA')
    expect(result.total).toBe(122)
  })
})
