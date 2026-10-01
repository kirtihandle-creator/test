export type OrderItem = {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

export type User = {
  id: string
  name: string
  isPremium: boolean
  country: string
}

export type OrderResult = {
  success: boolean
  userId?: string
  items?: number
  subtotal?: number
  discount?: number
  tax?: number
  shipping?: number
  quantity?: number
  total?: number
  message: string
}

const TAX_RATES: Record<string, number> = {
  USA: 0.07,
  INDIA: 0.18,
}

const DEFAULT_TAX_RATE = 0.05

const SHIPPING_COST: Record<string, number> = {
  USA: 15,
  INDIA: 5,
}

const DEFAULT_SHIPPING_COST = 25

const PREMIUM_DISCOUNT_RATE = 0.1

const COUPONS: Record<string, { type: 'flat' | 'percent'; value: number }> = {
  SAVE10: { type: 'flat', value: 10 },
  SAVE50: { type: 'percent', value: 0.5 },
}

function isValidUser(user: unknown): user is User {
  if (!user || typeof user !== 'object') return false
  const u = user as User
  return (
    typeof u.id === 'string' &&
    u.id.length > 0 &&
    typeof u.name === 'string' &&
    typeof u.isPremium === 'boolean' &&
    typeof u.country === 'string' &&
    u.country.length > 0
  )
}

function isValidItem(item: unknown): item is OrderItem {
  if (!item || typeof item !== 'object') return false
  const i = item as OrderItem
  return (
    typeof i.id === 'string' &&
    typeof i.name === 'string' &&
    typeof i.price === 'number' &&
    i.price >= 0 &&
    typeof i.quantity === 'number' &&
    i.quantity > 0 &&
    typeof i.category === 'string'
  )
}

export function processOrder(
  user: User,
  items: OrderItem[],
  coupon?: string,
  shippingCountry?: string
): OrderResult {
  if (!isValidUser(user)) {
    return { success: false, message: 'Invalid user' }
  }

  if (!Array.isArray(items) || items.length === 0 || !items.every(isValidItem)) {
    return { success: false, message: 'Invalid order items' }
  }

  let subtotal = 0
  let totalQuantity = 0

  for (const item of items) {
    subtotal += item.price * item.quantity
    totalQuantity += item.quantity
  }

  let discount = 0
  if (user.isPremium) {
    discount = subtotal * PREMIUM_DISCOUNT_RATE
    subtotal -= discount
  }

  if (coupon) {
    const applied = COUPONS[coupon]
    if (!applied) {
      return { success: false, message: 'Invalid coupon code' }
    }
    const couponDiscount =
      applied.type === 'flat' ? applied.value : subtotal * applied.value
    discount += couponDiscount
    subtotal = Math.max(0, subtotal - couponDiscount)
  }

  const country = shippingCountry ?? user.country
  const taxRate = TAX_RATES[country] ?? DEFAULT_TAX_RATE
  const tax = subtotal * taxRate

  const shipping = SHIPPING_COST[country] ?? DEFAULT_SHIPPING_COST

  const total = Math.round((subtotal + tax + shipping) * 100) / 100

  return {
    success: true,
    userId: user.id,
    items: items.length,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping,
    quantity: totalQuantity,
    total,
    message: 'Order processed successfully',
  }
}
