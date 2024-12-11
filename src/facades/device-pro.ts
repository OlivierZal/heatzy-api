import { DerogMode, Mode } from '../enums.ts'

import { DeviceGlowFacade } from './device-glow.ts'

import type { IDeviceProFacade } from './interfaces.ts'

export class DeviceProFacade
  extends DeviceGlowFacade
  implements IDeviceProFacade
{
  public override readonly supportsPro = true

  public override get comfortTemperature(): number {
    return this.getValue('cft_temp')
  }

  public override get currentTemperature(): number {
    return this.getValue('cur_temp')
  }

  public override get ecoTemperature(): number {
    return this.getValue('eco_temp')
  }

  protected override get derogModeString():
    | 'boost'
    | 'off'
    | 'vacation'
    | Mode.cft
    | Mode.cft1
    | Mode.cft2
    | Mode.eco {
    if (
      this.derogMode === DerogMode.presence &&
      (this.currentMode === Mode.cft ||
        this.currentMode === Mode.cft1 ||
        this.currentMode === Mode.cft2 ||
        this.currentMode === Mode.eco)
    ) {
      return this.currentMode
    }
    return super.derogModeString
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

  public get isDetectingOpenWindow(): boolean {
    return Boolean(this.getValue('window_switch'))
  }

  public get isHeating(): boolean {
    return Boolean(this.getValue('Heating_state'))
  }

  public get isPresence(): boolean {
    return (
      this.getValue('derog_mode') === DerogMode.presence &&
      this.currentMode === Mode.cft
    )
  }
}
