import type { Attrs } from '../types.ts'

export enum Product {
  glow = 'glow',
  pro = 'pro',
  v1 = 'v1',
  v2 = 'v2',
  v4 = 'v4',
}

export interface IBaseDeviceModel {
  doesNotSupportExtendedMode: boolean
  id: string
  name: string
}

export interface IDeviceModel extends IBaseDeviceModel {
  data: Attrs
  product: Product
  productKey: string
  productName: string
  update: (data: Partial<Attrs>) => void
}

const productMapping: Record<Product, string[]> = {
  glow: [
    'cffa0df68a52449085c5d1e72c2f6bb0',
    '2fd622e45283470f9e27e8e6167d7533',
    // Shine
    '2884feb88e0b4f30b75ea5572276a102',
  ],
  pro: ['a77a929fcf0d4631bc4f669080376891'],
  v1: ['9420ae048da545c88fc6274d204dd25f'],
  v2: [
    '51d16c22a5f74280bc3cfe9ebcdc6402',
    '4fc968a21e7243b390e9ede6f1c6465d',
    // V3
    'b9a67b6ce24b437d9794103fd317e627',
    'b8c6657b66c34148b4dee64d615cefc7',
  ],
  v4: ['46409c7f29d4411c85a3a46e5ee3703e', '9dacde7ef459421eaf8dc4bea9385634'],
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
