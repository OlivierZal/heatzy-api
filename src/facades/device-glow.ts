import { DeviceV2Facade } from './device-v2.ts'

import type { IDeviceGlowFacade } from './interfaces.ts'

const TEMPERATURE_SCALE = 0x0a

const temperatureRange = {
  cft: { max: 30, min: 15 },
  eco: { max: 19, min: 10 },
}

export class DeviceGlowFacade
  extends DeviceV2Facade
  implements IDeviceGlowFacade
{
  public get comfortTemperature(): number {
    return Math.max(
      Math.min(this.#getCombinedTemperature('cft'), temperatureRange.cft.max),
      temperatureRange.cft.min,
    )
  }

  public get currentTemperature(): number {
    return this.#getCombinedTemperature('cur')
  }

  public get ecoTemperature(): number {
    return Math.max(
      Math.min(this.#getCombinedTemperature('eco'), temperatureRange.eco.max),
      temperatureRange.eco.min,
    )
  }

  public get temperatureCompensation(): number {
    return this.getValue('com_temp')
  }

  #getCombinedTemperature(prefix: 'cft' | 'cur' | 'eco'): number {
    return (
      this.getValue(`${prefix}_tempH`) * TEMPERATURE_SCALE +
      this.getValue(`${prefix}_tempL`) / TEMPERATURE_SCALE
    )
  }
}
