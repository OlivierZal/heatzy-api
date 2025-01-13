import { TEMPERATURE_SCALE } from './constants.ts'
import { Product } from './models/interfaces.ts'

import type { Mode } from './enums.ts'
import type { PostAttrs } from './types.ts'

enum BitHigh {
  off = 0,
  on = 1,
}

const BYTE_MAX = 255

export const getTargetTemperature = (
  product: Product,
  mode: Mode.cft | Mode.eco,
  value: number,
): PostAttrs => {
  const newValue = value * TEMPERATURE_SCALE
  if (product === Product.glow) {
    const tempH = newValue > BYTE_MAX ? BitHigh.on : BitHigh.off
    return {
      [`${mode}_tempH`]: tempH,
      [`${mode}_tempL`]:
        newValue - tempH * TEMPERATURE_SCALE * TEMPERATURE_SCALE,
    }
  }
  return { [`${mode}_temp`]: newValue }
}
