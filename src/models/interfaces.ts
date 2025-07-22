import type { DateTime } from 'luxon'

import type { Mode } from '../enums.ts'
import type { Attributes } from '../types.ts'

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
  readonly update: (data: Partial<Attributes>) => void
}

export interface IDeviceModel extends IBaseDeviceModel {
  readonly data: Attributes
  readonly productKey: string
  readonly productName: string
}

export type PreviousMode = Exclude<Mode, Mode.Stop>

const productMapping: Record<string, Product> = {
  /* eslint-disable @typescript-eslint/naming-convention, unicorn/no-unused-properties */
  // V1
  '9420ae048da545c88fc6274d204dd25f': Product.V1,
  // V2
  '4fc968a21e7243b390e9ede6f1c6465d': Product.V2,
  '51d16c22a5f74280bc3cfe9ebcdc6402': Product.V2,
  // V3
  b8c6657b66c34148b4dee64d615cefc7: Product.V2,
  b9a67b6ce24b437d9794103fd317e627: Product.V2,
  // V4
  '46409c7f29d4411c85a3a46e5ee3703e': Product.V4,
  '9dacde7ef459421eaf8dc4bea9385634': Product.V4,
  // Glow
  '2fd622e45283470f9e27e8e6167d7533': Product.Glow,
  cffa0df68a52449085c5d1e72c2f6bb0: Product.Glow,
  // Onyx
  bb10d064f8de409db633b750faa22a52: Product.Glow,
  // Shine
  '2884feb88e0b4f30b75ea5572276a102': Product.Glow,
  // Pro
  a77a929fcf0d4631bc4f669080376891: Product.Pro,
  /* eslint-enable @typescript-eslint/naming-convention, unicorn/no-unused-properties */
}

export const getProduct = (productKey: string): Product => {
  const { [productKey]: product } = productMapping
  if (product === undefined) {
    throw new Error(`Invalid product: ${productKey}`)
  }
  return product
}
