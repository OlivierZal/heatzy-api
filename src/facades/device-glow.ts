import { TEMPERATURE_SCALE } from '../constants.ts'
import { Mode } from '../enums.ts'

import type { IDeviceGlowFacade } from './interfaces.ts'

import { DeviceV2Facade } from './device-v2.ts'

const temperatureRange = {
  cft: { max: 30, min: 15 },
  eco: { max: 19, min: 10 },
}

export class DeviceGlowFacade
  extends DeviceV2Facade
  implements IDeviceGlowFacade
{
  public override get isLocked(): boolean {
    return Boolean(this.getValue('lock_c'))
  }

  public override get isOn(): boolean {
    return Boolean(this.getValue('on_off'))
  }

  public get comfortTemperature(): number {
    return this.getTargetTemperature(Mode.Comfort)
  }

  public get currentTemperature(): number {
    return this.getTemperature()
  }

  public get ecoTemperature(): number {
    return this.getTargetTemperature(Mode.Eco)
  }

  public get temperatureCompensation(): number {
    return this.getValue('com_temp')
  }

  protected getTargetTemperature(mode: Mode.Comfort | Mode.Eco): number {
    const {
      [mode]: { max, min },
    } = temperatureRange
    return Math.max(Math.min(this.getTemperature(mode), max), min)
  }

  protected getTemperature(
    mode: 'cur' | Mode.Comfort | Mode.Eco = 'cur',
  ): number {
    return (
      this.getValue(`${mode}_tempH`) * TEMPERATURE_SCALE +
      this.getValue(`${mode}_tempL`) / TEMPERATURE_SCALE
    )
  }
}
