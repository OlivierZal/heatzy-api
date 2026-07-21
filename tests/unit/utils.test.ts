import { describe, expect, it } from 'vitest'

import { Mode, modeToModeV1, Product } from '../../src/constants.ts'
import { getTargetTemperature, isKeyOf } from '../../src/utils.ts'

describe(isKeyOf, () => {
  it('narrows an own key', () => {
    const key: PropertyKey = 'cft'

    expect(isKeyOf(modeToModeV1)(key)).toBe(true)
  })

  it('rejects a missing key', () => {
    expect(isKeyOf(modeToModeV1)('cft1')).toBe(false)
  })

  it('rejects the inherited toString member', () => {
    expect(isKeyOf(modeToModeV1)('toString')).toBe(false)
  })
})

describe(getTargetTemperature, () => {
  it.each([
    { expected: { cft_temp: 210 }, mode: Mode.comfort, value: 21 },
    { expected: { eco_temp: 175 }, mode: Mode.eco, value: 17.5 },
  ])(
    'builds a single tenths register for non-Glow products: $expected',
    ({ expected, mode, value }) => {
      expect(getTargetTemperature(Product.pro, mode, value)).toStrictEqual(
        expected,
      )
    },
  )

  it.each([
    {
      expected: { cft_tempH: 0, cft_tempL: 210 },
      label: 'below the high bit',
      value: 21,
    },
    {
      expected: { cft_tempH: 0, cft_tempL: 255 },
      label: 'at the 25.5°C boundary',
      value: 25.5,
    },
    {
      expected: { cft_tempH: 1, cft_tempL: 160 },
      label: 'above the high bit',
      value: 26,
    },
  ])('splits the Glow comfort registers $label', ({ expected, value }) => {
    expect(
      getTargetTemperature(Product.glow, Mode.comfort, value),
    ).toStrictEqual(expected)
  })

  it('splits the Glow eco registers', () => {
    expect(getTargetTemperature(Product.glow, Mode.eco, 18)).toStrictEqual({
      eco_tempH: 0,
      eco_tempL: 180,
    })
  })
})
