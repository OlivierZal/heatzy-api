import type { Mode } from './enums.ts'
import type { PostAttrs } from './types.ts'

import { TEMPERATURE_SCALE } from './constants.ts'
import { Product } from './models/index.ts'

enum BitHigh {
  Off = 0,
  On = 1,
}

const BYTE_MAX = 255

export const getTargetTemperature = (
  product: Product,
  mode: Mode.Comfort | Mode.Eco,
  value: number,
): PostAttrs => {
  const newValue = value * TEMPERATURE_SCALE
  if (product === Product.Glow) {
    const tempH = newValue > BYTE_MAX ? BitHigh.On : BitHigh.Off
    return {
      [`${mode}_tempH`]: tempH,
      [`${mode}_tempL`]:
        newValue - tempH * TEMPERATURE_SCALE * TEMPERATURE_SCALE,
    }
  }
  return { [`${mode}_temp`]: newValue }
}
