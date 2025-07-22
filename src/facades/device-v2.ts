import { DateTime } from 'luxon'

import type { Attributes, PostAttributes } from '../types.ts'

import { DerogationMode } from '../enums.ts'

import type { IDeviceV2Facade } from './interfaces.ts'

import { DeviceFacade } from './device.ts'

const ZERO = 0

export class DeviceV2Facade extends DeviceFacade implements IDeviceV2Facade {
  public get derogationEndString(): string | null {
    const { derogationEndDate, derogationMode } = this
    if (derogationEndDate) {
      switch (derogationMode) {
        case DerogationMode.Boost:
        case DerogationMode.Presence: {
          return derogationEndDate.toLocaleString(DateTime.TIME_24_SIMPLE)
        }
        case DerogationMode.Vacation: {
          return derogationEndDate.toLocaleString({
            day: 'numeric',
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
            month: 'short',
          })
        }
        case DerogationMode.Off:
        default:
      }
    }
    return null
  }

  public get derogationMode(): DerogationMode {
    return this.getValue('derog_mode')
  }

  public get derogationTime(): number {
    return this.getValue('derog_time')
  }

  public get isLocked(): boolean {
    return Boolean(this.getValue('lock_switch'))
  }

  public get isTimer(): boolean {
    return Boolean(this.getValue('timer_switch'))
  }

  protected override async control(
    attributes: PostAttributes,
  ): Promise<Partial<Attributes>> {
    if (Object.keys(attributes).length > ZERO) {
      await this.api.control({ id: this.id, postData: { attrs: attributes } })
    }
    return attributes
  }
}
