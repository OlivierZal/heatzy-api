import { supportsGlow, type IDeviceFacadeAny } from './facades/interfaces.ts'

import type { PostAttrs } from './types.ts'

const BYTE_MAX_VALUE = 255
const TEMPERATURE_SCALE = 10

export const getTargetTemperature = (
  device: IDeviceFacadeAny,
  temperature: 'cft_temp' | 'eco_temp',
  value: number,
): PostAttrs => {
  if (supportsGlow(device)) {
    const tempH =
      Math.floor((value * TEMPERATURE_SCALE) / BYTE_MAX_VALUE) *
      TEMPERATURE_SCALE
    return {
      [`${temperature}H`]: tempH / TEMPERATURE_SCALE,
      [`${temperature}L`]: (value - tempH) * TEMPERATURE_SCALE,
    }
  }
  return { [temperature]: value }
}
