import { DeviceGlowFacade } from './device-glow.ts'

import type { Mode } from '../enums.ts'
import type { Product } from '../main.ts'

import type { IDeviceProFacade } from './interfaces.ts'

export class DeviceProFacade
  extends DeviceGlowFacade
  implements IDeviceProFacade
{
  public override readonly product: Exclude<
    Product,
    'glow' | 'v1' | 'v2' | 'v4'
  > = 'pro'

  public override get comfortTemperature(): number {
    return this.getValue('cft_temp')
  }

  public override get currentTemperature(): number {
    return this.getValue('cur_temp')
  }

  public override get ecoTemperature(): number {
    return this.getValue('eco_temp')
  }

  public get currentHumidity(): number {
    return this.getValue('cur_humi')
  }

  public get currentMode(): Mode {
    return this.getValue('cur_mode')
  }

  public get currentSignal(): Mode {
    return this.getValue('cur_signal')
  }

  public get heatingState(): boolean {
    return Boolean(this.getValue('heating_state'))
  }

  public get temperatureStep(): boolean {
    return Boolean(this.getValue('temp_set_step'))
  }

  public get windowSwitch(): boolean {
    return Boolean(this.getValue('window_switch'))
  }
}
