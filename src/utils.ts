import { TEMPERATURE_SCALE } from './constants.ts'
import { Product } from './models/interfaces.ts'

import type { PostAttrs } from './types.ts'

const BYTE_MAX_VALUE = 255

export const getTargetTemperature = (
  product: Product,
  temperature: 'cft_temp' | 'eco_temp',
  value: number,
): PostAttrs => {
  if (product === Product.glow) {
    const tempH =
      Math.floor((value * TEMPERATURE_SCALE) / BYTE_MAX_VALUE) *
      TEMPERATURE_SCALE
    return {
      [`${temperature}H`]: tempH / TEMPERATURE_SCALE,
      [`${temperature}L`]: (value - tempH) * TEMPERATURE_SCALE,
    }
  }
  return { [temperature]: value * TEMPERATURE_SCALE }
}
