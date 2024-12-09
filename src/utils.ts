export type Product = 'glow' | 'pro' | 'v1' | 'v2' | 'v4'

const productMapping: Record<Product, string[]> = {
  glow: [
    '2fd622e45283470f9e27e8e6167d7533',
    'cffa0df68a52449085c5d1e72c2f6bb0',
  ],
  pro: ['a77a929fcf0d4631bc4f669080376891'],
  v1: ['9420ae048da545c88fc6274d204dd25f'],
  v2: [
    '4fc968a21e7243b390e9ede6f1c6465d',
    '51d16c22a5f74280bc3cfe9ebcdc6402',
    'b8c6657b66c34148b4dee64d615cefc7',
    'b9a67b6ce24b437d9794103fd317e627',
  ],
  v4: ['9dacde7ef459421eaf8dc4bea9385634', '46409c7f29d4411c85a3a46e5ee3703e'],
} as const

const isProduct = (product: string): product is keyof typeof productMapping =>
  Object.keys(productMapping).includes(product)

export const getProduct = (productKey: string): Product => {
  const entry = Object.entries(productMapping).find(([, productKeys]) =>
    productKeys.includes(productKey),
  )
  if (entry) {
    const [product] = entry
    if (isProduct(product)) {
      return product
    }
  }
  throw new Error(`Invalid product: ${productKey}`)
}
