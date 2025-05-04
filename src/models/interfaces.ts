import type { DateTime } from 'luxon'

import type { Mode } from '../enums.ts'
import type { Attrs } from '../types.ts'

export enum Product {
  Glow = 5,
  Pro = 6,
  V1 = 1,
  V2 = 2,
  V4 = 4,
}

export interface IBaseDeviceModel {
  readonly derogationEndDate: DateTime | null
  readonly id: string
  readonly name: string
  readonly previousMode: PreviousMode
  readonly product: Product
  readonly update: (data: Partial<Attrs>) => void
}

export interface IDeviceModel extends IBaseDeviceModel {
  readonly data: Attrs
  readonly productKey: string
  readonly productName: string
}

export type PreviousMode = Exclude<Mode, Mode.Stop>

const productMapping: Record<Product, string[]> = {
  [Product.Glow]: [
    'cffa0df68a52449085c5d1e72c2f6bb0',
    '2fd622e45283470f9e27e8e6167d7533',
    // Onyx
    'bb10d064f8de409db633b750faa22a52',
    // Shine
    '2884feb88e0b4f30b75ea5572276a102',
  ],
  [Product.Pro]: ['a77a929fcf0d4631bc4f669080376891'],
  [Product.V1]: ['9420ae048da545c88fc6274d204dd25f'],
  [Product.V2]: [
    '51d16c22a5f74280bc3cfe9ebcdc6402',
    '4fc968a21e7243b390e9ede6f1c6465d',
    // V3
    'b9a67b6ce24b437d9794103fd317e627',
    'b8c6657b66c34148b4dee64d615cefc7',
  ],
  [Product.V4]: [
    '46409c7f29d4411c85a3a46e5ee3703e',
    '9dacde7ef459421eaf8dc4bea9385634',
  ],
}

export const getProduct = (productKey: string): Product => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const [product] = (Object.entries(productMapping).find(([, productKeys]) =>
    productKeys.includes(productKey),
  ) ?? [undefined]) as [Product | undefined]
  if (product === undefined) {
    throw new Error(`Invalid product: ${productKey}`)
  }
  return product
}
