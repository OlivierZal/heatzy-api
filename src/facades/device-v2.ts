import { DateTime } from 'luxon'

import { syncDevices } from '../decorators/sync-devices.ts'
import { updateDevice } from '../decorators/update-device.ts'
import { DerogMode } from '../enums.ts'

import { DeviceFacade } from './device.ts'

import type { Attrs } from '../types.ts'

import type { DerogSettings, IDeviceV2Facade } from './interfaces.ts'

const getVacationEnd = (days: number): string =>
  DateTime.now().plus({ days }).toLocaleString({
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'short',
  })

const getBoostEnd = (minutes: number): string =>
  DateTime.now().plus({ minutes }).toLocaleString(DateTime.TIME_24_SIMPLE)

export class DeviceV2Facade extends DeviceFacade implements IDeviceV2Facade {
  public get derogSettings(): DerogSettings {
    switch (this.#derogMode) {
      case DerogMode.boost:
        return {
          derogEnd: getBoostEnd(this.#derogTime),
          derogTimeBoost: this.#derogTime,
          derogTimeVacation: 0,
        }
      case DerogMode.vacation:
        return {
          derogEnd: getVacationEnd(this.#derogTime),
          derogTimeBoost: 0,
          derogTimeVacation: this.#derogTime,
        }
      case DerogMode.off:
      default:
        return {
          derogEnd: null,
          derogTimeBoost: 0,
          derogTimeVacation: 0,
        }
    }
  }

  public get lockSwitch(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  public get timerSwitch(): boolean {
    return Boolean(this.getValue('timer_switch'))
  }

  get #derogMode(): DerogMode {
    return this.getValue('derog_mode')
  }

  get #derogTime(): number {
    return this.getValue('derog_time')
  }

  @syncDevices
  @updateDevice
  public override async setValues(attrs: Attrs): Promise<Attrs> {
    if (Object.keys(attrs).length) {
      await this.api.control({
        id: this.id,
        postData: { attrs },
      })
    }
    return attrs
  }
}
