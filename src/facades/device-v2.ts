import { DateTime } from 'luxon'

import { syncDevices } from '../decorators/sync-devices.ts'
import { updateDevice } from '../decorators/update-device.ts'
import { DerogMode, type Mode } from '../enums.ts'

import { DeviceFacade } from './device.ts'

import type { Attrs, PostAttrs } from '../types.ts'

import type { DerogSettings, IDeviceV2Facade } from './interfaces.ts'

export class DeviceV2Facade extends DeviceFacade implements IDeviceV2Facade {
  public override readonly supportsV2 = true

  #derogEndDate: DateTime | null = null

  public get derogEndDate(): DateTime | null {
    return (
        this.derogMode !== DerogMode.off &&
          this.#derogEndDate &&
          this.#derogEndDate > DateTime.now()
      ) ?
        this.#derogEndDate
      : null
  }

  public set derogEndDate(date: DateTime | null) {
    this.#derogEndDate = date
  }

  public get derogMode(): DerogMode {
    return this.getValue('derog_mode')
  }

  public get derogSettings(): DerogSettings {
    return {
      derogEndDate: this.derogEndDate,
      derogEndString: this.#derogEndString,
      derogMode: this.derogMode,
      derogModeString: this.derogModeString,
    }
  }

  public get isLocked(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  public get isTimer(): boolean {
    return Boolean(this.getValue('timer_switch'))
  }

  protected get derogModeString():
    | 'boost'
    | 'off'
    | 'vacation'
    | Mode.cft
    | Mode.cft1
    | Mode.cft2
    | Mode.eco {
    switch (this.derogMode) {
      case DerogMode.boost:
        return 'boost'
      case DerogMode.vacation:
        return 'vacation'
      case DerogMode.off:
      case DerogMode.presence:
      default:
        return 'off'
    }
  }

  get #derogEndString(): string | null {
    const { derogEndDate } = this
    if (derogEndDate) {
      switch (this.derogMode) {
        case DerogMode.boost:
        case DerogMode.presence:
          return derogEndDate.toLocaleString(DateTime.TIME_24_SIMPLE)
        case DerogMode.vacation:
          return derogEndDate.toLocaleString({
            day: 'numeric',
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
            month: 'short',
          })
        case DerogMode.off:
        default:
      }
    }
    return null
  }

  get #derogTime(): number {
    return this.getValue('derog_time')
  }

  @syncDevices
  @updateDevice
  public override async setValues(attrs: PostAttrs): Promise<Partial<Attrs>> {
    if (Object.keys(attrs).length) {
      const { derog_mode: derogMode, derog_time: derogTime } = attrs
      if (derogMode !== undefined || derogTime !== undefined) {
        const newDerogMode = derogMode ?? this.derogMode
        const newDerogTime = derogTime ?? this.#derogTime
        const now = DateTime.now()
        switch (newDerogMode) {
          case DerogMode.boost:
            this.derogEndDate = now.plus({ minutes: newDerogTime })
            break
          case DerogMode.vacation:
            this.derogEndDate = now.plus({ days: newDerogTime })
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
