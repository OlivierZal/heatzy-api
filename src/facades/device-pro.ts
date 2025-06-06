import { TEMPERATURE_SCALE } from '../constants.ts'
import { DerogationMode, Mode } from '../enums.ts'

import type { IDeviceProFacade } from './interfaces.ts'

import { DeviceGlowFacade } from './device-glow.ts'

export class DeviceProFacade
  extends DeviceGlowFacade
  implements IDeviceProFacade
{
  public override get comfortTemperature(): number {
    return this.getTargetTemperature(Mode.Comfort)
  }

  public override get currentTemperature(): number {
    return this.getTemperature()
  }

  public override get ecoTemperature(): number {
    return this.getTargetTemperature(Mode.Eco)
  }

  public override get isLocked(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  public override get isOn(): boolean {
    return this.mode !== Mode.Stop
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
      this.getValue('derog_mode') === DerogationMode.Presence &&
      this.currentMode === Mode.Comfort
    )
  }

  protected override getTemperature(
    mode: 'cur' | Mode.Comfort | Mode.Eco = 'cur',
  ): number {
    return this.getValue(`${mode}_temp`) / TEMPERATURE_SCALE
  }
}
