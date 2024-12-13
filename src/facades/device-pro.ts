import { DateTime } from 'luxon'

import { syncDevices } from '../decorators/sync-devices.ts'
import { updateDevice } from '../decorators/update-device.ts'
import { DerogMode, Mode } from '../enums.ts'

import { DeviceGlowFacade } from './device-glow.ts'

import type { Attrs } from '../types.ts'

import type { IDeviceProFacade } from './interfaces.ts'

export class DeviceProFacade
  extends DeviceGlowFacade
  implements IDeviceProFacade
{
  public previousMode?: Mode

  public override get comfortTemperature(): number {
    return this.getValue('cft_temp')
  }

  public override get currentTemperature(): number {
    return this.getValue('cur_temp')
  }

  public override get ecoTemperature(): number {
    return this.getValue('eco_temp')
  }

  public override get isOn(): boolean {
    return this.mode === Mode.stop
  }

  protected override get derogModeString():
    | 'boost'
    | 'off'
    | 'presence'
    | 'vacation'
    | Mode.cft1
    | Mode.cft2
    | Mode.eco {
    if (
      this.derogMode === DerogMode.presence &&
      (this.currentMode === Mode.cft1 ||
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

  public get isDetectingOpenWindow(): boolean {
    return Boolean(this.getValue('window_switch'))
  }

  public get isPresence(): boolean {
    return (
      this.getValue('derog_mode') === DerogMode.presence &&
      this.currentMode === Mode.cft
    )
  }

  @syncDevices
  @updateDevice
  public override async values(): Promise<Attrs> {
    ;({
      instance: {
        data: { cur_mode: this.previousMode },
      },
    } = this)
    const data = await super.values()
    if (this.derogMode === DerogMode.presence) {
      const { cur_mode: currentMode } = data
      if (currentMode !== undefined && currentMode !== this.previousMode) {
        this.derogEndDate =
          [Mode.cft1, Mode.cft2, Mode.eco].includes(currentMode) ?
            DateTime.now().plus({ minutes: 15 })
          : null
      }
    }
    return data
  }
}
