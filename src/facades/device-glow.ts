import { DeviceV2Facade } from './device-v2.ts'

import type { IDeviceGlowFacade } from './interfaces.ts'

const TEMPERATURE_SCALE = 10

const temperatureRange = {
  cft: { max: 30, min: 15 },
  eco: { max: 19, min: 10 },
}

export class DeviceGlowFacade
  extends DeviceV2Facade
  implements IDeviceGlowFacade
{
  public override readonly supportsGlow = true

  public get comfortTemperature(): number {
    return Math.max(
      Math.min(
        this.#getCombinedTemperature('cft_temp'),
        temperatureRange.cft.max,
      ),
      temperatureRange.cft.min,
    )
  }

  public get currentTemperature(): number {
    return this.#getCombinedTemperature('cur_temp')
  }

  public get ecoTemperature(): number {
    return Math.max(
      Math.min(
        this.#getCombinedTemperature('eco_temp'),
        temperatureRange.eco.max,
      ),
      temperatureRange.eco.min,
    )
  }

  public get temperatureCompensation(): number {
    return this.getValue('com_temp')
  }

  #getCombinedTemperature(
    temperature: 'cft_temp' | 'cur_temp' | 'eco_temp',
  ): number {
    return (
      this.getValue(`${temperature}H`) * TEMPERATURE_SCALE +
      this.getValue(`${temperature}L`) / TEMPERATURE_SCALE
    )
  }
}
