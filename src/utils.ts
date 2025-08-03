import type { PostAttributes } from './types.ts'

import { TEMPERATURE_SCALE } from './constants.ts'
import { type Mode, Product } from './enums.ts'

enum BitHigh {
  off = 0,
  on = 1,
}

const BYTE_MAX = 255

export const getTargetTemperature = (
  product: Product,
  mode: Mode.comfort | Mode.eco,
  value: number,
): PostAttributes => {
  const valueNew = value * TEMPERATURE_SCALE
  if (product === Product.glow) {
    const temporaryH = valueNew > BYTE_MAX ? BitHigh.on : BitHigh.off
    return {
      [`${mode}_tempH`]: temporaryH,
      [`${mode}_tempL`]:
        valueNew - temporaryH * TEMPERATURE_SCALE * TEMPERATURE_SCALE,
    }
  }
  return { [`${mode}_temp`]: valueNew }
}
