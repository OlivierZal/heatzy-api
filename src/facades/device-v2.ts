import { DateTime } from 'luxon'

import { syncDevices } from '../decorators/sync-devices.ts'
import { updateDevice } from '../decorators/update-device.ts'
import { DerogMode } from '../enums.ts'

import { DeviceFacade } from './device.ts'

import type { Attrs, PostAttrs } from '../types.ts'

import type { DerogSettings, IDeviceV2Facade } from './interfaces.ts'

const getVacationEnd = (days: number): DateTime => DateTime.now().plus({ days })

const getBoostEnd = (minutes: number): DateTime =>
  DateTime.now().plus({ minutes })

export class DeviceV2Facade extends DeviceFacade implements IDeviceV2Facade {
  public override readonly supportsV2 = true

  #derogEndDate: DateTime | null = null

  public get derogSettings(): DerogSettings {
    return {
      derogEndDate: this.derogEndDate,
      derogEndString: this.#derogEndString,
      derogMode: this.#derogMode,
    }
  }

  public get isLocked(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  public get isTimer(): boolean {
    return Boolean(this.getValue('timer_switch'))
  }

  get #derogEndString(): string | null {
    const { derogEndDate } = this
    if (derogEndDate) {
      switch (this.#derogMode) {
        case DerogMode.boost:
          return derogEndDate.toLocaleString({
            day: 'numeric',
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
            month: 'short',
          })
        case DerogMode.vacation:
          return derogEndDate.toLocaleString(DateTime.TIME_24_SIMPLE)
        case DerogMode.off:
        case DerogMode.presence:
        default:
      }
    }
    return null
  }

  get #derogMode(): DerogMode {
    return this.getValue('derog_mode')
  }

  get #derogTime(): number {
    return this.getValue('derog_time')
  }

  private get derogEndDate(): DateTime | null {
    return this.#derogEndDate && this.#derogEndDate > DateTime.now() ?
        this.#derogEndDate
      : null
  }

  private set derogEndDate(date: DateTime | null) {
    this.#derogEndDate = date
  }

  @syncDevices
  @updateDevice
  public override async setValues(attrs: PostAttrs): Promise<Partial<Attrs>> {
    if (Object.keys(attrs).length) {
      const { derog_mode: derogMode, derog_time: derogTime } = attrs
      if (derogMode !== undefined || derogTime !== undefined) {
        const newDerogMode = derogMode ?? this.#derogMode
        const newDerogTime = derogTime ?? this.#derogTime
        switch (newDerogMode) {
          case DerogMode.boost:
            this.derogEndDate = getBoostEnd(newDerogTime)
            break
          case DerogMode.vacation:
            this.derogEndDate = getVacationEnd(newDerogTime)
            break
          case DerogMode.off:
          case DerogMode.presence:
          default:
            this.derogEndDate = null
        }
      }
      await this.api.control({ id: this.id, postData: { attrs } })
    }
    return attrs
  }
}
