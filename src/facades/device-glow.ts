import { DeviceV2Facade } from './device-v2.ts'

import type { IDeviceGlowFacade } from './interfaces.ts'

const TEMPERATURE_SCALE = 0x0a

export class DeviceGlowFacade
  extends DeviceV2Facade
  implements IDeviceGlowFacade
{
  public get comfortTemperature(): number {
    return this.#getCombinedTemperature('cft')
  }

  public get currentTemperature(): number {
    return this.#getCombinedTemperature('cur')
  }

  public get ecoTemperature(): number {
    return this.#getCombinedTemperature('eco')
  }

  public get temperatureCompensation(): number {
    return this.getValue('com_temp')
  }

  #getCombinedTemperature(prefix: 'cft' | 'cur' | 'eco'): number {
    const high = this.getValue(`${prefix}_tempH`)
    const low = this.getValue(`${prefix}_tempL`)
    return high * TEMPERATURE_SCALE + low / TEMPERATURE_SCALE
  }
}
