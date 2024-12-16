import { TEMPERATURE_SCALE } from '../constants.ts'
import { DerogMode, Mode } from '../enums.ts'

import { DeviceGlowFacade } from './device-glow.ts'

import type { IDeviceProFacade } from './interfaces.ts'

export class DeviceProFacade
  extends DeviceGlowFacade
  implements IDeviceProFacade
{
  public override get comfortTemperature(): number {
    return this.getValue('cft_temp') / TEMPERATURE_SCALE
  }

  public override get currentTemperature(): number {
    return this.getValue('cur_temp') / TEMPERATURE_SCALE
  }

  public override get ecoTemperature(): number {
    return this.getValue('eco_temp') / TEMPERATURE_SCALE
  }

  public override get isOn(): boolean {
    return this.mode !== Mode.stop
  }

  public get currentHumidity(): number {
    return this.getValue('cur_humi')
  }

  public get currentMode(): Mode {
    return this.getValue('cur_mode')
  }

  public get isDetectingOpenWindow(): boolean {
    return Boolean(this.getValue('window_switch'))
  }

  public get isPresence(): boolean {
    return (
      this.getValue('derog_mode') === DerogMode.presence &&
      this.currentMode === Mode.cft
    )
  }
}
