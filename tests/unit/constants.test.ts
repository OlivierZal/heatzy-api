import { describe, expect, it } from 'vitest'

import { getProduct, Product } from '../../src/constants.ts'
import { PRODUCT_KEYS } from '../fixtures.ts'

describe(getProduct, () => {
  it.each([
    { key: PRODUCT_KEYS.v1, label: 'V1', product: Product.v1 },
    { key: PRODUCT_KEYS.v2, label: 'V2', product: Product.v2 },
    {
      key: '51d16c22a5f74280bc3cfe9ebcdc6402',
      label: 'second V2',
      product: Product.v2,
    },
    {
      key: 'b8c6657b66c34148b4dee64d615cefc7',
      label: 'V3 (identifies as V2)',
      product: Product.v2,
    },
    {
      key: 'b9a67b6ce24b437d9794103fd317e627',
      label: 'second V3 (identifies as V2)',
      product: Product.v2,
    },
    { key: PRODUCT_KEYS.v4, label: 'V4', product: Product.v4 },
    {
      key: '9dacde7ef459421eaf8dc4bea9385634',
      label: 'second V4',
      product: Product.v4,
    },
    { key: PRODUCT_KEYS.glow, label: 'Glow', product: Product.glow },
    {
      key: 'cffa0df68a52449085c5d1e72c2f6bb0',
      label: 'second Glow',
      product: Product.glow,
    },
    {
      key: 'bb10d064f8de409db633b750faa22a52',
      label: 'Onyx (identifies as Glow)',
      product: Product.glow,
    },
    {
      key: '2884feb88e0b4f30b75ea5572276a102',
      label: 'Shine (identifies as Glow)',
      product: Product.glow,
    },
    { key: PRODUCT_KEYS.pro, label: 'Pro', product: Product.pro },
  ])('resolves the $label product key', ({ key, product }) => {
    expect(getProduct(key)).toBe(product)
  })

  it('throws on an unknown product key', () => {
    expect(() => getProduct('deadbeef')).toThrow('Invalid product: deadbeef')
  })
})
