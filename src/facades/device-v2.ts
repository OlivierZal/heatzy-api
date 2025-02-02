import { DateTime } from 'luxon'

import { DerogationMode } from '../enums.ts'

import { DeviceFacade } from './device.ts'

import type { Attrs, PostAttrs } from '../types.ts'

import type { IDeviceV2Facade } from './interfaces.ts'

export class DeviceV2Facade extends DeviceFacade implements IDeviceV2Facade {
  public get derogationEndString(): string | null {
    const { derogationEndDate } = this
    if (derogationEndDate) {
      switch (this.derogationMode) {
        case DerogationMode.boost:
        case DerogationMode.presence:
          return derogationEndDate.toLocaleString(DateTime.TIME_24_SIMPLE)
        case DerogationMode.vacation:
          return derogationEndDate.toLocaleString({
            day: 'numeric',
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
            month: 'short',
          })
        case DerogationMode.off:
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

  protected override async control(attrs: PostAttrs): Promise<Partial<Attrs>> {
    if (Object.keys(attrs).length) {
      await this.api.control({ id: this.id, postData: { attrs } })
    }
    return attrs
  }
}
